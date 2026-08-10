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
export const MUSIC_LAYERS = [
  'drone',
  'bass',
  'beat',
  'engine',
  'chords',
  'drive',
  'lead',
  'auraSlow',
  'auraFast',
] as const;

export type MusicLayer = (typeof MUSIC_LAYERS)[number];

/**
 * The layers that belong to the TITLE's piece and are closed once a level starts.
 *
 * ── THE ONE PLACE THE LADDER IS ALLOWED TO CLOSE SOMETHING ──────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0095-the-level-has-its-own-music.md`.** 0090's ladder only ever opened layers,
 * because its ask was *"backgroundy, then an increased beat and bass, then really pumping"* — one
 * piece getting fuller. The new ask is a different shape: *"keep the current background music for the
 * title and then let's really kick it up a notch in the game."* **That is two pieces**, and the
 * boundary between them is a screen change, which is the one moment a crossfade is not a seam.
 *
 * ⚠️ **AND IT IS FORCED BY THE HARMONY RATHER THAN BY TASTE.** The title's bass is an A-rooted riff
 * with no chord changes in it; the level's progression is A minor – F – C – G. Held open underneath,
 * that riff is a wrong note for three bars in every four. A layer that cannot be in two places is a
 * layer that has to stop.
 *
 * ⚠️ **`drone` is deliberately NOT here** — it is the connective tissue and it stays open through
 * everything, which is what keeps 0090's *the music never stops* literally true. It sounds an A and a
 * G, and over F, C and G those are consonances rather than accidents.
 */
export const TITLE_ONLY: readonly MusicLayer[] = ['bass', 'beat'];

/**
 * How many bars long each layer's loop is.
 *
 * ⚠️ **THE MULTIPLE IS THE RULE AND THE VALUES ARE NOT.** 0090's single unrecoverable failure is
 * layers that drift apart, and its answer was that every loop is the same number of samples. **A
 * whole multiple gives exactly the same guarantee**: a 4-bar pad over a 2-bar drum loop realigns
 * every 4 bars for ever, because both are an exact number of samples at every rate the bake is given.
 * `tests/music.test.ts` holds the multiple, not the numbers.
 *
 * ⚠️ **Four bars is a PROGRESSION and two bars cannot hold one**, which is the whole reason this
 * exists — A minor – F – C – G is the ballad half of what was asked for, and it needs four bars to
 * be itself. Everything that is a rhythm rather than a harmony stays at two, because four bars of
 * identical drums is 6.4 seconds of buffer bought for nothing.
 *
 * ⚠️ **The bake is 11.5ms per second of audio and it happens at the first press.** That is the
 * constraint that says four bars rather than eight: eight would have been a longer progression and
 * about 900ms of synthesis on this machine, which is a freeze at *tap to start* on the phone
 * `docs/decisions/0022-frame-rate-is-a-feature.md` sizes for.
 */
