// Every look on the pad — 0541: each ship, as the pilots fly them, in each of its arts, each rim it can
// wear, a spread of paints and both flames, on Paint & Parts' stand, cropped to the stand. The pad is the
// preview since 0540, so a look that reads on `rig/looks.html` at three times the fight's size has to read
// here too; this is the page that says whether it does.
//
// ⚠️ THIS SHOOTS THE SHIPPED PAGE: build first (`npx vite build`). It fails loud, on shot-menus.mjs's terms.
//
// Usage:
//   node scripts/shot-pad.mjs                 1280x720, into shots/pad/
//   node scripts/shot-pad.mjs --out=pad       elsewhere under the repo
//
// The seed is `itc_hangar` (src/save/hangar.ts, version 1) with every ship won in and every ware owned, so
// every look is open. Spelled here as data, on shot-menus.mjs's terms: a shape that moves shows as shut
// bands in the pictures.

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

const outDir = resolve(root, arg('out', 'shots/pad'));
if (!existsSync(dist)) {
  console.error('No dist/index.html. Run `npx vite build` first — this shoots the SHIPPED page.');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const ships = ['fighter', 'caddie', 'firebird', 'estate', 'thunderbolt'];
const per = (f) => Object.fromEntries(ships.map((s) => [s, f(s)]));
const hangar = JSON.stringify({
  v: 1,
  won: per(() => true),
  shards: 0,
  owned: { dice: true, eucalyptus: true, family: true, golfball: true, snowflake: true, whitewall: true, spinner: true, bolts: true, standard: true, ion: true },
});

const PARTS = '.itc-parts-shown';
const band = (setting) => `${PARTS} [data-itc-setting="${setting}"] .itc-parts-option`;
/** The paints shot: the factory's, and every third hue round the wheel. */
const PAINTS = [0, 1, 4, 7, 10];

const browser = await launchChromium({ headless: true });
const written = [];
let failure = null;
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await context.addInitScript((h) => localStorage.setItem('itc_hangar', h), hangar);
  const page = await context.newPage();
  await page.goto(pathToFileURL(dist).href);
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.itc-title-shown', { timeout: 20_000 });
  await page.locator('.itc-title-shown .itc-title-action', { hasText: 'Hangin' }).first().click();
  await page.waitForSelector('.itc-hangar-shown');
  await page.locator('.itc-hangar-shown .itc-hangar-tab', { hasText: 'Paint' }).first().click();
  await page.waitForSelector(PARTS);
  const press = async (selector, index) => {
    const button = page.locator(`${selector} >> nth=${index}`);
    if ((await button.count()) === 0 || (await button.isDisabled())) return false;
    await button.dispatchEvent('click');
    await page.waitForTimeout(250);
    return true;
  };
  const shoot = async (name) => {
    const box = await page.locator(`${PARTS} .itc-parts-stand`).boundingBox();
    const path = resolve(outDir, `${name}.png`);
    await page.screenshot({ path, clip: box });
    written.push(path);
  };
  const pilots = await page.locator(band('pilot')).count();
  for (let p = 0; p < pilots; p++) {
    await press(band('pilot'), p);
    const ship = (await page.locator(`${PARTS} .itc-parts-pilot-craft`).textContent()).replace(/^The /, '').toLowerCase().replace(/\s+/g, '-');
    for (let a = 0; a < 3; a++) if (await press(band('art'), a)) await shoot(`${p}-${ship}-art${a}`);
    await press(band('art'), 0);
    const rims = await page.locator(band('rim')).count();
    for (let r = 0; r < rims; r++) if (await press(band('rim'), r)) await shoot(`${p}-${ship}-rim${r}`);
    for (const paint of PAINTS) if (await press(band('livery'), paint)) await shoot(`${p}-${ship}-paint${paint}`);
    await press(band('livery'), 0);
    if (await press(band('flame'), 1)) await shoot(`${p}-${ship}-ion`);
    await press(band('flame'), 0);
  }
  await context.close();
} catch (error) {
  failure = error;
} finally {
  await browser.close();
}

if (failure !== null) {
  console.error(failure);
  process.exit(1);
}
console.log(`${written.length} pictures in ${outDir}`);
