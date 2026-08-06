/**
 * The shell's touch half: a thumb on glass, and an `Intent`.
 *
 * See `docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md`. This is the only file that
 * knows a finger exists. Nothing below the shell learns that one did — a run driven by a thumb and a
 * run driven by a keyboard hand `src/sim/step` the identical value.
 *
 * ── THE TWO SCHEMES, AND WHY BOTH SHIP ──────────────────────────────────────────────────────────
 *
 * `drag` is the default and the decision's answer: the finger's MOVEMENT is the ask. `stick` is the
 * familiar one: displacement from where the finger landed. Both exist because the right way to play
 * is not settled by whoever wrote the code, and both saturate at the same ceiling — a scheme is a
 * preference here, never a difficulty setting.
 *
 * ⚠️ **`stick` is not a lesser copy of `drag`.** It shares the pointer bookkeeping and differs only
 * in what it does with the position, which is the whole of the argument between them.
 *
 * ── WHAT MAKES DRAG DIFFERENT FROM A STICK, IN ONE LINE OF STATE ────────────────────────────────
 *
 * The BANK. Movement the ship could not deliver this step is kept and delivered over the following
 * ones, rather than dropped. Without it a fast flick under-delivers — the finger crosses the screen,
 * the ask saturates at 1 for a single step, and the rest of the distance is silently lost. With it,
 * a flick arrives in full, three or four steps later.
 *
 * ── ALLOCATION ──────────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ **`contribute` allocates nothing** — it runs once per fixed step and writes into captured
 * numbers. There is no vector object, no Map of pointers and no per-event closure: one pointer
 * steers and the rest are taps, so the "set of active pointers" that would need a collection never
 * exists.
 *
 * ⚠️ **`pointerdown` allocates one `DOMRect`**, because `getBoundingClientRect` is the only honest
 * way to ask where the element is and it returns a fresh object. That is once per finger landing —
 * not per step and not per frame — so it is outside what
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts. Stated rather than left for
 * a reader to discover, because "nothing here allocates" would have been the easier sentence and the
 * false one.
 */

import { SPECIAL_BINDINGS } from '../content/actions.js';
import type { ScrollAxis } from '../sim/camera.js';
import { SHIP_SPEED } from '../sim/flight.js';
import type { Intent } from '../sim/intent.js';
import type { InputSource } from './input.js';

/** How a finger is read. `docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md`. */
export type TouchScheme = 'drag' | 'stick';

/** The shipped default, and the one the decision argues for. */
export const DEFAULT_TOUCH_SCHEME: TouchScheme = 'drag';

/**
 * How far the ship travels per unit of finger travel, on screen.
 *
 * **A RATIO, and it has to be** — this was a per-step constant in pixels, and that was wrong in a
 * way nothing in the test suite could see. See the ⚠️ below, which is the reason this file exists in
 * this shape.
 *
 * `1` is strict 1:1: the ship moves exactly as far as the thumb did. `1.48` means the ship covers
 * about half again, so crossing the 100-unit dodge lane costs roughly two thirds of a screen height
 * in landscape rather than all of it.
 *
 * ⚠️ **NO LONGER A GUESS, and still not a thing to assert on.** `1.6` was played on a phone and the
 * verdict was that the ship's delay and its run-on after release both wanted about 10% less. This is
 * the first pass against that, measured rather than estimated — a fast 88px swipe, on a 844×390
 * viewport:
 *
 * | | 1.6 | 1.48 |
 * |---|---|---|
 * | ship travel after the finger lifts | 112.4px | 98.5px |
 * | how long it keeps travelling | 300ms | 267ms |
 * | total travel for the swipe | 140.8px | 130.2px |
 *
 * `reports/drag-feel-2026-08-05.md`. Nothing asserts on the value, per
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`: it is a tuning constant and a test that
 * pinned it would make the next pass fight the suite.
 *
 * ⚠️ **The delay and the run-on are ONE quantity — the bank — and this constant is the only knob
 * that moves it without touching another device.** Raising `SHIP_SPEED` would drain the bank faster
 * and leave the swipe mapping alone, which is the better knob for the same complaint; it is not used
 * here because it would also make the keyboard ship faster, and the keyboard was not what was played.
 *
 * ⚠️ **THE BUG THIS REPLACED, because it is the one worth remembering.** The original constant was
 * `DRAG_GAIN_PX = 90`, documented as "90px of travel asks for full speed" — true, and useless, since
 * a full-deflection ask buys `SHIP_SPEED` world units for ONE STEP. Crossing the lane needed 59 such
 * steps, so about 5,300px of finger travel: five metres of thumb. Every unit test passed, because
 * every one of them asserted the same wrong quantity — that N pixels produce an ask of 1. Caught by
 * driving a real swipe against the deployed page and watching where the ship was actually drawn:
 * 140px of thumb moved it 10.3px. `docs/decisions/0027-measure-the-picture-not-the-model.md`, twice
 * in one session.
 */
export const DRAG_GAIN = 1.48;

