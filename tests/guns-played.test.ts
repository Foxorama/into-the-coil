/**
 * The guns answer the first play-test —
 * `docs/decisions/0236-the-guns-answer-the-first-play-test.md`, over
 * `reports/the-guns-played-2026-09-05.md`.
 *
 * Seven items, each answered where it lives: the cycle's length is a taste and is observed; the
 * reach, the scatter, the strike and the bubble are held here; the thunder and the bright points
 * are held beside the guards they extend, in `tests/sound.test.ts` and `tests/weapons.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../src/content/weapons.ts';
import { PICKUPS, PICKUP_CYCLE_STEPS, PICKUP_KINDS } from '../src/content/pickups.ts';
import { CUES } from '../src/content/cues.ts';
import { cueSeconds } from '../src/app/sound.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { drawKind } from '../src/render/bake.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { tracingPen } from './paths.ts';

describe('0236 — the guns answer the first play-test', () => {
  it('THE REACH: the arc reaches further at every rung, by at least a sixth', () => {
    /*
      *"The reach of the lightning needs to be extended by about 20% per power up tier."* Held as
      the relationship — every rung further than the last, by a fifth or near it — rather than as
      the numbers, on `src/content/shots.ts`'s terms.
    */
    const reach = WEAPONS.arc.reach;
    for (let tier = 1; tier < reach.length; tier++) {
      expect(reach[tier]!, `the arc's reach at tier ${tier} is not a sixth further than tier ${tier - 1}`).toBeGreaterThanOrEqual(
        reach[tier - 1]! * 1.16,
      );
    }
    expect(reach[reach.length - 1]!, 'the arc at its cap reaches past the narrowest view').toBeLessThan(ACROSS_SPAN * (16 / 9));
  });

  /*
    ⚠️ **`THE SCATTER: a death throws its pieces apart across the lane` WAS HERE.** 0236 gave the
    death scatter a flight so it was not a fan; 0256 took the scatter out of a death and gave the
    throw to the mid-boss's drop, where the flight is held — `is thrown in both axes, flies its
    throw out, and then waits like any other` in `tests/pickups.test.ts`.
  */

  it('THE STRIKE: a bolt landing is an explosion, not a tick', () => {
    /*
      *"Need an impact/explosion sound when enemies get hit by lightning — currently there's no
      impact noise."* There was one, at the hit's size, and a discharge on the same step ate it. A
      strike outlasts a hit by a wide margin; what it sounds like is held with the other explosions.
    */
    expect(cueSeconds(CUES.zap), 'the strike is no longer than a hit').toBeGreaterThan(cueSeconds(CUES.hit) * 2);
    // And the length is in its BODY — the noise under a falling filter that an explosion is made
    // of — not only in a tone ringing on under a tick.
    const body = (row: typeof CUES.zap): number =>
      row.layers.filter((l) => l.wave === 'noise').reduce((longest, l) => Math.max(longest, l.seconds), 0);
    expect(body(CUES.zap), 'the strike has no body of its own').toBeGreaterThan(body(CUES.hit) * 2);
  });

  it('THE BUBBLE: every face of every pickup carries a translucent ring outside its glyph', () => {
    /*
      *"All the power ups need a glow or bubble/circle or something around them, they're hard to
      distinguish from enemies now."* The bubble is painted, translucent, outside the glyph and
      inside the box; a face without one is an enemy-shaped thing in pickup ink.
    */
    const palette = PALETTES[DEFAULT_PALETTE];
    const size = 64;
    for (const kind of PICKUP_KINDS) {
      for (const sprite of PICKUPS[kind].faces) {
        const name = SPRITE_KINDS[sprite]!;
        const { pen, trace } = tracingPen();
        drawKind(pen, name, palette, size);
        const soft = trace.passes.filter((p) => p.alpha < 0.9);
        let reach = 0;
        for (const pass of soft) {
          for (const subpath of pass.subpaths) {
            for (const [x, y] of subpath) reach = Math.max(reach, Math.hypot(x - size / 2, y - size / 2));
          }
        }
        expect(reach / size, `${name} has no translucent mark reaching outside its glyph`).toBeGreaterThan(0.42);
        expect(reach / size, `${name}'s bubble is clipped by its own box`).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('the cycle is a taste, measured in the register and never failed on', () => {
    // *"The rotation needs to be 1sec longer."* Three seconds is the player's number; nothing
    // about the game breaks at two, so it is advisory (0192): `tests/authored.test.ts` observes
    // `0236-cycle` and prints it on every run. What is held here is only that the cycle exists.
    expect(PICKUP_CYCLE_STEPS / STEPS_PER_SECOND).toBeGreaterThan(0);
  });
});
