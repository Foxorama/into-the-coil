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
import { MUSIC_LAYERS, type MusicLayer } from '../src/content/music.ts';
import { THEMES, revoicedBy, type ThemeKind } from '../src/content/themes.ts';
import { CUES, CUE_KINDS } from '../src/content/cues.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { SAMPLE_RATE, makeAudioOut, makeSpeaker, prewarmAudio, takePrewarmed } from '../src/app/sound.ts';
import { auraNearness, bakeLayer } from '../src/app/music.ts';
import { makeRng } from '../src/sim/rng.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import {
  UNITS_PER_SECOND,
  cueLines,
  layerSpans,
  marksOf,
  momentOf,
  weaponAtTier,
  type LayerSpan,
  type Moment,
} from './transport.ts';

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
let playing = false;
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
 * solo button — so the unit is a **trim over the mixer's own target** rather than a gain typed in.
 * At `trim: 1` a held layer sounds exactly as the ladder says; at 1.4 it is the same arrangement
 * with that one part pushed, which is the comparison being asked for.
 */
interface Held {
  on: boolean;
  trim: number;
}
const held = new Map<MusicLayer, Held>();
let unlocked = false;
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

for (const [label, at] of [
  ['run', 0],
  ['push', 1],
  ['surge', 2],
  ['approach', 3],
  ['boss', 4],
  ['peak', 5],
] as const) {
  const button = document.createElement('button');
  button.textContent = label;
  button.addEventListener('click', () => {
    const mark = marksOf(kind, FIGHT_SECONDS)[at];
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
  if (unlocked && !playing) togglePlay();
});

/**
 * Start or stop the transport — **and the music with it.**
 *
 * ── PAUSE USED TO STOP THE CLOCK AND LEAVE THE LOOPS RUNNING ────────────────────────────────────
 *
 * ⚠️ **Reported: *"it stops the timer bar, but the music is still running in the browser."*** It was
 * a straight omission: `playing` gated the walk and the cues and nothing told the mixer. A pause
 * that keeps playing is worse than no pause, because the one thing you press it for is to stop and
 * think about what you just heard.
 *
 * ⚠️ **`setOn` IS THE GAME'S OWN STOP AND NOT A MUTE** — [0119](0119-off-stops-the-loops.md) is the
 * decision that made it actually stop the loops rather than turn them down, after a race left
 * `started` true for ever. Using it means a paused dashboard is in exactly the state a player who
 * turned sound off is in, rather than in a fifth state invented here.
 *
 * ⚠️ **Resuming re-anchors the step clock, because `start()` re-anchors the LOOPS.** They go back on
 * the air at a fresh instant, so a step count measured from the old one would put the gun a
 * pause-length off the bar — which is the same class of bug a scrub caused, arriving from the other
 * side.
 */
function togglePlay(): void {
  playing = !playing;
  playButton.textContent = playing ? '⏸ pause' : '▶ play';
  playButton.setAttribute('aria-pressed', String(playing));
  /*
    ⚠️ **The page has to SAY it is stopped, because the layer gains do not move when it is.** `setOn`
    fades the master and stops the sources; a layer's own gain is upstream of both and stays exactly
    where it was. Without this the readout goes on reporting `sub 0.86` into silence, which is the
    same class of lie as the frozen transport this pause was fixed for.
  */
  document.body.classList.toggle('paused', !playing);
  lastFrame = performance.now();
  const music = out.music();
  if (music === null) return;
  music.setOn(playing);
  if (playing) {
    startedAt = performance.now();
    steps = 0;
    // The loop set is new, so every gain the desk was holding has to be stated over it again.
    owed.clear();
    restate(momentOf(kind, second, FIGHT_SECONDS, auraNearness(gapUnits)));
  }
}
playButton.addEventListener('click', togglePlay);

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
  for (const layer of revoicedBy(theme)) own[layer] = bakeLayer(layer, SAMPLE_RATE, theme);
  loopsByPlace.set(theme, own);
  return own;
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
  drawSpans();
  drawStrip();
  drawPlace();
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
  on: HTMLInputElement;
  trim: HTMLInputElement;
  trimOut: HTMLElement;
  tr: HTMLTableRowElement;
}
const layerRows = {} as Record<MusicLayer, LayerRow>;

{
  const body = el<HTMLTableSectionElement>('layers').querySelector('tbody')!;
  const spans = layerSpans(kind, FIGHT_SECONDS);
  for (const layer of MUSIC_LAYERS) {
    const span = spans.find((s) => s.layer === layer)!;
    const tr = document.createElement('tr');
    tr.title = `${layer} — a ${span.loopSeconds.toFixed(1)}s loop`;
    tr.innerHTML =
      `<td><b class="lay">${layer}</b></td>` +
      `<td class="dim">${panText(layer)}</td>` +
      `<td><span class="badge"></span></td>` +
      `<td class="target">0.00</td>` +
      `<td class="live">0.00</td>` +
      `<td><span class="meter"><i></i></span></td>` +
      `<td><input type="checkbox" checked /></td>` +
      `<td><input type="range" min="0" max="200" step="5" value="100" /></td>` +
      `<td class="dim trimOut">—</td>`;
    const row: LayerRow = {
      move: tr.querySelector('.badge')!,
      target: tr.querySelector('.target')!,
      live: tr.querySelector('.live')!,
      bar: tr.querySelector('.meter i')!,
      on: tr.querySelector('input[type=checkbox]')!,
      trim: tr.querySelector('input[type=range]')!,
      trimOut: tr.querySelector('.trimOut')!,
      tr,
    };
    // Clicking the NAME solos — the fast gesture, kept from the first version because naming a
    // sound you can hear and cannot place is what the solo rig was built for (0113).
    tr.querySelector('.lay')!.addEventListener('click', () => solo(layer));
    row.on.addEventListener('change', () => takeFromRow(layer));
    row.trim.addEventListener('input', () => takeFromRow(layer));
    body.append(tr);
    layerRows[layer] = row;
  }
}

