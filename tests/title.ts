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
import { CREDIT_KINDS, type CreditKind } from '../src/content/credits.ts';
import { SCREENS, type ChoiceName, type Screen } from '../src/state/screens.ts';
import { SHELF_KINDS, SHELVES, type OwnableKind } from '../src/content/wares.ts';

/** The CSS selector for a screen's shown overlay. */
export const shown = (screen: Screen): string => '.' + prefixFor(screen) + 'shown';

/** Press the button labelled `label` on `screen`, which must be the one shown. */
async function pressOn(page: Page, screen: Screen, label: string): Promise<void> {
  await page.locator(shown(screen) + ' .' + prefixFor(screen) + 'action', { hasText: label }).first().click();
}

/**
 * Choose option `index` on the band for `setting`, on whichever screen offers it — the first in the
 * table, so the pilot is chosen on the title and not in the hangar (0521).
 */
export async function choose(page: Page, setting: ChoiceName, index: number): Promise<void> {
  const screen = (Object.keys(SCREENS) as Screen[]).find((s) => SCREENS[s].choices.some((c) => c.name === setting));
  if (screen === undefined) throw new Error(`no screen offers ${setting}`);
  const options = `[${SETTING_ATTR}="${setting}"] .${prefixFor(screen)}option`;
  // 0517: a chip draws only the option that is on, and a press steps it — so it is pressed round to it.
  if (SCREENS[screen].choices.find((c) => c.name === setting)?.faces === 'chip') {
    for (let tries = 0; tries < 8; tries++) {
      if ((await page.locator(`${options} >> nth=${index}`).getAttribute('aria-pressed')) === 'true') return;
      await page.locator(`${options}[aria-pressed="true"]`).click();
    }
    throw new Error(`the ${setting} chip never came round to option ${index}`);
  }
  await page.locator(`${options} >> nth=${index}`).click();
}

/**
 * On the title: press Fly, and be in the run — 0513.
 *
 * ⚠️ **THE FIRST FLIGHT OF A VISIT PLAYS THE INTRO, AND IT ENDS IN THE RUN.** A test whose subject is
 * not the intro skips it the way a player can, with Escape — and only once the Skip is up, because
 * Escape on the run that follows is a pause (0511). A later flight goes straight into the run.
 */
export async function fly(page: Page): Promise<void> {
  await page.waitForSelector(shown('title'), { state: 'attached' });
  await pressOn(page, 'title', SCREENS.title.actions[0]!.label);
  const where = await page.waitForFunction(
    ([hud, skip]: [string, string]) =>
      document.querySelector(hud) !== null ? 'run' : document.querySelector(skip) !== null ? 'intro' : null,
    [HUD_SHOWN, SKIP_SHOWN] as [string, string],
    { timeout: 30_000 },
  );
  if ((await where.jsonValue()) === 'intro') {
    await page.keyboard.press('Escape');
    await page.waitForSelector(HUD_SHOWN, { timeout: 30_000 });
  }
}

/** On the title: choose `tier` on the band and fly. */
export async function launch(page: Page, tier: DifficultyKind): Promise<void> {
  await page.waitForSelector(shown('title'), { state: 'attached' });
  await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(tier));
  await fly(page);
}

/**
 * On the title: choose `credits` on the continues band — 0517. A test whose subject is the run-over
 * screen and its *Continue* chooses Freeplay first, because no quarters is the default.
 */
export async function credit(page: Page, credits: CreditKind): Promise<void> {
  await page.waitForSelector(shown('title'), { state: 'attached' });
  await choose(page, 'credits', CREDIT_KINDS.indexOf(credits));
}

/** The readout, up while a run flies. */
const HUD_SHOWN = '.itc-playing-hud-shown';
/** The intro's Skip, up once the game behind it has loaded — 0412. */
const SKIP_SHOWN = '.' + prefixFor('intro') + 'skip-shown';

/** From the title: open Settings — the third of its buttons since 0521 put the hangar second. */
export async function openSettings(page: Page): Promise<void> {
  await page.waitForSelector(shown('title'), { state: 'attached' });
  await pressOn(page, 'title', SCREENS.title.actions[2]!.label);
  await page.waitForSelector(shown('settings'), { state: 'attached' });
}

/** From the title: open the hangar — 0521. */
export async function openHangar(page: Page): Promise<void> {
  await page.waitForSelector(shown('title'), { state: 'attached' });
  await pressOn(page, 'title', SCREENS.title.actions[1]!.label);
  await page.waitForSelector(shown('hangar'), { state: 'attached' });
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

/**
 * On a tabbed stand: bring the group holding `band` into view, as a player does — 0579: its sub-tab
 * pressed. By the row's groups, so a band moved to another group moves the helper with it. Nothing to do
 * on a stand that shows every group.
 */
export async function inView(page: Page, screen: Screen, band: ChoiceName): Promise<void> {
  const stand = SCREENS[screen].stand;
  if (stand === null || !stand.tabbed) return;
  const group = stand.groups.findIndex((g) => g.bands.includes(band));
  if (group < 0) throw new Error(`${band} is in no group on ${screen}`);
  await page.locator(`${shown(screen)} [${SETTING_ATTR}="section"] .${prefixFor(screen)}option >> nth=${group}`).click();
}

/**
 * On Cosmo's: put `ware` in the window, as a player does — 0542: the aisle to the shelf it is on, then the
 * ware on that shelf. By the tables, so a ware moved to another shelf moves the helper with it.
 */
export async function pickWare(page: Page, ware: OwnableKind): Promise<void> {
  const shelf = SHELF_KINDS.find((kind) => SHELVES[kind].wares.includes(ware));
  if (shelf === undefined) throw new Error(`${ware} is on no shelf`);
  const options = (name: string): string => `${shown('shop')} [${SETTING_ATTR}="${name}"] .${prefixFor('shop')}option`;
  await page.locator(`${options('aisle')} >> nth=${SHELF_KINDS.indexOf(shelf)}`).click();
  await page.locator(`${options(shelf)} >> nth=${SHELVES[shelf].wares.indexOf(ware)}`).click();
}
