// THE launcher icon, generated rather than drawn.
//
//   node scripts/icon.mjs        # rewrites public/icon-*.png
//
// The art is code because the icon is geometry — a logarithmic spiral and one bright ember — and
// geometry survives being re-rendered at a size nobody anticipated. A committed PNG with no source
// is a file you can never adjust, only replace.
//
// Rendered through `scripts/chromium.mjs`, the same lookup the browser tests use. That makes this
// the SECOND caller of that lookup; it had exactly one when the scaffold plan deferred the
// one-description register on the grounds that banning re-derivation of a fact nobody re-derives is
// a guard wearing a costume. That condition no longer holds.
//
// ⚠️ WHAT THIS ICON IS NOT. It is not the firebird. Three passes went into trying to fly one into
// the coil, and the honest measurement is that at 48px — the size a launcher actually draws — the
// whole creature is about 13 pixels across. A bird reads as a bird because wings, body and tail can
// be told apart, and there is no room to tell three things apart in 13 pixels; every attempt
// collapsed into a chevron, and a chevron with a point on it is a mouse cursor. So the launcher gets
// the shape that survives being small, and the firebird gets drawn where it has room to be one.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { launchChromium } from './chromium.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const S = 512; // the coordinate space; every output is this art at a different raster size
const C = S / 2;

// ─── the spiral ────────────────────────────────────────────────────────────────
// Logarithmic, because that is the shape a galaxy actually is: the arm's angle to the radius stays
// constant, so it reads as a spiral at every zoom rather than unwinding into a circle.
const SPIRAL = { a: 22, b: 0.32, t0: 0.8, t1: 7.0 };

const pt = (t, phase) => {
  const r = SPIRAL.a * Math.exp(SPIRAL.b * t);
  return [C + r * Math.cos(t + phase), C + r * Math.sin(t + phase)];
};
const tangentAt = (t, phase) => {
  const r = SPIRAL.a * Math.exp(SPIRAL.b * t);
  const dx = r * (SPIRAL.b * Math.cos(t + phase) - Math.sin(t + phase));
  const dy = r * (SPIRAL.b * Math.sin(t + phase) + Math.cos(t + phase));
  const m = Math.hypot(dx, dy);
  return [dx / m, dy / m];
};

/**
 * One arm, as a closed polygon.
 *
 * Drawn as a filled outline rather than a stroked path because SVG strokes cannot taper, and an
 * untapered arm reads as a tube. The taper runs on a curve so the arm holds its weight through the
 * bright inner turn and then thins quickly — a linear taper reads as a wedge.
 *
 * ⚠️ BOTH ENDS TAPER, and the inner one is the one that matters. An arm that simply begins at full
 * width leaves a flat cut across its start — and because the arm is wider than its own starting
 * radius, the two inner ends met over the nucleus and drew a hard-edged pinwheel through the middle
 * of the icon. It read as a rendering artefact, which is worse than reading as nothing. Ramping the
 * width up over the first fraction of the arm brings it out of the core to a point instead.
 */
function armPath({ t0, t1, phase, wIn, wOut, steps = 160 }) {
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const t = t0 + (t1 - t0) * u;
    const [x, y] = pt(t, phase);
    const [tx, ty] = tangentAt(t, phase);
    const w = ((wOut + (wIn - wOut) * Math.pow(1 - u, 1.5)) * Math.min(1, u / 0.12)) / 2;
    left.push([x - ty * w, y + tx * w]);
    right.push([x + ty * w, y - tx * w]);
  }
  return (
    [...left, ...right.reverse()].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') +
    'Z'
  );
}

const HOT_PHASE = 0.55;
const EMBER_T = 4.4;

