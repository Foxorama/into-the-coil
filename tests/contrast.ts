/**
 * WCAG contrast, for the two suites that need it.
 *
 * ⚠️ **Extracted rather than copied, on 2026-08-10** — `docs/decisions/0107-a-level-is-a-place.md`.
 * It lived inside `tests/palette.test.ts` and was the only implementation; a theme's backdrop is a
 * second thing every ink has to be legible against, so a second file needed the same arithmetic.
 * `tests/one-description.test.ts`'s own subject: two copies of a gamma curve is two answers to *is
 * this readable* the day one of them is corrected.
 */

/** One channel of sRGB, linearised. The gamma step every naive contrast check leaves out. */
function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`not a six-digit hex colour: ${hex}`);
  const [r, g, b] = [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
  return 0.2126 * linear(r!) + 0.7152 * linear(g!) + 0.0722 * linear(b!);
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * WCAG AA for graphical objects — the bar the accessibility pass restores.
 *
 * `docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md` defers it: it is measured on
 * every run through `tests/authored.ts` and cannot fail a suite until the pass runs.
 */
export const AA_FLOOR = 4.5;

/**
 * The bar that is NOT deferred: can the player pick this out at all.
 *
 * ⚠️ **A DIFFERENT NUMBER FOR A DIFFERENT QUESTION, AND THAT IS THE WHOLE OF 0198.** An ink nobody can
 * see is a bug for everybody and stays a hard failure; 4.5:1 is a bar about *every* player and waits
 * for the pass. **3.0 is the step at which two large shapes side by side stop being one shape** —
 * `tests/palette.test.ts`'s own `SEPARATED` reasoning, which sets 1.6 for two inks that must be told
 * apart and is deliberately lower because those are compared to each other rather than found against a
 * ground.
 */
export const GAMEPLAY_FLOOR = 3;
