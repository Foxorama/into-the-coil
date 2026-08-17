// Every layer the arrangement gives a role to, against the role it was given.
//
// Usage:  node scripts/weigh-adrift.mjs [theme ...] [--rung=push] [--all]
//
// ⚠️ IT EXISTS BECAUSE THE AUDIT HAD TO BE READ BY A PERSON. Reported 2026-08-18: *"it's probably
// not going to be just the groove and not just on that level, but a whole bunch of sounds and a whole
// bunch of levels, so if we can identify them all and fix them all, that'd be a lot better than me
// having to listen to each individual segment and then listen to each individual item in each
// segment to identify what's not audible."*
//
// ⚠️ `weigh-heard` ALREADY PRINTS THE MEASUREMENT AND CANNOT PRINT A VERDICT. Its own footer says
// `margin` *"carries no threshold and is a RANKING"* — docs/decisions/0152-a-layer-is-heard-in-the-sum.md
// refused one because `drone` is MEANT to be inaudible and a floor would flag it every time. What is
// new is not a measurement: it is that
// docs/decisions/0154-the-mix-is-authored-as-intent.md states what each layer's margin is SUPPOSED
// to be, so the same number can now be right or wrong instead of merely large or small.
//
// ⚠️ THE ARITHMETIC IS `tests/pace.ts`'s AND IS NOT REPEATED HERE, on scripts/weigh-audition.mjs's
// own terms — `tests/themes.test.ts` asserts over `adriftAt` and `ROLE_FLOOR_DB`, and a printed
// figure that disagrees with an asserted one is
// docs/decisions/0029-the-tracked-record-is-the-record.md happening in arithmetic. This file is the
// FORMATTING.
//
// WHAT IT PRINTS
//
//   role      what the arrangement says this layer IS here, with the place's promotion applied.
//   margin    what it actually has, in the best band it lives in — 0152's figure.
//   want      what that role asks for, from `ROLE_MARGIN_DB`.
//   adrift    the difference. `ROLE_FLOOR_DB` is the widest step between two adjacent roles, so
//             anything past it is performing the role BELOW the one it was given.
//   under     the single loudest thing in that window — the one a hand can argue with.
//
// ⚠️ BY DEFAULT ONLY THE ADRIFT ONES ARE SHOWN. `--all` prints every row, which is what to read when
// a fix is being judged rather than found.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { ROLE_FLOOR_DB, adriftAt } from '../tests/pace.ts';

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--rung='))?.slice(7);
const all = args.includes('--all');
const named = args.filter((a) => !a.startsWith('--'));
const themes = named.length > 0 ? named : THEME_KINDS;
const rungs = MUSIC_LEVELS.filter((r) => r !== 'calm' && (only === undefined || r === only));

const found = [];
for (const theme of themes) {
  const loops = bakeLoops(SAMPLE_RATE, theme);
  const bakes = new Map();
  console.log(`\n══ ${theme} ${'═'.repeat(Math.max(0, 60 - theme.length))}`);
  for (const rung of rungs) {
    const rows = adriftAt(theme, rung, loops, bakes);
    const shown = all ? rows : rows.filter((r) => r.adrift < ROLE_FLOOR_DB);
    for (const row of rows) if (row.adrift < ROLE_FLOOR_DB) found.push({ theme, rung, ...row });
    if (shown.length === 0) {
      console.log(`\n── ${rung} — ${rows.length} with a role, all of them within ${-ROLE_FLOOR_DB} dB of it`);
      continue;
    }
    console.log(`\n── ${rung} — ${shown.length} of ${rows.length} ${all ? 'with a role' : `more than ${-ROLE_FLOOR_DB} dB under it`}`);
    console.log('layer        role       margin    want   adrift   under');
    for (const row of shown) {
      console.log(
        `${row.layer.padEnd(12)} ${row.role.padEnd(9)} ${row.margin.toFixed(1).padStart(6)}  ${String(row.want).padStart(6)} ` +
          `${row.adrift.toFixed(1).padStart(8)}${row.adrift < ROLE_FLOOR_DB ? ' ⚠️' : '   '} ` +
          `${row.by} ${row.byDb >= 0 ? '+' : ''}${row.byDb.toFixed(1)} (${row.band})`,
      );
    }
  }
}

console.log(`\n${'─'.repeat(66)}`);
console.log(`${found.length} place/rung/layer triples are more than ${-ROLE_FLOOR_DB} dB under their role.`);
if (found.length > 0) {
  const by = (pick) => {
    const counts = new Map();
    for (const f of found) counts.set(pick(f), (counts.get(pick(f)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
  };
  console.log(`adrift:  ${by((f) => f.layer)}`);
  console.log(`on top:  ${by((f) => f.by)}`);
}
console.log(
  `\nThe floor is the widest step between two adjacent roles, so a layer past it is performing\n` +
    `the role BELOW the one the arrangement gave it. \`tests/themes.test.ts\` holds the same list.`,
);
