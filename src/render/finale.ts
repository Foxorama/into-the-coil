/**
 * The finale, drawn — `docs/decisions/0418-the-heart-lets-go.md`, and
 * `docs/decisions/0426-the-finale-is-the-fight-going-on.md` for why it is one shot.
 *
 * ⚠️ **A PURE FUNCTION OF ONE CLOCK, on `src/render/port.ts`'s terms**, and on `tests/budget.test.ts`'s
 * hot list for the same reason: it runs every frame the finale is up, so it allocates nothing and only
 * blits. Every loop is an index over a constant count.
 *
 * ⚠️ **ONE SHOT, AND IT IS THE FIGHT'S.** The scene under it is painted by `paintScene` itself, from
 * what the fight was drawing when its last boss's death beat ended (`FinaleScene`): the same sky at the
 * same camera, the same landmarks and the vessels still laid to the heart — with no bodies in it, since
 * nothing is left alive. Over that, the heart races, catches fire and bursts; the Viper is thrown out
 * of it; the fighter comes up beside her; and the two fly on together until they open up and go.
 * What the golfers say is the chrome's, over this, placed off the same functions the ships are.
 *
 * Its atlas is the game's, then the port's, then the finale's own — the GAME's first, so `paintScene`
 * draws the fight's scene from it unchanged — so the port's sprites are at `PORT_BASE` and the finale's
 * at `FINALE_BASE`.
 */

import {
  AFTER_FIRES,
  AFTER_FIRE_STEPS,
  EMBERS,
  EMBER_LIFE,
  EMBER_SPEED,
  ERUPTIONS,
  ERUPT_REACH,
  FINALE_BEATS,
  FINALE_KINDS,
  HEART_CLENCH,
  HEART_PERIOD,
  HEART_SHAKE,
  HEART_SWELL,
  RING_GROW,
  RING_LIFE,
  SHARDS,
  SHARD_LIFE,
  SHARD_SPEED,
  VIPER_GROW,
  cameraAt,
  ease,
  eruptionAt,
  fighterAt,
  viperAt,
  viperTurn,
  type FinaleFrom,
} from '../content/finale.ts';
import { THRUST } from '../content/exhaust.ts';
import type { Pools } from '../content/pools.ts';
import { FLICKER_STEPS, PORT_KINDS, PORT_SPRITE, SURGE_CURVE, SURGE_STEPS } from '../content/port.ts';
import { SPRITE, SPRITE_KINDS } from '../content/sprites.ts';
import { ACROSS_SPAN, type View } from '../sim/camera.ts';
import type { Corridor } from '../sim/corridor.ts';
import type { Entity } from '../sim/entity.ts';
import type { Pool } from '../sim/pool.ts';
import { paintScene, type Landmarks, type Room, type Sky } from './scene.ts';
import { screenX, screenY, type Surface } from './surface.ts';

/** Where the port's kinds start in the finale's atlas, and where its own do. */
export const PORT_BASE = SPRITE_KINDS.length;
export const FINALE_BASE = SPRITE_KINDS.length + PORT_KINDS.length;

/** The finale's own sprites, by index in its atlas. */
const SHARD = FINALE_BASE + FINALE_KINDS.indexOf('shard');
const HEART_GLOW = FINALE_BASE + FINALE_KINDS.indexOf('heartGlow');
const RING = FINALE_BASE + FINALE_KINDS.indexOf('ring');

/**
 * What the fight was drawing when its last boss's death beat ended — everything `paintScene` needs to
 * draw that frame again with nothing alive in it, and where the heart and the fighter were in it.
 * Filled once by the shell as the finale starts; read, never written, by the painter.
 */
export interface FinaleScene {
  sky: Sky;
  landmarks: Landmarks;
  levelOrigin: number;
  room: Room | null;
  corridor: Corridor | null;
  pools: Pools | null;
  /** The camera, in world units, on the fight's last frame, and how far it was going a step. */
  camera: number;
  scroll: number;
  /** The picture's own clock on the fight's last frame, so the sky's veins do not jump. */
  time: number;
  /** How hard the heart throbs on a beat — the seat's own `throb`. */
  throb: number;
  /** The fighter as the fight last drew it: its sprite in the game's atlas. */
  ship: number;
  from: FinaleFrom;
}

/** A finale scene with nothing held yet — what a world starts with, before any fight has ended. Cold. */
export function makeFinaleScene(): FinaleScene {
  return {
    sky: [],
    landmarks: [],
    levelOrigin: 0,
    room: null,
    corridor: null,
    pools: null,
    camera: 0,
    scroll: 0,
    time: 0,
    throb: 0,
    ship: SPRITE.fighter,
    from: { heartAlong: 150, heartAcross: ACROSS_SPAN / 2, shipAlong: 40, shipAcross: ACROSS_SPAN / 2 },
  };
}

