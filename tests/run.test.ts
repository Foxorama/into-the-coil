import { describe, expect, it } from 'vitest';

import { type Action, type State, initialState, reduce } from '../src/state/root.ts';
import { DEFAULT_DIFFICULTY, livesFor, startingArsenal } from '../src/state/slices/run.ts';
import { SCREENS } from '../src/state/screens.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';

/**
 * WHAT A RUN COSTS — `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`.
 *
 * The reducer is pure, so the whole of a run's shape is testable here with no canvas, no browser and
 * no clock. That is the entire value of the layer — `docs/decisions/0015-the-layer-ladder.md` grants
 * `state` no capabilities at all, precisely so this file can exist.
 *
 * ⚠️ **Nothing here asserts on how many lives a tier grants.** It is a play-test number, on the same terms
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

const BEGIN: Action = { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY };

/** Lives the tier BEGIN picks starts with. Read from the table, never written down here. */
const STARTING_LIVES_OF_THE_TIER = livesFor(DEFAULT_DIFFICULTY);
const PLAY: Action = { slice: 'screen', type: 'show', screen: 'playing' };
const DIE: Action = { slice: 'run', type: 'lifeLost' };

/**
 * A run in progress with something to lose — in BOTH of the places a death empties.
 *
 * ⚠️ **The upgrades half was added because `npm run prove` caught its absence.** Without them, a
 * break that left the weapon upgrades on the ship through a death kept the whole suite green: the
 * assertion below read the arsenal and nothing read the field beside it.
 */
function armed(): State {
  return play(
    BEGIN,
    PLAY,
    { slice: 'run', type: 'took', special: 'bomb' },
    { slice: 'run', type: 'took', special: 'mines' },
    { slice: 'run', type: 'upgraded', upgrade: 'weapon' },
    { slice: 'run', type: 'upgraded', upgrade: 'weapon' },
  );
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
    expect(play(BEGIN).run.lives).toBe(STARTING_LIVES_OF_THE_TIER);
    expect(play(BEGIN).run.level).toBe(0);
  });

  it('spends exactly one life per death', () => {
    expect(play(BEGIN, PLAY, DIE).run.lives).toBe(STARTING_LIVES_OF_THE_TIER - 1);
    expect(play(BEGIN, PLAY, DIE, DIE).run.lives).toBe(STARTING_LIVES_OF_THE_TIER - 2);
  });

  it('a death costs the upgrades and leaves the arsenal exactly where it was', () => {
    /*
      ⚠️ **THIS ASSERTION IS THE INVERSE OF THE ONE IT REPLACES, AND THAT IS CORRECT** —
      `docs/decisions/0085-a-death-does-not-cost-the-bombs.md`. It used to read *the arsenal survived a
      death* as a failure message, on 0039's rule that a death goes back to the starting kit. Reported
      from play: *"bombs should be reset on a continue, but not on player death."* A guard tied to a
      decision inverts when the decision does; the alternative is a guard loose enough to hold neither.

      **What 0039 still owns is the other field.** *"Back to the ship's base weapon and starting
      special"* is two halves, and a death now costs the first — the upgrades — and not the second.
    */
    const before = armed();
    expect(
      before.run.arsenal.map((entry) => entry.kind),
      'the fixture has nothing to lose, so this proves nothing',
    ).toEqual(['bomb', 'mines']);
    expect(
      before.run.arsenal[0]!.charges,
      'the fixture never banked a charge, so a death cannot be seen to spare one',
    ).toBeGreaterThan(startingArsenal()[0]!.charges);
    expect(before.run.upgrades, 'the fixture has no upgrades to lose, so this proves half of nothing').toEqual([
      'weapon',
      'weapon',
    ]);

    const after = reduce(before, DIE);
    expect(after.run.arsenal, 'a death moved the arsenal').toEqual(before.run.arsenal);
    /*
      ⚠️ **And it is not the starting kit either, which is the half a `toEqual(before)` alone would
      not say.** The old rule and the new one agree about a run that never banked anything; the fixture
      is armed past the starting kit precisely so the two answers are different objects.
    */
    expect(after.run.arsenal, 'a death restocked the arsenal to the starting kit').not.toEqual(startingArsenal());
    /*
      ⚠️ **Both fields, because "back to the ship's base weapon and starting special" is two fields.**
      `docs/decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md` made the base weapon
      exactly what an empty upgrade list resolves to, so this line is what makes that sentence true
      rather than aspirational.
    */
    expect(after.run.upgrades, 'the weapon upgrades survived a death').toEqual([]);
  });

  it('and takes nothing back on the LAST death either, so the rule has no hidden condition', () => {
    // It reads as redundant — nobody flies that ship again. It is what keeps the reducer a function
    // of its arguments rather than of what the shell intends to do next. 0085 kept the shape of that
    // argument and changed what the answer is: the charges reach the run-over screen intact, and
    // `continued` is the one thing in the reducer that puts them back to the starting kit.
    let state = armed();
    const carried = state.run.arsenal;
    for (let i = 0; i < STARTING_LIVES_OF_THE_TIER; i++) state = reduce(state, DIE);
    expect(state.run.lives).toBe(0);
    expect(state.run.arsenal, 'the last death emptied what the continue screen is about to restock').toEqual(carried);
  });

  it('the last life ends the run', () => {
    let state = play(BEGIN, PLAY);
    for (let i = 0; i < STARTING_LIVES_OF_THE_TIER - 1; i++) {
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
    for (let i = 0; i < STARTING_LIVES_OF_THE_TIER + 5; i++) state = reduce(state, DIE);
    expect(state.run.lives).toBe(0);
  });

  it('the game over screen does not step, and the playing screen does', () => {
    // The frame reads this row and nothing else — `src/app/frame.ts`'s `stepping`. A game-over
    // overlay above a running game keeps spawning enemies at a corpse.
    expect(SCREENS.gameOver.steps).toBe(false);
    expect(SCREENS.playing.steps).toBe(true);
    expect(SCREENS.title.steps, 'a run begins before the player has touched anything').toBe(false);
  });

  it('a begin is a new run and never a continue', () => {
    // 0039: a game over ends the run outright. The betrayal this rules out is a "continue" that
    // quietly hands back the arsenal the death was supposed to have cost.
    //
    // ⚠️ **There IS a continue now — `docs/decisions/0068-a-run-over-is-a-continue.md` — and it does
    // not undo this.** It restocks the run to what a fresh one carries and leaves the LEVEL alone,
    // which is a different action with a different name; what a death cost is still gone.
    let state = armed();
    for (let i = 0; i < STARTING_LIVES_OF_THE_TIER; i++) state = reduce(state, DIE);
    expect(state.screen.current).toBe('gameOver');
    const again = reduce(reduce(state, BEGIN), PLAY);
    expect(again.run.lives).toBe(STARTING_LIVES_OF_THE_TIER);
    expect(again.run.arsenal).toEqual(startingArsenal());
    expect(again.screen.current).toBe('playing');
  });
});

