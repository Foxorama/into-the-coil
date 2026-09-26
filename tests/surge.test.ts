import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { GameFrame, launchSpecial, respawn, wearHull, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { MISSILES, MISSILE_KINDS } from '../src/content/missiles.ts';
import { UPGRADE_TIERS, effectOf, overflowOf, weaponFor, type Loadout, type UpgradeKind } from '../src/content/pickups.ts';
import { POD_ACROSS, SPECIALS, type Surge } from '../src/content/specials.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { ACROSS_SPAN, MAX_ASPECT, viewOf } from '../src/sim/camera.ts';
import { SHOTS } from '../src/content/shots.ts';
import { WEAPONS, WEAPON_KINDS } from '../src/content/weapons.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
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

  it('and the ask’s own pairings, as 0375 swapped them', () => {
    // *"let's make the auto-gun pickup the regular bomb and change the autogun supercharge effect over
    // to the regular forward firing missiles"*, and 0373's *"homing missiles - … purple aura"*.
    expect(WEAPONS.pulse.special).toBe('bomb');
    expect(MISSILES.straight.special).toBe('overdrive');
    expect(MISSILES.homing.special).toBe('hunt');
  });
});

/** One volley in the surge: the fitted tubes' missiles and the pods', told apart by what they carry. */
function volley(world: World, frame: GameFrame, surge: Surge): { tubes: Entity[]; pods: Entity[] } {
  world.missiles.clear();
  world.missileIn = 1;
  frame.step();
  world.missileIn = NEVER;
  const podRow = SHOTS[MISSILES[surge.pods.missile].shot];
  const all: Entity[] = [];
  for (let i = 0; i < world.missiles.size; i++) all.push(world.missiles.at(i));
  const charged = (m: Entity): boolean => m.damage === podRow.damage * surge.pods.damage && m.sprite === podRow.sprite;
  return { tubes: all.filter((m) => !charged(m)), pods: all.filter(charged) };
}

