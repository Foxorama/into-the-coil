import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { advanceLevel, GameFrame, startLevel } from '../src/app/frame.ts';
import { spawnAlong } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import type { Surface } from '../src/render/surface.ts';
import { playableWorld } from './world.ts';

/**
 * A LEVEL HAS AN ORIGIN — `docs/decisions/0076-a-level-has-an-origin.md`.
 *
 * Reported from play: *"there's a background scene reset between levels that's disjointing because it
 * moves the player's ship, the level change needs to be seamless."*
 *
 * ⚠️ **What *seamless* means is a claim about the PICTURE, so that is what these measure**: where the
 * ship is drawn and how far the sky moved between one frame and the next, in pixels and world units
 * rather than in the fields that produce them.
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`.
 *
 * ⚠️ **The other half is that the level still plays the same.** A camera that no longer restarts is
 * the exact thing `resetScene` warned about — *"a second run that started where the first one ended
 * would be playing a different level with the same name"* — so the script is checked to arrive at the
 * same place relative to the level, whenever the level begins.
 */

const seconds = (n: number): number => Math.round(n * STEPS_PER_SECOND);

/** A surface that records what it was asked to draw. */
class Recorder implements Surface {
  readonly blits: { sprite: number; x: number; y: number }[] = [];
  clear(): void {
    this.blits.length = 0;
  }
  blit(sprite: number, x: number, y: number): void {
    this.blits.push({ sprite, x, y });
  }
}

/** A world part-way through level one, with a recorder for a canvas. */
function partWayThrough(): ReturnType<typeof playableWorld> & { frame: GameFrame; recorder: Recorder } {
  const built = playableWorld(LEVELS[LEVEL_KINDS[0]!]);
  const recorder = new Recorder();
  built.world.surface = recorder;
  /*
    ⚠️ **THE FIXTURE HAS TO SURVIVE THE TWENTY SECONDS, AND SINCE 0114 IT DOES NOT ON ITS OWN.**
    Measured: a ship that holds station and never dodges now dies at **6.2 seconds** into level one,
    where it used to live past twenty. That is the level compression working — 118 bodies a minute
    became 181 — and it is a fact about the game rather than about this file.

    ⚠️ **This test's subject is WHERE THE SHIP IS DRAWN across a level boundary, not whether it
    lives.** A dying ship is not drawn, so without this the assertion below silently stops measuring
    anything — which is exactly what happened, and `expect(before).toBeDefined()` is the line that
    caught it. Giving the fixture enough hull to reach the boundary keeps the guard pointed at its
    own subject.

    ⚠️ **On the ENTITY and not on the tier**, so nothing about what a real ship survives is changed
    here: `src/content/difficulty.ts` and `src/content/ships.ts` are untouched.
  */
  built.world.ship.health = 999;
  const frame = new GameFrame(built.world);
  for (let i = 0; i < seconds(20); i++) frame.step();
  return { ...built, frame, recorder };
}

const shipAt = (recorder: Recorder): { x: number; y: number } | undefined =>
  recorder.blits.find((b) => b.sprite === SPRITE.ship);

describe('a level boundary is a change of script, not a change of scene', () => {
  it('THE REPORTED ONE: the ship is drawn in the same place across the boundary', () => {
    /*
      *"It moves the player's ship."* It did: `onward` called `resetScene`, which calls `respawn`,
      which puts the hull back at `SHIP_START_ALONG` — so the one thing the player's hand is on
      teleported at the moment the banner cleared.
    */
    const { world, frame, recorder } = partWayThrough();
    frame.draw(0);
    const before = shipAt(recorder);
    expect(before, 'the ship was not drawn, so this measures nothing').toBeDefined();

    advanceLevel(world, LEVELS[LEVEL_KINDS[1]!], 1);
    frame.draw(0);
    const after = shipAt(recorder);
    expect(after, 'the ship stopped being drawn across the boundary').toBeDefined();
    expect(after!.x, 'the ship jumped along the lane at the level boundary').toBeCloseTo(before!.x, 6);
    expect(after!.y, 'the ship jumped across the lane at the level boundary').toBeCloseTo(before!.y, 6);
  });

  it('and the sky does not jump either, which is the other half of the report', () => {
    /*
      The parallax is a function of the camera (0065), so a camera sent back to zero snaps every
      layer back to its start. Measured as camera travel rather than as a blit, because the sky is
      what the camera moves and one number covers every layer.
    */
    const { world, frame } = partWayThrough();
    const before = world.cameraAlong;
    expect(before, 'the camera never moved, so this measures nothing').toBeGreaterThan(100);
    advanceLevel(world, LEVELS[LEVEL_KINDS[1]!], 1);
    expect(world.cameraAlong, 'the camera was sent back to the start of the run').toBe(before);
    frame.step();
    const step = world.cameraAlong - before;
    expect(step, 'the camera moved by more than one step across the boundary').toBeLessThan(2);
  });

  it('and the shell crosses because the ship never leaves, which is 0058 with no arithmetic', () => {
    // 0058 had to read the shield count out and add it back around a respawn. There is no respawn.
    const { world } = partWayThrough();
    world.ship.health = 3;
    advanceLevel(world, LEVELS[LEVEL_KINDS[1]!], 1);
    expect(world.ship.health, 'the boundary took the shell off a ship that never left').toBe(3);
  });
});