/**
 * A CONTINUE — `docs/decisions/0068-a-run-over-is-a-continue.md`.
 *
 * The world half is in `tests/continue.test.ts`, where the field is. What is here is the half a pure
 * reducer can answer: a continue is `begin` with the level left where it was, and nothing else.
 */
describe('a run over is a continue', () => {
  const CONTINUE: Action = { slice: 'run', type: 'continued' };

  /** A run that has reached the second level and then run out of lives on it. */
  function ranOutDeep(): State {
    let state = reduce(armed(), { slice: 'run', type: 'levelCleared' });
    expect(state.run.level, 'the fixture never left level one, so keeping the level proves nothing').toBeGreaterThan(0);
    for (let i = 0; i < STARTING_LIVES_OF_THE_TIER; i++) state = reduce(state, DIE);
    expect(state.screen.current).toBe('gameOver');
    return state;
  }

  it('THE POINT OF IT: the level does not move', () => {
    const before = ranOutDeep();
    expect(reduce(before, CONTINUE).run.level, 'the continue sent the player back to the first level').toBe(
      before.run.level,
    );
  });

  it('and everything else goes back to what a run starts with', () => {
    /*
      ⚠️ **Compared against `begin` rather than against written-down numbers**, which is what makes
      this hold at any tier and against any later change to what a run opens with. The rule is *a
      continue is a begin that does not move the level*, and a comparison is the only way to state a
      rule about one action in terms of another.
    */
    const fresh = play(BEGIN).run;
    const resumed = reduce(ranOutDeep(), CONTINUE).run;
    expect(resumed.lives, 'the continue did not restock the run').toBe(fresh.lives);
    expect(resumed.arsenal, 'the continue did not restock the arsenal').toEqual(fresh.arsenal);
    expect(resumed.upgrades, 'the continue handed back what the last death took').toEqual(fresh.upgrades);
  });

  it('carries the tier rather than re-choosing it', () => {
    // A property of the RUN (0047), and this is still the same run. A continue that dropped the
    // player onto the default tier would be the game quietly changing the game.
    for (const difficulty of DIFFICULTY_KINDS) {
      let state = reduce(play({ slice: 'run', type: 'begin', difficulty }), PLAY);
      for (let i = 0; i < livesFor(difficulty); i++) state = reduce(state, DIE);
      const resumed = reduce(state, CONTINUE).run;
      expect(resumed.difficulty, `a continue on ${difficulty} changed the tier`).toBe(difficulty);
      expect(resumed.lives, `a continue on ${difficulty} restocked somebody else's complement`).toBe(
        livesFor(difficulty),
      );
    }
  });

  it('and the screen may follow it back into the game without bouncing', () => {
    /*
      ⚠️ **THE ORDER IS THE WHOLE OF THIS, and the other one is an infinite loop.** `src/state/root.ts`
      raises the run-over screen for a run at zero lives on the playing screen — so `show playing`
      dispatched before the restock would be read at zero and would put the run-over screen straight
      back up. The button would do nothing, and would do it every time it was pressed.
    */
    const restocked = reduce(ranOutDeep(), CONTINUE);
    expect(reduce(restocked, PLAY).screen.current, 'the continue bounced off the agreement it has to pass').toBe(
      'playing',
    );

    const backwards = reduce(reduce(ranOutDeep(), PLAY), CONTINUE);
    expect(backwards.screen.current, 'the wrong order stopped being wrong, so the rule above is unenforced').toBe(
      'gameOver',
    );
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

describe('a run is a sequence of levels', () => {
  const CLEAR: Action = { slice: 'run', type: 'levelCleared' };
  const SHOW_CLEARED: Action = { slice: 'screen', type: 'show', screen: 'cleared' };

  it('carries everything forward across a level boundary', () => {
    // `docs/game.md`'s "carry forward" as amended by 0039: across LEVELS, not across deaths. This is
    // the boundary, and it is the one place that sentence is actually true or false.
    const before = armed();
    const after = reduce(before, CLEAR);
    expect(after.run.level).toBe(before.run.level + 1);
    expect(after.run.lives, 'clearing a level cost a life').toBe(before.run.lives);
    /*
      ⚠️ **Carried forward AND paid into.** 0039's *carry forward* is the floor: nothing may be lost
      at a boundary. 0053 adds the ask's *"gains one per level cleared"*, so what is asserted is that
      every special the run owned is still owned and every one of them is one use richer.
    */
    expect(
      after.run.arsenal.map((entry) => entry.kind),
      'clearing a level emptied the arsenal',
    ).toEqual(before.run.arsenal.map((entry) => entry.kind));
    expect(
      after.run.arsenal.map((entry) => entry.charges),
      'clearing a level did not pay the arsenal',
    ).toEqual(before.run.arsenal.map((entry) => entry.charges + 1));
    expect(after.run.upgrades, 'clearing a level took the weapon upgrades').toEqual(before.run.upgrades);
  });

  it('a level cleared with more still to come is not the end of the run', () => {
    let state = play(BEGIN, PLAY, CLEAR);
    state = reduce(state, SHOW_CLEARED);
    expect(state.screen.current, 'the run ended with levels still unplayed').toBe('cleared');
  });

  it('a level cleared past the last one IS the end of the run', () => {
    /*
      ⚠️ **The rule that used to live in `src/app/mount.ts` and could only be reached by mounting a
      canvas.** A level ending and a run ending are one comparison apart, and inverting it is the
      kind of edit that looks right in review.

      Driven against `LEVEL_KINDS.length` rather than a literal, so authoring a third level does not
      make this go red for the wrong reason.
    */
    let state = play(BEGIN, PLAY);
    for (let i = 0; i < LEVEL_KINDS.length; i++) state = reduce(state, CLEAR);
    state = reduce(state, SHOW_CLEARED);
    expect(state.run.level).toBe(LEVEL_KINDS.length);
    expect(state.screen.current, 'the last level was cleared and the run carried on').toBe('victory');
  });

  it('starting again after a victory goes back to the first level', () => {
    let state = play(BEGIN, PLAY);
    for (let i = 0; i < LEVEL_KINDS.length; i++) state = reduce(state, CLEAR);
    state = reduce(reduce(state, SHOW_CLEARED), BEGIN);
    expect(state.run.level, 'a new run resumed where the last one finished').toBe(0);
    expect(state.screen.current, 'starting a run re-raised the victory screen').toBe('victory');
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
