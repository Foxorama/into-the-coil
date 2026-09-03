/**
 * The music: four patterns turned into four loops at boot, played at four gains.
 *
 * `docs/decisions/0090-the-music-is-four-loops.md`. The tables are next door in
 * `src/content/music.ts`; what is here is the expansion, the mixer and the one rule that decides how
 * far up the ladder a run has got.
 *
 * ── THREE HALVES, ON `src/app/sound.ts`'s OWN TERMS ─────────────────────────────────────────────
 *
 * 1. `bakeLoops` — patterns in, `Float32Array`s out. **No browser in it**, so `scripts/hear.mjs`
 *    can write the music to a `.wav` for the only instrument that can judge it — 0027 for the
 *    channel with nothing to look at.
 * 2. `musicLevelFor` — how far up the ladder the run is. Pure arithmetic over two numbers, so
 *    `tests/music.test.ts` drives it directly and no browser is involved in the thing most likely to
 *    be wrong.
 * 3. `makeMusicOut` — the only part that knows Web Audio exists.
 *
 * ⚠️ **The synthesiser is `src/app/sound.ts`'s and is imported rather than repeated.** A note is a
 * `CueLayer`; the music and the effects come out of one instrument, which is what stops the
 * soundtrack sounding like it was made somewhere else. What this file adds is the wrap-around, which
 * is the only thing a loop needs that a cue does not.
 */

import {
  BEAT_SECONDS,
  BAR_SECONDS,
  secondsOfLayer,
  MUSIC_DRIVE,
  MUSIC_GAIN,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_ROOT,
  BOSS_PEAK_HEALTH,
  AURA_LAYERS,
  LAYER_PAN,
  AURA_NEAR_UNITS,
  AURA_FAR_UNITS,
  AURA_CURVE,
  AURA_ONSET_UNITS,
  PHRASE_SECONDS,
  type MusicLayer,
  type MusicLevel,
  type MusicVoice,
  type LevelSections,
} from '../content/music.ts';
import { sampleLayerInto, saturate } from './sound.ts';
import {
  THEMES,
  airOf,
  auraCeilingOf,
  mixOf,
  rungOf,
  voicesOf,
  type ThemeKind,
  type ThemeLadder,
} from '../content/themes.ts';
import { MUSIC_ROLES, roleOf } from '../content/arrangement.ts';
import { LEVELS, LEVEL_KINDS, type LevelRow } from '../content/levels.ts';
import { makeRng, type Rng } from '../sim/rng.ts';
/*
  ⚠️ **THE ROOM'S CAMERA MOVES AT THE GAME'S OWN RATE, AND THESE TWO CONSTANTS ARE THAT CLAIM** —
  0212. A walk at any other speed would put every build at a moment the player has never heard it
  arrive, which is the reported defect rebuilt out of a different part: the arrangement is authored
  in bars and the sections in units, and only one ratio holds the two together.
*/
import { SCROLL_PER_STEP } from '../sim/flight.ts';
/*
  ⚠️ **`STEPS_PER_SECOND` AND NOT `1000 / STEP_MS`, WHICH IS ARITHMETIC AND NOT PEDANTRY.**
  `src/app/loop.ts` states the step as `1000 / 60` ms, so dividing back out lands on 59.99999999999999
  and the room walks at 35.99999999999999 units a second — right to eleven places and not equal to
  anything. The whole number is the one description; the millisecond is derived from it.
*/
import { STEPS_PER_SECOND } from '../state/screens.ts';

/**
 * One note of one voice, at `at` seconds into its layer's loop.
 *
 * ⚠️ **Every note is rendered with WRAP, which is the whole difference between a loop and a bar.** A
 * note whose tail runs past the end has to arrive at the start of the buffer, or every repetition
 * has a silent notch where the decay should be — and it is audible immediately, because it happens
 * at the same place every loop.
 *
 * ⚠️ **It was `renderVoice` and the loop over the pattern moved OUT of it** —
 * `docs/decisions/0102-the-music-goes-somewhere.md`. `layerNotes` needs one job per note to keep the
 * prewarm under a frame, and a note is the smallest thing this can be split into: the walk over the
 * pattern lives in exactly one place either way.
 */
function renderNote(voice: MusicVoice, value: number, step: number, at: number, rate: number, rng: Rng, into: Float32Array): void {
  {
    /*
      ⚠️ **A pitched voice REPLACES the note's own sweep and a drum keeps it.** A kick is a fall from
      150 to 45 whatever the key is; a bass note is the key. One field, two meanings, and the row
      says which — `src/content/music.ts` has the argument.
    */
    /*
      ⚠️ **AN UNPITCHED STEP IS A VELOCITY, AND IT USED TO BE A FLAG** —
      `docs/decisions/0102-the-music-goes-somewhere.md`. Reported from play: *"the metronome doesn't
      fit the other beat… it sounds like two separate tracks being played at the same time."*

      ⚠️ **There was no accent anywhere in the model, so every drum was bit-identical**, and
      identical repetition at a fixed interval IS a metronome — there is no tuning that makes it
      anything else. `src/content/music.ts` even claimed its hats were *"alternating loud and quiet,
      which is what makes them a shuffle rather than a machine"*; the pattern was thirty-two ones. The
      comment described something the data could not say.

      ⚠️ **One multiply, and the field already carried the number.** `steps` was documented as *whether
      the note plays at all* for a drum, and every value in every table was 1 — so reading it as a
      gain is backwards-compatible to the sample and turns a rest-or-play list into a groove.
    */
    /*
      ⚠️ **AND A PITCHED NOTE HAS A WEIGHT NOW, WHICH IT NEVER HAD** — 0108. A pitched `steps` entry
      is a semitone, so 0102's trick of reading it as a velocity was unavailable to exactly half the
      piece: the arp, the groove, the chords' sub and the lead were each struck at one weight for
      every note they have ever played. `accents` is the missing axis, indexed by position in the
      pattern so it belongs to the beat rather than to the note —
      `src/content/music.ts` has the argument.

      ⚠️ **Absent is 1 and costs nothing**, so a voice that wants to be flat says nothing and the
      object is not rebuilt.
    */
    const pitch = voice.pitched ? MUSIC_ROOT * Math.pow(2, voice.octave + value / 12) : 0;
    const accent = voice.accents === undefined ? 1 : voice.accents[step % voice.accents.length] ?? 1;
    const note = voice.pitched
      ? accent === 1
        ? { ...voice.note, from: pitch, to: pitch }
        : { ...voice.note, from: pitch, to: pitch, gain: voice.note.gain * accent }
      : value === 1
        ? voice.note
        : { ...voice.note, gain: voice.note.gain * value };
    sampleLayerInto(note, rate, rng, into, Math.round(at * rate), true);
  }
}

/**
 * Every loop, in `MUSIC_LAYERS` order — **and they are no longer all the same length.**
 *
 * ⚠️ **Each layer gets its OWN named stream** — `docs/decisions/0021-one-stream-per-concern.md`. The
 * only randomness in the music is the noise in the drums, and without this a fifth layer added later
 * would re-roll the four above it. It costs nothing and it is the rule.
 *
 * ⚠️ **A LAYER IS A WHOLE MULTIPLE OF THE SHORTEST, WHICH IS 0090 AMENDED RATHER THAN BROKEN** —
 * `docs/decisions/0095-the-level-has-its-own-music.md`. Identical lengths were how 0090 guaranteed
 * that four loops started together can never come apart; **whole multiples give exactly the same
 * guarantee** — a 4-bar pad and a 2-bar drum loop realign every 4 bars, for ever, because both are
 * an exact number of samples. What identical lengths also did was forbid a chord progression, and a
 * progression is what a power ballad IS.
 */
/*
  ⚠️ **`theme` IS OPTIONAL AND MEANS *WHICH PLACE'S MATERIAL*** — 0128. Absent is the base
  composition, which is the title screen and every fixture; a place that states no voices of its own
  bakes byte-identical audio, and `tests/themes.test.ts` asserts that rather than assuming it.
*/
export function bakeLoops(rate: number, theme?: ThemeKind): Record<MusicLayer, Float32Array> {
  const out = {} as Record<MusicLayer, Float32Array>;
  for (const layer of MUSIC_LAYERS) out[layer] = bakeLayer(layer, rate, theme);
  return out;
}

/**
 * One layer, on its own.
 *
 * ⚠️ **Split out so the synthesis can be spread across frames** —
 * `docs/decisions/0102-the-music-goes-somewhere.md`. The whole set is about six hundred milliseconds
 * and it used to run inside the first gesture, which is what capped how much music there could be
 * (0095 says so in as many words). `src/app/sound.ts`'s prewarm walks these one at a time on the
 * title screen instead.
 *
 * ⚠️ **The root is made HERE and not passed in**, which is what keeps the two paths identical: a
 * layer's stream is `makeRng('music').stream(layer)` whether it was baked in a loop with its
 * neighbours or on its own three frames later. `docs/decisions/0021-one-stream-per-concern.md` is the
 * rule, and *the same game sounds different depending on how fast you pressed* is what breaking it
 * would cost.
 */
export function bakeLayer(layer: MusicLayer, rate: number, theme?: ThemeKind): Float32Array {
  const { buffer, notes } = layerNotes(layer, rate, theme);
  for (const note of notes) note();
  return buffer;
}

/**
 * A layer's buffer and one job per NOTE, so the synthesis can be spread across frames.
 *
 * ── PER NOTE AND NOT PER LAYER, WHICH A MEASUREMENT DECIDED ─────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0102-the-music-goes-somewhere.md`.** The prewarm's first version walked
 * LAYERS, and `chords` — six voices of long detuned pads over eight bars — measured **428ms** on its
 * own. A 428ms job on the title screen is a freeze whether it happens on the gesture or not; moving
 * a hitch is not the same as removing one.
 *
 * ⚠️ **A note is the natural grain and it is about thirty milliseconds at the very worst** — the
 * drone's pad, 4.6 beats of saw behind two filters. Everything else is far under a frame.
 *
 * ⚠️ **The generator is made once per LAYER and closed over**, because the voices of a layer draw
 * from one stream in order (`docs/decisions/0021-one-stream-per-concern.md`). Running the jobs in
 * the order they are returned reproduces `bakeLayer` exactly, and `tests/sound.test.ts` holds that
 * the two paths agree sample for sample.
 */
