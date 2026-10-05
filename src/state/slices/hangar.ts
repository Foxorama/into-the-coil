/**
 * The hangar: which ships have been won in, and how each one is fitted —
 * `docs/decisions/0521-the-hangar-opens.md`, item 1 of
 * [`the-hangar-planned`](../../../reports/the-hangar-planned-2026-10-05.md).
 *
 * ⚠️ **A SLICE OF ITS OWN, ON THE SETTINGS' TERMS OF LIFETIME AND NOT THEIR TERMS OF MEANING.** It
 * outlives every run, as a setting does, so it is not on the run, where `begin` would reset it. But a
 * setting is chosen and a win is earned: the settings slice may be put back to its defaults by anything
 * that reads a bad document, and a win may only ever be gained. Two lifetimes that look alike and a
 * rule that does not.
 *
 * ⚠️ **IT DOES NOT IMPORT A SIBLING** — 0017. A run finishing is what wins a ship, and that is an
 * agreement in `src/state/root.ts`, where it is one visible line.
 *
 * ⚠️ **WHAT MAY BE FITTED IS DECIDED HERE, SO NOTHING CAN FIT WHAT IS LOCKED.** A ship's own slots open
 * with its own win, and what they offer is what has been won in — answered 2026-10-05: a gun goes *"only
 * onto ships you've won in"*, and the plate is the first slot built on that rule. The chrome greys
 * what is locked, but a band, a pad, a stale save and a test all reach this reducer, and it is the one
 * place that answers all of them.
 *
 * ⚠️ **NOT READ BY THE SIMULATION.** A plate is the readout's dress; nothing in `src/sim/` or the frame
 * can see this slice, which is 0024's *no comfort setting may touch the sim* held for a cosmetic.
 */

import { SHIPS, SHIP_KINDS, type ShipKind } from '../../content/ships.ts';
import type { DangleKind } from '../../content/dangles.ts';
import { RIMS, type RimKind } from '../../content/rims.ts';
import { ART, type ArtKind } from '../../content/art.ts';
import { HUES, TONES, type Livery } from '../../content/livery.ts';
import type { FlameKind } from '../../content/flames.ts';
import { OWNABLES, OWNABLE_KINDS, type OwnableKind } from '../../content/wares.ts';

export interface HangarState {
  /**
   * Whether the jellyfish has been beaten in each ship — on any tier and any credits, answered
   * 2026-10-05: *"any win counts"*. Only ever set; nothing in the game takes a win back.
   */
  won: Readonly<Record<ShipKind, boolean>>;
  /**
   * Whose dash each ship's readout wears — a ship kind, because a plate is the ship row's `hud`
   * (`src/content/ships.ts`), and every ship opens on its own.
   */
  plate: Readonly<Record<ShipKind, ShipKind>>;
  /**
   * The Star Shards the player holds — 0522. Paid at the end of every run for its best credit, and
   * spent in the shop the plan's next item opens. A whole number, never below nothing.
   */
  shards: number;
  /**
   * What the player has — 0523's dangles, and since 0527 every ownable kind (`src/content/wares.ts`).
   * The free ones from the start; a bought one from the moment it is paid for, and never taken back.
   */
  owned: Readonly<Record<OwnableKind, boolean>>;
  /**
   * What hangs from each ship's dash, or `null` for nothing — 0523. Each ship opens on its row's
   * `hangs`. Any dangle the player owns may hang on any ship: answered while it was planned, *a bought
   * thing fits any ship from the moment it is bought*; it is not one of a ship's own slots, which wait
   * for its win.
   */
  hung: Readonly<Record<ShipKind, DangleKind | null>>;
  /**
   * Whose special each ship opens a run with — 0524: a ship kind, because a special is the one that
   * ship's own gun brings, and every ship opens on its own. Answered while it was planned: *"pair the
   * shuriken special with the lightning gun once you've unlocked both"* — a ship's own slot, open with
   * its win, offering the specials of ships that have been won in, on the dash's exact rule.
   */
  special: Readonly<Record<ShipKind, ShipKind>>;
  /**
   * Whose gun each ship flies — 0526: a ship kind, because a gun is the one that ship carries (0441),
   * and every ship flies its own. *"Only onto ships you've won in"*, answered while it was planned — a
   * ship's own slot, open with its win, offering the guns of ships that have been won in, on the dash's
   * rule. 0525 drew every pairing and made the frame fly it.
   */
  gun: Readonly<Record<ShipKind, ShipKind>>;
  /**
   * What each car's wheels wear — 0527, or `null` for a ship with none. A car's own rim, the other car's
   * on the dash's rule, and a bought one on any car from the moment it is bought, as a dangle is.
   */
  rim: Readonly<Record<ShipKind, RimKind | null>>;
  /**
   * What each ship wears on its nose, its dome or its flank — 0528: one of its own three looks, the first
   * until it is won in and any of them after.
   */
  art: Readonly<Record<ShipKind, ArtKind>>;
  /**
   * Each ship's body colour — 0529: a hue and a tone, or `null` for the factory's paint. Open with the
   * ship's win, as its other looks are; any of the colours once it is.
   */
  livery: Readonly<Record<ShipKind, Livery | null>>;
  /**
   * What each ship's engines burn — 0530: the standard flame, or one bought at Cosmo's, on any ship from
   * the moment it is bought, as a dangle hangs on any dash.
   */
  flame: Readonly<Record<ShipKind, FlameKind>>;
}

