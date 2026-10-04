/**
 * The light is additive — `docs/decisions/0470-the-light-is-additive.md`.
 *
 * *"Lightning needs to be brighter and flashier. Lasers need more depth and layers. And the jellyfish
 * boss's laser/lightning attack still looks terrible against the background."* Three complaints about
 * one verb. What is held here is the verb's contract — the light is added and the context is put back
 * — and the two asks in the shape the painter gives them: a beam is a column of layers, a flash snaps
 * and dies. Whether it LOOKS right is `tests/bolt.browser.test.ts`'s, in pixels, and the photographs'.
 */
import { describe, expect, it } from 'vitest';
import { BEAM_BOLT_KIND } from '../src/content/bosses.ts';
import { PALETTES } from '../src/content/palette.ts';
import { SHOTS } from '../src/content/shots.ts';
import type { Atlas } from '../src/render/bake.ts';
import { BEAM_LAYERS, CanvasSurface, DOT_LAYERS, FLASH_LAYERS } from '../src/render/canvas.ts';
import { boltInks } from '../src/render/bolt-inks.ts';
import { BOLT_STEPS, STROKES_PER_LINK, paintBolts } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { viewOf } from '../src/sim/camera.ts';
import { makeEntity, reset, type Entity } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import { tracingPen, type Stroke } from './paths.ts';

const GLOW = PALETTES.vivid.player;
const CORE = PALETTES.vivid.impact;
const DARK = PALETTES.vivid.space;
const HOSTILE = PALETTES.vivid.enemy;

/** The canvas backend over a recording pen, with the vivid palette's inks. */
function canvas(): { surface: CanvasSurface; pen: ReturnType<typeof tracingPen>['pen']; inks: () => readonly Stroke[] } {
  const { pen, trace } = tracingPen();
  const surface = new CanvasSurface(pen as unknown as CanvasRenderingContext2D, { bitmaps: [], extents: [] } as unknown as Atlas);
  surface.setBolt(boltInks(GLOW, CORE, DARK, HOSTILE, CORE));
  return { surface, pen, inks: () => trace.inks };
}

const LINE = new Float32Array([0, 0, 50, 10, 100, 0]);
const POINT = new Float32Array([40, 40]);

/** The light strokes of a call, widest first. */
function light(inks: readonly Stroke[]): Stroke[] {
  return inks.filter((s) => s.colour !== DARK).sort((a, b) => b.width - a.width);
}

