/**
 * The frame: one clear, then one blit per live entity, interpolated.
 *
 * This is the whole of the per-frame render cost, and
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts what it does rather than how
 * long it takes. It allocates nothing, branches on nothing that varies by device, and holds no state.
 *
 * ⚠️ **A painter is never a decision.** Nothing here reads input, advances anything, or chooses what
 * exists — it draws what it is handed. That is what makes a frame reproducible from a screenshot and
 * a scrub bar, and it is the rule `docs/decisions/0015-the-layer-ladder.md` gives the layer.
 */

import type { View } from '../sim/camera.ts';
import type { Entity } from '../sim/entity.ts';
import type { Pool } from '../sim/pool.ts';
import { screenX, screenY, type Surface } from './surface.ts';

/**
 * Draw one frame.
 *
 * `alpha` is the clock's leftover fraction of a step: the entity is drawn `alpha` of the way from
 * where it was at the end of the previous step to where it is now. At `alpha` 0 that is exactly the
 * last simulated position, which is what makes a paused frame and a stepped frame agree.
 *
 * ⚠️ **`layers` is drawn in order, back to front, and the order is the caller's decision rather than
 * an accident of which pool happens to be first.** It used to be one pool, and draw order was
 * whatever the pool's packing produced — which is fine when everything on screen is debris and is
 * wrong the moment the player has to find their own ship in a crowd. `src/sim/pool.ts` already warns
 * that releasing REORDERS, so within a layer nothing may depend on order; between layers, this
 * argument is the whole statement of it.
 *
 * ⚠️ **The array is built once, at mount, and never here.** A `[shots, enemies, ship]` literal at the
 * call site would allocate sixty times a second, which is the one thing
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` scans this file for.
 */
/**
 * One layer of sky: a tile, and how fast it moves against the camera.
 *
 * ── WHY THE SKY IS NOT ENTITIES ─────────────────────────────────────────────────────────────────
 *
 * Asked for in play: *"needs a starry background or a background of some kind."*
 * `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
 *
 * ⚠️ **`CAPACITY` in `src/app/mount.ts` already totals 0022's 500-entity worst case exactly**, so a
 * starfield made of bodies would either overrun the frame budget or come out of the pools that hold
 * bullets. A tile is one baked bitmap blitted a handful of times — the pipeline 0022 already
 * describes, applied to something the size of the screen.
 *
 * ⚠️ **Built once, at mount, and never here.** A literal at the call site would allocate sixty times
 * a second, which is what `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` scans this
 * file for.
 */
export interface SkyLayer {
  /** The baked tile, as an index into the atlas. */
  sprite: number;
  /** How many world units of tile there are — the tiling period along the scroll axis. */
  extent: number;
  /**
   * How far the layer moves per unit of camera travel. `0` is painted on the glass; `1` is the world.
   *
   * ⚠️ **Strictly below 1, always.** A layer at 1 moves exactly with the world and stops being a
   * background: the player would read it as a field of objects going past at the same rate as the
   * things that can kill them.
   */
  depth: number;
}

/** The sky, back to front. Empty for a scene with none, which is what a fixture has. */
export type Sky = readonly SkyLayer[];

/**
 * One placed landmark — `docs/decisions/0203-the-rule-was-never-about-size.md`.
 *
 * ⚠️ **A `SkyLayer` HAS NO POSITION AND THIS IS THE WHOLE DIFFERENCE.** `extent` up there is a repeat
 * period, so a field is everywhere and nowhere. *"When the massive pipe organ kicks in music wise we
 * see the pillars of god going past"* is a statement about a position, and needs a type that has one.
 */
