import { describe, it, expect } from 'vitest';
import { ACTIONS, ACTION_NAMES, DEFAULT_BINDINGS, SPECIAL_BINDINGS, type Action } from '../src/content/actions.js';
import { makeIntent, clearIntent, type Intent } from '../src/sim/intent.js';
import { attachInput } from '../src/app/input.js';
import { combineDevices } from '../src/app/devices.js';

/**
 * INPUT IS ACTIONS, AND THE ARSENAL IS A LIST.
 *
 * See `docs/decisions/0030-input-is-actions-and-needs-no-new-layer.md`. The reasoning is there.
 *
 * The two claims worth breaking on purpose are the ones a reviewer would wave through:
 *
 *   - a special pressed twice between two fixed steps fires TWICE. A boolean passes every casual
 *     test and loses the second press only under load, which is when it matters.
 *   - a HELD special fires once. `keydown` repeats at the OS's rate, so the obvious implementation
 *     empties the arsenal by leaning on a key.
 */

/** The smallest thing that behaves like a keyboard, so these tests need no DOM. */
class FakeKeyboard implements EventTarget {
  private readonly listeners = new Map<string, Set<EventListener>>();

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

  /** Count of live listeners, so `release` can be shown to actually detach. */
  get size(): number {
    let n = 0;
    for (const set of this.listeners.values()) n += set.size;
    return n;
  }

  down(code: string): void {
    this.dispatchEvent({ type: 'keydown', code } as unknown as Event);
  }

  up(code: string): void {
    this.dispatchEvent({ type: 'keyup', code } as unknown as Event);
  }

  blur(): void {
    this.dispatchEvent({ type: 'blur' } as unknown as Event);
  }
}

/** The first code bound to an action. Throws rather than typing `!`, so an unbound action says so. */
function firstCode(action: Action): string {
  const code = DEFAULT_BINDINGS[action][0];
  if (code === undefined) throw new Error(`${action} is unbound, so this test is asserting nothing`);
  return code;
}

const SPACE = firstCode('special1');
const SHIFT = firstCode('special2');
const FORWARD = firstCode('alongPlus');
const BACK = firstCode('alongMinus');

describe('the action table is closed and describes one fact once', () => {
  it('every action has a row and every row has an action', () => {
    expect([...ACTION_NAMES].sort()).toEqual(Object.keys(ACTIONS).sort());
  });

  it('an axis row carries a sign and no slot; an edge row the reverse', () => {
    for (const action of ACTION_NAMES) {
      const row = ACTIONS[action];
      if (row.kind === 'axis') {
        expect(row.sign, `${action} is an axis with no direction`).not.toBeNull();
        expect(row.slot, `${action} is an axis holding a special slot`).toBeNull();
      } else {
        expect(row.slot, `${action} is an edge with no slot`).not.toBeNull();
        expect(row.sign, `${action} is an edge holding an axis sign`).toBeNull();
      }
    }
  });

  it('edge slots are 0-based and contiguous, so no binding points past the arsenal it indexes', () => {
    const slots = ACTION_NAMES.map((a) => ACTIONS[a].slot).filter((s): s is number => s !== null);
    expect([...slots].sort((a, b) => a - b)).toEqual(slots.map((_, i) => i));
  });

  it('SPECIAL_BINDINGS is derived from the table, never a literal beside it', () => {
    // The one-description rule (tests/one-description.test.ts) applied to a count: a hand-kept `2`
    // next to a table of two is the second description that drifts.
    expect(SPECIAL_BINDINGS).toBe(ACTION_NAMES.filter((a) => ACTIONS[a].kind === 'edge').length);
    expect(SPECIAL_BINDINGS).toBeGreaterThan(0);
  });

  it('there is no fire action, and auto-fire is why', () => {
    // docs/game.md: the base weapon fires itself unconditionally. An action named `fire` is the
    // first step back toward a game about holding a button.
    //
    // ⚠️ Scans the TABLE as well as the name list, and that is not belt-and-braces. The first
    // version checked `ACTION_NAMES` alone, and `npm run prove` reported it red on the wrong test:
    // a `fire` row added to `ACTIONS` was caught by the completeness assertion above, so this guard
    // had never once been exercised by the thing it exists for.
    for (const action of [...ACTION_NAMES, ...Object.keys(ACTIONS)]) {
      expect(action.toLowerCase(), `${action} is an action about holding a button`).not.toContain('fire');
    }
  });

  it('every action is bound, and no key is bound to two actions', () => {
    const seen = new Map<string, Action>();
    for (const action of ACTION_NAMES) {
      const codes = DEFAULT_BINDINGS[action];
      expect(codes.length, `${action} is unbound by default`).toBeGreaterThan(0);
      for (const code of codes) {
        expect(seen.get(code), `${code} is bound to both ${seen.get(code)} and ${action}`).toBeUndefined();
        seen.set(code, action);
      }
    }
  });

  it('binds physical positions, not printed letters, so a non-QWERTY layout keeps the shape', () => {
    // `KeyboardEvent.code` values start `Key`/`Arrow`/`Digit`/… — a `key` binding would be 'w'.
    for (const action of ACTION_NAMES) {
      for (const code of DEFAULT_BINDINGS[action]) {
        expect(code, `${action} looks bound to a key value rather than a code`).toMatch(/^[A-Z]/);
      }
    }
  });
});