export function layerNotes(
  layer: MusicLayer,
  rate: number,
  theme?: ThemeKind,
): { buffer: Float32Array; notes: (() => void)[] } {
  const seconds = secondsOfLayer(layer);
  const buffer = new Float32Array(Math.round(seconds * rate));
  const rng = makeRng('music').stream(layer);
  const notes: (() => void)[] = [];
  for (const voice of voicesOf(theme, layer)) {
    const step = BEAT_SECONDS / voice.perBeat;
    for (let i = 0; i < voice.steps.length; i++) {
      const value = voice.steps[i];
      if (value === null || value === undefined) continue;
      const at = i * step;
      if (at >= seconds) break;
      notes.push(() => renderNote(voice, value, i, at, rate, rng, buffer));
    }
  }
  /*
    ⚠️ **THE ROOM IS THE LAST JOB, because it is a property of the LAYER and not of a note** — 0136.
    Both paths run these in order — `bakeLayer` straight through, `bakePlace` and the prewarm one at a
    time across frames — so a job appended here is a job that runs after every note of this layer has
    landed in the buffer, on either.
  */
  const wet = airOf(theme, layer);
  if (wet > 0) notes.push(() => addRoom(buffer, rate, wet));
  return { buffer, notes };
}

/**
 * The delays a room is built from, in seconds, and how far each one comes back.
 *
 * ⚠️ **PRIME-ISH AND UNRELATED TO THE BEAT, which is the whole reason it sounds like a room.** A tap
 * at a musical interval is an echo — the ear hears a repeat of the note. These are 71, 113 and 167
 * milliseconds: close enough together to smear into one another, far enough from 400 ms and its
 * divisors that nothing lands on a beat.
 *
 * ⚠️ **Three is enough because they FEED BACK.** Each pass reads samples earlier passes have already
 * written, so three taps at 0.6 give a decaying series that is still audible eight or nine repeats
 * later — a tail of about a second and a half, which is a stone building.
 */
const ROOM_TAPS: readonly [number, number][] = [
  [0.0717, 0.84],
  [0.1131, 0.82],
  [0.1669, 0.79],
];

/**
 * How much of the top a comb loses each time round.
 *
 * ⚠️ **Air absorbs treble and a tail that does not is a spring, not a room.** One pole per comb, so
 * the tenth repeat is dull where the first was bright — which is most of what tells an ear *stone*
 * rather than *delay pedal*.
 */
const ROOM_DAMP = 0.36;

/**
 * What the summed combs are divided by, so `air` reads as a wet/dry mix rather than as a gain.
 *
 * ⚠️ **Three combs at these feedbacks settle at about `1/(1 - g)` each**, which is six-ish apiece and
 * eighteen together. Without this, an `air` of 0.5 would be nine times the dry signal — a number a
 * hand cannot reason about, and every value in a theme's table would be a tiny fraction chosen by
 * trial. Divided, `air: 0.5` means *half as much room as direct sound*, which is what it looks like it
 * means.
 */
const ROOM_SCALE = 1 / 5;

/**
 * The diffusers the combs run into, as delay and coefficient.
 *
 * ── WITHOUT THESE IT IS A FLANGER AND NOT A ROOM, AND A MEASUREMENT SAID SO ─────────────────────
 *
 * ⚠️ **Three combs alone are a comb FILTER: notches, at fixed frequencies.** Measured over the base
 * `chords` — a sustained pad, which is the worst case and also exactly what this place is made of —
 * the room CANCELLED. Energy went down by a hair and the peak fell 5%, because a delayed copy of a
 * held tone is correlated with the tone and subtracts as often as it adds. What a listener would have
 * got is a hollow, metallic colour on the choir: the classic missing half of a Schroeder reverb.
 *
 * ⚠️ **An allpass passes every frequency at full amplitude and scrambles only the PHASE**, which is
 * what turns three discrete echoes into something with no pitch of its own. Two in series is the
 * usual count and it is enough here; the delays are short and mutually prime so the second does not
 * reinforce the first.
 */
const ROOM_DIFFUSERS: readonly [number, number][] = [
  [0.0131, 0.62],
  [0.0047, 0.55],
];

/**
 * Put `wet` of a stone room into a finished loop, in place.
 *
 * ── THE SYNTHESISER HAD NO REVERB AND A CATHEDRAL NEEDS ONE ─────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0136-the-place-has-a-room-and-an-arc.md`.** Reported of Ember Nebula: *"it
 * still needs more reverb… the sky background is going to be the Eagle Nebula and the Pillars of
 * Creation, so the music track needs to be suitably awe inspiring to match."* Everything this project
 * had reached for until now was **sustain** — longer notes, slower attacks, lower decay constants —
 * and sustain is not space. A held note is a held note; what says *large room* is the same note
 * arriving again, later, darker, from somewhere else.
 *
 * ⚠️ **IT IS A POST-PASS OVER THE BAKED LOOP AND NOT A PER-NOTE RENDER, WHICH IS WHY IT IS
 * AFFORDABLE.** Re-rendering every note two or three times is proportional to SYNTHESIS — `chords`
 * alone is 1.5 seconds of it, so a three-tap tail would have cost four and a half. This is three
 * passes of a multiply-add over a buffer, proportional to LENGTH: about eleven milliseconds for a
 * sixteen-bar layer, measured. `docs/decisions/0022-frame-rate-is-a-feature.md`'s budget is untouched
 * either way — nothing here runs in a frame — but 0133 has to spend it at a level boundary.
 *
 * ⚠️ **IT WRAPS, on exactly the terms a note does.** A loop's tail has to arrive at the START of the
 * buffer or every repetition has a gap where the room should be, at the same instant every time
 * round — which is the seam `sampleLayerInto`'s own `wrap` exists for, one level up.
 *
 * ⚠️ **The feedback is read from the buffer being written**, so the taps compound into a decaying
 * series rather than being three discrete echoes. That is the difference between a room and a delay
 * pedal, and it costs nothing: it is the same loop, read in order.
 */
export function addRoom(buffer: Float32Array, rate: number, wet: number): void {
  const length = buffer.length;
  /*
    ⚠️ **EACH COMB GETS ITS OWN DELAY LINE, AND THE FIRST VERSION SHARED THE BUFFER.** Writing three
    taps back into the signal they are all reading makes them one feedback loop rather than three:
    the whole thing only stays stable while their gains SUM below one, so each was capped around 0.3
    and the tail was gone in six hundred milliseconds. Measured, and it is why this is not the obvious
    in-place version. Independent lines are stable at 0.8 apiece — a tail of about two seconds, which
    is a building.
  */
  const dry = Float32Array.from(buffer);
  // @setup: one accumulator for the summed combs, at bake time and never in a frame.
  const room = new Float32Array(length);
  for (const [seconds, feedback] of ROOM_TAPS) {
    const delay = Math.max(1, Math.round(seconds * rate));
    const line = new Float32Array(delay);
    let at = 0;
    /** One pole of lowpass inside the loop, so every pass round is darker than the last. */
    let held = 0;
    /*
      ⚠️ **TWO LAPS, AND THE SECOND ONE IS THE ANSWER.** A loop's reverb has to be the tail of a piece
      that has already been playing — the first lap is the room filling up from silence, which is a
      state a looping level never reaches. Keeping the second lap is what makes the tail arrive at the
      TOP of the buffer instead of a gap being there, on exactly the terms `sampleLayerInto`'s `wrap`
      is about one level down.
    */
    for (let lap = 0; lap < 2; lap++) {
      for (let i = 0; i < length; i++) {
        const delayed = line[at]!;
        held += (delayed - held) * (1 - ROOM_DAMP);
        line[at] = dry[i]! + held * feedback;
        at = at + 1 === delay ? 0 : at + 1;
        if (lap === 1) room[i] = room[i]! + delayed;
      }
    }
  }
  /*
    ⚠️ **THE DIFFUSERS, AND THEY RUN OVER TWO LAPS FOR THE SAME REASON THE COMBS DO.** An allpass has
    its own feedback, so a single pass would start from an empty line and the top of the loop would be
    the only part of the buffer without diffusion in it — audible as a tick once round, at the same
    place every time.
  */
  for (const [seconds, coefficient] of ROOM_DIFFUSERS) {
    const delay = Math.max(1, Math.round(seconds * rate));
    const line = new Float32Array(delay);
    let at = 0;
    for (let lap = 0; lap < 2; lap++) {
      for (let i = 0; i < length; i++) {
        const held = line[at]!;
        const input = room[i]!;
        const out = held - coefficient * input;
        line[at] = input + coefficient * out;
        at = at + 1 === delay ? 0 : at + 1;
        if (lap === 1) room[i] = out;
      }
    }
  }
  const send = wet * ROOM_SCALE;
  for (let i = 0; i < length; i++) buffer[i] = dry[i]! + room[i]! * send;
}

/**
 * How far up the ladder a run is, from where the camera is and where the boss is.
 *
 * ── THE SIM KNOWS NOTHING ABOUT THIS, AND THAT IS 0024's BAN ────────────────────────────────────
 *
 * ⚠️ **Two numbers in, a name out.** `src/app/frame.ts` cannot see whether the player has sound on
 * and must not be able to; this reads the world in the other direction — a distance the level script
 * already carries — so nothing about the music can reach a step. It is the same shape as the cue
 * calls: the shell asks the world a question, the world is never told the answer.
 *
 * ⚠️ **`playing` is not a parameter and the caller decides**, because *is the player in a level* is a
 * fact about the screen and screens are `src/state/screens.ts`'s. Everything not in a level is
 * `calm`, which is the title, the level break and the run-over screen, and it is why the drone never
 * stops: the music is one continuous piece and the levels happen inside it.
 */
