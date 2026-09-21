/**
 * The Pillars fill the sky — `docs/decisions/0346-the-pillars-fill-the-sky.md`.
 *
 * Played, of 0345: *"pillars and ember look good, but the pillars could be more prominent, they only
 * take up part of the screen and level, we can make them larger and more interesting"* — and then
 * *"more vibrant and prominent."*
 */

import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { SPRITE_EXTENT } from '../src/content/sprites.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { bakeSize, drawKind } from '../src/render/bake.ts';
import { landmarksFor } from '../src/app/frame.ts';
import { tracingPen } from './paths.ts';

const nebula = LEVEL_KINDS.map((kind) => LEVELS[kind]).find((level) => level.theme === 'nebula')!;

describe('0346 — the Pillars fill the sky', () => {
  it('THE REPORTED ONE, IN LANE UNITS: the stand that arrives with the organ is taller than the lane, and is the biggest', () => {
    /*
      *"They only take up part of the screen."* A landmark's bitmap is 75 units and the lane is 100, so
      at its own size no landmark can span the screen whatever is drawn in it. The tallest column is
      0.92 of its tile.

      ⚠️ **THE ORGAN'S STAND, AND IT WAS *THE BIGGEST OF THE THREE* UNTIL ITS OWN PROBE CAME BACK STILL
      GREEN.** Shrinking the middle stand left another clearing the lane, so a claim about a maximum
      could not see the one that matters being put back. The moment the level is built round is
      `push` — `tests/sky.test.ts` holds a stand there — and that one is the claim.
    */
    const push = nebula.sections.find((entry) => entry.section === 'push')!;
    const organ = nebula.landmarks.find((entry) => entry.at === push.at)!;
    const tall = SPRITE_EXTENT.landmark * (organ.scale ?? 1) * 0.92;
    expect(tall, `the organ's tallest column is ${tall.toFixed(0)} units against a lane of ${ACROSS_SPAN}`).toBeGreaterThan(ACROSS_SPAN);
    for (const entry of nebula.landmarks) {
      expect(organ.scale ?? 1, 'a stand elsewhere in the level is bigger than the one the organ opens on').toBeGreaterThanOrEqual(entry.scale ?? 1);
    }
  });

  it('AND THE LEVEL: every casting stands somewhere in it, and the first is there from the opening', () => {
    const variants = new Set(nebula.landmarks.map((entry) => entry.variant));
    expect(variants.size, 'the level places fewer castings than 0225 bakes for it').toBe(3);
    /*
      ⚠️ **ON SCREEN AT THE OPENING, NOT *ARRIVING EARLY*.** `at` is where a stand's leading edge
      enters, and at a landmark's rate that is a long way from being seen: the first draft put one at
      120 and the photograph at 400 had a sliver of it. Held as how much of the first stand has come
      into view by the level's first step, in world units against its own drawn width.
    */
    const first = nebula.landmarks.reduce((a, b) => (a.at <= b.at ? a : b));
    const entered = (0 - first.at) * first.depth;
    const width = SPRITE_EXTENT.landmark * (first.scale ?? 1);
    expect(entered, `at the opening ${entered.toFixed(0)} units of a ${width.toFixed(0)}-unit stand are in view`).toBeGreaterThan(width * 0.75);
  });

  it('0282 — a landmark that states no scale is drawn at its own size', () => {
    /*
      ⚠️ **THE MECHANISM, AND IT USED TO BE A LIST OF WHO MAY USE IT — changed by 0347.** This read
      *every place but Ember Nebula states no scale*, which was true for a day: Saurian Belt's volcano
      was then asked to touch the sky, and a bitmap 75 units tall cannot reach the top of a 100-unit
      lane from a foot behind the range. A guard naming which places may state a field is 0295's
      content limiter one table over. What 0282 claims is that an entry saying NOTHING is drawn exactly
      as before — which is a property of the frame, and is held there.
    */
    let unscaled = 0;
    for (const kind of LEVEL_KINDS) {
      const drawn = landmarksFor(LEVELS[kind]);
      LEVELS[kind].landmarks.forEach((entry, i) => {
        if (entry.scale !== undefined) return;
        unscaled += 1;
        expect(drawn[i]!.scale, `${kind}'s landmark at ${entry.at} states no scale and is drawn scaled`).toBe(1);
        expect(drawn[i]!.extent, `${kind}'s landmark at ${entry.at} states no scale and is culled as a bigger one`).toBe(
          SPRITE_EXTENT.landmark,
        );
      });
    }
    expect(unscaled, 'every landmark in the game states a scale, so this holds nothing').toBeGreaterThan(0);
  });

  it('THE ONE THE PHOTOGRAPH FOUND: no light in the Pillars is cut off by the edge of their own bitmap', () => {
    /*
      A gradient that runs past the tile is clipped flat, and scaled up that is a ruled line across the
      sky — the first crown on the tallest column did exactly that. Top and sides only: the feet and
      the bank they stand in run off the bottom on purpose (0204).
    */
    const size = bakeSize(SPRITE_EXTENT.landmark, 10);
    for (const kind of ['landmark', 'landmarkB', 'landmarkC'] as const) {
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'nebula');
      const lights = trace.passes.filter((pass) => pass.colour === 'gradient');
      expect(lights.length, `${kind} draws no light at all`).toBeGreaterThan(0);
      for (const pass of lights) {
        const points = pass.subpaths.flat();
        const xs = points.map((p) => p[0]);
        const top = Math.min(...points.map((p) => p[1]));
        expect(top, `${kind}: a light reaches ${(-top).toFixed(1)}px past the top of its bitmap`).toBeGreaterThanOrEqual(-0.5);
        expect(Math.min(...xs), `${kind}: a light runs off the left of its bitmap`).toBeGreaterThanOrEqual(-0.5);
        expect(Math.max(...xs), `${kind}: a light runs off the right of its bitmap`).toBeLessThanOrEqual(size + 0.5);
      }
    }
  });
});
