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

import type { BrowserContext } from 'playwright-core';

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
