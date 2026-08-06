import { describe, it, expect } from 'vitest';
import { reset } from '../src/sim/entity.ts';
import { GameFrame, SHIP_START_ALONG, type World } from '../src/app/frame.ts';
import {
  CYCLE,
  CYCLE_UNITS,
  PICKUPS,
  PICKUP_KINDS,
  faceOf,
  type PickupKind,
} from '../src/content/pickups.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld, NO_LEVEL } from './world.ts';

/**
 * A PICKUP IS TWO THINGS, AND THE CAMERA SAYS WHICH.
 *
 * `docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md`. Asked for after playing
 * the two-level build: *"a pickup on the field changes what it is every few seconds, and changes its
 * sprite with it, so which one a player gets is a matter of when they reach it."*
 *
 * ⚠️ **Two halves that have to agree, and nothing else in the game has this shape.** What is DRAWN
 * and what is COLLECTED are computed in different loops, one step apart in the file, and a player
 * who takes the thing they were looking at and gets the other one has been lied to by the screen —
 * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` with the sign
 * reversed.
 */

/** A world with nothing in it, so the only pickups on the field are the ones a test puts there. */
function quietWorld(): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  return { world: built.world, frame: new GameFrame(built.world) };
}

/**
 * Put a pickup of `kind` on the field, out of the ship's way.
 *
 * ⚠️ **Placed near the LEADING edge, because a pickup holds station in the world and the camera does
 * not.** At the ship's own distance it falls behind the trailing cull in about 200 steps — before the
 * first phase boundary — so a test of what happens across a boundary would have measured an empty
 * field and passed. The window is the camera's: 40 units behind it to 280 in front.
 */
function place(world: World, kind: PickupKind, acrossOffset = 20): void {
  const index = world.pickupKinds[kind];
  const item = world.pickups.spawn()!;
  reset(item, world.cameraAlong + 230, world.ship.across + acrossOffset, world.pickupRows[index]!, index);
}

describe('the pairing is a table, and every pickup is in it', () => {
  it('pairs every kind with exactly one other, and is its own inverse', () => {
    /*
      ⚠️ **An involution over the WHOLE table.** A pair added as a one-way mapping would give a pickup
      that turns into something that turns into a third thing — and a kind left out would be a pickup
      that never cycles at all, which looks like a bug in the cycle rather than a gap in the table.
    */
    for (const kind of PICKUP_KINDS) {
      const other = CYCLE[kind];
      expect(other, `${kind} has no other face`).toBeDefined();
      expect(other, `${kind} cycles to itself`).not.toBe(kind);
      expect(CYCLE[other], `${kind} and ${other} are not each other's face`).toBe(kind);
    }
  });

  it('pairs things that are worth choosing between', () => {
    // The pairs the ask names, stated as a property rather than as a list: a face and its partner
    // never do the same thing, so *which one you get* is always a real difference.
    for (const kind of PICKUP_KINDS) {
      const other = CYCLE[kind];
      expect(
        PICKUPS[kind].hint !== PICKUPS[other].hint,
        `${kind} and ${other} promise the player the same thing`,
      ).toBe(true);
    }
  });
});

