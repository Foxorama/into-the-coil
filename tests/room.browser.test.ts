import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { SCREENS } from '../src/state/screens.ts';
// 0213: the sky is turned off so that ink in the lane means an entity and nothing else.
import { STYLE_KINDS } from '../src/content/styles.ts';
import { THEMES, THEME_KINDS } from '../src/content/themes.ts';
import { MUSIC_LEVEL_LABEL } from '../src/content/music.ts';

/**
 * THE MUSIC ROOM, DRIVEN.
 *
 * `docs/decisions/0212-the-room-walks-the-level.md`. Reported 2026-09-03: *"why the ingame music
 * sounds different from the music that plays in the music menu section"*, and asked for in the same
 * breath: *"a scrolling background to match the level/sound being played… an indication of which
 * track is being played when play all is selected… an indication of how far along that track it's
 * being played."*
 *
 * ⚠️ **A BROWSER TEST, BECAUSE EVERY CLAIM HERE IS ABOUT A SEAM `tests/music.test.ts` CANNOT REACH.**
 * The unit half holds the walk's arithmetic — that it agrees with a run, that it reaches every rung,
 * that the fight is two phrases. None of that says the camera moves on the screen a player is
 * looking at, and **the camera moving is the whole of what was added**: the room is a screen that
 * `src/state/screens.ts` marks `steps: false`, so the thing being tested is precisely a position
 * advancing on a screen the simulation is stopped on.
 *
 * ⚠️ **AND THE HEADLINE ASSERTION IS IN SECONDS OF MUSIC PER SECOND OF WATCHING**, which is
 * CLAUDE.md's *at least one assertion written in units the player experiences*. A guard over
 * `auditionAlong` would be checking that a constant equals itself —
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` — and it would have passed happily over
 * the version of this that stalled at 0.1% because the page was throttled.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/**
 * How long the room may take to start walking after a place is pressed, in ms.
 *
 * ⚠️ **`tests/menu.browser.test.ts`'s `HUD_MS`, AND THE SAME MEASUREMENT IS BEHIND IT.** A press in
 * this room finishes the same prewarm a press on the title does — 0157 and 0169 — because it is the
 * gesture that unlocks the audio context and the bake it was scheduled around. That was measured at
 * **4.2 s** on an idle machine; thirty seconds is seven times it, on a runner routinely three times
 * oversubscribed. It is not a timeout widened until it went quiet, which
 * `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` forbids.
 */
const START_MS = 30_000;

/**
 * How long the walk is watched for, in ms, and how far apart the two readings are.
 *
 * ⚠️ **LONG ENOUGH THAT THE PREWARM'S TAIL IS NOT THE MEASUREMENT.** The first reading is taken
 * after the walk is already moving, so what is timed is a stretch of ordinary frames — but a runner
 * can lose a second to a garbage collection, and over a two-second window that is half the answer.
 */
const WATCH_MS = 6_000;

/**
 * How far the measured rate may sit from the real one, as a share of it.
 *
 * ── A BAND ROUND A RATIO, NOT A TOLERANCE ROUND A NUMBER ────────────────────────────────────────
 *
 * ⚠️ **THE RATE IS EXACTLY 1.0 ON A MACHINE THAT DRAWS EVERY FRAME**: the walk advances
 * `SCROLL_PER_STEP` per fixed step and the clock runs at 60 Hz, so a second of watching is a second
 * of walking. What moves it is `docs/decisions/0022-frame-rate-is-a-feature.md`'s own cap —
 * `MAX_STEPS` **discards** the debt on a frame that fell too far behind, so a stall makes the walk
 * run SLOW and never fast.
 *
 * ⚠️ **A THIRD IS THE BAND BECAUSE THE FAILURE THIS GUARDS IS NOT A WOBBLE.** The defect it exists
 * to catch is a walk driven by the wrong clock or not driven at all — the version that read 0.1%
 * after eight seconds is a rate of **0.02**. Anything that survives a third is a frame budget
 * problem, and `tests/budget.test.ts` is where that lives; anything that fails it is broken.
 */
const RATE_BAND = 0.34;

