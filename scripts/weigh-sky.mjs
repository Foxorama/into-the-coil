// What the sky costs the game's legibility, counting everything it draws.
//
// ⚠️ THE INSTRUMENT FOR *"a plain black background is a plain boring game"*. Asked for: *"we can also
// highlight and brighten important objects while also filling the background with detail."* Those are
// two halves of one trade — detail costs contrast, and the only way to buy it back is to make the
// things that matter louder — and neither half is worth guessing at.
//
// ⚠️ AND `cloudCover` ONLY EVER COUNTED CLOUDS. 0220 and 0221 both recorded that structure and ground
// go uncounted and neither closed it, because neither needed the headroom. This one does.
//
//   node scripts/weigh-sky.mjs

import { PALETTES, DECOR_INKS } from '../src/content/palette.ts';
import { THEMES, THEME_KINDS } from '../src/content/themes.ts';
import { SPRITE_EXTENT } from '../src/content/sprites.ts';
import { bakeSize, cloudCover, skyCover } from '../src/render/bake.ts';
import { contrast, GAMEPLAY_FLOOR, AA_FLOOR } from '../tests/contrast.ts';

const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);

/** `top` laid over `base` at `alpha`, which is what a canvas does. */
function over(base, top, alpha) {
  const read = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [a, b] = [read(base), read(top)];
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * alpha).toString(16).padStart(2, '0')).join('')}`;
}

const counted = Object.keys(PALETTES.vivid).filter(
  (ink) => ink !== 'space' && ink !== 'sky' && !DECOR_INKS.includes(ink),
);

console.log(`floor ${GAMEPLAY_FLOOR}  ·  AA ${AA_FLOOR}  ·  inks counted: ${counted.join(', ')}\n`);
console.log('place        palette          clouds   all-gas   backdrop   worst ink        ratio   room');
console.log('─'.repeat(96));

const rows = [];
for (const theme of THEME_KINDS) {
  const clouds = cloudCover(size, theme);
  const all = skyCover(size, theme);
  for (const name of Object.keys(PALETTES)) {
    const backdrop = over(THEMES[theme].space[name], THEMES[theme].nebula[name], all);
    let worst = { ink: '', ratio: Infinity };
    for (const ink of counted) {
      const ratio = contrast(PALETTES[name][ink], backdrop);
      if (ratio < worst.ratio) worst = { ink, ratio };
    }
    const room = worst.ratio / GAMEPLAY_FLOOR;
    rows.push({ theme, name, clouds, all, worst, room });
    console.log(
      `${theme.padEnd(12)} ${name.padEnd(16)} ${clouds.toFixed(3)}    ${all.toFixed(3)}     ` +
        `${backdrop}    ${worst.ink.padEnd(14)} ${worst.ratio.toFixed(2)}   ${room.toFixed(2)}×`,
    );
  }
}

const tightest = rows.reduce((a, b) => (a.worst.ratio < b.worst.ratio ? a : b));
console.log(
  `\nTIGHTEST: ${tightest.theme}/${tightest.name} — ${tightest.worst.ink} at ` +
    `${tightest.worst.ratio.toFixed(2)}:1, which is ${tightest.room.toFixed(2)}× the floor.`,
);

/*
  ⚠️ AND HOW MUCH OF THE SKY IS ACTUALLY THAT BRIGHT, WHICH IS THE QUESTION A WORST-POINT CANNOT
  ANSWER. 0196 chose a worst POINT for clouds and said why: a cloud is forty units across, so its peak
  is a region. A lit structure mark is a few pixels wide, and four of them crossing composite to 0.94
  over an area the size of a full stop. **A bound satisfied only by a coincidence is a guard that gets
  switched off** — 0196's own words about the alternative it refused.
*/
/*
  ⚠️ WHAT BRIGHTENING THE FOREGROUND BUYS, WHICH IS THE OTHER HALF OF THE ASK. *"We can also highlight
  and brighten important objects while also filling the background with detail."* Those are one trade:
  detail costs contrast and a louder object is how you pay for it. `enemy` is the worst ink in all
  fourteen cells, so it is the one that sets the floor and the one worth moving.
*/
console.log('\nWhat a brighter `enemy` would buy — worst ratio across all seven places, vivid:');
const CANDIDATES = ['#ff4d6d', '#ff667f', '#ff8093', '#ff97a6', '#ffadb8', '#ffc2ca'];
for (const hex of CANDIDATES) {
  let worst = Infinity;
  let where = '';
  for (const theme of THEME_KINDS) {
    const backdrop = over(THEMES[theme].space.vivid, THEMES[theme].nebula.vivid, skyCover(size, theme));
    const ratio = contrast(hex, backdrop);
    if (ratio < worst) {
      worst = ratio;
      where = theme;
    }
  }
  // How much MORE cover the tightest place could then take before the floor stops it.
  let headroom = 0;
  for (let extra = 0; extra <= 0.6; extra += 0.01) {
    const cover = Math.min(1, skyCover(size, where) + extra);
    const backdrop = over(THEMES[where].space.vivid, THEMES[where].nebula.vivid, cover);
    if (contrast(hex, backdrop) >= GAMEPLAY_FLOOR) headroom = extra;
  }
  const mark = worst >= GAMEPLAY_FLOOR ? 'OK ' : '✗  ';
  console.log(
    `  ${mark} ${hex}  worst ${worst.toFixed(2)} at ${where.padEnd(10)} ` +
      `· room for +${headroom.toFixed(2)} more cover there`,
  );
}

console.log('\nHow much of each sky is at each cover, by area (vivid):');
console.log('place        peak    ≥0.5     ≥0.7     ≥0.9');
console.log('─'.repeat(52));
for (const theme of THEME_KINDS) {
  const hist = coverArea(size, theme);
  console.log(
    `${theme.padEnd(12)} ${hist.peak.toFixed(3)}  ${pct(hist.over50)}  ${pct(hist.over70)}  ${pct(hist.over90)}`,
  );
}

function pct(fraction) {
  return `${(fraction * 100).toFixed(2)}%`.padStart(7);
}

/** The cover at every point of a grid, as a histogram rather than as its single loudest sample. */
function coverArea(tile, theme, step = 4) {
  let peak = 0;
  let n = 0;
  let over50 = 0;
  let over70 = 0;
  let over90 = 0;
  for (let x = 0; x < tile; x += step) {
    for (let y = 0; y < tile; y += step) {
      const c = coverAt(tile, theme, x, y);
      n += 1;
      if (c > peak) peak = c;
      if (c >= 0.5) over50 += 1;
      if (c >= 0.7) over70 += 1;
      if (c >= 0.9) over90 += 1;
    }
  }
  return { peak, over50: over50 / n, over70: over70 / n, over90: over90 / n };
}

// One point's cover, rebuilt here rather than exported: this script is an instrument and `skyCover`
// is the thing being questioned, so reading it through its own summary would prove nothing.
import { nebulaField, STRUCTURE_OF } from '../src/render/bake.ts';
function coverAt(tile, theme, x, y) {
  let cover = 0;
  for (const cloud of nebulaField(tile, theme)) {
    const d = Math.hypot(x - cloud.x, y - cloud.y);
    if (d < cloud.r) cover = 1 - (1 - cover) * (1 - cloud.alpha * (1 - d / cloud.r));
  }
  for (const mark of STRUCTURE_OF[theme](tile)) {
    if (!mark.lit) continue;
    let hit = false;
    if (mark.width === 0) {
      let inside = false;
      const p = mark.points;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        if (p[i][1] > y !== p[j][1] > y && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) {
          inside = !inside;
        }
      }
      hit = inside;
    } else {
      for (let i = 1; i < mark.points.length && !hit; i += 1) {
        const [a, b] = [mark.points[i - 1], mark.points[i]];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len = dx * dx + dy * dy;
        const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / len));
        hit = Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy)) <= mark.width / 2;
      }
    }
    if (hit) cover = 1 - (1 - cover) * (1 - mark.alpha);
  }
  return cover;
}
