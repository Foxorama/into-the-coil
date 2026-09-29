/**
 * Past the intro, onto the title — for every browser test whose subject is not the intro.
 *
 * `docs/decisions/0411-the-chase-begins-at-the-port.md` opens the page on a sixteen-second picture
 * that hands over to the title by itself. A test that clicked the title straight after boot would
 * now wait out the whole of it, and Playwright's click would carry the wait silently. So a test
 * skips it the way a player does — one press — and waits for the title to say it is up.
 *
 * ⚠️ **Shift, because it is the key that does nothing once the title is up.** A skip moves focus to
 * the title's first control, and a key whose release activates a button (Space) or whose press does
 * (Enter) would be the one assertion `tests/intro.browser.test.ts` exists to make, made by accident
 * in every other file. That file presses the dangerous ones on purpose.
 *
 * ⚠️ **A SKIP BUILDS NO SOUND**, so the first press on the title is still the one that does, exactly as
 * it was before the intro — `src/app/mount.ts`'s unlock says why, and `tests/intro.browser.test.ts`
 * holds it. It is still a press, though: `tests/sound.browser.test.ts`'s test of a page nobody has
 * touched opens without it.
 */

import type { Page } from 'playwright-core';
import { prefixFor } from '../src/app/chrome.ts';

export async function pastIntro(page: Page): Promise<void> {
  await page.keyboard.press('Shift');
  await page.waitForSelector('.' + prefixFor('title') + 'shown', { timeout: 15_000 });
}
