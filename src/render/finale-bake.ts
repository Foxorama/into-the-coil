/**
 * The finale's own art, baked once — `docs/decisions/0418-the-heart-lets-go.md`, and
 * `docs/decisions/0426-the-finale-is-the-fight-going-on.md`.
 *
 * ⚠️ **ONLY WHAT NOTHING ELSE DRAWS.** The Viper, her flames and surge, and the flash are the port's
 * (`bakePort`); the fighter, its flame, the heart, the fire, the embers and the sky are the game's own,
 * as the fight drew them. What is here is what the finale adds: the shards the heart bursts into, its
 * light, and the ring the burst sends out across the lane.
 *
 * ⚠️ **COLD, on `port-bake.ts`'s terms**: baked when the finale starts, never in a frame, and on
 * `tests/budget.test.ts`'s cold list. Drawn in WORLD UNITS about the sprite's centre.
 */

import { FINALE_EXTENT, FINALE_KINDS, type FinaleKind } from '../content/finale.ts';
import { bakeSize, rgba, type Atlas } from './bake.ts';

/**
 * The finale's inks that no palette role means, on `PORT_INK`'s terms: the heart's own flesh, rose and
 * violet (`drawHeartSeat` in `bake.ts`).
 */
const FINALE_INK = {
  flesh: '#2a0610',
  rose: '#ff5c7a',
  violet: '#a557ff',
} as const;

/** Bake the finale's pieces, at the resolution they will be blitted at. */
export function bakeFinale(pixelsPerUnit: number): Atlas {
  return {
    view: 'side',
    theme: 'core',
    bitmaps: FINALE_KINDS.map((kind) => bakePiece(kind, pixelsPerUnit)),
    extents: FINALE_KINDS.map((kind) => FINALE_EXTENT[kind]),
    pixelsPerUnit,
  };
}

function bakePiece(kind: FinaleKind, pixelsPerUnit: number): HTMLCanvasElement {
  const extent = FINALE_EXTENT[kind];
  const size = bakeSize(extent, pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('bakeFinale: no 2D context — this browser cannot run the game');
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / extent, size / extent);
  const h = extent / 2;
  switch (kind) {
    case 'shard':
      paintShard(ctx, h);
      return canvas;
    case 'heartGlow': {
      const light = ctx.createRadialGradient(0, 0, 0, 0, 0, h);
      light.addColorStop(0, rgba('#ffffff', 0.9));
      light.addColorStop(0.18, rgba(FINALE_INK.rose, 0.75));
      light.addColorStop(0.55, rgba(FINALE_INK.violet, 0.28));
      light.addColorStop(1, rgba(FINALE_INK.violet, 0));
      ctx.fillStyle = light;
      ctx.fillRect(-h, -h, extent, extent);
      return canvas;
    }
    case 'ring':
      paintRing(ctx, h);
      return canvas;
    default: {
      const never: never = kind;
      throw new Error(`bakeFinale: unbaked ${String(never)}`);
    }
  }
}

/** A shard of the heart: a jagged piece of its dark flesh, with its rose light along one torn edge. */
function paintShard(ctx: CanvasRenderingContext2D, h: number): void {
  const at = (x: number, y: number): [number, number] => [x * h, y * h];
  const points = [at(-0.9, -0.2), at(-0.3, -0.85), at(0.35, -0.55), at(0.9, 0.1), at(0.4, 0.8), at(-0.5, 0.55)];
  ctx.fillStyle = FINALE_INK.flesh;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = FINALE_INK.rose;
  ctx.lineWidth = h * 0.16;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(...points[1]!);
  ctx.lineTo(...points[2]!);
  ctx.lineTo(...points[3]!);
  ctx.stroke();
  ctx.strokeStyle = rgba(FINALE_INK.violet, 0.8);
  ctx.lineWidth = h * 0.08;
  ctx.beginPath();
  ctx.moveTo(...points[4]!);
  ctx.lineTo(...points[5]!);
  ctx.stroke();
}

/**
 * The ring the burst sends out: a thin band of the heart's light, white at its leading edge and rose
 * behind it, fading inward — a shock going across the lane rather than a disc.
 */
function paintRing(ctx: CanvasRenderingContext2D, h: number): void {
  const band = ctx.createRadialGradient(0, 0, h * 0.62, 0, 0, h * 0.97);
  band.addColorStop(0, rgba(FINALE_INK.violet, 0));
  band.addColorStop(0.55, rgba(FINALE_INK.rose, 0.45));
  band.addColorStop(0.88, rgba('#ffffff', 0.95));
  band.addColorStop(1, rgba('#ffffff', 0));
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.arc(0, 0, h, 0, Math.PI * 2);
  ctx.fill();
}
