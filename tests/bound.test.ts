import { describe, expect, it } from 'vitest';

import { BOUND } from '../src/app/mount.ts';
import { BOUND_NEAR, GameFrame } from '../src/app/frame.ts';
import { LEVELS } from '../src/content/levels.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { PLAYER_ALONG_SPAN, PLAYER_LEAD } from '../src/sim/flight.ts';
import type { Surface } from '../src/render/surface.ts';
import { playableWorld } from './world.ts';

/**
 * THE EDGE OF THE PLAYER'S BOX, DRAWN — `docs/decisions/0074-the-box-is-drawn.md` — AND DRAWN ONLY
 * WHILE IT IS MET — `docs/decisions/0359-the-wall-is-drawn-while-it-is-met.md`.
 *
 * Reported from play: *"the hard block on the player movement was a problem because there was no
 * indication of it, and I got shot a couple of times because I tried to fly forward on the screen to
 * avoid a bullet and couldn't."* And then, of the line 0074 drew in answer: *"get rid of the shitty
 * dotted line on the right hand side of the screen for the no fly zone."*
 *
 * ⚠️ **The load-bearing test here is the first one, and it is in PIXELS.** Everything else in this
 * file is structure — a count, an order, a when — and structure is exactly what can be perfectly
 * consistent while the mark is drawn somewhere the ship does not stop.
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
  bolt(): void {}
}

/**
 * A world with the level script silenced, the box drawn, and a recorder for a canvas.
 *
 * `along` is what the stick asks for every step: `1` pushes the ship into its forward wall, `0`
 * holds station, `-1` retreats. Writable through `steer` for a test that changes its mind.
 */
function pushingForward(
  width = 1280,
  height = 720,
  along = 1,
): { recorder: Recorder; frame: GameFrame; world: ReturnType<typeof playableWorld>['world']; steer: (along: number) => void } {
  const { world } = playableWorld(LEVELS.approach);
  world.nextWave = world.level.waves.length;
  world.nextPickup = world.level.pickups.length;
  world.bound = BOUND;
  world.view = viewOf(width, height);
  const recorder = new Recorder();
  world.surface = recorder;
  let ask = along;
  world.input = {
    contribute: (intent) => {
      intent.along = ask;
    },
    spend: () => {},
    release: () => {},
  };
  return {
    recorder,
    frame: new GameFrame(world),
    world,
    steer: (next: number): void => {
      ask = next;
    },
  };
}

/** The marks on the last frame drawn. */
const marksOf = (recorder: Recorder): { sprite: number; x: number; y: number }[] => recorder.blits.filter((b) => b.sprite === SPRITE.bound);

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
    const marks = marksOf(recorder);
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

/**
 * THE WALL IS DRAWN WHILE IT IS MET — `docs/decisions/0359-the-wall-is-drawn-while-it-is-met.md`.
 *
 * 0074 drew the wall at all times, and the player asked for the line to go. What 0074 answered still
 * has to be answered: the wall is invisible until the ship is nearly on it, then drawn from a few
 * hulls out — so the player sees it arrive as they push in — and it stays for a moment after they
 * pull back.
 */
describe('the wall is drawn while it is met', () => {
  it('THE ASK: at rest in the middle of the box, no mark is drawn', () => {
    /*
      ⚠️ **The whole of the report, in the picture.** A ship holding station — which is where a ship
      is for nearly all of a level — has no dashed line ahead of it. Held after a long settle rather
      than on the first frame, because the first frame is before anything has had a chance to appear.
    */
    const { recorder, frame } = pushingForward(1280, 720, 0);
    for (let i = 0; i < 240; i++) frame.step();
    frame.draw(0);
    expect(recorder.blits.some((b) => b.sprite === SPRITE.ship), 'the ship was not drawn, so this measures nothing').toBe(true);
    expect(marksOf(recorder).length, 'the wall is drawn while nothing is anywhere near it').toBe(0);
  });

  it('and not while the ship is at the BACK of its box either', () => {
    const { recorder, frame } = pushingForward(1280, 720, -1);
    for (let i = 0; i < 240; i++) frame.step();
    frame.draw(0);
    expect(marksOf(recorder).length, 'the forward wall is drawn for a ship pressed against the back one').toBe(0);
  });

  it('arrives as the ship pushes in, before the stop, so the player sees the wall coming rather than finds it', () => {
    /*
      ⚠️ **The report 0074 answered, held.** *"There was no indication of it"* is a mark that appears
      on the frame the clamp bites, or never; the player has to see the line while there is still
      room to turn. So on the first frame the mark is drawn the ship is short of its wall — by more
      than a rounding — and within `BOUND_NEAR` of it, which is the number that says how far out.
    */
    const { recorder, frame, world } = pushingForward();
    let leadAtFirstMark = Number.NaN;
    for (let i = 0; i < 240 && Number.isNaN(leadAtFirstMark); i++) {
      frame.step();
      frame.draw(0);
      if (marksOf(recorder).length > 0) leadAtFirstMark = PLAYER_LEAD - (world.ship.along - world.cameraAlong);
    }
    expect(leadAtFirstMark, 'the wall was never drawn while the ship pushed into it').not.toBeNaN();
    expect(leadAtFirstMark, 'the wall is drawn only once the ship is already stopped on it').toBeGreaterThan(0.5);
    expect(leadAtFirstMark, 'the wall is drawn from further out than its own reveal distance').toBeLessThanOrEqual(BOUND_NEAR + 2);
  });

  it('and goes when the ship leaves it, within a couple of seconds', () => {
    /*
      A hold is right — a dodge that brushes the wall twice a second must not blink it — and a hold
      that never ran down would be 0074's line back for the rest of the level. A ceiling rather than
      the constant, so the half-second can be tuned without this becoming a copy of it.
    */
    const { recorder, frame, steer } = pushingForward();
    for (let i = 0; i < 240; i++) frame.step();
    frame.draw(0);
    expect(marksOf(recorder).length, 'the ship pressed the wall and nothing was drawn').toBeGreaterThan(0);
    steer(-1);
    for (let i = 0; i < 120; i++) frame.step();
    frame.draw(0);
    expect(marksOf(recorder).length, 'the wall stays drawn two seconds after the ship left it').toBe(0);
  });
});

