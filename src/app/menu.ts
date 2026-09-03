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

/**
 * How far a stick must fall back before the menu will hear a new push in the SAME direction.
 *
 * ⚠️ **Below `PAD_DEADZONE`, and the gap between them is the mechanism.** Engaging at 0.18 and
 * disengaging at 0.18 is one threshold, and a stick sitting anywhere near it re-crosses it on noise
 * alone — `src/app/pad.ts` records that a worn stick rests at 0.15. The focus then walks down the
 * menu on its own while nobody is touching anything.
 *
 * Reported from play as half of *"gamepad title menu is jerky with a quick flick stick"*.
 */
export const MENU_RELEASE = 0.1;

/**
 * How hard a stick must be pushed to reverse a direction it is already holding.
 *
 * ── THE OTHER HALF OF THE JERKY FLICK, AND THE HALF THAT IS 50/50 ───────────────────────────────
 *
 * ⚠️ **A released stick does not return to centre — it springs PAST it.** Let go of a full
 * deflection and the reading crosses zero and rings out on the other side, briefly, at a few tenths.
 * The old rule heard any direction that differed from the one held, so that overshoot was a
 * perfectly good reversal and the focus jumped back. Reported exactly that way: *"the stick
 * resetting to center makes the menu move and it's jerky. happens about 50% of the time"* — 50%
 * because whether the ring clears the deadzone depends on how hard the flick was.
 *
 * ⚠️ **It must NOT be fixed by requiring a trip through the centre.** That is what this file already
 * refuses — *"a stick rolled from up to down without passing centre stays held and the second
 * direction is never heard"* — and `tests/menu.test.ts` holds it. A deliberate reversal and a spring
 * overshoot differ in **how far**, not in where they went, so the threshold is a magnitude.
 *
 * ⚠️ **A STARTING POINT, on `PAD_DEADZONE`'s terms**, not a measurement: past half travel is further
 * than any spring carries and well short of what a thumb doing it on purpose reaches. The D-pad is
 * exempt by construction — it reports full deflection and has no spring to ring.
 */
export const MENU_REVERSE = 0.6;

/** What the pad asked of a menu this step. Written into by `read`; owned by the caller. */
export interface MenuAsk {
  /** Focus movement: −1 for back or up, 1 for on or down, 0 for none. An EDGE, not a level. */
  move: number;
  /**
   * Which axis `move` came from — `docs/decisions/0214-a-grid-is-not-a-list.md`.
   *
   * ── THIS FILE THREW IT AWAY, AND A GRID IS WHERE THAT STARTED COSTING SOMETHING ────────────────
   *
   * ⚠️ **BOTH AXES WERE COLLAPSED TO ±1 ON PURPOSE, AND THE REASON HAS EXPIRED.** The note above
   * `dominant` said it: *"a column of buttons wants up and down; a row of them wants left and right;
   * and the player does not know which one the chrome laid out."* That is a true statement about a
   * screen which is a column OR a row, and every screen was one until the music room
   * ([0210](../../docs/decisions/0210-the-title-plays-the-music.md)) laid nine controls out as a
   * **grid**. On a grid the two axes mean different things, and a reader that cannot tell them apart
   * makes a nine-tile square behave like a nine-item list — reported as exactly that.
   *
   * ⚠️ **THE RESOLUTION OF A DIAGONAL DOES NOT MOVE.** `dominant` already picked one axis and threw
   * the other away; this carries which one it picked, so nothing about *what counts as a push*
   * changes. The chrome then decides what the axis MEANS, because the chrome is what laid the
   * controls out — which is the half the old note was right about.
   */
  axis: 'x' | 'y';
  /** Whether a confirm button was pressed this step. An edge, for the same reason. */
  confirm: boolean;
}

/** The one allocation a caller makes. Built at boot, overwritten every step forever after. */
export function makeMenuAsk(): MenuAsk {
  // @setup: one ask, built when the shell wires the chrome.
  return { move: 0, axis: 'y', confirm: false };
}

export interface MenuSource {
  /** Overwrite `ask` with what the pad is asking for. Call once per fixed step. */
  read(ask: MenuAsk): void;
  /**
   * A screen has just changed under this reader. Take what is held as the new baseline.
   *
   * ⚠️ **The mirror of `src/app/input.ts`'s `spend`, and it is the SYMMETRY that is the point.** This
   * reader does not run while the game is stepping, so when a screen comes back up its memory is of
   * whatever the player's hands were doing on the last menu — possibly minutes and a whole level ago.
   * Re-baselining on the transition is what makes *a press belongs to one screen* one rule with one
   * meaning on both readers, rather than two behaviours that happen to agree today.
   *
   * ⚠️ **Honest scope:** the confirm half is defensive rather than a reported bug — `heldConfirm`
   * survives the level, so a held button already reads as held. The stick half is real: a direction
   * held from a title screen is compared against one pushed after a death.
   */
  spend(): void;
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
  // 0214: the axis that direction came from, so a roll from right to down is two asks and not one.
  let heldAxis: 'x' | 'y' = 'y';
  let heldConfirm = false;
  // @setup: whether the next read is only learning what is already held. See `spend`.
  let spending = false;

