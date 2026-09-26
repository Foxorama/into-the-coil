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
  'arc',
  'zap',
  'throw',
  'threat',
  'hit',
  'kill',
  'bossShot',
  'bossAcid',
  'bossVoid',
  'bossBolt',
  // The fish going through the edge of the lane on its entrance — 0313.
  'bossBreach',
  'bossPhase',
  'bossDown',
  'bomb',
  'blast',
  // The specials' own, each named on its row in `src/content/specials.ts` — 0378.
  'hunt',
  'overdrive',
  'stormThrow',
  'storm',
  'whirlpool',
  'voidThrow',
  'rift',
  'shield',
  'death',
  'pickup',
  'chime',
] as const;

/** Derived from the list, so a cue cannot exist in the union and be missing from the table. */
export type CueKind = (typeof CUE_KINDS)[number];

/**
 * The cues a PLACE may re-voice. Seven of the fourteen, and the line between them is whose sound it is.
 *
 * ── EVERY LEVEL'S ENEMY DIED IDENTICALLY, AND NOTHING IN THIS FILE KNEW WHAT A PLACE WAS ────────
 *
 * ⚠️ **`docs/decisions/0190-a-place-owns-what-it-kills.md`**, answering *"I'll also need… different
 * sounding enemy deaths per level and different attacks etc per level."* This file had **zero**
 * references to a theme: `CUES` is one flat table, `bakeCues` took a rate and nothing else, and a
 * drifter dying in Rime Shelf made the same noise as one dying in the Saurian Belt.
 *
 * ⚠️ **THE SHIP IS THE CONSTANT AND THE PLACE IS WHAT CHANGES AROUND IT**, which is the rule this
 * list is. `pulse`, `missile`, `bomb`, `shield`, `death`, `pickup` and `chime` are the
 * player's own and sound the same everywhere: a gun whose report changed with the biome would make
 * the one instrument the player carries between places into a property of the place.
 * `docs/decisions/0093-the-gun-is-on-the-grid.md` and
 * `docs/decisions/0104-the-gun-plays-a-figure.md` both treat the gun as fixed, and this keeps them
 * true. **What is here is everything that belongs to something the level owns.**
 *
 * ⚠️ **AND A PLACE STATES `layers` RATHER THAN A ROW, WHICH IS WHY THERE IS NO GUARD BELOW IT.**
 * `twin`, `air`, `hold`, `duck`, `figure`, `gain` and `glue` are not what a Saurian enemy
 * death SOUNDS like — they are what a cue is for, how it behaves on the grid, and how much room it
 * is in. Making the override a voice list rather than a row makes changing them **unrepresentable**
 * instead of refused, which is `docs/decisions/0016-a-hub-enumerates-kinds.md`'s own preference and
 * one fewer table to keep honest.
 */
export const PLACE_CUES: readonly CueKind[] = [
  'threat',
  'hit',
  'kill',
  'blast',
  'bossShot',
  // A boss's named attacks belong to the thing the level owns, exactly as its generic crash does — 0308.
  'bossAcid',
  'bossVoid',
  'bossBolt',
  // And its entrance, which is the most a place-owned cue has ever been about the place — 0313: what
  // the fish goes through is the Ember Nebula, and a breach in Rime Shelf would not crackle.
  'bossBreach',
  'bossPhase',
  'bossDown',
];

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
  /** A bolt of chain lightning is stroked from the nose to what it struck — 0233. */
  'bolt-appears',
  /** A blade leaves the ship and starts its spiral — 0234. */
  'blade-appears',
  /** An enemy's shot appears on the field — `fireEnemies`. */
  'threat-appears',
  /** A spray of embers appears where a breaching boss goes through the edge of the lane — 0313. */
  'breach-appears',
  /** A body flashes its hit sprite for `IMPACT_FLASH_STEPS` — 0035. */
  'impact-flash',
  /** A dead enemy scatters `BURST.enemy` fragments where it died — 0036. */
  'debris-burst',
  /** The boss comes apart over `BOSS_DEATH_STEPS`, in pulses — 0062. */
  'boss-burst',
  /** A boss crosses a health threshold and sheds `BURST.phase` fragments — 0111. */
  'phase-burst',
  /** A thrown special — a bomb, a storm's ball, a void — is on the field, counting down its fuse — 0053, 0378. */
  'bomb-appears',
  /** The blast ring, which outlives its own damage by `BLAST_STEPS` — 0053. */
  'blast-ring',
  /** A surge's aura lights around the ship in its row's colour — `stepSurge`, 0373. */
  'aura-appears',
  /** A storm's strikes are stroked to the bodies it found, and its flicker runs — `unleashStorm`, 0374. */
  'storm-strikes',
  /** A whirlpool's arms open ahead of the ship with every blade — `openWhirl`, 0374. */
  'whirl-appears',
  /** A rift opens where the void went off, drawn at the radius it negates at — `openRift`, 0377. */
  'rift-opens',
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
  /**
   * Where in the field this layer sits, −1 (left) to 1 (right). Absent is the middle.
   *
   * ── A CUE WAS ONE CHANNEL, PLACED — AND NEVER A SOUND WITH A WIDTH OF ITS OWN ──────────────────────
   *
   * ⚠️ **Asked for, of the bomb, the death and the shuriken**: *"need reverb, stereo, last rolling effects
   * on the bomb and player death."* Every cue was a mono buffer sent to one of nine fixed panners, so an
   * explosion could be somewhere and could not be BIG: its crack, its body and its debris all came from
   * the same point. A roll of thunder is a thing that travels, and a layer that can say where it is — and
   * where it ends up (`panTo`) — is how a row writes one. The event's own place in the field is still the
   * panner's; this is the width around it.
   *
   * ⚠️ **THE MONO SUM IS UNCHANGED BY IT**, by construction: a layer at `pan` p goes to the left at
   * `1 − p` and the right at `1 + p`, so left plus right is what it always was. Every guard in
   * `tests/sound.test.ts` that renders a cue hears the fold-down, which is what a mono listener gets.
   */
  pan?: number;
  /** Where the layer has moved to by the time it ends — a linear travel from `pan`. Absent is no travel. */
  panTo?: number;
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
  /**
   * Seconds at the END of the note over which it dies away to silence — 0331's ninth listen: *"just a
   * sharp flute note… there's no tail, the note just ends."* The decay `curve` leaves a held note at
   * 40% or more when its `seconds` run out, and the six-millisecond guard then cuts it. A sustained
   * instrument states how long it takes to die. Absent, a note ends as it always has.
   */
  release?: number;
  /**
   * Vibrato depth in cents, at about five and a half cycles a second, easing in over the first third of
   * the note — what a held flute or bowed string does and a synthesised one does not. Absent is none.
   */
  vibrato?: number;
  /**
   * Cents the note starts away from its pitch and slides into over its first 90 ms — negative is from
   * below. The scoop a sax or a blues singer leans into a note with (0331's eleventh listen). Absent is
   * none.
   */
  scoop?: number;
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
  /**
   * How much of this cue is sent to the room, as a share of the dry signal.
   *
   * ── THE CHANNEL THE MUSIC HAS HAD SINCE 0136 AND THE CUES NEVER DID ─────────────────────────────
   *
   * ⚠️ **`docs/decisions/0173-a-cue-happens-somewhere.md`.** Reported: *"they're still the old mono
   * sounds and haven't been reworked as stereo sounds with deep bass, reverb and actually decent
   * sound."* Every cue in this game has been played into an anechoic chamber: a dry mono buffer, a
   * fixed panner, and nothing between it and the master. `src/app/music.ts`'s own header says the two
   * channels come out of one instrument *"which is what stops the soundtrack sounding like it was made
   * somewhere else"* — and the room was the one part of the instrument only one of them could reach.
   *
   * ⚠️ **ABSENT MEANS DRY, AND THE MOST FREQUENT SOUND IN THE GAME IS DRY ON PURPOSE.** The pulse
   * fires every 0.067 s at the cap (`FASTEST_FIRE`), which is shorter than any tail worth having, so
   * a wet gun is a gun smeared into a wash. It is the same argument 0104 shortened the cue's own
   * layers with: a cue is information, and information that outlasts its own repetition is noise.
   *
   * ⚠️ **IT IS A SEND AND NOT A SETTING**, so it scales with what the cue already is rather than
   * replacing it — a quiet cue in a big room is still quiet. The return is `CUE_ROOM_GAIN` and the
   * tail is `CUE_ROOM_SECONDS`, both in `src/app/sound.ts`, because they are properties of the room
   * rather than of any sound in it.
   */
  air?: number;
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
 * The widest a cue may sit in the stereo field, at the edge of the lane.
 *
 * ── THE MUSIC GOT A WIDTH AND THE EFFECTS KEPT NONE, FOR FOUR MIX PASSES ────────────────────────
 *
 * ⚠️ **`docs/decisions/0127-a-cue-has-a-place.md`.** 0118 gave sixteen of the twenty-three music
 * layers a position and every cue went on running `source.connect(master)` — mono, dead centre, in
 * the middle of a bed that now had a field around it. *"The game sound effects don't blend in with
 * the music at all"* has been reported four times, and for the last of those the two channels were
 * in **different spaces by construction**.
 *
 * ⚠️ **NARROWER THAN THE MUSIC'S 0.65, AND FOR THE OPPOSITE REASON.** A layer is continuous, so a
 * wide placement is a room. A cue is a transient that lands ten times a second at max fire, and a
 * hard-placed transient is heard as a click at one ear rather than as an event over there —
 * `docs/decisions/0089-a-cue-has-a-body.md`'s subject is precisely a sound that reads as an artefact
 * instead of a thing.
 *
 * ⚠️ **AND IT IS A LIMIT AT THE EDGE OF THE LANE, NOT A PAN.** A cue's place is where the thing
 * happened — `src/app/sound.ts`'s `panFor` maps the `across` coordinate the caller already has — so
 * this scales an existing measurement rather than authoring twenty-eight of them.
 */
export const CUE_PAN_LIMIT = 0.5;

/*
  ── AND EVERY CUE IS PLACED, WITH NO EXEMPTION TABLE, WHICH IS A MEASUREMENT ──────────────────────

  ⚠️ **`docs/decisions/0118-the-mix-has-a-width.md` centres any MUSIC layer carrying 40% of its
  A-weighted energy below 130 Hz** — a panned low frequency spends headroom on one side and arrives
  in a room as the same non-directional thump. The same question was put to this table, and the
  answer is that it does not arise: measured across all fourteen, the heaviest is `missile` at
  **16.6%** and the lightest is `threat` at **0.1%**.

  ⚠️ **SO THERE IS NO `width` FIELD AND NO LIST OF WHICH CUES MAY LEAVE THE CENTRE.** A cue is a
  transient with a filtered body; the bottom of it is a boom that decays in a tenth of a second, and
  A-weighting discounts that band by about thirty decibels. What holds an explosion's spectrum is
  `docs/decisions/0089-a-cue-has-a-body.md`'s two guards, which are proven and which any re-voice
  heavy enough to matter here reddens first. 0127 records the guard that was written for this and
  then deleted for being unfailable.
*/

