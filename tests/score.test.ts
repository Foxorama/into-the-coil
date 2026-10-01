import { describe, expect, it } from 'vitest';
import { GameFrame, resetCreditScore, resetLevelScore } from '../src/app/frame.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { BONUSES, MULTIPLIER_CAP, STREAK_STEP, bonusFor, multiplierFor, rankFor, tallyOf } from '../src/content/score.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { bankedBonus, bankedScore } from '../src/state/slices/run.ts';
import { boardLines, entryOf, levelSheet, overSheet, runSheet, tallyAtClear } from '../src/app/score.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The ship a run begins in — 0441. Nothing here reads it, so it is the default pilot's. */
const SHIP = initialState.run.ship;

/**
 * THE SCORE IS KEPT — `docs/decisions/0428-the-score-is-kept.md`.
 *
 * Asked for: *"increasing streak when you don't get hit - a shield taking a hit counts as a hit and
 * resets the counter. end of level splash screen showing points gained, rank for the level, bonus
 * points based on number of shields still held, number of bombs still held, number of missile
 * powerups still held. each level should show total for that level and total overall score."*
 *
 * ⚠️ **Held through the real frame, with the real rows.** The count is the frame's (a kill, a hit, a
 * body sent), the banking is the run's, and the account is the shell's; each is asked here where it
 * lives, and the picture of it is `tests/hud.browser.test.ts`'s.
 */

/** A line of drifters straight up the lane the ship holds, and nothing else. */
const DRIFTERS = (count: number): LevelRow => ({
  waves: [{ at: 300, enemy: 'drifter', formation: 'line', count, lane: 50 }],
  pickups: [],
  landmarks: [],
  bossAt: Number.POSITIVE_INFINITY,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'sentinel',
  theme: 'approach',
});

/** What `kills` kills with no hit between them are worth, one row's points each. */
function worth(points: number, kills: number, from = 0): number {
  let sum = 0;
  for (let s = from + 1; s <= from + kills; s++) sum += points * multiplierFor(s);
  return sum;
}

describe('0428 — what a kill is worth, and what a streak multiplies', () => {
  it('the multiplier climbs a step every STREAK_STEP kills and stops at the cap', () => {
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(STREAK_STEP - 1)).toBe(1);
    expect(multiplierFor(STREAK_STEP)).toBe(2);
    expect(multiplierFor(STREAK_STEP * 3)).toBe(4);
    expect(multiplierFor(STREAK_STEP * 1000)).toBe(MULTIPLIER_CAP);
  });

  it('THE ASK: a kill scores its row’s points times the streak it lands on, through the real frame', () => {
    const { world } = playableWorld(DRIFTERS(14));
    const frame = new GameFrame(world);
    // Nothing the drifters throw costs anything, so the streak is the guns' alone.
    world.tuning = { ...world.tuning, playerDamage: 0 };
    const heard: number[] = [];
    world.onScore = (points: number): void => {
      heard.push(points);
    };
    for (let i = 0; i < STEPS_PER_SECOND * 60 && (world.score.spawned === 0 || world.enemies.size > 0); i++) frame.step();
    expect(world.score.spawned, 'the wave was not counted as it was sent').toBe(14);
    expect(world.score.kills, 'the guns killed too few of the wave to say anything about a streak').toBeGreaterThan(STREAK_STEP);
    expect(world.score.hits).toBe(0);
    expect(world.score.streak).toBe(world.score.kills);
    expect(world.score.points, 'the points are not the row’s times the streak').toBe(worth(ENEMIES.drifter.points, world.score.kills));
    // And the readout was told, on a change, ending on what the frame holds.
    expect(heard[heard.length - 1]).toBe(world.score.points);
    expect(heard.length, 'the score was reported more often than it changed').toBeLessThanOrEqual(world.score.kills);
  });

  it('THE ASK: a shield taking a hit is a hit — the streak goes back to nothing and the rank hears it', () => {
    const { world, cues } = playableWorld(DRIFTERS(1));
    const frame = new GameFrame(world);
    for (let i = 0; i < STEPS_PER_SECOND * 30 && world.enemies.size === 0; i++) frame.step();
    const body = world.enemies.at(0);
    // A body that will not die to the guns, stood on the ship with a shield on its hull.
    body.health = 9999;
    world.ship.health = world.shipRow.health + 1;
    world.score.streak = 37;
    body.along = world.ship.along;
    body.across = world.ship.across;
    body.prevAlong = body.along;
    body.prevAcross = body.across;
    frame.step();
    expect(world.ship.health, 'the shield did not take the hit').toBe(world.shipRow.health);
    expect(cues, 'this was not a shield taking a hit').toContain('shield');
    expect(world.score.streak, 'a shield taking a hit left the streak standing').toBe(0);
    expect(world.score.hits).toBe(1);
  });

  it('a boss is worth its row’s points, flat — the streak multiplies a wave and never a fight', () => {
    const level: LevelRow = { ...DRIFTERS(0), waves: [], bossAt: 700, midBoss: { kind: 'sentinel', at: 200 }, boss: 'jormungandr' };
    const { world } = playableWorld(level);
    const frame = new GameFrame(world);
    for (let i = 0; i < 4000 && world.bossPool.size === 0; i++) frame.step();
    expect(world.fight, 'the mid-boss never arrived').toBe(0);
    world.score.streak = STREAK_STEP * 5;
    const before = world.score.points;
    const kills = world.score.kills;
    for (let i = 0; i < 4000 && world.fight === 0; i++) {
      if (world.bossPool.size > 0) world.bossPool.at(0).health = 1;
      world.ship.health = world.shipRow.health;
      frame.step();
    }
    expect(world.fight, 'the mid-boss could not be killed').toBe(1);
    expect(world.score.kills, 'something else died in the window, so the delta is not the boss’s').toBe(kills);
    expect(world.score.points - before).toBe(BOSSES.sentinel.points);
  });

  it('a level’s count starts again with its script, and the streak carries across the boundary', () => {
    const { world } = playableWorld(DRIFTERS(0));
    world.score.points = 5000;
    world.score.kills = 40;
    world.score.spawned = 50;
    world.score.hits = 2;
    world.score.streak = 23;
    resetLevelScore(world.score);
    expect([world.score.points, world.score.kills, world.score.spawned, world.score.hits]).toEqual([0, 0, 0, 0]);
    expect(world.score.streak, 'a level boundary broke the streak, and it is not a hit').toBe(23);
  });
});

