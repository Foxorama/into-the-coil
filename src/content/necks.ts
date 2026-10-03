/**
 * The shape of a hydra's neck — `docs/decisions/0464-the-hydra-is-one-beast.md`, and where it bends since
 * `docs/decisions/0486-the-neck-bends.md`.
 *
 * ⚠️ **HERE AND NOT IN THE BAKE, BECAUSE THE FRAME ASKS IT TOO.** The bake draws the upper neck into the
 * head's bitmap at the knuckle, and the frame turns the head about that same knuckle every step; the frame
 * may not reach the baker (`tests/budget.test.ts`), so the one description of where a neck bends lives
 * where both can read it, as the heart's arteries do (`src/content/veins.ts`). Arithmetic only.
 */

import { BOSSES } from './bosses.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from './sprites.ts';

/** A point in a neck's own frame. */
type Pt = readonly [number, number];

/** Knots along a neck's spine — 0464: enough that the root's flare is a curve rather than a chamfer. */
export const NECK_KNOTS = 16;

/** Where a neck's spine starts, in its `r`: behind its root and into the body, so the flare is too. */
export const NECK_FROM = -0.24;

/** A neck's spine in its own frame: root on the bitmap's centre, the head's centre at `reach` on `+x`. */
export function neckSpine(reach: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= NECK_KNOTS; i++) {
    const t = i / NECK_KNOTS;
    const x = NECK_FROM + (reach - NECK_FROM) * t;
    // A gentle S, so a neck is a serpent's and not a pole: nought at both ends.
    out.push([x, 0.07 * Math.sin(t * Math.PI * 2)]);
  }
  return out;
}

/** The world size a hydra's skull is drawn at — 0384's head tile, which 0486 grew to carry the upper neck. */
export const HYDRA_SKULL = 31;

/**
 * How far a knuckle stands from its head's centre at least, in world units, past the skull's radius. Two
 * thirds is clear of every skull by more than this since the ice's neck grew to 36 (0486), and this moves
 * only the ice's knuckle, one knot down; it is the backstop for a neck drawn shorter, which `tests/hydra.test.ts`
 * also holds out of the body.
 */
const KNUCKLE_CLEAR = 3;

/** A neck's `r`: its drawing's radius in world units, a share of its tile as every drawing's is. */
function neckR(k: number): number {
  const neck = BOSSES.hydra.necks?.necks[k];
  return neck === undefined ? 1 : SPRITE_EXTENT[SPRITE_KINDS[neck.art]!] * 0.42;
}

/**
 * The knot neck `k` bends at — 0486: two thirds of the way up, or nearer the root on a neck so short that
 * two thirds would be inside its own head. `tests/hydra.test.ts` holds that it is past the body.
 */
export function hydraKnuckleOf(k: number): number {
  const neck = BOSSES.hydra.necks?.necks[k];
  if (neck === undefined) return NECK_KNOTS;
  const rn = neckR(k);
  const spine = neckSpine(neck.reach / rn);
  const [hx, hy] = spine[NECK_KNOTS]!;
  const clear = HYDRA_SKULL * 0.42 + KNUCKLE_CLEAR;
  let at = Math.round((NECK_KNOTS * 2) / 3);
  while (at > 0 && Math.hypot(spine[at]![0] - hx, spine[at]![1] - hy) * rn < clear) at--;
  return at;
}

/**
 * Where neck `k` bends and what it carries — 0486, in WORLD units in the neck's own frame at rest: its root
 * at the origin and its head's centre on `+x` at `reach`. The knuckle, and the run from it to the head's
 * centre, which the frame turns by the head's look.
 */
export function hydraJointOf(k: number): { knuckle: Pt; upper: Pt } {
  const neck = BOSSES.hydra.necks?.necks[k];
  if (neck === undefined) return { knuckle: [0, 0], upper: [0, 0] };
  const rn = neckR(k);
  const spine = neckSpine(neck.reach / rn);
  const [kx, ky] = spine[hydraKnuckleOf(k)]!;
  const [hx, hy] = spine[NECK_KNOTS]!;
  return { knuckle: [kx * rn, ky * rn], upper: [(hx - kx) * rn, (hy - ky) * rn] };
}
