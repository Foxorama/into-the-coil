import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { launch, openHangar, shown } from './title.ts';
import { seedOnce } from './seed.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { shardsFor } from '../src/content/score.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import type { Screen } from '../src/state/screens.ts';

/**
 * THE SCORE PAYS IN STAR SHARDS, IN THE PAGE — `docs/decisions/0522-the-score-pays-in-shards.md`.
 *
 * `tests/star-shards.test.ts` holds the ledger: the best credit, paid once. **What it cannot see is the
 * shell**: whether a run's end says what it paid, whether that is what the key now holds, and whether
 * the hangar shows the balance.
 *
 * ⚠️ **A RUN FLOWN HERE IS AN IDLE SHIP ON THE QUICKEST TIER, AND IT MAY EARN NOTHING.** So the account
 * and the key are held to AGREE — the key is the seed plus the account's line — rather than to a count,
 * and the hangar's balance is checked against a seed that is not nothing. A run that earned no shard
 * cannot tell an unpaid run from a paid zero; the ledger's own test is where *paid* is held.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 150_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

const QUICKEST = DIFFICULTY_KINDS.reduce((fewest, kind) =>
  DIFFICULTIES[kind].lives < DIFFICULTIES[fewest].lives ? kind : fewest,
);

/** A screen's account, label to the words its value says. */
async function account(page: Page, screen: Screen): Promise<Record<string, string>> {
  const p = prefixFor(screen);
  return page.evaluate((prefix) => {
    const labels = [...document.querySelectorAll('.' + prefix + 'sheet-label')].map((l) => l.textContent ?? '');
    const values = [...document.querySelectorAll('.' + prefix + 'sheet-value')].map((v) => {
      const said = v.querySelector('.' + prefix + 'sheet-said');
      return (said ?? v).textContent ?? '';
    });
    return Object.fromEntries(labels.map((label, i) => [label, values[i] ?? '']));
  }, p);
}

describe.runIf(chromePath)('0522 — a run’s end pays its shards, and the hangar holds them', () => {
  it('the game over says what the run paid, the key holds it, and the hangar shows the balance', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const seed = 250;
    await seedOnce(context, HANGAR_KEY, serialiseHangar({ ...initialHangar, shards: seed }));
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);

    // The hangar shows what the player holds before anything is flown.
    await openHangar(page);
    expect((await account(page, 'hangar'))['Star Shards'], 'the hangar does not show the balance').toBe(String(seed));
    await page.keyboard.press('Escape');

    // No quarters is the default: the run ends on the game over, which is the run's end.
    await launch(page, QUICKEST);
    await page.waitForSelector(shown('ended'), { timeout: 120_000 });
    const said = await account(page, 'ended');
    const final = Number(said['Final score']);
    expect(Number.isFinite(final), 'the game over has no final score to pay on').toBe(true);
    expect(said['Star Shards'], 'the game over does not say what the run paid').toBe('+' + String(shardsFor(final)));

    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.shards, 'the key does not hold what the account says was paid').toBe(seed + shardsFor(final));
    await context.close();
  });
});
