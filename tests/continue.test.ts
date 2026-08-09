import { describe, expect, it } from 'vitest';

import { GameFrame, SHIP_START_ALONG, respawn, scatterUpgrades } from '../src/app/frame.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { INVULN_STEPS } from '../src/content/ships.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import type { Entity } from '../src/sim/entity.ts';
import type { World } from '../src/app/frame.ts';
import { type Action, type State, initialState, reduce } from '../src/state/root.ts';
import { SCREENS, STEPS_PER_SECOND } from '../src/state/screens.ts';
import { livesFor, startingArsenal } from '../src/state/slices/run.ts';
import { playableWorld } from './world.ts';

/**
 * WHAT A NEW RUN RESETS, AND WHAT A CONTINUE KEEPS.
 *
 * `docs/decisions/0067-a-new-run-opens-on-an-empty-field.md` and
 * `docs/decisions/0068-a-run-over-is-a-continue.md`. Both came out of the same play report, and they
 * are two halves of one boundary the game had confused in both directions at once:
 *
 * > *"If you die and end the game, when you restart at level 1, the run is the same run as you were
 * > up to previously, so you can start middle of level 2."*
 *
 * > *"When a player hits continue, the run picks up where it was … the game itself doesn't reset and
 * > restart, but the ship and player stuff does."*
 *
 * ⚠️ **The subject is `src/app/lifecycle.ts`, which exists so that this file can.** These were three
 * closures inside `mount`, reachable only by booting a canvas — so *does a continue reset the level*
 * had no test that could ask it, and `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` cannot
 * break what nothing can reach.
 */

/** The tier the fixtures run at. Nothing here asserts on the numbers it carries — 0039's rule. */
const TIER = DIFFICULTY_KINDS[0]!;

const DIE: Action = { slice: 'run', type: 'lifeLost' };

/**
 * The shell, minus the canvas: a world, the real reducer, and the real lifecycle over both.
 *
 * ⚠️ **The real `reduce`, never a stub.** Half of what a continue does is a cross-slice agreement in
 * `src/state/root.ts` — *a run at zero lives on the playing screen is over* — and a fixture that
 * dispatched into a fake would be the one thing that could not see `resume` fighting it.
 */
function shell(level = LEVELS[LEVEL_KINDS[0]!]) {
  const built = playableWorld(level);
  let current: State = initialState;
  const dispatch = (action: Action): void => {
    current = reduce(current, action);
  };
  return {
    world: built.world,
    dispatch,
    state: (): State => current,
    lifecycle: makeLifecycle(built.world, dispatch, () => current.run),
  };
}

type Shell = ReturnType<typeof shell>;

/**
 * Fly a real stretch of a level and stop with something on the field worth losing.
 *
 * ⚠️ **Fifteen seconds rather than *until the first wave*, and the difference is the point of the
 * whole file.** What a continue promises is measured in the stretch it saves the player flying again
 * — 0027 — and the first wave of level one arrives at about half a second, which is a distance no
 * assertion about *where the run got to* can mean anything at.
 *
 * ⚠️ **A ship that dies is put back, because in the game it is.** The fixture flies nothing
 * (`tests/world.ts` says why), so it is eventually hit — and a wreck riding the rest of the stretch
 * would be measuring a level nobody was playing.
 *
 * ⚠️ **The enemy shot is planted rather than waited for.** Whether the opening waves contain
 * something that fires is a property of `src/content/levels.ts`, and a fixture that stepped until one
 * did would be a guard over the level table wearing this file's name — going quiet the day the
 * opening was retuned.
 */
function intoAFight(built: Shell, seconds = 15): void {
  const frame = new GameFrame(built.world);
  for (let i = 0; i < seconds * STEPS_PER_SECOND; i++) {
    frame.step();
    if (built.world.ship.health <= 0) respawn(built.world);
  }
  for (let i = 0; i < 4000 && built.world.enemies.size === 0; i++) {
    frame.step();
    if (built.world.ship.health <= 0) respawn(built.world);
  }
  expect(built.world.enemies.size, 'no wave ever arrived, so this fixture measures nothing').toBeGreaterThan(0);
  built.world.enemyShots.spawn();
  expect(built.world.enemyShots.size, 'nothing is in the air, so sweeping it proves nothing').toBeGreaterThan(0);
}

/** How far into the level the player has flown, in the seconds they spent flying it. */
function secondsIn(cameraAlong: number): number {
  return cameraAlong / SCROLL_PER_STEP / STEPS_PER_SECOND;
}

/**
 * What a death threw back, told from what a level authored by its lifetime.
 *
 * ⚠️ **`lifeFor > 0` is the marker and it is the only one there is** — 0066 put the whole
 * *scattered or authored* distinction in that one field so the two answers cannot disagree.
 */
function scattered(world: World): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.pickups.size; i++) {
    const item = world.pickups.at(i);
    if (item.lifeFor > 0) out.push(item);
  }
  return out;
}

