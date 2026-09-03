import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { MENU_CONFIRM_BUTTONS, MENU_DPAD_BUTTONS } from '../src/app/menu.ts';
// 0214: the room's controls are the place table, and the grid is what the D-pad has to read.
import { THEMES, THEME_KINDS } from '../src/content/themes.ts';
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

/**
 * How long a press may take to raise the playing HUD, in ms.
 *
 * ── A NUMBER SET FROM A MEASUREMENT, AFTER THE OLD ONE FAILED ON CI ─────────────────────────────
 *
 * ⚠️ **`docs/decisions/0169-a-browser-budget-is-measured.md`.** Three tests on this page waited
 * `10_000` for this, and all three are the ones that go red under load — twice locally with a dev
 * server running, and once on CI, on a run with **713 s of test CPU inside 251 s of wall clock**.
 *
 * ⚠️ **THE TRANSITION TAKES 4.2 SECONDS AND NOBODY HAD MEASURED IT.** Timed on an idle machine:
 * `goto → canvas` **505 ms**, `canvas → title` **59 ms**, `press → HUD` **4199 ms**. Ten seconds is
 * 2.4× a four-second transition on a runner that is routinely three times oversubscribed, which is
 * not a budget — it is a coin toss that had come up heads for a while.
 *
 * ⚠️ **AND THE 4.2 SECONDS IS THE PREWARM, WHICH IS THE PART WORTH KNOWING.** A press finishes the
 * bake it did not have time to do at boot — `docs/decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md`
 * and 0102's *the bake happens before the press*. On a machine that boots in half a second almost none
 * of it is done, so the press pays for nearly all of it.
 *
 * ⚠️ **SO THIS IS NOT A TIMEOUT WIDENED UNTIL IT WENT QUIET**, which is what
 * `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` forbids: 30 s is seven
 * times the measured cost, it is the same shape as `open`'s 15 s over a 0.5 s boot, and if the
 * transition genuinely stops happening the test still fails in half a minute rather than hanging.
 */
const HUD_MS = 30_000;

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
    await page.waitForSelector('.itc-playing-hud-shown', { timeout: HUD_MS });
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
    await page.waitForSelector('.itc-playing-hud-shown', { timeout: HUD_MS });

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
    await page.waitForSelector('.itc-playing-hud-shown', { timeout: HUD_MS });
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

/**
 * A LEVEL BREAK IS A RESPITE.
 *
 * `docs/decisions/0063-a-level-break-is-a-respite.md`. Reported from play: *"the current pause/level
 * screen interrupts the flow."*
 *
 * ⚠️ **The half that has to be a browser test is that it does not COVER the game.** `tests/menu.test.ts`
 * holds the table — the level break steps and does not dim — and a table cannot say whether the
 * overlay paints over the canvas or swallows the thumb the player is still steering with. Both of
 * those are computed style, and both of them are how the interruption would come straight back.
 */
describe.runIf(chromePath)('the level break is a banner rather than a wall', () => {
  it('paints nothing over the scene and takes no pointer, while its control still does', async () => {
    /*
      ⚠️ **The overlay is shown by its own class rather than by clearing a level**, which would be
      three minutes of real time per assertion. What is under test is what the STYLESHEET does with
      the state — exactly as the pip test next door drives the spent class directly, and for the same
      reason `npm run prove` gave it: nothing else can see a rule that only CSS enforces.
    */
    const page = await open();
    const styles = await page.evaluate(() => {
      const root = document.querySelector('.itc-cleared');
      const action = document.querySelector('.itc-cleared-action');
      if (!(root instanceof HTMLElement) || !(action instanceof HTMLElement)) return null;
      root.classList.add('itc-cleared-shown');
      const box = getComputedStyle(root);
      const button = getComputedStyle(action);
      return {
        background: box.backgroundColor,
        events: box.pointerEvents,
        buttonEvents: button.pointerEvents,
        // Where the panel sits, as a fraction of the overlay: the middle is where the ship is.
        top: (action.getBoundingClientRect().top - root.getBoundingClientRect().top) / root.clientHeight,
      };
    });
    expect(styles, 'there is no level-break overlay to measure').not.toBeNull();
    const s = styles!;
    // Transparent in any notation a browser might report it in.
    expect(/rgba\(0, 0, 0, 0\)|transparent/.test(s.background), `the break painted ${s.background} over the game`).toBe(
      true,
    );
    expect(s.events, 'the break would swallow every drag the player makes').toBe('none');
    expect(s.buttonEvents, 'Onward cannot be pressed by the hand that wants to skip the break').toBe('auto');
    expect(s.top, 'the banner sits over the middle of the playfield, which is where the ship is').toBeLessThan(0.5);
    await page.context().close();
  });
});

