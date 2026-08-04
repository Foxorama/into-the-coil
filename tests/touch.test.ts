import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SPECIAL_BINDINGS } from '../src/content/actions.js';
import { makeIntent, type Intent } from '../src/sim/intent.js';
import { combineDevices } from '../src/app/devices.js';
import { attachTouch, DRAG_GAIN, STICK_RADIUS_PX, STICK_DEADZONE_PX, TAP_STRIP } from '../src/app/touch.js';
import { SHIP_SPEED } from '../src/sim/flight.js';

/*
  The rig fixes a scale so the numbers below are readable: 4 CSS pixels per world unit, which is
  roughly a phone in landscape (100 units of dodge lane across a 400px short edge).

  STEP_PX is what ONE full-deflection step is worth in finger pixels at that scale. It replaces a
  constant that used to be written directly into this file, and the replacement is the whole point —
  see the ⚠️ on DRAG_GAIN in src/app/touch.ts.
*/
/*
  ⚠️ Asserted with `toBeCloseTo` and not `toBe`. STEP_PX is a division, so whether it lands on an
  exact binary fraction is a property of whatever DRAG_GAIN happens to be — 1.6 divided cleanly and
  1.48 does not. Four assertions here broke on the first tuning pass for that reason alone, which
  means they had been passing by luck rather than by being right. A tuning constant must never be
  able to break a test that is not about its value.
*/
const SCALE = 4;
const STEP_PX = (SHIP_SPEED * SCALE) / DRAG_GAIN;

/**
 * TOUCH IS RELATIVE DRAG.
 *
 * See `docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md`.
 *
 * The claim that separates drag from every virtual stick is **the bank**: movement the ship could
 * not deliver this step is kept, not dropped. Without it a flick under-delivers — the finger crosses
 * the screen, the ask saturates at 1 for a single step, and the rest is silently lost. That is the
 * test to read first, and the one whose absence would leave a scheme that passes every other
 * assertion here while feeling wrong in the hand.
 */

/** The smallest thing that behaves like a canvas with a box, so these tests need no DOM. */
class FakeGlass {
  private readonly listeners = new Map<string, Set<EventListener>>();
  captured = -1;

  constructor(
    readonly width = 800,
    readonly height = 400,
  ) {}

  addEventListener(type: string, fn: EventListener | null): void {
    if (fn === null) return;
    const set = this.listeners.get(type) ?? new Set<EventListener>();
    set.add(fn);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, fn: EventListener | null): void {
    if (fn !== null) this.listeners.get(type)?.delete(fn);
  }

  dispatchEvent(event: Event): boolean {
    for (const fn of this.listeners.get(event.type) ?? []) fn(event);
    return true;
  }

  getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }

  setPointerCapture(id: number): void {
    this.captured = id;
  }

  get size(): number {
    let n = 0;
    for (const set of this.listeners.values()) n += set.size;
    return n;
  }

  private send(type: string, x: number, y: number, id: number, pointerType: string): void {
    this.dispatchEvent({ type, clientX: x, clientY: y, pointerId: id, pointerType } as unknown as Event);
  }

  down(x: number, y: number, id = 1, pointerType = 'touch'): void {
    this.send('pointerdown', x, y, id, pointerType);
  }
  move(x: number, y: number, id = 1): void {
    this.send('pointermove', x, y, id, 'touch');
  }
  up(x: number, y: number, id = 1): void {
    this.send('pointerup', x, y, id, 'touch');
  }
  cancel(x: number, y: number, id = 1): void {
    this.send('pointercancel', x, y, id, 'touch');
  }
  blur(): void {
    this.dispatchEvent({ type: 'blur' } as unknown as Event);
  }
}

const glassAs = (g: FakeGlass): HTMLElement => g as unknown as HTMLElement;

/** A point comfortably inside the steering area — the leading edge is where the tap strip is. */
const STEER_X = 100;
const STEER_Y = 200;

function rig(scheme: 'drag' | 'stick' = 'drag'): {
  glass: FakeGlass;
  step: () => Intent;
  intent: Intent;
} {
  const glass = new FakeGlass();
  const src = combineDevices([attachTouch(glassAs(glass), { scheme, scale: () => SCALE })]);
  const intent = makeIntent(SPECIAL_BINDINGS);
  return { glass, intent, step: (): Intent => (src.contribute(intent), intent) };
}

