/**
 * The inks a bolt is stroked in, solved once per palette — `docs/decisions/0520-the-light-is-loud.md`.
 *
 * ⚠️ **NOT IN `canvas.ts`, BECAUSE THAT FILE IS ON THE HOT LIST AND THIS IS COLOUR ARITHMETIC.** It
 * runs when the palette or the place is set, never per stroke, and it shades with `bake.ts`'s own
 * `shade` — which the frame must not be able to reach (`tests/budget.test.ts`). The canvas is handed
 * the answers.
 */

import { mix, shade } from './bake.ts';
import type { BoltInk, BoltInks } from './canvas.ts';

function inkOf(glow: string, core: string): BoltInk {
  // The hot glow is the glow taken halfway to white: white at the heart, ink at the edge.
  return { glow, hot: shade(glow, 0.5), core };
}

/**
 * Every ink a bolt needs, from the palette's roles: the player's, the enemy's, the flame's — the
 * Catherine wheel's tether, 0545, the player's own fire and never the hostile `fire` — the water's — the
 * Water Cannon's jet, 0595 — and the rim's dark.
 */
export function boltInks(
  glow: string,
  core: string,
  dark: string,
  hostileGlow: string,
  hostileCore: string,
  flameGlow: string,
  flameCore: string,
  waterGlow: string,
  waterCore: string,
  // 0666: Red Lightning's — the palette's red and its fire, which the scarlet is mixed from.
  red: string,
  fire: string,
): BoltInks {
  /*
    ⚠️ **THE PAGE ASKED FOR RED, AND RED IS WHERE THE THREATS LIVE — 0666.** The enemy's ink is the game's red and
    the serpent's own strike is stroked in it, so Venoma's is taken a quarter of the way to the fire's vermilion and
    deepened: a scarlet, not the enemy's pink-red. What tells the two apart first is not the ink: hers lands the
    step it is drawn, and the serpent's is a warning line for three quarters of a second before it can.
  */
  /*
    ⚠️ **AND HALF WAY TO A PURE RED, WITH A RED HEART AND NOT A WHITE ONE.** Photographed with the palette's inks alone
    and a white core, as every other bolt is, it read as a pink-white streak: the core is the widest bright stroke,
    and the enemy's red is lifted toward pink for the sky (0222). No role in a palette is a saturated red, so this
    one is mixed toward one, and its heart is its own glow taken toward white rather than white.
  */
  const scarlet = mix(mix(red, fire, 0.25), '#ff0000', 0.55);
  return {
    player: inkOf(glow, core),
    hostile: inkOf(hostileGlow, hostileCore),
    flame: inkOf(flameGlow, flameCore),
    water: inkOf(waterGlow, waterCore),
    smite: inkOf(scarlet, shade(scarlet, 0.55)),
    dark,
  };
}
