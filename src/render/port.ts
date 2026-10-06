/**
 * The intro, drawn — `docs/decisions/0411-the-chase-begins-at-the-port.md`.
 *
 * ⚠️ **EVERY POSITION HERE IS A PURE FUNCTION OF ONE CLOCK, AND NOTHING ACCUMULATES** — the move
 * `src/app/attract.ts` makes for the music room, for the same reason: the picture can be asked for at
 * any moment without having travelled there, so a headless test can check it frame by frame and the
 * renderer interpolates for free by asking at `step + alpha`.
 *
 * ⚠️ **ON `tests/budget.test.ts`'s HOT LIST.** It runs every frame the intro is up, so it holds the
 * frame loop's rules: no allocation, blits only. Every loop below is an index over a constant table.
 *
 * Two shots. **The hangar** is held still, as a stage: the Viper, with Venoma already aboard, lifts and
 * goes, the alarm turns, the bar's door slides back, the pilot runs to their own ship and leaps in, and
 * it goes after her. **The dark outside** flies with the two ships, so the first level's sky runs past
 * and the chase holds still — the pilot's ship tilting over from the hangar's view into the fight's as
 * it clears the station (0444) — until she opens her throttle and leaves the frame, and it follows.
 */

import {
  ALARM_PERIOD,
  BEATS,
  BLUE_LAUNCH_ACCEL,
  CHASE,
  FADE,
  FLICKER_STEPS,
  HANGAR_SCALE,
  JINKS,
  JINK_STEPS,
  LAUNCH_ACCEL,
  LEAP_FROM,
  LIFT,
  OUTSIDE,
  OUTSIDE_ZOOM,
  PILOT_STANDS,
  PORT_EXTENT,
  PORT_KINDS,
  PORT_SPRITE,
  RUN_FRAME_STEPS,
  RUN_SPEED,
  STAGE,
  SURGE_CURVE,
  SURGE_STEPS,
  TILT,
  type StandCamera,
  TRACK_DELAY,
  TRAIL_EVERY,
  TRAIL_SAMPLES,
} from '../content/port.ts';
import { KEEPERS, type KeeperKind } from '../content/keepers.ts';
import type { ShipRow } from '../content/ships.ts';
import { RIMS } from '../content/rims.ts';
import { SPRITE_EXTENT } from '../content/sprites.ts';
import { STEPS_PER_SECOND } from '../state/screens.ts';
import { ACROSS_SPAN, type View } from '../sim/camera.ts';
import { SCROLL_PER_STEP } from '../sim/flight.ts';
import { paintSky, type Sky } from './scene.ts';
import { screenX, screenY, type Surface } from './surface.ts';

/** How much bigger than its box a tile is blitted, so the seam between two can never show the space behind. */
const TILE_OVERLAP = 1.03;

/** How long a launch's flash takes to go out, in steps, and how big it is against its box. */
const FLASH_STEPS = 20;
const FLASH_GROW = 0.55;

/*
  `COCKPIT` stood here, the fighter's canopy three units ahead of its centre, until 0444 put where a
  pilot boards on each ship's row (`cockpit` in `src/content/ships.ts`) — the saucer is boarded at its
  dome, above its rim. Venoma's canopy beside it went with her run.
*/

/** How many pictures the pilot's ship tilts through outside, from the hangar's view to the fight's. */
const TILT_FRAMES = PORT_SPRITE.blue - PORT_SPRITE.blueSide + 1;

/**
 * ⚠️ **THE SKY GOES PAST AT THE FIRST LEVEL'S OWN RATE — 0416**, *"it should kinda lead straight into
 * level 1"*: outside, the camera behind it flies at the level's scroll, so every layer moves exactly as
 * it does in play, at its own depth. Read here and not in `src/content/port.ts`, because it is the
 * sim's number — and `tests/combat.test.ts` keeps it out of content, where a table naming it would be a
 * threat written relative to the ship.
 */
export const SKY_SPEED = SCROLL_PER_STEP;

/** And through the bay while the room is held still, a tenth of that: the same sky, moving. */
const HANGAR_DRIFT = SKY_SPEED / 10;

/**
 * Where the game's sprites start in the atlas the intro draws from — `withTheGame` in `port-bake.ts`:
 * the port's own kinds, then every one of the game's.
 */
const GAME_BASE = PORT_KINDS.length;

