import { describe, expect, it } from 'vitest';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import { SHIPS, SHIP_KINDS, type ShipKind } from '../src/content/ships.ts';
import type { CreditKind } from '../src/content/credits.ts';
import { DEFAULT_DIFFICULTY } from '../src/state/slices/run.ts';
import { initialState, reduce, type Action, type State } from '../src/state/root.ts';
import { initialHangar, plateOpen, type HangarState } from '../src/state/slices/hangar.ts';
import { SCREENS, plateWhy, type Screen } from '../src/state/screens.ts';
import { HANGAR_VERSION, hangarFrom, readHangar, serialiseHangar, writeHangar } from '../src/save/hangar.ts';
import type { Store } from '../src/save/store.ts';

/**
 * THE HANGAR OPENS — `docs/decisions/0521-the-hangar-opens.md`.
 *
 * ⚠️ **What is held is the unlock, because it is the one thing in the hangar a player can lose.** A
 * win is earned once, a run long, so the breaks that matter are a finished run that does not win its
 * ship, a run that did not finish winning one anyway, a dash fitted that was never won, and a visit
 * that forgets either. The plate itself is a class on the readout, and the browser test sees it worn.
 */

const begin = (ship: ShipKind, credits: CreditKind = 'none'): Action => ({
  slice: 'run',
  type: 'begin',
  difficulty: DEFAULT_DIFFICULTY,
  ship,
  credits,
});
const show = (screen: Screen): Action => ({ slice: 'screen', type: 'show', screen });

/** A run in `ship` flown to the end of its last level, and its break shown — which is the run finished. */
function finish(ship: ShipKind, credits: CreditKind = 'none', from: State = initialState): State {
  const begun = reduce(reduce(from, begin(ship, credits)), show('playing'));
  const last: State = { ...begun, run: { ...begun.run, level: LEVEL_KINDS.length } };
  return reduce(last, show('cleared'));
}

/** A hangar with `ships` won in. */
function wonIn(...ships: ShipKind[]): HangarState {
  let state = initialState;
  for (const ship of ships) state = reduce(state, { slice: 'hangar', type: 'won', ship });
  return state.hangar;
}

/** A map that stands in for the browser's storage. */
function memoryStore(): Store & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return { items, getItem: (k) => items.get(k) ?? null, setItem: (k, v) => void items.set(k, v) };
}

describe('a win', () => {
  it('a run finished wins its ship, at the finale', () => {
    const state = finish('firebird');
    expect(state.screen.current).toBe('outro');
    expect(state.hangar.won.firebird, 'the jellyfish beaten in the Firebird did not win it').toBe(true);
    for (const kind of SHIP_KINDS) if (kind !== 'firebird') expect(state.hangar.won[kind], `${kind} was won by a run it did not fly`).toBe(false);
  });

  it('counts on Freeplay as on one credit — answered: any win counts', () => {
    expect(finish('estate', 'free').hangar.won.estate).toBe(true);
  });

  it('a run that ran out wins nothing', () => {
    let state = reduce(reduce(initialState, begin('caddie')), show('playing'));
    for (let i = 0; i < 20 && state.run.lives > 0; i++) state = reduce(state, { slice: 'run', type: 'lifeLost' });
    expect(state.hangar).toBe(initialState.hangar);
  });

  it('a level cleared short of the last wins nothing', () => {
    const begun = reduce(reduce(initialState, begin('fighter')), show('playing'));
    expect(reduce(begun, show('cleared')).hangar.won.fighter).toBe(false);
  });

  it('is kept by a second win, which changes nothing', () => {
    const once = finish('fighter');
    const twice = finish('fighter', 'none', { ...once, screen: { ...once.screen, current: 'title' } });
    expect(twice.hangar).toBe(once.hangar);
  });
});

describe('the dash', () => {
  it('every ship opens on its own, and its own is always open', () => {
    for (const kind of SHIP_KINDS) {
      expect(initialHangar.plate[kind]).toBe(kind);
      expect(plateOpen(initialHangar, kind, kind)).toBe(true);
    }
  });

  it('another ship’s dash is shut until both ships have been won in — answered: only onto ships you’ve won in', () => {
    expect(plateOpen(initialHangar, 'fighter', 'estate')).toBe(false);
    expect(plateOpen(wonIn('estate'), 'fighter', 'estate'), 'a dash went onto a ship never won in').toBe(false);
    expect(plateOpen(wonIn('fighter'), 'fighter', 'estate'), 'a dash from a ship never won in was offered').toBe(false);
    expect(plateOpen(wonIn('fighter', 'estate'), 'fighter', 'estate')).toBe(true);
  });

  it('the reducer refuses a shut dash, whoever asks for it', () => {
    const shut = reduce(initialState, { slice: 'hangar', type: 'plate', ship: 'fighter', plate: 'estate' });
    expect(shut.hangar.plate.fighter).toBe('fighter');
    const open = reduce({ ...initialState, hangar: wonIn('fighter', 'estate') }, { slice: 'hangar', type: 'plate', ship: 'fighter', plate: 'estate' });
    expect(open.hangar.plate.fighter).toBe('estate');
  });

  it('the band says why a dash is shut, and says nothing once one is open', () => {
    expect(plateWhy('firebird', false, false)).toContain('Firebird');
    expect(plateWhy('firebird', true, false)).toContain('another ship');
    expect(plateWhy('firebird', true, true)).toBe(null);
  });

  it('offers every ship’s dash by its name, in the ship table’s order', () => {
    const band = SCREENS.hangar.choices.find((c) => c.name === 'plate')!;
    expect(band.options.map((o) => o.label)).toEqual(SHIP_KINDS.map((k) => SHIPS[k].hud.name));
  });
});

describe('the hangar is kept', () => {
  it('a win and a fitting survive the next visit', () => {
    const store = memoryStore();
    const fitted = reduce({ ...initialState, hangar: wonIn('caddie', 'firebird') }, { slice: 'hangar', type: 'plate', ship: 'caddie', plate: 'firebird' });
    writeHangar(store, fitted.hangar);
    expect(readHangar(store, initialHangar)).toEqual(fitted.hangar);
  });

  it('a document fitting a dash its own wins do not open reads as the ship’s own', () => {
    const forged = JSON.stringify({ v: HANGAR_VERSION, won: { fighter: true }, plate: { fighter: 'estate', caddie: 'fighter' } });
    const read = hangarFrom(forged, initialHangar);
    expect(read.won.fighter).toBe(true);
    expect(read.plate.fighter, 'a dash from a ship never won in was fitted from the save').toBe('fighter');
    expect(read.plate.caddie, 'a dash went onto a ship never won in from the save').toBe('caddie');
  });

  it('per field and per ship: a ship it does not name is not won, and a value it does not know is skipped', () => {
    const read = hangarFrom(JSON.stringify({ v: HANGAR_VERSION, won: { estate: true, starship: true, fighter: 'yes' } }), initialHangar);
    expect(read.won).toEqual({ ...initialHangar.won, estate: true });
    expect(read.plate).toEqual(initialHangar.plate);
  });

  it('nothing that cannot be read is an error, and nothing unread is a win', () => {
    for (const text of [null, '', 'not json', '[]', '7', JSON.stringify({ v: HANGAR_VERSION + 1, won: { fighter: true } })]) {
      expect(hangarFrom(text, initialHangar), String(text)).toEqual(initialHangar);
    }
    expect(readHangar(null, initialHangar)).toBe(initialHangar);
  });

  it('writes what it reads back', () => {
    const hangar = wonIn('estate');
    expect(hangarFrom(serialiseHangar(hangar), initialHangar)).toEqual(hangar);
  });
});
