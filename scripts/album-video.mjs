// The album's moving pictures: one place's music-room flythrough, recorded frame by frame into ffmpeg.
//
// Usage:  npx vite build
//         node scripts/album-video.mjs --place="Ember Nebula" --seconds=160.4 --out=C:/itc-renders/video/master/x.mp4
//         [--from=40] [--view=1920x1080] [--scale=2] [--settle=3000] [--ff="<ffmpeg output args>"]
//
// ⚠️ **IT SHOOTS THE SHIPPED PAGE**, on `scripts/album-art.mjs`'s terms: `dist/index.html`, the Music button, the
// place's own button, and the flythrough the game draws behind them, with the room's text and buttons hidden for
// the recording. The picture is the game's own and not a mock-up of it — `reports/the-album-release-2026-09-17.md`.
//
// ⚠️ **AND IT REPLACES `requestAnimationFrame` BEFORE THE PAGE LOADS, WHICH IS THE WHOLE INSTRUMENT.** A recording
// driven by the wall clock samples whatever the machine managed while it was also encoding 4K; the shim makes every
// frame exactly one 60 Hz step of `src/app/loop.ts`, so frame `n` is the camera at `n * SCROLL_PER_STEP` however
// slow the encode is. That is also what puts the video on the album's own clock: `scripts/timeline.mjs` walks a
// level at `UNITS_PER_SECOND`, which is the same 36 units a second, so a track and its picture stay together for
// three minutes without a single sync mark.
//
// ⚠️ **THE ROOM HAS TO BE 0358 OR NEWER.** Before that decision the music room drew on a clock that does not run —
// a recording of the belt made against an older build shows a volcano whose rock hangs in the air.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchChromium } from './chromium.mjs';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const place = args.get('place') ?? 'The Approach';
const from = Number(args.get('from') ?? 0);
const seconds = Number(args.get('seconds') ?? 10);
const [vw, vh] = (args.get('view') ?? '1920x1080').split('x').map(Number);
const scale = Number(args.get('scale') ?? 2);
const settle = Number(args.get('settle') ?? 3000);
const out = resolve(args.get('out') ?? 'shots/album-video.mp4');
const FPS = 60;
// Kept lossless-ish on purpose: a master is cut, faded and re-encoded afterwards, so this is not the delivery.
const ffmpegArgs = (args.get('ff') ?? '-c:v libx264 -preset veryfast -crf 10 -pix_fmt yuv420p').split(' ');

const dist = resolve('dist/index.html');
if (!existsSync(dist)) {
  console.error('No dist/index.html. Run `npx vite build` first.');
  process.exit(2);
}
mkdirSync(dirname(out), { recursive: true });

/** Every frame is one step, and the page's own loop is what asks for it. */
const SHIM = () => {
  let queue = [];
  let now = 1000;
  let id = 0;
  window.requestAnimationFrame = (cb) => {
    queue.push({ id: ++id, cb });
    return id;
  };
  window.cancelAnimationFrame = (handle) => {
    queue = queue.filter((q) => q.id !== handle);
  };
  /*
    ⚠️ **THE EPSILON IS NOT A FUDGE.** `src/app/loop.ts` takes `floor(elapsed / STEP_MS)` steps, and an elapsed of
    exactly `1000/60` lands on the boundary — in binary it rounds under about as often as over, so a run drops a
    step here and takes two there. A microsecond over the step keeps it at exactly one, and 9600 frames of it
    amount to a hundredth of a step.
  */
  window.__pump = (frames, steps = 1) => {
    for (let frame = 0; frame < frames; frame++) {
      now += (1000 / 60) * steps + 1e-6;
      const due = queue;
      queue = [];
      for (const q of due) q.cb(now);
    }
  };
};

const browser = await launchChromium({ headless: true });
let failed = false;
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', ...ffmpegArgs, out], {
  stdio: ['pipe', 'inherit', 'inherit'],
});
try {
  const page = await (await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: scale })).newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.addInitScript(SHIM);
  await page.goto(pathToFileURL(dist).href);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  await page.evaluate(() => window.__pump(2));
  await page.getByRole('button', { name: 'Music' }).click();
  await page.evaluate(() => window.__pump(2));
  await page.getByRole('button', { name: place, exact: true }).click();
  // Hide every overlay the room draws over the flythrough; leave the canvas alone.
  await page.addStyleTag({ content: '#app > :not(canvas) { visibility: hidden !important; }' });
  // The place's atlas bakes on its own schedule — real time, with the camera held by the shim.
  await page.waitForTimeout(settle);
  // Walk to `from` five steps a frame, which is the cap `src/app/loop.ts` takes in one callback.
  const skip = Math.round(from * FPS);
  await page.evaluate((n) => {
    window.__pump(Math.floor(n / 5), 5);
    window.__pump(n % 5, 1);
  }, skip);
  // One step, so the canvas holds the place rather than the room as it was before the press. Its alpha is ~0,
  // so the picture is still the camera at `from`.
  await page.evaluate(() => window.__pump(1));
  const total = Math.round(seconds * FPS);
  const began = Date.now();
  for (let i = 0; i < total; i++) {
    // The frame and the step that follows it, in one round trip: a second call per frame costs an hour over an album.
    const url = await page.evaluate(() => {
      const data = document.querySelector('#app > canvas').toDataURL('image/jpeg', 0.95);
      window.__pump(1);
      return data;
    });
    const frame = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(frame)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 600 === 0) console.log(`${place}: frame ${i}/${total}, ${((Date.now() - began) / (i + 1)).toFixed(0)} ms/frame`);
  }
  console.log(`${place}: ${total} frames in ${((Date.now() - began) / 1000).toFixed(0)} s`);
} catch (e) {
  console.error(e);
  failed = true;
} finally {
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
}
console.log(out);
process.exit(failed ? 1 : 0);