/** ⚠️ **Every action names its slice**, per 0017. */
export type HangarAction =
  | { slice: 'hangar'; type: 'won'; ship: ShipKind }
  | { slice: 'hangar'; type: 'plate'; ship: ShipKind; plate: ShipKind }
  | { slice: 'hangar'; type: 'earned'; shards: number }
  | { slice: 'hangar'; type: 'bought'; ware: OwnableKind }
  | { slice: 'hangar'; type: 'hung'; ship: ShipKind; dangle: DangleKind | null }
  | { slice: 'hangar'; type: 'special'; ship: ShipKind; from: ShipKind }
  | { slice: 'hangar'; type: 'gun'; ship: ShipKind; from: ShipKind }
  | { slice: 'hangar'; type: 'rim'; ship: ShipKind; rim: RimKind }
  | { slice: 'hangar'; type: 'art'; ship: ShipKind; art: ArtKind }
  // 0529: the hue a ship's body is painted, `null` for the factory's; and its tone, on the hue it has.
  | { slice: 'hangar'; type: 'livery'; ship: ShipKind; hue: number | null }
  | { slice: 'hangar'; type: 'tone'; ship: ShipKind; tone: number }
  // 0530: what that ship's engines burn.
  | { slice: 'hangar'; type: 'flame'; ship: ShipKind; flame: FlameKind };

/** Each ship kind mapped to `of(kind)`. Built by walking `SHIP_KINDS`, so a fifth ship is answered. */
function perShip<T>(of: (kind: ShipKind) => T): Record<ShipKind, T> {
  const out: Partial<Record<ShipKind, T>> = {};
  for (const kind of SHIP_KINDS) out[kind] = of(kind);
  return out as Record<ShipKind, T>;
}

/** Nothing won, and every ship on its own dash: the hangar a first visit opens. */
export const initialHangar: HangarState = {
  won: perShip(() => false),
  plate: perShip((kind) => kind),
  shards: 0,
  owned: perOwnable((kind) => OWNABLES[kind].price === null),
  hung: perShip((kind) => SHIPS[kind].hangs),
  special: perShip((kind) => kind),
  gun: perShip((kind) => kind),
  rim: perShip((kind) => SHIPS[kind].wheels?.rim ?? null),
  art: perShip((kind) => SHIPS[kind].arts[0]),
  livery: perShip(() => null),
  flame: perShip(() => 'standard'),
};

/** Whether a ship may burn `flame` — 0530: the standard flame always, one bought on any ship. */
export function flameOpen(state: HangarState, flame: FlameKind): boolean {
  return state.owned[flame];
}

/**
 * Whether `ship` may be painted — 0529: once it has been won in, as its other looks open. The factory's
 * paint is always its own.
 */
export function liveryOpen(state: HangarState, ship: ShipKind): boolean {
  return state.won[ship];
}

/** A livery the lists can paint: a hue and a tone each a place in its list. */
export function liveryOf(hue: unknown, tone: unknown): Livery | null {
  const h = typeof hue === 'number' && Number.isInteger(hue) && hue >= 0 && hue < HUES.length ? hue : null;
  const t = typeof tone === 'number' && Number.isInteger(tone) && tone >= 0 && tone < TONES.length ? tone : null;
  return h === null || t === null ? null : { hue: h, tone: t };
}

/** Each ownable kind mapped to `of(kind)`, on `perShip`'s terms. */
function perOwnable<T>(of: (kind: OwnableKind) => T): Record<OwnableKind, T> {
  const out: Partial<Record<OwnableKind, T>> = {};
  for (const kind of OWNABLE_KINDS) out[kind] = of(kind);
  return out as Record<OwnableKind, T>;
}

/**
 * Whether `ware` can be bought now — 0523: it is for sale, not already owned, and the balance covers
 * it. The shop says why not when it cannot; this is the rule, and the reducer is held to it.
 */
export function canBuy(state: HangarState, ware: OwnableKind): boolean {
  const price = OWNABLES[ware].price;
  return price !== null && !state.owned[ware] && state.shards >= price;
}

/**
 * Whether `ship`'s wheels may wear `rim` — 0527. Never on a ship with no wheels. A rim that comes on a
 * car is on the dash's rule — its own always, the other car's once both are won in — and one only
 * Cosmo's sells is on any car once it is owned, as a dangle hangs on any dash.
 */
export function rimOpen(state: HangarState, ship: ShipKind, rim: RimKind): boolean {
  if (SHIPS[ship].wheels === null) return false;
  const from = RIMS[rim].from;
  return from === null ? state.owned[rim] : plateOpen(state, ship, from);
}

/**
 * Whether `ship` may wear `art` — 0528. Only a look drawn for that ship; its first always, and the other
 * two once it has been won in — answered while it was planned: a win unlocks *"ship + parts + its gun"*.
 */
