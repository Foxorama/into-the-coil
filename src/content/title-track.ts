/**
 * THE TITLE TRACK — the title screen's groove, grown into a piece with a beginning, a middle and an end.
 *
 * ⚠️ **The album plan's step 5, asked for with the album**: *"title music plus run music — we'll need to make
 * the title music expand out though as it's currently a pretty short recurring sound and not a full track."*
 * The title screen plays two bars — `drone`, `bass` and `beat` from `src/content/music.ts` — and the first two are the
 * instruments of this piece's floor, walked through a longer harmony; the kit is replaced by a heart (see `heart`). What is added is written over a harmony of its own, A minor, F, C and G (see `TITLE_ROOT`): a pad that spells it, a sixteenth arpeggio, a lead that states a theme for the game, and a flute —
 * the instrument the whole album keeps coming back to — for the breakdown.
 *
 * ⚠️ **A SCORE OF SECTIONS ON A CLOCK, NOT A CAMERA** — the title has no scroll, so each section names how many
 * bars it lasts and how loud each part is in it. `scripts/album.mjs` plays it; the title screen in the game
 * still loops its two bars, and walking this score there is its own change.
 */

import { BEAT_SECONDS, MUSIC, type MusicVoice } from './music.ts';

const _ = null;

/**
 * The harmony: A minor, F, C and G, two bars each — eight bars before anything repeats.
 *
 * ⚠️ **IT WAS A MINOR AND G, A BAR EACH, FOR THE WHOLE TRACK** — heard on the album: *"it's the first two notes
 * right at the start that bounce back and forth and continue through the entire track."* The title screen's
 * two bars were this piece's floor, so the drone, the pad, the bass and the arpeggio all swung A, G, A, G every
 * 1.6 seconds for two minutes, and the theme had nowhere to go but back. The same instruments now walk a
 * progression that leaves home and comes back to it: i, VI, III, VII.
 */
const TITLE_ROOT = [0, 0, -4, -4, 3, 3, -2, -2];
const TITLE_THIRD = [3, 3, 0, 0, 7, 7, 2, 2];
const TITLE_FIFTH = [7, 7, 3, 3, 10, 10, 5, 5];
/** The note between each chord's third and fifth, for the bass's walk — always inside A natural minor. */
const TITLE_PASSING = [5, 5, 2, 2, 8, 8, 3, 3];

/** A two-bar bass riff written on A (0, 3, 5, 7 = root, third, passing, fifth), walked through the harmony. */
const walked = (steps: readonly (number | null)[]): (number | null)[] =>
  TITLE_ROOT.flatMap((_root, bar) =>
    steps.slice((bar % 2) * 8, (bar % 2) * 8 + 8).map((n) => {
      if (n === null) return _;
      const chord = [TITLE_ROOT[bar]!, TITLE_THIRD[bar]!, TITLE_PASSING[bar]!, TITLE_FIFTH[bar]!];
      const at = [0, 3, 5, 7].indexOf(n);
      return at < 0 ? n + TITLE_ROOT[bar]! : chord[at]!;
    }),
  );

/** A part of the title track: its voices, how many bars its loop is, how much room, and where it sits. */
export interface TitlePart {
  readonly voices: readonly MusicVoice[];
  readonly bars: number;
  readonly air: number;
  readonly pan: number;
}

/** The theme: eight bars that rise and fall back to B, then eight that climb higher and come home. */
const THEME: readonly (number | null)[] = [
  12, _, _, 15, 14, _, 10, _, 12, _, 5, _, 10, _, _, _,
  12, _, _, 15, 17, _, 15, 14, 15, _, 12, _, 14, _, _, _,
  19, _, _, 17, 19, _, 22, _, 24, _, 22, 19, 17, _, _, _,
  15, _, 17, 19, 22, _, 19, 17, 15, _, 14, 12, 14, _, _, _,
];

/** The arpeggio: the chord's notes in sixteenths, up and back. */
const ARPEGGIO: readonly (number | null)[] = TITLE_ROOT.flatMap((root, bar) => {
  const third = TITLE_THIRD[bar]!;
  const fifth = TITLE_FIFTH[bar]!;
  return [root, third, fifth, root + 12, fifth, third, root + 12, fifth, root, third, fifth, root + 12, third + 12, root + 12, fifth, third];
});

