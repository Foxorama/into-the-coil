// What each enemy body does while the player can see it, by where it entered.
//
// Usage:  node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-presence.mjs
//              [levelKind] [--weapon=4] [--missiles=2] [--sweep=8]
//
// THE INSTRUMENT FOR reports/the-first-three-levels-asked-2026-09-14.md, built before the first pass
// on it — docs/decisions/0027-measure-the-picture-not-the-model.md. Reported: *"a lot of the enemies
// that do shoot either start off the bottom/top of the screen or enter 1/2 to 3/4s of the way into
// the screen and barely shoot at all."* That is a claim about what a body does WHILE IT IS VISIBLE,
// and scripts/weigh-bullets.mjs cannot answer it: it counts whether any bullet is on the screen, not
// which body threw it or whether that body was ever seen to. So this drives every level through the
// real frame exactly as weigh-bullets does — the real spawner, the real guns, an immortal ship
// sweeping the lane, the mid-boss put to one health — and, per body, records where it entered, how
// long its hull was inside the view, and how many volleys it fired while it was.
//
// WHERE IT ENTERED is read off its first position: outside the lane across is a flanker
// (docs/decisions/0048-a-threat-may-arrive-from-the-side.md); everything else came down the lane.
//
// A VOLLEY IS ATTRIBUTED to the live body on the shot's own `along` on the step it appeared —
// `fireEnemies` in src/app/frame.ts places every volley on the body's along exactly — and within a
// wall's reach across, because a `wall` places its shots either side of the body rather than on it
// (the sower's at thirteen and twenty-six units). A first draft used a round twelve-unit reach and
// read every sower and sentry in the game as silent.
//
// WHAT IT PRINTS, per level, one row per kind and origin, over the waves' time only (a body alive
// while a boss is on the field is not counted — docs/decisions/0267-a-fight-thins-the-waves-over-it.md
// owns that stretch):
//
//   bodies         how many of that kind entered that way
//   visible(s)     mean seconds its hull was inside the view
//   volleys/body   mean volleys fired while visible
//   zero-volley    the share that never fired while visible
//   first-seen     mean units ahead of the camera at which it was first inside the view
//
// ⚠️ It exits non-zero if a level never puts a body on the screen at all, on scripts/trace-frame.mjs's
// terms: an instrument that produces nothing must not report success.

import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { GameFrame, wearHull } from '../src/app/frame.ts';
import { UPGRADE_TIERS, weaponFor } from '../src/content/pickups.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld } from '../tests/world.ts';

/** How far along from a body a new shot may be and still be that body's — a volley spawns ON its along. */
const MUZZLE_ALONG = 2;
/** How far across a new shot may be from the body that threw it: the widest wall any enemy lays. */
const MUZZLE_ACROSS = Math.max(
  ...Object.values(ENEMIES).map((row) => (row.attack.kind === 'wall' ? row.attack.shots * row.attack.gap : 0)),
) + 2;

/**
 * One level, driven to its boss, and what every body did while it could be seen.
 *
 * Returns rows keyed `kind:origin`, over the waves' time only.
 */
