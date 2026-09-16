// What KIND of thing each layer is, and whether two places fill the same slot the same way.
//
// Usage:  node scripts/weigh-gesture.mjs [placeA] [placeB] [--rung=boss] [--all]
//         (default: nebula saurian, every layer both places state)
//
// ⚠️ `--rung` NARROWS IT TO THE LAYERS BOTH PLACES ACTUALLY OPEN THERE, through `rungOf`, which is the
// only honest way to ask *are these two SECTIONS alike*. Without it the comparison includes layers one
// place opens at `run` and the other only at the fight, and the answer is about the compositions
// rather than about the moment. reports/the-album-plan-2026-09-07.md asked for it to compare seven
// boss fights, and reports/the-fight-is-one-piece-2026-09-16.md is what it was used for.
//
// ⚠️ `--all` PRINTS EVERY PAIR OF PLACES RATHER THAN ONE, which is the shape a question about the
// whole game needs — twenty-one pairs read one at a time is a table nobody assembles.
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

import { MUSIC_ROOT, MUSIC_LAYERS, MUSIC_LEVELS, LAYER_BARS, BEAT_SECONDS } from '../src/content/music.ts';
import { THEME_KINDS, voicesOf, rungOf } from '../src/content/themes.ts';

const args = process.argv.slice(2);
const rung = args.find((x) => x.startsWith('--rung='))?.slice(7) ?? null;
const everyPair = args.includes('--all');
const [a = 'nebula', b = 'saurian'] = args.filter((x) => !x.startsWith('--'));
for (const t of everyPair ? [] : [a, b]) {
  if (!THEME_KINDS.includes(t)) {
    console.error(`no such place: ${t} — one of ${THEME_KINDS.join(', ')}`);
    process.exit(1);
  }
}
if (rung !== null && !MUSIC_LEVELS.includes(rung)) {
  console.error(`no such rung: ${rung} — one of ${MUSIC_LEVELS.join(', ')}`);
  process.exit(1);
}

/** The layers in play for this comparison: every one, or the ones both places open at `--rung`. */
const layersFor = (x, y) =>
  rung === null ? MUSIC_LAYERS : MUSIC_LAYERS.filter((l) => rungOf(x, rung, l) > 0 && rungOf(y, rung, l) > 0);

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

/** How alike two places fill every slot they share, and which ones they fill identically. */
const compare = (x, y) => {
  const rows = [];
  for (const layer of layersFor(x, y)) {
    const one = gestureOf(x, layer);
    const two = gestureOf(y, layer);
    if (one === null || two === null) continue;
    rows.push([layer, one, two, apart(one.perBar, two.perBar) + apart(one.sustain, two.sustain) + apart(one.lowest, two.lowest)]);
  }
  rows.sort((p, q) => p[3] - q[3]);
  return rows;
};

const SAME = 0.35;
const where = rung === null ? 'state' : `open at \`${rung}\``;

if (everyPair) {
  /*
    ⚠️ THE WHOLE GAME AT ONCE, BECAUSE THE QUESTION *WHAT IS GENERIC* IS NOT ABOUT A PAIR. One pair at
    a time says two places agreed on a slot; twenty-one say which SLOT is doing the agreeing, which is
    the thing to change. reports/the-fight-is-one-piece-2026-09-16.md is that reading.
  */
  console.log(`\n── every pair, over the layers both ${where} ──\n`);
  const tally = {};
  let pairs = 0;
  for (let i = 0; i < THEME_KINDS.length; i++) {
    for (let j = i + 1; j < THEME_KINDS.length; j++) {
      const [x, y] = [THEME_KINDS[i], THEME_KINDS[j]];
      const rows = compare(x, y);
      const same = rows.filter(([, , , d]) => d < SAME).map(([l]) => l);
      for (const l of same) tally[l] = (tally[l] ?? 0) + 1;
      pairs++;
      console.log(
        `${(x + ' / ' + y).padEnd(24)} ${String(same.length).padStart(2)} of ${String(rows.length).padStart(2)}   ${same.join(', ')}`,
      );
    }
  }
  console.log('\n── the slots the places agree on, most agreed first ──\n');
  for (const [layer, n] of Object.entries(tally).sort((p, q) => q[1] - p[1])) {
    console.log(`${layer.padEnd(10)} ${String(n).padStart(2)} of ${pairs} pairs fill it identically`);
  }
  console.log('\nA slot every place wrote for itself and they still agreed on is the slot telling them what to be.');
} else {
  console.log(`\n── every layer ${a} and ${b} both ${where}, most alike first ──\n`);
  console.log(`layer      ${a.slice(0, 6).padStart(7)}/bar ${b.slice(0, 6).padStart(7)}/bar     sus     sus       Hz      Hz`);

  const rows = compare(a, b);
  let same = 0;
  for (const [layer, one, two, distance] of rows) {
    if (distance < SAME) same++;
    console.log(
      `${layer.padEnd(9)} ${one.perBar.toFixed(1).padStart(11)} ${two.perBar.toFixed(1).padStart(11)} ` +
        `${one.sustain.toFixed(2).padStart(7)} ${two.sustain.toFixed(2).padStart(7)} ` +
        `${(one.lowest ?? 0).toFixed(0).padStart(8)} ${(two.lowest ?? 0).toFixed(0).padStart(7)}   ` +
        `${distance < SAME ? '⚠️ THE SAME GESTURE' : distance < 0.9 ? 'close' : ''}`,
    );
  }

  console.log(
    `\n${same} of ${rows.length} slots are filled the same way by both places — same rate, same length, same bottom.`,
  );
  console.log('A slot both places wrote for themselves and still agreed on is the slot telling them what to be.');
}
