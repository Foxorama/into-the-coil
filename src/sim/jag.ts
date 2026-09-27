/**
 * A jagged line, the same every time it is asked — `docs/decisions/0388-the-laser-is-jagged.md`.
 *
 * ⚠️ **ONE HASH FOR THE PICTURE AND THE HURT.** A beam's zigzag is drawn by `src/render/scene.ts`
 * and hurts in `src/app/frame.ts`, and a zigzag drawn one way and hurting another would be the lie
 * 0027 is about: a warning that shows the player where to stand and a strike that lands somewhere
 * else. So the path is not stored — nothing would hold it, and a pool moves its slots about — but
 * derived from the bolt's `spin` and `jag` by the functions here, which both sides call. The
 * lightning's flicker came from the same hash in the painter and moved here with it.
 *
 * Nothing allocates: numbers in, numbers out. On `tests/budget.test.ts`'s hot list for that reason.
 */

import type { Entity } from './entity.ts';

/** A number in [-1, 1] from three integers, the same every time it is asked. */
export function jag(seed: number, vertex: number, page: number): number {
  let h = (Math.imul(seed, 374761393) + Math.imul(vertex, 668265263) + Math.imul(page, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h & 0xffff) / 0x7fff - 1;
}

/**
 * Legs on a jagged beam. Its knots are about this many to a beam that crosses the screen, so each leg
 * is a few ship-lengths: a zigzag, not a scribble.
 */
export const BEAM_KNOTS = 12;

/**
 * The points a jagged beam's path runs through, far end first: the far end, the knots, and the mouth.
 * The painter strokes exactly these and the frame measures to the legs between them.
 */
export const BEAM_POINTS = BEAM_KNOTS + 2;

/**
 * How far along a beam its point `i` is, as a share from the far end (0) to the mouth (1).
 *
 * ⚠️ **THE KNOTS ARE SHIFTED BY A SHARE OF A LEG EVERY BEAM, OR THE SHIP ALWAYS MEETS THE SAME PLACE.**
 * A beam runs from the trailing edge to the mouth, and the ship holds station a fixed share of the way
 * up it — so on a grid of knots that never moved, the ship met every beam at the same point of a leg,
 * and a zigzag that alternates sides crosses its own line at the same point of every leg: measured
 * first, the ship met a beam swinging eighteen units within four of its straight line, beam after beam.
 * A seeded shift of up to one leg puts the crossings somewhere new each time.
 */
export function beamT(seed: number, i: number): number {
  if (i <= 0) return 0;
  if (i >= BEAM_POINTS - 1) return 1;
  const shift = (jag(seed, 97, 1) + 1) / 2;
  // And each knot moved up to a third of a leg either way, so the legs are uneven — a random zigzag
  // and not a sawtooth, which is what an evenly spaced one looked like on the bench. Two thirds of a
  // leg is the most two neighbours can close, so the order along the beam never swaps.
  const nudge = i < BEAM_POINTS - 2 ? jag(seed, i, 2) / 3 : 0;
  const t = (i - shift + nudge) / BEAM_KNOTS;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * How far off its line a jagged beam's point `i` stands, in lane units.
 *
 * ⚠️ **ALTERNATE SIDES, AND NEVER ON THE LINE.** A hash alone would put some knots a hair off the line
 * and leave runs of three on one side, which reads as a beam with a wobble; a zigzag is what was asked.
 * So the side alternates and the hash picks how far, from a fifth of the swing to all of it — wide
 * enough apart that the legs are visibly different, which with the uneven spacing is what makes it
 * random rather than regular. The far end sits where its first leg is heading; the mouth sits on the
 * line, so the beam leaves the head that fired it.
 */
export function beamOffset(seed: number, swing: number, i: number): number {
  if (swing <= 0 || i >= BEAM_POINTS - 1) return 0;
  const k = i <= 0 ? 1 : i;
  const side = ((k + (seed & 1)) & 1) === 0 ? 1 : -1;
  return side * swing * (0.2 + 0.8 * Math.abs(jag(seed, k, 0)));
}

/** Where a beam's line is across the lane at `along`, on its zigzag. Off either end, the nearer end's. */
export function beamAcrossAt(b: Entity, along: number): number {
  if (b.jag <= 0 || b.fromAlong === 0) return b.across;
  const t = (along - b.along) / b.fromAlong;
  if (t <= 0) return b.across + beamOffset(b.spin, b.jag, 0);
  if (t >= 1) return b.across;
  for (let i = 1; i < BEAM_POINTS; i++) {
    const t1 = beamT(b.spin, i);
    if (t > t1) continue;
    const t0 = beamT(b.spin, i - 1);
    const f = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
    return b.across + beamOffset(b.spin, b.jag, i - 1) * (1 - f) + beamOffset(b.spin, b.jag, i) * f;
  }
  return b.across;
}

/**
 * How far a point is from a beam's line, in world units — its zigzag's nearest leg, or for a straight
 * beam its distance across. Off either end of the beam is off the beam: `Infinity`.
 *
 * ⚠️ **THE NEAREST LEG, NOT THE ACROSS AT THAT ALONG.** A leg is steep — it may cross the lane in two
 * ship-lengths — and a ship beside a steep leg is much nearer it than the across at its own along
 * says; measured that way it would be drawn inside the glow and not be hurt.
 */
export function beamDistance(b: Entity, along: number, across: number): number {
  const lo = b.fromAlong < 0 ? b.along + b.fromAlong : b.along;
  const hi = b.fromAlong < 0 ? b.along : b.along + b.fromAlong;
  if (along < lo || along > hi) return Number.POSITIVE_INFINITY;
  if (b.jag <= 0) return Math.abs(across - b.across);
  let best = Number.POSITIVE_INFINITY;
  let a0 = b.along;
  let c0 = b.across + beamOffset(b.spin, b.jag, 0);
  for (let i = 1; i < BEAM_POINTS; i++) {
    const a1 = b.along + b.fromAlong * beamT(b.spin, i);
    const c1 = b.across + beamOffset(b.spin, b.jag, i);
    const dA = a1 - a0;
    const dC = c1 - c0;
    const len2 = dA * dA + dC * dC;
    let s = len2 > 0 ? ((along - a0) * dA + (across - c0) * dC) / len2 : 0;
    s = s < 0 ? 0 : s > 1 ? 1 : s;
    const pA = a0 + dA * s - along;
    const pC = c0 + dC * s - across;
    const d = Math.sqrt(pA * pA + pC * pC);
    if (d < best) best = d;
    a0 = a1;
    c0 = c1;
  }
  return best;
}
