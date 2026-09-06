/**
 * A fight thins the waves over it — `docs/decisions/0267-a-fight-thins-the-waves-over-it.md`.
 *
 * Reported: *"when the minibosses are on screen there are way too many waves in general happening
 * and it's a lot… spread the waves out so a few bullet firing waves happen before miniboss and some
 * after miniboss and less during the miniboss — still need some during miniboss otherwise miniboss
 * is too easy, but not as many."*
 *
 * ⚠️ **EVERY ASSERTION HERE IS A RATE IN THE PLAYER'S UNITS** — enemy hulls crossing onto the screen
 * per ten seconds — over the walk `scripts/weigh-fight.mjs` drives: the real frame, the real
 * spawner, the real guns, an immortal ship that sweeps the lane between fights and holds the boss's
 * lane during one. Seeded and fixed-step, so it is the same walk on every machine.
 *
 * ⚠️ **AND THE BUDGET IS THE LEVEL'S OWN STRETCH BEFORE THE FIGHT, NOT A CONSTANT** — which is
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`'s actual subject. A guard written as
 * *fewer than N firing waves during a fight* would be a number agreeing with the number it guards,
 * and a probe could not tell the difference; comparing the fight against the same level's own
 * approach cannot be satisfied by moving `FIGHT_FIRING_IN`, only by the fight genuinely being
 * quieter than the level that leads into it.
 */

import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { weighFight } from '../scripts/weigh-fight.mjs';

/**
 * The loadout a player carries at the mid-boss.
 *
 * ⚠️ **ONE RUNG OF EACH, AND IT IS THE ASK'S OWN CASE.** A level authors one weapon near its start
 * and one missile a fifth of the way in (0256), and the mid-boss's own drop comes out of the fight
 * rather than into it — so one rung is what the fight is met with on a level the player did not
 * arrive at loaded. It is also the slowest kill, which is the case the report is about: the longer
 * the fight, the more of the script the camera drags across it.
 */
const AT_THE_MID_BOSS = { weaponTier: 1, missileTier: 1 };

const measured = new Map<string, ReturnType<typeof weighFight>>();
for (const kind of LEVEL_KINDS) {
  if (LEVELS[kind].midBoss === null) continue;
  measured.set(kind, weighFight(kind, AT_THE_MID_BOSS));
}

describe('0267 — a fight thins the waves over it', () => {
  it('every level has a mid-boss to fight, so this measures something', () => {
    expect(measured.size, 'no level has a mid-boss, so every assertion below is vacuous').toBe(LEVEL_KINDS.length);
    for (const [kind, r] of measured) {
      expect(r.fought, `${kind}'s mid-boss was never fought`).toBe(true);
      expect(r.before.seconds, `${kind} spends no time before its mid-boss`).toBeGreaterThan(10);
      expect(r.during.seconds, `${kind}'s fight lasted no time at all`).toBeGreaterThan(5);
    }
  });

  it('THE REPORTED ONE: firing bodies arrive more slowly during a mid-boss fight than before it', () => {
    /*
      ⚠️ **MEASURED BEFORE THE FIX, four of the seven were the wrong way round** — the Approach at
      8.9 against 5.7, Ember Nebula 12.8 against 12.0, Rime Shelf 14.6 against 11.6, the Black Heart
      8.6 against 8.0. A fight was the busiest stretch of the level it sat in, on top of a boss.
      `scripts/probes/0267-*.mjs` takes the thinning out and this goes red on those four.
    */
    for (const [kind, r] of measured) {
      expect(
        r.during.firingRate,
        `${kind} sends ${r.during.firingRate.toFixed(1)} firing bodies per 10s onto its mid-boss fight ` +
          `against ${r.before.firingRate.toFixed(1)} in the stretch before it — the fight is the busiest part of the level`,
      ).toBeLessThan(r.before.firingRate);
    }
  });

  it('and they never stop, so the fight is not a duel in an empty lane', () => {
    /*
      *"Still need some during miniboss otherwise miniboss is too easy, but not as many."* The floor
      is stated as a rate rather than a count so a long fight and a short one are held to the same
      thing; one firing body every ten seconds is the least any level measures at, and the quiet
      waves are not thinned at all.
    */
    for (const [kind, r] of measured) {
      expect(
        r.during.firingRate,
        `${kind}'s mid-boss fight gets ${r.during.firingRate.toFixed(1)} firing bodies per 10s, which is nothing to dodge`,
      ).toBeGreaterThanOrEqual(1);
      expect(r.during.rate, `${kind}'s mid-boss fight has no waves arriving at all`).toBeGreaterThan(r.during.firingRate);
    }
  });
});
