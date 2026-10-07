/**
 * The intro: the spaceport the chase starts from — what is in it, where it stands, and when each
 * thing in it moves.
 *
 * Asked for 2026-09-29: *"a loading intro animation screen. I think it starts at a spaceport (use
 * the Far Carry's spaceport as inspiration) — one ship looking like the Viper's Coil blasts off into
 * space and then another pilot runs out of the bar and to their own spaceship (the blue in game one)
 * and blasts off into space chasing after the other ship."*
 * `docs/decisions/0411-the-chase-begins-at-the-port.md`.
 *
 * ── THE FAR CARRY'S SPACEPORT, AND WHAT CROSSED ─────────────────────────────────────────────────
 *
 * ⚠️ **Its spaceport is a ROOM, not a field of pads**: the clubhouse aboard the Mothership, a hangar
 * bay open to the stars on one side and *The Parrot's Perch* on the other, a warm lamp over a deck
 * (`C:\Golf-Stars\src\render\storySpaceport.ts`, read for this and for nothing else). What crossed is
 * that shape — hangar, bar, the bay open to space — turned into a side section, because this game
 * has one view and it is the side profile (0031). The bar's neon is a parrot, not its name: the
 * Parrot tends it, and a word on a wall is a word nobody asked for (`docs/game.md`, *Voice*).
 *
 * ⚠️ **The Viper is Venoma Krait**, the Coil's prodigy and the predecessor's recurring rival, and her
 * ship wears the livery the predecessor gave the Coil's own hull — the *Coil Wyrm-Ship*: a dark green
 * body, acid glass and a violet flame. `VIPER` below carries those colours on the row, since they are
 * hers and no ink of this game's palette means them. She is aboard before the picture starts: 0416
 * ran her out of the bar to it, and 0444 took the run out again
 * (`docs/decisions/0444-the-intro-is-the-pilots.md`).
 *
 * ── WORLD UNITS, AND NOTHING IN SCREEN SPACE ────────────────────────────────────────────────────
 *
 * ⚠️ **0023 holds here as it does in a level.** `across` is the fixed 120 of `src/sim/camera.ts`, and
 * `along` is measured from the view's trailing edge. The stage is authored inside the NARROWEST view
 * any device can have (16:9, 213 units along) and a wider screen shows more of the stars past the
 * bay — the room never stretches to fit.
 *
 * ⚠️ **Every time here is in STEPS**, on `src/content/travel.ts`'s terms: the rate is 60Hz and lives
 * a layer up in `src/state/screens.ts`, so the seconds are in the comment beside each number.
 */

import { SHIP_BOX, SPRITE_EXTENT } from './sprites.ts';
import type { KeeperKind } from './keepers.ts';

/**
 * How much bigger a ship is in the hangar than in flight — 0441, as 0450 corrected it.
 *
 * ⚠️ **THE WHOLE BOX IS 30 UNITS, WHICH THE FIGHTER'S BARE HULL WAS.** Before 0441 the hangar baked the
 * bare fighter — 7 units in the fight — at 30. 0441 put every ship in the fight's 9.4-unit box and baked
 * the box at the same 30/7, so the box came out 40 units and every ship a third bigger beside the bar
 * door than the fighter had ever been: played, *"all the player ships are really large in the intro
 * movie."* The fighter fills the box with its pods since it flies its capped kit, and the saucer fills it
 * with its rim, so it is the box that is held to the old size. The fighter's span is now what it was.
 *
 * ⚠️ **AND THEN A FIFTH SMALLER AGAIN — 0461.** Played: *"in the intro movie the player's ships seem
 * large again, they should be about 20% smaller, if it makes them too much smaller than the viper ship
 * it can be a bit smaller as well."* The box is 24 units where it was 30, and the Viper lost a tenth
 * (`PORT_EXTENT.viper`), so she still stands a head taller without the pilot's ship looking a toy.
 */
export const HANGAR_SCALE = 24 / SHIP_BOX;

/** The pilot's ship's box at hangar size — every ship, so each is the size it is in the fight, scaled. */
const HANGAR_SHIP = SHIP_BOX * HANGAR_SCALE;

/** The Viper's box — 0461: it was 40, and lost a tenth when the pilots' ships lost a fifth. */
const VIPER_BOX = 36;

