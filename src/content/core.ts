/**
 * THE BLACK HEART'S OWN COMPOSITION — melodic death metal, played by a hole in the sky.
 *
 * `docs/decisions/0146-three-more-places-and-two-after-them.md`.
 *
 * ── WHAT WAS ASKED FOR ──────────────────────────────────────────────────────────────────────────
 *
 * > *"The last will be the black hole heart of the galaxy, so something heavy on the Scandinavian
 * > death metal side I'm thinking for that."*
 *
 * ⚠️ **THE GENRE IS THREE TECHNIQUES AND THIS SYNTHESISER CAN DO ALL THREE.** Melodic death metal is
 * not distortion — every place in this game already has drive on something. What actually identifies
 * it is:
 *
 * **1. TREMOLO PICKING.** The same note repeated on every sixteenth while the LINE moves underneath
 * it. `arp` and `frenzy` are built out of it, and nothing else in this project has ever repeated a
 * pitch that fast on purpose.
 *
 * **2. THE HARMONISED TWIN LEAD.** Two guitars playing one melody a diatonic third apart. `counter`
 * is `lead` in thirds — derived from it, not written twice — which is the single most recognisable
 * sound the genre has and costs one array.
 *
 * **3. THE PALM MUTE.** A chugging low string that is short, dead and on the beat, against a wide
 * open chord above it. `groove` is the mute; `chords` is the open.
 *
 * | the brief | the rung | the layers that carry it |
 * |---|---|---|
 * | the last thing in the sky | `run` | `drone`, `sub`, `engine`, `perc`, `chords`, `groove`, `call` |
 * | the riff | `push` | `arp`, `ride`, `hook`, `lead` |
 * | the twin lead | `surge` | `counter`, `crash`, `drive` |
 * | the horizon | `approach` | `toll`, `dread` |
 * | inside it | `boss` | `stomp`, `frenzy`, `wraith`, and the aura's two |
 *
 * ── WHY THE LAST LEVEL IS THE ONE THAT GETS THIS ────────────────────────────────────────────────
 *
 * ⚠️ **IT IS THE ONLY PLACE IN THE RUN THAT CAN SPEND EVERYTHING.** Every other place holds something
 * back so the one after it has somewhere to go — that is what
 * `docs/decisions/0107-a-level-is-a-place.md`'s ladder of seven is for. This is level seven; there is
 * nothing after it, so it opens at the density the others reach at `surge` and its fight is the
 * loudest thing the game contains.
 *
 * ⚠️ **AND THE BLACK HOLE IS THE ONE IMAGE THAT MAKES THE DRONE THE POINT.** `THEMES.core.mix` has
 * leant on `drone` since the theme table existed, for a reason nobody wrote down; here it is the
 * subject. Everything falls towards the bottom of this piece and nothing comes back out.
 *
 * ⚠️ **EVERY NOTE IS A TONE OF A NATURAL MINOR** — `docs/decisions/0099-the-cues-are-in-the-key.md`.
 * That is not a compromise for this genre either: melodic death metal is written in the natural minor
 * and the Aeolian sixth is most of what makes it *melodic* rather than merely fast.
 */

import { BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * THE PROGRESSION — sixteen bars, and it pedals on the tonic for half of them.
 *
 * ⚠️ **`Am Am F G · Am Am Dm Em · F G Am Am · Dm F Em G`.** Six of the sixteen bars are A minor and
 * they arrive in PAIRS, which is what a riff needs: two bars of one chord is a riff's home and one
 * bar of each is a progression's. The base composition changes chord every bar and Ember Nebula
 * changes every bar; this is the first place here that sits still long enough for a line to be
 * played over it rather than through it.
 *
 * ⚠️ **Hoisted, because eight voices spell the same sixteen chords**, on `src/content/nebula.ts`'s
 * terms.
 */
const ROOT: readonly number[] = [0, 0, -4, -2, 0, 0, 5, -5, -4, -2, 0, 0, 5, -4, -5, -2];
const THIRD: readonly number[] = [3, 3, 0, 2, 3, 3, 8, -2, 0, 2, 3, 3, 8, 0, -2, 2];
const FIFTH: readonly number[] = [7, 7, 3, 5, 7, 7, 12, 2, 3, 5, 7, 7, 12, 3, 2, 5];

/**
 * THE ROOT, FOLDED SO IT NEVER SITS UNDER THE DRONE — what `sub`'s held note plays.
 *
 * ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`.** Reported of the driven level: *"at 13,
 * 14, 15 seconds there's some heavy bass that just makes the speakers pulse without sound and it
 * sounds like something isn't tuned correctly."* Measured on the render, the 35–45 Hz band rises about
 * **13 dB** over its own floor in exactly the bars where `ROOT` goes below the tonic — E and F, 41 and
 * 44 Hz at octave 0 — and nowhere else. That is two faults in one note: a sustained sine at 41 Hz moves
 * a desktop speaker's cone without much sound coming out of it, and against the drone's A at 55 Hz it
 * beats at 11 to 14 Hz, which is what out of tune sounds like when there is no pitch to hear.
 *
 * ⚠️ **SO A ROOT BELOW THE TONIC GOES UP AN OCTAVE, AND ONLY IN THE HELD NOTE.** The chord is the same
 * chord — an octave is the same pitch class, and every voice that spells the progression still spells
 * it — and the floor of this place is the drone's A, which is what the place is about. The chug keeps
 * `ROOT` because a palm mute a sixteenth long is a thud rather than a tone, and the driven saw above it
 * is what a speaker actually plays.
 */
const HELD_ROOT: readonly number[] = ROOT.map((root) => (root < 0 ? root + 12 : root));

/**
 * THE HEART'S RHYTHM — four bars of sixteenths, a beat about every 1.07 seconds.
 *
 * ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`, and slower on the fifth listen.** *"Heartbeat
 * needs to be slightly slower."* It beat every two beats of the level's 150 — 0.8 s, 75 a minute. The
 * sixteenth grid cannot divide four bars into equal slower beats short of a full bar (37.5 a minute),
 * so the gaps alternate between eleven and ten sixteenths: **56 a minute on average, drifting by one
 * sixteenth**, which is what a resting heart does rather than a thing to hide. Lub, then dub a
 * sixteenth-and-a-bit later, the second pair a touch softer than the first.
 */
const HEART: readonly (number | null)[] = (() => {
  const steps: (number | null)[] = Array.from({ length: 64 }, () => _);
  [0, 11, 21, 32, 43, 53].forEach((at, i) => {
    steps[at] = i % 2 === 0 ? 1 : 0.94;
    steps[at + 2] = i % 2 === 0 ? 0.7 : 0.66;
  });
  return steps;
})();


/**
 * THE THEME — `call`'s tune, and it is the melody the whole level is a setting of.
 *
 * ⚠️ **IT IS WRITTEN TO BE HARMONISED, WHICH IS A CONSTRAINT ON THE NOTES AND NOT ON THE RHYTHM.**
 * `HARMONY` below is this line a diatonic third up; that only sounds like a twin lead if the original
 * moves mostly by step, because parallel thirds over a leap read as two separate parts. So the line
 * steps, and the one leap in it is at the top of the third phrase where it is meant to be heard.
 */
const THEME: readonly (number | null)[] = [
  12, _, 10, 12,
  15, _, 14, _,
  12, _, 10, _,
  8, _, _, _,
  12, _, 14, 15,
  17, _, 15, _,
  14, _, 12, _,
  10, _, _, _,
  15, _, 17, 19,
  20, _, 19, _,
  17, _, 15, _,
  14, _, _, _,
  12, _, 14, 15,
  17, _, 15, 14,
  12, _, 10, _,
  12, _, _, _,
];

/**
 * THE HARMONY — `THEME`, a diatonic third above it.
 *
 * ⚠️ **THE ONE THING THIS GENRE IS FOR, AND IT IS A LOOKUP RATHER THAN A TRANSPOSITION.** A third is
 * three or four semitones depending on where in the scale it starts, so `note + 4` gives an F♯ over a
 * D and a D♯ over a B — notes A minor does not contain, which `tests/themes.test.ts` refuses and
 * which would put the player's own gun out of tune with the level. The table is the seven scale
 * degrees and the step is *two degrees up*, which is what a third actually is.
 *
 * ⚠️ **DERIVED AND NOT WRITTEN TWICE**, so the two guitars cannot drift apart when one of them is
 * retuned — the same argument the progression above makes about being hoisted, and the same failure
 * this repository keeps finding in its own tables.
 */
const DEGREES: readonly number[] = [0, 2, 3, 5, 7, 8, 10];
const aThirdUp = (note: number): number => {
  const octave = Math.floor(note / 12);
  const inside = note - octave * 12;
  const degree = DEGREES.indexOf(inside);
  // Every note in this file is a scale tone, so the lookup cannot miss — but a hand editing `THEME`
  // could make it, and a silent semitone is a worse outcome than a loud one.
  if (degree < 0) throw new Error(`core: ${note} is not a tone of the key and cannot be harmonised`);
  const up = degree + 2;
  return octave * 12 + DEGREES[up % 7]! + (up >= 7 ? 12 : 0);
};
const HARMONY: readonly (number | null)[] = THEME.map((note) => (note === null ? _ : aThirdUp(note)));

/**
 * THE PIPES' LINES — `HARMONY`, held: a whole note a bar, and a half note every two beats.
 *
 * ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`, and the second pass replaced a line of their
 * own.** *"The flute music is good, but needs to be stronger and there needs to be longer notes at the
 * start and it doesn't quite mesh very well with the lead."* The pipes played sixteen bars of their own
 * over the tune, so every note agreed with the chord and hardly any agreed with the melody. **Derived
 * from `HARMONY`, they are a third above whatever the tune is on**, which is what *high harmonies*
 * means and cannot fail to mesh — and holding the note sounding at each bar or half bar is what makes
 * them long.
 *
 * ⚠️ **Every bar of `THEME` opens with a note**, so the whole-note line has no rests to fill; a half
 * bar that starts in a rest holds the note struck before it in that bar.
 */
const soundingAt = (line: readonly (number | null)[], bar: number, beat: number): number | null => {
  for (let at = beat; at >= 0; at--) {
    const note = line[bar * 4 + at];
    if (note !== null && note !== undefined) return note;
  }
  return _;
};
const HARM_WHOLE: readonly (number | null)[] = Array.from({ length: 16 }, (_u, bar) => soundingAt(HARMONY, bar, 0));
const HARM_HALF: readonly (number | null)[] = Array.from({ length: 32 }, (_u, i) =>
  soundingAt(HARMONY, Math.floor(i / 2), (i % 2) * 2),
);

/**
 * A pan pipe on `line`, one step every `1 / perBeat` beats, each note held `beats` long.
 *
 * ⚠️ **ONE INSTRUMENT, TWO LAYERS** — `ownB` holds whole notes from the opening and `hook` moves in
 * half notes from `surge` — so the voice is written once and the two lines cannot drift into two
 * different pipes. `level` scales every voice together; `attack` is the breath before the note speaks.
 *
 * ⚠️ **A PAN PIPE FROM A SYNTHESISER WITH NO VIBRATO**, built from what a pipe is: a triangle, whose
 * odd harmonics fall away fast, with its filter open for the edge asked for — *"a higher tone with a
 * bit more piercing note"*; a thin square under it for the reedy bite of a pipe blown hard; a sine for
 * body; a chiff of noise on the onset; breath under the note. Octave 3 on `HARMONY` is 880–1760 Hz.
 */
const pipeVoices = (
  line: readonly (number | null)[],
  perBeat: number,
  beats: number,
  level: number,
  attack: number,
): MusicVoice[] => [
  {
    steps: line,
    pitched: true,
    perBeat,
    octave: 3,
    note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * beats, gain: 0.17 * level, attack, curve: 0.9, lowFrom: 8000, lowTo: 5200, q: 0.8 },
  },
  {
    steps: line,
    pitched: true,
    perBeat,
    octave: 3,
    note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * beats * 0.9, gain: 0.03 * level, attack: attack * 1.3, curve: 1.2, lowFrom: 6000, lowTo: 3800, q: 0.8 },
  },
  {
    steps: line,
    pitched: true,
    perBeat,
    octave: 3,
    note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * beats, gain: 0.05 * level, attack: attack * 1.5, curve: 0.9 },
  },
  {
    // The chiff: the consonant the note is blown with.
    steps: line.map((note) => (note === null ? _ : 1)),
    pitched: false,
    perBeat,
    octave: 0,
    note: { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.05 * level, attack: 0.002, curve: 4.5, lowFrom: 11000, lowTo: 5000, highFrom: 3000 },
  },
  {
    // The breath under the held note, which is what stops a pure tone reading as a synthesiser.
    steps: line.map((note) => (note === null ? _ : 1)),
    pitched: false,
    perBeat,
    octave: 0,
    note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * beats * 0.8, gain: 0.018 * level, attack: attack * 3, curve: 1.3, lowFrom: 9000, lowTo: 6000, highFrom: 3500, q: 0.6 },
  },
];

/**
 * THE FINGERPICKING — a clean guitar walking each bar's chord in eighths.
 *
 * ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`.** It replaces the chug and the tremolo, which
 * were the two techniques the death-metal brief was built on. The fourth listen: *"I think it needs a
 * piano and guitar section at the start, or guitar at the start and then piano kicks in as well
 * around the 42 sec mark."* Root, fifth, the octave, the third above it — the pattern every
 * fingerpicked ballad walks — with the order turning on alternate bars so two bars of one chord are not
 * the same bar twice. **165 to 880 Hz**, which is the gap between the heart and the pipes that the same
 * listen asked something to bridge.
 */
const PICKING: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return bar % 2 === 0
    ? [root, fifth, root + 12, third + 12, fifth + 12, third + 12, root + 12, fifth]
    : [root, fifth, third + 12, root + 12, fifth, third + 12, root + 12, fifth];
});

/**
 * THE PIANO — a held chord on the first and third beat of every bar.
 *
 * ⚠️ **0331, and chordal on purpose rather than a second arpeggio.** The guitar already moves in
 * eighths; a piano doing the same would be two instruments saying one thing. So it plays blocks the
 * guitar walks through: the bass on the beat, the third and fifth over it, the second chord of the bar
 * softer and inverted so the top note moves.
 */
const PIANO_BASS: readonly (number | null)[] = ROOT.flatMap((root, bar) => [root, FIFTH[bar]! - 12]);
const PIANO_LOW: readonly (number | null)[] = THIRD.flatMap((third) => [third, third]);
const PIANO_HIGH: readonly (number | null)[] = ROOT.flatMap((root, bar) => [FIFTH[bar]!, root + 12]);


