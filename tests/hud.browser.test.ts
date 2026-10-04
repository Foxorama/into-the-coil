import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { hudBar, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { launch, openSettings, shown as shownScreen } from './title.ts';
import { SCREENS } from '../src/state/screens.ts';
import { PICKUPS, PICKUP_CYCLE_STEPS, PICKUP_KINDS, faceOf } from '../src/content/pickups.ts';
import { MAX_SHIELDS } from '../src/content/ships.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { triggerRadius, triggerX, triggerY } from '../src/app/touch.ts';
import { SIDES } from '../src/content/specials.ts';

/**
 * WHAT THE PLAYER CAN SEE ABOUT THEIR OWN RUN.
 *
 * `docs/decisions/0045-the-player-can-see-what-they-are-carrying.md`. Both halves came from play:
 * *"in game we need a life and shield tracker icons so the player has a clue"*, and *"on the intro
 * starting screen we need a quick user key of what each upgrade does."*
 *
 * ⚠️ **A browser test, because the subject is DOM.** The readout is real elements over the canvas —
 * `src/app/chrome.ts` has the reason — so a unit test could only check the numbers going in, which is
 * the half that was never in doubt.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

/*
  ⚠️ **105 s, AND THE MEASUREMENT IS BESIDE IT BECAUSE 0245 SAYS IT HAS TO BE.** It was 60 s, sized
  alone, and the pips test timed out past it in a whole-suite run while passing in 17 s by itself.
  Every test here that presses pays one music bake — see the pips test — so the file's cost is the
  press, and the worst press is the pips test's three: under `npx vitest run` on 2026-09-27, three
  runs with a log showing nothing else on the box took 17.8, 19.5 and 21.5 s, and two runs whose box
  was not logged took 31.6 and 33.7 s. Three times 33.7. The first death has its own budget below.
  Two further runs that shared the box with another session's `npm run prove` were thrown out, not
  counted: a budget is sized against this suite's load, not a neighbour's
  — `docs/decisions/0245-a-budget-is-sized-under-load.md`.
*/
vi.setConfig({ testTimeout: 105_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

// ⚠️ **The launch is a promise shared by every caller**, because the pips test opens its pages at
// once: `browser ??= await launch()` checks before it awaits, and three callers would launch three.
let launching: Promise<Browser> | undefined;
afterAll(async () => {
  await (await launching)?.close();
});

async function open(hasTouch = false): Promise<Page> {
  launching ??= launchChromium({ headless: true });
  const browser = await launching;
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    // ⚠️ The tap strip is drawn on a CAPABILITY, not on a guess about what the player is holding —
    // `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md`. This is the capability.
    hasTouch,
  });
  /*
    ⚠️ **THE TEST'S BUDGET IS THE ONLY CLOCK, SO PLAYWRIGHT'S ARE OFF.** A press bakes the rest of the
    music prewarm inside the click, so `page.click` carried Playwright's own thirty seconds — a
    budget nobody sized, under the one this file sizes — and it was that one that failed a whole-suite
    run on 2026-09-27, 30 s into a press. A second clock can only fire first and name the wrong cost.
  */
  context.setDefaultTimeout(0);
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  return page;
}

const HUD = '.itc-playing-hud';
const shown = (page: Page, selector: string): Promise<boolean> =>
  page.evaluate((s: string) => {
    const el = document.querySelector(s);
    return el instanceof HTMLElement && getComputedStyle(el).display !== 'none';
  }, selector);

// ⚠️ How to play's since 0458, and it was the title's: the key moved behind a tab, and grew `how`.
describe.runIf(chromePath)('How to play says what a pickup is for', () => {
  it('lists every pickup, with its name, what it does and how it is taken', async () => {
    /*
      ⚠️ **Driven from `PICKUP_KINDS` rather than from a list typed here**, so a pickup added to the
      table fails this until it appears in the key. That is the whole reason the key is built by
      walking the hub: a legend maintained by hand goes stale the first time somebody is in a hurry.
    */
    const page = await open();
    const text = (await page.textContent('.' + prefixFor('guide') + 'key')) ?? '';
    // 0458: and how — the half the key never had: a pickup turns, and the face showing is the one taken.
    for (const kind of PICKUP_KINDS) expect(text, `the key does not say how ${kind} is taken`).toContain(PICKUPS[kind].how);
    /*
      ⚠️ **EVERY FACE, since 0233.** A cycling pickup is several offers wearing one silhouette in
      turn, and the key names each — the gun rather than the pickup — so a player knows the shape
      is good before they cross a lane for it. `faceOf` is the row's own answer for each face.
    */
    for (const kind of PICKUP_KINDS) {
      PICKUPS[kind].faces.forEach((_sprite, face) => {
        const said = faceOf(kind, face);
        expect(text, `the key does not name face ${face} of ${kind}`).toContain(said.label);
        expect(text, `the key does not say what face ${face} of ${kind} does`).toContain(said.hint);
      });
    }
    await page.context().close();
  });

  it('shows the real baked sprite, not a drawing of one', async () => {
    /*
      ⚠️ **The icons are canvases the art pipeline produced.** A hand-written SVG in the chrome would
      be a second description of every silhouette, and the day an art pass changed one the key would
      go on showing the old shape — `src/content/sprites.ts` records what a second description of the
      sprite table already cost this project once.

      Asserted as *these are canvases with pixels in them*, which is what distinguishes a baked sprite
      from a glyph or an empty box.
    */
    const page = await open();
    const icons = await page.evaluate((selector: string) => {
      return [...document.querySelectorAll(selector)].map((el) => {
        if (!(el instanceof HTMLCanvasElement)) return { canvas: false, inked: 0 };
        const ctx = el.getContext('2d');
        if (ctx === null || el.width === 0) return { canvas: true, inked: 0 };
        const data = ctx.getImageData(0, 0, el.width, el.height).data;
        let inked = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) inked++;
        return { canvas: true, inked };
      });
    }, '.' + prefixFor('guide') + 'key-icon');

    // One icon per FACE, since 0233 — a cycling pickup shows each of its glyphs.
    const faces = PICKUP_KINDS.reduce((sum, kind) => sum + PICKUPS[kind].faces.length, 0);
    expect(icons.length, 'the key has no icons at all').toBe(faces);
    for (const icon of icons) {
      expect(icon.canvas, 'a key icon is not a baked sprite').toBe(true);
      expect(icon.inked, 'a key icon was baked empty').toBeGreaterThan(0);
    }
    await page.context().close();
  });

  it('0432 — one row per pickup, turning through its faces at the field’s own pace, one face up at a time', async () => {
    /*
      *"Condense them to match the pickups in game, but cycle through like they do in game."* Three
      properties, each a way the key could lie: a row per pickup rather than per face; every face of a
      row given its own share of the turn, so none is shown twice and none never; and the turn is the
      field's (`PICKUP_CYCLE_STEPS`), so the key teaches the pace the player will meet.
    */
    /*
      ⚠️ **HOW MUCH FACE IS UP, NOT HOW MANY FACES ARE — and the count was an intermittent guard.** It
      counted faces whose visibility was `visible`, and for the few percent of every turn the outgoing
      face fades out under the incoming one both are visible: CI caught it mid-crossfade, under a probe
      that had nothing to do with the key, and reported *2 faces at once*. The property is that the row
      shows one face's worth: the opacities sum to one at every moment — the two halves of a crossfade
      are complementary, since both run linear over the same window — and a row whose turns never
      started, or whose faces all run on one clock, sums to its face count or to nothing. 0044.
    */
    const page = await open();
    // On the screen, because a hidden screen runs no animation and every face would read as up.
    await openSettings(page);
    await page.locator('.' + prefixFor('settings') + 'tab', { hasText: SCREENS.guide.heading }).click();
    await page.waitForSelector(shownScreen('guide'), { state: 'attached' });
    const rows = await page.evaluate((prefix: string) =>
      [...document.querySelectorAll('.' + prefix + 'key-row')].map((row) => {
        const faces = [...row.querySelectorAll<HTMLElement>('.' + prefix + 'key-icon')];
        const shown = faces.reduce((sum, f) => sum + parseFloat(getComputedStyle(f).opacity), 0);
        return {
          faces: faces.length,
          shown,
          delays: faces.map((f) => getComputedStyle(f).animationDelay),
          duration: faces.map((f) => getComputedStyle(f).animationDuration)[0] ?? '',
        };
      }),
    prefixFor('guide'));
    expect(rows.length, 'the key is not one row per pickup').toBe(PICKUP_KINDS.length);
    rows.forEach((row, i) => {
      const kind = PICKUP_KINDS[i]!;
      expect(row.faces, `${kind}'s row does not carry every face`).toBe(PICKUPS[kind].faces.length);
      expect(row.shown, `${kind}'s row shows ${row.shown.toFixed(2)} faces' worth at once`).toBeCloseTo(1, 1);
      if (row.faces < 2) return;
      expect(new Set(row.delays).size, `two of ${kind}'s faces share a turn, so one is never shown`).toBe(row.faces);
      expect(parseFloat(row.duration), `${kind} turns at a pace the field does not`).toBeCloseTo(
        (row.faces * PICKUP_CYCLE_STEPS) / 60,
        5,
      );
    });
    await page.context().close();
  });

  it('and the enemies are deliberately not in it', async () => {
    /*
      Asked for, and the asymmetry is the interesting part: *"we don't need a key for the enemies, but
      knowing that the upgrades are good pickups is important."* An enemy announces itself by shooting
      at you; a pickup is a small shape in a lane that announces nothing, and a player who does not
      already know it is good will not cross the lane to find out.

      Held so that a future well-meaning addition has to argue with this rather than slip past it.
    */
    const page = await open();
    const text = (await page.textContent('.' + prefixFor('guide') + 'key')) ?? '';
    for (const enemy of ['drifter', 'lancer', 'weaver', 'turret', 'charger', 'warden']) {
      expect(text.toLowerCase(), `the key explains the ${enemy}, which play asked it not to`).not.toContain(enemy);
    }
    await page.context().close();
  });
});

