// What the field is carrying while a mid-boss is on it.
//
// Usage:  node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-fight.mjs
//              [levelKind] [--missiles=1] [--sweep=8] [--gun=pulse|arc|shuriken|ray]
//              [--difficulty=savior] [--carried]
//
// `--difficulty` flies a tier rather than the content multiplied by nothing; `--carried` flies the
// tubes a player who took every pickup carries in, `carriedAt`, rather than one rung — 0472.
//
// A gun is flown in the ship it is keyed to, whole — 0441; `--weapon=N` went with the gun's tiers.
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
//   live                      how MANY enemy bullets are on the screen: the mean over the stretch,
//                             its worst step, and its worst two seconds — 0472
//   worst 2s of the level     where the busiest two seconds of the whole walk fall, as distance
//                             from the mid-boss's `at`
//
// It exits non-zero if a level's mid-boss is never fought, on the same terms as its sibling: an
// instrument that measured nothing must not report success.

import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, MID_BOSS_DROP } from '../src/content/levels.ts';
import { GameFrame, wearHull } from '../src/app/frame.ts';
import { UPGRADE_TIERS, weaponFor } from '../src/content/pickups.ts';
import { SHIPS, shipCarrying } from '../src/content/ships.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld } from '../tests/world.ts';

/**
 * The loadout a player who took every pickup carries into `kind`'s mid-boss — 0406.
 *
 * ⚠️ **READ OFF THE LEVEL SCRIPTS, NEVER WRITTEN DOWN.** 0269 solved every mid-boss at one rung of
 * each, on *"a level authors one weapon near its start"*; but a clear carries the ladders into the
 * next level (0039) and since 0372 a death does not take them either, so from the second level on the
 * mid-boss is met at the cap and its fight ran six to nine seconds against the seventeen to twenty-three
 * its level asks for. Played: *"other bosses were very quick, inc minibosses."* So this walks the run
 * in order — every earlier level's pickups and its mid-boss's drop, then this level's up to its
 * mid-boss — and clamps at the ladder, and a pickup moved in any level moves the answer with it.
 *
 * ⚠️ **THE TUBES ALONE SINCE 0441.** The gun is the ship's, whole from the first second, so what a
 * player carries in that the level can change is the missile ladder.
 *
 * @param {import('../src/content/levels.ts').LevelKind} kind
 * @returns {{ missileTier: number }}
 */
export function carriedAt(kind) {
  let missileTier = 0;
  const take = (pickup) => {
    if (pickup === 'missile') missileTier = Math.min(UPGRADE_TIERS, missileTier + 1);
  };
  for (const level of LEVEL_KINDS) {
    const row = LEVELS[level];
    const midAt = row.midBoss === null ? Number.POSITIVE_INFINITY : row.midBoss.at;
    for (const p of row.pickups) if (level !== kind || p.at < midAt) take(p.kind);
    if (level === kind) return { missileTier };
    if (row.midBoss !== null) for (const p of MID_BOSS_DROP) take(p);
  }
  throw new Error(`${kind} is not a level`);
}

/** Whether any enemy shot is inside the view this step — the same question `weigh-bullets` asks. */
function bulletOnScreen(world) {
  for (let i = 0; i < world.enemyShots.size; i++) {
    const s = world.enemyShots.at(i);
    const inView = s.along - world.cameraAlong;
    if (inView >= 0 && inView <= world.view.alongSpan && s.across >= 0 && s.across <= ACROSS_SPAN) return true;
  }
  return false;
}

/**
 * How MANY enemy shots are inside the view this step — 0472.
 *
 * ⚠️ **A COUNT, BECAUSE THE REPORT IS A COUNT.** *"There's some spots, especially around minibosses,
 * that it's too bullety"*: `bulletOnScreen` answers whether there is anything to dodge, and is near
 * one hundred percent through every fight, so it cannot tell a busy fight from a crowded one.
 */
