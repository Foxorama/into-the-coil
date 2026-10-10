/**
 * What a ship's engines burn — `docs/decisions/0530-the-ions-burn-blue.md`, item 10 of
 * [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
 *
 * Asked for: *"also in the cosmetic shop Ion Thrusters - blue flame thrusters for your spaceship"*, and
 * priced: *"Ion Thursters being 400 shards at the next tier"*. Planned as *"the exhaust's ink becomes a
 * slot; the blue flame is the first thing it sells, weighed against the frost shot on the frost ship's
 * level before it ships."*
 *
 * ⚠️ **A BLUE AND NOT A CYAN, BECAUSE THE FROST SHOT IS CYAN.** The frost ship's shard and its hail are
 * `#5ef0ff`, a hair from the player's own cyan; an ion flame in that ink would trail a frost shard behind
 * the ship on the one level where frost shards are what kills. The ion flame is a royal blue round a
 * periwinkle tongue, twenty-five degrees and more off the frost's hue and far deeper — photographed
 * against the frost ship's volleys in the decision.
 *
 * ⚠️ **A LOOK, NEVER A THING THE SIM READS** — the flame is in no pairing (`src/content/exhaust.ts`).
 */

import { priced } from './prices.ts';

/** Every flame. Closed — a new one is a row here. */
export const FLAME_KINDS = ['standard', 'ion'] as const;
export type FlameKind = (typeof FLAME_KINDS)[number];

export interface FlameRow {
  /** What the band and the shop call it. */
  name: string;
  /** One line about it. */
  hint: string;
  /** What it costs at Cosmo's, or `null` for the one every ship comes with. */
  price: number | null;
  /**
   * Its two inks — the flame's body and its tongue; the white core is every flame's. `null` for the
   * palette's own, the shot's orange round the hazard's yellow, which is what the standard flame was.
   */
  inks: { readonly outer: string; readonly inner: string } | null;
}

export const FLAMES: Record<FlameKind, FlameRow> = {
  standard: { name: 'Standard', hint: 'The orange the engines came with', price: null, inks: null },
  ion: { name: 'Ion Thrusters', hint: 'Blue flame thrusters, for any ship', price: priced(400), inks: { outer: '#3a5cff', inner: '#9fb8ff' } },
};
