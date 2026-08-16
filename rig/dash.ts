/**
 * The sound dashboard: the game's own mixer, driven by a camera on a slider.
 *
 * `docs/decisions/0126-the-dashboard-is-the-instrument.md`.
 *
 * ── WHAT IT IS FOR ──────────────────────────────────────────────────────────────────────────────
 *
 * Reported, 2026-08-12: *"there's still whole sections of sound and music that have been produced
 * that I've apparently never heard in game… give me a local server with a sound dashboard where I can
 * play the music tracks and it lists at each point what sounds I should be hearing so I can verify,
 * and then overlay weapons fire and weapon tiers over it."*
 *
 * ⚠️ **IT PLAYS THE GAME'S MIXER AND NOT A MODEL OF IT.** `makeAudioOut` is the shell's own Web
 * Audio half and `makeSpeaker` is the shell's own gate — so the ducking, the voice cap, the holds,
 * the accents, the bus shaper and the bar-line quantisation are all the ones a player gets, because
 * they are literally the same objects. `docs/decisions/0116-the-rig-plays-the-level.md` exists
 * because the WAV rig drifted from the game twice; the cheapest way not to drift is not to have a
 * second copy.
 *
 * ⚠️ **AND THE READOUT IS THE GRAPH, NOT THE ARITHMETIC.** The *live* column reads each layer's
 * `GainNode` through `MusicOut.gainOf`, so the number on screen cannot disagree with the speakers.
 * The *target* column beside it is the arithmetic, from `rig/transport.ts`; the two being visible at
 * once is what makes a ramp something you can watch rather than something you infer.
 *
 * ⚠️ **NOTHING HERE IS IN THE BUILD.** `vite.config.ts` has one entry and it is the root
 * `index.html` — `docs/decisions/0003-single-file-build.md`'s sidecar list is closed and untouched.
 */

import { LEVELS, LEVEL_KINDS, type LevelKind } from '../src/content/levels.ts';
import {
  LAYER_PAN,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  SECTION_UNITS,
  type MusicLayer,
  type MusicLevel,
  type SectionUnits,
} from '../src/content/music.ts';
import { THEMES, bakedBy, revoicedBy, type ThemeKind } from '../src/content/themes.ts';
import { CUES, CUE_KINDS } from '../src/content/cues.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { SAMPLE_RATE, makeAudioOut, makeSpeaker, prewarmAudio, takePrewarmed } from '../src/app/sound.ts';
import { auraNearness, bakeLayer } from '../src/app/music.ts';
import { makeRng } from '../src/sim/rng.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import {
  SECTION_FLOOR_UNITS,
  SECTION_ORDER,
  UNITS_PER_SECOND,
  cueLines,
  deskAlone,
  dragSection,
  layerSpans,
  loudestGain,
  marksOf,
  momentOf,
  weaponAtTier,
  type Held,
  type LayerSpan,
  type Moment,
  type SolvedGains,
} from './transport.ts';
/*
  ⚠️ **THE SOLVE IS A SCRIPT AND THE DASHBOARD IS A BROWSER, AND THAT ARROW IS ALREADY IN USE.**
  `scripts/hear.mjs` imports `rig/transport.ts`; this is the same edge the other way, and both are
  rig-side — nothing under `src/` reaches either. What must not happen is TWO solves, which is why
  this imports rather than reimplements: `docs/decisions/0029-the-tracked-record-is-the-record.md` in
  arithmetic, the defect `scripts/weigh-audition.mjs` names about `tests/pace.ts`.
*/
import { profileOfLoops, rmsOfLoops, solveMix } from '../scripts/solve-mix.mjs';

/** How long the boss is held for. A stated choice, exactly as `scripts/hear.mjs --level` states it. */
const FIGHT_SECONDS = 45;

/**
 * The most sim steps one animation frame may catch up.
 *
 * ⚠️ **The same bound and the same reason as `src/app/loop.ts`'s `MAX_STEPS`.** A tab that was
 * backgrounded, or a scrub across two minutes, must not fire two thousand queued cues into one
 * frame — the game throws the backlog away rather than spiralling, and an instrument that did
 * anything else would be showing a burst the player can never hear.
 */
const MAX_STEPS = 5;

/**
 * The most steps the speaker is walked through in one tick before the rest are simply skipped.
 *
 * ⚠️ **A hidden tab throttled to one tick a second needs sixty**, and a machine back from sleep
 * could need a hundred thousand. Walking them all is pointless work; not walking them at all would
 * slide the step count — and therefore the gun — off the bar by the length of the gap. So the count
 * jumps and the walk does not.
 */
const CATCH_UP_STEPS = 240;

const el = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`rig/index.html has no #${id}`);
  return found as T;
};

/*
  ── A HOT UPDATE RELOADS THE PAGE, BECAUSE THE AUDIO IS BAKED AND HOT UPDATES ARE NOT ─────────────

  ⚠️ **Reported, 2026-08-13: *"sound dashboard hasn't been updated with the new sounds/tracks?"***
  Two things were true and only one of them was the branch not having merged. **A vite hot update
  re-runs the module and leaves every baked buffer exactly where it was**: `prewarmAudio` returns
  early once `prewarmed` is set (deliberately — 0102), `loopsByPlace` below is a live cache, and the
  `AudioBuffer`s inside `MusicOut` were copied at unlock. So editing `src/content/nebula.ts` updated
  the page, printed the new layer list, and went on playing the audio it synthesised when the tab was
  opened.

  ⚠️ **THAT IS THE WORST SHAPE A DEV TOOL CAN HAVE.** It does not fail — it reports confidently on a
  build that no longer exists, which is
  `docs/decisions/0027-measure-the-picture-not-the-model.md`'s subject wearing the instrument's own
  clothes, and `docs/machine.md` already records an hour lost to *establish which build a report is
  about* in the other channel.

  ⚠️ **A full reload is the whole fix and it costs the bake it was avoiding.** That is about four
  seconds on a place with its own composition, once per edit, and it is the difference between a
  dashboard and a thing that lies when you change a number.
*/
import.meta.hot?.accept(() => {
  window.location.reload();
});

const out = makeAudioOut();
const speaker = makeSpeaker(out);
/*
  ⚠️ **The prewarm runs here for the same reason `src/app/mount.ts` runs it at boot** — 0102 — and for
  one more: 0128's per-place bake shares the base composition rather than re-synthesising it, so
  `takePrewarmed` is where the shared half comes from. Without it the first change of place would have
  to bake twenty-three layers on the spot, which is two and a half seconds of frozen page.
*/
prewarmAudio();
/** One stream, so two takes of the same settings kill the same things — 0021. */
const bodies = makeRng('rig').stream('bodies');

let kind: LevelKind = LEVEL_KINDS[0]!;
let second = 0;
/**
 * Whether the level clock advances and the guns fire — the play button's own state.
 *
 * ── IT WAS ONE FLAG CALLED `playing` AND IT WAS TWO QUESTIONS ───────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0137-the-desk-sounds-while-the-level-stands-still.md`.** Reported: *"I need to
 * be able to pause the music and then play a particular sound to be able to identify what's
 * playing/not playing in the soundtrack… play sounds without affecting the current run of the melody
 * itself."* The one flag decided both whether the level WALKED and whether the loops were on the air,
 * so an audition had no way to make a sound without also starting the level moving underneath it —
 * `auditionOnly` called `togglePlay`, and a listen therefore advanced the rung it was a listen about.
 *
 * ⚠️ **THEY ARE GENUINELY TWO THINGS AND NOT A FIFTH STATE INVENTED HERE**, which is the objection
 * 0126 raised against exactly this shape. The level clock is what the scrub bar and the rung readout
 * are about; the loops being on the air is what `docs/decisions/0119-off-stops-the-loops.md` turns
 * on. Naming both is what lets the piece hold still and still be audible.
 */
let walking = false;
/**
 * Whether the loop set is on the air.
 *
 * ⚠️ **THE PLAY BUTTON SETS IT AND SO DOES THE DESK, AND THE LAST GESTURE WINS.** Pause has to
 * silence the mixer even with faders held — that is 0126's own amendment and the one thing a pause is
 * pressed for — and a fader moved after that pause has to be audible, or the desk is dead while the
 * level is stopped. There is no ordering of those two that a derived rule satisfies, so this is a
 * variable and the page says which state it is in.
 */
let onAir = false;
let walkSpeed = 1;
let tier = 0;
let killsPerSecond = 1.6;
let gapUnits = 85;
/**
 * Where the ship is across the lane, in world units.
 *
 * ⚠️ **The dashboard fired every cue with no position until 0127 landed**, which centred all of them
 * — and a tool that cannot show the stereo field is the tool this change would have been judged with.
 * The gun and the tubes sound from here; a kill, a hit and a threat are scattered across the lane,
 * because that is where the bodies are.
 */
