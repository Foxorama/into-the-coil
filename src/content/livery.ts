/**
 * A ship's body in a colour the player chose — `docs/decisions/0529-the-livery-is-free.md`, item 9 of
 * [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
 *
 * Asked for: *"Let's allow custom Livery, if someone wants to make something monstrous on their own game
 * they can do that"* — and planned as *"a free colour for each ship's body, through a picker a pad, a mouse
 * and a thumb can all work. The running lights stay cyan and the high-contrast look stays on roles."*
 *
 * ⚠️ **A HUE AND A TONE, ON TWO BANDS, BECAUSE A BAND IS THE PICKER EVERY DEVICE ALREADY WORKS.** Twelve hues
 * round the wheel and three tones of each are thirty-six bodies and the factory's, and every step of both
 * is a press a pad, a mouse and a thumb already make on every band in the game. A wheel or a slider would
 * be a new control with its own focus, drag and step for each of them.
 *
 * ⚠️ **THE BODY AND NOTHING ELSE.** A livery replaces the ink each ship's painter fills its body with;
 * the running lights, the glass, the trim and the gold are each drawn in their own ink and do not move.
 */

import type { PaletteName } from './palette.ts';

export interface Hue {
  /** What the band calls it. */
  readonly name: string;
  /** Degrees round the wheel. */
  readonly degrees: number;
}

/** Twelve hues, every thirty degrees. Closed — the band is built by walking it. */
export const HUES: readonly Hue[] = [
  { name: 'Red', degrees: 0 },
  { name: 'Orange', degrees: 30 },
  { name: 'Yellow', degrees: 60 },
  { name: 'Lime', degrees: 90 },
  { name: 'Green', degrees: 120 },
  { name: 'Jade', degrees: 150 },
  { name: 'Cyan', degrees: 180 },
  { name: 'Azure', degrees: 210 },
  { name: 'Blue', degrees: 240 },
  { name: 'Violet', degrees: 270 },
  { name: 'Magenta', degrees: 300 },
  { name: 'Rose', degrees: 330 },
];

export interface Tone {
  readonly name: string;
  readonly saturation: number;
  readonly lightness: number;
}

/** Three tones of each hue, deep to pale. */
export const TONES: readonly Tone[] = [
  { name: 'Deep', saturation: 0.62, lightness: 0.3 },
  { name: 'Bright', saturation: 0.78, lightness: 0.52 },
  { name: 'Pale', saturation: 0.6, lightness: 0.76 },
];

/** A body colour: a hue and a tone, by place in their lists. */
export interface Livery {
  readonly hue: number;
  readonly tone: number;
}

/** The ink a livery paints with, as `#rrggbb` — the same string every palette ink is. */
export function liveryInk(livery: Livery): string {
  const hue = HUES[livery.hue] ?? HUES[0]!;
  const tone = TONES[livery.tone] ?? TONES[1]!;
  const h = hue.degrees / 360;
  const { saturation: s, lightness: l } = tone;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): string => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    const v = x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p;
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return '#' + channel(h + 1 / 3) + channel(h) + channel(h - 1 / 3);
}

/**
 * What a ship's body is painted on a palette — 0529: the livery's ink, or `null` for the factory's paint.
 *
 * ⚠️ **NOTHING ON THE HIGH-CONTRAST PALETTE.** The plan: *"the high-contrast look stays on roles"*. That
 * palette's every ink is a meaning, and a body in a chosen colour would be the one ink on the screen that
 * means nothing. Nothing in the game mounts that palette yet (`src/main.ts` mounts the default), so this
 * is the rule waiting for it rather than a look a player can reach.
 */
export function liveryFor(livery: Livery | null, palette: PaletteName): string | null {
  return livery === null || palette === 'high-contrast' ? null : liveryInk(livery);
}