/**
 * Draw the intro at `t` steps since its first frame — a fractional step between two, so the motion is
 * interpolated like everything else the renderer draws. `sky` is the first level's (0416), whose
 * sprites are the game's, at `GAME_BASE` on in this atlas; empty in a style with no sky. `ship` is the
 * pilot's: its `wingtip` is where its contrails trail from (0441), and its `cockpit` where the pilot
 * drops in (0444), both in the fight's units.
 */
export function paintPort(surface: Surface, view: View, t: number, sky: Sky, ship: ShipRow): void {
  surface.clear();
  // Each ship at its own size in the shot, against the shared scale — 0450; its cockpit and its wingtips with it.
  const inside = ship.intro.hangar;
  const outside = ship.intro.outside;
  if (t < BEATS.cut) paintHangar(surface, view, t, sky, ship.cockpit.along * HANGAR_SCALE * inside, ship.cockpit.across * HANGAR_SCALE * inside, inside);
  else paintOutside(surface, view, t - BEATS.outside, sky, ship.wingtip * HANGAR_SCALE * outside, outside);
  // The fades: up out of the backdrop at the start, down and up again across the cut, and down at the end.
  let veil = 0;
  if (t < BEATS.fadeIn) veil = 1 - t / BEATS.fadeIn;
  else if (t >= BEATS.cut - FADE && t < BEATS.outside) veil = Math.min(1, (t - (BEATS.cut - FADE)) / FADE);
  else if (t >= BEATS.outside && t < BEATS.outside + FADE) veil = 1 - (t - BEATS.outside) / FADE;
  else if (t >= BEATS.fadeOut) veil = Math.min(1, (t - BEATS.fadeOut) / (BEATS.end - BEATS.fadeOut));
  if (veil > 0) veilOver(surface, view, veil);
}

/**
 * ── THE STAND — 0540 ──────────────────────────────────────────────────────────────────────────────
 *
 * The hangar's tabs, standing in the intro's room: the Viper gone and her pad empty, the beacons dark,
 * the bar's door shut, and the pilot's ship on its own pad, at idle on its beam and bobbing, wearing the
 * fit — the port's ship sprites are baked under it, as the intro's are. `t` is how long the stand has
 * been up, and drives only what idles: the bob, the flame, the sky past the bay. Nothing here has a
 * beat, because nothing here happens; the room is a place the pilot hangs out in.
 *
 * ⚠️ **ON THE HOT LIST WITH THE REST OF THIS FILE**: blits over constant tables, and nothing allocated.
 */
export function paintStand(surface: Surface, view: View, t: number, sky: Sky, ship: ShipRow, keeper: KeeperKind | null): void {
  surface.clear();
  paintRoom(surface, view, t, sky);
  paintLamps(surface, view);
  // The bar, its door shut: nobody is coming out of it.
  put(surface, view, PORT_SPRITE.door, STAGE.doorway.along, STAGE.doorway.across);
  put(surface, view, PORT_SPRITE.bar, STAGE.bar.along, STAGE.bar.across);
  paintDeck(surface, view);
  /*
    0542: the tab's keeper behind their counter, by the pad — the bust first, so the counter is in front.
    ⚠️ **THE TAB'S OWN KEEPER SINCE 0550, AND IT WAS COSMO ON ALL THREE (0548).** Played: *"Hangin Out, Paints
    & Parts and Cosmo's Cosmetics all show Cosmo."* The three share one camera, and it holds one counter
    whole beside the pad, so the counter there is the tab's: Unity's bench, MMXXVI's booth, Cosmo's stall.
    The intro never had one.
  */
  if (keeper !== null) {
    const row = KEEPERS[keeper];
    put(surface, view, PORT_SPRITE[row.bust], STAGE.keeper.along, STAGE.keeper.across);
    put(surface, view, PORT_SPRITE[row.counter], STAGE.stall.along, STAGE.stall.across);
  }
  // The pilot's beam and pad, and the Viper's pad, empty.
  const beam = PORT_EXTENT.beam;
  put(surface, view, PORT_SPRITE.beam, STAGE.bluePad, STAGE.deck - beam / 2 + 2);
  put(surface, view, PORT_SPRITE.pad, STAGE.viperPad, STAGE.deck);
  put(surface, view, PORT_SPRITE.pad, STAGE.bluePad, STAGE.deck);
  // Lit from the first frame and never going: its idle flame for as long as the stand is up.
  const size = ship.intro.hangar;
  const across = STAGE.blueRide + blueBobAt(t);
  paintBlue(surface, view, t, STAGE.bluePad, across, 0, Number.POSITIVE_INFINITY, size);
  /*
    A car on a rim that turns turns it on the pad, as it does in the fight (0527, `stepWheels`): the
    spinner over each tyre its row names, swelled to that tyre, front and back at the rim's own rates.
  */
  const wheels = ship.wheels;
  const rates = wheels === null ? null : RIMS[wheels.rim].turn;
  if (wheels !== null && rates !== null) {
    const unit = HANGAR_SCALE * size;
    const swell = (wheels.radius / (SPRITE_EXTENT.spinnerWheel * 0.42)) * size;
    const seconds = t / STEPS_PER_SECOND;
    for (let i = 0; i < wheels.at.length; i++) {
      const at = wheels.at[i]!;
      const turn = ((Math.PI * 2 * seconds) / (i === 0 ? rates[0] : rates[1])) % (Math.PI * 2);
      put(surface, view, PORT_SPRITE.blueWheel, STAGE.bluePad + at.along * unit, across + at.across * unit, 1, turn, swell);
    }
  }
  paintEdge(surface, view);
}

