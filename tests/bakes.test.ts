import { describe, expect, it } from 'vitest';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { MUSIC_LAYERS } from '../src/content/music.ts';
import { loopsAt } from './bakes.ts';

/**
 * WHAT `tests/bakes.ts` HANDS OUT IS A COPY.
 *
 * Its header says why, and it was a claim nothing held: a shared buffer would let one test change
 * another's subject silently, both green. Added by
 * `docs/decisions/0422-a-place-is-baked-on-every-core.md`; the pool that decision also added is gone
 * again — `docs/decisions/0423-the-pool-is-taken-out-and-a-page-boot-is-sized-under-the-suite.md` —
 * and this is the half of it that stands on its own.
 */
describe('0422 — the cache hands out copies', () => {
  it('and what it hands out is a copy, so one test cannot move another’s subject', () => {
    const first = loopsAt(SAMPLE_RATE);
    first[MUSIC_LAYERS[0]!][0] = 123;
    expect(loopsAt(SAMPLE_RATE)[MUSIC_LAYERS[0]!][0]).not.toBe(123);
  });
});
