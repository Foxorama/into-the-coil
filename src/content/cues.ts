/**
 * The cues: what the game SOUNDS like, one row per event the model resolves.
 *
 * `docs/decisions/0072-a-cue-is-baked-and-played.md`.
 *
 * ── WHY THIS IS A TABLE AND NOT A PILE OF PLAY CALLS ────────────────────────────────────────────
 *
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` put *"no information by audio alone"*
 * in the unconditional tier — the tier that cannot be switched off — and named its own landing
 * condition: *"the cue table does not exist, so the twin can be a required field on the row."* This
 * is that table, and `twin` is that field. A cue cannot be written without naming the picture the
 * player sees for the same event, and the union it is drawn from is closed, so a cue cannot claim a
 * picture that is not on the list.
 *
 * ⚠️ **What the field proves and what it does not.** It proves a cue names a picture from a curated
 * list and that no cue is the only channel by accident. It does NOT prove the picture is drawn — no
 * type can reach across to a blit. `tests/sound.test.ts` holds the half that is checkable: every cue
 * has a twin, and every twin is claimed. The other half is
 * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`'s job, and it is
 * already guarded per event by the suites that own those events.
 *
 * ── AND WHY IT IS `content/` ────────────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`: kinds in a closed union, the row carries what the
 * kind is. Adding a sound is one row here — no arm in a switch, no branch in the shell.
 *
 * ⚠️ **Rows ONLY, and the synthesiser is next door in `src/app/sound.ts`.** 0015 measured the
 * predecessor and found that *"the two hot [content] files held logic as well as rows, which is the
 * actual rule"* — a table that also computes is a table that gets edited for two unrelated reasons.
 * What is here is six numbers per cue; what turns them into samples is not.
 *
 * ⚠️ **The setting that turns all of this off is NOT here** — it is `src/content/sound.ts`, and the
 * split is what makes the ban checkable. `src/app/frame.ts` names cues, so it must be able to import
 * this file; it must never be able to see whether the player has sound switched on, because a step
 * that can read a comfort setting is a comfort setting that can change the outcome (0024).
 */

/**
 * Every cue, in bake order. Closed.
 *
 * ⚠️ **The order is the bake order and nothing else reads it as meaning** — the same relationship
 * `src/content/sprites.ts` has with the atlas, and it is stated here because that file records what
 * three hand-maintained descriptions of one order cost the last time.
 */
export const CUE_KINDS = [
  'pulse',
  'missile',
  'threat',
  'hit',
  'kill',
  'bossDown',
  'bomb',
  'blast',
  'shield',
  'death',
  'pickup',
  'chime',
] as const;

/** Derived from the list, so a cue cannot exist in the union and be missing from the table. */
export type CueKind = (typeof CUE_KINDS)[number];

/**
 * Every picture a cue is allowed to be the twin of. Closed, and that is the whole of its value.
 *
 * ⚠️ **A closed union rather than a string, so the compiler asks the question 0024 wanted asked.**
 * A free-text field would let a cue be documented as having a twin it does not have, which is the
 * failure mode of every accessibility promise enforced by prose. Each member below is a picture that
 * exists today, and the file that draws it is named.
 */
export const TWIN_KINDS = [
  /** A pulse leaves the muzzle — `fireShip` in `src/app/frame.ts`. */
  'shot-appears',
  /** A missile leaves a launcher, popping out before it straightens — 0051. */
  'missile-appears',
  /** An enemy's shot appears on the field — `fireEnemies`. */
  'threat-appears',
  /** A body flashes its hit sprite for `IMPACT_FLASH_STEPS` — 0035. */
  'impact-flash',
  /** A dead enemy scatters `BURST.enemy` fragments where it died — 0036. */
  'debris-burst',
  /** The boss comes apart over `BOSS_DEATH_STEPS`, in pulses — 0062. */
  'boss-burst',
  /** A thrown bomb is on the field, counting down its fuse — 0053. */
  'bomb-appears',
  /** The blast ring, which outlives its own damage by `BLAST_STEPS` — 0053. */
  'blast-ring',
  /** A mark leaves the shell and a pip leaves the readout — 0050, 0045. */
  'shell-mark',
  /** The ship scatters `BURST.ship` fragments, and its upgrades with them — 0036, 0066. */
  'ship-burst',
  /** The pickup leaves the field and the readout moves — 0052. */
  'pickup-taken',
  /** The chosen option fills, in ink rather than in opacity — 0070. */
  'chooser-fill',
] as const;

