// Throwaway: where does a fresh runner's first browser test spend its time? Three at once, as the
// proof's first wave does, then three again on the now-warm machine.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { launchChromium, chromePath } from '../scripts/chromium.mjs';

const dist = pathToFileURL(resolve('dist/index.html')).href;
const now = () => performance.now();

async function one(round, i) {
  const r = { round, i };
  let t = now();
  const browser = await launchChromium({ headless: true });
  r.launch = now() - t;
  t = now();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
  r.page = now() - t;
  t = now();
  await page.goto(dist);
  r.goto = now() - t;
  t = now();
  await page.waitForSelector('#app canvas', { timeout: 120_000 });
  r.canvas = now() - t;
  t = now();
  await page.keyboard.press('Escape');
  await page.waitForSelector('.itc-title-shown', { timeout: 120_000 });
  r.title = now() - t;
  t = now();
  await browser.close();
  r.close = now() - t;
  for (const k of Object.keys(r)) if (typeof r[k] === 'number' && k !== 'round' && k !== 'i') r[k] = Math.round(r[k]);
  return r;
}

console.log('chrome:', chromePath);
for (const round of [1, 2]) {
  const t = now();
  const rows = await Promise.all([0, 1, 2].map((i) => one(round, i)));
  for (const r of rows) console.log('MEASURE ' + JSON.stringify(r));
  console.log(`MEASURE round ${round} wall ${Math.round(now() - t)} ms`);
}
