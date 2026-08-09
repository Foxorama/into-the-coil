/**
 * The music: four loops that play at once, and what each one is made of.
 *
 * `docs/decisions/0090-the-music-is-four-loops.md`.
 *
 * ── WHY THIS IS FOUR LOOPS AND NOT A SEQUENCER ──────────────────────────────────────────────────
 *
 * Asked for in play: *"we need some background music as well… it needs to be backgroundy and then get
 * an increased beat and bass leading into the boss fight and really get pumping as the boss appears
 * to make those fights truly epic."*
 *
 * The obvious build is a clock with a lookahead that schedules notes ahead of the playhead. It is
 * also the one thing this project cannot have: every note it schedules is an allocation during play,
 * and `docs/decisions/0072-a-cue-is-baked-and-played.md` is the rule that sound is baked once and
 * played, exactly as `docs/decisions/0022-frame-rate-is-a-feature.md` says art is baked and blitted.
 *
 * **So the four layers are baked as loops of identical length, started together, and looped for
 * ever.** Intensity is nothing but their four gains. That gives no scheduler and no per-frame
 * allocation; layers that cannot drift apart, because they are the same number of samples; and a
 * transition that is a gain ramp rather than one piece of music stopping and another starting.
 *
 * ── AND WHY IT IS `content/` ────────────────────────────────────────────────────────────────────
 *
 * Rows only — `docs/decisions/0015-the-layer-ladder.md`, and the same split
 * `src/content/cues.ts` has with `src/app/sound.ts`. What is here is patterns and a ladder; what
 * turns a pattern into samples is `src/app/music.ts` and is not.
 */

import type { CueLayer } from './cues.ts';

/**
 * The four layers, quietest first. Closed, and the order is the order they open in.
 *
 * ⚠️ **The order is the LADDER's order and nothing else reads it as meaning** — the same relationship
 * `src/content/cues.ts` has with the bake, stated here for the same reason.
 */
export const MUSIC_LAYERS = ['drone', 'bass', 'beat', 'drive', 'auraSlow', 'auraFast'] as const;

export type MusicLayer = (typeof MUSIC_LAYERS)[number];

/**
 * The two the boss brings with it, and they are the only layers driven by a DISTANCE.
 *
 * ── WHY THE AURA IS MUSIC AND NOT A CUE ─────────────────────────────────────────────────────────
 *
 * `docs/decisions/0091-the-boss-has-an-aura.md`. Asked for: *"can we add a sound associated with the
 * boss that compliments and amplifies the background music… an aura of sound on the bosses so that as
 * it gets closer to the player it builds in tempo?"*
 *
 * ⚠️ **The obvious build is a cue repeated at a shrinking interval, and it cannot work.** A cue is
 * fired from the fixed-step loop and the music runs on the `AudioContext` clock — two different
 * crystals — so a pulse meant to land on the beat wanders off it over the length of a fight, and
 * *complements the music* becomes *fights the music*. There is nothing to tune: the two clocks are
 * independent by construction.
 *
 * ⚠️ **As LAYERS they are sample-locked to the rest of the music and cannot drift**, because they are
 * in the same loop set, the same length and started on the same timestamp. And *builds in tempo* is
 * what adding subdivisions already does — the slow one swells on the half-note, the fast one fills in
 * the beats and the offbeats, so the pulse doubles and then doubles again without a tempo existing
 * anywhere as a number.
 */
export const AURA_LAYERS: readonly MusicLayer[] = ['auraSlow', 'auraFast'];

/**
 * How close the boss has to be for the aura to be at full, and how far for it to be silent, in world
 * units between the two hulls.
 *
 * ⚠️ **This is a distance the PLAYER controls**, which is what makes the aura worth having: a boss
 * holds a station 100–122 units ahead of the camera and the player's box runs from about 10 to 167,
 * so how loud the boss sounds is a function of how far in they have pushed. It answers the ask —
 * *"as it gets closer to the player"* — from the end that moves.
 *
 * ⚠️ **`NEAR` is not zero and cannot be.** The hulls collide at about fifteen units, so a range that
 * ran to zero would have its top half live in a place the player cannot reach without dying.
 *
 * ⚠️ **`FAR` IS 124 BECAUSE THAT IS THE FURTHEST GAP THE GAME CAN PRESENT, AND IT WAS 105 FOR NO
 * STATED REASON** — `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`. Driven over
 * every row in `src/content/bosses.ts`, the widest reachable gap is `lattice` at its far drift with
 * the ship at the back of the box: 123.5 units. At 105 the top fifth of the reachable span was
 * already silent and *silent* meant *the player has backed off as far as the box allows, and a bit
 * less than that too*, which is a boundary the player cannot feel. It is the same argument `NEAR`
 * makes at the other end, and `tests/music.test.ts` now drives it off `BOSSES` rather than trusting
 * the number.
 */
