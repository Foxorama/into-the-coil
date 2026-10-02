import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { BOARD_SHOWN, SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { choose } from './title.ts';
import { SCREENS, SCREEN_KINDS, type Screen } from '../src/state/screens.ts';
// 0212: the music room's readout is the one part of a screen that appears after the screen does.
import { MUSIC_LEVELS, MUSIC_LEVEL_LABEL } from '../src/content/music.ts';
import { THEMES, THEME_KINDS } from '../src/content/themes.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
// 0415: the title's Pilot card is as wide as whoever was picked.
import { GOLFERS, GOLFER_KINDS, type GolferKind } from '../src/content/golfers.ts';
// 0429: the title is measured with a full high-score table on it.
import { SCORES_KEY, TABLE_SIZE, serialiseScores, type ScoreEntry } from '../src/save/scores.ts';

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

async function open(viewport: { width: number; height: number }, kept: 'table' | 'nothing' = 'table'): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  /*
    ⚠️ **A FULL HIGH-SCORE TABLE, WRITTEN BEFORE THE PAGE LOADS — 0429.** The title stands the table
    beside its rows (0458), and drops the column while nothing is kept; a guard that loaded a browser
    with nothing kept would be measuring the title every first-time player sees and no returning one
    does. The widest rows the content allows, through the real save layer.

    ⚠️ **AND `nothing` FOR THE OTHER ONE, BECAUSE ONLY EVER SEEDING HID IT — 0460.** The title with no
    table is a different layout, and on every phone it was broken while this file stayed green.
  */
  if (kept === 'table') {
    await context.addInitScript(
      ([key, table]: [string, string]) => {
        localStorage.setItem(key, table);
      },
      [SCORES_KEY, widestTable()] as [string, string],
    );
  }
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
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
  if (screen === 'music') await fillTheRoom(page);
  if (screen === 'title') await nameTheWidestPilot(page);
  if (screen === 'title') {
    // The table has to be there to be measured, or every title below is the first-time player's.
    const rows = await page.$('.' + prefixFor('title') + 'board-rows');
    expect(rows, 'the title has no high-score table to measure — the seeded table was not read').not.toBeNull();
  }
  if (screen === 'cleared' || screen === 'victory' || screen === 'gameOver') await fillTheSheet(page, screen);
}

/** Ten runs, as wide as the table can be: the longest first name, seven digits, and every one clear. */
function widestTable(): string {
  const first = (kind: GolferKind): string => GOLFERS[kind].name.split(' ')[0] ?? '';
  const widest = GOLFER_KINDS.reduce((a, b) => (first(b).length > first(a).length ? b : a));
  const table: ScoreEntry[] = [];
  for (let i = 0; i < TABLE_SIZE; i++) {
    table.push({ score: 9_999_999 - i, bonus: 0, pilot: widest, difficulty: 'savior', levels: 7, cleared: true, continues: 0, when: i });
  }
  return serialiseScores(table);
}

/**
 * Put an account on a screen that shows one, at its LONGEST — 0428, on `fillTheRoom`'s terms: the
 * sheet is pushed by the shell mid-run, so `showOnly` would otherwise measure it empty. The break's
 * seven lines, the victory's five and the run over's one, each value seven digits wide, written in
 * the classes `setSheet` writes.
 */
async function fillTheSheet(page: Page, screen: 'cleared' | 'victory' | 'gameOver'): Promise<void> {
  const lines: Record<typeof screen, string[]> = {
    cleared: ['Points', 'Rank', 'Shields ×3', 'Bombs ×12', 'Missiles ×12', 'Level total', 'Score'],
    victory: ['Ranks', 'Points', 'Bonuses', 'Final score', 'High score'],
    gameOver: ['Score'],
  };
  await page.evaluate(
    ({ prefix, labels }: { prefix: string; labels: string[] }) => {
      const sheet = document.querySelector('.' + prefix + 'sheet');
      if (!(sheet instanceof HTMLElement)) throw new Error('the screen has no sheet to fill');
      sheet.replaceChildren();
      for (const text of labels) {
        const label = document.createElement('span');
        label.className = prefix + 'sheet-label';
        label.textContent = text;
        const value = document.createElement('span');
        value.className = prefix + 'sheet-value';
        value.textContent = text === 'Ranks' ? 'S S S S S S S' : '9999999';
        // Settled, as the eye sees it once the lines have arrived.
        label.style.animation = 'none';
        label.style.opacity = '1';
        value.style.animation = 'none';
        value.style.opacity = '1';
        sheet.append(label, value);
      }
    },
    { prefix: prefixFor(screen), labels: lines[screen] },
  );
}

