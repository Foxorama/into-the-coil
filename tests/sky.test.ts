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
  cloudCover,
  skyCover,
  STRUCTURE_OF,
  fieldOf,
  nebulaField,
  skyField,
  type SkyKind,
} from '../src/render/bake.ts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { SPRITE_EXTENT } from '../src/content/sprites.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SKY } from '../src/app/mount.ts';
import { DECOR_INKS, PALETTES, type PaletteName } from '../src/content/palette.ts';
import { THEMES } from '../src/content/themes.ts';
import { GAMEPLAY_FLOOR, contrast, luminance } from './contrast.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
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
  /*
    ⚠️ **THE STYLE IS PINNED TO ONE ROW, AND `npm run prove` IS WHY — THE SECOND TIME.** With each
    place's own style, this comparison went **STILL GREEN** against the probe that restores the shared
    stream, because `docs/decisions/0196-the-backdrop-is-rounded-out.md`'s `clump` moves marks around
    on its own: two places clumping differently land in different spots whether or not they share a
    generator. **A guard that compares output can always be satisfied by a style difference.**

    ⚠️ **HOLDING THE ROW EQUAL LEAVES THE SEED AS THE ONLY THING THAT CAN MOVE A MARK**, which is
    exactly the property being claimed. The Approach's row is the one pinned because it is the base
    composition every other place deviates from.
  */
  return fieldOf(kind, sizeOf(kind), theme, SKY_STYLE_OF.approach).stars.map(
    (s) => `${s.x.toFixed(3)},${s.y.toFixed(3)}`,
  );
}

/** How many leading marks two places put in exactly the same spot. */
function sharedRun(a: string[], b: string[]): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/**
 * The louder of a place's two gas colours — 0223.
 *
 * ⚠️ **A PLACE HAS TWO NOW, AND THE FLOOR IS ABOUT THE WORST CASE.** `nebula` is the body and `glow`
 * is the accent every lit edge is drawn in; a third of the clouds take the accent too. Blending the
 * backdrop against the body alone would measure the half of the sky that is cheaper, which is the
 * exact shape of the hole 0222 found in `cloudCover` — a measurement that understates is invisible to
 * everything built on it.
 */
function loudest(theme: ThemeKind, name: PaletteName): string {
  const body = THEMES[theme].nebula[name];
  const accent = THEMES[theme].glow[name];
  return luminance(accent) > luminance(body) ? accent : body;
}

/** sRGB blend of two hexes, which is what a gradient over a backdrop actually produces. */
function over(base: string, top: string, alpha: number): string {
  const parse = (h: string): number[] => {
    const m = /^#(..)(..)(..)$/.exec(h);
    if (m === null) throw new Error(`not a hex colour: ${h}`);
    return [1, 2, 3].map((i) => parseInt(m[i]!, 16));
  };
  const [a, b] = [parse(base), parse(top)];
  return `#${a.map((v, i) => Math.round(v + (b[i]! - v) * alpha).toString(16).padStart(2, '0')).join('')}`;
}

