// What continuity costs — the boundary lurch against the audibility it is paid for with.
//
// Usage:  node scripts/weigh-trajectory.mjs [theme ...] [--weights=0,0.4,0.65]
//
// ⚠️ IT EXISTS BECAUSE reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md SAYS IT IS OWED:
// "Holding gain continuous means margin drifts off target, and by how much is exactly the number that
// decides whether this is the right trade — the current solve reaches every role target to within
// 0.00 dB, which is the claim being spent. THAT MEASUREMENT IS OWED BEFORE THE CHANGE IS JUDGED, NOT
// AFTER."
//
// ⚠️ AND IT IS THE INSTRUMENT THAT FOUND THAT REPORT'S OWN PROPOSAL WANTING. It specified continuity
// for layers whose ROLE HAS NOT CHANGED, on the measurement that 46 of 57 lurches were role-unchanged.
// Run it: that halves the count and leaves the worst move at 17-18 dB at every weight, because a role
// change is a 5 dB change of target producing an 18 dB change of gain.
//
// ⚠️ THE ARITHMETIC IS `scripts/solve-mix.mjs`'s AND `tests/pace.ts`'s, on scripts/weigh-audition.mjs's
// own terms — this file is the FORMATTING.
//
// WHAT IT PRINTS
//
//   worst lurch  the largest single-layer gain change at an IN-LEVEL boundary, in dB, counting only
//                layers open on both sides. `approach -> boss` is excluded: that one is the boss
//                arriving and is supposed to move.
//   moves >=6dB  how many such changes there are.
//   mean drift   how far the solved margins land from ROLE_MARGIN_DB. THIS IS THE COST — the
//                independent solve's claim was every target reached to 0.00 dB.
//   adrift       how many place/rung/layer triples 0164's floor would still flag. The shipped ladder
//                scores 91, and that is the audibility the whole exercise is for.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_LAYERS, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { ROLE_MARGIN_DB, SOLVED_BY, roleOf } from '../src/content/arrangement.ts';
import { ROLE_FLOOR_DB } from '../tests/pace.ts';
import { HOLD_WEIGHT, marginsOf, profileOfLoops, rmsOfLoops, shippedAt, solveLevel } from './solve-mix.mjs';

const args = process.argv.slice(2);
const named = args.filter((a) => !a.startsWith('--'));
const themes = named.length > 0 ? named : THEME_KINDS;
const WEIGHTS = (args.find((a) => a.startsWith('--weights='))?.slice(10) ?? '0,0.4,0.5,0.65,0.8')
  .split(',')
  .map(Number);

/** The boundaries a listener crosses INSIDE one level. The boss arriving is not one of them. */
const IN_LEVEL = [
  ['run', 'push'],
  ['push', 'surge'],
  ['surge', 'approach'],
];
const db = (x) => 20 * Math.log10(x);

function score(theme, byRung, profile) {
  let worstLurch = 0;
  let big = 0;
  let drift = 0;
  let n = 0;
  let adrift = 0;
  for (const [from, to] of IN_LEVEL) {
    for (const l of MUSIC_LAYERS) {
      if (!SOLVED_BY(l)) continue;
      const a = byRung[from][l];
      const b = byRung[to][l];
      if (!(a > 0) || !(b > 0)) continue;
      const move = Math.abs(db(b / a));
      if (move > worstLurch) worstLurch = move;
      if (move >= 6) big++;
    }
  }
  for (const rung of MUSIC_LEVELS) {
    if (rung === 'calm') continue;
    const m = marginsOf(profile, byRung[rung]);
    for (const l of MUSIC_LAYERS) {
      if (!(byRung[rung][l] > 0) || !SOLVED_BY(l)) continue;
      const role = roleOf(theme, rung, l);
      if (role === null) continue;
      const off = m[l] - ROLE_MARGIN_DB[role];
      drift += Math.abs(off);
      n++;
      if (off < ROLE_FLOOR_DB) adrift++;
    }
  }
  return { worstLurch, big, drift: drift / n, adrift };
}

const totals = new Map();
const add = (name, s) => {
  const t = totals.get(name) ?? { lurch: 0, big: 0, drift: 0, adrift: 0, n: 0 };
  t.lurch = Math.max(t.lurch, s.worstLurch);
  t.big += s.big;
  t.drift += s.drift;
  t.adrift += s.adrift;
  t.n++;
  totals.set(name, t);
};

const HEAD = '                     worst lurch   moves>=6dB   mean drift   adrift';
const line = (name, s) =>
  `${name.padEnd(20)} ${s.worstLurch.toFixed(1).padStart(9)} dB ${String(s.big).padStart(12)} ` +
  `${s.drift.toFixed(2).padStart(12)} ${String(s.adrift).padStart(8)}`;

for (const theme of themes) {
  const loops = bakeLoops(SAMPLE_RATE, theme);
  const profile = profileOfLoops(loops);
  const rms = rmsOfLoops(loops);

  const shipped = {};
  for (const rung of MUSIC_LEVELS) shipped[rung] = shippedAt(theme, rung);

  const rows = [['shipped ladder', score(theme, shipped, profile)]];
  for (const w of WEIGHTS) {
    const level = solveLevel(theme, loops, profile, rms, w);
    const byRung = {};
    for (const rung of MUSIC_LEVELS) byRung[rung] = level[rung].gains;
    const name = w === 0 ? 'solve, per rung' : `trajectory w=${w.toFixed(2)}`;
    rows.push([w === HOLD_WEIGHT ? `${name}  ←` : name, score(theme, byRung, profile)]);
  }

  console.log(`\n══ ${theme} ${'═'.repeat(Math.max(0, 56 - theme.length))}`);
  console.log(HEAD);
  for (const [name, s] of rows) {
    console.log(line(name, s));
    add(name, s);
  }
}

console.log(`\n══ all ${themes.length} place(s) ${'═'.repeat(44)}`);
console.log(HEAD);
for (const [name, t] of totals) {
  console.log(line(name, { worstLurch: t.lurch, big: t.big, drift: t.drift / t.n, adrift: t.adrift }));
}
console.log(
  `\n← is the shipped default, ${HOLD_WEIGHT.toFixed(2)} — the largest weight at which NOTHING goes\n` +
    `adrift. Past it the trade is real and there is no knee, which is why the dashboard has a slider.`,
);
