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
   * The corridor at rest — its authored centre and width — which a wave's `lane` is read against
   * (`laneIn`, 0350). Where the corridor turns, its faces say where it is; these say what 50 meant.
   */
  centre: number;
  width: number;
  /**
   * The two faces at every knot, `extent` apart from `from`: `[near face, far face]` per knot, in
   * across units. Stone is below the near face and above the far one.
   */
  faces: Float64Array;
  /**
   * Openings in the walls, three numbers each: world `from`, world `to`, and the side — −1 for the
   * near wall, +1 for the far one. Written in place and never grown, so the frame allocates nothing:
   * the authored openings first, then a ring of the ones a flanking wave opens as it arrives, then
   * the stone a rift has carved away (0377) — openings like any other, so every stone query and the
   * painter treat a carve as open without knowing it is one.
   */
  passages: Float64Array;
  /** How many of `passages` are authored, and which runtime slot a flank writes next. */
  fixed: number;
  next: number;
  /**
   * How many bodies this corridor's stone has destroyed — 0350. A wall kill is not the player's
   * (0349), so the kill log never hears of it, and without this nothing could tell a corridor the
   * waves ride from one they are dashed against: both look clean, because the stone removes what
   * meets it before it is drawn there.
   */
  kills: number;
  /**
   * How many knots of `faces` repeat, or nought for a corridor laid end to end — 0383. The Mire's
   * floor is one authored stretch of shore read round and round, because it has to run under a fight
   * whose length nobody knows: `to` is infinite and knot `k` is `faces[k mod period]`.
   */
  period: number;
  /**
   * The cap for each whole rise of a face across one tile, from −(n − 1)/2 to +(n − 1)/2 — the
   * painter's. The Labyrinth's masonry (0350) or the Mire's bank (0383).
   */
  caps: readonly number[];
  /**
   * Whether the wall is drawn IN FRONT of the bodies in it rather than behind them — 0383. Stone is
   * behind everything, because a body over masonry is a body in the wall; acid is in front of what is
   * in it, because a thing in acid is under its surface. Shots and the ship are over both.
   */
  front: boolean;
  /**
   * The side whose flankers rise THROUGH the wall rather than coming out of a passage cut for them —
   * +1 or −1, or nought for none — 0383. *"Rise through unbroken acid"*: while a body is still crossing
   * in from this side the wall does not take it, and no opening is cut, so the ship never finds a
   * stretch of wall that is only a picture.
   */
  rises: number;
  /** Whether a rift carves this wall (0377). Stone breaks; a lake closes over the hole — 0383. */
  carves: boolean;
  /**
   * The bed a floor lies in — 0383: the tiles of one drawing of pools, blitted in turn along the world
   * from `from`, each `bedExtent` wide and centred on the lane. Empty for stone. The painter's alone:
   * nothing collides with a pool, and what bites is the shore above it.
   */
  beds: readonly number[];
  bedExtent: number;
}

/** Which of `faces`' knots knot `k` is — itself, or its place in the repeat (0383). */
export function knotOf(corridor: Corridor, k: number): number {
  const period = corridor.period;
  return period > 0 ? ((k % period) + period) % period : k;
}

/**
 * Where the face on `side` stands at `along`, in across units — or the far side of the world where
 * the corridor is not, so nothing outside it is ever in stone.
 */
