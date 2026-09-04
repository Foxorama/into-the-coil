/**
 * What the whole mix sums to, second by second, over a level's own length.
 *
 * `docs/decisions/0215-a-transition-is-a-shape-not-an-instant.md`. Reported 2026-09-03, of The
 * Approach: *"at 41sec in, the volume increases a bit too loudly. there's too big a jump from the
 * transition to the spike at that level, and we'll need to make sure the transitions are smoothed out
 * for the rest of the level so there's no weird drops later."*
 *
 * ── WHY NOTHING HERE COULD ALREADY ANSWER IT ────────────────────────────────────────────────────
 *
 * ⚠️ **A JUMP IS A DIFFERENCE BETWEEN TWO MOMENTS.** `heardAt` asks what a rung sounds like once it
 * has settled; `weigh-boundary` subtracts the two sides of a change; `buildsOf` says when each
 * arrival lands and never how loud. All three are green over an arc that steps six decibels in a
 * fifth of a second, because **none of them has both a time axis and a sum in it**.
 *
 * ⚠️ **AND `docs/decisions/0140-no-layer-is-inaudible.md` IS WHY A TABLE OF GAINS WILL NOT DO.** *A
 * gain is not a loudness* — the faders across a place span about 7 dB and what comes out of them
 * spans 38. What a listener called loud is the sum of the material at those gains.
 *
 * ── ONE WALK, WHICH IS WHY THIS SERVES BOTH SURFACES ────────────────────────────────────────────
 *
 * ⚠️ **THE ARC IS MEASURED OVER `auditionRung`, WHICH IS THE MUSIC ROOM'S WALK AND A RUN'S LADDER AT
 * ONCE** — 0212 made those one function on purpose. So a fix measured here lands in the game and in
 * the music room by construction, and there is no version of a mix change that could reach one and
 * not the other. Asked for in those words: *"all changes requested should affect both equally and I
 * shouldn't need to specify going ahead."*
 */

import {
  auditionAura,
  auditionLength,
  auditionRung,
  bakeLayer,
  levelOfPlace,
  levelWrites,
  UNITS_PER_SECOND,
} from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { AURA_LAYERS, BAR_SECONDS, MUSIC_LAYERS, type MusicLayer, type MusicLevel } from '../src/content/music.ts';
import { revoicedBy, type ThemeKind } from '../src/content/themes.ts';
import { kWeighted } from './loudness.ts';

/**
 * How big a move, inside one sample, this calls sudden — in dB.
 *
 * ── A HAND'S NUMBER, SET AGAINST THE REPORT RATHER THAN AGAINST A TEXTBOOK ──────────────────────
 *
 * ⚠️ **3 dB IS A DOUBLING OF POWER**, which is the smallest level change reliably heard AS a change
 * rather than as the music continuing — and it is the number every other field using this quantity
 * reaches for. That is where it came from; what makes it defensible here is the second half.
 *
 * ⚠️ **IT WAS CHECKED AGAINST WHAT THE LISTENER ACTUALLY FLAGGED**, on
 * `docs/decisions/0140-no-layer-is-inaudible.md`'s own terms: the arc it was chosen over flagged
 * **the moment that was reported and the two the report predicted**, and nothing else. A threshold
 * that also flagged half the level would be a threshold nobody could act on, and one that flagged
 * nothing would be measuring the wrong quantity.
 */
export const LOUD_STEP_DB = 3;

/**
 * What each layer's material puts out at unit gain, per place.
 *
 * ── SEVEN FULL BAKES WAS THIRTY-THREE SECONDS AND STARVED THE REST OF THE SUITE ─────────────────
 *
 * ⚠️ **A BAKE IS ABOUT FOUR SECONDS AND SEVEN PLACES IS SEVEN OF THEM**, all at module scope, all
 * before a single assertion ran. `npm test` went from 101 s to 118 s and `tests/links.test.ts` — a
 * guard that takes 825 ms on its own — **timed out at five seconds** on the load. That is
 * `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`'s subject: the
 * intermittent guard had found something, and what it found was this file.
 *
 * ⚠️ **ONLY A PLACE'S OWN MATERIAL DIFFERS, WHICH `revoicedBy` ALREADY STATES.** So the base
 * composition is baked once and a place re-bakes only the layers it re-voices — the same trick
 * `rungShape` in `tests/pace.ts` uses for spectra, and the same accounting
 * `docs/decisions/0115-a-probe-runs-its-own-guard.md` did when 161 bakes turned out to be 44 distinct
 * pieces of audio. Measured after: **33 s to under 6**.
 */