/** Everything the port is drawn from, in the order its atlas holds them. Closed — 0016. */
export const PORT_KINDS = [
  'wall',
  'ceiling',
  'deck',
  'lamp',
  'bar',
  'door',
  'spill',
  'pad',
  'beam',
  'bayTop',
  'bayBottom',
  'field',
  'beacon',
  // The pilot's ship as the hangar sees it, the four frames it tilts through outside, and as the fight
  // sees it — in that order, so a tilt is an index (0444).
  'blueSide',
  'blueTilt0',
  'blueTilt1',
  'blueTilt2',
  'blueTilt3',
  'blue',
  'blueIdle',
  'blueBurn',
  'blueFlare',
  'blueSurge',
  // Its flames as the fight sees it, for the chase once it has tilted over — 0450. The four above are
  // the hangar's.
  'blueTopBurn',
  'blueTopFlare',
  'blueTopSurge',
  'viper',
  'viperIdle',
  'viperBurn',
  'viperFlare',
  'viperSurge',
  'pilotRun0',
  'pilotRun1',
  'pilotRun2',
  'pilotRun3',
  'pilotLeap',
  'station',
  'flash',
  'pool',
  'contrail',
  'veil',
  /*
    0540: a turning rim, at hangar size, for a car on its pad while a tab stands in the port. 0557: one
    for each picture a rim shows in turn (`WHEEL_FRAMES`), baked off the rim the car is fitted with.
  */
  'blueWheel0',
  'blueWheel1',
  'blueWheel2',
  // 0542: Cosmo, and the stall by the pilot's pad they keep their counter at.
  'cosmo',
  'stall',
  // 0550: Unity and their bench on Hangin' Out, MMXXVI and their booth on Paint & Parts, at Cosmo's spot.
  'unity',
  'bench',
  'mmxxvi',
  'booth',
  // 0550: the viewport in the back wall, its frame and its glass — the stars are the sky behind the wall.
  'viewport',
  /*
    0570: the dock the hangar's tabs stand in — the mezzanine's catwalk, a tile of it; the cradle the
    pilot's ship rides on; and the planet hung in the open bay.
  */
  'catwalk',
  'cradle',
  'planet',
  // 0570: the alcove in the back wall each keeper's counter stands in — a shopfront, lit from inside.
  'alcove',
] as const;
/*
  ⚠️ **NO STAR FIELDS OF ITS OWN SINCE 0416**: *"can we make the starfield for the ships cooler, like it
  looks super basic compared to the level 1 starfield and it should kinda lead straight into level 1."*
  The port's atlas carries the game's after its own kinds (`bakePort`), and the sky outside is the
  first level's, drawn by the level's own painter.
*/

export type PortKind = (typeof PORT_KINDS)[number];

/** The index each kind blits at — the order above, written out by derivation so it cannot drift. */
export const PORT_SPRITE = Object.fromEntries(PORT_KINDS.map((kind, i) => [kind, i])) as Record<PortKind, number>;

/**
 * Each sprite's square box, in world units.
 *
 * ⚠️ **The ships are drawn at HANGAR size, not flight size.** The fighter is 7 units in a level and
 * would be a thumbnail beside a bar door; the port bakes the same drawing at 30 so a pilot can run up
 * to it. It is baked at that size rather than blitted up, because a blit up is a blur (0065).
 */
