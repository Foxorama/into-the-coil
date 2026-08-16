/**
 * THE TOXIC MIRE'S OWN COMPOSITION — something rotting in warm water, and the thing that grows heads.
 *
 * `docs/decisions/0146-three-more-places-and-two-after-them.md`.
 *
 * ── WHAT WAS ASKED FOR ──────────────────────────────────────────────────────────────────────────
 *
 * > *"One will be toxic mire hydra boss."*
 *
 * ⚠️ **TWO NOUNS AND THEY WANT OPPOSITE THINGS, WHICH IS THE WHOLE ARRANGEMENT.** A mire is slow,
 * thick and blurred; a hydra is the fastest boss idea in the brief, because the whole point of it is
 * that cutting one head gives you two. So the level's material is deliberately **smeared** — slow
 * attacks, long overlapping tails, nothing with a sharp front on it — and the fight is the one place
 * that changes, all at once.
 *
 * **THE HYDRA IS A STACK AND NOT A RIFF.** `frenzy`'s two voices play the *same figure* at two
 * transpositions at once, and `wraith` plays it at a third — three heads on one neck, in the same
 * key, arriving together. Nothing else in this game stacks a figure against itself, and it is the
 * cheapest possible way to say *there are more of them than there were*.
 *
 * | the brief | the rung | the layers that carry it |
 * |---|---|---|
 * | still water with something under it | `run` | `drone`, `sub`, `engine`, `perc`, `chords`, `groove`, `call` |
 * | it is moving | `push` | `arp`, `ride`, `hook`, `lead` |
 * | it is coming up | `surge` | `counter`, `crash`, `drive` |
 * | it is out of the water | `approach` | `toll`, `dread` |
 * | heads | `boss` | `stomp`, `frenzy`, `wraith`, and the aura's two |
 *
 * ── HOW A PLACE GETS THICK WITHOUT GETTING SLOW ─────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0134-the-place-keeps-the-games-pace.md` IS THE TRAP THIS PLACE WOULD FALL
 * INTO.** *Sludge* is a description of an envelope, not of a tempo, and Ember Nebula's first version
 * proved that a place written slowly measures slow and plays badly under a fight. So every slow thing
 * here is a slow ATTACK on a fast pattern: `groove` runs sixteenths with a soft front on each note,
 * which comes out as a swamp that is nevertheless moving as fast as the game is.
 *
 * ⚠️ **EVERY NOTE IS A TONE OF A NATURAL MINOR** — `docs/decisions/0099-the-cues-are-in-the-key.md`.
 * The rot is in the VOICING: the progression leans on `Dm` and `B°`, and the pads hold a second
 * against the root wherever the chord allows one, so the harmony is permanently slightly wrong
 * without ever being outside the key the player's own gun is tuned to.
 */

import { BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * THE PROGRESSION — sixteen bars, and it never touches C major.
 *
 * ⚠️ **`Dm Am B° F · Dm Em Am Am · F B° Dm G · Am F Em B°`.** Three of the four phrases end on a
 * diminished chord or a minor one and the loop's last bar is `B°` — B, D and F, the tritone the scale
 * contains. The one bright chord the key offers is C major and it is not here at all, which is what
 * makes the whole loop sit in the same swampy colour without a single note outside A minor.
 *
 * ⚠️ **Hoisted, because eight voices spell the same sixteen chords**, on `src/content/nebula.ts`'s
 * terms.
 */
const ROOT: readonly number[] = [5, 0, 2, -4, 5, -5, 0, 0, -4, 2, 5, -2, 0, -4, -5, 2];
const THIRD: readonly number[] = [8, 3, 5, 0, 8, -2, 3, 3, 0, 5, 8, 2, 3, 0, -2, 5];
const FIFTH: readonly number[] = [12, 7, 8, 3, 12, 2, 7, 7, 3, 8, 12, 5, 7, 3, 2, 8];

/**
 * THE NINTH — the scale tone directly above each root, and it is what makes the pad sour.
 *
 * ⚠️ **A DIATONIC SECOND AND NOT A WHOLE TONE, WHICH IS A REAL DISTINCTION AND NOT A PEDANTRY.** The
 * obvious way to write this is `root + 2`, and it puts a `D♯` over `B°` and an `F♯` over `E` — two
 * notes A minor does not contain, which `tests/themes.test.ts` refuses and which would put the
 * player's own gun out of tune with the level (`docs/decisions/0099-the-cues-are-in-the-key.md`). The
 * interval above a root is a tone or a semitone depending on where in the scale it sits, so the list
 * is written out rather than computed.
 */
const NINTH: readonly number[] = [7, 2, 3, -2, 7, -4, 2, 2, -2, 3, 7, 0, 2, -2, -4, 3];

/**
 * THE CALL FROM THE WATER — `call`'s tune, low, slow and bent.
 *
 * ⚠️ **IT SITS IN THE MIDDLE OF THE MIX RATHER THAN OVER IT, WHICH IS THE OPPOSITE OF EVERY OTHER
 * PLACE'S TUNE.** A hymn is above a choir and a music box is above a corridor; this is *in* the
 * water, so it is voiced an octave lower than instinct puts it and the pad closes over the top of it.
 * A melody you have to listen past is the picture.
 */
const CROAK: readonly (number | null)[] = [
  0, _, -2, _,
  -4, _, _, _,
  2, _, 0, _,
  -2, _, _, _,
  0, _, 2, _,
  3, _, 2, _,
  0, _, -2, _,
  0, _, _, _,
  5, _, 3, _,
  2, _, 0, _,
  -2, _, 0, _,
  2, _, _, _,
  0, _, -4, _,
  -2, _, 0, _,
  2, _, 3, _,
  2, _, _, _,
];

/**
 * WHAT COMES UP AT `surge` — the same shape as `CROAK`, an octave and a half higher, and faster.
 *
 * ⚠️ **THE SAME LINE FROM ABOVE THE SURFACE.** It is not a rotation and not an inversion: it is the
 * tune the level has been muttering, played in the clear, at twice the rate. `RUNG_CLOSES` takes
 * `call` away in the same breath (`src/content/music.ts`), so the ear hears the thing that was under
 * the water come out of it.
 */
const RISEN: readonly (number | null)[] = [
  12, 14, 12, 10,
  8, _, 10, _,
  14, 12, 14, 15,
  10, _, _, _,
  12, 14, 15, 14,
  12, 15, 14, 12,
  10, 12, 10, 8,
  12, _, _, _,
  17, 15, 17, 15,
  14, 12, 14, _,
  10, 12, 14, 12,
  10, _, _, _,
  12, 8, 12, 15,
  14, 12, 10, 12,
  14, 15, 17, 15,
  12, _, _, _,
];

/**
 * THE SLUDGE — sixteen notes a bar in the bottom octave, with a soft front on every one of them.
 *
 * ⚠️ **THE PATTERN IS FAST AND THE ENVELOPE IS NOT, AND THAT IS THE WHOLE TRICK.** A bass with a
 * two-millisecond attack sounds like a pluck; the same notes with a forty-millisecond one sound like
 * something heaving. The rate a listener hears — 0102's own definition of pace — is unchanged.
 *
 * ⚠️ **It walks by step and never leaps**, which is the other half: a line that moves by semitone and
 * tone rather than by fifths cannot be crisp however it is played.
 */
const SLUDGE: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [
    root, root, third, root,
    root, fifth, third, root,
    root, root, third, fifth,
    third, root, root, third,
  ];
});

/**
 * THE BUBBLES — what `push` opens: sixteenths that rise and pop.
 *
 * ⚠️ **A BUBBLE IS A PITCH THAT GOES UP**, which this synthesiser does with `from` under `to` on an
 * unpitched voice and cannot do on a pitched one. So the *figure* climbs instead — every group of
 * four walks upward and then drops back — and the popping is `perc`'s job.
 */
const BUBBLES: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [
    root, third, fifth, root + 12,
    third, fifth, root + 12, third + 12,
    fifth, root + 12, third + 12, fifth + 12,
    root + 12, fifth, third, root,
  ];
});

/** The reed: eight a bar, buzzing, and it is the one thing here with an edge on it. */
const REED: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return bar % 2 === 0
    ? [root + 12, _, third + 12, _, fifth, _, third + 12, _]
    : [third + 12, _, root + 12, fifth, _, third + 12, _, root + 12];
});

/** The drag: two notes scrubbed against each other, sixteen a bar — `surge`'s own texture. */
const DRAG: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  return [
    root, third, root, third,
    root, third, root, third,
    third, root + 12, third, root + 12,
    root, third, root, third,
  ];
});

/**
 * THE HEAD — the figure the hydra grows more of, eight bars long.
 *
 * ⚠️ **ONE ARRAY, PLAYED AT THREE TRANSPOSITIONS AT ONCE.** `frenzy` sounds it at the root and at the
 * fifth and `wraith` sounds it a minor second under the fifth, so the three heads are a fourth apart,
 * a fifth apart and a semitone apart depending on which pair you listen to — consonant, consonant and
 * horrible, all at the same time.
 *
 * ⚠️ **A CONSTANT rather than three hand-written lines**, so cutting one head cannot leave the other
 * two playing something else — which is the failure this repository keeps finding in its own tables.
 */
const HEAD: readonly (number | null)[] = [
  0, _, 3, 0, 5, _, 0, _, 3, 0, _, 3, 0, 5, _, 0,
  3, _, 0, 3, 7, _, 3, _, 0, 3, _, 0, 3, 7, _, 3,
  0, _, 3, 0, 5, _, 0, _, 3, 0, _, 3, 0, 5, 0, _,
  5, _, 3, 5, 0, _, 5, _, 3, 5, _, 3, 5, 0, _, 5,
  0, _, 3, 0, 5, _, 0, _, 3, 0, _, 3, 0, 5, _, 0,
  7, _, 3, 7, 0, _, 7, _, 3, 7, _, 3, 7, 0, 7, _,
  3, _, 5, 3, 0, _, 3, _, 5, 3, _, 5, 3, 0, _, 3,
  0, _, 5, 0, 5, _, 0, _, 5, 0, 5, 0, 5, 0, 5, 0,
];