export const LAYER_BARS: Record<MusicLayer, number> = {
  drone: 2,
  bass: 2,
  beat: 2,
  engine: 2,
  chords: 4,
  drive: 2,
  lead: 4,
  auraSlow: 2,
  auraFast: 2,
};

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
/*
  ── AND IT MOVED AGAIN, BECAUSE THE BOSSES DID ───────────────────────────────────────────────────

  ⚠️ **`docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`.** 0101 pushed every boss
  station about twenty units forward, so the furthest a player can be from one grew from 123.5 to
  **130.8** — and `tests/music.test.ts` drives this off `BOSSES` rather than trusting the number, so
  it went red the moment the stations moved. **That is the guard 0092 wrote working exactly as
  intended**: it said in as many words that its two assertions *cannot be satisfied by moving
  `AURA_FAR_UNITS` to meet them*, and the one that caught this is the other one.

  ⚠️ **AND IT GOES PAST THE WIDEST GAP RATHER THAN TO IT, WHICH IS A CHANGE OF MEANING.** 132 covers
  130.8 and satisfies 0092's rule as written — and it is not enough, because the two guards 0092 left
  behind became **mutually unsatisfiable** at that span. Driven out:

  | | at half the range | at the back of the box | bound |
  |---|---|---|---|
  | `FAR` 132, any exponent | 0.33–0.39 | **0.049–0.078** | must be over 0.1 |
  | `FAR` 145, exponent 1.5 | 0.354 | **0.120** | ✓ both |

  The midpoint bound needs an exponent above 1.32 and the back-of-the-box bound needed one below
  1.22, at a span of 106. There is no such number: the span itself had to grow.

  ⚠️ **So *silent* is now somewhere the player cannot reach, and that is 0092's own fix taken one
  step further.** 0092 raised this because the top fifth of the reachable span was silent and *"a
  boundary the player cannot feel"* is not a boundary. At 145 the aura is at **0.041** of its ceiling
  at the furthest the player can get — present, nearly gone, and never actually off. A boss you can
  still just hear from the very back of your own box is the thing the report asked for.
*/
export const AURA_NEAR_UNITS = 26;
export const AURA_FAR_UNITS = 145;

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
/*
  ── 1.6 → 1.5, AND IT IS THE SAME REPORT AS 0092's ARRIVING THROUGH THE BOSSES ──────────────────

  ⚠️ **`docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`.** Moving the bosses
  forward did not only widen the range — it moved **the player's defensive position further from the
  boss**, which is precisely the position 0092's second guard is written from. At the back of the box
  against level one's boss the gap went from 96 units to 114, and 1.6 over the new span put the aura
  there at **0.049** of its ceiling: quiet enough to be the defect 0092 is named for, arriving again
  from a change that has nothing to do with sound.

  ⚠️ **The exponent is what decides how much of the reachable span is audible**, and the span grew.
  1.5 over the widened range puts the back of the box at 0.120 — over the tenth `tests/music.test.ts` holds — while the near
  half of the range still carries more of the build than the far half, which is 0091's shape and the
  property that guard is written in.

  ⚠️ **This is the second time this constant has been moved by a decision about something else**, and
  it is the reason it is a constant at all: 0092 made it one precisely because `clamped * clamped` had
  no number in it to move.
*/
export const AURA_CURVE = 1.5;

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
 *
 * ⚠️ **IT IS DECLARED IN `src/content/cues.ts` NOW AND RE-EXPORTED HERE** —
 * `docs/decisions/0099-the-cues-are-in-the-key.md`. It lived here and was read by nothing else,
 * which is exactly how the cues came to be tuned to nothing at all: the import arrow runs
 * `cues → music`, so the file that synthesises the effects **could not see the key** even in
 * principle. Moving it down the ladder is what makes *the whole game is in A minor* a fact the
 * compiler can carry rather than a sentence in a comment.
 *
 * ⚠️ **Re-exported rather than restated**, so `MUSIC_ROOT` is one description and every existing
 * import still resolves — `tests/one-description.test.ts`'s own subject.
 */
