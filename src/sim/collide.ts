/**
 * What touches what, and what that costs.
 *
 * See `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`. Two functions, both
 * allocation-free, both iterating backwards, and neither of them knowing what an enemy or a bullet
 * IS — they are handed two pools and told the rules for that pairing.
 *
 * ── WHY THE PAIRING IS THE ARGUMENT AND NOT A FIELD ON THE ENTITY ───────────────────────────────
 *
 * The obvious shape is one pool, a `team` field, and a double loop that skips pairs on the same side.
 * It is quadratic: at 0022's worst case of 500 entities that is ~125,000 tests every step, 7.5 million
 * a second, on a 2021 mid-range Android.
 *
 * **And nothing in this repository could see it.** 0025 counts draw calls and allocations; both stay
 * exactly correct while the step does a hundred times the work it needs to. That is
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`'s failure with the sign flipped — a green
 * guard over a quantity nobody is measuring — so the fix is structural rather than a broad phase:
 * separate pools mean the caller names which two sides can meet, and the count collapses to the
 * products that actually matter (~80 shots × ~40 enemies, ~150 shots × one ship).
 *
 * ── WHY EVERY LOOP RUNS BACKWARDS ───────────────────────────────────────────────────────────────
 *
 * `Pool.releaseAt` swaps the last live item into the freed slot. Walking forwards, a release moves an
 * unvisited entity into a slot already passed — about half of them survive a step they should not
 * have. `src/sim/entity.ts` has the same rule for the same reason, and 0025 probes it there.
 *
 * ⚠️ Releasing backwards is also why the *outer* loop is safe: at index `i` everything above `i` has
 * been visited, so the item swapped down into `i` is one that has already had its turn.
 */

import type { Entity } from './entity.ts';
import type { Pool } from './pool.ts';

/**
 * Whether two circles touched at any point during the step just taken, with `b`'s radius scaled.
 *
 * The scale is how `docs/decisions/0024-the-accessibility-floor-is-settings.md`'s `hurtbox` assist
 * reaches the model: `forgiving` shrinks the player's circle and touches nothing else. It is an
 * argument rather than a lookup here because `sim/collide.ts` may not import `content/` or `state/`,
 * and because a function that reads a setting cannot be asked "what about at 0.7".
 *
 * ── SWEPT, AND THE REASON IS A CONSTRAINT IT REMOVES RATHER THAN A BUG IT FIXED ──────────────────
 *
 * Testing the two current positions is one line shorter and wrong in a way that only shows up fast:
 * a shot that travels further in one step than the two radii sum to steps clean over its target
 * between frames. That puts a hard ceiling on every speed in `src/content/shots.ts` —
 * `spit + SHIP_SPEED` must stay under the ship's reach, which at the numbers as written is already
 * within 7% of failing, **and `SHIP_SPEED` is the constant the next pass exists to raise**.
 *
 * A guard on that ceiling would have been a guard on an unvalidated threshold standing directly in
 * front of the one knob `reports/drag-feel-2026-08-05.md` says to turn first, which is exactly the
 * shape `docs/decisions/0027-measure-the-picture-not-the-model.md` refuses: *"a guard built on an
 * unvalidated threshold defends the bug."* Sweeping deletes the ceiling instead of policing it.
 *
 * `prevAlong`/`prevAcross` are already carried for the renderer to interpolate from
 * (`src/sim/entity.ts`), so the segment each body travelled is free — this is the closest approach
 * between two straight paths over one step, clamped to the step, and at `t = 1` it is exactly the
 * old test.
 *
 * ⚠️ Squared distances on both sides. A `Math.sqrt` per pair, several thousand times a step, buys
 * nothing — the comparison is the same one.
 */
