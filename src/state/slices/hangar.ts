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

import { SHIP_KINDS, type ShipKind } from '../../content/ships.ts';

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
}

/** ⚠️ **Every action names its slice**, per 0017. */
export type HangarAction =
  | { slice: 'hangar'; type: 'won'; ship: ShipKind }
  | { slice: 'hangar'; type: 'plate'; ship: ShipKind; plate: ShipKind };

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
};

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
    default: {
      // Adding a member to `HangarAction` fails to compile HERE — 0016's fifth defeat.
      const unhandled: never = action;
      return unhandled;
    }
  }
}
