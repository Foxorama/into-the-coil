// THE launcher icon: the Into the Coil badge, as the business card draws it.
//
//   node scripts/icon.mjs        # rewrites public/icon-*.png
//
// The art is the hoodie v12 painting — the volcano split open over the black heart, the ship flying
// clear of the eruption — clipped to a circle with a violet ring on a dark-violet halo. That badge is
// already the game's face on the studio's business card, and the ask was that installing the game
// shows the same face (2026-09-30).
//
// `scripts/icon-art.webp` IS the source, and it is a crop, not the master. The master is a 3000px
// transparent PNG outside this repository (C:\itc-renders\art\merch\hoodie-v12.png); the crop keeps
// the square around the badge wide enough for the maskable variant's full bleed and nothing more, so
// the title lettering and the studio line above and below the art never reach a launcher. Recut:
//
//   ffmpeg -i hoodie-v12.png -vf "crop=2000:2000:500:656,scale=1024:1024:flags=lanczos" \
//          -c:v libwebp -quality 92 -pix_fmt yuva420p scripts/icon-art.webp
//
// In that crop the badge's circle is centred and its radius is 0.4 of the side — the card's framing
// (its `badge()` places the 1500px art at centre 750,828 radius 400, which is 1500,1656 radius 800 on
// the master). Every variant below is that one circle at a different radius on its square.
//
// ⚠️ THE PREVIOUS ICON was a generated spiral with an ember, on the argument that at 48px only
// geometry survives: three passes at flying the firebird into the coil collapsed into a chevron at
// 13 pixels across. The badge is not a creature to be told apart from its parts — it is one bright
// vertical plume on a dark disc, and that is what 48px keeps.
//
// Rendered through `scripts/chromium.mjs`, the same lookup the browser tests use.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { launchChromium } from './chromium.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const S = 512; // the coordinate space; every output is this art at a different raster size
const C = S / 2;
const ART = `data:image/webp;base64,${readFileSync(resolve(root, 'scripts/icon-art.webp')).toString('base64')}`;

/** The card's badge palette — `vulpecula-business-cards/src/foil.html`, `C.violet` and the halo. */
const RING = '#b07dff';
const HALO = '#2a1540';

/** The art, placed so the badge's circle has radius `r` about the centre. The crop is 2.5 r wide. */
const art = (r) =>
  `<image href="${ART}" x="${C - 1.25 * r}" y="${C - 1.25 * r}" width="${2.5 * r}" height="${2.5 * r}"/>`;

/**
 * The badge, as the card draws it: the halo a tenth wider than the circle (the card's 8.2 + 0.8),
 * the art clipped inside, and the ring on the circle's edge. Outside the halo is transparent, so a
 * desktop launcher shows a round icon rather than a round icon on a square.
 */
const badge = () => {
  const r = (0.49 * S) / 1.0976;
  return `
    <defs><clipPath id="disc"><circle cx="${C}" cy="${C}" r="${r}"/></clipPath></defs>
    <circle cx="${C}" cy="${C}" r="${r * 1.0976}" fill="${HALO}"/>
    <g clip-path="url(#disc)">${art(r)}</g>
    <circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${RING}" stroke-width="${r * 0.0427}" opacity="0.8"/>`;
};

/**
 * Full bleed, for a surface that cuts its own shape. The painting runs to the edges over the halo
 * colour, which is what shows where the master is transparent.
 *
 * Maskable: Android crops to whatever shape the launcher likes and only the central 80% is
 * guaranteed, so the badge's circle sits exactly on that 0.4 safe circle — the launcher's mask
 * becomes the badge's edge, and the ring is left off because a ring the crop may cut through reads
 * as a mistake. iOS: its mask is a modest rounded square, so the circle is the whole square and the
 * corners carry the painting beyond it.
 */
const bleed = (r) => `<rect width="${S}" height="${S}" fill="${HALO}"/>${art(r)}`;

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${body}</svg>`;

/** file, raster size, body. The manifest and `tests/shell.test.ts` both name these. */
const OUTPUTS = [
  ['public/icon-192.png', 192, badge()],
  ['public/icon-512.png', 512, badge()],
  ['public/icon-maskable-512.png', 512, bleed(0.4 * S)],
  // iOS ignores the web manifest entirely and reads <link rel="apple-touch-icon">, and fills any
  // transparency with black — so it gets the full bleed, never the transparent-cornered badge.
  ['public/icon-180.png', 180, bleed(0.5 * S)],
];

const browser = await launchChromium({ headless: true });
try {
  for (const [file, size, body] of OUTPUTS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg(body)}`,
    );
    await page.screenshot({ path: resolve(root, file), omitBackground: true });
    await page.close();
    console.log(`wrote ${file} (${size}px)`);
  }
  // Deliberately no SVG beside them in `public/`. This file and its crop ARE the source; a second
  // copy would ship to every device for no runtime purpose.
} finally {
  await browser.close();
}
