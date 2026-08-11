import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CUES, CUE_KINDS } from '../src/content/cues.ts';
import { MUSIC_LAYERS } from '../src/content/music.ts';
import { velocitiesOf } from '../src/app/sound.ts';

/**
 * How many buffers the bake produces: one per WEIGHT of every cue, plus one per music layer.
 *
 * ⚠️ **It was `CUE_KINDS.length + MUSIC_LAYERS.length` and 0104 broke that arithmetic, correctly.**
 * A cue with a `figure` bakes one buffer per weight, so the count is a sum over the table rather than
 * its length. Still derived from the two tables and still not a number written down — which is what
 * made this go red the moment the figure landed rather than silently drifting.
 */
const BAKED_BUFFERS = CUE_KINDS.reduce((total, kind) => total + velocitiesOf(CUES[kind]).length, 0) + MUSIC_LAYERS.length;
import { SOUND_KINDS } from '../src/content/sound.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';

/**
 * SOUND, IN A REAL BROWSER, COUNTED AT THE PLATFORM.
 *
 * `docs/decisions/0072-a-cue-is-baked-and-played.md`. `tests/sound.test.ts` holds the table, the
 * samples and the gate — **and every one of those assertions is green on a build that never makes a
 * sound**, because the whole chain from a gesture to a speaker lives in the six lines no unit test
 * can reach: the unlock, the context, the bake, the source node.
 *
 * ⚠️ **So this counts the platform calls rather than trusting the shell.** Web Audio's own
 * constructors are wrapped before the page's script runs, which is the audible equivalent of
 * `tests/style.browser.test.ts` counting ink on the canvas — the only honest end of the chain.
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 60_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

interface AudioTally {
  buffers: number;
  voices: number;
}

declare global {
  interface Window {
    __itcAudio?: AudioTally;
  }
}

/**
 * A page with Web Audio instrumented before anything on it has run.
 *
 * ⚠️ **Patched on `AudioContext.prototype`, which shadows `BaseAudioContext.prototype` for the
 * instances the game builds.** Counting `createBuffer` counts the bake; counting `createBufferSource`
 * counts voices, because a source node is single-use and there is exactly one per sound.
 */
async function open(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const tally = { buffers: 0, voices: 0 };
    window.__itcAudio = tally;
    const proto = window.AudioContext.prototype;
    const buffer = proto.createBuffer;
    const source = proto.createBufferSource;
    proto.createBuffer = function (...args: Parameters<typeof buffer>): ReturnType<typeof buffer> {
      tally.buffers++;
      return buffer.apply(this, args);
    };
    proto.createBufferSource = function (): ReturnType<typeof source> {
      tally.voices++;
      return source.apply(this);
    };
  });
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

const tally = (page: Page): Promise<AudioTally> =>
  page.evaluate(() => window.__itcAudio ?? { buffers: -1, voices: -1 });

const soundOption = (kind: (typeof SOUND_KINDS)[number]): string =>
  `[${SETTING_ATTR}="sound"] .${prefixFor('title')}option >> nth=${SOUND_KINDS.indexOf(kind)}`;

/** The easiest tier's button, which is the first control on the title screen — 0047 walks the table. */
const startButton = `.${prefixFor('title')}action >> nth=${DIFFICULTY_KINDS.indexOf(DIFFICULTY_KINDS[0]!)}`;

