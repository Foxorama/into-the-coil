/**
 * The four golfers — `docs/decisions/0415-the-golfer-is-chosen.md`.
 *
 * `docs/game.md` puts the four *Far Carry* golfers in the prologue: *"choose 1 of the 4"*. This is
 * who they are — a name, a home, their colours and their hair — and, since 0441, the ship they fly.
 *
 * The colours are the predecessor's own roster rows (`C:\Golf-Stars\src\sim\rpg\characters.ts`, read
 * for this and nothing else) — cap, shirt, skin, hair and build — with the trousers, shoes and carry
 * bag its intro dressed every golfer in. Pronouns are the predecessor's too, and ride the row so the
 * words about a golfer can never be guessed from a name.
 */

import type { ShipKind } from './ships.ts';

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
  /**
   * The ship they fly, and with it the gun — 0441: *"each pilot has their own ship."* On the golfer
   * and not on the ship, because who flies what is a fact about the pilot: a fifth golfer may be given
   * a ship that already exists.
   */
  ship: ShipKind;
  /**
   * Where they are from. It was the select card's line under the name (0415) until 0441 gave that line
   * to the ship and its gun, which is what the choice decides; it is the golfer's fiction, kept for
   * whatever speaks of them next.
   */
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
   * about being saved"*. One is picked when the finale starts.
   *
   * ⚠️ **ABOUT BEING FOUND FIRST, AND WHO THEY ARE SECOND — 0426.** The first set was the predecessor's
   * lore — a 439-yard carry, a hook into Gwangalli harbour — and *"only works if you played the first
   * game a lot."* Each line has to land for a player who has never heard of the golf: it says *you
   * came, I'm out, thank you*, in a voice that is theirs. Any `saved` line may be answered by any
   * `saving` line of any golfer, so neither may answer something only one line says.
   */
  saved: readonly string[];
  /** And what they might say when they are the one who came for them — *"relatable to their character"*, on the same terms. */
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
    ship: 'caddie',
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
      'You found me! I felt the wind change, and I hoped it was you.',
      'I was starting to think nobody was coming. Thank you.',
      'Open sky! I never thought I’d be so glad to see it.',
      'I counted every beat of that thing. Thank you for making it stop.',
      'You came all this way for me? I won’t forget it.',
    ],
    saving: [
      'Found you. Stay on my wing and I’ll take us home.',
      'Nobody gets left behind. Not while I’m flying.',
      'The wind brought me right to you. Let’s go.',
      'You’re safe now. Breathe, and follow my line.',
      'Told you I’d find you. Now let’s get out of here.',
    ],
  },
  woo: {
    name: 'Huang-Woo Hook',
    ship: 'fighter',
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
      'I heard your guns through the walls. I knew someone had come.',
      'It was so dark in there. Thank you for finding me.',
      'Out! I thought I’d hear that heartbeat forever.',
      'You came in after me? I don’t know what to say. Thank you.',
      'Take me somewhere quiet. That thing never stopped beating.',
    ],
    saving: [
      'I heard you in there, every beat. I wasn’t leaving without you.',
      'Found you. Stay close, and listen for my engines.',
      'Quiet now. It’s over. Let’s go home.',
      'You’re free. Keep your eyes on me and fly.',
      'I followed the sound all the way here. Worth it.',
    ],
  },
  larry: {
    name: 'Longshot Larry',
    ship: 'estate',
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
      'Mate! You came for me! Thought I was a goner in there.',
      'Get me home to the kids and the dog. I owe you a cold one.',
      'Out at last! First round’s on me. Every round, actually.',
      'You flew all the way in here for me? You’re a legend.',
      'Big fella like me needing a rescue? Don’t tell anyone.',
    ],
    saving: [
      'Gotcha, mate! Hang on, we’re going home.',
      'Nobody gets left out here. Not on my watch.',
      'There you are! Right, stick close and give it everything.',
      'Told the kids I’d bring you back. Can’t break a promise.',
      'Took the long way round, but I got here. Let’s go.',
    ],
  },
  bo: {
    name: 'Backspin Bo',
    ship: 'firebird',
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
      'You came back for me. I’m naming my next coffee roast after you.',
      'I thought I’d be stuck in there forever. Thank you. Really.',
      'Free! Somebody please tell me there’s coffee back home.',
      'I heard someone fighting out there. I hoped it was you.',
      'You found me. I don’t even know how to thank you.',
    ],
    saving: [
      'Found you. Easy now, I’ve got you.',
      'Hey. You’re safe. Let’s go get a coffee.',
      'I wasn’t leaving without you. Not a chance.',
      'Hold on to my wing. We’re going home.',
      'All that way, and worth every second. Let’s go.',
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
