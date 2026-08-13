/**
 * SAURIAN BELT'S OWN COMPOSITION — bone flutes over a hi-NRG floor, and the thing that eats both.
 *
 * `docs/decisions/0146-three-more-places-and-two-after-them.md`.
 *
 * ── WHAT WAS ASKED FOR ──────────────────────────────────────────────────────────────────────────
 *
 * > *"Level 3 will be a space laser dinosaur style biome effect, so a cross between ancient jurassic
 * > and eurobeat techno trance."*
 *
 * ⚠️ **THE TWO HALVES ARE A REGISTER SPLIT AND NOT A COMPROMISE.** *Jurassic* and *eurobeat* do not
 * blend — a bone flute over a 150 BPM four-on-the-floor is either a joke or two records at once. What
 * makes them one piece is that they occupy different parts of the mix and different parts of the
 * LADDER: the primeval material is melodic and lives at the top (`call`, `chords`, `toll`, `wraith`),
 * the hi-NRG material is rhythmic and lives underneath it (`sub`, `groove`, `engine`, `drive`,
 * `stomp`), and the rungs hand the level from one to the other.
 *
 * | the brief | the rung | the layers that carry it |
 * |---|---|---|
 * | something ancient is breathing | `run` | `drone`, `sub`, `engine`, `perc`, `chords`, `groove`, `call` |
 * | the floor arrives | `push` | `arp`, `ride`, `hook`, `lead` |
 * | full hands-in-the-air | `surge` | `counter`, `crash`, `drive` |
 * | it has noticed you | `approach` | `toll`, `dread` |
 * | space laser dinosaur | `boss` | `stomp`, `frenzy`, `wraith`, and the aura's two |
 *
 * ── WHY THE TEMPO IS ALREADY RIGHT AND NOTHING HAD TO MOVE ──────────────────────────────────────
 *
 * ⚠️ **THIS GAME IS AT 150 BPM AND THAT IS WHERE THE GENRE LIVES** —
 * `docs/decisions/0093-the-gun-is-on-the-grid.md` chose it from a divisor argument about the gun and
 * landed on the exact tempo eurobeat is written at. So the one thing this place would normally need
 * from the engine, it already has: the four-on-the-floor in `sub` is the game's own beat, and the
 * player's auto-fire is on the same grid by construction.
 *
 * ⚠️ **AND THE OFFBEAT BASS IS THE SIGNATURE, WHICH IS A PLACEMENT RATHER THAN A SOUND.** What makes
 * a floor read as hi-NRG is not the timbre — it is that the bass lands where the kick does not.
 * `sub`'s stab is on every *and*, `groove` runs sixteenths under it, and the kick has the downbeat to
 * itself.
 *
 * ── THE ONE LIMIT, WHICH IS THE SAME LIMIT EVERY PLACE HAS ──────────────────────────────────────
 *
 * ⚠️ **EVERY NOTE IS A TONE OF A NATURAL MINOR**, because the cues are in the key too —
 * `docs/decisions/0099-the-cues-are-in-the-key.md` — and a place in another key would put the
 * player's own gun out of tune with the level for three minutes. Trance is a minor-key genre and paid
 * nothing for this; the *laser* material is built out of the fifth and the octave, which are the two
 * intervals a square wave already sounds like.
 */

import { BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * THE PROGRESSION — sixteen bars, one chord a bar, and it falls where the other two rise.
 *
 * ⚠️ **`Am G F G · Am G F Em · Dm C F G · Am F Em G`.** The base walks a four-bar turn four ways and
 * Ember Nebula holds a hymn's slow pull back to the tonic; this **descends** — root, seventh, sixth,
 * seventh — which is the oldest hands-in-the-air progression there is and is why the second half can
 * lift to `Dm C` without the piece sounding like it changed key.
 *
 * ⚠️ **IT NEVER RESOLVES AND THAT IS THE GENRE.** Every four-bar phrase ends on G and the loop starts
 * again on Am, so the harmony is permanently falling into the next bar. A eurobeat track that resolved
 * would stop, and this one has to run for three minutes under a fight.
 *
 * ⚠️ **Hoisted, because eight voices spell the same sixteen chords** — the same argument
 * `src/content/nebula.ts` makes, and the same failure it is avoiding: three copies of a progression is
 * how a place ends up with a bass in one key and a lead in another.
 */
const ROOT: readonly number[] = [0, -2, -4, -2, 0, -2, -4, -5, 5, 3, -4, -2, 0, -4, -5, -2];
const THIRD: readonly number[] = [3, 2, 0, 2, 3, 2, 0, -2, 8, 7, 0, 2, 3, 0, -2, 2];
const FIFTH: readonly number[] = [7, 5, 3, 5, 7, 5, 3, 2, 12, 10, 3, 5, 7, 3, 2, 5];

/**
 * THE BONE FLUTE — `call`'s tune, and it is the whole of *ancient* before the floor arrives.
 *
 * ⚠️ **PENTATONIC AND BREATHY, WHICH IS WHAT A FLUTE WITH FIVE HOLES CAN PLAY.** The line uses the
 * root, the third, the fourth, the fifth and the seventh and never the second or the sixth — not
 * because the scale forbids them but because an instrument made of a femur does. It is the one
 * constraint in this file that is about an object rather than about a genre.
 *
 * ⚠️ **Two notes a bar and a breath every fourth one.** The rests are the part that reads as *old*:
 * everything else in this place is continuous, so the layer with holes in it is the layer that sounds
 * like a person rather than a machine.
 */
const FLUTE: readonly (number | null)[] = [
  0, _, 3, _,
  2, _, 0, _,
  -4, _, 0, _,
  2, _, _, _,
  7, _, 5, _,
  3, _, 2, _,
  0, _, 3, _,
  2, _, _, _,
  5, _, 8, _,
  7, _, 3, _,
  5, _, 3, _,
  2, _, _, _,
  12, _, 10, _,
  8, _, 7, _,
  3, _, 5, _,
  2, _, _, _,
];

/**
 * THE HANDS-UP LINE — what `surge` opens, and it is the tune the level is actually about.
 *
 * ⚠️ **IT RISES WHERE `FLUTE` FALLS, WHICH IS WHAT A COUNTER-MELODY IS** —
 * `docs/decisions/0125-the-build-starts-sooner.md` says a section is heard by what ARRIVES, so the
 * third stage cannot be more of the first one. `RUNG_CLOSES` takes `call` away in the same breath
 * (`src/content/music.ts`), so the ear is handed a different tune rather than a second one.
 *
 * ⚠️ **FOUR NOTES A BAR AND NO REST UNTIL THE PHRASE TURNS.** A trance lead is a line you can sing
 * back after one pass; that means long tones on strong beats and a shape that climbs for three bars
 * and falls in the fourth, which is what every one of these four phrases does.
 */
const HANDS: readonly (number | null)[] = [
  12, _, 10, 12,
  15, _, 14, _,
  12, 10, 8, _,
  10, _, _, _,
  12, _, 15, 14,
  17, _, 15, _,
  14, 12, 10, _,
  12, _, _, _,
  17, _, 15, 17,
  19, _, 17, _,
  15, 14, 12, _,
  14, _, _, _,
  12, _, 15, 17,
  20, _, 19, _,
  17, 15, 14, _,
  12, _, _, _,
];

/**
 * THE OCTAVE BASS — sixteen notes a bar, root and octave, and it never stops.
 *
 * ⚠️ **THIS IS THE ONE SOUND THE BRIEF NAMES BY GENRE AND IT IS A PLACEMENT, NOT A TIMBRE.** A
 * eurobeat bassline is continuous sixteenths alternating a root with its octave; what makes it drive
 * is that it is the same note twice and the ear stops hearing pitch and starts hearing *rate*. The
 * fifth arrives once a bar, on the fourth beat, which is the only place the line says anything.
 *
 * ⚠️ **Derived from the progression rather than typed**, like everything else here: two hundred and
 * fifty-six numbers that have to agree with sixteen others is the thing that goes wrong silently.
 */
const OCTAVES: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const fifth = FIFTH[bar]!;
  return [
    root, root + 12, root, root + 12,
    root, root + 12, root, root + 12,
    root, root + 12, root, root + 12,
    fifth, fifth + 12, root, root + 12,
  ];
});

/**
 * THE OFFBEAT — the stab that lands where the kick does not, eight to a bar with four of them silent.
 *
 * ⚠️ **HALF OF WHAT MAKES A FLOOR A FLOOR, AND IT IS A HOLE RATHER THAN A NOTE.** The kick has beats
 * one to four; this has every *and* and nothing else. Play them together and the bar is full; play
 * either alone and it limps, which is the test that says the two belong to each other.
 */
const OFFBEAT: readonly (number | null)[] = ROOT.flatMap((root) => [_, root, _, root, _, root, _, root]);

/**
 * THE ARPEGGIO — sixteen a bar climbing the chord across two octaves, and it is `push`'s own texture.
 *
 * ⚠️ **IT WALKS WHERE `OCTAVES` HOPS**, which is the difference between an arp and a bass: one moves
 * through the chord and the other states its ends. Two sixteenth-note layers that both hopped would
 * be one layer played twice, which is `src/content/nebula.ts`'s own finding about its ostinato.
 */
const ARPEGGIO: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [
    root, third, fifth, root + 12,
    third + 12, root + 12, fifth, third,
    root, third, fifth, root + 12,
    fifth + 12, root + 12, fifth, third,
  ];
});

/**
 * THE RIFF — eight a bar, syncopated, and it alternates between two shapes so the bars are not twins.
 *
 * ⚠️ **A HOOVER IS A CHORD PLAYED AS A LINE.** The sound that names it is a stack of detuned saws;
 * this synthesiser has no detune (`src/app/sound.ts` takes a semitone, not a cent), so the stack is
 * built the way `drone` builds its own — two voices an octave apart through different filters — and
 * the *chord played as a line* is what the pattern does.
 */
const RIFF: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return bar % 2 === 0
    ? [root + 12, _, fifth, root + 12, _, third + 12, fifth, _]
    : [root + 12, fifth, _, third + 12, _, root + 12, _, fifth];
});

/**
 * THE STABS — the top of the chord, four times in sixteen bars, on the bar each phrase turns on.
 *
 * ⚠️ **Rare and high rather than frequent and loud**, on `src/content/nebula.ts`'s own terms: a hit
 * that happens every bar is a part, and a hit that happens once a phrase is an event.
 */
