import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { PICKUPS, PICKUP_KINDS, faceOf } from '../src/content/pickups.ts';
import { MAX_SHIELDS } from '../src/content/ships.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { triggerRadius, triggerX, triggerY } from '../src/app/touch.ts';

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

async function open(hasTouch = false): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    // ⚠️ The tap strip is drawn on a CAPABILITY, not on a guess about what the player is holding —
    // `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md`. This is the capability.
    hasTouch,
  });
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
    /*
      ⚠️ **EVERY FACE, since 0233.** A cycling pickup is several offers wearing one silhouette in
      turn, and the key names each — the gun rather than the pickup — so a player knows the shape
      is good before they cross a lane for it. `faceOf` is the row's own answer for each face.
    */
    for (const kind of PICKUP_KINDS) {
      PICKUPS[kind].faces.forEach((_sprite, face) => {
        const said = faceOf(kind, face);
        expect(text, `the key does not name face ${face} of ${kind}`).toContain(said.label);
        expect(text, `the key does not say what face ${face} of ${kind} does`).toContain(said.hint);
      });
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

    // One icon per FACE, since 0233 — a cycling pickup shows each of its glyphs.
    const faces = PICKUP_KINDS.reduce((sum, kind) => sum + PICKUPS[kind].faces.length, 0);
    expect(icons.length, 'the key has no icons at all').toBe(faces);
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

/**
 * A TRIGGER IS A PLACE ON THE GLASS, AND THE PLACE IS A BUTTON.
 *
 * `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md`. Reported from play: *"how do you fire
 * bombs on mobile? I can do one and then can't fire any more."* Then
 * `docs/decisions/0358-a-trigger-is-a-button.md`: *"on mobile add a bomb button"*, and the strip
 * that was the leading quarter of the glass became a disc under the thumb.
 *
 * ⚠️ **The half that has to be a browser test is that the button is DRAWN WHERE THE TAP IS HEARD.**
 * `tests/touch.test.ts` holds the hit test and can hold nothing about pixels; a button whose picture
 * and whose hit region disagree is a player pressing what they can see and something else happening,
 * which is `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` with the sign
 * reversed.
 */
describe.runIf(chromePath)('the trigger button says where the bomb is', () => {
  const TRIGGER = '.itc-playing-trigger';

  it('is not drawn on a device with nothing to tap it with', async () => {
    const page = await open(false);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    expect(await shown(page, TRIGGER), 'a desktop was shown a place to put a finger').toBe(false);
    await page.context().close();
  });

  it('is drawn on a touch device, once a run is running and never before it', async () => {
    const page = await open(true);
    expect(await shown(page, TRIGGER), 'the button was up before there was a run to fire in').toBe(false);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    expect(await shown(page, TRIGGER), 'a phone was shown no place to press').toBe(true);
    await page.context().close();
  });

  it('draws one button per owned trigger, where the hit test listens, in pixels of the canvas', async () => {
    /*
      ⚠️ **THE ONE THAT MATTERS, and it is measured in pixels against the canvas.** The reported bug
      was a strip split into the binding BUDGET rather than into what the ship owns, so half of it was
      bound to a slot the shell answers with silence — a piece of the screen that swallows taps and
      is drawn nowhere. This asserts the picture IS the hit region: the disc's centre and its size on
      the canvas are what the touch source's own arithmetic says for the canvas's own box.

      ⚠️ **Against the functions and not against the constants**, because the CSS is the constants
      interpolated and a test that read the same constants back would prove the code agrees with
      itself (0027). The functions are the other reader — the hit test's.
    */
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    const geometry = await page.evaluate(() => {
      const canvas = document.querySelector('#app canvas');
      const trigger = document.querySelector('.itc-playing-trigger');
      const buttons = [...document.querySelectorAll('.itc-playing-trigger-button')];
      if (!(canvas instanceof HTMLElement) || !(trigger instanceof HTMLElement)) return null;
      const c = canvas.getBoundingClientRect();
      return {
        canvas: { width: c.width, height: c.height },
        buttons: buttons.map((b) => {
          const r = b.getBoundingClientRect();
          return { cx: r.left + r.width / 2 - c.left, cy: r.top + r.height / 2 - c.top, width: r.width, height: r.height };
        }),
        // Not a control, and it must never become one: the canvas underneath is what hears the tap.
        events: getComputedStyle(trigger).pointerEvents,
      };
    });
    expect(geometry, 'there is no button to measure').not.toBeNull();
    const g = geometry!;
    // A run opens carrying exactly one special — the bomb — so there is one button.
    expect(g.buttons.length, 'the buttons are not one per owned trigger').toBe(1);
    expect(g.events, 'the button would swallow the tap it exists to advertise').toBe('none');
    const b = g.buttons[0]!;
    const r = triggerRadius(g.canvas.width, g.canvas.height);
    expect(Math.abs(b.cx - triggerX(g.canvas.width, g.canvas.height)), 'the button is not drawn where the tap is heard, along the glass').toBeLessThan(2);
    expect(Math.abs(b.cy - triggerY(g.canvas.width, g.canvas.height, 0)), 'the button is not drawn where the tap is heard, across the glass').toBeLessThan(2);
    expect(Math.abs(b.width - 2 * r), 'the disc is not the size the hit test listens on').toBeLessThan(2);
    expect(Math.abs(b.height - 2 * r), 'the disc is not round').toBeLessThan(2);
    // And it is a thumb's size in the player's own pixels, not a sliver: 0358's claim, as the player has it.
    expect(b.width, 'the button is smaller than a fingertip').toBeGreaterThan(44);
    await page.context().close();
  });

  it('shows the real baked sprite of the special the button fires, and how many are left', async () => {
    // The same rule as the title screen's key: the real art, never a drawing of it. A glyph here
    // would be a second description of the bomb's silhouette.
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(200);
    const band = await page.evaluate(() => {
      const el = document.querySelector('.itc-playing-trigger-button');
      const icon = document.querySelector('.itc-playing-trigger-icon');
      let inked = 0;
      if (icon instanceof HTMLCanvasElement) {
        const ctx = icon.getContext('2d');
        const data = ctx?.getImageData(0, 0, icon.width, icon.height).data;
        if (data) for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) inked++;
      }
      return { text: el?.textContent ?? '', isCanvas: icon instanceof HTMLCanvasElement, inked };
    });
    expect(band.isCanvas, 'the band draws a glyph rather than the baked sprite').toBe(true);
    expect(band.inked, 'the band’s icon is blank').toBeGreaterThan(0);
    expect(band.text, `the band does not say how many are left: ${band.text}`).toMatch(/\d/);
    await page.context().close();
  });
});