export const AURA_NEAR_UNITS = 26;
export const AURA_FAR_UNITS = 124;

/**
 * The exponent the aura's ramp is raised to. Above 1 the movement crowds towards the near end.
 *
 * ── IT WAS 2, AND THAT WAS THE WHOLE OF *"THE BOSS AURA WAS REALLY WEAK"* ───────────────────────
 *
 * ⚠️ **Reported from play** — *"the boss aura music was really weak, I didn't even notice it over the
 * fire"* — and it was not a gain problem, which is what it sounds like.
 * `docs/decisions/0091-the-boss-has-an-aura.md` squared the ramp so that *"the last few units are
 * where it moves"*, and squaring did that far harder than the sentence intended: at a gap of 70 world
 * units — an utterly ordinary fighting distance, the player mid-box against a boss holding station at
 * 110 — the aura sat at **0.196** of its ceiling. Nearly every second of every boss fight happened in
 * the part of the curve that had already collapsed.
 *
 * ⚠️ **1.6 keeps 0091's shape and stops it eating the fight.** The near half of the range still
 * carries twice the build the far half does, which is the property `tests/music.test.ts` holds and
 * the thing 0091 actually asked for; what goes is the silent middle. At the same gap of 70 the aura
 * is now 0.392, and 0092 has the table.
 *
 * ⚠️ **A CONSTANT RATHER THAN A MULTIPLY, because the multiply could not be tuned.** `clamped *
 * clamped` has no number in it to move, so the only edits available were *square it* and *do not*.
 */
export const AURA_CURVE = 1.6;

/**
 * How loud the music gets, as a fraction of the mix.
 *
 * ⚠️ **0.34 → 0.44 → 0.55, and the same report produced both moves** — *"the game sfx are too loud
 * over the background music"*, then *"main sfx need to be lowered a bit, background music needs to be
 * raised a bit"* about the build the first move shipped in.
 * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`. The other half is
 * `MASTER_GAIN` in `src/app/sound.ts`, which came down again; **both halves are one change** and
 * tuning either alone is how the mix ends up clipping or inaudible.
 *
 * ⚠️ **THE CEILING IS 0.597 AND IT IS MEASURED, NOT GUESSED.** `tests/music.test.ts` sums every layer
 * at the boss row sample by sample and refuses a peak past full scale; with 0092's aura the unweighted
 * sum peaks at 1.674, so this constant cannot exceed 1/1.674 whatever the ear wants. **Raising a
 * LAYER's gain lowers that ceiling**, which is why 0092's aura move and its drone move are one
 * change: the aura went up about a quarter and the drone paid for it.
 *
 * ⚠️ **0.52 rather than the 0.597 that fits, and the margin is deliberate.** The guard is over the
 * music bus alone; the cues run into the same destination and nothing measures the two together.
 * 0092 has the arithmetic and names it as the thing owed.
 */
export const MUSIC_GAIN = 0.52;

/**
 * How far into a level the music starts listening for the boss, in world units.
 *
 * ⚠️ **A distance rather than a timer**, like everything else this project paces — so it means the
 * same thing on a device that drops frames, and so a level that is retuned carries it. The approach
 * begins about twelve seconds of scroll before the boss arrives, which is long enough to be a build
 * and short enough that it is clearly about the boss rather than about the level.
 */
export const BOSS_APPROACH_UNITS = 430;

/**
 * The key. Every pitched note is a ratio off this, so the whole piece transposes from one number.
 *
 * A low A, minor — the notes below are the natural minor's, which are the ones that cannot sound
 * wrong over a drone in the same key.
 */
export const MUSIC_ROOT = 55;

