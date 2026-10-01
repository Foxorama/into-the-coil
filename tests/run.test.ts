import { describe, expect, it } from 'vitest';

import { type Action, type State, initialState, reduce } from '../src/state/root.ts';
import { DEFAULT_DIFFICULTY, chargesIn, initialRun, livesFor, startingArsenal } from '../src/state/slices/run.ts';
import { SCREENS } from '../src/state/screens.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import { SHIPS, SHIP_KINDS, type ShipKind } from '../src/content/ships.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { OPENING_CHARGES, SIDES, SPECIALS, SPECIAL_KINDS } from '../src/content/specials.ts';
import { UPGRADE_TIERS } from '../src/content/pickups.ts';
import { GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';

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

/**
 * The ship the fixtures fly — 0441. **Not the one a run that has not begun carries**, so a death or a
 * continue that put the default ship back is a different answer from keeping this one.
 */
const SHIP: ShipKind = SHIP_KINDS.find((kind) => kind !== initialRun.ship)!;
const BEGIN: Action = { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY, ship: SHIP };

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
    { slice: 'run', type: 'took', special: 'hunt' },
    // On the OTHER tube, not the ship's own: a fixture on the base kind could not see a death or a
    // continue putting it back to the base. `npm run prove` said so. The gun's ladder went with 0441.
    { slice: 'run', type: 'upgraded', upgrade: 'missile', kind: 'homing' },
    { slice: 'run', type: 'upgraded', upgrade: 'missile', kind: 'homing' },
  );
}

