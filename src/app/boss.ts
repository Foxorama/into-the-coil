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
import { BEAM_BOLT_KIND, CURTAIN_STANCES, RAIN_BOLT_KIND, type BossAttack, type BossPhase, type BossRow, type CurtainStance, type Fall, type Uncoil } from '../content/bosses.ts';
import { BOLT_STEPS } from '../render/scene.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../sim/flight.ts';
import type { Rng } from '../sim/rng.ts';
import type { CueKind } from '../content/cues.ts';
import { type DifficultyRow, crowdFor, fireGapFor } from '../content/difficulty.ts';
import { SHARD_VOLLEY, SHOTS, SHOT_INDEX, type ShotRow } from '../content/shots.ts';

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
 * How far past the camera's trailing edge a beam's far end sits, in world units — 0250. A stroke
 * with a round cap that ended exactly on the edge would show the cap; this puts it off the screen.
 */
const BEAM_TAIL = 4;


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
 * How much of a hit lands on a boss standing in `phase` — 1 everywhere except the window.
 *
 * ⚠️ **A function of the PHASE and nothing else**, so it cannot disagree with the phase the boss is
 * actually fighting in. `src/app/frame.ts` hands it straight to `collideInto` and `blastInto` as
 * their `damageScale`, which is the argument those two already take for exactly this shape of thing —
 * `src/sim/collide.ts` may import `brand` and nothing else and so cannot be told what a boss is.
 */
export function openBy(phase: BossPhase): number {
  // The bared window and the opened bell both take more — 0255; only the first stops throwing.
  const stance = phase.stance;
  return stance.kind === 'bare' || stance.kind === 'open' ? stance.damageScale : 1;
}

/**
 * How far apart a curtain's shots actually stand, in world units, for a stance authoring `gap`.
 *
 * ⚠️ **`gap` is a CEILING on the spacing rather than the spacing**, because the curtain has to span
 * the whole lane and 100 does not divide by every number a hand might pick. Rounding the count up and
 * dividing the lane by it puts a shot exactly on each edge and leaves every hole the same width —
 * where stepping outward by `gap` until the lane runs out leaves a wider one at whichever end the
 * arithmetic stopped on, and a curtain with one wide hole in it is a fan.
 *
 * ⚠️ **Exported so that `tests/level.test.ts` can ask what the spacing IS** rather than restating this
 * arithmetic and then agreeing with itself —
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`. What the guard compares it against is
 * the ship's own radius and the bullet's, which this function has never heard of.
 */
export function curtainSpacing(gap: number): number {
  return ACROSS_SPAN / Math.ceil(ACROSS_SPAN / gap);
}

/**
 * How many curtains a boss at `health` should have thrown by now — the notch it has reached.
 *
 * ⚠️ **A COUNT DERIVED FROM HEALTH, not a timer and not a stored moment** — 0151, on the same terms
 * `phaseFor` is written on. *"Every 10% damage reduction below 50%"* is `from` and `every`; what the
 * caller stores is the last notch it acted on, and the difference between two consecutive answers is
 * the event. Zero above `from`, so a boss that has not been hurt yet has thrown nothing.
 *
 * ⚠️ **`full` is an ARGUMENT for the reason `phaseFor` says**: a difficulty tier scales what the boss
 * starts with, so dividing by the row would put a tougher boss past every notch at once and fire the
 * whole set on the first hit.
 */
export function uncoilsBy(uncoil: Uncoil, health: number, full: number): number {
  if (full <= 0 || uncoil.every <= 0) return 0;
  const fallen = uncoil.from - health / full;
  if (fallen < 0) return 0;
  return Math.floor(fallen / uncoil.every) + 1;
}

