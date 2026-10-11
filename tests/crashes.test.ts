/**
 * The crashes are counted — `docs/decisions/0592-the-crashes-are-counted.md`, item 1 of
 * [`the-secret-pilots-planned`](../reports/the-secret-pilots-planned-2026-10-11.md).
 *
 * The page asked for a pilot who opens after *"10 non-bullet deaths"*, and another after *"x
 * customisations"*. Neither was a thing the game kept. This holds the two counts and the lock that reads
 * them, before any pilot names either — so a player's crashes are being counted before the weasel
 * arrives.
 *
 * ⚠️ **THROUGH THE REAL COLLISION, NEVER BY WRITING ZERO INTO `health`.** What is under test is which
 * pairing landed the last hit, and a fixture that reached past the pairings could not see the order they
 * run in — the same reason `tests/death.test.ts` gives for its own fixture.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { GOLFERS, lockOpen, type PilotLock, type PilotRecord } from '../src/content/golfers.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { OWNABLES, WARES } from '../src/content/wares.ts';
import { hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { reset } from '../src/sim/entity.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { STEPS_PER_SECOND, lockHint } from '../src/state/screens.ts';
import { initialHangar, pilotRecord, waresBought } from '../src/state/slices/hangar.ts';
import type { DeathCause } from '../src/state/slices/run.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';

/** Every loop's ceiling — a test may not loop on a condition the code under test owns (0079). */
const A_WHILE = 10 * STEPS_PER_SECOND;

/** A level with nothing in it but a corridor whose faces stand at 20 and 80 — `tests/stone.test.ts`'s. */
const WALLED: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 3000,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'sentinel',
  theme: 'approach',
  corridor: { centre: 50, width: 60, wall: 'roomWall', passages: [] },
};

/**
 * Fly `world` until its ship has come apart and the life is reported spent, planting `plant` whenever the
 * ship can be hit, and say what the report named.
 */
function causeOf(world: World, plant: (world: World) => void): DeathCause {
  const frame = new GameFrame(world);
  let said: DeathCause | null = null;
  world.onDeath = (cause): void => {
    said = cause;
  };
  // Held off, so nothing the ship fires can take a planted body away before it lands.
  world.fireIn = Number.MAX_SAFE_INTEGER;
  world.missileIn = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < A_WHILE && said === null; i++) {
    if (world.shipPool.size > 0 && world.ship.invulnFor === 0) plant(world);
    frame.step();
  }
  if (said === null) throw new Error('the ship never died, or its death was never reported — the fixture is not measuring what it says it is');
  return said;
}

/** An enemy shot planted just ahead of the ship, closing on it. */
function shotAt(world: World): void {
  if (world.enemyShots.size > 0) return;
  const shot = world.enemyShots.spawn()!;
  reset(shot, world.ship.along + 6, world.ship.across, SHOTS.spit);
  shot.velAlong = -SHOTS.spit.speed + world.scrollPerStep;
}

/** An enemy planted on the ship, riding the camera and holding its fire. */
function bodyOn(world: World): void {
  if (world.enemies.size > 0) return;
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along, world.ship.across, ENEMIES.drifter);
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = world.scrollPerStep;
}

describe('0592 — the frame says what emptied the hull', () => {
  it('a life lost to an enemy shot is fire', () => {
    expect(causeOf(playableWorld(NO_LEVEL).world, shotAt)).toBe('fire');
  });

  it('a life lost to flying into an enemy is a body', () => {
    expect(causeOf(playableWorld(NO_LEVEL).world, bodyOn)).toBe('body');
  });

  it('and a life lost to the stone is a body too', () => {
    const built = playableWorld(WALLED);
    built.stick.across = -1;
    expect(causeOf(built.world, () => {})).toBe('body');
  });
});

/** A run begun on Legendary Pilot in the fighter, and on the screen it is flown on. */
function flying(): State {
  let state = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'legendary', ship: 'fighter', credits: 'free' });
  state = reduce(state, { slice: 'screen', type: 'show', screen: 'playing' });
  return state;
}

