/**
 * What each ship wears on its nose, its dome or its flank — `docs/decisions/0528-the-noses-are-painted.md`,
 * item 8 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
 *
 * Asked for: *"Hood / nose art"*, planned as *"each ship authors its own: the Firebird's phoenix and its
 * alternatives, a nose art for the fighter, a crest on the estate's bonnet and the saucer's dome."*
 *
 * ⚠️ **EVERY SHIP AUTHORS ITS OWN THREE, AND NONE IS ANOTHER SHIP'S** — 0282's *every instance authors its
 * Y*. A fighter's nose and a saucer's dome are not the same place, so a look is drawn for one ship and
 * offered on that ship alone; the first of each ship's three is the one it has always worn (`arts` on its
 * row in `src/content/ships.ts`), and the other two open with its win, as its dash does.
 *
 * ⚠️ **A LOOK, NEVER A THING THE SIM READS** — `docs/game.md`'s *nothing that changes a run is for sale*.
 */

import type { ShipKind } from './ships.ts';

/** Every look. Closed — a new one is a row here, a place on its ship's row, and a drawing in the bake. */
export const ART_KINDS = [
  'chevron',
  'sharkmouth',
  'racing',
  'glass',
  'pilot',
  'visor',
  'phoenix',
  'flames',
  'rally',
  'woody',
  'crest',
  'daisies',
  'boltTank',
  'pawprint',
  'pinstripes',
] as const;
export type ArtKind = (typeof ART_KINDS)[number];

export interface ArtRow {
  /** What the band calls it. */
  name: string;
  /** One line about it. */
  hint: string;
  /** The one ship it is drawn for. */
  ship: ShipKind;
}

export const ART: Record<ArtKind, ArtRow> = {
  // The fighter's nose — 0461's violet chevron, the studio's banner colour.
  chevron: { name: 'Violet chevron', hint: 'The studio’s violet down the nose', ship: 'fighter' },
  sharkmouth: { name: 'Shark mouth', hint: 'Teeth bared at the nose, as the old fighters wore', ship: 'fighter' },
  racing: { name: 'Racing stripe', hint: 'One white stripe to the tip', ship: 'fighter' },
  // The saucer's dome — 0461's glass, and who is under it.
  glass: { name: 'Clear dome', hint: 'Glass, lit at the crown', ship: 'caddie' },
  pilot: { name: 'Little green pilot', hint: 'Feather at the controls, under the glass', ship: 'caddie' },
  visor: { name: 'Gold visor', hint: 'The dome mirrored in gold', ship: 'caddie' },
  // The Firebird's flank — 0468's gold bird.
  phoenix: { name: 'Phoenix', hint: 'One gold bird across the door', ship: 'firebird' },
  flames: { name: 'Hot-rod flames', hint: 'Gold fire licking back from the nose', ship: 'firebird' },
  rally: { name: 'Rally stripe', hint: 'One broad gold stripe, nose to tail', ship: 'firebird' },
  // The estate's flank — 0461's burl, and what is laid on it.
  woody: { name: 'Bare woody', hint: 'Burl and gilt, as it left the showroom', ship: 'estate' },
  crest: { name: 'Family crest', hint: 'A gilt shield on the front door', ship: 'estate' },
  daisies: { name: 'Flower power', hint: 'White daisies on the tailgate panel', ship: 'estate' },
  // The Thunderbolt's tank — 0538: the predecessor's chopper wore lightning, and the Marmot rides it.
  boltTank: { name: 'Lightning tank', hint: 'One cyan bolt down the tank', ship: 'thunderbolt' },
  pawprint: { name: 'Paw print', hint: 'The Marmot’s own paw, in gold on the tank', ship: 'thunderbolt' },
  pinstripes: { name: 'Pinstripes', hint: 'Hand-pulled gold lines along the tank', ship: 'thunderbolt' },
};
