// The album's pictures: every place's music-room flythrough, square, with the room's controls hidden.
//
// Usage:  npx vite build && node scripts/album-art.mjs --out=C:/itc-renders/art [--size=1500] [--scale=2]
//
// ⚠️ IT SHOOTS THE SHIPPED PAGE, on scripts/shot.mjs's terms: `dist/index.html`, the Music button, each place's
// own button, and the flythrough the game draws behind them — so the pictures are the game's own art and not a
// mock-up of it. The room's text and buttons are hidden for the shot and nothing else is touched.

import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchChromium } from './chromium.mjs';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const out = resolve(args.get('out') ?? 'art');
const size = Number(args.get('size') ?? 1500);
const scale = Number(args.get('scale') ?? 2);
const moments = (args.get('at') ?? '4000,12000,24000').split(',').map(Number);
const dist = resolve('dist/index.html');
if (!existsSync(dist)) {
  console.error('No dist/index.html. Run `npx vite build` first.');
  process.exit(2);
}
mkdirSync(out, { recursive: true });

const PLACES = ['The Approach', 'Ember Nebula', 'Saurian Belt', 'The Labyrinth', 'Rime Shelf', 'The Toxic Mire', 'The Black Heart'];
const browser = await launchChromium({ headless: true });
let failed = false;
try {
  for (const place of PLACES) {
    const page = await (await browser.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: scale })).newPage();
    await page.goto(pathToFileURL(dist).href);
    await page.waitForSelector('#app canvas', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Music' }).click();
    await page.getByRole('button', { name: place, exact: true }).click();
    // Hide every overlay the room draws over the flythrough; leave the canvas alone.
    await page.addStyleTag({ content: '#app > :not(canvas) { visibility: hidden !important; }' });
    let elapsed = 0;
    for (const moment of moments) {
      await page.waitForTimeout(moment - elapsed);
      elapsed = moment;
      const path = resolve(out, `${place.toLowerCase().replace(/[^a-z]+/g, '-')}-${String(moment / 1000).padStart(2, '0')}s.png`);
      await page.locator('#app').screenshot({ path });
      console.log(path);
    }
    await page.context().close();
  }
} catch (e) {
  console.error(e);
  failed = true;
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
