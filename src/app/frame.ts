/**
 * What happens every frame, and nothing else.
 *
 * This file exists so that the frame's work can be held to
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`'s hot-file scan while the setup
 * around it — creating a canvas, baking an atlas, listening for a resize — stays ordinary code in
 * `mount.ts`. Splitting them is what lets the guard be strict without being edited into uselessness.
 *
 * ⚠️ **Nothing here may bake, allocate, or read the clock.** The step is fixed and handed to it; the
 * atlas was baked at load. If a frame needs something built, it is being built in the wrong place.
 *
 * ⚠️ **This is a PROOF SCENE, not the game.** One ship, two enemy kinds, one shot each way: enough
 * that an entity can kill the player, which is the trigger
 * `reports/drag-feel-2026-08-05.md` names for re-opening `SHIP_SPEED`, the scroll rate and the drag.
 * Waves, levels and bosses arrive with `content/`; nothing about this file's shape survives that.
 *
 * ── WHERE THE DECIDING LIVES ────────────────────────────────────────────────────────────────────
 *
 * Here, and that is the layer ladder rather than convenience. `sim/` may import `brand` and nothing
 * else, so it can move bodies and resolve contacts and cannot look up what an enemy *is*. This file
 * is `app/` and may import everything, so it is where a row becomes a spawn.
 * `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
 */

import {
  ACROSS_SPAN,
  FLANK_ALONG,
  FLANK_MARGIN,
  ROAM_MAX,
  ROAM_MIN,
  cullPlayerShotAlong,
  spawnAlong,
  type View,
} from '../sim/camera.ts';
import {
  blastInto,
  collectInto,
  collideInto,
  collideIntoOne,
  type Collected,
  type Deaths,
} from '../sim/collide.ts';
import { type Entity, reset, stepEntities } from '../sim/entity.ts';
// `SCROLL_PER_STEP` for `PICKUP_SLOW_AT`, which is a distance derived from a duration — 0087. Every
// other speed in this file rides `w.scrollPerStep`, which is the same number reachable from a world.
import { SCROLL_PER_STEP, flyShip, holdStation } from '../sim/flight.ts';
import type { Intent } from '../sim/intent.ts';
import type { Tuning } from '../sim/assist.ts';
import type { InputSource } from './input.ts';
import type { Pool } from '../sim/pool.ts';
import { paintScene, type Bound, type Sky } from '../render/scene.ts';
import type { Surface } from '../render/surface.ts';
import type { Rng } from '../sim/rng.ts';
import type { EnemyKind, EnemyRow } from '../content/enemies.ts';
import type { ShipRow } from '../content/ships.ts';
import { INVULN_STEPS, SHIELD_MARK, hullFor, shieldsOf } from '../content/ships.ts';
import { SHOTS } from '../content/shots.ts';
import { BURST, DEBRIS } from '../content/debris.ts';
import { FORMATIONS } from '../content/formations.ts';
import { DEFAULT_ORIGIN, type LevelRow } from '../content/levels.ts';
import { BOSSES, type BossRow } from '../content/bosses.ts';
import { type DifficultyRow, fireGapFor, singleHitOnly, toughnessFor } from '../content/difficulty.ts';
import { nextOnGrid } from '../content/music.ts';
import { PICKUP_KINDS, type PickupKind, type PickupRow, type UpgradeKind, type Weapon } from '../content/pickups.ts';
import { SPECIALS, pyreFor, type SpecialKind } from '../content/specials.ts';
import type { CueKind } from '../content/cues.ts';
import { stepBoss } from './boss.ts';
import type { Frame } from './loop.ts';

/** How far in front of the ship a shot appears, in world units — clear of its own hurtbox. */
const MUZZLE_ALONG = 3;

/**
 * Two pi, hoisted.
 *
 * ⚠️ A weave is authored as a WAVELENGTH in world units, which is the number a level designer can
 * hold; the sine wants an angular rate. This is the conversion, and it is a module constant because
 * the alternative is computing `Math.PI * 2` once per weaving enemy per step forever.
 */
const TAU = Math.PI * 2;

/**
 * How fast a flanker crosses the lane on its way in, in world units per step.
 *
 * ⚠️ **A PLAY-TEST NUMBER, on `SHIP_SPEED`'s terms.** It has to be quick enough that the wave is not
 * a slow slide the player watches for four seconds, and slow enough that a body arriving from an
 * edge nobody was looking at is not a hit that could not have been avoided. Nothing asserts on it;
 * what `tests/level.test.ts` holds is that a flanker reaches its lane before it leaves the screen,
 * which is a relationship that must be true at any value.
 *
 * 0.9 crosses the widest entry — outside the lane to the far side — in a little under two seconds.
 */
const FLANK_ENTRY_SPEED = 0.9;

/**
 * How far out a circling body starts orbiting rather than closing, as a multiple of its radius.
 *
 * ⚠️ **An orbit attempted from the spawn horizon is a TANGENT.** A body 246 units out that applied a
 * tangential velocity would travel sideways at its full agility while barely approaching, and would
 * leave the lane across before it ever reached the fight. At 1.6 the warden flies in like anything
 * else and engages about half a hull's width outside its own orbit, which reads as arriving.
 */
const CIRCLE_ENGAGE = 1.6;

/**
 * How hard a circling body is pulled back onto its radius, per world unit it is off it.
 *
 * ⚠️ **Well under 1, or the orbit is a spring.** At 1 a body one unit out is pulled a whole unit
 * back in a single step, which overshoots inward and oscillates in and out forever; the tangential
 * component then turns that wobble into a flower rather than a circle. At 0.08 it converges over
 * about a second and the path reads as a curve.
 */
const CIRCLE_PULL = 0.08;

/**
 * How far ahead of the camera a circling body's orbit is clipped, in world units.
 *
 * ⚠️ **`src/sim/entity.ts` culls anything behind the camera**, so an orbit around a ship the player
 * has flown to the back of its box would retire the toughest body in the game for free. Ten units is
 * clear of the trailing edge and still on screen.
 */
const CIRCLE_FLOOR = 10;

/**
 * How fast a pickup wanders across the lane, in world units per step.
 *
 * Asked for in play: *"power ups and buffs should also have a drifting, moving flight rather than a
 * static straight line."*
 *
 * ⚠️ **Deliberately slower than the ship by a wide margin.** `src/content/pickups.ts` records that
 * the point of a pickup closing at exactly the scroll rate is that the player has a *known* amount
 * of time to decide to go for it — drift is meant to make that decision about a moving target, not
 * to turn taking one into a reflex. At 0.22 it crosses the lane in about seven seconds.
 */
const PICKUP_DRIFT = 0.22;

/**
 * How much of the gap to its target a pickup's `along` speed closes each step.
 *
 * ── WHY A PICKUP DOES NOT SIMPLY STOP ───────────────────────────────────────────────────────────
 *
 * Reported from play: *"power ups hit a wall when they get to the center of the screen and slide
 * up/down it before continuing on."* `docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md`.
 *
 * ⚠️ **The wall was a one-step velocity change and there was nothing there to hit.** `driftPickups`
 * used to *assign* `velAlong`, so on the single step a pickup crossed `PICKUP_STATION` its
 * screen-relative speed went from `SCROLL_PER_STEP` to zero between one frame and the next. Nothing
 * else in this game decelerates — a body either carries a velocity or has it rewritten from its row —
 * so the only picture the player had for it was an impact.
 *
 * ⚠️ **0.06 is about three quarters of a second to settle**, which is `1/0.06` ≈ 17 steps to close
 * 63% of the gap and roughly 45 to close it. Slower would make the station vague; faster is the wall
 * again with a smoother edge on it.
 *
 * ⚠️ **It is also what lets `scatterUpgrades` throw along the scroll axis at all.** A scattered piece
 * spends its `along` speed against this lag, so its whole excursion is `speed ÷ this` — about 11
 * world units — and `docs/decisions/0066-a-death-scatters-what-it-took.md`'s objection that a piece
 * thrown along *"would be off the front or the back of the screen inside two seconds"* stops applying.
 */
const PICKUP_EASE = 0.06;

/**
 * How fast a waiting pickup bobs along the scroll axis, in world units per step at the extreme.
 *
 * ⚠️ **The other half of the wall**, and it is the *"slide up/down it"* half: a pickup holding
 * station has a fixed `along` and a constant `across` drift, which is a straight line down an
 * invisible edge for the whole seven seconds of the wait. A curve is not a line, and that is the
 * entire requirement.
 *
 * At 0.25 against `PICKUP_BOB_UNITS` the pickup wandered about ±6 world units, which is a twentieth of
 * the narrowest view — visible as motion, far too small to move where the pickup *is*.
 *
 * ── AND IT HAD TO RISE WHEN THE THING IT BOBS AROUND STARTED MOVING ─────────────────────────────
 *
 * ⚠️ **0.25 → 0.4** — `docs/decisions/0087-a-pickup-never-parks.md`. What the bob has to beat is no
 * longer zero: a slowed pickup now closes at `PICKUP_CLOSE_SHARE` of the scroll rate, so a swing that
 * does not reach past the camera's own rate makes the track a smooth diagonal rather than a wander.
 * `tests/pickups.test.ts` measures exactly that — **total forward travel**, which no amount of easing
 * can produce — and it went to zero at the old amplitude the day the pickup started closing.
 *
 * ⚠️ **Which is 0077's guard doing its job against a change 0077 never saw.** The bob's whole claim
 * is *it goes both ways*; a constant that satisfied it against a stationary target satisfies it by
 * 0.02 units a step against a moving one, and that is a feature holding on by rounding.
 *
 * ⚠️ **At 0.4 against `Entity.bobPhase`'s corrected period the pickup wanders about ±7.6 world
 * units**, which is a twentieth of the widest view. The old ±6 was arithmetic over a period the code
 * did not actually run at — see `bobPhase`.
 */
const PICKUP_BOB_SPEED = 0.4;

/**
 * The bob's period, in world units of camera travel.
 *
 * ⚠️ **A DISTANCE and not a duration**, which is `src/content/enemies.ts`'s own argument for the
 * weave: a shape in the world can be authored against, a wobble in time cannot, and a machine
 * dropping frames plays the same level. 14 units is a full cycle every `2π × 14 ÷ SCROLL_PER_STEP`
 * steps — about 2.4 seconds.
 *
 * ⚠️ **The phase is offset by the pickup's own `across`**, so two pickups on screen do not bob in
 * unison. That costs no field and no draw, and it is the last thing on the field that still wants
 * pickups to look independent — the CYCLE was the thing that wanted them synchronised, and 0082
 * removed it.
 */
const PICKUP_BOB_UNITS = 14;

/**
 * The most evenly spread angle there is, in radians — `π × (3 − √5)`.
 *
 * ⚠️ **A phase per pickup, so no two of a level's nine bob in step** — 0087. Any rational fraction of
 * a turn repeats after its denominator; this one never does, so the *n*th pickup of a level is as far
 * from all of the others as an *n*th can be. Written out rather than computed so nothing in the frame
 * loop takes a square root.
 */
const GOLDEN_ANGLE = 2.399963229728653;

/**
 * How fast a scattered upgrade is thrown across the lane, in world units per step.
 *
 * ── WHAT A DEATH THROWS AWAY, AND WHERE IT LANDS ────────────────────────────────────────────────
 *
 * Asked for in play: *"when a player dies, their power ups should explode from where they were and
 * bounce around the screen"*, and *"non-cycling and on a short timer so there's enough time to grab
 * some, but maybe not all."* `docs/decisions/0066-a-death-scatters-what-it-took.md`.
 *
 * ⚠️ **This is the half of the dying-is-punishing report that
 * `docs/decisions/0057-a-death-does-not-rewind-the-level.md` deliberately did not answer**, and
 * `docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md` made it cost more in
 * the same session: a death now takes the missiles as well as the pulse upgrades.
 *
 * ⚠️ **ACROSS ONLY, and that is what makes it a scatter rather than a firework.** Every scattered
 * pickup carries the scroll rate along, so it holds the distance the ship died at and spreads out
 * across the lane instead — bouncing off the edges like any other pickup. Thrown along as well, they
 * would be off the front or the back of the screen inside two seconds, which is the opposite of
 * *"enough time to grab some"*.
 *
 * Faster than `PICKUP_DRIFT` by a factor of three, because this one is an event rather than a
 * wander: what it has to read as is *these came off the ship*.
 */
const SCATTER_SPEED = 0.66;

/**
 * How long a scattered upgrade stays on the field, in steps — five seconds.
 *
 * ⚠️ **A SHORT timer and it is the ask's own word**: *"enough time to grab some, but maybe not all."*
 * A respawned ship is invulnerable for two seconds (`RESPAWN_INVULN_STEPS`), so five is that window
 * plus three seconds of flying — long enough to cross the lane twice at `SHIP_SPEED` and nowhere near
 * long enough to collect a full loadout.
 *
 * ⚠️ **It used to be what made a scattered pickup NON-CYCLING as well**, which was the other half of
 * the ask: a lifetime is the one thing an authored pickup never has, so `lifeFor > 0` IS *this is a
 * scattered one*, with no flag and no second field. Nothing cycles since 0082, so that half of the ask
 * is now true of every pickup in the game and this field only says *when it goes*.
 */
const SCATTER_STEPS = 300;

/*
  ── `SCATTER_KEPT` WAS HERE AND IT LASTED ONE PLAY-TEST ──────────────────────────────────────────

  0082 made a death throw back each upgrade on a 50% coin, which was the ask at the time: *"when a
  player dies let's change it to 50% chance of each power up they have collected spawning from their
  death, current implementation means there's not really a cost to dying at all."*

  ⚠️ **It was flown and the verdict was one word.** *"Tested the 50% on death and it's too punishing,
  let's make 100% for weapons and missiles."*
  `docs/decisions/0083-two-ladders-of-four.md`. So a death throws back everything it took, which is
  what `docs/decisions/0066-a-death-scatters-what-it-took.md` built and 0082 briefly amended.

  ⚠️ **The FILTER is deleted rather than set to 1.** A coin that always comes up heads is a mechanism
  nothing can test — its probe would go STILL GREEN, and 0019 is explicit that an unfalsifiable guard
  is worse than none. What survives is `scatterRing`'s explicit `count`, which was written for the
  filter and is worth keeping without it: the ring is spaced over the pieces that actually reach the
  field rather than over the ones the death took, so a pool that truncates leaves a smaller ring
  instead of a gappy one.

  ⚠️ **AND SHIELDS ARE NOT IN THIS AT ALL, which was already true and is now guarded.** *"But no
  shields spawn on death."* A shield lives on the ship's `health`
  (`docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md`) rather
  than in the upgrade list, so it has never been scatterable — `scatterUpgrades` takes `UpgradeKind[]`
  and a shield is not one. `tests/pickups.test.ts` now holds that it stays that way, because *true by
  accident* is one refactor from false.
*/

/**
 * How far a scattered piece's heading may wander from its share of the circle, as a share of the
 * half-gap to its neighbour.
 *
 * ⚠️ **A SHARE rather than an angle, and the difference is the guarantee.** A fixed number of radians
 * is most of the gap at eight pieces and almost none of it at two, so the one thing
 * `docs/decisions/0066-a-death-scatters-what-it-took.md` insisted on — that no two pieces share a
 * heading — would hold or not hold depending on how good the player's run had been. Scaled, the
 * worst case is the same at every count: neighbours keep `2 × (1 − 0.35)` of their nominal gap,
 * which is 65% of it, so they can never swap places and never leave together.
 *
 * ⚠️ **The jitter is the picture and the even term is the guarantee.** Without the first a death
 * looks like a diagram; without the second the player loses a piece to a coincidence, which is one
 * of the upgrades a death took and did not give back.
 */
const SCATTER_JITTER_SHARE = 0.35;

/** The slowest a scattered piece may leave, as a fraction of `SCATTER_SPEED`. */
const SCATTER_SPREAD_MIN = 0.7;

/**
 * The fastest a scattered piece may leave, as a fraction of `SCATTER_SPEED`.
 *
 * ⚠️ **The spread is what makes the ring read as thrown rather than as drawn.** Identical speeds
 * put every piece on the same expanding circle for the whole five seconds, which is a shape and not
 * an event.
 */
const SCATTER_SPREAD_MAX = 1.3;

/**
 * What share of the scroll rate a slowed pickup keeps closing at, so it never parks.
 *
 * ── THE STATION WAS THE BARRIER, AND EASING ONTO IT DID NOT HELP ────────────────────────────────
 *
 * `docs/decisions/0087-a-pickup-never-parks.md`. Reported from play, about the build
 * `docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md` landed in: *"pickups come up fast,
 * still hit the middle barrier and then float a bit."*
 *
 * ⚠️ **0077 fixed the impact and left the wall.** It made the velocity change take three quarters of
 * a second instead of one step — which was real, and which the guards measure — but every pickup
 * still ended up **stopped dead at the same place on the screen**, 100 units ahead of the camera on
 * every device. A shared line that everything arrives at and holds is a barrier whether a body
 * reaches it abruptly or gracefully, and 56% of the way up the view is *the middle of the screen*.
 *
 * ⚠️ **So a waiting pickup keeps coming.** Its target is a fraction of the scroll rate below the
 * camera's own, which in the camera's frame is *still closing, slowly*. There is no place on the
 * screen where pickups stop, because they do not stop.
 *
 * ⚠️ **0.35, and the ceiling is a guard rather than a taste.** `tests/pickups.test.ts` reads *the
 * pickup stopped running away* as **under half the rate it approached at**, written in the player's
 * units and naming no constant here. A share at or above 0.5 is a pickup that never slowed down.
 */
const PICKUP_CLOSE_SHARE = 0.35;

/**
 * Where a pickup stops running away and begins its slow close, in world units ahead of the camera.
 *
 * ── WHY A PICKUP LINGERS AT ALL ─────────────────────────────────────────────────────────────────
 *
 * Reported from play: *"they enter the screen, change when they get to player safe distance, then
 * disappear off the screen. They need to bounce and move around the screen so the player can grab
 * them safely and grab the power up they want safely."* And the complaint underneath it: *"shields
 * are a hundred times more valuable than lives, and nine times out of ten the player is picking up a
 * life or placing themselves in danger to try and get a shield."*
 * `docs/decisions/0064-a-pickup-waits-to-be-taken.md`.
 *
 * ⚠️ **A pickup used to cross the whole view at the scroll rate and leave**, which is about nine
 * seconds of travel — and it spent most of that either beyond the player's reach or already behind
 * them. Slowing down is what turns *catch it as it goes past* into *go and get the one you want*.
 *
 * ── DERIVED, AND IT USED TO BE 100 TYPED IN ─────────────────────────────────────────────────────
 *
 * ⚠️ **The wait is now a JOURNEY, so where it begins is wherever it has to begin to end at the
 * ship** — `docs/decisions/0087-a-pickup-never-parks.md`. A pickup that is never touched spends its
 * whole `PICKUP_LINGER_STEPS` closing at `PICKUP_CLOSE_SHARE`, and this is the distance that covers:
 * it arrives at `SHIP_START_ALONG` — the ship's own place in the camera's frame — on the step its
 * wait runs out. Nobody chose 128; three constants with their own reasons did.
 *
 * ⚠️ **Both bounds are still real and are now GUARDS rather than a sentence.** It has to be inside
 * the narrowest view any device gets, so the approach happens on screen everywhere; and inside the
 * player's own box, which reaches `PLAYER_LEAD` (0080), so the player can fly to it. Deriving it
 * means a tune to the linger or the share can push it past either — `tests/pickups.test.ts` holds
 * both, which a typed constant never needed.
 *
 * ⚠️ **Declared below `SHIP_START_ALONG` rather than here with its neighbours**, because it is
 * computed from it and a `const` cannot be read before it exists. The comment stays with the pickup
 * constants it belongs to.
 */

