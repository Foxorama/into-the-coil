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

/*
  ── THE STYLE BRIEF IS ADVISORY NOW, AND IT WAS LOAD-BEARING IN THIS FILE ────────────────────────

  ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Said in play, unprompted: *"if
  the power ballad and rez ask is too limiting, let's change that… don't be limited by personal 'style'
  requests and try to fit the music into that, go off playtest reports and actual music that sounds
  good. What I ask for may not be 'what's right' so if I put too many strictures on things, we can go
  around them or ignore them if needed."*

  ⚠️ **Every *"a mix of a power ballad style music and the game Rez"* below is now a record of WHY a
  layer came out the way it did, not a constraint on what it may become.** The sections that quote it
  are left exactly as written — `docs/decisions/README.md`'s *written once* applies to the reasoning
  wherever it lives — and a later hand is free to overrule any of them with a play report and an ear.
  `hook` is the first one that was.
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
  'sub',
  'engine',
  'perc',
  'chords',
  'groove',
  'arp',
  'hook',
  'drive',
  'toll',
  'lead',
  'stomp',
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
 *
 * ── AND THE BAKE STOPPED BEING THE CONSTRAINT, WHICH IS WHY `chords` IS EIGHT ───────────────────
 *
 * ⚠️ **`docs/decisions/0102-the-music-goes-somewhere.md`.** The paragraph above is the reason the
 * harmony repeated every 6.4 seconds, and the report is *"an incredibly limited couple of repeating
 * beats that's a few seconds of sound repeated for minutes."* **The length of the music was being
 * decided by how long it takes to synthesise.**
 *
 * ⚠️ **The synthesis now runs on the title screen instead of on the first press** —
 * `src/app/sound.ts`'s prewarm — so the 900ms 0095 refused to spend is spent before the player has
 * chosen a difficulty. `chords` is eight bars: **A minor – F – C – G, then A minor – F – G – E**, so
 * the second half turns rather than repeats and the piece takes 12.8 seconds to come round.
 */
