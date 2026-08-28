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
 *
 * ⚠️ **It is now `MIN_ASPECT` as well, and the two being one number is the point** —
 * `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md`. The aspect a level is
 * written for is the aspect the player's box is sized to, so *what the designer sees* and *where the
 * ship may fly* stopped being two separate answers. It used to enforce nothing at runtime; the floor
 * below is what it now does.
 */
export const REFERENCE_ASPECT = 16 / 9;

/**
 * The clamp on lookahead, in aspect terms.
 *
 * ── THE FLOOR IS THE REFERENCE ASPECT, AND THAT IS A CHANGE THE PLAYER CHOSE ────────────────────
 *
 * Reported from play: *"almost a quarter of the screen space is not playable by the player"*, and
 * with it the trade taken: *"we should be able to extend the desktop one… let's optimise for desktop
 * and we'll add a different viewport for mobile."*
 * `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md`.
 *
 * ⚠️ **It was 1.5, and 1.5 was the whole of why the player's box was a quarter short of the screen.**
 * `src/sim/flight.ts` sizes the box at `ACROSS_SPAN × MIN_ASPECT` — the narrowest view any device
 * gets — precisely so every player has the same box. At 1.5 that box was 150 units against a 16:9
 * view of 177.8, so a 16:9 monitor drew 28 units of playfield the ship could not reach, and a 21:9
 * drew 90. [0074](../../docs/decisions/0074-the-box-is-drawn.md) named raising this as the lever and
 * refused it because it letterboxes 16:10 laptops and 3:2 tablets. **That refusal has been
 * overruled by the player**, in those words.
 *
 * ⚠️ **`REFERENCE_ASPECT` rather than 1.78 written again**, because they are now the same decision:
 * the aspect levels are authored against is the aspect the box is sized to, so a level designer's
 * screen and the player's box are one number. A second literal here would be the drift
 * `src/content/sprites.ts` records the cost of.
 *
 * **Who gets bars now**: 4:3 and 5:4 tablets, as before, plus 3:2 (1.50) and 16:10 (1.60) laptops.
 * **Who does not**: 16:9 (1.78) exactly, 19.5:9 (2.17), 20:9 (2.22), 21:9 (2.39) — which is every
 * phone in the table and every ordinary monitor.
 *
 * Outside the clamp the excess becomes gutter, never extra world.
 */
export const MIN_ASPECT = REFERENCE_ASPECT;
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
  /** World units visible along the scroll axis: 177.8 to 240, per the clamp. */
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
    /*
      ⚠️ **Floored at zero, and the floor is arithmetic rather than caution.** `scale` is the smaller
      of the two ratios, so the axis it came from divides out exactly and its gutter is zero — in
      real arithmetic. In floating point it can land a ten-thousandth of a nanometre below it, which
      is what a 16:10 laptop produced the moment `MIN_ASPECT` stopped dividing its width evenly.
      A negative gutter means *world that exists and is not on screen*, so leaving the sign to
      rounding would let a crop and a rounding error wear the same shape.
      `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md`.
    */
    gutterAlong: Math.max(0, (long - alongSpan * scale) / 2),
    gutterAcross: Math.max(0, (short - ACROSS_SPAN * scale) / 2),
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

/**
 * The `along` coordinate a PLAYER'S shot may not pass, given what the player can actually see.
 *
 * ── THE ONE CULL THAT DEPENDS ON THE DEVICE, AND IT IS A BUG FIX ────────────────────────────────
 *
 * ⚠️ **Reported from play**: *"in playtesting I didn't even see the boss monsters on screen because
 * they died before they even entered the visible play area."* A pulse lives
 * `PLAYER_SHOT_LIFE` steps at its own speed, which carries it about 250 units ahead of the camera —
 * and a 16:9 view is 178 wide. Everything in the 70 units between was being shot at, and a boss
 * spends about four seconds there while it closes on its station.
 *
 * ⚠️ **`view.alongSpan` and NOT `MAX_ALONG_SPAN`, which is the opposite of every other rule here.**
 * `spawnAlong` uses the widest view any device can have, because content is authored once and must
 * be off-screen everywhere. This is not content: it is the player's reach, and *"you can shoot what
 * you can see"* is the rule a player actually holds. Tying it to the widest device instead would
 * leave a 16:9 player shooting 70 units into the dark to keep a 21:9 player's reach honest.
 *
 * It does mean a wider screen shoots further, which is the same trade
 * `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md` already made and clamped: a wider screen
 * also sees further, and `across` — the difficulty axis — is fixed at 100 on every device.
 */