describe('0470 — the light is additive', () => {
  it('THE LIGHT IS ADDITIVE, AND THE CONTEXT IS PUT BACK: every glow and core is added, the rim is laid, and nothing after a bolt is', () => {
    /*
      A translucent paint laid over the sky is a tint of the sky; light added to it is light. And a
      context left `lighter` adds every blit that follows — the ship, the HUD — to the frame, which is
      the failure this guard is really for: it would be invisible in any test that counts calls.
    */
    for (const [name, points, count, beam] of [
      ['a flash', LINE, 3, false],
      ['a dot', POINT, 1, false],
      ['a beam', LINE, 3, true],
    ] as const) {
      const { surface, pen, inks } = canvas();
      surface.bolt(points, count, 2, 0.9, false, beam);
      expect(pen.globalCompositeOperation, `${name} left the context adding`).toBe('source-over');
      expect(pen.globalAlpha, `${name} left the context's alpha down`).toBe(1);
      expect(inks().length, `${name} was not stroked`).toBeGreaterThan(1);
      for (const s of inks()) {
        if (s.colour === DARK) expect(s.composite, `${name}'s rim is added, which adds nothing`).toBe('source-over');
        else expect(s.composite, `${name}'s ${s.colour} at ${s.width} is laid as paint`).toBe('lighter');
      }
      const rims = inks().filter((s) => s.colour === DARK).length;
      // A dot is its glow and its core — 0238; everything else stands in a rim — 0236.
      expect(rims, `${name} has ${rims} rims`).toBe(count === 1 ? 0 : 1);
    }
  });

  it('THE ASK, LAYERS: a beam is a column — at least four layers of light, each narrower one louder, the body as wide as it hurts, a white core narrowest', () => {
    /*
      0250's picture guard holds that a beam is drawn as wide as it hurts, through the stroke's width
      times four; this holds what 0470 added under that: that the four-wide stroke is a BODY with a
      brighter inside and a white heart, not a band. Hostile, because every beam is a boss's.
    */
    const width = 3;
    const { surface, inks } = canvas();
    surface.bolt(LINE, 3, width, 1, true, true);
    const layers = light(inks());
    expect(layers.length, 'a beam is a flash with a different name').toBeGreaterThanOrEqual(4);
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i]!.alpha, `layer ${i} at ${layers[i]!.width} is no louder than the wider one under it`).toBeGreaterThan(layers[i - 1]!.alpha);
    }
    expect(layers.some((s) => Math.abs(s.width - 4 * width) < 1e-9), 'no layer is the hurt width — 0250').toBe(true);
    const core = layers[layers.length - 1]!;
    expect(core.colour, 'the narrowest layer is not the impact white').toBe(CORE);
    expect(core.alpha, 'the core is not full').toBe(1);
    for (const s of layers.slice(0, -1)) expect(s.colour, 'a glow layer wears the core’s ink').toBe(HOSTILE);
    const rim = inks().find((s) => s.colour === DARK)!;
    expect(rim.width, 'the rim is inside the body it should edge').toBeGreaterThan(4 * width);
    // And the stacks really are two — the flash is not drawn with the beam's layers or vice versa.
    const flash = canvas();
    flash.surface.bolt(LINE, 3, width, 1, true, false);
    // By what is stroked and not by how many: since 0520 a flash has as many layers of light as a beam.
    const shape = (s: readonly Stroke[]): string => s.map((l) => `${l.width}/${l.alpha}`).join(' ');
    expect(shape(light(flash.inks())), 'a flash is drawn as a beam').not.toBe(shape(layers));
    expect(BEAM_LAYERS.length).toBe(inks().length);
    expect(FLASH_LAYERS.length).toBe(flash.inks().length);
    // What 0238 forbids a dot is a rim or a wash, not a third layer: 0520 gave it a hot heart, inside its glow.
    expect(DOT_LAYERS.some((l) => l.ink === 'dark'), 'a dot has grown a rim').toBe(false);
    expect(Math.max(...DOT_LAYERS.map((l) => l.width)), 'a dot has grown a wash wider than its glow').toBe(4);
  });

  /** A surface that keeps every bolt call. */
  class Recorder implements Surface {
    readonly calls: { points: number[]; count: number; width: number; alpha: number }[] = [];
    clear(): void {}
    blit(): void {}
    bolt(points: Float32Array, count: number, width: number, alpha: number): void {
      this.calls.push({ points: Array.from(points.subarray(0, count * 2)), count, width, alpha });
    }
  }

  const view = viewOf(1280, 720);

  /** One link of the arc, `length` units long, straight down the lane, at `lifeFor`. */
  function link(length: number, lifeFor: number): Pool<Entity> {
    const bolts = new Pool<Entity>(2, makeEntity);
    const e = bolts.spawn()!;
    reset(e, 60, 60, SHOTS.arc);
    e.fromAlong = -length;
    e.fromAcross = 0;
    e.lifeFor = lifeFor;
    e.spin = 0x2545f491;
    return bolts;
  }

  /** The link's own stroke: the one through the most points. */
  function main(r: Recorder): { points: number[]; count: number; width: number; alpha: number } {
    return r.calls.reduce((a, b) => (b.count > a.count ? b : a));
  }

  it('THE ASK, FLASHIER: a link is brightest and widest the step it lands, under half its light by half its life, and thinner as it dies — at its stated number of strokes', () => {
    const at = (lifeFor: number): { stroke: ReturnType<typeof main>; calls: number } => {
      const r = new Recorder();
      paintBolts(r, view, link(40, lifeFor), 0, 1);
      return { stroke: main(r), calls: r.calls.length };
    };
    const landed = at(BOLT_STEPS);
    const half = at(BOLT_STEPS / 2);
    const dying = at(1);
    expect(landed.calls, 'a link is not stroked as its stated number of bolt calls').toBe(STROKES_PER_LINK);
    expect(landed.stroke.alpha, 'the flash is not full on the step it lands').toBe(1);
    expect(half.stroke.alpha, 'the flash fades no faster than a straight line — a wire dimming, not a flash').toBeLessThan(0.5);
    expect(dying.stroke.alpha).toBeLessThan(half.stroke.alpha);
    expect(dying.stroke.width, 'the channel does not collapse as it dies').toBeLessThan(landed.stroke.width);
    expect(half.stroke.width).toBeLessThan(landed.stroke.width);
  });

  it('a short link is a bolt and not a knot: no vertex swings more than half a leg, and a long one still swings', () => {
    /*
      Thirteen vertices on a ten-unit link is a leg under a unit long; a swing of a sixth of the link
      on every one of them was a scribble where a strike should be. Measured on the stroke's own points,
      back through the view: the distance of every vertex from the line between the ends, in pixels.
    */
    const off = (length: number): number[] => {
      const r = new Recorder();
      paintBolts(r, view, link(length, BOLT_STEPS), 0, 1);
      const p = main(r).points;
      const n = p.length / 2;
      const [x0, y0, x1, y1] = [p[0]!, p[1]!, p[(n - 1) * 2]!, p[(n - 1) * 2 + 1]!];
      const span = Math.hypot(x1 - x0, y1 - y0);
      const out: number[] = [];
      for (let i = 1; i < n - 1; i++) out.push(Math.abs((x1 - x0) * (y0 - p[i * 2 + 1]!) - (x0 - p[i * 2]!) * (y1 - y0)) / span);
      return out;
    };
    const short = off(10);
    const leg = (10 / (short.length + 1)) * view.scale;
    for (const d of short) expect(d, `a vertex of a ten-unit link stands ${(d / view.scale).toFixed(2)} units off its line`).toBeLessThanOrEqual(leg / 2 + 1e-6);
    const long = off(80);
    expect(Math.max(...long), 'an eighty-unit link is drawn straight — the cap flattened everything').toBeGreaterThan(1 * view.scale);
  });

  it('and a beam blooms as it ignites, settles to the width it hurts, and never goes narrower', () => {
    const bolts = new Pool<Entity>(2, makeEntity);
    const e = bolts.spawn()!;
    reset(e, 60, 60, SHOTS.arc, BEAM_BOLT_KIND);
    e.fromAlong = -100;
    e.fromAcross = 0;
    e.radius = 3;
    e.holdFor = 30;
    const widthAt = (lifeFor: number): number => {
      e.lifeFor = lifeFor;
      const r = new Recorder();
      paintBolts(r, view, bolts, 0, 1, true);
      return main(r).width;
    };
    // The glow is four strokes wide (`src/render/canvas.ts`), so the hurt width is four times the stroke.
    const hurt = e.radius * 2 * view.scale;
    const lit = widthAt(30) * 4;
    const settled = widthAt(30 - BOLT_STEPS) * 4;
    expect(lit, 'the beam does not bloom as it lights').toBeGreaterThan(settled);
    expect(settled, 'a settled beam is not drawn as wide as it hurts').toBeCloseTo(hurt, 6);
    for (let life = 30; life >= 1; life--) expect(widthAt(life) * 4, `at ${life} the beam is narrower than it hurts`).toBeGreaterThanOrEqual(hurt - 1e-9);
  });
});