  return {
    read(ask: MenuAsk): void {
      const pads = readPads();
      let move = 0;
      // 0214: which axis `move` came from. `y` until something says otherwise, because a screen that
      // is a column is what every screen was and is what the fallback below still has to serve.
      let axis: 'x' | 'y' = 'y';
      /*
        @setup-free: how HARD the strongest pad is being pushed, 0…1.

        ⚠️ **The direction alone is not enough any more**, which is the whole of the flick fix. Both
        thresholds below are magnitudes, so the reader has to carry one — and it takes the strongest
        across pads rather than the last, so a second controller resting on a sofa cannot speak over
        the one in somebody's hands.
      */
      let strength = 0;
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
        const vertical = Math.abs(y) >= Math.abs(x);
        const dominant = vertical ? y : x;
        const push = Math.abs(dominant);
        if (push > strength) strength = push;
        // 0214: the axis is carried out as well as the direction. `dominant` already chose it.
        if (dominant <= -PAD_DEADZONE) {
          move = -1;
          axis = vertical ? 'y' : 'x';
        } else if (dominant >= PAD_DEADZONE) {
          move = 1;
          axis = vertical ? 'y' : 'x';
        }

        // The D-pad is a switch, so it asks at full strength — it has no spring to ring past centre
        // and no rest position to drift from, which is what both thresholds below exist to survive.
        //
        // ⚠️ **FOUR BRANCHES SINCE 0214 AND IT WAS TWO.** `up` and `left` both meant −1, which on a
        // column is the same answer and on a grid is two different ones. The D-pad is the control a
        // hand actually reaches for in a menu, so it is the one where a grid read as a list first.
        if (down(pad, MENU_DPAD_BUTTONS.up)) {
          move = -1;
          axis = 'y';
          strength = 1;
        } else if (down(pad, MENU_DPAD_BUTTONS.down)) {
          move = 1;
          axis = 'y';
          strength = 1;
        } else if (down(pad, MENU_DPAD_BUTTONS.left)) {
          move = -1;
          axis = 'x';
          strength = 1;
        } else if (down(pad, MENU_DPAD_BUTTONS.right)) {
          move = 1;
          axis = 'x';
          strength = 1;
        }

        for (let i = 0; i < MENU_CONFIRM_BUTTONS.length; i++) {
          if (down(pad, MENU_CONFIRM_BUTTONS[i] ?? -1)) confirm = true;
        }
      }

      /*
        The edges. A direction the stick was already holding is not a new ask, and a confirm button
        that is merely still down is not a second press — which is what stops one thumb on the A
        button starting a run and immediately ending it on the screen behind.

        ⚠️ **Neutral is reached at `MENU_RELEASE`, not at `PAD_DEADZONE`.** The gap between the two
        is what stops a stick hovering near the floor from re-arming on noise and walking the focus
        down the menu on its own.
      */
      if (heldMove !== 0 && strength < MENU_RELEASE) heldMove = 0;
      /*
        ⚠️ **A reversal is heard only if it is pushed as hard as `MENU_REVERSE`**, because a released
        stick springs past centre and the old rule counted that as a deliberate change of mind.
      */
      /*
        ⚠️ **THE HELD STATE IS A DIRECTION AND AN AXIS SINCE 0214, AND ONE OF THOSE ALONE IS A LOST
        INPUT.** `right` and `down` are both `+1`; with only the number remembered, a hand that rolls
        from one to the other meets a reader that already holds `+1` and **the second push is
        swallowed entirely**. On a column that could never happen, because the two were the same ask.
      */
      const heard =
        move !== 0 && (move !== heldMove || axis !== heldAxis) && (heldMove === 0 || strength >= MENU_REVERSE);
      ask.move = heard && !spending ? move : 0;
      ask.axis = axis;
      ask.confirm = confirm && !heldConfirm && !spending;
      /*
        ⚠️ **`heldMove` is cleared by the RELEASE THRESHOLD ABOVE AND BY NOTHING ELSE.** Clearing it
        here whenever the direction reads zero is the obvious-looking line, and it silently undoes
        the whole of `MENU_RELEASE`: a stick decaying through the deadzone reports no direction while
        still a long way from centre, so the next thing it does — which is ring past centre — meets
        an already-neutral reader and is heard as a first push. That is the reported bug again, with
        the fix in place. It cost a test to find, which is what the test is for.

        ⚠️ **A REFUSED reversal leaves `heldMove` alone**, and getting this wrong loses a real input:
        recording the overshoot's direction would make the player's next genuine push that way read
        as already-held and be swallowed — a spurious move traded for a missing one.
      */
      if (heard || spending) {
        heldMove = move;
        heldAxis = axis;
      }
      heldConfirm = confirm;
      spending = false;
    },
    /*
      ⚠️ **`heldConfirm` is set, not cleared, and that is the opposite of `release`.** The button is
      still under a thumb and the screen it belonged to has gone; remembering it as held is what
      stops the next screen reading it as a press of its own. Clearing it here is the mirror of the
      bomb bug `src/app/pad.ts` describes, and it would dismiss a screen before it could be read.
    */
    spend(): void {
      spending = true;
    },
    release(): void {
      heldMove = 0;
      heldAxis = 'y';
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
