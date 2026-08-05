import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS, type WaveEntry } from '../src/content/levels.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { FORMATIONS, FORMATION_KINDS } from '../src/content/formations.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { phaseFor } from '../src/app/boss.ts';
import { GameFrame } from '../src/app/frame.ts';
import { playableWorld } from './world.ts';
import { ACROSS_SPAN, MAX_ALONG_SPAN } from '../src/sim/camera.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';

/**
 * WHAT MUST BE TRUE OF ANY AUTHORED LEVEL — never of this particular one.
 *
 * ⚠️ **Nothing here asserts on a wave's position, a count, or a boss's health.** Those are the level,
 * and the level is a hand's work settled by playing it — the same status `src/sim/flight.ts` gives
 * `SHIP_SPEED` and `src/state/slices/run.ts` gives `STARTING_LIVES`. A test pinning them would go red
 * the first time somebody tuned the game, which is the one moment a guard should be silent.
 *
 * What IS held are the properties whose violation is silent: a wave the spawner will skip, an enemy
 * that leaves the dodge lane and never comes back, a boss phase that can never be entered. Every one
 * of those looks completely normal in the table and produces a level that is quietly wrong.
 */


/** Every member of a wave, as the frame will actually place it. The real formation, not a copy. */
function membersOf(wave: WaveEntry): { along: number; across: number }[] {
  const formation = FORMATIONS[wave.formation];
  const out: { along: number; across: number }[] = [];
  for (let i = 0; i < wave.count; i++) {
    out.push({
      along: wave.at + formation.alongOffset(i, wave.count),
      across: wave.lane + formation.acrossOffset(i, wave.count),
    });
  }
  return out;
}

describe('an authored level is a script the spawner can actually run', () => {
  it('lists its waves in ascending order of place', () => {
    // The spawner walks the list once and never looks back — `src/app/frame.ts` keeps an index that
    // only goes up. A wave out of order is therefore not late, it is NEVER SPAWNED, and nothing
    // anywhere reports it.
    for (const kind of LEVEL_KINDS) {
      const waves = LEVELS[kind].waves;
      for (let i = 1; i < waves.length; i++) {
        expect(waves[i]!.at, `${kind} wave ${i} is behind the one before it — the spawner will skip it`).toBeGreaterThanOrEqual(
          waves[i - 1]!.at,
        );
      }
    }
  });

  it('never puts an enemy where it can leave the dodge lane', () => {
    /*
      ⚠️ **There is no `across` cull.** `src/sim/entity.ts` retires an entity on the along axis at
      both edges and on nothing else, so an enemy that wanders out of the lane is gone from the game
      and still occupying a pool slot — `reports/enemy-silhouettes-2026-08-05.md` names that as the
      one real gap that came with authored spawns.

      The margin is the hurtbox PLUS twice the weave amplitude, and the two is not a safety factor:
      `src/content/enemies.ts` has the algebra. A weaver traces a swing of ±A about a centre that its
      spawn phase can displace by up to another A.
    */
    const offences: string[] = [];
    for (const kind of LEVEL_KINDS) {
      for (const wave of LEVELS[kind].waves) {
        const row = ENEMIES[wave.enemy];
        const margin = row.radius + row.weaveAmplitude * 2;
        for (const member of membersOf(wave)) {
          if (member.across - margin < 0 || member.across + margin > ACROSS_SPAN) {
            offences.push(`${kind} ${wave.enemy} at ${wave.at} reaches ${member.across.toFixed(1)} ± ${margin}`);
          }
        }
      }
    }
    expect(offences, `these can leave the lane, and nothing brings them back:\n  ${offences.join('\n  ')}`).toEqual([]);
  });

  it('the boss arrives after the last wave, with room to be looked at', () => {
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      const last = level.waves[level.waves.length - 1];
      expect(last, `${kind} has no waves at all`).toBeDefined();
      // Not a tuning claim: a boss authored INSIDE the wave script would arrive mid-fight, and its
      // first phase is where the player learns where a 26-unit hull ends.
      expect(level.bossAt, `${kind}'s boss arrives before its last wave`).toBeGreaterThan(last!.at);
    }
  });

  it('is long enough to be a level rather than a demo', () => {
    /*
      In SECONDS, which is a unit the player experiences — `docs/decisions/0027-measure-the-picture-not-the-model.md`
      requires at least one assertion in one. World units are the model's own vocabulary, and a guard
      written in them would be agreeing with the constant it is derived from.

      Two minutes is a floor and not the target. `docs/game.md` asks for ~3 minutes of stage per
      level; this fails only if a level has quietly become a slice of one.
    */
    const unitsPerSecond = SCROLL_PER_STEP * 60;
    for (const kind of LEVEL_KINDS) {
      const seconds = LEVELS[kind].bossAt / unitsPerSecond;
      expect(seconds, `${kind} is only ${seconds.toFixed(0)}s of stage before its boss`).toBeGreaterThan(120);
    }
  });

  it('every wave is spawnable — the pool can hold it and the formation fits the horizon', () => {
    // A wave wider than the spawn horizon would have members visible at the moment they appear.
    // `src/sim/camera.ts` places the horizon beyond the widest view any device can have, and a
    // formation's own depth is the one thing that can reach back out of it.
    for (const kind of LEVEL_KINDS) {
      for (const wave of LEVELS[kind].waves) {
        const formation = FORMATIONS[wave.formation];
        const depth = Math.abs(formation.alongOffset(wave.count - 1, wave.count) - formation.alongOffset(0, wave.count));
        expect(depth, `${kind}'s wave at ${wave.at} is deeper than the view`).toBeLessThan(MAX_ALONG_SPAN);
        expect(wave.count, `${kind} has a wave of ${wave.count}`).toBeGreaterThan(0);
      }
    }
  });

  it('uses only kinds and formations that exist', () => {
    // Compile-forced already; asserted because a `Record` over a union cannot see a level table that
    // has been widened to `string` by a future edit, and this is the cheap second lock.
    for (const kind of LEVEL_KINDS) {
      for (const wave of LEVELS[kind].waves) {
        expect(ENEMY_KINDS, `${wave.enemy} is not an enemy`).toContain(wave.enemy);
        expect(FORMATION_KINDS, `${wave.formation} is not a formation`).toContain(wave.formation);
      }
    }
    for (const kind of LEVEL_KINDS) expect(BOSS_KINDS).toContain(LEVELS[kind].boss);
  });
});