/** The heart under the groove: five beats in four bars, about 1.3 seconds apart, the second sound a little late. */
const TITLE_HEART: readonly (number | null)[] = (() => {
  const steps: (number | null)[] = Array.from({ length: 64 }, () => _);
  [0, 13, 26, 38, 51].forEach((at, i) => {
    steps[at] = i % 2 === 0 ? 1 : 0.92;
    steps[at + 3] = i % 2 === 0 ? 0.68 : 0.62;
  });
  return steps;
})();

/** The flute's breakdown line: long notes, a bar or two each. */
const FLUTE_LINE: readonly (number | null)[] = [
  7, _, _, _, 5, _, _, _, 3, _, _, _, 0, _, _, _,
  7, _, _, _, 10, _, _, _, 12, _, _, _, 14, _, 12, _,
];

export const TITLE_PARTS = {
  // The drone's saws only: its sine an octave under them sat at 55–65 Hz, on the heart's own body (see TITLE_SCORE).
  drone: { voices: MUSIC.drone.filter((v) => v.octave > 0).map((v) => ({ ...v, steps: v.steps[0] === 7 ? TITLE_FIFTH : TITLE_ROOT })), bars: 8, air: 0.6, pan: 0 },
  bass: { voices: MUSIC.bass.map((v) => (v.pitched ? { ...v, steps: walked(v.steps) } : v)), bars: 8, air: 0.05, pan: 0 },
  /*
    ⚠️ **THE TITLE'S KIT STOOD HERE, AND IT WAS THE METRONOME** — heard on the album: *"there's a back and forth
    sound which is overpowering the rest of the music, I was calling it the metronome previously… can we replace
    it with a quieter background heartbeat."* `MUSIC.beat` is two bars of kick and clap, which is *two beats back
    and forth* by construction (0108 fixed that in `engine` and never in the title's own drums). What is under
    the groove now is a heart, far back, about 47 a minute — the album's first sound of the thing it ends on.
  */
  heart: {
    voices: [
      { steps: TITLE_HEART, pitched: false, perBeat: 4, octave: 0, note: { wave: 'sine', from: 100, to: 50, seconds: 0.5, gain: 0.5, attack: 0.002, curve: 2.2, drive: 0.3 } },
      { steps: TITLE_HEART, pitched: false, perBeat: 4, octave: 0, note: { wave: 'sine', from: 220, to: 105, seconds: 0.22, gain: 0.14, attack: 0.002, curve: 3, drive: 0.2 } },
      { steps: TITLE_HEART, pitched: false, perBeat: 4, octave: 0, note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.05, attack: 0.001, curve: 5, lowFrom: 900, lowTo: 400, highFrom: 120 } },
    ],
    bars: 4,
    air: 0.08,
    pan: 0,
  },
  pad: {
    voices: [
      { steps: TITLE_ROOT, pitched: true, perBeat: 0.25, octave: 2, note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.05, attack: 0.4, curve: 0.6, lowFrom: 1800, lowTo: 1300, q: 0.7, release: BEAT_SECONDS * 1.5, vibrato: 6 } },
      { steps: TITLE_THIRD, pitched: true, perBeat: 0.25, octave: 2, note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.045, attack: 0.45, curve: 0.6, lowFrom: 1900, lowTo: 1400, q: 0.7, release: BEAT_SECONDS * 1.5, vibrato: 7 } },
      { steps: TITLE_FIFTH, pitched: true, perBeat: 0.25, octave: 2, note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.07, attack: 0.5, curve: 0.6, lowFrom: 2200, lowTo: 1600, q: 0.7, release: BEAT_SECONDS * 1.5 } },
    ],
    bars: 8,
    air: 0.35,
    pan: -0.15,
  },
  arp: {
    voices: [
      { steps: ARPEGGIO, pitched: true, perBeat: 4, octave: 3, accents: [1, 0.6, 0.75, 0.65], note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.03, attack: 0.004, curve: 4, lowFrom: 3600, lowTo: 1800, q: 0.9 } },
      { steps: ARPEGGIO, pitched: true, perBeat: 4, octave: 3, accents: [1, 0.6, 0.75, 0.65], note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.05, attack: 0.004, curve: 3.6, lowFrom: 4200, lowTo: 2200, q: 0.8 } },
    ],
    bars: 8,
    air: 0.3,
    pan: 0.35,
  },
  lead: {
    voices: [
      { steps: THEME, pitched: true, perBeat: 1, octave: 2 + 7 / 1200, note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.06, attack: 0.02, curve: 0.8, lowFrom: 3000, lowTo: 1900, q: 0.8, release: BEAT_SECONDS * 0.7, vibrato: 12 } },
      { steps: THEME, pitched: true, perBeat: 1, octave: 2 - 7 / 1200, note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.06, attack: 0.025, curve: 0.8, lowFrom: 2900, lowTo: 1800, q: 0.8, release: BEAT_SECONDS * 0.7, vibrato: 11 } },
      { steps: THEME, pitched: true, perBeat: 1, octave: 1, note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.07, attack: 0.02, curve: 0.8, release: BEAT_SECONDS * 0.7 } },
    ],
    bars: 16,
    air: 0.3,
    pan: -0.1,
  },
  flute: {
    voices: [
      { steps: FLUTE_LINE, pitched: true, perBeat: 1, octave: 3, note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.15, attack: 0.14, curve: 0.4, lowFrom: 4600, lowTo: 3400, q: 0.8, release: BEAT_SECONDS * 1.8, vibrato: 11 } },
      { steps: FLUTE_LINE, pitched: true, perBeat: 1, octave: 3, note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.085, attack: 0.2, curve: 0.4, release: BEAT_SECONDS * 2, vibrato: 11 } },
    ],
    bars: 8,
    air: 0.5,
    pan: 0.15,
  },
} satisfies Record<string, TitlePart>;

