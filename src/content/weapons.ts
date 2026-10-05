/**
 * The guns — every kind the ship's base weapon can be, and what it fires.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: `src/app/frame.ts` reads the resolved numbers off `Weapon` and switches on `flight`
 * with a `never` arm, and nothing anywhere switches on a weapon's NAME.
 *
 * ── A GUN IS THE SHIP'S, AND IT HAS NO LADDER — 0441 ─────────────────────────────────────────────
 *
 * `docs/decisions/0441-a-pilot-flies-their-own-ship.md`. Asked for: *"each pilot has their own ship
 * and a weapon will be keyed to that ship only … each ship will start with max weapons, so we're
 * effectively removing the weapon tier from each default weapon."* From 0233 to 0441 every number
 * below was a five-rung ladder climbed by a weapon pickup, and the pickup cycled between the guns; the
 * pickup buys a special now and the gun is the one `src/content/ships.ts` fits. **Every number here is
 * what its ladder's last rung was**, so a gun flies exactly as it did at its cap — the decision has
 * the table, and the rungs below the cap are in git, not in a field nobody can reach.
 *
 * ⚠️ **Nothing may assert on the VALUES below**, on `src/content/shots.ts`'s terms: they are
 * starting points, and what settles them is a hand on a deployed build. What the tests hold are the
 * relationships that must be true at any value.
 */

import type { ShotKind } from './shots.ts';
import type { SpecialKind } from './specials.ts';
import type { GunView, Mount } from './ships.ts';

/**
 * Every gun. Closed — and since 0441 the order means nothing: no pickup cycles over it.
 */
export const WEAPON_KINDS = ['pulse', 'arc', 'shuriken', 'ray'] as const;

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
 *   **burst**     a body in flight like `straight`, spent by arriving — and where it arrives it goes
 *                 off as the row's `bursts`, a small blast that lands on everything inside it. 0442
 */
export type FlightKind = 'straight' | 'chain' | 'coil' | 'burst';

