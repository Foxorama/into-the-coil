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
export const BOSS_KINDS = ['sentinel'] as const;

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
};
