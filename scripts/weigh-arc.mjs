// How LOUD a level gets, second by second, over its own length.
//
// Usage:  node scripts/weigh-arc.mjs [theme ...] [--step=0.2]
//
// ⚠️ IT EXISTS BECAUSE EVERY OTHER INSTRUMENT HERE MEASURES A MOMENT OR A LAYER, AND THE REPORT WAS
// ABOUT NEITHER. Reported 2026-09-03, of The Approach: *"at 41sec in, the volume increases a bit too
// loudly. there's too big a jump from the transition to the spike at that level, and we'll need to
// make sure the transitions are smoothed out for the rest of the level so there's no weird drops
// later."*
//
//   weigh-boundary  which WAY each layer moves across a rung change      — one instant, per layer
//   weigh-build     WHEN each arrival lands, in seconds                  — one boundary, no loudness
//   weigh-heard     whether a layer clears its role's margin             — one rung, settled
//   weigh-arc       what the WHOLE MIX sums to, against the clock        — this file
//
// ⚠️ A JUMP IS A DIFFERENCE BETWEEN TWO MOMENTS, so nothing that reports one moment can see it, and
// docs/decisions/0140-no-layer-is-inaudible.md's *a gain is not a loudness* means a table of gains
// cannot either. What a listener said got loud is the SUM, and this is the only thing that prints it.
//
// ── WHAT IS MODELLED, AND WHAT IS NOT ──────────────────────────────────────────────────────────
//
// ⚠️ THE RAMPS ARE THE REAL ONES. `levelWrites` is asked for the actual schedule at every boundary —
// the same call `src/app/mount.ts` makes — and each write is evaluated as the exponential approach
// `setTargetAtTime` performs, so the staggered arrivals of docs/decisions/0171 are in the curve
// rather than smoothed away by sampling.
//
// ⚠️ THE SUM IS INCOHERENT AND THE BUS SHAPER IS NOT IN IT. Layers are summed in POWER, which is the
// standard model for unrelated material and is what `tests/pace.ts` already treats a mix as. The
// `saturate` curve on the music bus compresses peaks, so **the real jump is no larger than the one
// printed here and may be smaller**. That direction is the safe one for a guard about something being
// too loud, and it is stated rather than left for somebody to discover.

import { levelWrites, auraBuild, auraFor, musicLevelFor, UNITS_PER_SECOND } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { BAR_SECONDS, MUSIC_LAYERS, AURA_LAYERS } from '../src/content/music.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { THEMES, THEME_KINDS, mixOf, rungOf } from '../src/content/themes.ts';
import { loopsAt } from '../tests/bakes.ts';
import { arcOf, boundariesIn, LOUD_STEP_DB } from '../tests/arc.ts';

const args = process.argv.slice(2);
const step = Number(args.find((a) => a.startsWith('--step='))?.slice(7) ?? 0.2);
/*
  ⚠️ **A WINDOW, BECAUSE A BUILD IS NOT A SAMPLE.** `--from=30 --to=50` prints every sample in that
  stretch instead of only the moves — which is how the reported 41 seconds was actually read, and the
  first pass at this file could not show it at all.
*/
const from = Number(args.find((a) => a.startsWith('--from='))?.slice(7) ?? NaN);
const to = Number(args.find((a) => a.startsWith('--to='))?.slice(5) ?? NaN);
const windowed = Number.isFinite(from) && Number.isFinite(to);
const themes = args.filter((a) => !a.startsWith('--'));
const wanted = themes.length > 0 ? themes : THEME_KINDS;

const db = (x) => (x <= 0 ? -Infinity : 20 * Math.log10(x));

