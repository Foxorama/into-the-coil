/**
 * RIME SHELF'S OWN COMPOSITION — glass over a very slow heart, and the weather that takes it apart.
 *
 * `docs/decisions/0146-three-more-places-and-two-after-them.md`.
 *
 * ── WHAT WAS ASKED FOR ──────────────────────────────────────────────────────────────────────────
 *
 * > *"One will be ice."*
 *
 * ⚠️ **THE WHOLE BRIEF IS ONE WORD, SO THE COMPOSITION IS BUILT FROM WHAT ICE ACTUALLY DOES.** Three
 * properties, and each one is a layer group rather than a filter setting:
 *
 * **1. IT RINGS.** Struck ice is a bell with an almost pure spectrum and a very long decay. Nearly
 * every pitched voice here is a sine or a triangle with a slow decay constant and no drive on it,
 * which is the opposite of every other place in the game.
 *
 * **2. IT CRACKS.** The transients are the character: a sheet under load fails suddenly, loudly, and
 * at a frequency far above anything else in the mix. `engine` is made of them.
 *
 * **3. IT IS SLOW ON TOP AND FAST UNDERNEATH.** A glacier moves in centuries and its surface hisses
 * with sleet. The harmony below turns twice as slowly as the other places — two bars a chord for the
 * first half — while `groove`, `arp` and `perc` run sixteenths, so the place reads as *cold* rather
 * than as *slow*, which is the trap `docs/decisions/0134-the-place-keeps-the-games-pace.md` names.
 *
 * | the brief | the rung | the layers that carry it |
 * |---|---|---|
 * | a sheet, and something under it | `run` | `drone`, `sub`, `engine`, `perc`, `chords`, `groove`, `call` |
 * | frost forming | `push` | `arp`, `ride`, `hook`, `lead` |
 * | the shelf begins to move | `surge` | `counter`, `crash`, `drive` |
 * | it is going to fail | `approach` | `toll`, `dread` |
 * | the blizzard | `boss` | `stomp`, `frenzy`, `wraith`, and the aura's two |
 *
 * ⚠️ **EVERY NOTE IS A TONE OF A NATURAL MINOR** — `docs/decisions/0099-the-cues-are-in-the-key.md`.
 * The cold here is made of **fourths and fifths stacked instead of thirds**, which is a voicing and
 * not a key: an open fifth has no warmth in it and the scale gives them away free.
 */

import { BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * THE PROGRESSION — sixteen bars, and it moves in pairs.
 *
 * ⚠️ **`Am Em F C · Dm Am G Em · F C Dm G · Am Em F G`.** Every chord in the first half falls a
 * fourth to the next, which is the slowest-sounding motion there is — the harmony is always arriving
 * where it was already going. It picks up in the third quarter and lands on G, which does not resolve.
 *
 * ⚠️ **Hoisted, because eight voices spell the same sixteen chords**, on `src/content/nebula.ts`'s
 * terms.
 */
const ROOT: readonly number[] = [0, -5, -4, 3, 5, 0, -2, -5, -4, 3, 5, -2, 0, -5, -4, -2];
const THIRD: readonly number[] = [3, -2, 0, 7, 8, 3, 2, -2, 0, 7, 8, 2, 3, -2, 0, 2];
const FIFTH: readonly number[] = [7, 2, 3, 10, 12, 7, 5, 2, 3, 10, 12, 5, 7, 2, 3, 5];

/**
 * THE SINGING — `call`'s tune, and it is one note a bar for most of the loop.
 *
 * ⚠️ **A LINE WITH ALMOST NOTHING IN IT, BECAUSE THAT IS WHAT COLD SOUNDS LIKE.** Ember Nebula's
 * hymn has two notes a bar and holes in it; this has fewer. What makes it a tune rather than a drone
 * is that the intervals are WIDE — fifths and octaves, never a step — so each arrival is somewhere
 * clearly different from the last.
 */
const SINGING: readonly (number | null)[] = [
  12, _, _, _,
  7, _, _, _,
  15, _, _, 12,
  10, _, _, _,
  17, _, _, _,
  12, _, _, _,
  14, _, _, 10,
  7, _, _, _,
  15, _, _, _,
  19, _, _, 15,
  12, _, _, _,
  14, _, _, _,
  12, _, _, 7,
  10, _, _, _,
  8, _, _, _,
  7, _, _, _,
];

/**
 * THE FALL — what `surge` opens: a line that comes DOWN through the whole loop.
 *
 * ⚠️ **A DESCENT IS THE ONE SHAPE `SINGING` NEVER MAKES**, so the section boundary is heard as a
 * direction reversing rather than as more notes — `docs/decisions/0125-the-build-starts-sooner.md`.
 * It is also, plainly, the shelf giving way.
 */
const FALL: readonly (number | null)[] = [
  24, _, 22, _,
  19, _, 17, _,
  15, _, 14, _,
  12, _, _, _,
  22, _, 19, _,
  17, _, 15, _,
  12, _, 10, _,
  7, _, _, _,
  19, _, 17, _,
  15, _, 12, _,
  10, _, 8, _,
  7, _, _, _,
  17, _, 15, _,
  12, _, 10, _,
  8, _, 7, _,
  5, _, _, _,
];

/**
 * THE MELT — sixteen notes a bar in the bottom octave, plucked, and it never stops.
 *
 * ⚠️ **A PLUCKED SINE IS THE ONLY BASS THAT CAN BE COLD.** A saw with drive on it is warm by
 * construction — that is what harmonics are — so the low end here is a fast decay on a pure tone,
 * which reads as *water under ice* rather than as *a bassline*. It is doing the job
 * `docs/decisions/0134-the-place-keeps-the-games-pace.md` demands of every place's opening and it
 * does it without adding a single warm harmonic.
 */
const MELT: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const fifth = FIFTH[bar]!;
  return [
    root, _, root + 12, fifth, root, _, fifth, root + 12,
    root, _, root + 12, fifth, fifth, root + 12, root, fifth,
  ];
});

/**
 * THE FROST — sixteenths climbing in fourths, which is what makes it grow rather than sparkle.
 *
 * ⚠️ **FOURTHS AND NOT A CHORD.** An arpeggio through a triad is a warm sound whatever you play it
 * on; a stack of fourths has no third in it at all, so the same speed and the same register comes out
 * hollow. Two intervals is the whole difference between frost and glitter.
 */
const FROST: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const fifth = FIFTH[bar]!;
  return [
    root, fifth, root + 12, fifth + 12,
    root + 12, fifth, root, fifth,
    fifth, root + 12, fifth + 12, root + 24,
    fifth + 12, root + 12, fifth, root + 12,
  ];
});

/** The crystal riff: eight a bar, struck, and it is the top of the shelf. */
const CRYSTAL: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const fifth = FIFTH[bar]!;
  return bar % 2 === 0
    ? [root + 12, _, fifth + 12, _, root + 24, _, fifth + 12, _]
    : [fifth + 12, _, root + 24, fifth + 12, _, root + 12, _, fifth + 12];
});

/** The sleet: two notes scrubbed against each other, sixteen a bar, and it is `surge`'s texture. */
const SLEET: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const fifth = FIFTH[bar]!;
  return [
    fifth, root + 12, fifth, root + 12,
    fifth, root + 12, fifth, root + 12,
    root + 12, fifth + 12, root + 12, fifth + 12,
    fifth, root + 12, fifth, root + 12,
  ];
});

/**
 * Everything Rime Shelf plays instead of the base composition.
 *
 * ⚠️ **TWENTY-ONE OF THE TWENTY-THREE, and the two left out are `bass` and `beat`**, which
 * `docs/decisions/0095-the-level-has-its-own-music.md` closes everywhere except the title.
 */
