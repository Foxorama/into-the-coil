// What a place sounds like at each rung, as the two numbers a listener's words map onto.
//
// Usage:  node scripts/weigh-rung.mjs [theme ...]
//
// ⚠️ IT EXISTS BECAUSE A REPORT ARRIVED IN WORDS NOTHING HERE COULD CHECK. Reported of Ember Nebula,
// 2026-08-12: *"it doesn't fit the high paced gameplay… it's very high on the treble with no deep
// bassy times… the surge from level one should be the default music 'speed' for the next levels at
// the start."* Three claims, and every one of them is a quantity:
//
//   pace     NOTES A BAR that sound at this rung — 0102's own definition of the thing that rises
//            when a listener says *faster*, since the tempo cannot (0093).
//   balance  the share of A-weighted energy under 300 Hz against the share over 2 kHz, summed over
//            the layers the rung opens at the gains it opens them at.
//
// ⚠️ THE ARITHMETIC IS `tests/pace.ts`'s AND IS NOT REPEATED HERE, because `tests/themes.test.ts`
// holds a floor under the same two numbers — and a printed figure that disagrees with an asserted one
// is docs/decisions/0029-the-tracked-record-is-the-record.md happening in arithmetic. This file is
// the FORMATTING; the measurement is shared.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { BAR_SECONDS, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { rungShape } from '../tests/pace.ts';

const themes = process.argv.length > 2 ? process.argv.slice(2) : THEME_KINDS;
const bakes = new Map();

/** The base composition, printed first so every place below is read against something. */
const baseLoops = bakeLoops(SAMPLE_RATE);
const base = {};
for (const rung of MUSIC_LEVELS) base[rung] = rungShape(undefined, rung, baseLoops, bakes);

const line = (rung, shape, against) =>
  `${rung.padEnd(10)} ${shape.notes.toFixed(0).padStart(9)}${against ? ` (${((shape.notes / against.notes) * 100).toFixed(0)}%)`.padStart(7) : '       '}   ` +
  `${(shape.low * 100).toFixed(1).padStart(8)}%${against ? ` (${((shape.low / against.low) * 100).toFixed(0)}%)`.padStart(7) : '       '}   ` +
  `${(shape.high * 100).toFixed(1).padStart(7)}%`;

console.log('── the base composition, which is what level one plays ──────────────');
console.log('rung        notes/bar          under 300Hz          over 2kHz');
for (const rung of MUSIC_LEVELS) console.log(line(rung, base[rung]));
console.log('');

for (const theme of themes) {
  const loops = bakeLoops(SAMPLE_RATE, theme);
  console.log(`── ${theme}, and the percentages are against the base at the same rung ──`);
  console.log('rung        notes/bar          under 300Hz          over 2kHz');
  for (const rung of MUSIC_LEVELS) console.log(line(rung, rungShape(theme, rung, loops, bakes), base[rung]));
  console.log('');
}

console.log(`a bar is ${BAR_SECONDS}s, so notes/bar × ${(60 / BAR_SECONDS).toFixed(0)} is notes a minute.`);
console.log('tests/themes.test.ts refuses either percentage below 85.');