let shipAcross = ACROSS_SPAN / 2;
let cuesOn = true;
/**
 * A layer the dashboard has taken off the mixer: whether it sounds at all, and by how much its
 * target is scaled.
 *
 * ⚠️ **A HELD LAYER IS NOT A MUTED ONE.** *"Select individual layers to play together and adjust
 * those layers to strengthen or diminish them to hear them sound together"* is a mixing desk, not a
 * solo button.
 *
 * ── AND IT WAS A MULTIPLIER, WHICH COULD NOT REACH THE THING THAT WAS ACTUALLY WANTED ────────────
 *
 * ⚠️ **`docs/decisions/0129-the-desk-holds-a-value-not-a-multiplier.md`.** The first desk held a
 * **trim over the mixer's own target**, and `trim × 0` is 0 — so **the fourteen layers the ladder has
 * closed at any given rung were unreachable**, and those are exactly the ones worth auditioning.
 * Reported: *"I need to be able to turn on sounds that aren't playing at the moment to see what they
 * would sound like."*
 *
 * ⚠️ **So a hold is an ABSOLUTE value now.** `null` follows the mixer; a number is what that layer
 * sits at, whatever the rung says — which makes the desk able to say *what if `frenzy` were open
 * during `run`* rather than only *what if `frenzy` were louder where it already plays*.
 *
 * ⚠️ **`Held` ITSELF LIVES IN `rig/transport.ts` NOW**, because 0137 asks a question about this map
 * that a guard has to be able to reach — *is the desk the only thing that would sound* — and this
 * file needs a DOM and an `AudioContext` to be imported at all (0126).
 */
const held = new Map<MusicLayer, Held>();

/** A layer is only in `held` while it is actually holding something. */
function holdOf(layer: MusicLayer): Held {
  return held.get(layer) ?? { gain: null, pan: null };
}

function setHold(layer: MusicLayer, next: Held): void {
  if (next.gain === null && next.pan === null) held.delete(layer);
  else held.set(layer, next);
}
let unlocked = false;
/**
 * Where this level's three middle rungs open, in world units back from its boss.
 *
 * ⚠️ **`docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md`.** It starts at the
 * game's own `SECTION_UNITS` and every answer on this page is asked with it, so a boundary dragged on
 * the strip moves the rung the mixer is actually handed — the ladder turns over where it was dragged
 * to, over the game's own 1.6-second ramp, quantised to the bar exactly as 0117 says.
 *
 * ⚠️ **IT IS ONE SET FOR ALL SEVEN LEVELS, BECAUSE THE GAME'S IS.** The three distances are measured
 * back from whichever boss the level has (0102), so they are not a property of a place — dragging on
 * level one's strip is a proposal about every level, and the panel says so.
 */
let sections: SectionUnits = SECTION_UNITS;
/**
 * Sim steps issued since the loops went on the air. Monotonic, and NOT a function of the scrub.
 *
 * ⚠️ **This is what keeps the gun on the music's grid, and it is why the dashboard never calls
 * `phaseTo`.** 0094's re-phase exists for a sim that DROPPED steps — a game loop's backlog, thrown
 * away by `src/app/loop.ts` rather than spiralled through. This tool has no game loop: the count
 * below is derived from the same wall clock the `AudioContext` runs on, so the two track to within
 * tens of parts per million (0094 says so in as many words) and there is nothing to correct. What a
 * correction WOULD do here is move the bar grid up to a phrase into the future, which is exactly
 * the bug a scrub used to cause.
 */
let steps = 0;
/** `performance.now()` at the instant the loops were started, or `null` before the first press. */
let startedAt: number | null = null;
let lastFrame = 0;
/** Layers written by the desk and not yet handed back to the mixer. */
const owed = new Set<MusicLayer>();

const totalOf = (k: LevelKind): number => LEVELS[k].bossAt / UNITS_PER_SECOND + FIGHT_SECONDS;

/**
 * Everything true of where the page is pointed right now.
 *
 * ⚠️ **ONE PLACE THAT KNOWS WHAT TO ASK, so the dragged sections cannot reach some answers and miss
 * others.** Six call sites each spelt the four arguments out; 0138 adds a fifth, and a readout still
 * asking about the shipped boundaries while the mixer follows the dragged ones is precisely the
 * *instrument disagreeing with the thing it measures* that 0126 exists against.
 */
/**
 * Whether the mixer is playing 0154's solved arrangement instead of `MUSIC_LADDER × mixOf`.
 *
 * ⚠️ **OFF IS THE SHIPPED MIX AND IS THE DEFAULT**, so the dashboard opens on the thing the game
 * actually plays and the toggle is the experiment rather than the other way round.
 */
let solvedOn = false;

const now = (): Moment =>
  momentOf(
    kind,
    second,
    FIGHT_SECONDS,
    auraNearness(gapUnits),
    sections,
    // ⚠️ The readout and the mixer both come through here, so they cannot disagree about which mix is
    // playing — which is the *instrument disagreeing with the thing it measures* 0126 exists against.
    solvedOn ? solvedFor(LEVELS[kind].theme) : null,
  );

const clockText = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ── THE CONTROLS ────────────────────────────────────────────────────────────────────────────────

const levelSelect = el<HTMLSelectElement>('level');
for (const k of LEVEL_KINDS) {
  const option = document.createElement('option');
  option.value = k;
  option.textContent = `${k} — ${THEMES[LEVELS[k].theme].title}`;
  levelSelect.append(option);
}

const scrub = el<HTMLInputElement>('scrub');
const playButton = el<HTMLButtonElement>('play');
const status = el('status');

/*
  ⚠️ **EACH JUMP FINDS ITS RUNG BY NAME RATHER THAN BY POSITION, WHICH 0138 MADE NECESSARY.** The
  marks used to be six in a fixed order; a boundary dragged past the whole level removes one — `push`
  at more than `bossAt` gives a level that opens at `push` and never plays `run` — and an index would
  then have silently jumped to the wrong section rather than doing nothing.
*/
for (const [label, rung] of [
  ['run', 'run'],
  ['push', 'push'],
  ['surge', 'surge'],
  ['approach', 'approach'],
  ['boss', 'boss'],
  ['peak', 'bossPeak'],
] as const) {
  const button = document.createElement('button');
  button.textContent = label;
  button.addEventListener('click', () => {
    const mark = marksOf(kind, FIGHT_SECONDS, sections).find((m) => m.rung === rung);
    // A hair past the boundary, so the readout shows the rung that has just started rather than the
    // instant before it.
    if (mark !== undefined) seek(mark.second + 0.05);
  });
  el('jumps').append(button);
}

/**
 * Move to a different place in the level.
 *
 * ── AND THE STEP CLOCK DOES NOT MOVE WITH IT, WHICH COST AN HOUR TO FIND ────────────────────────
 *
 * ⚠️ **THE FIRST VERSION RE-ANCHORED `steps` HERE AND IT BROKE EVERY RAMP AFTER A SCRUB.** A jump
 * makes the step clock disagree with the audio clock by however far you jumped; `phaseTo` reads that
 * as drift and corrects it the way 0094 says — by restarting the loop set at the next PHRASE
 * boundary, up to 25.6 seconds ahead. `anchorAudio` becomes that future instant, `nextBarFrom`
 * returns it for every subsequent write, and **the whole ladder freezes at whatever it was showing
 * until the anchor arrives.** Observed as: jump to `surge`, and the layers `surge` opens stay
 * silent while the readout insists they are at full.
 *
 * ⚠️ **So a scrub moves the LEVEL and never the clock.** The level position is what the slider is
 * about; the music has been playing continuously since the first press and nothing about looking at
 * a different part of the level should move it.
 */
function seek(to: number): void {
  second = Math.max(0, Math.min(totalOf(kind), to));
}

el<HTMLButtonElement>('unlock').addEventListener('click', () => {
  out.unlock();
  unlocked = out.ready();
  const music = out.music();
  music?.start();
  // The loops go on the air here, so this is step zero — and everything the gun does is counted
  // from it rather than from the scrub.
  startedAt = performance.now();
  steps = 0;
  // The place the selector is already showing — 0128. Without this the first level you unlock on
  // plays the base composition however its theme is voiced.
  goToPlace(LEVELS[kind].theme);
  playButton.disabled = !unlocked;
  status.textContent = unlocked ? 'audio running' : 'the browser refused a context — no AudioContext on this page';
  el<HTMLButtonElement>('unlock').disabled = unlocked;
  if (unlocked && !walking) togglePlay();
});

