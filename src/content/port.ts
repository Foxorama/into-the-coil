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
 * hers and no ink of this game's palette means them.
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

import type { RunnerRow } from './golfers.ts';
import { FIGHTER_HULL, SHIP_BOX } from './sprites.ts';

/**
 * How much bigger a ship is in the hangar than in flight — 0441. The fighter's bare hull was baked at
 * 30 units here (its 7 in the fight), and the four ships share the fight's one box (`SHIP_BOX`), so the
 * box is baked at this scale and the fighter is the size it always was beside the bar door.
 */
export const HANGAR_SCALE = 30 / FIGHTER_HULL;

/** The pilot's ship's box at hangar size — every ship, so each is the size it is in the fight, scaled. */
const HANGAR_SHIP = SHIP_BOX * HANGAR_SCALE;

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
  'blue',
  'blueIdle',
  'blueBurn',
  'blueFlare',
  'blueSurge',
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
  'rivalRun0',
  'rivalRun1',
  'rivalRun2',
  'rivalRun3',
  'rivalLeap',
  'station',
  'flash',
  'pool',
  'contrail',
  'veil',
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
  blue: HANGAR_SHIP,
  blueIdle: HANGAR_SHIP * 2,
  blueBurn: HANGAR_SHIP * 2,
  blueFlare: HANGAR_SHIP * 2,
  blueSurge: HANGAR_SHIP * 3,
  viper: 40,
  viperIdle: 80,
  viperBurn: 80,
  viperFlare: 80,
  viperSurge: 120,
  pilotRun0: 16,
  pilotRun1: 16,
  pilotRun2: 16,
  pilotRun3: 16,
  pilotLeap: 16,
  rivalRun0: 16,
  rivalRun1: 16,
  rivalRun2: 16,
  rivalRun3: 16,
  rivalLeap: 16,
  station: 110,
  flash: 40,
  pool: 40,
  contrail: 16,
  veil: 1,
};

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

/**
 * Venoma Krait, running for her ship — 0416: *"can we add a viper hooded character running to the
 * viper ship as well? with a viper coloured golf bag too"*. Hooded in the Wyrm-Ship's green, the bag
 * in its acid, and the rest of her in its dark. Hers and nobody else's, so it is a row here beside
 * `VIPER` rather than a fifth golfer: she is not offered.
 */
export const VENOMA: RunnerRow = {
  cap: VIPER.body,
  shirt: VIPER.body,
  skin: '#c89a74',
  hair: '#0d1a12',
  cut: 'sweep',
  stubble: false,
  build: 0.97,
  bag: VIPER.accent,
  hood: '#2a5a40',
  pants: VIPER.belly,
  // A hoodie's, to the wrist — the first photograph had bare forearms under a hood.
  longSleeves: true,
};

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
  /** The alarm beacons, which turn once the Viper has gone. */
  beacons: [
    [174, 30],
    [104, 24],
  ] as readonly (readonly [number, number])[],
} as const;

/**
 * Every moment the intro turns on, in steps from its first frame.
 *
 * ⚠️ **Two shots: the hangar, and the dark outside it.** The hangar is held still, as a stage — the
 * camera does not follow anything in it, and the player watches the room empty. The second shot flies
 * WITH the two ships, so the stars run and the chase is the thing that is still.
 */
export const BEATS = {
  /** The bar's door slides back for her while the room is still coming up. 0.3 s. */
  rivalDoor: 18,
  /** The room has faded up out of the backdrop. 0.6 s. */
  fadeIn: 36,
  /** She is out, running for the Viper. 0.7 s. */
  rivalOut: 42,
  /** The door slides shut behind her. 1.2 s. */
  rivalShut: 72,
  /** She has reached her ship and leaps. 3.3 s. */
  rivalLeap: 198,
  /** She is in. 3.8 s. */
  rivalIn: 228,
  /**
   * The Viper's engines light at idle. 4.1 s — ⚠️ **186 steps later than 0414's 1.2**, because she has
   * to get to the ship first (0416). Everything after this beat moved by the same 186 and nothing else
   * about it changed: the chase is the same chase, begun three seconds later.
   */
  viperLit: 246,
  /** She lifts off her pad. 4.9 s. */
  viperLift: 294,
  /** Full burn, and she goes — through the bay a second later. 5.6 s. */
  viperGo: 336,
  /** The bay's alarm starts to turn. 7.0 s. */
  alarm: 420,
  /**
   * The bar's door opens. 8.4 s — ⚠️ **a beat later than 0411's**, asked for as *"slightly more
   * delay on the chase"* (0414): the room stands empty with the alarm turning before anyone comes.
   */
  door: 504,
  /** The door is open and the pilot is out. 8.8 s. */
  pilotOut: 528,
  /** The pilot has reached the ship and leaps. 10.8 s. */
  pilotLeap: 648,
  /** The pilot is in. 11.3 s. */
  pilotIn: 678,
  /** The blue fighter's engines light. 11.6 s. */
  blueLit: 696,
  /** It lifts — a longer spool than hers, 0414's *"slightly slower off the mark"*. 12.3 s. */
  blueLift: 734,
  /** Full burn, and it goes, slower than she did (`BLUE_LAUNCH_ACCEL`). 13.1 s. */
  blueGo: 786,
  /** The hangar has faded into the backdrop, from 14.4 s. 14.8 s. */
  cut: 886,
  /** The dark outside comes up. 15.2 s. */
  outside: 910,
  /** The Viper opens her throttle and leaves the frame. 19.2 s. */
  viperRuns: 1150,
  /** The fighter goes after her, further behind than 0411 had it. 20.4 s. */
  blueRuns: 1222,
  /** The picture fades into the backdrop the title is drawn on. 22.4 s. */
  fadeOut: 1342,
  /** The intro is over and the title comes up. 23.0 s. */
  end: 1378,
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

/**
 * Where her run ends and her leap begins, along — short of the Viper's tail, which sits about 15 units
 * aft of its pad, on `LEAP_FROM`'s terms.
 */
export const RIVAL_LEAP_FROM = STAGE.viperPad - 20;

/**
 * Her running speed: the doorway to her leap in two and a half seconds, which is 0.5 units a step —
 * nearly twice the pilot's. She is the one leaving before anyone can stop her, and she is not running
 * after anybody.
 */
export const RIVAL_SPEED = (RIVAL_LEAP_FROM - STAGE.doorway.along) / (BEATS.rivalLeap - BEATS.rivalOut);

/** Steps per frame of her run cycle: the longer stride of a faster run turns over faster. */
export const RIVAL_FRAME_STEPS = 4;

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

/** Bo's feet strike twice a run cycle — on the first and third of its four frames. */
const STRIDE = 2 * RUN_FRAME_STEPS;

/** Her feet, on her own faster cycle — 0416. */
const RIVAL_STRIDE = 2 * RIVAL_FRAME_STEPS;

const UNSORTED_CUES: IntroCue[] = [
  // Venoma out of the bar and across the deck to her ship — 0416.
  { at: BEATS.rivalDoor, cue: 'door' },
  ...Array.from({ length: Math.floor((BEATS.rivalLeap - BEATS.rivalOut) / RIVAL_STRIDE) }, (_, i) => ({
    at: BEATS.rivalOut + i * RIVAL_STRIDE,
    cue: 'step' as const,
  })),
  { at: BEATS.rivalLeap, cue: 'step' },
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
