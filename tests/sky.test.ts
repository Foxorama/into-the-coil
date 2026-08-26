/**
 * A PLACE HAS ITS OWN SKY — `docs/decisions/0195-a-place-has-its-own-sky.md`.
 *
 * ⚠️ **THE REPORT THIS FILE IS MADE OF:** *"a level specific backdrop instead of the same starry
 * canvas and a slight hue change on each level."* It was a description of the code. `makeRng('sky')`
 * took **no theme**, so all seven levels drew the same stars in the same places and `THEMES` tinted
 * them — and nothing in the repository could tell you that, because no guard had ever compared two
 * places' skies.
 *
 * ⚠️ **WHAT IS NOT HERE IS ANY CLAIM ABOUT WHETHER A SKY LOOKS GOOD** —
 * `docs/decisions/0192-a-guard-holds-an-invariant.md`. *Ice shards read as ice* is a taste and a
 * correct authoring change reddens any number put on it. What is held is that the fields are
 * genuinely different fields and that every one of them still obeys the ceilings that keep a sky
 * behind the game.
 */

import { describe, expect, it } from 'vitest';

import {
  SKY_MAX_STAR_UNITS,
  SKY_STYLE_OF,
  atlasIsStale,
  bakeSize,
  nebulaField,
  skyField,
  type SkyKind,
} from '../src/render/bake.ts';
import { SPRITE_EXTENT } from '../src/content/sprites.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';

/** The three star layers, at the resolution `tests/budget.test.ts` reads them at. */
const LAYERS: readonly SkyKind[] = ['skyFar', 'skyNear', 'skyRush'];
const sizeOf = (kind: SkyKind): number => bakeSize(SPRITE_EXTENT[kind], 6);

/**
 * WHERE a field's marks are, and nothing else about them.
 *
 * ⚠️ **POSITIONS ONLY, AND `npm run prove` IS WHY.** The first version of this fingerprint included
 * each mark's radius, length and tilt — and the probe that restores the shared stream came back
 * **STILL GREEN**, because a place also scales the COUNT, so two fields drawn from one stream still
 * produced different strings. The guard was satisfied by density alone and never once tested the thing
 * it is named for. `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`.
 *
 * ⚠️ **AND POSITION IS THE EXACT QUANTITY THE STREAM OWNS.** On a layer that draws dots, `x` and `y`
 * are `margin + rng.range(0, span)` and nothing in `SkyStyle` touches either — so two places sharing a
 * generator have the same marks in the same places and differ only in how many, which is precisely the
 * *"same starry canvas"* being reported. Radius and length are excluded because a place is ALLOWED to
 * change them.
 */
function placesOf(kind: SkyKind, theme: ThemeKind): string[] {
  return skyField(kind, sizeOf(kind), theme).stars.map((s) => `${s.x.toFixed(3)},${s.y.toFixed(3)}`);
}

/** How many leading marks two places put in exactly the same spot. */
function sharedRun(a: string[], b: string[]): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

