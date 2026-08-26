/**
 * The two decisions the canvas backend makes that do not need a browser to check.
 *
 * The device-pixel-ratio cap and the re-bake rule are both one-line functions with a lot resting on
 * them: the cap is 0022's largest single lever on the target device, and the re-bake rule is what
 * makes 0023's "turning the device is free" true in practice rather than only in the camera maths.
 *
 * `tests/frame.browser.test.ts` drives both in a real browser. These are the same claims at unit
 * speed, which is what makes them cheap enough to probe.
 */

import { describe, expect, it } from 'vitest';
import { type Atlas, atlasIsStale, viewFor } from '../src/render/bake.ts';
import { MAX_DPR, renderScale } from '../src/render/canvas.ts';

/** An atlas with no bitmaps in it. Everything asserted below is metadata. */
const atlasAt = (view: 'side' | 'top', pixelsPerUnit: number): Atlas => ({
  view,
  // 0195 — every atlas belongs to a place. Nothing here asserts about one; the base composition's
  // own place is the honest stand-in.
  theme: 'approach',
  bitmaps: [],
  extents: [],
  pixelsPerUnit,
});

describe('the device pixel ratio is capped', () => {
  it('caps the device pixel ratio at 2', () => {
    // At DPR 3 a 1080p phone renders ~2.6M pixels a frame; capped, ~1.15M — for a difference
    // invisible on baked bitmaps. This is the single largest lever 0022 has on the target device.
    expect(renderScale(3)).toBe(MAX_DPR);
    expect(renderScale(4)).toBe(MAX_DPR);
    expect(renderScale(1_000)).toBe(MAX_DPR);
  });

  it('leaves an ordinary display exactly alone', () => {
    // The cap must cost nothing below it: DPR 2 IS full quality on a Retina display.
    expect(renderScale(1)).toBe(1);
    expect(renderScale(1.5)).toBe(1.5);
    expect(renderScale(2)).toBe(2);
  });

  it('falls back to 1 rather than producing a zero-sized backing store', () => {
    // `window.devicePixelRatio` is not guaranteed, and a 0 here is a canvas with no pixels in it.
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(renderScale(bad), `${bad} produced a bad render scale`).toBe(1);
    }
  });
});

describe('the atlas is re-baked when, and only when, it has to be', () => {
  it('rebakes when the orientation changes', () => {
    // The art faces along the scroll axis, so a rotation makes every sprite point the wrong way.
    // This is the one case that must never be optimised away.
    expect(atlasIsStale(atlasAt('side', 10), 'top', 10)).toBe(true);
    expect(atlasIsStale(atlasAt('top', 10), 'side', 10)).toBe(true);
  });

  it('does not rebake for a resize that changes nothing anyone can see', () => {
    // Every pixel of a window drag fires a resize. Re-baking the whole atlas on each one is a
    // stutter for the length of the drag.
    expect(atlasIsStale(atlasAt('side', 10), 'side', 10)).toBe(false);
    expect(atlasIsStale(atlasAt('side', 10), 'side', 11)).toBe(false);
    expect(atlasIsStale(atlasAt('side', 10), 'side', 9)).toBe(false);
  });

  it('rebakes when the resolution has moved enough to look soft', () => {
    expect(atlasIsStale(atlasAt('side', 10), 'side', 13)).toBe(true);
    expect(atlasIsStale(atlasAt('side', 10), 'side', 7)).toBe(true);
  });

  it('keeps the old atlas rather than baking at a nonsense resolution', () => {
    // A zero-sized viewport is a real state — a hidden tab, the first layout pass — and 0023 answers
    // it with `scale: 0`. Re-baking at zero would replace good art with 8px stubs.
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(atlasIsStale(atlasAt('side', 10), 'side', bad), `${bad} triggered a rebake`).toBe(false);
    }
  });

  it('asks for the view the camera axis implies', () => {
    expect(viewFor('x')).toBe('side');
    expect(viewFor('y')).toBe('top');
  });
});