/**
 * Start or stop the level walking — **and the music with it, unless the desk has an opinion.**
 *
 * ── PAUSE USED TO STOP THE CLOCK AND LEAVE THE LOOPS RUNNING ────────────────────────────────────
 *
 * ⚠️ **Reported: *"it stops the timer bar, but the music is still running in the browser."*** It was
 * a straight omission: the one flag gated the walk and the cues and nothing told the mixer. A pause
 * that keeps playing is worse than no pause, because the one thing you press it for is to stop and
 * think about what you just heard.
 *
 * ⚠️ **AND THEN THAT FIX WENT ONE STEP TOO FAR, WHICH IS 0137** —
 * `docs/decisions/0137-the-desk-sounds-while-the-level-stands-still.md`. Stopping the loops is right;
 * what was wrong is that nothing could put them back on the air without also setting the level
 * walking, so *"pause the music and then play a particular sound"* was not a state this page had.
 * `setOnAir` is the half that was missing, and this now says only what the play button means.
 */
function togglePlay(): void {
  walking = !walking;
  playButton.textContent = walking ? '⏸ pause' : '▶ play';
  playButton.setAttribute('aria-pressed', String(walking));
  lastFrame = performance.now();
  /*
    ⚠️ **PAUSE SILENCES THE MIXER EVEN WITH FADERS HELD, AND THAT IS DELIBERATE** — 0126's own
    amendment. *"It stops the timer bar, but the music is still running in the browser"* is what a
    pause that respected the desk would go back to being. A desk gesture AFTER the pause puts the
    loops back on the air (`afterDeskChange`), which is 0137's whole subject; the ordering is the
    rule, and the page prints which state it is in.
  */
  setOnAir(walking);
  drawTransport();
}
playButton.addEventListener('click', togglePlay);

/**
 * Put the loop set on the air, or take it off — and re-anchor the step clock when it goes back on.
 *
 * ⚠️ **`setOn` IS THE GAME'S OWN STOP AND NOT A MUTE** —
 * `docs/decisions/0119-off-stops-the-loops.md` is the decision that made it actually stop the
 * sources after a race left `started` true for ever. So a dashboard that is off is in exactly the
 * state a player who turned sound off is in, rather than in a state invented here — and a fader
 * written into a stopped transport writes into nothing, which is why every gesture that wants to be
 * heard comes through this first.
 *
 * ⚠️ **GOING BACK ON THE AIR RE-ANCHORS THE STEP CLOCK, BECAUSE `start()` RE-ANCHORS THE LOOPS.**
 * They resume at a fresh instant, so a step count measured from the old one would put the gun a
 * stop-length off the bar — the same class of bug a scrub used to cause, arriving from the other
 * side.
 */
function setOnAir(on: boolean): void {
  if (on === onAir) return;
  onAir = on;
  const music = out.music();
  if (music === null) return;
  music.setOn(on);
  if (!on) return;
  startedAt = performance.now();
  steps = 0;
  // The loop set is new, so every gain the desk was holding has to be stated over it again.
  owed.clear();
  restate(now());
}

/**
 * Say what the transport is doing, in the two states that are now separable.
 *
 * ⚠️ **THE DIMMING FOLLOWS THE AIR AND THE WORD *stopped* FOLLOWS THE WALK**, which is the whole
 * reason they are two classes. A layer's own gain is upstream of `setOn`, so the *live* column goes
 * on reporting `sub 0.86` into silence whenever the loops are off — that is what `mute` greys out.
 * Being stopped with the desk sounding is a real and useful state and the readout has to distinguish
 * it from silence, or the page is lying in the one direction 0126 exists to prevent.
 */
function drawTransport(): void {
  document.body.classList.toggle('paused', !walking);
  document.body.classList.toggle('mute', !onAir);
}

/**
 * The loops each place plays, baked once and kept.
 *
 * ⚠️ **ONLY THE RE-VOICED LAYERS ARE BAKED, WHICH IS THE WHOLE POINT OF 0128.** A place that states
 * nothing hands back the base arrays unchanged, so `setLoops` sees identical data and does not even
 * make a buffer. Ember Nebula re-voices two of twenty-three, so changing to it costs two layers of
 * synthesis rather than a composition.
 */
const loopsByPlace = new Map<ThemeKind, Record<MusicLayer, Float32Array>>();

function loopsFor(theme: ThemeKind): Record<MusicLayer, Float32Array> | null {
  const cached = loopsByPlace.get(theme);
  if (cached !== undefined) return cached;
  const base = takePrewarmed()?.loops;
  // Before the prewarm has finished there is nothing to share from, and baking a whole composition
  // on the spot would freeze the page. The place arrives on the next change instead.
  if (base === undefined) return null;
  const own = { ...base } as Record<MusicLayer, Float32Array>;
  // ⚠️ , so a layer this place only gives a ROOM to is re-baked too — 0136.
  for (const layer of bakedBy(theme)) own[layer] = bakeLayer(layer, SAMPLE_RATE, theme);
  loopsByPlace.set(theme, own);
  return own;
}

/**
 * The solved arrangement's gains for a place, computed once and kept.
 *
 * ── THE MIX 0154 SOLVED COULD ONLY BE HEARD BY RENDERING A FILE ─────────────────────────────────
 *
 * ⚠️ **Asked, on being handed six rendered wavs:** *"How do I listen to `MUSIC_LADDER` and `mixOf`?
 * Are they on my music dashboard to listen to?"* They **are** the dashboard — `targetGain` is exactly
 * `MUSIC_LADDER × mixOf` — and the solved arrangement was the one thing that was not, which is the
 * wrong way round for the instrument
 * `docs/decisions/0126-the-dashboard-is-the-instrument.md` exists to be. A mix that can only be heard
 * by opening a file somewhere else is a mix nobody will iterate on.
 *
 * ⚠️ **THE SOLVE OWNS DSP AND THIS FILE OWNS THE LOOPS**, which is why it happens here rather than in
 * `rig/transport.ts` — that file is the arithmetic of *what is sounding when* and has no audio in it.
 *
 * ⚠️ **CACHED PER PLACE, because it costs about 400ms**: band profiles for twenty-three layers plus a
 * few dozen fixed-point iterations a rung. Paid on the first press of the toggle, never in a frame.
 *
 * ⚠️ **AND IT WAITS FOR THE PREWARM**, exactly as `loopsFor` does — before the first press there is
 * nothing baked to measure, and returning `null` leaves the mixer on the shipped gains rather than
 * on silence.
 */
const solvedByPlace = new Map<ThemeKind, SolvedGains>();

function solvedFor(theme: ThemeKind): SolvedGains | null {
  const cached = solvedByPlace.get(theme);
  if (cached !== undefined) return cached;
  const loops = loopsFor(theme);
  if (loops === null) return null;
  const profile = profileOfLoops(loops);
  const rms = rmsOfLoops(loops);
  const gains: Partial<Record<MusicLevel, Record<MusicLayer, number>>> = {};
  // ⚠️ `solve-mix.mjs` is JavaScript, so its return is untyped at this edge. The cast is the boundary
  // and the only one — `SolvedGains` types every reader of the map.
  for (const rung of MUSIC_LEVELS) {
    gains[rung] = solveMix(theme, rung, loops, profile, rms).gains as Record<MusicLayer, number>;
  }
  solvedByPlace.set(theme, gains);
  return gains;
}

function goToPlace(theme: ThemeKind): void {
  const music = out.music();
  const loops = loopsFor(theme);
  if (music === null || loops === null) return;
  music.setLoops(loops);
  // The swap re-anchors the loops, so the step clock has to be re-anchored with them or the gun ends
  // up a phrase out of phase with the bar — the same trap a scrub used to fall into.
  startedAt = performance.now();
  steps = 0;
}

levelSelect.addEventListener('change', () => {
  kind = levelSelect.value as LevelKind;
  seek(0);
  goToPlace(LEVELS[kind].theme);
  // An audition is *the loudest THIS PLACE takes it*, so a change of place re-states it — 0130.
  // Without this the fader keeps the last level's number over the new level's material.
  const only = aloneOn();
  if (only !== null) auditionOnly(only);
  drawSpans();
  drawStrip();
  drawPlace();
  // The three distances are NOT a property of a place, so they survive the change — but the strip
  // they are drawn on has a different length now, and the readout says which level they are over.
  drawSections();
});

/** Say what this place plays that the last one did not. */
function drawPlace(): void {
  const theme = LEVELS[kind].theme;
  const own = revoicedBy(theme);
  el('place').textContent =
    own.length === 0
      ? 'shares every layer with the base composition'
      : `plays its own ${own.join(', ')} — ${own.length} of ${MUSIC_LAYERS.length}`;
}
el<HTMLSelectElement>('speed').addEventListener('change', (e) => {
  walkSpeed = Number((e.target as HTMLSelectElement).value);
});
scrub.addEventListener('input', () => {
  seek((Number(scrub.value) / 1000) * totalOf(kind));
});
el<HTMLInputElement>('cuesOn').addEventListener('change', (e) => {
  cuesOn = (e.target as HTMLInputElement).checked;
});

