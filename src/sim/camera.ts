/**
 * The camera — how a viewport of any shape becomes a window onto the world.
 *
 * See `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`. `docs/game.md` states the rule this
 * file computes: **the long axis of the screen is always the scroll axis.** Landscape scrolls
 * horizontally and portrait scrolls vertically, and both show the same span of world.
 *
 * ── WHY THIS IS IN `sim/` AND NOT IN `render/` ───────────────────────────────────────────────────
 *
 * Because what is visible decides what SPAWNS. A wave placed just past the leading edge on one
 * device is a wave that materialises in plain sight on a wider one, and the fix — place it past the
 * widest edge any device can have — is a number the model needs before a painter exists. The visible
 * span is part of the stage contract, so it sits with the stage contract.
 *
 * What is left for `render/` is applying the result: a translate, a rotate, and the device pixel
 * ratio that decision 0022 caps at 2. This file computes in CSS pixels and never touches a canvas.
 *
 * ── THE ONE PROPERTY EVERYTHING ELSE HANGS OFF ───────────────────────────────────────────────────
 *
 * Aspect ratio is defined here as long ÷ short, which makes it **invariant under rotation**: a
 * 1080×2400 phone has the same aspect held either way. That is what makes "both orientations play at
 * the same difficulty" exactly true rather than approximately true, and it is why `viewOf` takes the
 * viewport's two dimensions rather than an orientation — a caller cannot get the invariance wrong,
 * because it never gets to say which axis is which.
 */

/**
 * World units across the scroll axis, always fully visible, on every device, in both orientations.
 *
 * This is the dodge lane, and it is the difficulty axis of a shooter — how much room there is to get
 * out of the way. It is a constant for exactly that reason. `across` runs 0 to 100 and the centreline
 * is 50.
 */
export const ACROSS_SPAN = 100;

/**
 * The aspect the levels are authored against — 16:9, so the reference view is 177.8 × 100 units.
 * Nothing enforces it at runtime; it is the number a level designer holds in their head.
 */
export const REFERENCE_ASPECT = 16 / 9;

/**
 * The clamp on lookahead, in aspect terms. Chosen against the device classes rather than for
 * roundness, and the choice is that **every phone and every ordinary laptop or monitor falls inside
 * it and gets no bars**: 3:2 (1.5), 16:10 (1.6), 16:9 (1.78), 19.5:9 (2.17), 20:9 (2.22) and 21:9
 * (2.33) are all in range.
 *
 * Outside it the excess becomes gutter, never extra world. Below: 4:3 and 5:4 tablets. Above: true
 * ultrawide, and a desktop window someone has dragged into a letterbox shape.
 */
export const MIN_ASPECT = 1.5;
export const MAX_ASPECT = 2.4;

/** The most world any device may ever see ahead. Levels are authored to be safe at this number. */
export const MAX_ALONG_SPAN = ACROSS_SPAN * MAX_ASPECT;

/**
 * Clearance beyond an edge, in world units, and simultaneously **the largest half-extent any entity
 * may be authored at**. The two are the same number by necessity: a spawn margin only hides an
 * entity if the entity fits inside it. 40 units puts the ceiling on a boss at 80 across — four fifths
 * of the dodge lane, which is a wall rather than an enemy at anything more.
 */
export const EDGE_MARGIN = 40;

/** Which axis of the viewport the scroll runs on. Derived from its shape, never configured. */
export type ScrollAxis = 'x' | 'y';

export interface View {
  /** World units visible along the scroll axis: 150 to 240, per the clamp. */
  alongSpan: number;
  /** World units visible across it. Always `ACROSS_SPAN`. */
  acrossSpan: number;
  /**
   * The viewport axis the scroll runs on — `x` for landscape, `y` for portrait. A square viewport
   * is landscape; the tie has to break somewhere and desktop is the primary target.
   */
  alongAxis: ScrollAxis;
  /**
   * CSS pixels per world unit. **Uniform**, always: one number for both axes, so a circle is a
   * circle and a hitbox radius means the same thing on every device.
   */
  scale: number;
  /** CSS pixels of gutter at EACH of the two along edges. Zero inside the clamp. */
  gutterAlong: number;
  /** CSS pixels of gutter at EACH of the two across edges. Zero inside the clamp. */
  gutterAcross: number;
}

