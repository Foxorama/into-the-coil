// What the field is carrying while a mid-boss is on it.
//
// Usage:  node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-fight.mjs
//              [levelKind] [--weapon=1] [--missiles=1] [--sweep=8]
//
// ⚠️ THE INSTRUMENT FOR THE MID-BOSS WAVE ITEM, built before the tuning pass on it —
// docs/decisions/0027-measure-the-picture-not-the-model.md. Reported: *"when the minibosses are on
// screen there are way too many waves in general happening and it's a lot… spread the waves out so a
// few bullet firing waves happen before miniboss and some after miniboss and less during."*
//
// ⚠️ IT IS A SIBLING OF scripts/weigh-bullets.mjs AND NOT A FLAG ON IT, because that script puts the
// mid-boss to one health on purpose — *"the fight is not what this measures"* — and the fight is the
// whole of what this one measures. Two questions, two rigs; sharing one would mean a flag that
// changes what every number in the other script means.
//
// ⚠️ THE FIGHT'S LENGTH IS THE PLAYER'S, WHICH IS THE POINT. A wave's `at` is a PLACE and a fight's
// length is a DURATION set by the loadout, so the number of waves that land on a fight is not a
// thing a level can author: the camera never stops (`w.cameraAlong += w.scrollPerStep` runs every
// step, boss or no boss), so a slow kill drags more of the script across the fight than a fast one.
// The default loadout is ONE rung of each, because that is what a player carries at the mid-boss —
// a level authors one weapon near its start (0256) and the mid-boss's own drop comes after the
// fight, not before it.
//
// WHAT IT PRINTS, per level
//
//   before / during / after   the three stretches, split by whether the mid-boss is on the field
//   seconds                   how long each lasted, in the player's units
//   waves                     waves that SPAWNED in the stretch, and how many of them fire
//   alive                     enemies on the field, averaged over the stretch and at its worst
//   bullets                   the share of the stretch with an enemy bullet on the screen
//
// It exits non-zero if a level's mid-boss is never fought, on the same terms as its sibling: an
// instrument that measured nothing must not report success.

import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { GameFrame, wearHull } from '../src/app/frame.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld } from '../tests/world.ts';

/** Whether any enemy shot is inside the view this step — the same question `weigh-bullets` asks. */
function bulletOnScreen(world) {
  for (let i = 0; i < world.enemyShots.size; i++) {
    const s = world.enemyShots.at(i);
    const inView = s.along - world.cameraAlong;
    if (inView >= 0 && inView <= world.view.alongSpan && s.across >= 0 && s.across <= ACROSS_SPAN) return true;
  }
  return false;
}

/** How many enemies are inside the view this step. Bodies, not shots — the report is about waves. */
function aliveOnScreen(world) {
  let n = 0;
  for (let i = 0; i < world.enemies.size; i++) {
    const e = world.enemies.at(i);
    const inView = e.along - world.cameraAlong;
    if (inView >= -e.radius && inView <= world.view.alongSpan + e.radius) n++;
  }
  return n;
}

/**
 * How many enemy hulls crossed the leading edge of the view this step, and how many of those fire.
 *
 * ⚠️ **THIS IS THE QUANTITY THE REPORT IS ABOUT, AND THE FIRST VERSION MEASURED THE WRONG ONE.**
 * Counting the waves the SCRIPT offered says nothing about what the thinning did — the script offers
 * the same waves either way. Counting the enemies ALIVE on the screen is confounded by the fight's
 * length: thin harder, the boss dies sooner, and the average is dominated by whatever was already on
 * screen when the fight opened — measured, the Eye went UP from 7.4 to 8.2 as the thinning got
 * stronger, which reads as the fix making it worse and is an artefact of the window.
 *
 * A RATE is neither. *"Way too many waves happening"* is things arriving per second, and this is the
 * frame's own entry test (`fireEnemies`, 0259) asked from outside: previous edge against the previous
 * view, current edge against the current one, true on exactly one step per body.
 */
function enteringNow(world, out) {
  for (let i = 0; i < world.enemies.size; i++) {
    const e = world.enemies.at(i);
    if (e.along - e.radius > world.cameraAlong + world.view.alongSpan) continue;
    if (e.prevAlong - e.radius <= world.prevCameraAlong + world.view.alongSpan) continue;
    out.entered++;
    if (world.enemyRows[e.kind] !== undefined && world.enemyRows[e.kind].fireEvery > 0) out.enteredFiring++;
  }
}

/** A fresh tally for one stretch of a level. */
function stretch() {
  return { steps: 0, waves: 0, firing: 0, entered: 0, enteredFiring: 0, alive: 0, peak: 0, covered: 0 };
}

const shaped = (s) => ({
  seconds: s.steps / STEPS_PER_SECOND,
  waves: s.waves,
  firing: s.firing,
  entered: s.entered,
  enteredFiring: s.enteredFiring,
  // Per ten seconds rather than per second, because per second is a number with two leading zeros.
  rate: s.steps > 0 ? (s.entered * STEPS_PER_SECOND * 10) / s.steps : 0,
  firingRate: s.steps > 0 ? (s.enteredFiring * STEPS_PER_SECOND * 10) / s.steps : 0,
  alive: s.steps > 0 ? s.alive / s.steps : 0,
  peak: s.peak,
  covered: s.steps > 0 ? s.covered / s.steps : 0,
});

/**
 * One level, driven from its start to its end boss, split three ways by the mid-boss.
 *
 * ⚠️ **THE SHIP IS IMMORTAL AND SWEEPS, exactly as `weigh-bullets`'s does**, so the walk is the same
 * walk and the two scripts' numbers are about one thing. What is different is that the mid-boss
 * keeps its health: the sweep crosses the middle of the lane twice a cycle and the boss holds station
 * there, so the fight ends when the guns end it.
 */
