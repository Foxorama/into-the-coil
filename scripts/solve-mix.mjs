// The solve itself — the one description, because two scripts and a guard all ask for it.
//
// docs/decisions/0154-the-mix-is-authored-as-intent.md. `scripts/weigh-solve.mjs` prints it,
// `scripts/hear-solved.mjs` renders it, and a copy in either would be
// docs/decisions/0029-the-tracked-record-is-the-record.md happening in arithmetic — the exact defect
// scripts/weigh-audition.mjs names about `tests/pace.ts`.

import { panGains } from '../src/app/music.ts';
import { AURA_LEVEL_CEILING, LAYER_PAN, MUSIC_LADDER, MUSIC_LAYERS, MUSIC_LEVELS } from '../src/content/music.ts';
import { mixOf, rungOf } from '../src/content/themes.ts';
import { ROLE_MARGIN_DB, SOLVED_BY, roleOf } from '../src/content/arrangement.ts';
import { bandLevels } from '../tests/spectrum.ts';

const power = (xs) => Math.sqrt(xs.reduce((s, x) => s + x * x, 0));
const db = (a, b) => (a <= 0 || b <= 0 ? -Infinity : 20 * Math.log10(a / b));

/** Every layer's A-weighted band levels, measured with filters. `tests/spectrum.ts` has why. */
export function profileOfLoops(loops) {
  const profile = {};
  for (const l of MUSIC_LAYERS) profile[l] = bandLevels(loops[l], 44100);
  return profile;
}

/**
 * Every layer's plain broadband RMS — the quantity the OUTPUT is made of.
 *
 * ── AND THE A-WEIGHTED SUM IS NOT IT, WHICH WAS A REAL BUG WITH A CONFIDENT CLAIM ON TOP ────────
 *
 * ⚠️ **`solveMix` HELD THE RUNG'S LEVEL BY PRESERVING `Σ power(bandLevels)`, AND THAT IS A LOUDNESS
 * ESTIMATE RATHER THAN A LEVEL.** A-weighting discounts the bottom octaves by twenty to thirty
 * decibels, and the solve's largest single move is dropping the bed — `sub` by 9 dB, `engine` by 5.
 * In A-weighted terms those layers barely count, so the sum looked preserved; **the rendered file was
 * 8.76 dB quieter than the one it was supposed to be compared against.**
 *
 * ⚠️ **IT WAS ONLY CAUGHT BY RENDERING A WHOLE LEVEL AND MEASURING THE FILE**, which is
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` exactly: every number in the solve
 * agreed with every other number in the solve, and the artefact disagreed with all of them. A mix
 * change handed to a listener 8.76 dB down would have been judged as thin, and the judgement would
 * have been about this function.
 *
 * ⚠️ **UNCORRELATED LAYERS ADD IN POWER**, so the summed level is `sqrt(Σ (rms × gain)²)` — which is
 * what the loops actually are, being different material rather than copies of one signal.
 */
export function rmsOfLoops(loops) {
  const out = {};
  for (const l of MUSIC_LAYERS) {
    const buffer = loops[l];
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    out[l] = Math.sqrt(sum / buffer.length);
  }
  return out;
}

/**
 * Every sounding layer's margin at `gains` — 0152's `heardAt` arithmetic over a profile map.
 *
 * ⚠️ **THE BEST WINDOW AND NOT THE AVERAGE ONE**, and only bands the layer lives in count. Both are
 * `tests/pace.ts`'s rules and the reasoning is there rather than repeated here.
 */
export function marginsOf(profile, gains) {
  const live = MUSIC_LAYERS.filter((l) => gains[l] > 0);
  const out = {};
  for (const it of live) {
    const ears = panGains(LAYER_PAN[it]);
    const mine = profile[it].map((e) => e * gains[it]);
    const home = Math.max(...mine, 1e-12) / 4;
    let best = -Infinity;
    mine.forEach((v, i) => {
      if (v < home) return;
      for (const side of ['left', 'right']) {
        const rest = power(
          live.filter((o) => o !== it).map((o) => profile[o][i] * gains[o] * panGains(LAYER_PAN[o])[side]),
        );
        const at = db(v * ears[side], rest);
        if (at > best) best = at;
      }
    });
    out[it] = best;
  }
  return out;
}