function panText(layer: MusicLayer): string {
  const pan = momentOf(kind, 0, FIGHT_SECONDS, 0).layers.find((l) => l.layer === layer)!.pan;
  if (pan === 0) return 'centre';
  return `${pan < 0 ? 'L' : 'R'} ${Math.abs(pan).toFixed(2)}`;
}

/** Read one row's two controls into `held`, or drop the entry when both are back at default. */
function takeFromRow(layer: MusicLayer): void {
  const row = layerRows[layer];
  const on = row.on.checked;
  const trim = Number(row.trim.value) / 100;
  if (on && trim === 1) held.delete(layer);
  else held.set(layer, { on, trim });
  drawHeld();
  restate(momentOf(kind, second, FIGHT_SECONDS, auraNearness(gapUnits)));
}

/** Everything off but this one, or everything back on if it was already the only one. */
function solo(layer: MusicLayer): void {
  const alone = held.size === MUSIC_LAYERS.length - 1 && !held.has(layer);
  for (const other of MUSIC_LAYERS) layerRows[other].on.checked = alone || other === layer;
  for (const other of MUSIC_LAYERS) takeFromRow(other);
}

function drawHeld(): void {
  for (const layer of MUSIC_LAYERS) {
    const row = layerRows[layer];
    const hold = held.get(layer);
    row.tr.classList.toggle('held', hold !== undefined);
    row.tr.classList.toggle('off', hold !== undefined && !hold.on);
    row.trimOut.textContent = hold === undefined || hold.trim === 1 ? '—' : `×${hold.trim.toFixed(2)}`;
  }
  el('heldCount').textContent = String(held.size);
}

for (const [id, set] of [
  ['allOn', (r: LayerRow) => (r.on.checked = true)],
  ['allOff', (r: LayerRow) => (r.on.checked = false)],
] as const) {
  el<HTMLButtonElement>(id).addEventListener('click', () => {
    for (const layer of MUSIC_LAYERS) set(layerRows[layer]);
    for (const layer of MUSIC_LAYERS) takeFromRow(layer);
  });
}

el<HTMLButtonElement>('release').addEventListener('click', () => {
  for (const layer of MUSIC_LAYERS) {
    layerRows[layer].on.checked = true;
    layerRows[layer].trim.value = '100';
  }
  for (const layer of MUSIC_LAYERS) takeFromRow(layer);
});

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
    const hold = held.get(layer);
    if (hold !== undefined) {
      const gain = music.gainOf(layer);
      gain.cancelScheduledValues(0);
      gain.setTargetAtTime(hold.on ? target * hold.trim : 0, 0, HOLD_SECONDS);
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
  const lines = cueLines(tier, momentOf(kind, second, FIGHT_SECONDS, auraNearness(gapUnits)).rung, killsPerSecond);
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

/** Everything that sounds on one sim step, at the cadences `rig/transport.ts` says. */
function cuesOnStep(step: number): void {
  if (!cuesOn) return;
  const weapon = weaponAtTier(tier);
  const rung = momentOf(kind, second, FIGHT_SECONDS, auraNearness(gapUnits)).rung;
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

function drawStrip(): void {
  strip.replaceChildren();
  const total = totalOf(kind);
  for (const mark of marksOf(kind, FIGHT_SECONDS)) {
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
  strip.append(head);
}

// ── THE COVERAGE TABLE ──────────────────────────────────────────────────────────────────────────

function drawSpans(): void {
  const body = el<HTMLTableSectionElement>('spans').querySelector('tbody')!;
  body.replaceChildren();
  const rows: LayerSpan[] = layerSpans(kind, FIGHT_SECONDS)
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
  const holds = [...held.entries()].map(([layer, h]) => (h.on ? `${layer} ×${h.trim.toFixed(2)}` : `${layer} OFF`));

  const rows = sounding.map((l) => {
    const live = music === null ? 0 : music.gainOf(l.layer).value;
    const hold = held.get(l.layer);
    return (
      `| ${l.layer} | ${l.pan === 0 ? 'centre' : `${l.pan < 0 ? 'L' : 'R'}${Math.abs(l.pan).toFixed(2)}`} ` +
      `| ${l.move} | ${l.target.toFixed(2)} | ${live.toFixed(2)} | ${l.loopSeconds.toFixed(1)}s ` +
      `| ${hold === undefined ? '' : hold.on ? `held ×${hold.trim.toFixed(2)}` : 'held OFF'} |`
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
      (silenced.size > 0 ? ` (silenced: ${[...silenced].join(', ')})` : ''),
    `- **held on the desk** ${holds.length === 0 ? 'nothing — this is the mixer untouched' : holds.join(', ')}`,
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
    const text = momentAsText(momentOf(kind, second, FIGHT_SECONDS, auraNearness(gapUnits)));
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

  if (playing) {
    second += elapsed * walkSpeed;
    if (second >= total) second = 0;
  }

  const nearness = auraNearness(gapUnits);
  const moment = momentOf(kind, second, FIGHT_SECONDS, nearness);
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
    the gun a pause-length out of phase with the bar. What `playing` gates is whether anything
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
      if (playing && want - i <= MAX_STEPS) cuesOnStep(steps);
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