/**
 * The uncoil: one row of shots right across the lane with a single hole in it, at `uncoil.at`.
 *
 * ── WHY IT IS THROWN HERE AND NOT BY THE VOLLEY GATE ────────────────────────────────────────────
 *
 * ⚠️ **It is an EVENT keyed to health, not a cadence** — 0151. What it costs a player is a function
 * of how many notches their damage takes it through, which is the same for everybody; a `fireEvery`
 * would bill a base-weapon player three times what it bills one at the design loadout, because a
 * phase is keyed to health and they stand inside it three times as long.
 *
 * ⚠️ **THE HOLE IS IN THE SAME PLACE EVERY TIME, AND THE SHIP'S POSITION IS NOT AN INPUT HERE.** A
 * draft took one and was refused from play: *"a variable hole that spawns close to the ship negates
 * the entire difficulty of the obstacle… there's not really a point in that wall challenge at all."*
 * The row's `at` is the pattern the player learns, and this function cannot see the ship at all —
 * which is what makes *the wall does not move* true by construction rather than by care.
 *
 * ⚠️ **A shot is skipped rather than moved when it falls inside the hole**, exactly as the sower's
 * and the `wall`'s out-of-lane slots are: shifting one to the hole's edge would make the opening
 * narrower than the number authoring it says, which is a hole with a lie in it.
 *
 * ⚠️ **It makes no sound of its own, deliberately.** `src/app/frame.ts` cues `bossShot` beside it,
 * and two cues on one step against `docs/decisions/0104-the-gun-plays-a-figure.md`'s four-voice
 * ceiling would let the cap choose which of them the player hears.
 *
 * ⚠️ **Nothing allocates**, on this file's own terms.
 */
export function throwCurtain(
  boss: Entity,
  uncoil: Uncoil,
  shots: Pool<Entity>,
  bullet: ShotRow,
  /** The bullet's index in `SHOT_KINDS`, carried on every shot so the frame can read its row — 0263. */
  kind: number,
  speed: number,
  scrollPerStep: number,
  /** Where the camera's trailing edge is: a wall along the lane runs from here to the hull — 0252. */
  cameraAlong: number,
  /** How the curtain stands, from `curtainStance` — 0252. `across` is every curtain before it. */
  stance: CurtainStance,
): void {
  const spacing = curtainSpacing(uncoil.gap);
  /*
    ── HOW THE CURTAIN STANDS — 0252 ─────────────────────────────────────────────────────────────

    A line of shots `spacing` apart along its length, with one hole `hole` wide at the same share
    of that length that `at` is of the lane. `across` is the line every curtain was before 0252,
    exactly. `slant` and `backslant` lean it corner to corner — a lane's width of lean, so the
    line is √2 lanes long — and still throw it down the lane, so every row of the lane is swept in
    turn as the leaning line passes; a leaning wall that arrived everywhere at once would have to
    start as far above the lane as it leans, and the across cull is forty units out. `along` lies
    along the lane just over the top edge, from the camera's trailing edge to the hull, and falls
    across it. Nothing allocates, and the `never` arm is what makes the union closed (0016).
  */
  // The line: its foot, its direction per unit of length, and how every shot on it travels.
  let length: number;
  let footAlong: number;
  let footAcross: number;
  let runAlong: number;
  let runAcross: number;
  let velAlong: number;
  let velAcross: number;
  switch (stance) {
    case 'across':
      length = ACROSS_SPAN;
      footAlong = boss.along;
      footAcross = 0;
      runAlong = 0;
      runAcross = 1;
      velAlong = -speed + scrollPerStep;
      velAcross = 0;
      break;
    case 'slant':
      // Across the lane and a lane's width along it: the foot at the hull on the near edge, the
      // head a lane ahead on the far edge; √2 lanes long.
      length = ACROSS_SPAN * Math.SQRT2;
      footAlong = boss.along;
      footAcross = 0;
      runAlong = Math.SQRT1_2;
      runAcross = Math.SQRT1_2;
      velAlong = -speed + scrollPerStep;
      velAcross = 0;
      break;
    case 'backslant':
      // The same lean the other way: the foot at the hull on the far edge.
      length = ACROSS_SPAN * Math.SQRT2;
      footAlong = boss.along;
      footAcross = ACROSS_SPAN;
      runAlong = Math.SQRT1_2;
      runAcross = -Math.SQRT1_2;
      velAlong = -speed + scrollPerStep;
      velAcross = 0;
      break;
    case 'along':
      length = boss.along - cameraAlong;
      footAlong = cameraAlong;
      footAcross = -bullet.radius;
      runAlong = 1;
      runAcross = 0;
      velAlong = scrollPerStep;
      velAcross = speed;
      break;
    default: {
      const never: never = stance;
      return never;
    }
  }
  // Back out of the spacing rather than repeating its `ceil`, so there is one description of how wide
  // a hole this curtain leaves. Across the lane the division is exact up to float noise and the round
  // absorbs that; leaning or along, the line is longer and the last shot lands where its end would.
  const count = Math.round(length / spacing);
  const clear = uncoil.hole / 2;
  // The hole is `at` along the line as `at` is across the lane: the same share of its length.
  const hole = (uncoil.at / ACROSS_SPAN) * length;
  // `<=` so the far edge gets one too: a curtain that stopped short of the lane's end would have a
  // second opening at exactly the place a cornered player is already flying.
  for (let i = 0; i <= count; i++) {
    const s = spacing * i;
    // The authored hole, and the only one.
    if (s > hole - clear && s < hole + clear) continue;
    const shot = shots.spawn();
    // A curtain that will not fit is dropped rather than grown, exactly as `src/sim/pool.ts` says —
    // and the pool is fifteen times a curtain, so this is the rule rather than a case.
    if (shot === null) break;
    reset(shot, footAlong + runAlong * s, footAcross + runAcross * s, bullet, kind);
    shot.velAlong = velAlong;
    shot.velAcross = velAcross;
  }
}

