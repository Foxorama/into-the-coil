/**
 * Ember Nebula, in colour — `docs/decisions/0345-ember-nebula-is-in-colour.md`.
 *
 * Reported: *"the nebula background is decent now, but it needs to be a more vibrant beautiful
 * backdrop."* And, from the rule the queue took on the same day: everything else on that screen that
 * a desktop shows up — dust drawn in straight pieces, above all.
 */

import { describe, expect, it } from 'vitest';

import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import { SPRITE_EXTENT } from '../src/content/sprites.ts';
import { THEME_KINDS, THEMES } from '../src/content/themes.ts';
import { STRUCTURE_OF, bakeSize, nebulaField } from '../src/render/bake.ts';

const size = bakeSize(SPRITE_EXTENT.skyNebula, 10);
const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

describe('0345 — Ember Nebula is in colour', () => {
  it('THE REPORTED ONE: every gas the place states is on the screen, and the body is still the most of it', () => {
    /*
      Two colours in a table is not two colours on a screen (0223), and five is not five. Read off the
      field the painter walks: every stated gas is some cloud's, so none can be rolled out of
      existence, and the body the place is recognised by keeps the largest single share.
    */
    const stated = THEMES.nebula.gases?.vivid.length ?? 0;
    expect(stated, 'Ember Nebula states no further gases — it is a body and an accent again').toBeGreaterThanOrEqual(3);
    const field = nebulaField(size, 'nebula');
    const drawn = new Set(field.map((c) => c.gas).filter((g): g is number => g !== null));
    expect([...drawn].sort(), 'a gas the place states is not drawn in any cloud').toEqual(
      Array.from({ length: stated }, (_, i) => i),
    );
    const body = field.filter((c) => c.gas === null && !c.glow).length;
    for (const gas of drawn) {
      const share = field.filter((c) => c.gas === gas).length;
      expect(body, `gas ${gas} has ${share} clouds against the body's ${body}`).toBeGreaterThan(share);
    }
  });

  it('and both palettes state the same NUMBER of gases, because the field that picks one knows no palette', () => {
    for (const theme of THEME_KINDS) {
      const gases = THEMES[theme].gases;
      if (gases === undefined) continue;
      const counts = PALETTE_NAMES.map((name) => gases[name].length);
      expect(new Set(counts).size, `${theme} states ${counts.join(' and ')} gases across its palettes`).toBe(1);
    }
  });

  it('0282 — a place that states no gases has the two colours it always had, cloud for cloud', () => {
    for (const theme of THEME_KINDS) {
      if (THEMES[theme].gases !== undefined) continue;
      const tinted = nebulaField(size, theme).filter((c) => c.gas !== null).length;
      expect(tinted, `${theme} states no gases and ${tinted} of its clouds were given one`).toBe(0);
    }
  });

  it('THE ONE THE 1080p PHOTOGRAPH FOUND: Ember Nebula’s dust has no corner in it', () => {
    /*
      ⚠️ **THIS PLACE'S, AND NOT EVERY PLACE'S** — 0295: *does it make sense for THAT THING to be hard?*
      Dust in a flow is a curve; The Labyrinth's masonry is allowed a corner and should have them. The
      lanes and filaments here were random walks in eight and fourteen straight pieces, which on a
      desktop are slabs and zigzags.

      In degrees of turn at a vertex of a CROSSING mark — the quantity the eye reads as a kink. The
      local marks are the globules, which are nine-sided on purpose and soft because they are drawn
      three times.
    */
    for (const mark of STRUCTURE_OF.nebula(size)) {
      if (!mark.crosses) continue;
      let sharpest = 0;
      const p = mark.points;
      for (let i = 1; i < p.length - 1; i += 1) {
        const a = Math.atan2(p[i]![1]! - p[i - 1]![1]!, p[i]![0]! - p[i - 1]![0]!);
        const b = Math.atan2(p[i + 1]![1]! - p[i]![1]!, p[i + 1]![0]! - p[i]![0]!);
        let turn = Math.abs(b - a);
        if (turn > Math.PI) turn = Math.PI * 2 - turn;
        // A filled ribbon turns back on itself at its two ends, along the tile's own edge: not a kink.
        const onEdge = p[i]![0]! < 0.5 || p[i]![0]! > size - 0.5;
        if (!onEdge) sharpest = Math.max(sharpest, (turn * 180) / Math.PI);
      }
      expect(sharpest, `a crossing mark in Ember Nebula turns ${sharpest.toFixed(1)}° at one vertex — a kink`).toBeLessThan(12);
    }
  });
});
