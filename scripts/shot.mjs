// Screenshots of the shipped page, at the camera the game actually computes.
//
// docs/decisions/0027-measure-the-picture-not-the-model.md: *"an eyes-on rig renders at the camera
// the game actually ships"*, and `reports/enemy-silhouettes-2026-08-05.md` is what happens without
// one — a silhouette reasoned to be obviously not a diamond, which shipped as a diamond.
//
// ⚠️ SISTER TO trace-frame.mjs, NOT A REPLACEMENT FOR IT. That one answers *how far did it move*, in
// pixels, over time. This one answers *what does it look like*, which is a question no number has
// ever settled and the one that has now cost this project two art passes.
//
// ⚠️ THIS SHOOTS THE SHIPPED PAGE. `dist/index.html`, at whatever camera the game computed for the
// viewport given — not a fixture, not a sprite sheet, not the atlas laid out on a grid. A sprite is
// legible or it is not AT THE SIZE AND AGAINST THE BACKGROUND IT SHIPS, which is the whole finding.
//
// ⚠️ IT FAILS LOUD, for the reason trace-frame.mjs states: the predecessor had ~64 rigs that printed
// "no chromium" and exited 0, and every one of them silently rendered nothing for months.
//
// Usage:
//   node scripts/shot.mjs --at=4000,40000               two shots, 4s and 40s into the run
//   node scripts/shot.mjs --at=185000 --out=keepsakes   the boss fight
//
// Times are milliseconds from the moment Start is pressed. One page load, many shots, so the whole
// level costs one run rather than one run per moment.

import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { launchChromium } from './chromium.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = resolve(root, 'dist/index.html');

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
}

const at = arg('at', '4000')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n >= 0)
  .sort((a, b) => a - b);
const width = Number(arg('width', '1280'));
const height = Number(arg('height', '720'));
const outDir = resolve(root, arg('out', 'keepsakes/shots'));

if (at.length === 0) {
  console.error('--at needs at least one non-negative number of milliseconds');
  process.exit(2);
}
if (!existsSync(dist)) {
  console.error('No dist/index.html. Run `npx vite build` first — this shoots the SHIPPED page.');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

/**
 * The control that starts a run.
 *
 * ⚠️ Spelled here and in src/app/chrome.ts, and that is the one duplication in this file. A .mjs
 * script cannot import the TypeScript seam that owns the prefix, so instead of pretending the
 * duplicate is safe it is CHECKED: no control, no screenshots, non-zero exit. A rig that quietly
 * shot a title screen for three minutes is exactly the failure mode this tool exists to end.
 */
const START = '.itc-title-action';

const browser = await launchChromium({ headless: true });
let failure = null;
const written = [];
try {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(pathToFileURL(dist).href);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });

  const start = await page.$(START);
  if (start === null) {
    throw new Error(`no start control at ${START} — see src/app/chrome.ts and tests/chrome.test.ts`);
  }
  await start.click();

  /*
    ⚠️ **THE HOST, NOT THE CANVAS — and shooting the canvas was a real bug in this tool.** The screens
    are DOM over the playfield (src/app/chrome.ts), so a canvas-only screenshot crops out every
    overlay: a run that had already ended photographed as a live one, with the frozen last frame
    looking like play. Three shots were read as "the boss never appears" when what they showed was a
    game-over screen with its title cropped off.

    A rig whose whole job is *what does the player see* must photograph what the player sees. This is
    the same class of mistake as measuring the model instead of the picture — one level up, in the
    instrument itself.
  */
  const canvas = page.locator('#app');
  let elapsed = 0;
  for (const moment of at) {
    await page.waitForTimeout(Math.max(0, moment - elapsed));
    elapsed = moment;
    const seconds = (moment / 1000).toFixed(0).padStart(3, '0');
    const path = resolve(outDir, `t${seconds}s-${width}x${height}.png`);
    await canvas.screenshot({ path });
    written.push({ path, moment });
    console.log(`  ${String(moment).padStart(7)}ms  ->  ${path}`);
  }

  if (errors.length > 0) throw new Error(`the page logged errors:\n${errors.join('\n')}`);
} catch (e) {
  failure = e;
} finally {
  await browser.close();
}

if (failure !== null) {
  console.error(`\n${failure.message ?? failure}`);
  process.exit(1);
}
if (written.length === 0) {
  console.error('\nNo screenshots were written, and no error was reported. That is a bug in this script.');
  process.exit(1);
}
console.log(`\n${written.length} shot(s) at ${width}x${height}. Look at them.`);
