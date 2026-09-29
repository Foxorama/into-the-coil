/**
 * The port's art, baked once — `docs/decisions/0411-the-chase-begins-at-the-port.md`.
 *
 * ⚠️ **ITS OWN ATLAS, AND NOT ROWS IN `src/content/sprites.ts`.** The game's atlas is re-baked on
 * every change of place (`atlasIsStale`, 0195), and the port is seen once, before the first of them. Thirty-odd
 * bitmaps of a room nobody will stand in again would be baked seven more times a run for nothing, so
 * the port is baked beside the game's and handed to the surface for as long as the intro is up —
 * `CanvasSurface.setAtlas` already exists for exactly that swap.
 *
 * ⚠️ **ON `tests/budget.test.ts`'s COLD LIST, ON `bake.ts`'s TERMS**: it runs at load and on a
 * rotation, never in a frame, and allocating is what it is for. What the frame does with the result
 * is `src/render/port.ts`, which is hot.
 *
 * Everything but the two ships is drawn in WORLD UNITS about the sprite's centre — the context is
 * scaled once per bitmap — so the numbers below are the ones `src/content/port.ts` places the pieces
 * by. The ships are drawn in the fighter's own frame (fractions of `r`), because the blue one IS the
 * fighter: `paintShip` and `SHIP_HULL` are the drawing the player flies, at hangar size.
 */

import type { Palette } from '../content/palette.ts';
import { FLAME_BOX, PILOT_STANDS, PORT_EXTENT, PORT_INK, PORT_KINDS, VIPER, type PortKind } from '../content/port.ts';
import type { GolferRow } from '../content/golfers.ts';
import { makeRng, type Rng } from '../sim/rng.ts';
import { bakeSize, disc, glow, paintShip, poly, rgba, seal, shade, SHIP_HULL, trace, type Atlas, type Frame, type Pt } from './bake.ts';
import { paintRunner } from './golfer-art.ts';

/**
 * Bake every piece of the port for one palette, at the resolution it will be blitted at, with the
 * chosen golfer as the pilot who runs for the ship — 0415.
 */
export function bakePort(palette: Palette, pixelsPerUnit: number, pilot: GolferRow): Atlas {
  return {
    view: 'side',
    theme: 'approach',
    bitmaps: PORT_KINDS.map((kind) => bakePiece(kind, palette, pixelsPerUnit, pilot)),
    extents: PORT_KINDS.map((kind) => PORT_EXTENT[kind]),
    pixelsPerUnit,
  };
}

function bakePiece(kind: PortKind, palette: Palette, pixelsPerUnit: number, pilot: GolferRow): HTMLCanvasElement {
  const extent = PORT_EXTENT[kind];
  const size = bakeSize(extent, pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('bakePort: no 2D context — this browser cannot run the game');
  const f: Frame = { half: size / 2, r: size * 0.42 };
  // A flame's box is `FLAME_BOX` times its ship's, at the ship's own radius — see `FLAME_BOX`.
  const jet: Frame = { half: size / 2, r: (size * 0.42) / FLAME_BOX };
  switch (kind) {
    case 'blue':
      paintBlue(ctx, f, palette, size);
      return canvas;
    case 'blueIdle':
      paintJets(ctx, jet, palette.bullet, palette.hazard, palette.impact, BLUE_JETS, 0.4, 0.07, 0.22);
      return canvas;
    case 'blueBurn':
      paintJets(ctx, jet, palette.bullet, palette.hazard, palette.impact, BLUE_JETS, 0.95, 0.09, 0.4);
      return canvas;
    case 'blueFlare':
      paintJets(ctx, jet, palette.bullet, palette.hazard, palette.impact, BLUE_JETS, 1.35, 0.115, 0.55);
      return canvas;
    case 'viper':
      paintViper(ctx, f, palette, size);
      return canvas;
    case 'viperIdle':
      paintJets(ctx, jet, VIPER.flame, VIPER.core, '#ffffff', VIPER_JETS, 0.45, 0.06, 0.22);
      return canvas;
    case 'viperBurn':
      paintJets(ctx, jet, VIPER.flame, VIPER.core, '#ffffff', VIPER_JETS, 1.0, 0.075, 0.4);
      return canvas;
    case 'viperFlare':
      paintJets(ctx, jet, VIPER.flame, VIPER.core, '#ffffff', VIPER_JETS, 1.4, 0.095, 0.6);
      return canvas;
    // Everything else is drawn in world units, below.
    case 'wall':
    case 'ceiling':
    case 'deck':
    case 'lamp':
    case 'bar':
    case 'door':
    case 'spill':
    case 'pad':
    case 'beam':
    case 'stars':
    case 'starsNear':
    case 'bayTop':
    case 'bayBottom':
    case 'field':
    case 'beacon':
    case 'pilotRun0':
    case 'pilotRun1':
    case 'pilotRun2':
    case 'pilotRun3':
    case 'pilotLeap':
    case 'station':
    case 'flash':
    case 'pool':
    case 'contrail':
    case 'black':
      break;
    default: {
      const never: never = kind;
      throw new Error(`bakePort: unbaked ${String(never)}`);
    }
  }
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / extent, size / extent);
  paintPiece(ctx, kind, palette, extent, size / extent, pilot);
  return canvas;
}

