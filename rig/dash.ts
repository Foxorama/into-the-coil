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
import { THEMES } from '../src/content/themes.ts';
import { CUES, CUE_KINDS } from '../src/content/cues.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { makeAudioOut, makeSpeaker } from '../src/app/sound.ts';
import { auraNearness } from '../src/app/music.ts';
import { makeRng } from '../src/sim/rng.ts';
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
/** One stream, so two takes of the same settings kill the same things — 0021. */
const bodies = makeRng('rig').stream('bodies');

let kind: LevelKind = LEVEL_KINDS[0]!;
let second = 0;
let playing = false;
let walkSpeed = 1;
let tier = 0;
let killsPerSecond = 1.6;
let gapUnits = 85;
let cuesOn = true;
let soloed: MusicLayer | null = null;
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
/** Layers currently held at silence by a solo. */
const pinned = new Set<MusicLayer>();
/** Layers a solo has written to and not yet handed back to the mixer. */
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
  playButton.disabled = !unlocked;
  status.textContent = unlocked ? 'audio running' : 'the browser refused a context — no AudioContext on this page';
  el<HTMLButtonElement>('unlock').disabled = unlocked;
  if (unlocked && !playing) togglePlay();
});

function togglePlay(): void {
  playing = !playing;
  playButton.textContent = playing ? '⏸ pause' : '▶ play';
  playButton.setAttribute('aria-pressed', String(playing));
  lastFrame = performance.now();
}
playButton.addEventListener('click', togglePlay);

levelSelect.addEventListener('change', () => {
  kind = levelSelect.value as LevelKind;
  seek(0);
  drawSpans();
  drawStrip();
});
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

// ── THE LAYER TABLE ─────────────────────────────────────────────────────────────────────────────

interface LayerRow {
  move: HTMLElement;
  target: HTMLElement;
  live: HTMLElement;
  bar: HTMLElement;
  tr: HTMLTableRowElement;
}
const layerRows = {} as Record<MusicLayer, LayerRow>;

{
  const body = el<HTMLTableSectionElement>('layers').querySelector('tbody')!;
  const spans = layerSpans(kind, FIGHT_SECONDS);
  for (const layer of MUSIC_LAYERS) {
    const span = spans.find((s) => s.layer === layer)!;
    const tr = document.createElement('tr');
    tr.className = 'lay';
    tr.innerHTML =
      `<td><b>${layer}</b></td>` +
      `<td class="dim">${span.loopSeconds.toFixed(1)}s</td>` +
      `<td class="dim">${panText(layer)}</td>` +
      `<td><span class="badge"></span></td>` +
      `<td class="target">0.00</td>` +
      `<td class="live">0.00</td>` +
      `<td><span class="meter"><i></i></span></td>`;
    tr.addEventListener('click', () => {
      soloed = soloed === layer ? null : layer;
      applySolo();
    });
    body.append(tr);
    layerRows[layer] = {
      move: tr.querySelector('.badge')!,
      target: tr.querySelector('.target')!,
      live: tr.querySelector('.live')!,
      bar: tr.querySelector('.meter i')!,
      tr,
    };
  }
}

function panText(layer: MusicLayer): string {
  const pan = momentOf(kind, 0, FIGHT_SECONDS, 0).layers.find((l) => l.layer === layer)!.pan;
  if (pan === 0) return 'centre';
  return `${pan < 0 ? 'L' : 'R'} ${Math.abs(pan).toFixed(2)}`;
}

/**
 * Pin every layer but the soloed one to silence, or release them all.
 *
 * ⚠️ **A PIN SURVIVES `setLevel` WITHOUT ANY HELP, WHICH IS 0117 WORKING RATHER THAN LUCK.** The
 * mixer only writes a layer whose TARGET moved, so a gain forced here is left alone until the rung
 * changes — and the rung change is exactly when the pin should be re-stated anyway.
 */
function applySolo(): void {
  for (const layer of MUSIC_LAYERS) {
    const want = soloed !== null && soloed !== layer;
    layerRows[layer].tr.classList.toggle('off', want);
    if (want) pinned.add(layer);
    else pinned.delete(layer);
  }
  restate(momentOf(kind, second, FIGHT_SECONDS, auraNearness(gapUnits)));
}

/**
 * Hold the pinned layers at silence, and put a released one back where the mixer wanted it.
 *
 * ⚠️ **THE RELEASE IS THE HALF THAT IS NOT OBVIOUS.** A pin holds because `levelWrites` only writes
 * a layer whose target moved (0117) — which is also why un-pinning cannot simply stop writing: the
 * mixer thinks that layer is already where it asked for, and would leave it silent until the next
 * rung. So a release states the target here, and `moment.layers` is where the target comes from,
 * which is the same arithmetic the readout prints.
 *
 * ⚠️ **Zero is the cancel time and it is not a placeholder.** `cancelScheduledValues` drops every
 * event at or after the instant it is given and a `setValueAtTime` in the past is already in effect,
 * so a time of zero means *now, and forget whatever was scheduled* — which saves `MusicOut` a second
 * accessor it would have had for this alone.
 */
function restate(moment: Moment): void {
  const music = out.music();
  if (music === null) return;
  for (const { layer, target } of moment.layers) {
    if (pinned.has(layer)) {
      const gain = music.gainOf(layer);
      gain.cancelScheduledValues(0);
      gain.setValueAtTime(0, 0);
      owed.add(layer);
    } else if (owed.has(layer)) {
      const gain = music.gainOf(layer);
      gain.cancelScheduledValues(0);
      gain.setValueAtTime(target, 0);
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
      speaker.play(kind);
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
  const play = (name: Parameters<typeof speaker.play>[0]): void => {
    if (silenced.has(name)) return;
    speaker.play(name);
    flash(name);
  };
  if (step % weapon.fireEvery === 0) play('pulse');
  if (weapon.launchers > 0 && step % weapon.missileEvery === 0) play('missile');
  if ((rung === 'boss' || rung === 'bossPeak') && step % 72 === 0) play('bossShot');
  /*
    ⚠️ **A kill lands on the step a collision resolves and NOTHING quantises it**, so it is drawn
    rather than placed — which is exactly as musical as the game is. A dashboard that put these on
    the grid would be showing a tidier game than the one being judged.
  */
  const chance = killsPerSecond / STEPS_PER_SECOND;
  if (bodies.range(0, 1) < chance) play('kill');
  if (bodies.range(0, 1) < chance) play('hit');
  if (bodies.range(0, 1) < chance * 0.6) play('threat');
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