describe('the camera says which face', () => {
  it('flips on a distance, not on a clock', () => {
    /*
      ⚠️ **The property, not the number.** A phase read from wall clock or from each pickup's own age
      would play differently on a machine dropping frames, and could not be authored against —
      `src/content/enemies.ts` makes the same argument for the weave.
    */
    for (const kind of PICKUP_KINDS) {
      expect(faceOf(kind, 0), 'a run does not open on the authored face').toBe(kind);
      expect(faceOf(kind, CYCLE_UNITS * 0.9), 'the face changed inside one phase').toBe(kind);
      expect(faceOf(kind, CYCLE_UNITS), 'the face did not change at the phase boundary').toBe(CYCLE[kind]);
      expect(faceOf(kind, CYCLE_UNITS * 2), 'the face did not come back').toBe(kind);
    }
  });

  it('is half a second faster than it was, which is what was asked for', () => {
    /*
      ⚠️ **THE ONE NUMBER IN THIS FILE THAT IS ASSERTED, and it is asserted as a DURATION.** The ask
      was *"cycle .5 sec faster"* against a baseline of 3.611s — `130 ÷ SCROLL_PER_STEP ÷ 60` — and a
      half second is the sort of change that is invisible in every screenshot and every still frame.
      `docs/decisions/0064-a-pickup-waits-to-be-taken.md`.

      ⚠️ **In SECONDS rather than in units**, per
      `docs/decisions/0027-measure-the-picture-not-the-model.md`: `CYCLE_UNITS` is a distance and the
      request was made in time, so a guard written in units would prove the constant equals itself.
      Held to a tenth of a second, because 112 is the nearest whole unit to the exact answer.
    */
    const seconds = CYCLE_UNITS / SCROLL_PER_STEP / STEPS_PER_SECOND;
    expect(seconds, `a face lasts ${seconds.toFixed(2)}s`).toBeCloseTo(3.11, 1);
  });

  it('flips everything on the field on the same step', () => {
    /*
      *"Every cycling pickup on screen then flips together, which reads as deliberate."* Two pickups
      of different kinds, and the assertion is that they change on the SAME step — anything with a
      per-object timer passes a test of *does it change* and fails this one.
    */
    const { world, frame } = quietWorld();
    place(world, 'rapid', 20);
    place(world, 'extraLife', -20);
    const before = [world.pickups.at(0).sprite, world.pickups.at(1).sprite];

    let flippedOn = -1;
    for (let step = 0; step < 600; step++) {
      frame.step();
      const now = [world.pickups.at(0).sprite, world.pickups.at(1).sprite];
      const first = now[0] !== before[0];
      const second = now[1] !== before[1];
      if (first || second) {
        expect(first && second, 'one pickup flipped a step before the other').toBe(true);
        flippedOn = step;
        break;
      }
    }
    expect(flippedOn, 'nothing on the field ever changed').toBeGreaterThan(0);
  });

  it('draws the face it will hand over, on every step of both phases', () => {
    /*
      ⚠️ **THE ONE THAT MATTERS.** The sprite and the effect are computed in two different loops, and
      a player who flies for the thing they can see and gets the other one has been lied to by the
      screen. Checked on every step of two whole phases rather than at the boundary, because an
      off-by-one in either loop shows up for exactly one step.
    */
    const { world, frame } = quietWorld();
    place(world, 'spread', 25);
    const item = world.pickups.at(0);
    for (let step = 0; step < Math.ceil((CYCLE_UNITS * 2) / world.scrollPerStep) + 4; step++) {
      frame.step();
      const shown = faceOf('spread', world.cameraAlong);
      expect(item.sprite, `at camera ${world.cameraAlong} the field is drawing the wrong face`).toBe(
        PICKUPS[shown].sprite,
      );
    }
  });
});

describe('what the player gets is what they were looking at', () => {
  it('hands over the face on the field, in both phases', () => {
    for (const phase of [0, 1]) {
      const { world, frame } = quietWorld();
      /*
        Start the camera inside the phase under test, exactly as a run reaches it — and carry the
        ship with it, because everything in the world is culled against the camera and a ship left at
        the origin is a ship two hundred units behind the trailing edge.
      */
      world.cameraAlong = CYCLE_UNITS * phase + CYCLE_UNITS / 2;
      world.prevCameraAlong = world.cameraAlong;
      world.ship.along = world.cameraAlong + SHIP_START_ALONG;
      world.ship.prevAlong = world.ship.along;
      const taken: PickupKind[] = [];
      world.onPickup = (kind: PickupKind): void => {
        taken.push(kind);
      };
      // Right on top of the ship, so it is collected on the next step and nothing else can happen.
      place(world, 'rapid', 0);
      const item = world.pickups.at(0);
      item.along = world.ship.along;
      item.prevAlong = item.along;
      frame.step();

      expect(taken.length, `nothing was collected in phase ${phase}`).toBe(1);
      expect(taken[0], `phase ${phase} handed over the face nobody was looking at`).toBe(
        faceOf('rapid', world.cameraAlong),
      );
    }
  });

  it('never accumulates: a pickup that has been on screen for four phases is still itself', () => {
    /*
      ⚠️ **The bug the first draft of this had.** Writing the face back onto the entity makes the next
      step read the face rather than the authored kind and flip it again — so every pickup on the
      field alternates once a STEP, which at 60Hz is a flicker rather than a cycle. The entity keeps
      what the level authored; the phase is a boolean on the world.
    */
    const { world, frame } = quietWorld();
    place(world, 'extraLife', 20);
    const item = world.pickups.at(0);
    const authored = item.kind;
    for (let i = 0; i < Math.ceil((CYCLE_UNITS * 4) / world.scrollPerStep); i++) {
      frame.step();
      expect(item.kind, 'the entity forgot what the level authored').toBe(authored);
    }
    // And four phases later it is showing its own face again, not something drifted.
    expect(item.sprite).toBe(PICKUPS[faceOf('extraLife', world.cameraAlong)].sprite);
  });
});