export const PORT_EXTENT: Record<PortKind, number> = {
  wall: 20,
  ceiling: 20,
  deck: 20,
  lamp: 60,
  bar: 64,
  door: 20,
  spill: 36,
  pad: 36,
  beam: 36,
  bayTop: 30,
  bayBottom: 30,
  field: 80,
  beacon: 14,
  // The pilot's ship, in the fight's one box at hangar scale — 0441; it was the fighter's bare hull at 30.
  // Seen side-on and tilting in the same box, so a frame swapped for the next does not change size (0444).
  blueSide: HANGAR_SHIP,
  blueTilt0: HANGAR_SHIP,
  blueTilt1: HANGAR_SHIP,
  blueTilt2: HANGAR_SHIP,
  blueTilt3: HANGAR_SHIP,
  blue: HANGAR_SHIP,
  blueIdle: HANGAR_SHIP * 2,
  blueBurn: HANGAR_SHIP * 2,
  blueFlare: HANGAR_SHIP * 2,
  blueSurge: HANGAR_SHIP * 3,
  blueTopBurn: HANGAR_SHIP * 2,
  blueTopFlare: HANGAR_SHIP * 2,
  blueTopSurge: HANGAR_SHIP * 3,
  // A tenth smaller since 0461, beside a pilot's ship a fifth smaller (`HANGAR_SCALE`); her flames with her.
  viper: VIPER_BOX,
  viperIdle: VIPER_BOX * 2,
  viperBurn: VIPER_BOX * 2,
  viperFlare: VIPER_BOX * 2,
  viperSurge: VIPER_BOX * 3,
  pilotRun0: 16,
  pilotRun1: 16,
  pilotRun2: 16,
  pilotRun3: 16,
  pilotLeap: 16,
  station: 110,
  flash: 40,
  pool: 40,
  contrail: 16,
  veil: 1,
  // 0540: the fight's spinner, at hangar size — baked at it rather than blitted up, on the ships' terms above.
  blueWheel0: SPRITE_EXTENT.spinnerWheel * HANGAR_SCALE,
  blueWheel1: SPRITE_EXTENT.spinnerWheel * HANGAR_SCALE,
  blueWheel2: SPRITE_EXTENT.spinnerWheel * HANGAR_SCALE,
  // 0542: a bust a head taller than the counter, and the stall's square box.
  cosmo: 14,
  stall: 30,
  // 0550: every keeper a bust Cosmo's size, behind a counter in the stall's box — and 0554, Unity whole on
  // their bench, the wrench they lean on in the box with them.
  unity: 14,
  bench: 30,
  mmxxvi: 14,
  booth: 30,
  // 0550: two wall tiles wide and a frame's width over, so the frame laps the wall round the hole.
  viewport: 44,
  // 0570: a catwalk tile, the cradle under a ship's box with its clamps, and the planet — baked small and
  // blitted up (`DOCK.planetGrow`): it is soft by nature, and a whole one at the screen's scale is megabytes.
  catwalk: 20,
  cradle: 44,
  planet: 80,
  alcove: 36,
};

/**
 * ── THE DOCK — 0570 ──────────────────────────────────────────────────────────────────────────────
 *
 * Where the hangar's tabs stand: *"a fun spaceship hangar set against a space backdrop, space for the
 * tradie/merchant stalls to show, the spaceship to show the changes"*. A shorter room than the intro's,
 * open to space on the right with a planet in the bay; a mezzanine along the back wall carrying the three
 * keepers' shopfronts side by side, in the tabs' order; and under it the pilot's ship on a cradle on the
 * deck. Its own numbers, so the intro's room (`STAGE`) is the intro's.
 */
export const DOCK = {
  /** Where the back wall ends and the open bay begins — a multiple of the wall's tile. */
  bay: 160,
  /** The mezzanine's walking surface, across, and how far along it runs. */
  catwalk: 60,
  catwalkFrom: 56,
  catwalkTo: 160,
  /**
   * Each shopfront's centre along the mezzanine, in the tabs' order, and their centre across — standing on
   * the catwalk, with the counter's front down to it (`PORT_EXTENT` of a counter is 30, its foot at +15).
   */
  shops: { unity: 80, mmxxvi: 112, cosmo: 144 } as Record<KeeperKind, number>,
  /** How much the shops and their keepers are drawn down from the size they were baked for the floor. */
  shopScale: 0.78,
  shopAcross: 48.3,
  /** The pilot's ship's centre on its cradle, along, how high it rides, and how much larger than the intro's. */
  ship: 118,
  ride: 87,
  shipGrow: 1.35,
  /** The planet's centre in the bay, and how much it is blitted up. */
  planet: { along: 214, across: 116 },
  planetGrow: 1.7,
  /** The lamps under the truss. */
  lamps: [70, 124] as readonly number[],
} as const;

/**
 * How many times its ship's box a flame's box is.
 *
 * ⚠️ **A FLAME DOES NOT FIT IN ITS SHIP'S BOX, AND IT WAS CUT OFF WHEN IT WAS ASKED TO.** A sprite's
 * frame puts the hull's radius at 0.42 of the box, so the box ends 1.19 radii behind the centre and
 * a burn is longer than that: the first photographs showed every glow sliced down a straight edge.
 * The flames are baked in a box twice as big, at the SAME radius, and blitted at the ship's centre.
 */
