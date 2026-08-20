// What KIND of thing each layer is, and whether two places fill the same slot the same way.
//
// Usage:  node scripts/weigh-gesture.mjs [placeA] [placeB]        (default: nebula saurian)
//
// ⚠️ IT EXISTS BECAUSE THE TWO INSTRUMENTS THAT ASK *ARE THESE PLACES DIFFERENT* WERE BOTH GREEN ON
// A PAIR THE PLAYER CALLED INTERCHANGEABLE. Reported 2026-08-20, of Ember Nebula and Saurian Belt:
// *"they're obviously different, but the audible sounds are 'here are two of the same songs with a
// slightly different background beat'."* `weigh-apart` said 5.7 dB and `weigh-notes` said one of them
// sounds a note no other place has — and the ear was still right.
//
// ⚠️ WHAT NEITHER OF THEM MEASURES IS GESTURE — how often a layer strikes, how long it holds, and how
// low it sits. Both places held `chords` for three to four beats, struck it about once a bar, and
// bottomed at 82 Hz. Same shape, different notes, which is what a listener calls the same song.
// docs/decisions/0186-a-place-has-its-own-gesture.md.
//
// WHAT IT PRINTS
//
//   /bar      gain-weighted strikes a bar. A pad is under one; a sixteenth line is a dozen.
//   sus       mean note length, in beats. The axis that separates a stab from a pad.
//   Hz        the lowest pitch the layer sounds. Unpitched layers print nothing.
//
// ⚠️ IT IS A READING AND NOT A VERDICT, on `scripts/weigh-mix.mjs`'s own terms. There is no threshold
// here that says two places are too alike: what a slot SHOULD be is an authoring judgement, and
// docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md is why this repository does not write
// that down as a rule. What it can say is that two places filled one slot the same way.

import { MUSIC_ROOT, MUSIC_LAYERS, LAYER_BARS, BEAT_SECONDS } from '../src/content/music.ts';
import { THEME_KINDS, voicesOf } from '../src/content/themes.ts';

const [a = 'nebula', b = 'saurian'] = process.argv.slice(2);
for (const t of [a, b]) {
  if (!THEME_KINDS.includes(t)) {
    console.error(`no such place: ${t} — one of ${THEME_KINDS.join(', ')}`);
    process.exit(1);
  }
}

/**
 * ⚠️ GAIN-WEIGHTED, BECAUSE A VOICE AT 0.05 IS NOT HALF THE GESTURE OF ONE AT 0.5. An unweighted
 * count makes a place's quietest doubling worth as much as the part a listener follows, which is the
 * mistake `weigh-audition` records making about soloed layers.
 */
const gestureOf = (theme, layer) => {
  const voices = voicesOf(theme, layer);
  if (voices.length === 0) return null;
  let struck = 0;
  let held = 0;
  let lowest = Infinity;
  for (const voice of voices) {
    const sounded = (voice.steps ?? []).filter((s) => s !== null && s !== undefined);
    const gain = voice.note.gain ?? 0;
    struck += sounded.length * gain;
    held += sounded.length * gain * (voice.note.seconds ?? 0);
    if (voice.pitched && sounded.length > 0) {
      const hz = MUSIC_ROOT * Math.pow(2, (voice.octave ?? 0) + Math.min(...sounded) / 12);
      if (hz < lowest) lowest = hz;
    }
  }
  return {
    perBar: struck / LAYER_BARS[layer],
    sustain: struck > 0 ? held / struck / BEAT_SECONDS : 0,
    lowest: Number.isFinite(lowest) ? lowest : null,
  };
};

/** Distance in octaves-of-ratio, so *twice as often* counts the same as *half as long*. */
const apart = (x, y) => (x && y ? Math.abs(Math.log2(x / y)) : 0);

console.log(`\n── every layer ${a} and ${b} both state, most alike first ──\n`);
console.log(`layer      ${a.slice(0, 6).padStart(7)}/bar ${b.slice(0, 6).padStart(7)}/bar     sus     sus       Hz      Hz`);

const rows = [];
for (const layer of MUSIC_LAYERS) {
  const one = gestureOf(a, layer);
  const two = gestureOf(b, layer);
  if (one === null || two === null) continue;
  rows.push([layer, one, two, apart(one.perBar, two.perBar) + apart(one.sustain, two.sustain) + apart(one.lowest, two.lowest)]);
}
rows.sort((x, y) => x[3] - y[3]);

let same = 0;
for (const [layer, one, two, distance] of rows) {
  if (distance < 0.35) same++;
  console.log(
    `${layer.padEnd(9)} ${one.perBar.toFixed(1).padStart(11)} ${two.perBar.toFixed(1).padStart(11)} ` +
      `${one.sustain.toFixed(2).padStart(7)} ${two.sustain.toFixed(2).padStart(7)} ` +
      `${(one.lowest ?? 0).toFixed(0).padStart(8)} ${(two.lowest ?? 0).toFixed(0).padStart(7)}   ` +
      `${distance < 0.35 ? '⚠️ THE SAME GESTURE' : distance < 0.9 ? 'close' : ''}`,
  );
}

console.log(
  `\n${same} of ${rows.length} slots are filled the same way by both places — same rate, same length, same bottom.`,
);
console.log('A slot both places wrote for themselves and still agreed on is the slot telling them what to be.');
