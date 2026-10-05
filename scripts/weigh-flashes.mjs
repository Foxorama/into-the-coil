// The flash meter: how many GENERAL FLASHES a second the picture the player watches actually makes.
//
// docs/decisions/0457-the-flash-cap-is-measured.md. 0024 put a flash cap in the floor — *"no more
// than three general flashes per second"* — and said it lands with the painter, counted. Nothing has
// counted it since: the bomb's gap (0375) and the storm's thin strokes (0374) were each argued in
// prose. This counts it, off the pixels, so a pass that makes the game louder can be told from one
// that crosses the line.
//
// ⚠️ IT READS THE PICTURE, NOT THE MODEL — docs/decisions/0027-measure-the-picture-not-the-model.md.
// The bench is the game itself (0116); the page clock is Playwright's fake one, stepped one display
// frame at a time, and every frame the game draws is read back off the canvas. Nothing here knows what
// a bomb is: a flash is a change of brightness over an area, wherever it came from.
//
// ── WHAT A GENERAL FLASH IS, AND WHERE EACH NUMBER COMES FROM ──────────────────────────────────────
//
// WCAG 2.x, "general flash and red flash thresholds" (the same definition Harding and Ofcom descend
// from, at the stricter of their areas):
//   - a TRANSITION is a change in relative luminance of at least 0.1 between a local maximum and a
//     local minimum, where the darker of the two is below 0.8;
//   - a FLASH is a pair of opposing transitions;
//   - it is GENERAL when the area changing together is at least a 341x256 rectangle of a 1024x768
//     screen — 11.1% of the screen, here as a share of the canvas;
//   - a RED flash is the same with a saturated red (R/(R+G+B) >= 0.8) moving (R-G-B)*320 by 20;
//   - the cap is THREE flashes in any one second, so seven transitions in any sixty frames fail.
//
// The screen is cut into CELL x CELL pixel cells, each tracked as its own luminance over time with a
// hysteresis of 0.1, so a slow ramp is one transition and not sixty. A frame's transitions are gathered
// over a few frames, because a ring sweeping outward crosses its threshold cell by cell.
//
// ⚠️ CELL IS 4 PIXELS, AND IT WAS 16. A cell is counted whole when its average moves, so a ten-pixel
// line of light through a sixteen-pixel cell counted the whole cell — a jagged bolt read two to three
// times its own area, and the storm's thin strokes read as a quarter of the screen. WCAG's area is the
// area that changes; at four pixels a line counts about as wide as it is.
//
// Usage:
//   node scripts/weigh-flashes.mjs --port=5301                       every scenario
//   node scripts/weigh-flashes.mjs --port=5301 --only=storm,nova     some of them
//   node scripts/weigh-flashes.mjs --port=5301 --seconds=6 --json=shots/flashes.json
//   node scripts/weigh-flashes.mjs --port=5301 --cell=16 --gather=2         the instrument's own knobs,
//                                                                           to ask whether a verdict is its
//
// ⚠️ IT FAILS LOUD (scripts/trace-frame.mjs's rule): no frames read is exit 2, a scenario over the
// cap is exit 1.

import { writeFileSync } from 'node:fs';
import { launchChromium } from './chromium.mjs';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const port = Number(arg('port', '5199'));
const seconds = Number(arg('seconds', '8'));
const only = arg('only', '')
  .split(',')
  .filter((s) => s.length > 0);
const jsonOut = arg('json', '');
const shoot = process.argv.includes('--shoot');
const width = Number(arg('width', '1280'));
const height = Number(arg('height', '720'));

const HZ = 60;
const FRAME_MS = 1000 / HZ;
/** The general-flash area — WCAG's 341x256 of a 1024x768 screen, as a share of the screen. */
const GENERAL_AREA = (341 * 256) / (1024 * 768);
/** Most transitions any sixty frames may hold: three flashes are six, so seven is the fourth flash begun. */
const MOST_TRANSITIONS = 6;
/** Frames a sweeping change's transitions are gathered over before they are one event. */
const GATHER = Number(arg('gather', '4'));
/** Pixels per side of a tracked cell — see the note on CELL above. */
const CELL = Number(arg('cell', '4'));

