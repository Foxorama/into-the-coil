import { describe, it, expect } from 'vitest';
import { SPECIAL_BINDINGS } from '../src/content/actions.js';
import { makeIntent, type Intent } from '../src/sim/intent.js';
import { combineDevices } from '../src/app/devices.js';
import { attachPad, PAD_DEADZONE, PAD_SPECIAL_BUTTONS } from '../src/app/pad.js';

/**
 * THE THIRD DEVICE.
 *
 * See `docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md`. A keyboard and a touchscreen
 * could each be read as a special case of the other; a gamepad cannot, which is what makes it the
 * device that actually tests 0030's *"input is actions"*.
 *
 * Two claims here are the ones that get waved through and then ship:
 *
 *   - **a resting stick is not zero.** Every analog stick sits a little off centre. Without a floor
 *     the ship drifts across the lane while nobody is touching anything.
 *   - **the floor is RADIAL.** A per-axis floor squares off the centre, so a clear diagonal of the
 *     same magnitude as an accepted straight push is refused — a control that works in four
 *     directions and not in eight.
 */

/** The smallest thing that behaves like a pad. */
function pad(x: number, y: number, buttons: readonly boolean[] = [], connected = true): Gamepad {
  return {
    axes: [x, y],
    buttons: buttons.map((pressed) => ({ pressed, touched: pressed, value: pressed ? 1 : 0 })),
    connected,
  } as unknown as Gamepad;
}

function rig(): {
  set: (...pads: (Gamepad | null)[]) => void;
  step: () => Intent;
  spend: () => void;
} {
  let snapshot: readonly (Gamepad | null)[] = [];
  const src = combineDevices([attachPad({ pads: () => snapshot })]);
  const intent = makeIntent(SPECIAL_BINDINGS);
  return {
    set: (...pads: (Gamepad | null)[]): void => {
      snapshot = pads;
    },
    step: (): Intent => (src.contribute(intent), intent),
    spend: (): void => src.spend(),
  };
}

/** Which button index fires the first special, so these tests do not hard-code the mapping. */
const FIRST = PAD_SPECIAL_BUTTONS[0] ?? 0;

function buttonsWith(index: number): boolean[] {
  const b: boolean[] = [];
  for (let i = 0; i <= index; i++) b.push(i === index);
  return b;
}

describe('a stick becomes an intent, and the deadzone is the whole job', () => {
  it('THE DRIFT: a stick resting off centre asks for nothing', () => {
    const { set, step } = rig();
    set(pad(PAD_DEADZONE * 0.8, 0));
    expect(step().along).toBe(0);
  });

  it('a stick pushed past the floor asks for what it is pushed to', () => {
    const { set, step } = rig();
    set(pad(1, 0));
    expect(step().along).toBe(1);
  });

  it('keeps analog magnitude rather than rounding to a direction', () => {
    const { set, step } = rig();
    set(pad(0.5, 0));
    expect(step().along).toBeCloseTo(0.5, 12);
  });

  it('THE RADIAL ONE: a diagonal outside the circle passes, though each axis is inside the floor', () => {
    // Both components are under PAD_DEADZONE; the magnitude is over it. A per-axis floor refuses
    // this and accepts a straight push of identical magnitude.
    const leg = PAD_DEADZONE * 0.8;
    expect(leg).toBeLessThan(PAD_DEADZONE);
    expect(Math.hypot(leg, leg)).toBeGreaterThan(PAD_DEADZONE);
    const { set, step } = rig();
    set(pad(leg, leg));
    const intent = step();
    expect(intent.along).toBeCloseTo(leg, 12);
    expect(intent.across).toBeCloseTo(leg, 12);
  });

  it('holds the ask across steps, because a stick is a level and not an event', () => {
    const { set, step } = rig();
    set(pad(1, 0));
    expect(step().along).toBe(1);
    expect(step().along).toBe(1);
  });

  it('returns to nothing when the stick is let go', () => {
    const { set, step } = rig();
    set(pad(1, 0));
    expect(step().along).toBe(1);
    set(pad(0, 0));
    expect(step().along).toBe(0);
  });
});