/**
 * How long a pickup waits once it has arrived, in steps — seven seconds.
 *
 * ⚠️ **THE NUMBER IS UNCHANGED AND THE REASON FOR IT IS GONE.** It was measured against
 * `CYCLE_UNITS` — seven seconds was two and a quarter faces of a cycling pickup, *enough to see the
 * other face, decide, and still have time to take it* — and 0082 removed the cycle. Kept at 420
 * because the other half of 0064's ask stands on its own and is what the report actually said:
 * *"pickups linger"*, so a player crossing the lane for one has time to get there.
 *
 * ⚠️ **It matters MORE than it did, and the guard over it had to be rewritten rather than deleted.**
 * A level offers six pickups instead of twenty (0082), so a pickup the player could not reach in time
 * is no longer one of a stream — it is a sixth of what the level had to give. `tests/pickups.test.ts`
 * now holds the wait against the time it takes to cross the lane, which is the thing the player is
 * actually doing, rather than against a cycle that no longer exists.
 *
 * ⚠️ **EXPORTED so a guard in another decision can name it** —
 * `docs/decisions/0086-the-teeth-wait-for-the-gun.md`. `MULTI_HIT_RUNUP` is how long level one waits
 * before it sends anything tough after the pickup that lifts the clamp, and the only honest statement
 * of *long enough* is *longer than the pickup itself waits to be taken*. Two independent constants
 * agreeing, which `docs/decisions/0027-measure-the-picture-not-the-model.md` allows and a guard
 * written in terms of one of them would not be.
 */
export const PICKUP_LINGER_STEPS = 420;

/**
 * How much wider than the hull the ship's reach is when COLLECTING, as a multiple of its radius.
 *
 * Reported from play: *"power ups are slightly too hard to pick up in size."*
 *
 * ⚠️ **The REACH grows and the SPRITES do not**, which is the whole of why this is a scale here
 * rather than a bigger `radius` on six rows in `src/content/pickups.ts`. A pickup drawn larger is a
 * different picture — 0052 pairs each one with another as a single silhouette in two fills, and
 * `src/content/sprites.ts` already writes down that two of them risk reading alike. Growing the art
 * to fix a collision problem would spend that legibility on something that is not an art question.
 *
 * ⚠️ **It is on the SHIP's radius and applies only to the pickup pairing.** Nothing that can hurt the
 * player is collected, so widening this cannot make the game harder — which is what keeps it clear of
 * `src/sim/assist.ts`, where `hurtbox` shrinks the ship and 0024 forbids an assist that costs
 * anything.
 *
 * ⚠️ **A number the player can check: the reach is `pickup.radius + ship.radius × this`, and at 2.4,
 * 2 and 1.8 that is exactly 6 world units — 6% of the lane**, against 4.4% before.
 * `tests/pickups.test.ts` asserts the lane fraction rather than the multiplier, per
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`: a guard written against the constant it
 * guards would prove only that the code agrees with itself.
 */
const COLLECT_REACH = 1.8;

/**
 * Steps of invulnerability a RESPAWNED ship gets, as opposed to one that has merely been hit.
 *
 * ⚠️ **Two seconds, and it exists because 0057 stopped clearing the field.** `INVULN_STEPS` is 0.75s
 * and is sized for a hit landed mid-flight: the player is already where they chose to be, their hand
 * is on the ship, and they keep flying. A respawn is not that. It hands back a ship the player is not
 * yet holding, at the back of a lane still carrying everything that just killed them — so the number
 * that was right when the field was swept is not the number that is right now.
 *
 * ⚠️ **It is NOT on the assist ladder**, for exactly the reason `src/content/ships.ts` gives for
 * `INVULN_STEPS`: it is part of the one game at the same value for everybody, and
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` keeps that ladder closed.
 *
 * A starting point rather than a measurement — long enough to cross the lane at `SHIP_SPEED` and
 * find a gap, which is the thing it has to buy. `tests/level.test.ts` asserts that it is longer than
 * a hit's and that it covers the lane, never what it is.
 */
const RESPAWN_INVULN_STEPS = 120;

/**
 * How far off the ship's centreline the side launchers sit, in world units.
 *
 * The hull is 7 units across, so this is inside it: the tubes are ON the ship rather than beside it.
 */
const LAUNCHER_ACROSS = 1.8;

/**
 * How far a side launcher's missile drifts out before it straightens, in world units from the ship.
 *
 * Asked for in the ask itself: *"those two pop out before they straighten."*
 *
 * ⚠️ **Wider than the hull and narrower than a dodge.** It has to clear the ship — a missile that
 * straightened while still over the hull would look like it had come out of the middle after all —
 * without becoming a spread weapon: the fan is the pulse's job, and a missile that covered the lane
 * would make position stop mattering.
 */
const LAUNCHER_POP = 5.5;

/**
 * How fast a side missile pops out, in world units per step.
 *
 * ⚠️ It is the same shape as the flanker's entry, and it is deliberately quick: the pop is a piece of
 * punctuation on the firing, not a manoeuvre the player waits through. At 0.55 it is done in ten
 * steps, about a sixth of a second.
 */
const LAUNCHER_POP_SPEED = 0.55;

/**
 * What one landing costs the ship, in health.
 *
 * ⚠️ **The unit the ship's health is counted in, stated once.** The hull is one of these and every
 * shield is one more (`src/content/ships.ts`), which is what makes *"each shield absorbs one hit"*
 * and *"one hit destroys the ship"* the same sentence about the same number.
 */
const ONE_HIT = 1;

/**
 * How long a blast is on screen after it has done its damage, in steps — about a fifth of a second.
 *
 * ⚠️ **The damage lands on ONE step and the picture lasts longer, which is why the two are separate
 * numbers.** A blast that billed every enemy inside it once a step would do ten times what the row
 * says; a blast drawn for one step is a frame the player never sees. So the caller zeroes the
 * damage after the step it landed, and what is left is the picture.
 */
const BLAST_STEPS = 12;

/**
 * How long a boss takes to come apart, in steps — a second and a half.
 *
 * ⚠️ **The level is not over until it has finished.** Reported from play: *"bosses need a real
 * explosion and an end-of-level beat. Currently the level just ends."* It did, on the exact step the
 * pool emptied: a screen went up over the frame and the loudest event in the game happened behind it.
 * `docs/decisions/0062-a-boss-dies-loudly.md`.
 *
 * ⚠️ **The simulation keeps stepping through it**, which is what makes it a beat rather than a pause.
 * The scroll runs on, the player still flies, and whatever the boss had in the air still arrives —
 * a player can still die in the ninety steps after killing it, which is the arcade answer.
 *
 * A starting point on [0037](docs/decisions/0037-the-ship-has-mass.md)'s terms; nothing asserts on it.
 */
const BOSS_DEATH_STEPS = 96;

/**
 * Steps between one pulse of the boss's explosion and the next.
 *
 * ⚠️ **It is what turns `BURST.boss` from a number of fragments into a number ON SCREEN**, and the
 * ceiling is the debris pool: `BURST.boss × BURST.lifeMax / this` has to stay under it, or the
 * loudest moment in the game is the one where `src/sim/pool.ts` starts dropping bursts.
 * `tests/budget.test.ts` holds that sum.
 */
const BOSS_PULSE = 5;

/**
 * How long the player's ship takes to come apart, in steps — about eight tenths of a second.
 *
 * ── WHY A DEATH IS A BEAT AT ALL ────────────────────────────────────────────────────────────────
 *
 * Reported from play: *"when a player dies, they instantly respawn, there needs to be the player ship
 * explosion, a pause, then a respawn. This also needs to happen before the 'continue' screen shows up
 * as well."*
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.
 *
 * ⚠️ **Both halves of that report were one cause: the explosion, the scatter, the lost life and the
 * new ship all happened on one step.** The player never saw the death, because the replacement was
 * already there on the next frame drawn — and on the last life the overlay went up before the burst
 * had drawn a single one.
 *
 * ⚠️ **Half a boss's, and the halving is the argument.** `BOSS_DEATH_STEPS` is 96 and is sized for a
 * thing coming apart at the end of a level, which the player watches once. A death is a smaller event
 * and the player is WAITING through it — every one of them, several times a run — so the number that
 * is right for a boss is roughly twice the number that is right here. It is not derived from
 * `BOSS_DEATH_STEPS`, because the two answer different questions and the day one moves the other
 * should not follow it.
 *
 * A starting point on `docs/decisions/0037-the-ship-has-mass.md`'s terms; nothing asserts on it. What
 * `tests/death.test.ts` holds is stated in the player's units — that the ship is off the screen for
 * more than half a second, and that the continue screen does not appear on the step the last life is
 * lost.
 */
const DEATH_STEPS = 48;

/**
 * Steps between one pulse of the ship coming apart and the next.
 *
 * ⚠️ **It is what turns `BURST.dying` from a number of fragments into a number ON SCREEN**, and the
 * ceiling is the debris pool — `BURST.dying × BURST.lifeMax / this` has to stay inside it, with room
 * left for the pyre's kills. `tests/budget.test.ts` holds that sum beside the boss's.
 */
const DEATH_PULSE = 8;

/**
 * How far from the ship's centre a shield mark orbits, in world units.
 *
 * The ship is 7 units across, so this puts the shell clear of the hull with a visible gap — close
 * enough to read as *worn* rather than as a formation flying alongside.
 */
const SHIELD_ORBIT = 5.6;

/**
 * How fast the shell turns, in radians per world unit the CAMERA travels.
 *
 * ⚠️ **A function of the camera and not of a step count, for the reason `src/content/enemies.ts`
 * gives about the weave**: a shape in the world can be authored against and a wobble in time cannot.
 * It also means the shell is stationary on screen when the game is not scrolling, which is what
 * everything else the player watches does.
 *
 * At the scroll rate this is a turn every eight seconds or so — slow enough that it never competes
 * with the lane for attention, fast enough that a mark hidden behind the hull comes back out.
 */
const SHIELD_SPIN = 0.02;

/**
 * Where the ship sits in its box, in world units ahead of the camera's trailing edge.
 *
 * Exported because `mount.ts` places the ship at boot and this file places it again on a restart, and
 * two descriptions of one position drift the first time either moves.
 */
export const SHIP_START_ALONG = 40;

/**
 * Where a pickup stops running away and begins its slow close — the declaration for the comment
 * three hundred lines above, which is where it belongs among the other pickup constants.
 *
 * `SHIP_START_ALONG + PICKUP_LINGER_STEPS × PICKUP_CLOSE_SHARE × SCROLL_PER_STEP` — the distance a
 * waiting pickup covers before its wait runs out, measured back from the ship.
 * `docs/decisions/0087-a-pickup-never-parks.md`.
 */
const PICKUP_SLOW_AT = SHIP_START_ALONG + PICKUP_LINGER_STEPS * PICKUP_CLOSE_SHARE * SCROLL_PER_STEP;

/**
 * How long a body shows a hit it survived, in steps — four, about 67ms.
 *
 * ⚠️ **IT HAS TO END BEFORE THE NEXT HIT CAN LAND, and at 8 it did not.** Measured against the real
 * frame at the real fire rate: successive shots connect on the same enemy **6 to 7 steps apart**
 * (100–117ms) at every distance, because the gap between shots in flight is fixed and the closing
 * speed is what turns it into a time. A flash of 8 steps therefore never finished — a lancer went
 * white once and died still white, and the second hit was invisible because it landed inside the
 * first one's flash.
 *
 * That is the whole of *"sometimes they'd get hit, go white, then need a second shot and other times
 * they appeared to just die straight away"*: the player could not count hits, because two hits and
 * one hit produced the same picture. `reports/enemy-legibility-2026-08-05.md`.
 *
 * ⚠️ **The relationship is guarded, the number is not.** `tests/combat.test.ts` drives the real
 * frame and asserts the flash has ENDED before the next shot connects, which is a property that must
 * hold at any fire rate and any flash length. Raising the fire rate later will fail it, correctly.
 *
 * ⚠️ **The ship's recovery is a SEPARATE signal** and it is the blink `src/sim/entity.ts` derives
 * from `invulnFor`. This was briefly one number doing both — the ship's flash set to the whole
 * invulnerable window — and a play-test said the blink was better. An impact is an event; being
 * briefly safe is a state; a state that does not pulse looks like a colour change.
 *
 * ⚠️ `docs/decisions/0024-the-accessibility-floor-is-settings.md` caps flash intensity
 * unconditionally. This is one silhouette in two inks, never a full-screen flash, which is the side
 * of that line it is meant to be on.
 */
const IMPACT_FLASH_STEPS = 4;