/**
 * ⚠️ **A LIST the union is derived from, rather than a union written out.** The guard that matters
 * here is *no twin is claimed by nothing* — a picture named in this file and drawn nowhere is the
 * accessibility promise going stale quietly — and a bare union cannot be walked at runtime, so
 * nothing could ever have checked it. `src/content/sprites.ts` records what the same shape cost when
 * it was three hand-kept descriptions of one order.
 */
export type TwinKind = (typeof TWIN_KINDS)[number];

/**
 * How a layer's waveform is shaped.
 *
 * ⚠️ **Five, and the small set used to be the whole coherence argument.** *Every sound in the game is
 * recognisably from the same machine — a synthesiser with one more knob produces twelve unrelated
 * noises* was this file's reasoning for four waves, and
 * `docs/decisions/0089-a-cue-has-a-body.md` amends it: the coherence now comes from every cue being
 * built out of **one recipe and one filter character**, which is a stronger source of it than a
 * shortage of oscillators. A poor palette makes everything sound alike by making everything sound
 * cheap.
 */
export type WaveKind =
  /** A pure tone. The only one that reads as friendly, and what every boom is made of. */
  | 'sine'
  /** Softer than a square and brighter than a sine. Bells and the ones that have to be pleasant. */
  | 'tri'
  /** The hollow one. Shots and warnings. */
  | 'square'
  /** The buzzy one, with the most harmonics. Weight. */
  | 'saw'
  /** Noise. `from` is the sample-and-hold rate, and **zero is white** — see `CueLayer`. */
  | 'noise';

/**
 * One layer of a cue.
 *
 * ── A CUE USED TO BE ONE OSCILLATOR, WHICH IS WHY IT SOUNDED LIKE ONE ───────────────────────────
 *
 * `docs/decisions/0089-a-cue-has-a-body.md`. Reported from play: *"I don't like them at all — too
 * tinny, way too Atari 2600, not in a fun pixel sound way."*
 *
 * ⚠️ **That was an accurate description of the model rather than of the tuning.** A row was one wave,
 * one exponential sweep and one shared envelope, which is exactly a TIA voice — so no arrangement of
 * its six numbers could have produced a sound that was not one.
 *
 * ⚠️ **What a layer adds is the three things a body is made of**: its own envelope, so a click and a
 * tail can be one sound; a **lowpass**, which is where a boom comes from, because unfiltered noise is
 * a hiss; and a **highpass**, which is what takes out the box. The report's *"tin shed heard from
 * outside"* is a spectrum with a hump in the middle and nothing at either end, and those are the two
 * filters that fix each end.
 */