describe('a level actually puts something in front of the player', () => {
  /**
   * ⚠️ **THE GUARD THAT WOULD HAVE CAUGHT THE FIRST DRAFT, AND DID NOT EXIST TO.** `at` began life as
   * a trigger — every wave was placed at the leading edge whatever it was authored at — so a run
   * opened onto an empty field for about eight seconds. Every assertion above passed. The only thing
   * that said so was `scripts/shot.mjs`, and a screenshot is not a guard.
   */
  it('has waves inside the opening spawn horizon, so a run does not begin on an empty screen', () => {
    for (const kind of LEVEL_KINDS) {
      const opening = LEVELS[kind].waves.filter((w) => w.at <= MAX_ALONG_SPAN);
      expect(
        opening.length,
        `${kind} authors nothing within the first screen, so a run opens on empty space and stays ` +
          'that way until the camera has travelled a full lookahead.',
      ).toBeGreaterThan(0);
    }
  });

  it('keeps enough on screen at once to be a shooter, all the way through', () => {
    /*
      ⚠️ **The density complaint, as a number rather than as a feeling.** The first draft averaged two
      enemies on screen forty seconds in, which every other assertion here was blind to: the waves
      were ordered, in the lane, and spawnable, and the level was empty.

      Counted the way the player experiences it — how many bodies are inside ONE VIEW at a time —
      over a window that slides the whole length of the level. Anything holding station is in view
      while the camera is within a lookahead of it; anything closing is in view for less, so this is
      an upper bound on the sparse case and the floor below is set against that.
    */
    for (const kind of LEVEL_KINDS) {
      const waves = LEVELS[kind].waves;
      let worst = Number.POSITIVE_INFINITY;
      let worstAt = 0;
      /*
        ⚠️ Measured over the BODY of the stage, stopping a lookahead short of the last wave. The
        thinning at the end is the deliberate quiet in front of the boss — `src/content/levels.ts`
        says what it is for — and a guard that flagged it would be flagging the one piece of pacing
        in the level that was decided on purpose.
      */
      const lastWave = waves[waves.length - 1]?.at ?? 0;
      for (let camera = 0; camera + MAX_ALONG_SPAN <= lastWave; camera += 40) {
        let onScreen = 0;
        for (const wave of waves) {
          if (wave.at >= camera && wave.at <= camera + MAX_ALONG_SPAN) onScreen += wave.count;
        }
        if (onScreen < worst) {
          worst = onScreen;
          worstAt = camera;
        }
      }
      expect(
        worst,
        `${kind} thins out to ${worst} enemies in one view at ${worstAt} units in. A scrolling ` +
          'shooter with four things on screen is a screensaver; the player should always have ' +
          'something to be doing.',
      ).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('a boss fight can reach all of its phases', () => {
  it('starts in a phase, whatever its health', () => {
    // A phase table whose first `upTo` is below 1 leaves a full-health boss matching nothing, and
    // `phaseFor` would fall back to the first row anyway — so the failure would be a boss fighting in
    // the wrong phase rather than a crash. Held explicitly for that reason.
    for (const kind of BOSS_KINDS) {
      expect(BOSSES[kind].phases[0]?.upTo, `${kind}'s first phase does not cover a full-health boss`).toBe(1);
    }
  });

  it('every phase is reachable, and they only get harder', () => {
    for (const kind of BOSS_KINDS) {
      const row = BOSSES[kind];
      const seen = new Set<number>();
      // Walk the whole health range the fight passes through and record which phase answers.
      for (let health = row.health; health >= 0; health--) seen.add(row.phases.indexOf(phaseFor(row, health)));
      for (let i = 0; i < row.phases.length; i++) {
        expect(seen.has(i), `${kind}'s phase ${i} can never be entered — its threshold is unreachable`).toBe(true);
      }
      for (let i = 1; i < row.phases.length; i++) {
        const before = row.phases[i - 1]!;
        const after = row.phases[i]!;
        expect(after.upTo, `${kind}'s phases are not ordered from full to empty`).toBeLessThan(before.upTo);
        // Not a claim about the values — a claim that a later phase is never a RELIEF. A boss that
        // eases off as it dies is the opposite of the escalation `docs/game.md` asks a boss for.
        expect(after.fireEvery, `${kind}'s phase ${i} fires slower than the one before it`).toBeLessThanOrEqual(
          before.fireEvery,
        );
        expect(after.shots, `${kind}'s phase ${i} throws less than the one before it`).toBeGreaterThanOrEqual(
          before.shots,
        );
      }
    }
  });

  /**
   * ⚠️ **THE FIGHT, DRIVEN RATHER THAN ARGUED ABOUT.** Everything above reads the tables; this runs
   * the real `GameFrame` over a real `World` with no browser anywhere, which is the claim
   * `docs/decisions/0015-the-layer-ladder.md` makes for keeping the model free of the DOM: *"the
   * predecessor could simulate a whole round headlessly and could not simulate a single second of its
   * boss fight, because the fight was written in the render layer — for a game whose fight IS the
   * product, that is the mistake to not repeat."*
   */
  describe('and it can be fought, start to finish, with nothing but the base weapon', () => {
    /** A level that is nothing but its boss, so the fight is the only thing under test. */
    const soloBoss = { waves: [], bossAt: 200, boss: 'sentinel' as const };

    it('arrives, closes on its station, and then holds it', () => {
      const { world } = playableWorld(soloBoss);
      const frame = new GameFrame(world);
      for (let i = 0; i < 60; i++) frame.step();
      expect(world.bossSpawned, 'the boss never arrived').toBe(true);
      expect(world.bossPool.size, 'the boss is not on the field').toBe(1);

      // Long enough to have closed the distance, and then some.
      for (let i = 0; i < 900; i++) frame.step();
      const settled = world.bossPool.at(0).along - world.cameraAlong;
      expect(settled, 'the boss did not settle at its station').toBeCloseTo(BOSSES.sentinel.station, 0);

      // ⚠️ Holding station is the load-bearing half. A boss parked in WORLD coordinates slides off the
      // back of the screen at the scroll rate, which is the bug that made every off-lane enemy shot
      // miss — `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
      for (let i = 0; i < 600; i++) frame.step();
      expect(world.bossPool.at(0).along - world.cameraAlong, 'the boss drifted out of the camera frame').toBeCloseTo(
        BOSSES.sentinel.station,
        0,
      );
    });

    it('never leaves the lane, however long it patrols', () => {
      // There is no `across` cull, so a boss that turned late is a boss that is gone.
      const { world } = playableWorld(soloBoss);
      const frame = new GameFrame(world);
      const radius = BOSSES.sentinel.radius;
      for (let i = 0; i < 4000; i++) {
        frame.step();
        if (world.bossPool.size === 0) break;
        const across = world.bossPool.at(0).across;
        expect(across - radius, `the boss reached ${across.toFixed(1)} and half of it left the lane`).toBeGreaterThan(-1);
        expect(across + radius).toBeLessThan(ACROSS_SPAN + 1);
      }
    });

    it('shoots back, and harder as it dies', () => {
      const { world } = playableWorld(soloBoss);
      const frame = new GameFrame(world);
      for (let i = 0; i < 1200; i++) frame.step();
      expect(world.enemyShots.size, 'the boss never fired at anything').toBeGreaterThan(0);

      // Drop it into its last phase by hand and count what a volley costs, in shots per step. This is
      // the escalation asserted as behaviour rather than as a table row.
      const boss = world.bossPool.at(0);
      const opening = phaseFor(BOSSES.sentinel, BOSSES.sentinel.health);
      boss.health = 1;
      const ending = phaseFor(BOSSES.sentinel, 1);
      expect(ending.shots / ending.fireEvery, 'the last phase throws no more than the first').toBeGreaterThan(
        opening.shots / opening.fireEvery,
      );
    });

    it('dies to the base weapon, and says so exactly once', () => {
      /*
        ⚠️ **The whole point of the build this landed in.** `docs/game.md` says every arsenal meets
        every phase and a heavier loadout shortens the fight without trivialising it — which is only
        true if the fight is winnable with NO loadout at all. There is no arsenal yet, so this is that
        claim at its hardest, and it is checked rather than hoped for.

        The ship is held immortal: the question here is whether the boss can be killed at all, not
        whether a fixture that never dodges can survive it. Whether a HAND can is a play-test.
      */
      const { world, cleared } = playableWorld(soloBoss);
      const frame = new GameFrame(world);
      /*
        ⚠️ Driven until the level is CLEARED rather than until the pool empties. The first version
        looped `while (bossPool.size > 0)` and the boss had not spawned yet on step zero — so it ran
        no steps at all, and the assertion that the pool was empty passed for entirely the wrong
        reason. A guard that passes before doing anything is the shape 0005 exists to refuse, and it
        got in here anyway.
      */
      let steps = 0;
      // Three minutes of steps is far longer than the fight should need, and finite.
      while (cleared.count === 0 && steps < 10_800) {
        world.ship.health = world.shipRow.health;
        frame.step();
        steps++;
      }
      expect(world.bossSpawned, 'the boss never arrived, so nothing was fought').toBe(true);
      expect(world.bossPool.size, 'the boss survived three minutes of continuous fire').toBe(0);
      expect(cleared.count, 'clearing the level was reported the wrong number of times').toBe(1);

      // And it stays reported once, however long the frame runs on afterwards.
      for (let i = 0; i < 300; i++) frame.step();
      expect(cleared.count, 'the level kept being cleared, every step, forever').toBe(1);
    });
  });

  it('is the biggest thing in the game, and its hurtbox matches what is drawn', () => {
    const extentOf: number[] = [];
    for (const k of SPRITE_KINDS) extentOf[SPRITE[k]] = SPRITE_EXTENT[k];
    for (const kind of BOSS_KINDS) {
      const row = BOSSES[kind];
      const extent = extentOf[row.sprite]!;
      // The same band `tests/combat.test.ts` holds every other body to, applied to the one body that
      // table does not reach. A boss whose hurtbox is its whole silhouette is the unfairest possible
      // version of the unfairness that band exists to prevent.
      const fraction = row.radius / extent;
      expect(fraction, `${kind}'s hurtbox is larger than what is drawn`).toBeLessThanOrEqual(0.55);
      expect(fraction, `${kind}'s hurtbox is much smaller than its sprite, so hits will look wrong`).toBeGreaterThanOrEqual(
        0.25,
      );
      for (const enemy of ENEMY_KINDS) {
        expect(extent, `${kind} is not drawn bigger than a ${enemy}`).toBeGreaterThan(extentOf[ENEMIES[enemy].sprite]!);
      }
    }
  });
});
