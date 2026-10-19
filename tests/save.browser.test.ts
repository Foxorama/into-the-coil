import { describe, it, expect, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { Page } from 'playwright-core';
import { chromePath } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openSettings, shown } from './title.ts';
import { keptContext, seeded } from './seed.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { CODE_HASH, backupOf, codeOf, restoreFrom, type Kept } from '../src/save/backup.ts';
import { initialState } from '../src/state/root.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE SAVE TRAVELS, IN THE PAGE — `docs/decisions/0641-the-save-travels.md`.
 *
 * `tests/backup.test.ts` holds the format. **What it cannot see is the shell**: that the tab's file is
 * the save the page holds, that a file or a code loaded is what the page boots on afterwards, and that
 * a link with a code in it is offered on the title and then gone from the address bar. Each is checked
 * where it lands — in the store the reloaded page read — and never in what a sheet said.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const SAVE = prefixFor('save');

/** A save that holds `shards` Star Shards and nothing else off the defaults. */
const withShards = (shards: number): Kept => ({
  scores: [],
  settings: initialState.settings,
  hangar: { ...initialState.hangar, shards },
});

/** The Star Shards the page's store holds. */
async function shardsKept(page: Page): Promise<number> {
  const text = await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY);
  return hangarFrom(text, initialState.hangar).shards;
}

/** From the title: Settings, then its Save tab. */
async function openSave(page: Page): Promise<void> {
  await openSettings(page);
  await page.locator(shown('settings') + ' .' + prefixFor('settings') + 'tab', { hasText: SCREENS.save.heading }).first().click();
  await page.waitForSelector(shown('save'), { state: 'attached' });
}

/** Press the Save tab's button `index`. */
async function press(page: Page, index: number): Promise<void> {
  await page.locator(shown('save') + ' .' + SAVE + 'action', { hasText: SCREENS.save.actions[index]!.label }).first().click();
}

/** Answer the sheet up on `screen` with its button `label`, and wait for the page the answer reloads. */
async function replace(page: Page, screen: 'save' | 'title'): Promise<void> {
  const sheet = '.' + prefixFor(screen) + 'ask';
  await page.waitForSelector(sheet, { state: 'visible' });
  expect(await page.textContent(sheet), 'the sheet does not ask to replace').toContain('Replace the save here?');
  await Promise.all([page.waitForEvent('load'), page.locator(sheet + ' .' + prefixFor(screen) + 'action', { hasText: 'Replace' }).click()]);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
}

describe.runIf(chromePath)('0641 — the save leaves the device and comes back', () => {
  it('saves the page as a file, and loads a file, a code and a link in its place', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'itc-save-'));
    const { context, close } = await keptContext({ width: 1280, height: 720 });
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar(withShards(4321).hangar));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openSave(page);
    expect(await page.textContent('.' + SAVE + 'note'), 'the tab does not say what is here').toContain('4321 ✦');

    // Out: the file is the save the page holds.
    const [download] = await Promise.all([page.waitForEvent('download'), press(page, 0)]);
    const saved = await readFile((await download.path()) ?? '', 'utf8');
    const out = restoreFrom(saved, initialState);
    expect(out.ok && out.kept.hangar.shards, 'the file saved is not the save the page holds').toBe(4321);
    expect(download.suggestedFilename()).toMatch(/-save-\d{4}-\d\d-\d\d\.json$/);
    await page.locator('.' + SAVE + 'ask .' + SAVE + 'action', { hasText: 'OK' }).click();

    // In from a file: a different save, so the store after the reload can only be the file's.
    const file = join(folder, 'other.json');
    await writeFile(file, backupOf(withShards(777), 1_800_000_000_000));
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), press(page, 1)]);
    await chooser.setFiles(file);
    await replace(page, 'save');
    expect(await shardsKept(page), 'a file loaded is not what the page booted on').toBe(777);

    // In from a code, pasted.
    await pastIntro(page);
    await openSave(page);
    const code = await codeOf(backupOf(withShards(555), 0));
    page.once('dialog', (dialog) => void dialog.accept(code));
    await press(page, 3);
    await replace(page, 'save');
    expect(await shardsKept(page), 'a code entered is not what the page booted on').toBe(555);

    // In from a link: offered on the title, and out of the address bar once read.
    const link = await codeOf(backupOf(withShards(999), 0));
    // Off the page first: a goto that only changes the hash is the same document, and the game would not boot again.
    await page.goto('about:blank');
    await page.goto(dist + CODE_HASH + link);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    expect(page.url(), 'the code stayed in the address bar').not.toContain(CODE_HASH);
    await pastIntro(page);
    await replace(page, 'title');
    expect(await shardsKept(page), 'a link opened is not what the page booted on').toBe(999);

    await close();
    await rm(folder, { recursive: true, force: true });
  });
});
