// Every hostile bullet and every enemy hull of one place, on ONE canvas, at true relative size, on
// that place's own sky.
//
// Usage:  npm run sheet                              (in another shell — this needs the dev server)
//         node scripts/threat-sheet.mjs
//         node scripts/threat-sheet.mjs --theme=rime --scale=3
//         node scripts/threat-sheet.mjs --all        one PNG per place
//
// ⚠️ IT EXISTS BECAUSE `CLAUDE.md` ASKS A QUESTION NOTHING COULD ANSWER — *consider what else will
// share the same screen space*, and *consider how much space the player has to react in*
// (docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md). Those are deliberately not guards:
// they are raised per case and argued, which only works if there is a picture to argue against.
// This is the picture. `scripts/weigh-sizes.mjs` is the same question in numbers.
//
// ⚠️ AND THE REPORT IT WAS BUILT FROM WAS ABOUT A CATEGORY, NOT A SPRITE — *"some enemy ships that
// look just look bullets so in some cases you can't tell what's what."* No per-sprite view can show
// that. What shows it is the two categories side by side, at the sizes and colours they are actually
// drawn, on the ground they are actually drawn on, which is what this lays out.
//
// ⚠️ IT SHOOTS THE SHEET rather than baking its own copy of the art —
// docs/decisions/0193-the-sheet-is-the-instrument.md and 0116: an instrument that bakes its own art
// has a verdict taken from a picture the game never draws. `rig/sheet.html` calls `bakeAtlas` exactly
// as `src/app/mount.ts` does, per place; this only points a camera at it and lays the cards out.
//
// Output: shots/threats-<theme>.png, gitignored working material on /shots/'s own terms.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launchChromium } from './chromium.mjs';
import { THEME_KINDS, THEMES } from '../src/content/themes.ts';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const out = resolve(arg('out', 'shots'));
const port = arg('port', '5173');
const scale = Number(arg('scale', '3'));
const palette = arg('palette', 'vivid');
const themes = process.argv.includes('--all') ? [...THEME_KINDS] : [arg('theme', 'approach')];

/*
  ⚠️ **THE ROWS ARE THE CATEGORIES THE PLAYER HAS TO TELL APART, NOT A TIDY LIST OF KINDS.** What a
  raider shoots is separated from what a boss shoots because only the first takes the place's colour
  (0296), and the player's own fire is on the sheet because *which of these is mine* is the other
  half of the same question.
*/
const ROWS = [
  { title: 'WHAT A RAIDER SHOOTS  — these take the place’s colour (0296)', kinds: ['lance', 'spit', 'flak', 'quill'] },
  { title: 'WHAT A BOSS SHOOTS  — their inks are what they ARE, and do not move', kinds: ['flame', 'void', 'acid', 'frost', 'rock'] },
  { title: 'THE HULLS  — same scale, same ground', kinds: ['weaver', 'drifter', 'charger', 'kite', 'lancer'] },
  { title: 'WHAT THE PLAYER FIRES', kinds: ['bullet', 'arcNode', 'shuriken', 'missile', 'seeker', 'bomb'] },
];

if (!existsSync(out)) mkdirSync(out, { recursive: true });

const browser = await launchChromium({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 200)));

let failure = null;
try {
  await page.goto(`http://localhost:${port}/rig/sheet.html`, { waitUntil: 'load' });
  await page.waitForSelector('#sheet .card');
  for (const theme of themes) {
    await page.selectOption('#palette', palette);
    await page.selectOption('#theme', theme);
    await page.selectOption('#viewport', '1');
    await page.selectOption('#zoom', '1');
    await page.waitForSelector('#sheet .card');
    const ground = THEMES[theme].space[palette];
    const b64 = await page.evaluate(
      ({ rows, S, theme, ground, palette }) => {
        const by = {};
        for (const cv of document.querySelectorAll('#sheet canvas')) by[cv.title] = cv;
        const PAD = 12 * S;
        const LAB = 24;
        const W = Math.max(...rows.map((r) => r.kinds.reduce((s, k) => s + (by[k]?.width ?? 0) * S + PAD, PAD)));
        const rowHs = rows.map((r) => Math.max(...r.kinds.map((k) => (by[k]?.height ?? 0) * S)));
        const H = rowHs.reduce((a, b) => a + b + PAD + LAB * 2, 40);
        const cv = document.createElement('canvas');
        cv.width = W;
        cv.height = H;
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.fillStyle = ground;
        g.fillRect(0, 0, W, H);
        g.textBaseline = 'top';
        g.font = '13px monospace';
        g.fillStyle = 'rgba(255,255,255,0.45)';
        g.fillText(`${theme} · ${palette} · ${S}x · sizes as drawn on a 1280x720 screen`, PAD, 8);
        let y = 30;
        for (let i = 0; i < rows.length; i++) {
          g.font = 'bold 16px monospace';
          g.fillStyle = 'rgba(255,255,255,0.86)';
          g.fillText(rows[i].title, PAD, y);
          y += LAB;
          let x = PAD;
          for (const k of rows[i].kinds) {
            const src = by[k];
            if (!src) continue;
            g.drawImage(src, 0, 0, src.width, src.height, x, y + (rowHs[i] - src.height * S) / 2, src.width * S, src.height * S);
            g.font = '13px monospace';
            g.fillStyle = 'rgba(255,255,255,0.5)';
            g.fillText(`${k}  ${src.width}px`, x, y + rowHs[i] + 5);
            x += src.width * S + PAD;
          }
          y += rowHs[i] + PAD + LAB;
        }
        return cv.toDataURL('image/png').slice(22);
      },
      { rows: ROWS, S: scale, theme, ground, palette },
    );
    const file = `${out}/threats-${theme}.png`;
    writeFileSync(file, Buffer.from(b64, 'base64'));
    console.log(`wrote ${file}`);
  }
} catch (e) {
  failure = e;
} finally {
  await browser.close();
}
if (failure !== null) {
  console.error(String(failure).slice(0, 400));
  process.exit(1);
}