export function cullPlayerShotAlong(cameraAlong: number, alongSpan: number): number {
  return cameraAlong + alongSpan;
}

/**
 * How far outside the dodge lane a body may drift before it is gone for good.
 *
 * ⚠️ **THE GAP `reports/enemy-silhouettes-2026-08-05.md` NAMED, closed in the change that opens it.**
 * Until now nothing entered or left across the lane, so `cullAlong` was the whole story; anything
 * that did leave was gone from the game and still holding a pool slot forever. Entry from the
 * `across` edges makes that a live path rather than a hypothetical.
 *
 * `EDGE_MARGIN` on each side, which is the same clearance the along edges get and is by definition
 * larger than anything that may be authored — so a body spawning off the lane spawns inside the
 * cull, and one that leaves is genuinely past everybody.
 */
export const ACROSS_CULL_MIN = -EDGE_MARGIN;
export const ACROSS_CULL_MAX = ACROSS_SPAN + EDGE_MARGIN;

/**
 * How far outside the lane something entering from an `across` edge starts.
 *
 * Half the cull margin: far enough that it is off screen on every device before it moves, close
 * enough that it is never sitting in the dead zone for long.
 */
export const FLANK_MARGIN = EDGE_MARGIN / 2;

/**
 * The band a THREAT may occupy across the lane — the dodge lane, plus the margin it arrives from.
 *
 * ── THE LANE IS THE PLAYER'S BOX AND IT IS NOT THE ENEMIES' ─────────────────────────────────────
 *
 * Reported from play: *"once on screen the enemies are in a very narrow tunnel and it makes the feel
 * very restrictive and not like you're in a large area. They should fly off the `across` edges and
 * back on."* `docs/decisions/0059-the-lane-is-the-players-box.md`.
 *
 * ⚠️ **It is `FLANK_MARGIN` and not a fourth number**, because it is the same fact read the other
 * way round: 0048 already says a threat may enter from `FLANK_MARGIN` outside the lane, so the band
 * a threat may *be* in is the band it may arrive from. A separate constant would be two descriptions
 * of one edge, and they would drift the first time either moved.
 *
 * ⚠️ **Strictly inside `ACROSS_CULL_MIN`/`MAX`, which is what makes roaming safe.** The cull is at
 * `EDGE_MARGIN`; this is half of it. So a body that turns around here is never anywhere near being
 * retired, and the cull goes on meaning what 0048 made it mean — *this has left the game* — rather
 * than becoming a wall that things bounce off.
 *
 * ⚠️ **The SHIP cannot reach it.** `src/sim/flight.ts` clamps the player inside `PLAYER_MARGIN` of
 * the lane, so the extra band is somewhere threats can go and the player cannot follow. That
 * asymmetry is the point rather than an oversight: it is what makes the area read as larger than the
 * box the player flies in.
 */
export const ROAM_MIN = -FLANK_MARGIN;
export const ROAM_MAX = ACROSS_SPAN + FLANK_MARGIN;