function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n;
}

/**
 * The view for a viewport of `widthPx` × `heightPx` CSS pixels.
 *
 * A viewport with a zero or non-finite dimension is a real state — a hidden tab, the first layout
 * pass — and it returns a fully-formed reference view at `scale: 0` rather than throwing or leaking
 * a `NaN`. Nothing draws at zero scale, which is correct; a `NaN` reaching a canvas transform
 * silently blanks the frame instead, and that is the failure this avoids.
 */
export function viewOf(widthPx: number, heightPx: number): View {
  const usable =
    Number.isFinite(widthPx) && Number.isFinite(heightPx) && widthPx > 0 && heightPx > 0;
  if (!usable) {
    return {
      alongSpan: ACROSS_SPAN * REFERENCE_ASPECT,
      acrossSpan: ACROSS_SPAN,
      alongAxis: 'x',
      scale: 0,
      gutterAlong: 0,
      gutterAcross: 0,
    };
  }

  const long = Math.max(widthPx, heightPx);
  const short = Math.min(widthPx, heightPx);
  const alongSpan = ACROSS_SPAN * clamp(long / short, MIN_ASPECT, MAX_ASPECT);

  // The smaller of the two fits the whole view on screen; the larger would crop it. Taking the min
  // is what produces the letterbox, and taking it over a single `scale` is what keeps it uniform.
  const scale = Math.min(long / alongSpan, short / ACROSS_SPAN);

  return {
    alongSpan,
    acrossSpan: ACROSS_SPAN,
    alongAxis: widthPx >= heightPx ? 'x' : 'y',
    scale,
    gutterAlong: (long - alongSpan * scale) / 2,
    gutterAcross: (short - ACROSS_SPAN * scale) / 2,
  };
}

/**
 * The `along` coordinate a wave must be placed at or beyond to be off-screen, given the camera's
 * trailing edge.
 *
 * ⚠️ **`MAX_ALONG_SPAN`, not the current view.** Placing a spawn relative to what THIS device can see
 * is the pop-in bug: correct on the phone it was authored on, and on a 21:9 monitor the wave appears
 * out of nothing in the middle of the screen. Content is authored once, so it is authored against
 * the widest view that exists.
 */
export function spawnAlong(cameraAlong: number): number {
  return cameraAlong + MAX_ALONG_SPAN + EDGE_MARGIN;
}

/**
 * The `along` coordinate below which an entity is behind everyone and may be returned to its pool.
 *
 * No `MAX_ALONG_SPAN` here, and the asymmetry is the point: the trailing edge sits at the camera on
 * every device, so it does not vary with aspect. Only the leading edge does.
 */
export function cullAlong(cameraAlong: number): number {
  return cameraAlong - EDGE_MARGIN;
}

/**
 * The `along` coordinate above which an entity is ahead of everyone and may be returned to its pool.
 *
 * ⚠️ **One `EDGE_MARGIN` BEYOND `spawnAlong`, and the gap is the whole point.** A wave is placed at
 * exactly `spawnAlong`; a leading cull set to the same number retires it on the step it arrives, so
 * the level plays as an empty field and nothing anywhere reports an error. The margin between the two
 * is the room a spawn has to exist in.
 *
 * It exists for the player's own shots. Everything else in the world drifts backwards and meets
 * `cullAlong`; a shot outruns the camera forwards and would otherwise be immortal — a pool quietly
 * full of bullets that left the screen seconds ago, refusing the next one.
 */
export function cullLeadingAlong(cameraAlong: number): number {
  return spawnAlong(cameraAlong) + EDGE_MARGIN;
}
