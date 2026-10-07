/**
 * What can be owned, and what Cosmo's sells of it — `docs/decisions/0527-the-wheels-turn.md`.
 *
 * ⚠️ **ONE LIST OF EVERYTHING OWNABLE, SO A SAVE AND A SHELF READ ONE TABLE.** 0523's shelf was the
 * dangles with a price; the Mothership's spinners are a rim, and item 10's thrusters will be a flame, so
 * the shelf is every ownable row with a price, in this list's order — what hangs, then what turns. A
 * thing is owned by its kind, and every kind here is distinct, so `owned` is one record over them all.
 *
 * ⚠️ **AN EXPLICIT LIST OF TABLES (0016)**: a new ownable kind of thing is a line here, never found.
 */

import { DANGLES, DANGLE_KINDS, type DangleKind } from './dangles.ts';
import { RIMS, RIM_KINDS, type RimKind } from './rims.ts';
import { FLAMES, FLAME_KINDS, type FlameKind } from './flames.ts';
import { TUBE_WARES, TUBE_WARE_KINDS, type TubeWareKind } from './racks.ts';

/** Everything the hangar can own. Closed. 0578: and the tubes, the one ware the sim reads. */
export const OWNABLE_KINDS = [...DANGLE_KINDS, ...RIM_KINDS, ...FLAME_KINDS, ...TUBE_WARE_KINDS] as const;
export type OwnableKind = DangleKind | RimKind | FlameKind | TubeWareKind;

/** What the shop needs of a thing: its name, its line, and its price, or `null` for one never sold. */
export interface OwnableRow {
  readonly name: string;
  readonly hint: string;
  readonly price: number | null;
  /**
   * The ware that must be owned before this one is sold — 0578, where the second tube of a kind waits
   * for the first. Absent for every ware sold on its own, which is every one before the tubes.
   */
  readonly needs?: OwnableKind | null;
}

/** Each ownable kind's row, read off its own table. */
export const OWNABLES: Record<OwnableKind, OwnableRow> = { ...DANGLES, ...RIMS, ...FLAMES, ...TUBE_WARES };

/** What Cosmo's sells, in `OWNABLE_KINDS`'s order: everything with a price. */
export const WARES: readonly OwnableKind[] = OWNABLE_KINDS.filter((kind) => OWNABLES[kind].price !== null);

/**
 * Cosmo's shelves — 0542: one per ownable table, in this file's order — what hangs, what turns, what
 * burns — each holding that table's wares, the ones with a price.
 *
 * ⚠️ **BUILT TO GROW, ON THE PLAYER'S WORD**: *"there'll be more cosmetics added for lots of things so
 * it'll need space to grow."* A new kind of cosmetic — a horn, a decal, a trail — is a table, a line in
 * `OWNABLE_KINDS` above, and a row here: a shelf, never a layout change. Nothing about the shop is a count
 * of shelves or of wares; the plate shows as many shelves as it has the height for, and the aisle steps.
 */
// 0578: and the tubes, last, so every shelf before it keeps its place on the aisle.
export const SHELF_KINDS = ['hanging', 'wheels', 'flames', 'tubes'] as const;
export type ShelfKind = (typeof SHELF_KINDS)[number];

/** What a shelf is called on the plate and on the aisle, and its wares in its table's order. */
export interface ShelfRow {
  readonly label: string;
  readonly wares: readonly OwnableKind[];
}

/** Each shelf's row, its wares read off its own table — the priced rows of it. */
export const SHELVES: Record<ShelfKind, ShelfRow> = {
  hanging: { label: 'Hanging', wares: DANGLE_KINDS.filter((kind) => DANGLES[kind].price !== null) },
  wheels: { label: 'Wheels', wares: RIM_KINDS.filter((kind) => RIMS[kind].price !== null) },
  flames: { label: 'Flames', wares: FLAME_KINDS.filter((kind) => FLAMES[kind].price !== null) },
  tubes: { label: 'Tubes', wares: TUBE_WARE_KINDS },
};
