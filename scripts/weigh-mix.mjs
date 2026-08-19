// Every bound the mix has to satisfy, for every place, in one run.
//
// Usage:  node scripts/weigh-mix.mjs
//
// ⚠️ IT EXISTS BECAUSE `expect` STOPS AT THE FIRST FAILURE AND A MIX HAS SIX BOUNDS ON IT. Tuning
// docs/decisions/0147-a-place-is-a-balance.md's balances against `tests/themes.test.ts` meant a
// thirty-second run per single number, and each fix moved a bound the previous run had not reached
// yet — six rounds of whack-a-mole before this existed and none after it.
//
// ⚠️ TWO OF THE BOUNDS ARE THE GUARD'S AND ONE COLUMN IS A PROXY, AND THAT USED TO BE UNSAID.
// `low` and `whisper` are computed the way tests/themes.test.ts computes them, from tests/pace.ts;
// what this adds is that it prints ALL of them instead of throwing on the first. `HOT` is a raw-sum
// reading and is NOT the clip guard — the note on RAW_CEILING says why.
//
//   HOT       how close the raw summed peak sails to 1/MUSIC_GAIN. A ranking, never a verdict:
//             the guard drives real samples through the shaper WITH the browser's clamp and passes
//             rungs this reads over 100%.
//   low       the share of energy under 300 Hz, per rung, against 0147's floor as 0176 re-derived it.
//   whisper   no place's quietest third below -15 dB.
//
// ⚠️ THE ARC TABLE WAS HERE AND ITS GUARD WAS DELETED BY 0182 — see the note where it stood.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE, saturate } from '../src/app/sound.ts';
import { MUSIC_DRIVE, MUSIC_GAIN, MUSIC_LADDER, MUSIC_LAYERS, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS, mixOf, rungOf } from '../src/content/themes.ts';
import { profileOf, quietestThird, rungShape } from '../tests/pace.ts';

// ⚠️ 0.24 AND IT READ 0.28 UNTIL 0183 — 0176 re-derived the guard's floor against the mix that ships
// and this instrument kept the old one, so it reported eleven THIN rungs the suite is green over.
// That is docs/decisions/0116-the-rig-plays-the-level.md's own failure: an instrument describing a
// game nobody plays. Kept equal to tests/themes.test.ts's LOW_FLOOR by hand, and named here so the
// next person to move one knows there are two.
const LOW_FLOOR = 0.24;
// ⚠️ NOT A BOUND ANY MORE — docs/decisions/0183-a-cue-is-limited-rather-than-refused.md removed the
// ceiling from tests/themes.test.ts. It is kept here as a READING, because a place that is suddenly
// half low end is worth seeing on the way past even when nothing refuses it.
const LOW_WATCH = 0.55;
const WHISPER_DB = -15;
/**
 * ⚠️ A RAW-SUM PROXY, AND NOT WHAT tests/themes.test.ts MEASURES — say so rather than imply it.
 *
 * The guard drives the summed bus through the real shaper WITH the browser's [-1, 1] clamp (0176's
 * third break) and asks whether a SAMPLE passes full scale. This sums peak gains against a raw
 * ceiling, which is strictly more pessimistic: it reads CLIP on rungs the guard passes. Useful for
 * ranking how close a place is sailing; never a verdict.
 */
const RAW_CEILING = 1 / MUSIC_GAIN;

const bad = [];
const loops = new Map();
for (const theme of THEME_KINDS) loops.set(theme, bakeLoops(SAMPLE_RATE, theme));
const bakes = new Map();

console.log('place       rung        raw sum   of ceiling     under 300Hz');
for (const theme of THEME_KINDS) {
  const buffers = MUSIC_LAYERS.map((l) => loops.get(theme)[l]);
  const longest = Math.max(...buffers.map((b) => b.length));
  const rungs = MUSIC_LEVELS.map((level) => ({
    level,
    gains: MUSIC_LAYERS.map((l) => rungOf(theme, level, l) * mixOf(theme, l)),
    raw: 0,
  }));
  const now = new Float64Array(MUSIC_LAYERS.length);
  for (let i = 0; i < longest; i++) {
    for (let l = 0; l < buffers.length; l++) now[l] = buffers[l][i % buffers[l].length];
    for (const rung of rungs) {
      let sum = 0;
      for (let l = 0; l < now.length; l++) sum += now[l] * rung.gains[l];
      const size = sum < 0 ? -sum : sum;
      if (size > rung.raw) rung.raw = size;
    }
  }
  for (const rung of rungs) {
    const low = rungShape(theme, rung.level, loops.get(theme), bakes).low;
    const share = rung.raw / RAW_CEILING;
    const flags = [];
    if (share > 1) flags.push('HOT');
    if (low > 0 && low < LOW_FLOOR) { flags.push('THIN'); bad.push(`${theme}/${rung.level} is ${(low * 100).toFixed(1)}% low, under the ${LOW_FLOOR * 100}% floor`); }
    if (low > LOW_WATCH) flags.push('LOW-LED');
    console.log(
      `${theme.padEnd(11)} ${rung.level.padEnd(10)} ${rung.raw.toFixed(3).padStart(7)}   ${(share * 100).toFixed(1).padStart(7)}%   ${(low * 100).toFixed(1).padStart(9)}%  ${flags.join(' ')}`,
    );
  }
}

/*
  ── THE ARC TABLE IS GONE, BECAUSE ITS GUARD IS ──────────────────────────────────────────────────

  ⚠️ docs/decisions/0182-a-mix-number-has-no-band.md deleted `A WIDER BAND STILL CANNOT FLATTEN THE
  LADDER` and `the level climbs to its own top`. This printed the same sums with the same verdicts —
  push≤run, surge does not arrive, the fight does not arrive — so leaving it would be an instrument
  reporting failures nothing holds, which is the one thing a measuring script must never do.

  ⚠️ WHAT A BOUNDARY DOES IS `node scripts/weigh-build.mjs` now (0171), which has a time axis.
*/

/*
  ⚠️ THE `apart` BOUND IS GONE — docs/decisions/0155-a-place-follows-its-own-instrument.md. It
  required no two places within 3 dB of each other's BALANCE; the seven shipped at 3.3-4.0 dB apart,
  satisfying it at every rung, and the report never changed: "every level sounds the same and that's
  what I've been trying to fix." What replaces it is in tests/arrangement.test.ts — no two places
  FOLLOW the same instrument at every rung — together with 0148's guard over their notes.

  ⚠️ THE QUIETEST THIRD STAYS, and the difference is worth naming: it asks whether a place keeps its
  OWN character, which is a question about one place. `apart` asked whether two places differ on an
  axis that 0154 now specifies rather than lets emerge.
*/
const profiles = new Map(THEME_KINDS.map((t) => [t, profileOf(t, loops.get(t))]));
console.log('\nplace       quietest third');
for (const theme of THEME_KINDS) {
  const third = quietestThird(profiles.get(theme));
  const flags = [];
  if (third < WHISPER_DB) { flags.push('WHISPER'); bad.push(`${theme} keeps its character at ${third.toFixed(1)} dB`); }
  console.log(`${theme.padEnd(11)} ${third.toFixed(1).padStart(9)} dB   ${flags.join(' ')}`);
}

console.log(bad.length === 0 ? '\n✓ every bound is satisfied' : `\n✗ ${bad.length} to fix:\n  ${bad.join('\n  ')}`);
