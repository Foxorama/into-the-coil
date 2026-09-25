import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { GameFrame, launchSpecial, respawn, wearHull, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { MISSILES, MISSILE_KINDS } from '../src/content/missiles.ts';
import { UPGRADE_TIERS, effectOf, overflowOf, weaponFor, type Loadout, type UpgradeKind } from '../src/content/pickups.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { WEAPONS, WEAPON_KINDS } from '../src/content/weapons.ts';
import { reset } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * A SPECIAL IS THE GUN'S OWN — `docs/decisions/0373-a-special-is-the-guns-own.md`.
 *
 * What a full ladder buys is the fitted face's own special, and a surge is worn: an aura for its
 * length, and one of the ship's weapons stronger while it lasts. Every assertion reads the row it is
 * about, so a surge tuned longer or stronger moves the guard with it — what is held is that the
 * row's numbers reach the shots, not what the numbers are.
 */

const NEVER = Number.MAX_SAFE_INTEGER;

function full(kind: UpgradeKind): UpgradeKind[] {
  const out: UpgradeKind[] = [];
  for (let i = 0; i < UPGRADE_TIERS; i++) out.push(kind);
  return out;
}

/** A world with the gun and the tubes fitted at the cap, both silenced until the test says. */
function fitted(gun: (typeof WEAPON_KINDS)[number], tube: (typeof MISSILE_KINDS)[number]): { world: World; frame: GameFrame } {
  const { world } = playableWorld(NO_LEVEL);
  world.weapon = weaponFor(world.shipRow, [...full('weapon'), ...full('missile')], gun, tube);
  wearHull(world);
  world.fireIn = NEVER;
  world.missileIn = NEVER;
  return { world, frame: new GameFrame(world) };
}

describe('0373 — a full ladder buys the face’s own special', () => {
  it('THE ASK: every gun and every tube, overflowed, stocks the special its row names', () => {
    for (const gun of WEAPON_KINDS) {
      const loadout: Loadout = { upgrades: full('weapon'), weapon: gun, missile: 'straight' };
      const face = WEAPON_KINDS.indexOf(gun);
      expect(effectOf('weapon', face, loadout), `a full ${gun} did not overflow`).toBe('special');
      expect(overflowOf('weapon', face), `a full ${gun} bought somebody else's special`).toBe(WEAPONS[gun].special);
    }
    for (const tube of MISSILE_KINDS) {
      const loadout: Loadout = { upgrades: full('missile'), weapon: 'pulse', missile: tube };
      const face = MISSILE_KINDS.indexOf(tube);
      expect(effectOf('missile', face, loadout), `full ${tube} tubes did not overflow`).toBe('special');
      expect(overflowOf('missile', face), `full ${tube} tubes bought somebody else's special`).toBe(MISSILES[tube].special);
    }
  });

  it('and the three the ask names are the three it gets', () => {
    // *"forward missiles - give you a bomb"*, *"homing missiles - … purple aura"*, *"auto-gun - … golden aura"*.
    expect(MISSILES.straight.special).toBe('bomb');
    expect(MISSILES.homing.special).toBe('hunt');
    expect(WEAPONS.pulse.special).toBe('overdrive');
  });
});

describe('0373 — the overdrive: the pulse three times over, and it pierces', () => {
  it('a pulse fired in the surge carries the row’s damage and pierce, and one fired after it does not', () => {
    const { world, frame } = fitted('pulse', 'straight');
    const surge = SPECIALS.overdrive.surge!;
    launchSpecial(world, 'overdrive');
    world.fireIn = 1;
    frame.step();
    expect(world.playerShots.size, 'the gun did not fire, so this measured nothing').toBeGreaterThan(0);
    const shot = world.playerShots.at(0);
    expect(shot.damage, 'the surge did not multiply the shot').toBe(world.weapon.damage * surge.gun!.damage);
    expect(shot.health, 'the surge did not make the shot pierce').toBe(surge.gun!.pierce);

    world.surgeFor = 0;
    world.playerShots.clear();
    world.fireIn = 1;
    frame.step();
    expect(world.playerShots.at(0).damage, 'the surge outlived its clock').toBe(world.weapon.damage);
    expect(world.playerShots.at(0).health, 'a shot pierced with no surge on').toBe(1);
  });

  it('and a pierced body does not spend the shot, which goes on to the next', () => {
    // The pierce in the picture: two bodies in a line up the lane, one volley, both hurt.
    const { world, frame } = fitted('pulse', 'straight');
    launchSpecial(world, 'overdrive');
    const near = world.enemies.spawn()!;
    reset(near, world.ship.along + 20, world.ship.across, { ...ENEMIES.turret, health: 999 }, world.enemyKinds.turret);
    const far = world.enemies.spawn()!;
    reset(far, world.ship.along + 45, world.ship.across, { ...ENEMIES.turret, health: 999 }, world.enemyKinds.turret);
    for (const body of [near, far]) {
      body.fireIn = NEVER;
      body.velAlong = world.scrollPerStep;
    }
    world.fireIn = 1;
    for (let i = 0; i < 30; i++) {
      world.ship.invulnFor = 2;
      frame.step();
      world.fireIn = NEVER;
    }
    expect(near.health, 'the first body was never hit').toBeLessThan(999);
    expect(far.health, 'the shot stopped at the first body, so it did not pierce').toBeLessThan(999);
  });
});

describe('0373 — the hunt: missiles four times over, and a seeker flies twice as far', () => {
  it('a missile launched in the surge carries the row’s damage and fuse', () => {
    const { world, frame } = fitted('pulse', 'homing');
    const surge = SPECIALS.hunt.surge!;
    launchSpecial(world, 'hunt');
    world.missileIn = 1;
    frame.step();
    expect(world.missiles.size, 'the tubes did not fire, so this measured nothing').toBeGreaterThan(0);
    const missile = world.missiles.at(0);
    expect(missile.damage, 'the surge did not multiply the missile').toBe(world.weapon.missileDamage * surge.tubes!.damage);
    // One step of its fuse has burned by the time it is read.
    expect(missile.lifeFor, 'the surge did not lengthen the seeker’s fuse').toBeGreaterThanOrEqual(
      world.weapon.fuse * surge.tubes!.fuse - 1,
    );
    expect(world.weapon.fuse, 'the seeker has no fuse, so doubling it proves nothing').toBeGreaterThan(0);
  });
});

describe('0373 — a surge is worn', () => {
  it('its aura is on the ship for as long as it lasts, blinks at the end, and is gone after', () => {
    const { world, frame } = fitted('pulse', 'homing');
    const surge = SPECIALS.hunt.surge!;
    launchSpecial(world, 'hunt');
    frame.step();
    expect(world.aura.size, 'the surge put no aura on the ship').toBe(1);
    expect(world.aura.at(0).sprite, 'the aura is not the one the row names').toBe(surge.aura);
    expect(Math.hypot(world.aura.at(0).along - world.ship.along, world.aura.at(0).across - world.ship.across)).toBeLessThan(1e-9);

    let off = 0;
    for (let i = 1; i < surge.steps - 1; i++) {
      world.ship.invulnFor = 2;
      frame.step();
      if (world.aura.size === 0) off++;
    }
    expect(off, 'the aura never blinked, so its end comes as a surprise').toBeGreaterThan(0);
    expect(off, 'the aura blinked for more than its last second and a half').toBeLessThan(surge.steps / 5);
    for (let i = 0; i < 5; i++) frame.step();
    expect(world.aura.size, 'the aura outlived the surge').toBe(0);
  });

  it('and is drawn under every shot, so no halo can hide a bullet beside the ship', () => {
    /*
      ⚠️ **THE FIRST VERSION WAS OVER THEM.** The aura sat with the exhaust, above the enemy shots, and
      baked as a solid disc — a twelve-unit hole in the picture round the one place the player is
      watching. Read off the game's own draw order in `src/app/mount.ts`, as 0229's guard reads it.
    */
    const source = readFileSync(resolve(fileURLToPath(new URL('.', import.meta.url)), '../src/app/mount.ts'), 'utf8');
    const order = /layers: \[([^\]]+)\]/.exec(source)![1]!.split(',').map((s) => s.trim());
    const at = (name: string): number => {
      const i = order.indexOf(name);
      expect(i, `${name} is not in the draw order`).toBeGreaterThanOrEqual(0);
      return i;
    };
    expect(at('aura'), 'the aura is drawn over enemy fire, so it can hide a bullet').toBeLessThan(at('enemyShots'));
    expect(at('aura'), 'the aura is drawn over the player’s fire').toBeLessThan(at('playerShots'));
    expect(at('aura'), 'the aura is drawn over the ship').toBeLessThan(at('shipPool'));
  });

  it('and it goes with the ship that wore it', () => {
    const { world, frame } = fitted('pulse', 'homing');
    launchSpecial(world, 'overdrive');
    frame.step();
    expect(world.aura.size).toBe(1);
    respawn(world);
    expect(world.surgeFor, 'a surge outlived the ship').toBe(0);
    expect(world.aura.size, 'an aura outlived the ship').toBe(0);
  });
});
