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
 * Where things died this step, so a caller can put something there — and, handed to `collideInto`
 * as its `hits`, where shots landed.
 *
 * ⚠️ **An out-parameter rather than a return value, and it is pre-allocated at boot.** A collision
 * that returned an array of positions would allocate on the densest step of the game, which is the
 * one thing `docs/decisions/0022-frame-rate-is-a-feature.md` bans; a callback would put a closure in
 * the same place and hand `sim/` a way to be told what to do.
 *
 * ⚠️ **And it does not know what it is for.** `sim/` may import `brand` and nothing else, so it
 * cannot spawn debris, score a kill, or play a sound. It reports a fact — *something died here* —
 * and `src/app/frame.ts` decides what that is worth.
 */
export interface Deaths {
  /** How many entries of the two arrays below are meaningful. Reset by the caller, never here. */
  count: number;
  along: number[];
  across: number[];
}

/** A log big enough for `capacity` deaths in one step. Built once, at boot. */
export function makeDeaths(capacity: number): Deaths {
  // @setup: one log per pairing, built when the world is composed and reused every step forever.
  return { count: 0, along: new Array<number>(capacity).fill(0), across: new Array<number>(capacity).fill(0) };
}

/**
 * Shots spend themselves on targets. Returns how many targets were destroyed.
 *
 * A shot is consumed by arriving, whether or not it kills; a target that runs out of health is
 * returned to its pool. Nothing here decides what to draw or what to score — a caller reads the
 * count and does that.
 */
/**
 * Log a death and return the body to its pool.
 *
 * ⚠️ **Shared by the two functions that can kill something, because the ORDER is the fragile part**:
 * the position has to be read before the release, since a released slot is the next thing `spawn`
 * hands out. Written twice, the second copy is where somebody eventually swaps those two lines —
 * and the symptom is a burst appearing wherever the pool's newest occupant happens to be.
 */
function killed(targets: Pool<Entity>, index: number, deaths: Deaths | null): void {
  const target = targets.at(index);
  if (deaths !== null && deaths.count < deaths.along.length) {
    deaths.along[deaths.count] = target.along;
    deaths.across[deaths.count] = target.across;
    deaths.count++;
  }
  targets.releaseAt(index);
}

export function collideInto(
  shots: Pool<Entity>,
  targets: Pool<Entity>,
  targetRadiusScale: number,
  damageScale: number,
  flashSteps: number,
  deaths: Deaths | null,
  hits: Deaths | null = null,
): number {
  let destroyed = 0;
  for (let t = targets.size - 1; t >= 0; t--) {
    const target = targets.at(t);
    if (target.invulnFor > 0) continue;
    for (let s = shots.size - 1; s >= 0; s--) {
      const shot = shots.at(s);
      /*
        ⚠️ **A SHOT THAT SURVIVES ITS ARRIVALS LANDS ONCE PER IMPACT FLASH, AND THE FLASH IT COUNTS IS
        ITS OWN** — `docs/decisions/0234-a-blade-circles-the-ship.md`, as
        `docs/decisions/0242-a-blade-coils-ahead-of-the-ship.md` left it. A blade with health to
        spare that overlaps a body on twenty consecutive steps is twenty arrivals under the rule
        below; `landIn`, written by the last landing, is what says *already landed*, and it runs the
        flash's length so *hit* and *drawn as hit* still agree. 0234 read the BODY's flash instead,
        which made a body's landings one per flash however many blades were across it — a coil of
        sixteen blades was worth thirteen a second against a boss. A shot with one health is
        unchanged: it is spent by its first arrival — `tests/combat.test.ts` holds that a mid-flash
        pulse still counts.
      */
      if (!overlaps(shot, target, targetRadiusScale)) continue;
      if (shot.health > 1) {
        if (shot.landIn > 0) continue;
        shot.landIn = flashSteps;
      }
      target.health -= shot.damage * damageScale;
      /*
        ⚠️ **WHERE THE SHOT LANDED, FOR A CALLER THAT WANTS TO PUT SOMETHING THERE** — 0227. The same
        log shape as `deaths`, and optional for the same reason the pulse pairing does not pass one:
        a pulse's arrival is already told by the flash on the body, and a missile's is not told by
        anything (`docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` covers the body
        and nothing else). Read before the release, exactly as `killed` reads its target — a released
        slot is the next thing `spawn` hands out.
      */
      if (hits !== null && hits.count < hits.along.length) {
        hits.along[hits.count] = shot.along;
        hits.across[hits.count] = shot.across;
        hits.count++;
      }
      /*
        ⚠️ **AN ARRIVAL COSTS A SHOT ONE HEALTH, AND A SHOT WITH ONE IS GONE** — 0234. Every shot
        before the blade had one, so this is the release that was always here, written as what it
        always meant; a blade has `BLADE_EDGE` and goes on to the next body.
      */
      shot.health -= 1;
      if (shot.health <= 0) shots.releaseAt(s);
      if (target.health <= 0) {
        killed(targets, t, deaths);
        destroyed++;
        break;
      }
      /*
        ⚠️ **A SURVIVED HIT HAS TO SHOW.** Without this the shot simply vanishes and the target is
        unchanged, which is indistinguishable from the shot passing through — and it was reported as
        exactly that, on a build where every enemy had two health so the FIRST hit on everything in
        the game looked like a collision bug.

        On the survivor only. A target that died is already gone from the screen, which is its own
        feedback and a louder one.
      */
      target.flashFor = flashSteps;
    }
  }
  return destroyed;
}

