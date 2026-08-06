import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { MENU_CONFIRM_BUTTONS } from '../src/app/menu.ts';
import { SCREENS, STEPS_PER_SECOND } from '../src/state/screens.ts';
import { SPECIALS } from '../src/content/specials.ts';

/**
 * A PAD DRIVING THE REAL PAGE, AND A SCREEN THAT EXPIRES BY ITSELF.
 *
 * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`.
 *
 * ⚠️ **A browser test, because the whole subject is the seam between the loop and the DOM.** The
 * unit half (`tests/menu.test.ts`) proves the reader turns a snapshot into edges; nothing below the
 * shell can prove that those edges reach a `<button>`, because the thing in between is the frame
 * loop deciding not to step. That is exactly where the reported bug lived.
 *
 * ⚠️ **The pad is stubbed, not simulated.** The Gamepad API is poll-only and Playwright has no
 * device to give it, so `navigator.getGamepads` is replaced with one that reads a page-global the
 * test writes to. That is the same shape `src/app/pad.ts` already supports for unit tests, and it
 * exercises the real `mount`, the real loop and the real chrome.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** The page-global the stub reads. Named so a failure in the console points at this file. */
const PAD_STATE = '__itcTestPad';

async function open(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript((key: string) => {
    const state = { axes: [0, 0], pressed: [] as number[] };
    (window as unknown as Record<string, unknown>)[key] = state;
    const snapshot = (): (Gamepad | null)[] => [
      {
        id: 'itc-test-pad',
        index: 0,
        connected: true,
        mapping: 'standard',
        axes: state.axes,
        buttons: Array.from({ length: 17 }, (_, i) => ({
          pressed: state.pressed.includes(i),
          touched: state.pressed.includes(i),
          value: state.pressed.includes(i) ? 1 : 0,
        })),
        timestamp: 0,
      } as unknown as Gamepad,
    ];
    // `defineProperty` rather than assignment: `getGamepads` lives on `Navigator.prototype`, and an
    // engine that has made it read-only would swallow a plain assignment and leave the test driving
    // nothing at all — which would pass.
    Object.defineProperty(navigator, 'getGamepads', { value: snapshot, configurable: true });
  }, PAD_STATE);
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

/** Set what the stub pad is reporting. */
function setPad(page: Page, axes: readonly number[], pressed: readonly number[]): Promise<void> {
  return page.evaluate(
    ({ key, next }: { key: string; next: { axes: number[]; pressed: number[] } }) => {
      const state = (window as unknown as Record<string, { axes: number[]; pressed: number[] }>)[key]!;
      state.axes = next.axes;
      state.pressed = next.pressed;
    },
    { key: PAD_STATE, next: { axes: [...axes], pressed: [...pressed] } },
  );
}

const shown = (page: Page, selector: string): Promise<boolean> =>
  page.evaluate((s: string) => {
    const el = document.querySelector(s);
    return el instanceof HTMLElement && getComputedStyle(el).display !== 'none';
  }, selector);

describe.runIf(chromePath)('a gamepad can press a button on a screen', () => {
  it('starts a run from the title screen with nothing but the pad', async () => {
    /*
      THE REPORTED BUG, end to end: *"gamepad controls on title screens — currently not working."*

      ⚠️ **Nothing here clicks, types or taps.** The only input is a button index in a stubbed
      snapshot, which is the one device the DOM cannot deliver to a `<button>`. Before 0046 the frame
      returned before sampling any device at all on a screen that does not step, so this could not
      have been made to pass by any binding.
    */
    const page = await open();
    expect(await shown(page, '.' + prefixFor('title').slice(0, -1)), 'the title screen is not up').toBe(true);

    await setPad(page, [0, 0], [MENU_CONFIRM_BUTTONS[0]!]);
    await page.waitForSelector('.itc-playing-hud-shown', { timeout: 10_000 });
    await setPad(page, [0, 0], []);

    expect(await shown(page, '.' + prefixFor('title').slice(0, -1)), 'the title screen stayed up').toBe(false);
    await page.context().close();
  });

  it('draws a cursor on the control it would press', async () => {
    /*
      ⚠️ **`:focus-visible` is not enough and that is the whole reason the class exists.** A browser
      decides `:focus-visible` from how focus arrived, and focus moved by script is usually
      classified as not-visible — so a pad player would navigate a menu with no cursor in it, which
      is `docs/decisions/0024-the-accessibility-floor-is-settings.md`'s every-cue-has-a-visual-twin
      failing on the one device that cannot see the default.
    */
    const page = await open();
    const cursor = '.' + prefixFor('title') + 'action-cursor';
    expect(await page.locator(cursor).count(), 'no control is marked as focused').toBe(1);
    const outline = await page.evaluate((s: string) => {
      const el = document.querySelector(s);
      return el === null ? '' : getComputedStyle(el).outlineStyle;
    }, cursor);
    expect(outline, 'the cursor class draws nothing').not.toBe('none');
    await page.context().close();
  });

  it('moves the cursor without pressing anything', async () => {
    /*
      One control today, so the ring wraps to itself — which is the assertion worth making: pushing
      the stick must not ACTIVATE it. A menu where any direction is also a confirm is a menu that
      starts a run the first time somebody knocks the pad.
    */
    const page = await open();
    await setPad(page, [0, 1], []);
    await page.waitForTimeout(400);
    await setPad(page, [0, 0], []);
    await page.waitForTimeout(200);
    expect(await shown(page, '.itc-playing-hud'), 'moving the focus started a run').toBe(false);
    expect(await page.locator('.' + prefixFor('title') + 'action-cursor').count()).toBe(1);
    await page.context().close();
  });
});

describe.runIf(chromePath)('a press belongs to one screen', () => {
  it('starts a run without also throwing the bomb that button is bound to', async () => {
    /*
      THE REPORTED BUG, end to end: *"gamepad input button on title menus is the same button as the
      bomb special weapon so starting a new game automatically fires a bomb."*

      ⚠️ **THE ASSERTION IS THE NUMBER THE PLAYER READS OFF THE HUD**, not a count of edges inside a
      reader — `docs/decisions/0027-measure-the-picture-not-the-model.md`. Both readers can be
      individually correct about their own snapshots and the bomb still goes, because the defect is
      in the seam between them, and the seam is `src/app/mount.ts`. Nothing below the shell can see
      it: this is the only test that fails if the wiring is removed.

      ⚠️ **The button is HELD across the transition**, deliberately and unlike every other test on
      this page, because releasing it is what makes the bug disappear. A player pressing A to start a
      run does not let go within one sixtieth of a second.
    */
    const page = await open();
    await setPad(page, [0, 0], [MENU_CONFIRM_BUTTONS[0]!]);
    await page.waitForSelector('.itc-playing-hud-shown', { timeout: 10_000 });

    /*
      ⚠️ **WAITING FOR A STEP, NOT FOR AN ELEMENT — and the first version of this test got that
      wrong.** `.itc-playing-hud-shown` appears inside the dispatch that raises the screen, which is
      at least one animation frame BEFORE the run's first simulation step. Reading the count there
      reads it before the bomb could have been thrown, so the guard passed with the fix removed. It
      went red locally and STILL GREEN on CI, where the slower frame interval widens the window —
      `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`, and the answer it
      demands: the guard was measuring the wrong quantity, so the quantity is what changed.

      ⚠️ **The quantity is "at least one step has run", and the defect fires on the FIRST one.** So
      the wait does not have to be accurate, only longer than one frame on any machine that renders
      at all — a second is sixty steps at rate and still several on a runner dropping frames.
    */
    await page.waitForTimeout(1000);

    // Still down: the run is under way and the thumb has not moved.
    const bombs = '.itc-playing-hud-group[aria-label*="bomb"]';
    await page.waitForSelector(bombs, { timeout: 5_000 });
    const carried = await page.getAttribute(bombs, 'aria-label');
    expect(
      await shown(page, '.' + prefixFor('title').slice(0, -1)),
      'the run never started, so nothing was measured',
    ).toBe(false);
    await setPad(page, [0, 0], []);

    expect(carried, 'the readout does not say how many bombs are carried').toMatch(/\d+ bombs/);
    expect(
      Number(/(\d+) bombs/.exec(carried ?? '')?.[1]),
      'the press that started the run was read a second time and spent a bomb',
    ).toBe(SPECIALS.bomb.charges);
    await page.context().close();
  });
});

describe.runIf(chromePath)('the run-over screen gives up on its own', () => {
  it('counts down and returns to the title with no input at all', async () => {
    /*
      Asked for in play: *"this screen should have a 7 second countdown; when it expires, the player
      is returned to the title screen."*

      ⚠️ **The run is ended by FLYING INTO THINGS, not by a back door.** There is no way to reach the
      run-over screen except by losing a run, and adding one for a test would be a second route into
      the state machine — `src/app/mount.ts` is the only thing that may put a screen up, and a test
      hook beside it is the shape of thing that later turns out to be the only tested path.
    */
    const page = await open();
    await setPad(page, [0, 0], [MENU_CONFIRM_BUTTONS[0]!]);
    await page.waitForSelector('.itc-playing-hud-shown', { timeout: 10_000 });
    // Full forward on the stick: the ship flies up-lane into everything the level sends, which
    // spends its lives on contact damage without needing to aim at anything.
    await setPad(page, [1, 0], []);

    const over = '.' + prefixFor('gameOver') + 'timer';
    await page.waitForSelector('.' + prefixFor('gameOver') + 'shown', { timeout: 90_000 });
    await setPad(page, [0, 0], []);

    const seconds = SCREENS.gameOver.timeout!.steps / STEPS_PER_SECOND;
    const first = Number((await page.textContent(over)) ?? '0');
    expect(first, 'the countdown started above what the table says').toBeLessThanOrEqual(seconds);
    expect(first, 'the countdown never started').toBeGreaterThan(0);

    await page.waitForTimeout(1400);
    const later = Number((await page.textContent(over)) ?? '0');
    expect(later, 'the countdown is not counting').toBeLessThan(first);

    /*
      ⚠️ **Waited for the TITLE, not merely for the run-over screen to vanish.** A countdown that
      hid the overlay and left the game on a dead run would satisfy anything weaker, and it is the
      more likely mistake — the screen is the thing being timed, so the screen is the thing that is
      tempting to hide.
    */
    await page.waitForSelector('.' + prefixFor('title') + 'shown', { timeout: 15_000 });
    expect(await shown(page, '.' + prefixFor('gameOver').slice(0, -1)), 'the run-over screen stayed up').toBe(false);
    await page.context().close();
  });
});
