/**
 * A boss guards its own back — `docs/decisions/0281-a-boss-guards-its-own-back.md`.
 *
 * Reported from play: *"like all bosses, you can fly behind it with the lightning canon and just
 * basically sit their nuking it because it doesn't go backwards at all."*
 * `reports/the-serpent-played-2026-09-08.md` measured it: `PLAYER_LEAD` is 167.1, every boss's
 * `station + drift + radius` is 149 to 155, and five of the nine arms of `BossAttack` are centred on
 * `π` — so there is a corridor up-lane of every hull that the ship can reach and that most of the
 * vocabulary cannot point into.
 *
 * ── WHAT IS HELD HERE, AND WHY BOTH ASSERTIONS ARE IN THE PLAYER'S OWN UNITS ────────────────────
 *
 * ⚠️ **`docs/decisions/0027-measure-the-picture-not-the-model.md`.** Neither of these asks whether
 * `throwTail` was called, and neither can be satisfied by the code agreeing with itself. The first
 * flies a real ship to the far wall of its own box, with its own hands, and asks whether the ship
 * ever loses health standing there. The second asks how many SECONDS it had when something did.
 *
 * ⚠️ **AND THEY PULL IN OPPOSITE DIRECTIONS, WHICH IS THE POINT.** A tail fast enough to be certain
 * of reaching a parked ship is a tail that arrives before the player can move; one slow enough to be
 * fair is one that may never arrive at all. Either alone is trivially satisfiable and the pair is
 * not — 0110's *"is this unfair, or is this a learnable strategy?"*, written as two numbers.
 *
 * ⚠️ **THE FIRST ONE READS DAMAGE AND NOT DISTANCE, AND THE FIRST DRAFT READ DISTANCE.** A shot that
 * reaches the ship is RELEASED by the collision inside the same step, so a fixture that measures
 * positions after `frame.step()` can never see one arrive: it reported *the nearest anything came
 * was 0.0 units* for all forty phases, which reads exactly like a near miss and was a hit.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame } from '../src/app/frame.ts';
import { BOSSES, BOSS_KINDS, type BossAttack, type BossKind } from '../src/content/bosses.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { SHIPS } from '../src/content/ships.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

const solo = (boss: BossKind) =>
  ({ waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss, theme: 'approach' } as const);

/**
 * How long the ship is left parked at the wall before the corridor is called free, in seconds.
 *
 * ── WHY IT IS NOT THREE SECONDS, WHICH IS WHAT MOST FIGHTS ACTUALLY TAKE ────────────────────────
 *
 * ⚠️ **THE WORST CASE IS A BEAT, NOT A FAILURE, AND A SHORTER WINDOW WOULD MEASURE THE BEAT.** Three
 * periodic things run at once during a parked fight: the wake's own sweep, the hull's patrol across
 * the lane, and its drift along it. Where they line up badly the wait is long, and it moves about
 * violently with the sweep's step — measured across the fourteen fights, the worst stand went 13.7 s
 * at one sweep setting, 16.6 s at the next and 36 s at the one after, while the median stayed near
 * two. A threshold set close to any of those is [0044](../docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s
 * intermittent guard waiting to happen.
 *
 * ⚠️ **25 IS NEARLY TWICE THE WORST MEASURED**, on 0044's own arithmetic for a budget sized under
 * load. What it holds is *the corridor is not free*, which is the report's claim; how EXPENSIVE it
 * is at the far corner of the lane is a hand's question and 0192 says a taste may not fail a suite.
 */
const PARKED_FOR = 25;

/**
 * The reaction a threat owes the player, in steps — three quarters of a second.
 *
 * ⚠️ **NOT THIS GUARD'S OWN NUMBER.** It is the horizon `tests/crowd.test.ts` holds every other
 * threat in the game to, the fuse 0263 gives a shard before it opens, and the warning 0248 gives the
 * lightning before it lands. A lash that arrived quicker than the game's own fair-warning quantity
 * would be the corridor closed by making it lethal, which is what the report asks not to happen:
 * *possible and expensive, not walled off*.
 */
const FAIR_WARNING = Math.round(0.75 * STEPS_PER_SECOND);

/** How close a lash counts as having reached the ship, in world units of clearance — see `park`. */
const NEAR = 1;

/** A phase that throws no bullets at all cannot guard anything with one — the two arms, and the eye. */
function throwsBullets(kind: BossKind, phaseIndex: number): boolean {
  const row = BOSSES[kind];
  const phase = row.phases[phaseIndex]!;
  // The bared window stops the volley outright — `stepBoss` returns before it fires.
  if (phase.stance.kind === 'bare') return false;
  const attack: BossAttack = phase.attack ?? row.attack;
  if (attack.kind === 'heads') return attack.heads.some((head) => head.attack.kind !== 'beam' && head.attack.kind !== 'summon');
  return attack.kind !== 'beam' && attack.kind !== 'summon';
}