/*
  ⚠️ **`--writes=<rung>` PRINTS THE SCHEDULE ITSELF, AND IT EXISTS BECAUSE I GUESSED TWICE.** The arc
  says a bar rose 2.9 dB; it cannot say WHICH layer did it, so two rounds of tuning went into a
  constant that turned out not to be the cause. This asks `levelWrites` for the boundary's actual
  writes — the same call the mixer makes — and prints what each one is doing.
*/
const writesInto = args.find((a) => a.startsWith('--writes='))?.slice(9);
if (writesInto !== undefined) {
  for (const theme of wanted) {
    const kind = LEVEL_KINDS.find((k) => LEVELS[k].theme === theme);
    if (kind === undefined) continue;
    const order = ['calm', 'run', 'push', 'surge', 'approach', 'boss', 'bossPeak'];
    const to = writesInto;
    const from = order[Math.max(0, order.indexOf(to) - 1)];
    const before = {};
    for (const w of levelWrites(from, theme, 0, 0, 0, {})) before[w.layer] = w.target;
    console.log(`\n══ ${THEMES[theme].title} — ${from} → ${to} ══`);
    console.log('  layer         was      now    ratio   lands   ramp   what');
    const rows = levelWrites(to, theme, 0, 0, 0, before)
      .filter((w) => !AURA_LAYERS.includes(w.layer))
      .sort((a, b) => a.at - b.at || b.target - a.target);
    for (const w of rows) {
      const was = before[w.layer] ?? 0;
      const kindOf = was === 0 ? 'arrives' : w.target === 0 ? 'leaves' : w.target > was ? 'rises' : 'falls';
      const ratio = was === 0 || w.target === 0 ? '     —' : db(w.target / was).toFixed(1).padStart(6);
      console.log(
        `  ${w.layer.padEnd(10)} ${was.toFixed(2).padStart(6)}  ${w.target.toFixed(2).padStart(6)}  ${ratio}  ` +
          `${w.at.toFixed(1).padStart(5)}s  ${(w.tau * 3).toFixed(1).padStart(4)}s   ${kindOf}`,
      );
    }
  }
  process.exit(0);
}

for (const theme of wanted) {
  const kind = LEVEL_KINDS.find((k) => LEVELS[k].theme === theme);
  if (kind === undefined) continue;
  const arc = arcOf(theme, step);

  console.log(`\n══ ${THEMES[theme].title} (${theme}) ══════════════════════════════════════`);
  console.log('the mix, summed, against the clock. `step` is the change since the line above.\n');
  console.log('  time     rung        loudness    step   ');

  let lastRung = null;
  for (let i = 0; i < arc.length; i++) {
    const now = arc[i];
    const rungChanged = now.rung !== lastRung;
    lastRung = now.rung;
    /*
      ⚠️ **PRINTED ON A CHANGE OF RUNG OR ON A STEP WORTH HEARING**, rather than every sample. A
      170-second level at 0.2s is 850 lines, and what a reader is looking for is where it MOVES.
    */
    if (windowed) {
      if (now.second < from || now.second > to) continue;
    } else if (!rungChanged && Math.abs(now.step) < LOUD_STEP_DB / 2) continue;
    const clock = `${Math.floor(now.second / 60)}:${String(Math.floor(now.second % 60)).padStart(2, '0')}`;
    console.log(
      `  ${clock.padStart(5)}  ${now.rung.padEnd(10)}  ${now.db.toFixed(1).padStart(7)} dB  ` +
        `${(now.step >= 0 ? '+' : '') + now.step.toFixed(1)}`.padStart(7) +
        (rungChanged ? '   ← rung' : '') +
        (Math.abs(now.step) >= LOUD_STEP_DB ? `   ⚠️ ${now.step > 0 ? 'jump' : 'drop'}` : ''),
    );
  }

  /*
    ⚠️ **THE TABLE THAT ANSWERS THE REPORT, AND THE DUMP ABOVE IS HOW IT WAS FOUND.** `rise` is the
    spike — how far the mix climbs inside one bar — and `dip` is the hole a departure leaves before
    what replaces it has arrived. Both are the boundary read as a WINDOW, which is the thing no other
    instrument here does.
  */
  /*
    ⚠️ **THE TABLE THAT ANSWERS THE REPORT, AND THE DUMP ABOVE IS HOW IT WAS FOUND.** `rise` is the
    spike — how far the mix climbs inside one bar — and `hole` is the stretch where it is quieter than
    BOTH the rung it left and the rung it is arriving at. `settled` beside them is what the rung change
    is worth once it is done, which is the composition's own shape and is not a defect.
  */
  console.log('\n  boundary              at    settled     hole     rise (in one bar)');
  for (const edge of boundariesIn(arc, step)) {
    const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const sign = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
    console.log(
      `  ${(edge.from + ' → ' + edge.to).padEnd(20)} ${clock(edge.second).padStart(5)}  ` +
        `${sign(edge.settled).padStart(7)}  ${edge.hole.toFixed(1).padStart(7)}  ` +
        `${sign(edge.rise).padStart(6)} at ${clock(edge.riseAt)}` +
        (edge.hole <= -LOUD_STEP_DB / 2 ? '  ⚠️ hole' : '') +
        (edge.rise >= LOUD_STEP_DB / 2 ? '  ⚠️ spike' : ''),
    );
  }
}

console.log(
  `\nA step of ${LOUD_STEP_DB} dB inside ${step}s is what this calls sudden — see tests/arc.ts for where that came from.`,
);