export function weighPresence(kind, options = {}) {
  const weaponTier = options.weaponTier ?? UPGRADE_TIERS;
  const missileTier = options.missileTier ?? 2;
  const sweepSeconds = options.sweepSeconds ?? 8;
  const level = LEVELS[kind];
  // The fixture's default tier unless asked — the gentlest, on weigh-bullets' terms.
  const { world } = options.tier === undefined ? playableWorld(level) : playableWorld(level, options.tier);
  const frame = new GameFrame(world);
  const carried = [];
  for (let i = 0; i < weaponTier; i++) carried.push('weapon');
  for (let i = 0; i < missileTier; i++) carried.push('missile');
  world.weapon = weaponFor(world.shipRow, carried);
  wearHull(world);
  const kindName = [];
  for (const [name, index] of Object.entries(world.enemyKinds)) kindName[index] = name;
  /** Live bodies and what they have done so far, keyed by the pooled entity. */
  const records = new Map();
  const done = [];
  let prevEnemies = new Set();
  let prevShots = new Set();
  let step = 0;
  let sawBody = false;
  /** The most bodies alive at once — read against `CAPACITY.enemies` in src/app/mount.ts. */
  let peak = 0;
  // Six minutes is more than any level plus its mid-boss at the base tier; the cap is for a fight
  // the immortal ship cannot win, which is not a thing this measures.
  const cap = STEPS_PER_SECOND * 60 * 6;
  const visible = (body) => {
    const inView = body.along - world.cameraAlong;
    return (
      inView + body.radius >= 0 &&
      inView - body.radius <= world.view.alongSpan &&
      body.across + body.radius >= 0 &&
      body.across - body.radius <= ACROSS_SPAN
    );
  };
  // The place the fight is fought — 0335: a room brings the camera to rest short of `bossAt`, so a
  // walk that waited for `bossAt` waited forever with the world standing still.
  const fought = level.bossAt - (BOSSES[level.boss].room?.stand ?? 0);
  // ⚠️ **OR UNTIL THE CAMERA STOPS, WHICH IS WHAT A ROOM DOES TO A WALK.** The settle is a sum of
  // discrete steps and lands a fraction of a unit short of its own target, so a walk that waited for
  // the exact number waited forever. A camera that has come to rest has arrived wherever it arrived.
  let atRest = false;
  while (world.cameraAlong - world.levelOrigin < fought && !atRest && step < cap) {
    world.ship.health = world.shipRow.health;
    if (sweepSeconds > 0) {
      const phase = (step / (sweepSeconds * STEPS_PER_SECOND)) * Math.PI * 2;
      world.ship.prevAcross = world.ship.across;
      world.ship.across = ACROSS_SPAN / 2 + Math.sin(phase) * (ACROSS_SPAN * 0.35);
    }
    if (world.bossPool.size > 0 && world.fight === 0) world.bossPool.at(0).health = 1;
    frame.step();
    step++;
    if (world.scrollPerStep === 0) atRest = true;
    const boss = world.bossPool.size > 0;
    if (world.enemies.size > peak) peak = world.enemies.size;
    const live = new Set();
    for (let i = 0; i < world.enemies.size; i++) {
      const e = world.enemies.at(i);
      live.add(e);
      let r = records.get(e);
      if (!prevEnemies.has(e) || r === undefined) {
        r = {
          kind: kindName[e.kind],
          flank: e.across < 0 || e.across > ACROSS_SPAN,
          visibleSteps: 0,
          volleysVisible: 0,
          duringBoss: boss,
          firstSeenAt: -1,
        };
        records.set(e, r);
      }
      if (visible(e)) {
        sawBody = true;
        r.visibleSteps++;
        if (r.firstSeenAt < 0) r.firstSeenAt = e.along - world.cameraAlong;
      }
    }
    for (const [e, r] of records) {
      if (!live.has(e)) {
        done.push(r);
        records.delete(e);
      }
    }
    const shots = new Set();
    for (let i = 0; i < world.enemyShots.size; i++) {
      const s = world.enemyShots.at(i);
      shots.add(s);
      if (prevShots.has(s)) continue;
      let nearest = null;
      let nearestAt = Number.POSITIVE_INFINITY;
      for (const e of live) {
        if (Math.abs(e.along - s.along) > MUZZLE_ALONG) continue;
        const d = Math.abs(e.across - s.across);
        if (d < nearestAt) {
          nearestAt = d;
          nearest = e;
        }
      }
      if (nearest !== null && nearestAt <= MUZZLE_ACROSS && visible(nearest)) records.get(nearest).volleysVisible++;
    }
    prevEnemies = live;
    prevShots = shots;
  }
  for (const r of records.values()) done.push(r);
  const rows = {};
  for (const r of done) {
    if (r.duringBoss) continue;
    const key = `${r.kind}:${r.flank ? 'side' : 'lead'}`;
    const row = (rows[key] ??= { bodies: 0, unseen: 0, visibleSteps: 0, volleys: 0, silent: 0, firstSeen: 0 });
    // A body that died or left before its hull was ever inside the view is not a row of the table
    // below — it was never on the screen to fire — but it is counted, because a body killed beyond
    // the view is the other half of *"die too fast without firing"*.
    if (r.firstSeenAt < 0) {
      row.unseen++;
      continue;
    }
    row.bodies++;
    row.visibleSteps += r.visibleSteps;
    row.volleys += r.volleysVisible;
    if (r.volleysVisible === 0) row.silent++;
    row.firstSeen += r.firstSeenAt;
  }
  // The place the fight is fought, not `bossAt` — 0335; `scripts/weigh-bullets.mjs` has the reason.
  return { kind, rows, peak, sawBody, reachedBoss: atRest || world.cameraAlong - world.levelOrigin >= fought };
}

const isMain = process.argv[1] !== undefined && /weigh-presence\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  const args = process.argv.slice(2);
  const only = args.find((a) => !a.startsWith('--'));
  const flag = (name, fallback) => {
    const found = args.find((a) => a.startsWith(`--${name}=`));
    return found === undefined ? fallback : Number(found.slice(name.length + 3));
  };
  const tierArg = args.find((a) => a.startsWith('--tier='));
  const options = {
    weaponTier: flag('weapon', UPGRADE_TIERS),
    missileTier: flag('missiles', 2),
    sweepSeconds: flag('sweep', 8),
    tier: tierArg === undefined ? undefined : tierArg.slice('--tier='.length),
  };
  let failed = false;
  for (const kind of only ? [only] : LEVEL_KINDS) {
    const r = weighPresence(kind, options);
    console.log(
      `\n${kind}  weapon=${options.weaponTier} missiles=${options.missileTier}${options.tier === undefined ? '' : ` tier=${options.tier}`}  peak bodies alive ${r.peak}`,
    );
    console.log('  kind:origin           seen  unseen  visible(s)  volleys/body  zero-volley  first-seen');
    for (const key of Object.keys(r.rows).sort()) {
      const row = r.rows[key];
      const seen = row.bodies > 0 ? row.bodies : 1;
      console.log(
        `  ${key.padEnd(22)}${String(row.bodies).padStart(4)}  ${String(row.unseen).padStart(6)}  ${(row.visibleSteps / seen / STEPS_PER_SECOND).toFixed(2).padStart(9)}  ` +
          `${(row.volleys / seen).toFixed(2).padStart(12)}  ${((100 * row.silent) / seen).toFixed(0).padStart(9)}%  ` +
          `${(row.firstSeen / seen).toFixed(0).padStart(8)}`,
      );
    }
    if (!r.sawBody || !r.reachedBoss) {
      console.log(`  ⚠️ ${kind} ${r.sawBody ? 'was never driven to its boss' : 'never put a body on the screen'} — this measured nothing`);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}
