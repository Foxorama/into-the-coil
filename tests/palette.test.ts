/**
 * The palettes, and the accessibility floor's first executable clause.
 *
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts "colour never carries meaning
 * alone" in the unconditional tier and says each item lands with the surface it constrains. This is
 * the palette's share of it: **legibility against the background, and separation on the luminance
 * channel for the pairs a player must never confuse.**
 *
 * ⚠️ **Luminance, not hue, and that is the whole point.** Two colours that differ only in hue are
 * the same colour to a player with deuteranopia or protanopia — the two most common forms — and
 * "make it red" is exactly the instinct that produces them. Relative luminance is the channel that
 * survives every kind of colour blindness, and it is also the one that survives a bright room, a bad
 * phone screen and a screenshot run through compression.
 *
 * What this does NOT claim: that colour is never the only channel. That is a property of the CUE
 * table and the sprites, and it lands with them. A palette can only make sure the colours are
 * telling apart in the first place.
 */

import { describe, expect, it } from 'vitest';
import { GAMEPLAY_FLOOR, contrast, luminance } from './contrast.ts';
import { DECOR_INKS, DEFAULT_PALETTE, type Ink, type Palette, type PaletteName, PALETTES } from '../src/content/palette.ts';

const NAMES = Object.keys(PALETTES) as PaletteName[];
/*
  ⚠️ **HAND-WRITTEN ON PURPOSE, AND 0194 IS THE FIRST TIME IT PAID.** *Names the same roles the type
  does* compares this against `Object.keys` of every palette, so an ink added to `Ink` and to both
  palettes still reddens this file until somebody comes here and decides which camp it is in. Three
  arrived at once and the guard caught all three — `docs/decisions/0194-a-hull-has-a-livery.md`.
*/
const INKS: readonly Ink[] = [
  'space',
  'sky',
  'player',
  'ally',
  'enemy',
  'bullet',
  'hazard',
  'pickup',
  // The serpent's two shots — 0248. Meaning inks, held to every floor below.
  'acid',
  'void',
  // The eagle's flame — 0249.
  'fire',
  'impact',
  'blade',
  'glass',
  'flame',
  'trim',
];

/**
 * The two inks that are BACKGROUND — the things everything else has to be legible against.
 *
 * ⚠️ **`sky` is the only exception in this whole file, and it is an exception in the right
 * direction** — `docs/decisions/0065-the-sky-is-baked-and-blitted.md`. Every other role is something
 * the player must be able to find; a starfield that cleared the legibility floor would be a screen
 * full of dots as loud as a pickup. So the floor is inverted for it below rather than waived.
 */
const BACKGROUND: readonly Ink[] = ['space', 'sky'];

/**
 * The inks held to the opposite floor from every other — 0194.
 *
 * ⚠️ **NOT AN EXEMPTION.** `glass`, `flame` and `trim` are never drawn against the void: they are
 * laid over a hull that has already cleared the legibility floor, inside the same bitmap
 * (`docs/decisions/0149-a-hull-has-an-interior.md`). Demanding they clear it too would demand a
 * canopy as loud as the ship it is a window in. **What they are held to instead is separation from
 * everything that MEANS something**, two blocks down — a cockpit the player reads as a pickup for an
 * eighth of a second is the cost, and it is the same cost `MUST_NOT_BE_CONFUSED` is written about.
 */
const DECORATIVE: readonly Ink[] = DECOR_INKS;

/** The inks that carry meaning, which is everything that is neither background nor decoration. */
const MEANINGFUL: readonly Ink[] = INKS.filter(
  (ink) => !BACKGROUND.includes(ink) && !DECORATIVE.includes(ink),
);

/*
  ⚠️ **The contrast arithmetic moved to `tests/contrast.ts` on 2026-08-10** — 0107. A theme's
  backdrop is a second thing every ink has to be legible against, so `tests/themes.test.ts` needs the
  same gamma curve, and two copies of it is two answers to *is this readable* the day one is fixed.
*/

/**
 * The pairs a player must never confuse, and what confusing them costs.
 *
 * Deliberately short. Every pair added here constrains every palette forever, and a palette with
 * seven mutually-separated inks is a palette of greys — the cost of demanding separation everywhere
 * is that the game stops being the loud one 0024 promised.
 */
const MUST_NOT_BE_CONFUSED: { a: Ink; b: Ink; cost: string }[] = [
  { a: 'player', b: 'enemy', cost: 'the player loses track of their own ship in a crowded field' },
  { a: 'bullet', b: 'pickup', cost: 'flying INTO a bullet, which is the most expensive mistake in the game' },
  { a: 'enemy', b: 'pickup', cost: 'the same mistake with a ship instead of a bullet' },
];

