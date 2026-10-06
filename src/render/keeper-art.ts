/**
 * The keepers, drawn — `docs/decisions/0550-every-tab-has-a-keeper.md`. Each a bust painted into a square
 * canvas, so the same drawing is the portrait on the plate and the figure behind the counter in the port,
 * as Cosmo's is (`src/render/cosmo-art.ts`).
 *
 * ⚠️ **COLD, ON `golfer-art.ts`'s TERMS**: drawn once into a bitmap, at a bake, never in a frame.
 *
 * Every ink is a palette role, moved, so the high-contrast palette answers every one.
 */

import type { KeeperKind } from '../content/keepers.ts';
import type { Palette } from '../content/palette.ts';
import { mix, rgba, shade } from './bake.ts';
import { paintCosmo } from './cosmo-art.ts';

/** Each keeper's painter, filling a `size` square: the head in the top two thirds, the shoulders below. */
export const KEEPER_FACES: Record<KeeperKind, (ctx: CanvasRenderingContext2D, palette: Palette, size: number) => void> = {
  cosmo: paintCosmo,
  unity: paintUnity,
  mmxxvi: paintMmxxvi,
};

/**
 * Unity — a least weasel, the trader mechanic on Hangin' Out. The weasel's own two colours, a warm brown
 * back and a cream front meeting in a clean line down the cheek and the long throat; small round ears, a
 * bead of an eye each side, whiskers. A tradie's hi-vis shirt, orange over navy with a silver tape across
 * it, and a bush hat with its crown pinched. Nothing that says which way they go: no lashes, no paint.
 */
