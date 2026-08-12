/**
 * EMBER NEBULA'S OWN COMPOSITION — a choir, an organ, and what the fire does to both.
 *
 * `docs/decisions/0132-a-place-may-be-another-piece-entirely.md`.
 *
 * ── WHAT WAS ASKED FOR ──────────────────────────────────────────────────────────────────────────
 *
 * > *"The nebula soundtrack needs to be its own theme — something very different, like celestial
 * > choir music: starting out with haunting hymns, pushing into pipe organs and then surging into a
 * > full orchestral symphonic choir before kicking into a dissonant discordant hellish boss music of
 * > inferno fires… for the different levels I want drastically different music, not just riffs on the
 * > same track over and over again."*
 *
 * ⚠️ **FOUR STAGES, AND THE LADDER ALREADY HAD FOUR.** The brief names hymn → organ → symphonic choir
 * → inferno, and `MUSIC_LADDER` (`src/content/music.ts`) opens `run` → `push`/`surge` → `approach` →
 * `boss`. So the arrangement is not invented here: what each stage sounds like is chosen by WHICH
 * layers a rung opens, and this file only decides what those layers play. Nothing about the build,
 * the distances or the gains moves.
 *
 * | the brief | the rung | the layers that carry it |
 * |---|---|---|
 * | haunting hymns | `run` | `chords` (the choir), `call` (the hymn), `drone`, `sub`, `engine`, `perc` |
 * | pipe organs | `push` | `groove` (the pedalboard), `hook` (the registration), `arp` (the mixture), `lead`, `ride` |
 * | symphonic choir | `surge` | `counter` (the strings), `crash` (the swell), `drive` |
 * | the fire coming | `approach` | `toll` (the great bell), `dread` (the tritone) |
 * | hellish, discordant | `boss` | `stomp`, `frenzy`, `wraith`, and the aura's two |
 *
 * ── WHY THIS IS ITS OWN FILE ────────────────────────────────────────────────────────────────────
 *
 * ⚠️ **`src/content/themes.ts` IS A TABLE OF SEVEN PLACES AND THIS IS ONE PIECE OF MUSIC.** The first
 * override — 0128's two layers — was a hoisted const in that file and was already the longest thing
 * in it. Twenty-one layers there would bury a seven-row table under a composition, and the table is
 * what a reader goes to `themes.ts` for. It is a FILE and not a directory:
 * `docs/decisions/0015-the-layer-ladder.md` makes a new directory under `src/` a decision and this
 * needs none — it is content, it sits in `content/`, and `themes.ts` imports it by name.
 *
 * ── THE ONE LIMIT, AND IT IS NOT THE ONE 0128 NAMED ─────────────────────────────────────────────
 *
 * ⚠️ **EVERY NOTE IS STILL A TONE OF A NATURAL MINOR, AND THE REASON HAS CHANGED.**
 * [0128](../../docs/decisions/0128-a-place-plays-its-own-material.md) required it because the place
 * shared `chords` and would otherwise be wrong over its own bed. This place re-voices `chords`, so
 * that reason is gone — and the constraint is not, because **the cues are in the key too**
 * (`docs/decisions/0099-the-cues-are-in-the-key.md`): every pitched effect in the game glides between
 * two tones of `SCALE`, and a place in a different key would put the player's own gun out of tune
 * with the level for three minutes.
 *
 * ⚠️ **SO THE DISSONANCE IS BUILT INSIDE THE KEY RATHER THAN OUTSIDE IT**, which turned out to cost
 * nothing: A natural minor contains **B against F**, the tritone, and **E against F** and **B against
 * C**, two minor seconds. The inferno layers are made of exactly those three intervals. A hellish
 * boss did not need a note the scale does not have.
 */

import { BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * THE PROGRESSION — sixteen bars, one chord a bar, and it is this place's own.
 *
 * ⚠️ **THE FIRST HARMONY IN THIS PROJECT THAT IS NOT LEVEL ONE'S.** The base walks
 * `A F C G · A F G E · C G A F · C G F E` — a four-bar turn played four ways, driving and even.
 * This is **Am E Am F · C G Am Am · Dm Am F E · B° F G E**: half the movement, a dominant that keeps
 * pulling back to the tonic, and a diminished chord in bar thirteen. It is a hymn's shape — the same
 * key, a different piece.
 *
 * ⚠️ **BAR THIRTEEN IS WHERE THE FIRE IS PLANTED.** `B°` is B–D–F, and B against F is the tritone the
 * boss's own layers are built out of. It arrives once, three quarters of the way through the phrase,
 * inside the hymn — so the inferno at the end of the level is something the choir has already sung.
 *
 * ⚠️ **Hoisted, because six voices spell the same sixteen chords.** Three copies of a progression is
 * how a place ends up with a bass in one key and a descant in another, which is the second
 * description this repository keeps finding in its own tables.
 */
const ROOT: readonly number[] = [0, -5, 0, -4, 3, -2, 0, 0, 5, 0, -4, -5, 2, -4, -2, -5];
const THIRD: readonly number[] = [3, -2, 3, 0, 7, 2, 3, 3, 8, 3, 0, -2, 5, 0, 2, -2];
const FIFTH: readonly number[] = [7, 2, 7, 3, 10, 5, 7, 7, 12, 7, 3, 2, 8, 3, 5, 2];

/**
 * THE DESCANT — the top line of the choir, one note a bar over the progression.
 *
 * ⚠️ **It ends on A over an E chord**, which is a suspension and not a mistake: the phrase does not
 * resolve at the end of the loop, it resolves into the beginning of the next one. That is what makes
 * sixteen bars sound like a verse rather than like a list.
 */
const DESCANT: readonly number[] = [12, 14, 12, 15, 19, 14, 12, 12, 17, 15, 12, 14, 17, 15, 14, 12];

/**
 * THE HYMN — `call`'s tune, one note a beat over sixteen bars, mostly rests.
 *
 * ⚠️ **HALF-NOTES AND SILENCE, WHICH IS THE WHOLE DIFFERENCE FROM LEVEL ONE'S `call`.** The base's is
 * a riff: a note on most beats, climbing to a top note and sitting there. This is plainchant — two
 * notes a bar, stepwise, each phrase four bars long and ending where a breath goes. A tune with rests
 * in it is a tune somebody is singing.
 */
const HYMN: readonly (number | null)[] = [
  0, _, 3, _,
  2, _, 0, _,
  -2, _, 0, _,
  3, _, _, _,
  7, _, 5, _,
  3, _, 2, _,
  0, _, -2, _,
  0, _, _, _,
  5, _, 8, _,
  7, _, 5, _,
  3, _, 0, _,
  2, _, _, _,
  5, _, 2, _,
  3, _, 0, _,
  -2, _, 2, _,
  0, _, _, _,
];

/**
 * THE COUNTER-LINE — what the strings play against the choir when the symphony arrives.
 *
 * ⚠️ **It falls where `HYMN` rises, which is what a counter-melody IS.** Two lines that move together
 * are one line played twice, and `docs/decisions/0125-the-build-starts-sooner.md` says a section is
 * heard by what ARRIVES — so what `surge` opens has to be audibly a different voice rather than more
 * of the one already singing.
 */
const COUNTER: readonly (number | null)[] = [
  7, _, 5, _,
  3, _, 2, _,
  0, _, 2, _,
  3, _, _, _,
  10, _, 7, _,
  5, _, 2, _,
  0, _, _, _,
  -2, _, 0, _,
  12, _, 10, _,
  7, _, 5, _,
  3, _, 0, _,
  2, _, _, _,
  8, _, 5, _,
  3, _, 0, _,
  2, _, 5, _,
  2, _, _, _,
];

/**
 * THE PEDALBOARD, RUNNING — eight notes a bar under everything, and it is the undercurrent.
 *
 * ── THE FIRST VERSION WAS TWO NOTES A BAR AND THAT WAS THE WHOLE PROBLEM ────────────────────────
 *
 * ⚠️ **`docs/decisions/0134-the-place-keeps-the-games-pace.md`.** Reported of the hymn:
 * *"it doesn't fit the high paced gameplay we want yet… it's very high on the treble with no deep
 * bassy times and needs either an undercurrent or emphasis riff that speeds through as a
 * counterpoint."* Measured, level two opened at **61 notes a bar against level one's 118**, and the
 * bass was a held pedal: present in the band meter, motionless to an ear.
 *
 * ⚠️ **A RUNNING PEDAL IS THE ONE ANSWER THAT IS BOTH HALVES.** Eight notes a bar in the bottom
 * octave is deep AND fast, so *no deep bassy times* and *nothing speeds through* are one fix rather
 * than two — and it is what an organ toccata actually does with its feet. Nothing about the hymn over
 * the top of it changed.
 *
 * ⚠️ **Derived from the progression rather than typed**, like `MIXTURE`: a hundred and twenty-eight
 * numbers that have to agree with sixteen others is the thing that goes wrong silently.
 */
const PEDAL: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const fifth = FIFTH[bar]!;
  // Root, octave, fifth, root · root, fifth, root, fifth — the foot pattern, and the octave on the
  // second eighth is what stops it being a drone with a rhythm drawn on it.
  return [root, root + 12, fifth, root, root, fifth, root + 12, fifth];
});

/**
 * The organ's registration: root, fifth and octave, six times a bar.
 *
 * ⚠️ **IT WAS TWICE A BAR, WHICH IS A PAD AND NOT A REGISTRATION** — 0134. Four notes a bar across
 * both ranks is the thing a listener hears as *the chord changed*, not as *the organ is playing*. Six
 * eighths with two rests in them is a hand on a manual.
 */
const REGISTER: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const fifth = FIFTH[bar]!;
  return [root, fifth, root + 12, _, root, fifth, _, root + 12];
});

/**
 * THE STRING OSTINATO — sixteen a bar, and it is the SURGE's own styling.
 *
 * ⚠️ **THREE SECTIONS, THREE KINDS OF FAST** — 0134: *"a different styling for opening, push and
 * surge."* The opening runs eighths in the organ's feet, `push` runs sixteenths in its top rank, and
 * this is neither: a bowed tremolo between two notes of the chord, which is what an orchestra does
 * when it wants urgency and has already used its brass.
 *
 * ⚠️ **It alternates rather than walking**, which is the difference between an ostinato and an arp —
 * `MIXTURE` climbs through the chord and this scrubs across two notes of it. Two sixteenth-note
 * layers that both walked would be one layer twice.
 */
const OSTINATO: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [
    root, fifth, root, fifth,
    root, fifth, root, fifth,
    third, fifth, third, fifth,
    root, fifth, root, fifth,
  ];
});

/**
 * The high stabs: the organ's top rank, on the bar each four-bar phrase turns on.
 *
 * ⚠️ **Asked for by name** — 0134: *"it also needs some really higher octave hits as well in a few
 * spots."* Four in sixteen bars, an octave over the registration, and nothing else in the piece plays
 * up there while the organ is out.
 */
const STABS: readonly (number | null)[] = ROOT.flatMap((root, bar) =>
  bar % 4 === 3 ? [root + 12, _, FIFTH[bar]! + 12, _, root + 12, _, _, _] : [_, _, _, _, _, _, _, _],
);

/**
 * The mixture stop: eight notes a bar walking the chord, which is what makes an organ an organ.
 *
 * ⚠️ **Derived from the progression rather than typed out**, because a hundred and twenty-eight
 * hand-written numbers that have to agree with sixteen others is the thing that goes wrong silently.
 */
