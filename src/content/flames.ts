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
import type { ShipKind } from './ships.ts';

/** Every flame. Closed — a new one is a row here. */
export const FLAME_KINDS = ['standard', 'ion', 'nebula', 'plasma', 'afterburner', 'bubbleJets', 'wyrmFlame'] as const;
export type FlameKind = (typeof FLAME_KINDS)[number];

/**
 * How a flame is drawn — 0595. Closed, per 0016: each is a way of drawing in the bake.
 *
 *   **jet**      a tapered tongue of fire, two inks round a white core — every flame until the duck
 *   **bubbles**  a stream of bubbles blown out behind, two inks for their rims round a clear middle
 */
export type FlameLook = 'jet' | 'bubbles';

export interface FlameRow {
  /** What the band and the shop call it. */
  name: string;
  /** One line about it. */
  hint: string;
  /** What it costs at Cosmo's, or `null` for one a ship comes with. */
  price: number | null;
  /**
   * Its two inks — the flame's body and its tongue; the white core is every flame's. `null` for the
   * palette's own, the shot's orange round the hazard's yellow, which is what the standard flame was.
   */
  inks: { readonly outer: string; readonly inner: string } | null;
  /** How it is drawn — 0595. Every row says its own. */
  look: FlameLook;
  /**
   * The ship it comes on, or `null` for one every ship may burn when it is owned — 0595, on the shells' and
   * the rims' rule (0584, 0527): a ship's own flame always, on another ship once both are won in.
   */
  from: ShipKind | null;
}

export const FLAMES: Record<FlameKind, FlameRow> = {
  standard: { name: 'Standard', hint: 'The orange the engines came with', price: null, inks: null, look: 'jet', from: null },
  ion: { name: 'Ion Thrusters', hint: 'Blue flame thrusters, for any ship', price: priced(400), inks: { outer: '#3a5cff', inner: '#9fb8ff' }, look: 'jet', from: null },
  /*
    0589: *"we need more cosmetics of every shape and style"* — three more, each weighed against what it
    trails behind (0295): a deep violet well below the serpent's void (#e86bff) on lightness and bluer than
    it; a green in the one window between the acid's lime (#b4ff5a) and the frost's aquamarine (#40ffd0),
    more than twenty-five degrees from each — it was a jade first, five degrees off the frost, and
    `tests/flames.test.ts` refused it; and a white-hot afterburner, the one ink no hostile shot is. None is
    the enemy's red or the fire's vermilion, and each keeps the white core every flame has.
  */
  nebula: { name: 'Nebula Burn', hint: 'Deep violet, like the gas between the stars', price: priced(450), inks: { outer: '#5a1fd6', inner: '#b496ff' }, look: 'jet', from: null },
  plasma: { name: 'Plasma Drive', hint: 'A green plasma jet', price: priced(450), inks: { outer: '#18c24a', inner: '#8dff9e' }, look: 'jet', from: null },
  afterburner: { name: 'Afterburner', hint: 'White-hot, edged in steel blue', price: priced(550), inks: { outer: '#7f9cc0', inner: '#f4f8ff' }, look: 'jet', from: null },
  /*
    0595: the Aqua Duck's own — the page's *"bubble jets"*. Bubbles blown out behind, their rims a soapy
    periwinkle round a white glint, weighed as the ion was: twenty-five degrees and more off the frost shard's
    cyan and the player's own, so a bubble is not a frost shard trailing the ship — and no hostile shot is a
    hollow ring.
  */
  bubbleJets: { name: 'Bubble Jets', hint: 'A stream of bubbles, as the Aqua Duck blows', price: null, inks: { outer: '#a0bfff', inner: '#e8f0ff' }, look: 'bubbles', from: 'duck' },
  /*
    0667: the Viper's own — the violet the intro has always seen her leave the port on (`VIPER.flame` and `VIPER.core`
    in `src/content/port.ts`). 0666 left her on the standard flame because this violet is three degrees of hue off
    the serpent's void; played, the call was the other way: *"there's no way a player will get confused with her
    flame and the serpent's colouring."* A flame trails the ship it burns from and is a tongue, never a ring, and no
    hostile shot rides behind the player's own hull.
  */
  wyrmFlame: { name: 'Wyrm Flame', hint: 'The violet she left the port on', price: null, inks: { outer: '#b060c0', inner: '#f3d2ff' }, look: 'jet', from: 'viper' },
};