export const RIME_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ── THE GLACIER: the lowest thing in the game, and something singing four octaves above it ───────

    ⚠️ **THE GAP IS THE INSTRUMENT.** A very low sine and a very high one with nothing between them is
    what a large frozen object sounds like, and it is a thing no other place here does: every other
    drone in this project fills its own middle.
  */
  drone: [
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.26, attack: 0.5, curve: 0.88 },
    },
    {
      steps: [0, 7],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.11, attack: 0.6, curve: 0.9, lowFrom: 480, lowTo: 700, q: 1.1 },
    },
    {
      // The singing: ice under load rings at a frequency nothing else in the mix occupies.
      steps: [12, 12],
      pitched: true,
      perBeat: 0.25,
      octave: 3,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.05, attack: 1.2, curve: 1.1 },
    },
    {
      // Wind across a flat surface — narrow, high and directionless.
      steps: [1, 1],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.055, attack: 1.15, curve: 1.3, lowFrom: 4200, lowTo: 2400, highFrom: 1200, q: 0.8 },
    },
  ],

  /*
    ── UNDER THE ICE: a heart at half speed, and the water it beats in ──────────────────────────────

    ⚠️ **`sub` IS WHERE THIS PLACE PUTS EVERYTHING BELOW 130 Hz**, on `src/content/nebula.ts`'s terms:
    `LAYER_PAN` centres five layers and `tests/themes.test.ts` refuses a low-heavy layer anywhere
    else.
  */
  sub: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.15, gain: 0.34, attack: 0.2, curve: 0.95 },
    },
    {
      /*
        THE SLOW HEART. On one and three only, and the second is softer — half the rate of every
        other kick in this game, which is the one place the piece is allowed to actually be slow
        because `groove` above it is running sixteenths.
      */
      steps: ROOT.flatMap((_root, bar) =>
        bar % 4 === 3
          ? [1, _, _, _, _, _, 0.6, _, 0.88, _, _, _, _, _, 0.66, 0.7]
          : [1, _, _, _, _, _, _, _, 0.86, _, _, _, _, _, _, _],
      ),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 108, to: 27, seconds: 0.6, gain: 0.42, attack: 0.004, curve: 2, drive: 0.16 },
    },
    {
      // The groan: a shelf under load, sliding a fifth over four beats. It is the one pitch bend in
      // the place and it is what says the ice is a thing rather than a surface.
      steps: FIFTH.flatMap((fifth) => [fifth, _, _, _]),
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.86, 0.9, 0.82],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 3.2, gain: 0.2, attack: 0.3, curve: 1.1, lowFrom: 220, lowTo: 130, q: 1.6 },
    },
  ],

  /*
    ── THE KIT, WHICH IS THE SHEET FAILING ──────────────────────────────────────────────────────────

    ⚠️ **A CRACK IS A DRUM WITH NO BODY.** Every hit here is a very short, very bright noise burst
    with almost nothing under 1 kHz — so the layer that normally carries a kick carries the top of the
    mix instead, and the bottom is left entirely to `sub` and `groove`. It is the single largest
    reason this place does not sound like level three from the first bar.
  */
  engine: [
    {
      // The crack. On the beat, so the place still has a pulse, and it is the loudest transient here.
      steps: [1, 0.6, 0.84, 0.58, 0.92, 0.6, 0.82, 0.56, 1, 0.62, 0.86, 0.58, 0.9, 0.64, 0.8, 0.68],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.11, gain: 0.115, attack: 0.0005, curve: 6, lowFrom: 9000, lowTo: 2600, highFrom: 1400 },
    },
    {
      /*
        THE BOOM UNDER IT. The mass of the sheet answering the crack a sixteenth later — 148 Hz down
        to 54, which is the low-mid the crack itself has none of. Take it out and the layer is a
        rattle rather than a tonne of ice.
      */
      steps: [
        _, _, _, 0.86, _, _, _, _, _, _, _, 0.74, _, _, _, _,
        _, _, _, 0.9, _, _, _, _, _, _, _, 0.7, _, _, 0.6, _,
        _, _, _, 0.86, _, _, _, _, _, _, _, 0.76, _, _, _, _,
        _, _, _, 0.94, _, _, _, _, _, _, _, 0.78, _, 0.62, 0.68, 0.72,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 148, to: 54, seconds: 0.34, gain: 0.5, attack: 0.002, curve: 3, drive: 0.24 },
    },
    {
      // Sleet on the surface: sixteenths, continuous, quiet, and the top of the mix from bar one.
      steps: [
        0.46, 0.24, 0.36, 0.26, 0.42, 0.24, 0.34, 0.26, 0.48, 0.24, 0.36, 0.26, 0.4, 0.26, 0.34, 0.28,
        0.46, 0.24, 0.36, 0.28, 0.42, 0.26, 0.34, 0.24, 0.48, 0.26, 0.36, 0.28, 0.4, 0.28, 0.36, 0.3,
        0.46, 0.24, 0.38, 0.26, 0.42, 0.24, 0.36, 0.26, 0.48, 0.24, 0.36, 0.28, 0.4, 0.26, 0.34, 0.28,
        0.48, 0.26, 0.36, 0.28, 0.44, 0.26, 0.36, 0.28, 0.5, 0.28, 0.38, 0.3, 0.44, 0.32, 0.42, 0.38,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.028, gain: 0.07, attack: 0.0004, curve: 8.5, lowFrom: 13000, highFrom: 7000 },
    },
    {
      // The offbeat shuffle — snow being moved rather than struck.
      steps: [
        _, 0.44, _, 0.32, _, 0.4, _, 0.34, _, 0.46, _, 0.32, _, 0.4, _, 0.36,
        _, 0.44, _, 0.34, _, 0.42, _, 0.32, _, 0.48, _, 0.34, _, 0.42, 0.36, 0.4,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.14, gain: 0.055, attack: 0.03, curve: 3, lowFrom: 3000, lowTo: 1100, highFrom: 600 },
    },
  ],

  /*
    ── THE SMALL GLASS: shards, and a bell made of nothing ─────────────────────────────────────────

    ⚠️ **`perc` sits at −0.45 and therefore may not be low** — `tests/themes.test.ts`. Ice has almost
    nothing down there anyway once `sub` has taken the mass, so this is the one place in the game
    where the band rule and the picture want the same thing.
  */
  perc: [
    {
      // The shards: rare, very high, and the brightest sound in the piece.
      steps: [1, _, _, 0.66, _, _, 0.8, _, _, 0.62, _, 0.86, _, _, 0.7, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'tri', from: 5200, to: 3600, seconds: 0.075, gain: 0.115, attack: 0.0005, curve: 6.5, highFrom: 2600 },
    },
    {
      // Sixteenths of fine grit, so something is always moving up there.
      steps: [
        0.42, 0.24, 0.32, 0.26, 0.38, 0.24, 0.3, 0.26, 0.4, 0.24, 0.32, 0.26, 0.36, 0.26, 0.32, 0.28,
        0.42, 0.24, 0.32, 0.28, 0.38, 0.26, 0.3, 0.24, 0.4, 0.26, 0.32, 0.28, 0.36, 0.28, 0.34, 0.3,
        0.44, 0.24, 0.34, 0.26, 0.38, 0.24, 0.32, 0.26, 0.42, 0.24, 0.32, 0.28, 0.36, 0.26, 0.32, 0.28,
        0.42, 0.26, 0.34, 0.28, 0.4, 0.26, 0.32, 0.28, 0.44, 0.28, 0.36, 0.3, 0.4, 0.32, 0.38, 0.34,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.025, gain: 0.05, attack: 0.0004, curve: 9, lowFrom: 15000, highFrom: 8000 },
    },
    {
      /*
        THE FRAME. 176 Hz falling to 108 — the low-mid a place made of glass would otherwise have
        nothing in at all, which `src/content/nebula.ts` found by measurement after the fact.
      */
      steps: [1, _, 0.6, _, 0.7, _, _, 0.64, 0.84, _, 0.58, _, 0.72, _, 0.62, 0.6],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 176, to: 108, seconds: 0.2, gain: 0.3, attack: 0.001, curve: 4.4, drive: 0.18 },
    },
    {
      // A hand bell, struck twice a phrase. Pitched-sounding without being pitched, which is what a
      // tuned percussion instrument in a cold place is.
      steps: [_, _, 0.9, _, _, _, _, 0.72, _, _, 0.84, _, _, _, 0.68, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'tri', from: 2640, to: 2200, seconds: 0.32, gain: 0.09, attack: 0.001, curve: 3, highFrom: 1300 },
    },
  ],

  /*
    ── THE SHEET: a pad with no third in it, and a shimmer on top ──────────────────────────────────

    ⚠️ **ROOTS AND FIFTHS HELD, AND THE THIRD ONLY IN THE MIDDLE.** An open fifth is the coldest
    interval there is and it is free — the scale has one over every degree. The thirds are present so
    the harmony is legible and they are the quietest voices in the stack, which is the whole
    arrangement decision here.
  */
  chords: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 5.4, gain: 0.13, attack: 0.6, curve: 1.2, lowFrom: 900, lowTo: 1500, q: 1.1 },
    },
    {
      steps: FIFTH,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 5.4, gain: 0.1, attack: 0.7, curve: 1.2 },
    },
    {
      steps: THIRD,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      accents: [0.86, 0.74, 0.9, 0.72, 0.84, 0.78, 0.88, 0.7],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 5.2, gain: 0.1, attack: 0.8, curve: 1.25 },
    },
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 3,
      accents: [0.8, 1, 0.76, 0.9, 0.84, 0.96, 0.78, 0.7],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 5, gain: 0.045, attack: 0.9, curve: 1.3, highFrom: 1800 },
    },
    {
      /*
        THE ARTICULATION. Eighths on the off-beat, short — the voice that stops a held pad measuring
        six notes a bar and sitting still, which is `src/content/nebula.ts`'s own finding about its
        choir.
      */
      steps: ROOT.flatMap((root, bar) => [_, FIFTH[bar]!, _, root + 12, _, FIFTH[bar]!, _, THIRD[bar]! + 12]),
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.7, 0.86, 0.68],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.06, attack: 0.006, curve: 3.6, lowFrom: 2600, lowTo: 1300, q: 1.3 },
    },
    {
      /*
        THE BOTTOM OF THE SHEET — and it sits at 220 Hz rather than at 55, which is a guard rather
        than a taste. `chords` is placed at +0.2 and `tests/themes.test.ts` refuses a placed layer
        carrying its weight under 130 Hz; `MUSIC_ROOT` is 55, so octave 0 AND octave 1 are both under
        it and a sustained pad down there puts two thirds of the layer in the wrong band. The deep of
        this place lives in `sub` and `groove`, which are centred and may.
      */
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.16, attack: 0.5, curve: 1.05 },
    },
  ],

  /*
    ── THE MELT: sixteenths in the bottom octave, plucked, from the opening ────────────────────────
  */
  groove: [
    {
      steps: MELT,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.5, attack: 0.002, curve: 3.6 },
    },
    {
      steps: MELT,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.18, gain: 0.14, attack: 0.002, curve: 4.6, lowFrom: 900, lowTo: 420, q: 1.4 },
    },
    {
      steps: MELT,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.14, gain: 0.05, attack: 0.002, curve: 5.5, lowFrom: 2000, lowTo: 900, q: 1.4 },
    },
  ],

  /*
    ── THE SINGING: one note a bar, four octaves up, and a very long tail ──────────────────────────
  */
  call: [
    {
      steps: SINGING,
      pitched: true,
      perBeat: 1,
      octave: 3,
      accents: [1, 0.78, 0.9, 0.74],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.6, gain: 0.115, attack: 0.02, curve: 1.5 },
    },
    {
      steps: SINGING,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.78, 0.9, 0.74],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 2.6, gain: 0.075, attack: 0.04, curve: 1.4, lowFrom: 3200, lowTo: 1700, q: 1.2 },
    },
    {
      // The strike that starts each note — a very short glass tick, so the line has a front edge and
      // does not simply fade in out of the pad.
      steps: SINGING.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.022, gain: 0.06, attack: 0.0004, curve: 9, lowFrom: 12000, highFrom: 5000 },
    },
  ],

  /*
    ── THE CRYSTAL RIFF: what `push` opens ─────────────────────────────────────────────────────────
  */
  hook: [
    {
      steps: CRYSTAL,
      pitched: true,
      perBeat: 2,
      octave: 2,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.9, gain: 0.135, attack: 0.001, curve: 2.6, highFrom: 700 },
    },
    {
      steps: CRYSTAL,
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.09, attack: 0.004, curve: 2.2 },
    },
    {
      steps: CRYSTAL,
      pitched: true,
      perBeat: 2,
      octave: 3,
      accents: [1, 0.7, 0.86, 0.68],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.7, gain: 0.05, attack: 0.001, curve: 3.4 },
    },
  ],

  /*
    ── THE FROST: sixteenths in fourths, and the pulse doubling is what `push` means ───────────────
  */
  arp: [
    {
      steps: FROST,
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.68, 0.86, 0.66],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.075, attack: 0.001, curve: 4, highFrom: 900 },
    },
    {
      steps: FROST,
      pitched: true,
      perBeat: 4,
      octave: 3,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.16, gain: 0.04, attack: 0.001, curve: 5 },
    },
  ],

  /*
    ── THE RIDE: a fine, continuous hiss with a front edge on it ───────────────────────────────────
  */
  ride: [
    {
      steps: [
        0.7, 0.3, 0.44, 0.28, 0.58, 0.3, 0.42, 0.26, 0.72, 0.3, 0.44, 0.28, 0.56, 0.3, 0.42, 0.48,
        0.68, 0.28, 0.42, 0.26, 0.6, 0.3, 0.4, 0.28, 0.74, 0.3, 0.44, 0.3, 0.58, 0.32, 0.44, 0.5,
        0.7, 0.3, 0.44, 0.26, 0.58, 0.28, 0.42, 0.3, 0.72, 0.28, 0.42, 0.3, 0.56, 0.3, 0.42, 0.46,
        0.66, 0.3, 0.42, 0.28, 0.62, 0.3, 0.42, 0.26, 0.76, 0.34, 0.46, 0.32, 0.6, 0.36, 0.46, 0.54,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.026, gain: 0.125, attack: 0.0004, curve: 9, lowFrom: 14000, highFrom: 7000 },
    },
  ],

  /*
    ── THE LEAD: four bars, and it is the only warm thing in the place ─────────────────────────────
  */
  lead: [
    {
      steps: [
        12, _, _, _, 15, _, 14, _,
        12, _, 10, _, 12, _, _, _,
        17, _, _, _, 19, _, 17, _,
        15, _, 14, _, 12, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.115, attack: 0.09, curve: 1.3, lowFrom: 2400, lowTo: 1300, q: 1.4 },
    },
    {
      steps: [
        12, _, _, _, 15, _, 14, _,
        12, _, 10, _, 12, _, _, _,
        17, _, _, _, 19, _, 17, _,
        15, _, 14, _, 12, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.085, attack: 0.12, curve: 1.25 },
    },
  ],

  /*
    ── THE FALL: `surge`, and it is the shelf beginning to move ────────────────────────────────────
  */
  counter: [
    {
      steps: FALL,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.1, gain: 0.18, attack: 0.008, curve: 2.2, highFrom: 800 },
    },
    {
      steps: FALL,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.2, gain: 0.13, attack: 0.02, curve: 1.9 },
    },
    {
      steps: SLEET,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.66, 0.86, 0.64],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.06, attack: 0.004, curve: 3.4, lowFrom: 1400, lowTo: 700, q: 1.3 },
    },
  ],

  /*
    ── THE COLLAPSE: what a cymbal is when it is a hundred tonnes of ice ───────────────────────────
  */
  crash: [
    {
      steps: [0.95, _, _, _, _, _, _, _, 0.82, _, _, _, _, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 1.5, gain: 0.075, attack: 0.3, curve: 1.15, lowFrom: 9000, lowTo: 2200, highFrom: 900, q: 0.6 },
    },
    {
      // The tone inside the collapse: a fifth, ringing, because a sheet that big has a note.
      steps: [7, _, _, _, _, _, _, _, 0, _, _, _, _, _, _, _],
      pitched: true,
      perBeat: 1,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.8, gain: 0.09, attack: 0.05, curve: 1.4 },
    },
  ],

  /*
    ── THE DRIVE: sixteenth glass stabs, two bars, and they say nothing about the harmony ──────────
  */
  drive: [
    {
      steps: [
        0, 7, _, 12, _, 7, 0, _, 0, _, 7, 12, _, 7, _, 0,
        0, 7, _, 12, _, 7, 0, 12, 0, _, 7, 12, _, 7, 12, 0,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.62, 0.84, 0.6],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.18, gain: 0.065, attack: 0.001, curve: 4.4, highFrom: 1100 },
    },
    {
      // The mass under it, so `approach` still has a floor when `groove` closes.
      steps: [1, _, 0.7, _, 0.88, _, 0.68, 0.64, 1, _, 0.72, _, 0.86, _, 0.7, 0.8],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 152, to: 52, seconds: 0.3, gain: 0.52, attack: 0.001, curve: 3.2, drive: 0.22 },
    },
  ],

  /*
    ── THE APPROACH: a bell cut from the shelf, and the freeze underneath it ───────────────────────

    ⚠️ **`toll` SITS AT −0.5 AND MAY NOT BE LOW.** Ice is the one material where that is free: a
    struck sheet is almost all partials and its fundamental is the quietest part of it, so the bell
    below is the physics rather than a workaround.
  */
  toll: [
    {
      steps: [0, _, -5, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.9, gain: 0.3, attack: 0.004, curve: 1.2 },
    },
    {
      steps: [7, _, 2, _],
      pitched: true,
      perBeat: 0.25,
      octave: 3,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.13, attack: 0.006, curve: 1.5, highFrom: 1600 },
    },
    {
      // The partial a fourth up, which is what makes a struck sheet sound cracked rather than tuned.
      steps: [5, _, 0, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.13, attack: 0.02, curve: 1.8 },
    },
    {
      steps: [1, _, 0.86, _],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 3.6, gain: 0.085, attack: 0.6, curve: 1.4, lowFrom: 3200, lowTo: 9000, highFrom: 1500, q: 0.8 },
    },
  ],

  /*
    ── THE FREEZE: the tritone the scale contains, held, and it is the only sour thing here ────────
  */
  dread: [
    {
      steps: [2, 8, 2, 8],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.92, 0.98, 1],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.11, attack: 0.55, curve: 1.05, lowFrom: 420, lowTo: 1100, q: 2.2 },
    },
    {
      steps: [8, 2, 8, 2],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.18, attack: 0.5, curve: 1 },
    },
  ],

  /*
    ── THE BLIZZARD ─────────────────────────────────────────────────────────────────────────────────

    ⚠️ **THE FIGHT IS THE WEATHER ARRIVING, WHICH IS THE ONE BOSS IN THIS GAME THAT IS NOT A BODY.**
    `LEVEL_ONLY` closes the sheet, the melt, the frost, the riff and the lead all at once
    (`src/content/music.ts`), so what is left is the crack, the bell and three new things — and all
    three of them are noise before they are notes.
  */
  stomp: [
    {
      steps: [1, _, 0.66, _, 0.9, _, 0.62, 0.7, 1, _, 0.68, _, 0.88, 0.58, 0.72, 0.82],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 120, to: 27, seconds: 0.44, gain: 0.31, attack: 0.001, curve: 2.4, drive: 0.4 },
    },
    {
      /*
        HAIL. Thirty-seconds of dry ice on metal — the fastest thing in the game by a factor of two,
        and it exists only in the fight, which is how a place accelerates without a tempo moving
        (`docs/decisions/0093-the-gun-is-on-the-grid.md`).
      */
      steps: [
        _, 0.32, _, 0.42, _, 0.3, 0.36, 0.26, _, 0.34, _, 0.44, _, 0.3, 0.38, 0.28,
        _, 0.32, 0.28, 0.42, _, 0.28, 0.36, 0.26, _, 0.36, _, 0.4, 0.26, 0.32, 0.4, 0.3,
        _, 0.34, _, 0.44, _, 0.3, 0.38, 0.28, _, 0.32, 0.26, 0.42, _, 0.3, 0.36, 0.26,
        _, 0.32, 0.28, 0.42, 0.26, 0.32, 0.38, 0.28, 0.3, 0.36, 0.32, 0.44, 0.28, 0.34, 0.42, 0.36,
      ],
      pitched: false,
      perBeat: 8,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.035, gain: 0.115, attack: 0.0004, curve: 7.5, lowFrom: 11000, highFrom: 4200 },
    },
    {
      steps: [
        0.38, _, 0.3, _, 0.34, _, 0.28, _, 0.38, _, 0.3, _, 0.34, _, 0.3, 0.32,
        0.38, _, 0.3, _, 0.36, _, 0.28, _, 0.4, _, 0.32, _, 0.36, _, 0.32, 0.34,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.055, attack: 0.0006, curve: 5.5, lowFrom: 4200, lowTo: 1600, highFrom: 800 },
    },
  ],

  frenzy: [
    {
      /*
        THE SHARDS, TAKEN APART. Sixteenths snapping between the tritone's two notes with the fourth
        leaning on them, over eight bars — a longer figure than the four-bar phrase the listener has
        been counting in, so the fight stops fitting the level's own shape.
      */
      steps: [
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, 2, _,
        5, _, 2, 5, 8, _, 5, _, 2, 5, _, 2, 5, 8, _, 5,
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, 8, _,
        3, _, 2, 3, 8, _, 3, _, 2, 3, _, 2, 3, 8, _, 3,
        2, _, 8, 2, 8, _, 2, _, 8, 2, 8, 2, 8, 2, 8, 2,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.62, 0.86, 0.6],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.085, attack: 0.001, curve: 5, highFrom: 1200 },
    },
    {
      steps: [
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, 8, _,
        2, _, 5, 2, 8, _, 2, _, 5, 2, _, 5, 2, 8, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, 2, _,
        8, _, 3, 8, 2, _, 8, _, 3, 8, _, 3, 8, 2, _, 8,
        8, _, 2, 8, 2, _, 8, _, 2, 8, 2, 8, 2, 8, 2, 8,
      ],
      pitched: true,
      perBeat: 4,
      octave: 3,
      accents: [1, 0.6, 0.84, 0.62],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.15, gain: 0.05, attack: 0.001, curve: 6 },
    },
  ],

  wraith: [
    {
      /*
        THE WIND, WHICH IS THE ONLY THING IN THIS FIGHT THAT SCREAMS. Held notes a minor second apart
        — E against F, then B against C — driven until the tone comes apart, on the same construction
        Ember Nebula's choir uses. A gale and a scream are the same sound with different lungs.
      */
      steps: [
        8, _, 7, _, 8, _, 7, _,
        3, _, 2, _, 3, _, 2, _,
        8, _, 7, _, 8, _, 7, 8,
        2, _, 3, _, 2, _, 3, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.07, attack: 0.14, curve: 1.5, lowFrom: 2400, lowTo: 900, q: 2.8, drive: 0.7 },
    },
    {
      steps: [
        7, _, 8, _, 7, _, 8, _,
        2, _, 3, _, 2, _, 3, _,
        7, _, 8, _, 7, _, 8, 7,
        3, _, 2, _, 3, _, 2, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.1, gain: 0.04, attack: 0.16, curve: 1.4, lowFrom: 4200, lowTo: 1800, q: 2.4, drive: 0.6 },
    },
  ],

  /*
    ── THE AURA: how far off the weather is ─────────────────────────────────────────────────────────
  */
  auraSlow: [
    {
      steps: [8, _, 2, _, 8, _, 2, _],
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.28, attack: 0.32, curve: 1.5, lowFrom: 360, lowTo: 800, q: 1.5 },
    },
    {
      steps: [2, _, 8, _, 2, _, 8, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.28, attack: 0.36, curve: 1.35 },
    },
    {
      // The front itself: broadband, slowly opening, and it is what a wall of weather actually is.
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.3, gain: 0.11, attack: 0.4, curve: 1.4, lowFrom: 1400, lowTo: 5200, highFrom: 400, q: 0.7 },
    },
  ],

  auraFast: [
    {
      steps: [2, 2, 2, 2, 2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8],
      pitched: true,
      perBeat: 2,
      octave: 3,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.14, attack: 0.002, curve: 6 },
    },
    {
      steps: [_, 8, _, 8, _, 8, _, 8, _, 2, _, 2, _, 2, _, 2],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.26, gain: 0.13, attack: 0.003, curve: 5, highFrom: 900 },
    },
    {
      // Ice ticking as it contracts. Sample-and-hold noise rather than white — `from` on a noise
      // voice is a period, held (`src/app/sound.ts`), which is the one thing here that is not smooth.
      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 6800, to: 3200, seconds: BEAT_SECONDS * 0.24, gain: 0.09, attack: 0.002, curve: 5, lowFrom: 9000, lowTo: 3600, highFrom: 1600 },
    },
  ],
};
