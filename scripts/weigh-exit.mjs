// Where each lead body is when the player FIRST sees it, and whether it leaves the screen sideways
// within a moment of being seen — docs/decisions/0382-a-roam-waits-to-be-seen.md.
//
// Usage:  node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-exit.mjs
//              [levelKind] [--window=1.5] [--edge=12]
//
// THE INSTRUMENT FOR *"lots of enemies that start near the top/bottom of the screen and then
// immediately fly off the screen"* (2026-09-26), built before the first change against it —
// docs/decisions/0027-measure-the-picture-not-the-model.md. scripts/weigh-presence.mjs answers what a
// body does WHILE it is visible with the guns firing; this asks where it was when it became visible,
// with the guns silent, so a body's flight is measured and not its death. The ship is parked
// mid-lane, immortal and never firing; the mid-boss is put to one health so the level is walked to
// its end; a body alive while a boss is on the field is not counted.
//
// WHAT IT PRINTS, per level, one row per kind and origin:
//
//   bodies                    how many of that kind, from that origin, were ever inside the view along
//   first seen OFF-SCREEN     first inside the view along with the hull already outside the lane
//   seen within edge          first seen inside the lane but within --edge units of either edge
//   leaves within window      hull left the lane within --window seconds of first being seen
//   on-screen share           of the steps after it was first seen, the share its hull was on the screen
//
// ⚠️ It exits non-zero if a level never puts a body on the screen at all, on scripts/trace-frame.mjs's
// terms: an instrument that produces nothing must not report success.

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld } from '../tests/world.ts';

/**
 * One level, walked to its boss with the guns silent, and where every lead body was first seen.
 *
 * Returns rows keyed `kind:origin`, over the waves' time only, and the totals over lead bodies.
 */
export function weighExit(kind, { window = 1.5, edge = 12 } = {}) {
  const WINDOW = Math.round(window * STEPS_PER_SECOND);
  const level = LEVELS[kind];
  const { world } = playableWorld(level);
  const frame = new GameFrame(world);
  wearHull(world);
  const kindName = [];
  for (const [name, index] of Object.entries(world.enemyKinds)) kindName[index] = name;
  const records = new Map();
  const done = [];
  // The place the fight is fought, not `bossAt` — 0335; scripts/weigh-presence.mjs has the reason.
  const fought = level.bossAt - (BOSSES[level.boss].room?.stand ?? 0);
  const cap = STEPS_PER_SECOND * 60 * 6;
  let step = 0;
  let atRest = false;
  let sawBody = false;
  const inViewAlong = (e) => {
    const inView = e.along - world.cameraAlong;
    return inView + e.radius >= 0 && inView - e.radius <= world.view.alongSpan;
  };
  const offAcross = (e) => e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN;
  while (world.cameraAlong - world.levelOrigin < fought && !atRest && step < cap) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = Number.MAX_SAFE_INTEGER;
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    if (world.bossPool.size > 0 && world.fight === 0) world.bossPool.at(0).health = 1;
    frame.step();
    step++;
    if (world.scrollPerStep === 0) atRest = true;
    const live = new Set();
    for (let i = 0; i < world.enemies.size; i++) {
      const e = world.enemies.at(i);
      live.add(e);
      let r = records.get(e);
      if (r === undefined) {
        r = { kind: kindName[e.kind], flank: e.across < 0 || e.across > ACROSS_SPAN, boss: world.bossPool.size > 0, seenAt: -1, seenAcross: 0, seenOff: false, offWithin: false, stepsOn: 0, stepsAfter: 0 };
        records.set(e, r);
      }
      const on = inViewAlong(e) && !offAcross(e);
      if (on) sawBody = true;
      if (r.seenAt < 0 && inViewAlong(e)) {
        r.seenAt = step;
        r.seenAcross = e.across;
        r.seenOff = offAcross(e);
      }
      if (r.seenAt >= 0) {
        r.stepsAfter++;
        if (on) r.stepsOn++;
        if (step - r.seenAt <= WINDOW && offAcross(e) && !r.seenOff) r.offWithin = true;
      }
    }
    for (const [e, r] of records) {
      if (!live.has(e)) {
        done.push(r);
        records.delete(e);
      }
    }
  }
  for (const r of records.values()) done.push(r);
  const rows = {};
  const total = { bodies: 0, seenOff: 0, seenNearEdge: 0, offWithin: 0 };
  for (const r of done) {
    if (r.boss || r.seenAt < 0) continue;
    const key = `${r.kind}:${r.flank ? 'side' : 'lead'}`;
    const row = (rows[key] ??= { bodies: 0, seenOff: 0, seenNearEdge: 0, offWithin: 0, onShare: 0 });
    row.bodies++;
    if (r.seenOff) row.seenOff++;
    else if (r.seenAcross < edge || r.seenAcross > ACROSS_SPAN - edge) row.seenNearEdge++;
    if (r.offWithin) row.offWithin++;
    row.onShare += r.stepsAfter > 0 ? r.stepsOn / r.stepsAfter : 0;
    if (r.flank) continue;
    total.bodies++;
    if (r.seenOff) total.seenOff++;
    else if (r.seenAcross < edge || r.seenAcross > ACROSS_SPAN - edge) total.seenNearEdge++;
    if (r.offWithin) total.offWithin++;
  }
  return { kind, rows, total, sawBody, reachedBoss: atRest || world.cameraAlong - world.levelOrigin >= fought };
}

const isMain = process.argv[1] !== undefined && /weigh-exit\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  const args = process.argv.slice(2);
  const only = args.find((a) => !a.startsWith('--'));
  const flag = (name, fallback) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit === undefined ? fallback : Number(hit.slice(name.length + 3));
  };
  const options = { window: flag('window', 1.5), edge: flag('edge', 12) };
  let failed = false;
  for (const kind of only ? [only] : LEVEL_KINDS) {
    const r = weighExit(kind, options);
    console.log(`\n${kind}  ship parked mid-lane, never firing; window ${options.window}s, edge ${options.edge}`);
    console.log('  kind:origin           bodies  first seen OFF-SCREEN  seen within edge  leaves within window  on-screen share');
    for (const key of Object.keys(r.rows).sort()) {
      const row = r.rows[key];
      console.log(
        `  ${key.padEnd(22)}${String(row.bodies).padStart(6)}  ${String(row.seenOff).padStart(21)}  ${String(row.seenNearEdge).padStart(16)}  ` +
          `${String(row.offWithin).padStart(20)}  ${(row.onShare / row.bodies).toFixed(2).padStart(15)}`,
      );
    }
    const t = r.total;
    const pct = (n) => (t.bodies === 0 ? '0' : ((100 * n) / t.bodies).toFixed(0));
    console.log(`  LEAD ${t.bodies} bodies: ${t.seenOff} first seen off-screen (${pct(t.seenOff)}%), ${t.seenNearEdge} within ${options.edge} of an edge (${pct(t.seenNearEdge)}%), ${t.offWithin} leave within the window (${pct(t.offWithin)}%)`);
    if (!r.sawBody || !r.reachedBoss) {
      console.log(`  ⚠️ ${kind} ${r.sawBody ? 'was never driven to its boss' : 'never put a body on the screen'} — this measured nothing`);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}
