import { describe, expect, it } from 'vitest';
import { GameFrame, advanceLevel, resetScene, respawn, takeShield, type World } from '../src/app/frame.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { AUTHORED, BOSS_FIGHTS, DIFFICULTIES, DIFFICULTY_KINDS, type DifficultyKind, type DifficultyRow } from '../src/content/difficulty.ts';
import { LEVELS, LEVEL_KINDS, MID_BOSS_DROP, type LevelRow } from '../src/content/levels.ts';
import { PICKUPS, PICKUP_KINDS } from '../src/content/pickups.ts';
import { MAX_SHIELDS, SHIPS, SHIP_KINDS, shellLevelFor, shellOpenFor, shieldsOf } from '../src/content/ships.ts';
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
  it('THE ASK: Legend opens every life full and renewed, Savior on one, Burn on the hull with three to fly for', () => {
    // The player's words, which is why this names values: they are the ask, not a hand's tuning.
    // 0355 for Legend; 0614 for the other two: *"the game is quite hard"*; 0650 for Savior's death:
    // *"Savior → spawn w/ shield after death"*.
    expect(DIFFICULTIES.legendary.shellOpen, 'a Legendary life does not open on a full shell').toBe(DIFFICULTIES.legendary.shellCap);
    expect(DIFFICULTIES.legendary.shellCap, 'a Legendary shell is not the whole readout').toBe(MAX_SHIELDS);
    expect(DIFFICULTIES.legendary.shellLevel, 'a Legendary level is not renewed to full').toBe(DIFFICULTIES.legendary.shellCap);
    expect(DIFFICULTIES.savior.shellLevel, 'a Savior level does not start with one shield').toBe(1);
    expect(DIFFICULTIES.savior.shellOpen, 'a Savior life after a death does not open on one shield').toBe(1);
    expect(DIFFICULTIES.savior.shellCap, 'Savior can no longer carry a full shell').toBe(MAX_SHIELDS);
    expect(DIFFICULTIES.burn.shellLevel, 'a Burn level opens wearing a shell').toBe(0);
    expect(DIFFICULTIES.burn.shellOpen, 'a Burn life opens wearing a shell').toBe(0);
    expect(DIFFICULTIES.burn.shellCap, 'Burn cannot gain up to three shields').toBe(MAX_SHIELDS);
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
      // 0614: and a level. Not against `shellOpen` — a tier that gave a shield on a death and none at a
      // boundary would be a correct row.
      expect(row.shellLevel, `${name} opens a level on more shields than it may carry`).toBeLessThanOrEqual(row.shellCap);
      expect(row.shellLevel, `${name} opens a level on a negative shell`).toBeGreaterThanOrEqual(0);
      expect(
        row.shellCap,
        `${name} may carry ${row.shellCap} shields and the shell pool in src/app/mount.ts holds ${MAX_SHIELDS} — the pool owns that number`,
      ).toBeLessThanOrEqual(MAX_SHIELDS);
    }
    // And a ship's own count, where its row says one — 0609, on the same budget and the same owner.
    for (const ship of SHIP_KINDS) {
      const own = SHIPS[ship].shields;
      if (own === null) continue;
      expect(own, `the ${ship} opens a life on a negative shell`).toBeGreaterThanOrEqual(0);
      expect(own, `the ${ship} may carry ${own} shields and the shell pool in src/app/mount.ts holds ${MAX_SHIELDS} — the pool owns that number`).toBeLessThanOrEqual(MAX_SHIELDS);
    }
  });

  it('THE BASELINE: the fixtures stand on the content, which multiplies nothing and opens on the hull', () => {
    // `tests/world.ts` defaults to this row; a baseline that armoured the ship would armour every
    // guard in the suite that names no tier.
    for (const axis of ['toughness', 'fireGap', 'closing', 'shotSpeed', 'aggression', 'crowd'] as const) {
      expect(AUTHORED[axis], `the baseline multiplies ${axis}`).toBe(1);
    }
    // And its bosses in both fights — 0532's multiplier is a tier's, never the content's.
    for (const fight of BOSS_FIGHTS) {
      expect(AUTHORED.bossToughness[fight], `the baseline multiplies the ${fight} boss`).toBe(1);
    }
    expect(AUTHORED.shellOpen, 'the baseline opens a life wearing a shell').toBe(0);
    expect(AUTHORED.shellLevel, 'the baseline opens a level wearing a shell').toBe(0);
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
    // In every ship — 0441: the shell is the tier's, and a ship whose row opened on its own would be
    // a different answer here. 0609 is that row: the Hamster Ball opens on its own three on every tier,
    // so what each ship opens on is `shellOpenFor`, which is the tier's wherever the row says nothing.
    // Since 0614 a run's start is a LEVEL's (`shellLevelFor`) and a death and a continue are a life's.
    for (const tier of DIFFICULTY_KINDS) for (const ship of SHIP_KINDS) {
      const row = { shellOpen: shellOpenFor(SHIPS[ship], DIFFICULTIES[tier]), shellLevel: shellLevelFor(SHIPS[ship], DIFFICULTIES[tier]) };
      const run = shell(tier);
      const { world, frame } = run;

      run.lifecycle.begin(tier, ship, 'free');
      expect(world.shipRow, `a ${tier} run begun in the ${ship} flies another ship`).toBe(SHIPS[ship]);
      frame.step();
      expect(shields(world), `a ${tier} ${ship} run opens on the wrong shell`).toBe(row.shellLevel);
      expect(world.shieldOrbs.size, `a ${tier} ${ship} run opens wearing the wrong number of marks`).toBe(row.shellLevel);

      // A DEATH: the shell spent first, so the life ends on the hull and a respawn that kept what the
      // dead ship wore could not pass for one that opens on the tier's.
      world.ship.health = world.shipRow.health;
      const died = run.deaths.count;
      hit(world, frame);
      for (let i = 0; i < 600 && run.deaths.count === died; i++) frame.step();
      expect(run.deaths.count, 'the ship was hit on its hull and never died').toBe(died + 1);
      frame.step();
      expect(shields(world), `a ${tier} ${ship} life after a death opens on the wrong shell`).toBe(row.shellOpen);
      expect(world.shieldOrbs.size, `a ${tier} ${ship} life after a death wears the wrong number of marks`).toBe(row.shellOpen);

      // A CONTINUE: every life spent the way `mount` spends them, then the offer taken.
      for (let lives = run.state().run.lives; lives > 0; lives--) {
        world.ship.health = 0;
        run.dispatch({ slice: 'run', type: 'lifeLost', cause: 'fire' });
        if (run.state().run.lives > 0) respawn(world);
      }
      world.ship.health = 0;
      run.lifecycle.resume();
      frame.step();
      expect(shields(world), `a ${tier} ${ship} continue opens on the wrong shell`).toBe(row.shellOpen);
      expect(world.shieldOrbs.size, `a ${tier} ${ship} continue wears the wrong number of marks`).toBe(row.shellOpen);
    }
  });
});

