// Whether the gyre's wreck can be killed, and with what — flown through the real frame.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-wreck.mjs [--difficulty=savior] [--share=0.22]
//
// docs/decisions/0475-the-wreck-can-be-killed.md. Asked: *"I want this to be killable as a first in game
// achievement — it should take 1 bomb, 1 missile upgrade and full autofire to completely kill it."* So
// the player named a PASS line — the gun at full autofire, the first missile tube, one bomb — and the
// loadout one short of it is the FAIL line. This flies the gyre to its death and then each loadout at
// the wreck, from the step the boss dies to the step the wreck leaves the pool — killed, or carried
// off the trailing edge when the room opens and the camera moves on — and prints, per loadout, whether
// it died and when.
//
// THE PILOT. The ship holds still in the camera's frame at the place a bomb thrown from it lands on
// the wreck's rest, and keeps to the wreck's lane: the pulse and the tubes fire straight, so that is
// how a player flies at a thing lying on the floor. The bomb is thrown on the step the wreck lands,
// because a bomb thrown at a falling cog lands where the cog was. The ship cannot be hit; a death
// would measure the respawn.
//
// ⚠️ IT IS A PLAN'S NUMBER CHECKED, NOT A NUMBER PICKED: the plan's arithmetic said 0.23 of full
// health at Savior (reports/the-bosses-look-planned-2026-10-04.md, 4.3); what lands is what the
// frame says. `--share` overrides the row so a share can be tried before it is written.
// Exits non-zero if the pass line fails to kill or the fail line kills — 0199.

import { GameFrame, MUZZLE_ALONG, launchSpecial, wearHull } from '../src/app/frame.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, shipCarrying } from '../src/content/ships.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { PLAYER_ALONG_MARGIN } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from '../tests/world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;

/** The loadouts, from the player's own line down. */
export const LOADOUTS = [
  { name: 'autofire, one tube, one bomb', tubes: 1, bomb: true, pass: true },
  { name: 'autofire, one tube', tubes: 1, bomb: false, pass: false },
  { name: 'autofire and one bomb', tubes: 0, bomb: true, pass: null },
  { name: 'autofire alone', tubes: 0, bomb: false, pass: false },
];

/**
 * The gyre flown to its death at `difficulty`, then `loadout` flown at its wreck. Returns the seconds
 * from the boss's death to the wreck's, or `null` if it left alive, and the seconds it was on the
 * field either way.
 */
export function flyWreck(loadout, { difficulty = 'savior', share = null } = {}) {
  const row = BOSSES.gyre;
  if (row.wreck === null) throw new Error('the gyre has no wreck');
  const saved = row.wreck.health;
  if (share !== null) row.wreck.health = share;
  try {
    const level = { waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: 'gyre', theme: 'labyrinth' };
    const { world, wrecks } = playableWorld(level, difficulty);
    const frame = new GameFrame(world);
    world.shipRow = SHIPS[shipCarrying('pulse')];
    // One straight tube — 0577: the list is the kinds fitted, where it was rungs of 'missile'.
    world.weapon = weaponFor(world.shipRow, loadout.tubes > 0 ? ['straight'] : []);
    wearHull(world);
    const reach = SPECIALS.bomb.reach + MUZZLE_ALONG;
    let diedAt = -1;
    let thrown = false;
    let standing = -1;
    for (let step = 0; step < 60 * STEPS_PER_SECOND; step++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = NEVER;
      /*
        ⚠️ **IN ITS ROOM, WITH THE CAMERA AT REST**, which is where every real fight with the gyre ends:
        it is eighty seconds long and the room shuts in the first three. The first draft killed it the
        step its entrance ended, with the camera still running at the level's rate, and every wreck was
        carried off the screen behind the ship — a window that no player is ever given.
      */
      const fighting = world.bossPool.size > 0 && world.bossEntering < 0 && !world.bossBeaten && world.scrollPerStep === 0;
      // Hold fire until then: the wreck is what is being weighed, not the gyre.
      if (!world.bossBeaten && !fighting) {
        world.fireIn = NEVER;
        world.missileIn = NEVER;
      }
      if (fighting) {
        // Its last point of health, so the gun's first landing is the death and the window opens with
        // every gun already firing — which is how a fight ends.
        const boss = world.bossPool.at(0);
        boss.health = Math.min(boss.health, 0.001);
        world.enemyShots.clear();
        // Held is any count no gun reaches, because the frame counts it down every step.
        if (world.fireIn > STEPS_PER_SECOND * 60) {
          world.fireIn = 1;
          world.missileIn = 1;
        }
      }
      if (world.bossPool.size > 0) {
        const body = world.bossPool.at(0);
        world.ship.prevAcross = world.ship.across;
        world.ship.across = body.across;
        world.ship.prevAlong = world.ship.along;
        world.ship.along = world.cameraAlong + (standing >= 0 ? standing : body.along - world.cameraAlong - reach);
        if (loadout.bomb && !thrown && world.bossBeaten && world.wreckDown) {
          launchSpecial(world, 'bomb');
          thrown = true;
        }
        /*
          ⚠️ **AND THEN THE BACK OF THE BOX.** Once the wreck is down and the bomb is away, the ship
          backs off to the trailing edge of the box: when the room opens the camera carries the wreck
          down the screen, and a ship that held still lets it past in a second and a half. A player who
          wants the kill keeps it in front of the guns; the first draft did not, and lost a third of
          the window to it.
        */
        if (world.bossBeaten && world.wreckDown && standing < 0) standing = PLAYER_ALONG_MARGIN;
      }
      frame.step();
      if (wrecks.count > 0) throw new Error('the ship died, so this measured a respawn');
      if (world.bossBeaten && diedAt < 0) diedAt = step;
      if (diedAt >= 0 && step > diedAt && world.bossPool.size === 0) {
        const seconds = (step - diedAt) / STEPS_PER_SECOND;
        return { killed: world.wreckBeaten ? seconds : null, window: seconds, bomb: thrown };
      }
    }
    throw new Error(diedAt < 0 ? 'the gyre never died' : 'the wreck never left the field');
  } finally {
    row.wreck.health = saved;
  }
}

const isMain = process.argv[1] !== undefined && /weigh-wreck\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (name, fallback) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit === undefined ? fallback : hit.slice(name.length + 3);
  };
  const difficulty = flag('difficulty', 'savior');
  const shareFlag = flag('share', null);
  const share = shareFlag === null ? null : Number(shareFlag);
  console.log(`gyre's wreck — ${difficulty}, share ${share ?? BOSSES.gyre.wreck?.health}`);
  let wrong = 0;
  for (const loadout of LOADOUTS) {
    const { killed, window } = flyWreck(loadout, { difficulty, share });
    const verdict = killed === null ? `survives (left after ${window.toFixed(1)} s)` : `killed at ${killed.toFixed(1)} s`;
    // The line is drawn at Savior, the tuned tier (0356); the other two are read, not judged — 0475.
    const judged = difficulty === 'savior';
    const expected = loadout.pass === null || !judged ? '' : loadout.pass ? '  — must kill' : '  — must not';
    if (judged && loadout.pass === true && killed === null) wrong++;
    if (judged && loadout.pass === false && killed !== null) wrong++;
    console.log(`  ${loadout.name.padEnd(30)} ${verdict}${expected}`);
  }
  if (wrong > 0) process.exit(1);
}