/**
 * A TRIGGER IS A PLACE ON THE GLASS, AND THE PLACE IS A BUTTON.
 *
 * `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md`. Reported from play: *"how do you fire
 * bombs on mobile? I can do one and then can't fire any more."* Then
 * `docs/decisions/0358-a-trigger-is-a-button.md`: *"on mobile add a bomb button"*, and the strip
 * that was the leading quarter of the glass became a disc under the thumb.
 *
 * ⚠️ **The half that has to be a browser test is that the button is DRAWN WHERE THE TAP IS HEARD.**
 * `tests/touch.test.ts` holds the hit test and can hold nothing about pixels; a button whose picture
 * and whose hit region disagree is a player pressing what they can see and something else happening,
 * which is `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` with the sign
 * reversed.
 */
describe.runIf(chromePath)('the trigger button says where the bomb is', () => {
  const TRIGGER = '.itc-playing-trigger';

  it('is not drawn on a device with nothing to tap it with', async () => {
    const page = await open(false);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    expect(await shown(page, TRIGGER), 'a desktop was shown a place to put a finger').toBe(false);
    await page.context().close();
  });

  it('is drawn on a touch device, once a run is running and never before it', async () => {
    const page = await open(true);
    expect(await shown(page, TRIGGER), 'the button was up before there was a run to fire in').toBe(false);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    expect(await shown(page, TRIGGER), 'a phone was shown no place to press').toBe(true);
    await page.context().close();
  });

  it('draws one button per owned trigger, where the hit test listens, in pixels of the canvas', async () => {
    /*
      ⚠️ **THE ONE THAT MATTERS, and it is measured in pixels against the canvas.** The reported bug
      was a strip split into the binding BUDGET rather than into what the ship owns, so half of it was
      bound to a slot the shell answers with silence — a piece of the screen that swallows taps and
      is drawn nowhere. This asserts the picture IS the hit region: the disc's centre and its size on
      the canvas are what the touch source's own arithmetic says for the canvas's own box.

      ⚠️ **Against the functions and not against the constants**, because the CSS is the constants
      interpolated and a test that read the same constants back would prove the code agrees with
      itself (0027). The functions are the other reader — the hit test's.
    */
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    const geometry = await page.evaluate(() => {
      const canvas = document.querySelector('#app canvas');
      const trigger = document.querySelector('.itc-playing-trigger');
      const buttons = [...document.querySelectorAll('.itc-playing-trigger-button')];
      if (!(canvas instanceof HTMLElement) || !(trigger instanceof HTMLElement)) return null;
      const c = canvas.getBoundingClientRect();
      return {
        canvas: { width: c.width, height: c.height },
        buttons: buttons.map((b) => {
          const r = b.getBoundingClientRect();
          return { cx: r.left + r.width / 2 - c.left, cy: r.top + r.height / 2 - c.top, width: r.width, height: r.height };
        }),
        // Not a control, and it must never become one: the canvas underneath is what hears the tap.
        events: getComputedStyle(trigger).pointerEvents,
      };
    });
    expect(geometry, 'there is no button to measure').not.toBeNull();
    const g = geometry!;
    // One button per trigger since 0376 — the gun's and the tubes' — each where its own band listens.
    expect(g.buttons.length, 'the buttons are not one per owned trigger').toBe(SIDES.length);
    expect(g.events, 'the button would swallow the tap it exists to advertise').toBe('none');
    const r = triggerRadius(g.canvas.width, g.canvas.height);
    const ys = g.buttons.map((button) => button.cy);
    for (let band = 0; band < SIDES.length; band++) {
      const y = triggerY(g.canvas.width, g.canvas.height, band);
      const b = g.buttons.find((button) => Math.abs(button.cy - y) < 2);
      expect(b, `no button is drawn where band ${band} is heard, across the glass (buttons at ${ys.join(', ')})`).toBeDefined();
      expect(Math.abs(b!.cx - triggerX(g.canvas.width, g.canvas.height)), 'the button is not drawn where the tap is heard, along the glass').toBeLessThan(2);
      expect(Math.abs(b!.width - 2 * r), 'the disc is not the size the hit test listens on').toBeLessThan(2);
      expect(Math.abs(b!.height - 2 * r), 'the disc is not round').toBeLessThan(2);
      // And it is a thumb's size in the player's own pixels, not a sliver: 0358's claim, as the player has it.
      expect(b!.width, 'the button is smaller than a fingertip').toBeGreaterThan(44);
    }
    await page.context().close();
  });

  it('shows the real baked sprite of the special the button fires, and how many are left', async () => {
    // The same rule as the title screen's key: the real art, never a drawing of it. A glyph here
    // would be a second description of the bomb's silhouette.
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    const band = await page.evaluate(() => {
      const el = document.querySelector('.itc-playing-trigger-button');
      const icon = document.querySelector('.itc-playing-trigger-icon');
      let inked = 0;
      if (icon instanceof HTMLCanvasElement) {
        const ctx = icon.getContext('2d');
        const data = ctx?.getImageData(0, 0, icon.width, icon.height).data;
        if (data) for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) inked++;
      }
      return { text: el?.textContent ?? '', isCanvas: icon instanceof HTMLCanvasElement, inked };
    });
    expect(band.isCanvas, 'the band draws a glyph rather than the baked sprite').toBe(true);
    expect(band.inked, 'the band’s icon is blank').toBeGreaterThan(0);
    expect(band.text, `the band does not say how many are left: ${band.text}`).toMatch(/\d/);
    await page.context().close();
  });
});

