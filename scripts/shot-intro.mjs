// Photographs of the intro at its beats, at the camera the game ships — the room, the chase, the station
// outside. Sister to shot-menus.mjs, which shoots what is reached without flying; this presses Fly and
// shoots what the flight opens on, a list of seconds after the press.
//
// Landed by `docs/decisions/0675-the-station-is-a-ship.md` from the scratch beat-shooter
// `reports/the-port-is-a-cutout-2026-10-24.md` was written off, so every port item is photographed the same
// way — 0027: *measure the picture, not the model*.
//
// ⚠️ THIS SHOOTS THE SHIPPED PAGE: build first (`npx vite build`). It fails loud, on shot.mjs's terms.
//
// ⚠️ THE SECONDS ARE THE WALL CLOCK'S, FROM THE PRESS. The sim steps at 60 Hz (0022) and catches up on a slow
// frame, so a shot lands within a frame of its second on a machine that draws the intro at speed; on one
// that draws it at four frames a second it lands within a quarter of one. Read a beat off
// `BEATS` in src/content/port.ts, not off the picture's name, when a quarter-second matters.
//
// Usage:
//   node scripts/shot-intro.mjs                  12.4 s, 13.5 s and 15 s, 1280x720 and 844x390, into shots/
//   node scripts/shot-intro.mjs --at=1,5.3,9.1   other seconds
//   node scripts/shot-intro.mjs --out=intro      elsewhere under the repo
//   node scripts/shot-intro.mjs --sizes=wide     at 1920x1080 and 2560x1080 instead
//
// The seed is shot-menus.mjs's hangar, so the pilot's ship flies as it is dressed there.

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

const AT = arg('at', '12.4,13.5,15')
  .split(',')
  .map(Number)
  .sort((a, b) => a - b);
if (AT.some((s) => !Number.isFinite(s) || s < 0)) {
  console.error('--at is a list of seconds after the press, e.g. --at=12.4,13.5,15.');
  process.exit(2);
}

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

/** The laptop every budget is argued against (0153), and the phone the chrome is sized for (0465). */
const PAIR = [
  { tag: 'desk', width: 1280, height: 720, phone: false },
  { tag: 'phone', width: 844, height: 390, phone: true },
];
const WIDE = [
  [1920, 1080],
  [2560, 1080],
].map(([width, height]) => ({ tag: `${width}x${height}`, width, height, phone: false }));
const SIZES = { pair: PAIR, wide: WIDE }[arg('sizes', 'pair')];
if (SIZES === undefined) {
  console.error('--sizes is pair or wide.');
  process.exit(2);
}

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
    await context.addInitScript((h) => localStorage.setItem('itc_hangar', h), hangar);
    const page = await context.newPage();
    await page.goto(pathToFileURL(dist).href);
    await page.waitForTimeout(1500);
    // Escape leaves the splash for the title without asking for the sound — tests/intro.ts.
    await page.keyboard.press('Escape');
    await page.waitForSelector('.itc-title-shown', { timeout: 20_000 });
    await page.waitForTimeout(800);
    // Fly: the title's first action (src/state/screens.ts), and the intro is up when its skip is.
    await page.locator('.itc-title-shown .itc-title-action').first().click();
    const pressed = Date.now();
    await page.waitForSelector('.itc-intro-skip-shown', { state: 'attached', timeout: 30_000 });
    for (const second of AT) {
      const wait = pressed + second * 1000 - Date.now();
      if (wait > 0) await page.waitForTimeout(wait);
      const path = resolve(outDir, `${size.tag}-intro-${second.toFixed(1)}s.png`);
      await page.screenshot({ path });
      written.push(path);
    }
    await context.close();
  }
} catch (error) {
  failure = error;
} finally {
  await browser.close();
}
for (const path of written) console.log(path);
if (failure !== null) {
  console.error(failure);
  process.exit(1);
}