/** Everything a frame reads. Mutable, set up once, and updated on a resize — never reducer state. */
export interface World {
  /**
   * Every pool, in draw order, back to front. Built once at mount.
   *
   * ⚠️ **Order is a decision here and nothing else enforces it.** The ship is last so the player can
   * always find it; shots sit above the enemies that fired them so a volley leaving a body reads as
   * leaving it. `src/sim/pool.ts` warns that release REORDERS, so nothing may depend on order
   * *within* a layer — between layers, this array is the whole statement.
   */
  layers: readonly Pool<Entity>[];
  /**
   * The background, back to front. Built once at mount; empty for a scene that has none.
   *
   * ⚠️ **Not entities, and that is the whole of
   * `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.**
   * `CAPACITY` in `src/app/mount.ts` totals 0022's 500-entity worst case exactly, so a starfield made
   * of bodies would come out of the pools that hold bullets.
   */
  sky: Sky;
  /**
   * The edge of the player's box, drawn — or `null` for a scene that does not show one.
   *
   * ⚠️ **Built once at mount and never here**, exactly like `sky`: a literal at the call site would
   * allocate sixty times a second, which is the one thing this file is scanned for.
   *
   * ⚠️ **It is not a rule and cannot become one.** `src/sim/flight.ts` clamps the ship, and this is a
   * picture of the number that does it — handed the same `PLAYER_LEAD` rather than a copy of the
   * subtraction. `docs/decisions/0074-the-box-is-drawn.md`.
   */
  bound: Bound | null;
  /** The player's ship, alone in its own pool so that death is a release and a respawn. */
  shipPool: Pool<Entity>;
  /**
   * The shell: one orbiting mark per shield the ship is carrying.
   *
   * ⚠️ **In no collision pairing, exactly like debris.** A shield absorbs a hit because the ship's
   * `health` is the hull plus the shell (`src/content/ships.ts`), and the collision that already
   * exists takes it off. These are the PICTURE of that number and nothing else — a mark with its own
   * hurtbox would be a second answer to *what did this hit*, and the two would disagree the first
   * time a bullet passed between two marks.
   *
   * ⚠️ **Its own pool rather than three fields on the ship**, so the painter draws them the way it
   * draws everything — one blit per entity, interpolated between two positions — with no branch
   * anywhere in `src/render/` about what a ship is wearing.
   */
  shieldOrbs: Pool<Entity>;
  enemies: Pool<Entity>;
  /** What the player fired. Separate from `enemyShots` because the PAIRING is the collision guard. */
  playerShots: Pool<Entity>;
  /**
   * The player's missiles.
   *
   * ⚠️ **A pool of their own rather than more `playerShots`, and the reason is exhaustion rather
   * than collision.** They meet exactly the same two pools the pulses do, so a shared pool would
   * cost one pairing fewer — and a full volley of pulses would then starve the missiles, which is
   * precisely the failure `src/content/pickups.ts` records reaching play as *"two streams
   * continuous and the others stutter"*. A weapon with its own budget cannot be crowded out by the
   * other one.
   */
  missiles: Pool<Entity>;
  enemyShots: Pool<Entity>;
  /**
   * Fragments. In no collision pairing, which is what makes them cosmetic in fact.
   *
   * ⚠️ They claim 0022's unspent particle share of the worst-case scene — see
   * `src/content/debris.ts`. They are also the only pool whose members retire on a timer.
   */
  debris: Pool<Entity>;
  /** Where enemies died this step, so a burst can be put there. Reused, never rebuilt. */
  deaths: Deaths;
  /**
   * The burst stream, and it is SEPARATE from `rng` on purpose.
   *
   * `docs/decisions/0021-one-stream-per-concern.md`: one shared generator couples every draw to
   * every draw before it, so a cosmetic roll added anywhere rebuilds every level. This is the exact
   * case it warns about — a fragment's direction is the most cosmetic roll in the game, and it must
   * not be able to move a wave by one enemy.
   */
  burstRng: Rng;
  /**
   * The scatter stream, and it is separate from `burstRng` for the opposite reason `burstRng` is
   * separate from `rng`.
   *
   * ⚠️ **A scattered piece's heading is NOT cosmetic**, which is the whole distinction
   * `docs/decisions/0021-one-stream-per-concern.md` turns on. Which pieces a player can reach in the
   * five seconds a scatter lasts is the entire cost of a death
   * (`docs/decisions/0066-a-death-scatters-what-it-took.md`), so it must not share a generator with
   * a fragment's direction — a burst added to a new explosion somewhere would otherwise deal a
   * different death.
   */
  scatterRng: Rng;
  view: View;
  surface: Surface;
  /** The spawn stream, named per 0021 — a cosmetic roll added later must not move a wave. */
  rng: Rng;
  /** World units the camera has travelled. */
  cameraAlong: number;
  /**
   * Where the camera was at the end of the previous step.
   *
   * ⚠️ **The camera has to interpolate too, and the reason is not symmetry.** Entities are drawn
   * `alpha` of the way between their two positions while the camera sat at its stepped value, so
   * `entity − camera` wobbled by up to a full step of camera travel every frame — about 4px here.
   * An entity holding station *exactly* in world units still juddered on screen.
   *
   * Found by `scripts/trace-frame.mjs` on its first run, and findable no other way: the model was
   * perfect, so every assertion in the suite was green. This is
   * `docs/decisions/0027-measure-the-picture-not-the-model.md`'s whole subject, in miniature.
   */
  prevCameraAlong: number;
  /** World units the camera advances per fixed step. */
  scrollPerStep: number;
  /**
   * The level being played — its wave script, and what waits at the end of it.
   *
   * ⚠️ **The camera is the clock.** A wave carries the camera distance it spawns at, so the level
   * plays at the same pace on every device and in a headless test, and a dropped frame costs the
   * player nothing. `src/content/levels.ts` has the reasoning; the fixed step
   * (`docs/decisions/0022-frame-rate-is-a-feature.md`) is what makes distance and time the same
   * statement.
   */
  level: LevelRow;
  /**
   * The camera distance this level's script is measured from.
   *
   * ── WHY A LEVEL HAS AN ORIGIN, WHICH IT DID NOT UNTIL NOW ───────────────────────────────────────
   *
   * Reported from play: *"there's a background scene reset between levels that's disjointing because
   * it moves the player's ship, the level change needs to be seamless."*
   * `docs/decisions/0076-a-level-has-an-origin.md`.
   *
   * ⚠️ **The camera reset was load-bearing and could not simply be deleted.** `resetScene` says why:
   * *"distance travelled is the only clock a level has — a wave table places its content against
   * `cameraAlong` — so a second run that started where the first one ended would be playing a
   * different level with the same name."* That is true, and it is an argument for the script being
   * measured from somewhere rather than for the camera going back to zero.
   *
   * So the script is read in LEVEL coordinates and this is the offset. A run that begins sets it to
   * zero along with the camera; a level boundary sets it to wherever the camera has got to and
   * touches nothing else. Two runs of the same level are still the same level, because what a wave
   * is authored against is its distance from the level's own start.
   */
  levelOrigin: number;
  /**
   * Which level of the run this is, counting from zero.
   *
   * ⚠️ **Carried rather than derived, and the derivation was tried first.** `LEVEL_KINDS.indexOf` over
   * `LEVELS` would find it for a real level and return −1 for every test fixture, which is a dial of
   * zero in exactly the worlds that exercise it. `src/app/lifecycle.ts` already computes this index to
   * pick the row, so it is handed over rather than recovered.
   *
   * ⚠️ **It is the only thing on the world that knows a level is part of a SEQUENCE.** Everything else
   * here reads one script; the dial is the first mechanism that cares which one it is —
   * `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`.
   */
  levelIndex: number;
  /**
   * How many `weapon` pickups this level has put on the field so far. Reset with the script.
   *
   * ⚠️ **OFFERED rather than held, which is the whole of why the dial can sawtooth** —
   * `src/content/difficulty.ts`'s `dialFor` has the argument. Held upgrades cross a level boundary
   * (0039) and would carry their notches with them.
   *
   * ⚠️ **Counted here rather than by walking `level.pickups` up to `nextPickup`.** That walk is O(n)
   * at every read and this is read at every wave spawn; a counter incremented at the one place a
   * pickup is placed costs nothing and cannot disagree with itself.
   */
  weaponsOffered: number;
  /** Index of the next wave in `level.waves` that has not spawned yet. Only ever goes up. */
  nextWave: number;
  /** Index of the next pickup in `level.pickups`. Its own index, because the two lists interleave. */
  nextPickup: number;
  /** What is lying about, waiting to be flown into. In no pairing that can hurt anything. */
  pickups: Pool<Entity>;
  /** Pickup rows in `PICKUP_KINDS` order, so an entity's opaque `kind` reads back as a name. */
  pickupRows: readonly PickupRow[];
  /** Which index each authored pickup kind is, built once at boot. */
  pickupKinds: Record<PickupKind, number>;
  /*
    ⚠️ **`pickupCycle` and `pickupFlipped` were two more fields here, and 0082 removed both.** They
    were what let a pickup be drawn as one kind and collected as another on the same step, which is
    the hardest thing 0052 had to get right and the reason `tests/cycling.test.ts` existed. Nothing
    on the field changes what it is any more, so an entity's `kind` is the whole answer.
  */
  /** What was collected this step. Reused, never rebuilt. */
  collected: Collected;
  /*
    ⚠️ **`scattered` WAS A FIELD HERE AND IT LASTED ONE DAY.** It was the scratch buffer 0082's 50%
    coin needed: the survivors had to be counted before the ring could be spaced over them, and this
    file is one of `docs/decisions/0022-frame-rate-is-a-feature.md`'s hot files, so the copy could not
    be an array built per death. 0083 threw the coin away — *"too punishing"* — and a buffer with
    nothing to filter into is a field that only makes the world bigger.
  */
  /**
   * The ship flew into something.
   *
   * ⚠️ Reported rather than decided, like `onDeath` and `onCleared`. What a pickup is WORTH is
   * `src/state/`'s business — an extra life and an upgrade land in different fields and are cleared
   * by different events.
   */
  onPickup: (kind: PickupKind) => void;
  /**
   * The ship's health as the chrome last drew it.
   *
   * ⚠️ **A remembered value rather than a per-frame read, so the HUD costs nothing on the frames
   * where nothing happened.** A shield readout that rewrote the DOM sixty times a second would be the
   * one thing in the game allowed to touch layout in the hot path.
   */
  shownHealth: number;
  /**
   * The ship's health changed.
   *
   * Fired only on a change — a few times a second at worst — so the chrome can be written as ordinary
   * DOM code rather than as something that has to be cheap.
   */
  onHealth: (health: number) => void;
  /**
   * The resolved auto-fire, recomputed by the shell whenever the run's upgrade list changes.
   *
   * ⚠️ **Resolved once per change, not once per step.** `weaponFor` walks the whole upgrade list,
   * which is the right shape for a pure function of saved state and the wrong thing to do sixty
   * times a second — and this file may not allocate, so it could not build the result anyway.
   */
  weapon: Weapon;
  /** The boss's row, resolved once at boot so a step never looks a kind up by name. */
  bossRow: BossRow;
  /** The boss, alone in its own pool — so `playerShots` meeting it is its own pairing. */
  bossPool: Pool<Entity>;
  /** Whether the boss has been put on the field. Set once; cleared only by a fresh run. */
  bossSpawned: boolean;
  /** Whether the boss has been beaten, so the beat below is started exactly once. */
  bossBeaten: boolean;
  /**
   * Steps left of the boss coming apart, or `0` when nothing is exploding.
   *
   * ⚠️ **The level is reported cleared when this reaches zero, not when the pool empties** —
   * `docs/decisions/0062-a-boss-dies-loudly.md`. `bossBeaten` is still the latch; this is the beat.
   */
  clearedIn: number;
  /** Where the boss is, ahead of the camera — remembered every step, read on the step it dies. */
  bossOffset: number;
  bossAcross: number;
  /**
   * Steps left of the player's ship coming apart, or `0` when nothing is dying.
   *
   * ⚠️ **The life is reported spent when this reaches zero, not when the hull does** —
   * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`. Everything a
   * death COSTS is `onDeath`'s, and `onDeath` now fires at the end of the beat rather than on the step
   * the health hit zero, which is what puts the explosion in front of the continue screen.
   *
   * ⚠️ **It is NOT the gate on whether there is a ship.** `shipPool.size === 0` is that, and it is a
   * fact the pool already holds — a second field saying the same thing is the shape of drift
   * `src/sim/entity.ts` argues against three times over. This is only the clock.
   */
  dyingIn: number;
  /**
   * Where the ship died, as an offset AHEAD OF THE CAMERA rather than as a world position.
   *
   * ⚠️ **The mistake `docs/decisions/0062-a-boss-dies-loudly.md` documents having made, avoided
   * here.** The camera covers about 27 world units during the beat, so a world position would put the
   * explosion — and the scatter that follows it — visibly behind where the player watched the ship
   * come apart. `bossOffset` exists for the identical reason and says so.
   */
  deathOffset: number;
  deathAcross: number;
  /** Which way the boss is currently sliding across the lane: −1 or 1. */
  bossPatrol: number;
  /**
   * The boss died, so the level is over.
   *
   * ⚠️ Reported rather than decided, exactly as `onDeath` is. What clearing a level is worth belongs
   * to `src/state/`, not to the file that moves the bodies.
   */
  onCleared: () => void;
  /**
   * Fixed steps the sim has run since the run began. **The sim's own clock.**
   *
   * ── WHY THIS EXISTS AND WHY IT IS NOT `cameraAlong / scrollPerStep` ─────────────────────────────
   *
   * `docs/decisions/0094-in-time-is-not-in-phase.md`. The auto-fire is a metronome the player cannot
   * switch off (`src/content/actions.ts`), and 0093 put its cadence on musical values — but a cadence
   * is a RATE and what makes a metronome land on the beat is a PHASE. This is the number the phase is
   * measured from, for the gun and for the music both.
   *
   * ⚠️ **The camera is described as the clock and cannot be used as one here.** *"The camera is the
   * clock"* (`level` below) is about PACE — a wave spawns at a camera distance so a level plays the
   * same on every device — and it is true because the scroll rate happens to be constant. It is a
   * distance that equals a time, not a time: the day a level scrolls faster, every phase in the game
   * would move with it. `SCROLL_PER_STEP` is also 0.6, so `cameraAlong / scrollPerStep` is a float
   * division that is not exactly an integer after a few thousand steps, and a phase is a modulo.
   *
   * ⚠️ **It counts a RUN and not a level**, because 0076 made a level boundary a change of script
   * rather than a change of scene — the music does not stop there and neither does the beat.
   */
  steps: number;
  /** Steps until the ship's auto-fire goes again. */
  fireIn: number;
  /** Steps until the ship's missiles go again. Their own clock, because their own cadence. */
  missileIn: number;
  /**
   * What the player has thrown, and what it turns into.
   *
   * ⚠️ **Two pools rather than one**, because the thing that flies and the thing that hurts are
   * different bodies: one is in no pairing at all and the other is in three. Reusing one pool would
   * mean a body whose pairings change halfway through its life, which is a rule nothing else in this
   * game has and nothing here would enforce.
   */
  bombs: Pool<Entity>;
  blasts: Pool<Entity>;
  /**
   * The player asked to trigger the special in slot `slot`.
   *
   * ⚠️ **Reported rather than decided, exactly as `onDeath` and `onPickup` are.** Whether there is a
   * charge left, and what spending one costs, is `src/state/`'s business — this file cannot see the
   * run and must not learn to. The shell answers by calling `launchSpecial`.
   */
  onSpecial: (slot: number) => void;
  /** The player's ship. Held live in its pool; this is the same object. */
  ship: Entity;
  /** What the ship is, so a respawn restores it without a second description of its numbers. */
  shipRow: ShipRow;
  /**
   * Enemy rows, indexed by an entity's `kind`. Built once at boot from `ENEMY_KINDS`.
   *
   * ⚠️ **An array rather than the `Record`, so a per-step lookup is an index and not a string key.**
   * Same argument `src/render/surface.ts` makes for the sprite being a number.
   */
  enemyRows: readonly EnemyRow[];
  /**
   * Which index in `enemyRows` each authored kind is, built once at boot.
   *
   * ⚠️ A level names its enemies in words, because a script written in array indices is a script
   * nobody can read or review. This is the one place that word becomes the number the entity carries
   * — and it is resolved at boot rather than per spawn, so a wave costs a property read.
   */
  enemyKinds: Record<EnemyKind, number>;
  /** What the model's numbers currently are — `docs/decisions/0024-…`'s assists, resolved. */
  tuning: Tuning;
  /**
   * How hard this run is, resolved once when it begins.
   *
   * ⚠️ **A different axis from `tuning`, and the two must never merge.**
   * `docs/decisions/0024-the-accessibility-floor-is-settings.md` closes the assist ladder with *no
   * assist may ever make the game harder*, and `src/sim/assist.ts` proves the whole product of
   * settings monotone against that. A tier is chosen in order to be harder, so it cannot live there
   * — `docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md`.
   *
   * ⚠️ **Applied at SPAWN, never per step.** Health, closing speed and the fire gap are written onto
   * the entity when it is put on the field, exactly as its row's numbers are; the only thing this is
   * read for during a step is the speed of a shot leaving something.
   */
  difficulty: DifficultyRow;
  /**
   * What the boss on the field started with, after the tier scaled it.
   *
   * ⚠️ **Its row's `health` is no longer the answer**, and a phase is a fraction of remaining
   * health — so a boss with a tier's toughness applied would otherwise open in its final phase and
   * stay there, which is a completely reasonable-looking fight that is wrong from the first frame.
   */
  bossFullHealth: number;
  /** Where devices are read. Sampled exactly once per fixed step — see 0030. */
  input: InputSource;
  /** This step's ask. One instance, overwritten in place; never allocated in a frame. */
  intent: Intent;
  /**
   * Whether the simulation advances. Set by the shell from the current screen's `steps`.
   *
   * ⚠️ **The frame stops STEPPING and keeps DRAWING**, which is the opposite of what the rotate gate
   * does and is right for a different reason. The gate hides a view that would be actively
   * misleading; a game-over screen sits over the wreck that explains itself, and
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` is the rule that
   * the picture has to keep saying what happened.
   */
  stepping: boolean;
  /**
   * The ship came apart. Fired on the step its health reached zero, once per death.
   *
   * ── THE FIRST OF THE TWO HALVES A DEATH IS NOW SPLIT INTO ───────────────────────────────────────
   *
   * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`. This is *the
   * wreck exists now*; `onDeath` below is *the life is spent*, and they are `DEATH_STEPS` apart.
   *
   * ⚠️ **It exists because the ARSENAL is `src/state/`'s and the beat is this file's.** The player
   * asked for the ship's unspent bombs to go off where it died — the frame cannot see the arsenal
   * (0015, 0039) and the reducer that empties it is the same dispatch that raises the continue
   * screen, so a shell told only at the END of the beat would be told after the charges were gone.
   * This is the report that arrives while they are still there, and `detonateArsenal` is the half of
   * the answer that moves an entity.
   *
   * ⚠️ **Reported rather than decided, exactly as `onDeath` and `onCleared` are.** Nothing here knows
   * what an arsenal is or how big a ring one buys.
   */
  onWreck: () => void;
  /**
   * The ship's death is FINISHED — the beat has played out and the life is now spent.
   *
   * ⚠️ **The frame reports it and decides nothing.** What a death costs is
   * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`'s subject and it lives in
   * `src/state/` — this file cannot know whether a life remains, and the version that did know was
   * the `restart()` placeholder this replaced.
   *
   * ⚠️ **IT NO LONGER FIRES ON THE STEP THE HULL REACHED ZERO, and that is the whole of the
   * continue-screen half of 0079.** `src/state/root.ts` raises the run-over screen off the `lifeLost`
   * dispatch this callback makes, so for as long as the two were the same step the overlay went up
   * before the explosion had drawn a frame. Moving this to the end of the beat fixes both halves of
   * the report with one line, which is why 0079 is one decision and not two.
   */
  onDeath: () => void;
  /**
   * A fixed step happened and the simulation did not take it.
   *
   * ⚠️ **The screens with chrome on them are exactly the screens the simulation is stopped on**
   * (`src/state/screens.ts`), and until now that meant nothing ran there at all — including
   * `w.input.contribute`, which is why a gamepad could not press a button.
   * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md` has the diagnosis.
   *
   * ⚠️ **It is handed a step, never a clock.** The loop is what decides how many of these there
   * were; a countdown on a menu is therefore counted in the same fixed units as everything else in
   * the game, and a throttled tab does not run it fast.
   *
   * Reported rather than decided, exactly as `onDeath` and `onCleared` are: what a menu step is
   * WORTH — moving a focus ring, expiring a screen — belongs to the shell.
   */
  onIdle: () => void;
  /**
   * Something happened that the player should hear.
   *
   * ── REPORTED, LIKE EVERY OTHER EVENT THIS FILE KNOWS ABOUT ──────────────────────────────────────
   *
   * ⚠️ **Reported rather than decided, exactly as `onDeath`, `onPickup` and `onCleared` are** — and
   * here the distinction is load-bearing rather than tidy. Whether the player has sound switched on is
   * a SETTING, and `docs/decisions/0024-the-accessibility-floor-is-settings.md` forbids the step from
   * seeing one: *"a player who turns the flashing down must not thereby be playing an easier game."*
   * This file says *a shot was fired*; `src/app/sound.ts` decides whether anything comes out, and
   * `tests/sound.test.ts` scans to prove this file cannot see `src/content/sound.ts`.
   *
   * ⚠️ **A cue is emitted only where a PICTURE is emitted too** —
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` and 0024's *no
   * information by audio alone*. Every call below sits beside the line that makes the thing visible:
   * where the shot spawns, where the burst is put, where the readout moves. A cue with no picture
   * beside it is the bug this arrangement exists to make obvious in review.
   *
   * ⚠️ **A dropped spawn is a silent cue, and that is deliberate.** The calls are placed AFTER the
   * `null` check on a pool, so a volley the pool refused makes no noise — the screen shows nothing
   * either, and a sound for a bullet that does not exist is the exact inverse failure 0036 names.
   */
  onCue: (kind: CueKind) => void;
  /**
   * A fixed step happened, whether or not the simulation took it.
   *
   * ⚠️ **NOT a second `onIdle`, and the difference is the whole of decision 0063.** `onIdle` answers
   * *the simulation did not step*, which is where the menu pad is read; this answers *a step
   * happened*, which is where a screen's countdown is spent. They were the same question for as long
   * as every screen with chrome on it also stopped the world — the level break is a screen that does
   * not, and its countdown has to run anyway.
   *
   * ⚠️ **Reported rather than decided**, exactly as `onDeath`, `onPickup` and `onIdle` are: what a
   * step is WORTH to a screen belongs to the shell.
   */
  onTick: () => void;
}

export class GameFrame implements Frame {
  constructor(private readonly world: World) {}