/**
 * Which place the run is heading for, from the run's own level index.
 *
 * ── EXTRACTED FOR THE REASON `src/app/lifecycle.ts` GIVES IN ITS OWN HEADER ─────────────────────
 *
 * ⚠️ **`docs/decisions/0133-the-place-is-baked-at-the-boundary.md`.** The shell's version of this was
 * two lines inside a closure over `mount`'s `state`, and the only way to ask *does level two bake
 * Ember Nebula* would have been to boot a canvas —
 * `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` cannot break something no test can reach.
 * `src/app/lifecycle.ts` was carved out of `mount` for exactly this and says so.
 *
 * ⚠️ **THE RUN'S LEVEL AND NOT THE FIELD'S, WHICH IS THE WHOLE POINT OF THE FUNCTION.** `run.level`
 * increments when a boss dies (`src/state/slices/run.ts`), so this names the incoming place while
 * `docs/decisions/0063-a-level-break-is-a-respite.md`'s screen is still up — and the bake gets that
 * screen instead of racing the level it belongs to. `world.level.theme` is the other question and
 * `applyMusicLevel` asks it separately, for the MIX.
 *
 * ⚠️ **Clamped past the roster on `enterLevel`'s own terms**: a run that has been finished holds the
 * last place rather than reading off the end.
 */
export function placeFor(runLevel: number): ThemeKind {
  const index = runLevel < 0 ? 0 : runLevel > LEVEL_KINDS.length - 1 ? LEVEL_KINDS.length - 1 : runLevel;
  return LEVELS[LEVEL_KINDS[index]!].theme;
}

/*
  ── THE MUSIC ROOM WALKS A LEVEL — `docs/decisions/0212-the-room-walks-the-level.md` ─────────────

  ⚠️ **THE ROOM PLAYED ONE RUNG AND A LEVEL WALKS FOUR, AND `scripts/weigh-room.mjs` IS WHY THAT IS
  KNOWN.** Reported 2026-09-03, of the room 0210 shipped the day before: *"why the ingame music
  sounds different from the music that plays in the music menu section."* Measured across all seven
  places: the room sounded **8–9 layers against a run's 12–15**, never once opened `lead` — the layer
  the arrangement defines as *the thing you follow* — and **71% of a level's travel** sat at a
  balance 1.9 dB or more from what the room auditioned, which is 0147's own reading for two places a
  play-test called interchangeable. Three cases were past its 6.0 dB *different worlds* mark.

  ⚠️ **AND THE CAUSE WAS A SENTENCE THAT OUTLIVED ITS FACT.** 0210 justified the fixed rung as *"the
  rung a level spends most of its length at"*, which `musicLevelFor`'s own note records as true —
  *"about 160 seconds of a 176-second level"* — until
  `docs/decisions/0158-a-level-says-where-its-sections-open.md` gave every level a four-entry script.
  `run` is now 17–30% of a level. **The fix is not a different constant**: a room that names any rung
  is a second opinion about the shape of a level, and this one was wrong within a fortnight of being
  written. The room asks the same question a run asks, over a camera of its own.
*/

/**
 * How far the walk travels during the fight, in world units.
 *
 * ── A FIGHT HAS NO LENGTH, WHICH IS THE ONE THING THE WALK CANNOT READ OFF A LEVEL ──────────────
 *
 * ⚠️ **EVERY OTHER BOUNDARY IN THE ROOM IS A DISTANCE THE LEVEL ITSELF STATES** — `sections` and
 * `bossAt`, exactly as a run reads them. A boss is beaten in time and by damage, so there is no
 * distance to borrow and this is the one number the room invents. It is marked as such rather than
 * hidden among the level's own.
 *
 * ⚠️ **TWO PHRASES, WHICH IS ONE EACH FOR THE FIGHT'S TWO RUNGS** —
 * `docs/decisions/0113-there-is-one-composition-and-seven-levels.md` split the fight at
 * `BOSS_PEAK_HEALTH`, and `PHRASE_SECONDS` is the length at which every layer's pattern has come
 * round, so a rung held for less than one is a rung the player has not heard all of.
 */
/**
 * How far the world goes past in one second, in units.
 *
 * ⚠️ **THE ONE PLACE THE TWO CLOCKS THIS PROJECT PACES IN ARE MULTIPLIED TOGETHER.** Sections are
 * distances (0102) and the arrangement is bars (0090); every readout that puts a level on a clock —
 * the room's bar, `scripts/weigh-room.mjs`'s timings — needs this ratio, and three copies of it is
 * three chances to be reading a retuned scroll speed against an old one.
 */
export const UNITS_PER_SECOND = SCROLL_PER_STEP * STEPS_PER_SECOND;

export const AUDITION_FIGHT_UNITS = PHRASE_SECONDS * 2 * UNITS_PER_SECOND;

/**
 * How far the room's camera travels through one place, in world units.
 *
 * ⚠️ **`bossAt` AND NOT THE LAST SECTION'S `at`.** Where the fight begins is what ends the last
 * section — `musicLevelFor` says so and 0138 refused to let a script name it — so the walk ends
 * where the level does and then holds for the fight.
 */
export function auditionLength(level: LevelRow): number {
  return level.bossAt + AUDITION_FIGHT_UNITS;
}

/**
 * Which level plays this place, so the walk reads that level's own script.
 *
 * ⚠️ **THE FIRST, AND TWO LEVELS MAY SHARE A PLACE.** `src/content/levels.ts` says so in as many
 * words — *"Two levels sharing a theme"* is allowed — and if that ever happens the room auditions
 * the earlier one, which is the one the player meets first. `null` for a place no level plays, which
 * is unreachable today and is the conservative half rather than a crash.
 */
export function levelOfPlace(theme: ThemeKind): LevelRow | null {
  for (const kind of LEVEL_KINDS) if (LEVELS[kind].theme === theme) return LEVELS[kind];
  return null;
}

/**
 * How far up the ladder the ROOM's camera has got — and it is `musicLevelFor` that answers.
 *
 * ⚠️ **THE WHOLE POINT IS THAT THIS FUNCTION DECIDES NOTHING.** It converts a position into the two
 * arguments a run supplies from the field — *is a boss on it* and *how much of it is left* — and
 * hands them to the one function that knows what a rung is. A room with its own ladder would be the
 * defect 0212 was written about, rebuilt one layer up: `tests/music.test.ts` holds that the walk and
 * a run agree at every boundary of every level, and it can only hold that because there is one
 * answer to agree with.
 *
 * ⚠️ **WHAT THE ROOM SUPPLIES IS A HEALTH CURVE, AND IT IS A MODEL OF A FIGHT RATHER THAN A FIGHT** —
 * nobody is shooting. The boss loses its first slice over one phrase and the remainder over the
 * next, so the curve crosses `BOSS_PEAK_HEALTH` at the halfway mark and **each of the fight's two
 * rungs is heard whole**, which is the whole reason the fight is two phrases long.
 *
 * ⚠️ **A STRAIGHT LINE FROM 1 TO 0 WAS THE FIRST DRAFT AND IT GAVE `boss` ELEVEN SECONDS.**
 * `BOSS_PEAK_HEALTH` is 0.78, not the half its own header still says it is, so a linear fall crosses
 * it a fifth of the way in — and the arrival the room exists to let somebody hear was over before a
 * single layer's pattern had come round. **The defect was in the curve, not in the constant**, and
 * this is the one place in the walk where the room states a shape of its own rather than reading a
 * level's.
 */
export function auditionRung(level: LevelRow, along: number): MusicLevel {
  const fought = along - level.bossAt;
  if (fought < 0) return musicLevelFor(along, false, level.sections);
  const raw = fought / AUDITION_FIGHT_UNITS;
  const through = raw > 1 ? 1 : raw;
  const health =
    through < 0.5
      ? 1 - (1 - BOSS_PEAK_HEALTH) * (through / 0.5)
      : BOSS_PEAK_HEALTH * (1 - (through - 0.5) / 0.5);
  return musicLevelFor(along, true, level.sections, health);
}

/**
 * What the aura is doing at a point in the walk — the level's build, or the fight's closing.
 *
 * ⚠️ **`auraBuild` AND `auraFor` ARE THE RUN'S OWN**, so the twenty seconds a level opens with
 * (0043) are silent here too and the climb is the one 0107 asked for. What the room supplies is the
 * second argument: a run reads the gap between two hulls, and the room has no hulls.
 *
 * ⚠️ **CLOSING LINEARLY IS A CLAIM AND IT IS STATED RATHER THAN TUNED.** A fight ends with the boss
 * directly in front of the player, so the nearness ends at 1; how it gets there is a thing a player
 * steers and a room cannot know. `auraFor` takes the louder of the two, so for most of the fight the
 * level's own build is what is heard and this only takes over at the end — which is the same order a
 * run hears them in.
 */
export function auditionAura(level: LevelRow, theme: ThemeKind, along: number): number {
  const fought = along - level.bossAt;
  const closing = fought <= 0 ? 0 : fought / AUDITION_FIGHT_UNITS;
  return auraFor(auraBuild(along, level.bossAt, theme), closing > 1 ? 1 : closing);
}

/**
 * How far up the ladder the run is.
 *
 * ── `sections` IS THE LEVEL'S OWN SCRIPT, AND IT HAS NO DEFAULT ─────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0158-a-level-says-where-its-sections-open.md`.** It used to be three
 * distances shared by all seven levels, with a global default this function supplied and
 * `rig/dash.ts` overrode. There is no global answer any more — where a section opens is a thing a
 * LEVEL says, exactly as `waves`, `pickups` and `bossAt` are — so the parameter is required, and a
 * caller that forgets it fails to compile rather than quietly getting somebody else's shape.
 *
 * ⚠️ **THE ARITHMETIC BELOW IS STILL THE ONLY DESCRIPTION OF WHERE A RUNG BEGINS**, which is the
 * whole of why threading a script is safe. What moves is the list it is handed. A rig that walked
 * its own boundaries would be the drift `docs/decisions/0116-the-rig-plays-the-level.md` is named
 * for — and `tests/dash.test.ts`'s *THE RUNG IS THE GAME'S ANSWER* has stood over exactly that since
 * 0126.
 *
 * ⚠️ **AND WHAT `src/` MAY PASS IS THE LEVEL'S OWN `sections` AND NOTHING ELSE**, which is 0138's
 * guard inverted rather than dropped. It could once be stated as *nobody passes a fifth argument*;
 * now everybody must, so `tests/dash.test.ts` checks the EXPRESSION instead of counting — a shipped
 * call site that built its own list would make the shape of a level decided in two places, and
 * `src/content/levels.ts` would stop being the whole story.
 *
 * ⚠️ **`sections` COMES BEFORE `bossHealthLeft`, WHICH IS A CHANGE OF ORDER AND NOT ONLY OF TYPE.**
 * The health is meaningful only while a boss is on the field and keeps its default; the script is
 * meaningful always and cannot have one. Putting the required argument in front of the optional one
 * is what lets the many call sites that are not about a fight go on saying nothing about health.
 *
 * ⚠️ **AND `bossAt` IS GONE FROM THE SIGNATURE, WHICH THE COMPILER FOUND RATHER THAN A HAND.** The
 * old arithmetic measured every boundary BACK from the boss, so where the fight was is what anchored
 * the sections; a script is level-local and anchors itself, and the fight's two rungs were always
 * keyed to `bossOnField` and health rather than to a distance. The parameter went unread the moment
 * the subtraction did, and an unused argument on the function that decides the shape of a level is
 * the kind of thing that stays for a year. **Nothing about the answer changes** — a camera past the
 * boss still gets the last section, exactly as a negative `toBoss` used to.
 */