/**
 * The view the stand is seen through — 0540: the screen's own `base`, closer by the camera's `zoom`, with
 * the camera's point of the room at its share of the screen (`x`, `y` of `width` × `height`), and held
 * inside the room, so no edge of it shows the void the room is painted on. Written into `out`, so a
 * resize or a change of tab costs no allocation; and in a portrait view, which is never played, the
 * base itself.
 */
export function standViewInto(base: View, camera: StandCamera, width: number, height: number, out: View): void {
  out.alongSpan = base.alongSpan;
  out.acrossSpan = base.acrossSpan;
  out.alongAxis = base.alongAxis;
  // No bar: it is the play readout's (0500), and on the stand the readout is down in the dash (0539).
  out.barAcross = 0;
  if (base.alongAxis !== 'x' || base.scale <= 0) {
    out.scale = base.scale;
    out.gutterAlong = base.gutterAlong;
    out.gutterAcross = base.gutterAcross;
    return;
  }
  const scale = base.scale * camera.zoom;
  out.scale = scale;
  // The room's left wall no further in than the screen's left edge, and the sky past the bay, which is
  // painted across the view's own span, no further in than the right; the truss above the top and the
  // deck below the bottom.
  const along = camera.x * width - camera.along * scale;
  out.gutterAlong = Math.min(0, Math.max(width - base.alongSpan * scale, along));
  const across = camera.y * height - camera.across * scale;
  out.gutterAcross = Math.min(0, Math.max(height - ACROSS_SPAN * scale, across));
}

/**
 * Cover the whole canvas in the palette's space at `alpha` — one blit of a one-unit square, scaled past
 * every edge. The backdrop the screens either side of the intro are drawn on, so a fade to it is a fade
 * into the next screen (0416).
 */
function veilOver(surface: Surface, view: View, alpha: number): void {
  const px = view.alongSpan * view.scale + ACROSS_SPAN * view.scale + (view.gutterAlong + view.gutterAcross) * 2;
  surface.blit(PORT_SPRITE.veil, screenX(view, view.alongSpan / 2, ACROSS_SPAN / 2), screenY(view, view.alongSpan / 2, ACROSS_SPAN / 2), px, 0, alpha);
}

/** One blit at a world position, at the view's own scale. */
function put(surface: Surface, view: View, sprite: number, along: number, across: number, alpha = 1, turn = 0, grow = 1): void {
  surface.blit(sprite, screenX(view, along, across), screenY(view, along, across), view.scale * grow, turn, alpha);
}

/** Smooth from 0 at `from` to 1 at `to`, and flat either side. */
function ease(t: number, from: number, to: number): number {
  const u = Math.min(1, Math.max(0, (t - from) / (to - from)));
  return u * u * (3 - 2 * u);
}

/** How far a ship launched at `go` has travelled by `t`, from a standing start, at `accel`. */
function launched(t: number, go: number, accel = LAUNCH_ACCEL): number {
  if (t <= go) return 0;
  const s = t - go;
  return 0.5 * accel * s * s;
}

/**
 * The ship's engine, at the frame its beat has reached: nothing until it is lit, idle until it goes,
 * a flare for the first half-second of a launch and a flickering burn after that.
 */