/** No bodies: nothing is left alive in the finale's scene. */
const NO_LAYERS: readonly Pool<Entity>[] = [];

/** Where the heart is this frame, in the world, for `paintScene`'s vessels — written, never allocated. */
// @setup: two numbers for the lifetime of the module.
const HEART_AT = new Float64Array(2);
/** Where each ship is this frame, in the view — the same functions the shell places their bubbles by. */
// @setup: two numbers for the lifetime of the module.
const VIPER_AT = new Float64Array(2);
// @setup: two numbers for the lifetime of the module.
const FIGHTER_AT = new Float64Array(2);

/** The fireball's four frames, and how long each is held — the game's own `burst`. */
const FIRE = [SPRITE.burst0, SPRITE.burst1, SPRITE.burst2, SPRITE.burst3] as const;
const FIRE_HOLD = 6;
const FIRE_LIFE = FIRE.length * FIRE_HOLD;
const EMBER = [SPRITE.ember0, SPRITE.ember1, SPRITE.ember2] as const;

/** How long the burst's flash takes to go out, and how big it grows. */
const FLASH_STEPS = 40;
const FLASH_GROW = 3.4;

/** How long the heart's light lingers after it bursts. */
const AFTERGLOW_STEPS = 80;

/**
 * Draw the finale at `t` steps since its first frame, over the scene the fight left.
 */
export function paintFinale(surface: Surface, view: View, t: number, scene: FinaleScene): void {
  const from = scene.from;
  const gone = cameraAt(t, scene.scroll);
  const camera = scene.camera + gone;
  const alive = t < FINALE_BEATS.burst;
  const beat = alive ? heartBeat(t) : 0;
  // The heart shakes where it stands as it races — its middle, in the view.
  const shake = HEART_SHAKE * ease(t, FINALE_BEATS.erupt, FINALE_BEATS.squeeze);
  const heartAlong = from.heartAlong + shake * (hash(t | 0) - 0.5) * 2;
  const heartAcross = from.heartAcross + shake * (hash((t | 0) + 500) - 0.5) * 2;
  HEART_AT[0] = camera + heartAlong;
  HEART_AT[1] = heartAcross;
  // And the warp's streaks as they open up and go — 0340's own, for the only other time a ship leaves.
  const warp = ease(t, FINALE_BEATS.viperRuns, FINALE_BEATS.fadeOut);
  paintScene(surface, view, NO_LAYERS, camera, 0, scene.sky, null, scene.landmarks, scene.levelOrigin, scene.room, warp, scene.time + t, scene.corridor, scene.pools, -1, beat, alive ? HEART_AT : null);
  if (alive) paintHeart(surface, view, t, beat, heartAlong, heartAcross, scene.throb);
  else paintBurst(surface, view, t - FINALE_BEATS.burst, from.heartAlong - (gone - cameraAt(FINALE_BEATS.burst, scene.scroll)), from.heartAcross);
  if (!alive) paintViper(surface, view, t, from);
  paintFighter(surface, view, t, from, scene.ship);
  if (!alive && t < FINALE_BEATS.burst + FLASH_STEPS) {
    const u = (t - FINALE_BEATS.burst) / FLASH_STEPS;
    put(surface, view, PORT_BASE + PORT_SPRITE.flash, from.heartAlong, from.heartAcross, 1 - u, 0, 1.2 + FLASH_GROW * u);
  }
  const veil = veilAt(t);
  if (veil > 0) {
    const px = view.alongSpan * view.scale + ACROSS_SPAN * view.scale + (view.gutterAlong + view.gutterAcross) * 2;
    surface.blit(PORT_BASE + PORT_SPRITE.veil, screenX(view, view.alongSpan / 2, ACROSS_SPAN / 2), screenY(view, view.alongSpan / 2, ACROSS_SPAN / 2), px, 0, veil);
  }
}

/**
 * How much of the backdrop is over the picture at `t`: none at all until the end, because the first
 * frame is the fight's — and then down into it, for the victory screen to be drawn on.
 */
export function veilAt(t: number): number {
  if (t < FINALE_BEATS.fadeOut) return 0;
  return Math.min(1, (t - FINALE_BEATS.fadeOut) / (FINALE_BEATS.end - FINALE_BEATS.fadeOut));
}