/**
 * Put the longest line each title band can say under it — 0415, 0458, and 0212's argument again.
 *
 * ⚠️ **A BAND'S HINT SAYS WHAT IS CHOSEN, SO IT IS AS WIDE AS THE LONGEST CHOICE**, and the page opens
 * on the defaults: a guard that took the title as it loads measured one line of four. The pilot's is
 * their name, ship and gun, which is the longest. Written into the DOM for the reason `fillTheRoom` gives.
 */
async function nameTheWidestPilot(page: Page): Promise<void> {
  const longest = (all: readonly string[]): string => all.reduce((a, b) => (b.length > a.length ? b : a), '');
  const lines = SCREENS.title.choices.map((choice) => ({
    name: choice.name,
    line: longest(choice.options.map((o) => (choice.faces === 'portraits' ? o.label + ' — ' + o.hint : o.hint))),
  }));
  await page.evaluate(
    ({ prefix, attr, lines }: { prefix: string; attr: string; lines: { name: string; line: string }[] }) => {
      for (const { name, line } of lines) {
        const hint = document.querySelector(`[${attr}="${name}"] ~ .${prefix}band-hint`);
        if (!(hint instanceof HTMLElement)) throw new Error(`the title's ${name} band has no line saying what is chosen`);
        hint.textContent = line;
      }
    },
    { prefix: prefixFor('title'), attr: SETTING_ATTR, lines },
  );
}

/**
 * Put the music room into its TALLEST and WIDEST state — 0212.
 *
 * ── A SCREEN THAT GROWS AFTER IT IS SHOWN, WHICH NOTHING HERE HAD SEEN BEFORE ───────────────────
 *
 * ⚠️ **`showOnly` ADDS A CLASS AND THE READOUT IS `hidden`, SO THIS GUARD WAS MEASURING THE ROOM
 * WITH ITS READOUT MISSING.** The room opens with nothing playing and grows a five-line block the
 * moment a place is pressed — a name, a bar, a legend and a clock — and every viewport below was
 * being checked against the short version. **That is the same shape as 0210's own bug**: a thing in
 * the DOM, correctly hidden, that the guard could not see and therefore reported on happily.
 *
 * ⚠️ **THE WIDEST CONTENT AND NOT WHATEVER IS PLAYING**, which is what a layout guard wants. The
 * longest place title, the longest rung label and the longest *next* line are read off the content
 * tables, so a place renamed to something long fails here rather than on somebody's phone.
 *
 * ⚠️ **WRITTEN INTO THE DOM RATHER THAN PRESSED THROUGH THE APP, AND THAT IS A REAL COST.** Pressing
 * a place would exercise the shell's own push — but it also pays 0169's four-second prewarm, six
 * times over, in a suite that already runs six full page loads here. `tests/room.browser.test.ts`
 * drives the real path and asserts the real strings; this one is about boxes, and it takes the same
 * shortcut `showOnly` above already takes for every other screen.
 */
