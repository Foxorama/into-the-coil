/**
 * The four golfers — `docs/decisions/0415-the-golfer-is-chosen.md`.
 *
 * `docs/game.md` puts the four *Far Carry* golfers in the prologue: *"choose 1 of the 4"*. This is
 * who they are — a name, a home, their colours and their hair — and not yet what they fly: every
 * golfer flies the one fighter in `src/content/ships.ts` until the ships are a table of their own, and
 * the decision says so rather than letting a portrait stand in for a ship.
 *
 * The colours are the predecessor's own roster rows (`C:\Golf-Stars\src\sim\rpg\characters.ts`, read
 * for this and nothing else) — cap, shirt, skin, hair and build — with the trousers, shoes and carry
 * bag its intro dressed every golfer in. Pronouns are the predecessor's too, and ride the row so the
 * words about a golfer can never be guessed from a name.
 */

/** Every golfer, in the predecessor's roster order — the order the select screen offers them in. Closed. */
export const GOLFER_KINDS = ['feather', 'woo', 'larry', 'bo'] as const;

export type GolferKind = (typeof GOLFER_KINDS)[number];

/** How a golfer's hair is cut — the predecessor's four, each drawn by `src/render/golfer-art.ts`. */
export type HairKind = 'coils' | 'sweep' | 'crop' | 'tousled';

/**
 * What a figure running across the port is drawn from — `src/render/golfer-art.ts`. Every golfer is
 * one, and so is the Viper's pilot, who is not offered (0416).
 */
export interface RunnerRow {
  /** The cap's colour. Under a hood, none of it shows. */
  cap: string;
  shirt: string;
  skin: string;
  hair: string;
  cut: HairKind;
  /** Stubble on the jaw, washed in the hair's colour. */
  stubble: boolean;
  /** How big they stand against the others — 1 is everyone else; the big hitter a touch taller. */
  build: number;
  /** Their carry bag's colour. Absent is `KIT.bag`, the predecessor intro's red. */
  bag?: string;
  /** A hood up over the head, in this colour, in place of the cap. Absent is a cap. */
  hood?: string;
  /** Their trousers. Absent is `KIT.pants`. */
  pants?: string;
  /** Sleeves to the wrist. Absent is a polo's short ones. */
  longSleeves?: boolean;
}

export interface GolferRow extends RunnerRow {
  /** Their name, as the select screen and the menu say it. */
  name: string;
  /** Where they are from — the one line under the name, because `docs/game.md`'s voice is terse. */
  home: string;
  /** Their pronouns, as the predecessor gives them. */
  pronouns: string;
}

/** What every golfer wears under the cap and polo: the predecessor intro's trousers, shoes and bag. */
export const KIT = {
  pants: '#2c3142',
  shoes: '#232733',
  bag: '#c0392b',
  shaft: '#d7dbe2',
} as const;

export const GOLFERS: Record<GolferKind, GolferRow> = {
  feather: {
    name: 'Feather Fade',
    home: 'Nairobi',
    pronouns: 'she/her',
    cap: '#19b2a6',
    shirt: '#138f86',
    skin: '#6b4a32',
    hair: '#1c1712',
    cut: 'coils',
    stubble: false,
    build: 0.98,
  },
  woo: {
    name: 'Huang-Woo Hook',
    home: 'Busan',
    pronouns: 'he/she/they',
    cap: '#d23f4f',
    shirt: '#b23140',
    skin: '#e8c6a0',
    hair: '#14100c',
    cut: 'sweep',
    stubble: false,
    build: 1,
  },
  larry: {
    name: 'Longshot Larry',
    home: 'Perth',
    pronouns: 'he/him',
    cap: '#e0a83f',
    shirt: '#c4882a',
    skin: '#d8a878',
    hair: '#b8843f',
    cut: 'crop',
    stubble: true,
    build: 1.08,
  },
  bo: {
    name: 'Backspin Bo',
    home: 'Portland',
    pronouns: 'they/them',
    cap: '#9b5fd4',
    shirt: '#7d46b8',
    skin: '#a8714c',
    hair: '#2f2318',
    cut: 'tousled',
    stubble: false,
    build: 1,
  },
};

/** Who flies if nobody has chosen — Bo, the pilot 0412 drew, for a player who skips straight past. */
export const DEFAULT_GOLFER: GolferKind = 'bo';