export const FLAME_BOX = 2;

/**
 * A surge's box against its ship's — 0416. The surge is the burn at the moment a launch is heard, near
 * twice a flare's length, and it would be cut off in `FLAME_BOX` exactly as the flare was in the ship's.
 */
export const SURGE_BOX = 3;

/**
 * How long a surge takes to die back into the burn, in steps — 0416: *"we also need the jets to
 * supercharge fire when the blast off happens in the movie as well to match the blast off sound they
 * have"*. The `launch` cue (`src/content/cues.ts`) is a 0.3 s thump under a roar that decays over
 * 0.95 s, so the flame that is its twin is at full on the step it sounds and dies back into the burn
 * over the roar's length, on the low roar's own curve (`SURGE_CURVE`), so most of it has gone by the
 * time the thump has and the tail rides the roar.
 */
export const SURGE_STEPS = 57;
export const SURGE_CURVE = 1.8;

/** The Viper's livery — the predecessor's Coil Wyrm-Ship, carried on the row because it is hers. */
export const VIPER = {
  body: '#1c3a2a',
  belly: '#0f2419',
  accent: '#54dba0',
  glass: '#9dffce',
  flame: '#b060c0',
  core: '#f3d2ff',
  eye: '#d8ff5a',
} as const;

/** The warm inks of the room itself — the predecessor's clubhouse, which is not a palette role either. */
export const PORT_INK = {
  wall: '#20293c',
  wallDark: '#121826',
  seam: '#39445c',
  deck: '#2a3346',
  deckDark: '#141a26',
  lamp: '#ffdca0',
  wood: '#8a6034',
  woodLight: '#b9884a',
  woodDark: '#3a2614',
  neon: '#7fe0a0',
  bottle: ['#7fe0a0', '#e8c25a', '#6ab6ff', '#ff6b6b', '#4fd8c8'],
  pad: '#7fd8ff',
  hazard: '#e8c25a',
  alarm: '#ff4040',
} as const;

/*
  ⚠️ **THE PILOT'S COLOURS WERE HERE AS `BO`** — 0412 — and 0415 moved them to
  `src/content/golfers.ts`, because the pilot is whoever was chosen and Bo is one row of four.
*/

/*
  ⚠️ **VENOMA STOOD HERE, A RUNNER ROW OF HER OWN — 0416 — UNTIL 0444 TOOK HER RUN OUT.** *"lets remove
  venoma running from the intro, it doesn't add anything and makes the ending worse when you see the
  villain running with no captive."* With her went her four run frames and her leap, the beats that
  drove them and the three-second wait for her. Her hood and her bag are in git.
*/

/**
 * Where the room's fixed things stand, in world units — along from the view's trailing edge, across
 * from the top.
 */
export const STAGE = {
  /** The deck's top edge: everything that stands, stands on it. */
  deck: 100,
  /** The ceiling's lower edge. */
  ceiling: 16,
  /** The bar's centre, and its doorway's — the door the pilot comes out of. */
  bar: { along: 30, across: 68 },
  doorway: { along: 44, across: 91 },
  /** The two pads, and the height each ship hovers at over its own. */
  bluePad: 94,
  viperPad: 142,
  /** 0568: the pad the hangar's tabs stand the pilot's ship on — the Viper's, by the bay. */
  standPad: 142,
  blueRide: 80,
  viperRide: 84,
  /**
   * The bay's edge: stars past it, and the room's lintel and sill across it. A multiple of the wall's
   * tile, so the back wall ends on a seam — and a third of the narrowest view short of its edge, so
   * every screen sees out.
   */
  bay: 180,
  /** The ceiling lamps, along. */
  lamps: [72, 128] as readonly number[],
  /**
   * Cosmo's stall, on the deck between the bar's door and the pilot's pad — 0542: its centre. Beside the
   * pad, so the shop's camera has the counter and the ship it tries things on in the stand's part of the
   * screen together. Where each keeper stands at it is their own row's (`KeeperRow.at`, 0554).
   */
  // 0568: by the inner pad, clear of the ship, which stands on the outer one now.
  stall: { along: 106, across: 85 },
  /**
   * The viewport in the back wall — 0550: *"can we fit in a starry background to emphasise the space
   * station nature of it?"* The bay is behind the plate on every tab, so the stars were seen only past the
   * plate's edge. The hole is two wall tiles wide and one high, on the tile grid — from `along` two tiles
   * on, and from `across` one tile down — so the wall is drawn round it whole and the sky the room is
   * painted over shows through it. Over the stall and the pad, between the truss and the awning.
   */
  viewport: { along: 60, across: 40 },
  /** The alarm beacons, which turn once the Viper has gone. */
  beacons: [
    [174, 30],
    [104, 24],
  ] as readonly (readonly [number, number])[],
} as const;

