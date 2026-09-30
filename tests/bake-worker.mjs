// One thread of `tests/bakes.ts`'s pool — docs/decisions/0422-a-place-is-baked-on-every-core.md.
//
// It bakes whole LAYERS, one at a time, with the game's own `layerNotes`, and writes each into the
// shared buffer the caller handed it. A layer is the grain because its notes draw from one stream in
// order (0021) and cannot be split; two layers share nothing, so which thread bakes which changes no
// sample. `tests/bakes.test.ts` holds the pool's bytes to an in-process bake.
//
// ⚠️ PLAIN NODE, NOT VITEST. The source is loaded by Node's own type stripping, from this tree —
// so a probe's edit to `src/` is what this thread bakes, exactly as a new vitest would.

import { workerData } from 'node:worker_threads';

const { rate, jobs, next, status } = workerData;
const counter = new Int32Array(next);
const done = new Int32Array(status);

/*
  ⚠️ A SOURCE THAT DOES NOT LOAD FAILS EVERY JOB NOBODY HAS TAKEN, AT ONCE. The caller cannot hear a
  thread exit while it waits, so a thread that died here would leave it blocked until its deadline —
  ten minutes, for a probe whose break is a syntax error. Marked failed, each is baked again in the
  caller's own thread, which throws the same error with our stack.
*/
let layerNotes;
try {
  ({ layerNotes } = await import(new URL('../src/app/music.ts', import.meta.url).href));
} catch (e) {
  for (;;) {
    const j = Atomics.add(counter, 0, 1);
    if (j >= jobs.length) break;
    Atomics.store(done, j, 2);
    Atomics.notify(done, j);
  }
  throw e;
}

for (;;) {
  const j = Atomics.add(counter, 0, 1);
  if (j >= jobs.length) break;
  const { layer, theme, shared } = jobs[j];
  let state = 2;
  try {
    const { buffer, notes } = layerNotes(layer, rate, theme ?? undefined);
    for (const note of notes) note();
    const into = new Float32Array(shared);
    if (into.length !== buffer.length) throw new Error(`${theme ?? 'base'}/${layer}: ${buffer.length} samples for a slot of ${into.length}`);
    into.set(buffer);
    state = 1;
  } finally {
    // 1 is baked; 2 is a failure the caller reproduces in its own thread, so the stack is ours.
    Atomics.store(done, j, state);
    Atomics.notify(done, j);
  }
}