function flameOf(t: number, lit: number, go: number, idle: number, burn: number, flare: number): number {
  if (t < lit) return -1;
  if (t < go) return idle;
  if (t < go + 30) return flare;
  return Math.floor(t / FLICKER_STEPS) % 2 === 0 ? burn : flare;
}

/**
 * How much of the surge is left `t` steps into a launch heard at `go` — 0416: full on the step the
 * `launch` cue sounds, dying back into the burn over `SURGE_STEPS`, and nothing either side.
 */
function surgeAt(t: number, go: number): number {
  if (t < go || t >= go + SURGE_STEPS) return 0;
  return Math.pow(1 - (t - go) / SURGE_STEPS, SURGE_CURVE);
}

/*
  ── THE HANGAR ───────────────────────────────────────────────────────────────────────────────────
*/

/*
  ⚠️ **THE ROOM IS DRAWN BY THESE, FOR THE INTRO AND FOR THE STAND ALIKE — 0540.** The hangar's tabs
  stand in this room, held still, and a second copy of how the room is drawn would be a room that drifts
  from the intro's the first time either is touched. What the two pictures share is here; what happens
  in the room — the Viper, the alarm, the pilot — stays in `paintHangar`.
*/

/** The first level's sky past the bay, drifting, and the back wall and the truss over it. */
function paintRoom(surface: Surface, view: View, t: number, sky: Sky): void {
  // The first level's sky past the bay, drifting — the room covers the rest of it (0416).
  paintSky(surface, view, t * HANGAR_DRIFT, sky, 0, 0, GAME_BASE);
  // The back wall, the truss and the lamps.
  const wall = PORT_EXTENT.wall;
  const hole = STAGE.viewport;
  for (let along = wall / 2; along < STAGE.bay; along += wall) {
    for (let across = wall / 2; across < STAGE.deck + wall; across += wall) {
      // 0550: no tile where the viewport is, so the sky under the room is what is seen through it.
      if (along > hole.along && along < hole.along + 2 * wall && across > hole.across && across < hole.across + wall) continue;
      put(surface, view, PORT_SPRITE.wall, along, across, 1, 0, TILE_OVERLAP);
    }
  }
  put(surface, view, PORT_SPRITE.viewport, hole.along + wall, hole.across + wall / 2);
  const ceiling = PORT_EXTENT.ceiling;
  for (let along = ceiling / 2; along < STAGE.bay; along += ceiling) {
    put(surface, view, PORT_SPRITE.ceiling, along, STAGE.ceiling - ceiling / 2, 1, 0, TILE_OVERLAP);
  }
}

/** The lamps hung from the truss. */
function paintLamps(surface: Surface, view: View): void {
  const lamp = PORT_EXTENT.lamp;
  for (let i = 0; i < STAGE.lamps.length; i++) {
    put(surface, view, PORT_SPRITE.lamp, STAGE.lamps[i]!, STAGE.ceiling - 2 + lamp / 2);
  }
}

/** The deck, every plank of it to the bay. */
function paintDeck(surface: Surface, view: View): void {
  const deck = PORT_EXTENT.deck;
  for (let along = deck / 2; along < STAGE.bay; along += deck) {
    for (let across = STAGE.deck + deck / 2; across < ACROSS_SPAN + deck / 2; across += deck) {
      put(surface, view, PORT_SPRITE.deck, along, across, 1, 0, TILE_OVERLAP);
    }
  }
}

/** The edge of the room, over everything that flies out through it. */
function paintEdge(surface: Surface, view: View): void {
  put(surface, view, PORT_SPRITE.field, STAGE.bay + 1, (STAGE.ceiling + STAGE.deck) / 2, 0.8);
  put(surface, view, PORT_SPRITE.bayTop, STAGE.bay + 2, PORT_EXTENT.bayTop / 2 - 4);
  put(surface, view, PORT_SPRITE.bayBottom, STAGE.bay + 2, ACROSS_SPAN - PORT_EXTENT.bayBottom / 2 + 4);
}

/** How fast the pilot's ship bobs on its pad's beam, in radians a step — a period of about 105 steps. */
export const BLUE_BOB_RATE = 0.06;

/** How far the pilot's ship bobs on its pad's beam at `t`, before it goes. */
function blueBobAt(t: number): number {
  return Math.sin(t * BLUE_BOB_RATE + 1.7) * 0.6;
}

