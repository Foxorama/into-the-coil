import { describe, expect, it } from 'vitest';
import { GameFrame, advanceLevel, respawn, takeShield, type World } from '../src/app/frame.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { AUTHORED, DIFFICULTIES, DIFFICULTY_KINDS, type DifficultyKind, type DifficultyRow } from '../src/content/difficulty.ts';
import { LEVELS, LEVEL_KINDS, MID_BOSS_DROP, type LevelRow } from '../src/content/levels.ts';
import { PICKUPS, PICKUP_KINDS } from '../src/content/pickups.ts';
import { MAX_SHIELDS, shieldsOf } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { reset } from '../src/sim/entity.ts';
import { initialState, reduce, type Action, type State } from '../src/state/root.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';

/**
 * A TIER OPENS ON A SHELL.
 *
 * `docs/decisions/0355-a-tier-opens-on-a-shell.md`, from `reports/the-tiers-planned-2026-09-22.md`.
 * Asked: *"saviour — no change to behaviour; burn — no shields; legend — start with 3 shields and you
 * start each level with 3 shields fully renewed"*, then *"start with full"* of a death and *"remove
 * the shield pickups from burn, no replacement pickups, just remove them."*
 *
 * ⚠️ **Every guard walks every tier and reads the numbers off the row**, so a tier whose shell is
 * played and changed changes these with it. The one exception is THE ASK below, which holds the
 * player's own words rather than a hand's guess.
 *
 * ⚠️ **The shell is a PICTURE of a number** (0050, 0036), so where a guard says what a life opens
 * with it also counts the orbiting marks the player sees.
 */

/** Shields on the ship, read the only way the game reads them. */
function shields(world: World): number {
  return shieldsOf(world.shipRow, world.ship.health);
}

/** Fire one enemy bullet into the ship from point-blank, and step until it lands. */
function hit(world: World, frame: GameFrame): void {
  const before = world.ship.health;
  for (let i = 0; i < 240; i++) {
    if (world.enemyShots.size === 0) {
      const shot = world.enemyShots.spawn()!;
      reset(shot, world.ship.along + 6, world.ship.across, SHOTS.spit);
      shot.velAlong = -SHOTS.spit.speed + world.scrollPerStep;
    }
    frame.step();
    if (world.ship.health < before) return;
  }
  throw new Error('the ship was never hit — the fixture is not measuring what it says it is');
}

describe('0355 — the rows', () => {
  it('THE ASK: Legend opens every life full and renewed, Savior is as it was, Burn carries none', () => {
    // The player's words, which is why this names values: they are the ask, not a hand's tuning.
    expect(DIFFICULTIES.legendary.shellOpen, 'a Legendary life does not open on a full shell').toBe(DIFFICULTIES.legendary.shellCap);
    expect(DIFFICULTIES.legendary.shellCap, 'a Legendary shell is not the whole readout').toBe(MAX_SHIELDS);
    expect(DIFFICULTIES.savior.shellOpen, 'Savior changed: a life no longer opens on the hull').toBe(0);
    expect(DIFFICULTIES.savior.shellCap, 'Savior changed: it can no longer carry a full shell').toBe(MAX_SHIELDS);
    expect(DIFFICULTIES.burn.shellCap, 'Burn can carry a shield').toBe(0);
  });

  it('a tier opens on no more than it may carry, and carries no more than the pool can hold', () => {
    /*
      A BUDGET, and its owner is the shell pool: `CAPACITY.shieldOrbs` in `src/app/mount.ts` is
      `MAX_SHIELDS` long, and so is the most the readout grows. A cap above it is a mark with no slot
      to be drawn in; an opening above the cap is a life that starts over its own ceiling.
    */
    for (const [name, row] of [...DIFFICULTY_KINDS.map((k) => [k, DIFFICULTIES[k]] as const), ['AUTHORED', AUTHORED] as const]) {
      expect(row.shellOpen, `${name} opens a life on a negative shell`).toBeGreaterThanOrEqual(0);
      expect(row.shellOpen, `${name} opens a life on more shields than it may carry`).toBeLessThanOrEqual(row.shellCap);
      expect(
        row.shellCap,
        `${name} may carry ${row.shellCap} shields and the shell pool in src/app/mount.ts holds ${MAX_SHIELDS} — the pool owns that number`,
      ).toBeLessThanOrEqual(MAX_SHIELDS);
    }
  });

  it('THE BASELINE: the fixtures stand on the content, which multiplies nothing and opens on the hull', () => {
    // `tests/world.ts` defaults to this row; a baseline that armoured the ship would armour every
    // guard in the suite that names no tier.
    for (const axis of ['toughness', 'fireGap', 'closing', 'shotSpeed', 'aggression', 'crowd'] as const) {
      expect(AUTHORED[axis], `the baseline multiplies ${axis}`).toBe(1);
    }
    expect(AUTHORED.shellOpen, 'the baseline opens a life wearing a shell').toBe(0);
    expect(AUTHORED.shellCap, 'the baseline cannot carry what a shield pickup gives').toBe(MAX_SHIELDS);
    expect(DIFFICULTY_KINDS as readonly string[], 'the baseline became a button').not.toContain('authored');
    const { world } = playableWorld(NO_LEVEL);
    expect(world.difficulty, 'a fixture naming no tier does not stand on the baseline').toBe(AUTHORED);
  });
});

