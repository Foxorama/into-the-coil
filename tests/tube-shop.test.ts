import { describe, expect, it } from 'vitest';
import { priced } from '../src/content/prices.ts';
import { OWNABLES, SHELF_KINDS, SHELVES, WARES } from '../src/content/wares.ts';
import { RACKS, RACK_KINDS, TUBE_SLOT_OPTIONS, TUBE_WARES, TUBE_WARE_KINDS, rackCarrying, rackOf, rackWith, type RackKind } from '../src/content/racks.ts';
import { MISSILES, MISSILE_KINDS } from '../src/content/missiles.ts';
import { SHIP_KINDS } from '../src/content/ships.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { canBuy, initialHangar, needsFirst, rackOpen } from '../src/state/slices/hangar.ts';
import { SCREENS, optionWhy, rackWhy, wareWhy } from '../src/state/screens.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { DEFAULT_DIFFICULTY } from '../src/state/slices/run.ts';

/**
 * THE TUBES ARE SOLD — `docs/decisions/0578-the-tubes-are-sold.md`.
 *
 * *"Let's add the missile tubes are puchasable items from Cosmo's — you can buy 1-2 of both homing and
 * regular missiles and equip them how you want on a ship -> 1 homing, 1 regular, 2 homing, 2 regular
 * etc."* Priced: *"500 each."* What is held is the trade — four tubes at the asked price, the second of a
 * kind after the first — and the fitting: a rack only the tubes owned are enough for, on any ship, kept
 * by the save and refused from a forged one, and handed to the run.
 */

/** The state with `shards` held and `wares` owned. */
const holding = (shards: number, ...wares: (typeof TUBE_WARE_KINDS)[number][]): State => {
  const owned = { ...initialState.hangar.owned };
  for (const ware of wares) owned[ware] = true;
  return { ...initialState, hangar: { ...initialState.hangar, shards, owned } };
};

describe('the shelf', () => {
  it('THE ASK: a first and second of each kind of tube, 500 shards each, on a shelf of their own at the end of the aisle', () => {
    expect(SHELF_KINDS.at(-1), 'the tubes are not the last shelf, so a shelf before them moved').toBe('tubes');
    expect(SHELVES.tubes.wares).toEqual([...TUBE_WARE_KINDS]);
    for (const ware of TUBE_WARE_KINDS) {
      expect(OWNABLES[ware].price, `${ware} is not *"500 each"*`).toBe(priced(500));
      expect(WARES, `${ware} is not for sale`).toContain(ware);
      expect(initialHangar.owned[ware], `${ware} was owned before it was bought`).toBe(false);
    }
    const kinds = TUBE_WARE_KINDS.map((ware) => TUBE_WARES[ware].tube);
    expect(kinds.filter((k) => k === 'straight'), '*"1-2 of both"* is two of each').toHaveLength(2);
    expect(kinds.filter((k) => k === 'homing'), '*"1-2 of both"* is two of each').toHaveLength(2);
  });

  // 0663: *"not have a '2nd tube'. You can buy up to two of each tube."*
  it('0663 — sells no *second* tube: the second of a kind is called what the first is', () => {
    expect(TUBE_WARES.secondStraightTube.name).toBe(TUBE_WARES.straightTube.name);
    expect(TUBE_WARES.secondHomingTube.name).toBe(TUBE_WARES.homingTube.name);
    for (const ware of TUBE_WARE_KINDS) expect(TUBE_WARES[ware].name, `${ware} is still sold as a second`).not.toMatch(/second|2nd/i);
  });

  it('sells the second of a kind only once the first is owned, and says so', () => {
    const rich = holding(10_000);
    expect(needsFirst(rich.hangar, 'secondHomingTube')).toBe('homingTube');
    expect(canBuy(rich.hangar, 'secondHomingTube'), 'the second tube was sold before the first').toBe(false);
    expect(reduce(rich, { slice: 'hangar', type: 'bought', ware: 'secondHomingTube' }), 'the second tube was bought first').toBe(rich);
    // 0663: the second is called what the first is, so it says it is the second rather than naming itself.
    expect(wareWhy('secondHomingTube', false, 10_000, 'homingTube')).toBe('Your second — buy the first one before it');
    const first = reduce(rich, { slice: 'hangar', type: 'bought', ware: 'homingTube' });
    expect(first.hangar.shards).toBe(10_000 - priced(500));
    expect(canBuy(first.hangar, 'secondHomingTube'), 'the second tube was refused with the first owned').toBe(true);
    // And the other kind's second is still behind its own first.
    expect(canBuy(first.hangar, 'secondStraightTube')).toBe(false);
  });
});