/**
 * How the stand's camera is fitted to the column the plate leaves it — 0563: the pad stood this far
 * across the column, the keeper's counter to its left at the column's edge; and the ship's box no wider
 * than this share of the column, the camera drawn back from the row's zoom where it would be.
 */
export const STAND_PAD_AT = 0.46;
export const STAND_SHIP_SHARE = 0.34;
/**
 * 0568: how far past the bay the sky is painted for the stand, in world units — far enough that no
 * screen's edge ever comes before it, where on a phone the plate stands to the right of the column.
 */
export const STAND_SKY = 400;

/**
 * Where a camera stands in the room when a menu stands in it — 0540: the point of the room it is on, in
 * `STAGE`'s units, how much closer than the intro's own picture it is, and where on the screen that
 * point stands, as a share of its width and height. The room is held inside the screen whatever is
 * asked (`standViewInto`), so a share that would show past the room's wall shows the wall instead.
 *
 * ⚠️ **A FIELD ON EACH SCREEN'S ROW AND NEVER A CONSTANT** (0282): the hangar stands on the pad, Paint &
 * Parts closer on it, Cosmo's between the pad and their stall (0542) — `src/state/screens.ts`. A fourth tab authors its own.
 */
export interface StandCamera {
  along: number;
  across: number;
  zoom: number;
  x: number;
  y: number;
}

/**
 * Every moment the intro turns on, in steps from its first frame.
 *
 * ⚠️ **Two shots: the hangar, and the dark outside it.** The hangar is held still, as a stage — the
 * camera does not follow anything in it, and the player watches the room empty. The second shot flies
 * WITH the two ships, so the stars run and the chase is the thing that is still.
 */
export const BEATS = {
  /** The room has faded up out of the backdrop. 0.6 s. */
  fadeIn: 36,
  /**
   * The Viper's engines light at idle, with her already aboard. 1.0 s — ⚠️ **0414's beat again.** 0416
   * put this 186 steps later so she could run to the ship first; 0444 took the run out, and everything
   * after this beat moved back by the same 186 and nothing else about it changed: the chase is the same
   * chase, begun three seconds sooner.
   */
  viperLit: 60,
  /** She lifts off her pad. 1.8 s. */
  viperLift: 108,
  /** Full burn, and she goes — through the bay a second later. 2.5 s. */
  viperGo: 150,
  /** The bay's alarm starts to turn. 3.9 s. */
  alarm: 234,
  /**
   * The bar's door opens. 5.3 s — ⚠️ **a beat later than 0411's**, asked for as *"slightly more
   * delay on the chase"* (0414): the room stands empty with the alarm turning before anyone comes.
   */
  door: 318,
  /** The door is open and the pilot is out. 5.7 s. */
  pilotOut: 342,
  /** The pilot has reached the ship and leaps. 7.7 s. */
  pilotLeap: 462,
  /** The pilot is in. 8.2 s. */
  pilotIn: 492,
  /** The pilot's ship's engines light. 8.5 s. */
  blueLit: 510,
  /** It lifts — a longer spool than hers, 0414's *"slightly slower off the mark"*. 9.1 s. */
  blueLift: 548,
  /** Full burn, and it goes, slower than she did (`BLUE_LAUNCH_ACCEL`). 10.0 s. */
  blueGo: 600,
  /** The hangar has faded into the backdrop, from 11.3 s. 11.7 s. */
  cut: 700,
  /** The dark outside comes up. 12.1 s. */
  outside: 724,
  /** The Viper opens her throttle and leaves the frame. 16.1 s. */
  viperRuns: 964,
  /** The pilot's ship goes after her, further behind than 0411 had it. 17.3 s. */
  blueRuns: 1036,
  /** The picture fades into the backdrop the title is drawn on. 19.3 s. */
  fadeOut: 1156,
  /** The intro is over and the title comes up. 19.9 s. */
  end: 1192,
} as const;

