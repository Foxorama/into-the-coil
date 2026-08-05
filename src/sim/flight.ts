/**
 * How an `Intent` becomes movement.
 *
 * The first file in the project whose numbers are **felt rather than derived**, which is why every
 * one of them is named, sourced, and marked as a starting point rather than an answer. See
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`: a constant set by reasoning and then
 * defended by a test is how a guess becomes a constraint that later passes have to route around.
 *
 * ── THE THREE THINGS THIS HAS TO GET RIGHT ──────────────────────────────────────────────────────
 *
 * 1. **A diagonal must not be faster than a straight line.** Holding two directions gives (1,1),
 *    whose length is 1.414 — so an unnormalised ship crosses the field 41% faster on the diagonal,
 *    for free, forever. Nothing throws and no test notices unless one is written for it.
 * 2. **The player's box is the same on every device.** `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`
 *    fixes the dodge lane at 100 units precisely so difficulty does not vary with the screen. Letting
 *    the player use the whole of a 21:9's 240-unit view would hand that player 60% more room to
 *    retreat into than a laptop gets. Extra view is LOOKAHEAD, never extra play space.
 * 3. **Response is immediate.** No acceleration, no smoothing: velocity is the ask, scaled. That is
 *    the arcade answer and it is a decision rather than an omission — R-Type and Raiden both move the
 *    ship the frame the stick does.
 */

import { ACROSS_SPAN, MIN_ASPECT } from './camera.ts';
import type { Entity } from './entity.ts';
import type { Intent } from './intent.ts';

/**
 * World units per step at full deflection — 1.7, so the ship crosses the 100-unit dodge lane in
 * about a second at 60Hz.
 *
 * ⚠️ **A STARTING POINT, not a measurement.** It is set from the genre's rough behaviour, and the
 * only thing that can settle it is a hand on a keyboard watching the picture. `scripts/trace-frame.mjs`
 * is the instrument that makes that argument in pixels rather than in world units; until it has been
 * run against a real player's verdict, nothing may assert on this number as though it were correct.
 */
export const SHIP_SPEED = 1.7;

/**
 * World units the camera advances per fixed step — 0.6, so 36 units a second at 60Hz.
 *
 * ⚠️ **Same status as `SHIP_SPEED`, and it lives beside it because the two are ONE knob with two
 * halves.** The scroll rate is the player's *time* budget — at a 16:9 view of 177.8 units it is about
 * 4.9 seconds between a threat appearing at the leading edge and reaching the ship. `SHIP_SPEED` is
 * the *distance* budget: how much of the 100-unit lane the player can cross in that time. The dodge
 * margin is a function of both, so settling one against the other while the other still moves is the
 * eight-pass bounce `docs/decisions/0027-measure-the-picture-not-the-model.md` records, reached from a
 * third direction. `reports/drag-feel-2026-08-05.md` lists both as waiting on the same trigger and
 * puts only one of them in its ordering; this is the correction.
 *
 * ⚠️ **It moved here from `src/app/mount.ts`.** A difficulty quantity living in the shell is one the
 * model cannot be tuned against, and one a level cannot be authored against either.
 */
export const SCROLL_PER_STEP = 0.6;

/**
 * The player's movement box along the scroll axis, in world units from the camera's trailing edge.
 *
 * `ACROSS_SPAN * MIN_ASPECT` — the NARROWEST view any device gets, so every device gives the player
 * the same box and the widest screens spend their extra span on lookahead. The alternative, clamping
 * to the current view, makes retreat distance a property of the monitor.
 */
export const PLAYER_ALONG_SPAN = ACROSS_SPAN * MIN_ASPECT;

/**
 * How close the ship may get to the edge of its box, in world units.
 *
 * Half a ship, roughly, so it never half-leaves the playfield — and enough on the trailing edge that
 * a player who has retreated as far as they can still has the camera behind them rather than under
 * them.
 */
export const PLAYER_MARGIN = 6;

function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n;
}

/**
 * Apply this step's intent to the ship, and keep it inside its box.
 *
 * `cameraAlong` is passed rather than read because the box travels with the camera: the ship is
 * positioned in world space, but the thing it must stay inside is the window.
 *
 * ⚠️ **Sets velocity rather than position**, so `stepEntities` remains the one place an entity
 * integrates and `prevAlong`/`prevAcross` keep being carried for the renderer to interpolate from.
 * Writing position here would judder on every display that is not exactly 60Hz.
 *
 * ⚠️ Nothing allocates: no vector object, no destructuring of a returned pair. This runs once per
 * fixed step.
 */
export function flyShip(ship: Entity, intent: Intent, cameraAlong: number, scrollPerStep: number): void {
  const ax = intent.along;
  const ay = intent.across;

  // Normalise only when BOTH axes are asking, so a single-axis push keeps its exact magnitude and an
  // analog stick at half deflection is not quietly rescaled to full.
  const lengthSquared = ax * ax + ay * ay;
  const scale = lengthSquared > 1 ? SHIP_SPEED / Math.sqrt(lengthSquared) : SHIP_SPEED;

  // The ship holds station in the camera's frame, so the scroll rate is its baseline velocity and
  // the player's ask is a departure from it.
  ship.velAlong = scrollPerStep + ax * scale;
  ship.velAcross = ay * scale;

  // Clamp by trimming VELOCITY, not by moving the ship: writing `along` here would break the
  // interpolation contract, and a ship teleported back inside its box would visibly stutter at the
  // wall on high-refresh displays.
  const minAlong = cameraAlong + PLAYER_MARGIN;
  const maxAlong = cameraAlong + PLAYER_ALONG_SPAN - PLAYER_MARGIN;
  const nextAlong = ship.along + ship.velAlong;
  if (nextAlong < minAlong || nextAlong > maxAlong) {
    ship.velAlong = clamp(nextAlong, minAlong, maxAlong) - ship.along;
  }

  const nextAcross = ship.across + ship.velAcross;
  if (nextAcross < PLAYER_MARGIN || nextAcross > ACROSS_SPAN - PLAYER_MARGIN) {
    ship.velAcross = clamp(nextAcross, PLAYER_MARGIN, ACROSS_SPAN - PLAYER_MARGIN) - ship.across;
  }
}
