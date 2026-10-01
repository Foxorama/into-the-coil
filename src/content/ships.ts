/**
 * What the player flies.
 *
 * ── FOUR SHIPS, ONE PER PILOT — 0441 ─────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0441-a-pilot-flies-their-own-ship.md`. *"Each pilot has their own ship and a
 * weapon will be keyed to that ship only."* The fighter the game always had is Huang-Woo Hook's; the
 * other three are *The Far Carry*'s, drawn from above as that game drew them for its portrait fights.
 * Which golfer flies which ship is on the golfer's row (`src/content/golfers.ts`), because a ship is
 * what is flown and a golfer is who flies it.
 *
 * ⚠️ **What tells them apart is the gun, and that is `docs/game.md`'s cheapest axis** — *every ship
 * must differ on at least one axis the player can feel.* The hurtbox, the speed and the handling are
 * the same for all four, on purpose: the ask fixed the box, and a ship that was also easier to thread
 * would be a second difference nobody asked for.
 *
 * ⚠️ **Auto-fire is on the row and has no trigger, anywhere.** `src/content/actions.ts` says it: there
 * is no `fire` action and there must never be one. The base weapon fires itself; the arsenal is what
 * the player spends.
 */

import type { Body } from '../sim/entity.ts';
import { SPRITE } from './sprites.ts';
import type { WeaponKind } from './weapons.ts';
import type { MissileKind } from './missiles.ts';

/** Every flyable ship. Closed. */
export type ShipKind = 'fighter' | 'caddie' | 'firebird' | 'estate';

export interface ShipRow extends Body {
  /** What the player would call it — the pilot select's line under the golfer. */
  label: string;
  /**
   * The gun this ship flies with, for the whole run — 0441. *"A weapon will be keyed to that ship
   * only."* Nothing changes it: the pickup that once switched guns (0233) buys a special now.
   */
  weapon: WeaponKind;
  /**
   * The tube this ship opens with. The missile pickup still cycles the tubes and still switches
   * them — *"missiles have no change currently"* — so which tube is fitted is the run's
   * (`src/state/slices/run.ts`), and this is what a run begins on.
   */
  missile: MissileKind;
  /**
   * The ship at no tubes, one tube and two, each with its hurt twin — 0441. A missile pickup changes
   * the picture by moving the ship along this, which is how 0081's *every upgrade changes how the ship
   * looks* survives the guns losing their tiers.
   *
   * ⚠️ **A pair per stage, because `stepEntities` derives `sprite` from `spriteBase` AND `spriteHit`
   * every step** (`src/sim/entity.ts`). Handing back only the base would leave a ship with tubes
   * flashing as the bare hull on every hit.
   */
  hulls: readonly [Hull, Hull, Hull];
  /**
   * How far across from the ship's centre its outboard hardpoints stand, in world units — where a
   * coil gun's blades leave from, and where the intro's contrails trail from — 0441.
   *
   * ⚠️ **ON THE ROW, AND IT WAS HALF THE BOX.** `throwBlades` read the hull's extent, which was the
   * blade fins' reach on the one fighter; the Firebird's blades leave its front hubcaps, well inside
   * the box, and a blade that left from the box's edge would leave from the air beside the car. Each
   * ship says where its own are — 0282's *every instance authors its Y*.
   */
  wingtip: number;
}

