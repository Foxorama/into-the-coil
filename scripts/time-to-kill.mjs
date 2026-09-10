// How long each gun takes to kill something, in SECONDS, driven through the real frame.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/time-to-kill.mjs
//   … scripts/time-to-kill.mjs --enemies      every enemy kind at its own health, at the top tier
//   … scripts/time-to-kill.mjs --voids        how much of a volley a void blast eats
//
// ⚠️ IT EXISTS BECAUSE A REPORT ARRIVED THAT NOTHING IN THE REPOSITORY COULD ANSWER — *"did the
// damage decrease, feels like they need a slightly higher damage […] there were other things that
// took a bit longer to die as well compared to lightning or auto-fire gun."* Nothing measured how
// long anything takes to die. `tests/combat.test.ts` counts HITS, which is a different question: a
// gun that lands two hits a second and one that lands six both "take three hits".
// docs/decisions/0027-measure-the-picture-not-the-model.md — build the instrument first.
//
// ⚠️ AND IN SECONDS RATHER THAN IN STEPS OR HITS, which is the whole point. *"Takes a bit longer to
// die"* is a claim about a clock. The sim is a fixed 60Hz (0022), so steps convert exactly — but
// nothing was doing the conversion, and nothing was counting the steps.
//
// ⚠️ IT DRIVES `GameFrame`, NEVER A MODEL OF IT. Fire rate, spread, barrels, links, reach, the
// blade's orbit and every miss are in the number because the real frame produced it. A DPS figure
// computed from `damage × shots ÷ fireEvery` would say the blade is fine, and the blade's whole
// problem is whether it is anywhere near the thing it is meant to be killing.
//
// ⚠️ AND IT IS A MATRIX OVER DISTANCE, WHICH IS THE HALF A SINGLE NUMBER HIDES. The pulse fires up
// the lane, the arc jumps to what is in reach, and the shuriken orbits the ship at `coil` — so
// "how long to kill" has no answer that is not also "from how far away". A blade cannot hurt
// anything outside its own orbit at any rate at all.

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { WEAPONS, WEAPON_KINDS } from '../src/content/weapons.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { SHOTS } from '../src/content/shots.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { reset } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from '../tests/world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;
/** The sim's own rate — 0022. Steps convert to seconds and nothing here guesses. */
const HZ = 60;
/** The measuring window: long enough to average out a slow cadence, short enough to run 90 cells. */
const WINDOW = 5 * HZ;
/** More health than any window can remove, so nothing dies and a cull can never read as a kill. */
const UNKILLABLE = 100000;

const has = (flag) => process.argv.includes(`--${flag}`);

