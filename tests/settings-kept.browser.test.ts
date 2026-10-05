import { describe, it, expect, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Page } from 'playwright-core';
import { chromePath } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { choose, openSettings } from './title.ts';
import { keptContext, keyedOut, seedOnce } from './seed.ts';
import { SETTINGS_KEY, serialiseSettings, settingsFrom } from '../src/save/settings.ts';
import { initialSettings, type SettingsState } from '../src/state/slices/settings.ts';
import { STYLE_KINDS } from '../src/content/styles.ts';
import { SOUND_KINDS } from '../src/content/sound.ts';
import { TRAVEL_KINDS } from '../src/content/travel.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import type { Screen, SettingName } from '../src/state/screens.ts';

/**
 * THE SETTINGS ARE KEPT, IN THE PAGE — `docs/decisions/0510-the-settings-are-kept.md`.
 *
 * `tests/settings-kept.test.ts` holds what the key reads and writes. **What it cannot see is the
 * shell**: whether the page reads the key before it marks a band, and whether a band pressed writes
 * it. Both are lines in `src/app/mount.ts` over a real page, so this boots one with the key already
 * filled, reads the bands, presses one, and boots again.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

/** Every kept setting off its default. */
const kept: SettingsState = {
  ...initialSettings,
  style: STYLE_KINDS.find((k) => k !== initialSettings.style)!,
  sound: SOUND_KINDS.find((k) => k !== initialSettings.sound)!,
  difficulty: DIFFICULTY_KINDS.find((k) => k !== initialSettings.difficulty)!,
};

/** Which option of `setting`'s band on `screen` is marked on. */
async function marked(page: Page, screen: Screen, setting: SettingName): Promise<number> {
  return page.evaluate(
    ([sel]) => [...document.querySelectorAll(sel!)].findIndex((b) => b.getAttribute('aria-pressed') === 'true'),
    [`[${SETTING_ATTR}="${setting}"] .${prefixFor(screen)}option`],
  );
}

describe.runIf(chromePath)('0510 — the page opens the way it was left', () => {
  it('reads the key before it marks a band, and a band pressed is written for the next visit', async () => {
    // On disk, as a player's browser keeps it — `tests/seed.ts` says why not a fresh context's memory.
    const { context, close } = await keptContext({ width: 1280, height: 720 });
    // Filled before the page's own script runs, and only once — a reload must read what the page wrote.
    await seedOnce(context, SETTINGS_KEY, serialiseSettings(kept));
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);

    expect(await marked(page, 'title', 'difficulty'), 'the title opened on the default tier').toBe(
      DIFFICULTY_KINDS.indexOf(kept.difficulty),
    );
    await openSettings(page);
    expect(await marked(page, 'settings', 'style'), 'Settings opened on the default look').toBe(STYLE_KINDS.indexOf(kept.style));
    expect(await marked(page, 'settings', 'sound'), 'Settings opened on the default sound').toBe(SOUND_KINDS.indexOf(kept.sound));

    // A band pressed, and the page booted again.
    const travel = TRAVEL_KINDS.find((k) => k !== initialSettings.travel)!;
    await choose(page, 'travel', TRAVEL_KINDS.indexOf(travel));
    const written = settingsFrom(await page.evaluate((key) => localStorage.getItem(key), SETTINGS_KEY), initialSettings);
    expect(written.travel, 'pressing a band did not write it').toBe(travel);
    expect(written.style, 'writing one setting lost another').toBe(kept.style);

    await page.reload();
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    /*
      ⚠️ **THE KEY AS THE RELOADED PAGE FOUND IT, IN THE MESSAGE** — red twice on CI and never here
      (2026-10-05). A key that lost the write and a band that does not show a kept value fail on the same
      line; the text read before anything is pressed tells the two apart.
    */
    const reread = await page.evaluate((key) => localStorage.getItem(key), SETTINGS_KEY);
    const store = await keyedOut(context, page);
    await pastIntro(page);
    await openSettings(page);
    expect(await marked(page, 'settings', 'travel'), `the crossing was forgotten across a reload — the key held ${String(reread)}; ${store}`).toBe(
      TRAVEL_KINDS.indexOf(travel),
    );
    await close();
  });
});