  step(): void {
    const w = this.world;
    /*
      ⚠️ **EVERY step, on both sides of the branch below** — `docs/decisions/0063-a-level-break-is-a-respite.md`.
      `onIdle` answers *a step happened and the simulation did not take it*, which was the same
      question as *is a screen counting down* for exactly as long as every screen with chrome on it
      also stopped the world. The level break is a screen that does not, so the two questions came
      apart and the countdown moved here.
    */
    w.onTick();
    /*
      A screen that does not step, per `src/state/screens.ts`. The draw below still runs, so the
      scene the run ended in stays on the page underneath the overlay.

      ⚠️ **It is not a step that does NOTHING, and that distinction is the whole of decision 0046.**
      The chrome on top of the frozen scene has controls on it, and the one device the DOM cannot
      deliver to them is the gamepad. This is the step that reaches it.
    */
    if (!w.stepping) {
      w.onIdle();
      return;
    }
    /*
      ⚠️ **THE SIM'S OWN CLOCK, and it ticks HERE rather than at the top of `step`** — 0094. A step
      the run is not stepping (`w.stepping` above) is a step in which nothing the player is watching
      moved, and counting it would advance the beat while the death beat holds the world still. What
      is being counted is *steps of the game*, which is the thing the gun and the music both have to
      agree with.
    */
    w.steps++;
    w.prevCameraAlong = w.cameraAlong;
    w.cameraAlong += w.scrollPerStep;

    // ⚠️ ONCE PER STEP, before anything reads it. `contribute` drains the press counts, so calling
    // it twice would report the second call's specials as zero — correct, and not what any caller
    // wants. The fixed step is what makes "once" a well-defined amount of input (0030).
    //
    // This is the COMBINER (`src/app/devices.ts`), which is the one source that zeroes the intent
    // before the real devices add to it. Handing this a bare device would leave last step's axes in
    // place the moment the player let go.
    w.input.contribute(w.intent);
    /*
      ── IS THERE A SHIP? ────────────────────────────────────────────────────────────────────────

      `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`. For the length
      of a death beat there is not: the ship is released from its pool, so it is not drawn, and every
      line below that touches it has to say what it does about that.

      ⚠️ **The POOL is the gate, never a flag.** *There is no ship* is a fact `shipPool` already
      holds, and a boolean beside it would be a second answer that the first one is free to disagree
      with — which is the argument `src/sim/entity.ts` makes three times over for `steerAcross`,
      `holdFor` and `turnsLeft`. Read once here, because it cannot change during a step: the only
      thing that releases the ship is the death check at the bottom, and the only thing that puts it
      back is `respawn`, which the shell calls from `onDeath` after everything below has run.

      ⚠️ **The one gate that matters is the collision.** A dead ship left in its pairings goes on
      taking hits, so `health` walks further negative and `health <= 0` fires again every step:
      repeated bursts, repeated beats, and a life lost per step until the run is over.
    */
    const flying = w.shipPool.size > 0;
    if (flying) flyShip(w.ship, w.intent, w.cameraAlong, w.scrollPerStep);

    /*
      ⚠️ **A wreck does not fire and does not throw.** `askSpecials` is gated with the two weapons
      rather than left to the shell, because the shell's answer to a press is `launchSpecial`, which
      spawns at the ship's muzzle — a bomb thrown from a ship that is not there, out of a charge the
      death is about to take anyway.
    */
    if (flying) {
      askSpecials(w);
      fireShip(w);
      fireMissiles(w);
    }
    steerMissiles(w);
    steerEnemies(w);
    driftPickups(w);
    fireEnemies(w);
    driveBoss(w);

    // The ship's `velAlong` carries the scroll rate as its baseline, so `stepEntities` moves it with
    // the camera and a player asking for nothing holds station. An enemy carries its own closing
    // speed and nothing else, which is what makes the world appear to move past it.
    stepEntities(w.shipPool, w.cameraAlong);
    stepEntities(w.pickups, w.cameraAlong);
    stepEntities(w.bossPool, w.cameraAlong);
    stepEntities(w.enemies, w.cameraAlong);
    // ⚠️ The one pool with its own leading cull, and it is the player's REACH rather than content —
    // `src/sim/camera.ts` has the play report that argues it.
    stepEntities(w.playerShots, w.cameraAlong, cullPlayerShotAlong(w.cameraAlong, w.view.alongSpan));
    // The same cull as the pulses: a missile is the player's reach too, and *you can shoot what you
    // can see* is one promise rather than one per weapon — 0048.
    // Before the pools step, so a bomb that reaches its fuse this step leaves a blast where it was
    // rather than one step further on.
    stepBombs(w);
    stepEntities(w.bombs, w.cameraAlong, cullPlayerShotAlong(w.cameraAlong, w.view.alongSpan));
    stepEntities(w.blasts, w.cameraAlong);
    stepEntities(w.missiles, w.cameraAlong, cullPlayerShotAlong(w.cameraAlong, w.view.alongSpan));
    stepEntities(w.enemyShots, w.cameraAlong);
    stepEntities(w.debris, w.cameraAlong);

    /*
      THE PAIRINGS, written out. Each line names two sides that can meet, which is what makes the
      collision cost the product of two small pools rather than the square of one big one — see
      `src/sim/collide.ts`.

      ⚠️ The player's two arguments are the assists, and this is the first place in the game that
      `src/sim/assist.ts` reaches the model at all. `tests/assist.test.ts` proved the TABLE was
      monotone; `tests/combat.test.ts` is what proves the code using it is.
    */
    w.deaths.count = 0;
    /*
      ⚠️ **The two numbers below exist so a SURVIVED hit can be heard, and there is no third way to
      know about one.** `collideInto` returns what it destroyed and logs where; a hit that was
      survived is reported by neither — its only trace is the flash it wrote onto the body
      (`src/sim/collide.ts`), which nothing else reads back. So the arithmetic is: a player shot is
      released exactly when it arrives, and an arrival either killed or did not.

      ⚠️ **Counted here rather than added to `Deaths` as a second log.** `sim/` may import `brand` and
      nothing else, so a survivals log would be one more out-parameter threaded through the densest
      loop in the game to serve a sound — and the two pool sizes already say it exactly.
    */
    const inFlight = w.playerShots.size + w.missiles.size;
    let killedByShots = 0;
    killedByShots += collideInto(w.playerShots, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths);
    killedByShots += collideInto(w.missiles, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths);
    // The boss is its own pairing rather than another enemy, and the reason is the pool: it is the
    // only body in the game that must survive a hundred and fifty hits, so it cannot share a pool
    // with things that are released after one.
    killedByShots += collideInto(w.playerShots, w.bossPool, 1, 1, IMPACT_FLASH_STEPS, w.deaths);
    killedByShots += collideInto(w.missiles, w.bossPool, 1, 1, IMPACT_FLASH_STEPS, w.deaths);
    // An area rather than an arrival: everything inside it, once, and nothing consumes it.
    blastInto(w.blasts, w.enemies, 1, IMPACT_FLASH_STEPS, w.deaths);
    blastInto(w.blasts, w.bossPool, 1, IMPACT_FLASH_STEPS, w.deaths);
    // The impact flash's twin. An arrival that did not kill is a body that went white and stayed.
    if (w.playerShots.size + w.missiles.size < inFlight - killedByShots) w.onCue('hit');
    /*
      The debris burst's twin, and it is skipped on the one step the boss dies.

      ⚠️ **Not because two cues would be wrong, but because the CAP would then decide which one the
      player hears.** `src/app/sound.ts` allows four voices a step and drops the rest, and the boss's
      cue is emitted at the bottom of this step — behind the pulse, the threat and the hit. So the
      loudest event in the game is the one the ceiling would eat. `tests/sound.test.ts` drives a real
      boss death and asserts it actually sounds.
    */
    if (w.deaths.count > 0 && !bossJustDied(w)) w.onCue('kill');
    /*
      ⚠️ **THE SHIP TAKES HITS, NOT DAMAGE, and this is where a number becomes a count.** Its health
      is the hull plus the shell (`src/content/ships.ts`), and a shield is what absorbs **one hit** —
      so the 2-damage contact an enemy carries must not spend two of them, and the `hardy` assist's
      half must not leave the ship on two and a half. Both would be true of the raw arithmetic:
      damage is authored per threat and the assists scale it.

      ⚠️ **A clamp AFTER the pairings rather than a cap inside `collideIntoOne`.** Only one of the
      three can land in a step — the first sets `invulnFor` and the rest skip a target that has it —
      so *what did the ship lose this step* has exactly one answer here, and `src/sim/collide.ts`
      keeps its monotonicity argument untouched: it still takes the WORST of an overlap set, and this
      still shrinks as the set does.

      ⚠️ **It reads `< before` rather than recomputing**, so an assist that removes damage entirely
      (`resilience: proof`) still removes it. What this cannot preserve is `hardy`'s half — a hit is a
      hit against a one-hit hull — and that rung of the ladder is degenerate until the ladder is
      re-read. 0024 still holds: it is never HARDER than standard, only no longer softer. 0050 has it
      written down as owed.
    */
    /*
      ⚠️ **THE GATE THAT MATTERS, and the failure it prevents is not subtle** — 0079. A ship released
      from its pool is still a live object with a health field, so leaving these four pairings in
      place would let a wreck go on being shot: `health` walks further and further negative, the death
      check below fires again on every step of the beat, and the run empties itself one life per step.
    */
    if (flying) {
      const healthBefore = w.ship.health;
      collideIntoOne(w.enemyShots, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, true);
      // Not consumed: an enemy the player flew into is still there afterwards, or ramming would be
      // the cheapest way to clear the screen.
      collideIntoOne(w.enemies, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, false);
      collideIntoOne(w.bossPool, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, false);
      /*
        ⚠️ **THE PLAYER'S OWN BLAST, IN THE SAME LIST AS EVERY OTHER THREAT — and that is the skill in
        it.** Asked for: *"and the blast hurts the player."* It goes through `collideIntoOne` rather
        than through a check of its own so that the hit costs exactly what any other hit costs: one
        shield, or the life, with the same invulnerable window afterwards. A separate path would be a
        second description of what a hit is, and the two would disagree the first time either moved.
      */
      collideIntoOne(w.blasts, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, false);
      if (w.ship.health < healthBefore) w.ship.health = healthBefore - ONE_HIT;
      /*
        ⚠️ **A hit the ship SURVIVED, which is exactly the case that has a shield in it.** The hull is
        one hit and every shield is one more (`src/content/ships.ts`), so *lost health and still
        alive* and *a shield absorbed it* are the same sentence about the same number — and the mark
        leaving the shell below in `stepShields` is this cue's twin. A ship on its last life takes the
        other branch, and the two cues are deliberately opposite sweeps.
      */
      if (w.ship.health < healthBefore && w.ship.health > 0) w.onCue('shield');
    }
    /*
      A blast lands ONCE. Everything above has now seen it, so it spends itself here and what remains
      is the picture — `BLAST_STEPS` of ring, which is how the player learns where the edge was.
    */
    for (let i = w.blasts.size - 1; i >= 0; i--) w.blasts.at(i).damage = 0;

    /*
      ⚠️ **At the FULL hurtbox, never the assisted one.** `w.tuning.hurtbox` shrinks the ship's circle
      for a player who has asked for a larger margin — and running collection through it would make
      that assist HARDER to play with, because the same setting that removes hits would also remove
      pickups. `docs/decisions/0024-the-accessibility-floor-is-settings.md` says no assist may ever
      make the game harder, and this is the one line in the game where the obvious code breaks it.
    */
    w.collected.count = 0;
    // ⚠️ A wreck does not collect the scatter it is about to throw — 0079. The loop below then runs
    // over a count of zero, which is why nothing else in this section needs a gate.
    if (flying) collectInto(w.pickups, w.ship, COLLECT_REACH, w.collected);
    for (let i = 0; i < w.collected.count; i++) {
      // `PICKUP_KINDS` IS the index order — `pickupRows` is built by walking it — so the entity's
      // opaque `kind` reads back as the authored name with no second table to keep in step.
      /*
        ⚠️ **The FACE, not the authored kind.** The entity keeps the kind the level wrote — so the
        cycle has no state to accumulate and a pickup cannot drift out of step with the field — and
        which face that is right now is the same boolean the sprites were drawn from a moment ago.
      */
      /*
        ⚠️ **The authored kind, full stop — and it used to be *the face the field was showing*.**
        `docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md` made every pickup
        alternate between two kinds, so this loop had to resolve which one was on screen at the moment
        the ship reached it, and the whole of `tests/cycling.test.ts` existed to hold the drawing and
        this line in step. 0082 dropped the cycle: at six pickups a level a level author has to be
        able to say what a level offers, and a coin flip on a premium piece is not that.
      */
      const kind = PICKUP_KINDS[w.collected.kind[i]!];
      if (kind === undefined) continue;
      // One cue for all three kinds — `src/content/cues.ts` has why, and which split play would ask
      // for first. The readout moving is the twin, and it already says WHICH one was taken.
      w.onCue('pickup');
      w.onPickup(kind);
    }

    // Every enemy that died this step leaves something behind. The positions were recorded by the
    // collision because a released slot is the next thing `spawn` hands out.
    for (let i = 0; i < w.deaths.count; i++) {
      burst(w, w.deaths.along[i]!, w.deaths.across[i]!, BURST.enemy);
    }

    /*
      The shell, after every collision that could have spent one and before the death check that
      could clear them all — so a mark that absorbed a hit is gone on the frame the hit landed.
    */
    /*
      ⚠️ **NOT gated on `flying`, and it is the one line in this section that needed no statement
      adding.** `shieldsOf(row, health)` is the single description of how many marks a ship has
      (`src/content/ships.ts`), and a wrecked ship's health is at or below zero — so this releases the
      shell, bursts each mark where it was, and returns before it places anything. A gate here would
      have frozen an orbiting mark in world coordinates for the length of the beat, which is the bug
      it looks like it prevents. 0079.
    */
    stepShields(w);

    /*
      ⚠️ **Before the death check, so the last thing the HUD shows is zero.** After it, a respawn
      would have already put the health back and the player would never see the hit that killed them
      register — which is `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`
      exactly: an event the model resolves and the picture never mentions.
    */
    if (w.ship.health !== w.shownHealth) {
      w.shownHealth = w.ship.health;
      w.onHealth(w.ship.health);
    }

    // ⚠️ `flying &&`, or the wreck reports its own death again on every step of the beat. Nothing
    // takes health off a released ship any more, so this is the belt to that gate's braces — and it
    // is worth having, because the failure is a run that empties itself in under a second.
    if (flying && w.ship.health <= 0) wreckShip(w);

    /*
      The level script.

      ⚠️ **The test is against `spawnAlong`, not against the camera, because `at` is a PLACE.** The
      first version compared `at` to the camera and then placed every wave at the leading edge — so
      the authored position was thrown away, the level could not put anything in front of the player
      at the start of a run, and the first eight seconds were empty. `scripts/shot.mjs` at six
      seconds showed a ship and its own bullets and nothing else, which is the picture finding
      `docs/decisions/0027-measure-the-picture-not-the-model.md` exists to make reachable: every
      number involved was correct.

      A `while` rather than an `if`, because a run begins with the whole opening stretch inside the
      spawn horizon at once, and because two waves may be authored close enough that one step crosses
      both — a step that spawned only the first would leave the script permanently behind the camera
      rather than visibly wrong.
    */
    /*
      ⚠️ **IN THE LEVEL'S COORDINATES, NOT THE WORLD'S** — `docs/decisions/0076-a-level-has-an-origin.md`.
      Subtracting the origin here rather than adding it to every `at` below is what keeps the three
      comparisons reading exactly as they did when a level always started at zero: an authored `at`
      is a distance from the level's own beginning, and this is the only line that has to know the
      level did not begin at the beginning of the run.
    */
    const horizon = spawnAlong(w.cameraAlong) - w.levelOrigin;
    while (w.nextWave < w.level.waves.length && w.level.waves[w.nextWave]!.at <= horizon) {
      spawnWave(w, w.nextWave);
      w.nextWave++;
    }
    // Its own index, because the two lists interleave and neither is a subsequence of the other.
    while (w.nextPickup < w.level.pickups.length && w.level.pickups[w.nextPickup]!.at <= horizon) {
      spawnPickup(w, w.nextPickup);
      w.nextPickup++;
    }

    if (!w.bossSpawned && horizon >= w.level.bossAt) {
      w.bossSpawned = true;
      spawnBoss(w);
    }
    // Reported once. The boss is the only thing that can empty this pool, so an empty pool after it
    // was filled is the level ending — and `bossBeaten` is what stops that being said every step
    // from then until the screen changes.
    if (bossJustDied(w)) {
      w.bossBeaten = true;
      // The one cue sized to fill a beat rather than to punctuate one: `BOSS_DEATH_STEPS` is 1.6
      // seconds of the level carrying on while the boss comes apart, and `src/content/cues.ts` sizes
      // `bossDown` against it.
      w.onCue('bossDown');
      /*
        ⚠️ **THE LEVEL DOES NOT END HERE ANY MORE.** Reported from play: *"bosses need a real
        explosion and an end-of-level beat — currently the level just ends."* It did: the same step
        that emptied the pool raised a screen over the frame, so the loudest event in the game was a
        boss vanishing behind an overlay. `docs/decisions/0062-a-boss-dies-loudly.md`.
      */
      w.clearedIn = BOSS_DEATH_STEPS;
    }
    stepBossDeath(w);
    stepShipDeath(w);
  }

  draw(alpha: number): void {
    const w = this.world;
    // The camera is interpolated on the same alpha as everything it gets subtracted from. Passing
    // the stepped value here is what made a ship holding station exactly still judder on screen.
    const camera = w.prevCameraAlong + (w.cameraAlong - w.prevCameraAlong) * alpha;
    paintScene(w.surface, w.view, w.layers, camera, alpha, w.sky, w.bound);
  }
}

/**
 * Whether this is the step the boss came apart on.
 *
 * ⚠️ **One description, two call sites, and the second one is why this is a function.** The step
 * both starts the boss's beat and decides whether the ordinary kill cue should sound, and those two
 * places are two hundred lines apart — written out twice, the day somebody adds a condition to the
 * latch is the day the sound and the beat disagree about what happened.
 *
 * `bossBeaten` is the latch that makes it true exactly once; the pool is the only thing the boss can
 * empty.
 */
function bossJustDied(w: World): boolean {
  return w.bossSpawned && !w.bossBeaten && w.bossPool.size === 0;
}

/**
 * Steps from `now` to the next multiple of `cadence`, which is never zero.
 *
 * ── THE ONE DESCRIPTION OF *WHEN DOES THE NEXT VOLLEY LAND* ─────────────────────────────────────
 *
 * `docs/decisions/0094-in-time-is-not-in-phase.md`. Asked in four places — the pulse, the missiles,
 * and both of them again on a respawn — and they have to agree, or a death silently moves the gun
 * off the beat and nothing anywhere would say so.
 *
 * ⚠️ **Never zero, and that is the whole of the arithmetic.** At `now` already on a multiple the
 * answer is a full `cadence`, not 0: a reload of zero would fire again on the same step, which is a
 * volley the pool refuses and a cue the player hears as a stutter. `cadence - (now % cadence)` gives
 * `cadence` exactly when the remainder is zero, which is why it is written that way round rather than
 * as a ceiling.
 *
 * ⚠️ **`cadence` is trusted to be a positive integer**, because 0093's guards hold every rung of
 * every ladder to being one. A guard there is worth more than a branch here: this runs in the frame
 * loop, and `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` is why it has no
 * defensive arm.
 */
function stepsToGrid(now: number, cadence: number): number {
  return cadence - (now % cadence);
}

/**
 * The player's auto-fire.
 *
 * ⚠️ **No input is read here and there is no action for it.** `src/content/actions.ts` says there is
 * no `fire` and there must never be one — the base weapon fires itself, and what the player spends
 * is the arsenal. This is that rule as four lines of code.
 */
function fireShip(w: World): void {
  w.fireIn--;
  if (w.fireIn > 0) return;
  /*
    ⚠️ **RELOADED TO THE GRID AND NOT TO THE CADENCE, WHICH IS THE HALF 0093 COULD NOT DO** — 0094.
    `w.fireIn = w.weapon.fireEvery` puts the next volley a correct interval after this one, so the gun
    keeps a perfect TEMPO at a phase that is whatever the last reset happened to leave. A metronome
    three steps behind the beat is a metronome in time and out of phase, and 50ms is exactly the
    offset the ear reads as *not quite on it*.

    Every rung divides `STEPS_PER_BEAT` (0093, guarded), so landing on a multiple of the cadence from
    the run's origin lands on a subdivision of the beat — at every tier, across every upgrade, and
    after every death.
  */
  w.fireIn = stepsToGrid(w.steps, w.weapon.fireEvery);
  const row = SHOTS[w.shipRow.shot];
  /*
    The volley, fanned about the nose. One barrel takes the nose exactly; `spread` is the TOTAL angle
    across the fan, so the step between neighbours is `spread / (shots - 1)` — the same arithmetic
    `src/app/boss.ts` does, deliberately written the same way in both places rather than shared,
    because a helper reached for from two hot files is an import edge that only exists to save four
    lines.

    ⚠️ Every barrel carries the scroll rate, like everything else the player watches move.
  */
  const step = w.weapon.shots > 1 ? w.weapon.spread / (w.weapon.shots - 1) : 0;
  const first = -(step * (w.weapon.shots - 1)) / 2;
  for (let i = 0; i < w.weapon.shots; i++) {
    const shot = w.playerShots.spawn();
    // A volley one barrel short is dropped rather than grown — `src/sim/pool.ts` has the argument.
    if (shot === null) return;
    /*
      ⚠️ **ONE CUE PER VOLLEY, NOT PER BARREL, and the placement is what makes it both.** A fully
      upgraded weapon is five barrels on this step (`src/content/pickups.ts`), and five identical
      clicks at one instant is not five times as loud — it is a different and worse sound. Inside the
      loop but gated on the first barrel, so a volley the pool refused entirely is silent, which is
      the same rule every other cue in this file follows.
    */
    if (i === 0) w.onCue('pulse');
    const angle = first + step * i;
    reset(shot, w.ship.along + MUZZLE_ALONG, w.ship.across, row);
    shot.velAlong = Math.cos(angle) * row.speed + w.scrollPerStep;
    shot.velAcross = Math.sin(angle) * row.speed;
    // Weight, once barrels and rate have nowhere left to go — `src/content/pickups.ts`.
    shot.damage = w.weapon.damage;
    /*
      ⚠️ **No lifetime, and there used to be one.** A volley that outlives the screen starves the
      next one — *"two streams continuous and the others stutter"* is how play reported it — and the
      answer was an 80-step timer on every bullet. The view cull
      (`docs/decisions/0048-a-threat-may-arrive-from-the-side.md`) now retires a shot strictly
      sooner than that timer could, on every device, so the timer had become a second mechanism for
      a guarantee that already had one. `src/content/pickups.ts` has what it left behind.
    */
  }
}