export { MUSIC_ROOT } from './cues.ts';

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
 * The grid every cadence that is not the player's own lands on, in sim steps.
 *
 * ── WHY THE ENEMIES GET A COARSER GRID THAN THE GUN ─────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0096-the-enemies-play-along.md`.** Asked for in play: *"it's going to be
 * tricky, but if we can balance the enemies and enemy fire into the rhythm as well that'd be sick."*
 * The player's gun is a LADDER — five authored rungs, each chosen to be a named note value
 * (`src/content/ships.ts`) — so it can sit on the exact subdivision a hand picked. An enemy's cadence
 * is a **tuned number** that a level designer reached by feel, and 0034's rule is that nothing may
 * assert on those values; snapping them to the nearest eighth would move some of them by 8%.
 *
 * ⚠️ **A sixteenth is 100ms and moves nothing by more than 50** — the three enemy rows move by 4%,
 * 0% and 3%, and every boss phase stays strictly faster than the one before it, which an eighth-note
 * grid did not manage for three of the seven. It is fine enough to be a rounding and coarse enough
 * that every shot lands somewhere a listener would call a beat.
 */
export const FIRE_GRID = STEPS_PER_BEAT / 4;

/**
 * The nearest cadence to `steps` that lands on the grid, never shorter than one grid unit.
 *
 * ⚠️ **THE ONE DESCRIPTION, and it is asked in two places that must agree** — the content tables
 * declare their cadences already snapped (guarded, so a hand cannot author one off the grid) and
 * `fireGapFor` snaps again after the difficulty multiplier, which is the step that would otherwise
 * quietly undo all of it: 0.7 of anything is rarely a multiple of anything.
 */
export function onFireGrid(steps: number): number {
  const snapped = Math.round(steps / FIRE_GRID) * FIRE_GRID;
  return snapped < FIRE_GRID ? FIRE_GRID : snapped;
}

/**
 * Steps until a body with cadence `gap` should FIRST fire, so that the shot lands on the grid.
 *
 * ── A PERIOD ON THE GRID IS NOT THE SAME AS A SHOT ON THE GRID ──────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0096-the-enemies-play-along.md`, and it is 0094's lesson arriving at the other
 * end of the field.** Snapping every cadence to a sixteenth makes each body keep a musical TEMPO;
 * where its shots actually land still depends on the step it happened to spawn on. A dozen bodies at
 * correct periods and arbitrary offsets is a smear, not a rhythm.
 *
 * ⚠️ **Quantised ONCE, at spawn, and relative for ever after.** Because `gap` is a whole number of
 * grid units, one alignment holds for the body's whole life — and because it is not re-aligned on
 * every shot, two enemies that spawned on different sixteenths stay on different sixteenths. That is
 * the difference between a pattern and a volley, and it is why the player's gun (0094) reloads
 * absolutely and an enemy does not: there is one ship and there are forty enemies.
 *
 * ── AND EVERY BODY IN A FORMATION SPAWNS ON THE SAME STEP, WHICH IS THE SENTENCE ABOVE FAILING ──
 *
 * ⚠️ **`docs/decisions/0098-a-wave-plays-a-figure.md`.** Reported from play against the build 0096
 * landed in: *"the enemies all fire at exactly the same time when they appear."* The paragraph above
 * is true of two enemies from two waves and false of five from one: `spawnWave` places a whole
 * formation inside one call, so `steps` and `gap` are the same number for every member and so is the
 * answer. **0096 aligned the phase and then handed every body the same one.**
 *
 * ⚠️ **`share` is where in its OWN cadence a body sits, in `[0, 1)`** — the caller's business, and
 * `src/app/frame.ts` derives it from the member's index and the wave's. A share of zero is byte for
 * byte what 0096 returned, which is why the boss and the seeded field can go on asking the old
 * question.
 *
 * ⚠️ **IT ONLY EVER DELAYS, AND THAT IS THE HALF THAT KEEPS 0096's BALANCE CLAIM.** 0096 refused a
 * forward rounding because *"every body on the field would open fire up to a grid unit LATE — a
 * change to how quickly a wave becomes dangerous."* A spread cannot be free of that: N bodies at one
 * cadence CANNOT be at N phases while all of them wait within one grid unit of it, so the two rules
 * are incompatible and this is the direction that makes nothing arrive sooner than it used to.
 *
 * Returns between `gap - FIRE_GRID + 1` and `2 × gap - FIRE_GRID`.
 */
export function nextOnGrid(steps: number, gap: number, share = 0): number {
  const base = gap - FIRE_GRID + (FIRE_GRID - (steps % FIRE_GRID));
  /*
    ⚠️ **The slots are the body's OWN cadence divided by the grid, never the wave's size.** A wave of
    six turrets has eight sixteenths to sit in and a wave of six lancers has thirteen; spreading over
    the count instead would put two bodies on one slot in the first case and leave five empty in the
    second. `gap` is already a whole number of grid units (guarded), so this divides exactly.
  */
  const slots = Math.max(1, Math.round(gap / FIRE_GRID));
  const wrapped = ((share % 1) + 1) % 1;
  return base + Math.floor(wrapped * slots) * FIRE_GRID;
}

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

/** Seconds of one bar. The unit `LAYER_BARS` is counted in. */
export const BAR_SECONDS = BEAT_SECONDS * 4;

/** How long `layer`'s loop is, in seconds. */
export function secondsOfLayer(layer: MusicLayer): number {
  return BAR_SECONDS * LAYER_BARS[layer];
}

/**
 * The PHRASE: how long until every layer is back at its own position zero together.
 *
 * ⚠️ **The longest loop, and only because every other one divides it** — which is the rule
 * `LAYER_BARS` states and `tests/music.test.ts` holds. It is the interval a re-phase has to land on
 * (`src/app/music.ts`), because it is the only instant at which restarting the set is the thing the
 * set was about to do anyway. Landing a correction on a 2-bar boundary would cut the 4-bar pad in
 * half, which is 0090's seam arriving at runtime.
 */