const rmsCache = new Map<string, number>();

function rmsOf(theme: ThemeKind, rate = SAMPLE_RATE): Record<MusicLayer, number> {
  const own = revoicedBy(theme);
  const out = {} as Record<MusicLayer, number>;
  for (const layer of MUSIC_LAYERS) {
    /*
      A shared layer is keyed as the BASE's, so places that share material answer from one entry.

      ⚠️ **THE RATE IS IN THE KEY, AND LEAVING IT OUT WOULD HAND BACK THE WRONG BAKE.** The cache is
      the only thing between a caller asking for a cheaper rate and getting the full-rate answer
      silently — which would make a measurement of *does the rate matter* answer itself.

      ⚠️ **AND THE SHARING SAVES ALMOST NOTHING TODAY, WHICH IS WORTH KNOWING RATHER THAN ASSUMING.**
      `tests/bakes.ts` still says *"six of the seven places still share one bake"*; measured on
      2026-09-03, six of seven **re-voice 21 or 22 of the 23 layers**. That note has been overtaken by
      0132 and 0162 giving places their own material, and the caching here is kept because it is free
      rather than because it pays.
    */
    const key = `${own.includes(layer) ? theme : ''}/${layer}@${rate}`;
    let value = rmsCache.get(key);
    if (value === undefined) {
      /*
        ⚠️ **K-WEIGHTED, SINCE 0226.** Each layer's level here is what it contributes to the sum a
        listener weighs, not to a meter: `sub` and `drone` dominate an unweighted power sum and are
        exactly the layers the hold eases at a boundary, so the unweighted arc reported a hole where
        the ear meets a dip a third the size. `tests/loudness.ts` is the same weighting `driveAt`
        measures the settled rungs with, so a hole and a hold are now in one unit.
      */
      const buffer = kWeighted(bakeLayer(layer, rate, own.includes(layer) ? theme : undefined), rate);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) sum += buffer[i]! * buffer[i]!;
      value = Math.sqrt(sum / buffer.length);
      rmsCache.set(key, value);
    }
    out[layer] = value;
  }
  return out;
}

export interface ArcAt {
  /** Seconds into the level, from its first frame. */
  second: number;
  /** Which rung the ladder is on — `auditionRung`'s answer, which is a run's answer. */
  rung: MusicLevel;
  /** What the whole mix sums to, in dB, relative to full scale. */
  db: number;
  /** How much that moved since the sample before. The quantity a listener calls a jump. */
  step: number;
}

/** One scheduled `setTargetAtTime`, as the mixer performs it. */
interface Ramp {
  at: number;
  tau: number;
  target: number;
  from: number;
}

/**
 * Walk a level and report what the mix sums to at every step.
 *
 * ⚠️ **`levelWrites` IS ASKED AT EVERY SAMPLE, WHICH IS WHAT THE SHELL DOES.** `src/app/mount.ts`
 * calls `applyMusicLevel` every step and the function itself skips any layer whose target has not
 * moved — so asking often is faithful rather than wasteful, and it is what keeps the aura moving
 * between rung changes instead of stepping at them.
 *
 * @param step seconds between samples. Smaller sees sharper edges; 0.2 is under an eighth of a bar.
 */