describe('0196 — the clouds are counted against the accessibility floor', () => {
  it('THE HOLE: every ink clears WCAG AA against the backdrop WITH THE CLOUDS ON IT', () => {
    /*
      ⚠️ **`tests/themes.test.ts` HELD THIS AGAINST THE BARE BACKDROP AND THE CLOUDS ARE DRAWN ON TOP
      OF IT.** `docs/decisions/0024-the-accessibility-floor-is-settings.md` bans a level from silently
      overriding an accessibility choice, and a nebula is a level's cosmetic laid over the colour every
      ink was checked against. **Measured when this was written: the clouds OVERLAP**, so the
      accumulated alpha reaches 0.41 at Ember Nebula against a per-cloud ceiling of 0.22, and the worst
      ink there loses **0.96** of its ratio.

      ⚠️ **THE WORST INK IS `enemy` IN ALL FOURTEEN CELLS**, which is the one that matters most for what
      comes next: a place's own enemy art has the least room exactly where its sky is thickest.
    */
    const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);
    const worst: string[] = [];
    for (const theme of THEME_KINDS) {
      const cover = cloudCover(size, theme);
      for (const name of Object.keys(PALETTES) as PaletteName[]) {
        const backdrop = over(THEMES[theme].space[name], loudest(theme, name), cover);
        for (const [ink, colour] of Object.entries(PALETTES[name])) {
          if (ink === 'space' || ink === 'sky') continue;
          if ((DECOR_INKS as readonly string[]).includes(ink)) continue;
          const ratio = contrast(colour, backdrop);
          worst.push(`${theme}/${name}/${ink} ${ratio.toFixed(2)}`);
          expect(
            ratio,
            `${ink} sits at ${ratio.toFixed(2)}:1 on ${theme}'s ${name} backdrop once its clouds are ` +
              `counted (cover ${cover.toFixed(3)}, blended ${backdrop}) — a level has spent an ` +
              'accessibility choice the player made',
            /*
              ⚠️ **THE GAMEPLAY FLOOR — 0198, one day after this guard was written.** 0196 measured what
              the clouds cost and chose its three axes to spend none of it; the report on that pass was
              *"nothing interesting or different about the levels."* **The floor picked the axes and the
              axes were the ones nobody can see.** The AA bar is now advisory and this holds the bar that
              is about the game working.
            */
          ).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
        }
      }
    }
    expect(worst.length, 'nothing was measured').toBeGreaterThan(0);
  });

  it('every ink clears the floor against the backdrop WITH EVERYTHING THE SKY DRAWS ON IT', () => {
    /*
      ⚠️ **THE GUARD ABOVE COUNTS CLOUDS, AND THE SKY STOPPED BEING ONLY CLOUDS IN 0211** —
      `docs/decisions/0222-the-background-is-not-black.md`. Structure marks arrived that year; a LIT one
      is drawn in the same gas colour a cloud is, on top of it. 0220 added lit crests and wall faces
      and wrote the gap down; 0221 added a whole ground layer and wrote it down again. **Neither closed
      it, because neither needed the headroom.**

      ⚠️ **MEASURED THE MOMENT SOMETHING DID: RIME SHELF WAS UNDER THE FLOOR AT 2.67:1.** Shipped the
      day before by the decision that made its blowing ice lit — correctly, since drawn dark it was
      black scratches over the palest sky in the game — at 0.5 alpha and up to 3.2 units wide. Every
      guard in the repository was green.

      ⚠️ **AND `skyCover` IS A SHARE OF AREA WHERE `cloudCover` IS A PEAK, WHICH IS NOT AN
      INCONSISTENCY.** A cloud is forty units across, so its peak IS a region. A lit structure mark is
      a few pixels wide, and four crossing composite to 0.94 over an area the size of a full stop —
      Rime reads peak 0.938 with **0.00% of its tile above 0.9**. 0196 refused a bound of that shape in
      as many words: *"a guard that cannot be satisfied by correct content is a guard that gets
      switched off."*
    */
    const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);
    let checked = 0;
    for (const theme of THEME_KINDS) {
      const cover = skyCover(size, theme);
      for (const name of Object.keys(PALETTES) as PaletteName[]) {
        const backdrop = over(THEMES[theme].space[name], loudest(theme, name), cover);
        for (const [ink, colour] of Object.entries(PALETTES[name])) {
          if (ink === 'space' || ink === 'sky') continue;
          if ((DECOR_INKS as readonly string[]).includes(ink)) continue;
          checked += 1;
          const ratio = contrast(colour, backdrop);
          expect(
            ratio,
            `${ink} sits at ${ratio.toFixed(2)}:1 on ${theme}'s ${name} backdrop once EVERYTHING the sky ` +
              `draws is counted (cover ${cover.toFixed(3)}, blended ${backdrop}) — the clouds guard above ` +
              'reads this place as clear, which is how Rime Shelf shipped under the floor',
          ).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
        }
      }
    }
    expect(checked, 'nothing was measured').toBeGreaterThan(0);
    /*
      ⚠️ **A MINUTE, NOT VITEST'S FIVE SECONDS, and 2026-09-05 is why.** This bakes every place's sky
      at the nebula's size — five and a half seconds alone on this machine — and timed out under
      `npm run check`'s full parallel suite while passing alone. Per
      `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` that is the wall
      clock being the wrong quantity for a bake that cannot hang, so the bound only stops a runaway;
      `tests/sound.test.ts`'s prewarm guard got the same treatment the same day.
    */
  }, 60_000);

  it('and the cover COUNTS THE PILE, because a guard cannot see its own measurement understating', () => {
    /*
      ⚠️ **THE GUARD ABOVE CANNOT CATCH ITS OWN INPUT BEING WRONG, AND `npm run prove` SAID SO.** A
      probe that made `cloudCover` take the loudest single cloud instead of accumulating the pile came
      back **STILL GREEN** — under-counting the cover makes the backdrop look CLEANER, so the contrast
      check passes with room to spare. A measurement that understates is invisible to everything
      written on top of it.

      ⚠️ **SO THE ACCUMULATION IS ASSERTED DIRECTLY, AGAINST THE ONLY THING THAT DISTINGUISHES IT.**
      Clouds overlap, so the cover at a place with piled weather must exceed the loudest single cloud
      in it — at Ember Nebula the pile reaches **0.41** where no one cloud passes 0.22. With the
      accumulation removed the two numbers are equal by construction, which is the shape of the defect.
    */
    const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);
    const piled = THEME_KINDS.filter((theme) => nebulaField(size, theme).length > 4);
    expect(piled.length, 'no place has enough clouds to pile, so this proves nothing').toBeGreaterThan(0);
    let anyDeeper = false;
    for (const theme of piled) {
      const loudest = Math.max(...nebulaField(size, theme).map((c) => c.alpha));
      const cover = cloudCover(size, theme);
      expect(
        cover,
        `${theme}'s cover is ${cover.toFixed(3)} against its loudest single cloud at ${loudest.toFixed(3)} — ` +
          'the pile is not being counted, and every contrast reading taken from it is optimistic',
      ).toBeGreaterThanOrEqual(loudest - 1e-9);
      if (cover > loudest + 0.02) anyDeeper = true;
    }
    expect(
      anyDeeper,
      'no place anywhere stacks clouds deeper than its loudest one, so the accumulation is untested',
    ).toBe(true);
  });

  it('THE CEILING: a mark may be dimmer than its layer and never brighter', () => {
    /*
      ⚠️ **ASSERTED DIRECTLY, BECAUSE EVERY EXISTING BUDGET IS A COMPARISON AND A LIFT MOVES BOTH SIDES.**
      `npm run prove` turned `dim` into a lift and `tests/budget.test.ts` stayed **green twice** — first
      because none of its helpers could see per-mark alpha at all, and then, once they could, because
      *the near layer is quieter than the far one* scales both layers by the same distribution and the
      ratio is unchanged. A relative guard cannot see an absolute ceiling move.

      ⚠️ **AND THE CEILING IS WHAT MAKES `dim` FREE.** Every screen-share and legibility number in this
      project is written against `SKY_ALPHA`; a mark above it is sky the player has to check, and
      `src/content/palette.ts` holds the sky ink below every colour that means something precisely so
      they never have to.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of LAYERS) {
        for (const star of skyField(layer, sizeOf(layer), theme).stars) {
          expect(
            star.dim,
            `${theme}'s ${layer} has a mark at ${star.dim.toFixed(2)} of its layer's alpha — above 1 is a ` +
              'star brighter than the ceiling every sky budget is measured against',
          ).toBeLessThanOrEqual(1);
          expect(star.dim, `${theme}'s ${layer} has a mark dimmed out of existence`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('and the gradient is still two stops, or the arithmetic above is wrong in the dangerous direction', () => {
    /*
      ⚠️ **THE ONE ASSUMPTION `cloudCover` MAKES, HELD RATHER THAN TRUSTED.** It models a cloud's
      falloff as linear in distance, which is what a canvas interpolates between a stop at 0 and a stop
      at 1. A third stop, or either stop moved, makes the model wrong — and wrong in the direction that
      lets a backdrop eat an ink, because the guard above would keep passing.

      ⚠️ **A SOURCE SCAN, WHICH IS THE WEAKEST KIND OF GUARD AND THE ONLY ONE AVAILABLE.** The falloff
      lives inside the browser's gradient implementation; nothing in a headless suite can read it.
      `tests/one-description.test.ts` ranks this third of three and says why it is sometimes the only
      option.
    */
    const src = readFileSync(resolve(root, 'src/render/bake.ts'), 'utf8');
    const body = src.slice(src.indexOf('function drawNebula'), src.indexOf('function bakeOne'));
    const stops = [...body.matchAll(/addColorStop\(([^,]+),/g)].map((m) => m[1]!.trim());
    expect(
      stops,
      `drawNebula has ${stops.length} colour stops (${stops.join(', ')}) — cloudCover models the falloff ` +
        'as linear between exactly two, at 0 and 1, and the contrast guard rests on that',
    ).toEqual(['0', '1']);
    /*
      ⚠️ **THE THIRD ARGUMENT, NOT A LITERAL SUBSTRING — re-anchored by 0206.** This read
      `cloud.fy, 0,`, which pinned the inner radius by pinning the two characters in front of it. The
      wrap added `+ dy` to the focus point, so the anchor stopped matching while the invariant it
      guards was untouched: the falloff still starts from a point.

      What it means is *`createRadialGradient`'s inner radius is zero*, and it now says that. A guard
      whose anchor is more specific than its claim reddens on edits that are correct, which is the
      half of `docs/decisions/0192-a-guard-holds-an-invariant.md` about changing a guard and saying
      why.
    */
    const inner = /createRadialGradient\([^,]+,[^,]+,\s*0\s*,/.test(body);
    expect(
      inner,
      'the inner circle of the gradient has a radius, so the falloff no longer starts from a point',
    ).toBe(true);
  });
});

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

