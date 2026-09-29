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
 * Two shots. **The hangar** is held still, as a stage: the Viper lifts and goes, the alarm turns, the
 * bar's door slides back, the pilot runs to the fighter and leaps in, and it goes after her. **The
 * dark outside** flies with the two ships, so the stars run past and the chase holds still — until she
 * opens her throttle and leaves the frame, and the fighter follows.
 */

import {
  ALARM_PERIOD,
  BEATS,
  CHASE,
  FADE,
  FLICKER_STEPS,
  LAUNCH_ACCEL,
  LEAP_FROM,
  LIFT,
  OUTSIDE,
  PILOT_STANDS,
  PORT_EXTENT,
  PORT_SPRITE,
  RUN_FRAME_STEPS,
  RUN_SPEED,
  STAGE,
} from '../content/port.ts';
import { ACROSS_SPAN, type View } from '../sim/camera.ts';
import { screenX, screenY, type Surface } from './surface.ts';

/** How much bigger than its box a tile is blitted, so the seam between two can never show the space behind. */
const TILE_OVERLAP = 1.03;

/** How long a launch's flash takes to go out, in steps, and how big it is against its box. */
const FLASH_STEPS = 20;
const FLASH_GROW = 0.55;


/** Where the fighter's cockpit is, along from its centre — the point the pilot leaps for. */
const COCKPIT = 3;

/**
 * Draw the intro at `t` steps since its first frame — a fractional step between two, so the motion is
 * interpolated like everything else the renderer draws.
 */
export function paintPort(surface: Surface, view: View, t: number): void {
  surface.clear();
  if (t < BEATS.cut) paintHangar(surface, view, t);
  else paintOutside(surface, view, t - BEATS.outside);
  // The fades: up out of black at the start, down and up again across the cut, and down at the end.
  let dark = 0;
  if (t < BEATS.fadeIn) dark = 1 - t / BEATS.fadeIn;
  else if (t >= BEATS.cut - FADE && t < BEATS.outside) dark = Math.min(1, (t - (BEATS.cut - FADE)) / FADE);
  else if (t >= BEATS.outside && t < BEATS.outside + FADE) dark = 1 - (t - BEATS.outside) / FADE;
  else if (t >= BEATS.fadeOut) dark = Math.min(1, (t - BEATS.fadeOut) / (BEATS.end - BEATS.fadeOut));
  if (dark > 0) blackOut(surface, view, dark);
}