/*
  ── `cyclePickups` USED TO BE HERE, AND ITS DELETION IS THE POINT ────────────────────────────────

  `docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md` made a pickup alternate
  between two kinds on a distance, so this walked the field every step rewriting sprites, and the
  collection loop above had to resolve the same phase a second time to hand over the face the player
  was looking at. Both halves are gone —
  `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`.

  ⚠️ **0052's reasoning did not stop being true; its PREMISE did.** *"Which one a player gets is a
  matter of when they reach it"* was written for a field with a pickup every 250 units, where a player
  passes dozens and takes whatever is beside them. A level now offers six, each one worth crossing the
  lane for, and a coin flip on a premium piece reads as the game taking something away rather than as
  the field changing its mind.

  ⚠️ **What went with it**: `CYCLE`, `CYCLE_UNITS` and `faceOf` in `src/content/pickups.ts`,
  `pickupCycle` and `pickupFlipped` on the world, `tests/cycling.test.ts`, and
  `scripts/probes/0052-cycling.mjs`. An entity's `kind` is now simply what the level authored, all the
  way from the spawn to the collection, which is what `spawnPickup` and `scatterUpgrades` already
  assumed of the pieces they place.
*/

/**
 * What the player pressed, passed up to whoever owns the arsenal.
 *
 * ⚠️ **The FIRST auto-weapon-free input in the game, and the only one there will ever be.**
 * `src/content/actions.ts`: *there is no `fire` action and there must never be one* — a special is
 * the thing the player spends, and this is where 0030's `Intent.specials` finally has a consumer.
 *
 * ⚠️ **A count, not a boolean, and every press is reported.** `src/sim/intent.ts` counts presses
 * because several can land between two steps on a slow frame; dropping the extras here would make
 * the arsenal lossy exactly when the game is already struggling, which is the failure that argues
 * for the count in the first place.
 */
function askSpecials(w: World): void {
  for (let slot = 0; slot < w.intent.specials.length; slot++) {
    for (let press = w.intent.specials[slot] ?? 0; press > 0; press--) w.onSpecial(slot);
  }
}

/**
 * Every bomb whose fuse has run out, turned into the thing that hurts.
 *
 * ⚠️ **`lifeFor` is the fuse, and that is what the field already means** — *steps until this retires
 * itself* (`src/sim/entity.ts`). A bomb retires by going off, so the two are the same event; this
 * runs before `stepEntities` so the blast appears where the bomb was rather than a step beyond it.
 *
 * ⚠️ **The bomb is in no collision pairing at all**, like debris: it passes through whatever it is
 * aimed at and detonates where the player aimed it. A bomb that went off on contact would be a
 * missile with a bigger number, and choosing the PLACE is the whole of what makes it a skill.
 */
function stepBombs(w: World): void {
  for (let i = w.bombs.size - 1; i >= 0; i--) {
    const bomb = w.bombs.at(i);
    if (bomb.lifeFor > 1) continue;
    const becomes = SPECIALS.bomb.becomes;
    if (becomes === null) continue;
    const blast = w.blasts.spawn();
    if (blast !== null) {
      reset(blast, bomb.along, bomb.across, SHOTS[becomes]);
      // The blast holds station in the world while everything else moves past it — a shockwave is a
      // place rather than a body. `speed` is 0 on the row; this is the same statement for the camera.
      blast.lifeFor = BLAST_STEPS;
    }
    /*
      ⚠️ **Outside the `blast !== null` branch, beside the burst rather than beside the ring.** The
      bomb went off whether or not the blast pool had a slot — the fragments say so, and they are the
      one picture of a detonation that cannot be refused. Inside the branch this would be the only
      cue in the file that goes quiet on the frame the screen is fullest.
    */
    w.onCue('blast');
    burst(w, bomb.along, bomb.across, BURST.ship);
  }
}

/**
 * Throw the special in `slot`, having been told by the shell that there was a charge for it.
 *
 * ⚠️ **Exported and called by `src/app/mount.ts`, exactly as `respawn` is.** The frame reports the
 * ask and the shell decides; this is the half of the answer that moves an entity, and keeping it
 * here is what stops `mount.ts` reaching into a pool.
 */
export function launchSpecial(w: World, kind: SpecialKind): void {
  const row = SPECIALS[kind];
  if (row.shot === null) return;
  const body = SHOTS[row.shot];
  const thrown = w.bombs.spawn();
  if (thrown === null) return;
  // Rising, because the thing it turns into has not happened yet — the fuse is the point of a bomb.
  w.onCue('bomb');
  reset(thrown, w.ship.along + MUZZLE_ALONG, w.ship.across, body);
  thrown.velAlong = body.speed + w.scrollPerStep;
  /*
    The fuse, in steps, from the reach the row states in world units. Computed here rather than
    written on the row because it is a consequence of two numbers that are both authored — and a
    third number agreeing with them by hand is the drift this project keeps paying for.
  */
  thrown.lifeFor = Math.max(1, Math.round(row.reach / body.speed));
}

/**
 * The player's missiles: one per launcher, on their own clock.
 *
 * ⚠️ **No input is read here either.** `src/content/actions.ts`'s *there is no `fire` action and
 * there must never be one* is about every auto-weapon rather than about the pulse in particular, and
 * this is the second one. What the player spends is the arsenal.
 *
 * ⚠️ **The launchers are POSITIONS, and NEITHER of them is the centreline** —
 * `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`. The first tube is the
 * `across`-minus side of the hull and the second is the `across`-plus side, so the ladder reads
 * off-balance, then balanced. Both pop out before they straighten.
 */
function fireMissiles(w: World): void {
  /*
    ⚠️ **No tube, no clock.** The base ship carries no launcher until one is found (0056), and
    counting down a cadence for a weapon that does not exist would arm the first volley to leave the
    instant the pickup lands — so the reward for finding a launcher would be a missile fired from
    wherever the ship happened to be, rather than a weapon starting.
  */
  if (w.weapon.launchers === 0) return;
  w.missileIn--;
  if (w.missileIn > 0) return;
  // ⚠️ On the grid, like the pulse — 0094. The missile's cadence is five pulses (0093), so this lands
  // ACROSS the beat rather than on it, which is the counter-beat. A counter-beat at a random phase is
  // just a second thing that is nearly right.
  w.missileIn = stepsToGrid(w.steps, w.weapon.missileEvery);
  const row = SHOTS[w.shipRow.missile];
  for (let i = 0; i < w.weapon.launchers; i++) {
    const missile = w.missiles.spawn();
    // A volley one tube short is dropped rather than grown — `src/sim/pool.ts` has the argument.
    if (missile === null) return;
    // One cue for the volley, on the same terms the pulse gets one: both tubes are one launch.
    if (i === 0) w.onCue('missile');
    /*
      WHERE THE TUBES ARE — 0097, and it is the third answer to this question.

      ⚠️ **THE FIRST TUBE IS THE TOP OF THE HULL AND THE SECOND IS THE BOTTOM. Neither is the
      centreline**, which is what 0051 gave the base ship and 0077 kept for a one-tube ladder.
      Reported from play against the build 0077 landed in: *"the missiles now fire from the center of
      the ship and it looks like only one missile."*

      ⚠️ **The off-balance single is the ASK rather than a cost the change carries** — *"yes it will
      look off balance, that's the point when you only have one"* — and it is the whole of why the
      old picture failed. A missile down the centreline is the same silhouette as the pulse stream
      that never stops, so the second auto-weapon arrived invisible; one hung off the top edge of the
      hull cannot be mistaken for anything else, and the second tube arriving underneath is then a
      ship becoming symmetric rather than a ship gaining a third of something.

      ⚠️ **`across`-minus is the TOP on both orientations**, and that is `src/render/surface.ts`
      rather than an assumption here: in landscape `screenY` counts `across` downward from the top
      edge, and in portrait the whole atlas is baked a quarter turn round, so the minus side is the
      same side of the ship in both. The player's words are *top* and *bottom*; the code's are minus
      and plus.
    */
    const side = i === 0 ? -1 : 1;
    reset(missile, w.ship.along + MUZZLE_ALONG, w.ship.across + LAUNCHER_ACROSS * side, row);
    missile.velAlong = row.speed + w.scrollPerStep;
    missile.damage = w.weapon.missileDamage;
    /*
      The pop, as a crossing that stops — the flanker's mechanism exactly, and `steerMissiles` is
      where it ends.

      ⚠️ **EVERY tube pops now, because every tube is a side tube.** The `side !== 0` guard that used
      to stand here was the centre launcher's exemption and it went with the centre launcher; a
      condition kept for a case the union no longer has is a branch nothing can reach, which is worse
      than no branch at all.
    */
    missile.velAcross = LAUNCHER_POP_SPEED * side;
    missile.steerAcross = w.ship.across + LAUNCHER_POP * side;
  }
}

/**
 * The side missiles, straightening once they have popped clear of the hull.
 *
 * ⚠️ **The comparison is against the direction of travel, not against a distance** — the same
 * argument `steerEnemies` makes for the flanker's turn: a body crossing at half a unit a step will
 * step OVER any tolerance band you pick, so *close enough to the target* misses at one speed and
 * holds at another, and *have I passed it* cannot.
 */
function steerMissiles(w: World): void {
  for (let i = w.missiles.size - 1; i >= 0; i--) {
    const m = w.missiles.at(i);
    if (m.velAcross === 0) continue;
    if (m.velAcross > 0 ? m.across >= m.steerAcross : m.across <= m.steerAcross) {
      m.across = m.steerAcross;
      m.velAcross = 0;
    }
  }
}

/**
 * The shell of shields: as many orbiting marks as the ship has hits above its hull, placed.
 *
 * ── WHY THE COUNT IS DERIVED RATHER THAN STORED ─────────────────────────────────────────────────
 *
 * ⚠️ **`shieldsOf(row, health)` is the only description of how many shields a ship has**, and this
 * function owns none of it. A counter kept beside `health` would be a second answer to the same
 * question, and the collision only ever moves the first one — so the shell would keep a mark the
 * player had already spent, on exactly the frame they were looking to see whether they had.
 * `docs/decisions/0050-…` has the argument; `src/content/ships.ts` has the function.
 *
 * ⚠️ **A spent shield leaves a burst**, because a mark that simply vanishes is the failure
 * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` is named for: the
 * model resolved *that hit was absorbed* and the picture said nothing.
 *
 * ⚠️ **`stepEntities` is deliberately not called on this pool.** These are not bodies with a
 * velocity — they are a function of where the ship is and how far the camera has come, evaluated
 * every step — so integration would fight the placement, and the culls have nothing to do: a mark is
 * never anywhere the ship is not.
 */
function stepShields(w: World): void {
  const want = shieldsOf(w.shipRow, w.ship.health);
  // Spent, in the order they were taken. A burst where the mark was, then the slot goes back.
  while (w.shieldOrbs.size > want) {
    const last = w.shieldOrbs.size - 1;
    const orb = w.shieldOrbs.at(last);
    burst(w, orb.along, orb.across, BURST.shield);
    w.shieldOrbs.releaseAt(last);
  }
  while (w.shieldOrbs.size < want) {
    const orb = w.shieldOrbs.spawn();
    // A shell one mark short is dropped rather than grown, exactly as a volley is — and it cannot
    // happen: the pool is `MAX_SHIELDS` long and the pickup refuses a fourth.
    if (orb === null) break;
    reset(orb, w.ship.along, w.ship.across, SHIELD_MARK);
  }
  /*
    Placed evenly about the ship, turning with the camera.

    ⚠️ **Evenly about the CURRENT count, so three marks are a triangle and two are opposite each
    other.** Fixing each mark to a slot of three would leave one shield sitting alone at an arbitrary
    angle, which reads as a piece having fallen off rather than as a shell.
  */
  const count = w.shieldOrbs.size;
  if (count === 0) return;
  const base = w.cameraAlong * SHIELD_SPIN;
  const step = TAU / count;
  for (let i = 0; i < count; i++) {
    const orb = w.shieldOrbs.at(i);
    const angle = base + step * i;
    // Carried by hand, because nothing else steps this pool — and the renderer interpolates from it.
    orb.prevAlong = orb.along;
    orb.prevAcross = orb.across;
    orb.along = w.ship.along + Math.cos(angle) * SHIELD_ORBIT;
    orb.across = w.ship.across + Math.sin(angle) * SHIELD_ORBIT;
  }
}

/**
 * Every enemy that has a weapon and has waited long enough, firing at where the ship is now.
 *
 * Aimed rather than sprayed, because the quantity this build exists to make measurable is whether the
 * player can get out of the way — and a shot that was never coming at them measures nothing.
 *
 * ── THE SHOT FLIES IN THE CAMERA'S FRAME, AND WITHOUT THAT IT NEVER ARRIVES ─────────────────────
 *
 * ⚠️ **Found by tracing eight seconds of the real page, not by reading this function.** A shot aimed
 * at the ship in WORLD coordinates leaves for where the ship is and arrives where the ship was: the
 * ship holds station in the camera's frame, so it drifts a full `scrollPerStep` up-lane for every
 * step the shot is in the air. Over an eighty-step flight that is 48 units of lead nobody applied,
 * and every off-lane shot in the game missed by a margin that grew with range. Nothing was wrong
 * with the aim, the collision or the picture; each was correct in a different frame.
 *
 * Adding the scroll makes the shot travel at `speed` **relative to the camera**, which is the frame
 * `flyShip` already works in — it takes `scrollPerStep` as the ship's baseline and treats the
 * player's ask as a departure from it. So a table's `speed` means what the player sees, and the two
 * halves of the game finally measure motion the same way.
 *
 * ⚠️ It leads the drift **everyone** shares and nothing else. The player's own dodge is not
 * predicted, because the dodge is the skill: the shot commits when it is fired, and what happens
 * afterwards belongs to the hand.
 */
function fireEnemies(w: World): void {
  const ship = w.ship;
  for (let i = w.enemies.size - 1; i >= 0; i--) {
    const e = w.enemies.at(i);
    const row = w.enemyRows[e.kind];
    if (row === undefined || row.fireEvery <= 0) continue;
    /*
      ⚠️ **A THREAT THE PLAYER CANNOT SEE DOES NOT SHOOT**, and this line arrives with the roam that
      makes it reachable. `across` is fully visible on every device (0023 fixes it at 100 and the
      excess becomes gutter), so a body entirely outside `0…ACROSS_SPAN` is entirely off screen — and
      a shot arriving from there is a hit with no cause on the picture, which is the exact shape
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` records being
      reported three times as a collision fault that did not exist.

      ⚠️ **Its clock keeps running.** `fireIn` is not held back, so an enemy that wanders out and
      back does not come back with a volley saved up — it simply skipped its turn, which is what the
      player watched happen.

      ⚠️ **The hull's edge and not its centre**, so something half on screen is something that can
      shoot: the player can see it, so it is fair, and the alternative is a turret that stops firing
      while it is still visibly there.
    */
    /*
      ── THE CLOCK RUNS FIRST, AND BOTH COMMENTS BELOW ALREADY SAID SO ─────────────────────────────

      ⚠️ **`docs/decisions/0096-the-enemies-play-along.md`, and this is a comment that was true of the
      intention and false of the code.** Both visibility rules below say *its clock keeps running… it
      simply skipped its turn* — and both were written as a `continue` placed BEFORE the decrement,
      which freezes it. A body that spent two seconds of its approach off the leading edge arrived
      with its countdown exactly where it left it.

      ⚠️ **Frozen is also what broke the grid**, which is how it was found: `tests/spawns.test.ts`
      reported 84 of 88 enemy volleys off the beat with every content guard green. An arbitrary pause
      in a periodic clock is an arbitrary phase shift, and no amount of snapping the PERIOD survives
      one.

      ⚠️ **It is a real balance change and not a tidy-up.** A body used to enter the view with its
      whole gap ahead of it and now enters mid-count, so on average it opens fire half a cadence
      sooner. That is what *skipped its turn* means and it is what the rules always claimed; it is
      named here rather than left to be discovered.
    */
    e.fireIn--;
    if (e.fireIn > 0) continue;
    /*
      The tier's gap, not the row's — and recomputed rather than remembered, because two numbers
      multiplied is cheaper than a field on every entity in the game that only enemies would use.

      ⚠️ **RELATIVE, AND THE PLAYER'S GUN IS NOT** — 0096. `stepsToGrid` is what 0094 gave the ship,
      and an enemy deliberately does not get it: the ship is ONE metronome, so an absolute grid is
      what puts it on the beat, while every enemy of a kind reloading to an absolute grid would fire
      **in unison**. Five turrets on screen would be a five-bullet volley every two beats instead of a
      pattern. What makes an enemy rhythmic is that its PERIOD is a whole number of sixteenths and its
      phase was quantised once, when it spawned; from there a relative reload keeps it on the grid for
      ever and keeps it out of step with its neighbours.
    */
    e.fireIn = fireGapFor(row.fireEvery, w.difficulty);
    if (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN) continue;
    /*
      ── AND THE SAME RULE ON THE OTHER AXIS, WHICH IT HAS NEVER HAD ─────────────────────────────

      ⚠️ **REPORTED FROM PLAY, AND CONFIRMED AS A DEFECT BEFORE IT WAS ANSWERED**: *"most of the
      difficulty is enemies that fly past and shoot, or shoot from off-screen."*
      `reports/medium-played-2026-08-07.md` has the arithmetic. 0059 added the `across` test above
      when the roam made those edges reachable, and the leading edge never got one — so a wave
      placed at `camera + MAX_ALONG_SPAN + EDGE_MARGIN` (about 246) has been firing at the player
      from beyond a 16:9 device's 178-unit view for roughly two seconds of every approach, on every
      wave, since the day enemies could shoot.

      ⚠️ **It is worse on a NARROWER screen, which is the tell that it was never considered.** 0023
      fixes the spawn distance against the widest view that exists so that content is authored once;
      the visible span is not fixed, so the smaller the device the longer the invisible sniping.

      ⚠️ **`w.view.alongSpan` and not `MAX_ALONG_SPAN`, and this is the one place in the game that
      difference is allowed to matter.** The question here is *can the player see it* — which is a
      fact about the device in front of them, exactly like the `across` test above is a fact about a
      lane that is the same everywhere. Using the widest view would let a phone go on being shot at
      by things it cannot see, which is the bug.

      ⚠️ **Its clock keeps running**, exactly as the `across` case says: a body that spends its
      approach off screen does not arrive with a volley saved up.

      This is `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`'s own
      failure mode — *a hit with no cause on the picture* — which 0036 records being reported three
      separate times as a collision fault that did not exist.
    */
    if (e.along - e.radius > w.cameraAlong + w.view.alongSpan) continue;
    const dAlong = ship.along - e.along;
    const dAcross = ship.across - e.across;
    const distance = Math.sqrt(dAlong * dAlong + dAcross * dAcross);
    // Zero distance means the enemy is inside the ship, which contact damage has already handled.
    if (distance <= 0) continue;
    const bullet = SHOTS[row.shot];
    const shot = w.enemyShots.spawn();
    if (shot === null) continue;
    /*
      ⚠️ **Once per enemy that actually fired, and the HOLD is what stops that being a wall of
      noise** — `src/content/cues.ts` gives `threat` four steps, so a screen of turrets going off
      together is one sound rather than nine. Gating it here instead would be a second rate limiter
      in a second place, disagreeing with the first the day either moves.

      It is below the off-screen check above, so a threat the player cannot see is one they cannot
      hear either — the same rule, in the channel 0036 was not written about.
    */
    w.onCue('threat');
    reset(shot, e.along, e.across, bullet);
    // ⚠️ The tier scales the SPEED and not the direction. A harder tier is less time to move, never
    // a shot that leads the player — `src/content/shots.ts` keeps the dodge in the player's hands.
    const speed = bullet.speed * w.difficulty.shotSpeed;
    shot.velAlong = (dAlong / distance) * speed + w.scrollPerStep;
    shot.velAcross = (dAcross / distance) * speed;
  }
}