describe.runIf(chromePath)('the readout and the boss bar share the top of the screen', () => {
  it('THE REPORTED ONE: the bar never lies over the readout, on a phone or a monitor', async () => {
    /*
      Played on a phone: *"the boss bars overlap the bomb numbers on mobile."* The bar stood at 31% of
      the width and the readout is about fourteen of its own em, which on a phone is 2.4vw — a third
      of the width. Asserted in pixels on the glass, at the widest readout the game can show: every
      shield pip, two-digit counts and the retro face, whose monospace is the widest of the two.

      The bar is raised by its class rather than by flying to a boss: what is in question is where the
      two are laid out, and a boss fight is two minutes of a browser test that says nothing more.

      ⚠️ **ONE PAGE, RESIZED, rather than a page per size.** Four page loads each waiting on a run to
      start took twenty seconds alone and timed out under `npm run check`; the layout is CSS, and a
      resize reflows it exactly as a different phone would.
    */
    const page = await open(true);
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForSelector('.itc-playing-hud-shown', { timeout: 15_000 });
    for (const [width, height] of [
      [667, 375],
      [844, 390],
      [915, 412],
      [1280, 720],
    ] as const) {
      await page.setViewportSize({ width, height });
      // Raised after the resize, because a resize repaints the chrome and takes a forced class down.
      const laid = await page.evaluate((shields: number) => {
        const hud = document.querySelector<HTMLElement>('.itc-playing-hud')!;
        const bar = document.querySelector<HTMLElement>('.itc-playing-boss')!;
        hud.classList.add('itc-playing-face-pixel');
        bar.classList.add('itc-playing-boss-shown');
        const shield = hud.querySelector<HTMLElement>('[role="img"]')!;
        const pips = shield.querySelectorAll<HTMLElement>('.itc-playing-hud-pip');
        for (const pip of pips) pip.style.display = '';
        for (let i = pips.length; i < shields; i++) shield.appendChild(pips[0]!.cloneNode(true));
        for (const count of hud.querySelectorAll('.itc-playing-hud-group > span')) count.textContent = '×99';
        const readout = hud.getBoundingClientRect();
        const box = bar.getBoundingClientRect();
        return { readoutRight: readout.right, barLeft: box.left, barRight: box.right, barWidth: box.width };
      }, MAX_SHIELDS);
      const at = `${width}×${height}`;
      expect(laid.barWidth, `at ${at} the bar was laid out with no width at all`).toBeGreaterThan(0);
      expect(
        laid.barLeft,
        `at ${at} the bar starts at ${laid.barLeft.toFixed(0)} px and the readout runs to ${laid.readoutRight.toFixed(0)} px`,
      ).toBeGreaterThanOrEqual(laid.readoutRight);
      expect(laid.barRight, `at ${at} the bar runs off the screen`).toBeLessThanOrEqual(width);
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

  it('draws one pip per shield the ship can carry on its tier, and a fresh life lights the tier’s shell', async () => {
    /*
      ⚠️ **THE PIPS CHANGED MEANING AND THE COUNT CHANGED WITH THEM.** They were one per point of the
      ship's health, when a ship had five; the hull is one hit now and the row is the SHELL — see
      decision 0050.

      ⚠️ **AND SINCE 0355 THE ROW IS THE TIER'S.** Pressed on every tier's own button, in the order
      `src/state/screens.ts` builds them: the sockets SEEN are the ones the tier lets the ship carry —
      three and three and none — and the ones LIT are what its life opens with, so a Legendary life
      opens full and a Savior one opens on three empty sockets, as every life did before. Counted as
      the player sees them: a socket hidden by the stylesheet is not a socket.
    */
    for (const [index, tier] of DIFFICULTY_KINDS.entries()) {
      const row = DIFFICULTIES[tier];
      const page = await open();
      await page.locator('.' + prefixFor('title') + 'action').nth(index).click();
      await page.waitForTimeout(200);
      const pips = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.itc-playing-hud-pip')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => el.classList.contains('itc-playing-hud-spent')),
      );
      expect(pips.length, `the pip row on ${tier} is not the shell the tier lets the ship carry`).toBe(row.shellCap);
      expect(pips.filter((spent) => !spent).length, `a fresh ${tier} life does not light the shell it opens with`).toBe(
        row.shellOpen,
      );
      await page.context().close();
    }
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
    // ⚠️ The first tier whose life opens on EMPTY sockets, by the row rather than by name — since 0355
    // a Legendary life opens full, so nothing on it would be spent to compare against.
    const empty = DIFFICULTY_KINDS.findIndex((k) => DIFFICULTIES[k].shellOpen === 0 && DIFFICULTIES[k].shellCap > 0);
    await page.locator('.' + prefixFor('title') + 'action').nth(empty).click();
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

describe.runIf(chromePath)('the readout follows what the player spends', () => {
  it('follows a spent charge, which changes no screen at all', async () => {
    /*
      ⚠️ **THE BUG THE BOMB MADE VISIBLE.** `dispatch` compared the incoming run slice to
      `state.run` *after* `state` had already been reassigned — a thing compared to itself — so the
      readout only ever refreshed when the SCREEN changed. It looked fine because both things it
      showed happened to change at a screen boundary: a death that ended the run raised the game-over
      screen, and the lives count updated on the way past.

      A charge is the first thing in the game that changes mid-run with no screen anywhere near it,
      which is why this is the test that can see it. It is also deterministic: press the trigger, read
      the number — no dodging, no waiting for a wave.
    */
    const page = await open();
    await page.click('.' + prefixFor('title') + 'action');
    await page.waitForTimeout(300);
    const label = '.itc-playing-hud-group[aria-label*="bomb"]';
    const before = await page.getAttribute(label, 'aria-label');
    expect(before, 'the readout does not say what the player is carrying').toMatch(/\d+ bombs/);

    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
    const after = await page.getAttribute(label, 'aria-label');
    expect(after, 'a bomb was spent and the readout did not move').not.toBe(before);
    await page.context().close();
  });
});
