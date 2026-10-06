import { describe, expect, it } from 'vitest';
import { DEFAULT_DIFFICULTY, initialRun } from '../src/state/slices/run.ts';
import { initialState, reduce, type Action, type State } from '../src/state/root.ts';
import { DEFAULT_CREDIT } from '../src/content/credits.ts';
import { SCREEN_KINDS, type Screen } from '../src/state/screens.ts';

/**
 * A RUN AT THE TITLE IS OVER — `docs/decisions/0555-a-run-at-the-title-is-over.md`.
 *
 * Played: *"the spinning wheels were spinning happily … when I looked a little later, didn't matter where
 * it was the wheels didn't spin"*, and right again in a fresh tab. A quit and a victory went to the title
 * with the run's lives still up, and the shell reads lives above nought as *a run is flying*, so the
 * hangar's pad kept the last run's ship for the rest of the tab and never wore a fitting again.
 *
 * ⚠️ **HELD ON EVERY SCREEN A RUN CAN BE LEFT FROM, NOT ON THE TWO BUTTONS FOUND**: the title is reached
 * from wherever, and the rule is the title's.
 */

const BEGIN: Action = { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY, ship: initialRun.ship, credits: DEFAULT_CREDIT };
const show = (screen: Screen): Action => ({ slice: 'screen', type: 'show', screen });

/** A run begun and flying, then shown `via` and the title. */
function leftThrough(via: Screen): State {
  let state = reduce(reduce(initialState, BEGIN), show('playing'));
  state = reduce(state, show(via));
  return reduce(state, show('title'));
}

describe('a run at the title is over', () => {
  it('a run quit from the pause has no lives left at the title', () => {
    const state = leftThrough('quit');
    expect(state.screen.current).toBe('title');
    expect(state.run.lives, 'a quit run still has lives at the title, so the hangar never refits the ship on its pad').toBe(0);
  });

  it('and so does a run won, off its victory screen', () => {
    expect(leftThrough('victory').run.lives).toBe(0);
  });

  it('from whichever screen it was left', () => {
    for (const via of SCREEN_KINDS) expect(leftThrough(via).run.lives, via).toBe(0);
  });

  it('but a pause, its settings and its guide keep the run', () => {
    let state = reduce(reduce(initialState, BEGIN), show('playing'));
    const lives = state.run.lives;
    for (const screen of ['paused', 'settings', 'guide', 'paused', 'playing'] as const) state = reduce(state, show(screen));
    expect(state.run.lives).toBe(lives);
  });

  it('and the next run begins stocked, as every run does', () => {
    const state = reduce(leftThrough('quit'), BEGIN);
    expect(state.run.lives).toBeGreaterThan(0);
  });
});
