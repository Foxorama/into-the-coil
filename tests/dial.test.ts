import { describe, expect, it } from 'vitest';

import {
  DIAL_MAX,
  DIAL_MIN,
  DIAL_PER_LEVEL,
  DIAL_PER_WEAPON,
  MULTI_HIT_DIAL,
  dialFor,
  singleHitOnly,
} from '../src/content/difficulty.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { GameFrame, advanceLevel } from '../src/app/frame.ts';
import { playableWorld } from './world.ts';

/**
 * THE DIFFICULTY DIAL.
 *
 * `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`. Reported from play:
 *
 * > *"There should be progression of mission and difficulty from one level to the next… It's a dial
 * > that starts at 1 and should be at 11 when the player is dealing with the last boss at the end of
 * > the last level."*
 *
 * ⚠️ **The shape is the subject, not the numbers.** What is held below is that the dial STARTS at the
 * bottom, RISES within a level, DROPS back at a boundary without dropping below where the last level
 * began, and ARRIVES at the top for the last boss. Every one of those is a sentence from the report;
 * none of them is a constant typed here.
 *
 * ⚠️ **The endpoint is recomputed from the CONTENT rather than restated.** `DIAL_MAX` is 11 and the
 * levels offer four weapon pickups each over seven levels — if a level gains one, the last boss moves
 * past the top of the dial and the clamp starts eating it. That is the failure this file exists for,
 * and it is invisible in `src/content/levels.ts` because nothing there mentions the dial.
 */

/** How many `weapon` pickups a level puts on the field, which is what turns the dial. */
function weaponsIn(kind: (typeof LEVEL_KINDS)[number]): number {
  return LEVELS[kind].pickups.filter((p) => p.kind === 'weapon').length;
}

describe('the dial climbs through a level and sawtooths across the run', () => {
  it('opens a run at the bottom', () => {
    expect(dialFor(0, 0), 'a run does not begin at the bottom of the dial').toBe(DIAL_MIN);
  });

  it('rises with every weapon the level offers, and never with anything else', () => {
    /*
      *"Dials it up per power up spawn."* Held as a strict rise per weapon rather than as a value, so
      the step can be tuned without rewriting this.
    */
    let last = dialFor(0, 0);
    for (let offered = 1; offered <= weaponsIn(LEVEL_KINDS[0]!); offered++) {
      const now = dialFor(0, offered);
      expect(now, `the ${offered}th weapon of level one did not move the dial`).toBeGreaterThan(last);
      last = now;
    }
  });

  it('THE SAWTOOTH: a level opens easier than the last one ended, and harder than it began', () => {
    /*
      ⚠️ **BOTH HALVES, because either alone is a different curve.** *"Level 2 starts by dialing it
      back a couple of notches to give the player a breathing space"* is the first; *"there should be
      progression of mission and difficulty from one level to the next"* is the second. A dial that
      only dropped would be a flat game with dips in it, and one that only rose would be the
      monotonic climb the report is complaining about.
    */
    for (let i = 1; i < LEVEL_KINDS.length; i++) {
      const previousEnd = dialFor(i - 1, weaponsIn(LEVEL_KINDS[i - 1]!));
      const previousStart = dialFor(i - 1, 0);
      const start = dialFor(i, 0);
      expect(start, `level ${i + 1} opens at least as hard as level ${i} ended — no breathing space`).toBeLessThan(
        previousEnd,
      );
      expect(start, `level ${i + 1} opens no harder than level ${i} did — the run does not progress`).toBeGreaterThan(
        previousStart,
      );
    }
  });

  it('THE CLIMB: every boss is fought harder than the last one, with no flat spots', () => {
    /*
      ⚠️ **THE GUARD `npm run prove` SAID WAS MISSING.** A probe added a fifth weapon pickup to level
      SIX and the suite stayed green: `THE ENDPOINT` only looks at the last level, and `THE SAWTOOTH`
      only compares a level's opening to the one before it. Level six's boss quietly rose to 11 —
      level seven's number — and the run's last two fights became the same difficulty with nothing
      complaining.

      ⚠️ **A flat spot is not a small error, it is the report's own complaint.** *"There should be
      progression of mission and difficulty from one level to the next."* Two bosses at one dial value
      is the place that stops being true, and it is authored in `src/content/levels.ts` where nothing
      mentions the dial at all.
    */
    for (let i = 1; i < LEVEL_KINDS.length; i++) {
      const previousBoss = dialFor(i - 1, weaponsIn(LEVEL_KINDS[i - 1]!));
      const boss = dialFor(i, weaponsIn(LEVEL_KINDS[i]!));
      expect(
        boss,
        `level ${i + 1}'s boss is fought at ${boss} and level ${i}'s at ${previousBoss} — the run stops climbing`,
      ).toBeGreaterThan(previousBoss);
    }
  });

  it('THE ENDPOINT: the last boss is fought at exactly the top of the dial', () => {
    /*
      ⚠️ **THE ONE NUMBER THE ASK GIVES, AND IT IS RECOMPUTED RATHER THAN RESTATED.** *"It's a dial
      that starts at 1 and should be at 11 when the player is dealing with the last boss at the end of
      the last level."*

      This multiplies out the content — seven levels, four weapons each — and checks it lands on
      `DIAL_MAX` with nothing clamped away. A level that gained a weapon pickup, or an eighth level,
      would fail HERE rather than silently pushing the last two levels into a ceiling.
    */
    const last = LEVEL_KINDS.length - 1;
    const atLastBoss = DIAL_MIN + last * DIAL_PER_LEVEL + weaponsIn(LEVEL_KINDS[last]!) * DIAL_PER_WEAPON;
    expect(
      atLastBoss,
      `the content works out to ${atLastBoss} at the last boss against a dial that tops out at ${DIAL_MAX}`,
    ).toBe(DIAL_MAX);
    expect(dialFor(last, weaponsIn(LEVEL_KINDS[last]!)), 'the last boss is not fought at the top of the dial').toBe(
      DIAL_MAX,
    );
  });

  it('and clamps rather than running off either end', () => {
    // A level index past the roster is a shell bug; `src/app/lifecycle.ts` clamps it for the same
    // reason a black screen is a worse way to report one than a hard fight.
    expect(dialFor(99, 99), 'the dial ran off the top').toBe(DIAL_MAX);
    expect(dialFor(-5, 0), 'the dial ran off the bottom').toBe(DIAL_MIN);
  });
});