function paintHangar(surface: Surface, view: View, t: number, sky: Sky, cockpitAlong: number, cockpitAcross: number, size: number): void {
  paintRoom(surface, view, t, sky);
  // The alarm, turning once she has gone: a beacon sweeps past the viewer once a turn.
  if (t >= BEATS.alarm) {
    const turn = ((t - BEATS.alarm) / ALARM_PERIOD) * Math.PI * 2;
    const sweep = Math.max(0, Math.cos(turn));
    const lit = Math.min(1, (t - BEATS.alarm) / 12) * (0.25 + 0.75 * sweep * sweep);
    for (let i = 0; i < STAGE.beacons.length; i++) {
      const at = STAGE.beacons[i]!;
      put(surface, view, PORT_SPRITE.beacon, at[0], at[1], lit, 0, 1 + 0.6 * sweep);
    }
  }
  paintLamps(surface, view);
  /*
    The bar: the light inside it and the door that slides back across it, then the front of it. It
    opens once, for the pilot, and stays open — it opened for Venoma too from 0416 until 0444.
  */
  const open = ease(t, BEATS.door, BEATS.pilotOut);
  if (open > 0) put(surface, view, PORT_SPRITE.spill, STAGE.doorway.along, STAGE.doorway.across, open);
  put(surface, view, PORT_SPRITE.door, STAGE.doorway.along - 13 * open, STAGE.doorway.across);
  put(surface, view, PORT_SPRITE.bar, STAGE.bar.along, STAGE.bar.across);
  // The deck.
  paintDeck(surface, view);
  if (open > 0) put(surface, view, PORT_SPRITE.pool, STAGE.doorway.along + 6, STAGE.deck + 1, open * 0.7);
  // The pads, and the beams each ship rides until it goes.
  const beam = PORT_EXTENT.beam;
  put(surface, view, PORT_SPRITE.beam, STAGE.viperPad, STAGE.deck - beam / 2 + 2, 1 - ease(t, BEATS.viperGo, BEATS.viperGo + 30));
  put(surface, view, PORT_SPRITE.beam, STAGE.bluePad, STAGE.deck - beam / 2 + 2, 1 - ease(t, BEATS.blueGo, BEATS.blueGo + 30));
  put(surface, view, PORT_SPRITE.pad, STAGE.viperPad, STAGE.deck);
  put(surface, view, PORT_SPRITE.pad, STAGE.bluePad, STAGE.deck);
  // The Viper: a bob on the beam, the lift, and the burn out through the bay.
  const viperBob = t < BEATS.viperGo ? Math.sin(t * 0.07) * 0.6 : 0;
  const viperAlong = STAGE.viperPad + launched(t, BEATS.viperGo);
  const viperAcross = STAGE.viperRide - LIFT * ease(t, BEATS.viperLift, BEATS.viperGo) + viperBob;
  paintViper(surface, view, t, viperAlong, viperAcross, BEATS.viperLit, BEATS.viperGo);
  const blueBob = t < BEATS.blueGo ? blueBobAt(t) : 0;
  const blueAlong = STAGE.bluePad + launched(t, BEATS.blueGo, BLUE_LAUNCH_ACCEL);
  const blueAcross = STAGE.blueRide - LIFT * ease(t, BEATS.blueLift, BEATS.blueGo) + blueBob;
  paintBlue(surface, view, t, blueAlong, blueAcross, BEATS.blueLit, BEATS.blueGo, size);
  /*
    ⚠️ **VENOMA RAN HERE — 0416 — OUT OF THE DOOR AND UP INTO THE VIPER, UNTIL 0444.** *"it doesn't add
    anything and makes the ending worse when you see the villain running with no captive."* She is
    aboard before the picture starts.
  */
  /*
    The pilot: out of the door, across the deck, and up into the cockpit — in FRONT of the fighter,
    because the deck they run along is nearer the viewer than the pad's beam, and a pilot that ran
    under the wing vanished into it in the first photographs. The leap shrinks and fades as it drops
    into the canopy, which is what puts them inside.
  */
  if (t >= BEATS.pilotOut && t < BEATS.pilotIn) {
    if (t < BEATS.pilotLeap) {
      const run = t - BEATS.pilotOut;
      const frame = Math.floor(run / RUN_FRAME_STEPS) % 4;
      const bob = Math.abs(Math.sin((run / RUN_FRAME_STEPS) * (Math.PI / 2))) * 0.5;
      put(surface, view, PORT_SPRITE.pilotRun0 + frame, STAGE.doorway.along + RUN_SPEED * run, STAGE.deck - PILOT_STANDS - bob);
    } else {
      const u = (t - BEATS.pilotLeap) / (BEATS.pilotIn - BEATS.pilotLeap);
      const fromAcross = STAGE.deck - PILOT_STANDS;
      const toAlong = blueAlong + cockpitAlong;
      const toAcross = blueAcross + cockpitAcross;
      const along = LEAP_FROM + (toAlong - LEAP_FROM) * u;
      const across = fromAcross + (toAcross - fromAcross) * u - 14 * u * (1 - u);
      put(surface, view, PORT_SPRITE.pilotLeap, along, across, 1 - ease(u, 0.6, 1), 0, 1 - 0.45 * u);
    }
  }
  // The canopy catching the light as the pilot drops in.
  if (t >= BEATS.pilotIn - 6 && t < BEATS.pilotIn + 18) {
    const blink = 1 - Math.abs(t - (BEATS.pilotIn + 4)) / 14;
    if (blink > 0) put(surface, view, PORT_SPRITE.flash, blueAlong + cockpitAlong, blueAcross + cockpitAcross, blink * 0.5, 0, 0.25);
  }
  // The edge of the room, over everything that flies out through it.
  paintEdge(surface, view);
}

