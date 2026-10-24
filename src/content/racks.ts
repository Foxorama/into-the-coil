/**
 * The tubes Cosmo's sells, and the racks a ship may carry into a run —
 * `docs/decisions/0578-the-tubes-are-sold.md`, item 3b of
 * [`the-arms-planned`](../../reports/the-arms-planned-2026-10-07.md).
 *
 * Asked for: *"let's add the missile tubes are puchasable items from Cosmo's — you can buy 1-2 of both
 * homing and regular missiles and equip them how you want on a ship -> 1 homing, 1 regular, 2 homing,
 * 2 regular etc."* Priced when asked: *"500 each."*
 *
 * ⚠️ **TWO TABLES, BECAUSE TWO THINGS ARE OWNED AND FITTED.** A tube is owned — four wares, the first and
 * second of each kind — and a rack is fitted: what a ship carries in, nought to two tubes of either kind.
 * A rack is open when the wares own enough of each kind for it (`rackOpen` in `src/state/slices/hangar.ts`),
 * and a bought tube fits on any ship, as everything Cosmo's sells does (0523).
 *
 * ⚠️ **THE RUN'S TUBES, NOT A LOOK.** Everything else on Cosmo's shelves is a cosmetic; these are the one
 * ware the sim reads, through the run's `tubes` (0577) — handed to `begin` by the shell from the rack the
 * hangar fitted, and nothing in the frame knows where they came from.
 */

import { MISSILE_KINDS, type MissileKind } from './missiles.ts';
import { priced } from './prices.ts';

/** Every tube ware. Closed: the first and second of each kind, so *"1-2 of both"* is four things to own. */
export const TUBE_WARE_KINDS = ['straightTube', 'secondStraightTube', 'homingTube', 'secondHomingTube'] as const;
export type TubeWareKind = (typeof TUBE_WARE_KINDS)[number];

export interface TubeWareRow {
  /** What the shelf calls it. */
  name: string;
  /** One line about it. */
  hint: string;
  /** What it costs at Cosmo's — *"500 each"*. */
  price: number;
  /** The kind of tube it is. */
  tube: MissileKind;
  /** The ware that must be owned before this one is sold — the first of its kind — or `null`. */
  needs: TubeWareKind | null;
}

/** What a tube costs at Cosmo's — the player's number, on every row. */
const TUBE_PRICE = priced(500);

/*
  ⚠️ **0663: NO SECOND TUBE ON THE SHELF.** *"Missile tubes should be individual … not have a '2nd tube'. You
  can buy up to two of each tube."* The second of a kind is still a ware of its own underneath — the save owns
  each by name — but it is called what the first is, and says it is the second of two.
*/
export const TUBE_WARES: Record<TubeWareKind, TubeWareRow> = {
  straightTube: { name: 'Missile Tube', hint: 'A tube that fires straight, on any ship — carry up to two', price: TUBE_PRICE, tube: 'straight', needs: null },
  secondStraightTube: { name: 'Missile Tube', hint: 'Your second — one for each side', price: TUBE_PRICE, tube: 'straight', needs: 'straightTube' },
  homingTube: { name: 'Seeker Tube', hint: 'A tube that hunts, on any ship — carry up to two', price: TUBE_PRICE, tube: 'homing', needs: null },
  secondHomingTube: { name: 'Seeker Tube', hint: 'Your second — one for each side', price: TUBE_PRICE, tube: 'homing', needs: 'homingTube' },
};

/**
 * What a ship's left or right tube slot may hold — 0663: nothing, or a tube of a kind. Closed, in the band's
 * order: none first, then `MISSILE_KINDS`'.
 */
export const TUBE_SLOT_OPTIONS: readonly (MissileKind | null)[] = [null, ...MISSILE_KINDS];

/**
 * Every rack a ship may carry into a run — 0663: one per pair of what the left slot and the right slot hold,
 * nine, where 0578 had six with no sides. Closed, and written out; the first six are 0578's names, so a save
 * that holds one still reads, and each of them keeps the side it was drawn on.
 */
export const RACK_KINDS = ['bare', 'straight', 'homing', 'straightPair', 'mixed', 'homingPair', 'straightRight', 'homingRight', 'mixedSwapped'] as const;
export type RackKind = (typeof RACK_KINDS)[number];

export interface RackRow {
  /** What the left slot and the right slot hold — 0663, as the hangar's two bands show them. */
  slots: readonly [MissileKind | null, MissileKind | null];
  /**
   * The tubes it carries, left first — what `begin` opens the run on. A lone tube is one tube, whichever slot
   * it is in, and flies from the ship's one-tube place (`tubes[1]` on its row): 0663's decision says why.
   */
  tubes: readonly MissileKind[];
}

/** A rack from its two slots, its tubes read off them left first. */
const rack = (left: MissileKind | null, right: MissileKind | null): RackRow => ({
  slots: [left, right],
  tubes: [left, right].filter((tube): tube is MissileKind => tube !== null),
});

export const RACKS: Record<RackKind, RackRow> = {
  bare: rack(null, null),
  straight: rack('straight', null),
  homing: rack('homing', null),
  straightPair: rack('straight', 'straight'),
  mixed: rack('straight', 'homing'),
  homingPair: rack('homing', 'homing'),
  straightRight: rack(null, 'straight'),
  homingRight: rack(null, 'homing'),
  mixedSwapped: rack('homing', 'straight'),
};

/** The rack whose slots hold `left` and `right` — 0663. Every pair is one, so this never fails. */
export function rackOf(left: MissileKind | null, right: MissileKind | null): RackKind {
  return RACK_KINDS.find((kind) => RACKS[kind].slots[0] === left && RACKS[kind].slots[1] === right) ?? 'bare';
}

/**
 * The rack that carries `tubes`, left first — 0663: the first in the left slot and the second in the right — or
 * `null` for more than two.
 */
export function rackCarrying(tubes: readonly MissileKind[]): RackKind | null {
  return tubes.length > 2 ? null : rackOf(tubes[0] ?? null, tubes[1] ?? null);
}

/**
 * `rack` with `tube` put in a slot — 0663, Cosmo's *Fit it now*: into the left slot if it is empty, else the
 * right, else in place of the right, so what is already fitted keeps its side.
 */
export function rackWith(rack: RackKind, tube: MissileKind): RackKind {
  const [left, right] = RACKS[rack].slots;
  return left === null ? rackOf(tube, right) : rackOf(left, tube);
}

/** How many tubes of `kind` a rack carries. */
export function tubesOf(rack: RackKind, kind: MissileKind): number {
  let count = 0;
  for (const tube of RACKS[rack].tubes) if (tube === kind) count++;
  return count;
}
