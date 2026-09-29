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
  /**
   * How their voice blips when a speech bubble types what they say, as a playback rate on the `talk`
   * cue — 0418. One cue, pitched per golfer, so a fifth golfer is a number here rather than a cue.
   */
  voice: number;
  /**
   * What they might say when they are the one found in the Viper — 0418, *"a speech bubble voice line
   * about being saved"*. One is picked when the finale starts. In their own voice: the predecessor's
   * lore for them, read for this.
   */
  saved: readonly string[];
  /** And what they might say when they are the one who came for them — *"relatable to their character"*. */
  saving: readonly string[];
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
    // Reads wind off kites over the Ngong Hills, a feather in her cap; a controlled fade on every shot.
    voice: 1.14,
    saved: [
      'I felt the wind change in here. I knew it would be you.',
      'My feather’s still in my cap. So it’s a good day after all.',
      'I counted every beat of that thing. Thank you for making it stop.',
      'Remind me never to play a course that has a pulse again.',
      'You came all this way? Tell me you aimed a little left.',
    ],
    saving: [
      'Aimed a touch left, let it drift in. Same shape as always.',
      'Kept my line. That’s all it ever takes.',
      'The wind was with us. My feather says so.',
      'Tidy. Now let’s go home before it gets messy.',
      'Predictable, they call me. You’re welcome.',
    ],
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
    // Names a club by the sound of the strike, blindfold; striped irons, and a hook into Gwangalli harbour.
    voice: 1.03,
    saved: [
      'I heard that strike from inside the heart. Pure. It had to be you.',
      'Still in one piece. Better than my tee shots at Gwangalli.',
      'That heart kept terrible tempo. Thank you for ending it.',
      'I couldn’t see a thing in there. Good thing I practise blind.',
      'Next time I get swallowed, you pick the club.',
    ],
    saving: [
      'Straight at the pin. No hook this time.',
      'I heard it crack before I saw it. Sweet spot.',
      'Irons don’t lie. Neither do these guns.',
      'That’s why I practise with my eyes closed.',
      'Pin high. Let’s get out of here.',
    ],
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
    // Three long-drive titles, a dented driver on the mantel, two kids and a kelpie, and a road train.
    voice: 0.8,
    saved: [
      'Mate! Thought I’d be stuck in here longer than a Perth summer.',
      'I owe you a cold one. Maybe the whole esky.',
      'Tell the kids, and the dog, I’m coming home.',
      'Big hitter like me needing a rescue? Don’t tell anyone.',
      'That was a longer carry than my 439, and I’m not even jealous.',
    ],
    saving: [
      'Wasn’t sure where that last one would land. Worked out, though.',
      'Went at it with the big stick. Bit of spray. Job done.',
      'That’s going on the mantelpiece, next to the driver.',
      'Longest carry of my life, that. Let’s go home.',
      'No road trains harmed this time. Beauty.',
    ],
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
    // Spins it back on a string; roasts coffee named for its spin rate; once lost a playoff to backspin.
    voice: 0.95,
    saved: [
      'You came back for me. I’m naming my next roast after you.',
      'I thought I’d spun out for good this time.',
      'It’s complicated. But thank you. Really.',
      'That heart had more spin on it than my wedges ever did.',
      'I haven’t had coffee in days. Please tell me you packed some.',
    ],
    saving: [
      'Landed it soft and it stopped dead. Right where I wanted.',
      'Zipped it back on a string. Told you I could.',
      'Call that one a ten-thousand-RPM finish.',
      'Bit and held. And nobody spun back into the water.',
      'Checked up nicely, didn’t it?',
    ],
  },
};

/** Who flies if nobody has chosen — Bo, the pilot 0412 drew, for a player who skips straight past. */
export const DEFAULT_GOLFER: GolferKind = 'bo';

/**
 * Who might be the golfer found in the Viper — 0418: *"a random one of the characters that wasn't
 * chosen"*, and *"the random rescued character slot needs to fit for other characters as well when we
 * add more playable characters."* Every golfer but the one flying, walked off the table, so a fifth
 * golfer is in the pool the moment it is a row — and has said nothing until it authors `saved`.
 * The predecessor picked its boss partner the same way (`scramblePartnerId`), read for this.
 */
export function rescuable(chosen: GolferKind): readonly GolferKind[] {
  return GOLFER_KINDS.filter((kind) => kind !== chosen);
}
