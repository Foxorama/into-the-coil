import { describe, expect, it } from 'vitest';

import {
  MENU_CONFIRM_BUTTONS,
  MENU_DPAD_BUTTONS,
  attachMenuPad,
  makeMenuAsk,
  type MenuAsk,
} from '../src/app/menu.ts';
import { PAD_AXIS_X, PAD_AXIS_Y, PAD_DEADZONE } from '../src/app/pad.ts';
import { SCREENS, SCREEN_KINDS, STEPS_PER_SECOND, type Screen } from '../src/state/screens.ts';

/**
 * A GAMEPAD ON A SCREEN WITH BUTTONS ON IT.
 *
 * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`. Reported from play:
 * *"gamepad controls on title screens — currently not working."*
 *
 * ⚠️ **The half tested here is the EDGE, and it is the half a browser test cannot see.** Whether the
 * focus ring moves is visible on a page; whether one push of a stick moves it once or sixty times a
 * second is a property of two numbers held between steps, and it is the property that decides
 * whether a menu is usable at all. `tests/menu.browser.test.ts` has the other half.
 */

/** A pad snapshot, built from plain numbers — no physical device, and no `navigator`. */
function pad(axes: readonly number[], pressed: readonly number[] = []): Gamepad {
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    pressed: pressed.includes(i),
    touched: pressed.includes(i),
    value: pressed.includes(i) ? 1 : 0,
  }));
  return {
    id: 'stub',
    index: 0,
    connected: true,
    mapping: 'standard',
    axes: [...axes],
    buttons,
    timestamp: 0,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

/** Drive a reader over a script of snapshots and collect what it asked for on each step. */
function drive(frames: readonly (Gamepad | null)[][]): MenuAsk[] {
  let frame = 0;
  const source = attachMenuPad({ pads: () => frames[frame] ?? [] });
  const ask = makeMenuAsk();
  const out: MenuAsk[] = [];
  for (frame = 0; frame < frames.length; frame++) {
    source.read(ask);
    out.push({ move: ask.move, confirm: ask.confirm });
  }
  return out;
}

const AXES = (x: number, y: number): number[] => {
  const axes = [0, 0];
  axes[PAD_AXIS_X] = x;
  axes[PAD_AXIS_Y] = y;
  return axes;
};

describe('a held stick asks once, not once per step', () => {
  it('reports one move for a push and holds silent until it comes back', () => {
    /*
      THE BUG THIS EXISTS FOR. A menu that reads the stick as a level moves the focus sixty times a
      second, so a control the player nudged towards is three screens away before their thumb is
      back at centre — and every one of those moves is individually correct.
    */
    const pushed = [pad(AXES(0, 1))];
    const asks = drive([pushed, pushed, pushed, [pad(AXES(0, 0))], pushed]);
    expect(asks.map((a) => a.move), 'a held stick asked more than once').toEqual([1, 0, 0, 0, 1]);
  });

  it('hears the opposite direction without a trip through the centre', () => {
    /*
      ⚠️ **The edge is a DIRECTION and not a boolean, and this is why.** Held as a boolean, a stick
      rolled from up to down without passing centre stays "held" and the second direction is never
      heard — which the player experiences as the menu refusing to go back.
    */
    const asks = drive([[pad(AXES(0, -1))], [pad(AXES(0, 1))]]);
    expect(asks.map((a) => a.move)).toEqual([-1, 1]);
  });

  it('ignores a stick resting off centre', () => {
    // `src/app/pad.ts` has the argument: a worn stick can rest at 0.15, and a menu that scrolls on
    // its own reads as a broken build rather than as a worn pad.
    const resting = PAD_DEADZONE * 0.9;
    const asks = drive([[pad(AXES(resting, -resting))]]);
    expect(asks[0]!.move, 'a resting stick moved the focus').toBe(0);
  });
});

describe('both axes move the focus, and the larger deflection wins', () => {
  it('answers a horizontal push as well as a vertical one', () => {
    // A row of controls and a column of controls are the same list; which way the chrome laid them
    // out is CSS, and a pad that only answered one axis would feel broken on whichever it was not.
    expect(drive([[pad(AXES(1, 0))]])[0]!.move).toBe(1);
    expect(drive([[pad(AXES(-1, 0))]])[0]!.move).toBe(-1);
  });

  it('resolves a diagonal to one answer rather than to both', () => {
    // A diagonal is a real ask while flying — `src/app/pad.ts` reads it radially for that reason —
    // and it is not one here, because there are only two answers and they are opposites.
    expect(drive([[pad(AXES(0.5, -0.9))]])[0]!.move, 'the smaller axis won').toBe(-1);
    expect(drive([[pad(AXES(0.9, 0.5))]])[0]!.move).toBe(1);
  });

  it('takes the d-pad, which is what a hand reaches for in a menu', () => {
    expect(drive([[pad(AXES(0, 0), [MENU_DPAD_BUTTONS.up])]])[0]!.move).toBe(-1);
    expect(drive([[pad(AXES(0, 0), [MENU_DPAD_BUTTONS.down])]])[0]!.move).toBe(1);
    expect(drive([[pad(AXES(0, 0), [MENU_DPAD_BUTTONS.left])]])[0]!.move).toBe(-1);
    expect(drive([[pad(AXES(0, 0), [MENU_DPAD_BUTTONS.right])]])[0]!.move).toBe(1);
  });
});

describe('confirm is a press and never a hold', () => {
  it('fires once for a button held down across many steps', () => {
    /*
      ⚠️ **The one that would be worst in play.** A held confirm re-fires every step, so the button
      that starts a run also presses whatever the next screen puts under the player's thumb — and on
      the run-over screen that is *Again*, which would restart the run they were reading about.
    */
    const held = [pad(AXES(0, 0), [MENU_CONFIRM_BUTTONS[0]!])];
    const asks = drive([held, held, held, [pad(AXES(0, 0))], held]);
    expect(asks.map((a) => a.confirm)).toEqual([true, false, false, false, true]);
  });

  it('takes every button the table names', () => {
    for (const button of MENU_CONFIRM_BUTTONS) {
      expect(drive([[pad(AXES(0, 0), [button])]])[0]!.confirm, `button ${button} does not confirm`).toBe(true);
    }
  });

  it('forgets what was held when the source is released', () => {
    // Re-entering a menu must not inherit a press from the last one.
    let frames: (Gamepad | null)[] = [pad(AXES(0, 0), [MENU_CONFIRM_BUTTONS[0]!])];
    const source = attachMenuPad({ pads: () => frames });
    const ask = makeMenuAsk();
    source.read(ask);
    expect(ask.confirm).toBe(true);
    source.read(ask);
    expect(ask.confirm, 'a hold fired twice').toBe(false);
    source.release();
    frames = [pad(AXES(0, 0), [MENU_CONFIRM_BUTTONS[0]!])];
    source.read(ask);
    expect(ask.confirm, 'release did not clear the held state').toBe(true);
  });
});

describe('a disconnected or absent pad asks for nothing', () => {
  it('survives an empty snapshot and a null entry', () => {
    // Both are real states: no pad plugged in, and a slot the browser has emptied.
    expect(drive([[], [null]]).every((a) => a.move === 0 && !a.confirm)).toBe(true);
  });

  it('ignores a pad that reports itself disconnected', () => {
    const gone = { ...pad(AXES(0, 1), [0]), connected: false } as Gamepad;
    expect(drive([[gone]])[0]).toEqual({ move: 0, confirm: false });
  });
});

describe('a screen that expires says where it goes and how long it waits', () => {
  it('gives the run-over screen seven seconds back to the title', () => {
    /*
      Asked for in play: *"this screen should have a 7 second countdown; when it expires, the player
      is returned to the title screen."*

      Held as the number of SECONDS rather than the number of steps, which is the unit the request
      was made in — and `STEPS_PER_SECOND` is the one description of the conversion, so a change to
      the step rate cannot silently make this four seconds.
    */
    const timeout = SCREENS.gameOver.timeout;
    expect(timeout, 'the run-over screen waits forever').not.toBe(null);
    expect(timeout!.steps / STEPS_PER_SECOND).toBe(7);
    expect(timeout!.then).toBe('title');
  });

  it('and no other screen expires, because no other screen may', () => {
    /*
      ⚠️ **The half that matters more.** `cleared` and `victory` both sit on top of something the
      player earned; timing either of them out would throw a run away while its owner was looking at
      it. `playing` timing out would end a run nobody lost, and `title` has nowhere to go.
    */
    const expiring = SCREEN_KINDS.filter((s: Screen) => SCREENS[s].timeout !== null);
    expect(expiring, 'a screen other than the run-over screen expires by itself').toEqual(['gameOver']);
  });

  it('and every destination is a screen that exists', () => {
    for (const screen of SCREEN_KINDS) {
      const timeout = SCREENS[screen].timeout;
      if (timeout === null) continue;
      expect(SCREEN_KINDS, `${screen} expires to a screen that is not in the table`).toContain(timeout.then);
      expect(timeout.then, `${screen} expires to itself`).not.toBe(screen);
      expect(timeout.steps, `${screen} expires in no time at all`).toBeGreaterThan(0);
    }
  });
});