describe('a run is lives', () => {
  it('starts on the splash, and the intro after it hands over to the title, with no run in progress', () => {
    // 0415: the page opens on the splash, which gives way to the golfers; the intro a pick plays ends
    // on the title by its own clock — `SCREENS.intro.timeout`, 0411.
    expect(initialState.screen.current).toBe('splash');
    expect(SCREENS.intro.timeout?.then).toBe('title');
    // Zero rather than a full complement, so `begin` is the only way into a run — a state that was
    // already stocked would let a stray dispatch drop the player into a half-run.
    expect(initialState.run.lives).toBe(0);
    expect(chargesIn(initialState.run.arsenal)).toBe(0);
  });

  it('stocks a full complement on begin, whatever that complement is', () => {
    expect(play(BEGIN).run.lives).toBe(STARTING_LIVES_OF_THE_TIER);
    expect(play(BEGIN).run.level).toBe(0);
  });

  it('spends exactly one life per death', () => {
    expect(play(BEGIN, PLAY, DIE).run.lives).toBe(STARTING_LIVES_OF_THE_TIER - 1);
    expect(play(BEGIN, PLAY, DIE, DIE).run.lives).toBe(STARTING_LIVES_OF_THE_TIER - 2);
  });

  it('a death costs the life and nothing else: both ladders, both kinds and the arsenal stay', () => {
    /*
      ⚠️ **THIS ASSERTION HAS INVERTED FOUR TIMES, AND EVERY TIME WITH A DECISION.** 0085 kept the
      arsenal, 0256 kept all but a rung, 0266 took the ladders and threw them back, and
      `docs/decisions/0372-a-death-keeps-the-ladders.md` keeps everything: *"you don't lose power ups
      on death or continue, you keep the level you had."* A guard tied to a decision inverts when the
      decision does; the alternative is a guard loose enough to hold neither.
    */
    const before = armed();
    expect(before.run.arsenal.tubes, 'the fixture has nothing to lose, so this proves nothing').toEqual(['hunt']);
    expect(before.run.arsenal.gun.at(-1), 'the bomb taken is not on top of the gun stack').toBe('bomb');
    expect(
      chargesIn(before.run.arsenal),
      'the fixture never banked a charge, so a death cannot be seen to spare one',
    ).toBeGreaterThan(chargesIn(startingArsenal(SHIP, DEFAULT_DIFFICULTY)));
    expect(before.run.upgrades, 'the fixture has no upgrades to lose, so this proves half of nothing').toEqual([
      'missile',
      'missile',
    ]);
    expect(before.run.ship, 'the fixture flies the default ship, so a death putting it back would not show').not.toBe(
      initialRun.ship,
    );
    expect(SHIPS[SHIP].missile, 'the fixture took its ship’s own tube, so a death putting it back would not show').not.toBe(
      before.run.missile,
    );

    const after = reduce(before, DIE);
    expect(after.run.arsenal, 'a death moved the arsenal').toEqual(before.run.arsenal);
    /*
      ⚠️ **And it is not the starting kit either, which is the half a `toEqual(before)` alone would
      not say.** The old rule and the new one agree about a run that never banked anything; the fixture
      is armed past the starting kit precisely so the two answers are different objects.
    */
    expect(after.run.arsenal, 'a death restocked the arsenal to the starting kit').not.toEqual(startingArsenal(SHIP, DEFAULT_DIFFICULTY));
    // On the OTHER tube, so a death that put the base tube back is a different answer from this one.
    expect(after.run.upgrades, 'a death took rungs off a ladder').toEqual(before.run.upgrades);
    expect(after.run.ship, 'a death changed the ship').toBe(SHIP);
    expect(after.run.missile, 'a death put the base tube back on the ship').toBe('homing');
  });

  it('and on the LAST death too, so the rule has no hidden condition', () => {
    // It reads as redundant — nobody flies that ship again until the continue. It is what keeps the
    // reducer a function of its arguments rather than of what the shell intends to do next.
    let state = armed();
    const carried = state.run;
    for (let i = 0; i < STARTING_LIVES_OF_THE_TIER; i++) state = reduce(state, DIE);
    expect(state.run.lives).toBe(0);
    expect(state.run.arsenal, 'the last death emptied the arsenal').toEqual(carried.arsenal);
    expect(state.run.upgrades, 'the last death took the ladders').toEqual(carried.upgrades);
  });

  it('a pickup of another kind switches the kind and keeps the count — 0256', () => {
    /*
      *"Picking up a new weapon/missile type doesn't reset your power count → it's too punishing when
      you accidentally get a pickup with a lot of enemies on screen or right before a boss."* 0233
      started the new kind at one rung; the ladder is the ship's now and the kind is what it is
      fitted to. Held at the cap too — where a switch adds nothing and the list stays the tier.

      ⚠️ **The gun's half was deleted with 0441** (`docs/decisions/0441-a-pilot-flies-their-own-ship.md`):
      the gun is the ship's and nothing switches it, so the tubes are the one ladder this can hold.
    */
    let state = play(BEGIN, PLAY);
    for (let i = 0; i < UPGRADE_TIERS - 1; i++) {
      state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'missile', kind: 'straight' });
    }
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'missile', kind: 'homing' });
    expect(state.run.missile, 'the run did not switch tubes').toBe('homing');
    expect(state.run.upgrades.length, 'a tube switch reset the count').toBe(UPGRADE_TIERS);
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'missile', kind: 'straight' });
    expect(state.run.missile).toBe('straight');
    expect(state.run.upgrades.length, 'a switch at the cap grew the list past the tier').toBe(UPGRADE_TIERS);
    expect(state.run.ship, 'a tube pickup changed the ship').toBe(SHIP);
  });

  it('a run begins in the ship it is given, on OPENING_CHARGES of that ship’s own gun special — 0441', () => {
    /*
      *"A game starts with two bombs"*, a bomb being what the ask calls every gun's special. Over every
      ship, so a ship whose special sits on the other trigger, or whose gun opens on somebody else's
      special, is a different answer — 0282: the opening differs per ship.
    */
    for (const ship of SHIP_KINDS) {
      const run = play({ slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY, ship }).run;
      expect(run.ship, `a run begun in the ${ship} flies something else`).toBe(ship);
      expect(run.missile, `the ${ship} opened on somebody else's tube`).toBe(SHIPS[ship].missile);
      const own = WEAPONS[SHIPS[ship].weapon].special;
      const side = SPECIALS[own].side;
      expect(run.arsenal[side], `the ${ship} did not open on ${OPENING_CHARGES} of its own ${own}`).toEqual(
        Array.from({ length: OPENING_CHARGES }, () => own),
      );
      for (const other of SIDES) {
        if (other !== side) expect(run.arsenal[other], `the ${ship} opened with something on its ${other} trigger`).toEqual([]);
      }
    }
  });

  it('every golfer flies a ship, and every ship has a golfer to fly it — 0441', () => {
    /*
      *"Each pilot has their own ship."* The run begins in the chosen golfer's ship (`src/app/mount.ts`
      resolves the pilot setting to `GOLFERS[pilot].ship`), so a golfer naming no ship is a run that
      cannot begin, and a ship no golfer names is one nobody can fly.

      ⚠️ **NOT *no two golfers share a ship*, though the four do not today.** 0441 says why the ship is
      on the golfer's row: *"so a fifth golfer can be given a ship that already exists."* That change
      is correct and a distinctness guard would redden on it — 0192's test for a guard. Every ship
      flown is what the four distinct ships rest on, and it stays true when the fifth golfer arrives.
    */
    for (const golfer of GOLFER_KINDS) {
      expect(SHIP_KINDS, `${golfer} flies a ship that is not on the roster`).toContain(GOLFERS[golfer].ship);
    }
    for (const ship of SHIP_KINDS) {
      expect(
        GOLFER_KINDS.filter((golfer) => GOLFERS[golfer].ship === ship),
        `no golfer flies the ${ship}`,
      ).not.toEqual([]);
    }
  });

  it('a take pushes exactly one charge of what was taken, on its own side — 0441', () => {
    // *"A player can pick up any type and get a bomb of that type."* One a take, of every kind:
    // 0373's per-row `charges` went with 0441.
    for (const special of SPECIAL_KINDS) {
      const before = play(BEGIN, PLAY).run.arsenal;
      const after = reduce(play(BEGIN, PLAY), { slice: 'run', type: 'took', special }).run.arsenal;
      const side = SPECIALS[special].side;
      expect(after[side], `a ${special} take did not push exactly one charge`).toEqual([...before[side], special]);
      for (const other of SIDES) {
        if (other !== side) expect(after[other], `a ${special} take moved the ${other} stack`).toEqual(before[other]);
      }
    }
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
    expect(again.run.arsenal).toEqual(startingArsenal(SHIP, DEFAULT_DIFFICULTY));
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

  it('refills the lives and keeps everything the run was carrying', () => {
    /*
      ⚠️ **The lives against `begin`, and the rest against the run that ran out** —
      `docs/decisions/0372-a-death-keeps-the-ladders.md`: *"keep them all."* 0068 and 0085 sent a
      continue back to the starting kit with no upgrades, which this fixture would read as a
      different arsenal and an empty list.
    */
    const fresh = play(BEGIN).run;
    const before = ranOutDeep().run;
    const resumed = reduce(ranOutDeep(), CONTINUE).run;
    expect(resumed.lives, 'the continue did not restock the lives').toBe(fresh.lives);
    expect(resumed.arsenal, 'the continue reset the charges').toEqual(before.arsenal);
    expect(resumed.arsenal, 'the fixture holds the starting kit, so a reset would look the same').not.toEqual(
      startingArsenal(SHIP, DEFAULT_DIFFICULTY),
    );
    expect(resumed.upgrades, 'the continue took the ladders').toEqual(before.upgrades);
    expect(resumed.ship, 'the continue changed the ship').toBe(before.ship);
    expect(resumed.missile, 'the continue put the base tube back').toBe(before.missile);
  });

  it('carries the tier rather than re-choosing it', () => {
    // A property of the RUN (0047), and this is still the same run. A continue that dropped the
    // player onto the default tier would be the game quietly changing the game.
    for (const difficulty of DIFFICULTY_KINDS) {
      let state = reduce(play({ slice: 'run', type: 'begin', difficulty, ship: SHIP }), PLAY);
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
    // Carried forward and NOT paid into — 0372 took away 0053's *"gains one per level cleared."*
    expect(after.run.arsenal, 'clearing a level moved the arsenal').toEqual(before.run.arsenal);
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
    // Into the finale, which expires into the victory screen — 0418.
    expect(state.screen.current, 'the last level was cleared and the run carried on').toBe('outro');
    expect(SCREENS.outro.timeout?.then, 'the finale does not end on the victory screen').toBe('victory');
  });

  it('starting again after a victory goes back to the first level', () => {
    let state = play(BEGIN, PLAY);
    for (let i = 0; i < LEVEL_KINDS.length; i++) state = reduce(state, CLEAR);
    state = reduce(reduce(state, SHOW_CLEARED), BEGIN);
    expect(state.run.level, 'a new run resumed where the last one finished').toBe(0);
    expect(state.screen.current, 'starting a run re-raised the finale').toBe('outro');
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
