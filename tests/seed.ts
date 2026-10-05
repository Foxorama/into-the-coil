/**
 * A kept key filled before the game's page first runs — for every browser test that boots on a store
 * already written, and especially one that reloads to see what the page itself wrote.
 *
 * ⚠️ **ONCE PER TAB, MARKED ON THE TAB AND NOT IN THE STORE UNDER TEST.** An init script runs again on
 * every reload. The one this replaces filled the key whenever it read empty — and on CI a store read
 * empty for a moment after a reload, so the seed was written again over what the page had just kept,
 * and the test failed on the very thing it exists to check: *the crossing was forgotten across a
 * reload* (0510's), *the fitting was gone from the key after a reload* (0521's). `window.name` outlives
 * a reload in the same tab and is not storage.
 *
 * ⚠️ **ON THE GAME'S PAGE ONLY.** The blank page a new tab opens on runs init scripts too, and
 * `window.name` carries across a navigation, so marking the tab there would skip the page the seed is
 * for — which is what the first draft of this did.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext } from 'playwright-core';
import { chromePath } from './chromium.ts';

/**
 * A browser whose storage is on disk, as a player's is — for a test that reloads to read what the page
 * kept. Closing it closes the browser and deletes its profile.
 *
 * ⚠️ **NOT `browser.newContext()`, WHOSE STORAGE IS ONLY IN MEMORY.** The seed above answered the first
 * reading of these failures, and they came back: on CI, four times across 0510's and 0521's tests, the
 * reloaded page found its key absent — `getItem` gave `null`, the seed's own write gone with the page's
 * — and nothing in `src/` removes a key. The store had emptied, and the store was the in-memory one a
 * player's browser never has. Not reproduced here: 48 reloads under load, and memory pressure forced
 * through the DevTools protocol, all kept it; so the mechanism is unproved and the environment the test
 * ran in is what changed. `itc-keyed-out` names it if it comes back (`keyedOut`).
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
export async function keyedOut(context: BrowserContext, page: import('playwright-core').Page): Promise<string> {
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  return keys.length === 0 ? `itc-keyed-out (no keys, ${String(context.pages().length)} tabs)` : `keys ${keys.join(', ')}`;
}

/** Fill `key` with `value` once, on the first load of the game's page in each of `context`'s tabs. */
export async function seedOnce(context: BrowserContext, key: string, value: string): Promise<void> {
  await context.addInitScript(
    ([k, v]) => {
      const mark = 'itc-seeded:' + k!;
      if (location.protocol !== 'file:' || window.name.split('|').includes(mark)) return;
      window.name = window.name === '' ? mark : window.name + '|' + mark;
      localStorage.setItem(k!, v!);
    },
    [key, value],
  );
}