export interface WeaponRow {
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
  /** What it does, in the fewest words that say it — the pilot select's line under the ship. */
  hint: string;
  /** The row in `SHOTS` this kind fires: its damage, its size and, for a body in flight, its speed. */
  shot: ShotKind;
  flight: FlightKind;
  /** Sim steps between volleys. */
  fireEvery: number;
  /**
   * How many barrels fire at once. A `chain` weapon has one barrel: a bolt is one thing, and what it
   * has instead is `links` and `weight`.
   */
  barrels: number;
  /** How many targets a bolt lands on per volley. One for a weapon that does not chain. */
  links: number;
  /**
   * What one hit is worth as a MULTIPLE of the shot row's damage. The resolved damage is
   * `SHOTS[shot].damage × weight`.
   */
  weight: number;
  /**
   * What a hit on a BOSS is worth, as a multiple of what it is worth on anything else — 0372.
   *
   * ⚠️ **Every row authors it, and only the arc's is not one.** The arc cannot be flown faster: its
   * reach and its landing are the same at sixty units as at forty-five, so the closing-in that pays
   * the pulse and the blade never pays the bolt. `docs/decisions/0372-a-death-keeps-the-ladders.md`
   * has the table.
   */
  bossWeight: number;
  /**
   * Steps between one of this gun's blades landing on a target and the next landing there, however
   * many blades are across it — `docs/decisions/0391-a-target-takes-a-blade-so-often.md` — or absent
   * for a gun whose shots are spent by arriving and so cannot pile up on one body. A boss is one
   * target, hull and body together.
   */
  landGap?: number;
  /**
   * The gun's own special: what a ship fitted with it opens a run with two of — 0441. Since 0441 no
   * pickup overflows into it; the bomb pickup offers every gun's special to every ship.
   */
  special: SpecialKind;
  /**
   * Where its shot leaves its mount when another ship borrows it, from that ship's hardpoint, in world
   * units, in each of the two views a ship is drawn in — 0525. The bake draws the mount to these, so the
   * muzzle a borrowing ship fires from (`fitted`, `src/content/ships.ts`) is the one it shows.
   */
  mount: Readonly<Record<GunView, Mount>>;
  /**
   * What a `burst` shot goes off as where it arrives — a row in `SHOTS`, landed through the blast
   * pairings — or `null` for every other flight. 0442.
   */
  bursts: ShotKind | null;
  /**
   * How far the FIRST hit reaches, in world units — from the nose to the body the bolt lands on.
   * Zero for a weapon that does not chain. What each jump AFTER it reaches is this times `falloff`,
   * again per jump.
   *
   * ⚠️ **AND IT IS THE LENGTH THE PLAYER SEES, SINCE 0302** — a bolt with nothing in front of it
   * draws exactly this, so the gun states its own range on screen every time it fires dry.
   *
   * ⚠️ **In the lane's own units and well under the view**, because a bolt that reached the leading
   * edge would be a gun that never has to aim. It is the whole of what makes the arc a different
   * weapon rather than a better one: the pulse reaches the edge of the screen and can miss; the arc
   * cannot miss and cannot reach.
   */
  reach: number;
  /**
   * What a jump is worth as a share of the jump before it — 0302. Zero for a weapon that does not
   * chain. The first hit gets `reach`; the second `reach × falloff`, the third that times it again.
   *
   * ⚠️ **A CHAIN SPENDS ITSELF, AND THAT IS THE ASK.** Reported: *"the additional jumps should then be
   * based on decreasing distance."* Every link jumping a full reach made a volley a search of the
   * whole screen from wherever the last body happened to be — 0297's auto-pilot.
   */
  falloff: number;
  /**
   * How far across the lane a `coil` shot swings from its axis, in world units — the half-width of
   * the helix. Zero for a weapon whose shots are spent by arriving.
   */
  coil: number;
  /**
   * Radians a `coil` shot's swing advances per step. Zero for every other flight.
   *
   * ⚠️ **In the camera's frame, like every speed.** A turn of 0.21 is a full swing every thirty
   * steps, half a second — a helix with a pitch of thirty units at the shot's speed up the lane.
   *
   * ⚠️ **AND NOT A DIVISOR OF THE CADENCE, WHICH THE FIRST PHOTOGRAPH TAUGHT (0242).** Every pair
   * advances at this rate from the same starting phase, so where pair *n+1* is in its swing when pair
   * *n* is at a crest is `turn × fireEvery`; a whole number of turns there puts every blade on the
   * screen at the same point of its swing — two rows that breathe rather than a helix. At 0.21 over
   * twelve steps the gap is 0.4 of a turn.
   */
  turn: number;
}

