/**
 * A roam waits to be seen — `docs/decisions/0382-a-roam-waits-to-be-seen.md`.
 *
 * Reported: *"lots of enemies that start near the top/bottom of the screen and then immediately fly
 * off the screen which is pretty stupid."* A drifting body roamed from the step it spawned, three
 * seconds before anyone could see it, and turned twenty units outside the screen; until its hull is
 * inside the view it turns inside the lane now, so it is first seen on the screen, and its first leg
 * on the screen heads inward when it is seen near an edge.
 *
 * ⚠️ **EVERY CLAIM IS MEASURED ON A FLIGHT THE FRAME FLEW, IN THE PLAYER'S UNITS** — 0027: where a
 * body is when it is first on the screen, which way it goes, how long it stays, and the same over
 * every level the game has through `scripts/weigh-exit.mjs`, which is the instrument the report was
 * measured with before anything moved.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { weighExit } from '../scripts/weigh-exit.mjs';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** One wave of drifters on a lane, arriving at the leading edge, with no boss to interrupt it. */
function drifters(lane: number, count = 1, formation: 'line' | 'column' = 'line'): LevelRow {
  return {
    waves: [{ at: 400, enemy: 'drifter', formation, count, lane }],
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
function fly(lane: number, count: number, after: number, formation: 'line' | 'column' = 'line'): { spawnLeg: number[]; seenAt: number[]; seenAcross: number[]; seenRadius: number[]; firstLeg: number[]; offWithin: boolean[] } {
  const { world } = playableWorld(drifters(lane, count, formation));
  const frame = new GameFrame(world);
  while (world.enemies.size === 0) frame.step();
  const spawnLeg: number[] = new Array(count).fill(0);
  const seenAt: number[] = new Array(count).fill(-1);
  const seenAcross: number[] = new Array(count).fill(0);
  const seenRadius: number[] = new Array(count).fill(0);
  const firstLeg: number[] = new Array(count).fill(0);
  const offWithin: boolean[] = new Array(count).fill(false);
  for (let step = 0; step < 1200; step++) {
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    frame.step();
    expect(world.enemies.size, 'a member was lost before it had been seen for long enough').toBe(count);
    let allDone = true;
    for (let i = 0; i < count; i++) {
      const e = world.enemies.at(i);
      if (step === 0) spawnLeg[i] = Math.sign(e.velAcross);
      const inView = e.along - e.radius <= world.cameraAlong + world.view.alongSpan;
      if (seenAt[i]! < 0) {
        if (inView) {
          seenAt[i] = step;
          seenAcross[i] = e.across;
          seenRadius[i] = e.radius;
          firstLeg[i] = Math.sign(e.velAcross);
        }
        allDone = false;
        continue;
      }
      if (step - seenAt[i]! <= after && (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN)) offWithin[i] = true;
      if (step - seenAt[i]! < after) allDone = false;
    }
    if (allDone) break;
  }
  return { spawnLeg, seenAt, seenAcross, seenRadius, firstLeg, offWithin };
}

describe('0382 — a roam waits to be seen', () => {
  it('THE ASKED-FOR ONE: a drifting body is first seen ON THE SCREEN, its whole hull inside the lane, wherever it has roamed to', () => {
    /*
      ⚠️ **WHERE THE PLAYER FIRST SEES IT.** The spawner places a lead wave a whole view beyond the
      leading edge and the roam runs from that step, so a body could be fifty-seven units from its
      lane by the time anyone saw it — off the screen, for a wave authored anywhere in the outer
      half. It may still wander before it is seen; what it may not do is be seen off the screen.
      Three lanes, and each member's hull is inside the lane on the step it first is in view.
    */
    for (const lane of [15, 45, 85]) {
      const { seenAt, seenAcross, seenRadius } = fly(lane, 1, 1);
      expect(seenAt[0], `a drifter at lane ${lane} was never seen`).toBeGreaterThanOrEqual(0);
      expect(seenAcross[0]! - seenRadius[0]!, `a drifter authored at lane ${lane} was first seen at ${seenAcross[0]!.toFixed(1)}, off the near edge`).toBeGreaterThanOrEqual(0);
      expect(seenAcross[0]! + seenRadius[0]!, `a drifter authored at lane ${lane} was first seen at ${seenAcross[0]!.toFixed(1)}, off the far edge`).toBeLessThanOrEqual(ACROSS_SPAN);
    }
  });

  it('and its first leg on the screen heads INWARD from the outer quarter, so it stays on the screen — and a rank still fans on its parity', () => {
    /*
      ⚠️ **IN SECONDS ON THE SCREEN, WHICH IS THE REPORT'S OWN UNIT.** A body seen at lane 15 heading
      out is off the screen inside a second, which is what the report calls *immediately*. A single
      body roams before it is seen and turns inside the lane, so where it is seen is not where it was
      authored: a drifter authored at 15 is seen at 74, in the middle, and keeps the way it was going.
      What the rule buys is the leg it is dealt when it IS seen — inward from the outer quarter — and
      so a quarter of the lane at least between any body and the edge it is heading for, which at the
      drifter's rate is a second and three-quarters. The window is a second and a half, the same one
      `scripts/weigh-exit.mjs` reads over every level below; it is NOT three seconds, because a body
      seen mid-lane and heading out honestly leaves in under three, and the turn it makes twenty
      units past the edge is 0059's number and the report's open question, not this guard's.
    */
    /*
      ⚠️ **THE FIXTURE PUTS A BODY IN EACH OUTER QUARTER, AND SAYS SO.** The first draft flew lanes 15
      and 85 and asserted the inward leg only IF the body was seen in the outer quarter — and neither
      was: both are seen mid-lane after their unseen turn, so the inward rule was never exercised and
      its probe reddened a different guard (`WRONG TEST`). A lone body's parity is always +1, so the
      far side is a lone drifter authored at 40, seen at 103 heading for the far edge; the near side
      is the second of a column at 60, dealt −1, seen at about 16 heading for the near edge. Each case
      requires its quarter, so a re-tuned roam that moves the sighting reddens the fixture rather than
      silently passing it.
    */
    const cases: { lane: number; count: number; formation: 'line' | 'column'; member: number; side: 'near' | 'far' }[] = [
      { lane: 40, count: 1, formation: 'line', member: 0, side: 'far' },
      { lane: 60, count: 2, formation: 'column', member: 1, side: 'near' },
    ];
    for (const { lane, count, formation, member, side } of cases) {
      const { seenAcross, firstLeg, offWithin } = fly(lane, count, 90, formation);
      const at = seenAcross[member]!;
      if (side === 'near') {
        expect(at, `the fixture's near case is seen at ${at.toFixed(0)}, not in the outer quarter — re-lane it`).toBeLessThan(ACROSS_SPAN * 0.25);
        expect(firstLeg[member], `a drifter seen at ${at.toFixed(0)} set off toward the near edge`).toBe(1);
      } else {
        expect(at, `the fixture's far case is seen at ${at.toFixed(0)}, not in the outer quarter — re-lane it`).toBeGreaterThan(ACROSS_SPAN * 0.75);
        expect(firstLeg[member], `a drifter seen at ${at.toFixed(0)} set off toward the far edge`).toBe(-1);
      }
      expect(offWithin[member], `a drifter authored at lane ${lane} and seen at ${at.toFixed(0)} was off the screen within a second and a half`).toBe(false);
    }
    // And a body seen mid-lane keeps the way it was going and still has a quarter of the lane in hand.
    for (const lane of [15, 85]) {
      const { seenAcross, offWithin } = fly(lane, 1, 90);
      expect(offWithin[0], `a drifter authored at lane ${lane} and seen at ${seenAcross[0]!.toFixed(0)} was off the screen within a second and a half`).toBe(false);
    }
    // And the parity is dealt at the spawn: a rank of two in the middle sets off opposite ways.
    const middle = fly(45, 2, 1);
    expect(new Set(middle.spawnLeg).size, 'a rank of two set off the same way — the parity is gone and the formation no longer fans').toBe(2);
    expect(middle.spawnLeg.includes(0), 'a member of a rank set off nowhere').toBe(false);
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