/*
  ⚠️ **THE A/B 0154 COULD NOT OFFER.** Flipping this swaps every solved layer's gain for the
  arrangement's; the aura, the ramps, the bar-line quantisation and the desk's own holds are all
  untouched — so what changes between the two positions is the BALANCE and nothing else, which is the
  only way a listener can attribute a difference to the change rather than to the rig.

  ⚠️ **`afterDeskChange` IS WHAT PUTS IT ON THE AIR** — 0137: the mixer is following targets, and a
  new set of them is exactly the kind of change that has to be pushed rather than waited for.
*/
el<HTMLInputElement>('solvedOn').addEventListener('change', (e) => {
  solvedOn = (e.target as HTMLInputElement).checked;
  afterDeskChange();
});

const bind = (id: string, outId: string, set: (v: number) => void, format = (v: number) => String(v)): void => {
  const input = el<HTMLInputElement>(id);
  const label = el(outId);
  const apply = (): void => {
    set(Number(input.value));
    label.textContent = format(Number(input.value));
  };
  input.addEventListener('input', apply);
  apply();
};
bind('tier', 'tierOut', (v) => (tier = v));
bind('bodies', 'bodiesOut', (v) => (killsPerSecond = v), (v) => v.toFixed(1));
bind('gap', 'gapOut', (v) => (gapUnits = v));
bind('shipAt', 'shipAtOut', (v) => (shipAcross = v));

// ── THE LAYER TABLE ─────────────────────────────────────────────────────────────────────────────

interface LayerRow {
  move: HTMLElement;
  target: HTMLElement;
  live: HTMLElement;
  bar: HTMLElement;
  gain: HTMLInputElement;
  pan: HTMLInputElement;
  panOut: HTMLElement;
  follow: HTMLButtonElement;
  tr: HTMLTableRowElement;
}

/** The most a layer may be pushed to on the desk. Above the ladder's own top, on purpose. */
const DESK_CEILING = 1.5;
const layerRows = {} as Record<MusicLayer, LayerRow>;

{
  const body = el<HTMLTableSectionElement>('layers').querySelector('tbody')!;
  const spans = layerSpans(kind, FIGHT_SECONDS, sections);
  for (const layer of MUSIC_LAYERS) {
    const span = spans.find((s) => s.layer === layer)!;
    const tr = document.createElement('tr');
    tr.title = `${layer} — a ${span.loopSeconds.toFixed(1)}s loop`;
    tr.innerHTML =
      `<td><b class="lay">${layer}</b></td>` +
      `<td><span class="badge"></span></td>` +
      `<td class="target">0.00</td>` +
      `<td class="live">0.00</td>` +
      `<td><span class="meter"><i></i></span></td>` +
      `<td><input class="g" type="range" min="0" max="${Math.round(DESK_CEILING * 100)}" step="2" value="0" /></td>` +
      `<td><input class="p" type="range" min="-100" max="100" step="5" value="${Math.round(LAYER_PAN[layer] * 100)}" /></td>` +
      `<td class="dim panOut">${panText(LAYER_PAN[layer])}</td>` +
      `<td><button class="fol" title="hand this layer back to the mixer">follow</button></td>`;
    const row: LayerRow = {
      move: tr.querySelector('.badge')!,
      target: tr.querySelector('.target')!,
      live: tr.querySelector('.live')!,
      bar: tr.querySelector('.meter i')!,
      gain: tr.querySelector('.g')!,
      pan: tr.querySelector('.p')!,
      panOut: tr.querySelector('.panOut')!,
      follow: tr.querySelector('.fol')!,
      tr,
    };
    // Clicking the NAME solos — the fast gesture, kept from the first version because naming a
    // sound you can hear and cannot place is what the solo rig was built for (0113).
    tr.querySelector('.lay')!.addEventListener('click', () => solo(layer));
    /*
      ⚠️ **TOUCHING A SLIDER IS WHAT TAKES THE LAYER, and there is no separate *hold* control.** A
      checkbox to arm a fader before it does anything is a step between wanting a thing and hearing
      it; the whole point of this panel is that the gap is short. `follow` is how a layer goes back.
    */
    row.gain.addEventListener('input', () => {
      setHold(layer, { ...holdOf(layer), gain: Number(row.gain.value) / 100 });
      afterDeskChange();
    });
    row.pan.addEventListener('input', () => {
      setHold(layer, { ...holdOf(layer), pan: Number(row.pan.value) / 100 });
      afterDeskChange();
    });
    row.follow.addEventListener('click', () => {
      setHold(layer, { gain: null, pan: null });
      afterDeskChange();
    });
    body.append(tr);
    layerRows[layer] = row;
  }
}

function panText(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'centre';
  return `${pan < 0 ? 'L' : 'R'} ${Math.abs(pan).toFixed(2)}`;
}

function afterDeskChange(): void {
  drawHeld();
  /*
    ⚠️ **A DESK THAT IS ALONE SOUNDS WHETHER THE LEVEL IS WALKING OR NOT** — 0137. The loops have to
    be on the air for a fader to write into anything at all (0119 stops the sources rather than
    muting them), and the level clock does not move to let that happen: the whole point is to hold
    the piece where it is and hear one part of it.
  */
  setOnAir(walking || deskAlone(held));
  drawTransport();
  restate(now());
}

/**
 * Hold every layer but this one at silence, or hand them all back if it was already alone.
 *
 * ⚠️ **The soloed layer is held at whatever the LADDER says, not at a fixed loud value** — so
 * soloing during `run` a layer that `run` closes gives silence, which is the honest answer and is
 * exactly what the gain fader is for. Dragging it up is the follow-on gesture.
 */
function solo(layer: MusicLayer): void {
  const others = MUSIC_LAYERS.filter((l) => l !== layer);
  const alone = others.every((l) => holdOf(l).gain === 0);
  for (const other of others) setHold(other, { ...holdOf(other), gain: alone ? null : 0 });
  if (alone) setHold(layer, { ...holdOf(layer), gain: null });
  afterDeskChange();
}

function drawHeld(): void {
  for (const layer of MUSIC_LAYERS) {
    const row = layerRows[layer];
    const hold = holdOf(layer);
    const holding = hold.gain !== null || hold.pan !== null;
    row.tr.classList.toggle('held', holding);
    row.tr.classList.toggle('off', hold.gain === 0);
    row.gain.classList.toggle('following', hold.gain === null);
    row.pan.classList.toggle('following', hold.pan === null);
    row.follow.disabled = !holding;
    row.panOut.textContent = panText(hold.pan ?? LAYER_PAN[layer]);
  }
  el('heldCount').textContent = String(held.size);
  // The audition buttons read the desk rather than remembering what they did to it — 0130.
  const only = aloneOn();
  for (const layer of MUSIC_LAYERS) {
    auditionButtons[layer].setAttribute('aria-pressed', String(layer === only));
  }
}

/** The bulk gestures. Each one is a starting point for a listen rather than a setting. */
const BULK: readonly [string, (layer: MusicLayer) => Held][] = [
  // Everything audible at one level, INCLUDING what the rung has closed. This is the answer to
  // *what is even in here* and it is the button 0129 was asked for.
  ['openAll', () => ({ gain: 0.7, pan: null })],
  ['allOff', () => ({ gain: 0, pan: null })],
  ['release', () => ({ gain: null, pan: null })],
];
for (const [id, value] of BULK) {
  el<HTMLButtonElement>(id).addEventListener('click', () => {
    for (const layer of MUSIC_LAYERS) setHold(layer, value(layer));
    syncSliders();
    afterDeskChange();
  });
}

/** Put every fader where the desk now says, after something other than a drag moved it. */
function syncSliders(): void {
  for (const layer of MUSIC_LAYERS) {
    const hold = holdOf(layer);
    const row = layerRows[layer];
    if (hold.gain !== null) row.gain.value = String(Math.round(hold.gain * 100));
    row.pan.value = String(Math.round((hold.pan ?? LAYER_PAN[layer]) * 100));
  }
}

// ── ONE LAYER, ON ITS OWN, IN ONE CLICK ─────────────────────────────────────────────────────────