export function arcOf(theme: ThemeKind, step = 0.2, rate = SAMPLE_RATE): ArcAt[] {
  const level = levelOfPlace(theme);
  if (level === null) return [];
  const rms = rmsOf(theme, rate);

  const value = {} as Record<MusicLayer, number>;
  const active = {} as Record<MusicLayer, Ramp | null>;
  const pending = {} as Record<MusicLayer, Ramp[]>;
  const lastTargets: Partial<Record<MusicLayer, number>> = {};
  for (const layer of MUSIC_LAYERS) {
    value[layer] = 0;
    active[layer] = null;
    pending[layer] = [];
  }

  const out: ArcAt[] = [];
  const total = auditionLength(level) / UNITS_PER_SECOND;
  let previous: number | null = null;
  for (let second = 0; second <= total; second += step) {
    const along = second * UNITS_PER_SECOND;
    const rung = auditionRung(level, along);
    const aura = auditionAura(level, theme, along);

    /*
      ⚠️ **ANCHOR ZERO, so the bar grid is absolute and every arrival lands where the mixer puts it.**
      `nextBarFrom(0, now)` is what `levelWrites` uses to quantise a change to a downbeat — 0117 — and
      an anchor that moved would put the build on a grid no player ever hears.
    */
    for (const write of levelWrites(rung, theme, aura, 0, second, lastTargets)) {
      lastTargets[write.layer] = write.target;
      pending[write.layer]!.push({ at: write.at, tau: write.tau, target: write.target, from: 0 });
    }

    let power = 0;
    for (const layer of MUSIC_LAYERS) {
      const queue = pending[layer]!;
      while (queue.length > 0 && queue[0]!.at <= second) {
        const ramp = queue.shift()!;
        // The ramp starts from wherever the gain had reached, which is what `setTargetAtTime` does.
        ramp.from = value[layer];
        active[layer] = ramp;
      }
      const ramp = active[layer];
      if (ramp !== null) {
        const held = second - ramp.at;
        value[layer] = ramp.target + (ramp.from - ramp.target) * Math.exp(-held / ramp.tau);
      }
      const heard = value[layer] * rms[layer];
      power += heard * heard;
    }

    /*
      ⚠️ **K-WEIGHTED PER LAYER SINCE 0226**, so `db` here is closer to LU than to dBFS: `rmsOf`
      weighs each layer's material with the standard's filters before it is squared, and the hole
      and rise below are read in the unit the hold is solved in.

      ⚠️ **SUMMED IN POWER, WHICH IS THE MODEL AND IS SAID SO OUT LOUD.** Unrelated material adds
      incoherently, which is the assumption `tests/pace.ts` already makes about a mix, and the bus's
      `saturate` curve is not applied — so a jump measured here is an **upper bound** on the one a
      listener hears. For a guard about something being too loud that is the safe direction.
    */
    const db = power <= 0 ? -Infinity : 10 * Math.log10(power);
    const finite = Number.isFinite(db) ? db : -120;
    out.push({ second, rung, db: finite, step: previous === null ? 0 : finite - previous });
    previous = finite;
  }
  return out;
}

/**
 * What one rung change does, as the two things an ear complains about.
 *
 * ⚠️ **A BOUNDARY IS A WINDOW, NOT AN INSTANT, AND THAT IS THE WHOLE FINDING.** The rung turns over
 * on a downbeat and the mix is still moving five seconds later — `entryBars` staggers arrivals over
 * four bars — so *what happened at the transition* cannot be read off either side of it. The two
 * numbers below are the two halves of the report that produced this file.
 */
export interface BoundaryAt {
  from: MusicLevel;
  to: MusicLevel;
  /** When the rung turned over, in seconds. */
  second: number;
  /** What the mix summed to as it turned over, and where it settled after. */
  before: number;
  after: number;
  /**
   * The deepest the mix goes BELOW where it started, in dB.
   *
   * ⚠️ **THIS IS TWO QUANTITIES ADDED TOGETHER AND IT MISLED THE FIRST PASS AT 0215.** A boundary
   * into a quieter rung dips because the rung IS quieter — that is
   * `docs/decisions/0136-the-place-has-a-room-and-an-arc.md`'s authored shape, *"Up, Up, Up, drop,
   * sharp Down for the boss"* — and a boundary whose departures outrun its arrivals dips because of
   * a hole. Read alone this reported The Toxic Hire's `surge → approach` as −4.9 dB of defect when
   * **3.5 of it is the composition**. `settled` and `hole` below are the two halves apart.
   */
  dip: number;
  /** What the rung change itself is worth, once everything has arrived. The composition's own step. */
  settled: number;
  /**
   * How far below BOTH ends of the boundary the mix falls, in dB — the transient, and nothing else.
   *
   * ⚠️ **Zero for a boundary that merely steps down.** A negative number is a stretch where the music
   * is quieter than either the rung it left or the rung it is arriving at, which is the *"weird
   * drop"* half of the report and is the only part of a dip that nobody authored.
   */
  hole: number;
  /** How far the mix rose inside its fastest single bar — the *spike* half of the report. */
  rise: number;
  /** When that fastest bar ended, in seconds. */
  riseAt: number;
}

