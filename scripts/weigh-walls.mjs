// How much of every curtain the field actually receives — `docs/decisions/0333-a-wall-arrives-whole.md`.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-walls.mjs
//   … scripts/weigh-walls.mjs --apart=90,150,210     try other floors without editing the row
//
// ⚠️ IT EXISTS BECAUSE A WALL CAN ARRIVE BROKEN AND NOTHING ANYWHERE SAYS SO. `throwCurtain` drops
// the shots a full pool cannot hold — deliberately, per `src/sim/pool.ts` — and every guard about the
// curtain drives ONE throw into an empty pool. In a real fight under a fast gun the pool is not empty:
// measured before 0333, 53% of all wall shots never reached the field and thirteen of seventeen walls
// arrived with holes nobody authored. `docs/decisions/0027-measure-the-picture-not-the-model.md`: the
// model was green, the picture was a fan.
//
// ⚠️ AND IT COUNTS WHAT THE POOL RECEIVED AGAINST WHAT THE ROW IMPLIES, never against `throwCurtain`'s
// own arithmetic re-run — the count comes off `curtainSpacing` and the row, which is where a hand
// would read it.

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { WEAPON_KINDS } from '../src/content/weapons.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { curtainSpacing, curtainStance } from '../src/app/boss.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { playableWorld } from '../tests/world.ts';

const HZ = 60;
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
// ⚠️ `Number('')` is 0, so an unfiltered empty string here silently drives every row at a floor of
// ZERO and reports the defect as though it were still there. Split on the non-empty pieces only.
const aparts = arg('apart', '')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s !== '')
  .map(Number)
  .filter((n) => Number.isFinite(n));

/** The level that sends a boss, so the fixture is the level rather than a hand-built one. */
function levelFor(boss) {
  // A mid-boss is sent by `midBoss` and an end boss by `boss`; either way what is wanted here is the
  // PLACE it is fought in, so the skin and the bullet are the ones a player sees.
  const kind =
    LEVEL_KINDS.find((k) => LEVELS[k].boss === boss) ??
    LEVEL_KINDS.find((k) => LEVELS[k].midBoss !== null && LEVELS[k].midBoss.kind === boss) ??
    LEVEL_KINDS[0];
  return { waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: [{ at: 0, section: 'run' }], boss, theme: LEVELS[kind].theme };
}

function armed(boss, kind, tier, tierName) {
  const built = playableWorld(levelFor(boss), tierName);
  const carried = [];
  for (let i = 0; i < tier; i++) carried.push('weapon');
  built.world.weapon = weaponFor(built.world.shipRow, carried, kind);
  wearHull(built.world);
  built.world.fireIn = 1;
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** How many shots the row implies a curtain of this stance puts on the field. */
function wanted(uncoil, stance, span) {
  const spacing = curtainSpacing(uncoil.gap);
  const length =
    stance === 'across' || stance === 'astern'
      ? ACROSS_SPAN
      : stance === 'slant' || stance === 'backslant'
        ? ACROSS_SPAN * Math.SQRT2
        : stance === 'rakeNear' || stance === 'rakeFar'
          ? Math.hypot(span, 30)
          : span;
  const count = Math.round(length / spacing);
  const hole = (uncoil.at / ACROSS_SPAN) * length;
  const clear = uncoil.hole / 2;
  let n = 0;
  for (let i = 0; i <= count; i++) {
    const s = spacing * i;
    if (s <= hole - clear || s >= hole + clear) n++;
  }
  return n;
}

function fight(boss, kind, tier, tierName) {
  const uncoil = BOSSES[boss].uncoil;
  const { world, frame } = armed(boss, kind, tier, tierName);
  for (let i = 0; i < 1500 && world.bossPool.size === 0; i++) frame.step();
  if (world.bossPool.size === 0) return null;
  let steps = 0;
  const walls = [];
  let last = world.bossUncoilAt;
  while (world.bossPool.size > 0 && steps < 120 * HZ) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = 999;
    const before = world.enemyShots.size;
    frame.step();
    if (world.bossPool.size === 0) break;
    steps++;
    /*
      ⚠️ **A COUNT THAT MOVED IS NOT A WALL THAT WAS THROWN, AND THE FIRST DRAFT OF THIS COUNTED
      BOTH.** 0150's bared window eats notches without throwing anything (0151), so the axis and the
      chorus each reported three walls that had never existed and a 60% loss that was the window. A
      throw is a count that moved AND a pool that grew by more than a fan can put in it.

      ⚠️ **`got` CARRIES THE FAN'S OWN SHOTS WHERE A VOLLEY LANDS ON THE SAME STEP** — at most seven,
      which biases this toward reporting LESS loss than there is. That is the safe direction for a
      guard's number and it is why the floor is sized with room rather than to the digit.
    */
    const grew = world.enemyShots.size - before;
    if (world.bossUncoilAt > last) {
      if (grew > 10) {
        const stance = curtainStance(uncoil.spin, world.bossUncoilAt - 1);
        const span = world.bossPool.at(0).along - world.cameraAlong;
        walls.push({ got: grew, want: wanted(uncoil, stance, span), stance });
      }
      last = world.bossUncoilAt;
    }
  }
  const lost = walls.reduce((a, w) => a + Math.max(0, w.want - w.got), 0);
  const total = walls.reduce((a, w) => a + w.want, 0);
  return { steps, walls, short: walls.filter((w) => w.got < w.want - 2), lost, total };
}

const uncoilers = BOSS_KINDS.filter((k) => BOSSES[k].uncoil !== null);
const tiers = [DIFFICULTY_KINDS[0], DIFFICULTY_KINDS[DIFFICULTY_KINDS.length - 1]];

for (const apart of aparts.length > 0 ? aparts : [null]) {
  if (apart !== null) for (const k of uncoilers) BOSSES[k].uncoil.apart = apart;
  console.log(`\n== apart ${apart ?? uncoilers.map((k) => BOSSES[k].uncoil.apart).join('/')} steps ==`);
  for (const boss of uncoilers) {
    for (const tierName of tiers) {
      for (const kind of WEAPON_KINDS) {
        for (const tier of [1, 4]) {
          const r = fight(boss, kind, tier, tierName);
          if (r === null || r.walls.length === 0) continue;
          const mark = r.short.length > 0 ? ' ***' : '';
          console.log(
            `${boss.padEnd(8)} ${String(tierName).padEnd(10)} ${kind.padEnd(9)} t${tier}  ` +
              `${String(r.walls.length).padStart(2)} walls in ${(r.steps / HZ).toFixed(0)}s  ` +
              `${String(r.short.length).padStart(2)} short  ${((r.lost / Math.max(1, r.total)) * 100).toFixed(0)}% of wall shots lost${mark}`,
          );
        }
      }
    }
  }
}
console.log(`\ntiers: ${tiers.join(', ')} (shotSpeed ${tiers.map((t) => DIFFICULTIES[t].shotSpeed).join(', ')})`);
