/**
 * The deflector shells a ship may wear — `docs/decisions/0584-the-shields-are-worn.md`.
 *
 * Played: *"Shields need to be swappable cosmetics like the other ship items. Need a couple of different
 * cosmetic shields to buy."* Each ship has worn its own shell since 0492; that shell is its row's still,
 * and now a slot like the wheels' (0527): a ship's own always, another ship's on the dash's rule once both
 * are won in, and one only Cosmo's sells on any ship from the moment it is bought.
 *
 * ⚠️ **A LOOK, NEVER A THING THE SIM READS** — `docs/game.md`'s *nothing that changes a run is for sale*
 * (0522). What a shield DOES is one rule for every ship (`SHIELD_LAYOUT`, `shieldsOf`); this table is only
 * what it looks like and how far out it stands. The frame reads the shell off the row it was handed, so
 * it does not learn that shells move.
 *
 * ⚠️ **EVERY SHELL AUTHORS ITS OWN PICTURE AND ITS OWN INKS** (0282) — a draw each in `src/render/bake.ts`.
 * None of them is solid, on 0379's rule for anything worn round the ship: a bullet crossing a shell is seen
 * through it.
 */

import { SPRITE } from './sprites.ts';
import { priced } from './prices.ts';
import type { ShipKind } from './ships.ts';

/**
 * Every shell. Closed, per 0016 — each is a draw in `src/render/bake.ts`, and the first five are the
 * ships' own (0492, 0545); the rest are sold at Cosmo's.
 *
 *   **honeycomb**  a strip of energy cells with a bright rim: a starfighter's deflector (0430)
 *   **bubble**     a soap film with a light sliding over it: the saucer's, in its ray's lavender
 *   **plumes**     gold-edged black feathers laid along the arc: the Firebird's phoenix
 *   **lattice**    a gilt trellis between two gilt rails, studded where it crosses: the estate's
 *   **storm**      a cage of forked lightning in the arc's cyan: the Thunderbolt's (0545)
 *   **aurora**     ribbons of northern lights, cyan into lavender into mint, rippling (0584)
 *   **runes**      a ring of alien glyphs between two thin rails, a third of them lit (0584)
 *   **disco**      a band of mirror tiles with coloured glints flashing over it (0584)
 */
export const SHELL_KINDS = ['honeycomb', 'bubble', 'plumes', 'lattice', 'storm', 'aurora', 'runes', 'disco'] as const;
export type ShellKind = (typeof SHELL_KINDS)[number];

/** The shell's draw — the shell's own kind, since a shell IS its look. */
export type ShieldLook = ShellKind;

export type ShieldFrames = readonly [number, number, number];

/**
 * A ship's shell: its look, and a plate's three shimmer frames at each of the four places
 * `SHIELD_ANGLES` names, in that order.
 */
export interface ShieldShell {
  readonly look: ShieldLook;
  readonly places: readonly [ShieldFrames, ShieldFrames, ShieldFrames, ShieldFrames];
  /**
   * How far from the ship's centre this shell stands, in world units, when not `SHIELD_ORBIT` — 0557.
   * Played: *"the lightning shield cosmetic needs to be positioned slightly further away from the
   * spaceship because it overwhelms the ship itself"*. Read through `shellOrbit`, which holds the default.
   */
  readonly orbit?: number;
}

export interface ShellRow {
  /** What the band and the shop call it. */
  readonly name: string;
  /** One line about it. */
  readonly hint: string;
  /**
   * The ship it comes on, or `null` for one only Cosmo's sells — on the wheels' terms (0527): a ship's own
   * shell is open on it from the start, and on another ship once both are won in.
   */
  readonly from: ShipKind | null;
  /** What it costs at Cosmo's, or `null` for one that comes on a ship. */
  readonly price: number | null;
  /** How it is drawn and where it stands. */
  readonly shell: ShieldShell;
}