/** How long the intro runs, in steps — the screen's own countdown (`src/state/screens.ts`). */
export const INTRO_STEPS = BEATS.end;

/** How long a fade to or from black takes across the cut, in steps. 0.4 s. */
export const FADE = 24;

/**
 * The least the splash is up for, in steps — `docs/decisions/0415-the-golfer-is-chosen.md`. 1.5 s:
 * long enough to read the name, and about what the load takes (0413), so it rarely waits on either.
 */
export const SPLASH_STEPS = 90;

/**
 * The ships' motion out through the bay, in world units per step squared: a standing start to off the
 * screen in a second and a fifth. Solved from the widest view, so it is off every screen in time.
 */
export const LAUNCH_ACCEL = 0.068;

/**
 * The fighter's, which is slower off the mark than hers — 0414. Still through the bay before the
 * hangar fades, which `tests/intro.test.ts` holds in pixels.
 */
export const BLUE_LAUNCH_ACCEL = 0.05;

/** How far a ship lifts off its pad before it goes, in world units. */
export const LIFT = 7;

/**
 * Where the pilot's run ends and the leap begins, along: short of the fighter's tail, so the leap is
 * up and forward into the cockpit rather than out from under the wing.
 */
export const LEAP_FROM = STAGE.bluePad - 16;

/** The pilot's running speed, in world units per step — the doorway to the leap in two seconds. */
export const RUN_SPEED = (LEAP_FROM - STAGE.doorway.along) / (BEATS.pilotLeap - BEATS.pilotOut);

/** How far above the deck the pilot's sprite centre stands: their feet are at the bottom of it. */
export const PILOT_STANDS = 6.5;

/** Steps per frame of the run cycle — four frames, a stride every third of a second. */
export const RUN_FRAME_STEPS = 5;

/** The alarm beacon's period, in steps. A turn a second, like a real rotating beacon. */
export const ALARM_PERIOD = 60;

/** The flame's flicker between its two burn frames, in steps. */
export const FLICKER_STEPS = 3;

/**
 * The dark outside: how fast the station falls behind the ships at cruise, in world units per step, and
 * how many steps the ships take to reach cruise — they have only just left the bay, so the shot opens
 * slow and gathers speed.
 *
 * ⚠️ **THE SKY IS NOT HERE SINCE 0416**: it goes past at the level's own scroll, which is the sim's
 * number and not the intro's, so `src/render/port.ts` reads it where it draws the sky. 0411's two
 * fields ran at 0.45 and 1.4 from this table — faster than the game's far and near and slower than its
 * streaks, a sky of its own, and it looked like one.
 */
export const OUTSIDE = { station: 1, ramp: 150 } as const;

/**
 * How the dark outside is framed. 0414: *"needs to zoom out about 25%"*; 0416: *"zoom out on the ships a
 * bit more, just so they're a bit tighter looking"* — 0.8 to 0.65. Everything that flies in it, and the
 * station, is drawn at this share of its size about the middle of the view. The sky is not: it is the
 * level's, at the level's own size, because the next thing drawn in it is the level.
 */
export const OUTSIDE_ZOOM = 0.65;

/**
 * Where the ships hold along the lane outside, and across it before the first jink. The fighter is
 * further back than 0411 put it — *"slightly further behind in space"* (0414) — and further again in
 * world units since 0416's zoom, 40 to 30, so the gap ON SCREEN is still the one that was asked for:
 * the zoom shrinks every distance in the shot, and that one is a picture quantity.
 */
export const CHASE = {
  viper: { along: 150, across: 52 },
  blue: { along: 30, across: 60 },
} as const;

/**
 * ⚠️ **THE VIPER JINKS, AND THE FIGHTER FOLLOWS HER LINE** — 0414, replacing 0411's weave: *"the floaty
 * motion of the spaceships in space felt really weird"*. Two ships bobbing on sine waves are two ships
 * drifting, and a chase is one ship choosing where to go and the other going there after her. So she
 * holds a line and breaks from it — a quick move, eased at both ends, then held — and the fighter
 * flies her track `TRACK_DELAY` steps late. Each row is when she breaks, in steps into the shot, and
 * the line she breaks to.
 */