export function musicLevelFor(
  cameraAlong: number,
  bossOnField: boolean,
  sections: LevelSections,
  bossHealthLeft = 1,
): MusicLevel {
  /*
    ⚠️ **THE FIGHT HAS TWO RUNGS NOW, AND THAT IS THE *dynamic climax* THE REPORT ASKED FOR** —
    `docs/decisions/0113-there-is-one-composition-and-seven-levels.md`. *"There is no separate boss
    theme or dynamic climax"* was true twice over: the boss was the level plus two layers, and it was
    ONE arrangement for the whole fight however it went.

    ⚠️ **Keyed to the boss's HEALTH rather than to a timer**, so the climax lands when the fight is
    actually half won. A clock would put the wall of sound on a player who is losing and on one who is
    winning at the same instant, which is the opposite of a payoff.

    ⚠️ **A FRACTION and not a phase index.** `docs/decisions/0111-a-boss-has-one-idea.md` gives every
    boss its own phase table, so phase 2 means a different share of the health bar per boss; half is
    half everywhere. `BOSS_PEAK_HEALTH` is the number and the argument is on it.
  */
  if (bossOnField) return bossHealthLeft <= BOSS_PEAK_HEALTH ? 'bossPeak' : 'boss';
  /*
    ⚠️ **FIVE RUNGS INSIDE A LEVEL, AND THERE WAS ONE** —
    `docs/decisions/0102-the-music-goes-somewhere.md`. This returned `run` from the moment a level
    began until 430 units before its boss — about 160 seconds of a 176-second level — so nine tenths
    of every level was one arrangement over a four-bar loop. *"The ingame background music doesn't
    change and increase in tempo as you progress through the level"* is a description of this line.

    ⚠️ **Distances, like `bossAt` and like everything else this project paces**, so a device that
    drops frames hears the same build and a retuned level carries it.

    ── AND THE LEVEL SAYS WHERE THEY ARE NOW ─────────────────────────────────────────────────────

    ⚠️ **`docs/decisions/0158-a-level-says-where-its-sections-open.md`.** This used to test three
    shared distances measured from the boss BACKWARDS, in a fixed order, which made *where the surge
    opens* one answer for all seven levels. Reported: *"if we have the exact same timing for each for
    each it's also going to be a limiter."*

    ⚠️ **THE LAST ENTRY THE CAMERA HAS REACHED, WHICH IS WHY ORDER AND COUNT ARE FREE.** Nothing
    here knows that `push` follows `run` or that there are four of them: a level may open at `surge`,
    drop to `run` and climb again, and this reads it without a special case. The ladder was in this
    comparison, and it is gone.

    ⚠️ **A SCRIPT MUST BE ASCENDING AND `tests/level.test.ts` HOLDS THAT**, because a `break` on the
    first entry the camera has NOT reached is what makes this a walk rather than a scan. An
    out-of-order script would hide a section rather than reorder one — the same failure
    `docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md` clamped a drag against.

    ⚠️ **`bossAt` IS STILL WHAT ENDS THE LAST SECTION AND IT IS NOT IN THE SCRIPT.** Where a boss
    arrives is level design, not a music number — 0138 refused a handle on it for that reason, and a
    script that could name it would be saying the same thing in two places.
  */
  /*
    ⚠️ **`run` HERE IS UNREACHABLE FOR A REAL LEVEL AND IS NOT A POLICY.** `tests/level.test.ts`
    holds that a script is non-empty and opens at `0`, so the first pass of the loop always replaces
    this. It is what an empty script would return rather than a claim that a level starts at `run` —
    which is exactly the claim 0158 removed.
  */
  /*
    ⚠️ **INDEXED RATHER THAN `for…of`, WHICH IS ABOUT 0022 AND NOT ABOUT STYLE.** This is asked once
    a frame by `src/app/mount.ts`, and a `for…of` allocates an iterator every time it is entered.
    This file is not on `tests/budget.test.ts`'s hot list and would not be caught — which is the
    reason to write it this way rather than the reason not to bother.
  */
  let section: MusicLevel = 'run';
  for (let i = 0; i < sections.length; i++) {
    const entry = sections[i]!;
    if (entry.at > cameraAlong) break;
    section = entry.section;
  }
  return section;
}

/**
 * How near the boss is, `0` at `AURA_FAR_UNITS` and `1` at `AURA_NEAR_UNITS`.
 *
 * ⚠️ **The gap between the HULLS, not between the centres.** Two bosses of different sizes at the
 * same centre distance are not the same distance away — `src/content/bosses.ts` runs from a radius of
 * 11 to one of 13 and will run wider — and what the player is judging is the gap they are flying
 * into. Passing the radii in rather than a raw distance is what keeps that true when a boss changes
 * size.
 *
 * ⚠️ **Bent on the way out, so the last few units are where it moves.** A linear ramp spends most
 * of its travel at distances the player is not thinking about; the interesting part of *"as it gets
 * closer"* is the end, and this is the curve that puts it there.
 *
 * ⚠️ **IT WAS `clamped * clamped` AND THE EXPONENT IS NOW A CONSTANT** —
 * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`. Squaring put 0091's shape in
 * far harder than 0091's sentence asked for, and the reason it survived a decision and a play-test is
 * that a multiply has no number in it: the only edits the shape admitted were *square it* and *do
 * not*. `AURA_CURVE` is the knob that was missing, and the argument for its value is on it.
 *
 * ⚠️ **`0` when there is no boss**, which is what makes the aura's absence the same code path as a
 * boss on the far side of the screen rather than a branch somewhere else.
 */
export function auraNearness(gap: number): number {
  const span = AURA_FAR_UNITS - AURA_NEAR_UNITS;
  const raw = (AURA_FAR_UNITS - gap) / span;
  const clamped = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  return Math.pow(clamped, AURA_CURVE);
}

/**
 * How near the boss is, from the two bodies rather than from a distance.
 *
 * ⚠️ **THE SUBTRACTION LIVES HERE AND IT USED TO LIVE AT THE CALL SITE, WHICH A PROBE CAUGHT.** *The
 * gap is between the hulls* is part of the rule, and with it written in `src/app/mount.ts` the only
 * thing a test could drive was the curve — so `npm run prove` reported STILL GREEN when the radii
 * were dropped. A rule that lives in the shell is a rule with no guard over it.
 *
 * ⚠️ **A bigger boss is NEARER at the same centre distance**, which is the whole point: a radius runs
 * from 11 to 13 across the seven and will run wider, and what the player is judging is the space they
 * are flying into rather than where two centres are.
 */
export function auraNearnessFor(bossAlong: number, bossRadius: number, shipAlong: number, shipRadius: number): number {
  return auraNearness(Math.abs(bossAlong - shipAlong) - bossRadius - shipRadius);
}

/**
 * How much of the aura the LEVEL has raised on its own, from how far through it the camera is.
 *
 * ── THE HALF THAT MAKES A LEVEL A SHAPE RATHER THAN A LOOP ──────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0107-a-level-is-a-place.md`.** Reported: *"it's the one track repeating for
 * minutes and minutes… it does get slightly interesting when the boss starts to appear, but then goes
 * back to the same track."* The music had one thing in it that rose and fell, and it only existed
 * during the twenty seconds a boss was on screen.
 *
 * ⚠️ **Linear, and deliberately not `auraNearness`'s curve.** That one is bent so the last few units
 * carry the movement, because it is about a distance the player is steering. This is about a distance
 * the player cannot change — the level goes past at the camera's rate whatever they do — so a bend
 * would put the whole build into a stretch nobody could feel coming.
 *
 * ⚠️ **Zero before `AURA_ONSET_UNITS`, which is the twenty seconds of level a player gets to
 * themselves.** `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md` opens every
 * level on an empty field so the controls can be found before anything finds the player; a level that
 * opened with the boss already audible would be answering a different ask.
 *
 * ⚠️ **`Number.POSITIVE_INFINITY` is a level with no boss** — what a fixture uses — and it yields
 * zero for ever, which is correct rather than accidental.
 *
 * ⚠️ **THE CEILING IS THE PLACE'S AND WAS A CONSTANT** — 0183. It takes a `theme` for that reason
 * alone, and it is not optional: a default would be the retired `AURA_LEVEL_CEILING` reached a
 * longer way round, and a caller that forgot would report a build no level performs.
 */
export function auraBuild(cameraAlong: number, bossAt: number, theme: ThemeKind): number {
  const from = AURA_ONSET_UNITS;
  if (!Number.isFinite(bossAt) || cameraAlong <= from || bossAt <= from) return 0;
  const through = (cameraAlong - from) / (bossAt - from);
  const clamped = through < 0 ? 0 : through > 1 ? 1 : through;
  return clamped * auraCeilingOf(theme);
}

/**
 * How loud the aura is: the level's own build, or how near the boss is, whichever is further on.
 *
 * ⚠️ **A MAXIMUM AND NEVER A SUM** — 0107. Two mechanisms with a claim on one gain have to be
 * combined by something that cannot exceed either's ceiling, and a sum puts the aura past the
 * headroom `tests/music.test.ts` measures the moment a player closes on a boss at the end of a long
 * level. The build says *how far through this is*; the proximity says *how close that is*; the louder
 * of the two is what the player is being told.
 *
 * ⚠️ **THE single description, asked by the shell and by the rig.** `src/app/mount.ts` and
 * `scripts/hear.mjs` both need *what is the aura doing right now*, and two copies of a maximum is how
 * the rig ends up writing a file the game does not play.
 */
export function auraFor(build: number, nearness: number): number {
  return build > nearness ? build : nearness;
}