/*
  ── 0203: A LANDMARK IS OUTSIDE THE BAND, BEHIND EVERYTHING, AND ARRIVES WITH THE ORGAN ───────────

  `docs/decisions/0203-the-rule-was-never-about-size.md` replaced 0069's size CEILING with a
  forbidden BAND, on the argument that 0069's stated reason was always about confusability and only
  looked like a size because the sky held nothing but dots when it was written.
*/
describe('0203 — the sky may hold a landmark, and the rule is a band', () => {
  /** The smallest and largest things that can kill the player, as diameters in world units. */
  const smallestThreat = Math.min(...Object.values(SHOTS).map((row) => row.radius)) * 2;
  const largestThreat = Math.max(...ENEMY_KINDS.map((kind) => ENEMIES[kind].radius)) * 2;

  it('the band is derived from what can kill you, not typed', () => {
    // If a new body or shot moves either end, the band moves with it and the guard below re-ranks.
    expect(smallestThreat).toBeCloseTo(1.8, 6);
    expect(largestThreat).toBeCloseTo(8, 6);
  });

  it('THE REPORTED ONE: a landmark is far too big to be a body, in the units a player sees', () => {
    /*
      ⚠️ **THE FLOOR, WHICH 0069's CEILING NEVER HAD.** The old rule was one-sided — nothing above a
      bullet — so a landmark could only ever have been refused. A band has to say how far ABOVE the
      largest thing that can hurt you an object must be before it stops being mistakable for one, and
      twice is the margin 0203 argues for.
    */
    expect(
      SPRITE_EXTENT.landmark,
      `a landmark is ${SPRITE_EXTENT.landmark} units across against a largest threat of ${largestThreat} — ` +
        'inside the band, so a player could read it as a body',
    ).toBeGreaterThan(largestThreat * 2);
  });

  it('and the star fields are still far too small to be one, which is 0069 unchanged', () => {
    /*
      ⚠️ **THE BOTTOM OF THE BAND IS THE SMALLEST THREAT ITSELF, AND THE FIRST DRAFT PUT IT AT HALF
      THAT.** At half a bullet the guard reddened `skyFar`, whose largest mark is 1.2 units across —
      shipped, correct, and refused by a bound this session invented. That is the failure `CLAUDE.md`
      names for counting guards: *every one flagged its healthy file as loudly as its sick one.*

      The bottom of the band is not a new number at all. It is 0069's own sentence — *nothing the
      background draws is as big as the smallest thing that can kill the player* — and 0203 only ever
      claimed to add a TOP to it.
    */
    for (const layer of ['skyFar', 'skyNear', 'skyRush'] as const) {
      expect(
        SKY_MAX_STAR_UNITS[layer] * 2,
        `${layer}'s largest mark is inside the band and could be read as a shot`,
      ).toBeLessThan(smallestThreat);
    }
  });

  it('a landmark is the slowest thing on screen, so it cannot be parallax-inverted', () => {
    /*
      0203 kept 0112's *slower* clause and struck only *no edge*. `src/render/scene.ts` paints
      landmarks BEFORE the sky for this reason: the slowest-moving thing drawn in front of faster
      ones reads as stuck to the glass.
    */
    const slowestField = Math.min(...SKY.map((layer) => layer.depth));
    for (const kind of LEVEL_KINDS) {
      for (const mark of LEVELS[kind].landmarks) {
        expect(
          mark.depth,
          `${kind}'s landmark at ${mark.at} moves at ${mark.depth} against the slowest field's ${slowestField}`,
        ).toBeLessThan(slowestField);
      }
    }
  });

  it('0206 — a cloud that crosses the tile’s edge is drawn on both sides of it', () => {
    /*
      ⚠️ **THE MECHANISM, NOT THE APPEARANCE, AND THE DIFFERENCE IS STATED RATHER THAN BLURRED.**
      *Is there a visible seam* has no content change that would redden a guard and be correct —
      0204 gives the same reason for not guarding the drawing. What CAN be held is the arithmetic:
      every cloud whose disc crosses an edge must be drawn again one tile over, or the half that
      leaves is simply discarded and the tile ends on a straight line.

      This reads `drawNebula`'s own wrap offsets out of the source rather than re-deriving them,
      because a second copy of the rule is the drift
      `docs/decisions/0029-the-tracked-record-is-the-record.md` refuses.
    */
    /*
      ⚠️ **SCOPED TO THE CLOUD LOOP, AND THE FIRST VERSION SCANNED THE WHOLE FILE.** `npm run prove`
      caught it the moment 0207 gave the dust lanes a wrap loop of their own: with two wraps in the
      file, breaking the CLOUD one left the string present in the LANE one and this guard stayed
      green over exactly the defect it names. A guard that asks *does this text appear anywhere* is
      answering a different question from the one it claims —
      `docs/decisions/0027-measure-the-picture-not-the-model.md` one layer down, and the probe is
      what said so.
    */
    const bake = readFileSync(resolve(root, 'src/render/bake.ts'), 'utf8');
    const clouds = bake.slice(
      bake.indexOf('for (const cloud of nebulaField'),
      bake.indexOf('THE DUST, AFTER THE GAS'),
    );
    const wraps = clouds.includes('for (const dx of [-size, 0, size])') &&
      clouds.includes('for (const dy of [-size, 0, size])');
    expect(
      wraps,
      'drawNebula no longer wraps its clouds, so a cloud crossing the tile edge is cut off there — ' +
        'the seam 0206 was written for, which no contents guard can see',
    ).toBe(true);

    // And the clouds still have no margin, which is the half of the old comment that was right.
    const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);
    const crossing = THEME_KINDS.filter((theme) =>
      nebulaField(size, theme).some((c) => c.x - c.r < 0 || c.x + c.r > size || c.y - c.r < 0 || c.y + c.r > size),
    );
    expect(
      crossing,
      'no cloud in any place reaches a tile edge — the wrap is now guarding nothing, which means the ' +
        'placement has quietly grown a margin and the sky is banding towards the middle instead',
    ).not.toEqual([]);
  });

  it('0207 + 0208 — every mark takes the seam rule it declares, in every place', () => {
    /*
      ⚠️ **THREE DECISIONS' WORTH OF SEAM RULES, HELD ONCE FOR ALL SEVEN PLACES.** They used to be
      three tests over two theme-gated functions, and the fourth author would have had to work out
      which rule applied to whatever they were adding:

        0206  a cloud is wrapped at ±size, because the copy carries its own shape
        0207  a mark that SPANS the tile must additionally arrive where it left, or it steps
        0208  a mark that does not span it takes the cloud's rule — and only while it stays local

      `StructureMark.crosses` states which, and this holds both halves against it. A structure added
      for one of the five places authored in 0211 cannot get the wrong rule by not knowing there were
      two, which is exactly what two functions in two files could not prevent.

      `docs/decisions/0192-a-guard-holds-an-invariant.md`: name a change that would redden this and be
      correct. A crossing mark whose ends disagree is never correct; nor is a local one as wide as its
      own tile, because the wrap it is drawn with cannot cover it.
    */
    const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);
    let checked = 0;
    for (const theme of THEME_KINDS) {
      for (const mark of STRUCTURE_OF[theme](size)) {
        checked += 1;
        const xs = mark.points.map((p: number[]) => p[0]!);
        if (mark.crosses) {
          /*
            ⚠️ **THE TWO EDGES MUST AGREE, WHICH IS NOT THE SAME AS FIRST-POINT-EQUALS-LAST.** The
            first draft compared those two and reddened The Approach's horizon, which is periodic:
            a FILLED crossing shape closes along an edge, so its last point is a corner rather than
            the far end of the line. What tiling actually requires is that whatever the mark does at
            `x = 0` it also does at `x = size` — so the set of heights it touches on one edge is the
            set it touches on the other, however many points that takes.
          */
          const edge = (at: number): string =>
            mark.points
              .filter((p: number[]) => Math.abs(p[0]! - at) < 0.5)
              .map((p: number[]) => p[1]!.toFixed(3))
              .sort()
              .join(',');
          const left = edge(0);
          const right = edge(size);
          expect(left.length, `${theme} has a crossing mark that never reaches x=0`).toBeGreaterThan(0);
          expect(
            right,
            `${theme} has a crossing mark that leaves at heights [${left}] and arrives at [${right}] — ` +
              'it steps at every tile join, which is the seam 0206 was written for',
          ).toBe(left);
        } else {
          const spread = Math.max(...xs) - Math.min(...xs);
          expect(
            spread,
            `${theme} has a local mark spanning ${spread.toFixed(0)} of a ${size} tile — past half it ` +
              'is a tile-crossing structure wearing a local one’s wrap, and 0207’s rule is owed instead',
          ).toBeLessThan(size / 2);
        }
      }
    }
    expect(checked, 'no marks were checked — the table is empty or the scan is broken').toBeGreaterThan(20);
  });

  it('0211 — every place has a structure of its own, and no two places share one', () => {
    /*
      *"None of those elements are transposable to a different level so we need to uniquely craft the
      backdrop for each level."*

      ⚠️ **TWO CLAIMS, AND THE SECOND IS THE ONE 0196 FAILED.** Every place having SOMETHING is easy
      and was true of the old blob axes too; what was reported was that the somethings were the same
      something. So this also compares the places against each other — a place whose marks are
      identical in shape and count to another's is the *numerically different, visually the same*
      failure arriving through a table instead of through a slider.
    */
    const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);
    const shapes = new Map<string, ThemeKind[]>();
    for (const theme of THEME_KINDS) {
      const marks = STRUCTURE_OF[theme](size);
      expect(marks.length, `${theme} draws no structure of its own — its weather is a smooth wash`).toBeGreaterThan(0);
      /*
        ⚠️ **PER MARK, BY ITS ACTUAL COORDINATES, AND THE FIRST VERSION COUNTED SHAPES INSTEAD.** It
        fingerprinted each place as *how many marks, crossing or local, filled or stroked, how many
        points* — and `npm run prove` handed Ember Nebula The Labyrinth's own wall generator and the
        guard **stayed green**, because The Labyrinth also emits a lit rim per wall and the totals
        therefore differed. Two places were drawing byte-identical walls and the guard was looking at
        how many of them there were.

        A mark's coordinates are what the player sees. Two places sharing a generator produce the same
        numbers from the same stream, so a shared signature IS the duplication — and it catches it
        however many other marks either place happens to add.
      */
      for (const mark of marks) {
        const key = mark.points.map((p: number[]) => `${p[0]!.toFixed(2)},${p[1]!.toFixed(2)}`).join('|');
        shapes.set(key, [...(shapes.get(key) ?? []), theme]);
      }
    }
    const shared = [...shapes.values()].filter((places) => new Set(places).size > 1);
    expect(
      shared.map((p) => [...new Set(p)].join(' = ')),
      'these places draw the same marks in the same places as each other — a shared generator is ' +
        '0196’s "numerically different, visually the same" arriving through a table',
    ).toEqual([]);
  });


  it('0204 — the landmark is re-baked at the boundary wherever the weather is', () => {
    /*
      ⚠️ **AN INVARIANT, AND IT IS THE DEFECT 0204 EXISTS FOR.** A palette is per style and knows
      nothing about a place, so a landmark that is never re-coloured wears `#2a2c44` — cold blue-grey
      — in every place in the game. That is what shipped in 0203 and it read as grey rock standing in
      Ember Nebula's maroon.

      `docs/decisions/0192-a-guard-holds-an-invariant.md`: name a content change that would redden
      this and be correct. Dropping the landmark's re-bake while keeping the weather's is never
      correct — the two colours come from one source and describe one place.

      A source scan rather than a render, because `bakeLandmark` needs a DOM canvas and this suite
      runs in node. It holds the pairing, which is the thing that was missing; the drawing itself is
      a taste and 0204 says why it is not guarded.
    */
    const mount = readFileSync(resolve(root, 'src/app/mount.ts'), 'utf8');
    const nebula = mount.indexOf('bakeNebula(atlas');
    const landmark = mount.indexOf('bakeLandmark(atlas');
    expect(nebula, 'mount no longer re-bakes the weather at the boundary').toBeGreaterThan(-1);
    expect(
      landmark,
      'the weather is re-baked in the place’s colour and the landmark is not — it will be cold grey ' +
        'in every place, which is exactly the defect 0204 was written for',
    ).toBeGreaterThan(-1);
  });

  it('THE ASK, AS A NUMBER: the Pillars arrive exactly where the organ opens', () => {
    /*
      ⚠️ **THE WHOLE POINT OF THE FEATURE, AND IT IS ONE EQUALITY.** Asked for by name: *"when the
      massive pipe organ kicks in music wise we see the pillars of god going past."*
      `src/content/nebula.ts` puts the pipe organ on `push`; this reads where `push` opens rather
      than comparing two literals, so moving the section moves the landmark and a drifted pair
      reddens here — `docs/decisions/0029-the-tracked-record-is-the-record.md`.
    */
    const nebulaLevel = LEVEL_KINDS.map((kind) => LEVELS[kind]).find((level) => level.theme === 'nebula');
    expect(nebulaLevel, 'no level uses the nebula place').toBeDefined();
    const push = nebulaLevel!.sections.find((entry) => entry.section === 'push');
    expect(push, 'Ember Nebula has no push section, which is where its organ opens').toBeDefined();
    expect(
      nebulaLevel!.landmarks.map((mark) => mark.at),
      `the Pillars must arrive at ${push!.at}, where the organ does`,
    ).toContain(push!.at);
  });
});
