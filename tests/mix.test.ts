import { describe, expect, it } from 'vitest';

import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, MIX_RUN, MULTI_HIT_RUNUP } from '../src/content/levels.ts';

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

/**
 * The one stretch a level may send one class through: level one's run-up.
 *
 * ⚠️ **0086 AND THIS RULE MEET HERE, AND 0086 WINS.** Every firing kind has two or more hits of
 * health and `docs/decisions/0086-the-teeth-wait-for-the-gun.md` forbids anything with more than one
 * between the second weapon pickup and the end of the run-up — so that stretch cannot fire, by a
 * decision older than this one. It is skipped, and the run resets on either side of it.
 */
function runUpOf(kind: (typeof LEVEL_KINDS)[number]): { from: number; to: number } | null {
  if (kind !== LEVEL_KINDS[0]) return null;
  const weapons = LEVELS[kind].pickups.filter((p) => p.kind === 'weapon');
  const lifts = weapons[1]?.at;
  return lifts === undefined ? null : { from: lifts, to: lifts + MULTI_HIT_RUNUP };
}

describe('0231 — a level is a mix of what shoots and what does not', () => {
  it('THE REPORTED ONE: no level sends more than MIX_RUN waves of one class in a row', () => {
    for (const kind of LEVEL_KINDS) {
      const waves = [...LEVELS[kind].waves].sort((a, b) => a.at - b.at);
      const runUp = runUpOf(kind);
      let run = 0;
      let last: boolean | null = null;
      for (const wave of waves) {
        if (runUp !== null && wave.at >= runUp.from && wave.at <= runUp.to) {
          last = null;
          run = 0;
          continue;
        }
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