describe('the rack', () => {
  /*
    0663: *"missile tubes should be individual and have a left/right slot … equip them however you like."* A rack
    is what the two slots hold: every pair of none, a straight tube and a seeker, once each — nine, where 0578's
    six were shapes with no sides.
  */
  it('0663 — THE ASK: one rack for every pair the left slot and the right slot may hold, and its tubes are those, left first', () => {
    const pairs = RACK_KINDS.map((rack) => RACKS[rack].slots.map((tube) => tube ?? '-').join('|'));
    const every = TUBE_SLOT_OPTIONS.flatMap((left) => TUBE_SLOT_OPTIONS.map((right) => `${left ?? '-'}|${right ?? '-'}`));
    expect(pairs.slice().sort(), 'a pair of slots has no rack, or two').toEqual(every.slice().sort());
    for (const rack of RACK_KINDS) {
      const [left, right] = RACKS[rack].slots;
      expect(rackOf(left, right), `${rack} is not the rack of its own slots`).toBe(rack);
      expect(RACKS[rack].tubes, `${rack} carries other than its slots`).toEqual([left, right].filter((t) => t !== null));
    }
    expect(rackOf('homing', 'straight'), 'a seeker on the left and a straight tube on the right is one of each the other way').toBe('mixedSwapped');
    expect(rackCarrying(['homing', 'straight']), 'a run’s tubes are read left first').toBe('mixedSwapped');
  });

  it('0663: a tube fitted from Cosmo’s goes into the empty slot, and what is fitted keeps its side', () => {
    expect(rackWith('bare', 'homing')).toBe('homing');
    expect(rackWith('straightRight', 'homing'), 'the straight tube on the right was moved').toBe('mixedSwapped');
    expect(rackWith('straight', 'homing'), 'the straight tube on the left was moved').toBe('mixed');
    expect(rackWith('straightPair', 'homing'), 'a full rack keeps its left tube').toBe('mixed');
  });

  it('is open only when the tubes owned are enough of each kind for it, and none always', () => {
    const open = (state: State): RackKind[] => RACK_KINDS.filter((rack) => rackOpen(state.hangar, rack));
    expect(open(holding(0)), 'a rack was open with no tube owned').toEqual(['bare']);
    expect(open(holding(0, 'straightTube'))).toEqual(['bare', 'straight', 'straightRight']);
    expect(open(holding(0, 'straightTube', 'homingTube'))).toEqual(['bare', 'straight', 'homing', 'mixed', 'straightRight', 'homingRight', 'mixedSwapped']);
    expect(open(holding(0, 'straightTube', 'secondStraightTube', 'homingTube', 'secondHomingTube'))).toEqual([...RACK_KINDS]);
  });

  it('fits on any ship, won in or not, and refuses one the tubes owned do not cover', () => {
    const owned = holding(0, 'homingTube', 'secondHomingTube');
    for (const ship of SHIP_KINDS) {
      expect(reduce(owned, { slice: 'hangar', type: 'rack', ship, rack: 'homingPair' }).hangar.rack[ship], ship).toBe('homingPair');
    }
    expect(reduce(owned, { slice: 'hangar', type: 'rack', ship: 'fighter', rack: 'mixed' }), 'a straight tube never bought was fitted').toBe(owned);
  });

  // 0579: on Hangin' Out under *Loadout*, where 0578 had it on Paint & Parts for want of the height.
  // 0663: two bands, the left slot and the right, each none and then every kind of tube.
  it('0663 — is a left slot and a right slot on Hangin’ Out under Loadout beside the gun and the special, and says where tubes are sold', () => {
    for (const name of ['tubeLeft', 'tubeRight'] as const) {
      const band = SCREENS.hangar.choices.find((c) => c.name === name);
      expect(band?.options.map((o) => o.label), `${name} is not none and then each tube`).toEqual(['None', ...MISSILE_KINDS.map((kind) => MISSILES[kind].label)]);
      expect(SCREENS.hangar.stand?.groups.find((g) => g.bands.includes('gun'))?.bands, `${name} is not in the loadout`).toContain(name);
      expect(SCREENS.parts.choices.some((c) => c.name === name), `${name} is on Paint & Parts too`).toBe(false);
      expect(optionWhy(name, 'fighter', 1, initialHangar.won)).toContain('Cosmo');
    }
    expect(SCREENS.hangar.choices.some((c) => c.label.includes('One of each') || c.options.some((o) => o.label === 'One of each')), 'a band still offers *one of each*').toBe(false);
    expect(wareWhy('homingTube', true, 0), 'Cosmo’s says to fit a tube somewhere else').toBe('Yours — fit it in the hangar');
    expect(rackWhy(false)).toContain('Cosmo');
    expect(rackWhy(true)).toBe(null);
  });
});