/** What `MUSIC_LADDER` and the place's mix currently produce at `rung`. */
export function shippedAt(theme, rung) {
  // ⚠️ The aura's row is a CEILING and not a gain — 0091, 0107.
  const nearness = rung === 'boss' || rung === 'bossPeak' ? 1 : AURA_LEVEL_CEILING;
  const out = {};
  for (const l of MUSIC_LAYERS) out[l] = rungOf(theme, rung, l) * mixOf(theme, l) * (SOLVED_BY(l) ? 1 : nearness);
  return out;
}

/**
 * The gains the arrangement wants at `rung`, at the level the ladder already authored.
 *
 * ── WHAT IS SOLVED AND WHAT IS NOT ──────────────────────────────────────────────────────────────
 *
 * ⚠️ **BALANCE IS SOLVED; LOUDNESS IS NOT TOUCHED.** The rung's summed level is held to what
 * `MUSIC_LADDER` already produced, so the arc (run < push < surge, boss > approach) and the clipping
 * ceiling survive **by construction** rather than by luck. That is the whole of why this is a safe
 * change to a mix that eight decisions have tuned.
 *
 * ⚠️ **THE LEVEL IS RESTORED INSIDE THE LOOP, and doing it afterwards is a real bug wearing the
 * costume of a rounding error.** Margins are ratios, so scaling every gain together cannot move one —
 * except the aura is deliberately not scaled. A rescale applied once at the end therefore moves every
 * solved layer against the one that did not, and every bed lands about 2.4 dB under target with
 * exactly the shape of a convergence failure.
 *
 * ⚠️ **THE ARRANGEMENT IS THE SPACING, NOT THE ABSOLUTE MARGINS.** At the boss the aura is at full,
 * is not solved, and is loud — so the whole solved set settles about 1.6 dB under the stated targets,
 * uniformly. `offset` reports that anchor. A part at +1.4 over counter-lines at −3.6 is the same
 * arrangement as +3 over −2, and judging the absolute value called twelve healthy layers wrong.
 */
export function solveMix(
  theme,
  rung,
  loops,
  profile = profileOfLoops(loops),
  rms = rmsOfLoops(loops),
  previous = null,
  weight = 0,
) {
  const shipped = shippedAt(theme, rung);
  const gains = {};
  /*
    ⚠️ **THE PREVIOUS RUNG IS THE STARTING POINT, NOT A COLD 1** — 0166. A layer the last rung already
    placed starts where it was left, so the solver has to move it to disagree rather than to agree.
    With `weight` at zero this is a different starting point for the same fixed point and the answer
    is unchanged; what it buys is that the damped step now has somewhere to stop.
  */
  for (const l of MUSIC_LAYERS) {
    if (shipped[l] <= 0) { gains[l] = 0; continue; }
    if (!SOLVED_BY(l)) { gains[l] = shipped[l]; continue; }
    gains[l] = previous !== null && previous[l] > 0 ? previous[l] : 1;
  }

  /*
    ⚠️ **ANCHORED MEANS *OPEN ON BOTH SIDES*, AND DELIBERATELY SAYS NOTHING ABOUT THE ROLE** — 0166,
    which is where this parts company with what
    `reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md` specified. That report asked for
    continuity *"for any layer whose role has not changed"*, having measured that 46 of 57 lurches
    were role-unchanged. Measured: that halves the COUNT and does not move the WORST ONE, which stays
    at 17–18 dB at every weight — because a role change is a 5 dB change of TARGET producing an 18 dB
    change of GAIN, margin being measured against a sum that moves at the same instant. rime's `lead`
    at `surge→approach` is −17.9 dB, and it is a `part` becoming a `counter`.
  */
  const anchored = {};
  for (const l of MUSIC_LAYERS) {
    anchored[l] = previous !== null && SOLVED_BY(l) && shipped[l] > 0 && previous[l] > 0 && weight > 0;
  }

  // ⚠️ THE BROADBAND POWER AND NOT THE A-WEIGHTED SUM — `rmsOfLoops` has the bug this replaces.
  const summed = (g) => Math.sqrt(MUSIC_LAYERS.reduce((s, l) => s + (g[l] > 0 ? (rms[l] * g[l]) ** 2 : 0), 0));
  const was = summed(shipped);
  const renormalise = () => {
    const scale = was / summed(gains);
    for (const l of MUSIC_LAYERS) if (SOLVED_BY(l)) gains[l] *= scale;
  };

  let steps = 0;
  let worst = Infinity;
  for (let i = 0; i < 400; i++) {
    const m = marginsOf(profile, gains);
    worst = 0;
    for (const l of MUSIC_LAYERS) {
      if (gains[l] <= 0 || !SOLVED_BY(l)) continue;
      const role = roleOf(theme, rung, l);
      if (role === null) continue;
      const marginErr = ROLE_MARGIN_DB[role] - m[l];
      /*
        ⚠️ **TWO ERRORS, BLENDED, AND THE SECOND ONE IS IN THE SAME UNITS AS THE FIRST.** `marginErr`
        is how far this layer is from what its role asks; `holdErr` is how far its gain has travelled
        from where the previous rung left it. Both are decibels, so `weight` is a straight *how much
        of this step is spent not moving* — 0 is the independent solve and 1 never moves at all.
      */
      const holdErr = anchored[l] ? 20 * Math.log10(previous[l] / gains[l]) : 0;
      const w = anchored[l] ? weight : 0;
      const err = (1 - w) * marginErr + w * holdErr;
      if (Math.abs(err) > Math.abs(worst)) worst = err;
      // A quarter of the error, in dB. Damped because every gain is in every other layer's denominator.
      gains[l] *= Math.pow(10, (err * 0.25) / 20);
    }
    renormalise();
    steps = i + 1;
    if (Math.abs(worst) < 0.2) break;
  }

  const margins = marginsOf(profile, gains);
  const lead = MUSIC_LAYERS.find((l) => SOLVED_BY(l) && shipped[l] > 0 && roleOf(theme, rung, l) === 'part');
  const offset = lead === undefined ? 0 : margins[lead] - ROLE_MARGIN_DB.part;

  return { shipped, gains, margins, offset, steps, worst, profile };
}

