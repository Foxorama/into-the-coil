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
  /**
   * The acid's colour along the bed, evenly spaced round one drawing and read round and round: 0 is
   * the place's `lit` green, 1 its `acid` teal, and between is the two blended —
   * `docs/decisions/0535-the-mire-runs-teal.md`. A colour of the WATER and not of a pool, so a channel
   * carries its neighbours' colours into each other rather than wearing one of its own.
   */
  readonly tints: readonly number[];
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
 *
 * ⚠️ **LARGER AND JOINED SINCE 0535 — AND THE SURFACES DID NOT MOVE.** *"The toxic pools… need to be
 * larger and more interlinked"*, beside *"the pools graphic is at a good distance"*. So the upper row
 * keeps the lanes it showed at, 116.9 to 118.1, and grows ALONG: five pools of 34 to 43 lanes where
 * there were four of 19 to 36, each joined to the next by a channel whose surface stands a lane or so
 * lower — a stream out of one pool into the next, at 118.6 to 119.3 — overlapping both ends so the
 * acid is one body. The lower row is four, under the upper row's pools, still just off the screen.
 * Every spot's bubbles stay inside its first 0.8 of a drawing's length — `paintBubbles` puts them in
 * the middle three-fifths of a pool — so none is drawn across the wrap from a pool it does not belong to.
 */
export const POOLS_OF: Record<ThemeKind, Pools | null> = {
  approach: null,
  nebula: null,
  saurian: null,
  labyrinth: null,
  rime: null,
  mire: {
    spots: [
      // The upper row: a pool, then the channel out of it into the next.
      { at: 0.0, wide: 0.17, top: 0.739, deep: 0.046 },
      { at: 0.15, wide: 0.1, top: 0.745, deep: 0.022 },
      { at: 0.23, wide: 0.18, top: 0.742, deep: 0.048 },
      { at: 0.39, wide: 0.09, top: 0.746, deep: 0.02 },
      { at: 0.46, wide: 0.15, top: 0.737, deep: 0.044 },
      { at: 0.59, wide: 0.1, top: 0.744, deep: 0.022 },
      { at: 0.67, wide: 0.17, top: 0.741, deep: 0.05 },
      { at: 0.82, wide: 0.09, top: 0.747, deep: 0.02 },
      { at: 0.885, wide: 0.14, top: 0.74, deep: 0.046 },
      // The lower row, just off the screen under them.
      { at: 0.05, wide: 0.1, top: 0.755, deep: 0.034 },
      { at: 0.29, wide: 0.1, top: 0.753, deep: 0.038 },
      { at: 0.5, wide: 0.08, top: 0.757, deep: 0.032 },
      { at: 0.72, wide: 0.1, top: 0.754, deep: 0.036 },
    ],
    bubbles: { count: 2, period: 150, rise: 3.5 },
    /*
      ⚠️ **THE ASK'S THREE, ROUND THE BED: GREEN, GREEN AND TEAL BLENDED, AND TEAL — 0535.** A stop every
      tenth of the drawing: the first pool green, the second teal, the third the two mixed, the fourth
      green again, the last teal running back into the first's green across the wrap, and every
      channel between two of them carrying the one into the other.
    */
    tints: [0, 0.15, 0.55, 1, 0.8, 0.5, 0.3, 0, 0.2, 0.85],
  },
  core: null,
};