/** The Viper and her engine — the surge its launch is heard in — and the flash she leaves the pad in. */
function paintViper(surface: Surface, view: View, t: number, along: number, across: number, lit: number, go: number): void {
  const flame = flameOf(t, lit, go, PORT_SPRITE.viperIdle, PORT_SPRITE.viperBurn, PORT_SPRITE.viperFlare);
  if (flame >= 0) put(surface, view, flame, along, across);
  const surge = surgeAt(t, go);
  if (surge > 0) put(surface, view, PORT_SPRITE.viperSurge, along, across, surge);
  put(surface, view, PORT_SPRITE.viper, along, across);
  if (t >= go && t < go + FLASH_STEPS) {
    put(surface, view, PORT_SPRITE.flash, along - 16, across, 0.8 * (1 - (t - go) / FLASH_STEPS), 0, FLASH_GROW);
  }
}

/**
 * The pilot's ship as the hangar sees it — side-on, for a ship whose fight picture is from above (0444)
 * — its engine, the surge its launch is heard in, and the flash it leaves the pad in.
 */
function paintBlue(surface: Surface, view: View, t: number, along: number, across: number, lit: number, go: number, size: number): void {
  const flame = flameOf(t, lit, go, PORT_SPRITE.blueIdle, PORT_SPRITE.blueBurn, PORT_SPRITE.blueFlare);
  if (flame >= 0) put(surface, view, flame, along, across, 1, 0, size);
  const surge = surgeAt(t, go);
  if (surge > 0) put(surface, view, PORT_SPRITE.blueSurge, along, across, surge, 0, size);
  put(surface, view, PORT_SPRITE.blueSide, along, across, 1, 0, size);
  if (t >= go && t < go + FLASH_STEPS) {
    put(surface, view, PORT_SPRITE.flash, along - 12, across, 0.8 * (1 - (t - go) / FLASH_STEPS), 0, FLASH_GROW);
  }
}

/*
  ── THE DARK OUTSIDE ─────────────────────────────────────────────────────────────────────────────
*/

/**
 * How far something that falls behind at `speed` at cruise has fallen `s` steps into the shot: the
 * ships have only just left the bay, so they gather speed over `OUTSIDE.ramp` steps and hold it.
 */
function fallen(s: number, speed: number): number {
  const ramp = OUTSIDE.ramp;
  return s < ramp ? (speed * s * s) / (2 * ramp) : speed * (s - ramp / 2);
}

/** Where the station's centre is `s` steps into the shot: falling behind as the ships fly on. */
function stationAlong(s: number): number {
  return -18 - fallen(s, OUTSIDE.station);
}

/** The station's bay mouth, relative to its centre — `paintStation` in `port-bake.ts`. */
const BAY_MOUTH_ALONG = 42;
const BAY_MOUTH_ACROSS = 2;
const STATION_ACROSS = 58;