export interface Landmark {
  /** The baked bitmap, as an index into the atlas. */
  sprite: number;
  /**
   * The camera position at which it first comes into view, in world units.
   *
   * ⚠️ **WHERE IT APPEARS, NOT WHERE IT IS CENTRED**, and the difference is the entire ask. A
   * landmark is the slowest thing on screen, so at `depth` 0.08 it takes about a minute to cross —
   * centring it on the organ's bar would have it already on screen from before the level started,
   * and *"when the organ kicks in we SEE the pillars"* would be false. Authored as the moment it
   * arrives, it is true by construction.
   */
  at: number;
  /** Where across the lane its centre sits, 0 to 100. */
  lane: number;
  /** How far it moves per unit of camera travel. Below every field's, so it is furthest away. */
  depth: number;
  /** Its own width in world units, so the painter knows when it has fully arrived and fully gone. */
  extent: number;
  /**
   * How far the camera travels for one beat of it, in world units. `0` for a landmark that is still.
   *
   * ⚠️ **A LANDMARK IS THE ONLY BAKED THING IN THE GAME THAT MOVES, AND IT MOVES BY ITS SCALE.** The
   * atlas is bitmaps and nothing in `src/render/` animates one; *"a beating black heart"* needs the
   * object to change between frames, and the two ways to get that are a second baked frame — a whole
   * sprite slot, a whole second drawing to keep in step with the first — or the one number `blit`
   * already takes. It swells and settles; that IS a beat.
   *
   * ⚠️ **DRIVEN BY THE CAMERA, WHICH IS 0034's *every speed is in the camera's frame*.** There is no
   * clock in this file and adding one would give the renderer state; `cameraAlong` is already an
   * argument, already monotonic, and already what every other number on this type is measured
   * against.
   */
  beat: number;
}

/** How much bigger a landmark gets at the top of its beat. */
const BEAT_SWELL = 0.055;

/**
 * The shape of one beat, over a phase from 0 to 1.
 *
 * ⚠️ **TWO THUMPS AND THEN NOTHING, BECAUSE ONE THUMP IS A PULSING LIGHT AND NOT A HEART.** The
 * *lub-dub* is the whole recognisable signature — a strong contraction, a weaker one close behind it,
 * and then a long rest that is most of the cycle. A single sine would read as breathing.
 *
 * ⚠️ **IT REACHES ZERO AT BOTH ENDS OF THE PHASE, WHICH IS WHAT MAKES IT LOOP WITHOUT A STEP.** Both
 * triangles are clear of the wrap, so the value at phase 1 is the value at phase 0 — a discontinuity
 * here would be the object jumping a size every cycle, forever, which is the kind of thing that gets
 * reported as a rendering bug rather than as a tuning one.
 */
function beatAt(phase: number): number {
  const lub = Math.max(0, 1 - Math.abs(phase - 0.07) / 0.07);
  const dub = Math.max(0, 1 - Math.abs(phase - 0.27) / 0.06);
  return lub + dub * 0.55;
}

/** Every landmark this level places. Empty for a place whose landmark is not authored yet. */
export type Landmarks = readonly Landmark[];

const NO_LANDMARKS: Landmarks = [];

/**
 * The edge of the player's box, as a mark to tile down the lane and where to put it.
 *
 * ⚠️ **`inView` is a distance from the camera's trailing edge, not a world position, and that is the
 * whole of why the painter can be handed it.** The box is defined relative to the camera
 * (`src/sim/flight.ts`), so its edge does not move in the world — a world `along` would have to be
 * recomputed here from a camera this function is already given, which is a second description of the
 * same subtraction.
 *
 * `null` for a scene that has no box to draw, which is every fixture and every menu.
 */
export interface Bound {
  /** The baked dash, as an index into the atlas. */
  sprite: number;
  /** The tiling period down the lane, in world units. */
  extent: number;
  /** How far ahead of the camera the edge sits, in world units. */
  inView: number;
}

