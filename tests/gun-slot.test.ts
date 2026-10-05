import { describe, expect, it } from 'vitest';
import { SHIPS, SHIP_KINDS, fitted } from '../src/content/ships.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { gunOpen, initialHangar } from '../src/state/slices/hangar.ts';
import { SCREENS, gunWhy } from '../src/state/screens.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';

/**
 * THE GUN IS FITTED — `docs/decisions/0526-the-gun-is-fitted.md`.
 *
 * ⚠️ **What is held is that a run flies the gun the hangar fitted, and only one that has been won.**
 * Asked for: *"I do want guns to be interchangable per ship as well"*, and answered *"only onto ships
 * you've won in"* — the estate's lightning on Hook's fighter, after a win in each.
 */

/** The state with `ships` won in. */
function wonIn(...ships: (typeof SHIP_KINDS)[number][]): State {
  let state = initialState;
  for (const ship of ships) state = reduce(state, { slice: 'hangar', type: 'won', ship });
  return state;
}

describe('the slot', () => {
  it('every ship opens on its own gun', () => {
    for (const ship of SHIP_KINDS) expect(initialHangar.gun[ship], ship).toBe(ship);
  });

  it('THE ASK: the estate’s lightning on the fighter, once both are won — and not before', () => {
    const fit = { slice: 'hangar', type: 'gun', ship: 'fighter', from: 'estate' } as const;
    expect(reduce(initialState, fit).hangar.gun.fighter, 'fitted with nothing won').toBe('fighter');
    expect(reduce(wonIn('estate'), fit).hangar.gun.fighter, 'fitted onto a ship never won in').toBe('fighter');
    expect(reduce(wonIn('fighter'), fit).hangar.gun.fighter, 'fitted from a ship never won in').toBe('fighter');
    expect(reduce(wonIn('fighter', 'estate'), fit).hangar.gun.fighter).toBe('estate');
  });

  it('is the dash’s rule, word for word', () => {
    const state = wonIn('fighter', 'caddie').hangar;
    for (const ship of SHIP_KINDS) for (const from of SHIP_KINDS) expect(gunOpen(state, ship, from), `${ship} ← ${from}`).toBe(from === ship || (state.won[ship] && state.won[from]));
    expect(gunWhy('estate', false, false)).toContain('Gilded Estate');
    expect(gunWhy('estate', true, true)).toBe(null);
  });

  it('offers every ship’s gun by its name, in the ship table’s order, and says whose it is', () => {
    const band = SCREENS.hangar.choices.find((c) => c.name === 'gun')!;
    expect(band.options.map((o) => o.label)).toEqual(SHIP_KINDS.map((ship) => WEAPONS[SHIPS[ship].weapon].label));
    expect(band.options[3]!.hint).toContain('Gilded Estate');
  });
});

describe('the run', () => {
  it('flies the fitted gun, from the fitted ship’s hardpoint', () => {
    const begun = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: 'fighter', credits: 'none', gun: 'arc' });
    expect(begun.run.gun).toBe('arc');
    const row = fitted(SHIPS.fighter, begun.run.gun);
    expect(row.weapon).toBe('arc');
    expect(row.muzzle, 'the muzzle is still the fighter’s own').not.toEqual(SHIPS.fighter.muzzle);
  });

  it('flies the ship’s own when the shell names none', () => {
    for (const ship of SHIP_KINDS) {
      const begun = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship, credits: 'none' });
      expect(begun.run.gun, ship).toBe(SHIPS[ship].weapon);
    }
  });
});

describe('the key', () => {
  it('keeps the fitting, and refuses one its own wins do not open', () => {
    const fit = reduce(wonIn('fighter', 'estate'), { slice: 'hangar', type: 'gun', ship: 'fighter', from: 'estate' });
    expect(hangarFrom(serialiseHangar(fit.hangar), initialHangar)).toEqual(fit.hangar);
    const forged = JSON.stringify({ v: HANGAR_VERSION, won: { fighter: true }, gun: { fighter: 'estate' } });
    expect(hangarFrom(forged, initialHangar).gun.fighter, 'a gun from a ship never won in was fitted from the save').toBe('fighter');
  });

  it('reads a key written before the gun slot as every ship on its own', () => {
    const old = JSON.stringify({ v: HANGAR_VERSION, won: { fighter: true, estate: true } });
    expect(hangarFrom(old, initialHangar).gun).toEqual(initialHangar.gun);
  });
});