export function overlaps(a: Entity, b: Entity, radiusScaleB: number): boolean {
  const reach = a.radius + b.radius * radiusScaleB;
  // Where they were relative to each other when the step began, and how that moved during it.
  const pAlong = a.prevAlong - b.prevAlong;
  const pAcross = a.prevAcross - b.prevAcross;
  const vAlong = a.along - a.prevAlong - (b.along - b.prevAlong);
  const vAcross = a.across - a.prevAcross - (b.across - b.prevAcross);

  const speedSquared = vAlong * vAlong + vAcross * vAcross;
  let t = 1;
  if (speedSquared > 0) {
    // The moment of closest approach, clamped into the step: outside [0, 1] the nearest the two ever
    // got during THIS step is one of its ends.
    t = -(pAlong * vAlong + pAcross * vAcross) / speedSquared;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
  }
  const nearAlong = pAlong + vAlong * t;
  const nearAcross = pAcross + vAcross * t;
  return nearAlong * nearAlong + nearAcross * nearAcross <= reach * reach;
}

/**
 * Shots spend themselves on targets. Returns how many targets were destroyed.
 *
 * A shot is consumed by arriving, whether or not it kills; a target that runs out of health is
 * returned to its pool. Nothing here decides what to draw or what to score — a caller reads the
 * count and does that.
 */
export function collideInto(
  shots: Pool<Entity>,
  targets: Pool<Entity>,
  targetRadiusScale: number,
  damageScale: number,
): number {
  let destroyed = 0;
  for (let t = targets.size - 1; t >= 0; t--) {
    const target = targets.at(t);
    if (target.invulnFor > 0) continue;
    for (let s = shots.size - 1; s >= 0; s--) {
      const shot = shots.at(s);
      if (!overlaps(shot, target, targetRadiusScale)) continue;
      target.health -= shot.damage * damageScale;
      shots.releaseAt(s);
      if (target.health <= 0) {
        targets.releaseAt(t);
        destroyed++;
        break;
      }
    }
  }
  return destroyed;
}

/**
 * Threats arriving at one entity — the ship. Returns the damage it actually took.
 *
 * `consume` is the difference between a shot and a body. A shot is spent on arrival; an enemy that
 * the player has flown into is still there afterwards, and releasing it would mean ramming was the
 * cheapest way to clear the screen.
 *
 * `invulnSteps` is set on the target when damage lands, and it is what makes `health` a number of
 * hits rather than a number of steps — see `src/sim/entity.ts`. A target already invulnerable is
 * skipped entirely rather than skipped-but-consumed, so a volley passes visibly THROUGH a ship that
 * is flashing instead of being silently eaten by it.
 *
 * ⚠️ **One hit per step, and it is the WORST of what is touching — never the first one found.** The
 * obvious version damages on the first overlap and breaks, and that quietly breaks the promise
 * `tests/assist.test.ts` makes: shrinking the hurtbox removes overlaps, so the first one found can
 * become a *heavier* threat than the one a larger hurtbox met, and turning an assist on deals more
 * damage than leaving it off. Taking the maximum makes the result a function of the overlap SET,
 * which only ever shrinks — so monotonicity holds by construction rather than by every shot kind
 * happening to carry the same damage today. `docs/decisions/0024-the-accessibility-floor-is-settings.md`
 * says no assist may ever make the game harder; this is what that costs here.
 */
export function collideIntoOne(
  threats: Pool<Entity>,
  target: Entity,
  targetRadiusScale: number,
  damageScale: number,
  invulnSteps: number,
  consume: boolean,
): number {
  if (target.invulnFor > 0) return 0;
  let worst = 0;
  for (let i = threats.size - 1; i >= 0; i--) {
    const threat = threats.at(i);
    if (!overlaps(threat, target, targetRadiusScale)) continue;
    if (threat.damage > worst) worst = threat.damage;
    if (consume) threats.releaseAt(i);
  }
  const taken = worst * damageScale;
  if (taken > 0) {
    target.health -= taken;
    target.invulnFor = invulnSteps;
  }
  return taken;
}
