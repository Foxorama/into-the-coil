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
  'ride',
  'call',
  'hook',
  'drive',
  'toll',
  'crash',
  'dread',
  'lead',
  'counter',
  'stomp',
  'frenzy',
  'wraith',
  'auraSlow',
  'auraFast',
  /*
    ── FOUR SLOTS THAT ARE NOTHING UNTIL A PLACE SAYS WHAT THEY ARE ──────────────────────────────

    ⚠️ **`docs/decisions/0188-a-place-owns-four-slots.md`**, answering *"can we add different layers?
    these are the exact kind of similarity issues that are blocking some of the differences I want on
    different levels."*

    ⚠️ **THE NINETEEN ABOVE HAVE AN IDENTITY AND THAT IS WHAT WAS MEASURED.** `node
    scripts/weigh-gesture.mjs` says **nine of twenty-three slots are filled the same way** by Ember
    Nebula and Saurian Belt — same strike rate, same note length, same lowest note. Neither place
    inherited them; each wrote its own and arrived at the same instrument, because a slot called
    `drone`, panned centre, four bars long and given the `air` role can only be one thing.

    ⚠️ **SO THESE FOUR CARRY NO NAME, NO PAN, NO LENGTH AND NO ROLE.** A place states all four or the
    slot is silent — `tests/themes.test.ts` holds that. Saurian Belt's `ownA` and Rime Shelf's are
    not variations of one instrument; they are different instruments that share a slot in a closed
    union, which is
    `docs/decisions/0016-a-hub-enumerates-kinds.md`'s rule kept and its cost paid somewhere else.

    ⚠️ **FOUR, AND THE CEILING IS WHY IT IS NOT MORE.** `tests/sound.test.ts` holds the resident audio
    under 56 MB and twenty-three layers is 48.0. Four four-bar slots is **52.5 MB**; four eight-bar
    slots is 57.0 and does not fit. That guard's own note says a change wanting more than 56 MB wants
    the boundary-baking mechanism instead, and this one does not.
  */
  'ownA',
  'ownB',
  'ownC',
  'ownD',
] as const;

/**
 * The slots a PLACE gives an identity to, and which are nothing without one — 0188.
 *
 * ⚠️ **CLOSED AND DERIVED FROM THE LIST ABOVE**, so a fifth cannot be added by writing it in one
 * table and forgetting the other four it has to appear in.
 */
export const OWN_LAYERS: readonly MusicLayer[] = ['ownA', 'ownB', 'ownC', 'ownD'];

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
 * The layers that belong to the LEVEL's piece and are closed when the boss arrives.
 *
 * ── THE SECOND PLACE THE LADDER IS ALLOWED TO CLOSE SOMETHING, AND THE REASON IS 0095's ──────────
 *
 * ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** Reported from play:
 * *"the boss part just feels like part of the regular level music, not an escalation… there is no
 * separate boss theme or dynamic climax."*
 *
 * ⚠️ **AND IT IS ARITHMETIC RATHER THAN TASTE.** 0090's ladder only ever OPENS layers, so the boss
 * rung is the level's arrangement plus whatever it adds — *the level with more of it*, exactly as
 * reported, and no amount of adding can make it anything else. **A different piece requires the old
 * one to stop.**
 *
 * ⚠️ **0095 ALREADY MADE THIS ARGUMENT ONCE.** *"A layer that cannot be in two places is a layer that
 * has to stop"* was written about the title's bass over the level's progression. The same sentence is
 * true here for a stronger reason: the level's material is consonant A minor and the boss's is
 * Phrygian with a tritone in it, so holding `chords` open under `dread` is not a thin arrangement, it
 * is a wrong note.
 *
 * ⚠️ **`drone` and `sub` are deliberately NOT here**, on exactly the terms 0095 kept the drone across
 * its own seam: they are the connective tissue, so the change of piece is a swell and a drop rather
 * than an edit. `sub` sounds the root, which is common to both.
 *
 * ⚠️ **The list is what makes the boss's opening SPARSE**, which is the first half of *"builds from a
 * tense, sparse intro into an all-out wall of sound"*. Nine layers stop; four remain; and then
 * `bossPeak` puts the wall back one piece at a time.
 */
export const LEVEL_ONLY: readonly MusicLayer[] = ['chords', 'groove', 'arp', 'hook', 'lead'];

/**
 * What each rung inside a level CLOSES as it opens. Declared, never accidental.
 *
 * ── 0090's ADDITIVE RULE IS GONE, AND THE PLAYER SAID SO TWICE ──────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0120-a-rung-may-close-a-layer.md`.** Reported from play: *"the push is a
 * noticeable change in musical variation, the surge and then the approach are less noticeable because
 * the ongoing beat and melody is strong and the additions are subtle."* And, of 0090 itself: *"if
 * it's restricting the music, it's a problem and not a good rule."*
 *
 * ⚠️ **`docs/decisions/0114-the-fight-is-a-different-piece.md` ALREADY NAMED THIS AS THE ANSWER** and
 * did not have the rule to spend: *"a rung that closes a layer as it opens two is a change of
 * arrangement rather than a thicker one, and it is the only mechanism here that has ever read as a
 * section boundary."* Four rounds were spent adding layers to make a section louder and every one of
 * them made the report more true.
 *
 * ⚠️ **AND IT IS ARITHMETIC RATHER THAN TASTE.** An additive ladder can only ever produce *the same
 * thing with more on top*, by construction — so *"the additions are subtle"* is not a mixing failure,
 * it is the only thing the mechanism can do once eleven layers are already playing.
 *
 * ⚠️ **A TABLE RATHER THAN A PERMISSION, on exactly `TITLE_ONLY`'s and `LEVEL_ONLY`'s terms.** What
 * replaces the rule is more structure, not less: a rung may close only what is named here, every
 * member has to actually be open below and closed here, and a rung that closes must still open more
 * than it closes. `tests/music.test.ts` holds all three.
 *
 * ⚠️ **`call` IS THE ONE CONSUMER, AND IT IS A REPLACEMENT RATHER THAN A REMOVAL.** `surge` opens
 * `counter` — a counter-melody — in the same breath as the tune that has been running since `run`
 * stops. The ear is handed a different tune rather than another one on top, which is what a section
 * boundary IS. It also leaves `call` free to be the thing the player already said they liked
 * (*"the tune kickin around 52 secs is great"*) without it playing for the whole level.
 */
export const RUNG_CLOSES: Partial<Record<MusicLevel, readonly MusicLayer[]>> = {
  surge: ['call', 'arp'],
  approach: ['groove', 'hook'],
};

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
  sub: 16,
  engine: 4,
  perc: 4,
  chords: 16,
  groove: 16,
  arp: 16,
  ride: 4,
  call: 16,
  hook: 16,
  drive: 2,
  toll: 4,
  crash: 4,
  dread: 4,
  lead: 4,
  stomp: 2,
  frenzy: 8,
  wraith: 8,
  counter: 16,
  auraSlow: 2,
  auraFast: 2,
  /*
    ⚠️ **AN OWN SLOT'S LENGTH IS THE PLACE'S, AND THIS IS THE FALLBACK** — 0188. Four bars is what
    fits: `tests/sound.test.ts`'s resident ceiling is 56 MB, twenty-three layers is 48.0, and four
    four-bar slots is 52.5. A place may state its own and the guard measures the WORST place rather
    than the base, so a sixteen-bar own layer fails there and the argument gets made.
  */
  ownA: 4,
  ownB: 4,
  ownC: 4,
  ownD: 4,
};

/**
 * How far off centre each layer sits, `-1` hard left to `+1` hard right.
 *
 * ── TWENTY-THREE LAYERS STACKED AT ONE POINT IN SPACE ───────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0118-the-mix-has-a-width.md`.** Reported from play: *"it's currently playing
 * over the top of the music so it's drowning out some of the subtler other melody parts"*, and, of
 * the rungs above `push`, *"less noticeable because the ongoing beat and melody is strong and the
 * additions are subtle."*
 *
 * ⚠️ **BOTH ARE MASKING, AND MASKING IS WHAT A MONO MIX CANNOT ESCAPE.** Every layer this game has
 * ever played came out of the same point, so two sounds in the same frequency band had nothing to
 * separate them but level — which is why the answer has been a gain six times running.
 * `docs/decisions/0114-the-fight-is-a-different-piece.md` says the next attempt must not be another
 * one. **A position is not a level.**
 *
 * ⚠️ **IT COSTS NO MEMORY, WHICH IS NOT WHAT A FIRST READING SUGGESTS.** The obvious build is stereo
 * buffers, and that doubles 52 MB of resident audio against a ceiling `tests/sound.test.ts` says must
 * not be raised again. The layers stay MONO and take a `StereoPannerNode` each — twenty-three nodes,
 * built once with the graph, nothing per frame.
 *
 * ── WHY NOTHING IS HARD PANNED ──────────────────────────────────────────────────────────────────
 *
 * ⚠️ **`PAN_LIMIT` is 0.65 and the reason is a player with one earbud in.**
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` bans a channel that carries
 * information alone, and music is not information — but a layer at ±1 is a layer somebody simply does
 * not have, and *"there is one game and it is the loud one"* is not served by a mix that is missing a
 * part depending on how you are listening. At 0.65 every layer is present in both ears.
 *
 * ⚠️ **AND THE LOW END IS CENTRED, WHICH IS A MEASUREMENT RATHER THAN A TASTE.** A panned low
 * frequency spends headroom on one side and arrives in a room as the same non-directional thump
 * anyway. `tests/music.test.ts` drives the band energy of every layer and requires anything whose
 * weight is in `sub` and `low` to be at zero — so the rule survives a layer being re-voiced, which a
 * typed list of names would not.
 */
export const LAYER_PAN: Record<MusicLayer, number> = {
  drone: 0,
  bass: 0,
  beat: 0,
  sub: 0,
  engine: 0,
  perc: -0.45,
  chords: 0.2,
  groove: 0,
  arp: -0.55,
  ride: 0.5,
  call: -0.3,
  hook: 0.55,
  drive: 0.25,
  toll: -0.5,
  crash: -0.35,
  dread: 0.15,
  lead: 0.3,
  counter: -0.4,
  stomp: 0,
  frenzy: 0.45,
  wraith: -0.25,
  auraSlow: -0.6,
  auraFast: 0.6,
  /*
    ⚠️ **CENTRED IS THE FALLBACK AND NOT THE ANSWER** — 0188. A place that opens an own slot states
    where it sits; centre is what a slot nobody has claimed is worth. **The low-end rule still
    applies**: a place that puts its weight under 130 Hz and pans it fails 0118 like any other layer.
  */
  ownA: 0,
  ownB: 0,
  ownC: 0,
  ownD: 0,
};

