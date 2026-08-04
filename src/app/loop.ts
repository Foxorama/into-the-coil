/**
 * The fixed-timestep clock — the one place wall-clock time is turned into simulation steps.
 *
 * See `docs/decisions/0022-frame-rate-is-a-feature.md` for the rule and
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` for the guard over it.
 *
 * The simulation steps at exactly 60Hz whatever the display does; the renderer draws at display rate
 * and interpolates between the last two steps. A sim stepped by wall-clock delta teleports bullets
 * through the player on a dropped frame, and makes difficulty a property of the machine.
 *
 * ⚠️ **`advance` MUTATES its clock and returns nothing, and that is not a style choice.** It runs
 * once per frame, and an object literal returned from it would be an allocation in the frame loop —
 * the exact thing 0022 bans. The only allocation here is `makeClock`, once, at boot.
 */

/** One simulation step, in milliseconds. 60Hz, and it is not configurable. */
export const STEP_MS = 1000 / 60;

/**
 * The most steps one frame may run before the rest of the debt is discarded.
 *
 * Without a cap, a frame that took a second asks for 60 steps, which takes longer than a frame, which
 * asks for more steps — the spiral, and the browser stops responding. Five steps is 83ms of debt: past
 * that the game is already below 12fps and catching up is not a thing that can succeed.
 *
 * ⚠️ **The excess is DISCARDED, not carried.** Carrying it forward is what guarantees the spiral, and
 * the honest failure is a game that skips time rather than one that locks up. `dropped` reports it.
 */
export const MAX_STEPS = 5;

export interface Clock {
  /** Time not yet consumed by a step, in ms. Always in [0, STEP_MS). */
  carry: number;
  /** Steps the last `advance` asked for. */
  steps: number;
  /** How far between the last two steps the renderer should draw. Always in [0, 1). */
  alpha: number;
  /** Steps the last `advance` threw away because the frame fell too far behind. */
  dropped: number;
}

/** The one allocation. Called at boot, never in the loop. */
export function makeClock(): Clock {
  // @setup: the clock is constructed once at boot and mutated in place forever after.
  return { carry: 0, steps: 0, alpha: 0, dropped: 0 };
}

/**
 * Fold `elapsedMs` of wall clock into `clock`, deciding how many fixed steps to run.
 *
 * A non-finite or negative elapsed contributes nothing rather than throwing: the first frame after a
 * tab is restored produces exactly that, and it is a normal event.
 */
export function advance(clock: Clock, elapsedMs: number): void {
  const usable = Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;
  let pending = clock.carry + usable;
  let steps = Math.floor(pending / STEP_MS);
  let dropped = 0;
  if (steps > MAX_STEPS) {
    dropped = steps - MAX_STEPS;
    steps = MAX_STEPS;
    pending -= dropped * STEP_MS;
  }
  clock.carry = pending - steps * STEP_MS;
  clock.steps = steps;
  clock.alpha = clock.carry / STEP_MS;
  clock.dropped = dropped;
}

/** What the shell drives once per frame. The sim half takes no arguments; time is already fixed. */
export interface Frame {
  /** One fixed 60Hz step. */
  step(): void;
  /** Draw, interpolating `alpha` of the way past the last step. */
  draw(alpha: number): void;
}

/**
 * Drive `frame` from the display's refresh. Returns the stop function.
 *
 * The first callback only records the timestamp — there is no previous frame to measure against, and
 * treating the page's whole load time as elapsed would spend the step cap before anything is drawn.
 */
export function runLoop(frame: Frame): () => void {
  const clock = makeClock();
  let last = 0;
  let primed = false;
  let handle = 0;
  let running = true;

  const onFrame = (now: number): void => {
    if (!running) return;
    handle = requestAnimationFrame(onFrame);
    if (!primed) {
      primed = true;
      last = now;
      return;
    }
    advance(clock, now - last);
    last = now;
    for (let i = 0; i < clock.steps; i++) frame.step();
    frame.draw(clock.alpha);
  };

  handle = requestAnimationFrame(onFrame);
  return (): void => {
    running = false;
    cancelAnimationFrame(handle);
  };
}