/**
 * Everything The Black Heart plays instead of the base composition.
 *
 * ⚠️ **TWENTY-ONE OF THE TWENTY-THREE, and the two left out are `bass` and `beat`**, which
 * `docs/decisions/0095-the-level-has-its-own-music.md` closes everywhere except the title.
 */
export const CORE_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ── THE HOLE: the lowest sustained thing in the game, and a ring around it ───────────────────────

    ⚠️ **THE DRONE IS THE SUBJECT HERE AND EVERYWHERE ELSE IT IS THE FLOOR.** `THEMES.core.mix` has
    leant on this layer since the theme table was written; what this composition adds is a reason —
    the place is an object that everything falls into, and the only way a piece of music can say that
    is to have something at the bottom of it that never resolves and never stops.
  */
  drone: [
    /*
      ⚠️ **THE 55 Hz SINE IS A QUARTER OF WHAT IT WAS, AND ITS BODY MOVED UP AN OCTAVE** — 0331.
      *"This new version has the basic subsonic beat right from the start, I feel the speakers vibrate
      in my earbuds, but there's no actual music."* Measured on the render, the first minute carried 5–6
      dB more energy under 60 Hz than between 200 Hz and 5 kHz, and **64–70% of what sat under 45 Hz
      was this sine** — swelling once a bar, at a pitch earbuds reproduce as pressure rather than note.
      The desk had driven the drone to nearly three times its old level, which is what made it the
      opening. The weight stays, quietly; what an earbud can play is the octave above it.
    */
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.07, attack: 0.4, curve: 0.86 },
    },
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.18, attack: 0.5, curve: 0.86 },
    },
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.14, attack: 0.5, curve: 0.9, lowFrom: 300, lowTo: 200, q: 1.5, drive: 0.2 },
    },
    {
      steps: [7, 7],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.09, attack: 0.62, curve: 0.9, lowFrom: 290, lowTo: 195, q: 1.6 },
    },
    {
      // The accretion disc: broadband, very slow, and it is the only thing in the piece that is
      // brighter at its end than at its start.
      steps: [1, 1],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.06, attack: 1.25, curve: 1.2, lowFrom: 600, lowTo: 2600, highFrom: 200, q: 0.7 },
    },
  ],

  /*
    ── THE BOTTOM: a double kick, and the mass it is played on ─────────────────────────────────────

    ⚠️ **`sub` IS WHERE THIS PLACE PUTS EVERYTHING BELOW 130 Hz** — `tests/themes.test.ts` refuses a
    low-heavy layer at any pan but centre.
  */
  sub: [
    {
      steps: HELD_ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.15, gain: 0.32, attack: 0.1, curve: 0.95 },
    },
    {
      /*
        THE DOUBLE KICK. Two feet: a pair of sixteenths under every beat, with the fourth bar of each
        phrase filling in. It is the one drum figure in this game that is genuinely a technique rather
        than a pattern, and it is what makes the bottom of this place feel like it is being driven
        rather than laid down.

        ⚠️ **AND IT WAS A SECOND HEARTBEAT, AT 150 A MINUTE, SO IT PLAYS THE HEART'S NOW** — 0331's sixth
        listen: *"the boss music part needs the slightly slower heartbeat though as it's now out of sync
        with the music level heartbeat."* A hit and a softer hit a sixteenth later, on every beat, is a
        lub-dub; under a heart beating 56 a minute it read as the same heart running at three times the
        speed. `sub` sounds only in the fight here, so this kick now lands on `HEART`'s own beats and the
        fight's heaviest low pulse IS the heart. The blast beat above it keeps the fight fast. The sweep
        stops at 45 Hz rather than 30, for the same reason the heart's does.
      */
      steps: [...HEART, ...HEART, ...HEART, ...HEART],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 120, to: 45, seconds: 0.34, gain: 0.38, attack: 0.001, curve: 2.4, drive: 0.34 },
    },
    {
      // The mass: the fifth under the root, held, so the bottom is a chord and not a pedal.
      steps: FIFTH.flatMap((fifth) => [fifth, _, _, _]),
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.86, 0.9, 0.82],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 3.4, gain: 0.28, attack: 0.16, curve: 1.1 },
    },
  ],

  /*
    ── THE KIT ──────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **A SNARE ON EVERY OFFBEAT AND A CRASH-RIDE OVER IT.** The genre's opening tempo feel is the
    *d-beat*: the snare answers the kick eight times a bar rather than twice, so the pulse is double
    what the harmony's rate says it is. It costs nothing here — the tempo is fixed at 150 BPM by
    `docs/decisions/0093-the-gun-is-on-the-grid.md` — and it is why this place opens at a density the
    others reach two rungs in.
  */
  engine: [
    {
      // The snare, on every offbeat eighth. Bright, cracking and short.
      steps: [
        _, 0.94, _, 0.72, _, 0.9, _, 0.76, _, 0.96, _, 0.74, _, 0.92, _, 0.8,
        _, 0.94, _, 0.74, _, 0.92, _, 0.72, _, 1, _, 0.78, _, 0.94, 0.8, 0.86,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.13, gain: 0.088, attack: 0.0008, curve: 4.4, lowFrom: 6200, lowTo: 1800, highFrom: 900 },
    },
    {
      // The body under the snare — the drum, rather than the wires. Without it the layer is a hiss.
      steps: [
        _, 0.86, _, 0.66, _, 0.82, _, 0.7, _, 0.88, _, 0.68, _, 0.84, _, 0.74,
        _, 0.86, _, 0.68, _, 0.84, _, 0.66, _, 0.92, _, 0.72, _, 0.86, 0.74, 0.8,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 210, to: 132, seconds: 0.2, gain: 0.58, attack: 0.001, curve: 5, drive: 0.3 },
    },
    {
      // The ride, on sixteenths, played on the bell so it cuts. Nothing in this place is quiet.
      steps: [
        0.6, 0.28, 0.42, 0.3, 0.52, 0.28, 0.4, 0.3, 0.62, 0.28, 0.42, 0.3, 0.5, 0.3, 0.4, 0.32,
        0.6, 0.28, 0.42, 0.32, 0.52, 0.3, 0.4, 0.28, 0.62, 0.3, 0.42, 0.32, 0.5, 0.32, 0.42, 0.36,
        0.6, 0.28, 0.44, 0.3, 0.52, 0.28, 0.42, 0.3, 0.62, 0.28, 0.42, 0.32, 0.5, 0.3, 0.4, 0.32,
        0.62, 0.3, 0.44, 0.32, 0.54, 0.3, 0.42, 0.32, 0.64, 0.32, 0.46, 0.34, 0.54, 0.36, 0.48, 0.44,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.045, gain: 0.036, attack: 0.0005, curve: 6, lowFrom: 12000, highFrom: 5200 },
    },
    /*
      ⚠️ **A CHINA STOOD HERE, ONCE EVERY FOUR BARS, AND IT IS GONE** —
      `docs/decisions/0331-the-heart-beats-under-it.md`. The first listen asked for *"the cymbal crash
      louder and more prominent"* in the opening, and it was moved to a slot of its own and raised; the
      second listen, having heard it: *"the cymbal crash needs to be removed."* The `crash` layer is
      closed at every rung in `THEMES.core.ladder` for the same sentence, so no cymbal of either kind is
      left in this place.
    */
  ],

  /*
    ── THE SMALL METAL ─────────────────────────────────────────────────────────────────────────────

    ⚠️ **`perc` sits at −0.45 and therefore may not be low** — `tests/themes.test.ts`. What lives up
    there in this genre is the hi-hat, the rim and the bell of the ride, so the constraint costs
    nothing at all here.
  */
  perc: [
    {
      // A closed hat under everything, sixteenths, tight.
      steps: [
        0.46, 0.26, 0.36, 0.28, 0.42, 0.26, 0.34, 0.28, 0.48, 0.26, 0.36, 0.28, 0.4, 0.28, 0.34, 0.3,
        0.46, 0.26, 0.36, 0.3, 0.42, 0.28, 0.34, 0.26, 0.48, 0.28, 0.36, 0.3, 0.4, 0.3, 0.36, 0.32,
        0.46, 0.26, 0.38, 0.28, 0.42, 0.26, 0.36, 0.28, 0.48, 0.26, 0.36, 0.3, 0.4, 0.28, 0.34, 0.3,
        0.48, 0.28, 0.38, 0.3, 0.44, 0.28, 0.36, 0.3, 0.5, 0.3, 0.4, 0.32, 0.44, 0.34, 0.42, 0.4,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.026, gain: 0.065, attack: 0.0004, curve: 8.5, lowFrom: 13000, highFrom: 6800 },
    },
    {
      // The rim, on a figure that crosses the bar rather than sitting in it.
      steps: [
        1, _, _, 0.7, _, _, 0.82, _, _, 0.66, _, _, 0.9, _, 0.62, _,
        _, _, 0.86, _, _, 0.68, _, _, 0.94, _, _, 0.64, _, 0.72, _, 0.7,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'tri', from: 2200, to: 1700, seconds: 0.05, gain: 0.1, attack: 0.0006, curve: 7, highFrom: 1000 },
    },
    {
      /*
        THE TOM. 196 Hz falling to 112 — the low-mid a place made of cymbals and snare wires would
        otherwise have nothing in, which `src/content/nebula.ts` found by measurement after the fact
        and every place since has taken before it.
      */
      steps: [1, _, 0.62, _, 0.72, _, _, 0.66, 0.88, _, 0.6, _, 0.74, _, 0.64, 0.66],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 196, to: 112, seconds: 0.2, gain: 0.3, attack: 0.001, curve: 4.2, drive: 0.24 },
    },
    /*
      ⚠️ **THE BELL OF THE RIDE STOOD HERE AND WAS THE SEAGULL** — 0331. *"The 'seagull' percussion
      noise doesn't fit."* It was the one pitched thing in the kit: a triangle falling 3200 → 2600 Hz
      over a fifth of a second, struck four times a phrase off the beat — which is the shape of a gull's
      cry more than of a bell. Every other pitched glide in this place is under 220 Hz.
    */
  ],

  /*
    ── THE WALL: power chords, and the pad that makes them a place rather than a guitar ─────────────

    ⚠️ **NO THIRD IN THE STACK, WHICH IS WHY IT SOUNDS ENORMOUS RATHER THAN SAD.** A distorted third
    is the one interval that turns to mud — the harmonics of the two notes beat against each other —
    and the genre's answer, for forty years, has been to leave it out of the guitars and put it in the
    melody. The third is on `THIRD` up in `arp` and `lead`, and never down here.
  */
  chords: [
    /*
      ⚠️ **THE POWER CHORDS STOOD HERE, AND A MELANCHOLY PAD HAS ITS THIRD** — 0331. A power chord is a
      root and a fifth with the third left out on purpose, which is what makes it neither major nor
      minor and why it drives. *"A somber melancholic song"* is the minor third being heard, so the pad
      below plays the whole triad, held, and nothing in this layer is struck any more.
    */
    {
      steps: THIRD,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.15, attack: 0.5, curve: 1, lowFrom: 1400, lowTo: 900, q: 0.8 },
    },
    {
      // The pad behind the wall: held, slow, and it is the only thing in the level that is not being
      // played by a person. A black hole has no hands.
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.09, attack: 0.55, curve: 1.2, lowFrom: 700, lowTo: 460, q: 1.3 },
    },
    {
      steps: FIFTH,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.06, attack: 0.7, curve: 1.2, lowFrom: 660, lowTo: 430, q: 1.4 },
    },
    {
      // The bottom of the wall, at 220 Hz — `chords` sits at +0.2 and may not carry its weight under
      // 130, and `MUSIC_ROOT` is 55, so octave 0 and octave 1 are both under it. `sub`, `groove` and
      // `drone` are the three centred layers that hold this places deep.
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.2, attack: 0.3, curve: 1.1, lowFrom: 1300, lowTo: 860, q: 0.9 },
    },
  ],

  /*
    ── THE PIANO: from 42 s, the middle of the sound ─────────────────────────────────────────────────

    ⚠️ **0331's fourth listen**: *"we also need a mid-range tone kick in around the 42s mark"*, and *"we
    need something interwoven with the pipe and higher melodies to bridge the heartbeat and pipes."*
    The chug stood in this slot; it is sixteen bars and centred, which a piano's bass wants. A piano out
    of a synthesiser is a hammer and a string that darkens as it rings: a saw whose lowpass closes over
    the note, a sine under it for the body, and a short knock on the bass note. Never driven.
  */
  groove: [
    /*
      ⚠️ **THE LEFT HAND IS AN OCTAVE UP, OUT OF THE HEART'S WAY** — 0331's fifth listen: *"we lose the
      heartbeat sound now around the 45 sec transition."* At octave 1 the piano's bass sat at 62–147 Hz,
      exactly where the heart's thump is heard, and arrived at 42 s. At octave 2 it is 124–294 Hz, still
      under the chords, and the body sine under it is half what it was.
    */
    {
      steps: PIANO_BASS,
      pitched: true,
      perBeat: 0.5,
      octave: 2,
      accents: [1, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.9, gain: 0.1, attack: 0.002, curve: 2.4, lowFrom: 2200, lowTo: 500, q: 0.8 },
    },
    {
      steps: PIANO_BASS,
      pitched: true,
      perBeat: 0.5,
      octave: 2,
      accents: [1, 0.74],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.9, gain: 0.06, attack: 0.002, curve: 2 },
    },
    {
      steps: PIANO_LOW,
      pitched: true,
      perBeat: 0.5,
      octave: 2,
      accents: [1, 0.7],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.07, attack: 0.002, curve: 2.6, lowFrom: 3200, lowTo: 800, q: 0.8 },
    },
    {
      steps: PIANO_LOW,
      pitched: true,
      perBeat: 0.5,
      octave: 2,
      accents: [1, 0.7],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.07, attack: 0.002, curve: 2.2 },
    },
    {
      steps: PIANO_HIGH,
      pitched: true,
      perBeat: 0.5,
      octave: 2,
      accents: [1, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.06, attack: 0.002, curve: 2.8, lowFrom: 4000, lowTo: 1000, q: 0.8 },
    },
    {
      steps: PIANO_HIGH,
      pitched: true,
      perBeat: 0.5,
      octave: 2,
      accents: [1, 0.72],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.06, attack: 0.002, curve: 2.4 },
    },
    {
      // The hammer: a short muffled knock on the bass note, which is what makes it a struck string.
      steps: PIANO_BASS.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 0.5,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.03, attack: 0.001, curve: 6, lowFrom: 2400, lowTo: 900, highFrom: 300 },
    },
  ],

  /*
    ── THE THEME: the tune, played clean, and it is the only thing here that is not distorted ──────
  */
  call: [
    {
      steps: THEME,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.76, 0.9, 0.74],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.3, gain: 0.125, attack: 0.01, curve: 1.9, lowFrom: 2600, lowTo: 1400, q: 1.3 },
    },
    {
      steps: THEME,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.76, 0.9, 0.74],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.075, attack: 0.02, curve: 1.6 },
    },
    {
      // The pick on the string: a click before every note, which is what makes it an instrument
      // somebody is holding.
      steps: THEME.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.018, gain: 0.05, attack: 0.0004, curve: 9, lowFrom: 9000, highFrom: 3400 },
    },
  ],

  /*
    ── THE RIFF: what `push` opens, and it is the same chug an octave up with the third in it ──────

    ⚠️ **THIS IS THE PLACE'S IDENTITY AND ONLY A DRONE, AN AURA AND THE RIDE MEASURED BELOW IT.** The
    header above names `push` *the riff* and `surge` *the twin lead*; `heardAt` had it at **−34.8
    dBFS rms / −18.5 peak at `surge`, 12.0 dB under the rest of its own band**, and
    `docs/decisions/0154-the-mix-is-authored-as-intent.md`'s solve asked for **6.0× gain** to make it
    the part it is authored as. A gain that large is the measurement saying the material is wrong, not
    that the fader is.

    ⚠️ **THE RIFF IS THE OPEN STRING AND `groove` IS THE MUTED ONE, AND BOTH WERE WRITTEN DEAD.** The
    palm mute two layers up rings 32 ms of a 100 ms sixteenth, which is exactly right and is what a
    palm mute *is*; this rang 57 ms of a 200 ms eighth — a 29% duty cycle on the one figure in the
    piece that is supposed to sustain. The contrast the header describes, *a chugging low string
    against a wide open chord above it*, needs the open one to be open. At 0.248 s under `curve: 1.35`
    each note is still at a third when the next arrives, so the riff's own rests fill with ring the
    way a distorted guitar's do, and the accents keep the articulation.

    ⚠️ **THE ENVELOPE CARRIES 5.1 dB OF IT AND THE GAIN 2.7, WHICH IS THE ORDER THE CEILING FORCES.**
    `scripts/weigh-mix.mjs` had this place at 93% of the clipping ceiling at `surge` and has it at 96%
    now; decay length is the one lever that raises what a layer puts out without touching what it
    peaks at, and there was a 3.2× of it available here. `lowTo` rises with the length for the reason
    `arp` states. Out of it: **−27.1 rms / −13.6 peak at `surge`, `margin` −12.0 → −4.1**, and the
    solve asks 2.12× there and 2.62× at `push` where it asked 6.01.
  */
  /*
    ── THE PIPES: what `surge` lifts into, and the riff is gone from this slot ────────────────────

    ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`.** Asked for at the second boundary: *"I
    want the music to kick into more of a higher pitch with the heart beat still going as the core. The
    melody needs to shift and change… maybe even going into a flute, or mouth pipes… something that's
    higher and lifting and distinctly different from the first 1 min, but that complements the
    heartbeat."* **The riff this slot held was whispered to 0.17 at `push` by the drive and was the part
    at `surge`**, so the slot was already the surge's and nothing before it needs the material.

    ⚠️ **A PAN PIPE OUT OF A SYNTHESISER WITH NO VIBRATO, SO IT IS BUILT FROM WHAT A PIPE IS.** A
    stopped pipe is nearly a sine with its odd harmonics faint, a quick breathy onset and air in the
    tone. So: a triangle — odd harmonics only, falling as 1/n² — softened by a lowpass, with a sine on
    the same note for body; a *chiff* of filtered noise on every onset, which is the consonant a player
    blows the note with; and a quieter breath under every held note. The room is `air.hook` on the
    place's row, and it is what makes one line of notes sound like it is being played somewhere.

    ⚠️ **A5 TO C7 NOW, TWO OCTAVES ABOVE THE TUNE, AND WITH AN EDGE.** The first pass sat at 440–1047
    Hz, and the second listen asked for more: *"the pipes need to be a higher tone with a bit more
    piercing note to them."* So an octave up — 880–2093 Hz, the register a piccolo and a high pan pipe
    share — the triangle's filter opened so its upper partials come through, the sine body halved so
    the tone is less round, a quiet square under the held notes for the reedy bite a stopped pipe has
    when it is blown hard, and a brighter chiff.

    ⚠️ **AND THEN THE BRIEF MOVED, AND THE PIPES STOPPED PLAYING A LINE OF THEIR OWN.** Second listen:
    *"the flute music is good, but needs to be stronger and there needs to be longer notes at the start
    and it doesn't quite mesh very well with the lead"*, and then the whole shape: *"a somber
    melancholic song with high harmonies, low deep heartbeat and a rising crescendo as we get to the end
    of the surge, that then tapers off very slightly as it leads into the boss music."* The pipes are
    the high harmonies now — `HARM_HALF`, a third above the tune and held — and `ownB` below carries
    the same pipe in whole notes from the opening, so they arrive long before they lead.
  */
  hook: pipeVoices(HARM_HALF, 0.5, 2.3, 1, 0.04),

  /*
    ── THE PIPES, HELD: a whole note a bar, from the opening ───────────────────────────────────────

    ⚠️ **0331.** *"We need to fit in some pipes earlier in the piece… so that they don't just suddenly
    start for no reason"*, and *"longer notes at the start."* One note a bar, the third above the bar's
    first tune note, blown slowly. Faint at `run`, a counter-line under the tune at `push`, and a high
    pad under the moving pipes once `hook` takes over.
  */
  ownB: pipeVoices(HARM_WHOLE, 0.25, 4.4, 0.9, 0.18),

  /*
    ── THE GUITAR: fingerpicked, clean, from the first bar ─────────────────────────────────────────

    ⚠️ **0331's fourth listen.** *"The first 10 seconds feels weird… it feels like we've got the backend
    section of another song that stops and then this song starts around 10-11 seconds"*, and *"guitar at
    the start."* The tremolo stood in this slot; it is sixteen bars and panned left, which suits one
    guitar in a room. A clean plucked string: two saws a few cents apart whose lowpass closes fast after
    the pick, a triangle body, and the pick itself — each note left ringing into the next, never driven.
  */
  arp: [
    {
      steps: PICKING,
      pitched: true,
      perBeat: 2,
      octave: 2 + 6 / 1200,
      accents: [1, 0.72, 0.84, 0.7, 0.9, 0.7, 0.82, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.3, gain: 0.07, attack: 0.008, curve: 2.2, lowFrom: 3200, lowTo: 1000, q: 0.9 },
    },
    {
      steps: PICKING,
      pitched: true,
      perBeat: 2,
      octave: 2 - 6 / 1200,
      accents: [1, 0.72, 0.84, 0.7, 0.9, 0.7, 0.82, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.2, gain: 0.05, attack: 0.009, curve: 2.4, lowFrom: 3000, lowTo: 950, q: 0.9 },
    },
    {
      steps: PICKING,
      pitched: true,
      perBeat: 2,
      octave: 2,
      accents: [1, 0.72, 0.84, 0.7, 0.9, 0.7, 0.82, 0.68],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.4, gain: 0.08, attack: 0.008, curve: 2, lowFrom: 2000, lowTo: 900, q: 0.7 },
    },
    {
      // The pick — soft, because a clean guitar under a somber pad is picked with the flesh of a finger.
      steps: PICKING.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.02, gain: 0.012, attack: 0.003, curve: 6, lowFrom: 4000, highFrom: 1500 },
    },
  ],

  /*
    ── THE RIDE: the bell, hammered ────────────────────────────────────────────────────────────────
  */
  ride: [
    {
      steps: [
        0.74, 0.32, 0.48, 0.3, 0.62, 0.32, 0.44, 0.28, 0.76, 0.32, 0.46, 0.3, 0.6, 0.32, 0.46, 0.52,
        0.72, 0.3, 0.46, 0.28, 0.64, 0.32, 0.42, 0.3, 0.78, 0.32, 0.48, 0.32, 0.62, 0.34, 0.46, 0.54,
        0.74, 0.32, 0.48, 0.28, 0.62, 0.3, 0.44, 0.32, 0.76, 0.3, 0.46, 0.32, 0.6, 0.32, 0.46, 0.5,
        0.7, 0.32, 0.44, 0.3, 0.66, 0.32, 0.44, 0.28, 0.8, 0.36, 0.5, 0.34, 0.64, 0.38, 0.5, 0.58,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      /*
        ⚠️ **17 ms WAS STILL A TICK, AND THIS PLACE STATES ITS OWN.** The line this replaces is the
        base composition's, raised once by `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` from
        `curve: 8` over 0.03 s — 4 ms — to `curve: 4` over 0.07 s. Six places carry that one; The
        Black Heart now carries its own, because it is the only place whose ride is *hammered on the
        bell on every sixteenth* and it measured **−33.7 peak / −56.5 dBFS rms at `approach`** and
        **the worst `down` of any layer at every one of the five rungs that open it** — 23 to 31 dB
        under the loudest thing playing beside it.

        ⚠️ **THE ENVELOPE AND NOT THE GAIN, WHICH IS THE MISTAKE 0152 CAUGHT BEING MADE TWICE.**
        `seconds / curve` is the real length, so 0.16 s at 2.8 is **57 ms** where 0.07 at 4 was 17 —
        3.3× the energy, +5.1 dB, and **the peak does not move by a decibel**. That matters here and
        nowhere else in the file: `scripts/weigh-mix.mjs` has this place at 96% of the clipping
        ceiling at `approach`, where the ride is open, so a gain that bought the same 5.1 dB would
        have spent most of the remaining headroom on the one layer that needed it least.

        ⚠️ **AND THE GAIN STILL MOVES, BECAUSE 0140 CONVICTS ON BOTH MEASURES.** A 57 ms ring at
        −33.7 peak reads better on rms and is still a whisper on the transient a cymbal is mostly
        made of, so 0.1 → 0.125 carries about 2 dB of peak with it. At 100 ms between sixteenths the
        ring now overlaps the next stroke, which is a bell being hammered rather than a hat being
        closed; the attack and the band are untouched for 0152's reason.

        ⚠️ **AND IT IS DELIBERATELY SHORT OF WHAT THE SOLVE WOULD TAKE.** `weigh-solve` asked 3.83×
        at `surge` and now asks 1.75, because a first pass at 0.2 s / 2.4 / 0.15 answered it at 1.21
        and cost **0.5 points of the `under 300Hz` share at `push` and `approach`**, where the floor
        is 28%. Broadband noise in the widest band there is buys margin cheaply and spends the band
        balance dearly; this layer had the most room of the three to give back, so it gave it.
      */
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.16, gain: 0.125, attack: 0.0004, curve: 2.8, lowFrom: 11000, highFrom: 4800 },
    },
  ],

  /*
    ── THE LEAD: the first guitar, and `counter` is the second one ─────────────────────────────────
  */
  lead: [
    {
      steps: [
        12, _, 14, _, 15, _, 14, _,
        12, _, 10, _, 8, _, _, _,
        15, _, 17, _, 19, _, 17, _,
        15, _, 14, _, 12, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.13, attack: 0.015, curve: 1.6, lowFrom: 3400, lowTo: 1700, q: 1.6, drive: 0.36 },
    },
    {
      steps: [
        12, _, 14, _, 15, _, 14, _,
        12, _, 10, _, 8, _, _, _,
        15, _, 17, _, 19, _, 17, _,
        15, _, 14, _, 12, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.07, attack: 0.02, curve: 1.7, lowFrom: 1700, lowTo: 900, q: 1.4 },
    },
  ],

  /*
    ── THE TWIN LEAD: `surge`, and it is the whole reason this place is in this genre ──────────────

    ⚠️ **THE HARMONY IS DERIVED FROM `THEME`, NOT WRITTEN AGAINST IT.** `aThirdUp` walks the scale by
    two degrees, so a third is three semitones over some roots and four over others — which is what
    makes it sound like a second guitarist rather than like a chorus effect. `RUNG_CLOSES` takes
    `call` away in the same breath (`src/content/music.ts`), so what the ear loses is the clean
    statement of the tune and what it gains is both guitars playing it.
  */
  /*
    ⚠️ **THE TWIN GUITARS STOOD HERE AND THE SAME NOTES ARE STRINGS NOW** — 0331. The harmony is the
    same third above the tune; what changed is how it is played. Two bowed saws a few cents apart,
    slow to speak and held past the next note, no drive — the voice a somber piece harmonises in, where
    a driven twin lead is the voice a metal one does. It sits an octave under the pipes, which play the
    same line.
  */
  counter: [
    {
      steps: HARMONY,
      pitched: true,
      perBeat: 1,
      octave: 2 + 5 / 1200,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.9, gain: 0.08, attack: 0.14, curve: 0.7, lowFrom: 2400, lowTo: 1700, q: 1 },
    },
    {
      steps: HARMONY,
      pitched: true,
      perBeat: 1,
      octave: 2 - 5 / 1200,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.9, gain: 0.08, attack: 0.17, curve: 0.7, lowFrom: 2300, lowTo: 1600, q: 1 },
    },
  ],

  /*
    ── THE CRASH ────────────────────────────────────────────────────────────────────────────────────
  */
  crash: [
    {
      steps: [1, _, _, _, _, _, _, _, 0.86, _, _, _, _, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 1.2, gain: 0.16, attack: 0.001, curve: 2.6, lowFrom: 15000, lowTo: 4200, highFrom: 2200 },
    },
    {
      // The gong under it: a black hole's crash is not a cymbal, it is a mass being struck.
      steps: [0, _, _, _, _, _, _, _, -5, _, _, _, _, _, _, _],
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.6, gain: 0.15, attack: 0.02, curve: 1.3, lowFrom: 900, lowTo: 400, q: 2.2, drive: 0.4 },
    },
  ],

  /*
    ── THE DRIVE: two bars, and it is the blast the boss will take over ───────────────────────────
  */
  drive: [
    {
      /*
        ⚠️ **THIRTY-SECONDS, AND IT IS THE ANSWER TO *HIGHER TEMPO* THAT THE GRID ALLOWS** — reported
        2026-08-14: *"the rest of the level was really nice, just needed to be more intense with
        higher tempo."* `docs/decisions/0093-the-gun-is-on-the-grid.md` fixes a beat at 24 sim steps
        and the player's gun, every enemy cadence and 0094's phase-lock all ride it, so the BPM cannot
        move — what rises is the subdivision, which is 0102's finding and is what a listener calls
        faster.

        ⚠️ **THE SAME FIGURE AT TWICE THE PICKING RATE, which is what a guitarist would actually do.**
        Every note is doubled rather than the line being rewritten, so the riff is recognisably the
        one the level has been playing and the hand behind it has sped up. It arrives at `surge` and
        the fight's `stomp` is already at this rate, so the last two rungs are the fastest the game
        gets.
      */
      steps: [
        0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 5, 5, 5, 5,
        0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 7, 7, 7, 7, 5, 5, 5, 5, 3, 3, 3, 3,
      ],
      pitched: true,
      perBeat: 8,
      octave: 1,
      accents: [1, 0.62, 0.84, 0.6],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.16, gain: 0.07, attack: 0.002, curve: 4.6, lowFrom: 2400, lowTo: 1100, q: 1.8, drive: 0.44 },
    },
    {
      // The mass under it, on every other beat — 0331: a thud on the beat with a softer one an eighth
      // after it was a third lub-dub at 150 a minute, against the heart's 56.
      steps: [1, _, _, _, 0.88, _, _, _, 1, _, _, _, 0.86, _, _, _],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 148, to: 50, seconds: 0.34, gain: 0.66, attack: 0.001, curve: 3.2, drive: 0.28 },
    },
  ],

  /*
    ── THE HORIZON: a funeral bell, and the interval under it ──────────────────────────────────────

    ⚠️ **`toll` SITS AT −0.5 AND MAY NOT BE LOW**, so this bell is voiced as its partials — the strike
    note high, the hum quiet, and a great deal of metal in between. `src/content/nebula.ts` learned it
    from a first cathedral bell that was 49% under 130 Hz and passed every guard in the repository.
  */
  toll: [
    {
      steps: [0, _, -5, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.9, gain: 0.32, attack: 0.006, curve: 1.25, lowFrom: 1600, lowTo: 860, q: 1.8 },
    },
    {
      steps: [3, _, -2, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.5, gain: 0.15, attack: 0.02, curve: 1.7 },
    },
    {
      steps: [7, _, 2, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.07, attack: 0.5, curve: 1.2, lowFrom: 1800, lowTo: 4200, q: 1.4 },
    },
    {
      steps: [1, _, 0.86, _],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.11, attack: 1, curve: 1.3, lowFrom: 800, lowTo: 3400, highFrom: 340, q: 0.8 },
    },
  ],

  /*
    ── THE DREAD: the tritone, held, and it is the last thing before the fight ─────────────────────
  */
  dread: [
    {
      steps: [2, 8, 2, 8],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.92, 0.98, 1],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.11, attack: 0.5, curve: 1.05, lowFrom: 300, lowTo: 800, q: 2.6 },
    },
    {
      steps: [8, 2, 8, 2],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.3, attack: 0.46, curve: 1 },
    },
  ],

  /*
    ── INSIDE IT ────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **THE LOUDEST FIGHT IN THE GAME, AND IT IS THE LAST ONE ON PURPOSE.** A blast beat, tremolo at
    double speed and a voice that is not a voice — `LEVEL_ONLY` closes the wall, the chug, the picking,
    the riff and the clean lead all at once (`src/content/music.ts`), and what replaces them is faster
    than any of them.
  */
  stomp: [
    {
      /*
        THE BLAST BEAT. Kick and snare alternating on thirty-seconds is the real technique and it is
        not available here — the kick lives in `sub` and this is one layer — so what this plays is the
        SNARE half at thirty-seconds and lets `sub`'s double kick underneath be the other. Between them
        the fight is at twice the rate of anything before it.
      */
      steps: [
        1, 0.42, 0.66, 0.44, 0.9, 0.42, 0.64, 0.46, 0.96, 0.42, 0.66, 0.44, 0.88, 0.46, 0.66, 0.5,
        1, 0.42, 0.66, 0.46, 0.9, 0.44, 0.64, 0.42, 0.96, 0.44, 0.68, 0.46, 0.88, 0.48, 0.68, 0.54,
        1, 0.42, 0.68, 0.44, 0.9, 0.42, 0.66, 0.44, 0.96, 0.42, 0.66, 0.46, 0.88, 0.46, 0.66, 0.5,
        1, 0.44, 0.68, 0.46, 0.92, 0.44, 0.66, 0.46, 0.98, 0.46, 0.7, 0.48, 0.92, 0.52, 0.74, 0.62,
      ],
      pitched: false,
      perBeat: 8,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.035, gain: 0.085, attack: 0.0005, curve: 6.5, lowFrom: 7600, lowTo: 2600, highFrom: 1100 },
    },
    /*
      ⚠️ **THE HEART STOOD HERE, AND IT IS `ownA` NOW** — `docs/decisions/0331-the-heart-beats-under-it.md`.
      A layer has one fader, so while the heart lived in `stomp` it could only rise and fall with the
      blast beat — and the ask is a heart that is faint for the opening, arrives with `push`, and
      climbs through every section after, while the blast beat does what it was driven to do.
    */
    {
      steps: [
        0.4, _, 0.32, _, 0.36, _, 0.3, _, 0.4, _, 0.32, _, 0.36, _, 0.32, 0.34,
        0.4, _, 0.32, _, 0.38, _, 0.3, _, 0.42, _, 0.34, _, 0.38, _, 0.34, 0.36,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.022, gain: 0.05, attack: 0.0004, curve: 8.5, lowFrom: 14000, highFrom: 7200 },
    },
  ],

  /*
    ── THE HEART: the thing the level is named after, and the backing for all four sections ───────

    ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`.** Asked for, of the driven level: *"I want
    the heartbeat to be clearly heard, but to be the background backing for the track… fainter for the
    first 25 seconds, then kick in where it does, then get slightly louder throughout the following
    sections… That heart beat and its pacing is the very core of what makes this the sound track for
    the 'black heart' level."* It was the second voice of `stomp`, which is one fader shared with the
    blast beat; an own slot is the one layer that can climb on a curve of its own — 0188's mechanism,
    and the first time a place has opened one in every rung.

    ⚠️ **THE VOICE IS MOVED, NOT REWRITTEN.** 2026-08-14 asked for *"a pulsing heartbeat rhythm for the
    boss if we're calling the level the black heart"*, and this is that figure note for note: two
    thumps and a gap, the second softer and closer, because that is what a heart does and why it reads
    as a body rather than as a drum. **What was liked is left alone**; the ladder is what changes.

    ⚠️ **FOUR BARS, WRITTEN OUT TWICE, BECAUSE A PATTERN SHORTER THAN ITS LAYER DOES NOT REPEAT.**
    `layerNotes` in `src/app/music.ts` renders `steps` once and stops; the figure was two bars in
    `stomp`'s two-bar loop and an own slot is four. Copied with the pickup on the last sixteenth of
    each pair, so the loop point and the half-way point breathe the same way.

    ⚠️ **THE FIRST PASS KEPT ITS 96 → 24 Hz SWEEP ON THE ARGUMENT THAT A THUMP SPENDS ITS ENERGY HIGH,
    AND THE EAR SAID OTHERWISE.** Turned up through the fight, it made 84% of that rung's energy under
    45 Hz and was reported as *"speaker distortion… most noticeable 2.10 onwards"*. The figure and the
    envelope are untouched; only the sweep's floor moved — see the voice.
  */
  ownA: [
    {
      steps: HEART,
      pitched: false,
      perBeat: 4,
      octave: 0,
      /*
        ⚠️ **110 → 48 Hz, WHERE IT WAS 96 → 24** — 0331's second listen: *"there's still speaker
        distortion noise, most noticeable 2.10 onwards."* The fight is where this heart is loudest, and
        measured there it made **84% of everything under 45 Hz** in the rung. The new floor takes 8.7 dB
        off that band and leaves 45–150 Hz, where a thump is actually heard, where it was.

        ⚠️ **AND BACK DOWN TO 100 → 40, LONGER AND FULLER, ON THE FIFTH** — *"just a bit deeper at the
        start… it's not deep enough now so it might just be my headphones causing drama there."* The
        listener's own playback was part of the earlier report. 40 Hz keeps the floor clear of the 24
        that was measured doing the damage, and the upper body and knock below it are quieter, since
        they were what made the heart read as a knock rather than a chest.
      */
      note: { wave: 'sine', from: 100, to: 40, seconds: 0.6, gain: 0.5, attack: 0.002, curve: 2, drive: 0.4 },
    },
    /*
      ⚠️ **AND WHAT AN EARBUD CAN HEAR OF IT** — 0331's third listen: *"then the speaker bit kicks in
      around 1:55 again."* From the `approach` on the heart is the largest thing under 45 Hz, and a
      sine that falls to 48 Hz is felt on a small driver rather than heard. A heart through a chest is
      heard as its upper body and its knock, so both are here — the same beats, an octave up and short,
      and a muffled thud — and the low sine stays for a speaker that can play it.
    */
    {
      steps: HEART,
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 220, to: 100, seconds: 0.24, gain: 0.1, attack: 0.002, curve: 3, drive: 0.3 },
    },
    {
      steps: HEART,
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.05, attack: 0.001, curve: 5, lowFrom: 900, lowTo: 400, highFrom: 120 },
    },
  ],

  frenzy: [
    {
      /*
        THE TREMOLO, AT THE FIGHT'S OWN SPEED. Two repetitions per note instead of four, so the LINE
        moves twice as fast while the picking rate is unchanged — which is exactly what the genre does
        going into a chorus, and is a real escalation rather than a louder one. Eight bars, so the
        figure is longer than the four-bar phrase the listener has been counting in.
      */
      steps: [
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 5, 5, 3, 3,
        8, 8, 7, 7, 8, 8, 7, 7, 3, 3, 2, 2, 3, 3, 2, 2,
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 7, 7, 5, 5,
        8, 8, 7, 7, 5, 5, 3, 3, 2, 2, 3, 3, 5, 5, 7, 7,
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 5, 5, 3, 3,
        10, 10, 8, 8, 7, 7, 8, 8, 5, 5, 3, 3, 2, 2, 3, 3,
        0, 0, 2, 2, 3, 3, 5, 5, 7, 7, 8, 8, 7, 7, 5, 5,
        3, 3, 2, 2, 3, 3, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2,
      ],
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.64, 0.86, 0.62],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.18, gain: 0.27, attack: 0.002, curve: 4.4, lowFrom: 2600, lowTo: 1000, q: 2, drive: 0.55 },
    },
    {
      // The octave over it, thinner and brighter, which is how two guitars playing one riff sound.
      steps: [
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 5, 5, 3, 3,
        8, 8, 7, 7, 8, 8, 7, 7, 3, 3, 2, 2, 3, 3, 2, 2,
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 7, 7, 5, 5,
        8, 8, 7, 7, 5, 5, 3, 3, 2, 2, 3, 3, 5, 5, 7, 7,
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 5, 5, 3, 3,
        10, 10, 8, 8, 7, 7, 8, 8, 5, 5, 3, 3, 2, 2, 3, 3,
        0, 0, 2, 2, 3, 3, 5, 5, 7, 7, 8, 8, 7, 7, 5, 5,
        3, 3, 2, 2, 3, 3, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.62, 0.84, 0.6],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.15, gain: 0.15, attack: 0.002, curve: 5, lowFrom: 5200, lowTo: 2400, q: 1.6, drive: 0.4 },
    },
  ],

  wraith: [
    {
      /*
        THE VOICE. Held notes a minor second apart — E against F, then B against C — driven until the
        tone comes apart, which is the same construction Ember Nebula's screaming choir uses and is
        here because a growl and a scream fail identically: the fundamental survives and everything
        above it turns to noise.

        ⚠️ **IT IS AN OCTAVE LOWER THAN EVERY OTHER PLACE'S**, which is the one thing that makes it a
        growl rather than a shriek, and it is the reason this layer carries the fight's whole bottom
        register when `groove` and `chords` have closed.
      */
      steps: [
        8, _, 7, _, 8, _, 7, _,
        3, _, 2, _, 3, _, 2, _,
        8, _, 7, _, 8, _, 7, 8,
        2, _, 3, _, 2, _, 3, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.23, attack: 0.03, curve: 1.9, lowFrom: 1100, lowTo: 420, q: 2.4, drive: 0.85 },
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
      octave: 1,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.17, attack: 0.04, curve: 1.8, lowFrom: 1800, lowTo: 700, q: 2.2, drive: 0.75 },
    },
  ],

  /*
    ── THE AURA: how far in you are ─────────────────────────────────────────────────────────────────

    ⚠️ **These two are the only layers in the game whose gain is a DISTANCE** —
    `docs/decisions/0091-the-boss-has-an-aura.md`. Here the distance is to the hole itself: the slow
    one is the pull, and the fast one is what the disc is doing to whatever is falling through it.
  */
  auraSlow: [
    {
      steps: [2, _, 8, _, 2, _, 8, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.3, attack: 0.3, curve: 1.5, lowFrom: 260, lowTo: 640, q: 1.7 },
    },
    {
      steps: [8, _, 2, _, 8, _, 2, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.27, attack: 0.34, curve: 1.35 },
    },
    {
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.3, gain: 0.115, attack: 0.36, curve: 1.4, lowFrom: 420, lowTo: 1800, highFrom: 140, q: 0.7 },
    },
  ],

  auraFast: [
    {
      steps: [8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2, 2, 2, 2, 2],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.28, gain: 0.16, attack: 0.004, curve: 5, lowFrom: 2200, lowTo: 700, q: 2, drive: 0.4 },
    },
    {
      steps: [_, 2, _, 2, _, 2, _, 2, _, 8, _, 8, _, 8, _, 8],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.115, attack: 0.003, curve: 5.5, lowFrom: 4200, lowTo: 1600, q: 1.7 },
    },
    {
      // The disc: sample-and-hold noise rising in period, which is matter being torn rather than
      // wind blowing.
      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 2600, to: 6800, seconds: BEAT_SECONDS * 0.3, gain: 0.095, attack: 0.004, curve: 3.6, lowFrom: 4200, lowTo: 1400, highFrom: 500 },
    },
  ],
};
