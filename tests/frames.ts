import type { Page } from 'playwright-core';

/**
 * CANVAS SNAPSHOTS ON CONSECUTIVE ANIMATION FRAMES.
 *
 * ── WHY THIS EXISTS, AND WHY "FLAKY" WAS THE WRONG ANSWER ───────────────────────────────────────
 *
 * Two browser tests used to sample the canvas twice with a `waitForTimeout` between, and assert the
 * two differed. `tests/frame.browser.test.ts`'s *moves — the frame after is not the frame before*
 * failed once during `npm run prove`, and the first diagnosis was *flaky*. It is not.
 *
 * ⚠️ **The fault is that wall-clock time is not frames.** `npm run prove` runs the suite once per
 * probe — 172 vitest invocations — so the machine is saturated, and a headless page under that load
 * gets its `requestAnimationFrame` starved. Six hundred milliseconds elapse and the loop may have
 * advanced barely at all, so the canvas is unchanged and the assertion fails. Nothing about the game
 * is wrong; the test was measuring the wrong clock, and the load that exposes it is the project's
 * own guard harness.
 *
 * ⚠️ **The first theory was wrong too, and measuring is what killed it.** The suspicion was aliasing:
 * auto-fire has a period of nine steps (150ms) and the samples were 600ms apart, exactly four
 * periods, which on an otherwise empty opening screen would sample the same phase every time. Driven
 * sixty times, that produced **0 of 6 identical** — the renderer interpolates between steps by a
 * wall-clock fraction, so the drawn positions never quantise to the step. A plausible mechanism, and
 * not this one.
 *
 * ── WHAT THIS MEASURES INSTEAD ──────────────────────────────────────────────────────────────────
 *
 * Frames, by counting them. The browser's own `requestAnimationFrame` fires whether or not the
 * game's loop is running, so consecutive ticks bracket exactly one opportunity to draw: if the
 * simulation is advancing, the canvas differs between them, and if it is stopped, it does not. Under
 * load the ticks simply come slower, which changes how long this takes and nothing about what it
 * says.
 *
 * Measured 5/5 in both directions — all-identical while frozen, any-different while playing.
 */
export function framesInARow(page: Page, count: number): Promise<string[]> {
  return page.evaluate((n: number) => {
    return new Promise<string[]>((done) => {
      const out: string[] = [];
      const take = (): void => {
        const canvas = document.querySelector('#app canvas');
        // A prefix rather than the whole data URL: enough of the PNG to differ when the picture does,
        // and small enough that a hundred of them do not cross the CDP bridge as megabytes.
        out.push(canvas instanceof HTMLCanvasElement ? canvas.toDataURL().slice(0, 20_000) : '');
        if (out.length >= n) done(out);
        else requestAnimationFrame(take);
      };
      requestAnimationFrame(take);
    });
  }, count);
}

/** Whether the picture moved at all across a run of consecutive frames. */
export function moved(frames: readonly string[]): boolean {
  return frames.some((f) => f !== frames[0]);
}

/**
 * Let `count` animation frames go by — the wait for anything the frame loop SAMPLES.
 *
 * ── THE SAME FAULT AS ABOVE, ONE FILE OVER, AND FOUND THE SAME WAY ──────────────────────────────
 *
 * ⚠️ **`docs/decisions/0330-the-black-heart-is-driven.md`.** `tests/menu.browser.test.ts`'s `nudge`
 * pressed a gamepad button, waited **120 ms of wall clock**, released it and waited 120 ms again —
 * and *still steps a column when the layout has no answer for the axis* went red under `npm run
 * check` while passing alone in this tree and on `main`. A gamepad is read once per frame, so 120 ms
 * is *seven frames* on an idle machine and can be one or none on a saturated one: the press is
 * delivered and released between two polls, and the menu never sees it.
 *
 * ⚠️ **THIS FILE'S HEADER ALREADY SAID SO, ABOUT THE CANVAS**, and the fix is the same one — count
 * the thing the code actually responds to. `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`
 * is the rule, and *"a rerun is not evidence"* is why this was established rather than retried.
 *
 * ⚠️ **EIGHT, BECAUSE SEVEN IS WHAT 120 ms BOUGHT WHEN IT WORKED.** The same intention in the right
 * unit, one frame of slack, and under load it simply takes longer rather than failing.
 *
 * ⚠️ **NOT EVERY `waitForTimeout` IS THIS**, which is why this is a helper and not a sweep. A wait
 * for a CSS transition, a fade or an audio prewarm is in wall-clock time because the thing it waits
 * for is. Only an input the loop polls is counted in frames.
 */
export function afterFrames(page: Page, count: number): Promise<void> {
  return page.evaluate((n: number) => {
    return new Promise<void>((done) => {
      let left = n;
      const tick = (): void => {
        left -= 1;
        if (left <= 0) done();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, count);
}