/**
 * How many fixed sim steps there are to a beat.
 *
 * ── THIS IS THE WHOLE OF WHY THE TEMPO MOVED, AND IT IS NOT A MUSIC CONSTANT ────────────────────
 *
 * ⚠️ **`docs/decisions/0093-the-gun-is-on-the-grid.md`.** Asked for in play: *"we could almost make a
 * rhythm style game… what can we do so that as you pick up or lose power ups the music speeds up,
 * slows down etc and works in a beat to the rhythm of the fire?"* The player's auto-fire runs on the
 * fixed-step clock and never stops (`src/content/actions.ts` bans a fire action), so it is **a
 * metronome the player cannot switch off** — and putting it in time with the music means the gap
 * between volleys has to be a whole number of steps AND a musical fraction of a beat.
 *
 * ⚠️ **THAT IS ONLY POSSIBLE IF A BEAT IS A WHOLE NUMBER OF STEPS WITH USEFUL DIVISORS, AND 133⅓ BPM
 * WAS NOT.** 0090's beat was 0.45s, which is **27** steps, and 27 divides only by 3 and 9: a
 * three-rung fire ladder with a 3× hole in it. No amount of tuning the gun reaches a grid the music
 * is not on, which is the fact
 * [`the-gun-on-the-grid-mapped`](../../reports/the-gun-on-the-grid-mapped-2026-08-09.md) did not
 * state — it computed its grid at 100 BPM, which the music has never been at.
 *
 * ⚠️ **24 steps gives 24, 12, 8, 6, 4 and 3** — quarters, eighths, eighth-triplets, sixteenths,
 * sixteenth-triplets and thirty-seconds — and 3600/24 is **150 BPM**, which is where the genre the
 * play-test named actually sits. `src/content/pickups.ts` is what spends those divisors.
 *
 * ⚠️ **It cannot be derived from `STEPS_PER_SECOND` here**, because that lives in
 * `src/state/screens.ts` and `docs/decisions/0015-the-layer-ladder.md` points the arrow the other
 * way — `content` may not import `state`. `tests/music.test.ts` holds the two to each other instead,
 * which is the same cross-file check `tests/bombs.test.ts` makes for a blast's reach and its art.
 */
export const STEPS_PER_BEAT = 24;

/**
 * The bar, in seconds, and how many of them a loop is.
 *
 * ⚠️ **THE LOOP LENGTH MUST BE A WHOLE NUMBER OF SAMPLES AT EVERY RATE IT IS BAKED AT.** A length
 * that rounds is a layer that drifts against the other three, and drift is the one failure this
 * design cannot recover from — there is no scheduler to re-align anything. 0.4s a beat is 150 BPM,
 * and eight beats is 3.2 seconds, which is exact at 44100, at 22050 and at 48000.
 * `tests/music.test.ts` holds it rather than this comment.
 *
 * ⚠️ **0.45 → 0.4, and it is `STEPS_PER_BEAT` above that decides it** rather than a taste about
 * tempo. Every note length written as a multiple of `BEAT_SECONDS` follows it; the handful written
 * in absolute seconds — a kick's 0.26, a hat's 0.04 — deliberately do not, because a drum's decay is
 * a property of the drum and not of the tempo.
 */
export const BEAT_SECONDS = 0.4;
export const LOOP_BARS = 2;
export const LOOP_SECONDS = BEAT_SECONDS * 4 * LOOP_BARS;

/**
 * One voice: a pattern, and the sound one note of it makes.
 *
 * ⚠️ **A pattern rather than a list of notes, because a list of notes is not a row.** Level one's
 * bass is thirty-two entries; written out as placed notes it would be thirty-two `CueLayer`s with a
 * hand-computed `at` on each, which is content nobody can read and nobody can retune.
 * `src/app/music.ts` expands it.
 */
export interface MusicVoice {
  /**
   * One entry per step. For a `pitched` voice it is a semitone off the root; for anything else it is
   * whether the note plays at all.
   *
   * ⚠️ **A rest is `null`, not a zero.** Zero is the root, which is the most common note there is.
   */
  steps: readonly (number | null)[];
  /** Whether `steps` are semitones (pitched) or plays and rests (drums). */
  pitched: boolean;
  /** How many steps there are to a beat. 1 is quarters, 2 eighths, 4 sixteenths. */
  perBeat: number;
  /** Octaves above `MUSIC_ROOT`. Only read by a pitched voice. */
  octave: number;
  /**
   * What one note sounds like — the same `CueLayer` the cue synthesiser uses.
   *
   * ⚠️ **Reusing it is not a shortcut, it is what keeps the music and the effects the same
   * instrument.** A separate note type would have its own filters and its own envelope and would
   * drift into being a second synthesiser, which is how a game ends up with a soundtrack that sounds
   * like it came from somewhere else.
   *
   * `from` and `to` are REPLACED for a pitched voice, and are the note's own for a drum.
   */
  note: CueLayer;
}

