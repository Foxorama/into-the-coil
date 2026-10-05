// Photographs of the menus, at the camera the game ships — the title, Hangin' Out, Paint & Parts,
// Cosmo's and Settings, at a desktop and a phone, with a full table and a hangar in which every ship
// has been won in, so every band shows its OPEN state rather than its first-visit one.
//
// `reports/the-menus-are-a-place-2026-10-05.md` was written off these pictures, and each of its five
// items is handed over with the same set — 0027: *measure the picture, not the model*. Sister to
// shot.mjs, which shoots the run; this shoots what is reached without flying.
//
// ⚠️ THIS SHOOTS THE SHIPPED PAGE: build first (`npx vite build`). It fails loud, on shot.mjs's terms.
//
// Usage:
//   node scripts/shot-menus.mjs                 every screen, 1280x720 and 844x390, into shots/
//   node scripts/shot-menus.mjs --out=menus     elsewhere under the repo
//   node scripts/shot-menus.mjs --sizes=guard   at the layout guard's six sizes instead
//   node scripts/shot-menus.mjs --only=title    the title alone
//
// The seeds are the documents the page reads: `itc_scores` (every field `entryFrom` in
// src/save/scores.ts requires, `continues` and `when` included — an entry missing one is dropped
// silently and the table does not show) and `itc_hangar` (src/save/hangar.ts, version 1). Spelled
// here as data rather than imported, because a .mjs cannot import the TypeScript that owns them;
// if either shape moves, the table or the open bands go missing from the pictures, which is seen.

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

const outDir = resolve(root, arg('out', 'shots'));
if (!existsSync(dist)) {
  console.error('No dist/index.html. Run `npx vite build` first — this shoots the SHIPPED page.');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const ships = ['fighter', 'caddie', 'firebird', 'estate'];
const per = (f) => Object.fromEntries(ships.map((s) => [s, f(s)]));
const hangar = JSON.stringify({
  v: 1,
  won: per(() => true),
  plate: per((s) => s),
  shards: 1240,
  owned: { dice: true, eucalyptus: true, family: false, golfball: false, snowflake: true, whitewall: true, spinner: false, standard: true, ion: false },
  hung: per((s) => (s === 'estate' ? 'dice' : null)),
  special: per((s) => s),
  gun: per((s) => s),
  rim: { fighter: null, caddie: null, firebird: 'snowflake', estate: 'whitewall' },
  art: {},
  livery: per(() => null),
  flame: per(() => 'standard'),
});
const now = Date.now();
const day = 86_400_000;
const scores = JSON.stringify({
  v: 1,
  entries: [
    { score: 1579750, bonus: 200000, pilot: 'bo', difficulty: 'legendary', levels: 7, cleared: true, continues: 0, when: now - day },
    { score: 826877, bonus: 90000, pilot: 'woo', difficulty: 'savior', levels: 5, cleared: false, continues: 0, when: now - 2 * day },
    { score: 753754, bonus: 50000, pilot: 'larry', difficulty: 'burn', levels: 4, cleared: false, continues: 1, when: now - 3 * day },
    { score: 388139, bonus: 20000, pilot: 'feather', difficulty: 'savior', levels: 3, cleared: false, continues: 0, when: now - 4 * day },
    { score: 241893, bonus: 0, pilot: 'bo', difficulty: 'legendary', levels: 2, cleared: false, continues: 0, when: now - 5 * day },
  ],
});

/** The sizes: the laptop every budget is argued against (0153), and the phone the chrome is sized for (0465). */
const PAIR = [
  { tag: 'desk', width: 1280, height: 720, phone: false },
  { tag: 'phone', width: 844, height: 390, phone: true },
];
/**
 * `--sizes=guard`: the six the layout guard holds (`VIEWPORTS` in tests/layout.browser.test.ts), opened
 * as it opens them — no touch, one pixel a pixel — because the plan hands each item over at these.
 */
const GUARD = [
  [480, 320],
  [667, 375],
  [812, 375],
  [915, 412],
  [1024, 768],
  [1280, 720],
].map(([width, height]) => ({ tag: `${width}x${height}`, width, height, phone: false }));
const SIZES = arg('sizes', 'pair') === 'guard' ? GUARD : PAIR;

/** A screen's shown panel, by the prefix src/app/chrome.ts gives it. Checked, not assumed: no panel, no picture. */
const shown = (screen) => `.itc-${screen}-shown`;

const browser = await launchChromium({ headless: true });
const written = [];
let failure = null;
try {
  for (const size of SIZES) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: size.phone ? 2 : 1,
      hasTouch: size.phone,
    });
    await context.addInitScript(
      ([h, s]) => {
        localStorage.setItem('itc_hangar', h);
        if (s !== null) localStorage.setItem('itc_scores', s);
      },
      // `--bare`: no table, which is the title every first visit sees and a different layout (0460).
      [hangar, process.argv.includes('--bare') ? null : scores],
    );
    const page = await context.newPage();
    await page.goto(pathToFileURL(dist).href);
    await page.waitForTimeout(1500);
    // Escape leaves the splash for the title without asking for the sound — tests/intro.ts.
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('title'), { timeout: 20_000 });
    await page.waitForTimeout(800);
    const shoot = async (name) => {
      const path = resolve(outDir, `${size.tag}-${name}.png`);
      await page.screenshot({ path });
      written.push(path);
    };
    await shoot('title');
    // `--only=title`: the one screen an item touched, for the turns of a layout pass.
    if (arg('only', '') === 'title') {
      await context.close();
      continue;
    }
    await page.locator(`${shown('title')} .itc-title-action`, { hasText: 'Hangin' }).first().click();
    await page.waitForSelector(shown('hangar'));
    await page.waitForTimeout(600);
    await shoot('hangar');
    await page.locator(`${shown('hangar')} .itc-hangar-tab`, { hasText: 'Paint' }).first().click();
    await page.waitForSelector(shown('parts'));
    await page.waitForTimeout(600);
    await shoot('parts');
    await page.locator(`${shown('parts')} .itc-parts-tab`, { hasText: 'Cosmo' }).first().click();
    await page.waitForSelector(shown('shop'));
    await page.waitForTimeout(600);
    await shoot('shop');
    await page.locator(`${shown('shop')} .itc-shop-action`, { hasText: 'Back' }).first().click();
    await page.waitForSelector(shown('title'));
    await page.locator(`${shown('title')} .itc-title-action`, { hasText: 'Settings' }).first().click();
    await page.waitForSelector(shown('settings'));
    await page.waitForTimeout(600);
    await shoot('settings');
    await context.close();
  }
} catch (error) {
  failure = error;
} finally {
  await browser.close();
}

if (failure !== null) {
  console.error(failure);
  process.exit(1);
}
for (const path of written) console.log(path);