describe('the run', () => {
  it('opens on the rack it is handed, two at most', () => {
    for (const rack of RACK_KINDS) {
      const run = reduce(initialState, { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY, ship: 'fighter', credits: 'free', tubes: RACKS[rack].tubes }).run;
      expect(run.tubes, `a run begun on ${rack} carries something else`).toEqual(RACKS[rack].tubes);
    }
  });
});

describe('the key', () => {
  it('keeps the tubes owned and every ship’s rack', () => {
    let state = holding(1_000, 'straightTube', 'homingTube');
    state = reduce(state, { slice: 'hangar', type: 'rack', ship: 'caddie', rack: 'mixed' });
    state = reduce(state, { slice: 'hangar', type: 'rack', ship: 'estate', rack: 'homing' });
    // 0663: and the racks with sides, which a save before it never held.
    state = reduce(state, { slice: 'hangar', type: 'rack', ship: 'fighter', rack: 'mixedSwapped' });
    state = reduce(state, { slice: 'hangar', type: 'rack', ship: 'duck', rack: 'homingRight' });
    expect(state.hangar.rack.fighter, 'the swapped pair was not fitted, so this proves nothing').toBe('mixedSwapped');
    expect(hangarFrom(serialiseHangar(state.hangar), initialHangar)).toEqual(state.hangar);
  });

  it('a document fitting a rack its own list does not own enough tubes for reads as bare, and buys nothing', () => {
    const forged = JSON.stringify({ v: HANGAR_VERSION, owned: { straightTube: true, homingTube: 'yes' }, rack: { fighter: 'mixed', caddie: 'straight', estate: 'triple' } });
    const read = hangarFrom(forged, initialHangar);
    expect(read.owned.homingTube, 'a tube was owned from a forged document').toBe(false);
    expect(read.rack.fighter, 'a rack the owned tubes cannot fill was fitted from the save').toBe('bare');
    expect(read.rack.caddie, 'a rack the owned tubes fill was refused').toBe('straight');
    expect(read.rack.estate, 'a rack not in the table was fitted').toBe('bare');
  });

  it('a document from before the tubes reads every ship bare', () => {
    const before = JSON.stringify({ v: HANGAR_VERSION, shards: 40 });
    for (const ship of SHIP_KINDS) expect(hangarFrom(before, initialHangar).rack[ship], ship).toBe('bare');
  });
});
