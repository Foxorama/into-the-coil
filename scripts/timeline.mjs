// What a level's music does over its own length — the arithmetic, with no audio in it.
//
// docs/decisions/0116-the-rig-plays-the-level.md.
//
// ⚠️ IT IS A MODULE RATHER THAN LINES INSIDE `scripts/hear.mjs` FOR ONE REASON: a guard could not
// reach it. `hear.mjs` writes files at module scope on argv, so importing it from a test runs it —
// and the first version of 0116's guards were therefore written over the rig's SOURCE TEXT, asserting
// that the word `musicLevelFor` appeared in the file. `npm run prove` reported STILL GREEN on two of
// three, because deleting a call site leaves the import behind and a word is not a property.
//
// ⚠️ THAT IS docs/decisions/0005-a-guard-must-be-seen-to-fail.md CATCHING A VACUOUS GUARD, and the
// fix is not a better regex. What a rig has to be held to is that it answers the same questions the
// game does; that is a claim about VALUES, so the values have to be reachable.

import {
  BOSS_PEAK_HEALTH,
  BAR_SECONDS,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  AURA_LAYERS,
} from '../src/content/music.ts';
import { LEVELS } from '../src/content/levels.ts';
import { mixOf } from '../src/content/themes.ts';
import { auraBuild, auraFor, musicLevelFor } from '../src/app/music.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

/**
 * How fast the world goes past, in world units a second.
 *
 * ⚠️ **Derived from the two constants that decide it**, never typed. `SCROLL_PER_STEP` is the sim's
 * and `STEPS_PER_SECOND` is the shell's, and a level retuned in either is a level heard retuned.
 */
export const UNITS_PER_SECOND = SCROLL_PER_STEP * STEPS_PER_SECOND;

/**
 * Where a second lands in the music's own grid.
 *
 * ⚠️ **`beat` is the thing a listener counts and the thing nothing in this project has ever
 * measured.** A section change heard away from a downbeat does not read as a section change — it
 * reads as the mix wobbling — and that is the whole subject of 0116's finding.
 */
export function inBars(second) {
  const bars = second / BAR_SECONDS;
  const beat = (bars - Math.floor(bars)) * 4;
  return { bars, beat, onBar: beat < 0.02 || beat > 3.98 };
}

/**
 * Every rung change in a level, in the order the game reaches them.
 *
 * ⚠️ **THE CAMERA IS WALKED AND THE RUNGS ARE NOT LISTED**, which is the whole difference between
 * this and `hear.mjs --music`'s arc. That arc types its order into the file — `['run', 'run',
 * 'approach', …]` — so every boundary lands at a phrase by construction and the mode cannot show one
 * landing anywhere else. Asking `musicLevelFor` for the distance a real camera would be at is what
 * makes a retuned level heard as retuned.
 *
 * ⚠️ **The fight's health falls linearly, which is a SHAPE and not a claim about combat.** All it has
 * to do is cross `BOSS_PEAK_HEALTH` once, so `bossPeak` arrives where the game would put it.
 *
 * @param {string} kind          a key of `LEVELS`
 * @param {number} fightSeconds  how long the boss is given
 * @param {number} [step]        the resolution the camera is sampled at, in seconds
 */
export function rungMarks(kind, fightSeconds, step = 1 / 64) {
  const { bossAt } = LEVELS[kind];
  const toBoss = bossAt / UNITS_PER_SECOND;
  const total = toBoss + fightSeconds;
  const marks = [];
  let last = null;
  for (let second = 0; second < total; second += step) {
    const rung = rungAt(kind, second, fightSeconds);
    if (rung !== last) {
      marks.push({ rung, second, ...inBars(second) });
      last = rung;
    }
  }
  for (let i = 0; i < marks.length; i++) {
    marks[i].lasts = (i + 1 < marks.length ? marks[i + 1].second : total) - marks[i].second;
  }
  return marks;
}

/** Which rung a level is on `second` seconds in. The single description `rungMarks` and the rig share. */
export function rungAt(kind, second, fightSeconds) {
  const { bossAt } = LEVELS[kind];
  const toBoss = bossAt / UNITS_PER_SECOND;
  const inFight = second >= toBoss;
  const camera = inFight ? bossAt : second * UNITS_PER_SECOND;
  const health = inFight ? Math.max(0, 1 - (second - toBoss) / fightSeconds) : 1;
  return musicLevelFor(camera, bossAt, inFight, health);
}

/** How far through its level-long build the aura is, at `second`. 0107. */
export function auraAt(kind, second, nearnessInFight) {
  const { bossAt } = LEVELS[kind];
  const toBoss = bossAt / UNITS_PER_SECOND;
  const inFight = second >= toBoss;
  const camera = inFight ? bossAt : second * UNITS_PER_SECOND;
  return auraFor(auraBuild(camera, bossAt), inFight ? nearnessInFight : 0);
}

/**
 * What gain a layer is heading for — the ladder's rung, scaled by the place.
 *
 * ⚠️ **THE THEME IS IN IT, AND NO MODE OF THE RIG HAS EVER APPLIED ONE.** `mixOf` is 0107's
 * multiplier; without it every one of the seven levels renders as level one, which is
 * *"the same music repeats level after level"* reproduced inside the instrument built to answer it.
 *
 * ⚠️ **The aura's row is a CEILING and not a gain** — 0091 — so it arrives multiplied rather than
 * stated, exactly as `makeMusicOut` does it.
 */
export function targetGain(theme, rung, layer, aura) {
  const ceiling = AURA_LAYERS.includes(layer) ? aura : 1;
  return MUSIC_LADDER[rung][layer] * mixOf(theme, layer) * ceiling;
}

/** Everything a caller needs to render or report a level, gathered once. */
export function levelTimeline(kind, fightSeconds) {
  const { bossAt, theme } = LEVELS[kind];
  return {
    bossAt,
    theme,
    toBoss: bossAt / UNITS_PER_SECOND,
    total: bossAt / UNITS_PER_SECOND + fightSeconds,
    marks: rungMarks(kind, fightSeconds),
    layers: MUSIC_LAYERS,
    peakHealth: BOSS_PEAK_HEALTH,
  };
}
