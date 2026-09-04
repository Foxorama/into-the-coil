// A picture of named sprites off the sheet, at a zoom, without a hand on the page.
//
// Usage:
//   npm run sheet                                    (in another shell — this needs the dev server)
//   node scripts/shot-sheet.mjs ship bullet burst1   named kinds, one PNG each
//   node scripts/shot-sheet.mjs --all                every row
//   node scripts/shot-sheet.mjs ship --zoom=8 --theme=saurian --palette=high-contrast
//
// ⚠️ IT SHOOTS THE SHEET (docs/decisions/0193-the-sheet-is-the-instrument.md) AND NOT THE ATLAS
// DIRECTLY, for the reason docs/decisions/0116-the-rig-plays-the-level.md gives: the instrument that
// bakes its own copy of the art has a verdict taken from a picture the game never draws. The sheet
// calls `bakeAtlas` exactly as `src/app/mount.ts` does; this only points a camera at it.
//
// ⚠️ AND IT IS THE EYES docs/decisions/0227-a-sprite-is-painted-not-filled.md WAS DRAWN WITH. A
// containment guard says a mark is on the hull; nothing but a picture says the mark is a canopy. The
// ship's first nose light passed every guard in the suite and was a smear until this showed it.
//
// Output: shots/sheet-<kind>.png, gitignored working material on /shots/'s own terms.

import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launchChromium } from './chromium.mjs';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const all = process.argv.includes('--all');
const out = resolve(arg('out', 'shots'));
const port = arg('port', '5173');
const zoom = arg('zoom', '4');
const theme = arg('theme', 'approach');
const palette = arg('palette', 'vivid');
const viewport = arg('viewport', '1');

if (wanted.length === 0 && !all) {
  console.error('shot-sheet: name at least one sprite kind, or pass --all');
  process.exit(2);
}
if (!existsSync(out)) mkdirSync(out, { recursive: true });

const browser = await launchChromium({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 200)));

let failure = null;
try {
  await page.goto(`http://localhost:${port}/rig/sheet.html`, { waitUntil: 'load' });
  await page.waitForSelector('#sheet .card');
  // The sheet's own controls, driven as a hand would drive them, so the bake is the sheet's bake.
  await page.selectOption('#palette', palette);
  await page.selectOption('#theme', theme);
  await page.selectOption('#viewport', viewport);
  await page.selectOption('#zoom', zoom);
  await page.waitForSelector('#sheet .card');
  // Let a card be as wide as its zoomed art, so the capture is never a clipped corner of it.
  await page.addStyleTag({ content: '#sheet{display:block}.card{display:inline-flex;margin:6px}.art{overflow:visible}' });

  const cards = page.locator('#sheet .card');
  const count = await cards.count();
  let written = 0;
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const name = (await card.locator('.name').textContent())?.trim() ?? '';
    if (!all && !wanted.includes(name)) continue;
    const file = resolve(out, `sheet-${name}.png`);
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: file });
    console.log(`wrote ${file}`);
    written++;
  }
  const missing = wanted.filter((k) => !all).length > 0 ? wanted.length - written : 0;
  if (written === 0) failure = 'shot-sheet: nothing matched — is the name a sprite kind, and is the sheet up?';
  else if (!all && missing > 0) console.log(`shot-sheet: ${missing} of ${wanted.length} names matched no card`);
} catch (e) {
  failure = `shot-sheet: ${String(e).slice(0, 300)}`;
} finally {
  await browser.close();
}
if (failure !== null) {
  console.error(failure);
  process.exit(1);
}