/*
  ── THE RE-PHASE IS GONE, AND WITH IT THE LAST THING TYING THE MUSIC TO THE SIM ─────────────────

  ⚠️ **docs/decisions/0160-the-music-free-runs.md.** `REPHASE_SECONDS` and `rephaseIn` stood here:
  the arithmetic that moved the loops back into phase with the sim's step clock after
  docs/decisions/0022-frame-rate-is-a-feature.md threw steps away. Both were correct and both were
  measured; what they served was docs/decisions/0093-the-gun-is-on-the-grid.md's claim that the gun
  and the music keep one clock, and docs/decisions/0159-the-two-clocks-come-apart.md ended that.

  ⚠️ **A CORRECTION TOWARDS A CLOCK YOU NO LONGER SHARE IS NOT A CORRECTION.** The moment a level
  authors a tempo, sim seconds and musical time stop being the same quantity — so a re-phase would
  drag the music to match something with no relationship to it, on a schedule nobody could predict.

  ⚠️ **AND THE AUDIO CLOCK IS THE BETTER ONE ANYWAY**, which is the half worth keeping in mind: it
  does not drop steps. The music now free-runs on `AudioContext.currentTime`, which is the clock it
  is actually played against, and `anchorAudio` is the only origin left.
*/

/**
 * How far ahead a re-phase must be scheduled, in seconds.
 *
 * Long enough that the audio thread has the buffer switch before it needs it, and short enough that
 * the correction lands inside the loop it was decided in.
 *
 * ⚠️ **EXPORTED FOR `tests/music.test.ts` AND FOR NOTHING ELSE** — 0135. The guard on how long a new
 * place makes a player wait has to add this to a bar, and a `0.06` typed into the test would go on
 * asserting the old bound the day this moved. `docs/decisions/0116-the-rig-plays-the-level.md` is the
 * decision about a number restated somewhere it is also measured.
 */
export const SCHEDULE_AHEAD = 0.06;

/** What the shell drives. The one interface the browser half has to satisfy. */
export interface MusicOut {
  /** Start the four loops, in sync. Idempotent — a second call is ignored. */
  start(): void;
  /*
    ⚠️ **`phaseTo` STOOD HERE AND 0160 REMOVED IT.** It kept the loops in phase with the sim's own
    step clock and was called every frame. What it was FOR was 0093's shared clock, and 0159 ended
    that — `docs/decisions/0160-the-music-free-runs.md`.
  */
  /**
   * Move to a level, with how near the boss is. A ramp, never a cut.
   *
   * `nearness` scales the aura layers and is ignored by every other one — 0091.
   */
  /**
   * Move to a level, with how near the boss is. A ramp, never a cut.
   *
   * ⚠️ **`ladder` IS THE RIG'S AND THE GAME NEVER PASSES ONE** — 0163. It is how the desk edits a
   * place's own shape (0162) and hears the mixer follow, on 0138's terms for `sections`.
   */
  /*
    ⚠️ **`gains` STOOD HERE FOR ONE DAY AND WENT WITH THE TOGGLE IT WAS BUILT FOR** —
    `docs/decisions/0176-the-re-based-mix-is-the-mix.md`. 0175 added it so the desk's non-shipped
    modes could arrive on the downbeat over the mixer's own ramp instead of cutting in 30 ms; the
    modes are gone, the balance they chose is in `THEMES`, and a parameter with no caller is a branch
    no data reaches — which is the state 0162's ladder landed in and its own probe header calls
    guarded by nothing. **The finding stands and the mechanism does not need to.**
  */
  setLevel(level: MusicLevel, nearness: number, theme: ThemeKind, ladder?: ThemeLadder): void;
  /**
   * Push the bed down for a moment, so a cue landing on top of it has somewhere to land.
   *
   * ── THE MUSIC NEVER MOVED WHEN ANYTHING HAPPENED, WHICH IS MOST OF *"THEY DON'T MESH"* ─────────
   *
   * ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** Reported: *"the game sound effects also
   * don't blend in with the music at all."* Two buses summed into one destination and neither ever
   * acknowledged the other — so an explosion was a sound played OVER a track rather than one the
   * track made room for, which is the difference a listener calls *meshing*.
   *
   * ⚠️ **It is what a sidechain does, and Web Audio has no sidechain.** A compressor keyed off
   * another bus is not something the platform offers; what it does offer is scheduled `AudioParam`
   * automation, and a dip scheduled at the instant a cue starts is the same gesture with the trigger
   * written in code rather than in a graph.
   *
   * ⚠️ **NO ALLOCATION, which is why it is automation and not a node.** `setTargetAtTime` writes into
   * a parameter that already exists; this is reached from a fixed step, and
   * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts what happens there.
   *
   * ⚠️ **The recovery is far slower than the dip**, which is the shape of a duck: down fast enough
   * that the cue arrives into space, back slowly enough that the return is not a second event.
   *
   * @param amount how far down, as a fraction of the bed to remove — `0` does nothing, `1` is silence
   */
  duck(amount: number): void;
  /** Silence the music without stopping it, for the sound setting. */
  setOn(on: boolean): void;
  /** Which level is currently asked for, so a guard can read it. */
  level(): MusicLevel;
  /**
   * A layer's own gain parameter.
   *
   * ── THE GAME DOES NOT CALL THIS AND `rig/` DOES, WHICH IS THE SAME ARGUMENT `panGains` MAKES ────
   *
   * ⚠️ **`docs/decisions/0126-the-dashboard-is-the-instrument.md`.** The dashboard's central claim is
   * that the number it prints beside a layer is what the speakers are doing, and the only way that
   * cannot drift is for it to read the node. Everything else this repository has ever shown a human
   * about the mix was a MODEL of the mix — and 0116 records the two occasions a verdict was taken
   * from one that had come apart from the game.
   *
   * ⚠️ **It is also the solo, and a solo needs no second mechanism.** Writing zero here holds,
   * because `levelWrites` only writes a layer whose TARGET moved (0117) — so a pinned gain is left
   * alone until the rung changes, which is exactly when a dashboard should re-state it.
   *
   * ⚠️ **NOTHING UNDER `src/` MAY CALL IT** and `tests/dash.test.ts` scans for that. A parameter the
   * shell could write is a second place the mix is decided from, which is the one thing
   * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md` cannot survive.
   */
  gainOf(layer: MusicLayer): AudioParam;
  /**
   * A layer's own pan parameter, on exactly `gainOf`'s terms.
   *
   * ⚠️ **`docs/decisions/0129-the-desk-holds-a-value-not-a-multiplier.md`.** 0118 fixed every layer's
   * place at construction from `LAYER_PAN` and the game has no reason to move one — which is what
   * makes the table's sixteen off-centre values a set of numbers nobody has ever heard moved. A desk
   * that can drag one across while it plays is the only way to ask whether a value is right.
   *
   * ⚠️ **NOTHING UNDER `src/` MAY CALL IT** and `tests/dash.test.ts` scans for that, for the same
   * reason it scans for `gainOf`: a place decided in two places is a place nobody owns.
   */
  panOf(layer: MusicLayer): AudioParam;
  /**
   * Play a different set of loops, from the next phrase boundary.
   *
   * ── THE PRIMITIVE A PLACE'S OWN MATERIAL NEEDS, AND `swapTo` ALREADY DID THE HARD PART ──────────
   *
   * ⚠️ **`docs/decisions/0128-a-place-plays-its-own-material.md`.** A theme may replace the voices of
   * the layers it changes, which means the buffers behind those layers change when the place does.
   * Everything difficult about that — stopping the old set at exactly the instant the new one starts,
   * so there is no gap and no doubling — is what 0094's re-phase already built.
   *
   * ⚠️ **AT A PHRASE AND NOT AT A BAR, which is a different choice from 0117's.** A rung change is a
   * gain ramp and lands on the next downbeat; this replaces the material itself, and the shortest
   * span over which every layer is simultaneously back at position zero is the PHRASE. Swapping
   * anywhere else restarts a sixteen-bar chord progression in the middle of itself.
   *
   * ⚠️ **It re-anchors, exactly as a re-phase does**, so the bar grid moves with the music and
   * `nextBarFrom` keeps answering about the piece that is actually playing.
   */
  setLoops(next: Record<MusicLayer, Float32Array>): void;
}

/**
 * How long a change of level takes, in seconds.
 *
 * ⚠️ **Long enough to be a build and short enough to be about the boss.** A cut between levels would
 * be one piece of music stopping and another starting, which is the thing four synchronised loops
 * exist to avoid; at 1.6 seconds the beat arrives over about four beats of the bar it arrives in.
 */
/*
  ⚠️ **EXPORTED FOR `scripts/hear.mjs`, WHICH HAD BEEN GUESSING AT IT** — 0116. The rig's `--music`
  arc modelled a level change as a LINEAR ramp over the last 1.6s of a slot; this is an exponential
  approach that starts the instant the rung changes. Two different shapes in two different places,
  and the one the player hears is this one. A number restated in the rig is
  `docs/decisions/0027-measure-the-picture-not-the-model.md` inside the instrument, for the third
  time in this file's history.
*/
export const RAMP_SECONDS = 1.6;

/**
 * How many points the music bus's transfer curve is sampled at.
 *
 * ⚠️ **A `WaveShaperNode` interpolates between neighbouring points**, so what this decides is how
 * closely the played curve follows `saturate`. At 1,025 points the step between neighbours is under
 * 0.002 of full scale — well below a 16-bit floor — and the table is 4 kB built once.
 *
 * ⚠️ **Odd, so there is a point exactly at zero.** An even count straddles it, which puts a tiny
 * offset on silence and a kink through the middle of every waveform — the one place a transfer curve
 * must be exact, because it is where the quietest part of every note lives.
 */
const CURVE_POINTS = 1025;