export const JINKS: readonly { at: number; to: number }[] = [
  { at: 40, to: 34 },
  { at: 112, to: 72 },
  { at: 176, to: 46 },
];

/**
 * When the pilot's ship tilts from the hangar's view to the fight's, in steps into the dark outside —
 * `docs/decisions/0444-the-intro-is-the-pilots.md`: *"lifts up and flies out of the hanger then tilts
 * so it's topdown view."* It comes out of the station's bay at step 6 as the hangar saw it, flies a
 * half-second side-on in front of the station's flank, and is over onto the fight's view as it settles
 * onto her line at 72 — so the chase that follows is flown in the picture the game is.
 *
 * ⚠️ **PHOTOGRAPHED, AND MOVED LATER.** The first build began at 20, and the saucer was lying flat
 * before it was out of the bay's own light: a turn made in the doorway reads as a sprite swap, not as
 * a ship banking over once it has room.
 *
 * ⚠️ **For every ship, and only one moves.** A ship whose hangar picture IS the fight's bakes the same
 * drawing into every frame of the tilt, so the shared timing is a default and the picture is the row's
 * (`HANGAR_ART` in `src/render/port-bake.ts`) — 0282.
 */
export const TILT = { from: 36, steps: 36 } as const;

/** How long a jink takes, in steps — quick, so it reads as a decision rather than a drift. */
export const JINK_STEPS = 22;

/** How far behind her the fighter flies her line, in steps. */
export const TRACK_DELAY = 42;

/**
 * The trails the two ships leave when they open up at the end — 0414: *"I also know that you wouldn't
 * have contour trails in space, but can we add some contour trails when they jet off at the end of the
 * space bit?"* A trail is where the ship WAS: `TRAIL_SAMPLES` of its own past positions, every
 * `TRAIL_EVERY` steps, drawn from the moment it opened up and fading with age — which a pure function of
 * the clock gives for nothing, since the painter can ask where the ship was.
 */
export const TRAIL_SAMPLES = 28;
export const TRAIL_EVERY = 2;

/**
 * What the intro sounds like, and on which step — `docs/decisions/0412-the-port-is-heard.md`.
 *
 * ⚠️ **HEARD FROM WHEREVER THE PLAYER PRESSED, AND NOT BEFORE.** No browser plays anything until the
 * page has been touched, so this is a list of things that happen rather than a soundtrack that
 * starts: the shell plays each row as the intro passes its step, if the sound is on by then, and a row
 * already passed is simply not heard. The music under it is the title's own, which carries on into the
 * title — nothing to cut between.
 *
 * Every cue is the twin of something drawn on the same step (`src/content/cues.ts`). Sorted by step.
 */
export interface IntroCue {
  at: number;
  cue: 'ignite' | 'launch' | 'alarm' | 'door' | 'step';
}

/** The pilot's feet strike twice a run cycle — on the first and third of its four frames. */
const STRIDE = 2 * RUN_FRAME_STEPS;

const UNSORTED_CUES: IntroCue[] = [
  // Venoma's door, feet and leap were heard here — 0416 — until 0444 took her run out.
  { at: BEATS.viperLit, cue: 'ignite' },
  { at: BEATS.viperGo, cue: 'launch' },
  // The alarm on every turn of the beacon, from its first until the hangar goes dark.
  ...Array.from({ length: Math.ceil((BEATS.cut - FADE - BEATS.alarm) / ALARM_PERIOD) }, (_, i) => ({
    at: BEATS.alarm + i * ALARM_PERIOD,
    cue: 'alarm' as const,
  })),
  { at: BEATS.door, cue: 'door' },
  ...Array.from({ length: Math.floor((BEATS.pilotLeap - BEATS.pilotOut) / STRIDE) }, (_, i) => ({
    at: BEATS.pilotOut + i * STRIDE,
    cue: 'step' as const,
  })),
  { at: BEATS.pilotLeap, cue: 'step' },
  { at: BEATS.blueLit, cue: 'ignite' },
  { at: BEATS.blueGo, cue: 'launch' },
  { at: BEATS.viperRuns, cue: 'launch' },
  { at: BEATS.blueRuns, cue: 'launch' },
];

export const INTRO_CUES: readonly IntroCue[] = UNSORTED_CUES.sort((a, b) => a.at - b.at);
