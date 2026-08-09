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
 */
export const AURA_NEAR_UNITS = 26;
export const AURA_FAR_UNITS = 105;

/**
 * How loud the music gets, as a fraction of the mix.
 *
 * ⚠️ **Well under the cues, and that is the whole design constraint.** Music that competes with the
 * sound of being shot at is music that hides the thing
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` needs the player to hear. Every cue is
 * information; the music is not, which is why it is the one that gives way.
 */
export const MUSIC_GAIN = 0.34;

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
 * The bar, in seconds, and how many of them a loop is.
 *
 * ⚠️ **THE LOOP LENGTH MUST BE A WHOLE NUMBER OF SAMPLES AT EVERY RATE IT IS BAKED AT.** A length
 * that rounds is a layer that drifts against the other three, and drift is the one failure this
 * design cannot recover from — there is no scheduler to re-align anything. 0.45s a beat is 133⅓ BPM,
 * and eight beats is 3.6 seconds, which is exact at 44100 and at 22050.
 * `tests/music.test.ts` holds it rather than this comment.
 */
export const BEAT_SECONDS = 0.45;
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
 */
/**
 * ⚠️ **The aura's numbers here are a CEILING rather than a gain**, and it is the one row in the table
 * that is not the whole answer: `src/app/music.ts` multiplies them by how close the boss is, so a
 * boss at arm's length is at these values and a boss across the screen is at nothing. Every other
 * layer means exactly what it says. `docs/decisions/0091-the-boss-has-an-aura.md`.
 */
export const MUSIC_LADDER: Record<MusicLevel, Record<MusicLayer, number>> = {
  calm: { drone: 0.55, bass: 0, beat: 0, drive: 0, auraSlow: 0, auraFast: 0 },
  run: { drone: 0.8, bass: 0.75, beat: 0, drive: 0, auraSlow: 0, auraFast: 0 },
  approach: { drone: 0.8, bass: 1, beat: 0.9, drive: 0, auraSlow: 0, auraFast: 0 },
  boss: { drone: 0.7, bass: 1, beat: 1, drive: 1, auraSlow: 0.9, auraFast: 0.75 },
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
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.3, attack: 0.22, curve: 1.6, lowFrom: 420, lowTo: 900, q: 1.1 },
    },
    {
      steps: [7, _, 7, _, 7, _, 7, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.42, attack: 0.28, curve: 1.4 },
    },
    {
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.3, gain: 0.1, attack: 0.3, curve: 1.5, lowFrom: 900, lowTo: 2600, highFrom: 300, q: 0.7 },
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
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.16, attack: 0.006, curve: 5, lowFrom: 2600, lowTo: 700, q: 1.6 },
    },
    {
      // The offbeats, a fifth up — the half that makes it read as a doubling rather than as louder.
      steps: [_, 7, _, 7, _, 7, _, 7, _, 7, _, 7, _, 7, _, 7],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.26, gain: 0.13, attack: 0.004, curve: 6 },
    },
    {
      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 96, to: 62, seconds: 0.16, gain: 0.34, attack: 0.002, curve: 5, drive: 0.2 },
    },
  ],
};
