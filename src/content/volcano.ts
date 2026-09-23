/**
 * The shape of Saurian Belt's volcanoes, and where each one throws its rock from —
 * `docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md`.
 *
 * ⚠️ **CONTENT, BECAUSE TWO LAYERS NEED THE SAME CRATER.** `drawVolcano` bakes the mountain and
 * `src/app/frame.ts` has to know where its crater is to throw rock out of it — and the frame may not
 * reach the baker (`tests/budget.test.ts`). A crater computed twice is two craters the day one of
 * them changes, so the shape is described once here and both read it.
 */

import { makeRng } from '../sim/rng.ts';
import type { ThemeKind } from './themes.ts';

/** One casting's cone, every number a fraction of the landmark's own bitmap. */
export interface Cone {
  /** Where the crater's lip is, down from the top. */
  readonly peak: number;
  /** Half the width at the foot, which is the bottom edge of the bitmap. */
  readonly half: number;
  /** Half the crater's width. */
  readonly crater: number;
  /**
   * How the flanks flare: `1` is a straight-sided pyramid and more is a stratocone's concave skirt —
   * 0225's finding that this is what makes three castings read as three mountains.
   */
  readonly flank: number;
}

/**
 * The cone of casting `seed`.
 *
 * ⚠️ **ITS OWN STREAM, SEPARATE FROM EVERYTHING DRAWN ON THE MOUNTAIN** — 0021. The painter draws
 * plume, lava and light from a stream of its own, so a puff added to the smoke can never move the
 * crater the rocks come out of.
 */
export function coneOf(seed: number): Cone {
  const rng = makeRng('sky').stream(`saurian/cone${seed}`);
  return {
    peak: rng.range(0.28, 0.36),
    half: rng.range(0.3, 0.4),
    crater: rng.range(0.032, 0.05),
    flank: rng.range(1.25, 1.7),
  };
}

/**
 * A landmark entry's eruption: how much it throws, how often, and how hard.
 *
 * ⚠️ **ON THE ENTRY AND NOT THE PLACE — 0282.** The three volcanoes arrive with `push`, `surge` and
 * `approach`, and a level that escalates with its own music should have a mountain that does too.
 * Absent is a mountain that is quiet.
 */
export interface Eruption {
  /** Rocks in the air at once. Each is one blit — `tests/budget.test.ts` holds the total. */
  readonly count: number;
  /**
   * Steps one rock takes from the crater to off the top of the screen — 0363. Shorter is a harder
   * throw: every rock of one volcano climbs the same distance, and this is how long it takes.
   */
  readonly period: number;
  /**
   * How far past the top of the screen the hardest throw would go on climbing, were the screen taller,
   * in world units at the landmark's own scale — 0363. It sets how fast a rock is still going when it
   * leaves; no throw turns over in sight, because the turn is always past the edge.
   */
  readonly overshoot: number;
  /** How far sideways the furthest throw drifts by the time it leaves, in the same units. */
  readonly reach: number;
}

/**
 * Where a place's landmark throws from, as a fraction of its bitmap from the top-left — or `null` for
 * a landmark that throws nothing.
 *
 * ⚠️ **A TABLE OVER THE PLACES, SO A PLACE THAT CANNOT ERUPT CANNOT BE GIVEN AN ERUPTION.**
 * `tests/places.test.ts` refuses an `erupts` on an entry whose place has no vent here: rock thrown
 * out of the middle of the Pillars would be a picture of nothing.
 */
export const VENT_OF: Record<ThemeKind, ((seed: number) => { x: number; y: number }) | null> = {
  approach: null,
  nebula: null,
  saurian: (seed) => ({ x: 0.5, y: coneOf(seed).peak }),
  labyrinth: null,
  rime: null,
  mire: null,
  core: null,
};