function bulletsOnScreen(world) {
  let n = 0;
  for (let i = 0; i < world.enemyShots.size; i++) {
    const s = world.enemyShots.at(i);
    const inView = s.along - world.cameraAlong;
    if (inView >= 0 && inView <= world.view.alongSpan && s.across >= 0 && s.across <= ACROSS_SPAN) n++;
  }
  return n;
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
  return { steps: 0, waves: 0, firing: 0, entered: 0, enteredFiring: 0, alive: 0, peak: 0, covered: 0, live: 0, livePeak: 0, window: 0 };
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
  live: s.steps > 0 ? s.live / s.steps : 0,
  livePeak: s.livePeak,
  window: s.window,
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
  const missileTier = options.missileTier ?? 1;
  const sweepSeconds = options.sweepSeconds ?? 8;
  const level = LEVELS[kind];
  const { world } = playableWorld(level, options.difficulty);
  // The tier's boss numbers replaced, for the solver and its guard: they fly the row's health at the
  // tier's toughness, and a tier's `bossToughness` is a stated departure on top of it — 0532.
  if (options.bosses !== undefined) world.difficulty = { ...world.difficulty, bossToughness: options.bosses };
  const frame = new GameFrame(world);
  const carried = [];
  for (let i = 0; i < missileTier; i++) carried.push('missile');
  // The fighter's pulse unless a gun is named, flown in the ship it is keyed to — 0406, 0441.
  if (options.gun !== undefined) world.shipRow = SHIPS[shipCarrying(options.gun)];
  world.weapon = weaponFor(world.shipRow, carried);
  wearHull(world);
  const armed = world.weapon;

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
  // The worst two seconds — 0472: a running sum over a ring of the last WINDOW steps' counts.
  const WINDOW = 2 * STEPS_PER_SECOND;
  const ring = new Array(WINDOW).fill(0);
  let sum = 0;
  // Every step's two-second mean, where the camera was, and which fight was on — read after the walk.
  const trace = [];
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
    // A pickup on the field is the shell's to fit, never the frame's, so the loadout asked for is the
    // one flown — held rather than assumed, because a fight measured at the wrong loadout is 0406.
    if (world.weapon !== armed) throw new Error(`${kind}: the loadout changed mid-walk, so this measured another one`);
    const fighting = world.bossPool.size > 0 && world.fight === 0;
    if (fighting) fought = true;
    const here = fighting ? during : world.fight === 0 ? before : after;
    here.steps++;
    const live = aliveOnScreen(world);
    here.alive += live;
    if (live > here.peak) here.peak = live;
    if (bulletOnScreen(world)) here.covered++;
    const count = bulletsOnScreen(world);
    here.live += count;
    if (count > here.livePeak) here.livePeak = count;
    sum += count - ring[step % WINDOW];
    ring[step % WINDOW] = count;
    const mean = sum / WINDOW;
    if (mean > here.window) here.window = mean;
    // From the step the end boss is put down, whatever its pool says: the jellyfish's fight was counted
    // as the level until this read the flag the frame itself spawns by.
    const ending = world.fight === 1 && world.bossSpawned;
    // A scratch census asks the world itself, every step — 0472's breakdown of a busy window by shot.
    if (options.census !== undefined) options.census(world);
    trace.push({ mean, along: world.cameraAlong - world.levelOrigin, fighting, ending });
    enteringNow(world, here);
    for (let i = spawnedBefore; i < world.nextWave; i++) {
      const wave = level.waves[i];
      if (wave === undefined) continue;
      here.waves++;
      if (fires(wave.enemy)) here.firing++;
      seen++;
    }
  }
  /*
    The busiest two seconds of the level, three of them, at least four seconds apart — 0472. The end
    boss's fight is its own thing and is left out: what the report names is the level and its mid-boss.
  */
  const busiest = [];
  const apart = 4 * STEPS_PER_SECOND;
  const order = trace.map((t, i) => i).filter((i) => !trace[i].ending).sort((a, b) => trace[b].mean - trace[a].mean);
  for (const i of order) {
    if (busiest.length === 3) break;
    if (busiest.some((j) => Math.abs(i - j) < apart)) continue;
    busiest.push(i);
  }
  const midAt = level.midBoss === null ? 0 : level.midBoss.at;
  return {
    kind,
    midBoss: level.midBoss === null ? null : level.midBoss.kind,
    fought,
    seen,
    // `along` is where the camera's back edge was, in level units, and `fromMid` the same from the mid-boss's `at`.
    busiest: busiest.map((i) => ({ ...trace[i], fromMid: trace[i].along - midAt })),
    ended: trace.reduce((m, t) => (t.ending && t.mean > m ? t.mean : m), 0),
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
  const gun = args.find((a) => a.startsWith('--gun='));
  const options = {
    missileTier: flag('missiles', 1),
    sweepSeconds: flag('sweep', 8),
    gun: gun === undefined ? undefined : gun.slice('--gun='.length),
    difficulty: args.find((a) => a.startsWith('--difficulty='))?.slice('--difficulty='.length),
  };
  const carried = args.includes('--carried');
  let unfought = 0;
  for (const kind of kinds) {
    const r = weighFight(kind, carried ? { ...options, missileTier: carriedAt(kind).missileTier } : options);
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
          `bullets ${(s.covered * 100).toFixed(0).padStart(3)}%   ` +
          `live ${s.live.toFixed(1).padStart(4)} avg ${String(s.livePeak).padStart(3)} peak ${s.window.toFixed(1).padStart(4)} worst 2s`,
      );
    row('before', r.before);
    row('during', r.during);
    row('after', r.after);
    for (const b of r.busiest) {
      console.log(
        `  busy 2s: ${b.mean.toFixed(1).padStart(4)} live, camera at ${b.along.toFixed(0).padStart(5)} ` +
          `(${b.fromMid >= 0 ? '+' : ''}${b.fromMid.toFixed(0)} from the mid-boss)${b.fighting ? ', in its fight' : ''}`,
      );
    }
    console.log(`  the end boss's busiest 2s: ${r.ended.toFixed(1)} live`);
  }
  if (unfought > 0) {
    console.error(`\n${unfought} level(s) never fought their mid-boss — this measured nothing about them.`);
    process.exit(1);
  }
}
