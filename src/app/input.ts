/**
 * The shell's half of input: listen to a device, and fill in an `Intent`.
 *
 * See `docs/decisions/0030-input-is-actions-and-needs-no-new-layer.md`. This is the ONLY file that
 * knows a keyboard exists. Everything below the shell is handed `src/sim/intent.ts`'s value and
 * never learns what produced it, which is what lets a stage be played headlessly from a recorded
 * trace and what makes rebinding a table edit.
 *
 * ── THE ONE THING THIS FILE HAS TO GET RIGHT ────────────────────────────────────────────────────
 *
 * **Presses are counted, drained once, and never dropped.** The display and the fixed step do not
 * agree (`docs/decisions/0022-frame-rate-is-a-feature.md`), so between two steps a player can press
 * a special twice, or press and release it entirely. Both must fire. A boolean read at step time
 * loses the second press and the whole of the second case, and it loses them worst on a slow frame
 * — the moment the player is least able to afford it.
 *
 * ── AND THE ONE IT MUST NOT DO ──────────────────────────────────────────────────────────────────
 *
 * ⚠️ **Nothing here allocates after `attachInput` returns.** `sample` runs once per fixed step and
 * writes into the caller's `Intent`; it builds no object, no array and no closure. This file is not
 * on 0025's hot-file list because it is not a painter, but it runs at step rate and is written to
 * the same rule.
 */

import { ACTIONS, ACTION_NAMES, AXES, DEFAULT_BINDINGS, type Action, type Axis } from '../content/actions.js';
import type { Intent } from '../sim/intent.js';

/** What a caller gets back: a way to add to an intent, and a way to stop listening. */
export interface InputSource {
  /**
   * ADD this step's asks to `intent`, and drain the press counts.
   *
   * ⚠️ **Adds; it does not assign, and it does not clear.** There is more than one device — see
   * `src/app/devices.ts`, which zeroes the intent once and then asks every attached source to
   * contribute. A source that assigned would silently win by being called last, making the control
   * scheme a property of the order the shell happened to attach things in.
   *
   * Call exactly once per fixed step. Calling twice reports the second call's presses as zero,
   * which is correct — they have already been consumed — and is why draining lives here rather than
   * in the caller.
   */
  contribute(intent: Intent): void;
  /** Detach every listener. Safe to call twice. */
  release(): void;
}

/** The bindings a session is running with. Defaults today; a settings slice later. */
export type Bindings = Record<Action, readonly string[]>;

/**
 * Invert the binding table into the lookup a keydown needs.
 *
 * ⚠️ Built ONCE per attach, never per event. A keydown that searched the table would be a scan of
 * every action on every key repeat.
 */
function indexBindings(bindings: Bindings): Map<string, Action> {
  // @setup: runs once when input is attached, and again only if the player rebinds.
  const byCode = new Map<string, Action>();
  for (const action of ACTION_NAMES) {
    for (const code of bindings[action]) byCode.set(code, action);
  }
  return byCode;
}

/**
 * Start listening.
 *
 * `target` is passed in rather than reached for so a test can drive a stub and so two sources cannot
 * silently fight over one document — `docs/decisions/0015-the-layer-ladder.md` grants this layer the
 * DOM, it does not make a global the right way to find it.
 */
export function attachInput(target: EventTarget, bindings: Bindings = DEFAULT_BINDINGS): InputSource {
  // @setup: every buffer this source will ever use, built once at attach.
  const byCode = indexBindings(bindings);
  // @setup: held state per action, and presses awaiting a step. Fixed size, mutated in place.
  const held: Record<Action, boolean> = Object.create(null);
  // @setup: press counts, drained by `sample`.
  const pressed: Record<Action, number> = Object.create(null);
  for (const action of ACTION_NAMES) {
    held[action] = false;
    pressed[action] = 0;
  }

  const onKeyDown = (event: Event): void => {
    const code = (event as KeyboardEvent).code;
    const action = byCode.get(code);
    if (action === undefined) return;
    // ⚠️ A held key REPEATS keydown. An edge action must count the first one only, or holding the
    // special key empties the arsenal at the OS's repeat rate.
    if (held[action]) return;
    held[action] = true;
    if (ACTIONS[action].kind === 'edge') pressed[action]++;
  };

  const onKeyUp = (event: Event): void => {
    const action = byCode.get((event as KeyboardEvent).code);
    if (action !== undefined) held[action] = false;
  };

  // ⚠️ Losing focus must release everything. Without this, alt-tabbing while moving leaves the ship
  // flying into a wall with no key down to explain it — the keyup arrives at a window nobody is in.
  const onBlur = (): void => {
    for (const action of ACTION_NAMES) held[action] = false;
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);

  return {
    contribute(intent: Intent): void {
      intent.along += axis(held, 'along');
      intent.across += axis(held, 'across');
      for (const action of ACTION_NAMES) {
        const slot = ACTIONS[action].slot;
        // A binding past the end of the intent's budget is owned and unreachable — 0030 says that
        // is a content problem, and dropping it here silently is what keeps it from being a crash.
        if (slot !== null && slot < intent.specials.length) {
          intent.specials[slot] = (intent.specials[slot] ?? 0) + pressed[action];
        }
        pressed[action] = 0;
      }
    },
    release(): void {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
    },
  };
}

/**
 * Resolve one axis to −1…1.
 *
 * Both directions held is 0 rather than a winner. A player pressing left and right at once has asked
 * for nothing, and picking a side would make the answer depend on which key was pressed first —
 * state this file deliberately does not keep.
 */
function axis(held: Record<Action, boolean>, name: Axis): number {
  const row = AXES[name];
  return (held[row.plus] ? 1 : 0) - (held[row.minus] ? 1 : 0);
}