export function artOpen(state: HangarState, ship: ShipKind, art: ArtKind): boolean {
  if (ART[art].ship !== ship) return false;
  return art === SHIPS[ship].arts[0] || state.won[ship];
}

/**
 * Whether `ship` may wear `plate`'s dash. Its own always; another's once the ship has been won in and
 * so has the ship the dash is from.
 */
export function plateOpen(state: HangarState, ship: ShipKind, plate: ShipKind): boolean {
  return plate === ship || (state.won[ship] && state.won[plate]);
}

/**
 * Whether `ship` may open with `from`'s special — 0524, the dash's rule exactly, and one line rather
 * than a second spelling of it: a ship's own slot, open with its win, offering what won ships bring.
 */
export function specialOpen(state: HangarState, ship: ShipKind, from: ShipKind): boolean {
  return plateOpen(state, ship, from);
}

/** Whether `ship` may fly `from`'s gun — 0526, on the dash's rule, as the special is. */
export function gunOpen(state: HangarState, ship: ShipKind, from: ShipKind): boolean {
  return plateOpen(state, ship, from);
}

export function reduceHangar(state: HangarState, action: HangarAction): HangarState {
  switch (action.type) {
    // Identity preserved when nothing moved, as every slice keeps it, so the shell writes the key
    // only when something about it changed.
    case 'won':
      return state.won[action.ship] ? state : { ...state, won: { ...state.won, [action.ship]: true } };
    case 'plate':
      if (state.plate[action.ship] === action.plate || !plateOpen(state, action.ship, action.plate)) return state;
      return { ...state, plate: { ...state.plate, [action.ship]: action.plate } };
    // 0522: whole shards only, and a run that earned none moves nothing — so nothing is written for it.
    case 'earned': {
      const shards = Math.floor(action.shards);
      return shards > 0 ? { ...state, shards: state.shards + shards } : state;
    }
    // 0523: paid for once, in full, and owned for good; anything else is refused and moves nothing.
    case 'bought': {
      const price = OWNABLES[action.ware].price;
      if (price === null || !canBuy(state, action.ware)) return state;
      return { ...state, shards: state.shards - price, owned: { ...state.owned, [action.ware]: true } };
    }
    // 0523: an owned dangle, or nothing, on any ship.
    case 'hung':
      if (state.hung[action.ship] === action.dangle) return state;
      if (action.dangle !== null && !state.owned[action.dangle]) return state;
      return { ...state, hung: { ...state.hung, [action.ship]: action.dangle } };
    // 0524: on the dash's terms — refused unless the ship and the special's ship have both been won in.
    case 'special':
      if (state.special[action.ship] === action.from || !specialOpen(state, action.ship, action.from)) return state;
      return { ...state, special: { ...state.special, [action.ship]: action.from } };
    // 0526: the gun, on the special's terms.
    case 'gun':
      if (state.gun[action.ship] === action.from || !gunOpen(state, action.ship, action.from)) return state;
      return { ...state, gun: { ...state.gun, [action.ship]: action.from } };
    // 0527: the wheels, refused on a ship with none and on a rim not open to it.
    case 'rim':
      if (state.rim[action.ship] === action.rim || !rimOpen(state, action.ship, action.rim)) return state;
      return { ...state, rim: { ...state.rim, [action.ship]: action.rim } };
    // 0528: the look, refused unless it is this ship's own and open to it.
    case 'art':
      if (state.art[action.ship] === action.art || !artOpen(state, action.ship, action.art)) return state;
      return { ...state, art: { ...state.art, [action.ship]: action.art } };
    /*
      0529: a hue, on the tone the ship's paint already has — Bright for a ship coming off the factory's —
      or the factory's paint back. Refused before the ship's win, and a hue past the list is no hue.
    */
    case 'livery': {
      const was = state.livery[action.ship];
      if (action.hue === null) return was === null ? state : { ...state, livery: { ...state.livery, [action.ship]: null } };
      const next = liveryOf(action.hue, was?.tone ?? 1);
      if (next === null || !liveryOpen(state, action.ship) || (was !== null && was.hue === next.hue)) return state;
      return { ...state, livery: { ...state.livery, [action.ship]: next } };
    }
    // 0529: a tone, on a ship already painted a hue; the factory's paint has no tone to change.
    case 'tone': {
      const was = state.livery[action.ship];
      const next = was === null ? null : liveryOf(was.hue, action.tone);
      if (next === null || was === null || was.tone === next.tone || !liveryOpen(state, action.ship)) return state;
      return { ...state, livery: { ...state.livery, [action.ship]: next } };
    }
    // 0530: a flame the player has, on any ship.
    case 'flame':
      if (state.flame[action.ship] === action.flame || !flameOpen(state, action.flame)) return state;
      return { ...state, flame: { ...state.flame, [action.ship]: action.flame } };
    default: {
      // Adding a member to `HangarAction` fails to compile HERE — 0016's fifth defeat.
      const unhandled: never = action;
      return unhandled;
    }
  }
}