/**
 * How long the duck takes to go down, to stay down, and to come back — 0104.
 *
 * ⚠️ **DOWN IN 25 ms, BACK OVER 320.** A duck is heard as *the track got out of the way* only when
 * the return is slow enough to be missed; a symmetric one is heard as the music pumping, which is a
 * second event arriving right where the first one's tail is. The asymmetry IS the effect.
 *
 * ⚠️ **The hold is a sixteenth**, so the bed is back up by the time the next gridded cue can land.
 * Anything longer and a busy fight would hold the music down continuously, which is the reported
 * defect with the sign flipped: *"background too quiet"* caused by the fix for *"they don't mesh"*.
 *
 * ── AND THE PARAGRAPH ABOVE ADDS UP THE WRONG TWO NUMBERS ───────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0109-a-death-is-a-drum.md`.** *"The bed is back up by the time the next gridded
 * cue can land"* counts the HOLD and forgets the RETURN. A duck is `DOWN + HOLD + UP` = **0.445
 * seconds** from trigger to recovered, which is four and a half sixteenths, not one — so the
 * condition it claims has never been true of any cue that lands more often than about twice a second.
 *
 * ⚠️ **A level sends about two bodies a second**, driven over every row of `src/content/levels.ts`,
 * and `kill` carried a duck. The bed was held down for most of every level, which is what the ninth
 * play-test's *"instead of punctuating the music, they detract from it"* is a description of.
 *
 * ⚠️ **The three numbers are UNCHANGED and correct**: the asymmetry is the effect, and 0104's
 * reasoning about it stands. What was wrong is which cues may spend it, and that is a property of the
 * ROW rather than of these — `src/content/cues.ts`.
 *
 * ⚠️ **Exported for `tests/sound.test.ts`**, which multiplies this envelope by the rate the level
 * scripts actually produce. A guard that re-typed 0.445 would be the second description this project
 * keeps finding, and the arithmetic is the whole of the finding.
 */
export const DUCK_DOWN_SECONDS = 0.025;
export const DUCK_HOLD_SECONDS = 0.1;
export const DUCK_UP_SECONDS = 0.32;

/**
 * How long the AURA takes to follow the boss, in seconds.
 *
 * ⚠️ **A quarter of a level change, because it is tracking a thing the player is steering.** At
 * `RAMP_SECONDS` the aura would still be swelling after the player had already backed out of range,
 * which is a sound that reports where they were rather than where they are.
 */
export const AURA_RAMP_SECONDS = 0.4;

/**
 * How long after the sound is switched off the loops actually stop, in seconds.
 *
 * ⚠️ **Longer than the master's own 0.08s fade and short enough to be the same gesture** — 0119.
 * Stopping a looping source mid-cycle is a click, and a setting whose whole job is to make the game
 * quiet must not make a noise on the way.
 */
const STOP_AFTER_SECONDS = 0.25;

/**
 * The next bar line on the loops' own clock, at or after `now`.
 *
 * ⚠️ **`anchor` is `anchorAudio` — the instant the loop set was last put on the air**, so it is
 * position zero of every layer and bar zero of the piece. A rephase (0094) re-anchors it and the
 * grid moves with the music, which is the only way this stays true.
 *
 * ⚠️ **`now` before the anchor yields the anchor**, which is the start case: the set is scheduled a
 * moment ahead, and the first bar is the first bar.
 */
export function nextBarFrom(anchor: number, now: number): number {
  const since = now - anchor;
  if (since <= 0) return anchor;
  return anchor + Math.ceil(since / BAR_SECONDS) * BAR_SECONDS;
}

/**
 * When a new PLACE's loops go on the air — the next bar that is far enough ahead to schedule.
 *
 * ── IT WAS THE NEXT PHRASE, AND A LEVEL OPENED ON THE PREVIOUS PLACE'S MUSIC ────────────────────
 *
 * ⚠️ **`docs/decisions/0135-a-place-arrives-when-you-do.md`.** Reported of the first level that ever
 * played its own music: *"the start of level 2 sounded a bit like the default start, it should
 * immediately pick into the new thematic track."* A phrase is 25.6 seconds and a level opens
 * deliberately empty (0043), so the whole of level two's first quiet minute could be level one's
 * piece.
 *
 * ⚠️ **A FUNCTION AND NOT FOUR LINES IN A CLOSURE, on `src/app/lifecycle.ts`'s own terms** — the
 * instant is the whole subject and it lived somewhere only an `AudioContext` could reach, so
 * `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` could not break it.
 *
 * ⚠️ **`nextBarFrom` is the bar arithmetic and is not repeated here** — 0117 owns it. What this adds
 * is the scheduling floor: a bar that is two milliseconds away cannot be started on, so the next one
 * is taken.
 */
export function placeArrivesAt(anchor: number, now: number, minAhead: number): number {
  let when = nextBarFrom(anchor, now);
  while (when < now + minAhead) when += BAR_SECONDS;
  return when;
}

/**
 * What a `StereoPannerNode` does to a MONO input, as the Web Audio spec defines it.
 *
 * ⚠️ **THE GAME DOES NOT CALL THIS — A BROWSER NODE DOES — AND THAT IS EXACTLY WHY IT IS HERE.**
 * `scripts/hear.mjs` has to render the same field the player hears, and the only alternative is the
 * rig keeping its own idea of a pan law. `docs/decisions/0116-the-rig-plays-the-level.md` is about
 * that class of drift and this is the fourth place it could have happened.
 *
 * ⚠️ **Equal power, not equal amplitude.** `L² + R²` is 1 at every position, so a layer does not get
 * quieter as it crosses the middle — which an equal-amplitude law does, audibly, and which would read
 * as the mix dipping rather than as anything moving.
 */
export function panGains(pan: number): { left: number; right: number } {
  const clamped = pan < -1 ? -1 : pan > 1 ? 1 : pan;
  const x = ((clamped + 1) * Math.PI) / 4;
  return { left: Math.cos(x), right: Math.sin(x) };
}

/** One gain to write: which layer, what it is heading for, when the ramp starts and how fast. */
export interface RampWrite {
  layer: MusicLayer;
  target: number;
  at: number;
  tau: number;
}

/**
 * The most bars a build may span, counting from the boundary's own downbeat.
 *
 * ── A BOUNDARY WAS A STEP, AND A STEP IS WHAT *IT JUMPS* MEANS ──────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0171-a-boundary-is-a-build.md`.** Reported: *"the push > run primarily but the
 * other transitions for each individual level doesn't actually transition at the moment, it just
 * jumps."* `run → push` opens `arp`, `ride`, `hook` and `lead` — **four layers on one downbeat, at
 * one instant, over one ramp**. `RAMP_SECONDS` makes each of them a 1.6-second approach and does
 * nothing at all about their all being the same 1.6 seconds: four simultaneous fades read as one
 * event, and one event that adds four parts is a step however smoothly each part gets there.
 *
 * ⚠️ **THE FIX IS NOT A LONGER RAMP AND THAT IS THE WHOLE POINT.** Doubling `RAMP_SECONDS` makes the
 * same step slower; it does not make it a build. What a build IS, is arrivals in an order — and the
 * order is not a new opinion, because `ARRANGEMENT` has stated every layer's role at every rung since
 * `docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md` and `MUSIC_ROLES` is written
 * quietest-first. **A build is the arrivals landing in the order they are already listed in.**
 *
 * ⚠️ **A BAR APIECE, BECAUSE AN ENTRY LANDS ON A DOWNBEAT OR IT IS NOT AN ENTRY.**
 * `docs/decisions/0117-a-section-change-lands-on-the-beat.md` is the same argument at the boundary
 * itself: *"a change heard away from the beat is not heard as a change."* A half-bar stagger would
 * put half the arrivals on a backbeat, which is the failure 0117 exists for, one bar down.
 *
 * ⚠️ **THREE, WHICH IS FOUR BARS OF BUILD AND 6.4 SECONDS.** The shortest section in the game is the
 * approach at **17.9 s**, so a build that ran the length of its own section is the one way *slower*
 * stops being *smoother*; `tests/music.test.ts` holds it under half of every section it opens. The
 * cap is what makes `calm → run` — seven arrivals, the most of any boundary — land its bed together
 * and then enter over four bars, rather than trickling in for ten seconds while the player flies.
 */
export const BUILD_BARS = 3;

/**
 * Which bar of the build each arriving layer lands on, counting from the boundary's own downbeat.
 *
 * ⚠️ **ONE ARRIVAL A BAR, IN THE ARRANGEMENT'S OWN ORDER.** Quietest role first, and inside a role
 * the quieter layer first — which is the order the mix already states, so nothing here is a new
 * musical opinion. `MUSIC_ROLES` is written quietest-first for exactly this reading.
 *
 * ⚠️ **GROUPING BY ROLE INSTEAD WAS TRIED AND IT LEFT FIVE BOUNDARIES AS STEPS.** It is the more
 * obviously musical rule — *the whole pulse arrives together* — and it fails wherever a place's own
 * lead displaces the arrangement's: `roleOf` demotes the displaced part to a counter-line, so Saurian
 * Reach's `push` opens `arp`, `hook` and `lead` as three counter-lines and delivers three of its four
 * arrivals on one downbeat. **A rule that is a build in four places and a step in three is not a
 * rule**, and the guard that caught it is the one written in seconds.
 *
 * ⚠️ **WHERE THERE ARE MORE ARRIVALS THAN BARS, THE EARLIEST SHARE THE DOWNBEAT.** `calm → run` opens
 * seven layers; one a bar would be a level whose bed was still arriving eleven seconds in. The bed
 * lands together and the parts enter over the four bars after it, which is what the cap is for and
 * the only thing it does.
 *
 * ⚠️ **A LAYER THE ARRANGEMENT DOES NOT NAME AT THIS RUNG SORTS AS `air`.** That is unreachable today
 * — `tests/arrangement.test.ts` holds every sounding layer to exactly one role — and it is a place's
 * own `ladder` ([0162](../../docs/decisions/0162-a-place-has-its-own-ladder.md)) that could open one,
 * so the fallback is the conservative half rather than a crash.
 */
export function entryBars(
  theme: ThemeKind,
  level: MusicLevel,
  arriving: readonly Pick<RampWrite, 'layer' | 'target'>[],
): Partial<Record<MusicLayer, number>> {
  const rank = (layer: MusicLayer): number => MUSIC_ROLES.indexOf(roleOf(theme, level, layer) ?? 'air');
  const order = [...arriving].sort(
    (a, b) =>
      rank(a.layer) - rank(b.layer) ||
      a.target - b.target ||
      MUSIC_LAYERS.indexOf(a.layer) - MUSIC_LAYERS.indexOf(b.layer),
  );
  const bars: Partial<Record<MusicLayer, number>> = {};
  // Counted back from the last arrival, so the cap eats into the FRONT of the build and the thing
  // the place asks you to follow always lands on the last bar of it.
  const shared = order.length - 1 > BUILD_BARS ? order.length - 1 - BUILD_BARS : 0;
  for (let i = 0; i < order.length; i++) bars[order[i]!.layer] = i > shared ? i - shared : 0;
  return bars;
}

