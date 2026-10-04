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
import type { Ink } from './palette.ts';
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
  /**
   * Where its gun's shot leaves the hull — `docs/decisions/0448-each-ship-fires-from-its-own-guns.md`.
   * The pulse's fan, the ray's ring and the arc's first link all start here, and a blade starts here and
   * flies out to its strand. Played: *"the firebird and station wagon don't fire weapons from the actual
   * gun on the hood."* It was `MUZZLE_ALONG` on the centreline for every ship, which on a car seen from
   * the side is the middle of its door.
   */
  muzzle: Mount;
  /**
   * Where each missile leaves, with one tube fitted and with two — 0448. The first of a pair still pops
   * to the top of the lane and the second to the bottom (`fireMissiles`), so a pair from two turrets on
   * one roof still opens into the two paths a pair always flew. The cars' are their roof turrets; the
   * fighter's and the saucer's are where 0097 put every ship's.
   */
  tubes: readonly [readonly [], readonly [Mount], readonly [Mount, Mount]];
  /**
   * Its engines: where each flame's root meets the hull — 0448, and it was one `tail` behind the centre.
   * The flame is baked as ONE jet and laid once per nozzle (`stepExhaust`), so the fighter and the saucer
   * burn two and a car burns one, at its pipe, low at its back bumper. Played: *"one thruster is fine for
   * the station wagon and firebird but they need to have one thruster in game as well."* At most
   * `MAX_NOZZLES`, which sizes the exhaust's pool.
   */
  nozzles: readonly Mount[];
  /**
   * Where its pilot drops in, in world units about the ship's centre, as the intro's hangar draws the
   * ship — `docs/decisions/0444-the-intro-is-the-pilots.md`. The saucer is seen side-on there, so its
   * dome stands above its rim; a ship the hangar draws as the fight does is boarded where the fighter's
   * cockpit always was.
   */
  cockpit: Mount;
  /**
   * How big the intro draws it, against the fight's box at the hangar's scale — in the hangar, and out in
   * the chase — 0448. Played: *"the intro movie for the lil caddie has the caddie too big, needs a 20%
   * reduction in the hanger and probably a 40% reduction in the space chase."* A saucer fills its whole
   * box where the fighter's hull is three quarters of it, so at one scale for every ship it stood a head
   * taller than the fighter ever did beside the bar door.
   */
  intro: { readonly hangar: number; readonly outside: number };
  /**
   * How the readout in the top left wears this ship — `docs/decisions/0451-the-readout-wears-the-ship.md`.
   * Asked for: *"we also need to do the hud theme on the top left row of icons in game. Golf-Stars has
   * hud theming for all the spaceships already."* Its ink (the counts, the pips, the glow), the trim its
   * rim runs from into that ink, and the dressing the plate wears — the predecessor's bridges, carried.
   */
  hud: HudTheme;
  /**
   * The deflector shell this ship wears — `docs/decisions/0492-the-shields-wear-the-ship.md`. The
   * readout wore the ship since 0451 and the shell round the hull did not: one honeycomb in the
   * player's ink for all four. What it DOES is not here — the orbit, the places and the layout are
   * one for every ship, so a shield is a shield — only what it looks like.
   */
  shield: ShieldShell;
}

/**
 * How a ship's shell is drawn. Closed, per 0016 — each is a draw in `src/render/bake.ts`.
 *
 *   **honeycomb**  a strip of energy cells with a bright rim: a starfighter's deflector (0430)
 *   **bubble**     a soap film with a light sliding over it: the saucer's, in its ray's lavender
 *   **plumes**     gold-edged black feathers laid along the arc: the Firebird's phoenix
 *   **lattice**    a gilt trellis between two gilt rails, studded where it crosses: the estate's
 */
export type ShieldLook = 'honeycomb' | 'bubble' | 'plumes' | 'lattice';

/**
 * A ship's shell: its look, and a plate's three shimmer frames at each of the four places
 * `SHIELD_ANGLES` names, in that order.
 */
export interface ShieldShell {
  readonly look: ShieldLook;
  readonly places: readonly [ShieldFrames, ShieldFrames, ShieldFrames, ShieldFrames];
}

export type ShieldFrames = readonly [number, number, number];

/**
 * A colour the readout wears: a palette role, moved toward another and lifted or shaded — never a hex,
 * so the high-contrast palette answers it as it answers the hulls (0441).
 */
