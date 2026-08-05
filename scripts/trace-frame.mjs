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
// Usage:  node scripts/trace-frame.mjs [--hold=acrossPlus] [--ms=1500] [--after=0] [--width=1280] [--height=720]

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
/** Milliseconds to keep recording AFTER the key is released — where the run-on lives. */
const after = Number(arg('after', '0'));
let releasedAt = null;

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
 * ── HOW THE SHIP IS FOUND, AND WHY IT IS NO LONGER THE FIRST BLIT ───────────────────────────────
 *
 * ⚠️ **This used to read `the SHIP is the first blit of each frame, because it lives in pool slot 0`,
 * and it said in its own comment what would happen if that stopped being true: "this script reports
 * the wrong entity and says nothing."** It stopped being true in the change that added enemies —
 * `src/app/frame.ts` now draws the ship LAST, so the player can find it in a crowd. The assumption
 * would have gone on passing, silently tracing a bullet, during the one tuning pass this instrument
 * exists for. `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
 *
 * What replaces it is an identification that is CHECKED. Each blit is tagged with which atlas bitmap
 * it drew, and the ship is found as the smallest set of bitmaps that contributes **exactly one blit
 * to every single frame** — which is a real property of the game rather than of the draw order: there
 * is one ship, it is never culled and never absent, and everything else spawns and dies. A set rather
 * than a single bitmap because the ship swaps between two of them while it is flashing after a hit.
 *
 * If no such set exists, or more than one minimal set does, the script says so and exits non-zero.
 * That is the difference that matters: the old version could not tell a right answer from a wrong
 * one, and this one refuses to guess.
 */
const HOOK = () => {
  const proto = CanvasRenderingContext2D.prototype;
  const realFill = proto.fillRect;
  const realDraw = proto.drawImage;
  const frames = [];
  /** Atlas bitmaps, in the order they were first drawn. Identity only — never inspected. */
  const bitmaps = [];
  let current = null;
  proto.fillRect = function (...args) {
    // A full-canvas fill anchored at the origin IS the clear. Anything else is ordinary drawing.
    if (args[0] === 0 && args[1] === 0) {
      if (current !== null && current.draws > 0) frames.push(current);
      current = { draws: 0, marks: [], t: performance.now() };
    }
    return realFill.apply(this, args);
  };
  proto.drawImage = function (...args) {
    if (current !== null) {
      current.draws++;
      // (image, dx, dy[, dw, dh]) or (image, sx, sy, sw, sh, dx, dy, dw, dh) — take the destination.
      const [dx, dy] = args.length >= 9 ? [args[5], args[6]] : [args[1], args[2]];
      let sprite = bitmaps.indexOf(args[0]);
      if (sprite < 0) sprite = bitmaps.push(args[0]) - 1;
      current.marks.push({ sprite, x: dx, y: dy });
    }
    return realDraw.apply(this, args);
  };
  Object.defineProperty(window, '__ITC_TRACE__', { value: frames });
};

/**
 * The smallest set of sprites that puts exactly one blit in every frame, or a reason there is none.
 *
 * Subsets rather than a single sprite because a ship flashing after a hit alternates between two
 * bitmaps of the same silhouette, and either alone is absent from half the frames.
 */
function findTheShip(frames) {
  const sprites = new Set();
  for (const f of frames) for (const m of f.marks) sprites.add(m.sprite);
  const all = [...sprites].sort((a, b) => a - b);
  if (all.length === 0) return { error: 'no sprite was drawn in any frame' };

  const oneEveryFrame = (set) =>
    frames.every((f) => f.marks.reduce((n, m) => n + (set.has(m.sprite) ? 1 : 0), 0) === 1);

  // Smallest first, so a lone sprite wins over the pair it belongs to and the answer is the tightest
  // one available rather than the first one stumbled on.
  for (let size = 1; size <= all.length; size++) {
    const found = [];
    for (let mask = 1; mask < 1 << all.length; mask++) {
      const bits = all.filter((_, i) => (mask >> i) & 1);
      if (bits.length !== size) continue;
      if (oneEveryFrame(new Set(bits))) found.push(bits);
    }
    if (found.length === 1) return { set: new Set(found[0]) };
    if (found.length > 1) {
      return {
        error:
          `${found.length} different sprite sets are drawn exactly once per frame ` +
          `(${found.map((f) => `{${f.join(',')}}`).join(' ')}), so the ship cannot be told apart from ` +
          'something else that happens to be alone on screen. Trace a busier scene, or a longer one.',
      };
    }
  }
  return {
    error:
      'no sprite is drawn exactly once in every frame, so there is nothing here with the ship\'s ' +
      'shape. Either the ship was not drawn, or it is being drawn more than once.',
  };
}

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
  /*
    ⚠️ KEEP RECORDING AFTER THE KEY COMES UP, when asked to.

    Recording stopped at key-up, which was fine while velocity was the ask: the ship stopped on the
    same step and there was nothing after it to see. Since the ship gained mass
    (`docs/decisions/0037-the-ship-has-mass.md`) the most interesting thing this script can measure
    happens entirely after the release — the run-on is half of what inertia IS, and it was invisible
    to the one instrument built to see the picture.
  */
  if (after > 0) {
    releasedAt = await page.evaluate(() => performance.now());
    await page.waitForTimeout(after);
  }

  const frames = await page.evaluate(() => window.__ITC_TRACE__.map((f) => ({ ...f })));
  if (frames.length === 0) {
    failure = 'no frames were recorded — the page drew nothing at all, so there is no picture to measure';
  } else {
    const blitted = frames.filter((f) => f.marks.length > 0);
    const ship = blitted.length === 0 ? { error: null } : findTheShip(blitted);
    if (blitted.length === 0) {
      failure = 'frames were cleared but nothing was blitted — the painter ran and drew no entities';
    } else if (ship.error) {
      // ⚠️ Refusing to guess IS the fix. The previous version took the first blit of each frame and
      // could not tell the ship from anything else drawn before it.
      failure = `the ship could not be identified: ${ship.error}`;
    } else {
      const drawn = blitted.map((f) => {
        const mark = f.marks.find((m) => ship.set.has(m.sprite));
        return { t: f.t, draws: f.draws, shipX: mark.x, shipY: mark.y };
      });
      const t0 = drawn[0].t;
      const seconds = (drawn[drawn.length - 1].t - t0) / 1000;
      /*
        A JUMP IS NOT MOTION, and telling them apart is the second thing this script has had to learn
        about its own averages.

        The ship can now die, and a restart puts it back at the middle of the lane in one frame —
        316.8px on a 720-tall viewport, against a real top speed of 12.3px per frame. Folded into the
        totals it inflated `px/s` by half and became the `peak`, which is precisely the figure a
        tuning pass reads. The threshold is a fraction of the viewport rather than a multiple of any
        speed, because a speed is what is being measured and a guard defined in terms of its own
        subject proves nothing — the same argument
        `docs/decisions/0027-measure-the-picture-not-the-model.md` makes about assertions.

        ⚠️ They are COUNTED and REPORTED, never silently dropped. A run with jumps in it is a run
        where the player died, and that is information about the picture.
      */
      const TELEPORT_PX = Math.min(width, height) / 8;
      let travelX = 0;
      let travelY = 0;
      let teleports = 0;
      for (let i = 1; i < drawn.length; i++) {
        const dx = drawn[i].shipX - drawn[i - 1].shipX;
        const dy = drawn[i].shipY - drawn[i - 1].shipY;
        if (Math.hypot(dx, dy) > TELEPORT_PX) {
          teleports++;
          continue;
        }
        travelX += Math.abs(dx);
        travelY += Math.abs(dy);
      }
      const netX = drawn[drawn.length - 1].shipX - drawn[0].shipX;
      const netY = drawn[drawn.length - 1].shipY - drawn[0].shipY;
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
          f.shipX.toFixed(1).padStart(7),
          f.shipY.toFixed(1).padStart(7),
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
        const d = Math.hypot(drawn[i].shipX - drawn[i - 1].shipX, drawn[i].shipY - drawn[i - 1].shipY);
        if (d > TELEPORT_PX) continue;
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
      if (releasedAt !== null) {
        /*
          THE RUN-ON: everything the ship did after the key came up.

          This is half of what mass IS, and until `--after` existed the recording stopped on the
          release, so the instrument could not see it at all. Reported in pixels and milliseconds,
          which is what a hand is judging.
        */
        let runOn = 0;
        let runOnMs = 0;
        let last = null;
        for (const f of drawn) {
          if (f.t < releasedAt) {
            last = f;
            continue;
          }
          if (last !== null) {
            const d = Math.hypot(f.shipX - last.shipX, f.shipY - last.shipY);
            if (d <= TELEPORT_PX && d > 0.05) {
              runOn += d;
              runOnMs = f.t - releasedAt;
            }
          }
          last = f;
        }
        console.log(`  after release   ${runOn.toFixed(1)}px over ${runOnMs.toFixed(0)}ms`);
      }
      console.log(`  peak blits/frame ${maxDraws}`);
      console.log(
        `  jumps            ${teleports}` +
          (teleports > 0 ? `  (over ${TELEPORT_PX.toFixed(0)}px in a frame — the ship died and restarted)` : ''),
      );
      console.log('');

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
