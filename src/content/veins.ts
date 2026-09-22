/**
 * The veins a place's sky carries, and the pulse that runs along them —
 * `docs/decisions/0354-the-heart-has-veins.md`.
 *
 * Asked for: *"Needs veins pulsing throughout the level and a beautiful starry backdrop."*
 *
 * ⚠️ **AUTHORED, AND READ BY BOTH SIDES**, on the pools' own terms (`src/content/pools.ts`): the veins
 * are baked into the weather tile (`STRUCTURE_OF`, `src/render/bake.ts`) and the pulse is blitted
 * along them every frame (`src/render/scene.ts`). A vein described twice is two veins.
 *
 * ⚠️ **EVERY TRUNK CROSSES THE TILE AND MEETS ITSELF**: its height is a base plus whole cycles of sine
 * per tile, so it is the same at both edges in height and in slope — 0206's seam, which a vessel
 * running the length of the level crosses at every tile.
 */

import type { ThemeKind } from './themes.ts';

/** One wave of a trunk's course: whole cycles per tile, its height in tile fractions, its phase. */
export type VeinWave = readonly [cycles: number, amp: number, phase: number];

/** A vessel that crosses the tile, in fractions of it. */
export interface Trunk {
  readonly base: number;
  readonly waves: readonly VeinWave[];
  /** Its thickness, in tile fractions. */
  readonly width: number;
}

/** A vessel leaving a trunk: which one, where along it, how far it reaches and which way it bends. */
export interface Branch {
  readonly trunk: number;
  readonly at: number;
  readonly reach: number;
  /** The angle it leaves at, in radians from the trunk's own direction; its sign is its side. */
  readonly angle: number;
  /** How much it curls as it goes, in radians over its whole length. */
  readonly curl: number;
}

/** The light that travels along the trunks. */
export interface Pulse {
  /** Beads on each trunk at once, evenly spaced. */
  readonly beads: number;
  /** Steps a bead takes to cross one tile. */
  readonly period: number;
  /** Steps in one beat — the lub, the dub and the rest. */
  readonly beat: number;
}

export interface Veins {
  readonly trunks: readonly Trunk[];
  readonly branches: readonly Branch[];
  readonly pulse: Pulse;
}

/** Where a trunk is at `x` along the tile, both in tile fractions. */
export function trunkAt(trunk: Trunk, x: number): number {
  let y = trunk.base;
  // Indexed: the scene asks this per bead per frame, and an iterator is an allocation.
  for (let i = 0; i < trunk.waves.length; i++) {
    const wave = trunk.waves[i]!;
    y += wave[1] * Math.sin(2 * Math.PI * wave[0] * x + wave[2]);
  }
  return y;
}

/**
 * Which places' skies carry veins — `null` for six of the seven.
 *
 * ⚠️ **FOUR TRUNKS ACROSS THE LANE**, which is tile 0.25 to 0.75: enough that the screen is always
 * threaded with them and few enough that each reads as a vessel rather than a texture.
 */
export const VEINS_OF: Record<ThemeKind, Veins | null> = {
  approach: null,
  nebula: null,
  saurian: null,
  labyrinth: null,
  rime: null,
  mire: null,
  core: {
    trunks: [
      { base: 0.31, waves: [[1, 0.03, 0.4], [3, 0.012, 2.1], [7, 0.004, 0.9]], width: 0.009 },
      { base: 0.44, waves: [[2, 0.028, 1.7], [5, 0.01, 0.3]], width: 0.012 },
      { base: 0.57, waves: [[1, 0.035, 2.8], [4, 0.012, 1.2], [9, 0.003, 2.6]], width: 0.008 },
      { base: 0.69, waves: [[2, 0.022, 0.2], [3, 0.014, 2.9]], width: 0.01 },
    ],
    branches: [
      { trunk: 0, at: 0.12, reach: 0.09, angle: 0.8, curl: 0.5 },
      { trunk: 0, at: 0.48, reach: 0.07, angle: -0.7, curl: -0.4 },
      { trunk: 0, at: 0.81, reach: 0.11, angle: 0.9, curl: 0.3 },
      { trunk: 1, at: 0.27, reach: 0.1, angle: -0.8, curl: -0.6 },
      { trunk: 1, at: 0.63, reach: 0.08, angle: 0.7, curl: 0.4 },
      { trunk: 2, at: 0.05, reach: 0.08, angle: -0.9, curl: 0.5 },
      { trunk: 2, at: 0.4, reach: 0.12, angle: 0.75, curl: -0.3 },
      { trunk: 2, at: 0.72, reach: 0.07, angle: -0.6, curl: -0.5 },
      { trunk: 3, at: 0.2, reach: 0.09, angle: 0.85, curl: 0.4 },
      { trunk: 3, at: 0.56, reach: 0.1, angle: -0.8, curl: 0.5 },
      { trunk: 3, at: 0.9, reach: 0.06, angle: 0.7, curl: -0.4 },
    ],
    pulse: { beads: 3, period: 540, beat: 66 },
  },
};