/** Cover the whole canvas in black at `alpha` — one blit of a one-unit square, scaled past every edge. */
function blackOut(surface: Surface, view: View, alpha: number): void {
  const px = view.alongSpan * view.scale + ACROSS_SPAN * view.scale + (view.gutterAlong + view.gutterAcross) * 2;
  surface.blit(PORT_SPRITE.black, screenX(view, view.alongSpan / 2, ACROSS_SPAN / 2), screenY(view, view.alongSpan / 2, ACROSS_SPAN / 2), px, 0, alpha);
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

/** How far a ship launched at `go` has travelled by `t`, from a standing start. */
function launched(t: number, go: number): number {
  if (t <= go) return 0;
  const s = t - go;
  return 0.5 * LAUNCH_ACCEL * s * s;
}

/** A field of tiles, run past at `offset` world units — both star fields, in both shots. */
function tileStars(surface: Surface, view: View, sprite: number, from: number, offset: number, alpha: number): void {
  const extent = PORT_EXTENT.stars;
  const shift = offset % extent;
  for (let along = from - shift + extent / 2; along < view.alongSpan + extent; along += extent) {
    for (let across = extent / 2; across < ACROSS_SPAN + extent / 2; across += extent) {
      put(surface, view, sprite, along, across, alpha);
    }
  }
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

/*
  ── THE HANGAR ───────────────────────────────────────────────────────────────────────────────────
*/

function paintHangar(surface: Surface, view: View, t: number): void {
  // Space past the bay, drifting.
  tileStars(surface, view, PORT_SPRITE.stars, STAGE.bay - 4, t * 0.03, 1);
  tileStars(surface, view, PORT_SPRITE.starsNear, STAGE.bay - 4, t * 0.08, 1);
  // The back wall, the truss and the lamps.
  const wall = PORT_EXTENT.wall;
  for (let along = wall / 2; along < STAGE.bay; along += wall) {
    for (let across = wall / 2; across < STAGE.deck + wall; across += wall) {
      put(surface, view, PORT_SPRITE.wall, along, across, 1, 0, TILE_OVERLAP);
    }
  }
  const ceiling = PORT_EXTENT.ceiling;
  for (let along = ceiling / 2; along < STAGE.bay; along += ceiling) {
    put(surface, view, PORT_SPRITE.ceiling, along, STAGE.ceiling - ceiling / 2, 1, 0, TILE_OVERLAP);
  }
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
  const lamp = PORT_EXTENT.lamp;
  for (let i = 0; i < STAGE.lamps.length; i++) {
    put(surface, view, PORT_SPRITE.lamp, STAGE.lamps[i]!, STAGE.ceiling - 2 + lamp / 2);
  }
  // The bar: the light inside it and the door that slides back across it, then the front of it.
  const open = ease(t, BEATS.door, BEATS.pilotOut);
  if (open > 0) put(surface, view, PORT_SPRITE.spill, STAGE.doorway.along, STAGE.doorway.across, open);
  put(surface, view, PORT_SPRITE.door, STAGE.doorway.along - 13 * open, STAGE.doorway.across);
  put(surface, view, PORT_SPRITE.bar, STAGE.bar.along, STAGE.bar.across);
  // The deck.
  const deck = PORT_EXTENT.deck;
  for (let along = deck / 2; along < STAGE.bay; along += deck) {
    for (let across = STAGE.deck + deck / 2; across < ACROSS_SPAN + deck / 2; across += deck) {
      put(surface, view, PORT_SPRITE.deck, along, across, 1, 0, TILE_OVERLAP);
    }
  }
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
  // The pilot: out of the door, across the deck, and up into the cockpit.
  const blueBob = t < BEATS.blueGo ? Math.sin(t * 0.06 + 1.7) * 0.6 : 0;
  const blueAlong = STAGE.bluePad + launched(t, BEATS.blueGo);
  const blueAcross = STAGE.blueRide - LIFT * ease(t, BEATS.blueLift, BEATS.blueGo) + blueBob;
  paintBlue(surface, view, t, blueAlong, blueAcross, BEATS.blueLit, BEATS.blueGo);
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
      const toAlong = blueAlong + COCKPIT;
      const along = LEAP_FROM + (toAlong - LEAP_FROM) * u;
      const across = fromAcross + (blueAcross - fromAcross) * u - 14 * u * (1 - u);
      put(surface, view, PORT_SPRITE.pilotLeap, along, across, 1 - ease(u, 0.6, 1), 0, 1 - 0.45 * u);
    }
  }
  // The canopy catching the light as the pilot drops in.
  if (t >= BEATS.pilotIn - 6 && t < BEATS.pilotIn + 18) {
    const blink = 1 - Math.abs(t - (BEATS.pilotIn + 4)) / 14;
    if (blink > 0) put(surface, view, PORT_SPRITE.flash, blueAlong + COCKPIT, blueAcross, blink * 0.5, 0, 0.25);
  }
  // The edge of the room, over everything that flies out through it.
  put(surface, view, PORT_SPRITE.field, STAGE.bay + 1, (STAGE.ceiling + STAGE.deck) / 2, 0.8);
  put(surface, view, PORT_SPRITE.bayTop, STAGE.bay + 2, PORT_EXTENT.bayTop / 2 - 4);
  put(surface, view, PORT_SPRITE.bayBottom, STAGE.bay + 2, ACROSS_SPAN - PORT_EXTENT.bayBottom / 2 + 4);
}

