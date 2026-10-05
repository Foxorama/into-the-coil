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
import { DANGLE_KINDS } from '../content/dangles.ts';
import { RIM_KINDS } from '../content/rims.ts';
import { ART_KINDS } from '../content/art.ts';
import { FLAME_KINDS } from '../content/flames.ts';
import { OWNABLE_KINDS, type OwnableKind } from '../content/wares.ts';
import { type HangarState, artOpen, flameOpen, gunOpen, liveryOf, liveryOpen, plateOpen, rimOpen, specialOpen } from '../state/slices/hangar.ts';
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
  // 0527: every ownable kind, the rims with the dangles, read the same way.
  const ownedDoc = typeof doc.owned === 'object' && doc.owned !== null ? (doc.owned as Partial<Record<OwnableKind, unknown>>) : null;
  const owned = { ...base.owned };
  for (const kind of OWNABLE_KINDS) if (ownedDoc?.[kind] === true) owned[kind] = true;
  const hungDoc = perShipOf(doc.hung);
  const hung = { ...base.hung };
  for (const kind of SHIP_KINDS) {
    const raw = hungDoc?.[kind];
    if (raw === null) hung[kind] = null;
    const dangle = DANGLE_KINDS.find((d) => d === raw);
    if (dangle !== undefined && owned[dangle]) hung[kind] = dangle;
  }
  // 0524: whose special each ship opens with, on the dash's terms — a fitting its own wins do not open is the ship's own.
  const specialDoc = perShipOf(doc.special);
  const special = { ...base.special };
  for (const kind of SHIP_KINDS) {
    const from = shipOf(specialDoc?.[kind]);
    if (from !== null && specialOpen(opened, kind, from)) special[kind] = from;
  }
  // 0526: whose gun each ship flies, on the same terms.
  const gunDoc = perShipOf(doc.gun);
  const gun = { ...base.gun };
  for (const kind of SHIP_KINDS) {
    const from = shipOf(gunDoc?.[kind]);
    if (from !== null && gunOpen(opened, kind, from)) gun[kind] = from;
  }
  // 0527: each car's rim, refused unless its wins or what it owns open it — the ship's own otherwise.
  const rimDoc = perShipOf(doc.rim);
  const rim = { ...base.rim };
  const owning: HangarState = { ...opened, owned };
  for (const kind of SHIP_KINDS) {
    const raw = RIM_KINDS.find((r) => r === rimDoc?.[kind]);
    if (raw !== undefined && rimOpen(owning, kind, raw)) rim[kind] = raw;
  }
  // 0528: each ship's look, refused unless it is its own and open to it.
  const artDoc = perShipOf(doc.art);
  const art = { ...base.art };
  for (const kind of SHIP_KINDS) {
    const raw = ART_KINDS.find((a) => a === artDoc?.[kind]);
    if (raw !== undefined && artOpen(opened, kind, raw)) art[kind] = raw;
  }
  // 0529: each ship's paint — a hue and a tone the lists can paint, on a ship won in; the factory's otherwise.
  const liveryDoc = perShipOf(doc.livery);
  const livery = { ...base.livery };
  for (const kind of SHIP_KINDS) {
    const raw = liveryDoc?.[kind];
    const read = typeof raw === 'object' && raw !== null ? liveryOf((raw as { hue?: unknown }).hue, (raw as { tone?: unknown }).tone) : null;
    if (read !== null && liveryOpen(opened, kind)) livery[kind] = read;
  }
  // 0530: each ship's flame — the standard, or one its document's own list owns.
  const flameDoc = perShipOf(doc.flame);
  const flame = { ...base.flame };
  const holding: HangarState = { ...opened, owned };
  for (const kind of SHIP_KINDS) {
    const raw = FLAME_KINDS.find((f) => f === flameDoc?.[kind]);
    if (raw !== undefined && flameOpen(holding, raw)) flame[kind] = raw;
  }
  return { won, plate, shards, owned, hung, special, gun, rim, art, livery, flame };
}

/** The hangar as it is written. */
export function serialiseHangar(hangar: HangarState): string {
  const { won, plate, shards, owned, hung, special, gun, rim, art, livery, flame } = hangar;
  return JSON.stringify({ v: HANGAR_VERSION, won, plate, shards, owned, hung, special, gun, rim, art, livery, flame });
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
