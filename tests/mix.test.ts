import { describe, expect, it } from 'vitest';

import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, MIX_RUN } from '../src/content/levels.ts';

/**
 * A LEVEL IS A MIX — 0231.
 *
 * `docs/decisions/0231-a-level-is-a-mix.md`. Reported: *"the spacing of enemy waves, they're grouped
 * up into non-firing and firing waves, so instead of a good mix, you get a bunch of enemies that
 * don't shoot in a few waves, then a bunch of enemies that shoot in a few waves, then a bunch of
 * enemies that don't shoot in a few waves etc."* Measured before the fix: The Approach ran twelve
 * non-firing waves in a row, the shoal level seventeen, the batteries level twenty-nine firing.
 *
 * ⚠️ **A BUDGET, AND THE REPORT OWNS THE NUMBER.** `MIX_RUN` is how many waves of one class may
 * arrive in a row; the play-test set it, and a level that wants a longer run of one class argues
 * with the report rather than with this file.
 */

/** Whether a wave's kind fires — the class the report is about. */
const fires = (enemy: keyof typeof ENEMIES): boolean => ENEMIES[enemy].fireEvery > 0;

/*
  ── `runUpOf` WAS HERE — LEVEL ONE'S RUN-UP, THE ONE STRETCH A LEVEL MAY SEND ONE CLASS THROUGH ────

  0086 forbade anything with more than one hit between the weapon pickup that lifted the one-hit clamp
  and the end of `MULTI_HIT_RUNUP`, so that stretch could not fire and this rule skipped it.
  `docs/decisions/0441-a-pilot-flies-their-own-ship.md` deleted the clamp with the gun ladder — every
  ship opens on its whole gun — so nothing forbids a firing wave there any more, and level one is
  mixed like every other level.
*/

describe('0231 — a level is a mix of what shoots and what does not', () => {
  it('THE REPORTED ONE: no level sends more than MIX_RUN waves of one class in a row', () => {
    for (const kind of LEVEL_KINDS) {
      const waves = [...LEVELS[kind].waves].sort((a, b) => a.at - b.at);
      let run = 0;
      let last: boolean | null = null;
      for (const wave of waves) {
        const cls = fires(wave.enemy);
        run = cls === last ? run + 1 : 1;
        last = cls;
        expect(
          run,
          `${kind} sends ${run} ${cls ? 'firing' : 'non-firing'} waves in a row by ${wave.at} — a bunch of one thing, then a bunch of the other`,
        ).toBeLessThanOrEqual(MIX_RUN);
      }
    }
  });

  it('and every level still sends both classes, because a mix needs two things to mix', () => {
    for (const kind of LEVEL_KINDS) {
      const classes = new Set(LEVELS[kind].waves.map((w) => fires(w.enemy)));
      expect(classes.size, `${kind} sends only one class of enemy`).toBe(2);
    }
  });
});

describe('the budget is the report’s', () => {
  it('and the budget is the report’s number, not a number the content happens to fit', () => {
    /*
      ⚠️ **THREE, BECAUSE THE PLAY-TEST SAID *A FEW*.** A run of two is a pair and reads as a mix; a
      run of four is *a bunch*, which is the word the report used. Held here so a hand tuning a level
      that will not fit under three cannot raise the number instead of fixing the level.
    */
    expect(MIX_RUN).toBe(3);
  });
});