describe('drag: the finger’s movement is the ask', () => {
  it('a finger doing nothing asks for nothing', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    expect(step().along).toBeCloseTo(0, 9);
  });

  it('a finger held still, having moved, asks for nothing more', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STEP_PX, STEER_Y);
    expect(step().along).toBeCloseTo(1, 9);
    expect(step().along).toBeCloseTo(0, 9);
  });

  it('converts a gain’s worth of travel into full deflection', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STEP_PX / 2, STEER_Y);
    expect(step().along).toBeCloseTo(0.5, 12);
  });

  it('THE ONE: a flick is banked and delivered in full, not clipped to one step', () => {
    // Three gains of travel inside a single step. A scheme without the bank reports 1 and throws
    // away two thirds of the movement the player actually made.
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STEP_PX * 3, STEER_Y);
    expect(step().along).toBeCloseTo(1, 9);
    expect(step().along).toBeCloseTo(1, 9);
    expect(step().along).toBeCloseTo(1, 9);
    expect(step().along).toBeCloseTo(0, 9);
  });

  it('keeps the bank when the finger LEAVES, because that is what a flick is', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STEP_PX * 2, STEER_Y);
    glass.up(STEER_X + STEP_PX * 2, STEER_Y);
    expect(step().along).toBeCloseTo(1, 9);
    expect(step().along).toBeCloseTo(1, 9);
  });

  it('lifting and re-placing the thumb moves the ship not at all — the re-grip', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    glass.up(STEER_X, STEER_Y);
    glass.down(STEER_X + 300, STEER_Y + 100);
    expect(step().along).toBeCloseTo(0, 9);
    expect(step().across).toBeCloseTo(0, 9);
  });

  it('reverses immediately, with no anchor to drag back across', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STEP_PX, STEER_Y);
    expect(step().along).toBeCloseTo(1, 9);
    glass.move(STEER_X, STEER_Y);
    expect(step().along).toBeCloseTo(-1, 9);
  });
});

describe('the browser and the OS both take pointers away', () => {
  it('pointercancel releases the drag, because no pointerup will ever arrive', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    glass.cancel(STEER_X, STEER_Y);
    // A new finger steers, which it could not do if the cancelled one still held the slot.
    glass.down(STEER_X, STEER_Y, 2);
    glass.move(STEER_X + STEP_PX, STEER_Y, 2);
    expect(step().along).toBeCloseTo(1, 9);
  });

  it('blur clears the bank, so alt-tabbing does not fly the ship on return', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STEP_PX * 3, STEER_Y);
    glass.blur();
    expect(step().along).toBeCloseTo(0, 9);
  });

  it('takes pointer capture, so a thumb sliding off the edge keeps steering', () => {
    const { glass } = rig();
    glass.down(STEER_X, STEER_Y, 7);
    expect(glass.captured).toBe(7);
  });

  it('ignores a mouse, because desktop already has a complete scheme', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y, 1, 'mouse');
    glass.move(STEER_X + STEP_PX, STEER_Y);
    expect(step().along).toBeCloseTo(0, 9);
  });

  it('ignores a second finger in the steering area rather than letting it steal the drag', () => {
    const { glass, step } = rig();
    glass.down(STEER_X, STEER_Y, 1);
    glass.down(STEER_X + 50, STEER_Y + 50, 2);
    glass.move(STEER_X + STEP_PX, STEER_Y, 2);
    expect(step().along).toBeCloseTo(0, 9);
  });

  it('detaches every listener on release', () => {
    const glass = new FakeGlass();
    const src = attachTouch(glassAs(glass));
    expect(glass.size).toBeGreaterThan(0);
    src.release();
    expect(glass.size).toBe(0);
  });
});

describe('stick: displacement from where the finger landed', () => {
  it('reaches full deflection at the radius', () => {
    const { glass, step } = rig('stick');
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STICK_RADIUS_PX, STEER_Y);
    expect(step().along).toBeCloseTo(1, 9);
  });

  it('saturates past the radius — the dead zone at the top of every stick', () => {
    const { glass, step } = rig('stick');
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STICK_RADIUS_PX * 4, STEER_Y);
    expect(step().along).toBeCloseTo(1, 9);
  });

  it('holds its ask while the finger holds still, which is what a stick IS', () => {
    const { glass, step } = rig('stick');
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STICK_RADIUS_PX, STEER_Y);
    expect(step().along).toBeCloseTo(1, 9);
    expect(step().along).toBeCloseTo(1, 9);
  });

  it('asks for nothing once the finger lifts', () => {
    const { glass, step } = rig('stick');
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STICK_RADIUS_PX, STEER_Y);
    glass.up(STEER_X + STICK_RADIUS_PX, STEER_Y);
    expect(step().along).toBeCloseTo(0, 9);
  });

  it('THE DEADZONE IS RADIAL: a diagonal inside the circle is refused like a straight one', () => {
    // Per-axis would let this through — each component is under the floor while the magnitude is
    // over it — which is the bug that makes a control work in four directions and not in eight.
    const { glass, step } = rig('stick');
    const leg = STICK_DEADZONE_PX * 0.8;
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + leg, STEER_Y + leg);
    const intent = step();
    expect(Math.hypot(leg, leg)).toBeGreaterThan(STICK_DEADZONE_PX);
    expect(intent.along).not.toBe(0);
  });

  it('refuses a resting finger’s jitter', () => {
    const { glass, step } = rig('stick');
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + 1, STEER_Y - 1);
    expect(step().along).toBeCloseTo(0, 9);
    expect(step().across).toBeCloseTo(0, 9);
  });
});

