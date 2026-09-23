/**
 * THE ROOM'S PICTURE HAS A CLOCK — `docs/decisions/0362-the-room-has-a-clock.md`.
 *
 * Reported 2026-09-22, of the music room's flythrough of the belt: *"the volcanos … look really weird
 * with the frozen lava rocks that just don't move at all"*.
 *
 * ⚠️ **THE UNIT HALF OF THE ROOM, AND `tests/room.browser.test.ts` IS THE OTHER ONE.** What is held
 * here is the claim the report is about: on a screen the simulation is stopped on, a second of
 * WALKING moves the rock exactly as far as a second of FLYING does. That is measured off the real
 * `GameFrame.draw` through a recording surface, so it is the picture and not the arithmetic behind it
 * — `docs/decisions/0027-measure-the-picture-not-the-model.md`.
 *
 * ⚠️ **ONE OF THE THREE, ON PURPOSE.** The rock (0347), the Mire's bubbles (0353) and the Heart's vein
 * beads (0354) are the same claim three times over — each is a function of the same step count, and
 * all three ride the same `time` argument out of `src/app/frame.ts`. A guard per place would be three
 * copies of one invariant (0282); the rock is the one that was reported, and the branch it proves is
 * the branch all three take.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame, landmarksFor, type World } from '../src/app/frame.ts';
import { flythroughSteps } from '../src/app/attract.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import type { Surface } from '../src/render/surface.ts';
import { playableWorld } from './world.ts';

const saurian = LEVEL_KINDS.map((kind) => LEVELS[kind]).find((level) => level.theme === 'saurian')!;

/** A surface that records what it was asked to draw, so the PICTURE can be measured. */
class Recorder implements Surface {
  blits: { sprite: number; x: number; y: number }[] = [];
  clear(): void {
    this.blits = [];
  }
  blit(sprite: number, x: number, y: number): void {
    this.blits.push({ sprite, x, y });
  }
  bolt(): void {}
}

/**
 * A world parked with a volcano in front of it, drawing into a recorder.
 *
 * ⚠️ **THE CAMERA IS HELD STILL IN EVERY READING BELOW**, which is the only way to ask what the clock
 * did: a rock that moved because the whole picture scrolled would answer a different question.
 */
function parked(): { world: World; frame: GameFrame; rocks: () => string } {
  const built = playableWorld(saurian);
  const world = built.world;
  const recorder = new Recorder();
  world.surface = recorder;
  world.landmarks = landmarksFor(saurian);
  const mark = world.landmarks.find((m) => m.vent !== undefined)!;
  // The camera at which that volcano stands in the middle of the screen, on its own parallax terms.
  const camera = mark.at + (world.view.alongSpan / 2 + mark.extent / 2) / mark.depth;
  world.cameraAlong = camera;
  world.prevCameraAlong = camera;
  const frame = new GameFrame(world);
  return {
    world,
    frame,
    rocks: () => {
      frame.draw(0);
      return recorder.blits
        .filter((b) => b.sprite === SPRITE.ember)
        .map((b) => `${b.x.toFixed(1)},${b.y.toFixed(1)}`)
        .join('|');
    },
  };
}

describe('the picture runs on the sim’s clock, and the room runs it on the walk', () => {
  it('A RUN’S ROCK RIDES THE SIM’S STEPS: a second of flying moves it', () => {
    const { world, rocks } = parked();
    world.pictureSteps = null;
    const first = rocks();
    world.steps += STEPS_PER_SECOND;
    expect(rocks(), 'the same rocks in the same places a second of flying apart').not.toBe(first);
  });

  it('AND THE REPORTED ONE: on a screen that does not step, a second of WALKING moves it as far', () => {
    /*
      The room is `steps: false`, so `world.steps` is standing still in both readings here — exactly as
      it stands still while a player watches the room. What moves the rock is the walk's own position,
      and a second of it is `STEPS_PER_SECOND` steps of scroll.
    */
    const flying = parked();
    flying.world.pictureSteps = null;
    flying.world.steps = 0;
    const before = flying.rocks();
    flying.world.steps = STEPS_PER_SECOND;
    const afterASecondOfFlying = flying.rocks();

    const walking = parked();
    walking.world.steps = 0;
    walking.world.stepping = false;
    walking.world.pictureSteps = flythroughSteps(0);
    expect(walking.rocks(), 'the walk and the run do not start from the same picture').toBe(before);
    walking.world.pictureSteps = flythroughSteps(SCROLL_PER_STEP * STEPS_PER_SECOND);
    const afterASecondOfWalking = walking.rocks();

    expect(afterASecondOfWalking, 'a second of walking left the rock where it was — the room is frozen').not.toBe(
      before,
    );
    expect(afterASecondOfWalking, 'a second of walking moved the rock a different distance from a second of flying').toBe(
      afterASecondOfFlying,
    );
  });
});
