/**
 * The window is the fight — `docs/decisions/0502-the-window-is-the-fight.md`.
 *
 * Played: *"mire felt really weird with the overlap as it was heavy at the front of the level and
 * then hardly any waves near the end"*; on how long a mid-boss takes, *"depending on the weapon
 * anywhere between 10-25 secs or so. so let's go with 25 secs and if you take longer to kill the
 * miniboss you get increased difficulty with adds"*; and of an early kill, *"leave the gap empty."*
 *
 * ⚠️ **EVERY ASSERTION IS IN SECONDS, MEASURED THROUGH THE REAL FRAME** —
 * [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md). A level's script is a list of
 * places and the window is a duration; the step a mid-boss is put down on and the step the next wave
 * is put down on are what the player lives through, so those are what is counted. A guard that
 * subtracted `at`s would agree with the arithmetic that placed them.
 *
 * ⚠️ **AN INVARIANT, NOT A BUDGET** — [0192](../docs/decisions/0192-a-guard-holds-an-invariant.md).
 * Name a change to the content that would redden it and be correct: a wave inside the window is the
 * thing the player declined, and a later first wave is a window the row does not say. Neither is
 * ever right, so both fail hard.
 *
 * ⚠️ **AND IT IS NOT A RANKING GUARD** — [0295](../docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md).
 * Each level is held to its OWN row's window and to nothing any other level does.
 */

import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS, type LevelKind } from '../src/content/levels.ts';
import { GameFrame } from '../src/app/frame.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld } from './world.ts';

/**
 * The seconds the player asked for — a literal, and not read off a row.
 *
 * ⚠️ **SO A WINDOW SET TO NOTHING CANNOT PASS.** The walk below is held to each row's own `window`,
 * which is right — a level may be written for a longer fight (0282) — but a guard measured only
 * against the number it guards is green when that number is zero. This is the one place the ask
 * itself is written down.
 */
const ASKED_SECONDS = 25;

/**
 * How late after its window a level's script may resume, in seconds: the authoring grid, and no more.
 *
 * ⚠️ **THE WINDOW IS THE GAP, NOT A FLOOR UNDER IT.** *"If you take longer to kill the miniboss you
 * get increased difficulty with adds"* — the adds are owed when the window closes, so a script that
 * resumed ten seconds later would be a longer window than its row says. A whole second is the room a
 * wave's `at` needs to be a whole number of units past the window's end.
 */
const RESUMES_WITHIN_SECONDS = 1;

/** One wave the walk saw offered: the step, and how many bodies it put on the field. */
interface Offer {
  index: number;
  step: number;
  bodies: number;
  midBossAlive: boolean;
}

/**
 * One level, flown by an immortal ship from the start until every wave has been offered.
 *
 * `kill`: the mid-boss is put to one health and the ship parks under it, so it dies to the first hit
 * — the earliest kill there is, which is the case *"leave the gap empty"* is about. Otherwise the
 * hull's health is held where it arrived, so it lives through the whole script — the case
 * *"increased difficulty with adds"* is about — and the ship sweeps the lane with its guns on, so the
 * waves die as they would and the pool has room for the next: a wave the pool cannot hold is dropped
 * (`src/sim/pool.ts`), and a walk that let them pile up would read that as a wave the rule skipped.
 */
const walk = (kind: LevelKind, kill: boolean): { putDown: number; offers: Offer[] } => {
  const level = LEVELS[kind];
  const { world } = playableWorld(level);
  const frame = new GameFrame(world);
  let putDown = -1;
  let held = 0;
  const offers: Offer[] = [];
  const cap = STEPS_PER_SECOND * 60 * 6;
  for (let step = 0; world.nextWave < level.waves.length && step < cap; step++) {
    world.ship.health = world.shipRow.health;
    const fighting = world.fight === 0 && world.bossPool.size > 0;
    world.ship.prevAcross = world.ship.across;
    if (fighting && kill) {
      const hull = world.bossPool.at(0);
      hull.health = 1;
      world.ship.across = hull.across;
    } else {
      if (fighting) world.bossPool.at(0).health = held;
      const phase = (step / (8 * STEPS_PER_SECOND)) * Math.PI * 2;
      world.ship.across = ACROSS_SPAN / 2 + Math.sin(phase) * (ACROSS_SPAN * 0.35);
    }
    const wave = world.nextWave;
    const spawned = world.score.spawned;
    frame.step();
    if (putDown < 0 && world.fight === 0 && world.bossPool.size > 0) {
      putDown = step;
      held = world.bossPool.at(0).health;
    }
    if (world.nextWave > wave) {
      // A step that offers two waves splits nothing between them: the bodies are the step's.
      offers.push({ index: wave, step, bodies: world.score.spawned - spawned, midBossAlive: world.fight === 0 && world.bossPool.size > 0 });
    }
  }
  return { putDown, offers };
};

