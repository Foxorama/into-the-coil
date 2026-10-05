import { describe, expect, it } from 'vitest';
import { GameFrame, wearHull, type World } from '../src/app/frame.ts';
import { STEP_MS } from '../src/app/loop.ts';
import { RIMS, RIM_KINDS } from '../src/content/rims.ts';
import { SHIPS, SHIP_KINDS, fitted, type ShipKind } from '../src/content/ships.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { WARES, OWNABLES } from '../src/content/wares.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { initialHangar, rimOpen } from '../src/state/slices/hangar.ts';
import { SCREENS, rimWhy, wareWhy } from '../src/state/screens.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE WHEELS TURN — `docs/decisions/0527-the-wheels-turn.md`.
 *
 * ⚠️ **What is held is the rule, the trade, the key, and that a spinner TURNS — in the player's units:
 * a turn in the seconds the Mothership took.** Asked: *"from Golf-Stars add the full sick spinning
 * wheels from The Mothership into Cosmo's for 1000 shards"*.
 */

/** The state with `ships` won in and `shards` held. */
function holding(shards: number, ...ships: ShipKind[]): State {
  let state: State = { ...initialState, hangar: { ...initialState.hangar, shards } };
  for (const ship of ships) state = reduce(state, { slice: 'hangar', type: 'won', ship });
  return state;
}

/** A world flying `ship` on `rim`, its gun silent. */
function flying(ship: ShipKind, rim: (typeof RIM_KINDS)[number] | null): { world: World; frame: GameFrame } {
  const { world } = playableWorld(NO_LEVEL);
  world.shipRow = fitted(SHIPS[ship], SHIPS[ship].weapon, rim ?? undefined);
  world.weapon = weaponFor(world.shipRow, []);
  wearHull(world);
  world.fireIn = Number.MAX_SAFE_INTEGER;
  world.missileIn = Number.MAX_SAFE_INTEGER;
  return { world, frame: new GameFrame(world) };
}

describe('the rims', () => {
  it('THE ASK: the Mothership’s spinners on Cosmo’s shelf at 1000 shards, and they turn', () => {
    expect(WARES).toContain('spinner');
    expect(OWNABLES.spinner.price).toBe(1000);
    expect(RIMS.spinner.turn, 'the spinners are baked still').not.toBe(null);
    expect(initialHangar.owned.spinner, 'the spinners were owned before they were bought').toBe(false);
  });

  it('every car opens on its own rim, and a ship with no wheels on none', () => {
    for (const ship of SHIP_KINDS) expect(initialHangar.rim[ship], ship).toBe(SHIPS[ship].wheels?.rim ?? null);
    expect(initialHangar.rim.firebird).toBe('snowflake');
    expect(initialHangar.rim.estate).toBe('whitewall');
  });

  it('a car’s own rim always; the other car’s on the dash’s rule; the spinners once bought, on either car', () => {
    const none = holding(0).hangar;
    expect(rimOpen(none, 'firebird', 'snowflake')).toBe(true);
    expect(rimOpen(none, 'firebird', 'whitewall'), 'the estate’s rims on a Firebird never won in').toBe(false);
    expect(rimOpen(holding(0, 'firebird', 'estate').hangar, 'firebird', 'whitewall')).toBe(true);
    expect(rimOpen(none, 'estate', 'spinner'), 'spinners never bought').toBe(false);
    const bought = reduce(holding(1000), { slice: 'hangar', type: 'bought', ware: 'spinner' });
    expect(bought.hangar.shards).toBe(0);
    for (const car of ['firebird', 'estate'] as const) expect(rimOpen(bought.hangar, car, 'spinner'), car).toBe(true);
  });

  it('nothing on a ship with no wheels, whatever is owned', () => {
    const bought = reduce(holding(1000, 'fighter', 'firebird'), { slice: 'hangar', type: 'bought', ware: 'spinner' });
    for (const rim of RIM_KINDS) {
      expect(rimOpen(bought.hangar, 'fighter', rim), rim).toBe(false);
      expect(reduce(bought, { slice: 'hangar', type: 'rim', ship: 'caddie', rim }).hangar.rim.caddie, rim).toBe(null);
    }
    expect(rimWhy('fighter', false, true, false, true)).toContain('no wheels');
  });

  it('the band offers every rim by name, saying where each comes from', () => {
    const band = SCREENS.parts.choices.find((c) => c.name === 'rim')!;
    expect(band.options.map((o) => o.label)).toEqual(RIM_KINDS.map((rim) => RIMS[rim].name));
    expect(band.options[RIM_KINDS.indexOf('spinner')]!.hint).toContain('Cosmo');
    expect(band.options[RIM_KINDS.indexOf('whitewall')]!.hint).toContain('Gilded Estate');
  });

  it('the shelf sends a bought rim to Paint & Parts, and a bought dangle to the hangar', () => {
    expect(wareWhy('spinner', true, 0)).toContain('Paint & Parts');
    expect(wareWhy('golfball', true, 0)).toContain('hangar');
    expect(wareWhy('spinner', false, 400)).toBe('Need 600 more Star Shards');
  });
});

