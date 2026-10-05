/**
 * The inks a bolt is stroked in, solved once per palette — `docs/decisions/0520-the-light-is-loud.md`.
 *
 * ⚠️ **NOT IN `canvas.ts`, BECAUSE THAT FILE IS ON THE HOT LIST AND THIS IS COLOUR ARITHMETIC.** It
 * runs when the palette or the place is set, never per stroke, and it shades with `bake.ts`'s own
 * `shade` — which the frame must not be able to reach (`tests/budget.test.ts`). The canvas is handed
 * the answers.
 */

import { shade } from './bake.ts';
import type { BoltInk, BoltInks } from './canvas.ts';

function inkOf(glow: string, core: string): BoltInk {
  // The hot glow is the glow taken halfway to white: white at the heart, ink at the edge.
  return { glow, hot: shade(glow, 0.5), core };
}

/**
 * Every ink a bolt needs, from the palette's roles: the player's, the enemy's, the flame's — the
 * Catherine wheel's tether, 0545, the player's own fire and never the hostile `fire` — and the rim's dark.
 */
export function boltInks(
  glow: string,
  core: string,
  dark: string,
  hostileGlow: string,
  hostileCore: string,
  flameGlow: string,
  flameCore: string,
): BoltInks {
  return { player: inkOf(glow, core), hostile: inkOf(hostileGlow, hostileCore), flame: inkOf(flameGlow, flameCore), dark };
}
