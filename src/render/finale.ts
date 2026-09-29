/**
 * The finale, drawn — `docs/decisions/0418-the-heart-lets-go.md`.
 *
 * ⚠️ **A PURE FUNCTION OF ONE CLOCK, on `src/render/port.ts`'s terms**, and on `tests/budget.test.ts`'s
 * hot list for the same reason: it runs every frame the finale is up, so it allocates nothing and only
 * blits. Every loop is an index over a constant count.
 *
 * Four shots. **The heart**, held still in the last place's own sky: the jellyfish melts off it, it beats
 * faster with nothing on it, and it bursts — and the Viper is where it was, and lights. **The Viper's
 * canopy**, close, with whoever was in it. **The fighter's**, with the one who came for them. **The two
 * ships**, side by side, and then gone together. What the golfers say is the chrome's, over this.
 *
 * Its atlas is the port's kinds, then the finale's, then the game's (`withTheGame` twice, in the shell),
 * so the ships and flames are `PORT_SPRITE`, the finale's own are at `FINALE_BASE`, and the jellyfish,
 * the heart and the sky are the game's at `GAME_BASE`.
 */

import {
  DRIP_EVERY,
  DRIP_FALL,
  DRIP_LIFE,
  FINALE_BEATS,
  FINALE_FADE,
  FINALE_KINDS,
  HEART,
  HEART_PERIOD,
  JELLY,
  MELT_SINK,
  SAVED_CLOSE,
  SAVING_CLOSE,
  SHARDS,
  SHARD_LIFE,
  SHARD_SPEED,
  TOGETHER,
  closeAlong,
} from '../content/finale.ts';
import { FLICKER_STEPS, LAUNCH_ACCEL, OUTSIDE_ZOOM, PORT_KINDS, PORT_SPRITE, SURGE_CURVE, SURGE_STEPS, TRAIL_EVERY, TRAIL_SAMPLES } from '../content/port.ts';
import { SPRITE } from '../content/sprites.ts';
import { ACROSS_SPAN, type View } from '../sim/camera.ts';
import { SCROLL_PER_STEP } from '../sim/flight.ts';
import { paintSky, type Sky } from './scene.ts';
import { screenX, screenY, type Surface } from './surface.ts';

/** Where the finale's own kinds start in its atlas, and where the game's do. */
export const FINALE_BASE = PORT_KINDS.length;
export const GAME_BASE = PORT_KINDS.length + FINALE_KINDS.length;

/** The finale's own sprites, by index in its atlas. */
const DRIP = FINALE_BASE + FINALE_KINDS.indexOf('drip');
const SHARD = FINALE_BASE + FINALE_KINDS.indexOf('shard');
const HEART_GLOW = FINALE_BASE + FINALE_KINDS.indexOf('heartGlow');
const SAVED = FINALE_BASE + FINALE_KINDS.indexOf('savedClose');
const SAVING = FINALE_BASE + FINALE_KINDS.indexOf('savingClose');

/** How far the sky drifts a step while a shot is held still, as a camera speed — the intro's bay. */
const HELD_DRIFT = SCROLL_PER_STEP / 10;

/** The Viper as the heart gives her up: a touch smaller than the heart she was inside. */
const FREED_GROW = 0.9;

/** How long the burst's flash takes to go out, and how big it grows. */
const BURST_FLASH_STEPS = 36;
const BURST_FLASH_GROW = 3.2;

/**
 * Draw the finale at `t` steps since its first frame. `sky` is the last place's, `time` the picture's own
 * clock for anything in it that moves by itself (`paintSky`'s veins).
 */
