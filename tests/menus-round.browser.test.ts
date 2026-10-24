import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { SCREENS, type Screen } from '../src/state/screens.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { SCORES_KEY, SCORES_VERSION } from '../src/save/scores.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { SHIP_KINDS } from '../src/content/ships.ts';
import { FLAME_KINDS } from '../src/content/flames.ts';

/**
 * THE MENUS COME ROUND, A THUMB FINDS ITS ARROW, AND THE TABLE SAYS THE TIER — 0607, in the page.
 *
 * Asked in what the player sees: which option a press of an arrow leaves lit, which control a tap at a
 * point of an arrow lands on, and what words the table draws.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const STANDS = ['hangar', 'parts', 'shop'] as const satisfies readonly Screen[];

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function opened(width: number, height: number, touch: boolean, table: unknown = null, hangar: string | null = null): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
  const page = await context.newPage();
  // 0657: a hangar to open on — a band that fits draws only what is won, so a lap of one needs something won.
  if (hangar !== null) {
    await page.addInitScript(
      ([key, text]) => {
        try {
          localStorage.setItem(key, text);
        } catch {
          // A page that cannot keep it opens on nothing won, and the lap says so.
        }
      },
      [HANGAR_KEY, hangar] as const,
    );
  }
  if (table !== null) {
    await page.addInitScript(
      ([key, text]) => {
        try {
          localStorage.setItem(key, text);
        } catch {
          // A page that cannot keep it shows no table, and the test says so.
        }
      },
      [SCORES_KEY, JSON.stringify(table)] as const,
    );
  }
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  return page;
}

/** Which option of a band is lit — the one tried on if any, else the one on — by position. */
async function lit(page: Page, screen: Screen, band: string): Promise<number> {
  const p = prefixFor(screen);
  return page.locator(`${shown(screen)} [${SETTING_ATTR}="${band}"] .${p}option`).evaluateAll(
    (els, [look, on]) => {
      const tried = els.findIndex((el) => el.classList.contains(look!));
      return tried >= 0 ? tried : els.findIndex((el) => el.classList.contains(on!));
    },
    [p + 'option-look', p + 'option-on'],
  );
}

