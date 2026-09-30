import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bakeLayer } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { keptPath, layerAt, readLayer, sourceKey, writeLayer } from './bake-store.ts';
import { PROOF_BAKE_STORE } from '../scripts/prove-guard.mjs';

/**
 * A BAKE KEPT ON DISK IS ONLY ALLOWED TO BE FASTER — `docs/decisions/0424-a-bake-is-kept-for-its-source.md`.
 *
 * Every audio guard reads its music through `tests/bake-store.ts` now, so a store that hands back a
 * sample the synth would not have baked — another place's, another tree's, half a layer — is every
 * one of them measuring other music, green. Each test here is one of those ways.
 */

const bytes = (a: Float32Array): Buffer => Buffer.from(a.buffer, a.byteOffset, a.byteLength);
const mode = process.env.ITC_BAKE_STORE;
afterEach(() => {
  if (mode === undefined) delete process.env.ITC_BAKE_STORE;
  else process.env.ITC_BAKE_STORE = mode;
});

describe('0424 — a bake is kept for its source', () => {
  it('THE ONE IT IS FOR: a layer from the store is the layer baked here, to the byte, for the place asked', () => {
    // Writing, whatever this run was told, so the second read of each is the store's and not a bake.
    process.env.ITC_BAKE_STORE = 'write';
    const asked = [
      ['drone', undefined],
      ['drone', 'nebula'],
      ['lead', 'core'],
    ] as const;
    for (const [layer, theme] of asked) layerAt(layer, SAMPLE_RATE, theme);
    for (const [layer, theme] of asked) {
      const kept = readLayer(keptPath(layer, SAMPLE_RATE, theme), bakeLayer(layer, SAMPLE_RATE, theme).length);
      expect(kept, `${theme ?? 'base'}/${layer} was not kept`).not.toBeNull();
      expect(Buffer.compare(bytes(kept!), bytes(bakeLayer(layer, SAMPLE_RATE, theme))), `${theme ?? 'base'}/${layer} kept other samples`).toBe(0);
      expect(Buffer.compare(bytes(layerAt(layer, SAMPLE_RATE, theme)), bytes(bakeLayer(layer, SAMPLE_RATE, theme)))).toBe(0);
    }
  }, 120_000);

  it('THE KEY IS EVERY BYTE: one file changed, added or gone, or another Node, is another key', () => {
    const tree = new Map([
      ['app/music.ts', 'aa'],
      ['content/core.ts', 'bb'],
    ]);
    const key = sourceKey(tree, 'v24.0.0');
    expect(sourceKey(new Map([...tree, ['content/core.ts', 'bc']]), 'v24.0.0')).not.toBe(key);
    expect(sourceKey(new Map([...tree, ['content/new.ts', 'cc']]), 'v24.0.0')).not.toBe(key);
    expect(sourceKey(new Map([['app/music.ts', 'aa']]), 'v24.0.0')).not.toBe(key);
    expect(sourceKey(tree, 'v24.0.1'), 'the maths library is part of what a bake is').not.toBe(key);
    // …and the order a directory is walked in is not a difference.
    expect(sourceKey(new Map([...tree].reverse()), 'v24.0.0')).toBe(key);
  });

  it('A PART OF A LAYER IS NOT A LAYER: a file of any other length is a miss, and a write is whole', () => {
    const dir = mkdtempSync(join(tmpdir(), 'itc-store-'));
    try {
      const layer = Float32Array.from([0.5, -0.25, 1, 0]);
      writeLayer(join(dir, 'x.f32'), layer);
      expect(Buffer.compare(bytes(readLayer(join(dir, 'x.f32'), 4)!), bytes(layer))).toBe(0);
      expect(readLayer(join(dir, 'x.f32'), 5), 'a short file read as a layer').toBeNull();
      writeFileSync(join(dir, 'y.f32'), new Uint8Array(12));
      expect(readLayer(join(dir, 'y.f32'), 4), 'a truncated file read as a layer').toBeNull();
      expect(readLayer(join(dir, 'missing.f32'), 4)).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('A PROOF ONLY READS: told to read, a miss is baked here and nothing is kept', () => {
    expect(PROOF_BAKE_STORE, '`npm run prove` would keep a set of bakes for every probe that breaks src/').toBe('read');
    // A rate nothing else asks for, so the file is this test's to remove and look for.
    const rate = 8000;
    rmSync(keptPath('drone', rate), { force: true });
    process.env.ITC_BAKE_STORE = 'read';
    const read = layerAt('drone', rate);
    expect(existsSync(keptPath('drone', rate)), 'a read-only store kept a bake').toBe(false);
    expect(Buffer.compare(bytes(read), bytes(bakeLayer('drone', rate)))).toBe(0);
    process.env.ITC_BAKE_STORE = 'write';
    layerAt('drone', rate);
    expect(existsSync(keptPath('drone', rate)), 'a writing store did not keep it, so the test above proves nothing').toBe(true);
  });
});
