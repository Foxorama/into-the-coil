import { describe, it, expect } from 'vitest';
import { makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { makeIntent, type Intent } from '../src/sim/intent.ts';
import { flyShip, holdStation, PLAYER_ALONG_SPAN, PLAYER_MARGIN, SHIP_SPEED } from '../src/sim/flight.ts';
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

/** A ship at rest in the camera's frame, which is what every composer places one as. */
function ship(along = 50, across = 50) {
  const e = makeEntity();
  reset(e, along, across, sprite(0));
  holdStation(e, SCROLL);
  return e;
}

/**
 * Fly with one unchanging ask until the velocity has stopped changing.
 *
 * ⚠️ **Every shape assertion below used to read the velocity after ONE step, and that was the same
 * assertion before inertia landed** — velocity was the ask, so one step *was* settled. It no longer
 * is, and the honest rewrite is to say *once settled* rather than to weaken what is claimed: a
 * diagonal is still not faster than a straight line, a half-deflection is still not rounded up, and
 * both are still true at any `SHIP_SPEED` and any `FLIGHT_RESPONSE`.
 *
 * 200 steps is far past the point of measurable change at any response above about 0.05.
 */
function settled(e: ReturnType<typeof ship>, intent: Intent, steps = 200) {
  for (let i = 0; i < steps; i++) flyShip(e, intent, 0, SCROLL);
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
  it('THE ONE INERTIA MUST NOT BREAK: a ship asking for nothing keeps the scroll rate exactly', () => {
    /*
      What this catches is the scroll baseline being dropped from the TARGET — writing the mass as
      `vel → ask` instead of `vel → scroll + ask`. Then a ship asking for nothing decelerates to zero
      and falls off the back of the world over a few seconds, which is a bug the ramp would hide for
      long enough to look like something else.

      ⚠️ **An earlier version of this test claimed to catch something it could not**, and the comment
      is kept because the mistake is the interesting part. It said the mass had to be applied to the
      *departure* from the scroll rate rather than to the whole velocity, or the ship would drift
      up-lane permanently. Those two forms are the same expression — exponential approach is affine —
      so the assertion passed under both and proved nothing. The real hazard is the velocity a ship
      STARTS at, and it is `holdStation` that answers it;
      `tests/interpolation.test.ts` is where it actually bites.
      `docs/decisions/0037-the-ship-has-mass.md`.
    */
    const e = ship();
    for (let i = 0; i < 200; i++) {
      flyShip(e, ask(0, 0), 0, SCROLL);
      expect(e.velAlong, `drifted off station on step ${i}`).toBeCloseTo(SCROLL, 12);
      expect(e.velAcross).toBeCloseTo(0, 12);
    }
  });

  it('reaches full speed on a single axis, once it has got there', () => {
    const e = settled(ship(), ask(0, 1));
    expect(e.velAcross).toBeCloseTo(SHIP_SPEED, 10);
  });

  it('departs from the scroll rate rather than replacing it', () => {
    const e = settled(ship(), ask(1, 0));
    expect(e.velAlong).toBeCloseTo(SCROLL + SHIP_SPEED, 10);
  });

  it('honours a partial deflection, so an analog stick is not quietly rounded up', () => {
    const e = settled(ship(), ask(0, 0.5));
    expect(e.velAcross).toBeCloseTo(SHIP_SPEED * 0.5, 10);
  });
});

describe('the ship has mass', () => {
  it('THE ONE: it does not arrive at full speed on the step it is asked', () => {
    // The whole reversal, in one assertion. Before this, velocity WAS the ask and this was equality.
    const e = ship();
    flyShip(e, ask(0, 1), 0, SCROLL);
    expect(e.velAcross, 'the ship reached full speed instantly — there is no mass').toBeLessThan(SHIP_SPEED);
    expect(e.velAcross, 'the ship did not move at all — this is a stall, not inertia').toBeGreaterThan(0);
  });

  it('and it does not stop on the step the ask does', () => {
    // The other half, and the one a player calls the run-on. Both come from the same constant.
    const e = settled(ship(), ask(0, 1));
    flyShip(e, ask(0, 0), 0, SCROLL);
    expect(e.velAcross, 'the ship stopped dead — that is the arcade answer, not this one').toBeGreaterThan(0);
    expect(e.velAcross).toBeLessThan(SHIP_SPEED);
  });

  it('settles rather than oscillating, which is what makes it mass and not a spring', () => {
    /*
      A response above 1 overshoots and rings; at exactly 1 it snaps. Neither is what a ship with
      mass does, and a ringing ship is a control that fights the hand. Asserted as a PROPERTY — the
      gap to the target only ever shrinks — rather than as a value, so it holds at any response the
      next tuning pass picks inside the range.
    */
    const e = ship();
    const target = SHIP_SPEED;
    let gap = target;
    for (let i = 0; i < 60; i++) {
      flyShip(e, ask(0, 1), 0, SCROLL);
      const next = Math.abs(target - e.velAcross);
      expect(next, `the gap grew on step ${i} — the response is overshooting`).toBeLessThanOrEqual(gap + 1e-12);
      expect(e.velAcross, 'the ship overshot its own top speed').toBeLessThanOrEqual(target + 1e-12);
      gap = next;
    }
  });

  it('is the same mass whatever asked for the movement', () => {
    // 0032: a control scheme is a preference, never a difficulty setting. The mass is on the SHIP, so
    // an identical `Intent` from a key, a thumb or a stick produces an identical velocity.
    const a = settled(ship(), ask(0, 0.7), 12);
    const b = settled(ship(), ask(0, 0.7), 12);
    expect(a.velAcross).toBe(b.velAcross);
  });
});

describe('a diagonal is not a shortcut', () => {
  it('THE ONE: holding two directions is no faster than holding one', () => {
    // (1,1) has length 1.414. Unnormalised, the ship crosses the field 41% faster on the diagonal,
    // for free, forever — and nothing throws, nothing looks wrong in review, and no other test here
    // would notice.
    const straight = ship();
    settled(straight, ask(0, 1));
    const diagonal = ship();
    settled(diagonal, ask(1, 1));
    expect(askedSpeed(diagonal)).toBeCloseTo(askedSpeed(straight), 10);
  });

  it('is no faster on any of the four diagonals', () => {
    const base = ship();
    settled(base, ask(1, 0));
    const want = askedSpeed(base);
    for (const [a, c] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      const e = ship();
      settled(e, ask(a, c));
      expect(askedSpeed(e), `diagonal ${a},${c} is not the same speed as a straight line`).toBeCloseTo(want, 10);
    }
  });

  it('does not rescale a short vector UP to full speed', () => {
    // Normalising unconditionally is the obvious fix for the diagonal bug and it is the wrong one:
    // it turns a stick at 30% into a stick at 100% and deletes analog control entirely.
    const e = ship();
    settled(e, ask(0.3, 0.3));
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