/**
 * Scatter fragments from a point.
 *
 * ⚠️ **A burst that cannot fit is DROPPED, never grown**, exactly as a wave one bullet short is
 * dropped — `src/sim/pool.ts` has the argument. Debris is the one pool where running out is
 * genuinely invisible, because the frame it happens on is the frame the screen is fullest.
 *
 * ⚠️ Nothing allocates: the angle and the speed are numbers, and `Math.cos`/`Math.sin` return
 * numbers. There is no vector and no array of fragments.
 */
function burst(w: World, along: number, across: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const piece = w.debris.spawn();
    if (piece === null) return;
    reset(piece, along, across, DEBRIS);
    /*
      A random angle rather than an even fan. An even fan is a RING, and a ring reads as a shockwave
      — a deliberate, authored effect — where this wants to read as something coming apart.
    */
    const angle = w.burstRng.range(0, Math.PI * 2);
    const speed = w.burstRng.range(BURST.speedMin, BURST.speedMax);
    piece.velAlong = Math.cos(angle) * speed;
    piece.velAcross = Math.sin(angle) * speed;
    piece.lifeFor = Math.round(w.burstRng.range(BURST.lifeMin, BURST.lifeMax));
  }
}

/**
 * One authored wave, placed beyond the widest leading edge any device can have.
 *
 * ⚠️ **The spawn stream is not consulted, and the level is the poorer for nothing.** Every position
 * here comes from the script and its formation, which is what `docs/game.md` means by *"levels are
 * authored; the chart between them is the variety"* — a wave that rolled its own lane would play
 * differently every run and could not be tuned by a hand.
 *
 * `w.rng` therefore has no caller in the frame any more. It stays on the world because the pool
 * draft, the character draw and the upgrade drops all want it, and because
 * `docs/decisions/0021-one-stream-per-concern.md` is about which stream a draw comes from rather
 * than about how many exist.
 */
function spawnWave(w: World, index: number): void {
  const wave = w.level.waves[index];
  if (wave === undefined) return;
  const kind = w.enemyKinds[wave.enemy];
  const row = w.enemyRows[kind];
  if (row === undefined) return;
  const formation = FORMATIONS[wave.formation];
  const origin = wave.origin ?? DEFAULT_ORIGIN;
  const flanking = origin !== 'lead';
  /*
    WHERE THE WAVE IS PUT.

    A leading wave goes at its AUTHORED position, not at the leading edge — a wave inside the opening
    horizon is therefore already in front of the player when a run begins, which is what a level is
    supposed to look like.

    ⚠️ **A flanking wave is placed against the CAMERA instead, and its `at` decides only WHEN.** It
    is not hidden by being far ahead — it is hidden by being outside the lane — so the authored
    distance would put it wherever the horizon happens to be, which is 280 units out and behind
    nothing. `FLANK_ALONG` is the cap the player asked for, and `src/sim/camera.ts` has the argument
    for why it is a fixed 120 rather than a fraction of the view.
  */
  // ⚠️ The authored place is in LEVEL coordinates — 0076. A flanking wave is placed against the
  // camera instead and so needs no origin: its `at` decides only WHEN, never where.
  const along = flanking ? w.cameraAlong + FLANK_ALONG : wave.at + w.levelOrigin;
  // Which side it comes in from, as a sign on `across`. −1 enters from the acrossMinus edge.
  const side = origin === 'acrossPlus' ? 1 : -1;
  const entryAcross = side < 0 ? -FLANK_MARGIN : ACROSS_SPAN + FLANK_MARGIN;
  for (let i = 0; i < wave.count; i++) {
    const e = w.enemies.spawn();
    // A wave one enemy short is dropped rather than grown — `src/sim/pool.ts` has the argument, and
    // it is the same one a burst that will not fit gets.
    if (e === null) return;
    const target = wave.lane + formation.acrossOffset(i, wave.count);
    /*
      ⚠️ **A flanker's formation offset is applied ALONG rather than across at the entry point.** The
      members leave the edge in a stream at their own target lanes; spreading them across the lane
      before they had entered it would put half the wave on screen already.
    */
    const across = flanking ? entryAcross : target;
    reset(e, along + formation.alongOffset(i, wave.count), across, row, kind);
    if (flanking) {
      // The turn: cross at a fixed rate until the authored lane, then slow to the roam and carry on.
      // `steerEnemies` is where that second half happens.
      e.velAcross = -side * FLANK_ENTRY_SPEED;
      e.steerAcross = target;
    } else {
      /*
        WHICH WAY IT WANDERS, and it is a parity rather than a roll.

        ⚠️ **The spawn stream is deliberately not consulted**, for the reason this function opens
        with: a level is authored, and a wave that rolled its own direction would play differently
        every run and could not be tuned by a hand. `src/app/frame.ts`'s `spawnPickup` alternates by
        index for exactly the same reason and says so.

        ⚠️ **The wave's index is in it as well as the member's**, so a formation fans apart AND two
        waves in a row do not lean the same way. Without the first the members move as a block, which
        is the tunnel wearing a wider coat; without the second the whole level drifts one way.

        ⚠️ **Only a DRIFTING row is given a direction here** — the reactive motions decide their own
        `velAcross` every step from where the ship is, so a lean written at spawn would last exactly
        one step. 0073.
      */
      e.velAcross = row.motion.kind === 'drift' ? ((index + i) % 2 === 0 ? row.motion.roam : -row.motion.roam) : 0;
    }
    /*
      WHAT A PILOT NEEDS TO KNOW ABOUT ITSELF, set once here — `docs/decisions/0073-an-enemy-is-a-pilot.md`.

      ⚠️ **Both are the same parity trick the roam above uses, and for the identical reason.** A level
      is authored: a wave that rolled its own handedness would play differently every run and could
      not be tuned by a hand, and `src/sim/rng.ts`'s stream would be consulted for something that is
      not a variation the designer asked for.

      ⚠️ **`spin` cannot be derived from the body's position at the moment it engages**, which is what
      the first draft did — the side of the ship it is on flips halfway round every orbit, so the
      orbit reverses at the top and the bottom and the body swings on an arc instead of going round.
    */
    if (row.motion.kind === 'circle') e.spin = (index + i) % 2 === 0 ? 1 : -1;
    else if (row.motion.kind === 'loop') e.turnsLeft = row.motion.turns;
    /*
      THE TIER, applied here and nowhere else for anything that arrives in a wave.

      ⚠️ **After `reset`, which copied the row's own numbers in.** That is the order rather than an
      afterthought: `reset` is what puts a recycled slot into a known state, and a spawner that
      scaled the row before handing it over would have to build a scaled row per spawn — an
      allocation, in the frame, which is the one thing 0022 bans outright.
    */
    /*
      ⚠️ **THE DIAL, and it is the first thing in the game that spawns differently depending on how
      far into the run the player is** — `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`.
      Reported from play: *"at the start of the game there should be no multiple hit enemies until
      after the 2nd upgrade has been spawned — the difficulty curve currently has a massive spike at
      the start."*

      ⚠️ **It clamps to one rather than scaling towards one.** A turret with three health at the
      opening of level one is the spike; two would be a smaller spike. The ask is a floor on the
      *number of shots*, which is what the player actually counts.

      ⚠️ **The TIER is still applied everywhere the dial is not**, and the two multiply rather than
      compete: past `MULTI_HIT_DIAL` this line is exactly what it was, so a hard tier is hard from the
      first wave of level two.
    */
    e.health = singleHitOnly(w.levelIndex, w.weaponsOffered) ? 1 : toughnessFor(row.health, w.difficulty);
    // ⚠️ NEGATED here rather than stored negative. `closing` is "towards the player" in the table, so a
    // typo produces a slow enemy rather than one that silently flees off the leading edge.
    e.velAlong = -row.closing * w.difficulty.closing;
    /*
      ⚠️ **QUANTISED ONCE, HERE, AND NEVER AGAIN** — 0096. A cadence on the grid keeps a musical
      tempo; where the shots LAND still depends on the step this body happened to spawn on, and a
      dozen bodies at correct periods and arbitrary offsets is a smear rather than a rhythm. One
      alignment at spawn holds for its whole life, because every gap is a whole number of grid units.

      ⚠️ **AND EVERY MEMBER GETS ITS OWN PLACE IN THAT CADENCE** —
      `docs/decisions/0098-a-wave-plays-a-figure.md`. Reported from play against the build 0096
      landed in: *"the enemies all fire at exactly the same time when they appear."* 0096 aligned the
      phase and then handed every body the same one, because a formation is placed inside ONE call —
      `w.steps` and `row.fireEvery` do not vary down this loop, so neither did the answer.

      ⚠️ **The member's index AND the wave's, which is the parity idiom eight lines up.** The member
      spreads the formation across its own cadence; the wave rotates it, so two waves of turrets in a
      row do not play the same figure at the same offset. Both are AUTHORED rather than rolled, for
      the reason this function opens with: a level that rolled its rhythm would play differently
      every run and could not be tuned by a hand.
    */
    e.fireIn = nextOnGrid(w.steps, fireGapFor(row.fireEvery, w.difficulty), (i + index) / wave.count);
  }
}

/**
 * Everything that steers itself rather than flying straight — which today is the weave.
 *
 * ⚠️ **The path is a function of `along`, so it is a shape in the WORLD rather than a wobble in
 * time.** Two weavers spawned a minute apart trace the same curve through the same piece of level,
 * which is what lets a formation of them be authored at all. `src/content/enemies.ts` has the
 * algebra and the bound it puts on where a wave may be placed.
 *
 * The derivative rather than the position, because `stepEntities` owns integration: for a path
 * `across₀ + A·sin(k·along)`, the rate is `A·k·cos(k·along)` per unit of along, and the entity
 * covers `velAlong` of those per step.
 */
function steerEnemies(w: World): void {
  /*
    ⚠️ **Hoisted out of the loop, and the ship is read ONCE for the whole pool.** Three of the five
    motions below are functions of where the player is, so this is the step's snapshot of them: every
    body reacts to the same ship position, which is what stops two enemies in one wave disagreeing
    about where the player was depending on their index in the pool.
  */
  const ship = w.ship;
  const aggression = w.difficulty.aggression;
  for (let i = w.enemies.size - 1; i >= 0; i--) {
    const e = w.enemies.at(i);
    const row = w.enemyRows[e.kind];
    if (row === undefined) continue;
    /*
      THE FLANKER'S TURN, and it now runs BEFORE the weave rather than after it.

      ⚠️ **`steerAcross` is the marker, and zero means *nothing to steer to*.** It used to be
      `velAcross !== 0`, on `src/sim/entity.ts`'s argument that *not currently crossing* is a fact
      about the body rather than a magic number — and that argument stopped being true the moment
      anything else wrote `velAcross` after arrival. A roaming body is always crossing, so the
      velocity can no longer answer *is this still coming in from the edge*, and the sentinel is now
      the honest answer rather than the lazy one. `tests/level.test.ts` holds that no authored lane
      is zero, so the sentinel is a value the content cannot collide with.

      ⚠️ **Ordered above the weave, which is what lets a weaving row arrive from the side at all.**
      `tests/spawns.test.ts` used to hold that no flanking wave sends a weaver, because a weave
      overwrote the turn — that constraint on the level author is gone, and the guard now drives one
      instead of forbidding it.

      ⚠️ **The comparison is against the direction of travel, not against a distance.** A body
      crossing at 0.9 a step will step OVER any tolerance band you pick, so a *"close enough to the
      target"* test misses at one speed and holds at another; *have I passed it* cannot.
    */
    if (e.steerAcross !== 0) {
      if (e.velAcross > 0 ? e.across < e.steerAcross : e.across > e.steerAcross) continue;
      e.across = e.steerAcross;
      e.steerAcross = 0;
      /*
        ⚠️ **It slows to its roam rather than stopping, and keeps the way it was going.** 0048's turn
        was *cross, then straighten and close like anything else*; what *anything else* does has
        changed. Keeping the sign means a flanker carries on across the lane it just reached and
        turns round at the far side, which is the same journey it was already making, at a fifth of
        the speed.
      */
      /*
        ⚠️ **Only a DRIFTING row slows to a roam; every other motion takes over on the next step
        anyway.** A hunter, a circler or a looper that arrived from the side is steered by its own
        arm below from here on, so writing a roam onto it would be a velocity that survives exactly
        one step — and the reactive arms all overwrite `velAcross` unconditionally, which is what
        makes that harmless rather than a bug waiting for a reordering.
      */
      e.velAcross = row.motion.kind === 'drift' && row.motion.roam > 0 ? (e.velAcross > 0 ? row.motion.roam : -row.motion.roam) : 0;
      continue;
    }
    /*
      ── WHAT KIND OF PILOT THIS IS ──────────────────────────────────────────────────────────────

      `docs/decisions/0073-an-enemy-is-a-pilot.md`. Two of the five arms are the behaviour that was
      already here under different names; three of them react to where the ship is, which is the
      whole of what the play-test asked for: *"every wave is just a wall that you pass by."*

      ⚠️ **Exhaustive, with a `never` arm** — `docs/decisions/0016-a-hub-enumerates-kinds.md`'s fifth
      defeat, and `tests/registry.test.ts` refuses a switch without one. A motion added to the union
      fails to compile HERE, which is the point of putting the union in the table.
    */
    const m = row.motion;
    switch (m.kind) {
      /*
        THE ROAM — what a body does with the whole area once it has arrived.

        Reported from play: *"once on screen the enemies are in a very narrow tunnel and it makes the
        feel very restrictive… they should fly off the `across` edges and back on."*
        `docs/decisions/0059-the-lane-is-the-players-box.md`.

        ⚠️ **It turns round OUTSIDE the lane, at `ROAM_MIN`/`ROAM_MAX`.** Bouncing at 0 and
        `ACROSS_SPAN` would be the tunnel with a bigger diameter; the whole of what was asked for is
        that a threat leaves the screen sideways and comes back, and the band it turns in is the same
        one 0048 already lets it enter from.

        ⚠️ **On the CENTRE and not on the hull's edge**, which is the opposite of the boss's patrol in
        `src/app/boss.ts` — a boss turning on its centre would put half a 26-unit hull outside the lane
        with nothing to bring it back, and an enemy leaving the lane entirely is the point here.
      */
      case 'drift': {
        if (m.roam <= 0) break;
        if (e.across <= ROAM_MIN) e.velAcross = m.roam;
        else if (e.across >= ROAM_MAX) e.velAcross = -m.roam;
        break;
      }
      case 'weave': {
        const k = TAU / m.wavelength;
        e.velAcross = m.amplitude * k * Math.cos(e.along * k) * e.velAlong;
        break;
      }
      /*
        Lean across towards wherever the ship is, at a bounded rate.

        ⚠️ **CLAMPED to the rate rather than proportional to the gap**, which is what stops it
        oscillating: a proportional steer overshoots by exactly the gap every step once the rate is
        larger than the distance left, and the body sits vibrating on top of the player. The last
        arm of the clamp — using the gap itself when it is smaller than the rate — is what lands it
        exactly rather than jittering around the line.
      */
      case 'hunt': {
        const rate = m.agility * aggression;
        const gap = ship.across - e.across;
        e.velAcross = gap > rate ? rate : gap < -rate ? -rate : gap;
        break;
      }
      /*
        Fly in, then orbit.

        ⚠️ **`velAlong` gets `scrollPerStep` ADDED, and leaving it out is the bug the constitution
        warns about by name**: *"every speed is in the camera's frame, which is the one the ship
        already flies in."* An orbit computed in world coordinates orbits where the ship WAS, drifts
        a full scroll rate up-lane every step, and reads as a body slowly falling off the back of its
        own circle. `src/app/frame.ts`'s `fireEnemies` has the same note about aimed shots, which is
        where this project learned it.
      */
      case 'circle': {
        const dAlong = e.along - ship.along;
        const dAcross = e.across - ship.across;
        const dist = Math.sqrt(dAlong * dAlong + dAcross * dAcross);
        const rate = m.agility * aggression;
        /*
          Still on its way in. It closes at whatever the spawner gave it and leans across, exactly as
          a hunter does — an orbit attempted from 246 units out is a tangent, and the body would
          leave the lane sideways long before it ever arrived.
        */
        if (dist > m.radius * CIRCLE_ENGAGE) {
          const gap = ship.across - e.across;
          e.velAcross = gap > rate ? rate : gap < -rate ? -rate : gap;
          break;
        }
        const inv = dist > 0 ? 1 / dist : 0;
        const nAlong = dAlong * inv;
        const nAcross = dAcross * inv;
        // How far off the orbit it is, as a speed pulling it back on. Positive is too far out.
        const pull = (dist - m.radius) * CIRCLE_PULL;
        // The tangent, turned the way this body turns — `spin` is set at spawn and cannot be derived
        // from the position, because the side it is on flips halfway round every orbit.
        e.velAlong = w.scrollPerStep + (-nAcross * e.spin * rate - nAlong * pull);
        e.velAcross = nAlong * e.spin * rate - nAcross * pull;
        /*
          ⚠️ **Clipped against the trailing edge rather than allowed to leave.** A ship flown to the
          very back of its box would otherwise have its orbit dip behind the camera, where
          `src/sim/entity.ts`'s cull retires it — which would make retreating to the back edge a way
          of deleting the toughest body in the game for free. Holding station in the camera's frame
          flattens the orbit against the edge instead, and the across half carries on.
        */
        if (e.along + e.velAlong < w.cameraAlong + CIRCLE_FLOOR) e.velAlong = w.scrollPerStep;
        break;
      }
      /*
        Chase the ship's position ALONG the lane, turning each time it overshoots.

        ⚠️ **The speed is the row's own `closing` plus the scroll, so the turn changes direction and
        never pace** — `src/content/enemies.ts` has the argument for why this arm authors no speed of
        its own. It also means the velocity computed on the way in is exactly what the spawner
        already set, so no engagement range is needed and there is no step where the body visibly
        changes gear.

        ⚠️ **The crossing is detected against the SHIP'S previous position as well as its own.** Both
        are moving; comparing this step's positions against last step's own would report a crossing
        every time the player flew past a stationary body.
      */
      case 'loop': {
        if (e.turnsLeft <= 0) break;
        const isAhead = e.along >= ship.along;
        if (isAhead !== e.prevAlong >= ship.prevAlong) {
          e.turnsLeft--;
          // Out of turns: hand it back to the closing speed it was spawned with, and let it go.
          if (e.turnsLeft <= 0) {
            e.velAlong = -row.closing * w.difficulty.closing;
            break;
          }
        }
        const rate = (row.closing * w.difficulty.closing + w.scrollPerStep) * aggression;
        e.velAlong = w.scrollPerStep + (isAhead ? -rate : rate);
        break;
      }
      default: {
        // Adding a member to `Motion` fails to compile HERE, per 0016's fifth defeat.
        const unhandled: never = m;
        void unhandled;
        break;
      }
    }
  }
}

