// A hostile shot that STOPS ON THE SCREEN, flown for through a whole level with every pool watched.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-stuck.mjs
//        [levelKind …] [--difficulty=savior] [--gun=pulse] [--sweep=5] [--mortal] [--linger=300] [--cap=16000]
//
// Reported from play on the Rime Shelf, 2026-10-04: *"this red bullet hung around on the screen. the
// only way I could get it to go away was by flying into it and dying."* A shot that is still on the
// screen after `linger` steps without ever leaving it is the class; the report prints what it is, where
// it is, its velocity in the camera's frame, and what was on the field with it.
//
// ⚠️ THE FIRST SIX FLIGHTS FOUND NOTHING — `reports/the-bosses-look-planned-2026-10-04.md`, item 0.
// Parked, sweeping, mortal, the pulse and the ray, Savior and Burn: no shot lingered and the slowest
// thing on any screen was a melting flake at 0.86 a step. So the cause is conditional on something a
// headless pilot does not do — a thrown special, a resize, a pause — and this file is where the next
// condition is added, not a verdict that the bug is not there.
//
// --sweep=N flies the ship across 30% of the lane either side of the middle over N seconds, as
// `scripts/weigh-threat.mjs` does; --mortal lets it die, so the respawn path is flown too.
// Exits non-zero if any shot lingered, so a suite may call it — 0199.

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { ENEMY_KINDS } from '../src/content/enemies.ts';
import { SHOT_KINDS } from '../src/content/shots.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, shipCarrying } from '../src/content/ships.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld } from '../tests/world.ts';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const named = args.filter((a) => !a.startsWith('--'));
const levels = named.length > 0 ? named : LEVEL_KINDS;
const difficulty = flag('difficulty', 'savior');
const sweep = Number(flag('sweep', '5'));
const cap = Number(flag('cap', '16000'));
const gun = flag('gun', 'pulse');
const mortal = args.includes('--mortal');
const linger = Number(flag('linger', '300'));
const NEVER = Number.MAX_SAFE_INTEGER;

/** One level flown; returns how many shots lingered. */
function fly(level) {
  const { world, deaths } = playableWorld(LEVELS[level], difficulty === 'authored' ? undefined : difficulty);
  const frame = new GameFrame(world);
  world.shipRow = SHIPS[shipCarrying(gun)];
  world.weapon = weaponFor(world.shipRow, []);
  wearHull(world);
  /** Each live shot's first sighting in its slot: a changed sprite or a jump is a new occupant. */
  const born = new Map();
  const reported = new Set();
  const lane = ACROSS_SPAN / 2;
  let maxShots = 0;
  let slowest = { speed: Infinity };
  for (let step = 0; step < cap; step++) {
    if (!mortal) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = NEVER;
    }
    world.ship.prevAcross = world.ship.across;
    if (sweep > 0) world.ship.across = lane + Math.sin((step / (sweep * STEPS_PER_SECOND)) * Math.PI * 2) * ACROSS_SPAN * 0.3;
    frame.step();
    if (world.enemyShots.size > maxShots) maxShots = world.enemyShots.size;
    const seen = new Set();
    for (let i = 0; i < world.enemyShots.size; i++) {
      const s = world.enemyShots.at(i);
      seen.add(s);
      const rel = s.along - world.cameraAlong;
      const onScreen = rel > 0 && rel < PLAYER_LEAD && s.across > 0 && s.across < ACROSS_SPAN;
      const speed = Math.hypot(s.velAlong - world.scrollPerStep, s.velAcross);
      if (onScreen && speed < slowest.speed) slowest = { speed: Number(speed.toFixed(3)), step, kind: SHOT_KINDS[s.kind], sprite: SPRITE_KINDS[s.sprite] };
      const b = born.get(s);
      if (b === undefined || b.sprite !== s.sprite || Math.abs(b.lastRel - rel) > 6 || Math.abs(b.lastAcross - s.across) > 6) {
        born.set(s, { step, sprite: s.sprite, lastRel: rel, lastAcross: s.across, onFor: 0 });
        continue;
      }
      b.lastRel = rel;
      b.lastAcross = s.across;
      b.onFor = onScreen ? b.onFor + 1 : 0;
      if (b.onFor >= linger && !reported.has(s)) {
        reported.add(s);
        const boss = world.bossPool.size > 0 ? `boss on field (health ${world.bossPool.at(0).health}, entering ${world.bossEntering}, fight ${world.fight})` : 'no boss';
        const kinds = [];
        for (let j = 0; j < world.enemies.size; j++) kinds.push(ENEMY_KINDS[world.enemies.at(j).kind]);
        console.log(
          `  LINGERS ${(b.onFor / STEPS_PER_SECOND).toFixed(1)} s at ${(step / STEPS_PER_SECOND).toFixed(1)} s: ${SHOT_KINDS[s.kind]} as ${SPRITE_KINDS[s.sprite]}` +
            ` at rel-along ${rel.toFixed(1)} across ${s.across.toFixed(1)} rel-vel (${(s.velAlong - world.scrollPerStep).toFixed(3)}, ${s.velAcross.toFixed(3)})` +
            ` scroll ${world.scrollPerStep.toFixed(3)} steer ${s.steerAcross} hold ${s.holdFor} life ${s.lifeFor} spin ${s.spin}; deaths ${deaths.count}; ${boss}; enemies [${kinds.join(',')}]`,
        );
      }
    }
    for (const e of born.keys()) if (!seen.has(e)) born.delete(e);
  }
  console.log(
    `${level} — ${difficulty}, ${gun}, sweep ${sweep}, mortal ${mortal}: ${cap} steps, boss ${world.bossBeaten ? 'beaten' : world.bossPool.size > 0 ? 'on field' : 'not met'}, deaths ${deaths.count}, peak shots ${maxShots}, lingering ${reported.size}; slowest on screen ${JSON.stringify(slowest)}`,
  );
  return reported.size;
}

let lingered = 0;
for (const level of levels) lingered += fly(level);
if (lingered > 0) process.exit(1);