export function paintScene(
  surface: Surface,
  view: View,
  layers: readonly Pool<Entity>[],
  cameraAlong: number,
  alpha: number,
  sky: Sky = NO_SKY,
  bound: Bound | null = null,
  landmarks: Landmarks = NO_LANDMARKS,
  levelOrigin = 0,
): void {
  surface.clear();
  /*
    ⚠️ **BEFORE THE SKY, BECAUSE IT IS SLOWER THAN THE SKY.** A landmark's `depth` is below every
    field's — 0203 kept 0112's *slower* clause and struck only *no edge* — so drawing it after the
    star fields would put the slowest-moving thing on screen in front of faster ones, which is
    parallax inversion and reads as the object being stuck to the glass. Behind everything, moving
    least, is the one arrangement that says *far away* twice.
  */
  paintLandmarks(surface, view, cameraAlong, landmarks, levelOrigin);
  paintSky(surface, view, cameraAlong, sky);
  /*
    ⚠️ **BEHIND EVERY BODY AND IN FRONT OF THE SKY.** It is a piece of information about the rules
    rather than a thing in the world, and the one absolute in this file's draw order is that the
    player must never lose a bullet — or their own ship — behind something. Drawn last it would be a
    row of marks over the top of the lane at the exact distance the player is most likely to be
    dodging at.
  */
  paintBound(surface, view, bound);
  for (let layer = 0; layer < layers.length; layer++) {
    const entities = layers[layer]!;
    const count = entities.size;
    for (let i = 0; i < count; i++) {
      const e = entities.at(i);
      const along = e.prevAlong + (e.along - e.prevAlong) * alpha;
      const across = e.prevAcross + (e.across - e.prevAcross) * alpha;
      const inView = along - cameraAlong;
      surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);
    }
  }
}

/**
 * A scene with no sky. Module-level so the default argument allocates nothing per frame.
 *
 * ⚠️ `[]` written as a default parameter is a fresh array on every call that omits it — sixty times a
 * second, from the one file 0025 scans hardest.
 */
// @setup: one empty array for the lifetime of the module.
const NO_SKY: Sky = [];

/**
 * The edge of the player's box: one dash per tiling period, straight down the lane.
 *
 * ⚠️ **A FIXED number of blits and it does not vary with anything** — `acrossSpan / extent`, which is
 * ten on every device, because the lane is a fixed hundred units (0023) whatever the screen is doing.
 * That is the same property `paintSky` has and the same one `tests/budget.test.ts` holds it to: a
 * count that moved with the camera would be a seam the player can see travelling.
 *
 * ⚠️ **Nothing allocates.** A divide, a ceiling, and a loop over numbers.
 */
function paintBound(surface: Surface, view: View, bound: Bound | null): void {
  if (bound === null || bound.extent <= 0) return;
  const count = Math.ceil(view.acrossSpan / bound.extent);
  for (let i = 0; i < count; i++) {
    // Centred, because `blit` centres — half a period on from the mark's own edge.
    const across = i * bound.extent + bound.extent / 2;
    surface.blit(bound.sprite, screenX(view, bound.inView, across), screenY(view, bound.inView, across), view.scale);
  }
}

/**
 * The sky: each layer's tile, repeated along the scroll axis, offset by the camera and slowed.
 *
 * ⚠️ **A FIXED number of blits, and that is what makes it affordable.** The count is the view's span
 * divided by the tile's, plus one for the tile straddling the trailing edge — three or four per layer
 * on every device the clamp allows. `tests/budget.test.ts` holds that it does not vary with the
 * camera, which is the failure mode a wrapping background actually has: an off-by-one in the modulo
 * draws one extra tile on some frames and none on others, and the seam moves.
 *
 * ⚠️ **The tile is `ACROSS_SPAN` units square**, so it exactly covers the short axis and tiles on the
 * long one only. There is no seam across the lane, on any device — the gutters
 * (`src/sim/camera.ts`) are outside the world and get the space colour.
 *
 * ⚠️ **Nothing allocates.** A modulo, a divide, a ceiling and a loop over numbers.
 */
/**
 * Every landmark that is currently in view, at its own parallax rate.
 *
 * ⚠️ **NO ALLOCATION AND NO SORT.** `docs/decisions/0022-frame-rate-is-a-feature.md` and
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` — this runs every frame, and
 * `tests/budget.test.ts` scans this file. A level places one or two of these, so the loop is over a
 * list shorter than the sky's.
 */
