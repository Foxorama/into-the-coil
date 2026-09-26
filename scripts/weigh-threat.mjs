// How hard a boss is to STAND IN FRONT OF, and whether its adds ever arrive.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-threat.mjs
//        [bossKind …] [--difficulty=savior] [--tier=4] [--sweep=6]
//
// --sweep=N flies the ship across 30% of the lane either side of each place over N seconds instead of
// parking it — 0373: on a boss that stalks the player's lane, a parked ship is a case that never
// happens, and every add spat from its mouth is spat into the stream.
//
// ⚠️ THE OTHER HALF OF `scripts/weigh-boss.mjs`, AND IT WAS ASKED FOR BY A QUESTION THAT INSTRUMENT
// CANNOT ANSWER. weigh-boss makes the ship unhittable on purpose — *"a death is a respawn and a lost
// rung, which would measure the pilot"* — so its seconds-to-kill say how fast a boss can DIE and
// nothing about how hard it is to stand there. Asked, of the fish's sixteen seconds: *"is the
// measurement based on the player sitting in one spot? that possibly highlights the fish has no direct
// forward facing attacks, whereas the other bosses keep blowing up the ship."* It did, and it does.
// docs/decisions/0027-measure-the-picture-not-the-model.md: the instrument first.
//
// ⚠️ IT FLIES THE SAME FIFTEEN FIXED PLACES weigh-boss does, so the two tables are about one fight.
// The ship is still unhittable — what is counted is every step something hostile is INSIDE its
// hurtbox, without acting on it, so the fight is the same fight and the number is what a player who
// never moved would have taken.
//
// WHAT IT PRINTS, per boss and per gun
//
//   hits a second   rising edges of *something is on the ship*, over the fight, as median/best/worst
//                   of the fifteen. A boss nothing lands on is a boss the player never has to move for.
//   the adds        how many the escorts and summons called, and how many shots those adds got away
//                   before they died or passed — 0373. It was *how many reached the boss* while the
//                   shoal fed the fish (0314); the shoal is spat at the player now, and what an add
//                   is FOR is measured by whether it ever fires.
//
// ⚠️ THE BOSS'S HEALTH IS NOT PINNED, so a phase is reached by fighting to it and the adds counted are
// the ones a real fight calls. A fixture that pinned it would count calls its own pin keeps making,
// which is the shape of the first draft of this file and is why it says so here.

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { WEAPON_KINDS } from '../src/content/weapons.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from '../tests/world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;
/** Ten minutes, as weigh-boss's cap is: a fight longer than this is not a fight. */
const CAP_SECONDS = 600;
/** The same five lanes and three distances weigh-boss flies, so the two tables describe one fight. */
const LANES = [20, 35, 50, 65, 80];
const DISTANCES = [null, 60, 45];

/** The boss alone at the end of a short level in its own place — weigh-boss's arena. */
function arena(kind) {
  const home = LEVEL_KINDS.find((level) => LEVELS[level].boss === kind);
  if (home === undefined) throw new Error(`${kind} is no level's end boss`);
  return { waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: kind, theme: LEVELS[home].theme };
}

/**
 * Is anything hostile inside the ship's hurtbox right now?
 *
 * ⚠️ **EVERY POOL THE SHIP IS PAIRED WITH IN `src/app/frame.ts`, AND NOTHING ELSE.** A list that
 * drifted from that one would report a threat the game does not have, or miss one it does.
 */
function touching(world) {
  const ship = world.ship;
  const reach = ship.radius * world.tuning.hurtbox;
  for (const pool of [world.enemyShots, world.enemies, world.bossPool, world.bossBody, world.blasts]) {
    for (let i = 0; i < pool.size; i++) {
      const e = pool.at(i);
      if (Math.hypot(e.along - ship.along, e.across - ship.across) <= reach + e.radius) return true;
    }
  }
  return false;
}

/**
 * One fight, flown from one fixed place.
 *
 * @returns hits a second on the parked ship, how many adds were called, and how many reached the boss.
 */
