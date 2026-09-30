import { describe, expect, it } from 'vitest';
import { bakeLayer } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_LAYERS } from '../src/content/music.ts';
import { loopsAt, primeLoops } from './bakes.ts';

/**
 * THE POOL IS ONLY ALLOWED TO BE FASTER — `docs/decisions/0422-a-place-is-baked-on-every-core.md`.
 *
 * Every audio guard in the repository reads its music through `tests/bakes.ts`, so a pool that bakes a
 * sample differently is every one of them measuring other music, green. Held here against the one
 * thing it must equal: the same layer baked in this thread, by `bakeLayer`, compared byte for byte.
 *
 * ⚠️ **Two places primed in ONE pool run**, the base and a place with its own material, so a layer
 * handed back under the wrong place — the same layer name, another place's samples — is a difference
 * here and not a coincidence of order.
 */
describe('0422 — a place baked on every core is the place baked here', () => {
  it('THE ONE IT IS FOR: every layer from the pool is the layer baked in this thread, to the byte', () => {
    primeLoops(SAMPLE_RATE, [undefined, 'nebula']);
    const wrong: string[] = [];
    for (const theme of [undefined, 'nebula'] as const) {
      const pooled = loopsAt(SAMPLE_RATE, theme);
      for (const layer of MUSIC_LAYERS) {
        const here = bakeLayer(layer, SAMPLE_RATE, theme);
        const a = Buffer.from(pooled[layer].buffer, pooled[layer].byteOffset, pooled[layer].byteLength);
        const b = Buffer.from(here.buffer, here.byteOffset, here.byteLength);
        if (a.length !== b.length || Buffer.compare(a, b) !== 0) wrong.push(`${theme ?? 'base'}/${layer}`);
      }
    }
    // A place with its own material is what makes the second half a test and not a repeat of the first.
    expect(
      MUSIC_LAYERS.some((layer) => Buffer.compare(Buffer.from(loopsAt(SAMPLE_RATE, 'nebula')[layer].buffer), Buffer.from(loopsAt(SAMPLE_RATE)[layer].buffer)) !== 0),
      'nebula bakes the base composition, so it cannot tell a place from the base',
    ).toBe(true);
    expect(wrong, 'layers the pool baked differently from this thread').toEqual([]);
    // 0245: 13.5 s alone; 33.6 s and 38.8 s in two whole-suite runs on the development box
    // (2026-09-30); three times the worst.
  }, 120_000);

  it('and what it hands out is a copy, so one test cannot move another’s subject', () => {
    const first = loopsAt(SAMPLE_RATE);
    first[MUSIC_LAYERS[0]!][0] = 123;
    expect(loopsAt(SAMPLE_RATE)[MUSIC_LAYERS[0]!][0]).not.toBe(123);
  });
});
