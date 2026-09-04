/**
 * How fast and how deep a place is at a rung — the two quantities a listener's words map onto.
 *
 * ── ONE DESCRIPTION, BECAUSE A SCRIPT AND A GUARD BOTH ASK ──────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0134-the-place-keeps-the-games-pace.md`.** `scripts/weigh-rung.mjs` prints
 * these for a hand and `tests/themes.test.ts` holds a floor under them; two copies of *what is pace*
 * is how the printed number and the asserted one drift apart, which is
 * `docs/decisions/0029-the-tracked-record-is-the-record.md` in arithmetic.
 *
 * ⚠️ **NEITHER IS A SUBSTITUTE FOR LISTENING**, on `tests/spectrum.ts`'s own terms. What they are for
 * is turning *"it doesn't fit the high paced gameplay"* and *"very high on the treble with no deep
 * bassy times"* into something that can be compared between two places and refused.
 */

import {
  MUSIC_GAIN,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  type MusicLayer,
  MUSIC_ROOT,
  type MusicLevel,
} from '../src/content/music.ts';
import { auraCeilingOf, mixOf, notesPerBar, revoicedBy, rungIn, rungOf, voicesOf, THEMES, type ThemeKind, type ThemeRow } from '../src/content/themes.ts';

/**
 * The aura ceiling for a place, or for the base composition, which is not one.
 *
 * ⚠️ **0183 MADE THE CEILING A PLACE'S OWN AND SOME OF THIS FILE MEASURES THE BASE**, which has no
 * theme at all — `rungShape(undefined, …)` is the piece every place is read against. Level one is
 * *"the theme that changes nothing"*, so its number is what the base stands for, and saying so here
 * once beats seven call sites each picking a fallback.
 */
function auraCeilingIn(theme: ThemeKind | undefined): number {
  return auraCeilingOf(theme ?? 'approach');
}

/**
 * What this place takes `layer` to at `rung` — the ladder, the balance and the aura's ceiling.
 *
 * ── ONE DESCRIPTION, BECAUSE TWO IDENTICAL COPIES DISAGREED FOR FOUR DAYS ──────────────────────
 *
 * ⚠️ **`docs/decisions/0184-the-measurement-reads-the-place.md`.** This expression was written out
 * twice, character for character, in `rungShape` and in `heardAt`.
 * `docs/decisions/0172-a-place-opens-with-its-own-four.md` corrected the first to route through
 * `rungOf` and left the second reading `MUSIC_LADDER[rung][layer]` — and the second is the one
 * under 0164's role floor, `weigh-adrift` and `weigh-heard`, which is every mix decision since.
 *
 * ⚠️ **SO THE FIX IS THE HOIST AND NOT THE ONE-LINE CORRECTION.** A defect that arrived because a
 * line was written twice is not repaired by making the copy agree; it is repaired by there being
 * one. `rungOf`'s own header says exactly that about the game's eight readers, and this file did
 * not take the lesson when it was written.
 *
 * ⚠️ **`undefined` IS *the base composition*, AND LEVEL ONE IS THE PLACE THAT PLAYS IT UNMIXED** —
 * the reading both copies already took, now taken once. Level one states no ladder, so `rungOf`
 * hands back the shared row for it exactly.
 *
 * ⚠️ **`loudestOf` BELOW IS DELIBERATELY NOT ROUTED THROUGH THIS, AND THE REASON IS A DIFFERENCE
 * RATHER THAN AN OVERSIGHT.** It applies the aura's ceiling at EVERY rung where this applies it at
 * none of `boss` and `bossPeak`; folding them together would silently move what an audition is
 * measured against. 0184 has the measurement and hands the question on rather than answering it in a
 * decision about something else.
 */
function gainIn(theme: ThemeKind | undefined, rung: MusicLevel, layer: MusicLayer): number {
  const nearness = rung === 'boss' || rung === 'bossPeak' ? 1 : auraCeilingIn(theme);
  const ceiling = FOLLOWS_THE_BOSS.includes(layer) ? nearness : 1;
  return rungOf(theme ?? 'approach', rung, layer) * mixOf(theme ?? 'approach', layer) * ceiling;
}

import {
  MUSIC_ROLES,
  type MusicRole,
  ROLE_MARGIN_DB,
  SOLVED_BY,
  roleOf,
} from '../src/content/arrangement.ts';
import { AURA_LAYERS, LAYER_PAN } from '../src/content/music.ts';
import { levelWrites, panGains } from '../src/app/music.ts';
import { BANDS, bandEnergy, bandLevels } from './spectrum.ts';

/** Which bands are the bottom and the top, resolved once from the one table that names them. */
/** The middle of each band, for the centre-of-mass. */
const MIDDLE = BANDS.map((band) => (band[0] + band[1]) / 2);
const LOW = BANDS.map((band) => band[1] <= 300);
const HIGH = BANDS.map((band) => band[0] >= 2000);

/** The two aura layers, which are the only gains that are a distance rather than a rung. */
const FOLLOWS_THE_BOSS: readonly MusicLayer[] = ['auraSlow', 'auraFast'];

/**
 * Where the NOTES are, in Hz — the mean pitch a rung is written at, weighted by nothing but count.
 *
 * ── AND IT IS NOT THE SPECTRAL CENTROID, WHICH IS THE MISTAKE THIS REPLACES ─────────────────────
 *
 * ⚠️ **`docs/decisions/0136-the-place-has-a-room-and-an-arc.md`.** Asked for: *"Up, Up, Up, drop,
 * sharp Down for the boss"*, and, of the fight, *"drop from the high octaves down into the lower tones
 * of hellfire and menace."* The obvious measure is the centre of mass of the SPECTRUM, and it was
 * tried first — it moved five hertz while an octave of material moved, because it is dominated by
 * whichever layers are loudest and continuous.
 *
 * ⚠️ **WORSE, IT ARGUES AGAINST THE OTHER HALF OF THE SAME REPORT.** The same brief asks the
 * percussion to get sharper and faster into the fight, and sharp percussion is broadband noise — so a
 * boss that correctly drops an octave in its TONES measures *higher* on a spectral centroid than the
 * section before it. Tuning against that number would have meant taking the fast metal back out.
 *
 * ⚠️ **A pitched step is a semitone over `MUSIC_ROOT` and an octave is a field on the voice**, so
 * where the notes sit is knowable exactly, from the content, with no audio at all. Unpitched voices
 * are skipped — a drum has no octave to drop.
 */