describe('0355 — a life opens on its tier’s shell', () => {
  /** The shell minus the canvas, on `tests/continue.test.ts`'s terms: the real reducer and lifecycle. */
  function shell(tier: DifficultyKind) {
    const built = playableWorld(LEVELS[LEVEL_KINDS[0]!], tier);
    let current: State = initialState;
    const dispatch = (action: Action): void => {
      current = reduce(current, action);
    };
    const lifecycle = makeLifecycle(built.world, dispatch, () => current.run);
    return { ...built, dispatch, state: (): State => current, lifecycle, frame: new GameFrame(built.world) };
  }

  it('at the run’s start, after a death and after a continue — the number and the marks', () => {
    for (const tier of DIFFICULTY_KINDS) {
      const row = DIFFICULTIES[tier];
      const run = shell(tier);
      const { world, frame } = run;

      run.lifecycle.begin(tier);
      frame.step();
      expect(shields(world), `a ${tier} run opens on the wrong shell`).toBe(row.shellOpen);
      expect(world.shieldOrbs.size, `a ${tier} run opens wearing the wrong number of marks`).toBe(row.shellOpen);

      // A DEATH: the shell spent first, so the life ends on the hull and a respawn that kept what the
      // dead ship wore could not pass for one that opens on the tier's.
      world.ship.health = world.shipRow.health;
      const died = run.deaths.count;
      hit(world, frame);
      for (let i = 0; i < 600 && run.deaths.count === died; i++) frame.step();
      expect(run.deaths.count, 'the ship was hit on its hull and never died').toBe(died + 1);
      frame.step();
      expect(shields(world), `a ${tier} life after a death opens on the wrong shell`).toBe(row.shellOpen);
      expect(world.shieldOrbs.size, `a ${tier} life after a death wears the wrong number of marks`).toBe(row.shellOpen);

      // A CONTINUE: every life spent the way `mount` spends them, then the offer taken.
      for (let lives = run.state().run.lives; lives > 0; lives--) {
        world.ship.health = 0;
        run.dispatch({ slice: 'run', type: 'lifeLost' });
        if (run.state().run.lives > 0) respawn(world);
      }
      world.ship.health = 0;
      run.lifecycle.resume();
      frame.step();
      expect(shields(world), `a ${tier} continue opens on the wrong shell`).toBe(row.shellOpen);
      expect(world.shieldOrbs.size, `a ${tier} continue wears the wrong number of marks`).toBe(row.shellOpen);
    }
  });
});

