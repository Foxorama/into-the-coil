/**
 * EACH PLACE HAS ITS OWN FACES — `docs/decisions/0446-each-place-has-its-own-faces.md`.
 *
 * ⚠️ **ASKED FOR:** *"thematic sprites per level for the enemies so that we actually have interesting
 * levels instead of the same model being used 7 times with a different colour."* Eight kinds are sent
 * by nearly every level; until 0446 each was one drawing in seven skins. Two claims, both in the units
 * the player sees (0027): every place's version of a kind is a different OUTLINE from every other
 * place's, and every version still lies the way its kind flies.
 */

import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/content/enemies.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { drawKind } from '../src/render/bake.ts';
import { SHARED_KINDS } from '../src/render/foes.ts';
import { viewOf } from '../src/sim/camera.ts';
import { tracingPen, type Point } from './paths.ts';

/** The screen the reports were made on, so a pixel here is a pixel somebody looked at. */
const DESKTOP = viewOf(1280, 720);

/** A body's outline in a place, in CSS pixels of that screen. */
function outline(kind: SpriteKind, theme: ThemeKind): readonly (readonly Point[])[] {
  const { pen, trace } = tracingPen();
  drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], SPRITE_EXTENT[kind] * DESKTOP.scale, theme);
  return trace.passes[0]!.subpaths;
}

/** How far a point is from the nearest edge of a shape. */
function nearest(p: Point, shape: readonly (readonly Point[])[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (const ring of shape) {
    for (let i = 0; i < ring.length; i++) {
      const [ax, ay] = ring[i]!;
      const [bx, by] = ring[(i + 1) % ring.length]!;
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(p[0] - (ax + t * dx), p[1] - (ay + t * dy)));
    }
  }
  return best;
}

/** The furthest either outline gets from the other: how different two silhouettes are, in pixels. */
function apart(a: readonly (readonly Point[])[], b: readonly (readonly Point[])[]): number {
  let far = 0;
  for (const ring of a) for (const p of ring) far = Math.max(far, nearest(p, b));
  for (const ring of b) for (const p of ring) far = Math.max(far, nearest(p, a));
  return far;
}

describe('0446 — each place has its own faces', () => {
  it('THE REPORTED ONE, IN CSS PIXELS: no two places draw a shared kind as the same silhouette', () => {
    /*
      ⚠️ **2 PX, BECAUSE THAT IS WHERE 0410 PUT "A DIFFERENT PICTURE".** Below it an outline that
      differs is anti-aliasing changing its mind (`tests/cycles.test.ts`, 0106's floor less a margin).
      The claim is the ask's — *not the same model with a different colour* — and a model is an
      outline: two places whose versions of a kind could be laid one over the other to within a pixel
      are the same model however differently they are painted.
    */
    const same: string[] = [];
    for (const kind of SHARED_KINDS) {
      const base = SPRITE_KINDS[ENEMIES[kind].sprite]!;
      const shapes = THEME_KINDS.map((theme) => outline(base, theme));
      for (let i = 0; i < THEME_KINDS.length; i++) {
        for (let j = i + 1; j < THEME_KINDS.length; j++) {
          const d = apart(shapes[i]!, shapes[j]!);
          if (d < 2) same.push(`the ${kind} at ${THEME_KINDS[i]} and at ${THEME_KINDS[j]} are ${d.toFixed(2)} px apart`);
        }
      }
    }
    expect(same, 'a place sends another place’s model in its own colour').toEqual([]);
  });

  it('and every place’s weaver lies across the lane it weaves along, and its charger along the lane it charges down', () => {
    /*
      ⚠️ **0228's SENTENCE, HELD.** *"The weaver's bar and the charger's needle are still told apart by
      which way they lie."* That was true of one drawing and stated; it is seven drawings each now,
      and a place that drew its weaver as a blob would have taken away the one channel that tells it
      from the charger at twenty pixels. Twice as long one way as the other.

      ⚠️ **AT REST, AND NOT IN THE BENT FRAMES — AND THAT IS THE QUANTITY, NOT A LOOPHOLE.** A weaver's
      other two poses are its length bent into an S (0410); a box drawn round an S is fat because the
      bar is curved, not because it got shorter, and the first run of this over every frame flagged
      the bent frames of five of the new weavers whose rest drawings were 2.2 to 3.3 times as long
      across as along. The way a body LIES is its rest drawing's; how far it bends is
      `tests/cycles.test.ts`'s.
    */
    const wrong: string[] = [];
    for (const theme of THEME_KINDS) {
      for (const [kind, across] of [['weaver', true], ['charger', false]] as const) {
        for (const frame of [SPRITE_KINDS[ENEMIES[kind].sprite]!]) {
          const points = outline(frame, theme).flat();
          const xs = points.map(([x]) => x);
          const ys = points.map(([, y]) => y);
          const along = Math.max(...xs) - Math.min(...xs);
          const wide = Math.max(...ys) - Math.min(...ys);
          const ratio = across ? wide / along : along / wide;
          if (ratio < 2) wrong.push(`the ${frame} at ${theme} is ${ratio.toFixed(2)}× as long ${across ? 'across' : 'along'} the lane as the other way`);
        }
      }
    }
    expect(wrong, 'a body no longer says by its shape which way it flies').toEqual([]);
  });
});