/** `HEAD`, moved. The one description of *another one grew back*. */
const headAt = (semitones: number): readonly (number | null)[] =>
  HEAD.map((note) => (note === null ? _ : note + semitones));

/**
 * Everything The Toxic Mire plays instead of the base composition.
 *
 * ⚠️ **TWENTY-ONE OF THE TWENTY-THREE, and the two left out are `bass` and `beat`**, which
 * `docs/decisions/0095-the-level-has-its-own-music.md` closes everywhere except the title.
 */
export const MIRE_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ── THE WATER: a held second, and the gas coming off it ─────────────────────────────────────────

    ⚠️ **THE ROOT AND THE NINTH RATHER THAN THE ROOT AND THE FIFTH.** A and B held together is a
    major second — the most unstable interval the scale will give you for nothing — and over two bars
    it never resolves because there is nowhere in a drone for it to go. Every other place in this game
    opens on a consonance; this one opens on a rub.
  */
  drone: [
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.14, attack: 0.55, curve: 0.88, lowFrom: 340, lowTo: 220, q: 1.4 },
    },
    {
      steps: [2, 2],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.085, attack: 0.7, curve: 0.88, lowFrom: 330, lowTo: 215, q: 1.5 },
    },
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.24, attack: 0.4, curve: 0.9 },
    },
    {
      // Gas. Broad, low, and it is the only weather in the place — a mire has no wind in it.
      steps: [1, 1],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.075, attack: 1.1, curve: 1.25, lowFrom: 700, lowTo: 340, highFrom: 120, q: 0.7 },
    },
  ],

  /*
    ── THE BOTTOM: mud, and something turning over in it ───────────────────────────────────────────

    ⚠️ **`sub` IS WHERE THIS PLACE PUTS EVERYTHING BELOW 130 Hz** — `tests/themes.test.ts` refuses a
    low-heavy layer at any pan but centre, and `sub` is the deepest of the five centred layers.
  */
  sub: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.15, gain: 0.36, attack: 0.24, curve: 0.95 },
    },
    {
      /*
        THE TURN. A wet, slow kick — 96 Hz falling to 30 over six hundred milliseconds, with almost
        no attack on it — so the floor of this place lands late and stays. It is the same layer that
        carries a four-on-the-floor in level three, doing the opposite job.
      */
      steps: ROOT.flatMap((_root, bar) =>
        bar % 2 === 1
          ? [1, _, _, 0.62, _, _, 0.72, _, 0.88, _, 0.6, _, _, 0.66, _, 0.7]
          : [1, _, _, _, _, _, 0.7, _, 0.9, _, _, _, _, 0.64, _, _],
      ),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 96, to: 30, seconds: 0.58, gain: 0.42, attack: 0.008, curve: 1.9, drive: 0.2 },
    },
    {
      // The fifth under the root, held long enough to blur into it — the layer that makes the bottom
      // read as depth rather than as a note.
      steps: FIFTH.flatMap((fifth) => [fifth, _, _, _]),
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.86, 0.9, 0.82],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 3.4, gain: 0.2, attack: 0.28, curve: 1.1 },
    },
  ],

  /*
    ── THE KIT: wet things hitting other wet things ────────────────────────────────────────────────

    ⚠️ **NOTHING HERE HAS A SNAP ON IT.** Every hit has two to eight milliseconds of attack and a
    low-passed tail, which is what separates a slap from a click — and it is the single largest reason
    this place does not sound like level three or level five from the first bar.
  */
  engine: [
    {
      // The slap: on the beat, so the place still has a pulse, and it is soft on the front.
      steps: [1, 0.6, 0.86, 0.58, 0.94, 0.6, 0.84, 0.56, 1, 0.62, 0.88, 0.6, 0.92, 0.64, 0.82, 0.7],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.19, gain: 0.11, attack: 0.008, curve: 3.4, lowFrom: 2600, lowTo: 700, highFrom: 260 },
    },
    {
      /*
        THE LOG, HALF SUBMERGED. 176 Hz to 74, struck on the offbeat — the low-mid the slap has none
        of, and the thing that makes the pulse feel like it has weight behind it.
      */
      steps: [
        _, 0.8, _, 0.6, _, 0.74, _, 0.64, _, 0.82, _, 0.6, _, 0.76, _, 0.68,
        _, 0.8, _, 0.62, _, 0.78, _, 0.6, _, 0.84, _, 0.64, _, 0.78, 0.66, 0.72,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 176, to: 74, seconds: 0.26, gain: 0.44, attack: 0.004, curve: 3.2, drive: 0.22 },
    },
    {
      // Sixteenths of insects. Continuous, high, quiet — the top of the mix from the first bar, and
      // the only thing in the place that never stops.
      steps: [
        0.44, 0.24, 0.34, 0.26, 0.4, 0.24, 0.32, 0.26, 0.46, 0.24, 0.34, 0.26, 0.38, 0.26, 0.32, 0.28,
        0.44, 0.24, 0.34, 0.28, 0.4, 0.26, 0.32, 0.24, 0.46, 0.26, 0.34, 0.28, 0.38, 0.28, 0.34, 0.3,
        0.44, 0.24, 0.36, 0.26, 0.4, 0.24, 0.34, 0.26, 0.46, 0.24, 0.34, 0.28, 0.38, 0.26, 0.32, 0.28,
        0.46, 0.26, 0.34, 0.28, 0.42, 0.26, 0.34, 0.28, 0.48, 0.28, 0.36, 0.3, 0.42, 0.32, 0.4, 0.36,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.06, attack: 0.001, curve: 7.5, lowFrom: 11000, highFrom: 5600 },
    },
    {
      // A bubble surfacing. Sample-and-hold noise falling in period, which is the closest this
      // synthesiser gets to a gloop.
      steps: [_, _, 0.8, _, _, _, _, 0.7, _, 0.76, _, _, _, _, 0.66, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 900, to: 3400, seconds: 0.16, gain: 0.075, attack: 0.006, curve: 3, lowFrom: 2200, lowTo: 5200, highFrom: 300 },
    },
  ],

  /*
    ── THE SMALL WET THINGS ────────────────────────────────────────────────────────────────────────

    ⚠️ **`perc` sits at −0.45 and therefore may not be low** — `tests/themes.test.ts`. Drips, reeds
    and insects all live up there anyway, and the one thing that does not — the frame drum below — is
    pitched to sit above 130 Hz on purpose.
  */
  perc: [
    {
      // The drip. Rare, tuned, and the only pure tone in the layer.
      steps: [1, _, _, 0.64, _, _, 0.78, _, _, 0.6, _, 0.84, _, _, 0.68, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 2200, to: 3600, seconds: 0.055, gain: 0.11, attack: 0.001, curve: 6, highFrom: 900 },
    },
    {
      // Reeds moving against each other: sixteenths, dry, and quiet.
      steps: [
        0.42, 0.24, 0.32, 0.26, 0.38, 0.24, 0.3, 0.26, 0.4, 0.24, 0.32, 0.26, 0.36, 0.26, 0.32, 0.28,
        0.42, 0.24, 0.32, 0.28, 0.38, 0.26, 0.3, 0.24, 0.4, 0.26, 0.32, 0.28, 0.36, 0.28, 0.34, 0.3,
        0.44, 0.24, 0.34, 0.26, 0.38, 0.24, 0.32, 0.26, 0.42, 0.24, 0.32, 0.28, 0.36, 0.26, 0.32, 0.28,
        0.42, 0.26, 0.34, 0.28, 0.4, 0.26, 0.32, 0.28, 0.44, 0.28, 0.36, 0.3, 0.4, 0.32, 0.38, 0.34,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.034, gain: 0.05, attack: 0.002, curve: 6, lowFrom: 6200, highFrom: 2000 },
    },
    {
      /*
        THE SKIN. 182 Hz falling to 106 — the low-mid a place made of drips and insects would
        otherwise have nothing in at all, which `src/content/nebula.ts` found by measurement after the
        fact and every place since has taken before it.
      */
      steps: [1, _, 0.62, _, 0.72, _, _, 0.66, 0.86, _, 0.6, _, 0.74, _, 0.64, 0.62],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 182, to: 106, seconds: 0.22, gain: 0.32, attack: 0.003, curve: 4, drive: 0.2 },
    },
    {
      // Something large, a long way off, twice a phrase.
      steps: [_, _, _, _, 0.86, _, _, _, _, _, _, _, 0.74, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.42, gain: 0.085, attack: 0.05, curve: 2.4, lowFrom: 1600, lowTo: 420, highFrom: 200 },
    },
  ],

  /*
    ── THE PAD: a chord with a second in it, and it closes over the tune ───────────────────────────

    ⚠️ **THE SECOND IS THE INSTRUMENT.** Every voicing here holds the ninth against the root, which is
    a note the chord already contains further up and which is poisonous an octave down. It is the same
    argument Ember Nebula makes about building its dissonance inside the key — this one just picks a
    different interval to be wrong with.
  */
  chords: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 5.2, gain: 0.13, attack: 0.5, curve: 1.2, lowFrom: 620, lowTo: 900, q: 1.3 },
    },
    {
      steps: THIRD,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 5.2, gain: 0.1, attack: 0.62, curve: 1.2, lowFrom: 580, lowTo: 840, q: 1.4 },
    },
    {
      steps: FIFTH,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [0.94, 0.82, 1, 0.8, 0.9, 0.86, 0.96, 0.78],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 5.2, gain: 0.1, attack: 0.7, curve: 1.2, lowFrom: 760, lowTo: 1100, q: 1.2 },
    },
    {
      // THE NINTH — the diatonic second over each root, held, and the sourest thing in the opening.
      steps: NINTH,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      accents: [0.8, 0.7, 0.86, 0.68, 0.78, 0.74, 0.82, 0.66],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 5, gain: 0.05, attack: 0.8, curve: 1.25, lowFrom: 1400, lowTo: 2200, q: 1.6 },
    },
    {
      /*
        THE ARTICULATION. Eighths on the off-beat, soft-fronted — the voice that stops a held pad
        measuring six notes a bar and sitting still, which is `src/content/nebula.ts`'s own finding.
      */
      steps: ROOT.flatMap((root, bar) => [_, THIRD[bar]!, _, root + 12, _, FIFTH[bar]!, _, THIRD[bar]!]),
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.7, 0.86, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.32, gain: 0.06, attack: 0.03, curve: 3, lowFrom: 1100, lowTo: 520, q: 1.4 },
    },
    {
      // The bottom of the pad, at 220 Hz — `chords` sits at +0.2 and may not carry its weight under
      // 130, and `MUSIC_ROOT` is 55, so octave 0 and octave 1 are both under it. `sub` has the deep.
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.17, attack: 0.4, curve: 1.05, lowFrom: 1400, lowTo: 900, q: 0.9 },
    },
  ],

  /*
    ── THE SLUDGE: sixteenths with a soft front, from the opening ──────────────────────────────────

    ⚠️ **ALL THREE VOICES WERE OVER BEFORE THEIR OWN ATTACK FINISHED, AND NOT ONE `gain` HERE MOVED
    TO FIX IT** — `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`. The envelope is
    `exp(-curve·u)` across `seconds`, so a note's real length is about `seconds / curve`, and a
    sixteenth at `BEAT_SECONDS` is 100 ms. The bottom voice was **37 ms under a 30 ms ramp**, the
    middle one **27 ms under a 40 ms ramp**, the top one **19 ms under 30 ms** — so they peaked at
    **44%, 22% and 20%** of the gain written beside them, and the bottom one's buffer ran out 4 ms
    before the next note began. *A soft front* was costing the note the whole note, which is the
    defect 0152 found as a "25 ms" ride that measured 2.8 ms and had been answered twice with gain.

    ⚠️ **`seconds` AND `curve` ONLY, AND THE MATERIAL CAME UP 6.2 dB** — −12.6 dB under this place's
    loudest layer to −6.4, so `scripts/weigh-solve.mjs` asks for **2.65 where it asked for 4.20**.
    The three now peak at **71%, 48% and 53%**, and when the next sixteenth lands the bottom voice is
    still at a third of itself and the two above it at a sixth and an eighth: the *long overlapping
    tails* this file's header claims for the place, finally written into a note. **44% of `groove`
    is under 130 Hz before the change and 44% after** — nothing was re-voiced, it was given time to
    sound, and the swamp is the same colour it was.

    ⚠️ **AND THE MASKING WENT WITH IT, WHICH NO GAIN WAS GOING TO BUY.** `scripts/weigh-heard.mjs`
    had `groove` in `low L` with **`sub` +5.1 dB over it** at every rung it sounds — 0152's shape
    exactly, a layer standing behind one specific other layer in one band. It reads `sub −0.9` now,
    and `sub`'s own row names `groove` as the thing over IT. The bottom is still what this place is;
    there are two things in it.

    ⚠️ **THE COST IS AT `surge`, AND IT IS STATED RATHER THAN GLOSSED.** Sustained sixteenths in the
    bottom octave take that rung from 84.3% of the clipping ceiling to **95.8%**, which makes it the
    tightest rung mire has. The place's worst number still improves — `approach` was 96.7% — and the
    `low` share moves 47.6% → 49.1% against a 55% ceiling, but a fourth voice down here would not
    fit and should be argued for against these two numbers.
  */
  groove: [
    {
      steps: SLUDGE,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.5, attack: 0.03, curve: 1.9 },
    },
    {
      steps: SLUDGE,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.17, attack: 0.04, curve: 2.2, lowFrom: 560, lowTo: 260, q: 1.6, drive: 0.3 },
    },
    {
      steps: SLUDGE,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.28, gain: 0.05, attack: 0.03, curve: 2.4, lowFrom: 1300, lowTo: 620, q: 1.5 },
    },
  ],

  /*
    ── THE CALL: the tune, in the water ────────────────────────────────────────────────────────────
  */
  call: [
    {
      steps: CROAK,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.74, 0.9, 0.7],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.7, gain: 0.15, attack: 0.09, curve: 1.4, lowFrom: 900, lowTo: 480, q: 1.8 },
    },
    {
      steps: CROAK,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.74, 0.9, 0.7],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.6, gain: 0.075, attack: 0.13, curve: 1.5, lowFrom: 1600, lowTo: 900, q: 1.4 },
    },
    {
      // The water moving as it sings — a soft noise swell under every note, which is what makes it
      // come from somewhere rather than from an oscillator.
      steps: CROAK.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.24, gain: 0.06, attack: 0.06, curve: 2.6, lowFrom: 1800, lowTo: 700, highFrom: 320, q: 0.9 },
    },
  ],

  /*
    ── THE REED: what `push` opens, and it is the only edge in the place until the fight ───────────
  */
  hook: [
    {
      steps: REED,
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.72, 0.9, 0.7],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.46, gain: 0.135, attack: 0.012, curve: 2.6, lowFrom: 1500, lowTo: 700, q: 2, drive: 0.24 },
    },
    {
      steps: REED,
      pitched: true,
      perBeat: 2,
      octave: 2,
      accents: [1, 0.72, 0.9, 0.7],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.4, gain: 0.07, attack: 0.014, curve: 3, lowFrom: 3200, lowTo: 1700, q: 1.6 },
    },
    {
      // The top of every fourth bar — the one place the reeds all move at once.
      steps: ROOT.flatMap((root, bar) =>
        bar % 4 === 3 ? [_, _, _, _, root + 24, _, THIRD[bar]! + 12, _] : [_, _, _, _, _, _, _, _],
      ),
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.8, gain: 0.075, attack: 0.006, curve: 2.2, lowFrom: 5200, lowTo: 2600, q: 1.5 },
    },
  ],

  /*
    ── THE BUBBLES: sixteenths that climb ──────────────────────────────────────────────────────────

    ⚠️ **TWO TICKS, AT −27.3 dB, AND `push` IS THE ONLY RUNG THIS LAYER SOUNDS AT** — which is
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`'s Ember Nebula case arriving here intact:
    a layer with one appearance that is buried during it *has never been heard at all*, and no
    measurement that asks whether a layer is audible somewhere can find that. Real decay
    (`seconds / curve`) was **22 ms and 13 ms** inside a 100 ms sixteenth; ten decibels under `hook`
    and within two of `crash`; **−48.5 dBFS** at `push`, on the far side of the −36 that `tests/pace.ts`
    calls quiet whatever else is playing.

    ⚠️ **THE TWO VOICES ARE NOW NEAR ENOUGH EQUAL, AND THAT IS THE MASKING FIX RATHER THAN THE LEVEL
    ONE.** Weight off the octave-2 tri and onto the octave-3 sine moves the layer's window out of
    `mid L`, where `chords` sat **15.2 dB** over it, and into `himid L`, where **nothing in this
    place is above it** (`lead −0.1`). Margin **−18.7 → −3.7**, out **−36.2 dBFS**, and
    `scripts/weigh-solve.mjs` asks **0.92 where it asked 4.91**.

    ⚠️ **73 AND 76 ms OF DECAY, WHICH IS A TAIL AND NOT A WASH.** Each bubble is still at a quarter
    of itself when the next arrives, so the figure that climbs still articulates — the popping is
    `perc`'s job, and a bubble that rings is not a bubble.
  */
  arp: [
    {
      steps: BUBBLES,
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.68, 0.86, 0.66],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.11, attack: 0.006, curve: 2.3, lowFrom: 3000, lowTo: 1700, q: 1.4 },
    },
    {
      steps: BUBBLES,
      pitched: true,
      perBeat: 4,
      octave: 3,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.105, attack: 0.005, curve: 2.2 },
    },
  ],

  /*
    ── THE RIDE: something rustling, continuously, that is not the insects ─────────────────────────
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
      // ⚠️ 17 ms of decay where `curve: 6` over 0.04 s gave 7 — the least sick of the six and the same
      // line — `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`. The gain comes down by the same
      // fifth; the attack and the band, which are this place's own, do not move.
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.135, attack: 0.001, curve: 4, lowFrom: 8000, highFrom: 3000 },
    },
  ],

  /*
    ── THE LEAD: four bars, and it is the one line that gets above the water before `surge` does ───
  */
  lead: [
    {
      steps: [
        12, _, 10, _, 12, _, 14, _,
        15, _, 14, _, 12, _, _, _,
        10, _, 12, _, 14, _, 15, _,
        14, _, 12, _, 10, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.6, gain: 0.12, attack: 0.06, curve: 1.4, lowFrom: 2400, lowTo: 1300, q: 1.5 },
    },
    {
      steps: [
        12, _, 10, _, 12, _, 14, _,
        15, _, 14, _, 12, _, _, _,
        10, _, 12, _, 14, _, 15, _,
        14, _, 12, _, 10, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.6, gain: 0.09, attack: 0.08, curve: 1.35 },
    },
  ],

  /*
    ── THE RISEN: `surge`, and it is the thing coming out of the water ─────────────────────────────
  */
  counter: [
    {
      steps: RISEN,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.19, attack: 0.03, curve: 1.9, lowFrom: 3000, lowTo: 1400, q: 1.7 },
    },
    {
      steps: RISEN,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.1, attack: 0.04, curve: 1.8, lowFrom: 1400, lowTo: 700, q: 1.5 },
    },
    {
      steps: DRAG,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.66, 0.86, 0.64],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.06, attack: 0.012, curve: 3, lowFrom: 1200, lowTo: 560, q: 1.4 },
    },
  ],

  /*
    ── THE SURFACE BREAKING ────────────────────────────────────────────────────────────────────────
  */
  crash: [
    {
      steps: [0.95, _, _, _, _, _, _, _, 0.82, _, _, _, _, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 1.3, gain: 0.125, attack: 0.24, curve: 1.4, lowFrom: 6200, lowTo: 1400, highFrom: 500, q: 0.6 },
    },
    {
      // The water falling back. Sample-and-hold noise, dropping in period, which is a wash rather
      // than a hiss.
      steps: [_, _, _, 1, _, _, _, _, _, _, _, 0.8, _, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 5200, to: 1200, seconds: 0.9, gain: 0.11, attack: 0.02, curve: 2.2, lowFrom: 4200, lowTo: 900, highFrom: 240 },
    },
  ],

  /*
    ── THE DRIVE: two bars, and it says nothing about the harmony ──────────────────────────────────
  */
  drive: [
    {
      steps: [
        0, 2, _, 3, _, 2, 0, _, 0, _, 2, 3, _, 2, _, 0,
        0, 2, _, 3, _, 2, 0, 3, 0, _, 2, 3, _, 2, 3, 0,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.62, 0.84, 0.6],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.19, gain: 0.06, attack: 0.008, curve: 3.2, lowFrom: 2400, lowTo: 1200, q: 1.8 },
    },
    {
      // The mass under it, so `approach` still has a floor when `groove` closes.
      steps: [1, _, 0.7, _, 0.88, _, 0.68, 0.64, 1, _, 0.72, _, 0.86, _, 0.7, 0.8],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 156, to: 54, seconds: 0.32, gain: 0.5, attack: 0.004, curve: 3, drive: 0.24 },
    },
  ],

  /*
    ── THE APPROACH: a bell that has been in the water a long time ─────────────────────────────────

    ⚠️ **`toll` SITS AT −0.5 AND MAY NOT BE LOW**, so a sunken bell is voiced as its partials: a dull
    strike high up, a fifth over it, and a great deal of wet air. `src/content/nebula.ts` learned this
    from a first cathedral bell that was 49% under 130 Hz and passed every guard in the repository.
  */
  toll: [
    {
      steps: [0, _, 5, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.8, gain: 0.3, attack: 0.05, curve: 1.3, lowFrom: 1300, lowTo: 620, q: 2 },
    },
    {
      steps: [3, _, 8, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.15, attack: 0.06, curve: 1.6 },
    },
    {
      steps: [7, _, 0, _],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.14, attack: 0.09, curve: 1.4, lowFrom: 800, lowTo: 460, q: 1.2 },
    },
    {
      steps: [1, _, 0.86, _],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 3.8, gain: 0.085, attack: 0.9, curve: 1.3, lowFrom: 900, lowTo: 2600, highFrom: 300, q: 0.8 },
    },
  ],

  /*
    ── THE DREAD: the tritone, which the loop's last bar has been sounding all level ───────────────

    ⚠️ **ITS MATERIAL WAS NEVER THE PROBLEM AND ITS BAND WAS.** −9.3 dB under this place's loudest
    layer is mid-pack, and `scripts/weigh-solve.mjs` still wanted **3.13** — because `weigh-heard`
    had it in `low R` with `sub` +2.5 dB over it, which is
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`'s *the layers that cannot be heard are not
    the quiet ones, they are the ones standing behind a layer that is doing fine*. So the raise is on
    the **saw** and not the sine: the voice band-passed 280→720 Hz is the only part of this layer
    `sub` is not standing on, and the sine underneath it is the bottom this place is made of.

    ⚠️ **AND `curve` IS THE LEVER, BECAUSE THE CLIPPING BOUND IS A PEAK AND THE MATERIAL ONE IS AN
    RMS.** 1.05 → 0.85 over a `perBeat: 0.25` step leaves each note at **48% when the next arrives**
    rather than 37%, so B and F overlap as a sounding tritone for a quarter of a second instead of
    for eighty milliseconds — more of what this layer already is, bought in energy rather than in
    amplitude. `weigh-solve` asks **2.40**, and `mire/approach` came **down** from 96.7% of the
    clipping ceiling to 95.6%.

    ⚠️ **AT `boss` AND `bossPeak` THE WINDOW IS NOW `mid R` WITH NOTHING OVER IT** (`toll −3.5`),
    margin −5.2 → −1.0. **At `approach` it is still `low R` under `sub` +2.0, and that is barely
    moved from +2.3** — margin −3.8 → −3.5, because at that rung `dread` has not left the band and
    `sub` is not this layer's to move. Raising the sine instead would fight `sub` where `sub` lives
    and spend the low share (`scripts/weigh-mix.mjs`) to do it.
  */
  dread: [
    {
      steps: [2, 8, 2, 8],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.92, 0.98, 1],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.14, attack: 0.5, curve: 0.85, lowFrom: 280, lowTo: 720, q: 2.6 },
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
    ── THE HYDRA ────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **THREE VOICES ON ONE FIGURE, AND THAT IS THE BOSS.** `HEAD` is sounded at the root and at the
    fifth by `frenzy` and a semitone under the fifth by `wraith`. Two of the three pairs are
    consonant and the third is a minor second, so the stack is simultaneously a chord and a wound —
    which is a hydra, and which is also the only way this project can say *there are more of them now*
    without a mechanism for adding layers mid-fight.
  */
  stomp: [
    {
      /*
        THE BODY. Lower and longer than the turn it replaces — 108 Hz down to 26 — and it lands on
        the half-bar rather than the beat, so the fight arrives from a direction the level has not
        used.
      */
      steps: [1, _, 0.66, _, 0.9, _, 0.62, 0.7, 1, _, 0.68, _, 0.88, 0.58, 0.72, 0.82],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 108, to: 26, seconds: 0.5, gain: 0.33, attack: 0.002, curve: 2.2, drive: 0.44 },
    },
    {
      /*
        THIRTY-SECONDS OF WET METAL. The top of the acceleration — eighths at the opening, sixteenths
        at `push` and `surge`, and this — and it exists only in the fight, which is how a place gets
        faster while `docs/decisions/0093-the-gun-is-on-the-grid.md` holds the tempo still.
      */
      steps: [
        _, 0.3, _, 0.42, _, 0.28, 0.34, 0.26, _, 0.32, _, 0.44, _, 0.3, 0.36, 0.28,
        _, 0.3, 0.26, 0.42, _, 0.28, 0.34, 0.24, _, 0.34, _, 0.4, 0.26, 0.32, 0.38, 0.3,
        _, 0.32, _, 0.44, _, 0.28, 0.36, 0.26, _, 0.3, 0.26, 0.42, _, 0.3, 0.34, 0.26,
        _, 0.3, 0.28, 0.42, 0.26, 0.32, 0.36, 0.28, 0.3, 0.34, 0.32, 0.46, 0.28, 0.34, 0.42, 0.36,
      ],
      pitched: false,
      perBeat: 8,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.045, gain: 0.11, attack: 0.001, curve: 6, lowFrom: 5200, lowTo: 1800, highFrom: 600 },
    },
    {
      steps: [
        0.38, _, 0.3, _, 0.34, _, 0.28, _, 0.38, _, 0.3, _, 0.34, _, 0.3, 0.32,
        0.38, _, 0.3, _, 0.36, _, 0.28, _, 0.4, _, 0.32, _, 0.36, _, 0.32, 0.34,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.026, gain: 0.05, attack: 0.0006, curve: 7.5, lowFrom: 10000, highFrom: 4200 },
    },
  ],

  frenzy: [
    {
      // The first head, at the root.
      steps: HEAD,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.62, 0.86, 0.6],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.15, attack: 0.006, curve: 3.4, lowFrom: 2600, lowTo: 1000, q: 2.2, drive: 0.5 },
    },
    {
      // The second, a fifth up. Same figure, same instant, and it is what a second head IS.
      steps: headAt(7),
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.6, 0.84, 0.62],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.21, gain: 0.1, attack: 0.006, curve: 3.8, lowFrom: 3600, lowTo: 1500, q: 1.9, drive: 0.44 },
    },
  ],

  wraith: [
    {
      /*
        THE THIRD HEAD, a FOURTH up — so it sits a whole tone under the second head and a fourth
        over the first, which is a stack that is consonant with one neighbour and grating against the
        other. It is also, by construction, the same tune: `headAt` is the one description of *another
        one grew back*, and a transposition that left the key would take the player's gun with it —
        which is why 5 and 7 are the two it uses and 3 and 6 are not available.
      */
      steps: headAt(5),
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.66, 0.86, 0.62],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.26, gain: 0.115, attack: 0.01, curve: 3.2, lowFrom: 1500, lowTo: 620, q: 2.4, drive: 0.66 },
    },
    {
      // And the sound of all three necks at once: held, driven, and coming apart.
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
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.095, attack: 0.06, curve: 1.9, lowFrom: 1300, lowTo: 520, q: 2.2, drive: 0.72 },
    },
  ],

  /*
    ── THE AURA: how deep the water is between you and it ──────────────────────────────────────────
  */
  auraSlow: [
    {
      steps: [2, _, 8, _, 2, _, 8, _],
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.28, attack: 0.34, curve: 1.5, lowFrom: 300, lowTo: 700, q: 1.6 },
    },
    {
      steps: [8, _, 2, _, 8, _, 2, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.29, attack: 0.38, curve: 1.35 },
    },
    {
      // The water itself moving, which is what a very large body under a surface actually sounds
      // like from above it.
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.3, gain: 0.115, attack: 0.42, curve: 1.4, lowFrom: 500, lowTo: 1600, highFrom: 160, q: 0.7 },
    },
  ],

  auraFast: [
    {
      steps: [2, _, 2, _, 2, _, 2, _, 8, _, 8, _, 8, _, 8, _],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.15, attack: 0.01, curve: 4.4, lowFrom: 2400, lowTo: 800, q: 2 },
    },
    {
      steps: [_, 8, _, 8, _, 8, _, 8, _, 2, _, 2, _, 2, _, 2],
      pitched: true,
      perBeat: 2,
      octave: 3,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.115, attack: 0.006, curve: 5.5, lowFrom: 5200, lowTo: 2000, q: 1.6 },
    },
    {
      // Bubbles breaking, faster as it rises.
      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 1400, to: 4600, seconds: BEAT_SECONDS * 0.28, gain: 0.09, attack: 0.008, curve: 3.4, lowFrom: 3400, lowTo: 1200, highFrom: 400 },
    },
  ],
};
