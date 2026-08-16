// The solve itself — the one description, because two scripts and a guard all ask for it.
//
// docs/decisions/0154-the-mix-is-authored-as-intent.md. `scripts/weigh-solve.mjs` prints it,
// `scripts/hear-solved.mjs` renders it, and a copy in either would be
// docs/decisions/0029-the-tracked-record-is-the-record.md happening in arithmetic — the exact defect
// scripts/weigh-audition.mjs names about `tests/pace.ts`.

import { panGains } from '../src/app/music.ts';
import { AURA_LEVEL_CEILING, LAYER_PAN, MUSIC_LADDER, MUSIC_LAYERS } from '../src/content/music.ts';
import { mixOf } from '../src/content/themes.ts';
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
  for (const l of MUSIC_LAYERS) out[l] = MUSIC_LADDER[rung][l] * mixOf(theme, l) * (SOLVED_BY(l) ? 1 : nearness);
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
export function solveMix(theme, rung, loops, profile = profileOfLoops(loops), rms = rmsOfLoops(loops)) {
  const shipped = shippedAt(theme, rung);
  const gains = {};
  for (const l of MUSIC_LAYERS) gains[l] = shipped[l] > 0 ? (SOLVED_BY(l) ? 1 : shipped[l]) : 0;

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
      const err = ROLE_MARGIN_DB[role] - m[l];
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