async function open(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

const MUSIC = '.' + prefixFor('music').slice(0, -1);
const NOW = '.' + prefixFor('music') + 'now';
/** Which style option is the one with no sky. Read off the table, never counted by hand. */
const RETRO = STYLE_KINDS.indexOf('retro');

/**
 * Press a control on the shown screen by its visible label.
 *
 * ⚠️ **ANCHORED AT THE START RATHER THAN EXACT, BECAUSE A CONTROL'S HINT IS PART OF ITS NAME.**
 * *Play all* carries *each place in turn, then round again* inside the same `<button>` (0070's hint,
 * and `src/state/screens.ts` gives the room's one), so its accessible name is both lines. `exact`
 * matched none of it and the test spent thirty seconds waiting for a button that was on the screen.
 */
async function press(page: Page, label: string): Promise<void> {
  const anchored = new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  await page.getByRole('button', { name: anchored }).click();
}

/**
 * How many seconds into the walk the readout says it is. `m:ss`, which is what a player reads.
 *
 * ⚠️ **`textContent` AND NOT `innerText`, AND THE DIFFERENCE COST A GREEN FAILURE.** `innerText` is
 * what is RENDERED, so inside the `hidden` readout it is the empty string — and a wait for *the time
 * is no longer 0:00* was satisfied the instant the room opened with nothing playing. The test then
 * measured `NaN`. `waitForWalk` below holds the visibility separately, which is the half that was
 * being smuggled through a text comparison.
 */
async function walkedTo(page: Page): Promise<number> {
  const text = (await page.locator(NOW + '-at').textContent()) ?? '';
  const [minutes, seconds] = text.split(':');
  return Number(minutes) * 60 + Number(seconds);
}

/** Wait until the room is visibly walking — the readout up, and the clock off its first second. */
async function waitForWalk(page: Page): Promise<void> {
  await page.locator(NOW).waitFor({ state: 'visible', timeout: START_MS });
  await page.waitForFunction(
    (selector: string) => /^[1-9]?\d:\d\d$/.test(document.querySelector(selector)?.textContent ?? '') &&
      document.querySelector(selector)?.textContent !== '0:00',
    NOW + '-at',
    { timeout: START_MS },
  );
}

/** A small square of the canvas, as a string — enough to say whether the picture changed. */
function patch(page: Page): Promise<string> {
  return page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return '';
    const out = document.createElement('canvas');
    out.width = 120;
    out.height = 120;
    // ⚠️ **The TOP-LEFT corner and not the middle**, because the middle is where the panel is: a
    // sample taken behind the buttons would be reporting on the overlay's own backing.
    out.getContext('2d')?.drawImage(canvas, 40, 40, 120, 120, 0, 0, 120, 120);
    return out.toDataURL();
  });
}

