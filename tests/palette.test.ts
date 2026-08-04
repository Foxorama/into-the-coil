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
import { DEFAULT_PALETTE, type Ink, type Palette, type PaletteName, PALETTES } from '../src/content/palette.ts';

const NAMES = Object.keys(PALETTES) as PaletteName[];
const INKS: readonly Ink[] = ['space', 'player', 'ally', 'enemy', 'bullet', 'hazard', 'pickup'];

/** One channel of sRGB, linearised. The gamma step every naive contrast check leaves out. */
function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`not a six-digit hex colour: ${hex}`);
  const [r, g, b] = [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
  return 0.2126 * linear(r!) + 0.7152 * linear(g!) + 0.0722 * linear(b!);
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

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

/** WCAG AA for graphical objects. Below this an ink is not reliably visible against space. */
const LEGIBLE = 4.5;

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

  it('has a default that exists', () => {
    expect(NAMES).toContain(DEFAULT_PALETTE);
  });
});

describe('every ink is legible against space', () => {
  it('clears WCAG AA against the background, in every palette', () => {
    for (const name of NAMES) {
      const palette: Palette = PALETTES[name];
      for (const ink of INKS) {
        if (ink === 'space') continue;
        expect(
          contrast(palette[ink], palette.space),
          `${name}: ${ink} (${palette[ink]}) is not legible against space (${palette.space})`,
        ).toBeGreaterThanOrEqual(LEGIBLE);
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
