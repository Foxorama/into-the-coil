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

/** Everything the hangar can own. Closed. */
export const OWNABLE_KINDS = [...DANGLE_KINDS, ...RIM_KINDS, ...FLAME_KINDS] as const;
export type OwnableKind = DangleKind | RimKind | FlameKind;

/** What the shop needs of a thing: its name, its line, and its price, or `null` for one never sold. */
export interface OwnableRow {
  readonly name: string;
  readonly hint: string;
  readonly price: number | null;
}

/** Each ownable kind's row, read off its own table. */
export const OWNABLES: Record<OwnableKind, OwnableRow> = { ...DANGLES, ...RIMS, ...FLAMES };

/** What Cosmo's sells, in `OWNABLE_KINDS`'s order: everything with a price. */
export const WARES: readonly OwnableKind[] = OWNABLE_KINDS.filter((kind) => OWNABLES[kind].price !== null);