export interface CueLayer {
  wave: WaveKind;
  /**
   * The rate the waveform advances at when the layer starts, in Hz.
   *
   * ⚠️ **A RATE rather than a pitch, so one pair of numbers means the same thing for all four
   * waves.** For the tones it is the pitch. For `noise` it is the sample-and-hold rate — what a
   * chiptune noise channel's period was — and **zero means white**, which is the one this project
   * now uses for everything that explodes.
   */
  from: number;
  /** The rate it has reached by the end, in Hz. Equal to `from` for a layer that does not sweep. */
  to: number;
  /** How long this layer lasts, in seconds. */
  seconds: number;
  /**
   * How long after the cue starts this layer does, in seconds.
   *
   * ⚠️ **A second rumble arriving fifty milliseconds late is the difference between an explosion and
   * a noise.** It is the only field here that is about arrangement rather than about timbre.
   */
  at?: number;
  /** Peak amplitude of this layer before the row's own gain. */
  gain: number;
  /** Seconds to reach full amplitude. Short enough to read as an attack; defaulted in `sound.ts`. */
  attack?: number;
  /**
   * How many time constants of exponential decay this layer spends over its length.
   *
   * Low is a long tail and high is a click, so this is the field that makes a four-millisecond crack
   * and a one-and-a-half-second rumble the same mechanism.
   */
  curve?: number;
  /**
   * Lowpass cutoff sweep, in Hz. **The most important pair in the file.**
   *
   * A falling cutoff over noise IS an explosion; the same noise unfiltered is a hiss. Omitted leaves
   * the layer unfiltered.
   */
  lowFrom?: number;
  lowTo?: number;
  /**
   * Highpass cutoff sweep, in Hz — where the BOX goes.
   *
   * 130–300 Hz is the band that reads as *inside a tin shed*; every noise body in the table is
   * high-passed above it and opens downward as it decays.
   */
  highFrom?: number;
  highTo?: number;
  /** Lowpass resonance. Past about 2 it stops being a filter and starts being a pitch. */
  q?: number;
  /** Soft saturation, `[0, 1]`. What *meaty* is made of — harmonics from squashing, not from notes. */
  drive?: number;
}

/**
 * What a cue is.
 *
 * ⚠️ **The envelope is per LAYER and the row has none**, which is the reverse of what this file used
 * to say. The old argument — *a per-cue envelope is four more numbers and buys a sound that is still
 * going when the next one arrives* — was right about the risk and wrong about the cause: what makes a
 * cue punctuation is `MAX_CUE_SECONDS` and the `hold`, both of which are still here.
 */
export interface CueRow {
  /**
   * The picture the player sees for the same event. Required — 0024's unconditional tier.
   *
   * ⚠️ **It is not decoration and it is not a comment.** A cue with no twin is information delivered
   * by sound alone, which is the one channel 0024 bans outright: *"audio stays loud and additive — it
   * is the ONLY channel that is banned, not the sound."*
   */
  twin: TwinKind;
  /**
   * What the cue is made of, summed. One to six of them.
   *
   * ⚠️ **The recipe for anything that explodes is four**: a CRACK of a few milliseconds so it starts
   * rather than fades in, a BODY of noise between a highpass and a falling lowpass, a quieter and
   * longer DEBRIS tail carrying the top, and a BOOM sweeping down into the floor. The old table only
   * ever had the body, unfiltered, which is the whole of what was wrong with it.
   */
  layers: readonly CueLayer[];
  /** Peak amplitude of the whole cue before the master gain, in `[0, 1]`. */
  gain: number;
  /**
   * Saturation applied to the SUM of the layers, so they glue rather than merely add.
   *
   * ⚠️ **Gentle, and the first draft was not.** A `tanh` over a sum dominated by a boom ducks the
   * transients along with it, which is the other half of *muffled* — the top was being squashed by
   * the bottom rather than being absent.
   */
  glue: number;
  /**
   * The fewest fixed steps between two soundings of this cue.
   *
   * ── WHY THIS IS ON THE ROW AND NOT ONE GLOBAL NUMBER ────────────────────────────────────────────
   *
   * ⚠️ **The failure it exists for is a flam, not a budget.** Two kills on consecutive steps are two
   * identical sounds 17ms apart, which is not heard as two events — it is heard as one event with a
   * smeared attack, and at four it is heard as a fault. Per-step de-duplication cannot fix it,
   * because the second kill is genuinely on the next step.
   *
   * ⚠️ **It differs per cue because the events differ.** A pulse fires every few steps by design and
   * wants a short hold; a boss dying happens once a level and wants a long one, so that nothing can
   * retrigger the loudest sound in the game underneath itself.
   *
   * ⚠️ **In STEPS, like every other duration in this project** —
   * `docs/decisions/0022-frame-rate-is-a-feature.md` fixes the step at 60Hz, so a hold counted here
   * is the same hold on every device and in a headless test. `seconds` above is the one field in
   * wall-clock, because a waveform is sampled in real time and cannot be anything else.
   */
  hold: number;
}

