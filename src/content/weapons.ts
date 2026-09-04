/**
 * The guns — every kind the ship's base weapon can be, and what each tier of it buys.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: `src/app/frame.ts` reads the resolved numbers off `Weapon` and switches on `flight`
 * with a `never` arm, and nothing anywhere switches on a weapon's NAME.
 *
 * ── A WEAPON IS A KIND, AND THE LADDER IS THE KIND'S ────────────────────────────────────────────
 *
 * `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`. Until this table the ship row
 * carried `fireEvery` and `barrels`, on the argument that *a ship is where a weapon's character
 * lives*. That was true while there was one weapon; with two, the character is the weapon's and the
 * ship names which one it starts with. A second ship with a chunkier pulse is a second row HERE,
 * not a retune of `pulse`.
 *
 * ⚠️ **Every ladder is `UPGRADE_TIERS + 1` entries long and every rung changes something** —
 * `docs/game.md`'s rule, held by `tests/weapons.test.ts` for every kind rather than for the two
 * ladders `tests/missiles.test.ts` grew up holding. A rung that buys nothing is a pickup the level
 * handed out that did not land.
 *
 * ⚠️ **Nothing may assert on the VALUES below**, on `src/content/shots.ts`'s terms: they are
 * starting points, and what settles them is a hand on a deployed build. What the tests hold are the
 * relationships that must be true at any value.
 */

import { SPRITE } from './sprites.ts';
import type { ShotKind } from './shots.ts';

/**
 * Every gun. Closed.
 *
 * ⚠️ **`pulse` is first, and the order is the CYCLE ORDER of the weapon pickup** — a face index on a
 * pickup entity is an index into this list, so the title screen's key, the pickup's faces and the
 * run slice all read one order. Moving a kind here moves it everywhere at once, which is the point.
 */
export const WEAPON_KINDS = ['pulse', 'arc'] as const;

/** Derived from the list, so a kind cannot exist in the union and be missing from the table. */
export type WeaponKind = (typeof WEAPON_KINDS)[number];

/**
 * How a kind's shot travels once it has left the ship — the thing the frame switches on.
 *
 * ⚠️ **A closed union and not a flag per behaviour**, because the behaviours are exclusive: a shot
 * is a body in flight OR a bolt resolved on the step it fires, never both. `src/app/frame.ts`
 * dispatches with a `never` arm, so a flight added here fails to compile until the frame says what
 * it does — 0016's fifth defeat, used on purpose.
 *
 *   **straight**  a body spawned into `playerShots` at `speed`, fanned across the barrels
 *   **chain**     hitscan. The step it fires it finds a target in `reach`, lands, and jumps `links`
 *                 times to the next nearest; what the player sees is a bolt, drawn for a few steps
 */
export type FlightKind = 'straight' | 'chain';

export interface WeaponRow {
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
  /** What taking its pickup does, in the fewest words that say it — the title screen's key. */
  hint: string;
  /** The row in `SHOTS` this kind fires: its damage, its size and, for a body in flight, its speed. */
  shot: ShotKind;
  flight: FlightKind;
  /** Sim steps between volleys, one entry per rung. */
  fireEvery: readonly number[];
  /**
   * How many barrels fire at once, one entry per rung. A `chain` weapon has one barrel: a bolt is
   * one thing, and the rungs it climbs are `links` and `weight`.
   */
  barrels: readonly number[];
  /**
   * How many targets a bolt lands on per volley, one entry per rung. Ignored by a `straight` weapon,
   * which is why it is a ladder of ones there rather than absent — a resolved `Weapon` has one shape.
   */
  links: readonly number[];
  /**
   * What one hit is worth as a MULTIPLE of the shot row's damage, one entry per rung.
   *
   * ⚠️ **The pulse's is a ladder of ones, and that is 0082's max-speed nerf kept on purpose** — the
   * pulse buys barrels and rate and its damage never climbs. A bolt buys links and weight instead,
   * because a bolt cannot buy barrels; either way the ceiling is the last rung and the resolved
   * damage is `SHOTS[shot].damage × weight[tier]`, never a number that keeps going.
   */
  weight: readonly number[];
  /**
   * How far a bolt can jump, in world units — from the nose to the first target and from each target
   * to the next. Zero for a weapon that does not chain.
   *
   * ⚠️ **In the lane's own units and well under the view**, because a bolt that reached the leading
   * edge would be a gun that never has to aim. It is the whole of what makes the arc a different
   * weapon rather than a better one: the pulse reaches the edge of the screen and can miss; the arc
   * cannot miss and cannot reach.
   */
  reach: number;
  /** The face the weapon pickup shows when it is offering this kind — an index into the atlas. */
  pickup: number;
}

export const WEAPONS: Record<WeaponKind, WeaponRow> = {
  /**
   * The gun the ship opens with: fast, small, and cheap to survive being wrong about.
   *
   * ⚠️ **These ladders are `SHIPS.proof`'s own, moved here unchanged** — 0233 moved the table, not
   * the numbers. `fireEvery` steps twice and `barrels` steps four times, which
   * `docs/decisions/0159-the-two-clocks-come-apart.md` made a choice rather than a constraint.
   */
  pulse: {
    label: 'Pulse',
    hint: 'Guns up a tier',
    shot: 'pulse',
    flight: 'straight',
    fireEvery: [8, 8, 6, 6, 4],
    barrels: [1, 2, 3, 4, 4],
    links: [1, 1, 1, 1, 1],
    weight: [1, 1, 1, 1, 1],
    reach: 0,
    pickup: SPRITE.pickupWeapon,
  },
  /**
   * Chain lightning. Asked for, 2026-09-05: *"a chain lightning gun, that jumps to more targets and
   * gets more powerful with each upgrade… for single target bosses it needs to arc and bounce and
   * jump around to hit different parts of the boss."*
   *
   * ⚠️ **It cannot miss, so it must be slower and shorter than the pulse** — every rung here fires
   * less often than the pulse's same rung, and `reach` keeps it inside a third of the lane's length.
   * At the cap it lands four bolts of two every eight steps; the pulse at its cap lands four bullets
   * of one every four. Against a single boss the two are close, which is the balance a hand will
   * settle rather than this file.
   *
   * ⚠️ **Tier 1 is what a player gets for SWITCHING to it** — a pickup of a different kind resets the
   * ladder to one rung (`src/state/slices/run.ts`), so the first rung is the one most players meet
   * first and it has to be a gun worth having: two links.
   */
  arc: {
    label: 'Arc',
    hint: 'Chains between foes',
    shot: 'arc',
    flight: 'chain',
    fireEvery: [12, 12, 10, 10, 8],
    barrels: [1, 1, 1, 1, 1],
    links: [1, 2, 3, 4, 4],
    weight: [1, 1, 1, 2, 2],
    reach: 55,
    pickup: SPRITE.pickupArc,
  },
};
