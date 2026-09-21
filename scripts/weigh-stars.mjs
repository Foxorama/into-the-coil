// What a place's star field IS, in the pixels of the screen it is authored for.
//
// Usage:  node scripts/weigh-stars.mjs            every place, both dot layers
//
// docs/decisions/0343-the-stars-are-drawn-for-a-desk.md. Reported: *"drawn out, big, chunky and just
// monocoloured on desktop."* Every number the sky's guards hold is a world unit or a share of another
// layer; none of them says how big a star is on a monitor, which is the only thing that was reported.

import { bakeSize, skyField, starLight } from '../src/render/bake.ts';
import { SPRITE_EXTENT } from '../src/content/sprites.ts';
import { THEME_KINDS, THEMES } from '../src/content/themes.ts';

// 1920×1080, and `across` is a fixed hundred over the short axis — 0023.
const CSS_PER_UNIT = 1080 / 100;

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

console.log('place            layer     marks  median px  biggest px  colours  lit share of tile');
for (const theme of THEME_KINDS) {
  for (const kind of ['skyFar', 'skyNear']) {
    const size = bakeSize(SPRITE_EXTENT[kind], 10);
    const perUnit = size / SPRITE_EXTENT[kind];
    const field = skyField(kind, size, theme);
    const across = field.stars.map((s) => (s.r / perUnit) * 2 * CSS_PER_UNIT);
    const colours = new Set(field.stars.map((s) => s.tint ?? 'sky')).size;
    // The bake's own arithmetic, so this table and `tests/stars.test.ts` cannot disagree about it.
    const share = starLight(kind, size, theme);
    console.log(
      `${THEMES[theme].title.padEnd(16)} ${kind.padEnd(8)} ${String(field.stars.length).padStart(6)} ` +
        `${median(across).toFixed(1).padStart(10)} ${Math.max(...across).toFixed(1).padStart(11)} ` +
        `${String(colours).padStart(8)}  ${(share * 100).toFixed(3)}%`,
    );
  }
}
