/**
 * One layer of music, synthesised off the thread the game is drawn on.
 *
 * ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`, and it is what a thirty-five second bake costs.**
 * The Black Heart's own material is 6,342 notes — 35 s of synthesis where it was 5 — and
 * `bakePlace` walked it in slices on the main thread, four notes and eight milliseconds at a time, each
 * slice a dropped frame. Five seconds of that at a level boundary was survivable. Thirty-five is a level
 * that opens on the wrong music and stutters until its own arrives.
 *
 * ⚠️ **THE SAME FUNCTION, SO THE SAME SAMPLES.** `bakeLayer` makes its own generator from the layer's
 * name (`docs/decisions/0021-one-stream-per-concern.md`), so a layer baked here is bit-identical to one
 * baked on the main thread, in a test, or by `scripts/hear.mjs` — which thread did the arithmetic is not
 * an input.
 *
 * ⚠️ **INLINED INTO THE PAGE, NOT A FILE BESIDE IT** — `docs/decisions/0003-single-file-build.md`. It is
 * imported `?worker&inline`, which ships it as a blob inside `index.html`; an external worker script is
 * the same cross-origin fetch off a file path that the rule exists to avoid.
 */

import { bakeLayer } from './music.ts';
import type { MusicLayer } from '../content/music.ts';
import type { ThemeKind } from '../content/themes.ts';

export interface BakeRequest {
  readonly id: number;
  readonly layer: MusicLayer;
  readonly rate: number;
  /** The place whose version of the layer is wanted — absent is the shared composition's. */
  readonly theme: ThemeKind | undefined;
}

export interface BakeReply {
  readonly id: number;
  readonly buffer: Float32Array;
}

const scope = self as unknown as { onmessage: ((event: MessageEvent<BakeRequest>) => void) | null; postMessage(reply: BakeReply, transfer: Transferable[]): void };

scope.onmessage = (event) => {
  const { id, layer, rate, theme } = event.data;
  const buffer = bakeLayer(layer, rate, theme);
  // Transferred, not copied: a forty-two bar loop is twelve megabytes.
  scope.postMessage({ id, buffer }, [buffer.buffer]);
};
