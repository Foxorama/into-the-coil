// How hard a boss is to STAND IN FRONT OF, and whether its adds ever arrive.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-threat.mjs
//        [bossKind …] [--difficulty=savior] [--tier=4]
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
//   the adds        how many the escorts and summons called, and how many reached the boss — which is
//                   only ever more than zero for a boss whose adds have somewhere to be (0314).
//
// ⚠️ THE BOSS'S HEALTH IS NOT PINNED, so a phase is reached by fighting to it and the adds counted are
// the ones a real fight calls. A fixture that pinned it would count feeds that are its own pin
// restoring damage, which is the shape of the first draft of this file and is why it says so here.

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
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
export function flyThreat(kind, gun, { tier = 4, difficulty = 'savior', lane = 50, short = null, cap = CAP_SECONDS } = {}) {
  const { world, cues } = playableWorld(arena(kind), difficulty);
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
  let turns = 0;
  let health = null;
  const row = BOSSES[kind];
  for (let step = 0; step < cap * STEPS_PER_SECOND + 3000; step++) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = NEVER;
    world.missileIn = NEVER;
    if (world.bossPool.size > 0 && world.bossEntering < 0) {
      const boss = world.bossPool.at(0);
      if (start < 0) start = step;
      if (step - start > cap * STEPS_PER_SECOND) break;
      world.ship.prevAcross = world.ship.across;
      world.ship.across = lane;
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
      /*
        ⚠️ **A FEED IS COUNTED OFF THE CUE AND NOT OFF THE BOSS'S HEALTH, AND THE FIRST DRAFT OF THIS
        FILE GOT IT WRONG.** `feedTheLord` runs in the same step the player's shots land in, so a boss
        fed 14 while being hit for more is a boss whose health went DOWN — and *health went up* reported
        zero arrivals for a mechanism that was working. 0314 gives a feed the `bossPhase` cue; the only
        other thing that plays it is a phase turning over, and there are at most four of those.
      */
      if (world.bossPool.size > 0) {
        const now = row.phases.indexOf(phaseFor(row, world.bossPool.at(0).health, world.bossFullHealth));
        if (health !== null && now !== health) turns++;
        health = now;
      }
    }
    if (start >= 0 && world.bossPool.size === 0) break;
  }
  const seconds = steps / STEPS_PER_SECOND;
  const rang = cues.filter((c) => c === 'bossPhase').length;
  return { seconds, hits: seconds === 0 ? 0 : hits / seconds, called, arrived: Math.max(0, rang - turns) };
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
  const mid = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  console.log(`hits a second on a PARKED ship — ${difficulty}, tier ${tier}, missiles silenced, ship unhittable`);
  for (const kind of kinds) {
    for (const gun of WEAPON_KINDS) {
      const runs = [];
      for (const lane of LANES) for (const short of DISTANCES) runs.push(flyThreat(kind, gun, { tier, difficulty, lane, short }));
      const hits = runs.map((r) => r.hits).sort((a, b) => a - b);
      const adds = mid(runs.map((r) => r.called));
      const got = mid(runs.map((r) => r.arrived));
      console.log(
        `  ${kind.padEnd(13)} ${gun.padEnd(9)} ${mid(runs.map((r) => r.seconds)).toFixed(0).padStart(4)}s   ` +
          `median ${hits[Math.floor(hits.length / 2)].toFixed(2)}   best ${hits[0].toFixed(2)}   worst ${hits[hits.length - 1].toFixed(2)}` +
          (adds > 0 ? `   adds: ${adds} called, ${got} reached it` : ''),
      );
    }
  }
}