export type TitlePartName = keyof typeof TITLE_PARTS;

/**
 * The score: how many bars each section lasts and how loud each part is in it (1 is the part's own level).
 * A part moves to its new level across the first bar of a section; one falling away takes `glide` bars when the section says so.
 */
export const TITLE_SCORE: readonly { bars: number; glide?: number; parts: Partial<Record<TitlePartName, number>> }[] = [
  // The floor wakes: the drone and the pad.
  { bars: 8, parts: { drone: 1, pad: 0.7 } },
  /*
    The riff — and the floor lets go under it, over all eight bars: the pad gone before the heart, the drone to a third.

    ⚠️ **THE DRONE AND THE PAD PLAYED TO THE LAST BAR** — heard on the album: *"that's better but it's still too
    prominent throughout the whole track and it covers up the heart, it needs to fade away and stop as soon as
    the rest of the music starts."* The drone's saws sit at 87–131 Hz, on top of the heart's own body, and the
    two of them were the loudest held sound in every section. They are the opening and only the opening now; the
    bass, the arpeggio and the lead carry the harmony from here.

    ⚠️ **AND THEN THE DRONE KEPT, A THIRD AS LOUD** — *"I think we still need a bit of the drone in the title, but
    quieter and either replacing or mixing in well with the heart."* Ten decibels down, and without its sub
    octave, so it fills the room over the heart instead of standing on it.
  */
  { bars: 8, glide: 8, parts: { drone: 0.32, bass: 0.85 } },
  // The groove: the heart and the arpeggio.
  { bars: 16, parts: { drone: 0.32, bass: 1, heart: 1, arp: 0.8 } },
  // The theme.
  { bars: 16, parts: { drone: 0.32, bass: 1, heart: 1, arp: 0.7, lead: 1 } },
  // The breakdown: the flute over the heart, the bass and a quiet arpeggio.
  { bars: 8, parts: { drone: 0.4, bass: 0.6, flute: 1, heart: 0.8, arp: 0.35 } },
  // Everything, the theme climbing.
  { bars: 16, parts: { drone: 0.32, bass: 1, heart: 1, arp: 0.8, lead: 1.05, flute: 0.5 } },
];
