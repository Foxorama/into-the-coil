import { describe, expect, it } from 'vitest';
import { ART, ART_KINDS } from '../src/content/art.ts';
import { SHIPS, SHIP_KINDS, ownFit, sameFit } from '../src/content/ships.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { artOpen, initialHangar } from '../src/state/slices/hangar.ts';
import { SCREENS, artOptions, artWhy } from '../src/state/screens.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';

/**
 * THE NOSES ARE PAINTED — `docs/decisions/0528-the-noses-are-painted.md`.
 *
 * ⚠️ **What is held is that every ship authors its own three and wears only those, the first always
 * and the rest with its win.** The drawings are held where every body is, in `tests/accents.test.ts`'s
 * `0528` case: every mark of every look on its hull and over the floor.
 */

/** The state with `ships` won in. */
function wonIn(...ships: (typeof SHIP_KINDS)[number][]): State {
  let state = initialState;
  for (const ship of ships) state = reduce(state, { slice: 'hangar', type: 'won', ship });
  return state;
}

describe('the looks', () => {
  it('every ship authors three of its own, its first the one it always wore, and every look is one ship’s', () => {
    expect(SHIPS.fighter.arts[0]).toBe('chevron');
    expect(SHIPS.caddie.arts[0]).toBe('glass');
    expect(SHIPS.firebird.arts[0]).toBe('phoenix');
    expect(SHIPS.estate.arts[0]).toBe('woody');
    const worn = SHIP_KINDS.flatMap((ship) => SHIPS[ship].arts.map((art) => [ship, art] as const));
    expect(worn.map(([, art]) => art).sort(), 'a look is on no ship, or on two').toEqual([...ART_KINDS].sort());
    for (const [ship, art] of worn) expect(ART[art].ship, art).toBe(ship);
  });

  it('a ship opens on its first, and the rest open with its own win', () => {
    for (const ship of SHIP_KINDS) {
      expect(initialHangar.art[ship], ship).toBe(SHIPS[ship].arts[0]);
      const [first, second, third] = SHIPS[ship].arts;
      expect(artOpen(initialState.hangar, ship, first), ship).toBe(true);
      expect(artOpen(initialState.hangar, ship, second), `${ship}'s ${second} before a win`).toBe(false);
      expect(artOpen(wonIn(ship).hangar, ship, third), `${ship}'s ${third} after a win`).toBe(true);
    }
    expect(artWhy('estate', false)).toContain('Gilded Estate');
    expect(artWhy('estate', true)).toBe(null);
  });

  it('no ship wears another’s, won in or not', () => {
    const all = wonIn(...SHIP_KINDS);
    for (const ship of SHIP_KINDS) {
      for (const art of ART_KINDS) if (ART[art].ship !== ship) expect(artOpen(all.hangar, ship, art), `${ship} ← ${art}`).toBe(false);
    }
    expect(reduce(all, { slice: 'hangar', type: 'art', ship: 'fighter', art: 'flames' }).hangar.art.fighter).toBe('chevron');
    expect(reduce(all, { slice: 'hangar', type: 'art', ship: 'firebird', art: 'flames' }).hangar.art.firebird).toBe('flames');
  });

  it('the band is three places, named for whichever ship is on the stand', () => {
    const band = SCREENS.parts.choices.find((c) => c.name === 'art')!;
    expect(band.options).toHaveLength(3);
    for (const ship of SHIP_KINDS) expect(artOptions(ship).map((o) => o.label), ship).toEqual(SHIPS[ship].arts.map((art) => ART[art].name));
  });

  it('the look is part of a ship’s fit, so a re-bake carries it', () => {
    expect(ownFit('caddie').art).toBe('glass');
    expect(sameFit(ownFit('caddie'), { ...ownFit('caddie'), art: 'pilot' })).toBe(false);
  });
});

describe('the key', () => {
  it('keeps each ship’s look, and refuses one its own win does not open or that is another ship’s', () => {
    const state = reduce(wonIn('caddie'), { slice: 'hangar', type: 'art', ship: 'caddie', art: 'pilot' });
    expect(hangarFrom(serialiseHangar(state.hangar), initialHangar)).toEqual(state.hangar);
    const forged = JSON.stringify({ v: HANGAR_VERSION, won: { fighter: true }, art: { caddie: 'pilot', fighter: 'flames', estate: 'crest' } });
    expect(hangarFrom(forged, initialHangar).art, 'a look never opened was fitted from the save').toEqual(initialHangar.art);
    const old = JSON.stringify({ v: HANGAR_VERSION, won: { estate: true } });
    expect(hangarFrom(old, initialHangar).art).toEqual(initialHangar.art);
  });
});