/**
 * Spend every life the tier grants, the way `mount`'s `onDeath` spends them.
 *
 * ⚠️ **`scatterUpgrades` before the reducer, because that is the order the shell keeps** —
 * `docs/decisions/0066-a-death-scatters-what-it-took.md`. The reducer is what empties the upgrade
 * list, so a fixture that dispatched first would throw nothing back and the continue would have
 * nothing to hand over.
 *
 * ⚠️ **The ship is killed where the player was, which is never where a respawn puts it.** A fixture
 * that died on the start line could not tell a continue that moved the ship back from one that left
 * it wherever it fell.
 */
function dieOutTheRun(built: Shell): void {
  for (let lives = built.state().run.lives; lives > 0; lives--) {
    built.world.ship.along = built.world.cameraAlong + SHIP_START_ALONG + 40;
    built.world.ship.health = 0;
    scatterUpgrades(built.world, built.state().run.upgrades);
    built.dispatch(DIE);
    if (built.state().run.lives > 0) respawn(built.world);
  }
}

describe('a new run opens on an empty field', () => {
  /*
    THE REPORTED ONE — `docs/decisions/0067-a-new-run-opens-on-an-empty-field.md`.

    ⚠️ **Nothing was rewinding and nothing was failing to rewind.** The run's own numbers were always
    right: `begin` put the level back to one and stocked a full complement. What did not reset was
    everything the player could SEE, because the sweep that emptied the field lived in `respawn`, and
    0057 took it out of there for a DEATH — which took it out of a new run at the same moment.
  */
  it('THE REPORTED ONE: a run started from the title does not inherit the last one’s field', () => {
    const built = shell();
    built.lifecycle.begin(TIER);
    intoAFight(built);
    const fought = built.world.enemies.size;

    built.lifecycle.begin(TIER);
    expect(
      built.world.enemies.size,
      `a new run opened on ${fought} enemies from the last one, which is what reads as resuming it`,
    ).toBe(0);
    expect(built.world.enemyShots.size, 'a new run opened under the last one’s bullets').toBe(0);
  });

  it('and starts at the beginning of level one, however deep the last run got', () => {
    const built = shell();
    built.lifecycle.begin(TIER);
    intoAFight(built);
    built.dispatch({ slice: 'run', type: 'levelCleared' });
    built.lifecycle.onward();
    expect(built.state().run.level, 'the fixture never left level one, so this asserts nothing').toBeGreaterThan(0);

    built.lifecycle.begin(TIER);
    expect(built.state().run.level, 'a new run began part-way through the sequence').toBe(0);
    expect(secondsIn(built.world.cameraAlong), 'a new run began part-way through a level').toBe(0);
    expect(built.world.nextWave, 'a new run began part-way through the wave table').toBe(0);
  });

  it('and so does the next level, which is the same rule and the other caller', () => {
    /*
      A level boundary sweeps the field for the same reason a run does: an enemy belongs to the
      level. It broke at the same moment and by the same route, and it is the half a report about
      restarting could not see — it was quietly undoing
      `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md`.
    */
    const built = shell();
    built.lifecycle.begin(TIER);
    intoAFight(built);
    built.lifecycle.onward();
    expect(built.world.enemies.size, 'level two opened on level one’s field').toBe(0);
    expect(built.world.enemyShots.size, 'level two opened under level one’s bullets').toBe(0);
  });
});