export const WEAPONS: Record<WeaponKind, WeaponRow> = {
  /**
   * Huang-Woo Hook's gun on the fighter — 0441: fast, small, and cheap to survive being wrong about.
   *
   * ⚠️ **Four barrels every four steps, which was the cap of 0083's ladder** — and both are budgets
   * rather than tastes: `MAX_BARRELS` and `FASTEST_FIRE` in `src/content/pickups.ts` say why the pool
   * and the impact flash allow no more. The damage never climbed: 0082's max-speed nerf.
   */
  pulse: {
    label: 'Pulse',
    hint: 'Four barrels of auto-fire',
    shot: 'pulse',
    flight: 'straight',
    fireEvery: 4,
    barrels: 4,
    links: 1,
    weight: 1,
    bossWeight: 1,
    special: 'bomb',
    // 0525: twin barrels, their mouths forward of the mount — lying along a nose, or standing on a hood.
    // 1.42 from above and not 1.66: on the saucer's rim the mouths' glow ran 1.6 px past the sprite's box.
    // And 0.95 from the side and not 1.18: the estate's bonnet is far forward, and so were its mouths.
    mount: { top: { along: 1.42, across: 0 }, side: { along: 0.95, across: -0.47 } },
    bursts: null,
    reach: 0,
    falloff: 0,
    coil: 0,
    turn: 0,
  },
  /**
   * Longshot Larry's gun on the gilded estate — chain lightning. Asked for, 2026-09-05: *"a chain
   * lightning gun … for single target bosses it needs to arc and bounce and jump around to hit
   * different parts of the boss."*
   *
   * ⚠️ **It cannot miss, so it is slower and shorter than the pulse** — a volley every eight steps
   * against the pulse's four, and `reach` keeps the first hit well inside the view. Three links at the
   * cap, not four — 0241: *"1 less max hit."*
   */
  arc: {
    label: 'Arc',
    hint: 'Lightning that chains between foes',
    shot: 'arc',
    flight: 'chain',
    fireEvery: 8,
    barrels: 1,
    links: 3,
    /*
      ⚠️ **2.2, AND IT WAS 2 — 0443.** *"Do just slightly more damage."* A tenth, which is what
      *slightly* is beside the first jump's fifth; the boss weight is untouched, so the serpent's own
      weight of one (0372) still holds the arc there.
    */
    weight: 2.2,
    // *"lightning needs to do a bit more damage on bosses, it's currently too slow"* — 0372.
    bossWeight: 1.5,
    // The lightning blast — 0374.
    special: 'storm',
    // 0525: the rod's ball — over the mount from above, at the top of the rod from the side.
    mount: { top: { along: 0.79, across: 0 }, side: { along: 0, across: -1.3 } },
    bursts: null,
    /*
      ── THE FIRST JUMP IS 82, AND IT WAS 68 — 0443 ──────────────────────────────────────────────────

      ⚠️ **0364 ZOOMED THE VIEW OUT BY 1.2 AND THIS DID NOT MOVE.** *"When we zoomed out the screen we
      didn't make the lightning gun proportionally longer and so we accidentally stealth nerfed it."*
      Exactly so: `ACROSS_SPAN` went from 100 to 120 and every speed and station the player watches
      went with it, and the decision never mentions the arc. A reach of 68 drawn at the new scale was
      a bolt a sixth shorter on the screen than the one 0303 settled by playing. So it is 68 × 1.2:
      the length the player played, on the screen they now play on.

      ⚠️ **THE SHAPE IS 0302's AND IS UNTOUCHED.** A jump keeps `falloff` of the one before it, so the
      chain is 82 → 49 → 29.5; the first hit is the one the player aims and the one the zoom cut.

      ⚠️ **AND IT WAS A FIVE-RUNG LADDER UNTIL 0441** — 0236, 0297, 0302 and 0303 each moved it, and
      their reasoning is theirs. A ship opens at the cap now, so the cap is the only rung there is.

      ── AND 90 SINCE 0503, FOR THE SAME REASON A SECOND TIME ───────────────────────────────────────

      ⚠️ **0500 GAVE A DESKTOP A BAR AND FITTED THE WORLD UNDER IT**, so a maximised window sees 263
      units ahead where it saw 241 and draws everything about a tenth smaller. *"Extend the lightning
      gun's reach … as we've made the desktop distance larger."* 82 × 1.1 is 90, on 0443's precedent:
      the bolt the player played, at the screen they play on. The weight is untouched — the ask was
      the reach — so the chain is 90 → 54 → 32.4.
    */
    reach: 90,
    /*
      Three fifths of the jump before it — 0302. A share and not a subtraction, on
      `src/content/pickups.ts`'s own argument: a constant taken off a reach reaches zero and then
      negative, where a fraction approaches a floor.
    */
    falloff: 0.6,
    coil: 0,
    turn: 0,
  },
  /**
   * Backspin Bo's gun on the Firebird — the shuriken launcher,
   * `docs/decisions/0234-a-blade-circles-the-ship.md` and 0244's helix: a pair of blades from the
   * wingtips, each going up the lane and swinging across it, the two a half-turn apart so they cross
   * ahead of the nose.
   *
   * ⚠️ **The slowest cadence in the game and the only shot that is not spent by arriving.** A blade
   * lives until it leaves the screen and lands on everything it crosses, so its worth is the sweep
   * and not the shot: a pair every fifth of a second, each in the air for two seconds.
   * `tests/blades.test.ts` fires it for fifteen seconds and holds the pool.
   */
  shuriken: {
    label: 'Shuriken',
    hint: 'Blades in a helix ahead',
    shot: 'shuriken',
    flight: 'coil',
    // An eighth of the beat: *"shurikens need to be on the beat to fit in with the music."*
    fireEvery: 12,
    barrels: 1,
    links: 1,
    weight: 1,
    bossWeight: 1,
    /*
      ⚠️ **THIRTY LANDINGS A SECOND ON ANY ONE TARGET — 0391.** *"Cap the max number of shuriken hits on
      any one target."* Measured at the cap: the hydra's five heads took 151 a second and the gyre 89,
      which this brings to about what the pulse and the arc do on the same boss.
    */
    landGap: 2,
    // The whirlpool — 0374.
    special: 'whirlpool',
    // 0525: the steel star the blades leave — in the launcher's face, from above or from the side.
    mount: { top: { along: 0.71, across: 0 }, side: { along: 0, across: -0.36 } },
    bursts: null,
    reach: 0,
    falloff: 0,
    /*
      ⚠️ **TWELVE, THE PLAYER'S TWO THIRDS — 0294.** *"They need bounce out from the ship about 2/3rds
      the distance they do now and then have that as the helix path going ahead."* The swing's
      half-width is both of those: how far the blade bounces out and how wide the helix is after.
      `tests/blades.test.ts` holds it clear of every hull's wingtip.
    */
    coil: 12,
    turn: 0.21,
  },
  /**
   * Feather Fade's gun on the little green caddie — the ray gun, 0442. Asked for: *"a ray gun that
   * fires four concentric purple energy rings that explode on impact with a small energy explosion."*
   *
   * ⚠️ **ONE BODY A VOLLEY, DRAWN AS FOUR RINGS ABOUT ONE CENTRE**, and what it does that no other gun
   * does is the burst: a ring is spent where it arrives, and goes off there as `rayBurst`, landing on
   * everything inside a few units — so a ring into a pack hurts the pack, and a ring into a boss lands
   * twice. One barrel straight up the lane, so unlike the pulse's fan it must be aimed.
   *
   * ⚠️ **A TRIPLET EIGHTH — EIGHT STEPS**, the arc's cadence and a third of the beat, so it is on the
   * grid the music's guns are (`fireShip`'s reload). The damage is measured against the other three
   * guns on the bosses, not asked for: `docs/decisions/0442-the-ray-gun.md` has the table.
   */
  ray: {
    label: 'Ray',
    hint: 'Energy rings that burst where they land',
    shot: 'ray',
    flight: 'burst',
    fireEvery: 8,
    // ⚠️ **No rest.** 0442 fired it in fours with a breath, and played it was *"bad and sounds worse,
    // the full autofire felt much better"* — so it is continuous again (0448).
    barrels: 1,
    links: 1,
    weight: 1,
    bossWeight: 1,
    // The nova, on the ward's trigger — 0447. It was the bomb until the nova landed.
    special: 'nova',
    // 0525: the dish's front, where the rings leave — forward of the housing either way.
    // 1.1 from the side and not 1.42, for the estate's far-forward bonnet, as the pulse's is.
    mount: { top: { along: 1.78, across: 0 }, side: { along: 1.1, across: -0.55 } },
    bursts: 'rayBurst',
    reach: 0,
    falloff: 0,
    coil: 0,
    turn: 0,
  },
};
