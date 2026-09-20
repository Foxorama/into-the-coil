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
  /**
   * What each cue's source node was connected INTO, by node type — 0127.
   *
   * ⚠️ **THE ONLY PLACE THE FIELD CAN BE CHECKED AT ALL, and `npm run prove` is what said so.** Every
   * other guard for 0127 drives `makeSpeaker` through a recorder double and measures the pan it
   * computed — so deleting the panner from the real graph and connecting straight to the master left
   * the whole suite **STILL GREEN**. The arithmetic was never the risky half; the wiring is, and it
   * exists only in a browser.
   */
  into: string[];
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
    const tally = { buffers: 0, voices: 0, into: [] as string[] };
    window.__itcAudio = tally;
    const proto = window.AudioContext.prototype;
    const buffer = proto.createBuffer;
    const source = proto.createBufferSource;
    proto.createBuffer = function (...args: Parameters<typeof buffer>): ReturnType<typeof buffer> {
      tally.buffers++;
      return buffer.apply(this, args);
    };
    /*
      ⚠️ **The SOURCE's own `connect` is wrapped, not the context's** — 0127. The node type is enough
      to say where a cue went: a `StereoPannerNode` is its place, a `GainNode` is the master.

      ⚠️ **AND THE MUSIC MAKES BUFFER SOURCES TOO, WHICH THE FIRST DRAFT FORGOT.** Twenty-three of
      them at every start and at every change of place, each into its own layer gain — so this
      reported 23
      cues wired straight to the master on a completely correct build. **They are told apart by
      LENGTH, which is exact rather than a heuristic**: a cue is capped at `MAX_CUE_SECONDS` (2 s) and
      the shortest music loop is two bars, 3.2 s. The gap is not close.
    */
    const CUE_CEILING = 2.5;
    proto.createBufferSource = function (): ReturnType<typeof source> {
      tally.voices++;
      const node = source.apply(this);
      const connect = node.connect.bind(node) as typeof node.connect;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      node.connect = function (destination: any, ...rest: unknown[]): any {
        const seconds = node.buffer?.duration ?? 0;
        if (seconds > 0 && seconds <= CUE_CEILING && destination?.constructor?.name !== undefined) {
          tally.into.push(String(destination.constructor.name));
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (connect as any)(destination, ...rest);
      } as typeof node.connect;
      return node;
    };
  });
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

const tally = (page: Page): Promise<AudioTally> =>
  page.evaluate(() => window.__itcAudio ?? { buffers: -1, voices: -1, into: [] });

/** The cue bus's impulse response — one buffer, built on the same gesture. `THE WHOLE CHAIN` argues it. */
const ROOM_IMPULSE = 1;

/** Every buffer a first gesture produces: the cues, the base loops, the place's own, and the room. */
const BAKED_TOTAL = BAKED_BUFFERS + MUSIC_LAYERS.length + ROOM_IMPULSE;

/**
 * Wait until the bake has finished, by COUNTING what it makes rather than by waiting for quiet.
 *
 * ── A COUNT OVER A WINDOW IS A RACE UNLESS THE WINDOW IS CLOSED BY SOMETHING REAL ────────────────
 *
 * ⚠️ **`docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`.** A place's bake
 * hands its loops over whenever it finishes and `setLoops` then rebuilds one source per layer — so a
 * handover landing between two tallies adds a whole set of voices to a difference that is meant to be
 * *what that press did*. Measured, it is exactly `MUSIC_LAYERS.length` of surprise: 55 voices where 28
 * was expected, and which side of the press it falls on depends on how long the prewarm took that run.
 *
 * ⚠️ **AND WAITING FOR *QUIET* WAS THE SECOND VERSION OF THE SAME MISTAKE.** Two reads agreeing that
 * nothing had moved passed this file on its own and failed it inside `npm run check`, because under the
 * suite's load the gap between two bake steps grows past the gap between two polls. **A quiet window is
 * still a window.** What closes this one is arithmetic: the gesture makes one buffer per cue weight, one
 * per music layer, one per layer again for the place, and one for the room — so the bake is done when
 * `BAKED_TOTAL` buffers exist, at any speed, on any machine.
 *
 * ⚠️ **AND IT ASSERTS NOTHING, WHICH COST A PROOF TO LEARN.** The first version failed loudly when the
 * count never arrived — which reads well and is wrong here, because **a bake that never happens is what
 * half the probes in this file BREAK**. `npm run prove` reported 0072 as *NOTHING WAS PROVEN*: the
 * unlock was cut, no buffer was ever made, and this helper threw its own message before the guard could
 * throw the one the probe is watching for. A helper that asserts takes the failure away from the test.
 *
 * ⚠️ **SO IT GIVES UP EARLY WHEN NOTHING HAS STARTED AT ALL.** Five seconds with a count still at zero
 * is not a slow machine, it is a page that never unlocked — the guard below says so in its own words,
 * and waiting the full minute for it would only make every such probe a minute slower.
 */