const MIXTURE: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  /*
    ⚠️ **SIXTEENTHS, AND THE PUSH'S OWN STYLING IS THIS LINE** — 0134: *"a different styling for
    opening, push and surge."* The opening runs eighths in the feet; this runs sixteenths in the top
    of the organ, which is a toccata and is a different KIND of fast rather than more of the same one.
  */
  return [
    root, third, fifth, third,
    root + 12, third, fifth, root + 12,
    fifth, third, root, third,
    fifth, root + 12, fifth, third,
  ];
});

/**
 * Everything Ember Nebula plays instead of the base composition.
 *
 * ⚠️ **TWENTY-ONE OF THE TWENTY-THREE, and the two left out are `bass` and `beat`**,
 * which `docs/decisions/0095-the-level-has-its-own-music.md` closes everywhere except the title. A
 * place cannot re-voice something it never sounds.
 *
 * ⚠️ **THERE IS NO SMALLER HONEST SET, AND THAT IS WORTH SAYING BEFORE THE MEMORY BILL.** Every layer
 * shared is level one's material inside the choir — a drum kit under a hymn, a square-wave riff under
 * an organ. *"Not just riffs on the same track over and over again"* is a statement about the whole
 * arrangement, and a place that shares half of it is a riff on the same track.
 */
export const NEBULA_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ── THE PEDAL: what is under the whole level, and it never stops ─────────────────────────────────

    ⚠️ **A drone in a stone room, rather than the base's synth pad.** Two bars, so it says nothing
    about the progression and cannot be wrong over it — the same trick the base's drone uses, voiced as
    a held organ 16' with a fifth in it. The slow attack is the room, not the instrument.
  */
  drone: [
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.15, attack: 0.5, curve: 0.9, lowFrom: 620, lowTo: 900, q: 0.9 },
    },
    {
      // The fifth, which is what stops a pedal being a note and makes it a chord that never resolves.
      steps: [7, 7],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.085, attack: 0.66, curve: 0.9, lowFrom: 540, lowTo: 820, q: 1 },
    },
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.2, attack: 0.32, curve: 0.9 },
    },
    {
      // An octave up and barely there: the harmonic that makes the pedal read as pipes rather than as a pad.
      steps: [12, 12],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.5, gain: 0.055, attack: 0.8, curve: 0.9, lowFrom: 900, lowTo: 1700, q: 0.9 },
    },
  ],

  /*
    ── THE BOTTOM: the progression's own root, and a processional heart under it ────────────────────

    ⚠️ **`sub` IS WHERE THIS PLACE PUTS EVERYTHING BELOW 130 Hz**, on purpose. `LAYER_PAN` centres
    `sub`, `drone`, `groove`, `engine` and `stomp` and places the other fourteen off centre, and
    `tests/music.test.ts` refuses a low-heavy layer anywhere but the middle — so a choir's bass section
    lives here and in `drone`, and the pitched layers that are placed stay above it.
  */
  sub: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.15, gain: 0.42, attack: 0.12, curve: 0.95 },
    },
    {
      /*
        THE PROCESSIONAL. One struck note a bar and a lighter one before the turn — a drum being
        carried rather than a kick being played. The base's `sub` has a four-on-the-floor in it; this
        is the same layer doing the same job at a walking pace.
      */
      steps: [
        1, _, 0.5, _, 0.62, _, 0.46, _, 1, _, 0.5, _, 0.6, _, 0.48, 0.44,
        1, _, 0.52, _, 0.64, _, 0.46, _, 1, _, 0.5, _, 0.6, _, 0.5, 0.46,
        1, _, 0.5, _, 0.62, _, 0.48, _, 1, _, 0.52, _, 0.6, _, 0.46, 0.5,
        1, _, 0.54, _, 0.66, _, 0.48, _, 1, _, 0.5, _, 0.68, _, 0.56, 0.52,
      ],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 96, to: 36, seconds: 0.62, gain: 0.44, attack: 0.004, curve: 2.1, drive: 0.12 },
    },
    {
      // The fifth under the root, held long enough to blur into it. An organ's quint, not a bass line.
      steps: FIFTH.flatMap((fifth) => [fifth, _, _, _]),
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.9, 0.86, 0.94],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 3.4, gain: 0.2, attack: 0.2, curve: 1.1 },
    },
  ],

  /*
    ── THE KIT, WHICH IS NOT A KIT ──────────────────────────────────────────────────────────────────

    ⚠️ **`engine` IS THE LEVEL'S RHYTHM LAYER AND A HYMN DOES NOT HAVE ONE.** The base is a
    four-on-the-floor with a clap, a shaker and a sixteenth hat. This is a tam-tam and a breath: a
    struck bronze note on the downbeats and air moving between them. It is the single largest reason
    this place does not sound like level one from the first bar.

    ⚠️ **It is still on the beat and still climbs with the ladder**, so the pace floor 0108 set is a
    question about the mix rather than about the pattern — and `THEMES.nebula.mix` is where it is
    answered.
  */
  engine: [
    {
      /*
        THE PROCESSIONAL, AND IT IS ON EVERY BEAT NOW — 0134. The first version struck twice a bar and
        left the third beat alone, which is what a hymn does and is not what this game does: level one
        opens at 29.5 notes a bar and this opened at 6.5. A drum that lands on every beat is the floor
        under *high paced*, and it is still a bronze strike rather than a kick.
      */
      steps: [1, 0.62, 0.86, 0.6, 0.94, 0.6, 0.84, 0.58, 1, 0.64, 0.88, 0.6, 0.92, 0.66, 0.8, 0.7],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 112, to: 40, seconds: 0.42, gain: 0.5, attack: 0.003, curve: 3.2, drive: 0.22 },
    },
    {
      // The tam-tam that was the whole layer, kept as what it always should have been: an accent.
      steps: [1, _, 0.72, _],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 96, to: 33, seconds: 1.2, gain: 0.32, attack: 0.004, curve: 1.4, drive: 0.15 },
    },
    {
      /*
        THE SIXTEENTH THAT SPEEDS THROUGH. Breath rather than a hat — filtered noise, short, quiet and
        continuous — so the top of the mix has something on every sixteenth from the first bar without
        the place turning into a drum machine. **Nothing in the first version subdivided past an
        eighth**, and that is most of what *doesn't fit the pace* was.
      */
      steps: [
        0.5, 0.26, 0.34, 0.28, 0.44, 0.26, 0.36, 0.3, 0.48, 0.26, 0.34, 0.28, 0.42, 0.28, 0.36, 0.32,
        0.5, 0.26, 0.34, 0.3, 0.44, 0.26, 0.38, 0.28, 0.48, 0.28, 0.34, 0.26, 0.42, 0.3, 0.4, 0.34,
        0.5, 0.26, 0.36, 0.28, 0.44, 0.28, 0.34, 0.3, 0.48, 0.26, 0.36, 0.28, 0.42, 0.26, 0.38, 0.3,
        0.52, 0.28, 0.34, 0.3, 0.46, 0.26, 0.36, 0.28, 0.5, 0.3, 0.38, 0.32, 0.44, 0.34, 0.42, 0.38,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.055, attack: 0.002, curve: 5.5, lowFrom: 5200, lowTo: 2200, highFrom: 900 },
    },
    {
      // The off-beat, which is what turns a pulse into a walk.
      steps: [
        _, 0.44, _, 0.3, _, 0.4, _, 0.32, _, 0.46, _, 0.3, _, 0.38, _, 0.34,
        _, 0.42, _, 0.32, _, 0.44, _, 0.3, _, 0.48, _, 0.34, _, 0.4, 0.36, 0.38,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.16, gain: 0.075, attack: 0.02, curve: 3.2, lowFrom: 3400, lowTo: 1100, highFrom: 480 },
    },
  ],

  /*
    ── THE SMALL METAL: hand bells, and the hiss of a consonant ─────────────────────────────────────

    ⚠️ **`perc` sits at −0.45 and therefore may not be low**, which is a constraint rather than a
    taste: `tests/music.test.ts` measures the baked band energy of every layer and refuses a placed one
    whose weight is under 130 Hz. Bells and breath are what a hymn has up there anyway.
  */
  perc: [
    {
      // The hand bells, doubled up. Still a bell pattern and no longer a bell every other bar.
      steps: [
        1, _, 0.5, _, _, 0.62, _, _, 0.7, _, 0.46, _, 0.84, _, _, 0.5,
        _, 0.58, 0.62, _, _, _, 0.7, _, 0.9, _, 0.48, _, _, 0.66, _, 0.54,
        1, _, 0.52, _, _, 0.6, _, 0.66, 0.72, _, 0.46, _, 0.8, _, 0.56, 0.6,
        _, 0.58, 0.64, _, 0.5, _, _, 0.7, 0.88, _, 0.48, _, 0.7, _, 0.62, 0.66,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'tri', from: 1760, to: 1170, seconds: 0.11, gain: 0.14, attack: 0.001, curve: 5.5, highFrom: 720 },
    },
    {
      // Sixteenths, unbroken — the other half of *something is always moving*, over the top rather
      // than underneath it.
      steps: [
        0.4, 0.24, 0.3, 0.26, 0.36, 0.24, 0.28, 0.26, 0.38, 0.24, 0.3, 0.26, 0.34, 0.26, 0.3, 0.28,
        0.4, 0.24, 0.3, 0.26, 0.36, 0.26, 0.28, 0.24, 0.38, 0.26, 0.3, 0.28, 0.34, 0.28, 0.32, 0.3,
        0.42, 0.24, 0.3, 0.26, 0.36, 0.24, 0.3, 0.26, 0.38, 0.26, 0.3, 0.24, 0.34, 0.26, 0.3, 0.3,
        0.4, 0.26, 0.32, 0.26, 0.36, 0.24, 0.28, 0.28, 0.4, 0.26, 0.3, 0.28, 0.36, 0.3, 0.34, 0.32,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.05, attack: 0.0006, curve: 8, lowFrom: 12000, highFrom: 5400 },
    },
    {
      /*
        THE FRAME DRUM, AND IT IS HERE BECAUSE A MEASUREMENT SAID SO — 0134. This layer measured **0%
        of its energy under 300 Hz** against level one's 41: bells and breath and nothing with a skin
        on it. A place reported as *very high on the treble* had its whole percussion layer above the
        organ.

        ⚠️ **Under 130 Hz is what `LAYER_PAN` forbids here and this sits above it.** `perc` is at
        −0.45 and `tests/music.test.ts` refuses a placed layer whose weight is in the bottom octave —
        a 190 Hz drum falling to 110 is a low-mid, which is the band the report was actually missing.
      */
      steps: [1, _, _, 0.62, _, 0.7, _, _, 0.86, _, _, 0.6, _, 0.72, _, 0.66],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 190, to: 108, seconds: 0.22, gain: 0.34, attack: 0.001, curve: 4.2, drive: 0.22 },
    },
    {
      /*
        THE HIGH HITS, ASKED FOR BY NAME — 0134: *"it also needs some really higher octave hits as
        well in a few spots."*

        ⚠️ **Rare and loud rather than frequent and quiet**, which is what makes a hit a hit: eight in
        sixteen bars, on the bar the phrase turns on. A struck plate at three and a half kilohertz is
        the top of this place's range and nothing else goes near it — so it reads as an event even at
        a gain the mix barely notices.
      */
      steps: [1, _, _, 0.72, _, _, 0.86, _, _, _, 0.78, _, 1, _, _, 0.8],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'tri', from: 3520, to: 2640, seconds: 0.26, gain: 0.11, attack: 0.0008, curve: 3.4, highFrom: 1800 },
    },
  ],

  /*
    ── THE CHOIR ────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **SIX VOICES, ALL SUSTAINED, AND NOT ONE OF THEM IS A STAB.** Level one's `chords` is two held
    saws, an offbeat fifth, a top voice and two short low articulations — a pad with a rhythm drawn on
    it, because that piece needs to move. A choir does the opposite: every voice enters slowly, holds
    for longer than its bar and overlaps the next chord. The overlap is the reverb this project has no
    reverb for.

    ⚠️ **THE ATTACK IS THE INSTRUMENT.** 0.5–0.75s of rise on each voice, staggered so they do not all
    arrive together, is what turns four saws into people breathing in at slightly different moments.
    Nothing else in this synthesiser sounds like that, and it costs one number per voice.

    ⚠️ **THE LOWPASS OPENS RATHER THAN CLOSES**, which is the opposite of every pad in the base. A
    vowel brightens as a voice pushes; a synth pad decays into the dark. `lowFrom` under `lowTo` on the
    four sung voices is the whole difference and it is deliberate.
  */
  chords: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      // Bar 1 and 9 are where the phrase turns; 13 is the diminished bar and leans in rather than back.
      accents: [1, 0.84, 0.9, 0.8, 0.94, 0.86, 1, 0.78],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 6, gain: 0.15, attack: 0.55, curve: 1.4, lowFrom: 760, lowTo: 1500, q: 1 },
    },
    {
      steps: FIFTH,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.84, 0.9, 0.8, 0.94, 0.86, 1, 0.78],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 6, gain: 0.1, attack: 0.7, curve: 1.4, lowFrom: 700, lowTo: 1380, q: 1.1 },
    },
    {
      // The altos. An octave above the roots, so the chord has a middle rather than a gap.
      steps: THIRD,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      accents: [0.94, 0.82, 1, 0.8, 0.9, 0.86, 0.96, 0.76],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 6, gain: 0.115, attack: 0.62, curve: 1.4, lowFrom: 980, lowTo: 1900, q: 1 },
    },
    {
      steps: DESCANT,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      accents: [0.9, 1, 0.82, 0.94, 0.88, 1, 0.84, 0.74],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 6, gain: 0.085, attack: 0.5, curve: 1.45 },
    },
    {
      // The darkest vowel — the same roots, filtered down to an *ooh*. Two vowels is a choir; one is an organ.
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 6, gain: 0.075, attack: 0.78, curve: 1.4, lowFrom: 480, lowTo: 760, q: 1.3 },
    },
    {
      /*
        THE ARTICULATION, AND ITS ABSENCE IS WHY THE CHOIR SAT STILL — 0134. Level one's `chords` has
        an offbeat stab in it and says in its own comment that it is *"the voice that stops being a
        bong"*; this had six sustained voices and nothing that arrived anywhere except beat one, which
        measured six notes a bar against level one's fourteen.

        ⚠️ **Eighths on the off-beat, short, and the choir is still holding underneath.** It reads as
        a syllable rather than as a new instrument — the same line the roots are singing, pushed.
      */
      steps: ROOT.flatMap((root, bar) => [_, FIFTH[bar]!, _, root + 12, _, FIFTH[bar]!, _, THIRD[bar]!]),
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.7, 0.86, 0.68],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.075, attack: 0.02, curve: 3.2, lowFrom: 900, lowTo: 520, q: 1.1 },
    },
    {
      /*
        THE AIR. A room full of people is audible before any of them sings, and this is the only voice
        here that is not a note: filtered noise on a one-and-a-third second swell, under everything.
        Take it out and the choir becomes an organ again.
      */
      steps: [1, 0.9, 0.95, 0.88, 1, 0.9, 0.96, 0.84, 1, 0.92, 0.94, 0.88, 1, 0.9, 0.92, 0.8],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 6, gain: 0.03, attack: 1.3, curve: 1.5, lowFrom: 6200, lowTo: 2600, highFrom: 1500, q: 0.7 },
    },
  ],

  /*
    ── THE HYMN ─────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **TWO NOTES A BAR AND A REST EVERY FOURTH ONE.** The base's `call` plays on most beats; this is
    the layer where *haunting* actually lives, and the silence is most of it. The pair are one line an
    octave apart — a cantor and the room answering, which is the same doubling 0128 used and the only
    thing kept from it.
  */
  call: [
    {
      steps: HYMN,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.74, 0.88, 0.7],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.7, gain: 0.11, attack: 0.09, curve: 1.2, lowFrom: 2200, lowTo: 1100, q: 1 },
    },
    {
      steps: HYMN,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.74, 0.88, 0.7],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.05, attack: 0.13, curve: 1.1 },
    },
  ],

  /*
    ── THE ORGAN, WHICH IS THREE LAYERS AND NOT ONE ─────────────────────────────────────────────────

    ⚠️ **AN ORGAN IS A STOP LIST, AND THE LADDER IS ALREADY ONE.** A pipe organ gets loud by adding
    ranks at the same pitch class — pedal, then the eight-foot chorus, then the mixture — and
    `MUSIC_LADDER` opens `groove`, then `hook`, then `arp` on exactly that shape. So the three layers
    below are three ranks, and pulling them is what the rung already does.

    ⚠️ **THE DECAY IS WHAT MAKES IT AN ORGAN AND NOT A SYNTH.** Every voice here has `curve` near or
    below 1, so a note is at most halfway down when the next one starts: a pipe holds until the key
    comes up. Every equivalent voice in the base decays at 4 to 7, because it is being plucked.
  */
  /*
    ⚠️ **THE UNDERCURRENT, AND IT OPENS AT `run`** — 0134. Three ranks of a running pedal: the reed
    that gives it teeth, the sine that gives it weight, and an octave up so the FIGURE is audible
    rather than just the pressure. Twenty-four notes a bar where the held version had four and a half.

    ⚠️ **The envelope is short now and it was a sustain.** A pedal that holds through its own next
    note is a drone whatever the pattern says; at 0.42 of a beat each note stops before the next
    starts, which is what makes eight of them a RUN rather than a smear.
  */
  groove: [
    {
      steps: PEDAL,
      pitched: true,
      perBeat: 2,
      octave: 0,
      // Heavy on one and on the second half of the bar — the two places a foot lands hardest.
      accents: [1, 0.72, 0.9, 0.7],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.46, gain: 0.26, attack: 0.006, curve: 2.2, lowFrom: 620, lowTo: 300, q: 1.2, drive: 0.16 },
    },
    {
      steps: PEDAL,
      pitched: true,
      perBeat: 2,
      octave: 0,
      accents: [1, 0.72, 0.9, 0.7],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.5, gain: 0.52, attack: 0.004, curve: 1.9 },
    },
    {
      // The 8′ rank, an octave over the feet. Without it the run is felt and not heard.
      steps: PEDAL,
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.38, gain: 0.055, attack: 0.006, curve: 3, lowFrom: 1100, lowTo: 560, q: 1.3 },
    },
  ],

  hook: [
    {
      steps: REGISTER,
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.76, 0.9, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.5, gain: 0.13, attack: 0.01, curve: 1.9, lowFrom: 950, lowTo: 520, q: 1 },
    },
    {
      // The four-foot rank: the same notes an octave up, which is how an organ gets brighter without
      // getting louder.
      steps: REGISTER,
      pitched: true,
      perBeat: 2,
      octave: 2,
      accents: [1, 0.76, 0.9, 0.74],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.46, gain: 0.055, attack: 0.012, curve: 2.1, lowFrom: 2900, lowTo: 1900, q: 1.1 },
    },
    {
      // The top rank, four bars in four — 0134's *higher octave hits*, on the organ rather than on the
      // bells, so the two land in different places and read as two different events.
      steps: STABS,
      pitched: true,
      perBeat: 2,
      octave: 3,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.042, attack: 0.004, curve: 2.6, lowFrom: 6200, lowTo: 3400, q: 1.4 },
    },
  ],

  arp: [
    {
      steps: MIXTURE,
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.7, 0.84, 0.68],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.05, attack: 0.004, curve: 2.4, lowFrom: 3400, lowTo: 2400, q: 1.2 },
    },
    {
      steps: MIXTURE,
      pitched: true,
      perBeat: 4,
      octave: 3,
      accents: [1, 0.7, 0.84, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.024, attack: 0.005, curve: 2.8, lowFrom: 5400, lowTo: 3600, q: 1 },
    },
  ],

  /*
    ── THE SHIMMER: a bowed cymbal, which is the closest this synthesiser gets to a room ────────────
  */
  ride: [
    {
      steps: [
        0.7, 0.34, 0.4, 0.3, 0.6, 0.32, 0.38, 0.28, 0.72, 0.34, 0.42, 0.3, 0.58, 0.32, 0.4, 0.5,
        0.68, 0.34, 0.4, 0.28, 0.62, 0.32, 0.36, 0.3, 0.74, 0.34, 0.44, 0.3, 0.6, 0.34, 0.42, 0.52,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.36, gain: 0.042, attack: 0.02, curve: 1.9, lowFrom: 9200, lowTo: 5000, highFrom: 4200, q: 0.7 },
    },
  ],

  /*
    ── THE SYMPHONY: what `surge` opens, and it is a different KIND of voice ────────────────────────

    ⚠️ **`docs/decisions/0125-the-build-starts-sooner.md` FOUND THAT ONLY ARRIVALS ARE HEARD**, and
    that a section adding twenty notes over an already-dense bar is not one. So the third stage is not
    a louder choir: it is **bowed strings**, a line that falls where the hymn rises, and a swell —
    three things nothing in the first two stages has done. `counter` and `crash` between them bring the
    +60 notes a bar 0125 asked for by name.
  */
  counter: [
    {
      steps: COUNTER,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [0.88, 0.64, 1, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.26, attack: 0.1, curve: 1.15, lowFrom: 1150, lowTo: 620, q: 1.1 },
    },
    {
      steps: COUNTER,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [0.88, 0.64, 1, 0.72],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.16, attack: 0.13, curve: 1.1 },
    },
    {
      // The tremolo under the line — the surge's own fast texture, and the third one in the piece.
      steps: OSTINATO,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.68, 0.86, 0.66],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.06, attack: 0.006, curve: 2.8, lowFrom: 1050, lowTo: 520, q: 1.2 },
    },
  ],

  crash: [
    {
      /*
        A SWELL AND NOT A HIT. 0.4s of rise on a 1.4s cymbal is the orchestral gesture the base's
        `crash` deliberately is not — the base is punctuation, arriving on the beat. This one arrives
        BEFORE the beat and lands on it, which is why the pattern puts it a bar early.
      */
      steps: [0.95, _, _, _, _, _, _, _, 0.8, _, _, _, _, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 1.4, gain: 0.055, attack: 0.42, curve: 1.1, lowFrom: 11000, lowTo: 3400, highFrom: 2400, q: 0.5 },
    },
    {
      // The choir shouting on the swell's peak — the one place in the hymn anybody raises their voice.
      steps: [0, _, _, _, _, _, _, _, 7, _, _, _, _, _, _, _],
      pitched: true,
      perBeat: 1,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.2, gain: 0.07, attack: 0.06, curve: 1.4, lowFrom: 2400, lowTo: 1000, q: 1.2 },
    },
  ],

  drive: [
    {
      // The tremulant: the mixture chattering under everything once the organ is at full.
      steps: [
        0, 7, 12, 7, 12, 7, 0, 7, 0, 7, 12, 7, 10, 7, 0, 7,
        0, 7, 12, 7, 12, 7, 0, 7, 0, 5, 7, 5, 7, 5, 0, 5,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.64, 0.82, 0.62],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.056, attack: 0.004, curve: 2.8, lowFrom: 2600, lowTo: 1500, q: 1.6 },
    },
    {
      steps: [1, _, 0.7, _, 0.9, _, 0.68, _, 1, _, 0.72, _, 0.88, _, 0.7, 0.8],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 168, to: 62, seconds: 0.3, gain: 0.46, attack: 0.001, curve: 3.4, drive: 0.26 },
    },
  ],

  /*
    ── THE FIRE ARRIVING: `approach`, which is the last twelve seconds of the level ─────────────────

    ⚠️ **THE BELL IS BRONZE AND THE BASE'S IS GLASS.** A great bell's partials are inharmonic and its
    strike is a thud with a hum under it, which is what the noise voice below is for. It is also the
    one layer here that does not need re-writing to belong — the base's `toll` is already a bell — and
    it was re-voiced anyway, because a cathedral bell and a ship's bell are not the same object.

    ⚠️ **`dread` IS THE TRITONE, AND IT IS THE FIRST TIME THE PIECE STATES IT ALONE.** B against F has
    been sitting in bar thirteen of the progression since the first hymn; here it is held for four bars
    with nothing else in it. That is the hinge between the cathedral and what is under it.
  */
  toll: [
    {
      steps: [0, _, -5, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.9, gain: 0.34, attack: 0.008, curve: 1.25, lowFrom: 1700, lowTo: 900, q: 1.8 },
    },
    {
      /*
        THE HUM. A bell's hum is an octave under its strike note and is the quietest thing in it —
        which is the physics and is also what the band guard requires: this layer sits at −0.5 and may
        not carry its weight under 130 Hz.
      */
      steps: [0, _, -5, _],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.11, attack: 0.03, curve: 1.1 },
    },
    {
      // The tierce: a bell's loudest partial is a minor third above its note, and it is why a bell is sad.
      steps: [3, _, -2, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.5, gain: 0.16, attack: 0.02, curve: 1.7 },
    },
    {
      steps: [7, _, 2, _],
      pitched: true,
      perBeat: 0.25,
      octave: 3,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.07, attack: 0.55, curve: 1.2, lowFrom: 1800, lowTo: 4200, q: 1.4 },
    },
    {
      /*
        The strike itself, which is a noise and not a note.

        ⚠️ **IT IS BRIGHT BECAUSE THE GUARD SAID SO, AND THAT IS THE MEASUREMENT DOING ITS JOB.** The
        first draft of this bell was **49% of its energy below 130 Hz at a pan of −0.5**, which
        `tests/music.test.ts` refuses — a placed low end spends headroom on one side and arrives in a
        room as the same non-directional thump anyway. A cathedral bell is a low STRIKE NOTE with a
        great deal of metal above it; what was missing was the metal.
      */
      steps: [1, _, 0.86, _],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.115, attack: 1.1, curve: 1.3, lowFrom: 760, lowTo: 3400, highFrom: 320, q: 0.8 },
    },
  ],

  dread: [
    {
      steps: [2, 8, 2, 8],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.94, 0.98, 1],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.088, attack: 0.55, curve: 1.05, lowFrom: 360, lowTo: 1150, q: 2.4 },
    },
    {
      // The other half of the interval, underneath, so the two are heard as one sound going wrong.
      steps: [8, 2, 8, 2],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.5, gain: 0.11, attack: 0.5, curve: 1 },
    },
  ],

  lead: [
    {
      /*
        THE SOLOIST. One voice over the top of the organ from `push` onwards, and the only line in the
        place that goes above the descant. It climbs for three bars and falls in the fourth, which is
        the shape every hymn tune in the world has.
      */
      steps: [
        12, _, 15, _, 14, _, 12, _,
        10, _, 12, _, 14, _, _, _,
        15, _, 17, _, 19, _, 17, _,
        15, _, 14, _, 12, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.7, gain: 0.13, attack: 0.07, curve: 1.35, lowFrom: 2400, lowTo: 4800, q: 1.3 },
    },
    {
      steps: [
        12, _, 15, _, 14, _, 12, _,
        10, _, 12, _, 14, _, _, _,
        15, _, 17, _, 19, _, 17, _,
        15, _, 14, _, 12, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.7, gain: 0.1, attack: 0.09, curve: 1.4 },
    },
  ],

  /*
    ── THE INFERNO ──────────────────────────────────────────────────────────────────────────────────

    ⚠️ **THE FIGHT IS THE SAME CHOIR AND THE SAME ORGAN WITH THE INTERVALS TURNED.** Nothing new
    arrives in the way of instruments — what changes is that every pitched layer the boss opens plays
    **B against F**, **E against F** or **B against C**, and that the drive goes on. A hellish version
    of a piece is more frightening than a different piece, and it is also the only version that is
    still in the key the player's own gun is in.

    ⚠️ **AND IT IS WHY THE PROGRESSION HAS A DIMINISHED BAR.** By the time the boss arrives the
    listener has heard B–D–F once every twenty-five seconds for three minutes.
  */
  stomp: [
    {
      steps: [1, _, 0.7, _, 0.92, _, 0.66, _, 1, _, 0.72, _, 0.9, 0.6, 0.7, 0.8],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 132, to: 34, seconds: 0.36, gain: 0.46, attack: 0.001, curve: 2.9, drive: 0.42 },
    },
    {
      // Chain, not a snare. Metal moving over stone, which is what the tam-tam of the hymn becomes.
      steps: [
        _, 0.4, _, 0.62, _, 0.36, 0.5, _, _, 0.44, _, 0.6, _, 0.38, 0.52, _,
        _, 0.42, _, 0.64, _, 0.34, 0.48, _, _, 0.46, 0.4, 0.62, _, 0.4, 0.54, 0.44,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.055, gain: 0.125, attack: 0.0008, curve: 5.5, lowFrom: 3400, lowTo: 1250, highFrom: 340 },
    },
    {
      steps: [
        0.36, _, 0.28, _, 0.34, _, 0.26, _, 0.36, _, 0.3, _, 0.32, _, 0.28, 0.3,
        0.36, _, 0.28, _, 0.34, _, 0.26, _, 0.38, _, 0.3, _, 0.34, _, 0.28, 0.32,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.026, gain: 0.05, attack: 0.0004, curve: 8, lowFrom: 13000, highFrom: 6800 },
    },
  ],

  frenzy: [
    {
      /*
        THE MIXTURE, POSSESSED. The same organ rank as `arp`, playing B and F against each other on
        sixteenths with a C leaning on the B. Eight bars, so it is a longer figure than the four the
        listener has been hearing — the piece stops fitting its own phrase.
      */
      steps: [
        2, _, 8, 2, 3, _, 2, _, 8, 2, _, 8, 2, 3, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 3, _, 2, _, 8, 2, _, 8, 2, 3, 2, _,
        5, _, 2, 5, 8, _, 5, _, 2, 5, _, 2, 5, 8, _, 5,
        2, _, 8, 2, 3, _, 2, _, 8, 2, _, 8, 2, 3, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, 8, _,
        3, _, 2, 3, 8, _, 3, _, 2, 3, _, 2, 3, 8, _, 3,
        2, _, 8, 2, 8, _, 2, _, 8, 2, 8, 2, 8, 2, 8, 2,
      ],
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.6, 0.84, 0.62],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.078, attack: 0.002, curve: 4.2, lowFrom: 2600, lowTo: 950, q: 2.2, drive: 0.55 },
    },
    {
      steps: [
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 3, _, 2, _, 8, 2, _, 8, 2, 3, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, 8, _,
        2, _, 5, 2, 8, _, 2, _, 5, 2, _, 5, 2, 8, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 3, _, 2, _, 8, 2, _, 8, 2, 3, 2, _,
        8, _, 3, 8, 2, _, 8, _, 3, 8, _, 3, 8, 2, _, 8,
        8, _, 2, 8, 2, _, 8, _, 2, 8, 2, 8, 2, 8, 2, 8,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.62, 0.86, 0.6],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.05, attack: 0.003, curve: 4, lowFrom: 3200, lowTo: 1400, q: 1.8, drive: 0.5 },
    },
  ],

  wraith: [
    {
      /*
        THE CHOIR, SCREAMING. Held notes a minor second apart — E against F, then B against C —
        driven until the vowel comes apart. It is the `chords` voice with the attack taken off and the
        drive put on, which is the whole idea of this section in one voice.
      */
      steps: [
        8, _, 7, _, 8, _, 7, _,
        3, _, 2, _, 3, _, 2, _,
        8, _, 7, _, 8, _, 7, 8,
        2, _, 3, _, 2, _, 3, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.72, 0.9, 0.66],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.95, gain: 0.068, attack: 0.03, curve: 2.1, lowFrom: 2400, lowTo: 820, q: 2.6, drive: 0.8 },
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
      accents: [1, 0.72, 0.9, 0.66],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.048, attack: 0.04, curve: 1.9, lowFrom: 1600, lowTo: 580, q: 2, drive: 0.7 },
    },
  ],

  /*
    ── THE AURA: how near the fire is ───────────────────────────────────────────────────────────────

    ⚠️ **These two are the only layers in the game whose gain is a DISTANCE** — 0091 — so they are the
    place's answer to *the boss is over there*. Here that is a furnace: a low roar that gets louder as
    you close, and the crackle on top of it. Both are two bars, so neither says anything about the
    progression it is heard over.
  */
  auraSlow: [
    {
      steps: [8, _, 2, _, 8, _, 2, _],
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.36, attack: 0.24, curve: 1.5, lowFrom: 380, lowTo: 860, q: 1.3 },
    },
    {
      steps: [2, _, 8, _, 2, _, 8, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.6, gain: 0.5, attack: 0.3, curve: 1.35 },
    },
    {
      // The furnace itself: broadband, slowly opening, and it is what a fire actually is.
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.14, attack: 0.32, curve: 1.4, lowFrom: 760, lowTo: 2400, highFrom: 260, q: 0.7 },
    },
  ],

  auraFast: [
    {
      steps: [8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2, 2, 2, 2, 2],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.19, attack: 0.006, curve: 5, lowFrom: 2600, lowTo: 700, q: 1.6 },
    },
    {
      steps: [_, 2, _, 2, _, 2, _, 2, _, 8, _, 8, _, 8, _, 8],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.26, gain: 0.15, attack: 0.004, curve: 6 },
    },
    {
      // Embers popping. Sample-and-hold noise rather than white, which is what `from` on a noise voice
      // means (`src/app/sound.ts`) — a period, held, and it is the one thing here that is not smooth.
      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 5200, to: 2600, seconds: BEAT_SECONDS * 0.34, gain: 0.1, attack: 0.004, curve: 3.6, lowFrom: 6400, lowTo: 2200, highFrom: 900 },
    },
  ],
};