describe('0428 — a level’s rank and its bonuses', () => {
  it('ranks by the share killed and the hits taken, best first', () => {
    expect(rankFor(100, 100, 0)).toBe('S');
    expect(rankFor(100, 100, 1), 'one hit is not an S').toBe('A');
    expect(rankFor(80, 100, 1)).toBe('A');
    expect(rankFor(60, 100, 3)).toBe('B');
    expect(rankFor(60, 100, 4), 'four hits kept a B').toBe('C');
    expect(rankFor(10, 100, 0)).toBe('D');
    // A level that sent nothing killed all of it.
    expect(rankFor(0, 0, 0)).toBe('S');
  });

  it('THE ASK: the clear pays for each shield on the hull, each bomb on the gun and each charge in the tubes', () => {
    let state: State = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: SHIP });
    state = reduce(state, { slice: 'run', type: 'took', special: 'hunt' });
    const score = { points: 12000, streak: 5, best: 30, kills: 90, spawned: 100, hits: 1 };
    const tally = tallyAtClear(state.run, score, 2);
    expect(tally.held).toEqual({ shield: 2, bomb: state.run.arsenal.gun.length, missile: state.run.arsenal.tubes.length });
    expect(tally.held.missile, 'the tubes’ charge was not counted').toBe(1);
    expect(tally.bonus).toBe(2 * BONUSES.shield.each + tally.held.bomb * BONUSES.bomb.each + BONUSES.missile.each);
    expect(tally.total).toBe(12000 + tally.bonus);
    expect(tally.rank).toBe('A');
    expect(bonusFor({ shield: -1, bomb: 0, missile: 0 }), 'a negative count took points away').toBe(0);
  });
});