describe('the tap strip is generated from the binding budget', () => {
  const tapAt = (glass: FakeGlass, band: number): void => {
    const x = glass.width * (1 - TAP_STRIP / 2);
    const y = glass.height * ((band + 0.5) / SPECIAL_BINDINGS);
    glass.down(x, y, 10 + band);
  };

  it('fires the special whose band was tapped', () => {
    const { glass, step } = rig();
    tapAt(glass, 0);
    expect(step().specials[0]).toBe(1);
  });

  it('has exactly one band per binding, so a third special needs no code here', () => {
    const { glass, step } = rig();
    for (let band = 0; band < SPECIAL_BINDINGS; band++) tapAt(glass, band);
    const intent = step();
    for (let band = 0; band < SPECIAL_BINDINGS; band++) expect(intent.specials[band]).toBe(1);
  });

  it('counts two taps between steps as two, the same rule the keyboard follows', () => {
    const { glass, step } = rig();
    tapAt(glass, 0);
    tapAt(glass, 0);
    expect(step().specials[0]).toBe(2);
  });

  it('drains, so one tap fires exactly once', () => {
    const { glass, step } = rig();
    tapAt(glass, 0);
    expect(step().specials[0]).toBe(1);
    expect(step().specials[0]).toBe(0);
  });

  it('a tap in the strip does not steer, and steering does not fire', () => {
    const { glass, step } = rig();
    tapAt(glass, 0);
    glass.move(glass.width * (1 - TAP_STRIP / 2) + STEP_PX, 200, 10);
    const intent = step();
    expect(intent.along).toBeCloseTo(0, 9);
    expect(intent.specials[0]).toBe(1);
  });
});

describe('the screen’s axes become the world’s, and rotation is why', () => {
  it('landscape: rightwards is forward, downwards is across', () => {
    const glass = new FakeGlass(800, 400);
    const src = combineDevices([attachTouch(glassAs(glass), { alongAxis: () => 'x', scale: () => SCALE })]);
    const intent = makeIntent(SPECIAL_BINDINGS);
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X + STEP_PX, STEER_Y + STEP_PX);
    src.contribute(intent);
    expect(intent.along).toBeCloseTo(1, 9);
    expect(intent.across).toBeCloseTo(1, 9);
  });

  it('portrait: 0023’s handedness, so a re-enable does not steer sideways', () => {
    const glass = new FakeGlass(400, 800);
    const src = combineDevices([attachTouch(glassAs(glass), { alongAxis: () => 'y', scale: () => SCALE })]);
    const intent = makeIntent(SPECIAL_BINDINGS);
    glass.down(STEER_X, 300);
    glass.move(STEER_X + STEP_PX, 300 - STEP_PX);
    src.contribute(intent);
    // `along` is screen −y and `across` is screen +x.
    expect(intent.along).toBeCloseTo(1, 9);
    expect(intent.across).toBeCloseTo(1, 9);
  });
});

/*
  THE HALF NO BROWSER HERE CAN SEE.

  `tests/frame.browser.test.ts` asserts `touch-action`, `user-select` and `overscroll-behavior` on
  computed style in a real Chromium, which is the strong form: it proves the engine ACCEPTED them.

  It cannot do that for `-webkit-touch-callout`. Chromium does not implement the property, refuses it
  on `setProperty`, and reports `''` computed and inline alike — so there is no observable difference
  in this suite between setting it correctly and never writing the line. And iOS, where the callout
  actually opened on a real phone, is the one engine this suite cannot run.

  So: a source scan, which is the second half of a two-halves guard per
  docs/decisions/0025-the-frame-budget-is-counted-not-timed.md. Neither half sees what the other
  does. The browser half cannot see a property the engine drops; this half cannot see a value the
  engine rejected, or a line that never ran.
*/
const mountSource = readFileSync(fileURLToPath(new URL('../src/app/mount.ts', import.meta.url)), 'utf8');

