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
import { DANGLES, DANGLE_KINDS, type DangleKind } from '../../content/dangles.ts';

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
   * Which dangles the player has — 0523. The free ones from the start; a bought one from the moment it
   * is paid for, and never taken back.
   */
  owned: Readonly<Record<DangleKind, boolean>>;
  /**
   * What hangs from each ship's dash, or `null` for nothing — 0523. Each ship opens on its row's
   * `hangs`. Any dangle the player owns may hang on any ship: answered while it was planned, *a bought
   * thing fits any ship from the moment it is bought*; it is not one of a ship's own slots, which wait
   * for its win.
   */
  hung: Readonly<Record<ShipKind, DangleKind | null>>;
}

/** ⚠️ **Every action names its slice**, per 0017. */
export type HangarAction =
  | { slice: 'hangar'; type: 'won'; ship: ShipKind }
  | { slice: 'hangar'; type: 'plate'; ship: ShipKind; plate: ShipKind }
  | { slice: 'hangar'; type: 'earned'; shards: number }
  | { slice: 'hangar'; type: 'bought'; dangle: DangleKind }
  | { slice: 'hangar'; type: 'hung'; ship: ShipKind; dangle: DangleKind | null };

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
  owned: perDangle((kind) => DANGLES[kind].price === null),
  hung: perShip((kind) => SHIPS[kind].hangs),
};

/** Each dangle mapped to `of(kind)`, on `perShip`'s terms. */
function perDangle<T>(of: (kind: DangleKind) => T): Record<DangleKind, T> {
  const out: Partial<Record<DangleKind, T>> = {};
  for (const kind of DANGLE_KINDS) out[kind] = of(kind);
  return out as Record<DangleKind, T>;
}

/**
 * Whether `dangle` can be bought now — 0523: it is for sale, not already owned, and the balance covers
 * it. The shop says why not when it cannot; this is the rule, and the reducer is held to it.
 */
export function canBuy(state: HangarState, dangle: DangleKind): boolean {
  const price = DANGLES[dangle].price;
  return price !== null && !state.owned[dangle] && state.shards >= price;
}

/**
 * Whether `ship` may wear `plate`'s dash. Its own always; another's once the ship has been won in and
 * so has the ship the dash is from.
 */
export function plateOpen(state: HangarState, ship: ShipKind, plate: ShipKind): boolean {
  return plate === ship || (state.won[ship] && state.won[plate]);
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
      const price = DANGLES[action.dangle].price;
      if (price === null || !canBuy(state, action.dangle)) return state;
      return { ...state, shards: state.shards - price, owned: { ...state.owned, [action.dangle]: true } };
    }
    // 0523: an owned dangle, or nothing, on any ship.
    case 'hung':
      if (state.hung[action.ship] === action.dangle) return state;
      if (action.dangle !== null && !state.owned[action.dangle]) return state;
      return { ...state, hung: { ...state.hung, [action.ship]: action.dangle } };
    default: {
      // Adding a member to `HangarAction` fails to compile HERE — 0016's fifth defeat.
      const unhandled: never = action;
      return unhandled;
    }
  }
}
