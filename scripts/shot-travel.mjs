// A picture of the burn between two places, at four moments of it, without winning a boss fight.
//
// Usage:
//   npm run bench                        (in another shell — this needs the dev server)
//   node scripts/shot-travel.mjs                      every leg of the route, four moments each
//   node scripts/shot-travel.mjs 6                    one leg: the burn into The Black Heart
//   node scripts/shot-travel.mjs --out=keepsakes      somewhere other than shots/
//
// ⚠️ IT SHOOTS THE BENCH AND NOT `dist`, for `scripts/shot-place.mjs`'s reason word for word: the
// shipped page can only be driven from level one, and the burn into the seventh place is six boss
// fights away. `rig/bench.ts`'s `?cross=` raises it through the game's own two verbs.
//
// ⚠️ AND IT SHOOTS THE WHOLE STAGE RATHER THAN THE CANVAS, BECAUSE HALF OF IT IS CHROME. The streaks,
// the flame and the backdrop are painted on the canvas and the place's name is a DOM banner over them
// — docs/decisions/0340 — and the question a picture is taken to answer is whether the two read as
// one thing. The first build of this feature was photographed, passed, and was then played as
// *"it takes the player out of the game"*: a still cannot see a cut. So these are FOUR stills across
// the burn's own shape — building, at speed, held, trailing off — and what they are for is the things
// a still CAN see: is the flame on the tail, do the streaks read as depth, did the place change under
// them, is the banner clear of the ship.
//
// ⚠️ THE MOMENTS ARE READ OFF THE RULE, NOT TYPED. `src/content/travel.ts` holds the spool, the floor
// and the tail; a retuned burn moves the camera with it, which is what `shot-place.mjs` does with
// `bossAt`. They are nudged off the round boundary on purpose, so no shot lands on the one step where
// two phases meet and photographs neither.

import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launchChromium } from './chromium.mjs';
import { LEVEL_KINDS, LEVELS } from '../src/content/levels.ts';
import { THEMES } from '../src/content/themes.ts';
import { TRAVELS, TRAVEL_SPOOL_STEPS, TRAVEL_TRAIL_STEPS } from '../src/content/travel.ts';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
const out = resolve(arg('out') ?? 'shots');
const port = arg('port') ?? '5199';

if (!existsSync(out)) mkdirSync(out, { recursive: true });

const ms = (steps) => Math.round((steps / 60) * 1000);
const floor = TRAVELS.scene.floorSteps;
/** Where in the burn each shot is taken, and what it is a picture of. */
const MOMENTS = [
  { name: 'building', at: ms(TRAVEL_SPOOL_STEPS * 0.55) },
  { name: 'at-speed', at: ms(TRAVEL_SPOOL_STEPS + (floor - TRAVEL_SPOOL_STEPS) * 0.45) },
  { name: 'trailing', at: ms(floor + TRAVEL_TRAIL_STEPS * 0.5) },
  { name: 'arrived', at: ms(floor + TRAVEL_TRAIL_STEPS) + 700 },
];

const legs = wanted.length > 0 ? wanted : LEVEL_KINDS.map((_, i) => i).slice(1);

const browser = await launchChromium({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 200)));

for (const leg of legs) {
  for (const moment of MOMENTS) {
    /*
      ⚠️ **A FRESH PAGE PER SHOT, BECAUSE THE BURN IS OVER IN FOUR SECONDS.** It is not a state the
      bench can be put back into — `?cross=` is read once, at boot, exactly as `?weapon=` is — and that
      is right rather than a limitation: it happens once per level in the game too.
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
    await page.waitForTimeout(moment.at);
    const theme = LEVELS[LEVEL_KINDS[leg]].theme;
    const name = `travel-${String(leg)}-${theme}-${moment.name}.png`;
    // ⚠️ The PAGE and not `#stage`: the bench's stage sits under its own controls while the game's
    // overlay covers the viewport, so a shot of the stage alone crops the top of the banner — which
    // read, the first time, as the banner being clipped in the game. It is not; they coincide there.
    await page.screenshot({ path: resolve(out, name) });
    console.log(`into ${THEMES[theme].title.padEnd(16)} ${moment.name.padEnd(9)} ${String(moment.at).padStart(5)} ms  →  ${name}`);
  }
}

await browser.close();
