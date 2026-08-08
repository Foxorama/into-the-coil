import { describe, it, expect } from 'vitest';
import { ACROSS_SPAN, MAX_ASPECT, viewOf } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { GameFrame, type World } from '../src/app/frame.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { weaponFor, type UpgradeKind } from '../src/content/pickups.ts';
import { playableWorld, NO_LEVEL } from './world.ts';

/**
 * THE SECOND AUTO-WEAPON.
 *
 * `docs/decisions/0051-a-missile-is-the-second-auto-weapon.md`. Asked for after playing the two-level
 * build: *"missiles — a second auto-weapon. Slower than the pulse, 3× its damage, fired from
 * launchers on the ship. The base ship has one, at the middle; the first upgrade adds one on the
 * `across`-minus side and the second on the `across`-plus side, and those two pop out before they
 * straighten."*
 *
 * ⚠️ **Nothing here asserts on a value a hand is meant to settle** — not the speed, not the cadence,
 * not how far a tube pops out. What is held are the relationships: three times the pulse, slower than
 * the pulse, one missile per launcher, and a side tube that clears the hull before it straightens.
 */

/** Long enough for a volley or two at any cadence anybody would author. */
const A_WHILE = 200;

/**
 * The smallest loadout that has a missile weapon at all.
 *
 * ⚠️ **The base ship carries NO tube** — `docs/decisions/0056-…` amends 0051's *"the base ship has
 * one, at the middle"*, so a test about missiles has to say it found one. Written as a named
 * constant rather than a literal in eight places, because it is the same fact each time and it is
 * exactly the fact that just moved.
 */
const ARMED: readonly UpgradeKind[] = ['weapon'];

function quietWorld(upgrades: readonly UpgradeKind[] = []): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  built.world.weapon = weaponFor(built.world.shipRow, upgrades);
  built.world.fireIn = built.world.weapon.fireEvery;
  built.world.missileIn = built.world.weapon.missileEvery;
  return { world: built.world, frame: new GameFrame(built.world) };
}

describe('a missile is worth three pulses and is slower than one', () => {
  it('carries three times the pulse’s damage, as a ratio rather than a number', () => {
    /*
      ⚠️ **A RATIO, because that is what was asked for**: *"3× its damage."* Written as a number it
      would be a second description of the pulse's damage, and tuning the pulse would silently change
      what a missile is worth relative to it — which is the only thing the ask actually fixed.
    */
    expect(SHOTS.missile.damage, 'a missile is no longer three pulses').toBe(SHOTS.pulse.damage * 3);
  });

  it('flies slower than the pulse, which is the whole of what makes it a different weapon', () => {
    expect(SHOTS.missile.speed, 'the missile is not slower than the pulse').toBeLessThan(SHOTS.pulse.speed);
  });

  it('is drawn longer than the pulse and shorter than the smallest enemy', () => {
    // Size is the cue that needs no learning at all — `src/content/sprites.ts` argues it for the
    // enemies and it is just as true of two streams leaving the same ship at the same time.
    expect(SPRITE_EXTENT.missile, 'a missile is no bigger than the pulse it has to be told apart from').toBeGreaterThan(
      SPRITE_EXTENT.bullet,
    );
    expect(SPRITE_EXTENT.missile, 'a missile is the size of an enemy').toBeLessThan(SPRITE_EXTENT.weaver);
  });
});

