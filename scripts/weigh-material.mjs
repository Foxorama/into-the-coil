// What LOUDER MATERIAL would buy the solve — and the answer is nothing.
//
// Usage:  node scripts/weigh-material.mjs [dB]
//
// ⚠️ IT EXISTS BECAUSE docs/decisions/0167-a-build-does-not-duck.md ASSERTED THE ANSWER BEFORE
// CHECKING IT. Three fixes for the boundary ducking are measured and refused there; the fourth — the
// arrivals need gains past MIX_CEILING (retired by 0182) because their material is quiet, so make the material louder —
// was written down as "probably the real one" on the strength of it being obvious. It is not the real
// one, and this is what says so.
//
// ⚠️ MATERIAL LOUDNESS CANCELS OUT OF A BALANCE. `solveMix` targets margins and renormalises to hold
// the rung's summed level, so a louder layer needs less gain and contributes exactly the same amount.
// Lifting the seven loudest-gain layers by 6 dB moves the ducking from 56 to 52 and makes the ceiling
// violations slightly WORSE, because the renormalise lifts everything else into the level the louder
// layers no longer need.
//
// ⚠️ IT IS SIMULATED RATHER THAN BAKED, and that is honest rather than a shortcut: scaling a layer's
// PROFILE and RMS is exactly what a louder bake does to the only two quantities the solve reads. What
// it cannot see is a change of TIMBRE, which is a different proposal from a change of level.
import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_GAIN, MUSIC_LAYERS, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';

// ⚠️ THE WALL THAT WAS — docs/decisions/0182-a-mix-number-has-no-band.md deleted the constant. This
// script's whole subject is what a solve wanted and could not say, so the old ceiling is its unit.
const MIX_CEILING = 2.6;
import { ROLE_MARGIN_DB, SOLVED_BY, roleOf } from '../src/content/arrangement.ts';
import { ROLE_FLOOR_DB, DUCK_FLOOR_DB } from '../tests/pace.ts';
import { HOLD_WEIGHT, marginsOf, profileOfLoops, rmsOfLoops, solveLevel } from './solve-mix.mjs';

const RUNGS = MUSIC_LEVELS.filter((r) => r !== 'calm');
const IN_LEVEL = [['run','push'],['push','surge'],['surge','approach']];
const db = (x) => 20 * Math.log10(x);
const rawSum = (g) => MUSIC_LAYERS.reduce((s,l)=> s + (g[l] > 0 ? g[l] : 0), 0);

const LIFT_DB = Number(process.argv[2] ?? 6);
const lift = Math.pow(10, LIFT_DB / 20);

// Which layers the solve currently has to shout with: mean solved gain over the rungs that open them.
const cache = {};
for (const theme of THEME_KINDS) {
  const loops = bakeLoops(SAMPLE_RATE, theme);
  cache[theme] = { loops, profile: profileOfLoops(loops), rms: rmsOfLoops(loops) };
}

const need = new Map();
for (const theme of THEME_KINDS) {
  const { loops, profile, rms } = cache[theme];
  const lvl = solveLevel(theme, loops, profile, rms, HOLD_WEIGHT);
  for (const rung of RUNGS) {
    for (const l of MUSIC_LAYERS) {
      if (!SOLVED_BY(l) || !(lvl[rung].gains[l] > 0)) continue;
      const e = need.get(l) ?? { sum: 0, n: 0, max: 0 };
      e.sum += lvl[rung].gains[l]; e.n++; e.max = Math.max(e.max, lvl[rung].gains[l]);
      need.set(l, e);
    }
  }
}
const ranked = [...need.entries()].map(([l,e])=>({l, mean: e.sum/e.n, max: e.max})).sort((a,b)=>b.mean-a.mean);
console.log(`what the solve has to shout with (mean solved gain; MIX_CEILING is ${MIX_CEILING}):`);
for (const r of ranked.slice(0,8)) console.log(`  ${r.l.padEnd(10)} mean ${r.mean.toFixed(2)}  peak ${r.max.toFixed(2)}${r.max>MIX_CEILING?'  ⚠️ past the ceiling':''}`);

const LOUD = ranked.filter((r)=>r.mean > 1.5).map((r)=>r.l);
console.log(`\nlifting the material of ${LOUD.length} layers by ${LIFT_DB} dB: ${LOUD.join(', ')}\n`);

function score(scaleLoud) {
  let ducked = 0, adrift = 0, worstRaw = 0, worstDuck = 0, overCeiling = 0;
  for (const theme of THEME_KINDS) {
    const { loops } = cache[theme];
    const profile = {}; const rms = {};
    for (const l of MUSIC_LAYERS) {
      const k = scaleLoud && LOUD.includes(l) ? lift : 1;
      profile[l] = cache[theme].profile[l].map((v)=>v*k);
      rms[l] = cache[theme].rms[l] * k;
    }
    const lvl = solveLevel(theme, loops, profile, rms, HOLD_WEIGHT);
    for (const [from,to] of IN_LEVEL) {
      for (const l of MUSIC_LAYERS) {
        if (!SOLVED_BY(l)) continue;
        const a = lvl[from].gains[l], b = lvl[to].gains[l];
        if (a > 0 && b > 0) { const m = db(b/a); if (m <= DUCK_FLOOR_DB) { ducked++; worstDuck = Math.min(worstDuck, m); } }
      }
    }
    for (const rung of RUNGS) {
      const g = lvl[rung].gains;
      worstRaw = Math.max(worstRaw, rawSum(g));
      const m = marginsOf(profile, g);
      for (const l of MUSIC_LAYERS) {
        if (!SOLVED_BY(l) || !(g[l] > 0)) continue;
        if (g[l] > MIX_CEILING) overCeiling++;
        const role = roleOf(theme, rung, l);
        if (role === null) continue;
        if (m[l] - ROLE_MARGIN_DB[role] < ROLE_FLOOR_DB) adrift++;
      }
    }
  }
  return { ducked, worstDuck, adrift, worstRaw, overCeiling };
}

const before = score(false);
const after = score(true);
console.log('                    ducked  worst   adrift  past MIX_CEILING  worst raw sum');
const row = (n,s)=>console.log(`${n.padEnd(19)} ${String(s.ducked).padStart(4)}  ${s.worstDuck.toFixed(1).padStart(6)}  ${String(s.adrift).padStart(6)}  ${String(s.overCeiling).padStart(15)}  ${s.worstRaw.toFixed(2).padStart(12)}`);
row('as it is', before);
row(`material +${LIFT_DB} dB`, after);