describe.runIf(chromePath)('0607 — the menus come round, a thumb finds its arrow, and the table says the tier', () => {
  it('steps every band that comes round all the way round and back to where it began, and stops the tier at its end', async () => {
    // Every ship won, so the gun band has guns to lend: since 0657 a band that fits draws only what is open.
    const everyWon = Object.fromEntries(SHIP_KINDS.map((kind) => [kind, true])) as typeof initialHangar.won;
    const page = await opened(1280, 720, false, null, serialiseHangar({ ...initialHangar, won: everyWon }));
    await openHangar(page);
    const p = prefixFor('hangar');
    // The gun: a band that tries, on Hangin' Out's first tab. A whole lap of its arrow is every DRAWN option once — 0657.
    const band = page.locator(`${shown('hangar')} [${SETTING_ATTR}="gun"]`).locator('xpath=ancestor::*[contains(@class, "' + p + 'band")][1]');
    const drawn = await page
      .locator(`${shown('hangar')} [${SETTING_ATTR}="gun"] .${p}option`)
      .evaluateAll((els) => els.flatMap((el, i) => ((el as HTMLElement).hidden ? [] : [i])));
    const count = drawn.length;
    expect(count, 'the gun band draws one option, and a lap of it proves nothing').toBeGreaterThan(1);
    for (const [arrow, way] of [
      ['more', 1],
      ['less', -1],
    ] as const) {
      const start = await lit(page, 'hangar', 'gun');
      const from = drawn.indexOf(start);
      const seen: number[] = [];
      for (let i = 0; i < count; i++) {
        expect(await band.locator(`.${p}band-${arrow}`).isDisabled(), `the gun's ${arrow} arrow is shut at option ${String(seen.at(-1) ?? start)}`).toBe(false);
        await band.locator(`.${p}band-${arrow}`).click();
        seen.push(await lit(page, 'hangar', 'gun'));
      }
      const expected = Array.from({ length: count }, (_, i) => drawn[(((from + way * (i + 1)) % count) + count) % count]!);
      expect(seen, `a lap of the gun's ${arrow} arrow from option ${String(start)} did not come round the drawn guns`).toEqual(expected);
    }
    // The section's sub-tabs come round too: past the last tab is the first.
    const tabs = page.locator(`${shown('hangar')} [${SETTING_ATTR}="section"] .${p}option`);
    const groups = SCREENS.hangar.stand!.groups.length;
    await tabs.nth(groups - 1).click();
    const section = page.locator(`${shown('hangar')} [${SETTING_ATTR}="section"]`).locator('xpath=ancestor::*[contains(@class, "' + p + 'band")][1]');
    await section.locator(`.${p}band-more`).click();
    expect(await tabs.nth(0).getAttribute('aria-pressed'), 'past the last sub-tab did not come round to the first').toBe('true');
    await page.context().close();

    // The tier is a ladder and stops: past the hardest is still the hardest.
    const title = await opened(1280, 720, false);
    const t = prefixFor('title');
    const tier = title.locator(`${shown('title')} [${SETTING_ATTR}="difficulty"]`).locator('xpath=ancestor::*[contains(@class, "' + t + 'band")][1]');
    for (let i = 0; i < DIFFICULTY_KINDS.length + 1; i++) if (!(await tier.locator(`.${t}band-more`).isDisabled())) await tier.locator(`.${t}band-more`).click();
    expect(await lit(title, 'title', 'difficulty'), 'the tier came round past its hardest').toBe(DIFFICULTY_KINDS.length - 1);
    expect(await tier.locator(`.${t}band-more`).isDisabled(), 'the tier’s arrow says there is more past its hardest').toBe(true);
    await title.context().close();
  });

  it('lands every tap on an arrow on that arrow, and none on an option, on a touch phone', async () => {
    for (const [width, height] of [
      [844, 390],
      [667, 375],
      [480, 320],
    ] as const) {
      const page = await opened(width, height, true);
      await openHangar(page);
      for (const screen of STANDS) {
        if (screen !== 'hangar') {
          await page.locator(`.${prefixFor('hangar')}tab, .${prefixFor('parts')}tab, .${prefixFor('shop')}tab`).filter({ visible: true }).nth(STANDS.indexOf(screen)).click();
          await page.waitForSelector(shown(screen), { state: 'attached' });
        }
        const groups = SCREENS[screen].stand?.tabbed === true ? SCREENS[screen].stand!.groups.length : 1;
        for (let g = 0; g < groups; g++) {
          if (groups > 1) await page.locator(`${shown(screen)} [${SETTING_ATTR}="section"] .${prefixFor(screen)}option`).nth(g).click();
          const missed = await page.evaluate((pre) => {
            // 0657: an arrow that goes nowhere keeps its room and is not drawn, so it is not a thing to tap.
            const drawn = (sel: string): HTMLElement[] =>
              [...document.querySelectorAll<HTMLElement>(sel)].filter(
                (el) => el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden',
              );
            const steps = drawn(`.${pre}shown .${pre}band-step`);
            const options = drawn(`.${pre}shown .${pre}option`);
            const out: string[] = [];
            for (const step of steps) {
              const box = step.getBoundingClientRect();
              for (const along of [0.1, 0.5, 0.9]) {
                const hit = document.elementFromPoint(box.left + box.width * along, box.top + box.height / 2);
                if (hit !== step && !step.contains(hit)) out.push(`a tap ${String(along)} along ${step.getAttribute('aria-label') ?? ''} landed on ${hit?.className ?? 'nothing'}`);
              }
            }
            for (const option of options) {
              const box = option.getBoundingClientRect();
              for (const along of [0.03, 0.97]) {
                const hit = document.elementFromPoint(box.left + box.width * along, box.top + box.height / 2);
                if (hit !== null && steps.some((step) => step === hit || step.contains(hit))) out.push(`a tap ${String(along)} along the option ${option.textContent ?? ''} landed on an arrow`);
              }
            }
            return out;
          }, prefixFor(screen));
          expect(missed, `at ${String(width)}x${String(height)} on ${screen}, tab ${String(g)}`).toEqual([]);
        }
      }
      await page.context().close();
    }
  });

  it('0657 — THE ASK: an arrow that goes nowhere is not drawn, on a band of one and at a ladder’s end', async () => {
    // *"Side arrows show on menus even when nothing to nav to."* Nothing won: the gun band draws the ship's own alone.
    const page = await opened(1280, 720, false);
    await openHangar(page);
    const p = prefixFor('hangar');
    const gun = page.locator(`${shown('hangar')} [${SETTING_ATTR}="gun"]`).locator('xpath=ancestor::*[contains(@class, "' + p + 'band")][1]');
    for (const arrow of ['less', 'more'] as const) {
      const step = gun.locator(`.${p}band-${arrow}`);
      expect(await step.isDisabled(), `the gun's ${arrow} arrow goes somewhere on a band of one`).toBe(true);
      expect(await step.evaluate((el) => getComputedStyle(el).visibility), `the gun's ${arrow} arrow is drawn going nowhere`).toBe('hidden');
    }
    await page.context().close();
    // The tier at its hardest: its more arrow is gone, and its less arrow is drawn.
    const title = await opened(1280, 720, false);
    const t = prefixFor('title');
    const tier = title.locator(`${shown('title')} [${SETTING_ATTR}="difficulty"]`).locator('xpath=ancestor::*[contains(@class, "' + t + 'band")][1]');
    for (let i = 0; i < DIFFICULTY_KINDS.length; i++) if (!(await tier.locator(`.${t}band-more`).isDisabled())) await tier.locator(`.${t}band-more`).click();
    expect(await tier.locator(`.${t}band-more`).evaluate((el) => getComputedStyle(el).visibility), 'the hardest tier draws an arrow to more').toBe('hidden');
    expect(await tier.locator(`.${t}band-less`).evaluate((el) => getComputedStyle(el).visibility), 'the hardest tier draws no arrow back').toBe('visible');
    await title.context().close();
  });

  it('0657 — Bubble Jets is pictured as bubbles on the flame band, and a jet flame as a jet', async () => {
    // *"Bubble jets has wrong icon."* Its row draws it as bubbles (0595); its tile was every flame's tongue of fire.
    const everyWon = Object.fromEntries(SHIP_KINDS.map((kind) => [kind, true])) as typeof initialHangar.won;
    const page = await opened(1280, 720, false, null, serialiseHangar({ ...initialHangar, won: everyWon }));
    await openHangar(page);
    await page.locator(`.${prefixFor('hangar')}tab`, { hasText: SCREENS.parts.heading }).filter({ visible: true }).first().click();
    await page.waitForSelector(shown('parts'), { state: 'attached' });
    const flames = page.locator(`${shown('parts')} [${SETTING_ATTR}="flame"] .${prefixFor('parts')}option`);
    const bubbles = await flames.nth(FLAME_KINDS.indexOf('bubbleJets')).locator('.itc-shop-art-bubbles').count();
    expect(bubbles, 'Bubble Jets is not pictured as bubbles').toBe(1);
    const ion = await flames.nth(FLAME_KINDS.indexOf('ion')).locator('.itc-shop-art-bubbles').count();
    expect(ion, 'a jet flame is pictured as bubbles').toBe(0);
    await page.context().close();
  });

  it('draws each run’s tier on the title’s table, on a desktop and on a phone', async () => {
    const entries = DIFFICULTY_KINDS.map((difficulty, i) => ({ score: 3000 - i, bonus: 0, pilot: 'bo', difficulty, levels: i, cleared: false, continues: 0, when: i + 1 }));
    for (const [width, height, touch] of [
      [1280, 720, false],
      [667, 375, true],
      [480, 320, true],
    ] as const) {
      const page = await opened(width, height, touch, { v: SCORES_VERSION, entries });
      const cells = page.locator(`${shown('title')} .${prefixFor('title')}board-tier`);
      const said = await cells.evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().width > 0).map((el) => el.textContent ?? ''));
      expect(said, `at ${String(width)}x${String(height)} the table does not draw each run's tier`).toEqual(DIFFICULTY_KINDS.map((kind) => DIFFICULTIES[kind].short));
      await page.context().close();
    }
  });
});
