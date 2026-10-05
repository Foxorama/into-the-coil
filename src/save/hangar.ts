/**
 * The hangar, kept between visits — `docs/decisions/0521-the-hangar-opens.md`.
 *
 * ⚠️ **THE THIRD `itc_*` KEY, ON THE SETTINGS' TERMS EXACTLY** — `src/save/settings.ts`: versioned from
 * 1, read per field, never an error on the title. `PRIVACY.md` lists the key, and
 * `tests/privacy.test.ts` holds that both ways.
 *
 * ⚠️ **A KEY OF ITS OWN AND NOT A FIELD OF `itc_settings`**, because what is in it is earned and not
 * chosen. A settings document the game cannot read goes back to the defaults and costs the player a
 * minute in a menu; a hangar the game cannot read costs them every run they have won, so the two are
 * not written together, and a defect in one cannot be paid for by the other.
 *
 * ⚠️ **PER FIELD, AND PER SHIP INSIDE A FIELD.** A ship the game has dropped is skipped, a ship it has
 * added reads as not won, and a plate the document's own wins do not open is the ship's own — so a
 * document edited by hand can fit nothing that has not been won, on the reducer's own rule
 * (`plateOpen`).
 */

import { SHIP_KINDS, type ShipKind } from '../content/ships.ts';
import { DANGLE_KINDS, type DangleKind } from '../content/dangles.ts';
import { type HangarState, plateOpen } from '../state/slices/hangar.ts';
import type { Store } from './store.ts';

/** Where the hangar lives. Named once; `PRIVACY.md` names it too, and a test holds the two together. */
export const HANGAR_KEY = 'itc_hangar';

/** The shape's version. A change an old document cannot be read as bumps it. */
export const HANGAR_VERSION = 1;

/** `raw` if it is a ship kind, or `null`. Narrows without a cast — 0016. */
function shipOf(raw: unknown): ShipKind | null {
  return SHIP_KINDS.find((kind) => kind === raw) ?? null;
}

/** A document's fields, by the names this version writes — a closed union, never `string` (0016). */
type HangarDoc = Partial<Record<'v' | keyof HangarState, unknown>>;

/** `raw` read as one value per ship, if it is an object; a ship it does not name is `undefined`. */
function perShipOf(raw: unknown): Partial<Record<ShipKind, unknown>> | null {
  return typeof raw === 'object' && raw !== null ? (raw as Partial<Record<ShipKind, unknown>>) : null;
}

/** `base` with whatever `text` holds that this version can trust laid over it. Never throws. */
export function hangarFrom(text: string | null, base: HangarState): HangarState {
  if (text === null) return base;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return base;
  }
  if (typeof data !== 'object' || data === null) return base;
  const doc = data as HangarDoc;
  if (doc.v !== HANGAR_VERSION) return base;
  const wonDoc = perShipOf(doc.won);
  const plateDoc = perShipOf(doc.plate);
  const won = { ...base.won };
  // ⚠️ Only ever `true` is read: a win is gained and never taken back, on the slice's own terms.
  for (const kind of SHIP_KINDS) if (wonDoc?.[kind] === true) won[kind] = true;
  const plate = { ...base.plate };
  const opened: HangarState = { ...base, won };
  for (const kind of SHIP_KINDS) {
    const fitted = shipOf(plateDoc?.[kind]);
    if (fitted !== null && plateOpen(opened, kind, fitted)) plate[kind] = fitted;
  }
  /*
    0522: the balance — a new field on version 1, so a document written before it reads as none, on
    the settings' per-field terms. A whole number at least nought, or the base's.
  */
  const shards = Number.isSafeInteger(doc.shards) && (doc.shards as number) >= 0 ? (doc.shards as number) : base.shards;
  /*
    0523: what is owned, and what hangs where — new fields on version 1, on the same terms. Only `true`
    is read of what is owned, as of a win; a dangle hung that the document's own list does not own reads
    as the ship's own, so an edited document buys nothing. `null` is read as nothing hung.
  */
  const ownedDoc = typeof doc.owned === 'object' && doc.owned !== null ? (doc.owned as Partial<Record<DangleKind, unknown>>) : null;
  const owned = { ...base.owned };
  for (const kind of DANGLE_KINDS) if (ownedDoc?.[kind] === true) owned[kind] = true;
  const hungDoc = perShipOf(doc.hung);
  const hung = { ...base.hung };
  for (const kind of SHIP_KINDS) {
    const raw = hungDoc?.[kind];
    if (raw === null) hung[kind] = null;
    const dangle = DANGLE_KINDS.find((d) => d === raw);
    if (dangle !== undefined && owned[dangle]) hung[kind] = dangle;
  }
  return { won, plate, shards, owned, hung };
}

/** The hangar as it is written. */
export function serialiseHangar(hangar: HangarState): string {
  const { won, plate, shards, owned, hung } = hangar;
  return JSON.stringify({ v: HANGAR_VERSION, won, plate, shards, owned, hung });
}

/** The hangar in `store` laid over `base`, or `base`. Never throws. */
export function readHangar(store: Store | null, base: HangarState): HangarState {
  if (store === null) return base;
  try {
    return hangarFrom(store.getItem(HANGAR_KEY), base);
  } catch {
    return base;
  }
}

/**
 * `hangar` written to `store`. A store that refuses the write (full, blocked) keeps what it had; the
 * win still holds for the visit, and nothing else is owed.
 */
export function writeHangar(store: Store | null, hangar: HangarState): void {
  if (store === null) return;
  try {
    store.setItem(HANGAR_KEY, serialiseHangar(hangar));
  } catch {
    // Kept for the visit and not beyond it.
  }
}
