import { describe, it, expect } from 'vitest';
import { SPECIAL_BINDINGS } from '../src/content/actions.js';
import { makeIntent, type Intent } from '../src/sim/intent.js';
import { combineDevices } from '../src/app/devices.js';
import { attachInput, type InputSource } from '../src/app/input.js';
import { attachPad } from '../src/app/pad.js';
import { attachTouch } from '../src/app/touch.js';

/** A keyboard nothing is ever pressed on — the idle device the test below needs. */
function silentKeyboard(): EventTarget {
  return {
    addEventListener(): void {},
    removeEventListener(): void {},
    dispatchEvent: () => true,
  } as unknown as EventTarget;
}

/**
 * THREE DEVICES, ONE INTENT.
 *
 * See `docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md`.
 *
 * The claim a reviewer waves through is that composition is obvious. It is not: a source that
 * ASSIGNS wins by being attached last, so the control scheme becomes a property of the order
 * `mount.ts` happens to wire things in — invisible, and it changes the first time someone tidies the
 * imports. The tests that matter here are the order-independence one and the clamp.
 */

/** A device that always asks for the same thing. */
function fixed(along: number, across: number, presses = 0): InputSource & { released: boolean } {
  return {
    released: false,
    contribute(intent: Intent): void {
      intent.along += along;
      intent.across += across;
      if (presses > 0 && intent.specials.length > 0) {
        intent.specials[0] = (intent.specials[0] ?? 0) + presses;
      }
    },
    release(): void {
      this.released = true;
    },
  };
}

describe('every attached device composes into the one intent a step reads', () => {
  it('zeroes before contributing, so letting go actually stops the ship', () => {
    const intent = makeIntent(SPECIAL_BINDINGS);
    const src = combineDevices([fixed(1, 0)]);
    src.contribute(intent);
    expect(intent.along).toBe(1);

    const quiet = combineDevices([fixed(0, 0)]);
    quiet.contribute(intent);
    expect(intent.along).toBe(0);
  });

  it('THE ONE: composition is order-independent, so wiring order is not a game mechanic', () => {
    const a = makeIntent(SPECIAL_BINDINGS);
    const b = makeIntent(SPECIAL_BINDINGS);
    combineDevices([fixed(0.75, -0.25), fixed(0, 0), fixed(-0.25, 0.5)]).contribute(a);
    combineDevices([fixed(-0.25, 0.5), fixed(0.75, -0.25), fixed(0, 0)]).contribute(b);
    expect(a.along).toBeCloseTo(b.along, 12);
    expect(a.across).toBeCloseTo(b.across, 12);
  });

  it('a device asking for nothing cannot dilute one that is asking', () => {
    const intent = makeIntent(SPECIAL_BINDINGS);
    combineDevices([fixed(1, 0), fixed(0, 0), fixed(0, 0)]).contribute(intent);
    expect(intent.along).toBe(1);
  });

  it('clamps, so a second device is not a speed-up', () => {
    const intent = makeIntent(SPECIAL_BINDINGS);
    combineDevices([fixed(1, 1), fixed(1, 1)]).contribute(intent);
    expect(intent.along).toBe(1);
    expect(intent.across).toBe(1);
  });

  it('two devices pushing opposite ways cancel, the same answer two opposed keys get', () => {
    const intent = makeIntent(SPECIAL_BINDINGS);
    combineDevices([fixed(1, 0), fixed(-1, 0)]).contribute(intent);
    expect(intent.along).toBe(0);
  });

  it('sums presses across devices, because a thumb and a button are both the player', () => {
    const intent = makeIntent(SPECIAL_BINDINGS);
    combineDevices([fixed(0, 0, 1), fixed(0, 0, 2)]).contribute(intent);
    expect(intent.specials[0]).toBe(3);
  });

  it('drains presses between steps, so one tap does not fire forever', () => {
    const intent = makeIntent(SPECIAL_BINDINGS);
    const src = combineDevices([fixed(0, 0, 1)]);
    src.contribute(intent);
    expect(intent.specials[0]).toBe(1);
    combineDevices([fixed(0, 0)]).contribute(intent);
    expect(intent.specials[0]).toBe(0);
  });

  /*
    ⚠️ THIS TEST EXISTS BECAUSE A PROBE CAME BACK "STILL GREEN".

    Order-independence above is proved with fake sources, and a fake source is written to add. Point
    a probe at the REAL devices — flip `+=` to `=` in `src/app/input.ts` — and every assertion in
    this file stayed green, because none of them ran a real device at all. The property was asserted
    about the composer and never about the things being composed.

    An idle device is the detector. A device that assigns writes its zero over whatever the sources
    before it asked for; a device that adds leaves it alone. All three are checked, because they are
    three separate files that each have to get this right and none of them guards the others.
  */
  it('THE STILL-GREEN ONE: an idle REAL device does not wipe what another source asked for', () => {
    const glass = {
      addEventListener(): void {},
      removeEventListener(): void {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 400 }),
    } as unknown as HTMLElement;

    for (const idle of [
      attachInput(silentKeyboard()),
      attachTouch(glass),
      attachPad({ pads: () => [] }),
    ]) {
      const intent = makeIntent(SPECIAL_BINDINGS);
      combineDevices([fixed(0.5, -0.5), idle]).contribute(intent);
      expect(intent.along, 'an idle device overwrote another source').toBeCloseTo(0.5, 12);
      expect(intent.across, 'an idle device overwrote another source').toBeCloseTo(-0.5, 12);
    }
  });

  it('releases every source, not just the first', () => {
    const a = fixed(0, 0);
    const b = fixed(0, 0);
    combineDevices([a, b]).release();
    expect(a.released).toBe(true);
    expect(b.released).toBe(true);
  });
});