/*
  ⚠️ **THE LADDER IS ADDITIVE AND THAT IS THE ASK, STATED AS A TABLE.** *"Backgroundy, then an
  increased beat and bass leading into the boss fight, then really pumping as the boss appears"*
  describes one piece of music getting fuller — not four pieces. Every level below opens a layer and
  nothing is ever closed except by going back down a step.
*/

/** How far into a run the music is. */
export const MUSIC_LEVELS = ['calm', 'run', 'approach', 'boss'] as const;

export type MusicLevel = (typeof MUSIC_LEVELS)[number];

/**
 * What each level has open, per layer.
 *
 * ⚠️ **The drone comes DOWN for the boss**, which is the only place the ladder is not monotonic and
 * it is deliberate: with all four open the pad is what muddies the low end, and the fight wants the
 * bass and the kick to be the things underneath. It is still open, so nothing starts or stops.
 *
 * ⚠️ **0.7 → 0.55, and it is buying the aura's headroom rather than expressing a taste** —
 * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`. The aura's voices went up
 * about a quarter and `MUSIC_GAIN`'s measured ceiling is what that spends; a pad and an aura occupy
 * the same low-mid band, so taking the drone further in the direction 0090 had already taken it is
 * the cheapest place in the table to find the room. **The two moves are one change** and the sum
 * guard in `tests/music.test.ts` is what says they fit.
 */
/**
 * ⚠️ **The aura's numbers here are a CEILING rather than a gain**, and it is the one row in the table
 * that is not the whole answer: `src/app/music.ts` multiplies them by how close the boss is, so a
 * boss at arm's length is at these values and a boss across the screen is at nothing. Every other
 * layer means exactly what it says. `docs/decisions/0091-the-boss-has-an-aura.md`.
 *
 * ⚠️ **The aura's two moved to 1 and 0.9 from 0.9 and 0.75**, which is the smaller half of
 * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md` — `AURA_CURVE` is the larger
 * one. Raising a ceiling here spends `MUSIC_GAIN`'s measured headroom, so the two cannot be tuned
 * apart: `tests/music.test.ts` sums this row sample by sample and is what says whether they fit.
 */
export const MUSIC_LADDER: Record<MusicLevel, Record<MusicLayer, number>> = {
  calm: { drone: 0.55, bass: 0, beat: 0, drive: 0, auraSlow: 0, auraFast: 0 },
  run: { drone: 0.8, bass: 0.75, beat: 0, drive: 0, auraSlow: 0, auraFast: 0 },
  approach: { drone: 0.8, bass: 1, beat: 0.9, drive: 0, auraSlow: 0, auraFast: 0 },
  boss: { drone: 0.55, bass: 1, beat: 1, drive: 1, auraSlow: 1, auraFast: 0.9 },
};

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

