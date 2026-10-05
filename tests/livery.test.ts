import { describe, expect, it } from 'vitest';
import { HUES, TONES, liveryFor, liveryInk } from '../src/content/livery.ts';
import { SHIP_KINDS, ownFit, sameFit } from '../src/content/ships.ts';
import { PALETTES } from '../src/content/palette.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { initialHangar, liveryOpen } from '../src/state/slices/hangar.ts';
import { SCREENS, liveryWhy, toneWhy } from '../src/state/screens.ts';
import { HANGAR_VERSION, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';

/**
 * THE LIVERY IS FREE — `docs/decisions/0529-the-livery-is-free.md`.
 *
 * ⚠️ **What is held is the paint's rule, its key, and that every colour the picker offers is a different
 * colour and none is any palette's ink** — a livery that came out as the player's cyan or the enemy's red
 * would be a ship painted to look like something it is not.
 */

/** The state with `ships` won in. */
function wonIn(...ships: (typeof SHIP_KINDS)[number][]): State {
  let state = initialState;
  for (const ship of ships) state = reduce(state, { slice: 'hangar', type: 'won', ship });
  return state;
}

describe('the picker', () => {
  it('THE ASK: a free colour — the factory’s, then twelve hues in three tones, every one different', () => {
    const band = SCREENS.parts.choices.find((c) => c.name === 'livery')!;
    expect(band.options[0]!.label).toBe('Factory');
    expect(band.options.slice(1).map((o) => o.label)).toEqual(HUES.map((h) => h.name));
    expect(SCREENS.parts.choices.find((c) => c.name === 'tone')!.options.map((o) => o.label)).toEqual(TONES.map((t) => t.name));
    const inks = HUES.flatMap((_, hue) => TONES.map((__, tone) => liveryInk({ hue, tone })));
    expect(new Set(inks).size, 'two places on the picker paint the same colour').toBe(HUES.length * TONES.length);
    for (const ink of inks) expect(ink).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('its pure hues are the hues they are named: the named channel is the strongest by far', () => {
    const rgb = (ink: string): number[] => [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));
    const [rr, rg, rb] = rgb(liveryInk({ hue: 0, tone: 1 }));
    expect(rr! - Math.max(rg!, rb!), 'red is not red').toBeGreaterThan(150);
    const [gr, gg, gb] = rgb(liveryInk({ hue: 4, tone: 1 }));
    expect(gg! - Math.max(gr!, gb!), 'green is not green').toBeGreaterThan(150);
    const [br, bg, bb] = rgb(liveryInk({ hue: 8, tone: 1 }));
    expect(bb! - Math.max(br!, bg!), 'blue is not blue').toBeGreaterThan(150);
  });
});

describe('the paint', () => {
  it('every ship comes in the factory’s paint, and is painted only once it is won in', () => {
    for (const ship of SHIP_KINDS) expect(initialHangar.livery[ship], ship).toBe(null);
    const fit = { slice: 'hangar', type: 'livery', ship: 'estate', hue: 9 } as const;
    expect(reduce(initialState, fit).hangar.livery.estate, 'painted before a win').toBe(null);
    expect(liveryOpen(wonIn('estate').hangar, 'estate')).toBe(true);
    expect(reduce(wonIn('estate'), fit).hangar.livery.estate, 'a hue is laid on in the bright tone').toEqual({ hue: 9, tone: 1 });
    expect(liveryWhy('estate', false)).toContain('Gilded Estate');
  });

  it('a tone moves the paint it has, keeps across a change of hue, and has nothing to move on the factory’s', () => {
    let state = wonIn('fighter');
    state = reduce(state, { slice: 'hangar', type: 'tone', ship: 'fighter', tone: 0 });
    expect(state.hangar.livery.fighter, 'the factory’s paint took a tone').toBe(null);
    expect(toneWhy(true, false)).toContain('colour first');
    state = reduce(state, { slice: 'hangar', type: 'livery', ship: 'fighter', hue: 2 });
    state = reduce(state, { slice: 'hangar', type: 'tone', ship: 'fighter', tone: 2 });
    state = reduce(state, { slice: 'hangar', type: 'livery', ship: 'fighter', hue: 5 });
    expect(state.hangar.livery.fighter, 'a new hue lost its tone').toEqual({ hue: 5, tone: 2 });
    state = reduce(state, { slice: 'hangar', type: 'livery', ship: 'fighter', hue: null });
    expect(state.hangar.livery.fighter).toBe(null);
    expect(reduce(state, { slice: 'hangar', type: 'livery', ship: 'fighter', hue: HUES.length }).hangar.livery.fighter, 'a hue past the list').toBe(null);
  });

  it('the paint is the fit’s, and the high-contrast look stays on its roles', () => {
    const blue = { hue: 8, tone: 1 };
    expect(liveryFor(blue, 'vivid')).toBe(liveryInk(blue));
    expect(liveryFor(blue, 'high-contrast'), 'a chosen colour on the palette of meanings').toBe(null);
    expect(liveryFor(null, 'vivid')).toBe(null);
    expect(sameFit(ownFit('caddie'), { ...ownFit('caddie'), livery: liveryInk(blue) })).toBe(false);
  });

  it('no colour on the picker is one of the palette’s own inks', () => {
    const inks = new Set(Object.values(PALETTES.vivid).filter((v): v is string => typeof v === 'string').map((v) => v.toLowerCase()));
    for (let hue = 0; hue < HUES.length; hue++) for (let tone = 0; tone < TONES.length; tone++) expect(inks.has(liveryInk({ hue, tone })), `${HUES[hue]!.name} ${TONES[tone]!.name}`).toBe(false);
  });
});

describe('the key', () => {
  it('keeps each ship’s paint, and refuses one on a ship never won in or off the lists', () => {
    const state = reduce(wonIn('caddie'), { slice: 'hangar', type: 'livery', ship: 'caddie', hue: 10 });
    expect(hangarFrom(serialiseHangar(state.hangar), initialHangar)).toEqual(state.hangar);
    const forged = JSON.stringify({ v: HANGAR_VERSION, won: { fighter: true }, livery: { caddie: { hue: 1, tone: 1 }, fighter: { hue: 99, tone: 1 }, estate: 'red' } });
    expect(hangarFrom(forged, initialHangar).livery).toEqual(initialHangar.livery);
    expect(hangarFrom(JSON.stringify({ v: HANGAR_VERSION, won: { estate: true } }), initialHangar).livery).toEqual(initialHangar.livery);
  });
});
