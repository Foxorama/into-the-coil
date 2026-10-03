/**
 * A mid-boss is fought for as long as its level says —
 * `docs/decisions/0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md`.
 *
 * Reported from the alpha play: *"mid bosses need less health."*
 *
 * ⚠️ **THE ASSERTIONS ARE IN SECONDS, WHICH IS THE ONLY UNIT THE ASK WAS EVER IN** —
 * [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md). Health is not a quantity a
 * player can feel and it is not one a hand can reason about either: damage actually landed varies
 * four-fold across the seven mid-bosses and runs inversely to how fast the hull crosses the lane, so
 * the redoubt carried MORE health than the lattice and died in a third of the time.
 * `scripts/solve-mid-health.mjs` is what maps one to the other, and the table's healths are its
 * output.
 *
 * ⚠️ **A RED GUARD HERE IS NOT ANSWERED BY EDITING `MID_BOSS_SECONDS`.** The target is the ask and
 * the health is the derived thing; moving the target to meet a measurement would make this file
 * agree with itself and measure nothing —
 * [0192](../docs/decisions/0192-a-guard-holds-an-invariant.md). Re-run the solver and take its
 * numbers.
 */

import { describe, expect, it } from 'vitest';

import { BOSSES } from '../src/content/bosses.ts';
import { TUNED } from '../src/content/difficulty.ts';
import { BOSS_DEATH_STEPS } from '../src/app/frame.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { LEVELS, LEVEL_KINDS, MID_BOSS_SECONDS, type LevelKind } from '../src/content/levels.ts';
import { carriedAt, weighFight } from '../scripts/weigh-fight.mjs';

/**
 * How far a measured fight may sit from what its level asked for, in seconds.
 *
 * ⚠️ **A BUDGET, AND IT IS THE SOLVER'S OWN PRECISION RATHER THAN A TASTE.** The map from health to
 * seconds is not proportional: a phase raises `patrolScale`, so a hull with less health left moves
 * faster and is harder to hit, and halving the health does not halve the fight. Two passes of the
 * solver land every level inside two seconds and a third moves them by less than one. Three is that,
 * with a second of room for a change elsewhere that nudges what the guns land.
 */
const CLOSE_ENOUGH_SECONDS = 3;

/*
  ⚠️ **AT THE LOADOUT THE RUN CARRIES IN, READ OFF THE LEVEL SCRIPTS — 0406.** This measured one rung
  of each (0269) while the ladders crossed every level and outlived every death, so from the second
  level on the fight it held was one nobody flew: the flown one ran six to nine seconds. `carriedAt`
  walks the run's pickups in order, so a pickup moved anywhere moves the loadout this is asked at.

  ⚠️ **AND AT THE TIER THE GAME IS TUNED FOR — 0472.** This flew the content multiplied by nothing,
  which no tier is since 0356, and Savior's toughness made every fight it passed run 24–57 s against
  the 17–23 its level asks for. Reported: *"on saviour difficulty, there's some spots, especially
  around minibosses, that it's too bullety."*
*/
const met = new Map<LevelKind, ReturnType<typeof weighFight>>();
for (const kind of LEVEL_KINDS) {
  if (LEVELS[kind].midBoss === null) continue;
  met.set(kind, weighFight(kind, { ...carriedAt(kind), difficulty: TUNED }));
}