export const MUSIC: Record<MusicLayer, readonly MusicVoice[]> = {
  /*
    THE DRONE — always sounding, and the whole of what *"backgroundy"* means. One long note a bar,
    behind a filter low enough that it never competes with anything; the second bar drops to the
    seventh, which is the only harmonic movement in the piece and is what stops two bars of one chord
    reading as a held note.
  */
  drone: [
    {
      steps: [0, -2],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.16, attack: 0.35, curve: 0.9, lowFrom: 520, lowTo: 300, q: 0.9 },
    },
    {
      // The same note four cents sharp. Two saws slightly apart is the oldest pad there is, and it
      // is the difference between a chord and an organ.
      steps: [0, -2],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.16, attack: 0.35, curve: 0.9, lowFrom: 516, lowTo: 298, q: 0.9 },
    },
    {
      steps: [7, 5],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.1, attack: 0.4, curve: 0.9, lowFrom: 560, lowTo: 320, q: 0.9 },
    },
    {
      steps: [0, -2],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.2, attack: 0.3, curve: 0.9 },
    },
  ],

  /*
    THE BASS — eighths, filtered and driven. The first thing the ladder opens, and the reason a level
    stops feeling like an empty room.
  */
  bass: [
    {
      steps: [0, 0, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, 0, 3, 5, 7],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.34, attack: 0.004, curve: 4.5, lowFrom: 1400, lowTo: 380, q: 1.4, drive: 0.4 },
    },
    {
      // The octave under it, which is what makes it felt rather than only heard — the same trick
      // every explosion in `src/content/cues.ts` uses, for the same reason.
      steps: [0, 0, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, 0, 3, 5, 7],
      pitched: true,
      octave: 0,
      perBeat: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.5, gain: 0.3, attack: 0.004, curve: 4 },
    },
  ],

  /*
    THE BEAT — kick, snare and hats. *"An increased beat"* arriving, and the layer that turns a
    background into a thing with a pulse.
  */
  beat: [
    {
      steps: [1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 150, to: 45, seconds: 0.26, gain: 0.75, attack: 0.001, curve: 4.5, drive: 0.2 },
    },
    {
      steps: [1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.02, gain: 0.16, attack: 0.0005, curve: 8, lowFrom: 6000, highFrom: 800 },
    },
    {
      // The backbeat, on two and four, and the only thing in the layer with midrange in it.
      steps: [_, 1, _, 1, _, 1, _, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.16, gain: 0.3, attack: 0.001, curve: 6, lowFrom: 4200, lowTo: 1600, highFrom: 400 },
    },
    {
      steps: [_, 1, _, 1, _, 1, _, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'tri', from: 220, to: 170, seconds: 0.1, gain: 0.16, attack: 0.001, curve: 7 },
    },
    {
      // Sixteenth hats, alternating loud and quiet, which is what makes them a shuffle rather than a
      // machine. Thirty-two of them a loop, and each is two milliseconds of noise.
      steps: Array.from({ length: 32 }, () => 1),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.04, gain: 0.07, attack: 0.0005, curve: 9, lowFrom: 13000, highFrom: 6000 },
    },
  ],

  /*
    THE DRIVE — sixteenth arpeggio and toms. Only a boss ever hears this one, and it is the whole of
    *"really get pumping as the boss appears"*.
  */
  drive: [
    {
      steps: [0, 3, 7, 10, 12, 10, 7, 3, 0, 3, 7, 10, 12, 10, 7, 3, 0, 3, 7, 10, 12, 10, 7, 3, 0, 3, 7, 10, 12, 10, 7, 3],
      pitched: true,
      perBeat: 4,
      octave: 3,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.1, attack: 0.002, curve: 5, lowFrom: 4200, lowTo: 1200, q: 2, drive: 0.3 },
    },
    {
      // Toms rolling into the top of every bar. A fill is what tells the ear a bar has ended, and
      // without one a two-bar loop is a four-second stretch of the same thing.
      steps: [_, _, _, _, _, _, _, _, _, _, _, _, _, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 190, to: 105, seconds: 0.2, gain: 0.4, attack: 0.001, curve: 5, drive: 0.25 },
    },
  ],

  /*
    THE AURA, SLOW — one swell every two beats.

    ⚠️ EVERY SWELL LASTS LONGER THAN THE GAP TO THE NEXT ONE, and the last one has to cross the end of
    the loop. The first draft did not: its tails stopped at 3.51s of a 3.6s loop, so the loop restarted
    from silence into a 0.22s attack and pumped once a bar. 0090's seam guard caught it within the
    hour — *a loop cannot be quieter where it begins than where it ends* — which is a guard written
    for one decision catching the very next one's content.

    A boss across the screen is only ever this, and it is
    meant to read as a presence rather than as a part: a low fifth that rises into the bar and a
    breath of filtered noise over it.
  */
  auraSlow: [
    {
      steps: [0, _, 0, _, 0, _, 0, _],
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.4, attack: 0.22, curve: 1.6, lowFrom: 420, lowTo: 900, q: 1.1 },
    },
    {
      steps: [7, _, 7, _, 7, _, 7, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.54, attack: 0.28, curve: 1.4 },
    },
    {
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.3, gain: 0.13, attack: 0.3, curve: 1.5, lowFrom: 900, lowTo: 2600, highFrom: 300, q: 0.7 },
    },
  ],

  /*
    THE AURA, FAST — the beat and then the offbeat. Adding this to the layer above is what *"builds in
    tempo"* IS: the pulse goes from one every two beats to one every half beat without a tempo
    existing anywhere as a number, and it cannot fall out of time because it is in the same loop.
  */
  auraFast: [
    {
      steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.21, attack: 0.006, curve: 5, lowFrom: 2600, lowTo: 700, q: 1.6 },
    },
    {
      // The offbeats, a fifth up — the half that makes it read as a doubling rather than as louder.
      steps: [_, 7, _, 7, _, 7, _, 7, _, 7, _, 7, _, 7, _, 7],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.26, gain: 0.17, attack: 0.004, curve: 6 },
    },
    {
      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 96, to: 62, seconds: 0.16, gain: 0.44, attack: 0.002, curve: 5, drive: 0.2 },
    },
  ],
};
