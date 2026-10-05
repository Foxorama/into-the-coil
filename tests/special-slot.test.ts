import { describe, expect, it } from 'vitest';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { initialHangar, specialOpen } from '../src/state/slices/hangar.ts';
import { ownSpecial, startingArsenal } from '../src/state/slices/run.ts';
import { SCREENS, specialWhy } from '../src/state/screens.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';

/**
 * THE SPECIAL IS FITTED — `docs/decisions/0524-the-special-is-fitted.md`.
 *
 * ⚠️ **What is held is that a run opens on what the hangar fitted, and only on what has been won.**
 * Asked for: *"pair the shuriken special with the lightning gun once you've unlocked both"* — the
 * whirlpool on the estate, after a win in the Firebird and a win in the estate.
 */

/** The state with `ships` won in. */
function wonIn(...ships: (typeof SHIP_KINDS)[number][]): State {
  let state = initialState;
  for (const ship of ships) state = reduce(state, { slice: 'hangar', type: 'won', ship });
  return state;
}

describe('the slot', () => {
  it('every ship opens on its own gun’s special', () => {
    for (const ship of SHIP_KINDS) expect(initialHangar.special[ship], ship).toBe(ship);
  });

  it('THE ASK: the shuriken’s special on the lightning gun, once both are won — and not before', () => {
    // The shuriken is the estate's and the lightning gun the Thunderbolt's since 0545: the ask is the same pairing.
    expect(ownSpecial('estate')).toBe('whirlpool');
    expect(SHIPS.thunderbolt.weapon).toBe('arc');
    const fit = { slice: 'hangar', type: 'special', ship: 'thunderbolt', from: 'estate' } as const;
    expect(reduce(initialState, fit).hangar.special.thunderbolt, 'fitted with nothing won').toBe('thunderbolt');
    expect(reduce(wonIn('estate'), fit).hangar.special.thunderbolt, 'fitted onto a ship never won in').toBe('thunderbolt');
    expect(reduce(wonIn('thunderbolt'), fit).hangar.special.thunderbolt, 'fitted from a ship never won in').toBe('thunderbolt');
    expect(reduce(wonIn('estate', 'thunderbolt'), fit).hangar.special.thunderbolt).toBe('estate');
  });

  it('is the dash’s rule, word for word', () => {
    const state = wonIn('fighter', 'caddie').hangar;
    for (const ship of SHIP_KINDS) for (const from of SHIP_KINDS) expect(specialOpen(state, ship, from), `${ship} ← ${from}`).toBe(from === ship || (state.won[ship] && state.won[from]));
    expect(specialWhy('estate', false, false)).toContain('Gilded Estate');
    expect(specialWhy('estate', true, true)).toBe(null);
  });

  it('offers every ship’s special by its name, in the ship table’s order', () => {
    const band = SCREENS.hangar.choices.find((c) => c.name === 'special')!;
    expect(band.options.map((o) => o.label)).toEqual(SHIP_KINDS.map((ship) => SPECIALS[ownSpecial(ship)].label));
  });
});

describe('the run', () => {
  it('opens on two of the fitted special', () => {
    // A special that is not the estate's own (the whirlpool since 0545), or a run ignoring the fitting still passes.
    const begun = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: 'estate', credits: 'none', special: 'storm' });
    expect(begun.run.arsenal.gun).toEqual(['storm', 'storm']);
  });

  it('opens on the ship’s own when the shell names none', () => {
    const begun = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: 'estate', credits: 'none' });
    expect(begun.run.arsenal).toEqual(startingArsenal('estate', 'savior'));
    // The estate opens on the shuriken's whirlpools since 0545.
    expect(begun.run.arsenal.gun).toEqual(['whirlpool', 'whirlpool']);
  });

  it('a nova fitted to the fighter goes on the ward’s trigger, and Burn adds no void on top', () => {
    const arsenal = startingArsenal('fighter', 'burn', 'nova');
    expect(arsenal.ward).toEqual(['nova', 'nova']);
    expect(arsenal.gun).toEqual([]);
  });
});

describe('the key', () => {
  it('keeps the fitting, and refuses one its own wins do not open', () => {
    const fitted = reduce(wonIn('firebird', 'estate'), { slice: 'hangar', type: 'special', ship: 'estate', from: 'firebird' });
    expect(hangarFrom(serialiseHangar(fitted.hangar), initialHangar)).toEqual(fitted.hangar);
    const forged = JSON.stringify({ v: HANGAR_VERSION, won: { estate: true }, special: { estate: 'firebird' } });
    expect(hangarFrom(forged, initialHangar).special.estate, 'a special from a ship never won in was fitted from the save').toBe('estate');
  });
});
