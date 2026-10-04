import { describe, expect, it } from 'vitest';
import { CREDITS, CREDIT_KINDS, DEFAULT_CREDIT, type CreditKind } from '../src/content/credits.ts';
import { tallyOf } from '../src/content/score.ts';
import { DEFAULT_DIFFICULTY, initialRun } from '../src/state/slices/run.ts';
import { endSheet, runScore } from '../src/app/score.ts';
import type { LevelScore } from '../src/app/frame.ts';
import { initialState, reduce, type Action, type State } from '../src/state/root.ts';
import { SCREENS } from '../src/state/screens.ts';
import { initialSettings } from '../src/state/slices/settings.ts';
import { serialiseSettings, settingsFrom, SETTINGS_VERSION } from '../src/save/settings.ts';

/**
 * NO QUARTERS GIVEN — `docs/decisions/0517-no-quarters-given.md`.
 *
 * ⚠️ **What is held is which screen a run that ran out goes to**, because that is the whole of what
 * the setting changes: on *No quarters given* the game-over screen with its account and *Main Menu*,
 * on *Freeplay* the run-over screen with its *Continue*, exactly as before. And that the choice is the
 * RUN's, copied by `begin`, so a band moved between runs cannot change a run already flying.
 */

const begin = (credits: CreditKind): Action => ({ slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY, ship: initialRun.ship, credits });
const PLAY: Action = { slice: 'screen', type: 'show', screen: 'playing' };
const DIE: Action = { slice: 'run', type: 'lifeLost' };

/** A run begun on `credits` and flown until it has no lives left. */
function runOut(credits: CreditKind): State {
  let state = reduce(reduce(initialState, begin(credits)), PLAY);
  for (let i = 0; i < 20 && state.run.lives > 0; i++) state = reduce(state, DIE);
  return state;
}

/** The frame's count of the level being flown. */
const flying = (points: number, kills: number, spawned: number, hits: number): LevelScore => ({
  points,
  streak: 0,
  best: 0,
  kills,
  spawned,
  hits,
});

describe('a run that runs out', () => {
  it('ends on the game-over screen when no quarters are given, and nothing on it continues', () => {
    expect(runOut('none').screen.current).toBe('ended');
    expect(SCREENS.ended.actions.map((a) => a.label)).toEqual(['Main Menu']);
  });

  it('is offered the continue on Freeplay, exactly as it was', () => {
    expect(runOut('free').screen.current).toBe('gameOver');
  });

  it('every credit is one or the other, by its row', () => {
    for (const kind of CREDIT_KINDS) {
      expect(runOut(kind).screen.current, kind).toBe(CREDITS[kind].continues ? 'gameOver' : 'ended');
    }
  });
});

describe('the credits are the run’s', () => {
  it('no quarters is the default, on the band and on a run nobody chose for', () => {
    expect(DEFAULT_CREDIT).toBe('none');
    expect(initialSettings.credits).toBe('none');
  });

  it('a run keeps the credits it began on when the band moves', () => {
    let state = reduce(reduce(initialState, begin('none')), PLAY);
    state = reduce(state, { slice: 'settings', type: 'credits', credits: 'free' });
    expect(state.run.credits).toBe('none');
    for (let i = 0; i < 20 && state.run.lives > 0; i++) state = reduce(state, DIE);
    expect(state.screen.current, 'the band reached a run already flying').toBe('ended');
  });

  it('Freeplay is kept between visits, and a document from before it reads as no quarters', () => {
    const free = { ...initialSettings, credits: 'free' as const };
    expect(settingsFrom(serialiseSettings(free), initialSettings).credits).toBe('free');
    const before = JSON.stringify({ v: SETTINGS_VERSION, style: initialSettings.style });
    expect(settingsFrom(before, initialSettings).credits).toBe('none');
  });
});

describe('the game over’s account', () => {
  it('adds up every cleared level and the one being flown', () => {
    let state = reduce(reduce(initialState, begin('none')), PLAY);
    state = reduce(state, { slice: 'run', type: 'scored', tally: tallyOf(0, 1000, 8, 10, 1, { shield: 1, bomb: 0, missile: 0 }) });
    state = reduce(state, { slice: 'run', type: 'levelCleared' });
    const now = flying(500, 2, 10, 3);
    const lines = endSheet(state.run, now, 0);
    const value = (label: string): number | string | undefined => lines.find((l) => l.label === label)?.value;
    expect(value('Reached')).toBe('Level 2');
    expect(value('Kills')).toBe(10);
    expect(value('Shot down')).toBe('50%');
    expect(value('Hits taken')).toBe(4);
    expect(value('Final score')).toBe(runScore(state.run, now));
    expect(value('High score')).toBe('#1');
  });

  it('says something true of a run that died on the first level with nothing sent', () => {
    const state = reduce(reduce(initialState, begin('none')), PLAY);
    const lines = endSheet(state.run, flying(0, 0, 0, 0), null);
    expect(lines.find((l) => l.label === 'Shot down')?.value).toBe('0%');
    expect(lines.some((l) => l.label === 'Ranks'), 'ranks shown for a run that cleared nothing').toBe(false);
  });
});
