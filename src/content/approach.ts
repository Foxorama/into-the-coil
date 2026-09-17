/**
 * THE APPROACH'S ONE OWN LAYER — the maracas the serpent's fight rattles with.
 *
 * `docs/decisions/0325-the-fight-sounds-like-the-fight.md`.
 *
 * ── WHAT WAS ASKED FOR ──────────────────────────────────────────────────────────────────────────
 *
 * > *"additional thing for the boss music for this level is that we need to work some maraca's into
 * > the boss music for that rattlesnake effect type, it should be subtle but interwoven into the boss
 * > music"*
 *
 * ⚠️ **LEVEL ONE HAS PLAYED THE BASE COMPOSITION UNMIXED SINCE 0107, AND THIS IS THE FIRST THING IT
 * OWNS.** `src/content/themes.ts` calls it *"the theme that changes nothing, so that the six below
 * are read against something rather than against each other"* — so a file here is a real change to
 * what that sentence means, and it is deliberately **one slot at two rungs** rather than a place's
 * own piece. Every other layer of level one is still the base composition, note for note.
 *
 * ⚠️ **AN `ownA` AND NOT A RE-VOICED `perc`** — `docs/decisions/0188-a-place-owns-four-slots.md`. The
 * ask is *the boss music for this level*, and `perc` is open at every rung from `run`, so a rattle
 * written into it would play through the whole level and answer a different request. An own slot is
 * the one thing in the game that can be opened at `boss` and nowhere else.
 *
 * ⚠️ **THE ANIMAL IS WHY IT IS MARACAS AND NOT A SHAKER LOOP.** Jörmungandr is the serpent this game
 * is named for; a rattle is the one percussion sound that is an animal rather than an instrument, and
 * the player asked for *"that rattlesnake effect type"*. So the two voices below are a maraca — an
 * even hand keeping the offbeats — and a RATTLE, which is the same noise made coarse and let run.
 *
 * ⚠️ **SUBTLE IS A ROLE AND NOT A GAIN** — `src/content/arrangement.ts`. `OWN_ROLES` says this is a
 * `pulse` at both fight rungs: *a pulse you can pick out when you attend to it*, which is what
 * *"subtle but interwoven"* asks for, and 0164 then holds the mix to it. A layer authored quiet and
 * given no role would be a layer nothing can check — the hole 0188's own guard exists to close.
 *
 * ⚠️ **AND IT IS UNPITCHED, WHICH IS WHAT KEEPS IT OUT OF THE HARMONY'S WAY.** The fight's bed is
 * Phrygian with a tritone in it (`dread`, `frenzy`); a rattle has no note to be wrong. What it has to
 * stay clear of is the `air` the ride and the crash already own, which is why its band is stated here
 * rather than left white.
 */

