import { describe, expect, it } from 'vitest';
import { BOSS_BAR_STEPS, GameFrame } from '../src/app/frame.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/**
 * THE BOSS HAS A HEALTH BAR — `docs/decisions/0359-the-boss-has-a-health-bar.md`.
 *
 * Asked for in play: *"add end boss health bars."* Owed since the first boss play-test
 * (`reports/the-bosses-planned-2026-09-16.md`, item 4): the fish's feed, the phase turns and the forty
 * seconds 0260 sizes a fight to were events the model resolved and the picture never mentioned.
 *
 * ⚠️ **Held at the seam and not in the DOM.** The bar is chrome, and the chrome is written to by
 * `World.onBoss` on exactly the terms `onHealth` set: a remembered value, fired on a change. What is
 * guarded here is that seam — WHEN it speaks, WHAT it says, and that it says nothing per hit — driven
 * through the real frame with the real fights. The picture at the other end of it is
 * `tests/hud.browser.test.ts`'s.
 */

/** A level with a mid-boss a short way in and the end boss a short way after, and nothing else. */
const TWO_FIGHTS: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 700,
  midBoss: { kind: 'sentinel', at: 200 },
  sections: NO_SECTIONS,
  boss: 'jormungandr',
  theme: 'approach',
};

type Fixture = ReturnType<typeof playableWorld>['world'];

/** Everything the bar was told, in order. */
function listen(world: Fixture): number[] {
  const said: number[] = [];
  world.onBoss = (fraction: number): void => {
    said.push(fraction);
  };
  return said;
}

/** Steps until the boss on the field is dead, on `tests/bosses.test.ts`'s terms: its health is set to one and the guns do the rest. */
function slay(world: Fixture, frame: GameFrame, within: number): number {
  const fight = world.fight;
  for (let i = 0; i < within; i++) {
    if (world.bossPool.size > 0) world.bossPool.at(0).health = 1;
    world.ship.health = world.shipRow.health;
    frame.step();
    if (world.bossPool.size === 0 && (world.fight !== fight || world.clearedIn > 0)) return i;
  }
  return -1;
}

/** Steps until the END boss is on the field and has finished any entrance it makes. */
function untilTheEndBossArrives(world: Fixture, frame: GameFrame, said: number[]): void {
  for (let i = 0; i < 6000 && !(world.fight === 1 && world.bossPool.size > 0 && world.bossEntering < 0); i++) {
    frame.step();
    // Not a word while the animal is still flying its entrance — the fight has not started (0306).
    if (world.bossEntering >= 0) expect(said, 'the bar spoke during the entrance').toEqual([]);
  }
  expect(world.fight === 1 && world.bossPool.size > 0 && world.bossEntering < 0, 'the end boss never arrived').toBe(true);
}

describe('0359 — the boss has a health bar', () => {
  it('THE ASK: the bar comes up full when the end boss has arrived, follows it down, and goes with the body', () => {
    const { world } = playableWorld(TWO_FIGHTS);
    const frame = new GameFrame(world);
    const said = listen(world);

    // The mid-boss: arrives, fights, dies. The bar says nothing — 0247's beat inside the level is
    // not the fight the level is, and a bar for it would be the miniboss wearing the boss's readout.
    for (let i = 0; i < 400 && world.bossPool.size === 0; i++) frame.step();
    expect(world.fight, 'the first boss on the field is not the mid-boss').toBe(0);
    expect(said, 'the bar spoke for the mid-boss').toEqual([]);
    expect(slay(world, frame, 3000), 'the mid-boss could not be killed').toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 200; i++) frame.step();
    expect(said, 'the bar spoke for the mid-boss’s death').toEqual([]);

    // The end boss.
    untilTheEndBossArrives(world, frame, said);
    frame.step();
    expect(said[0], 'the bar did not open full').toBe(1);

    // A hit worth four tenths of the fight.
    world.bossPool.at(0).health = Math.floor(world.bossFullHealth * 0.6);
    frame.step();
    const after = said[said.length - 1]!;
    expect(after, 'the bar did not follow the hit down').toBeLessThan(0.62);
    expect(after, 'the bar fell further than the hit').toBeGreaterThan(0.58);

    // And its death takes it with it, in the step the body goes.
    expect(slay(world, frame, 3000), 'the end boss could not be killed').toBeGreaterThanOrEqual(0);
    expect(said[said.length - 1], 'the bar outlived the boss').toBeLessThan(0);
    // Never up, between opening and going: nothing in this fight fed it.
    for (let i = 1; i < said.length - 1; i++) {
      expect(said[i]! <= said[i - 1]!, `the bar rose from ${said[i - 1]} to ${said[i]}`).toBe(true);
    }
  });

  it('is written on a change of the quantum and not per hit: a scratch that does not move the bar says nothing', () => {
    /*
      ⚠️ **`onHealth`'s argument, on a number that moves far more often.** A boss under max weapons
      takes many hits a second; a chrome written on each of them would be the one thing in the game
      touching the DOM in the hot path. The quantum is the bar's own resolution — finer than a pixel
      of any bar the screen draws — so what is skipped is never a change the player could see.
    */
    const { world } = playableWorld(TWO_FIGHTS);
    const frame = new GameFrame(world);
    const said = listen(world);
    for (let i = 0; i < 400 && world.bossPool.size === 0; i++) frame.step();
    slay(world, frame, 3000);
    untilTheEndBossArrives(world, frame, said);
    frame.step();
    const spoken = said.length;
    expect(spoken, 'the bar never opened, so this measures nothing').toBeGreaterThan(0);

    const boss = world.bossPool.at(0);
    const scratch = Math.max(1, Math.floor(world.bossFullHealth / BOSS_BAR_STEPS / 4));
    expect(scratch / world.bossFullHealth, 'the scratch is a whole quantum, so this measures nothing').toBeLessThan(1 / BOSS_BAR_STEPS);
    // Just under one quantum off the top: the ceiling still lands on 1.
    boss.health = world.bossFullHealth - scratch;
    frame.step();
    expect(said.length, 'the bar was written for a hit too small to move it').toBe(spoken);
  });

  it('rounds UP, so a boss on its last point of health shows a sliver and never an empty bar', () => {
    /*
      An empty bar over a boss still firing reads as a bug, and a boss at one health is exactly the
      moment the player is looking. Bounded above by one quantum, so this is the rounding and not a
      floor added on top of it.
    */
    const { world } = playableWorld(TWO_FIGHTS);
    const frame = new GameFrame(world);
    const said = listen(world);
    for (let i = 0; i < 400 && world.bossPool.size === 0; i++) frame.step();
    slay(world, frame, 3000);
    untilTheEndBossArrives(world, frame, said);
    world.bossPool.at(0).health = 1;
    frame.step();
    const last = said[said.length - 1]!;
    expect(last, 'a boss on its last point of health shows an empty bar').toBeGreaterThan(0);
    expect(last, 'the sliver is more than one quantum').toBeLessThanOrEqual(1 / BOSS_BAR_STEPS + 1e-9);
  });
});