export function pitchOf(theme: ThemeKind | undefined, layer: MusicLayer): number | null {
  let sum = 0;
  let notes = 0;
  for (const voice of voicesOf(theme, layer)) {
    if (!voice.pitched) continue;
    for (const step of voice.steps) {
      if (step === null || step === undefined) continue;
      sum += MUSIC_ROOT * Math.pow(2, voice.octave + step / 12);
      notes++;
    }
  }
  return notes === 0 ? null : sum / notes;
}

/**
 * How many notes one bar of `layer` sounds in `theme`.
 *
 * ⚠️ **Notes and not loudness.** `docs/decisions/0102-the-music-goes-somewhere.md` settled that the
 * tempo cannot change (0093) and that what rises when a listener says *faster* is the RATE OF EVENTS.
 * This counts them.
 */
export { notesPerBar };

/**
 * What a rung is: how fast, and how the energy splits.
 *
 * ⚠️ **THE AURA IS AT WHAT THE LEVEL ALONE CAN RAISE, EXCEPT IN THE FIGHT** — 0107. Measuring every
 * rung at a boss at arm's length is a state that cannot exist before the boss is on the field, and
 * the first version of this did exactly that: it reported the aura as a fifth of the `surge` mix and
 * sent a tuning pass after a layer nobody can hear there.
 *
 * ⚠️ **The bake is the caller's problem to cache.** `bakeLayer` is real DSP; a guard that walks seven
 * themes and seven rungs must not bake the same layer forty-nine times, and `bakes` is the map that
 * stops it.
 */
export function rungShape(
  theme: ThemeKind | undefined,
  rung: MusicLevel,
  loops: Record<MusicLayer, Float32Array>,
  bakes: Map<string, number[]>,
): { notes: number; low: number; high: number; centre: number; pitch: number } {
  let notes = 0;
  let low = 0;
  let high = 0;
  let centre = 0;
  let pitch = 0;
  let pitched = 0;
  let total = 0;
  for (const layer of MUSIC_LAYERS) {
    /*
      ⚠️ **THROUGH `rungOf`, AND IT READ `MUSIC_LADDER` DIRECTLY UNTIL A PLACE STATED A LADDER** —
      `docs/decisions/0172-a-place-opens-with-its-own-four.md`, the same defect as `loudestOf` below
      and found the same way. `paceAt` in `src/content/themes.ts` has routed through `rungOf` since
      0168, so **the desk and this disagreed by 27 notes a bar at Ember Nebula's `run`** the instant a
      ladder existed — and 0168's own guard, which exists to hold the two together, is what said so.
    */
    const gain = gainIn(theme, rung, layer);
    if (gain <= 0) continue;
    notes += notesPerBar(theme, layer);
    const where = pitchOf(theme, layer);
    if (where !== null) { pitch += where * gain; pitched += gain; }
    /*
      ⚠️ **THE AUDIO COMES FROM THE CALLER AND THE SPECTRUM IS CACHED UNDER WHOEVER OWNS IT** — this
      function synthesised its own at first, and every probe over `tests/themes.test.ts` paid for it:
      six places that state no material re-baked all twenty-three layers each, 161 bakes to look at
      44 distinct pieces of audio, and the suite went from 22 seconds to 118.
      `docs/decisions/0115-a-probe-runs-its-own-guard.md` is about precisely that cost.

      ⚠️ **A shared layer is keyed as the BASE's**, so the six sharing places answer from one entry —
      and the loops handed in are `loopsAt`'s, which the clipping guard next door has already paid
      for.
    */
    const own = theme !== undefined && revoicedBy(theme).includes(layer);
    const key = own ? `${theme}/${layer}` : `/${layer}`;
    let bands = bakes.get(key);
    if (bands === undefined) {
      bands = bandEnergy(loops[layer], 44100);
      bakes.set(key, bands);
    }
    bands.forEach((energy, i) => {
      const at = energy * gain;
      total += at;
      if (LOW[i]) low += at;
      if (HIGH[i]) high += at;
      centre += at * MIDDLE[i]!;
    });
  }
  return {
    notes,
    low: total > 0 ? low / total : 0,
    high: total > 0 ? high / total : 0,
    /*
      ⚠️ **THE CENTRE OF MASS OF THE PITCH, WHICH IS THE ARC A LISTENER DESCRIBES** — 0136: *"Up, Up,
      Up, drop, sharp Down for the boss."* That is a claim about where the music SITS, and neither of
      the two numbers above can see it: a rung can hold its bottom share exactly and still climb, and
      the whole shape of this place is that it does.

      ⚠️ **Energy-weighted over the band centres**, in Hz, so it is a frequency a hand can reason
      about rather than an index. Logarithmic would be closer to how pitch is heard; linear is what
      makes a DROP show up as a drop rather than as a shrug, and the arc is what is being held.
    */
    centre: total > 0 ? centre / total : 0,
    /** Where the NOTES sit, gain-weighted — the arc 0136 is about, and the centroid cannot see it. */
    pitch: pitched > 0 ? pitch / pitched : 0,
  };
}

// ── HOW LOUD A LAYER ACTUALLY IS, AGAINST THE REST OF ITS OWN MIX ───────────────────────────────

