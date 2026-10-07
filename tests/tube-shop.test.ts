import { describe, expect, it } from 'vitest';
import { OWNABLES, SHELF_KINDS, SHELVES, WARES } from '../src/content/wares.ts';
import { RACKS, RACK_KINDS, TUBE_WARES, TUBE_WARE_KINDS, rackCarrying, type RackKind } from '../src/content/racks.ts';
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
      expect(OWNABLES[ware].price, `${ware} is not *"500 each"*`).toBe(500);
      expect(WARES, `${ware} is not for sale`).toContain(ware);
      expect(initialHangar.owned[ware], `${ware} was owned before it was bought`).toBe(false);
    }
    const kinds = TUBE_WARE_KINDS.map((ware) => TUBE_WARES[ware].tube);
    expect(kinds.filter((k) => k === 'straight'), '*"1-2 of both"* is two of each').toHaveLength(2);
    expect(kinds.filter((k) => k === 'homing'), '*"1-2 of both"* is two of each').toHaveLength(2);
  });

  it('sells the second of a kind only once the first is owned, and says so', () => {
    const rich = holding(10_000);
    expect(needsFirst(rich.hangar, 'secondHomingTube')).toBe('homingTube');
    expect(canBuy(rich.hangar, 'secondHomingTube'), 'the second tube was sold before the first').toBe(false);
    expect(reduce(rich, { slice: 'hangar', type: 'bought', ware: 'secondHomingTube' }), 'the second tube was bought first').toBe(rich);
    expect(wareWhy('secondHomingTube', false, 10_000, 'homingTube')).toBe('Buy the ' + OWNABLES.homingTube.name + ' first');
    const first = reduce(rich, { slice: 'hangar', type: 'bought', ware: 'homingTube' });
    expect(first.hangar.shards).toBe(9_500);
    expect(canBuy(first.hangar, 'secondHomingTube'), 'the second tube was refused with the first owned').toBe(true);
    // And the other kind's second is still behind its own first.
    expect(canBuy(first.hangar, 'secondStraightTube')).toBe(false);
  });
});

describe('the rack', () => {
  it('every rack *"1 homing, 1 regular, 2 homing, 2 regular etc"* — none, one of each, two of each, and one and one', () => {
    const shapes = RACK_KINDS.map((rack) => [...RACKS[rack].tubes].sort().join('+'));
    expect(shapes.sort()).toEqual(['', 'homing', 'homing+homing', 'homing+straight', 'straight', 'straight+straight'].sort());
    for (const rack of RACK_KINDS) expect(rackCarrying(RACKS[rack].tubes), `${rack} is not the rack of its own shape`).toBe(rack);
    expect(rackCarrying(['homing', 'straight']), 'a rack is found by its shape, in either order').toBe('mixed');
  });

  it('is open only when the tubes owned are enough of each kind for it, and none always', () => {
    const open = (state: State): RackKind[] => RACK_KINDS.filter((rack) => rackOpen(state.hangar, rack));
    expect(open(holding(0)), 'a rack was open with no tube owned').toEqual(['bare']);
    expect(open(holding(0, 'straightTube'))).toEqual(['bare', 'straight']);
    expect(open(holding(0, 'straightTube', 'homingTube'))).toEqual(['bare', 'straight', 'homing', 'mixed']);
    expect(open(holding(0, 'straightTube', 'secondStraightTube', 'homingTube', 'secondHomingTube'))).toEqual([...RACK_KINDS]);
  });

  it('fits on any ship, won in or not, and refuses one the tubes owned do not cover', () => {
    const owned = holding(0, 'homingTube', 'secondHomingTube');
    for (const ship of SHIP_KINDS) {
      expect(reduce(owned, { slice: 'hangar', type: 'rack', ship, rack: 'homingPair' }).hangar.rack[ship], ship).toBe('homingPair');
    }
    expect(reduce(owned, { slice: 'hangar', type: 'rack', ship: 'fighter', rack: 'mixed' }), 'a straight tube never bought was fitted').toBe(owned);
  });

  it('is a band on Paint & Parts beside the wheels and the flame, in the table’s order, and says where tubes are sold', () => {
    const band = SCREENS.parts.choices.find((c) => c.name === 'rack');
    expect(band?.options.map((o) => o.label)).toEqual(RACK_KINDS.map((rack) => RACKS[rack].label));
    expect(SCREENS.parts.stand?.groups.find((g) => g.bands.includes('rim'))?.bands, 'the tubes are not among the parts').toContain('rack');
    expect(rackWhy(false)).toContain('Cosmo');
    expect(rackWhy(true)).toBe(null);
    expect(optionWhy('rack', 'fighter', 1, initialHangar.won)).toContain('Cosmo');
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