export const PHRASE_BARS = Math.max(...Object.values(LAYER_BARS));
export const PHRASE_SECONDS = BAR_SECONDS * PHRASE_BARS;

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
/*
  ── TWO PIECES NOW, AND `calm` IS THE OTHER ONE ────────────────────────────────────────────────

  `docs/decisions/0095-the-level-has-its-own-music.md`. Reported from play: *"the non-boss background
  music makes kinda interesting title background music, but not great level background music"*, and
  then *"keep the current background music for the title and then let's really kick it up a notch in
  the game."*

  ⚠️ **`calm` is the title, the level break and the run-over screen** — the whole of what 0090's
  piece is now for. It is `drone` and `bass` and `beat`: what a level used to sound like, moved to
  where the play-test said it belonged.

  ⚠️ **`run` upward is the LEVEL's piece and that ladder is still additive**, exactly as 0090
  requires. What crosses between them is the drone, which is why the change of piece is a swell
  rather than an edit.
*/
export const MUSIC_LADDER: Record<MusicLevel, Record<MusicLayer, number>> = {
  calm: { drone: 0.55, bass: 0.7, beat: 0.5, engine: 0, chords: 0, drive: 0, lead: 0, auraSlow: 0, auraFast: 0 },
  run: { drone: 0.5, bass: 0, beat: 0, engine: 0.85, chords: 0.88, drive: 0, lead: 0, auraSlow: 0, auraFast: 0 },
  approach: { drone: 0.5, bass: 0, beat: 0, engine: 0.9, chords: 0.92, drive: 0.7, lead: 0, auraSlow: 0, auraFast: 0 },
  boss: { drone: 0.4, bass: 0, beat: 0, engine: 0.95, chords: 0.95, drive: 0.8, lead: 0.85, auraSlow: 1, auraFast: 0.9 },
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
    ── THE ENGINE — the Rez half, and it is deliberately UNPITCHED ─────────────────────────────────

    Asked for: *"a mix of a power ballad style music and the game Rez."* This is the Rez end of that:
    four-on-the-floor, sixteenth hats, an open hat on every offbeat and a clap on two and four. The
    layer that turns *some music is playing* into *you are inside something moving*.

    ⚠️ **NOT ONE PITCHED NOTE IN IT, AND THAT IS WHAT KEEPS IT TWO BARS.** `chords` runs a four-bar
    progression; anything pitched here would be a wrong note for half of it, and matching the length
    would double a drum loop's buffer to say the same thing twice. A rhythm is the one thing that is
    true over every chord.

    ⚠️ **The kick is the loudest single thing in the game's music and it is on every beat**, which is
    what makes 0093's gun audible AS a rhythm: the pulse is an eighth-note triplet against it, so
    every third volley lands on a kick.
  */
  engine: [
    {
      // Four on the floor. A longer, deeper fall than the title beat's kick — this one is the floor
      // rather than a pulse on top of it.
      steps: [1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 160, to: 38, seconds: 0.42, gain: 0.6, attack: 0.001, curve: 2.8, drive: 0.3 },
    },
    {
      // The click on top of it, so the kick reads on a phone speaker with no low end at all.
      steps: [1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.015, gain: 0.15, attack: 0.0004, curve: 9, lowFrom: 7000, highFrom: 900 },
    },
    {
      // A clap on two and four. Two noise bursts a few milliseconds apart is what a clap IS, and one
      // of them is this voice — the other is below.
      steps: [_, 1, _, 1, _, 1, _, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.13, gain: 0.27, attack: 0.001, curve: 5.5, lowFrom: 5200, lowTo: 1800, highFrom: 700 },
    },
    {
      // Sixteenth hats, quiet and closed. Thirty-two of them a loop and each is under two hundredths
      // of a second — the thing that makes a bar feel subdivided rather than empty.
      steps: Array.from({ length: 32 }, () => 1),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.018, gain: 0.075, attack: 0.0004, curve: 9, lowFrom: 14000, highFrom: 7500 },
    },
    {
      // The open hat on every offbeat, which is the single most recognisable thing in the genre —
      // it is what makes four-on-the-floor read as *dance* rather than as *march*.
      steps: [_, 1, _, 1, _, 1, _, 1, _, 1, _, 1, _, 1, _, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.11, gain: 0.105, attack: 0.001, curve: 3.2, lowFrom: 11000, highFrom: 5200 },
    },
  ],

  /*
    ── THE CHORDS — the power-ballad half, and the reason a layer may be four bars ────────────────

    **A minor – F – C – G**, one bar each. It is the progression every anthem is built on, and it is
    the whole of what *"power ballad"* means once the tempo is 150: the harmony does the lifting while
    the drums do the driving.

    ⚠️ **THIS IS WHY `LAYER_BARS` EXISTS.** Two bars cannot hold four chords, and 0090's identical
    lengths forbade a layer that needed more. Whole multiples keep 0090's guarantee and buy the
    progression.

    ⚠️ **Two saws four cents apart per voice, which is the supersaw and is not decoration.** One saw
    is an organ; two slightly apart is the sound the genre is made of, and it is the same trick the
    drone already uses one octave down.

    ⚠️ **The sub moves with the chord and the drone does not**, which is the division of labour that
    lets both exist: the drone holds A through everything as the connective tissue, and this states
    the harmony underneath it.
  */
  chords: [
    {
      // The roots, held. Each note is longer than its bar so it sings into the next one — and the
      // last one crosses the end of the loop, which is what 0090's seam guard is watching.
      steps: [0, -4, 3, -2],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.17, attack: 0.06, curve: 1.5, lowFrom: 900, lowTo: 2400, q: 1.2 },
    },
    {
      steps: [0, -4, 3, -2],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.17, attack: 0.07, curve: 1.5, lowFrom: 890, lowTo: 2380, q: 1.2 },
    },
    {
      // The fifths.
      steps: [7, 3, 10, 5],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.5, gain: 0.13, attack: 0.09, curve: 1.5, lowFrom: 1100, lowTo: 2800, q: 1.1 },
    },
    {
      // The top voice, an octave up — where the chord stops being a bed and starts being a chord.
      steps: [15, 12, 19, 14],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.1, attack: 0.12, curve: 1.6, lowFrom: 1600, lowTo: 3600, q: 1 },
    },
    {
      // THE ROLLING SUB. Offbeat eighths under the kick, moving with the chord — the other half of
      // what makes four-on-the-floor move rather than plod, and the reason the kick has room.
      steps: [
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, 3, _, 3, _, 3, _, 3,
        _, -2, _, -2, _, -2, _, -2,
      ],
      pitched: true,
      perBeat: 2,
      octave: 0,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.44, gain: 0.33, attack: 0.005, curve: 4.5, lowFrom: 1300, lowTo: 320, q: 1.5, drive: 0.35 },
    },
    {
      /*
        ⚠️ **THE OCTAVE UNDER THE SUB, AND A SPECTRAL GUARD IS WHY IT IS HERE.** The first bake of this
        layer measured LESS energy below 60Hz at every level rung than the title's does — 0.028 against
        0.042 — which for a piece built on four-on-the-floor is backwards, and is invisible to every
        other measure in `tests/music.test.ts`. A driven saw behind a falling filter is mostly
        harmonics; what puts fundamental in the room is a sine.

        The same trick the title's bass uses one file-section up, and every explosion in
        `src/content/cues.ts` uses, for the same reason: *felt rather than only heard*.
      */
      steps: [
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, 3, _, 3, _, 3, _, 3,
        _, -2, _, -2, _, -2, _, -2,
      ],
      pitched: true,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.62, gain: 0.46, attack: 0.004, curve: 3.2 },
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
    ── THE LEAD — the tune, and the boss is what it arrives for ───────────────────────────────────

    Four bars over the progression, mostly long notes: rise, hold, fall, lift. The thing a power
    ballad has that a groove does not is **a melody somebody could hum**, and this is the only layer
    in the game that is one.

    ⚠️ **It opens at the BOSS and nowhere else**, which makes it the loudest structural event in the
    music — the arrival of a tune, rather than one more part. 0090 says the boss is *"really get
    pumping"*; a fill and an arpeggio were what that meant when there was nothing to sing.

    ⚠️ **Four bars, because a melody over a four-chord progression has to be four bars.** A two-bar
    tune would state itself twice per cycle and land on the wrong harmony the second time — the exact
    failure `LAYER_BARS` was added to make impossible.

    ⚠️ **Notes are held long and overlap deliberately.** There is no portamento available (a pitched
    voice replaces `from` and `to` with one pitch), so what gives the line its shape is length and
    the filter opening across it rather than any glide.
  */
  lead: [
    {
      /*
        A minor: A – C – B. F: A held. C: G – E. G: B – A – C, lifting into the repeat.

        In the natural minor throughout, so nothing in it can be wrong over the drone.
      */
      steps: [
        12, _, _, _, 15, _, 14, _,
        12, _, _, _, _, _, _, _,
        10, _, _, _, 7, _, _, _,
        14, _, 12, _, 14, _, 15, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.15, attack: 0.02, curve: 1.8, lowFrom: 2200, lowTo: 5200, q: 1.4 },
    },
    {
      // The same line an octave down and quieter, which is what stops a lead sounding thin without
      // making it louder. The oldest doubling there is.
      steps: [
        12, _, _, _, 15, _, 14, _,
        12, _, _, _, _, _, _, _,
        10, _, _, _, 7, _, _, _,
        14, _, 12, _, 14, _, 15, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.5, gain: 0.12, attack: 0.03, curve: 1.8 },
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
