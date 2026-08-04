/**
 * Boot: put a canvas on the page, bake the art, and start the loop.
 *
 * Everything expensive happens here, once. `src/app/frame.ts` is what runs afterwards, and the split
 * is deliberate — see `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`. This file is
 * allowed to allocate; the one next door is not.
 *
 * ⚠️ **A resize is not a frame.** Rotation, a window drag and a DPI change all land here, where
 * re-baking an atlas is affordable. The frame never learns that any of it happened — it reads a
 * `World` whose `view` and `surface` were updated between frames.
 */

import { PALETTES, type PaletteName } from '../content/palette.ts';
import { ACROSS_SPAN, MAX_ALONG_SPAN, type View, viewOf } from '../sim/camera.ts';
import { type Entity, makeEntity, reset } from '../sim/entity.ts';
import { Pool } from '../sim/pool.ts';
import { makeRng } from '../sim/rng.ts';
import { atlasIsStale, bakeAtlas, SPRITE, viewFor } from '../render/bake.ts';
import { CanvasSurface, renderScale } from '../render/canvas.ts';
import { GameFrame, type World } from './frame.ts';
import { runLoop } from './loop.ts';

/**
 * The entity ceiling, and it is 0022's worst-case scene rather than a guess: ~150 enemy bullets,
 * ~80 player projectiles, ~40 enemies, ~200 particles. The frame budget is asserted against this
 * number in `tests/budget.test.ts`, so the running game may not quietly exceed what was measured.
 */
const CAPACITY = 500;

/** World units the camera advances per fixed step — 36 units a second at 60Hz. */
const SCROLL_PER_STEP = 0.6;

export interface Mounted {
  /** Stop the loop and drop the resize listener. */
  stop(): void;
  /** The canvas that was created, so a caller can label or style it. */
  canvas: HTMLCanvasElement;
}

/** Size the backing store for a viewport, honouring 0022's DPR cap, and draw in CSS pixels. */
function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): number {
  const dpr = renderScale(window.devicePixelRatio);
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  canvas.style.width = String(cssWidth) + 'px';
  canvas.style.height = String(cssHeight) + 'px';
  // Everything above this line is in device pixels; everything after it is in CSS pixels.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return dpr;
}

/**
 * Mount the game into `host` and start it.
 *
 * Returns `null` when the browser will not give a 2D context, which is a real state on a locked-down
 * or ancient engine — and it is reported rather than thrown, because the boot watchdog is the thing
 * that should be telling the player what happened.
 */
export function mount(host: Element, palette: PaletteName = 'vivid'): Mounted | null {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  if (ctx === null) return null;
  host.appendChild(canvas);

  const colours = PALETTES[palette];
  const pool = new Pool<Entity>(CAPACITY, makeEntity);

  const ship = pool.spawn()!;
  reset(ship, 40, 50, SPRITE.ship);
  ship.velAlong = SCROLL_PER_STEP;

  /*
    Seed the field, so the first frame is not empty.

    ⚠️ Worth understanding rather than copying. Ongoing spawns arrive at `spawnAlong`, which is
    beyond the widest view ANY device can have (0023) — so at this scroll rate a newly spawned object
    takes about three seconds to become visible. That is exactly right for a real level, which is
    authored with content already in front of the player, and exactly wrong for a scene whose whole
    job is to prove the page draws. The browser test caught it as a nearly-blank canvas.

    Its own named stream, per 0021: seeding the field must not move the ongoing spawns by one draw.
  */
  const seed = makeRng('proof-scene').stream('seed');
  for (let i = 0; i < 120; i++) {
    const e = pool.spawn();
    if (e === null) break;
    reset(e, seed.range(10, MAX_ALONG_SPAN), seed.range(8, ACROSS_SPAN - 8), 1 + seed.int(0, 2));
    e.velAcross = seed.range(-0.12, 0.12);
  }

  const measure = (): View => viewOf(viewportWidth(host), viewportHeight(host));
  let view = measure();
  let dpr = fitCanvas(canvas, ctx, viewportWidth(host), viewportHeight(host));
  let atlas = bakeAtlas(colours, viewFor(view.alongAxis), view.scale * dpr);
  const surface = new CanvasSurface(ctx, atlas);
  surface.setSize(viewportWidth(host), viewportHeight(host), colours.space);

  const world: World = {
    pool,
    view,
    surface,
    // One named stream, per docs/decisions/0021-one-stream-per-concern.md, so a cosmetic roll added
    // here can never move a draw that matters.
    rng: makeRng('proof-scene').stream('debris'),
    cameraAlong: 0,
    scrollPerStep: SCROLL_PER_STEP,
    spawnIn: 1,
    ship,
  };

  /** Re-measure, re-fit and — only if the orientation or resolution actually moved — re-bake. */
  const onResize = (): void => {
    const next = measure();
    const width = viewportWidth(host);
    const height = viewportHeight(host);
    const nextDpr = fitCanvas(canvas, ctx, width, height);
    const wantView = viewFor(next.alongAxis);
    const wantResolution = next.scale * nextDpr;
    if (atlasIsStale(atlas, wantView, wantResolution)) {
      atlas = bakeAtlas(colours, wantView, wantResolution);
      surface.setAtlas(atlas);
    }
    view = next;
    dpr = nextDpr;
    world.view = next;
    surface.setSize(width, height, colours.space);
  };

  window.addEventListener('resize', onResize);
  const stopLoop = runLoop(new GameFrame(world));

  return {
    canvas,
    stop(): void {
      window.removeEventListener('resize', onResize);
      stopLoop();
    },
  };
}

/** The host's width, falling back to the viewport when it has not been laid out yet. */
function viewportWidth(host: Element): number {
  return host.clientWidth || window.innerWidth;
}

function viewportHeight(host: Element): number {
  return host.clientHeight || window.innerHeight;
}