/**
 * How much of each correction step is spent holding a gain where the previous rung left it.
 *
 * ── THE LARGEST WEIGHT THAT COSTS NOTHING, WHICH IS WHY IT IS NOT A TASTE ───────────────────────
 *
 * ⚠️ **`docs/decisions/0166-the-level-is-solved-as-one-trajectory.md`.** Reported: *"the gain is
 * changing drastically between boundaries and it makes the music jumpy when transitioning between
 * run, surge, approach etc."*
 *
 * ⚠️ **AT 0.40 THE TRAJECTORY BEATS THE INDEPENDENT SOLVE ON EVERY AXIS AND LOSES NOTHING.** Worst
 * in-level boundary move 16.7 dB → **11.2**, moves of 6 dB or more 22 → **7**, and **not one layer
 * goes under `ROLE_FLOOR_DB`** — 0.42 already puts two under, so this is the edge of free, measured
 * to two decimal places rather than chosen. `reports/what-continuity-costs-2026-08-18.md` has the
 * curve.
 *
 * ⚠️ **PAST IT THE TRADE IS REAL AND THERE IS NO KNEE**, so there is nothing here for a measurement
 * to decide: every decibel of steadiness bought after the edge costs audibility, and w=0.65 was a
 * 7.0 dB worst move with twelve layers back under the floor. **That is why the dashboard has a slider
 * and this file has a default** — `docs/decisions/0126-the-dashboard-is-the-instrument.md`.
 *
 * ⚠️ **IT WAS 0.40 AND THE EDGE MOVED TO 0.28** —
 * `docs/decisions/0172-a-place-opens-with-its-own-four.md`. Seven authored ladders changed what each
 * place is solving, and at 0.30 `core/push/perc` goes under `ROLE_FLOOR_DB` where nothing did before.
 * **This is the guard doing exactly what its own comment said it would**: *"if a later mix pass moves
 * that edge, this test says so rather than going quietly on shipping the old number."* The trajectory
 * solve does not ship — 0166 — so what this costs today is research headroom and not a sound.
 */
export const HOLD_WEIGHT = 0.28;

/**
 * A whole level solved as ONE TRAJECTORY — each rung starting from the one before it.
 *
 * ── WHY EVERY CALLER USES THIS AND NONE CALLS `solveMix` PER RUNG ───────────────────────────────
 *
 * ⚠️ **A per-rung call is the independent solve by construction**, because `previous` is what carries
 * the continuity. A script that looped rungs itself would print a mix the dashboard does not play,
 * which is `docs/decisions/0029-the-tracked-record-is-the-record.md` happening in arithmetic and the
 * exact defect `scripts/weigh-audition.mjs` names about `tests/pace.ts`. `solveMix` stays exported
 * for the one caller that wants a single rung, and it takes the trajectory's own arguments.
 *
 * ⚠️ **`calm` IS SOLVED ON ITS OWN AND IS NOT THE HEAD OF THE CHAIN.** The title screen is not inside
 * a level's arc — a player reaches `run` by pressing a button, not by crossing a section boundary —
 * so anchoring `run` to the title's gains would hold a continuity across the one transition that is
 * supposed to be a cut. `docs/decisions/0095-the-level-has-its-own-music.md` is why they are two
 * pieces at all.
 */