const settled = async (page: Page): Promise<AudioTally> => {
  let now = await tally(page);
  for (let i = 0; i < 240 && now.buffers < BAKED_TOTAL; i++) {
    // Nothing at all after five seconds: the context never unlocked, which is a thing a guard here
    // asserts about. Hand back what there is and let it.
    if (i >= 20 && now.buffers <= 0) return now;
    await page.waitForTimeout(250);
    now = await tally(page);
  }
  return now;
};

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
    /*
      ⚠️ **1200 ms WAS A GUESS AND THE BAKE IS NOT ON A CLOCK** — see `settled`, and 0044. Every one of
      the three tests in this file that asserts a bake TOTAL used to wait a second and a fifth and then
      count, which is fine on a quiet machine and a coin flip inside `npm run check`: measured there,
      one of them read 55 voices where 28 was expected and another read a total that was still climbing.
      `settled` waits for the number these assertions are about, so they are no longer racing it.
    */
    const page = await open();
    await page.click(startButton);
    const after = await settled(page);
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
    /*
      ── AND THE PLACE ARRIVES TOO, WHICH IT COULD NOT BEFORE 0157 ──────────────────────────────────

      ⚠️ **THIS GUARD WAS GREEN FOR THE WRONG REASON AND ONLY 0157 COULD SHOW IT.** `bakePlace`
      returns immediately unless `prewarmed` is set (`src/app/sound.ts` says so in its own header),
      and the prewarm used to take 12–20 seconds of wall clock — so **a run started inside that window
      got no place bake at all**, and this counted one set of loops because the second never happened.
      Now the prewarm finishes in about its own synthesis time and a press finishes it outright, so
      0133's boundary bake does what it says and brings the level's own material.

      ⚠️ **One place, not a synthesiser** — which is the claim this test is actually making. The extra
      buffers are exactly `MUSIC_LAYERS.length`, one per layer, once; `bakeIncomingPlace` is memoised
      on the theme, so a second would mean the memo had stopped working. Still summed from the tables
      rather than written down.

      ⚠️ **It is level ONE's place, whose theme is the base composition**, so nothing about the SOUND
      changed here — what changed is that the mechanism now runs. That is why no play-test caught it.
    */
    /*
      ⚠️ **AND ONE MORE FOR THE ROOM** — `docs/decisions/0173-a-cue-happens-somewhere.md`. The cue
      bus's impulse response is a buffer like any other and is built on the same gesture, once, out
      of the same context. **It is the +1 and it is written as one rather than folded into a
      constant**, because the whole value of this assertion is that every term in it names something.

      ⚠️ **`ROOM_IMPULSE` MOVED TO THE TOP OF THE FILE AND THE SUM DID NOT MOVE WITH IT.** `settled`
      needs the same total to know when a bake has finished, and two copies of *the room is one buffer*
      would be the drift this file is careful about everywhere else. The terms are still spelled out
      here, which is what the paragraph above is asking for.
    */
    expect(after.buffers, 'the cues, the music and the level’s own place did not each bake once').toBe(
      BAKED_BUFFERS + MUSIC_LAYERS.length + ROOM_IMPULSE,
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

  it('0127 — EVERY CUE GOES INTO A PLACE, and this is the only guard that can see it', async () => {
    /*
      ⚠️ **THE PAN IS ARITHMETIC AND THE WIRING IS NOT.** `tests/sound.test.ts` checks the pan a cue
      is given five different ways, all of them through a recorder double — and `npm run prove`
      showed what that misses: replacing `source.connect(place)` with `source.connect(master)` left
      **every one of those guards green**. A cue wired to the master still sounds, at the right
      level, on the right beat, with the right accent. It is simply in the middle for ever, and
      nothing outside a browser can tell.

      ⚠️ **`docs/decisions/0027-measure-the-picture-not-the-model.md` for the channel with nothing to
      look at**, and the same shape as counting ink on the canvas: the only honest end of the chain
      is the platform call.
    */
    /*
      ⚠️ **THE BAKE IS WAITED OUT AND THE PLAY IS TIMED, BECAUSE THEY ARE DIFFERENT QUANTITIES.** This
      assertion is about where a cue is CONNECTED, which needs the run to have sounded one — there is no
      count to wait for, so the wait stays. What `settled` removes is the part that was a race: a
      thousand milliseconds that had to cover the bake AND the first cue, on whatever machine.
    */
    const page = await open();
    await page.click(startButton);
    await settled(page);
    await page.waitForTimeout(1200);
    const after = await tally(page);
    expect(after.into.length, 'no cue sounded at all, so this guard measured nothing').toBeGreaterThan(0);
    const straight = after.into.filter((node) => node !== 'StereoPannerNode');
    expect(
      straight,
      `${straight.length} of ${after.into.length} cue sources bypassed the field and went into ` +
        `${[...new Set(straight)].join(', ')} — a cue wired to the master is centred for ever`,
    ).toEqual([]);
    await page.context().close();
  });

  it('and choosing Off makes it silent without making it any less unlocked', async () => {
    /*
      ⚠️ **The two halves have to be checked together.** A build that never unlocked would pass
      "silent" perfectly, and be broken for everybody. So: the context is built and the cues are
      baked — the gesture did its work — and nothing comes out.

      ⚠️ **The place is in the count here too, and for the same reason as the chain test above** —
      0157. This run starts a level, so 0133's boundary bake brings that level's own material, which
      it could not do while the prewarm was still walking. **Off does not skip the bake**, which is
      the point of this test: silence is a gain, never an absence of material.
    */
    // ⚠️ `settled` rather than a fixed wait, on the terms the chain test above states: this assertion
    // is about a bake TOTAL, so waiting for that total is waiting for the thing it measures.
    const page = await open();
    await page.click(soundOption('off'));
    await page.click(startButton);
    const after = await settled(page);
    expect(
      after.buffers,
      'pressing a setting did not unlock the context, so silence proves nothing',
      // ⚠️ **The room's impulse is built with the context and not with the setting** — 0173. Silence
      // is a gain here, and material that only existed when sound was ON is material that has to be
      // synthesised on the press that turns it back on. That is the whole subject of this test.
    ).toBe(BAKED_BUFFERS + MUSIC_LAYERS.length + 1);
    /*
      ── THIS ASSERTED `voices === 0`, AND THAT WAS THE WRONG QUANTITY — FOUND INTERMITTENT ON CI, 0340 ──

      ⚠️ **IT FAILED ONCE ON A RUNNER WITH `expected 27 to be +0`, AND 27 IS EXACTLY ONE SET OF MUSIC
      LAYERS.** `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`: a rerun is
      not evidence, so it was reproduced instead. Audio unlocks on `pointerdown` and builds the music
      with `on = true`; *Off* is not chosen until the `click`. If ONE frame lands between the two, that
      frame's tick starts the music — correctly, because at that instant sound IS on — and the click
      mutes it a few milliseconds later. Measured on the same build, same button, same outcome (*Off*
      ends up marked): `page.click` → **0** sources; down, one frame, up → **27**. `page.click` puts
      both events inside one frame on an idle machine and does not under the load of `npm run prove`.

      ⚠️ **SO *WAS A SOURCE EVER CREATED* IS A FACT ABOUT THE RACE AND NOT ABOUT THE SETTING.** What
      *"sound is off and the game played anyway"* means is that the GAME made a sound: a gun, a death, a
      pickup. Those are cues, they go through the speaker, and the speaker is what `setOn(false)` stops
      — so that is what is counted, and `into` already tells a cue from a loop by length (the note on
      `CUE_CEILING` has why that is exact). Any other source is a music loop, which is silenced at its
      master GAIN — *silence is a gain, never an absence of material*, this test's own opening — and a
      count of nodes cannot see a gain in either direction. It never could: `0` said nothing about the
      music's gain either, only that the race had not happened.

      ⚠️ **AND WHOLE SETS ONLY**, so a stray source that is neither a cue nor a layer is still caught.
    */
    expect(after.into, 'sound is off and the game played a cue anyway').toEqual([]);
    expect(
      after.voices % MUSIC_LAYERS.length,
      `sound is off and ${after.voices} sources exist, which is not a whole number of music sets — something else sounded`,
    ).toBe(0);
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
    /*
      ⚠️ **AND THE FIRST PRESS IS WAITED OUT RATHER THAN TIMED OUT** — see `settled`. That press pays
      for the prewarm AND for the title screen's own place bake, and the bake's handover rebuilds one
      source per layer whenever it lands. This read the tally 300 ms later, so the handover fell on
      whichever side of the `off`/`on` pair the machine put it: **55 voices where 28 was expected**, one
      whole set of loops, from a guard whose subject is a single press.
    */
    const page = await open();
    await page.click(soundOption('on'));
    await settled(page);
    await page.click(soundOption('off'));
    const quiet = await settled(page);
    await page.click(soundOption('on'));
    const loud = await settled(page);
    expect(
      loud.voices - quiet.voices,
      'switching sound on made no sound, on the one press that is about sound',
    ).toBe(1 + MUSIC_LAYERS.length);
    await page.context().close();
  });
});
