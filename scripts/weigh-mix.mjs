// Every bound the mix has to satisfy, for every place, in one run.
//
// Usage:  node scripts/weigh-mix.mjs
//
// ⚠️ IT EXISTS BECAUSE `expect` STOPS AT THE FIRST FAILURE AND A MIX HAS SIX BOUNDS ON IT. Tuning
// docs/decisions/0147-a-place-is-a-balance.md's balances against `tests/themes.test.ts` meant a
// thirty-second run per single number, and each fix moved a bound the previous run had not reached
// yet — six rounds of whack-a-mole before this existed and none after it.
//
// ⚠️ THE ARITHMETIC IS THE GUARD'S, NOT A SECOND OPINION. Every bound below is computed the way
// tests/themes.test.ts computes it, from tests/pace.ts and the game's own `saturate`; what this adds
// is that it prints ALL of them instead of throwing on the first.
//
//   clip      the summed bus through the shaper, per rung. The ceiling is a raw sum of 1/MUSIC_GAIN.
//   low       the share of energy under 300 Hz, per rung, against the band 0147 replaced 0134's
//             ratio-to-the-base with.
//   arc       run < push < surge, and boss > approach. The approach is NOT asserted to sum below
//             the surge — tests/themes.test.ts has why that looked like 0136s drop and is not it.

//   whisper   no place's quietest third below -15 dB.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE, saturate } from '../src/app/sound.ts';
import { MUSIC_DRIVE, MUSIC_GAIN, MUSIC_LADDER, MUSIC_LAYERS, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS, mixOf } from '../src/content/themes.ts';
import { profileOf, quietestThird, rungShape } from '../tests/pace.ts';

const LOW_FLOOR = 0.28;
const LOW_CEILING = 0.55;
const WHISPER_DB = -15;
/** `saturate(x, a) <= 1` exactly when `x <= 1`, so the whole clipping question is this number. */
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
    gains: MUSIC_LAYERS.map((l) => MUSIC_LADDER[level][l] * mixOf(theme, l)),
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
    if (share > 1) { flags.push('CLIP'); bad.push(`${theme}/${rung.level} clips at ${(share * 100).toFixed(1)}% of the ceiling`); }
    if (low > 0 && low < LOW_FLOOR) { flags.push('THIN'); bad.push(`${theme}/${rung.level} is ${(low * 100).toFixed(1)}% low, under the ${LOW_FLOOR * 100}% floor`); }
    if (low > LOW_CEILING) { flags.push('MUDDY'); bad.push(`${theme}/${rung.level} is ${(low * 100).toFixed(1)}% low, over the ${LOW_CEILING * 100}% ceiling`); }
    console.log(
      `${theme.padEnd(11)} ${rung.level.padEnd(10)} ${rung.raw.toFixed(3).padStart(7)}   ${(share * 100).toFixed(1).padStart(7)}%   ${(low * 100).toFixed(1).padStart(9)}%  ${flags.join(' ')}`,
    );
  }
}

console.log('\nplace        run    push   surge  approa    boss   arc');
for (const theme of THEME_KINDS) {
  const at = (rung) => MUSIC_LAYERS.reduce((sum, l) => sum + MUSIC_LADDER[rung][l] * mixOf(theme, l), 0);
  const [run, push, surge, approach, boss] = ['run', 'push', 'surge', 'approach', 'boss'].map(at);
  void surge;
  const flags = [];
  if (!(push > run)) { flags.push('push≤run'); bad.push(`${theme}: push does not arrive`); }
  if (!(surge > push)) { flags.push('surge≤push'); bad.push(`${theme}: surge does not arrive`); }
  if (!(boss > approach)) { flags.push('boss≤approach'); bad.push(`${theme}: the fight does not arrive`); }
  console.log(
    `${theme.padEnd(11)} ${[run, push, surge, approach, boss].map((v) => v.toFixed(2).padStart(6)).join(' ')}   ${flags.join(' ') || 'ok'}`,
  );
}

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