export function paintFinale(surface: Surface, view: View, t: number, sky: Sky): void {
  surface.clear();
  if (t < FINALE_BEATS.cutHeart) paintHeart(surface, view, t, sky);
  else if (t < FINALE_BEATS.cutSaved) paintClose(surface, view, t, sky, SAVED, closeAlong(view.alongSpan, false, SAVED_CLOSE.edge), SAVED_CLOSE.across);
  else if (t < FINALE_BEATS.cutSaving) paintClose(surface, view, t, sky, SAVING, closeAlong(view.alongSpan, true, SAVING_CLOSE.edge), SAVING_CLOSE.across);
  else paintTogether(surface, view, t - FINALE_BEATS.cutSaving, sky);
  const veil = veilAt(t);
  if (veil > 0) {
    const px = view.alongSpan * view.scale + ACROSS_SPAN * view.scale + (view.gutterAlong + view.gutterAcross) * 2;
    surface.blit(PORT_SPRITE.veil, screenX(view, view.alongSpan / 2, ACROSS_SPAN / 2), screenY(view, view.alongSpan / 2, ACROSS_SPAN / 2), px, 0, veil);
  }
}

/**
 * How much of the backdrop is over the picture at `t`: up out of it at the start, down and up across each
 * cut, and down into it at the end. Exported because the shell shows a speech bubble only while its
 * shot is clear of it.
 */
export function veilAt(t: number): number {
  if (t < FINALE_BEATS.fadeIn) return 1 - t / FINALE_BEATS.fadeIn;
  if (t >= FINALE_BEATS.fadeOut) return Math.min(1, (t - FINALE_BEATS.fadeOut) / (FINALE_BEATS.end - FINALE_BEATS.fadeOut));
  return Math.max(acrossCut(t, FINALE_BEATS.cutHeart), acrossCut(t, FINALE_BEATS.cutSaved), acrossCut(t, FINALE_BEATS.cutSaving));
}

/** Down into the backdrop over `FINALE_FADE` steps before `cut`, and up out of it over as many after. */
function acrossCut(t: number, cut: number): number {
  if (t >= cut - FINALE_FADE && t < cut) return (t - (cut - FINALE_FADE)) / FINALE_FADE;
  if (t >= cut && t < cut + FINALE_FADE) return 1 - (t - cut) / FINALE_FADE;
  return 0;
}

/** One blit at a world position, at the view's own scale times `grow`. */
function put(surface: Surface, view: View, sprite: number, along: number, across: number, alpha = 1, turn = 0, grow = 1): void {
  surface.blit(sprite, screenX(view, along, across), screenY(view, along, across), view.scale * grow, turn, alpha);
}

/** Smooth from 0 at `from` to 1 at `to`, and flat either side. */
function ease(t: number, from: number, to: number): number {
  const u = Math.min(1, Math.max(0, (t - from) / (to - from)));
  return u * u * (3 - 2 * u);
}