/*
  ── THE ROOM ─────────────────────────────────────────────────────────────────────────────────────
*/

function paintPiece(ctx: CanvasRenderingContext2D, kind: PortKind, palette: Palette, extent: number, px: number, pilot: GolferRow): void {
  const h = extent / 2;
  switch (kind) {
    case 'wall': {
      // One panel a tile, inset from its seams, with a rivet at each corner and a conduit through it.
      ctx.fillStyle = PORT_INK.wall;
      ctx.fillRect(-h, -h, extent, extent);
      ctx.fillStyle = shade(PORT_INK.wall, 0.07);
      ctx.fillRect(-h + 1.2, -h + 1.2, extent - 2.4, extent - 2.4);
      ctx.fillStyle = PORT_INK.wallDark;
      ctx.fillRect(-h, -h, extent, 0.5);
      ctx.fillRect(-h, -h, 0.5, extent);
      for (const [x, y] of [[-h + 2.2, -h + 2.2], [h - 2.2, -h + 2.2], [-h + 2.2, h - 2.2], [h - 2.2, h - 2.2]] as const) {
        ctx.fillStyle = PORT_INK.seam;
        ctx.beginPath();
        ctx.arc(x, y, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PORT_INK.seam;
      ctx.fillRect(-h, 3, extent, 1.3);
      ctx.fillStyle = shade(PORT_INK.seam, 0.25);
      ctx.fillRect(-h, 3, extent, 0.3);
      return;
    }
    case 'ceiling': {
      // A truss: two chords and the braces between them, and a working light on the lower chord.
      ctx.fillStyle = PORT_INK.wallDark;
      ctx.fillRect(-h, -h, extent, extent);
      ctx.strokeStyle = PORT_INK.seam;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-h, -h + 1);
      ctx.lineTo(0, 6.5);
      ctx.lineTo(h, -h + 1);
      ctx.stroke();
      ctx.fillStyle = PORT_INK.seam;
      ctx.fillRect(-h, -h, extent, 1.4);
      ctx.fillRect(-h, 6.5, extent, 1.6);
      ctx.fillStyle = shade(PORT_INK.seam, 0.3);
      ctx.fillRect(-h, 6.5, extent, 0.35);
      radial(ctx, 0, 8.6, 1.6, PORT_INK.lamp, 0.8);
      return;
    }
    case 'deck': {
      const fall = ctx.createLinearGradient(0, -h, 0, h);
      fall.addColorStop(0, PORT_INK.deck);
      fall.addColorStop(1, PORT_INK.deckDark);
      ctx.fillStyle = fall;
      ctx.fillRect(-h, -h, extent, extent);
      ctx.fillStyle = PORT_INK.seam;
      ctx.fillRect(-h, -h, extent, 0.9);
      ctx.fillStyle = shade(PORT_INK.seam, 0.35);
      ctx.fillRect(-h, -h, extent, 0.25);
      // Plank seams that lean away from the viewer, so the deck reads as a floor and not a wall.
      ctx.strokeStyle = PORT_INK.deckDark;
      ctx.lineWidth = 0.35;
      for (const x of [-h, 0]) {
        ctx.beginPath();
        ctx.moveTo(x + 2, -h + 1);
        ctx.lineTo(x - 2, h);
        ctx.stroke();
      }
      return;
    }
    case 'lamp': {
      // The warm lamp over the deck — the predecessor's, hung from the truss, with its cone of light.
      const cone = ctx.createLinearGradient(0, -h + 4, 0, h);
      cone.addColorStop(0, rgba(PORT_INK.lamp, 0.34));
      cone.addColorStop(1, rgba(PORT_INK.lamp, 0));
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(-4, -h + 4);
      ctx.lineTo(4, -h + 4);
      ctx.lineTo(19, h);
      ctx.lineTo(-19, h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PORT_INK.seam;
      ctx.beginPath();
      ctx.moveTo(-2.5, -h);
      ctx.lineTo(2.5, -h);
      ctx.lineTo(4.5, -h + 4);
      ctx.lineTo(-4.5, -h + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PORT_INK.lamp;
      ctx.fillRect(-4, -h + 3.4, 8, 0.8);
      radial(ctx, 0, -h + 4, 6, PORT_INK.lamp, 0.55);
      return;
    }
    case 'bar':
      paintBar(ctx, palette, px);
      return;
    case 'door': {
      // A sliding hatch with a lit porthole: it slides behind the facade, so it is drawn whole.
      ctx.fillStyle = '#4a5a74';
      ctx.fillRect(-6, -9, 12, 18);
      ctx.fillStyle = '#3a4860';
      ctx.fillRect(-5, -8, 10, 16);
      ctx.fillStyle = PORT_INK.seam;
      ctx.fillRect(-6, 2.5, 12, 0.6);
      ctx.beginPath();
      ctx.arc(0, -3, 2.6, 0, Math.PI * 2);
      ctx.fill();
      radial(ctx, 0, -3, 2.1, PORT_INK.lamp, 1);
      ctx.fillStyle = PORT_INK.hazard;
      ctx.fillRect(3.4, 0.2, 1.4, 0.7);
      return;
    }
    case 'spill':
      // The bar's warm light, seen through the doorway and thrown onto the deck in front of it.
      radial(ctx, 0, 0, h, PORT_INK.lamp, 0.95);
      return;
    case 'pad': {
      radialEllipse(ctx, 0, -1.2, 16, 2.6, palette.player, 0.28);
      ctx.fillStyle = '#1d2433';
      ctx.fillRect(-14, -1.6, 28, 3);
      for (let x = -12.5; x < 12.5; x += 3) {
        ctx.fillStyle = PORT_INK.hazard;
        ctx.beginPath();
        ctx.moveTo(x, -0.9);
        ctx.lineTo(x + 1.3, -0.9);
        ctx.lineTo(x + 2.1, 0.9);
        ctx.lineTo(x + 0.8, 0.9);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = PORT_INK.pad;
      ctx.fillRect(-14, -1.8, 28, 0.45);
      radial(ctx, -13.5, -1.4, 1.4, PORT_INK.pad, 1);
      radial(ctx, 13.5, -1.4, 1.4, PORT_INK.pad, 1);
      return;
    }
    case 'beam': {
      // The column a ship rides on above its pad, lit from below and gone by the top.
      const rise = ctx.createLinearGradient(0, h, 0, -h);
      rise.addColorStop(0, rgba(PORT_INK.pad, 0.3));
      rise.addColorStop(1, rgba(PORT_INK.pad, 0));
      ctx.fillStyle = rise;
      ctx.beginPath();
      ctx.moveTo(-12, h - 4);
      ctx.lineTo(12, h - 4);
      ctx.lineTo(8, -h);
      ctx.lineTo(-8, -h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(PORT_INK.pad, 0.18);
      ctx.lineWidth = 0.35;
      for (let y = h - 8; y > -h + 6; y -= 5) {
        const w = 8 + (4 * (y + h)) / extent;
        ctx.beginPath();
        ctx.ellipse(0, y, w, 1, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }
    case 'stars':
      paintStars(ctx, makeRng('port').stream('stars'), h, 90, 0.12, 0.3, 0.25, 0.6);
      return;
    case 'starsNear':
      paintStars(ctx, makeRng('port').stream('stars-near'), h, 22, 0.25, 0.5, 0.6, 1);
      return;
    case 'bayTop':
    case 'bayBottom': {
      // The edge of the room: a bulkhead with the bay's door run back into it, and a stripe on its lip.
      const top = kind === 'bayTop';
      const s = top ? 1 : -1;
      ctx.save();
      ctx.scale(1, s);
      ctx.fillStyle = '#2f3a52';
      ctx.fillRect(-10, -h, 5, h + 4);
      ctx.fillStyle = PORT_INK.seam;
      for (let y = -h + 2; y < 3; y += 3) ctx.fillRect(-10, y, 5, 0.4);
      ctx.fillStyle = PORT_INK.wallDark;
      ctx.fillRect(-5, -h, 8, h + 7);
      ctx.fillStyle = shade(PORT_INK.wallDark, 0.2);
      ctx.fillRect(2, -h, 1, h + 7);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-6, 7, 10, 3);
      ctx.clip();
      ctx.fillStyle = '#111111';
      ctx.fillRect(-6, 7, 10, 3);
      ctx.fillStyle = PORT_INK.hazard;
      for (let x = -9; x < 5; x += 2) {
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x + 1, 10);
        ctx.lineTo(x + 4, 7);
        ctx.lineTo(x + 3, 7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();
      radial(ctx, -1, 11.5 * s, 1.3, PORT_INK.pad, 1);
      return;
    }
    case 'field': {
      // The atmosphere field across the open bay: faint, and scanned, so it is there without hiding space.
      const sheet = ctx.createLinearGradient(-2, 0, 2, 0);
      sheet.addColorStop(0, rgba(PORT_INK.pad, 0));
      sheet.addColorStop(0.5, rgba(PORT_INK.pad, 0.3));
      sheet.addColorStop(1, rgba(PORT_INK.pad, 0));
      ctx.fillStyle = sheet;
      ctx.fillRect(-2, -30, 4, 60);
      ctx.fillStyle = rgba(PORT_INK.pad, 0.2);
      for (let y = -30; y < 30; y += 2.5) ctx.fillRect(-1.2, y, 2.4, 0.3);
      return;
    }
    case 'beacon':
      radial(ctx, 0, 0, h, PORT_INK.alarm, 0.95);
      ctx.fillStyle = '#ffd0c8';
      ctx.beginPath();
      ctx.arc(0, 0, 0.9, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 'pilotRun0':
    case 'pilotRun1':
    case 'pilotRun2':
    case 'pilotRun3':
    case 'pilotLeap':
      // The chosen golfer, at the pilot's size — 0415; the figure is `src/render/golfer-art.ts`'s.
      paintRunner(ctx, pilot, kind, PILOT_STANDS / 5);
      return;
    case 'station':
      paintStation(ctx, palette, h);
      return;
    case 'flash':
      radial(ctx, 0, 0, h, '#ffffff', 1);
      return;
    case 'pool':
      // The bar's light lying on the deck in front of its door: the same warm light, flattened.
      radialEllipse(ctx, 0, 0, h, h * 0.16, PORT_INK.lamp, 0.8);
      return;
    case 'contrail': {
      // A length of vapour, long across the box and a hair high, soft at both ends and both edges —
      // laid end to end along where a ship has been, it is a trail (0414).
      const along = ctx.createLinearGradient(-h, 0, h, 0);
      along.addColorStop(0, 'rgba(235, 244, 255, 0)');
      along.addColorStop(0.5, 'rgba(235, 244, 255, 0.9)');
      along.addColorStop(1, 'rgba(235, 244, 255, 0)');
      ctx.save();
      ctx.scale(1, 0.14);
      radial(ctx, 0, 0, h, '#ffffff', 0.9);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = along;
      ctx.fillRect(-h, -h, extent, extent);
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    case 'black':
      ctx.fillStyle = '#000000';
      ctx.fillRect(-h, -h, extent, extent);
      return;
    case 'blue':
    case 'blueIdle':
    case 'blueBurn':
    case 'blueFlare':
    case 'viper':
    case 'viperIdle':
    case 'viperBurn':
    case 'viperFlare':
      throw new Error(`bakePort: ${kind} is drawn in the ship's own frame`);
    default: {
      const never: never = kind;
      throw new Error(`bakePort: unpainted ${String(never)}`);
    }
  }
}

/** A soft round light: full at the centre, gone at `radius`. */
function radial(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colour: string, alpha: number): void {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
  light.addColorStop(0, rgba(colour, alpha));
  light.addColorStop(0.4, rgba(colour, alpha * 0.55));
  light.addColorStop(1, rgba(colour, 0));
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** The same light, flattened — a pool on a floor. */
function radialEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, colour: string, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  radial(ctx, 0, 0, rx, colour, alpha);
  ctx.restore();
}

function paintStars(ctx: CanvasRenderingContext2D, rng: Rng, h: number, count: number, rMin: number, rMax: number, aMin: number, aMax: number): void {
  for (let i = 0; i < count; i++) {
    const x = rng.range(-h, h);
    const y = rng.range(-h, h);
    const r = rng.range(rMin, rMax);
    ctx.fillStyle = rgba('#cfe0ff', rng.range(aMin, aMax));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (r > 0.42) {
      ctx.fillRect(x - r * 3, y - 0.05, r * 6, 0.1);
      ctx.fillRect(x - 0.05, y - r * 3, 0.1, r * 6);
    }
  }
}

/**
 * The Parrot's Perch, from the deck: an awning strung with lights, a window onto the shelf of glowing
 * bottles with the Parrot behind the counter, its neon hung beside the door, and the doorway itself —
 * cut clean through, so the hatch that slides behind it and the light behind that both show.
 *
 * In the bar's own units: its centre is `STAGE.bar`, so the deck is at +32 and the doorway is
 * `STAGE.doorway` less that centre.
 */
function paintBar(ctx: CanvasRenderingContext2D, palette: Palette, px: number): void {
  // The wall.
  ctx.fillStyle = PORT_INK.woodDark;
  ctx.fillRect(-30, -21, 60, 53);
  ctx.fillStyle = shade(PORT_INK.woodDark, 0.12);
  for (let y = -19; y < 32; y += 3) ctx.fillRect(-30, y, 60, 0.25);
  ctx.fillStyle = PORT_INK.wood;
  ctx.fillRect(-30, -21, 1.2, 53);
  ctx.fillRect(28.8, -21, 1.2, 53);
  // The awning, and the string of lights under it.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.moveTo(-32, -27);
  ctx.lineTo(32, -27);
  ctx.lineTo(30.5, -21);
  ctx.lineTo(-30.5, -21);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PORT_INK.woodLight;
  ctx.fillRect(-30.5, -21.4, 61, 0.8);
  for (let i = 0; i < 15; i++) {
    const x = -28 + i * 4;
    const y = -19.2 + Math.sin(i * 1.3) * 0.4;
    const colour = PORT_INK.bottle[i % PORT_INK.bottle.length]!;
    radial(ctx, x, y, 1.4, colour, 0.7);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y, 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  // The window: warm glass, two shelves of bottles, and the Parrot's silhouette behind the counter.
  ctx.fillStyle = PORT_INK.woodLight;
  ctx.fillRect(-27.5, -9.5, 22, 23);
  const glass = ctx.createLinearGradient(0, -8.5, 0, 12.5);
  glass.addColorStop(0, '#ffcf8a');
  glass.addColorStop(1, '#a0643a');
  ctx.fillStyle = glass;
  ctx.fillRect(-26.5, -8.5, 20, 21);
  for (const [shelf, seed] of [[-1.5, 0], [5, 3]] as const) {
    ctx.fillStyle = PORT_INK.woodDark;
    ctx.fillRect(-26.5, shelf, 20, 0.6);
    for (let i = 0; i < 7; i++) {
      const x = -25 + i * 2.7 + (i % 2) * 0.4;
      const tall = 2.2 + ((i + seed) % 3) * 0.6;
      const colour = PORT_INK.bottle[(i + seed) % PORT_INK.bottle.length]!;
      ctx.fillStyle = colour;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x - 0.55, shelf - tall, 1.1, tall);
      ctx.fillRect(x - 0.22, shelf - tall - 0.8, 0.44, 0.8);
      ctx.globalAlpha = 1;
    }
  }
  // The Parrot, behind the counter, as a shape against the light.
  ctx.fillStyle = 'rgba(43, 29, 18, 0.85)';
  ctx.beginPath();
  ctx.ellipse(-12, 8.8, 2.2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-11.4, 5, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, 4.4);
  ctx.lineTo(-8.5, 5.4);
  ctx.lineTo(-10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PORT_INK.wood;
  ctx.fillRect(-26.5, 10.5, 20, 2);
  ctx.fillStyle = PORT_INK.woodLight;
  ctx.fillRect(-17, -8.5, 0.6, 21);
  // The neon, hung between the window and the door: a parrot on a perch, in the bar's green.
  ctx.fillStyle = '#0d1512';
  ctx.fillRect(-3.5, -16, 10, 21);
  ctx.save();
  ctx.shadowColor = PORT_INK.neon;
  ctx.shadowBlur = 1.4 * px;
  ctx.strokeStyle = PORT_INK.neon;
  ctx.lineWidth = 0.45;
  ctx.lineCap = 'round';
  ctx.strokeRect(-3, -15.5, 9, 20);
  ctx.strokeStyle = '#d6ffe6';
  ctx.beginPath();
  ctx.arc(2.4, -9.5, 1.6, 0, Math.PI * 2);
  ctx.moveTo(3.9, -10.1);
  ctx.lineTo(5.2, -9.2);
  ctx.lineTo(3.8, -8.5);
  ctx.moveTo(1.2, -8.2);
  ctx.bezierCurveTo(-0.6, -6.5, -0.4, -2.6, 1.4, -1.8);
  ctx.bezierCurveTo(3.2, -2.4, 3.8, -5.6, 3.1, -8.1);
  ctx.moveTo(1, -2);
  ctx.lineTo(-0.4, 2.8);
  ctx.moveTo(1.6, -2);
  ctx.lineTo(1.2, 3.2);
  ctx.moveTo(-1.8, -1.4);
  ctx.lineTo(5.2, -1.4);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = PORT_INK.neon;
  ctx.beginPath();
  ctx.arc(2.9, -9.9, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // The doorway: a frame, a lamp over it, and a hole straight through the wall.
  ctx.fillStyle = PORT_INK.woodLight;
  ctx.fillRect(7, 12, 14, 20);
  radial(ctx, 14, 10.8, 3, PORT_INK.lamp, 0.8);
  ctx.fillStyle = PORT_INK.lamp;
  ctx.fillRect(12.8, 10.3, 2.4, 0.8);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(8, 14, 12, 18);
  ctx.globalCompositeOperation = 'source-over';
  // A kick strip along the foot of the wall, either side of the door.
  ctx.fillStyle = '#1a120b';
  ctx.fillRect(-30, 30.4, 37, 1.6);
  ctx.fillRect(21, 30.4, 9, 1.6);
  // A barrel by the door, for somewhere to have been sitting.
  ctx.fillStyle = PORT_INK.wood;
  ctx.fillRect(23, 24, 5, 8);
  ctx.fillStyle = PORT_INK.seam;
  ctx.fillRect(23, 25.5, 5, 0.5);
  ctx.fillRect(23, 29.5, 5, 0.5);
  void palette;
}

/**
 * The outside of the port — the Mothership's flank, lit windows in rows, running lights at its
 * corners, and the bay the chase came out of glowing in its side.
 *
 * Its bay mouth is at `+42` along its own centre and `+2` across, which `src/render/port.ts` leaves
 * from.
 */
function paintStation(ctx: CanvasRenderingContext2D, palette: Palette, h: number): void {
  const hull = ctx.createLinearGradient(0, -h, 0, h);
  hull.addColorStop(0, '#46526a');
  hull.addColorStop(0.55, '#2a3346');
  hull.addColorStop(1, '#151a26');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-h, -44);
  ctx.lineTo(28, -44);
  ctx.lineTo(46, -26);
  ctx.lineTo(46, 30);
  ctx.lineTo(30, 48);
  ctx.lineTo(-h, 48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = rgba(PORT_INK.seam, 0.7);
  ctx.lineWidth = 0.3;
  for (let x = -h; x < 46; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, -44);
    ctx.lineTo(x, 48);
    ctx.stroke();
  }
  for (let y = -40; y < 48; y += 11) {
    ctx.beginPath();
    ctx.moveTo(-h, y);
    ctx.lineTo(46, y);
    ctx.stroke();
  }
  const rng = makeRng('port').stream('windows');
  for (let y = -36; y < 44; y += 5.5) {
    for (let x = -h + 2; x < 36; x += 3.2) {
      if (rng.float() < 0.45) continue;
      ctx.fillStyle = rgba(PORT_INK.lamp, rng.range(0.35, 0.9));
      ctx.fillRect(x, y, 1.6, 0.9);
    }
  }
  ctx.restore();
  // The mast and dish on the roof.
  ctx.fillStyle = '#39445c';
  ctx.fillRect(9.6, -54, 0.8, 10);
  ctx.beginPath();
  ctx.ellipse(10, -54, 4, 1.4, -0.3, 0, Math.PI);
  ctx.fill();
  radial(ctx, 10, -54.5, 1.5, PORT_INK.alarm, 1);
  // The bay mouth, cut into the flank, lit from inside and sealed by its field.
  ctx.fillStyle = '#10141e';
  ctx.fillRect(36, -12, 10, 28);
  const inside = ctx.createLinearGradient(36, 0, 46, 0);
  inside.addColorStop(0, rgba(PORT_INK.lamp, 0.55));
  inside.addColorStop(1, rgba(PORT_INK.lamp, 0.95));
  ctx.fillStyle = inside;
  ctx.fillRect(37, -10, 9, 24);
  ctx.fillStyle = rgba(PORT_INK.pad, 0.45);
  ctx.fillRect(45, -10, 1.2, 24);
  ctx.fillStyle = PORT_INK.hazard;
  for (let y = -12; y < 17; y += 28) ctx.fillRect(35, y, 12, 0.9);
  radial(ctx, 46, 2, 14, PORT_INK.lamp, 0.35);
  // Running lights, red to port and green to starboard, as a ship has them.
  radial(ctx, 46, -26, 2, PORT_INK.alarm, 1);
  radial(ctx, 46, 30, 2, PORT_INK.neon, 1);
}

/*
  ── THE SHIPS ────────────────────────────────────────────────────────────────────────────────────
*/

/** Where the fighter's two nacelles end, in its own frame — `SHIP_NACELLE` and `SHIP_CORE` in `bake.ts`. */
const BLUE_JETS: readonly Pt[] = [
  [-0.78, -0.21],
  [-0.78, 0.21],
];

/** The Viper's single nozzle, at the end of her tail. */
const VIPER_JETS: readonly Pt[] = [[-0.87, 0.025]];

/**
 * The fighter the player flies, at hangar size: the same hull and the same livery, and an outline
 * thinned to suit a ship this near — at the game's proportion it would be a finger's width.
 */
function paintBlue(ctx: CanvasRenderingContext2D, f: Frame, palette: Palette, size: number): void {
  ctx.fillStyle = palette.player;
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = Math.max(1, size * 0.014);
  ctx.beginPath();
  trace(ctx, f, SHIP_HULL);
  seal(ctx);
  paintShip(ctx, f, palette, 0, 'pulse');
}

/**
 * A ship's exhaust, in the ship's own frame so it blits at the ship's centre: an outer flame, an inner
 * one and a white core out of every nozzle, and a glow at the root. `length` and `width` are fractions
 * of `r`.
 */
function paintJets(
  ctx: CanvasRenderingContext2D,
  f: Frame,
  outer: string,
  inner: string,
  core: string,
  jets: readonly Pt[],
  length: number,
  width: number,
  bloom: number,
): void {
  for (const [x, y] of jets) {
    glow(ctx, f, outer, x - length * 0.3, y, bloom, 0.75);
    poly(ctx, f, outer, [[x + 0.02, y - width], [x - length * 0.45, y - width * 0.8], [x - length, y], [x - length * 0.45, y + width * 0.8], [x + 0.02, y + width]], 0.85);
    poly(ctx, f, inner, [[x + 0.02, y - width * 0.6], [x - length * 0.4, y - width * 0.45], [x - length * 0.72, y], [x - length * 0.4, y + width * 0.45], [x + 0.02, y + width * 0.6]], 0.9);
    poly(ctx, f, core, [[x + 0.02, y - width * 0.28], [x - length * 0.3, y], [x + 0.02, y + width * 0.28]], 0.9);
    disc(ctx, f, core, x, y, width * 0.5, 0.9);
  }
}

/**
 * The Viper's ship, in the Coil Wyrm-Ship's livery: a racer built as a serpent — a snake's head for a
 * prow with a lit eye and fangs under it, a bubble of acid glass on its back, scales down its flank, a
 * swept wing, and a dorsal fin that curls over like a tail about to strike.
 */
function paintViper(ctx: CanvasRenderingContext2D, f: Frame, palette: Palette, size: number): void {
  const X = (x: number): number => f.half + x * f.r;
  const Y = (y: number): number => f.half + y * f.r;
  const hullPath = (): void => {
    ctx.beginPath();
    ctx.moveTo(X(1), Y(0.03));
    ctx.bezierCurveTo(X(0.95), Y(-0.06), X(0.84), Y(-0.13), X(0.72), Y(-0.14));
    ctx.bezierCurveTo(X(0.62), Y(-0.16), X(0.48), Y(-0.2), X(0.36), Y(-0.16));
    ctx.lineTo(X(-0.1), Y(-0.17));
    ctx.bezierCurveTo(X(-0.4), Y(-0.17), X(-0.66), Y(-0.12), X(-0.8), Y(-0.06));
    ctx.lineTo(X(-0.88), Y(-0.05));
    ctx.lineTo(X(-0.88), Y(0.1));
    ctx.bezierCurveTo(X(-0.6), Y(0.18), X(-0.4), Y(0.21), X(-0.2), Y(0.2));
    ctx.bezierCurveTo(X(0.1), Y(0.2), X(0.4), Y(0.19), X(0.6), Y(0.13));
    ctx.bezierCurveTo(X(0.8), Y(0.09), X(0.93), Y(0.07), X(1), Y(0.03));
    ctx.closePath();
  };
  const outline = Math.max(1, size * 0.012);
  // The far wing, in shadow, behind the hull.
  poly(ctx, f, shade(VIPER.body, -0.35), [[0.2, 0.05], [-0.15, -0.36], [-0.34, -0.38], [-0.28, -0.1]]);
  // The dorsal fin, curling over the back: an outline stroke, then the fin itself.
  const fin = (): void => {
    ctx.beginPath();
    ctx.moveTo(X(-0.12), Y(-0.16));
    ctx.bezierCurveTo(X(-0.3), Y(-0.5), X(-0.72), Y(-0.56), X(-0.7), Y(-0.34));
    ctx.bezierCurveTo(X(-0.69), Y(-0.2), X(-0.5), Y(-0.24), X(-0.52), Y(-0.34));
  };
  ctx.lineCap = 'round';
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = f.r * 0.1;
  fin();
  ctx.stroke();
  ctx.strokeStyle = VIPER.accent;
  ctx.lineWidth = f.r * 0.065;
  fin();
  ctx.stroke();
  // The hull, shaded from a light back to a dark belly.
  ctx.fillStyle = VIPER.body;
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = outline;
  hullPath();
  ctx.fill();
  const shadeDown = ctx.createLinearGradient(0, Y(-0.2), 0, Y(0.21));
  shadeDown.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  shadeDown.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  shadeDown.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = shadeDown;
  hullPath();
  ctx.fill();
  ctx.stroke();
  // The lateral line and the scales under it.
  ctx.strokeStyle = VIPER.accent;
  ctx.lineWidth = f.r * 0.018;
  ctx.beginPath();
  ctx.moveTo(X(0.62), Y(-0.03));
  ctx.bezierCurveTo(X(0.2), Y(-0.04), X(-0.3), Y(-0.03), X(-0.78), Y(0));
  ctx.stroke();
  for (let x = 0.46; x > -0.66; x -= 0.1) {
    poly(ctx, f, VIPER.accent, [[x, 0.01], [x - 0.05, 0.06], [x, 0.11], [x + 0.025, 0.11], [x - 0.02, 0.06], [x + 0.025, 0.01]], 0.75);
  }
  // The near wing, swept, with its leading edge lit.
  poly(ctx, f, shade(VIPER.body, 0.08), [[0.16, 0.13], [-0.3, 0.46], [-0.52, 0.46], [-0.36, 0.16]]);
  poly(ctx, f, VIPER.accent, [[0.16, 0.13], [-0.3, 0.46], [-0.35, 0.46], [0.09, 0.14]]);
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = outline;
  ctx.beginPath();
  trace(ctx, f, [[0.16, 0.13], [-0.3, 0.46], [-0.52, 0.46], [-0.36, 0.16]]);
  ctx.stroke();
  // The canopy — acid glass, with the sky in it.
  ctx.fillStyle = VIPER.glass;
  ctx.beginPath();
  ctx.ellipse(X(0.12), Y(-0.19), f.r * 0.2, f.r * 0.085, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(X(0.17), Y(-0.235), f.r * 0.07, f.r * 0.022, 0, 0, Math.PI * 2);
  ctx.fill();
  // The head: an eye with a slit in it, a nostril, the mouth line and two fangs under the jaw.
  glow(ctx, f, VIPER.eye, 0.74, -0.07, 0.09, 0.8);
  disc(ctx, f, VIPER.eye, 0.74, -0.07, 0.036);
  poly(ctx, f, '#000000', [[0.745, -0.1], [0.75, -0.07], [0.745, -0.04], [0.735, -0.07]]);
  disc(ctx, f, '#000000', 0.93, -0.01, 0.012);
  ctx.strokeStyle = VIPER.belly;
  ctx.lineWidth = f.r * 0.016;
  ctx.beginPath();
  ctx.moveTo(X(0.98), Y(0.045));
  ctx.lineTo(X(0.62), Y(0.1));
  ctx.stroke();
  poly(ctx, f, palette.impact, [[0.9, 0.06], [0.875, 0.16], [0.855, 0.068]]);
  poly(ctx, f, palette.impact, [[0.8, 0.078], [0.775, 0.18], [0.755, 0.085]]);
  // The nozzle, dark, with the violet of her engine already in it.
  disc(ctx, f, '#0a0f0c', -0.87, 0.025, 0.07);
  glow(ctx, f, VIPER.flame, -0.87, 0.025, 0.12, 0.6);
}
