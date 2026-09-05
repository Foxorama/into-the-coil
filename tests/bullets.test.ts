/**
 * The bullets stay on the screen — `docs/decisions/0259-the-bullets-stay-on-the-screen.md`.
 *
 * Reported from the alpha play: *"the bullet firing waves are still clustered together… there's
 * either a screen full of bullets or there's 30secs of no bullet to be seen at all… not necessarily
 * more bullets on screen, but more time for bullets overall to be on screen."*
 *
 * ⚠️ **Every assertion here is in the player's units** — seconds without a bullet on the screen, a
 * share of the level with one — over the walk `scripts/weigh-bullets.mjs` drives: the real frame,
 * the real spawner, the capped guns, a ship sweeping the lane. The walk is seeded and fixed-step,
 * so it is the same walk on every machine; nothing here reads a wall clock.
 */

import { describe, expect, it } from 'vitest';

import { ENTRY_VOLLEY, FIRE_GRID } from '../src/content/cadence.ts';
import { LEVELS, LEVEL_KINDS, MULTI_HIT_RUNUP } from '../src/content/levels.ts';
import { GameFrame } from '../src/app/frame.ts';
import { MAX_ALONG_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { weighLevel } from '../scripts/weigh-bullets.mjs';
import { NO_SECTIONS, playableWorld } from './world.ts';

/**
 * The longest a level may go without an enemy bullet on the screen, in seconds, outside the two
 * stretches a decision authored to be quiet.
 *
 * ⚠️ **A BUDGET, AND THE REPORT OWNS THE NUMBER** — 0192. *"30secs of no bullet"* is the complaint;
 * eight is what every level measures under after 0259, with the shoal — the level authored from
 * chargers and drifters for speed — the one that sets it, and the one whose stretch was converted.
 */
const DRY_BUDGET_SECONDS = 8;

/**
 * The share of the waves' time with a bullet on the screen a level must reach, at the capped
 * loadout. Two fifths: the shoal measures 42% and the batteries 82%; the floor is under the lowest,
 * and the report is about the stretches rather than the share.
 */
const COVERED_FLOOR = 0.4;

describe('0259 — the bullets stay on the screen', () => {
  const measured = new Map(LEVEL_KINDS.map((kind) => [kind, weighLevel(kind)] as const));

  it('THE REPORTED ONE: at the capped loadout, no level goes DRY_BUDGET_SECONDS without a bullet on the screen, outside the opening and level one’s run-up', () => {
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      const r = measured.get(kind)!;
      expect(r.reachedBoss, `${kind} was never driven to its boss`).toBe(true);
      expect(r.sawBullet, `${kind} never put a bullet on the screen, so this measured nothing`).toBe(true);
      /*
        The opening is the level's own quiet — nothing before 300 (0043) and a view's crossing for the
        first firing body to arrive — and level one's run-up is 0086's: a one-health band after the
        second weapon, which by decision cannot fire. Every other dry stretch is the report's.
      */
      const opening = level.waves[0]!.at + MAX_ALONG_SPAN;
      const lifts = kind === LEVEL_KINDS[0] ? level.pickups.filter((p) => p.kind === 'weapon')[1]!.at : Number.NaN;
      const authoredQuiet = (endsAt: number): boolean =>
        endsAt <= opening || (!Number.isNaN(lifts) && endsAt >= lifts && endsAt <= lifts + MULTI_HIT_RUNUP + MAX_ALONG_SPAN);
      const held = r.dryStretches.filter((s) => !authoredQuiet(s.endsAt));
      const worst = held.reduce((a, b) => (b.seconds > a.seconds ? b : a), { seconds: 0, endsAt: 0 });
      expect(
        worst.seconds,
        `${kind} goes ${worst.seconds.toFixed(1)}s without a bullet on the screen, ending ${worst.endsAt} units in`,
      ).toBeLessThanOrEqual(DRY_BUDGET_SECONDS);
    }
  });

  it('and a bullet is on the screen for at least COVERED_FLOOR of the waves’ time in every level', () => {
    for (const kind of LEVEL_KINDS) {
      const r = measured.get(kind)!;
      expect(r.wavesCovered, `${kind} has a bullet on the screen ${(r.wavesCovered * 100).toFixed(0)}% of its waves' time`).toBeGreaterThanOrEqual(
        COVERED_FLOOR,
      );
    }
  });

  it('THE ENTRY VOLLEY: a body fires inside a third of a second of its hull entering the view, and a formation still opens as a figure', () => {
    /*
      A wave of five turrets, spawned beyond the view as every leading wave is. Each fires within the
      entry gap of its hull crossing the edge — in seconds — and the five do not fire on one step.
    */
    const { world } = playableWorld({
      waves: [{ at: 400, enemy: 'turret', formation: 'line', count: 5, lane: 50 }],
      pickups: [],
      landmarks: [],
      bossAt: Number.POSITIVE_INFINITY,
      midBoss: null,
      sections: NO_SECTIONS,
      boss: 'sentinel',
      theme: 'approach',
    });
    const frame = new GameFrame(world);
    const entered = new Map<number, number>();
    const fired: number[] = [];
    let before = 0;
    for (let step = 0; step < STEPS_PER_SECOND * 30 && fired.length < 5; step++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      frame.step();
      for (let i = 0; i < world.enemies.size; i++) {
        const e = world.enemies.at(i);
        if (!entered.has(i) && e.along - e.radius <= world.cameraAlong + world.view.alongSpan) entered.set(i, step);
      }
      if (world.enemyShots.size > before) fired.push(step);
      before = world.enemyShots.size;
    }
    expect(entered.size, 'no turret ever entered the view').toBe(5);
    expect(fired.length, 'the wave never fired five volleys').toBe(5);
    const firstEntry = Math.min(...entered.values());
    const gap = (fired[0]! - firstEntry) / STEPS_PER_SECOND;
    expect(gap, `the first volley came ${gap.toFixed(2)}s after the first hull entered the view`).toBeLessThanOrEqual(
      (2 * ENTRY_VOLLEY) / STEPS_PER_SECOND,
    );
    expect(gap, 'a body fired before its hull was on the screen').toBeGreaterThanOrEqual(0);
    expect(new Set(fired).size, `all five fired on ${new Set(fired).size} step(s) — a volley, not a figure`).toBeGreaterThan(1);
    expect(ENTRY_VOLLEY / FIRE_GRID, 'the entry gap has one slot, so a formation would fire in unison').toBeGreaterThanOrEqual(2);
  });
});
