import { describe, it, expect } from 'vitest';
import { makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { makeIntent, type Intent } from '../src/sim/intent.ts';
import { flyShip, PLAYER_ALONG_SPAN, PLAYER_MARGIN, SHIP_SPEED } from '../src/sim/flight.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { Pool } from '../src/sim/pool.ts';
import { sprite } from './bodies.ts';

/**
 * HOW AN INTENT BECOMES MOVEMENT.
 *
 * See `docs/decisions/0030-input-is-actions-and-needs-no-new-layer.md` for where the intent comes
 * from, and `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md` for the box it moves inside.
 *
 * ⚠️ **These assert SHAPE, never feel.** `SHIP_SPEED` is a starting point rather than a measurement,
 * and nothing here pins its value — a test that did would be
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`'s exact failure: a guess hardened into a
 * constraint that every later tuning pass has to route around. What is asserted is that a diagonal
 * is not faster than a straight line, that the box is the same on every device, and that the
 * interpolation contract survives — all three true at any speed.
 */

const SCROLL = 0.6;

function ship(along = 50, across = 50) {
  const e = makeEntity();
  reset(e, along, across, sprite(0));
  return e;
}

function ask(along: number, across: number): Intent {
  const intent = makeIntent(2);
  intent.along = along;
  intent.across = across;
  return intent;
}

/** Distance the ship would travel this step, ignoring the camera's own scroll. */
function askedSpeed(e: { velAlong: number; velAcross: number }): number {
  return Math.hypot(e.velAlong - SCROLL, e.velAcross);
}

describe('the ship goes where it is asked', () => {
  it('holds station when nothing is asked for', () => {
    const e = ship();
    flyShip(e, ask(0, 0), 0, SCROLL);
    // Station-keeping is carrying the camera's own rate, not zero — the world moves, the ship does not.
    expect(e.velAlong).toBeCloseTo(SCROLL, 10);
    expect(e.velAcross).toBe(0);
  });

  it('moves across at full speed on a single axis', () => {
    const e = ship();
    flyShip(e, ask(0, 1), 0, SCROLL);
    expect(e.velAcross).toBeCloseTo(SHIP_SPEED, 10);
  });

  it('departs from the scroll rate rather than replacing it', () => {
    const e = ship();
    flyShip(e, ask(1, 0), 0, SCROLL);
    expect(e.velAlong).toBeCloseTo(SCROLL + SHIP_SPEED, 10);
  });

  it('honours a partial deflection, so an analog stick is not quietly rounded up', () => {
    const e = ship();
    flyShip(e, ask(0, 0.5), 0, SCROLL);
    expect(e.velAcross).toBeCloseTo(SHIP_SPEED * 0.5, 10);
  });
});

describe('a diagonal is not a shortcut', () => {
  it('THE ONE: holding two directions is no faster than holding one', () => {
    // (1,1) has length 1.414. Unnormalised, the ship crosses the field 41% faster on the diagonal,
    // for free, forever — and nothing throws, nothing looks wrong in review, and no other test here
    // would notice.
    const straight = ship();
    flyShip(straight, ask(0, 1), 0, SCROLL);
    const diagonal = ship();
    flyShip(diagonal, ask(1, 1), 0, SCROLL);
    expect(askedSpeed(diagonal)).toBeCloseTo(askedSpeed(straight), 10);
  });

  it('is no faster on any of the four diagonals', () => {
    const base = ship();
    flyShip(base, ask(1, 0), 0, SCROLL);
    const want = askedSpeed(base);
    for (const [a, c] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      const e = ship();
      flyShip(e, ask(a, c), 0, SCROLL);
      expect(askedSpeed(e), `diagonal ${a},${c} is not the same speed as a straight line`).toBeCloseTo(want, 10);
    }
  });

  it('does not rescale a short vector UP to full speed', () => {
    // Normalising unconditionally is the obvious fix for the diagonal bug and it is the wrong one:
    // it turns a stick at 30% into a stick at 100% and deletes analog control entirely.
    const e = ship();
    flyShip(e, ask(0.3, 0.3), 0, SCROLL);
    expect(askedSpeed(e)).toBeLessThan(SHIP_SPEED);
  });
});

describe('the box is the same on every device', () => {
  it('cannot be pushed past the leading edge of the player box', () => {
    const e = ship(PLAYER_ALONG_SPAN, 50);
    for (let i = 0; i < 200; i++) {
      flyShip(e, ask(1, 0), 0, SCROLL);
      e.along += e.velAlong;
    }
    expect(e.along).toBeLessThanOrEqual(PLAYER_ALONG_SPAN - PLAYER_MARGIN + 1e-9);
  });

  it('cannot be pushed back through the camera', () => {
    const e = ship(10, 50);
    for (let i = 0; i < 200; i++) {
      flyShip(e, ask(-1, 0), 0, SCROLL);
      e.along += e.velAlong;
    }
    expect(e.along).toBeGreaterThanOrEqual(PLAYER_MARGIN - 1e-9);
  });

  it('stays inside the dodge lane at both edges', () => {
    for (const [start, dir] of [
      [5, -1],
      [95, 1],
    ] as const) {
      const e = ship(50, start);
      for (let i = 0; i < 200; i++) {
        flyShip(e, ask(0, dir), 0, SCROLL);
        e.across += e.velAcross;
      }
      expect(e.across).toBeGreaterThanOrEqual(PLAYER_MARGIN - 1e-9);
      expect(e.across).toBeLessThanOrEqual(ACROSS_SPAN - PLAYER_MARGIN + 1e-9);
    }
  });

  it('the box travels with the camera, so retreat distance never grows', () => {
    const e = ship(100, 50);
    let camera = 100;
    for (let i = 0; i < 300; i++) {
      camera += SCROLL;
      flyShip(e, ask(-1, 0), camera, SCROLL);
      e.along += e.velAlong;
      expect(e.along).toBeGreaterThanOrEqual(camera + PLAYER_MARGIN - 1e-9);
    }
  });

  it('is measured against the NARROWEST view, so a 21:9 buys lookahead and not room', () => {
    // 0023 fixes the dodge lane so difficulty does not vary with the screen. Sizing the player's box
    // off the current view would undo that on the other axis: a 240-unit view would hand its player
    // 60% more room to retreat into than a 150-unit one.
    expect(PLAYER_ALONG_SPAN).toBe(150);
  });
});

describe('the interpolation contract survives', () => {
  it('sets velocity and never position, so the renderer still has a prev to draw from', () => {
    const e = ship(50, 50);
    const before = { along: e.along, across: e.across };
    flyShip(e, ask(1, 1), 0, SCROLL);
    expect(e.along).toBe(before.along);
    expect(e.across).toBe(before.across);
  });

  it('leaves prev one step behind after a real step, even when clamped at a wall', () => {
    // Clamping by moving the ship would break this: `prev` would be on one side of the wall and the
    // position on the other, and the renderer would draw a frame of teleport at every refresh rate
    // that is not exactly 60Hz.
    const pool = new Pool(4, makeEntity);
    const e = pool.spawn()!;
    reset(e, 50, ACROSS_SPAN - PLAYER_MARGIN, sprite(0));
    for (let i = 0; i < 5; i++) {
      flyShip(e, ask(0, 1), 0, SCROLL);
      stepEntities(pool, 0);
      expect(Math.abs(e.across - e.prevAcross)).toBeLessThanOrEqual(SHIP_SPEED + 1e-9);
      expect(e.across).toBeLessThanOrEqual(ACROSS_SPAN - PLAYER_MARGIN + 1e-9);
    }
  });
});
