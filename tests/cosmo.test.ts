import { describe, expect, it } from 'vitest';
import { DANGLES, DANGLE_KINDS } from '../src/content/dangles.ts';
import { OWNABLES, SHELF_KINDS, SHELVES, WARES } from '../src/content/wares.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { canBuy, initialHangar } from '../src/state/slices/hangar.ts';
import { SCREENS, wareWhy } from '../src/state/screens.ts';
import { priced } from '../src/content/prices.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';

/**
 * COSMO OPENS — `docs/decisions/0523-cosmo-opens.md`.
 *
 * ⚠️ **What is held is the trade, because it is the one place shards leave.** A ware bought for the
 * wrong price, bought twice, bought on credit or hung without being bought would each be the shop
 * giving something away or taking something it should not — and a document edited by hand must buy
 * nothing.
 */

/** The state with `shards` held. */
const holding = (shards: number): State => ({ ...initialState, hangar: { ...initialState.hangar, shards } });

describe('the shelf', () => {
  it('THE ASK: a eucalyptus tree, the alien’s family in a frame and a golf ball, at 250 shards each, and 0585’s fifteen per cent on top', () => {
    // 0527: the shelf is every ownable thing with a price, the dangles first.
    const dangles = WARES.filter((kind) => DANGLE_KINDS.some((d) => d === kind));
    // 0589: and more after them, so the asked three are the first three.
    expect(dangles.slice(0, 3).map((kind) => OWNABLES[kind].name)).toEqual(['Eucalyptus tree', 'Family photo', 'Golf ball']);
    // *"let's set the cheaper stuff at 250 shards for a base level"*.
    for (const kind of dangles.slice(0, 3)) expect(OWNABLES[kind].price, kind).toBe(priced(250));
    expect(priced(250), '0585: *"increase the cost of everything by 15%"*').toBe(288);
  });

  it('the fuzzy dice are not for sale: every player has them, and the estate opens with them hung', () => {
    expect(DANGLES.dice.price).toBe(null);
    expect(initialHangar.owned.dice).toBe(true);
    expect(initialHangar.hung.estate).toBe('dice');
    for (const kind of SHIP_KINDS) expect(initialHangar.hung[kind], kind).toBe(SHIPS[kind].hangs);
    for (const kind of WARES) expect(initialHangar.owned[kind], `${kind} was owned before it was bought`).toBe(false);
  });

  /*
    ⚠️ **A SHELF A TABLE SINCE 0542, AND IT WAS ONE BAND OF EVERY WARE.** Every ware is on exactly one shelf,
    each shelf in its table's order, each a band of the shop's, and the aisle names them all — so a ware
    added to a table is on its shelf, and a table added is a shelf, with nothing typed here. The price on
    a ware's face is the shell's to write (`setLabels`), and `tests/cosmo.browser.test.ts` reads it there.
  */
  it('0542 — puts every ware on its own table’s shelf, in the table’s order, and every shelf on the shop', () => {
    const shelved = SHELF_KINDS.flatMap((kind) => SHELVES[kind].wares);
    expect(shelved, 'a ware is on two shelves, or a shelf holds what is not sold').toHaveLength(WARES.length);
    expect([...shelved].sort(), 'a ware for sale is on no shelf').toEqual([...WARES].sort());
    for (const kind of SHELF_KINDS) {
      const band = SCREENS.shop.choices.find((c) => c.name === kind);
      expect(band, `the ${kind} shelf is not on the shop`).toBeDefined();
      expect(band!.options.map((o) => o.label)).toEqual(SHELVES[kind].wares.map((ware) => OWNABLES[ware].name));
      expect(WARES.filter((ware) => SHELVES[kind].wares.includes(ware)), `the ${kind} shelf is not in its table's order`).toEqual(SHELVES[kind].wares);
    }
    const aisle = SCREENS.shop.choices.find((c) => c.name === 'aisle');
    expect(aisle?.options.map((o) => o.label), 'the aisle does not name every shelf, in order').toEqual(SHELF_KINDS.map((kind) => SHELVES[kind].label));
  });
});