/*
  ⚠️ **`docs/decisions/0130-a-layer-can-be-heard-on-its-own.md`.** Reported: *"the music dashboard
  needs to let me play music components as well as every sound in the game, so I can hear them
  individually without needing to have the main theme playing."*

  ⚠️ **THE DESK COULD ALREADY DO THIS AND IT TOOK THREE GESTURES**, which is the whole of what was
  wrong: solo the layer, find its fader, drag it up — because `solo` pins the others at silence and
  leaves the survivor at whatever the LADDER says, and fourteen of the twenty-three are closed at any
  given rung (0129). The panel over the cues is one click a sound; this is its twin.

  ⚠️ **IT IS THE DESK AND NOT A SECOND PLAYER, WHICH IS THE PART WORTH DEFENDING.** The obvious build
  is a `BufferSourceNode` per button straight at the destination — and it would bypass `MUSIC_GAIN`,
  the bus shaper and the duck, so what a button played would not be what the game plays. 0116 records
  two verdicts taken from a rig that had come apart from the game; a second playback path inside the
  instrument built to prevent that is the same mistake with a shorter fuse. Moving the mixer's own
  faders costs nothing and cannot drift.
*/

const auditionButtons = {} as Record<MusicLayer, HTMLButtonElement>;

{
  const row = el('alone');
  const spans = layerSpans(kind, FIGHT_SECONDS, sections);
  for (const layer of MUSIC_LAYERS) {
    const span = spans.find((s) => s.layer === layer)!;
    const button = document.createElement('button');
    button.textContent = layer;
    button.title = `${layer} — a ${span.loopSeconds.toFixed(1)}s loop`;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => auditionOnly(aloneOn() === layer ? null : layer));
    row.append(button);
    auditionButtons[layer] = button;
  }
  const back = document.createElement('button');
  back.textContent = 'everything back';
  back.addEventListener('click', () => auditionOnly(null));
  row.append(back);
}

/**
 * Which layer the desk currently has alone, or `null`.
 *
 * ⚠️ **DERIVED FROM THE DESK RATHER THAN REMEMBERED**, so dragging a fader after an audition cannot
 * leave a button lit that is no longer telling the truth. The desk is the state; this is a reading
 * of it, on exactly the terms the *live* column is a reading of the graph.
 */
function aloneOn(): MusicLayer | null {
  let only: MusicLayer | null = null;
  for (const layer of MUSIC_LAYERS) {
    const gain = holdOf(layer).gain;
    // A layer following the mixer means the desk is not holding the whole set, so nothing is alone.
    if (gain === null) return null;
    if (gain > 0) {
      if (only !== null) return null;
      only = layer;
    }
  }
  return only;
}

/**
 * Put one layer alone on the desk at the loudest this place ever takes it — or hand the lot back.
 *
 * ⚠️ **The loops have to be ON THE AIR, so this starts them.** A paused dashboard has called `setOn`
 * and that STOPS the sources rather than muting them (0119), so a fader written into silence writes
 * into nothing. What the player asked not to hear is the rest of the piece, and every other fader
 * being at zero is what answers that.
 */
function auditionOnly(only: MusicLayer | null): void {
  const theme = LEVELS[kind].theme;
  for (const layer of MUSIC_LAYERS) {
    const pan = holdOf(layer).pan;
    if (only === null) setHold(layer, { gain: null, pan });
    else setHold(layer, { gain: layer === only ? loudestGain(theme, layer) : 0, pan });
  }
  syncSliders();
  /*
    ⚠️ **IT NO LONGER STARTS THE LEVEL WALKING, WHICH IS 0137** — it used to call `togglePlay`, so a
    listen taken while the page was stopped set the whole level moving underneath it and the rung the
    listen was about had changed by the time it was over. `afterDeskChange` puts the loops on the air
    and leaves the clock exactly where it was.
  */
  afterDeskChange();
}

/**
 * How fast a held gain moves to where the desk says, in seconds.
 *
 * ⚠️ **Short enough to feel like a fader and long enough not to click.** A `setValueAtTime` on a
 * dragged slider steps the waveform sixty times a second, which is audible as grain on a sustained
 * pad. This is a tenth of the mixer's own ramp and an order of magnitude above a sample.
 */
const HOLD_SECONDS = 0.03;

/*
  ⚠️ **THERE IS NO *only write when it moved* SHORTCUT HERE, AND THE AURA IS WHY.** `levelWrites`
  skips a layer whose target has not moved — except the two aura layers, which it writes on EVERY
  frame by design (0091: they track a distance the player is steering, so they are never at rest).
  A desk that wrote only on a change therefore lost a tug of war with the mixer on exactly those two:
  switched off, they settled at 0.01–0.02 instead of silence, because the hold stopped writing inside
  its own tolerance and `setLevel` went on pulling them back up sixty times a second.

  ⚠️ **So a held layer is written every frame, full stop.** It is a `cancelScheduledValues` and a
  `setTargetAtTime` per held layer per frame — the same two calls the mixer already makes for the
  aura — and re-basing an exponential approach each frame still converges at `HOLD_SECONDS`.
*/

/**
 * Put every held layer where the desk says, and hand a released one back to the mixer.
 *
 * ── WHY THE DESK HAS TO KEEP WRITING AND THE MIXER DOES NOT ─────────────────────────────────────
 *
 * ⚠️ **A held gain survives `setLevel` without any help, which is 0117 working rather than luck.**
 * The mixer only writes a layer whose TARGET moved, so a gain written here is left alone until the
 * rung changes. What it cannot do is FOLLOW: a held layer at ×1.4 has to move when the ladder moves,
 * and the mixer's ramp for it was never scheduled. So this is called every frame and writes only
 * when the answer has actually changed — `HOLD_EPSILON` is what keeps that from being sixty
 * automation events a second on a layer that is sitting still.
 *
 * ⚠️ **A HELD LAYER THEREFORE FOLLOWS A RUNG CHANGE IMMEDIATELY RATHER THAN OVER 1.6 SECONDS**, and
 * the page says so where the desk is. That is a real difference from the game and it is the price of
 * the feature; judging a transition is what *hand it all back* is for.
 *
 * ⚠️ **THE RELEASE IS THE HALF THAT IS NOT OBVIOUS.** Un-holding cannot simply stop writing: the
 * mixer believes that layer is already where it asked for, so it would stay wherever the desk left
 * it until the next rung. A release states the mixer's own target once, and `moment.layers` is where
 * that target comes from — the same arithmetic the readout prints.
 *
 * ⚠️ **Zero is the cancel time and it is not a placeholder.** `cancelScheduledValues` drops every
 * event at or after the instant it is given and an automation starting in the past is already under
 * way, so a time of zero means *now, and forget whatever was scheduled* — which saves `MusicOut` a
 * second accessor it would have had for this alone.
 */
function restate(moment: Moment): void {
  const music = out.music();
  if (music === null) return;
  for (const { layer, target } of moment.layers) {
    const hold = holdOf(layer);
    /*
      ⚠️ **The pan is written whenever it is held and never otherwise.** It is not a per-frame tug of
      war the way the gain is — nothing in the mixer ever moves a pan after construction — so this is
      only reached when the desk actually has an opinion, and releasing it puts `LAYER_PAN` back.
    */
    const pan = music.panOf(layer);
    const wantPan = hold.pan ?? LAYER_PAN[layer];
    if (Math.abs(pan.value - wantPan) > 0.001) {
      pan.cancelScheduledValues(0);
      pan.setTargetAtTime(wantPan, 0, HOLD_SECONDS);
    }
    if (hold.gain !== null) {
      const gain = music.gainOf(layer);
      gain.cancelScheduledValues(0);
      // ⚠️ **ABSOLUTE, so a layer the rung has closed is reachable** — 0129, and the whole point.
      gain.setTargetAtTime(hold.gain, 0, HOLD_SECONDS);
      owed.add(layer);
    } else if (owed.has(layer)) {
      const gain = music.gainOf(layer);
      gain.cancelScheduledValues(0);
      gain.setTargetAtTime(target, 0, HOLD_SECONDS);
      owed.delete(layer);
    }
  }
}

// ── THE CUE TABLE ───────────────────────────────────────────────────────────────────────────────

const cueBody = el<HTMLTableSectionElement>('cues').querySelector('tbody')!;
/** Which cues the player has switched off in the dashboard — not a game setting. */
const silenced = new Set<string>();

function drawCues(): void {
  const lines = cueLines(tier, now().rung, killsPerSecond);
  cueBody.replaceChildren();
  for (const line of lines) {
    const tr = document.createElement('tr');
    if (!line.sounds) tr.className = 'off';
    const every = line.every === null ? 'scattered' : `${line.every} steps`;
    tr.innerHTML =
      `<td><b>${line.kind}</b> <span class="dim">${CUES[line.kind].twin}</span></td>` +
      `<td class="dim">${every}</td>` +
      `<td>${line.perSecond.toFixed(2)}</td>` +
      `<td><button aria-pressed="${!silenced.has(line.kind)}">${silenced.has(line.kind) ? 'off' : 'on'}</button></td>`;
    tr.querySelector('button')!.addEventListener('click', () => {
      if (silenced.has(line.kind)) silenced.delete(line.kind);
      else silenced.add(line.kind);
      drawCues();
    });
    cueBody.append(tr);
  }
}

