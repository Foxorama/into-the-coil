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
 *
 * ── ⚠️ AND *GLASSY* WAS SPELLED `highFrom`, WHICH IS WHY FOUR LAYERS COULD NOT BE HEARD ───────────
 *
 * ⚠️ **A HIGHPASS ABOVE A VOICE'S OWN FUNDAMENTAL DOES NOT THIN IT, IT DELETES IT.** Every pitched
 * voice here that reads *thin* was written with `highFrom` set from the sound wanted rather than from
 * the notes played, and a triangle's harmonics fall off as 1/n² — so a cutoff at the third harmonic
 * leaves about a fifth of the amplitude and a cutoff at the fifth leaves a twentieth. Measured
 * against the pitch each pattern actually spells (`MUSIC_ROOT · 2^(octave + step/12)`):
 *
 * | voice | its notes | it had | what survived |
 * |---|---|---|---|
 * | `arp` tri | 165–1175 Hz | `highFrom: 900` | harmonics only, for 13 notes of every 16 |
 * | `frenzy` tri | 247–349 Hz | `highFrom: 1200` | the 4th partial up, for every note |
 * | `counter` tri | 294–880 Hz | `highFrom: 800` | the top of the fall, and nothing under it |
 * | `hook` tri | 440–1175 Hz | `highFrom: 700` | the bottom third of the riff, gone |
 *
 * ⚠️ **THIS IS `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`'s DEFECT WITH A FILTER INSTEAD OF
 * AN ENVELOPE** — a layer measured as absent, "fixed" by a gain, and the gain amplifying whatever was
 * left rather than the thing that was missing. `arp` here wanted **16.7×** off
 * `scripts/weigh-solve.mjs`, three times the whole fader range, and no multiplier reaches material
 * that is not there. **The cutoff is now set from the lowest note the pattern spells**, so the filter
 * removes rumble and never the note.
 *
 * ⚠️ **AND THE SECOND HALF WAS THE ENVELOPE, WHICH 0152 NAMES EXACTLY.** The decay constant is
 * `exp(-curve · u)` over `seconds`, so a note's real length is about `seconds / curve` — `arp`'s
 * `BEAT_SECONDS * 0.22` at `curve: 4` was **22 ms** on a 100 ms sixteenth grid, and `groove`'s bottom
 * sine was **24.4 ms against a 24.3 ms period at its lowest note**: one cycle, which is a thud and not
 * a pitch. Ice is the one place in the game where the fix is also the brief — ***it rings*** is
 * property 1 above, and a longer decay is what that word means.
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

        ⚠️ **0.3 → 0.42, AND IT IS THE CHEAPEST DECIBEL IN THE PLACE.** Raising `arp` and `hook` spends
        the `push` low share (see `groove` above); of everything sounding at that rung, this one voice
        buys the most of it back per decibel, because `perc` is 32% low overall and **this voice is
        nearly all of that 32%** — raising the layer costs 0.05 points per dB and raising *this voice*
        gains 0.4. It is also the only lever that does not distort the solve: `groove`, `sub` and
        `engine` are beds, `docs/decisions/0154-the-mix-is-authored-as-intent.md` drives a bed 9 dB
        down and then restores the rung's level, so making a bed louder inflates **every other gain at
        the rung** — measured at +0.9 dB on `arp` and `hook` for the `groove` change above. `perc` is a
        `pulse` and does not do that. The comment this sits under is the reason it is allowed: the
        frame exists precisely to be this place's low-mid.
      */
      steps: [1, _, 0.6, _, 0.7, _, _, 0.64, 0.84, _, 0.58, _, 0.72, _, 0.62, 0.6],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 176, to: 108, seconds: 0.2, gain: 0.42, attack: 0.001, curve: 4.4, drive: 0.18 },
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

        ⚠️ **0.16 → 0.22, ON THAT SAME ARGUMENT.** `ROOT` at octave 2 is 165–294 Hz — every note this
        voice can play is inside the 130–300 Hz band and none of it is under 130, so it lifts the
        `push` low share without going anywhere near the pan guard three lines up (`chords` measures
        33% under 130 Hz against the 40% ceiling). It is also a `counter` rather than a bed, so it does
        not inflate the rung the way `groove` does — the note on `perc`'s frame has that arithmetic.
      */
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.22, attack: 0.5, curve: 1.05 },
    },
  ],

  /*
    ── THE MELT: sixteenths in the bottom octave, plucked, from the opening ────────────────────────

    ⚠️ **THE BOTTOM SINE WAS ONE CYCLE LONG.** `BEAT_SECONDS * 0.22` at `curve: 3.6` is **24.4 ms**,
    and `MELT`'s lowest note at octave 0 is 41.2 Hz — a **24.3 ms period**. A note that stops before
    its second cycle is not a pitch at all, it is a thud with a note's name on it, and *a plucked sine
    is the only bass that can be cold* above requires the sine to complete. All three voices now run
    two to three cycles of their own lowest note: 74 ms, 47 ms, 30 ms.

    ⚠️ **AND IT IS ALSO WHAT PAYS FOR THE FROST.** The paragraph on `ride` below records this place
    sitting on `docs/decisions/0147-a-place-is-a-balance.md`'s low-share floor, and it was **0.009
    percentage points** clear of it at `push` when the repairs above started — while every decibel
    added to `arp` or `hook` above 300 Hz costs about 0.23 of a point, and `arp` alone needed twelve.
    `groove` is 91% of its energy under 300 Hz, so lengthening it is the same edit twice: the fault is
    real and the repair is the budget. It ends at **0.47 points clear**, fifty times the slack it had.
  */
  groove: [
    {
      steps: MELT,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.5, gain: 0.5, attack: 0.002, curve: 2.7 },
    },
    {
      steps: MELT,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.4, gain: 0.14, attack: 0.002, curve: 3.4, lowFrom: 900, lowTo: 420, q: 1.4 },
    },
    {
      steps: MELT,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.05, attack: 0.002, curve: 4, lowFrom: 2000, lowTo: 900, q: 1.4 },
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

    ⚠️ **THE ONE OF THE FOUR WHOSE MATERIAL WAS NOT THE WHOLE STORY.** `hook` measured −15.9 dB under
    the place's loudest, which is *better* than four of the six other places' `hook`s, and still wanted
    3.4× — because `push` here is bed-heavy (`sub`, `groove` and `engine` together at 2.41 of ladder ×
    mix) and `docs/decisions/0154-the-mix-is-authored-as-intent.md` puts a bed 9 dB down, so every
    counter-line has to come up to hold the rung's level. **A structural need reads exactly like a
    material one on the same table**, and the two are separated only by comparing the layer to the same
    layer elsewhere.

    ⚠️ **SO THE MATERIAL MOVE IS SMALL AND THE FILTER MOVE IS THE REAL ONE.** `highFrom: 700` sat
    inside `CRYSTAL`'s own range (440–1175 Hz at octave 2) and took the bottom third of the riff's
    notes; 400 clears the lowest of them. The lengthening — 138 ms to 217 ms on a 200 ms eighth grid —
    is the header's *very long decay*, and the three gains went up 1.2 dB together, which keeps the
    struck triangle over the two sines rather than re-balancing the stack.
  */
  hook: [
    {
      steps: CRYSTAL,
      pitched: true,
      perBeat: 2,
      octave: 2,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.3, gain: 0.151, attack: 0.001, curve: 2.3, highFrom: 400 },
    },
    {
      steps: CRYSTAL,
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.4, gain: 0.101, attack: 0.004, curve: 1.9 },
    },
    {
      steps: CRYSTAL,
      pitched: true,
      perBeat: 2,
      octave: 3,
      accents: [1, 0.7, 0.86, 0.68],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.056, attack: 0.001, curve: 3 },
    },
  ],

  /*
    ── THE FROST: sixteenths in fourths, and the pulse doubling is what `push` means ───────────────

    ⚠️ **THE WORST MATERIAL IN THE GAME, AND IT SOUNDS AT ONE RUNG.** `MUSIC_LADDER` opens `arp` at
    `push` and nowhere else, so *masked during its only appearance* is *never heard at all* —
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` names that exact shape about Ember Nebula's
    `arp` and the same layer here was **30.4 dB under the loudest thing in the place**, wanting
    **16.7×** off `scripts/weigh-solve.mjs`. Two faults, and the gain was neither of them:

    - **`highFrom: 900` over a pattern that spells 165–1175 Hz.** `FROST` is `root, fifth, root+12,
      fifth+12, root+24`; at octave 2 only the three highest of those clear 900 Hz, so thirteen notes
      of every sixteen sounded as harmonics of a triangle with the fundamental filtered off. **150 Hz
      is under the lowest note the pattern can spell** and therefore removes rumble and nothing else.
    - **`BEAT_SECONDS * 0.22` at `curve: 4` is 22 ms**, on a sixteenth grid 100 ms wide — a 22% duty
      cycle, which is a tick and not an arpeggio. `0.78` at `curve: 2.4` is **130 ms**: it now rings
      past the note after it, which is *grow rather than sparkle* in the paragraph above and ***it
      rings*** in the file header. The gain moved last and moved least — 0.075 to 0.112, 3.5 dB of
      the 16.4 dB recovered.

    ⚠️ **THE FILTER AND THE ENVELOPE TOGETHER ARE 12.3 dB OF IT AND TOOK THE MULTIPLIER 16.67 → 3.51
    ON THEIR OWN**, before a single gain was touched. That ordering is the rule
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` was written for: its `ride` had been "fixed"
    twice by multiplying a tick.
  */
  arp: [
    {
      steps: FROST,
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.68, 0.86, 0.66],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.78, gain: 0.112, attack: 0.001, curve: 2.4, highFrom: 150 },
    },
    {
      steps: FROST,
      pitched: true,
      perBeat: 4,
      octave: 3,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.45, gain: 0.052, attack: 0.001, curve: 3 },
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
      // ⚠️ 17 ms of decay where `curve: 9` over 0.026 s gave 3, and the gain comes down as the note
      // grows — `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` has the argument and the reason
      // the attack and the band do not move. Six places carried this one line.
      //
      /*
        ⚠️ **0.096 AND NOT THE 0.1 THE OTHER FIVE TOOK, BECAUSE THIS ONE IS THE BRIGHTEST AND IT IS
        PINCHED FROM BOTH SIDES.** Rime's ride starts at 14 kHz where the rest start at 8–11, so the
        same lengthening puts more of its energy above 300 Hz than anywhere else. Driven over
        `weigh-mix` **against the material of the day it was written**:

        | gain | `rime/push` low share | quietest third |
        |---|---|---|
        | 0.100 | **28.0%** ✗ under the floor | −15.1 |
        | **0.096** | **28.0%** ✓ | **−14.9** ✓ |
        | 0.085 | 28.3% ✓ | **−15.0** ✗ under the floor |

        ⚠️ **TWO BOUNDS MOVING IN OPPOSITE DIRECTIONS ON ONE NUMBER**, which is 0092's shape and the
        reason this is written down rather than left as a value: 0147's low-share floor wants this
        quieter and its whisper floor wants it louder, and the window between them was about 1.5 dB
        wide. **A later hand raising this by ear will break one of the two, and the table says which.**

        ⚠️ **THE BAND IS THIS PLACE'S CHARACTER AND DOES NOT PAY** — *it cracks… at a frequency far
        above anything else in the mix* is the brief at the top of this file. The gain pays.

        ── ⚠️ AND THE WINDOW IS NO LONGER 1.5 dB, BECAUSE THE PINCH WAS PARTLY THE BURIED LAYERS ─────

        ⚠️ **RE-MEASURED, RATHER THAN LEFT TO ROT BESIDE A CHANGED MIX.** `quietestThird` averages the
        bottom seven layers of the place, and `arp`, `frenzy` and `wraith` were three of those seven —
        so the whisper floor that was squeezing this gain from below was **measuring their defects,
        not this one's level**. Repairing them took the third from −14.86 to −12.09 and the same sweep
        now reads:

        | gain | `rime/push` low share | quietest third |
        |---|---|---|
        | 0.110 | 28.35% ✓ | −11.92 ✓ |
        | 0.100 | 28.43% ✓ | −12.03 ✓ |
        | **0.096** | **28.47%** ✓ | **−12.09** ✓ |
        | 0.085 | 28.56% ✓ | −12.24 ✓ |

        ⚠️ **EVERY ROW PASSES NOW, AND THE VALUE IS UNCHANGED ANYWAY.** Nothing has reported this
        layer since 0152 lengthened it, the two floors are 0.5 points and 2.9 dB away rather than
        touching, and `docs/decisions/0027-measure-the-picture-not-the-model.md` is explicit that a
        model number moving is not a reason to move a sound: what would settle a new value is an ear.
        **What the table above is for now is the opposite of what it was for** — it said *do not touch
        this*, and it says *this is no longer the pinned number in the place*.
      */
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.096, attack: 0.0004, curve: 4, lowFrom: 14000, highFrom: 7000 },
    },
  ],

  /*
    ── THE LEAD: four bars, and it is the only warm thing in the place ─────────────────────────────

    ⚠️ **THE OCTAVE-1 DOUBLE WENT 0.085 → 0.13 AND THE SAW DID NOT MOVE.** `lead` is the `part` at
    `push` and drifted from 2.65× to 2.79× as everything under it came up, which is the arrangement
    working as `docs/decisions/0154-the-mix-is-authored-as-intent.md` says it should — a part is
    defined against the sum of the rest. The sub-octave spells 196–330 Hz, so raising **that** voice
    rather than the saw is the one move that lowers the part's multiplier and *raises* the low share
    at the same rung; raising the saw instead was measured, and cost 0.28 of a point for the same
    2.6 dB. The timbre is unchanged because a triangle at 0.13 against a resonant saw at 0.115 is
    still the saw in every band above the fundamental — *the only warm thing here* is what the saw is
    for, and it is untouched.
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
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.13, attack: 0.12, curve: 1.25 },
    },
  ],

  /*
    ── THE FALL: `surge`, and it is the shelf beginning to move ────────────────────────────────────

    ⚠️ **NOT ONE OF THE FOUR REPORTED, AND IT REGRESSED — SO IT IS FIXED HERE RATHER THAN NOTED.**
    `counter` solved at 2.19× before any of this and 2.85× after, because `chords`, `perc` and `groove`
    all came up at `surge` and it has to be heard over them. It carried the same fault as the other
    three — `highFrom: 800` inside a pattern spelling 294–880 Hz, cutting the bottom of a line whose
    whole point is that it **descends** — and clearing it at 250 Hz takes it to 1.87×, better than
    where it started. **A pass that repairs a class and leaves one member of it broken has moved the
    defect rather than fixed it**, which is CLAUDE.md's *after a miss, repair the class*: the four
    reported layers were the symptom and `highFrom` set from taste rather than from the notes is the
    cause.

    ⚠️ **AND FOUR MORE OF THEM ARE STILL HERE, WHICH IS STATED RATHER THAN QUIETLY LEFT.** `chords`'s
    shimmer (330–587 Hz at `highFrom: 1800`), `toll`'s partial (494–659 at 1600), `auraFast`'s second
    voice (247–349 at 900) and `drive`'s stabs (220–440 at 1100) all cut above their own fundamental
    exactly as the four repaired ones did. They are left because **none of those layers is short of
    level** — every one solves under 1.3× at every rung it sounds at — and because in three of the four
    a sibling voice in the same layer sounds the pitch, so the filtered voice is a partial rather than
    the note. `drive` is the one where that is not true and it is not costing anything, so the
    measurement that would settle it is `scripts/weigh-solve.mjs` after some later change makes it
    matter, not an argument here.
  */
  counter: [
    {
      steps: FALL,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.1, gain: 0.18, attack: 0.008, curve: 2.2, highFrom: 250 },
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

  /*
    ⚠️ **THE MOST COMPLETELY FILTERED-AWAY VOICE IN THE FILE.** `frenzy`'s figure never leaves the
    tritone, so at octave 2 it spells **247–349 Hz and nothing else** — and it was cut at
    `highFrom: 1200`, between the third and the fourth partial of every note it plays. There was no
    fundamental in this layer at any point in the fight, which is why it measured 32.6 dB under the
    place's loudest against 21 dB for the same layer in the four places that do not re-voice it, and
    wanted **7.6×**. 180 Hz clears the lowest note by half an octave.

    ⚠️ **AND ITS NOTES WERE 16 ms AND 10 ms**, on the same 100 ms sixteenth grid `arp` runs — `0.5` at
    `curve: 2.6` is 77 ms and `0.38` at `curve: 3.4` is 45 ms. **No gain was touched here at all**:
    7.63 → 2.45 is the filter and the envelope, and nothing else.
  */
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
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.5, gain: 0.085, attack: 0.001, curve: 2.6, highFrom: 180 },
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
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.38, gain: 0.05, attack: 0.001, curve: 3.4 },
    },
  ],

  /*
    ⚠️ **THE ONE OF THE FOUR WITH NO FILTER FAULT AND NO GAIN FAULT — IT HAD A HOLE IN IT.** Both
    voices sound on alternate beats and both decayed inside one, so a layer described as *a gale*
    was **silent for half of the fight**: `BEAT_SECONDS * 1.05` at `curve: 1.5` is 280 ms of a 800 ms
    gap between soundings. Wind does not stop and start on the beat. Taken to `2.05` at `curve: 1.35`
    the notes overlap the ones after them and the scream is continuous, which is +5 dB of duty cycle
    at **no change to either gain** and takes it 4.4× → 2.5×.

    ⚠️ **THAT IS THE THIRD DISTINCT FAULT UNDER ONE REPORT**, and worth naming as such: `arp` was a
    filter over an envelope, `hook` was mostly the arrangement, and this is a rest nobody wrote. A
    single "these layers are too quiet" verdict does not decompose, which is
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`'s *three layers, three different defects*
    happening again in the same place.
  */
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
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.05, gain: 0.07, attack: 0.14, curve: 1.35, lowFrom: 2400, lowTo: 900, q: 2.8, drive: 0.7 },
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
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 2.1, gain: 0.04, attack: 0.16, curve: 1.3, lowFrom: 4200, lowTo: 1800, q: 2.4, drive: 0.6 },
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
