/**
 * A kept key filled before the game's page first runs — for every browser test that boots on a store
 * already written, and especially one that reloads to see what the page itself wrote.
 *
 * ⚠️ **WRITTEN FROM A PAGE THE BROWSER HAS FINISHED LOADING, NEVER FROM AN INIT SCRIPT** — 0570. The
 * seed this replaces was an init script that wrote the key at document start. On CI that write
 * sometimes reached the tab and not the browser: the page read its key and every write it made after
 * it, a reload found an empty store, a second tab in the same browser found it empty too, and nothing
 * was on disk. Every red 0510 and 0521 ever had was this — 5 in 270 reloads when the test's own flow
 * was looped on CI, against 0 in 720 seeded this way. A test that never reloads could not see it,
 * which is why twelve of them passed on it for days.
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { BrowserContext, Page } from 'playwright-core';
import { chromePath } from './chromium.ts';

/**
 * A browser whose storage is on disk, as a player's is — for a test that reloads to read what the page
 * kept. Closing it closes the browser and deletes its profile.
 *
 * ⚠️ **NOT `browser.newContext()`, WHOSE STORAGE IS ONLY IN MEMORY** — a player's browser never has
 * that store. This was first written as the answer to the empty store, and was not it: the seed was.
 * It stays because a reload is meant to read what a player's browser would keep. `itc-keyed-out` names
 * an empty store if one comes back (`keyedOut`).
 */
export async function keptContext(viewport: { width: number; height: number }): Promise<{ context: BrowserContext; close: () => Promise<void> }> {
  const { chromium } = await import('playwright-core');
  const profile = await mkdtemp(join(tmpdir(), 'itc-kept-'));
  const context = await chromium.launchPersistentContext(profile, { executablePath: chromePath ?? undefined, headless: true, viewport, deviceScaleFactor: 1 });
  return {
    context,
    close: async () => {
      await context.close();
      await rm(profile, { recursive: true, force: true });
    },
  };
}

/**
 * What the page's whole store held, for a failure's message: `itc-keyed-out` when nothing at all — the
 * store emptied, rather than one key lost or written wrong.
 */
export async function keyedOut(context: BrowserContext, page: Page): Promise<string> {
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  return keys.length === 0 ? `itc-keyed-out (no keys, ${String(context.pages().length)} tabs)` : `keys ${keys.join(', ')}`;
}

/**
 * Fill `key` with `value`, then open the game's page at `url` on it — in `context`'s first tab, or a new
 * one. The key is written by an ordinary script on a blank `file:` page that has finished loading; every
 * `file:` page shares one store, so the game's page opens on it.
 */
export async function seeded(context: BrowserContext, url: string, key: string, value: string): Promise<Page> {
  const dir = await mkdtemp(join(tmpdir(), 'itc-seed-'));
  const blank = join(dir, 'seed.html');
  await writeFile(blank, '<!doctype html><title>seed</title>');
  const page = context.pages()[0] ?? (await context.newPage());
  try {
    await page.goto(pathToFileURL(blank).href);
    await page.evaluate(([k, v]) => localStorage.setItem(k!, v!), [key, value]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  await page.goto(url);
  return page;
}