/**
 * What one layer puts out at the loudest its place ever takes it.
 *
 * ── THE QUANTITY NOTHING HERE HAS EVER PRINTED, AND THE REPORT THAT ASKED FOR IT ────────────────
 *
 * ⚠️ **`docs/decisions/0140-no-layer-is-inaudible.md`.** Reported, of the dashboard's audition
 * buttons, 2026-08-13: *"is it on purpose that we've got such varied volume levels on the effects?
 * Hook and Drive for example, hook I can barely hear and drive is quite loud and clear by
 * comparison."*
 *
 * ⚠️ **A GAIN IS NOT A LOUDNESS, WHICH IS THE WHOLE FINDING.** `MUSIC_LADDER` × `mixOf` is what a
 * hand sets and what [0130](../docs/decisions/0130-a-layer-can-be-heard-on-its-own.md) puts in the
 * fader — and the faders across a place span about **7 dB** while what comes out of them spans
 * **38 dB and more**. Nothing multiplied the gain by the material until this, so every mix number in
 * this project has been set against a quantity nobody could see.
 *
 * ⚠️ **BOTH RMS AND PEAK, BECAUSE ONE OF THEM LIES ABOUT SPARSE LAYERS.** RMS counts the silence
 * between notes, so a cymbal struck once a bar scores near zero while being perfectly audible when it
 * lands; peak counts only the loudest sample, so a continuous pad scores the same as a click. A
 * layer is only called inaudible when **both** say so.
 */
export interface LayerLevel {
  layer: MusicLayer;
  /** The loudest gain this place ever takes it to — the value 0130's audition button writes. */
  gain: number;
  /** Root-mean-square of the whole loop, times that gain. */
  rms: number;
  /** The loudest single sample of the loop, times that gain. */
  peak: number;
}

/**
 * The loudest gain a place ever takes a layer to, over every rung. Mirrors `rig/transport.ts`.
 *
 * ⚠️ **THROUGH `rungOf` AND NOT `MUSIC_LADDER`, AND IT READ THE SHARED TABLE DIRECTLY FOR TWO
 * DECISIONS.** `docs/decisions/0162-a-place-has-its-own-ladder.md` gave a place its own rungs and this
 * function went on reading the one every place shares — so `weigh-apart`, `weigh-audition` and 0147's
 * balance guards were all structurally blind to the one lever built to answer *"every level sounds the
 * same"*. **The comment above claimed it mirrored the rig, and the rig was right**: `loudestGain` in
 * `rig/transport.ts` has gone through `targetGain` → `rungOf` since the day it was written.
 *
 * ⚠️ **IT WAS INVISIBLE FOR EXACTLY THE REASON 0162's OWN GUARD WAS VACUOUS.** With every `ladder`
 * absent, reading the wrong table and the right one give the same answer — so nothing could tell them
 * apart until a place stated one, which is the debt 0162 recorded and
 * `docs/decisions/0172-a-place-opens-with-its-own-four.md` is paying.
 */
function loudestOf(theme: ThemeKind | undefined, layer: MusicLayer): number {
  let most = 0;
  for (const rung of Object.keys(MUSIC_LADDER) as MusicLevel[]) {
    const ceiling = FOLLOWS_THE_BOSS.includes(layer) ? auraCeilingIn(theme) : 1;
    // `undefined` is *the base composition* and level one is the place that plays it unmixed —
    // the same reading `rungShape` above takes, rather than a second opinion about what no theme means.
    /*
      ⚠️ **THE BARE LADDER, SINCE 0226.** Every question asked over this — audible at all (0140), a
      role's margin (0164), a third of a place not a whisper (0147) — is *can this be heard against
      the rest of what is playing*, and what is playing is one rung. The hold lowers a whole rung by
      one number, so inside any rung it changes no ratio; across rungs it would compare a fight-only
      layer, held, against a bed layer at `run`, unheld — two levels no listener ever hears together.
      `rungIn` is the arrangement; `rungOf` is the arrangement at the level the rung is played at.
    */
    const place = theme ?? 'approach';
    const at = rungIn(THEMES[place].ladder, rung, layer) * mixOf(place, layer) * ceiling;
    if (at > most) most = at;
  }
  return most;
}

/**
 * Every layer of a place, by what it actually puts out, loudest first.
 *
 * @param loops the baked composition for this place — passed in rather than baked here, because a
 *        bake is about four seconds and both callers already have one.
 */
export function layerLevels(theme: ThemeKind | undefined, loops: Record<MusicLayer, Float32Array>): LayerLevel[] {
  const out: LayerLevel[] = [];
  for (const layer of MUSIC_LAYERS) {
    const buffer = loops[layer];
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i]!;
      sum += v * v;
      const size = v < 0 ? -v : v;
      if (size > peak) peak = size;
    }
    const gain = loudestOf(theme, layer);
    out.push({ layer, gain, rms: Math.sqrt(sum / buffer.length) * gain, peak: peak * gain });
  }
  return out.sort((a, b) => b.rms - a.rms);
}

/**
 * How far under the loudest layer of its own place a layer sits, in decibels — a negative number.
 *
 * ⚠️ **RELATIVE TO THE PLACE AND NOT TO FULL SCALE**, so it survives a change to `MUSIC_GAIN`, to the
 * bus shaper, or to any master a later decision puts in front of it. What is being asked is *can this
 * be heard against the rest of what is playing*, and that is a ratio.
 */
export function underTheLoudest(levels: readonly LayerLevel[], layer: MusicLayer): { rms: number; peak: number } {
  const top = levels[0]!;
  const it = levels.find((l) => l.layer === layer)!;
  const db = (a: number, b: number): number => (a <= 0 || b <= 0 ? -Infinity : 20 * Math.log10(a / b));
  return { rms: db(it.rms, top.rms), peak: db(it.peak, top.peak) };
}

/**
 * A place's BALANCE: how far under its own loudest layer each layer sits, in dB, on the better of the
 * two measures.
 *
 * ── THE QUANTITY *IT ALL SOUNDS THE SAME* IS ABOUT, AND NOTHING MEASURED IT ─────────────────────
 *
 * ⚠️ **`docs/decisions/0147-a-place-is-a-balance.md`.** Reported, having heard five new places:
 * *"level 4, 5, 6 were pretty bland and very similar to the other levels, it didn't feel like I'd
 * travelled somewhere else in the galaxy."* Every measurement this project had was **one place
 * against the base** — is it fast enough, is it deep enough, can its layers be heard. All three are
 * green on seven places that are one arrangement with different notes in it.
 *
 * ⚠️ **THE BETTER OF RMS AND PEAK, on `underTheLoudest`'s own terms**: RMS alone calls every sparse
 * layer a whisper, and a balance is about what a listener notices rather than about mean power.
 *
 * ⚠️ **A layer no rung ever opens is `-Infinity` and is skipped by every caller**, which is why this
 * returns the raw record rather than a tidy array — the callers disagree about what to do with a
 * silent layer and both answers are right for their question.
 */
