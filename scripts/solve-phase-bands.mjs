// Where each end boss's phases turn, so every phase is fought for the same time.
//
// Usage:  node --experimental-transform-types --import ./scripts/ts.mjs scripts/solve-phase-bands.mjs [bossKind …]
//
// ⚠️ **THE `upTo` OF QUETZAL'S, VOLANS'S, THE HOARFROST'S AND MEDUSA'S PHASES ARE THIS SCRIPT'S OUTPUT,
// NOT A HAND'S GUESS** — docs/decisions/0386-every-phase-is-fought-for-as-long.md. Asked from play:
// *"it's supposed to be 20% increments, but it feels like each increment goes faster."* A band of
// health is not a length of fight: Quetzal's last two phases were half-bands and were fought for half
// as long, Medusa's fourth was a tenth, and Volans's last ran twice its others. What the player feels is the seconds, so the seconds are what is
// authored — equal — and the bands are solved against the real frame, on the pattern
// scripts/solve-mid-health.mjs sets.
//
// ⚠️ **THE OTHER THREE ARE MEASURED AND NOT MOVED**, because their shares were asked for — and two of
// them already fight even, and the serpent's last phase is its longest: the gyre's wheel rises at the quarters (0332), the hydra grows a head a fifth (0254),
// the serpent's ball comes round below four tenths (0365). Named on the command line, one is solved
// anyway and printed; nothing here writes the content.
//
// HOW. Each gun flies the fight from `scripts/weigh-boss.mjs`'s fifteen held places, and the best of
// them is the fight measured — the one a player who is trying has, and the one weigh-boss splits into
// phases, ending at the kill. Each phase's seconds are made a share of that gun's fight and the three
// guns' shares averaged, so no gun's speed outvotes the others; a band whose share is short of an equal
// one is grown by the square root of the shortfall, and one over it shrunk. Set in memory and flown
// again until no band moves by more than a hundredth — damped, because the best place can change.
//
// ⚠️ **THE AVERAGE WAS OF RATES FIRST, AND THE FASTEST GUN WON IT.** A rate is a band over a share,
// so a gun that spends little of its fight in a phase reports a huge one, and Medusa's last band grew
// on the shuriken's say-so while the pulse spent half again as long in it as in any other.
//
// ⚠️ **THE SHIP CANNOT BE HIT AND THE MISSILES ARE SILENCED**, as in weigh-boss, and for its reasons.
//
// It exits non-zero if any boss is not fought to its end by every gun: an instrument that measured
// nothing must not report success (docs/decisions/0199-a-verdict-is-an-exit-code.md).

import { BOSSES } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { WEAPON_KINDS } from '../src/content/weapons.ts';
import { DISTANCES, LANES, flyFight } from './weigh-boss.mjs';

/** Flown again until no band moves by more than this. */
const SETTLED = 0.01;
const ROUNDS = 10;

/** Each phase's seconds in one gun's best fight, or null if no held place finished it. */
function phaseSeconds(kind, gun) {
  let best = null;
  for (const lane of LANES) {
    for (const short of DISTANCES) {
      const fight = flyFight(kind, gun, { lane, short });
      if (fight.seconds !== null && (best === null || fight.killed < best.killed)) best = fight;
    }
  }
  if (best === null) return null;
  // The fight ends at the kill, not when the wreck leaves: a death is not a phase (weigh-boss says why).
  const n = BOSSES[kind].phases.length;
  const begins = new Array(n).fill(null);
  for (const { phase, at } of best.phaseAt) if (begins[phase] === null) begins[phase] = at;
  // A phase a single hit skipped has no seconds of its own; it is carried as zero and its rate below as its band's.
  const out = [];
  for (let i = 0; i < n; i++) {
    const from = begins[i];
    if (from === null) { out.push(0); continue; }
    let to = best.killed;
    for (let j = i + 1; j < n; j++) if (begins[j] !== null) { to = begins[j]; break; }
    out.push(to - from);
  }
  return out;
}

const bandsOf = (kind) => BOSSES[kind].phases.map((p, i, all) => p.upTo - (all[i + 1]?.upTo ?? 0));

function setBands(kind, bands) {
  let upTo = 1;
  BOSSES[kind].phases.forEach((phase, i) => {
    phase.upTo = Math.round(upTo * 100) / 100;
    upTo -= bands[i];
  });
}

const named = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const kinds = named.length > 0 ? named : LEVEL_KINDS.map((level) => LEVELS[level].boss);
let failed = 0;
for (const kind of kinds) {
  const before = bandsOf(kind);
  let seconds = [];
  for (let round = 0; round < ROUNDS; round++) {
    const bands = bandsOf(kind);
    seconds = WEAPON_KINDS.map((gun) => phaseSeconds(kind, gun));
    if (seconds.some((s) => s === null)) break;
    // Each phase's share of its gun's fight, averaged over the guns; a band is grown by what its share
    // is short of an equal one, and damped by half, because a best place can change with the bands.
    const n = bands.length;
    const share = bands.map((_, i) =>
      seconds.reduce((sum, s) => sum + s[i] / s.reduce((a, b) => a + b, 0), 0) / seconds.length,
    );
    const grown = bands.map((band, i) => band * Math.sqrt(1 / n / Math.max(share[i], 1e-3)));
    const sum = grown.reduce((a, b) => a + b, 0);
    const next = grown.map((b) => b / sum);
    const moved = Math.max(...next.map((b, i) => Math.abs(b - bands[i])));
    setBands(kind, next);
    if (moved <= SETTLED) break;
  }
  if (seconds.some((s) => s === null)) {
    console.log(`\n${kind}: a gun never finished it from any held place, so nothing was solved`);
    failed++;
    continue;
  }
  seconds = WEAPON_KINDS.map((gun) => phaseSeconds(kind, gun));
  const pct = (xs) => xs.map((x) => `${Math.round(x * 100)}`.padStart(3)).join(' ');
  console.log(`\n${kind}`);
  console.log(`  bands before  ${pct(before)}`);
  console.log(`  bands solved  ${pct(bandsOf(kind))}   upTo: [${BOSSES[kind].phases.map((p) => p.upTo).join(', ')}]`);
  WEAPON_KINDS.forEach((gun, g) => {
    const s = seconds[g];
    console.log(`  ${gun.padEnd(9)} phase seconds ${s === null ? 'never' : s.map((x) => x.toFixed(1).padStart(5)).join(' ')}`);
  });
}
if (failed > 0) process.exit(1);
