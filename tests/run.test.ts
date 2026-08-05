import { describe, expect, it } from 'vitest';

import { type Action, type State, initialState, reduce } from '../src/state/root.ts';
import { STARTING_LIVES } from '../src/state/slices/run.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * WHAT A RUN COSTS — `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`.
 *
 * The reducer is pure, so the whole of a run's shape is testable here with no canvas, no browser and
 * no clock. That is the entire value of the layer — `docs/decisions/0015-the-layer-ladder.md` grants
 * `state` no capabilities at all, precisely so this file can exist.
 *
 * ⚠️ **Nothing here asserts on `STARTING_LIVES`.** It is a play-test number, on the same terms
 * `src/sim/flight.ts` sets for `SHIP_SPEED` — what these hold are the relationships that must be
 * true at any value. A test pinning it to three would go red the first time a hand moved it, which
 * is the one moment a guard should be silent.
 */

/** Fold a script of actions over the real reducer, as the shell does. */
function play(...actions: Action[]): State {
  let state = initialState;
  for (const action of actions) state = reduce(state, action);
  return state;
}

const BEGIN: Action = { slice: 'run', type: 'begin' };
const PLAY: Action = { slice: 'screen', type: 'show', screen: 'playing' };
const DIE: Action = { slice: 'run', type: 'lifeLost' };

/** A run in progress, with something in the arsenal to lose. */
function armed(): State {
  return play(BEGIN, PLAY, { slice: 'run', type: 'took', special: 'bomb' }, { slice: 'run', type: 'took', special: 'shield' });
}

describe('a run is lives', () => {
  it('starts on the title screen with no run in progress', () => {
    expect(initialState.screen.current).toBe('title');
    // Zero rather than a full complement, so `begin` is the only way into a run — a state that was
    // already stocked would let a stray dispatch drop the player into a half-run.
    expect(initialState.run.lives).toBe(0);
    expect(initialState.run.arsenal).toEqual([]);
  });

  it('stocks a full complement on begin, whatever that complement is', () => {
    expect(play(BEGIN).run.lives).toBe(STARTING_LIVES);
    expect(play(BEGIN).run.level).toBe(0);
  });

  it('spends exactly one life per death', () => {
    expect(play(BEGIN, PLAY, DIE).run.lives).toBe(STARTING_LIVES - 1);
    expect(play(BEGIN, PLAY, DIE, DIE).run.lives).toBe(STARTING_LIVES - 2);
  });

  it('a death clears the arsenal back to base', () => {
    // 0039's central rule, and the one `docs/game.md` was amended for: "carry forward" means across
    // LEVELS, not across deaths. An arsenal that survived a death would make a run monotonic — the
    // ship only ever gets stronger, and the last level is the easiest thing in the game.
    const before = armed();
    expect(before.run.arsenal, 'the fixture has nothing to lose, so this proves nothing').toEqual(['bomb', 'shield']);
    expect(reduce(before, DIE).run.arsenal, 'the arsenal survived a death').toEqual([]);
  });

  it('clears the arsenal on the LAST death too, so the rule has no hidden condition', () => {
    // It reads as redundant — nobody flies that ship again. It is what keeps the reducer a function
    // of its arguments rather than of what the shell intends to do next.
    let state = armed();
    for (let i = 0; i < STARTING_LIVES; i++) state = reduce(state, DIE);
    expect(state.run.lives).toBe(0);
    expect(state.run.arsenal).toEqual([]);
  });

  it('the last life ends the run', () => {
    let state = play(BEGIN, PLAY);
    for (let i = 0; i < STARTING_LIVES - 1; i++) {
      state = reduce(state, DIE);
      expect(state.screen.current, 'the run ended while lives remained').toBe('playing');
    }
    state = reduce(state, DIE);
    expect(state.run.lives).toBe(0);
    expect(state.screen.current, 'the last life was spent and the game carried on').toBe('gameOver');
  });

  it('lives never go below zero', () => {
    // Nothing should dispatch a death at zero lives, and the reducer is not the place to find out
    // whether anything did: a negative count would propagate into the save schema and into whatever
    // draws a life counter, silently and far from the line that caused it.
    let state = play(BEGIN, PLAY);
    for (let i = 0; i < STARTING_LIVES + 5; i++) state = reduce(state, DIE);
    expect(state.run.lives).toBe(0);
  });

  it('the game over screen does not step, and the playing screen does', () => {
    // The frame reads this row and nothing else — `src/app/frame.ts`'s `stepping`. A game-over
    // overlay above a running game keeps spawning enemies at a corpse.
    expect(SCREENS.gameOver.steps).toBe(false);
    expect(SCREENS.playing.steps).toBe(true);
    expect(SCREENS.title.steps, 'a run begins before the player has touched anything').toBe(false);
  });

  it('again is a new run and not a continue', () => {
    // 0039: a game over ends the run outright. The betrayal this rules out is a "continue" that
    // quietly hands back the arsenal the death was supposed to have cost.
    let state = armed();
    for (let i = 0; i < STARTING_LIVES; i++) state = reduce(state, DIE);
    expect(state.screen.current).toBe('gameOver');
    const again = reduce(reduce(state, BEGIN), PLAY);
    expect(again.run.lives).toBe(STARTING_LIVES);
    expect(again.run.arsenal).toEqual([]);
    expect(again.screen.current).toBe('playing');
  });
});

describe('the root routes and the slices stay strangers', () => {
  it('a screen action leaves the run untouched, by identity', () => {
    // Reference equality rather than deep equality: a reducer that rebuilt an unrelated slice on
    // every action would pass a value comparison and would defeat every `===` check the shell makes.
    const before = play(BEGIN);
    const after = reduce(before, PLAY);
    expect(after.run, 'a screen action rebuilt the run slice').toBe(before.run);
  });

  it('a run action leaves the screen untouched while the run is alive', () => {
    const before = play(BEGIN, PLAY);
    const after = reduce(before, DIE);
    expect(after.screen, 'a survivable death moved the screen').toBe(before.screen);
  });

  it('an action that changes nothing returns the very same state', () => {
    const state = play(BEGIN, PLAY);
    expect(reduce(state, PLAY), 'a no-op dispatch rebuilt the state').toBe(state);
  });

  it('the run-over agreement cannot fire while the player is not playing', () => {
    // The failure it rules out: `begin` stocking three lives and being immediately overwritten by a
    // stale reading of a run that no longer holds. Conditioned on `playing` for exactly this.
    const dead = play(BEGIN, PLAY, DIE, DIE, DIE);
    expect(dead.screen.current).toBe('gameOver');
    expect(reduce(dead, BEGIN).screen.current, 'starting a run re-raised the game over screen').toBe('gameOver');
  });
});

describe('the state survives being saved', () => {
  it('round-trips through JSON with nothing lost', () => {
    /*
      ⚠️ Not a hypothetical: `src/save/` is the next thing after this, and 0017's plain-data rule
      exists because a `Map` comes back from this round trip as `{}` with no error anywhere. The
      source scan in `tests/state-shape.test.ts` bans the containers; this runs the actual trip over
      the actual state, which is the half a scan cannot do.
    */
    const state = armed();
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