/** The Viper and her engine, and the flash she leaves the pad in. */
function paintViper(surface: Surface, view: View, t: number, along: number, across: number, lit: number, go: number): void {
  const flame = flameOf(t, lit, go, PORT_SPRITE.viperIdle, PORT_SPRITE.viperBurn, PORT_SPRITE.viperFlare);
  if (flame >= 0) put(surface, view, flame, along, across);
  put(surface, view, PORT_SPRITE.viper, along, across);
  if (t >= go && t < go + FLASH_STEPS) {
    put(surface, view, PORT_SPRITE.flash, along - 16, across, 0.8 * (1 - (t - go) / FLASH_STEPS), 0, FLASH_GROW);
  }
}

/** The fighter and its engine, and the flash it leaves the pad in. */
function paintBlue(surface: Surface, view: View, t: number, along: number, across: number, lit: number, go: number): void {
  const flame = flameOf(t, lit, go, PORT_SPRITE.blueIdle, PORT_SPRITE.blueBurn, PORT_SPRITE.blueFlare);
  if (flame >= 0) put(surface, view, flame, along, across);
  put(surface, view, PORT_SPRITE.blue, along, across);
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

function paintOutside(surface: Surface, view: View, s: number): void {
  if (s < 0) return;
  tileStars(surface, view, PORT_SPRITE.stars, 0, fallen(s, OUTSIDE.far), 1);
  tileStars(surface, view, PORT_SPRITE.starsNear, 0, fallen(s, OUTSIDE.near), 1);
  const station = stationAlong(s);
  if (station > -PORT_EXTENT.station) put(surface, view, PORT_SPRITE.station, station, STATION_ACROSS);
  // The Viper, ahead, weaving — until she opens her throttle and is gone.
  const runs = BEATS.viperRuns - BEATS.outside;
  const v = CHASE.viper;
  const viperWeave = Math.sin((s / v.period) * Math.PI * 2);
  const viperAlong = v.along + launched(s, runs);
  const viperAcross = v.across + v.weave * viperWeave;
  const viperTurn = 0.12 * Math.cos((s / v.period) * Math.PI * 2);
  const viperFlame = s < runs ? PORT_SPRITE.viperBurn : PORT_SPRITE.viperFlare;
  put(surface, view, Math.floor(s / FLICKER_STEPS) % 2 === 0 ? viperFlame : PORT_SPRITE.viperFlare, viperAlong, viperAcross, 1, viperTurn);
  put(surface, view, PORT_SPRITE.viper, viperAlong, viperAcross, 1, viperTurn);
  // The fighter: out of the station's bay, up to the chase, weaving after her — and then after her.
  const b = CHASE.blue;
  const out = 6;
  const settled = 72;
  const mouthAlong = station + BAY_MOUTH_ALONG;
  const mouthAcross = STATION_ACROSS + BAY_MOUTH_ACROSS;
  if (s < out) return;
  const arrive = ease(s, out, settled);
  const blueWeave = Math.sin((s / b.period) * Math.PI * 2 + 1.2) * ease(s, out, settled + 40);
  const blueAlong = mouthAlong + (b.along - mouthAlong) * arrive + launched(s, BEATS.blueRuns - BEATS.outside);
  const blueAcross = mouthAcross + (b.across - mouthAcross) * arrive + b.weave * blueWeave;
  const blueTurn = 0.12 * Math.cos((s / b.period) * Math.PI * 2 + 1.2) * ease(s, out, settled + 40);
  const blueFlame = s < out + 24 || s >= BEATS.blueRuns - BEATS.outside || Math.floor(s / FLICKER_STEPS) % 2 === 1 ? PORT_SPRITE.blueFlare : PORT_SPRITE.blueBurn;
  put(surface, view, blueFlame, blueAlong, blueAcross, 1, blueTurn);
  put(surface, view, PORT_SPRITE.blue, blueAlong, blueAcross, 1, blueTurn);
}
