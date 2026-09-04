import { describe, expect, it } from 'vitest';

import { drawKind } from '../src/render/bake.ts';
import { ENEMIES, ENEMY_KINDS, SIGNATURE_OF, type EnemyKind } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { PALETTES } from '../src/content/palette.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { viewOf } from '../src/sim/camera.ts';
import { tracingPen } from './paths.ts';

/**
 * EACH PLACE HAS ITS OWN ENEMY — 0232.
 *
 * `docs/decisions/0232-each-place-has-its-own-enemy.md`. Asked for: *"each level needs its own brand
 * of unique enemy to flavour that world."* Seven kinds, one per place, sent by that place's level
 * and by no other.
 *
 * ⚠️ **HELD AS A PAIRING, BOTH WAYS.** A signature kind that a second level also sends is not a
 * signature; a place whose signature its own level never sends has none. Both are edits a hand makes
 * copying a wave between levels, and both are green by every other guard.
 */

const DESKTOP = viewOf(1280, 720);

/** The signature kinds, off the table. */
const SIGNATURES: readonly EnemyKind[] = THEME_KINDS.map((t) => SIGNATURE_OF[t]);

/** The hull of a kind, as its first traced pass, in CSS pixels of a 1280×720 screen. */
function hullOf(kind: SpriteKind): string {
  const { pen, trace } = tracingPen();
  drawKind(pen, kind, PALETTES.vivid, SPRITE_EXTENT[kind] * DESKTOP.scale, 'approach');
  const hull = trace.passes[0]!;
  // Normalised to the sprite's own radius, so two hulls of different extents are compared as shapes.
  const r = SPRITE_EXTENT[kind] * DESKTOP.scale * 0.42;
  const half = (SPRITE_EXTENT[kind] * DESKTOP.scale) / 2;
  return JSON.stringify(hull.subpaths.map((s) => s.map(([x, y]) => [((x - half) / r).toFixed(2), ((y - half) / r).toFixed(2)])));
}

describe('0232 — each place has its own enemy', () => {
  it('THE REPORTED ONE: every place names a signature kind, and no two places name the same one', () => {
    expect(new Set(SIGNATURES).size, 'two places share a signature enemy').toBe(THEME_KINDS.length);
    for (const kind of SIGNATURES) expect(ENEMY_KINDS, `${kind} is a signature and not an enemy kind`).toContain(kind);
  });

  it('and a signature is sent by its own place’s level and by no other', () => {
    for (const theme of THEME_KINDS) {
      const signature = SIGNATURE_OF[theme];
      for (const level of LEVEL_KINDS) {
        const sends = LEVELS[level].waves.filter((w) => w.enemy === signature).length;
        if (LEVELS[level].theme === theme) {
          expect(sends, `${level} is set in ${theme} and never sends its ${signature}`).toBeGreaterThanOrEqual(4);
        } else {
          expect(sends, `${level} sends ${theme}'s ${signature}, so it is nobody's signature`).toBe(0);
        }
      }
    }
  });

  it('and every signature is a new silhouette against every other enemy hull', () => {
    const hulls = new Map<string, EnemyKind>();
    for (const kind of ENEMY_KINDS) {
      const hull = hullOf(SPRITE_KINDS[ENEMIES[kind].sprite]!);
      const twin = hulls.get(hull);
      expect(twin, `${kind} and ${twin} are the same silhouette`).toBeUndefined();
      hulls.set(hull, kind);
    }
  });

  it('and a firing signature sends a bullet-and-pattern no other kind sends', () => {
    // `tests/legibility.test.ts` holds this over every shooter; restated here over the seven so the
    // failure names the place.
    const seen = new Map<string, EnemyKind>();
    for (const kind of ENEMY_KINDS) {
      const row = ENEMIES[kind];
      if (row.fireEvery === 0) continue;
      const signature = `${row.shot}/${row.attack.kind}`;
      const twin = seen.get(signature);
      expect(twin, `${kind} and ${twin} both send ${signature}`).toBeUndefined();
      seen.set(signature, kind);
    }
    expect(SIGNATURES.filter((k) => ENEMIES[k].fireEvery > 0).length, 'no signature fires').toBeGreaterThan(0);
    expect(SIGNATURES.filter((k) => ENEMIES[k].fireEvery === 0).length, 'every signature fires, so none is a body to avoid').toBeGreaterThan(0);
  });

  it('and the table is one per place over the closed union', () => {
    for (const theme of THEME_KINDS as readonly ThemeKind[]) expect(typeof SIGNATURE_OF[theme]).toBe('string');
  });
});