/**
 * Everything lying about, wandering.
 *
 * Asked for in play: *"power ups and buffs should also have a drifting, moving flight rather than a
 * static straight line."*
 *
 * ⚠️ **It bounces off the lane edges rather than wrapping or stopping**, which is the same shape
 * `src/app/boss.ts` uses for the boss's patrol and for the same reason: there is nothing off the
 * lane worth drifting to, and a pickup that parked at the edge would be one the player has to fly
 * into the wall for.
 *
 * ⚠️ **It stays slow.** `src/content/pickups.ts` records that a pickup holding station is what gives
 * the player a known amount of time to decide to go for it; drift is meant to make that decision
 * about a moving target rather than to turn it into a reflex.
 */
function driftPickups(w: World): void {
  for (let i = w.pickups.size - 1; i >= 0; i--) {
    const item = w.pickups.at(i);
    if (item.across - item.radius <= 0) item.velAcross = Math.abs(item.velAcross);
    else if (item.across + item.radius >= ACROSS_SPAN) item.velAcross = -Math.abs(item.velAcross);
    /*
      ⚠️ **A scattered pickup that runs out of time leaves a burst**, because
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` is named for
      exactly this: the model resolves *that one is gone now* and, without this, the picture says
      nothing — a pickup the player was flying towards simply is not there any more, which reads as a
      collection that failed rather than as a clock that ran out.

      ⚠️ **On the step BEFORE `stepEntities` retires it**, which is the same shape `stepBombs` uses for
      a fuse: after the release the slot belongs to whatever spawns next, so its position is gone.
    */
    if (item.lifeFor === 1) burst(w, item.along, item.across, BURST.shield);
    /*
      THE WAIT — `docs/decisions/0064-a-pickup-waits-to-be-taken.md`.

      ⚠️ **`holdFor` covers the whole window: the approach AND the wait**, and it is set at spawn from
      the distance the pickup has to cover. That is what makes it end. A test on *have I reached the
      station* cannot: a body holding station never moves relative to the camera, so the condition
      that started the hold is true forever afterwards and the pickup would never leave.

      ⚠️ **Holding station is `velAlong = scrollPerStep`**, which is the camera's own rate — 0034's
      *every speed is in the camera's frame*, and the same line the boss's station uses. Zero is what
      the pickup carries before and after: a body with no speed of its own falls back through the view
      at the scroll rate, which is exactly what a pickup arriving and then leaving should do.
    */
    if (item.holdFor <= 0) {
      /*
        ⚠️ **A SCATTERED piece lands here, and `lifeFor` is what says so** — it carries no `holdFor`.
        `scatterUpgrades` throws it in two axes and this is what
        spends the `along` half: the excursion is `speed ÷ PICKUP_EASE`, about 11 world units, after
        which it is holding station and bouncing across for the rest of its five seconds. That is the
        whole of why `docs/decisions/0066-a-death-scatters-what-it-took.md`'s objection to throwing
        along — *"off the front or the back of the screen inside two seconds"* — no longer applies.

        ⚠️ **The two targets are different and both are 0034's frame.** A scattered piece holds the
        distance the ship died at, so its target is the camera's own rate; an authored pickup whose
        wait has run out is meant to leave, so its target is zero — a body with no speed of its own
        falls back through the view.
      */
      const drift = item.lifeFor > 0 ? w.scrollPerStep : 0;
      item.velAlong += (drift - item.velAlong) * PICKUP_EASE;
      continue;
    }
    item.holdFor--;
    /*
      THE WALL, AND WHY THIS IS A LAG RATHER THAN AN ASSIGNMENT — 0077.

      ⚠️ **The station is the same one 0064 set and only the approach to it has changed.** These two
      lines used to be one assignment, so the step a pickup crossed the station was a step on which
      its screen-relative speed went from `SCROLL_PER_STEP` to zero — a picture of an impact with
      nothing there to hit.

      ⚠️ **The bob is part of the TARGET rather than added to the result**, and the difference is not
      cosmetic: added afterwards it would accumulate into `velAlong` and only leak out at
      `PICKUP_EASE`, which is a leaky integrator with a gain of about 13 — a pickup shuttling several
      units a step. Inside the target it is the thing being tracked, and the lag ATTENUATES it to a
      wander of roughly ±5 world units.

      `Math.sin` allocates nothing, which is what `tests/budget.test.ts` counts.
    */
    /*
      AND THE WALL SURVIVED THE LAG — `docs/decisions/0087-a-pickup-never-parks.md`. Reported from
      play against the build 0077 landed in: *"pickups come up fast, still hit the middle barrier and
      then float a bit."*

      ⚠️ **The target used to be `w.scrollPerStep`, which is the camera's own rate — a full stop in
      the frame the player watches.** Easing onto it made the arrival smooth and left every pickup
      parked at one screen position, which is what a barrier IS. It is now a fraction of the scroll
      rate BELOW the camera's, so a slowed pickup is still closing and there is no place on the
      screen where pickups stop.
    */
    /*
      ⚠️ **`item.bobPhase` AND IT USED TO BE `item.across`** — 0087, and it is a defect the picture
      reported rather than the source. `across` drifts, so it was not an offset that spread two
      pickups apart: it was a second term advancing the phase, and the bob ran at a quarter of the
      period `PICKUP_BOB_UNITS` names. `src/sim/entity.ts` has the measurement.
    */
    /*
      ⚠️ **AND IT BOBS ONLY ONCE IT HAS SLOWED, which the old amplitude was too small to make
      matter.** The bob belongs to the wait, not to the arrival: a pickup still crossing the view at
      the full scroll rate that also wobbles is a pickup whose approach reads as indecision, and at
      0.4 the wobble is big enough to look like it has already stopped running away — which
      `tests/pickups.test.ts` reported as *waiting further out than the ship can fly*, from a place it
      was only passing through.
    */
    if (item.along - w.cameraAlong > PICKUP_SLOW_AT) {
      item.velAlong += (0 - item.velAlong) * PICKUP_EASE;
      continue;
    }
    const target =
      w.scrollPerStep * (1 - PICKUP_CLOSE_SHARE) +
      PICKUP_BOB_SPEED * Math.sin(w.cameraAlong / PICKUP_BOB_UNITS + item.bobPhase);
    item.velAlong += (target - item.velAlong) * PICKUP_EASE;
  }
}

/**
 * Throw the upgrades a death has just cost back onto the field.
 *
 * Asked for in play: *"when a player dies, their power ups should explode from where they were and
 * bounce around the screen… non-cycling and on a short timer so there's enough time to grab some, but
 * maybe not all."* `docs/decisions/0066-a-death-scatters-what-it-took.md`.
 *
 * ⚠️ **Exported and called by `src/app/mount.ts`, exactly as `respawn` and `launchSpecial` are.** The
 * frame cannot see the run — `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`
 * puts the upgrade list in `src/state/` — so the shell hands over what was lost and this is the half
 * that moves entities.
 *
 * ⚠️ **It has to be called BEFORE the reducer clears the list**, which is a real ordering the shell
 * has to keep. There is no way to state it here; `tests/pickups.test.ts` drives the shell's order.
 *
 * ⚠️ **A RING rather than a line, and the even spacing survives the jitter** —
 * `docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md`. Reported from play: *"when a player
 * dies the powerups spawn straight up/down the screen, they don't spread out in a random pattern and
 * bounce around the screen."* This used to fan in `across` alone, so every piece left along one line.
 *
 * ⚠️ **0066's reason for that is kept and its conclusion is not.** *"A seeded scatter that happened
 * to stack two of them on one lane would take one of them away"* is still true, so the angle is
 * `i/n` of a circle PLUS a bounded jitter rather than a free draw — six upgrades still arrive as six
 * separate things. What has gone is the claim that a piece thrown along would leave the screen: it
 * decays back to the scroll rate in `driftPickups`, so its whole excursion is about 11 world units.
 */
export function scatterUpgrades(w: World, upgrades: readonly UpgradeKind[]): void {
  /*
    ── ALL OF THEM, AND FOR ONE DAY IT WAS HALF ───────────────────────────────────────────────────

    Reported from play: *"tested the 50% on death and it's too punishing, let's make 100% for weapons
    and missiles, but no shields spawn on death."*
    `docs/decisions/0083-two-ladders-of-four.md`, restoring what
    `docs/decisions/0066-a-death-scatters-what-it-took.md` built.

    ⚠️ **Shields are absent by CONSTRUCTION rather than by a filter.** They live on the ship's
    `health` (0050), not in the upgrade list, so the signature is the guarantee: this takes
    `UpgradeKind[]` and a shield is not one. `tests/pickups.test.ts` holds it anyway, because *true
    because of a type* stops being obvious the moment somebody widens the type.

    ⚠️ **Bounded by the pool, and the bound is what `count` is for.** A player carrying thirty
    upgrades cannot have thirty pieces on the field — `src/sim/pool.ts` drops rather than grows — so
    the ring is spaced over what will actually reach it. Spacing over the whole loadout and letting
    the pool refuse the tail is the version that leaves gaps, which is the one failure mode 0066 says
    the even spacing exists to prevent.

    ⚠️ **Read off the POOL rather than from `CAPACITY` in `src/app/mount.ts`.** They are the same
    number and only one of them is reachable from here: `mount.ts` imports this file, so importing it
    back would be a cycle. `Pool` already knows how big it is, which makes this the single description
    rather than a copy that has to be kept in step.

    ⚠️ **Unreachable at the current tiers, and kept anyway.** Both ladders cap at `UPGRADE_TIERS`, so
    the shell can never build a list longer than eight — but `weaponFor` deliberately tolerates a
    longer one (a saved run, a test), and this is the line that stops such a list spacing a ring the
    field cannot hold.
  */
  const room = w.pickups.capacity;
  scatterRing(w, upgrades, upgrades.length > room ? room : upgrades.length);
}

/**
 * Throw exactly these `count` pieces, evenly around a circle at the wreck.
 *
 * ⚠️ **`count` rather than `upgrades.length`, and it survived the filter that needed it.** 0082's
 * 50% coin is gone, but the reason for the split is not: `count` is the divisor that spaces the ring,
 * and it has to be how many pieces are really going to appear.
 */
function scatterRing(w: World, upgrades: readonly UpgradeKind[], count: number): void {
  /*
    ⚠️ **WHERE THE SHIP DIED, not where the ship object still is** — 0079. This used to read
    `w.ship.along` and that was exactly right for as long as the scatter happened on the step the hull
    reached zero. It now happens at the END of the beat, `DEATH_STEPS` later, and the ship object has
    been sitting still in world coordinates the whole time — so the camera has moved about 27 units
    out from under it, and the pickups would arrive a beat's worth of scroll behind the wreck they
    came off. `stepBossDeath` remembers an offset for the identical reason and 0062 says so.
  */
  const along = w.cameraAlong + w.deathOffset;
  for (let i = 0; i < count; i++) {
    const kind = w.pickupKinds[upgrades[i]!];
    const row = w.pickupRows[kind];
    if (row === undefined) continue;
    const item = w.pickups.spawn();
    // A scatter one pickup short is dropped rather than grown — `src/sim/pool.ts` has the argument,
    // and a player with more upgrades than the pool has slots has had a very good run.
    if (item === null) return;
    reset(item, along, w.deathAcross, row, kind);
    /*
      THE RING — an angle per piece, evenly spaced and then jittered.

      ⚠️ **The even term is the guarantee and the jitter is the picture.** Without the first, two
      pieces can leave along the same heading and the player loses one of them for nothing; without
      the second, a death looks like a diagram. `SCATTER_JITTER` is under half the gap between
      neighbours at any count, so the ordering around the circle can never invert.

      ⚠️ **`velAlong` is the scroll rate PLUS the along component**, which is 0034's *every speed is
      in the camera's frame*. The along half is spent against `PICKUP_EASE` in `driftPickups` — about
      11 world units — and what is left is a piece holding the distance the ship died at and bouncing
      across the lane, which is what 0066 built and this keeps.
    */
    const halfGap = (Math.PI / count) * SCATTER_JITTER_SHARE;
    const angle = (i / count) * Math.PI * 2 + w.scatterRng.range(-halfGap, halfGap);
    const speed = SCATTER_SPEED * w.scatterRng.range(SCATTER_SPREAD_MIN, SCATTER_SPREAD_MAX);
    item.velAcross = Math.sin(angle) * speed;
    item.velAlong = w.scrollPerStep + Math.cos(angle) * speed;
    item.lifeFor = SCATTER_STEPS;
  }
}

/**
 * One authored pickup, at the place the level put it.
 *
 * ⚠️ **It holds station in the world and closes at exactly the scroll rate**, like a drifter — so a
 * player who sees one has a known amount of time to decide to go for it. Anything that closed faster
 * would make the decision a reflex, and `docs/game.md` wants taking an upgrade to be worth doing
 * rather than something that happens to you.
 */
function spawnPickup(w: World, index: number): void {
  const entry = w.level.pickups[index];
  if (entry === undefined) return;
  const kind = w.pickupKinds[entry.kind];
  const row = w.pickupRows[kind];
  if (row === undefined) return;
  const item = w.pickups.spawn();
  if (item === null) return;
  /*
    ⚠️ **THE DIAL TURNS HERE, and it turns on the SPAWN rather than on the collection** —
    `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`, and the ask's own words: *"dials it up
    per power up spawn."* The alternative — counting what the player picked up — cannot sawtooth,
    because upgrades cross a level boundary and their notches would cross with them.

    ⚠️ **After the pool has answered, so a pickup the field had no room for does not turn it.** The
    dial is *what this level has offered*, and something the player never saw was not offered. It is
    the same reason the counter is not incremented alongside `nextPickup`, which advances whether or
    not a slot was free.

    ⚠️ **`weapon` only.** The ask keys the dial to *weapon* power-ups specifically, and the arithmetic
    depends on it: four a level over seven levels is what puts the last boss at exactly `DIAL_MAX`.
    Counting missiles too would take it to 17.
  */
  if (entry.kind === 'weapon') w.weaponsOffered++;
  reset(item, entry.at, entry.lane, row, kind);
  /*
    ⚠️ **Which way it starts drifting alternates by INDEX rather than being rolled.** The spawn
    stream exists and is deliberately not consulted here for the reason `spawnWave` gives: a level is
    authored, and a pickup that drifted a different way every run could not be placed by a hand.
    Alternating means two pickups near each other visibly separate rather than moving as a pair.
  */
  item.velAcross = index % 2 === 0 ? PICKUP_DRIFT : -PICKUP_DRIFT;
  /*
    WHERE IN ITS BOB THIS ONE STARTS — 0087, and the golden angle for the same reason the drift above
    alternates rather than rolling: a level is authored, so two pickups near each other must visibly
    separate on every run rather than on most of them. Successive multiples of 2.39996 rad are the
    most evenly spread sequence there is, so no two of a level's nine ever land in step.
  */
  item.bobPhase = index * GOLDEN_ANGLE;
  /*
    HOW LONG IT HAS BEFORE THE SCROLL TAKES IT AWAY — the approach plus the wait, in steps.

    ⚠️ **Computed from where it actually starts rather than from a constant**, because a wave's
    authored `at` and the camera at the moment it spawns differ by up to one step, and because
    `docs/decisions/0064-a-pickup-waits-to-be-taken.md` wants the WAIT to be the same seven seconds
    for every pickup rather than the total to be the same. A pickup that spawned already inside the
    slowdown gets no approach and all of the wait, which is the honest answer.

    ⚠️ **Nothing allocates**: a subtraction, a divide and a `Math.max`.
  */
  const approach = (entry.at - w.cameraAlong - PICKUP_SLOW_AT) / w.scrollPerStep;
  item.holdFor = PICKUP_LINGER_STEPS + Math.max(0, Math.round(approach));
}

/**
 * A boss coming apart, and the beat before the level is reported cleared.
 *
 * Asked for in play: *"bosses need a real explosion and an end-of-level beat. Currently the level just
 * ends."* `docs/decisions/0062-a-boss-dies-loudly.md`.
 *
 * ⚠️ **A rate rather than one big burst.** One burst of any size is over in half a second and reads
 * exactly like an enemy dying, because it is an enemy dying with a bigger number. Pulses over a second
 * and a half read as a thing coming apart.
 *
 * ⚠️ **In the CAMERA's frame**, which is why the place is remembered as an offset rather than as a
 * world position: over a second and a half the camera covers 54 units, so a world position would put
 * the explosion visibly behind where the player watched the boss die.
 *
 * ⚠️ **The simulation keeps running through it**, so the beat is a beat rather than a freeze — the
 * scroll continues, the player still flies, and anything the boss left in the air still arrives.
 */
function stepBossDeath(w: World): void {
  if (w.clearedIn <= 0) return;
  w.clearedIn--;
  if (w.clearedIn % BOSS_PULSE === 0) {
    /*
      Scattered across the hull rather than all from its centre. The burst stream, per 0021: where a
      fragment comes from is the most cosmetic roll in the game and must not move a wave by one enemy.
    */
    const spread = w.bossRow.radius;
    burst(
      w,
      w.cameraAlong + w.bossOffset + w.burstRng.range(-spread, spread),
      w.bossAcross + w.burstRng.range(-spread, spread),
      BURST.boss,
    );
  }
  // The one report, at the end of the beat. `bossBeaten` already latched, so this happens once.
  if (w.clearedIn === 0) w.onCleared();
}

/**
 * The ship reached zero health: throw the bang, take it off the field, and start the beat.
 *
 * ── THE STEP THIS USED TO BE THE WHOLE OF ───────────────────────────────────────────────────────
 *
 * Reported from play: *"when a player dies, they instantly respawn, there needs to be the player ship
 * explosion, a pause, then a respawn. This also needs to happen before the 'continue' screen shows up
 * as well."*
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.
 *
 * ⚠️ **It used to be one burst and `onDeath()`, and `onDeath` put a new ship at the back of the box
 * before the frame was drawn.** So the player's own death was the one event in the game with no
 * picture at all — `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` names
 * that failure and records it being reported three times as something else.
 *
 * ⚠️ **THE SHIP LEAVES ITS POOL, which is what makes the beat a picture rather than a pause.** A
 * stationary hull sitting in the lane for a second reads as the game having frozen; an absence reads
 * as a death. It is also the honest gate — see the `flying` block in `step`.
 */
function wreckShip(w: World): void {
  /*
    ⚠️ **An OFFSET from the camera, not a world position** — the same note `driveBoss` carries, and
    the same mistake 0062 documents having made. The camera covers about 27 units during the beat, so
    a world position would drift the explosion, and the scatter that follows it, out from under the
    place the player was looking.
  */
  w.deathOffset = w.ship.along - w.cameraAlong;
  w.deathAcross = w.ship.across;
  burst(w, w.ship.along, w.ship.across, BURST.ship);
  // Beside the burst, which is the picture it is the twin of. The ship coming apart and the ship
  // being heard to come apart are one event and are written on one line apart.
  w.onCue('death');
  /*
    ⚠️ **The shell is NOT cleared here, and that is deliberate rather than forgotten.** `stepShields`
    derives the mark count from the ship's health every step and this ship's health is at or below
    zero, so the shell is released — with a burst per mark, which is the right picture — by the one
    description that already owns it. A `shieldOrbs.clear()` here would be a second answer to *how
    many shields does this ship have*, and `src/content/ships.ts` spends a paragraph on why there is
    only ever one.
  */
  // Index 0, because `CAPACITY.ship` is 1 and there is exactly one live occupant to release.
  w.shipPool.releaseAt(0);
  w.dyingIn = DEATH_STEPS;
  /*
    ⚠️ **Reported HERE and not at the end of the beat, because the arsenal is still full here.** The
    shell answers by lighting the pyre; the dispatch that empties the charges is the one at the end,
    which is also the one that raises the continue screen. 0079.
  */
  w.onWreck();
}

