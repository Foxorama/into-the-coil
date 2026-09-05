// How much of a level the player spends with an enemy bullet on the screen.
//
// Usage:  node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-bullets.mjs
//              [levelKind] [--weapon=4] [--missiles=2] [--sweep=8] [--seconds=2]
//
// ⚠️ THE INSTRUMENT FOR THE ALPHA LIST'S BULLET-TIME ITEM, built before the first tuning pass on it —
// docs/decisions/0027-measure-the-picture-not-the-model.md. Reported: *"there's either a screen full
// of bullets or there's 30secs of no bullet to be seen at all… not necessarily more bullets on
// screen, but more time for bullets overall to be on screen."* That is a claim about TIME, and no
// count of firing waves in a table can answer it: a firing kind has two or more hits of health and
// the ship's own guns take it off the field before it fires. So this drives every level through the
// real frame — the real spawner, the real guns, an immortal ship sweeping the lane — and counts, step
// by step, whether any enemy shot is inside the view. `tests/bullets.test.ts` holds the budget over
// the same walk.
//
// THE LOADOUT IS THE CAP BY DEFAULT — the guns at four and two tubes — because that is what a player
// carries from the second level on (0256) and the case the report is about: a player who kills what
// fires before it fires. `--weapon=0 --missiles=0` is the base ship; `--sweep=0` parks it mid-lane.
//
// WHAT IT PRINTS, per level
//
//   covered   the share of the level's steps with a bullet on the screen
//   longest   the longest stretch with none, in seconds, and where in the level it ends
//   waves     the same two, counting only steps with no boss on the field — the waves alone
//   a timeline, one glyph per --seconds of level: '#' a bullet was on screen in that window, '.' none,
//             'B' a boss was on the field and nothing fired
//
// ⚠️ It exits non-zero if a level never puts a bullet on the screen at all, on the same terms as
// scripts/trace-frame.mjs: an instrument that produces nothing must not report success.

import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { GameFrame, wearHull } from '../src/app/frame.ts';
import { UPGRADE_TIERS, weaponFor } from '../src/content/pickups.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld } from '../tests/world.ts';

/** Whether any enemy shot is inside the view this step. */
function bulletOnScreen(world) {
  for (let i = 0; i < world.enemyShots.size; i++) {
    const s = world.enemyShots.at(i);
    const inView = s.along - world.cameraAlong;
    if (inView >= 0 && inView <= world.view.alongSpan && s.across >= 0 && s.across <= ACROSS_SPAN) return true;
  }
  return false;
}

/**
 * One level, driven to its boss, and what the bullets did on the way.
 *
 * The record of every dry stretch is kept — where each one ends and how long it was — so a guard can
 * exempt the two stretches a decision authored to be quiet (the opening, and level one's run-up) and
 * hold the rest.
 */