export function profileOf(
  theme: ThemeKind | undefined,
  loops: Record<MusicLayer, Float32Array>,
): Record<MusicLayer, number> {
  const levels = layerLevels(theme, loops);
  const out = {} as Record<MusicLayer, number>;
  for (const layer of MUSIC_LAYERS) {
    const under = underTheLoudest(levels, layer);
    out[layer] = Math.max(under.rms, under.peak);
  }
  return out;
}

/**
 * How far apart two places' balances are, in dB RMS over the layers both of them sound.
 *
 * ⚠️ **Zero is *the same mix, whatever the notes are*.** Measured across the seven places on the day
 * 0147 was written: **1.9 dB** between The Labyrinth and The Toxic Mire, which the report calls
 * interchangeable, and **6.0 dB** between Saurian Belt and The Black Heart, which it does not.
 */
export function apartBy(a: Record<MusicLayer, number>, b: Record<MusicLayer, number>): number {
  let sum = 0;
  let counted = 0;
  for (const layer of MUSIC_LAYERS) {
    if (!Number.isFinite(a[layer]) || !Number.isFinite(b[layer])) continue;
    const d = a[layer] - b[layer];
    sum += d * d;
    counted++;
  }
  return counted === 0 ? 0 : Math.sqrt(sum / counted);
}

/**
 * How far down a place keeps its quietest third, in dB — a negative number.
 *
 * ⚠️ **THIS IS WHERE EVERY PLACE KEEPS ITS CHARACTER, WHICH IS THE DEFECT 0147 IS NAMED FOR.** On the
 * day it was written the bottom third of all seven places was the same seven layers — `call`,
 * `frenzy`, `wraith`, `arp`, `crash`, `hook`, `ride` — averaging −17 to −22 dB down. Those are the
 * tune, the lasers, the roar, the twin lead and the hydra. **The loud part of every place was a sub,
 * a kick, a bass and a pad, and those are the same four sounds in all seven.**
 */
export function quietestThird(profile: Record<MusicLayer, number>): number {
  const ranked = MUSIC_LAYERS.filter((l) => Number.isFinite(profile[l])).sort((a, b) => profile[b] - profile[a]);
  const third = ranked.slice(Math.ceil((ranked.length * 2) / 3));
  return third.reduce((sum, l) => sum + profile[l], 0) / third.length;
}

/**
 * How far under the loudest layer of its own place a layer may sit before it is called inaudible.
 *
 * ── A HAND'S GUESS, FROM THE MEASURED SPREAD, AND THE SPREAD HAD A GAP IN IT ────────────────────
 *
 * ⚠️ **`docs/decisions/0140-no-layer-is-inaudible.md`.** Chosen the way
 * [0102](../docs/decisions/0102-the-music-goes-somewhere.md) chose its distances — by hand, marked as
 * a hand's guess, and against a measurement rather than a taste. Asked for in those terms: *"I'm not
 * entirely [sure] how to specify the floor by ear at the moment, so let's go from the measured spread
 * and then see how it plays out as the min floor."*
 *
 * ⚠️ **THE DATA HAD A TEN-DECIBEL HOLE IN IT, WHICH IS WHY THIS IS NOT A THRESHOLD FITTED TO ONE
 * CASE.** Every layer of every place, ranked by the better of its two measures: Ember Nebula's `ride`
 * at **−38.1 dB**, then a **10.0 dB gap**, then `arp` at −28.1 and a tight cluster of `ride`, `crash`
 * and `arp` from −25.0 to −23.6. One layer is on the far side of a chasm and the rest are a
 * population. **−33 dB sits in the hole**, five decibels clear of the healthy cluster.
 *
 * ⚠️ **THAT IS WHAT CLAUDE.md's *no counting guard* DEMANDS OF A NUMBER LIKE THIS** — line ceilings
 * and slice ceilings were each refused because every candidate flagged a healthy file as loudly as a
 * sick one. This one flags exactly one layer out of 161, and that layer is ten decibels clear of the
 * next. If a later mix pass closes the gap, this number stops being defensible and should go rather
 * than be widened.
 */
export const AUDIBLE_FLOOR_DB = -33;

// ── AND WHETHER A LAYER SURVIVES THE SUM, WHICH IS A DIFFERENT QUESTION ─────────────────────────

