// The frame tracer — what the player actually SEES move, in pixels, in a real browser.
//
// docs/decisions/0027-measure-the-picture-not-the-model.md owes this, and owes it BEFORE the first
// tuning pass on anything the player watches move rather than after the seventh "it doesn't feel
// right". The predecessor spent eight passes and five weeks improving a bounce model that was
// already correct while the ball's total screen travel was 2.6 pixels — every rig it had measured
// the PLAN, in the sim's own units, and the plan was right the whole time.
//
// ⚠️ THIS TRACES THE SHIPPED PAGE. Not a fixture, not a re-implementation, not a preview rig with a
// hand-set camera — `dist/index.html`, the file the build emits, at whatever camera the game itself
// computed for the viewport given. A rig honest about the model and wrong about the picture is worse
// than no rig, because it manufactures confidence.
//
// ⚠️ IT FAILS LOUD. A tool whose only job is to produce an artefact for a human must exit non-zero
// when it produces nothing. The predecessor had ~64 rigs that printed "no chromium" and exited 0,
// and on the author's machine every one of them silently rendered nothing for months while
// reporting success.
//
// Usage:  node scripts/trace-frame.mjs [--hold=acrossPlus] [--ms=1500] [--width=1280] [--height=720]

import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { launchChromium } from './chromium.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = resolve(root, 'dist/index.html');

/** What a key name means to the page. Mirrors src/content/actions.ts rather than re-deciding it. */
const HOLD_KEYS = {
  none: null,
  alongPlus: 'ArrowRight',
  alongMinus: 'ArrowLeft',
  acrossMinus: 'ArrowUp',
  acrossPlus: 'ArrowDown',
};

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
}

const hold = arg('hold', 'acrossPlus');
const ms = Number(arg('ms', '1500'));
const width = Number(arg('width', '1280'));
const height = Number(arg('height', '720'));

if (!(hold in HOLD_KEYS)) {
  console.error(`--hold must be one of: ${Object.keys(HOLD_KEYS).join(', ')}`);
  process.exit(2);
}
if (!existsSync(dist)) {
  console.error(`No dist/index.html. Run \`npx vite build\` first — this traces the SHIPPED page.`);
  process.exit(2);
}

/**
 * Hook every blit, and stamp each with the frame it belongs to.
 *
 * The clear is what separates one frame from the next: `src/render/scene.ts` clears once and then
 * blits once per live entity, which is the contract `tests/budget.test.ts` counts. So the clear
 * opens a frame and every `drawImage` after it belongs to that frame.
 *
 * ⚠️ `CanvasSurface.clear()` is a full-canvas `fillRect`, not a `clearRect` — the background is a
 * flat colour rather than transparency. Watching the wrong one of those two recorded zero frames and
 * the script said so and exited 1, which is the entire reason it is built to fail loud.
 *
 * The atlas bake also fills rectangles, on its own offscreen context and the same prototype. Those
 * land before any entity is blitted, so they open frames with zero draws and are dropped.
 *
 * The SHIP is the first blit of each frame, because it lives in pool slot 0 and the painter walks
 * the pool in order. That is an assumption about draw order rather than an identity check, and it is
 * stated here rather than hidden: if the ship ever stops being drawn first, this script reports the
 * wrong entity and says nothing. It is the cheapest hook that needs no production code to know it
 * is being watched.
 */
const HOOK = () => {
  const proto = CanvasRenderingContext2D.prototype;
  const realFill = proto.fillRect;
  const realDraw = proto.drawImage;
  const frames = [];
  let current = null;
  proto.fillRect = function (...args) {
    // A full-canvas fill anchored at the origin IS the clear. Anything else is ordinary drawing.
    if (args[0] === 0 && args[1] === 0) {
      if (current !== null && current.draws > 0) frames.push(current);
      current = { draws: 0, firstX: null, firstY: null, t: performance.now() };
    }
    return realFill.apply(this, args);
  };
  proto.drawImage = function (...args) {
    if (current !== null) {
      current.draws++;
      if (current.firstX === null) {
        // (image, dx, dy) or (image, sx, sy, sw, sh, dx, dy, dw, dh) — take the destination.
        const [dx, dy] = args.length >= 9 ? [args[5], args[6]] : [args[1], args[2]];
        current.firstX = dx;
        current.firstY = dy;
      }
    }
    return realDraw.apply(this, args);
  };
  Object.defineProperty(window, '__ITC_TRACE__', { value: frames });
};