/*
  ── AND `engine` IS FOUR BARS NOW, WHICH IS THE METRONOME REPORTED A THIRD TIME ──────────────────

  ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Reported from play:
  *"the metronome beats are still louder and because they're two beats back and forth, every mix
  sounds the same."*

  ⚠️ **0102 ANSWERED THIS IN `beat`, WHICH IS `TITLE_ONLY`.** Its finding — every drum in the game
  struck at one weight — was true of `engine` too, and `engine` is the layer playing under every
  second of every level. Two bars of four-on-the-floor with a clap on two and four, every entry a
  literal `1`, is *two beats back and forth* exactly.

  ⚠️ **Velocities are half the answer and the LENGTH is the other half.** A weighted bar repeated
  every 3.2 seconds is still the same bar; four bars is the shortest span that can hold a phrase — a
  hole in the fourth bar's kick, a fill under it — which is what makes a listener hear a loop as music
  rather than as a wheel. It costs 1.1 MB of buffer and nothing per frame.
*/
export const LAYER_BARS: Record<MusicLayer, number> = {
  drone: 2,
  bass: 2,
  beat: 2,
  sub: 8,
  engine: 4,
  perc: 4,
  chords: 8,
  groove: 4,
  arp: 8,
  hook: 4,
  drive: 2,
  toll: 4,
  lead: 4,
  stomp: 2,
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
 * How far into a level the boss starts being audible, and how much of the aura the LEVEL can raise
 * on its own before the fight begins.
 *
 * ── THE AURA WAS A PROXIMITY CUE AND IT IS NOW ALSO A LEVEL-LONG BUILD ──────────────────────────
 *
 * ⚠️ **`docs/decisions/0107-a-level-is-a-place.md`.** Asked for in play: *"the aura music for the boss
 * needs to start about 15-30secs into the start of a level and then amp up until you beat the boss."*
 *
 * ⚠️ **720 UNITS IS TWENTY SECONDS**, at the 36 units a second the camera covers — the middle of the
 * range asked for, and a distance rather than a timer like everything else this project paces
 * (`BOSS_APPROACH_UNITS` has the argument). A level authored longer therefore spends longer building,
 * which is the behaviour a fixed timer would not have.
 *
 * ⚠️ **THE CEILING IS 0.55 AND THE REASON IS THAT THE FIGHT MUST STILL HAVE SOMEWHERE TO GO.** If the
 * level-long build reached 1 the boss would arrive at the volume it had been at for a minute, and
 * `docs/decisions/0091-the-boss-has-an-aura.md`'s whole subject — *as it gets closer to the player* —
 * would have nothing left to say. At 0.55 the level climbs to just over half and the fight's own
 * proximity carries the rest, so the two mechanisms are a build and a modulation rather than two
 * claims on one gain.
 *
 * ⚠️ **AND THE TWO ARE COMBINED WITH A MAXIMUM, NEVER A SUM.** A sum would put the aura past its
 * ceiling the moment a player closed on a boss at the end of a long level, which is exactly the
 * headroom `tests/music.test.ts` measures. `auraFor` is the one description.
 */
export const AURA_ONSET_UNITS = 720;
export const AURA_LEVEL_CEILING = 0.55;

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
 *
 * ── AND THE THING 0092 SAID WAS OWED IS NOW MEASURED, WHICH IS WHY THIS DID NOT MOVE AGAIN ──────
 *
 * ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** Reported for the fourth time: *"volume
 * levels are still way off as well, background too quiet."* The three previous answers all moved
 * this number. **This one does not**, because `scripts/hear.mjs --play` finally renders the cues over
 * the music and reports the ratio the report is actually about: the bed was **2 to 5 dB QUIETER**
 * than the effects playing over it, worst at max fire.
 *
 * ⚠️ **IT COULD NOT HAVE BEEN FIXED HERE.** `tests/music.test.ts` caps this at 0.597 by measurement —
 * the summed layers peak at 1.674 — so the whole remaining travel was 1.2 dB against a 3–5 dB
 * deficit. **The bus was peak-limited by a 12–14 dB crest factor it never used**, and had no
 * compressor, limiter or soft-clip anywhere on it while every cue had `glue`. It had been
 * gain-staged four times and never mastered.
 *
 * ⚠️ **`MUSIC_DRIVE` below is the lever this one could not be.**
 *
 * ── 0.52 → 0.5, AND IT IS THE FIRST TIME THIS NUMBER HAS MOVED FOR A REASON THAT IS NOT LOUDNESS ─
 *
 * ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Five layers went onto the bus
 * — a sustained sub, percussion, a bell, a boss kit — and `tests/music.test.ts` measured the boss mix
 * at **1.020** of full scale and the approach at 1.005. Every previous move of this constant was an
 * answer to *too quiet*; this one is the clipping guard doing the job 0095 named it for, and the
 * direction is down.
 *
 * ⚠️ **THE BUS RATHER THAN THE SUB, WHICH IS THE CHOICE AND NOT AN ACCIDENT.** The overage happens
 * where the bar line stacks the engine's kick, the sub's drop and the layers whose tails wrap onto
 * it — so the cheapest place to find it is the one layer the report is about. Taking it there would
 * answer *"I want to feel the bass beats in my chest"* by making the bass quieter.
 *
 * ⚠️ **AND THE HEADROOM WAS BOUGHT TWICE OVER BEFORE THIS NUMBER MOVED AT ALL, WHICH IS THE PART
 * WORTH COPYING.** Measured at the boss mix's peak INSTANT rather than in aggregate, two
 * contributions were doing most of it: `toll`'s low sine at −0.47 and `sub`'s at −0.82, both of them
 * tails wrapping onto the bar line where the drop already lives. The bell's octave-under became a
 * choir two octaves up and the floor's tail was shortened — **the sum fell from 2.22 to 1.88 with
 * nothing an ear can name removed**, and what this constant then had to pay for was 0.06 rather than
 * 0.5. A peak is an instant; the fix belongs at the instant.
 *
 * ⚠️ **`MUSIC_DRIVE` is what makes the smaller gain louder rather than quieter**, and the two are one
 * change: `saturate(x, a) ≤ 1` exactly when `x ≤ 1`, so the shaper's amount has **no effect at all**
 * on whether the bus clips — the ceiling is `MUSIC_GAIN × the summed peak` and nothing else. Drive is
 * therefore free loudness up to the crest it spends, which is why it moved and this came down.
 */
export const MUSIC_GAIN = 0.46;

/**
 * How hard the summed music bus is driven into `saturate`, before it reaches the destination.
 *
 * ── THE BUS IS MASTERED NOW, AND FOUR MIX PASSES WERE SPENT NOT DOING IT ────────────────────────
 *
 * ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** The same soft clip every cue already runs
 * through as `glue` — `src/app/sound.ts`'s `saturate`, exported for this — applied to the music as a
 * `WaveShaperNode`. It is one node, created once with the context, and it allocates nothing per frame.
 *
 * ⚠️ **0.15, AND IT WAS CHOSEN BY SWEEPING RATHER THAN BY EAR.** Driven over the whole ladder:
 *
 * | drive | `run` peak | `run` RMS | vs today | `boss` peak | crest lost |
 * |---|---|---|---|---|---|
 * | 0 | 0.539 | 0.132 | — | 0.819 | — |
 * | **0.15** | **0.807** | **0.248** | **+5.5 dB** | **0.957** | **2.0 dB** |
 * | 0.30 | 0.913 | 0.333 | +8.1 dB | 0.987 | 3.4 dB |
 * | 0.45 | 0.965 | 0.411 | +9.9 dB | 0.997 | 4.5 dB |
 *
 * **+5.5 dB is the size of the reported deficit and 0.30 is past it.** A bus at 0.913 peak on an
 * ordinary level rung is a bus with no dynamics left, and *loud* stops meaning anything when the
 * boss arrives — which is the thing the whole ladder exists to do.
 *
 * ⚠️ **AND IT DOES NOT EAT THE AURA, WHICH WAS THE RISK AND IS DISCHARGED BY MEASUREMENT.** A static
 * shaper on a summed bus compresses a quiet layer against a loud one, and the aura is a quiet layer
 * at the loudest rung — which is
 * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`'s own defect, *"I didn't even
 * notice it over the fire"*. Measured as the RMS of (bus with aura − bus without), at four
 * nearnesses: the aura gains **5.1–5.3 dB** where the bus gains 5.5, so its share is 66% before and
 * 67% after, and the spread across nearness is **8.1× against 8.3× dry**. 0092's curve survives
 * intact, and `tests/music.test.ts` holds it rather than this table.
 *
 * ── 0.15 → 0.22, RE-SWEPT ON A BUS THAT IS NOT THE ONE 0104 SWEPT ───────────────────────────────
 *
 * ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Five layers went on and the
 * summed peak went from 1.674 to 1.877, so 0104's table describes a mix that no longer exists. Driven
 * again over the new one, at `MUSIC_GAIN` 0.46:
 *
 * | drive | `run` peak | `run` RMS | `boss` RMS | boss over run |
 * |---|---|---|---|---|
 * | 0.15 | 0.851 | 0.285 | 0.365 | +2.1 dB |
 * | **0.22** | **0.900** | **0.328** | **0.414** | **+2.0 dB** |
 * | 0.30 | 0.939 | 0.376 | 0.458 | +1.7 dB |
 *
 * ⚠️ **THE COLUMN THAT DECIDED IT IS THE LAST ONE, NOT THE LOUDEST.** *"The boss music isn't
 * increasing proportionally"* is the report this whole decision is about, and a shaper on a summed
 * bus takes the arrival away first: 0.30 buys 1.2 dB of loudness and spends a fifth of the climb. At
 * 0.22 the level is **2.4 dB louder than the mix the ninth play-test called a great baseline** and
 * the fight is still a step up from it.
 *
 * ⚠️ **It costs nothing in headroom, which is the fact 0104 did not state.** `saturate(x, a) ≤ 1`
 * exactly when `x ≤ 1` for every positive `a` — the amount cannot make the bus clip, so the whole of
 * the clipping question lives in `MUSIC_GAIN` above and this is a free lever up to the crest it
 * spends. `tests/music.test.ts` holds the crest rather than this table.
 */
export const MUSIC_DRIVE = 0.22;

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
 * How far from the boss the level's two middle rungs open, in world units.
 *
 * ── THE SHAPE OF A LEVEL, AS TWO DISTANCES ──────────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0102-the-music-goes-somewhere.md`.** A level is about 6,350 units to its boss
 * and the camera covers 36 a second, so these divide a 176-second level into roughly a minute of
 * `run`, fifty seconds of `push`, fifty-five of `surge` and the twelve `BOSS_APPROACH_UNITS` already
 * bought. **Something changes about once a minute**, which is the pace a player notices without
 * being able to point at it.
 *
 * ⚠️ **Measured from the BOSS backwards, like `BOSS_APPROACH_UNITS`**, so a longer level spends
 * longer at `run` rather than compressing the build — and a level with no boss at all
 * (`Number.POSITIVE_INFINITY`, which is what a fixture uses) stays at `run` for ever, which is
 * correct rather than accidental.
 *
 * ⚠️ **Nothing asserts these values**, on `SHIP_SPEED`'s terms: they are a hand's guess at a pace
 * nobody has flown. What `tests/music.test.ts` holds is that they are ordered, that each is a real
 * stretch of seconds rather than a flicker, and that every rung is reachable.
 */
export const PUSH_UNITS = 4200;
export const SURGE_UNITS = 2400;

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

/*
  ── THE BEAT AND THE SNAP GRID LEFT THIS FILE ────────────────────────────────────────────────────

  ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** `STEPS_PER_BEAT`,
  `FIRE_GRID`, `onFireGrid` and `nextOnGrid` were here, and 0093 is emphatic that the first of them
  *"is not a music constant"* — it is where the beat is, which the gun, the enemies and the phase-lock
  all ride. That sentence was right and the file was the wrong one: they are all `src/content/grid.ts`'s
  now, per LEVEL rather than per game.

  ⚠️ **THE ARITHMETIC IS CARRIED ACROSS UNCHANGED**, rounding, floor and all. `tests/grid.test.ts`
  drives the `steady` row against the numbers this file used to produce, because a refactor that
  quietly retuned the gun would be indistinguishable from one that did not until a play-test.

  ⚠️ **WHAT STAYS HERE IS THE SCORE**: the layers, their bar counts, the ladder and the voices. The
  split is *where the beat is* against *what is played on it*, and it is what lets a level change one
  without changing the other.
*/

/**
 * The tempo the note lengths in this file are WRITTEN at, in seconds per beat.
 *
 * ⚠️ **NOT the tempo anything plays at.** `src/content/grid.ts` decides that per level, and
 * `renderNote` scales every voice marked `tempoRelative` by the ratio between the two. This exists so
 * the table goes on reading as music — `BEAT * 4.6` is *four and a bit beats*, which is what a
 * musician would write and what a reader can check against the pattern above it.
 *
 * ⚠️ **A LENGTH IN ABSOLUTE SECONDS IS NOT A MISTAKE HERE, AND THAT DISTINCTION PREDATES THIS
 * CHANGE.** A kick's 0.26 and a hat's 0.04 are properties of the drum rather than of the tempo, so
 * those voices carry no `tempoRelative` and do not move when the level does. It is what lets the kit
 * keep its character across a tempo change while the phrasing follows —
 * `docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.
 *
 * ⚠️ **Module-local and deliberately NOT exported.** Exporting it would put a second number meaning
 * *the tempo* back in the codebase, which is the whole defect 0113 is unwinding.
 */
const BEAT = 0.4;

/*
  ── EVERY DURATION BELOW IS A FUNCTION OF THE GRID, AND THEY WERE ALL CONSTANTS ──────────────────

  ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** `BEAT_SECONDS` was 0.4,
  `BAR_SECONDS` was 1.6 and `PHRASE_SECONDS` was 12.8, computed at module load — which is why there
  was one tempo in the game and why a level could not sound like a different piece.

  ⚠️ **THE GRID IS THE ARGUMENT AND NOT A SECOND TEMPO.** `src/content/grid.ts` states the beat in
  sim STEPS, and `docs/decisions/0022-frame-rate-is-a-feature.md` fixes the step at 60 Hz — so
  seconds are derived from the sim's own clock rather than written beside it. Two numbers meaning
  *the tempo* is exactly how the gun and the music drifted apart before 0093.

  ⚠️ **A note length written as a multiple of the beat therefore follows the tempo, and one written
  in absolute seconds deliberately does not** — a kick's 0.26 and a hat's 0.04 are properties of the
  drum. That distinction was already in this file and is what makes a per-level tempo survive it:
  the drums keep their character while the phrasing moves.
*/

/*
  ⚠️ **AND THE SECONDS THEMSELVES LIVE IN `src/app/music.ts`, WHICH IS 0015 RATHER THAN A PREFERENCE.**
  A duration in seconds needs the sim's rate, `STEPS_PER_SECOND` lives in `src/state/screens.ts`, and
  `docs/decisions/0015-the-layer-ladder.md` points the arrow the other way — `content` may not import
  `state`. What is here is BARS, which is a fact about the score; what is there is seconds, which is a
  fact about the clock it is played against.

  ⚠️ **The old file got away with a constant because there was only one tempo.** `BEAT_SECONDS = 0.4`
  was a hand-written 24/60 with a comment explaining it could not be derived here, which is the shape
  of a rule being worked around rather than followed.
*/

/**
 * The PHRASE: how long until every layer is back at its own position zero together.
 *
 * ⚠️ **The longest loop, and only because every other one divides it** — which is the rule
 * `LAYER_BARS` states and `tests/music.test.ts` holds. It is the interval a re-phase has to land on
 * (`src/app/music.ts`), because it is the only instant at which restarting the set is the thing the
 * set was about to do anyway. Landing a correction on a 2-bar boundary would cut the 4-bar pad in
 * half, which is 0090's seam arriving at runtime.
 *
 * ⚠️ **The BARS are still a constant and only the seconds moved**, which is the whole shape of this
 * change: a tempo does not alter how many bars a layer is, and every guard `LAYER_BARS` carries goes
 * on reading the same numbers.
 */
export const PHRASE_BARS = Math.max(...Object.values(LAYER_BARS));

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
   * **how hard the note is struck**, where 1 is full.
   *
   * ⚠️ **A rest is `null`, not a zero.** Zero is the root, which is the most common note there is.
   *
   * ── IT USED TO BE A FLAG, AND THAT IS WHY THE TITLE SOUNDED LIKE A METRONOME ────────────────────
   *
   * ⚠️ **`docs/decisions/0102-the-music-goes-somewhere.md`.** Reported from play: *"the metronome
   * doesn't fit the other beat. It doesn't blend nicely, it sounds like two separate tracks being
   * played at the same time."*
   *
   * ⚠️ **There was no accent anywhere in this model.** An unpitched step said *play* or *rest*, so
   * every kick, click, snare and hat in the game was bit-identical to every other — and identical
   * repetition at a fixed interval is not *like* a metronome, it is the definition of one. No
   * arrangement of gains or filters could have fixed it, which is why three passes over the mix
   * never touched the complaint.
   *
   * ⚠️ **The comment two sections down claimed the hats alternated loud and quiet** — *"which is what
   * makes them a shuffle rather than a machine"* — and the pattern was thirty-two ones. The prose
   * described something the data structure could not express, which is a shape worth recognising:
   * every value in every drum table was 1, so nothing ever disagreed with it.
   */
  steps: readonly (number | null)[];
  /** Whether `steps` are semitones (pitched) or plays and rests (drums). */
  pitched: boolean;
  /**
   * How hard a PITCHED note is struck, by its position in the pattern. Absent means every note is
   * full. Wraps, so four entries is one beat at `perBeat: 4`.
   *
   * ── 0102 GAVE THE DRUMS VELOCITIES AND LEFT EVERY PITCHED VOICE AT ONE WEIGHT ──────────────────
   *
   * ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** 0102's finding was that
   * *"identical repetition at a fixed interval is not LIKE a metronome, it is the definition of one"*,
   * and its fix was to read an unpitched `steps` entry as a velocity. **A pitched entry is a
   * semitone, so that field was already spoken for** — and the arp's hundred and twenty-eight square
   * notes, the groove's bass line and the chords' rolling sub have been struck at exactly one weight
   * since they were written.
   *
   * ⚠️ **Reported for the third round running as *"every mix sounds the same"***, and half of the
   * piece is pitched. A theme's multiplier cannot fix it: scaling a uniform part is a quieter uniform
   * part.
   *
   * ⚠️ **BY POSITION IN THE PATTERN AND NOT BY A COUNTER OVER STRUCK NOTES.** The same choice
   * `src/content/cues.ts`'s `figure` makes and for the same reason: a counter that advances per note
   * drifts against the bar the moment a rest moves, so an accent would belong to the note rather than
   * to the beat it lands on. This indexes the grid.
   */
  accents?: readonly number[];
  /**
   * Whether this voice's note LENGTH follows the tempo.
   *
   * ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** `note.seconds` is
   * written against `BEAT`; a voice marked here is scaled by the level's own beat, and one that is
   * not keeps the absolute value. A pad held *four and a bit beats* means that at every tempo; a
   * kick's 0.26-second fall is the drum and means 0.26 everywhere.
   *
   * ⚠️ **Absent is false and costs nothing** — the same shape `accents` uses, and for the same
   * reason: a voice that wants the old behaviour says nothing and no object is rebuilt.
   *
   * ⚠️ **`tests/music.test.ts` refuses a voice whose note is written as a multiple of `BEAT` and is
   * NOT marked**, because that is a note that silently stops being a note value the day a level
   * changes tempo — audible as a pad that no longer reaches the next chord.
   */
  tempoRelative?: boolean;
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
/*
  ── FIVE RUNGS INSIDE A LEVEL, AND THERE WAS ONE ─────────────────────────────────────────────────

  ⚠️ **`docs/decisions/0102-the-music-goes-somewhere.md`.** Reported twice: *"the ingame background
  music doesn't change and increase in tempo as you progress through the level"*, then *"still flat
  and lifeless, has no depth, no pace, no increased tempo."*

  ⚠️ **`run` covered about 160 seconds of a 176-second level.** `musicLevelFor` returned it from the
  moment a level began until 430 units before the boss, so nine tenths of every level was one
  arrangement of three layers over a four-bar loop. There was nothing to *"progress"* through.

  ⚠️ **`push` and `surge` are the two new ones and they are DISTANCES**, like `BOSS_APPROACH_UNITS`
  and like everything else this project paces — so they mean the same thing on a device that drops
  frames and they carry to a level that is retuned.
*/
export const MUSIC_LEVELS = ['calm', 'run', 'push', 'surge', 'approach', 'boss'] as const;

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
/*
  ── WHAT EACH RUNG ADDS, AND WHY THE PIECE NOW HAS A SHAPE ───────────────────────────────────────

  | rung | opens | what the player hears |
  |---|---|---|
  | `run` | engine, chords | the level starts: drums and harmony |
  | `push` | **groove** | **a bass line**, which the level's piece did not have at all |
  | `surge` | **arp** | sixteenths — the pulse doubles, which is what *faster* means here |
  | `approach` | drive | the boss is coming |
  | `boss` | lead, aura | the tune arrives |

  ⚠️ **THE LEVEL'S PIECE HAD NO BASS LINE, AND THAT IS MOST OF *"FLAT AND LIFELESS"*.** `bass` is
  `TITLE_ONLY` (0095, and correctly — an A-rooted riff is a wrong note over three chords in four), so
  from the moment a level began the only thing under the kick was `chords`' rolling sub. `groove`
  moves with the progression, which is what the title's riff could not do.

  ⚠️ **THE TEMPO DOES NOT CHANGE AND CANNOT, AND *"INCREASED TEMPO"* IS ANSWERED BY SUBDIVISION.**
  `docs/decisions/0093-the-gun-is-on-the-grid.md` fixes a beat at 24 sim steps; the player's gun,
  every enemy's cadence and 0094's phase-lock all ride that number, so a BPM ramp would take the
  whole game off the grid three decisions exist to put it on. What rises is the rate of events —
  quarters, then eighths, then sixteenths — which is exactly the mechanism
  `docs/decisions/0091-the-boss-has-an-aura.md` already calls *"builds in tempo"*, and it is written
  down here so nobody goes looking for a BPM that was never there.
*/
/*
  ── AND `run` OPENED THINNER THAN THE TITLE DID, WHICH IS THE ASK STATED AS A FLOOR ──────────────

  ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** Reported from play: *"the title and boss
  screen music needs to be the minimum base level we build upon for the music"*, and *"the current
  level music is way too calm and repetitive."*

  ⚠️ **THE LEVEL'S PIECE HAD NO BASS LINE FOR THE FIRST THIRD OF EVERY LEVEL.** 0102 built `groove`
  precisely because *"a piece with no bass line is what no depth is a description of"* — and then
  opened it at `push`, which is 4,200 units from the boss. About a minute of every level still had
  nothing under the kick but `chords`' own rolling sub, which is the state 0102 was answering.

  ⚠️ **`groove` and `arp` now open at `run`**, so a level begins with a bass line and something on
  every sixteenth. The title's three layers are the floor and the level starts above it, which is what
  *"the minimum base level we build upon"* says.

  ⚠️ **THE LADDER IS STILL ADDITIVE AND STILL CLIMBS FOUR TIMES**, which is the thing 0102 bought and
  this must not spend: what `push` and `surge` buy is now WEIGHT rather than arrival — the groove and
  the arp come up as the level goes on — and `drive` and `lead` still arrive as events. A rung that
  opened nothing new would be 0102's *"the ingame background music doesn't change"* returning, and
  `tests/music.test.ts` holds every rung louder than the one below it.
*/
/*
  ── AND THE AURA HAS A CEILING AT EVERY RUNG NOW, BECAUSE THE LEVEL RAISES IT ────────────────────

  ⚠️ **`docs/decisions/0107-a-level-is-a-place.md`.** Asked for: *"the aura music for the boss needs
  to start about 15-30secs into the start of a level and then amp up until you beat the boss."* The
  aura's rows were zero at every rung except `boss`, so there was nothing for a level-long build to
  raise — the ceiling it multiplies was itself nothing until the fight began.

  ⚠️ **THE CEILINGS RISE ACROSS THE RUNGS AND THE BUILD RIDES THEM.** `src/app/music.ts` multiplies
  these by `auraFor(build, nearness)`, so what a rung states is *how loud the dread may get here* and
  the build states *how far through we are*. A level therefore gains a slow swell that is a function
  of two things at once, and the fight is still the only place either reaches 1.

  ⚠️ **`calm` stays at zero and always will.** The title, the level break and the run-over screen are
  not in a level — there is nothing to be building towards — and 0095 is the decision that says the
  two pieces do not share a ladder.
*/
/*
  ── AND THE FLOOR MOVED UP A LEVEL, WHICH IS THE ASK STATED AS A LADDER ─────────────────────────

  ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Reported from play: *"the pace
  of the music sounded good around level 4, that should be our starting point for the music."*

  ⚠️ **THE ONLY THING THAT DIFFERS BETWEEN LEVEL ONE AND LEVEL FOUR IS `rime`'s MIX** — 0107 — and
  `tests/themes.test.ts` requires `approach`, level one's theme, to be **exactly neutral**, so that
  the other six are read against something. So *start at level four* cannot be written in the theme
  table at all: it is a statement about what a multiplier of 1 should sound like, and that is this
  table. `rime`'s character — drone down, engine up, arp and hook up — is folded in here, and the
  themes are re-centred around the new middle.

  ⚠️ **WHAT ARRIVES AT EACH RUNG IS THE PART THAT MAY NOT BE SPENT.** The obvious way to raise the
  floor is to open `arp` at `run`, and it takes a rung's arrival away — 0102 bought four climbs and
  this must not sell one back. What opens the level instead is **`sub` and `perc`**, which are new
  material, and `arp` still arrives at `push`.

  | rung | opens | what the player hears |
  |---|---|---|
  | `run` | **sub, perc**, engine, chords, groove | the floor is felt and there is a hand on it |
  | `push` | arp | sixteenths — the pulse doubles |
  | `surge` | hook | the riff |
  | `approach` | **toll** | a bell, twice a phrase: something is coming |
  | `boss` | lead, **stomp**, aura | the tune, and the drums go double time |

  ── AND THE BOSS IS TWO NEW LAYERS BECAUSE ONE WAS NOT AN ARRIVAL ───────────────────────────────

  ⚠️ **Reported from play**: *"the level music is getting passable, but the boss music isn't
  increasing proportionally."* `boss` opened `lead` and raised eight gains by about five percent —
  the smallest step in a ladder whose entire purpose is to arrive at it, and 0107's four new level
  rungs are what made that visible. **A boss that adds one layer to a level that has just added four
  is quieter, relatively, than it was before the level got better.**

  ⚠️ **`toll` is placed at `approach` and not at `boss` on purpose.** The thing that makes an arrival
  an arrival is that something changed BEFORE it; a bell over the last twelve seconds of the level is
  what makes the boss's own rung a release rather than a step.
*/
export const MUSIC_LADDER: Record<MusicLevel, Record<MusicLayer, number>> = {
  calm: { drone: 0.55, bass: 0.7, beat: 0.5, sub: 0, engine: 0, perc: 0, chords: 0, groove: 0, arp: 0, hook: 0, drive: 0, toll: 0, lead: 0, stomp: 0, auraSlow: 0, auraFast: 0 },
  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0.8, arp: 0, hook: 0, drive: 0, toll: 0, lead: 0, stomp: 0, auraSlow: 0.5, auraFast: 0.28 },
  push: { drone: 0.34, bass: 0, beat: 0, sub: 0.88, engine: 0.92, perc: 0.74, chords: 0.87, groove: 0.86, arp: 0.62, hook: 0, drive: 0, toll: 0, lead: 0, stomp: 0, auraSlow: 0.62, auraFast: 0.4 },
  surge: { drone: 0.33, bass: 0, beat: 0, sub: 0.9, engine: 0.93, perc: 0.8, chords: 0.88, groove: 0.9, arp: 0.68, hook: 0.66, drive: 0, toll: 0, lead: 0, stomp: 0, auraSlow: 0.75, auraFast: 0.55 },
  approach: { drone: 0.34, bass: 0, beat: 0, sub: 0.92, engine: 0.94, perc: 0.84, chords: 0.89, groove: 0.92, arp: 0.72, hook: 0.7, drive: 0.72, toll: 0.72, lead: 0, stomp: 0, auraSlow: 0.88, auraFast: 0.72 },
  boss: { drone: 0.24, bass: 0, beat: 0, sub: 0.98, engine: 0.98, perc: 0.95, chords: 0.88, groove: 0.96, arp: 0.78, hook: 0.86, drive: 0.94, toll: 0.86, lead: 0.98, stomp: 0.96, auraSlow: 1, auraFast: 0.9 },
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
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.6, gain: 0.16, attack: 0.35, curve: 0.9, lowFrom: 520, lowTo: 300, q: 0.9 },
    },
    {
      // The same note four cents sharp. Two saws slightly apart is the oldest pad there is, and it
      // is the difference between a chord and an organ.
      steps: [0, -2],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.6, gain: 0.16, attack: 0.35, curve: 0.9, lowFrom: 516, lowTo: 298, q: 0.9 },
    },
    {
      steps: [7, 5],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.6, gain: 0.1, attack: 0.4, curve: 0.9, lowFrom: 560, lowTo: 320, q: 0.9 },
    },
    {
      steps: [0, -2],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      tempoRelative: true,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT * 4.6, gain: 0.2, attack: 0.3, curve: 0.9 },
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
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 0.42, gain: 0.34, attack: 0.004, curve: 4.5, lowFrom: 1400, lowTo: 380, q: 1.4, drive: 0.4 },
    },
    {
      // The octave under it, which is what makes it felt rather than only heard — the same trick
      // every explosion in `src/content/cues.ts` uses, for the same reason.
      steps: [0, 0, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, 0, 3, 5, 7],
      pitched: true,
      octave: 0,
      perBeat: 2,
      tempoRelative: true,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT * 0.5, gain: 0.3, attack: 0.004, curve: 4 },
    },
  ],

  /*
    THE BEAT — kick, snare and hats. *"An increased beat"* arriving, and the layer that turns a
    background into a thing with a pulse.
  */
  /*
    ⚠️ **EVERY PATTERN IN THIS LAYER WAS A ROW OF ONES, WHICH IS WHY IT WAS THE METRONOME** — 0102.
    Four-on-the-floor with a click on every kick, a beep on two and four, and thirty-two identical
    hats. Nothing in it was louder or quieter than anything else, so it could only ever read as a
    click track laid over the bass rather than as a groove played with it.

    ⚠️ **It is a syncopated pattern on eighths now, and the numbers are velocities.** The kick leaves
    beats two and four to the snare and lands on the *and* instead, which is what makes a bass line
    and a drum part one thing; the hats breathe on a four-step cycle; and the 220 Hz beep is gone.
  */
  beat: [
    {
      /*
        THE KICK, on eighths: **one** — and — *and* — three — and — *and*. Beat one is full, the two
        syncopated pushes are softer, and beats two and four are deliberately empty because that is
        where the snare goes. A kick on all four with a click on top is a metronome by construction.
      */
      steps: [1, _, _, 0.72, _, _, 0.85, _, 1, _, _, 0.72, _, _, 0.9, _],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 150, to: 45, seconds: 0.26, gain: 0.75, attack: 0.001, curve: 4.5, drive: 0.2 },
    },
    {
      // The click, following the kick exactly and at two thirds its weight on the pushes — a click
      // that did NOT follow the kick is what made the old layer sound like two parts.
      steps: [1, _, _, 0.6, _, _, 0.7, _, 1, _, _, 0.6, _, _, 0.75, _],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.02, gain: 0.16, attack: 0.0005, curve: 8, lowFrom: 6000, highFrom: 800 },
    },
    {
      /*
        The backbeat, on two and four, and the only thing in the layer with midrange in it. It now
        carries a GHOST — a quarter-weight stroke before the last one — which is the single cheapest
        thing that makes a drum part sound played rather than programmed.
      */
      steps: [_, _, 1, _, _, _, 1, _, _, _, 1, _, _, 0.28, 1, _],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.16, gain: 0.3, attack: 0.001, curve: 6, lowFrom: 4200, lowTo: 1600, highFrom: 400 },
    },
    {
      /*
        ⚠️ **THE 220 Hz BEEP IS GONE, AND IT WAS THE METRONOME THE REPORT NAMED.** A short pitched
        `tri` on two and four, at the same weight every bar, over a piece whose bass never moves is
        exactly a tick — and it was doubling a snare that already had the backbeat covered. What
        replaces it is nothing: the layer is quieter and there is one less thing keeping time.
      */
      // Sixteenth hats. The accents are the four-step cycle every drum machine's shuffle is: strong,
      // weak, medium, weak — which is what the comment here USED to claim and the data never said.
      steps: Array.from({ length: 32 }, (_unused, i) => [1, 0.42, 0.66, 0.38][i % 4]!),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.04, gain: 0.07, attack: 0.0005, curve: 9, lowFrom: 13000, highFrom: 6000 },
    },
  ],

  /*
    ── THE SUB — THE ONE THING A LISTENER FEELS RATHER THAN HEARS ─────────────────────────────────

    `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`. Reported from play: *"how deep can
    we push the bass? I want to feel the bass beats in my chest."*

    ⚠️ **EVERY SUB IN THIS FILE WAS A TAIL AND NONE OF THEM WAS A NOTE.** The kick falls to 38 Hz over
    0.42s, the chords' sine sub is 0.62 of a beat, the groove's is 0.34 — so the whole of the game's
    low end was transients decaying, and between them the band was empty. **Chest is not a frequency,
    it is a frequency that is still there a moment later**: what a body feels is sustained pressure,
    and nothing in the piece sustained anything under 80 Hz.

    ⚠️ **IT IS AT `octave: 0` AND CANNOT USEFULLY GO BELOW IT.** `MUSIC_ROOT` is 55 Hz, so this layer
    runs 41 Hz (E) to 65 Hz (C) across the progression — the band a chest actually resolves. An octave
    down is 20–33 Hz, which a desktop speaker does not reproduce and a phone does not know about; it
    would be headroom spent on silence, and `tests/music.test.ts`'s A-weighted `sub` band would read
    it as nothing because that is what the ear does with it.

    ⚠️ **IT DOES NOT REPEAT `chords`' ROLLING SUB, WHICH IS THE MISTAKE THIS LAYER IS ONE EDIT AWAY
    FROM.** That one is offbeat eighths on the chord root; two layers playing the same eighths an
    octave apart is one thicker layer and half the buffer wasted. What is here is the two things the
    piece did not have: a **held** fundamental under the whole bar, and a **drop** — a swept
    sub-transient on the bar line, which is the part a body reads as an impact.
  */
  sub: [
    {
      /*
        THE FLOOR. One note a bar, longer than the bar so it never lets go — and the last one crosses
        the end of the loop, which is what 0090's seam guard is watching.
      */
      steps: [0, -4, 3, -2, 0, -4, -2, -5],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      tempoRelative: true,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT * 4.15, gain: 0.42, attack: 0.07, curve: 1.05 },
    },
    {
      /*
        THE DROP, on the bar line. Unpitched, because it SWEEPS — 75 Hz down to 34 — and a pitched
        voice replaces `from` and `to` with one note. It is a second kick an octave under the first,
        and it is the single loudest thing below 60 Hz in the game.

        ⚠️ **On the bar and not on the beat.** Four of these a bar would be a continuous rumble, which
        is the thing `MAX_CUE_SECONDS` refuses for a cue and the same mistake here; one is an event.
      */
      steps: [1, _, _, _, 1, _, _, _, 1, _, _, _, 0.85, _, _, _, 1, _, _, _, 1, _, _, _, 1, _, _, _, 0.9, _, 0.8, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 75, to: 34, seconds: 0.52, gain: 0.46, attack: 0.002, curve: 2.4, drive: 0.15 },
    },
    {
      /*
        THE PULSE — the chord's own root on beats two, three and four, so the low end MOVES between
        drops instead of sitting. Beat one is deliberately empty: the drop is there, and stacking a
        note on it would spend the mix's whole headroom on one sixtieth of a second.
      */
      steps: [
        _, 0, 0, 0, _, -4, -4, -4, _, 3, 3, 3, _, -2, -2, -2,
        _, 0, 0, 0, _, -4, -4, -4, _, -2, -2, -2, _, -5, -5, -7,
      ],
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.9, 0.8, 0.95],
      tempoRelative: true,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT * 0.9, gain: 0.34, attack: 0.006, curve: 2.6 },
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
  /*
    ── AND IT WAS THE METRONOME, WHICH 0102 FIXED IN THE LAYER NEXT TO THIS ONE ────────────────────

    ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Reported from play for the
    third round running: *"the metronome beats are still louder and because they're two beats back and
    forth, every mix sounds the same."*

    ⚠️ **0102 FOUND EXACTLY THIS AND FIXED IT IN `beat`, WHICH IS `TITLE_ONLY`.** *"Identical
    repetition at a fixed interval is not LIKE a metronome, it is the definition of one"* was written
    about the title's drums; every pattern in THIS layer was a row of literal `1`s at the same time,
    and this is the layer that plays under every second of every level. The guard 0102 left behind
    reads `MUSIC.beat` by name, so it went on being green about the wrong drums.

    ⚠️ **Kick, clap, kick, clap is *two beats back and forth* precisely**, and no gain, filter or
    theme multiplier could have made two identical bars into a phrase. What is here is velocities on
    every voice and **four bars instead of two**, with a hole in the fourth bar's third beat: a loop
    the ear can find the top of.
  */
  engine: [
    {
      /*
        Four on the floor. A longer, deeper fall than the title beat's kick — this one is the floor
        rather than a pulse on top of it.

        ⚠️ **Beat one of every bar is full and nothing else is**, which is what makes a bar a bar; and
        the fourth bar's third beat is EMPTY, which is what makes four bars a phrase. The kick is
        still on the beat everywhere it sounds, so 0093's *every third volley lands on a kick* is
        intact — the gun's triplet against it is unchanged.
      */
      steps: [1, 0.86, 0.94, 0.84, 1, 0.82, 0.96, 0.86, 1, 0.86, 0.94, 0.88, 1, 0.8, _, 0.72],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 160, to: 38, seconds: 0.42, gain: 0.6, attack: 0.001, curve: 2.8, drive: 0.3 },
    },
    {
      // The click on top of it, so the kick reads on a phone speaker with no low end at all — and it
      // follows the kick exactly, including the hole. A click that did not is two parts.
      steps: [1, 0.7, 0.8, 0.68, 1, 0.66, 0.82, 0.7, 1, 0.7, 0.8, 0.72, 1, 0.64, _, 0.6],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.015, gain: 0.15, attack: 0.0004, curve: 9, lowFrom: 7000, highFrom: 900 },
    },
    {
      // A clap on two and four. Two noise bursts a few milliseconds apart is what a clap IS, and one
      // of them is this voice — the other is below. The last bar's second clap is the loudest in the
      // phrase, because it is the one landing over the kick's hole.
      steps: [_, 1, _, 0.9, _, 0.94, _, 1, _, 1, _, 0.88, _, 0.92, _, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.13, gain: 0.27, attack: 0.001, curve: 5.5, lowFrom: 5200, lowTo: 1800, highFrom: 700 },
    },
    {
      /*
        Sixteenth hats, quiet and closed. Each is under two hundredths of a second — the thing that
        makes a bar feel subdivided rather than empty.

        ⚠️ **Strong, weak, medium, weak, and the last beat of the phrase opens up.** The comment this
        layer's neighbour carries about a shuffle was false of its own data for two decisions; it is
        true here, and `tests/music.test.ts` measures the bake rather than the table.
      */
      steps: Array.from({ length: 64 }, (_unused, i) => (i >= 60 ? [1, 0.75, 0.9, 0.8][i % 4]! : [1, 0.4, 0.62, 0.38][i % 4]!)),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.018, gain: 0.075, attack: 0.0004, curve: 9, lowFrom: 14000, highFrom: 7500 },
    },
    {
      // The open hat on every offbeat, which is the single most recognisable thing in the genre —
      // it is what makes four-on-the-floor read as *dance* rather than as *march*. Breathing on a
      // four-bar cycle, so it is a player rather than a gate.
      steps: Array.from({ length: 32 }, (_unused, i) => (i % 2 === 0 ? _ : [1, 0.72, 0.88, 0.66][((i - 1) / 2) % 4]!)),
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.11, gain: 0.105, attack: 0.001, curve: 3.2, lowFrom: 11000, highFrom: 5200 },
    },
  ],

  /*
    ── THE PERCUSSION — THE COUNTERPOINT, AND THE PIECE HAD NONE ──────────────────────────────────

    `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`. Asked for in play: *"Can we get some
    percussion up in here to counterpoint it as well?"*

    ⚠️ **THE PIECE HAD DRUMS AND NO PERCUSSION, AND THE DIFFERENCE IS WHAT THE WORD *COUNTERPOINT*
    MEANS.** `beat`, `engine` and `drive` all divide the bar the same way — quarters, eighths,
    sixteenths — so however many of them play at once, the grid underneath is one grid. Percussion is
    the parts that divide it a DIFFERENT way, and this layer's whole job is to be at odds with the
    four-on-the-floor it plays over.

    ⚠️ **Two of the three voices are deliberately not on the sixteenth grid.** The shaker is
    `perBeat: 3` — eighth-note triplets, three against the hats' four — and the wood is a 3-3-2
    tresillo across sixteenths, which lands on the beat once a bar and is elsewhere the rest of the
    time. That is what makes the bar feel turned rather than counted.

    ⚠️ **NONE OF THIS TOUCHES THE SIM'S GRID.** `docs/decisions/0093-the-gun-is-on-the-grid.md` and
    `docs/decisions/0096-the-enemies-play-along.md` fix a beat at 24 sim steps and snap every CADENCE
    to a sixteenth of it; a triplet inside the music is a subdivision of that same beat and nothing in
    the game fires on it. The grid the gun rides is untouched.
  */
  perc: [
    {
      /*
        THE WOOD — 3-3-2 across sixteenths, which is the oldest counter-rhythm there is. It states the
        downbeat and then arrives everywhere the kick is not; the fourth bar fills in.
      */
      steps: [
        0.9, _, _, 0.55, _, _, 0.72, _, _, _, 0.5, _, 0.8, _, _, _,
        0.9, _, _, 0.55, _, _, 0.72, _, _, _, 0.5, _, 0.8, _, _, 0.45,
        0.9, _, _, 0.55, _, _, 0.72, _, _, _, 0.5, _, 0.8, _, _, _,
        0.9, _, _, 0.6, _, _, 0.75, _, _, 0.5, 0.6, _, 0.85, _, 0.7, 0.95,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'tri', from: 940, to: 610, seconds: 0.05, gain: 0.28, attack: 0.0008, curve: 8, highFrom: 420 },
    },
    {
      /*
        THE SHAKER, ON TRIPLETS. Three to a beat against four hats — the one voice in the piece that
        cannot be counted in the same breath as the rest of it.

        ⚠️ **Forty-eight entries and not sixty-four, and `tests/music.test.ts` is what says so**: a
        pattern spans exactly its own layer, so `perBeat: 3` over four bars is `3 × 4 × 4`.
      */
      steps: Array.from({ length: 48 }, (_unused, i) => [0.95, 0.34, 0.5][i % 3]!),
      pitched: false,
      perBeat: 3,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.024, gain: 0.06, attack: 0.0006, curve: 8, lowFrom: 12500, highFrom: 5200 },
    },
    {
      /*
        THE TOMS — the answer to the backbeat, and the fill that ends the phrase. This is the voice
        that says a bar has finished, which a two-bar loop of identical drums cannot.
      */
      steps: [
        _, _, _, _, _, 0.8, _, _,
        _, _, _, 0.65, _, _, _, 0.85,
        _, _, _, _, _, 0.8, _, _,
        _, _, _, 0.7, _, 0.9, 0.75, 1,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 152, to: 84, seconds: 0.19, gain: 0.34, attack: 0.001, curve: 4.5, drive: 0.2 },
    },
    {
      // A tambourine on the offbeat quarters — the top end of the counterpoint, so the wood and the
      // shaker are not both in the same octave of the spectrum.
      steps: [_, 1, _, 0.62, _, 1, _, 0.7, _, 1, _, 0.62, _, 1, 0.55, 0.9],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.075, attack: 0.0008, curve: 4, lowFrom: 9500, highFrom: 3800 },
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
      steps: [0, -4, 3, -2, 0, -4, -2, -5],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.6, gain: 0.17, attack: 0.06, curve: 1.5, lowFrom: 900, lowTo: 2400, q: 1.2 },
    },
    {
      steps: [0, -4, 3, -2, 0, -4, -2, -5],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.6, gain: 0.17, attack: 0.07, curve: 1.5, lowFrom: 890, lowTo: 2380, q: 1.2 },
    },
    {
      // The fifths.
      steps: [7, 3, 10, 5, 7, 3, 5, 2],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.5, gain: 0.13, attack: 0.09, curve: 1.5, lowFrom: 1100, lowTo: 2800, q: 1.1 },
    },
    {
      // The top voice, an octave up — where the chord stops being a bed and starts being a chord.
      steps: [15, 12, 19, 14, 15, 12, 14, 11],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.4, gain: 0.1, attack: 0.12, curve: 1.6, lowFrom: 1600, lowTo: 3600, q: 1 },
    },
    {
      // THE ROLLING SUB. Offbeat eighths under the kick, moving with the chord — the other half of
      // what makes four-on-the-floor move rather than plod, and the reason the kick has room.
      steps: [
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, 3, _, 3, _, 3, _, 3,
        _, -2, _, -2, _, -2, _, -2,
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, -2, _, -2, _, -2, _, -2,
        _, -5, _, -5, _, -5, _, -5,
      ],
      pitched: true,
      perBeat: 2,
      octave: 0,
      accents: [1, 1, 0.88, 0.94],
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 0.44, gain: 0.33, attack: 0.005, curve: 4.5, lowFrom: 1300, lowTo: 320, q: 1.5, drive: 0.35 },
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
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, -2, _, -2, _, -2, _, -2,
        _, -5, _, -5, _, -5, _, -5,
      ],
      pitched: true,
      perBeat: 2,
      octave: 0,
      accents: [1, 1, 0.88, 0.94],
      tempoRelative: true,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT * 0.62, gain: 0.46, attack: 0.004, curve: 3.2 },
    },
  ],

  /*
    ── THE GROOVE — A BASS LINE, WHICH THE LEVEL'S PIECE DID NOT HAVE AT ALL ───────────────────────

    `docs/decisions/0102-the-music-goes-somewhere.md`. Reported twice: *"flat and lifeless, has no
    depth, no pace"*.

    ⚠️ **`bass` is `TITLE_ONLY`, and 0095 was right to close it** — an A-rooted riff is a wrong note
    over three chords in four. What 0095 did not do is replace it, so from the moment a level began
    the only thing under the kick was `chords`' own rolling sub. **A piece with no bass line is what
    *no depth* is a description of.**

    ⚠️ **FOUR BARS AGAINST THE CHORDS' EIGHT**, which is the whole point of 0095's whole-multiple
    rule: the bass says the same two bars over the progression's first half and again over its
    second, so the harmony turns underneath a line that does not. That is how a groove works and it
    costs half the buffer of writing it out twice.

    ⚠️ **Syncopated against the kick rather than with it.** `engine`'s kick is four-on-the-floor;
    this plays the offbeats and the pushes, so the two interlock instead of doubling. A bass on the
    beat under a kick on the beat is one thicker kick.

    ⚠️ **It opens at `push` and the ladder never closes it**, so from a third of the way into a level
    the low end is a moving part rather than a pad.
  */
  groove: [
    {
      /*
        Sixteenths, mostly rests: the root, the octave push, the fifth, and a walk into the next bar.
        Written against A minor and F, which is the progression's first half — and the second half
        (A minor and G) shares its first chord, so the same line lands either way.
      */
      steps: [
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 10, _,
        -4, _, _, -4, _, 8, _, _, -4, _, _, 3, _, _, 5, _,
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 10, _,
        -4, _, _, -4, _, 8, _, _, -4, _, 3, _, 5, _, 7, _,
      ],
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.7, 0.84, 0.72],
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 0.3, gain: 0.3, attack: 0.004, curve: 5, lowFrom: 1500, lowTo: 340, q: 1.5, drive: 0.45 },
    },
    {
      /*
        The octave under it as a sine, which is what makes a bass FELT rather than only heard — the
        same trick the title's bass, the chords' sub and every explosion in `src/content/cues.ts`
        use, and the reason 0095's spectral guard exists.
      */
      steps: [
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 10, _,
        -4, _, _, -4, _, 8, _, _, -4, _, _, 3, _, _, 5, _,
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 10, _,
        -4, _, _, -4, _, 8, _, _, -4, _, 3, _, 5, _, 7, _,
      ],
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.84, 0.72],
      tempoRelative: true,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT * 0.34, gain: 0.4, attack: 0.004, curve: 4 },
    },
  ],

  /*
    ── THE ARP — WHAT *"INCREASED TEMPO"* MEANS WHEN THE TEMPO CANNOT MOVE ────────────────────────

    `docs/decisions/0102-the-music-goes-somewhere.md`. Reported: *"no increased tempo"*.

    ⚠️ **THE TEMPO IS 24 SIM STEPS TO A BEAT AND IT IS LOAD-BEARING.**
    `docs/decisions/0093-the-gun-is-on-the-grid.md` puts the player's gun on that grid,
    `docs/decisions/0096-the-enemies-play-along.md` puts every enemy on it, and
    `docs/decisions/0094-in-time-is-not-in-phase.md` locks the loops to the sim clock. A BPM ramp
    takes the whole game off the grid three decisions exist to put it on.

    ⚠️ **So the rate of EVENTS rises instead, which is the same mechanism 0091 already calls *builds
    in tempo*.** The aura doubles its pulse and then doubles it again without a tempo existing
    anywhere as a number; this does it for the level. `engine` is quarters and eighths, `groove` is
    a sixteenth line with holes in it, and this fills them — so `surge` is the first moment in a
    level with something on every sixteenth.

    ⚠️ **EIGHT BARS, and it is the only rhythmic layer that is not two or four.** An arpeggio is the
    most repetitive thing in the piece — the same shape over and over is what an arpeggio IS — so it
    is the one layer where the loop length is doing the most work per second of buffer.
  */
  arp: [
    {
      /*
        A minor pentatonic figure over the progression, turning on the fifth bar. Two octaves up and
        quiet: this is texture and motion rather than a part anybody follows.
      */
      steps: [
        0, 7, 12, 7, 3, 7, 12, 15, 0, 7, 12, 7, 3, 7, 12, 15,
        -4, 3, 8, 3, 0, 3, 8, 12, -4, 3, 8, 3, 0, 3, 8, 12,
        3, 10, 15, 10, 7, 10, 15, 19, 3, 10, 15, 10, 7, 10, 15, 19,
        -2, 5, 10, 5, 2, 5, 10, 14, -2, 5, 10, 5, 2, 5, 10, 14,
        0, 7, 12, 7, 3, 7, 12, 15, 0, 7, 12, 7, 3, 7, 12, 15,
        -4, 3, 8, 3, 0, 3, 8, 12, -4, 3, 8, 3, 0, 3, 8, 12,
        -2, 5, 10, 5, 2, 5, 10, 14, -2, 5, 10, 5, 2, 5, 10, 14,
        -5, 2, 7, 2, -1, 2, 7, 11, -5, 2, 7, 2, -1, 2, 7, 11,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.55, 0.72, 0.5],
      tempoRelative: true,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT * 0.2, gain: 0.075, attack: 0.002, curve: 6, lowFrom: 3600, lowTo: 1400, q: 1.8 },
    },
    {
      /*
        A closed hat on every sixteenth under it, accented on the beat. The arp says WHICH notes and
        this says *there is something on every sixteenth now*, which is the half a listener reads as
        speed. Velocities, which is the thing 0102 gave the model.
      */
      steps: Array.from({ length: 128 }, (_unused, i) => [1, 0.35, 0.55, 0.35][i % 4]!),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.014, gain: 0.055, attack: 0.0004, curve: 9, lowFrom: 15000, highFrom: 8000 },
    },
  ],

  /*
    ── THE HOOK — THE RIFF, AND THE LEVEL'S PIECE HAD NOTHING A LISTENER COULD FOLLOW ──────────────

    `docs/decisions/0104-the-gun-plays-a-figure.md`. Reported: *"the current level music is way too
    calm and repetitive."*

    ⚠️ **IT EXISTS BECAUSE THE LADDER RAN OUT OF THINGS TO OPEN, WHICH IS A GUARD'S FINDING.** The ask
    — *"the title and boss screen music needs to be the minimum base level"* — meant `groove` and `arp`
    moving down to `run`, and `tests/music.test.ts` immediately said `push` and `surge` then opened
    nothing new. **The honest answer to a ladder with too few rungs is more music, not a shorter
    ladder**, and *more music* is what the report asks for in the same breath.

    ⚠️ **A STAB, which is the one register the piece had empty.** `groove` is the bass, `arp` is
    texture two octaves up, `lead` is a melody that only a boss hears — and between them there was
    nothing in the middle carrying a shape. A hook is what a listener hums back, and 0102's *"a melody
    somebody could hum"* was true of the boss's piece and of nothing else.

    ⚠️ **Syncopated against everything under it.** `engine`'s kick is four on the floor and `groove`
    plays the offbeats and pushes; this lands on the *and* of two and the *and* of three, so it fills
    the one part of the bar the other two leave alone. Three parts on the beat is one thicker part.

    ⚠️ **Four bars over the eight-bar progression**, on `LAYER_BARS`' own rule: the figure states
    itself over the first half and again over the second, so the harmony turns underneath a line that
    does not — which is what makes a riff a riff and costs half the buffer of writing it twice.
  */
  /*
    ── AND IT IS A RIFF NOW RATHER THAN A STAB, BECAUSE THE BRIEF WAS LIFTED ───────────────────────

    ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Said in play, unprompted:
    *"if the power ballad and rez ask is too limiting, let's change that… don't be limited by personal
    'style' requests and try to fit the music into that, go off playtest reports and actual music that
    sounds good."*

    ⚠️ **THE STAB WAS A COMPROMISE WITH A BRIEF THAT NO LONGER BINDS.** 0104 wanted *a shape a listener
    can follow* and put it in the one register the piece had empty; what it could not do was be LOUD,
    because a power ballad's mid is a pad. **A palm-muted power chord is the same job done by the
    genre that is actually built for this tempo** — root and fifth, no third, hard-driven and short,
    on a gallop.

    ⚠️ **A GALLOP — an eighth and two sixteenths — is the one rhythm that is neither the kick's nor
    the arp's.** `engine` is quarters and eighths, `arp` is straight sixteenths, `perc` is triplets and
    a tresillo; this lands on the beat and then twice more before the next one, which is why it reads
    as drive rather than as another thing on the grid.

    ⚠️ **No third in the chord, and that is what makes it a power chord rather than a wrong note.**
    The progression turns major (C, F, G) under a fixed root-and-fifth voicing, and a root-and-fifth
    is the one voicing that is correct over both — which is exactly why the genre uses it.
  */
  hook: [
    {
      /*
        The root, on a gallop, once per bar of the progression's first half — stated again over its
        second half, on `LAYER_BARS`' own rule.
      */
      steps: [
        0, _, 0, 0, 0, _, 0, 0, 0, _, 0, 0, 0, _, 0, 0,
        -4, _, -4, -4, -4, _, -4, -4, -4, _, -4, -4, -4, _, -4, -4,
        3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3,
        -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, 0,
      ],
      pitched: true,
      perBeat: 4,
      // The gallop's own shape: the eighth is the loud one and the two sixteenths lean on it. The
      // second entry is never struck — the pattern rests there — and is written out so the cycle
      // reads as a beat rather than as three numbers.
      accents: [1, 1, 0.76, 0.82],
      octave: 1,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 0.19, gain: 0.16, attack: 0.002, curve: 6.5, lowFrom: 2600, lowTo: 780, q: 1.7, drive: 0.7 },
    },
    {
      // The fifth over it. Two notes and no third is a power chord; adding the third is what would
      // make it wrong over three of the four bars.
      steps: [
        7, _, 7, 7, 7, _, 7, 7, 7, _, 7, 7, 7, _, 7, 7,
        3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3,
        10, _, 10, 10, 10, _, 10, 10, 10, _, 10, 10, 10, _, 10, 10,
        5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 7,
      ],
      pitched: true,
      perBeat: 4,
      accents: [1, 1, 0.76, 0.82],
      octave: 1,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 0.17, gain: 0.115, attack: 0.002, curve: 7, lowFrom: 2400, lowTo: 860, q: 1.6, drive: 0.6 },
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
      accents: [1, 0.62, 0.8, 0.6],
      tempoRelative: true,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT * 0.22, gain: 0.1, attack: 0.002, curve: 5, lowFrom: 4200, lowTo: 1200, q: 2, drive: 0.3 },
    },
    {
      // Toms rolling into the top of every bar. A fill is what tells the ear a bar has ended, and
      // without one a two-bar loop is a four-second stretch of the same thing.
      //
      // ⚠️ **It was three literal `1`s and 0108 is why it is not.** A roll that does not get louder
      // is not a roll — it is three toms — and this is the one voice 0102's velocity model reached
      // and nobody went back for.
      steps: [_, _, _, _, _, _, _, _, _, _, _, _, _, 0.68, 0.84, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 190, to: 105, seconds: 0.2, gain: 0.4, attack: 0.001, curve: 5, drive: 0.25 },
    },
  ],

  /*
    ── THE TOLL — WHAT MAKES THE BOSS'S OWN RUNG AN ARRIVAL ───────────────────────────────────────

    `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`. Reported from play: *"the level
    music is getting passable, but the boss music isn't increasing proportionally."*

    ⚠️ **AN ARRIVAL IS A FUNCTION OF WHAT CAME BEFORE IT, AND `approach` HAD NOTHING OF ITS OWN.**
    0102 gave `approach` the `drive` arpeggio and 0107 gave the level four rungs to climb; what the
    boss then added was one melody over a bed that had been getting fuller for three minutes. A rung
    that opens a bell over the last twelve seconds is what turns the next one into a release.

    ⚠️ **A bell and not a riser, because a riser has a length and this has a distance.**
    `BOSS_APPROACH_UNITS` is measured in world units and a player who backs off spends longer in it —
    so anything shaped like a one-shot sweep would finish early and leave silence where the tension
    was. A figure that repeats can be in the approach for as long as the approach lasts.
  */
  toll: [
    {
      /*
        The bell: the root, then the minor third, once every two bars. Slow enough that two of them
        are the whole of the approach, which is the point — this is a clock, not a part.
      */
      steps: [0, _, 3, _],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      tempoRelative: true,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT * 4.8, gain: 0.3, attack: 0.015, curve: 1.5, lowFrom: 1400, lowTo: 420, q: 1.7 },
    },
    {
      /*
        THE CHOIR — two detuned saws holding the same two notes an octave up, behind a narrow filter.

        ⚠️ **It was a sine an octave DOWN and the mix guard is why it is not.** A sustained low sine
        under a bell is the obvious weight, and `tests/music.test.ts` measured it as the second largest
        single contribution to the boss mix's peak — a tail wrapping onto the bar line where the sub's
        drop already lives. **Weight below 60 Hz is `sub`'s job now**, and a second layer claiming it
        was buying nothing an ear could separate at the cost of the headroom the report is about.
      */
      steps: [0, _, 3, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.4, gain: 0.075, attack: 0.5, curve: 1.3, lowFrom: 900, lowTo: 2200, q: 1.4 },
    },
    {
      // The same, four cents apart. Two saws slightly detuned is what makes a held note a section
      // rather than an organ — the trick the drone and the chords both already rest on.
      steps: [0, _, 3, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 4.3, gain: 0.07, attack: 0.55, curve: 1.3, lowFrom: 890, lowTo: 2160, q: 1.4 },
    },
    {
      // A breath of filtered noise swelling into each strike. It is what an approach sounds like when
      // nothing has arrived yet, and it crosses the loop end so the swell never restarts from nothing.
      steps: [_, 0.9, _, 1],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      tempoRelative: true,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT * 4.4, gain: 0.1, attack: 1.1, curve: 1.3, lowFrom: 700, lowTo: 3200, highFrom: 280, q: 0.8 },
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
      tempoRelative: true,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT * 1.5, gain: 0.15, attack: 0.02, curve: 1.8, lowFrom: 2200, lowTo: 5200, q: 1.4 },
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
      tempoRelative: true,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT * 1.5, gain: 0.12, attack: 0.03, curve: 1.8 },
    },
  ],

  /*
    ── THE STOMP — THE DRUMS GO DOUBLE TIME, AND ONLY A BOSS EVER HEARS IT ────────────────────────

    `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`. Reported: *"how much can we mix it
    up for the bosses?"*

    ⚠️ **THE TEMPO STILL CANNOT MOVE AND THIS IS WHAT *DOUBLE TIME* MEANS INSTEAD.**
    `docs/decisions/0093-the-gun-is-on-the-grid.md` fixes a beat at 24 sim steps and the gun, every
    enemy cadence and 0094's phase-lock all ride it. A kick on the offbeat quarters turns
    four-on-the-floor into eight-on-the-floor without a BPM existing anywhere as a number, which is
    the same mechanism `docs/decisions/0091-the-boss-has-an-aura.md` already calls *builds in tempo*
    — applied to the one part of the kit that had never been asked to do it.

    ⚠️ **A boss now opens THREE things — `lead`, this, and the aura's ceiling** — against the one it
    opened before. That is the whole of the report: the level's climb got four rungs in 0107 and the
    fight's did not move, so the arrival got relatively quieter as the level got better.
  */
  stomp: [
    {
      // The offbeat kick. With `engine` still on the floor underneath it, the pulse is eight to the
      // bar and the ear reads the piece as having doubled without a note changing pitch.
      steps: [_, 1, _, 0.9, _, 1, _, 0.95, _, 1, _, 0.9, _, 1, _, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 145, to: 40, seconds: 0.3, gain: 0.44, attack: 0.001, curve: 3.2, drive: 0.3 },
    },
    {
      // A sixteenth snare roll that leans into each bar. Quiet per stroke and relentless in aggregate,
      // which is what a roll is for: it is the only thing in the piece with no gaps at all.
      steps: Array.from({ length: 32 }, (_unused, i) => 0.35 + 0.5 * ((i % 16) / 15)),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.045, gain: 0.14, attack: 0.0008, curve: 6, lowFrom: 3800, lowTo: 1500, highFrom: 380 },
    },
    {
      // A crash on the top of each bar, which is the one sound in the game that says *this is the
      // part where it happens*.
      steps: [1, _, _, _, 0.82, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.9, gain: 0.13, attack: 0.002, curve: 2.2, lowFrom: 9000, lowTo: 4200, highFrom: 2600 },
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
      tempoRelative: true,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT * 2.4, gain: 0.4, attack: 0.22, curve: 1.6, lowFrom: 420, lowTo: 900, q: 1.1 },
    },
    {
      steps: [7, _, 7, _, 7, _, 7, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      tempoRelative: true,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT * 2.5, gain: 0.54, attack: 0.28, curve: 1.4 },
    },
    {
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      tempoRelative: true,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT * 2.3, gain: 0.13, attack: 0.3, curve: 1.5, lowFrom: 900, lowTo: 2600, highFrom: 300, q: 0.7 },
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
      tempoRelative: true,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT * 0.3, gain: 0.21, attack: 0.006, curve: 5, lowFrom: 2600, lowTo: 700, q: 1.6 },
    },
    {
      // The offbeats, a fifth up — the half that makes it read as a doubling rather than as louder.
      steps: [_, 7, _, 7, _, 7, _, 7, _, 7, _, 7, _, 7, _, 7],
      pitched: true,
      perBeat: 2,
      octave: 2,
      tempoRelative: true,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT * 0.26, gain: 0.17, attack: 0.004, curve: 6 },
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