/** The widest a layer may sit. Not 1, and the reason is on `LAYER_PAN`. */
export const PAN_LIMIT = 0.65;

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
 * range asked for, and a distance rather than a timer like everything else this project paces. A
 * level authored longer therefore spends longer building, which is the behaviour a fixed timer would
 * not have.
 *
 * ⚠️ **AND THAT IS STILL TRUE OF THE AURA WHERE IT STOPPED BEING TRUE OF THE SECTIONS** —
 * `docs/decisions/0158-a-level-says-where-its-sections-open.md`. The build is measured from the
 * level's start and runs to the boss, so it stretches with `bossAt`; a level's SECTIONS are now
 * authored positions and do not. The two used to share the argument and no longer do.
 *
 * ⚠️ **THE CEILING IS A PLACE'S OWN NOW, AND IT WAS ONE NUMBER FOR ALL SEVEN** —
 * `docs/decisions/0183-a-cue-is-limited-rather-than-refused.md`. `AURA_LEVEL_CEILING` stood here at
 * 0.55; what a place states is `THEMES[place].aura`, read through `auraCeilingOf`.
 *
 * ⚠️ **WHAT THE NUMBER IS FOR HAS NOT CHANGED, WHICH IS WHY IT IS A FIELD AND NOT A DELETION.** If
 * the level-long build reaches 1 the boss arrives at the volume it had been at for a minute, and
 * `docs/decisions/0091-the-boss-has-an-aura.md`'s whole subject — *as it gets closer to the player* —
 * has nothing left to say. **That is not a hypothesis: `scripts/probes/0091-aura.mjs` has driven it
 * to 1 and reddened the guard since 0107.** A place that wants its dread to arrive early may now say
 * so; what is gone is one hand's answer standing for seven places.
 *
 * ⚠️ **AND THE TWO ARE COMBINED WITH A MAXIMUM, NEVER A SUM.** A sum would put the aura past its
 * ceiling the moment a player closed on a boss at the end of a long level, which is exactly the
 * headroom `tests/music.test.ts` measures. `auraFor` is the one description.
 */
export const AURA_ONSET_UNITS = 720;

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
/*
  ── 0.22 → 0.3, AND IT IS THE SHAPER DOING THE JOB A GAIN COULD NOT ──────────────────────────────

  ⚠️ **`docs/decisions/0114-the-fight-is-a-different-piece.md`.** Reported: *"the boss music was
  better, but too subdued and quiet against the game sfx themselves."* Measured with
  `node scripts/hear.mjs --play`, the fight was **+4.4 dB** over the cues where mid-level was +6.0 —
  the quietest the music gets against the effects is the one place it should be loudest.

  ⚠️ **RAISING THE RUNG DID NOT WORK AND THE PEAK IS WHY.** The fight already sits at 0.95 of full
  scale with the cues in it; every attempt to gain its way out clipped `debris` at the boss. What a
  bus shaper buys is exactly this: more loudness at the SAME peak, which is the definition of the
  problem.

  ⚠️ **0104's guard is what says this is safe.** *The shaper has not flattened the ladder it is meant
  to make room for* — every rung still arrives louder than the one below at 0.3, and it is the
  measurement that decided the value rather than an ear. Driven: 0.22 gives the fight +5.4 dB, 0.3
  gives +6.4, and both are green.

  ⚠️ **AND `debris` STOPPED DOUBLE-COUNTING THE DRUMS in the same change.** Its mix leant on `perc`
  1.4 and `stomp` 1.3 — authored when the fight was not percussion-led. It is now, so the theme and
  the rung were multiplying the same idea; the theme gives way, exactly as `nebula` and `forge` did
  when the boss rung took over the bass.
*/
/*
  ── 0.3 → 0.15, AND THE THING IT BOUGHT IS THE THING IT COST ────────────────────────────────────

  ⚠️ **`docs/decisions/0217-the-bus-is-a-colour-and-it-was-too-thick.md`.** Reported: *"the approach
  compared to ember nebula sounds distorted a bit and some of the boss music has similar distortion,
  it just doesn't sound crystal clear and clean."*

  ⚠️ **IT IS NOT CLIPPING, AND THAT WAS CHECKED FIRST.** `tests/themes.test.ts` walks every place at
  every rung with the browser's clamp modelled and reports the share of samples flattened: **0.0089%**
  at worst, one sample in eleven thousand, each 0.054 dB out. What a listener is hearing is the
  saturation itself, working hardest where the mix is loudest — which is exactly why the places and
  rungs named in the report are the loud ones.

  ⚠️ **MEASURED WITH `scripts/weigh-clean.mjs`**, as the share of the output no single gain explains:
  the loud rungs sit at **−13 to −16 dB** at 0.3 and **−17 to −21 dB** at 0.15. The Approach at `push`
  — the exact comparison the report makes against Ember Nebula — moves from −16.6 to −21.1.

  ⚠️ **AND IT COSTS THE LOUDNESS 0114 BOUGHT, WHICH IS THE HONEST HALF.** The table above measures
  `run` RMS at 0.376 for 0.3 and 0.285 for 0.15 — about **2.4 dB** — and 0114 raised this constant
  precisely because *"the boss music was better, but too subdued and quiet against the game sfx"*.
  That report may come back; `MUSIC_GAIN` is where it would be answered, and the shaper is no longer
  the thing standing in for it. **The clean-versus-loud trade was put to the player and this is the
  answer they chose.**

  ⚠️ **THE DYNAMICS IMPROVE, WHICH IS THE ONE THING THAT GETS BETTER FOR FREE.** The same table:
  boss-over-run is **+1.7 dB at 0.3 and +2.1 dB at 0.15**, because a shaper on a summed bus takes the
  arrival away first. 0108 chose 0.22 on that column and 0114 spent it again for level.
*/
export const MUSIC_DRIVE = 0.15;

/**
 * The music bus's compressor — `docs/decisions/0219-range-and-clean-stop-being-one-knob.md`.
 *
 * ── WHY THIS EXISTS AND WHY 0104 REFUSED IT ────────────────────────────────────────────────────
 *
 * ⚠️ **Asked for after four passes at the same six seconds**: *"I'm after a more smoother volume tone
 * overall and I can adjust speaker volume… the volume is decent for the intro section and then
 * requires a volume control down for later sections."* Plus, from the day before, *"it just doesn't
 * sound crystal clear and clean."* **Those two were one knob until now**: `saturate` narrows the range
 * by squashing, so every decibel of range it took out arrived as distortion, and 0217 halved it for
 * cleanliness and widened every contrast in the game as a side effect nobody had measured.
 *
 * ⚠️ **0104 REFUSED A COMPRESSOR AND ITS REASON WAS EXACT**: *"a compressor has an attack and a
 * release, so it is a function of the signal's history; `tests/music.test.ts` sums the layers sample
 * by sample and could not model one, which would have meant weakening the assertion that holds the
 * mix."* That objection stands. **What answers it is a split rather than a rebuttal.**
 *
 * ⚠️ **THE STATIC CURVE SETS THE RANGE AND THE ENVELOPE SETS THE FEEL, AND ONLY ONE OF THEM IS
 * GUARDED.** A compressor's threshold, knee and ratio are a pure function of input level — the Web
 * Audio spec defines them as one — and **that is what decides how far apart two rungs end up**. The
 * attack and release decide how it gets there. So `tests/compress.ts` models the curve exactly, the
 * range guard asserts on it, and **nothing asserts on the envelope** — which is honest, because
 * nothing in the range claim depends on it.
 *
 * ⚠️ **AND THE SHAPER STAYS.** It is the colour ([0104](../../docs/decisions/0104-the-gun-plays-a-figure.md))
 * and it now sits AFTER the compressor, so it is driven at a level that barely moves instead of one
 * that swings four decibels — which is the second reason this is cleaner and not only smoother.
 */
export const MUSIC_COMPRESSOR = {
  /*
    ⚠️ **BELOW BOTH ENDS OF THE BAND, WHICH IS THE ONLY PLACE A COMPRESSOR NARROWS ANYTHING.** −6 was
    tried first, on the reasoning that a threshold at the quiet end leaves the quiet end alone — and it
    **changed the band by nothing**: at −6 the detector barely crossed the threshold at any rung, so
    every rung passed through equally and the measurement read 3.8 dB before and 3.8 dB after.

    ⚠️ **A RATIO ONLY DOES WORK ON WHAT IS ABOVE IT, AND IT NARROWS A RANGE ONLY WHERE BOTH ENDS ARE.**
    At −18 the quiet end sits just above and the loud end well above, so the loud end is pulled down
    further than the quiet one — which is the whole mechanism. Measured on The Approach: **3.8 dB of
    band becomes 2.3, and `run` gives up 0.6 dB** doing it.

    ⚠️ **AND THAT 0.6 dB IS WHY IT IS NOT LOWER.** −22 buys another 0.3 dB of band and costs 2.1 dB of
    level, which is the *"never hear the really quiet parts"* half of the same report arriving by a
    different route.
  */
  threshold: -18,
  /*
    ⚠️ **2:1, WHICH HALVES THE RANGE ABOVE THE THRESHOLD AND IS THE WHOLE ASK.** *"A more smoother
    volume tone overall"* measured as a band: The Approach ran 3.8 dB from `run` to its loudest, and
    half of that is the target. Higher ratios flatten the arc 0136 authored; this is the gentlest one
    that does the job.
  */
  ratio: 2,
  /*
    ⚠️ **A WIDE KNEE, BECAUSE A RUNG CHANGE MUST NOT BE HEARD AS THE COMPRESSOR NOTICING IT.** Six
    decibels of knee means the ratio arrives gradually across the range the rungs actually live in,
    so what a listener hears is a smaller step rather than a step plus a gain-riding artefact.
  */
  knee: 6,
  /*
    ⚠️ **THE ENVELOPE IS THE PART NO GUARD HOLDS, AND THESE ARE HANDS' NUMBERS SAID TO BE SO.** Fast
    enough to catch a rung arriving on a downbeat and slow enough not to pump against the kick, which
    is `docs/decisions/0104-the-gun-plays-a-figure.md`'s own concern about a bus that breathes. They
    are the two values to move if the mix sounds like it is being ridden.
  */
  attack: 0.02,
  release: 0.25,
} as const;

