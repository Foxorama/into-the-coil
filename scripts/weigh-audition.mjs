// What every audition button actually puts out — the gain it writes, and the loudness that gain
// produces over that layer's own material.
//
// Usage:  node scripts/weigh-audition.mjs [theme ...]
//
// ⚠️ IT EXISTS BECAUSE A REPORT ARRIVED THAT NO NUMBER IN THIS REPOSITORY COULD CHECK. Reported of
// the dashboard's layer buttons, 2026-08-13: *"is it on purpose that we've got such varied volume
// levels on the effects? Hook and Drive for example, hook I can barely hear and drive is quite loud
// and clear by comparison."*
//
// ⚠️ A GAIN IS NOT A LOUDNESS, AND THAT IS THE WHOLE FINDING. The faders across a place span about
// 7 dB; what comes out of them spans 38 dB and more. Every mix number in this project was set
// against a quantity nobody could see.
//
// ⚠️ THE ARITHMETIC IS `tests/pace.ts`'s AND IS NOT REPEATED HERE, on `scripts/weigh-rung.mjs`'s own
// terms — `tests/themes.test.ts` holds the floor under the same numbers, and a printed figure that
// disagrees with an asserted one is docs/decisions/0029-the-tracked-record-is-the-record.md happening
// in arithmetic. This file is the FORMATTING; the measurement is shared.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { AUDIBLE_FLOOR_DB, layerLevels } from '../tests/pace.ts';

const themes = process.argv.length > 2 ? process.argv.slice(2) : THEME_KINDS;
const db = (x) => (x <= 0 ? -Infinity : 20 * Math.log10(x));

for (const theme of themes) {
  const levels = layerLevels(theme, bakeLoops(SAMPLE_RATE, theme));
  const top = levels[0];
  console.log(`\n── ${theme} ─────────────────────────────────────────────────────────────`);
  console.log('layer          fader     heard rms      dB       heard peak       dB      verdict');
  for (const row of levels) {
    const under = db(row.rms / top.rms);
    const underPeak = db(row.peak / top.peak);
    /*
      ⚠️ **BOTH HAVE TO AGREE BEFORE A LAYER IS CALLED INAUDIBLE.** RMS counts the silence between
      notes, so a cymbal struck once a bar reads near zero while being perfectly audible when it
      lands; peak counts one sample, so a click reads like a pad. Either alone would condemn a
      healthy layer, which is the shape CLAUDE.md's *no counting guard* warns about.
    */
    const sunk = under < AUDIBLE_FLOOR_DB && underPeak < AUDIBLE_FLOOR_DB;
    console.log(
      `${row.layer.padEnd(12)} ${row.gain.toFixed(2).padStart(6)}  ${row.rms.toFixed(4).padStart(11)}  ` +
        `${under.toFixed(1).padStart(6)}  ${row.peak.toFixed(4).padStart(12)}  ${underPeak.toFixed(1).padStart(6)}  ` +
        `${sunk ? '  ⚠️ UNDER THE FLOOR' : ''}`,
    );
  }
  const sunk = levels.filter(
    (r) => db(r.rms / top.rms) < AUDIBLE_FLOOR_DB && db(r.peak / top.peak) < AUDIBLE_FLOOR_DB,
  );
  console.log(
    sunk.length === 0
      ? `every layer is within ${-AUDIBLE_FLOOR_DB} dB of the loudest on one measure or both.`
      : `⚠️ ${sunk.length} under the floor: ${sunk.map((r) => r.layer).join(', ')}`,
  );
}

console.log(
  `\nThe floor is ${AUDIBLE_FLOOR_DB} dB under the loudest layer of the same place, on BOTH rms and peak.`,
);
console.log('It is a hand\'s guess from the measured spread — docs/decisions/0140-no-layer-is-inaudible.md.');
