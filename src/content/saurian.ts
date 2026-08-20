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
 * ── THE NOTE THIS PLACE HAS THAT NO OTHER ONE DOES ──────────────────────────────────────────────
 *
 * ⚠️ **G SHARP, AND IT IS THE WHOLE REASON THIS READS AS EUROBEAT RATHER THAN AS TRANCE** —
 * `docs/decisions/0148-a-place-has-its-own-notes.md`. The genre is minor-key with a RAISED SEVENTH:
 * the V chord is E major and not E minor, so the harmony is permanently pulled back to the tonic by a
 * semitone from below. Take that one note away and every hands-up progression ever written collapses
 * into the same modal shuffle — which is exactly what this file was before, and what it was reported
 * as: *"I'm not getting saurian or robot or techno or eurobeat vibes at all."*
 *
 * ⚠️ **IT WAS FORBIDDEN, BY A GUARD WIDER THAN ITS OWN REASON, AND `src/content/music.ts` HAD BEEN
 * SOUNDING IT ALL ALONG.** `tests/themes.test.ts` held every re-voiced place to the seven tones of A
 * natural minor because *"the cues are in the key"* — an argument about the TONIC — and the base
 * composition breaks it ninety-three times over those same cues with nothing ever reported out of
 * tune. 0148 is that distinction: **this place states its own mode and keeps the game's root.**
 *
 * ⚠️ **AND THE TWO HALVES OF THE BRIEF NOW DISAGREE BY THAT ONE NOTE, WHICH IS THE JOKE.** The bone
 * flute is pentatonic and sings the natural seventh; the floor underneath it plays the sharp one. The
 * ancient thing and the machine are a semitone apart on the same degree, they are never sounding it
 * at the same moment — `FLUTE` rests on every E bar — and *that* is what makes them one piece rather
 * than two records at once.
 *
 * ── AND THE OTHER LIMIT, WHICH IS THE SAME LIMIT EVERY PLACE HAS ────────────────────────────────
 *
 * ⚠️ **THE ROOT IS STILL A**, because the cues are — `docs/decisions/0099-the-cues-are-in-the-key.md`
 * — and a place in another KEY would put the player's own gun out of tune with the level for three
 * minutes. A mode is not a key, and `tests/themes.test.ts` now holds the root and the fifth rather
 * than all seven notes between them.
 */

import { BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * Cents, as the fraction of an octave `MusicVoice.octave` is measured in.
 *
 * ── THE SUPERSAW WAS ALWAYS REACHABLE AND THIS FILE SAID IT WAS NOT ─────────────────────────────
 *
 * ⚠️ **`docs/decisions/0148-a-place-has-its-own-notes.md`.** The paragraph that used to sit over
 * `RIFF` read *"this synthesiser has no detune (`src/app/sound.ts` takes a semitone, not a cent), so
 * the stack is built the way `drone` builds its own — two voices an octave apart"*. That is true of
 * `steps`, which is semitones, and **false of `octave`, which is a float**: `src/app/music.ts` bakes
 * a voice at `MUSIC_ROOT * 2^(octave + semitone/12)` and nothing has ever required the left-hand term
 * to be a whole number.
 *
 * ⚠️ **SO A DETUNED STACK COSTS NOTHING BUT SAYING SO.** Three saws at ±14 cents beat against each
 * other at a few hertz, which is the entire sound of the genre and the one thing the octave trick
 * cannot fake: two voices an octave apart are consonant and do not beat at all.
 *
 * ⚠️ **±14 RATHER THAN ±25.** A supersaw is a chord's worth of detune when it is the only thing
 * playing; over a sixteenth bass and a four-on-the-floor it turns to mud, and the beat rate at ±25
 * cents on a note this low is slow enough to read as wobble rather than as width.
 */
const cents = (n: number): number => n / 1200;

/**
 * THE PROGRESSION — sixteen bars, one chord a bar, and it CADENCES, four times.
 *
 * ```
 *   Am  F   C   G  ·  Am  F   Dm  E  ·  C   G   Am  E  ·  F   G   Am  E
 * ```
 *
 * ⚠️ **THE E IS MAJOR AND EVERY OTHER CHORD HERE IS DIATONIC.** That is the only chromatic event in
 * the place and it happens four times in sixteen bars, on the bar each phrase turns on. E major over
 * an A minor key is the V — `docs/decisions/0148-a-place-has-its-own-notes.md` — and its third is the
 * G# that gives this level a note no other level in the game has.
 *
 * ⚠️ **THE VERSION THIS REPLACES SAID *IT NEVER RESOLVES AND THAT IS THE GENRE*, AND THAT WAS THE
 * DEFECT WRITTEN DOWN AS A FEATURE.** It ran `Am G F G` four ways — root, seventh, sixth, seventh,
 * falling for ever and cadencing nowhere. That is a fair description of trance and it is the opposite
 * of eurobeat, which is built out of hard V–i arrivals and lives or dies on them. A loop with no
 * cadence in it cannot sound like somewhere you are ARRIVING, which is what the level is for.
 *
 * ⚠️ **AND IT IS WHY THIS PLACE READ AS THE ONE BEFORE IT.** Every place in this game was a reshuffle
 * of the same six diatonic triads; six of the seven measured as the identical pitch-class set. The
 * cadence is not a decoration on top of that — it is the first structural thing any of them has that
 * the others do not.
 *
 * ⚠️ **Hoisted, because eight voices spell the same sixteen chords** — the same argument
 * `src/content/nebula.ts` makes, and the same failure it is avoiding: three copies of a progression is
 * how a place ends up with a bass in one key and a lead in another. It matters more here than
 * anywhere: **the G# has to arrive in every voice at once or it is a wrong note rather than a chord.**
 */
const ROOT: readonly number[] = [0, -4, 3, -2, 0, -4, 5, -5, 3, -2, 0, -5, -4, -2, 0, -5];
const THIRD: readonly number[] = [3, 0, 7, 2, 3, 0, 8, -1, 7, 2, 3, -1, 0, 2, 3, -1];
const FIFTH: readonly number[] = [7, 3, 10, 5, 7, 3, 12, 2, 10, 5, 7, 2, 3, 5, 7, 2];

/**
 * THE BONE FLUTE — `call`'s tune, and it is the whole of *ancient* before the floor arrives.
 *
 * ⚠️ **PENTATONIC AND BREATHY, WHICH IS WHAT A FLUTE WITH FIVE HOLES CAN PLAY.** The line uses the
 * root, the third, the fourth, the fifth and the seventh and never the second or the sixth — not
 * because the scale forbids them but because an instrument made of a femur does. It is the one
 * constraint in this file that is about an object rather than about a genre.
 *
 * ⚠️ **AND THE SEVENTH IT SINGS IS THE NATURAL ONE, WHICH THE FLOOR UNDERNEATH IT HAS SHARPENED.**
 * `docs/decisions/0148-a-place-has-its-own-notes.md`. This is the register split stated as a note
 * rather than as a mix: the machine half plays G# and the animal half plays G, a semitone apart on the
 * same degree of the same scale.
 *
 * ⚠️ **SO IT RESTS ON EVERY E BAR — 8, 12 AND 16 — AND THAT IS LOAD-BEARING RATHER THAN TASTEFUL.**
 * Those are the four bars carrying the G#, and a pentatonic G over them is not a colour, it is a
 * minor second against the chord's own third. **The breath every fourth bar and the cadence are the
 * same event**, which is the only reason the two halves can hold different sevenths at all.
 *
 * ⚠️ **Two notes a bar and a breath every fourth one.** The rests are the part that reads as *old*:
 * everything else in this place is continuous, so the layer with holes in it is the layer that sounds
 * like a person rather than a machine.
 */
const FLUTE: readonly (number | null)[] = [
  0, _, 3, _,
  3, _, 0, _,
  3, _, 7, _,
  10, _, 5, _,
  0, _, 3, _,
  3, _, 0, _,
  5, _, 12, _,
  7, _, _, _,
  10, _, 7, _,
  5, _, 10, _,
  0, _, 3, _,
  7, _, _, _,
  3, _, 0, _,
  10, _, 5, _,
  12, _, 10, _,
  7, _, _, _,
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
 *
 * ⚠️ **IT IS THE LAYER THAT SOUNDS THE G#, AND IT SOUNDS IT FOUR TIMES** — bars 8, 12 and 16, and it
 * is the last note of the loop. `docs/decisions/0148-a-place-has-its-own-notes.md`. **The sixteenth
 * bar holds a G# alone and the first bar begins on A**, so the seam of the loop is the cadence: the
 * strongest arrival in the piece happens at the moment the piece starts again, which is how a track
 * that has to run for three minutes under a fight gets to resolve without ever stopping.
 *
 * ⚠️ **`RUNG_CLOSES` takes `call` away in the same breath** (`src/content/music.ts`), so the ear is
 * handed a different tune rather than a second one — and the tune it is handed is the one with the
 * chromatic note in it. `docs/decisions/0125-the-build-starts-sooner.md` says a section is heard by
 * what ARRIVES; what arrives here is a note the level has not played yet.
 */
const HANDS: readonly (number | null)[] = [
  12, _, 14, 15,
  17, _, 15, _,
  15, _, 12, 15,
  14, _, 17, _,
  12, _, 14, 15,
  20, _, 17, _,
  17, 15, 14, _,
  19, _, 23, _,
  24, _, 22, 19,
  22, _, 19, _,
  24, _, 19, 15,
  23, _, 19, _,
  20, _, 17, 20,
  22, _, 19, _,
  24, _, 22, 19,
  23, _, _, _,
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
 * ⚠️ **A HOOVER IS A CHORD PLAYED AS A LINE, AND IT IS ALSO A STACK OF DETUNED SAWS.** This comment
 * used to say the synthesiser had no detune and that the stack was therefore built out of octaves —
 * see `cents` above for why that was wrong, and
 * `docs/decisions/0148-a-place-has-its-own-notes.md` for what it cost. `hook` is now three saws at
 * ±14 cents **and** the chord spelled as a line, which is both halves of what the sound is.
 */
const RIFF: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return bar % 2 === 0
    ? [root + 12, _, fifth, root + 12, _, third + 12, fifth, _]
    : [root + 12, fifth, _, third + 12, _, root + 12, _, fifth];
});

/**
 * THE GATE — the chord chopped into sixteenths instead of held, and it is what makes this place a
 * different SONG from Ember Nebula rather than a different arrangement of one.
 *
 * ⚠️ **Reported 2026-08-20, of the two levels back to back:** *"the chords and groove are pretty
 * similar to ember nebula, there's not a lot of differentiation… they're obviously different, but the
 * audible sounds are 'here are two of the same songs with a slightly different background beat'."*
 *
 * ⚠️ **AND THE TWO PLACES HELD THE SAME SHAPE, WHICH IS WHAT WAS MEASURED.** Both `chords` struck
 * about **0.9 times a bar**, held each chord for **three to four beats**, and bottomed at **82 Hz**.
 * Different notes, different waves, one gesture — and neither `weigh-apart` (balance) nor
 * `weigh-notes` (pitch classes) can see a gesture.
 * `docs/decisions/0186-a-place-has-its-own-gesture.md` has the argument.
 *
 * ⚠️ **THE POSITIONS AVOID THE KICK, WHICH IS THIS FILE'S OWN LESSON TWICE OVER.** `sub`'s
 * four-on-the-floor strikes {0,4,8,11,12} and the pickup bars add 7 and 15; this strikes **1, 3, 5, 7,
 * 9, 13 and 14**, so the chord lands in the holes the floor leaves. That is the same arithmetic
 * `docs/decisions/0181-the-floor-has-a-bottom.md` placed the floor tom by, and the same one the
 * offbeat bass was already written from.
 */
const GATE: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [
    _, root, _, fifth, _, third, _, root,
    _, fifth, _, _, _, root, fifth, _,
  ];
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
    ── THE RAPTOR CALL — the first layer in this game that exists in one place only ────────────────

    ⚠️ **`docs/decisions/0188-a-place-owns-four-slots.md`**, answering *"can we add different layers?
    these are the exact kind of similarity issues that are blocking some of the differences I want on
    different levels."* `ownA` has no name, no length and no role of its own; **this is what makes
    it one**, and no other place's `ownA` is related to it in any way.

    ⚠️ **IT IS THE HALF OF THE BRIEF A GATED CHORD CANNOT CARRY.** The file's own header splits
    *ancient* and *eurobeat* by register — the primeval material melodic and on top, the machine
    underneath. `docs/decisions/0186-a-place-has-its-own-gesture.md` turned the chord into a
    machine, which is right and takes one of the melodic parts away. This is the thing that answers
    it back.

    ⚠️ **UNPITCHED, BECAUSE A SHRIEK IS A GLIDE AND A PITCHED VOICE CANNOT GLIDE.** `from` and `to`
    are a sweep for an unpitched voice — the same mechanism every cue in the game uses — so this is
    the one thing in the music that bends. **Nothing else in any place does**, which is most of why
    it reads as another instrument rather than another patch.

    ⚠️ **RARE, ON `STABS`' OWN ARGUMENT**: *a hit that happens every bar is a part, and a hit that
    happens once a phrase is an event.* Twice in four bars, off the beat, and never on the downbeat
    the kick owns.
  */
  ownA: [
    {
      // The call: 1180 → 430 Hz in 180 ms, which is a descending screech rather than a note.
      steps: [_, _, _, _, _, 0.92, _, _, _, _, _, _, _, _, 0.78, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, _, 0.7, _],
      pitched: false,
      perBeat: 2,
      octave: 0,
      /*
        ⚠️ **LOUD MATERIAL AT A MODEST MULTIPLIER, WHICH IS 0140's OWN LESSON.** Written at 0.2 the
        call needed **4.2** from the ladder to reach its role, and a multiplier that large on a bright
        layer pulled the place's share under 300 Hz to 23.5% — under 0147's floor, on a level whose
        whole recent history is its bottom. A gain is not a loudness: the fix is the voice, not the
        fader.
      */
      note: { wave: 'saw', from: 1180, to: 430, seconds: 0.18, gain: 0.62, attack: 0.004, curve: 3.4, lowFrom: 5200, lowTo: 1600, q: 1.6, drive: 0.3 },
    },
    {
      // The breath under it — a short noise chirp on the same strikes, so the call has a throat.
      steps: [_, _, _, _, _, 0.8, _, _, _, _, _, _, _, _, 0.66, _, _, _, _, _, _, _, _, _, _, 0.88, _, _, _, _, 0.6, _],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.11, gain: 0.28, attack: 0.006, curve: 4.2, lowFrom: 3600, lowTo: 900, highFrom: 700 },
    },
  ],
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

        ── AND THE SIXTEENTH BAR IS A BREAK, WHICH IS THE ONE GESTURE THIS GAME HAS NEVER MADE ──────

        ⚠️ **THE KICK STOPS FOR A BAR AND NOTHING ELSE DOES.** The offbeat stab, the bass, the hats
        and the pad all carry on, so the floor does not fall out — what goes is the thing the listener
        has been counting, and it goes on the bar the progression cadences on.
        `docs/decisions/0114-the-fight-is-a-different-piece.md` says the only mechanism that has ever
        read as a boundary in this game is **something stopping**, and it says it about the rungs;
        this is the same finding spent inside a loop, where it costs no mechanism at all.

        ⚠️ **IT IS ALSO THE GENRE'S OWN PUNCTUATION.** A eurobeat track breaks every sixteen bars and
        slams back in — the two sixteenths at the end of the bar are the run-up, and the downbeat they
        land on is bar one of the loop, where `HANDS` has just resolved its G# onto an A.
      */
      steps: ROOT.flatMap((_root, bar) =>
        bar === 15
          ? [1, _, _, _, _, _, _, _, _, _, _, _, _, _, 0.7, 0.86]
          : bar % 4 === 3
            ? [1, _, _, _, 0.9, _, _, 0.6, 0.98, _, _, 0.64, 0.92, _, _, 0.72]
            : [1, _, _, _, 0.9, _, _, _, 0.98, _, _, 0.62, 0.92, _, _, _],
      ),
      pitched: false,
      perBeat: 4,
      octave: 0,
      /*
        ⚠️ **BIGGER AND DEEPER BECAUSE THE PAD MOVED OFF IT** — 0185. 0.4 → 0.5, 32 → 30 Hz, 0.42 →
        0.46 s. Every one of those was available before and none of them would have been heard:
        `sub` measured **17 dB down** at `push` with the pad over it.
      */
      note: { wave: 'sine', from: 132, to: 30, seconds: 0.46, gain: 0.5, attack: 0.002, curve: 2.4, drive: 0.3 },
    },
    {
      // THE OFFBEAT STAB — the half of the floor that is a hole rather than a note. `OFFBEAT` has it.
      steps: OFFBEAT,
      pitched: true,
      perBeat: 2,
      octave: 0,
      accents: [1, 0.86, 0.94, 0.84],
      // ⚠️ 0.24 → 0.30 — 0185. The bass placement IS the hi-NRG signature (the note at the head of
      // this file), so the layer that carries it takes its share of the room the pad gave up.
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.3, attack: 0.004, curve: 3.6, lowFrom: 900, lowTo: 260, q: 1.5, drive: 0.3 },
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
    {
      /*
        ── THE FLOOR TOM: the deep fast drum, and it plays where the kick is NOT ────────────────────

        ⚠️ **`docs/decisions/0181-the-floor-has-a-bottom.md`.** Asked for: *"some deep fast drum beats
        instead of the higher notes we've got a lot of."* Measured, that is not a preference — this
        place holds **0.255** of its energy under 300 Hz at `push` against a floor of 0.24, where the
        base composition holds 0.378. It is within two points of the bound at exactly the rungs a
        dancefloor should be driving hardest.

        ⚠️ **IT IS IN `engine` BECAUSE `perc` MAY NOT BE LOW, WHICH IS A RULE AND NOT A PREFERENCE.**
        `perc` sits at −0.45 and `docs/decisions/0118-the-mix-has-a-width.md` refuses a placed layer
        whose weight is under 130 Hz — the note above this list says so about the rattles. `engine` is
        centred, and it is already where the low half of the kit lives.

        ⚠️ **EVERY HIT LANDS WHERE THE KICK HAS NOTHING, AND THAT IS THE FILE'S OWN LESSON.** `sub`'s
        four-on-the-floor records what happened when two low transients shared a sixteenth: *"the boss
        mix clipping at 1.004 of full scale"*. Its three variants strike {0,4,8,11,12}, {0,4,7,8,11,12,15}
        and {0,14,15}; this strikes 2, 5, 6, 9, 10 and 13, which is disjoint from all three. **The
        genre's own reason is the same as the arithmetic's**: the drop between kicks is where a floor
        tom belongs.

        ⚠️ **SHORTER THAN THE LOG DRUM AND LOWER, so it drives rather than booms.** 0.18 s at 150 →
        44 Hz is gone before the next sixteenth arrives; the log drum above is 0.26 s at 196 → 88 and
        is a different instrument doing a different job.

        ⚠️ **0.32 IS A CEILING AND NOT A CHOICE, AND IT IS WHY THIS LAYER CANNOT ANSWER THE WHOLE
        REPORT.** Past it, `tests/themes.test.ts` reports `saurian/approach/drive` more than a whole
        role under what the arrangement asked — measured at 0.45 and 0.62, passing at 0.32 and 0.22.
        The place's bottom is a fixed allocation and a new layer spends other layers' room; what this
        buys is **+0.004** of the share under 300 Hz. See 0181 for where the depth actually is.

        ⚠️ **AND IT HAS NO `drive`, WHICH IS `docs/decisions/0179-an-explosion-ends-low.md`'s LESSON
        ARRIVING IN THE MUSIC.** Saturating it put harmonics in the LOWMID and the guard named the
        victim exactly — `drive` masked by `engine −1.9 (lowmid)` — on a layer whose own sweep tops
        out at 150 Hz. Squashing a low sine does not make it deeper; it makes it wider.
      */
      /*
        ⚠️ **SIXTY-FOUR STEPS, BECAUSE `engine` IS A FOUR-BAR LAYER** — `LAYER_BARS`. Written at
        thirty-two, `tests/themes.test.ts` reported *"saurian/engine voice 4 spans 3.20s inside a 6.4s
        layer — the rest of the layer is silence"*, which is 0095's guard doing exactly its job on a
        pattern that would otherwise have played for half the loop and left a hole in the other half.
      */
      steps: [
        _, _, 0.7, _, _, _, 0.62, _, _, 0.58, 0.66, _, _, 0.6, _, _,
        _, _, 0.72, _, _, 0.64, 0.6, _, _, _, 0.68, _, _, 0.58, _, _,
        _, _, 0.7, _, _, _, 0.64, _, _, 0.6, 0.66, _, _, 0.62, _, _,
        _, _, 0.74, _, _, 0.66, 0.62, _, _, 0.6, 0.7, _, _, 0.64, _, _,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      /*
        ⚠️ **0.32 → 0.44, AND 0181's CEILING WAS NOT A PROPERTY OF THIS DRUM** — 0185. That decision
        measured 0.32 as the point past which `saurian/approach/drive` went a whole role adrift, and
        called it *"a ceiling and not a choice."* **It was a ceiling on the drum only while the pad was
        in the way**: with `chords` out of the `low` window this sits at 0.44 with `drive` clear —
        and `drive` is lifted at its own rungs in `src/content/themes.ts` besides.

        ⚠️ **STILL NO `drive` ON IT**, which is 0179's lesson and is unchanged: squashing a low sine
        does not make it deeper, it makes it wider, and the harmonics land in the lowmid where this
        place is already crowded.
      */
      note: { wave: 'sine', from: 150, to: 42, seconds: 0.2, gain: 0.44, attack: 0.0015, curve: 3.2 },
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
  /*
    ── THE CHORD IS GATED, NOT HELD, AND THAT IS THE WHOLE OF 0186 ──────────────────────────────────

    ⚠️ **`docs/decisions/0186-a-place-has-its-own-gesture.md`**, answering *"it's the chords and
    groove that need to shift for the saurian belt… rather than a higher octave bounce around it needs
    a lower octave fast paced drum tone for the chords and beat."*

    ⚠️ **WHAT STOOD HERE WAS SEVEN VOICES OF SUSTAINED PAD**, five of them saws holding for 4.4 beats
    with the filter open to 2600 Hz — bright, floating, and struck 0.9 times a bar. **Ember Nebula's
    `chords` is the same gesture with a triangle in front of it**, which is what the report is about.

    ⚠️ **A HI-NRG CHORD IS A STAB AND NOT A PAD.** The genre's chord part is the thing being chopped
    against the floor, not the thing floating over it — so the gate below runs sixteenths at 44 ms with
    the filter down at 620 → 240 Hz. **Dark and fast where it used to be bright and long.**

    ⚠️ **IT CANNOT TAKE THE BOTTOM, AND THAT IS A RULE RATHER THAN A CHOICE.** `chords` sits at +0.2
    and `docs/decisions/0118-the-mix-has-a-width.md` refuses a panned layer whose weight is under
    130 Hz. So the *depth* the report asks for lives in `groove` below, which is centred — the same
    split 0181 made when the floor tom could not go in `perc`.

    ⚠️ **ONE SUSTAINED VOICE SURVIVES, HIGHPASSED AND QUIET.** With the pad gone entirely the harmony
    disappears between stabs and the place reads as drums with a riff over it. This is the glue, at a
    third of the old level and with nothing under 190 Hz.
  */
  chords: [
    {
      /*
        THE GATE. Root and fifth alternating on the sixteenths the kick leaves open — the part a
        listener hears as *the chords* now, and it is a rhythm before it is a harmony.
      */
      steps: GATE,
      pitched: true,
      octave: 1,
      perBeat: 4,
      accents: [1, 0.72, 0.9, 0.7, 0.96, 0.74, 0.88, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.11, gain: 0.17, attack: 0.003, curve: 5, lowFrom: 620, lowTo: 240, q: 1.3, drive: 0.3 },
    },
    {
      // The same gate, sixteen cents sharp. A supersaw is a detune, and a gated one keeps it —
      // `cents` at the head of this file has why this is not an octave stack.
      steps: GATE,
      pitched: true,
      octave: 1 + cents(16),
      perBeat: 4,
      accents: [1, 0.72, 0.9, 0.7, 0.96, 0.74, 0.88, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.11, gain: 0.12, attack: 0.003, curve: 5, lowFrom: 590, lowTo: 225, q: 1.3, drive: 0.3 },
    },
    {
      /*
        THE THIRD, AND IT IS STILL THE VOICE THE WHOLE PLACE TURNS ON. On bars 8, 12 and 16 `THIRD`
        hands it a G# and the chord under the level becomes E major —
        `docs/decisions/0148-a-place-has-its-own-notes.md`. Gating the chord changes how often that
        cadence is struck and not what it is.
      */
      steps: THIRD.flatMap((third, bar) => [_, third, _, _, _, third, _, FIFTH[bar]!, _, third, _, _, _, third, _, _]),
      pitched: true,
      octave: 1,
      perBeat: 4,
      accents: [0.94, 0.7, 1, 0.68],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.09, gain: 0.1, attack: 0.002, curve: 6, lowFrom: 900, lowTo: 380, q: 1.5, drive: 0.24 },
    },
    {
      // THE GLUE — the only thing left holding, so the harmony does not vanish between stabs. A third
      // of the old pad's level, and highpassed so it cannot walk back into the bottom 0185 cleared.
      steps: ROOT,
      pitched: true,
      octave: 2,
      perBeat: 0.25,
      accents: [1, 0.86, 0.92, 0.84, 0.96, 0.88, 1, 0.82],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.05, attack: 0.3, curve: 1.4, lowFrom: 2200, lowTo: 900, q: 1.2, highFrom: 190 },
    },
  ],

  /*
    ── THE BASS: sixteen notes a bar, and it is the thing the level runs on ─────────────────────────

    ⚠️ **THREE VOICES ON ONE LINE, WHICH IS HOW A BASS GETS BIG WITHOUT GETTING LOUD.** A sine for the
    weight, a driven saw for the teeth, and an octave up so the FIGURE is audible rather than only the
    pressure. Take the third away and the line is felt and cannot be followed, which is the exact
    failure `src/content/nebula.ts`'s pedalboard was written to fix.
  */
  /*
    ── AND THE BASS IS A DRUM NOW, WHICH IS THE OTHER HALF OF THE REPORT ────────────────────────────

    ⚠️ **0186.** *"A lower octave fast paced drum tone for the chords and beat."* `groove` is centred,
    so unlike `chords` it is allowed the bottom — and it already ran twice Ember Nebula's rate. What
    it did not have was a **transient**: 0.20 of a beat with a 3 ms attack is a note, and a drum is the
    same pitch with the front end sharpened and the tail cut.

    ⚠️ **AND THE THUMP IS A FOURTH VOICE RATHER THAN A SHORTER THIRD.** An unpitched sweep doubling
    the line is what makes a bass read as a kit rather than as a synth, and it strikes only where
    `sub`'s four-on-the-floor does not — 0181's arithmetic, and the reason this file's own header
    says the drop between kicks is where a low drum belongs.
  */
  groove: [
    {
      steps: OCTAVES,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.16, gain: 0.58, attack: 0.0015, curve: 4.2 },
    },
    {
      steps: OCTAVES,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.15, gain: 0.2, attack: 0.0015, curve: 4.6, lowFrom: 760, lowTo: 320, q: 1.4, drive: 0.34 },
    },
    {
      steps: OCTAVES,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.13, gain: 0.055, attack: 0.002, curve: 5.4, lowFrom: 1600, lowTo: 700, q: 1.5 },
    },
    {
      /*
        THE THUMP — an unpitched sweep on the sixteenths the kick leaves open, which is what turns a
        sixteenth bass line into a fast low drum. 118 → 46 Hz in 90 ms: gone before the next sixteenth
        arrives, and never on top of the four-on-the-floor.
      */
      steps: ROOT.flatMap(() => [_, 1, _, 0.82, _, 0.9, _, 0.78, _, 0.94, _, _, _, 0.86, 0.8, _]),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 118, to: 46, seconds: 0.09, gain: 0.3, attack: 0.0012, curve: 3.4 },
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
      octave: 1,
      perBeat: 2,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.135, attack: 0.006, curve: 2.6, lowFrom: 2400, lowTo: 900, q: 1.6, drive: 0.2 },
    },
    {
      // Sharp. The centre voice above and this pair either side of it is the supersaw — three saws
      // beating against each other at a few hertz, which is the sound the octave stack could not make.
      steps: RIFF,
      pitched: true,
      octave: 1 + cents(14),
      perBeat: 2,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.105, attack: 0.007, curve: 2.6, lowFrom: 2300, lowTo: 880, q: 1.6, drive: 0.2 },
    },
    {
      // Flat.
      steps: RIFF,
      pitched: true,
      octave: 1 - cents(14),
      perBeat: 2,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.105, attack: 0.005, curve: 2.6, lowFrom: 2500, lowTo: 920, q: 1.6, drive: 0.2 },
    },
    {
      // The octave over the stack — the brightness, not the width. It was doing both jobs before and
      // could only ever do this one.
      steps: RIFF,
      pitched: true,
      octave: 2,
      perBeat: 2,
      accents: [1, 0.74, 0.9, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.38, gain: 0.07, attack: 0.008, curve: 3, lowFrom: 4600, lowTo: 2200, q: 1.4 },
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

    ⚠️ **THIS PLACE FOLLOWS ITS KIT AT `push` AND THE KIT WAS A TICK** —
    `src/content/arrangement.ts` puts `ride` in `LEADS.saurian.push`, so it is the one thing the
    listener is meant to track through the section the header calls *the floor arrives*. Solved
    against that role it wanted **4.05×** the gain it ships at, which
    `docs/decisions/0154-the-mix-is-authored-as-intent.md` is the whole argument for not granting:
    `MIX_CEILING` is 2.6 and would have silently clamped it.

    ⚠️ **AND THE ANSWER IS THE RING, NOT THE GAIN, BECAUSE THE BUDGET THAT BINDS HERE IS PEAK.** This
    place ships at **99.5% of the clipping ceiling at `bossPeak`** — a raw sum of five drum attacks
    landing on the same sample — so there is no level to give anything. A cymbal's audibility is its
    DECAY, which costs energy and costs no peak at all: the attack, the band and the pattern below are
    untouched and the gain comes **down**.
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
      /*
        ⚠️ **56 ms OF DECAY WHERE 0152 LEFT 17, AND 0152 LEFT 17 WHERE THE ORIGINAL HAD 3.** The
        envelope is `exp(-curve × u)` across `seconds`, so the length a listener hears is about
        `seconds / curve` and the energy is about `seconds / 2·curve` — three passes have now moved
        this one line and each was reading `seconds` as though it were the note.

        ⚠️ **A SIXTEENTH IS 100 ms AT 150 BPM, SO THIS IS THE FIRST VERSION THAT OVERLAPS ITSELF.**
        That is what an open hat IS — the hits wash into one another and the wash is the sound of the
        genre — and it is also where the energy comes from: broadband RMS is up **4.6 dB** while the
        peak moves **0.3**, because `attack` and `gain` are the only things a peak reads and one of
        them went down. `docs/decisions/0140-no-layer-is-inaudible.md` is why the peak is watched
        separately: RMS counts the silence between hits and libels a transient by twenty decibels —
        this layer reads −44.6 dBFS rms against −26.2 peak, and only one of those is what an ear gets.
      */
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.19, gain: 0.095, attack: 0.0004, curve: 3.4, lowFrom: 11000, highFrom: 5600 },
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
      octave: 2,
      perBeat: 1,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.16, attack: 0.02, curve: 1.6, lowFrom: 4200, lowTo: 1900, q: 1.5 },
    },
    {
      /*
        THE DETUNE ON THE HANDS-UP LINE, AND IT IS WIDER THAN THE RIFF'S ON PURPOSE. ±22 cents where
        `hook` takes ±14: this layer arrives at `surge` with `call` and `arp` closing underneath it
        (`src/content/music.ts`), so it is the widest thing in the mix at the moment it is also the
        most exposed — and a lead is the one place a slow beat reads as *huge* rather than as *out of
        tune*.
      */
      steps: HANDS,
      pitched: true,
      octave: 2 + cents(22),
      perBeat: 1,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.10, attack: 0.024, curve: 1.6, lowFrom: 4000, lowTo: 1850, q: 1.5 },
    },
    {
      steps: HANDS,
      pitched: true,
      octave: 2 - cents(22),
      perBeat: 1,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.10, attack: 0.017, curve: 1.6, lowFrom: 4400, lowTo: 1950, q: 1.5 },
    },
    {
      steps: HANDS,
      pitched: true,
      octave: 1,
      perBeat: 1,
      accents: [1, 0.72, 0.9, 0.74],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.11, attack: 0.03, curve: 1.5, lowFrom: 2000, lowTo: 950, q: 1.3 },
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

  /*
    ── THE LASERS: what the fight is ABOUT, which is a thing this layer was not built to be ─────────

    ⚠️ **`LEADS.saurian.boss` IS `frenzy`, SO THIS IS THE PART** — `src/content/arrangement.ts`, and
    `ROLE_MARGIN_DB.part` is *three decibels over everything else together*. Solved against that it
    wanted **6.33×** its shipped gain, the worst deficit in the place and one `MIX_CEILING` could not
    have expressed even if the boss had the headroom to play it.

    ⚠️ **AND THE DEFECT IS THAT A PART IS A LINE AND THIS WAS A ROW OF DOTS.** Sixteenths are 100 ms
    apart at 150 BPM and the note was `BEAT_SECONDS * 0.22` at `curve: 4.4` — about **20 ms of sound
    in every 100**, so four fifths of the thing the listener is supposed to follow was silence. The
    header above calls the boss *space laser dinosaur*; what it had was a laser you could count.

    ⚠️ **A GATE RATHER THAN A LONGER DECAY, BECAUSE THE OVERLAP IS WHAT COSTS PEAK.** The first fix
    here rang the notes into each other and put `bossPeak` at **104.3% of the clipping ceiling** — a
    tail that reaches the next attack adds to it. `BEAT_SECONDS * 0.35` at `curve: 1.2` is a note that
    holds its sixteenth and is nearly gone when the next one starts: **+5.7 dB of broadband energy for
    0.9 dB of peak**, and the rests in the figure below are still rests.
  */
  frenzy: [
    {
      /*
        THE LASERS. Sixteenths on a square wave, snapping between the fifth and the tritone with the
        squeal two octaves over them — eight bars, so the figure is longer than the four-bar phrase
        the listener has been counting in and the fight stops fitting its own shape.

        ⚠️ **A pitched square IS the laser this game already fires** — `src/content/cues.ts` builds
        the gun the same way, which is `docs/decisions/0099-the-cues-are-in-the-key.md` arriving from
        the other side: the boss's music and the player's weapons are the same instrument, in the same
        key, on the same grid. **What the gun does not have to be is the loudest thing in the mix**,
        and that is the whole of why the envelope is a gate here and a blip there.

        ⚠️ **THE FILTER NO LONGER CLOSES TO 1200 Hz, AND THAT WAS WORTH MORE THAN ANY GAIN.** A note
        five times longer spends five times as long wherever the sweep leaves it, and 1200 Hz is
        `mid` — the band `auraSlow`, `toll` and `drive` already fill at the boss, and the most crowded
        one the fight has. Landing at 2000 puts the body in `himid` instead. Same peak, and the solved
        gain fell from 2.9 to 2.4 on that one number.
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
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.35, gain: 0.07, attack: 0.002, curve: 1.2, lowFrom: 3400, lowTo: 2000, q: 2.2, drive: 0.5 },
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
      /*
        ⚠️ **THE SQUEAL, AND IT MOVED UP AN OCTAVE TO GET OUT OF THE FIGHT'S OWN TRAFFIC.** At
        `octave: 2` this doubled the line where every other layer at the boss already lives; at 3 its
        fundamental is 988–1760 Hz and its harmonics land in `hi`, which measures as **the emptiest
        band the fight has** — the aura and the bell are the only things up there and neither is loud.
        `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`: a layer is masked by what shares its
        window, so the cheapest decibel available is a window nobody is standing in.

        ⚠️ **The lowpass opens with it**, or the octave would be thrown away by the filter that was
        set for the register below.
      */
      octave: 3,
      accents: [1, 0.6, 0.84, 0.62],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.04, attack: 0.002, curve: 1.27, lowFrom: 9000, lowTo: 5200, q: 1.8, drive: 0.44 },
    },
  ],

  /*
    ── THE ROAR ─────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **THE COMMENT BELOW SAID *HELD NOTES* AND THE ENVELOPE WAS GONE IN A QUARTER OF THE NOTE.**
    `BEAT_SECONDS * 0.98` at `curve: 1.9` is about 200 ms of audible sound in a figure that plays
    every 800, so the roar the fiction describes as a lung was, in the material, four short barks a
    bar. That is `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`'s finding about Ember Nebula's
    ride — *a "25 ms" note that was really 2.8* — happening in the one layer whose own documentation
    named the defect.

    ⚠️ **SO IT HOLDS NOW.** The note nearly fills the gap to the next one and the curve is flat enough
    to still be sounding when it gets there: **+6.7 dB of energy for 5.4 dB of peak**, the only one of
    this file's three fixes that spends real headroom — and it can, because the roar does not land
    where the fight's five drums do. `docs/decisions/0154-the-mix-is-authored-as-intent.md` solved
    this layer at **3.95×** its shipped gain to make it a counter-line; it now wants 2.1, and the
    boss's raw sum went **down**, from 98.0% of the clipping ceiling to 95.8%.
  */
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
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.85, gain: 0.08, attack: 0.05, curve: 1.15, lowFrom: 1900, lowTo: 640, q: 2.4, drive: 0.8 },
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
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.9, gain: 0.058, attack: 0.06, curve: 1.1, lowFrom: 1200, lowTo: 480, q: 2, drive: 0.7 },
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