/** One blit at a position in the view, at the view's own scale times `grow`. */
function put(surface: Surface, view: View, sprite: number, along: number, across: number, alpha = 1, turn = 0, grow = 1): void {
  surface.blit(sprite, screenX(view, along, across), screenY(view, along, across), view.scale * grow, turn, alpha);
}

/** A number in [0, 1) that is always the same for `k` — so fire and shards are placed, not rolled. */
function hash(k: number): number {
  const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * How many beats the heart has made by `t`: at `HEART_PERIOD.from` until it starts to race, then a
 * period falling steadily to `HEART_PERIOD.to` by the time it clenches — the integral of a linear rate,
 * so the phase never jumps.
 */
function heartBeats(t: number): number {
  const q = FINALE_BEATS.quicken;
  const slow = 1 / HEART_PERIOD.from;
  if (t <= q) return t * slow;
  const span = FINALE_BEATS.squeeze - q;
  const s = Math.min(t, FINALE_BEATS.squeeze) - q;
  const fast = 1 / HEART_PERIOD.to;
  return q * slow + s * (slow + ((fast - slow) * s) / (2 * span)) + Math.max(0, t - FINALE_BEATS.squeeze) * fast;
}

/** How hard the heart is beating at `t`, from 0 to 1: a sharp lub on every beat, falling away. */
function heartBeat(t: number): number {
  const phase = heartBeats(t);
  const c = Math.max(0, Math.cos((phase - Math.floor(phase)) * Math.PI * 2));
  return c * c * c * c * c * c;
}

/** How much of a ship's surge is left at `t` of a launch at `go` — the intro's `surgeAt`. */
function surgeAt(t: number, go: number): number {
  if (t < go || t >= go + SURGE_STEPS) return 0;
  return Math.pow(1 - (t - go) / SURGE_STEPS, SURGE_CURVE);
}

/** A fireball `age` steps old at a place in the view, at `grow` — its four frames, going out on the last. */
function fire(surface: Surface, view: View, age: number, along: number, across: number, grow: number): void {
  if (age < 0 || age >= FIRE_LIFE) return;
  const frame = Math.floor(age / FIRE_HOLD);
  put(surface, view, FIRE[frame]!, along, across, frame === FIRE.length - 1 ? 1 - (age % FIRE_HOLD) / FIRE_HOLD : 1, 0, grow);
}

/*
  ── THE HEART, RACING ──────────────────────────────────────────────────────────────────────────────
*/

/**
 * The heart with nothing on it: beating faster and faster, swelling and lit from inside, fire breaking
 * out of it closer and closer together, and at the last a clench — the breath before it goes.
 */
function paintHeart(surface: Surface, view: View, t: number, beat: number, along: number, across: number, throb: number): void {
  const building = ease(t, FINALE_BEATS.quicken, FINALE_BEATS.burst);
  const clench = 1 - (1 - HEART_CLENCH) * ease(t, FINALE_BEATS.squeeze, FINALE_BEATS.burst);
  const size = (1 + HEART_SWELL * ease(t, FINALE_BEATS.quicken, FINALE_BEATS.squeeze)) * clench;
  put(surface, view, HEART_GLOW, along, across, 0.1 + 0.3 * beat + 0.6 * building * building, 0, 0.7 + 0.5 * building);
  put(surface, view, SPRITE.heart, along, across, 1, 0, size * (1 + throb * beat));
  for (let k = 0; k < ERUPTIONS; k++) {
    const angle = hash(k + 7) * Math.PI * 2;
    const reach = ERUPT_REACH * (0.3 + 0.7 * hash(k + 31)) * size;
    fire(surface, view, t - eruptionAt(k), along + Math.cos(angle) * reach, across + Math.sin(angle) * reach, 0.9 + 0.6 * (k / ERUPTIONS));
  }
}

/*
  ── THE BURST ──────────────────────────────────────────────────────────────────────────────────────
*/

/**
 * The heart in pieces, `age` steps after it went, about where it stood — `along` is that place in the
 * view this frame, which falls behind as the camera goes on. Its light going out, a ring of it going
 * out across the lane, shards of it and embers thrown and slowing, and fire going on after it.
 */
function paintBurst(surface: Surface, view: View, age: number, along: number, across: number): void {
  if (age < AFTERGLOW_STEPS) {
    const u = age / AFTERGLOW_STEPS;
    put(surface, view, HEART_GLOW, along, across, (1 - u) * (1 - u), 0, 1.3 + 1.2 * u);
  }
  if (age < RING_LIFE) {
    const u = age / RING_LIFE;
    const out = 1 - (1 - u) * (1 - u);
    put(surface, view, RING, along, across, 1 - u, 0, 0.3 + RING_GROW * out);
  }
  for (let k = 0; k < AFTER_FIRES; k++) {
    const angle = hash(k + 200) * Math.PI * 2;
    const reach = 6 + 20 * hash(k + 230);
    fire(surface, view, age - Math.floor((k / AFTER_FIRES) * AFTER_FIRE_STEPS), along + Math.cos(angle) * reach, across + Math.sin(angle) * reach, 1.2 + 0.8 * hash(k + 260));
  }
  if (age < SHARD_LIFE) {
    const u = age / SHARD_LIFE;
    // Thrown hard and slowing: how far an easing-out throw has covered by `u`.
    const out = SHARD_SPEED * SHARD_LIFE * (u - 0.5 * u * u);
    for (let k = 0; k < SHARDS; k++) {
      const angle = ((k + hash(k + 40) * 0.8) / SHARDS) * Math.PI * 2;
      const reach = 4 + out * (0.45 + 0.8 * hash(k + 80));
      const spin = age * (0.04 + 0.12 * hash(k + 120)) * (k % 2 === 0 ? 1 : -1);
      put(surface, view, SHARD, along + Math.cos(angle) * reach, across + Math.sin(angle) * reach, 1 - u * u, spin, 0.7 + 1.1 * hash(k + 160));
    }
  }
  if (age < EMBER_LIFE) {
    const u = age / EMBER_LIFE;
    const out = EMBER_SPEED * EMBER_LIFE * (u - 0.5 * u * u);
    const frame = EMBER[Math.min(EMBER.length - 1, Math.floor(u * EMBER.length))]!;
    for (let k = 0; k < EMBERS; k++) {
      const angle = hash(k + 300) * Math.PI * 2;
      const reach = 2 + out * (0.4 + 0.9 * hash(k + 340));
      put(surface, view, frame, along + Math.cos(angle) * reach, across + Math.sin(angle) * reach, 1 - u, 0, 0.8 + 0.6 * hash(k + 380));
    }
  }
}

/*
  ── THE SHIPS ──────────────────────────────────────────────────────────────────────────────────────
*/

/**
 * The Viper, from the burst: thrown out rolling where the heart was, her engines lighting, coming round
 * to fly beside the fighter, and then opening up and going. The port's bitmaps of her, at the game's
 * scale, turned with her roll.
 */
function paintViper(surface: Surface, view: View, t: number, from: FinaleFrom): void {
  viperAt(t, from, VIPER_AT);
  const along = VIPER_AT[0]!;
  const across = VIPER_AT[1]!;
  const turn = viperTurn(t);
  if (t >= FINALE_BEATS.viperLit) {
    const lit = ease(t, FINALE_BEATS.viperLit, FINALE_BEATS.viperLit + 12);
    if (t < FINALE_BEATS.viperRuns) put(surface, view, PORT_BASE + PORT_SPRITE.viperIdle, along, across, lit, turn, VIPER_GROW);
    else {
      const flicker = Math.floor(t / FLICKER_STEPS) % 2 === 0;
      put(surface, view, PORT_BASE + (flicker ? PORT_SPRITE.viperBurn : PORT_SPRITE.viperFlare), along, across, 1, turn, VIPER_GROW);
      const surge = surgeAt(t, FINALE_BEATS.viperRuns);
      if (surge > 0) put(surface, view, PORT_BASE + PORT_SPRITE.viperSurge, along, across, surge, turn, VIPER_GROW);
    }
  }
  put(surface, view, PORT_BASE + PORT_SPRITE.viper, along, across, 1, turn, VIPER_GROW);
}

/**
 * The fighter, as the fight left it — the same hull, whatever its guns made it — and its own flame from
 * `src/content/exhaust.ts`: idling while it waits, burning as it comes up beside her, and burning long
 * as it opens up and goes.
 */
function paintFighter(surface: Surface, view: View, t: number, from: FinaleFrom, ship: number): void {
  fighterAt(t, from, FIGHTER_AT);
  const along = FIGHTER_AT[0]!;
  const across = FIGHTER_AT[1]!;
  const pulse = Math.floor(t / 3) % 2;
  const pushing = (t >= FINALE_BEATS.formUp && t < FINALE_BEATS.formed - 30) || t >= FINALE_BEATS.blueRuns;
  const row = pushing ? THRUST.burn : THRUST.idle;
  const long = 1 + 1.6 * ease(t, FINALE_BEATS.blueRuns, FINALE_BEATS.blueRuns + 30);
  put(surface, view, row.frames.level[pulse]!, along - row.trail * long, across, 1, 0, long);
  put(surface, view, ship, along, across);
}