/**
 * CSS pixels from the anchor at which the stick reads full deflection.
 *
 * Same status as `DRAG_GAIN`. A thumb's comfortable arc without re-gripping, and the number that
 * decides how much of a stick's travel is usable rather than saturated.
 */
export const STICK_RADIUS_PX = 56;

/**
 * Below this many CSS pixels from the anchor, a `stick` asks for nothing.
 *
 * A finger resting perfectly still still jitters a pixel or two against the digitiser. Without a
 * floor the ship creeps while the player believes they are holding station — the touch version of
 * the gamepad drift `src/app/pad.ts` exists to kill.
 *
 * ⚠️ `drag` needs no equivalent: a jitter of ±1px sums to approximately zero over any run of steps,
 * because the ask is the DELTA rather than the position. That asymmetry is a real property of the
 * two schemes rather than an oversight, and it is one point in drag's favour.
 */
export const STICK_DEADZONE_PX = 6;

export interface TouchOptions {
  /** Which scheme this session is playing. Settable later; in memory only for now. */
  scheme?: TouchScheme;
  /**
   * Which screen axis the world's `along` runs down, per
   * `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`.
   *
   * ⚠️ Read through a function rather than captured, because it changes when the device rotates and
   * a stale value would steer the ship sideways. `docs/decisions/0031-landscape-is-the-shipped-orientation.md`
   * gates portrait today, so this is `'x'` in every reachable state — it is threaded anyway because
   * 0031 kept portrait a re-enable rather than a rewrite, and a hardcoded `'x'` here is exactly the
   * kind of thing that turns one into the other.
   */
  alongAxis?: () => ScrollAxis;
  /**
   * CSS pixels per world unit, from `src/sim/camera.ts`'s `View`.
   *
   * ⚠️ **Required to convert a finger at all**, and its absence is what made the first version of
   * this file wrong. A drag is a distance on glass; an `Intent` is a fraction of a step's travel.
   * Nothing can turn one into the other without knowing how big a world unit currently is on this
   * screen, and a constant in pixels is that conversion guessed at.
   *
   * Read through a function because it changes on every resize and rotation.
   */
  scale?: () => number;
}

/**
 * Start listening for fingers.
 *
 * `target` is an `HTMLElement` rather than an `EventTarget` because this one genuinely needs the
 * element: pointer capture and the element's own box are both required, and neither exists on the
 * bare interface.
 */
