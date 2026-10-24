import { describe, it, expect } from 'vitest';
import { DEFAULT_BINDINGS, DEFAULT_PAD_BUTTONS, SPECIAL_BINDINGS, bindButton, bindKey } from '../src/content/actions.ts';
import { makeIntent } from '../src/sim/intent.ts';
import { attachInput } from '../src/app/input.ts';
import { attachPad } from '../src/app/pad.ts';
import { CONTROL_ROWS, SCREENS } from '../src/state/screens.ts';

/**
 * THE CONTROLS ARE BOUND — 0664.
 *
 * *"Controls config for keyboard + gamepad in settings. Need to make sure it saves properly."* What is held here is
 * the half between a binding and a press: the keyboard's source reads the keys it was bound to last, and the pad
 * reads its triggers' buttons every step. That it is kept is `tests/settings-kept.test.ts`; that a press on the
 * Controls tab binds is `tests/controls.browser.test.ts`.
 */

/** A key event, as the window would send it. */
const key = (type: 'keydown' | 'keyup', code: string): Event => Object.assign(new Event(type), { code });

describe('0664 — a binding is what a press means', () => {
  it('THE ASK: the keyboard throws the first trigger on the key it was bound to, and not on the one it had', () => {
    const target = new EventTarget();
    const keyboard = attachInput(target);
    keyboard.rebind(bindKey(DEFAULT_BINDINGS, 'special1', 'KeyK'));
    const intent = makeIntent(SPECIAL_BINDINGS);
    target.dispatchEvent(key('keydown', 'Space'));
    target.dispatchEvent(key('keyup', 'Space'));
    keyboard.contribute(intent);
    expect(intent.specials[0], 'the old key still throws the trigger').toBe(0);
    target.dispatchEvent(key('keydown', 'KeyK'));
    keyboard.contribute(intent);
    expect(intent.specials[0], 'the bound key does not throw it').toBe(1);
    keyboard.release();
  });

  it('a rebinding lets go of what was held, so nothing stays held under a key it no longer has', () => {
    const target = new EventTarget();
    const keyboard = attachInput(target);
    target.dispatchEvent(key('keydown', 'KeyD'));
    const before = makeIntent(SPECIAL_BINDINGS);
    keyboard.contribute(before);
    expect(before.along, 'D did not fly forward, so this proves nothing').toBe(1);
    keyboard.rebind(bindKey(DEFAULT_BINDINGS, 'alongPlus', 'KeyL'));
    const after = makeIntent(SPECIAL_BINDINGS);
    keyboard.contribute(after);
    expect(after.along, 'the ship flew on under a key that no longer flies it').toBe(0);
    keyboard.release();
  });

  it('the pad throws a trigger on the button its binding says, read every step', () => {
    let buttons: readonly number[] = DEFAULT_PAD_BUTTONS;
    let down: number[] = [];
    const snapshot = (): readonly Gamepad[] => [
      { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 12 }, (_, i) => ({ pressed: down.includes(i), touched: false, value: 0 })) } as unknown as Gamepad,
    ];
    const pad = attachPad({ pads: snapshot, buttons: () => buttons });
    const press = (button: number): number => {
      const intent = makeIntent(SPECIAL_BINDINGS);
      down = [button];
      pad.contribute(intent);
      down = [];
      pad.contribute(makeIntent(SPECIAL_BINDINGS));
      return intent.specials[2] ?? 0;
    };
    expect(press(2), 'X does not throw the third trigger by default, so this proves nothing').toBe(1);
    buttons = bindButton(DEFAULT_PAD_BUTTONS, 2, 5);
    expect(press(5), 'RB does not throw the trigger bound to it').toBe(1);
    expect(press(2), 'X still throws the trigger moved off it').toBe(0);
  });
});

describe('0664 — the Controls tab', () => {
  it('has a button for every key action and every trigger’s pad button, then a reset and Back', () => {
    const keys = CONTROL_ROWS.filter((row) => row.device === 'keys').map((row) => (row.device === 'keys' ? row.action : null));
    expect(keys.slice().sort(), 'a key action has no button').toEqual(Object.keys(DEFAULT_BINDINGS).sort());
    expect(CONTROL_ROWS.filter((row) => row.device === 'pad'), 'a trigger has no pad button').toHaveLength(SPECIAL_BINDINGS);
    const actions = SCREENS.controls.actions.map((a) => a.label);
    expect(actions.length).toBe(CONTROL_ROWS.length + 2);
    expect(actions.at(-2)).toBe('Reset to defaults');
    expect(actions.at(-1)).toBe('Back');
    expect(SCREENS.settings.tabs, 'the Controls tab is not beside Settings').toContain('controls');
  });
});
