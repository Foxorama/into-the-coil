import { describe, expect, it } from 'vitest';

import { BOUND } from '../src/app/mount.ts';
import { GameFrame } from '../src/app/frame.ts';
import { LEVELS } from '../src/content/levels.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { PLAYER_LEAD } from '../src/sim/flight.ts';
import type { Surface } from '../src/render/surface.ts';
import { playableWorld } from './world.ts';

/**
 * THE EDGE OF THE PLAYER'S BOX, DRAWN — `docs/decisions/0074-the-box-is-drawn.md`.
 *
 * Reported from play: *"the hard block on the player movement was a problem because there was no
 * indication of it, and I got shot a couple of times because I tried to fly forward on the screen to
 * avoid a bullet and couldn't."*
 *
 * ⚠️ **The load-bearing test here is the first one, and it is in PIXELS.** Everything else in this
 * file is structure — a count, an order — and structure is exactly what can be perfectly consistent
 * while the mark is drawn somewhere the ship does not stop.
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` asks for at least one assertion in the
 * units the player has, and *"the line is where I stop"* is the whole claim this change makes.
 */

/** A surface that records what it was asked to draw, in the order it was asked. */
class Recorder implements Surface {
  readonly blits: { sprite: number; x: number; y: number }[] = [];
  clear(): void {
    this.blits.length = 0;
  }
  blit(sprite: number, x: number, y: number): void {
    this.blits.push({ sprite, x, y });
  }
}

/** A world with the level script silenced, the box drawn, and a recorder for a canvas. */
function pushingForward(width = 1280, height = 720): { recorder: Recorder; frame: GameFrame; world: ReturnType<typeof playableWorld>['world'] } {
  const { world } = playableWorld(LEVELS.approach);
  world.nextWave = world.level.waves.length;
  world.nextPickup = world.level.pickups.length;
  world.bound = BOUND;
  world.view = viewOf(width, height);
  const recorder = new Recorder();
  world.surface = recorder;
  // The player holding forward, every step, for as long as the test runs.
  world.input = {
    contribute: (intent) => {
      intent.along = 1;
    },
    spend: () => {},
    release: () => {},
  };
  return { recorder, frame: new GameFrame(world), world };
}

describe('the wall the ship meets is the line that is drawn', () => {
  it('THE ONE: a ship held against the boundary stops within a hull of the mark, in pixels', () => {
    /*
      ⚠️ **Two numbers from two places, compared on the glass.** The stop is produced by
      `src/sim/flight.ts`'s clamp running inside a real frame; the mark's position is what
      `src/app/mount.ts` hands the painter, put through the real `screenX`. If the picture and the
      rule ever came apart, this is where it would show — and it is stated as *a hull's width*,
      because that is the tolerance a player could not perceive.
    */
    const { recorder, frame, world } = pushingForward();
    // Long enough that the ship is pinned rather than still accelerating: the flight has mass (0037).
    for (let i = 0; i < 240; i++) frame.step();
    frame.draw(0);

    const ship = recorder.blits.find((b) => b.sprite === SPRITE.ship);
    const marks = recorder.blits.filter((b) => b.sprite === SPRITE.bound);
    expect(ship, 'the ship was not drawn, so this measures nothing').toBeDefined();
    expect(marks.length, 'the boundary was not drawn at all').toBeGreaterThan(0);

    // Every mark shares one x — it is a line down the lane — so any of them is the line's position.
    const lineX = marks[0]!.x;
    for (const mark of marks) expect(mark.x, 'the boundary is not a straight line').toBeCloseTo(lineX, 6);

    const hullPx = SHIPS.proof.radius * world.view.scale;
    expect(hullPx, 'the fixture has no scale, so a pixel tolerance means nothing').toBeGreaterThan(1);
    expect(
      Math.abs(ship!.x - lineX),
      `the ship stops ${Math.abs(ship!.x - lineX).toFixed(1)}px from the line that says where it stops, ` +
        `and a hull is ${hullPx.toFixed(1)}px. The picture and the clamp have come apart.`,
    ).toBeLessThanOrEqual(hullPx);
  });

  it('and the ship really is against it, rather than both being wrong in the same place', () => {
    /*
      ⚠️ **The assertion above is satisfied by a ship that never moved and a line drawn on top of
      it.** This is the other half: the ship travelled forward, and it stopped at the number the box
      is defined by.
    */
    const { frame, world } = pushingForward();
    const start = world.ship.along - world.cameraAlong;
    for (let i = 0; i < 240; i++) frame.step();
    const held = world.ship.along - world.cameraAlong;
    expect(held, 'the ship did not move forward at all').toBeGreaterThan(start + 10);
    expect(held, 'the ship flew past its own box').toBeLessThanOrEqual(PLAYER_LEAD + 0.001);
    expect(held, 'the ship stopped short of its box, so the wall is somewhere else').toBeGreaterThan(PLAYER_LEAD - 1);
  });
});

describe('what the boundary costs the frame', () => {
  it('is a fixed number of blits that does not vary with the camera or the device', () => {
    /*
      ⚠️ **The DEVICE is what this can actually catch, and the camera is not.** `paintBound` is never
      handed the camera, so a count that drifted with the scroll is not a mistake that can be written
      there — the affordance is absent rather than guarded, which is the tier above a test. What IS
      reachable is the sky's own line pasted in: the sky tiles along the scroll axis, the boundary
      tiles across the lane, and `alongSpan` in place of `acrossSpan` makes the line a different
      length on a phone and an ultrawide with nothing looking broken on either.

      The camera positions below are therefore belt and braces rather than the subject.
    */
    const counts = new Set<number>();
    for (const [w, h] of [
      [1280, 720],
      [2560, 1080],
      [480, 320],
    ] as const) {
      const { recorder, frame } = pushingForward(w, h);
      for (const at of [0, 37, 400]) {
        for (let i = 0; i < at; i++) frame.step();
        frame.draw(0);
        counts.add(recorder.blits.filter((b) => b.sprite === SPRITE.bound).length);
      }
    }
    expect(counts.size, `the blit count varies: ${[...counts].join(', ')}`).toBe(1);
    expect([...counts][0], 'the lane is a fixed hundred units, so the dashes are its span over the period').toBe(
      Math.ceil(ACROSS_SPAN / BOUND.extent),
    );
  });

  it('and it is drawn BEHIND every body, so nothing is lost behind it', () => {
    /*
      ⚠️ **The one absolute in the painter's draw order.** A row of marks over the top of the lane, at
      the exact distance the player is most likely to be dodging at, would hide the bullets it exists
      to help them dodge — `src/render/scene.ts` states the same rule for the ship being last.
    */
    const { recorder, frame } = pushingForward();
    for (let i = 0; i < 120; i++) frame.step();
    frame.draw(0);
    const lastMark = recorder.blits.map((b) => b.sprite).lastIndexOf(SPRITE.bound);
    const firstShip = recorder.blits.map((b) => b.sprite).indexOf(SPRITE.ship);
    expect(lastMark, 'the boundary was not drawn').toBeGreaterThanOrEqual(0);
    expect(firstShip, 'the ship was not drawn').toBeGreaterThanOrEqual(0);
    expect(lastMark, 'the boundary is drawn over the top of the ship').toBeLessThan(firstShip);
  });
});