/**
 * One body against many, damaging every target it covers and being consumed by none of them.
 *
 * ⚠️ **NOT `collideInto` WITH THE RELEASE REMOVED, and the difference is the whole point.** A shot
 * is spent by arriving, so it hits exactly one thing; a blast is an area, so it hits everything
 * inside it in the same step. Written as a shot that forgot to be consumed, it would hit whatever
 * the pool happened to hand back first and nothing else — which looks like a blast that missed.
 *
 * ⚠️ **It does not manage its own repetition.** A blast that lives more than a step would bill every
 * target once a step; the caller is what decides that a blast lands once, by zeroing its damage
 * afterwards. That is deliberate: `sim/` may import `brand` and nothing else, so it cannot know
 * what a blast IS or how long one is supposed to last.
 */
export function blastInto(
  blasts: Pool<Entity>,
  targets: Pool<Entity>,
  damageScale: number,
  flashSteps: number,
  deaths: Deaths | null,
): number {
  let destroyed = 0;
  for (let t = targets.size - 1; t >= 0; t--) {
    const target = targets.at(t);
    if (target.invulnFor > 0) continue;
    for (let b = blasts.size - 1; b >= 0; b--) {
      const blast = blasts.at(b);
      if (blast.damage <= 0) continue;
      if (!overlaps(blast, target, 1)) continue;
      target.health -= blast.damage * damageScale;
      if (target.health <= 0) {
        killed(targets, t, deaths);
        destroyed++;
        break;
      }
      target.flashFor = flashSteps;
    }
  }
  return destroyed;
}

/** What was collected this step, so a caller can decide what each one is worth. */
export interface Collected {
  /** How many entries of `kind` are meaningful. Reset by the caller, never here. */
  count: number;
  /** The `kind` each collected entity carried — opaque here, an index the composer owns. */
  kind: number[];
  /**
   * Which face each one was showing when it was taken — 0233. A cycling pickup is one of several
   * things and the step it is taken decides which; the loop that reads this log is what hands the
   * shell the face rather than the row.
   */
  face: number[];
  /** How many rungs each one was worth — 0243. One for an authored pickup; a scattered piece's stack. */
  stack: number[];
}

/** A log big enough for `capacity` collections in one step. Built once, at boot. */
export function makeCollected(capacity: number): Collected {
  // @setup: one log, built when the world is composed and reused every step forever.
  // @setup: the kinds, faces and stacks of one step's collections, sized once with the log.
  return { count: 0, kind: new Array<number>(capacity).fill(0), face: new Array<number>(capacity).fill(0), stack: new Array<number>(capacity).fill(1) };
}