describe('0195 — a place has its own sky', () => {
  it('THE REPORTED ONE: no two places draw the same stars in the same places', () => {
    /*
      ⚠️ **THE WHOLE DEFECT, STATED AS THE SMALLEST THING THAT WOULD HAVE CAUGHT IT.** Before this
      decision every one of these twenty-one pairs was IDENTICAL, in all three layers, and the suite
      was green — because the stream was keyed by the layer alone and a place could only change two
      hex values on top of it.
    */
    /*
      ⚠️ **PAIRWISE AND ON THE LEADING RUN, not on whole-field equality.** Two places drawn from one
      generator agree mark for mark until the shorter field runs out — so *how many they agree on* is
      the reading, and *zero* is the only honest floor. Before this decision it was ninety.
    */
    for (const layer of LAYERS) {
      const marks = new Map(THEME_KINDS.map((theme) => [theme, placesOf(layer, theme)]));
      for (let i = 0; i < THEME_KINDS.length; i++) {
        for (let j = i + 1; j < THEME_KINDS.length; j++) {
          const a = THEME_KINDS[i]!;
          const b = THEME_KINDS[j]!;
          const run = sharedRun(marks.get(a)!, marks.get(b)!);
          expect(
            run,
            `${a} and ${b} put their first ${run} ${layer} marks in exactly the same places — that is one ` +
              'canvas with two tints, which is the report this decision answers',
          ).toBe(0);
        }
      }
    }
  });

  it('and the nebula is a place’s too, so the clouds are not one photograph in seven colours', () => {
    // Positions only, for the reason `placesOf` gives: a place may change a cloud's size and alpha
    // and may not be handed the same cloud in the same spot.
    const at = (theme: ThemeKind): string[] =>
      nebulaField(bakeSize(SPRITE_EXTENT.skyNebula, 6), theme).map((c) => `${c.x.toFixed(3)},${c.y.toFixed(3)}`);
    const clouds = new Map(THEME_KINDS.map((theme) => [theme, at(theme)]));
    for (let i = 0; i < THEME_KINDS.length; i++) {
      for (let j = i + 1; j < THEME_KINDS.length; j++) {
        const a = THEME_KINDS[i]!;
        const b = THEME_KINDS[j]!;
        const run = sharedRun(clouds.get(a)!, clouds.get(b)!);
        expect(run, `${a} and ${b} share their first ${run} clouds, in the same places`).toBe(0);
      }
    }
  });

  it('THE ONE THAT CANNOT BE RECOVERED FROM: a place may THIN its sky and may never thicken it', () => {
    /*
      ⚠️ **THE GUARD THAT ALREADY FIRED, HELD AS A RULE RATHER THAN AS A NUMBER.** A first draft let a
      place scale the mark size past 1 for tumbling rock, and `tests/budget.test.ts` measured `skyNear`
      at **0.36 world units — 40% of a bullet** — and reddened.
      `docs/decisions/0069-the-sky-is-behind-the-game.md`'s bound is on the SHARED constant, so this is
      what keeps that bound a property of the whole game rather than of one level.

      ⚠️ **The table is allowed to hold a number above 1 and the field must not honour it**, which is
      why this reads the drawing rather than the table. A clamp asserted against the constant it
      clamps would be `docs/decisions/0027-measure-the-picture-not-the-model.md`'s own failure.
    */
    for (const layer of LAYERS) {
      const size = sizeOf(layer);
      /*
        ⚠️ **AGAINST THE SHARED CEILING AND NOT AGAINST ANOTHER PLACE'S LARGEST MARK, WHICH IS WHAT THE
        FIRST DRAFT DID AND WAS WRONG.** A radius is `biggest × rng.range(0.5, 1)`, so the largest
        SAMPLE differs between two places with identical ceilings — the first version reddened on
        Saurian Belt at 3.59px against The Approach's 3.57px, which is ninety draws of a uniform
        landing slightly higher, and had nothing to do with the property.
        `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`.
      */
      const ceiling = (size / SPRITE_EXTENT[layer]) * SKY_MAX_STAR_UNITS[layer];
      for (const theme of THEME_KINDS) {
        const worst = Math.max(...skyField(layer, size, theme).stars.map((s) => s.r));
        expect(
          worst,
          `${theme}'s ${layer} draws a mark ${worst.toFixed(2)}px against a shared ceiling of ` +
            `${ceiling.toFixed(2)}px — a place that thickens its sky is a place whose scenery competes ` +
            'with a bullet',
        ).toBeLessThanOrEqual(ceiling + 1e-9);
      }
    }
  });

  it('and every place still puts SOMETHING in the sky, because an empty backdrop is not a place', () => {
    /*
      ⚠️ **THE OTHER END OF THE SAME AXIS.** Density is a multiplier and The Black Heart's is 0.3 —
      a place written as *nearly empty, because nothing survives near it*. A place that took it to zero
      would have no parallax at all, and parallax is the whole of what the sky is for
      (`docs/decisions/0065-the-sky-is-baked-and-blitted.md`). One mark is not a sky; the floor is
      stated in marks rather than in the multiplier, for the reason above.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of LAYERS) {
        const count = skyField(layer, sizeOf(layer), theme).stars.length;
        expect(count, `${theme}'s ${layer} has ${count} marks in it, which is not a parallax`).toBeGreaterThan(2);
      }
    }
    for (const theme of THEME_KINDS) {
      expect(nebulaField(bakeSize(SPRITE_EXTENT.skyNebula, 6), theme).length, `${theme} has no clouds at all`).toBeGreaterThan(0);
    }
  });

  it('THE ONE THE BOUNDARY TURNS ON: an atlas baked for one place is STALE for another', () => {
    /*
      ⚠️ **WITHOUT THIS THE WHOLE DECISION IS INERT AND THE SUITE IS GREEN.** Every field above can be
      a different field and the player still sees the first level's sky for the whole run, because the
      atlas is baked once and `atlasIsStale` is the only thing that asks for another one. The resize
      path forgives a quarter of a resolution change; a place is not a quantity, so there is no band.

      ⚠️ **AND THE COST IS MEASURED RATHER THAN ASSUMED** — `docs/decisions/0022-frame-rate-is-a-feature.md`.
      A full atlas is **1.6–3.2 ms** to bake and the nebula another **1 ms**, against a 16.7 ms frame,
      once, at a boundary `docs/decisions/0063-a-level-break-is-a-respite.md` already gives a screen to.
    */
    const atlas = { view: 'side', theme: 'approach', bitmaps: [], extents: [], pixelsPerUnit: 10.8 } as const;
    expect(atlasIsStale(atlas, 'side', 10.8, 'approach'), 'the place it was baked for reads as stale').toBe(false);
    for (const theme of THEME_KINDS) {
      if (theme === 'approach') continue;
      expect(
        atlasIsStale(atlas, 'side', 10.8, theme),
        `an atlas baked for The Approach is not stale for ${theme}, so that level shows the wrong sky`,
      ).toBe(true);
    }
  });

  it('and every style is a real row, so a place cannot be differentiated by a table nobody reads', () => {
    /*
      ⚠️ **0162 LANDED A MECHANISM EMPTY AND 0172 HAD TO GO BACK AND FILL IT.** A per-place axis every
      place leaves at 1 is a mechanism no data exercises — guarded by nothing however green the suite
      is. So each of the five axes must be moved by at least one place, and at least one place must
      differ from the base composition on every axis it has.
    */
    const axes = ['density', 'size', 'tilt', 'length', 'clouds', 'cloudSize', 'cloudAlpha'] as const;
    for (const axis of axes) {
      const moved = THEME_KINDS.filter((theme) => SKY_STYLE_OF[theme][axis] !== SKY_STYLE_OF.approach[axis]);
      expect(moved.length, `no place moves ${axis}, so it is an axis nothing exercises`).toBeGreaterThan(0);
    }
    for (const theme of THEME_KINDS) {
      if (theme === 'approach') continue;
      const same = axes.filter((axis) => SKY_STYLE_OF[theme][axis] === SKY_STYLE_OF.approach[axis]);
      expect(
        same.length,
        `${theme} is the base composition's sky on every axis (${same.join(', ')}) — it has no sky of its own`,
      ).toBeLessThan(axes.length);
    }
  });
});
