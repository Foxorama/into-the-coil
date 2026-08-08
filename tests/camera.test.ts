/**
 * The camera, and the difficulty-parity claim it exists to make true.
 *
 * See `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`. `docs/game.md` promises that both
 * orientations "show the same span of world and play at the same difficulty". That is a claim about
 * arithmetic, so it is checkable, and this file is where it is checked.
 *
 * ── THE DEVICE TABLE IS THE POINT ────────────────────────────────────────────────────────────────
 *
 * Every assertion below runs over real viewport sizes rather than over three tidy numbers, because
 * the interesting behaviour is entirely at the edges: the tablet that is squarer than the clamp, the
 * ultrawide that is longer than it, and the phone that must behave identically held either way. A
 * test over 1920×1080 alone would pass against a camera with no clamp in it at all.
 *
 * The table is asserted to straddle the clamp — see the last describe. A letterbox assertion that
 * happens to run over zero letterboxed devices is the "scan over an empty tree" failure from
 * `NEXT-TIME.md`, wearing a device table.
 */

import { describe, expect, it } from 'vitest';
import {
  ACROSS_SPAN,
  cullAlong,
  EDGE_MARGIN,
  MAX_ALONG_SPAN,
  MAX_ASPECT,
  MIN_ASPECT,
  REFERENCE_ASPECT,
  spawnAlong,
  viewOf,
} from '../src/sim/camera.ts';

interface Device {
  name: string;
  w: number;
  h: number;
}

/** Real viewports, in CSS pixels, landscape-side-up. Both extremes deliberately present. */
const DEVICES: Device[] = [
  { name: '5:4 monitor', w: 1280, h: 1024 },
  { name: '4:3 tablet', w: 2048, h: 1536 },
  { name: '3:2 laptop', w: 2256, h: 1504 },
  { name: '16:10 laptop', w: 1680, h: 1050 },
  { name: '16:9 monitor', w: 1920, h: 1080 },
  { name: '19.5:9 phone', w: 2532, h: 1170 },
  { name: '20:9 phone', w: 2400, h: 1080 },
  { name: '21:9 ultrawide', w: 3440, h: 1440 },
  { name: '32:9 superwide', w: 5120, h: 1440 },
];

const aspect = (d: Device): number => Math.max(d.w, d.h) / Math.min(d.w, d.h);
const inClamp = (d: Device): boolean => aspect(d) >= MIN_ASPECT && aspect(d) <= MAX_ASPECT;

/** Every device, plus each one turned on its side — orientation is never a separate code path. */
const BOTH_WAYS: Device[] = DEVICES.flatMap((d) => [d, { name: `${d.name}, turned`, w: d.h, h: d.w }]);

describe('the dodge lane is the same everywhere', () => {
  it('shows the same dodge room on every screen', () => {
    // THE difficulty assertion. `across` is how much room there is to get out of the way, and a
    // device that gets more of it is a device playing an easier game. Nothing may vary it: not
    // aspect, not orientation, not size.
    for (const d of BOTH_WAYS) {
      expect(viewOf(d.w, d.h).acrossSpan, `${d.name} sees a different dodge lane`).toBe(ACROSS_SPAN);
    }
  });

  it('shows the identical view rotated, so turning the device changes nothing but the axis', () => {
    // Aspect is long ÷ short, which is invariant under rotation — this is what makes game.md's
    // "both orientations play at the same difficulty" exactly true rather than roughly true.
    for (const d of DEVICES) {
      const flat = viewOf(d.w, d.h);
      const upright = viewOf(d.h, d.w);
      expect({ ...flat, alongAxis: null }, `${d.name} plays differently held upright`).toEqual({
        ...upright,
        alongAxis: null,
      });
      expect(flat.alongAxis).toBe('x');
      expect(upright.alongAxis).toBe('y');
    }
  });

  it('calls a square viewport landscape, because the tie has to break somewhere', () => {
    expect(viewOf(900, 900).alongAxis).toBe('x');
  });
});