/**
 * Things the ship flies into and keeps.
 *
 * ⚠️ **Deliberately NOT `collideIntoOne` with zero damage.** Three of that function's rules are
 * exactly wrong here: it skips a target that is invulnerable, it takes only the WORST of what is
 * touching, and it exists to reduce health. A player who is briefly invulnerable after a hit must
 * still be able to collect — the alternative is a pickup that silently passes through the ship at
 * the one moment the player is most likely to be flying into things — and two pickups touched on the
 * same step are two pickups, not the worse of them.
 *
 * ⚠️ It reports kinds and decides nothing, for the reason `Deaths` gives: `sim/` may import `brand`
 * and nothing else, so it cannot know what a pickup IS.
 */
export function collectInto(pickups: Pool<Entity>, target: Entity, targetRadiusScale: number, out: Collected): void {
  for (let i = pickups.size - 1; i >= 0; i--) {
    const pickup = pickups.at(i);
    if (!overlaps(pickup, target, targetRadiusScale)) continue;
    if (out.count < out.kind.length) {
      out.kind[out.count] = pickup.kind;
      out.face[out.count] = pickup.face;
      out.stack[out.count] = pickup.stack;
      out.count++;
    }
    pickups.releaseAt(i);
  }
}

/**
 * The index of the nearest body in `targets` within `reach` of a point, or -1.
 *
 * ── A BOLT IS AIMED BY THE MODEL, AND THIS IS THE AIM ────────────────────────────────────────────
 *
 * `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`. Chain lightning has no body in
 * flight to sweep, so it cannot use `overlaps`: it asks, on the step it fires, what is nearest to
 * the nose and then what is nearest to that, `links` times. Distance is measured to the target's
 * EDGE rather than its centre, so a big body close by is nearer than a small one whose centre
 * happens to be closer — which is what *nearest* means to a player looking at the screen.
 *
 * ⚠️ **A body still flashing from a hit is skipped when `skipFlashing` is set**, and that is how a
 * chain avoids landing twice on one body: `strike` below writes the flash, so the next link's search
 * cannot find what the last link hit. It is the same field the picture reads (0035), which makes
 * *already hit this volley* and *drawn as just hit* one fact. A caller that wants to land on the same
 * body again — a bolt jumping around a single boss — passes `false`.
 *
 * ⚠️ **Allocation-free and bounded by the pool**, on `collideInto`'s terms: a scan, a compare, an
 * index. Reach is compared squared so there is no square root in the loop.
 */
export function nearestFrom(targets: Pool<Entity>, along: number, across: number, reach: number, skipFlashing: boolean): number {
  let best = -1;
  let bestGap = reach;
  for (let i = targets.size - 1; i >= 0; i--) {
    const target = targets.at(i);
    if (target.invulnFor > 0) continue;
    if (skipFlashing && target.flashFor > 0) continue;
    const dAlong = target.along - along;
    const dAcross = target.across - across;
    const gap = Math.sqrt(dAlong * dAlong + dAcross * dAcross) - target.radius;
    if (gap > bestGap) continue;
    bestGap = gap;
    best = i;
  }
  return best;
}

/**
 * One hit landed by hand on `targets[index]`, on exactly `collideInto`'s terms for what a hit is:
 * damage off the health, the target retired and logged if that emptied it, flashed if it did not.
 * Returns whether it was killed.
 *
 * ⚠️ **THE SAME RULES AS A SHOT ARRIVING, WITH NO SHOT.** A bolt is resolved on the step it fires,
 * so there is no body to sweep and nothing to consume — but what a hit DOES to the thing it hits
 * must not be described twice, or the arc's hits and the pulse's would drift apart the first time
 * either moved. This is the arrival half of `collideInto`, exported so `src/app/frame.ts` can land
 * a link without re-stating it.
 */
export function strike(targets: Pool<Entity>, index: number, damage: number, flashSteps: number, deaths: Deaths | null): boolean {
  const target = targets.at(index);
  target.health -= damage;
  if (target.health <= 0) {
    killed(targets, index, deaths);
    return true;
  }
  target.flashFor = flashSteps;
  return false;
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
  flashSteps: number,
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
    // Lit for the whole invulnerable window rather than a short burst, so the flash says two things
    // at once: *that hurt*, and *you are briefly safe*. Whether a solid flash or a blink reads better
    // is a picture question and belongs to a hand, not to this file.
    target.flashFor = flashSteps;
  }
  return taken;
}