/**
 * Every rung change in a level, with what it does to the sum.
 *
 * ⚠️ **THE WINDOW RUNS TO THE NEXT BOUNDARY OR EIGHT SECONDS, WHICHEVER IS SOONER.** A build is at
 * most four bars plus a ramp — 6.4 s at this tempo — so eight covers it, and stopping at the next
 * boundary keeps one change's build from being read as the next one's dip.
 */
export function boundariesIn(arc: readonly ArcAt[], step = 0.2): BoundaryAt[] {
  const out: BoundaryAt[] = [];
  const bar = Math.max(1, Math.round(BAR_SECONDS / step));
  for (let i = 1; i < arc.length; i++) {
    if (arc[i]!.rung === arc[i - 1]!.rung) continue;
    const before = arc[i - 1]!.db;
    let end = i;
    while (end + 1 < arc.length && arc[end + 1]!.second - arc[i]!.second <= 8 && arc[end + 1]!.rung === arc[i]!.rung) {
      end++;
    }
    const after = arc[end]!.db;
    let dip = 0;
    let lowest = before;
    let rise = 0;
    let riseAt = arc[i]!.second;
    for (let j = i; j <= end; j++) {
      const under = arc[j]!.db - before;
      if (under < dip) dip = under;
      if (arc[j]!.db < lowest) lowest = arc[j]!.db;
      // The rise across one bar, which is the unit an arrival lands on.
      const was = arc[Math.max(0, j - bar)]!.db;
      if (arc[j]!.db - was > rise) {
        rise = arc[j]!.db - was;
        riseAt = arc[j]!.second;
      }
    }
    out.push({
      from: arc[i - 1]!.rung,
      to: arc[i]!.rung,
      second: arc[i]!.second,
      before,
      after,
      dip,
      settled: after - before,
      // Below the lower of the two ends is the only part of a dip nobody wrote.
      hole: Math.min(0, lowest - Math.min(before, after)),
      rise,
      riseAt,
    });
  }
  return out;
}

/** The biggest single move in an arc, by magnitude — the one a report is usually about. */
export function worstStep(arc: readonly ArcAt[]): ArcAt | null {
  if (arc.length === 0) return null;
  return arc.reduce((a, b) => (Math.abs(b.step) > Math.abs(a.step) ? b : a), arc[0]!);
}

/** Every move at or past `LOUD_STEP_DB`, which is what a listener would call a step. */
export function suddenIn(arc: readonly ArcAt[], threshold = LOUD_STEP_DB): ArcAt[] {
  return arc.filter((at) => Math.abs(at.step) >= threshold);
}

/**
 * How steep a one-bar rise may be before a listener calls it a jump, in dB.
 *
 * ── THE FLOOR IS THE COMPOSITION'S, WHICH IS WHY THIS IS NOT `LOUD_STEP_DB` ─────────────────────
 *
 * ⚠️ **A BOUNDARY THAT IS WORTH 5 dB CANNOT BE DELIVERED IN LESS THAN 1.2 dB A BAR.** The build is
 * four bars wide (`BUILD_BARS`), so the arithmetic floor for The Black Heart's `run → push` — which
 * `docs/decisions/0136-the-place-has-a-room-and-an-arc.md` authored as a big step up — is about
 * **1.25 dB**. A guard set at the audibility threshold would be demanding that the arrangement be
 * flattened, which is a different decision and not one a transition-timing rule may make.
 *
 * ⚠️ **2 dB IS THE MEASURED CEILING AFTER 0215 ACROSS ALL SEVEN PLACES**, with the worst at 1.9 and
 * the reported one at 1.1. It was 3.8 before. So this holds the fix rather than describing the
 * arrangement — a place whose ladder grew a bigger step would still pass, and a regression in the
 * RAMP rules would not.
 */
export const BAR_RISE_CEILING_DB = 2;

/** Which layers a rung opens that the one before it did not sound — the arrivals a build staggers. */
export function arrivalsInto(theme: ThemeKind, from: MusicLevel, to: MusicLevel): MusicLayer[] {
  const before: Partial<Record<MusicLayer, number>> = {};
  for (const write of levelWrites(from, theme, 0, 0, 0, {})) before[write.layer] = write.target;
  const out: MusicLayer[] = [];
  for (const write of levelWrites(to, theme, 0, 0, 0, before)) {
    if (AURA_LAYERS.includes(write.layer)) continue;
    if (write.target > 0 && (before[write.layer] ?? 0) === 0) out.push(write.layer);
  }
  return out;
}
