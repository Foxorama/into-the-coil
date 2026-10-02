/**
 * The title, pressed the way a player presses it — for every browser test that needs a run, the
 * settings or the music room and whose subject is not the title itself.
 *
 * `docs/decisions/0458-the-title-is-rows.md` made the title rows: a tier is chosen on a band and the
 * run begins on *Launch*, and the look, the sound, the crossing and the music room are on Settings.
 * The tests reached each of those by an index into the title's buttons; this is the one place that
 * knows how to reach them now, so the next change to the title is a change here and not in twelve
 * suites.
 *
 * ⚠️ **BY THE TABLES AND THE CONTRACT, NEVER BY A LABEL TYPED HERE.** The tier's segment is its
 * position in `DIFFICULTY_KINDS` inside the band `SETTING_ATTR` names, and the buttons are the screen
 * rows' own labels — so a renamed button or a reordered table moves the helper with it.
 */

import type { Page } from 'playwright-core';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { DIFFICULTY_KINDS, type DifficultyKind } from '../src/content/difficulty.ts';
import { SCREENS, type Screen, type SettingName } from '../src/state/screens.ts';

/** The CSS selector for a screen's shown overlay. */
export const shown = (screen: Screen): string => '.' + prefixFor(screen) + 'shown';

/** Press the button labelled `label` on `screen`, which must be the one shown. */
async function pressOn(page: Page, screen: Screen, label: string): Promise<void> {
  await page.locator(shown(screen) + ' .' + prefixFor(screen) + 'action', { hasText: label }).first().click();
}

/** Choose option `index` on the band for `setting`, on whichever screen offers it. */
export async function choose(page: Page, setting: SettingName, index: number): Promise<void> {
  const screen = (Object.keys(SCREENS) as Screen[]).find((s) => SCREENS[s].choices.some((c) => c.name === setting));
  if (screen === undefined) throw new Error(`no screen offers ${setting}`);
  await page.locator(`[${SETTING_ATTR}="${setting}"] .${prefixFor(screen)}option >> nth=${index}`).click();
}

/** On the title: choose `tier` on the band and press Launch. */
export async function launch(page: Page, tier: DifficultyKind): Promise<void> {
  await page.waitForSelector(shown('title'), { state: 'attached' });
  await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(tier));
  await pressOn(page, 'title', SCREENS.title.actions[0]!.label);
}

/** From the title: open Settings. */
export async function openSettings(page: Page): Promise<void> {
  await page.waitForSelector(shown('title'), { state: 'attached' });
  await pressOn(page, 'title', SCREENS.title.actions[1]!.label);
  await page.waitForSelector(shown('settings'), { state: 'attached' });
}

/** From the title: open Settings, then the music room. */
export async function openRoom(page: Page): Promise<void> {
  await openSettings(page);
  await pressOn(page, 'settings', SCREENS.settings.actions[0]!.label);
  await page.waitForSelector(shown('music'), { state: 'attached' });
}

/** From Settings or How to play: Back, to whichever screen opened it. */
export async function back(page: Page, from: Screen): Promise<void> {
  await pressOn(page, from, 'Back');
}