describe('0614, 0650 — a life’s shell and a level’s are read apart', () => {
  it('a tier whose two counts differ opens a run and a boundary on the level’s, and a death on the life’s', () => {
    /*
      0650 gave Savior's death the shield its level opens on, so no shipped tier says two numbers now, and the guards
      above walk the shipped tiers. The split is still each tier's to say (0282: a feature lands when it can differ
      per instance), so it is held here on a row that says two.
    */
    const split: DifficultyRow = { ...DIFFICULTIES.savior, shellOpen: 0, shellLevel: 2 };
    const { world } = playableWorld(NO_LEVEL);
    world.difficulty = split;
    resetScene(world);
    expect(shields(world), 'a run’s start opened on the life’s shell, not the level’s').toBe(split.shellLevel);
    respawn(world);
    expect(shields(world), 'a death opened on the level’s shell, not the life’s').toBe(split.shellOpen);
    advanceLevel(world, NO_LEVEL, 1);
    expect(shields(world), 'a boundary renewed to the life’s shell, not the level’s').toBe(split.shellLevel);
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
        // The LEVEL's shell since 0614 — a life's no longer reaches a boundary.
        const want = Math.max(carried, row.shellLevel);
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
    midBoss: { kind: 'sentinel', at: 200, windowSeconds: 25 },
    sections: NO_SECTIONS,
    boss: 'jormungandr',
    theme: 'approach',
  };

  /*
    ⚠️ **A SHIELD THE TIER CANNOT CARRY IS ITS ROW'S `bare` SINCE 0447, AND WITHHELD ONLY WHERE THAT
    IS NULL.** *"In Burn difficulty, when a miniboss dies it'll spit out a void bomb pickup in place of
    the shield."* So the drop on Burn is the ward where the shield was; `withheldSomewhere` below now
    asks whether any tier REPLACED anything, which is the half the rule exists for.
  */
  function carriable(row: DifficultyRow): string[] {
    const out: string[] = [];
    for (const kind of MID_BOSS_DROP) {
      if (PICKUPS[kind].effect !== 'shield' || row.shellCap > 0) out.push(kind);
      else if (PICKUPS[kind].bare !== null) out.push(PICKUPS[kind].bare);
    }
    return out;
  }

  /*
    ⚠️ **NO TIER CARRIES A SHELL OF ZERO SINCE 0614**, so the withholding is driven on a row that does —
    Burn's numbers with 0355's old cap — rather than left as a rule nothing runs. It is the default for
    any shell of zero, a tier's or a ship's (`shellCapFor`, 0609).
  */
  const SHELLESS: DifficultyRow = { ...DIFFICULTIES.burn, shellOpen: 0, shellCap: 0 };

  it('the mid-boss’s death throws every piece the tier can carry and no other, through the real frame', () => {
    let withheldSomewhere = false;
    const rows: [string, DifficultyKind, DifficultyRow][] = DIFFICULTY_KINDS.map((k) => [k, k, DIFFICULTIES[k]]);
    for (const [tier, kind, row] of [...rows, ['a shell of zero', 'burn', SHELLESS] as [string, DifficultyKind, DifficultyRow]]) {
      const { world } = playableWorld(MID_FIGHT, kind);
      world.difficulty = row;
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
      const want = carriable(row);
      if (want.some((kind, i) => kind !== MID_BOSS_DROP[i]) || want.length < MID_BOSS_DROP.length) withheldSomewhere = true;
      expect(thrown.sort(), `${tier}: the drop is not what the tier can carry`).toEqual([...want].sort());
    }
    // Otherwise the withholding half was never exercised and this is a copy of 0256's guard.
    expect(withheldSomewhere, 'no tier withholds anything, so the rule was never run').toBe(true);
  });

  /** Thirty authored pickups and nothing else — each drawn at random as it spawns (0575). */
  const SCATTER: LevelRow = { ...NO_LEVEL, pickups: Array.from({ length: 30 }, (_, i) => ({ at: 150 + i * 40, lane: 50 })) };

  it('the random pickups draw a shield on every tier that can carry one, and the ward only where none can', () => {
    /*
      0614: *"do add shields back into the random item drop pool for burn, not just for boss drops."*
      The level's pickups are drawn by `drawKind` and offered through the same `offeredAs` as the
      mid-boss's drop, so this drives the real frame through a level of them on every tier and on a
      shell of zero, and reads what spawned.
    */
    const rows: [string, DifficultyKind, DifficultyRow][] = DIFFICULTY_KINDS.map((k) => [k, k, DIFFICULTIES[k]]);
    for (const [tier, kind, row] of [...rows, ['a shell of zero', 'burn', SHELLESS] as [string, DifficultyKind, DifficultyRow]]) {
      const { world } = playableWorld(SCATTER, kind);
      world.difficulty = row;
      const frame = new GameFrame(world);
      const seen = new Set<string>();
      for (let i = 0; i < 4000 && world.nextPickup < SCATTER.pickups.length; i++) {
        world.ship.health = world.shipRow.health;
        frame.step();
        for (let p = 0; p < world.pickups.size; p++) seen.add(PICKUP_KINDS[world.pickups.at(p).kind]!);
      }
      expect(world.nextPickup, `${tier}: the level's pickups never all spawned`).toBe(SCATTER.pickups.length);
      if (row.shellCap > 0) {
        expect(seen.has('shield'), `${tier}: thirty random pickups and not one shield`).toBe(true);
        expect(seen.has('ward'), `${tier}: a ward drawn on a tier that carries shields`).toBe(false);
      } else {
        expect(seen.has('shield'), `${tier}: a shield drawn on a shell of zero`).toBe(false);
        expect(seen.has('ward'), `${tier}: thirty random pickups and the shield's place never offered`).toBe(true);
      }
    }
  });

  it('a shield never raises health past the tier’s full shell, and the marks agree', () => {
    // With `SHELLESS`, since 0614 put every tier at `MAX_SHIELDS`: a cap read off the ceiling would
    // otherwise agree with the tier's on every row there is.
    const rows: [string, DifficultyKind, DifficultyRow][] = DIFFICULTY_KINDS.map((k) => [k, k, DIFFICULTIES[k]]);
    for (const [tier, kind, row] of [...rows, ['a shell of zero', 'burn', SHELLESS] as [string, DifficultyKind, DifficultyRow]]) {
      const { world } = playableWorld(NO_LEVEL, kind);
      world.difficulty = row;
      const frame = new GameFrame(world);
      world.ship.health = world.shipRow.health;
      for (let i = 0; i < MAX_SHIELDS + 3; i++) takeShield(world);
      expect(shields(world), `${tier}: a ship took ${shields(world)} shields and may carry ${row.shellCap}`).toBe(row.shellCap);
      frame.step();
      expect(world.shieldOrbs.size, `${tier}: the shell wears more marks than the tier allows`).toBe(row.shellCap);
    }
  });
});
