// How much of a boss fight the player spends looking at the hurt twin instead of the boss.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-flash.mjs
//   … scripts/weigh-flash.mjs --boss=gyre
//
// ⚠️ IT EXISTS BECAUSE *"you can't see the boss"* HAS BEEN REPORTED THREE TIMES AND NOTHING COUNTED
// IT. docs/decisions/0278-the-flash-is-a-wash.md fixed how STRONG the wash is and left how OFTEN it
// is on; `reports/the-bosses-planned-2026-09-16.md` diagnosed the duty and nothing measured it. What
// this reports is the share of a fight the hull is drawn as `spriteHit`, and the longest single
// stretch of it — which is the quantity the report is actually about.
//
// ⚠️ AND IT IS READ OFF `sprite` RATHER THAN OFF `flashFor`, which is the picture rather than the
// model: `stepEntities` decides what is drawn from two signals, and a guard that read the counter
// would agree with the counter — docs/decisions/0027-measure-the-picture-not-the-model.md.

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { WEAPON_KINDS } from '../src/content/weapons.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { playableWorld } from '../tests/world.ts';

const HZ = 60;
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const only = arg('boss', '');

function levelFor(boss) {
  const kind =
    LEVEL_KINDS.find((k) => LEVELS[k].boss === boss) ??
    LEVEL_KINDS.find((k) => LEVELS[k].midBoss !== null && LEVELS[k].midBoss.kind === boss) ??
    LEVEL_KINDS[0];
  return { waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: [{ at: 0, section: 'run' }], boss, theme: LEVELS[kind].theme };
}

function fight(boss, kind, tier) {
  const built = playableWorld(levelFor(boss));
  const carried = [];
  for (let i = 0; i < tier; i++) carried.push('weapon');
  built.world.weapon = weaponFor(built.world.shipRow, carried, kind);
  wearHull(built.world);
  built.world.fireIn = 1;
  const { world } = built;
  const frame = new GameFrame(world);
  for (let i = 0; i < 1500 && world.bossPool.size === 0; i++) frame.step();
  if (world.bossPool.size === 0) return null;
  const hull = world.bossPool.at(0);
  let steps = 0;
  let washed = 0;
  let run = 0;
  let longest = 0;
  let landings = 0;
  let health = hull.health;
  while (world.bossPool.size > 0 && steps < 120 * HZ) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = 999;
    frame.step();
    if (world.bossPool.size === 0) break;
    steps++;
    if (hull.sprite === hull.spriteHit) {
      washed++;
      run++;
      longest = Math.max(longest, run);
    } else run = 0;
    if (hull.health < health) landings++;
    health = hull.health;
  }
  return { steps, washed, longest, landings };
}

const bosses = only === '' ? Object.keys(BOSSES) : [only];
for (const boss of bosses) {
  for (const kind of WEAPON_KINDS) {
    for (const tier of [1, 4]) {
      const r = fight(boss, kind, tier);
      if (r === null || r.steps === 0) continue;
      console.log(
        `${boss.padEnd(12)} ${kind.padEnd(9)} t${tier}  ` +
          `washed ${String(Math.round((r.washed / r.steps) * 100)).padStart(3)}%  ` +
          `longest wash ${(r.longest / HZ).toFixed(2)}s  ` +
          `landings/s ${(r.landings / (r.steps / HZ)).toFixed(1)}  over ${(r.steps / HZ).toFixed(0)}s`,
      );
    }
  }
}