function paintUnity(ctx: CanvasRenderingContext2D, palette: Palette, size: number): void {
  const u = size / 100;
  const dark = palette.space;
  const fur = shade(palette.bullet, -0.42);
  const furDark = shade(palette.bullet, -0.6);
  const cream = mix(palette.impact, palette.hazard, 0.12);
  const felt = shade(mix(palette.bullet, palette.blade, 0.25), -0.55);
  const navy = shade(palette.player, -0.66);
  const hiVis = palette.bullet;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, 2.2 * u);
  // The shirt: navy, an orange yoke over the shoulders, and the silver tape where the two meet.
  ctx.beginPath();
  ctx.moveTo(10 * u, 100 * u);
  ctx.quadraticCurveTo(12 * u, 74 * u, 34 * u, 70 * u);
  ctx.lineTo(66 * u, 70 * u);
  ctx.quadraticCurveTo(88 * u, 74 * u, 90 * u, 100 * u);
  ctx.closePath();
  ctx.fillStyle = navy;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = hiVis;
  ctx.fillRect(0, 60 * u, 100 * u, 25 * u);
  ctx.fillStyle = palette.blade;
  ctx.fillRect(0, 85 * u, 100 * u, 4 * u);
  ctx.fillStyle = rgba(palette.impact, 0.6);
  ctx.fillRect(0, 86 * u, 100 * u, 1 * u);
  ctx.restore();
  ctx.stroke();
  // The collar, open at the throat in a navy V.
  ctx.fillStyle = navy;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(50 * u, 84 * u);
    ctx.lineTo((50 + side * 15) * u, 69 * u);
    ctx.lineTo((50 + side * 6) * u, 68 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // The long neck: brown at the sides, cream down the front, into the collar.
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.moveTo(38 * u, 56 * u);
  ctx.lineTo(36 * u, 76 * u);
  ctx.lineTo(64 * u, 76 * u);
  ctx.lineTo(62 * u, 56 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.moveTo(43 * u, 56 * u);
  ctx.lineTo(44 * u, 76 * u);
  ctx.lineTo(50 * u, 84 * u);
  ctx.lineTo(56 * u, 76 * u);
  ctx.lineTo(57 * u, 56 * u);
  ctx.closePath();
  ctx.fill();
  // The ears: small and round, out at the sides under the brim.
  for (const side of [-1, 1] as const) {
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.arc((50 + side * 23) * u, 28 * u, 7 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = mix(fur, palette.enemy, 0.4);
    ctx.beginPath();
    ctx.arc((50 + side * 23) * u, 28.5 * u, 3.6 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // The head: a long wedge, broad at the brow, narrowing to a blunt snout.
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.moveTo(50 * u, 62 * u);
  ctx.bezierCurveTo(36 * u, 62 * u, 26 * u, 46 * u, 27 * u, 32 * u);
  ctx.bezierCurveTo(28 * u, 20 * u, 40 * u, 16 * u, 50 * u, 16 * u);
  ctx.bezierCurveTo(60 * u, 16 * u, 72 * u, 20 * u, 73 * u, 32 * u);
  ctx.bezierCurveTo(74 * u, 46 * u, 64 * u, 62 * u, 50 * u, 62 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // The cream of the muzzle, the lip and the chin, the weasel's clean line between the two colours.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.moveTo(30 * u, 66 * u);
  ctx.quadraticCurveTo(32 * u, 46 * u, 41 * u, 44 * u);
  ctx.quadraticCurveTo(50 * u, 41 * u, 59 * u, 44 * u);
  ctx.quadraticCurveTo(68 * u, 46 * u, 70 * u, 66 * u);
  ctx.closePath();
  ctx.fill();
  // And a darker brow over the eyes, so the face reads at a thumbnail.
  ctx.fillStyle = rgba(furDark, 0.7);
  ctx.beginPath();
  ctx.ellipse(50 * u, 28 * u, 20 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The eyes: black beads, wide set, each with a glint.
  for (const side of [-1, 1] as const) {
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc((50 + side * 10) * u, 37 * u, 4.2 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.impact;
    ctx.beginPath();
    ctx.arc((50 + side * 10 - 1.4) * u, 35.6 * u, 1.4 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // The nose, a dark button at the snout's end, and a small mouth under it.
  ctx.fillStyle = mix(palette.enemy, dark, 0.55);
  ctx.beginPath();
  ctx.ellipse(50 * u, 47 * u, 4 * u, 2.8 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(1, 1.6 * u);
  ctx.beginPath();
  ctx.moveTo(50 * u, 49.5 * u);
  ctx.lineTo(50 * u, 52 * u);
  ctx.moveTo(45 * u, 53 * u);
  ctx.quadraticCurveTo(50 * u, 56 * u, 55 * u, 53 * u);
  ctx.stroke();
  // The whiskers, three a side.
  ctx.strokeStyle = rgba(palette.impact, 0.75);
  ctx.lineWidth = Math.max(1, 0.9 * u);
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((50 + side * 7) * u, (48 + i * 1.6) * u);
      ctx.lineTo((50 + side * 25) * u, (44 + i * 4) * u);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, 2.2 * u);
  // The bush hat: the brim wide and flat, the crown pinched to a ridge, a band round it.
  ctx.fillStyle = felt;
  ctx.beginPath();
  ctx.ellipse(50 * u, 21 * u, 37 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32 * u, 21 * u);
  ctx.quadraticCurveTo(31 * u, 6 * u, 42 * u, 5 * u);
  ctx.lineTo(50 * u, 8 * u);
  ctx.lineTo(58 * u, 5 * u);
  ctx.quadraticCurveTo(69 * u, 6 * u, 68 * u, 21 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(felt, -0.45);
  ctx.fillRect(32.5 * u, 15 * u, 35 * u, 4 * u);
  // The dents in the crown, and the brim's lit edge.
  ctx.strokeStyle = rgba(palette.impact, 0.25);
  ctx.lineWidth = Math.max(1, 1.2 * u);
  ctx.beginPath();
  ctx.moveTo(42 * u, 8 * u);
  ctx.quadraticCurveTo(44 * u, 11 * u, 43 * u, 14 * u);
  ctx.moveTo(58 * u, 8 * u);
  ctx.quadraticCurveTo(56 * u, 11 * u, 57 * u, 14 * u);
  ctx.moveTo(16 * u, 20 * u);
  ctx.quadraticCurveTo(50 * u, 13 * u, 84 * u, 20 * u);
  ctx.stroke();
}

/**
 * MMXXVI — a space duck, who paints the ships on Paint & Parts. A round yellow head and a broad orange
 * bill under a glass bubble helmet with a light on its antenna, the suit's collar ring under it, and a
 * painter's smock splashed in every ink the shop sells, with a dab on one cheek.
 */
function paintMmxxvi(ctx: CanvasRenderingContext2D, palette: Palette, size: number): void {
  const u = size / 100;
  const dark = palette.space;
  const feather = mix(palette.hazard, palette.impact, 0.25);
  const bill = mix(palette.bullet, palette.fire, 0.4);
  const smock = mix(palette.impact, palette.blade, 0.35);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, 2.2 * u);
  // The smock, and the splashes on it.
  ctx.beginPath();
  ctx.moveTo(10 * u, 100 * u);
  ctx.quadraticCurveTo(12 * u, 76 * u, 32 * u, 72 * u);
  ctx.lineTo(68 * u, 72 * u);
  ctx.quadraticCurveTo(88 * u, 76 * u, 90 * u, 100 * u);
  ctx.closePath();
  ctx.fillStyle = smock;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const splashes: readonly (readonly [number, number, number, string])[] = [
    [24, 88, 3.4, palette.enemy],
    [33, 95, 2.2, palette.player],
    [70, 84, 3, palette.acid],
    [78, 94, 2.6, palette.void],
    [58, 92, 1.8, palette.hazard],
    [42, 84, 1.6, palette.ally],
  ];
  for (const [x, y, r, ink] of splashes) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(x * u, y * u, r * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc((x + r * 0.9) * u, (y + r * 0.8) * u, r * 0.4 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.stroke();
  // The suit's collar ring, the helmet seated on it.
  ctx.fillStyle = palette.blade;
  ctx.beginPath();
  ctx.ellipse(50 * u, 73 * u, 24 * u, 5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // The head: round, a tuft of three feathers on its crown.
  ctx.fillStyle = feather;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo((50 + i * 3) * u, 22 * u);
    ctx.quadraticCurveTo((50 + i * 7) * u, 12 * u, (50 + i * 9 + 2) * u, 14 * u);
    ctx.quadraticCurveTo((50 + i * 5) * u, 18 * u, (50 + i * 3 + 3) * u, 23 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(50 * u, 42 * u, 22 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rgba(palette.impact, 0.45);
  ctx.beginPath();
  ctx.ellipse(43 * u, 31 * u, 9 * u, 5 * u, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // The dab of paint on one cheek.
  ctx.fillStyle = palette.player;
  ctx.beginPath();
  ctx.ellipse(66 * u, 48 * u, 3.4 * u, 2.2 * u, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // The eyes, over the bill, each with a glint.
  for (const side of [-1, 1] as const) {
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse((50 + side * 9) * u, 38 * u, 3.6 * u, 4.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.impact;
    ctx.beginPath();
    ctx.arc((50 + side * 9 - 1.2) * u, 36.4 * u, 1.3 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // The bill: broad and flat, its upper and its lower, and a smile where they meet.
  ctx.fillStyle = shade(bill, -0.15);
  ctx.beginPath();
  ctx.ellipse(50 * u, 55 * u, 13 * u, 4.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = bill;
  ctx.beginPath();
  ctx.ellipse(50 * u, 51 * u, 15 * u, 5.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(bill, -0.35);
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.arc((50 + side * 4) * u, 49.5 * u, 0.9 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // The helmet: a glass bubble over it all, tinted, with a highlight and an antenna's light.
  ctx.strokeStyle = palette.blade;
  ctx.lineWidth = Math.max(1, 1.6 * u);
  ctx.beginPath();
  ctx.moveTo(50 * u, 8 * u);
  ctx.lineTo(50 * u, 1.5 * u);
  ctx.stroke();
  ctx.fillStyle = palette.player;
  ctx.beginPath();
  ctx.arc(50 * u, 3 * u, 2.6 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(palette.frost, 0.12);
  ctx.strokeStyle = rgba(palette.frost, 0.85);
  ctx.lineWidth = Math.max(1, 1.8 * u);
  ctx.beginPath();
  ctx.arc(50 * u, 40 * u, 32 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = rgba(palette.impact, 0.7);
  ctx.lineWidth = Math.max(1, 2.6 * u);
  ctx.beginPath();
  ctx.arc(50 * u, 40 * u, 27 * u, Math.PI * 1.08, Math.PI * 1.42);
  ctx.stroke();
}
