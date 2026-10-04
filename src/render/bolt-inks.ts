/**
 * The inks a bolt is stroked in, solved once per palette — `docs/decisions/0458-light-is-added.md`.
 *
 * ⚠️ **NOT IN `canvas.ts`, BECAUSE THAT FILE IS ON THE HOT LIST AND THIS IS COLOUR ARITHMETIC.** It
 * runs when the palette is set, never per stroke, and it shades with `bake.ts`'s own `shade` — which
 * the frame must not be able to reach (`tests/budget.test.ts`). The canvas is handed the answers.
 */

import { shade } from './bake.ts';
import { BOLT_BLOOM_ALPHA, BOLT_FLASH_ALPHA, type BoltInk, type BoltInks } from './canvas.ts';

/**
 * The most a bolt's two WIDE strokes — the bloom and the flash, `canvas.ts`'s `BOLT_BLOOM_*` and
 * `BOLT_FLASH_*` — may lift the palette's space, laid on one another.
 *
 * ⚠️ **THEY ARE THE STROKES WIDE ENOUGH TO BE AN AREA, AND THEY ARE HELD UNDER A FLASH BY
 * CONSTRUCTION.** WCAG's transition is a change of 0.1 in relative luminance, and a change smaller
 * than that is not a flash at any area. So the two together may lift the space by at most this,
 * whatever ink the palette gives the bolt. It is under half a transition and not just under one, and
 * the meter is why: at 0.08 the bloom's lift on top of the thin strokes' own put the storm at nine
 * transitions a second (`scripts/weigh-flashes.mjs`, 0457); at 0.04 it reads four.
 */
const WIDE_DELTA = 0.04;

const linear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const channel = (hex: string, k: number): number => parseInt(hex.slice(1 + k * 2, 3 + k * 2), 16) / 255;
const WEIGHTS = [0.2126, 0.7152, 0.0722] as const;

/**
 * How much `share` of `ink` ADDED to `under` lifts its relative luminance. The canvas adds in the
 * encoded values and luminance is linear, so this is worked per channel and not as a product: a share
 * of a bright ink lifts a dark ground far less than its own luminance says.
 */
export function lift(under: string, ink: string, share: number): number {
  let before = 0;
  let after = 0;
  WEIGHTS.forEach((w, k) => {
    const u = channel(under, k);
    before += w * linear(u);
    after += w * linear(Math.min(1, u + share * channel(ink, k)));
  });
  return after - before;
}

/**
 * The share of their alpha a bolt's wide strokes may keep in `ink` and, the two laid on one another
 * over `under`, lift it by no more than `WIDE_DELTA`. Solved by halving.
 *
 * ⚠️ **`under` IS THE PALETTE'S SPACE.** Over a brighter sky the same share lifts further, and that
 * is the case the meter flies rather than the case this solves.
 */
export function wideScale(under: string, ink: string): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (lift(under, ink, mid * (BOLT_BLOOM_ALPHA + BOLT_FLASH_ALPHA)) <= WIDE_DELTA) lo = mid;
    else hi = mid;
  }
  return lo;
}

function inkOf(glow: string, core: string, dark: string): BoltInk {
  // The hot inner glow is the glow taken halfway to white: white at the heart, ink at the edge.
  return { glow, hot: shade(glow, 0.5), core, wide: wideScale(dark, glow) };
}

/** Every ink a bolt needs, from the palette's roles. */
export function boltInks(glow: string, core: string, dark: string, hostileGlow: string, hostileCore: string): BoltInks {
  return { player: inkOf(glow, core, dark), hostile: inkOf(hostileGlow, hostileCore, dark), dark };
}
