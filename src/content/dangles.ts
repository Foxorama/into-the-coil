/**
 * What hangs from the dash — `docs/decisions/0523-cosmo-opens.md`, item 3 of
 * [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
 *
 * Asked for: *"choose what is hanging from the dashboard in the novelty dice slot"*, and of the shop,
 * *"starting items to buy will be some other fun things to hang from the dashboard - like a eucalyptus
 * potpurri tree, a picture of the alien's family in a little frame, a golf ball."*
 *
 * ⚠️ **THE DASH IS THE READOUT'S PLATE.** No cockpit is drawn, and at the ship's 9.4-unit box a dangle in
 * the world would be under the smallest mark the bake allows; the estate's fuzzy dice were already
 * hung from the plate (0461), on the swing the frame drives (0466). Every dangle hangs there, on that
 * swing, and is drawn by its own class in `src/app/chrome.ts`.
 *
 * ⚠️ **A LOOK, NEVER A THING THE SIM READS** — `docs/game.md`'s *nothing that changes a run is for sale*
 * (0522). Nothing in `src/sim/` or the frame may import this table.
 */

import { priced } from './prices.ts';

/** Every dangle. Closed — a new one is a row here and a drawing in the chrome. */
export const DANGLE_KINDS = ['dice', 'eucalyptus', 'family', 'golfball', 'duck', 'horseshoe', 'mirrorball', 'bobblehead'] as const;
export type DangleKind = (typeof DANGLE_KINDS)[number];

export interface DangleRow {
  /** What the hangar and the shop call it. */
  name: string;
  /** One line about it, on the shop's shelf. */
  hint: string;
  /**
   * What it costs at Cosmo's, in Star Shards, or `null` for one every player has from the start.
   * Set from the first played clear — Legendary, one credit, 157 shards: *"let's set the cheaper stuff
   * at 250 shards for a base level"*.
   */
  price: number | null;
}

export const DANGLES: Record<DangleKind, DangleRow> = {
  // The estate's own since 0461, and every player's: the slot is named for them.
  dice: { name: 'Fuzzy dice', hint: 'A pair in the classic red fur', price: null },
  eucalyptus: { name: 'Eucalyptus tree', hint: 'A potpourri tree, for the long way down', price: priced(250) },
  family: { name: 'Family photo', hint: 'The alien’s family, in a little gilt frame', price: priced(250) },
  golfball: { name: 'Golf ball', hint: 'Dimpled, on a string — a keepsake from the Far Carry', price: priced(250) },
  // 0589: *"we need more cosmetics of every shape and style"* — four more on the same strand, at the cheaper stuff's price.
  duck: { name: 'Rubber duck', hint: 'A yellow duck, squeaky and unafraid', price: priced(250) },
  horseshoe: { name: 'Lucky horseshoe', hint: 'Gilt, and hung the right way up', price: priced(250) },
  mirrorball: { name: 'Mini mirror ball', hint: 'A disco ball the size of a thumb', price: priced(300) },
  bobblehead: { name: 'Alien bobblehead', hint: 'Nods along to every turn', price: priced(300) },
};

// What Cosmo's sells is every ownable row with a price — `src/content/wares.ts` since 0527.
