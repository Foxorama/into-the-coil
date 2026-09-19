/**
 * A few workers, and a queue of layers for them — what `bakePlace` hands its layers to in a browser.
 *
 * ⚠️ **ITS OWN FILE BECAUSE OF WHAT IT IMPORTS.** `?worker&inline` is a bundler's import and means nothing
 * to node, and `src/app/sound.ts` and `src/app/mount.ts` are both loaded by suites that run there. Only
 * `src/main.ts` imports this, and it hands the result to `useLayerBaker`; everything else sees a function.
 */

import BakeWorker from './bake.worker.ts?worker&inline';
import type { BakeReply, BakeRequest } from './bake.worker.ts';
import type { LayerBaker } from './sound.ts';
import { SAMPLE_RATE } from './sound.ts';

/**
 * How many workers. Two fewer than the machine has cores, so the game and the browser keep one each; at
 * least one, and no more than four — the longest single layer (the ballad's orchestra, about twelve
 * seconds) bounds the wall clock however many there are, and each worker holds its own copy of the code.
 */
const workersFor = (cores: number): number => Math.max(1, Math.min(4, cores - 2));

/** A baker backed by workers, or `null` where a worker cannot be made. */
export function makeBakePool(): LayerBaker | null {
  if (typeof Worker === 'undefined') return null;
  const waiting: { request: BakeRequest; done: (buffer: Float32Array) => void }[] = [];
  const pending = new Map<number, (buffer: Float32Array) => void>();
  const idle: Worker[] = [];
  let made = 0;
  let nextId = 1;
  const limit = workersFor(navigator.hardwareConcurrency || 4);

  const feed = (): void => {
    while (waiting.length > 0) {
      let worker = idle.pop();
      if (worker === undefined) {
        if (made >= limit) return;
        made++;
        const born = new BakeWorker();
        born.onmessage = (event: MessageEvent<BakeReply>): void => {
          const done = pending.get(event.data.id);
          pending.delete(event.data.id);
          idle.push(born);
          done?.(event.data.buffer);
          feed();
        };
        worker = born;
      }
      const next = waiting.shift()!;
      pending.set(next.request.id, next.done);
      worker.postMessage(next.request);
    }
  };

  return (layer, theme) =>
    new Promise<Float32Array>((done) => {
      waiting.push({ request: { id: nextId++, layer, rate: SAMPLE_RATE, theme }, done });
      feed();
    });
}