import { MUSIC, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * Everything The Approach plays instead of the base composition — which is one slot, and nothing else.
 *
 * ⚠️ **ONE ENTRY, AND THAT IS THE WHOLE FILE.** Saurian Belt states twenty-one layers because it is
 * another piece (0132); this place is the base composition with one thing added to its fight, and a
 * file that grew to match the others would be changing level one without being asked to.
 */
export const APPROACH_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ── THE CHORDS, STRUCK — the base composition's own, with a faster attack ──────────────────────

    ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`, the second time this was asked.** The first
    listen: *"the chords are slightly muted in the approach, the third section kicking needs the chords
    to be a bit punchier"*, answered with a level. The next: *"approach needs the chords at 1st and 2nd
    transition to pop a bit more, it's slightly muted."* The ladder note beside the first answer named
    the next lever — *the 60–120 ms onsets* — and a chord that takes a tenth of a second to speak swells
    rather than pops. So this place plays the same notes with every slow onset brought to 12 ms; the
    title screen, which is the base composition, is untouched.
  */
  chords: MUSIC.chords.map((voice) => (voice.note.attack !== undefined && voice.note.attack > 0.03 ? { ...voice, note: { ...voice.note, attack: 0.012 } } : voice)),
  ownA: [
    /*
      ── THE HAND — a maraca on the offbeat sixteenths, four bars of it ─────────────────────────────

      ⚠️ **IT LEAVES THE DOWNBEAT ALONE.** `sub` and `engine` have the one, and a shaker that lands
      with the kick is a transient inside another transient — heard as a brighter kick rather than as
      an instrument. The pattern is the two sixteenths AFTER each beat, which is where a hand shaking
      a maraca actually arrives: the return stroke, not the throw.

      ⚠️ **THE WEIGHTS RISE ACROSS THE FOUR BARS AND THE LAST ONE IS THE LOUDEST**, because
      `docs/decisions/0102-the-music-goes-somewhere.md` found every drum in this game struck at one
      weight and named it: *"identical repetition at a fixed interval is not LIKE a metronome, it is
      the definition of one."* Four bars is the shortest span that can hold a phrase, and this one
      leans into the bar the rattle answers in.
    */
    {
      steps: [
        _, _, 0.42, 0.26, _, _, 0.5, 0.3, _, _, 0.42, 0.26, _, _, 0.56, 0.34,
        _, _, 0.44, 0.28, _, _, 0.52, 0.3, _, _, 0.44, 0.26, _, _, 0.6, 0.38,
        _, _, 0.42, 0.26, _, _, 0.5, 0.3, _, _, 0.46, 0.28, _, _, 0.58, 0.36,
        _, _, 0.46, 0.3, _, _, 0.54, 0.34, _, _, 0.48, 0.3, _, _, 0.66, 0.42,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      /*
        ⚠️ **A GRAIN AND NOT WHITE, WHICH IS THE DIFFERENCE BETWEEN A MARACA AND A HI-HAT.** The seeds
        in a gourd are countable events; white noise is a hiss. Sample-and-hold at 7.4 kHz falling to
        3.1 is the same knob the acid's bubbles and the bolt's ticks use (`src/content/cues.ts` has the
        argument) — coarse enough to be grains, fine enough that they are not ticks.

        ⚠️ **AND ITS TOP IS TAKEN OFF AT 8 kHz, BECAUSE THE RIDE AND THE CRASH OWN THE AIR HERE.**
        `scripts/weigh-fit.mjs` puts this place's `ride` at **+9.9 dB over the bed** in 5–12 kHz and
        `crash` at +8.6; a shaker left white would be a third thing in the one band that is already
        crowded, and *"interwoven"* would arrive as *"another hat"*.
      */
      note: { wave: 'noise', from: 5000, to: 2100, seconds: 0.055, gain: 0.34, attack: 0.003, curve: 6.5, lowFrom: 4200, lowTo: 1400, highFrom: 800, q: 1.3 },
    },
    /*
      ── THE RATTLE — the tail of the phrase, and the thing that is an animal ───────────────────────

      ⚠️ **A RUN OF SIXTEENTHS THAT GROWS, IN THE FOURTH BAR ONLY.** *"Subtle but interwoven"* is two
      instructions, and this is the half that answers *interwoven*: the maraca above is texture, and
      once a phrase the texture does something. Six strokes rising into the turnaround is a rattle
      being shaken harder, which is what the animal it belongs to does before it strikes.

      ⚠️ **`STABS`' OWN RULE, ONE FILE OVER**: a hit that happens every bar is a part, and a hit that
      happens once a phrase is an event. This is the second kind, and it is why the pattern is four
      bars long rather than two.
    */
    {
      steps: [
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        _, _, _, _, _, _, _, _, 0.3, 0.36, 0.44, 0.52, 0.62, 0.72, 0.84, 0.5,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      /*
        ⚠️ **COARSER AND DRIER THAN THE HAND, AND IT IS THE SAME INSTRUMENT.** 4.4 kHz down to 1.6
        makes the grains countable at speed — a rattle is heard as a RATE, which is what distinguishes
        it from a shaker at all — and the shorter length keeps six of them inside two beats without
        smearing into one wash.
      */
      note: { wave: 'noise', from: 3000, to: 1150, seconds: 0.042, gain: 0.3, attack: 0.002, curve: 7.5, lowFrom: 3200, lowTo: 1100, highFrom: 620, q: 1.8, drive: 0.22 },
    },
  ],
};
