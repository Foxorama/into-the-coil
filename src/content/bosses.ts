/**
 * What waits at the end of a level.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`, and one entry
 * long — `docs/game.md` says **every boss is unique**, which makes this a table that grows one
 * authored row at a time rather than a type that grows parameters.
 *
 * ── THE PHASE MODEL, WHICH IS THE PRODUCT DEFINITION'S ─────────────────────────────────────────
 *
 * `docs/game.md`: *"The Jörmungandr model is the baseline: phases keyed to remaining health, so every
 * arsenal meets every phase, and a heavier loadout shortens the fight without trivialising it."*
 * Keyed to remaining HEALTH and not to elapsed time, and that is the load-bearing half: a player who
 * is doing well arrives at the hard phase sooner, and a player who is struggling is not also being
 * hurried. Nothing about a phase depends on how long the fight has run.
 *
 * ⚠️ **A phase is a change in what the boss DOES, not in what it looks like.** Three silhouettes were
 * the first plan and are rejected in `src/content/sprites.ts` — rate, spread and speed are legible in
 * motion, at full frame rate, and cost no second art pass. The gap that leaves is real and named
 * there: nothing says how much boss is left.
 */

import type { Body } from '../sim/entity.ts';
import type { ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/** Every boss in the game. Closed. */
export const BOSS_KINDS = ['sentinel', 'harrow', 'lattice', 'shoalMother', 'redoubt', 'chorus', 'axis'] as const;

/** Derived from the list, so a boss cannot exist in the union and be missing from the table. */
export type BossKind = (typeof BOSS_KINDS)[number];

export interface BossPhase {
  /**
   * Active while remaining health is at or below this fraction of the row's full `health`.
   *
   * Phases are ordered from full to empty and the ACTIVE one is the last whose `upTo` still covers
   * the current fraction — so the first row's `upTo` must be `1`, or a boss at full health is in no
   * phase at all. `tests/level.test.ts` holds that.
   */
  upTo: number;
  /** Steps between volleys. */
  fireEvery: number;
  /** Shots per volley, spread evenly about the aim. */
  shots: number;
  /** Total angular spread of a volley, in radians. Ignored when `shots` is 1. */
  spread: number;
  /** Multiplier on the row's `patrol`, so a phase can change how fast it slides across the lane. */
  patrolScale: number;
}

export interface BossRow extends Body {
  /**
   * Where it settles, in world units ahead of the camera's trailing edge.
   *
   * ⚠️ **It holds station in the CAMERA's frame**, like everything else the player watches move —
   * `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`. A boss parked in world
   * coordinates would slide off the back of the screen at the scroll rate, which is precisely the
   * bug that made every off-lane enemy shot miss.
   */
  station: number;
  /**
   * How far either side of its station it drifts along the lane, in world units.
   *
   * ── WHY A BOSS NEEDED ONE ───────────────────────────────────────────────────────────────────────
   *
   * Reported from play: *"when a boss reaches mid screen, it just goes up/down and there's no longer
   * any flowing movement."* The scroll never stops — the camera advances every step of the fight —
   * but everything the player can SEE stops moving along it, because the boss holds one distance and
   * nothing else is left on the field. The picture the player gets is a still one with a sprite
   * sliding up and down it. `docs/decisions/0061-a-boss-keeps-flying.md`.
   *
   * ⚠️ **A shape in the world, as a function of the camera** — the same argument
   * `src/content/enemies.ts` makes for the weave and `src/app/frame.ts` makes for the shield shell: a
   * wobble in time cannot be authored against, and a fight that plays differently on a machine
   * dropping frames is not a fight anybody can be asked to learn.
   *
   * ⚠️ **A PHASE DOES NOT SCALE IT, unlike `patrol`.** The forward bound is the NARROWEST view any
   * device gets, and a later phase that swung further would put a quarter of the hull off the screen —
   * on a phone, in the phase the player is least able to afford it. `tests/level.test.ts` holds the
   * bound rather than the value.
   */
  drift: number;
  /** World units of camera per complete drift cycle. Ignored when `drift` is `0`. */
  driftWavelength: number;
  /** World units per step it slides across the lane, before a phase scales it. */
  patrol: number;
  /** What it fires. */
  shot: ShotKind;
  /** Full health to empty. The first entry must cover a full-health boss. */
  phases: readonly BossPhase[];
}

export const BOSSES: Record<BossKind, BossRow> = {
  /**
   * The first thing in the game that is bigger than the lane's patience.
   *
   * ⚠️ **The name claims no biome, and that is deliberate.** `docs/game.md` themes levels on the
   * fourteen *Far Carry* biomes and names none of them here; picking one would mean going to the
   * predecessor for material, which `CLAUDE.md` allows only for a named file and a named reason —
   * *"never browse it for inspiration."* Theming this to a biome is owed with the level roster, and
   * a rename is a one-line table edit.
   *
   * ⚠️ **150 health is a PLAY-TEST NUMBER**, on the same terms as `SHIP_SPEED` and `STARTING_LIVES`.
   * At the base weapon's rate it is roughly half a minute of well-aimed fire, which is a guess about
   * a fight nobody has had yet. Nothing asserts on it.
   */
  sentinel: {
    sprite: SPRITE.boss,
    spriteHit: SPRITE.bossHit,
    radius: 11,
    health: 150,
    damage: 3,
    // Far enough forward that the whole hull is on screen on the narrowest view the clamp allows,
    // and far enough back that the player is not fighting it at the very edge of their reach.
    station: 120,
    /*
      ⚠️ **14, which is the most the narrowest view leaves room for.** `120 + 14 + 11` is 145 against
      a 150-unit view — the whole hull stays on screen on a 3:2 laptop at the forward end of every
      swing. It is also 28 units of travel, which against a 22-unit hull is a body visibly moving
      rather than breathing.
    */
    drift: 14,
    // About six seconds a cycle at the scroll rate. Slower than the patrol, so the two do not beat
    // against each other into a figure the player reads as one rhythm.
    driftWavelength: 220,
    patrol: 0.32,
    shot: 'spit',
    phases: [
      /*
        ⚠️ **The opening phase is deliberately readable.** A single aimed shot every 1.5 seconds is
        slower than a turret, and it is the phase in which the player learns where the boss's hull
        ends — which is the one thing a 26-unit sprite makes genuinely hard to judge.
      */
      { upTo: 1, fireEvery: 90, shots: 1, spread: 0, patrolScale: 1 },
      /*
        Half health: a three-way spread, so a player who has settled into one lane is moved out of
        it. The spread is wide enough that standing still is punished and narrow enough that there is
        always a side to leave towards.
      */
      { upTo: 0.6, fireEvery: 66, shots: 3, spread: 0.5, patrolScale: 1.4 },
      /*
        The last third: five shots, wider, faster, and the hull itself moving at twice its opening
        speed. Every arsenal meets this phase — that is 0040's point — so it has to be survivable
        with the base weapon alone, which is exactly what the first play-test of this build measures.
      */
      { upTo: 0.3, fireEvery: 48, shots: 5, spread: 0.9, patrolScale: 2 },
    ],
  },
  /**
   * Level two's boss, and it is a different fight rather than the same one with bigger numbers.
   *
   * ⚠️ **`docs/game.md`: every boss is unique — its own attacks, its own effects, its own
   * escalation.** What makes this one different is not that it has more health: it **stands closer**,
   * **moves faster than the player can comfortably track**, and opens with a spread rather than
   * earning one. The sentinel teaches a player to find a lane and hold it; this one exists to take
   * that lane away.
   *
   * ⚠️ 220 health and four phases are PLAY-TEST NUMBERS, on the same terms as everything else here.
   * Nothing asserts on them.
   */
  harrow: {
    sprite: SPRITE.boss2,
    spriteHit: SPRITE.boss2Hit,
    radius: 12.5,
    health: 220,
    damage: 3,
    // Closer than the sentinel's 120, which is most of what makes it feel like a different fight:
    // the player has less room in front of them and less warning on everything it throws.
    station: 100,
    /*
      Wider than the sentinel's and it still clears the narrowest view by a comfortable margin —
      `100 + 20 + 12.5` is 132.5 against 150 — because standing closer buys the room the sentinel
      spent on being further out. A bigger swing at a shorter wavelength is the same *takes the lane
      away* this row is built around: it closes on the player and backs off inside four seconds.
    */
    drift: 20,
    driftWavelength: 150,
    patrol: 0.42,
    shot: 'spit',
    phases: [
      // No gentle opening. It starts where the sentinel's second phase ended.
      { upTo: 1, fireEvery: 72, shots: 3, spread: 0.45, patrolScale: 1 },
      { upTo: 0.7, fireEvery: 60, shots: 5, spread: 0.8, patrolScale: 1.3 },
      { upTo: 0.4, fireEvery: 48, shots: 5, spread: 1.15, patrolScale: 1.8 },
      /*
        The last fifth: seven shots across most of a right angle, and a hull crossing the lane at
        two and a half times its opening speed. Every arsenal meets every phase, so this has to be
        survivable with the base weapon alone — which is exactly what `tests/level.test.ts` drives.
      */
      { upTo: 0.2, fireEvery: 40, shots: 7, spread: 1.4, patrolScale: 2.5 },
    ],
  },

  /**
   * Level three's boss, and its fight is the level's own idea turned on the player.
   *
   * ⚠️ **It stands FURTHER OUT than either of the two before it and swings widest.** Level three is
   * about the sides of the lane, so its boss is the one that occupies them: a slow hull at long range
   * crossing almost the whole of its allowance, which makes the safe lane a thing that moves.
   *
   * ⚠️ Every number here is a play-test number, on the same terms as the sentinel's 150. Nothing
   * asserts on one.
   */
  lattice: {
    sprite: SPRITE.boss3,
    spriteHit: SPRITE.boss3Hit,
    radius: 11.5,
    health: 260,
    damage: 3,
    /*
      ⚠️ **The furthest station any hull can have, and the guard is what said where that is.** The
      first draft put it at 130 with a 16-unit drift, which is 130 + 16 + 11.5 = 157.5 against a
      150-unit view — seven and a half units of boss off the narrowest screen at the far end of
      every swing. It was written up as deliberate and measured as wrong, which is exactly why a
      station is not a number anybody gets to pick by feel.
      `docs/decisions/0061-a-boss-keeps-flying.md` holds that assertion.
    */
    station: 122,
    drift: 15,
    driftWavelength: 260,
    patrol: 0.5,
    shot: 'spit',
    phases: [
      // Wide and slow from the start: the shots are the lane-taking, not the hull.
      { upTo: 1, fireEvery: 84, shots: 3, spread: 0.9, patrolScale: 1 },
      { upTo: 0.66, fireEvery: 66, shots: 5, spread: 1.2, patrolScale: 1.3 },
      { upTo: 0.33, fireEvery: 52, shots: 7, spread: 1.5, patrolScale: 1.7 },
    ],
  },
  /**
   * Level four's boss. The level is about speed, so this is the one that moves.
   *
   * ⚠️ **The fastest patrol in the game and the shortest drift wavelength**, which together make a
   * hull that crosses the lane and comes back inside three seconds. It fires little and hits hard:
   * what threatens the player is where it IS, not what leaves it.
   */
  shoalMother: {
    sprite: SPRITE.boss4,
    spriteHit: SPRITE.boss4Hit,
    radius: 13,
    health: 280,
    damage: 3,
    station: 110,
    drift: 18,
    driftWavelength: 120,
    patrol: 0.62,
    shot: 'spit',
    phases: [
      { upTo: 1, fireEvery: 96, shots: 1, spread: 0, patrolScale: 1 },
      { upTo: 0.7, fireEvery: 78, shots: 3, spread: 0.4, patrolScale: 1.5 },
      { upTo: 0.4, fireEvery: 66, shots: 3, spread: 0.7, patrolScale: 2.1 },
      { upTo: 0.15, fireEvery: 58, shots: 5, spread: 0.9, patrolScale: 2.8 },
    ],
  },
  /**
   * Level five's boss. The level is about things that will not go away, and neither will this.
   *
   * ⚠️ **The slowest hull in the game and the heaviest.** It barely patrols; what it does is fire,
   * constantly and widely, from a station close enough that the shots arrive with little warning. The
   * fight is a damage race rather than a dance, which is the opposite reading from level four's.
   */
  redoubt: {
    sprite: SPRITE.boss5,
    spriteHit: SPRITE.boss5Hit,
    radius: 14,
    health: 340,
    damage: 3,
    station: 105,
    drift: 8,
    driftWavelength: 300,
    patrol: 0.16,
    shot: 'spit',
    phases: [
      { upTo: 1, fireEvery: 54, shots: 3, spread: 0.7, patrolScale: 1 },
      { upTo: 0.7, fireEvery: 44, shots: 5, spread: 1, patrolScale: 1.2 },
      { upTo: 0.4, fireEvery: 36, shots: 7, spread: 1.3, patrolScale: 1.4 },
      { upTo: 0.15, fireEvery: 30, shots: 7, spread: 1.6, patrolScale: 1.6 },
    ],
  },
  /**
   * Level six's boss. The level is about there being no gaps, and this is the fight with none.
   *
   * ⚠️ **Five phases, and every one of them changes both halves at once.** The other bosses escalate
   * along one axis at a time; this one moves faster AND fires wider at every step, so there is no
   * stretch of it that rewards the same answer twice.
   */
  chorus: {
    sprite: SPRITE.boss6,
    spriteHit: SPRITE.boss6Hit,
    radius: 12.5,
    health: 320,
    damage: 3,
    station: 115,
    drift: 15,
    driftWavelength: 180,
    patrol: 0.45,
    shot: 'spit',
    phases: [
      { upTo: 1, fireEvery: 70, shots: 3, spread: 0.5, patrolScale: 1 },
      { upTo: 0.8, fireEvery: 62, shots: 3, spread: 0.9, patrolScale: 1.3 },
      { upTo: 0.6, fireEvery: 54, shots: 5, spread: 1.1, patrolScale: 1.6 },
      { upTo: 0.4, fireEvery: 46, shots: 7, spread: 1.3, patrolScale: 2 },
      { upTo: 0.2, fireEvery: 38, shots: 7, spread: 1.6, patrolScale: 2.4 },
    ],
  },
  /**
   * The last boss of the authored run.
   *
   * ⚠️ **It is not the hardest of these by every measure, and that is deliberate.** `redoubt` fires
   * faster and `shoalMother` moves faster; what this one does is refuse to be either — it is the
   * biggest hull, at the closest station, with the longest health bar, and its escalation is the
   * whole of what the run has taught, in order. `docs/game.md` puts a final boss at the end of eight
   * levels; there are seven, so this is the end of what is authored rather than the end of the game.
   */
  axis: {
    sprite: SPRITE.boss7,
    spriteHit: SPRITE.boss7Hit,
    radius: 16,
    health: 420,
    damage: 3,
    // The closest station in the game. `95 + 14 + 16` is 125 against 150 — the hull fills a fifth of
    // the narrowest view, which is what a last boss should cost the player in room.
    station: 95,
    drift: 14,
    driftWavelength: 200,
    patrol: 0.4,
    shot: 'spit',
    phases: [
      { upTo: 1, fireEvery: 66, shots: 3, spread: 0.6, patrolScale: 1 },
      { upTo: 0.8, fireEvery: 56, shots: 5, spread: 0.9, patrolScale: 1.4 },
      { upTo: 0.6, fireEvery: 48, shots: 5, spread: 1.2, patrolScale: 1.8 },
      { upTo: 0.35, fireEvery: 40, shots: 7, spread: 1.5, patrolScale: 2.2 },
      { upTo: 0.15, fireEvery: 34, shots: 7, spread: 1.8, patrolScale: 2.8 },
    ],
  },
};