describe('buttons are edges the snapshot cannot report, so this derives them', () => {
  it('fires a HELD button once, however many steps it is held for', () => {
    const { set, step } = rig();
    set(pad(0, 0, buttonsWith(FIRST)));
    expect(step().specials[0]).toBe(1);
    expect(step().specials[0]).toBe(0);
    expect(step().specials[0]).toBe(0);
  });

  it('fires again after a release, because that is a second press', () => {
    const { set, step } = rig();
    set(pad(0, 0, buttonsWith(FIRST)));
    expect(step().specials[0]).toBe(1);
    set(pad(0, 0, []));
    step();
    set(pad(0, 0, buttonsWith(FIRST)));
    expect(step().specials[0]).toBe(1);
  });

  it('has one button per binding, so a third special needs no code here', () => {
    expect(PAD_SPECIAL_BUTTONS.length).toBeGreaterThanOrEqual(SPECIAL_BINDINGS);
  });
});

describe('pads come and go, and nothing may throw when they do', () => {
  it('ignores a disconnected pad still present in the snapshot', () => {
    const { set, step } = rig();
    set(pad(1, 0, [], false));
    expect(step().along).toBe(0);
  });

  it('ignores a null slot, which is what an unplugged port reports', () => {
    const { set, step } = rig();
    set(null, pad(1, 0));
    expect(step().along).toBe(1);
  });

  it('survives a pad with no axes at all', () => {
    const { set, step } = rig();
    set({ axes: [], buttons: [], connected: true } as unknown as Gamepad);
    expect(step().along).toBe(0);
  });

  it('asks for nothing when there is no pad, which is the desktop and phone case', () => {
    const { step } = rig();
    expect(step().along).toBe(0);
    expect(step().across).toBe(0);
  });
});

/**
 * THE BOMB THAT FIRES ITSELF, REPORTED FROM PLAY.
 *
 * *"Gamepad input button on title menus is the same button as the bomb special weapon so starting a
 * new game automatically fires a bomb."*
 * `docs/decisions/0055-a-press-belongs-to-one-screen.md`.
 *
 * ⚠️ **It was never a binding clash.** The binding table is right, and
 * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md` gives the reason a menu's
 * confirm may not follow a rebound special. One press was read twice, by two readers, either side of
 * a screen change — and the shape of that is a snapshot device, not a table.
 */
describe('a press that has already been used is not read again', () => {
  it('THE BOMB: a button held through a screen change is not a fresh press', () => {
    /*
      The reported sequence exactly. The player holds the confirm button on the title screen; the
      menu reader acts on it; the run starts; the game's reader takes its FIRST snapshot with that
      button still down. Down-now and not-down-last-step is indistinguishable from a press.
    */
    const { set, step, spend } = rig();
    set(pad(0, 0, buttonsWith(FIRST)));
    spend();
    expect(step().specials[0], 'the press that started the run also threw a bomb').toBe(0);
  });

  it('and the next real press, after letting go, still fires', () => {
    /*
      ⚠️ **The half that would make this fix worse than the bug.** Swallowing the press is easy;
      swallowing the button is what a naive latch does, and a player whose bomb never works again is
      worse off than one who wastes a charge at the start.
    */
    const { set, step, spend } = rig();
    set(pad(0, 0, buttonsWith(FIRST)));
    spend();
    step();
    set(pad(0, 0, [false]));
    step();
    set(pad(0, 0, buttonsWith(FIRST)));
    expect(step().specials[0], 'the special was latched off for good').toBe(1);
  });

  it('spends only the step it was asked for, not every step after it', () => {
    // A flag that never cleared would be the same bug wearing the fix's clothes.
    const { set, step, spend } = rig();
    set(pad(0, 0, [false]));
    spend();
    step();
    set(pad(0, 0, buttonsWith(FIRST)));
    expect(step().specials[0], 'spend swallowed a press made after the screen changed').toBe(1);
  });

  it('is not `release`, which points the opposite way', () => {
    /*
      ⚠️ **The distinction the whole decision rests on.** `release` forgets what was held so the next
      press is heard — right when a source is being torn down, and exactly wrong across a screen
      change, where it manufactures the press this test exists to prevent.
    */
    const { set, step } = rig();
    set(pad(0, 0, buttonsWith(FIRST)));
    step();
    expect(step().specials[0], 'a held button repeated').toBe(0);
  });
});
