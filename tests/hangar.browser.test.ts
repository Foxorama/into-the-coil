import { describe, it, expect, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Page } from 'playwright-core';
import { chromePath } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, fly, inView, openHangar, shown } from './title.ts';
import { keptContext, keyedOut, seeded } from './seed.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';

/**
 * THE HANGAR OPENS, IN THE PAGE — `docs/decisions/0521-the-hangar-opens.md`.
 *
 * `tests/hangar.test.ts` holds the unlock and the key. **What it cannot see is the picture**: whether a
 * shut dash can be pressed, whether the readout over the hangar wears the dash the band shows, and
 * whether the run that follows is flown in it. The plate is a class on the readout, which is the
 * dash the player sees — 0027's *at least one assertion in what the player experiences*.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

const HANGAR = prefixFor('hangar');
const dashes = `${shown('hangar')} [${SETTING_ATTR}="plate"] .${HANGAR}option`;
const faces = `${shown('hangar')} [${SETTING_ATTR}="pilot"] .${HANGAR}option`;

/**
 * Which of the dash band's options can be fitted, in the ship table's order. 0561: a slot's shut option
 * is marked `aria-disabled` and stays pressable, so it can be tried on; `disabled` is the other bands'.
 */
async function openDashes(page: Page): Promise<boolean[]> {
  return page.evaluate((sel) => [...document.querySelectorAll<HTMLButtonElement>(sel)].map((b) => !b.disabled && b.getAttribute('aria-disabled') !== 'true'), dashes);
}

/** The motif class the readout wears, read off the element the player sees. */
async function worn(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const hud = document.querySelector('.itc-playing-hud');
    if (hud === null || !hud.classList.contains('itc-playing-hud-shown')) return null;
    const motif = [...hud.classList].find((c) => /^itc-playing-hud-(bracket|orbit|checker|walnut)$/.test(c));
    return motif === undefined ? null : motif.replace('itc-playing-hud-', '');
  });
}

describe.runIf(chromePath)('0521 — the hangar fits what has been won, and the run wears it', () => {
  it('shuts what is not won, fits what is, keeps it, and flies in it', async () => {
    // On disk, as a player's browser keeps it — `tests/seed.ts` says why not a fresh context's memory.
    const { context, close } = await keptContext({ width: 1280, height: 720 });
    // The fighter and the estate won in; the default pilot's Firebird not. Filled before the page runs.
    const won = { ...initialHangar, won: { ...initialHangar.won, fighter: true, estate: true } };
    // From a page the browser has finished loading, so a reload finds it — `tests/seed.ts`, 0570.
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar(won));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);

    // The default pilot's ship has not been won in: its own dash only, and the band says why.
    const firebird = SHIP_KINDS.indexOf('firebird');
    expect(await openDashes(page), 'a dash was open on a ship never won in').toEqual(SHIP_KINDS.map((_, i) => i === firebird));
    expect(await page.locator(`${shown('hangar')} .${HANGAR}band-hint`).allTextContents()).toContain(
      'Beat the jellyfish in the Firebird to change its dash',
    );
    expect(await worn(page), 'the readout over the hangar is not the dash it fits').toBe(SHIPS.firebird.hud.motif);

    // Hook, whose fighter is won: the fighter's dash and the won estate's are open, the others shut.
    const hook = GOLFER_KINDS.find((kind) => GOLFERS[kind].ship === 'fighter')!;
    await page.locator(`${faces} >> nth=${GOLFER_KINDS.indexOf(hook)}`).click();
    expect(await openDashes(page)).toEqual(SHIP_KINDS.map((kind) => kind === 'fighter' || kind === 'estate'));
    // A pointer's press on the highlighted pilot here is a look, not a flight: the hangar is still up.
    await page.locator(`${faces} >> nth=${GOLFER_KINDS.indexOf(hook)}`).click();
    expect(await page.locator(shown('hangar')).count(), 'a press on a pilot in the hangar flew them').toBe(1);

    // A shut dash cannot be pressed; the estate's is fitted, and the readout wears it at once.
    // 0579: on the *Cockpit* sub-tab.
    await inView(page, 'hangar', 'plate');
    await page.locator(`${dashes} >> nth=${SHIP_KINDS.indexOf('caddie')}`).click({ force: true });
    // 0561: a press on a shut dash tries it on — the readout wears it, to be seen — and fits nothing.
    const refused = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(refused.plate.fighter, 'a shut dash was fitted').toBe('fighter');
    await page.locator(`${dashes} >> nth=${SHIP_KINDS.indexOf('estate')}`).click();
    expect(await worn(page), 'the readout did not put on the dash fitted').toBe(SHIPS.estate.hud.motif);
    const written = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(written.plate.fighter, 'fitting a dash did not write it').toBe('estate');

    // Back on the title the pilot is Hook, and the run is flown in the fighter wearing the estate's dash.
    await back(page, 'hangar');
    await page.waitForSelector(shown('title'), { state: 'attached' });
    await fly(page);
    expect(await worn(page), 'the run did not wear the dash fitted in the hangar').toBe(SHIPS.estate.hud.motif);

    // And a visit later it is still fitted.
    await page.reload();
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);
    // The key first, so a fitting lost from storage and one lost on the way to the picture are two failures.
    // The raw text in the message, so a store that lost the write and one that kept the wrong thing differ.
    const raw = await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY);
    const reread = hangarFrom(raw, initialHangar);
    expect(reread.plate.fighter, `the fitting was gone from the key after a reload — it held ${String(raw)}; ${await keyedOut(context, page)}`).toBe('estate');
    // The pilot is picked each visit (0415), so Hook is chosen again; the fighter's dash was kept.
    await page.locator(`${faces} >> nth=${GOLFER_KINDS.indexOf(hook)}`).click();
    /*
      ⚠️ **WHAT THE SCREEN SAYS, IN THE MESSAGE** — once red on CI and never here (2026-10-05): the readout
      wore the fighter's own dash after the reload. The pilot on the card and the dash the band marks say
      whether the click chose Hook, and whether the hangar read the fitting, or only the readout missed it.
    */
    const seen = await page.evaluate(
      ([card, marked]) => ({
        pilot: document.querySelector(card!)?.textContent ?? null,
        dash: document.querySelector(marked!)?.textContent ?? null,
      }),
      [`${shown('hangar')} .${HANGAR}pilot-name`, `${dashes}[aria-pressed="true"]`],
    );
    expect(await worn(page), `the fitting was forgotten across a reload — the card said ${String(seen.pilot)}, the band ${String(seen.dash)}`).toBe(
      SHIPS.estate.hud.motif,
    );
    await close();
  });
});