/** A world with one gun fitted at `tier`, firing, with the missiles silenced. */
function armed(kind, tier) {
  const built = playableWorld(NO_LEVEL);
  const carried = [];
  for (let i = 0; i < tier; i++) carried.push('weapon');
  built.world.weapon = weaponFor(built.world.shipRow, carried, kind);
  wearHull(built.world);
  built.world.fireIn = 1;
  built.world.missileIn = NEVER;
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** A body `ahead` of the ship and `aside` across it, that holds its place and never shoots. */
function target(world, ahead, aside, health, row = ENEMIES.turret, kindIndex = world.enemyKinds.turret) {
  const enemy = world.enemies.spawn();
  if (enemy === null) throw new Error('the enemy pool is full');
  reset(enemy, world.ship.along + ahead, world.ship.across + aside, { ...row, health }, kindIndex);
  enemy.fireIn = NEVER;
  enemy.velAlong = 0;
  return enemy;
}

/**
 * Damage a gun lands per second on a body held `ahead` of the ship.
 *
 * ⚠️ **IT MEASURES DAMAGE OVER A WINDOW RATHER THAN TIMING A DEATH, AND THE FIRST DRAFT TIMED A
 * DEATH AND WAS MEASURING THE SCROLL.** A body pinned at an ABSOLUTE place falls behind the camera
 * and is culled by `stepEntities`, which empties the pool exactly as a kill does — so *time to kill*
 * came back as 2.35s at four units for **every gun at every tier**, which is the camera's clock and
 * not any gun's. Identical numbers down a column are what gave it away.
 *
 * Two things fix it and both matter:
 *
 * 1. **The body is held `ahead` of the SHIP every step**, so it keeps station with the player
 *    instead of being left behind. That is also the honest bench — an enemy the player is flying at.
 * 2. **Nothing is allowed to die.** The target carries far more health than the window can remove,
 *    so the pool never empties and a cull can never be read as a kill. What is reported is health
 *    lost, which is the quantity the question is actually about.
 */
function damagePerSecond(kind, tier, ahead, aside = 0, row, kindOf) {
  const { world, frame } = armed(kind, tier);
  const enemy = target(world, ahead, aside, UNKILLABLE, row, kindOf?.(world));
  const across = enemy.across;
  const start = enemy.health;
  for (let step = 1; step <= WINDOW; step++) {
    frame.step();
    /*
      ⚠️ **THE TARGET CANNOT DIE, SO AN EMPTY POOL IS A BROKEN FIXTURE AND NOT A RESULT.** It throws
      rather than returning `null`, because `null` also means *this gun never touched it* — and the
      first draft of this file conflated a cull with a kill for exactly one step too long. Two causes
      behind one symbol is how that happened; they get different symbols now.
    */
    if (world.enemies.size === 0) throw new Error(`the target was culled at ${ahead}u — the fixture is measuring the camera`);
    enemy.along = world.ship.along + ahead;
    enemy.prevAlong = enemy.along;
    enemy.across = across;
    enemy.prevAcross = across;
    enemy.velAlong = 0;
    enemy.velAcross = 0;
    enemy.invulnFor = 0;
  }
  return ((start - enemy.health) * HZ) / WINDOW;
}

/** Seconds to remove `health`, or `null` where the gun cannot reach at all. */
function secondsToKill(dps, health) {
  return dps === null || dps <= 0 ? null : health / dps;
}

/**
 * Where a body might be, near the ship: a grid of the near field.
 *
 * ⚠️ **ONE SAMPLE POINT IS NOT AN ANSWER FOR THE BLADE, AND THE FIRST MATRIX PROVED IT.** A shuriken
 * spirals around the ship, so it crosses the ship's own centreline only at the radii its coil
 * happens to be passing through — and a target parked exactly ahead came back as *never touched* at
 * 4u and 20u while being killed at 2u, 8u and 30u. That scatter is the sampling, not the gun.
 * A mean over a grid is what *an enemy somewhere in front of you* actually means.
 */
const NEAR_FIELD = [];
for (const ahead of [3, 5, 7, 9, 12, 16, 22]) for (const aside of [0, 3, 6, 10]) NEAR_FIELD.push([ahead, aside]);

/** Mean damage a second over the near field — the one number per gun per rung. */
function nearFieldDps(kind, tier) {
  let total = 0;
  for (const [ahead, aside] of NEAR_FIELD) total += damagePerSecond(kind, tier, ahead, aside) ?? 0;
  return total / NEAR_FIELD.length;
}

/** Seconds, or an em dash where the gun never touched it. */
const secs = (s) => (s === null ? '—' : `${s.toFixed(2)}s`);

/**
 * What one hit of `kind` is worth at `tier`.
 *
 * ⚠️ **`weight` IS A MULTIPLE OF THE SHOT ROW'S DAMAGE, NOT A DAMAGE** — `src/content/weapons.ts`
 * says so: *"a bolt buys links and weight instead, and its damage is `SHOTS[shot].damage ×
 * weight[tier]`, never a number that keeps going."* Read as a damage it would say the blade hits for
 * one at every rung, which is the shape of mistake this whole instrument exists to stop.
 */
const hitOf = (kind, tier) => SHOTS[WEAPONS[kind].shot].damage * WEAPONS[kind].weight[tier];

if (has('voids')) {
  /*
    ⚠️ **THE OTHER HALF OF THE REPORT** — *"I'm not sure it's shuriken damage or void's eating
    damage."* 0291 gave a void blast an appetite: it swallows the player's fire until it bursts. That
    is damage that never reaches the boss, and it is invisible to any count of what a gun puts out.
  */
  const row = SHOTS.void;
  console.log('A VOID BLAST EATS\n');
  console.log(`  appetite            ${row.health} points of the player's fire`);
  for (const kind of WEAPON_KINDS) {
    const hit = hitOf(kind, WEAPONS[kind].weight.length - 1);
    console.log(`  ${kind.padEnd(10)} ${String(hit).padEnd(4)} a hit → ${Math.ceil(row.health / hit)} hit(s) spent on one blast`);
  }
  console.log(`\n  the serpent's health  ${BOSSES.jormungandr.health}`);
  process.exit(0);
}

if (has('enemies')) {
  const tier = WEAPONS.pulse.weight.length - 1;
  console.log(`EVERY ENEMY AT ITS OWN HEALTH, top tier, 8 units ahead, in seconds\n`);
  console.log(`${'enemy'.padEnd(12)}${'hp'.padStart(3)}   ${WEAPON_KINDS.map((k) => k.padStart(8)).join('')}`);
  for (const kind of ENEMY_KINDS) {
    const row = ENEMIES[kind];
    const cells = WEAPON_KINDS.map((w) =>
      secs(
        secondsToKill(damagePerSecond(w, tier, 8, row, (world) => world.enemyKinds[kind]), row.health),
      ).padStart(9),
    );
    console.log(`${kind.padEnd(12)}${String(row.health).padStart(3)}   ${cells.join('')}`);
  }
  process.exit(0);
}

/*
  The default: a matrix over tier and distance, against one standard body, so the three guns are
  compared on the one axis that separates them.
*/
const DISTANCES = [2, 4, 6, 8, 11, 14, 20, 30];
const HEALTH = 6;
console.log(`TIME TO KILL a ${HEALTH}-health body held ahead of the ship, in seconds`);
console.log(`measured as damage landed over ${WINDOW / HZ}s through the real frame; — means the gun never touched it\n`);
for (const kind of WEAPON_KINDS) {
  const w = WEAPONS[kind];
  console.log(
    `${kind.toUpperCase()}   coil ${JSON.stringify(w.coil)}  reach ${JSON.stringify(w.reach)}  ` +
      `hit ${w.weight.map((_unused, t) => hitOf(kind, t)).join(',')}  every ${JSON.stringify(w.fireEvery)}`,
  );
  console.log(`  ${'tier'.padEnd(6)}${DISTANCES.map((d) => `${d}u`.padStart(9)).join('')}${'NEAR FIELD'.padStart(13)}`);
  for (let tier = 0; tier < w.weight.length; tier++) {
    const cells = DISTANCES.map((d) => secs(secondsToKill(damagePerSecond(kind, tier, d), HEALTH)).padStart(9));
    const mean = secs(secondsToKill(nearFieldDps(kind, tier), HEALTH)).padStart(13);
    console.log(`  ${String(tier).padEnd(6)}${cells.join('')}${mean}`);
  }
  console.log();
}

/*
  ⚠️ **THE COMPARISON THE REPORT IS ABOUT**, on the near-field mean rather than on any one point:
  what an upgrade actually buys each gun, from a bare ship to a full one.
*/
console.log('WHAT THE LADDER BUYS  — near-field mean, tier 0 against the cap\n');
for (const kind of WEAPON_KINDS) {
  const bare = nearFieldDps(kind, 0);
  const full = nearFieldDps(kind, WEAPONS[kind].weight.length - 1);
  console.log(
    `  ${kind.padEnd(10)} ${bare.toFixed(1).padStart(5)} → ${full.toFixed(1).padStart(6)} damage a second` +
      `   ×${(full / bare).toFixed(1)}`,
  );
}