/**
 * What one layer has left after everything playing beside it, in the band it lives in and the ear it
 * favours.
 *
 * ── EVERY MEASUREMENT ABOVE THIS LINE IS OF A SOLOED LAYER ──────────────────────────────────────
 *
 * ⚠️ **Reported 2026-08-16, of Ember Nebula at `push`:** *"I'm not hearing ride, hook or lead at all
 * here when playing the entire sequence."* `layerLevels` puts `hook` at −11.0 dB and `lead` at −9.4 —
 * mid-cluster, nowhere near `AUDIBLE_FLOOR_DB` — so the model has no complaint about two layers a
 * listener says are not there.
 *
 * ⚠️ **AND IT CANNOT HAVE ONE, BECAUSE IT NEVER RENDERS THE MIX.** `loudestOf` takes each layer to the
 * loudest gain ANY rung gives it and compares it to another layer at ITS loudest — an arrangement no
 * rung plays. The comparison is broadband, so a layer buried in the one band it occupies scores on
 * the energy it has everywhere else. And it is **mono**, so `LAYER_PAN` — the whole of
 * `docs/decisions/0118-the-mix-has-a-width.md`, added expressly to stop layers masking each other —
 * has never appeared in a number this repository prints.
 *
 * ⚠️ **MASKING IS WHAT *I CANNOT HEAR IT* MEANS ONCE A GAIN IS RULED OUT**, and 0118 said so: *"two
 * sounds in the same frequency band had nothing to separate them but level — which is why the answer
 * has been a gain six times running."* This is the quantity those six passes were tuning blind.
 *
 * ⚠️ **THE BEST WINDOW AND NOT THE AVERAGE ONE.** A listener picks a part out where it is clearest,
 * not where it is typical — so a layer is credited with the single band-and-ear that flatters it
 * most, and a layer that scores badly HERE has nowhere at all to be heard. The counterpart rule is
 * that only bands the layer actually lives in count: within 12 dB of its own loudest band. Without
 * that, a hiss with a millionth of its energy at 40 Hz would score `+∞` in a band nothing else uses.
 *
 * ⚠️ **POWER-SUMMED, because the layers are uncorrelated.** Adding amplitudes would say twelve layers
 * at −20 dB bury one at 0, which is arithmetic about a single phase-locked tone rather than about a
 * band of music.
 *
 * ⚠️ **`bandLevels` AND NOT `bandEnergy`, AND THE FIRST VERSION OF THIS USED THE WRONG ONE.** It put
 * Ember Nebula's `ride` at the TOP of the ranking — a layer the report that produced this function
 * names as inaudible — because `bandEnergy` estimates a density and a noise burst in the 7,000 Hz
 * `air` band is the shape that flatters most. `tests/spectrum.ts` has the whole argument. **The
 * measurement disagreeing with the ear was the measurement being wrong, and it was caught only
 * because the ear had already spoken.**
 *
 * ⚠️ **`panGains` IS THE GAME'S, imported rather than restated** — `src/app/music.ts` keeps it for
 * `scripts/hear.mjs` for exactly this reason, and a pan law is the fifth place
 * `docs/decisions/0116-the-rig-plays-the-level.md`'s drift could happen.
 *
 * ⚠️ **IT IS STILL NOT A SUBSTITUTE FOR LISTENING**, on `tests/spectrum.ts`'s terms. Masking in an ear
 * spreads upward across bands and this does not model that, so it is a floor under *nothing else is
 * on top of it here*, not a claim that the layer is audible.
 */
export interface Heard {
  layer: MusicLayer;
  /** What this place takes it to AT THIS RUNG — not the loudest any rung ever does. */
  gain: number;
  /** dB under the loudest layer sounding at this rung, A-weighted over every band. */
  down: number;
  /**
   * What this layer actually puts out, in **dBFS** — its own RMS at this rung's gain through
   * `MUSIC_GAIN`.
   *
   * ── EVERY OTHER NUMBER IN THIS FILE IS RELATIVE, AND THAT IS WHY NONE OF THEM CAN SAY *TOO QUIET* ─
   *
   * ⚠️ **Reported 2026-08-16:** *"either we need to work out a way to automatically detect that, or I
   * need to go through each music segment and copy the output and say what's audible or not, but
   * that's going to take a pretty long time over all 7 tracks."*
   *
   * ⚠️ **`down`, `margin`, `AUDIBLE_FLOOR_DB` AND 0147's WHOLE BALANCE ARE RATIOS**, so a place could
   * be internally perfect and inaudible throughout, and every guard here would be green. This is the
   * one absolute in the set: a layer at −36 dBFS is quiet **whatever else is playing**, and that is a
   * fact a listener can be handed without soloing anything.
   *
   * ⚠️ **AND IT IS A UNIT THE PLAYER EXPERIENCES**, which
   * `docs/decisions/0027-measure-the-picture-not-the-model.md` requires of at least one measurement
   * per subject — the rest of this file is defined in terms of the mix it is measuring, and CLAUDE.md
   * says a guard measuring a quantity defined by the constant it guards proves only that the code
   * agrees with itself.
   *
   * ⚠️ **PRE-SHAPER, DELIBERATELY.** `saturate` acts on the summed bus, so putting it on one layer
   * would report a number no layer ever has on its own. What this is, is the layer's contribution as
   * it arrives at the shaper.
   *
   * ⚠️ **AND IT COMES WITH `outPeak`, ON 0140's OWN TERMS.** RMS counts the silence between notes, so
   * a cymbal struck once a bar scores near nothing while being perfectly audible when it lands —
   * `ride` reads 29 dB worse than `chords` on RMS and 15 dB worse on peak, and the second is the
   * honest one for a transient. **A layer is only quiet when both say so.**
   */
  out: number;
  /** The loudest single sample this layer contributes at this rung, in dBFS. See `out`. */
  outPeak: number;
  /** dB over everything else, in the best band it lives in, on the ear that favours it. */
  margin: number;
  /** Which band that was. */
  band: string;
  /** Which ear that was. */
  ear: 'L' | 'R';
  /**
   * The single loudest layer sitting in that window, and how far over this one it is.
   *
   * ⚠️ **THE SUM IS WHAT MASKS AND ONE LAYER IS WHAT A HAND CAN MOVE**, which is why both are here.
   * `margin` is against everything, because that is what masking is; this names the one to argue
   * with. Where a window has a single dominant occupant the two nearly agree, and where they diverge
   * the layer is being buried by a crowd and no single edit will free it.
   */
  by: MusicLayer;
  /** How far `by` is over this layer in that window, in dB. Negative means nothing there is louder. */
  byDb: number;
}

/**
 * Every layer sounding at `rung`, by how much of it survives the rest of the mix — worst first.
 *
 * @param loops the baked composition for this place, on `layerLevels`' terms.
 * @param bakes the band-energy cache `rungShape` uses, keyed identically so the two share it.
 */