describe.runIf(chromePath)('the readout and the boss bar share the top of the screen', () => {
  it('THE REPORTED ONE: the bar never lies over the readout, on a phone or a monitor', async () => {
    /*
      Played on a phone: *"the boss bars overlap the bomb numbers on mobile."* The bar stood at 31% of
      the width and the readout is about fourteen of its own em, which on a phone is 2.4vw — a third
      of the width. Asserted in pixels on the glass, at the widest readout the game can show: every
      shield pip, two-digit counts and the retro face, whose monospace is the widest of the two.

      The bar is raised by its class rather than by flying to a boss: what is in question is where the
      two are laid out, and a boss fight is two minutes of a browser test that says nothing more.

      ⚠️ **ONE PAGE, RESIZED, rather than a page per size.** Four page loads each waiting on a run to
      start took twenty seconds alone and timed out under `npm run check`; the layout is CSS, and a
      resize reflows it exactly as a different phone would.

      ⚠️ **A PAGE WITHOUT TOUCH, SINCE 0437, AND THAT IS WHAT KEEPS THIS THE WIDEST READOUT.** A touch
      screen's readout now drops its two stack counts, which its discs already say, so it is narrower
      than a mouse's — and measured on it, a bar put back at 31% cleared the readout and this guard went
      green over the exact break it is named for (0360's probe said so). The readout with every group in
      it, at a phone's width, is the one any bar has to clear; a narrower one clears by more.
    */
    const page = await open(false);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForSelector('.itc-playing-hud-shown');
    for (const [width, height] of [
      [667, 375],
      [844, 390],
      [915, 412],
      [1280, 720],
    ] as const) {
      await page.setViewportSize({ width, height });
      // Raised after the resize, because a resize repaints the chrome and takes a forced class down.
      const laid = await page.evaluate((shields: number) => {
        const hud = document.querySelector<HTMLElement>('.itc-playing-hud')!;
        const bar = document.querySelector<HTMLElement>('.itc-playing-boss')!;
        hud.classList.add('itc-playing-face-pixel');
        bar.classList.add('itc-playing-boss-shown');
        const shield = hud.querySelector<HTMLElement>('[role="img"]')!;
        const pips = shield.querySelectorAll<HTMLElement>('.itc-playing-hud-pip');
        for (const pip of pips) pip.style.display = '';
        for (let i = pips.length; i < shields; i++) shield.appendChild(pips[0]!.cloneNode(true));
        for (const count of hud.querySelectorAll('.itc-playing-hud-group > span')) count.textContent = '×99';
        const readout = hud.getBoundingClientRect();
        const box = bar.getBoundingClientRect();
        return { readoutRight: readout.right, barLeft: box.left, barRight: box.right, barWidth: box.width };
      }, MAX_SHIELDS);
      const at = `${width}×${height}`;
      expect(laid.barWidth, `at ${at} the bar was laid out with no width at all`).toBeGreaterThan(0);
      expect(
        laid.barLeft,
        `at ${at} the bar starts at ${laid.barLeft.toFixed(0)} px and the readout runs to ${laid.readoutRight.toFixed(0)} px`,
      ).toBeGreaterThanOrEqual(laid.readoutRight);
      expect(laid.barRight, `at ${at} the bar runs off the screen`).toBeLessThanOrEqual(width);
    }
    await page.context().close();
  });

  it('0428 — THE ASK: the score is top right, clear of the bar and the readout, and says its number', async () => {
    /*
      *"points counter top right."* In pixels on the glass, at every size the bar is held at, with the
      bar raised and the score at the most digits the pad allows — so the three things in the top row
      are measured at their widest together, which is the only arrangement in which they could meet.
    */
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForSelector('.itc-playing-score-shown');
    const said = await page.getAttribute('.itc-playing-score', 'aria-label');
    expect(said, 'the score does not say its number in words').toMatch(/^Score 0, times 1$/);
    for (const [width, height] of [
      [667, 375],
      [844, 390],
      [915, 412],
      [1280, 720],
    ] as const) {
      await page.setViewportSize({ width, height });
      const laid = await page.evaluate(() => {
        const hud = document.querySelector<HTMLElement>('.itc-playing-hud')!;
        const bar = document.querySelector<HTMLElement>('.itc-playing-boss')!;
        const score = document.querySelector<HTMLElement>('.itc-playing-score')!;
        hud.classList.add('itc-playing-face-pixel');
        score.classList.add('itc-playing-face-pixel');
        bar.classList.add('itc-playing-boss-shown');
        score.querySelector<HTMLElement>('.itc-playing-score-value')!.style.setProperty('--itc-playing-points', '99999999');
        const r = score.getBoundingClientRect();
        return {
          readoutRight: hud.getBoundingClientRect().right,
          barRight: bar.getBoundingClientRect().right,
          left: r.left,
          right: r.right,
          top: r.top,
          width: r.width,
        };
      });
      const at = `${width}×${height}`;
      expect(laid.width, `at ${at} the score was laid out with no width`).toBeGreaterThan(0);
      expect(laid.left, `at ${at} the score starts at ${laid.left.toFixed(0)} px, over the bar that ends at ${laid.barRight.toFixed(0)} px`).toBeGreaterThanOrEqual(laid.barRight);
      expect(laid.left, `at ${at} the score runs over the readout`).toBeGreaterThanOrEqual(laid.readoutRight);
      expect(laid.right, `at ${at} the score runs off the screen`).toBeLessThanOrEqual(width);
      // Top right, in the player's units: its right edge in the last twentieth of the width, at the top.
      expect(laid.right, `at ${at} the score is not at the right`).toBeGreaterThan(width * 0.95);
      expect(laid.top, `at ${at} the score is not at the top`).toBeLessThan(height * 0.05);
    }
    await page.context().close();
  });

  it('0439 — THE ASK: the readout, the boss bar and the score sit on one line, at one height', async () => {
    /*
      `docs/decisions/0439-the-top-is-one-strip.md`: *"the top in game elements, ship info etc boss
      bars and score … don't all sit on the same line across the top of the screen."* In pixels on the
      glass, with the bar raised and the score at its widest, at every size the row is held at: the
      three boxes share a centre line and a height, to a pixel.
    */
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForSelector('.itc-playing-score-shown');
    for (const [width, height] of [
      [667, 375],
      [844, 390],
      [915, 412],
      [1280, 720],
    ] as const) {
      await page.setViewportSize({ width, height });
      const boxes = await page.evaluate(() => {
        document.querySelector<HTMLElement>('.itc-playing-boss')!.classList.add('itc-playing-boss-shown');
        const score = document.querySelector<HTMLElement>('.itc-playing-score')!;
        score.querySelector<HTMLElement>('.itc-playing-score-value')!.style.setProperty('--itc-playing-points', '99999999');
        return ['.itc-playing-hud', '.itc-playing-boss', '.itc-playing-score'].map((s) => {
          const el = document.querySelector<HTMLElement>(s)!;
          const r = el.getBoundingClientRect();
          // A plate is a fixed height, so a box measured alone is on the line whatever spills out of it.
          return { name: s.slice(13), centre: r.top + r.height / 2, height: r.height, spill: el.scrollHeight - el.clientHeight };
        });
      });
      const at = `${width}×${height}`;
      const [readout] = boxes;
      for (const box of boxes) {
        expect(box.height, `at ${at} the ${box.name} has no height`).toBeGreaterThan(0);
        expect(box.spill, `at ${at} the ${box.name} runs ${box.spill} px out of its plate`).toBeLessThanOrEqual(1);
        expect(
          Math.abs(box.centre - readout!.centre),
          `at ${at} the ${box.name} sits ${(box.centre - readout!.centre).toFixed(1)} px off the readout's line`,
        ).toBeLessThanOrEqual(1);
        expect(Math.abs(box.height - readout!.height), `at ${at} the ${box.name} is ${box.height.toFixed(1)} px tall and the readout ${readout!.height.toFixed(1)}`).toBeLessThanOrEqual(1);
      }
    }
    await page.context().close();
  });
});