describe('an intent is a value the model reads and the shell writes', () => {
  it('starts neutral', () => {
    const intent = makeIntent(SPECIAL_BINDINGS);
    expect(intent.along).toBe(0);
    expect(intent.across).toBe(0);
    expect(intent.specials).toEqual([0, 0]);
  });

  it('refuses a budget that would silently drop every press', () => {
    expect(() => makeIntent(0)).toThrow(RangeError);
    expect(() => makeIntent(1.5)).toThrow(RangeError);
  });

  it('clearing zeroes the presses and leaves the axes alone', () => {
    const intent = makeIntent(2);
    intent.along = 1;
    intent.specials[0] = 3;
    clearIntent(intent);
    expect(intent.specials).toEqual([0, 0]);
    // A held key is still held next step; zeroing here would stutter movement one frame on, one off.
    expect(intent.along).toBe(1);
  });
});

describe('the shell fills an intent without ever telling the model about a key', () => {
  const attach = (): { kb: FakeKeyboard; src: ReturnType<typeof combineDevices>; intent: Intent } => {
    const kb = new FakeKeyboard();
    return { kb, src: combineDevices([attachInput(kb)]), intent: makeIntent(SPECIAL_BINDINGS) };
  };

  it('resolves a held direction to an axis', () => {
    const { kb, src, intent } = attach();
    kb.down(FORWARD);
    src.contribute(intent);
    expect(intent.along).toBe(1);
  });

  it('holds the axis across steps, because a level is not an event', () => {
    const { kb, src, intent } = attach();
    kb.down(FORWARD);
    src.contribute(intent);
    src.contribute(intent);
    expect(intent.along).toBe(1);
    kb.up(FORWARD);
    src.contribute(intent);
    expect(intent.along).toBe(0);
  });

  it('reads both directions at once as nothing, not as a winner', () => {
    const { kb, src, intent } = attach();
    kb.down(FORWARD);
    kb.down(BACK);
    src.contribute(intent);
    expect(intent.along).toBe(0);
  });

  it('COUNTS two presses between steps, rather than reporting that at least one happened', () => {
    // THE case. A boolean passes every casual test and loses the second press under load.
    const { kb, src, intent } = attach();
    kb.down(SPACE);
    kb.up(SPACE);
    kb.down(SPACE);
    kb.up(SPACE);
    src.contribute(intent);
    expect(intent.specials[0]).toBe(2);
  });

  it('catches a press that both began and ended between two steps', () => {
    const { kb, src, intent } = attach();
    src.contribute(intent);
    kb.down(SPACE);
    kb.up(SPACE);
    src.contribute(intent);
    expect(intent.specials[0]).toBe(1);
  });

  it('fires a HELD special once, however many times the OS repeats the keydown', () => {
    // THE other case. `keydown` repeats; the obvious implementation empties the arsenal on a lean.
    const { kb, src, intent } = attach();
    for (let i = 0; i < 20; i++) kb.down(SPACE);
    src.contribute(intent);
    expect(intent.specials[0]).toBe(1);
  });

  it('drains, so a press is consumed exactly once', () => {
    const { kb, src, intent } = attach();
    kb.down(SPACE);
    src.contribute(intent);
    expect(intent.specials[0]).toBe(1);
    src.contribute(intent);
    expect(intent.specials[0]).toBe(0);
  });

  it('keeps the two special slots apart', () => {
    const { kb, src, intent } = attach();
    kb.down(SHIFT);
    src.contribute(intent);
    expect(intent.specials[0]).toBe(0);
    expect(intent.specials[1]).toBe(1);
  });

  it('releases everything on blur, so alt-tab does not fly the ship into a wall', () => {
    const { kb, src, intent } = attach();
    kb.down(FORWARD);
    src.contribute(intent);
    expect(intent.along).toBe(1);
    kb.blur();
    src.contribute(intent);
    expect(intent.along).toBe(0);
  });

  it('ignores a key bound to nothing', () => {
    const { kb, src, intent } = attach();
    kb.down('F13');
    src.contribute(intent);
    expect(intent.along).toBe(0);
    expect(intent.specials).toEqual([0, 0]);
  });

  it('detaches on release', () => {
    const kb = new FakeKeyboard();
    const src = combineDevices([attachInput(kb)]);
    expect(kb.size).toBeGreaterThan(0);
    src.release();
    expect(kb.size).toBe(0);
    src.release(); // twice is safe
  });

  it('THE SEAM: a binding past the budget is dropped, and the reachable ones are undisturbed', () => {
    // 0030: the arsenal is a list, the bindings are a budget, and they are different numbers. A
    // ship may own more specials than there are triggers — that is a content problem when it
    // arrives, and it must never be a crash or a corrupted slot.
    const kb = new FakeKeyboard();
    const src = combineDevices([attachInput(kb)]);
    const narrow = makeIntent(1);
    kb.down(SHIFT); // special2 → slot 1, past this intent's budget of 1
    kb.down(SPACE); // special1 → slot 0, reachable
    src.contribute(narrow);
    expect(narrow.specials).toEqual([1]);
  });
});