describe('0269 — a mid-boss is fought for as long as its level says', () => {
  it('every level has a mid-boss and a target for it', () => {
    expect(met.size, 'no level has a mid-boss, so every assertion below is vacuous').toBe(LEVEL_KINDS.length);
    for (const kind of LEVEL_KINDS) {
      const mid = LEVELS[kind].midBoss;
      expect(mid, `${kind} has no mid-boss`).not.toBeNull();
      expect(MID_BOSS_SECONDS[kind], `${kind} fights ${mid!.kind} and has no entry in MID_BOSS_SECONDS`).toBeGreaterThan(0);
    }
  });

  it('THE REPORTED ONE: a mid-boss fight lasts what its level asks, at the loadout it is met with', () => {
    /*
      ⚠️ **MEASURED BEFORE: 37 to 112 seconds, in no order at all.** *"Mid bosses need less health"* —
      and the health they had was a ladder from 240 to 570 that the fights did not follow, because
      what decides a fight is how much of the player's fire lands on that hull.
    */
    for (const [kind, r] of met) {
      const want = MID_BOSS_SECONDS[kind];
      expect(
        Math.abs(r.during.seconds - want),
        `${kind}'s mid-boss is fought for ${r.during.seconds.toFixed(0)}s against the ${want}s its level asks for`,
      ).toBeLessThanOrEqual(CLOSE_ENOUGH_SECONDS);
    }
  });

  it('and the seven average the twenty seconds the play asked for', () => {
    /*
      ⚠️ **THE MEAN IS THE ASK AND THE SPREAD IS THE LADDER.** *"~20 seconds"* is what was chosen; the
      17-to-23 climb across the run is this decision's own, so that the ladder 0247 wanted is in a
      quantity the player is actually in the order of. Held on the MEASURED fights rather than on the
      targets, which would be arithmetic about a table.
    */
    let total = 0;
    for (const r of met.values()) total += r.during.seconds;
    const mean = total / met.size;
    expect(mean, `the seven mid-boss fights average ${mean.toFixed(1)}s`).toBeGreaterThan(18);
    expect(mean, `the seven mid-boss fights average ${mean.toFixed(1)}s`).toBeLessThan(22);
  });

  /*
    ⚠️ **"AT A FULL LOADOUT IT IS STILL A SPEED BUMP" IS DELETED — 0406.** It held three to twelve
    seconds at the cap, on 0247's *"a mid-boss over in seven seconds at max weapons IS the miniboss"*
    — a sentence about a fight met at one rung that got easy as the ladders filled. From the second
    level the fight is MET at the cap, so that guard and the one above were asking for seven seconds
    and twenty of the same fight, and the play answered which: *"other bosses were very quick, inc
    minibosses."* The floor it also held — never deleted on contact — is the phase floor below, now
    asked at the loadout that deletes fastest.
  */

  it('and every phase of it lasts long enough to be seen, at that loadout', () => {
    /*
      ⚠️ **0124's FLOOR, MOVED TO THE LOADOUT THE FIGHT IS MET AT — 0269.** That guard reads every
      phase at MAX weapons and refuses one under three seconds, and it is right to for a boss the
      player arrives at fully armed. So it is asked here instead, of the fight that actually happens —
      which since 0406 is at the loadout the run carries in, and from the second level that is the cap.

      ⚠️ **Against the MEASURED fight rather than an arithmetic one.** The band is the table's; the
      seconds are the instrument's. A `bare` window is skipped here for 0150's reason — a bared hull
      takes `damageScale` times as much per pulse, so its band is not its duration — and is held by
      the assertion below.
    */
    for (const [kind, r] of met) {
      const phases = BOSSES[LEVELS[kind].midBoss!.kind].phases;
      const ups = phases.map((p) => p.upTo);
      const bands = ups.map((u, i) => (phases[i]!.stance.kind === 'volley' ? u - (ups[i + 1] ?? 0) : Infinity));
      const shortest = Math.min(...bands);
      expect(
        shortest * r.during.seconds,
        `${kind}'s mid-boss has a phase of ${(shortest * r.during.seconds).toFixed(1)}s at the loadout it is met with`,
      ).toBeGreaterThan(3);
    }
  });

  it('and a bare window on one outlasts the death it runs into', () => {
    /*
      ⚠️ **0150's FLOOR, MOVED THE SAME WAY AND FOR THE SAME REASON.** A bared window runs straight
      into the explosion that ends the fight, and a window shorter than that beat is one the player
      only ever meets inside it. Divided by the window's own `damageScale`, which is the whole point
      of writing it: a bared hull takes that many times as much off per pulse, so the honest duration
      of a window is its band divided by the multiplier — 0027's *guard fired on the wrong quantity*.
    */
    const floor = BOSS_DEATH_STEPS / STEPS_PER_SECOND;
    let found = 0;
    for (const [kind, r] of met) {
      const row = BOSSES[LEVELS[kind].midBoss!.kind];
      for (let i = 0; i < row.phases.length; i++) {
        const phase = row.phases[i]!;
        if (phase.stance.kind !== 'bare' && phase.stance.kind !== 'open') continue;
        found++;
        const band = phase.upTo - (row.phases[i + 1]?.upTo ?? 0);
        const seconds = (band * r.during.seconds) / phase.stance.damageScale;
        expect(
          seconds,
          `${kind}'s mid-boss opens a ${seconds.toFixed(2)}s window against a ${floor.toFixed(2)}s death`,
        ).toBeGreaterThan(floor);
      }
    }
    expect(found, 'no mid-boss has a window, so this measured nothing').toBeGreaterThan(0);
  });

  it('and no mid-boss carries more health than the real boss of its own level', () => {
    /*
      The sanity line the solver cannot draw for itself: it solves each mid-boss alone, so nothing in
      it would notice a mid-boss that had grown tougher than the fight at the end of the same level.
    */
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      const mid = BOSSES[level.midBoss!.kind];
      const real = BOSSES[level.boss];
      expect(mid.health, `${kind}'s mid-boss has ${mid.health} health against its real boss's ${real.health}`).toBeLessThan(
        real.health,
      );
    }
  });
});
