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

import { MISSILES, MISSILE_KINDS, type MissileKind } from './missiles.ts';
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

export const TUBE_WARES: Record<TubeWareKind, TubeWareRow> = {
  straightTube: { name: 'Missile Tube', hint: 'A tube that fires straight, on any ship', price: TUBE_PRICE, tube: 'straight', needs: null },
  secondStraightTube: { name: 'Second Missile Tube', hint: 'Two that fire straight', price: TUBE_PRICE, tube: 'straight', needs: 'straightTube' },
  homingTube: { name: 'Seeker Tube', hint: 'A tube that hunts, on any ship', price: TUBE_PRICE, tube: 'homing', needs: null },
  secondHomingTube: { name: 'Second Seeker Tube', hint: 'Two that hunt', price: TUBE_PRICE, tube: 'homing', needs: 'homingTube' },
};

/**
 * Every rack a ship may carry into a run, in the band's order — none, one, then two. Closed, and written
 * out: *"1 homing, 1 regular, 2 homing, 2 regular etc"* is six racks, and one of each is the *etc*.
 */
export const RACK_KINDS = ['bare', 'straight', 'homing', 'straightPair', 'mixed', 'homingPair'] as const;
export type RackKind = (typeof RACK_KINDS)[number];

export interface RackRow {
  /** What the band calls it. */
  label: string;
  /** One line about it. */
  hint: string;
  /** The tubes it carries, top tube first — what `begin` opens the run on. */
  tubes: readonly MissileKind[];
}

export const RACKS: Record<RackKind, RackRow> = {
  bare: { label: 'None', hint: 'Find your tubes in the field', tubes: [] },
  straight: { label: MISSILES.straight.label, hint: 'One tube that fires straight', tubes: ['straight'] },
  homing: { label: MISSILES.homing.label, hint: 'One tube that hunts', tubes: ['homing'] },
  straightPair: { label: '2 ' + MISSILES.straight.label, hint: 'Two that fire straight', tubes: ['straight', 'straight'] },
  mixed: { label: 'One of each', hint: 'One that fires straight and one that hunts', tubes: ['straight', 'homing'] },
  homingPair: { label: '2 ' + MISSILES.homing.label, hint: 'Two that hunt', tubes: ['homing', 'homing'] },
};

/**
 * The rack that carries `tubes` — the same number of each kind, in any order — or `null` for none: more
 * than two, or a shape the table does not have.
 */
export function rackCarrying(tubes: readonly MissileKind[]): RackKind | null {
  const count = (list: readonly MissileKind[], kind: MissileKind): number => list.filter((t) => t === kind).length;
  return (
    RACK_KINDS.find(
      (rack) => RACKS[rack].tubes.length === tubes.length && MISSILE_KINDS.every((kind) => count(RACKS[rack].tubes, kind) === count(tubes, kind)),
    ) ?? null
  );
}

/** How many tubes of `kind` a rack carries. */
export function tubesOf(rack: RackKind, kind: MissileKind): number {
  let count = 0;
  for (const tube of RACKS[rack].tubes) if (tube === kind) count++;
  return count;
}
