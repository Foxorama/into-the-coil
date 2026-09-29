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
  'stars',
  'starsNear',
  'bayTop',
  'bayBottom',
  'field',
  'beacon',
  'blue',
  'blueIdle',
  'blueBurn',
  'blueFlare',
  'viper',
  'viperIdle',
  'viperBurn',
  'viperFlare',
  'pilotRun0',
  'pilotRun1',
  'pilotRun2',
  'pilotRun3',
  'pilotLeap',
  'station',
  'flash',
  'pool',
  'black',
] as const;

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
  stars: 60,
  starsNear: 60,
  bayTop: 30,
  bayBottom: 30,
  field: 80,
  beacon: 14,
  blue: 30,
  blueIdle: 60,
  blueBurn: 60,
  blueFlare: 60,
  viper: 40,
  viperIdle: 80,
  viperBurn: 80,
  viperFlare: 80,
  pilotRun0: 16,
  pilotRun1: 16,
  pilotRun2: 16,
  pilotRun3: 16,
  pilotLeap: 16,
  station: 110,
  flash: 40,
  pool: 40,
  black: 1,
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

/**
 * The pilot is Backspin Bo — `docs/decisions/0412-the-port-is-heard.md`. One of the four *Far Carry*
 * golfers `docs/game.md` puts in the prologue: Portland's wedge player, *"the still centre of the
 * tour"*, they/them. The colours are the predecessor's own roster row (`characters.ts`, read for this
 * and for nothing else) — a purple cap over a deeper purple polo, a tousled dark crop under the cap —
 * and its intro's red carry bag with the shafts showing, because a golfer running for a ship still
 * has their clubs.
 */
export const BO = {
  cap: '#9b5fd4',
  shirt: '#7d46b8',
  skin: '#a8714c',
  hair: '#2f2318',
  pants: '#2c3142',
  shoes: '#232733',
  bag: '#c0392b',
  shaft: '#d7dbe2',
} as const;

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
  /** The room fades up out of black. 0.6 s. */
  fadeIn: 36,
  /** The Viper's engines light at idle. 1.2 s. */
  viperLit: 72,
  /** She lifts off her pad. 2.0 s. */
  viperLift: 120,
  /** Full burn, and she goes — through the bay a second later. 2.7 s. */
  viperGo: 162,
  /** The bay's alarm starts to turn. 4.1 s. */
  alarm: 246,
  /** The bar's door opens. 4.7 s. */
  door: 282,
  /** The door is open and the pilot is out. 5.1 s. */
  pilotOut: 306,
  /** The pilot has reached the ship and leaps. 7.1 s. */
  pilotLeap: 426,
  /** The pilot is in. 7.6 s. */
  pilotIn: 456,
  /** The blue fighter's engines light. 7.8 s. */
  blueLit: 468,
  /** It lifts. 8.4 s. */
  blueLift: 504,
  /** Full burn, and it goes — through the bay by 9.9 s. 9.1 s. */
  blueGo: 546,
  /** The hangar is black, having faded from 10.1 s. 10.5 s. */
  cut: 630,
  /** The dark outside comes up. 10.9 s. */
  outside: 654,
  /** The Viper opens her throttle and leaves the frame. 13.7 s. */
  viperRuns: 822,
  /** The fighter goes after her, and is gone by 15.9 s. 14.5 s. */
  blueRuns: 870,
  /** The picture goes to black. 16.0 s. */
  fadeOut: 960,
  /** The intro is over and the title comes up. 16.6 s. */
  end: 996,
} as const;

/** How long the intro runs, in steps — the screen's own countdown (`src/state/screens.ts`). */
export const INTRO_STEPS = BEATS.end;

/** How long a fade to or from black takes across the cut, in steps. 0.4 s. */
export const FADE = 24;

/**
 * The ships' motion out through the bay, in world units per step squared: a standing start to off the
 * screen in a second and a fifth. Solved from the widest view, so it is off every screen in time.
 */
export const LAUNCH_ACCEL = 0.068;

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
 * The dark outside: how fast the two star fields and the station fall behind the ships at cruise, in
 * world units per step, and how many steps the ships take to reach it — they have only just left the
 * bay, so the shot opens slow and gathers speed. The near field three times the far, so the sky has
 * depth while the camera flies with the chase.
 */
export const OUTSIDE = { far: 0.45, near: 1.4, station: 1, ramp: 150 } as const;

/** Where the ships hold across the lane outside, and how far and how fast they weave about it. */
export const CHASE = {
  viper: { along: 150, across: 52, weave: 9, period: 150 },
  blue: { along: 78, across: 64, weave: 12, period: 170 },
} as const;

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

const UNSORTED_CUES: IntroCue[] = [
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
