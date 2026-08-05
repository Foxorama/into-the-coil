/**
 * The gamepad, on a screen with buttons on it.
 *
 * See `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`. This is the second
 * reader of the same hardware `src/app/pad.ts` reads, and the split is the decision rather than an
 * accident — the short version is below, the argument is in the file above.
 *
 * ── WHY THIS IS NOT `src/app/pad.ts`, AND NOT THE COMBINER EITHER ───────────────────────────────
 *
 * ⚠️ **Because the keyboard and the touchscreen already work here, and they work through the DOM.**
 * A focused `<button>` is activated by Space, by Enter and by a tap, by the platform's own
 * conventions — `src/app/chrome.ts` chose real elements for exactly that. Routing those devices
 * through `Intent` as well would fire every control twice: once from the browser, once from the
 * shell reading the same press back out of `src/sim/intent.ts`.
 *
 * The Gamepad API is the one device the DOM cannot see. It emits no events at all, so no `click`
 * listener can ever hear it, and it is therefore the only device that needs a second path. That is
 * the whole of what this file is: the missing device, and nothing else.
 *
 * ⚠️ **It reads NAVIGATION, never movement.** A menu wants edges — *one press moved the focus one
 * control* — where flying wants a level held down. `src/app/pad.ts` is the level reader and this is
 * the edge reader, over the same sticks, and neither is a special case of the other.
 *
 * ── ALLOCATION ──────────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ `navigator.getGamepads()` allocates, and there is no API that does not — `src/app/pad.ts` says
 * so and it is just as true here. Everything this file adds on top allocates nothing: the answer is
 * written into a caller-owned `MenuAsk` rather than returned as an object.
 *
 * ⚠️ **This never runs on the same step as `src/app/pad.ts`.** `src/app/frame.ts` samples the
 * combiner while the simulation steps and this while it does not, so the two are exclusive by
 * construction and a step still costs exactly one snapshot.
 */

import { PAD_AXIS_X, PAD_AXIS_Y, PAD_DEADZONE } from './pad.ts';

/**
 * Which buttons confirm, by standard-mapping index: the bottom face button, and Start.
 *
 * ⚠️ **The bottom face button and not "the one bound to `special1`".** A menu is not the game, and
 * `docs/decisions/0030-input-is-actions-and-needs-no-new-layer.md`'s binding table is about what the
 * SHIP does — rebinding a special must not move the button that starts a run, or a player who has
 * rebound their arsenal can find themselves unable to leave the title screen.
 */
export const MENU_CONFIRM_BUTTONS: readonly number[] = [0, 9];

/**
 * The D-pad, by standard-mapping index: up, down, left, right.
 *
 * Included alongside the stick because a D-pad is what a hand reaches for in a menu, and because it
 * is the one control on a pad that is already an edge — no deadzone, no drift, no repeat.
 */
export const MENU_DPAD_BUTTONS = { up: 12, down: 13, left: 14, right: 15 } as const;

/** What the pad asked of a menu this step. Written into by `read`; owned by the caller. */
export interface MenuAsk {
  /** Focus movement: −1 for the previous control, 1 for the next, 0 for none. An EDGE, not a level. */
  move: number;
  /** Whether a confirm button was pressed this step. An edge, for the same reason. */
  confirm: boolean;
}

/** The one allocation a caller makes. Built at boot, overwritten every step forever after. */
export function makeMenuAsk(): MenuAsk {
  // @setup: one ask, built when the shell wires the chrome.
  return { move: 0, confirm: false };
}

export interface MenuSource {
  /** Overwrite `ask` with what the pad is asking for. Call once per fixed step. */
  read(ask: MenuAsk): void;
  /** Forget what was held, so re-entering a menu does not inherit a press from the last one. */
  release(): void;
}

export interface MenuPadOptions {
  /** Injected so a test can drive a stub without a physical pad. Defaults to the real navigator. */
  pads?: () => readonly (Gamepad | null)[];
}

/**
 * Start reading pads for menu navigation.
 *
 * Nothing is attached and nothing is listened to, for the reason `src/app/pad.ts` gives: a pad that
 * has gone away simply stops appearing in the snapshot.
 */
export function attachMenuPad(options: MenuPadOptions = {}): MenuSource {
  // @setup: fixed at attach.
  const readPads =
    options.pads ??
    ((): readonly (Gamepad | null)[] =>
      typeof navigator === 'undefined' || !navigator.getGamepads ? EMPTY : navigator.getGamepads());

  /*
    @setup: the edge state. Three numbers, because every one of these has to be an edge and a
    snapshot can only ever say "down now".

    ⚠️ **`heldMove` is a DIRECTION, not a boolean.** Held as a boolean, pushing the stick from up to
    down without passing through centre would move the focus once and then stop — the second
    direction is a new ask and the player has every reason to expect it to be heard.
  */
  let heldMove = 0;
  let heldConfirm = false;

  return {
    read(ask: MenuAsk): void {
      const pads = readPads();
      let move = 0;
      let confirm = false;

      for (let p = 0; p < pads.length; p++) {
        const pad = pads[p];
        if (!pad || !pad.connected) continue;

        /*
          The stick, on either axis.

          ⚠️ **Both axes move the focus, and that is not laziness.** A column of buttons wants up and
          down; a row of them wants left and right; and the player does not know which one the
          chrome laid out — `src/app/chrome.ts` styles that with CSS and may change it in an art pass.
          A menu that only answers one axis is a menu that feels broken on whichever screen picked
          the other, and there is nothing else on these screens for the second axis to mean.

          ⚠️ **The deadzone is `src/app/pad.ts`'s, per axis rather than radial.** The radial argument
          there is about diagonals being a real ask while flying; here a diagonal has to resolve to
          ONE of two answers, so the axes are read apart and the larger deflection wins.
        */
        const x = pad.axes[PAD_AXIS_X] ?? 0;
        const y = pad.axes[PAD_AXIS_Y] ?? 0;
        const dominant = Math.abs(y) >= Math.abs(x) ? y : x;
        if (dominant <= -PAD_DEADZONE) move = -1;
        else if (dominant >= PAD_DEADZONE) move = 1;

        if (down(pad, MENU_DPAD_BUTTONS.up) || down(pad, MENU_DPAD_BUTTONS.left)) move = -1;
        else if (down(pad, MENU_DPAD_BUTTONS.down) || down(pad, MENU_DPAD_BUTTONS.right)) move = 1;

        for (let i = 0; i < MENU_CONFIRM_BUTTONS.length; i++) {
          if (down(pad, MENU_CONFIRM_BUTTONS[i] ?? -1)) confirm = true;
        }
      }

      // The edges. A direction the stick was already holding is not a new ask, and a confirm button
      // that is merely still down is not a second press — which is what stops one thumb on the A
      // button starting a run and immediately ending it on the screen behind.
      ask.move = move !== 0 && move !== heldMove ? move : 0;
      ask.confirm = confirm && !heldConfirm;
      heldMove = move;
      heldConfirm = confirm;
    },
    release(): void {
      heldMove = 0;
      heldConfirm = false;
    },
  };
}

function down(pad: Gamepad, index: number): boolean {
  const button = pad.buttons[index];
  return button !== undefined && button.pressed;
}

/** @setup: one empty snapshot, so the no-navigator path allocates nothing per step. */
const EMPTY: readonly (Gamepad | null)[] = [];