/**
 * Every gain that has to move, and when — the whole of what a change of rung does.
 *
 * ── A SECTION CHANGE LANDS ON A DOWNBEAT, AND NOT ONE EVER HAS ─────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0117-a-section-change-lands-on-the-beat.md`.** `setLevel` wrote
 * `setTargetAtTime(target, ctx.currentTime, …)` — the ramp began at the instant a frame noticed the
 * rung had changed, which is wherever the camera happened to cross a distance.
 * `docs/decisions/0116-the-rig-plays-the-level.md` measured where that lands: **twenty-seven of the
 * game's twenty-eight rung changes are mid-bar**, and the one that is not is an accident of
 * `bossAt: 4320` dividing evenly.
 *
 * ⚠️ **A CHANGE HEARD AWAY FROM THE BEAT IS NOT HEARD AS A CHANGE.** It reads as the mix wobbling,
 * which is *"there is only a very subtle difference in the sound between push and surge"* —
 * `docs/decisions/0114-the-fight-is-a-different-piece.md`, reported twice and answered twice with a
 * gain. **This is the first answer to it that is not one.**
 *
 * ⚠️ **THE AURA IS DELIBERATELY NOT QUANTISED, AND THAT IS 0091 RATHER THAN AN OMISSION.** It tracks
 * a distance the player is steering; a dread that arrived on the next downbeat would be reporting
 * where they were rather than where they are, which is the exact reason its ramp is already a quarter
 * of a level change's.
 *
 * ⚠️ **AND A LAYER WHOSE TARGET HAS NOT MOVED IS NOT WRITTEN AT ALL.** `setLevel` runs every frame;
 * re-scheduling a ramp that is halfway through would hold it at its current value until the *next*
 * bar and then resume, so the build would stair-step up in bar-sized steps. Writing only on a change
 * is what makes the quantised ramp a single smooth move — it is correctness, not a saving.
 *
 * ⚠️ **`ladder` IS AN INPUT AND THE GAME NEVER PASSES ONE** —
 * `docs/decisions/0163-the-script-is-edited-here.md`, on the terms
 * `docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md` set for `sections`. A place's
 * own shape ([0162](../../docs/decisions/0162-a-place-has-its-own-ladder.md)) is the other half of what
 * a level sounds like, and it was typed rather than driven; this is what lets the desk edit it and hear
 * the mixer follow on the next tick. **`tests/dash.test.ts` scans `src/` to keep the game from passing
 * one**, because a shipped caller with its own shape would make a place decided in two places.
 *
 * @param lastTargets what each layer was last told to head for, or `null` for a layer never written
 */
export function levelWrites(
  level: MusicLevel,
  theme: ThemeKind,
  nearness: number,
  anchor: number,
  now: number,
  lastTargets: Partial<Record<MusicLayer, number>>,
  ladder?: ThemeLadder,
): RampWrite[] {
  const bar = nextBarFrom(anchor, now);
  const shape = ladder ?? THEMES[theme].ladder;
  const writes: RampWrite[] = [];
  const opening: RampWrite[] = [];
  /*
    ⚠️ **NOTHING SOUNDING MEANS NOTHING TO BUILD ON, AND THE PIECE STARTS TOGETHER.** A build is
    heard against what is already there; with the mixer cold — a first gesture, or `setOn` having
    forgotten every destination — the first write IS the music starting, and staggering it would be
    four seconds of the game having no soundtrack. This is the only condition, and it is a property
    of `lastTargets` rather than of the rung, so nothing has to be told which boundary it is at.
  */
  let standing = false;
  for (const layer of MUSIC_LAYERS) {
    if ((lastTargets[layer] ?? 0) > 0) {
      standing = true;
      break;
    }
  }
  for (const layer of MUSIC_LAYERS) {
    const aura = AURA_LAYERS.includes(layer);
    const target = rungOf(theme, level, layer, shape) * mixOf(theme, layer) * (aura ? nearness : 1);
    if (!aura && lastTargets[layer] === target) continue;
    const write = { layer, target, at: aura ? now : bar, tau: (aura ? AURA_RAMP_SECONDS : RAMP_SECONDS) / 3 };
    if (!aura && target > 0 && (lastTargets[layer] ?? 0) === 0) opening.push(write);
    writes.push(write);
  }
  /*
    ⚠️ **ONLY THE ARRIVALS ARE MOVED, AND THE DEPARTURES DELIBERATELY ARE NOT.**
    `docs/decisions/0120-a-rung-may-close-a-layer.md`: *"a rung that closes a layer as it opens two is
    a change of arrangement rather than a thicker one."* A closing layer that waited for the build
    would still be playing under the parts that replaced it, which is the opposite of the change the
    rung is making — so it leaves on the downbeat and the room it leaves is what the build walks into.
    A bed that merely gets louder moves on the downbeat too: it is the boundary, not an arrival.
  */
  if (!standing || opening.length < 2) return writes;
  const bars = entryBars(theme, level, opening);
  for (const write of opening) {
    const late = bars[write.layer] ?? 0;
    if (late > 0) write.at = bar + late * BAR_SECONDS;
  }
  return writes;
}

/**
 * The Web Audio half.
 *
 * ⚠️ **Four sources and four gains for the whole run, created once.** This is the answer to the
 * allocation problem `src/app/sound.ts` has to state a bound for instead: a looping
 * `AudioBufferSourceNode` is started once and never replaced, so the music adds nothing at all to the
 * per-step budget `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts.
 *
 * ⚠️ **All four start at ONE timestamp**, which is what keeps them in phase for the length of a run.
 * Starting them as they are needed would put each one wherever the bar happened to be.
 */
