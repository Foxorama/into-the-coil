import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { SCREENS, SCREEN_KINDS, type Screen } from '../src/state/screens.ts';

/**
 * EVERY SCREEN FITS THE SCREEN IT IS DRAWN ON.
 *
 * `docs/decisions/0049-the-chrome-is-authored-against-the-short-axis.md`, and it is a reported bug:
 * on a phone in landscape the title screen's heading was off the top of the display and the third
 * difficulty tier was off the bottom, with no way to reach either.
 *
 * ⚠️ **The assertions are in CSS PIXELS AGAINST THE VIEWPORT, which is the player's unit.**
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` asks for at least one, and here it is
 * the only kind available: a guard written against the stylesheet's own numbers — *does the panel
 * use the size the rule says* — would prove the code agrees with itself while the third button was
 * still off the bottom of a phone. What the player experiences is *can I see it and can I press it*,
 * so that is what is measured, on the sizes real devices actually have.
 *
 * ⚠️ **A browser test because layout is the subject.** Nothing below the shell computes a box; the
 * whole mechanism is a stylesheet, an engine, and a viewport.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

/**
 * The viewports, in CSS pixels, and every one of them is a device rather than a round number.
 *
 * ⚠️ **Landscape only, because that is the shipped orientation** —
 * `docs/decisions/0031-landscape-is-the-shipped-orientation.md`. In portrait the rotate gate covers
 * all of this, so a portrait row here would be measuring a screen no player is ever shown.
 *
 * ⚠️ **The list is chosen for its HEIGHTS.** Width is the axis these screens have to spare; the
 * short axis is the one that ran out, and 320 is the smallest a landscape phone gets. The aspects
 * span `src/sim/camera.ts`'s clamp at both ends and one step outside it: a 4:3 tablet gutters the
 * playfield and still draws every screen here at full size.
 */
const VIEWPORTS = [
  { what: 'the smallest landscape phone', width: 480, height: 320 },
  { what: 'a small phone in landscape', width: 667, height: 375 },
  { what: 'the phone this bug was reported from', width: 812, height: 375 },
  { what: 'a large phone in landscape', width: 915, height: 412 },
  { what: 'a tablet, below the aspect clamp', width: 1024, height: 768 },
  { what: 'a laptop', width: 1280, height: 720 },
] as const;

/** A viewport short enough that nothing could fit: a window dragged flat, or a squeezed iframe. */
const IMPOSSIBLE = { width: 640, height: 140 };

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function open(viewport: { width: number; height: number }): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  await page.waitForSelector('.' + prefixFor('title') + 'shown', { timeout: 15_000 });
  return page;
}

/** The screens that draw something. Derived from the table, never listed again — see `chrome.ts`. */
const DRAWN: Screen[] = SCREEN_KINDS.filter(
  (s) => SCREENS[s].heading.length > 0 || SCREENS[s].actions.length > 0,
);

/**
 * Put one screen up, exactly as the chrome does.
 *
 * ⚠️ **The same class `show()` toggles, and no other route.** A test hook in `src/` for reaching a
 * screen would be a second way to change screens — `tests/menu.browser.test.ts` refuses one for the
 * run-over screen and the reason is the same here. This adds the class the shell adds; if the class
 * stops being what makes a screen visible, every assertion below fails loudly rather than quietly.
 */
async function showOnly(page: Page, screen: Screen): Promise<void> {
  await page.evaluate(
    ({ names, wanted }: { names: string[]; wanted: string }) => {
      for (const name of names) {
        const root = document.querySelector('.' + name);
        if (root instanceof HTMLElement) root.classList.toggle(name + '-shown', name === wanted);
      }
    },
    {
      names: DRAWN.map((s) => prefixFor(s).slice(0, -1)),
      wanted: prefixFor(screen).slice(0, -1),
    },
  );
}

