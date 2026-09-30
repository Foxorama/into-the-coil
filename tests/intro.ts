/**
 * Past the intro, onto the title — for every browser test whose subject is not the intro.
 *
 * `docs/decisions/0411-the-chase-begins-at-the-port.md` opens the page on a sixteen-second picture
 * that hands over to the title by itself. A test that clicked the title straight after boot would
 * now wait out the whole of it, and Playwright's click would carry the wait silently. So a test
 * skips it the way a player can at any moment — Escape — and waits for the title to say it is up.
 *
 * ⚠️ **ESCAPE, BECAUSE IT IS THE ONE PRESS THAT ASKS FOR NOTHING** — 0412. Every other press on the
 * intro is a request for sound, and the Skip button only appears once the game behind it has
 * loaded; Escape skips at once and builds no sound, so the first press on the title is still the one
 * that does, as it was before the intro existed. It is also not a key whose press or release
 * activates the title's focused button, which `tests/intro.browser.test.ts` presses on purpose.
 *
 * ⚠️ **AND IT IS THE ONE KEY THE PLATFORM DOES NOT COUNT AS THE PERSON ACTIVATING THE PAGE** — HTML
 * excludes Escape from the keydowns that grant activation. So `tests/menu.browser.test.ts`, whose
 * subject is a player with nothing but a pad, can use it and still be testing a page no hand has
 * activated. It is still a press, though: `tests/sound.browser.test.ts`'s test of a page nobody has
 * touched opens without it.
 */

import type { Page } from 'playwright-core';
import { prefixFor } from '../src/app/chrome.ts';
import { afterFrames } from './frames.ts';

/**
 * How long the game behind the intro may take to load — to the step the Skip button appears.
 *
 * ⚠️ **A BUDGET, OWNED BY 0412 AND SIZED ON 0245's TERMS — AND RE-SIZED BY 0413**, which moved the
 * load onto the workers. Measured 2026-09-29, from the canvas to the Skip: **1.19–1.23 s alone, and
 * 1.1–4.1 s while the whole suite ran** (ten loads). Three times the worst. It was 50 s against 0412's
 * 6.2 s walk; a slower load now is a prewarm back on the page's own thread, and a player who waits
 * that long for a Skip has been told the game is not ready.
 *
 * ⚠️ **RE-SIZED BY 0423, BECAUSE THE LOAD GREW AND SO DID THE SUITE BESIDE IT.** Measured 2026-09-30
 * from the canvas to the golfers, the screen that now waits for the load (0415): **2.2 s alone**, and
 * **7.5 s and 13.7 s at worst in two whole-suite runs** (76 loads, medians 3.0 and 3.9 s). Three times
 * the worst. The regression it used to double as — a prewarm back on the page's own thread — has its
 * own guard that counts what is posted to the bake pool, and does not depend on a clock.
 */
export const INTRO_READY_MS = 42_000;

/**
 * How long a page may take from `goto` to its canvas — every browser suite's first wait.
 *
 * ⚠️ **ONE NUMBER, AND IT WAS TEN LITERALS** — 0423. Every suite spelled `15_000` for the same
 * quantity, none beside a measurement. Measured 2026-09-30: **0.44 s alone, and 4.3 s and 8.2 s at
 * worst in two whole-suite runs** (76 loads, medians 0.73 and 0.90 s). Three times the worst, per
 * `docs/decisions/0245-a-budget-is-sized-under-load.md`.
 */
export const CANVAS_MS = 25_000;

export async function pastIntro(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForSelector('.' + prefixFor('title') + 'shown', { timeout: 15_000 });
  /*
    ⚠️ **AND A FEW FRAMES OF THE TITLE BEFORE ANYTHING ELSE IS PRESSED.** A screen change spends the
    readers (0055): their next read learns what is held as a baseline. A test that pressed on the next
    line could land before that read and be swallowed as held — 0412 found the music room's pad test
    doing exactly that, hidden for as long as a click froze long enough to let the steps run first.
  */
  await afterFrames(page, 4);
}