/*
  ── EVERY CUE, ON DEMAND, AND THIS IS THE HALF THE REPORT WAS ACTUALLY ABOUT ─────────────────────

  ⚠️ **Six cues fire by themselves and EIGHT do not.** A bomb, a blast, a shield taking a hit, a
  pickup, a death, a boss changing phase, a boss dying and the chime are each a thing a run says
  rarely or once — which is precisely *"whole sections of sound that have been produced that I've
  apparently never heard in game"*. The overlay above answers *what is playing over the bed right
  now*; this answers *what else is in there*.

  ⚠️ **Through `speaker.play` and never straight at the buffer**, so the hold, the four-voice cap
  and the duck are the game's, and an `onGrid` cue waits for the next sixteenth exactly as it does
  in a run — 0104. An audition that bypassed the gate would be a sound the player cannot actually
  produce.
*/
{
  const every = el('every');
  for (const kind of CUE_KINDS) {
    const button = document.createElement('button');
    button.textContent = kind;
    button.title = `${CUES[kind].twin} · gain ${CUES[kind].gain} · hold ${CUES[kind].hold} steps`;
    button.addEventListener('click', () => {
      // Auditioned from where the ship is, so the field is audible here too — 0127. `hit` and the
      // chime are centred by the game whatever they are handed, which is the point of trying them.
      speaker.play(kind, shipAcross);
      flash(kind);
    });
    every.append(button);
  }
}

const fired = el('fired');
/**
 * Show that a cue just sounded.
 *
 * ⚠️ **REPEATS COALESCE, AND WITHOUT IT THE LOG SHOWS NOTHING BUT THE GUN.** At tier four the pulse
 * lands fifteen times a second, so every other cue in the game was pushed out of the window inside
 * a second and a half — the panel meant to show *what else is in there* was a list of one thing.
 * Counting is also the more useful reading: `pulse ×14` beside a single `bossDown` is the density
 * the eleventh play-test was about.
 */
function flash(kindName: string): void {
  const first = fired.firstElementChild as HTMLElement | null;
  if (first !== null && first.dataset.kind === kindName) {
    const count = Number(first.dataset.count ?? '1') + 1;
    first.dataset.count = String(count);
    first.textContent = `${kindName} ×${count}`;
    return;
  }
  const tag = document.createElement('span');
  tag.dataset.kind = kindName;
  tag.dataset.count = '1';
  tag.textContent = kindName;
  fired.prepend(tag);
  while (fired.childElementCount > 12) fired.lastElementChild?.remove();
}

/**
 * Everything that sounds on one sim step, at the cadences `rig/transport.ts` says.
 *
 * ⚠️ **THE RUNG IS HANDED IN RATHER THAN ASKED FOR, AND THE DRAG IS WHY.** `momentOf` walks the whole
 * level at a sixty-fourth of a second to find its rung marks — eleven thousand steps — and this runs
 * sixty times a second, which was tolerable while nothing else was competing. 0138 redraws the strip
 * and the coverage table on every pointer move, so the walk is now in the way of the one gesture the
 * feature exists for. `frame` already has the moment; it costs nothing to pass it.
 */
function cuesOnStep(step: number, rung: MusicLevel): void {
  if (!cuesOn) return;
  const weapon = weaponAtTier(tier);
  const play = (name: Parameters<typeof speaker.play>[0], across: number): void => {
    if (silenced.has(name)) return;
    speaker.play(name, across);
    flash(name);
  };
  if (step % weapon.fireEvery === 0) play('pulse', shipAcross);
  if (weapon.launchers > 0 && step % weapon.missileEvery === 0) play('missile', shipAcross);
  // A boss holds a station and drifts across it (0061); the middle is the honest stand-in.
  if ((rung === 'boss' || rung === 'bossPeak') && step % 72 === 0) play('bossShot', ACROSS_SPAN / 2);
  /*
    ⚠️ **A kill lands on the step a collision resolves and NOTHING quantises it**, so it is drawn
    rather than placed — which is exactly as musical as the game is. A dashboard that put these on
    the grid would be showing a tidier game than the one being judged.
  */
  const chance = killsPerSecond / STEPS_PER_SECOND;
  /*
    ⚠️ **Scattered across the LANE as well as across the beat** — 0127. A kill happens where the body
    was, and the whole point of placing them is that a fight is not a single point. `hit` is drawn a
    position here and the game centres it, which the panel below says out loud: it is the one cue with
    nothing to ask.
  */
  if (bodies.range(0, 1) < chance) play('kill', bodies.range(0, ACROSS_SPAN));
  if (bodies.range(0, 1) < chance) play('hit', bodies.range(0, ACROSS_SPAN));
  if (bodies.range(0, 1) < chance * 0.6) play('threat', bodies.range(0, ACROSS_SPAN));
}

// ── THE TIMELINE STRIP ──────────────────────────────────────────────────────────────────────────

const strip = el('strip');
const head = document.createElement('div');
head.className = 'head';

/*
  ── AND THE THREE BOUNDARIES ARE DRAGGED HERE ───────────────────────────────────────────────────

  ⚠️ **`docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md`.** Reported: *"I'd love
  it if we could make the run section that has the push, surge, approach sections slideable so that I
  can drag them to start sooner or end sooner and see what effect that has."*

  ⚠️ **ONLY THREE OF THE FIVE MOVE, AND WHICH TWO DO NOT IS THE INTERESTING HALF.** `approach`→`boss`
  is where the level's boss ARRIVES — `bossAt` is level design and not a music number — and
  `boss`→`bossPeak` is keyed to the boss's HEALTH rather than to a clock, deliberately
  (`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`: *"a clock would put the wall of
  sound on a player who is losing and on one who is winning at the same instant"*). A handle that
  dragged either of those in TIME would be offering a control over something time does not decide.
*/

/** Which boundary a pointer is currently holding, or `null`. */
let dragging: keyof SectionUnits | null = null;

/** Where a boundary would land if it were let go at `clientX`, in units back from the boss. */
function unitsAtClientX(x: number): number {
  const rect = strip.getBoundingClientRect();
  const fraction = rect.width === 0 ? 0 : (x - rect.left) / rect.width;
  return LEVELS[kind].bossAt - fraction * totalOf(kind) * UNITS_PER_SECOND;
}

/**
 * Move one boundary, and redraw everything that has an opinion about where the sections are.
 *
 * ⚠️ **THE MIXER NEEDS NO TELLING, WHICH IS THE POINT OF THREADING `sections` RATHER THAN PATCHING
 * A TABLE.** `frame` asks `now()` sixty times a second and hands the answer to `setLevel`, so a
 * dragged boundary changes what the game's own mixer is told on the very next tick — over its own
 * 1.6-second ramp, landing on the bar line 0117 puts it on. Nothing here writes a gain.
 */
function moveSection(which: keyof SectionUnits, units: number): void {
  sections = dragSection(sections, which, units, LEVELS[kind].bossAt);
  drawStrip();
  drawSpans();
  drawSections();
}

window.addEventListener('pointermove', (e) => {
  if (dragging === null) return;
  // The strip owns the pointer for the length of the drag, so a stray selection cannot start.
  e.preventDefault();
  moveSection(dragging, unitsAtClientX(e.clientX));
});
window.addEventListener('pointerup', () => {
  dragging = null;
});