describe('a run over is a continue', () => {
  /** A run flown into a fight, upgraded, and then flown out of lives: a run-over screen with a level behind it. */
  function ranOut(): Shell {
    const built = shell();
    built.lifecycle.begin(TIER);
    intoAFight(built);
    built.dispatch({ slice: 'run', type: 'upgraded', upgrade: 'weapon' });
    built.dispatch({ slice: 'run', type: 'upgraded', upgrade: 'weapon' });
    /*
      ⚠️ **Banked past the starting kit, or the restock below cannot be seen** —
      `docs/decisions/0085-a-death-does-not-cost-the-bombs.md`. Until 0085 every death restocked the
      arsenal, so a fixture that reached the run-over screen was already holding exactly what a
      continue was about to hand it and *the continue did not restock the arsenal* was a sentence
      about nothing. A death now carries the charges through, so this is what makes the two arms of
      the reducer distinguishable at all.
    */
    built.dispatch({ slice: 'run', type: 'took', special: 'bomb' });
    dieOutTheRun(built);
    expect(built.state().run.lives, 'the fixture kept a life, so there is no run to continue').toBe(0);
    expect(built.state().screen.current, 'the run ended without raising the run-over screen').toBe('gameOver');
    return built;
  }

  it('says Continue, and the word is the promise', () => {
    /*
      ⚠️ **The label is the only account of this the player ever gets.** *Again* over a resumed level
      is the screen lying about what its own button does, and `docs/game.md`'s *no explanatory
      commentary* means there is nothing else up there to correct the impression.
    */
    expect(SCREENS.gameOver.actions.map((action) => action.label)).toEqual(['Continue']);
    expect(SCREENS.gameOver.steps, 'the run-over screen stopped being a pause').toBe(false);
  });

  it('THE REPORTED ONE: the level carries on from exactly where it stopped', () => {
    const built = ranOut();
    const enemies = built.world.enemies.size;
    const camera = built.world.cameraAlong;
    const wave = built.world.nextWave;
    /*
      ⚠️ **Asserted in the seconds the player has been flying, not in world units** — 0027. What a
      continue promises is *you do not fly this stretch again*, and the honest measure of a stretch is
      how long it took. A fixture a few units past the start line would satisfy every `toBe` below
      while proving nothing about a promise made in minutes.
    */
    expect(
      secondsIn(camera),
      'the fixture barely left the start line, so keeping the level where it was proves nothing',
    ).toBeGreaterThan(10);

    built.lifecycle.resume();

    expect(secondsIn(built.world.cameraAlong), 'the continue put the player back on the start line').toBe(
      secondsIn(camera),
    );
    expect(built.world.nextWave, 'the continue rewound the wave table').toBe(wave);
    expect(built.world.enemies.size, 'the continue swept the field, which is what reads as a restart').toBe(enemies);
    expect(built.state().run.level, 'the continue sent the player back to level one').toBe(0);
    expect(built.state().screen.current, 'the continue did not put the player back in the game').toBe('playing');
  });

  it('restocks the run with everything a fresh one carries', () => {
    /*
      *"They start with the starting stats as if they had started a new run — default lives, shields,
      bombs etc."* Read off `begin`'s own sources rather than written down here, so a tier that moves
      any of them moves this with it — 0039's rule about numbers nobody has played yet.
    */
    const built = ranOut();
    /*
      ⚠️ **The arsenal reaching this screen is BIGGER than a fresh one's, and that is 0085.** The
      restock is a reduction here — the one place in the game where a bomb count goes down without the
      player pressing anything — and it is the half of *"reset on a continue, but not on player
      death"* that the run-over screen owns.
    */
    expect(
      built.state().run.arsenal,
      'the run reached the continue screen with a fresh kit, so restocking it proves nothing',
    ).not.toEqual(startingArsenal());
    built.lifecycle.resume();
    expect(built.state().run.lives, 'the continue did not restock the run').toBe(livesFor(TIER));
    expect(built.state().run.arsenal, 'the continue did not restock the arsenal').toEqual(startingArsenal());
    expect(built.state().run.upgrades, 'the continue handed back the upgrades the last death took').toEqual([]);
    expect(built.state().run.difficulty, 'the continue changed the tier under the player').toBe(TIER);
  });

  it('and the ship is the one a death the run survives would have given them', () => {
    /*
      *"The ship and player stuff does [reset]."* The whole of that is `respawn`, deliberately: a
      continue that put a subtly different ship on the field would be a second description of what a
      fresh ship is, and `docs/decisions/0057-a-death-does-not-rewind-the-level.md` owns the first.
    */
    const built = ranOut();
    const camera = built.world.cameraAlong;
    expect(built.world.ship.health, 'the fixture’s ship is not dead, so being handed one back is not visible').toBe(0);

    built.lifecycle.resume();
    expect(built.world.ship.health, 'the continue handed back the wreck').toBe(built.world.shipRow.health);
    expect(built.world.ship.along - camera, 'the continue left the ship where it fell').toBeCloseTo(
      SHIP_START_ALONG,
      5,
    );
    expect(built.world.ship.invulnFor, 'the continue dropped the player into a live lane unprotected').toBeGreaterThan(
      INVULN_STEPS,
    );
  });

  it('leaves the last death’s scatter where the player can still fly for it', () => {
    /*
      ⚠️ **THE HALF THE ASK WAS MOST SPECIFIC ABOUT**: *"the last death needs to pop out the upgrades
      for them to collect."* It already did — 0066 scatters on EVERY death including the last, which
      read as redundant on the day it landed — and the thing that would have wasted it is a continue
      that swept the field on the way back in. The five-second timer does not run while the run-over
      screen is up, because that screen does not step (`src/state/screens.ts`), so the player gets all
      of it.
    */
    const built = ranOut();
    const before = scattered(built.world);
    expect(before.length, 'the last death scattered nothing, so this measures nothing').toBeGreaterThan(0);
    const life = before.reduce((total, item) => total + item.lifeFor, 0);

    built.lifecycle.resume();
    const after = scattered(built.world);
    expect(after.length, 'the continue swept away what the deaths handed back').toBe(before.length);
    expect(
      after.reduce((total, item) => total + item.lifeFor, 0),
      'the continue spent the scatter’s timer on the pause',
    ).toBe(life);
  });

  it('and never reseeds the level’s own randomness, which is what would make it a new run', () => {
    /*
      A fresh spawn stream mid-level deals the rest of that level a different hand from the one the
      player was already flying through — `docs/decisions/0021-one-stream-per-concern.md`. `begin` and
      `onward` both reseed, because both are the start of a level. This is not one.
    */
    const built = ranOut();
    const rng = built.world.rng;
    built.lifecycle.resume();
    expect(built.world.rng, 'the continue dealt the rest of the level a different hand').toBe(rng);
  });
});