describe('the ship fires it without being asked', () => {
  it('launches on its own clock, with no input at all', () => {
    /*
      `src/content/actions.ts`: *there is no `fire` action and there must never be one.* The fixture
      contributes an empty intent every step, so anything that arrives here arrived by itself.
    */
    const { world, frame } = quietWorld(ARMED);
    for (let i = 0; i < A_WHILE; i++) frame.step();
    expect(world.missiles.size, 'nothing was fired without a trigger').toBeGreaterThan(0);
    for (let i = 0; i < world.missiles.size; i++) {
      expect(world.missiles.at(i).sprite, 'the missile pool is holding something else').toBe(SPRITE.missile);
    }
  });

  it('fires less often than the pulse does', () => {
    const base = weaponFor(SHIPS.proof, []);
    expect(base.missileEvery, 'the second weapon fires as fast as the first').toBeGreaterThan(base.fireEvery);
  });

  it('keeps its own clock, so one weapon cannot stall the other', () => {
    /*
      The failure this catches is a single `fireIn` shared by both: the missiles would then fire at
      the pulse's rate, or the pulse at the missile's, and every upgrade to either would move both.
    */
    const { world, frame } = quietWorld(ARMED);
    world.missileIn = 1;
    world.fireIn = 10_000;
    for (let i = 0; i < 4; i++) frame.step();
    expect(world.missiles.size, 'the missiles waited for the pulse').toBeGreaterThan(0);
    expect(world.playerShots.size, 'the pulse fired on the missile’s clock').toBe(0);
  });
});

describe('a launcher is a position on the ship', () => {
  it('fires one missile per launcher, and stops at two tubes', () => {
    /*
      ⚠️ **TWO, AND IT WAS THREE** —
      `docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md`. Three was the cap for a ship
      that started with one tube at the centreline (0051); 0056 took the base tube away on the ask
      *"default missile tubes should be 0 and increase to 1 then to 2"* and left the ceiling where it
      was, so a run reached a rung the ask does not have. Reported from play as *"after a player's
      first death, the player can then have 3 missile tubes instead of being capped at two."*

      ⚠️ **The overflow is held here rather than only in `weaponFor`'s unit test**, because the thing
      that broke was the number of missiles LEAVING THE SHIP, which is what the player counted.
    */
    /*
      ⚠️ **THE RUNGS ARE NO LONGER ONE-PER-UPGRADE, AND 0082 IS WHY.** Four upgrade kinds became one
      `weapon` pickup whose every repeat *"increases its tier and rate of fire together"*, so a rung
      spends itself on a launcher OR a barrel — whichever hardpoint is proportionally further from its
      cap — while both cadences move regardless. `src/content/pickups.ts` has the ladder; the order it
      produces is launcher, barrel, barrel, launcher, barrel.

      ⚠️ **The FIRST rung is the launcher, and that is 0056 surviving the merge.** The base ship has no
      tube, so a merge that handed the missile out at rung three would quietly un-earn the second
      weapon. The pair at count 1 is what holds it.

      ⚠️ **Written as the expected count per rung rather than `min(n, 2)`.** The old formula was the
      ladder restated in a second place; this is a table of what the player gets, which is the thing
      a play-test can disagree with.
    */
    const LAUNCHERS_AT: readonly (readonly [number, number])[] = [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 2],
      [6, 2],
      [12, 2],
    ];
    for (const [upgradeCount, expected] of LAUNCHERS_AT) {
      const upgrades: UpgradeKind[] = [];
      for (let i = 0; i < upgradeCount; i++) upgrades.push('weapon');
      const { world, frame } = quietWorld(upgrades);
      expect(world.weapon.launchers, `${upgradeCount} upgrades did not produce ${expected} launchers`).toBe(expected);

      world.missileIn = 1;
      frame.step();
      expect(world.missiles.size, 'a volley is not one missile per launcher').toBe(expected);
    }
  });

  it('puts one tube on the centreline and two on the wings', () => {
    /*
      ⚠️ **What is held is that a launcher upgrade is VISIBLE**, which is 0051's actual claim — a
      player who takes one can see what changed. The rung it used to count to has moved (0077) and the
      claim has not: the volley goes from one missile down the nose to two off the wings.

      ⚠️ **Symmetric at the cap, and that is the half 0077 added.** The old order was centre, then
      minus, then plus, so simply stopping at two would have left a fully-upgraded ship firing
      off-centre — a worse picture than the defect being fixed.
    */
    const one = quietWorld(['weapon']);
    one.world.missileIn = 1;
    one.frame.step();
    expect(one.world.missiles.size).toBe(1);
    expect(one.world.missiles.at(0).across - one.world.ship.across, 'a single tube is not on the centreline').toBe(0);

    // ⚠️ FOUR, and it was two. The second launcher is the ladder's fourth rung since 0082 merged the
    // upgrade kinds — the test above has the table, and this is the first place that shape is felt.
    const { world, frame } = quietWorld(['weapon', 'weapon', 'weapon', 'weapon']);
    world.missileIn = 1;
    frame.step();
    const across: number[] = [];
    for (let i = 0; i < world.missiles.size; i++) across.push(world.missiles.at(i).across - world.ship.across);
    expect(across.length).toBe(2);
    expect(across.some((a) => a < 0), 'nothing fired from the acrossMinus side').toBe(true);
    expect(across.some((a) => a > 0), 'nothing fired from the acrossPlus side').toBe(true);
    expect(across[0]! + across[1]!, 'the two tubes are not symmetric about the hull').toBeCloseTo(0, 6);
  });

  it('pops the side tubes out clear of the hull, then straightens them', () => {
    /*
      ⚠️ **BOTH HALVES, because either alone is a different weapon.** A missile that never straightens
      is a spread weapon and covers the lane; one that never pops is three missiles in a line, and the
      launcher upgrade becomes invisible.

      Measured against the hull's own drawn size, which is what the player sees the missile clear —
      `docs/decisions/0027-measure-the-picture-not-the-model.md` on assertions in the player's units.
    */
    // ⚠️ FOUR, and it was two. The second launcher is the ladder's fourth rung since 0082 merged the
    // upgrade kinds — the test above has the table, and this is the first place that shape is felt.
    const { world, frame } = quietWorld(['weapon', 'weapon', 'weapon', 'weapon']);
    world.missileIn = 1;
    frame.step();
    const shipAcross = world.ship.across;
    const sides = [];
    for (let i = 0; i < world.missiles.size; i++) {
      const m = world.missiles.at(i);
      if (m.velAcross !== 0) sides.push(m);
    }
    expect(sides.length, 'no tube popped out at all').toBe(2);

    for (let i = 0; i < 120; i++) frame.step();
    for (const missile of sides) {
      const out = Math.abs(missile.across - shipAcross);
      expect(out, 'a side missile straightened while it was still over the hull').toBeGreaterThan(
        SPRITE_EXTENT.ship / 2,
      );
      expect(missile.velAcross, 'a side missile never straightened — it is a spread weapon').toBe(0);
      expect(out, 'a side missile crossed half the dodge lane on its way out').toBeLessThan(ACROSS_SPAN / 4);
    }
  });
});