const STABS: readonly (number | null)[] = ROOT.flatMap((root, bar) =>
  bar % 4 === 3 ? [root + 12, _, FIFTH[bar]! + 12, _, root + 24, _, _, _] : [_, _, _, _, _, _, _, _],
);

/**
 * THE TREMOLO — the string-and-saw scrub `surge` runs underneath the hands-up line.
 *
 * ⚠️ **It alternates across two notes and the arp climbs through four**, so the two sixteenth layers
 * that are open at once are audibly two things. It is also the third distinct kind of fast in the
 * piece — eighths in `sub`, walking sixteenths in `arp`, scrubbed sixteenths here — which is the
 * acceleration `docs/decisions/0136-the-place-has-a-room-and-an-arc.md` asked a place to carry in
 * WHICH layers a rung opens rather than in a tempo that cannot move.
 */
const TREMOLO: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [
    fifth, root + 12, fifth, root + 12,
    fifth, root + 12, fifth, root + 12,
    third + 12, fifth, third + 12, fifth,
    fifth, root + 12, fifth, root + 12,
  ];
});

/**
 * Everything Saurian Belt plays instead of the base composition.
 *
 * ⚠️ **TWENTY-ONE OF THE TWENTY-THREE, and the two left out are `bass` and `beat`**, which
 * `docs/decisions/0095-the-level-has-its-own-music.md` closes everywhere except the title. A place
 * cannot re-voice something it never sounds.
 */