describe.runIf(chromePath)('the music room walks the level it is auditioning', () => {
  it('advances at a second of music per second of watching, on a screen that does not step', async () => {
    /*
      ⚠️ **THE SCREEN IS `steps: false` AND THIS IS THE POINT.** 0210 refused to let the room simulate
      and 0212 kept that refusal: what moves is a camera, driven from `onTick`, which fires on every
      step whether or not the simulation took it (0063). If those two ever fuse, this test is what
      says so — because a room that stopped moving would read a rate of zero here and nothing in the
      unit suite could tell.
    */
    expect(SCREENS.music.steps, 'the music room started simulating a run the player did not begin').toBe(false);

    const page = await open();
    await press(page, 'Music');
    expect(await page.locator(NOW).isVisible(), 'the readout is up before anything is playing').toBe(false);

    await press(page, THEMES.approach.title);
    // Wait for the walk to actually be moving, so the prewarm is not inside the window being timed.
    await waitForWalk(page);

    const from = await walkedTo(page);
    const started = Date.now();
    await page.waitForTimeout(WATCH_MS);
    const to = await walkedTo(page);
    const watched = (Date.now() - started) / 1000;

    /*
      ⚠️ **SECONDS OF THE WALK OVER SECONDS OF THE CLOCK**, read off the readout the player is
      looking at rather than off any number in `src/`. That is what makes this an assertion about the
      picture: it would still fail if the walk were perfect and the readout were stuck, which is
      exactly the failure a guard over the model would call green.
    */
    const rate = (to - from) / watched;
    expect(
      rate,
      `the room walked ${(to - from).toFixed(0)}s of music in ${watched.toFixed(1)}s of watching ` +
        '— a rate of 1 is the game\'s own, and 0 is a walk that is not happening',
    ).toBeGreaterThan(1 - RATE_BAND);
    expect(rate, 'the room is walking faster than the world goes past a run').toBeLessThan(1 + RATE_BAND);
    await page.context().close();
  });

  it('scrolls the place behind it, and a different place is a different sky', async () => {
    /*
      ⚠️ **TWO CLAIMS IN ONE TEST BECAUSE THEY SHARE A PAGE AND A PREWARM**, which is thirty seconds
      of a suite. They are also one asked-for thing: *"a scrolling background to match the
      level/sound being played"* is a background that MOVES and that MATCHES, and either alone is the
      feature not working.
    */
    const page = await open();
    await press(page, 'Music');
    await press(page, THEMES.approach.title);
    await waitForWalk(page);

    const first = await patch(page);
    await page.waitForTimeout(1_000);
    expect(await patch(page), 'the backdrop is not moving — the room is a still picture').not.toBe(first);

    /*
      ⚠️ **THE PANEL MUST NOT BE PAINTING OVER IT**, which is the half `dims: false` buys and the half
      a stylesheet could take back. 0210 shipped a screen that mounted, reported itself shown and drew
      nothing; this is the same class of failure with the layers the other way up.
    */
    const covered = await page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      if (!(el instanceof HTMLElement)) return true;
      const paint = getComputedStyle(el).backgroundColor;
      return paint !== 'rgba(0, 0, 0, 0)' && paint !== 'transparent';
    }, MUSIC);
    expect(covered, 'the music room overlay is painting over the place it is auditioning').toBe(false);

    // A second place is a second sky — 0195 put the star field itself in the place's hands.
    await press(page, THEMES.nebula.title);
    await page.waitForTimeout(1_000);
    const other = await patch(page);
    await press(page, THEMES.rime.title);
    await page.waitForTimeout(1_000);
    expect(await patch(page), 'two places draw the same sky').not.toBe(other);
    await page.context().close();
  });

  it('says which place is playing, where in it, and what Play all moves to next', async () => {
    const page = await open();
    await press(page, 'Music');
    await press(page, 'Play all');
    await waitForWalk(page);

    expect(await page.locator(NOW + '-place').innerText(), 'Play all did not open on the first place').toBe(
      THEMES[THEME_KINDS[0]!].title,
    );
    /*
      ⚠️ **THE ASKED-FOR THING, IN THE ASKER'S OWN WORDS** — *"an indication of which track is being
      played when play all is selected"*. A single place loops and has no next, which is the other
      half of the same rule and is why this is not simply *the label is not empty*.
    */
    expect(await page.locator(NOW + '-next').innerText(), 'Play all does not say what is coming').toContain(
      THEMES[THEME_KINDS[1]!].title,
    );

    /*
      ── THE MENU SAYS WHICH PLACE IS PLAYING — 0216 ──────────────────────────────────────────────

      ⚠️ **THE REPORT WAS *"it now just repeats the same track"* AND PLAY ALL WAS WORKING.** The
      readout, the backdrop and the mix all followed the handover; the nine buttons underneath — the
      biggest thing on the screen — never moved, so the screen read as stuck. **A screen whose largest
      element contradicts its smallest reads as broken**, which is why this is asserted on the BUTTON
      rather than on the readout that was already right.
    */
    const playing = '.' + prefixFor('music') + 'action-playing';
    expect(await page.locator(playing).count(), 'no place is marked as playing').toBe(1);
    expect(await page.locator(playing).textContent(), 'the marked button is not the place the readout names').toBe(
      THEMES[THEME_KINDS[0]!].title,
    );

    /*
      ── THE POINTER HALF OF THE SEEK, AND IT IS THE ONE A LISTENER ACTUALLY USES ─────────────────

      ⚠️ **THE FIRST DRAFT OF THIS FILE TESTED ONLY THE KEYBOARD, AND THAT IS THE GAP THAT MATTERS.**
      `End` goes through `onSeek` directly; a click goes through `getBoundingClientRect`, a pointer
      capture and a division — three things the keyboard path does not touch, and the whole of what a
      player does. A guard over the reachable half of a control is a guard over the half nobody uses.

      ⚠️ **CHECKED IN `m:ss` AND IN THE SECTION NAME**, not in the fill's percentage, because those
      are the two things on the screen that say where the music is. Six tenths of the way into a
      2:51 walk is inside `approach` on every level, which is what makes this assertion about the
      level rather than about the arithmetic that placed the click.
    */
    /*
      ⚠️ **`locator.click` WITH A POSITION, NOT `mouse.click` AT A COMPUTED POINT.** The raw mouse
      lands wherever the arithmetic says and reports nothing when that is not the control; the locator
      runs Playwright's own actionability checks first, so an element that is covered, zero-sized or
      not yet laid out fails with what is in the way rather than as a seek that quietly did not move.
    */
    const box = (await page.locator(NOW + '-bar').boundingBox())!;
    await page.locator(NOW + '-bar').click({ position: { x: box.width * 0.62, y: box.height / 2 } });
    /*
      ⚠️ **POLL FOR THE SEEK TO HAVE LANDED, AND *the clock left 0:00* IS NOT THAT.** The walk is
      already past 0:00 before the click — `waitForWalk` is what waited for it — so a poll on that
      passes instantly and the assertions below read the readout one tick before it was pushed. It
      failed as *a click six tenths along put the walk at 0:01*, which reads exactly like a seek that
      does not work and was a test that did not wait.
    */
    await expect.poll(() => page.locator(NOW + '-section').textContent()).toBe(MUSIC_LEVEL_LABEL.approach);
    const at = (await page.locator(NOW + '-at').textContent()) ?? '';
    const [minutes, seconds] = at.split(':');
    const walked = Number(minutes) * 60 + Number(seconds);
    const whole = (await page.locator(NOW + '-of').textContent()) ?? '';
    const [wholeMinutes, wholeSeconds] = whole.split(':');
    const length = Number(wholeMinutes) * 60 + Number(wholeSeconds);
    expect(
      walked / length,
      `a click six tenths along the bar put the walk at ${at} of ${whole}`,
    ).toBeGreaterThan(0.5);
    expect(walked / length, `a click six tenths along the bar put the walk at ${at} of ${whole}`).toBeLessThan(0.75);
    expect(await page.locator(NOW + '-section').textContent(), 'the rung did not follow the seek').toBe(
      MUSIC_LEVEL_LABEL.approach,
    );

    /*
      ⚠️ **AND `End` IS WHAT MAKES *Play all* TESTABLE AT ALL.** A place is about three minutes long,
      so watching it reach the second one would be a three-minute test.
    */
    await page.locator(NOW + '-bar').focus();
    await page.keyboard.press('End');
    await page.waitForFunction(
      ({ selector, was }: { selector: string; was: string }) =>
        (document.querySelector(selector) as HTMLElement | null)?.innerText !== was,
      { selector: NOW + '-place', was: THEMES[THEME_KINDS[0]!].title },
      { timeout: START_MS },
    );
    expect(await page.locator(NOW + '-place').innerText(), 'Play all did not move on at the end of a walk').toBe(
      THEMES[THEME_KINDS[1]!].title,
    );

    /*
      ⚠️ **AND THE MARK MOVED WITH IT, WHICH IS THE WHOLE OF 0216.** The handover was already correct
      when it was reported as broken — what was missing is this line's subject. **The mark and the
      focus ring are asserted separately**: the mark is always right, the ring is only lent, and a
      change that dropped one while keeping the other would be half the fix.
    */
    await expect
      .poll(() => page.locator('.' + prefixFor('music') + 'action-playing').textContent())
      .toBe(THEMES[THEME_KINDS[1]!].title);
    expect(
      await page.locator('.' + prefixFor('music') + 'action-cursor').textContent(),
      'the focus ring did not follow the walk onto the next place',
    ).toBe(THEMES[THEME_KINDS[1]!].title);

    /*
      And a single place loops rather than moving on, so it has nothing to announce.

      ⚠️ **THE PLACE IS WAITED FOR RATHER THAN ASSUMED**, because the readout is pushed on the next
      tick and a click resolves faster than a frame. Reading straight after the press caught the row
      the previous place had left there and reported it as a live bug.
    */
    await press(page, THEMES.rime.title);
    await expect.poll(() => page.locator(NOW + '-place').textContent()).toBe(THEMES.rime.title);
    expect(await page.locator(NOW + '-next').textContent(), 'a single place is claiming a next place').toBe('');
    await page.context().close();
  });

  it('leaves the run\'s camera where it found it, so a run after a visit still opens at the start', async () => {
    /*
      ⚠️ **THE ONE THING THE ROOM MUTATES THAT IS NOT ITS OWN.** It borrows `cameraAlong` and puts it
      back, because `docs/decisions/0068-a-run-over-is-a-continue.md`'s resume deliberately does not go
      through `startLevel` — a camera left three thousand units along would be a run opening in the
      middle of a level with its opening stretch already spent (0043).
    */
    const page = await open();

    /*
      ⚠️ **ONE VISIT FIRST, AND IT IS NOT A WARM-UP — IT IS WHAT MAKES THE COMPARISON MEAN THE CAMERA.**
      The title at BOOT has never had its weather baked: `applyPlace` is memoised on the backdrop
      colour and returns early until something changes it, so the first place pressed is what causes
      `bakeNebula` to run at all. Comparing a post-visit title against a boot title therefore compares
      *weather against no weather* and would go red however perfectly the camera was restored — which
      is what the first draft of this test did.

      **Both readings are taken with the same bake history, so the only thing left that can move the
      picture is the camera.** That is the whole subject.
    */
    await press(page, 'Music');
    await press(page, THEMES.nebula.title);
    await waitForWalk(page);
    await press(page, 'Back');
    await page.waitForTimeout(500);
    const title = await patch(page);

    await press(page, 'Music');
    await press(page, THEMES.nebula.title);
    await waitForWalk(page);
    /*
      ⚠️ **SEEK TO THE FAR END BEFORE LEAVING**, so the camera being put back is a restore of some
      thousands of units rather than of the handful a two-second walk covers. A test that left the
      room four seconds in would pass against a broken restore, because four seconds of parallax on
      the slowest star layer is under a pixel.
    */
    await page.locator(NOW + '-bar').focus();
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    await press(page, 'Back');
    expect(await page.locator(NOW).isVisible(), 'the readout is still up after leaving the room').toBe(false);
    /*
      0216: and nothing claims to be playing once nothing is. A mark left on is a lie about the room.

      ⚠️ **POLLED, BECAUSE THE READOUT IS PUSHED ON A TICK AND NOT ON THE PRESS** — that is the
      contract every `chrome.set*` keeps. Read straight after the click this raced the next frame, and
      the `isVisible` check above it passed **for the wrong reason**: by then the whole screen is
      hidden, so it would have been false whether or not anything had been cleared.
    */
    await expect.poll(() => page.locator('.' + prefixFor('music') + 'action-playing').count()).toBe(0);
    await page.waitForTimeout(500);

    /*
      ⚠️ **THE TITLE'S OWN SKY IS THE EVIDENCE.** Nothing in the DOM reports the camera and a page
      global would be a test-only hook in shipped code, but `src/render/scene.ts` parallaxes every
      star field off `cameraAlong` — so a camera left where the walk finished draws a different sky,
      and that is a thing a screenshot can see.
    */
    expect(await patch(page), 'the room kept the camera it borrowed — the title is drawn from it').toBe(title);
    await page.context().close();
  });
});