export function flyThreat(kind, gun, { tier = 4, difficulty = 'savior', lane = 50, short = null, cap = CAP_SECONDS, sweep = 0 } = {}) {
  // `authored` is the content multiplied by nothing, which is no tier's button — 0356.
  const { world } = playableWorld(arena(kind), difficulty === 'authored' ? undefined : difficulty);
  const frame = new GameFrame(world);
  const carried = [];
  for (let i = 0; i < tier; i++) carried.push('weapon');
  world.weapon = weaponFor(world.shipRow, carried, gun);
  wearHull(world);
  let start = -1;
  let steps = 0;
  let hits = 0;
  let was = false;
  let called = 0;
  let standing = 0;
  let fired = 0;
  let shotsBefore = 0;
  /** The step each live add appeared on, and how many steps each finished one lasted. */
  const born = new Map();
  const lived = [];
  for (let step = 0; step < cap * STEPS_PER_SECOND + 3000; step++) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = NEVER;
    world.missileIn = NEVER;
    if (world.bossPool.size > 0 && world.bossEntering < 0) {
      const boss = world.bossPool.at(0);
      if (start < 0) start = step;
      if (step - start > cap * STEPS_PER_SECOND) break;
      world.ship.prevAcross = world.ship.across;
      /*
        ⚠️ **PARKED, OR SWEEPING — 0373.** A parked ship is the worst case for a boss's adds by
        construction, and on a boss that stalks the player's lane (0258) it is a case that never
        happens: the mouth sits in the player's own fire and everything spat from it is spat into the
        stream. `sweep` is `scripts/weigh-presence.mjs`'s pilot — the ship crossing 30% of the lane
        either side of its place over `sweep` seconds — so the fish is chasing, and the mouth trails.
      */
      world.ship.across = sweep > 0 ? lane + Math.sin(((step - start) / (sweep * STEPS_PER_SECOND)) * Math.PI * 2) * ACROSS_SPAN * 0.3 : lane;
      if (short !== null) {
        world.ship.prevAlong = world.ship.along;
        world.ship.along = boss.along - boss.radius - short;
      }
    }
    frame.step();
    if (start >= 0) {
      steps++;
      const now = touching(world);
      if (now && !was) hits++;
      was = now;
      // A pool that grew held a call.
      if (world.enemies.size > standing) called += world.enemies.size - standing;
      standing = world.enemies.size;
      // And how long each add lived, keyed by the pooled entity: a body that is gone this step is done.
      const alive = new Set();
      for (let i = 0; i < world.enemies.size; i++) {
        const add = world.enemies.at(i);
        alive.add(add);
        if (!born.has(add)) born.set(add, step);
      }
      for (const [add, at] of born) {
        if (alive.has(add)) continue;
        lived.push(step - at);
        born.delete(add);
      }
      /*
        ⚠️ **AN ADD'S SHOT IS ATTRIBUTED BY WHERE IT APPEARED — 0373**, on `scripts/weigh-presence.mjs`'s
        own terms: `fireEnemies` places every volley on the body's along exactly, so a shot that came
        into being within a hull of a live add is that add's. A boss is not in the enemy pool, so its
        own fan cannot be counted here; what this column answers is whether a spat horde ever gets a
        shot away, which *"the adds are trash"* was about. It replaces a feed count that counted
        0314's minnows being eaten, which nothing does any more.
      */
      for (let i = shotsBefore; i < world.enemyShots.size; i++) {
        const shot = world.enemyShots.at(i);
        for (let k = 0; k < world.enemies.size; k++) {
          const add = world.enemies.at(k);
          if (Math.hypot(add.along - shot.along, add.across - shot.across) <= add.radius + shot.radius + 1) {
            fired++;
            break;
          }
        }
      }
      shotsBefore = world.enemyShots.size;
    }
    if (start >= 0 && world.bossPool.size === 0) break;
  }
  const seconds = steps / STEPS_PER_SECOND;
  const sorted = [...lived].sort((a, b) => a - b);
  const livedMedian = sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)] / STEPS_PER_SECOND;
  return { seconds, hits: seconds === 0 ? 0 : hits / seconds, called, fired, lived: livedMedian };
}

const isMain = process.argv[1] !== undefined && /weigh-threat\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (name, fallback) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit === undefined ? fallback : hit.slice(name.length + 3);
  };
  const named = args.filter((a) => !a.startsWith('--'));
  const kinds = named.length > 0 ? named : LEVEL_KINDS.map((level) => LEVELS[level].boss);
  const difficulty = flag('difficulty', 'savior');
  const tier = Number(flag('tier', 4));
  const sweep = Number(flag('sweep', 0));
  const mid = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  console.log(`hits a second on a ${sweep > 0 ? `ship SWEEPING the lane every ${sweep}s` : 'PARKED ship'} — ${difficulty}, tier ${tier}, missiles silenced, ship unhittable`);
  for (const kind of kinds) {
    for (const gun of WEAPON_KINDS) {
      const runs = [];
      for (const lane of LANES) for (const short of DISTANCES) runs.push(flyThreat(kind, gun, { tier, difficulty, lane, short, sweep }));
      const hits = runs.map((r) => r.hits).sort((a, b) => a - b);
      const adds = mid(runs.map((r) => r.called));
      const got = mid(runs.map((r) => r.fired));
      const lived = mid(runs.map((r) => r.lived));
      console.log(
        `  ${kind.padEnd(13)} ${gun.padEnd(9)} ${mid(runs.map((r) => r.seconds)).toFixed(0).padStart(4)}s   ` +
          `median ${hits[Math.floor(hits.length / 2)].toFixed(2)}   best ${hits[0].toFixed(2)}   worst ${hits[hits.length - 1].toFixed(2)}` +
          (adds > 0 ? `   adds: ${adds} called, ${got} shots fired by them, one lives ${lived.toFixed(1)}s` : ''),
      );
    }
  }
}
