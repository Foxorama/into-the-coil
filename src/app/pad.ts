/**
 * The shell's gamepad half: a stick that reports numbers, and an `Intent`.
 *
 * See `docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md`. The third device on 0030's
 * seam, and the one that turns *"input is actions"* from a claim into a demonstration — a keyboard
 * and a touchscreen could both be special cases of each other; a gamepad cannot.
 *
 * ── WHY POLLED, WHEN EVERYTHING ELSE HERE IS EVENTED ────────────────────────────────────────────
 *
 * Because the platform gives no choice: the Gamepad API has no move event, and
 * `navigator.getGamepads()` is a snapshot. That turns out to suit the fixed step exactly — the
 * snapshot is taken once per step in `contribute`, which is the same "sampled once, cannot change
 * mid-step" property `src/sim/intent.ts` argues for. A held button is read like a held key; a press
 * is an edge this file has to derive itself, because the snapshot only ever says "down now".
 *
 * ── ALLOCATION ──────────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ `navigator.getGamepads()` **allocates** — an array, and a fresh `Gamepad` per connected pad,
 * on every call. There is no API that does not. It is called once per fixed step, which is off
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`'s hot-file list (that list is the
 * frame loop, and this runs at step rate), but it is real and is written down rather than left to be
 * found. Everything this file adds on top allocates nothing.
 */

import { SPECIAL_BINDINGS } from '../content/actions.js';
import type { ScrollAxis } from '../sim/camera.js';
import type { Intent } from '../sim/intent.js';
import type { InputSource } from './input.js';

/**
 * Stick magnitude below which the pad is asking for nothing.
 *
 * ⚠️ **A resting stick does not report zero.** Every analog stick sits a little off centre and the
 * reading wanders with temperature and wear; a worn one can rest at 0.15. Without a floor the ship
 * drifts across the lane while nobody is touching anything, which reads as a physics bug and is the
 * single most common complaint about pad support that was added late.
 *
 * A starting point rather than a measurement, on `SHIP_SPEED`'s terms. 0.18 clears a typical worn
 * stick with room to spare and costs a fifth of the stick's travel.
 */
export const PAD_DEADZONE = 0.18;

/**
 * The axes and buttons this reads, by their standard-mapping index.
 *
 * The left stick and the face buttons, which is what every pad agrees on. A pad reporting a
 * non-standard mapping is left alone rather than guessed at: a wrong guess moves the ship on a
 * trigger pull, and 0030's answer to "which control does what" is a binding table, not a heuristic.
 */
export const PAD_AXIS_X = 0;
export const PAD_AXIS_Y = 1;
export const PAD_SPECIAL_BUTTONS: readonly number[] = [0, 1, 2, 3];

export interface PadOptions {
  /** See `src/app/touch.ts` — the same reason, the same thread. */
  alongAxis?: () => ScrollAxis;
  /** Injected so a test can drive a stub without a physical pad. Defaults to the real navigator. */
  pads?: () => readonly (Gamepad | null)[];
}

/**
 * Start reading pads.
 *
 * Nothing is attached and nothing is listened to: connection and disconnection do not need events,
 * because a pad that has gone away simply stops appearing in the snapshot.
 */
export function attachPad(options: PadOptions = {}): InputSource {
  // @setup: fixed at attach.
  const alongAxisOf = options.alongAxis ?? ((): ScrollAxis => 'x');
  const readPads =
    options.pads ??
    ((): readonly (Gamepad | null)[] =>
      typeof navigator === 'undefined' || !navigator.getGamepads ? EMPTY : navigator.getGamepads());

  // @setup: which special buttons were down at the previous step, so a press can be an edge.
  const wasDown: boolean[] = new Array<boolean>(SPECIAL_BINDINGS).fill(false);
  /*
    @setup: whether the next snapshot is being read only to learn what is already held.

    ⚠️ **A FLAG RATHER THAN A SNAPSHOT TAKEN IN `spend`.** `navigator.getGamepads()` allocates and
    there is no API that does not, so `spend` taking its own reading would add a second allocating
    call at every screen change. Deferring to the next `contribute` — which was going to take a
    snapshot anyway — costs nothing at all.
  */
  let spending = false;

  return {
    contribute(intent: Intent): void {
      const pads = readPads();
      let ax = 0;
      let ay = 0;

      for (let p = 0; p < pads.length; p++) {
        const pad = pads[p];
        if (!pad || !pad.connected) continue;

        const x = pad.axes[PAD_AXIS_X] ?? 0;
        const y = pad.axes[PAD_AXIS_Y] ?? 0;
        // ⚠️ RADIAL, never per-axis. A per-axis deadzone squares off the centre: push to (0.15,
        // 0.15) — a clear diagonal, magnitude 0.21 — and both axes are individually inside the
        // floor, so a diagonal is refused while a straight push of the SAME magnitude is accepted.
        // The player feels a control that works in four directions and not in eight.
        if (x * x + y * y >= PAD_DEADZONE * PAD_DEADZONE) {
          ax += x;
          ay += y;
        }

        for (let i = 0; i < wasDown.length; i++) {
          const button = pad.buttons[PAD_SPECIAL_BUTTONS[i] ?? -1];
          const down = button !== undefined && button.pressed;
          // The edge, derived: a snapshot cannot tell you a press happened, only that a button is
          // down now. Holding must fire once, which is the same rule `src/app/input.ts` enforces
          // against the OS's key repeat.
          // ⚠️ `!spending` — on the step after a screen change, the snapshot is read to LEARN what
          // is held rather than to act on it. Without it, a button held through the transition is
          // down-now and was-not-down-last-step, which is indistinguishable from a fresh press.
          if (down && !wasDown[i] && !spending && i < intent.specials.length) {
            intent.specials[i] = (intent.specials[i] ?? 0) + 1;
          }
          wasDown[i] = down;
        }
      }
      spending = false;

      // 0023's handedness, exactly as `src/app/touch.ts` applies it.
      if (alongAxisOf() === 'x') {
        intent.along += ax;
        intent.across += ay;
      } else {
        intent.along += -ay;
        intent.across += ax;
      }
    },
    /*
      ⚠️ **This is the one device where `spend` and `release` point OPPOSITE ways**, which is why the
      two are separate methods rather than one with a comment. `release` forgets what was held, so
      the next press is heard — correct when a source is being torn down. Here the button is still
      under a thumb and its press has already been used by a menu, so the answer is to remember it as
      held. `release`'s version of this bug is the reported one: a bomb on the first step of a run.
    */
    spend(): void {
      spending = true;
    },
    release(): void {
      for (let i = 0; i < wasDown.length; i++) wasDown[i] = false;
    },
  };
}

/** @setup: one empty snapshot, so the no-navigator path allocates nothing per step. */
const EMPTY: readonly (Gamepad | null)[] = [];
