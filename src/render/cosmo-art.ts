/**
 * Cosmo, drawn — `docs/decisions/0542-cosmos-counter.md`. A bust: the alien from the family photo the
 * shop sells (0523), in a shopkeeper's waistcoat and bow tie, painted into a square canvas so the same
 * drawing is the portrait on the plate and the figure behind the stall's counter in the port.
 *
 * ⚠️ **COLD, ON `golfer-art.ts`'s TERMS**: drawn once into a bitmap, at a bake, never in a frame.
 *
 * Every ink is a palette role, moved: the green is the family photo's — the acid toward the pickup's mint
 * (`--itc-alien` in `src/app/chrome.ts`) — so the high-contrast palette answers every one.
 */

import type { Palette } from '../content/palette.ts';
import { mix, shade } from './bake.ts';

/** Draw Cosmo's bust to fill a `size` square: the head in the top two thirds, the shoulders below. */
export function paintCosmo(ctx: CanvasRenderingContext2D, palette: Palette, size: number): void {
  const u = size / 100;
  const skin = mix(palette.acid, palette.pickup, 0.5);
  const dark = palette.space;
  const outline = Math.max(1, 2.2 * u);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = outline;
  // The shoulders: a waistcoat in the ally's violet over a white shirt, a gold bow tie at the collar.
  ctx.fillStyle = shade(palette.ally, -0.15);
  ctx.beginPath();
  ctx.moveTo(12 * u, 100 * u);
  ctx.quadraticCurveTo(14 * u, 74 * u, 34 * u, 70 * u);
  ctx.lineTo(66 * u, 70 * u);
  ctx.quadraticCurveTo(86 * u, 74 * u, 88 * u, 100 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.impact;
  ctx.beginPath();
  ctx.moveTo(42 * u, 70 * u);
  ctx.lineTo(50 * u, 92 * u);
  ctx.lineTo(58 * u, 70 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.hazard;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(50 * u, 75 * u);
    ctx.lineTo((50 + side * 9) * u, 70 * u);
    ctx.lineTo((50 + side * 9) * u, 80 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // The neck, and the head: wide at the brow and narrow at the chin, as the photo's are.
  ctx.fillStyle = shade(skin, -0.15);
  ctx.fillRect(44 * u, 58 * u, 12 * u, 13 * u);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(50 * u, 66 * u);
  ctx.bezierCurveTo(30 * u, 64 * u, 20 * u, 44 * u, 22 * u, 30 * u);
  ctx.bezierCurveTo(24 * u, 14 * u, 40 * u, 10 * u, 50 * u, 10 * u);
  ctx.bezierCurveTo(60 * u, 10 * u, 76 * u, 14 * u, 78 * u, 30 * u);
  ctx.bezierCurveTo(80 * u, 44 * u, 70 * u, 64 * u, 50 * u, 66 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // A lit crown, so the head turns to the light.
  ctx.fillStyle = shade(skin, 0.3);
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(42 * u, 22 * u, 11 * u, 6 * u, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // The antennae, each with a bead of the hazard's gold.
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo((50 + side * 10) * u, 13 * u);
    ctx.quadraticCurveTo((50 + side * 16) * u, 4 * u, (50 + side * 22) * u, 3 * u);
    ctx.stroke();
    ctx.fillStyle = palette.hazard;
    ctx.beginPath();
    ctx.arc((50 + side * 22) * u, 3 * u, 3.5 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // The eyes: large, dark, tilted up at the outside, each with a glint.
  for (const side of [-1, 1] as const) {
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse((50 + side * 13) * u, 38 * u, 9 * u, 5.5 * u, side * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.impact;
    ctx.beginPath();
    ctx.arc((50 + side * 13 - 3) * u, 36 * u, 1.8 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // A small smile.
  ctx.beginPath();
  ctx.moveTo(44 * u, 54 * u);
  ctx.quadraticCurveTo(50 * u, 58 * u, 56 * u, 54 * u);
  ctx.stroke();
}