export function attachTouch(target: HTMLElement, options: TouchOptions = {}): InputSource {
  // @setup: every buffer this source will use, fixed at attach.
  const scheme = options.scheme ?? DEFAULT_TOUCH_SCHEME;
  const alongAxisOf = options.alongAxis ?? ((): ScrollAxis => 'x');
  // A reference-sized landscape phone, so a caller that does not thread the view still behaves.
  const scaleOf = options.scale ?? ((): number => 3.9);

  /** The pointer that steers, or −1 when no finger is down. The rest are taps. */
  let steering = -1;
  /** Where the steering pointer was last seen, in CSS pixels. */
  let lastX = 0;
  let lastY = 0;
  /** Where it first landed — the stick's anchor, unused by `drag`. */
  let anchorX = 0;
  let anchorY = 0;
  /** Undelivered movement, in CSS pixels. `drag` only. */
  let bankX = 0;
  let bankY = 0;

  // @setup: press counts per binding, drained by `contribute`. Sized from the action table, so a
  // third special makes a third zone with nothing here changing.
  const pressed: number[] = new Array<number>(SPECIAL_BINDINGS).fill(0);

  const onDown = (event: Event): void => {
    const e = event as PointerEvent;
    // ⚠️ A mouse is NOT a finger. Desktop already has a complete scheme and a second one that works
    // only while a button is held is a bug report, not a feature. See 0032's rejection.
    if (e.pointerType === 'mouse') return;
    const zone = tapZone(target, e);
    if (zone === -1) {
      // The steering area. A second finger here while one already steers is ignored rather than
      // stealing the drag — the common case is a palm or the other thumb resting on the glass.
      if (steering !== -1) return;
      steering = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      anchorX = e.clientX;
      anchorY = e.clientY;
      bankX = 0;
      bankY = 0;
      // Keeps the drag alive when the thumb slides off the canvas, which is a normal thing a thumb
      // does near an edge — without it the ship stops dead halfway through a dodge.
      if (target.setPointerCapture) target.setPointerCapture(e.pointerId);
      return;
    }
    // A binding past the budget is unreachable rather than a crash — 0030's rule, and the same
    // branch `src/app/input.ts` takes for a key bound past the end.
    if (zone < pressed.length) pressed[zone] = (pressed[zone] ?? 0) + 1;
  };

  const onMove = (event: Event): void => {
    const e = event as PointerEvent;
    if (e.pointerId !== steering) return;
    bankX += e.clientX - lastX;
    bankY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  // ⚠️ `pointercancel` is not optional and is not a duplicate of `pointerup`. The OS takes the
  // pointer away — a notification, a system gesture, a call — and no `pointerup` ever arrives. A
  // scheme that only listened for `up` would hold the last ask forever: 0030's alt-tab bug, reached
  // by a different road.
  const onUpOrCancel = (event: Event): void => {
    const e = event as PointerEvent;
    if (e.pointerId !== steering) return;
    steering = -1;
    // ⚠️ The bank is NOT cleared. Lifting a thumb must not throw away movement already asked for, or
    // a flick that ends with the finger leaving the glass — which is what a flick is — loses its
    // tail. It drains over the next few steps exactly as it would have.
  };

  const onBlur = (): void => {
    steering = -1;
    bankX = 0;
    bankY = 0;
  };

  target.addEventListener('pointerdown', onDown);
  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUpOrCancel);
  target.addEventListener('pointercancel', onUpOrCancel);
  target.addEventListener('blur', onBlur);

  return {
    contribute(intent: Intent): void {
      let askX = 0;
      let askY = 0;

      if (scheme === 'drag') {
        /*
          Pixels of finger → world units of ship → a fraction of one step's travel.

          `pxPerStep` is what a full-deflection ask is WORTH on this screen right now: `SHIP_SPEED`
          world units, times the current scale, divided by the gain. Spend up to one full deflection
          per axis and keep the remainder, so a flick arrives over several steps rather than being
          clipped to one.

          ⚠️ The scale is read per step, not captured: a resize or a rotation changes how big a world
          unit is, and a drag in progress must not keep spending against the old screen.
        */
        const pxPerStep = (SHIP_SPEED * scaleOf()) / DRAG_GAIN;
        if (pxPerStep > 0) {
          const spendX = clamp1(bankX / pxPerStep);
          const spendY = clamp1(bankY / pxPerStep);
          bankX -= spendX * pxPerStep;
          bankY -= spendY * pxPerStep;
          askX = spendX;
          askY = spendY;
        }
      } else if (steering !== -1) {
        const dx = lastX - anchorX;
        const dy = lastY - anchorY;
        // Radial, not per-axis: a square deadzone lets a diagonal through while refusing a shallow
        // angle of the same magnitude. Same argument as `src/app/pad.ts`.
        if (dx * dx + dy * dy >= STICK_DEADZONE_PX * STICK_DEADZONE_PX) {
          askX = clamp1(dx / STICK_RADIUS_PX);
          askY = clamp1(dy / STICK_RADIUS_PX);
        }
      }

      // Screen axes become world axes. 0023's handedness: `across` is 90° clockwise from `along`, so
      // landscape is (along = +x, across = +y) and portrait is (along = −y, across = +x).
      if (alongAxisOf() === 'x') {
        intent.along += askX;
        intent.across += askY;
      } else {
        intent.along += -askY;
        intent.across += askX;
      }

      for (let i = 0; i < pressed.length; i++) {
        if (i < intent.specials.length) intent.specials[i] = (intent.specials[i] ?? 0) + (pressed[i] ?? 0);
        pressed[i] = 0;
      }
    },
    // A tap that a screen has already acted on. The counts are asks not yet delivered; the stick's
    // own state is a finger still on the glass, and that is not this method's business.
    spend(): void {
      for (let i = 0; i < pressed.length; i++) pressed[i] = 0;
    },
    release(): void {
      target.removeEventListener('pointerdown', onDown);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUpOrCancel);
      target.removeEventListener('pointercancel', onUpOrCancel);
      target.removeEventListener('blur', onBlur);
    },
  };
}

function clamp1(n: number): number {
  return n < -1 ? -1 : n > 1 ? 1 : n;
}

/**
 * The fraction of the long edge given over to tap zones, at the leading end.
 *
 * The steering thumb takes the rest. In landscape that is the right-hand strip under a right thumb,
 * which is where the hand already is on a phone held in two hands.
 */
export const TAP_STRIP = 0.25;

/**
 * Which tap zone a pointer landed in, or −1 for the steering area.
 *
 * ⚠️ **The band count is `SPECIAL_BINDINGS`, imported rather than re-derived.** That number is
 * already computed from `ACTIONS` in `src/content/actions.ts`, and counting the edge rows a second
 * time here would be the second description of one fact that `tests/one-description.test.ts` exists
 * to catch. `docs/decisions/0030-input-is-actions-and-needs-no-new-layer.md` promises a third
 * special is one table row; the strip becoming three bands instead of two, with nothing in this file
 * touched, is what keeping that promise looks like on a phone.
 */
function tapZone(target: HTMLElement, e: PointerEvent): number {
  if (SPECIAL_BINDINGS < 1) return -1;
  const box = target.getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0) return -1;

  // The long edge is the one the strip is measured from; the bands run across the short edge.
  const horizontal = box.width >= box.height;
  const alongFraction = horizontal ? (e.clientX - box.left) / box.width : (e.clientY - box.top) / box.height;
  if (alongFraction < 1 - TAP_STRIP) return -1;

  const acrossFraction = horizontal ? (e.clientY - box.top) / box.height : (e.clientX - box.left) / box.width;
  const band = Math.floor(acrossFraction * SPECIAL_BINDINGS);
  return band < 0 ? 0 : band >= SPECIAL_BINDINGS ? SPECIAL_BINDINGS - 1 : band;
}