const defs = `
  <radialGradient id="cool" cx="50%" cy="50%" r="52%">
    <stop offset="0%"   stop-color="#9db0ee" stop-opacity="1"/>
    <stop offset="35%"  stop-color="#6a7dc2" stop-opacity="0.95"/>
    <stop offset="72%"  stop-color="#3c4878" stop-opacity="0.72"/>
    <stop offset="100%" stop-color="#2a3050" stop-opacity="0.12"/>
  </radialGradient>
  <radialGradient id="hot" cx="50%" cy="50%" r="52%">
    <stop offset="0%"   stop-color="#ffe7a8" stop-opacity="1"/>
    <stop offset="30%"  stop-color="#ffa62e" stop-opacity="1"/>
    <stop offset="70%"  stop-color="#ff5c2f" stop-opacity="0.88"/>
    <stop offset="100%" stop-color="#d8351f" stop-opacity="0.12"/>
  </radialGradient>
  <radialGradient id="core" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#fffdf7" stop-opacity="1"/>
    <stop offset="34%"  stop-color="#ffdd85" stop-opacity="0.8"/>
    <stop offset="66%"  stop-color="#ff9433" stop-opacity="0.26"/>
    <stop offset="100%" stop-color="#ff6a2a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="ember" cx="42%" cy="40%" r="62%">
    <stop offset="0%"   stop-color="#ffffff" stop-opacity="1"/>
    <stop offset="30%"  stop-color="#fff3cf" stop-opacity="1"/>
    <stop offset="62%"  stop-color="#ffb43c" stop-opacity="1"/>
    <stop offset="100%" stop-color="#ff7a28" stop-opacity="0.9"/>
  </radialGradient>`;

function art() {
  const cool = [0, Math.PI]
    .map((phase) => `<path d="${armPath({ ...SPIRAL, phase, wIn: 46, wOut: 15 })}" fill="url(#cool)"/>`)
    .join('');
  const hot = armPath({ t0: EMBER_T, t1: SPIRAL.t1 + 0.2, phase: HOT_PHASE, wIn: 41, wOut: 10 });
  const [ex, ey] = pt(EMBER_T, HOT_PHASE);
  return `
    ${cool}
    <path d="${hot}" fill="url(#hot)"/>
    <circle cx="${C}" cy="${C}" r="58" fill="url(#core)"/>
    <!-- The ember sits on a dark bite so it stays a distinct object rather than the bright end of
         the arm. At 48px this is two pixels of separation, and it is what keeps the icon from
         reading as one orange smear. -->
    <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="42" fill="#1b1b1f" opacity="0.55"/>
    <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="28" fill="url(#ember)"/>`;
}

/**
 * `scale` is what separates a maskable icon from an ordinary one.
 *
 * Android crops an adaptive icon to whatever shape the launcher likes — circle, squircle, teardrop —
 * and only the central 80% is guaranteed to survive. So the maskable variant is the same art pulled
 * in until it fits that circle, on a background that runs to the edge. Shipping one icon for both
 * purposes means either wasting space on every other surface or having the crop eat the art.
 */
const svg = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
     <defs>${defs}</defs>
     <rect width="${S}" height="${S}" fill="#1b1b1f"/>
     <g transform="translate(${C} ${C}) scale(${scale}) translate(${-C} ${-C})">${art()}</g>
   </svg>`;

/** file, raster size, art scale. The manifest and `tests/shell.test.ts` both name these. */
const OUTPUTS = [
  ['public/icon-192.png', 192, 1],
  ['public/icon-512.png', 512, 1],
  ['public/icon-maskable-512.png', 512, 0.72],
  // iOS ignores the web manifest entirely and reads <link rel="apple-touch-icon">. Its own mask is
  // a modest rounded rect rather than a circle, so the full-bleed art is the right one to give it.
  ['public/icon-180.png', 180, 1],
];

const browser = await launchChromium({ headless: true });
try {
  for (const [file, size, scale] of OUTPUTS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:#1b1b1f}svg{display:block;width:${size}px;height:${size}px}</style>${svg(scale)}`,
    );
    await page.screenshot({ path: resolve(root, file) });
    await page.close();
    console.log(`wrote ${file} (${size}px, art at ${scale}×)`);
  }
  // Deliberately no SVG beside them. This file IS the source; a second copy in `public/` would ship
  // to every device for no runtime purpose and become a third place the art is written.
} finally {
  await browser.close();
}
