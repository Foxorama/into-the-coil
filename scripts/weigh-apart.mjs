// How far apart two places actually are, as a listener would count it.
//
// Usage:  node scripts/weigh-apart.mjs
//
// ⚠️ IT EXISTS BECAUSE FIVE PLACES MEASURED AS DIFFERENT AND SOUNDED THE SAME. Reported 2026-08-13,
// having heard all five: *"level 3 sounds incredibly similar to level 2… level 4, 5, 6 were pretty
// bland and very similar to the other levels, it didn't feel like I'd travelled somewhere else in the
// galaxy."*
//
// ⚠️ EVERY EXISTING MEASUREMENT IS ABOUT ONE PLACE AGAINST THE BASE, AND NONE IS ABOUT TWO PLACES
// AGAINST EACH OTHER. `weigh-rung` asks *is this one fast enough*; `weigh-place` asks *is this one in
// the right band*; `weigh-audition` asks *can this one's layers be heard*. All three can be green on
// seven places that are the same arrangement with different notes in it — which is what happened, and
// which docs/decisions/0113-there-is-one-composition-and-seven-levels.md is the same failure one
// level down.
//
// WHAT IT PRINTS
//
//   profile   each place's layers ranked by what they actually put out, in dB under its own loudest.
//             Two places with the same ranking are two places with the same BALANCE, whatever notes
//             they are playing — and balance is most of what a listener means by *somewhere else*.
//   apart     the RMS difference between two places' profiles, in dB. Zero is the same mix.
//   carried   how far a place's quietest third sits under its loudest, which is where the character
//             of every place in this game currently lives.

import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_LAYERS } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { layerLevels, underTheLoudest } from '../tests/pace.ts';

/** Every place's profile: dB under its own loudest layer, per layer, on the better of the two measures. */
const profiles = new Map();
for (const theme of THEME_KINDS) {
  const levels = layerLevels(theme, bakeLoops(SAMPLE_RATE, theme));
  const row = {};
  for (const layer of MUSIC_LAYERS) {
    const under = underTheLoudest(levels, layer);
    // The better of the two, because a sparse layer is audible when it lands — 0140's own argument.
    row[layer] = Math.max(under.rms, under.peak);
  }
  profiles.set(theme, row);
}

console.log('── what each place actually puts out, loudest first, in dB under its own top ──');
for (const theme of THEME_KINDS) {
  const row = profiles.get(theme);
  const ranked = MUSIC_LAYERS.filter((l) => Number.isFinite(row[l])).sort((a, b) => row[b] - row[a]);
  console.log(`\n${theme}`);
  console.log('  ' + ranked.slice(0, 8).map((l) => `${l} ${row[l].toFixed(0)}`).join('  ·  '));
  const tail = ranked.slice(-6);
  console.log('  …quietest: ' + tail.map((l) => `${l} ${row[l].toFixed(0)}`).join('  ·  '));
}

console.log('\n── how far apart, in dB RMS over the profile. 0 is the same mix ──');
const shared = MUSIC_LAYERS.filter((l) => THEME_KINDS.every((t) => Number.isFinite(profiles.get(t)[l])));
const head = '        ' + THEME_KINDS.map((t) => t.slice(0, 6).padStart(7)).join('');
console.log(head);
for (const a of THEME_KINDS) {
  const cells = THEME_KINDS.map((b) => {
    if (a === b) return '      —';
    let sum = 0;
    for (const layer of shared) {
      const d = profiles.get(a)[layer] - profiles.get(b)[layer];
      sum += d * d;
    }
    return (Math.sqrt(sum / shared.length)).toFixed(1).padStart(7);
  });
  console.log(a.slice(0, 7).padEnd(8) + cells.join(''));
}

console.log('\n── where each place keeps its character, and how far down that is ──');
for (const theme of THEME_KINDS) {
  const row = profiles.get(theme);
  const ranked = MUSIC_LAYERS.filter((l) => Number.isFinite(row[l])).sort((a, b) => row[b] - row[a]);
  const third = ranked.slice(Math.ceil((ranked.length * 2) / 3));
  const mean = third.reduce((s, l) => s + row[l], 0) / third.length;
  console.log(`${theme.padEnd(10)} quietest third averages ${mean.toFixed(1)} dB down: ${third.join(', ')}`);
}

console.log(`
⚠️ A PLACE IS ITS QUIET LAYERS. The lasers, the roar, the music box, the twin lead and the hydra are
every one of them in the bottom third of their own mix, and the top of every mix is a sub, a kick, a
bass and a pad — which is the same four sounds in all seven. That is what *it all sounds the same*
measures.`);
