import { describe, it, expect } from 'vitest';
import { ACROSS_SPAN, MAX_ASPECT, viewOf } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { GameFrame, type World } from '../src/app/frame.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { UPGRADE_KINDS, weaponFor, type UpgradeKind } from '../src/content/pickups.ts';
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
    const { world, frame } = quietWorld();
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
    const { world, frame } = quietWorld();
    world.missileIn = 1;
    world.fireIn = 10_000;
    for (let i = 0; i < 4; i++) frame.step();
    expect(world.missiles.size, 'the missiles waited for the pulse').toBeGreaterThan(0);
    expect(world.playerShots.size, 'the pulse fired on the missile’s clock').toBe(0);
  });
});

describe('a launcher is a position on the ship', () => {
  it('fires one missile per launcher, from the centre outwards', () => {
    for (const launchers of [1, 2, 3]) {
      const upgrades: UpgradeKind[] = [];
      for (let i = 1; i < launchers; i++) upgrades.push('missileSpread');
      const { world, frame } = quietWorld(upgrades);
      expect(world.weapon.launchers, `${launchers} upgrades did not produce ${launchers} launchers`).toBe(launchers);

      world.missileIn = 1;
      frame.step();
      expect(world.missiles.size, 'a volley is not one missile per launcher').toBe(launchers);
    }
  });

  it('puts the second tube on one side and the third on the other', () => {
    /*
      ⚠️ **The ask names the sides**: *"the first upgrade adds one on the `across`-minus side and the
      second on the `across`-plus side."* It is worth holding because it is what makes a launcher
      upgrade VISIBLE — a player who takes one can see which side it went on, and a player who takes
      two sees the ship become symmetric.
    */
    const { world, frame } = quietWorld(['missileSpread', 'missileSpread']);
    world.missileIn = 1;
    frame.step();
    const across: number[] = [];
    for (let i = 0; i < world.missiles.size; i++) across.push(world.missiles.at(i).across - world.ship.across);
    expect(across.length).toBe(3);
    expect(across.some((a) => a === 0), 'nothing fired from the centreline').toBe(true);
    expect(across.some((a) => a < 0), 'nothing fired from the acrossMinus side').toBe(true);
    expect(across.some((a) => a > 0), 'nothing fired from the acrossPlus side').toBe(true);
  });

  it('pops the side tubes out clear of the hull, then straightens them', () => {
    /*
      ⚠️ **BOTH HALVES, because either alone is a different weapon.** A missile that never straightens
      is a spread weapon and covers the lane; one that never pops is three missiles in a line, and the
      launcher upgrade becomes invisible.

      Measured against the hull's own drawn size, which is what the player sees the missile clear —
      `docs/decisions/0027-measure-the-picture-not-the-model.md` on assertions in the player's units.
    */
    const { world, frame } = quietWorld(['missileSpread', 'missileSpread']);
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
    const { world, frame } = quietWorld();
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
  it('a missile upgrade never moves the pulse, and a pulse upgrade never moves the missiles', () => {
    /*
      ⚠️ **The failure this catches is a copy-paste in `weaponFor`**, and it is invisible in play until
      a player notices that the pickup they flew for changed the other weapon. Each upgrade is checked
      against the fields it must NOT touch as well as the one it must.
    */
    const base = weaponFor(SHIPS.proof, []);
    const rapid = weaponFor(SHIPS.proof, ['rapid']);
    expect(rapid.fireEvery).toBeLessThan(base.fireEvery);
    expect(rapid.missileEvery, 'a rapid moved the missiles').toBe(base.missileEvery);
    expect(rapid.launchers, 'a rapid added a launcher').toBe(base.launchers);

    const missileRate = weaponFor(SHIPS.proof, ['missileRate']);
    expect(missileRate.missileEvery).toBeLessThan(base.missileEvery);
    expect(missileRate.fireEvery, 'a missile upgrade moved the pulse').toBe(base.fireEvery);

    const launcher = weaponFor(SHIPS.proof, ['missileSpread']);
    expect(launcher.launchers).toBe(base.launchers + 1);
    expect(launcher.shots, 'a launcher added a pulse barrel').toBe(base.shots);
  });

  it('spends an upgrade that has nowhere left to go on damage instead', () => {
    /*
      `docs/game.md`: *an upgrade that cannot change the outcome is worse than none.* Both weapons cap
      — barrels, launchers, and both fire floors — so both need the same answer past the cap, and a
      weapon that got one without the other would have a dead pickup in it.
    */
    /*
      ⚠️ **ONE KIND AT A TIME, AND `npm run prove` IS WHY.** The first version stacked twelve of every
      upgrade together and asserted that the two damage fields had moved — which they had, because the
      RATE upgrades overflow into the same field the launcher ones do. Deleting the launcher's
      overflow entirely left the suite green. A test of *the caps between them buy something* is not a
      test of *each cap buys something*, and the second is the rule.
    */
    const base = weaponFor(SHIPS.proof, []);
    for (const kind of UPGRADE_KINDS) {
      const many: UpgradeKind[] = [];
      for (let i = 0; i < 20; i++) many.push(kind);
      const loaded = weaponFor(SHIPS.proof, many);
      expect(
        loaded.damage > base.damage || loaded.missileDamage > base.missileDamage,
        `the twentieth ${kind} bought nothing at all — past its own cap it is a dead pickup`,
      ).toBe(true);
    }
  });

  it('a death takes the missiles back to the ship’s own tube', () => {
    // 0039: a death is back to the base weapon, and there is no second description of what that is —
    // it is what an empty upgrade list resolves to, for both weapons.
    const base = weaponFor(SHIPS.proof, []);
    expect(base.launchers, 'the base ship does not have exactly one tube').toBe(1);
    expect(base.missileEvery).toBe(SHIPS.proof.missileEvery);
    expect(base.missileDamage).toBe(SHOTS[SHIPS.proof.missile].damage);
  });
});
