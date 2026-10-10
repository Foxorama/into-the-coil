/**
 * THE RINGS ARE THROWN — `docs/decisions/0588-the-rings-are-thrown.md`.
 *
 * *"You also need to be able to use the right joystick on a controller to be able to direct the energy
 * pulses in a 45 degree arc straight ahead."* Held from the stick to the ring in flight: the right stick
 * is the intent's `aim`, under the left stick's radial deadzone and its handedness; the ray turns its volley
 * by that share of its arc, faces where it was thrown, and no other gun is steered at all. The arc is
 * asserted in degrees, the unit the ask was given in.
 */

import { describe, expect, it } from 'vitest';
import { SPECIAL_BINDINGS } from '../src/content/actions.ts';
import { makeIntent } from '../src/sim/intent.ts';
import { combineDevices } from '../src/app/devices.ts';
import { PAD_AIM_X, PAD_AIM_Y, PAD_DEADZONE, attachPad } from '../src/app/pad.ts';
import { GameFrame, wearHull, type World } from '../src/app/frame.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, shipCarrying } from '../src/content/ships.ts';
import { WEAPONS, WEAPON_KINDS, type WeaponKind } from '../src/content/weapons.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;

/** A pad with only its right stick pushed. */
function rightStick(x: number, y: number): Gamepad {
  const axes = [0, 0, 0, 0];
  axes[PAD_AIM_X] = x;
  axes[PAD_AIM_Y] = y;
  return { axes, buttons: [], connected: true } as unknown as Gamepad;
}

/** What one step of the pad asks for, with the scroll axis given. */
function aimOf(pad: Gamepad, along: 'x' | 'y' = 'x'): { aim: number; along: number; across: number } {
  const src = combineDevices([attachPad({ pads: () => [pad], alongAxis: () => along })]);
  const intent = makeIntent(SPECIAL_BINDINGS);
  src.contribute(intent);
  return { aim: intent.aim, along: intent.along, across: intent.across };
}

/** `gun`'s own ship, firing on the next step, its stick at `aim`. */
function firing(gun: WeaponKind, aim: number): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  built.world.shipRow = SHIPS[shipCarrying(gun)];
  built.world.weapon = weaponFor(built.world.shipRow, []);
  wearHull(built.world);
  built.world.fireIn = 1;
  built.world.missileIn = NEVER;
  built.world.intent.aim = aim;
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** The heading of a shot in the camera's frame, in degrees: nought straight up the lane. */
function headingOf(world: World, i: number): number {
  const shot = world.playerShots.at(i);
  return (Math.atan2(shot.velAcross, shot.velAlong - world.scrollPerStep) * 180) / Math.PI;
}

describe('0588 — the right stick', () => {
  it('is the aim across the lane, and moves the ship not at all', () => {
    const up = aimOf(rightStick(0, -1));
    expect(up.aim).toBe(-1);
    expect(up.along, 'the right stick moved the ship').toBe(0);
    expect(up.across, 'the right stick moved the ship').toBe(0);
    expect(aimOf(rightStick(0.6, 0.8)).aim).toBeCloseTo(0.8);
  });

  it('rests under the left stick’s radial deadzone', () => {
    const drift = PAD_DEADZONE * 0.9;
    expect(aimOf(rightStick(drift * 0.7, drift * 0.7)).aim, 'a resting right stick steered the gun').toBe(0);
  });

  it('turns with the screen, as the left stick does', () => {
    expect(aimOf(rightStick(1, 0), 'y').aim, 'held in portrait, across the lane is the stick’s x').toBe(1);
    expect(aimOf(rightStick(1, 0), 'x').aim, 'held in landscape, the stick’s x is along the lane').toBe(0);
  });
});

describe('0588 — the rings are thrown', () => {
  it('THE ASK: the ray’s pulses go where the stick points, across a 45° arc straight ahead', () => {
    expect((WEAPONS.ray.aim * 2 * 180) / Math.PI, 'the arc is not 45°').toBeCloseTo(45);
    for (const [aim, heading] of [
      [0, 0],
      [-1, -22.5],
      [1, 22.5],
      [0.5, 11.25],
    ] as const) {
      const { world, frame } = firing('ray', aim);
      frame.step();
      expect(world.playerShots.size, 'the ray did not fire').toBeGreaterThan(0);
      for (let i = 0; i < world.playerShots.size; i++) {
        expect(headingOf(world, i), `a stick at ${aim} threw a ring off its heading`).toBeCloseTo(heading, 5);
        // A ring faces where it was thrown, so the four stand square to their flight.
        expect((world.playerShots.at(i).turn * 180) / Math.PI).toBeCloseTo(heading, 5);
      }
    }
  });

  it('every other gun ignores the stick entirely', () => {
    for (const gun of WEAPON_KINDS) {
      if (gun === 'ray') continue;
      expect(WEAPONS[gun].aim, `the ${gun} is steered`).toBe(0);
      const straight = firing(gun, 0);
      const pushed = firing(gun, 1);
      for (let step = 0; step < 30; step++) {
        straight.frame.step();
        pushed.frame.step();
      }
      expect(pushed.world.playerShots.size, `the ${gun} fired differently with the stick pushed`).toBe(straight.world.playerShots.size);
      for (let i = 0; i < pushed.world.playerShots.size; i++) {
        expect(pushed.world.playerShots.at(i).velAcross, `the ${gun} was steered by the stick`).toBeCloseTo(straight.world.playerShots.at(i).velAcross, 9);
      }
    }
  });
});