/**
 * The longest a cue may be, in seconds.
 *
 * ⚠️ **1.5 → 2, because the boss coming apart now takes 1.75** —
 * `docs/decisions/0089-a-cue-has-a-body.md`. The ceiling is doing the same job at the new number: it
 * is the one thing that stops a layered cue growing a tail nothing can hear the end of, and eleven of
 * the twelve are still well under a second.
 *
 * ⚠️ **A cue is punctuation, and past about a second it stops being one.** It is also the audible
 * form of `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`: a sound still playing when
 * the next three arrive is the audio equivalent of a frame that did not finish, and the ceiling is
 * what makes the total baked size a number `tests/sound.test.ts` can assert rather than a hope.
 */
export const MAX_CUE_SECONDS = 2;

/**
 * ⚠️ **EVERY GAIN IS WELL UNDER 1 AND THAT IS THE POINT.** Up to `MAX_VOICES` cues can sound on one
 * step (`src/app/sound.ts`), and digital audio clips hard rather than compressing — so the row's gain
 * is its share of the mix and not its loudness. The master gain is the other half.
 *
 * ⚠️ **The player's own weapons are QUIETER than what is trying to kill them**, which is the opposite
 * of the obvious arrangement and is the right one: auto-fire never stops (`src/content/actions.ts`
 * bans a fire action), so it is the one sound the player hears continuously, and a continuous sound
 * mixed loud is the one that has to be turned off.
 */