/**
 * How the k-th curtain of a fight stands — 0252: the k-th of `CURTAIN_STANCES`, round and round,
 * for a wall that spins; across the lane for one that does not. The first (`k = 0`) always stands
 * across the lane, whatever the row says.
 */
export function curtainStance(spin: boolean, k: number): CurtainStance {
  if (!spin) return 'across';
  return CURTAIN_STANCES[((k % CURTAIN_STANCES.length) + CURTAIN_STANCES.length) % CURTAIN_STANCES.length]!;
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
  /** The bullet's index in `SHOT_KINDS` — 0263, on `throwCurtain`'s terms. */
  bulletKind: number,
  cameraAlong: number,
  scrollPerStep: number,
  patrolDirection: number,
  /**
   * What the fight sounds like — 0114.
   *
   * ⚠️ **Passed IN, so the step cannot see what it does.**
   * `docs/decisions/0024-the-accessibility-floor-is-settings.md` bans a fixed step from reading
   * whether sound is on, because a step that could read it could branch on it. Handing this file a
   * function to call points the arrow the same way `src/app/frame.ts` already points it.
   */
  // `across` is where it happened — 0127, and the same signature `src/app/frame.ts` passes down.
  onCue: (kind: CueKind, across?: number) => void,
  /** The arc's bolt pool, which the serpent's lightning shares — 0248. */
  bolts: Pool<Entity>,
  /** Where the lightning falls — 0248, its own stream per 0021. */
  rainRng: Rng,
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
  /*
    ── AND THE REAR, WHICH IS THE ONLY THING THAT MOVES A HULL ALONG ITS OWN LANE — 0289 ───────────

    ⚠️ **REPORTED**: *"can we give it more motion, like have it rear back a bit rather than just have
    the head go up and down?"* The bob is a sine ACROSS the lane and nothing else, so a bobbing boss
    traces a line. Phase-locked to that same angle, this makes it an ARC: furthest up-lane as the hull
    crosses the middle of the lane rising, nearest the player as it crosses going the other way.

    ⚠️ **IT IS HERE AND NOT IN THE `move` SWITCH, AND THAT IS THE ARCHITECTURE RATHER THAN TASTE.**
    Every arm of that switch is on `across` and none touches `along` — the note below it says so — and
    what keeps 0061's and 0101's six station assertions meaning what they say is that the station is
    the ONE place a hull's lane position is decided. So a rear is a term of the station, beside the
    drift it is a bigger sibling of, rather than an arm that reaches past the thing it would break.

    ⚠️ **`bobPhase` IS LAST STEP'S, WHICH IS DELIBERATE AND NOT AN OVERSIGHT.** The switch advances it
    after this runs, so the arc trails the bob by a single step at 60Hz. Reading it forward would mean
    either advancing the angle in two places or moving the switch above the station, and the second is
    how the *arms do not touch along* rule gets quietly lost.
  */
  const rear = row.move.kind === 'bob' && row.move.rear > 0 ? row.move.rear * Math.cos(boss.bobPhase) : 0;
  const station = cameraAlong + row.station + drift + rear;
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
        ── AND THE ANGLE IS CARRIED, NOT COMPUTED FROM THE CAMERA — 0268 ───────────────────────────

        ⚠️ **`docs/decisions/0268-the-bob-keeps-its-centre.md`, and it is a bug that shipped.**
        Reported: *"there's also a bug when bosses and minibosses get health reduced and then start
        bouncing up and down, they keep bouncing up and down off screen."* This read
        `cos(cameraAlong × TAU / wavelength)` — the derivative of `amplitude × sin(...)`, which is
        correct only while `wavelength` is CONSTANT. It is not: the line above divides it by the
        phase's `patrolScale`, so it changes every time the health crosses a phase boundary. What is
        integrated is the velocity, so a jump in the cosine's argument silently re-centres the
        oscillation on wherever the hull happened to be, and every later phase adds another offset.
        Driven through all their phases, four of the six bobbing bosses left the lane — the chorus
        reached 114.8 and the axis −14.2 of a lane that is 0 to 100 — and **there is no `across` cull
        on a boss**, as the `patrol` arm above says, so nothing ever brought them back.

        ⚠️ **`bobPhase` ON THE HULL rather than a second returned value.** This function returns one
        number and a second would mean an object — an allocation, in the frame loop, which 0022 bans
        outright. The field is the one `src/sim/entity.ts` already carries for a pickup's bob; a
        pickup and a boss are different pools and it means the same thing in both, which makes it a
        shared field rather than an overloaded one.

        ⚠️ **Advanced by the SAME rate the velocity is scaled by**, which is the whole of the fix: the
        angle moves by `rate` a step and the hull moves by `amplitude × rate × cos(angle)` a step, so
        the position is `amplitude × sin(angle)` about wherever the fight started it — for any
        sequence of wavelengths, because nothing is recomputed from a camera the wavelength has to
        agree with. `reset` starts it at zero, so a fight opens centred and moving.
      */
      const wavelength = move.wavelength / phase.patrolScale;
      const rate = (TAU * scrollPerStep) / wavelength;
      boss.velAcross = move.amplitude * rate * Math.cos(boss.bobPhase);
      /*
        ⚠️ **AND NOT WHILE THE HULL IS BRACED, WHICH IS THE SAME DEFECT WITH A SECOND CAUSE** — the
        brace below zeroes `velAcross` for a beam (0250), so an angle that went on turning through it
        would come out the far side describing a position the hull never travelled to, and the bob
        would re-centre exactly as a changed wavelength used to. Found by measuring rather than by
        reading: with the wavelength fixed, the hydra — the one bobbing boss with a laser head (0254)
        — still reached 8.6 across against an amplitude of 18 about the lane's middle, which is 23
        units of centre it had no other way to lose. The angle and the hull move together or neither
        moves.
      */
      if (boss.holdFor <= 0) boss.bobPhase += rate;
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

  /*
    ── THE BRACE — 0250 ───────────────────────────────────────────────────────────────────────────

    A beam is fixed across the lane where it was fired (`case 'beam'` below), so a hull that went on
    flying would slide away from its own lasers. `holdFor` is the steps it has left to hold still —
    a field nothing else reads on a boss, on `turnsLeft`'s own terms — and it counts down here, after
    the move has said what the hull would do, because the brace is a thing the hull does on top of
    how it flies rather than a fourth way of flying. The station is still tracked: the beam's root
    follows the hull along the lane (`src/app/frame.ts`), and it is across that must not move.
  */
  if (boss.holdFor > 0) {
    boss.velAcross = 0;
    boss.holdFor--;
  }

  /*
    ── THE ONE PHASE THAT DOES NOT SHOOT ───────────────────────────────────────────────────────────

    ⚠️ **`docs/decisions/0150-the-uncoil-and-the-eye.md`.** Reported from play: *"the bosses need to be
    more interactive with more varied attacks."*
    `reports/the-boss-vocabulary-is-one-fan-2026-08-14.md` names the finisher as the half that word is
    actually asking for — *"a phase that says stop shooting and open"* — and it is the only thing in
    this file that makes a fight end on something other than a health bar reaching zero.

    ⚠️ **THIS LINE IS THE WHOLE OF *it stops shooting*, and the table deliberately does not repeat
    it.** A bare row still carries the fan it would have thrown; zeroing those numbers was the first
    draft, and `scripts/probes/0150-the-uncoil-and-the-eye.mjs` records what it cost — the guard could
    not tell whether the boss was silent because of this return or because the row happened to say
    zero, so removing the return left the suite green. One description, and it is here.

    ⚠️ **It still flies.** `docs/decisions/0061-a-boss-keeps-flying.md` is not suspended for the last
    phase of a fight: a hull that stopped as well as stopped shooting would be a target rather than a
    window, and the phase's own `patrolScale` is what says how much it has left.
  */
  if (phase.stance.kind === 'bare') return direction;

  boss.fireIn--;
  if (boss.fireIn > 0) return direction;
  /*
    ── THE BOSS SHOOTS, AND UNTIL NOW IT DID IT IN SILENCE ────────────────────────────────

    ⚠️ **`docs/decisions/0114-the-fight-is-a-different-piece.md`.** Reported: *"the boss needs an
    appropriate sound for their attacks as well, a loud crashing sound."* It was not a mix problem —
    **there was no sound at all.** Every enemy volley goes through `fireEnemies` in
    `src/app/frame.ts`, which cues `threat`; the boss fires from here and this file emitted nothing,
    so the loudest thing in the game was also the only silent one.

    ⚠️ **ONCE PER VOLLEY AND NOT ONCE PER BULLET**, which is why it is at the gate rather than beside
    the three `spawn()` calls below. A rake puts nine shots out in one step; nine cues would be one
    smeared noise and would spend the whole per-step voice budget
    (`docs/decisions/0104-the-gun-plays-a-figure.md`) on a single event.

    ⚠️ **`onCue` is passed IN and the step cannot see what it does.** 0024's ban is that a fixed step
    must not be able to read whether sound is on — handing it a function to call keeps the arrow
    pointing the same way `src/app/frame.ts` already points it.
  */
  // Where the boss is, which is the one body in the game the player is watching for — 0127.
  onCue('bossShot', boss.across);
  // ⚠️ The tier's gap over the PHASE's, so escalation and difficulty compose rather than compete: a
  // hard tier's opening phase is still slower than its own last one.
  boss.fireIn = fireGapFor(phase.fireEvery, tier);

  // Inside the hull is contact damage's business, and `Math.atan2(0, 0)` is a direction nobody asked
  // for.
  if (ship.along === boss.along && ship.across === boss.across) return direction;
  // The phase's own attack where it names one — 0248: the serpent throws a wall, then a spray, then
  // lightning, and the row's `attack` is the first of those.
  throwAttack(phase.attack ?? row.attack, bullet, bulletKind, boss, row, phase, tier, ship, shots, cameraAlong, scrollPerStep, bolts, rainRng);
  return direction;
}