/**
 * How much of a boss's health has to be gone before the music reaches its wall of sound.
 *
 * ⚠️ **Half, and it is a share rather than a phase** — 0111 gives each boss its own phase table, so
 * *phase two* is a different fraction of the bar for each of the seven and *half* is half for all of
 * them. The climax has to land in the same PLACE in every fight or it is not structure, it is noise.
 *
 * ⚠️ **It is a floor on how long the sparse arrival lasts, too.** A boss that died instantly would
 * never leave the tense opening, which is correct: there was no fight to build through.
 */
export const BOSS_PEAK_HEALTH = 0.78;

/**
 * A rung a level's script may open a section with.
 *
 * ⚠️ **`MusicLevel`'s OWN NAMES, through `Extract`**, so a rung renamed in `MUSIC_LEVELS` fails to
 * compile here rather than leaving a script keyed on a string nobody answers to —
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`. It is a closed union so the desk and the guards
 * can key on it, and **nothing else about it is a ladder**: 0158 makes order and count free, so a
 * level may open at `surge`, drop to `run`, and reach `push` twice.
 *
 * ⚠️ **`calm` is not here and `boss`/`bossPeak` are not either.** `calm` is the title screen's, and
 * the fight's two rungs are keyed to the boss's HEALTH rather than to a distance
 * (`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`), so neither is a thing a
 * distance can open. A script that could name them would be offering a control over something a
 * distance does not decide — `docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md`
 * refused a handle on exactly those two for the same reason.
 */
/**
 * The four, as a LIST, because the dashboard has to offer them and a union cannot be iterated.
 *
 * ⚠️ **THE LIST IS THE DECLARATION AND THE UNION IS DERIVED FROM IT** —
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`'s own shape, and the reason round that way is that
 * `docs/decisions/0163-the-script-is-edited-here.md` needs to build a `<select>` from it. A union
 * written first and a list typed out beside it is two descriptions, and the second one goes stale
 * the day a fifth name arrives.
 */
export const SECTION_NAMES = ['run', 'push', 'surge', 'approach'] as const;

/**
 * ⚠️ **STILL `MusicLevel`'s OWN NAMES, through `Extract`**, so the tie 0016 asks for survives the
 * list being the declaration: a rung renamed in `MUSIC_LEVELS` makes this `never` and every script
 * in `src/content/levels.ts` fails to compile, which is exactly what it did before.
 */
export type SectionName = Extract<MusicLevel, (typeof SECTION_NAMES)[number]>;

/** One section of a level's music, and the level-local distance it opens at. */
export interface SectionEntry {
  /**
   * Where it opens, in the same **level-local** distance space as `bossAt`
   * — `docs/decisions/0100-a-level-places-its-pickups-too.md`.
   */
  readonly at: number;
  readonly section: SectionName;
}

/**
 * What a level's music DOES over its own length, as a script.
 *
 * ── THE THREE SHARED DISTANCES, AND WHY THEY ARE GONE ───────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0158-a-level-says-where-its-sections-open.md`.** Reported: *"can we rearrange
 * the four sections? or have them different per level as well? some levels kick right into a surge
 * etc, if we have the exact same timing for each for each it's also going to be a limiter."* This
 * replaces `PUSH_UNITS`, `SURGE_UNITS` and `BOSS_APPROACH_UNITS` — three numbers measured back from
 * the boss and shared by all seven levels. **Their arguments are not restated here**: 0102 chose
 * them, 0125 shifted all three and 0131 moved one, and each of those decisions is where its own
 * reasoning lives — `docs/decisions/0029-the-tracked-record-is-the-record.md`.
 *
 * ⚠️ **AND IT GIVES UP 0102's SCALING ON PURPOSE, WHICH IS THE ONE THING TO KNOW BEFORE RETUNING A
 * `bossAt`.** *"Measured from the boss backwards, so a longer level spends longer at `run`"* is no
 * longer true: a script is level-local and ascending, so a level made longer now spends the extra
 * time in its **last** section rather than its first. 0158 has the measurement that says this costs
 * almost nothing — the seven `bossAt` values span 220 units, which is 6.1 seconds across the whole
 * roster — and `tests/music.test.ts` holds every gap to a floor and a ceiling in seconds, over all
 * seven levels rather than over level one.
 *
 * ⚠️ **ASCENDING, AND THE FIRST ENTRY IS AT `0`**, like `waves` and `pickups` beside it in
 * `src/content/levels.ts`. `musicLevelFor` walks it in order and takes the last entry the camera has
 * reached, so an out-of-order script would silently hide a section rather than reorder one.
 */
export type LevelSections = readonly SectionEntry[];

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
 * The bar, in seconds, and how many of them a loop is.
 *
 * ⚠️ **THE LOOP LENGTH MUST BE A WHOLE NUMBER OF SAMPLES AT EVERY RATE IT IS BAKED AT.** A length
 * that rounds is a layer that drifts against the other three, and drift is the one failure this
 * design cannot recover from — there is no scheduler to re-align anything. 0.4s a beat is 150 BPM,
 * and eight beats is 3.2 seconds, which is exact at 44100, at 22050 and at 48000.
 * `tests/music.test.ts` holds it rather than this comment.
 *
 * ⚠️ **IT IS THE MUSIC'S OWN NUMBER NOW, AND NOTHING IN THE SIM DECIDES IT** —
 * `docs/decisions/0159-the-two-clocks-come-apart.md`. It used to be `STEPS_PER_BEAT / 60`: a beat
 * had to be a whole number of sim steps so that the gun's cadence could be a musical fraction
 * (`docs/decisions/0093-the-gun-is-on-the-grid.md`), which made **the tempo a hostage of the fire
 * rates** — 24 steps a beat admits 150 BPM and 300 and nothing in between, so *"a fast paced tempo
 * melody that INCREASES IN TEMPO throughout the level"* was not a thing this game could express at
 * all.
 *
 * ⚠️ **0.4 IS UNCHANGED AND THAT IS DELIBERATE.** 0159 decouples and moves nothing, so the landing
 * is silent and the diff is provable; a tempo that MOVES is the change after it, and it is the one
 * that costs a re-bake (`docs/decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md` has
 * what a bake now costs and the scheduler that spends it).
 *
 * ⚠️ **Every note length written as a multiple of `BEAT_SECONDS` follows it**; the handful written
 * in absolute seconds — a kick's 0.26, a hat's 0.04 — deliberately do not, because a drum's decay is
 * a property of the drum and not of the tempo. **That distinction stops being cosmetic the moment
 * the tempo moves**, and it is already correct.
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

  ⚠️ **`push` and `surge` are the two new ones and they are DISTANCES**, like `bossAt` and like
  everything else this project paces — so they mean the same thing on a device that drops frames.

  ⚠️ **AND WHERE EACH ONE OPENS IS THE LEVEL'S OWN ANSWER NOW** —
  `docs/decisions/0158-a-level-says-where-its-sections-open.md`. This list is the closed union of
  what a level's `sections` script may name (`SectionName` narrows it); it is **not** an order, and
  nothing requires a level to reach these in this sequence or at all.
*/
export const MUSIC_LEVELS = ['calm', 'run', 'push', 'surge', 'approach', 'boss', 'bossPeak'] as const;

export type MusicLevel = (typeof MUSIC_LEVELS)[number];

/**
 * What to CALL a rung where a player can read it — `docs/decisions/0212-the-room-walks-the-level.md`.
 *
 * ── FIVE OF THE SEVEN ARE THE KEY ITSELF, AND THAT IS THE ARGUMENT FOR THE TABLE ────────────────
 *
 * ⚠️ **A `Record` OVER THE CLOSED UNION RATHER THAN A CAPITALISE** — 0016. `bossPeak` is the one
 * that cannot be shown as it is spelled, and a function that special-cased it would be a table with
 * one row hidden inside an `if`. Written out, a rung added to `MUSIC_LEVELS` fails to compile until
 * somebody has decided what a player should see, which is the whole mechanism.
 *
 * ⚠️ **THESE ARE THE COMPOSER'S OWN WORDS AND NOT NEW ONES.** `run`, `push`, `surge` and `approach`
 * are what every header in `src/content/` already calls them and what
 * `docs/decisions/0102-the-music-goes-somewhere.md` named them; inventing a second, friendlier set
 * for the UI would put the thing on screen and the thing in the tables one rename apart.
 */
