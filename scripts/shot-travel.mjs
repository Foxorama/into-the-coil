// A picture of the crossing between two places, at three moments of it, without winning a boss fight.
//
// Usage:
//   npm run bench                        (in another shell — this needs the dev server)
//   node scripts/shot-travel.mjs                      every leg of the route, three moments each
//   node scripts/shot-travel.mjs 6                    one leg: the crossing into The Black Heart
//   node scripts/shot-travel.mjs --out=keepsakes      somewhere other than shots/
//
// ⚠️ IT SHOOTS THE BENCH AND NOT `dist`, for `scripts/shot-place.mjs`'s reason word for word: the
// shipped page can only be driven from level one, and the crossing into the seventh place is six boss
// fights away. `rig/bench.ts`'s `?cross=` raises the chart through the game's own two verbs.
//
// ⚠️ AND IT SHOOTS THE WHOLE STAGE RATHER THAN THE CANVAS, BECAUSE HALF THE SCREEN IS CHROME. The
// chart is painted on the canvas and the place's name is a DOM panel over it — docs/decisions/0340 —
// and the question a picture is being taken to answer is whether the second covers the first. A shot
// of either alone cannot see it, which is the shape of the bug 0063 found by measuring where a banner
// actually landed.
//
// ⚠️ THE MOMENTS ARE OFF THE ROUND SECOND ON PURPOSE. The ship eases along its leg over the crossing's
// floor, so shots at 1, 2 and 3 seconds sample a curve at its most predictable points and read as a
// confident wrong answer about the easing. The offsets are also inside the four-second floor with room
// to spare, because the crossing ENDS on its own and a late shot photographs the level behind it.

import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launchChromium } from './chromium.mjs';
import { LEVEL_KINDS, LEVELS } from '../src/content/levels.ts';
import { THEMES } from '../src/content/themes.ts';
import { TRAVELS } from '../src/content/travel.ts';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
const out = resolve(arg('out') ?? 'shots');
const port = arg('port') ?? '5199';

if (!existsSync(out)) mkdirSync(out, { recursive: true });

/** Where in the crossing each shot is taken, in milliseconds. See the header for the offsets. */
const MOMENTS = [420, 1730, 3180];

const floorMs = (TRAVELS.scene.floorSteps / 60) * 1000;
for (const at of MOMENTS) {
  if (at < floorMs) continue;
  console.error(`shot-travel: ${at}ms is past the crossing's own floor of ${floorMs}ms — it will be over.`);
  process.exit(1);
}

const legs = wanted.length > 0 ? wanted : LEVEL_KINDS.map((_, i) => i).slice(1);

const browser = await launchChromium({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 200)));

for (const leg of legs) {
  for (const at of MOMENTS) {
    /*
      ⚠️ **A FRESH PAGE PER SHOT, BECAUSE THE CROSSING IS OVER IN FOUR SECONDS.** It is not a state the
      bench can be put back into — `?cross=` is read once, at boot, exactly as `?weapon=` is — and that
      is right rather than a limitation: the crossing happens once per level in the game too.
    */
    const url = `http://localhost:${port}/rig/bench.html?cross=${leg}`;
    try {
      await page.goto(url, { timeout: 20_000 });
    } catch {
      console.error(`shot-travel: nothing answering at ${url}. Start the bench first: npm run bench`);
      await browser.close();
      process.exit(1);
    }
    await page.waitForSelector('#level', { timeout: 15_000 });
    await page.waitForTimeout(at);
    const theme = LEVELS[LEVEL_KINDS[leg]].theme;
    const name = `travel-${String(leg)}-${theme}-${String(at).padStart(4, '0')}ms.png`;
    await page.locator('#stage').screenshot({ path: resolve(out, name) });
    console.log(`into ${THEMES[theme].title.padEnd(16)} ${String(at).padStart(5)} ms  →  ${name}`);
  }
}

await browser.close();