/**
 * One blit in the dark outside, framed `OUTSIDE_ZOOM` about the middle of the view — 0414. The shot is
 * authored in the same world units as the hangar; only where they land and how big is scaled.
 */
function putOut(surface: Surface, view: View, sprite: number, along: number, across: number, alpha = 1, turn = 0, grow = 1): void {
  const midAlong = view.alongSpan / 2;
  const midAcross = ACROSS_SPAN / 2;
  put(surface, view, sprite, midAlong + (along - midAlong) * OUTSIDE_ZOOM, midAcross + (across - midAcross) * OUTSIDE_ZOOM, alpha, turn, OUTSIDE_ZOOM * grow);
}

/** Steps into the shot at which each ship opens her throttle. */
const VIPER_RUNS = BEATS.viperRuns - BEATS.outside;
const BLUE_RUNS = BEATS.blueRuns - BEATS.outside;
/** When the fighter comes out of the bay, and when it has settled onto her line. */
const BLUE_OUT = 6;
const BLUE_SETTLED = 72;

/** Her line across the lane, `s` steps into the shot: held, and broken by each of `JINKS` in turn. */
function viperLine(s: number): number {
  let across = CHASE.viper.across;
  for (let i = 0; i < JINKS.length; i++) {
    const jink = JINKS[i]!;
    across += (jink.to - across) * ease(s, jink.at, jink.at + JINK_STEPS);
  }
  return across;
}

function viperAlongAt(s: number): number {
  return CHASE.viper.along + launched(s, VIPER_RUNS);
}

/** The fighter's share of the way from the bay mouth to its place in the chase. */
function blueArrived(s: number): number {
  return ease(s, BLUE_OUT, BLUE_SETTLED);
}

function blueAlongAt(s: number): number {
  const mouth = stationAlong(s) + BAY_MOUTH_ALONG;
  return mouth + (CHASE.blue.along - mouth) * blueArrived(s) + launched(s, BLUE_RUNS);
}

/** Her line, `TRACK_DELAY` steps late, and a little below it — the fighter flying where she flew. */
function blueAcrossAt(s: number): number {
  const mouth = STATION_ACROSS + BAY_MOUTH_ACROSS;
  const track = viperLine(s - TRACK_DELAY) + (CHASE.blue.across - CHASE.viper.across);
  return mouth + (track - mouth) * blueArrived(s);
}

/**
 * How far a ship banks into a move across the lane: nose down going down the screen, up going up, in
 * proportion to how fast, and level on a held line. The move is what tilts it — nothing sways.
 */
function bank(from: number, to: number): number {
  return Math.max(-0.16, Math.min(0.16, (to - from) * 0.09));
}

/**
 * A ship's trails, from the moment it opened its throttle: `TRAIL_SAMPLES` of where it was, each a
 * length of vapour off its wingtip, fading with age — and faint where the ship was barely moving, so a
 * standing start does not pile a blot on the tip. `tipAlong`/`tipAcross` are the wingtip, relative to
 * the ship's centre, and `blue` says whose position to ask for.
 */
function paintTrail(surface: Surface, view: View, s: number, runs: number, blue: boolean, tipAlong: number, tipAcross: number): void {
  for (let k = 1; k <= TRAIL_SAMPLES; k++) {
    const at = s - k * TRAIL_EVERY;
    if (at < runs) return;
    const along = blue ? blueAlongAt(at) : viperAlongAt(at);
    const across = blue ? blueAcrossAt(at) : viperLine(at);
    const before = blue ? blueAlongAt(at - TRAIL_EVERY) : viperAlongAt(at - TRAIL_EVERY);
    const spread = Math.min(1, (along - before) / 6);
    const alpha = 0.75 * (1 - k / (TRAIL_SAMPLES + 1)) * spread;
    if (alpha > 0.01) putOut(surface, view, PORT_SPRITE.contrail, along + tipAlong, across + tipAcross, alpha);
  }
}

