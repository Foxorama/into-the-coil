/**
 * Where the world tree's roots are solid — `docs/decisions/0627-the-roots-are-walls.md`.
 *
 * A room's root pieces as the simulation meets them: every strand laid as a chain of capsules — a segment
 * with a half-width at each end — relative to its piece's centre, so the painter's picture and the ship's
 * wall are the same root (0036). The strands themselves are `src/content/roots.ts`'s; this layer holds only
 * the arithmetic, because `sim/` may not import content (0015), and `src/app/frame.ts` lays the numbers in.
 *
 * ⚠️ **NOTHING HERE ALLOCATES AFTER `makeRootHold`.** It is asked of every shot every step in a room, so it
 * is flat typed arrays sized once, written by `layRoom` when a fight's room is laid and read by index.
 */

/** The most pieces a room may hold, and the most capsules across all of them — sized once at mount. */
export const ROOT_HOLD_PIECES = 16;
export const ROOT_HOLD_SEGMENTS = 1600;

export interface RootHold {
  /** How many pieces are laid; nought when the fight has no roots. */
  pieces: number;
  /** Each piece's centre, along from the room's rest-plus-past and across the lane, and its reach from it. */
  readonly along: Float64Array;
  readonly across: Float64Array;
  readonly reach: Float64Array;
  /** Whether each piece is a wall, whether a falling body may break it, and whether one has. */
  readonly solid: Uint8Array;
  readonly breaks: Uint8Array;
  readonly broken: Uint8Array;
  /** Each piece's capsules, `[first, end)` into the arrays below. */
  readonly first: Int32Array;
  readonly end: Int32Array;
  /** Each capsule from the piece's centre: its two ends and the half-width at each. */
  readonly a0: Float64Array;
  readonly c0: Float64Array;
  readonly h0: Float64Array;
  readonly a1: Float64Array;
  readonly c1: Float64Array;
  readonly h1: Float64Array;
  /** How many capsules are laid across every piece. */
  segments: number;
}

/** One hold, sized once — built when the shell builds the world, and never again. */
export function makeRootHold(): RootHold {
  // @setup: the hold's arrays, sized once at mount.
  const n = (size: number): Float64Array => new Float64Array(size);
  // @setup: the hold's flags, sized once at mount.
  const flags = (size: number): Uint8Array => new Uint8Array(size);
  // @setup: the hold's piece indices, sized once at mount.
  const ints = (size: number): Int32Array => new Int32Array(size);
  const S = ROOT_HOLD_SEGMENTS;
  const P = ROOT_HOLD_PIECES;
  // @setup: the hold itself, once.
  return {
    pieces: 0,
    along: n(P),
    across: n(P),
    reach: n(P),
    solid: flags(P),
    breaks: flags(P),
    broken: flags(P),
    first: ints(P),
    end: ints(P),
    a0: n(S),
    c0: n(S),
    h0: n(S),
    a1: n(S),
    c1: n(S),
    h1: n(S),
    segments: 0,
  };
}

/** Every root gone from the hold, as a world no run has touched holds them — 0627, when a run closes. */
export function clearRootHold(hold: RootHold): void {
  hold.pieces = 0;
  hold.segments = 0;
  hold.along.fill(0);
  hold.across.fill(0);
  hold.reach.fill(0);
  hold.solid.fill(0);
  hold.breaks.fill(0);
  hold.broken.fill(0);
  hold.first.fill(0);
  hold.end.fill(0);
  hold.a0.fill(0);
  hold.c0.fill(0);
  hold.h0.fill(0);
  hold.a1.fill(0);
  hold.c1.fill(0);
  hold.h1.fill(0);
}

/**
 * Where a circle meets the roots, if it does: written into `out` as `[depth, normalAlong, normalAcross,
 * piece]` for the capsule it is deepest in, with depth nought and piece −1 when it meets none.
 *
 * `originAlong` is where the room's piece positions are measured from — its rest plus the view's past
 * (0498). `onlySolid` asks only the pieces that are walls; a falling body asks every piece that breaks.
 * The normal points out of the root, toward the circle.
 */
export function rootContact(
  hold: RootHold,
  originAlong: number,
  along: number,
  across: number,
  radius: number,
  onlySolid: boolean,
  out: Float64Array,
): void {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = -1;
  for (let p = 0; p < hold.pieces; p++) {
    if (hold.broken[p] === 1) continue;
    if (onlySolid ? hold.solid[p] === 0 : hold.breaks[p] === 0) continue;
    const pa = originAlong + hold.along[p]!;
    const pc = hold.across[p]!;
    const dx = along - pa;
    const dy = across - pc;
    const reach = hold.reach[p]! + radius;
    if (dx * dx + dy * dy > reach * reach) continue;
    for (let s = hold.first[p]!; s < hold.end[p]!; s++) {
      const ax = hold.a0[s]!;
      const ay = hold.c0[s]!;
      const bx = hold.a1[s]!;
      const by = hold.c1[s]!;
      const ex = bx - ax;
      const ey = by - ay;
      const len2 = ex * ex + ey * ey;
      let t = len2 > 0 ? ((dx - ax) * ex + (dy - ay) * ey) / len2 : 0;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
      const qx = dx - (ax + ex * t);
      const qy = dy - (ay + ey * t);
      const d = Math.sqrt(qx * qx + qy * qy);
      const half = hold.h0[s]! + (hold.h1[s]! - hold.h0[s]!) * t;
      const depth = half + radius - d;
      if (depth <= out[0]!) continue;
      out[0] = depth;
      // A circle at the very line of the root is put out across the lane, toward the nearer edge of the piece.
      out[1] = d > 1e-9 ? qx / d : 0;
      out[2] = d > 1e-9 ? qy / d : dy >= 0 ? 1 : -1;
      out[3] = p;
    }
  }
}
