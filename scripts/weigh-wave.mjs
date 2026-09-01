// How wide a wave actually is, against the volley that has to kill it.
//
// Usage:  node scripts/weigh-wave.mjs [levelKind]
//
// ⚠️ IT EXISTS BECAUSE THE SAME REPORT HAS COME BACK THREE TIMES AND TWO FIXES HAVE ALREADY LANDED.
// docs/decisions/0121-a-wave-dies-together.md tightened ONE constant to what the widest enemy allows;
// docs/decisions/0143-a-wave-is-spaced-by-the-body-it-is-made-of.md made the gap the wave's own. The
// report survived both — docs/state-of-play.md: *"the grouping of enemies in level 1 is still split
// with certain groups"* — and docs/decisions/0027-measure-the-picture-not-the-model.md says that when
// a report survives a fix that measured green, go and measure the picture.
//
// ⚠️ THE 19.75 EVERY EXISTING COMMENT QUOTES IS A FAN AT ONE ASSUMED RANGE, AND THE RANGE IS NOT A
// CONSTANT ANYWHERE. It is prose — *"the 50 units a wave is typically engaged at"* — so this sweeps
// distance rather than baking the number, and derives the fan from `SPREAD_STEP` and `MAX_BARRELS`
// themselves. A guard that measured the fan against a copy of 19.75 would prove only that the
// arithmetic agrees with itself, which is the failure 0027 names.
//
// WHAT IT PRINTS
//
//   fan       the volley's width in world units at a range, from the barrel spread that draws it.
//   span      centre-to-centre width of a wave, the same quantity every existing table compares.
//   hull      outermost hull edge to outermost hull edge — what the player actually sees.
//   air       the clear air a wave WOULD need between hulls to fit inside the fan. NEGATIVE means
//             the bodies would have to overlap, which is not a spacing problem at all.

import { ENEMIES } from '../src/content/enemies.ts';
import { FORMATIONS, abreastCap, gapAcross } from '../src/content/formations.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { BAR_SECONDS } from '../src/content/music.ts';
import { MAX_BARRELS, SPREAD_STEP } from '../src/content/pickups.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

/** The volley's width at `distance`, from the two constants that draw it. */
function fanWidth(distance) {
  return 2 * distance * Math.tan(((MAX_BARRELS - 1) * SPREAD_STEP) / 2);
}

/** Centre-to-centre and hull-to-hull width of one wave, plus how deep it runs, in world units. */
function widthOf(wave) {
  const row = ENEMIES[wave.enemy];
  const gap = gapAcross(row.radius);
  const formation = FORMATIONS[wave.formation];
  let lo = Infinity;
  let hi = -Infinity;
  let nearest = Infinity;
  let deepest = -Infinity;
  for (let i = 0; i < wave.count; i += 1) {
    const across = formation.acrossOffset(i, wave.count, gap);
    if (across < lo) lo = across;
    if (across > hi) hi = across;
    const along = formation.alongOffset(i, wave.count, gap);
    if (along < nearest) nearest = along;
    if (along > deepest) deepest = along;
  }
  const span = hi - lo;
  return { span, hull: span + 2 * row.radius, depth: deepest - nearest, gap, radius: row.radius };
}

/**
 * A depth in world units, as beats between the first member arriving and the last.
 *
 * ⚠️ THE UNIT THE PLAYER ACTUALLY EXPERIENCES, which is what 0027 asks at least one number to be in.
 * World units are the model's currency; a wave's depth is only meaningful as the time it takes to
 * pass, and this game quantises everything else to the beat.
 */
function beatsFor(depth) {
  const unitsPerSecond = SCROLL_PER_STEP * STEPS_PER_SECOND;
  return depth / unitsPerSecond / (BAR_SECONDS / 4);
}

const RANGES = [30, 40, 50, 60, 70];
const only = process.argv[2];
const kinds = only ? [only] : LEVEL_KINDS;
if (only && !LEVEL_KINDS.includes(only)) {
  console.error(`Unknown level "${only}". One of: ${LEVEL_KINDS.join(', ')}`);
  process.exit(1);
}

console.log('THE FAN, from SPREAD_STEP=%s over %d barrels', SPREAD_STEP, MAX_BARRELS);
for (const d of RANGES) console.log('  at %d units ahead   fan = %s', d, fanWidth(d).toFixed(2));
console.log('');

const FAN = fanWidth(50);
let totalWaves = 0;
let totalOver = 0;
let totalImpossible = 0;

for (const kind of kinds) {
  const level = LEVELS[kind];
  const rows = [];
  for (const wave of level.waves) {
    const { span, hull, depth, gap, radius } = widthOf(wave);
    const over = span > FAN;
    // The gap this wave would need for its outermost CENTRES to sit inside the fan, and the clear
    // air between hulls that implies. Negative air means overlapping bodies.
    const neededGap = wave.count > 1 ? FAN / (wave.count - 1) : Infinity;
    const neededAir = neededGap - 2 * radius;
    rows.push({ wave, span, hull, depth, gap, over, neededAir });
    totalWaves += 1;
    if (over) totalOver += 1;
    if (over && neededAir < 0) totalImpossible += 1;
  }

  const over = rows.filter((r) => r.over);
  const impossible = over.filter((r) => r.neededAir < 0);
  const deepest = rows.reduce((a, b) => (b.depth > a.depth ? b : a), rows[0]);
  // ⚠️ A COLUMN IS THE DEEPEST THING IN THE GAME AND ALWAYS WAS — six abreast at ALONG_GAP is 70
  // units before 0202 and 70 units after it, because a column never folds. Reporting only the
  // headline number would credit this change with a cost it did not add, so the folded maximum is
  // printed separately: that one IS 0202's, and it is the number to argue about.
  const folded = rows.filter((r) => r.wave.formation !== 'column' && r.wave.count > abreastCap(r.gap));
  console.log('── %s — %d waves, %d wider than the fan, %d of those need OVERLAPPING hulls',
    kind, rows.length, over.length, impossible.length);
  console.log('   deepest overall: %s×%d %s at %s units = %s beats',
    deepest.wave.enemy, deepest.wave.count, deepest.wave.formation,
    deepest.depth.toFixed(1), beatsFor(deepest.depth).toFixed(2));
  if (folded.length > 0) {
    const worst = folded.reduce((a, b) => (b.depth > a.depth ? b : a), folded[0]);
    console.log('   %d fold into ranks; deepest folded: %s×%d %s at %s units = %s beats',
      folded.length, worst.wave.enemy, worst.wave.count, worst.wave.formation,
      worst.depth.toFixed(1), beatsFor(worst.depth).toFixed(2));
  } else {
    console.log('   none fold into ranks');
  }

  for (const r of over) {
    console.log(
      '   %s×%d %s   span %s  hull %s  gap %s  → needs air %s%s',
      r.wave.enemy.padEnd(8),
      r.wave.count,
      r.wave.formation.padEnd(6),
      r.span.toFixed(1).padStart(5),
      r.hull.toFixed(1).padStart(5),
      r.gap.toFixed(1).padStart(4),
      r.neededAir.toFixed(2).padStart(6),
      r.neededAir < 0 ? '  ← IMPOSSIBLE, bodies overlap' : '',
    );
  }
  console.log('');
}

console.log('TOTAL  %d waves, %d over the %s fan, %d of those cannot be re-spaced at any legible size',
  totalWaves, totalOver, FAN.toFixed(2), totalImpossible);