describe.runIf(chromePath)('sound reaches the speakers, and only after a gesture', () => {
  it('builds no audio at all until the player touches something', async () => {
    /*
      ⚠️ **A claim about cost as well as about policy.** Every browser refuses to play before a
      gesture, so a context built at boot would be a suspended one — and the twelve buffers baked
      into it would be work done for a player who may never press anything. `src/app/sound.ts`
      builds the context ON the first gesture instead, and this is that being true rather than
      intended.
    */
    const page = await open();
    const before = await tally(page);
    expect(before.buffers, 'the page baked audio before anyone touched it').toBe(0);
    expect(before.voices, 'the page made a sound before anyone touched it').toBe(0);
    await page.context().close();
  });

  it('THE WHOLE CHAIN: a press unlocks it, the cues bake once, and a run makes voices', async () => {
    const page = await open();
    await page.click(startButton);
    await page.waitForTimeout(1200);
    const after = await tally(page);
    /*
      ⚠️ **Exactly one buffer per cue WEIGHT and one per music layer, which is the bake being a
      BAKE.** More than that is a synthesiser running during play, which is the audio spelling of
      baking in the frame loop and the thing `docs/decisions/0022-frame-rate-is-a-feature.md` bans for
      art. `docs/decisions/0104-the-gun-plays-a-figure.md` made a cue a LIST of weights, and the count
      follows the table rather than being restated.

      ⚠️ **The music rides the same gesture** —
      `docs/decisions/0090-the-music-is-four-loops.md`. Its four loops are built beside the cues out
      of one context, because a second context is a second thing to resume when a tab comes back and
      the one that gets missed is silent for the rest of the run. Counted from the two tables rather
      than written down as a number.
    */
    expect(after.buffers, 'the cues and the music did not bake once on the unlocking gesture').toBe(
      BAKED_BUFFERS,
    );
    expect(after.voices, 'a run played for a second and the game stayed silent').toBeGreaterThan(0);
    /*
      And the voices are BOUNDED. A second of play at 60Hz is 60 steps; the cap allows four a step,
      so anything near 240 would mean the caps and holds are not running at all. The real figure is a
      small fraction of that — this is a ceiling, not a target.
    */
    expect(after.voices, 'more voices than the cap and the holds could possibly allow').toBeLessThan(240);
    await page.context().close();
  });

  it('and choosing Off makes it silent without making it any less unlocked', async () => {
    /*
      ⚠️ **The two halves have to be checked together.** A build that never unlocked would pass
      "silent" perfectly, and be broken for everybody. So: the context is built and the cues are
      baked — the gesture did its work — and nothing comes out.
    */
    const page = await open();
    await page.click(soundOption('off'));
    await page.click(startButton);
    await page.waitForTimeout(1200);
    const after = await tally(page);
    expect(
      after.buffers,
      'pressing a setting did not unlock the context, so silence proves nothing',
    ).toBe(BAKED_BUFFERS);
    expect(after.voices, 'sound is off and the game played anyway').toBe(0);
    await page.context().close();
  });

  it('and turning it back on says so, because a setting with no feedback is a broken build', async () => {
    /*
      The chime — `src/content/cues.ts` has the argument for the one cue that is not an event the
      model resolves. On the title screen no other CUE is playing, so a voice here is that one.

      ⚠️ **Plus the music's four loops, and they are counted rather than excluded** —
      `docs/decisions/0090-the-music-is-four-loops.md`. Turning the sound off stops the loops
      outright, so turning it back on starts four sources as well as sounding the chime. Excluding
      them would need this test to know which sources were which; adding them says the same thing and
      also holds that the music comes back, which is a claim worth having.
    */
    /*
      ── THE MUSIC IS STARTED FIRST, ON PURPOSE, AND WITHOUT IT THIS GUARD IS A COIN FLIP ──────────

      ⚠️ **`docs/decisions/0119-off-stops-the-loops.md`.** The first gesture used to be the `off`
      click itself, and the audio is unlocked by a `pointerdown` in the CAPTURE phase — so whether
      the loops had started by the time the setting applied depended on whether a frame landed in
      between. **The same code passed one CI run and failed the next**, which is
      `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`'s subject exactly.

      ⚠️ **Clicking `on` first is a real gesture that changes no setting** — sound is already on — so
      it unlocks the context and lets a frame start the loops, and what follows is then the same
      sequence every time. The race is gone from the guard and the bug it was half-seeing is fixed in
      `src/app/music.ts`.
    */
    const page = await open();
    await page.click(soundOption('on'));
    await page.waitForTimeout(300);
    await page.click(soundOption('off'));
    await page.waitForTimeout(300);
    const quiet = await tally(page);
    await page.click(soundOption('on'));
    await page.waitForTimeout(300);
    const loud = await tally(page);
    expect(
      loud.voices - quiet.voices,
      'switching sound on made no sound, on the one press that is about sound',
    ).toBe(1 + MUSIC_LAYERS.length);
    await page.context().close();
  });
});