describe('nothing takes more than one hit until the dial has turned twice', () => {
  it('THE REPORTED ONE: the opening of level one has no multi-hit enemies in it', () => {
    /*
      *"At the start of the game there should be no multiple hit enemies until after the 2nd upgrade
      has been spawned — the difficulty curve currently has a massive spike at the start."*

      ⚠️ **Asserted in PICKUPS SPAWNED rather than in dial units**, because that is the unit the report
      is written in and the one a player experiences. The dial is the mechanism; *how far into level
      one* is the thing being promised.
    */
    expect(singleHitOnly(0, 0), 'the first screen of the game can send a multi-hit enemy').toBe(true);
    expect(singleHitOnly(0, 1), 'one weapon in, the game can already send a multi-hit enemy').toBe(true);
    expect(singleHitOnly(0, 2), 'the clamp outlasts the second weapon, so the curve stays flat').toBe(false);
  });

  it('and level two is past it from its first wave, so the clamp is an OPENING and not a mode', () => {
    /*
      ⚠️ **The counterweight.** A clamp keyed to *the dial is low* rather than to *this is the start of
      the game* would come back every time a level dropped the dial, and the second half of every level
      would be the only place the game had teeth. `MULTI_HIT_DIAL` is chosen so that only level one's
      opening is under it.
    */
    for (let i = 1; i < LEVEL_KINDS.length; i++) {
      expect(singleHitOnly(i, 0), `level ${i + 1} opens with the multi-hit clamp still on`).toBe(false);
    }
  });

  it('and it reaches the FIELD, not just the table', () => {
    /*
      ⚠️ **Driven through the real frame, because a rule in `src/content/` that no spawner reads is a
      rule about nothing** — the same argument `tests/difficulty.test.ts` makes for the tier. What is
      counted is the health of what actually arrives.

      ⚠️ **The turret is the body this is about**: three health, and `src/content/levels.ts` puts one
      at 2,310 in level one, which is inside the clamp. It was the spike.
    */
    const { world } = playableWorld(LEVELS[LEVEL_KINDS[0]!]);
    const frame = new GameFrame(world);
    let sawEnemy = false;
    for (let step = 0; step < 4000 && world.weaponsOffered < 2; step++) {
      frame.step();
      for (let i = 0; i < world.enemies.size; i++) {
        sawEnemy = true;
        expect(
          world.enemies.at(i).health,
          'an enemy arrived with more than one hit in it before the second weapon was offered',
        ).toBe(1);
      }
    }
    expect(sawEnemy, 'no enemy ever arrived, so this measured nothing').toBe(true);
    expect(world.weaponsOffered, 'the level never offered a second weapon, so the clamp was never left').toBe(2);
  });

  it('and once the clamp lifts, a tough enemy is tough again', () => {
    /*
      ⚠️ **The other direction, and it is what stops the clamp becoming the game.** A guard that only
      checked *nothing is tough early* passes just as well if nothing is ever tough — which is the
      easiest way to break this and the hardest to notice, because the opening would look correct.
    */
    const { world } = playableWorld(LEVELS[LEVEL_KINDS[0]!]);
    const frame = new GameFrame(world);
    let toughest = 0;
    for (let step = 0; step < 20_000 && !world.bossSpawned; step++) {
      frame.step();
      for (let i = 0; i < world.enemies.size; i++) {
        const health = world.enemies.at(i).health;
        if (health > toughest) toughest = health;
      }
    }
    expect(
      toughest,
      `the toughest thing level one ever sent took ${toughest} hits, and the turret it authors has ${ENEMIES.turret.health}`,
    ).toBeGreaterThan(1);
  });
});

