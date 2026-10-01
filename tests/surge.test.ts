import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { GameFrame, MUZZLE_ALONG, launchSpecial, respawn, wearHull, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { MISSILES, MISSILE_KINDS } from '../src/content/missiles.ts';
import { BOMB_KINDS, PICKUPS, UPGRADE_TIERS, effectOf, specialOf, weaponFor, type Loadout, type UpgradeKind } from '../src/content/pickups.ts';
import { SHIPS, shipCarrying } from '../src/content/ships.ts';
import { POD_ACROSS, POD_NOSE, SPECIALS, podSide, type Surge } from '../src/content/specials.ts';
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

/**
 * A world flying the ship `gun` is keyed to (0441), its tubes fitted at the cap, both silenced until
 * the test says.
 */
function fitted(gun: (typeof WEAPON_KINDS)[number], tube: (typeof MISSILE_KINDS)[number]): { world: World; frame: GameFrame } {
  const { world } = playableWorld(NO_LEVEL);
  world.shipRow = SHIPS[shipCarrying(gun)];
  world.weapon = weaponFor(world.shipRow, full('missile'), tube);
  wearHull(world);
  world.fireIn = NEVER;
  world.missileIn = NEVER;
  return { world, frame: new GameFrame(world) };
}

describe('0373 — a full ladder buys the face’s own special', () => {
  /*
    ⚠️ **A GUN'S HALF OF `THE ASK` — every gun, overflowed, stocks its own special — WAS HERE.**
    `docs/decisions/0441-a-pilot-flies-their-own-ship.md` took the gun's ladder, so a gun cannot
    overflow; its special is bought from the bomb pickup's face instead, held below and in
    `tests/pickups.test.ts`.
  */
  it('THE ASK: every tube, overflowed, stocks the special its row names', () => {
    for (const tube of MISSILE_KINDS) {
      const loadout: Loadout = { upgrades: full('missile'), missile: tube };
      const face = MISSILE_KINDS.indexOf(tube);
      expect(effectOf('missile', face, loadout), `full ${tube} tubes did not overflow`).toBe('special');
      expect(specialOf('missile', face), `full ${tube} tubes bought somebody else's special`).toBe(MISSILES[tube].special);
    }
  });

  it('and every gun’s own special is a face the bomb pickup shows, so any ship can buy it — 0441', () => {
    for (const gun of WEAPON_KINDS) {
      /*
        ⚠️ **BUT A WARD SPECIAL IS THE SHIELD PICKUP'S — 0447.** The ray's nova pops bullets, so it was
        put in the shield's cycle rather than the bomb's, at the player's word; any ship can still buy
        it, off the shield pickup's face.
      */
      if (SPECIALS[WEAPONS[gun].special].side === 'ward') {
        const face = PICKUPS.shield.faces.indexOf(SPECIALS[WEAPONS[gun].special].face);
        expect(face, `the ${gun}'s ${WEAPONS[gun].special} is on no face of the shield pickup`).toBeGreaterThan(0);
        expect(effectOf('shield', face, { upgrades: [], missile: 'straight' })).toBe('special');
        expect(specialOf('shield', face), `a shield pickup showing the ${gun}'s special bought somebody else's`).toBe(WEAPONS[gun].special);
        continue;
      }
      const face = BOMB_KINDS.indexOf(WEAPONS[gun].special);
      expect(face, `the ${gun}'s ${WEAPONS[gun].special} is on no face of the bomb pickup`).toBeGreaterThanOrEqual(0);
      expect(effectOf('bomb', face, { upgrades: [], missile: 'straight' }), `a bomb pickup showing the ${gun}'s special is not a special`).toBe('special');
      expect(specialOf('bomb', face), `a bomb pickup showing the ${gun}'s special bought somebody else's`).toBe(WEAPONS[gun].special);
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

describe('0379 — a tube special fires its own, and the fitted tubes fire as they are', () => {
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
        // From where the pods are drawn — `podSide`, which the bake reads too (0405).
        const offsets = pods.map((m) => Math.round((m.prevAcross - world.ship.across) * 10) / 10).sort((a, b) => a - b);
        const drawn = Array.from({ length: surge.pods.count }, (_, j) => Math.round(podSide(j, surge.pods.count) * POD_ACROSS * 10) / 10);
        expect(offsets, `${kind}'s pods did not fire from where they are drawn`).toEqual(drawn);
      }
    }
  });

  it('0405, THE REPORTED ONE: a tube surge adds ONE missile, and it flies between the two regular ones', () => {
    /*
      *"The big problem was the supercharged missiles, can we make that 1 bonus missile firing in the
      middle of the two regular ones instead of 2 bonus missiles."* Held in the picture's units — where
      each missile is across the lane as it leaves — against a ship with both tubes fitted, so "the
      middle of the two regular ones" is a thing the volley can be wrong about.
    */
    for (const kind of [MISSILES.straight.special, MISSILES.homing.special]) {
      const surge = SPECIALS[kind].surge!;
      const { world, frame } = fitted('pulse', 'straight');
      launchSpecial(world, kind);
      const { tubes, pods } = volley(world, frame, surge);
      expect(tubes.length, 'the fixture has fewer than two tubes, so there is no middle to be in').toBe(2);
      expect(pods.length, `${kind} adds ${pods.length} missiles a volley`).toBe(1);
      const [low, high] = tubes.map((m) => m.prevAcross - world.ship.across).sort((a, b) => a - b);
      const pod = pods[0]!.prevAcross - world.ship.across;
      expect(pod, `${kind}'s missile leaves from ${pod.toFixed(2)} across, outside the tubes at ${low!.toFixed(2)} and ${high!.toFixed(2)}`).toBeGreaterThan(low!);
      expect(pod).toBeLessThan(high!);
      expect(Math.abs(pod), `${kind}'s missile is off the middle by ${pod.toFixed(2)}`).toBeLessThan(0.05);
      // And ahead of the nose, where its barrel is drawn, rather than from inside the hull: past the
      // fitted tubes' muzzle, launched the same step, by the barrel's length.
      const ahead = pods[0]!.prevAlong - tubes[0]!.prevAlong;
      expect(ahead, `${kind}'s missile leaves ${ahead.toFixed(2)} ahead of the tubes`).toBeCloseTo(POD_NOSE - MUZZLE_ALONG, 2);
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
        /*
          ⚠️ **"MEASURED SOMETHING" IS VOLLEYS STACKING UP, not half the pool — 0405.** Half the pool was
          a floor sized for four missiles a volley; with one pod a volley is three and the heaviest pairing
          peaks at nineteen, which is the pods being lighter and not this measuring nothing. What makes
          the budget a question at all is missiles from more than one volley in the air at once.
        */
        const aVolley = world.weapon.launchers + SPECIALS[kind].surge!.pods.count;
        expect(most, `${tube} with ${kind} never had two volleys in the air, so this measured nothing`).toBeGreaterThan(aVolley * 2);
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
