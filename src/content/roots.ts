/**
 * The world tree's roots — what each piece of them is, as one description the painter draws and the
 * simulation meets. `docs/decisions/0627-the-roots-are-walls.md`.
 *
 * Played: *"Roots need to be Rootier — Roots are walls."* 0488 drew the roots in `src/render/bake.ts` as a few
 * strands each, and nothing else knew they were there: a room's pieces were scenery outside the ship's box
 * (0335). A root that is a wall has to be the SAME root to the eye and to the ship, or the player is hurt by a
 * shape they cannot see, or flies through one they can — 0036. So the strands are written here, in `content/`,
 * and `src/render/bake.ts` draws them and `src/sim/roots.ts` measures them, from this one list.
 *
 * ⚠️ **EVERY NUMBER IS IN THE PIECE'S OWN RADIUS** — the sprite frame's `r`, 0.42 of its extent — with the
 * piece lying along `+x`. `−y` is the side a room turns off the lane and `+y` the side it turns into it, so a
 * strand that reaches `+y` is a root that comes out into the fight.
 */

/** One root: a line from `from` to `to`, bowed and wandering, and how thick it is along itself. */
export interface RootStrand {
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  /** How far the middle bows to the line's left, in the piece's radius. */
  readonly bend: number;
  /** How far it wanders either side as it goes, and how many times. */
  readonly wave: number;
  readonly waves: number;
  /**
   * Its thickness, whole across, at its start and at its end, in the piece's radius. `taper` thins toward the
   * end, fastest at the tip; `lying` is thick in the middle and thinner at both ends, as a root along the
   * ground between two places.
   */
  readonly width: { readonly shape: 'taper' | 'lying'; readonly most: number; readonly least: number };
}

/** The pieces a room may place. Closed — 0016: a new one is a row here, a sprite and a row in a room. */
export const ROOT_KINDS = ['rootTrunk', 'rootFork', 'rootTip'] as const;
export type RootKind = (typeof ROOT_KINDS)[number];

/** How many points a strand is laid in — fine enough that a bend reads as a curve at the shipped camera. */
export const ROOT_POINTS = 28;

const strand = (
  from: readonly [number, number],
  to: readonly [number, number],
  bend: number,
  shape: 'taper' | 'lying',
  most: number,
  least: number,
  wave = 0,
  waves = 2,
): RootStrand => ({ from, to, bend, wave, waves, width: { shape, most, least } });

/**
 * Each piece's roots — 0488, made rootier by 0627: the trunks doubled and twisted round each other, roots
 * coming off them into the lane as well as out of it, and rootlets off those. Drawn in order: the first strand
 * is the deepest, and every later one lies over it.
 */
export const ROOTS: Record<RootKind, readonly RootStrand[]> = {
  rootTrunk: [
    // Two trunks lying along the edge, twisted round each other — the one behind, then the one in front.
    strand([-1.15, -0.1], [1.15, 0.08], -0.08, 'lying', 0.26, 0.1, 0.06, 2.5),
    strand([-1.15, 0.04], [1.15, -0.04], 0.08, 'lying', 0.42, 0.16, 0.08, 2),
    // Out of the lane, behind the edge.
    strand([-0.4, -0.06], [-0.85, -0.66], -0.12, 'taper', 0.15, 0.025),
    strand([0.3, -0.08], [0.95, -0.6], 0.14, 'taper', 0.13, 0.02),
    strand([-0.02, -0.1], [0.22, -0.74], 0.08, 'taper', 0.09, 0.02),
    // Into the lane: two roots hanging out over the fight, and a rootlet off each.
    strand([-0.62, 0.12], [-0.38, 0.78], 0.16, 'taper', 0.2, 0.035, 0.04, 1.5),
    strand([0.5, 0.12], [0.92, 0.66], -0.14, 'taper', 0.17, 0.03, 0.03, 1.5),
    strand([-0.5, 0.45], [-0.78, 0.7], -0.06, 'taper', 0.07, 0.015),
    strand([0.7, 0.38], [0.6, 0.76], 0.05, 'taper', 0.06, 0.015),
  ],
  rootFork: [
    // The stem, thick, and the knuckle it splits at.
    strand([-1.15, 0.02], [-0.06, 0.0], 0.05, 'taper', 0.38, 0.28, 0.04, 1.5),
    strand([-0.22, 0.0], [0.06, 0.0], 0.0, 'lying', 0.46, 0.34),
    // Its three branches, splaying.
    strand([-0.12, -0.02], [1.04, -0.6], 0.12, 'taper', 0.26, 0.04, 0.04, 2),
    strand([-0.12, 0.02], [1.0, 0.54], -0.1, 'taper', 0.22, 0.035, 0.04, 2),
    strand([-0.08, 0.0], [1.1, 0.02], 0.06, 'taper', 0.18, 0.03, 0.05, 2.5),
    // And what comes off them.
    strand([0.44, -0.28], [0.74, -0.86], 0.08, 'taper', 0.09, 0.02),
    strand([0.5, 0.26], [0.86, 0.82], -0.08, 'taper', 0.08, 0.02),
    strand([0.62, 0.0], [0.9, -0.24], 0.05, 'taper', 0.06, 0.015),
    strand([-0.7, 0.04], [-0.55, 0.52], 0.1, 'taper', 0.1, 0.02),
  ],
  rootTip: [
    // One line bowed hard, so the curl is the root's own turn and not a second root joined on.
    strand([-1.1, 0.12], [0.62, -0.58], 0.42, 'taper', 0.34, 0.045, 0.03, 2),
    // A second, thinner, curling the other way inside it.
    strand([-1.05, 0.2], [0.2, 0.62], -0.3, 'taper', 0.2, 0.03, 0.02, 2),
    // Off to the curl's side, which is the side a room puts off the lane.
    strand([-0.45, -0.04], [-0.15, -0.62], -0.08, 'taper', 0.11, 0.02),
    strand([0.15, -0.3], [0.45, -0.82], 0.06, 'taper', 0.07, 0.015),
    strand([-0.3, 0.3], [-0.5, 0.74], 0.06, 'taper', 0.08, 0.02),
  ],
};

/** A strand's line, `ROOT_POINTS + 1` points from its start to its end, written into `out` as x, y pairs. */
export function rootLineInto(s: RootStrand, out: Float64Array, n = ROOT_POINTS): void {
  const dx = s.to[0] - s.from[0];
  const dy = s.to[1] - s.from[1];
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off = s.bend * Math.sin(Math.PI * t) + s.wave * Math.sin(2 * Math.PI * s.waves * t) * Math.sin(Math.PI * t);
    out[i * 2] = s.from[0] + dx * t + nx * off;
    out[i * 2 + 1] = s.from[1] + dy * t + ny * off;
  }
}

/** How thick a strand is, whole across, `t` of the way along it — 0 its start and 1 its end. */
export function rootWidth(s: RootStrand, t: number): number {
  const { shape, most, least } = s.width;
  if (shape === 'taper') return least + (most - least) * Math.pow(1 - t, 0.7);
  return least + (most - least) * Math.sqrt(Math.sin(Math.PI * t));
}