function paintLandmarks(
  surface: Surface,
  view: View,
  cameraAlong: number,
  landmarks: Landmarks,
  levelOrigin: number,
): void {
  for (let i = 0; i < landmarks.length; i++) {
    const mark = landmarks[i]!;
    const half = mark.extent / 2;
    /*
      `at` is where the camera is when the landmark's leading edge touches the far side of the view,
      so at `cameraAlong === mark.at` it sits exactly one view-span ahead and enters. From there it
      drifts back at `depth` times the camera's rate, taking `view.alongSpan / depth` units of camera
      travel to cross — about a minute at 0.08, which is what makes it read as distance rather than
      as something going past.
    */
    /*
      ⚠️ **`levelOrigin` IS SUBTRACTED, AND LEAVING IT OUT SHIPPED IN 0203.** `at` is level-LOCAL, the
      same axis `waves` and `bossAt` use, while `cameraAlong` runs across the whole run — so comparing
      them directly puts Ember Nebula's Pillars at absolute 1299, which is somewhere in the middle of
      LEVEL ONE.

      ⚠️ **AND EVERY TEST OF IT PASSED, BECAUSE LEVEL ONE'S ORIGIN IS ZERO.** Every shot in 0203 and
      0204 was taken by temporarily moving the landmark onto level one, where local and absolute are
      the same number. The bench found it in two minutes by standing on level two —
      `docs/decisions/0205-the-bench-jumps-to-where-the-thing-is.md`.
    */
    const local = cameraAlong - levelOrigin;
    const inView = view.alongSpan + half - (local - mark.at) * mark.depth;
    // Not yet arrived, or fully gone. Both are the common case for most of a level.
    if (inView > view.alongSpan + half || inView < -half) continue;
    /*
      ⚠️ **THE DOUBLE MODULO IS DEFENCE, NOT A FIX, AND SAYING SO IS THE POINT.** `%` keeps the sign of
      its left operand, so a negative `local - mark.at` would run the beat backwards and then jump —
      the hazard `paintSky` carries the same guard for. **It cannot happen today**: `at` is where the
      landmark ARRIVES, and the `continue` above skips anything that has not, so by the time this line
      runs the difference is never negative. That was measured rather than assumed —
      `tests/places.test.ts` tried to assert the sign across the arrival and found nothing was drawn
      there at all.

      It stays because the alternative is a beat whose correctness depends on a CULLING condition four
      lines up agreeing with it, which is the kind of coupling that survives every test and breaks the
      day someone widens the view or gives a landmark a negative `at`.
    */
    const swell =
      mark.beat > 0 ? 1 + BEAT_SWELL * beatAt(((((local - mark.at) / mark.beat) % 1) + 1) % 1) : 1;
    surface.blit(mark.sprite, screenX(view, inView, mark.lane), screenY(view, inView, mark.lane), view.scale * swell);
  }
}

function paintSky(surface: Surface, view: View, cameraAlong: number, sky: Sky): void {
  for (let i = 0; i < sky.length; i++) {
    const layer = sky[i]!;
    const span = layer.extent;
    if (span <= 0) continue;
    /*
      Where the first tile's leading edge sits, in world units in view. The double modulo is not
      belt-and-braces: `%` in JavaScript keeps the sign of the left operand, so a camera that has ever
      been negative — which it is not today and which `resetScene` could make true tomorrow — would
      put the tiling off the front of the screen and leave a bar of empty space behind it.
    */
    const offset = (((cameraAlong * layer.depth) % span) + span) % span;
    const count = Math.ceil(view.alongSpan / span) + 1;
    for (let t = 0; t < count; t++) {
      // Centred, because `blit` centres — `src/render/surface.ts`. Half a tile on from its edge.
      const inView = t * span - offset + span / 2;
      const across = view.acrossSpan / 2;
      surface.blit(layer.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);
    }
  }
}
