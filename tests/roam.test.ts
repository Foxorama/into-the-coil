/**
 * A roam waits to be seen — `docs/decisions/0376-a-roam-waits-to-be-seen.md`.
 *
 * Reported: *"lots of enemies that start near the top/bottom of the screen and then immediately fly
 * off the screen which is pretty stupid."* A drifting body roamed from the step it spawned, three
 * seconds before anyone could see it; it holds its lane until its hull is inside the view now, and
 * its first leg heads inward when it starts near an edge.
 *
 * ⚠️ **EVERY CLAIM IS MEASURED ON A FLIGHT THE FRAME FLEW, IN THE PLAYER'S UNITS** — 0027: where a
 * body is when it is first on the screen, which way it goes, how long it stays, and the same over
 * every level the game has through `scripts/weigh-exit.mjs`, which is the instrument the report was
 * measured with before anything moved.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { LEVEL_KINDS, laneAcross, type LevelRow } from '../src/content/levels.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { weighExit } from '../scripts/weigh-exit.mjs';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** One wave of drifters on a lane, arriving at the leading edge, with no boss to interrupt it. */
function drifters(lane: number, count = 1): LevelRow {
  return {
    waves: [{ at: 400, enemy: 'drifter', formation: 'line', count, lane }],
    pickups: [],
    landmarks: [],
    bossAt: Number.POSITIVE_INFINITY,
    midBoss: null,
    sections: NO_SECTIONS,
    boss: 'sentinel',
    theme: 'approach',
  };
}

/** A wave flown with the guns held, from spawn until every member has been seen for `after` steps. */
function fly(lane: number, count: number, after: number): { seenAt: number[]; seenAcross: number[]; firstLeg: number[]; offWithin: boolean[]; heldBefore: boolean[] } {
  const { world } = playableWorld(drifters(lane, count));
  const frame = new GameFrame(world);
  while (world.enemies.size === 0) frame.step();
  const seenAt: number[] = new Array(count).fill(-1);
  const seenAcross: number[] = new Array(count).fill(0);
  const firstLeg: number[] = new Array(count).fill(0);
  const offWithin: boolean[] = new Array(count).fill(false);
  const heldBefore: boolean[] = new Array(count).fill(true);
  for (let step = 0; step < 1200; step++) {
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    frame.step();
    expect(world.enemies.size, 'a member was lost before it had been seen for long enough').toBe(count);
    let allDone = true;
    for (let i = 0; i < count; i++) {
      const e = world.enemies.at(i);
      const inView = e.along - e.radius <= world.cameraAlong + world.view.alongSpan;
      if (seenAt[i]! < 0) {
        // The step it is first in view is the step its roam may start, so the hold is asked before it.
        if (inView) {
          seenAt[i] = step;
          seenAcross[i] = e.across;
        } else if (e.velAcross !== 0) heldBefore[i] = false;
        allDone = false;
        continue;
      }
      if (firstLeg[i] === 0 && e.velAcross !== 0) firstLeg[i] = Math.sign(e.velAcross);
      if (step - seenAt[i]! <= after && (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN)) offWithin[i] = true;
      if (step - seenAt[i]! < after) allDone = false;
    }
    if (allDone) break;
  }
  return { seenAt, seenAcross, firstLeg, offWithin, heldBefore };
}

describe('0376 — a roam waits to be seen', () => {
  it('THE ASKED-FOR ONE: a drifting body is first seen on the lane it was authored at, having held it until then', () => {
    /*
      ⚠️ **WHERE THE PLAYER FIRST SEES IT, AGAINST WHERE THE LEVEL PUT IT.** The spawner places a
      lead wave a whole view beyond the leading edge, and a body that roamed from that step was
      first seen fifty-seven units from its lane — off the screen, for a wave authored anywhere in
      the outer half. Three lanes, and each member is where its author said, to within half a unit.
    */
    for (const lane of [15, 45, 85]) {
      const { seenAt, seenAcross, heldBefore } = fly(lane, 1, 1);
      expect(seenAt[0], `a drifter at lane ${lane} was never seen`).toBeGreaterThanOrEqual(0);
      expect(heldBefore[0], `a drifter at lane ${lane} was roaming before its hull was on the screen`).toBe(true);
      expect(Math.abs(seenAcross[0]! - laneAcross(lane)), `a drifter authored at lane ${lane} was first seen ${(seenAcross[0]! - laneAcross(lane)).toFixed(1)} units from it`).toBeLessThan(0.5);
    }
  });

  it('and its first leg heads INWARD from the outer quarter, so it is on the screen for the whole of it — and keeps its parity elsewhere', () => {
    /*
      ⚠️ **IN SECONDS ON THE SCREEN, WHICH IS THE REPORT'S OWN UNIT.** A body dealt the outward leg
      at lane 15 is off the screen inside a second; heading inward it has the whole lane to cross.
      Three seconds is well inside that crossing at the drifter's rate and well past the time the
      report calls *immediately*. In the middle the parity stands, so a rank of two still fans.
    */
    const near = fly(15, 1, 180);
    expect(near.firstLeg[0], 'a drifter at lane 15 set off toward the near edge').toBe(1);
    expect(near.offWithin[0], 'a drifter at lane 15 was off the screen within three seconds of being seen').toBe(false);
    const far = fly(85, 1, 180);
    expect(far.firstLeg[0], 'a drifter at lane 85 set off toward the far edge').toBe(-1);
    expect(far.offWithin[0], 'a drifter at lane 85 was off the screen within three seconds of being seen').toBe(false);
    const middle = fly(45, 2, 30);
    expect(new Set(middle.firstLeg).size, 'a rank of two in the middle of the lane set off the same way — the parity is gone and the formation no longer fans').toBe(2);
  });

  it('and over every level the game has, no lead body is first seen off the screen and none leaves it inside a second and a half', () => {
    /*
      ⚠️ **THE INSTRUMENT'S OWN CLAIM, HELD OVER THE CONTENT.** `scripts/weigh-exit.mjs` measured
      17% of the Approach's lead bodies first seen already off the screen and 27% gone sideways
      within a second and a half, all of them drifting kinds; the decision has the table. Both are
      zero on all seven now, and this is what keeps them so when a level is re-authored or a roam is
      re-tuned. The guns are silent in the instrument, so a body's flight is measured and not its
      death.
    */
    for (const kind of LEVEL_KINDS) {
      const { total, sawBody, reachedBoss } = weighExit(kind, { window: 1.5, edge: 12 });
      expect(sawBody && reachedBoss, `${kind} measured nothing`).toBe(true);
      expect(total.seenOff, `${kind}: ${total.seenOff} of ${total.bodies} lead bodies were first seen with their hull off the screen`).toBe(0);
      expect(total.offWithin, `${kind}: ${total.offWithin} of ${total.bodies} lead bodies left the screen sideways within a second and a half of being seen`).toBe(0);
    }
  });
});