const browser = await launchChromium({ headless: true });
let failure = null;
try {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(HOOK);
  await page.goto(pathToFileURL(dist).href);
  await page.waitForSelector('#app canvas', { state: 'attached', timeout: 15_000 });

  const key = HOLD_KEYS[hold];
  await page.waitForTimeout(300);
  if (key !== null) await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  if (key !== null) await page.keyboard.up(key);

  const frames = await page.evaluate(() => window.__ITC_TRACE__.map((f) => ({ ...f })));
  if (frames.length === 0) {
    failure = 'no frames were recorded — the page drew nothing at all, so there is no picture to measure';
  } else {
    const drawn = frames.filter((f) => f.firstX !== null);
    if (drawn.length === 0) {
      failure = 'frames were cleared but nothing was blitted — the painter ran and drew no entities';
    } else {
      const t0 = drawn[0].t;
      const seconds = (drawn[drawn.length - 1].t - t0) / 1000;
      let travelX = 0;
      let travelY = 0;
      for (let i = 1; i < drawn.length; i++) {
        travelX += Math.abs(drawn[i].firstX - drawn[i - 1].firstX);
        travelY += Math.abs(drawn[i].firstY - drawn[i - 1].firstY);
      }
      const netX = drawn[drawn.length - 1].firstX - drawn[0].firstX;
      const netY = drawn[drawn.length - 1].firstY - drawn[0].firstY;
      const maxDraws = Math.max(...drawn.map((f) => f.draws));

      console.log(`\n  ${width}×${height}, holding ${hold} for ${ms}ms — ${drawn.length} drawn frames over ${seconds.toFixed(2)}s\n`);
      console.log('  | frame |     t |  ship x |  ship y | draws |');
      console.log('  |------:|------:|--------:|--------:|------:|');
      const stride = Math.max(1, Math.floor(drawn.length / 12));
      for (let i = 0; i < drawn.length; i += stride) {
        const f = drawn[i];
        const cells = [
          String(i).padStart(5),
          (f.t - t0).toFixed(0).padStart(5),
          f.firstX.toFixed(1).padStart(7),
          f.firstY.toFixed(1).padStart(7),
          String(f.draws).padStart(5),
        ];
        console.log(`  | ${cells.join(' | ')} |`);
      }

      // THE NUMBERS THAT EXPLAIN THE CLASS OF REPORT. Everything above is detail; a "it doesn't feel
      // right" is almost always one of these being smaller than anyone assumed.
      /*
        ⚠️ The rate is measured over the frames the ship was ACTUALLY MOVING, not over the window.
        The first version divided total travel by total elapsed and reported 211px/s for a ship
        moving at 678 — because it had spent two thirds of the run held against the wall, and the
        average silently folded the clamp in. A number that reads as a speed and is really an
        average-including-stopped is the kind of figure that gets quoted in a commit message and
        then defended.
      */
      let movingFrames = 0;
      let movingSeconds = 0;
      let peakPerFrame = 0;
      for (let i = 1; i < drawn.length; i++) {
        const d = Math.hypot(drawn[i].firstX - drawn[i - 1].firstX, drawn[i].firstY - drawn[i - 1].firstY);
        if (d > 0.5) {
          movingFrames++;
          movingSeconds += (drawn[i].t - drawn[i - 1].t) / 1000;
          if (d > peakPerFrame) peakPerFrame = d;
        }
      }
      const travel = Math.hypot(travelX, travelY);

      console.log(`\n  screen travel    x ${travelX.toFixed(1)}px   y ${travelY.toFixed(1)}px`);
      console.log(`  net displacement x ${netX.toFixed(1)}px   y ${netY.toFixed(1)}px`);
      console.log(
        `  while moving     ${movingFrames} frames, ${movingSeconds.toFixed(2)}s, ` +
          `${movingSeconds > 0 ? (travel / movingSeconds).toFixed(0) : '—'} px/s`,
      );
      console.log(`  peak            ${peakPerFrame.toFixed(1)} px/frame`);
      console.log(`  peak blits/frame ${maxDraws}\n`);

      if (key !== null && Math.abs(netX) < 1 && Math.abs(netY) < 1) {
        failure =
          `holding ${hold} for ${ms}ms moved the ship less than one pixel on screen.\n` +
          '  That is the predecessor\'s bounce bug exactly: the model may be perfect and the picture is not moving.';
      }
    }
  }
} finally {
  await browser.close();
}

if (failure !== null) {
  console.error(`\nTRACE FAILED: ${failure}\n`);
  process.exit(1);
}
