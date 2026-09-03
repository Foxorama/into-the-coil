// How hard each place drives the music bus, and how dirty the bus gets doing it.
//
// Usage:  node scripts/weigh-clean.mjs [theme ...] [--rate=44100]
//
// ⚠️ IT EXISTS BECAUSE A REPORT NAMED TWO PLACES AND NOTHING HERE COULD TELL THEM APART. Reported
// 2026-09-03: "the approach compared to ember nebula sounds distorted a bit and some of the boss
// music has similar distortion, it just doesn't sound crystal clear and clean."
//
// ⚠️ AND BECAUSE THE GUARD THAT SHOULD HAVE CAUGHT IT HAS NEVER HEARD A PLACE. tests/music.test.ts's
// "no rung clips" bakes loopsAt(SAMPLE_RATE) with NO THEME and scales by MUSIC_LADDER directly — no
// mixOf, no place ladder, no place material. It measures the base composition, which nothing has
// played since docs/decisions/0132-a-place-may-be-another-piece-entirely.md.
//
//   peak   the loudest sample REACHING the shaper, as a share of full scale
//   out    the loudest sample LEAVING it — saturate normalises at unity and does not limit above it
//   dirty  the part of the output no single gain explains, in dB below the output
//
// ⚠️ SATURATION IS NOT A FAULT. 0104 puts a tanh on the music bus on purpose. What this reports is
// how much, and whether places differ — which is the comparison the report is made of.

import { driveAt, DIRTY_CEILING_DB } from '../tests/clean.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_DRIVE, MUSIC_GAIN, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEMES, THEME_KINDS } from '../src/content/themes.ts';

const args = process.argv.slice(2);
const rate = Number(args.find((a) => a.startsWith('--rate='))?.slice(7) ?? SAMPLE_RATE);
const named = args.filter((a) => !a.startsWith('--'));
const wanted = named.length > 0 ? named : THEME_KINDS;

// What tanh(x·k)/tanh(k) tops out at — the shaper's own ceiling, which is above full scale.
const k = 1 + MUSIC_DRIVE * 6;
console.log(
  `bus: MUSIC_GAIN ${MUSIC_GAIN}, MUSIC_DRIVE ${MUSIC_DRIVE}. ` +
    `saturate maps 1 to 1 and tops out at ${(1 / Math.tanh(k)).toFixed(2)} — it is a colour, not a limiter.\n`,
);

/*
  ⚠️ **`--fix` TRIES THE TWO KNOBS BEFORE EITHER IS TURNED.** The bus has exactly two: how loud a
  place arrives (`trim`) and how hard the shaper is worked (`MUSIC_DRIVE`). They sound different —
  one takes the level down, the other takes the colour out — and the report does not say which it
  wants, so this prints both against the rungs that were named.
*/
if (args.includes('--fix')) {
  const cases = [
    ['nebula', 'boss'],
    ['approach', 'boss'],
    ['approach', 'push'],
    ['nebula', 'push'],
    ['saurian', 'surge'],
    ['core', 'surge'],
    ['labyrinth', 'run'],
  ];
  console.log('  place/rung          now      trim to 0.9    drive 0.15    drive 0 (no shaper)');
  for (const [theme, rung] of cases) {
    const now = driveAt(theme, rung, rate);
    // The trim that would bring this rung's peak to 0.9 of full scale.
    const trim = Math.min(1, 0.9 / now.peak);
    const trimmed = driveAt(theme, rung, rate, trim);
    const softer = driveAt(theme, rung, rate, 1, 0.15);
    const linear = driveAt(theme, rung, rate, 1, 0);
    const fmt = (x) => x.distortion.toFixed(1).padStart(6);
    console.log(
      `  ${(theme + '/' + rung).padEnd(18)} ${fmt(now)}   ${fmt(trimmed)} (×${trim.toFixed(2)})   ` +
        `${fmt(softer)}        ${fmt(linear)}`,
    );
  }
  process.exit(0);
}

const rows = [];
for (const theme of wanted) {
  console.log(`══ ${THEMES[theme].title} (${theme}) ═══════════════════════════════`);
  console.log('  rung        peak in   peak out    dirty');
  for (const rung of MUSIC_LEVELS) {
    const at = driveAt(theme, rung, rate);
    rows.push(at);
    console.log(
      `  ${rung.padEnd(10)} ${at.peak.toFixed(3).padStart(7)}  ${at.out.toFixed(3).padStart(9)}  ` +
        `${at.distortion.toFixed(1).padStart(7)} dB` +
        (at.out > 1 ? '   ⚠️ over full scale' : '') +
        (at.distortion > DIRTY_CEILING_DB ? '   ⚠️ dirty' : ''),
    );
  }
  console.log('');
}

/*
  ⚠️ **THE SPREAD IS THE REPORT.** One place was named as fine and one as distorted, so what has to
  show up here is a difference between them — an absolute number on its own would not have been
  actionable, and would not have told anybody which places to fix.
*/
const worst = rows.reduce((a, b) => (b.distortion > a.distortion ? b : a), rows[0]);
const best = rows.reduce((a, b) => (b.distortion < a.distortion ? b : a), rows[0]);
console.log(
  `dirtiest: ${worst.theme} ${worst.rung} at ${worst.distortion.toFixed(1)} dB; ` +
    `cleanest: ${best.theme} ${best.rung} at ${best.distortion.toFixed(1)} dB. ` +
    `Spread ${(worst.distortion - best.distortion).toFixed(1)} dB.`,
);
const over = rows.filter((r) => r.out > 1);
console.log(
  over.length === 0
    ? 'Nothing leaves the bus past full scale.'
    : `⚠️ ${over.length} rung(s) leave the bus PAST FULL SCALE: ${over.map((r) => `${r.theme}/${r.rung} at ${r.out.toFixed(2)}`).join(', ')}`,
);