describe.runIf(chromePath)('0500 — the desk has a bar', () => {
  /** The colour of one canvas pixel, in CSS pixels at a device scale of one. */
  const pixel = (page: Page, x: number, y: number): Promise<number[]> =>
    page.evaluate(([px, py]) => Array.from(document.querySelector<HTMLCanvasElement>('#app canvas')!.getContext('2d')!.getImageData(px!, py!, 1, 1).data), [x, y]);

  it('THE ASK, IN PIXELS: on a desktop the readout, the boss bar and the score stand in a black bar at the top, with the strip’s own air above and below them, and the field starts under it', async () => {
    /*
      *"Can we shift the HUD and things into the bar at the top on desktop? … about the size of our HUD
      layout now and then just a tiny bit for bordering around the top and bottom."* Asked of the real
      page at the player's own maximised window and at the two sizes the guards name: every plate is
      inside the bar with air on both sides, the bar is drawn black, and the first row under it is not.
    */
    const page = await open(false);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForSelector('.itc-playing-score-shown');
    for (const [width, height] of [
      [1920, 950],
      [1280, 720],
      [1366, 657],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(500);
      const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
      const bar = hudBar(height, rem);
      const at = `${width}×${height}`;
      const plates = await page.evaluate(() => {
        document.querySelector<HTMLElement>('.itc-playing-boss')!.classList.add('itc-playing-boss-shown');
        return ['.itc-playing-hud', '.itc-playing-boss', '.itc-playing-score'].map((s) => {
          const r = document.querySelector<HTMLElement>(s)!.getBoundingClientRect();
          return { name: s.slice(13), top: r.top, bottom: r.bottom };
        });
      });
      for (const plate of plates) {
        expect(plate.top, `at ${at} the ${plate.name} has no air above it`).toBeGreaterThan(2);
        expect(plate.bottom, `at ${at} the ${plate.name} reaches ${plate.bottom.toFixed(1)} px, over the field below a bar of ${bar.toFixed(1)}`).toBeLessThan(bar - 2);
        expect(bar - plate.bottom, `at ${at} the ${plate.name} has ${(bar - plate.bottom).toFixed(1)} px under it and ${plate.top.toFixed(1)} over it`).toBeCloseTo(plate.top, 0);
      }
      expect(await pixel(page, Math.round(width / 2), Math.floor(bar / 2)), `at ${at} the bar is not drawn black`).toEqual([0, 0, 0, 255]);
      expect(await pixel(page, Math.round(width / 2), Math.ceil(bar) + 1), `at ${at} the bar runs on into the field`).not.toEqual([0, 0, 0, 255]);
    }
    await page.context().close();
  });

  it('and a touch screen keeps none: the field is the whole glass, as it was', async () => {
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForSelector('.itc-playing-score-shown');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    expect(await pixel(page, 422, 4), 'a touch screen got the desk’s bar').not.toEqual([0, 0, 0, 255]);
    await page.context().close();
  });
});

describe.runIf(chromePath)('0437 — the open items', () => {
  /*
    `docs/decisions/0437-the-title-is-lit.md`. *"Hide the duplicate counts on mobile"*: on a touch
    screen the discs say the stacks, so the readout's stack groups leave the glass — and stay in the
    page, because the discs are hidden from a reader and these labels are the only place the charges
    are said. Measured on both kinds of page, so a rule that hid them everywhere fails as well.
  */
  const stacks = (page: Page): Promise<{ clipped: boolean; inPage: boolean }[]> =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.itc-playing-hud-stack')].map((el) => ({
        clipped: getComputedStyle(el).clipPath !== 'none',
        inPage: getComputedStyle(el).display !== 'none' && !el.hidden,
      })),
    );

  it('takes the stack counts off the glass on a touch screen, and keeps them for a reader', async () => {
    const page = await open(true);
    const seen = await stacks(page);
    // One per trigger — three since 0447's ward.
    expect(seen.length, 'the readout has no stack groups to hide').toBe(SIDES.length);
    for (const group of seen) {
      expect(group.clipped, 'a touch screen still draws the count its disc already says').toBe(true);
      expect(group.inPage, 'the count was taken out of the page, so a reader never hears it').toBe(true);
    }
    await page.context().close();
  });

  it('and leaves them on the glass where there are no discs', async () => {
    const page = await open(false);
    for (const group of await stacks(page)) {
      expect(group.clipped, 'a desktop with no discs lost its stack counts').toBe(false);
    }
    await page.context().close();
  });
});