export function heardAt(
  theme: ThemeKind | undefined,
  rung: MusicLevel,
  loops: Record<MusicLayer, Float32Array>,
  bakes: Map<string, number[]>,
): Heard[] {

  /** Every sounding layer's A-weighted band energies, already at this rung's gain. */
  const sounding: { layer: MusicLayer; gain: number; bands: number[]; rms: number; peak: number }[] = [];
  for (const layer of MUSIC_LAYERS) {
    /*
      ⚠️ **THROUGH `gainIn`, AND IT READ `MUSIC_LADDER[rung][layer]` FOR FOUR DAYS** — 0184. Six of
      seven places have stated their own ladder since
      `docs/decisions/0162-a-place-has-its-own-ladder.md`, and **65 gains differ from the shared
      row**: seven layers a place OPENS were inaudible here, and eight a place CLOSES were masking
      layers they do not sound beside. **Six of the fifty-four known-adrift entries were phantoms.**
    */
    const gain = gainIn(theme, rung, layer);
    if (gain <= 0) continue;
    /*
      ⚠️ **A `heard/` PREFIX, BECAUSE THIS IS NOT THE MEASUREMENT `rungShape` CACHES.** Both walk the
      same layers and both want a per-band figure, so sharing the map is worth it — but one holds
      `bandEnergy` and the other `bandLevels`, and an unprefixed key would have each silently answer
      with the other's numbers. A shared cache of two different quantities is one description too few.
    */
    const own = theme !== undefined && revoicedBy(theme).includes(layer);
    const key = own ? `heard/${theme}/${layer}` : `heard//${layer}`;
    let bands = bakes.get(key);
    if (bands === undefined) {
      bands = bandLevels(loops[layer]!, 44100);
      bakes.set(key, bands);
    }
    // The layer's own RMS, cached beside its bands — one pass over the loop rather than one per rung.
    const rmsKey = own ? `rms/${theme}/${layer}` : `rms//${layer}`;
    let rmsOf = bakes.get(rmsKey);
    if (rmsOf === undefined) {
      const buffer = loops[layer]!;
      let sum = 0;
      let top = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = buffer[i]!;
        sum += v * v;
        const size = v < 0 ? -v : v;
        if (size > top) top = size;
      }
      rmsOf = [Math.sqrt(sum / buffer.length), top];
      bakes.set(rmsKey, rmsOf);
    }
    sounding.push({
      layer,
      gain,
      bands: bands.map((energy) => energy * gain),
      rms: rmsOf[0]! * gain * MUSIC_GAIN,
      peak: rmsOf[1]! * gain * MUSIC_GAIN,
    });
  }

  const power = (xs: number[]): number => Math.sqrt(xs.reduce((sum, x) => sum + x * x, 0));
  const db = (a: number, b: number): number => (a <= 0 || b <= 0 ? -Infinity : 20 * Math.log10(a / b));
  const loudest = Math.max(...sounding.map((s) => power(s.bands)), 1e-12);

  const out: Heard[] = [];
  for (const it of sounding) {
    const ears = panGains(LAYER_PAN[it.layer]);
    // Where this layer LIVES: within 12 dB of its own loudest band, and nowhere else counts.
    const home = Math.max(...it.bands, 1e-12) / 4;
    let margin = -Infinity;
    let band = BANDS[0]![2];
    let ear: 'L' | 'R' = 'L';
    let by = it.layer;
    let byDb = -Infinity;
    it.bands.forEach((mine, i) => {
      if (mine < home) return;
      for (const side of ['left', 'right'] as const) {
        const others = sounding.filter((other) => other.layer !== it.layer);
        const rest = power(others.map((other) => other.bands[i]! * panGains(LAYER_PAN[other.layer])[side]));
        const at = db(mine * ears[side], rest);
        if (at > margin) {
          margin = at;
          band = BANDS[i]![2];
          ear = side === 'left' ? 'L' : 'R';
          // The loudest single occupant of the window this layer settled on — recomputed here rather
          // than tracked per band, because only the winning window is ever reported.
          let most = 0;
          for (const other of others) {
            const at2 = other.bands[i]! * panGains(LAYER_PAN[other.layer])[side];
            if (at2 > most) { most = at2; by = other.layer; }
          }
          byDb = db(most, mine * ears[side]);
        }
      }
    });
    out.push({
      layer: it.layer,
      gain: it.gain,
      down: db(power(it.bands), loudest),
      out: it.rms <= 0 ? -Infinity : 20 * Math.log10(it.rms),
      outPeak: it.peak <= 0 ? -Infinity : 20 * Math.log10(it.peak),
      margin,
      band,
      ear,
      by,
      byDb,
    });
  }
  return out.sort((a, b) => a.margin - b.margin);
}

// ── AND WHETHER THAT IS THE FIGURE THE ARRANGEMENT ASKED FOR ────────────────────────────────────

/**
 * How far under its role's stated margin a layer may sit before it is doing a different job.
 *
 * ── DERIVED FROM `ROLE_MARGIN_DB`, WHICH IS WHY IT IS NOT A HAND'S GUESS ────────────────────────
 *
 * ⚠️ **`docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md`.**
 * [0152](../docs/decisions/0152-a-layer-is-heard-in-the-sum.md) measured `margin` and **deliberately
 * refused to put a threshold on it**, and its reason is written into `ROLE_MARGIN_DB`'s own comment:
 * *"`drone` is the connective tissue and is meant to sit under everything… a guard that says every
 * layer must be audible would flag it every time."* That objection is now answered.
 * [0154](../docs/decisions/0154-the-mix-is-authored-as-intent.md) states what each layer's margin is
 * **supposed** to be, per rung and per place, so the question stops being *is this audible* — which
 * has no single right answer across twenty-three layers — and becomes *is this the thing the
 * arrangement said it was*, which has exactly one.
 *
 * ⚠️ **AND THE FLOOR IS THE WIDEST STEP BETWEEN TWO ADJACENT ROLES**, computed here rather than
 * typed: −13, −9, −6, −2, 3 — so five decibels. A layer further under its target than that is
 * **demonstrably performing the role below the one it was given**, whatever the absolute number
 * happens to be. `part` at −6 is a `pulse`; a `pulse` at −12 is below `air`.
 *
 * ⚠️ **THAT IS WHAT MAKES IT SURVIVE A RETUNE OF `ROLE_MARGIN_DB`, and it is the property
 * `AUDIBLE_FLOOR_DB` above does not have.** −33 is a number read off one measured spread and its own
 * comment says it *"should GO rather than be widened"* if the spread closes. This one has nothing to
 * widen: move the role targets and the floor moves with them, because it was never about decibels —
 * it is about whether the five roles still mean five different things.
 *
 * ⚠️ **IT IS STILL NOT A SUBSTITUTE FOR LISTENING**, on `heardAt`'s own terms, and the role targets it
 * is measured against are a hand's guess that `ROLE_MARGIN_DB` marks as one. What this can say is that
 * the mix is not delivering what the arrangement asked for — which is a statement about two tables
 * disagreeing, and needs no ear at all.
 */
