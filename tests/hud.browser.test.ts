import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { PICKUPS, PICKUP_KINDS } from '../src/content/pickups.ts';
import { MAX_SHIELDS } from '../src/content/ships.ts';

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

vi.setConfig({ testTimeout: 60_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function open(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

const HUD = '.itc-playing-hud';
const shown = (page: Page, selector: string): Promise<boolean> =>
  page.evaluate((s: string) => {
    const el = document.querySelector(s);
    return el instanceof HTMLElement && getComputedStyle(el).display !== 'none';
  }, selector);

describe.runIf(chromePath)('the title screen says what a pickup is for', () => {
  it('lists every pickup, with its name and what it does', async () => {
    /*
      ⚠️ **Driven from `PICKUP_KINDS` rather than from a list typed here**, so a pickup added to the
      table fails this until it appears in the key. That is the whole reason the key is built by
      walking the hub: a legend maintained by hand goes stale the first time somebody is in a hurry.
    */
    const page = await open();
    const text = (await page.textContent('.' + prefixFor('title') + 'key')) ?? '';
    for (const kind of PICKUP_KINDS) {
      expect(text, `the key does not name ${kind}`).toContain(PICKUPS[kind].label);
      expect(text, `the key does not say what ${kind} does`).toContain(PICKUPS[kind].hint);
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
    }, '.' + prefixFor('title') + 'key-icon');

    expect(icons.length, 'the key has no icons at all').toBe(PICKUP_KINDS.length);
    for (const icon of icons) {
      expect(icon.canvas, 'a key icon is not a baked sprite').toBe(true);
      expect(icon.inked, 'a key icon was baked empty').toBeGreaterThan(0);
    }
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
    const text = (await page.textContent('.' + prefixFor('title') + 'key')) ?? '';
    for (const enemy of ['drifter', 'lancer', 'weaver', 'turret', 'charger', 'warden']) {
      expect(text.toLowerCase(), `the key explains the ${enemy}, which play asked it not to`).not.toContain(enemy);
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

  it('draws one pip per shield the ship can carry, and a fresh life carries none', async () => {
    /*
      ⚠️ **THE PIPS CHANGED MEANING AND THE COUNT CHANGED WITH THEM.** They were one per point of the
      ship's health, when a ship had five; the hull is one hit now and the row is the SHELL — see
      decision 0050. A life therefore opens with three EMPTY sockets rather than a full bar, which is
      the honest picture: nothing stands between this ship and the next thing that touches it until
      the player has flown for a shield.
    */
    const page = await open();
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    const pips = await page.evaluate(() =>
      [...document.querySelectorAll('.itc-playing-hud-pip')].map((el) => el.classList.contains('itc-playing-hud-spent')),
    );
    expect(pips.length, 'the pip row is not the shell the ship can carry').toBe(MAX_SHIELDS);
    expect(pips.every((spent) => spent), 'a fresh life opens already shielded').toBe(true);
    await page.context().close();
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
      is stated directly: the two states differ by FILL, and they agree on their border colour, which
      is what makes the difference survive a palette swap.
    */
    const page = await open();
    await page.click('.' + prefixFor('title') + 'action');
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
        return {
          spent: el.classList.contains('itc-playing-hud-spent'),
          background: computed.backgroundColor,
          border: computed.borderTopColor,
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
      { timeout: 60_000 },
    );
    const after = await page.textContent('.itc-playing-hud-group span');
    expect(after, 'the run spent a life and the readout did not move').not.toBe(before);
    const label = await page.getAttribute('.itc-playing-hud-group[role="img"]', 'aria-label');
    expect(label, 'the spoken shield readout is not a count of shields').toMatch(
      new RegExp('Shield \\d+ of ' + String(MAX_SHIELDS)),
    );
    await page.context().close();
  });

});