export function makeMusicOut(
  ctx: AudioContext,
  destination: AudioNode,
  loops: Record<MusicLayer, Float32Array>,
  rate: number,
): MusicOut {
  const gains = {} as Record<MusicLayer, GainNode>;
  /*
    ⚠️ **KEPT, WHERE THEY USED TO BE LOCALS** — 0129. A layer's place in the field is fixed at
    construction and the game never touches it again, so a local was correct until something wanted to
    ASK. `panOf` is the dashboard's, on exactly `gainOf`'s terms, and holding the reference costs one
    record of twenty-three that already exists for the gains.
  */
  const pans = {} as Record<MusicLayer, StereoPannerNode>;
  const buffers = {} as Record<MusicLayer, AudioBuffer>;
  // @setup: one array for the run, reused in place by `swapTo` — a re-phase replaces its contents
  // rather than allocating a second list.
  const sources: AudioBufferSourceNode[] = [];
  let started = false;
  let on = true;
  let current: MusicLevel = 'calm';
  let near = 0;
  /** Which place the run is in — 0107. Its mix rides over every rung. */
  let place: ThemeKind = 'approach';
  /**
   * The ladder override the last `setLevel` was given, or `undefined` for the place's own.
   *
   * ⚠️ **REMEMBERED FOR ONE CALLER: the re-write after a place swap** — `setLevel(current, near,
   * place, shape)` below. Forgetting it there would have the desk's edit vanish the moment a level
   * boundary re-bakes, which is a defect that only shows up in the rig and only after a switch.
   * **The shipped game leaves it `undefined` for ever** — 0163.
   */
  let shape: ThemeLadder | undefined;
  /** Audio time at which loop position zero last began. Bar zero of the piece — 0117's grid. */
  let anchorAudio = 0;
  /*
    ⚠️ **What each layer was last TOLD to head for, which is not what its gain currently reads** —
    0117. `setLevel` runs every frame and a quantised ramp takes a bar to arrive, so comparing against
    the live `gain.value` would re-write a ramp that is halfway through and stall it at the next bar.
    What decides whether a layer moves is whether its DESTINATION changed.
  */
  const headingFor: Partial<Record<MusicLayer, number>> = {};
  /** Sim seconds at that same instant, or `null` until the first frame after a start. */

  const master = ctx.createGain();
  master.gain.value = MUSIC_GAIN;
  /*
    ── THE MASTER BUS, AND IT WENT STRAIGHT TO THE DESTINATION FOR FOUR MIX PASSES ────────────────

    ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** Reported four times, most recently
    *"background too quiet"*. Every cue has run through a soft clip since
    `docs/decisions/0089-a-cue-has-a-body.md` — that is what `glue` is — and the music, which is the
    one thing in the game that plays continuously, ran through nothing at all. It had been
    gain-staged four times and never mastered.

    ⚠️ **A `WaveShaperNode` RATHER THAN A `DynamicsCompressorNode`, and the reason is the guard.** A
    compressor has an attack and a release, so it is a function of the signal's history;
    `tests/music.test.ts` sums the layers sample by sample and could not model one, which would have
    meant weakening the assertion that holds the mix in order to admit the thing that fixes it. A
    shaper is **stateless**, so the guard applies the identical arithmetic to its own sum and stays a
    real check on what comes out.

    ⚠️ **It is the same `saturate` the cues use**, imported rather than repeated, which keeps
    `docs/decisions/0072-a-cue-is-baked-and-played.md`'s one-instrument property over the mix as well
    as over the voices.

    ⚠️ **Created once with the context and never touched again** — 0025 counts allocations in the
    frame loop and this is not in one. The curve is `CURVE_POINTS` long, which is fine enough that
    the browser's own interpolation between points is inaudible against a 16-bit floor.
  */
  const shaper = ctx.createWaveShaper();
  // @setup: the transfer curve, built once at context creation and read by the audio thread after.
  const curve = new Float32Array(CURVE_POINTS);
  for (let i = 0; i < CURVE_POINTS; i++) {
    const x = (i / (CURVE_POINTS - 1)) * 2 - 1;
    curve[i] = saturate(x, MUSIC_DRIVE);
  }
  shaper.curve = curve;
  /*
    ⚠️ **`'none'` and not the default `'2x'`.** Oversampling costs CPU on the audio thread for every
    sample of a continuously-running bus, and what it buys is suppressed aliasing from the harmonics
    the curve generates. At this drive the curve is gentle — the third harmonic is well below the
    noise floor — and `docs/decisions/0022-frame-rate-is-a-feature.md`'s budget is a mid-range phone.
  */
  shaper.oversample = 'none';
  master.connect(shaper);
  shaper.connect(destination);

  for (const layer of MUSIC_LAYERS) {
    const data = loops[layer];
    const buffer = ctx.createBuffer(1, data.length, rate);
    buffer.getChannelData(0).set(data);
    buffers[layer] = buffer;
    const gain = ctx.createGain();
    gain.gain.value = MUSIC_LADDER.calm[layer];
    /*
      ⚠️ **ONE PANNER PER LAYER, BUILT WITH THE GRAPH AND NEVER TOUCHED AGAIN** — 0118. A layer's
      place in the field is a property of the layer, not of the moment, so this is `@setup` work in
      the same sense the buffers are: twenty-three nodes at context creation and nothing per frame.
      `docs/decisions/0022-frame-rate-is-a-feature.md`'s budget is untouched.

      ⚠️ **The buffers stay MONO.** Stereo buffers would double 52 MB of resident audio against a
      ceiling `tests/sound.test.ts` says must not be raised again; a panner spends no memory at all.
    */
    const pan = ctx.createStereoPanner();
    pan.pan.value = LAYER_PAN[layer];
    gain.connect(pan);
    pan.connect(master);
    gains[layer] = gain;
    pans[layer] = pan;
  }

  /**
   * Put a fresh set of loops on the air at `when`, and take the old set off at exactly that instant.
   *
   * ⚠️ **A source node is single-use by specification**, which is why this allocates six of them —
   * the same fact `src/app/sound.ts` is on `tests/budget.test.ts`'s deliberately-cold list for. It
   * runs at a start and then only on a correction, which 0094 sizes at *rare*.
   *
   * ⚠️ **The old set is stopped AT `when` and not before**, so there is no instant with nothing
   * playing. Overlap of exactly zero is what makes the swap a join rather than a gap.
   */
  const swapTo = (when: number): void => {
    for (let i = 0; i < sources.length; i++) sources[i]!.stop(when);
    sources.length = 0;
    for (const layer of MUSIC_LAYERS) {
      const source = ctx.createBufferSource();
      source.buffer = buffers[layer];
      source.loop = true;
      source.connect(gains[layer]);
      source.start(when);
      sources.push(source);
    }
    anchorAudio = when;
  };

  return {
    /*
      ⚠️ **THE SOURCES ARE MADE HERE RATHER THAN ABOVE, AND A GUARD IS WHY.** Building them with the
      gains reads as tidier and it makes four looping voices exist from the moment the context does —
      so `tests/sound.browser.test.ts`'s *sound is off and the game played anyway* went red, correctly:
      it counts sources, and four of them running into a muted gain are still four of them running.

      Silence should be silence. Nothing is created until the music is actually wanted, which is also
      the honest reading of *the player turned it off*.
    */
    start(): void {
      if (started || !on) return;
      started = true;
      /*
        ⚠️ **ONE timestamp for all four, a hair in the future so none of them misses it.** This is the
        line the whole design rests on: four loops of identical length started at the same instant
        stay in phase for the length of a run, and there is no scheduler anywhere to re-align them if
        they do not.
      */
      const when = ctx.currentTime + 0.05;
      swapTo(when);
    },
    setLevel(
      level: MusicLevel,
      nearness: number,
      theme: ThemeKind,
      ladder?: ThemeLadder,
    ): void {
      current = level;
      near = nearness;
      place = theme;
      shape = ladder;
      if (!on) return;
      /*
        ⚠️ **THE WHOLE DECISION IS `levelWrites` AND NONE OF IT IS HERE** — 0117. What to write, when
        the ramp starts and whether a layer moves at all are one piece of arithmetic, and it is
        exported because a guard cannot reach a loop inside a closure over an `AudioContext`. That is
        `docs/decisions/0116-the-rig-plays-the-level.md`'s lesson arriving one file over: the first
        guards written for the rig asserted that a word appeared in a file, and `npm run prove`
        reported STILL GREEN.

        ⚠️ **`anchorAudio` is the clock, not `currentTime`.** It is position zero of every loop, so
        the bar grid is the music's own and a rephase (0094) moves both together.
      */
      const now = ctx.currentTime;
      for (const { layer, target, at, tau } of levelWrites(level, theme, nearness, anchorAudio, now, headingFor, ladder)) {
        headingFor[layer] = target;
        gains[layer].gain.cancelScheduledValues(now);
        gains[layer].gain.setTargetAtTime(target, at, tau);
      }
    },
    duck(amount: number): void {
      if (!started || !on || amount <= 0) return;
      const now = ctx.currentTime;
      /*
        ⚠️ **Written on the MASTER gain rather than per layer**, so a duck is one parameter write
        whatever the ladder is doing, and it cannot fight `setLevel`'s eleven — those are the layers'
        own gains and this is the bus they run into.

        ⚠️ **`cancelScheduledValues` first, so two explosions inside a second do not stack into
        silence.** The second dip replaces the first one's recovery rather than adding to it, which is
        what a real compressor does when it is already ducking.
      */
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(MUSIC_GAIN * (1 - amount), now, DUCK_DOWN_SECONDS / 3);
      master.gain.setTargetAtTime(MUSIC_GAIN, now + DUCK_HOLD_SECONDS, DUCK_UP_SECONDS / 3);
    },
    setOn(next: boolean): void {
      on = next;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(next ? MUSIC_GAIN : 0, ctx.currentTime, 0.08);
      // Switching it back on starts the loops if the run has been played in silence up to now. They
      // still start together, which is all the design asks — it is the phase BETWEEN them that has
      // to hold, never the phase against the level.
      if (next) {
        this.start();
        this.setLevel(current, near, place, shape);
        return;
      }
      /*
        ── OFF HAS TO STOP THE LOOPS, AND FOR ITS WHOLE LIFE IT ONLY MUTED THEM ────────────────────

        ⚠️ **`docs/decisions/0119-off-stops-the-loops.md`.** `applyMusicLevel` calls `start()` on
        EVERY frame and `start()` refuses only while `on` is false — and the audio is unlocked by a
        `pointerdown` in the CAPTURE phase, which lands before the `click` that applies the setting.
        **So a frame between the two starts the loops during the very gesture that turns sound off**,
        and `started` then stays true for ever: turning sound back on found nothing to do.

        ⚠️ **IT IS A RACE AND IT IS WHY THE GUARD WAS INTERMITTENT.** The same code passed on one CI
        run and failed on the next; `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`
        says establish which it is rather than rerun, and it is the code. `tests/sound.browser.test.ts`
        had the intended behaviour written in its own comment — *"turning the sound off stops the loops
        outright"* — and nothing implemented it.

        ⚠️ **Stopped AFTER the fade, not on the instant.** The master is already on its way to zero
        over 0.08s; stopping a source mid-cycle is a click, and the whole point of the ramp is that
        the setting is not one.
      */
      if (!started) return;
      const off = ctx.currentTime + STOP_AFTER_SECONDS;
      for (let i = 0; i < sources.length; i++) sources[i]!.stop(off);
      sources.length = 0;
      started = false;
      /*
        ⚠️ **And what each layer was heading for is forgotten with them** — 0117. A restart re-anchors
        the bar grid, so every ramp is scheduled afresh; leaving the old destinations in place would
        make `levelWrites` skip a layer whose gain now belongs to a different anchor.
      */
      for (const layer of MUSIC_LAYERS) delete headingFor[layer];
    },
    level(): MusicLevel {
      return current;
    },
    gainOf(layer: MusicLayer): AudioParam {
      return gains[layer].gain;
    },
    panOf(layer: MusicLayer): AudioParam {
      return pans[layer].pan;
    },
    setLoops(next: Record<MusicLayer, Float32Array>): void {
      /*
        ⚠️ **The buffers are replaced first and the sources second**, because `swapTo` reads
        `buffers[layer]` when it builds each source. Only the layers whose DATA actually changed cost
        anything: a place that shares a layer hands back the identical `Float32Array`, and copying it
        into a fresh `AudioBuffer` would spend the memory the sharing exists to save.
      */
      let moved = false;
      for (const layer of MUSIC_LAYERS) {
        const data = next[layer];
        if (data === buffers[layer].getChannelData(0)) continue;
        const buffer = ctx.createBuffer(1, data.length, rate);
        buffer.getChannelData(0).set(data);
        buffers[layer] = buffer;
        moved = true;
      }
      if (!moved || !started) return;
      /*
        ── THE NEXT BAR, AND IT WAS THE NEXT PHRASE FOR ONE LEVEL OF THE GAME ────────────────────────

        ⚠️ **`docs/decisions/0135-a-place-arrives-when-you-do.md`.** Reported of the first level that
        ever played its own music: *"the start of level 2 sounded a bit like the default start, it
        should immediately pick into the new thematic track."* A phrase is **25.6 seconds**, so a
        level could open with up to that much of the PREVIOUS place's material — and the opening
        stretch is deliberately empty (0043), so what the player heard was level one's piece over
        level two's first quiet minute.

        ⚠️ **0128 CHOSE THE PHRASE AND ITS ARGUMENT WAS ABOUT THE WRONG PIECE.** *"Swapping anywhere
        else restarts a sixteen-bar chord progression in the middle of itself"* is true of the piece
        being REPLACED and false of the one arriving: `swapTo` starts every source at position zero,
        so the incoming place begins at its own bar one whenever this fires. What the phrase bought
        was a tidy exit for material the player is leaving behind.

        ⚠️ **AND AT A CHANGE OF PLACE, CUTTING THE OLD PIECE IS THE POINT.** A level boundary is the
        one moment in a run where *you are somewhere else now* is the thing to say. A bar keeps
        `docs/decisions/0117-a-section-change-lands-on-the-beat.md` — nothing lands mid-bar — and
        costs at most 1.6 seconds instead of 25.6.

        ⚠️ **THE OTHER CALLER OF `swapTo` USED THE PHRASE AND IS GONE** —
        `docs/decisions/0160-the-music-free-runs.md`. `phaseTo`'s correction was a repair nobody was
        meant to hear (0094), so it waited for the instant every layer is back at the top anyway;
        this one is meant to be noticed, so it takes the bar. **One call and one clock now**, and
        the bar is the only answer left.
      */
      swapTo(placeArrivesAt(anchorAudio, ctx.currentTime, SCHEDULE_AHEAD));
    },
  };
}