export function faceAt(corridor: Corridor, along: number, side: number): number {
  if (along < corridor.from || along > corridor.to) return side < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  const knots = corridor.faces.length / 2;
  const t = (along - corridor.from) / corridor.extent;
  // A repeating corridor has no last knot to clamp against, so its tile is wherever `t` is — 0383.
  const i = corridor.period > 0 ? Math.floor(t) : Math.min(knots - 2, Math.max(0, Math.floor(t)));
  const f = Math.min(1, t - i);
  const slot = side < 0 ? 0 : 1;
  const a = corridor.faces[knotOf(corridor, i) * 2 + slot]!;
  const b = corridor.faces[knotOf(corridor, i + 1) * 2 + slot]!;
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
 * which is the whole reason a passage is opened.
 *
 * ⚠️ **TILE BY TILE, BECAUSE THAT IS HOW THE STONE IS DRAWN — 0350.** The painter drops a whole tile
 * for an opening that touches it, and draws every other tile to its edges. The first version asked
 * whether the body's stretch touched an opening *anywhere*, so a sower half over the tile before a
 * passage was clear to the simulation and drawn over the stone — `tests/corridor.test.ts`, flying the
 * turning corridor, counted fifty-three sightings. Each tile the body spans is asked on its own now:
 * is it opened, and if not, is the body past the face within it.
 */
export function stoneAt(corridor: Corridor | null, along: number, across: number, radius: number): number {
  if (corridor === null || along + radius < corridor.from || along - radius > corridor.to) return 0;
  const extent = corridor.extent;
  const first = Math.floor((along - radius - corridor.from) / extent);
  const last = Math.floor((along + radius - corridor.from) / extent);
  for (let t = first; t <= last; t++) {
    const a = corridor.from + t * extent;
    const b = a + extent;
    // The face at the part of the body nearest that tile.
    const at = Math.max(a, Math.min(b, along));
    if (across - radius < faceAt(corridor, at, -1) && !opened(corridor.passages, a, b, -1)) return -1;
    if (across + radius > faceAt(corridor, at, 1) && !opened(corridor.passages, a, b, 1)) return 1;
  }
  return 0;
}

/**
 * The across nearest to `across` at which a body of `radius` is clear of the wall on `side` — the
 * place the stone puts back what it touched (0349's ship, 0350's pickups).
 *
 * ⚠️ **READ THE WAY `stoneAt` READS, TILE BY TILE**, so what this puts back is what `stoneAt` calls
 * clear. Standing a body off the face at its centre is not enough: where the wall slopes, the face
 * under the body's rim is up to a slope times a radius further in.
 */
export function outOfStone(corridor: Corridor, along: number, across: number, radius: number, side: number): number {
  const extent = corridor.extent;
  const first = Math.floor((along - radius - corridor.from) / extent);
  const last = Math.floor((along + radius - corridor.from) / extent);
  let out = across;
  for (let t = first; t <= last; t++) {
    const a = corridor.from + t * extent;
    const b = a + extent;
    if (opened(corridor.passages, a, b, side)) continue;
    const face = faceAt(corridor, Math.max(a, Math.min(b, along)), side);
    out = side < 0 ? Math.max(out, face + radius) : Math.min(out, face - radius);
  }
  return out;
}

/**
 * How far into the lane the face on `side` reaches anywhere from `from` to `to`, in across units from
 * the lane's own edge on that side — 0350. The wall a flanker must cross to arrive is this deep.
 */
export function deepestFace(corridor: Corridor, from: number, to: number, side: number, span: number): number {
  let deepest = Math.max(faceDepth(corridor, from, side, span), faceDepth(corridor, to, side, span));
  const first = Math.ceil((from - corridor.from) / corridor.extent);
  const last = Math.floor((to - corridor.from) / corridor.extent);
  for (let k = first; k <= last; k++) deepest = Math.max(deepest, faceDepth(corridor, corridor.from + k * corridor.extent, side, span));
  return deepest;
}

function faceDepth(corridor: Corridor, along: number, side: number, span: number): number {
  const face = faceAt(corridor, along, side);
  if (!Number.isFinite(face)) return 0;
  return side < 0 ? face : span - face;
}

/** One point of a corridor's authored shape — `CorridorRow.shape`, in level coordinates. */
export interface ShapePoint {
  readonly at: number;
  readonly swing: number;
  readonly narrow: number;
}

/**
 * Lay a corridor's faces from its authored shape, for one tier — `docs/decisions/0350-the-corridor-turns.md`.
 *
 * `centre` and `width` are the corridor at rest (the box, for the Labyrinth); `narrowest` and `slope`
 * are the tier's. Knot `k` is `k × extent` along from the corridor's start.
 *
 * ⚠️ **THE TIER'S SLOPE IS A CEILING ON EACH STEP, SO IT HOLDS BY CONSTRUCTION.** Each face moves
 * towards where the shape wants it by at most `slope × extent` a knot, so no wall anywhere is steeper
 * than the tier allows, whatever the shape asks for. The shape sets the turns; the tier caps them.
 *
 * ⚠️ **WHOLE LANE UNITS AT EVERY KNOT**, so a wall's rise across one tile is a whole number and the
 * painter needs one baked cap per whole number rather than a curve per frame.
 *
 * ⚠️ **AND NEVER NARROWER THAN THE TIER'S NARROWEST**, re-imposed after the rounding and the ceiling,
 * which could each take a unit off.
 */
export function layFaces(
  out: Float64Array,
  extent: number,
  centre: number,
  width: number,
  shape: readonly ShapePoint[] | undefined,
  narrowest: number,
  slope: number,
): void {
  const knots = out.length / 2;
  const step = Math.floor(slope * extent);
  const floor = Math.ceil(narrowest);
  const low = Math.round(centre - width / 2);
  const high = Math.round(centre + width / 2);
  for (let k = 0; k < knots; k++) {
    const at = shapeAt(shape, k * extent);
    const w = width - at.narrow * (width - narrowest);
    const c = centre + (at.swing * (width - w)) / 2;
    let near = Math.round(c - w / 2);
    let far = Math.round(c + w / 2);
    if (k > 0) {
      const lastNear = out[(k - 1) * 2]!;
      const lastFar = out[(k - 1) * 2 + 1]!;
      near = lastNear + Math.max(-step, Math.min(step, near - lastNear));
      far = lastFar + Math.max(-step, Math.min(step, far - lastFar));
    }
    if (far - near < floor) {
      // Open it back up on whichever side has room, the far wall first.
      far = Math.min(high, near + floor);
      near = far - floor;
    }
    out[k * 2] = Math.max(low, near);
    out[k * 2 + 1] = Math.min(high, far);
  }
}

/**
 * Lay a floor's faces — `docs/decisions/0383-the-mire-floor-is-a-wall.md`: the shore at every knot,
 * one knot per entry of `shore`, and a near face a whole lane beyond the top of the box.
 *
 * ⚠️ **A FLOOR HAS ONE WALL, AND THE OTHER FACE IS WHERE NOTHING EVER IS.** A flanker is put down
 * `FLANK_MARGIN` outside the lane and no body is authored bigger than `EDGE_MARGIN`, so nothing can
 * reach a lane's width above it. Written as a face rather than as *no wall* so that every question
 * the stone answers — `stoneAt`, `bandAt`, a line of sight — is the one question it already was.
 *
 * ⚠️ **NOT THROUGH `layFaces`**, because nothing about a floor is the tier's: the tiers' narrowest and
 * slope are how tight a corridor's two walls may pinch, and the shore is terrain, the same on every one.
 */
export function layShore(out: Float64Array, shore: readonly number[], beyond: number): void {
  for (let k = 0; k < shore.length; k++) {
    out[k * 2] = beyond;
    out[k * 2 + 1] = shore[k]!;
  }
}

/** The shape's swing and narrowing at `at`: a half-cosine between points, held beyond the ends. */
export function shapeAt(shape: readonly ShapePoint[] | undefined, at: number): { swing: number; narrow: number } {
  if (shape === undefined || shape.length === 0) return STRAIGHT;
  if (at <= shape[0]!.at) return shape[0]!;
  const last = shape[shape.length - 1]!;
  if (at >= last.at) return last;
  let i = 0;
  while (shape[i + 1]!.at < at) i++;
  const a = shape[i]!;
  const b = shape[i + 1]!;
  const u = (1 - Math.cos((Math.PI * (at - a.at)) / (b.at - a.at))) / 2;
  return { swing: a.swing + (b.swing - a.swing) * u, narrow: a.narrow + (b.narrow - a.narrow) * u };
}

const STRAIGHT = { swing: 0, narrow: 0 };

/**
 * The furthest across a hull of `radius` at `along` can stand on `side` without touching the wall,
 * as `stoneAt` reads the wall — stood off by the radius. The wall's geometry, not its openings: this
 * is where a body is carried, not whether it is in stone. `±Infinity` where there is no corridor.
 *
 * ⚠️ **AT ITS CENTRE AND AT EVERY KNOT ITS HULL SPANS — 0350**, because those are the places
 * `stoneAt` asks: a hull reaching over a tile boundary is asked about the face at that boundary, and
 * on a sloped wall that face is up to a slope times a radius further in than the one at its middle.
 * Read at the centre alone, the band put a hull against a face the stone then found it past.
 */
export function bandAt(corridor: Corridor, along: number, radius: number, side: number): number {
  let face = faceAt(corridor, along, side);
  const first = Math.ceil((along - radius - corridor.from) / corridor.extent);
  const last = Math.floor((along + radius - corridor.from) / corridor.extent);
  for (let k = first; k <= last; k++) {
    // `faceAt` and not the array: a knot past either end is no wall, and a repeat is read round — 0383.
    const at = faceAt(corridor, corridor.from + k * corridor.extent, side);
    face = side < 0 ? Math.max(face, at) : Math.min(face, at);
  }
  return face - side * radius;
}

/**
 * Where a hull of `radius` authored at `lane` of the corridor at rest stands at `along`, in the
 * corridor as it is there — 0350. The hull's place in the band it can occupy at rest is its place in
 * the band it can occupy here, so a wave authored for 88 units that arrives in 34 is narrower rather
 * than half in the stone.
 *
 * ⚠️ **THE BAND AND NOT THE FACES, AND THE SAME BAND `rideCorridor` AND `squeezeAt` USE.** The first
 * version mapped face to face while the ride mapped between the hull's limits; the two disagree by a
 * radius wherever the corridor is squeezed, and a weave that fitted the box by less than that was put
 * down where the ride then carried it into the wall.
 */
export function laneIn(corridor: Corridor | null, along: number, lane: number, radius: number): number {
  if (corridor === null || along < corridor.from || along > corridor.to) return lane;
  const low = heldAt(corridor, along, radius, -1);
  const high = heldAt(corridor, along, radius, 1);
  const restLow = corridor.centre - corridor.width / 2 + radius;
  const restWidth = corridor.width - radius * 2;
  if (restWidth <= 0 || high <= low) return (low + high) / 2;
  /*
    ⚠️ **A LANE OUTSIDE THE CORRIDOR AT REST IS WHERE IT WAS AUTHORED — 0383.** The Labyrinth's rest is
    the whole box, so nothing a wave is authored at is outside it. The Mire's is the lowest quarter: a floor
    bends only what flies low over it, and a wave authored above it is not the floor's to move.
  */
  if (lane < restLow || lane > restLow + restWidth) return lane;
  return low + ((lane - restLow) * (high - low)) / restWidth;
}

/**
 * `bandAt`, never wider than the corridor at rest — 0383: the band a body is read into and carried in.
 *
 * ⚠️ **THE SAME NUMBER AS `bandAt` WHEREVER BOTH WALLS ARE IN THE BOX**, which is every face the
 * Labyrinth lays (`layFaces` clamps them to it). It differs for a floor: the Mire has no near wall,
 * so its near face is a lane beyond the box, and a band read to it would put a wave authored at 50
 * a hundred units above the screen. Held to its rest — the lowest quarter of the lane, for the Mire — a
 * floor bends only what flies low over it.
 */
export function heldAt(corridor: Corridor, along: number, radius: number, side: number): number {
  const rest = corridor.centre + (side * corridor.width) / 2 - side * radius;
  const band = bandAt(corridor, along, radius, side);
  return side < 0 ? Math.max(band, rest) : Math.min(band, rest);
}

/**
 * How much narrower the hull's band is at `along` than at rest — `laneIn`'s own proportion, for a
 * motion authored across the box rather than a place in it (0350's weave). One where there is no
 * corridor.
 */
export function squeezeAt(corridor: Corridor | null, along: number, radius: number): number {
  if (corridor === null || along < corridor.from || along > corridor.to) return 1;
  const restWidth = corridor.width - radius * 2;
  if (restWidth <= 0) return 1;
  return Math.max(0, heldAt(corridor, along, radius, 1) - heldAt(corridor, along, radius, -1)) / restWidth;
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
