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
 * How a cue's waveform is shaped.
 *
 * ⚠️ **Four, and they are the four an arcade cabinet had.** The point of the small set is that every
 * sound in the game is recognisably from the same machine — a synthesiser with one more knob than
 * this produces twelve unrelated noises, which is how a game ends up sounding like a sample pack.
 */
export type WaveKind =
  /** A pure tone. Soft, and the only one that reads as friendly. */
  | 'sine'
  /** The hollow one. Shots and warnings. */
  | 'square'
  /** The buzzy one, with the most harmonics. Weight. */
  | 'saw'
  /** Sample-and-hold noise. Everything that breaks. */
  | 'noise';

/**
 * What a cue is.
 *
 * ⚠️ **Six numbers and no envelope**, and the missing field is deliberate. Every cue gets the same
 * attack and the same exponential decay (`src/app/sound.ts`), because a per-cue envelope is four more
 * numbers to tune per row and the thing it buys — a sound with a sustain — is a sound that is still
 * going when the next one arrives. A cue is punctuation.
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
  wave: WaveKind;
  /**
   * The rate the waveform advances at when the cue starts, in Hz.
   *
   * ⚠️ **A RATE rather than a pitch, so one pair of numbers means the same thing for all four
   * waves.** For the three tones it is the pitch. For `noise` it is the sample-and-hold rate — how
   * often a fresh random value is drawn — which is exactly what a chiptune noise channel's period
   * did, and which is why a falling sweep darkens the noise rather than silencing it.
   */
  from: number;
  /** The rate it has reached by the end, in Hz. Equal to `from` for a cue that does not sweep. */
  to: number;
  /** How long it lasts, in seconds. */
  seconds: number;
  /** Peak amplitude before the master gain, in `[0, 1]`. */
  gain: number;
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
 * ⚠️ **A cue is punctuation, and past about a second it stops being one.** It is also the audible
 * form of `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`: a sound still playing when
 * the next three arrive is the audio equivalent of a frame that did not finish, and the ceiling is
 * what makes the total baked size a number `tests/sound.test.ts` can assert rather than a hope.
 */
export const MAX_CUE_SECONDS = 1.5;

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
  pulse: { twin: 'shot-appears', wave: 'square', from: 880, to: 330, seconds: 0.07, gain: 0.16, hold: 2 },
  /**
   * The second auto-weapon — 0051.
   *
   * Lower and longer than the pulse, because that is what the picture says too: a missile is the
   * heavier stream and the one the player is meant to be able to pick out of a screen full of the
   * lighter one.
   */
  missile: { twin: 'missile-appears', wave: 'saw', from: 300, to: 120, seconds: 0.16, gain: 0.2, hold: 3 },
  /**
   * Something shot at the player.
   *
   * ⚠️ **Quiet, and it is the cue most likely to be wrong.** At 0022's worst case there are 150 enemy
   * bullets on screen; even rate-limited by `hold`, this is the sound that decides whether a busy
   * screen is exciting or exhausting. It is a play-test number on
   * `docs/decisions/0037-the-ship-has-mass.md`'s terms and nothing asserts it.
   */
  threat: { twin: 'threat-appears', wave: 'square', from: 220, to: 150, seconds: 0.09, gain: 0.11, hold: 4 },
  /**
   * A body took damage and lived.
   *
   * ⚠️ **This is the sound `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`
   * is about, arriving in the other channel.** Three play reports in a row said *"I thought it was a
   * bug that bullets hit an enemy and the enemy didn't get destroyed"*; the answer then was the impact
   * flash, which is this cue's twin. Short and dry, so it can happen often.
   */
  hit: { twin: 'impact-flash', wave: 'noise', from: 1200, to: 600, seconds: 0.05, gain: 0.15, hold: 2 },
  /** An enemy died. The debris burst is the picture; this is the same event arriving at the ear. */
  kill: { twin: 'debris-burst', wave: 'noise', from: 900, to: 200, seconds: 0.3, gain: 0.28, hold: 2 },
  /**
   * The boss came apart — 0062.
   *
   * ⚠️ **The longest and loudest cue in the game, and both are deliberate.** *"Bosses need a real
   * explosion and an end-of-level beat"* is what 0062 landed for, and the beat it added
   * (`BOSS_DEATH_STEPS`, 96 steps) is 1.6 seconds of the level carrying on while the boss comes apart.
   * This is sized to fill it and its `hold` is long enough that nothing can retrigger it inside it.
   */
  bossDown: { twin: 'boss-burst', wave: 'noise', from: 500, to: 60, seconds: 1.2, gain: 0.5, hold: 30 },
  /** A bomb was thrown. Rising, because the thing it turns into has not happened yet — 0053. */
  bomb: { twin: 'bomb-appears', wave: 'sine', from: 200, to: 700, seconds: 0.18, gain: 0.22, hold: 6 },
  /**
   * The bomb went off.
   *
   * ⚠️ **The damage lands on ONE step and this lasts a good deal longer, exactly like the ring.**
   * `src/app/frame.ts` keeps `BLAST_STEPS` of picture after a blast has spent itself, for the same
   * reason: the player learns where the edge was from what is left behind, not from the instant.
   */
  blast: { twin: 'blast-ring', wave: 'noise', from: 400, to: 80, seconds: 0.55, gain: 0.42, hold: 6 },
  /**
   * The ship took a hit and a shield absorbed it — 0050.
   *
   * ⚠️ **RISING, and the death cue falls.** They are the two halves of the same instant — the ship
   * was hit — and the only thing that distinguishes them is whether the player still has a ship. A
   * cue that sounded the same for both would make the most important fact in the game the one the
   * ear cannot check, which is the exact shape 0036 warns about.
   */
  shield: { twin: 'shell-mark', wave: 'square', from: 500, to: 900, seconds: 0.12, gain: 0.3, hold: 6 },
  /** The run lost a ship. Falling, long, and the only cue with nothing above it in the mix. */
  death: { twin: 'ship-burst', wave: 'saw', from: 400, to: 40, seconds: 0.9, gain: 0.45, hold: 30 },
  /**
   * Something was collected.
   *
   * ⚠️ **One cue for all six faces, and that is a decision rather than an omission.** 0052 makes
   * every pickup on the field two things, and the player already learns which they got from the
   * readout moving. A cue per face would be six sounds distinguishing a thing the picture already
   * distinguishes, and the first one to be wanted is a life — which is what the decision names as the
   * split to make when play asks for it.
   */
  pickup: { twin: 'pickup-taken', wave: 'sine', from: 600, to: 1200, seconds: 0.14, gain: 0.28, hold: 4 },
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
  chime: { twin: 'chooser-fill', wave: 'sine', from: 700, to: 1050, seconds: 0.12, gain: 0.25, hold: 6 },
};
