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
 *   **coil**      a body spawned into `playerShots` in a PAIR, one from each wingtip, each going up
 *                 the lane at `speed` and swinging across it in a sine — the two strands of a helix,
 *                 crossing ahead of the nose. Not spent by arriving: it lands on everything it
 *                 crosses, once per impact flash, and is gone at the edge of the screen. 0234, 0244
 */
export type FlightKind = 'straight' | 'chain' | 'coil';

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
   * How far across the lane a `coil` shot swings from its axis, in world units, one entry per rung
   * — the half-width of the helix. Zeros for a weapon whose shots are spent by arriving.
   *
   * ⚠️ **A LADDER, because it is the thing an upgrade buys** — *"upgrades make the shuriken's arc
   * last longer, so it ends up with a bigger spiral."* Since 0242 a blade's reach is the screen's
   * at every rung, so what a rung buys is the swing: a wider band swept ahead of the ship. Before
   * 0242 this was `orbit` — first a clock (0234), then how tightly a spiral about the ship was
   * wound (0237, 0239, 0240); 0242 made it a loop's radius, and 0244 a sine's.
   */
  coil: readonly number[];
  /**
   * Radians a `coil` shot's swing advances per step. Zero for every other flight.
   *
   * ⚠️ **In the camera's frame, like every speed.** A turn of 0.16 is a full swing every thirty-nine
   * steps, two thirds of a second, which at the shot's speed up the lane is a helix with a pitch of
   * thirty-nine units — a little over twice its width at the cap and five times it at the first
   * rung, which is what reads as a helix rather than a zigzag (0244).
   *
   * ⚠️ **AND NOT A DIVISOR OF ANY RUNG'S CADENCE, WHICH THE FIRST PHOTOGRAPH TAUGHT (0242).** Every
   * pair advances at this rate from the same starting phase, so where pair *n+1* is in its swing
   * when pair *n* is at a crest is `turn × fireEvery`. At 0.21 that was exactly a turn at the first
   * rung and exactly half a turn at the cap: every blade on the screen at the same point of its
   * swing, two rows that breathed rather than a helix. At 0.16 the gap is at least a quarter-turn
   * at every rung, so a screen of pairs shows every point of the strand at once.
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
    coil: [0, 0, 0, 0, 0],
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
    coil: [0, 0, 0, 0, 0],
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
   * and not the shot: at the cap a pair of blades every quarter-second, each in the air for two
   * seconds — sixteen blades riding up the lane at once. `tests/blades.test.ts` fires the cap for
   * fifteen seconds and holds the pool.
   *
   * ⚠️ **A HELIX UP THE LANE, SINCE 0244 — NOT A RING ABOUT THE SHIP, AND NOT A CHAIN OF LOOPS.**
   * Four decisions wound a spiral about the ship (0234, 0237, 0239, 0240); the fourth play-test drew
   * a path from the wingtips forward and 0242 read it as a chain of loops; the sixth said what it
   * had meant: *"I want the two wingtips firing to form a helix pattern with the shurikens."* A pair
   * of blades leaves the wingtips, each going up the lane at the shot's `speed` and swinging across
   * it in a sine `coil` wide, the two a half-turn apart so they cross ahead of the nose — the two
   * strands of a helix, the same everywhere on the screen, aimed by where the ship sits across the
   * lane. A wide slow band against the pulse's narrow fast line, which is what makes it a third gun
   * rather than a third shape.
   *
   * ⚠️ **`coil` is the swing's half-width**: a rung buys a wider band. The turn is fixed, so a
   * wider swing is a faster blade across the lane — at the cap a blade crossing the axis covers
   * three units a step across, on top of the row's one up the lane.
   */
  shuriken: {
    label: 'Shuriken',
    hint: 'Blades helix ahead',
    shot: 'shuriken',
    flight: 'coil',
    fireEvery: [30, 26, 22, 18, 15],
    barrels: [1, 1, 1, 1, 1],
    links: [1, 1, 1, 1, 1],
    weight: [1, 1, 1, 1, 1],
    reach: [0, 0, 0, 0, 0],
    coil: [7, 9, 12, 15, 18],
    turn: 0.16,
    pickup: SPRITE.pickupShuriken,
  },
};