/** One bake of a ship and its hurt twin. */
export interface Hull {
  base: number;
  hit: number;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const SHIP_KINDS: readonly ShipKind[] = ['fighter', 'caddie', 'firebird', 'estate'];

/**
 * Which hull a ship carrying `launchers` missile tubes is drawn as.
 *
 * ⚠️ **Clamped rather than trusted.** `weaponFor` already caps the launchers, so this can only fire
 * if the two ever disagree — and the failure it prevents is an `undefined` reaching `Entity.sprite`,
 * which is a blit of nothing rather than an error anybody would see.
 */
export function hullFor(ship: ShipRow, launchers: number): Hull {
  const stage = launchers < 0 ? 0 : launchers > 2 ? 2 : Math.floor(launchers);
  return ship.hulls[stage]!;
}

/**
 * The ship a gun is keyed to — 0441: *"a weapon will be keyed to that ship only."* One each, so asking
 * for a gun is asking for its ship; the instruments that fly every gun against a boss fly every ship.
 */
export function shipCarrying(weapon: WeaponKind): ShipKind {
  const found = SHIP_KINDS.find((kind) => SHIPS[kind].weapon === weapon);
  if (found === undefined) throw new Error(`no ship carries the ${weapon}`);
  return found;
}

/**
 * ⚠️ **`health` is 1 on every row, and it was 5.** Asked for after playing the two-level build: *"one
 * hit destroys the ship."* It is still the number of HITS the entity survives, and shields are counted
 * in the same field — a ship carrying two shields has `health` 3 —
 * `docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md`.
 *
 * ⚠️ **`radius` is 2 on every row** — the fighter's hurtbox, which the ask's one box keeps for all
 * four, so no ship is easier to thread than another (0441).
 */
export const SHIPS: Record<ShipKind, ShipRow> = {
  /**
   * Huang-Woo Hook's — the blue fighter the game was built on, and its pulse.
   */
  fighter: {
    label: 'Fighter',
    sprite: SPRITE.fighter,
    spriteHit: SPRITE.fighterHit,
    radius: 2,
    health: 1,
    damage: 0,
    weapon: 'pulse',
    missile: 'straight',
    hulls: [
      { base: SPRITE.fighter, hit: SPRITE.fighterHit },
      { base: SPRITE.fighterTube, hit: SPRITE.fighterTubeHit },
      { base: SPRITE.fighterTubes, hit: SPRITE.fighterTubesHit },
    ],
    // The tips of its wingtip pods: 1.48 of the 7-unit hull's radius (`SHIP_POD_MK3` in the bake).
    wingtip: 4.35,
  },
  /**
   * Feather Fade's — *The Far Carry*'s Little Green Caddie, *"a flying saucer with a 7-iron. They come
   * in peace."* Its ray gun is the one gun no other ship has (0442).
   */
  caddie: {
    label: 'Little Green Caddie',
    sprite: SPRITE.caddie,
    spriteHit: SPRITE.caddieHit,
    radius: 2,
    health: 1,
    damage: 0,
    weapon: 'ray',
    missile: 'straight',
    hulls: [
      { base: SPRITE.caddie, hit: SPRITE.caddieHit },
      { base: SPRITE.caddieTube, hit: SPRITE.caddieTubeHit },
      { base: SPRITE.caddieTubes, hit: SPRITE.caddieTubesHit },
    ],
    // The saucer's rim: the whole of the box's radius.
    wingtip: 3.95,
  },
  /**
   * Backspin Bo's — *The Far Carry*'s Firebird, the black muscle car with the gold phoenix across the
   * hood, and the shuriken launcher.
   */
  firebird: {
    label: 'The Firebird',
    sprite: SPRITE.firebird,
    spriteHit: SPRITE.firebirdHit,
    radius: 2,
    health: 1,
    damage: 0,
    weapon: 'shuriken',
    missile: 'straight',
    hulls: [
      { base: SPRITE.firebird, hit: SPRITE.firebirdHit },
      { base: SPRITE.firebirdTube, hit: SPRITE.firebirdTubeHit },
      { base: SPRITE.firebirdTubes, hit: SPRITE.firebirdTubesHit },
    ],
    // The front hubcaps, which are the shuriken launchers — the blades leave from the wheels.
    wingtip: 2.05,
  },
  /**
   * Longshot Larry's — *The Far Carry*'s Gilded Estate, *"solid-gold trim, fuzzy dice, the works"*,
   * and the lightning.
   */
  estate: {
    label: 'Gilded Estate',
    sprite: SPRITE.estate,
    spriteHit: SPRITE.estateHit,
    radius: 2,
    health: 1,
    damage: 0,
    weapon: 'arc',
    missile: 'straight',
    hulls: [
      { base: SPRITE.estate, hit: SPRITE.estateHit },
      { base: SPRITE.estateTube, hit: SPRITE.estateTubeHit },
      { base: SPRITE.estateTubes, hit: SPRITE.estateTubesHit },
    ],
    // The outside of its tyres, which is as wide as a wagon is.
    wingtip: 2.2,
  },
};

/**
 * The most shields a ship may carry at once.
 *
 * Asked for in the same list as the one-hit hull: *"shields — a pickup, capped at 3."*
 *
 * ⚠️ **A cap rather than an upgrade curve, and the reason is the readout.** The HUD draws one pip
 * per shield and the ship wears one orbiting mark per shield, so an uncapped count is a picture that
 * eventually cannot be read at a glance — which is the whole job of both. Three is what a player can
 * count without counting.
 *
 * ⚠️ **A module constant rather than a column on the ship row**, on the same terms
 * `src/content/ships.ts` keeps one row: a second ship that carried four shields would be a
 * difference the player can feel, and authoring it before there is a second ship is inventing a
 * roster to satisfy a shape. Moving it to the row later changes no caller.
 *
 * ⚠️ **THE CEILING, SINCE 0355, AND NOT THE CAP.** What a pilot may carry is the tier's —
 * `shellCap` on `src/content/difficulty.ts`'s row, three on the gentle two and none on Burn — and this
 * is the most any tier may ask for: the size of the shell pool in `src/app/mount.ts` and the most
 * pips the readout grows. `docs/decisions/0355-a-tier-opens-on-a-shell.md`.
 */
export const MAX_SHIELDS = 3;

/**
 * How far from the ship's centre the deflector shell stands, in world units — the middle of its strip.
 *
 * The ship is 7 units across, so this puts the shell clear of the hull with a visible gap — close
 * enough to read as *worn* rather than as a formation flying alongside. It was the rings' orbit, and
 * it is here rather than in `src/app/frame.ts` since 0430 because the plates are baked round it too.
 */
export const SHIELD_ORBIT = 5.6;

/**
 * Where a plate of the deflector shell may stand, in radians from the nose, and its three shimmer
 * frames — `docs/decisions/0430-the-readout-counts-ships-and-shields.md`.
 *
 * ⚠️ **FOUR PLACES, BECAUSE A BITMAP CANNOT TURN.** Each is baked curving round the ship from where it
 * stands, so the shell no longer spins: a deflector is worn facing the fire, and a plate that turned
 * would need a picture for every angle it passed through.
 */
export const SHIELD_PLACES: readonly { readonly angle: number; readonly frames: readonly [number, number, number] }[] = [
  { angle: 0, frames: [SPRITE.shield0a, SPRITE.shield0b, SPRITE.shield0c] },
  { angle: (Math.PI * 2) / 3, frames: [SPRITE.shield120a, SPRITE.shield120b, SPRITE.shield120c] },
  { angle: Math.PI, frames: [SPRITE.shield180a, SPRITE.shield180b, SPRITE.shield180c] },
  { angle: (Math.PI * 4) / 3, frames: [SPRITE.shield240a, SPRITE.shield240b, SPRITE.shield240c] },
];

/**
 * Which places a shell of each size stands on, indexed by how many shields the ship carries.
 *
 * ⚠️ **EVENLY ROUND THE SHIP, AND THE NOSE IS ALWAYS COVERED.** One plate is a forward deflector; two
 * are fore and aft; three are a shell with its gaps at the quarters and one straight behind, where the
 * exhaust burns through it. Even spacing is the rings' own argument — a lone plate at an odd angle
 * reads as a piece fallen off — and the nose is where the fire comes from. So the last plate to go is
 * the fore one: a hit takes the shell from the back.
 */
export const SHIELD_LAYOUT: readonly (readonly number[])[] = [[], [0], [0, 2], [0, 1, 3]];

/**
 * How many shields a ship at this health is carrying — the health above its hull, floored at zero.
 *
 * ⚠️ **THE single description of *shields are health above the hull*, and it is a function because
 * three callers need it.** The readout draws a pip per shield, the shell stands a plate per shield,
 * and the pickup refuses a fourth; `health - 1` written out three times is the shape of
 * second description `src/content/sprites.ts` records the cost of, and it would also silently bake in
 * *the hull is worth exactly one* at every one of those sites.
 */
export function shieldsOf(ship: ShipRow, health: number): number {
  return Math.max(0, health - ship.health);
}

/**
 * The most health a ship may reach on a tier: its hull, plus the full shell that tier lets it carry.
 *
 * ⚠️ **The tier is an argument rather than read off `MAX_SHIELDS`** — 0355. On Burn the full shell is
 * none, so a shield that somehow reached the ship there adds nothing, which is the belt beside the
 * mid-boss withholding it.
 */
export function fullHealthFor(ship: ShipRow, tier: { readonly shellCap: number }): number {
  return ship.health + tier.shellCap;
}

/** The health a life opens with on a tier: its hull, plus the shell that tier opens every life on. */
export function openingHealthFor(ship: ShipRow, tier: { readonly shellOpen: number }): number {
  return ship.health + tier.shellOpen;
}

/**
 * One mark of the shell, as a body.
 *
 * ⚠️ **`radius` is zero and `damage` is zero, and both are stated rather than left to `Body`.** A
 * mark is in no collision pairing at all — `src/app/frame.ts` says why the shell is a picture rather
 * than a hurtbox — and `src/content/debris.ts` writes its own zeros out for the same reason: the
 * belt as well as the braces, because a body that is inert by ACCIDENT stops being inert the first
 * time somebody adds a pairing.
 */
export const SHIELD_MARK: Body = {
  // The fore plate's first frame; `src/app/frame.ts` writes the place and the shimmer every step.
  sprite: SPRITE.shield0a,
  spriteHit: SPRITE.shield0a,
  radius: 0,
  health: 1,
  damage: 0,
};

/**
 * Steps of invulnerability after a hit lands — 0.75s at 60Hz.
 *
 * ⚠️ **Not a comfort setting and not on the assist ladder.** Without it `health` is a count of STEPS
 * rather than of hits: an overlapping volley bills the player sixty times a second and five health is
 * gone in a twelfth of a second, which reads as dying at full health.
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` keeps the ladder closed; this is part
 * of the one game, at the same value for everybody.
 */
export const INVULN_STEPS = 45;