function drawStrip(): void {
  strip.replaceChildren();
  const total = totalOf(kind);
  const marks = marksOf(kind, FIGHT_SECONDS, sections);
  for (const mark of marks) {
    const seg = document.createElement('div');
    seg.className = 'seg';
    seg.style.left = `${(mark.second / total) * 100}%`;
    seg.style.width = `${(mark.lasts / total) * 100}%`;
    /*
      ⚠️ **THE CAMERA'S BEAT AND THE HEARD BEAT ARE BOTH PRINTED** — 0117. The first is where a
      distance was crossed and stays ugly for ever; the second is where the ramp starts, and it is
      the one that was the defect. A strip showing only one of them would be arguing for whichever
      it chose.
    */
    seg.innerHTML =
      `<b>${mark.rung}</b><br /><span class="dim">${mark.lasts.toFixed(0)}s · ` +
      `crossed <span class="${mark.onBar ? 'ok' : 'midbar'}">beat ${mark.beat.toFixed(2)}</span> · ` +
      `heard <span class="${mark.moves.onBar ? 'ok' : 'midbar'}">beat ${mark.moves.beat.toFixed(2)}</span></span>`;
    strip.append(seg);
  }
  /*
    ⚠️ **THE GRIP IS KEYED ON THE RUNG'S NAME AND NOT ON ITS INDEX**, because a boundary dragged far
    enough removes a section from the strip altogether — `push` past the whole level leaves a level
    that opens at `push` and never plays `run`, which is a real answer to a real question and not a
    state to defend against. An index would silently hand the wrong handle to the wrong distance.
  */
  for (const mark of marks) {
    if (!(SECTION_ORDER as readonly string[]).includes(mark.rung)) continue;
    const which = mark.rung as keyof SectionUnits;
    const grip = document.createElement('button');
    grip.className = 'grip';
    grip.type = 'button';
    grip.style.left = `${(mark.second / total) * 100}%`;
    grip.setAttribute(
      'aria-label',
      `${mark.rung} opens ${sections[which].toFixed(0)} units back from the boss — drag, or use the arrow keys`,
    );
    grip.title = `${mark.rung} opens ${sections[which].toFixed(0)} units back from the boss · drag me, or nudge a bar at a time with ← →`;
    grip.addEventListener('pointerdown', (e) => {
      dragging = which;
      e.preventDefault();
    });
    /*
      ⚠️ **A KEY NUDGES BY ONE BAR, WHICH IS THE SMALLEST MOVE THAT CAN BE HEARD** — 0117 starts the
      ramp on the next bar line after the camera crosses, so a boundary moved by less than a bar
      lands on the same downbeat and changes nothing in the speakers. The strip's *crossed* beat
      would move and its *heard* beat would not, which is the one pair of numbers on this page that
      makes the distinction. A pointer over a level this long is about six units a pixel; this is
      how a value gets chosen rather than approached.
    */
    grip.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowLeft' ? -SECTION_FLOOR_UNITS : e.key === 'ArrowRight' ? SECTION_FLOOR_UNITS : 0;
      if (step === 0) return;
      e.preventDefault();
      // Left on the strip is EARLIER in the level, which is FURTHER from the boss.
      moveSection(which, sections[which] - step);
    });
    strip.append(grip);
  }
  strip.append(head);
}

// ── WHERE THE BOUNDARIES ARE, AGAINST WHERE THEY SHIP ───────────────────────────────────────────

/**
 * The three distances, printed as the constants they would be pasted back as.
 *
 * ⚠️ **`PUSH_UNITS = 3021` AND NOT `push 3021`, WHICH IS 0129's RULE ABOUT THE DESK APPLIED HERE.**
 * A shape found by dragging is worth nothing if turning it into `src/content/music.ts` means reading
 * a number off a screenshot and guessing which constant it was. The shipped value travels beside it,
 * because *what did I change it from* is the other half of the report.
 */
const SECTION_CONSTANT: Readonly<Record<keyof SectionUnits, string>> = {
  push: 'PUSH_UNITS',
  surge: 'SURGE_UNITS',
  approach: 'BOSS_APPROACH_UNITS',
};

/**
 * The three in the order the STRIP draws them, which is the order a level reaches them.
 *
 * ⚠️ **`SECTION_ORDER` runs the other way, from the boss outwards, because that is the order the
 * clamp has to reason in** — each boundary is bounded by the one nearer the boss. Printing that
 * order beside a strip that reads left to right made the readout disagree with the thing it labels,
 * which was obvious the moment it was driven and invisible before.
 */
const SECTION_ACROSS = [...SECTION_ORDER].reverse();

const dragged = (): boolean => SECTION_ORDER.some((which) => sections[which] !== SECTION_UNITS[which]);

function sectionText(): string {
  return SECTION_ACROSS.map((which) => `${SECTION_CONSTANT[which]} = ${sections[which].toFixed(0)}`).join(' · ');
}

function drawSections(): void {
  el('sections').innerHTML = SECTION_ACROSS.map((which) => {
    const moved = sections[which] !== SECTION_UNITS[which];
    return (
      `<b class="${moved ? 'warn' : ''}">${which}</b> ` +
      `<span class="${moved ? 'warn' : 'dim'}">${sections[which].toFixed(0)}</span>` +
      (moved ? `<span class="dim"> (ships ${SECTION_UNITS[which]})</span>` : '')
    );
  }).join('<span class="dim"> · </span>');
  el<HTMLButtonElement>('sectionsBack').disabled = !dragged();
}

el<HTMLButtonElement>('sectionsBack').addEventListener('click', () => {
  sections = SECTION_UNITS;
  drawStrip();
  drawSpans();
  drawSections();
});

// ── THE COVERAGE TABLE ──────────────────────────────────────────────────────────────────────────

function drawSpans(): void {
  const body = el<HTMLTableSectionElement>('spans').querySelector('tbody')!;
  body.replaceChildren();
  const rows: LayerSpan[] = layerSpans(kind, FIGHT_SECONDS, sections)
    .filter((s) => s.openFor > 0)
    .sort((a, b) => a.passes - b.passes);
  for (const row of rows) {
    const tr = document.createElement('tr');
    const verdict = row.passes < 1 ? 'warn' : row.passes < 2 ? 'warn' : 'dim';
    tr.innerHTML =
      `<td><b>${row.layer}</b></td>` +
      `<td class="dim">${row.loopSeconds.toFixed(1)}s</td>` +
      `<td>${row.longest.toFixed(1)}s</td>` +
      `<td class="${verdict}">${row.passes.toFixed(2)}${row.passes < 1 ? ' — never comes round' : ''}</td>` +
      `<td class="dim">${row.openFor.toFixed(1)}s</td>` +
      `<td class="dim">${row.spans.map(([f, t]) => `${clockText(f)}–${clockText(t)}`).join(' ')}</td>`;
    body.append(tr);
  }
}

// ── COPYING A MOMENT OUT ────────────────────────────────────────────────────────────────────────

/**
 * Everything true of right now, as text that can be pasted into a conversation.
 *
 * ⚠️ **Asked for by name**: *"an export or copy button that'll copy the relevant levels and sounds
 * so I can paste them easily here, or some easy way to reference point in time and sound/volume
 * effects."* Every report about this channel so far has had to be written from memory — *"the tune
 * kicking around 52 secs"*, *"the 1:32 and 1:48 aren't noticeable"* — and a session then spends its
 * first hour working out which rung 52 seconds was, at which theme, with what open.
 *
 * ⚠️ **IT PRINTS `live` BESIDE `target` AND THAT IS THE POINT OF IT.** The report this exists to
 * carry is *"what is supposedly playing is not actually audible"*, which is a claim about the gap
 * between the two columns — so a paste that carried only one of them would drop the finding on the
 * way.
 *
 * ⚠️ **Markdown, because it lands in a chat and in `reports/`** —
 * `docs/decisions/0029-the-tracked-record-is-the-record.md` says a report is a committed file, and a
 * table that has to be re-typed to become one will not become one.
 */