export interface HudInk {
  readonly from: Ink;
  readonly toward?: Ink;
  readonly by?: number;
  /** Lighter above nought and darker below, as `shade` takes it. */
  readonly lift?: number;
}

/**
 * What the readout's plate is dressed in. Closed, per 0016 — each is a class in `src/app/chrome.ts`.
 *
 *   **bracket**  lit corner brackets: a fighter's gunsight, the studio's own frame
 *   **orbit**    a dashed orbit about the plate and a slow bio-pulse: the saucer's probe deck
 *   **checker**  a chequered flag down its leading end and a carbon weave: a racer's dash
 *   **walnut**   walnut grain, a chrome lip and fuzzy dice: the wagon's woody dash
 */
export type HudMotif = 'bracket' | 'orbit' | 'checker' | 'walnut';

/** Written out rather than derived, so the chrome can take every motif's class off before it puts one on. */
export const HUD_MOTIFS: readonly HudMotif[] = ['bracket', 'orbit', 'checker', 'walnut'];

/**
 * The walnut dash's fuzzy dice — `docs/decisions/0466-the-dice-swing-once.md`. Played on 0461's
 * swing: *"they should start to sway on a forward burst or hard brake, but it should trigger an
 * uninterruptable sway, at the moment they jerk around all over the place because the player is
 * constantly going back and forth."*
 *
 * A lurch is a CROSSING of the ship's speed along the lane, in the camera's frame, as a share of
 * `SHIP_SPEED`: up past `burst` is a burst, and down past `brake` after one is a brake. A stick
 * wagged about the middle crosses neither. One swing runs `swingSeconds` and nothing interrupts it:
 * the frame (`stepJolt`) refuses every lurch until the last swing has settled, and the chrome's
 * animation is this long, so the two are one number here.
 */
export const DICE = {
  burst: 0.6,
  brake: 0.2,
  swingSeconds: 1.8,
} as const;

export interface HudTheme {
  readonly motif: HudMotif;
  readonly ink: HudInk;
  readonly trim: HudInk;
}

/** A point on a ship, in world units about its centre: `along` toward its nose, `across` down the lane. */
export interface Mount {
  readonly along: number;
  readonly across: number;
}

/**
 * Where a gun on the centreline fires from: three units ahead of the centre, clear of the hurtbox. It was
 * `MUZZLE_ALONG` in `src/app/frame.ts` for every ship until 0448.
 */
const NOSE: Mount = { along: 3, across: 0 };

/**
 * 0097's tubes, the fighter's and the saucer's: a single on the top of the hull, a pair top and bottom,
 * at the nose. *"Yes it will look off balance, that's the point when you only have one."*
 */
const SIDE_TUBES: ShipRow['tubes'] = [[], [{ along: 3, across: -1.8 }], [{ along: 3, across: -1.8 }, { along: 3, across: 1.8 }]];

/**
 * The saucer's disc, in its box's radius — 0461; it was the whole of it. Here rather than in the bake
 * because the caddie's row sizes its intro by it: the disc stands in the hangar where the box did.
 */
export const CADDIE_DISC = 0.72;

/** The most engines any ship burns — the size of the exhaust's pool (`src/app/mount.ts`). */
export const MAX_NOZZLES = 2;

/**
 * Where the `index`th missile of a volley from `launchers` tubes leaves, about the ship's centre — 0448.
 * Clamped as `hullFor` is, and for the same reason.
 */
