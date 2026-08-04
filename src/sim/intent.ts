/**
 * What the ship is asked to do in one fixed step.
 *
 * See `docs/decisions/0030-input-is-actions-and-needs-no-new-layer.md`. Below the shell, input is an
 * ARGUMENT — the same rule `docs/decisions/0015-the-layer-ladder.md` applies to time and randomness.
 * The model is handed what was asked for; it never learns what was pressed, which key asked for it,
 * or whether a key was involved at all.
 *
 * ── WHY A VALUE AND NOT AN INTERFACE ────────────────────────────────────────────────────────────
 *
 * `step(state, dt, input)` where `input` is something with methods is a thing that can be ASKED a
 * question mid-step, and nothing stops two calls in one step getting different answers. A value
 * sampled once cannot do that. It is the same argument as `performance.now()` versus a `dt` handed
 * in: the difference is not style, it is whether a replay reproduces.
 *
 * ── WHY THE PRESSES ARE COUNTED AND NOT A BOOLEAN ───────────────────────────────────────────────
 *
 * The sim steps at a fixed 60Hz and the display does not
 * (`docs/decisions/0022-frame-rate-is-a-feature.md`). On a slow frame several presses land between
 * two steps, and a boolean can only report that at least one did — so the input silently becomes
 * lossy exactly when the game is already struggling. A count says how many.
 *
 * ── ALLOCATION ──────────────────────────────────────────────────────────────────────────────────
 *
 * One `Intent` is built at boot and overwritten each step. It is not on the hot-file list in
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` because nothing here runs per frame
 * except `clearIntent`, but it is built to the same rule: after `makeIntent`, nothing here allocates.
 *
 * ⚠️ The sim only ever READS an `Intent`. The shell owns the one instance and is the only writer,
 * which is what makes "sampled once per step" true in fact rather than by convention.
 */

/** What the ship is asked to do this step. Read by the model; written only by the shell. */
export interface Intent {
  /**
   * Movement along the scroll axis, −1…1. Negative is back toward the trailing edge.
   *
   * In world units per `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`, never screen ones
   * — the player asks to move up-lane, and which physical direction that is belongs to the camera.
   */
  along: number;
  /** Movement across the dodge lane, −1…1. */
  across: number;
  /**
   * Presses since the previous step, one entry per special BINDING.
   *
   * ⚠️ Indexed by binding, not by weapon kind, and its length is the binding budget rather than the
   * size of the arsenal — see 0030. A ship may own more specials than there are entries here; the
   * ones past the end are owned, saved, and currently unreachable.
   */
  readonly specials: number[];
}

/** The neutral intent: no movement asked for, nothing fired. */
export function makeIntent(bindings: number): Intent {
  if (!Number.isInteger(bindings) || bindings < 1) {
    // @setup: builds the one Intent at boot, and refuses a budget that would silently drop every
    // special press. A template literal here is a setup cost paid once, never per frame.
    throw new RangeError(`intent needs at least one special binding, got ${bindings}`);
  }
  // @setup: the only allocation in this file, and it happens once at boot.
  return { along: 0, across: 0, specials: new Array<number>(bindings).fill(0) };
}

/**
 * Zero the press counts.
 *
 * Called by whatever fills the intent, immediately before it refills them — the shell's sampler
 * today, a recorded-trace driver later. Exported rather than inlined so both do it the same way.
 *
 * Only the presses are cleared. The axes are levels rather than events — a held key is still held
 * next step — and zeroing them here would make movement stutter one frame on, one frame off.
 */
export function clearIntent(intent: Intent): void {
  for (let i = 0; i < intent.specials.length; i++) intent.specials[i] = 0;
}
