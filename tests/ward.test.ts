import { describe, expect, it } from 'vitest';

import { GameFrame, launchSpecial, type World } from '../src/app/frame.ts';
import { ACTIONS, DEFAULT_BINDINGS } from '../src/content/actions.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { PICKUPS, effectOf, faceOf, specialOf } from '../src/content/pickups.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SIDES, SPECIALS, WARD_KINDS } from '../src/content/specials.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { startingArsenal } from '../src/state/slices/run.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE WARD — `docs/decisions/0447-the-ward-is-a-third-trigger.md`.
 *
 * *"The void bomb will be on rotation with the shield on that pickup … the void bomb will need to have
 * its own unique button."* The nova joins the void on that button because it pops bullets. Every
 * number is read off the rows, so a nova tuned wider or harder moves the guard with it.
 */

const NEVER = Number.MAX_SAFE_INTEGER;
const NOVA = SPECIALS.nova.nova!;

function quiet(): { world: World; frame: GameFrame } {
  const { world } = playableWorld(NO_LEVEL);
  world.fireIn = NEVER;
  world.missileIn = NEVER;
  return { world, frame: new GameFrame(world) };
}

/** A body that holds its place in the world and cannot be killed by one strike. */
function body(world: World, along: number, across: number): Entity {
  const enemy = world.enemies.spawn()!;
  reset(enemy, along, across, { ...ENEMIES.turret, health: 999 }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

describe('0447 — the ward is a third trigger', () => {
  it('THE ASK: the void and the nova are the ward’s, on their own button, E and X', () => {
    expect(SIDES, 'there is no third trigger').toContain('ward');
    expect(SPECIALS.voidMissile.side, 'the void is not on the ward').toBe('ward');
    expect(SPECIALS.nova.side, 'the nova is not on the ward').toBe('ward');
    expect(WARD_KINDS).toEqual(['voidMissile', 'nova']);
    // The binding order is the side order: the third edge action is the ward's.
    expect(ACTIONS.special3.slot, 'the third trigger is not the third slot').toBe(SIDES.indexOf('ward'));
    expect(DEFAULT_BINDINGS.special3, 'the ward is not on E and X').toEqual(['KeyE', 'KeyX']);
  });

  it('the shield pickup turns through the shield, the void and the nova, and each face gives what it shows', () => {
    const loadout = { upgrades: [], missile: 'straight' } as const;
    expect(PICKUPS.shield.faces).toEqual([SPRITE.pickupShield, SPRITE.pickupVoid, SPRITE.pickupNova]);
    expect(effectOf('shield', 0, loadout), 'the shield face is not a shield').toBe('shield');
    WARD_KINDS.forEach((kind, i) => {
      expect(effectOf('shield', i + 1, loadout), `the shield pickup's ${kind} face is not a charge`).toBe('special');
      expect(specialOf('shield', i + 1), `the shield pickup's face ${i + 1} bought somebody else's special`).toBe(kind);
      expect(faceOf('shield', i + 1).label, `the key names the shield pickup's face ${i + 1} wrongly`).toBe(SPECIALS[kind].label);
      expect(specialOf('ward', i), `the ward pickup's face ${i} bought somebody else's special`).toBe(kind);
    });
  });

  it('a Burn run opens with one void beside its own pair, unless its own pair is already the ward’s', () => {
    for (const tier of DIFFICULTY_KINDS) {
      for (const ship of SHIP_KINDS) {
        const own = WEAPONS[SHIPS[ship].weapon].special;
        const arsenal = startingArsenal(ship, tier);
        const extra = SPECIALS[own].side === 'ward' ? [] : DIFFICULTIES[tier].opensWith;
        const ward = arsenal.ward.filter((k) => k !== own);
        expect(ward, `${ship} on ${tier} opens with the wrong extra ward`).toEqual([...extra]);
      }
    }
    expect(startingArsenal('fighter', 'burn').ward, 'Burn gives the fighter no void').toEqual(['voidMissile']);
    expect(startingArsenal('caddie', 'burn').ward, 'the caddie on Burn has a void on top of its novas').toEqual(['nova', 'nova']);
    expect(startingArsenal('fighter', 'savior').ward, 'Savior gives a void').toEqual([]);
  });
});

describe('0447 — the nova', () => {
  it('pops every hostile shot its edge reaches, and leaves one it has not reached yet', () => {
    const { world, frame } = quiet();
    const steps = 20;
    const reached = NOVA.start + steps * NOVA.grow;
    const near = world.enemyShots.spawn()!;
    reset(near, world.ship.along + reached / 2, world.ship.across, SHOTS.spit);
    near.velAlong = world.scrollPerStep;
    const far = world.enemyShots.spawn()!;
    reset(far, world.ship.along + reached + 30, world.ship.across, SHOTS.spit);
    far.velAlong = world.scrollPerStep;
    launchSpecial(world, 'nova');
    for (let i = 0; i < steps; i++) frame.step();
    expect(world.enemyShots.size, 'a shot the ring crossed survived it, or one it had not reached was taken').toBe(1);
    expect(world.enemyShots.at(0), 'the ring took the shot it had not reached').toBe(far);
  });

  it('strikes a body it crosses ONCE, for its row’s damage, however long it grows', () => {
    const { world, frame } = quiet();
    const hit = body(world, world.ship.along + 40, world.ship.across);
    launchSpecial(world, 'nova');
    for (let i = 0; i < 200 && world.novaKind !== null; i++) frame.step();
    expect(world.novaKind, 'the nova never closed').toBeNull();
    expect(999 - hit.health, 'the ring struck the body other than once').toBe(NOVA.damage);
  });

  it('is drawn at the radius it lands at, in pieces the view can show, and is gone once past every corner', () => {
    const { world, frame } = quiet();
    launchSpecial(world, 'nova');
    let drawnSteps = 0;
    for (let i = 0; i < 200 && world.novaKind !== null; i++) {
      frame.step();
      if (world.novaKind === null) break;
      const radius = NOVA.start + world.novaAge * NOVA.grow;
      const centreAlong = world.cameraAlong + world.novaOffset;
      for (let p = 0; p < world.nova.size; p++) {
        const piece = world.nova.at(p);
        expect(piece.sprite).toBe(SPRITE.novaArc);
        const d = Math.hypot(piece.along - centreAlong, piece.across - world.novaAcross);
        // The picture IS the radius — 0036 — to well under a unit.
        expect(Math.abs(d - radius), 'a piece is drawn off the radius that lands').toBeLessThan(0.01);
        expect(piece.across, 'a piece was laid off the screen').toBeGreaterThan(-SPRITE_EXTENT.novaArc - 0.01);
        expect(piece.across, 'a piece was laid off the screen').toBeLessThan(ACROSS_SPAN + SPRITE_EXTENT.novaArc + 0.01);
      }
      if (world.nova.size > 0) drawnSteps++;
    }
    expect(world.novaKind, 'the nova never closed').toBeNull();
    expect(world.nova.size, 'pieces were left on the screen after it closed').toBe(0);
    // About a second — the row's own arithmetic, held in seconds the player watches it for.
    expect(drawnSteps / 60, 'the ring crossed the screen faster than a player can see it').toBeGreaterThan(0.4);
    expect(drawnSteps / 60, 'the ring hung about long after it had passed').toBeLessThan(1.5);
  });
});
