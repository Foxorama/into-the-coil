/**
 * The corridor a level is flown down, as a shape the simulation can ask questions of —
 * `docs/decisions/0348-the-labyrinth-is-walled.md`, and `docs/decisions/0349-the-stone-bites.md`
 * where the stone became solid.
 *
 * ⚠️ **HERE, IN `sim/`, BECAUSE THE STONE IS A RULE NOW AND NOT ONLY A PICTURE.** 0348 drew it and
 * nothing collided; 0349 lets it cost the ship, stop shots and destroy bodies, and every one of those
 * questions is asked by the frame and answered by geometry that must not depend on the renderer
 * (`docs/decisions/0015-the-layer-ladder.md`). The painter reads the same shape from here.
 *
 * ⚠️ **THE FACES ARE SAMPLED AT KNOTS, ONE PER TILE, AND READ BETWEEN THEM IN STRAIGHT LINES.** For
 * the straight corridor every knot says the same two numbers; the corridor that turns (4b's next
 * step) is the same array with different numbers in it, so nothing here changes when it does.
 */

/** A walled corridor, in world positions. Laid at a level boundary; never grown in a frame. */
export interface Corridor {
  /** The bitmap the walls are tiled from, and its tiling period in world units. */
  sprite: number;
  extent: number;
  /** World along where the walls begin and end. Outside that, there is no stone. */
  from: number;
  to: number;
  /** The across position of the near wall's tile centres and the far wall's — the painter's. */
  near: number;
  far: number;
  /**
   * The two faces at every knot, `extent` apart from `from`: `[near face, far face]` per knot, in
   * across units. Stone is below the near face and above the far one.
   */
  faces: Float64Array;
  /**
   * Openings in the walls, three numbers each: world `from`, world `to`, and the side — −1 for the
   * near wall, +1 for the far one. Written in place and never grown, so the frame allocates nothing:
   * the authored openings first, then a ring of the ones a flanking wave opens as it arrives.
   */
  passages: Float64Array;
  /** How many of `passages` are authored, and which runtime slot a flank writes next. */
  fixed: number;
  next: number;
}

/**
 * Where the face on `side` stands at `along`, in across units — or the far side of the world where
 * the corridor is not, so nothing outside it is ever in stone.
 */
export function faceAt(corridor: Corridor, along: number, side: number): number {
  if (along < corridor.from || along > corridor.to) return side < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  const knots = corridor.faces.length / 2;
  const t = (along - corridor.from) / corridor.extent;
  const i = Math.min(knots - 2, Math.max(0, Math.floor(t)));
  const f = Math.min(1, t - i);
  const slot = side < 0 ? 0 : 1;
  const a = corridor.faces[i * 2 + slot]!;
  const b = corridor.faces[(i + 1) * 2 + slot]!;
  return a + (b - a) * f;
}

/** Whether a stretch of wall from `a` to `b` on `side` falls in any opening. */
export function opened(passages: Float64Array, a: number, b: number, side: number): boolean {
  for (let i = 0; i + 2 < passages.length; i += 3) {
    if (passages[i + 2] === side && a < passages[i + 1]! && b > passages[i]!) return true;
  }
  return false;
}

/**
 * Which wall a body of `radius` at (`along`, `across`) is in: −1 the near, +1 the far, 0 neither.
 *
 * ⚠️ **AN OPENING IS NOT STONE**, so a flanker coming through its own passage (0348) is in neither —
 * which is the whole reason a passage is opened. The stretch tested is the body's own, along.
 */
export function stoneAt(corridor: Corridor | null, along: number, across: number, radius: number): number {
  if (corridor === null) return 0;
  if (across - radius < faceAt(corridor, along, -1) && !opened(corridor.passages, along - radius, along + radius, -1)) return -1;
  if (across + radius > faceAt(corridor, along, 1) && !opened(corridor.passages, along - radius, along + radius, 1)) return 1;
  return 0;
}

/** How far apart the points are that a line of sight is tested at, in world units. */
const SIGHT_STEP = 2;

/**
 * Whether nothing but air lies on the straight line between two points — `docs/decisions/0349`: a
 * chain of lightning cannot jump through stone, and a blast does not reach round a wall.
 *
 * ⚠️ **SAMPLED, EVERY TWO UNITS, AND THAT IS A RESOLUTION RATHER THAN AN APPROXIMATION TO HIDE.** The
 * thinnest stone the corridor draws is a tile, twelve units, so a line cannot pass through one
 * between two samples. Nothing allocates.
 */
export function clearLine(corridor: Corridor | null, along1: number, across1: number, along2: number, across2: number): boolean {
  if (corridor === null) return true;
  const length = Math.hypot(along2 - along1, across2 - across1);
  const steps = Math.max(1, Math.ceil(length / SIGHT_STEP));
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    if (stoneAt(corridor, along1 + (along2 - along1) * t, across1 + (across2 - across1) * t, 0) !== 0) return false;
  }
  return true;
}