function paintOutside(surface: Surface, view: View, s: number, sky: Sky, wingtip: number, size: number): void {
  if (s < 0) return;
  /*
    ⚠️ **THE FIRST LEVEL'S SKY, AT THE FIRST LEVEL'S SPEED, AND AT ITS OWN SIZE — 0416.** The camera
    behind it flies at `SKY_SPEED`, gathering speed out of the bay on the ships' own ramp; the sky is
    not framed by `OUTSIDE_ZOOM`, because it is the sky the level is drawn in and the level is not zoomed.
  */
  paintSky(surface, view, fallen(s, SKY_SPEED), sky, 0, 0, GAME_BASE);
  const station = stationAlong(s);
  if (station > -PORT_EXTENT.station) putOut(surface, view, PORT_SPRITE.station, station, STATION_ACROSS);
  // The Viper, ahead, holding her line and breaking from it — until she opens her throttle and is gone.
  const viperAlong = viperAlongAt(s);
  const viperAcross = viperLine(s);
  const viperTurn = bank(viperAcross, viperLine(s + 1));
  // Her trails, off both wingtips — the near one low and aft, the far one high and forward.
  paintTrail(surface, view, s, VIPER_RUNS, false, -8.7, 7.7);
  paintTrail(surface, view, s, VIPER_RUNS, false, -5.7, -6.4);
  const viperFlame = s < VIPER_RUNS ? PORT_SPRITE.viperBurn : PORT_SPRITE.viperFlare;
  putOut(surface, view, Math.floor(s / FLICKER_STEPS) % 2 === 0 ? viperFlame : PORT_SPRITE.viperFlare, viperAlong, viperAcross, 1, viperTurn);
  // The surge her throttle is heard in — 0416.
  const viperSurge = surgeAt(s, VIPER_RUNS);
  if (viperSurge > 0) putOut(surface, view, PORT_SPRITE.viperSurge, viperAlong, viperAcross, viperSurge, viperTurn);
  putOut(surface, view, PORT_SPRITE.viper, viperAlong, viperAcross, 1, viperTurn);
  // The fighter: out of the station's bay, onto her line behind her — and then after her.
  if (s < BLUE_OUT) return;
  const blueAlong = blueAlongAt(s);
  const blueAcross = blueAcrossAt(s);
  const blueTurn = bank(blueAcross, blueAcrossAt(s + 1));
  // Off the pilot's ship's own wingtips — 0441: a saucer's rim is not a car's wheels.
  paintTrail(surface, view, s, BLUE_RUNS, true, -7.5 * size, -wingtip);
  paintTrail(surface, view, s, BLUE_RUNS, true, -7.5 * size, wingtip);
  /*
    ⚠️ **THE TILT — 0444: out of the bay as the hangar saw it, and over onto the fight's view.** The
    frames are consecutive in the atlas, side-on to from above; each is laid over the one before it at
    the share of the way between them, so six pictures turn without a step between any two.
  */
  const tilt = ease(s, TILT.from, TILT.from + TILT.steps) * (TILT_FRAMES - 1);
  const frame = Math.min(TILT_FRAMES - 1, Math.floor(tilt));
  /*
    ⚠️ **AND THE FLAMES TURN WITH IT — 0450.** The hangar's set burns where the ship's engines are seen
    side-on and the fight's where they are seen from above — one drive on a saucer's rim, then two — so
    each is laid at its share of the tilt, and only one is drawn once the turn is over.
  */
  const over = tilt / (TILT_FRAMES - 1);
  const flare = s < BLUE_OUT + 24 || s >= BLUE_RUNS || Math.floor(s / FLICKER_STEPS) % 2 === 1;
  const blueSurge = surgeAt(s, BLUE_RUNS);
  if (over < 1) {
    putOut(surface, view, flare ? PORT_SPRITE.blueFlare : PORT_SPRITE.blueBurn, blueAlong, blueAcross, 1 - over, blueTurn, size);
    if (blueSurge > 0) putOut(surface, view, PORT_SPRITE.blueSurge, blueAlong, blueAcross, blueSurge * (1 - over), blueTurn, size);
  }
  if (over > 0) {
    putOut(surface, view, flare ? PORT_SPRITE.blueTopFlare : PORT_SPRITE.blueTopBurn, blueAlong, blueAcross, over, blueTurn, size);
    if (blueSurge > 0) putOut(surface, view, PORT_SPRITE.blueTopSurge, blueAlong, blueAcross, blueSurge * over, blueTurn, size);
  }
  putOut(surface, view, PORT_SPRITE.blueSide + frame, blueAlong, blueAcross, 1, blueTurn, size);
  if (tilt > frame) putOut(surface, view, PORT_SPRITE.blueSide + frame + 1, blueAlong, blueAcross, tilt - frame, blueTurn, size);
}