export const MUSIC_LEVEL_LABEL: Record<MusicLevel, string> = {
  calm: 'Calm',
  run: 'Run',
  push: 'Push',
  surge: 'Surge',
  approach: 'Approach',
  boss: 'Boss',
  // ⚠️ **The one rung whose name is not a word.** 0113's second fight rung — the wall of sound that
  // lands when the fight is half won — and *Peak* is what `rig/dash.ts`'s own control already calls it.
  bossPeak: 'Boss — peak',
};

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
/*
  ⚠️ **THE FOUR OWN SLOTS ARE ZERO IN EVERY ROW, AND THAT IS THE MECHANISM** — 0188. The shared
  ladder never opens one, so a slot sounds only where a place opens it in its own `ladder`
  (`docs/decisions/0162-a-place-has-its-own-ladder.md`). **The base composition has no own layers**,
  which is what makes them a place's rather than a default nobody chose.
*/
export const MUSIC_LADDER: Record<MusicLevel, Record<MusicLayer, number>> = {
  calm: { drone: 0.55, bass: 0.7, beat: 0.5, sub: 0, engine: 0, perc: 0, chords: 0, groove: 0, arp: 0, ride: 0, call: 0, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0, auraFast: 0, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },
  /*
    ── `run` AND `push` SHARE THEIR BED — 0219 ───────────────────────────────────────────────────

    ⚠️ **Asked for after three answers that all made the climb SMOOTHER and none of it QUIETER**:
    *"can we raise the volume of the first section instead? I'm after a more smoother volume tone
    overall and I can adjust speaker volume… the volume is decent for the intro section and then
    requires a volume control down for later sections."*

    ⚠️ **RAISING THE BOTTOM IS THE ONLY DIRECTION THAT NARROWS THE RANGE WITHOUT LOSING ANYTHING.**
    Lowering the top was built and reverted: trimming `push` and above while leaving `run` alone
    **ducks every carried layer**, which `docs/decisions/0167-a-build-does-not-duck.md` forbids
    and 0215's hole guard caught; and lowering the master takes the quiet end down with it, which is
    the other half of the same report — *"we're going to just never hear the really quiet parts."*

    ⚠️ **EACH CARRIED LAYER TAKES HALF ITS ROOM UP TO `push`**, which is as far as the ladder's own
    guards allow. Measured per layer the room was 0.0 to 1.9 dB — `drone` and `chords` had none and
    `sub` had the most — so this is not a uniform lift but the shape the ladder already implied.

    ⚠️ **TAKING ALL OF IT WAS TRIED FIRST AND THREE GUARDS REFUSED IT, CORRECTLY.** With the bed
    equalised, `push` arrived **0.16 dB** over `run` on the base composition against 0108's floor of
    1.02 — *the shaper has eaten the climb* — and `saurian`'s `bass` fell a whole role under what the
    arrangement asks of it. **A rung that arrives at the same loudness is not a rung**, and narrowing
    the range cannot go so far that the ladder stops being one.

    ⚠️ **AND THE AURA IS DELIBERATELY NOT TOUCHED.** It is the only layer here whose whole job is to
    climb — 0107's *"amp up until you beat the boss"* — and a guard says so in as many words: raising
    it at `run` made `push` no louder than the rung below and *the build goes backwards*.
  */
  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.96, engine: 0.93, perc: 0.71, chords: 0.86, groove: 0.87, arp: 0, ride: 0, call: 0.65, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.5, auraFast: 0.28, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },
  /*
    ── `push` IS AN ENTRANCE, AND IT WAS THE WHOLE CLIMB — 0218 ───────────────────────────────────

    ⚠️ **Reported twice, the second time in the words that identified it**: *"it's background music up
    till that point and then at around that point it loudly increases to foreground music volume."*
    Measured through the shaper, The Approach ran `run` −13.7, `push` −10.1, `surge` −9.5 — so
    **`push` carried 3.6 dB of a 4.1 dB climb and everything after it was flat.** The level went from
    background to full in one boundary at 41 seconds, which is what a listener called foreground.

    ⚠️ **THE THREE LAYERS THAT CONTINUE INTO `surge` NOW ARRIVE AT 70% OF THEIR `surge` VALUE**, which
    is a rule rather than three tuned numbers: `ride` 0.68→0.48, `hook` 0.74→0.52, `lead` 0.78→0.55.
    A part enters, and then it grows. **`arp` is untouched at 0.64** because `surge` closes it — it
    lives only here, so arriving at a fraction of a value it never reaches would be arriving quiet
    for no reason.

    ⚠️ **AND IT BUYS THE SECOND STEP BACK.** `docs/decisions/0136-the-place-has-a-room-and-an-arc.md`
    authored *"Up, Up, Up, drop, sharp Down"*; measured, the arc was **up, flat, slightly down**.
    The Approach now reads +2.6 at `push` and +4.1 at `surge`, so `push → surge` is a real move for
    the first time rather than half a decibel.
  */
  push: { drone: 0.34, bass: 0, beat: 0, sub: 1.06, engine: 0.96, perc: 0.76, chords: 0.87, groove: 0.94, arp: 0.64, ride: 0.48, call: 0.68, hook: 0.52, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0.55, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.62, auraFast: 0.4, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },
  surge: { drone: 0.33, bass: 0, beat: 0, sub: 1.04, engine: 1, perc: 0.82, chords: 0.86, groove: 0.94, arp: 0, ride: 0.68, call: 0, hook: 0.74, drive: 0.78, toll: 0, crash: 0.9, dread: 0, lead: 0.78, counter: 1.05, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.75, auraFast: 0.55, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },
  approach: { drone: 0.34, bass: 0, beat: 0, sub: 1.1, engine: 1.02, perc: 0.86, chords: 0.84, groove: 0, arp: 0, ride: 0.72, call: 0, hook: 0, drive: 0.84, toll: 0.86, crash: 0.92, dread: 1, lead: 0.82, counter: 1.08, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.88, auraFast: 0.72, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },
  boss: { drone: 0.36, bass: 0, beat: 0, sub: 1.12, engine: 1.12, perc: 0.96, chords: 0, groove: 0, arp: 0, ride: 0.9, call: 0, hook: 0, drive: 0.94, toll: 0.92, crash: 0.94, dread: 1.02, lead: 0, counter: 0, stomp: 0.92, frenzy: 0.86, wraith: 0.8, auraSlow: 1, auraFast: 0.9, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },
  bossPeak: { drone: 0.3, bass: 0, beat: 0, sub: 1.12, engine: 1.1, perc: 0.95, chords: 0, groove: 0, arp: 0, ride: 0.9, call: 0, hook: 0, drive: 0.95, toll: 0.9, crash: 0.94, dread: 1, lead: 0, counter: 0, stomp: 0.97, frenzy: 0.92, wraith: 0.92, auraSlow: 1.02, auraFast: 0.94, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },
};

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