/**
 * The floor an ink must clear against the void — **the gameplay one, not WCAG AA** — 0198.
 *
 * ⚠️ **AA IS DEFERRED AND STILL MEASURED.** `docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md`
 * moves the accessibility pass after the game; the 4.5 bar is read on every run by
 * `tests/authored.test.ts` and reported, so the pass starts from a list. What stays hard here is
 * whether the player can pick the ink out at all, which is a bug for everybody.
 */
const LEGIBLE = GAMEPLAY_FLOOR;

/**
 * The floor between two inks that must be told apart. Not 4.5 — these are large shapes side by side
 * rather than text on a background, and demanding AA between every critical pair leaves no room for
 * seven distinct inks. 1.6 is a clear step in lightness and is reachable while staying vivid.
 */
const SEPARATED = 1.6;

describe('every palette answers every role', () => {
  it('has an entry for every ink, in every palette', () => {
    for (const name of NAMES) {
      for (const ink of INKS) {
        expect(PALETTES[name][ink], `${name} has no colour for ${ink}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('names the same roles the type does, so a new ink cannot be half-added', () => {
    for (const name of NAMES) expect(Object.keys(PALETTES[name]).sort()).toEqual([...INKS].sort());
  });

  it('0194 — and every ink is EITHER background, meaning or decoration, with nothing in two camps', () => {
    /*
      ⚠️ **THE THREE FLOORS BELOW ARE WRITTEN OVER THESE THREE LISTS**, so an ink in none of them is an
      ink nothing checks — which is how a colour gets added and quietly escapes every rule in this
      file. An ink in two would be held to contradictory floors and the file would look green either
      way, because whichever loop ran first would pass it.
    */
    const all = [...BACKGROUND, ...MEANINGFUL, ...DECORATIVE].sort();
    expect(all, 'an ink is in no camp or in two').toEqual([...INKS].sort());
    expect(new Set(all).size, 'an ink is in two camps').toBe(all.length);
  });

  it('has a default that exists', () => {
    expect(NAMES).toContain(DEFAULT_PALETTE);
  });
});

describe('every ink is legible against space', () => {
  it('clears WCAG AA against the background, in every palette', () => {
    for (const name of NAMES) {
      const palette: Palette = PALETTES[name];
      for (const ink of MEANINGFUL) {
        expect(
          contrast(palette[ink], palette.space),
          `${name}: ${ink} (${palette[ink]}) is not legible against space (${palette.space})`,
        ).toBeGreaterThanOrEqual(LEGIBLE);
      }
    }
  });

  it('and the SKY is the one ink held to the opposite rule, because it is what they are legible against', () => {
    /*
      ⚠️ **Inverted rather than waived** — `docs/decisions/0065-the-sky-is-baked-and-blitted.md`. A
      starfield is dozens of small dots scattered across the whole screen, and a dot bright enough to
      clear the legibility floor is a dot the player has to check is not a pickup. So the sky must be
      the DIMMEST thing in the palette that is not the void itself, and it must sit nearer the void
      than anything that carries meaning.

      Two assertions, and the second is the load-bearing one: an ink can be dim and still be closer to
      a pickup than to the background, which is the case that actually costs a life.
    */
    for (const name of NAMES) {
      const palette: Palette = PALETTES[name];
      const againstSpace = contrast(palette.sky, palette.space);
      expect(againstSpace, `${name}: the sky is as loud as the things the player has to find`).toBeLessThan(LEGIBLE);
      // Visible at all, or there is no sky and the parallax says nothing.
      expect(againstSpace, `${name}: the sky is invisible against the void`).toBeGreaterThan(1.05);
      for (const ink of MEANINGFUL) {
        expect(
          contrast(palette.sky, palette[ink]),
          `${name}: the sky is closer to ${ink} than to the void — a star will read as one`,
        ).toBeGreaterThan(againstSpace);
      }
    }
  });
});

describe('the pairs a player must never confuse are separated by luminance', () => {
  it('keeps every critical pair apart on the channel colour blindness does not take away', () => {
    for (const name of NAMES) {
      const palette: Palette = PALETTES[name];
      for (const pair of MUST_NOT_BE_CONFUSED) {
        expect(
          contrast(palette[pair.a], palette[pair.b]),
          `${name}: ${pair.a} (${palette[pair.a]}) and ${pair.b} (${palette[pair.b]}) are too close.\n` +
            `  What that costs: ${pair.cost}.\n` +
            '  Hue does not fix it — to a deuteranope these are the same colour. Move one in LIGHTNESS.',
        ).toBeGreaterThanOrEqual(SEPARATED);
      }
    }
  });

  it('states what every critical pair costs, so the list can be argued with', () => {
    for (const pair of MUST_NOT_BE_CONFUSED) expect(pair.cost.length).toBeGreaterThan(20);
  });

  it('0194 — THE HIGH-CONTRAST PALETTE SPENDS NOTHING ON DECORATION', () => {
    /*
      ⚠️ **`docs/decisions/0024-the-accessibility-floor-is-settings.md`, READ THE ONLY WAY IT CAN BE.**
      *There is one game and it is the loud one; accessibility is knobs over that default.* A player
      who chooses high contrast is asking for every scrap of separation to be spent on what MEANS
      something — so a canopy, an engine core and a panel line collapse to the same hole
      `docs/decisions/0149-a-hull-has-an-interior.md` already punched, and the art on that palette is
      what it was before 0194.

      ⚠️ **THIS IS WHAT MAKES THE EXEMPTION TWO BLOCKS UP SAFE.** Decoration is excused the legibility
      floor because it is never drawn on the void; on the palette where that excuse would matter most,
      there is no decoration at all.
    */
    const hc = PALETTES['high-contrast'];
    for (const decor of DECORATIVE) {
      expect(
        hc[decor],
        `high-contrast gives ${decor} a colour of its own (${hc[decor]}) — decoration is spending the ` +
          'separation this palette exists to provide',
      ).toBe(hc.space);
    }
  });

  it('0194 — AND NO DECORATION IS MISTAKEABLE FOR ANYTHING THAT MEANS SOMETHING', () => {
    /*
      ⚠️ **THE FLOOR THAT REPLACES THE ONE DECORATION IS EXEMPT FROM**, and the reason the exemption is
      not a hole. A canopy, an engine core and a panel line mean nothing — that is what makes them
      legal at all under
      `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md`. What
      would make them illegal is being CLOSE to something that does mean something: a `flame` sitting
      where `bullet` sits is a ship with a shot painted on it, and the player checks it.

      ⚠️ **SEPARATED, not LEGIBLE.** These are marks inside a hull rather than objects against a void,
      so the bar is the one `MUST_NOT_BE_CONFUSED` uses for two things side by side.

      ⚠️ **THE HIGH-CONTRAST PALETTE PASSES THIS TRIVIALLY AND THAT IS THE SETTING WORKING** — every
      decorative ink there IS `space`, so decoration collapses to the hole 0149 already punched and
      the separation the player chose that palette for is spent on nothing decorative.
    */
    for (const name of NAMES) {
      const palette: Palette = PALETTES[name];
      for (const decor of DECORATIVE) {
        if (palette[decor] === palette.space) continue;
        for (const ink of MEANINGFUL) {
          expect(
            contrast(palette[decor], palette[ink]),
            `${name}: the decorative ${decor} (${palette[decor]}) is too close to ${ink} ` +
              `(${palette[ink]}) — a mark that means nothing would read as one that does`,
          ).toBeGreaterThanOrEqual(SEPARATED);
        }
      }
    }
  });
});

/**
 * ⚠️ THE ASSERTIONS THAT KEEP THE CHECKS ABOVE FROM BEING DECORATIVE.
 *
 * Every assertion here runs through `luminance`. A luminance function that returned a constant would
 * report a contrast of exactly 1 everywhere and fail loudly — but one that skipped the gamma step,
 * which is the usual mistake, returns plausible numbers that are wrong in the direction that lets
 * bad palettes through. So it is checked against values that are known independently of this code.
 */
describe('the contrast maths is known to work, not merely green', () => {
  it('matches the WCAG reference points', () => {
    expect(luminance('#000000')).toBeCloseTo(0, 9);
    expect(luminance('#ffffff')).toBeCloseTo(1, 9);
    // Mid grey is 0.2158, NOT 0.5 — this is the assertion that fails if the gamma step is dropped.
    expect(luminance('#808080')).toBeCloseTo(0.2158, 3);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 9);
  });

  it('is symmetric, so a pair cannot pass in one direction and fail in the other', () => {
    expect(contrast('#7ae7ff', '#ff4d6d')).toBeCloseTo(contrast('#ff4d6d', '#7ae7ff'), 12);
  });

  it('rejects two hues that differ only in hue — the case the whole file exists for', () => {
    // Pure red and pure green are the textbook deuteranopia collision. They must not pass.
    expect(contrast('#ff0000', '#00b400')).toBeLessThan(SEPARATED);
  });

  it('refuses a colour it cannot parse rather than scoring it', () => {
    expect(() => luminance('red')).toThrow();
    expect(() => luminance('#fff')).toThrow();
  });
});