/**
 * Fly the fight with the ship holding full stick UP-LANE, so it parks against the far wall of its
 * own box — which is the thing the report describes doing — and hold it at `across`.
 *
 * ⚠️ **THE SHIP FLIES THERE, IT IS NOT PLACED THERE.** `src/sim/flight.ts` clamps by trimming
 * velocity rather than by writing `along`, and a fixture that wrote the position would be asserting
 * about a place the ship may not actually be able to reach and hold.
 *
 * ⚠️ **AND THE STICK IS THE FIXTURE'S, NOT `world.intent`.** `src/app/frame.ts` zeroes the intent at
 * the top of every step, so an intent written between two steps never reaches `flyShip` —
 * `tests/world.ts` carries what that cost.
 *
 * ⚠️ **The health is pinned ABSURDLY high rather than to the row's**, because a ship restored to full
 * at the top of a step can still be taken below zero inside it, and a death would respawn the ship at
 * `SHIP_START_ALONG` and quietly end the measurement. What is read back is how far below the pin it
 * finished the step, which is *did the parked ship get hit*.
 */
function park(kind: BossKind, phaseIndex: number, tier: (typeof DIFFICULTY_KINDS)[number], across: number, seconds: number) {
  const { world, stick } = playableWorld(solo(kind), tier);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    frame.step();
  }
  expect(world.bossPool.size, `${kind} never arrived`).toBe(1);
  const at = Math.max(0.02, BOSSES[kind].phases[phaseIndex]!.upTo - 0.01);
  const PINNED = 1e6;

  /** How many steps the parked ship lost health on. */
  let hits = 0;
  /** The fewest steps a LASH had been in the air when it first reached the ship's hurtbox. */
  let quickest = Number.POSITIVE_INFINITY;

  /*
    ⚠️ **A SHOT'S AGE, AND A POOLED ENTITY IS ITS OWN PREDECESSOR.** `src/sim/pool.ts` hands back the
    previous occupant of a slot, so the same object is a different bullet after a release — and a
    stale birth would make an age look LONGER than it is, which is the direction that lets this guard
    pass over a lash that arrives too fast. A rebirth is detected by the position JUMPING: a shot
    moves at most a couple of units a step and a respawn teleports it to the hull.
  */
  const born = new Map<object, number>();
  const wasAt = new Map<object, number>();
  const JUMPED = 4;
  const reach = SHIPS.proof.radius;

  for (let i = 0; i < seconds * STEPS_PER_SECOND; i++) {
    if (world.bossPool.size === 0) break;
    world.bossPool.at(0).health = world.bossFullHealth * at;
    world.ship.health = PINNED;
    world.ship.invulnFor = 0;
    // Full stick up-lane, and hold the chosen across: the parked ship of the report.
    stick.along = 1;
    const wants = across - world.ship.across;
    stick.across = wants > 0.5 ? 1 : wants < -0.5 ? -1 : 0;
    frame.step();
    /*
      ⚠️ **NOTHING IS COUNTED UNTIL THE SHIP HAS ACTUALLY ARRIVED AT THE WALL.** It starts at
      `SHIP_START_ALONG` and flies up-lane THROUGH the boss to get there, so the first second of every
      run has the ship passing within a unit of the hull — and a lash born at the hull while the ship
      is beside it is one step old when it touches. Ungated, this reported a fair-warning failure of
      **three steps** on a boss whose corridor is thirty-eight units deep, which is a statement about
      the fixture's approach and not about the fight.
    */
    const parked = world.ship.along - world.cameraAlong >= PLAYER_LEAD - 1;
    if (parked && world.ship.health < PINNED) hits++;

    for (let s = 0; s < world.enemyShots.size; s++) {
      const shot = world.enemyShots.at(s);
      const seen = wasAt.get(shot);
      if (seen === undefined || Math.abs(shot.along - seen) > JUMPED) born.set(shot, i);
      wasAt.set(shot, shot.along);
      /*
        ⚠️ **THE SELECTOR, WHICH IS NOT THE ASSERTION.** A lash is the only thing in `enemyShots` that
        carries a fuse — `stepEntities` retires it when `lifeFor` runs out, and every other hostile
        bullet is spent by arriving or by the cull. Scoped rather than measured over every bullet,
        because a ring has always crossed this corridor at full speed and slowing one down is not this
        decision's to do.

        ⚠️ **AND IT KEYS ON THE FUSE RATHER THAN ON THE SPEED, WHICH IS WHY THE PROBE CAN REACH IT.**
        The first draft selected shots travelling at exactly `TAIL_SPEED` — the constant this
        assertion exists to hold. `scripts/probes/0281` breaks that constant, and with a selector
        keyed to it the guard found no lash at all, recorded nothing, and **skipped**: it went red on
        a different test instead of on this one. A selector written in terms of the quantity under
        test cannot see the defect in that quantity, which is 0005 caught on itself.
      */
      if (shot.lifeFor <= 0) continue;
      /*
        ⚠️ **ABOUT TO CONNECT, NOT CONNECTED, AND THE DIFFERENCE MADE THE FIRST DRAFT VACUOUS.** A
        shot that reaches the hurtbox is RELEASED by the collision inside the same step, so `gap <= 0`
        is a state a fixture reading positions after `frame.step()` can never observe: written that
        way, this assertion recorded nothing on any boss, any phase or any tier, skipped on
        `Number.isFinite`, and **passed while holding nothing at all**. `NEAR` is one world unit of
        clearance, which a lash closing at a fifth of a unit a step spends several steps inside.
      */
      if (!parked) continue;
      const gap = Math.hypot(shot.along - world.ship.along, shot.across - world.ship.across) - shot.radius - reach;
      if (gap > NEAR) continue;
      const age = i - (born.get(shot) ?? i);
      if (age < quickest) quickest = age;
    }
    for (let s = world.enemyShots.size; s < world.enemyShots.capacity; s++) wasAt.delete(world.enemyShots.at(s));
  }
  return { hits, quickest };
}

