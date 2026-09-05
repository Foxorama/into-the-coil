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
export const WEAPON_KINDS = ['pulse', 'arc', 'shuriken'] as const;

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
 *   **orbit**     a body spawned into `playerShots` that circles the SHIP in a widening spiral for
 *                 `orbit` steps and is spent by its own clock rather than by arriving — it lands on
 *                 everything it crosses, once per impact flash. 0234
 */
export type FlightKind = 'straight' | 'chain' | 'orbit';

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
   * How far a bolt can jump, in world units, one entry per rung — from the nose to the first target
   * and from each target to the next. Zeros for a weapon that does not chain.
   *
   * ⚠️ **In the lane's own units and well under the view**, because a bolt that reached the leading
   * edge would be a gun that never has to aim. It is the whole of what makes the arc a different
   * weapon rather than a better one: the pulse reaches the edge of the screen and can miss; the arc
   * cannot miss and cannot reach.
   *
   * ⚠️ **A LADDER SINCE 0236, AND IT WAS ONE NUMBER.** Reported from the first play-test: *"the
   * reach of the lightning needs to be extended by about 20% per power up tier, the chain is good,
   * but the initial hit requires you to be way too close to bosses and enemies. you can't
   * effectively dodge."* Each rung reaches a fifth further than the one before, held by
   * `tests/weapons.test.ts` as *climbs at every rung* rather than as the fraction.
   */
  reach: readonly number[];
  /**
   * Steps an `orbit` shot takes to spiral out to the lane's half-width, one entry per rung — how
   * tightly the spiral is wound. Zeros for a weapon whose shots are spent by arriving.
   *
   * ⚠️ **A LADDER, because it is the thing an upgrade buys** — *"upgrades make the shuriken's arc
   * last longer, so it ends up with a bigger spiral."* Since 0237 every spiral ends at the edge of
   * the screen, so what a rung buys is turns before it gets there: more steps to the half-width is
   * a slower opening, and a slower opening is more of a turn per unit out and a longer arc swept.
   * The row says how long; the screen says how wide. Until 0237 this was a clock that spent the
   * blade wherever it was, and the spiral's width was the shot's speed times it.
   */
  orbit: readonly number[];
  /**
   * Radians an `orbit` shot turns about the ship per step. Zero for every other flight.
   *
   * ⚠️ **In the camera's frame, like every speed** — the ship flies in it and the shot circles the
   * ship. A turn of 0.11 is a revolution every fifty-seven steps, about a second, which is slow
   * enough to read as a thing circling and fast enough that a blade sweeps a body twice.
   */
  turn: number;
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
    reach: [0, 0, 0, 0, 0],
    orbit: [0, 0, 0, 0, 0],
    turn: 0,
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
    // Three links at the cap, not four — 0241: *"1 less max hit."* The last two rungs still buy
    // weight and rate, so every rung changes something.
    links: [1, 2, 3, 3, 3],
    weight: [1, 1, 1, 2, 2],
    // A sixth further at every rung — 0236's ladder, its top cut back a tenth by 0239 and the whole
    // of it a twentieth by 0241: *"still being too strong. 5% reduction on the range."* The cap
    // reaches a shade over half of the narrowest view. `tests/guns-played.test.ts` holds the climb,
    // never the numbers.
    reach: [52, 61, 71, 84, 98],
    orbit: [0, 0, 0, 0, 0],
    turn: 0,
    pickup: SPRITE.pickupArc,
  },
  /**
   * The shuriken launcher — `docs/decisions/0234-a-blade-circles-the-ship.md`. Asked for: *"it fires
   * shurikens that circle around the ship in an increasingly large arc and hits everything that it
   * comes into contact with on that arc. Upgrades make the shuriken's arc last longer, so it ends
   * up with a bigger spiral and increase the shuriken fire rate."*
   *
   * ⚠️ **The slowest cadence in the game and the only shot that is not spent by arriving.** A blade
   * lives until it leaves the screen and lands on everything it crosses, so its worth is the sweep
   * and not the shot: at the cap a blade every quarter-second, each in the air for nearly three
   * seconds — a dozen blades spiralling out from the ship at once. `tests/blades.test.ts` fires the
   * cap for fifteen seconds and holds the pool.
   *
   * ⚠️ **The spiral opens from the ship to the edge of the screen and the blade is gone there** —
   * `docs/decisions/0237-the-blades-answer-the-first-play-test.md`, from the first play: *"spiral
   * outwards from ship to edge of the screen and then disappear like a reverse whirlpool effect."*
   * A gun that guards the ship first and reaches the edge later, which is the opposite of the pulse
   * and the arc and is what makes it a third gun rather than a third shape.
   *
   * ⚠️ **`orbit` is how tightly the spiral is wound**: steps to the lane's half-width. A rung buys a
   * slower opening, which at a fixed `turn` is more turns before the edge, held by
   * `tests/blades.test.ts` as *more* and never as the count.
   *
   * ⚠️ **Wound a quarter tighter by 0239** — *"shurikens need a slightly tighter spiral, there's too
   * much gap at the moment."* The gap is the spiral's pitch: what a blade gains outward in one turn,
   * `(half-width ÷ orbit) × (2π ÷ turn)`. 0239 took the pitch from 40 units at the first rung to
   * 31, and from 15 at the cap to 12.
   *
   * ⚠️ **And rewound by 0240 for a ring that is centred ahead of the ship and stretched along the
   * lane** (`src/app/frame.ts`): the turn is a tenth of a radian, so the rim of a longer ring does
   * not whip, and every rung opens slower again so the pitch stays where 0239 put it — 26 at the
   * first rung, 12 at the cap — and the first rung still goes round the ship once before the edge
   * behind it takes the blade.
   */
  shuriken: {
    label: 'Shuriken',
    hint: 'Blades ring the ship',
    shot: 'shuriken',
    flight: 'orbit',
    fireEvery: [30, 26, 22, 18, 15],
    barrels: [1, 1, 1, 1, 1],
    links: [1, 1, 1, 1, 1],
    weight: [1, 1, 1, 1, 1],
    reach: [0, 0, 0, 0, 0],
    orbit: [120, 150, 185, 220, 260],
    turn: 0.1,
    pickup: SPRITE.pickupShuriken,
  },
};
