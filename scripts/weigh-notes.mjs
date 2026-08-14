// What NOTES each place sounds, and what the player's own gun sounds over them.
//
// Usage:  node scripts/weigh-notes.mjs
//
// ⚠️ IT EXISTS BECAUSE SEVEN PLACES WITH THEIR OWN MATERIAL AND THEIR OWN BALANCE STILL SOUNDED
// ALIKE. Reported 2026-08-14, after 0147 had rebalanced all seven: *"level 3 currently reads as a copy
// of level 2 with some slight variation… the level melodies are copies of the earlier ones and aren't
// their own unique themes and styles."*
//
// ⚠️ AND THE MELODIES WERE NOT COPIES, WHICH IS WHY NOTHING COULD SEE IT. Every place has its own
// file, its own progression and its own tunes. `weigh-apart` asks whether two places are BALANCED
// differently and 0147 fixed that; this asks whether they are allowed to sound different NOTES, and
// six of the seven were not. That is a question no measurement in this repository could previously
// state, let alone answer.
//
// WHAT IT PRINTS
//
//   notes     the pitch classes each place may sound, and how many places share that set. Two places
//             with the same set differ by rhythm, balance and timbre alone — which is the exact
//             combination the report calls interchangeable.
//   colour    how much of a place's loop actually SOUNDS a note outside the natural minor. A stated
//             mode nothing plays is a declaration, not a sound.
//   clash     where a place's chromatic notes meet the cues. The cues are baked once, in A natural
//             minor (0099), so a place that sharpens a degree the cues also sound puts the player's
//             gun a semitone away from the level for as long as that note is held. THIS IS THE
//             MEASUREMENT 0148 IS OWED, and the base composition is the control: it has sounded a G#
//             over these same cues since before the guard that forbade one existed.

import { CUES, MUSIC_ROOT, SCALE } from '../src/content/cues.ts';
import { MUSIC, MUSIC_LAYERS } from '../src/content/music.ts';
import { THEMES, THEME_KINDS, scaleOf, voicesOf } from '../src/content/themes.ts';

const NAMES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
/** A semitone over the root as a pitch class, and the same for a frequency. */
const classOf = (semi) => (((semi % 12) + 12) % 12);
const classOfHz = (hz) => (hz <= 0 ? null : classOf(Math.round(12 * Math.log2(hz / MUSIC_ROOT))));
const spell = (set) => [...set].sort((a, b) => a - b).map((c) => NAMES[c]).join(' ');

/** Every place, including the base composition under the name of the theme that states no voices. */
const placeVoices = (theme) =>
  MUSIC_LAYERS.flatMap((layer) => voicesOf(theme, layer).map((voice) => ({ layer, voice })));

console.log('\n── THE NOTES EACH PLACE MAY SOUND ────────────────────────────────────────────────');
console.log('   stated is what the theme row declares; sounded is what its voices actually play\n');

const sets = new Map();
const rows = [];
for (const theme of THEME_KINDS) {
  const stated = new Set(scaleOf(theme));
  const sounded = new Set();
  let notes = 0;
  let coloured = 0;
  for (const { voice } of placeVoices(theme)) {
    if (!voice.pitched) continue;
    for (const step of voice.steps) {
      if (step === null || step === undefined) continue;
      notes += 1;
      sounded.add(classOf(step));
      if (!SCALE.includes(classOf(step))) coloured += 1;
    }
  }
  const key = spell(stated);
  sets.set(key, (sets.get(key) ?? 0) + 1);
  rows.push({ theme, stated, sounded, notes, coloured, own: THEMES[theme].voices !== undefined });
}

for (const r of rows) {
  console.log(
    `${r.theme.padEnd(11)} stated ${spell(r.stated).padEnd(28)} sounded ${spell(r.sounded).padEnd(28)}` +
      `${r.own ? '' : '  (no music of its own)'}`,
  );
}
console.log(`\n   distinct stated sets across ${THEME_KINDS.length} places: ${sets.size}`);
for (const [set, n] of sets) console.log(`     ${String(n).padStart(2)} × ${set}`);

console.log('\n── HOW MUCH OF EACH PLACE IS ACTUALLY CHROMATIC ──────────────────────────────────');
console.log('   notes outside A natural minor, as a share of every pitched note the place plays\n');
for (const r of rows) {
  const share = r.notes === 0 ? 0 : (r.coloured / r.notes) * 100;
  console.log(
    `${r.theme.padEnd(11)} ${String(r.coloured).padStart(4)} of ${String(r.notes).padStart(5)} notes  ` +
      `${share.toFixed(1).padStart(5)}%${r.coloured === 0 ? '   ← nothing but the natural minor' : ''}`,
  );
}

console.log('\n── WHERE A PLACE MEETS THE PLAYER’S OWN GUN ──────────────────────────────────────');
console.log('   the cues are baked once, in A (0099). A place that sharpens a degree the cues also');
console.log('   sound is a semitone away from them for as long as it holds that note.\n');

const cueClasses = new Map();
for (const [kind, row] of Object.entries(CUES)) {
  for (const layer of row.layers) {
    if (layer.wave === 'noise') continue; // `from` is a sample-and-hold rate, not a pitch — 0099.
    for (const hz of [layer.from, layer.to]) {
      const pc = classOfHz(hz);
      if (pc === null) continue;
      if (!cueClasses.has(pc)) cueClasses.set(pc, new Set());
      cueClasses.get(pc).add(kind);
    }
  }
}
const sortedCue = [...cueClasses.keys()].sort((a, b) => a - b);
console.log(`   the cues sound: ${sortedCue.map((c) => NAMES[c]).join(' ')}`);
for (const pc of sortedCue) {
  console.log(`     ${NAMES[pc].padEnd(3)} in ${[...cueClasses.get(pc)].join(', ')}`);
}

console.log('');
for (const r of rows) {
  const chromatic = [...r.sounded].filter((c) => !SCALE.includes(c));
  if (chromatic.length === 0) {
    console.log(`${r.theme.padEnd(11)} no chromatic note — nothing to clash`);
    continue;
  }
  const lines = chromatic.map((c) => {
    const below = classOf(c - 1);
    const above = classOf(c + 1);
    const hit = [below, above].filter((n) => cueClasses.has(n)).map((n) => NAMES[n]);
    return `${NAMES[c]} against ${hit.length === 0 ? 'nothing the cues sound' : hit.join(' and ')}`;
  });
  console.log(`${r.theme.padEnd(11)} ${lines.join('  ·  ')}`);
}
console.log('');
