import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS, type WaveEntry } from '../src/content/levels.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import {
  ENGAGE_RANGE,
  FORMATIONS,
  FORMATION_KINDS,
  VOLLEY_SPAN,
  abreastCap,
  gapAcross,
} from '../src/content/formations.ts';
import { BURST } from '../src/content/debris.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { INVULN_STEPS } from '../src/content/ships.ts';
import { curtainSpacing, openBy, phaseFor, uncoilsBy } from '../src/app/boss.ts';
import { BOSS_ATTACK_KINDS, BOSS_MOVE_KINDS, BOSS_STANCE_KINDS } from '../src/content/bosses.ts';
import { BOSS_DEATH_STEPS, GameFrame, SHIP_START_ALONG, advanceLevel, resetScene, respawn } from '../src/app/frame.ts';
import { ASSIST_LADDER, DEFAULT_ASSISTS, tuningFor } from '../src/sim/assist.ts';
import { SHOTS } from '../src/content/shots.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';
import {
  ACROSS_CULL_MAX,
  ACROSS_CULL_MIN,
  ACROSS_SPAN,
  MAX_ALONG_SPAN,
  MIN_ASPECT,
  ROAM_MAX,
  ROAM_MIN,
} from '../src/sim/camera.ts';
import { SCROLL_PER_STEP, SHIP_SPEED } from '../src/sim/flight.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { MAX_BARRELS, SPREAD_STEP, UPGRADE_TIERS, weaponFor } from '../src/content/pickups.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { SHIPS } from '../src/content/ships.ts';
import { BAR_SECONDS } from '../src/content/music.ts';

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
  // The wave's own body decides its spacing — 0143, and a wave is a single kind. Both offsets take
  // it now, because 0202 derives how deep a wave is from how wide its bodies are.
  const gap = gapAcross(ENEMIES[wave.enemy].radius);
  for (let i = 0; i < wave.count; i++) {
    out.push({
      along: wave.at + formation.alongOffset(i, wave.count, gap),
      across: wave.lane + formation.acrossOffset(i, wave.count, gap),
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
        /*
          ⚠️ **Only a WEAVE has a bound this test can compute, and after 0073 that is a statement
          about the union rather than about a zero.** A drift turns round at the band by
          construction; the three reactive motions steer towards a ship that is always inside the
          lane, so their bound is the player's box rather than an amplitude. What is left needing an
          authored margin is the one motion whose path is a shape: the weaver.
        */
        const swing = row.motion.kind === 'weave' ? row.motion.amplitude : 0;
        const margin = row.radius + swing * 2;
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

      ⚠️ **THE FLOOR MOVED BECAUSE THE PRODUCT TARGET DID, NOT TO FIT A NUMBER** —
      `docs/decisions/0114-the-fight-is-a-different-piece.md`. This said *"two minutes is a floor and
      not the target; `docs/game.md` asks for ~3 minutes of stage per level"* — and the player has cut
      the level twice from play, the second time saying *"it still took me 3 minutes"* about a stage
      that was already down to 146 seconds. `docs/game.md` now asks for ~2 minutes, so the floor that
      was derived from three has to be derived from two.

      ⚠️ **100 seconds, and it is still a FLOOR rather than a target.** It fails only if a level has
      quietly become a slice of one — which is what this guard has always been for, and the reason it
      is not simply deleted now that shorter is the goal: *shorter* and *gone* are different, and
      nothing else in the repository would notice the difference.
    */
    const unitsPerSecond = SCROLL_PER_STEP * 60;
    for (const kind of LEVEL_KINDS) {
      const seconds = LEVELS[kind].bossAt / unitsPerSecond;
      expect(seconds, `${kind} is only ${seconds.toFixed(0)}s of stage before its boss`).toBeGreaterThan(100);
    }
  });

  it('every wave is spawnable — the pool can hold it and the formation fits the horizon', () => {
    // A wave wider than the spawn horizon would have members visible at the moment they appear.
    // `src/sim/camera.ts` places the horizon beyond the widest view any device can have, and a
    // formation's own depth is the one thing that can reach back out of it.
    for (const kind of LEVEL_KINDS) {
      for (const wave of LEVELS[kind].waves) {
        // ⚠️ MAX MINUS MIN OVER EVERY MEMBER, not last minus first. 0202 folds a wide wave into
        // ranks, so the deepest member is no longer the last one — a vee's point is its shallowest
        // and sits in the middle of its rank. The old subtraction read a vee's two arms, which are
        // the same depth, and would now report a two-rank wave as flat.
        const depth = Math.max(...membersOf(wave).map((m) => m.along)) - Math.min(...membersOf(wave).map((m) => m.along));
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
describe('0100 — a level that is not the first one still puts its script on the screen', () => {
  /*
    `docs/decisions/0100-a-level-places-its-pickups-too.md`. Reported from play: *"I didn't get a
    single power up after level 1."*

    ⚠️ **EVERY GUARD IN THIS REPOSITORY RAN LEVEL ONE, WHERE `levelOrigin` IS ZERO.**
    `docs/decisions/0076-a-level-has-an-origin.md` made a level's script relative to wherever the
    camera had got to, and translated the waves and the boss and not the pickups — so on level two the
    nine authored pickups were placed fifteen hundred units behind the camera and culled on the step
    they spawned. The term that was missing is invisible at an origin of zero, which is the only
    origin anything had ever tested.

    ⚠️ **AND THE BOUNDARY IS DRIVEN BY THE SHELL**, so a `GameFrame` fixture never crosses one on its
    own. `advanceLevel` is exported and this calls it, which is the whole of what was needed and had
    never been done.

    ⚠️ **Held over EVERY level as a second level, not just over level two.** The failure is a property
    of the placement code rather than of any level's content, so what makes the guard general is
    driving each level's script at a non-zero origin.
  */
  it('0100 — THE REPORTED ONE: every authored pickup reaches the screen, at a non-zero origin', () => {
    for (const kind of LEVEL_KINDS) {
      const { world } = playableWorld(LEVELS.approach);
      const frame = new GameFrame(world);
      // Fly far enough that the origin is unmistakably not zero, then do what the shell does.
      for (let i = 0; i < 3000; i++) {
        world.fireIn = Number.MAX_SAFE_INTEGER;
        frame.step();
      }
      expect(world.levelOrigin, 'the fixture never moved, so this is testing an origin of zero').toBe(0);
      advanceLevel(world, LEVELS[kind], 1);
      expect(world.levelOrigin, 'the boundary did not set an origin').toBeGreaterThan(1000);

      /*
        ⚠️ **Measured AT THE INSTANT OF SPAWN, in world units ahead of the camera.** That is where the
        defect lives and it is the only moment a pickup has an identity a test can hold: a pickup's
        `along` changes every step, and the pool recycles slots, so *was this one ever on screen* needs
        bookkeeping the frame does not offer. Where it was PUT is the whole question —
        `docs/decisions/0027-measure-the-picture-not-the-model.md`: the model was perfectly happy, and
        `nextPickup` reached the end of the list either way.

        ⚠️ **Ahead of the camera, and not further than the spawn horizon.** Both ends matter: the
        defect placed them fifteen hundred units behind, and the mirror-image mistake — adding the
        origin twice — would place them thousands ahead and they would never arrive either.
      */
      const placed: number[] = [];
      let before = world.pickups.size;
      for (let i = 0; i < 30000; i++) {
        world.fireIn = Number.MAX_SAFE_INTEGER;
        frame.step();
        if (world.pickups.size > before) placed.push(world.pickups.at(world.pickups.size - 1).along - world.cameraAlong);
        before = world.pickups.size;
        if (world.nextPickup === LEVELS[kind].pickups.length && world.pickups.size === 0 && placed.length > 0) break;
      }
      expect(placed.length, `${kind} as a second level spawned no pickups at all`).toBe(LEVELS[kind].pickups.length);
      const behind = placed.filter((inView) => inView <= 0);
      expect(
        behind.length,
        `${kind} as a second level placed ${behind.length} of its ${placed.length} pickups BEHIND the camera` +
          (behind.length > 0 ? ` — the furthest by ${Math.abs(Math.min(...behind)).toFixed(0)} units` : ''),
      ).toBe(0);
      const furthest = Math.max(...placed);
      expect(
        furthest,
        `${kind} as a second level placed a pickup ${furthest.toFixed(0)} units ahead, past the spawn horizon`,
      ).toBeLessThan(MAX_ALONG_SPAN * 2);
    }
  });

  it('0100 — and the dial only counts a weapon the player was actually shown', () => {
    /*
      ⚠️ **THE HALF OF THIS DEFECT NOBODY COULD SEE, and it is a difficulty bug rather than a pickup
      one.** `weaponsOffered` increments where a pickup is placed, and
      `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md` reads it as *what this level has
      offered*. With the placement wrong, the counter climbed on schedule for weapons that were never
      on the screen — so from level two onward the game raised its own difficulty for pickups the
      player never got the chance to take.

      ⚠️ **Held as *the dial's count and the visible count agree***, which is the property rather
      than the arithmetic: 0084's own comment says a pickup the field had no room for was not
      offered, and one placed behind the camera is the same thing said louder.
    */
    const { world } = playableWorld(LEVELS.approach);
    const frame = new GameFrame(world);
    for (let i = 0; i < 3000; i++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      frame.step();
    }
    advanceLevel(world, LEVELS.descent, 1);
    let shown = 0;
    let before = world.pickups.size;
    for (let i = 0; i < 30000; i++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      frame.step();
      if (world.pickups.size > before) {
        const item = world.pickups.at(world.pickups.size - 1);
        if (item.kind === world.pickupKinds.weapon && item.along - world.cameraAlong > 0) shown++;
      }
      before = world.pickups.size;
      if (world.nextPickup === LEVELS.descent.pickups.length && world.pickups.size === 0 && i > 100) break;
    }
    expect(world.weaponsOffered, 'the dial counted nothing, so this measured nothing').toBeGreaterThan(0);
    expect(
      shown,
      `the dial counted ${world.weaponsOffered} weapon pickups and ${shown} of them were placed where the player could see one`,
    ).toBe(world.weaponsOffered);
  });
});

describe('every level has a boss of its own, and no two of them are the same object', () => {
  it('no boss is fought twice in one run', () => {
    /*
      ⚠️ **The failure is silent and reads as a saving.** A seventh level pointed at the sentinel
      builds, runs, and plays as a repeat of level one with different waves in front of it —
      `docs/game.md`'s *every boss is unique* broken in the one way no compiler can see.
    */
    // ⚠️ Mid-bosses too, since 0247: a run is fourteen fights, and a mid-boss fought again as an end
    // boss two levels on is the same repeat wearing a smaller health bar.
    const fought = LEVEL_KINDS.flatMap((kind) => {
      const level = LEVELS[kind];
      return level.midBoss === null ? [level.boss] : [level.midBoss.kind, level.boss];
    });
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
        /*
          ⚠️ **A `bare` PHASE IS NOT EXEMPT FROM THIS AND THAT COST A DESIGN CHANGE TO ARRANGE** —
          `docs/decisions/0150-the-uncoil-and-the-eye.md`. Its first draft zeroed the fan on a phase
          that does not throw one, which would have needed an exemption here — and
          `docs/decisions/0148-a-place-has-its-own-notes.md` is the standing warning about exactly
          that: the guard it found had been widened past its own reason by an exemption nobody argued.
          A bare row now carries the fan it would have thrown and is silenced by its stance, so these
          two lines still hold over every phase in the game.
        */
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
    const soloBoss = { waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: 'sentinel' as const, theme: 'approach' as const };

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
        its hull off the edge of the squarest screen the clamp still allows, in the phase the player
        can least afford it.

        ⚠️ **It read `1.5` and now reads the constant, which LOOSENS it** —
        `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md` raised the floor to 16:9,
        so the narrowest view is 177.8 rather than 150 and every boss has 28 more units of room it did
        not have. That is the honest bound rather than a tighter one kept out of habit: what this
        guards is *the hull stays on the narrowest screen*, and the narrowest screen moved.

        Checked over the TABLE rather than by driving, because it has to hold for every boss including
        the ones nobody has fought.
      */
      for (const kind of BOSS_KINDS) {
        const row = BOSSES[kind];
        const narrow = ACROSS_SPAN * MIN_ASPECT;
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

    it('0101 — and it leaves the player more than half the screen, at the NEAR end of the swing', () => {
      /*
        `docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`. Reported from play: *"the
        bosses come too far into the screen, they come into 50% and then basically float at that level
        and it doesn't give the player enough space to respond."*

        ⚠️ **THE FLOOR THIS FILE HAS NEVER HAD, and the ceiling above is why it was missed.** The
        assertion before this one holds the FORWARD end of the swing on the narrowest screen, and its
        own comment has been saying *"every boss has 28 more units of room it did not have"* since
        0080 widened the view from 150 to 177.8. Nothing held the near end at all except *do not land
        on the ship's start* — so every boss was free to drift back into the player's half, and five
        of the seven did. The axis reached **37% of the screen**.

        ⚠️ **Measured at `station − drift − radius`, which is the closest the hull's trailing edge ever
        comes**, and expressed as a share of the narrowest view — which is the unit the report used.
        A station on its own says nothing: a boss with a small drift can sit further forward and still
        crowd less than one with a large drift sitting further back.

        ⚠️ **55% and not 50%.** The report names the number it observed rather than the number it
        wants, and a floor exactly at the complaint is a floor that permits the complaint. The seven
        now sit between 58% and 67%.
      */
      const narrow = ACROSS_SPAN * MIN_ASPECT;
      for (const kind of BOSS_KINDS) {
        const row = BOSSES[kind];
        const nearest = row.station - row.drift - row.radius;
        expect(
          nearest / narrow,
          `${kind} comes within ${((nearest / narrow) * 100).toFixed(0)}% of the narrowest screen, which is the ` +
            'half the player is flying in',
        ).toBeGreaterThan(0.55);
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
      /*
        ── THE BOUND IS A SOFTLOCK CHECK NOW, AND IT USED TO BE A PACING CLAIM ─────────────────────

        ⚠️ **`docs/decisions/0124-the-boss-is-a-boss.md`.** Three minutes was *"far longer than the
        fight should need"* — true when a boss had 150 health, and a **design assumption** rather than
        a measurement. The player has since set the balance target explicitly: *"if you get to the
        boss with level 1 weapons, you can take your time or start over… the overall game is short so
        restarting isn't really a penalty."*

        ⚠️ **So the bare fight is deliberately long and this is no longer the guard that says how
        long.** What it still holds is `docs/game.md`'s claim that the fight is winnable with no
        loadout at all — a softlock would be a run that cannot be finished, and that is what a
        generous ceiling catches. **How long a fight SHOULD be is now held at the design loadout**,
        in the guard below this one.
      */
      let steps = 0;
      while (cleared.count === 0 && steps < 30_000) {
        world.ship.health = world.shipRow.health;
        frame.step();
        steps++;
      }
      expect(world.bossSpawned, 'the boss never arrived, so nothing was fought').toBe(true);
      expect(world.bossPool.size, 'the boss cannot be killed by the base weapon at all — the run is stuck').toBe(0);
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

/**
 * A world whose whole level is one boss, stepped by the real frame.
 *
 * ⚠️ **The ship cannot die and the boss cannot be killed by it**, because everything below is about
 * how a boss FLIES and SHOOTS — a fight that ends is a fight that stopped measuring. The boss keeps
 * its authored health so that `phaseFor` still answers, and only the fixture that is about a phase
 * change moves it.
 */
function bossFight(kind: (typeof BOSS_KINDS)[number]): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
  const { world } = playableWorld({ waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: kind, theme: 'approach' });
  const frame = new GameFrame(world);
  world.ship.health = 1e9;
  /*
    ⚠️ **Stepped until the boss is actually ON THE FIELD, and the first draft of this was not.** A
    boss arrives when the horizon reaches its `at`, so `bossPool.size` is zero for the first second
    of every fixture — and three guards written as `while the boss exists` ran zero iterations and
    reported `Infinity`. It is the same shape `tests/spawns.test.ts` records for a loop that broke
    out on step zero.
  */
  for (let i = 0; i < 60 * 20 && world.bossPool.size === 0; i++) frame.step();
  return { world, frame };
}

describe('0111 — a boss has one idea, and the picture mentions its phases', () => {
  /*
    `docs/decisions/0111-a-boss-has-one-idea.md`. Reported from play: *"level 4 (or it might have been
    5) was the only boss with a different attack. The rest of them either had thick or thin bullets
    and that was the only difference."*

    ⚠️ **`docs/state-of-play.md` PREDICTED THIS REPORT IN WRITING** — *"one behaviour with seven
    silhouettes on it"* — and it was an accurate reading of `stepBoss`.
  */

  it('THE REPORTED ONE: no two mid-bosses fly the same way AND shoot the same way, and no two real bosses do either', () => {
    /*
      ⚠️ **The pair, not either half, which is what makes seven fights seven fights.** Two bosses may
      share a movement, and two may share an attack — what may not happen is two rows a player cannot
      tell apart by what the fight ASKS of them.

      ⚠️ **TWO SETS SINCE 0258, AND THE ARITHMETIC IS WHY.** 0111 held the pair unique over seven
      rows with three movements and five fans — fifteen pairs. 0247 made it fourteen rows, and 0258
      took the stalk from every hull but one and the aimed fan from all of them: two flights and
      four fans is eight pairs, and fourteen rows cannot each have one. What the mid-bosses are is
      their pair — the old seven, one idea each — so the pair is unique over them; a real boss is its
      own attack (a rain, a whip, a beam, a spin, a cold, heads, tendrils), held below, and the pair
      is unique over the real seven as well so that no two of THEM ask the same thing either.

      ⚠️ **It says nothing about the bullet, deliberately.** 0098 already holds that, and *"thick or
      thin bullets was the only difference"* is the report that the bullet is not enough.
    */
    const mids = LEVEL_KINDS.map((k) => LEVELS[k].midBoss!.kind);
    const reals = LEVEL_KINDS.map((k) => LEVELS[k].boss);
    for (const [name, set] of [
      ['mid-bosses', mids],
      ['real bosses', reals],
    ] as const) {
      const ideas = set.map((kind) => `${BOSSES[kind].move.kind}/${BOSSES[kind].attack.kind}`);
      expect(new Set(ideas).size, `two ${name} fly and shoot identically (${ideas.join(', ')})`).toBe(set.length);
    }
    expect(new Set([...mids, ...reals]).size, 'a boss is fought twice in the run').toBe(BOSS_KINDS.length);
  });

  it('and every real boss has an attack of its own that no other real boss sends', () => {
    /*
      The half of *one idea each* that the pair can no longer carry for the real seven — 0258. A
      real boss is told from the others by what only it throws: a phase's own attack kind, or a
      mechanism on the row — the fall, the cold, the spinning curtain.
    */
    // The fans are the shared vocabulary; a mark is anything else a fight throws.
    const fans = new Set<string>(['spray', 'rake', 'ring', 'wall']);
    const marksOf = new Map<string, Set<string>>();
    for (const level of LEVEL_KINDS) {
      const kind = LEVELS[level].boss;
      const row = BOSSES[kind];
      const marks = new Set<string>();
      for (const phase of row.phases) if (phase.attack !== null && !fans.has(phase.attack.kind)) marks.add(phase.attack.kind);
      if (row.fall !== null) marks.add(`fall:${row.fall.kind}`);
      if (row.chill !== null) marks.add('chill');
      if (row.uncoil !== null && row.uncoil.spin) marks.add('spin');
      expect(marks.size, `${kind} has nothing of its own beyond its flight and its fan`).toBeGreaterThan(0);
      marksOf.set(kind, marks);
    }
    // Two real bosses may share a mark — the eagle and the frost ship both summon — but each has one
    // the other six do not, which is what *one idea each* means for the real seven.
    for (const [kind, marks] of marksOf) {
      const others = [...marksOf].filter(([k]) => k !== kind).flatMap(([, m]) => [...m]);
      const alone = [...marks].filter((mark) => !others.includes(mark));
      expect(alone.length, `${kind} throws only what another real boss throws too (${[...marks].join(', ')})`).toBeGreaterThan(0);
    }
  });

  it('and every arm of both unions is flown by somebody, so neither can fill up with the unused', () => {
    // The same rule the motion and attack unions already carry in `src/content/enemies.ts`.
    const moves = new Set(BOSS_KINDS.map((k) => BOSSES[k].move.kind));
    expect(BOSS_MOVE_KINDS.filter((m) => !moves.has(m)), 'a boss movement exists and nothing flies it').toEqual([]);
    // A phase's own attack counts as sent — 0248: the serpent's lightning is a phase's and no row's.
    const attacks = new Set(BOSS_KINDS.flatMap((k) => [BOSSES[k].attack.kind, ...BOSSES[k].phases.map((p) => (p.attack ?? BOSSES[k].attack).kind)]));
    expect(BOSS_ATTACK_KINDS.filter((a) => !attacks.has(a)), 'a boss attack exists and nothing sends it').toEqual([]);
  });

  it('and a bob is up-and-down: the hull crosses the lane and comes back, in world units', () => {
    /*
      ⚠️ **THE THING THE REPORT ASKED FOR BY NAME**, driven through the real frame and measured in the
      units it was asked for. A `bob` whose velocity was written as a position, or whose rate came out
      as zero, would leave a boss sitting still — and every other guard about bosses is about where it
      settles ALONG the lane, so none of them would notice.
    */
    for (const kind of BOSS_KINDS.filter((k) => BOSSES[k].move.kind === 'bob')) {
      const { world, frame } = bossFight(kind);
      let lowest = Number.POSITIVE_INFINITY;
      let highest = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < 60 * 30 && world.bossPool.size > 0; i++) {
        frame.step();
        if (world.bossPool.size === 0) break;
        const across = world.bossPool.at(0).across;
        lowest = Math.min(lowest, across);
        highest = Math.max(highest, across);
      }
      const swing = highest - lowest;
      const move = BOSSES[kind].move;
      const want = move.kind === 'bob' ? move.amplitude : 0;
      /*
        ⚠️ **Against the AMPLITUDE the row authored rather than a number typed here** — a full cycle is
        `2 × amplitude` of travel, and half of that is a floor loose enough to survive a fight that
        ends early and tight enough to refuse a hull that barely moves.
      */
      expect(swing, `${kind} swings ${swing.toFixed(1)} units across the lane in half a minute`).toBeGreaterThan(want);
    }
  });

  it('and a stalker follows the player’s lane, which a patrol does not', () => {
    /*
      ⚠️ **Held as *does it end up where the player is*, driven with the ship parked somewhere the boss
      did not start.** A stalk written as a patrol still moves, still reverses and still passes every
      other assertion; what separates them is whether the hull cares where the ship is.
    */
    for (const kind of BOSS_KINDS.filter((k) => BOSSES[k].move.kind === 'stalk')) {
      const { world, frame } = bossFight(kind);
      const lane = 12;
      let gap = Number.POSITIVE_INFINITY;
      for (let i = 0; i < 60 * 30 && world.bossPool.size > 0; i++) {
        world.ship.across = lane;
        frame.step();
        if (world.bossPool.size === 0) break;
        gap = Math.min(gap, Math.abs(world.bossPool.at(0).across - lane));
      }
      expect(gap, `${kind} never got closer than ${gap.toFixed(1)} units to the lane the ship was sitting in`).toBeLessThan(
        BOSSES[kind].radius,
      );
    }
  });

  it('and a pattern is the same pattern wherever the player is, exactly as an enemy’s is', () => {
    /*
      ⚠️ **THE SAME PROPERTY 0110 HOLDS FOR ENEMIES, ON THE HALF OF THE GAME IT COULD NOT REACH.** A
      fan centred on the ship is *aimed* however wide it is and however many shots are in it, and
      *"spray attack that increases number of bullets as health goes down"* is not answered by a
      spread that follows the player. Two fights, two ship lanes, one set of headings.
    */
    // Every boss, since 0258 deleted the aimed fan from the union.
    for (const kind of BOSS_KINDS) {
      const headings: string[][] = [];
      for (const lane of [15, 85]) {
        const { world, frame } = bossFight(kind);
        const seen: string[] = [];
        for (let i = 0; i < 60 * 40 && seen.length === 0; i++) {
          world.ship.across = lane;
          frame.step();
          if (world.bossPool.size === 0) break;
          for (let s = 0; s < world.enemyShots.size; s++) {
            const shot = world.enemyShots.at(s);
            seen.push(Math.atan2(shot.velAcross, shot.velAlong - world.scrollPerStep).toFixed(3));
          }
        }
        expect(seen.length, `${kind} never fired, so this measured nothing`).toBeGreaterThan(0);
        headings.push(seen.sort());
      }
      expect(
        headings[0],
        `${kind}'s volley changes shape depending on where the ship is, which makes it a spread rather than a pattern`,
      ).toEqual(headings[1]);
    }
  });

  it('THE OTHER REPORTED ONE: a phase change is an event the picture mentions', () => {
    /*
      ⚠️ **`docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` unapplied on the
      most-watched event in a level, and asked for in play**: *"they need to have chunks and pieces fly
      off when they change states."* From the step a phase turns over the boss fires wider, faster and
      flies differently — and until 0111 nothing on screen or in the mix said so.

      ⚠️ **Measured as debris appearing on the step the phase changes**, driven through the real frame
      with the boss damaged rather than by calling `phaseFor`. A guard that asked the model would be
      asking the half that already knew.
    */
    const { world, frame } = bossFight('sentinel');
    expect(world.bossPool.size, 'the boss never arrived, so this measured nothing').toBe(1);
    /*
      ⚠️ **A few steps of the fight before anything is damaged, and the reason is the mechanism.** The
      FIRST step a boss is on the field is a phase change from *no boss* to *phase one*, and it
      deliberately sheds nothing — `bossPhaseAt` starts at −1 and the burst is suppressed for exactly
      that transition. A fixture that damaged the hull on the spawn step would be measuring the
      arrival rather than a change, and it reported zero.
    */
    for (let i = 0; i < 30; i++) frame.step();
    expect(world.bossPhaseAt, 'the fight never started, so no phase has been recorded').toBe(0);
    const boss = world.bossPool.at(0);
    const phases = BOSSES.sentinel.phases;
    expect(phases.length, 'the sentinel has one phase, so it can never change').toBeGreaterThan(1);
    /*
      ⚠️ **Dropped just past the SECOND phase's threshold**, so the very next step is the one the
      change happens on — `driveBoss` compares the phase either side of `stepBoss`.
    */
    boss.health = Math.floor(world.bossFullHealth * phases[1]!.upTo) - 1;
    const before = world.debris.size;
    frame.step();
    expect(
      world.debris.size - before,
      'a boss crossed a health threshold and shed nothing — the phase change is invisible',
    ).toBeGreaterThan(0);
  });
});

/**
 * A WAVE DIES TOGETHER — `docs/decisions/0121-a-wave-dies-together.md`.
 *
 * ⚠️ **Reported from play**: *"I'd like the individual waves to have tighter clusters of enemies —
 * when they're spread far apart the music beats have less impact if you kill 1-2 enemies than if you
 * kill 3-5."* That is a claim about
 * [0109](../docs/decisions/0109-a-death-is-a-drum.md): a death is a drum, and a drum struck once is
 * not the same event as a drum struck five times.
 */
describe('0121 — a wave is close enough to die together', () => {
  /**
   * How wide the player's volley is `ahead` units in front of the nose.
   *
   * ⚠️ **Derived from the fan the game actually fires** — `SPREAD_STEP` per barrel, `MAX_BARRELS`
   * barrels — rather than from a number typed here. A weapon retuned is a wave that has to be
   * re-measured, and this is what says so.
   */
  const volleyWidth = (ahead: number): number => 2 * ahead * Math.tan((SPREAD_STEP * (MAX_BARRELS - 1)) / 2);

  /**
   * About where a wave is engaged: far enough that the player has seen it, close enough to shoot.
   *
   * ⚠️ **A STATED CHOICE AND NOT A MEASUREMENT**, so it is named rather than left to look like one.
   * A body appears eleven units in front of the player's box
   * ([0105](../docs/decisions/0105-a-body-is-on-screen-long-enough-to-answer.md)) and the box is about
   * 157 deep, so anywhere from a few units to well over a hundred is reachable. Fifty is the middle of
   * where a player who is pressing forward meets one.
   *
   * ⚠️ **IT IS `ENGAGE_RANGE` NOW AND NOT A SECOND COPY OF IT** —
   * [0202](../docs/decisions/0202-a-wave-is-as-wide-as-the-volley.md). This file derived the fan and
   * named the range months before `src/content/formations.ts` needed either, and when the source
   * finally did, the honest move was to promote these rather than write them twice.
   * `docs/decisions/0029-the-tracked-record-is-the-record.md`: a second copy drifts.
   */
  const ENGAGED_AT = ENGAGE_RANGE;

  it('the source and this file agree about the fan, which is the point of importing it', () => {
    // Cheap, and it is the one assertion that would catch the promotion above being undone by a
    // future edit that re-typed either number locally.
    expect(volleyWidth(ENGAGED_AT)).toBeCloseTo(VOLLEY_SPAN, 10);
  });

  it('THE REPORTED ONE: a volley reaches three abreast, where it used to reach two', () => {
    /*
      ⚠️ **THE ASK IN THE PLAYER'S OWN UNITS — bodies per volley, not world units** —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`'s rule about a guard written over the
      quantity it guards. A bound on `ACROSS_GAP` would prove the constant equals itself; this asks
      how many things one trigger pull can reach.
    */
    const width = volleyWidth(ENGAGED_AT);
    /*
      ⚠️ **HELD FOR EVERY KIND NOW, WHICH IS WHAT 0143 CHANGED** — the gap is the wave's own body
      rather than one constant sized for the widest enemy in the game, so *three abreast* is seven
      separate claims and the widest of them is the one that used to be the only one.
    */
    /*
      ⚠️ **`abreastCap` AND NOT A SPAN SUBTRACTION, SINCE 0202.** This read
      `acrossOffset(count - 1) - acrossOffset(0)`, which was the span while every wave was one rank
      and is NOT the span now that a wide one folds: member `count - 1` sits in the LAST rank, so the
      subtraction silently compares two different rows and reports a fold as narrow. It would have
      answered *yes, a volley reaches four wardens* — 9 units — where the truth is three abreast and
      one behind. A guard reading the wrong quantity is
      `docs/decisions/0027-measure-the-picture-not-the-model.md`, and this is the shape a probe cannot
      catch, because the break and the guard would share an author.
    */
    for (const kind of ENEMY_KINDS) {
      const gap = gapAcross(ENEMIES[kind].radius);
      const abreast = abreastCap(gap);
      expect(
        abreast,
        `a volley ${width.toFixed(1)} wide at ${ENGAGED_AT} reaches only ${abreast} ${kind}s abreast at a ` +
          `gap of ${gap.toFixed(1)} — a wave still dies one at a time, which is what the report is about`,
      ).toBeGreaterThanOrEqual(3);
      // And the cap is honest: that many really do fit inside the fan.
      expect((abreast - 1) * gap).toBeLessThanOrEqual(width);
    }
  });

  it('0143 — AND THE NARROW BODIES REACH FOUR, which is what a repeat report bought', () => {
    /*
      ⚠️ **THE ASK AS A QUANTITY** — *"ideally a player should be able to take out a group together
      and get a nice music reward."* 0121 tightened one constant to the tightest the WIDEST enemy
      allows and charged every wave that price; a wave of diamonds was spaced as though a warden were
      in it. Three kinds now fit four inside one volley where they fit three.

      ⚠️ **Named as a count and not as a gap**, on the same terms as the guard above: a bound on the
      spacing would prove the arithmetic equals itself.
    */
    // ⚠️ `abreastCap` since 0202, for the reason given in the guard above: the span subtraction
    // reads across two ranks once a wave folds, and would call every kind a four.
    const reaches = (kind: (typeof ENEMY_KINDS)[number], count: number): boolean =>
      abreastCap(gapAcross(ENEMIES[kind].radius)) >= count;
    const four = ENEMY_KINDS.filter((k) => reaches(k, 4));
    expect(
      four,
      `no enemy is narrow enough for a volley to reach four of it — the widest-body spacing is still being charged to every wave`,
    ).not.toEqual([]);
    // The drifter is the one the report named, by its silhouette: *"grouped tighter for diamonds"*.
    expect(reaches('drifter', 4), 'a volley still reaches only three drifters').toBe(true);
  });

  it('0202 — EVERY WAVE IN THE GAME fits inside one volley, which 324 of them did not', () => {
    /*
      ⚠️ **THE ONE THE OTHER TWO COULD NOT SEE.** The two guards above ask what a volley reaches for a
      given BODY. Neither of them ever looked at a wave a level actually authored, so both were green
      across 492 waves of which **324 were wider than the fan and 209 could not have been fixed by any
      spacing at all** — the hulls intersect before they fit. 0121 and 0143 both measured green and the
      report came back twice, which is
      `docs/decisions/0027-measure-the-picture-not-the-model.md` exactly: the model was right about
      the thing it was measuring and nobody measured the picture.

      ⚠️ **AN INVARIANT, NOT A BUDGET** — `docs/decisions/0192-a-guard-holds-an-invariant.md`. Name a
      change to the content that would redden this and be correct: there is none. A wave wider than
      the volley cannot be killed as a group, and killing a group as a group is what
      `docs/decisions/0109-a-death-is-a-drum.md` spends the whole percussion layer on.
    */
    const width = volleyWidth(ENGAGED_AT);
    const tooWide: string[] = [];
    for (const kind of LEVEL_KINDS) {
      for (const wave of LEVELS[kind].waves) {
        const across = membersOf(wave).map((m) => m.across);
        const span = Math.max(...across) - Math.min(...across);
        if (span > width + 1e-9) {
          tooWide.push(`${kind} @${wave.at} ${wave.enemy}×${wave.count} ${wave.formation} spans ${span.toFixed(1)}`);
        }
      }
    }
    expect(
      tooWide,
      `these waves are wider than the ${width.toFixed(2)}-unit volley, so they cannot die together`,
    ).toEqual([]);
  });

  it('and they still do not overlap, which is what stops it going tighter', () => {
    /*
      ⚠️ **THE OTHER END OF THE SAME ARITHMETIC, and it is why five abreast is not on offer.** Five
      inside one volley needs a gap under five units, and the widest hurtbox in the game is four —
      neighbours would touch. [0081](../docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)
      is what that spends and it is not for sale.

      ⚠️ **Driven off `ENEMIES` rather than a typed 4**, so a wider body tomorrow moves this rather
      than quietly invalidating it.
    */
    /*
      ⚠️ **PER KIND SINCE 0143, WHICH IS STRICTLY STRONGER.** It used to compare one gap against the
      widest body in the game — true, and silent about whether a narrow wave had any air at all. Now
      every kind is asked about its own neighbours, so a tightening that closed one body's gap while
      the warden's stayed legal fails here.
    */
    const line = FORMATIONS.line;
    for (const kind of ENEMY_KINDS) {
      const across = ENEMIES[kind].radius * 2;
      const gap = Math.abs(
        line.acrossOffset(1, 2, gapAcross(ENEMIES[kind].radius)) -
          line.acrossOffset(0, 2, gapAcross(ENEMIES[kind].radius)),
      );
      expect(
        gap,
        `two ${kind}s sit ${gap} apart and the body is ${across} across — they overlap`,
      ).toBeGreaterThan(across);
    }
  });

  it('THE ONE THAT SAID THE ALONG AXIS WAS ALREADY RIGHT: a column arrives a beat at a time', () => {
    /*
      ⚠️ **THIS GUARD REPLACED ONE THAT COULD NOT FIRE, AND THE PROBE IS WHAT FOUND IT.** The first
      version asked whether a column of five passed inside two bars. It did at 14, it did at the 10
      this decision briefly changed it to, and it did at 26 — a bound nothing was near, which is the
      vacuous shape `docs/decisions/0116-the-rig-plays-the-level.md` already found once.
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` doing the more valuable half of its job.

      ⚠️ **AND WHAT IT FOUND WAS THAT THE CHANGE WAS WRONG.** A beat is 14.4 world units at 36 units a
      second, so neighbours at 14 arrive 0.97 beats apart — consecutive kills on consecutive beats,
      which is the grid `docs/decisions/0096-the-enemies-play-along.md` puts every other cadence on.
      **10 would have taken them off it.** The report was about the across axis and only the across
      axis; `ALONG_GAP` was measured and left alone —
      `docs/decisions/0105-a-body-is-on-screen-long-enough-to-answer.md` is the precedent for saying so
      rather than tuning anyway.
    */
    const column = FORMATIONS.column;
    // A column ignores the across gap — it is single file, so 0202's cap never applies to it. The
    // argument is passed because the signature takes one, and a real body's gap is used rather than
    // a zero so this reads as the call the frame makes.
    const across = gapAcross(ENEMIES.drifter.radius);
    const gap = Math.abs(column.alongOffset(1, 2, across) - column.alongOffset(0, 2, across));
    const beats = gap / (SCROLL_PER_STEP * STEPS_PER_SECOND) / (BAR_SECONDS / 4);
    expect(
      beats,
      `a column's neighbours arrive ${beats.toFixed(2)} beats apart — their kills land off the grid ` +
        'everything else in this game is quantised to',
    ).toBeGreaterThan(0.8);
    expect(
      beats,
      `a column's neighbours arrive ${beats.toFixed(2)} beats apart — more than one beat, so the wave ` +
        'is a sequence rather than a figure',
    ).toBeLessThan(1.2);
  });

  it('and a wave of six still fits the lane with room to be authored anywhere', () => {
    /*
      The constraint the old gap was set against, kept: `tests/level.test.ts` refuses a wave that
      could reach the lane edge, because there is no `across` cull to bring one back.
    */
    const line = FORMATIONS.line;
    // The WIDEST body is the worst case for the lane, which is the one kind this still asks about —
    // 0143 made every narrower wave strictly tighter than whatever this permits.
    const widest = Math.max(...ENEMY_KINDS.map((k) => ENEMIES[k].radius));
    const gap = gapAcross(widest);
    const span = Math.abs(line.acrossOffset(5, 6, gap) - line.acrossOffset(0, 6, gap));
    expect(span, `a six spans ${span} of the lane's 100 units, leaving nowhere to author it`).toBeLessThan(50);
  });
});

/**
 * Damage a second, everything landing, at `tier` of each upgrade ladder.
 *
 * ⚠️ **Hoisted out of 0124's block and shared with 0150's**, because the two ask the same question
 * about the same fight — *how long does this band of health last* — and two descriptions of the
 * player's damage would disagree the first time either moved.
 */
const dpsAt = (tier: number): number => {
  const ship = Object.values(SHIPS)[0]!;
  const upgrades: ('weapon' | 'missile')[] = [];
  for (let i = 0; i < tier; i++) {
    upgrades.push('weapon');
    upgrades.push('missile');
  }
  const w = weaponFor(ship, upgrades);
  return (
    (w.shots * w.damage) / (w.fireEvery / STEPS_PER_SECOND) +
    (w.launchers > 0 ? (w.launchers * w.missileDamage) / (w.missileEvery / STEPS_PER_SECOND) : 0)
  );
};

/**
 * THE UNCOIL AND THE EYE — `docs/decisions/0150-the-uncoil-and-the-eye.md`.
 *
 * ⚠️ **Reported**: *"the bosses need to be more interactive with more varied attacks, a baseline is
 * the jormungdar boss battle from Golf-Stars."*
 * `reports/the-boss-vocabulary-is-one-fan-2026-08-14.md` measured that four of the five
 * `BOSS_ATTACK_KINDS` are one mechanism, and named the word *interactive* as being about the FINISHER
 * rather than about the attacks: 0050's shield and 0053's bomb both exist and neither has a moment it
 * is for.
 *
 * ⚠️ **Everything below is about the two stances that answer that**, and one of them — the curtain's
 * spacing — is stated in the ship's own radius rather than in any constant the code that draws it can
 * see, which is `docs/decisions/0027-measure-the-picture-not-the-model.md`'s ask.
 */
describe('0150 — a boss can empty everything it has, and then open', () => {
  /** The smallest the player's circle ever gets, walked off the ladder rather than remembered. */
  const smallestHurtbox = Math.min(
    ...ASSIST_LADDER.hurtbox.map((h) => tuningFor({ ...DEFAULT_ASSISTS, hurtbox: h }).hurtbox),
  );

  /** Every boss that throws a curtain, with its row — a claim about none of them is a claim about nothing. */
  const uncoilers = BOSS_KINDS.filter((k) => BOSSES[k].uncoil !== null);

  /** A level that is nothing but the boss under test, so the fight is the only thing running. */
  const solo = (boss: (typeof BOSS_KINDS)[number]) =>
    ({ waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss, theme: 'approach' } as const);

  /** Drive a fight until the boss is on station, then put it at `fraction` of its health. */
  const fightAt = (boss: (typeof BOSS_KINDS)[number], fraction: number) => {
    const { world } = playableWorld(solo(boss));
    const frame = new GameFrame(world);
    for (let i = 0; i < 960; i++) frame.step();
    world.bossPool.at(0).health = world.bossFullHealth * fraction;
    return { world, frame };
  };

  it('at least one boss in the game actually throws one', () => {
    // 0005. Every assertion below walks `uncoilers`, and all of them pass vacuously over an empty set.
    expect(uncoilers.length, 'no boss has an uncoil, so nothing below this line checks anything').toBeGreaterThan(0);
  });

  it('THE REPORTED ONE: an uncoil has exactly one hole, and the ship fits through it', () => {
    /*
      ⚠️ **THIS ASSERTION USED TO SAY THE OPPOSITE, AND THE PLAY-TEST IS WHY** —
      `docs/decisions/0151-the-gap-you-have-to-reach.md`. 0150 held that the curtain had NO hole the
      ship could pass through, which is what *"sized against the shield pool"* was read to mean. Flown:
      *"it was good, but needed a way to dodge it."* So the claim inverts — one hole, wide enough —
      and the two halves of it are what makes it one hole rather than two.

      ⚠️ **Wide enough at the STANDARD hurtbox**, not the smallest. This is the one number an assist
      may only ever improve, so it is sized for the player who has turned nothing on —
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`.

      ⚠️ **And the curtain around it is tight enough at the SMALLEST hurtbox**, which is the other
      direction and the reason the two bounds are not one: a spacing a `forgiving` ship could slip
      between would be a curtain full of holes, and the authored one would mean nothing.

      ⚠️ **`curtainSpacing` is asked rather than restated.** `gap` is a ceiling on the spacing and not
      the spacing, so a guard that recomputed it would be checking `src/app/boss.ts`'s arithmetic
      against itself — the failure `docs/decisions/0027-measure-the-picture-not-the-model.md` names.
      What it is compared against is the ship's radius and the bullet's, which that file has never
      heard of.
    */
    for (const kind of uncoilers) {
      const uncoil = BOSSES[kind].uncoil!;
      const shot = SHOTS[BOSSES[kind].shot].radius;
      const fits = 2 * (SHIPS.proof.radius + shot);
      expect(
        uncoil.hole,
        `${kind}'s hole is ${uncoil.hole} across and a ship needs ${fits.toFixed(2)} to pass — it is not a way out`,
      ).toBeGreaterThan(fits);

      const spacing = curtainSpacing(uncoil.gap);
      const slips = 2 * (SHIPS.proof.radius * smallestHurtbox + shot);
      expect(
        spacing,
        `${kind}'s curtain stands its shots ${spacing.toFixed(2)} apart and a forgiving ship slips through ` +
          `${slips.toFixed(2)} — so it has holes nobody authored`,
      ).toBeLessThan(slips);
    }
  });

  it('AND THE OTHER REPORTED ONE: the wall does not move, so it is a pattern to learn', () => {
    /*
      ⚠️ **THE DESIGN THIS GUARD EXISTS TO REFUSE WAS BUILT AND REJECTED FROM PLAY** —
      `docs/decisions/0151-the-gap-you-have-to-reach.md`. A draft opened the hole near the ship, and
      the verdict was: *"a static hole in the wall is a pattern the player needs to learn, a variable
      hole that spawns close to the ship negates the entire difficulty of the obstacle… there's not
      really a point in that wall challenge at all."*

      ⚠️ **DRIVEN FROM TWO DIFFERENT SHIP POSITIONS, because that is the only way to ask it.** Every
      table assertion about `at` is true of a hole that follows the player — the row still names one
      number, and the curtain still leaves one opening. What tells the two designs apart is whether
      the opening is in the same place when the ship is not.
    */
    for (const kind of uncoilers) {
      const holes: number[] = [];
      for (const park of [12, 82]) {
        const { world, frame } = fightAt(kind, 0.52);
        // Fly the ship to one end of the lane and leave it there.
        world.input = {
          contribute: (intent) => {
            intent.along = 0;
            intent.across = park < ACROSS_SPAN / 2 ? -1 : 1;
          },
          spend: () => {},
          release: () => {},
        };
        for (let i = 0; i < 300; i++) {
          world.ship.health = 1e6;
          /*
            ⚠️ The boss's health is held ABOVE the first notch while the ship flies into position, or
            the player's own fire crosses it during the journey and the curtain under test is spent
            before the measurement starts. The axis died to exactly that and reported *no curtain*.
          */
          world.bossPool.at(0).health = world.bossFullHealth * 0.52;
          world.bossPool.at(0).fireIn = 9999;
          frame.step();
        }
        world.enemyShots.clear();
        // Cross the first notch, with the ordinary fan held off so the pool holds the curtain alone.
        for (let i = 0; i < 3; i++) {
          world.ship.health = 1e6;
          world.bossPool.at(0).health = world.bossFullHealth * 0.49;
          world.bossPool.at(0).fireIn = 9999;
          frame.step();
        }
        const across: number[] = [];
        for (let i = 0; i < world.enemyShots.size; i++) across.push(world.enemyShots.at(i).across);
        across.sort((a, b) => a - b);
        let middle = -1;
        for (let i = 1; i < across.length; i++) {
          if (across[i]! - across[i - 1]! > curtainSpacing(BOSSES[kind].uncoil!.gap) + 0.001) {
            middle = (across[i]! + across[i - 1]!) / 2;
          }
        }
        expect(middle, `${kind} threw no curtain with the ship parked near ${park}`).toBeGreaterThan(0);
        holes.push(middle);
      }
      expect(
        Math.abs(holes[0]! - holes[1]!),
        `${kind}'s hole moved from ${holes[0]!.toFixed(1)} to ${holes[1]!.toFixed(1)} when the ship did — ` +
          'a wall that follows the player is not a wall',
      ).toBeLessThan(0.001);
      expect(
        Math.abs(holes[0]! - BOSSES[kind].uncoil!.at),
        `${kind}'s hole landed at ${holes[0]!.toFixed(1)} and its row says ${BOSSES[kind].uncoil!.at}`,
      ).toBeLessThan(curtainSpacing(BOSSES[kind].uncoil!.gap));
    }
  });

  it('and it can be REACHED from the far wall, which is where a static hole may sit', () => {
    /*
      ⚠️ **THE FAIRNESS FLOOR, IN THE PLAYER'S OWN TERMS.** *"Management of difficulty is 'is this
      unfair' OR 'is this a learnable strategy'."* A wall whose hole is always in the same place is
      learnable; a hole the ship cannot physically get to from where the fight has put it is not, and
      no amount of learning changes that. So this is the one thing the static design still has to be
      held to, and it is what decides where a hole may be authored.

      ⚠️ **DRIVEN, AT THE REAL INERTIA, AND THAT IS THE HALF ARITHMETIC CANNOT DO.** The ship has mass
      (`docs/decisions/0037-the-ship-has-mass.md`) — it does not leave at `SHIP_SPEED`, it accelerates
      to it — so `distance / SHIP_SPEED` is an answer about a ship this game does not have. This parks
      the ship against the FAR wall, holds the stick over for exactly as long as a real curtain is in
      the air, and asks whether it got to the near edge of the hole.

      ⚠️ **At the HARDEST tier**, where the bullet is fastest and the window shortest — 39 steps for
      the axis, in which the ship covers 59.5 units. That is the whole reason the two bosses' holes sit
      at opposite ends of the band: the chorus's slower bullet buys it a hole hard over to one side.

      ⚠️ **AND THE SHIP IS HELD OUT OF DANGER FOR THE MEASUREMENT.** A first draft did not, and the
      fixture never dodges — so it died mid-run, respawned at the middle of the lane, and the distance
      it appeared to cover was the respawn rather than the flight. It read as the ship travelling
      further at a HARDER tier, which is the tell.
    */
    const hardest = DIFFICULTY_KINDS[DIFFICULTY_KINDS.length - 1]!;
    for (const kind of uncoilers) {
      const row = BOSSES[kind];
      const uncoil = row.uncoil!;
      // The far wall is whichever side of the lane the hole is not on.
      const away = uncoil.at < ACROSS_SPAN / 2 ? 1 : -1;
      const { world } = playableWorld(solo(kind), hardest);
      const frame = new GameFrame(world);
      for (let i = 0; i < 960; i++) frame.step();

      const speed = SHOTS[row.shot].speed * DIFFICULTIES[hardest].shotSpeed;
      const flight = Math.floor((world.bossPool.at(0).along - world.ship.along) / speed);

      const hold = (dir: number, steps: number): void => {
        world.input = {
          contribute: (intent) => {
            intent.along = 0;
            intent.across = dir;
          },
          spend: () => {},
          release: () => {},
        };
        for (let i = 0; i < steps; i++) {
          world.ship.health = 1e6;
          world.bossPool.at(0).fireIn = 9999;
          frame.step();
        }
      };
      // Hard against the far wall, then run for the hole for exactly the curtain's flight.
      hold(away, 300);
      const from = world.ship.across;
      hold(-away, flight);
      const reached = world.ship.across;
      // The near edge of the hole is the first place that is safe to be.
      const edge = uncoil.at + (away > 0 ? uncoil.hole / 2 : -uncoil.hole / 2);
      const short = away > 0 ? reached - edge : edge - reached;
      expect(
        short,
        `${kind}'s hole sits at ${uncoil.at}; from the far wall at ${from.toFixed(1)} the ship reaches ` +
          `${reached.toFixed(1)} in the ${flight} steps the curtain is in the air, ${Math.abs(short).toFixed(1)} ` +
          'short of its near edge — no amount of learning reaches that',
      ).toBeLessThanOrEqual(0);
    }
  });

  it('and it is thrown again and again, which is the half a phase could not say', () => {
    /*
      ⚠️ **Reported**: *"it needed to happen more than once per boss… fire off at every 10% damage
      reduction below 50%."* 0150 hung the curtain on a phase transition and threw it once a fight.

      ⚠️ **Counted off `uncoilsBy` rather than off the table**, so what is checked is the arithmetic
      the game actually runs — and it is checked at the fraction the player named rather than at
      whatever the row happens to author.
    */
    for (const kind of uncoilers) {
      const uncoil = BOSSES[kind].uncoil!;
      const full = 1000;
      const notches: number[] = [];
      for (let health = full; health >= 0; health--) {
        const notch = uncoilsBy(uncoil, health, full);
        if (notch > (notches[notches.length - 1] ?? 0)) notches.push(notch);
      }
      expect(notches.length, `${kind} uncoils ${notches.length} times, which is not *more than once*`).toBeGreaterThan(
        1,
      );
      // Nothing before `from`, which is the *below 50%* half of the report.
      expect(uncoilsBy(uncoil, full, full), `${kind} uncoils at full health`).toBe(0);
      expect(uncoilsBy(uncoil, full * uncoil.from + 1, full), `${kind} uncoils above its own threshold`).toBe(0);
    }
  });

  it('and the whole hole is inside the lane', () => {
    /*
      ⚠️ **A hole half off the edge of the world is a narrower hole than the row says**, and the row is
      what every other assertion here is written against — including the one that says the ship fits
      through it. It is also the shape a hand reaches for when it wants the pattern hard over to one
      side, which is exactly what the chorus's is.
    */
    for (const kind of uncoilers) {
      const uncoil = BOSSES[kind].uncoil!;
      expect(uncoil.at - uncoil.hole / 2, `${kind}'s hole hangs off the near edge of the lane`).toBeGreaterThan(0);
      expect(uncoil.at + uncoil.hole / 2, `${kind}'s hole hangs off the far edge of the lane`).toBeLessThan(ACROSS_SPAN);
    }
  });

  it('and the window is the last thing a fight does, once', () => {
    /*
      ⚠️ **THE ONE THING THE ESCALATION RULE CANNOT SEE.** A bare row carries the fan it would have
      thrown, so *fires slower* and *throws less* both still hold over it — and neither of them
      notices that it throws nothing at all. A window in the middle of a fight is a relief the fight
      then carries on through, which is precisely what that rule exists to refuse and precisely the
      case it cannot state. So: a boss may bare itself once, at the end.

      ⚠️ **AND A WINDOW STARTS BELOW THE UNCOIL'S OWN THRESHOLD**, so a boss that throws curtains gets
      to throw at least one before it opens. A window that began above `from` would swallow every
      notch of a mechanism the table says the boss has — silently, because `src/app/frame.ts` spends a
      notch the window ate rather than saving it, and nothing else in the game would notice.
    */
    for (const kind of BOSS_KINDS) {
      const stances = BOSSES[kind].phases.map((p) => p.stance.kind);
      const bares = stances.filter((s) => s === 'bare');
      expect(bares.length, `${kind} bares itself ${bares.length} times, and a window is a finisher`).toBeLessThan(2);
      if (bares.length === 1) {
        expect(stances[stances.length - 1], `${kind} goes on fighting after it has opened`).toBe('bare');
        const uncoil = BOSSES[kind].uncoil;
        if (uncoil !== null) {
          const opensAt = BOSSES[kind].phases[stances.length - 1]!.upTo;
          expect(
            opensAt,
            `${kind} opens at ${opensAt} and starts uncoiling at ${uncoil.from}, so the window eats every curtain`,
          ).toBeLessThan(uncoil.from);
        }
      }
    }
  });

  it('and a window lasts longer than the death it runs into', () => {
    /*
      ⚠️ **THE FLOOR IS `BOSS_DEATH_STEPS` AND NOT A NUMBER OF ITS OWN.** A bared window runs straight
      into the explosion that ends the fight, so a window shorter than that beat is one the player
      only ever sees inside it — and 0062 spent a whole decision on the beat being long enough to be
      noticed. Held against the constant so the day one moves, the other moves with it.

      ⚠️ **AND THE MEASUREMENT DIVIDES BY THE MULTIPLIER, WHICH IS THE POINT OF WRITING IT AT ALL.**
      The guard above this one — *"every phase lasts long enough to be seen as one"* — reads a band of
      health against a rate of damage, and a bare phase takes `damageScale` times as much off per
      pulse. So the honest duration of a window is its band divided by its own multiplier, and a guard
      that used the band alone would report a 5.3-second window that lasts 1.8. That is exactly the
      shape `docs/decisions/0027-measure-the-picture-not-the-model.md` calls a guard fired on the
      wrong quantity, and it was green on this table before this line existed.
    */
    const floor = BOSS_DEATH_STEPS / STEPS_PER_SECOND;
    const fastest = dpsAt(UPGRADE_TIERS - 1);
    let found = 0;
    for (const kind of BOSS_KINDS) {
      const row = BOSSES[kind];
      const total = (row.health * DIFFICULTIES.savior.toughness) / fastest;
      for (let i = 0; i < row.phases.length; i++) {
        const phase = row.phases[i]!;
        // A bared window and an opened bell alike — 0255: both take `damageScale` times as much,
        // and both run into the same death.
        if (phase.stance.kind !== 'bare' && phase.stance.kind !== 'open') continue;
        found++;
        const band = phase.upTo - (row.phases[i + 1]?.upTo ?? 0);
        const seconds = (band * total) / phase.stance.damageScale;
        expect(
          seconds,
          `${kind}'s window lasts ${seconds.toFixed(2)}s at max weapons against a ${floor.toFixed(2)}s death — ` +
            'the player meets it inside its own explosion',
        ).toBeGreaterThan(floor);
      }
    }
    expect(found, 'no boss in the game opens, so the assertion above checked nothing').toBeGreaterThan(0);
  });

  it('and every stance in the union is actually authored somewhere', () => {
    /*
      ⚠️ **`docs/decisions/0016-a-hub-enumerates-kinds.md`'s own test, applied to a union that is
      content rather than code.** An arm nobody uses is an arm nobody has flown, and the two guards
      above are geometry and arithmetic over rows that might not exist — this is what makes them
      claims about the shipped game.
    */
    const authored = new Set(BOSS_KINDS.flatMap((k) => BOSSES[k].phases.map((p) => p.stance.kind)));
    for (const kind of BOSS_STANCE_KINDS) {
      expect(authored.has(kind), `no boss in the game ever stands in \`${kind}\``).toBe(true);
    }
  });

  it('AND DRIVEN: a real fight throws real curtains, each with one hole in it', () => {
    /*
      ⚠️ **DRIVEN, on the terms this file already sets for a boss fight**: the real `GameFrame` over a
      real `World` with no browser anywhere. Everything above this is arithmetic over a table, and all
      of it is true of a mechanism that is never reached — `uncoilsBy` can count perfectly while
      `throwCurtain` is never called, and 0150 shipped with a probe proving exactly that shape of gap.

      ⚠️ **The HOLE is measured as the widest span between neighbours, in world units**, and compared
      against the one the row authored. A curtain of the right number of bullets that all left from
      the middle of the lane passes every count in this file and is a fan on screen —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`.
    */
    const { world, frame } = fightAt('chorus', 0.52);
    const uncoil = BOSSES.chorus.uncoil!;
    let thrown = 0;
    let widestHole = 0;
    // Walk the health down past four notches, clearing the field between each so a curtain is the
    // only thing in the air when it is measured.
    for (let notch = 0; notch < 4; notch++) {
      world.enemyShots.clear();
      const at = uncoil.from - uncoil.every * notch - 0.01;
      for (let i = 0; i < 3; i++) {
        world.bossPool.at(0).health = world.bossFullHealth * at;
        // The ordinary fan silenced, so what is left in the pool is the curtain and nothing else.
        world.bossPool.at(0).fireIn = 999;
        frame.step();
      }
      if (world.enemyShots.size === 0) continue;
      thrown++;
      const across: number[] = [];
      for (let i = 0; i < world.enemyShots.size; i++) across.push(world.enemyShots.at(i).across);
      across.sort((a, b) => a - b);
      // The lane edges count as walls, so the ends of the row are not holes.
      expect(across[0], `curtain ${notch} started ${across[0]!.toFixed(1)} into the lane`).toBeLessThan(1);
      expect(across[across.length - 1], `curtain ${notch} stopped short of the lane`).toBeGreaterThan(ACROSS_SPAN - 1);
      let gaps = 0;
      for (let i = 1; i < across.length; i++) {
        const span = across[i]! - across[i - 1]!;
        if (span <= curtainSpacing(uncoil.gap) + 0.001) continue;
        gaps++;
        if (span > widestHole) widestHole = span;
      }
      expect(gaps, `curtain ${notch} has ${gaps} holes in it, and an uncoil has exactly one`).toBe(1);
    }
    expect(thrown, `the fight threw ${thrown} curtains across four notches of health`).toBe(4);
    expect(
      widestHole,
      `the widest hole measured ${widestHole.toFixed(1)} against the ${uncoil.hole} the row authors`,
    ).toBeGreaterThanOrEqual(uncoil.hole - curtainSpacing(uncoil.gap));
  });

  it('and a bared boss throws nothing and dies faster for it', () => {
    /*
      ⚠️ **BOTH HALVES OF THE WINDOW, DRIVEN, BECAUSE EITHER ALONE IS A DIFFERENT FEATURE.** A boss
      that stopped shooting and took the same damage is a lull; one that took triple damage and kept
      firing is a difficulty spike. The word in the report is *interactive*, and what it names is a
      moment the player has to be in front of.
    */
    const { world, frame } = fightAt('axis', 0.1);
    const phase = phaseFor(BOSSES.axis, world.bossPool.at(0).health, world.bossFullHealth);
    expect(phase.stance.kind, 'the fixture is not in the window it is about to measure').toBe('bare');
    expect(openBy(phase), 'a bared boss takes no more than a fighting one').toBeGreaterThan(1);

    world.enemyShots.clear();
    for (let i = 0; i < 300; i++) {
      world.bossPool.at(0).health = world.bossFullHealth * 0.1;
      frame.step();
    }
    expect(world.enemyShots.size, 'the boss went on shooting with its eye open').toBe(0);
  });

  it('and the picture says so for as long as the window lasts', () => {
    /*
      ⚠️ **`docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`, applied to a
      STATE.** The burst that announced the change is over in half a second; the window it announced
      is not, and 0036 records three play reports of exactly this shape being filed as collision
      faults that did not exist. A hull shedding fragments for as long as it is open is the one thing
      this game can say with no new drawing primitive.

      ⚠️ **Measured a full second AFTER the change**, deliberately past anything the transition itself
      threw, so what it sees is the trickle rather than the announcement.
    */
    const { world, frame } = fightAt('axis', 0.1);
    for (let i = 0; i < 120; i++) {
      world.bossPool.at(0).health = world.bossFullHealth * 0.1;
      frame.step();
    }
    world.debris.clear();
    for (let i = 0; i < 60; i++) {
      world.bossPool.at(0).health = world.bossFullHealth * 0.1;
      frame.step();
    }
    expect(world.debris.size, 'a bared boss sheds nothing, so the window is invisible').toBeGreaterThan(0);
  });
});

/**
 * THE BOSS IS A BOSS — `docs/decisions/0124-the-boss-is-a-boss.md`.
 *
 * ⚠️ **Reported**: *"at max level weapons, the boss dies too fast still, it's more of a mid-level
 * miniboss than an end of level boss."* Measured, `sentinel` lasted **4.6 seconds** at max weapons on
 * the tier `src/content/difficulty.ts` calls *"what the game is tuned for"*.
 *
 * ⚠️ **AND THE PLAYER SET THE BALANCE TARGET, WHICH IS WHAT MADE THE NUMBER PICKABLE.** A health rise
 * lengthens the bare fight as much as the equipped one, and the two could not both be right — until:
 * *"it's at the core of it a survival challenge game. If you get to the boss with level 1 weapons, you
 * can take your time or start over… we should be aiming for the difficulty for the player to be having
 * at least level 2 weapons… if the game is easy, it's no fun."*
 *
 * **So the design loadout is tier 2 and up, and the bare fight is a consequence rather than a case.**
 */
describe('0124 — a boss lasts long enough to be one, at the loadout the game is tuned for', () => {
  /*
    ⚠️ **THE FASTEST THE GAME CAN KILL, which is the worst case for *"dies too fast"*.** A floor
    written at the design loadout would be met by a boss that evaporates for a player who has
    collected everything — and that player is the one who reported this.
  */
  const FASTEST = dpsAt(UPGRADE_TIERS - 1);
  const TUNED = DIFFICULTIES.savior;

  it('THE REPORTED ONE: a boss is not over before its music is', () => {
    /*
      ⚠️ **TWELVE SECONDS, AND IT IS THE MUSIC THAT SETS IT** —
      [0114](../docs/decisions/0114-the-fight-is-a-different-piece.md) requires a rung to last longer
      than a handful of `RAMP_SECONDS` or it is *"a gain ramp heard as a wobble rather than a
      section"*. The fight is a rung. At 4.6 seconds it was shorter than the ramp into it, which is
      why *"when the boss arrives the section change is noticeable, but not in a dramatic entrance
      kind of way"* — there was nothing after the entrance.
    */
    /*
      ⚠️ **THE END BOSSES, since 0247** — `docs/decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md`.
      A mid-boss is fought under the section it is in and no piece announces it, so the floor the
      music sets is not its floor: it IS the miniboss this message names, on purpose. The end boss
      of every level is what the fight's piece is written for, and every one of them is held here.
    */
    for (const level of LEVEL_KINDS) {
      const kind = LEVELS[level].boss;
      const seconds = (BOSSES[kind].health * TUNED.toughness) / FASTEST;
      expect(
        seconds,
        `${kind} is over in ${seconds.toFixed(1)}s at max weapons — a miniboss, and shorter than the music that announces it`,
      ).toBeGreaterThan(12);
    }
  });

  it('and every phase lasts long enough to be seen as one', () => {
    /*
      ⚠️ **[0111](../docs/decisions/0111-a-boss-has-one-idea.md) gives every boss phases keyed to
      health, and a phase that lasts two seconds is not a phase.** It is the same defect as a
      one-second music rung and a body with no dwell time
      ([0105](../docs/decisions/0105-a-body-is-on-screen-long-enough-to-answer.md)): an event the model
      resolves and the player never gets to answer.

      ⚠️ **Driven off the phase TABLE rather than a count**, so a boss whose phases are authored
      unevenly is measured on its shortest one — which is the one that vanishes.

      ⚠️ **A `bare` phase is measured by 0150's guard and not by this one, and the reason is that this
      one would get it wrong** — `docs/decisions/0150-the-uncoil-and-the-eye.md`. Every phase here is
      a band of health read against a rate of damage, and a bared boss takes `damageScale` times as
      much off per pulse: the band this arithmetic calls 5.3 seconds is 1.8 in the player's hands. A
      guard reporting the wrong number is worse than no guard, which is
      `docs/decisions/0027-measure-the-picture-not-the-model.md`'s whole subject.
    */
    for (const kind of BOSS_KINDS) {
      const total = (BOSSES[kind].health * TUNED.toughness) / FASTEST;
      const phases = BOSSES[kind].phases;
      const ups = phases.map((p) => p.upTo);
      // An opened bell's band is read at the damage it actually takes — 0255 — so a phase that
      // opens is held to the same three seconds in the player's hands, not the table's.
      const bands = ups.map((u, i) => (phases[i]!.stance.kind === 'bare' ? Infinity : (u - (ups[i + 1] ?? 0)) / openBy(phases[i]!)));
      const shortest = Math.min(...bands);
      expect(
        shortest * total,
        `${kind}'s shortest phase is ${(shortest * total).toFixed(1)}s at max weapons — the player never sees it change`,
      ).toBeGreaterThan(3);
    }
  });

  it('and a later boss is a longer fight than an earlier one', () => {
    /*
      ⚠️ **The progression, held as an ordering rather than as seven numbers.** `docs/game.md`'s
      *seven bosses, one idea each* is not served by a level-seven boss that dies faster than
      level one's, and nothing else in the repository would notice.
    */
    for (let i = 1; i < BOSS_KINDS.length; i++) {
      expect(
        BOSSES[BOSS_KINDS[i]!].health,
        `${BOSS_KINDS[i]} is no tougher than ${BOSS_KINDS[i - 1]}, so the run does not get harder`,
      ).toBeGreaterThan(BOSSES[BOSS_KINDS[i - 1]!].health);
    }
  });

  it('AND THE TIER THE GAME IS TUNED FOR SAYS SO ABOUT ITSELF', () => {
    /*
      ⚠️ **`savior`'s own `hint` is *"What the game is tuned for"***, and every number above is read
      against it. If that ever moves to another tier, these bounds are being applied to a row that no
      longer claims to be the reference — which is the quiet kind of wrong.
    */
    expect(DIFFICULTIES.savior.hint.toLowerCase()).toContain('tuned for');
  });
});
