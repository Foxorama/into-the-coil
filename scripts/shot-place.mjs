// A picture of every place, at the camera the game computes, without flying to it.
//
// Usage:
//   npm run bench                        (in another shell — this needs the dev server)
//   node scripts/shot-place.mjs                       every place, three points each
//   node scripts/shot-place.mjs nebula --at=1299      one place, one point
//   node scripts/shot-place.mjs --out=keepsakes       somewhere other than shots/
//
// ⚠️ IT SHOOTS THE BENCH AND NOT `dist`, WHICH IS THE WHOLE REASON IT EXISTS. `scripts/shot.mjs`
// shoots the shipped page at a time into a RUN, so it can only ever see level one without playing
// through six boss fights — and docs/decisions/0203 and 0204 record every shot of the Pillars being
// taken by temporarily moving the landmark onto level one. The bench
// (docs/decisions/0205-the-bench-jumps-to-where-the-thing-is.md) already knows how to stand anywhere;
// this is that, with a camera and no hands.
//
// ⚠️ AND A PICTURE IS THE ONLY INSTRUMENT THAT HAS EVER CAUGHT ANYTHING HERE. Four of the six defects
// across 0203 and 0204 were invisible to every guard in the repository and obvious in one screenshot:
// columns drawn sideways, feet cut off in mid-air, a rectangle clipped around the gas, and entirely
// the wrong colour.

import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launchChromium } from './chromium.mjs';
import { LEVEL_KINDS, LEVELS } from '../src/content/levels.ts';
import { THEMES } from '../src/content/themes.ts';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const out = resolve(arg('out') ?? 'shots');
const port = arg('port') ?? '5199';
const only = arg('at');
const SCRUB_STEP = 10; // `rig/bench.html`'s `#along` — a value off this grid is refused, not rounded.

if (!existsSync(out)) mkdirSync(out, { recursive: true });

/*
  ⚠️ **THREE POINTS PER PLACE, AND THEY ARE THE ONES A PLAYER SPENDS TIME AT.** The opening, where the
  build lands, and the approach to the boss — so a place is judged over its own length rather than at
  whichever moment happened to be on screen. `bossAt` is read off the level so a retuned script moves
  the camera with it.
*/
const pointsFor = (kind) => {
  if (only !== undefined) return [Math.round(Number(only) / SCRUB_STEP) * SCRUB_STEP];
  const { bossAt } = LEVELS[kind];
  // The scrub is a range with `step="10"`, and a value off that grid is refused rather than rounded.
  const onGrid = (fraction) => Math.round((bossAt * fraction) / SCRUB_STEP) * SCRUB_STEP;
  return [onGrid(0.06), onGrid(0.42), onGrid(0.88)];
};

const browser = await launchChromium({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 200)));

const url = `http://localhost:${port}/rig/bench.html`;

const kinds = wanted.length > 0 ? LEVEL_KINDS.filter((k) => wanted.includes(LEVELS[k].theme) || wanted.includes(k)) : LEVEL_KINDS;
if (kinds.length === 0) {
  console.error(`shot-place: no place matched ${wanted.join(', ')}`);
  await browser.close();
  process.exit(1);
}

for (const kind of kinds) {
  for (const at of pointsFor(kind)) {
    /*
      ⚠️ **A FRESH PAGE PER SHOT, BECAUSE THE BENCH PLAYS THE GAME AND THE SHIP DIES IN IT.** 0116 and
      0205 both insist the bench is the game rather than a model of it, and the price of that is a
      parked ship taking fire from every wave the scrub bar walks past — the first run of this script
      photographed a *Run over* screen where Saurian Belt should have been. Nothing here may quiet the
      sim to suit the camera, so the camera arrives before the damage does instead.
    */
    try {
      await page.goto(url, { timeout: 20_000 });
    } catch {
      console.error(`shot-place: nothing answering at ${url}. Start the bench first: npm run bench`);
      await browser.close();
      process.exit(1);
    }
    await page.waitForSelector('#level', { timeout: 15_000 });

    /*
      ⚠️ **THE BENCH'S OWN CONTROLS, DRIVEN AS A PLAYER WOULD** — not a hook into its internals. It
      already winds the spawn cursors forward so a jump means the same thing as a flight, and reaching
      past that would be this script quietly standing somewhere the bench does not. `hold` pins the
      camera where the scrub left it, so two runs of this script stand in the same place.
    */
    await page.check('#hold');
    await page.selectOption('#level', kind);
    // The select's own handler re-ranges `#along` and rewinds it to 0, so the scrub is set after it.
    await page.fill('#along', String(at));
    await page.dispatchEvent('#along', 'input');
    // A few frames, so the atlas has re-baked for the place and the scene has drawn at the new camera.
    await page.waitForTimeout(900);
    const name = `${LEVELS[kind].theme}-${String(at).padStart(4, '0')}.png`;
    await page.locator('#stage').screenshot({ path: resolve(out, name) });
    console.log(`${THEMES[LEVELS[kind].theme].title.padEnd(16)} ${String(at).padStart(5)} units  →  ${name}`);
  }
}

await browser.close();