/**
 * Every scenario: a ship, a place, and what is done in it. A special is thrown as often as the game
 * lets it — `canThrow` refuses inside the gap, which is the thing being measured.
 */
const SCENARIOS = [
  { name: 'pulse', query: 'weapon=pulse' },
  { name: 'arc', query: 'weapon=arc' },
  { name: 'shuriken', query: 'weapon=shuriken' },
  { name: 'ray', query: 'weapon=ray' },
  { name: 'bomb', query: 'weapon=pulse', special: 'bomb' },
  { name: 'storm', query: 'weapon=arc', special: 'storm' },
  { name: 'whirlpool', query: 'weapon=shuriken', special: 'whirlpool' },
  { name: 'nova', query: 'weapon=ray', special: 'nova' },
  { name: 'voidMissile', query: 'weapon=pulse', special: 'voidMissile' },
  { name: 'hunt', query: 'weapon=pulse', special: 'hunt' },
  { name: 'overdrive', query: 'weapon=pulse', special: 'overdrive' },
  // 0537: eight fireworks in two seconds, lit again the moment the gap after the last allows.
  { name: 'candle', query: 'weapon=pulse', special: 'candle' },
  ...['jormungandr', 'volans', 'quetzal', 'gyre', 'hoarfrost', 'hydra', 'medusa'].flatMap((boss, i) =>
    [100, 50, 15].map((hp) => ({ name: `${boss}@${hp}`, query: 'weapon=arc', level: i, bossHp: hp })),
  ),
];

/** Installed in the page: reads the canvas every frame and keeps a per-cell tracker. */
function installMeter([cell, gather]) {
  const canvas = document.querySelector('#stage canvas');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('meter: no canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cols = Math.floor(w / cell);
  const rows = Math.floor(h / cell);
  const n = cols * rows;
  const lin = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    lin[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }
  const lum = new Float32Array(n);
  const red = new Float32Array(n);
  const mk = () => ({
    ext: new Float32Array(n),
    lo: new Float32Array(n),
    hi: new Float32Array(n),
    dir: new Int8Array(n),
    lastUp: new Int32Array(n).fill(-1e9),
    lastDown: new Int32Array(n).fill(-1e9),
  });
  const L = mk();
  const R = mk();
  let first = true;
  const out = [];
  let frame = 0;
  // One channel's hysteresis tracker: the share of cells changing together each way, gathered.
  const track = (t, v, step, darkCap, gather) => {
    let up = 0;
    let down = 0;
    const rise = (i, x) => {
      up++;
      t.dir[i] = 1;
      t.ext[i] = x;
      t.lastUp[i] = frame;
    };
    const fall = (i, x) => {
      down++;
      t.dir[i] = -1;
      t.ext[i] = x;
      t.lastDown[i] = frame;
    };
    for (let i = 0; i < n; i++) {
      const x = v[i];
      if (t.dir[i] === 0) {
        if (x < t.lo[i]) t.lo[i] = x;
        if (x > t.hi[i]) t.hi[i] = x;
        if (x - t.lo[i] >= step && t.lo[i] < darkCap) rise(i, x);
        else if (t.hi[i] - x >= step && x < darkCap) fall(i, x);
      } else if (t.dir[i] === 1) {
        if (x > t.ext[i]) t.ext[i] = x;
        else if (t.ext[i] - x >= step && x < darkCap) fall(i, x);
      } else {
        if (x < t.ext[i]) t.ext[i] = x;
        else if (x - t.ext[i] >= step && t.ext[i] < darkCap) rise(i, x);
      }
    }
    // ⚠️ THE AREA CHANGING TOGETHER is every cell that turned the same way inside the gather AND has
    // not turned back since. Summing the frames' shares instead read the storm's generations of bolts
    // — each a different few per cent of the screen, lit one frame and gone the next — as one flash a
    // tenth of the screen wide: area that was never lit at the same time.
    let gu = 0;
    let gd = 0;
    for (let i = 0; i < n; i++) {
      if (t.dir[i] === 1 && frame - t.lastUp[i] < gather) gu++;
      if (t.dir[i] === -1 && frame - t.lastDown[i] < gather) gd++;
    }
    return [gu / n, gd / n, up / n, down / n];
  };
  window.__meter = {
    read(strobe) {
      // The calibration: paint a strobe over the game's own frame, `hz` flashes a second over a
      // share of the screen, so the meter is seen to fail before it is believed (0005).
      if (strobe !== undefined) {
        const lit = Math.floor((frame * strobe.hz * 2) / 60) % 2 === 0;
        ctx.fillStyle = lit ? '#ffffff' : '#000000';
        ctx.fillRect(0, 0, w * strobe.share, h);
      }
      const data = ctx.getImageData(0, 0, cols * cell, rows * cell).data;
      const stride = cols * cell * 4;
      const per = cell * cell;
      let mean = 0;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          let sl = 0;
          let sr = 0;
          let sg = 0;
          let sb = 0;
          for (let y = 0; y < cell; y++) {
            let p = (cy * cell + y) * stride + cx * cell * 4;
            for (let x = 0; x < cell; x++, p += 4) {
              const r = lin[data[p]];
              const g = lin[data[p + 1]];
              const b = lin[data[p + 2]];
              sl += 0.2126 * r + 0.7152 * g + 0.0722 * b;
              sr += r;
              sg += g;
              sb += b;
            }
          }
          const i = cy * cols + cx;
          lum[i] = sl / per;
          const total = sr + sg + sb;
          red[i] = total > 0 && sr / total >= 0.8 ? (Math.max(0, sr - sg - sb) / per) * 320 : 0;
          mean += lum[i];
        }
      }
      if (first) {
        for (let i = 0; i < n; i++) {
          L.lo[i] = L.hi[i] = lum[i];
          R.lo[i] = R.hi[i] = red[i];
        }
        first = false;
      }
      const [up, down, rawUp, rawDown] = track(L, lum, 0.1, 0.8, gather);
      const [rup, rdown] = track(R, red, 20, Infinity, gather);
      out.push([up, down, rup, rdown, mean / n, rawUp, rawDown]);
      frame++;
    },
    take() {
      return out.splice(0);
    },
  };
}