export const ROLE_FLOOR_DB = ((): number => {
  const rungs = MUSIC_ROLES.map((role) => ROLE_MARGIN_DB[role]).sort((a, b) => a - b);
  return -Math.max(...rungs.slice(1).map((margin, i) => margin - rungs[i]!));
})();

/** One layer at one rung, and the distance between what it is and what it was asked to be. */
export interface Adrift {
  layer: MusicLayer;
  /** What the arrangement says this layer IS at this rung, in this place. */
  role: MusicRole;
  /** What it actually has, in the best band it lives in — `heardAt`'s own figure. */
  margin: number;
  /** What its role asks for. */
  want: number;
  /** `margin - want`. Negative is under; `ROLE_FLOOR_DB` is how far under is too far. */
  adrift: number;
  /** The single loudest layer in that window, and how far over this one it is. */
  by: MusicLayer;
  byDb: number;
  band: string;
}

/**
 * Every layer the arrangement gives a role to at `rung`, by how far it is from that role — worst
 * first.
 *
 * ⚠️ **THE AURA IS SKIPPED, on `SOLVED_BY`'s own terms** — its gain is a distance the player steers
 * (0091), so a target margin for it would be a claim about a quantity the mix does not own.
 *
 * ⚠️ **THE ARITHMETIC IS SHARED WITH `scripts/weigh-adrift.mjs`** rather than restated there, which
 * is `weigh-rung.mjs`'s rule and 0029's reason: a printed figure that disagrees with an asserted one
 * is the tracked record drifting inside one repository.
 */
export function adriftAt(
  theme: ThemeKind | undefined,
  rung: MusicLevel,
  loops: Record<MusicLayer, Float32Array>,
  bakes: Map<string, number[]>,
): Adrift[] {
  const out: Adrift[] = [];
  for (const heard of heardAt(theme, rung, loops, bakes)) {
    if (!SOLVED_BY(heard.layer)) continue;
    const role = roleOf(theme, rung, heard.layer);
    if (role === null) continue;
    const want = ROLE_MARGIN_DB[role];
    out.push({
      layer: heard.layer,
      role,
      margin: heard.margin,
      want,
      adrift: heard.margin - want,
      by: heard.by,
      byDb: heard.byDb,
      band: heard.band,
    });
  }
  return out.sort((a, b) => a.adrift - b.adrift);
}

/**
 * How far a layer already sounding may fall when a section boundary opens new ones, in dB.
 *
 * ── A LEVEL JND, WHICH IS THE UNIT THE COMPLAINT WAS MADE IN ────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0167-a-build-does-not-duck.md`.** Reported, of the solved mix against the
 * shipped one at the same boundary: *"the border change is way worse… every change for every level is
 * now a hard jump between sounds whereas pre-solved-mix the change was a lot smoother and balanced."*
 *
 * ⚠️ **ONE DECIBEL IS ROUGHLY THE SMALLEST LEVEL CHANGE A LISTENER NOTICES**, so this is not a
 * threshold read off a spread — it is the point at which the thing being forbidden becomes a thing
 * that can be heard. CLAUDE.md requires at least one assertion per subject written in units the
 * player experiences, and every other number in this file is a ratio against the mix it is measuring.
 *
 * ⚠️ **THE SHIPPED LADDER CLEARS IT BY 0.74 dB AND HAS ALWAYS DONE**, which is the part worth
 * knowing: across all seven places and all three in-level boundaries its largest reduction of a
 * carried layer is **0.26 dB** — `drone`, and two others under 0.21. A section change in this game
 * has been purely additive since it existed, and nothing wrote that down.
 *
 * ⚠️ **`docs/decisions/0166-…`'s GUARD IS GREEN OVER THE DEFECT THIS ONE CATCHES.** That one measures
 * the MAGNITUDE of the worst boundary move; at the reported boundary the worst move is 2.9 dB and the
 * complaint is that four of seven carried layers went the wrong WAY while four new ones opened
 * loudly. Two guards over one boundary, and they are not the same question.
 */
export const DUCK_FLOOR_DB = -1;

/**
 * Every layer that is sounding on both sides of a rung change, and how far it moved.
 *
 * ⚠️ **A LAYER THAT OPENS OR CLOSES IS NOT A DUCK AND IS SKIPPED.** Closing one is a thing a rung may
 * do — `docs/decisions/0120-a-rung-may-close-a-layer.md` — and opening one is what a build IS. What
 * this is about is the layers that carry on through the change.
 */
export function carriedThrough(
  from: Readonly<Record<MusicLayer, number>>,
  to: Readonly<Record<MusicLayer, number>>,
): { layer: MusicLayer; move: number }[] {
  const out: { layer: MusicLayer; move: number }[] = [];
  for (const layer of MUSIC_LAYERS) {
    const a = from[layer];
    const b = to[layer];
    if (!(a > 0) || !(b > 0)) continue;
    out.push({ layer, move: 20 * Math.log10(b / a) });
  }
  return out.sort((x, y) => x.move - y.move);
}