describe('lookahead varies, within a stated bound', () => {
  it('clamps lookahead at both ends', () => {
    // Reaction time is difficulty too, so the widest screen must not simply be the easiest. The
    // squarest and the longest viewports in the table both land exactly on a limit.
    for (const d of BOTH_WAYS) {
      const { alongSpan } = viewOf(d.w, d.h);
      expect(alongSpan, `${d.name} sees too little ahead`).toBeGreaterThanOrEqual(ACROSS_SPAN * MIN_ASPECT);
      expect(alongSpan, `${d.name} sees further ahead than any level is authored for`).toBeLessThanOrEqual(
        MAX_ALONG_SPAN,
      );
    }
    expect(viewOf(1280, 1024).alongSpan).toBeCloseTo(ACROSS_SPAN * MIN_ASPECT, 9);
    expect(viewOf(5120, 1440).alongSpan).toBeCloseTo(MAX_ALONG_SPAN, 9);
  });

  it('never sees less ahead on a longer screen', () => {
    const spans = [...DEVICES]
      .sort((a, b) => aspect(a) - aspect(b))
      .map((d) => viewOf(d.w, d.h).alongSpan);
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i]!, 'a longer screen saw less of the world than a squarer one').toBeGreaterThanOrEqual(
        spans[i - 1]!,
      );
    }
  });

  it('authors against 16:9 — the reference view is 177.8 by 100', () => {
    const view = viewOf(1920, 1080);
    expect(view.alongSpan).toBeCloseTo(ACROSS_SPAN * REFERENCE_ASPECT, 6);
    expect(view.acrossSpan).toBe(ACROSS_SPAN);
  });
});

describe('the fit is a letterbox, never a crop and never a stretch', () => {
  it('never crops, and never stretches', () => {
    for (const d of BOTH_WAYS) {
      const v = viewOf(d.w, d.h);
      // A negative gutter is a crop: world that exists and is not on screen.
      expect(v.gutterAlong, `${d.name} crops the scroll axis`).toBeGreaterThanOrEqual(0);
      expect(v.gutterAcross, `${d.name} crops the dodge lane`).toBeGreaterThanOrEqual(0);
      // And the whole view fits, on both axes, at ONE scale.
      expect(v.alongSpan * v.scale + 2 * v.gutterAlong).toBeCloseTo(Math.max(d.w, d.h), 6);
      expect(v.acrossSpan * v.scale + 2 * v.gutterAcross).toBeCloseTo(Math.min(d.w, d.h), 6);
    }
  });

  it('puts no bars on a device inside the clamp', () => {
    for (const d of BOTH_WAYS.filter(inClamp)) {
      const v = viewOf(d.w, d.h);
      expect(v.gutterAlong, `${d.name} is inside the clamp and got bars anyway`).toBeCloseTo(0, 6);
      expect(v.gutterAcross, `${d.name} is inside the clamp and got bars anyway`).toBeCloseTo(0, 6);
    }
  });

  it('bars a squarer screen across, and a longer screen along', () => {
    // Which edges the bars land on is not cosmetic — it is where the HUD is allowed to live.
    const squarer = viewOf(2048, 1536);
    expect(squarer.gutterAcross).toBeGreaterThan(0);
    expect(squarer.gutterAlong).toBeCloseTo(0, 6);

    const longer = viewOf(5120, 1440);
    expect(longer.gutterAlong).toBeGreaterThan(0);
    expect(longer.gutterAcross).toBeCloseTo(0, 6);
  });

  it('returns a drawable view for a viewport with no size', () => {
    // A hidden tab and the first layout pass both produce these, and a NaN reaching a canvas
    // transform blanks the frame with nothing to grep for. Zero scale draws nothing, visibly.
    for (const [w, h] of [
      [0, 0],
      [1920, 0],
      [0, 1080],
      [-1920, 1080],
      [Number.NaN, 1080],
      [Number.POSITIVE_INFINITY, 1080],
    ]) {
      const v = viewOf(w!, h!);
      for (const [key, value] of Object.entries(v)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `viewOf(${w}, ${h}).${key} is not a finite number`).toBe(true);
        }
      }
      expect(v.scale, `viewOf(${w}, ${h}) would draw at a made-up scale`).toBe(0);
      expect(v.acrossSpan).toBe(ACROSS_SPAN);
    }
  });
});