/**
 * THE KEYBOARD HALF OF THE BOMB THAT FIRES ITSELF.
 *
 * `docs/decisions/0055-a-press-belongs-to-one-screen.md`. The bug was reported on a gamepad, and it
 * is not a gamepad bug: `Space` activates a focused `<button>` through the DOM **and** is bound to
 * `special1`, so pressing it on the title screen starts a run and arms a bomb for the run's first
 * step. Fixing only the device it was reported on would leave the same defect under the other hand.
 */
describe('a press that a screen has already used is not delivered again', () => {
  it('THE BOMB: a press counted before a screen change is not delivered after it', () => {
    const kb = new FakeKeyboard();
    const src = combineDevices([attachInput(kb, DEFAULT_BINDINGS)]);
    const intent = makeIntent(SPECIAL_BINDINGS);
    kb.down(SPACE);
    src.spend();
    src.contribute(intent);
    expect(intent.specials[0], 'the press that started the run also threw a bomb').toBe(0);
  });

  it('and the key still works afterwards, once it has actually been pressed again', () => {
    /*
      ⚠️ **`held` must SURVIVE the spend**, which is the opposite of what a blur does. The key is
      still under a finger; releasing and pressing it is a new press and nothing less is.
    */
    const kb = new FakeKeyboard();
    const src = combineDevices([attachInput(kb, DEFAULT_BINDINGS)]);
    const intent = makeIntent(SPECIAL_BINDINGS);
    kb.down(SPACE);
    src.spend();
    src.contribute(intent);
    kb.up(SPACE);
    kb.down(SPACE);
    clearIntent(intent);
    src.contribute(intent);
    expect(intent.specials[0], 'the special was latched off for good').toBe(1);
  });

  it('does not swallow a press made after the screen changed', () => {
    const kb = new FakeKeyboard();
    const src = combineDevices([attachInput(kb, DEFAULT_BINDINGS)]);
    const intent = makeIntent(SPECIAL_BINDINGS);
    src.spend();
    kb.down(SPACE);
    src.contribute(intent);
    expect(intent.specials[0], 'spend outlived the screen change it belonged to').toBe(1);
  });
});