function momentAsText(moment: Moment): string {
  const music = out.music();
  const lines = cueLines(tier, moment.rung, killsPerSecond).filter((c) => c.sounds);
  const sounding = moment.layers.filter((l) => l.target > 0 || held.has(l.layer));
  const silent = moment.layers.filter((l) => l.target <= 0 && !held.has(l.layer)).map((l) => l.layer);
  /*
    ⚠️ **THE DESK IS PRINTED AS SOMETHING THAT COULD BE PASTED BACK INTO THE TABLES** — 0129. A mix
    found by dragging faders is worth nothing if turning it into `MUSIC_LADDER` or a theme's `mix`
    means reading numbers off a screenshot. Held gains come out as `layer 0.82`, held pans as
    `layer L0.40`, in the order the ladder lists them.
  */
  const holds = MUSIC_LAYERS.filter((l) => held.has(l)).map((layer) => {
    const h = holdOf(layer);
    const parts: string[] = [];
    if (h.gain !== null) parts.push(h.gain.toFixed(2));
    if (h.pan !== null) parts.push(panText(h.pan).replace(' ', ''));
    return `${layer} ${parts.join(' ')}`;
  });
  /*
    ⚠️ **AN AUDITION IS SAID IN ONE LINE RATHER THAN AS TWENTY-TWO ZEROES** — 0130. It holds every
    layer, so the list above would be a wall of `arp 0.00` with the one fact buried in it, and a
    paste nobody reads is the same as no copy button.
  */
  const only = aloneOn();

  const rows = sounding.map((l) => {
    const live = music === null ? 0 : music.gainOf(l.layer).value;
    const at = music === null ? l.pan : music.panOf(l.layer).value;
    const hold = holdOf(l.layer);
    return (
      `| ${l.layer} | ${panText(at)} | ${l.move} | ${l.target.toFixed(2)} | ${live.toFixed(2)} ` +
      `| ${l.loopSeconds.toFixed(1)}s | ${hold.gain === null && hold.pan === null ? '' : 'held'} |`
    );
  });

  return [
    `**Into the Coil — sound dashboard**`,
    ``,
    `- **level** \`${kind}\` — ${THEMES[moment.theme].title} (theme \`${moment.theme}\`)`,
    `- **at** ${clockText(second)} of ${clockText(totalOf(kind))} · camera ${moment.camera.toFixed(0)} units · bar ${Math.floor(moment.bars)} beat ${moment.beat.toFixed(2)}`,
    `- **rung** \`${moment.rung}\`${moment.nextRung === null ? ' (last)' : ` → \`${moment.nextRung}\` in ${moment.nextIn!.toFixed(1)}s`}` +
      ` · aura ${moment.aura.toFixed(2)} · ${moment.sounding} of ${MUSIC_LAYERS.length} sounding`,
    `- **over it** tier ${tier} — ` +
      lines.map((c) => `${c.kind} ${c.every === null ? 'scattered' : `every ${c.every} steps`} (${c.perSecond.toFixed(2)}/s)`).join(', '),
    `- **boss gap** ${gapUnits} units · **cues** ${cuesOn ? 'on' : 'off'}` +
      (silenced.size > 0 ? ` (silenced: ${[...silenced].join(', ')})` : '') +
      ` · **transport** ${walking ? 'walking' : onAir ? 'stopped, desk sounding' : 'stopped'}`,
    /*
      ⚠️ **THE BOUNDARIES GO OUT AS CONSTANTS AND THE SHIPPED SET GOES WITH THEM** — 0138. A shape
      found by dragging the strip is a proposal about `src/content/music.ts`, and a paste that said
      *push 2400* would leave the next session to work out which of three constants that was and what
      it had been. Printed whether or not anything moved, because *nothing was dragged* is also a
      fact about the moment being reported.
    */
    `- **boundaries** ${sectionText()}` +
      (dragged()
        ? ` — **DRAGGED** (${SECTION_ACROSS.filter((w) => sections[w] !== SECTION_UNITS[w])
            .map((w) => `${SECTION_CONSTANT[w]} ships ${SECTION_UNITS[w]}`)
            .join(', ')})`
        : ' (shipped)'),
    only !== null
      ? `- **on the desk** \`${only}\` ALONE at ${(holdOf(only).gain ?? 0).toFixed(2)} — every other layer at zero`
      : `- **held on the desk** ${holds.length === 0 ? 'nothing — this is the mixer untouched' : holds.join(', ')}`,
    ``,
    `| layer | pan | doing | target | live | loop | desk |`,
    `|---|---|---|---|---|---|---|`,
    ...rows,
    ``,
    `silent here: ${silent.length === 0 ? 'none' : silent.join(', ')}`,
  ].join('\n');
}

{
  const dump = el<HTMLTextAreaElement>('dump');
  const said = el('copied');
  el<HTMLButtonElement>('copy').addEventListener('click', () => {
    const text = momentAsText(now());
    dump.value = text;
    /*
      ⚠️ **The textarea is shown WHETHER OR NOT the clipboard worked.** `navigator.clipboard` needs a
      secure context — localhost counts — but it also refuses when the document is not focused, which
      is exactly the state a page is in the moment after you click something in another window. A
      copy button that silently did nothing would be worse than one that never existed.
    */
    dump.hidden = false;
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        said.textContent = 'copied — and printed below in case it did not';
      })
      .catch(() => {
        said.textContent = 'the clipboard refused — select the text below instead';
        dump.select();
      });
  });
}

// ── THE FRAME ───────────────────────────────────────────────────────────────────────────────────

/**
 * How long a gap the walk will absorb in one tick, in seconds.
 *
 * ⚠️ **A hidden tab throttles `setInterval` to about once a second** and a laptop that slept can
 * return minutes later. The audio never stopped, so the walk has to catch up rather than pretend
 * nothing happened — but it must not fast-forward a whole level on the first tick back.
 */
const MAX_GAP_SECONDS = 1;

function frame(at: number): void {
  const elapsed = Math.min(MAX_GAP_SECONDS, (at - lastFrame) / 1000);
  lastFrame = at;
  const total = totalOf(kind);

  if (walking) {
    second += elapsed * walkSpeed;
    if (second >= total) second = 0;
  }

  const moment = now();
  const music = out.music();
  if (music !== null && unlocked) {
    const rungBefore = music.level();
    music.setLevel(moment.rung, moment.aura, moment.theme);
    // A rung change re-writes every layer whose target moved, including the ones a solo is holding
    // down — so the pin is re-stated the moment the mixer has had its say, and never before it.
    if (rungBefore !== moment.rung || owed.size > 0) restate(moment);
  }

  /*
    ⚠️ **THE CLOCK RUNS WHETHER THE TRANSPORT DOES OR NOT.** The loops never stopped, so the step
    count has to stay derived from the same wall clock they are on — pausing the walk must not put
    the gun a pause-length out of phase with the bar. What `walking` gates is whether anything
    FIRES, not whether time passed.
  */
  if (startedAt !== null) {
    const want = Math.round(((at - startedAt) / 1000) * STEPS_PER_SECOND);
    /*
      ⚠️ **A backlog is dropped rather than fired, exactly as `src/app/loop.ts` drops one** — but the
      COUNT still catches up, or the grid would slide by however long the tab was hidden. Past a
      long gap the speaker is not walked at all: `variantAt` reads the step number it is given, so
      the accents land correctly on the far side either way.
    */
    const behind = want - steps;
    if (behind > CATCH_UP_STEPS) steps = want - MAX_STEPS;
    for (let i = steps; i < want; i++) {
      steps++;
      speaker.step(steps);
      if (walking && want - i <= MAX_STEPS) cuesOnStep(steps, moment.rung);
    }
  }

  // ── the readout ───────────────────────────────────────────────────────────────────────────────
  scrub.value = String(Math.round((second / total) * 1000));
  el('clock').textContent = `${clockText(second)} / ${clockText(total)}`;
  el('rung').textContent = moment.rung;
  el('theme').textContent = THEMES[moment.theme].title;
  el('camera').textContent = moment.camera.toFixed(0);
  el('bar').textContent = String(Math.floor(moment.bars));
  el('beat').textContent = moment.beat.toFixed(2);
  el('next').textContent =
    moment.nextRung === null ? 'the level ends' : `${moment.nextRung} in ${moment.nextIn!.toFixed(1)}s`;
  el('sounding').textContent = String(moment.sounding);
  el('aura').textContent = moment.aura.toFixed(2);
  head.style.left = `${(second / total) * 100}%`;

  for (const layer of moment.layers) {
    const row = layerRows[layer.layer];
    row.move.textContent = layer.move;
    row.move.className = `badge ${layer.move}`;
    row.target.textContent = layer.target.toFixed(2);
    const live = music === null ? 0 : music.gainOf(layer.layer).value;
    row.live.textContent = live.toFixed(2);
    row.bar.style.width = `${Math.min(100, live * 80)}%`;
    row.bar.parentElement!.classList.toggle('aura', layer.aura);
  }
}

drawCues();
drawSpans();
drawStrip();
drawPlace();
drawSections();
drawTransport();
setInterval(drawCues, 500);
/*
  ── A TIMER AND NOT `requestAnimationFrame`, WHICH IS A DECISION ABOUT WHAT THIS TOOL IS ──────────

  ⚠️ **`requestAnimationFrame` DOES NOT RUN IN A HIDDEN TAB, AND THE AUDIO DOES.** The game is right
  to use it — `src/app/loop.ts` drives a picture, and a picture nobody is looking at should cost
  nothing. This drives a SOUND. A player who tabs away mid-level to read something would have the
  music go on playing while the level stopped advancing underneath it: the rung would hold, the
  build would freeze, and the thing they are listening for would never arrive. **A tool that lies
  when it is not being watched is worse than one that costs a timer.**

  ⚠️ **The elapsed time is measured, never assumed to be the interval.** A hidden tab throttles this
  to about once a second, so the walk absorbs the real gap (up to `MAX_GAP_SECONDS`) and the cue
  catch-up is bounded separately by `MAX_STEPS` — which is what `src/app/loop.ts` does with a
  backlog, and for the same reason.

  ⚠️ **The first tick is immediate**, so the readout is right before anything is pressed rather than
  showing its markup defaults next to a strip that already knows the level.
*/
frame(performance.now());
setInterval(() => frame(performance.now()), 16);
