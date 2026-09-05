/**
 * A death throws back one piece per kind —
 * `docs/decisions/0243-a-death-throws-back-one-piece-per-kind.md`.
 *
 * Reported during the fifth play-test: *"it's too hard to grab all the different powerups with all
 * the different sequencing in the middle of a hail of bullets."* A death threw a piece per rung and
 * every piece cycled; it throws one per kind now, carrying the count, holding the face it lost, and
 * wearing a badge for the count. Where the pieces GO is still 0066's and 0236's, held in
 * `tests/guns-played.test.ts` and `tests/pickups.test.ts`; what is held here is what a piece IS.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, SHIP_START_ALONG, scatterUpgrades, type World } from '../src/app/frame.ts';
import { PICKUP_CYCLE_STEPS, type UpgradeKind } from '../src/content/pickups.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { MISSILES } from '../src/content/missiles.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import type { Entity } from '../src/sim/entity.ts';
import type { Surface } from '../src/render/surface.ts';
import { initialState, reduce } from '../src/state/root.ts';
import { DEFAULT_DIFFICULTY } from '../src/state/slices/run.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/** A wreck at the ship's starting place, mid-lane, that has just thrown `upgrades` — and no ship to collect them. */
function wreck(upgrades: readonly UpgradeKind[]): { world: World; frame: GameFrame } {
  const { world } = playableWorld(NO_LEVEL);
  world.shipPool.clear();
  world.deathOffset = SHIP_START_ALONG;
  world.deathAcross = ACROSS_SPAN / 2;
  scatterUpgrades(world, upgrades);
  return { world, frame: new GameFrame(world) };
}

/** The scattered piece of `kind`, or a throw if there is not exactly one. */
function pieceOf(world: World, kind: UpgradeKind): Entity {
  const found: Entity[] = [];
  for (let i = 0; i < world.pickups.size; i++) {
    const item = world.pickups.at(i);
    if (item.kind === world.pickupKinds[kind]) found.push(item);
  }
  expect(found.length, `${found.length} pieces of ${kind} were thrown`).toBe(1);
  return found[0]!;
}

/** A surface that keeps every blit, so the picture can be asked what it drew. */
class Recorder implements Surface {
  readonly blits: number[] = [];
  clear(): void {
    this.blits.length = 0;
  }
  blit(sprite: number): void {
    this.blits.push(sprite);
  }
  bolt(): void {}
}

describe('0243 — a death throws back one piece per kind', () => {
  it('THE STACK: a death throws one piece per kind, each carrying every rung of its kind and showing the face it lost', () => {
    const { world } = wreck(['weapon', 'weapon', 'weapon', 'missile', 'missile']);
    expect(world.pickups.size, 'a death threw a piece per rung rather than per kind').toBe(2);
    const weapon = pieceOf(world, 'weapon');
    const missile = pieceOf(world, 'missile');
    expect(weapon.stack, 'the weapon piece does not carry every rung the death took').toBe(3);
    expect(missile.stack, 'the missile piece does not carry every rung the death took').toBe(2);
    expect(weapon.sprite, 'the weapon piece is not showing the gun the player lost').toBe(WEAPONS[world.weapon.kind].pickup);
    expect(missile.sprite, 'the missile piece is not showing the tube the player lost').toBe(MISSILES[world.weapon.missile].pickup);
    // A loadout of one kind throws one piece, and an empty one throws nothing.
    expect(wreck(['weapon', 'weapon']).world.pickups.size).toBe(1);
    expect(wreck([]).world.pickups.size).toBe(0);
  });

  it('and a scattered piece holds its face: it does not turn while it waits', () => {
    /*
      0233 had a scattered piece cycle from the face it lost like any other pickup, and the report
      names the cycling as the thing that made a death's pieces impossible to take under fire. An
      authored pickup still turns — `tests/pickups.test.ts` holds that — and a scattered one does
      not, for longer than any cycle.
    */
    const { world, frame } = wreck(['weapon', 'weapon']);
    const piece = pieceOf(world, 'weapon');
    const shown = piece.sprite;
    for (let i = 0; i < PICKUP_CYCLE_STEPS * 4; i++) {
      frame.step();
      expect(world.pickups.size, `the piece was gone on step ${i}`).toBe(1);
      expect(piece.sprite, `the piece turned to another face on step ${i}`).toBe(shown);
    }
  });

  it('and taking it hands back every rung: the reducer counts', () => {
    let state = reduce(initialState, { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY });
    const before = state.run.upgrades.filter((u) => u === 'weapon').length;
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'weapon', kind: state.run.weapon, count: 3 });
    const after = state.run.upgrades.filter((u) => u === 'weapon').length;
    expect(after - before, 'a pickup worth three rungs was worth one').toBe(3);
    // And a pickup with no count is one rung, which is every authored pickup.
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'missile', kind: state.run.missile });
    expect(state.run.upgrades.filter((u) => u === 'missile').length, 'an authored pickup is worth more than one rung').toBe(1);
  });

  it('THE BADGE: a stacked piece is drawn with its count over it, and a piece worth one is not', () => {
    /*
      *"with an x2/3/4 etc if they had multiple powerups."* The count is a second bitmap over the
      piece — `paintStacks` in `src/render/scene.ts` — and this asks the picture rather than the
      model: the frame is drawn onto a surface that keeps every blit.
    */
    const { world, frame } = wreck(['weapon', 'weapon', 'missile']);
    const recorder = new Recorder();
    world.surface = recorder;
    frame.draw(0);
    const twos = recorder.blits.filter((s) => s === SPRITE.stackTwo).length;
    expect(twos, 'the weapon piece worth two rungs wears no ×2').toBe(1);
    expect(recorder.blits, 'a piece worth one rung wears a badge').not.toContain(SPRITE.stackThree);
    expect(recorder.blits, 'a piece worth one rung wears a badge').not.toContain(SPRITE.stackFour);
    // Four rungs of one kind is the ladder's whole height, and the badge says so.
    const capped = wreck(['missile', 'missile', 'missile', 'missile']);
    capped.world.surface = recorder;
    capped.frame.draw(0);
    expect(recorder.blits.filter((s) => s === SPRITE.stackFour).length, 'a piece worth four rungs wears no ×4').toBe(1);
  });
});
