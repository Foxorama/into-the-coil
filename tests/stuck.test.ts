/**
 * A hostile shot leaves the screen — `docs/decisions/0474-a-wave-keeps-its-heading.md`.
 *
 * Reported from play on the Rime Shelf, 2026-10-04: *"this red bullet hung around on the screen. the
 * only way I could get it to go away was by flying into it and dying."* It was a ripple out of the ice
 * blades' ring, thrown sideways, whose wave wrote its across speed from its along one every step — so
 * it had no speed left in the camera's frame and swung in place for as long as the level lasted.
 *
 * ⚠️ **THE INSTRUMENT IS THE GUARD**: `scripts/weigh-stuck.mjs` flies each level whole — the real
 * frame, the real spawner, the place's own arms, a ship sweeping the lane and never dying — and this
 * reads the longest any one hostile shot stayed on the screen without leaving it. Seconds, the
 * player's unit (0027), on every level and at every tier, because a tier changes how fast every shot
 * flies and the slowest crossing is the easiest tier's.
 */
import { describe, expect, it } from 'vitest';

import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { weighStuck } from '../scripts/weigh-stuck.mjs';

/**
 * The longest a hostile shot may stay on the screen, in seconds.
 *
 * ⚠️ **AN INVARIANT WITH ROOM, NOT A BUDGET.** *Name a change that would redden this and be correct*
 * (0192): a shot meant to loiter — and a thing meant to loiter on the screen is a body, which can be
 * shot, not a bullet, which cannot. The number only has to clear the slowest crossing anything
 * authors. Measured at 0474, the longest on every level, Legendary / Savior / Burn:
 *
 * | level | longest |
 * |---|---|
 * | approach | 5.3 / 4.8 / 3.9 s, the serpent's acid |
 * | **shoal** | **8.2 / 6.5 / 5.2 s, the gyre's astern wall crossing its stopped room at 0.45 of its speed** |
 * | gauntlet | 7.6 / 3.9 / 3.1 s, the hydra's acid |
 * | the other four | 4.8 s and under |
 *
 * The ripple this was written for stays until the level ends.
 */
const LINGER_SECONDS = 15;

describe('0474 — a hostile shot leaves the screen', () => {
  for (const difficulty of DIFFICULTY_KINDS) {
    it(`no hostile shot stays on the screen ${LINGER_SECONDS} s, on any level, at ${difficulty}`, () => {
      const stuck: string[] = [];
      for (const level of LEVEL_KINDS) {
        const { lingering, longest, summary } = weighStuck(level, { difficulty, linger: LINGER_SECONDS * STEPS_PER_SECOND });
        expect(longest.steps, `${level} flew no shot at all, so it measured nothing: ${summary}`).toBeGreaterThan(0);
        for (const line of lingering) stuck.push(`${level}: ${line}`);
      }
      expect(stuck, stuck.join('\n')).toEqual([]);
    });
  }
});