describe('the key', () => {
  it('keeps what was bought and what each car wears', () => {
    let state = reduce(holding(1000), { slice: 'hangar', type: 'bought', ware: 'spinner' });
    state = reduce(state, { slice: 'hangar', type: 'rim', ship: 'estate', rim: 'spinner' });
    expect(state.hangar.rim.estate).toBe('spinner');
    expect(hangarFrom(serialiseHangar(state.hangar), initialHangar)).toEqual(state.hangar);
  });

  it('refuses a rim its own wins or purchases do not open, and reads an old key as every car on its own', () => {
    const forged = JSON.stringify({ v: HANGAR_VERSION, rim: { estate: 'spinner', firebird: 'whitewall', fighter: 'snowflake' } });
    expect(hangarFrom(forged, initialHangar).rim, 'a rim never opened was fitted from the save').toEqual(initialHangar.rim);
    const old = JSON.stringify({ v: HANGAR_VERSION, won: { estate: true }, owned: { golfball: true } });
    expect(hangarFrom(old, initialHangar).rim).toEqual(initialHangar.rim);
  });
});

describe('the run', () => {
  it('flies a car’s row wearing the fitted rim, and a ship with no wheels unchanged', () => {
    expect(fitted(SHIPS.estate, SHIPS.estate.weapon, 'spinner').wheels?.rim).toBe('spinner');
    expect(fitted(SHIPS.estate, SHIPS.estate.weapon).wheels?.rim).toBe('whitewall');
    expect(fitted(SHIPS.fighter, SHIPS.fighter.weapon, 'spinner')).toBe(SHIPS.fighter);
  });

  it('a spinner stands over each wheel and TURNS — once round in the Mothership’s 0.7 s and 0.8 s', () => {
    const { world, frame } = flying('firebird', 'spinner');
    frame.step();
    expect(world.wheels.size, 'no turning picture over the wheels').toBe(2);
    const wheels = SHIPS.firebird.wheels!;
    for (let i = 0; i < 2; i++) {
      const wheel = world.wheels.at(i);
      expect(wheel.sprite).toBe(SPRITE.spinnerWheel);
      expect(wheel.along - world.ship.along, `wheel ${i} off its tyre`).toBeCloseTo(wheels.at[i]!.along, 6);
      expect(wheel.across - world.ship.across, `wheel ${i} off its tyre`).toBeCloseTo(wheels.at[i]!.across, 6);
    }
    // In seconds, as the player watches it: summed over a whole turn of the front wheel, one full turn.
    const rates = RIMS.spinner.turn!;
    const steps = Math.round((rates[0] * 1000) / STEP_MS);
    let front = 0;
    let back = 0;
    for (let s = 0; s < steps; s++) {
      const a = world.wheels.at(0);
      const b = world.wheels.at(1);
      const wasA = a.turn;
      const wasB = b.turn;
      frame.step();
      front += wrap(world.wheels.at(0).turn - wasA);
      back += wrap(world.wheels.at(1).turn - wasB);
    }
    expect(front / (2 * Math.PI), 'the front wheel did not go once round in 0.7 s').toBeCloseTo(1, 2);
    expect(back / (2 * Math.PI), 'the back wheel turned with the front, in step').toBeCloseTo(rates[0] / rates[1], 2);
    expect(front, 'it turned backward for a car rolling nose-first').toBeGreaterThan(0);
  });

  it('flashes when the car does, and is gone with the car and on a rim baked still', () => {
    const { world, frame } = flying('estate', 'spinner');
    world.ship.flashFor = 4;
    frame.step();
    expect(world.wheels.at(0).sprite, 'the wheels did not take the hit').toBe(SPRITE.spinnerWheelHit);
    world.shipPool.clear();
    frame.step();
    expect(world.wheels.size, 'the wheels outlived the car').toBe(0);
    for (const [ship, rim] of [['estate', 'whitewall'], ['firebird', 'snowflake'], ['fighter', null]] as const) {
      const still = flying(ship, rim);
      still.frame.step();
      expect(still.world.wheels.size, `${ship} on ${String(rim)} wore turning wheels`).toBe(0);
    }
  });
});

/** An angle step brought into (−π, π]. */
function wrap(a: number): number {
  return a > Math.PI ? a - 2 * Math.PI : a <= -Math.PI ? a + 2 * Math.PI : a;
}
