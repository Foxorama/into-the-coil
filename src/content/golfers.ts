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
export const GOLFER_KINDS = ['feather', 'woo', 'larry', 'bo', 'marmot'] as const;

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
  /**
   * What body they are drawn with — 0546. Absent is a golfer; the Marmot is a marmot, in a riding suit
   * (`shirt`) and a full-face helmet (`cap`), his fur `skin` and `hair`. A row says its own, and the
   * painter's fallback is the person every other runner is (0282).
   */
  figure?: 'marmot';
}

export interface GolferRow extends RunnerRow {
  /** Their name, as the select screen and the menu say it. */
  name: string;
  /**
   * The name they go by, under their card on the pilot band — 0546. It was the first word of `name`,
   * which is *The* for the Marmot; a row says its own.
   */
  goesBy: string;
  /**
   * The ship they fly, and with it the gun — 0441: *"each pilot has their own ship."* On the golfer
   * and not on the ship, because who flies what is a fact about the pilot: a fifth golfer may be given
   * a ship that already exists.
   */
  ship: ShipKind;
  /**
   * Where they are from. It was the select card's line under the name (0415) until 0441 gave that line
   * to the ship and its gun; the pilot screen's panel says it again (0513).
   */
  home: string;
  /** Their pronouns, as the predecessor gives them. */
  pronouns: string;
  /**
   * Who they are, in a line — 0513. It was a code comment on each row, and the review found it there:
   * *"nothing anywhere says who a pilot is"*. On the row now, so the pilot screen's panel reads it.
   */
  bio: string;
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
  /**
   * Who must have cleared the game before this pilot may fly, or empty for one who flies from the first
   * run — 0546. Asked: *"locked until you beat the game with every pilot (on any difficulty, but must
   * clear it with all four starting pilots) - he can show up on the list of random rescuee's with some
   * voice lines before he's unlocked as a teaser though."* A clear is a win in the pilot's own ship
   * (`won` in `src/state/slices/hangar.ts`): any tier, any credits, as 0521 counts every win.
   */
  opensAfter: readonly GolferKind[];
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
    goesBy: 'Feather',
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
    bio: 'Learned to read solar wind flying kites over the Ngong Hills; a feather on the dash, and a slow, sure drift through any crossfire.',
    voice: 1.14,
    opensAfter: [],
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
    goesBy: 'Huang-Woo',
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
    bio: 'Flies by ear with the canopy blacked out and names every gun by its report; once hooked under the Gwangalli bridge at full burn.',
    voice: 1.03,
    opensAfter: [],
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
    goesBy: 'Longshot',
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
    bio: 'Three long-haul records, a dented fender on the mantel, two kids and a kelpie, and a wagon that once towed a road train through a meteor storm.',
    voice: 0.8,
    opensAfter: [],
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
    goesBy: 'Backspin',
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
    bio: 'Puts spin on everything, shots included; roasts coffee named for their barrel rolls; once lost a dogfight to their own ricochet.',
    voice: 0.95,
    opensAfter: [],
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
  /**
   * The Marmot — 0546. *The Far Carry*'s Marmot Bartender: he pocketed golf balls from the trade tents,
   * tended the 19th-hole bar on the tips, and slipped off to play the spaceport par-3 whenever the jar
   * was full. He rides the Thunderbolt in a full-face motorbike helmet, ears moulded into the shell.
   *
   * ⚠️ **LOCKED BEHIND THE FOUR, AND RESCUABLE BEFORE IT** — *"he can show up on the list of random
   * rescuee's with some voice lines before he's unlocked as a teaser though."* `rescuable` walks every
   * kind, so he is in the Viper's pool from the first run; `opensAfter` is what keeps him off the
   * select until all four have cleared the game.
   *
   * ⚠️ **HIS LINES LAND FOR A PLAYER WHO NEVER MET HIM** — 0426's rule: *you came, I'm out, thank you*,
   * in his voice — a bartender's, a little gruff, and short. Any `saving` line may answer any `saved`.
   */
  marmot: {
    name: 'The Marmot',
    goesBy: 'Marmot',
    ship: 'thunderbolt',
    home: 'The 19th Hole',
    pronouns: 'he/him',
    // His helmet, black; his riding suit, brown leather; his fur, and its darker guard hairs.
    cap: '#15171e',
    shirt: '#4a3122',
    skin: '#8a5a34',
    hair: '#5f3c20',
    cut: 'crop',
    stubble: false,
    build: 0.82,
    figure: 'marmot',
    bio: 'Tends the spaceport bar on tips and pockets whatever the trade tents drop; rides the Thunderbolt out whenever the jar is full.',
    // High and quick: a small animal's voice, and the whistle a marmot is named for.
    voice: 1.38,
    opensAfter: ['feather', 'woo', 'larry', 'bo'],
    saved: [
      'About time! I was down to my last golf ball in there.',
      'You came for me? Drinks are on the house. Forever.',
      'Out! Never thought I’d miss sweeping the bar.',
      'That thing kept thumping. Sound of my bike’s better. Thanks.',
      'Took you long enough. Kidding. Thank you. Really.',
    ],
    saving: [
      'Hop on! Mind the tail.',
      'Easy now. I’ve got you. Hold on to something.',
      'Nobody gets left behind. Not on my bike.',
      'Last call, pal. We’re going home.',
      'Heard you were stuck. Came straight over.',
    ],
  },
};

/**
 * Whether `golfer` may fly, by the ships that have cleared the game — 0546. A pilot whose `opensAfter`
 * is empty always may; one who names pilots may once every one of them has won in their own ship.
 */
export function pilotOpen(golfer: GolferKind, won: Readonly<Record<ShipKind, boolean>>): boolean {
  return GOLFERS[golfer].opensAfter.every((k) => won[GOLFERS[k].ship]);
}

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
