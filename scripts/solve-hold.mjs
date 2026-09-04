// The hold: what scale brings each rung of each place back to its `run` loudness.
//
// docs/decisions/0226-the-level-holds-one-loudness.md.
//
// Usage:  node scripts/solve-hold.mjs [theme ...] [--rate=22050] [--within=0.02]
//
// Prints `LEVEL_HOLD` as it should read in src/content/themes.ts, on the terms REBASE was produced
// by scripts/solve-mix.mjs (0176): the solver is a research tool and not a dependency, the table is
// content, and nothing under src/ runs this.
//
// ⚠️ WHAT IS HELD EQUAL IS `loud` — K-weighted loudness AFTER the compressor and the shaper — and not
// a gain, a sum of gains, or an unweighted RMS. tests/clean.ts's `driveGains` is the one description
// of that chain; this bisects on its `trim` argument with the BARE ladder (`gainsAt(…, held = false)`)
// so the answer is the hold itself rather than the hold over the hold. A guard in tests/themes.test.ts
// reads the same function with the hold ON and asks that every rung sit within HOLD_BAND_DB of `run`.
//
// ⚠️ BISECTION AND NOT A RATIO, because the compressor is in the loop: scaling the input by x does
// not scale the output by x above the threshold, so the closed form is wrong by up to half the move.
import { MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { driveGains, gainsAt } from '../tests/clean.ts';

const args = process.argv.slice(2);
const rate = Number(args.find((a) => a.startsWith('--rate='))?.slice(7) ?? 22050);
const within = Number(args.find((a) => a.startsWith('--within='))?.slice(9) ?? 0.02);
const themes = args.filter((a) => !a.startsWith('--'));
const places = themes.length > 0 ? themes : THEME_KINDS;
const rungs = MUSIC_LEVELS.filter((r) => r !== 'calm' && r !== 'run');

const loudAt = (theme, rung, trim) => driveGains(theme, rung, gainsAt(theme, rung, trim, false), rate).loud;

console.log(`\nsolving the hold at ${rate} Hz, to ${within} LU\n`);
console.log('export const LEVEL_HOLD: Record<ThemeKind, Partial<Record<MusicLevel, number>>> = {');
for (const theme of places) {
  const target = loudAt(theme, 'run', 1);
  const row = [];
  const said = [];
  for (const rung of rungs) {
    // Loudness rises with trim, so bisect the bracket that holds the target.
    let lo = 0.05;
    let hi = 4;
    let loud = loudAt(theme, rung, 1);
    let trim = 1;
    if (Math.abs(loud - target) > within) {
      for (let i = 0; i < 40; i++) {
        trim = Math.sqrt(lo * hi);
        loud = loudAt(theme, rung, trim);
        if (Math.abs(loud - target) <= within) break;
        if (loud > target) hi = trim;
        else lo = trim;
      }
    }
    row.push(`${rung}: ${trim.toFixed(4)}`);
    said.push(`${rung} ${(20 * Math.log10(trim)).toFixed(2)} dB → ${loud.toFixed(2)} LUFS`);
  }
  console.log(`  ${theme}: { ${row.join(', ')} },`);
  console.error(`  ${theme}: run ${target.toFixed(2)} LUFS; ${said.join('; ')}`);
}
console.log('};');