/** Three places across the lane a parked ship is asked to be found in: both edges and the middle. */
const STANDS = [ACROSS_SPAN * 0.15, ACROSS_SPAN * 0.5, ACROSS_SPAN * 0.85];

describe('0281 — a boss guards its own back', () => {
  it('THE REPORTED ONE: a ship parked against the up-lane wall of its box is found there, wherever across the lane it stands, in every bullet-throwing phase of every fight', () => {
    /*
      ⚠️ **EVERY STAND, NOT THE BEST OF THEM, AND THE DIFFERENCE IS THE WHOLE GUARD.** A claim that
      SOMEWHERE at the wall is dangerous leaves the player the other two places, and the report is
      about a player who has found one of them. Measured with a version that asserted the best stand:
      it passed while the jellyfish never once touched a ship standing at 15 or 85 across.
    */
    for (const kind of BOSS_KINDS) {
      for (let phase = 0; phase < BOSSES[kind].phases.length; phase++) {
        if (!throwsBullets(kind, phase)) continue;
        for (const across of STANDS) {
          const { hits } = park(kind, phase, 'savior', across, PARKED_FOR);
          expect(
            hits,
            `${kind} phase ${phase + 1}: a ship parked against the up-lane wall at ${across} across, for ` +
              `${PARKED_FOR}s, was never touched. This is the corridor the report calls flying behind it and ` +
              `sitting there nuking it.`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('and the lash that finds it there never arrives quicker than the fair warning the rest of the game gives', () => {
    /*
      ⚠️ **THE COUNT IS ASSERTED BEFORE THE QUANTITY IS, AND THAT IS 0005 TURNED ON THIS GUARD
      ITSELF.** Written without it — `if (!Number.isFinite(quickest)) continue` and nothing more —
      this test recorded no lash on any boss, phase or tier, skipped every case, and **passed while
      holding nothing**. It stayed green over a probe that put a boss on top of the parked ship. A
      guard whose subject can be empty has to say how many it found.
    */
    let seen = 0;
    let worst = Number.POSITIVE_INFINITY;
    let where = '';
    for (const kind of BOSS_KINDS) {
      for (let phase = 0; phase < BOSSES[kind].phases.length; phase++) {
        if (!throwsBullets(kind, phase)) continue;
        for (const tier of DIFFICULTY_KINDS) {
          const { quickest } = park(kind, phase, tier, ACROSS_SPAN * 0.5, PARKED_FOR);
          if (!Number.isFinite(quickest)) continue;
          seen++;
          if (quickest < worst) {
            worst = quickest;
            where = `${kind} phase ${phase + 1} at ${tier}`;
          }
        }
      }
    }
    expect(seen, 'no lash reached the parked ship anywhere in the game, so the assertion below checks nothing').toBeGreaterThan(0);
    expect(
      worst,
      `${where}: a lash reached the parked ship ${worst} steps (${(worst / STEPS_PER_SECOND).toFixed(2)}s) after it ` +
        `left the hull, against the ${FAIR_WARNING} steps (0.75s) every other threat in the game gives. The corridor ` +
        `is closed by being lethal, not by being expensive.`,
    ).toBeGreaterThanOrEqual(FAIR_WARNING);
  });
});