export function tubeOf(ship: ShipRow, launchers: number, index: number): Mount {
  const stage = launchers < 1 ? 1 : launchers > 2 ? 2 : Math.floor(launchers);
  const mounts: readonly Mount[] = stage === 1 ? ship.tubes[1] : ship.tubes[2];
  return mounts[Math.min(index, mounts.length - 1)]!;
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
    // A hair inside its wingtip pods' waist: 1.13 of the 7-unit hull's radius since the pods became
    // cigars (0469, `SHIP_POD_MK3` in the bake); the flared pods reached 1.31, and 1.48 before 0449.
    wingtip: 3.85,
    muzzle: NOSE,
    tubes: SIDE_TUBES,
    // Its two nacelles: 0.78 of the 7-unit hull's radius back, 0.21 of it out (`SHIP_CORE` in the bake).
    nozzles: [
      { along: -2.29, across: -0.62 },
      { along: -2.29, across: 0.62 },
    ],
    // Its canopy, just ahead of the centre — 0411's three hangar units.
    cockpit: { along: 0.7, across: 0 },
    intro: { hangar: 1, outside: 1 },
    // The studio's own readout, violet into cyan (0439), in a gunsight's corners.
    hud: { motif: 'bracket', ink: { from: 'player' }, trim: { from: 'ally' } },
    // The honeycomb deflector the game's shell always was, in the player's own ink — 0430.
    shield: {
      look: 'honeycomb',
      places: [
        [SPRITE.shield0a, SPRITE.shield0b, SPRITE.shield0c],
        [SPRITE.shield120a, SPRITE.shield120b, SPRITE.shield120c],
        [SPRITE.shield180a, SPRITE.shield180b, SPRITE.shield180c],
        [SPRITE.shield240a, SPRITE.shield240b, SPRITE.shield240c],
      ],
    },
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
    /*
      ⚠️ **ITS DISC IS 0.72 OF THE BOX SINCE 0461, AND EVERY MOUNT BELOW MOVED WITH IT.**
      `docs/decisions/0461-the-ships-are-jazzed.md`: the pods hang off its sides now, and a disc the
      box's width with a pod on each side would be a profile half as wide again. `caddieMounts` in the
      bake holds the gun and the pods to these (`tests/mounts.test.ts`).
    */
    // The saucer's rim.
    wingtip: 2.84,
    // The ray gun's orb, at the nose — its front, where the rings leave.
    muzzle: { along: 4.46, across: 0 },
    // The warhead in each pod, hung off its sides: the top one alone, then both.
    tubes: [[], [{ along: 1.18, across: -3.55 }], [{ along: 1.18, across: -3.55 }, { along: 1.18, across: 3.55 }]],
    // Its two drives, on the back of the rim either side of the centreline — the pair it burns in the
    // fight, and since 0450 in the intro's chase too.
    nozzles: [
      { along: -2.84, across: -0.62 },
      { along: -2.84, across: 0.62 },
    ],
    // The middle of its glass dome, seen side-on above the rim (`paintSaucer` in the port's bake).
    cockpit: { along: 0, across: -0.94 },
    /*
      ⚠️ **SMALLER THAN THE SHARED SCALE OUT IN THE CHASE — 0450.** *"Needs a 20% reduction in the hanger
      and probably a 40% reduction in the space chase."* The shared scale (`HANGAR_SCALE`) took every
      ship down by a quarter, which is the hangar's twenty per cent; the chase's forty is this 0.8 on top
      of it. A saucer is a disc the width of its box where every other ship is narrower than its own.

      ⚠️ **OVER `CADDIE_DISC`, SINCE 0461 SHRANK THE DISC IN ITS BOX.** The pods hang off its sides now
      and the disc is 0.72 of the box, so at the box's old factor the saucer came out a third smaller in
      the intro than the fifth asked for. Over the disc, the disc stands where the box did, and the
      shared scale's own fifth (`HANGAR_SCALE`) is the whole of the change.
    */
    intro: { hangar: 1 / CADDIE_DISC, outside: 0.8 / CADDIE_DISC },
    // The saucer's own green, lifted to read as text, and its ray dish's lavender — the probe deck.
    hud: { motif: 'orbit', ink: { from: 'player', toward: 'acid', by: 0.55, lift: 0.2 }, trim: { from: 'ally' } },
    // A soap film in its ray dish’s lavender, a light sliding over it — 0492.
    shield: {
      look: 'bubble',
      places: [
        [SPRITE.shieldBubble0a, SPRITE.shieldBubble0b, SPRITE.shieldBubble0c],
        [SPRITE.shieldBubble120a, SPRITE.shieldBubble120b, SPRITE.shieldBubble120c],
        [SPRITE.shieldBubble180a, SPRITE.shieldBubble180b, SPRITE.shieldBubble180c],
        [SPRITE.shieldBubble240a, SPRITE.shieldBubble240b, SPRITE.shieldBubble240c],
      ],
    },
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
    // How far either side of the nose its helix's two strands open from — the height of the launcher's
    // star above the centreline. Since 0448 the pair leaves the star itself and flies out to here.
    wingtip: 1.13,
    // The launcher on its hood: the steel star's centre (`drawFirebird` in the bake; `CAR_MOUNTS` holds
    // these to the drawing).
    muzzle: { along: 3.08, across: -1.18 },
    // The orange nose of the missile in each roof turret.
    tubes: [[], [{ along: 0.76, across: -1.92 }], [{ along: 0.07, across: -1.92 }, { along: 1.05, across: -1.92 }]],
    // One pipe, low at the back bumper.
    nozzles: [{ along: -4.42, across: 0.47 }],
    // Its greenhouse, seen from the side: under the T-top, above the beltline (`drawFirebird` in the bake).
    cockpit: { along: 0.25, across: -1.1 },
    intro: { hangar: 1, outside: 1 },
    // Its phoenix's gold on its black lacquer, the rim running from its tail lamp's orange.
    hud: { motif: 'checker', ink: { from: 'hazard' }, trim: { from: 'bullet' } },
    // Its phoenix’s feathers: black lacquer read by gold edges, as the car is — 0492.
    shield: {
      look: 'plumes',
      places: [
        [SPRITE.shieldPlume0a, SPRITE.shieldPlume0b, SPRITE.shieldPlume0c],
        [SPRITE.shieldPlume120a, SPRITE.shieldPlume120b, SPRITE.shieldPlume120c],
        [SPRITE.shieldPlume180a, SPRITE.shieldPlume180b, SPRITE.shieldPlume180c],
        [SPRITE.shieldPlume240a, SPRITE.shieldPlume240b, SPRITE.shieldPlume240c],
      ],
    },
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
    // The lightning rod's ball on its bonnet (`drawEstate` in the bake): the arc's first link leaves it.
    muzzle: { along: 3.43, across: -1.18 },
    // The orange nose of the missile in each turret on the roof rack.
    tubes: [[], [{ along: -1.22, across: -2.04 }], [{ along: -2.18, across: -2.04 }, { along: -0.66, across: -2.04 }]],
    // One pipe, under the tailgate.
    nozzles: [{ along: -4.42, across: 0.75 }],
    // Its front glasshouse, seen from the side, behind the pillar (`drawEstate` in the bake).
    cockpit: { along: 0.4, across: -0.7 },
    intro: { hangar: 1, outside: 1 },
    // The gilt, a shade paler to read as text, and the burl of its doors for the rim's dark end.
    hud: { motif: 'walnut', ink: { from: 'hazard', lift: 0.25 }, trim: { from: 'hazard', lift: -0.45 } },
    // A gilt trellis between gilt rails, a stud at every crossing — 0492.
    shield: {
      look: 'lattice',
      places: [
        [SPRITE.shieldLattice0a, SPRITE.shieldLattice0b, SPRITE.shieldLattice0c],
        [SPRITE.shieldLattice120a, SPRITE.shieldLattice120b, SPRITE.shieldLattice120c],
        [SPRITE.shieldLattice180a, SPRITE.shieldLattice180b, SPRITE.shieldLattice180c],
        [SPRITE.shieldLattice240a, SPRITE.shieldLattice240b, SPRITE.shieldLattice240c],
      ],
    },
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
 * Where a plate of the deflector shell may stand, in radians from the nose —
 * `docs/decisions/0430-the-readout-counts-ships-and-shields.md`. A ship's `shield.places` gives each
 * its three shimmer frames, in this order (0492).
 *
 * ⚠️ **FOUR PLACES, BECAUSE A BITMAP CANNOT TURN.** Each is baked curving round the ship from where it
 * stands, so the shell no longer spins: a deflector is worn facing the fire, and a plate that turned
 * would need a picture for every angle it passed through.
 */
export const SHIELD_ANGLES: readonly [number, number, number, number] = [0, (Math.PI * 2) / 3, Math.PI, (Math.PI * 4) / 3];

/**
 * Which ship's shell a plate's sprite belongs to, and where on it — for the bake, which is handed a
 * sprite and draws the plate the row says it is.
 */
export function shieldPlateOf(sprite: number): { readonly ship: ShipRow; readonly place: number; readonly shimmer: number } | null {
  for (const kind of SHIP_KINDS) {
    const places = SHIPS[kind].shield.places;
    for (let place = 0; place < places.length; place++) {
      const shimmer = places[place]!.indexOf(sprite);
      if (shimmer >= 0) return { ship: SHIPS[kind], place, shimmer };
    }
  }
  return null;
}

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
