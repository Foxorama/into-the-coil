import { describe, it, expect, afterAll, vi } from 'vitest';
import type { Browser } from 'playwright-core';
import { launchChromium } from './chromium.ts';
import { MUSIC_COMPRESSOR } from '../src/content/music.ts';

/*
  ⚠️ FILE-LEVEL, because vitest's 5s default is not a browser test's timeout — see
  tests/orientation.browser.test.ts, where this was first hit, and the class fix that followed it.
  Held for every *.browser.test.ts by tests/toolchain.test.ts.
*/
vi.setConfig({ testTimeout: 60_000 });

let browser: Browser | undefined;

afterAll(async () => {
  await browser?.close();
});

/**
 * ── THE ONE NUMBER IN THE MUSIC BUS THAT ONLY A BROWSER CAN SUPPLY — 0226 ───────────────────────
 *
 * ⚠️ **`DynamicsCompressorNode` LIFTS WHAT PASSES THROUGH IT, BY SPECIFICATION, AND NO MODEL IN
 * `tests/` KNEW.** 0219 wired the node in against `tests/compress.ts`, which models the curve and the
 * detector and no makeup gain, so from that day the shipped music bus sat 4.5 dB above every number
 * the suite had for it — over a cue bus that passes through no such node. Six reports on one stretch
 * of The Approach; the sixth was *"drowns out the bullets and game SFX"*.
 *
 * ⚠️ **`MUSIC_COMPRESSOR.makeup` IS CONTENT, AND THIS IS WHERE IT IS READ BACK.** `makeMusicOut`
 * divides the lift out with a gain after the node; the number it divides by has to be the node's,
 * and the node's is a function of the threshold, knee and ratio beside it. Change those and this
 * reddens until the makeup is re-measured — `node scripts/weigh-picture.mjs` prints it.
 *
 * ⚠️ **A SINE WELL UNDER THE KNEE**, so the detector never crosses the threshold and the only thing
 * between input and output is the makeup. Measured over the second second, once the envelope has
 * settled; a sine's peak is its RMS times root two, so the level out is read as dBFS peak like the
 * level in.
 */
describe('0226 — the compressor’s makeup gain is the browser’s, not the model’s', () => {
  it('the browser’s compressor lifts what passes below its knee by exactly what the content says', async () => {
    browser ??= await launchChromium({ headless: true });
    const page = await browser.newPage();
    const measured = await page.evaluate(
      async ({ threshold, knee, ratio, attack, release }) => {
        const rate = 48000;
        const ctx = new OfflineAudioContext(1, 2 * rate, rate);
        const osc = ctx.createOscillator();
        osc.frequency.value = 1000;
        const level = ctx.createGain();
        const inDb = -30;
        level.gain.value = Math.pow(10, inDb / 20);
        const squeeze = ctx.createDynamicsCompressor();
        squeeze.threshold.value = threshold;
        squeeze.knee.value = knee;
        squeeze.ratio.value = ratio;
        squeeze.attack.value = attack;
        squeeze.release.value = release;
        osc.connect(level);
        level.connect(squeeze);
        squeeze.connect(ctx.destination);
        osc.start();
        const rendered = await ctx.startRendering();
        const data = rendered.getChannelData(0);
        let sum = 0;
        for (let i = rate; i < 2 * rate; i++) sum += data[i]! * data[i]!;
        const outDb = 10 * Math.log10((sum / rate) * 2);
        return outDb - inDb;
      },
      MUSIC_COMPRESSOR,
    );
    await page.close();
    expect(
      measured,
      `the browser's DynamicsCompressorNode lifts a −30 dBFS sine by ${measured.toFixed(2)} dB at these ` +
        `settings, and MUSIC_COMPRESSOR.makeup says ${MUSIC_COMPRESSOR.makeup} — makeMusicOut divides out the wrong number`,
    ).toBeCloseTo(MUSIC_COMPRESSOR.makeup, 0);
    expect(Math.abs(measured - MUSIC_COMPRESSOR.makeup), 'within a quarter of a decibel').toBeLessThan(0.25);
  });
});