describe('a missile hits things, and stops where the player can see', () => {
  it('takes three times as much off an enemy as a pulse does', () => {
    const tough = { ...ENEMIES.turret, health: 99 };
    const byPulse = damageDealt('pulse', tough);
    const byMissile = damageDealt('missile', tough);
    expect(byMissile, 'a missile no longer lands three pulses worth').toBe(byPulse * 3);
  });

  it('is culled at the edge of the view, like every other thing the player fires', () => {
    /*
      0048: *you can shoot what you can see*, and it is one promise rather than one per weapon. A
      missile that outlived the view would kill things off-screen and hold a pool slot while doing it.
    */
    const { world, frame } = quietWorld(ARMED);
    world.view = viewOf(ACROSS_SPAN * MAX_ASPECT * 10, ACROSS_SPAN * 10);
    world.missileIn = 1;
    frame.step();
    const missile = world.missiles.at(0);
    let furthest = 0;
    for (let i = 0; i < 600; i++) {
      if (world.missiles.size === 0) break;
      furthest = Math.max(furthest, missile.along - world.cameraAlong);
      frame.step();
    }
    /*
      One step of grace, and it is arithmetic rather than tolerance: the cull runs after the step has
      integrated, so a body is always sampled at most one step of travel past the line it crosses.
      Anything beyond that is a shot living in the dark.
    */
    expect(furthest, 'a missile outlived the screen it was fired into').toBeLessThanOrEqual(
      world.view.alongSpan + SHOTS.missile.speed,
    );
    expect(furthest, 'the missile never got anywhere, so this measured nothing').toBeGreaterThan(ACROSS_SPAN / 4);
  });
});

