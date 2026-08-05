/**
 * What the thing at the end of a level does, every step.
 *
 * ── WHY IT IS IN `app/` AND NOT IN `sim/` ───────────────────────────────────────────────────────
 *
 * Same reason `src/app/frame.ts` gives for the spawner: `docs/decisions/0015-the-layer-ladder.md`
 * lets `sim/` import `brand` and nothing else, so it can move a body and resolve a contact and
 * cannot look up what a boss *is*. Choosing a phase means reading a row, and reading a row is this
 * layer's job.
 *
 * ── WHY IT IS ITS OWN FILE ──────────────────────────────────────────────────────────────────────
 *
 * `tests/budget.test.ts` keeps a closed list of files that run every frame, and says the value of
 * the list is that adding to it is a deliberate act. This is that act. It could have gone inside
 * `frame.ts`, and the reason it did not is that a boss is the first thing in the game with a state
 * machine in it — the file that IS the frame should stay readable as *what happens every step*,
 * rather than becoming the place every future behaviour lands because it was already open.
 *
 * ⚠️ **Nothing here allocates.** No object is built, no array is walked with a method, no string is
 * formed. Angles are numbers and `Math.cos` returns a number.
 */

import { ACROSS_SPAN } from '../sim/camera.ts';
import { type Entity, reset } from '../sim/entity.ts';
import type { Pool } from '../sim/pool.ts';
import type { BossPhase, BossRow } from '../content/bosses.ts';
import type { ShotRow } from '../content/shots.ts';

/**
 * How fast it closes on its station, in world units per step, on top of the scroll.
 *
 * ⚠️ **Slower than anything else that arrives**, and that is the entrance rather than a number. A
 * boss that snapped to its station would be indistinguishable from one that spawned there, and the
 * seven seconds of quiet `src/content/levels.ts` leaves in front of it exist so that the arrival is
 * something the player watches happen.
 */
const APPROACH_PER_STEP = 0.45;

/**
 * The phase for a boss at `health` out of `full`.
 *
 * The ACTIVE phase is the last one whose `upTo` still covers the current fraction, so the table
 * reads from full to empty in the order the fight happens. Returns the first row rather than `null`
 * when nothing matches, which cannot happen while `tests/level.test.ts` holds that the first `upTo`
 * is 1 — and a boss with no phase at all would simply stop fighting, which is the least legible
 * failure available.
 */
export function phaseFor(row: BossRow, health: number): BossPhase {
  const fraction = health / row.health;
  let active = row.phases[0]!;
  for (let i = 0; i < row.phases.length; i++) {
    const phase = row.phases[i]!;
    if (fraction <= phase.upTo) active = phase;
  }
  return active;
}

/**
 * One step of the boss: close on its station, slide across the lane, and fire the phase's volley.
 *
 * `patrolDirection` is carried by the caller — the boss reverses at the lane edges, and which way it
 * is currently going is state that belongs to the fight rather than to the entity. Returns the
 * direction to carry into the next step.
 *
 * ⚠️ **Everything moves in the CAMERA's frame.** `velAlong` carries `scrollPerStep` as its baseline
 * exactly as the ship's does, and so does every shot it fires —
 * `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md` records what it cost to
 * learn that: a shot aimed in world coordinates arrives where the ship *was*, and only off the lane,
 * so it hides.
 */
export function stepBoss(
  boss: Entity,
  row: BossRow,
  ship: Entity,
  shots: Pool<Entity>,
  bullet: ShotRow,
  cameraAlong: number,
  scrollPerStep: number,
  patrolDirection: number,
): number {
  const phase = phaseFor(row, boss.health);

  // Close on the station, then hold it. Holding is `scrollPerStep` and nothing else: the station is
  // a distance from the camera, so matching the camera's rate IS standing still on screen.
  const station = cameraAlong + row.station;
  boss.velAlong = boss.along > station ? scrollPerStep - APPROACH_PER_STEP : scrollPerStep;

  /*
    Patrol, and reverse at the lane edges.

    ⚠️ The turn is on the HULL's edge rather than its centre, or half the boss leaves the lane — and
    there is no `across` cull, so nothing would ever bring it back.
  */
  let direction = patrolDirection;
  if (boss.across - boss.radius <= 0) direction = 1;
  else if (boss.across + boss.radius >= ACROSS_SPAN) direction = -1;
  boss.velAcross = row.patrol * phase.patrolScale * direction;

  boss.fireIn--;
  if (boss.fireIn > 0) return direction;
  boss.fireIn = phase.fireEvery;

  const dAlong = ship.along - boss.along;
  const dAcross = ship.across - boss.across;
  // Inside the hull is contact damage's business, and `Math.atan2(0, 0)` is a direction nobody asked
  // for.
  if (dAlong === 0 && dAcross === 0) return direction;
  const aim = Math.atan2(dAcross, dAlong);

  /*
    The volley, spread evenly about the aim.

    A single shot takes the aim exactly; `spread` is the TOTAL angle across the fan, so the step
    between neighbours is `spread / (shots - 1)` and the fan is centred by starting half a spread
    back. Written this way so a phase can change the shot count without also having to restate what
    the spread means.
  */
  const step = phase.shots > 1 ? phase.spread / (phase.shots - 1) : 0;
  const first = aim - (step * (phase.shots - 1)) / 2;
  for (let i = 0; i < phase.shots; i++) {
    const shot = shots.spawn();
    // A volley that will not fit is dropped rather than grown, exactly as `src/sim/pool.ts` says.
    if (shot === null) break;
    const angle = first + step * i;
    reset(shot, boss.along, boss.across, bullet);
    shot.velAlong = Math.cos(angle) * bullet.speed + scrollPerStep;
    shot.velAcross = Math.sin(angle) * bullet.speed;
  }
  return direction;
}
