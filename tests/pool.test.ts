/**
 * The entity pool, and the projection that turns its contents into screen positions.
 *
 * The pool's contract is narrow and every part of it is a trap someone falls into once:
 * `spawn` hands back a DIRTY object, `releaseAt` REORDERS, and a full pool returns `null` rather
 * than growing. All three are asserted here rather than described in a comment nobody re-reads.
 *
 * The projection half is `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`'s handedness rule
 * made executable — and the portrait sign is the one thing in this repo that cannot be caught by
 * looking at it on the machine it was written on.
 */

import { describe, expect, it } from 'vitest';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { type Entity, makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import { paintScene } from '../src/render/scene.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { sprite } from './bodies.ts';

/** Remembers where the last blit landed. Enough to ask the painter where it thinks things are. */
class RecordingSurface implements Surface {
  x = Number.NaN;
  y = Number.NaN;
  clear(): void {}
  blit(_sprite: number, x: number, y: number, _scale: number): void {
    this.x = x;
    this.y = y;
  }
}

const pooled = (capacity: number): Pool<Entity> => new Pool<Entity>(capacity, makeEntity);

describe('the pool is a fixed set of objects that are handed round', () => {
  it('builds every slot up front and never builds another', () => {
    let built = 0;
    const pool = new Pool<Entity>(8, () => {
      built++;
      return makeEntity();
    });
    expect(built).toBe(8);
    for (let i = 0; i < 8; i++) pool.spawn();
    pool.clear();
    for (let i = 0; i < 8; i++) pool.spawn();
    expect(built, 'the pool built something after construction').toBe(8);
  });

  it('refuses rather than grows when it is full', () => {
    const pool = pooled(3);
    expect(pool.spawn()).not.toBe(null);
    expect(pool.spawn()).not.toBe(null);
    expect(pool.spawn()).not.toBe(null);
    expect(pool.spawn(), 'the pool grew at the densest moment of the game').toBe(null);
    expect(pool.capacity).toBe(3);
  });

  it('hands back a DIRTY slot, which is why reset exists', () => {
    // Not a defect — recycling the object is the entire point. It is asserted so that nobody
    // "fixes" it by clearing on release, which would put the work back in the frame.
    const pool = pooled(1);
    const first = pool.spawn()!;
    reset(first, 42, 7, sprite(3));
    pool.releaseAt(0);
    const again = pool.spawn()!;
    expect(again, 'a different object came back — the pool is allocating').toBe(first);
    expect(again.along, 'the slot was cleared on release, which is work in the wrong place').toBe(42);
  });

  it('keeps live items packed with no holes', () => {
    const pool = pooled(5);
    for (let i = 0; i < 5; i++) reset(pool.spawn()!, i, 0, sprite(i));
    pool.releaseAt(1);
    expect(pool.size).toBe(4);
    const sprites: number[] = [];
    for (let i = 0; i < pool.size; i++) sprites.push(pool.at(i).sprite);
    expect(sprites.length).toBe(4);
    expect(sprites).not.toContain(1);
  });

  it('REORDERS on release, and the last live item is what moves', () => {
    const pool = pooled(4);
    for (let i = 0; i < 4; i++) reset(pool.spawn()!, i, 0, sprite(i));
    pool.releaseAt(0);
    expect(pool.at(0).sprite, 'release did not swap the tail into the hole').toBe(3);
  });

  it('ignores a release outside the live range instead of corrupting itself', () => {
    const pool = pooled(2);
    reset(pool.spawn()!, 0, 0, sprite(0));
    pool.releaseAt(5);
    pool.releaseAt(-1);
    expect(pool.size).toBe(1);
  });

  it('refuses a capacity that is not a positive integer', () => {
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => new Pool<Entity>(bad, makeEntity), `capacity ${bad} was accepted`).toThrow();
    }
  });
});

describe('a step carries the previous position forward', () => {
  it('leaves prev where the entity was, so the renderer has something to interpolate from', () => {
    const pool = pooled(1);
    const e = pool.spawn()!;
    reset(e, 100, 50, sprite(0));
    e.velAlong = 2;
    e.velAcross = -1;
    stepEntities(pool, 0);
    expect(e.prevAlong).toBe(100);
    expect(e.prevAcross).toBe(50);
    expect(e.along).toBe(102);
    expect(e.across).toBe(49);
  });

  it('retires everything that has fallen behind the camera, and nothing that has not', () => {
    const pool = pooled(3);
    reset(pool.spawn()!, 1000, 0, sprite(1)); // well ahead
    reset(pool.spawn()!, 0, 0, sprite(2)); // far behind
    reset(pool.spawn()!, 995, 0, sprite(3)); // just behind the camera, inside the margin
    stepEntities(pool, 1000);
    const sprites: number[] = [];
    for (let i = 0; i < pool.size; i++) sprites.push(pool.at(i).sprite);
    expect(sprites).toContain(1);
    expect(sprites, 'an entity inside the cull margin was retired early').toContain(3);
    expect(sprites, 'an entity far behind the camera is still being stepped and drawn').not.toContain(2);
  });

  it('retires every expired entity in one pass, however many there are', () => {
    // The forwards-iteration bug: releasing while walking forwards skips the swapped-in item, so
    // roughly half of them survive a frame they should not have.
    const pool = pooled(50);
    for (let i = 0; i < 50; i++) reset(pool.spawn()!, 0, 0, sprite(i));
    stepEntities(pool, 10_000);
    expect(pool.size, 'entities that should have been culled survived the pass').toBe(0);
  });
});

