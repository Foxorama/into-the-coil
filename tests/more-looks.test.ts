/**
 * MORE LOOKS — `docs/decisions/0589-more-looks.md`.
 *
 * *"Overall we need more cosmetics of every shape and style."* What is held is that each new thing is a
 * thing of its own: a look is a picture no other look of its ship draws, a rim a picture no other rim draws,
 * and every new ware is on a shelf with a price. Whether each looks right is the picture's — `rig/looks.html`.
 */

import { describe, expect, it } from 'vitest';
import { ART } from '../src/content/art.ts';
import { DANGLES, DANGLE_KINDS } from '../src/content/dangles.ts';
import { FLAMES, FLAME_KINDS } from '../src/content/flames.ts';
import { RIMS, RIM_KINDS } from '../src/content/rims.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { SHELVES } from '../src/content/wares.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { drawPlayerShip, paintRim } from '../src/render/bake.ts';
import { tracingPen } from './paths.ts';

const palette = PALETTES[DEFAULT_PALETTE];

describe('0589 — more looks', () => {
  it('every ship has a fourth look, and no two of a ship’s looks are one picture', () => {
    for (const ship of SHIP_KINDS) {
      const row = SHIPS[ship];
      expect(row.arts.length, `${ship} has no fourth look`).toBe(4);
      const pictures = new Set(
        row.arts.map((art) => {
          const { pen, trace } = tracingPen();
          drawPlayerShip(pen, { half: 200, r: 168 }, palette, ship, 0, row.weapon, row.wheels?.rim ?? null, art, null);
          // The colours too: the visor is the glass's dome in gold.
          return JSON.stringify([trace.passes.map((p) => p.subpaths), trace.inks.map((p) => [p.subpaths, p.colour])]);
        }),
      );
      expect(pictures.size, `two of the ${ship}'s looks are one picture: ${row.arts.map((art) => ART[art].name).join(', ')}`).toBe(row.arts.length);
    }
  });

  it('no two rims are one picture', () => {
    const pictures = new Set(
      RIM_KINDS.map((rim) => {
        const { pen, trace } = tracingPen();
        paintRim(pen, { half: 50, r: 42 }, palette, rim, 0, 0, 1, 0);
        return JSON.stringify([trace.passes.map((p) => p.subpaths), trace.inks.map((p) => p.subpaths)]);
      }),
    );
    expect(pictures.size, 'two rims are drawn alike').toBe(RIM_KINDS.length);
  });

  it('every new ware is sold, on its own table’s shelf', () => {
    for (const kind of ['duck', 'horseshoe', 'mirrorball', 'bobblehead'] as const) {
      expect(DANGLE_KINDS).toContain(kind);
      expect(DANGLES[kind].price, kind).not.toBe(null);
      expect(SHELVES.hanging.wares, kind).toContain(kind);
    }
    for (const kind of ['nebula', 'plasma', 'afterburner'] as const) {
      expect(FLAME_KINDS).toContain(kind);
      expect(FLAMES[kind].price, kind).not.toBe(null);
      expect(SHELVES.flames.wares, kind).toContain(kind);
    }
    for (const kind of ['neon', 'wire'] as const) {
      expect(RIMS[kind].from, `${kind} comes on a car`).toBe(null);
      expect(SHELVES.wheels.wares, kind).toContain(kind);
    }
  });
});