describe('and the level still plays the same wherever it begins', () => {
  it('THE ONE resetScene WARNED ABOUT: a wave arrives at the same place relative to the level', () => {
    /*
      *"Distance travelled is the only clock a level has… a second run that started where the first
      one ended would be playing a different level with the same name."* That was the argument for
      resetting the camera, and it is really an argument for the script being measured from
      somewhere. This is that, checked: the same level entered at two very different camera positions
      puts its first wave at the same distance from its own beginning.
    */
    /*
      ⚠️ **HOW MUCH OF THE SCRIPT HAS RUN, as well as where its first wave went** — and the first
      version of this measured only the position, which a broken horizon leaves perfectly correct.
      `npm run prove` said STILL GREEN: reading the horizon in run coordinates does not move a wave,
      it spawns the WHOLE OPENING OF THE LEVEL on the first step, each one still placed exactly
      where the author put it. The level is intact and already over.
    */
    const enterAndRun = (enterAt: number): { place: number; spawned: number } => {
      const { world } = playableWorld(LEVELS[LEVEL_KINDS[0]!]);
      const frame = new GameFrame(world);
      world.cameraAlong = enterAt;
      world.prevCameraAlong = enterAt;
      advanceLevel(world, LEVELS[LEVEL_KINDS[1]!], 1);
      for (let i = 0; i < seconds(60) && world.enemies.size === 0; i++) frame.step();
      expect(world.enemies.size, `nothing spawned when the level was entered at ${enterAt}`).toBeGreaterThan(0);
      // Where it is, measured from the level's own beginning rather than from the run's.
      return { place: world.enemies.at(0).along - world.levelOrigin, spawned: world.nextWave };
    };
    const fromTheStart = enterAndRun(0);
    const deepIntoARun = enterAndRun(9000);
    expect(deepIntoARun.place, 'the same level put its first wave somewhere else because a run got long').toBeCloseTo(
      fromTheStart.place,
      6,
    );
    expect(
      deepIntoARun.spawned,
      'entering the level deep into a run ran more of its script — the horizon is in run coordinates',
    ).toBe(fromTheStart.spawned);
  });

  it('and a run that BEGINS still puts the camera and the script back to zero', () => {
    /*
      The half `advanceLevel` must not take with it. 0067 is explicit — a new run opens on an empty
      field — and the origin is now part of what that means: a run beginning at a leftover origin
      would read the script from wherever the last run had got to.
    */
    const { world } = partWayThrough();
    startLevel(world, LEVELS[LEVEL_KINDS[0]!]);
    expect(world.cameraAlong, 'a new run began part-way through the world').toBe(0);
    expect(world.levelOrigin, 'a new run kept the last one’s origin').toBe(0);
    expect(world.enemies.size, 'a new run opened on the last one’s field').toBe(0);
  });

  it('and the boss still arrives its authored distance into the level, not into the run', () => {
    const { world, frame } = partWayThrough();
    const enteredAt = world.cameraAlong;
    const next = LEVELS[LEVEL_KINDS[1]!];
    advanceLevel(world, next, 1);
    // Straight to where the boss is owed, in the level's own coordinates.
    world.cameraAlong = enteredAt + next.bossAt;
    for (let i = 0; i < seconds(5) && !world.bossSpawned; i++) frame.step();
    expect(world.bossSpawned, 'the boss never arrived when the level did not start at zero').toBe(true);
    expect(world.bossPool.size, 'the boss spawned and is not on the field').toBe(1);
    // Placed ahead of the camera by the same distance it would have been in a level starting at zero.
    expect(world.bossPool.at(0).along - world.levelOrigin, 'the boss was placed in run coordinates').toBeCloseTo(
      next.bossAt,
      6,
    );
  });

  it('and nothing spawns twice because the horizon moved under the script', () => {
    /*
      ⚠️ **The failure an origin makes possible.** `nextWave` only ever goes up, so a horizon that
      jumped backwards at the boundary would leave the script permanently behind — and one that
      jumped forwards would spawn the whole level at once. Both are silent.
    */
    const { world, frame } = partWayThrough();
    advanceLevel(world, LEVELS[LEVEL_KINDS[1]!], 1);
    expect(world.nextWave, 'the script did not start at its beginning').toBe(0);
    const horizon = spawnAlong(world.cameraAlong) - world.levelOrigin;
    expect(horizon, 'the level opened with its horizon already past its own start').toBeLessThan(
      spawnAlong(0) + 0.001,
    );
    for (let i = 0; i < seconds(10); i++) frame.step();
    expect(world.nextWave, 'the whole wave table was spawned at once').toBeLessThan(LEVELS[LEVEL_KINDS[1]!].waves.length);
  });
});
