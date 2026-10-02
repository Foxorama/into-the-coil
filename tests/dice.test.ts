import { describe, expect, it } from 'vitest';

import { GameFrame, type World } from '../src/app/frame.ts';
import type { Intent } from '../src/sim/intent.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE DICE SWING WHEN THE SHIP LURCHES — `docs/decisions/0461-the-ships-are-jazzed.md`.
 *
 * Asked for: *"have them sway when the ship accelerates or stops hard."* The chrome swings the estate's
 * fuzzy dice on `onJolt`; what is held here is the event the frame raises, driven through the real
 * frame with a hand on the stick, because the one thing a picture of the dice cannot show is WHEN they
 * are told to move: once for a hard push, once for a hard stop, never for a stick held or eased.
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

describe('0461 — the dice on the dash', () => {
  it('THE ASK: a hard push swings them back once, and a hard stop forward once', () => {
    const { frame, ask, jolts } = piloted();
    steps(frame, 20);
    expect(jolts, 'the dice swung with nobody touching the stick').toEqual([]);
    ask.along = 1;
    steps(frame, 15);
    expect(jolts, 'a hard push is not one swing back').toEqual([1]);
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