/**
 * How far ahead of the camera a flanker appears, in world units.
 *
 * ⚠️ **`MAX_ALONG_SPAN / 2`, and it is the only number that keeps the promise on every device.**
 * Asked for in play: *"entry point should be capped at 50% from the right side of the screen — the
 * player has a safe spawn zone from the left side."* A view is 178 to 240 units wide by aspect
 * (0023), so *half the screen* is not one place. 120 is at or beyond the halfway line of every view
 * the clamp allows — dead centre on the widest, and 80% of the way across on the narrowest — so
 * nothing ever appears behind the player, on any device.
 *
 * ⚠️ It is measured from the CAMERA rather than from the ship, because the ship moves and a spawn
 * rule that followed it would let a player standing forward drag their own ambushes in front of
 * them.
 *
 * ── ⚠️ AND THE SENTENCE ABOVE ABOUT *THE PLAYER'S OWN CAP* WAS FALSE — 0197 ─────────────────────
 *
 * ⚠️ **THE PLAYER'S CAP IS `PLAYER_LEAD`, WHICH IS 167.1, AND THIS IS 120.** Reported a second time:
 * *"enemies still enter the screen space within 50% of the left side of the screen which gives the
 * player no way to interact with them."* **The entry point is 47.1 units INSIDE the player's box** —
 * so a player pushed forward is ahead of where flankers appear, they materialise behind the ship, and
 * the ship fires forward. `docs/decisions/0197-a-wave-arrives-as-a-wave.md`.
 *
 * ⚠️ **THE PARAGRAPH ABOVE IS WHY IT SURVIVED A FIRST REPORT.** Believing 120 was the player's limit
 * made *nothing ever appears behind them* look guaranteed, so the previous round read the complaint as
 * a problem about TIME and slowed the crossing instead. **It was never a guarantee.**
 *
 * ⚠️ **SO THIS IS A FLOOR NOW RATHER THAN THE ANSWER**, and `flankAlongFor` is the answer: never
 * behind the ship, never nearer than this, and never further than the view can show. The refusal
 * above still stands for the LOWER bound — a player at the back cannot pull ambushes forward — and
 * what changes is only that a player at the FRONT stops having them appear behind.
 */
export const FLANK_ALONG = MAX_ALONG_SPAN / 2;

/**
 * How much clear air a flanker enters ahead of the ship, in world units.
 *
 * ⚠️ **A REACTION DISTANCE AND NOT A MARGIN.** At `SCROLL_PER_STEP` the world moves under the ship at
 * a known rate; 24 units is about four tenths of a second of it, which is the shortest gap the
 * eleventh play-test called readable for a body arriving across the lane.
 */
export const FLANK_CLEAR_AIR = 24;

/**
 * Where a flanker actually enters, given the camera, the ship and the view.
 *
 * ⚠️ **THREE BOUNDS, AND EACH IS A DIFFERENT PROMISE.** Never nearer the camera than `FLANK_ALONG`
 * (0048's ask, and the refusal that keeps a player at the back from dragging ambushes forward); never
 * within `FLANK_CLEAR_AIR` of the ship (0197's report — the one that was missing); and never past what
 * this device can show, because a body that enters off screen is
 * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`'s own failure.
 *
 * ⚠️ **THE CEILING IS `MAX_ALONG_SPAN` AND NOT THIS DEVICE'S VIEW, WHICH IS THE OPPOSITE OF THE
 * SNIPING RULE AND IS RIGHT FOR THE OPPOSITE REASON.** On a 16:9 view the player's box is **94% of the
 * whole screen**, so clamping to what that device can show puts the entry 29 units BEHIND a ship at its
 * cap — the bug, still there, on the commonest monitor in the world. A flanker placed just past the
 * leading edge slides in within half a second exactly as a lead wave does, and
 * `docs/decisions/0059-the-lane-is-the-players-box.md` already stops a body that is entirely off screen
 * from firing. **The thing that must not happen is being SHOT at from off screen, not arriving from
 * there.**
 */
export function flankAlongFor(shipAlong: number, cameraAlong: number, _alongSpan: number): number {
  const ahead = shipAlong - cameraAlong + FLANK_CLEAR_AIR;
  return Math.min(Math.max(FLANK_ALONG, ahead), MAX_ALONG_SPAN);
}
