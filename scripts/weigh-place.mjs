// What a place costs, measured rather than argued about.
//
// Usage:  node scripts/weigh-place.mjs [theme]
//
// ⚠️ THE RULE THIS EXISTS FOR IS `tests/sound.test.ts`'s OWN, WRITTEN INTO ITS COMMENT:
// *"THE THIRD RAISE MUST NOT BE A NUMBER. Seven per-theme compositions are the next thing 0113 asks
// for, and holding all of them resident is a multiple of this that no ceiling should absorb — the
// answer there is baking the level's own set at the boundary."* A place that re-voices most of the
// composition is therefore a MEMORY decision before it is a musical one, and this prints the number
// that decides it instead of leaving it to arithmetic in a comment.
//
// It prints four things per re-voiced layer:
//
//   bake ms   what synthesising it costs, which is what a level boundary has to spend or spread
//   MB        what holding it costs, against the 56 MB ceiling the base composition already fills
//   low       the share of its energy under 130 Hz, against `LAYER_PAN` — the guard in
//             `tests/music.test.ts` runs over the BASE only, and a place can re-voice a layer into
//             a different band
//   note      its longest single note, which is the job the prewarm scheduler cannot split
//
// ⚠️ EVERY QUANTITY IS THE GAME'S OWN. `bakeLayer` is what `src/app/music.ts` bakes with and
// `bandEnergy` is what the guard measures with — `docs/decisions/0116-the-rig-plays-the-level.md` is
// the decision about instruments that restate a number instead of importing it.

import { performance } from 'node:perf_hooks';

import { SAMPLE_RATE } from '../src/app/sound.ts';
import { bakeLayer } from '../src/app/music.ts';
import { LAYER_PAN, MUSIC_LAYERS, secondsOfLayer } from '../src/content/music.ts';
import { THEME_KINDS, revoicedBy, voicesOf } from '../src/content/themes.ts';
import { bandEnergy, BANDS } from '../tests/spectrum.ts';

const wanted = process.argv[2];
const themes = wanted === undefined ? THEME_KINDS.filter((t) => revoicedBy(t).length > 0) : [wanted];

const SUB = BANDS.findIndex((b) => b[2] === 'sub');
const LOW = BANDS.findIndex((b) => b[2] === 'low');

/** What the whole base composition weighs, so a place is reported against something. */
const baseMb = MUSIC_LAYERS.reduce((sum, l) => sum + secondsOfLayer(l) * SAMPLE_RATE * 4, 0) / 1e6;
console.log(`the base composition: ${MUSIC_LAYERS.length} layers, ${baseMb.toFixed(1)} MB resident\n`);

for (const theme of themes) {
  const own = revoicedBy(theme);
  console.log(`── ${theme}: ${own.length} of ${MUSIC_LAYERS.length} layers re-voiced ─────────────`);
  console.log('layer       bake ms      MB    low%   pan   longest note');
  let ms = 0;
  let mb = 0;
  const offenders = [];
  for (const layer of own) {
    const at = performance.now();
    const buffer = bakeLayer(layer, SAMPLE_RATE, theme);
    const took = performance.now() - at;
    const size = (buffer.length * 4) / 1e6;
    const bands = bandEnergy(buffer, SAMPLE_RATE);
    const total = bands.reduce((a, b) => a + b, 0);
    const bottom = total > 0 ? (bands[SUB] + bands[LOW]) / total : 0;
    const longest = Math.max(...voicesOf(theme, layer).map((v) => v.note.seconds));
    ms += took;
    mb += size;
    if (bottom >= 0.4 && LAYER_PAN[layer] !== 0) offenders.push(`${layer} (${(bottom * 100).toFixed(0)}% low at pan ${LAYER_PAN[layer]})`);
    console.log(
      `${layer.padEnd(11)} ${took.toFixed(0).padStart(6)}  ${size.toFixed(2).padStart(6)}  ${(bottom * 100).toFixed(0).padStart(5)}  ${String(LAYER_PAN[layer]).padStart(5)}   ${longest.toFixed(2)}s`,
    );
  }
  console.log(`${'TOTAL'.padEnd(11)} ${ms.toFixed(0).padStart(6)}  ${mb.toFixed(2).padStart(6)}`);
  console.log(`  resident if this place is held ALONGSIDE the base: ${(baseMb + mb).toFixed(1)} MB`);
  console.log(`  resident if it REPLACES the layers it states:      ${baseMb.toFixed(1)} MB`);
  if (offenders.length > 0) console.log(`  ⚠️ low-heavy and placed off centre: ${offenders.join(', ')}`);
  console.log('');
}
