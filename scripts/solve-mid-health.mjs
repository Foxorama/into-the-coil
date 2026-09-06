// What health each mid-boss needs to be fought for as long as its level says.
//
// Usage:  node --experimental-transform-types --import ./scripts/ts.mjs scripts/solve-mid-health.mjs
//
// ⚠️ **THE NUMBERS IN `src/content/bosses.ts` ARE THIS SCRIPT'S OUTPUT, NOT A HAND'S GUESS** —
// docs/decisions/0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md, on the pattern
// scripts/solve-hold.mjs already sets for the music's loudness. A mid-boss's health is not a thing
// anybody can reason about directly: what the player experiences is how long the fight takes, and
// the map from one to the other runs through how much of their fire actually lands on that
// particular hull — which varies FOUR-FOLD across the seven and runs inversely to how fast the hull
// moves across the lane. The redoubt has more health than the lattice and dies in a third of the
// time.
//
// So the ladder is authored in SECONDS (`MID_BOSS_SECONDS` in `src/content/bosses.ts`) and the
// health is solved against the real frame. Re-run it after anything that changes what the player's
// guns do, or what the waves in front of a mid-boss absorb.
//
// ⚠️ **ONE RUNG, because that is the loadout a mid-boss is met with** — a level authors one weapon
// near its start and one missile a fifth of the way in (0256), and the fight's own drop comes out of
// it rather than into it.
//
// It exits non-zero if any level's mid-boss is not fought, on the same terms as its siblings: an
// instrument that measured nothing must not report success.

import { BOSSES, MID_BOSS_SECONDS } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { weighFight } from './weigh-fight.mjs';

/** The loadout the fight is met with — the same one `tests/fight.test.ts` measures at. */
const AT_THE_MID_BOSS = { weaponTier: 1, missileTier: 1 };

let unfought = 0;
console.log('level        mid-boss       want   measured   health now   health wanted');
for (const kind of LEVEL_KINDS) {
  const level = LEVELS[kind];
  if (level.midBoss === null) continue;
  const row = BOSSES[level.midBoss.kind];
  const want = MID_BOSS_SECONDS[level.midBoss.kind];
  const r = weighFight(kind, AT_THE_MID_BOSS);
  if (!r.fought) {
    unfought++;
    continue;
  }
  /*
    ⚠️ **A STRAIGHT RATIO, and it is deliberately not solved to convergence.** Damage landed a second
    is not quite constant across a fight — the phases change `patrolScale`, so a hull with less health
    spends its time in a different mix of phases and is a slightly different target — so one pass
    lands within a second or two and a second pass closes it. Iterating here would hide that the map
    is approximate; running the script twice does not.
  */
  const wanted = Math.round((row.health * want) / r.during.seconds);
  console.log(
    `${kind.padEnd(12)} ${level.midBoss.kind.padEnd(13)} ${String(want).padStart(3)}s   ` +
      `${r.during.seconds.toFixed(0).padStart(5)}s   ${String(row.health).padStart(8)}   ${String(wanted).padStart(12)}`,
  );
}
if (unfought > 0) {
  console.error(`\n${unfought} level(s) never fought their mid-boss — this solved nothing for them.`);
  process.exit(1);
}
