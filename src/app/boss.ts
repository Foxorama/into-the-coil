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
import { type DifficultyRow, fireGapFor } from '../content/difficulty.ts';
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
 * Two pi, hoisted — the drift is authored as a WAVELENGTH and the sine wants an angular rate.
 *
 * Written out here rather than imported from `src/app/frame.ts`, which has its own: a helper reached
 * for from two hot files is an import edge that exists to save one line, and `fireShip` already makes
 * that argument about the volley fan it shares with this file.
 */
const TAU = Math.PI * 2;

/**
 * How hard the boss pulls itself back onto its station, per step.
 *
 * ── WHY THIS REPLACED A BANG-BANG APPROACH ──────────────────────────────────────────────────────
 *
 * ⚠️ **The station MOVES now** (`docs/decisions/0061-a-boss-keeps-flying.md`), and the old rule was
 * *close at a fixed rate while you are past it, otherwise match the camera exactly*. Against a
 * station that slides back and forth that is a switch flipping every few steps, at a closing rate
 * five times the drift — the boss would jitter rather than fly.
 *
 * So it tracks: the ask is the distance to the station, capped at `APPROACH_PER_STEP`. Far away that
 * saturates and the entrance is exactly the arrival 0040's seven seconds of quiet exist for; near it,
 * the boss eases onto the station and then follows it. The cap is what keeps the entrance slow.
 *
 * 0.03 saturates beyond 15 units, so the last 15 of the arrival are the ease-in — about half a second
 * of settling, which is what makes the arrival read as a thing landing rather than a thing stopping.
 */
const STATION_TRACK = 0.03;

/**
 * The phase for a boss at `health` out of `full`.
 *
 * The ACTIVE phase is the last one whose `upTo` still covers the current fraction, so the table
 * reads from full to empty in the order the fight happens. Returns the first row rather than `null`
 * when nothing matches, which cannot happen while `tests/level.test.ts` holds that the first `upTo`
 * is 1 — and a boss with no phase at all would simply stop fighting, which is the least legible
 * failure available.
 *
 * ⚠️ **`full` is an ARGUMENT and is no longer `row.health`.** A difficulty tier scales what the boss
 * starts with (`docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md`), so
 * dividing by the row would put a tougher boss below every threshold at once — it would open in its
 * final phase and stay there, which looks like a hard fight rather than like a bug.
 *
 * A `full` of zero or less falls back to the row, because a fraction with a zero denominator is a
 * `NaN` that compares false against every `upTo` and silently leaves the boss in phase one.
 */