/** How much health one shot of `kind` takes off a body, fired point-blank from the frame's own code. */
function damageDealt(kind: 'pulse' | 'missile', row: typeof ENEMIES.turret): number {
  const { world, frame } = quietWorld();
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along + 20, world.ship.across, row);
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = 0;
  const before = enemy.health;
  // One shot of the kind under test, and nothing else in the air.
  world.fireIn = Number.MAX_SAFE_INTEGER;
  world.missileIn = Number.MAX_SAFE_INTEGER;
  const pool = kind === 'pulse' ? world.playerShots : world.missiles;
  const shot = pool.spawn()!;
  reset(shot, world.ship.along + 5, world.ship.across, SHOTS[kind]);
  shot.velAlong = SHOTS[kind].speed + world.scrollPerStep;
  for (let i = 0; i < A_WHILE; i++) {
    frame.step();
    if (enemy.health < before) break;
  }
  return before - enemy.health;
}

describe('the upgrades reach the weapon rather than the wrong one', () => {
  it('THE MERGE: one pickup moves BOTH weapons, which is what "together" means', () => {
    /*
      ── THIS ASSERTION IS THE EXACT OPPOSITE OF WHAT IT USED TO BE ─────────────────────────────────

      ⚠️ **It was *a missile upgrade never moves the pulse, and a pulse upgrade never moves the
      missiles*.** That was the right rule when there were four upgrade kinds and the failure it caught
      was a copy-paste in `weaponFor` sending a pickup to the wrong weapon.

      ⚠️ **`docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` merged the four into one**, on
      the ask's own words: *"rapid fire/rapid missiles rapid whatever else we add need to be combined
      into one power up… picking up a second of the same weapon needs to increase it's tier and rate of
      fire together."* Separation is no longer the property; **simultaneity is**, and a `weaponFor` that
      moved only one weapon per rung would now be the bug.

      ⚠️ **The one thing kept from the old test is that the two rates are NOT the same number.**
      `RAPID_FACTOR` and `MISSILE_FACTOR` differ deliberately — a missile is worth three pulses, so the
      same factor on both would let the pulse stop mattering by the third rung — and a merge that
      collapsed them into one constant would pass everything above.
    */
    const base = weaponFor(SHIPS.proof, []);
    const one = weaponFor(SHIPS.proof, ['weapon']);
    expect(one.fireEvery, 'a weapon pickup left the pulse cadence alone').toBeLessThan(base.fireEvery);
    expect(one.missileEvery, 'a weapon pickup left the missile cadence alone').toBeLessThan(base.missileEvery);
    expect(one.launchers, 'the first rung is not the launcher, so the missile is not earned').toBe(base.launchers + 1);

    /*
      The two cadences fall at their own rates. Compared as fractions of where each started, because
      the two base numbers are different — 9 steps against 45 — so a raw difference proves nothing.
    */
    const pulseShare = one.fireEvery / base.fireEvery;
    const missileShare = one.missileEvery / base.missileEvery;
    expect(pulseShare, 'both weapons speed up by the same fraction, so the pulse will stop mattering').not.toBeCloseTo(
      missileShare,
      2,
    );
  });

  it('THE NERF: a weapon past its caps stops growing, rather than piling on damage', () => {
    /*
      ── THIS TEST HELD THE BEHAVIOUR THAT WAS THE REPORTED DEFECT ─────────────────────────────────

      ⚠️ **It was *spends an upgrade that has nowhere left to go on damage instead*, and it was
      correct.** `docs/game.md` says *an upgrade that cannot change the outcome is worse than none*, so
      once barrels, launchers and both fire floors were capped, `weaponFor` put every further upgrade
      into `damage`. Nothing bounded it.

      ⚠️ **Reported from play**: *"max speed auto-fire is way too strong for the current game - when
      you get max speed nothing is a challenge, bosses die in less a second and they are supposed to be
      tough."* The twelfth pickup was worth as much as the fifth and the curve never flattened.
      `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`.

      ⚠️ **The rule it was serving is kept and paid for in the SHELL, not here** — a weapon that cannot
      grow makes the next pickup a bomb charge (`src/app/mount.ts`, and `tests/shields.test.ts` drives
      it). So what this now holds is the flattening: the twentieth weapon is exactly the fifth.
    */
    const base = weaponFor(SHIPS.proof, []);
    const full = weaponFor(SHIPS.proof, Array.from({ length: 5 }, () => 'weapon' as UpgradeKind));
    const absurd = weaponFor(SHIPS.proof, Array.from({ length: 20 }, () => 'weapon' as UpgradeKind));

    expect(absurd.damage, 'the pulse still gains damage without a ceiling').toBe(base.damage);
    expect(absurd.missileDamage, 'the missile still gains damage without a ceiling').toBe(base.missileDamage);
    expect(absurd, 'a weapon kept growing past the rung where it should have stopped').toEqual(full);
    /*
      ⚠️ **And the flattening must not have started early**, which is the failure in the other
      direction: a ladder that capped at rung two would satisfy every assertion above while making
      pickups three, four and five worthless. Five rungs is what `src/content/pickups.ts` says the
      ladder is, and this is the guard that a level's three-a-level budget is spending on something.
    */
    const four = weaponFor(SHIPS.proof, Array.from({ length: 4 }, () => 'weapon' as UpgradeKind));
    expect(four, 'the fifth weapon pickup bought nothing, so the ladder is shorter than it claims').not.toEqual(full);
  });

  it('a death takes the missiles away entirely, because the base ship has no tube', () => {
    /*
      0039: a death is back to the base weapon, and there is no second description of what that is —
      it is what an empty upgrade list resolves to, for both weapons.

      ⚠️ **The base ship carries NO launcher**, which is `docs/decisions/0056-…` amending 0051's
      *"the base ship has one, at the middle"*. So this is no longer *back to one tube*: a death takes
      the second weapon away completely, and finding a launcher is what brings it back. That makes a
      death cost more than it did, which is a real change to the run and not a tidy-up.
    */
    const base = weaponFor(SHIPS.proof, []);
    expect(base.launchers, 'the base ship still carries a launcher of its own').toBe(0);
    expect(base.missileEvery).toBe(SHIPS.proof.missileEvery);
    expect(base.missileDamage).toBe(SHOTS[SHIPS.proof.missile].damage);
  });

  it('fires nothing at all until a launcher is found', () => {
    /*
      ⚠️ **The reported bug, at the weapon**: *"missile secondary weapon keeps a missile tube on the
      player ship."* Asserting the COUNT is zero is not enough — a cadence that keeps counting down
      with no tube to fire from is the same bug one level in, and it would arm the first volley to
      leave the instant a pickup landed.
    */
    const { world, frame } = quietWorld();
    for (let i = 0; i < A_WHILE; i++) frame.step();
    expect(world.missiles.size, 'a ship with no launcher fired a missile').toBe(0);
    expect(world.playerShots.size, 'the pulse stopped too, so this proved nothing').toBeGreaterThan(0);
  });

  it('and does not run the missile clock down while it has nothing to fire from', () => {
    /*
      ⚠️ **The same bug one level in, and it is invisible in the missile COUNT.** A cadence that keeps
      counting while the ship has no tube reaches zero, resets, and reaches zero again — so the moment
      a launcher pickup lands, the clock is at a position nobody chose. The reward for finding the
      weapon would be a volley leaving from wherever the ship happened to be, up to a full cadence
      early, and it would look like the pickup firing the gun.

      Asserted on the clock rather than on a missile because the count is zero either way, which is
      exactly why this needs its own guard.
    */
    const { world, frame } = quietWorld();
    for (let i = 0; i < A_WHILE; i++) frame.step();
    expect(world.missileIn, 'the missile clock ran while the ship had no launcher').toBe(world.weapon.missileEvery);
  });
});