/**
 * THE FLYTHROUGH — `docs/decisions/0213-the-room-is-a-flythrough.md`.
 *
 * Reported 2026-09-03: *"the initial background screen has a bunch of enemies showing that scroll
 * off-screen and then there's no enemies at all showing again… can we do something fun… and remove
 * the enemies from that starting screen."*
 */
describe.runIf(chromePath)('the room flies the level rather than showing the boot field', () => {
  it('opens on an empty lane, and keeps something in it for a whole walk', async () => {
    const page = await open();

    /*
      ⚠️ **THE STAR FIELD IS TURNED OFF FIRST, AND WITHOUT THAT THIS GUARD IS VACUOUS.** The first
      version counted lit pixels across the playfield and **stayed green with the whole mote field
      deleted** — because what it was counting was the sky. `npm run prove` is what said so, which is
      the entire reason 0005 exists. Retro is *the game before the sky*
      (`docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`), so with it on, ink in the
      lane is **entities and nothing else**.
    */
    await page.locator(`[${SETTING_ATTR}="style"] .${prefixFor('title')}option >> nth=${RETRO}`).click();
    await press(page, 'Music');

    /*
      ⚠️ **A BAND WITH NO PANEL IN IT, NO SHIP, AND NOT THE BOX EDGE EITHER.** The ship holds station
      at `SHIP_START_ALONG`, a fixed fifth along the camera's frame; the panel is centred; and
      `docs/decisions/0074-the-box-is-drawn.md`'s dashed wall is drawn at the leading edge **on every
      screen, always**. The first draft of this band ran to 1250 and included that wall, so it
      **stayed green with the whole mote field deleted** — the second time in this one test that a
      count of lit pixels turned out to be counting furniture. 950 to 1140 is dust or nothing.
    */
    const dust = (): Promise<number> =>
      page.evaluate(() => {
        const canvas = document.querySelector('#app canvas');
        if (!(canvas instanceof HTMLCanvasElement)) return 0;
        const out = document.createElement('canvas');
        out.width = 190;
        out.height = 600;
        const ctx = out.getContext('2d');
        ctx?.drawImage(canvas, 950, 60, 190, 600, 0, 0, 190, 600);
        const data = ctx?.getImageData(0, 0, 190, 600).data;
        if (data === undefined) return 0;
        let lit = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i]! + data[i + 1]! + data[i + 2]! > 150) lit++;
        }
        return lit;
      });

    const opened = await dust();
    await press(page, THEMES.approach.title);
    await waitForWalk(page);
    const early = await dust();

    /*
      ⚠️ **THE DEFECT WAS *AND THEN THERE'S NO ENEMIES AT ALL SHOWING AGAIN*, so the reading that
      matters is at the END of a stretch of walking**, not at the start. The seeded field emptied over
      about ten seconds; a field that wrapped incorrectly would empty over a similar stretch and look
      identical for the first frame.
    */
    await page.locator(NOW + '-bar').focus();
    await page.keyboard.press('End');
    await page.waitForTimeout(1_000);
    const late = await dust();

    expect(opened, 'the room opens on an empty lane — there is no dust in it at all').toBeGreaterThan(0);
    expect(early, 'the lane has no dust in it as the walk starts').toBeGreaterThan(0);
    expect(
      late,
      'the lane emptied out over the walk, which is the reported defect with different bodies in it',
    ).toBeGreaterThan(0);
    await page.context().close();
  });

  /*
    ⚠️ **THE ONE CONSTRAINT THE ASK CAME WITH**: *"if we can do both without the ship getting hit by
    debris and exploding"*. It is guaranteed structurally — the room is `steps: false`, so
    `src/app/frame.ts` returns before `stepEntities` and before `collide` — and this is what says so
    out loud. **A run's HUD is the only place health is visible**, so what is checked is that the room
    never puts one up: a ship taking damage on this screen would be a run happening.
  */
  it('cannot hurt the ship, because it never runs a step to hurt it in', async () => {
    expect(SCREENS.music.steps, 'the music room began simulating — the dust can now hit the ship').toBe(false);
    const page = await open();
    await press(page, 'Music');
    await press(page, THEMES.mire.title);
    await waitForWalk(page);
    await page.locator(NOW + '-bar').focus();
    await page.keyboard.press('End');
    await page.waitForTimeout(1_000);
    expect(
      await page.locator('.itc-playing-hud-shown').count(),
      'the run readout is up on the music screen — something is being simulated',
    ).toBe(0);
    expect(await page.locator(NOW).isVisible(), 'the walk stopped, which is what a death would look like').toBe(
      true,
    );
    await page.context().close();
  });

  /*
    ⚠️ **THERE IS NO GUARD HERE FOR *the picture is the same however the camera reached this
    position*, AND IT WAS WRITTEN AND DELETED TWICE.** As a unit test it reads `f(4321)` twice and is
    a tautology (`tests/attract.test.ts` says so where it would have lived). As a browser test —
    seek to 40%, seek away, seek back, compare the pixels — **it passed, and its green was luck**: the
    walk advances 36 units a second between the two captures, so the comparison is a race that the
    slow parallax layers happen to win. `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`
    is explicit that a rerun is not evidence, and a guard that is green because a sub-pixel difference
    rounded the right way is one that will go red for a reason nobody can act on.

    **What holds the claim instead is the shape of the code**: `src/app/attract.ts` exports pure
    functions of the camera and the room keeps no position but `auditionAlong`. That is a weaker
    guarantee than a test and it is the honest one available.
  */
});