describe.runIf(chromePath)('the in-game readout', () => {
  it('is hidden until a run starts, and shows while playing', async () => {
    const page = await open();
    expect(await shown(page, HUD), 'the readout is up before there is a run to report').toBe(false);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    expect(await shown(page, HUD), 'the readout never appeared').toBe(true);
    await page.context().close();
  });

  it('reports the run in words as well as in pictures', async () => {
    /*
      ⚠️ `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *every cue has a visual
      twin* in the unconditional tier, and the converse holds here: a row of coloured discs is not
      something a screen reader can read, so the numbers are on the elements as labels. This is the
      assertion that keeps them there.
    */
    const page = await open();
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    const labels = await page.evaluate((selector: string) =>
      [...document.querySelectorAll(selector)].map((el) => el.getAttribute('aria-label') ?? ''),
      '.itc-playing-hud-group',
    );
    expect(labels.some((l) => /\d+ lives/.test(l)), `no lives readout in ${labels.join(' | ')}`).toBe(true);
    expect(labels.some((l) => /Shield \d+ of \d+/.test(l)), `no shield readout in ${labels.join(' | ')}`).toBe(true);
    await page.context().close();
  });

  it('draws one pip per shield the ship can carry on its tier, and a fresh life lights the tier’s shell', async () => {
    /*
      ⚠️ **THE PIPS CHANGED MEANING AND THE COUNT CHANGED WITH THEM.** They were one per point of the
      ship's health, when a ship had five; the hull is one hit now and the row is the SHELL — see
      decision 0050.

      ⚠️ **AND SINCE 0355 THE ROW IS THE TIER'S.** Pressed on every tier's own button, in the order
      `src/state/screens.ts` builds them: the sockets SEEN are the ones the tier lets the ship carry —
      three and three and none — and the ones LIT are what its life opens with, so a Legendary life
      opens full and a Savior one opens on three empty sockets, as every life did before. Counted as
      the player sees them: a socket hidden by the stylesheet is not a socket.

      ⚠️ **THE TIERS ARE PRESSED AT ONCE, EACH ON ITS OWN PAGE, AND THE PRESS IS WHY.** A press made
      before the music prewarm finishes bakes the rest of it synchronously — `src/app/sound.ts`,
      `prewarmAudio` — and a headless page presses at once: 5.6 s a press here on 2026-09-27, against
      0.1 s after fifteen idle seconds on the title, so waiting costs more than it saves. The bake is
      the page's and there is no road from a run back to the title but a game over, so every tier
      pays one. Three pages in turn were 20.7 s and 21.4 s; three at once 9.7 s and 8.9 s, because
      each page's renderer bakes on its own core.
    */
    await Promise.all(
      DIFFICULTY_KINDS.map(async (tier) => {
        const row = DIFFICULTIES[tier];
        const page = await open();
        await launch(page, tier);
        await page.waitForTimeout(200);
        const pips = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('.itc-playing-hud-pip')]
            .filter((el) => el.offsetParent !== null)
            .map((el) => el.classList.contains('itc-playing-hud-spent')),
        );
        expect(pips.length, `the pip row on ${tier} is not the shell the tier lets the ship carry`).toBe(row.shellCap);
        expect(
          pips.filter((spent) => !spent).length,
          `a fresh ${tier} life does not light the shell it opens with`,
        ).toBe(row.shellOpen);
        await page.context().close();
      }),
    );
  });

  it('follows the run down as it is spent, and shows a spent pip as EMPTY', async () => {
    /*
      ⚠️ **TWO PROPERTIES, ONE DRIVE, AND THE MERGE IS ABOUT TIME RATHER THAN TIDINESS.** These were
      two tests, each waiting about twelve seconds for the fixture to be hit — which is a direct cost
      of `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md` emptying the opening
      screen, and it is paid **once per probe**: `npm run prove` runs this suite for every probe that
      names it, and CI's test job went from five minutes to ten. They observe the same event, so they
      wait for it once.

      ⚠️ **THE FIRST VERSION OF THE SECOND HALF COUNTED PIPS AND CALLED ITSELF DONE**, which
      `npm run prove` caught: a probe that replaced the fill difference with an opacity change stayed
      GREEN, because nothing here had ever looked at what *spent* actually renders as.

      `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *colour never carries meaning
      alone* in the unconditional tier, and a shield readout is the most tempting place in the game to
      break it — full and empty are the same shape in two inks in most of the genre. So the property
      is stated directly: the two states differ by FILL, and they agree on their rim's colour, which
      is what makes the difference survive a palette swap.
    */
    const page = await open();
    // ⚠️ The first tier whose life opens on EMPTY sockets, by the row rather than by name — since 0355
    // a Legendary life opens full, so nothing on it would be spent to compare against.
    const empty = DIFFICULTY_KINDS.findIndex((k) => DIFFICULTIES[k].shellOpen === 0 && DIFFICULTIES[k].shellCap > 0);
    await launch(page, DIFFICULTY_KINDS[empty]!);
    await page.waitForTimeout(200);
    /*
      ⚠️ **BOTH PIP STATES ARE PUT ON SCREEN BY THE CHROME'S OWN CLASS, and that is deliberate.** A
      life opens with an empty shell, so the two states are no longer both on screen at once until the
      player has flown for a shield — and waiting for a stationary fixture to catch a drifting pickup
      would be timing a coincidence rather than testing a rule. The class is the one `setHud` toggles;
      what is under test here is what the STYLESHEET does with it, which is precisely what a probe
      swapping fill for opacity broke and what nothing caught until `npm run prove` said so.
    */
    const styles = await page.evaluate(() => {
      const pips = [...document.querySelectorAll('.itc-playing-hud-pip')];
      pips[0]?.classList.remove('itc-playing-hud-spent');
      return pips.map((el) => {
        const computed = getComputedStyle(el);
        // The rim is the pseudo-element since 0430, when the disc became a shield: a border cannot
        // follow a shield's outline, so the outline is a masked layer in the ink in both states.
        const rim = getComputedStyle(el, '::after');
        return {
          spent: el.classList.contains('itc-playing-hud-spent'),
          background: computed.backgroundColor,
          border: rim.content === 'none' ? 'no rim' : rim.backgroundColor,
        };
      });
    });
    const spent = styles.filter((s) => s.spent);
    const full = styles.filter((s) => !s.spent);
    expect(spent.length, 'nothing is spent, so this compares nothing').toBeGreaterThan(0);
    expect(full.length, 'nothing is full, so this compares nothing').toBeGreaterThan(0);

    const transparent = /rgba\(0,\s*0,\s*0,\s*0\)|transparent/;
    expect(spent[0]!.background, `a spent pip is filled with ${spent[0]!.background}`).toMatch(transparent);
    expect(full[0]!.background, 'a full pip is not filled at all').not.toMatch(transparent);
    expect(spent[0]!.border, 'a spent pip has no rim, so an empty shield is nothing at all').not.toMatch(/no rim|rgba\(0,\s*0,\s*0,\s*0\)/);
    expect(spent[0]!.border, 'spent and full pips differ by colour rather than by fill').toBe(full[0]!.border);

    /*
      ⚠️ **AND THAT THE READOUT MOVES AT ALL, which is the half a screenshot cannot see.** A HUD that
      renders once and never updates looks completely correct in a still image —
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` is the rule that a
      thing the model resolves has to reach the picture, and a readout is the purest case of it.

      ⚠️ **Driven by a DEATH rather than by a hit, and the one-hit hull is why.** A ship with no shell
      does not lose a pip when it is hit; it is destroyed. The lives count is written by the same
      `setHud` call, so a readout that had stopped updating still fails here.
    */
    const before = await page.textContent('.itc-playing-hud-group span');
    // The fixture does not dodge, so the first wave ends the life. Waited on rather than timed — the
    // same reason `tests/frames.ts` counts frames instead of milliseconds.
    await page.waitForFunction(
      (was: string) => (document.querySelector('.itc-playing-hud-group span')?.textContent ?? '') !== was,
      before ?? '',
    );
    const after = await page.textContent('.itc-playing-hud-group span');
    expect(after, 'the run spent a life and the readout did not move').not.toBe(before);
    const label = await page.getAttribute('.itc-playing-hud-group[role="img"]', 'aria-label');
    expect(label, 'the spoken shield readout is not a count of shields').toMatch(
      new RegExp('Shield \\d+ of ' + String(MAX_SHIELDS)),
    );
    await page.context().close();
    /*
      ⚠️ **170 s, ITS OWN, AND THE COST IS GAME TIME RATHER THAN WORK.** A press, then 24.6 s of play
      before the first wave reaches a ship that does not move — the same figure every run, because the
      level opens empty (0043) and the sim steps at 60 Hz. Nothing here can make that shorter without a
      road into the game that only a test would use. Under `npx vitest run` on 2026-09-27: 39.3, 41.3
      and 43.8 s with nothing else on the box, 55.1 and 48.9 s on a box that was not logged — three
      times 55.1 — `docs/decisions/0245-a-budget-is-sized-under-load.md`. The wait for the death took
      its own 60 s, which could never fire before the test's, and is gone with Playwright's others.
    */
  }, 170_000);

});