describe('0355 — a level boundary renews the shell and never lowers it', () => {
  it('raises what the ship carries to the tier’s opening shell, and keeps anything above it', () => {
    for (const tier of DIFFICULTY_KINDS) {
      const row = DIFFICULTIES[tier];
      for (let carried = 0; carried <= row.shellCap; carried++) {
        const { world } = playableWorld(NO_LEVEL, tier);
        const frame = new GameFrame(world);
        world.ship.health = world.shipRow.health + carried;
        advanceLevel(world, NO_LEVEL, 1);
        const want = Math.max(carried, row.shellOpen);
        expect(shields(world), `${tier}: a ship carrying ${carried} crossed a boundary with ${shields(world)}`).toBe(want);
        frame.step();
        expect(world.shieldOrbs.size, `${tier}: the renewed shell is a number with no marks`).toBe(want);
      }
    }
  });
});

describe('0355 — a pickup the tier cannot carry is withheld, and nothing else is', () => {
  /** A mid-boss and nothing else before it, on `tests/bosses.test.ts`'s terms. */
  const MID_FIGHT: LevelRow = {
    waves: [],
    pickups: [],
    landmarks: [],
    bossAt: 700,
    midBoss: { kind: 'sentinel', at: 200 },
    sections: NO_SECTIONS,
    boss: 'jormungandr',
    theme: 'approach',
  };

  function carriable(row: DifficultyRow): string[] {
    return MID_BOSS_DROP.filter((kind) => PICKUPS[kind].effect !== 'shield' || row.shellCap > 0);
  }

  it('the mid-boss’s death throws every piece the tier can carry and no other, through the real frame', () => {
    let withheldSomewhere = false;
    for (const tier of DIFFICULTY_KINDS) {
      const { world } = playableWorld(MID_FIGHT, tier);
      const frame = new GameFrame(world);
      for (let i = 0; i < 400 && world.bossPool.size === 0; i++) frame.step();
      expect(world.bossPool.size, 'the mid-boss never arrived').toBe(1);
      const fight = world.fight;
      for (let i = 0; i < 3000 && !(world.bossPool.size === 0 && world.fight !== fight); i++) {
        if (world.bossPool.size > 0) world.bossPool.at(0).health = 1;
        // Held alive and kept at the back of its box, so it neither dies nor collects what is counted.
        world.ship.health = world.shipRow.health;
        frame.step();
      }
      expect(world.fight, `${tier}: the mid-boss could not be killed`).not.toBe(fight);
      const thrown: string[] = [];
      for (let i = 0; i < world.pickups.size; i++) thrown.push(PICKUP_KINDS[world.pickups.at(i).kind]!);
      const want = carriable(DIFFICULTIES[tier]);
      if (want.length < MID_BOSS_DROP.length) withheldSomewhere = true;
      expect(thrown.sort(), `${tier}: the drop is not what the tier can carry`).toEqual([...want].sort());
    }
    // Otherwise the withholding half was never exercised and this is a copy of 0256's guard.
    expect(withheldSomewhere, 'no tier withholds anything, so the rule was never run').toBe(true);
  });

  it('a shield never raises health past the tier’s full shell, and the marks agree', () => {
    for (const tier of DIFFICULTY_KINDS) {
      const row = DIFFICULTIES[tier];
      const { world } = playableWorld(NO_LEVEL, tier);
      const frame = new GameFrame(world);
      world.ship.health = world.shipRow.health;
      for (let i = 0; i < MAX_SHIELDS + 3; i++) takeShield(world);
      expect(shields(world), `${tier}: a ship took ${shields(world)} shields and may carry ${row.shellCap}`).toBe(row.shellCap);
      frame.step();
      expect(world.shieldOrbs.size, `${tier}: the shell wears more marks than the tier allows`).toBe(row.shellCap);
    }
  });
});
