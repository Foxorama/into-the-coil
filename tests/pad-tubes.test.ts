import { describe, expect, it } from 'vitest';
import { paintLoadedTubes } from '../src/render/bake.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { SHIPS, SHIP_KINDS, ownFit, sameFit } from '../src/content/ships.ts';
import { MISSILE_KINDS } from '../src/content/missiles.ts';
import { tracingPen } from './paths.ts';

/**
 * THE PAD WEARS ITS TUBES — `docs/decisions/0582-the-pad-wears-its-tubes.md`.
 *
 * *"[The tubes] need to be shown in the hangar when equipped."* The pad's ship was baked bare whatever its
 * rack. What is held here: a fit carries its tubes, a fit with other tubes is another picture, and the
 * tubes are painted at each place the ship's row names for them, in their kinds' inks — the frame's own
 * placing (0581), painted.
 */

const palette = PALETTES[DEFAULT_PALETTE];
/** A box of 200 pixels, its radius 0.42 of it, as every ship's sprite is drawn. */
const F = { half: 100, r: 84 };
/** The box's radius in world units: a ship's 9.4-unit box, 0.42 of it. */
const BOX_R = 9.4 * 0.42;
const INK = { straight: palette.bullet, homing: palette.ally } as const;

describe('a fit', () => {
  it('comes with no tubes, and one with other tubes is another picture', () => {
    for (const ship of SHIP_KINDS) expect(ownFit(ship).tubes, `${ship} comes with tubes`).toEqual([]);
    const bare = ownFit('fighter');
    expect(sameFit(bare, { ...bare, tubes: ['straight'] }), 'a tube fitted is the same picture').toBe(false);
    expect(sameFit({ ...bare, tubes: ['straight', 'homing'] }, { ...bare, tubes: ['homing', 'straight'] }), 'a rack in the other order is the same picture').toBe(false);
    expect(sameFit({ ...bare, tubes: ['homing'] }, { ...bare, tubes: ['homing'] })).toBe(true);
  });
});

describe('the pad’s tubes', () => {
  it('THE ASK: every ship wears each tube of a rack at its place, in its kind’s ink', () => {
    for (const ship of SHIP_KINDS) {
      const row = SHIPS[ship];
      for (const rack of [['straight', 'homing'], ['homing', 'straight'], ['homing'], ['straight']] as const) {
        const { pen, trace } = tracingPen();
        paintLoadedTubes(pen, F, palette, ship, rack);
        const places = row.tubes[rack.length === 2 ? 2 : 1];
        rack.forEach((kind, i) => {
          const place = places[i]!;
          const x = F.half + ((place.along - row.tubeLength / 2) / BOX_R) * F.r;
          const y = F.half + (place.across / BOX_R) * F.r;
          // The first fill of each tube is its outline, in its kind's ink, about its place.
          const outline = trace.passes.filter((pass) => pass.colour === INK[kind]).find((pass) => {
            const points = pass.subpaths.flat();
            const cx = points.reduce((s, [px]) => s + px, 0) / points.length;
            const cy = points.reduce((s, [, py]) => s + py, 0) / points.length;
            return Math.hypot(cx - x, cy - y) < (row.tubeLength / BOX_R) * F.r;
          });
          expect(outline, `${ship} with ${rack.join('+')}: tube ${i} is not a ${kind} at its place`).toBeDefined();
        });
        const carried: readonly string[] = rack;
        const other = MISSILE_KINDS.find((kind) => !carried.includes(kind));
        if (other !== undefined) expect(trace.passes.some((pass) => pass.colour === INK[other]), `${ship} with ${rack.join('+')} wears a ${other}`).toBe(false);
      }
    }
  });

  it('wears nothing with no tubes fitted', () => {
    const { pen, trace } = tracingPen();
    paintLoadedTubes(pen, F, palette, 'estate', []);
    expect(trace.passes).toHaveLength(0);
  });
});