describe.runIf(chromePath)('the readout follows what the player spends', () => {
  it('follows a spent charge, which changes no screen at all', async () => {
    /*
      ⚠️ **THE BUG THE BOMB MADE VISIBLE.** `dispatch` compared the incoming run slice to
      `state.run` *after* `state` had already been reassigned — a thing compared to itself — so the
      readout only ever refreshed when the SCREEN changed. It looked fine because both things it
      showed happened to change at a screen boundary: a death that ended the run raised the game-over
      screen, and the lives count updated on the way past.

      A charge is the first thing in the game that changes mid-run with no screen anywhere near it,
      which is why this is the test that can see it. It is also deterministic: press the trigger, read
      the number — no dodging, no waiting for a wave.
    */
    const page = await open();
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(300);
    // "2 charges, next Bomb" since 0373: the stack's count and what it throws next.
    const label = '.itc-playing-hud-group[aria-label*="charge"]';
    const before = await page.getAttribute(label, 'aria-label');
    expect(before, 'the readout does not say what the player is carrying').toMatch(/\d+ charges?, next \w+/);

    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
    const after = await page.getAttribute(label, 'aria-label');
    expect(after, 'a bomb was spent and the readout did not move').not.toBe(before);
    await page.context().close();
  });
});

/*
 * THE CHROME FITS THE PHONE — `docs/decisions/0465-the-chrome-fits-the-phone.md`.
 *
 * Played: *"the hud and side buttons are too big on mobile it looks weird."* Measured, the strip was
 * typeset in `vw`, so an 844-wide phone wore the desktop's font on a screen half as tall — 16 % of
 * the height against the desktop's 9 % — and three discs at 0.17 of the short edge stacked 61 % of
 * the height up the leading edge. Both in the player's units here, as 0049 measures its screens:
 * pixels of the glass against the glass.
 *
 * ⚠️ One press and five viewports, resized as 0439's guard does, because every press here pays a
 * music bake and the strip re-lays out on a resize (0369).
 */
