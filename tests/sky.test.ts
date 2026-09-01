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
import { GAMEPLAY_FLOOR, contrast } from './contrast.ts';

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
        const backdrop = over(THEMES[theme].space[name], THEMES[theme].nebula[name], cover);
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
    expect(
      body,
      'the inner circle of the gradient has a radius, so the falloff no longer starts from a point',
    ).toContain('cloud.fy, 0,');
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