export function solveLevel(theme, loops, profile = profileOfLoops(loops), rms = rmsOfLoops(loops), weight = HOLD_WEIGHT) {
  const out = {};
  let previous = null;
  for (const rung of MUSIC_LEVELS) {
    const chained = rung === 'calm' ? null : previous;
    const solved = solveMix(theme, rung, loops, profile, rms, chained, weight);
    out[rung] = solved;
    if (rung !== 'calm') previous = solved.gains;
  }
  return out;
}

/**
 * Which rung the re-based mix takes its balance from.
 *
 * ⚠️ **`push` BECAUSE IT COSTS THE LEAST, MEASURED**: re-basing on `run` leaves 79 layers under
 * 0164's floor and on `surge` 45, against **44** here. It is also the middle of a level, which is
 * where a balance chosen for the whole of one should be read.
 */
export const REBASE_RUNG = 'push';

/**
 * The shipped ladder's MOTION carrying the solve's BALANCE — the third mix.
 *
 * ── WHY THIS EXISTS AND WHAT IT IS FOR ──────────────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0167-a-build-does-not-duck.md`.** The shipped ladder never makes a carried
 * layer audibly quieter at a section boundary — 0 of 21, worst 0.26 dB — and the solve does it 56
 * times, up to 11.2 dB. Reported: *"every change for every level is now a hard jump between sounds
 * whereas pre-solved-mix the change was a lot smoother and balanced."*
 *
 * ⚠️ **THE ADDITIVITY IS A PROPERTY OF THE LADDER'S PER-LAYER RATIOS, NOT OF ITS BALANCE.** So keep
 * the ratios exactly and re-base each layer so that at `REBASE_RUNG` the mix IS the solved one:
 *
 *     out[rung][layer] = shipped[rung][layer] × (solved[ref][layer] / shipped[ref][layer])
 *
 * Every boundary then moves exactly as the shipped ladder moves — **additive by construction** — and
 * the balance at the reference rung is the solve's to the last decimal.
 *
 * ⚠️ **IT IS A THIRD OPTION AND NOT A CONCLUSION.** Measured: 0 ducked (solve 56), 44 layers under
 * 0164's floor (solve 0, shipped ladder 91), summed peak 2.51 (solve 2.53, shipped 2.15, ceiling
 * 2.17). It is the only candidate that gets the boundary direction right at a headroom cost the solve
 * is already paying — and it is half-fixed on audibility, which is a trade an ear has to make. The
 * desk plays all three for that reason.
 *
 * ⚠️ **THE LEVEL IS DELIBERATELY NOT RENORMALISED.** Holding each rung to the shipped ladder's summed
 * level puts the ducking back — 11 carried layers at `push`-based, because the per-rung scale factors
 * differ either side of a boundary. Additive is the property being bought here; loudness is what it
 * is bought with, and `summedPeak` is where that shows.
 */
export function rebasedLevel(theme, loops, profile = profileOfLoops(loops), rms = rmsOfLoops(loops), weight = HOLD_WEIGHT) {
  const solved = solveLevel(theme, loops, profile, rms, weight);
  const at = solved[REBASE_RUNG].gains;
  const shippedThere = shippedAt(theme, REBASE_RUNG);

  const scale = {};
  for (const l of MUSIC_LAYERS) {
    scale[l] = shippedThere[l] > 0 && at[l] > 0 ? at[l] / shippedThere[l] : 1;
  }

  const out = {};
  for (const rung of MUSIC_LEVELS) {
    const shipped = shippedAt(theme, rung);
    const gains = {};
    // ⚠️ The aura is never re-based, on `SOLVED_BY`'s own terms — its gain is a distance (0091).
    for (const l of MUSIC_LAYERS) gains[l] = SOLVED_BY(l) ? shipped[l] * scale[l] : shipped[l];
    out[rung] = { gains, shipped };
  }
  return out;
}