describe('0379 — a tube special fires two of its own, and the fitted tubes fire as they are', () => {
  it('THE ASK: every fitted tube with every tube special — four of one kind, or two and two', () => {
    /*
      *"Let's change that special so that it fires out two additional missiles of the special bomb
      variety, so you could have any combo of 4 or 2/2 depending on your equipped missile and the
      special."* Every pairing, one volley each: the fitted tubes' missiles unchanged, and the pods'
      of the special's own kind, charged by its row.
    */
    for (const tube of MISSILE_KINDS) {
      for (const kind of [MISSILES.straight.special, MISSILES.homing.special]) {
        const surge = SPECIALS[kind].surge!;
        const { world, frame } = fitted('pulse', tube);
        launchSpecial(world, kind);
        const { tubes, pods } = volley(world, frame, surge);
        expect(tubes.length, `${tube} tubes with ${kind} did not fire their own`).toBe(world.weapon.launchers);
        for (const m of tubes) {
          expect(m.damage, `${kind} charged the ${tube} tubes it was not earned from`).toBe(world.weapon.missileDamage);
          expect(m.health, `${kind} made the ${tube} tubes pierce`).toBe(1);
          expect(m.sprite, `the fitted tubes fired something other than ${tube}`).toBe(SHOTS[MISSILES[tube].shot].sprite);
        }
        expect(pods.length, `${kind} did not fire its pods`).toBe(surge.pods.count);
        for (const m of pods) expect(m.health, `${kind}'s pods do not carry its pierce`).toBe(surge.pods.pierce);
        // From outside the hull, one each side, where the pods are drawn.
        const offsets = pods.map((m) => Math.round((m.prevAcross - world.ship.across) * 10) / 10).sort((a, b) => a - b);
        expect(offsets, `${kind}'s pods did not fire from where they are drawn`).toEqual([-POD_ACROSS, POD_ACROSS]);
      }
    }
  });

  it('with no tubes fitted the pods still fire, and when the surge is over only the tubes do', () => {
    const surge = SPECIALS.overdrive.surge!;
    const { world } = playableWorld(NO_LEVEL);
    const bare = new GameFrame(world);
    world.fireIn = NEVER;
    expect(world.weapon.launchers, 'the fixture has tubes, so this measured nothing').toBe(0);
    launchSpecial(world, 'overdrive');
    world.missileIn = 1;
    bare.step();
    expect(world.missiles.size, 'a ship with no tubes fired no pods').toBe(surge.pods.count);

    const fittedOne = fitted('pulse', 'straight');
    launchSpecial(fittedOne.world, 'overdrive');
    fittedOne.world.surgeFor = 0;
    const after = volley(fittedOne.world, fittedOne.frame, surge);
    expect(after.pods.length, 'the pods outlived the surge').toBe(0);
    expect(after.tubes.length, 'the tubes stopped with the surge').toBe(fittedOne.world.weapon.launchers);
  });

  it('the strongest tubes with a surge on the widest screen never fill the missile pool', () => {
    /*
      ⚠️ **A BUDGET, AND ITS OWNER IS `CAPACITY.missiles` in `src/app/mount.ts`.** The pods double what
      a volley puts in the air, and a full pool drops the rest of a volley — the fitted tubes' or the
      pods' — silently. Measured at thirty-six when the pods landed, against a pool of twenty-four.
      Flown on the widest screen any device has, where a straight missile lives longest (0023).
    */
    for (const tube of MISSILE_KINDS) {
      for (const kind of [MISSILES.straight.special, MISSILES.homing.special]) {
        const { world, frame } = fitted('pulse', tube);
        world.view = viewOf(ACROSS_SPAN * MAX_ASPECT * 10, ACROSS_SPAN * 10);
        world.missileIn = 1;
        launchSpecial(world, kind);
        let most = 0;
        for (let i = 0; i < SPECIALS[kind].surge!.steps; i++) {
          if (world.missileIn === NEVER) world.missileIn = 1;
          world.ship.invulnFor = 2;
          frame.step();
          most = Math.max(most, world.missiles.size);
        }
        expect(most, `${tube} with ${kind} filled the missile pool of ${CAPACITY.missiles}`).toBeLessThan(CAPACITY.missiles);
        expect(most, `${tube} with ${kind} barely fired, so this measured nothing`).toBeGreaterThan(CAPACITY.missiles / 2);
      }
    }
  });

  it('a seeker pod flies twice as far as a seeker, and the pods’ charge is the row’s', () => {
    const surge = SPECIALS.hunt.surge!;
    const { world, frame } = fitted('pulse', 'straight');
    launchSpecial(world, 'hunt');
    const { pods } = volley(world, frame, surge);
    expect(pods.length).toBe(surge.pods.count);
    expect(MISSILES.homing.fuse, 'the seeker has no fuse, so doubling it proves nothing').toBeGreaterThan(0);
    // One step of its fuse has burned by the time it is read.
    for (const m of pods) expect(m.lifeFor, 'the pod’s fuse is not the row’s').toBeGreaterThanOrEqual(MISSILES.homing.fuse * surge.pods.fuse - 1);
  });

  it('and a pierced body does not spend an overdrive pod, which goes on to the next', () => {
    // The pierce in the picture: two bodies in a line up a pod's lane, one volley, both hurt.
    const surge = SPECIALS.overdrive.surge!;
    const { world, frame } = fitted('pulse', 'straight');
    launchSpecial(world, 'overdrive');
    const { pods } = volley(world, frame, surge);
    expect(pods.length, 'the pods did not fire, so this measured nothing').toBeGreaterThan(0);
    const lane = pods[0]!;
    const near = world.enemies.spawn()!;
    reset(near, lane.along + 20, lane.across, { ...ENEMIES.turret, health: 999 }, world.enemyKinds.turret);
    const far = world.enemies.spawn()!;
    reset(far, lane.along + 45, lane.across, { ...ENEMIES.turret, health: 999 }, world.enemyKinds.turret);
    for (const body of [near, far]) {
      body.fireIn = NEVER;
      body.velAlong = world.scrollPerStep;
    }
    for (let i = 0; i < 60; i++) {
      world.ship.invulnFor = 2;
      frame.step();
    }
    expect(near.health, 'the first body was never hit').toBeLessThan(999);
    expect(far.health, 'the missile stopped at the first body, so it did not pierce').toBeLessThan(999);
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