export function phaseFor(row: BossRow, health: number, full: number = row.health): BossPhase {
  const fraction = health / (full > 0 ? full : row.health);
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
  fullHealth: number,
  tier: DifficultyRow,
  ship: Entity,
  shots: Pool<Entity>,
  bullet: ShotRow,
  cameraAlong: number,
  scrollPerStep: number,
  patrolDirection: number,
): number {
  const phase = phaseFor(row, boss.health, fullHealth);

  /*
    THE STATION, AND IT DRIFTS.

    Reported from play: *"when a boss reaches mid screen, it just goes up/down and there's no longer
    any flowing movement."* `docs/decisions/0061-a-boss-keeps-flying.md`. The station is still a
    distance from the camera — so matching the camera's rate is still standing still on screen — and
    it now slides forward and back along the lane as the camera travels.

    ⚠️ **A function of the CAMERA and not of a step count**, exactly as the weave and the shield shell
    are: a shape in the world can be authored against and a wobble in time cannot, and the fight has
    to be the same fight on a machine dropping frames.
  */
  const drift = row.drift > 0 && row.driftWavelength > 0
    ? row.drift * Math.sin((cameraAlong * TAU) / row.driftWavelength)
    : 0;
  const station = cameraAlong + row.station + drift;
  /*
    Track it: the ask is how far off station the boss is, capped at the approach rate.

    ⚠️ **The cap is the entrance and the tracking is the flight.** Far out, this saturates at exactly
    the old fixed approach — `src/content/levels.ts` leaves seven seconds of quiet in front of a boss
    so that the arrival is something the player watches happen — and near the station it eases in and
    then follows. The bang-bang it replaced would switch state every few steps against a station that
    moves, at five times the drift rate, which is a jitter rather than a flight.
  */
  const pull = (station - boss.along) * STATION_TRACK;
  boss.velAlong =
    scrollPerStep + (pull > APPROACH_PER_STEP ? APPROACH_PER_STEP : pull < -APPROACH_PER_STEP ? -APPROACH_PER_STEP : pull);

  /*
    ── HOW THE HULL FLIES, AND THERE USED TO BE ONE ANSWER ────────────────────────────────────────

    ⚠️ **`docs/decisions/0111-a-boss-has-one-idea.md`.** Reported from play: *"the rest of them either
    had thick or thin bullets and that was the only difference."* Every branch below used to be the
    first one, and `docs/state-of-play.md` had predicted the report in writing: *"one behaviour with
    seven silhouettes on it."*

    ⚠️ **Every arm is on `across` and none touches `along`**, which is what keeps 0061's and 0101's
    six station assertions meaning what they say — `src/content/bosses.ts` has the argument.

    ⚠️ **Nothing allocates**, and the `never` arm is what makes the union closed —
    `docs/decisions/0016-a-hub-enumerates-kinds.md`.
  */
  let direction = patrolDirection;
  const move = row.move;
  switch (move.kind) {
    case 'patrol': {
      /*
        Slide, and reverse at the lane edges.

        ⚠️ The turn is on the HULL's edge rather than its centre, or half the boss leaves the lane —
        and there is no `across` cull, so nothing would ever bring it back.
      */
      if (boss.across - boss.radius <= 0) direction = 1;
      else if (boss.across + boss.radius >= ACROSS_SPAN) direction = -1;
      boss.velAcross = row.patrol * phase.patrolScale * direction;
      break;
    }
    case 'bob': {
      /*
        A sine across the lane, as a function of the CAMERA — the same argument the along-axis drift
        above makes, for the same reason: a shape in the world can be authored against and a wobble in
        time cannot.

        ⚠️ **The VELOCITY is the derivative rather than the position being written**, because the
        renderer interpolates between `prevAcross` and `across` (`src/sim/entity.ts`) and a position
        assigned here would be a teleport every step at high `patrolScale`. `stepEntities` integrates,
        so what this arm owes is a rate.

        ⚠️ **The phase scales the RATE by dividing the wavelength**, so a later phase completes its
        cycle sooner over the same span. Scaling the amplitude instead would push the hull off a lane
        that is a fixed hundred units on every device (0023).
      */
      const wavelength = move.wavelength / phase.patrolScale;
      const rate = (TAU * scrollPerStep) / wavelength;
      boss.velAcross = move.amplitude * rate * Math.cos((cameraAlong * TAU) / wavelength);
      break;
    }
    case 'stalk': {
      /*
        Track the ship's lane, capped at the phase's own rate. The boss half of 0073's `hunt`, and the
        cap is what stops a fast phase snapping onto the player rather than closing on them.
      */
      const want = ship.across - boss.across;
      const cap = row.patrol * phase.patrolScale * (move.agility / row.patrol);
      boss.velAcross = want > cap ? cap : want < -cap ? -cap : want;
      break;
    }
    default: {
      const never: never = move;
      return never;
    }
  }

  boss.fireIn--;
  if (boss.fireIn > 0) return direction;
  // ⚠️ The tier's gap over the PHASE's, so escalation and difficulty compose rather than compete: a
  // hard tier's opening phase is still slower than its own last one.
  boss.fireIn = fireGapFor(phase.fireEvery, tier);

  const dAlong = ship.along - boss.along;
  const dAcross = ship.across - boss.across;
  // Inside the hull is contact damage's business, and `Math.atan2(0, 0)` is a direction nobody asked
  // for.
  if (dAlong === 0 && dAcross === 0) return direction;
  const speed = bullet.speed * tier.shotSpeed;

  /*
    ── WHERE THE VOLLEY POINTS, AND IT USED TO POINT AT THE SHIP ─────────────────────────────────

    ⚠️ **`docs/decisions/0111-a-boss-has-one-idea.md`.** The phase has said how many shots and how
    wide since 0040 — *"a spray attack that increases number of bullets as health goes down"* is
    `phase.shots`, and it was already there. **What was missing is that the fan was centred on the
    ship**, and a spread centred on the player reads as one shot with error bars rather than as a wall
    to move through. The phase still decides the count and the spread; the row decides where it aims.

    ⚠️ **A single shot takes the centre exactly; `spread` is the TOTAL angle across the fan**, so the
    step between neighbours is `spread / (shots - 1)` and the fan is centred by starting half a spread
    back. Unchanged, and written this way so a phase can change the count without restating what the
    spread means.

    ⚠️ **`π` is straight back down the lane**, which is the direction the player is on — the same
    centre `src/app/frame.ts`'s `spray` uses for an enemy, and it is stated in both places rather than
    shared because the two files have no other reason to import from each other.
  */
  const attack = row.attack;
  const step = phase.shots > 1 ? phase.spread / (phase.shots - 1) : 0;
  switch (attack.kind) {
    case 'aimed':
    case 'spray':
    case 'rake': {
      let centre = Math.PI;
      if (attack.kind === 'aimed') centre = Math.atan2(dAcross, dAlong);
      else if (attack.kind === 'rake') {
        // The turn rides `firePhase` — the field 0110 added for the spinner, and the one description
        // of *where in its turn a body has got to*.
        boss.firePhase += attack.turn;
        centre = Math.PI + boss.firePhase;
      }
      const first = centre - (step * (phase.shots - 1)) / 2;
      for (let i = 0; i < phase.shots; i++) {
        const shot = shots.spawn();
        // A volley that will not fit is dropped rather than grown, exactly as `src/sim/pool.ts` says.
        if (shot === null) break;
        const angle = first + step * i;
        reset(shot, boss.along, boss.across, bullet);
        shot.velAlong = Math.cos(angle) * speed + scrollPerStep;
        shot.velAcross = Math.sin(angle) * speed;
      }
      break;
    }
    case 'ring': {
      /*
        The phase's shots, evenly round the whole circle. `spread` is ignored on purpose — a ring's
        width is a full turn by definition, and a phase that widened it would be describing something
        that has no width.
      */
      const around = TAU / phase.shots;
      for (let i = 0; i < phase.shots; i++) {
        const shot = shots.spawn();
        if (shot === null) break;
        const angle = around * i;
        reset(shot, boss.along, boss.across, bullet);
        shot.velAlong = Math.cos(angle) * speed + scrollPerStep;
        shot.velAcross = Math.sin(angle) * speed;
      }
      break;
    }
    case 'wall': {
      /*
        A row of shots straight down the lane with **nothing in the middle**, so the safe place is
        directly in front of the hull. The convention — `shots` is the number either side — is
        `src/content/enemies.ts`'s and is stated there.

        ⚠️ **A slot outside the lane is skipped rather than clamped**, exactly as the sower's is:
        clamping would stack two bullets on the edge into one thicker one, which is a wall with a lie
        in it.
      */
      for (let i = 1; i <= phase.shots; i++) {
        for (let side = -1; side <= 1; side += 2) {
          const across = boss.across + side * i * attack.gap;
          if (across < 0 || across > ACROSS_SPAN) continue;
          const shot = shots.spawn();
          if (shot === null) break;
          reset(shot, boss.along, across, bullet);
          shot.velAlong = -speed + scrollPerStep;
          shot.velAcross = 0;
        }
      }
      break;
    }
    default: {
      const never: never = attack;
      return never;
    }
  }
  return direction;
}
