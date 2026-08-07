import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS, type WaveEntry } from '../src/content/levels.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { FORMATIONS, FORMATION_KINDS } from '../src/content/formations.ts';
import { BURST } from '../src/content/debris.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { INVULN_STEPS } from '../src/content/ships.ts';
import { phaseFor } from '../src/app/boss.ts';
import { GameFrame, SHIP_START_ALONG, resetScene, respawn } from '../src/app/frame.ts';
import { playableWorld } from './world.ts';
import {
  ACROSS_CULL_MAX,
  ACROSS_CULL_MIN,
  ACROSS_SPAN,
  MAX_ALONG_SPAN,
  ROAM_MAX,
  ROAM_MIN,
} from '../src/sim/camera.ts';
import { SCROLL_PER_STEP, SHIP_SPEED } from '../src/sim/flight.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

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

  it('never puts an enemy where it can leave the ROAM band and be culled', () => {
    /*
      ⚠️ **The bound is the ROAM band and it used to be the dodge lane** —
      `docs/decisions/0059-the-lane-is-the-players-box.md`. What this has always been about is the
      `across` cull: a body outside `ACROSS_CULL_MIN`/`MAX` is gone from the game, so a wave whose
      members can reach it is a wave that silently deletes itself.
      `reports/enemy-silhouettes-2026-08-05.md` named it as the one real gap that came with authored
      spawns, and it was written against the lane because the lane was where everything stayed.

      Enemies now leave the lane on purpose, so the lane cannot be the bound. `ROAM_MIN`/`ROAM_MAX`
      can, and they are strictly inside the cull — which is what keeps the cull meaning *this has
      left the game* rather than becoming a wall.

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
          if (member.across - margin < ROAM_MIN || member.across + margin > ROAM_MAX) {
            offences.push(`${kind} ${wave.enemy} at ${wave.at} reaches ${member.across.toFixed(1)} ± ${margin}`);
          }
        }
      }
    }
    expect(offences, `these can leave the roam band, and nothing brings them back:\n  ${offences.join('\n  ')}`).toEqual(
      [],
    );
  });

  it('and the roam band is strictly inside the cull, so nothing turns round on a wall', () => {
    /*
      ⚠️ **The relationship the test above rests on**, stated where it can fail. If the band ever
      reached the cull, a roaming body would be retired at the moment it turned round — which reads
      as enemies vanishing at the edge of the screen rather than as a bound being wrong.
    */
    expect(ROAM_MIN, 'the roam band reaches the cull').toBeGreaterThan(ACROSS_CULL_MIN);
    expect(ROAM_MAX, 'the roam band reaches the cull').toBeLessThan(ACROSS_CULL_MAX);
    // And it is genuinely OUTSIDE the lane, or the whole change is the tunnel with a wider diameter.
    expect(ROAM_MIN, 'the roam band does not leave the lane').toBeLessThan(0);
    expect(ROAM_MAX, 'the roam band does not leave the lane').toBeGreaterThan(ACROSS_SPAN);
  });

  it('never authors a lane of zero, because zero is what "nowhere to steer to" means', () => {
    /*
      ⚠️ **A sentinel the content must not be able to collide with.** `steerEnemies` reads
      `steerAcross === 0` as *this body is not crossing in from an edge*, which is what lets a
      flanking wave straighten and then roam without the straightening test firing again forever.
      A wave authored at lane 0 would arrive already believing it had arrived.
    */
    for (const kind of LEVEL_KINDS) {
      for (const wave of LEVELS[kind].waves) {
        for (const member of membersOf(wave)) {
          expect(member.across, `${kind} ${wave.enemy} at ${wave.at} is authored on lane zero`).not.toBe(0);
        }
      }
    }
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
   * ⚠️ **THIS GUARD USED TO ASSERT THE OPPOSITE, AND IT WAS WRONG ABOUT THE GAME RATHER THAN ABOUT
   * THE CODE.** It required a wave inside the opening view, because the failure it was written
   * against was a level that began on empty space and stayed that way for eight seconds. That is a
   * real failure and this is not the way to prevent it: play reported the fix as *"the initial row of
   * enemies is too close to the player — the first screen should have no enemies so that the player
   * can orient themselves and test out the ship speed and controls."*
   *
   * Both halves are true at once, and neither is the other's opposite: **nothing on the first screen,
   * and not for long.** The guard is now that pair.
   */
  it('opens on an empty screen, so the player can find the controls first', () => {
    for (const kind of LEVEL_KINDS) {
      const first = LEVELS[kind].waves[0];
      expect(first, `${kind} has no waves`).toBeDefined();
      /*
        `MAX_ALONG_SPAN` and not the 16:9 view: the widest device sees furthest, so a wave that is
        off-screen at 21:9 is off-screen everywhere. Authored against the widest view is the same rule
        `src/sim/camera.ts` gives spawns, for the same reason.
      */
      expect(
        first!.at,
        `${kind}'s first wave is on screen the moment a run begins, so the player is under fire ` +
          'before they have found out which way the ship moves.',
      ).toBeGreaterThan(MAX_ALONG_SPAN);
    }
  });

  it('and does not leave the player waiting', () => {
    // In SECONDS, which is what the complaint would be phrased in. The ship flies 40 units ahead of
    // the camera, so this is when the first wave actually reaches it.
    const unitsPerSecond = SCROLL_PER_STEP * 60;
    for (const kind of LEVEL_KINDS) {
      const first = LEVELS[kind].waves[0]!;
      const seconds = (first.at - 40) / unitsPerSecond;
      expect(seconds, `${kind} leaves the player flying at nothing for ${seconds.toFixed(1)}s`).toBeLessThan(12);
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
      const firstWave = waves[0]?.at ?? 0;
      /*
        ⚠️ **EVERY point where the count can change, not a fixed stride.** This walked in steps of 40
        and that is a sieve: it stepped over a six-enemy trough in level two and only found it once an
        unrelated edit moved where the samples landed.

        ⚠️ **And `at + 1`, not `at` — the first replacement was still wrong.** Density is a step
        function, but its TROUGHS are not at the breakpoints: the count drops the moment a wave leaves
        the view, which is just *past* its `at`. Sampling the boundaries exactly reported the level as
        fine and re-hid the same six. Sampling one unit later finds it.

        ⚠️ It starts at the FIRST wave, because the level now opens on a deliberately empty screen so
        the player can find the controls, and it stops a lookahead short of the last, because of the
        deliberate quiet in front of the boss. Both are pacing that was decided on purpose.
      */
      const points: number[] = [];
      for (const wave of waves) {
        points.push(wave.at + 1, wave.at - MAX_ALONG_SPAN);
      }
      for (const camera of points) {
        if (camera < firstWave || camera + MAX_ALONG_SPAN > lastWave) continue;
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

/**
 * EVERY BOSS IS UNIQUE — `docs/game.md`, and the one line of it a test can hold.
 *
 * `docs/decisions/0071-five-more-levels-and-one-idea-each.md`. *Unique* is mostly a claim about how a
 * fight feels, which nothing here can check. Two things about it ARE checkable, and both are the
 * mistakes that actually get made when a roster grows: a level pointed at a boss another level
 * already uses, and two bosses drawn as the same object.
 */
describe('every level has a boss of its own, and no two of them are the same object', () => {
  it('no boss is fought twice in one run', () => {
    /*
      ⚠️ **The failure is silent and reads as a saving.** A seventh level pointed at the sentinel
      builds, runs, and plays as a repeat of level one with different waves in front of it —
      `docs/game.md`'s *every boss is unique* broken in the one way no compiler can see.
    */
    const fought = LEVEL_KINDS.map((kind) => LEVELS[kind].boss);
    expect(new Set(fought).size, `the run fights ${fought.join(', ')}`).toBe(fought.length);
  });

  it('and no two bosses wear the same hull', () => {
    // The cheapest half of *unique* is the silhouette: it is the first thing a player learns about a
    // boss and the last thing they forget. Two rows sharing a sprite is one fight wearing two names.
    const hulls = BOSS_KINDS.map((kind) => BOSSES[kind].sprite);
    expect(new Set(hulls).size, 'two bosses are drawn as the same shape').toBe(hulls.length);
    const hit = BOSS_KINDS.map((kind) => BOSSES[kind].spriteHit);
    expect(new Set(hit).size, 'two bosses flash as the same shape').toBe(hit.length);
  });

  it('and every level in the sequence is reachable, which is what makes the roster a run', () => {
    // A level nobody can get to is content that does not exist. `src/state/root.ts` ends a run when
    // the level index passes the end of this list, so the list IS the run's length.
    expect(LEVEL_KINDS.length, 'the run is shorter than the two levels that were already here').toBeGreaterThanOrEqual(
      2,
    );
    for (const kind of LEVEL_KINDS) {
      expect(LEVELS[kind].waves.length, `${kind} has no waves`).toBeGreaterThan(0);
      expect(BOSS_KINDS.includes(LEVELS[kind].boss), `${kind}'s boss is not in the table`).toBe(true);
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
    const soloBoss = { waves: [], pickups: [], bossAt: 200, boss: 'sentinel' as const };

    it('arrives, closes on its station, and then holds it', () => {
      const { world } = playableWorld(soloBoss);
      const frame = new GameFrame(world);
      for (let i = 0; i < 60; i++) frame.step();
      expect(world.bossSpawned, 'the boss never arrived').toBe(true);
      expect(world.bossPool.size, 'the boss is not on the field').toBe(1);

      // Long enough to have closed the distance, and then some.
      for (let i = 0; i < 900; i++) frame.step();
      /*
        ⚠️ **A BAND AND NO LONGER A POINT** — `docs/decisions/0061-a-boss-keeps-flying.md`. The
        station drifts along the lane, so *settled* is *inside its own band* rather than *on one
        number*. The tolerance is the drift plus one step of it, because the boss tracks a moving
        target and is a step behind it.
      */
      const room = BOSSES.sentinel.drift + 2;
      const settled = world.bossPool.at(0).along - world.cameraAlong;
      expect(Math.abs(settled - BOSSES.sentinel.station), `the boss settled ${settled.toFixed(1)} out`).toBeLessThan(
        room,
      );

      /*
        ⚠️ Holding station is the load-bearing half. A boss parked in WORLD coordinates slides off the
        back of the screen at the scroll rate, which is the bug that made every off-lane enemy shot
        miss — `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`. Ten seconds
        further on is several full drift cycles, so a boss that had merely *started* on the right
        number would be well behind by now.
      */
      for (let i = 0; i < 600; i++) frame.step();
      const later = world.bossPool.at(0).along - world.cameraAlong;
      expect(Math.abs(later - BOSSES.sentinel.station), 'the boss drifted out of the camera frame').toBeLessThan(room);
    });

    it('and it never stops moving along the lane, which is what a fight is', () => {
      /*
        ⚠️ **THE REPORTED ONE.** *"When a boss reaches mid screen, it just goes up/down and there's no
        longer any flowing movement."* The camera never stops, but everything the player can SEE stops
        moving along it — the boss holds one distance and there is nothing else left on the field.

        ⚠️ **Measured as how much of the SCREEN it covers, in world units against the narrowest view**,
        rather than as a velocity — `docs/decisions/0027-measure-the-picture-not-the-model.md`. A
        velocity that averages to zero is what holding station already looks like; what the report is
        about is the picture.
      */
      const { world } = playableWorld(soloBoss);
      const frame = new GameFrame(world);
      for (let i = 0; i < 960; i++) frame.step();
      let nearest = Number.POSITIVE_INFINITY;
      let furthest = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < 900 && world.bossPool.size > 0; i++) {
        frame.step();
        if (world.bossPool.size === 0) break;
        const onScreen = world.bossPool.at(0).along - world.cameraAlong;
        if (onScreen < nearest) nearest = onScreen;
        if (onScreen > furthest) furthest = onScreen;
      }
      const travelled = furthest - nearest;
      // A tenth of the narrowest screen is the floor: less than that and it is a body breathing
      // rather than flying. Nothing asserts on the value the row actually carries.
      expect(travelled, `the boss covered ${travelled.toFixed(1)} units of the lane while fighting`).toBeGreaterThan(
        (ACROSS_SPAN * 1.5) / 10,
      );
    });

    it('and its arrival is still something the player watches happen', () => {
      /*
        ⚠️ **The half the tracker could have quietly spent.** `src/content/levels.ts` leaves seven
        seconds of quiet in front of a boss *"so that the arrival is something the player watches
        happen"* — and a tracker with no cap on it closes two hundred units in a single step, which
        turns that quiet into an empty screen followed by a boss simply being there.

        In SECONDS, which is the unit the player experiences it in —
        `docs/decisions/0027-measure-the-picture-not-the-model.md`. Nothing here asserts on the
        approach rate.
      */
      const { world } = playableWorld(soloBoss);
      const frame = new GameFrame(world);
      while (!world.bossSpawned) frame.step();
      const arrived = BOSSES.sentinel.station + BOSSES.sentinel.drift;
      let steps = 0;
      while (steps < 2000 && world.bossPool.size > 0 && world.bossPool.at(0).along - world.cameraAlong > arrived) {
        frame.step();
        steps++;
      }
      const seconds = steps / STEPS_PER_SECOND;
      expect(seconds, `the boss covered its whole approach in ${seconds.toFixed(2)}s`).toBeGreaterThan(1.5);
    });

    it('and the whole hull stays on screen on the narrowest device, at every point of the drift', () => {
      /*
        ⚠️ **The bound the drift is authored against, and the reason a PHASE does not scale it.** The
        forward end of the swing is measured against `ACROSS_SPAN * MIN_ASPECT` — the narrowest view
        any device gets (`src/sim/camera.ts`) — so a boss that swung further would put a quarter of
        its hull off the edge of a 3:2 laptop, in the phase the player can least afford it.

        Checked over the TABLE rather than by driving, because it has to hold for every boss including
        the ones nobody has fought.
      */
      for (const kind of BOSS_KINDS) {
        const row = BOSSES[kind];
        const narrow = ACROSS_SPAN * 1.5;
        expect(
          row.station + row.drift + row.radius,
          `${kind} drifts ${(row.station + row.drift + row.radius - narrow).toFixed(1)} units off the narrowest screen`,
        ).toBeLessThanOrEqual(narrow);
        // And the back of the swing never reaches where a life begins, or a respawn is a collision.
        expect(row.station - row.drift - row.radius, `${kind} drifts back onto the ship's start`).toBeGreaterThan(
          SHIP_START_ALONG,
        );
      }
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

    /**
     * A BOSS DIES LOUDLY, AND THE LEVEL DOES NOT END ON THE SAME STEP.
     *
     * `docs/decisions/0062-a-boss-dies-loudly.md`. Reported from play: *"bosses need a real explosion
     * and an end-of-level beat. Currently the level just ends."*
     */
    describe('and it comes apart before the level ends', () => {
      /** Kill the boss as fast as the fixture can, and stop on the step its pool empties. */
      function killTheBoss(): { world: ReturnType<typeof playableWorld> } {
        const built = playableWorld(soloBoss);
        const frame = new GameFrame(built.world);
        for (let i = 0; i < 10_800 && (!built.world.bossSpawned || built.world.bossPool.size > 0); i++) {
          built.world.ship.health = built.world.shipRow.health;
          if (built.world.bossPool.size > 0) built.world.bossPool.at(0).health = 1;
          frame.step();
        }
        return { world: built };
      }

      it('does not report the level cleared on the step the boss stops existing', () => {
        /*
          ⚠️ **THE REPORTED ONE.** The clear used to fire on the exact step the pool emptied, and the
          shell answers a clear by raising a screen over the frame — so the loudest event in the game
          happened behind an overlay, on the frame it started.
        */
        const { world: built } = killTheBoss();
        expect(built.world.bossPool.size, 'the boss is still alive; this measured nothing').toBe(0);
        expect(built.cleared.count, 'the level ended on the same step the boss did').toBe(0);
        expect(built.world.clearedIn, 'nothing is happening between the death and the clear').toBeGreaterThan(0);
      });

      it('scatters fragments over many steps, where the player watched it die', () => {
        /*
          ⚠️ **Over MANY STEPS, which is the whole difference between an explosion and a puff.** One
          burst of any size is over inside half a second and reads exactly like an enemy dying,
          because it is an enemy dying with a bigger number.

          ⚠️ **And in the CAMERA's frame.** The camera covers about 54 units while the beat plays, so
          a remembered WORLD position would put the explosion visibly behind where the boss was.
        */
        const { world: built } = killTheBoss();
        const frame = new GameFrame(built.world);
        // Swept first: the fixture flies into everything and dies repeatedly on the way here, and
        // what is under test is where the BOSS's fragments go.
        built.world.debris.clear();
        const where = built.world.bossOffset;
        let stepsThatAdded = 0;
        let furthest = 0;
        /*
          ⚠️ **Held immortal through the beat, and by a health nothing can reach rather than by a
          reset each step.** The boss's last volley is still in the air; a ship put back to one hit
          every step dies to it every step, and its own burst — 90 units up-lane — is what this
          measurement then finds. Two explosions wearing one name.
        */
        built.world.ship.health = Number.MAX_SAFE_INTEGER;
        // Bounded: a probe that stops the world for the beat would otherwise hang this loop forever,
        // and a guard that never returns is not a guard.
        for (let i = 0; i < 600 && built.world.clearedIn > 0; i++) {
          const before = built.world.debris.size;
          frame.step();
          if (built.world.debris.size > before) stepsThatAdded++;
          for (let i = 0; i < built.world.debris.size; i++) {
            const piece = built.world.debris.at(i);
            const offset = piece.along - built.world.cameraAlong;
            const away = Math.abs(offset - where);
            if (away > furthest) furthest = away;
          }
        }
        expect(stepsThatAdded, 'the boss went up in a single puff').toBeGreaterThan(3);
        /*
          The hull, plus what a fragment can travel in its own lifetime — **relative to the camera**,
          which is the frame the player watches it in. A fragment carries no scroll of its own, so it
          falls back at `SCROLL_PER_STEP` on top of its own speed. Anything beyond this is an
          explosion the scroll has left behind, which is what a remembered WORLD position produces.
        */
        const reach = BOSSES.sentinel.radius * 2 + (BURST.speedMax + SCROLL_PER_STEP) * BURST.lifeMax;
        expect(furthest, `a fragment was ${furthest.toFixed(0)} units from where the boss died`).toBeLessThan(reach);
      });

      it('keeps the world running through the beat, so it is not a pause', () => {
        // ⚠️ The scroll continues, the player still flies, and anything the boss left in the air still
        // arrives — a player can die in the ninety steps after killing it, which is the arcade answer.
        const { world: built } = killTheBoss();
        const frame = new GameFrame(built.world);
        const camera = built.world.cameraAlong;
        for (let i = 0; i < 600 && built.world.clearedIn > 0; i++) frame.step();
        expect(built.world.cameraAlong, 'the world froze for the explosion').toBeGreaterThan(camera);
        expect(built.cleared.count, 'the level was never cleared at all').toBe(1);
      });

      it('does not carry the beat into the next level', () => {
        /*
          ⚠️ **The one this needs a guard for rather than a comment.** A counter left running across
          a level boundary reports the NEXT level cleared a second and a half in, with its own boss
          still ahead of the player — and it would read as a broken run rather than as a stale
          number. `resetScene` clears it; this is what says so.
        */
        const { world: built } = killTheBoss();
        expect(built.world.clearedIn, 'the beat never started; this measures nothing').toBeGreaterThan(0);
        resetScene(built.world);
        built.cleared.count = 0;
        const frame = new GameFrame(built.world);
        // Comfortably longer than the beat, and comfortably shorter than killing a fresh boss.
        for (let i = 0; i < 240; i++) frame.step();
        expect(built.cleared.count, 'a level cleared itself on the last one’s beat').toBe(0);
      });

      it('and the beat is long enough to be watched', () => {
        // In seconds, per 0027. Half a second is a flicker; this is the floor, not the value.
        const { world: built } = killTheBoss();
        expect(built.world.clearedIn / STEPS_PER_SECOND, 'the beat is over before it is noticed').toBeGreaterThan(0.75);
      });
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

/**
 * A DEATH DOES NOT REWIND THE LEVEL.
 *
 * `docs/decisions/0057-a-death-does-not-rewind-the-level.md`. Reported from play: *"when a player
 * dies the entire screen resets, the level shouldn't reset, just the player's power ups."*
 *
 * ⚠️ **The level's own clock never moved, and that is what makes the report interesting.** `nextWave`
 * and the camera both survived a death before this change — what did not survive was everything the
 * player could SEE, because `respawn` swept the field. A rewind and an empty screen are
 * indistinguishable from the cockpit, which is
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`'s point made by a player rather than by
 * a guard.
 */
describe('a death costs the ship and not the level', () => {
  /** Fly until enemies are on the field, then kill the ship where it stands. */
  function intoAFight(): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
    const { world } = playableWorld(LEVELS[LEVEL_KINDS[0]!]);
    const frame = new GameFrame(world);
    for (let i = 0; i < 4000 && world.enemies.size === 0; i++) frame.step();
    expect(world.enemies.size, 'no wave ever arrived, so this test measured nothing').toBeGreaterThan(0);
    return { world, frame };
  }

  it('leaves the enemies where they were, so the screen does not empty', () => {
    /*
      ⚠️ **THE REPORTED ONE.** Sweeping the field is the mercy that reads as a rewind: everything the
      player fought through vanishes, the level goes quiet, and the next wave arrives out of nowhere.
    */
    const { world } = intoAFight();
    const before = world.enemies.size;
    respawn(world);
    expect(world.enemies.size, 'the respawn swept the field, which is what reads as a restart').toBe(before);
  });

  it('and does not rewind the wave table or the camera either', () => {
    // Both were already true. Held here because they are what "the level" MEANS, and a later change
    // that reset them would produce the reported bug again by a different route.
    const { world } = intoAFight();
    const wave = world.nextWave;
    const camera = world.cameraAlong;
    expect(camera, 'the camera never moved, so this asserts nothing').toBeGreaterThan(0);
    respawn(world);
    expect(world.nextWave, 'a death rewound the wave table').toBe(wave);
    expect(world.cameraAlong, 'a death rewound the camera').toBe(camera);
  });

  it('takes away what belonged to the ship that died, and nothing else', () => {
    // 0039's cost, at the smallest scale: a bomb in the air was already spent, and a shot from a ship
    // that no longer exists would be a hit nobody fired.
    const { world } = intoAFight();
    world.playerShots.spawn();
    world.missiles.spawn();
    respawn(world);
    expect(world.playerShots.size, 'a dead ship’s shots outlived it').toBe(0);
    expect(world.missiles.size, 'a dead ship’s missiles outlived it').toBe(0);
  });

  it('comes back harder to kill than a ship that was merely hit', () => {
    /*
      ⚠️ **THE HALF THAT STOPS THIS BEING A PUNISHMENT.** Keeping the field is what the player asked
      for, and it hands the replacement ship a lane still carrying everything that just killed them.
      A hit's 0.75s is sized for a player already flying, with their hand on the ship; a respawn is
      not that, and reusing the number would turn the fix into a second death they never had a hand on.
    */
    const { world } = intoAFight();
    respawn(world);
    expect(world.ship.invulnFor, 'a respawn is no safer than being clipped mid-flight').toBeGreaterThan(
      INVULN_STEPS,
    );
  });

  it('and is invulnerable long enough to fly clear across the lane', () => {
    /*
      ⚠️ **Asserted in the distance the PLAYER covers, not in steps** — 0027. What the window has to
      buy is the ability to leave wherever the ship was put down and find a gap, and the only honest
      measure of that is how much of the lane it crosses at the speed the ship actually flies.
    */
    const { world } = intoAFight();
    respawn(world);
    const reachable = world.ship.invulnFor * SHIP_SPEED;
    expect(reachable, 'the window does not cover the lane, so there is nowhere to escape to').toBeGreaterThan(
      ACROSS_SPAN,
    );
  });
});