describe('spawning and culling are authored against the widest view that exists', () => {
  it('puts the spawn line beyond the widest view any device can have', () => {
    // The pop-in bug, guarded: a wave placed for the authoring device appears out of nothing on a
    // longer screen. Every device, at every camera position, must find the spawn line off-screen.
    for (const cameraAlong of [0, 1, 4321.5]) {
      for (const d of BOTH_WAYS) {
        const leadingEdge = cameraAlong + viewOf(d.w, d.h).alongSpan;
        expect(
          spawnAlong(cameraAlong),
          `a wave spawned for ${d.name} would appear on screen`,
        ).toBeGreaterThan(leadingEdge + EDGE_MARGIN - 1e-9);
      }
    }
  });

  it('culls behind the camera, and the trailing edge does not vary with aspect', () => {
    expect(cullAlong(1000)).toBe(1000 - EDGE_MARGIN);
    expect(spawnAlong(1000) - 1000).toBe(MAX_ALONG_SPAN + EDGE_MARGIN);
    // Nothing may be culled while it is still on screen, on any device.
    for (const d of BOTH_WAYS) {
      expect(cullAlong(500), `${d.name} culls inside its own view`).toBeLessThan(500);
    }
  });
});

/**
 * ⚠️ THE ASSERTIONS THAT KEEP THE TABLE ABOVE FROM BEING DECORATIVE.
 *
 * Every letterbox assertion filters the device table. A filter that happens to select nothing passes
 * forever and is indistinguishable from a working one — `NEXT-TIME.md` #9, in its most ordinary
 * disguise. So the table's own shape is asserted.
 */
describe('the device table straddles the clamp, so the assertions above have work to do', () => {
  it('holds devices on both sides of the clamp and inside it', () => {
    expect(DEVICES.filter((d) => aspect(d) < MIN_ASPECT).length, 'no device is squarer than the clamp').toBeGreaterThan(
      0,
    );
    expect(DEVICES.filter((d) => aspect(d) > MAX_ASPECT).length, 'no device is longer than the clamp').toBeGreaterThan(
      0,
    );
    expect(DEVICES.filter(inClamp).length, 'no device is inside the clamp').toBeGreaterThan(3);
  });

  it('the clamp lets every phone and every 16:9-or-longer monitor through', () => {
    /*
      ⚠️ **THIS LIST USED TO INCLUDE THE 3:2 AND 16:10 LAPTOPS, AND THE PLAYER TOOK THEM OFF IT** —
      `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md`: *"let's optimise for
      desktop and we'll add a different viewport for mobile."* Raising `MIN_ASPECT` to the reference
      aspect is what extends the player's box to the screen it is drawn on, and the price is bars on
      the two squarer laptop classes. It is a price rather than an accident, so it is listed below
      rather than dropped.
    */
    for (const name of ['16:9 monitor', '19.5:9 phone', '20:9 phone', '21:9 ultrawide']) {
      const d = DEVICES.find((x) => x.name === name)!;
      expect(inClamp(d), `${name} has fallen outside the clamp and now gets bars`).toBe(true);
    }
  });

  it('bars the two laptop classes the player traded away, and nothing else that was inside', () => {
    /*
      ⚠️ **The cost, asserted rather than implied.** A trade that is only written in prose is one that
      can be quietly reversed or quietly widened — and *which devices get bars* is the whole of what
      0080 spent to buy the box. If a third class ever joins this list, that is a decision and not a
      constant edit.
    */
    const barred = DEVICES.filter((d) => !inClamp(d)).map((d) => d.name);
    expect(barred.sort()).toEqual(['16:10 laptop', '32:9 superwide', '3:2 laptop', '4:3 tablet', '5:4 monitor']);
  });
});