export const CUES: Record<CueKind, CueRow> = {
  /**
   * The base weapon. The most frequent sound in the game by a wide margin.
   *
   * ⚠️ **One cue per VOLLEY, not per barrel.** A fully upgraded weapon is five barrels on one step
   * (`src/content/pickups.ts`), and five identical clicks at the same instant is not five times as
   * loud, it is a different and worse sound. `src/app/frame.ts` fires this once outside the barrel
   * loop.
   */
  pulse: {
    twin: 'shot-appears',
    hold: 2,
    gain: 0.3,
    glue: 0.3,
    layers: [
      // The click. It keeps its top: everything else in the table gained air, and a pulse that did
      // not would be the one dull sound in a game the player hears this from ten times a second.
      { wave: 'noise', from: 0, to: 0, seconds: 0.012, gain: 0.55, attack: 0.0005, curve: 9, highFrom: 900, lowFrom: 11000, lowTo: 4000 },
      // The chunk. A saturated square behind a falling filter is where *meaty* lives.
      { wave: 'square', from: 190, to: 78, seconds: 0.075, gain: 0.85, attack: 0.001, curve: 6, lowFrom: 1700, lowTo: 320, q: 1.1, drive: 0.55 },
      { wave: 'sine', from: 130, to: 52, seconds: 0.09, gain: 0.7, attack: 0.001, curve: 5 },
    ],
  },
  /**
   * The second auto-weapon — 0051.
   *
   * Lower and longer than the pulse, because that is what the picture says too: a missile is the
   * heavier stream and the one the player is meant to be able to pick out of a screen full of the
   * lighter one.
   */
  missile: {
    twin: 'missile-appears',
    hold: 3,
    gain: 0.3,
    glue: 0.08,
    layers: [
      // The motor lighting.
      { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.5, attack: 0.0006, curve: 7, lowFrom: 7000, lowTo: 3000, highFrom: 1100 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.26, gain: 0.6, attack: 0.004, curve: 3.2, lowFrom: 2400, lowTo: 600, highFrom: 130, highTo: 60, q: 0.7 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.34, gain: 0.09, attack: 0.02, curve: 2.6, lowFrom: 9000, highFrom: 1500, highTo: 900 },
      // The launch, at a pitch a speaker can actually reproduce — see 0089 on why 30 Hz is not it.
      { wave: 'sine', from: 210, to: 68, seconds: 0.3, gain: 1, attack: 0.001, curve: 3 },
      // And the octave under it, for the systems that can.
      { wave: 'sine', from: 105, to: 34, seconds: 0.34, gain: 0.6, attack: 0.004, curve: 2.5 },
    ],
  },
  /**
   * Something shot at the player.
   *
   * ⚠️ **Quiet, and it is the cue most likely to be wrong.** At 0022's worst case there are 150 enemy
   * bullets on screen; even rate-limited by `hold`, this is the sound that decides whether a busy
   * screen is exciting or exhausting. It is a play-test number on
   * `docs/decisions/0037-the-ship-has-mass.md`'s terms and nothing asserts it.
   */
  threat: {
    twin: 'threat-appears',
    hold: 4,
    gain: 0.204,
    glue: 0.1,
    layers: [
      // The filter chases the sweep, and the resonance is what makes it zap rather than fall.
      { wave: 'saw', from: 1500, to: 260, seconds: 0.1, gain: 0.7, attack: 0.001, curve: 5, lowFrom: 3200, lowTo: 500, q: 2.6 },
      { wave: 'sine', from: 900, to: 180, seconds: 0.09, gain: 0.35, attack: 0.001, curve: 5 },
    ],
  },
  /**
   * A body took damage and lived.
   *
   * ⚠️ **This is the sound `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`
   * is about, arriving in the other channel.** Three play reports in a row said *"I thought it was a
   * bug that bullets hit an enemy and the enemy didn't get destroyed"*; the answer then was the impact
   * flash, which is this cue's twin. Short and dry, so it can happen often.
   */
  hit: {
    twin: 'impact-flash',
    hold: 2,
    gain: 0.252,
    glue: 0.08,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.035, gain: 0.5, attack: 0.0004, curve: 8, lowFrom: 7000, lowTo: 3000, highFrom: 1100 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.06, gain: 0.5, attack: 0.001, curve: 7, lowFrom: 2200, lowTo: 800, highFrom: 260, q: 0.8 },
      { wave: 'sine', from: 240, to: 95, seconds: 0.07, gain: 0.55, attack: 0.001, curve: 6 },
    ],
  },
  /** An enemy died. The debris burst is the picture; this is the same event arriving at the ear. */
  kill: {
    twin: 'debris-burst',
    hold: 2,
    gain: 0.33,
    glue: 0.1,
    layers: [
      // CRACK — a few milliseconds, so it starts rather than fades in.
      { wave: 'noise', from: 0, to: 0, seconds: 0.025, gain: 0.3, attack: 0.0004, curve: 8, lowFrom: 5500, lowTo: 2200, highFrom: 700 },
      // BODY — noise between a highpass that takes out the box and a lowpass that falls.
      { wave: 'noise', from: 0, to: 0, seconds: 0.34, gain: 0.95, attack: 0.003, curve: 3.2, lowFrom: 2100, lowTo: 420, highFrom: 110, highTo: 45, q: 0.7, drive: 0.3 },
      // DEBRIS — quieter, longer, and the part that carries the top. It was missing entirely.
      { wave: 'noise', from: 0, to: 0, seconds: 0.42, gain: 0.055, attack: 0.02, curve: 2.4, lowFrom: 6500, highFrom: 1300, highTo: 700 },
      { wave: 'sine', from: 190, to: 62, seconds: 0.4, gain: 1.25, attack: 0.001, curve: 2.6, drive: 0.25 },
      { wave: 'sine', from: 95, to: 31, seconds: 0.46, gain: 0.7, attack: 0.002, curve: 2.2 },
    ],
  },
  /**
   * The boss came apart — 0062.
   *
   * ⚠️ **The longest and loudest cue in the game, and both are deliberate.** *"Bosses need a real
   * explosion and an end-of-level beat"* is what 0062 landed for, and the beat it added
   * (`BOSS_DEATH_STEPS`, 96 steps) is 1.6 seconds of the level carrying on while the boss comes apart.
   * This is sized to fill it and its `hold` is long enough that nothing can retrigger it inside it.
   */
  bossDown: {
    twin: 'boss-burst',
    hold: 30,
    gain: 0.468,
    glue: 0.14,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.32, attack: 0.0005, curve: 6, lowFrom: 6000, lowTo: 1900, highFrom: 600 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.5, gain: 1.1, attack: 0.006, curve: 2.1, lowFrom: 1900, lowTo: 330, highFrom: 95, highTo: 38, q: 0.7, drive: 0.4 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.7, gain: 0.07, attack: 0.03, curve: 1.9, lowFrom: 6000, highFrom: 1200, highTo: 620 },
      { wave: 'sine', from: 165, to: 52, seconds: 1.6, gain: 1.3, attack: 0.002, curve: 1.7, drive: 0.3 },
      { wave: 'sine', from: 82, to: 26, seconds: 1.75, gain: 0.85, attack: 0.02, curve: 1.4 },
      // The second rumble, arriving late. A boss coming apart is two events, not one.
      { wave: 'noise', from: 0, to: 0, seconds: 1.1, at: 0.22, gain: 0.4, attack: 0.02, curve: 2, lowFrom: 1500, lowTo: 320, highFrom: 300, highTo: 110 },
    ],
  },
  /** A bomb was thrown. Rising, because the thing it turns into has not happened yet — 0053. */
  bomb: {
    twin: 'bomb-appears',
    hold: 6,
    gain: 0.276,
    glue: 0.08,
    layers: [
      { wave: 'sine', from: 150, to: 620, seconds: 0.2, gain: 0.75, attack: 0.004, curve: 3.5 },
      { wave: 'saw', from: 75, to: 310, seconds: 0.2, gain: 0.3, attack: 0.004, curve: 3.5, lowFrom: 1400, lowTo: 5000, highFrom: 120, drive: 0.25 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.2, gain: 0.22, attack: 0.01, curve: 3, lowFrom: 10000, highFrom: 1100, highTo: 3200 },
      { wave: 'sine', from: 75, to: 155, seconds: 0.22, gain: 0.42, attack: 0.006, curve: 3 },
    ],
  },
  /**
   * The bomb went off.
   *
   * ⚠️ **The damage lands on ONE step and this lasts a good deal longer, exactly like the ring.**
   * `src/app/frame.ts` keeps `BLAST_STEPS` of picture after a blast has spent itself, for the same
   * reason: the player learns where the edge was from what is left behind, not from the instant.
   */
  blast: {
    twin: 'blast-ring',
    hold: 6,
    gain: 0.432,
    glue: 0.14,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.035, gain: 0.33, attack: 0.0004, curve: 7, lowFrom: 5800, lowTo: 2100, highFrom: 650 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.8, gain: 1.05, attack: 0.004, curve: 2.5, lowFrom: 2000, lowTo: 380, highFrom: 100, highTo: 42, q: 0.7, drive: 0.4 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.95, gain: 0.06, attack: 0.02, curve: 2.2, lowFrom: 6200, highFrom: 1200, highTo: 650 },
      { wave: 'sine', from: 180, to: 58, seconds: 0.85, gain: 1.3, attack: 0.001, curve: 2.1, drive: 0.28 },
      { wave: 'sine', from: 90, to: 29, seconds: 0.95, gain: 0.75, attack: 0.02, curve: 1.8 },
    ],
  },
  /**
   * The ship took a hit and a shield absorbed it — 0050.
   *
   * ⚠️ **RISING, and the death cue falls.** They are the two halves of the same instant — the ship
   * was hit — and the only thing that distinguishes them is whether the player still has a ship. A
   * cue that sounded the same for both would make the most important fact in the game the one the
   * ear cannot check, which is the exact shape 0036 warns about.
   */
  shield: {
    twin: 'shell-mark',
    hold: 6,
    gain: 0.288,
    glue: 0.08,
    layers: [
      { wave: 'sine', from: 420, to: 880, seconds: 0.16, gain: 0.62, attack: 0.002, curve: 4 },
      { wave: 'square', from: 210, to: 440, seconds: 0.14, gain: 0.26, attack: 0.002, curve: 5, lowFrom: 4500, lowTo: 7000, highFrom: 300, q: 1.2 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.1, gain: 0.26, attack: 0.001, curve: 6, lowFrom: 11000, highFrom: 2400, highTo: 5000 },
      { wave: 'tri', from: 250, to: 520, seconds: 0.18, gain: 0.34, attack: 0.002, curve: 3.8 },
      { wave: 'sine', from: 105, to: 88, seconds: 0.2, gain: 0.5, attack: 0.002, curve: 3.4 },
    ],
  },
  /** The run lost a ship. Falling, long, and the only cue with nothing above it in the mix. */
  death: {
    twin: 'ship-burst',
    hold: 30,
    gain: 0.45,
    glue: 0.14,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.3, attack: 0.0006, curve: 6, lowFrom: 5600, lowTo: 1800, highFrom: 600 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.15, gain: 1, attack: 0.005, curve: 2.3, lowFrom: 1800, lowTo: 340, highFrom: 95, highTo: 40, q: 0.7, drive: 0.45 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.25, gain: 0.055, attack: 0.03, curve: 2, lowFrom: 5800, highFrom: 1100, highTo: 580 },
      { wave: 'sine', from: 170, to: 48, seconds: 1.2, gain: 1.3, attack: 0.001, curve: 1.9, drive: 0.28 },
      { wave: 'sine', from: 85, to: 24, seconds: 1.3, gain: 0.8, attack: 0.02, curve: 1.6 },
      { wave: 'saw', from: 90, to: 30, seconds: 0.85, gain: 0.26, attack: 0.01, curve: 2.3, lowFrom: 1600, lowTo: 300, highFrom: 70, drive: 0.4 },
    ],
  },
  /**
   * Something was collected.
   *
   * ⚠️ **One cue for all six faces, and that is a decision rather than an omission.** 0052 makes
   * every pickup on the field two things, and the player already learns which they got from the
   * readout moving. A cue per face would be six sounds distinguishing a thing the picture already
   * distinguishes, and the first one to be wanted is a life — which is what the decision names as the
   * split to make when play asks for it.
   */
  pickup: {
    twin: 'pickup-taken',
    hold: 4,
    gain: 0.264,
    glue: 0.06,
    layers: [
      { wave: 'sine', from: 620, to: 1240, seconds: 0.13, gain: 0.55, attack: 0.002, curve: 4 },
      { wave: 'sine', from: 930, to: 1860, seconds: 0.13, at: 0.02, gain: 0.26, attack: 0.004, curve: 4.5 },
      { wave: 'tri', from: 310, to: 620, seconds: 0.15, gain: 0.34, attack: 0.002, curve: 4 },
      { wave: 'sine', from: 155, to: 310, seconds: 0.17, gain: 0.46, attack: 0.002, curve: 3.4 },
      { wave: 'sine', from: 1860, to: 3720, seconds: 0.1, at: 0.01, gain: 0.13, attack: 0.002, curve: 5 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.16, attack: 0.001, curve: 6, lowFrom: 12000, highFrom: 3200, highTo: 7000 },
    ],
  },
  /**
   * Sound was switched on.
   *
   * ⚠️ **THE ONE CUE THAT IS NOT AN EVENT THE MODEL RESOLVES, and it needs its exemption stated.**
   * 0036's boundary is *"an event the model does NOT resolve, the picture must not invent"* — and by
   * the same token the ear must not either. This is not an invention: it is the answer to *did that
   * work*, and it is the only press in the game whose entire subject is whether sound comes out.
   * Switching sound on and hearing nothing is indistinguishable from a broken build, and on a phone
   * it is also the gesture that unlocks the audio context in the first place.
   */
  chime: {
    twin: 'chooser-fill',
    hold: 6,
    gain: 0.264,
    glue: 0.06,
    layers: [
      { wave: 'sine', from: 700, to: 1050, seconds: 0.14, gain: 0.55, attack: 0.003, curve: 4 },
      { wave: 'tri', from: 350, to: 525, seconds: 0.16, gain: 0.3, attack: 0.003, curve: 4 },
      { wave: 'sine', from: 175, to: 262, seconds: 0.2, gain: 0.44, attack: 0.003, curve: 3.2 },
      { wave: 'tri', from: 1400, to: 2100, seconds: 0.1, gain: 0.16, attack: 0.003, curve: 5 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.06, gain: 0.14, attack: 0.001, curve: 6, lowFrom: 12000, highFrom: 3600, highTo: 7000 },
    ],
  },
};