/**
 * ⚠️ **EVERY GAIN IS WELL UNDER 1 AND THAT IS THE POINT.** Any number of cues can sound on one
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
    gain: 0.24,
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
      { wave: 'noise', from: 0, to: 0, seconds: 0.012, gain: 0.205, attack: 0.0005, curve: 9, highFrom: 900, lowFrom: 11000, lowTo: 4000, pan: -0.3, panTo: -0.45 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.012, gain: 0.205, attack: 0.0005, curve: 9, highFrom: 900, lowFrom: 11000, lowTo: 4000, pan: 0.3, panTo: 0.45 },
      // The chunk. A saturated square behind a falling filter is where *meaty* lives.
      // G3 → E2: the seventh into the fifth, so the most frequent sound in the game is never the
      // root and never fights the bass for it.
      { wave: 'square', from: inKey(13), to: inKey(4), seconds: 0.048, gain: 0.57, attack: 0.001, curve: 6, lowFrom: 1500, lowTo: 250, q: 1.5, drive: 0.72 },
      // C3 → A1. The tail lands on the ROOT, which is what makes ten of these a second read as a
      // pulse in the music rather than as ten interruptions of it.
      { wave: 'sine', from: inKey(9), to: inKey(0), seconds: 0.058, gain: 0.432, attack: 0.001, curve: 5, drive: 0.26 },
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
      { wave: 'sine', from: inKey(2), to: inKey(-7), seconds: 0.064, gain: 0.348, attack: 0.002, curve: 4, drive: 0.2 },
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
    like the pulse, and held against `missileEvery`'s own floor rather than against a number here.

    ⚠️ **No `figure`, and that is deliberate.** It fires once every five pulses, so successive
    missiles are far enough apart to be separate events already; an accent pattern over something
    that slow is heard as an inconsistent sound rather than as a groove.
  */
  missile: {
    twin: 'missile-appears',
    // ⚠️ DRY, and it is the fourth of the four. `missilePerBeat` reaches six, so a launch can
    // repeat every 0.067 s — the same arithmetic that keeps the gun dry, one weapon over.
    hold: 3,
    gain: 0.24,
    glue: 0.08,
    layers: [
      // The motor lighting.
      { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.3, attack: 0.0006, curve: 7, lowFrom: 7000, lowTo: 3000, highFrom: 1100 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.26, gain: 0.396, attack: 0.004, curve: 3.2, lowFrom: 2400, lowTo: 440, highFrom: 130, highTo: 46, q: 0.7, drive: 0.14, pan: -0.2, panTo: 0.2 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.033, attack: 0.02, curve: 2.6, lowFrom: 9000, highFrom: 1500, highTo: 900, pan: -0.35, panTo: -0.85 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.033, attack: 0.02, curve: 2.6, lowFrom: 9000, highFrom: 1500, highTo: 900, pan: 0.35, panTo: 0.85 },
      // The launch, at a pitch a speaker can actually reproduce — see 0089 on why 30 Hz is not it.
      // A3 → C2: the root falling to the minor third, which is the interval that says *minor* in one
      // gesture. The missile is the counter-beat (0094), so it wants to be recognisably itself.
      { wave: 'sine', from: inKey(14), to: inKey(2), seconds: 0.26, gain: 0.6, attack: 0.001, curve: 3 },
      /*
        And the octave under it, for the systems that can. The same two notes, A2 → C1.

        ⚠️ **0.6 → 0.95, and it is the same report as the pulse's sub** — 0102, *"guns and rockets…
        too tinny."* A missile is the heavier of the player's two streams and is meant to be the one
        picked out of a screen full of the lighter one; it reached lower than the pulse did and not by
        enough to be the reason. This is the layer 0089 would have leant on and did not.
      */
      { wave: 'sine', from: inKey(7), to: inKey(-5), seconds: 0.29, gain: 0.57, attack: 0.004, curve: 2.5 },
      /*
        ⚠️ **AND A SUB UNDER THAT, which the missile also did not have** — A1 → C0, two octaves below
        its own launch. A missile is the second auto-weapon and the ask that produced it
        (`docs/decisions/0051-a-missile-is-the-second-auto-weapon.md`) is *slower, heavier, worth
        three of the pulse*; every channel it has should say so, and the low end was the one saying
        nothing.
      */
      { wave: 'sine', from: inKey(0), to: inKey(-12), seconds: 0.32, gain: 0.372, attack: 0.008, curve: 2 },
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
  /**
   * Chain lightning leaving the nose — `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`.
   *
   * Asked for: *"an appropriate lightning sound when it fires and when it hits enemies that also
   * fits into the game sounds -> this is probably the most tricky bit."* Two cues, because the two
   * events are at two places: this is the DISCHARGE at the ship, and `zap` is the STRIKE at what it
   * hit. A bolt is resolved on the step it fires, so a hit sounds on the same step as the shot — and
   * a bolt that found nothing sounds only this one, which is what a dry discharge is.
   *
   * ⚠️ **AN ELECTRIC SOUND IS SAMPLE-AND-HOLD NOISE, AND THAT IS THE FIELD `CueLayer` ALREADY HAS.**
   * `from` on a `noise` layer is the hold rate — a chiptune noise channel's period — and a rate that
   * sweeps from a few kilohertz down through a few hundred is the *bzzt* of a coil, where white
   * noise is a hiss. The rest is the pulse's own recipe: a click on top, a driven tone for the
   * crack, and the sub the player asked every one of their weapons to have (0102) — held by
   * `tests/sound.test.ts` for this row as it is for the pulse's.
   *
   * ⚠️ **SHORTER THAN ITS OWN FASTEST CADENCE**, on 0104's terms: the arc's ladder reaches eight
   * steps, which is 0.133 s, and this is under it with room — a discharge that overlapped the next
   * would be a drone, which is the worst thing a weapon that fires itself can sound like.
   *
   * ⚠️ **IN THE KEY, like everything else** — 0099. The crack falls a fifth, from the second degree
   * to the fifth an octave down, and the sub is the pulse's own sub, so the two guns sit on the same
   * bottom.
   */
  arc: {
    twin: 'bolt-appears',
    hold: 2,
    gain: 0.26,
    glue: 0.12,
    figure: [1, 0.7, 0.86, 0.7],
    layers: [
      // The click. On top, and gone in ten milliseconds — the front edge of a spark.
      { wave: 'noise', from: 0, to: 0, seconds: 0.01, gain: 0.192, attack: 0.0004, curve: 9, highFrom: 2500, lowFrom: 12000, lowTo: 6000, pan: -0.4, panTo: -0.6 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.01, gain: 0.192, attack: 0.0004, curve: 9, highFrom: 2500, lowFrom: 12000, lowTo: 6000, pan: 0.4, panTo: 0.6 },
      // The coil: sample-and-hold noise falling through the kilohertz, which is the whole of what
      // says *electricity* rather than *explosion*. The lowpass chases it down so the tail is a buzz
      // and not a crackle in the top octave.
      { wave: 'noise', from: 3200, to: 450, seconds: 0.085, gain: 0.446, attack: 0.001, curve: 5, lowFrom: 7000, lowTo: 1600, highFrom: 600, q: 1.2, drive: 0.35, pan: -0.55, panTo: 0.55 },
      // The crack. A driven saw falling a fifth, second degree to fifth: the interval the threat
      // cue's zap already falls, one gun over.
      { wave: 'saw', from: inKey(22), to: inKey(18), seconds: 0.05, gain: 0.341, attack: 0.001, curve: 7, lowFrom: 2400, lowTo: 700, q: 1.4, drive: 0.6, pan: 0.3 },
      /*
        ── THE THUNDER, WHICH THE FIRST PLAY-TEST ASKED FOR — 0236 ──────────────────────────────

        *"The lightning noise needs to have an additional bit of bass on it, it sounds sparky, but
        not lightningy."* Sparky is the coil above; lightning is the air under it. Two layers where
        there was one sub: a low rumble of noise held under 200 Hz, and the sub itself twice as
        loud and half again as long — still inside the arc's fastest cadence (eight steps), which
        `tests/sound.test.ts` holds, and heavier at the bottom than the pulse, which it also holds.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.11, gain: 0.372, attack: 0.004, curve: 4, lowFrom: 260, lowTo: 90, highFrom: 40, q: 0.8, drive: 0.3 },
      { wave: 'sine', from: inKey(2), to: inKey(-7), seconds: 0.09, gain: 0.62, attack: 0.002, curve: 3.5, drive: 0.3 },
    ],
  },
  /**
   * Chain lightning landing — the other half of the ask above, at the body that took it.
   *
   * ⚠️ **PLACED AT THE TARGET, NOT AT THE SHIP** — 0127. `fireArc` in `src/app/frame.ts` hands over
   * the first struck body's `across`, so a bolt that jumped across the lane sounds from where it
   * landed while the discharge sounds from the nose. Two places for one event is what a bolt
   * looks like too.
   *
   * ⚠️ **SHARPER AND LOWER THAN `hit`, because it is not `hit`.** A pulse landing is the gun's own
   * rate again and stays a tick; a strike is once per volley and can afford a body — a fast crack
   * of held noise and a thump that falls to the root, so the strike reads as the heavy end of the
   * arc rather than as the pulse's tick under a different gun. Held like the hit so a chain of four
   * is one strike, which is what a chain sounds like: one crack, several sparks.
   */
  /*
    ⚠️ **AN IMPACT NOW, AND IT WAS A TICK — 0236.** Reported from the first play-test: *"need an
    impact/explosion sound when enemies get hit by lightning — currently there's no impact noise and
    it feels weird."* There was one, and it was the hit's size: 80 ms under a discharge on the same
    step, which the ear folded into it. This is built on the kill's recipe instead — a crack, a body
    of noise under a falling filter, and a thump to the root — at a fifth of a second, so a strike is
    a thing that happened to the body and not a click on the gun.
  */
  zap: {
    twin: 'impact-flash',
    hold: 2,
    gain: 0.42,
    glue: 0.12,
    layers: [
      // The snap: white, bright, and over before the body below has started to fall.
      { wave: 'noise', from: 0, to: 0, seconds: 0.018, gain: 0.223, attack: 0.0002, curve: 11, highFrom: 1800, lowFrom: 11000, lowTo: 4000, pan: -0.35, panTo: -0.5 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.018, gain: 0.223, attack: 0.0002, curve: 11, highFrom: 1800, lowFrom: 11000, lowTo: 4000, pan: 0.35, panTo: 0.5 },
      // The crack of held noise — the coil, struck.
      { wave: 'noise', from: 4200, to: 700, seconds: 0.06, gain: 0.33, attack: 0.0006, curve: 7, lowFrom: 5500, lowTo: 1200, highFrom: 320, q: 1, drive: 0.3, pan: 0.55, panTo: -0.55 },
      // The body: noise under a filter falling from the middle to the bottom — what an explosion IS.
      { wave: 'noise', from: 0, to: 0, seconds: 0.19, gain: 0.42, attack: 0.003, curve: 4.5, lowFrom: 1800, lowTo: 160, highFrom: 120, highTo: 50, q: 0.8, drive: 0.25 },
      // The ping: a triangle four octaves over the root, falling a major third, so the strike has a
      // top the hit does not.
      { wave: 'tri', from: inKey(28), to: inKey(26), seconds: 0.035, gain: 0.12, attack: 0.0005, curve: 7, pan: -0.35 },
      // The thump: the third falling to the root, then an octave under it — 0179's gesture, and
      // the weight the report was missing.
      { wave: 'sine', from: inKey(9), to: inKey(0), seconds: 0.12, gain: 0.48, attack: 0.001, curve: 4, drive: 0.3 },
      { wave: 'sine', from: inKey(2), to: inKey(-7), seconds: 0.16, gain: 0.42, attack: 0.004, curve: 3.5, drive: 0.2 },
    ],
  },
  /**
   * A shuriken leaving the ship — `docs/decisions/0234-a-blade-circles-the-ship.md`.
   *
   * A THROW, not a shot: a short whoosh of air with a metal ring on top of it, and the sub every
   * player weapon has (0102). Where the pulse clicks and the arc crackles, this swings — noise
   * through a band that rises and then falls is a thing passing the ear, which is what a blade
   * leaving the hand does. Dry, and shorter than its own fastest cadence (fifteen steps, a quarter
   * of a second), on 0104's terms.
   *
   * ⚠️ **The ring is a triangle three octaves over the root, falling a tone** — the metal of the
   * thing rather than the air it moves, and the one part that says *blade* and not *gust*.
   */
  throw: {
    twin: 'blade-appears',
    /*
      ⚠️ **A SMALL ROOM, WHICH NO OTHER GUN HAS** — *"need reverb."* The pulse is dry because it repeats every
      0.067 s and a tail under that is a wash (0173). The blade leaves every 0.2 to 0.4 s: slow enough that a
      quiet tail is the space the blades are flying through and not a smear.
    */
    air: 0.14,
    // Struck by where in the beat it lands — 0104, as the pulse is: the downbeat hardest.
    figure: [1, 0.72, 0.86, 0.74],
    hold: 3,
    gain: 0.25,
    glue: 0.1,
    /*
      ⚠️ **A BLADE, WHERE IT WAS A BREATH** — asked for with the album: *"we also need to make a lot better…
      shuriken fire noise."* Measured (`scripts/weigh-cue.mjs`), the old one had 6% of its weight in the sub and
      13% in the low band, and its centroid ROSE ten decibels from onset to tail — which is a whoosh, the one
      thing a thrown blade is not. A shuriken is struck steel leaving a launcher: the launcher's thump under it,
      a short bright *shing* that falls rather than rises, and two ringing partials a fifth apart, sagging as
      struck metal does.
    */
    layers: [
      // The launcher: the guns' shared bottom, in the middle, where a bottom belongs.
      { wave: 'sine', from: inKey(5), to: inKey(-4), seconds: 0.11, gain: 0.592, attack: 0.001, curve: 3.4, drive: 0.35 },
      // The shing: bright air that CLOSES, and it crosses the field as the blade spins out.
      { wave: 'noise', from: 0, to: 0, seconds: 0.1, gain: 0.272, attack: 0.001, curve: 4.5, lowFrom: 11000, lowTo: 3200, highFrom: 2400, highTo: 1200, q: 1.4, pan: -0.6, panTo: 0.6 },
      // The steel: two partials a fifth apart, one each side, sagging a degree each as struck metal does.
      { wave: 'tri', from: inKey(29), to: inKey(28), seconds: 0.12, gain: 0.163, attack: 0.0008, curve: 3, pan: -0.45 },
      { wave: 'tri', from: inKey(33), to: inKey(32), seconds: 0.11, gain: 0.116, attack: 0.0008, curve: 3.4, pan: 0.45 },
      // The edge on the front of it: a tick of steel on steel.
      { wave: 'square', from: inKey(39), to: inKey(35), seconds: 0.025, gain: 0.082, attack: 0.0005, curve: 7, highFrom: 2500 },
    ],
  },
  threat: {
    twin: 'threat-appears',
    // ⚠️ DRY, on the gun's own reasoning. An enemy shot rides the enemy fire cadence and a lane can
    // hold several shooters, so this is the second-most repeated sound in the game — and its whole
    // job is saying WHERE, which a tail arriving from everywhere works against.
    hold: 4,
    gain: 0.229,
    glue: 0.1,
    layers: [
      // The filter chases the sweep, and the resonance is what makes it zap rather than fall.
      // G6 → C4, and A5 → F3 under it. Both land on scale tones a fourth apart, which is as close to
      // *a chord* as a hundred-millisecond zap can get.
      { wave: 'saw', from: inKey(34), to: inKey(16), seconds: 0.1, gain: 0.595, attack: 0.001, curve: 5, lowFrom: 3200, lowTo: 500, q: 2.6, pan: -0.3, panTo: 0.3 },
      { wave: 'sine', from: inKey(28), to: inKey(12), seconds: 0.09, gain: 0.298, attack: 0.001, curve: 5 },
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
    // ⚠️ DRY, and it was the tightest wet in the table until it was measured: at `air: 0.14` the
    // room took its tail from 56 ms to 743 ms, because a small peak makes a -40 dB tail LONGER
    // rather than shorter. A hit lands once per connecting bullet — it is the gun's rate again —
    // and 0035's rule for the eye is the rule here: two hits must not draw one picture.
    hold: 2,
    gain: 0.283,
    glue: 0.08,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.035, gain: 0.31, attack: 0.0004, curve: 8, lowFrom: 7000, lowTo: 3000, highFrom: 1100, pan: -0.25, panTo: -0.4 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.035, gain: 0.31, attack: 0.0004, curve: 8, lowFrom: 7000, lowTo: 3000, highFrom: 1100, pan: 0.25, panTo: 0.4 },
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
    // Something came apart, and debris arrives from the walls. It is the loudest thing that happens
    // often, so this is the one row where the trade between BIG and SMEARED is live.
    air: 0.3,
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
    gain: 0.404,
    glue: 0.12,
    layers: [
      // CRACK — a few milliseconds, so it starts rather than fades in. Brighter than it was: the top
      // is what a punctuation mark is made of, and it is the band the music leaves emptiest.
      /*
        ⚠️ **SHARPER IS A FASTER FALL AND A HIGHER TOP, NOT MORE GAIN** — 0144. *"A sharper
        percussive beat"* is a claim about the front edge; raising the row's gain would have made the
        body louder in the same proportion and answered a different sentence, which is the mistake
        0109 records itself avoiding on this same cue. The lowpass opens to 11 kHz and the curve
        steepens, so the transient is brighter and gets out of the way faster.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.022, gain: 0.22, attack: 0.00015, curve: 13, lowFrom: 11000, lowTo: 2600, highFrom: 1000 },
      // BODY — noise between a highpass that takes out the box and a lowpass that falls. Half the
      // length it was, and the highpass holds it above the band `sub` now occupies.
      /*
        ⚠️ **THE FALL IS DEEPER AND THE LENGTH IS UNTOUCHED, WHICH IS 0109's BOUND READ EXACTLY** —
        `docs/decisions/0179-an-explosion-ends-low.md`. 620 → 430 Hz and a highpass reaching 62 Hz
        rather than 90, with more saturation under it. What 0109 refused was a long body at two a
        second; **this is the same 0.17 s spending its length lower down**, which is the one axis that
        decision left open.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.17, gain: 0.432, attack: 0.002, curve: 4.5, lowFrom: 2400, lowTo: 430, highFrom: 150, highTo: 62, q: 0.8, drive: 0.34 },
      /*
        DEBRIS — quieter, and the part that carries the top.

        ── THE STREAK LIVES HERE AND NOT IN THE BODY ─────────────────────────────────────────────

        ⚠️ **`docs/decisions/0144-a-chain-of-deaths-is-a-cymbal-streak.md`.** Reported from play:
        *"enemy death needs a sharper percussive beat where the sound lasts a bit longer so a chain
        of deaths sounds like a sharp cymbal streak."*

        ⚠️ **0.24 → 0.36 s AND 0.06 → 0.15, ON THIS LAYER ALONE, WHICH IS THE WHOLE CARE OF IT.**
        0109 cut this cue from 0.46 s to 0.26 because *at two a second the explosions overlapped
        themselves continuously into a rumble* — so *lasts a bit longer* is a reversal of that
        finding unless it is spent somewhere the rumble cannot come back. **It cannot come back
        here**: this layer is high-passed at 1500 Hz, so what overlaps is the top and a chain of
        overlapping tops is a cymbal streak rather than mud. The BODY below 620 Hz keeps 0109's
        length exactly.

        ⚠️ **0.36 s is still inside the beat**, which is the bound `tests/sound.test.ts` holds over
        every `debris-burst` cue: 0.4 s at 150 BPM, and the rule that a punctuation mark is shorter
        than the beat it lands on is untouched.
      */
      /*
        ⚠️ **AND THE STREAK DARKENS NOW, WHICH IS WHAT MADE THE WHOLE CUE END BRIGHTER THAN IT
        STARTED** — `docs/decisions/0179-an-explosion-ends-low.md`. This layer had a highpass that
        fell and **no `lowTo` at all**, so it held 7 kHz flat for 0.36 s over a body that was gone at
        0.17 — measured, the cue's centroid ROSE from 266 Hz to 3534 Hz, where every other explosion
        in the table falls 7 to 12 dB.

        ⚠️ **0144's streak is not being taken back.** The layer keeps its length, its gain and its
        highpass, so a chain of these still overlaps as a top rather than as mud; what changes is that
        the top now decays like everything else instead of being the last thing left.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.36, gain: 0.041, attack: 0.012, curve: 3, lowFrom: 7000, lowTo: 2400, highFrom: 1500, highTo: 800, pan: -0.3, panTo: -0.85 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.36, gain: 0.041, attack: 0.012, curve: 3, lowFrom: 7000, lowTo: 2400, highFrom: 1500, highTo: 800, pan: 0.3, panTo: 0.85 },
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
      { wave: 'sine', from: inKey(13), to: inKey(1), seconds: 0.17, gain: 0.759, attack: 0.0005, curve: 5, drive: 0.3 },
      /*
        ⚠️ **0.21 → 0.30 s, AND IT IS PITCHED RATHER THAN NOISE, WHICH IS THE WHOLE OF WHY IT IS
        ALLOWED** — 0179. The cue is 0.36 s long and had nothing at the bottom past 0.21, so its last
        third was debris alone. What 0109 removed at two a second was a long NOISE body, which
        overlaps into mud; a low sine on a scale tone overlaps into a note, and this one is already
        on the seventh with the voice above it.
      */
      { wave: 'sine', from: inKey(6), to: inKey(1), seconds: 0.3, gain: 0.397, attack: 0.001, curve: 3.4 },
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
    // Bigger than a threat because the thing that fired it is, and there is only ever one boss.
    air: 0.22,
    onGrid: true,
    hold: 8,
    /*
      ⚠️ **0.42 → 0.46, WHICH IS WHAT THE SHORTENING COST PUT BACK — 0323.** A cue an eighth shorter reads
      quieter on a 400 ms meter whatever its peak does (−33.6 → −35.0 dBFS measured), and 0308's ask was
      *"sounds for all the attacks need to be massively buffed"* — all of them, including the thirteen
      bosses that share this one. 0.46 is the level the serpent's three named attacks already sit at, so
      the four loudest rows still sum to 1.848 and still pass the limiter untouched, which is the ceiling
      `tests/sound.test.ts` owns.
    */
    gain: 0.46,
    glue: 0.14,
    /*
      ⚠️ **AND THE MOST REPEATED BOSS SOUND IN THE GAME WAS STRUCK AT ONE WEIGHT — 0323.** Thirteen bosses
      throw this, a few dozen times each; 0102's finding about the drums is the whole argument — *"identical
      repetition at a fixed interval is not LIKE a metronome, it is the definition of one"* — and 0104 built
      the answer and pointed it at the gun. Four weights, and the lightest is four fifths of full.
    */
    figure: [1, 0.82, 0.92, 0.78],
    layers: [
      // THE STRIKE — bright, immediate, and wider than an enemy's tick. This is the crash's edge.
      { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.3, attack: 0.0005, curve: 7, lowFrom: 9000, lowTo: 3200, highFrom: 1100 },
      /*
        THE RING — five times a `threat`'s length, falling through the band a cymbal occupies. It is
        what makes this a crash rather than a shot, and it is affordable because a fight sounds it a
        few dozen times where a level sends `threat` in the hundreds.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.26, gain: 0.082, attack: 0.002, curve: 2.6, lowFrom: 11000, lowTo: 2600, highFrom: 1800, q: 0.6, pan: -0.3, panTo: -0.75 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.26, gain: 0.082, attack: 0.002, curve: 2.6, lowFrom: 11000, lowTo: 2600, highFrom: 1800, q: 0.6, pan: 0.3, panTo: 0.75 },
      /*
        THE BODY — 0089: a cue without one is a hiss. Two notes of the key a fifth apart, falling to
        the root, so the crash lands in the music rather than across it. `inKey` keeps it consonant;
        the DISSONANCE in a boss fight belongs to the music, where it is a choice rather than a note
        repeated every volley.
      */
      /*
        ── ⚠️ AND IT IS 0.38 → 0.28 s, WHICH IS THE PRICE OF THE GUARD 0323 ADDS ────────────────────

        ⚠️ **THE PARAGRAPH BELOW THIS ROW SAYS `bossShot` IS UNTOUCHED BECAUSE THE ASK WAS ABOUT ONE
        ANIMAL, AND THAT IS STILL WHY ITS CHARACTER IS UNTOUCHED.** What moved is its LENGTH, and the
        reason is not the serpent: driven over the whole table, the crash thirteen bosses share was
        **0.38 s against a recurrence of 0.30 s** in the medusa's last phase at `burn`, and within a
        fortieth of a second of overlapping itself on the harrow, the shoal-mother, the axis and the
        fish. It was the tightest thing in the table and nothing had ever measured it.
        `docs/decisions/0323-a-sound-is-made-for-the-hundredth-time.md` has the table.

        ⚠️ **A CADENCE CHANGE WAS THE ALTERNATIVE AND IT WOULD HAVE BEEN THE WRONG PAYER.** The medusa's
        last phase fires every 36 steps because that is the fight somebody authored; slowing a boss
        nobody has complained about, to fit a sound, is
        `docs/decisions/0192-a-guard-holds-an-invariant.md`'s *a red guard is never answered by changing
        the work to suit it* pointed at the content instead of the guard. **The sound is what is too
        long**, on 0104's own reasoning: a cue that outlasts its own repetition is not punctuation.
      */
      { wave: 'sine', from: inKey(11), to: inKey(4), seconds: 0.26, gain: 0.66, attack: 0.001, curve: 3.2, drive: 0.35 },
      { wave: 'tri', from: inKey(7), to: inKey(0), seconds: 0.28, gain: 0.372, attack: 0.002, curve: 2.8, drive: 0.2 },
    ],
  },
  /*
    ── THREE ATTACKS SOUNDED THE SAME AND ALL THREE WERE SMALL — 0308 ──────────────────────────────

    ⚠️ **REPORTED**: *"sounds for all the attacks need to be massively buffed."* Two separate faults
    under one sentence, and `scripts/weigh-cue.mjs --loud` names both.

    ⚠️ **THE FIRST IS THAT THERE WAS ONE SOUND.** `bossShot` above is what a serpent's acid, its void
    and its lightning all made, which is
    [0282](../../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s own
    tell — *a mechanism whose output is identical for every kind* — and
    `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` asks the
    channel to separate them. Three attacks the player has to read one at a time made one noise.

    ⚠️ **THE SECOND IS THAT IT WAS THE QUIET ONE.** Measured with `--loud`: `bossShot` is **−33.6 dBFS**
    over 0.38 s, against the blast at −26.6, the ship's death at −25.7 and the boss coming apart at
    −24.8. The loudest thing in the game was seven decibels under the quietest thing in it that goes
    bang, and the gain is not where that comes back — the headroom the limiter guard owns caps it. What
    buys it is length, weight and saturation.

    ⚠️ **AND THE THIRD FAULT WAS THE RECIPE, WHICH ONLY A PLAY COULD SAY.** The first draft of these
    three was built to 0089's four parts — a crack, a filtered body, a debris tail, a boom — and came
    back *"pretty terrible still, give me acid sizzle, void null wumm wumms, lighting crackles."* That is
    the same complaint 0308 opened with, one layer down: **three attacks made of one recipe are one
    machine**, whatever the filters do. So each of the three below is built from the word the player used
    for it, the explosion recipe is off them in `tests/sound.test.ts`, and the knob that made it possible
    is the one the table had never touched — `noise` with a non-zero `from` is **sample-and-hold**, and a
    grain rate is what separates a sizzle from a hiss and a crackle from a roll.

    ⚠️ **`bossShot` IS UNTOUCHED AND STILL SERVES THIRTEEN BOSSES.** The ask is about this animal, and
    a re-voice of the shared crash would be a mix change to six fights nobody has played since the
    change that would have caused it — 0282's *default* shape: shared code holds the fallback, and a
    row that has something to say says it.
  */
  /**
   * Acid — a SIZZLE. Asked for in that word: *"give me acid sizzle."*
   *
   * ⚠️ **THE FIRST DRAFT WAS AN EXPLOSION WITH A FIZZ ON TOP, AND IT WAS THE RECIPE THAT MADE IT
   * ONE.** 0089's four parts — a crack, a filtered body, a debris tail, a boom — are what *everything
   * that explodes* is made of, and three attacks built to it came back *"pretty terrible… give me acid
   * sizzle, void null wumm wumms, lightning crackles."* All three were the same machine again, one
   * layer down from the fault 0308 opened with. **So the recipe is off these three**, and what decides
   * each one is the word the player used for it.
   *
   * ⚠️ **A SIZZLE IS A GRAIN RATE, NOT A FILTER — AND THE SYNTHESISER HAD THE KNOB ALL ALONG.** A
   * `noise` layer with a non-zero `from` is **sample-and-hold**: one fresh draw per cycle of that rate,
   * held flat between. `from: 0` is white, which is what every cue in this table was using, and white
   * noise through a lowpass is a boom or a hiss and cannot be anything else. A rate of a few kilohertz
   * is a fine grain — frying. A rate of a few hundred is a coarse one — bubbles bursting. Two of those
   * over each other, with the rate falling as they decay, IS acid eating something.
   *
   * ⚠️ **AND THERE IS ALMOST NO BOTTOM IN IT, WHICH IS THE POINT.** The boom is what made the first
   * draft an explosion. What is left underneath is one wet glop and a short note, both over before the
   * sizzle is a third done, so the mouth is heard opening and then the acid is heard working.
   *
   * ⚠️ **AND WHAT MAKES IT WET RATHER THAN DRY IS `q`, WHICH THE TABLE HAD NEVER USED PAST 1.5.** Its
   * own field note says *"past about 2 it stops being a filter and starts being a pitch"* — and a
   * resonant lowpass SWEEPING DOWNWARD over noise is the sound of liquid: a filter with a peak in it
   * that moves is the only thing in this synthesiser that can be a glop, a bubble or a throat. The fry
   * is at 1.9, the bubbles at 2.4 and the glop at 2.9. Asked for: *"remember the rule of quality, make
   * it really good"* — and the honest reading of that was not *more layers*, it was that a grain rate
   * had separated these three from each other while leaving all three DRY.
   *
   * ── ⚠️ AND IT WAS THE LOUDEST, BRIGHTEST, LONGEST THING IN THE GAME, ARRIVING EVERY SECOND — 0323 ──
   *
   * ⚠️ **REPORTED**: *"the sound is horrible, it's actively unpleasant too listen to for the serpent's
   * attacks."* Four measurements, every one of them off `scripts/weigh-cue.mjs`, and they all point the
   * same way — `docs/decisions/0323-a-sound-is-made-for-the-hundredth-time.md` has the table:
   *
   * - **0.95 s long against a cadence of 0.60 s** at `burn`, so it overlapped ITSELF, two and three
   *   deep, for as long as the phase lasted. That is 0104's rule — *an auto-weapon's cue finishes before
   *   its own next volley* — which this repository has held for every gun and every tube since it was
   *   written and had never once asked about a boss.
   * - **its loudest band was `hi`, 2–5 kHz**, which is where the ear is most sensitive and where
   *   listening fatigue lives. 1.00 there against 0.52 in the `mid`.
   * - **its centroid ROSE 9.4 dB**, 512 Hz to 1509, because of the rising highpass the paragraph above
   *   was so pleased with. A rising centroid is a whoosh; over a second, repeated, it is a kettle.
   * - **−25.0 dBFS A-weighted, the loudest cue in the game bar the boss dying** — 0308 set out to make
   *   it as loud as the things that explode and overshot into the one band that cannot take it.
   *
   * ⚠️ **SO WHAT IS KEPT IS THE WET HALF AND WHAT GOES IS THE BRIGHT HALF.** The glop, the bubbles and
   * the fry are the character the player asked for; the long fine sizzle on top of them was the
   * fatigue. **0.95 → 0.34 s**, the grain rates down about an octave, the lowpasses closing further, and
   * the highpass FALLING now rather than rising, so the tail fills out as the thing dries. The centroid
   * falls where it rose, the weight leaves 2–5 kHz, and it is punctuation instead of a wash.
   *
   * ⚠️ **AND IT IS STRUCK BY WHERE IN THE BEAT IT LANDS, LIKE THE GUN AND THE KILL.** 0102's own
   * finding — *"identical repetition at a fixed interval is not LIKE a metronome, it is the definition of
   * one"* — and 0104's answer to it. The acid sounds forty-odd times in a fight and was bit-identical
   * every time; it has a `figure` now, which is four weights and no new mechanism.
   *
   * ⚠️ **THE ROOM COMES DOWN WITH THE LENGTH, 0.30 → 0.22.** `air` is a send, so a cue that arrives
   * every second builds its own wash out of its own tails — which is exactly why the pulse is dry
   * (0173). A short cue in a smaller room is the version that stays a spit.
   */
  bossAcid: {
    twin: 'threat-appears',
    air: 0.22,
    onGrid: true,
    hold: 8,
    gain: 0.46,
    // The weights, by sixteenth — 0104's mechanism, and 0323 is what made it a boss's business too.
    figure: [1, 0.78, 0.9, 0.72],
    // Gentle here, unlike the wumms: saturation over a grain rate squashes the grain flat, which is
    // the one thing this cue cannot spare. What it does at 0.16 is glue the glop to the fizz above it.
    glue: 0.16,
    layers: [
      // THE SPIT — the mouth opening. Wet rather than sharp: a slap of white with the top taken off.
      // ⚠️ 0323 took its top down from 9 kHz to 6: it is the front of a wet sound, not a cymbal.
      { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.31, attack: 0.0006, curve: 9, lowFrom: 9000, lowTo: 2600, highFrom: 1000 },
      /*
        THE SIZZLE — a grain falling from 4.2 kHz to 1.6, over a third of a second, filling out as it
        goes. This is the cue: frying, not hissing, because the grain is audible.

        ⚠️ **IT WAS 8.2 kHz FOR 0.95 s WITH A HIGHPASS THAT ROSE TO 2.7 kHz — 0323.** An octave down, a
        third of the length, and the highpass falls instead: the fine bright fry ON TOP of the wet part
        was the whole of *actively unpleasant*, and the wet part is what the word *acid* was asking for.
      */
      { wave: 'noise', from: 4200, to: 1400, seconds: 0.24, gain: 0.273, attack: 0.004, curve: 2.2, lowFrom: 4600, lowTo: 900, highFrom: 700, highTo: 200, q: 1.2, pan: -0.55, panTo: -0.3 },
      // THE FRY — a coarser grain under it, through a resonant sweep, which is what makes it throaty.
      // ⚠️ 0323: 1.8 kHz rather than 2.6, and over in 0.3 s rather than 0.72.
      { wave: 'noise', from: 1800, to: 700, seconds: 0.3, gain: 0.273, attack: 0.006, curve: 2.4, lowFrom: 3000, lowTo: 900, highFrom: 400, q: 1.8, drive: 0.3, pan: 0.55, panTo: 0.3 },
      /*
        THE BUBBLES — a grain coarse enough to hear as separate events: 300 Hz is a grain every three
        milliseconds and 105 is one every ten, so the rate falling across the layer is a boil dying
        down. At `q` 2.3 each grain RINGS, which is the difference between a bubble and a tick.

        ⚠️ **UNTOUCHED BY 0323 EXCEPT ITS LENGTH**, because this is the layer the word *acid* is made of:
        it is coarse, low and liquid, and none of the four measurements that condemned this cue was
        about it.
      */
      { wave: 'noise', from: 300, to: 105, seconds: 0.34, gain: 0.223, attack: 0.008, curve: 2.4, lowFrom: 3000, lowTo: 820, highFrom: 230, q: 2.3, drive: 0.34, pan: -0.3, panTo: 0.6 },
      /*
        THE GLOP — a resonant sweep from 1.1 kHz down to 200 over an eighth of a second. Nothing else in
        this table sounds like liquid and this is why: the peak travelling down through the band IS the
        sound of something being swallowed. It is also the loudest noise layer, so it is what 0089's
        recipe measures, and it darkens by a factor of five.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.12, gain: 0.372, attack: 0.002, curve: 5, lowFrom: 1100, lowTo: 200, highFrom: 55, q: 2.9, drive: 0.4 },
      /*
        ── THE WEIGHT IS TWO NOTES NOW, AND THEY ARE THE ONLY THING IN THIS CUE THAT IS A NOTE — 0325 ─

        ⚠️ **IT WAS A GLIDE FROM C3 TO C2, AND A GLIDE STATES NOTHING.** Measured by
        `scripts/weigh-fit.mjs`, this cue preferred the key's own frequencies to the quarter-tones
        between them by **0.2 dB** — the bed at this rung does it by 24.5, `dread` by 29.5, and a ride
        cymbal by −0.3. A sweep spends as long beside a note as on it, so the one pitched layer in here
        was, to the ear's pitch sense, a cymbal. *"They don't fit into the music… we need to blend with
        them a bit more melody."*

        ⚠️ **C3 THEN A1: THE MINOR THIRD FALLING TO THE ROOT, BOTH HELD.** Two notes in sequence is the
        smallest thing that is a melody rather than a chord; the interval is the one the old glide
        already spanned; and the landing is **A, the note this fight's bed holds in four layers at
        once** — `drone`, `sub`, `dread` and `frenzy` all sound the root. Held, because `to` equal to
        `from` is what states a pitch: the field's own note says so.

        ⚠️ **AND THE LANDING IS DEEPER THAN THE OLD ONE, WHICH IS THE OTHER HALF OF THE ASK.** C2 is
        65.4 Hz and A1 is 55 — three semitones down, *"a slightly deeper bass"*, and it lands on the
        root rather than beside it.

        ⚠️ **THE WET LAYERS ABOVE ARE 0323's AND ARE NOT TOUCHED.** That decision cut the sizzle by an
        octave and to a third of its length because 2–5 kHz was the fatigue; nothing here puts anything
        back up there, and the cue's `hi` share is measured in the decision to prove it.
      */
      { wave: 'sine', from: inKey(9), to: inKey(9), seconds: 0.14, gain: 0.26, attack: 0.003, curve: 4.4, drive: 0.3 },
      /*
        ⚠️ **THE SECOND NOTE DECAYS HARDER THAN A NOTE WOULD LIKE TO, AND A GUARD CHOSE THE NUMBER.**
        *Starts and ends at zero* holds that a cue's last quarter is quieter than its first: at
        `curve` 2.4 over 0.34 s this note was still ringing at the end of the cue and the whole thing
        measured **0.0873 against 0.0801** — louder at its end than at its start, which is a cue that
        does not finish. 3.6 over 0.3 s is the same note landing in the same place and gone before the
        cue is.
      */
      { wave: 'sine', from: inKey(0), to: inKey(0), at: 0.13, seconds: 0.3, gain: 0.484, attack: 0.005, curve: 3.6, drive: 0.42 },
      /*
        AND THE OCTAVE OVER THE LANDING, SHORT — the void's own argument
        (`docs/decisions/0140-no-layer-is-inaudible.md`, one bus over): `MASTER_GAIN` is 0.4 and a
        laptop reproduces nothing at 55 Hz, so a note living in the floor is a note half the machines
        play as silence. At 110 Hz this sits under the bubbles and carries the second note to a speaker
        with no bottom.
      */
      { wave: 'tri', from: inKey(7), to: inKey(7), at: 0.13, seconds: 0.18, gain: 0.093, attack: 0.005, curve: 3.4, lowFrom: 900, lowTo: 420, q: 1.4 },
      // AND A SECOND SPATTER. Acid does not arrive once: the irregularity is the only thing here that
      // cannot be got from an envelope, and one extra layer buys it.
      // ⚠️ 0323: at 0.18 rather than 0.26, and darker — it has to land inside a cue a third as long.
      { wave: 'noise', from: 0, to: 0, at: 0.18, seconds: 0.035, gain: 0.186, attack: 0.0008, curve: 9, lowFrom: 4800, lowTo: 1600, highFrom: 600, pan: 0.6 },
    ],
  },
  /**
   * The void — **NULL WUMM WUMMS.** Asked for in those words.
   *
   * ⚠️ **THREE PULSES AND NOT ONE EVENT, WHICH IS THE WHOLE OF WHY *wumms* IS PLURAL.** The first draft
   * was one collapse with a long sub under it, and one collapse is an explosion however dark it is. A
   * wumm is a sub note with a fast attack and a short decay; three of them a quarter of a second apart
   * is a rhythm, and a rhythm is the one thing a single blast cannot be mistaken for. Each is lower and
   * quieter than the one before, so the figure falls away rather than repeating.
   *
   * ⚠️ **AND *NULL* IS WHAT IS NOT IN IT.** No crack, no grain, no debris tail, nothing above 300 Hz
   * except the octave that makes the first wumm audible on a laptop. The dark wash under the three is
   * low-passed at 300 and falling: a hole rather than a room, which is also why `air` came down from
   * the most in the table to under the acid's — reverb on a sub pulse is a smear, and three smeared
   * pulses are one long note.
   *
   * ⚠️ **THE OCTAVE IS NOT DECORATION.** `MASTER_GAIN` is 0.4 and a laptop speaker reproduces nothing
   * at 30 Hz, so a cue that lives entirely in the floor is a cue half the machines play as silence —
   * `docs/decisions/0140-no-layer-is-inaudible.md`'s subject, one bus over. One tri an octave over the
   * first wumm, short, is what carries the figure to a machine with no bottom.
   */
  bossVoid: {
    twin: 'threat-appears',
    // Under the acid's: a sub pulse in a big room is a smear, and three smeared pulses are one note.
    air: 0.22,
    onGrid: true,
    hold: 8,
    gain: 0.46,
    // Enough to keep the three pulses of one weight and no more. `saturate` is normalised at unity, so
    // past about a third the squash costs more output than the density buys — measured on the first draft.
    glue: 0.16,
    /*
      ⚠️ **A FIGURE AND NOTHING ELSE — 0323, AND WHAT IT DOES NOT DO IS THE POINT.** Measured beside the
      acid, this cue goes the other way on every axis the report is about: 0.96 s inside a round of 1.7 s
      at the tightest tier, its loudest band the `mid` with **0.099** in the harsh 2–5 kHz, a centroid
      that **falls 8.4 dB**, and −32.1 dBFS. There is nothing here the measurements condemn, and the
      player named this one in their own words (*"void null wumm wumms"*) — so it gets the one thing
      every repeated sound in this game needs and no re-voice at all.
    */
    figure: [1, 0.84, 0.92, 0.8],
    layers: [
      /*
        THE KNOCK — a soft dark thud on the front of the first wumm, so it ARRIVES. 700 Hz down to 140
        with the box taken out at 40: an edge with no brightness in it, which is the only kind this cue
        can have. It is also the loudest noise layer, so it is what 0089's recipe measures.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.022, gain: 0.4, attack: 0.0006, curve: 11, lowFrom: 700, lowTo: 140, highFrom: 40, q: 1.4 },
      /*
        WUMM ONE — the root's fifth falling to the root below it, through a resonant lowpass sweeping
        1.1 kHz down to 150.

        ⚠️ **THE SWEEP IS THE *W*, AND WITHOUT IT THIS IS A THUMP AND NOT A WUMM.** A driven sine has
        harmonics at two, three and four times its fundamental; a lowpass with a PEAK in it travelling
        down through them is a formant moving, which is what a mouth does and what every wobble bass
        ever made is. The field note on `q` says past about 2 it stops being a filter and becomes a
        pitch — 2.7 is well past, deliberately.

        ⚠️ **AND THE DRIVE IS HALF FOR THE SAME HARMONICS, NOT FOR THE GROWL.** Measured, the three
        wumms at 32 Hz with the drive at 0.22 read **−38.4 dBFS** against the blast's −26.6, because
        A-weighting discounts the floor by thirty decibels and is right to —
        `docs/decisions/0140-no-layer-is-inaudible.md` one bus over: a sound living entirely under
        100 Hz is a sound half the machines play as silence. With the harmonics, and the figure moved up
        an octave so only the third wumm reaches the floor, it reads −32.3.
      */
      { wave: 'sine', from: inKey(7), to: inKey(0), seconds: 0.34, gain: 0.96, attack: 0.006, curve: 3.1, drive: 0.5, lowFrom: 1100, lowTo: 150, q: 2.7 },
      // The octave over it, so the figure survives a speaker with no bottom. Short: it is a carrier.
      { wave: 'tri', from: inKey(14), to: inKey(7), seconds: 0.16, gain: 0.24, attack: 0.004, curve: 4.4, drive: 0.35, lowFrom: 1400, lowTo: 380, q: 2, pan: -0.35 },
      // WUMM TWO — a quarter of a second behind, a third lower, quieter, and its sweep starts lower.
      { wave: 'sine', from: inKey(4), to: inKey(-3), at: 0.25, seconds: 0.34, gain: 0.8, attack: 0.006, curve: 3.1, drive: 0.5, lowFrom: 820, lowTo: 110, q: 2.7 },
      /*
        WUMM THREE — half a second in, down into where `bomb` already goes, the quietest, and the only
        one with a slow attack: it does not arrive, it swells and sinks. The figure falls away, because
        three of the same weight would be a machine running rather than an animal doing something.
      */
      { wave: 'sine', from: inKey(2), to: inKey(-7), at: 0.5, seconds: 0.46, gain: 0.6, attack: 0.012, curve: 2.9, drive: 0.5, lowFrom: 620, lowTo: 80, q: 2.7 },
      /*
        THE NULL — the only other noise in it, and there is nothing above 300 Hz in it at all. A wash the
        three pulses sit inside, low-passed downward and saturated, so the hole has air moving in it and
        no grain and no edge.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.9, gain: 0.272, attack: 0.02, curve: 2.4, lowFrom: 300, lowTo: 75, highFrom: 34, q: 1, drive: 0.35, pan: -0.6, panTo: 0.6 },
      /*
        ── AND THE HOLE IS IN A KEY NOW: THE ROOT AND THE FIFTH, HELD UNDER THE THREE — 0325 ──────────

        ⚠️ **THE WUMMS ARE THREE GLIDES AND GLIDES STATE NOTHING**, so this cue measured **+0.2 dB** on
        `scripts/weigh-fit.mjs` against a bed that measures +24.5 — *"they're in their own little area
        of sound."* The three pulses are the character and are untouched (0323 measured them healthy and
        the player named them in their own words); what is added is the thing they fall INTO.

        ⚠️ **A AND E RATHER THAN A MELODY, BECAUSE THIS CUE'S SHAPE IS ALREADY A FIGURE.** Three pulses
        a quarter of a second apart is the tune here; what it had no version of is a pitch to be a tune
        IN. The two notes are the ones `drone` holds through every rung of this fight — the root and its
        fifth — so the sustain agrees with the one layer 0095 never closes.

        ⚠️ **SLOW IN AND LONGER THAN THE WASH, SO IT IS A DRONE AND NOT A FOURTH PULSE.** 60 ms of
        attack is past the point an onset reads as an event, and the null's own noise is what it hides
        behind: a sub that arrived would be the *"one collapse"* the row's note refuses.
      */
      { wave: 'sine', from: inKey(0), to: inKey(0), seconds: 0.88, gain: 0.368, attack: 0.06, curve: 1.5, drive: 0.28, lowFrom: 300, lowTo: 190, q: 1 },
      { wave: 'tri', from: inKey(4), to: inKey(4), at: 0.08, seconds: 0.62, gain: 0.12, attack: 0.09, curve: 1.8, lowFrom: 520, lowTo: 260, q: 1.2, pan: 0.45, panTo: -0.45 },
    ],
  },
  /**
   * The serpent's lightning — **CRACKLES**, asked for in that word.
   *
   * ⚠️ **THE ONE ATTACK THE PLAYER HAS TWICE SAID NOT TO CHANGE, SO NOTHING ABOUT IT DOES.** *"Don't
   * change the lightning attack it's really good"* is about the attack; it fell out of the sky in
   * near-silence, sharing a crash with the acid. The column, the warning and the strike are 0248's
   * and are untouched.
   *
   * ⚠️ **A CRACKLE IS A COARSE GRAIN AND A ROLL IS NOT A CRACKLE.** The first draft was a flash, a rip
   * and 1.15 s of white noise falling into the floor — *distant thunder*, which is a smooth sound, and
   * smooth is the one thing the word rules out. Sample-and-hold is what makes it granular (`bossAcid`
   * has the whole argument for the knob): the rate here starts at a few kilohertz and falls to a couple
   * of hundred, so the grain coarsens as the bolt dies and the ear hears separate ticks rather than a
   * wash. Three of those staggered, plus one late snap, is the figure.
   *
   * ⚠️ **AND IT IS HALF THE LENGTH IT WAS.** 0.64 s against 1.20. A crackle that outlasts its own flash
   * by a second is a rumble with a crack on the front; what is under it now is a short clap, not weather.
   *
   * ⚠️ **THE ONE ATTACK THE PLAYER HAS TWICE SAID NOT TO CHANGE, AND NOTHING ABOUT IT DOES.** *"Don't
   * change the lightning attack it's really good"* is about the attack: the column, the 45-step warning
   * and the strike are 0248's and are untouched.
   */
  bossBolt: {
    twin: 'bolt-appears',
    // Some room, because lightning happens outdoors — but under the first draft's 0.45, which smeared
    // the grain this cue is made of into the wash it was trying not to be.
    air: 0.3,
    onGrid: true,
    hold: 8,
    gain: 0.46,
    // Least of the three: a bolt is the one that has to keep its edge, and glue is what takes an edge off.
    glue: 0.2,
    /*
      ⚠️ **A FIGURE, AND ITS TIMBRE IS UNTOUCHED FOR THE THIRD TIME — 0323.** *"Don't change the lightning
      attack it's really good"*, said twice, and the measurements agree with the verdict: the biggest fall
      in the table (**−17.5 dB**, 1850 Hz down to 247), 0.66 s inside a round of 1.7, and −28.4 dBFS. What
      it had in common with the acid was being the same sound every single time; the weights are the whole
      change, and the lightest of the four is still four fifths of full.
    */
    figure: [1, 0.86, 0.94, 0.82],
    layers: [
      // THE FLASH — the hardest edge in the table: a bolt arrives before the sound of it does.
      { wave: 'noise', from: 0, to: 0, seconds: 0.028, gain: 0.384, attack: 0.0002, curve: 12, lowFrom: 15000, lowTo: 5200, highFrom: 2600 },
      /*
        THE TEAR — the crackle itself. 5.2 kHz of grain falling to 760 Hz in a sixth of a second: the
        rate IS the sound, and it coarsens as it goes, which is what a discharge does.
      */
      { wave: 'noise', from: 5200, to: 760, seconds: 0.16, gain: 0.446, attack: 0.0008, curve: 4.4, lowFrom: 11000, lowTo: 2400, highFrom: 1300, q: 1.7, drive: 0.42, pan: -0.65, panTo: 0.2 },
      /*
        THE SPIT — a second, coarser crackle behind it, so the discharge stutters rather than fades.

        ⚠️ **`q` AT 2.1 IS WHAT MAKES IT ELECTRIC RATHER THAN MERELY GRANULAR.** A resonant peak over a
        coarse grain rings each grain at the cutoff, and a ringing grain is a spark; the same layer at
        `q` 1 is a rasp. It is the same knob the acid's bubbles use and the wumms' formant use, three
        characters out of one thing the table had never turned past 1.5.
      */
      { wave: 'noise', from: 1700, to: 330, at: 0.12, seconds: 0.22, gain: 0.36, attack: 0.002, curve: 3.5, lowFrom: 7000, lowTo: 1500, highFrom: 780, q: 2.1, drive: 0.42, pan: 0.65, panTo: -0.1 },
      /*
        THE LAST TICKS — 330 Hz is a grain every three milliseconds and 72 is one every fourteen, which
        is slow enough to hear as separate events. The crackle ends in countable ticks, which is the half
        a filtered wash can never have, and they ring too.
      */
      { wave: 'noise', from: 330, to: 72, at: 0.28, seconds: 0.38, gain: 0.26, attack: 0.004, curve: 2.7, lowFrom: 4200, lowTo: 820, highFrom: 360, q: 2.5, drive: 0.36, pan: -0.4, panTo: 0.55 },
      /*
        THE CLAP — short and dark, and fifty milliseconds behind the flash rather than on top of it. That
        gap is the whole difference between a bolt and a bang: light arrives first, which is the one thing
        everybody already knows about lightning without being told. Not weather — a report.
      */
      { wave: 'noise', from: 0, to: 0, at: 0.05, seconds: 0.42, gain: 0.521, attack: 0.004, curve: 2.8, lowFrom: 1400, lowTo: 125, highFrom: 68, q: 0.85, drive: 0.5 },
      // THE FLOOR — the fifth of the key falling below the root, under the clap and over before the ticks.
      { wave: 'sine', from: inKey(7), to: inKey(-5), seconds: 0.42, at: 0.05, gain: 0.62, attack: 0.003, curve: 3, drive: 0.35 },
      /*
        ── AND THE ROOM IT LANDS IN IS A NOTE — 0325 ───────────────────────────────────────────────────

        ⚠️ **NOTHING IN THIS CUE STATED A PITCH AND ONE LAYER OF IT IS PITCHED.** The floor above is a
        glide of nineteen semitones in under half a second, which the ear reads as a fall and not as a
        note; measured, the whole cue prefers the key's frequencies to the quarter-tones between them by
        **0.8 dB**, where the bed it plays over does it by 24.5. *"They sound discordant because they're
        in their own little area of sound."*

        ⚠️ **A HELD ROOT UNDER THE CLAP, AND THE CRACKLE IS NOT TOUCHED.** *"Don't change the lightning
        attack it's really good"* has been said twice and 0323 left the timbre alone for the third time;
        every grain layer above is still 0248's. What this adds is underneath all of them — the strike
        ringing a room, at 55 Hz, in the key the room is in.

        ⚠️ **IT ENDS BEFORE THE TICKS DO, SO THE CUE IS THE SAME LENGTH IT WAS.** 0.62 s against the
        ticks' 0.66: the guard that matters here is 0104's — a cue finishes before its own next volley —
        and this spends none of that margin.
      */
      { wave: 'sine', from: inKey(0), to: inKey(0), at: 0.06, seconds: 0.56, gain: 0.26, attack: 0.02, curve: 1.9, drive: 0.3, lowFrom: 320, lowTo: 180, q: 1 },
    ],
  },
  /**
   * The flying fish going through the edge of the lane on its entrance — 0313.
   *
   * ⚠️ **A SPRAY OF EMBERS AND NOT A SPLASH, BECAUSE THERE IS NO WATER AND NO SURFACE DRAWN.**
   * `src/content/themes.ts` says `ground: null` for the nebula — *"In space, and the Pillars are the
   * proof."* So what this is the sound of is **the fish and the place meeting**, four times in one
   * flight: something big displacing gas, a sheet thrown up off it, and embers crackling back down.
   * It is the only thing on the screen that says the animal went through anything —
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` with nothing else to
   * lean on.
   *
   * ⚠️ **THE SHEET'S LOWPASS OPENS UPWARD, WHICH NO NOISE LAYER IN THIS TABLE DOES.** 2.6 kHz to 9.5
   * over a third of a second: the sound gets WIDER as it goes, which is what a spray fanning out does
   * and is the opposite of everything else here — the acid thins upward as it dries, the bolt's grain
   * coarsens downward, and both are things running out. Two pitched layers already brighten this way
   * (`bomb`'s saw and `shield`'s square) and both do it under a note that is rising; this is the only
   * one where the widening IS the event.
   *
   * ⚠️ **AND IT IS NOT `bossAcid`'s SIZZLE WITH A NEW NAME.** That is a fine grain at 8.2 kHz thinning
   * upward over most of a second while its highpass rises. This is a broadband front with a coarse
   * crackle at 900 Hz under it — **an octave and a half apart** — over half the length.
   *
   * ⚠️ **IT DOES NOT DUCK, AND THE RULE SAYS SO RATHER THAN AN EXCEPTION DOING IT.** Half a second is
   * over a beat, but its twin is a thing APPEARING and a thing that appears recurs: the four crossings
   * of one breach are 0.82 s apart, which is inside a duck's own recovery. 0308's second axis, applied
   * to the first cue written after it.
   */
  bossBreach: {
    twin: 'breach-appears',
    // More room than the bolt's and less than a phase's: it happens in the open, and a spray with too
    // much air on it is weather rather than an impact.
    air: 0.34,
    onGrid: true,
    hold: 8,
    gain: 0.46,
    // Enough to hold the front and the crackle together as one event. Past this the grain flattens,
    // which is `bossAcid`'s own reason for staying low.
    glue: 0.22,
    layers: [
      /*
        THE WHOOMPH — the fifth of the key falling below the root, over in under a fifth of a second:
        something big displacing what it came through. 0089's *something low under it*, and the one
        layer here with a pitch.
      */
      { wave: 'sine', from: inKey(7), to: inKey(-4), seconds: 0.18, gain: 0.62, attack: 0.0025, curve: 3.6, drive: 0.32 },
      /*
        THE SHEET — white noise whose lowpass OPENS from 2.6 kHz to 9.5 while its highpass climbs under
        it. A band that widens upward and is cut from below is a sheet of spray leaving a surface: it
        starts as a thump with air in it and ends as hiss with no body left.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.58, attack: 0.0035, curve: 2, lowFrom: 2600, lowTo: 9500, highFrom: 700, highTo: 1600, q: 0.9, pan: -0.6, panTo: 0.6 },
      /*
        THE EMBERS — sample-and-hold at 900 Hz falling to 180, ringing at `q` 2.3. 900 is a grain every
        millisecond and 180 is one every five, so the crackle coarsens into countable sparks; the
        resonance is what makes each one ring rather than tick, which is the knob `bossBolt` uses to be
        electric and `bossAcid`'s bubbles use to be wet. Here it is fire.
      */
      { wave: 'noise', from: 900, to: 180, at: 0.06, seconds: 0.44, gain: 0.52, attack: 0.003, curve: 2.6, lowFrom: 5200, lowTo: 1400, highFrom: 380, q: 2.3, drive: 0.38, pan: 0.45, panTo: 0 },
      /*
        THE FALL-BACK — a finer grain, late and short, darkening fast: the sheet coming down again. It
        is the only layer that starts after the front has passed and ends before the embers do, which is
        what makes the figure a thing going up and then a thing coming down rather than one wash.
      */
      { wave: 'noise', from: 4200, to: 1100, at: 0.22, seconds: 0.22, gain: 0.223, attack: 0.004, curve: 3.4, lowFrom: 9000, lowTo: 2600, highFrom: 1200, q: 1.4, drive: 0.28, pan: -0.45, panTo: -0.85 },
      { wave: 'noise', from: 4200, to: 1100, at: 0.22, seconds: 0.22, gain: 0.223, attack: 0.004, curve: 3.4, lowFrom: 9000, lowTo: 2600, highFrom: 1200, q: 1.4, drive: 0.28, pan: 0.45, panTo: 0.85 },
      /*
        THE WAKE — a resonant peak travelling from 1.8 kHz down to 300 over a fifth of a second: the
        body going past. It is the acid's glop knob on a different sweep and a different band, and what
        it adds is MASS — without it the front is a spray with nothing in the middle of it.
      */
      { wave: 'noise', from: 0, to: 0, seconds: 0.2, gain: 0.46, attack: 0.002, curve: 4, lowFrom: 1800, lowTo: 300, highFrom: 90, q: 2.2, drive: 0.4 },
    ],
  },
  bossPhase: {
    twin: 'phase-burst',
    // The room is how a phase reads as an EVENT rather than as another hit.
    air: 0.55,
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
      { wave: 'noise', from: 0, to: 0, seconds: 0.04, gain: 0.26, attack: 0.0005, curve: 7, lowFrom: 8000, lowTo: 2800, highFrom: 800 },
      // The body: shorter than a kill's and wider, so a phase reads as a bigger event of the same
      // family rather than as a different machine.
      { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.527, attack: 0.003, curve: 3.4, lowFrom: 3000, lowTo: 700, highFrom: 140, highTo: 85, q: 0.8, drive: 0.35 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.45, gain: 0.027, attack: 0.02, curve: 2.4, lowFrom: 7500, highFrom: 1400, highTo: 760, pan: -0.35, panTo: -0.8 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.45, gain: 0.027, attack: 0.02, curve: 2.4, lowFrom: 7500, highFrom: 1400, highTo: 760, pan: 0.35, panTo: 0.8 },
      /*
        A2 → B3, and A1 → B2 under it. **A RISING MINOR SECOND**: the player gained something, so it
        rises like every gain in this table — and it lands one degree above the root, which is the
        one place in the scale that does not settle. *Good news, and it is not over.*
      */
      { wave: 'tri', from: inKey(7), to: inKey(15), seconds: 0.34, gain: 0.496, attack: 0.004, curve: 2.6, pan: -0.3, panTo: 0.3 },
      { wave: 'sine', from: inKey(0), to: inKey(8), seconds: 0.4, gain: 0.434, attack: 0.006, curve: 2.2 },
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
    // The wettest in the game. The fight is over and the place is what is left.
    air: 0.9,
    // +11.4 dB, once a level, and the loudest thing the game ever does. The deepest duck there is.
    duck: 0.42,
    // The loudest event in the game, so the one it costs most to have land off the grid — 0104.
    onGrid: true,
    hold: 30,
    gain: 0.468,
    glue: 0.14,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.134, attack: 0.0005, curve: 6, lowFrom: 6000, lowTo: 1900, highFrom: 600 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.5, gain: 0.462, attack: 0.006, curve: 2.1, lowFrom: 1900, lowTo: 330, highFrom: 95, highTo: 38, q: 0.7, drive: 0.4 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.7, gain: 0.018, attack: 0.03, curve: 1.9, lowFrom: 6000, highFrom: 1200, highTo: 620, pan: -0.3, panTo: -0.85 },
      { wave: 'noise', from: 0, to: 0, seconds: 1.7, gain: 0.018, attack: 0.03, curve: 1.9, lowFrom: 6000, highFrom: 1200, highTo: 620, pan: 0.3, panTo: 0.85 },
      // E3 → A1, and E2 → A0 under it. A FALLING FIFTH ONTO THE ROOT, which is the oldest cadence
      // there is and is the correct thing for the loudest event in the game: the level is over and
      // the player did it.
      { wave: 'sine', from: inKey(11), to: inKey(0), seconds: 1.6, gain: 0.546, attack: 0.002, curve: 1.7, drive: 0.3 },
      { wave: 'sine', from: inKey(4), to: inKey(-7), seconds: 1.75, gain: 0.357, attack: 0.02, curve: 1.4 },
      // The second rumble, arriving late. A boss coming apart is two events, not one.
      { wave: 'noise', from: 0, to: 0, seconds: 1.1, at: 0.22, gain: 0.168, attack: 0.02, curve: 2, lowFrom: 1500, lowTo: 320, highFrom: 300, highTo: 110, pan: -0.65, panTo: -0.25 },
      // THE ROLL, as the blast has it and bigger: the hulk coming apart in stages, on the right, then travelling.
      { wave: 'noise', from: 520, to: 110, at: 0.6, seconds: 0.9, gain: 0.3, attack: 0.08, curve: 2, lowFrom: 900, lowTo: 170, highFrom: 50, highTo: 30, q: 0.7, drive: 0.4, pan: 0.7, panTo: 0.3 },
      { wave: 'noise', from: 380, to: 70, at: 1.05, seconds: 0.9, gain: 0.26, attack: 0.12, curve: 1.9, lowFrom: 650, lowTo: 120, highFrom: 40, highTo: 28, q: 0.7, drive: 0.35, pan: -0.6, panTo: 0.6 },
    ],
  },
  /** A bomb was thrown. Rising, because the thing it turns into has not happened yet — 0053. */
  bomb: {
    twin: 'bomb-appears',
    // A press and its consequence — 0104. Only the consequence gets the room.
    air: 0.25,
    hold: 6,
    gain: 0.25,
    glue: 0.08,
    /*
      ⚠️ **A MISSILE LEAVING, WHERE IT WAS A TUBE AND A WHISTLE — 0375.** The bomb is *"a large forward
      firing missile like a h-bomb style thing"* now, and its sound was a lobbed thing's: a thump and a
      whistle rising to the fourth. The whistle was also the one pitched line in it that was not the root,
      and *"it doesn't gel with the background music at all."* So: a kick's fast drop onto the ROOT — the
      one note under every place's mode — an ignition roar that gets brighter as it goes, and the burn.
    */
    layers: [
      // The kick: a fast drop onto A, percussive rather than tonal.
      { wave: 'sine', from: inKey(7), to: inKey(0), seconds: 0.2, gain: 1, attack: 0.001, curve: 3.4, drive: 0.45 },
      // The ignition: a roar that opens upward as the missile leaves.
      { wave: 'noise', from: 0, to: 0, seconds: 0.5, gain: 0.46, attack: 0.012, curve: 1.8, lowFrom: 900, lowTo: 3600, highFrom: 140, q: 0.7, drive: 0.35, pan: 0, panTo: 0.25 },
      // The burn: held noise, a crackle that thins as it goes.
      { wave: 'noise', from: 110, to: 60, at: 0.05, seconds: 0.55, gain: 0.3, attack: 0.03, curve: 2, lowFrom: 700, lowTo: 380, highFrom: 50, q: 0.7, drive: 0.3, pan: 0, panTo: 0.35 },
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
    // The player paid a charge for this; the room is part of what they bought.
    // 0.62 → 0.75 with the blast that hits and rolls: a shorter, harder dry sound leaves the room more to say.
    air: 0.95,
    // +10.7 dB, and the player paid a charge for it — 0053.
    duck: 0.34,
    /*
      ⚠️ **Gridded even though the BOMB that throws it is not** — 0104. The two are a press and its
      consequence: the throw answers a button and must be immediate, and the blast lands `BLAST_STEPS`
      later on a clock the player is no longer holding. Only the second one is free to wait.
    */
    onGrid: true,
    hold: 6,
    gain: 0.535,
    glue: 0.14,
    /*
      ⚠️ **IT HITS, THEN IT ROLLS** — the other half of *"bomb noise."* Measured, the old blast's front edge was
      4.5 dB over its body: no impact, one long wash. An explosion heard from inside it is a crack, a slam of
      pressure, and then the roll of it coming back — so the crack is harder, the sub drops further and is
      driven, and a second, darker body arrives a sixth of a second in. The dry sound is over in six tenths of a second, so the
      tail is the ROOM's (0173) and not a longer brick.
    */
    layers: [
      // The crack, in the middle.
      { wave: 'noise', from: 0, to: 0, seconds: 0.045, gain: 0.42, attack: 0.0003, curve: 7, lowFrom: 7000, lowTo: 2400, highFrom: 700 },
      // The slam: the pressure, in the middle.
      { wave: 'noise', from: 0, to: 0, seconds: 0.5, gain: 0.38, attack: 0.014, curve: 3.2, lowFrom: 2600, lowTo: 320, highFrom: 100, highTo: 36, q: 0.7, drive: 0.6 },
      /*
        THE ROLL — three of them, each later, darker and quieter than the last, and each somewhere else: left,
        then right, then travelling from one side to the other. The noise is HELD rather than white (`from`
        falling from a few hundred a second to under a hundred), which is what turns a wash into something that
        crumbles and tumbles. *"Last rolling effects on the bomb."*
      */
      { wave: 'noise', from: 700, to: 160, at: 0.16, seconds: 0.6, gain: 0.36, attack: 0.05, curve: 2.2, lowFrom: 1100, lowTo: 200, highFrom: 60, highTo: 32, q: 0.7, drive: 0.4, pan: -0.65, panTo: -0.25 },
      { wave: 'noise', from: 520, to: 110, at: 0.46, seconds: 0.75, gain: 0.32, attack: 0.08, curve: 2, lowFrom: 800, lowTo: 160, highFrom: 50, highTo: 30, q: 0.7, drive: 0.4, pan: 0.7, panTo: 0.3 },
      { wave: 'noise', from: 380, to: 70, at: 0.8, seconds: 0.85, gain: 0.27, attack: 0.12, curve: 2.1, lowFrom: 600, lowTo: 120, highFrom: 40, highTo: 28, q: 0.7, drive: 0.35, pan: -0.55, panTo: 0.55 },
      // The debris: the only top left after the crack, scattering outward.
      { wave: 'noise', from: 0, to: 0, at: 0.05, seconds: 1.1, gain: 0.05, attack: 0.02, curve: 2, lowFrom: 6200, highFrom: 1200, highTo: 650, pan: -0.3, panTo: -0.8 },
      { wave: 'noise', from: 0, to: 0, at: 0.09, seconds: 1.05, gain: 0.05, attack: 0.02, curve: 2.1, lowFrom: 5600, highFrom: 1300, highTo: 700, pan: 0.3, panTo: 0.8 },
      /*
        ⚠️ **THE BOOM, ON THE ROOT AND NOTHING ELSE — 0375.** This was two sines gliding down from F to A
        over most of a second: a pitched line sweeping through every note between, over a score that
        holds its own mode, and the report was *"it's not explosiony and it doesn't gel with the
        background music at all."* An explosion's weight is a kick's fast drop and a driven sub, not a
        melody: a tenth of a second from A2 onto A1, and A0 held under it, both the root.
      */
      { wave: 'sine', from: inKey(7), to: inKey(0), seconds: 0.12, gain: 0.6, attack: 0.001, curve: 2.6, drive: 0.6 },
      { wave: 'sine', from: inKey(0), to: inKey(0), at: 0.02, seconds: 0.9, gain: 0.45, attack: 0.004, curve: 2.2, drive: 0.55 },
      { wave: 'sine', from: inKey(-7), to: inKey(-7), at: 0.02, seconds: 1.2, gain: 0.34, attack: 0.01, curve: 1.9, drive: 0.25 },
    ],
  },
  /*
    ── THE SPECIALS' OWN — `docs/decisions/0378-the-specials-are-heard.md` ──────────────────────────

    Five specials borrowed other sounds: the surges the shield's, the storm the arc's zap, the
    whirlpool the blade's throw, and the storm's ball and the void the bomb's launch and boom. Each is
    now its own, named on its row. They keep 0375's lesson — the bomb's rebuild on the root is the one
    special sound approved by ear — so every pitch here is the root, its fifth or its octaves, and the
    character is in the noise, the filters and the pan, where the key cannot object.

    A press is immediate and a consequence is on the grid (0104): the surges, the throws and the
    whirlpool answer a button; the storm going off and the rift opening land on a clock the player is
    no longer holding.
  */
  /**
   * The purple surge: seekers hunting. Dark, and it LOCKS ON — a swell on the root with a pulse under
   * it, and two pings an octave apart, left then right, the sound of a seeker finding something.
   */
  hunt: {
    twin: 'aura-appears',
    air: 0.4,
    hold: 6,
    gain: 0.36,
    glue: 0.1,
    layers: [
      // The swell: the root, rising into the aura rather than struck.
      { wave: 'sine', from: inKey(0), to: inKey(0), seconds: 0.75, gain: 0.55, attack: 0.09, curve: 2.2, drive: 0.3 },
      // The pulse: a filtered square on A2 whose filter opens, vibrating like something tracking.
      { wave: 'square', from: inKey(7), to: inKey(7), seconds: 0.7, gain: 0.3, attack: 0.05, curve: 2, lowFrom: 300, lowTo: 1500, highFrom: 90, q: 1.8, vibrato: 30 },
      // The two pings: A4 then A5, one each side — the lock.
      { wave: 'sine', from: inKey(21), to: inKey(21), at: 0.04, seconds: 0.22, gain: 0.32, attack: 0.003, curve: 4.5, pan: -0.5 },
      { wave: 'sine', from: inKey(28), to: inKey(28), at: 0.2, seconds: 0.26, gain: 0.28, attack: 0.003, curve: 4.5, pan: 0.5 },
      // A breath of dark noise under it, drifting across.
      { wave: 'noise', from: 0, to: 0, seconds: 0.6, gain: 0.14, attack: 0.06, curve: 2.4, lowFrom: 1400, lowTo: 500, highFrom: 180, pan: 0.4, panTo: -0.4 },
    ],
  },
  /**
   * The golden surge: the missiles overdriven. Bright and driven — a kick onto the root and an engine
   * revving up the octave in a fifth, with a sizzle over the top.
   */
  overdrive: {
    twin: 'aura-appears',
    air: 0.35,
    hold: 6,
    gain: 0.38,
    glue: 0.16,
    layers: [
      // The kick onto the root.
      { wave: 'sine', from: inKey(7), to: inKey(0), seconds: 0.16, gain: 0.8, attack: 0.001, curve: 3, drive: 0.5 },
      // The rev: A2 up to A3, and its fifth E3 up to E4 beside it, filters opening as they climb.
      { wave: 'saw', from: inKey(7), to: inKey(14), at: 0.03, seconds: 0.55, gain: 0.3, attack: 0.03, curve: 2.2, lowFrom: 700, lowTo: 4200, highFrom: 120, q: 1.1, drive: 0.5, pan: -0.3 },
      { wave: 'saw', from: inKey(11), to: inKey(18), at: 0.03, seconds: 0.55, gain: 0.22, attack: 0.03, curve: 2.2, lowFrom: 700, lowTo: 4200, highFrom: 160, q: 1.1, drive: 0.5, pan: 0.3 },
      // The sizzle: bright noise, widening.
      { wave: 'noise', from: 0, to: 0, at: 0.05, seconds: 0.5, gain: 0.12, attack: 0.02, curve: 2.6, lowFrom: 9000, highFrom: 3200, highTo: 2000, pan: 0, panTo: 0.5 },
    ],
  },
  /**
   * A storm's ball leaves — charge, not ignition. A crackle of held noise falling as it goes, a buzz
   * dropping an octave onto A3, and a small thump on the root.
   */
  stormThrow: {
    twin: 'bomb-appears',
    // A press and its consequence — 0104. Only the consequence gets much of the room.
    air: 0.2,
    hold: 6,
    gain: 0.34,
    glue: 0.1,
    layers: [
      { wave: 'noise', from: 2600, to: 700, seconds: 0.42, gain: 0.55, attack: 0.004, curve: 2.4, lowFrom: 7000, lowTo: 2600, highFrom: 900, q: 0.8, pan: 0, panTo: 0.3 },
      { wave: 'square', from: inKey(21), to: inKey(14), seconds: 0.3, gain: 0.26, attack: 0.004, curve: 3, lowFrom: 3200, lowTo: 1200, highFrom: 200, q: 1.4 },
      { wave: 'sine', from: inKey(14), to: inKey(0), seconds: 0.14, gain: 0.6, attack: 0.001, curve: 3.2, drive: 0.35 },
    ],
  },
  /**
   * The storm goes off: a thunderclap, crackle running both ways across the screen with the strikes,
   * two zaps on the octaves, and thunder rolling in behind on the root.
   */
  storm: {
    twin: 'storm-strikes',
    air: 0.8,
    // The player paid a charge for this; the track makes room for it, a little less than for the bomb.
    duck: 0.3,
    onGrid: true,
    hold: 6,
    gain: 0.45,
    glue: 0.14,
    layers: [
      // The clap.
      { wave: 'noise', from: 0, to: 0, seconds: 0.06, gain: 0.5, attack: 0.0004, curve: 6, lowFrom: 9000, lowTo: 3000, highFrom: 1200 },
      // The crackle, running left to right and back, sample-and-hold so it snaps rather than hisses.
      { wave: 'noise', from: 3400, to: 900, at: 0.01, seconds: 0.7, gain: 0.3, attack: 0.004, curve: 2.2, lowFrom: 8000, lowTo: 3000, highFrom: 1400, pan: -0.8, panTo: 0.7 },
      { wave: 'noise', from: 3000, to: 700, at: 0.12, seconds: 0.7, gain: 0.26, attack: 0.004, curve: 2.2, lowFrom: 7000, lowTo: 2600, highFrom: 1300, pan: 0.8, panTo: -0.6 },
      // Two zaps, A5 down to A4, one each side.
      { wave: 'square', from: inKey(28), to: inKey(21), at: 0.02, seconds: 0.14, gain: 0.2, attack: 0.001, curve: 4, lowFrom: 6000, highFrom: 500, pan: -0.5 },
      { wave: 'square', from: inKey(28), to: inKey(21), at: 0.21, seconds: 0.14, gain: 0.18, attack: 0.001, curve: 4, lowFrom: 6000, highFrom: 500, pan: 0.5 },
      // The thunder: a held rumble rolling in, and the root under it.
      { wave: 'noise', from: 320, to: 60, at: 0.08, seconds: 1.3, gain: 0.34, attack: 0.08, curve: 2, lowFrom: 1000, lowTo: 160, highFrom: 40, highTo: 28, q: 0.7, drive: 0.4, pan: -0.3, panTo: 0.3 },
      { wave: 'sine', from: inKey(0), to: inKey(0), at: 0.03, seconds: 1.05, gain: 0.42, attack: 0.02, curve: 2.1, drive: 0.45 },
    ],
  },
  /**
   * The whirlpool opens — turning. Two whooshes sweeping across the stereo field in opposite
   * directions as the arms open, a tone rising an octave as it grows, and the steel of the blades
   * ringing on A5 over it.
   */
  whirlpool: {
    twin: 'whirl-appears',
    air: 0.5,
    hold: 6,
    gain: 0.4,
    glue: 0.1,
    layers: [
      { wave: 'noise', from: 0, to: 0, seconds: 0.9, gain: 0.42, attack: 0.08, curve: 2, lowFrom: 700, lowTo: 4200, highFrom: 220, highTo: 600, q: 1.6, pan: -0.85, panTo: 0.85 },
      { wave: 'noise', from: 0, to: 0, at: 0.28, seconds: 0.9, gain: 0.34, attack: 0.08, curve: 2.1, lowFrom: 900, lowTo: 5000, highFrom: 300, highTo: 800, q: 1.6, pan: 0.85, panTo: -0.85 },
      { wave: 'tri', from: inKey(7), to: inKey(14), seconds: 1.1, gain: 0.36, attack: 0.05, curve: 2.2, vibrato: 18 },
      { wave: 'sine', from: inKey(28), to: inKey(28), at: 0.06, seconds: 0.9, gain: 0.12, attack: 0.004, curve: 3.2, pan: 0.2, panTo: -0.2 },
      { wave: 'sine', from: inKey(0), to: inKey(0), seconds: 0.5, gain: 0.4, attack: 0.02, curve: 2.6, drive: 0.25 },
    ],
  },
  /**
   * A void leaves: low and hollow. A sub falling from the root an octave, a hollow triangle falling
   * with it, and dark air closing behind it.
   */
  voidThrow: {
    twin: 'bomb-appears',
    air: 0.25,
    hold: 6,
    gain: 0.34,
    glue: 0.12,
    layers: [
      { wave: 'sine', from: inKey(7), to: inKey(0), seconds: 0.4, gain: 0.8, attack: 0.004, curve: 2.4, drive: 0.35 },
      { wave: 'tri', from: inKey(14), to: inKey(7), seconds: 0.45, gain: 0.3, attack: 0.01, curve: 2.6, lowFrom: 1400, highFrom: 80 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.45, gain: 0.22, attack: 0.02, curve: 2.4, lowFrom: 2200, lowTo: 300, highFrom: 90, pan: 0, panTo: 0.3 },
    ],
  },
  /**
   * A rift opens: everything is PULLED IN. Air rushing inward as its filter closes, a thud on the
   * root as it seals, and then the rift held open — a hollow drone on the root with dark air turning
   * in it — dying away over the second and a half the rift is open.
   */
  rift: {
    twin: 'rift-opens',
    air: 0.7,
    duck: 0.32,
    onGrid: true,
    hold: 6,
    gain: 0.44,
    glue: 0.12,
    layers: [
      // The pull: bright air closing to dark, from both sides into the middle.
      { wave: 'noise', from: 0, to: 0, seconds: 0.32, gain: 0.36, attack: 0.02, curve: 1.6, lowFrom: 8000, lowTo: 500, highFrom: 300, highTo: 120, pan: -0.7, panTo: 0 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.32, gain: 0.36, attack: 0.02, curve: 1.6, lowFrom: 8000, lowTo: 500, highFrom: 300, highTo: 120, pan: 0.7, panTo: 0 },
      // The seal: A2 onto A1, driven — under the drone's level rather than over it, or the row's gain
      // is spent on the thud and the rift itself is heard as a tail.
      { wave: 'sine', from: inKey(7), to: inKey(0), at: 0.22, seconds: 0.22, gain: 0.55, attack: 0.001, curve: 3, drive: 0.55 },
      /*
        The drone: the root held, and a hollow octave over it. ⚠️ **Weighed 7 dB under the blast at
        first** — a consequence the player paid a charge for, as the blast is — because the drone was
        under the seal and A-weighting hears little of a sub. The octave and the air carry it now.
      */
      { wave: 'sine', from: inKey(0), to: inKey(0), at: 0.24, seconds: 1.35, gain: 0.36, attack: 0.03, curve: 2.2, drive: 0.4 },
      // ⚠️ A saw rather than a triangle, and filtered: A-weighting hears almost nothing of A1, so the
      // drone's weight has to be in its harmonics, where the ear is.
      { wave: 'saw', from: inKey(7), to: inKey(7), at: 0.26, seconds: 1.25, gain: 0.5, attack: 0.06, curve: 2.4, lowFrom: 1600, lowTo: 500, highFrom: 70, q: 1.2, drive: 0.35, vibrato: 12 },
      // Dark air turning inside it, closing as the rift does.
      { wave: 'noise', from: 240, to: 60, at: 0.28, seconds: 1.3, gain: 0.56, attack: 0.06, curve: 2.4, lowFrom: 1800, lowTo: 300, highFrom: 60, q: 0.7, pan: -0.5, panTo: 0.5 },
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
    // Rising, and the tail is what carries the rise past its own 0.2 s.
    air: 0.34,
    onGrid: true,
    hold: 6,
    gain: 0.323,
    glue: 0.08,
    layers: [
      // A4 → A5, A3 → A4, C4 → C5: octaves of the ROOT and of the minor third, rising. Everything
      // the player gains rises an octave, and this is the one they gain by surviving.
      { wave: 'sine', from: inKey(21), to: inKey(28), seconds: 0.16, gain: 0.62, attack: 0.002, curve: 4, pan: -0.25 },
      { wave: 'square', from: inKey(14), to: inKey(21), seconds: 0.14, gain: 0.26, attack: 0.002, curve: 5, lowFrom: 4500, lowTo: 7000, highFrom: 300, q: 1.2 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.1, gain: 0.161, attack: 0.001, curve: 6, lowFrom: 11000, highFrom: 2400, highTo: 5000, pan: -0.45, panTo: -0.7 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.1, gain: 0.161, attack: 0.001, curve: 6, lowFrom: 11000, highFrom: 2400, highTo: 5000, pan: 0.45, panTo: 0.7 },
      { wave: 'tri', from: inKey(16), to: inKey(23), seconds: 0.18, gain: 0.34, attack: 0.002, curve: 3.8, pan: 0.25 },
      // G2 → A2, which is the only step in the table smaller than an octave: the low body leans one
      // degree up into the root rather than sitting on a fixed note under a rising cue.
      { wave: 'sine', from: inKey(6), to: inKey(7), seconds: 0.2, gain: 0.5, attack: 0.002, curve: 3.4 },
    ],
  },
  /**
   * The run lost a ship. Falling, long, and the only cue with nothing above it in the mix.
   *
   * ── ⚠️ AND IT LANDS ON THE ROOT NOW, WHICH REVERSES THE ONE CHOICE 0099 WAS PROUDEST OF — 0323 ─────
   *
   * ⚠️ **REPORTED**: *"the player's death needs to sound better, you're going to be hear the death noise
   * a lot so it needs to be a sound you want to hear over and over and over again."*
   *
   * ⚠️ **THE OLD NOTE BELOW THIS ONE SAID *it is the only cue in the game that ends unfinished*, AND
   * MEANT IT AS THE FEATURE.** A fall from the sixth onto the seventh, so *"the ear is left waiting for a
   * note that never comes."* That is a fine idea about a sound heard once and a bad one about a sound
   * heard two hundred times: an unresolved cadence is a question, and a question you are asked every
   * ninety seconds is the definition of nagging. **The ask is the answer**: what you want to hear again
   * is a thing that finishes.
   *
   * ⚠️ **SO IT FALLS ONTO THE ROOT, AND A BELL IN THE KEY RINGS OVER IT.** F3 → A1 where it was F3 → G1,
   * the low body onto the octave below the root, and two `tri` voices a minor third apart — the key's own
   * colour — struck a tenth of a second in and left to ring for most of a second. The impact is still an
   * impact, the fall is still a fall, and what is different is that the thing stops asking.
   *
   * ⚠️ **AND THE NOISE IS DARKER AND SHORTER BY A FIFTH**, because what was making it a crash rather than
   * a toll was a 1.15 s band of noise over the whole figure. The bell is what the tail is for now.
   */
  death: {
    twin: 'ship-burst',
    // The biggest room in the table, and the bell 0323 put in it is the layer that needs one.
    air: 0.7,
    // +11.1 dB. The run just lost a ship; the track getting out of the way is the point.
    duck: 0.4,
    /*
      ⚠️ **The ship comes apart over 48 steps (0079), so a tenth of a second of wait is inside the
      first twelfth of the event.** A death is the most-watched thing a run does and the one moment
      the music should sound like it meant to happen.
    */
    onGrid: true,
    hold: 30,
    gain: 0.535,
    glue: 0.14,
    /*
      ⚠️ **THE SHIP DIES IN THREE BEATS, WHERE IT WENT OFF ONCE** — *"we also need to make a lot better… player
      death noise."* The picture comes apart over 48 steps (0079) and the sound was one event at step zero with a
      tail. It is the hit, the reactor running down, and the second burst that finishes it — and then 0323's
      bell, because that decision's whole point stands: it resolves, and it is a sound you can hear two hundred
      times.
    */
    layers: [
      // THE HIT.
      { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.34, attack: 0.0004, curve: 6.5, lowFrom: 5200, lowTo: 1600, highFrom: 600 },
      // THE BODY.
      { wave: 'noise', from: 0, to: 0, seconds: 0.6, gain: 0.34, attack: 0.014, curve: 2.8, lowFrom: 1900, lowTo: 280, highFrom: 95, highTo: 40, q: 0.7, drive: 0.5 },
      // THE SECOND BURST, a third of a second in and off to the right — the one that finishes it.
      { wave: 'noise', from: 0, to: 0, at: 0.34, seconds: 0.7, gain: 0.34, attack: 0.004, curve: 2.4, lowFrom: 1500, lowTo: 200, highFrom: 70, highTo: 34, q: 0.7, drive: 0.45, pan: 0.45, panTo: 0.2 },
      // F3 → A1: it resolves to the root, which is 0323's whole change and is kept. `tests/sound.test.ts` names this layer.
      { wave: 'sine', from: inKey(12), to: inKey(0), seconds: 1.2, gain: 0.459, attack: 0.001, curve: 1.9, drive: 0.35 },
      { wave: 'sine', from: inKey(5), to: inKey(-7), at: 0.34, seconds: 1, gain: 0.289, attack: 0.01, curve: 2 },
      // THE REACTOR RUNNING DOWN — two octaves, E5 to E3, through a filter that closes with it, drifting across.
      { wave: 'saw', from: inKey(25), to: inKey(11), at: 0.04, seconds: 0.6, gain: 0.07, attack: 0.01, curve: 1.5, lowFrom: 3200, lowTo: 500, q: 1.2, drive: 0.3, pan: -0.5, panTo: 0.4 },
      // THE THIRD, smaller and to the left, and then the wreck ROLLING away — held noise, tumbling, side to side.
      { wave: 'noise', from: 0, to: 0, at: 0.68, seconds: 0.55, gain: 0.28, attack: 0.004, curve: 2.6, lowFrom: 1200, lowTo: 180, highFrom: 60, highTo: 32, q: 0.7, drive: 0.4, pan: -0.55, panTo: -0.3 },
      { wave: 'noise', from: 460, to: 70, at: 0.85, seconds: 1.1, gain: 0.27, attack: 0.1, curve: 1.8, lowFrom: 700, lowTo: 120, highFrom: 40, highTo: 28, q: 0.7, drive: 0.35, pan: 0.6, panTo: -0.6 },
      // THE DEBRIS, scattering outward.
      { wave: 'noise', from: 0, to: 0, at: 0.34, seconds: 1.4, gain: 0.045, attack: 0.03, curve: 1.9, lowFrom: 5200, highFrom: 1100, highTo: 580, pan: -0.3, panTo: -0.85 },
      { wave: 'noise', from: 0, to: 0, at: 0.4, seconds: 1.3, gain: 0.045, attack: 0.03, curve: 2, lowFrom: 4800, highFrom: 1200, highTo: 620, pan: 0.3, panTo: 0.85 },
      // THE BELL — 0323's, a minor third, one note each side now, struck after the second burst and left to ring.
      { wave: 'tri', from: inKey(14), to: inKey(13), at: 0.42, seconds: 0.95, gain: 0.11, attack: 0.004, curve: 1.2, release: 0.5, pan: -0.4 },
      { wave: 'tri', from: inKey(16), to: inKey(15), at: 0.46, seconds: 0.9, gain: 0.075, attack: 0.005, curve: 1.3, release: 0.5, pan: 0.4 },
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
    // A small bright thing in a large dark place.
    air: 0.3,
    onGrid: true,
    hold: 4,
    gain: 0.296,
    glue: 0.06,
    layers: [
      // E and B, rising an octave each — the fifth and the ninth, which is the brightest pair the
      // natural minor has and the only cue in the game built on two notes at once.
      { wave: 'sine', from: inKey(25), to: inKey(32), seconds: 0.13, gain: 0.55, attack: 0.002, curve: 4, pan: -0.25 },
      { wave: 'sine', from: inKey(29), to: inKey(36), seconds: 0.13, at: 0.02, gain: 0.26, attack: 0.004, curve: 4.5, pan: 0.35 },
      { wave: 'tri', from: inKey(18), to: inKey(25), seconds: 0.15, gain: 0.34, attack: 0.002, curve: 4 },
      { wave: 'sine', from: inKey(11), to: inKey(18), seconds: 0.17, gain: 0.46, attack: 0.002, curve: 3.4 },
      { wave: 'sine', from: inKey(36), to: inKey(43), seconds: 0.1, at: 0.01, gain: 0.13, attack: 0.002, curve: 5, pan: -0.5, panTo: 0.5 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.099, attack: 0.001, curve: 6, lowFrom: 12000, highFrom: 3200, highTo: 7000, pan: -0.45, panTo: -0.7 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.099, attack: 0.001, curve: 6, lowFrom: 12000, highFrom: 3200, highTo: 7000, pan: 0.45, panTo: 0.7 },
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
    // It has no position — the one cue that is ALL room and no field.
    air: 0.5,
    hold: 6,
    gain: 0.296,
    glue: 0.06,
    layers: [
      // F → C, a rising fifth, in four octaves at once. It is the only cue whose interval is the
      // same in every layer, which is what makes *did that work* read as one clean answer.
      { wave: 'sine', from: inKey(26), to: inKey(30), seconds: 0.14, gain: 0.55, attack: 0.003, curve: 4, pan: -0.2 },
      { wave: 'tri', from: inKey(19), to: inKey(23), seconds: 0.16, gain: 0.3, attack: 0.003, curve: 4, pan: 0.2 },
      { wave: 'sine', from: inKey(12), to: inKey(16), seconds: 0.2, gain: 0.44, attack: 0.003, curve: 3.2 },
      { wave: 'tri', from: inKey(33), to: inKey(37), seconds: 0.1, gain: 0.16, attack: 0.003, curve: 5, pan: 0.45, panTo: -0.45 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.06, gain: 0.087, attack: 0.001, curve: 6, lowFrom: 12000, highFrom: 3600, highTo: 7000, pan: -0.45, panTo: -0.7 },
      { wave: 'noise', from: 0, to: 0, seconds: 0.06, gain: 0.087, attack: 0.001, curve: 6, lowFrom: 12000, highFrom: 3600, highTo: 7000, pan: 0.45, panTo: 0.7 },
    ],
  },
};