describe('0428 — the run banks each level, and a death keeps it', () => {
  it('banks in order, keeps the score through a death, and a new run starts from nothing', () => {
    let state: State = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: SHIP });
    const one = tallyOf(0, 1000, 10, 10, 0, { shield: 1, bomb: 0, missile: 0 });
    const two = tallyOf(1, 2000, 10, 20, 2, { shield: 0, bomb: 1, missile: 0 });
    state = reduce(state, { slice: 'run', type: 'scored', tally: one });
    state = reduce(state, { slice: 'run', type: 'levelCleared' });
    state = reduce(state, { slice: 'run', type: 'scored', tally: two });
    expect(state.run.tallies).toEqual([one, two]);
    expect(bankedScore(state.run)).toBe(one.total + two.total);
    expect(bankedBonus(state.run)).toBe(one.bonus + two.bonus);
    state = reduce(state, { slice: 'run', type: 'lifeLost' });
    expect(bankedScore(state.run), 'a death cost the score').toBe(one.total + two.total);
    state = reduce(state, { slice: 'run', type: 'begin', difficulty: 'burn', ship: SHIP });
    expect(state.run.tallies).toEqual([]);
    expect(state.run.continues).toBe(0);
  });

  it('THE ASK: the break shows the level’s points, rank, three bonuses, its total and the run’s', () => {
    let state: State = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: SHIP });
    const earlier = tallyOf(0, 7000, 1, 1, 0, { shield: 0, bomb: 0, missile: 0 });
    const tally = tallyOf(1, 3000, 9, 10, 0, { shield: 2, bomb: 1, missile: 0 });
    state = reduce(state, { slice: 'run', type: 'scored', tally: earlier });
    state = reduce(state, { slice: 'run', type: 'scored', tally });
    const lines = levelSheet(tally, state.run);
    const said = Object.fromEntries(lines.map((l) => [l.label, l.value]));
    expect(said.Points).toBe(3000);
    expect(said.Rank).toBe('S');
    expect(said['Shields ×2']).toBe(2 * BONUSES.shield.each);
    expect(said['Bombs ×1']).toBe(BONUSES.bomb.each);
    expect(said['Missiles ×0']).toBe(0);
    expect(said['Level total']).toBe(tally.total);
    expect(said.Score, 'the run’s total is not every level banked').toBe(earlier.total + tally.total);
  });

  it('THE ASK: the end shows the total score with the total bonuses, and where it landed', () => {
    let state: State = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: SHIP });
    state = reduce(state, { slice: 'run', type: 'scored', tally: tallyOf(0, 1000, 1, 1, 0, { shield: 1, bomb: 1, missile: 1 }) });
    state = reduce(state, { slice: 'run', type: 'scored', tally: tallyOf(1, 2000, 1, 5, 5, { shield: 0, bomb: 2, missile: 0 }) });
    const said = Object.fromEntries(runSheet(state.run, 2).map((l) => [l.label, l.value]));
    expect(said.Bonuses).toBe(bankedBonus(state.run));
    expect(said['Final score']).toBe(bankedScore(state.run));
    expect(said.Points).toBe(3000);
    expect(said.Ranks).toBe('S D');
    expect(said['High score']).toBe('#3');
  });

  it('a finished run goes on the table with the level being flown counted, and the title reads it back', () => {
    let state: State = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'burn', ship: SHIP });
    state = reduce(state, { slice: 'run', type: 'scored', tally: tallyOf(0, 1000, 1, 1, 0, { shield: 0, bomb: 0, missile: 0 }) });
    state = reduce(state, { slice: 'run', type: 'levelCleared' });
    const flying = { points: 450, streak: 0, best: 0, kills: 3, spawned: 9, hits: 3 };
    const entry = entryOf(state.run, flying, 'bo', false, 123);
    expect(entry).toEqual({ score: 1450, bonus: 0, pilot: 'bo', difficulty: 'burn', levels: 1, cleared: false, continues: 0, when: 123 });
    expect(boardLines([entry, { ...entry, cleared: true }])).toEqual([
      { place: '1.', score: '1450', pilot: 'Backspin', reached: 'L2' },
      { place: '2.', score: '1450', pilot: 'Backspin', reached: 'Clear' },
    ]);
  });
});

describe('0438 — a continue starts the score again, and the table keeps the credit that ran out', () => {
  /** A run that banked two levels and ran out of lives on the third. */
  function ranOutOnThree(): State {
    let state: State = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: SHIP });
    for (let i = 0; i < 2; i++) {
      state = reduce(state, { slice: 'run', type: 'scored', tally: tallyOf(i, 1000, 10, 10, 0, { shield: 1, bomb: 0, missile: 0 }) });
      state = reduce(state, { slice: 'run', type: 'levelCleared' });
    }
    expect(bankedScore(state.run), 'the fixture banked nothing, so a reset would prove nothing').toBeGreaterThan(0);
    return state;
  }

  it('THE ASK: the score resets on a continue — and the level, the lives and the count of continues do not', () => {
    const before = ranOutOnThree();
    const after = reduce(before, { slice: 'run', type: 'continued' });
    expect(bankedScore(after.run), 'a continue kept the last credit’s score').toBe(0);
    expect(bankedBonus(after.run)).toBe(0);
    expect(after.run.level, 'a continue moved the level').toBe(before.run.level);
    expect(after.run.continues).toBe(1);
  });

  it('THE ASK: the table tracks the score and the level reached, for a credit that cleared nothing of its own', () => {
    const after = reduce(ranOutOnThree(), { slice: 'run', type: 'continued' });
    const flying = { points: 700, streak: 0, best: 0, kills: 3, spawned: 9, hits: 3 };
    const entry = entryOf(after.run, flying, 'larry', false, 9);
    expect(entry.score, 'the new credit carried the last one’s score').toBe(700);
    expect(entry.levels, 'the credit bought on level three was recorded as reaching level one').toBe(2);
    expect(boardLines([entry])[0]!.reached).toBe('L3');
  });

  it('the run over says the score, how far the credit got, and where it lands on the table', () => {
    const state = ranOutOnThree();
    const flying = { points: 500, streak: 0, best: 0, kills: 3, spawned: 9, hits: 3 };
    const said = Object.fromEntries(overSheet(state.run, flying, 4).map((l) => [l.label, l.value]));
    expect(said.Score).toBe(bankedScore(state.run) + 500);
    expect(said.Reached).toBe('Level 3');
    expect(said['High score']).toBe('#5');
    expect(Object.fromEntries(overSheet(state.run, flying, null).map((l) => [l.label, l.value]))['High score']).toBe('—');
  });

  it('the frame’s count starts again with the credit, streak and all', () => {
    const score = { points: 4200, streak: 33, best: 40, kills: 30, spawned: 40, hits: 2 };
    resetCreditScore(score);
    expect(score).toEqual({ points: 0, streak: 0, best: 0, kills: 0, spawned: 0, hits: 0 });
  });
});