describe('how much of the screen the player owns', () => {
  it('THE REPORTED ONE: the strip in front of the wall is a sliver, in pixels of a real screen', () => {
    /*
      ⚠️ **THE COMPLAINT, IN THE UNITS IT WAS MADE IN** — *"it did not solve the problem the game has
      in that almost a quarter of the screen space is not playable by the player."*
      `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md`.

      ⚠️ **Measured on the glass rather than in world units, because *a quarter of the screen* is a
      statement about the glass.** The ship is flown into its wall by the real frame and the strip is
      the distance from where it stops to the leading edge of the drawn view — which is what the
      player was looking at when they said it. Before 0080 this was 22% of a 1280px screen; the box is
      now the view inset by one fraction, so it is the same 6% the lane already gave up.

      ⚠️ **A ceiling and not an equality**, so the number a hand settles can move without this
      becoming a copy of it. What must never come back is a quarter.
    */
    const width = 1280;
    const { frame, world } = pushingForward(width, 720);
    for (let i = 0; i < 240; i++) frame.step();

    const shipPx = (world.ship.along - world.cameraAlong) * world.view.scale + world.view.gutterAlong;
    const edgePx = width - world.view.gutterAlong;
    const strip = (edgePx - shipPx) / width;
    expect(world.view.gutterAlong, 'a 16:9 viewport was letterboxed along, so this is not measuring the screen').toBe(
      0,
    );
    expect(strip, 'the ship is off the leading edge, so this measures nothing').toBeGreaterThan(0);
    expect(
      strip,
      `${(strip * 100).toFixed(1)}% of the screen ahead of the ship is playfield the player cannot enter. ` +
        'The report called a quarter of it unplayable.',
    ).toBeLessThan(0.1);
  });

  it('and the trailing edge gives up the same share, because the box is the view’s own shape', () => {
    // The other half of *"correctly be a rectangle"*: an inset that is generous at one end and mean
    // at the other is a box that is not the shape of the thing it sits in.
    const { frame, world } = pushingForward(1280, 720, -1);
    for (let i = 0; i < 240; i++) frame.step();
    const held = world.ship.along - world.cameraAlong;
    expect(held, 'the ship did not retreat at all').toBeLessThan(PLAYER_LEAD);
    expect(held / PLAYER_ALONG_SPAN, 'the trailing inset is not the leading one').toBeCloseTo(
      1 - PLAYER_LEAD / PLAYER_ALONG_SPAN,
      6,
    );
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

      Counted with the ship pressed against the wall, because since 0359 that is the only time there
      is anything to count. The camera positions are belt and braces rather than the subject.
    */
    const counts = new Set<number>();
    for (const [w, h] of [
      [1280, 720],
      [2560, 1080],
      [480, 320],
    ] as const) {
      const { recorder, frame } = pushingForward(w, h);
      for (let i = 0; i < 240; i++) frame.step();
      for (const at of [0, 37, 400]) {
        for (let i = 0; i < at; i++) frame.step();
        frame.draw(0);
        counts.add(marksOf(recorder).length);
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
    for (let i = 0; i < 240; i++) frame.step();
    frame.draw(0);
    const lastMark = recorder.blits.map((b) => b.sprite).lastIndexOf(SPRITE.bound);
    const firstShip = recorder.blits.map((b) => b.sprite).indexOf(SPRITE.ship);
    expect(lastMark, 'the boundary was not drawn').toBeGreaterThanOrEqual(0);
    expect(firstShip, 'the ship was not drawn').toBeGreaterThanOrEqual(0);
    expect(lastMark, 'the boundary is drawn over the top of the ship').toBeLessThan(firstShip);
  });
});