/**
 * Every arrival at every rung change of one place, and how far into the boundary it lands.
 *
 * ── THE ONE DESCRIPTION `weigh-build.mjs` AND `tests/music.test.ts` BOTH ASK ────────────────────
 *
 * ⚠️ **`docs/decisions/0171-a-boundary-is-a-build.md`.** The arithmetic is `levelWrites`' and is not
 * repeated here — this walks a place's rungs the way a run does, hands the previous rung's targets
 * forward as `lastTargets`, and reports what came back. A printed figure that disagreed with an
 * asserted one would be `docs/decisions/0029-the-tracked-record-is-the-record.md` happening in
 * arithmetic, which is `scripts/weigh-audition.mjs`'s own standing rule.
 *
 * ⚠️ **`second` IS AGAINST THE BOUNDARY'S OWN DOWNBEAT AND NOT AGAINST THE CLOCK.** `levelWrites`
 * quantises to `nextBarFrom`, so the absolute time depends on where in the bar the camera crossed;
 * what a listener hears is the gap BETWEEN arrivals, and that is what this reports.
 *
 * ⚠️ **THE AURA IS SKIPPED.** It tracks a distance rather than a section — 0091 — and it is written
 * on every frame rather than on a change, so it is not an arrival in any sense this measures.
 */
export interface Arrival {
  layer: MusicLayer;
  role: MusicRole | null;
  second: number;
}

export interface BuildAt {
  from: MusicLevel;
  to: MusicLevel;
  arrivals: Arrival[];
  /** How long the whole build takes, first arrival to last, in seconds. */
  spread: number;
}

export function buildsOf(theme: ThemeKind, from: readonly MusicLevel[] = WALKED): BuildAt[] {
  const out: BuildAt[] = [];
  const heading: Partial<Record<MusicLayer, number>> = {};
  for (let i = 0; i < from.length; i++) {
    const to = from[i]!;
    const writes = levelWrites(to, theme, 0, 0, 0, heading);
    const arrivals: Arrival[] = [];
    for (const write of writes) {
      const opening = write.target > 0 && (heading[write.layer] ?? 0) === 0;
      if (opening && !AURA_LAYERS.includes(write.layer)) {
        arrivals.push({ layer: write.layer, role: roleOf(theme, to, write.layer), second: write.at });
      }
    }
    for (const write of writes) heading[write.layer] = write.target;
    if (i === 0) continue;
    arrivals.sort((a, b) => a.second - b.second || MUSIC_LAYERS.indexOf(a.layer) - MUSIC_LAYERS.indexOf(b.layer));
    const spread = arrivals.length === 0 ? 0 : arrivals[arrivals.length - 1]!.second - arrivals[0]!.second;
    out.push({ from: from[i - 1]!, to, arrivals, spread });
  }
  return out;
}

/**
 * The rungs a run actually crosses, in order, starting from the title.
 *
 * ⚠️ **`calm` IS IN IT BECAUSE THE MUSIC DOES NOT STOP BETWEEN THE TITLE AND THE LEVEL** — 0119 stops
 * the loops only when sound is turned off. So `calm → run` is a real boundary a player hears, and it
 * is the one that opens the most layers of any in the game.
 *
 * ⚠️ **`bossPeak` IS NOT, because it opens nothing.** It is the fight with more of it — 0114 — and a
 * boundary with no arrival has no build to measure.
 */
const WALKED: readonly MusicLevel[] = ['calm', 'run', 'push', 'surge', 'approach', 'boss'];

/**
 * A place's balance AT ONE RUNG — the same quantity `profileOf` reports, taken at the gains a
 * section actually plays rather than at each layer's loudest.
 *
 * ── THE INSTRUMENT `weigh-apart` COULD NOT BE, AND THE REASON IS STRUCTURAL ─────────────────────
 *
 * ⚠️ **`docs/decisions/0172-a-place-opens-with-its-own-four.md`.** `profileOf` runs on `loudestOf`,
 * which takes each layer to the loudest gain ANY rung gives it — an arrangement no rung plays, and
 * one dominated by the fight, because the fight is where nearly every layer peaks. **So a change to
 * what a level OPENS with is invisible to it.** Seven authored `run` rows moved the apart table by
 * 0.1 dB and moved every one of the seven openings.
 *
 * ⚠️ **AND *THE OPENING* IS WHERE THE COMPLAINT LIVES.** *"The run feels almost exactly the same"*,
 * *"still slow and melodic"*, *"every level sounds the same"* — all three are about the first minute,
 * which is a third of a level and the only part a player hears before deciding where they are. A
 * measure that averages it with the boss is measuring the wrong section.
 *
 * ⚠️ **A LAYER THE RUNG DOES NOT OPEN IS `-Infinity`**, exactly as in `profileOf`, so `apartBy` skips
 * it — which means **closing a layer registers as a difference only through the layers left**. That is
 * the honest reading: two places differ by what you can hear, not by what they have shut.
 */
export function profileAt(
  theme: ThemeKind,
  rung: MusicLevel,
  loops: Record<MusicLayer, Float32Array>,
  ladder: ThemeRow['ladder'] = THEMES[theme].ladder,
): Record<MusicLayer, number> {
  const levels: LayerLevel[] = [];
  for (const layer of MUSIC_LAYERS) {
    const buffer = loops[layer];
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i]!;
      sum += v * v;
      const size = v < 0 ? -v : v;
      if (size > peak) peak = size;
    }
    const ceiling = FOLLOWS_THE_BOSS.includes(layer) ? auraCeilingIn(theme) : 1;
    const gain = rungOf(theme, rung, layer, ladder) * mixOf(theme, layer) * ceiling;
    levels.push({ layer, gain, rms: Math.sqrt(sum / buffer.length) * gain, peak: peak * gain });
  }
  levels.sort((a, b) => b.rms - a.rms);
  const out = {} as Record<MusicLayer, number>;
  for (const layer of MUSIC_LAYERS) {
    const under = underTheLoudest(levels, layer);
    out[layer] = Math.max(under.rms, under.peak);
  }
  return out;
}

/** Which layers a place actually sounds at a rung, loudest first — the four at the top of the mix. */
export function soundingAt(
  theme: ThemeKind,
  rung: MusicLevel,
  loops: Record<MusicLayer, Float32Array>,
  ladder: ThemeRow['ladder'] = THEMES[theme].ladder,
): MusicLayer[] {
  const row = profileAt(theme, rung, loops, ladder);
  return MUSIC_LAYERS.filter((l) => Number.isFinite(row[l])).sort((a, b) => row[b] - row[a]);
}
