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

/** Unity's inks, one set for the bust and the figure, so the two are one weasel in one set of clothes. */
function unityInks(palette: Palette) {
  return {
    dark: palette.space,
    fur: shade(palette.bullet, -0.42),
    furDark: shade(palette.bullet, -0.6),
    cream: mix(palette.impact, palette.hazard, 0.12),
    felt: shade(mix(palette.bullet, palette.blade, 0.25), -0.55),
    navy: shade(palette.player, -0.66),
    hiVis: palette.bullet,
  };
}

/**
 * Unity — a least weasel, the trader mechanic on Hangin' Out. The weasel's own two colours, a warm brown
 * back and a cream front meeting in a clean line down the cheek and the long throat; small round ears, a
 * bead of an eye each side, whiskers. A tradie's hi-vis shirt with a silver tape across it, navy overalls
 * over it (0554), and a bush hat with its crown pinched. Nothing that says which way they go: no lashes,
 * no paint.
 */
function paintUnity(ctx: CanvasRenderingContext2D, palette: Palette, size: number): void {
  const u = size / 100;
  const { dark, hiVis, navy } = unityInks(palette);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, 2.2 * u);
  // The shirt: hi-vis, and the silver tape across it.
  ctx.beginPath();
  ctx.moveTo(10 * u, 100 * u);
  ctx.quadraticCurveTo(12 * u, 74 * u, 34 * u, 70 * u);
  ctx.lineTo(66 * u, 70 * u);
  ctx.quadraticCurveTo(88 * u, 74 * u, 90 * u, 100 * u);
  ctx.closePath();
  ctx.fillStyle = hiVis;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = palette.blade;
  ctx.fillRect(0, 85 * u, 100 * u, 4 * u);
  ctx.fillStyle = rgba(palette.impact, 0.6);
  ctx.fillRect(0, 86 * u, 100 * u, 1 * u);
  ctx.restore();
  ctx.stroke();
  // The collar, open at the throat in a V, a shade down from the shirt.
  ctx.fillStyle = shade(hiVis, -0.25);
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(50 * u, 84 * u);
    ctx.lineTo((50 + side * 15) * u, 69 * u);
    ctx.lineTo((50 + side * 6) * u, 68 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // 0554: the overalls' bib over it, its two straps up over the shoulders and a button at each corner.
  ctx.fillStyle = navy;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo((50 + side * 11) * u, 88 * u);
    ctx.lineTo((50 + side * 17) * u, 70 * u);
    ctx.lineTo((50 + side * 24) * u, 71 * u);
    ctx.lineTo((50 + side * 15) * u, 90 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.rect(35 * u, 87 * u, 30 * u, 16 * u);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.blade;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.arc((50 + side * 11) * u, 91.5 * u, 2 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  paintUnityHead(ctx, palette, u, 1);
}

/**
 * Unity's head over the neck, in the bust's own 100 square at `u` a hundredth of it — so the plate's
 * portrait and the figure on the bench are one face (0554). `px` is one pixel in the frame it is drawn in,
 * the floor under every line, so the face holds its strokes at the figure's size.
 */
function paintUnityHead(ctx: CanvasRenderingContext2D, palette: Palette, u: number, px: number): void {
  const { dark, fur, furDark, cream, felt } = unityInks(palette);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(px, 2.2 * u);
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
  ctx.lineWidth = Math.max(px, 1.6 * u);
  ctx.beginPath();
  ctx.moveTo(50 * u, 49.5 * u);
  ctx.lineTo(50 * u, 52 * u);
  ctx.moveTo(45 * u, 53 * u);
  ctx.quadraticCurveTo(50 * u, 56 * u, 55 * u, 53 * u);
  ctx.stroke();
  // The whiskers, three a side.
  ctx.strokeStyle = rgba(palette.impact, 0.75);
  ctx.lineWidth = Math.max(px, 0.9 * u);
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((50 + side * 7) * u, (48 + i * 1.6) * u);
      ctx.lineTo((50 + side * 25) * u, (44 + i * 4) * u);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(px, 2.2 * u);
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
  ctx.lineWidth = Math.max(px, 1.2 * u);
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
 * Where the bench Unity stands on is, in their box's world units about its centre — 0554. The box sits at
 * `KEEPERS.unity.at` off the bench's middle, so these are the bench's own numbers (`paintBench`) less that:
 * the timber top's face at 0.4 and the inner face of the post by the pad at 12.1. Move either there, or the
 * row's `at`, and the boots and the wrench's jaw leave them, which the picture shows at once.
 */
const BENCH_TOP = 0.4 + 4.5;
const BENCH_POST = 12.1 - 7;
/** How far Unity leans off upright onto the wrench, in radians, top towards it. */
const LEAN = 0.2;

/**
 * Unity whole, on their bench — 0554: *"small and standing on the benchtop in overalls. Leaning against a
 * giant wrench that is propped up against one of the columns of the trade stand."* About eight units tall
 * on a counter fourteen high, and the wrench eleven long: its ring end on the timber, its open jaw against
 * the post. Unity's legs crossed at the ankle, arms folded, a shoulder against the shaft — the bust's own
 * head (`paintUnityHead`), the hi-vis shirt and navy overalls, and the short brown tail behind.
 *
 * Drawn in world units, `extent` across the `size` square. The shoulder is SOLVED onto the shaft rather
 * than placed, so a change to the lean or the wrench keeps them touching.
 */
export function paintUnityStanding(ctx: CanvasRenderingContext2D, palette: Palette, size: number, extent: number): void {
  const { dark, fur, navy, hiVis } = unityInks(palette);
  const px = extent / size;
  const line = Math.max(px, 0.17);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / extent, size / extent);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // The wrench: the ring's centre on the top, the jaw's against the post.
  const ringR = 0.75;
  const jawR = 1.25;
  const foot = { x: 0.9, y: BENCH_TOP - ringR };
  // A little into the post, so the steel meets it at the size it is drawn rather than a hair short.
  const head = { x: BENCH_POST - jawR + 0.2, y: -4.4 };
  const tilt = Math.atan2(head.x - foot.x, foot.y - head.y);
  const length = Math.hypot(head.x - foot.x, head.y - foot.y);
  const shaft = 0.45;
  // Shadows on the timber, under the ring and under the boots, so neither floats.
  const feetAt = feetAlong(foot, head, shaft);
  ctx.fillStyle = rgba(dark, 0.4);
  for (const [x, rx] of [
    [foot.x, 1],
    [feetAt, 1.3],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x, BENCH_TOP - 0.05, rx, 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(tilt);
  paintWrench(ctx, palette, length, ringR, jawR, shaft, line);
  ctx.restore();
  // Unity, upright about their feet and leaned over onto the shaft.
  ctx.save();
  ctx.translate(feetAt, BENCH_TOP);
  ctx.rotate(LEAN);
  ctx.strokeStyle = dark;
  ctx.lineWidth = line;
  // The tail, short and brown, out behind the hip.
  limb(ctx, dark, fur, 0.5, line, [
    [-0.6, -2.9],
    [-1.4, -2.6],
    [-1.8, -1.9],
  ]);
  // The legs, crossed at the ankle: one stood straight, the other over it on its toe.
  limb(ctx, dark, navy, 0.78, line, [
    [-0.35, -3],
    [-0.35, -0.45],
  ]);
  boot(ctx, palette, -0.35, -0.24, 0, line);
  limb(ctx, dark, navy, 0.78, line, [
    [0.4, -3],
    [0.25, -1.6],
    [-0.75, -0.55],
  ]);
  boot(ctx, palette, -0.95, -0.32, -0.5, line);
  // The shirt's body, then the overalls over it: the bib to the chest and the seat over the legs' tops.
  ctx.fillStyle = hiVis;
  ctx.beginPath();
  ctx.moveTo(-1.05, -3.3);
  ctx.lineTo(-1.1, -5.2);
  ctx.quadraticCurveTo(-1.05, -5.8, -0.4, -5.8);
  ctx.lineTo(0.4, -5.8);
  ctx.quadraticCurveTo(1.05, -5.8, 1.1, -5.2);
  ctx.lineTo(1.05, -3.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = navy;
  ctx.beginPath();
  ctx.moveTo(-0.62, -5.1);
  ctx.lineTo(0.62, -5.1);
  ctx.lineTo(0.8, -3.7);
  ctx.lineTo(0.95, -2.6);
  ctx.lineTo(-0.95, -2.6);
  ctx.lineTo(-0.8, -3.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = navy;
  ctx.lineWidth = 0.24;
  ctx.beginPath();
  ctx.moveTo(-0.55, -5);
  ctx.lineTo(-0.75, -5.75);
  ctx.moveTo(0.55, -5);
  ctx.lineTo(0.75, -5.75);
  ctx.stroke();
  ctx.fillStyle = palette.blade;
  for (const x of [-0.45, 0.45]) {
    ctx.beginPath();
    ctx.arc(x, -4.92, 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
  // The arms folded over the bib: the far one under, the near one over, a paw tucked at each end.
  for (const side of [-1, 1] as const) {
    limb(ctx, dark, hiVis, 0.55, line, [
      [side * 0.95, -5.45],
      [side * 1.1, -4.3],
      [-side * 0.5, -4.35 - side * 0.12],
    ]);
    ctx.strokeStyle = palette.blade;
    ctx.lineWidth = 0.14;
    ctx.beginPath();
    ctx.moveTo(side * 0.8, -4.8);
    ctx.lineTo(side * 1.3, -4.8);
    ctx.stroke();
    ctx.fillStyle = fur;
    ctx.strokeStyle = dark;
    ctx.lineWidth = line;
    ctx.beginPath();
    ctx.arc(-side * 0.55, -4.35 - side * 0.12, 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // The head, the bust's own, its neck into the collar and turned a little back up off the lean.
  const u = HEAD / 100;
  ctx.translate(0, -5.75);
  ctx.rotate(-LEAN * 0.6);
  ctx.translate(-50 * u, -76 * u);
  paintUnityHead(ctx, palette, u, px);
  ctx.restore();
  ctx.restore();
}

/** The head's 100 square in the figure, in world units: a broad cartoon head on a small body, for a read. */
const HEAD = 3.6;
/** Where the near shoulder is on the upright figure, about the feet — the point that rests on the shaft. */
const SHOULDER = { x: 1.38, y: -4.8 };

/** Where Unity's feet go along the top, so the near shoulder, leaned, lands on the shaft's near edge. */
function feetAlong(foot: { x: number; y: number }, head: { x: number; y: number }, shaft: number): number {
  const sx = SHOULDER.x * Math.cos(LEAN) - SHOULDER.y * Math.sin(LEAN);
  const sy = SHOULDER.x * Math.sin(LEAN) + SHOULDER.y * Math.cos(LEAN);
  const y = BENCH_TOP + sy;
  const along = foot.x + ((head.x - foot.x) * (y - foot.y)) / (head.y - foot.y);
  const tilt = Math.atan2(head.x - foot.x, foot.y - head.y);
  return along - shaft / Math.cos(tilt) - sx;
}

/**
 * The giant wrench, upright in its own frame: the ring end at the origin and the open jaw `length` above
 * it. Steel in the blade's ink, a groove down the shaft and a lit edge; the ring's hole and the jaw's
 * mouth cut clean through, so the bench and the post show in them.
 */
function paintWrench(ctx: CanvasRenderingContext2D, palette: Palette, length: number, ringR: number, jawR: number, shaft: number, line: number): void {
  const steel = palette.blade;
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = line;
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.rect(-shaft, -length + jawR * 0.6, shaft * 2, length - jawR * 0.6 - ringR * 0.6);
  ctx.fill();
  ctx.stroke();
  for (const [y, r] of [
    [0, ringR],
    [-length, jawR],
  ] as const) {
    ctx.beginPath();
    ctx.arc(0, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Fill the shaft over the two ends' outlines where it meets them.
  ctx.fillRect(-shaft + line / 2, -length + jawR * 0.5, shaft * 2 - line, length - jawR * 0.5 - ringR * 0.5);
  ctx.fillStyle = shade(steel, -0.3);
  ctx.fillRect(-shaft * 0.3, -length + jawR * 1.1, shaft * 0.6, length - jawR * 1.1 - ringR * 1.1);
  ctx.fillStyle = shade(steel, 0.35);
  ctx.fillRect(-shaft + line / 2, -length + jawR, shaft * 0.35, length - jawR - ringR);
  // The ring's hole and the jaw's mouth, cut through.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 0, ringR * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(-jawR * 0.42, -length - jawR - 0.1, jawR * 0.84, jawR * 1.05);
  ctx.arc(0, -length + 0.05, jawR * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.moveTo(-jawR * 0.42, -length - jawR * 0.92);
  ctx.lineTo(-jawR * 0.42, -length);
  ctx.arc(0, -length + 0.05, jawR * 0.42, Math.PI, 0, true);
  ctx.lineTo(jawR * 0.42, -length - jawR * 0.92);
  ctx.moveTo(ringR * 0.48, 0);
  ctx.arc(0, 0, ringR * 0.48, 0, Math.PI * 2);
  ctx.stroke();
}

/** A limb as a thick round-capped line, outlined: the outline's width under, the fill's over. */
function limb(ctx: CanvasRenderingContext2D, outline: string, fill: string, width: number, line: number, points: readonly (readonly [number, number])[]): void {
  for (const [ink, w] of [
    [outline, width + line * 2],
    [fill, width],
  ] as const) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(points[0]![0], points[0]![1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i]![0], points[i]![1]);
    ctx.stroke();
  }
  ctx.strokeStyle = outline;
  ctx.lineWidth = line;
}

/** A work boot, toe-capped, at (`x`, `y`) and turned by `turn`. */
function boot(ctx: CanvasRenderingContext2D, palette: Palette, x: number, y: number, turn: number, line: number): void {
  ctx.fillStyle = mix(palette.space, palette.bullet, 0.3);
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = line;
  ctx.beginPath();
  ctx.ellipse(x, y, 0.55, 0.28, turn, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * MMXXVI — a space duck, who paints the ships on Paint & Parts. Turned three quarters towards the pad, as
 * a painter looks at the work (0555): a yellow duck's head whose brow slopes into the bill, on an S of a
 * neck that rises out of the helmet's ring, a proper bill — long, flat and spoon-tipped, a nostril near its
 * root, the nail at its tip, the lower one tucked under it and a smile turned up at the corner — big glossy
 * eyes set high, a pink cheek and a painter's beret, all inside a glass bubble seated in that ring, its
 * light on an antenna. Under it a white suit and a painter's apron splashed in the shop's inks, two
 * brushes in its pocket.
 */
function paintMmxxvi(ctx: CanvasRenderingContext2D, palette: Palette, size: number): void {
  const u = size / 100;
  const dark = palette.space;
  const line = Math.max(1, 2.2 * u);
  const feather = mix(palette.hazard, palette.impact, 0.25);
  const featherShade = shade(mix(feather, palette.bullet, 0.3), -0.12);
  const bill = mix(palette.bullet, palette.fire, 0.4);
  const suit = mix(palette.impact, palette.blade, 0.35);
  const apron = shade(palette.player, -0.5);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = line;
  // The suit's shoulders.
  ctx.beginPath();
  ctx.moveTo(8 * u, 100 * u);
  ctx.quadraticCurveTo(10 * u, 78 * u, 28 * u, 73 * u);
  // Up to the helmet's ring: the suit's own neck, which the bubble is seated on.
  ctx.quadraticCurveTo(33 * u, 71 * u, 32 * u, RING * u);
  ctx.lineTo(68 * u, RING * u);
  ctx.quadraticCurveTo(67 * u, 71 * u, 72 * u, 73 * u);
  ctx.quadraticCurveTo(90 * u, 78 * u, 92 * u, 100 * u);
  ctx.closePath();
  ctx.fillStyle = suit;
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  // The suit's shade on the far side, away from the light, and a seam over each shoulder.
  ctx.fillStyle = rgba(dark, 0.14);
  ctx.beginPath();
  ctx.ellipse(86 * u, 92 * u, 16 * u, 22 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(dark, 0.22);
  ctx.lineWidth = Math.max(1, 1.2 * u);
  ctx.beginPath();
  ctx.moveTo(20 * u, 79 * u);
  ctx.quadraticCurveTo(24 * u, 88 * u, 22 * u, 100 * u);
  ctx.moveTo(80 * u, 79 * u);
  ctx.quadraticCurveTo(76 * u, 88 * u, 78 * u, 100 * u);
  ctx.stroke();
  // The apron's bib over it, its straps up to the collar, and paint splashed across both.
  ctx.fillStyle = apron;
  ctx.strokeStyle = dark;
  ctx.lineWidth = line;
  ctx.beginPath();
  ctx.moveTo(35 * u, 82 * u);
  ctx.lineTo(65 * u, 82 * u);
  ctx.lineTo(68 * u, 101 * u);
  ctx.lineTo(32 * u, 101 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const [from, to] of [
    [37, 31],
    [63, 69],
  ] as const) {
    for (const [ink, w] of [
      [dark, 3.4 * u + line],
      [apron, 3.4 * u],
    ] as const) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(from * u, 83 * u);
      ctx.lineTo(to * u, 74 * u);
      ctx.stroke();
    }
  }
  const splashes: readonly (readonly [number, number, number, string])[] = [
    [20, 90, 3.2, palette.enemy],
    [27, 97, 1.8, palette.player],
    [78, 86, 2.8, palette.acid],
    [84, 96, 2.2, palette.void],
    [40, 92, 2.2, palette.hazard],
  ];
  for (const [x, y, r, ink] of splashes) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(x * u, y * u, r * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc((x + r * 0.95) * u, (y + r * 0.85) * u, r * 0.38 * u, 0, Math.PI * 2);
    ctx.arc((x - r * 1.1) * u, (y + r * 0.2) * u, r * 0.26 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = dark;
  ctx.lineWidth = line;
  // Two brushes stood in the apron's pocket, each wet with its own ink, and the pocket over them.
  for (const [x0, x1, tip] of [
    [53.5, 52, palette.enemy],
    [58, 60, palette.acid],
  ] as const) {
    for (const [ink, w] of [
      [dark, 1.8 * u + line],
      [shade(palette.bullet, -0.35), 1.8 * u],
    ] as const) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x0 * u, 95 * u);
      ctx.lineTo(x1 * u, 84 * u);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(x1 * u, 84 * u);
    // Turned so the brush's own downward axis points up its handle and away from the pocket.
    ctx.rotate(Math.atan2(x0 - x1, -11));
    ctx.fillStyle = palette.blade;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, 1.2 * u);
    ctx.beginPath();
    ctx.rect(-1.3 * u, 0, 2.6 * u, 2.2 * u);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(-1.3 * u, 2.2 * u);
    ctx.quadraticCurveTo(-1.5 * u, 4.6 * u, 0, 5.6 * u);
    ctx.quadraticCurveTo(1.5 * u, 4.6 * u, 1.3 * u, 2.2 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = line;
  ctx.fillStyle = shade(apron, -0.25);
  ctx.beginPath();
  ctx.rect(50 * u, 89 * u, 12 * u, 9 * u);
  ctx.fill();
  ctx.stroke();
  // Inside the bubble, behind the duck: the glass's far side, a cool tint.
  ctx.fillStyle = rgba(palette.frost, 0.1);
  bubble(ctx, u);
  ctx.closePath();
  ctx.fill();
  // The helmet's neck ring, seated on the suit, its open throat dark, the neck down through it.
  ctx.fillStyle = palette.blade;
  ctx.beginPath();
  ctx.ellipse(50 * u, RING * u, 20 * u, 4.2 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(palette.blade, -0.6);
  ctx.beginPath();
  ctx.ellipse(50 * u, (RING - 0.5) * u, 15.5 * u, 2.6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // The neck: rising out of the ring and leaning into the head, the far side in shade.
  ctx.fillStyle = feather;
  ctx.beginPath();
  ctx.moveTo(37 * u, (RING + 1) * u);
  ctx.quadraticCurveTo(33 * u, 54 * u, 37 * u, 45 * u);
  ctx.lineTo(55 * u, 45 * u);
  // The throat tucked in under the bill, and the breast out below it, as a duck's neck is an S.
  ctx.bezierCurveTo(51 * u, 51 * u, 57 * u, 57 * u, 63 * u, (RING + 1) * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = featherShade;
  ctx.beginPath();
  ctx.ellipse(61 * u, 57 * u, 7 * u, 13 * u, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(dark, 0.18);
  ctx.beginPath();
  ctx.ellipse(48 * u, 47.5 * u, 11 * u, 3.4 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // A fluff of down on the front of the neck, lit, its points hanging.
  ctx.fillStyle = shade(feather, 0.18);
  ctx.beginPath();
  ctx.moveTo(39 * u, 52 * u);
  ctx.quadraticCurveTo(45 * u, 50 * u, 51 * u, 52.5 * u);
  ctx.lineTo(49.5 * u, 57.5 * u);
  ctx.lineTo(47 * u, 55 * u);
  ctx.lineTo(44.5 * u, 59 * u);
  ctx.lineTo(42 * u, 55.5 * u);
  ctx.lineTo(39.5 * u, 57.5 * u);
  ctx.closePath();
  ctx.fill();
  // The ring's near lip over all of it, with a stripe of the shop's own ink round it.
  ctx.fillStyle = palette.blade;
  ctx.lineWidth = line;
  ctx.beginPath();
  ctx.ellipse(50 * u, RING * u, 20 * u, 4.2 * u, 0, 0, Math.PI);
  ctx.ellipse(50 * u, (RING - 0.5) * u, 15.5 * u, 2.6 * u, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = palette.player;
  ctx.lineWidth = Math.max(1, 1.3 * u);
  ctx.beginPath();
  ctx.ellipse(50 * u, (RING + 0.6) * u, 17.8 * u, 3.3 * u, 0, Math.PI * 0.12, Math.PI * 0.88);
  ctx.stroke();
  ctx.strokeStyle = dark;
  ctx.lineWidth = line;
  /*
    The head: one silhouette, a round crown whose brow slopes forward and down into the bill's root, as a
    duck's does — a ball with a bill stuck on it reads as a chick. Outlined by stroking it at twice the
    line and filling over, so the crown and the brow are one shape. Lit from above the far shoulder.
  */
  ctx.lineWidth = line * 2;
  head(ctx, u, 0, 0);
  ctx.stroke();
  ctx.lineWidth = line;
  ctx.fillStyle = featherShade;
  head(ctx, u, 0, 0);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = feather;
  head(ctx, u, -2.2, -3);
  ctx.fill();
  ctx.fillStyle = rgba(palette.impact, 0.4);
  ctx.beginPath();
  ctx.ellipse(36 * u, 23 * u, 8 * u, 4.6 * u, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // A dab of paint on the back of the head, where a brush was waved too close.
  ctx.fillStyle = palette.player;
  ctx.beginPath();
  ctx.ellipse(30 * u, 33 * u, 2.8 * u, 1.7 * u, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(32.4 * u, 36.2 * u, 0.8 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The beret, tipped back over the far ear, its stalk on top and a curl of down out from under its brim.
  ctx.fillStyle = feather;
  ctx.beginPath();
  ctx.moveTo(51 * u, 19 * u);
  ctx.quadraticCurveTo(57 * u, 13 * u, 60 * u, 17 * u);
  ctx.quadraticCurveTo(56 * u, 16 * u, 55 * u, 21 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const beret = shade(palette.void, -0.1);
  ctx.fillStyle = beret;
  ctx.beginPath();
  ctx.ellipse(42 * u, 17 * u, 12.5 * u, 5.4 * u, -0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(beret, -0.3);
  ctx.beginPath();
  ctx.ellipse(44 * u, 20.2 * u, 9.5 * u, 2 * u, -0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(palette.impact, 0.3);
  ctx.beginPath();
  ctx.ellipse(38 * u, 14.6 * u, 5 * u, 1.8 * u, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, 2.4 * u);
  ctx.beginPath();
  ctx.moveTo(41 * u, 11.8 * u);
  ctx.lineTo(42 * u, 8.8 * u);
  ctx.stroke();
  ctx.lineWidth = line;
  // The eyes: big and glossy, the far one narrowed by the turn of the head, two glints in each.
  for (const [x, y, rx, ry, glint] of [
    [42, 27.5, 3.6, 4.5, 1.5],
    [56.4, 26.6, 1.6, 3.1, 0.75],
  ] as const) {
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(x * u, y * u, rx * u, ry * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.impact;
    ctx.beginPath();
    ctx.arc((x - rx * 0.35) * u, (y - ry * 0.4) * u, glint * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc((x + rx * 0.35) * u, (y + ry * 0.45) * u, glint * 0.45 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // A pink cheek under the near eye.
  ctx.fillStyle = rgba(palette.enemy, 0.35);
  ctx.beginPath();
  ctx.ellipse(43 * u, 39.5 * u, 4 * u, 2.3 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // The bill. The lower first, tucked under; then the upper — long and flat from its root on the face to
  // a broad spoon of a tip, its top lit, a nostril near the root and the nail at the tip.
  ctx.fillStyle = shade(bill, -0.12);
  ctx.lineWidth = Math.max(1, 1.8 * u);
  ctx.beginPath();
  ctx.moveTo(56 * u, 46.4 * u);
  ctx.quadraticCurveTo(64 * u, 45.6 * u, 70.5 * u, 45.8 * u);
  ctx.quadraticCurveTo(69 * u, 49.4 * u, 63 * u, 49.4 * u);
  ctx.quadraticCurveTo(58 * u, 49.4 * u, 56 * u, 46.4 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = line;
  ctx.fillStyle = bill;
  ctx.beginPath();
  ctx.moveTo(55 * u, 35.5 * u);
  ctx.bezierCurveTo(61 * u, 35.5 * u, 64 * u, 38.6 * u, 69 * u, 38.4 * u);
  ctx.bezierCurveTo(75 * u, 38.2 * u, 78.5 * u, 40.5 * u, 77.6 * u, 43.6 * u);
  ctx.quadraticCurveTo(76 * u, 46.4 * u, 70 * u, 46.2 * u);
  ctx.quadraticCurveTo(62 * u, 45.8 * u, 56.5 * u, 47 * u);
  ctx.quadraticCurveTo(53 * u, 42 * u, 55 * u, 35.5 * u);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = shade(bill, 0.25);
  ctx.beginPath();
  ctx.moveTo(55 * u, 35.5 * u);
  ctx.bezierCurveTo(61 * u, 35.5 * u, 64 * u, 38.6 * u, 69 * u, 38.4 * u);
  ctx.bezierCurveTo(73 * u, 38.3 * u, 76 * u, 39.6 * u, 77 * u, 41.2 * u);
  ctx.bezierCurveTo(70 * u, 40.4 * u, 63 * u, 41.2 * u, 55.5 * u, 40.6 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(bill, -0.12);
  ctx.beginPath();
  ctx.ellipse(66 * u, 46 * u, 14 * u, 2 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.stroke();
  ctx.fillStyle = shade(bill, -0.45);
  ctx.beginPath();
  ctx.ellipse(62 * u, 39.6 * u, 1.4 * u, 0.6 * u, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(bill, -0.2);
  ctx.beginPath();
  ctx.ellipse(76.4 * u, 41.8 * u, 1.2 * u, 1.6 * u, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // The smile, turned up at the corner of the bill into the cheek.
  ctx.lineWidth = Math.max(1, 1.6 * u);
  ctx.beginPath();
  ctx.moveTo(56.5 * u, 46.8 * u);
  ctx.quadraticCurveTo(53.6 * u, 46.6 * u, 52.8 * u, 44.4 * u);
  ctx.stroke();
  // The helmet's near side: the bubble's rim, a long highlight and a glint, the light on its antenna.
  ctx.strokeStyle = palette.blade;
  ctx.lineWidth = Math.max(1, 1.6 * u);
  ctx.beginPath();
  ctx.moveTo(60.6 * u, 7.9 * u);
  ctx.lineTo(63.6 * u, 3 * u);
  ctx.stroke();
  ctx.fillStyle = palette.player;
  ctx.beginPath();
  ctx.arc(63.8 * u, 2.9 * u, 2.4 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(palette.impact, 0.8);
  ctx.beginPath();
  ctx.arc(63.2 * u, 2.3 * u, 0.8 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(palette.frost, 0.85);
  ctx.lineWidth = Math.max(1, 1.8 * u);
  bubble(ctx, u);
  ctx.stroke();
  ctx.strokeStyle = rgba(palette.impact, 0.7);
  ctx.lineWidth = Math.max(1, 2.6 * u);
  ctx.beginPath();
  ctx.arc(50 * u, BUBBLE.y * u, 26.5 * u, Math.PI * 1.08, Math.PI * 1.42);
  ctx.stroke();
  ctx.strokeStyle = rgba(palette.frost, 0.35);
  ctx.lineWidth = Math.max(1, 1.4 * u);
  ctx.beginPath();
  ctx.arc(50 * u, BUBBLE.y * u, 27.5 * u, Math.PI * 0.06, Math.PI * 0.3);
  ctx.stroke();
  ctx.fillStyle = rgba(palette.impact, 0.6);
  ctx.beginPath();
  ctx.arc(68 * u, 19 * u, 1.5 * u, 0, Math.PI * 2);
  ctx.fill();
}

/** Where the helmet's neck ring sits on MMXXVI's suit, in the bust's 100 square. */
const RING = 63;
/** The bubble: its centre's height and its radius, in the same square. */
const BUBBLE = { y: 37, r: 31 };

/**
 * The bubble's outline, open at the bottom where it is seated in the neck ring — 0555. A whole circle
 * narrowed to a point below the face and never met the ring, which left a gap between glass and suit;
 * the glass ends on the chord a hair inside the ring's rim, so the ring holds it.
 */
function bubble(ctx: CanvasRenderingContext2D, u: number): void {
  const seat = Math.asin((RING - 1 - BUBBLE.y) / BUBBLE.r);
  ctx.beginPath();
  ctx.arc(50 * u, BUBBLE.y * u, BUBBLE.r * u, seat, Math.PI - seat, true);
}

/**
 * MMXXVI's head as one path, offset by (`dx`, `dy`): the round crown and the brow that slopes from it into
 * the bill's root. Two subpaths wound the same way, so a fill is their union.
 */
function head(ctx: CanvasRenderingContext2D, u: number, dx: number, dy: number): void {
  ctx.beginPath();
  ctx.ellipse((43 + dx) * u, (32 + dy) * u, 19 * u, 17.5 * u, 0, 0, Math.PI * 2);
  ctx.moveTo((64 + dx) * u, (35 + dy) * u);
  ctx.ellipse((55 + dx) * u, (35 + dy) * u, 9 * u, 8 * u, 0, 0, Math.PI * 2);
}