describe('the gesture suppression a Chromium cannot report on', () => {
  it('sets -webkit-touch-callout, which is the property the iOS long-press callout obeys', () => {
    expect(
      mountSource,
      'the long-press callout is back on iOS, and no browser test on this machine can tell you',
    ).toMatch(/setProperty\(\s*'-webkit-touch-callout'\s*,\s*'none'\s*\)/);
  });

  it('sets it on the canvas rather than the document, which 0024 is why', () => {
    expect(mountSource).toMatch(/canvas\.style\.setProperty\(\s*'-webkit-touch-callout'/);
  });
});

/*
  THE ONE THAT WAS MISSING, AND THE REASON THE REST OF THIS FILE WAS NOT ENOUGH.

  Every drag assertion above measures an ASK — "this much finger produces a deflection of 1". They
  were all green against a version of this file in which a 140px swipe moved the ship 10.3 pixels,
  and crossing the dodge lane would have taken about five metres of thumb. A per-step ask is
  self-consistent at any conversion factor, including an absurd one, so a suite built only from asks
  cannot see the bug at all.

  What was missing is a measure of DISTANCE: drain the bank completely and add up the world units
  actually delivered. That is the quantity a thumb feels, and the only one that ties finger pixels to
  ship pixels.

  Caught by driving a real swipe against the deployed page and reading where the ship was drawn —
  docs/decisions/0027-measure-the-picture-not-the-model.md, for the second time in one session.
*/
describe('a swipe moves the ship as far as the gain says, in world units', () => {
  /** Run steps until the bank is empty, and return the total world-unit travel. */
  const drain = (step: () => Intent, axis: 'along' | 'across'): number => {
    let total = 0;
    for (let i = 0; i < 400; i++) {
      const ask = step()[axis];
      if (ask === 0) break;
      total += ask * SHIP_SPEED;
    }
    return total;
  };

  it('THE DISTANCE ONE: N pixels of finger deliver N × gain pixels of ship', () => {
    const { glass, step } = rig();
    const swipePx = 200;
    glass.down(STEER_X, STEER_Y);
    glass.move(STEER_X, STEER_Y + swipePx);
    const worldUnits = drain(step, 'across');
    // World units back into the pixels the player watches.
    expect(worldUnits * SCALE).toBeCloseTo(swipePx * DRAG_GAIN, 6);
  });

  it('crosses the dodge lane in a plausible thumb sweep, not in metres', () => {
    // The failure this replaces needed ~5,300px. A screen's short edge is 400px at this scale.
    const pxToCrossTheLane = (100 * SCALE) / DRAG_GAIN;
    expect(pxToCrossTheLane).toBeLessThan(400);
    expect(pxToCrossTheLane, 'the gain is so high the lane crosses by accident').toBeGreaterThan(100);
  });

  it('delivers the same distance however fast the finger moved', () => {
    // One jump versus ten increments. A flick and a slow drag are the same distance to the ship,
    // which is what the bank is for.
    const flick = rig();
    flick.glass.down(STEER_X, STEER_Y);
    flick.glass.move(STEER_X, STEER_Y + 200);
    const fast = drain(flick.step, 'across');

    const slow = rig();
    slow.glass.down(STEER_X, STEER_Y);
    for (let i = 1; i <= 10; i++) slow.glass.move(STEER_X, STEER_Y + i * 20);
    const gentle = drain(slow.step, 'across');

    expect(fast).toBeCloseTo(gentle, 6);
  });

  it('scales with the screen, so the same swipe means the same thing on any device', () => {
    // A finger crossing half the screen must cross the same fraction of the LANE on a small phone
    // and a large one. That is 0023's rule applied to input rather than to the camera.
    for (const scale of [2, 4, 9]) {
      const glass = new FakeGlass();
      const src = combineDevices([attachTouch(glassAs(glass), { scale: () => scale })]);
      const intent = makeIntent(SPECIAL_BINDINGS);
      const stepAt = (): Intent => (src.contribute(intent), intent);
      const swipePx = 50 * scale; // the same FRACTION of a screen on each
      glass.down(STEER_X, STEER_Y);
      glass.move(STEER_X, STEER_Y + swipePx);
      let total = 0;
      for (let i = 0; i < 400; i++) {
        const ask = stepAt().across;
        if (ask === 0) break;
        total += ask * SHIP_SPEED;
      }
      expect(total, `scale ${scale} moved a different fraction of the lane`).toBeCloseTo(50 * DRAG_GAIN, 6);
    }
  });
});
