import { describe, expect, it } from 'vitest';

import { GameFrame, type World } from '../src/app/frame.ts';
import { DICE } from '../src/content/ships.ts';
import type { Intent } from '../src/sim/intent.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE DICE SWING WHEN THE SHIP LURCHES — `docs/decisions/0461-the-ships-are-jazzed.md`, and ONCE PER
 * LURCH, UNINTERRUPTED — `docs/decisions/0466-the-dice-swing-once.md`.
 *
 * Asked for: *"have them sway when the ship accelerates or stops hard"*, and then, played: *"they
 * should start to sway on a forward burst or hard brake, but it should trigger an uninterruptable
 * sway, at the moment they jerk around all over the place because the player is constantly going back
 * and forth."* The chrome swings the estate's fuzzy dice on `onJolt`; what is held here is the event
 * the frame raises, driven through the real frame with a hand on the stick, because the one thing a
 * picture of the dice cannot show is WHEN they are told to move: once for a burst, once for a brake,
 * never inside a swing, never for a stick held, eased or wagged about the middle.
 *
 * ⚠️ **THE SHIP FLIES IN A BOX, AND THE BOX'S END IS A BRAKE.** A full push covers the box's length
 * in under a swing, so a stick held forward for a whole swing stops the ship at the front of the box
 * — a brake the frame rightly reads, inside the swing, and swallows. Every sequence below that wants
 * the ship moving once a swing has settled gets there in short pushes, or comes back the way it went.
 */

/** A world whose stick this test holds, and every jolt it raises. */
function piloted(): { world: World; frame: GameFrame; ask: { along: number; across: number }; jolts: number[] } {
  const built = playableWorld(NO_LEVEL);
  const ask = { along: 0, across: 0 };
  const jolts: number[] = [];
  built.world.input = {
    contribute(intent: Intent): void {
      intent.along = ask.along;
      intent.across = ask.across;
    },
    spend(): void {},
    release(): void {},
  };
  built.world.onJolt = (way: number): void => {
    jolts.push(way);
  };
  return { world: built.world, frame: new GameFrame(built.world), ask, jolts };
}

const steps = (frame: GameFrame, n: number): void => {
  for (let i = 0; i < n; i++) frame.step();
};

/** One swing's length in steps: the frame refuses every lurch inside it. */
const SWING = Math.ceil(DICE.swingSeconds * 60);

describe('0461 — the dice on the dash', () => {
  it('THE ASK: a hard push swings them back once, and a hard stop forward once', () => {
    const { frame, ask, jolts } = piloted();
    steps(frame, 20);
    expect(jolts, 'the dice swung with nobody touching the stick').toEqual([]);
    ask.along = 1;
    steps(frame, 15);
    expect(jolts, 'a hard push is not one swing back').toEqual([1]);
    /*
      The stop that swings them forward has to come once the swing has settled, with the ship at speed:
      stop inside the swing (heard as nothing), push again near its end so the burst arms the brake
      inside it, and let go once it is over.
    */
    ask.along = 0;
    steps(frame, 80);
    ask.along = 1;
    steps(frame, SWING - 80);
    expect(jolts, 'a push inside the swing was heard').toEqual([1]);
    ask.along = 0;
    steps(frame, 30);
    expect(jolts, 'a hard stop is not one swing forward after it').toEqual([1, -1]);
  });

  it('and a stick eased over or held moves nothing', () => {
    const { frame, ask, jolts } = piloted();
    steps(frame, 5);
    ask.along = 0.4;
    steps(frame, 15);
    ask.along = 0;
    steps(frame, 30);
    expect(jolts, 'an eased stick swung the dice').toEqual([]);
  });
});

describe('0466 — the dice swing once', () => {
  it('THE ASK: a second lurch inside a swing moves nothing, and the next after it settles swings again', () => {
    const { frame, ask, jolts } = piloted();
    ask.along = 1;
    steps(frame, 15);
    expect(jolts, 'a hard push is not one swing back').toEqual([1]);
    // A stop, a hard push back the way it came, and a stop, all inside the swing: none is heard.
    ask.along = 0;
    steps(frame, 20);
    ask.along = -1;
    steps(frame, 20);
    ask.along = 0;
    steps(frame, 20);
    expect(jolts, 'a lurch inside a swing interrupted it').toEqual([1]);
    // Settled, at rest. The next lurch is heard.
    steps(frame, SWING - 75 + 6);
    ask.along = 1;
    steps(frame, 15);
    expect(jolts, 'a push once the swing had settled was not heard').toEqual([1, 1]);
  });

  it('a stick wagged about the middle moves nothing', () => {
    /*
      The reported jerk: back and forth on the stick, each reversal a lurch, each lurch a restart. Half
      the stick each way is under the burst mark, so a player working the ship about the lane never
      crosses it, and the dice only drift.
    */
    const { frame, ask, jolts } = piloted();
    for (let turn = 0; turn < 20; turn++) {
      ask.along = turn % 2 === 0 ? 0.5 : -0.5;
      steps(frame, 10);
    }
    expect(jolts, 'wagging the stick swung the dice').toEqual([]);
  });

  it('the front of the box stops the ship inside the swing, and that stop is heard as nothing more', () => {
    const { world, frame, ask, jolts } = piloted();
    // Stood a hundred units up the lane first: from the start the front is a whole swing away at full
    // speed, and the claim is about a burst that meets the box inside its swing, as most do in play.
    world.ship.along += 100;
    world.ship.prevAlong = world.ship.along;
    ask.along = 1;
    steps(frame, SWING - 10);
    // The premise, asserted (0019): the box has stopped the ship while the stick is still forward.
    expect(Math.abs(world.ship.velAlong - world.scrollPerStep), 'the ship never reached the front of its box').toBeLessThan(0.05);
    expect(jolts, 'the box’s stop inside the swing was heard').toEqual([1]);
    ask.along = 0;
    steps(frame, 30);
    expect(jolts, 'letting go of a ship already stopped swung the dice').toEqual([1]);
  });
});