/** Gather per-frame transition shares into general transitions, and the worst second of them. */
function judge(frames) {
  const events = [];
  const scan = (upAt, downAt, label) => {
    let lastUp = -99;
    let lastDown = -99;
    for (let f = 0; f < frames.length; f++) {
      const up = frames[f][upAt];
      const down = frames[f][downAt];
      if (up >= GENERAL_AREA && f - lastUp >= GATHER) {
        events.push({ f, dir: 1, label, area: up });
        lastUp = f;
      }
      if (down >= GENERAL_AREA && f - lastDown >= GATHER) {
        events.push({ f, dir: -1, label, area: down });
        lastDown = f;
      }
    }
  };
  scan(0, 1, 'general');
  scan(2, 3, 'red');
  let worst = 0;
  let worstAt = 0;
  for (const label of ['general', 'red']) {
    const mine = events.filter((e) => e.label === label).sort((a, b) => a.f - b.f);
    for (let i = 0; i < mine.length; i++) {
      let j = i;
      while (j < mine.length && mine[j].f - mine[i].f < HZ) j++;
      if (j - i > worst) {
        worst = j - i;
        worstAt = mine[i].f;
      }
    }
  }
  let peak = 0;
  for (const fr of frames) peak = Math.max(peak, fr[0], fr[1]);
  return { transitions: worst, flashes: Math.floor(worst / 2), at: (worstAt / HZ).toFixed(2), peakArea: peak, events: events.length };
}

