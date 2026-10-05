/**
 * What a car's wheels wear — `docs/decisions/0527-the-wheels-turn.md`, item 7 of
 * [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
 *
 * Asked for: *"Each car authors its own set of rims"*, and after item 6, *"from Golf-Stars add the full
 * sick spinning wheels from The Mothership into Cosmo's for 1000 shards"* — the predecessor's mythic
 * saucer's landing-gear wheels, a dark tyre on a silver rim with a cross of spokes, turning.
 *
 * ⚠️ **A RIM IS A DRAWING INSIDE A TYRE, AND THE TYRE IS THE CAR'S.** Where a car's wheels stand and how
 * big they are is on its row (`wheels` in `src/content/ships.ts`); a rim is painted to whatever tyre it
 * is put in, so the Firebird's snowflakes fit the estate's smaller wheels and the spinners fit both.
 *
 * ⚠️ **A LOOK, NEVER A THING THE SIM READS** — `docs/game.md`'s *nothing that changes a run is for sale*
 * (0522). The frame turns a spinner's picture; nothing about the run depends on which rim is on.
 */

import type { ShipKind } from './ships.ts';

/** Every rim. Closed — a new one is a row here and a painter in `src/render/bake.ts`. */
export const RIM_KINDS = ['snowflake', 'whitewall', 'spinner', 'bolts'] as const;
export type RimKind = (typeof RIM_KINDS)[number];

export interface RimRow {
  /** What the hangar and the shop call it. */
  name: string;
  /** One line about it. */
  hint: string;
  /**
   * The car it comes on, or `null` for one only Cosmo's sells. A car's own rim is open on it from the
   * start and on the other car once both are won in — the dash's rule (0521).
   */
  from: ShipKind | null;
  /** What it costs at Cosmo's, in Star Shards, or `null` for one that comes on a car. */
  price: number | null;
  /**
   * Seconds a turn, or `null` for a rim baked still into the hull. Turned by the frame on a picture of
   * its own over each wheel (`stepWheels`); the Mothership's two turned at 0.7 s and 0.8 s, so a pair
   * never ticks round in step, and so do these, front and back.
   */
  turn: readonly [number, number] | null;
}

export const RIMS: Record<RimKind, RimRow> = {
  // The Trans Am's — 0516: *"can we give it the golden spikes for the wheels as well?"*
  snowflake: { name: 'Gold snowflakes', hint: 'Ten gold spikes on a dark dish', from: 'firebird', price: null, turn: null },
  // The estate's — 0461: a whitewall and a gilt hubcap with a chrome boss.
  whitewall: { name: 'Whitewalls', hint: 'A white band and a gilt hubcap', from: 'estate', price: null, turn: null },
  /*
    The Mothership's. The top price, set by the player with the ask: four clears of the gentlest tier
    at one credit, where the thrusters are three and a dangle two.
  */
  spinner: { name: 'Mothership spinners', hint: 'Silver spokes that never stop turning', from: null, price: 1000, turn: [0.7, 0.8] },
  // The Thunderbolt's — 0538: the predecessor's chopper wore bright rims; these are its lightning.
  bolts: { name: 'Lightning spokes', hint: 'A cyan bolt across a dark dish', from: 'thunderbolt', price: null, turn: null },
};
