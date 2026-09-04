import { describe, expect, it } from 'vitest';

import { drawKind } from '../src/render/bake.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { THEMES, THEME_KINDS, foeOf, type ThemeKind } from '../src/content/themes.ts';
import { viewOf } from '../src/sim/camera.ts';
import { GAMEPLAY_FLOOR, contrast, luminance } from './contrast.ts';
import { tracingPen } from './paths.ts';

/**
 * AN ENEMY WEARS ITS PLACE — 0228.
 *
 * `docs/decisions/0228-an-enemy-wears-its-place.md`. Asked for: *"detailed sprites for each level…
 * enemies."* A place hands its enemies a skin — a hull colour, a plate, a lit strip, an eye — and
 * every enemy and the boss are painted in it over the silhouette they already had.
 *
 * ⚠️ **THE HULL IS `enemy` FOR THAT PLACE, SO IT IS HELD TO `enemy`'S TWO FLOORS.**
 * `tests/palette.test.ts` holds the `enemy` ink against the void at the gameplay floor and against
 * `pickup` and `player` at the separation floor, because those are the two confusions that cost a
 * life. A skin's hull is what an enemy is sealed in, so it is held to exactly those, against its own
 * place's backdrop.
 *
 * ⚠️ **AND THE PAINT IS HELD BY `tests/accents.test.ts`**, which traces every body in every place —
 * containment, thickness, the flat hurt twin. What is here is only what that file cannot know: that
 * the skins are the places', that they differ, and that the high-contrast palette gets none of it.
 */

const DESKTOP = viewOf(1280, 720);

/** The hue of a colour on the wheel, in degrees, or null for a grey — `tests/places.test.ts`'s own. */
function hueOf(hex: string): number | null {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 0.02) return null;
  const d = max - min;
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return h;
}

const apart = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Every enemy body and every boss, off the rows that declare them. */
const FOES: readonly SpriteKind[] = [
  ...ENEMY_KINDS.map((k) => SPRITE_KINDS[ENEMIES[k].sprite]!),
  ...BOSS_KINDS.map((k) => SPRITE_KINDS[BOSSES[k].sprite]!),
];

/** Trace a kind in a palette and a place, at the size it is drawn on a 1280×720 screen. */
function passesOf(kind: SpriteKind, palette: PaletteName, theme: ThemeKind): number {
  const { pen, trace } = tracingPen();
  drawKind(pen, kind, PALETTES[palette], SPRITE_EXTENT[kind] * DESKTOP.scale, theme);
  return trace.passes.length;
}

describe('0228 — an enemy wears its place', () => {
  it('THE REPORTED ONE: every place skins its enemies, and no two places skin them alike', () => {
    const seen = new Map<string, ThemeKind>();
    for (const theme of THEME_KINDS) {
      const skin = THEMES[theme].foe;
      const key = JSON.stringify(skin);
      const twin = seen.get(key);
      expect(twin, `${theme} and ${twin} skin their enemies identically, so the two read as one place`).toBeUndefined();
      seen.set(key, theme);
    }
    // And the hulls are different COLOURS, not different shades of one — 0223's own bar.
    for (const a of THEME_KINDS) {
      for (const b of THEME_KINDS) {
        if (a >= b) continue;
        const ha = hueOf(THEMES[a].foe.hull);
        const hb = hueOf(THEMES[b].foe.hull);
        if (ha === null || hb === null) continue;
        expect(apart(ha, hb), `${a}'s and ${b}'s enemies are ${apart(ha, hb).toFixed(0)}° apart on the wheel, which is one colour`).toBeGreaterThanOrEqual(
          20,
        );
      }
    }
  });

  it('and a skin’s hull is legible on its own backdrop and never reads as a pickup or the ship', () => {
    const pickup = PALETTES.vivid.pickup;
    const player = PALETTES.vivid.player;
    for (const theme of THEME_KINDS) {
      const { hull, plate, lit } = THEMES[theme].foe;
      const backdrop = THEMES[theme].space.vivid;
      const onSpace = contrast(hull, backdrop);
      expect(onSpace, `${theme}'s enemies sit at ${onSpace.toFixed(2)}:1 on their own backdrop`).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
      // `tests/palette.test.ts`'s SEPARATED, for the two pairs it names.
      expect(contrast(hull, pickup), `${theme}'s enemies read as a pickup`).toBeGreaterThanOrEqual(1.6);
      expect(contrast(hull, player), `${theme}'s enemies read as the ship`).toBeGreaterThanOrEqual(1.6);
      // The plate is a shadow and the lit strip is a light: darker and lighter than the hull.
      expect(luminance(plate), `${theme}'s plate is not darker than its hull`).toBeLessThan(luminance(hull));
      expect(luminance(lit), `${theme}'s lit strip is not lighter than its hull`).toBeGreaterThan(luminance(hull));
      // And the lit strip is not the pickup ink either, because it is the brightest mark on a body.
      expect(contrast(lit, pickup) >= 1.6 || lit !== pickup, `${theme}'s lit strip IS the pickup ink`).toBe(true);
    }
  });

  it('and every enemy and boss is painted in the vivid palette, in every place', () => {
    for (const theme of THEME_KINDS) {
      for (const kind of FOES) {
        expect(passesOf(kind, 'vivid', theme), `the ${kind} at ${theme} is one flat ink`).toBeGreaterThan(1);
      }
    }
  });

  it('and the high-contrast palette gets the flat game, with no skin on anything', () => {
    /*
      ⚠️ **0024, READ OFF A PROPERTY.** `foeOf` hands back no skin at all for any palette whose
      decoration is the void, which is what that palette declares itself to be.
      A skin on it would be the one thing the player turned the setting on to remove.
    */
    for (const theme of THEME_KINDS) {
      expect(foeOf(theme, PALETTES['high-contrast']), `${theme} skins the high-contrast palette`).toBeNull();
      for (const kind of FOES) {
        // The bosses keep 0149's carved interiors, which are holes and not paint; an enemy gets nothing.
        if (BOSS_KINDS.some((k) => SPRITE_KINDS[BOSSES[k].sprite] === kind)) continue;
        expect(passesOf(kind, 'high-contrast', theme), `the ${kind} is painted on the high-contrast palette at ${theme}`).toBe(1);
      }
      expect(foeOf(theme, PALETTES.vivid), 'the vivid palette does not get the place’s own skin').toBe(THEMES[theme].foe);
    }
  });

  it('and every level’s enemies are painted in the place the level is set in', () => {
    // The atlas is baked per place (0195), so this is a claim about the table: a level names a theme
    // and the theme names a skin, and there is no third place for an enemy's colour to come from.
    for (const level of LEVEL_KINDS) {
      const theme = LEVELS[level].theme;
      expect(THEMES[theme].foe.hull, `${level} is set somewhere with no skin`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