export function weighLevel(kind, options = {}) {
  const weaponTier = options.weaponTier ?? UPGRADE_TIERS;
  const missileTier = options.missileTier ?? 2;
  const sweepSeconds = options.sweepSeconds ?? 8;
  const windowSeconds = options.windowSeconds ?? 2;
  const level = LEVELS[kind];
  const { world } = playableWorld(level);
  const frame = new GameFrame(world);
  const carried = [];
  for (let i = 0; i < weaponTier; i++) carried.push('weapon');
  for (let i = 0; i < missileTier; i++) carried.push('missile');
  world.weapon = weaponFor(world.shipRow, carried);
  wearHull(world);
  const windowSteps = Math.round(windowSeconds * STEPS_PER_SECOND);
  const glyphs = [];
  /** Every stretch of the waves' time with no bullet on the screen: its length in steps and where it ended. */
  const dryStretches = [];
  let step = 0;
  let covered = 0;
  let wavesSteps = 0;
  let wavesCovered = 0;
  let dry = 0;
  let longest = 0;
  let longestAt = 0;
  let wavesDry = 0;
  let sawBullet = false;
  let sawBoss = false;
  const closeDry = () => {
    if (wavesDry > 0) dryStretches.push({ steps: wavesDry, endsAt: world.cameraAlong - world.levelOrigin });
    wavesDry = 0;
  };
  // Six minutes is more than any level plus its mid-boss at the base tier; the cap is for a fight
  // the immortal ship cannot win, which is not a thing this measures.
  const cap = STEPS_PER_SECOND * 60 * 6;
  while (world.cameraAlong - world.levelOrigin < level.bossAt && step < cap) {
    world.ship.health = world.shipRow.health;
    // The ship sweeps the lane, so its guns cover what a player's would; parked, it kills one line.
    if (sweepSeconds > 0) {
      const phase = (step / (sweepSeconds * STEPS_PER_SECOND)) * Math.PI * 2;
      world.ship.prevAcross = world.ship.across;
      world.ship.across = ACROSS_SPAN / 2 + Math.sin(phase) * (ACROSS_SPAN * 0.35);
    }
    // The mid-boss is put to one health so the ship's next hit takes it — the fight is not what
    // this measures, and a ship sweeping the lane would otherwise sit under it for a minute. Its
    // steps are still counted as the fight's, not the waves'.
    if (world.bossPool.size > 0 && world.fight === 0) world.bossPool.at(0).health = 1;
    frame.step();
    step++;
    const boss = world.bossPool.size > 0;
    const on = bulletOnScreen(world);
    const slot = Math.floor(step / windowSteps);
    const was = glyphs[slot] ?? '.';
    glyphs[slot] = was === '#' ? '#' : on ? '#' : boss ? 'B' : was;
    if (on) {
      sawBullet = true;
      covered++;
      dry = 0;
    } else {
      dry++;
      if (dry > longest) {
        longest = dry;
        longestAt = world.cameraAlong - world.levelOrigin;
      }
    }
    if (boss) {
      sawBoss = true;
      closeDry();
      continue;
    }
    wavesSteps++;
    if (on) {
      wavesCovered++;
      closeDry();
    } else {
      wavesDry++;
    }
  }
  closeDry();
  let wavesLongest = { steps: 0, endsAt: 0 };
  for (const stretch of dryStretches) if (stretch.steps > wavesLongest.steps) wavesLongest = stretch;
  return {
    kind,
    steps: step,
    covered: covered / step,
    longestSeconds: longest / STEPS_PER_SECOND,
    longestEndsAt: Math.round(longestAt),
    wavesCovered: wavesSteps > 0 ? wavesCovered / wavesSteps : 0,
    wavesLongestSeconds: wavesLongest.steps / STEPS_PER_SECOND,
    wavesLongestEndsAt: Math.round(wavesLongest.endsAt),
    dryStretches: dryStretches.map((s) => ({ seconds: s.steps / STEPS_PER_SECOND, endsAt: Math.round(s.endsAt) })),
    timeline: glyphs.join(''),
    sawBullet,
    sawBoss,
    reachedBoss: world.cameraAlong - world.levelOrigin >= level.bossAt,
  };
}

const isMain = process.argv[1] !== undefined && /weigh-bullets\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  const args = process.argv.slice(2);
  const only = args.find((a) => !a.startsWith('--'));
  const flag = (name, fallback) => {
    const found = args.find((a) => a.startsWith(`--${name}=`));
    return found === undefined ? fallback : Number(found.slice(name.length + 3));
  };
  const options = {
    weaponTier: flag('weapon', UPGRADE_TIERS),
    missileTier: flag('missiles', 2),
    sweepSeconds: flag('sweep', 8),
    windowSeconds: flag('seconds', 2),
  };
  let failed = false;
  for (const kind of only ? [only] : LEVEL_KINDS) {
    const r = weighLevel(kind, options);
    const seconds = (r.steps / STEPS_PER_SECOND).toFixed(0);
    const units = (x) => `${x} units, ${(x / SCROLL_PER_STEP / STEPS_PER_SECOND).toFixed(0)}s in`;
    console.log(`\n${kind}  (${seconds}s driven${r.reachedBoss ? '' : ', boss NOT reached'}${r.sawBoss ? '' : ', no boss seen'})`);
    console.log(`  covered  ${(r.covered * 100).toFixed(0)}%   longest dry ${r.longestSeconds.toFixed(1)}s ending at ${units(r.longestEndsAt)}`);
    console.log(`  waves    ${(r.wavesCovered * 100).toFixed(0)}%   longest dry ${r.wavesLongestSeconds.toFixed(1)}s ending at ${units(r.wavesLongestEndsAt)}`);
    console.log(`  ${r.timeline}`);
    if (!r.sawBullet) failed = true;
  }
  if (failed) {
    console.error('\nA level never put a bullet on the screen; the instrument measured nothing.');
    process.exit(1);
  }
}
