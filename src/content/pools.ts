/**
 * The pools a place's ground holds, and how they bubble —
 * `docs/decisions/0353-the-acid-bubbles.md`.
 *
 * Asked for: *"little popping bubbles on the ground for the mire at the moment, we'll add them as
 * obstacles later."*
 *
 * ⚠️ **AUTHORED, AND READ BY BOTH SIDES.** The pools are baked into the Mire's bed (`src/render/bake.ts`)
 * and the bubbles are blitted over them every frame (`src/render/scene.ts`); a pool placed by a random
 * stream in the baker would put the bubbles somewhere else. One table, two readers — the crater's own
 * rule (`src/content/volcano.ts`).
 *
 * ⚠️ **SCENERY, AND NOTHING THE SIMULATION CAN SEE.** *"We'll add them as obstacles later"* was answered
 * by 0383, and not by the pools: the ground they lie in is the wall now, and the shore above them is
 * what bites. A bubble still hurts nothing and is hit by nothing.
 *
 * ⚠️ **IN THE BED SINCE 0383, AND IT MOVES WITH THE WORLD.** They were in the ground tile, which
 * drifts past at 0.45 of the camera; the bank that bites has to move with the world or a body would
 * burst on a shore the picture has already slid past. The fractions are still of a tile twice the
 * lane, centred on it — lane `240 × top − 60` — so the bubbles' arithmetic did not change.
 */

import type { ThemeKind } from './themes.ts';

/** One pool, in fractions of the ground tile: its left edge, its width, its surface and its depth. */
export interface PoolSpot {
  readonly at: number;
  readonly wide: number;
  readonly top: number;
  readonly deep: number;
}

/** How a place's pools bubble. */
export interface Bubbling {
  /** Bubbles on each pool at once, evenly out of step. */
  readonly count: number;
  /** Steps from a bubble forming to its popping. */
  readonly period: number;
  /** How far it rises off the surface before it pops, in lane units. */
  readonly rise: number;
}

export interface Pools {
  readonly spots: readonly PoolSpot[];
  readonly bubbles: Bubbling;
}

/**
 * Where each place's pools lie — `null` for a place with none, which is six of the seven.
 *
 * ⚠️ **THE MIRE'S EIGHT ARE AUTHORED IN PLACE OF THE STREAM 0221 ROLLED THEM FROM**, in the same
 * ranges it drew from, and spread along the tile so a camera's view always has several on it.
 *
 * ⚠️ **ALL EIGHT 0.067 LOWER — 0383, AND THE NUMBER IS THE ASK'S.** *"It needs to be lower so that the
 * lower row of acid pools sits just off screen."* The highest point any lower-row pool is DRAWN at is
 * its surface less the lens's bulge, `0.075 × deep` — 0.683 for the pool at 0.686 — and 0.683 + 0.067
 * is 0.75: lane 120, the screen's own edge. Measured on the surface line alone the move is 0.064, and
 * leaves a sliver of every lower pool on the screen. And every lens of the upper row now reaches past
 * that edge, which is the *"black layer between the bottom of the acid pools and the bottom of the
 * screen"* gone: `tests/floor.test.ts` holds both in lane units.
 */
export const POOLS_OF: Record<ThemeKind, Pools | null> = {
  approach: null,
  nebula: null,
  saurian: null,
  labyrinth: null,
  rime: null,
  mire: {
    spots: [
      { at: 0.03, wide: 0.12, top: 0.739, deep: 0.042 },
      { at: 0.17, wide: 0.09, top: 0.755, deep: 0.034 },
      { at: 0.29, wide: 0.15, top: 0.743, deep: 0.05 },
      { at: 0.43, wide: 0.08, top: 0.761, deep: 0.03 },
      { at: 0.53, wide: 0.13, top: 0.737, deep: 0.046 },
      { at: 0.66, wide: 0.1, top: 0.753, deep: 0.038 },
      { at: 0.76, wide: 0.14, top: 0.741, deep: 0.052 },
      { at: 0.9, wide: 0.08, top: 0.757, deep: 0.032 },
    ],
    bubbles: { count: 2, period: 150, rise: 3.5 },
  },
  core: null,
};
