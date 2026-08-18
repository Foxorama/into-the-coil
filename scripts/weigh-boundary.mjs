// Which WAY every layer moves at a section boundary — the shipped ladder against the solved mix.
//
// Usage:  node scripts/weigh-boundary.mjs [theme ...] [--solved]
//
// ⚠️ IT EXISTS BECAUSE `weigh-trajectory` MEASURES MAGNITUDE AND THE EAR OBJECTED TO SIGN. Reported
// 2026-08-18, with both mixes copied off the desk at the same boundary: "the solved game music
// overall sounds way better, but the border change is way worse... every change for every level is
// now a hard jump between sounds whereas pre-'solved mix' the change was a lot smoother."
//
// ⚠️ AT THAT BOUNDARY THE SOLVE'S LARGEST MOVE IS 2.9 dB, which is nothing —
// docs/decisions/0166-the-level-is-solved-as-one-trajectory.md's guard is green over it and its
// headline number is 11.2. What is wrong is that four of the seven layers already sounding get
// QUIETER while four new ones open loudly, so the bed ducks to pay for the arrivals and the mix
// inverts at the instant of the change. The shipped ladder never does that: across all seven places
// and all three in-level boundaries it reduces a carried layer by at most 0.26 dB.
//
// ⚠️ THIS IS docs/decisions/0027-measure-the-picture-not-the-model.md INSIDE A GUARD ONE DAY OLD.
// The quantity was chosen from the previous report's own vocabulary — "lurch", "moves >= 6 dB" — and
// a listener's word for the defect was "jump", which sounds like the same thing and is not.
//
// WHAT IT PRINTS, per boundary
//
//   carried   layers sounding on BOTH sides, and how many of them go down rather than up.
//   worst     the largest reduction of a carried layer, in dB. `docs/decisions/0167-…` holds this
//             under 1 dB, which is a level JND — the unit the complaint is in.
//   opens     how many layers arrive. A build with no reduction is what a section change has always
//             sounded like here.
//   level     what the whole rung's summed level does, which is the thing that is ALLOWED to move.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_LAYERS, MUSIC_LEVELS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { SOLVED_BY } from '../src/content/arrangement.ts';
import { HOLD_WEIGHT, profileOfLoops, rmsOfLoops, shippedAt, solveLevel } from './solve-mix.mjs';

const args = process.argv.slice(2);
const useSolved = args.includes('--solved');
const named = args.filter((a) => !a.startsWith('--'));
const themes = named.length > 0 ? named : THEME_KINDS;

/** The boundaries a listener crosses inside one level. The boss arriving is an event, not a build. */
const IN_LEVEL = [
  ['run', 'push'],
  ['push', 'surge'],
  ['surge', 'approach'],
];
const db = (x) => 20 * Math.log10(x);

let worstEver = 0;
let duckedEver = 0;

for (const theme of themes) {
  const loops = bakeLoops(SAMPLE_RATE, theme);
  const rms = rmsOfLoops(loops);
  let gainsAt;
  if (useSolved) {
    const level = solveLevel(theme, loops, profileOfLoops(loops), rms, HOLD_WEIGHT);
    gainsAt = (rung) => level[rung].gains;
  } else {
    gainsAt = (rung) => shippedAt(theme, rung);
  }

  console.log(`\n══ ${theme} — ${useSolved ? 'the SOLVED mix' : 'the shipped ladder'} ${'═'.repeat(30)}`);
  for (const [from, to] of IN_LEVEL) {
    const a = gainsAt(from);
    const b = gainsAt(to);
    const down = [];
    let up = 0;
    let opens = 0;
    for (const layer of MUSIC_LAYERS) {
      if (!SOLVED_BY(layer)) continue;
      if (a[layer] > 0 && b[layer] > 0) {
        const move = db(b[layer] / a[layer]);
        if (move < 0) down.push({ layer, move });
        else up++;
      } else if (!(a[layer] > 0) && b[layer] > 0) opens++;
    }
    down.sort((x, y) => x.move - y.move);
    const worst = down.length === 0 ? 0 : down[0].move;
    worstEver = Math.min(worstEver, worst);
    duckedEver += down.filter((d) => d.move <= -1).length;

    const summed = (g) =>
      Math.sqrt(MUSIC_LAYERS.reduce((s, l) => s + (g[l] > 0 ? (rms[l] * g[l]) ** 2 : 0), 0));
    console.log(
      `${`${from}→${to}`.padEnd(18)} carried ${String(down.length + up).padStart(2)} ` +
        `(${String(down.length).padStart(2)} down, ${String(up).padStart(2)} up) · opens ${opens} · ` +
        `worst ${worst.toFixed(2).padStart(6)} dB · level ${db(summed(b) / summed(a)) >= 0 ? '+' : ''}${db(summed(b) / summed(a)).toFixed(1)} dB`,
    );
    for (const d of down.filter((x) => x.move <= -1)) {
      console.log(`  ⚠️  ${d.layer.padEnd(10)} ${d.move.toFixed(1)} dB — a carried layer, audibly quieter`);
    }
  }
}

console.log(`\n${'─'.repeat(70)}`);
console.log(
  `worst reduction of a carried layer: ${worstEver.toFixed(2)} dB · ` +
    `${duckedEver} of them fall by a decibel or more`,
);
console.log(
  `A decibel is roughly the smallest level change a listener notices, which is why it is the bound.\n` +
    `The shipped ladder's worst is −0.26 dB; run with --solved for the comparison.`,
);