interface Box {
  what: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Every visible box inside a screen's panel, labelled by what it says. */
function boxesOf(page: Page, screen: Screen): Promise<Box[]> {
  return page.evaluate((prefix: string) => {
    const panel = document.querySelector('.' + prefix + 'panel');
    if (!(panel instanceof HTMLElement)) return [];
    const out: Box[] = [];
    // Leaves and controls: a wrapper's box is the union of its children and adds nothing, but a
    // BUTTON is a thing the player presses even though it has a span inside it.
    for (const el of panel.querySelectorAll('*')) {
      if (!(el instanceof HTMLElement)) continue;
      const leaf = el.children.length === 0 || el instanceof HTMLButtonElement;
      if (!leaf) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      out.push({
        what: (el.textContent ?? el.className).trim().slice(0, 40) || el.className,
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
      });
    }
    return out;
  }, prefixFor(screen)) as Promise<Box[]>;
}

/** Whether each control's own centre point belongs to that control — the press the player makes. */
function controlsAreHittable(page: Page, screen: Screen): Promise<string[]> {
  return page.evaluate((prefix: string) => {
    const misses: string[] = [];
    for (const control of document.querySelectorAll('.' + prefix + 'action')) {
      const r = control.getBoundingClientRect();
      const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      if (hit !== control && !control.contains(hit)) {
        misses.push((control.textContent ?? '').trim().slice(0, 40) + ' -> ' + (hit?.className ?? 'nothing'));
      }
    }
    return misses;
  }, prefixFor(screen)) as Promise<string[]>;
}

describe.runIf(chromePath)('every screen fits the screen it is drawn on', () => {
  for (const viewport of VIEWPORTS) {
    it(`draws all of every screen on ${viewport.what} (${viewport.width}x${viewport.height})`, async () => {
      /*
        THE REPORTED BUG, on the device it was reported from: *"well this is a problem — title screen
        on mobile"*, with the game's own name off the top of the display and one of the three tiers
        cut off at the bottom.

        ⚠️ **Half a pixel of tolerance and no more.** A box that is one pixel off the screen is a
        rounding artefact; the failure this exists for put a whole heading and a whole button outside
        the viewport, and every intermediate case is a bug too.
      */
      const page = await open(viewport);
      for (const screen of DRAWN) {
        await showOnly(page, screen);
        const boxes = await boxesOf(page, screen);
        expect(boxes.length, `${screen} drew nothing at all`).toBeGreaterThan(0);
        const outside = boxes.filter(
          (b) =>
            b.top < -0.5 || b.left < -0.5 || b.bottom > viewport.height + 0.5 || b.right > viewport.width + 0.5,
        );
        expect(
          outside.map((b) => `${b.what} [${Math.round(b.left)},${Math.round(b.top)} to ${Math.round(b.right)},${Math.round(b.bottom)}]`),
          `on ${screen}, these are outside a ${viewport.width}x${viewport.height} display`,
        ).toEqual([]);

        expect(await controlsAreHittable(page, screen), `on ${screen}, a control cannot be pressed where it is drawn`).toEqual(
          [],
        );
      }
      await page.context().close();
    });
  }

  it('needs no scrolling on any of them, because scrolling is the net and not the design', async () => {
    /*
      ⚠️ **The distinction the scroll container makes it possible to miss.** A screen that overflows
      but scrolls is *reachable*, and it is still wrong: a player looking at a title screen has no
      reason to suspect there is a third difficulty below the fold, and on a pad there is no gesture
      for it. So the fit above is the requirement and the net below is what happens when a viewport
      turns out to be smaller than anything in that list.
    */
    const page = await open({ width: 480, height: 320 });
    for (const screen of DRAWN) {
      await showOnly(page, screen);
      const overflow = await page.evaluate((prefix: string) => {
        const root = document.querySelector('.' + prefix.slice(0, -1));
        if (!(root instanceof HTMLElement)) return -1;
        return root.scrollHeight - root.clientHeight;
      }, prefixFor(screen));
      expect(overflow, `${screen} needs scrolling on the smallest landscape phone`).toBeLessThanOrEqual(1);
    }
    await page.context().close();
  });
});

describe.runIf(chromePath)('a screen that cannot fit stays reachable', () => {
  it('keeps its first line on the display and its last control one scroll away', async () => {
    /*
      THE NET, and the thing the reported bug actually was.

      A flex item centred by its container is centred WHEN IT OVERFLOWS TOO — half of it pushed off
      the start edge, where no scrollbar reaches. That is why the heading was missing entirely rather
      than merely cut off, and it is why the panel is centred by auto margins instead: those
      distribute positive free space only, so a panel too tall to fit falls back to the top.

      ⚠️ **Measured at a viewport no phone has**, deliberately. Every real one is in the list above
      and fits; this is the case that cannot be designed for — a window dragged flat, an iframe
      squeezed by a page that embeds the game — and the promise is only that nothing is lost.
    */
    const page = await open(IMPOSSIBLE);
    const prefix = prefixFor('title');

    /*
      ⚠️ **THE PREMISE, ASSERTED RATHER THAN ASSUMED.** Everything below is about what happens when a
      screen does not fit, so a viewport it DOES fit on tests nothing at all — and it would pass,
      quietly, forever. Type has a legibility floor (a heading never goes below 1.25rem) which is why
      this height cannot be absorbed by shrinking; if that ever stops being true, this fails here and
      says so instead of going vacuous. `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`.
    */
    const before = await page.evaluate((p: string) => {
      const root = document.querySelector('.' + p.slice(0, -1));
      const panel = document.querySelector('.' + p + 'panel');
      if (!(root instanceof HTMLElement) || !(panel instanceof HTMLElement)) return null;
      return { over: root.scrollHeight - root.clientHeight, top: panel.getBoundingClientRect().top, at: root.scrollTop };
    }, prefix);
    expect(before, 'the title screen drew no panel').not.toBeNull();
    expect(before!.over, 'this viewport is not too small after all — the case below is not being tested').toBeGreaterThan(
      4,
    );

    /*
      ⚠️ **The panel's own top edge, which is the thing centring moves.** Half of an overflowing
      panel goes off the START edge, and the part of it that is off the start edge is the part no
      scrollbar can reach — the heading, which is why the game's name was missing rather than cut off.
    */
    expect(before!.top, 'the panel is centred off the top of the display, where nothing can scroll to it').toBeGreaterThanOrEqual(
      -0.5,
    );

    /*
      ⚠️ **A WHEEL, not an assignment to scrollTop.** Setting `scrollTop` from script scrolls an
      element whose overflow is `hidden` just as happily as one that scrolls for the player — so a
      guard written that way passes with the scroll container removed, which is exactly what
      `npm run prove` caught it doing. This is the gesture a player makes.
    */
    await page.mouse.move(IMPOSSIBLE.width / 2, IMPOSSIBLE.height / 2);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(200);

    const reached = await page.evaluate((p: string) => {
      const root = document.querySelector('.' + p.slice(0, -1));
      const controls = [...document.querySelectorAll('.' + p + 'action')];
      const last = controls[controls.length - 1];
      if (!(root instanceof HTMLElement) || !(last instanceof HTMLElement)) return null;
      const r = last.getBoundingClientRect();
      const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      return { at: root.scrollTop, top: r.top, bottom: r.bottom, hit: hit === last || last.contains(hit) };
    }, prefix);
    expect(reached, 'the title screen has no controls').not.toBeNull();
    expect(reached!.at, 'a wheel over the screen scrolled nothing — the rest of it cannot be reached').toBeGreaterThan(
      before!.at,
    );
    expect(reached!.top, 'the last control is off the top once the screen is scrolled').toBeGreaterThanOrEqual(-0.5);
    expect(reached!.bottom, 'scrolling does not bring the last control onto the display').toBeLessThanOrEqual(
      IMPOSSIBLE.height + 0.5,
    );
    expect(reached!.hit, 'the last control cannot be pressed where it is drawn').toBe(true);
    await page.context().close();
  });
});