/**
 * A GRID IS NOT A LIST — `docs/decisions/0214-a-grid-is-not-a-list.md`.
 *
 * Reported 2026-09-03: *"the menu itself is arranged in a nine-tile square layout order, but is
 * functionally an up/down menu on controller, not an up/down/left/right menu."*
 *
 * ⚠️ **A BROWSER TEST BECAUSE THE ANSWER IS A LAYOUT.** `tests/menu.test.ts` can prove the reader
 * reports an axis; only an engine that has actually laid nine buttons out in three columns can say
 * what *down* lands on. The chrome resolves the move against `getBoundingClientRect`, so this is the
 * one place the feature exists at all — and the wrapping row means **how many are in a row is a fact
 * about the viewport**, which nothing headless has.
 */
describe.runIf(chromePath)('the music room reads as the grid it is drawn as', () => {
  /** Which control the focus ring is on, by its label. */
  const focused = (page: Page): Promise<string> =>
    page.evaluate(
      (selector: string) => (document.querySelector(selector)?.textContent ?? '').trim(),
      '.' + prefixFor('music') + 'action-cursor',
    );

  /** Push the D-pad for a moment and let go — one edge, which is what the reader hears. */
  async function nudge(page: Page, button: number): Promise<void> {
    await setPad(page, [0, 0], [button]);
    await page.waitForTimeout(120);
    await setPad(page, [0, 0], []);
    await page.waitForTimeout(120);
  }

  it('moves DOWN a column and RIGHT along a row, rather than one step either way', async () => {
    const page = await open();
    await page.getByRole('button', { name: /^Music/ }).click();
    await page.waitForSelector('.' + prefixFor('music').slice(0, -1) + '-shown', { timeout: 15_000 });

    /*
      ⚠️ **THE EXPECTED LANDINGS ARE READ OFF THE LAYOUT, NOT TYPED.** `THEME_KINDS` is the order the
      buttons are built in and the grid is three wide, so *right* is the next kind and *down* is the
      one three along — and a place added to `src/content/themes.ts` moves both without editing this.
      A typed pair of names would be the second description of the table that
      `docs/decisions/0016-a-hub-enumerates-kinds.md` bans.
    */
    const first = THEMES[THEME_KINDS[0]!].title;
    const toTheRight = THEMES[THEME_KINDS[1]!].title;
    const below = THEMES[THEME_KINDS[3]!].title;

    const columns = await page.evaluate((selector: string) => {
      const boxes = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect());
      const top = Math.min(...boxes.map((b) => b.top));
      return boxes.filter((b) => Math.abs(b.top - top) < 4).length;
    }, '.' + prefixFor('music') + 'action');
    expect(columns, 'the room is not laid out three across, so this test is about a different grid').toBe(3);

    expect(await focused(page), 'the room does not open on its first control').toBe(first);

    await nudge(page, MENU_DPAD_BUTTONS.right);
    expect(await focused(page), 'right did not move along the row').toBe(toTheRight);

    await nudge(page, MENU_DPAD_BUTTONS.left);
    expect(await focused(page), 'left did not come back along the row').toBe(first);

    /*
      ⚠️ **THIS IS THE REPORTED BUG IN ONE ASSERTION.** Before 0214 the D-pad's `down` was the same
      ±1 as its `right`, so this landed on the control beside the first one rather than under it —
      a nine-tile square behaving as a nine-item list.
    */
    await nudge(page, MENU_DPAD_BUTTONS.down);
    expect(await focused(page), 'down moved along the row instead of into the next one').toBe(below);

    await nudge(page, MENU_DPAD_BUTTONS.up);
    expect(await focused(page), 'up did not come back to the row above').toBe(first);

    /*
      ── AND THE RING IS LENT TO THE WALK, NOT TAKEN BY IT — 0216 ─────────────────────────────────

      ⚠️ **A CURSOR THAT MOVED UNDER SOMEBODY'S HANDS WOULD BE WORSE THAN ONE THAT NEVER MOVED.**
      `activate` presses whatever the ring is on, so a jump between a press being decided and it
      landing starts a place the player did not choose. The rule is that the first deliberate move
      takes the ring back, and **the mark keeps following either way** — which is what makes lending
      it safe at all.

      ⚠️ **ON THIS PAGE RATHER THAN ITS OWN, AND THAT IS A COST DECISION STATED RATHER THAN HIDDEN.**
      A second `open()` is a second context, a second page load and a second audio prewarm — measured
      at about **94 seconds of test CPU**, which pushed two bake-heavy unit tests in
      `tests/music.test.ts` and `tests/sound.test.ts` past their 30-second timeouts. They run in 8–11 s
      alone; the suite is deliberately oversubscribed (0169 measured 713 s of CPU inside 251 s of wall
      clock) and this change had eaten the margin. **The subject is adjacent** — both halves are about
      the focus ring on this exact screen — so it rides the page that is already open.
    */
    await page.getByRole('button', { name: /^Play all/ }).click();
    const playing = '.' + prefixFor('music') + 'action-playing';
    const cursor = '.' + prefixFor('music') + 'action-cursor';
    await page.locator(playing).waitFor({ state: 'attached', timeout: 30_000 });
    expect(await focused(page), 'the ring did not go to the place Play all opened on').toBe(first);

    // One deliberate push. Where it lands is 0214's business; that it is no longer the walk's is this.
    await nudge(page, MENU_DPAD_BUTTONS.right);
    const moved = await focused(page);
    expect(moved, 'the push did not move the ring at all').not.toBe(first);

    /*
      ⚠️ **SEEK TO THE END SO THE WALK HANDS OVER**, which is the moment the ring would be taken back
      if it were ever going to be. The mark must move; the cursor must not.
    */
    await page.locator('.' + prefixFor('music') + 'now-bar').focus();
    await page.keyboard.press('End');
    await expect.poll(() => page.locator(playing).textContent()).toBe(THEMES[THEME_KINDS[1]!].title);
    expect(
      await page.locator(cursor).textContent(),
      'the walk took the focus ring back after the player had moved it',
    ).toBe(moved);
    await page.context().close();
  });

  /*
    ⚠️ **AND THE TITLE SCREEN IS A COLUMN, WHICH IS THE HALF THE OLD RULE WAS RIGHT ABOUT.** *"A menu
    that only answers one axis is a menu that feels broken on whichever screen picked the other"* —
    so a push the layout has no opinion about must still move the focus. That is the fallback, and it
    is the thing most likely to be lost by a change that only thinks about grids.
  */
  it('still steps a column when the layout has no answer for the axis', async () => {
    const page = await open();
    const opened = await page.evaluate(
      (selector: string) => (document.querySelector(selector)?.textContent ?? '').trim(),
      '.' + prefixFor('title') + 'action-cursor',
    );
    await nudge(page, MENU_DPAD_BUTTONS.right);
    const moved = await page.evaluate(
      (selector: string) => (document.querySelector(selector)?.textContent ?? '').trim(),
      '.' + prefixFor('title') + 'action-cursor',
    );
    expect(moved, 'right did nothing on a column — a whole axis of the pad is dead here').not.toBe(opened);
    await page.context().close();
  });
});