describe('the dial is a property of the RUN, and a level boundary carries it', () => {
  it('resets what the level offered without resetting where the run has got to', () => {
    /*
      ⚠️ **THE SAWTOOTH IN THE FRAME, which the pure function above cannot show.** `beginScript` zeroes
      `weaponsOffered` and `advanceLevel` raises `levelIndex`, and the two together are the drop. A
      boundary that forgot either would be a dial that climbed forever or one that started over.
    */
    const { world } = playableWorld(LEVELS[LEVEL_KINDS[0]!]);
    const frame = new GameFrame(world);
    for (let step = 0; step < 4000 && world.weaponsOffered < 2; step++) frame.step();
    expect(world.weaponsOffered, 'the level never offered anything').toBeGreaterThan(0);
    const before = dialFor(world.levelIndex, world.weaponsOffered);

    advanceLevel(world, LEVELS[LEVEL_KINDS[1]!], 1);
    expect(world.weaponsOffered, 'a level boundary kept what the last level had offered').toBe(0);
    expect(world.levelIndex, 'a level boundary did not move the run on').toBe(1);

    const after = dialFor(world.levelIndex, world.weaponsOffered);
    expect(after, 'a level boundary did not give the player any breathing space').toBeLessThan(before);
    expect(after, 'a level boundary put the run back to the start of the dial').toBeGreaterThan(DIAL_MIN);
  });
});

describe('the threshold is inside the dial it is a threshold on', () => {
  it('sits above the bottom and below the top, or it is not a threshold at all', () => {
    /*
      ⚠️ **A guard over a CONSTANT, which this repository normally refuses** — and it earns it: at
      `DIAL_MIN` the clamp would never fire and at `DIAL_MAX` it would never lift, and both of those
      are a deleted feature that every other test in this file still passes. It is the one shape
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` cannot catch, because a probe that moved
      the threshold to either end would look exactly like a tuning change.
    */
    expect(MULTI_HIT_DIAL, 'the multi-hit clamp never fires, so it is not a rule').toBeGreaterThan(DIAL_MIN);
    expect(MULTI_HIT_DIAL, 'the multi-hit clamp never lifts, so the game has no tough enemies').toBeLessThan(DIAL_MAX);
  });
});
