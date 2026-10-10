/**
 * THE SHIPS ARE LIT — `docs/decisions/0586-the-ships-are-lit.md`.
 *
 * *"The fighter needs lights blinking on the wingtips"* and *"Lil caddie needs to have a spinning disc of
 * funky alien UFO lights spinning around on its disc."* Held through the real frame, in seconds — the unit
 * the player sees a blink and a spin in — and the pool they share with the wheels held to never overflow.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, wearHull, type World } from '../src/app/frame.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { RIMS, RIM_KINDS } from '../src/content/rims.ts';
import { SHIPS, SHIP_KINDS, fitted, lampFrame, type ShipKind } from '../src/content/ships.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/** `ship` flying, with nothing firing. */
function flying(ship: ShipKind): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  built.world.shipRow = SHIPS[ship];
  built.world.weapon = weaponFor(built.world.shipRow, []);
  wearHull(built.world);
  built.world.fireIn = Number.MAX_SAFE_INTEGER;
  built.world.missileIn = Number.MAX_SAFE_INTEGER;
  return { world: built.world, frame: new GameFrame(built.world) };
}

describe('0586 — the ships are lit', () => {
  it('no ship, on any rim it can wear, lays more wheels and lights than the pool they share holds', () => {
    for (const ship of SHIP_KINDS) {
      for (const rim of [null, ...RIM_KINDS]) {
        const row = fitted(SHIPS[ship], SHIPS[ship].weapon, rim ?? undefined);
        const turning = row.wheels !== null && RIMS[row.wheels.rim].wheel !== null ? row.wheels.at.length : 0;
        expect(turning + row.lamps.length, `${ship} on ${String(rim)}`).toBeLessThanOrEqual(CAPACITY.wheels);
      }
    }
  });

  it('THE ASK: the fighter’s wingtips blink — both of them, lit and dark in turn, more than once a second', () => {
    const { world, frame } = flying('fighter');
    const lamps = SHIPS.fighter.lamps;
    expect(lamps, 'the fighter has a light on each wingtip').toHaveLength(2);
    expect(Math.sign(lamps[0]!.at.across), 'the two lights are on one wing').toBe(-Math.sign(lamps[1]!.at.across));
    const seen = new Set<number>();
    let flashes = 0;
    let was = -1;
    for (let step = 0; step < STEPS_PER_SECOND; step++) {
      frame.step();
      expect(world.wheels.size, 'the lights are not laid on the ship').toBe(2);
      const sprite = world.wheels.at(0).sprite;
      seen.add(sprite);
      if (sprite === SPRITE.navStrobe && was !== SPRITE.navStrobe) flashes++;
      was = sprite;
      // Both wings together, at the wingtips, wherever the ship is.
      expect(world.wheels.at(1).sprite).toBe(sprite);
      expect(world.wheels.at(0).across - world.ship.across).toBeCloseTo(lamps[0]!.at.across);
    }
    expect([...seen].sort(), 'a light that never goes dark, or never lights, does not blink').toEqual([SPRITE.navStrobe, SPRITE.navDark].sort());
    expect(flashes, 'fewer than two flashes in a second').toBeGreaterThanOrEqual(2);
  });

  it('THE ASK: the caddie’s ring of lights spins round its disc, and its colours chase', () => {
    const { world, frame } = flying('caddie');
    const lamp = SHIPS.caddie.lamps[0]!;
    expect(lamp.turn, 'the ring does not spin').not.toBe(null);
    expect(lamp.turn!, 'a ring slower than a turn in three seconds does not read as spinning').toBeLessThanOrEqual(3);
    const pictures = new Set<number>();
    let swept = 0;
    for (let step = 0; step < STEPS_PER_SECOND; step++) {
      frame.step();
      const ring = world.wheels.at(0);
      pictures.add(ring.sprite);
      let swing = ring.turn - ring.prevTurn;
      if (swing < -Math.PI) swing += Math.PI * 2;
      expect(swing, 'the ring turned backwards').toBeGreaterThanOrEqual(0);
      swept += swing;
      expect(ring.along).toBeCloseTo(world.ship.along + lamp.at.along);
    }
    expect(swept, 'the ring turned less than a third of a turn in a second').toBeGreaterThan((Math.PI * 2) / 3);
    expect(pictures.size, 'the colours never step, so nothing chases').toBe(lamp.frames.length);
  });

  it('a ship with no lights lays none', () => {
    for (const ship of ['firebird', 'estate', 'thunderbolt'] as const) expect(SHIPS[ship].lamps).toEqual([]);
    const { world, frame } = flying('estate');
    frame.step();
    expect(world.wheels.size, 'a car on rims baked still laid something').toBe(0);
  });

  it('every picture a light shows is one the clock reaches', () => {
    for (const ship of SHIP_KINDS) {
      for (const lamp of SHIPS[ship].lamps) {
        const reached = new Set<number>();
        for (let step = 0; step < STEPS_PER_SECOND * 4; step++) reached.add(lampFrame(lamp, step / STEPS_PER_SECOND));
        expect(reached.size, `${ship} has a picture its clock never shows`).toBe(lamp.frames.length);
      }
    }
  });
});
