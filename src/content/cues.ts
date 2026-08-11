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
 * The key. Every pitched note in the game is a ratio off this, so the whole thing transposes from
 * one number.
 *
 * ── IT LIVES HERE NOW, AND IT USED TO LIVE ONLY IN THE MUSIC ────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0099-the-cues-are-in-the-key.md`.** A low A, minor. It was declared in
 * `src/content/music.ts` and read by nothing else, which is exactly how the cues came to be tuned to
 * nothing at all — the layer ladder points `music` at `cues` and not the other way round, so the file
 * that synthesises the effects **could not see the key** even in principle. `src/content/music.ts`
 * re-exports it, so `MUSIC_ROOT` is one description and every existing import still resolves.
 */
export const MUSIC_ROOT = 55;

/**
 * The natural minor, in semitones. The only notes anything in this game is allowed to sound.
 *
 * ⚠️ **The scale rather than the chromatic set, and that is the whole of the rule.** Twelve notes
 * would make *in tune* mean *a note*, which is what an arbitrary Hz value already is. Seven mean a
 * cue cannot be a wrong note over the drone, whatever bar the music happens to be in — the same
 * argument `src/content/music.ts` makes for writing every voice in the natural minor.
 */
export const SCALE: readonly number[] = [0, 2, 3, 5, 7, 8, 10];

/**
 * `degree` steps up the scale from the root, in Hz. Seven to the octave, and negatives go below it.
 *
 * ⚠️ **A DEGREE and not a semitone, because a degree cannot be spelled wrong.** `inKey(11)` is a
 * note; a semitone helper would let a hand write `inKey(1)` for a B flat, which is not in the key and
 * is precisely the mistake this exists to make impossible. What the guard checks is the OUTPUT
 * anyway — `tests/sound.test.ts` walks every layer's `from` and `to` and refuses a frequency that is
 * not a scale tone, so a raw `190` typed straight into the table fails whether it came through here
 * or not.
 */
export function inKey(degree: number): number {
  const octave = Math.floor(degree / SCALE.length);
  const step = degree - octave * SCALE.length;
  return MUSIC_ROOT * Math.pow(2, octave + SCALE[step]! / 12);
}

/*
  ── WHAT A SWEPT LAYER SOUNDS IS NOT ITS ENDPOINT, AND THIS RULE DOES NOT PRETEND OTHERWISE ───────

  ⚠️ **`docs/decisions/0099-the-cues-are-in-the-key.md` tried to tune the heard pitch and could not
  find out what it was.** An exponential sweep is still gliding when its layer stops, so neither
  endpoint is a note the ear rests on; two defensible models of *the note a chirp sounds* — the
  energy-weighted mean of its instantaneous frequency, and the pitch a Goertzel over the whole layer
  responds loudest to — **disagreed by four semitones** on the death cue's own body. There is no
  third opinion to break the tie, and the pitch of a fast chirp is genuinely ill-posed.

  ⚠️ **So what is guarded is the thing that cannot be wrong either way: both ends are notes in the
  key.** Every instant of the sweep then lies BETWEEN two notes of the scale, and whichever part of
  it a listener picks out, they are picking it out of a musical interval rather than out of a slide
  between two arbitrary frequencies. The old table's death fell 21.9 semitones and its kill 19.4 —
  not intervals at all.

  ⚠️ **`tests/sound.test.ts` measures what the bake actually produces against that claim** rather
  than against a model of hearing: the loudest pitch in a layer rendered alone has to lie inside the
  interval the row names. That is a real check on the synthesiser and it is all the samples can say.
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
  'bossShot',
  'bossPhase',
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
  /** A boss crosses a health threshold and sheds `BURST.phase` fragments — 0111. */
  'phase-burst',
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
   * How hard this cue is struck, by where in the BEAT it lands. Absent means every sounding is full.
   *
   * ── THE GUN WAS ONE NOTE REPEATED, WHICH IS A DRONE AND NOT A RHYTHM ────────────────────────────
   *
   * ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** Reported from play: *"the gun fire at the
   * moment doesn't fit in with the music at all, it's technically on beat, but it also doesn't fit a
   * great sound experience."*
   *
   * ⚠️ **IT IS 0102's OWN FINDING ARRIVING AT THE CUES.** That decision found every drum in the music
   * was bit-identical to every other and named it: *"identical repetition at a fixed interval is not
   * LIKE a metronome, it is the definition of one."* The drums got velocities. **The cues did not**,
   * and the pulse is the most repeated sound in the game by a wide margin.
   *
   * ⚠️ **INDEXED BY POSITION IN THE BEAT, NOT BY A ROTATION COUNTER.** A counter that advances per
   * sounding drifts against the bar the moment a volley is dropped or a cadence changes, so the
   * accents would wander — which is the thing 0094 exists to prevent, arriving one layer up. The
   * index is which sixteenth of the beat the shot lands on, so **a shot on the downbeat is accented
   * because it is on the downbeat**, which is what a player does and what a counter cannot express.
   *
   * ⚠️ **One entry per sixteenth, so four is a beat.** Longer is allowed and wraps; `src/app/sound.ts`
   * takes it modulo its own length.
   *
   * ⚠️ **A VELOCITY AND NOT A PITCH, which is a deliberate limit.** Transposing a cue would need each
   * layer's scale DEGREE, and the rows store resolved Hz — so a semitone shift would walk the
   * endpoints off the scale and break
   * `docs/decisions/0099-the-cues-are-in-the-key.md`'s guard rather than serve it. Weight is the axis
   * that needs no key, and it is the one 0102 already proved was missing.
   */
  figure?: readonly number[];
  /**
   * Whether this cue waits for the next sixteenth instead of sounding on the step it was asked for.
   *
   * ── THE EXPLOSIONS WERE THE ONE LOUD THING IN THE GAME NOT ON THE GRID ──────────────────────────
   *
   * ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** Reported from play: *"enemy explosions
   * should pulse with the beat"*, and *"they're timingly in sync, but the sound doesn't mesh."*
   *
   * ⚠️ **THREE DECISIONS PUT EVERY CADENCE IN THE GAME ON A SIXTEENTH AND NONE OF THEM REACHED
   * HERE.** 0093 gridded the gun, 0096 gridded the enemies, 0094 locked the loops to the sim — and
   * all three grid **when a body decides to fire**. A kill happens when a bullet ARRIVES, which is a
   * function of how far away the thing was, so the loudest and most frequent event in a level landed
   * on an arbitrary sixtieth of a second. `docs/decisions/0099-the-cues-are-in-the-key.md` assumed
   * the opposite in as many words — *"arriving on the beat over a drone sounding A"* — and tuned the
   * harmony of cues whose timing was never gridded at all.
   *
   * ⚠️ **THE COST IS UP TO ONE SIXTEENTH OF DELAY AGAINST THE PICTURE, AND IT IS BOUNDED BY
   * CONSTRUCTION.** 100 ms at 150 BPM. `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`
   * wants the two channels to agree, and they still do — the debris appears on the step it always
   * did, and the sound arrives inside the same tenth of a second. What is bought is that every
   * explosion in a fight lands on the same grid the music and the guns are already on.
   *
   * ⚠️ **`hit` IS DELIBERATELY OFF IT, AND SO IS `bomb`.** A hit is the damage-legibility signal
   * (`docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md`) and its hold is 2 steps
   * against a grid of 6, so gridding it would silently collapse three hits into one — the guard 0035
   * exists to keep would be broken by the fix for a different report. A bomb is the one sound in the
   * game that answers a BUTTON, and delaying that is delaying feedback on a press.
   */
  onGrid?: boolean;
  /**
   * How far this cue pushes the music down while it lands, as a fraction of the bed. Absent is none.
   *
   * ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`, and it is on the ROW because the events
   * differ by an order of magnitude.** Measured against the `run` bed, a `kill` peaks 8.7 dB over it
   * and a `bossDown` 11.4 — while a `hit` is 3.5 and a `pulse` is one of ten a second. One global
   * number would either duck for a gun that never stops firing, which is the music turned down, or
   * fail to duck for the boss.
   *
   * ⚠️ **ONLY THE BIG ONES CARRY IT, and the gun deliberately does not.** Auto-fire cannot be
   * switched off (`src/content/actions.ts`), so a pulse that ducked would hold the bed down for the
   * whole game — *"background too quiet"* returning as a consequence of the fix for *"they don't
   * mesh"*.
   */
  duck?: number;
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
/*
  ── EVERY PITCHED ENDPOINT BELOW IS A SCALE TONE, AND NONE OF THEM USED TO BE ────────────────────

  `docs/decisions/0099-the-cues-are-in-the-key.md`. Reported from play: *"the primary and second
  fire, enemy fire and explosion noises for bomb, enemy and player death don't sync into the music
  properly, they're all close to on beat, but the sounds just don't mesh at all."*

  ⚠️ **"CLOSE TO ON BEAT" IS A PASS ON 0093, 0094 AND 0096.** Those three put every cadence in the
  game on a sixteenth grid and hold the loops in phase with the sim. The report says the timing
  arrived and something else did not, and the something else is the third axis this project has never
  tuned: it has tuned gains (0092), it has tuned timing, and it had never once tuned HARMONY.

  ⚠️ **The music is A minor and the cues were in no key at all.** The pulse fell to 52 Hz, a kill to
  62, the blast to 58, a death to 48 — four different notes, none of them the root (55) and none of
  them in the scale, arriving on the beat over a drone sounding A. That is what *"close to on beat but
  they don't mesh"* is a description of, and no amount of moving them closer to the beat could have
  fixed it.

  ⚠️ **Nothing here is a NEW number: each is the nearest scale tone to what 0089 tuned by ear.** The
  largest move is under 5%, so every filter, envelope and decay 0089 chose is intact and this is not
  a re-voicing. What changes is which notes the glide runs between.

  ⚠️ **EVERY INTERVAL IS NOW A WHOLE NUMBER OF SEMITONES, and none of them used to be**: the old
  death fell 21.9 semitones and the old kill 19.4, so a glide was not any interval at all and two
  explosions half a second apart were two unrelated slides. It follows from both ends being scale
  tones rather than being a second rule, and it is what makes a family: everything violent falls
  about twenty semitones, everything the player gains rises an octave, the chime rises a fifth.

  ── AND THE FAMILIES ARE THE POINT, NOT THE TUNING ───────────────────────────────────────────────

  | | falls or rises to | which is |
  |---|---|---|
  | the blast, the boss coming apart | **the root** | it resolves — the player did that |
  | a kill | the seventh | it hangs; there are more of them coming |
  | a death | the seventh, and it is the only cue that ends unfinished | it does not resolve |
  | a shield, a pickup, the chime | **an octave up** | everything gained rises |
  | a bomb thrown | two octaves up, on the fourth | the thing it turns into has not happened yet |

  ⚠️ **`noise` layers are untouched and the rule says why**: for noise, `from` is a sample-and-hold
  rate rather than a pitch — one field, two meanings, stated on `CueLayer` — and everything that
  explodes uses white, where it is zero.
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
  /*
    ── AND IT NEVER STOPPED SOUNDING, WHICH IS WHY IT DID NOT READ AS A RHYTHM ────────────────────

    ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** The cue was **0.110s** long. The gap
    between volleys is 0.133s at the bottom of the ladder, **0.100s from the second weapon pickup**
    and **0.067s** at the cap — so from the second pickup onward the gun was sounding 110% of the time
    and 165% at full rate. It was a continuous tone with bumps in it, at an RMS of 0.110 against a
    whole music bed of 0.132.

    ⚠️ **`hold` NEVER PREVENTED THIS AND WAS NEVER MEANT TO.** It is 2 steps against a cue 6.6 steps
    long; the field exists to stop a FLAM — two soundings 17ms apart heard as one smeared attack — and
    every one of the twelve rows is longer than its hold, correctly. Two kills close together should
    both sound. It is only fatal here, because the player cannot choose not to fire.

    ⚠️ **So the layers are shortened to fit the FASTEST rung**, and `tests/sound.test.ts` holds it
    against `FASTEST_FIRE` rather than against a number typed here. That is
    `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md`'s rule for the eye — the
    impact flash must finish before the next hit lands, or two hits draw one picture — written for the
    ear for the first time. It was true of the flash since 0035 and was never true of the sound.

    ⚠️ **What it costs is the long tail 0102 added, and the sub is KEPT.** *"Too tinny"* was answered
    with weight below 55 Hz and that is still here; what goes is its LENGTH. A 65ms sub is three and a
    half cycles at the root — enough to be felt, and short enough that the next one is a second event
    rather than the same one continuing.
  */
  pulse: {
    twin: 'shot-appears',
    hold: 2,
    gain: 0.3,
    glue: 0.3,
    /*
      Strong, weak, medium, weak — the four-step cycle every drum machine's shuffle is, and the same
      one `src/content/music.ts`'s hats already run. It is what makes ten of these a second read as a
      bar being subdivided rather than as a machine running.
    */
    figure: [1, 0.62, 0.82, 0.62],
    layers: [
      // The click. It keeps its top: everything else in the table gained air, and a pulse that did
      // not would be the one dull sound in a game the player hears this from ten times a second.
      { wave: 'noise', from: 0, to: 0, seconds: 0.012, gain: 0.55, attack: 0.0005, curve: 9, highFrom: 900, lowFrom: 11000, lowTo: 4000 },
      // The chunk. A saturated square behind a falling filter is where *meaty* lives.
      // G3 → E2: the seventh into the fifth, so the most frequent sound in the game is never the
      // root and never fights the bass for it.
      { wave: 'square', from: inKey(13), to: inKey(4), seconds: 0.048, gain: 0.85, attack: 0.001, curve: 6, lowFrom: 1700, lowTo: 320, q: 1.1, drive: 0.55 },
      // C3 → A1. The tail lands on the ROOT, which is what makes ten of these a second read as a
      // pulse in the music rather than as ten interruptions of it.
      { wave: 'sine', from: inKey(9), to: inKey(0), seconds: 0.058, gain: 0.7, attack: 0.001, curve: 5 },
      /*
        ── THE SUB, AND THE PULSE HAD NONE ────────────────────────────────────────────────────────

        ⚠️ **`docs/decisions/0102-the-music-goes-somewhere.md`.** Reported from play against the build
        0099 landed in: *"guns and rockets for the player need a deeper bassy tone still as they're
        too tinny and don't mesh with the background music well."*

        ⚠️ **0099 gave the pulse its NOTE and this gives it its BODY, and the report moved from one to
        the other.** *"Too tinny"* is 0089's own word for the thing it fixed everywhere else — and the
        pulse is the cue 0089 spent least on: three layers where a kill has five and a death six, and
        nothing at all below 55 Hz where the explosions reach 24.

        ⚠️ **An octave under the layer above, on the same note**, which is the recipe 0089 states for
        every explosion in this file and the reason it gives: *felt rather than only heard*. It is the
        one thing the most frequent sound in the game did not have.

        ⚠️ **Quiet and short.** This fires ten times a second at the cap; a long sub would be a
        continuous low rumble under the whole game rather than a weight under each shot, and
        `MAX_CUE_SECONDS` is not what would stop it.
      */
      /*
        ⚠️ **0.11 → 0.064, and the LENGTH is the only thing that moved.** 0104. The note, the octave
        under the layer above it and the gain are 0102's and are untouched — what could not stay is a
        64ms-longer-than-the-gap sustain under a gun that fires every 67ms. Three and a half cycles
        at the root is still weight; a hundred and ten milliseconds of it was a drone.
      */
      { wave: 'sine', from: inKey(2), to: inKey(-7), seconds: 0.064, gain: 0.5, attack: 0.002, curve: 4 },
    ],
  },
  /**
   * The second auto-weapon — 0051.
   *
   * Lower and longer than the pulse, because that is what the picture says too: a missile is the
   * heavier stream and the one the player is meant to be able to pick out of a screen full of the
   * lighter one.
   */
  /*
    ⚠️ **AND IT WAS EXACTLY ONE BEAT LONG, WHICH IS THE SAME DEFECT WITH A ROUNDER NUMBER** — 0104.
    0.400s against `BEAT_SECONDS` of 0.4, and a fastest cadence of 20 steps — **0.333s**. At the cap
    the launch overlapped its own successor by a fifth of a beat, so the heavier of the player's two
    streams smeared into itself exactly where it was meant to be most legible.

    ⚠️ **The counter-beat is what this cue is FOR** (`docs/decisions/0093-the-gun-is-on-the-grid.md`,
    5:1 against the pulse), and a counter-beat that overlaps itself is a texture. Shortened to fit,
    like the pulse, and held against `missilePerBeat`'s own floor rather than against a number here.

    ⚠️ **No `figure`, and that is deliberate.** It fires once every five pulses, so successive
    missiles are far enough apart to be separate events already; an accent pattern over something
    that slow is heard as an inconsistent sound rather than as a groove.
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
      { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.09, attack: 0.02, curve: 2.6, lowFrom: 9000, highFrom: 1500, highTo: 900 },
      // The launch, at a pitch a speaker can actually reproduce — see 0089 on why 30 Hz is not it.
      // A3 → C2: the root falling to the minor third, which is the interval that says *minor* in one
      // gesture. The missile is the counter-beat (0094), so it wants to be recognisably itself.
      { wave: 'sine', from: inKey(14), to: inKey(2), seconds: 0.26, gain: 1, attack: 0.001, curve: 3 },
      /*
        And the octave under it, for the systems that can. The same two notes, A2 → C1.

        ⚠️ **0.6 → 0.95, and it is the same report as the pulse's sub** — 0102, *"guns and rockets…
        too tinny."* A missile is the heavier of the player's two streams and is meant to be the one
        picked out of a screen full of the lighter one; it reached lower than the pulse did and not by
        enough to be the reason. This is the layer 0089 would have leant on and did not.
      */
      { wave: 'sine', from: inKey(7), to: inKey(-5), seconds: 0.29, gain: 0.95, attack: 0.004, curve: 2.5 },
      /*
        ⚠️ **AND A SUB UNDER THAT, which the missile also did not have** — A1 → C0, two octaves below
        its own launch. A missile is the second auto-weapon and the ask that produced it
        (`docs/decisions/0051-a-missile-is-the-second-auto-weapon.md`) is *slower, heavier, worth
        three of the pulse*; every channel it has should say so, and the low end was the one saying
        nothing.
      */
      { wave: 'sine', from: inKey(0), to: inKey(-12), seconds: 0.32, gain: 0.62, attack: 0.008, curve: 2 },
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
      // G6 → C4, and A5 → F3 under it. Both land on scale tones a fourth apart, which is as close to
      // *a chord* as a hundred-millisecond zap can get.
      { wave: 'saw', from: inKey(34), to: inKey(16), seconds: 0.1, gain: 0.7, attack: 0.001, curve: 5, lowFrom: 3200, lowTo: 500, q: 2.6 },
      { wave: 'sine', from: inKey(28), to: inKey(12), seconds: 0.09, gain: 0.35, attack: 0.001, curve: 5 },
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
      // B3 → G2. The one cue that lands on neither the root nor the fifth, because *it lived* is the
      // one event in the game that is not yet an answer to anything.
      { wave: 'sine', from: inKey(15), to: inKey(6), seconds: 0.07, gain: 0.55, attack: 0.001, curve: 6 },
    ],
  },
  /**
   * An enemy died. The debris burst is the picture; this is the same event arriving at the ear.
   *
   * ── IT WAS AN EXPLOSION AND IT NEEDED TO BE A DRUM ──────────────────────────────────────────────
   *
   * ⚠️ **`docs/decisions/0109-a-death-is-a-drum.md`.** Reported from play: *"the player weapons are
   * definitely feeling more like part of the music now, but the enemy deaths don't, they're on their
   * own sound band at the moment and instead of punctuating the music, they detract from it."*
   *
   * ⚠️ **HALF OF 0104 IS CONFIRMED AND HALF IS REPORTED BACK, AND THE HALVES ARE THE THREE FIELDS.**
   * That decision gave the pulse a `figure` and a length that fits its own cadence, and gave this row
   * `onGrid` and a `duck` — **neither of the two that worked.** It is on the beat, in the key, and it
   * is a 0.46-second explosion that pushes the bed down eighteen per cent every time it lands.
   *
   * ⚠️ **A LEVEL SENDS ABOUT TWO BODIES A SECOND AND THE DUCK TAKES 0.445s TO RECOVER**, so the bed
   * was held down for most of every level — which is what *detracts from the music* is a description
   * of. 0104 refused a duck on the pulse in as many words, *"a pulse that ducked would hold the bed
   * down for the whole game"*, and the same arithmetic reaches this row: **the duck is gone.**
   *
   * ⚠️ **AND IT WAS LONGER THAN A BEAT, so two kills were never two events.** 0.46s at 150 BPM is
   * 1.15 beats; at two a second the explosions overlapped themselves continuously into a rumble. It
   * is 0.26s now — a punctuation mark shorter than the beat it lands on, which is the same rule
   * 0104 applied to the gun and did not apply here.
   */
  kill: {
    twin: 'debris-burst',
    // ⚠️ **The reported one.** *"Enemy explosions should pulse with the beat"* — 0104, and this is the
    // most repeated of the six that now do.
    onGrid: true,
    /*
      ⚠️ **THE FIELD 0104 GAVE THE GUN AND NOT THE KILL, AND ITS OWN ARGUMENT COVERS BOTH.** Strong,
      weak, medium, weak — the four-step cycle the pulse, the hats and the arp's hat all run, so a
      run of kills reads as a bar being subdivided rather than as a machine going off. It is the
      second most repeated sound in the game and it was the last one struck at one weight.
    */
    figure: [1, 0.72, 0.86, 0.74],
    hold: 2,
    /*
      ⚠️ **0.33 → 0.36, AND IT IS BUYING BACK WHAT THE DUCK WAS DOING RATHER THAN ADDING LOUDNESS.**
      A cue that ducks is louder against the bed by the depth of its own duck; removing 0.18 of duck
      and adding 0.9 dB of gain leaves the kill about where it was against the music at the instant it
      lands, and leaves the music where it belongs for the 0.4 seconds afterwards.
      `tests/sound.test.ts` holds the ratio rather than either number.
    */
    gain: 0.36,
    glue: 0.12,
    layers: [
      // CRACK — a few milliseconds, so it starts rather than fades in. Brighter than it was: the top
      // is what a punctuation mark is made of, and it is the band the music leaves emptiest.
      { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.42, attack: 0.0004, curve: 8, lowFrom: 7200, lowTo: 2600, highFrom: 900 },
      // BODY — noise between a highpass that takes out the box and a lowpass that falls. Half the
      // length it was, and the highpass holds it above the band `sub` now occupies.
      { wave: 'noise', from: 0, to: 0, seconds: 0.17, gain: 0.9, attack: 0.002, curve: 4.5, lowFrom: 2400, lowTo: 620, highFrom: 150, highTo: 90, q: 0.8, drive: 0.3 },
      // DEBRIS — quieter, and the part that carries the top.
      { wave: 'noise', from: 0, to: 0, seconds: 0.24, gain: 0.06, attack: 0.012, curve: 3, lowFrom: 7000, highFrom: 1500, highTo: 800 },
      /*
        G3 → B1, and G2 → B1 under it. It HANGS on the seventh: a kill is the most repeated event in
        a level and there are always more coming, so the one thing it must not do is sound final.

        ⚠️ **THE LOWER VOICE STOPS AT B1 AND USED TO FALL TO B0**, which is 31 Hz —
        `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md` put the music's own fundamental
        at 41–65 Hz, and a cue landing under it twice a second is two things claiming one band. That
        is *"on their own sound band"* read the other way round: the kill was not beside the music, it
        was underneath it. It is a tuned tom now — in the band the drums live in, where a thing that
        punctuates belongs.
      */
      /*
        ⚠️ **THE TWO PITCHED VOICES ARE UP AND THE NOISE IS NOT, WHICH IS THE ASK READ EXACTLY** —
        reported from play: *"can we emphasise the regular enemy death… they provide a good counter
        point but those notes aren't quite hit often enough."* **The word is NOTES.** What the player
        is picking out of this cue is the tuned tom, not the crack or the body — so raising `gain` on
        the row would have made the noise louder in the same proportion and answered a different
        sentence. `tests/sound.test.ts` holds the cue against the bed, which is why the row's own
        gain moves only enough to keep that ratio where 0109 measured it.
      */
      { wave: 'sine', from: inKey(13), to: inKey(1), seconds: 0.26, gain: 1.5, attack: 0.001, curve: 3.2, drive: 0.25 },
      { wave: 'sine', from: inKey(6), to: inKey(1), seconds: 0.3, gain: 0.82, attack: 0.002, curve: 2.9 },
    ],
  },
  /**
   * The boss crossed a health threshold — 0111.
   *
   * ⚠️ **THE ONE EVENT IN A FIGHT THAT IS GOOD NEWS AND BAD NEWS AT ONCE**, and the cue is where that
   * gets said. The player did that — so it RISES, like everything else they gain — and what it rises
   * to is the minor second above the root, which is the one interval in the scale that sounds like a
   * question. Every other rising cue in this table lands on an octave or a fifth and resolves.
   *
   * ⚠️ **It is a twin and not a flourish.** `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`
   * is the rule: the model resolves a phase change and until 0111 neither channel mentioned it.
   *
   * ⚠️ **It ducks, and the arithmetic that condemned `kill`'s duck acquits this one** —
   * `docs/decisions/0109-a-death-is-a-drum.md`. A duck takes 0.445s to recover; a fight has at most
   * four phase changes in it, so this is a handful of half-seconds in a level rather than 104% of one.
   */
  /**
   * The boss opens fire — 0114.
   *
   * ── THE LOUDEST THING IN THE GAME WAS ALSO THE ONLY SILENT ONE ──────────────────────────────────
   *
   * ⚠️ **Reported: *"the boss needs an appropriate sound for their attacks as well, a loud crashing
   * sound."*** It was not a mix problem. `src/app/boss.ts` spawns its shots from its own fire gate
   * and never emitted a cue at all, so every enemy in the game announced its volleys and the boss
   * did not.
   *
   * ⚠️ **A CRASH RATHER THAN A LOUDER `threat`, and the difference is the tail.** `threat` is a
   * hundred milliseconds because a level sends hundreds of them; this sounds a handful of times a
   * fight, so it can afford to ring. That length is the whole of what *crashing* means here — the
   * spectrum is the same family, the decay is not.
   *
   * ⚠️ **IT IS ON THE GRID, so a volley lands with the music rather than beside it** — 0104. The
   * boss's cadence is already snapped to the level's sixteenth (0096), so this only makes audible
   * what the sim was doing anyway.
   *
   * ⚠️ **`hold` is 8 because a rake fires nine bullets in one step.** The cue is emitted once per
   * VOLLEY at the fire gate rather than once per bullet, and the hold is the second guard on that:
   * two phases whose cadences happen to collide cannot stack two crashes on one frame.
   */
  bossShot: {
    twin: 'threat-appears',
    onGrid: true,
    hold: 8,
    gain: 0.42,
    glue: 0.14,
    layers: [
      // THE STRIKE — bright, immediate, and wider than an enemy's tick. This is the crash's edge.
      { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.5, attack: 0.0005, curve: 7, lowFrom: 9000, lowTo: 3200, highFrom: 1100 },
      /*
        THE RING — six times a `threat`'s length, falling through the band a cymbal occupies. It is
        what makes this a crash rather than a shot, and it is affordable because a fight sounds it a
        few dozen times where a level sends `threat` in the hundreds.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.36, gain: 0.22, attack: 0.002, curve: 2.4, lowFrom: 11000, lowTo: 2600, highFrom: 1800, q: 0.6 },
      /*
        THE BODY — 0089: a cue without one is a hiss. Two notes of the key a fifth apart, falling to
        the root, so the crash lands in the music rather than across it. `inKey` keeps it consonant;
        the DISSONANCE in a boss fight belongs to the music, where it is a choice rather than a note
        repeated every volley.
      */
      { wave: 'sine', from: inKey(11), to: inKey(4), seconds: 0.34, gain: 1.1, attack: 0.001, curve: 3, drive: 0.35 },
      { wave: 'tri', from: inKey(7), to: inKey(0), seconds: 0.38, gain: 0.62, attack: 0.002, curve: 2.6, drive: 0.2 },
    ],
  },
  bossPhase: {
    twin: 'phase-burst',
    // Between a kill's 0.18 and the boss's own 0.42: rarer than one and smaller than the other.
    duck: 0.3,
    onGrid: true,
    // Long enough that nothing can retrigger it inside its own tail, and a phase cannot turn over
    // twice inside half a second at any tier.
    hold: 24,
    gain: 0.4,
    glue: 0.12,
    layers: [
      // The crack of the pieces coming off, brighter than a kill's because there are more of them.
      { wave: 'noise', from: 0, to: 0, seconds: 0.04, gain: 0.42, attack: 0.0005, curve: 7, lowFrom: 8000, lowTo: 2800, highFrom: 800 },
      // The body: shorter than a kill's and wider, so a phase reads as a bigger event of the same
      // family rather than as a different machine.
      { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.85, attack: 0.003, curve: 3.4, lowFrom: 3000, lowTo: 700, highFrom: 140, highTo: 85, q: 0.8, drive: 0.35 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.45, gain: 0.07, attack: 0.02, curve: 2.4, lowFrom: 7500, highFrom: 1400, highTo: 760 },
      /*
        A2 → B3, and A1 → B2 under it. **A RISING MINOR SECOND**: the player gained something, so it
        rises like every gain in this table — and it lands one degree above the root, which is the
        one place in the scale that does not settle. *Good news, and it is not over.*
      */
      { wave: 'tri', from: inKey(7), to: inKey(15), seconds: 0.34, gain: 0.8, attack: 0.004, curve: 2.6 },
      { wave: 'sine', from: inKey(0), to: inKey(8), seconds: 0.4, gain: 0.7, attack: 0.006, curve: 2.2 },
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
    // +11.4 dB, once a level, and the loudest thing the game ever does. The deepest duck there is.
    duck: 0.42,
    // The loudest event in the game, so the one it costs most to have land off the grid — 0104.
    onGrid: true,
    hold: 30,
    gain: 0.468,
    glue: 0.14,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.32, attack: 0.0005, curve: 6, lowFrom: 6000, lowTo: 1900, highFrom: 600 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.5, gain: 1.1, attack: 0.006, curve: 2.1, lowFrom: 1900, lowTo: 330, highFrom: 95, highTo: 38, q: 0.7, drive: 0.4 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.7, gain: 0.07, attack: 0.03, curve: 1.9, lowFrom: 6000, highFrom: 1200, highTo: 620 },
      // E3 → A1, and E2 → A0 under it. A FALLING FIFTH ONTO THE ROOT, which is the oldest cadence
      // there is and is the correct thing for the loudest event in the game: the level is over and
      // the player did it.
      { wave: 'sine', from: inKey(11), to: inKey(0), seconds: 1.6, gain: 1.3, attack: 0.002, curve: 1.7, drive: 0.3 },
      { wave: 'sine', from: inKey(4), to: inKey(-7), seconds: 1.75, gain: 0.85, attack: 0.02, curve: 1.4 },
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
      // D3 → D5, and everything else in the row is the same two octaves of D. The FOURTH, held all
      // the way up: the one degree in the scale that wants to go somewhere and has not yet, which is
      // what a thrown bomb is.
      { wave: 'sine', from: inKey(10), to: inKey(24), seconds: 0.2, gain: 0.75, attack: 0.004, curve: 3.5 },
      { wave: 'saw', from: inKey(3), to: inKey(17), seconds: 0.2, gain: 0.3, attack: 0.004, curve: 3.5, lowFrom: 1400, lowTo: 5000, highFrom: 120, drive: 0.25 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.2, gain: 0.22, attack: 0.01, curve: 3, lowFrom: 10000, highFrom: 1100, highTo: 3200 },
      { wave: 'sine', from: inKey(3), to: inKey(10), seconds: 0.22, gain: 0.42, attack: 0.006, curve: 3 },
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
    // +10.7 dB, and the player paid a charge for it — 0053.
    duck: 0.34,
    /*
      ⚠️ **Gridded even though the BOMB that throws it is not** — 0104. The two are a press and its
      consequence: the throw answers a button and must be immediate, and the blast lands `BLAST_STEPS`
      later on a clock the player is no longer holding. Only the second one is free to wait.
    */
    onGrid: true,
    hold: 6,
    gain: 0.432,
    glue: 0.14,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.035, gain: 0.33, attack: 0.0004, curve: 7, lowFrom: 5800, lowTo: 2100, highFrom: 650 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.8, gain: 1.05, attack: 0.004, curve: 2.5, lowFrom: 2000, lowTo: 380, highFrom: 100, highTo: 42, q: 0.7, drive: 0.4 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.95, gain: 0.06, attack: 0.02, curve: 2.2, lowFrom: 6200, highFrom: 1200, highTo: 650 },
      // F3 → A1, and F2 → A0 under it. It RESOLVES to the root, like the boss does — the two events
      // in the game the player caused on purpose and paid for are the two that land home.
      { wave: 'sine', from: inKey(12), to: inKey(0), seconds: 0.85, gain: 1.3, attack: 0.001, curve: 2.1, drive: 0.28 },
      { wave: 'sine', from: inKey(5), to: inKey(-7), seconds: 0.95, gain: 0.75, attack: 0.02, curve: 1.8 },
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
    onGrid: true,
    hold: 6,
    gain: 0.288,
    glue: 0.08,
    layers: [
      // A4 → A5, A3 → A4, C4 → C5: octaves of the ROOT and of the minor third, rising. Everything
      // the player gains rises an octave, and this is the one they gain by surviving.
      { wave: 'sine', from: inKey(21), to: inKey(28), seconds: 0.16, gain: 0.62, attack: 0.002, curve: 4 },
      { wave: 'square', from: inKey(14), to: inKey(21), seconds: 0.14, gain: 0.26, attack: 0.002, curve: 5, lowFrom: 4500, lowTo: 7000, highFrom: 300, q: 1.2 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.1, gain: 0.26, attack: 0.001, curve: 6, lowFrom: 11000, highFrom: 2400, highTo: 5000 },
      { wave: 'tri', from: inKey(16), to: inKey(23), seconds: 0.18, gain: 0.34, attack: 0.002, curve: 3.8 },
      // G2 → A2, which is the only step in the table smaller than an octave: the low body leans one
      // degree up into the root rather than sitting on a fixed note under a rising cue.
      { wave: 'sine', from: inKey(6), to: inKey(7), seconds: 0.2, gain: 0.5, attack: 0.002, curve: 3.4 },
    ],
  },
  /** The run lost a ship. Falling, long, and the only cue with nothing above it in the mix. */
  death: {
    twin: 'ship-burst',
    // +11.1 dB. The run just lost a ship; the track getting out of the way is the point.
    duck: 0.4,
    /*
      ⚠️ **The ship comes apart over 48 steps (0079), so a tenth of a second of wait is inside the
      first twelfth of the event.** A death is the most-watched thing a run does and the one moment
      the music should sound like it meant to happen.
    */
    onGrid: true,
    hold: 30,
    gain: 0.45,
    glue: 0.14,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.3, attack: 0.0006, curve: 6, lowFrom: 5600, lowTo: 1800, highFrom: 600 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.15, gain: 1, attack: 0.005, curve: 2.3, lowFrom: 1800, lowTo: 340, highFrom: 95, highTo: 40, q: 0.7, drive: 0.45 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.25, gain: 0.055, attack: 0.03, curve: 2, lowFrom: 5800, highFrom: 1100, highTo: 580 },
      /*
        F3 → G1, F2 → G0, F2 → G1. **IT DOES NOT RESOLVE, AND THAT IS THE WHOLE CHOICE.** The blast
        and the boss both fall onto the root because the player did those; a death falls from the
        sixth onto the seventh — a step UP in the scale under a falling pitch — so the ear is left
        waiting for a note that never comes. It is the only cue in the game that ends unfinished.
      */
      { wave: 'sine', from: inKey(12), to: inKey(-1), seconds: 1.2, gain: 1.3, attack: 0.001, curve: 1.9, drive: 0.28 },
      { wave: 'sine', from: inKey(5), to: inKey(-8), seconds: 1.3, gain: 0.8, attack: 0.02, curve: 1.6 },
      { wave: 'saw', from: inKey(5), to: inKey(-1), seconds: 0.85, gain: 0.26, attack: 0.01, curve: 2.3, lowFrom: 1600, lowTo: 300, highFrom: 70, drive: 0.4 },
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
    onGrid: true,
    hold: 4,
    gain: 0.264,
    glue: 0.06,
    layers: [
      // E and B, rising an octave each — the fifth and the ninth, which is the brightest pair the
      // natural minor has and the only cue in the game built on two notes at once.
      { wave: 'sine', from: inKey(25), to: inKey(32), seconds: 0.13, gain: 0.55, attack: 0.002, curve: 4 },
      { wave: 'sine', from: inKey(29), to: inKey(36), seconds: 0.13, at: 0.02, gain: 0.26, attack: 0.004, curve: 4.5 },
      { wave: 'tri', from: inKey(18), to: inKey(25), seconds: 0.15, gain: 0.34, attack: 0.002, curve: 4 },
      { wave: 'sine', from: inKey(11), to: inKey(18), seconds: 0.17, gain: 0.46, attack: 0.002, curve: 3.4 },
      { wave: 'sine', from: inKey(36), to: inKey(43), seconds: 0.1, at: 0.01, gain: 0.13, attack: 0.002, curve: 5 },
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
      // F → C, a rising fifth, in four octaves at once. It is the only cue whose interval is the
      // same in every layer, which is what makes *did that work* read as one clean answer.
      { wave: 'sine', from: inKey(26), to: inKey(30), seconds: 0.14, gain: 0.55, attack: 0.003, curve: 4 },
      { wave: 'tri', from: inKey(19), to: inKey(23), seconds: 0.16, gain: 0.3, attack: 0.003, curve: 4 },
      { wave: 'sine', from: inKey(12), to: inKey(16), seconds: 0.2, gain: 0.44, attack: 0.003, curve: 3.2 },
      { wave: 'tri', from: inKey(33), to: inKey(37), seconds: 0.1, gain: 0.16, attack: 0.003, curve: 5 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.06, gain: 0.14, attack: 0.001, curve: 6, lowFrom: 12000, highFrom: 3600, highTo: 7000 },
    ],
  },
};