export const SHELLS: Record<ShellKind, ShellRow> = {
  // The honeycomb deflector the game's shell always was, in the player's own ink — 0430.
  honeycomb: {
    name: 'Honeycomb deflector',
    hint: 'Cells of light, as a starfighter wears them',
    from: 'fighter',
    price: null,
    shell: {
      look: 'honeycomb',
      places: [
        [SPRITE.shield0a, SPRITE.shield0b, SPRITE.shield0c],
        [SPRITE.shield120a, SPRITE.shield120b, SPRITE.shield120c],
        [SPRITE.shield180a, SPRITE.shield180b, SPRITE.shield180c],
        [SPRITE.shield240a, SPRITE.shield240b, SPRITE.shield240c],
      ],
    },
  },
  // A soap film in its ray dish’s lavender, a light sliding over it — 0492.
  bubble: {
    name: 'Soap bubble',
    hint: 'A film of lavender light, sliding as it turns',
    from: 'caddie',
    price: null,
    shell: {
      look: 'bubble',
      places: [
        [SPRITE.shieldBubble0a, SPRITE.shieldBubble0b, SPRITE.shieldBubble0c],
        [SPRITE.shieldBubble120a, SPRITE.shieldBubble120b, SPRITE.shieldBubble120c],
        [SPRITE.shieldBubble180a, SPRITE.shieldBubble180b, SPRITE.shieldBubble180c],
        [SPRITE.shieldBubble240a, SPRITE.shieldBubble240b, SPRITE.shieldBubble240c],
      ],
    },
  },
  // Its phoenix’s feathers: black lacquer read by gold edges, as the car is — 0492.
  plumes: {
    name: 'Phoenix plumes',
    hint: 'Gold-edged feathers laid round the ship',
    from: 'firebird',
    price: null,
    shell: {
      look: 'plumes',
      places: [
        [SPRITE.shieldPlume0a, SPRITE.shieldPlume0b, SPRITE.shieldPlume0c],
        [SPRITE.shieldPlume120a, SPRITE.shieldPlume120b, SPRITE.shieldPlume120c],
        [SPRITE.shieldPlume180a, SPRITE.shieldPlume180b, SPRITE.shieldPlume180c],
        [SPRITE.shieldPlume240a, SPRITE.shieldPlume240b, SPRITE.shieldPlume240c],
      ],
    },
  },
  // A gilt trellis between gilt rails, a stud at every crossing — 0492.
  lattice: {
    name: 'Gilt trellis',
    hint: 'A gold lattice, studded where it crosses',
    from: 'estate',
    price: null,
    shell: {
      look: 'lattice',
      places: [
        [SPRITE.shieldLattice0a, SPRITE.shieldLattice0b, SPRITE.shieldLattice0c],
        [SPRITE.shieldLattice120a, SPRITE.shieldLattice120b, SPRITE.shieldLattice120c],
        [SPRITE.shieldLattice180a, SPRITE.shieldLattice180b, SPRITE.shieldLattice180c],
        [SPRITE.shieldLattice240a, SPRITE.shieldLattice240b, SPRITE.shieldLattice240c],
      ],
    },
  },
  // A cage of forked lightning — 0545. 0557: a unit and a half further out than the rest, clear of the bike.
  storm: {
    name: 'Storm cage',
    hint: 'Forked lightning, held a little further out',
    from: 'thunderbolt',
    price: null,
    shell: {
      look: 'storm',
      orbit: 7.1,
      places: [
        [SPRITE.shieldStorm0a, SPRITE.shieldStorm0b, SPRITE.shieldStorm0c],
        [SPRITE.shieldStorm120a, SPRITE.shieldStorm120b, SPRITE.shieldStorm120c],
        [SPRITE.shieldStorm180a, SPRITE.shieldStorm180b, SPRITE.shieldStorm180c],
        [SPRITE.shieldStorm240a, SPRITE.shieldStorm240b, SPRITE.shieldStorm240c],
      ],
    },
  },
  /*
    0584: the first three Cosmo's sells. Priced on the shop's own scale and 0585's rise: above a flame and
    a tube, below the spinners — a shield is worn round the whole ship, a dangle only on the dash.
  */
  aurora: {
    name: 'Aurora',
    hint: 'Northern lights rippling round the ship',
    from: null,
    price: priced(750),
    shell: {
      look: 'aurora',
      places: [
        [SPRITE.shieldAurora0a, SPRITE.shieldAurora0b, SPRITE.shieldAurora0c],
        [SPRITE.shieldAurora120a, SPRITE.shieldAurora120b, SPRITE.shieldAurora120c],
        [SPRITE.shieldAurora180a, SPRITE.shieldAurora180b, SPRITE.shieldAurora180c],
        [SPRITE.shieldAurora240a, SPRITE.shieldAurora240b, SPRITE.shieldAurora240c],
      ],
    },
  },
  runes: {
    name: 'Alien runes',
    hint: 'A ring of glowing glyphs nobody can read',
    from: null,
    price: priced(600),
    shell: {
      look: 'runes',
      places: [
        [SPRITE.shieldRunes0a, SPRITE.shieldRunes0b, SPRITE.shieldRunes0c],
        [SPRITE.shieldRunes120a, SPRITE.shieldRunes120b, SPRITE.shieldRunes120c],
        [SPRITE.shieldRunes180a, SPRITE.shieldRunes180b, SPRITE.shieldRunes180c],
        [SPRITE.shieldRunes240a, SPRITE.shieldRunes240b, SPRITE.shieldRunes240c],
      ],
    },
  },
  disco: {
    name: 'Disco ball',
    hint: 'Mirror tiles throwing coloured light',
    from: null,
    price: priced(900),
    shell: {
      look: 'disco',
      places: [
        [SPRITE.shieldDisco0a, SPRITE.shieldDisco0b, SPRITE.shieldDisco0c],
        [SPRITE.shieldDisco120a, SPRITE.shieldDisco120b, SPRITE.shieldDisco120c],
        [SPRITE.shieldDisco180a, SPRITE.shieldDisco180b, SPRITE.shieldDisco180c],
        [SPRITE.shieldDisco240a, SPRITE.shieldDisco240b, SPRITE.shieldDisco240c],
      ],
    },
  },
};

/**
 * Which shell a plate's sprite belongs to, and where on it — for the bake, which is handed a sprite and
 * draws the plate the table says it is.
 */
export function shieldPlateOf(sprite: number): { readonly shell: ShieldShell; readonly place: number; readonly shimmer: number } | null {
  for (const kind of SHELL_KINDS) {
    const places = SHELLS[kind].shell.places;
    for (let place = 0; place < places.length; place++) {
      const shimmer = places[place]!.indexOf(sprite);
      if (shimmer >= 0) return { shell: SHELLS[kind].shell, place, shimmer };
    }
  }
  return null;
}