async function run(browser, s, secs = seconds) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.clock.install({ time: 0 });
  await page.goto(`http://localhost:${port}/rig/bench.html?proof&${s.query}`);
  await page.waitForSelector('#stage canvas');
  if (s.level !== undefined) {
    // The boss's place: the last seven levels are the seven places' end bosses, in order.
    await page.evaluate((level) => {
      const pick = document.querySelector('#level');
      pick.selectedIndex = level;
      pick.dispatchEvent(new Event('change'));
      const along = document.querySelector('#along');
      along.value = along.max;
      along.dispatchEvent(new Event('input'));
    }, s.level);
    // The arrival: the boss has to fly in before its phases mean anything.
    await page.clock.runFor(9000);
    await page.evaluate((hp) => {
      const scrub = document.querySelector('#bosshp');
      scrub.value = String(hp);
      scrub.dispatchEvent(new Event('input'));
    }, s.bossHp);
  }
  // Let the field fill before anything is read.
  await page.clock.runFor(1500);
  await page.evaluate(installMeter, [CELL, GATHER]);
  const frames = [];
  for (let f = 0; f < secs * HZ; f++) {
    if (s.special !== undefined) await page.evaluate((kind) => window.__bench.throwSpecial(kind), s.special);
    await page.clock.runFor(FRAME_MS);
    await page.evaluate((strobe) => window.__meter.read(strobe), s.strobe);
    if (f % 60 === 59) frames.push(...(await page.evaluate(() => window.__meter.take())));
    // One photograph a scenario, so a reading can be checked against what was on the screen.
    if (shoot && s.strobe === undefined && f === Math.floor((secs * HZ) / 2)) {
      await page.locator('#stage').screenshot({ path: `shots/flash-${s.name.replace('@', '-')}.png` });
    }
  }
  frames.push(...(await page.evaluate(() => window.__meter.take())));
  await context.close();
  return { ...judge(frames), frames: frames.length, errors, series: frames };
}

const isOver = (r) => r.transitions > MOST_TRANSITIONS;

const browser = await launchChromium({ headless: true });

/*
  ⚠️ THE METER IS SEEN TO FAIL BEFORE IT JUDGES ANYTHING — 0005, 0019. Four strobes painted over the
  bench's own frame: six a second over the whole screen and over a seventh of it must be over the cap;
  two a second must not be, and must still be SEEN (four transitions); six a second over a twentieth of
  the screen must not be, because it is under the general area. A meter that passes all of these can
  count, can tell a rate and can tell an area. One that fails any of them has judged nothing.
*/
const CALIBRATION = [
  { strobe: { hz: 6, share: 1 }, over: true },
  { strobe: { hz: 6, share: 1 / 7 + 0.02 }, over: true },
  { strobe: { hz: 2, share: 1 }, over: false, seen: 4 },
  { strobe: { hz: 6, share: 1 / 20 }, over: false },
];
for (const c of CALIBRATION) {
  const r = await run(browser, { name: 'calibrate', query: 'weapon=pulse', strobe: c.strobe }, 3);
  const ok = isOver(r) === c.over && (c.seen === undefined || r.transitions >= c.seen);
  if (!ok) {
    console.error(`CALIBRATION FAILED: ${c.strobe.hz} Hz over ${(c.strobe.share * 100).toFixed(0)}% read ${r.transitions} transitions`);
    await browser.close();
    process.exit(2);
  }
}
console.log(`calibrated: ${CALIBRATION.length} strobes read as they were painted`);

const results = [];
let over = 0;
for (const s of SCENARIOS) {
  if (only.length > 0 && !only.some((o) => s.name.startsWith(o))) continue;
  const r = await run(browser, s);
  if (r.frames === 0) {
    console.error(`${s.name}: no frames read`);
    await browser.close();
    process.exit(2);
  }
  const verdict = isOver(r) ? 'OVER' : r.transitions >= 5 ? 'near' : 'ok';
  if (verdict === 'OVER') over++;
  console.log(
    `${s.name.padEnd(18)} ${verdict.padEnd(5)} worst second ${String(r.flashes).padStart(2)} flashes (${r.transitions} transitions) at ${r.at}s` +
      `   peak area ${(r.peakArea * 100).toFixed(1)}%   ${r.errors.length > 0 ? 'ERRORS: ' + r.errors[0] : ''}`,
  );
  results.push({ name: s.name, ...r });
}
await browser.close();
if (jsonOut !== '') writeFileSync(jsonOut, JSON.stringify(results, null, 2));
if (results.length === 0) {
  console.error('no scenario matched');
  process.exit(2);
}
process.exit(over > 0 ? 1 : 0);
