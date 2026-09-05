/**
 * A level has a mid-boss and a real one —
 * `docs/decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md`.
 *
 * The seventh play-test: *"change the current bosses to have about 50% less health and then be
 * mid-level bosses and add in the actual real bosses."* Every level now carries two fights: a
 * mid-boss inside the run, fought under the level's own music, whose death is a beat and not the
 * level's end; and the end boss at `bossAt`, which is the fight the level is. What a boss IS is
 * still `tests/level.test.ts`'s — the stations, the phases, the hulls, the roster; what is held
 * here is the two fights and the seam between them.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, bossOnField } from '../src/app/frame.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS, MID_BOSS_DROP, type LevelRow } from '../src/content/levels.ts';
import { PICKUP_KINDS } from '../src/content/pickups.ts';
import { musicLevelFor } from '../src/app/music.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

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

/**
 * Steps until the boss on the field is dead: its health is set to one and the ship's own fire does
 * the rest, so the fight's length is not the subject and its death is the collision's, as in play.
 */
function slay(world: ReturnType<typeof playableWorld>['world'], frame: GameFrame, within: number): number {
  const fight = world.fight;
  for (let i = 0; i < within; i++) {
    if (world.bossPool.size > 0) world.bossPool.at(0).health = 1;
    // Held immortal, on `tests/level.test.ts`'s terms: whether a fixture that never dodges survives
    // the boss is not the question, and a dead ship fires nothing.
    world.ship.health = world.shipRow.health;
    frame.step();
    // Dead: the pool is empty and either the next fight has been set up or the level's end has begun.
    if (world.bossPool.size === 0 && (world.fight !== fight || world.clearedIn > 0)) return i;
  }
  return -1;
}