async function fillTheRoom(page: Page): Promise<void> {
  const longest = (all: readonly string[]): string => all.reduce((a, b) => (b.length > a.length ? b : a), '');
  const place = longest(THEME_KINDS.map((kind) => THEMES[kind].title));
  await page.evaluate(
    ({ prefix, place, section }: { prefix: string; place: string; section: string }) => {
      const root = document.querySelector('.' + prefix + 'now');
      if (!(root instanceof HTMLElement)) throw new Error('the music room has no readout to fill');
      root.hidden = false;
      const write = (part: string, text: string): void => {
        const el = root.querySelector('.' + prefix + part);
        if (el instanceof HTMLElement) el.textContent = text;
      };
      write('now-place', place);
      write('now-section', section);
      write('now-at', '2:51');
      write('now-of', '2:51');
      write('now-next', `next: ${place}`);
      // Five names under the bar, which is what every level's script plus the fight comes to.
      const legend = root.querySelector('.' + prefix + 'now-legend');
      if (legend instanceof HTMLElement) {
        legend.replaceChildren();
        for (let i = 0; i < 5; i++) {
          const name = document.createElement('span');
          name.className = prefix + 'now-name';
          name.textContent = section;
          name.style.left = `${i * 25}%`;
          legend.appendChild(name);
        }
      }
    },
    { prefix: prefixFor('music'), place, section: longest(MUSIC_LEVELS.map((rung) => MUSIC_LEVEL_LABEL[rung])) },
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
      /*
        ⚠️ **WHAT A CLIPPING BOX INSIDE THE PANEL HIDES IS NOT DRAWN — 0429.** The title's table rolls
        its rows through a window that clips them, so most of its rows are, at any moment, boxes
        outside the window and outside the display that nobody can see. Measured as the part of the
        box its clipping ancestors let through; a box they hide entirely is not a box on the screen.
        The panel itself and the overlay above it are not clipping boxes here — they are the scroll
        container whose overflow this guard exists to catch. ⚠️ **Never a control**: a button a clip
        hides is a button the player cannot press, which is this guard's subject, so it is measured
        whole wherever it is.
      */
      let left = r.left;
      let top = r.top;
      let right = r.right;
      let bottom = r.bottom;
      const clips = !(el instanceof HTMLButtonElement);
      for (let up = el.parentElement; clips && up !== null && up !== panel; up = up.parentElement) {
        const overflow = getComputedStyle(up).overflow;
        if (overflow === 'visible') continue;
        const clip = up.getBoundingClientRect();
        left = Math.max(left, clip.left);
        top = Math.max(top, clip.top);
        right = Math.min(right, clip.right);
        bottom = Math.min(bottom, clip.bottom);
      }
      if (right <= left || bottom <= top) continue;
      out.push({
        what: (el.textContent ?? el.className).trim().slice(0, 40) || el.className,
        left,
        top,
        right,
        bottom,
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

  it('0049 — the heading is a fraction of the box, measured as a SIZE and not as an overflow', async () => {
    /*
      ⚠️ **THE OVERFLOW ASSERTIONS STOPPED BEING ABLE TO SEE THIS, AND `npm run prove` IS WHAT SAID
      SO.** 0049's heading probe replaces the clamp with a flat `3.5rem` — the desktop size worn on a
      phone, which is the real hazard and not an invented one. That used to push the title screen past
      the bottom edge, so the no-scrolling assertion caught it.

      Then 0210 gave the title screen room: the tier hints go on a short screen, which bought about
      97 pixels of headroom where 14 were needed. **A fixed heading now FITS**, so every overflow
      assertion went green over a break that is still exactly as wrong as it ever was, and the probe
      reported *the guard does not fire on the thing it exists to catch.*

      ⚠️ **MAKING THE SCREEN ROOMIER MADE THE GUARD BLIND, WHICH IS A THING THAT CAN HAPPEN TO ANY
      GUARD THAT MEASURES A CONSEQUENCE.** The rule 0049 states is *the chrome is authored against the
      short axis* — a heading that is a FRACTION OF ITS BOX. Overflow was only ever the symptom that
      the fraction was missing, and a symptom can be cured without curing the cause. This measures the
      property: the same heading, on two boxes of different heights, must come out at two different
      sizes. `docs/decisions/0027-measure-the-picture-not-the-model.md`, aimed at a guard rather than
      at the code.
    */
    const sizeAt = async (width: number, height: number): Promise<number> => {
      const page = await open({ width, height });
      await showOnly(page, 'title');
      const size = await page.evaluate(() => {
        const heading = document.querySelector('.itc-title-heading');
        return heading === null ? -1 : parseFloat(getComputedStyle(heading).fontSize);
      });
      await page.context().close();
      return size;
    };
    const small = await sizeAt(480, 320);
    const large = await sizeAt(1280, 720);
    expect(small, 'no heading was found to measure').toBeGreaterThan(0);
    expect(
      large,
      `the title heading is ${small}px on a 480x320 and ${large}px on a 1280x720 — it is not a ` +
        'fraction of the box it has to fit, so it is typeset for one screen and cropped on the rest',
    ).toBeGreaterThan(small + 1);
  });

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

describe.runIf(chromePath)('0458 — the table on the title is five rows that stay where they are', () => {
  it('shows the best five of the table, standing still', async () => {
    /*
      Played: *"the high scores scroll too fast and are hard to read and the flashing in and out is
      awkward, could just be the top 5."* Held as what the player sees: five scores, best first, and
      nothing in the table moving — no roll, no cross-fade. The device keeps `TABLE_SIZE`, and the
      table this page was seeded with is that long, so a title that showed them all would show more.
    */
    const page = await open({ width: 1280, height: 720 });
    await page.waitForTimeout(1_000);
    const board = await page.evaluate((p: string) => {
      const root = document.querySelector('.' + p + 'board');
      if (!(root instanceof HTMLElement)) return null;
      const scores = [...root.querySelectorAll('.' + p + 'board-score')].map((el) => Number(el.textContent));
      const moving = [root, ...root.querySelectorAll('*')].flatMap((el) => el.getAnimations()).length;
      return { scores, moving };
    }, prefixFor('title'));
    expect(board, 'the title has no table').not.toBeNull();
    expect(TABLE_SIZE, 'the device keeps no more than five, so this cannot tell five from all').toBeGreaterThan(BOARD_SHOWN);
    expect(board!.scores, 'the title does not show the best five').toHaveLength(BOARD_SHOWN);
    expect([...board!.scores].sort((a, b) => b - a), 'the five are not best first').toEqual(board!.scores);
    expect(board!.moving, 'something in the table is still animating').toBe(0);
    await page.context().close();
  });
});

describe.runIf(chromePath)('0370 — the tiers explain themselves on every screen', () => {
  it('THE REPORTED ONE: every tier shows its line under its name, readably, on every device', async () => {
    /*
      Asked for from a phone: *"it's all squished in and has no explanations for the different
      difficulties."* The short-screen rule took the tiers' hints away to fit, so on every phone the
      choice was three names and nothing else. Held in pixels: on every device in the list, each tier's
      hint is drawn, whole on the display, and at eleven pixels or more — the floor under a line a
      player reads to decide something.
    */
    /*
      ⚠️ **ONE LINE UNDER THE BAND SINCE 0458, AND IT SAYS THE CHOSEN TIER'S.** The tiers were three
      cards with a line each; they are three segments of one band, and the band writes the live one's
      line under it. So each tier is CHOSEN, by a press on its segment as a player makes it, and its
      line is measured then — the same three lines, in pixels, on every device.
    */
    for (const viewport of VIEWPORTS) {
      const page = await open(viewport);
      const lines: { tier: string; text: string; shown: boolean; inside: boolean; px: number }[] = [];
      for (const tier of DIFFICULTY_KINDS) {
        await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(tier));
        lines.push(
          await page.evaluate(
            ({ p, attr, tier }: { p: string; attr: string; tier: string }) => {
              const line = document.querySelector<HTMLElement>(`[${attr}="difficulty"] ~ .${p}band-hint`);
              const r = line?.getBoundingClientRect();
              return {
                tier,
                text: line?.textContent ?? '',
                shown: line !== null && r !== undefined && getComputedStyle(line).display !== 'none' && r.width > 0 && r.height > 0,
                inside: r !== undefined && r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5,
                px: line === null ? 0 : parseFloat(getComputedStyle(line).fontSize),
              };
            },
            { p: prefixFor('title'), attr: SETTING_ATTR, tier },
          ),
        );
      }
      for (const line of lines) {
        expect(line.text, `${viewport.what}, ${line.tier}: the band does not say the chosen tier's line`).toBe(
          DIFFICULTIES[line.tier as (typeof DIFFICULTY_KINDS)[number]].hint,
        );
      }
      for (const line of lines) {
        const at = `${viewport.what}, ${line.tier}: "${line.text}"`;
        expect(line.shown, `${at} is not drawn`).toBe(true);
        expect(line.inside, `${at} is off the display`).toBe(true);
        expect(line.px, `${at} is set at ${line.px}px`).toBeGreaterThanOrEqual(11);
      }
      await page.context().close();
    }
  });

  it('keeps the title’s choices in one row on a phone, where a second row is what scrolled it', async () => {
    /*
      0370's phone title is rows ACROSS the long axis, and the choices are the first of them. 0415
      added Pilot as a fifth card to a four-column grid, and it wrapped onto a row of its own: 46
      pixels of a 320-pixel screen. **The no-scrolling guard above could not see it here** — on this
      machine's fonts the second row still fitted, and only CI's scrolled, by 9. A net that catches a
      break on one machine's fonts and not another's is measuring the headroom, so this measures the
      shape: every choice lies within the height of the first, on every phone in the list.
    */
    for (const viewport of VIEWPORTS.filter((v) => v.height < 460)) {
      const page = await open(viewport);
      await showOnly(page, 'title');
      const rows = await page.evaluate((p: string) => {
        return [...document.querySelectorAll<HTMLElement>('.' + p + 'choices > *')].map((card) => {
          const r = card.getBoundingClientRect();
          return { what: card.firstChild?.textContent ?? '', top: r.top, bottom: r.bottom };
        });
      }, prefixFor('title'));
      const first = rows[0];
      expect(first, `${viewport.what}: the title has no choices`).toBeDefined();
      for (const card of rows) {
        const at = `${viewport.what}: ${card.what} is outside the row the tiers make`;
        expect(card.top, at).toBeGreaterThanOrEqual(first!.top - 0.5);
        expect(card.bottom, at).toBeLessThanOrEqual(first!.bottom + 0.5);
      }
      await page.context().close();
    }
  });
});

describe.runIf(chromePath)('0460 — a band draws its segments whole, between its own steps', () => {
  /*
    THE REPORTED ONE: a phone's title with nothing kept yet, the tier names stood four words tall with
    the step arrows drawn through *Legendary* and *Galaxy*, and the pilot faces cut at both ends. The
    fit guard above saw none of it — every box was on the display, only on top of one another — and it
    only ever loaded the title with a table seeded, which is a different layout.

    Measured in the player's pixels, on both titles: no segment is drawn under a step; the chosen
    segment is drawn whole inside its track; and a track scrolled to its start shows its first segment
    from its first pixel, because a scroll box cannot reach what overflows before its own start.
  */
  for (const kept of ['nothing', 'table'] as const) {
    it(`with ${kept === 'table' ? 'a full table' : 'nothing kept'}, on every device`, async () => {
      for (const viewport of VIEWPORTS) {
        const page = await open(viewport, kept);
        await page.waitForSelector('.' + prefixFor('title').slice(0, -1) + '-shown');
        await nameTheWidestPilot(page);
        const faults = await page.evaluate((p: string) => {
          const out: string[] = [];
          const box = (el: Element): DOMRect => el.getBoundingClientRect();
          const meets = (a: DOMRect, b: { left: number; right: number; top: number; bottom: number }): boolean =>
            a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
          for (const band of document.querySelectorAll<HTMLElement>('.' + p + 'band')) {
            const track = band.querySelector<HTMLElement>('.' + p + 'options');
            if (track === null) continue;
            const name = band.getAttribute('aria-label') ?? track.className;
            const t = box(track);
            const clipped = getComputedStyle(track).overflowX !== 'visible';
            const options = [...track.querySelectorAll<HTMLElement>('.' + p + 'option')];
            for (const step of band.querySelectorAll('.' + p + 'band-step')) {
              const s = box(step);
              for (const option of options) {
                const o = box(option);
                const seen = clipped
                  ? { left: Math.max(o.left, t.left), right: Math.min(o.right, t.right), top: o.top, bottom: o.bottom }
                  : o;
                if (seen.right > seen.left && meets(s, seen)) {
                  out.push(`${name}: ${(option.textContent || option.getAttribute('aria-label')) ?? ''} is under a step`);
                }
              }
            }
            const on = track.querySelector('.' + p + 'option-on');
            if (on !== null) {
              const o = box(on);
              if (o.left < t.left - 0.5 || o.right > t.right + 0.5) out.push(`${name}: the chosen one is not drawn whole`);
            }
            /*
              A roster that outgrows its track, which four pilots do not yet and the expanded one
              will: the track squeezed to one segment, scrolled to its start, and asked for its first.
            */
            const first = options[0];
            if (clipped && first !== undefined) {
              track.style.maxWidth = box(first).width + 'px';
              track.scrollLeft = 0;
              const gap = box(track).left - box(first).left;
              if (gap > 0.5) out.push(`${name}: the first segment starts ${gap.toFixed(0)} px before any scroll reaches`);
              track.style.maxWidth = '';
            }
          }
          return out;
        }, prefixFor('title'));
        expect(faults, `${viewport.what} (${viewport.width}x${viewport.height}), ${kept} kept`).toEqual([]);
        await page.context().close();
      }
    });
  }
});

describe.runIf(chromePath)('0460 — the title’s sky drifts by whole tiles', () => {
  it('sizes every layer of the drifting background as a tile, so the loop has no seam', async () => {
    /*
      0437 drifts the sky's stars a whole number of their own tiles a minute, which is why the loop
      has no seam. 0440 laid two washes on the same element with a background shorthand, which reset
      the stars' images AND sizes: the stars were gone, the drift moved the washes at the size of the
      screen, and their repeat was an edge creeping in from the right that jumped back every minute.
      A layer drawn at the size of its box (auto) is not a tile, so this asks every layer for one.
    */
    const page = await open({ width: 1280, height: 720 });
    const sizes = await page.evaluate(() => {
      const sky = document.querySelector('.itc-title-sky');
      return sky === null ? null : getComputedStyle(sky).backgroundSize.split(',').map((s) => s.trim());
    });
    expect(sizes, 'the title has no sky').not.toBeNull();
    expect(sizes!.length, 'the sky has fewer layers than a sky of stars').toBeGreaterThan(2);
    expect(sizes!.filter((s) => !/^\d+(\.\d+)?px \d+(\.\d+)?px$/.test(s)), 'layers that are not a tile').toEqual([]);
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
    /*
      ⚠️ **WAITED FOR RATHER THAN SLEPT THROUGH, AND THAT IS 0044's *wrong quantity* AGAIN.** This
      was `waitForTimeout(200)` and it went red once on CI and never once locally — *"a wheel over
      the screen scrolled nothing"* on a build whose only change was material in
      `src/content/music.ts`. The claim being made is **the container scrolls**; 200 ms of wall clock
      was standing in for it, and `mount.ts` starts `prewarmAudio()` at boot with no gesture, so a
      title screen is synthesising audio in `setTimeout` chunks for its first few seconds — 3.6s of
      it after that material pass, against 2.7 before. A sleep that short is measuring how busy the
      machine is.

      ⚠️ **It does not weaken the assertion, which is why this is the repair and not a widened
      timeout.** The wheel is still a real wheel, the scroll still has to actually happen, and the
      three assertions below are unchanged — what moved is that the test now waits for the thing it
      is about instead of guessing how long it takes. A container that does not scroll still fails,
      five seconds later. `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`
      is explicit that a rerun is not evidence.
    */
    await page.mouse.move(IMPOSSIBLE.width / 2, IMPOSSIBLE.height / 2);
    await page.mouse.wheel(0, 400);
    await page
      .waitForFunction(
        ({ p, from }: { p: string; from: number }) => {
          const root = document.querySelector('.' + p.slice(0, -1));
          return root instanceof HTMLElement && root.scrollTop > from;
        },
        { p: prefix, from: before!.at },
        { timeout: 5_000 },
      )
      .catch(() => undefined);

    /*
      ⚠️ **THE LOWEST CONTROL ON THE PAGE, NOT THE LAST ONE IN THE LIST — and it was the last action
      until 0370.** The claim is that the far end of the screen is one scroll away, and while the
      tiers and the music room were a column that ended the panel, the last action was the lowest
      thing on it. The phone layout lays the actions across the top row and puts the settings under
      everything, so the last action is near the top and the far end is a setting: read by position,
      the guard keeps asking about the far end whatever the layout puts there.
    */
    const reached = await page.evaluate((p: string) => {
      const root = document.querySelector('.' + p.slice(0, -1));
      const controls = [...document.querySelectorAll<HTMLElement>('.' + p + 'action, .' + p + 'option')];
      const last = controls.reduce<HTMLElement | undefined>(
        (low, c) => (low === undefined || c.getBoundingClientRect().bottom > low.getBoundingClientRect().bottom ? c : low),
        undefined,
      );
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
