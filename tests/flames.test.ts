import { describe, expect, it } from 'vitest';
import { priced } from '../src/content/prices.ts';
import { FLAMES, FLAME_KINDS } from '../src/content/flames.ts';
import { OWNABLES, WARES } from '../src/content/wares.ts';
import { SHIP_KINDS, ownFit } from '../src/content/ships.ts';
import { PALETTES } from '../src/content/palette.ts';
import { flameInks } from '../src/render/bake.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { flameOpen, initialHangar } from '../src/state/slices/hangar.ts';
import { SCREENS, flameWhy, wareWhy } from '../src/state/screens.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';

/**
 * THE IONS BURN BLUE — `docs/decisions/0530-the-ions-burn-blue.md`.
 *
 * ⚠️ **What is held is the trade, the slot, the key — and that the ion's blue is a BLUE, held off the
 * frost ship's cyan by hue.** The plan: *"weighed against the frost shot on the frost ship's level before
 * it ships."* The weighing is a photograph in the decision; what a number can hold is that the flame's
 * ink stays a blue, which is the property the photograph showed keeps the two apart.
 */

/** The state with `shards` held. */
const holding = (shards: number): State => ({ ...initialState, hangar: { ...initialState.hangar, shards } });

/** An ink's hue, in degrees. */
function hue(ink: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

describe('the shop', () => {
  it('THE ASK: Ion Thrusters at Cosmo’s for 400 shards', () => {
    expect(WARES).toContain('ion');
    expect(OWNABLES.ion.name).toBe('Ion Thrusters');
    expect(OWNABLES.ion.price).toBe(priced(400));
    expect(initialHangar.owned.ion, 'the thrusters were owned before they were bought').toBe(false);
    expect(initialHangar.owned.standard).toBe(true);
    const bought = reduce(holding(priced(400)), { slice: 'hangar', type: 'bought', ware: 'ion' });
    expect(bought.hangar.shards).toBe(0);
    expect(wareWhy('ion', true, 0)).toContain('Paint & Parts');
  });
});

describe('the flame', () => {
  it('every ship burns the standard, and the ion once bought, on any ship, won in or not', () => {
    for (const ship of SHIP_KINDS) expect(initialHangar.flame[ship], ship).toBe('standard');
    expect(flameOpen(initialHangar, 'ion')).toBe(false);
    expect(reduce(initialState, { slice: 'hangar', type: 'flame', ship: 'fighter', flame: 'ion' }).hangar.flame.fighter, 'burned before it was bought').toBe('standard');
    const bought = reduce(holding(priced(400)), { slice: 'hangar', type: 'bought', ware: 'ion' });
    for (const ship of SHIP_KINDS) expect(reduce(bought, { slice: 'hangar', type: 'flame', ship, flame: 'ion' }).hangar.flame[ship], ship).toBe('ion');
    expect(flameWhy(false)).toContain('Cosmo');
    expect(flameWhy(true)).toBe(null);
  });

  it('the band offers every flame, the standard first', () => {
    const band = SCREENS.parts.choices.find((c) => c.name === 'flame')!;
    expect(band.options.map((o) => o.label)).toEqual(FLAME_KINDS.map((kind) => FLAMES[kind].name));
    expect(FLAME_KINDS[0]).toBe('standard');
  });

  it('the standard burns the palette’s own inks, so it is the flame it always was', () => {
    const palette = PALETTES.vivid;
    expect(flameInks(palette, 'standard')).toEqual({ outer: palette.bullet, inner: palette.hazard, wisp: palette.flame });
  });

  it('the ion is a blue, held well off the frost shard’s cyan and the player’s own', () => {
    const frost = hue(PALETTES.vivid.frost);
    const player = hue(PALETTES.vivid.player);
    const { outer, inner } = flameInks(PALETTES.vivid, 'ion');
    for (const ink of [outer, inner]) {
      expect(hue(ink) - frost, `${ink} is within reach of the frost shard's ${PALETTES.vivid.frost}`).toBeGreaterThanOrEqual(25);
      expect(hue(ink) - player).toBeGreaterThanOrEqual(25);
      expect(hue(ink), `${ink} is past blue into violet`).toBeLessThan(250);
    }
  });

  it('the flame is part of a ship’s fit', () => {
    expect(ownFit('fighter').flame).toBe('standard');
  });
});

describe('the key', () => {
  it('keeps each ship’s flame, and refuses one its own list does not own', () => {
    const bought = reduce(holding(priced(400)), { slice: 'hangar', type: 'bought', ware: 'ion' });
    const fitted = reduce(bought, { slice: 'hangar', type: 'flame', ship: 'caddie', flame: 'ion' });
    expect(hangarFrom(serialiseHangar(fitted.hangar), initialHangar)).toEqual(fitted.hangar);
    const forged = JSON.stringify({ v: HANGAR_VERSION, flame: { caddie: 'ion', fighter: 'plasma' } });
    expect(hangarFrom(forged, initialHangar).flame, 'a flame never bought was fitted from the save').toEqual(initialHangar.flame);
  });
});
