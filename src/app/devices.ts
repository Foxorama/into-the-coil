/**
 * Every attached input device, composed into the one `Intent` a step consumes.
 *
 * See `docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md`. There are three devices —
 * keyboard, touch, gamepad — and a fourth is a row in a list. None of them knows the others exist,
 * and the model still never learns which one asked.
 *
 * ── WHY SUM-AND-CLAMP, AND NOT "LAST DEVICE WINS" ───────────────────────────────────────────────
 *
 * A device that assigns wins by being attached last, which makes the control scheme a property of
 * the order `mount.ts` happened to call things in — invisible, and it changes when someone tidies
 * the wiring. Summing is **order-independent**, which is the property worth having.
 *
 * It also gets the two interesting cases right for free. A device asking for nothing contributes
 * zero and cannot dilute one that is asking. Two devices pushing opposite ways cancel, which is the
 * same answer `src/app/input.ts` already gives for two opposed keys — a player asking for both
 * directions has asked for nothing, and picking a winner would require remembering which came first.
 *
 * ⚠️ The clamp is what keeps a second device from being a speed-up. Two hands on two devices both
 * pushing right is still 1, so `SHIP_SPEED` remains the ceiling however many things are plugged in.
 *
 * ── ALLOCATION ──────────────────────────────────────────────────────────────────────────────────
 *
 * Nothing here allocates after `combineDevices` returns. The source list is captured once; `sample`
 * walks it with an index rather than an iterator and writes into the caller's `Intent`.
 *
 * ── AND THE ONE PLACE A MIRRORED SCREEN IS READ BACK INTO THE WORLD ────────────────────────────
 *
 * ⚠️ **`docs/decisions/0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md`.** Played left-handed,
 * the field is shown flipped left for right, so a push to the screen's left is a push FORWARD. Every
 * device turns a push into `along` by its own arithmetic, and each would otherwise need to learn the
 * hand; here, after the sum, is the one place all of them pass through. `across` and `aim` run up and
 * down the screen, which a left-for-right mirror does not touch.
 */

import type { InputSource } from './input.js';
import { clearIntent, type Intent } from '../sim/intent.js';

function clamp1(n: number): number {
  return n < -1 ? -1 : n > 1 ? 1 : n;
}

/**
 * Compose sources into one.
 *
 * The returned source is itself an `InputSource`, but its `contribute` is the one place that
 * **zeroes** the intent first — it is the top of the tree rather than a peer, and nesting one
 * combiner inside another would zero away everything the outer one had collected. The shell attaches
 * exactly one.
 */
export function combineDevices(sources: readonly InputSource[], mirrored: () => boolean = () => false): InputSource {
  // @setup: captured once when the shell wires input, never rebuilt per step.
  const attached = sources.slice();

  return {
    contribute(intent: Intent): void {
      intent.along = 0;
      intent.across = 0;
      // 0588: and the aim, on the same terms.
      intent.aim = 0;
      clearIntent(intent);
      for (let i = 0; i < attached.length; i++) attached[i]?.contribute(intent);
      // The clamp happens after every source has added, never inside one: a device clamping its own
      // ask would make the sum depend on the order after all.
      intent.along = clamp1(intent.along);
      intent.across = clamp1(intent.across);
      intent.aim = clamp1(intent.aim);
      // 0590: the screen is flipped, so the push is — after the clamp, which is symmetric about nought.
      if (mirrored()) intent.along = -intent.along;
    },
    // Forwarded to every source, for the same reason `release` is: the shell holds one handle and
    // must not have to know which devices are behind it.
    spend(): void {
      for (let i = 0; i < attached.length; i++) attached[i]?.spend();
    },
    release(): void {
      for (let i = 0; i < attached.length; i++) attached[i]?.release();
    },
  };
}