describe('buying', () => {
  it('takes the price and gives the ware, once', () => {
    // Enough for two, so it is owning the ware that refuses the second — not the balance.
    const bought = reduce(holding(600), { slice: 'hangar', type: 'bought', ware: 'golfball' });
    expect(bought.hangar.shards).toBe(600 - priced(250));
    expect(bought.hangar.owned.golfball).toBe(true);
    const again = reduce(bought, { slice: 'hangar', type: 'bought', ware: 'golfball' });
    expect(again, 'a ware owned was bought again').toBe(bought);
  });

  it('refuses a ware the balance does not cover, and takes nothing', () => {
    const short = holding(priced(250) - 1);
    expect(canBuy(short.hangar, 'eucalyptus')).toBe(false);
    expect(reduce(short, { slice: 'hangar', type: 'bought', ware: 'eucalyptus' }), 'a ware was bought on credit').toBe(short);
    expect(canBuy(holding(priced(250)).hangar, 'eucalyptus'), 'the exact price did not buy it').toBe(true);
  });

  it('refuses what is not for sale', () => {
    const rich = holding(10_000);
    expect(reduce(rich, { slice: 'hangar', type: 'bought', ware: 'dice' })).toBe(rich);
  });

  it('the shelf says what stands between the player and the ware', () => {
    expect(wareWhy('golfball', true, 0)).toContain('hang it');
    expect(wareWhy('golfball', false, 157)).toBe('Need ' + String(priced(250) - 157) + ' more Star Shards');
    expect(wareWhy('golfball', false, priced(250))).toBe(null);
  });
});

describe('hanging', () => {
  it('anything owned hangs on any ship, won in or not, and nothing is an answer', () => {
    const owned = reduce(holding(priced(250)), { slice: 'hangar', type: 'bought', ware: 'family' });
    for (const ship of SHIP_KINDS) {
      expect(reduce(owned, { slice: 'hangar', type: 'hung', ship, dangle: 'family' }).hangar.hung[ship], ship).toBe('family');
      expect(reduce(owned, { slice: 'hangar', type: 'hung', ship, dangle: 'dice' }).hangar.hung[ship], ship).toBe('dice');
    }
    expect(reduce(initialState, { slice: 'hangar', type: 'hung', ship: 'estate', dangle: null }).hangar.hung.estate).toBe(null);
  });

  it('refuses what is not owned', () => {
    const tried = reduce(initialState, { slice: 'hangar', type: 'hung', ship: 'fighter', dangle: 'golfball' });
    expect(tried, 'a ware never bought was hung').toBe(initialState);
  });
});

describe('the key', () => {
  it('keeps what was bought and what hangs where', () => {
    let state = reduce(holding(600), { slice: 'hangar', type: 'bought', ware: 'eucalyptus' });
    state = reduce(state, { slice: 'hangar', type: 'hung', ship: 'caddie', dangle: 'eucalyptus' });
    state = reduce(state, { slice: 'hangar', type: 'hung', ship: 'estate', dangle: null });
    expect(hangarFrom(serialiseHangar(state.hangar), initialHangar)).toEqual(state.hangar);
  });

  it('a document hanging what its own list does not own reads as the ship’s own, and buys nothing', () => {
    const forged = JSON.stringify({ v: HANGAR_VERSION, owned: { golfball: false, family: 'yes' }, hung: { fighter: 'golfball', caddie: 'family' } });
    const read = hangarFrom(forged, initialHangar);
    expect(read.owned).toEqual(initialHangar.owned);
    expect(read.hung.fighter, 'a ware never bought was hung from the save').toBe(SHIPS.fighter.hangs);
    expect(read.hung.caddie).toBe(SHIPS.caddie.hangs);
  });

  it('reads a document written before the shop as the shop’s first visit', () => {
    const before = JSON.stringify({ v: HANGAR_VERSION, won: { estate: true }, shards: 300 });
    const read = hangarFrom(before, initialHangar);
    expect(read.owned).toEqual(initialHangar.owned);
    expect(read.hung).toEqual(initialHangar.hung);
    expect(read.shards).toBe(300);
    for (const kind of DANGLE_KINDS) expect(read.owned[kind], kind).toBe(DANGLES[kind].price === null);
  });
});