describe('0592 — a crash is counted for good', () => {
  it('a life lost to a body is one crash, and one lost to fire is none', () => {
    const state = flying();
    expect(reduce(state, { slice: 'run', type: 'lifeLost', cause: 'body' }).hangar.crashes).toBe(1);
    expect(reduce(state, { slice: 'run', type: 'lifeLost', cause: 'fire' }).hangar.crashes).toBe(0);
  });

  it('the life that ends the run is a crash like any other', () => {
    // Asked of the rule below: *"does that mean the players final death at game over will never count?"*
    let state = flying();
    for (let i = 0; i < 100 && state.run.lives > 1; i++) state = reduce(state, { slice: 'run', type: 'lifeLost', cause: 'fire' });
    expect(state.run.lives).toBe(1);
    const last = reduce(state, { slice: 'run', type: 'lifeLost', cause: 'body' });
    expect(last.run.lives, 'that was not the last life').toBe(0);
    expect(last.screen.current, 'the run did not end on it').not.toBe('playing');
    expect(last.hangar.crashes, 'the death that ended the run was not counted').toBe(1);
  });

  it('only a life the run spent is a crash: a report at nought lives counts nothing', () => {
    let state = flying();
    for (let i = 0; i < 100 && state.run.lives > 0; i++) state = reduce(state, { slice: 'run', type: 'lifeLost', cause: 'fire' });
    expect(state.run.lives).toBe(0);
    expect(reduce(state, { slice: 'run', type: 'lifeLost', cause: 'body' }).hangar.crashes).toBe(0);
  });

  it('and a new run takes none back', () => {
    let state = reduce(flying(), { slice: 'run', type: 'lifeLost', cause: 'body' });
    state = reduce(state, { slice: 'run', type: 'begin', difficulty: 'legendary', ship: 'caddie', credits: 'free' });
    expect(state.hangar.crashes).toBe(1);
  });

  it('is kept between visits, and a document written before it reads as none', () => {
    const crashed = { ...initialHangar, crashes: 7 };
    expect(hangarFrom(serialiseHangar(crashed), initialHangar).crashes).toBe(7);
    const before = JSON.parse(serialiseHangar(crashed)) as Record<string, unknown>;
    delete before.crashes;
    expect(hangarFrom(JSON.stringify(before), initialHangar).crashes).toBe(0);
    for (const bad of [-1, 2.5, '3', null]) {
      expect(hangarFrom(JSON.stringify({ ...before, crashes: bad }), initialHangar).crashes, `read ${JSON.stringify(bad)}`).toBe(0);
    }
  });
});

describe('0592 — what has been bought is counted off what is owned', () => {
  it('nothing is bought on a first visit, whatever is free', () => {
    expect(waresBought(initialHangar)).toBe(0);
  });

  it('every ware bought is one, and nothing free counts', () => {
    let state = initialState;
    state = reduce(state, { slice: 'hangar', type: 'earned', shards: 1_000_000 });
    const [first, second] = WARES;
    state = reduce(state, { slice: 'hangar', type: 'bought', ware: first! });
    expect(waresBought(state.hangar)).toBe(1);
    state = reduce(state, { slice: 'hangar', type: 'bought', ware: second! });
    expect(waresBought(state.hangar)).toBe(2);
    const free = Object.keys(OWNABLES).filter((k) => OWNABLES[k as keyof typeof OWNABLES].price === null);
    expect(free.length, 'nothing is free, so this proves nothing').toBeGreaterThan(0);
    for (const kind of free) expect(state.hangar.owned[kind as keyof typeof OWNABLES], kind).toBe(true);
  });
});

describe('0592 — a lock may name the two counts, and the band says what is left', () => {
  const NOBODY: PilotRecord = pilotRecord(initialHangar);
  const lock: PilotLock = { after: [], crashes: 10, bought: 5 };

  it('is shut until every part is met, and open the moment the last one is', () => {
    expect(lockOpen(lock, NOBODY)).toBe(false);
    expect(lockOpen(lock, { ...NOBODY, crashes: 10, bought: 4 })).toBe(false);
    expect(lockOpen(lock, { ...NOBODY, crashes: 9, bought: 5 })).toBe(false);
    expect(lockOpen(lock, { ...NOBODY, crashes: 10, bought: 5 })).toBe(true);
    expect(lockOpen(lock, { ...NOBODY, crashes: 40, bought: 12 })).toBe(true);
  });

  it('the hint counts down what is left, and is gone once the lock is met', () => {
    expect(lockHint(lock, NOBODY, 'Unity')).toBe('Lose 10 more lives to a crash and buy 5 more things at Cosmo’s to fly Unity');
    expect(lockHint(lock, { ...NOBODY, crashes: 9, bought: 4 }, 'Unity')).toBe('Lose 1 more life to a crash and buy 1 more thing at Cosmo’s to fly Unity');
    expect(lockHint(lock, { ...NOBODY, crashes: 10, bought: 2 }, 'Unity')).toBe('Buy 3 more things at Cosmo’s to fly Unity');
    expect(lockHint(lock, { ...NOBODY, crashes: 10, bought: 5 }, 'Unity')).toBe(null);
  });

  it('a lock of nothing is open from the first run, as the four starting pilots’ are', () => {
    for (const kind of ['feather', 'woo', 'larry', 'bo'] as const) expect(lockOpen(GOLFERS[kind].opens, NOBODY), kind).toBe(true);
  });
});
