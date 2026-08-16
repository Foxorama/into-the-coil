// What survives the MIX — every layer at a rung, against everything playing beside it.
//
// Usage:  node scripts/weigh-heard.mjs [theme ...] [--rung=push]
//
// ⚠️ IT EXISTS BECAUSE EVERY OTHER MEASUREMENT HERE IS OF A SOLOED LAYER. Reported 2026-08-16, of
// Ember Nebula at `push`: *"I'm not hearing ride, hook or lead at all here when playing the entire
// sequence."* `weigh-audition` puts `hook` at −11.0 dB and `lead` at −9.4 — mid-cluster, nowhere near
// 0140's floor — so the model has no complaint about two layers a listener says are not there.
//
// ⚠️ AND IT COULD NOT HAVE ONE. `layerLevels` takes each layer to the loudest gain ANY rung gives it
// and compares it to another layer at ITS loudest, which is an arrangement no rung plays; the
// comparison is broadband, so a layer buried in the one band it occupies scores on the energy it has
// everywhere else; and it is MONO, so `LAYER_PAN` — the whole of
// docs/decisions/0118-the-mix-has-a-width.md, added expressly to stop layers masking each other — has
// never appeared in a number this repository prints.
//
// ⚠️ THE ARITHMETIC IS `tests/pace.ts`'s AND IS NOT REPEATED HERE, on scripts/weigh-audition.mjs's
// own terms: a printed figure that disagrees with an asserted one is
// docs/decisions/0029-the-tracked-record-is-the-record.md happening in arithmetic. This file is the
// FORMATTING; `heardAt` is the measurement.
//
// ⚠️ IT IS NOT A SUBSTITUTE FOR LISTENING — docs/decisions/0027-measure-the-picture-not-the-model.md.
// Masking in a real ear spreads upward across bands and this does not model that. What it can say is
// that a layer has nowhere at all to be heard, which is a floor and not a verdict.
//
// WHAT IT PRINTS
//
//   gain      what the place takes the layer to AT THIS RUNG — not the loudest any rung ever does.
//   down      dB under the loudest layer sounding at this rung, A-weighted over every band. The
//             quantity `weigh-audition` prints, restricted to an arrangement that actually plays.
//   margin    dB over everything else, in the best band the layer lives in, on the ear that favours
//             it. A RANKING AND NOT A VERDICT — see below.
//   window    which band and which ear that was.
//   under     the single loudest layer in that window, and how far over this one it sits. The sum is
//             what masks; this is the one a hand can argue with. Where the two nearly agree the
//             window has one occupant; where they diverge it is a crowd and no single edit frees it.
//
// ⚠️ THERE IS NO THRESHOLD ON `margin` AND THAT IS DELIBERATE. The first version flagged everything
// under 0 dB and flagged ELEVEN OF THIRTEEN layers at `push` — in a mix of thirteen, almost nothing
// outranks the power sum of the other twelve, so the line separated nothing. Ranked, the spread at
// that rung runs −22.5, −17.8, −11.0, −10.7, −9.5, −8.0, −7.9, −7.7, −5.0, −4.8, −2.0, +2.1, +3.7:
// a continuum with no gap in it anywhere.
//
// ⚠️ THAT IS EXACTLY WHAT CLAUDE.md's *no counting guard* REFUSES, and what
// docs/decisions/0140-no-layer-is-inaudible.md required of `AUDIBLE_FLOOR_DB` before setting it —
// a number is only defensible if the data has a hole for it to sit in. `down` HAS one: `ride` at
// −31.9 against a next-worst of −25.3, and at `approach` −29.7 against −19.9. `margin` does not, so
// this prints the order and leaves the verdict to the ear that asked for it.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { heardAt } from '../tests/pace.ts';

const args = process.argv.slice(2);
const rungArg = args.find((a) => a.startsWith('--rung='))?.slice('--rung='.length);
const themes = args.filter((a) => !a.startsWith('--'));

if (rungArg !== undefined && !MUSIC_LEVELS.includes(rungArg)) {
  console.error(`no such rung: ${rungArg}. One of ${MUSIC_LEVELS.join(', ')}.`);
  process.exit(1);
}
for (const theme of themes) {
  if (!THEME_KINDS.includes(theme)) {
    console.error(`no such place: ${theme}. One of ${THEME_KINDS.join(', ')}.`);
    process.exit(1);
  }
}

// ⚠️ A hand asking about one place wants every rung of it; a hand asking about one rung wants every
// place at it. Both bare is the whole grid, which is what a first look at a report needs.
const places = themes.length > 0 ? themes : THEME_KINDS;
const rungs = rungArg !== undefined ? [rungArg] : MUSIC_LEVELS;

// ⚠️ The bake is real DSP and the band energies are cached across rungs — `heardAt` shares
// `rungShape`'s key, so seven rungs of one place pay for each layer once rather than seven times.
const adrift = [];
for (const theme of places) {
  const loops = bakeLoops(SAMPLE_RATE, theme);
  const bakes = new Map();
  console.log(`\n══ ${theme} ═══════════════════════════════════════════════════════════`);
  for (const rung of rungs) {
    const rows = heardAt(theme, rung, loops, bakes);
    if (rows.length === 0) continue;
    console.log(`\n── ${rung} — ${rows.length} sounding ──────────────────────────────────`);
    console.log('layer          gain     down    margin   window      under');
    /*
      ⚠️ THE ONE THING FLAGGED IS A LAYER SITTING IN A HOLE IN ITS OWN RUNG'S `down` SPREAD — ten
      decibels clear of the next quietest, which is the shape 0140 found and the size it called a
      chasm. It is computed from the rung rather than typed in, so it cannot be a threshold fitted to
      the case that produced it: a rung whose layers are a continuum flags nothing at all.
    */
    const byDown = rows.map((r) => r.down).sort((a, b) => a - b);
    const chasm = byDown.length > 2 && byDown[1] - byDown[0] >= 10 ? byDown[0] : -Infinity;
    for (const row of rows) {
      const alone = row.down === chasm;
      console.log(
        `${row.layer.padEnd(12)} ${row.gain.toFixed(2).padStart(6)}  ${row.down.toFixed(1).padStart(6)}  ` +
          `${row.margin.toFixed(1).padStart(7)}   ${`${row.band} ${row.ear}`.padEnd(10)}` +
          // The sign is carried, because `under` going NEGATIVE is the interesting case: nothing in
          // the window is louder than this layer, which is what a layer with room around it looks like.
          `${`${row.by} ${row.byDb >= 0 ? '+' : ''}${row.byDb.toFixed(1)}`.padEnd(16)}` +
          `${alone ? `⚠️ ${(byDown[1] - byDown[0]).toFixed(1)} dB CLEAR OF THE NEXT QUIETEST` : ''}`,
      );
      if (alone) adrift.push(`${theme}/${rung} ${row.layer}`);
    }
  }
}

console.log(
  `\n${adrift.length === 0 ? 'no layer is adrift of its rung' : `⚠️ adrift of the rung: ${adrift.join(', ')}`}`,
);
console.log('`margin` carries no threshold and is a RANKING — the header says why. `down` carries one');
console.log('only where the rung itself puts a ten-decibel hole under exactly one layer.');