describe('0247 — a level has a mid-boss and a real one', () => {
  it('THE ROSTER: every level has a mid-boss, before its end boss and after its first wave, and the two are different bosses', () => {
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      expect(level.midBoss, `${kind} has no mid-boss`).not.toBeNull();
      const mid = level.midBoss!;
      expect(mid.at, `${kind}'s mid-boss arrives after its end boss`).toBeLessThan(level.bossAt);
      expect(mid.at, `${kind}'s mid-boss arrives before its first wave, which is a level opening on a boss`).toBeGreaterThan(level.waves[0]!.at);
      expect(mid.kind, `${kind} fights the same boss twice`).not.toBe(level.boss);
      // Not a tuning claim: a mid-boss is the smaller fight of the two, held as the order.
      expect(BOSSES[mid.kind].health, `${kind}'s mid-boss is tougher than its end boss`).toBeLessThan(BOSSES[level.boss].health);
    }
  });

  it('and the old end bosses are the mid-bosses now, at half what they were, every one under every real boss', () => {
    /*
      *"about 50% less health"* — held as an ordering rather than as seven numbers, on
      `tests/level.test.ts`'s own terms: every mid-boss is under every end boss, and both rosters
      climb through the run.
    */
    const mids = LEVEL_KINDS.map((kind) => LEVELS[kind].midBoss!.kind);
    const ends = LEVEL_KINDS.map((kind) => LEVELS[kind].boss);
    // The end bosses climb through the run. The mid-bosses climb through the TABLE
    // (`tests/level.test.ts`) and not through the run: the ask moved two of them between places.
    for (let i = 1; i < ends.length; i++) {
      expect(BOSSES[ends[i]!].health, `${ends[i]} is no tougher than ${ends[i - 1]}`).toBeGreaterThan(BOSSES[ends[i - 1]!].health);
    }
    const toughestMid = Math.max(...mids.map((k) => BOSSES[k].health));
    const weakestEnd = Math.min(...ends.map((k) => BOSSES[k].health));
    expect(toughestMid, 'a mid-boss is tougher than a real one').toBeLessThan(weakestEnd);
    // And every boss in the table is fought somewhere.
    expect(new Set([...mids, ...ends]).size).toBe(BOSS_KINDS.length);
  });

  it('THE TWO FIGHTS: the mid-boss arrives at its distance, its death is a beat and not the level, and the end boss arrives after it', () => {
    const { world, cleared } = playableWorld(TWO_FIGHTS);
    const frame = new GameFrame(world);
    for (let i = 0; i < 400 && world.bossPool.size === 0; i++) frame.step();
    expect(world.bossSpawned, 'the mid-boss never arrived').toBe(true);
    expect(world.fight, 'the first boss on the field is not the mid-boss').toBe(0);
    expect(world.bossRow, 'the first boss on the field is not the mid-boss').toBe(BOSSES.sentinel);
    expect(slay(world, frame, 3000), 'the mid-boss could not be killed').toBeGreaterThanOrEqual(0);
    // The beat: fragments where it died, and nothing reported.
    expect(world.bossBurstIn, 'the mid-boss did not come apart').toBeGreaterThan(0);
    expect(world.clearedIn, 'the mid-boss’s death started the level’s end').toBe(0);
    for (let i = 0; i < 200; i++) frame.step();
    expect(cleared.count, 'the level was reported cleared on the mid-boss').toBe(0);
    // The end boss, once the camera reaches it.
    for (let i = 0; i < 1500 && world.bossPool.size === 0; i++) frame.step();
    expect(world.bossSpawned && world.bossPool.size === 1, 'the end boss never arrived after the mid-boss').toBe(true);
    expect(world.fight, 'the second fight is not the end boss’s').toBe(1);
    expect(world.bossRow).toBe(BOSSES.jormungandr);
    expect(slay(world, frame, 3000)).toBeGreaterThanOrEqual(0);
    expect(world.clearedIn, 'the end boss’s death did not start the level’s end').toBeGreaterThan(0);
    for (let i = 0; i < 200; i++) frame.step();
    expect(cleared.count, 'the level was never reported cleared').toBe(1);
  });

  it('0256 — THE DROP: the mid-boss’s death throws a weapon, a shield and a bomb where it died, and the end boss’s throws nothing', () => {
    /*
      `docs/decisions/0256-a-pickup-keeps-the-count.md`: *"weapons → 1 from the miniboss death;
      shields → 1 from the miniboss death; bombs → 1 from the miniboss death, 1 from the boss
      death."* The mid-boss's three come off the hull on the step it dies, where it was; the end
      boss's charge is the clear's (0053, `levelCleared`), because a piece thrown 1.6 seconds before
      the level ends is a piece nobody reaches — so nothing is thrown there, and `tests/bombs.test.ts`
      holds the charge.
    */
    const { world } = playableWorld(TWO_FIGHTS);
    const frame = new GameFrame(world);
    // The ship kept at the back of its box, so it cannot collect what is measured.
    for (let i = 0; i < 400 && world.bossPool.size === 0; i++) frame.step();
    expect(world.bossPool.size, 'the mid-boss never arrived').toBe(1);
    expect(world.pickups.size, 'something was on the field before the mid-boss died').toBe(0);
    const offered = world.weaponsOffered;
    expect(slay(world, frame, 3000), 'the mid-boss could not be killed').toBeGreaterThanOrEqual(0);
    expect(world.pickups.size, 'the mid-boss’s death did not drop one piece per kind in the list').toBe(MID_BOSS_DROP.length);
    // Where the hull died, in the camera's frame — the same offset its burst is drawn at (0062).
    const hull = { along: world.cameraAlong + world.bossOffset, across: world.bossAcross };
    const kinds: string[] = [];
    for (let i = 0; i < world.pickups.size; i++) {
      const item = world.pickups.at(i);
      kinds.push(PICKUP_KINDS[item.kind]!);
      // One step of the throw from where the hull came apart.
      expect(Math.hypot(item.along - hull.along, item.across - hull.across), 'a piece was thrown from somewhere other than the hull').toBeLessThan(4);
    }
    expect(kinds.sort(), 'the drop is not the list').toEqual([...MID_BOSS_DROP].sort());
    expect(world.weaponsOffered, 'the dropped weapon did not turn the dial').toBe(offered + 1);

    // The end boss: killed, and nothing thrown.
    world.pickups.clear();
    for (let i = 0; i < 1500 && world.bossPool.size === 0; i++) frame.step();
    expect(world.fight, 'the end boss never arrived').toBe(1);
    expect(slay(world, frame, 3000)).toBeGreaterThanOrEqual(0);
    expect(world.pickups.size, 'the end boss’s death threw something').toBe(0);
  });

  it('and the end boss waits for the mid-boss: the camera passing its distance does not bring it while the mid-boss lives', () => {
    const { world } = playableWorld(TWO_FIGHTS);
    const frame = new GameFrame(world);
    for (let i = 0; i < 2000; i++) {
      // The mid-boss cannot be killed here — the ship's own fire would have it inside the run.
      if (world.bossPool.size > 0) world.bossPool.at(0).health = 1e9;
      frame.step();
    }
    expect(world.cameraAlong, 'the camera never passed the end boss’s distance').toBeGreaterThan(TWO_FIGHTS.bossAt);
    expect(world.fight, 'the end boss arrived over a living mid-boss').toBe(0);
    expect(world.bossPool.size).toBe(1);
    expect(world.bossRow).toBe(BOSSES.sentinel);
  });

  it('THE MUSIC: a mid-boss is fought under the section it is in, and the end boss under the fight’s own piece', () => {
    /*
      0114 wrote a piece for THE fight; a level with two fights plays it once. `bossOnField` is what
      `src/app/mount.ts` hands the music, and it is false for a mid-boss on the field.
    */
    const { world } = playableWorld(TWO_FIGHTS);
    const frame = new GameFrame(world);
    for (let i = 0; i < 400 && world.bossPool.size === 0; i++) frame.step();
    expect(world.bossPool.size).toBe(1);
    expect(bossOnField(world), 'the music turns for a mid-boss').toBe(false);
    expect(musicLevelFor(world.cameraAlong - world.levelOrigin, bossOnField(world), TWO_FIGHTS.sections)).not.toBe('boss');
    slay(world, frame, 3000);
    for (let i = 0; i < 1500 && world.bossPool.size === 0; i++) frame.step();
    expect(world.bossPool.size).toBe(1);
    expect(bossOnField(world), 'the music does not turn for the end boss').toBe(true);
    expect(musicLevelFor(world.cameraAlong - world.levelOrigin, bossOnField(world), TWO_FIGHTS.sections, 1)).toBe('boss');
  });

  it('and a level with no mid-boss is one fight, exactly as it was', () => {
    const oneFight: LevelRow = { ...TWO_FIGHTS, midBoss: null, bossAt: 200 };
    const { world, cleared } = playableWorld(oneFight);
    const frame = new GameFrame(world);
    for (let i = 0; i < 400 && world.bossPool.size === 0; i++) frame.step();
    expect(world.fight).toBe(1);
    expect(world.bossRow).toBe(BOSSES.jormungandr);
    expect(bossOnField(world)).toBe(true);
    slay(world, frame, 3000);
    for (let i = 0; i < 200; i++) frame.step();
    expect(cleared.count).toBe(1);
  });
});