export const SAURIAN_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ── THE TAR: what is under the whole level, and it is older than the beat ────────────────────────

    ⚠️ **The root and the fifth, alternating by the bar**, so the pad says nothing about a progression
    it is only two bars long to hear. A and E are consonant over every chord in the sixteen — the same
    trick the base's drone uses and the reason `drone` is the one layer 0095 never closes.
  */
  drone: [
    {
      steps: [0, 7],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.15, attack: 0.4, curve: 0.9, lowFrom: 420, lowTo: 260, q: 1 },
    },
    {
      // The same two notes through a filter four hertz away. Two saws slightly apart is the oldest
      // pad there is, and here it is doing the job a detune would if this synthesiser had one.
      steps: [0, 7],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.14, attack: 0.46, curve: 0.9, lowFrom: 416, lowTo: 258, q: 1 },
    },
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.22, attack: 0.3, curve: 0.9 },
    },
    {
      // Humid air. A jungle is never silent, and this is the only voice in the place that is weather.
      steps: [1, 1],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.05, attack: 1.1, curve: 1.3, lowFrom: 2200, lowTo: 900, highFrom: 240, q: 0.7 },
    },
  ],

  /*
    ── THE FLOOR: the kick, the offbeat, and the ground they stand on ───────────────────────────────

    ⚠️ **`sub` IS WHERE THIS PLACE PUTS EVERYTHING BELOW 130 Hz**, on `src/content/nebula.ts`'s own
    terms: `LAYER_PAN` centres `sub`, `drone`, `groove`, `engine` and `stomp` and `tests/music.test.ts`
    refuses a low-heavy layer anywhere else, so the bottom of a hi-NRG mix has exactly five places it
    may live.
  */
  sub: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.1, gain: 0.34, attack: 0.1, curve: 0.95 },
    },
    {
      /*
        THE FOUR-ON-THE-FLOOR. Every beat, hard, with the fourth bar of each phrase carrying a
        sixteenth pickup — which is what stops sixty-four identical kicks reading as a metronome, and
        is 0102's finding applied to the one drum that genuinely is on every beat.

        ⚠️ **IT IS ON A SIXTEENTH GRID SO THAT IT CAN AVOID THE STAB, AND THAT IS A FIX RATHER THAN A
        REFINEMENT.** The first version wrote this at eighths and put its pickup on the last *and* of
        the bar — which is exactly where `OFFBEAT` plays, so the two loudest low transients in the
        place landed on the same sample sixteen times a phrase. It read as *the kick is uneven* and it
        measured as **the boss mix clipping at 1.004 of full scale**, which is what
        `tests/themes.test.ts` caught. The paragraph above this layer had already said *the kick has
        the downbeat to itself*; the pattern did not.

        ⚠️ **The pickup is now a SIXTEENTH before the bar line** — position 15, where the stab's
        eighth grid has nothing — so it is still the same gesture and it no longer stacks.
      */
      steps: ROOT.flatMap((_root, bar) =>
        bar % 4 === 3
          ? [1, _, _, _, 0.9, _, _, 0.6, 0.98, _, _, 0.64, 0.92, _, _, 0.72]
          : [1, _, _, _, 0.9, _, _, _, 0.98, _, _, 0.62, 0.92, _, _, _],
      ),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 132, to: 32, seconds: 0.42, gain: 0.4, attack: 0.002, curve: 2.4, drive: 0.3 },
    },
    {
      // THE OFFBEAT STAB — the half of the floor that is a hole rather than a note. `OFFBEAT` has it.
      steps: OFFBEAT,
      pitched: true,
      perBeat: 2,
      octave: 0,
      accents: [1, 0.86, 0.94, 0.84],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.24, attack: 0.004, curve: 3.6, lowFrom: 900, lowTo: 260, q: 1.5, drive: 0.3 },
    },
  ],

  /*
    ── THE KIT: a drum machine and a hollow log, played by the same hands ───────────────────────────

    ⚠️ **THE TOMS ARE THE JURASSIC HALF AND THEY ARE IN THE RHYTHM LAYER ON PURPOSE.** The obvious
    build puts the primeval material entirely in the melodies and lets the drums be a machine; that is
    two records at once. A log drum answering the clap on the second half of every other bar is what
    makes the floor sound like it is being played somewhere rather than programmed.
  */
  engine: [
    {
      // The clap, on two and four, which is the one thing a hi-NRG bar is not allowed to be missing.
      steps: [_, 0.94, _, 0.86, _, 0.96, _, 0.9, _, 0.92, _, 0.88, _, 1, _, 0.94],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.16, gain: 0.13, attack: 0.001, curve: 3.6, lowFrom: 4200, lowTo: 1500, highFrom: 900 },
    },
    {
      /*
        THE SIXTEENTH HAT. Continuous, quiet, and accented on the offbeat — the *tsk* that carries the
        rate when everything else is holding. Nothing in this place subdivides faster until the boss.
      */
      steps: [
        0.44, 0.22, 0.36, 0.24, 0.4, 0.22, 0.34, 0.26, 0.46, 0.22, 0.36, 0.24, 0.38, 0.24, 0.34, 0.28,
        0.44, 0.22, 0.36, 0.26, 0.4, 0.24, 0.34, 0.22, 0.46, 0.24, 0.36, 0.26, 0.38, 0.26, 0.36, 0.3,
        0.44, 0.22, 0.38, 0.24, 0.4, 0.22, 0.36, 0.24, 0.46, 0.22, 0.36, 0.26, 0.38, 0.24, 0.34, 0.28,
        0.46, 0.24, 0.36, 0.26, 0.42, 0.24, 0.36, 0.26, 0.48, 0.26, 0.38, 0.28, 0.42, 0.3, 0.4, 0.36,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.032, gain: 0.075, attack: 0.0005, curve: 8, lowFrom: 12000, highFrom: 6200 },
    },
    {
      /*
        THE OPEN HAT, ON THE OFFBEAT. The second signature of the genre after the bass placement, and
        the reason a floor sounds like it is leaning forward: a long hat on every *and* pulls the ear
        past the beat it is on.
      */
      steps: [
        _, 0.8, _, 0.62, _, 0.76, _, 0.66, _, 0.82, _, 0.64, _, 0.78, _, 0.72,
        _, 0.8, _, 0.64, _, 0.78, _, 0.66, _, 0.84, _, 0.66, _, 0.8, _, 0.76,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.13, gain: 0.05, attack: 0.001, curve: 4.2, lowFrom: 9000, lowTo: 5200, highFrom: 3800 },
    },
    {
      /*
        THE LOG DRUMS. A hollow wooden tom, tuned low and struck in threes across the second half of
        every other bar — the one part of the kit that is not on a grid a machine would choose.
      */
      steps: [
        _, _, _, _, _, _, _, _, 0.9, _, 0.66, 0.7, _, 0.6, _, _,
        _, _, _, _, _, _, _, _, _, 0.72, 0.86, _, 0.62, _, 0.68, 0.58,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 196, to: 88, seconds: 0.26, gain: 0.44, attack: 0.002, curve: 3.6, drive: 0.28 },
    },
  ],

  /*
    ── THE SMALL THINGS: seed rattles, claves, and something with teeth ─────────────────────────────

    ⚠️ **`perc` sits at −0.45 and therefore may not be low**, which is a constraint and not a taste:
    `tests/themes.test.ts` refuses a placed layer whose weight is under 130 Hz. Everything a jungle
    keeps up there — rattles, bone, insects — is what this layer is made of, which is convenient
    enough to be worth saying out loud rather than pretending it was chosen freely.
  */
  perc: [
    {
      // The seed rattle: sixteenths, dry, and it is the layer that never stops moving.
      steps: [
        0.5, 0.28, 0.34, 0.3, 0.44, 0.26, 0.32, 0.28, 0.48, 0.28, 0.34, 0.3, 0.42, 0.28, 0.34, 0.32,
        0.5, 0.26, 0.36, 0.28, 0.44, 0.28, 0.32, 0.26, 0.48, 0.26, 0.34, 0.3, 0.42, 0.3, 0.36, 0.34,
        0.52, 0.28, 0.34, 0.28, 0.46, 0.26, 0.34, 0.28, 0.5, 0.28, 0.34, 0.3, 0.42, 0.28, 0.34, 0.32,
        0.5, 0.28, 0.36, 0.3, 0.46, 0.28, 0.34, 0.3, 0.52, 0.3, 0.38, 0.32, 0.46, 0.34, 0.42, 0.38,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.038, gain: 0.06, attack: 0.001, curve: 6.5, lowFrom: 7600, highFrom: 2600 },
    },
    {
      // Claves. Two bones struck together, on a figure that crosses the bar rather than sitting in it.
      steps: [
        1, _, _, 0.7, _, _, 0.82, _, _, 0.66, _, _, 0.9, _, 0.6, _,
        _, _, 0.86, _, _, 0.68, _, _, 0.94, _, _, 0.64, _, 0.72, _, 0.7,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'tri', from: 2400, to: 1800, seconds: 0.055, gain: 0.115, attack: 0.0008, curve: 7, highFrom: 1100 },
    },
    {
      /*
        THE SKIN. A hand drum with a real body on it — 190 Hz falling to 110, which is the low-mid a
        place made of rattles and hats otherwise has nothing in. `src/content/nebula.ts` found the same
        hole by measurement and this is that lesson taken before the report rather than after it.
      */
      steps: [1, _, 0.64, _, 0.72, _, _, 0.68, 0.88, _, 0.6, _, 0.76, _, 0.66, 0.62],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 188, to: 106, seconds: 0.22, gain: 0.38, attack: 0.001, curve: 4.2, drive: 0.2 },
    },
    {
      // A tooth on a tooth: the highest thing in the place, four times a phrase, and nothing else
      // goes near four kilohertz until the lasers arrive.
      steps: [1, _, _, _, _, 0.74, _, _, 0.86, _, _, _, _, 0.78, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'tri', from: 4200, to: 3100, seconds: 0.09, gain: 0.1, attack: 0.0006, curve: 5, highFrom: 2200 },
    },
  ],

  /*
    ── THE CHORDS: a supersaw pad and the stab that cuts it into a rhythm ───────────────────────────

    ⚠️ **A TRANCE PAD IS A CHORD WITH AN EDGE ON IT, WHICH IS THE OPPOSITE OF A CHOIR.** Ember Nebula's
    `chords` opens its filter as the voice pushes, because a vowel brightens; this closes, because a
    filter sweeping down is the single most recognisable gesture in the genre and it is what a listener
    hears as *the pad is breathing*.
  */
  chords: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.13, attack: 0.16, curve: 1.5, lowFrom: 2600, lowTo: 700, q: 1.4 },
    },
    {
      steps: FIFTH,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.095, attack: 0.2, curve: 1.5, lowFrom: 2400, lowTo: 660, q: 1.5 },
    },
    {
      steps: THIRD,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      accents: [0.94, 0.84, 1, 0.82, 0.92, 0.88, 0.96, 0.8],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.08, attack: 0.24, curve: 1.5, lowFrom: 3400, lowTo: 1100, q: 1.4 },
    },
    {
      /*
        THE STAB. Eighths on the offbeat, short, and it is what turns a held chord into a part —
        `src/content/nebula.ts` calls its own version *the voice that stops being a bong* and this is
        the same job done with a saw instead of a triangle.
      */
      steps: ROOT.flatMap((root, bar) => [_, FIFTH[bar]!, _, root + 12, _, THIRD[bar]! + 12, _, FIFTH[bar]!]),
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.72, 0.88, 0.7],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.26, gain: 0.07, attack: 0.004, curve: 4, lowFrom: 2200, lowTo: 900, q: 1.6 },
    },
    {
      // The bottom of the pad, an octave under the roots and filtered nearly flat: what makes the
      // chord felt rather than only heard.
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.34, attack: 0.12, curve: 1.2, lowFrom: 520, lowTo: 300, q: 0.9 },
    },
  ],

  /*
    ── THE BASS: sixteen notes a bar, and it is the thing the level runs on ─────────────────────────

    ⚠️ **THREE VOICES ON ONE LINE, WHICH IS HOW A BASS GETS BIG WITHOUT GETTING LOUD.** A sine for the
    weight, a driven saw for the teeth, and an octave up so the FIGURE is audible rather than only the
    pressure. Take the third away and the line is felt and cannot be followed, which is the exact
    failure `src/content/nebula.ts`'s pedalboard was written to fix.
  */
  groove: [
    {
      steps: OCTAVES,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.58, attack: 0.003, curve: 3.2 },
    },
    {
      steps: OCTAVES,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.18, gain: 0.2, attack: 0.003, curve: 4, lowFrom: 760, lowTo: 320, q: 1.4, drive: 0.34 },
    },
    {
      steps: OCTAVES,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.15, gain: 0.055, attack: 0.003, curve: 5, lowFrom: 1600, lowTo: 700, q: 1.5 },
    },
  ],

  /*
    ── THE FLUTE: two of them, an octave apart, and the room between them ──────────────────────────
  */
  call: [
    {
      steps: FLUTE,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.76, 0.9, 0.72],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.14, attack: 0.06, curve: 1.4, lowFrom: 2600, lowTo: 1300, q: 1.1 },
    },
    {
      // The breath that makes it a pipe and not a synth: noise on the front of every note, gone
      // before the tone is.
      steps: FLUTE.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.13, gain: 0.055, attack: 0.012, curve: 3.4, lowFrom: 3600, lowTo: 1800, highFrom: 1400, q: 0.9 },
    },
    {
      steps: FLUTE,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.76, 0.9, 0.72],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.6, gain: 0.072, attack: 0.09, curve: 1.2 },
    },
  ],

  /*
    ── THE RIFF: what `push` opens, and the first thing in the place that is a hook ─────────────────
  */
  hook: [
    {
      steps: RIFF,
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.165, attack: 0.006, curve: 2.6, lowFrom: 2400, lowTo: 900, q: 1.6, drive: 0.2 },
    },
    {
      // The octave over it. Two saws an octave apart through different filters is this synthesiser's
      // whole answer to a supersaw, and it is the same trick `drone` uses one register down.
      steps: RIFF,
      pitched: true,
      perBeat: 2,
      octave: 2,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.38, gain: 0.085, attack: 0.008, curve: 3, lowFrom: 4600, lowTo: 2200, q: 1.4 },
    },
    {
      // The high stab, four in sixteen bars: the top of the whole piece before the lasers.
      steps: STABS,
      pitched: true,
      perBeat: 2,
      octave: 3,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.5, gain: 0.07, attack: 0.003, curve: 2.4, lowFrom: 7200, lowTo: 4000, q: 1.4 },
    },
  ],

  /*
    ── THE ARP: sixteenths that walk, and the pulse doubling is the whole of what `push` means ──────
  */
  arp: [
    {
      steps: ARPEGGIO,
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.68, 0.86, 0.66],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.075, attack: 0.003, curve: 3.2, lowFrom: 3800, lowTo: 2200, q: 1.4 },
    },
    {
      steps: ARPEGGIO,
      pitched: true,
      perBeat: 4,
      octave: 3,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.16, gain: 0.038, attack: 0.004, curve: 4, lowFrom: 6200, lowTo: 3600, q: 1.2 },
    },
  ],

  /*
    ── THE RIDE: the offbeat crash-hat, which is the sound of a genre with no patience ─────────────
  */
  ride: [
    {
      steps: [
        0.72, 0.3, 0.46, 0.28, 0.6, 0.3, 0.42, 0.26, 0.74, 0.3, 0.44, 0.28, 0.58, 0.32, 0.44, 0.5,
        0.7, 0.28, 0.44, 0.26, 0.62, 0.3, 0.4, 0.28, 0.76, 0.3, 0.46, 0.3, 0.6, 0.32, 0.44, 0.52,
        0.72, 0.3, 0.46, 0.28, 0.6, 0.28, 0.42, 0.3, 0.74, 0.28, 0.44, 0.3, 0.58, 0.3, 0.44, 0.48,
        0.68, 0.3, 0.42, 0.28, 0.64, 0.3, 0.42, 0.28, 0.78, 0.34, 0.48, 0.32, 0.62, 0.36, 0.48, 0.56,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.028, gain: 0.125, attack: 0.0004, curve: 9, lowFrom: 11000, highFrom: 5600 },
    },
  ],

  /*
    ── THE LEAD: the euphoric one, and it is four bars because a hook you cannot sing is not one ────
  */
  lead: [
    {
      steps: [
        12, _, 14, _, 15, _, 14, _,
        12, _, 10, _, 12, _, _, _,
        15, _, 17, _, 19, _, 17, _,
        15, _, 14, _, 12, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.6, gain: 0.135, attack: 0.02, curve: 1.5, lowFrom: 3600, lowTo: 1800, q: 1.5 },
    },
    {
      steps: [
        12, _, 14, _, 15, _, 14, _,
        12, _, 10, _, 12, _, _, _,
        15, _, 17, _, 19, _, 17, _,
        15, _, 14, _, 12, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.075, attack: 0.03, curve: 1.7, lowFrom: 1800, lowTo: 950, q: 1.3 },
    },
  ],

  /*
    ── THE SURGE: the hands-up line, its tremolo, and the two things `call` and `arp` make room for ─

    ⚠️ **`RUNG_CLOSES` TAKES TWO LAYERS AWAY HERE** — `src/content/music.ts` — so this section is a
    change of arrangement rather than a thicker one. What arrives has to be audibly a different voice,
    which is why the counter-melody is a saw stack two octaves over the flute that just stopped.
  */
  counter: [
    {
      steps: HANDS,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.2, attack: 0.02, curve: 1.6, lowFrom: 4200, lowTo: 1900, q: 1.5 },
    },
    {
      steps: HANDS,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.13, attack: 0.03, curve: 1.5, lowFrom: 2000, lowTo: 950, q: 1.3 },
    },
    {
      steps: TREMOLO,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.66, 0.86, 0.64],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.06, attack: 0.005, curve: 3, lowFrom: 1300, lowTo: 620, q: 1.3 },
    },
  ],

  /*
    ── THE CRASH: the reverse swell, which is the one gesture that says *here it comes* ─────────────

    ⚠️ **IT ARRIVES BEFORE THE BEAT AND LANDS ON IT**, which is why the pattern puts it a bar early —
    a rise with nothing at the top of it is a noise, and this is the only thing in the place with a
    slow attack on a short sound.
  */
  crash: [
    {
      steps: [0.95, _, _, _, _, _, _, _, 0.82, _, _, _, _, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 1.35, gain: 0.075, attack: 0.5, curve: 1.1, lowFrom: 3200, lowTo: 12000, highFrom: 2200, q: 0.5 },
    },
    {
      // The hit at the top of the rise, and it is the only cymbal in the piece that is not a hat.
      steps: [_, _, _, _, _, _, _, 1, _, _, _, _, _, _, _, 0.84],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.9, gain: 0.09, attack: 0.0008, curve: 2.6, lowFrom: 13000, lowTo: 4200, highFrom: 1800 },
    },
  ],

  /*
    ── THE GATE: sixteenth chord stabs, chopped, and the fourth kind of fast in the piece ───────────

    ⚠️ **Two bars, so it says nothing about the progression** and can be the root and the fifth for
    ever — which is what a gate is: one chord, cut into a rhythm, and the rhythm is the part.
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
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.19, gain: 0.06, attack: 0.003, curve: 3.4, lowFrom: 3000, lowTo: 1500, q: 1.8 },
    },
    {
      // The thud under it, so `approach` has a floor when `groove` closes.
      steps: [1, _, 0.72, _, 0.9, _, 0.7, 0.66, 1, _, 0.74, _, 0.88, _, 0.72, 0.82],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 172, to: 58, seconds: 0.28, gain: 0.45, attack: 0.001, curve: 3.4, drive: 0.28 },
    },
  ],

  /*
    ── THE APPROACH: a horn across the valley, and the thing that answers it ────────────────────────

    ⚠️ **`toll` SITS AT −0.5 AND MAY NOT BE LOW**, so the *huge* comes from the harmonics rather than
    from the fundamental: a rasping saw, a fifth over it, and the air of something enormous drawing
    breath. `src/content/nebula.ts` found this the hard way with a bell that was 49% under 130 Hz and
    passed every guard in the repository; this is that measurement taken before the fact.
  */
  toll: [
    {
      steps: [0, _, -4, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.26, attack: 0.13, curve: 1.2, lowFrom: 1500, lowTo: 800, q: 1.6, drive: 0.2 },
    },
    {
      steps: [7, _, 3, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.13, attack: 0.22, curve: 1.2, lowFrom: 1900, lowTo: 1100, q: 1.4 },
    },
    {
      steps: [0, _, -4, _],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.14, attack: 0.18, curve: 1.3, lowFrom: 900, lowTo: 520, q: 1.1 },
    },
    {
      // The breath. A horn this size is mostly air, and the air is what makes it read as an animal
      // rather than as an instrument.
      steps: [1, _, 0.86, _],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4, gain: 0.09, attack: 0.9, curve: 1.3, lowFrom: 900, lowTo: 3200, highFrom: 380, q: 0.8 },
    },
  ],

  /*
    ── THE DREAD: the interval the whole fight is built out of, stated once, alone ──────────────────

    ⚠️ **B AGAINST F IS THE TRITONE AND IT IS IN THE KEY.** A natural minor contains it, so a place
    that wants menace does not need a note the player's own gun cannot be tuned to —
    `src/content/nebula.ts` made this argument first and it is the reason `frenzy` and `wraith` below
    are built out of the same two numbers.
  */
  dread: [
    {
      steps: [2, 8, 2, 8],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.92, 0.98, 1],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.1, attack: 0.5, curve: 1.05, lowFrom: 320, lowTo: 820, q: 2.4 },
    },
    {
      steps: [8, 2, 8, 2],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.19, attack: 0.46, curve: 1 },
    },
  ],

  /*
    ── THE FIGHT ────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **THE FLOOR SURVIVES AND THE TUNE DOES NOT.** `LEVEL_ONLY` closes `chords`, `groove`, `arp`,
    `hook` and `lead` at the boss (`src/content/music.ts`), so nine layers of hi-NRG stop at once and
    what is left is the kick, the hats, the bell and three new things. That is the *drop* every rung
    below has been building towards and it costs no mechanism: the ladder already does it.

    ⚠️ **AND THE THREE NEW THINGS ARE THE BRIEF'S OWN NOUN.** A space laser dinosaur is a footfall, a
    laser and a roar, in that order of size.
  */
  stomp: [
    {
      /*
        THE FOOTFALL. Lower and longer than the kick it replaces — 118 Hz down to 26, which is under
        the fundamental of everything else in the piece — and it lands on the half-bar rather than on
        the beat, so the fight is heard as something walking rather than as the floor speeding up.
      */
      steps: [1, _, 0.66, _, 0.9, _, 0.62, 0.7, 1, _, 0.68, _, 0.88, 0.58, 0.72, 0.82],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 118, to: 26, seconds: 0.5, gain: 0.39, attack: 0.001, curve: 2.2, drive: 0.48 },
    },
    {
      /*
        THIRTY-SECONDS OF METAL. The top of the acceleration and the fastest thing in the game by a
        factor of two — eighths at the opening, sixteenths at `push` and `surge`, and this. It exists
        only in the fight, which is what makes the fight sound like it is happening at a different
        speed without the tempo moving at all (`docs/decisions/0093-the-gun-is-on-the-grid.md`).
      */
      steps: [
        _, 0.32, _, 0.42, _, 0.3, 0.36, 0.26, _, 0.34, _, 0.46, _, 0.3, 0.38, 0.28,
        _, 0.32, 0.28, 0.44, _, 0.28, 0.36, 0.26, _, 0.36, _, 0.42, 0.26, 0.32, 0.4, 0.3,
        _, 0.34, _, 0.46, _, 0.3, 0.38, 0.28, _, 0.32, 0.26, 0.44, _, 0.3, 0.36, 0.26,
        _, 0.32, 0.28, 0.42, 0.26, 0.32, 0.38, 0.28, 0.3, 0.36, 0.32, 0.46, 0.28, 0.34, 0.42, 0.36,
      ],
      pitched: false,
      perBeat: 8,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.115, attack: 0.0008, curve: 5.5, lowFrom: 3600, lowTo: 1300, highFrom: 360 },
    },
    {
      steps: [
        0.38, _, 0.3, _, 0.36, _, 0.28, _, 0.38, _, 0.32, _, 0.34, _, 0.3, 0.32,
        0.38, _, 0.3, _, 0.36, _, 0.28, _, 0.4, _, 0.32, _, 0.36, _, 0.3, 0.34,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.024, gain: 0.05, attack: 0.0004, curve: 8, lowFrom: 13000, highFrom: 6800 },
    },
  ],

  frenzy: [
    {
      /*
        THE LASERS. Sixteenths on a square wave, snapping between the fifth and the tritone with the
        octave over them — eight bars, so the figure is longer than the four-bar phrase the listener
        has been counting in and the fight stops fitting its own shape.

        ⚠️ **A pitched square with a fast decay IS the laser this game already fires** —
        `src/content/cues.ts` builds the gun the same way, which is
        `docs/decisions/0099-the-cues-are-in-the-key.md` arriving from the other side: the boss's music
        and the player's weapons are the same instrument, in the same key, on the same grid.
      */
      steps: [
        7, _, 2, 7, 8, _, 7, _, 2, 7, _, 2, 7, 8, _, 7,
        2, _, 7, 2, 12, _, 2, _, 7, 2, _, 7, 2, 12, _, 2,
        7, _, 2, 7, 8, _, 7, _, 2, 7, _, 2, 7, 8, 7, _,
        8, _, 7, 8, 2, _, 8, _, 7, 8, _, 7, 8, 2, _, 8,
        7, _, 2, 7, 8, _, 7, _, 2, 7, _, 2, 7, 8, _, 7,
        12, _, 7, 12, 2, _, 12, _, 7, 12, _, 7, 12, 2, 12, _,
        3, _, 2, 3, 8, _, 3, _, 2, 3, _, 2, 3, 8, _, 3,
        2, _, 8, 2, 8, _, 2, _, 8, 2, 8, 2, 8, 2, 8, 2,
      ],
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.62, 0.86, 0.6],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.085, attack: 0.002, curve: 4.4, lowFrom: 3400, lowTo: 1200, q: 2.2, drive: 0.5 },
    },
    {
      steps: [
        2, _, 7, 2, 3, _, 2, _, 7, 2, _, 7, 2, 3, _, 2,
        7, _, 2, 7, 8, _, 7, _, 2, 7, _, 2, 7, 8, _, 7,
        2, _, 7, 2, 3, _, 2, _, 7, 2, _, 7, 2, 3, 2, _,
        2, _, 8, 2, 7, _, 2, _, 8, 2, _, 8, 2, 7, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        7, _, 12, 7, 8, _, 7, _, 12, 7, _, 12, 7, 8, 7, _,
        8, _, 3, 8, 2, _, 8, _, 3, 8, _, 3, 8, 2, _, 8,
        8, _, 2, 8, 2, _, 8, _, 2, 8, 2, 8, 2, 8, 2, 8,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.6, 0.84, 0.62],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.18, gain: 0.05, attack: 0.002, curve: 4.6, lowFrom: 5200, lowTo: 2200, q: 1.8, drive: 0.44 },
    },
  ],

  wraith: [
    {
      /*
        THE ROAR. Held notes a minor second apart — E against F, then B against C — driven until the
        tone comes apart, which is the same construction Ember Nebula's screaming choir uses and is
        here for the opposite picture. A vowel and an animal both fall apart the same way.
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
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.98, gain: 0.07, attack: 0.05, curve: 1.9, lowFrom: 1900, lowTo: 640, q: 2.4, drive: 0.8 },
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
      octave: 0,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.02, gain: 0.05, attack: 0.06, curve: 1.8, lowFrom: 1200, lowTo: 480, q: 2, drive: 0.7 },
    },
  ],

  /*
    ── THE AURA: how near the animal is ─────────────────────────────────────────────────────────────

    ⚠️ **These two are the only layers in the game whose gain is a DISTANCE** —
    `docs/decisions/0091-the-boss-has-an-aura.md` — so they are the place's answer to *it is over
    there*. Here that is a thing the size of a building: a roar you feel before you hear it, and the
    step that shakes the ground under it. Both are two bars, so neither says anything about a
    progression it cannot see.
  */
  auraSlow: [
    {
      steps: [2, _, 8, _, 2, _, 8, _],
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.34, attack: 0.28, curve: 1.5, lowFrom: 340, lowTo: 780, q: 1.4 },
    },
    {
      steps: [8, _, 2, _, 8, _, 2, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.48, attack: 0.32, curve: 1.35 },
    },
    {
      // The breath behind the roar, which is what makes it lungs rather than a synthesiser.
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.3, gain: 0.13, attack: 0.34, curve: 1.4, lowFrom: 620, lowTo: 2000, highFrom: 220, q: 0.7 },
    },
  ],

  auraFast: [
    {
      steps: [7, 7, 7, 7, 7, 7, 7, 7, 2, 2, 2, 2, 2, 2, 2, 2],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.26, gain: 0.17, attack: 0.004, curve: 5.5, lowFrom: 3000, lowTo: 900, q: 1.8 },
    },
    {
      steps: [_, 2, _, 2, _, 2, _, 2, _, 7, _, 7, _, 7, _, 7],
      pitched: true,
      perBeat: 2,
      octave: 3,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.14, attack: 0.003, curve: 6.5 },
    },
    {
      // The footstep, doubling as the ground gets closer. Sample-and-hold noise rather than white —
      // `from` on a noise voice is a period held (`src/app/sound.ts`), which is what makes it a thump
      // with grit in it rather than a hiss.
      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 3800, to: 1600, seconds: BEAT_SECONDS * 0.3, gain: 0.095, attack: 0.004, curve: 3.8, lowFrom: 5200, lowTo: 1800, highFrom: 700 },
    },
  ],
};