/**
 * The ship coming apart, and the beat before the life is reported spent.
 *
 * ⚠️ **`stepBossDeath`'s mechanism exactly, at a different size** — 0062 built it and 0079 copies it
 * rather than inventing a second way for a thing to come apart. A rate rather than one big burst,
 * placed in the camera's frame, and **one report at the end**.
 *
 * ⚠️ **The simulation keeps running through it**, so it is a beat rather than a freeze: the scroll
 * continues, the waves keep arriving, and whatever killed the player is still there when the new ship
 * appears — which is `docs/decisions/0057-a-death-does-not-rewind-the-level.md` and the reason
 * `RESPAWN_INVULN_STEPS` is as long as it is.
 */
function stepShipDeath(w: World): void {
  if (w.dyingIn <= 0) return;
  w.dyingIn--;
  if (w.dyingIn % DEATH_PULSE === 0) {
    // Scattered across the hull rather than all from one point, exactly as the boss's pulses are.
    // The burst stream, per 0021: a fragment's place must not move a wave by one enemy.
    const spread = w.shipRow.radius;
    burst(
      w,
      w.cameraAlong + w.deathOffset + w.burstRng.range(-spread, spread),
      w.deathAcross + w.burstRng.range(-spread, spread),
      BURST.dying,
    );
  }
  /*
    The one report, at the end of the beat. The shell scatters the upgrades, spends the life and — if
    the run survives — calls `respawn`, which is what clears this counter.

    ⚠️ **`src/state/root.ts` raises the run-over screen off that dispatch**, so this line is also
    what puts the explosion in front of the continue screen. Both halves of the report, one place.
  */
  if (w.dyingIn === 0) w.onDeath();
}

/**
 * Light the pyre: everything the ship never spent, going off where it died.
 *
 * Asked for in play: *"the player's ship (and only the player's ship) exploding on death should fire
 * all unspent bombs at the player ship's location with an expanding ring based on number of bombs…
 * effectively a way to give the player some breathing space for when they respawn."*
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.
 *
 * ⚠️ **Exported and called by `src/app/mount.ts`, exactly as `scatterUpgrades` and `respawn` are.**
 * The frame cannot see the run (0015, 0039), so the shell counts the charges and this is the half
 * that moves an entity — and it is called from `onWreck` rather than `onDeath` because the dispatch
 * at the end of the beat is what takes those charges away.
 *
 * ⚠️ **It cannot hurt the player, and that falls out of the beat rather than being checked for.** A
 * blast lands on the step AFTER it appears (`step` zeroes the damage at the end of the step it lands
 * on), and on that step the ship is not in `shipPool` — so the pairing has nothing to find. By the
 * time the ship is back, `BLAST_STEPS` has expired four times over.
 *
 * ⚠️ **`w.blasts` is the pool, so a pyre can be refused.** Four slots and a player who has just lost
 * a ship that was carrying at most one bomb in the air: the case cannot arise, and if it ever does,
 * a dropped spawn is silent for the reason every other dropped spawn in this file is —
 * `src/sim/pool.ts` drops rather than grows.
 */
export function detonateArsenal(w: World, charges: number): void {
  const ring = w.blasts.spawn();
  if (ring === null) return;
  reset(ring, w.cameraAlong + w.deathOffset, w.deathAcross, SHOTS[pyreFor(charges)]);
  // It holds station in the world while everything else moves past it — a shockwave is a place rather
  // than a body, which is the same statement `stepBombs` makes about a bomb's blast.
  ring.lifeFor = BLAST_STEPS;
  // The blast's own cue. It is the same event as a bomb going off, so it is the same sound — and it
  // is emitted after the `null` check, like every other cue in this file.
  w.onCue('blast');
}

/** The boss, if there is one on the field. Its whole behaviour lives in `src/app/boss.ts`. */
function driveBoss(w: World): void {
  if (w.bossPool.size === 0) return;
  const boss = w.bossPool.at(0);
  w.bossPatrol = stepBoss(
    boss,
    w.bossRow,
    w.bossFullHealth,
    w.difficulty,
    w.ship,
    w.enemyShots,
    SHOTS[w.bossRow.shot],
    w.cameraAlong,
    w.scrollPerStep,
    w.bossPatrol,
  );
  /*
    ⚠️ **Where it is, remembered every step, so that where it DIED is known on the step it stops
    existing.** A released slot is the next thing `spawn` hands out (`src/sim/pool.ts`), so reading
    the position off the pool after the collision is reading whatever moved in behind it. `deaths`
    carries positions for exactly this reason and cannot be used here: it does not say which pool an
    entry came from, and a boss can die on the same step as an enemy.

    An OFFSET from the camera rather than a world position, because the explosion has to stay where
    the player watched it happen and the camera covers 54 units while it plays.
  */
  w.bossOffset = boss.along - w.cameraAlong;
  w.bossAcross = boss.across;
}

/**
 * Put the boss on the field, at the leading edge and in the middle of the lane.
 *
 * Centred rather than placed, because it is about to occupy a quarter of the lane and there is no
 * side of it that is the interesting one to arrive on.
 */
function spawnBoss(w: World): void {
  const boss = w.bossPool.spawn();
  if (boss === null) return;
  // In LEVEL coordinates like every other authored place — 0076.
  reset(boss, w.level.bossAt + w.levelOrigin, ACROSS_SPAN / 2, w.bossRow);
  boss.health = toughnessFor(w.bossRow.health, w.difficulty);
  // Recorded, because a phase is a fraction of what the boss STARTED with and the row no longer
  // says what that was. `src/app/boss.ts` takes it as an argument for exactly that reason.
  w.bossFullHealth = boss.health;
  // On the grid from its first shot, like everything else that shoots — 0096.
  boss.fireIn = nextOnGrid(w.steps, fireGapFor(w.bossRow.phases[0]!.fireEvery, w.difficulty));
  w.bossPatrol = 1;
}

/**
 * Draw the ship as what it is carrying — `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md`.
 *
 * Reported from play: *"additional autofire and missile upgrades don't change the look of the
 * player's ship"*, against `docs/game.md`'s rule that every upgrade does.
 *
 * ⚠️ **Exported and called from two places, which is one description rather than two.** `respawn`
 * calls it because `reset` writes the ROW's sprite back over whatever the ship was wearing, and the
 * shell calls it because a pickup changes the weapon without touching the ship. Written out at either
 * call site instead, the day somebody adds a third is the day the hull stops keeping up.
 *
 * ⚠️ **`spriteHit` as well as `spriteBase`, because `stepEntities` derives `sprite` from both.**
 * Setting only the first would leave an upgraded ship flashing as the tier-0 hull on every hit — a
 * silhouette that changes at the one moment the player is least able to read it.
 *
 * ⚠️ **Not called per step.** It is a pure function of the resolved weapon, which the shell
 * recomputes only when the upgrade list moves; a per-step write would be this file doing work sixty
 * times a second to answer a question that changes a few times a run.
 */
export function wearHull(w: World): void {
  const hull = hullFor(w.weapon.tier);
  w.ship.spriteBase = hull.base;
  w.ship.spriteHit = hull.hit;
  // `sprite` is derived by `stepEntities`, but the frame between now and the next step draws from it.
  w.ship.sprite = w.ship.flashFor > 0 ? hull.hit : hull.base;
}

/**
 * Put the ship back after a death the run survived.
 *
 * Called by the shell, not from the step above — `docs/decisions/0039-…` puts the cost of a death in
 * `src/state/`, and this is only the half of it that moves an entity.
 *
 * ⚠️ **Debris is NOT cleared, and it is the one thing on screen that survives a death.** The burst
 * marking where the ship died is the clearest signal in the game that a life just ended; wiping it
 * on the same step would delete the explanation along with the cause.
 */
export function respawn(w: World): void {
  /*
    ⚠️ **THE ENEMIES AND THEIR SHOTS ARE NOT CLEARED, AND THAT IS THE WHOLE OF 0057.** They used to
    be, and reported from play: *"when a player dies the entire screen resets, the level shouldn't
    reset, just the player's power ups."* Sweeping the field is the mercy that reads as a rewind —
    everything the player had fought through vanishes, the level goes quiet, and the next wave
    arrives out of nowhere. Nothing about the level's own clock ever moved (`nextWave` and the camera
    both survived a death already); it only LOOKED as though it had, because the screen emptied.

    What is cleared below is exactly what belonged to the ship that died.

    ⚠️ **They are cleared by `resetScene`, and the day 0057 landed they were cleared by nothing** —
    `docs/decisions/0067-a-new-run-opens-on-an-empty-field.md`. A reader who takes this paragraph to
    mean *the enemies are never swept* has the half that produced the bug: they are swept when a
    LEVEL starts, and this function is about a LIFE.
  */
  w.playerShots.clear();
  w.missiles.clear();
  /*
    ⚠️ **A bomb in the air is lost with the ship that threw it, and its blast with it.** The charge
    was spent, which is 0039's rule about what a death costs read at its smallest scale — and a blast
    that outlived its thrower would be a hit on the replacement ship from a weapon nobody fired.
  */
  w.bombs.clear();
  w.blasts.clear();
  /*
    ⚠️ **The shell is cleared HERE rather than left to `stepShields`.** The ship comes back with its
    hull and nothing else, so the marks would be released anyway — but as three bursts, at the place
    the new ship is sitting, one step after it arrived. A player who had just lost a life would be
    shown three shields popping off a ship that never carried them.
  */
  w.shieldOrbs.clear();
  /*
    ── THE SHIP COMES BACK INTO ITS POOL, WHICH IT ONLY HAS TO DO BECAUSE IT LEFT ──────────────────

    `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`. `wreckShip`
    releases it so that the beat shows an absence rather than a stationary hull, and this is the other
    end of that.

    ⚠️ **`w.ship` is REASSIGNED rather than assumed**, and the assumption it replaces is true today
    and is not a thing to lean on silently: `CAPACITY.ship` is 1, so the pool owns exactly one object
    and hands the same one back. `tests/death.test.ts` drives a death and asserts the pool's occupant
    IS `w.ship` afterwards, so the day the capacity moves the guard says so rather than the game
    quietly flying a ship nobody is drawing.

    ⚠️ **Guarded on `size === 0`, because two of the three callers reach here with the ship still in
    the pool** — `resume` after a run-over that stopped stepping mid-beat, and `resetScene` at boot.
    Spawning unconditionally would be a second live ship the first time either of them ran.
  */
  w.dyingIn = 0;
  if (w.shipPool.size === 0) {
    const back = w.shipPool.spawn();
    if (back !== null) w.ship = back;
  }
  reset(w.ship, w.cameraAlong + SHIP_START_ALONG, ACROSS_SPAN / 2, w.shipRow);
  holdStation(w.ship, w.scrollPerStep);
  /*
    ⚠️ **A RESPAWN'S INVULNERABILITY IS NOT A HIT'S, and it stopped being the same number the moment
    the field survived a death.** `INVULN_STEPS` is 0.75s and it is sized for *a hit landed while the
    player was flying* — they are already where they chose to be, and they keep flying. A respawn
    puts a ship the player is not yet holding into a lane that is still full of everything that just
    killed them, and 0.75s of that is a second death they never had a hand on.

    See `docs/decisions/0057-a-death-does-not-rewind-the-level.md`: keeping the field is the change
    the player asked for, and this is the number that has to move with it or the change is a
    punishment rather than a mercy.
  */
  w.ship.invulnFor = RESPAWN_INVULN_STEPS;
  // ⚠️ AFTER `reset`, which wrote the ROW's sprite back over whatever the ship was wearing — 0081.
  // A death clears the upgrades, so this is normally the base hull; a CONTINUE is the same statement.
  wearHull(w);
  /*
    ⚠️ **The pickups on screen are NOT cleared, and that is the answer to what a death costs.**
    0039 empties the arsenal, which means the twenty seconds after a death are the hardest in the
    level — so anything the player had not yet reached is still there to be flown for. Wiping them
    would turn one mistake into a stretch with no way back out of it.
  */
  // ⚠️ A RESPAWN REJOINS THE GRID RATHER THAN RESTARTING IT — 0094. A full cadence here would put the
  // gun back at whatever phase the death happened at, which is the one moment in a run guaranteed to
  // be at an arbitrary place in the bar.
  w.fireIn = stepsToGrid(w.steps, w.weapon.fireEvery);
  w.missileIn = stepsToGrid(w.steps, w.weapon.missileEvery);
}

/**
 * Put a level on the field and start it from the beginning.
 *
 * ⚠️ **It touches the level and the scene, and nothing about the RUN.** Lives, upgrades and the
 * arsenal all cross a level boundary — that is what `docs/game.md`'s *"carry forward"* means once
 * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` amended it — so they live in
 * `src/state/` and this cannot reach them even by accident.
 */
export function startLevel(w: World, level: LevelRow): void {
  w.level = level;
  /*
    ⚠️ **ZERO, and it is not a default — it is what this function MEANS.** `startLevel` is the run
    beginning: the camera goes to zero, the field is swept, and `src/app/lifecycle.ts` dispatches
    `begin` (which resets the run's level index) immediately before calling it. A run that started
    anywhere else would be a resume, and 0068's continue deliberately does not come through here.
    `advanceLevel` is the one that takes an index, because it is the one where the index varies.
  */
  w.levelIndex = 0;
  w.bossRow = BOSSES[level.boss];
  resetScene(w);
}

/**
 * Change which script is running, and change nothing else.
 *
 * ── A LEVEL BOUNDARY IS A CHANGE OF SCRIPT, NOT A CHANGE OF SCENE ───────────────────────────────
 *
 * Reported from play: *"there's a background scene reset between levels that's disjointing because it
 * moves the player's ship, the level change needs to be seamless."*
 * `docs/decisions/0076-a-level-has-an-origin.md`.
 *
 * ⚠️ **The camera does not move, the ship does not move, and no pool is swept.** Every one of those
 * was a visible jump at the one moment [0063](docs/decisions/0063-a-level-break-is-a-respite.md) had
 * just finished arranging for the world to keep flowing — a banner over a moving sky, and then the
 * sky snapping back to its start and the ship teleporting under it.
 *
 * ⚠️ **`keepShell` IS GONE, AND THIS IS WHY.** It existed because this path called `resetScene`,
 * which calls `respawn`, which puts a bare hull back — so the shell had to be read out and added
 * back around it. Nothing is reset here, so nothing has to be carried: 0058's rule *the shell crosses
 * a boundary because the ship does* is now true because **the ship never leaves**, rather than true
 * because of arithmetic. That is `docs/scaffold-plan.md`'s instruction ladder — remove the affordance
 * — applied to a mechanism 0058 had to build and no longer needs.
 *
 * ⚠️ **The level's BODIES are still swept, and a first draft of this did not sweep them.**
 * `tests/continue.test.ts` caught it: *"a level boundary sweeps the field for the same reason a run
 * does — an enemy belongs to the level."*
 * [0067](docs/decisions/0067-a-new-run-opens-on-an-empty-field.md) states it and
 * [0043](docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) is what it protects:
 * every level opens on an empty screen so the player can find the controls before anything finds
 * them. Carrying the last level's enemies through would fill exactly that opening stretch.
 *
 * ⚠️ **So *seamless* turned out to mean the CAMERA and the SHIP, not the bodies.** That is the whole
 * of what was reported — *"it moves the player's ship"* — and by the time `onward` runs, a boss has
 * died and three seconds of respite (0063) have passed, so what is being swept is a field that is
 * already almost empty. Nothing the player is watching jumps.
 *
 * ⚠️ **Debris is left alone**, because it retires itself and because the thing most likely to still
 * be on screen at this moment is the boss coming apart — which 0062 went to some trouble to make
 * visible. The player's own shots stay too: the ship did not leave, so neither did what it fired.
 */
export function advanceLevel(w: World, level: LevelRow, levelIndex: number): void {
  w.level = level;
  /*
    ⚠️ **REQUIRED rather than defaulted, because this is the parameter the dial is made of** —
    `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`. A default here would be a level
    boundary that silently kept the run at difficulty one, which is invisible in every screenshot and
    is the whole feature not working.
  */
  w.levelIndex = levelIndex;
  w.bossRow = BOSSES[level.boss];
  /*
    ⚠️ **The one line that makes the rest of it possible.** The script is authored from the level's
    own beginning, so the level begins here — wherever the camera has got to. Everything downstream
    reads `spawnAlong(camera) - levelOrigin` and cannot tell the difference.
  */
  w.levelOrigin = w.cameraAlong;
  beginScript(w);
}

/**
 * Everything `respawn` does, plus the state that belongs to the LEVEL rather than to the life: the
 * field is emptied, the camera goes back to the start and the debris of the last one is swept.
 *
 * ⚠️ **The camera reset is what makes two runs the same run.** Distance travelled is the only clock
 * a level has — a wave table places its content against `cameraAlong` — so a second run that started
 * where the first one ended would be playing a different level with the same name.
 */
/**
 * Put a level's SCRIPT back to its beginning, and sweep what belongs to a level.
 *
 * ⚠️ **Shared by the two ways a level starts, and it was duplicated into both for about an hour.**
 * `npm run prove` is what found it: four probes belonging to 0062 and 0067 reported *"the probe's
 * find appears 2 times — make it unique"*, which is the harness refusing to anchor on a line that had
 * quietly become two copies. The answer is one description rather than longer anchors —
 * `docs/decisions/0029-the-tracked-record-is-the-record.md` about prose, arriving in code.
 *
 * ⚠️ **A pool that belongs to the LEVEL is emptied here; a pool that belongs to the LIFE is emptied
 * by `respawn`** — `docs/decisions/0067-a-new-run-opens-on-an-empty-field.md`, which is the split that
 * stops 0057's regression happening a third time. An enemy belongs to the level, which is exactly why
 * it survives a death and must not survive a level.
 *
 * ⚠️ **`debris` is NOT here and that is deliberate.** It is cosmetic, it retires itself, and the thing
 * most likely to be on screen at a level boundary is a boss coming apart — which 0062 went to some
 * trouble to make visible. A new RUN sweeps it below; a boundary does not.
 */
function beginScript(w: World): void {
  w.enemies.clear();
  w.enemyShots.clear();
  w.bossPool.clear();
  w.pickups.clear();
  w.nextWave = 0;
  w.nextPickup = 0;
  /*
    ⚠️ **THE SAWTOOTH IS THIS LINE.** The dial is `levelIndex + weaponsOffered`, so zeroing the second
    at a level boundary is what drops it back — *"level 2 starts by dialing it back a couple of notches
    to give the player a breathing space"* — while the first keeps it above where the last level began.
    `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`.

    ⚠️ **In `beginScript` rather than in `advanceLevel`, so a RUN beginning resets it too.** Both paths
    come through here, which is the whole reason this function exists — `npm run prove` found the
    duplicate the last time something belonged in both.
  */
  w.weaponsOffered = 0;
  w.bossSpawned = false;
  w.bossBeaten = false;
  // ⚠️ Cleared as well as latched, or a level entered while the last one was still exploding would
  // report itself cleared a second and a half in, with its own boss still ahead of the player.
  w.clearedIn = 0;
  w.bossPatrol = 1;
}

export function resetScene(w: World): void {
  w.cameraAlong = 0;
  w.prevCameraAlong = 0;
  // The camera and the script start together, which is what a RUN beginning means — 0076.
  w.levelOrigin = 0;
  beginScript(w);
  // ⚠️ The one sweep a level boundary does not do: a new run opens on nothing at all, including the
  // fragments of whatever ended the last one.
  w.debris.clear();
  respawn(w);
}