/** A number in [0, 1) that is always the same for `k` — so the drips and shards are placed, not rolled. */
function hash(k: number): number {
  const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * How many beats the heart has made by `t`: at `HEART_PERIOD.from` until it starts to quicken, then a
 * period falling steadily to `HEART_PERIOD.to` by the burst — the integral of a linear rate, so the
 * phase never jumps.
 */
function heartBeats(t: number): number {
  const q = FINALE_BEATS.quicken;
  const slow = 1 / HEART_PERIOD.from;
  if (t <= q) return t * slow;
  const span = FINALE_BEATS.burst - q;
  const s = Math.min(t, FINALE_BEATS.burst) - q;
  const fast = 1 / HEART_PERIOD.to;
  return q * slow + s * (slow + ((fast - slow) * s) / (2 * span));
}

/** How hard the heart is beating at `t`, from 0 to 1: a sharp lub on every beat, falling away. */
function heartBeat(t: number): number {
  const phase = heartBeats(t);
  const c = Math.max(0, Math.cos((phase - Math.floor(phase)) * Math.PI * 2));
  return c * c * c * c * c * c;
}

/** How much of a ship's surge is left `s` steps into a launch at `go` — the intro's `surgeAt`. */
function surgeAt(s: number, go: number): number {
  if (s < go || s >= go + SURGE_STEPS) return 0;
  return Math.pow(1 - (s - go) / SURGE_STEPS, SURGE_CURVE);
}

/*
  ── THE HEART ────────────────────────────────────────────────────────────────────────────────────
*/

function paintHeart(surface: Surface, view: View, t: number, sky: Sky): void {
  const beat = t < FINALE_BEATS.burst ? heartBeat(t) : 0;
  paintSky(surface, view, t * HELD_DRIFT, sky, t, beat, GAME_BASE);
  if (t < FINALE_BEATS.burst) {
    // Its light, rising to the burst.
    const building = ease(t, FINALE_BEATS.quicken, FINALE_BEATS.burst);
    put(surface, view, HEART_GLOW, HEART.along, HEART.across, 0.15 + 0.35 * beat + 0.5 * building * building, 0, 1 + 0.3 * building);
    put(surface, view, GAME_BASE + SPRITE.heart, HEART.along, HEART.across, 1, 0, HEART.grow * (1 + 0.07 * beat));
    // The jellyfish: sinking, shrinking and going to glass — and dripping as she goes.
    const melted = ease(t, FINALE_BEATS.melt, FINALE_BEATS.melted);
    if (melted < 1) {
      put(surface, view, GAME_BASE + SPRITE.boss14Open, JELLY.along, JELLY.across + MELT_SINK * melted, 1 - melted, 0, JELLY.grow * (1 - 0.15 * melted));
    }
    paintDrips(surface, view, t);
  } else {
    paintBurst(surface, view, t - FINALE_BEATS.burst);
  }
  // The Viper, where the heart was, from the burst on — and her engines, once she is lit.
  if (t >= FINALE_BEATS.burst) {
    if (t >= FINALE_BEATS.viperLit) put(surface, view, PORT_SPRITE.viperIdle, HEART.along, HEART.across, ease(t, FINALE_BEATS.viperLit, FINALE_BEATS.viperLit + 12), 0, FREED_GROW);
    put(surface, view, PORT_SPRITE.viper, HEART.along, HEART.across, 1, 0, FREED_GROW);
  }
  // The flash of the burst, over everything, going out.
  if (t >= FINALE_BEATS.burst && t < FINALE_BEATS.burst + BURST_FLASH_STEPS) {
    const u = (t - FINALE_BEATS.burst) / BURST_FLASH_STEPS;
    put(surface, view, PORT_SPRITE.flash, HEART.along, HEART.across, 1 - u, 0, 1 + BURST_FLASH_GROW * u);
  }
}

/** The drops running off her, one every `DRIP_EVERY` steps while she melts, each falling and fading. */
function paintDrips(surface: Surface, view: View, t: number): void {
  const count = Math.floor((FINALE_BEATS.melted - FINALE_BEATS.melt) / DRIP_EVERY);
  for (let k = 0; k < count; k++) {
    const born = FINALE_BEATS.melt + k * DRIP_EVERY;
    const age = t - born;
    if (age < 0 || age >= DRIP_LIFE) continue;
    const along = JELLY.along + (hash(k) - 0.5) * 56;
    const sink = MELT_SINK * ease(born, FINALE_BEATS.melt, FINALE_BEATS.melted);
    const across = JELLY.across + 16 + sink + 0.5 * DRIP_FALL * age * age;
    put(surface, view, DRIP, along, across, 1 - age / DRIP_LIFE);
  }
}

/** The heart in pieces: `SHARDS` of it thrown out from where it was, turning, slowing and going out. */
function paintBurst(surface: Surface, view: View, age: number): void {
  if (age >= SHARD_LIFE) return;
  const u = age / SHARD_LIFE;
  // Thrown hard and slowing: the distance an easing-out throw has covered by `u`.
  const out = SHARD_SPEED * SHARD_LIFE * (u - 0.5 * u * u);
  for (let k = 0; k < SHARDS; k++) {
    const angle = ((k + hash(k + 40) * 0.8) / SHARDS) * Math.PI * 2;
    const reach = out * (0.6 + 0.6 * hash(k + 80));
    const along = HEART.along + Math.cos(angle) * reach;
    const across = HEART.across + Math.sin(angle) * reach;
    put(surface, view, SHARD, along, across, 1 - u, age * (0.05 + 0.1 * hash(k + 120)) * (k % 2 === 0 ? 1 : -1), 0.8 + 0.8 * hash(k + 160));
  }
}

/*
  ── THE CLOSE-UPS ────────────────────────────────────────────────────────────────────────────────
*/

/** A cockpit, close, held still in front of the sky. */
function paintClose(surface: Surface, view: View, t: number, sky: Sky, sprite: number, along: number, across: number): void {
  paintSky(surface, view, t * HELD_DRIFT, sky, t, 0, GAME_BASE);
  put(surface, view, sprite, along, across);
}

/*
  ── TOGETHER ─────────────────────────────────────────────────────────────────────────────────────
*/

/** Steps into the shot at which each ship opens her throttle. */
const VIPER_RUNS = FINALE_BEATS.viperRuns - FINALE_BEATS.cutSaving;
const BLUE_RUNS = FINALE_BEATS.blueRuns - FINALE_BEATS.cutSaving;

/** How far a ship launched at `go` has travelled by `s`, from cruise, at the intro's own launch. */
function launched(s: number, go: number): number {
  if (s <= go) return 0;
  const d = s - go;
  return 0.5 * LAUNCH_ACCEL * d * d;
}

/** One blit in the shot, framed at the chase's zoom about the middle of the view, on the intro's terms. */
function putOut(surface: Surface, view: View, sprite: number, along: number, across: number, alpha = 1): void {
  const midAlong = view.alongSpan / 2;
  const midAcross = ACROSS_SPAN / 2;
  put(surface, view, sprite, midAlong + (along - midAlong) * OUTSIDE_ZOOM, midAcross + (across - midAcross) * OUTSIDE_ZOOM, alpha, 0, OUTSIDE_ZOOM);
}

/** A ship's trail off one wingtip, from the moment it opened up, on the intro's `paintTrail` terms. */
function paintTrail(surface: Surface, view: View, s: number, go: number, along: number, across: number, tipAlong: number, tipAcross: number): void {
  for (let k = 1; k <= TRAIL_SAMPLES; k++) {
    const at = s - k * TRAIL_EVERY;
    if (at < go) return;
    const was = along + launched(at, go);
    const before = along + launched(at - TRAIL_EVERY, go);
    const spread = Math.min(1, (was - before) / 6);
    const alpha = 0.75 * (1 - k / (TRAIL_SAMPLES + 1)) * spread;
    if (alpha > 0.01) putOut(surface, view, PORT_SPRITE.contrail, was + tipAlong, across + tipAcross, alpha);
  }
}

/** The two ships side by side, in a sky going past at the level's own rate — and then gone. */
function paintTogether(surface: Surface, view: View, s: number, sky: Sky): void {
  paintSky(surface, view, s * SCROLL_PER_STEP, sky, s, 0, GAME_BASE);
  const v = TOGETHER.viper;
  const b = TOGETHER.blue;
  const flicker = Math.floor(s / FLICKER_STEPS) % 2 === 0;
  paintTrail(surface, view, s, VIPER_RUNS, v.along, v.across, -8.7, 7.7);
  paintTrail(surface, view, s, VIPER_RUNS, v.along, v.across, -5.7, -6.4);
  const viperAlong = v.along + launched(s, VIPER_RUNS);
  putOut(surface, view, flicker ? PORT_SPRITE.viperBurn : PORT_SPRITE.viperFlare, viperAlong, v.across);
  const viperSurge = surgeAt(s, VIPER_RUNS);
  if (viperSurge > 0) putOut(surface, view, PORT_SPRITE.viperSurge, viperAlong, v.across, viperSurge);
  putOut(surface, view, PORT_SPRITE.viper, viperAlong, v.across);
  paintTrail(surface, view, s, BLUE_RUNS, b.along, b.across, -7.5, -12);
  paintTrail(surface, view, s, BLUE_RUNS, b.along, b.across, -7.5, 12);
  const blueAlong = b.along + launched(s, BLUE_RUNS);
  putOut(surface, view, flicker ? PORT_SPRITE.blueFlare : PORT_SPRITE.blueBurn, blueAlong, b.across);
  const blueSurge = surgeAt(s, BLUE_RUNS);
  if (blueSurge > 0) putOut(surface, view, PORT_SPRITE.blueSurge, blueAlong, b.across, blueSurge);
  putOut(surface, view, PORT_SPRITE.blue, blueAlong, b.across);
}
