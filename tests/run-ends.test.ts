import { describe, expect, it } from 'vitest';
import { DEFAULT_DIFFICULTY, initialRun } from '../src/state/slices/run.ts';
import { initialState, reduce, type Action, type State } from '../src/state/root.ts';
import { DEFAULT_CREDIT } from '../src/content/credits.ts';
import { SCREEN_KINDS, STEPS_PER_SECOND, type Screen } from '../src/state/screens.ts';
import { SPECIAL_KINDS } from '../src/content/specials.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { GameFrame } from '../src/app/frame.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { Pool } from '../src/sim/pool.ts';
import { playableWorld } from './world.ts';

const TIER = DIFFICULTY_KINDS[0]!;

/**
 * A RUN AT THE TITLE IS OVER — `docs/decisions/0558-a-run-ends-at-the-title.md`.
 *
 * Asked: *"fix the lives bug and the run ending properly so that things reset correctly."* A quit and a
 * victory went to the title with the run's lives still up — measured, ×3 on the title after a quit — and
 * the shell reads lives above nought as *a run is flying*, so the world kept the last run's ship for the
 * rest of the tab: the pad stood its spinners over the next pilot's caddie (`tests/run-ends.browser.test.ts`).
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

  it('and is gone whole — not a run stood down with its account, its arsenal and its level still on it', () => {
    // 0559, asked: *"we should clear-out the whole run"*. A run's half of the state is `initialRun` at the title.
    let flown = reduce(reduce(initialState, BEGIN), show('playing'));
    flown = reduce(flown, { slice: 'run', type: 'took', special: SPECIAL_KINDS[0]! });
    flown = reduce(flown, { slice: 'run', type: 'levelCleared' });
    expect(flown.run, 'the run flown is the run no one flew, so this compares nothing').not.toEqual(initialRun);
    for (const via of SCREEN_KINDS) expect(reduce(reduce(flown, show(via)), show('title')).run, via).toEqual(initialRun);
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

/**
 * The world, as the shell hands it to `makeLifecycle` — the fixture `tests/continue.test.ts` drives the
 * other verbs through, and the real reducer.
 */
function shell() {
  const built = playableWorld(LEVELS[LEVEL_KINDS[0]!]);
  let current: State = initialState;
  const dispatch = (action: Action): void => {
    current = reduce(current, action);
  };
  return { built, lifecycle: makeLifecycle(built.world, dispatch, () => current.run) };
}

/**
 * The world as data, to compare whole: every field, every pool by what it holds, every body in it, down
 * to the ninth level. Functions are named, not compared; a reference back up the path is a cycle.
 */
function snapshot(value: unknown, depth = 0, path: readonly object[] = []): unknown {
  if (value === null || typeof value !== 'object') return typeof value === 'function' ? 'function' : value;
  if (path.includes(value)) return 'cycle';
  const inner = [...path, value];
  if (value instanceof Pool) return { size: value.size, bodies: Array.from({ length: value.size }, (_, i) => snapshot(value.at(i), depth + 1, inner)) };
  if (depth > 9) return 'deeper';
  if (Array.isArray(value)) return value.map((x) => snapshot(x, depth + 1, inner));
  const out: Record<string, unknown> = {};
  for (const [key, x] of Object.entries(value)) out[key] = snapshot(x, depth + 1, inner);
  return out;
}

/** Every place two snapshots differ, as `path: a | b`. */
function differences(a: unknown, b: unknown, path = 'world', out: string[] = []): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      differences((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], path + '.' + key, out);
    }
    return out;
  }
  out.push(`${path}: ${String(JSON.stringify(a)).slice(0, 60)} | ${String(JSON.stringify(b)).slice(0, 60)}`);
  return out;
}

describe('0559 — a run ends whole', () => {
  it('leaves the world as no run had touched it: every pool, every body, every number', () => {
    /*
      Asked: *"there's a very real chance we implement something in the future that hangs around and bites
      us because we didn't properly close a run now."* So nothing is named here. A run is flown for forty
      seconds, a body is put in EVERY layer the world draws — a pool added next month included — and then
      it ends; the world it leaves is compared whole against one where a run began and ended at once.
      Measured when it was written: the lightning gun's bolts, the stick's last reading, the run's clock,
      the readout's latches and the last boss's place all outlived a run.
    */
    const flown = shell();
    flown.lifecycle.begin(TIER, 'firebird', DEFAULT_CREDIT, undefined, undefined, 'spinner');
    const frame = new GameFrame(flown.built.world);
    for (let step = 0; step < 40 * STEPS_PER_SECOND; step++) {
      flown.built.stick.across = Math.sin(step / 40);
      frame.step();
    }
    for (const layer of flown.built.world.layers) {
      const body = layer.spawn();
      if (body !== null) body.along = 999;
    }
    const untouched = shell();
    untouched.lifecycle.begin(TIER, 'firebird', DEFAULT_CREDIT, undefined, undefined, 'spinner');
    untouched.lifecycle.end();
    expect(differences(snapshot(flown.built.world), snapshot(untouched.built.world)).length, 'the run flown left nothing to compare').toBeGreaterThan(0);
    flown.lifecycle.end();
    expect(differences(snapshot(flown.built.world), snapshot(untouched.built.world)), 'the run ended and this was still in the world').toEqual([]);
  });
});
