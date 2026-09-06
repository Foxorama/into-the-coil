/**
 * The bob keeps its centre — `docs/decisions/0268-the-bob-keeps-its-centre.md`.
 *
 * Reported from play: *"there's also a bug when bosses and minibosses get health reduced and then
 * start bouncing up and down, they keep bouncing up and down off screen."*
 *
 * ⚠️ **THE ASSERTIONS ARE IN WORLD UNITS ACROSS THE LANE, WHICH IS WHAT THE PLAYER WATCHED** —
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`. The lane is a fixed hundred units on
 * every device (0023), so *the hull left the screen* is a number and not an impression, and the
 * hull's EDGE is what is held rather than its centre: half a boss outside the lane is half a boss
 * the player cannot shoot, and there is no `across` cull on a boss to bring it back.
 *
 * ⚠️ **EVERY BOBBING BOSS, READ OFF THE TABLE.** A hand-kept list of which bosses bob is a second
 * description of `BOSSES` that would go stale the day a row changes its `move`
 * ([0016](../docs/decisions/0016-a-hub-enumerates-kinds.md)), and the mid-bosses are three of the
 * six — which is what the report is mostly about.
 */

import { describe, expect, it } from 'vitest';

import { BOSSES, type BossKind } from '../src/content/bosses.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { GameFrame } from '../src/app/frame.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** Every boss whose hull flies a bob — the table's own answer, not a list beside it. */
const BOBBERS = (Object.keys(BOSSES) as BossKind[]).filter((kind) => BOSSES[kind].move.kind === 'bob');

/**
 * Fly one boss through the whole of its health, a slice at a time, and report where its hull got to.
 *
 * ⚠️ **THE HEALTH IS WALKED BY HAND rather than shot down**, so every phase is entered in order and
 * the walk is the same on every machine. What the bug needs to show itself is phase BOUNDARIES —
 * `patrolScale` changes at each one, and it was the change that lost the centre.
 */
function flyThroughEveryPhase(kind: BossKind): { low: number; high: number; phases: number } {
  const row = BOSSES[kind];
  const { world } = playableWorld({
    waves: [],
    pickups: [],
    landmarks: [],
    bossAt: 200,
    midBoss: null,
    sections: NO_SECTIONS,
    boss: kind,
    theme: 'approach',
  });
  const frame = new GameFrame(world);
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  let seen = 0;
  let lastPhase = -1;
  for (let step = 0; step < 60 * 120; step++) {
    // The ship holds its fire: this is about how the hull flies, not about the duel.
    world.fireIn = Number.MAX_SAFE_INTEGER;
    frame.step();
    if (world.bossPool.size === 0) continue;
    const boss = world.bossPool.at(0);
    if (step % 120 === 0) boss.health = Math.max(1, boss.health - row.health / 12);
    low = Math.min(low, boss.across - boss.radius);
    high = Math.max(high, boss.across + boss.radius);
    const share = boss.health / row.health;
    let phase = 0;
    for (let i = 0; i < row.phases.length; i++) if (share <= row.phases[i]!.upTo) phase = i;
    if (phase !== lastPhase) {
      seen++;
      lastPhase = phase;
    }
  }
  return { low, high, phases: seen };
}

describe('0268 — the bob keeps its centre', () => {
  it('there are bobbing bosses to fly, and mid-bosses among them', () => {
    expect(BOBBERS.length, 'no boss bobs, so every assertion below is vacuous').toBeGreaterThanOrEqual(4);
  });

  it('THE REPORTED ONE: a bobbing hull never leaves the lane, however many phases it is driven through', () => {
    /*
      ⚠️ **MEASURED WITH THE BUG IN, four of the six left it** — the chorus reached 114.8 across and
      the axis −14.2, of a lane that is 0 to 100. The two that did not were the two whose phase
      boundaries happened to fall where the offset cancelled, which is why this drives EVERY one:
      the defect was never about a particular boss and *it looked fine* was luck.
    */
    for (const kind of BOBBERS) {
      const flown = flyThroughEveryPhase(kind);
      expect(flown.phases, `${kind} was never driven past its first phase, so this measured nothing`).toBeGreaterThan(1);
      expect(flown.low, `${kind}'s hull reached ${flown.low.toFixed(1)} across, outside a lane that starts at 0`).toBeGreaterThanOrEqual(
        0,
      );
      expect(
        flown.high,
        `${kind}'s hull reached ${flown.high.toFixed(1)} across, outside a lane that ends at ${ACROSS_SPAN}`,
      ).toBeLessThanOrEqual(ACROSS_SPAN);
    }
  });

  it('and it stays centred on the lane, rather than merely staying inside it', () => {
    /*
      ⚠️ **THE INVARIANT, AND THE LINE ABOVE IS ONLY ITS CONSEQUENCE.** A hull that drifted to one
      side and oscillated there would pass *never leaves the lane* on any boss whose amplitude is
      small enough — the medusa's is 14 against a lane of 100, so it could sit twenty units off
      centre for a whole fight and nothing would say so. What the fix actually restores is that the
      position is `amplitude × sin(angle)` about the middle, so the swing is symmetric: each end
      lands within a couple of units of the amplitude, and the slack is the Euler step's own error
      rather than a budget anybody chose.
    */
    for (const kind of BOBBERS) {
      const row = BOSSES[kind];
      if (row.move.kind !== 'bob') continue;
      const flown = flyThroughEveryPhase(kind);
      const middle = ACROSS_SPAN / 2;
      const lowSwing = middle - (flown.low + row.radius);
      const highSwing = flown.high - row.radius - middle;
      expect(
        Math.abs(lowSwing - row.move.amplitude),
        `${kind} swings ${lowSwing.toFixed(1)} below the lane's middle against an amplitude of ${row.move.amplitude}`,
      ).toBeLessThan(2);
      expect(
        Math.abs(highSwing - row.move.amplitude),
        `${kind} swings ${highSwing.toFixed(1)} above the lane's middle against an amplitude of ${row.move.amplitude}`,
      ).toBeLessThan(2);
    }
  });
});