export function weighFight(kind, options = {}) {
  const weaponTier = options.weaponTier ?? 1;
  const missileTier = options.missileTier ?? 1;
  const sweepSeconds = options.sweepSeconds ?? 8;
  const level = LEVELS[kind];
  const { world } = playableWorld(level);
  const frame = new GameFrame(world);
  const carried = [];
  for (let i = 0; i < weaponTier; i++) carried.push('weapon');
  for (let i = 0; i < missileTier; i++) carried.push('missile');
  world.weapon = weaponFor(world.shipRow, carried);
  wearHull(world);

  const fires = (enemy) => ENEMIES[enemy].fireEvery > 0;
  const before = stretch();
  const during = stretch();
  const after = stretch();
  let seen = 0;
  let fought = false;
  // Ten minutes: longer than any level plus a mid-boss fought at one rung, and short enough that a
  // fight the immortal ship somehow cannot win ends the walk rather than hanging it.
  const cap = STEPS_PER_SECOND * 60 * 10;
  let step = 0;
  /*
    ⚠️ **THE WALK ENDS WHEN THE LEVEL IS OUT OF WAVES *AND* THE MID-BOSS IS DEAD.** Stopping at
    `bossAt` alone truncated the two longest fights — the Saurian Belt's and the Labyrinth's ran past
    the end of their own scripts, so `during` reported how far the camera got rather than how long
    the fight took, and the length could not be read off it at all. `fight` is 1 once the mid-boss has
    died (0247), so this is *the level is over* in both of the senses that matter.
  */
  const over = () => world.cameraAlong - world.levelOrigin >= level.bossAt && world.fight === 1;
  while (!over() && step < cap) {
    world.ship.health = world.shipRow.health;
    /*
      ⚠️ **THE SHIP HOLDS THE BOSS'S LANE WHILE THERE IS A BOSS, AND THE FIRST VERSION DID NOT.**
      `weigh-bullets`'s sweep is right for the question that script asks — cover the lane, so the
      guns meet what a player's would — and it is wrong for this one: a ship sinusoiding across the
      lane has the boss in front of it for a fraction of every cycle, so it measures a fight nobody
      fights. At one rung that rig reported an eighty-second fight that outlived the level, which is
      an artefact of the rig and would have been read as a finding about the game.

      A player fighting a mid-boss parks on its lane and holds the trigger. The sweep still runs
      between fights, so what arrives at the fight is what a sweeping ship left alive.
    */
    const fightingNow = world.bossPool.size > 0 && world.fight === 0;
    world.ship.prevAcross = world.ship.across;
    if (fightingNow) {
      world.ship.across = world.bossPool.at(0).across;
    } else if (sweepSeconds > 0) {
      const phase = (step / (sweepSeconds * STEPS_PER_SECOND)) * Math.PI * 2;
      world.ship.across = ACROSS_SPAN / 2 + Math.sin(phase) * (ACROSS_SPAN * 0.35);
    }
    const spawnedBefore = world.nextWave;
    frame.step();
    step++;
    const fighting = world.bossPool.size > 0 && world.fight === 0;
    if (fighting) fought = true;
    const here = fighting ? during : world.fight === 0 ? before : after;
    here.steps++;
    const live = aliveOnScreen(world);
    here.alive += live;
    if (live > here.peak) here.peak = live;
    if (bulletOnScreen(world)) here.covered++;
    enteringNow(world, here);
    for (let i = spawnedBefore; i < world.nextWave; i++) {
      const wave = level.waves[i];
      if (wave === undefined) continue;
      here.waves++;
      if (fires(wave.enemy)) here.firing++;
      seen++;
    }
  }
  return {
    kind,
    midBoss: level.midBoss === null ? null : level.midBoss.kind,
    fought,
    seen,
    before: shaped(before),
    during: shaped(during),
    after: shaped(after),
  };
}

const isMain = process.argv[1] !== undefined && /weigh-fight\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (name, fallback) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit === undefined ? fallback : Number(hit.slice(name.length + 3));
  };
  const named = args.filter((a) => !a.startsWith('--'));
  const kinds = named.length > 0 ? named : LEVEL_KINDS;
  const options = {
    weaponTier: flag('weapon', 1),
    missileTier: flag('missiles', 1),
    sweepSeconds: flag('sweep', 8),
  };
  let unfought = 0;
  for (const kind of kinds) {
    const r = weighFight(kind, options);
    if (r.midBoss === null) {
      console.log(`\n${kind}  — no mid-boss`);
      continue;
    }
    if (!r.fought) unfought++;
    console.log(`\n${kind}  (${r.midBoss}${r.fought ? '' : ', NEVER FOUGHT'})`);
    const row = (name, s) =>
      console.log(
        `  ${name.padEnd(7)} ${s.seconds.toFixed(0).padStart(4)}s   ` +
          `arriving ${s.rate.toFixed(1).padStart(4)}/10s, ${s.firingRate.toFixed(1).padStart(4)} firing   ` +
          `offered ${String(s.firing).padStart(2)}   ` +
          `alive ${s.alive.toFixed(1).padStart(4)} avg   ` +
          `bullets ${(s.covered * 100).toFixed(0).padStart(3)}%`,
      );
    row('before', r.before);
    row('during', r.during);
    row('after', r.after);
  }
  if (unfought > 0) {
    console.error(`\n${unfought} level(s) never fought their mid-boss — this measured nothing about them.`);
    process.exit(1);
  }
}
