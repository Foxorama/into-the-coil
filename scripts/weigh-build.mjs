// What a section change actually does over time — every arrival at every boundary, in seconds.
//
// Usage:  node scripts/weigh-build.mjs [theme ...]
//
// ⚠️ IT EXISTS BECAUSE EVERY OTHER MEASUREMENT IN THIS REPOSITORY IS OF A MOMENT. `weigh-boundary`
// takes the mix on each SIDE of a rung change and subtracts them; `weigh-adrift` and `weigh-heard`
// ask what a rung sounds like once it has settled. All three are green on a boundary that delivers
// four new layers at one instant, because none of them has a time axis in it — and *"it just jumps"*
// is a complaint about the time axis and about nothing else.
//
// ⚠️ THE ARITHMETIC IS `levelWrites`' AND IS NOT REPEATED HERE, on scripts/weigh-audition.mjs's own
// terms: a printed figure that disagrees with an asserted one is
// docs/decisions/0029-the-tracked-record-is-the-record.md happening in arithmetic. `buildsOf` in
// tests/pace.ts walks the rungs; this file is the formatting, and `tests/music.test.ts` asserts over
// the same call.
//
// WHAT IT PRINTS
//
//   the arrivals at each boundary, grouped by the second they land on, with the role each one holds
//   at the rung it is arriving into. `spread` is first arrival to last, which is the length of the
//   build a listener hears.
//
// ⚠️ THE ORDER IS PER-PLACE AND THAT IS THE HALF WORTH READING. `roleOf` reads `LEADS` and
// `PROMOTES`, so what lands LAST at a boundary is what that place asks you to follow there — the
// choir in Ember Nebula, the kit in Saurian Reach, the riff in The Black Heart. Two places whose
// arrivals land in a different order are two places whose section changes are different events,
// which is what docs/decisions/0155-a-place-follows-its-own-instrument.md put the differentiation in.

import { THEME_KINDS } from '../src/content/themes.ts';
import { buildsOf } from '../tests/pace.ts';

const wanted = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const themes = wanted.length > 0 ? wanted : THEME_KINDS;

for (const theme of themes) {
  if (!THEME_KINDS.includes(theme)) {
    console.error(`no such place: ${theme} — one of ${THEME_KINDS.join(', ')}`);
    process.exit(2);
  }
}

let steps = 0;
for (const theme of themes) {
  console.log(`\n══ ${theme} ${'═'.repeat(Math.max(0, 58 - theme.length))}`);
  for (const build of buildsOf(theme)) {
    const at = new Map();
    for (const arrival of build.arrivals) {
      const key = arrival.second.toFixed(2);
      if (!at.has(key)) at.set(key, []);
      at.get(key).push(`${arrival.layer}${arrival.role === null ? '' : ` (${arrival.role})`}`);
    }
    const line = [...at.entries()].map(([second, layers]) => `${second}s  ${layers.join(' + ')}`).join('   →   ');
    const flat = build.arrivals.length > 1 && build.spread === 0;
    if (flat) steps++;
    console.log(
      `  ${`${build.from} → ${build.to}`.padEnd(20)} spread ${build.spread.toFixed(2)}s${flat ? ' ⚠️ STEP' : ''}`,
    );
    console.log(`  ${' '.repeat(20)} ${line || '(nothing opens)'}`);
  }
}

console.log(
  `\n${steps === 0 ? 'every boundary that opens two or more layers is a build' : `⚠️ ${steps} boundaries deliver every arrival at one instant`}`,
);
console.log('A `spread` of zero with two or more arrivals is the defect 0171 exists for: four layers');
console.log('on one downbeat is one event, however long each of their ramps is.');