describe.runIf(chromePath)('0465 — the chrome fits the phone', () => {
  /** The layout guard's phones, plus the camera the game ships on a desktop. */
  const PHONES = [
    [480, 320],
    [667, 375],
    [812, 375],
    [844, 390],
    [915, 412],
  ] as const;

  async function measure(page: Page, width: number, height: number) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    return page.evaluate(() => {
      const bottom = (s: string): number => document.querySelector(s)!.getBoundingClientRect().bottom;
      const discs = [...document.querySelectorAll('.itc-playing-trigger-button')].map((b) => {
        const r = b.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, width: r.width };
      });
      return { strip: Math.max(bottom('.itc-playing-hud'), bottom('.itc-playing-score')), discs, height: innerHeight };
    });
  }

  it('THE ASK: the strip is under a tenth of a phone’s height, and the desktop’s is what it was', async () => {
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForSelector('.itc-playing-score-shown');
    for (const [width, height] of PHONES) {
      const m = await measure(page, width, height);
      /*
        A tenth. The smallest phone stands on the type's floor — 0.75 rem, the one number 0465 leaves
        to the play — and a floor is a height the box cannot shrink (0049), so there it is an eighth.
      */
      const share = height <= 320 ? 0.125 : 0.105;
      expect(m.strip / height, `at ${width}×${height} the strip is ${((100 * m.strip) / height).toFixed(1)} % of the height`).toBeLessThanOrEqual(share);
    }
    // Measured on main at 85a6432, before the change: the plates' bottom edge at 64 px. 0153: the desktop does not move.
    const desk = await measure(page, 1280, 720);
    expect(Math.abs(desk.strip - 64), `at 1280×720 the strip ends at ${desk.strip.toFixed(1)} px where it ended at 64`).toBeLessThanOrEqual(1);
    await page.context().close();
  });

  it('and the discs are a thumb and no more: 44 to 66 px each, the column under half the height', async () => {
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForSelector('.itc-playing-trigger-shown');
    for (const [width, height] of PHONES) {
      const m = await measure(page, width, height);
      const at = `${width}×${height}`;
      expect(m.discs.length, `at ${at} the discs are not one per trigger`).toBe(SIDES.length);
      for (const disc of m.discs) {
        expect(disc.width, `at ${at} a disc is ${disc.width.toFixed(1)} px, under a fingertip`).toBeGreaterThanOrEqual(43.5);
        expect(disc.width, `at ${at} a disc is ${disc.width.toFixed(1)} px, over the 66 the 390 px phone had`).toBeLessThanOrEqual(66.5);
      }
      const column = Math.max(...m.discs.map((d) => d.bottom)) - Math.min(...m.discs.map((d) => d.top));
      expect(column / height, `at ${at} the discs take ${((100 * column) / height).toFixed(1)} % of the height`).toBeLessThanOrEqual(0.5);
    }
    await page.context().close();
  });
});