export const MUSIC: Record<MusicLayer, readonly MusicVoice[]> = {
  /*
    ── THE FOUR OWN SLOTS, EMPTY, AND EMPTY IS THE POINT ─────────────────────────────────────────

    ⚠️ **0188.** Every other entry in this table is the base composition's version of a layer, which a
    place may re-voice. These four have no base version: a slot with a default instrument is a slot
    with an identity, and an identity is what
    `node scripts/weigh-gesture.mjs` measured nine of the twenty-three sharing.

    ⚠️ **AN EMPTY ARRAY IS SAFE BECAUSE THE LADDER CLOSES THEM EVERYWHERE.** `MUSIC_LADDER` is zero
    for all four at every rung, so nothing ever asks the base for these notes; a place that opens one
    states its voices in its own `voices` table or `tests/themes.test.ts` refuses it.
  */
  ownA: [],
  ownB: [],
  ownC: [],
  ownD: [],
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
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.04, gain: 0.05, attack: 0.0005, curve: 9, lowFrom: 13000, highFrom: 6000 },
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
      steps: [
        0, -4, 3, -2, 0, -4, -2, -5,
        3, -2, 0, -4, 3, -2, -4, -5,
      ],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.15, gain: 0.42, attack: 0.07, curve: 1.05 },
    },
    {
      /*
        THE DROP, on the bar line. Unpitched, because it SWEEPS — 64 Hz down to 28 — and a pitched
        voice replaces `from` and `to` with one note. It is a second kick an octave under the first,
        and it is the single loudest thing below 60 Hz in the game.

        ⚠️ **On the bar and not on the beat.** Four of these a bar would be a continuous rumble, which
        is the thing `MAX_CUE_SECONDS` refuses for a cue and the same mistake here; one is an event.
      */
      /*
        ── IT SWEPT 75 → 34 AND THE SENTENCE ABOVE WAS NOT TRUE OF IT ────────────────────────────

        ⚠️ **`docs/decisions/0152-a-layer-is-heard-in-the-sum.md`'s fourth shape, in the numerator.**
        *The single loudest thing below 60 Hz* started **above** the band and passed through it while
        already decaying: at `curve: 2.4` the envelope is at a third by the time 75 Hz has fallen to
        60, so the loudest quarter of this voice was spent in `low`, where the kick, the pad, the
        aura and the bass line all live, and the band this layer exists for got the tail.

        ⚠️ **It is the guard on the OTHER side of this pass that found it.** `tests/music.test.ts`'s
        *the band a chest resolves is a real share of the mix* is `sub / hi`, A-weighted, and raising
        `hook`, `arp` and `counter` to the audibility 0154's solve asks for necessarily fills `hi`.
        Measured at `surge` with the material fixes in and this voice untouched: **0.195, red**. The
        cheap answer would have been to dull the layers that had just been fixed; the honest one is
        that the numerator had the same defect the denominator did.

        ⚠️ **Starting inside the band is worth +1.7 dB of `sub` band energy AND takes the peak DOWN.**
        `run` → `bossPeak` on the raw summed bus goes 66.3/82.4/84.2/93.4/95.7/95.9% of the clipping
        ceiling to **65.8/80.9/82.7/90.8/92.6/92.8%** — because a sweep that begins lower is a longer
        first half-cycle, so the instant the bar line stacks the kick, the toll and the aura onto it
        is no longer the instant this is at full swing. `scripts/weigh-mix.mjs` reads it.

        ⚠️ **AND IT IS A PHASE COINCIDENCE, WHICH IS WHY THE VALUE WAS SEARCHED RATHER THAN DERIVED.**
        `from: 60` puts the boss rung at 101.3% and `from: 65` at 93.0%; the four numbers here were
        chosen by driving `weigh-mix`'s own arithmetic over the range, exactly as
        `docs/decisions/0114-the-fight-is-a-different-piece.md` chose `MUSIC_DRIVE`. A peak is an
        instant, and nothing about an instant can be reasoned to from a decay constant.
      */
      /*
        ⚠️ **Sixteen bars now, and the second eight is NOT the first eight repeated** — 0113. This
        layer went to sixteen because its pitched neighbour had to; a drop pattern tiled twice would
        have made the length free and bought nothing with it, which is the shape of a loop getting
        longer without getting less repetitive.
      */
      steps: [
        1, _, _, _, 1, _, _, _, 1, _, _, _, 0.85, _, _, _,
        1, _, _, _, 1, _, _, _, 1, _, _, _, 0.9, _, 0.8, _,
        1, _, _, _, 1, _, 0.6, _, 1, _, _, _, 0.85, _, _, _,
        1, _, _, _, 1, _, _, _, 1, _, 0.7, _, 0.95, _, 0.8, 0.7,
      ],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 64, to: 28, seconds: 0.6, gain: 0.42, attack: 0.002, curve: 2.6, drive: 0.15 },
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
        /*
          ⚠️ **THE B-SECTION'S C IS VOICED DOWN AN OCTAVE, AND A GUARD IS WHY.** Written at `3` — the
          C above A, which is what the chords play — the second eight bars sit higher than the first,
          and 0108's *the bed is felt* guard measured the whole phrase losing a fifth of its
          chest-band share. A bass takes the lowest voicing of the chord it is under; that is both
          what fixes the measurement and what a bass player would have written.
        */
        _, -9, -9, -9, _, -2, -2, -2, _, 0, 0, 0, _, -4, -4, -4,
        _, -9, -9, -9, _, -2, -2, -2, _, -4, -4, -4, _, -5, -5, -7,
      ],
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.9, 0.8, 0.95],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.9, gain: 0.34, attack: 0.006, curve: 2.6 },
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
      note: { wave: 'sine', from: 104, to: 34, seconds: 0.46, gain: 0.6, attack: 0.001, curve: 2.1, drive: 0.3 },
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
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.018, gain: 0.052, attack: 0.0004, curve: 9, lowFrom: 14000, highFrom: 7500 },
    },
    {
      // The open hat on every offbeat, which is the single most recognisable thing in the genre —
      // it is what makes four-on-the-floor read as *dance* rather than as *march*. Breathing on a
      // four-bar cycle, so it is a player rather than a gate.
      steps: Array.from({ length: 32 }, (_unused, i) => (i % 2 === 0 ? _ : [1, 0.72, 0.88, 0.66][((i - 1) / 2) % 4]!)),
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.11, gain: 0.072, attack: 0.001, curve: 3.2, lowFrom: 11000, highFrom: 5200 },
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
      steps: [
        0, -4, 3, -2, 0, -4, -2, -5,
        3, -2, 0, -4, 3, -2, -4, -5,
      ],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      // THE REPORTED ONE. Eight bars at one weight is the metronome the player named — the pitch moved
      // and nothing else ever did. Indexed by bar, so bars 1 and 5 are the phrase and 8 is the way out.
      accents: [1, 0.82, 0.9, 0.76, 1, 0.84, 0.92, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.17, attack: 0.06, curve: 1.5, lowFrom: 900, lowTo: 2400, q: 1.2 },
    },
    {
      steps: [
        0, -4, 3, -2, 0, -4, -2, -5,
        3, -2, 0, -4, 3, -2, -4, -5,
      ],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.82, 0.9, 0.76, 1, 0.84, 0.92, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.17, attack: 0.07, curve: 1.5, lowFrom: 890, lowTo: 2380, q: 1.2 },
    },
    {
      /*
        THE FIFTHS, AND THEY ARE THE VOICE THAT STOPS BEING A BONG. Held once a bar they were the
        fourth identical thing landing on the fourth identical downbeat; as offbeat eighths they are
        the only harmonic voice in the level's piece that arrives anywhere except beat one.

        ⚠️ **The envelope is a fifth of what it was** — 0.24s against 1.8s — because a stab that rings
        for longer than its own bar is a pad with a rhythm drawn on it. The roots above still hold the
        harmony; this articulates it.
      */
      steps: [
        _, _, 7, _, _, 7, _, _,
        _, _, 3, _, _, 3, _, 3,
        _, _, 10, _, 10, _, _, 10,
        _, _, 5, _, _, 5, _, _,
        _, _, 7, _, _, 7, _, 7,
        _, _, 3, _, 3, _, _, 3,
        _, _, 5, _, _, 5, _, _,
        _, 2, _, 2, _, 2, _, 2,
        _, _, 10, _, 10, _, _, 10,
        _, _, 5, _, _, 5, _, _,
        _, _, 7, _, _, 7, _, 7,
        _, _, 3, _, 3, _, _, 3,
        _, _, 10, _, _, 10, _, _,
        _, _, 5, _, _, 5, _, 5,
        _, _, 3, _, 3, _, _, 3,
        _, 2, _, 2, _, 2, _, 2,
      ],
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.66, 0.84, 0.6],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.6, gain: 0.15, attack: 0.008, curve: 3.4, lowFrom: 1100, lowTo: 2800, q: 1.1 },
    },
    {
      // The top voice, an octave up — where the chord stops being a bed and starts being a chord.
      steps: [
        15, 12, 19, 14, 15, 12, 14, 11,
        19, 14, 15, 12, 19, 14, 12, 11,
      ],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      // Out of phase with the roots' contour on purpose: two voices dipping on the same bar is one
      // quieter bong rather than two voices moving.
      accents: [0.9, 1, 0.78, 0.94, 0.86, 1, 0.8, 0.72],
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
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, -2, _, -2, _, -2, _, -2,
        _, -5, _, -5, _, -5, _, -5,
        _, 3, _, 3, _, 3, _, 3,
        _, -2, _, -2, _, -2, _, -2,
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, 3, _, 3, _, 3, _, 3,
        _, -2, _, -2, _, -2, _, -2,
        _, -4, _, -4, _, -4, _, -4,
        _, -5, _, -5, _, -5, _, -5,
      ],
      pitched: true,
      perBeat: 2,
      octave: 0,
      accents: [1, 1, 0.88, 0.94],
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
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, -2, _, -2, _, -2, _, -2,
        _, -5, _, -5, _, -5, _, -5,
        _, 3, _, 3, _, 3, _, 3,
        _, -2, _, -2, _, -2, _, -2,
        _, 0, _, 0, _, 0, _, 0,
        _, -4, _, -4, _, -4, _, -4,
        _, 3, _, 3, _, 3, _, 3,
        _, -2, _, -2, _, -2, _, -2,
        _, -4, _, -4, _, -4, _, -4,
        _, -5, _, -5, _, -5, _, -5,
      ],
      pitched: true,
      perBeat: 2,
      octave: 0,
      accents: [1, 1, 0.88, 0.94],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.62, gain: 0.46, attack: 0.004, curve: 3.2 },
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
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 3, _,
        -4, _, _, -4, _, 8, _, _, -4, _, 3, _, 0, _, 3, _,
        3, _, _, 3, _, 15, _, _, 3, _, _, 10, _, _, 7, _,
        -2, _, _, -2, _, 10, _, _, -2, _, 5, _, 2, _, 0, _,
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 3, _,
        -4, _, _, -4, _, 8, _, _, -4, _, 3, _, 0, _, -2, _,
        -2, _, _, -2, _, 10, _, _, -2, _, _, 5, _, _, 2, _,
        -5, _, _, -5, _, 7, _, _, -5, _, 2, _, -1, _, 3, _,
        3, _, _, 3, _, 15, _, _, 3, _, _, 10, _, _, 7, _,
        -2, _, _, -2, _, 10, _, _, -2, _, 5, _, 2, _, 0, _,
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 3, _,
        -4, _, _, -4, _, 8, _, _, -4, _, 3, _, 0, _, 3, _,
        3, _, _, 3, _, 15, _, _, 3, _, _, 10, _, _, 7, _,
        -2, _, _, -2, _, 10, _, _, -2, _, 5, _, 2, _, -4, _,
        -4, _, _, -4, _, 8, _, _, -4, _, _, 3, _, _, 0, _,
        -5, _, _, -5, _, 7, _, _, -5, _, 2, _, -1, _, 0, _,
      ],
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.7, 0.84, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.3, attack: 0.004, curve: 5, lowFrom: 1500, lowTo: 340, q: 1.5, drive: 0.45 },
    },
    {
      /*
        The octave under it as a sine, which is what makes a bass FELT rather than only heard — the
        same trick the title's bass, the chords' sub and every explosion in `src/content/cues.ts`
        use, and the reason 0095's spectral guard exists.
      */
      steps: [
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 3, _,
        -4, _, _, -4, _, 8, _, _, -4, _, 3, _, 0, _, 3, _,
        3, _, _, 3, _, 15, _, _, 3, _, _, 10, _, _, 7, _,
        -2, _, _, -2, _, 10, _, _, -2, _, 5, _, 2, _, 0, _,
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 3, _,
        -4, _, _, -4, _, 8, _, _, -4, _, 3, _, 0, _, -2, _,
        -2, _, _, -2, _, 10, _, _, -2, _, _, 5, _, _, 2, _,
        -5, _, _, -5, _, 7, _, _, -5, _, 2, _, -1, _, 3, _,
        3, _, _, 3, _, 15, _, _, 3, _, _, 10, _, _, 7, _,
        -2, _, _, -2, _, 10, _, _, -2, _, 5, _, 2, _, 0, _,
        0, _, _, 0, _, 12, _, _, 0, _, _, 7, _, _, 3, _,
        -4, _, _, -4, _, 8, _, _, -4, _, 3, _, 0, _, 3, _,
        3, _, _, 3, _, 15, _, _, 3, _, _, 10, _, _, 7, _,
        -2, _, _, -2, _, 10, _, _, -2, _, 5, _, 2, _, -4, _,
        -4, _, _, -4, _, 8, _, _, -4, _, _, 3, _, _, 0, _,
        -5, _, _, -5, _, 7, _, _, -5, _, 2, _, -1, _, 0, _,
      ],
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.7, 0.84, 0.72],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.4, attack: 0.004, curve: 4 },
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

    ── AND IT IS THE LAYER 0152 IS NAMED FOR, MEASURED IN THE FILE EVERY PLACE INHERITS FROM ───────

    ⚠️ **`docs/decisions/0152-a-layer-is-heard-in-the-sum.md`.** *"It's arp that I've never heard in
    game"* was said of Ember Nebula and fixed there; this is the same voice's ancestor, and 0154's
    solve asked **3.07×** for it at `push` against a `margin` of **−7.7 dB**. It rang `0.2 × BEAT`
    under `curve: 6` — about **53 ms of a 100 ms sixteenth**, so half of *something on every
    sixteenth* was silence.

    ⚠️ **The smallest fix of this pass, deliberately, because it is the layer with the least to give
    back.** `arp`'s `heardAt` window is `hi` (`tests/pace.ts`), which is the denominator of
    `tests/music.test.ts`'s chest guard — everything this layer gains, that ratio pays for. `0.3 ×
    BEAT` at `curve: 3.6` is 133 ms, so each note now rings into the next and nothing more:
    `margin` −7.7 → −4.0, the solve asks 2.34×, and the guard is 0.279 at `push` where it was 0.211.
    The hat under it is untouched.
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
        3, 10, 15, 10, 7, 10, 15, 19, 3, 10, 15, 10, 7, 10, 15, 19,
        -2, 5, 10, 5, 2, 5, 10, 14, -2, 5, 10, 5, 2, 5, 10, 14,
        0, 7, 12, 7, 3, 7, 12, 15, 0, 7, 12, 7, 3, 7, 12, 15,
        -4, 3, 8, 3, 0, 3, 8, 12, -4, 3, 8, 3, 0, 3, 8, 12,
        3, 10, 15, 10, 7, 10, 15, 19, 3, 10, 15, 10, 7, 10, 15, 19,
        -2, 5, 10, 5, 2, 5, 10, 14, -2, 5, 10, 5, 2, 5, 10, 14,
        -4, 3, 8, 3, 0, 3, 8, 12, -4, 3, 8, 3, 0, 3, 8, 12,
        -5, 2, 7, 2, -1, 2, 7, 11, -5, 2, 7, 2, -1, 2, 7, 11,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.55, 0.72, 0.5],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.075, attack: 0.002, curve: 3.6, lowFrom: 3600, lowTo: 1400, q: 1.8 },
    },
    {
      /*
        A closed hat on every sixteenth under it, accented on the beat. The arp says WHICH notes and
        this says *there is something on every sixteenth now*, which is the half a listener reads as
        speed. Velocities, which is the thing 0102 gave the model.
      */
      steps: Array.from({ length: 256 }, (_unused, i) => [1, 0.35, 0.55, 0.35][i % 4]!),
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
  /*
    ── AND IT WAS THE SAME 57 ms 0152 FOUND IN THE PLACE NAMED AFTER IT ────────────────────────────

    ⚠️ **`docs/decisions/0152-a-layer-is-heard-in-the-sum.md`, first shape, in the base composition.**
    `docs/decisions/0154-the-mix-is-authored-as-intent.md`'s solve asked **7.85×** for this layer at
    `push` — the arrangement saying *this is the part* to material sitting **13.0 dB under** the mix
    it plays in. The riff is written to sustain and rang `0.19 × BEAT` under `curve: 6.5`: about
    **47 ms of a 200 ms eighth**, a 24% duty cycle. The commit that fixed this in `src/content/core.ts`
    measured 57 ms of the same figure and called it *"a 29% duty cycle on the one figure in the piece
    that is supposed to sustain"*; the file that place inherits from had it worse.

    ⚠️ **THE ENVELOPE ALONE, AND EVERY FILTER AND DRIVE NUMBER IS UNTOUCHED — WHICH IS THE FINDING.**
    The obvious reading is that a longer ring on a hard-driven saw fills the top of the mix, and
    `tests/music.test.ts`'s `sub / hi` chest guard is exactly the thing that would catch it. Driven,
    it is the other way round: at `push` and `surge` the guard reads **0.211 / 0.234** on the old
    envelope and **0.279 / 0.265** on this one. A note that decays through its own downward sweep
    spends its extra length at the DARK end of `lowFrom → lowTo`, so lengthening it moves the layer's
    weight down a band while raising it. Closing `lowTo` to 560 on top of that made the guard **worse**
    (0.193, red) and cost the margin as well — the ring is where the darkness comes from, and cutting
    the ring to buy darkness spends the thing that was buying it.

    ⚠️ **`margin` −13.0 → −3.1 at `push` and the solve asks 2.33× where it asked 7.85.** It is 0.55
    of a beat under `curve: 2.0`, so each note is still at a third when the next lands and the gallop
    rings through its own rests the way a distorted guitar's does. The accents keep the articulation.
  */

  /*
    ── THE CALL — A TUNE AT `run`, WHICH IS THE ONE THING A LEVEL'S OPENING NEVER HAD ──────────────

    ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** Reported from play:
    *"it has no depth, no intricacy, no variety"*, and — of the fix that came before this one —
    *"it's also a bit too calm still."*

    ⚠️ **THE FIRST SIXTY SECONDS OF EVERY LEVEL OPENED NO MELODIC LAYER AT ALL.** `arp` was zero at
    `run`, `hook` at `push`, `lead` only at the boss — so what a player heard for the first minute
    was a kick, a clap, hand percussion, a pad and a bass. *A four-on-the-floor kick with nothing
    melodic above it* is what *"1,2,3,4,5,6,7,8 repeat"* is a description of, and it is accurate.

    ⚠️ **A NEW LAYER RATHER THAN OPENING `arp` EARLIER, AND THE LADDER IS WHY.** 0102 bought four
    climbs and 0108 says what arrives at each rung may not be spent: moving `arp` down to `run` gives
    the opening a tune by taking `push`'s arrival away. `call` opens at `run` and every rung above it
    still opens exactly what it opened before.

    ⚠️ **A CALL AND AN ANSWER, four bars each, over sixteen.** It is quarters — the slowest thing in
    the piece that is not a pad — because the opening of a level is the one stretch with room in it,
    and a melody that fills every sixteenth would be a second `arp` rather than a tune. It rests for
    a bar and a half in the middle of each phrase, which is what makes the next entry read as an
    entry.
  */
  /*
    ── AND IT WAS THE QUIETEST MELODIC VOICE IN THE FILE, PLAYING THE PART THE SOLVE CALLS THE TUNE ─

    ⚠️ **`docs/decisions/0154-the-mix-is-authored-as-intent.md` asked 9.69× for it at `run`** — the
    largest single ask left in the whole game after `src/content/`'s six places were re-voiced, and
    `docs/decisions/0140-no-layer-is-inaudible.md` is the rule that says no multiplier rescues that.
    `margin` was **−11.1 dB**: the one layer a level's first minute has to carry a tune, eleven
    decibels under the bed it is carrying it over.

    ⚠️ **TWO DEFECTS AT ONCE, AND THE SECOND IS THE ONE A COMPARISON FINDS.** The tune is written as
    HALF notes — a strike every 0.8 s — and rang `0.86 × BEAT` under `curve: 2.2`, so it was silent
    for the back half of every note it played. And at `gain: 0.115` it was the quietest pitched voice
    in the composition: `counter`, which exists to ANSWER this line, is authored at 0.3 and `toll` at
    0.46. A melody mixed at a third of its own accompaniment is not a balance an ear would have
    chosen; nothing states it anywhere, and it is what the number was.

    ⚠️ **The envelope carries 5.4 dB and the gain 5.4, which is the split the two defects imply.**
    0152's order is envelope first, and here it genuinely only covers half: `2.1 × BEAT` at
    `curve: 1.5` is legato — each note is still ringing when the next arrives, which is what a sung
    line does and what the rests between phrases then MEAN. The remaining 5.4 dB is not a compensation
    for a short note, it is the layer being given the level its neighbours were already written at.

    ⚠️ **Out of it: `margin` −11.1 → +0.2 at `run`, and the solve asks 2.73× where it asked 9.69.**
    The octave-under sine moves with it, on `docs/decisions/0089-a-cue-has-a-body.md`'s terms — a body
    that stayed at 0.042 under a tune at 0.215 would have stopped being a body.
  */
  call: [
    {
      /*
        The tune. In A natural minor, with the G sharp deliberately absent — the raised seventh
        belongs to the E chord's own voicing (`chords`' top voice sounds it) and a melody that used it
        over the other fifteen bars would be leaning on a note the harmony is not playing.
      */
      steps: [
        0, _, 3, _, 2, _, 0, _, 3, _, 7, _, 5, _, 3, _,
        0, _, 3, _, 2, _, 0, _, 7, _, 5, _, 3, _, _, _,
        7, _, 10, _, 8, _, 7, _, 3, _, 0, _, 2, _, _, _,
        7, _, 10, _, 8, _, 12, _, 10, _, 7, _, 5, _, 3, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 2,
      // The phrase leans on its first note and lets the answer sit under it, so sixteen bars read as
      // four four-bar sentences rather than as sixty-four quarters.
      accents: [1, 0.72, 0.86, 0.66],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 2.1, gain: 0.215, attack: 0.02, curve: 1.5, lowFrom: 2600, lowTo: 1200, q: 1.1 },
    },
    {
      /*
        The octave under it, quiet, so the tune has a body rather than being one thin oscillator —
        `docs/decisions/0089-a-cue-has-a-body.md`'s argument, applied to the one layer that carries a
        melody before the boss does.
      */
      steps: [
        0, _, 3, _, 2, _, 0, _, 3, _, 7, _, 5, _, 3, _,
        0, _, 3, _, 2, _, 0, _, 7, _, 5, _, 3, _, _, _,
        7, _, 10, _, 8, _, 7, _, 3, _, 0, _, 2, _, _, _,
        7, _, 10, _, 8, _, 12, _, 10, _, 7, _, 5, _, 3, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.72, 0.86, 0.66],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.1, gain: 0.068, attack: 0.025, curve: 1.5 },
    },
  ],

  /*
    ── THE RIDE — THE FIRST CYMBAL IN THE GAME, AND THE BAND IT OPENS ──────────────────────────────

    ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** Reported from play:
    *"I think we also need a bit of cymbal percussion elements as well, it is good and listenable, but
    still very constrained along the same sound bands."*

    ⚠️ **EVERY EXISTING DRUM IN THIS FILE IS A SHORT NOISE BURST.** The hats are 15 to 40 milliseconds,
    the shaker 24, the tambourine 70 — so the top of the spectrum is a series of clicks with silence
    between them, and *constrained along the same sound bands* is an exact description of that. A ride
    is the opposite shape: struck as hard, and then it RINGS for a quarter of a second, so the band
    stays occupied instead of flickering.

    ⚠️ **It opens at `push`, which is thirty-odd seconds in** — the rung the report calls *"kicks in
    about 30-45 secs into the level"*. The pulse doubles and the ceiling opens at the same moment,
    which is what makes that arrival a section rather than another layer.
  */
  ride: [
    {
      /*
        Eighths, leaning on the beat and riding the offbeats — the pattern a ride plays behind a
        four-on-the-floor kick, so it agrees with `engine` rather than fighting it.
      */
      steps: [
        1, 0.42, 0.68, 0.4, 1, 0.44, 0.7, 0.42,
        1, 0.42, 0.68, 0.4, 1, 0.46, 0.72, 0.48,
        1, 0.42, 0.68, 0.4, 1, 0.44, 0.7, 0.42,
        1, 0.44, 0.7, 0.44, 1, 0.5, 0.78, 0.6,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      // ⚠️ A quarter of a second, where every other cymbal-ish voice here is under a tenth. The DECAY
      // is the whole point: it is what puts continuous energy above 6kHz instead of a row of ticks.
      /*
        ⚠️ **0.13 WHERE IT WAS 0.052 — the same 2.5× the report asked for, applied to the base
        composition as well as to Ember Nebula's re-voicing** —
        `docs/decisions/0140-no-layer-is-inaudible.md`. This one is **not** below the floor (−24.6 dB
        on its better measure, inside the healthy cluster), so it is a change made on the player's ear
        rather than on the guard: *"the ride needs to be 2-3x as loud as it is because otherwise it'll
        be overwhelmed."*

        ⚠️ **IT MOVES ALL SEVEN PLACES**, because six of them share this voice — which is why it is
        called out here rather than folded in quietly. Reverting it is this number and nothing else.
      */
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.26, gain: 0.13, attack: 0.0006, curve: 2.6, lowFrom: 11000, lowTo: 6500, highFrom: 5200, q: 0.7 },
    },
    {
      // The bell of the ride — a narrow band an octave under the wash, struck on the downbeat only,
      // so the pattern has a centre rather than being one continuous hiss.
      steps: [1, _, _, _, 0.7, _, _, _, 1, _, _, _, 0.74, _, _, 0.6],
      pitched: false,
      perBeat: 1,
      octave: 0,
      // ⚠️ Raised with the wash above it and by the same factor — 0140. The bell is what gives the
      // pattern a centre; lifting only the hiss would change the ride's shape, not its level.
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.19, gain: 0.09, attack: 0.0005, curve: 3.4, lowFrom: 7200, lowTo: 4200, highFrom: 3000, q: 1.6 },
    },
  ],

  /*
    ── THE CRASH — WHAT MAKES THE BOSS'S ARRIVAL AN ARRIVAL ────────────────────────────────────────

    ⚠️ **It opens at `approach`, which is eight seconds before the boss is on screen** — *"boss music
    needs to start about 5-10secs before the boss shows"*. A crash is the one drum that announces
    rather than keeps time, so it is the right sound for the one moment in a level that is an
    announcement.

    ⚠️ **Eight bars, and it is placed on the PHRASE rather than on the bar.** A crash every bar is a
    ride with a longer tail; a crash at the top of a phrase is punctuation. It sounds four times in
    twelve and a half seconds, which is rare enough to still mean something when the fight starts.
  */
  crash: [
    {
      // Eight bars at four slots each: the top of the phrase, its halfway point, and a pickup into
      // the loop. Three sounds in 12.8 seconds — punctuation, not time-keeping.
      steps: [
        1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
      ],
      pitched: false,
      perBeat: 1,
      octave: 0,
      /*
        ⚠️ **1.1 seconds, which is the longest note in the piece and is nowhere near the ceiling.**
        `tests/sound.test.ts` refuses a single note over three seconds, because that is the job the
        prewarm cannot split — a crash that rings for a bar is well inside it and is the sound a crash
        makes. Anything shorter is a hat with delusions.
      */
      note: { wave: 'noise', from: 0, to: 0, seconds: 1.1, gain: 0.058, attack: 0.001, curve: 1.5, lowFrom: 13000, lowTo: 4000, highFrom: 2600, q: 0.5 },
    },
  ],

  /*
    ── THE DREAD — THE FIRST DISSONANCE IN THE GAME ────────────────────────────────────────────────

    ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** Asked for, in the
    player's own terms: *"Dark Tonality: minor keys, diminished chords… Dissonant Intervals: tritones,
    minor seconds, and minor ninths sound aggressive and sharp. Exotic Modes: Phrygian, Locrian…"*

    ⚠️ **EVERY PITCHED NOTE IN THIS FILE UNTIL NOW HAS BEEN CONSONANT**, and that is most of why the
    boss sounded like the level with more of it. The piece is A natural minor with a raised seventh on
    the E chord and nothing else — no interval in it is uncomfortable, so no arrangement of it can
    sound like a threat.

    ⚠️ **THE FLAT SECOND IS THE WHOLE IDEA.** B flat over A is a minor second — the sharpest interval
    there is — and it is the note that makes A PHRYGIAN rather than A minor. Sounded together with the
    root and held, it is a cluster the ear cannot resolve, which is exactly what *"boss music starts
    five to ten seconds before the boss shows"* is asking a layer to say.

    ⚠️ **`inKey()` IS UNTOUCHED AND THAT IS DELIBERATE.** `src/content/cues.ts` locks the CUES to the
    natural minor and `tests/sound.test.ts` holds it — a gun that played a tritone would be a wrong
    note eight times a second. The dissonance belongs to the music, where it is a choice, and not to
    the effects, where it would be a mistake repeated for ever.
  */
  /*
    ── AND A CLUSTER THAT NEVER REACHES THE GAIN WRITTEN BESIDE IT IS NOT A CLUSTER ────────────────

    ⚠️ **0152's SECOND shape — an attack that eats the note** — and it wanted **4.32×** at `boss`
    against a `margin` of −8.9 dB. `attack: 0.5` over a note whose envelope is already `exp(-1.1u)`
    means the ramp finishes at `u = 0.3`, where the decay has taken 28% away: **this voice peaked at
    0.72 of its own gain and never once reached it**, and the octave under it at 0.78. The commit that
    named this shape found `src/content/mire.ts`'s groove *"peaking at 20-44% of the gain written
    beside it"*; this is the mild version of the same arithmetic, and it is the whole difference
    between a swell and a fade-in.

    ⚠️ **The attack is HALVED rather than removed, because the swell is the point.** 0.22 s still
    takes an eighth of the note to arrive — a cluster that snapped on would be a stab, and the layer
    exists to say *something is coming* over the twelve seconds of `approach`. What it now does is
    arrive at 0.9 of its gain instead of 0.72, and `curve: 1.1 → 0.85` holds it there for the bar
    rather than letting it sag under the boss kit that arrives on top of it.

    ⚠️ **`margin` −8.9 → −5.2 at `boss` and the solve asks 2.83× where it asked 4.32.** The gain
    carries 1.8 dB of that and the envelope 1.9; both voices move together, because the octave-under
    is what keeps the minor second out of the mud (see below) and it cannot be left behind.
  */
  dread: [
    {
      // Root and flat second, held together. Bar four drops to the tritone, which is the other
      // interval the brief names and the one that has meant *danger* for about six hundred years.
      steps: [0, 1, 0, 6],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.92, 0.96, 1],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.105, attack: 0.22, curve: 0.85, lowFrom: 420, lowTo: 900, q: 2.2 },
    },
    {
      // The octave under the root only — the flat second is left in the mid, where a minor second is
      // sharp. Down here it would be mud rather than menace.
      steps: [0, 0, 0, 6],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.145, attack: 0.2, curve: 0.85 },
    },
  ],

  /*
    ── THE FRENZY — A DRIVING OSTINATO THAT NEVER LANDS IN THE SAME PLACE TWICE ────────────────────

    ⚠️ **Asked for: *"Driving Ostinatos: repeating, relentless rhythmic patterns create forward
    momentum"* and *"Irregular Meters: meters like 7/8 or 9/8 add instability and a frantic edge"*.**

    ⚠️ **THE METER CANNOT CHANGE AND THE FEELING OF IT CAN.**
    `docs/decisions/0093-the-gun-is-on-the-grid.md` fixes a beat at 24 sim steps and the gun, every
    enemy cadence and 0094's phase-lock all ride it — a bar of 7/8 would take the whole game off the
    grid three decisions exist to put it on. **A SEVEN-SIXTEENTH CELL over a sixteen-sixteenth bar
    costs none of that**: the pattern is straight 4/4 to the machine and rotates through seven
    different positions in the bar to the ear, which is what an odd meter actually feels like.

    ⚠️ **Driven rather than counted: it realigns after seven bars**, so across this layer's eight it
    lands the same way exactly once. Nothing in the game moves; the accent does.

    ⚠️ **Phrygian and the tritone again — root, flat second, tritone, root.** The brief's three
    ingredients in one repeating cell, at sixteenth speed, which is also the *"double speed"* the
    report asks the fight for: `stomp` doubles the drums and this doubles the note rate over them.

    ── AND THE OCTAVE-UNDER IS THE ONLY VOICE THAT COULD BE LENGTHENED, WHICH A GUARD DECIDED ──────

    ⚠️ **0154 asked 4.45× at `boss`, `margin` −10.2 dB** — the worst of the fight's three new layers,
    and the ostinato the arrangement is built on. The obvious fix is the top voice: `0.22 × BEAT` at
    `curve: 5.5` is 64 ms of a 100 ms sixteenth, and lengthening it is 0152's first shape exactly.

    ⚠️ **IT IS ALSO WHAT `tests/music.test.ts`'s PAN GUARD REFUSES, AND THE REFUSAL IS A MEASUREMENT
    RATHER THAN A TASTE.** *A layer whose weight is low is centred* — 0118 — and this layer sits at
    +0.45. Its top voice is at `octave: 1`, so its root is **110 Hz**, which lands almost exactly on
    one of `bandEnergy`'s `low` probes; sustaining it is sustaining a tone in the band the guard
    measures. Driven: `0.28 × BEAT` takes the share below 130 Hz from 36% to **44%**, `0.3 × BEAT` to
    47%, `0.38 × BEAT` to 54%, against a ceiling of 40%. There is no length of that voice that buys
    the margin without making this a panned bass.

    ⚠️ **SO THE LENGTH GOES INTO THE VOICE AN OCTAVE DOWN, WHICH IS THE OPPOSITE OF WHAT THAT READS
    LIKE.** The lower voice is a saw at 55 Hz behind a lowpass, so what a longer note adds is its
    HARMONIC series — 110, 165, 220 — spread across `lowmid` and `mid` rather than piled onto one
    probe. Measured, `0.55 × BEAT` at `curve: 2.2` takes the layer up 5.6 dB and the share below
    130 Hz **down** to 36.8%. `lowTo` rises 420 → 700 with the length, on the reason
    `src/content/core.ts` states: a note that rings longer spends longer at the dark end of its own
    sweep, and this one is the fight's bass line rather than its shadow.

    ⚠️ **`margin` −10.2 → −5.8 and the solve asks 2.88× where it asked 4.45.** The top voice is
    untouched — every number on it is the one that shipped.
  */
  frenzy: [
    {
      steps: [
        0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _,
        1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0,
        _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6,
        0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0,
        _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1,
        0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _,
        6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0,
        0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _,
      ],
      pitched: true,
      perBeat: 4,
      octave: 1,
      // ⚠️ Four accents against a seven-note cell, so the WEIGHT rotates too and at a different rate
      // from the notes. Heavy syncopation, per the brief, without a displaced accent being authored.
      accents: [1, 0.58, 0.82, 0.6],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.085, attack: 0.002, curve: 5.5, lowFrom: 2600, lowTo: 900, q: 2, drive: 0.5 },
    },
    {
      // The same cell an octave down, which is what makes the ostinato a BASS rather than a texture —
      // the fight needs something moving under it and the level's own bass line has stopped.
      steps: [
        0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _,
        1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0,
        _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6,
        0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0,
        _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1,
        0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _,
        6, 0, 0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0,
        0, _, 1, 0, _, 6, 0, 0, _, 1, 0, _, 6, 0, 0, _,
      ],
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: [1, 0.6, 0.84, 0.62],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.55, gain: 0.112, attack: 0.003, curve: 2.2, lowFrom: 1800, lowTo: 700, q: 1.6, drive: 0.45 },
    },
  ],

  /*
    ── THE WRAITH — THE LEVEL'S OWN TUNE, COME BACK WRONG ──────────────────────────────────────────

    ⚠️ **Asked for: *"Leitmotifs: weaving in a distorted version of the boss's theme creates narrative
    payoff."*** This is that, pointed the way round this game can actually pay off: the player has
    spent two minutes with `call`, and the report says of it *"the tune kickin around 52 secs is
    great"*. It is the only melody they have had time to learn.

    ⚠️ **IT IS `call`'s CONTOUR, NOTE FOR NOTE, WITH ITS SECOND FLATTENED.** Three notes move — every
    B becomes a B flat — and that is the whole edit: the same tune in A PHRYGIAN instead of A minor,
    which is the mode `dread` and `frenzy` already put underneath it. Recognisable and wrong, which is
    what a distorted leitmotif is.

    ⚠️ **A square through a hard drive rather than the triangle `call` sings through.** The pitch
    change carries the harmony and the timbre carries the corruption; either alone reads as a
    different layer rather than as the same one damaged.

    ⚠️ **It opens at `bossPeak` and nowhere else.** A leitmotif that plays through the whole fight is
    a layer; one that arrives when the boss is half dead is a payoff.
  */
  wraith: [
    {
      steps: [
        0, _, 3, _, 1, _, 0, _, 3, _, 7, _, 5, _, 3, _,
        0, _, 3, _, 1, _, 0, _, 7, _, 5, _, 3, _, _, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.7, 0.88, 0.64],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.8, gain: 0.075, attack: 0.004, curve: 2.6, lowFrom: 2200, lowTo: 900, q: 2.4, drive: 0.75 },
    },
    {
      // The octave under it, saw and driven — the body that makes it a shout rather than a whistle.
      steps: [
        0, _, 3, _, 1, _, 0, _, 3, _, 7, _, 5, _, 3, _,
        0, _, 3, _, 1, _, 0, _, 7, _, 5, _, 3, _, _, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.7, 0.88, 0.64],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.84, gain: 0.055, attack: 0.006, curve: 2.4, lowFrom: 1500, lowTo: 620, q: 1.8, drive: 0.6 },
    },
  ],

  /*
    ── THE COUNTER — A SECOND MELODY THAT ANSWERS THE FIRST ────────────────────────────────────────

    ⚠️ **`docs/decisions/0114-the-fight-is-a-different-piece.md`.** Reported: *"the music that kicks
    in at 1.32 needs to kick in around 42 secs and then we need a different additional accompaniment
    kicking in around 1.32 on top of the current change in music."* Two asks in one sentence: move
    what arrives, and then put something NEW where it used to be. The first is where `push` opens —
    a level's own, since `docs/decisions/0158-a-level-says-where-its-sections-open.md`; this is the
    second.

    ⚠️ **A COUNTER-MELODY AND NOT A THICKER `call`.** *"Additional accompaniment"* is a part, not a
    gain — so this is a line with its own shape that fits in `call`'s gaps. `call` states a phrase and
    rests for a bar and a half; this answers into exactly that rest, which is what makes two melodies
    a conversation rather than a crowd.

    ⚠️ **In THIRDS above the root, which is the interval that reads as harmony rather than as a second
    tune.** A counter-line at the octave doubles; at the fifth it thickens; at the third it is heard
    as an accompaniment, which is the word the report used.

    ⚠️ **Sixteen bars, so it turns with the progression's B-section** — `LAYER_BARS`' whole-multiple
    rule, and the reason a four-bar answer would be a wrong note for half of every phrase.

    ── AND AN ANSWER THAT STOPS BEFORE THE QUESTION HAS FINISHED IS NOT AN ANSWER ──────────────────

    ⚠️ **0154's solve asked 5.87× at `surge`, `margin` −5.8 dB** — the rung this layer arrives at, and
    the one `docs/decisions/0120-a-rung-may-close-a-layer.md` built around it: `surge` shuts `call`
    and opens this in the same breath, so *the ear is handed a different tune rather than another one
    on top*. A replacement six decibels under the thing it replaced is a thinner arrangement, which is
    the report 0120 exists to answer arriving through the material instead of through the table.

    ⚠️ **`0.92 × BEAT` at `curve: 2` is a quarter note that is over before the beat is.** The line is
    written in quarters with long rests — `call`'s rests, which is the whole idea — so every note had
    a hole behind it as well as in front. At `1.8 × BEAT` under `curve: 1.5` the notes join, and a
    line that joins is what *accompaniment* means; the rests between PHRASES are still there, and they
    are the ones doing the work.

    ⚠️ **Envelope 4.0 dB, gain 2.0** — 0.3 → 0.38 against `call`'s new 0.215, so the two melodies keep
    the relationship the pattern was written for. Out of it: `margin` −5.8 → +0.5 and the solve asks
    3.03× where it asked 5.87.
  */
  counter: [
    {
      /*
        The answer. It enters where `call` rests — the third and fourth beat of each bar — and holds
        back on the bars where `call` is still singing.
      */
      steps: [
        _, _, _, 7, _, _, 5, _, _, _, _, 3, _, _, 2, _,
        _, _, _, 7, _, _, 5, _, _, 3, _, 2, _, 0, _, _,
        _, _, _, 12, _, _, 10, _, _, _, _, 7, _, _, 5, _,
        _, _, _, 10, _, _, 8, _, _, 7, _, 5, _, 3, _, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [0.86, 0.62, 1, 0.7],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.38, attack: 0.03, curve: 1.5, lowFrom: 1900, lowTo: 850, q: 1.2 },
    },
    {
      // A third above it, quiet — two notes make the line an accompaniment rather than a melody
      // competing with `call` for the same job.
      steps: [
        _, _, _, 10, _, _, 8, _, _, _, _, 7, _, _, 5, _,
        _, _, _, 10, _, _, 8, _, _, 7, _, 5, _, 3, _, _,
        _, _, _, 15, _, _, 14, _, _, _, _, 10, _, _, 8, _,
        _, _, _, 14, _, _, 12, _, _, 10, _, 8, _, 7, _, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [0.86, 0.62, 1, 0.7],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.7, gain: 0.064, attack: 0.035, curve: 1.5 },
    },
  ],

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
        -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2,
        0, _, 0, 0, 0, _, 0, 0, 0, _, 0, 0, 0, _, 0, 0,
        -4, _, -4, -4, -4, _, -4, -4, -4, _, -4, -4, -4, _, -4, -4,
        -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2,
        -5, _, -5, -5, -5, _, -5, -5, -5, _, -5, -5, -5, _, -5, -5,
        3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3,
        -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2,
        0, _, 0, 0, 0, _, 0, 0, 0, _, 0, 0, 0, _, 0, 0,
        -4, _, -4, -4, -4, _, -4, -4, -4, _, -4, -4, -4, _, -4, -4,
        3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3,
        -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2, -2, _, -2, -2,
        -4, _, -4, -4, -4, _, -4, -4, -4, _, -4, -4, -4, _, -4, -4,
        -5, _, -5, -5, -5, _, -5, -5, -5, _, -5, -5, -5, _, -5, -5,
      ],
      pitched: true,
      perBeat: 4,
      // The gallop's own shape: the eighth is the loud one and the two sixteenths lean on it. The
      // second entry is never struck — the pattern rests there — and is written out so the cycle
      // reads as a beat rather than as three numbers.
      accents: [1, 1, 0.76, 0.82],
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.55, gain: 0.16, attack: 0.002, curve: 2.0, lowFrom: 2600, lowTo: 780, q: 1.7, drive: 0.7 },
    },
    {
      // The fifth over it. Two notes and no third is a power chord; adding the third is what would
      // make it wrong over three of the four bars.
      steps: [
        7, _, 7, 7, 7, _, 7, 7, 7, _, 7, 7, 7, _, 7, 7,
        3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3,
        10, _, 10, 10, 10, _, 10, 10, 10, _, 10, 10, 10, _, 10, 10,
        5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5,
        7, _, 7, 7, 7, _, 7, 7, 7, _, 7, 7, 7, _, 7, 7,
        3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3,
        5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5,
        2, _, 2, 2, 2, _, 2, 2, 2, _, 2, 2, 2, _, 2, 2,
        10, _, 10, 10, 10, _, 10, 10, 10, _, 10, 10, 10, _, 10, 10,
        5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5,
        7, _, 7, 7, 7, _, 7, 7, 7, _, 7, 7, 7, _, 7, 7,
        3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3,
        10, _, 10, 10, 10, _, 10, 10, 10, _, 10, 10, 10, _, 10, 10,
        5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5, 5, _, 5, 5,
        3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3, 3, _, 3, 3,
        2, _, 2, 2, 2, _, 2, 2, 2, _, 2, 2, 2, _, 2, 2,
      ],
      pitched: true,
      perBeat: 4,
      accents: [1, 1, 0.76, 0.82],
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.5, gain: 0.115, attack: 0.002, curve: 2.2, lowFrom: 2400, lowTo: 860, q: 1.6, drive: 0.6 },
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
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.22, gain: 0.1, attack: 0.002, curve: 5, lowFrom: 4200, lowTo: 1200, q: 2, drive: 0.3 },
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

    ⚠️ **A bell and not a riser, because a riser has a length and this has a distance.** The approach
    runs from wherever the level's script opens it to wherever its boss is
    (`docs/decisions/0158-a-level-says-where-its-sections-open.md`), both in world units, and a
    player who backs off spends longer in it — so anything shaped like a one-shot sweep would finish
    early and leave silence where the tension was. A figure that repeats can be in the approach for
    as long as the approach lasts, **which is now a length each level chooses.**
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
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.8, gain: 0.46, attack: 0.015, curve: 1.5, lowFrom: 1400, lowTo: 420, q: 1.7 },
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
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.075, attack: 0.5, curve: 1.3, lowFrom: 900, lowTo: 2200, q: 1.4 },
    },
    {
      // The same, four cents apart. Two saws slightly detuned is what makes a held note a section
      // rather than an organ — the trick the drone and the chords both already rest on.
      steps: [0, _, 3, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.07, attack: 0.55, curve: 1.3, lowFrom: 890, lowTo: 2160, q: 1.4 },
    },
    {
      // A breath of filtered noise swelling into each strike. It is what an approach sounds like when
      // nothing has arrived yet, and it crosses the loop end so the swell never restarts from nothing.
      steps: [_, 0.9, _, 1],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.1, attack: 1.1, curve: 1.3, lowFrom: 700, lowTo: 3200, highFrom: 280, q: 0.8 },
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
      /*
        SIXTEENTH HATS, and they exist at the fight and nowhere else. A double-time section is carried
        by what is on every sixteenth rather than by the kick that doubled — `engine`'s hats are on the
        beat and the offbeat, so this is the first thing in the piece with no gap in it at the top.
      */
      steps: Array.from({ length: 32 }, (_unused, i) => (i % 4 === 0 ? 1 : i % 2 === 0 ? 0.6 : 0.42)),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.022, gain: 0.062, attack: 0.0004, curve: 8, lowFrom: 13500, highFrom: 7000 },
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
