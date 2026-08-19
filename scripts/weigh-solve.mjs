// What the arrangement solves to — the gains an authored intent produces, against the ones that ship.
//
// Usage:  node scripts/weigh-solve.mjs [theme ...] [--rung=push]
//
// ⚠️ IT EXISTS TO BE READ BEFORE THE SOLVE IS WIRED INTO ANYTHING.
// docs/decisions/0154-the-mix-is-authored-as-intent.md replaces 428 hand-set numbers with an
// arrangement and five target margins; this prints what that costs and what it buys, per place and
// per rung, so the change is judged on its output rather than on its description.
//
// ⚠️ THE ARITHMETIC IS `scripts/solve-mix.mjs`'s AND IS NOT REPEATED HERE, on
// scripts/weigh-audition.mjs's own terms — this file is the FORMATTING.
//
// WHAT IT PRINTS
//
//   anchor    how far the whole solved set sits from the stated targets. The arrangement is the
//             SPACING between roles; a uniform offset is not an error, and solve-mix.mjs has why.
//   role      what the layer is at that rung, with the place's promotion applied.
//   now/new   the gain that ships, and the one the arrangement solves to.
//   margin    what each produces, measured by 0152's `heardAt` arithmetic.
//   over      a solved gain the retired MIX_CEILING would have silently clamped — a mix the old
//             rules could not express at all. docs/decisions/0182-a-mix-number-has-no-band.md took
//             the wall away; the column stays because it is the argument that ended it.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_LAYERS, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';

// ⚠️ THE WALL THAT WAS, TYPED HERE BECAUSE 0182 DELETED IT. A number that is history rather than a
// bound belongs in the report that is about it, not in the content the game reads.
const MIX_CEILING = 2.6;
import { ROLE_MARGIN_DB, SOLVED_BY, roleOf } from '../src/content/arrangement.ts';
import { marginsOf, profileOfLoops, solveLevel } from './solve-mix.mjs';

const args = process.argv.slice(2);
const rungArg = args.find((a) => a.startsWith('--rung='))?.slice('--rung='.length);
const places = args.filter((a) => !a.startsWith('--'));
const themes = places.length > 0 ? places : THEME_KINDS;
const rungs = rungArg !== undefined ? [rungArg] : MUSIC_LEVELS.filter((r) => r !== 'calm');

let clamped = 0;
let missed = 0;
let worstSpacing = 0;
for (const theme of themes) {
  const loops = bakeLoops(SAMPLE_RATE, theme);
  const profile = profileOfLoops(loops);

  // ⚠️ **THE LEVEL, NOT THE RUNG** — 0166. A rung solved on its own is the independent solve, which
  // is no longer what anything plays; printing it here would be this file disagreeing with the desk.
  const level = solveLevel(theme, loops, profile);

  console.log(`\n══ ${theme} ═══════════════════════════════════════════════════════`);
  for (const rung of rungs) {
    const { shipped, gains, margins, offset, steps } = level[rung];
    const mNow = marginsOf(profile, shipped);
    console.log(`\n── ${rung} — ${steps} iterations, anchored ${offset >= 0 ? '+' : ''}${offset.toFixed(1)} dB ───────`);
    console.log('layer        role       now ->   new     margin now ->  new   want');
    const rows = MUSIC_LAYERS.filter((l) => shipped[l] > 0).sort((a, b) => mNow[a] - mNow[b]);
    for (const l of rows) {
      const role = SOLVED_BY(l) ? roleOf(theme, rung, l) : null;
      const want = role === null ? null : ROLE_MARGIN_DB[role];
      const over = SOLVED_BY(l) && gains[l] > MIX_CEILING;
      if (over) clamped++;
      if (want !== null) {
        const off = Math.abs(margins[l] - want - offset);
        if (off > worstSpacing) worstSpacing = off;
        if (off > 1.5) missed++;
      }
      console.log(
        `${l.padEnd(12)} ${(role ?? 'aura').padEnd(9)} ${shipped[l].toFixed(2).padStart(5)} -> ${gains[l].toFixed(2).padStart(5)}` +
          `     ${mNow[l].toFixed(1).padStart(6)} -> ${margins[l].toFixed(1).padStart(6)}  ${want === null ? '   —' : String(want).padStart(4)}` +
          `${over ? `   ⚠️ over MIX_CEILING ${MIX_CEILING}` : ''}`,
      );
    }
  }
}

console.log(
  `\n${clamped} solved gains are past MIX_CEILING (${MIX_CEILING}) — every one is a mix the old rules could not express.`,
);
console.log(`${missed} layers are more than 1.5 dB out of their role's SPACING; the worst is ${worstSpacing.toFixed(2)} dB.`);