describe('the painter draws between the last two steps', () => {
  it('draws at the previous position at alpha 0 and the current one at alpha 1', () => {
    // Interpolation is what turns a 60Hz simulation into 144 distinct frames. A painter that drew
    // the current position and ignored alpha would look perfect at exactly 60Hz and judder
    // everywhere else — which is to say, fine on the machine it was written on.
    const view = viewOf(1920, 1080);
    const pool = pooled(1);
    const e = pool.spawn()!;
    reset(e, 100, 20, sprite(0));
    e.along = 110;
    e.across = 30;

    const surface = new RecordingSurface();
    paintScene(surface, view, [pool], 0, 0);
    expect(surface.x).toBeCloseTo(screenX(view, 100, 20), 6);
    expect(surface.y).toBeCloseTo(screenY(view, 100, 20), 6);

    paintScene(surface, view, [pool], 0, 1);
    expect(surface.x, 'the painter ignored alpha').toBeCloseTo(screenX(view, 110, 30), 6);

    paintScene(surface, view, [pool], 0, 0.5);
    expect(surface.x).toBeCloseTo(screenX(view, 105, 25), 6);
  });

  it('draws relative to the camera, so a moving camera moves the world past a still entity', () => {
    const view = viewOf(1920, 1080);
    const pool = pooled(1);
    reset(pool.spawn()!, 500, 50, sprite(0));
    const surface = new RecordingSurface();
    paintScene(surface, view, [pool], 400, 1);
    const near = surface.x;
    paintScene(surface, view, [pool], 450, 1);
    expect(surface.x, 'the camera advanced and the world did not move').toBeLessThan(near);
  });
});

describe('the projection is 0023 handedness, made executable', () => {
  it('runs along to the RIGHT and across DOWN in landscape', () => {
    const view = viewOf(1920, 1080);
    expect(screenX(view, 100, 50)).toBeGreaterThan(screenX(view, 0, 50));
    expect(screenY(view, 50, 100)).toBeGreaterThan(screenY(view, 50, 0));
  });

  it('runs along UP and across RIGHT in portrait — the sign nobody catches by looking', () => {
    // The leading edge, where the level arrives from, is the TOP of a portrait screen. Get this
    // backwards and the game scrolls the wrong way, on a device the developer is not holding.
    const view = viewOf(1080, 1920);
    expect(screenY(view, 100, 50), 'portrait scrolls backwards').toBeLessThan(screenY(view, 0, 50));
    expect(screenX(view, 50, 100)).toBeGreaterThan(screenX(view, 50, 0));
  });

  it('puts the corners of the view on the corners of the play field, in both orientations', () => {
    for (const [w, h] of [
      [1920, 1080],
      [1080, 1920],
      [2400, 1080],
      [2048, 1536],
    ]) {
      const view = viewOf(w!, h!);
      const long = Math.max(w!, h!);
      const short = Math.min(w!, h!);
      const xs = [screenX(view, 0, 0), screenX(view, view.alongSpan, ACROSS_SPAN)];
      const ys = [screenY(view, 0, 0), screenY(view, view.alongSpan, ACROSS_SPAN)];
      for (const x of xs) {
        expect(x).toBeGreaterThanOrEqual(-1e-6);
        expect(x).toBeLessThanOrEqual(w! + 1e-6);
      }
      for (const y of ys) {
        expect(y).toBeGreaterThanOrEqual(-1e-6);
        expect(y).toBeLessThanOrEqual(h! + 1e-6);
      }
      // The play field spans the whole of the short axis, gutters aside, in either orientation.
      const acrossPixels = Math.abs(
        (view.alongAxis === 'x' ? screenY(view, 0, ACROSS_SPAN) - screenY(view, 0, 0) : screenX(view, 0, ACROSS_SPAN) - screenX(view, 0, 0)),
      );
      expect(acrossPixels).toBeCloseTo(short - 2 * view.gutterAcross, 6);
      expect(long).toBeGreaterThan(0);
    }
  });

  it('scales one unit to the same number of pixels on both axes', () => {
    // A non-uniform scale would make a circular hitbox an ellipse on screen, which is the kind of
    // thing that is argued about for a week before anyone measures it.
    const view = viewOf(2400, 1080);
    const alongPerUnit = screenX(view, 1, 0) - screenX(view, 0, 0);
    const acrossPerUnit = screenY(view, 0, 1) - screenY(view, 0, 0);
    expect(alongPerUnit).toBeCloseTo(acrossPerUnit, 9);
    expect(alongPerUnit).toBeCloseTo(view.scale, 9);
  });
});