/**
 * One volley of one attack — every arm of `BossAttack`, and the `never` arm that closes it.
 *
 * ⚠️ **A FUNCTION SINCE 0254, BECAUSE THE HYDRA'S HEADS TAKE TURNS.** The `heads` arm picks one
 * head a volley and throws that head's attack with that head's shot, which is this function called
 * again with a different first two arguments. It was the tail of `stepBoss` until then, and the
 * cut is exactly where the gate ends and the throw begins.
 */
function throwAttack(
  attack: BossAttack,
  bullet: ShotRow,
  kind: number,
  boss: Entity,
  /*
    ⚠️ **THREADED IN FOR `row.muzzle` AND NOTHING ELSE.** A shot used to leave `(boss.along,
    boss.across)`, and the row is the only thing that knows where this hull's face is — which is what
    *"the acid blasts and voids currently originate from the back half of the body"* was reporting.
    It recurses through `heads` below, so a head's shot leaves the same mouth the volley does.
  */
  row: BossRow,
  phase: BossPhase,
  tier: DifficultyRow,
  ship: Entity,
  shots: Pool<Entity>,
  cameraAlong: number,
  scrollPerStep: number,
  bolts: Pool<Entity>,
  rainRng: Rng,
): void {
  const speed = bullet.speed * tier.shotSpeed;
  /*
    ⚠️ **THE MOUTH, OR THE CENTRE WHERE A ROW DOES NOT NAME ONE.** `null` is not a placeholder — a
    gyre throws from its own axis and a jellyfish from its bell, and the centre is where those belong.
    Only a hull with its face at one end has to say so, which today is the serpent alone.

    ⚠️ **`rain` AND `belch` ARE DELIBERATELY UNTOUCHED**: neither leaves the hull. Rain falls from the
    top of the lane and a belch comes off the lane's edge, so a muzzle on the body would move a shot
    that never came from the body.
  */
  const muzzleAlong = boss.along + (row.muzzle?.along ?? 0);
  const muzzleAcross = boss.across + (row.muzzle?.across ?? 0);

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

    ⚠️ **`aimed` WAS THE FIRST CASE HERE — `atan2` to the ship — AND 0258 DELETED THE ARM.** No boss
    aims now; the fan's centre is the lane's or the rake's turn, and `ship` is passed for the stalk
    and the beams alone.
  */
  /*
    ── HOW MANY THIS VOLLEY THROWS, AND IT WAS THE PHASE'S NUMBER EVERYWHERE — 0270 ───────────────

    Two things happen to `phase.shots` before an arm may spend it.

    ⚠️ **THE TIER SCALES IT, WHICH NO TIER COULD DO BEFORE.** `src/content/difficulty.ts` has the
    argument: a table that scaled cadence, toughness and bullet speed but never COUNT left a pattern
    attack — a question about *where is the gap* rather than *how long have I got* (0110) — identical
    for a Legendary Pilot and for the tier named for ending runs.

    ⚠️ **AND A SHATTERING SHOT IS COUNTED IN SHARDS**, which is 0263's own rule reaching the row it
    missed. `phase.shots` is ONE number shared by every head of a `heads` round (0254), and four of
    the hydra's five heads throw bullets that are spent by arriving — so the count that is right for
    them is several times too many for the one that opens into twelve flakes apiece.

    ⚠️ **AND THE TIER DOES NOT SCALE THE CEILING, WHICH IS THE ONE PLACE `crowd` IS REFUSED.** It was
    scaled for one measurement and the pool is what said no: at Burn the frost ship's last phase went
    to four shards on a cadence already halved by `fireGap`, and what is alive at once reached
    **150 of 150** — a full pool, where `src/sim/pool.ts` silently drops the next volley and the
    shattering of an add with it (0263). The two multiply: `fireGap` already spends the pool twice
    over on the hardest tier, so a wider volley on top of it is not a harder fight, it is a fight
    where some of the volleys are not thrown. The tier makes a shattering shot harder by sending it
    TWICE AS OFTEN, which is a thing the pool can carry.

    ⚠️ **A `wall` SPENDS THE CEILING A PAIR AT A TIME**, because it is symmetric about the hull: its
    loop counts slots EITHER SIDE (`src/content/enemies.ts`'s convention, stated there), so a ceiling
    of three shards buys one slot each side. Floored at one, or a ceiling under two would author a
    wall with nothing in it.

    ⚠️ **Nothing allocates**, on this file's own terms — four numbers, no array.
  */
  const wanted = crowdFor(phase.shots, tier);
  const ceiling = bullet.fission.length > 0 ? SHARD_VOLLEY : Number.POSITIVE_INFINITY;
  const count = wanted < ceiling ? wanted : ceiling;
  const perSide = Math.max(1, Math.min(wanted, Math.floor(ceiling / 2)));

  const step = count > 1 ? phase.spread / (count - 1) : 0;
  switch (attack.kind) {
    case 'spray':
    case 'rake': {
      let centre = Math.PI;
      if (attack.kind === 'rake') {
        // The turn rides `firePhase` — the field 0110 added for the spinner, and the one description
        // of *where in its turn a body has got to*.
        boss.firePhase += attack.turn;
        centre = Math.PI + boss.firePhase;
      }
      const first = centre - (step * (count - 1)) / 2;
      for (let i = 0; i < count; i++) {
        const shot = shots.spawn();
        // A volley that will not fit is dropped rather than grown, exactly as `src/sim/pool.ts` says.
        if (shot === null) break;
        const angle = first + step * i;
        reset(shot, muzzleAlong, muzzleAcross, bullet, kind);
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
      const around = TAU / count;
      for (let i = 0; i < count; i++) {
        const shot = shots.spawn();
        if (shot === null) break;
        const angle = around * i;
        reset(shot, muzzleAlong, muzzleAcross, bullet, kind);
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
      for (let i = 1; i <= perSide; i++) {
        for (let side = -1; side <= 1; side += 2) {
          // The wall's own spacing rides the muzzle, so a hull with a face throws its wall from it.
          const across = muzzleAcross + side * i * attack.gap;
          if (across < 0 || across > ACROSS_SPAN) continue;
          const shot = shots.spawn();
          if (shot === null) break;
          reset(shot, muzzleAlong, across, bullet, kind);
          shot.velAlong = -speed + scrollPerStep;
          shot.velAcross = 0;
        }
      }
      break;
    }
    case 'rain': {
      /*
        Lightning from the top of the screen — 0248. `shots` columns, each somewhere in the box the
        ship can fly in, each a bolt entity in the arc's own pool: it rides the camera like a link,
        its far end is the whole lane away across, and its life is the warning plus the strike.
        The painter reads `RAIN_BOLT_KIND` and `lifeFor` to draw the warning line and then the
        bolt; `src/app/frame.ts` reads them to hurt the ship on the step the strike lands.

        ⚠️ **THE STRIKE IS NOT A BODY.** A line across the whole lane has no radius; what it has is
        a half-width along the lane, carried on the entity's `radius`, and the frame compares the
        ship's along to it on one step. Nothing goes into `enemyShots`.

        ⚠️ **On its own stream** — 0021. Where a column falls is the most consequential roll a boss
        makes and it must not move a wave by one enemy.
      */
      for (let i = 0; i < count; i++) {
        const bolt = bolts.spawn();
        if (bolt === null) break;
        const along = cameraAlong + rainRng.range(PLAYER_ALONG_MARGIN, PLAYER_LEAD);
        reset(bolt, along, 0, bullet, RAIN_BOLT_KIND);
        bolt.velAlong = scrollPerStep;
        bolt.fromAlong = 0;
        bolt.fromAcross = ACROSS_SPAN;
        bolt.radius = attack.halfWidth;
        bolt.damage = bullet.damage;
        bolt.lifeFor = attack.warning + BOLT_STEPS;
        bolt.spin = rainRng.int(0, 0x7fffffff);
      }
      break;
    }
    case 'whip': {
      /*
        A whip of fire — 0249: the phase's shots along an arc centred down the lane, the tip
        `reach` times faster than the root. Every flame leaves the hull on the same step; what
        makes it a lash rather than a fan is that the line of them bows as it flies, because the
        far end outruns the near one.
      */
      const n = count;
      const first = Math.PI - attack.sweep / 2;
      const along = n > 1 ? attack.sweep / (n - 1) : 0;
      for (let i = 0; i < n; i++) {
        const shot = shots.spawn();
        if (shot === null) break;
        const angle = first + along * i;
        const lash = speed * (1 + attack.reach * (n > 1 ? i / (n - 1) : 0));
        reset(shot, muzzleAlong, muzzleAcross, bullet, kind);
        shot.velAlong = Math.cos(angle) * lash + scrollPerStep;
        shot.velAcross = Math.sin(angle) * lash;
      }
      break;
    }
    case 'summon': {
      /*
        A summons — 0249. This file has no enemy pool and no rows, so the volley is an ASK: the
        count rides the boss's own `turnsLeft` — a field nothing else reads on a boss — and
        `src/app/frame.ts` puts the adds on the field on the same step and clears it. The cue at
        the gate above is the call.
      */
      boss.turnsLeft = attack.count;
      break;
    }
    case 'beam': {
      /*
        Lasers — 0250. One bolt per root in `from`: its point is the far end, at the trailing edge
        of the screen and riding the camera; `fromAlong` reaches back up the lane to the hull, and
        `src/app/frame.ts` re-pins it there every step as the hull drifts. Its `across` is the
        hull's plus the root's offset, fixed for as long as it is held — the brace above is what
        keeps the hull on it. The painter reads `BEAM_BOLT_KIND`, `holdFor` and `lifeFor` for the
        warning line and then the beam; the frame reads them to hurt a ship inside it on any step
        it is held.

        ⚠️ **THE FLIGHT BETWEEN BEAMS IS ON TOP OF THE BEAM.** The gate above has just set `fireIn`
        to the phase's cadence; the beam's own steps are added, so `fireEvery` is how long the hull
        flies between one volley's end and the next. Without this a phase whose beam outlasts its
        cadence is a hull that never moves again, and a phase table cannot say that honestly.
      */
      const held = attack.warning + attack.hold;
      boss.holdFor = held;
      boss.fireIn += held;
      for (let i = 0; i < attack.from.length; i++) {
        const bolt = bolts.spawn();
        if (bolt === null) break;
        const end = cameraAlong - BEAM_TAIL;
        reset(bolt, end, boss.across + attack.from[i]!, bullet, BEAM_BOLT_KIND);
        bolt.velAlong = scrollPerStep;
        bolt.fromAlong = boss.along - end;
        bolt.fromAcross = 0;
        bolt.radius = attack.halfWidth;
        bolt.damage = bullet.damage;
        bolt.holdFor = attack.hold;
        bolt.lifeFor = held;
      }
      break;
    }
    case 'heads': {
      /*
        The hydra's heads — 0254. One head a volley, round and round: the k-th volley of the fight
        is the k-th head's attack with the k-th head's shot. A head's attack is thrown by this
        function again, on that head's terms; the type refuses a head that is itself heads or a rake,
        so the recursion is one deep.

        ⚠️ **THE COUNT IS `headAt`, AND IT RODE `firePhase` UNTIL 0261 CRASHED ON IT.** That field is
        an ANGLE for a rake and a COUNT here, and 0254's *"`firePhase` has one reader"* is true of a
        HEAD and false of a BOSS: the serpent rakes in its opening phase and grows heads in its other
        two, so the rake left the count at 5.4 and `heads[5.4 % 2]` is `heads[1.4]` is `undefined`.
        `src/sim/entity.ts` carries the whole of it.
      */
      const n = attack.heads.length;
      const head = attack.heads[((boss.headAt % n) + n) % n]!;
      boss.headAt++;
      throwAttack(head.attack, SHOTS[head.shot], SHOT_INDEX[head.shot], boss, row, phase, tier, ship, shots, cameraAlong, scrollPerStep, bolts, rainRng);
      break;
    }
    default: {
      const never: never = attack;
      return never;
    }
  }
}

/**
 * A belch — `docs/decisions/0251-the-volcanoes-belch.md`: the row's `fall`, thrown once. `count`
 * of the fall's shot at the top edge of the lane, each somewhere along the box the ship can fly in,
 * falling straight across it at `speed` and riding the camera along it. Into the enemy's own pool,
 * so a rock hurts as any shot hurts and is shot down as any shot is.
 *
 * ⚠️ **It retires on its own life, not on the cull.** A body riding the camera never reaches the
 * along cull, and there is no across cull; a rock that had fallen through the bottom of the lane
 * would go on falling under the screen for ever, one pool slot each. Its life is the lane plus its
 * own width at its own speed, and a step over.
 *
 * ⚠️ **On its own stream** — 0021, the rain's argument again: where a rock falls must not move a
 * wave by one enemy.
 */
export function belch(
  fall: Fall,
  shots: Pool<Entity>,
  rock: ShotRow,
  /** The rock's index in `SHOT_KINDS` — 0263, on `throwCurtain`'s terms. */
  kind: number,
  speed: number,
  cameraAlong: number,
  scrollPerStep: number,
  rockRng: Rng,
): void {
  for (let i = 0; i < fall.count; i++) {
    const shot = shots.spawn();
    if (shot === null) break;
    const along = cameraAlong + rockRng.range(PLAYER_ALONG_MARGIN, PLAYER_LEAD);
    reset(shot, along, -rock.radius, rock, kind);
    shot.velAlong = scrollPerStep;
    shot.velAcross = speed;
    shot.lifeFor = Math.ceil((ACROSS_SPAN + 2 * rock.radius) / speed) + 1;
  }
}
