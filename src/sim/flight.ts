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
 * 3. **The ship has mass.** Velocity is not the ask — it *approaches* the ask. See `FLIGHT_RESPONSE`
 *    below, and `docs/decisions/0037-the-ship-has-mass.md` for why this reverses what this comment
 *    used to say.
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
 * How much of the gap between the ship's current velocity and the asked-for one it closes each step.
 *
 * `1` is the old behaviour exactly — velocity IS the ask, arriving whole on the step it is asked for.
 * Below 1 the ship takes time to get going and time to stop, and both come from this one number:
 * the gap shrinks by a fixed fraction per step, so `0.2` closes 20% of what is left every step and
 * settles in about a fifth of a second.
 *
 * ⚠️ **A STARTING POINT, not a measurement**, on the same terms as `SHIP_SPEED` above, and picked to
 * land near a quantity that HAS been felt: `reports/drag-feel-2026-08-05.md` measured the touch
 * bank's run-on at 267ms to complete, which is three or four time constants, so a time constant of
 * about five steps is the shape a hand already called *"really good"*. What settles it is a hand,
 * and `scripts/trace-frame.mjs` is what makes two candidates cost four minutes instead of a
 * play-test.
 *
 * ⚠️ **It applies to the ship and to nothing else.** Enemies and shots carry constant velocity; this
 * is a property of the thing the player is flying, which is the whole point of
 * `docs/decisions/0037-the-ship-has-mass.md` — the feel belongs to the ship rather than to whatever
 * is in the player's hands.
 */
export const FLIGHT_RESPONSE = 0.2;

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

/**
 * How far ahead of the camera the ship may fly, in world units. The wall it meets going forward.
 *
 * ── ONE DESCRIPTION, BECAUSE THE PICTURE OF IT IS NOW DRAWN ─────────────────────────────────────
 *
 * ⚠️ **This exists so the clamp and the mark cannot disagree.** Reported from play: *"the hard block
 * on the player movement was a problem because there was no indication of it, and I got shot a couple
 * of times because I tried to fly forward on the screen to avoid a bullet and couldn't."* The answer
 * is to draw it (`docs/decisions/0074-the-box-is-drawn.md`) — and a drawn boundary computed from
 * `PLAYER_ALONG_SPAN - PLAYER_MARGIN` at the call site would be a second copy of this subtraction,
 * in a file that has no way to know when either term moves.
 *
 * `src/content/sprites.ts` records what three hand-kept descriptions of one fact cost the last time.
 *
 * ⚠️ **A distance from the camera, not a world position**, so it is a constant rather than something
 * recomputed per step: the box travels with the camera, which is the whole of what 0023 fixes.
 */
export const PLAYER_LEAD = PLAYER_ALONG_SPAN - PLAYER_MARGIN;

function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n;
}

/**
 * Put a ship at rest **in the camera's frame** — moving with the world, asking for nothing.
 *
 * ⚠️ **A newly `reset` ship has zero velocity, which is not the same thing**, and since inertia
 * landed the difference is permanent rather than momentary. A ship starting from zero spends about
 * five steps accelerating up to the scroll rate, and everything it fails to travel in those steps is
 * ground it never gets back: velocity converges on the camera's *rate*, not on a *position*. It would
 * appear a couple of units further down-lane than it was placed, every spawn and every restart.
 *
 * This exists so that fact has a name and one home, rather than living as `ship.velAlong = SCROLL`
 * repeated at each of the places that place a ship and omitted at the next one.
 */
export function holdStation(ship: Entity, scrollPerStep: number): void {
  ship.velAlong = scrollPerStep;
  ship.velAcross = 0;
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

  /*
    THE MASS. Velocity approaches the ask instead of becoming it, by a fixed fraction of the
    remaining gap each step — so the ship takes time to get going and time to stop, and both come
    from `FLIGHT_RESPONSE` alone.

    The target still carries `scrollPerStep` as its baseline: the ship holds station in the camera's
    frame, so the player's ask is a departure from the scroll rate rather than a replacement for it.
    Drop that and a ship asking for nothing decelerates to zero and falls off the back of the world.

    ⚠️ **The obvious-looking refinement here is a NO-OP, and it was written and reverted.** Splitting
    the velocity into `scroll + departure` and lagging only the departure looks like it protects the
    baseline from the mass. It is algebraically the same expression — exponential approach is affine,
    so `s + lag(v − s → T)` and `lag(v → s + T)` are identical to floating-point noise, and a test
    written to guard the difference passed under both. The real hazard it was reaching for is
    `holdStation` below, which is about the velocity a ship STARTS at, not about how it is decomposed.
  */
  ship.velAlong += (scrollPerStep + ax * scale - ship.velAlong) * FLIGHT_RESPONSE;
  ship.velAcross += (ay * scale - ship.velAcross) * FLIGHT_RESPONSE;

  // Clamp by trimming VELOCITY, not by moving the ship: writing `along` here would break the
  // interpolation contract, and a ship teleported back inside its box would visibly stutter at the
  // wall on high-refresh displays.
  const minAlong = cameraAlong + PLAYER_MARGIN;
  const maxAlong = cameraAlong + PLAYER_LEAD;
  const nextAlong = ship.along + ship.velAlong;
  if (nextAlong < minAlong || nextAlong > maxAlong) {
    ship.velAlong = clamp(nextAlong, minAlong, maxAlong) - ship.along;
  }

  const nextAcross = ship.across + ship.velAcross;
  if (nextAcross < PLAYER_MARGIN || nextAcross > ACROSS_SPAN - PLAYER_MARGIN) {
    ship.velAcross = clamp(nextAcross, PLAYER_MARGIN, ACROSS_SPAN - PLAYER_MARGIN) - ship.across;
  }
}