const killed = new Map(LEVEL_KINDS.map((kind) => [kind, walk(kind, true)] as const));
const fought = new Map(LEVEL_KINDS.map((kind) => [kind, walk(kind, false)] as const));

/** Seconds from the mid-boss's put-down to the first wave put down after it. */
const gapOf = (r: { putDown: number; offers: Offer[] }): number => {
  const next = r.offers.find((o) => o.step > r.putDown);
  return next === undefined ? Number.POSITIVE_INFINITY : (next.step - r.putDown) / STEPS_PER_SECOND;
};

describe('0502 — the window is the fight', () => {
  it('every level has a mid-boss, the walks met it, and there is script after its window', () => {
    for (const kind of LEVEL_KINDS) {
      expect(LEVELS[kind].midBoss, `${kind} has no mid-boss, so it has no window`).not.toBeNull();
      for (const [name, r] of [['killed', killed.get(kind)!], ['fought', fought.get(kind)!]] as const) {
        expect(r.putDown, `${kind}'s ${name} walk never put its mid-boss down`).toBeGreaterThan(0);
        expect(Number.isFinite(gapOf(r)), `${kind}'s ${name} walk offered nothing after its mid-boss`).toBe(true);
      }
    }
  });

  it('THE REPORTED ONE: after a mid-boss arrives nothing new is put down for its window, however soon it dies', () => {
    for (const kind of LEVEL_KINDS) {
      const seconds = LEVELS[kind].midBoss!.windowSeconds;
      for (const [name, r] of [['killed at once', killed.get(kind)!], ['never killed', fought.get(kind)!]] as const) {
        const gap = gapOf(r);
        expect(
          gap,
          `${kind}, mid-boss ${name}: a wave was put down ${gap.toFixed(2)}s after the mid-boss, inside its ${seconds}s window — ` +
            '"leave the gap empty"',
        ).toBeGreaterThanOrEqual(seconds);
      }
    }
  });

  it('and the window is the gap: the script resumes when it closes, not later', () => {
    for (const kind of LEVEL_KINDS) {
      const seconds = LEVELS[kind].midBoss!.windowSeconds;
      const gap = gapOf(killed.get(kind)!);
      expect(
        gap,
        `${kind} puts nothing new down for ${gap.toFixed(1)}s after its mid-boss, where its row says ${seconds}s`,
      ).toBeLessThan(seconds + RESUMES_WITHIN_SECONDS);
    }
  });

  it('and past the window every wave comes as authored while the mid-boss still lives — the adds', () => {
    /*
      *"If you take longer to kill the miniboss you get increased difficulty with adds."* The hull is
      held alive through the whole script, so every wave offered after its window is offered over a
      fight that has run longer than the level was written for; each one must put bodies on the
      field. 0267 skipped two firing waves in three here, which is the build this replaces.
    */
    for (const kind of LEVEL_KINDS) {
      const r = fought.get(kind)!;
      const seconds = LEVELS[kind].midBoss!.windowSeconds;
      const adds = r.offers.filter((o) => o.midBossAlive && (o.step - r.putDown) / STEPS_PER_SECOND >= seconds);
      expect(adds.length, `${kind}'s mid-boss never lived past its window, so this measured no adds`).toBeGreaterThan(0);
      for (const o of adds) {
        const wave = LEVELS[kind].waves[o.index]!;
        expect(
          o.bodies,
          `${kind}'s ${wave.enemy} wave at ${wave.at} was offered over a fight past its window and put nothing on the field`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('and every level is written for the twenty-five seconds the player asked for', () => {
    for (const kind of LEVEL_KINDS) {
      expect(LEVELS[kind].midBoss!.windowSeconds, `${kind}'s window is shorter than the fight the player reported`).toBeGreaterThanOrEqual(
        ASKED_SECONDS,
      );
    }
  });
});
