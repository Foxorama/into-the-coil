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
  flankAlongFor,
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
  nearestFrom,
  nearestInBox,
  strike,
  wound,
  type Collected,
  type Deaths,
} from '../sim/collide.ts';
import { type Body, type Entity, reset, stepEntities } from '../sim/entity.ts';
// `SCROLL_PER_STEP` for `PICKUP_SLOW_AT`, which is a distance derived from a duration — 0087. Every
// other speed in this file rides `w.scrollPerStep`, which is the same number reachable from a world.
// `PLAYER_ALONG_MARGIN` and `PLAYER_LEAD` are the two ends of the player's box, imported rather than
// restated so a scattered pickup's wall and the ship's own clamp are one number — 0100, and the same
// reason `src/app/mount.ts` imports `PLAYER_LEAD` for the mark that draws it (0074).
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD, flyShip, holdStation } from '../sim/flight.ts';
import { BURN_ASK, EASE_ASK, EXHAUST, LEAN_AT, PULSE_STEPS, THRUST } from '../content/exhaust.ts';
import type { Intent } from '../sim/intent.ts';
import type { Tuning } from '../sim/assist.ts';
import type { InputSource } from './input.ts';
import type { Pool } from '../sim/pool.ts';
import { BOLT_STEPS, paintBolts, paintScene, paintStacks, type Bound, type Landmarks, type Sky } from '../render/scene.ts';
import { LANDMARK_SLOTS, SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../content/sprites.ts';
import type { Surface } from '../render/surface.ts';
import type { Rng } from '../sim/rng.ts';
import type { EnemyKind, EnemyRow } from '../content/enemies.ts';
import type { ShipRow } from '../content/ships.ts';
import { INVULN_STEPS, SHIELD_MARK, hullFor, shieldsOf } from '../content/ships.ts';
import { SHOTS } from '../content/shots.ts';
import { BURST, DEBRIS, DEBRIS_BY_KIND, DEBRIS_KIND, DEBRIS_ROWS, type DebrisKind } from '../content/debris.ts';
import { FORMATIONS, gapAcross, streamOffset, type FormationKind } from '../content/formations.ts';
import { DEFAULT_ORIGIN, type LevelRow } from '../content/levels.ts';
import { BOSSES, type BossRow } from '../content/bosses.ts';
import { type DifficultyRow, fireGapFor, singleHitOnly, toughnessFor } from '../content/difficulty.ts';
import { nextOnGrid } from '../content/cadence.ts';
import {
  PICKUP_CYCLE_STEPS,
  PICKUP_KINDS,
  PICKUP_REPEATS,
  type PickupKind,
  type PickupRow,
  type UpgradeKind,
  type Weapon,
} from '../content/pickups.ts';
import { WEAPONS, WEAPON_KINDS, type FlightKind } from '../content/weapons.ts';
import { MISSILES, MISSILE_KINDS } from '../content/missiles.ts';
import { SPECIALS, pyreFor, type SpecialKind } from '../content/specials.ts';
import type { CueKind } from '../content/cues.ts';
import { openBy, phaseFor, stepBoss, throwCurtain, uncoilsBy } from './boss.ts';
import { RAIN_BOLT_KIND } from '../content/bosses.ts';
import type { Frame } from './loop.ts';

/** How far in front of the ship a shot appears, in world units — clear of its own hurtbox. */
export const MUZZLE_ALONG = 3;

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
 * 0.9 crossed the widest entry — outside the lane to the far side — in a little under two seconds.
 *
 * ── AND IT IS 0.55 NOW, WHICH IS THE DENSITY BEING PAID FOR ────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0114-the-fight-is-a-different-piece.md`.** Reported from play: *"the darts
 * that fly in halfway off the screen need to be changed a bit, too hard to dodge now."* **The word is
 * NOW** — nothing about the flankers moved. What moved is that a level went from 118 bodies a minute
 * to 181, so the same entry arrives with far more already on screen to read at the same time.
 *
 * ⚠️ **THE ENTRY POINT IS NOT WHAT CHANGED, AND THAT IS DELIBERATE.** *Halfway off the screen* is
 * `FLANK_ALONG`, which is `MAX_ALONG_SPAN / 2` — the player's own cap from
 * `docs/decisions/0048-a-threat-may-arrive-from-the-side.md`: *"entry point should be capped at 50%
 * from the right side of the screen — the player has a safe spawn zone from the left."* Moving it
 * would take back a guarantee that nothing appears behind them, to fix a problem that is about TIME.
 *
 * ⚠️ **In the unit the player experiences**: crossing to the middle of the lane took 1.30 seconds and
 * now takes 2.12; the widest entry went from 1.67 to 2.73. The body is also on screen longer before
 * it reaches the lane, which is the half a slower cross buys that a further entry would not.
 */
const FLANK_ENTRY_SPEED = 0.55;

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
 * How fast a waiting pickup wanders the length of the box, in world units per step — 0233.
 *
 * ⚠️ **A little faster than the across drift, because the box is longer than the lane is wide** —
 * about 156 units end to end against a 100-unit lane — and *"bounce off all the screen walls"* is a
 * thing the player has to SEE inside the wait. At 0.28 a pickup crosses the box in a little over
 * eight seconds and turns at the back wall inside its wait.
 *
 * ⚠️ **AND UNDER HALF THE SCROLL RATE, WHICH IS 0087's GUARD AND NOT A TASTE.** `tests/pickups.test.ts`
 * reads *the pickup stopped running away* as *moving at under half the rate it approached at*, in
 * the player's units; a wander at or above 0.3 is a pickup that never slowed down. It was 0.45 for
 * an afternoon, and that guard is what said so.
 */
const PICKUP_WANDER = 0.28;

/**
 * How far before a wall of the box a wandering pickup turns, in world units — 0233.
 *
 * ⚠️ **The ease's own stopping distance, so the turn finishes AT the wall rather than past it.** The
 * heading flips and the velocity follows it at `PICKUP_EASE`, which takes about a dozen steps to
 * reverse — measured at seven units of overshoot with the flip on the wall itself, which is seven
 * units of a pickup sitting where the ship cannot reach. Turning early is what makes the wall a wall.
 */
const PICKUP_TURN_ROOM = 8;

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
// A shade faster since 0243: two pieces thrown a third of a turn off the lane have to clear the ease
// in both axes each, where eight pieces round a ring shared the axes between them.
const SCATTER_SPEED = 0.85;

/**
 * How long a scattered upgrade flies its throw before it joins the wait, in steps.
 *
 * ── `SCATTER_STEPS` WAS HERE: A SHORT TIMER, AND 0236 RETIRED IT ────────────────────────────────
 *
 * It was 300 — five seconds, *"enough time to grab some, but maybe not all"* (0066). Reported from
 * the first play-test with the guns: *"it's too punishing now on death with rotation and weapons…
 * they need to last as long as regular power ups."* A death now costs the gun as well as the rungs
 * (0233) and the pieces that come back cycle, so a player recovering a loadout has three things to
 * time at once; five seconds was sized for one. A scattered piece carries `lingerFor` like any other.
 *
 * ⚠️ **What is left is the FLIGHT: three quarters of a second at `SCATTER_SPEED`**, bouncing off the
 * box, before the wander takes it. Long enough that eight pieces are visibly eight headings —
 * *"they just explode up and down now"* was the along half being eased away inside a second — and
 * short enough that none of them is far from where the ship died when the wait begins.
 */
const SCATTER_FLIGHT = 45;

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
/**
 * And a ceiling on the jitter in radians, since 0243: a share of the gap was written for a ring of
 * eight, where the gap is an eighth of a turn; at two pieces the gap is half a turn and a third of
 * it would swing a piece from nearly along the lane to nearly across it. A ninth of a turn either
 * way keeps both pieces in both axes.
 */
const SCATTER_JITTER_MAX = 0.2;

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

/*
  ── `PICKUP_CLOSE_SHARE` WAS HERE, AND 0233's WANDER IS WHAT REPLACED IT ─────────────────────────

  It was 0.35: the share of the scroll rate a slowed pickup kept closing at, so it never parked —
  `docs/decisions/0087-a-pickup-never-parks.md`'s answer to *"pickups come up fast, still hit the
  middle barrier and then float a bit."* The station was the barrier, and a pickup that kept coming
  slowly was the fix.

  ⚠️ **A pickup that wanders the box cannot park either, and the wander is a stronger statement of
  the same thing.** `PICKUP_WANDER` is the closing rate now — held under half the scroll rate by the
  same guard 0087 named — and where the wait begins is the front wall of the box rather than a
  distance derived from a share. 0087's rule stands; its number is gone.
*/

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
 *
 * ⚠️ **420 → 600, so the wander reaches the back wall and turns inside the wait** — 0233. At a
 * wander held under half the scroll rate, the box takes a little over eight seconds to cross, and a
 * seven-second wait was a pickup that left on the way to its first turn. Ten seconds is the floor;
 * a cycling pickup waits the longer of this and its repetitions (`lingerFor`).
 */
export const PICKUP_LINGER_STEPS = 600;

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
 *
 * ⚠️ **Exported, and something asserts on it now — but not on its VALUE** — 0150. A boss's bared
 * window is the phase this beat runs straight out of, and a window shorter than its own consequence
 * is one the player only sees in the explosion. `tests/level.test.ts` holds the window against this
 * rather than against a second number of its own, so the day this moves, that floor moves with it.
 */
export const BOSS_DEATH_STEPS = 96;

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
 * Where a pickup stops running away and begins its wander: the front wall of the player's box, less
 * the room a turn takes — 0233.
 *
 * ⚠️ **It was `SHIP_START_ALONG + PICKUP_LINGER_STEPS × PICKUP_CLOSE_SHARE × SCROLL_PER_STEP`** — the
 * distance a slowly closing pickup covered before its wait ran out, so that its journey ended at the
 * ship (0087). A pickup that wanders the box has no one place its journey ends, so the honest answer
 * to *where does the wait begin* is *where the box begins*: the same wall the wander turns at, which
 * is the only line on the screen that means anything to the player here.
 */
const PICKUP_SLOW_AT = PLAYER_LEAD - PICKUP_TURN_ROOM;

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
   * The place's landmarks — 0203. Rebuilt at a level boundary, never in a frame.
   *
   * ⚠️ **PER LEVEL, WHERE `sky` IS PER MOUNT**, and that is the difference between a field and a
   * placed object: the sky is the same four tiled layers all run and only its baked colours change,
   * while what landmarks exist and where they sit is a property of the level script.
   */
  landmarks: Landmarks;
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
  /**
   * The ship's exhaust: one entity, placed at the tail every step — 0230.
   *
   * ⚠️ **A pool of one rather than a field on the ship, because a painter is handed pools.**
   * `paintScene` blits what is in a layer; a flame that was a property of the ship would need the
   * painter to know what a ship is, which `src/render/scene.ts` refuses. Drawn directly under the
   * ship, so the root of the flame is behind the hull.
   */
  exhaust: Pool<Entity>;
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
  /**
   * Every link of chain lightning on screen — 0233. A link is an entity at its landing point that
   * lives `BOLT_STEPS` and is stroked by `paintBolts`; it is in no collision pairing, because its
   * damage was landed by hand on the step it was fired. Its own pool for the reason the missiles
   * have one: a bolt that the pulse's pool refused would be a hit the picture never mentioned (0036).
   */
  bolts: Pool<Entity>;
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
   * Where the ship's MISSILES landed this step, so a spark can be put there — 0227.
   *
   * ⚠️ **The missiles' and not the pulses'.** A pulse landing is told by the flash on the body it
   * hit; a missile is worth three of them and until now landed exactly the same way. Sized to the
   * missile pool, because no more than every missile in flight can land in one step.
   */
  hits: Deaths;
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
  /**
   * The arc's own stream — 0021, one stream per concern. It seeds a link's jag and picks where on a
   * boss a jumping bolt lands; a bolt that rolled on the spawn stream would move a wave by one enemy
   * every time it fired.
   */
  arcRng: Rng;
  /**
   * Where the serpent's lightning falls — `docs/decisions/0248-the-serpent-strikes.md`, its own
   * stream per 0021: a strike that rolled on the spawn stream would move a wave by one enemy.
   */
  rainRng: Rng;
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
  onPickup: (kind: PickupKind, face: number, stack: number) => void;
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
  /**
   * The row of the boss the level is fighting or about to fight, resolved when the fight is set up
   * so a step never looks a kind up by name.
   *
   * ⚠️ **Two fights a level since 0247** — `docs/decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md`:
   * the mid-boss's row while `fight` is 0, the end boss's once it is 1. `bossSpawned`, `bossBeaten`
   * and the rest of the boss state below are the CURRENT fight's, and are reset between the two.
   */
  bossRow: BossRow;
  /**
   * Which of the level's fights the boss state below is about: `0` the mid-boss, `1` the end boss.
   * A level with no mid-boss starts at `1`.
   */
  fight: number;
  /** The boss, alone in its own pool — so `playerShots` meeting it is its own pairing. */
  bossPool: Pool<Entity>;
  /** Whether the current fight's boss has been put on the field. Cleared between fights. */
  bossSpawned: boolean;
  /** Whether the current fight's boss has been beaten, so the beat below is started exactly once. */
  bossBeaten: boolean;
  /**
   * Steps left of the boss coming apart, or `0` when nothing is exploding.
   *
   * ⚠️ **The level is reported cleared when this reaches zero, not when the pool empties** —
   * `docs/decisions/0062-a-boss-dies-loudly.md`. `bossBeaten` is still the latch; this is the beat.
   * Only the END boss's death starts it — a mid-boss comes apart on `bossBurstIn` and the level goes
   * on (0247).
   */
  clearedIn: number;
  /** Steps left of a MID-boss coming apart, or `0`. The beat without the clear — 0247. */
  bossBurstIn: number;
  /** Where the boss is, ahead of the camera — remembered every step, read on the step it dies. */
  bossOffset: number;
  bossAcross: number;
  /** The radius of the hull coming apart on `bossBurstIn`, kept because `bossRow` has moved on — 0247. */
  bossBurstRadius: number;
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
   * Which phase the boss was in at the end of the previous step. `-1` while there is no boss.
   *
   * ── A PHASE CHANGE IS AN EVENT AND THE MODEL STORED NO SUCH THING ──────────────────────────────
   *
   * ⚠️ **`docs/decisions/0111-a-boss-has-one-idea.md`.** A phase is DERIVED from health — `phaseFor`
   * — which is exactly right for deciding what the boss does and leaves no moment at which it
   * *changed*. Asked for in play: *"they need to have chunks and pieces fly off when they change
   * states"*, and that is an event, so something has to remember.
   *
   * ⚠️ **ACROSS STEPS AND NOT WITHIN ONE, WHICH THE FIRST DRAFT GOT WRONG AND A GUARD CAUGHT.** It
   * read the phase either side of `stepBoss` — and health does not change there: collisions are
   * resolved later in the step, so the two reads were identical by construction and the burst could
   * never fire. `tests/level.test.ts` drives a damaged boss through the real frame rather than
   * asking `phaseFor`, which is the only reason it was noticed.
   *
   * ⚠️ **An INDEX rather than the row**, so that a world is plain data — `docs/decisions/0017-the-state-is-slices.md`
   * bans a `Map` or a `Symbol` where a save serialises or a seeded test compares, and a stored object
   * reference is the same class of thing one step further on.
   */
  bossPhaseAt: number;
  /**
   * How many uncoils the boss has thrown, counted off its health. `0` while there is no boss.
   *
   * ⚠️ **`docs/decisions/0151-the-gap-you-have-to-reach.md`, and it is `bossPhaseAt`'s twin for the
   * same reason.** *"Fire off at every 10% damage reduction below 50%"* is derived from health by
   * `uncoilsBy` and so has no moment at which it *happened*; the difference between two consecutive
   * answers is the event, and this is what makes that difference exist.
   *
   * ⚠️ **A COUNT and not a health**, so it is monotone and cannot be argued with by a boss whose
   * health moves for any other reason. A count that has been reached stays reached, including one the
   * bared window swallowed.
   */
  bossUncoilAt: number;
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
  /*
    ⚠️ **`across` IS WHERE IT HAPPENED AND IT IS OPTIONAL** — 0127. Every call below already has the
    coordinate to hand — the ship's, the body's, the boss's — and the conversion to a pan lives in
    `src/app/sound.ts`'s `panFor`, so the lane's width is named once rather than seventeen times.
    Omitting it is the honest answer for an event with no place, never a shortcut.

    ⚠️ **It changes nothing about 0024's ban.** The step is handed a function and still cannot see
    what it does; passing a coordinate OUT is the same direction `musicLevelFor` already reads in.
  */
  onCue: (kind: CueKind, across?: number) => void;
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
    // After the ship has flown this step, so a blade circles where the ship now is — 0234.
    steerBlades(w);
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
    // A link rides the camera and retires on its own lifetime; the cull is a formality it never reaches.
    stepEntities(w.bolts, w.cameraAlong);
    stepEntities(w.enemyShots, w.cameraAlong);
    // Before the pool steps, because `stepEntities` derives `sprite` from `spriteBase` — a page
    // turned after it would be drawn one step late.
    turnFlares(w);
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
    w.hits.count = 0;
    /*
      ⚠️ **THE PULSE'S PAIRING LOGS ITS HITS ONLY WHEN THE GUN IS THE BLADE** — 0234. A pulse's
      arrival is told by the flash on the body and is counted below from the pool shrinking; a blade
      is not spent by arriving, so neither tells anyone it landed. The log gives the landing a spark
      (0227) and a place for the `hit` cue — and it is `null` for the pulse so the pulse's picture
      does not gain sparks it never had.
    */
    const bladeHits = w.weapon.flight === 'coil' ? w.hits : null;
    killedByShots += collideInto(w.playerShots, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths, bladeHits);
    killedByShots += collideInto(w.missiles, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths, w.hits);
    // The boss is its own pairing rather than another enemy, and the reason is the pool: it is the
    // only body in the game that must survive a hundred and fifty hits, so it cannot share a pool
    // with things that are released after one.
    /*
      ⚠️ **AND THE BOSS'S OWN SCALE IS THE WINDOW** — 0150. `phaseFor` is the whole of it: a boss in
      its `bare` phase has stopped shooting and opened, and `openBy` turns that into the multiplier
      `collideInto` has always taken. Everywhere else, and for every boss that authors no such phase,
      it is exactly the `1` that used to be written here.

      ⚠️ **Asked rather than remembered**, though `driveBoss` has already resolved the same phase
      earlier in the same step. A field on the world would be a second answer to *what is the boss
      standing in* and would be stale on the one step that matters most — the step it dies, when the
      pool is empty and the field still says `bare`.

      ⚠️ **The same number reaches the blast**, so a bomb spent in the window is worth what a pulse is
      worth in it. A window that opened for the guns and not for the arsenal would be a second answer
      to *how open is it*, and 0053 says the bomb is the first thing the player spends.
    */
    const open = w.bossPool.size > 0 ? openBy(phaseFor(w.bossRow, w.bossPool.at(0).health, w.bossFullHealth)) : 1;
    killedByShots += collideInto(w.playerShots, w.bossPool, 1, open, IMPACT_FLASH_STEPS, w.deaths, bladeHits);
    // What the blades landed this step, before the missiles add theirs — the `hit` cue reads it.
    const bites = bladeHits === null ? 0 : w.hits.count;
    killedByShots += collideInto(w.missiles, w.bossPool, 1, open, IMPACT_FLASH_STEPS, w.deaths, w.hits);
    // An area rather than an arrival: everything inside it, once, and nothing consumes it.
    blastInto(w.blasts, w.enemies, 1, IMPACT_FLASH_STEPS, w.deaths);
    blastInto(w.blasts, w.bossPool, open, IMPACT_FLASH_STEPS, w.deaths);
    /*
      The impact flash's twin. An arrival that did not kill is a body that went white and stayed.

      ⚠️ **THE ONE CUE WITH NO PLACE, AND IT IS A PROPERTY OF THIS LINE** — 0127. Every other cue is
      emitted beside the thing that caused it and hands over its `across`; a hit is inferred from a
      COUNT — bullets in flight before, minus bullets in flight after, minus the ones that killed —
      so there is no body here to ask. Recording an impact position would mean `collideInto` logging
      arrivals as well as deaths, which is a pool the whole game would pay for so that one cue could
      be placed. Centred, deliberately, and `tests/sound.test.ts` names it.
    */
    // Or a blade bit something, which the pool arithmetic cannot see because a blade is not spent — 0234.
    if (w.playerShots.size + w.missiles.size < inFlight - killedByShots || bites > 0) w.onCue('hit');
    /*
      The debris burst's twin, and it is skipped on the one step the boss dies.

      ⚠️ **Not because two cues would be wrong, but because the CAP would then decide which one the
      player hears.** `src/app/sound.ts` allows four voices a step and drops the rest, and the boss's
      cue is emitted at the bottom of this step — behind the pulse, the threat and the hit. So the
      loudest event in the game is the one the ceiling would eat. `tests/sound.test.ts` drives a real
      boss death and asserts it actually sounds.
    */
    /*
      ⚠️ **The FIRST death of the step, where several is one cue** — 0127. `hold` already makes
      simultaneous kills one sounding, so the choice is which of them it is placed at; the first is
      the one the collision resolved first, and a mean would put two deaths at opposite edges of the
      lane in the middle, where neither of them was.
    */
    if (w.deaths.count > 0 && !bossJustDied(w)) w.onCue('kill', w.deaths.across[0]);
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
      strikeShip(w);
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
      if (w.ship.health < healthBefore && w.ship.health > 0) w.onCue('shield', w.ship.across);
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
      // At the SHIP, because that is where a pickup is taken — 0127. `Collected` logs the kind and
      // not a position, and the position that matters is the one the player is at anyway.
      w.onCue('pickup', w.ship.across);
      // And the FACE it was showing — 0233. Which gun a weapon pickup was offering is decided on
      // the step it is taken, and `collectInto` logged it beside the kind for exactly this line.
      // And how many rungs it was worth — 0243: a scattered piece carries every rung of its kind.
      w.onPickup(kind, w.collected.face[i]!, w.collected.stack[i]!);
    }

    // Every enemy that died this step leaves something behind. The positions were recorded by the
    // collision because a released slot is the next thing `spawn` hands out.
    for (let i = 0; i < w.deaths.count; i++) {
      burst(w, w.deaths.along[i]!, w.deaths.across[i]!, BURST.enemy);
      flare(w, w.deaths.along[i]!, w.deaths.across[i]!, 'burst');
    }
    // And every missile that landed this step, killing or not, sparks where it hit — 0227.
    for (let i = 0; i < w.hits.count; i++) flare(w, w.hits.along[i]!, w.hits.across[i]!, 'spark');

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
    // After the wreck check, so the flame goes out on the step the hull does and not one later —
    // 0230. It reads the pool rather than `flying`, which was true at the top of this step.
    stepExhaust(w);

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

    /*
      ⚠️ **TWO FIGHTS A LEVEL — 0247.** The mid-boss arrives at its own distance and must be killed
      like the end boss; until it is, the end boss does not arrive, however far the camera has got.
      The waves keep coming around either.
    */
    if (!w.bossSpawned && horizon >= fightAt(w)) {
      w.bossSpawned = true;
      spawnBoss(w);
    }
    // Reported once. The boss is the only thing that can empty this pool, so an empty pool after it
    // was filled is the fight ending — and `bossBeaten` is what stops that being said every step
    // from then until the next fight is set up or the screen changes.
    if (bossJustDied(w)) {
      w.bossBeaten = true;
      // The one cue sized to fill a beat rather than to punctuate one: `BOSS_DEATH_STEPS` is 1.6
      // seconds of the level carrying on while the boss comes apart, and `src/content/cues.ts` sizes
      // `bossDown` against it.
      // Where the boss was: it is already out of its pool by now, and its death is the entry the
      // collision logged this step — 0127.
      w.onCue('bossDown', w.deaths.across[0]);
      /*
        ⚠️ **THE LEVEL DOES NOT END HERE ANY MORE.** Reported from play: *"bosses need a real
        explosion and an end-of-level beat — currently the level just ends."* It did: the same step
        that emptied the pool raised a screen over the frame, so the loudest event in the game was a
        boss vanishing behind an overlay. `docs/decisions/0062-a-boss-dies-loudly.md`.

        ⚠️ **AND A MID-BOSS'S DEATH DOES NOT END IT AT ALL — 0247.** The beat is the same beat; what
        it is not is the level's end. The end boss's fight is set up on the step the mid-boss dies,
        with the mid-boss's flame, phase and curtain state cleared, so nothing of one fight leaks
        into the next.
      */
      if (w.fight === 0) {
        w.bossBurstIn = BOSS_DEATH_STEPS;
        w.bossBurstRadius = w.bossRow.radius;
        nextFight(w);
      } else {
        w.clearedIn = BOSS_DEATH_STEPS;
      }
    }
    stepBossDeath(w);
    stepShipDeath(w);
  }

  draw(alpha: number): void {
    const w = this.world;
    // The camera is interpolated on the same alpha as everything it gets subtracted from. Passing
    // the stepped value here is what made a ship holding station exactly still judder on screen.
    const camera = w.prevCameraAlong + (w.cameraAlong - w.prevCameraAlong) * alpha;
    paintScene(w.surface, w.view, w.layers, camera, alpha, w.sky, w.bound, w.landmarks, w.levelOrigin);
    // After everything, so a bolt is over what it struck — 0233. The landing sparks are entities in
    // `layers` and were blitted above; this strokes the lines between them.
    paintBolts(w.surface, w.view, w.bolts, camera, alpha);
    // And a badge on every scattered piece worth more than one rung — 0243. Over the pickup it
    // rides, and after the bolts so nothing crosses it.
    paintStacks(w.surface, w.view, w.pickups, STACK_BADGES, camera, alpha);
  }
}

/**
 * The badge a scattered piece wears for its stack, by stack: ×2, ×3, ×4 — 0243. A stack past the
 * last wears the last; `UPGRADE_TIERS` is four, so nothing does.
 */
// @setup: three sprite indices, for the module's lifetime.
const STACK_BADGES: readonly number[] = [SPRITE.stackTwo, SPRITE.stackThree, SPRITE.stackFour];

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
 * The serpent's lightning landing on the ship — `docs/decisions/0248-the-serpent-strikes.md`.
 *
 * A strike is a bolt in the arc's pool with `RAIN_BOLT_KIND`, and it lands on the one step its
 * warning has just run out — `lifeFor` is the strike's own steps from then on, so the step it
 * equals `BOLT_STEPS` is the step the line becomes lightning. A ship within the bolt's half-width
 * (its `radius`) along the lane is hurt as any shot hurts it, through `wound`, on the tier's own
 * damage scale; a ship already lit is not hurt twice, exactly as `collideIntoOne` refuses.
 *
 * ⚠️ **Nothing before that step hurts**, which is the whole of what the warning line is for.
 */
function strikeShip(w: World): void {
  if (w.ship.invulnFor > 0) return;
  for (let i = 0; i < w.bolts.size; i++) {
    const b = w.bolts.at(i);
    if (b.kind !== RAIN_BOLT_KIND || b.lifeFor !== BOLT_STEPS) continue;
    if (Math.abs(w.ship.along - b.along) > b.radius + w.ship.radius * w.tuning.hurtbox) continue;
    wound(w.ship, b.damage * w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS);
    return;
  }
}

/** The level-local distance at which the current fight's boss arrives — 0247. */
function fightAt(w: World): number {
  return w.fight === 0 && w.level.midBoss !== null ? w.level.midBoss.at : w.level.bossAt;
}

/**
 * The end boss's fight, set up on the step the mid-boss dies — 0247. The boss state is the current
 * fight's, so all of it starts again; the beat the mid-boss is coming apart on is `bossBurstIn`
 * and is left alone.
 */
function nextFight(w: World): void {
  w.fight = 1;
  w.bossRow = BOSSES[w.level.boss];
  w.bossSpawned = false;
  w.bossBeaten = false;
  w.bossPatrol = 1;
  w.bossPhaseAt = -1;
  w.bossUncoilAt = 0;
}

/**
 * Whether the boss on the field is the one the music turns for — 0247. A mid-boss is fought under
 * the section the level is in; the end boss's fight is the piece 0114 wrote for it. `src/app/mount.ts`
 * passes this to `musicLevelFor`, and `tests/bosses.test.ts` holds it across both fights.
 */
export function bossOnField(w: World): boolean {
  return w.bossPool.size > 0 && w.fight === 1;
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
 * ⚠️ **`cadence` is trusted to be a positive integer**, because `tests/pickups.test.ts` holds every
 * rung of both ladders to being one — 0093's guard originally, kept and widened by
 * `docs/decisions/0159-the-two-clocks-come-apart.md` when the divisor rule that made it free went
 * away. A guard there is worth more than a branch here: this runs in the frame loop, and
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` is why it has no defensive arm.
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
/**
 * Which cue a flight makes when it fires.
 *
 * ⚠️ **A switch with a `never` arm, and exported so a test can ask it** — 0016's fifth defeat used
 * as the guard. The cue is not on the weapon row because `tests/sound.test.ts` holds that every cue
 * is played by the frame, by name, and a name read out of a content table is a cue nothing in this
 * file can be seen to play.
 */
export function cueOfFlight(flight: FlightKind): CueKind {
  switch (flight) {
    case 'straight':
      return 'pulse';
    case 'chain':
      return 'arc';
    case 'coil':
      return 'throw';
    default: {
      const unhandled: never = flight;
      return unhandled;
    }
  }
}

function fireShip(w: World): void {
  w.fireIn--;
  if (w.fireIn > 0) return;
  /*
    ⚠️ **THE FLIGHT DECIDES, AND A NAME NEVER DOES** — 0233, on 0016's terms. A weapon kind is a row;
    what the frame switches on is the closed union of ways a shot can travel, so a third gun that
    flies like the pulse is a row and nothing here.
  */
  switch (w.weapon.flight) {
    case 'straight':
      firePulse(w);
      return;
    case 'chain':
      fireArc(w);
      return;
    case 'coil':
      throwBlades(w);
      return;
    default: {
      const unhandled: never = w.weapon.flight;
      return unhandled;
    }
  }
}

/**
 * The `kind` a blade carries in `playerShots`, so `steerBlades` can tell it from a pulse that was in
 * the air when the player switched guns. Every other player shot carries zero.
 */
const BLADE_KIND = 1;

/**
 * Which side of the nose each blade of a pair leaves from, and therefore which strand of the helix
 * it is — `docs/decisions/0244-a-blade-rides-a-helix.md`. Two, always: one from each wingtip.
 */
// @setup: the pair's two sides, for the module's lifetime.
const BLADE_SIDES = [-1, 1] as const;

/** Steps a blade shows each of its two turns for. A quarter-turn every eight steps reads as a spin. */
const BLADE_TURN_STEPS = 4;

/**
 * A pair of shurikens thrown — `docs/decisions/0234-a-blade-circles-the-ship.md`, as
 * `docs/decisions/0244-a-blade-rides-a-helix.md` left it.
 *
 * ⚠️ **INTO THE PULSE'S POOL, because a ship carries one gun** — the same argument that took the
 * bolts' slots out of it (0233). What tells a blade from a pulse afterwards is `BLADE_KIND`, and
 * what tells the pool a blade is not spent by arriving is its health (`src/sim/collide.ts`).
 *
 * ⚠️ **FROM THE WINGTIPS, UP THE LANE, AND CROSSING AHEAD OF THE NOSE — A HELIX.** The sixth
 * play-test named the shape: *"the two wingtips firing to form a helix pattern."* Each blade goes
 * straight up the lane at the row's speed and swings across it in a sine at the weapon row's `coil`
 * half-width and `turn`; the pair leaves from the wingtips heading out, a half-turn out of phase,
 * so the two strands cross at the band's centre line twice a turn — where a boss sits. The strand's axis and its speed are copied onto the blade (`fromAlong`/`fromAcross`,
 * `orbitGrow`), so a blade thrown is a blade thrown: switching guns with blades in the air leaves
 * them riding. The spawn stream is not consulted, on `spawnWave`'s argument: what a gun does is
 * authored, not dealt. (0242 had each blade circle a point moving up the lane — a chain of loops —
 * and the play-test said it had not asked for that.)
 */
function throwBlades(w: World): void {
  const row = SHOTS[WEAPONS[w.weapon.kind].shot];
  // On the grid, like every gun — 0094.
  w.fireIn = stepsToGrid(w.steps, w.weapon.fireEvery);
  w.onCue('throw', w.ship.across);
  /*
    ⚠️ **FROM THE WINGTIP ITSELF, HEADING OUT** — 0244's second photograph: *"there's a big gap
    between helix start and wingtips."* The first draft threw each blade at its crest, `coil` off
    the axis, which at the cap is eighteen units from a wingtip four out. The wingtip is half the
    drawn width of the hull the ship is wearing — whichever rung's hull — and the strand's phase at
    the throw is the one at which a sine of `coil` passes that width on its way out, so the blade
    leaves the wing and swings wider before it comes back across the nose.
  */
  const wingtip = SPRITE_EXTENT[SPRITE_KINDS[w.ship.spriteBase]!] / 2;
  const lift = Math.asin(Math.min(1, wingtip / w.weapon.coil));
  for (let s = 0; s < BLADE_SIDES.length; s++) {
    const side = BLADE_SIDES[s]!;
    const blade = w.playerShots.spawn();
    if (blade === null) return;
    // The two strands are a half-turn apart: the other side is the same phase, half a turn on.
    // Which way the phase runs makes no difference to a sine, so both run one way.
    const angle = side > 0 ? lift : Math.PI + lift;
    reset(blade, w.ship.along, w.ship.across + Math.sin(angle) * w.weapon.coil, row, BLADE_KIND);
    blade.velAlong = w.scrollPerStep + row.speed;
    blade.damage = w.weapon.damage;
    // No clock — 0237. The edge of the screen ends a blade (`steerBlades`); zero is *never*.
    blade.lifeFor = 0;
    // The strand's axis: the nose now, and up the lane at the row's speed from here on.
    blade.fromAlong = w.ship.along;
    blade.fromAcross = w.ship.across;
    blade.orbitGrow = row.speed;
    blade.orbitRadius = w.weapon.coil;
    blade.orbitAngle = angle;
    blade.orbitTurn = w.weapon.turn;
  }
}

/**
 * Every blade in the air, moved to its next place on its strand.
 *
 * ⚠️ **The VELOCITY is set and `stepEntities` integrates it**, rather than the position being
 * written here, so `prev` is what the painter interpolates from and the swept collision sees the
 * whole of a fast swing — a blade crossing the axis at the cap covers three units a step across
 * the lane, which is most of its own hurtbox, and `overlaps` sweeps the step for exactly that.
 *
 * ⚠️ **Along its own strand's axis, which goes up the lane in the camera's frame** — 0244. The
 * along is the axis's and only ever gains; the across is a sine about it. A blade is thrown and
 * gone, like a pulse; it does not follow the ship, and a ship that moves across the lane after a
 * throw leaves that pair's helix where it was. (0234 to 0240 circled the ship; 0242 looped.)
 *
 * ⚠️ **And it spins by swapping its two turns** — the row's `sprite` and `spriteHit` are the star
 * and the star an eighth of a turn round (`src/content/shots.ts`), and a blade never flashes, so
 * the swap is what the next `stepEntities` draws.
 */
function steerBlades(w: World): void {
  for (let i = w.playerShots.size - 1; i >= 0; i--) {
    const b = w.playerShots.at(i);
    if (b.kind !== BLADE_KIND) continue;
    b.orbitAngle += b.orbitTurn;
    b.fromAlong += w.scrollPerStep + b.orbitGrow;
    const along = b.fromAlong;
    const across = b.fromAcross + Math.sin(b.orbitAngle) * b.orbitRadius;
    /*
      ⚠️ **GONE THE STEP IT LEAVES THE SCREEN, AND NOT BEFORE — 0237.** A loop that touched an edge
      would leave by it and come back in, and a blade that is off the screen is off the game. The
      margin is its own drawn half-size, so it is gone when the last of it is, not while half of it
      still shows. The along edges are the view's own (`w.view.alongSpan`), which is the one
      quantity here that varies by device — 0023 — and it is the screen the ask names. Since 0242
      the edge a coil meets is the leading one, which is its reach.
    */
    if (
      across < -b.radius ||
      across > ACROSS_SPAN + b.radius ||
      along < w.cameraAlong - b.radius ||
      along > w.cameraAlong + w.view.alongSpan + b.radius
    ) {
      w.playerShots.releaseAt(i);
      continue;
    }
    b.velAlong = along - b.along;
    b.velAcross = across - b.across;
    if (w.steps % BLADE_TURN_STEPS === 0) {
      const turned = b.spriteBase;
      b.spriteBase = b.spriteHit;
      b.spriteHit = turned;
    }
  }
}

/**
 * Chain lightning — `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`.
 *
 * Asked for: *"a chain lightning gun, that jumps to more targets and gets more powerful with each
 * upgrade… for single target bosses it needs to arc and bounce and jump around to hit different
 * parts of the boss."*
 *
 * ── RESOLVED ON THE STEP IT FIRES, AND THE PICTURE IS WHAT OUTLIVES IT ─────────────────────────
 *
 * ⚠️ **Hitscan, not a body.** There is nothing to sweep: from the nose, the nearest body in reach
 * is struck; from that body, the nearest body in reach that is not already lit; and so on for
 * `links`. Each strike is `collide.ts`'s own arrival — damage, death, flash — landed by hand, so a
 * bolt's hit and a pulse's hit are one description. What is spawned is the PICTURE: one entity per
 * link, at the landing point, carrying where it came from, alive for `BOLT_STEPS`.
 *
 * ⚠️ **THE BOSS IS THE EXCEPTION TO *not already lit*, AND THAT IS THE ASK.** A boss is one body
 * with one radius (`src/content/bosses.ts` has no parts), so *hit different parts of it* is a
 * picture: when the nearest thing in reach is the boss and the chain has links left, each further
 * link lands on a fresh point inside its disc, rolled on the arc's own stream. Each of those is a
 * strike, so the bolt is worth the same against one big thing as against several small ones —
 * which is the balance a gun that cannot miss has to keep.
 *
 * ⚠️ **NO TARGET IS STILL A VOLLEY.** A dry bolt goes straight ahead for part of its reach and hits
 * nothing, and the discharge cue sounds without the strike's — so a player who has just switched
 * guns sees the gun working before anything is in front of it, and a gun that fires itself does not
 * go silent when the lane is empty. The pulse does the same thing with bullets.
 *
 * ⚠️ **The pool refusing a link drops the picture and not the hit.** Damage was landed before the
 * spawn, on `firePulse`'s own terms about a volley the pool cuts short: the model is right and the
 * picture is one link shorter, which is the failure 0036 names and the reason the pool is sized so
 * it cannot happen at any tier — `tests/weapons.test.ts` fires the cap for fifteen seconds.
 */
function fireArc(w: World): void {
  const row = SHOTS[WEAPONS[w.weapon.kind].shot];
  // On the grid, like the pulse — 0094: the same phase at every tier and after every death.
  w.fireIn = stepsToGrid(w.steps, w.weapon.fireEvery);
  w.onCue('arc', w.ship.across);
  let fromAlong = w.ship.along + MUZZLE_ALONG;
  let fromAcross = w.ship.across;
  let struck = false;
  // Once a chain has reached the boss it stays on the boss: the rest of its links jump around the
  // hull rather than back out to something small behind it.
  let onBoss = false;
  for (let link = 0; link < w.weapon.links; link++) {
    let toAlong: number;
    let toAcross: number;
    const enemy = onBoss ? -1 : nearestFrom(w.enemies, fromAlong, fromAcross, w.weapon.reach, true);
    const boss = w.bossPool.size > 0 ? nearestFrom(w.bossPool, fromAlong, fromAcross, w.weapon.reach, false) : -1;
    if (enemy >= 0 && (boss < 0 || nearer(w.enemies.at(enemy), w.bossPool.at(0), fromAlong, fromAcross))) {
      const target = w.enemies.at(enemy);
      toAlong = target.along;
      toAcross = target.across;
      strike(w.enemies, enemy, w.weapon.damage, IMPACT_FLASH_STEPS, w.deaths);
    } else if (boss >= 0) {
      const target = w.bossPool.at(boss);
      /*
        A fresh point inside the boss for every link after the first, so the chain jumps around the
        hull rather than striking one point four times — and the first link lands on the hull's
        nearest edge, which is where a bolt from outside would arrive.
      */
      if (onBoss) {
        const angle = w.arcRng.range(0, Math.PI * 2);
        const depth = w.arcRng.range(0.25, 0.85) * target.radius;
        toAlong = target.along + Math.cos(angle) * depth;
        toAcross = target.across + Math.sin(angle) * depth;
      } else {
        const dAlong = target.along - fromAlong;
        const dAcross = target.across - fromAcross;
        const gap = Math.sqrt(dAlong * dAlong + dAcross * dAcross);
        const edge = gap > 0 ? (gap - target.radius * 0.6) / gap : 0;
        toAlong = fromAlong + dAlong * edge;
        toAcross = fromAcross + dAcross * edge;
      }
      onBoss = true;
      // The boss's own window scales a bolt as it scales a bullet — 0150. Read here rather than
      // remembered, on the collision section's own argument.
      const open = openBy(phaseFor(w.bossRow, target.health, w.bossFullHealth));
      strike(w.bossPool, boss, w.weapon.damage * open, IMPACT_FLASH_STEPS, w.deaths);
    } else if (link === 0) {
      /*
        Dry: nothing in reach. The bolt goes ahead, lands on nothing, and THAT IS THE VOLLEY.

        ⚠️ **A dry link does not move the chain's origin** — 0236. It did: the next link searched
        from the dry bolt's end, half a reach further up the lane, so a gun with nothing in reach
        found a body a reach and a half away. The longer reach 0236 authored is what made it
        visible; `tests/weapons.test.ts` fires dry at a body just past reach and counts its health.
      */
      toAlong = fromAlong + w.weapon.reach * DRY_BOLT_SHARE;
      toAcross = fromAcross;
      spawnLink(w, row, fromAlong, fromAcross, toAlong, toAcross);
      break;
    } else {
      break;
    }
    if (!struck && (enemy >= 0 || boss >= 0)) {
      struck = true;
      w.onCue('zap', toAcross);
    }
    spawnLink(w, row, fromAlong, fromAcross, toAlong, toAcross);
    // A body the strike killed is gone from its pool; the next link still jumps from where it was.
    fromAlong = toAlong;
    fromAcross = toAcross;
  }
}

/** Whether `a`'s edge is nearer a point than `b`'s edge is. The tie goes to the enemy. */
function nearer(a: Entity, b: Entity, along: number, across: number): boolean {
  const aAlong = a.along - along;
  const aAcross = a.across - across;
  const bAlong = b.along - along;
  const bAcross = b.across - across;
  return Math.sqrt(aAlong * aAlong + aAcross * aAcross) - a.radius <= Math.sqrt(bAlong * bAlong + bAcross * bAcross) - b.radius;
}

/** How much of its reach a dry bolt shows. Less than all of it, so a miss does not look like a range. */
const DRY_BOLT_SHARE = 0.55;

/** One link's picture: an entity at the landing point, carrying its start, riding the camera. */
function spawnLink(w: World, row: Body, fromAlong: number, fromAcross: number, toAlong: number, toAcross: number): void {
  const link = w.bolts.spawn();
  if (link === null) return;
  reset(link, toAlong, toAcross, row);
  link.velAlong = w.scrollPerStep;
  link.fromAlong = fromAlong - toAlong;
  link.fromAcross = fromAcross - toAcross;
  link.lifeFor = BOLT_STEPS;
  // The jag's seed — `paintBolts` hashes it, so two links never flicker in step.
  link.spin = w.arcRng.int(0, 0x7fffffff);
}

/**
 * The pulse, and every other gun that fires a body in flight.
 *
 * ⚠️ **No input is read here and there is no action for it.** `src/content/actions.ts` says there is
 * no `fire` and there must never be one — the base weapon fires itself, and what the player spends
 * is the arsenal. This is that rule as four lines of code.
 */
function firePulse(w: World): void {
  /*
    ⚠️ **RELOADED TO THE GRID AND NOT TO THE CADENCE, WHICH IS THE HALF 0093 COULD NOT DO** — 0094.
    `w.fireIn = w.weapon.fireEvery` puts the next volley a correct interval after this one, so the gun
    keeps a perfect TEMPO at a phase that is whatever the last reset happened to leave. A metronome
    three steps behind the beat is a metronome in time and out of phase, and 50ms is exactly the
    offset the ear reads as *not quite on it*.

    ⚠️ **AND WHAT IT BUYS IS NO LONGER MUSICAL** — `docs/decisions/0160-the-music-free-runs.md`. It
    used to read *every rung divides `STEPS_PER_BEAT`, so a multiple of the cadence from the run's
    origin lands on a subdivision of the beat*. That constant is gone
    (`docs/decisions/0159-the-two-clocks-come-apart.md`) and the sentence with it.

    ⚠️ **THE MECHANISM IS KEPT ON ITS OWN MERITS, WHICH IS THE INTERESTING PART.** What an absolute
    reload actually gives is a gun whose phase does not move — the same rhythm at every tier, across
    every upgrade and after every death, rather than one that resets to wherever the player happened
    to die. That is a thing a player can learn, and it was true before anybody connected it to a
    beat. **A mechanism can outlive the reason it was built for**; what must not outlive it is the
    claim.
  */
  w.fireIn = stepsToGrid(w.steps, w.weapon.fireEvery);
  const row = SHOTS[WEAPONS[w.weapon.kind].shot];
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
    if (i === 0) w.onCue(cueOfFlight(w.weapon.flight), w.ship.across);
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
    w.onCue('blast', bomb.across);
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
  w.onCue('bomb', w.ship.across);
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
  const row = SHOTS[MISSILES[w.weapon.missile].shot];
  for (let i = 0; i < w.weapon.launchers; i++) {
    const missile = w.missiles.spawn();
    // A volley one tube short is dropped rather than grown — `src/sim/pool.ts` has the argument.
    if (missile === null) return;
    // One cue for the volley, on the same terms the pulse gets one: both tubes are one launch.
    if (i === 0) w.onCue('missile', w.ship.across);
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
    // How hard it hunts, copied onto the missile — zero for a straight one, and `steerMissiles`
    // reads it rather than the fitted tubes so a switch mid-flight changes nothing in the air. 0235.
    missile.seekTurn = w.weapon.seek;
    // And how long it burns — 0246. Zero is *never*, which is the straight missile: it lives to the
    // edge of the view. A seeker's fuse is what keeps a screen from filling with things that hunt.
    missile.lifeFor = w.weapon.fuse;
  }
}

/**
 * One homing missile turned toward the nearest body on the screen — 0235, as 0246 left it.
 *
 * ⚠️ **THE HEADING TURNS AND THE SPEED DOES NOT.** A missile's own motion is its velocity less the
 * scroll rate (0034: every speed is in the camera's frame); that vector is rotated toward the target
 * by at most `seekTurn` and put back at the length it had, so a seeker coming about is the same
 * missile pointed elsewhere and not a slower one. The pop it left the tube with is its first heading,
 * which is why a pair of seekers fan before they converge.
 *
 * ⚠️ **NEAREST EACH STEP, NOT LOCKED AT LAUNCH.** A pool swaps its last slot into a released one, so
 * an index kept across steps would follow the wrong body the moment anything died; the search is
 * bounded and allocation-free, and *nearest* changing under a missile is what a hunt looks like.
 * The boss counts, on the same edge-distance the arc uses.
 *
 * ⚠️ **ON THE SCREEN, AND THE SCREEN IS A BOX — 0246.** 0235 said *nothing beyond the view is a
 * target* and bounded the search by a REACH from the missile, which is a circle: a seeker near the
 * leading edge saw a body a whole view ahead of it, and a screen of seekers killed every wave
 * before it arrived. *"Limit them to screen space only."* The bound is the view the player has —
 * the camera to its leading edge along, the lane across — and a body outside it is not a target
 * however near it is. `THE SCREEN` in `tests/seekers.test.ts` holds it.
 */
function seek(w: World, m: Entity): void {
  const from = w.cameraAlong;
  const to = w.cameraAlong + w.view.alongSpan;
  const enemy = nearestInBox(w.enemies, m.along, m.across, from, to, 0, ACROSS_SPAN);
  const boss = w.bossPool.size > 0 ? nearestInBox(w.bossPool, m.along, m.across, from, to, 0, ACROSS_SPAN) : -1;
  let target: Entity;
  if (enemy >= 0 && (boss < 0 || nearer(w.enemies.at(enemy), w.bossPool.at(0), m.along, m.across))) target = w.enemies.at(enemy);
  else if (boss >= 0) target = w.bossPool.at(boss);
  else return;
  const ownAlong = m.velAlong - w.scrollPerStep;
  const ownAcross = m.velAcross;
  const speed = Math.sqrt(ownAlong * ownAlong + ownAcross * ownAcross);
  if (speed <= 0) return;
  const heading = Math.atan2(ownAcross, ownAlong);
  const wanted = Math.atan2(target.across - m.across, target.along - m.along);
  let delta = wanted - heading;
  if (delta > Math.PI) delta -= Math.PI * 2;
  else if (delta < -Math.PI) delta += Math.PI * 2;
  if (delta > m.seekTurn) delta = m.seekTurn;
  else if (delta < -m.seekTurn) delta = -m.seekTurn;
  const turned = heading + delta;
  m.velAlong = Math.cos(turned) * speed + w.scrollPerStep;
  m.velAcross = Math.sin(turned) * speed;
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
    /*
      ⚠️ **A SEEKER THAT BURNS OUT SAYS SO — 0036, 0246.** `stepEntities` retires a body whose fuse
      runs down on the step it reaches zero, silently; a missile that vanishes mid-air unexplained
      is exactly the event the picture must mention. The spark is placed where the missile will be
      on the step it goes, which is this step's velocity on, so the puff sits at the end of its
      track rather than a step behind it.
    */
    if (m.lifeFor === 1) flare(w, m.along + m.velAlong, m.across + m.velAcross, 'spark');
    // A seeker keeps its pop as its first heading and hunts from there — 0235. It never straightens.
    if (m.seekTurn > 0) {
      seek(w, m);
      continue;
    }
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
 * The ship's exhaust: lit while the ship flies, out when it does not, and shaped by the ask — 0230.
 *
 * ⚠️ **THE STATE IS THE INTENT AND THE LEAN IS THE VELOCITY, AND THAT SPLIT IS THE FEEL.** What the
 * engines are DOING is what the player asked for this step — a hard push forward burns even against
 * the front of the box, where the velocity is clamped to nothing. Which way the flame LEANS is where
 * the ship is actually going: it trails against the across velocity, so a climb leans the flame's
 * tip below the tail and a stop rights it, on the same lag `FLIGHT_RESPONSE` gives the hull. (0230
 * slid the flame across the tail instead, and 0241 answered the play-test that called it a bug.)
 *
 * ⚠️ **Carried by hand, exactly as the shell is**: nothing else steps this pool, and the renderer
 * interpolates from `prevAlong`. Nothing allocates — a row lookup, an integer divide and six writes.
 */
function stepExhaust(w: World): void {
  const flying = w.shipPool.size > 0;
  if (!flying) {
    // A wreck has no engines. The flame goes out on the step the hull does.
    if (w.exhaust.size > 0) w.exhaust.releaseAt(0);
    return;
  }
  let flame: Entity;
  if (w.exhaust.size > 0) {
    flame = w.exhaust.at(0);
  } else {
    const lit = w.exhaust.spawn();
    if (lit === null) return;
    reset(lit, w.ship.along, w.ship.across, EXHAUST);
    flame = lit;
  }
  const ask = w.intent.along;
  const row = ask > BURN_ASK ? THRUST.burn : ask < EASE_ASK ? THRUST.ease : THRUST.idle;
  /*
    ⚠️ **THE LEAN IS THE VELOCITY, AND IT PICKS A BITMAP RATHER THAN MOVING ONE — 0241.** 0230 slid
    the flame across the tail against the across velocity, and it played as *"they move up and down
    on the ship which is a bug."* A flame stays on its nozzle and angles; `blit` cannot rotate, so
    the angle is a baked frame. Climbing (across falling) the tip trails below the tail.
  */
  const across = w.ship.velAcross;
  const frames = across < -LEAN_AT ? row.frames.climb : across > LEAN_AT ? row.frames.dive : row.frames.level;
  const page = Math.floor(w.steps / PULSE_STEPS) % frames.length;
  const sprite = frames[page]!;
  flame.spriteBase = sprite;
  flame.spriteHit = sprite;
  flame.sprite = sprite;
  flame.prevAlong = flame.along;
  flame.prevAcross = flame.across;
  flame.along = w.ship.along - row.trail;
  flame.across = w.ship.across;
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
    const bullet = SHOTS[row.shot];
    // ⚠️ The tier scales the SPEED and not the direction. A harder tier is less time to move, never
    // a shot that leads the player — `src/content/shots.ts` keeps the dodge in the player's hands.
    const speed = bullet.speed * w.difficulty.shotSpeed;
    /*
      ── WHAT COMES OUT, AND UNTIL 0110 THERE WAS ONE ANSWER ──────────────────────────────────────

      ⚠️ **`docs/decisions/0110-an-attack-is-a-pattern.md`.** Every branch below used to be the first
      one: `atan2(ship − enemy)`, for every body in the game that fired. Reported from play as *"more
      attacks that are pattern attacks and less target player attacks"*, and it was an accurate
      reading of this function.

      ⚠️ **A `switch` with a `never` arm**, per `docs/decisions/0016-a-hub-enumerates-kinds.md`, so a
      sixth attack cannot be added to the union and forgotten here.

      ⚠️ **Nothing allocates.** Angles are numbers, `Math.cos` returns a number, and every branch
      writes into a pooled entity — which is what `tests/budget.test.ts` scans this file for.
    */
    const attack = row.attack;
    switch (attack.kind) {
      case 'aimed': {
        const dAlong = ship.along - e.along;
        const dAcross = ship.across - e.across;
        const distance = Math.sqrt(dAlong * dAlong + dAcross * dAcross);
        // Zero distance means the enemy is inside the ship, which contact damage has handled.
        if (distance <= 0) continue;
        const shot = w.enemyShots.spawn();
        if (shot === null) continue;
        /*
          ⚠️ **Once per enemy that actually fired, and the HOLD is what stops that being a wall of
          noise** — `src/content/cues.ts` gives `threat` four steps, so a screen of turrets going off
          together is one sound rather than nine. Gating it here instead would be a second rate
          limiter in a second place, disagreeing with the first the day either moves.

          It is below the off-screen check above, so a threat the player cannot see is one they
          cannot hear either — the same rule, in the channel 0036 was not written about.

          ⚠️ **Once per VOLLEY and not per shot, which is what a pattern makes visible.** A spray of
          three and an aimed one are one event each; the alternative would make a wall six times as
          loud as a lancer for firing once. The `hold` was already doing this job by accident and now
          it is the rule.
        */
        w.onCue('threat', e.across);
        reset(shot, e.along, e.across, bullet);
        shot.velAlong = (dAlong / distance) * speed + w.scrollPerStep;
        shot.velAcross = (dAcross / distance) * speed;
        break;
      }
      case 'spray': {
        /*
          A fan centred on `π` — straight back down the lane, towards the side the player is on —
          rather than on the ship. `spread` is the TOTAL angle and the step between neighbours is
          `spread / (shots - 1)`, which is the same arithmetic `src/app/boss.ts` uses and is written
          the same way on purpose.
        */
        w.onCue('threat', e.across);
        const step = attack.shots > 1 ? attack.spread / (attack.shots - 1) : 0;
        const first = Math.PI - (step * (attack.shots - 1)) / 2;
        for (let s = 0; s < attack.shots; s++) {
          const shot = w.enemyShots.spawn();
          // A volley that will not fit is dropped rather than grown, exactly as `src/sim/pool.ts` says.
          if (shot === null) break;
          const angle = first + step * s;
          reset(shot, e.along, e.across, bullet);
          shot.velAlong = Math.cos(angle) * speed + w.scrollPerStep;
          shot.velAcross = Math.sin(angle) * speed;
        }
        break;
      }
      case 'wall': {
        /*
          A row of shots straight down the lane at `gap` intervals either side, and **nothing in the
          middle** — so the safe place is directly in front of the body that fired, which the player
          can see before the shots exist.

          ⚠️ **A shot placed outside the lane is skipped rather than clamped.** Clamping would stack
          two bullets on the lane edge into one thicker one, which is a wall with a lie in it; a
          skipped slot is a wall that is simply narrower near the edges, and the body's own roam is
          bounded so this is rare.
        */
        w.onCue('threat', e.across);
        for (let s = 1; s <= attack.shots; s++) {
          for (let side = -1; side <= 1; side += 2) {
            const across = e.across + side * s * attack.gap;
            if (across < 0 || across > ACROSS_SPAN) continue;
            const shot = w.enemyShots.spawn();
            if (shot === null) break;
            reset(shot, e.along, across, bullet);
            shot.velAlong = -speed + w.scrollPerStep;
            shot.velAcross = 0;
          }
        }
        break;
      }
      case 'spiral': {
        /*
          `shots` evenly round the circle, with the whole set turned by however far this body has got.

          ⚠️ **The phase advances BEFORE the shots are placed**, so the first volley of a body's life
          is already off its spawn angle — otherwise every spinner in a wave would open with an
          identical ring however their phases were seeded, and 0098's *"they all fire at exactly the
          same time"* would be true of the picture on the one volley the player watches most.
        */
        w.onCue('threat', e.across);
        e.firePhase += attack.turn;
        const step = TAU / attack.shots;
        for (let s = 0; s < attack.shots; s++) {
          const shot = w.enemyShots.spawn();
          if (shot === null) break;
          const angle = e.firePhase + step * s;
          reset(shot, e.along, e.across, bullet);
          shot.velAlong = Math.cos(angle) * speed + w.scrollPerStep;
          shot.velAcross = Math.sin(angle) * speed;
        }
        break;
      }
      default: {
        // `docs/decisions/0016-a-hub-enumerates-kinds.md`: the arm that makes the union closed.
        const never: never = attack;
        return never;
      }
    }
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
/**
 * Light one flare at a point: a fireball for a death, a spark for a missile landing — 0227.
 *
 * ⚠️ **One entity, holding station in the world where the thing was.** The shards it sits under fly
 * outward; the flare is the point they flew from, and it goes out on its own clock. Dropped rather
 * than grown when the pool is full, on the same terms as a burst.
 */
function flare(w: World, along: number, across: number, kind: DebrisKind): void {
  const piece = w.debris.spawn();
  if (piece === null) return;
  const row = DEBRIS_ROWS[kind];
  reset(piece, along, across, row.body, DEBRIS_KIND[kind]);
  piece.lifeFor = row.frames.length * row.hold;
}

/**
 * Turn every flare to the frame its remaining life says it is on.
 *
 * ⚠️ **Before `stepEntities`, which derives `sprite` from `spriteBase` every step** — a page turned
 * afterwards would be drawn a step late. The arithmetic runs the frames forward as `lifeFor` runs
 * down: the first frame while `lifeFor` is in its first `hold` steps, the last on the last.
 *
 * ⚠️ **THE WALK IS OFFSET BY ONE AT EACH END, AND `tests/flares.test.ts` IS WHAT SAID SO.** A flare
 * is lit AFTER the pools have stepped, so it is drawn on its first frame once before its clock has
 * run at all; and its last step of life is the one `stepEntities` releases it on, before it is drawn.
 * So the page turns two steps of life early — `lifeFor - 2` rather than `lifeFor - 1` — and every
 * frame is then on screen for exactly `hold` steps, the first and the last included.
 *
 * ⚠️ **Nothing allocates and nothing branches per kind.** A row lookup by the index the entity
 * carries, an integer divide, and two writes. A shard's `hold` is zero and it is skipped.
 */
function turnFlares(w: World): void {
  const count = w.debris.size;
  for (let i = 0; i < count; i++) {
    const e = w.debris.at(i);
    const row = DEBRIS_BY_KIND[e.kind];
    if (row === undefined || row.hold === 0 || e.lifeFor <= 0) continue;
    const last = row.frames.length - 1;
    const page = last - Math.floor((e.lifeFor - 2) / row.hold);
    const sprite = row.frames[page < 0 ? 0 : page > last ? last : page]!;
    e.spriteBase = sprite;
    e.spriteHit = sprite;
  }
}

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
/**
 * A boss's adds put on the field — `docs/decisions/0249-the-eagle-summons.md`: `count` of `enemy`
 * at the leading edge, in `formation` about the middle of the lane, exactly as a leading wave is
 * placed by `spawnWave` below and with the same parities — a summons is authored by the row that
 * calls it, and rolls nothing.
 */
function summonAdds(w: World, enemy: EnemyKind, count: number, formationKind: FormationKind): void {
  const kind = w.enemyKinds[enemy];
  const row = w.enemyRows[kind];
  if (row === undefined) return;
  const formation = FORMATIONS[formationKind];
  const along = spawnAlong(w.cameraAlong);
  const gap = gapAcross(row.radius);
  for (let i = 0; i < count; i++) {
    const e = w.enemies.spawn();
    if (e === null) return;
    reset(e, along + formation.alongOffset(i, count, gap), ACROSS_SPAN / 2 + formation.acrossOffset(i, count, gap), row, kind);
    e.fireIn = nextOnGrid(w.steps, fireGapFor(row.fireEvery, w.difficulty), i / count);
    e.velAcross = row.motion.kind === 'drift' ? (i % 2 === 0 ? row.motion.roam : -row.motion.roam) : 0;
    // The same two facts a wave's member is given, in the other order so 0073's probe over the
    // wave's line stays the one line it names.
    if (row.motion.kind === 'loop') e.turnsLeft = row.motion.turns;
    else if (row.motion.kind === 'circle') e.spin = i % 2 === 0 ? 1 : -1;
  }
}

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
  const along = flanking
    ? flankAlongFor(w.ship.along, w.cameraAlong, w.view.alongSpan) + w.cameraAlong
    : wave.at + w.levelOrigin;
  // Which side it comes in from, as a sign on `across`. −1 enters from the acrossMinus edge.
  const side = origin === 'acrossPlus' ? 1 : -1;
  const entryAcross = side < 0 ? -FLANK_MARGIN : ACROSS_SPAN + FLANK_MARGIN;
  for (let i = 0; i < wave.count; i++) {
    const e = w.enemies.spawn();
    // A wave one enemy short is dropped rather than grown — `src/sim/pool.ts` has the argument, and
    // it is the same one a burst that will not fit gets.
    if (e === null) return;
    /*
      ⚠️ **THE WAVE'S OWN BODY DECIDES ITS SPACING** — 0143. `row` is already in hand and a wave is a
      single kind, so this costs one multiply and allocates nothing: `gapAcross` returns a number and
      `docs/decisions/0022-frame-rate-is-a-feature.md` bans anything else on the spawn path.
    */
    const gap = gapAcross(row.radius);
    const target = wave.lane + formation.acrossOffset(i, wave.count, gap);
    /*
      ⚠️ **A flanker's formation offset is applied ALONG rather than across at the entry point.** The
      members leave the edge in a stream at their own target lanes; spreading them across the lane
      before they had entered it would put half the wave on screen already.

      ⚠️ **AND IT IS THE WHOLE OFFSET NOW, NOT THE ALONG HALF OF IT — 0197.** Reported from play:
      *"some enemies spawn all on top of each other so it looks like one enemy when it's actually 5."*
      A `line`'s `alongOffset` is `() => 0` and a flanker's `across` is the same edge for every
      member — so **every body in a flanking line spawned at one point**, and a flanking `vee` stacked
      them in pairs. **300 bodies across the game.** The paragraph above described a stream the data
      could not express: the offset that spreads a line is its ACROSS one, and at the entry point that
      is the axis the stream runs along.
    */
    const across = flanking ? entryAcross : target;
    /*
      ⚠️ **A FLANKER'S STREAM IS THE GAP TIMES THE INDEX, AND NOTHING TO DO WITH THE FORMATION.** The
      first fix summed the two offsets, which took the 300 stacked bodies down to 35 and left a real
      case standing: a `vee`'s along step is 14 and its across step is `2r + 1`, so at a warden's gap of
      9 the second member's total lands **5 units** from the third's against a diameter of 8. **A sum of
      two geometries is not a spacing rule.** `i × gapAcross` is `docs/decisions/0143-a-wave-is-spaced-by-the-body-it-is-made-of.md`'s
      own answer applied to the axis a flanker actually spreads on, and it cannot collide by
      construction: the gap is a diameter plus one.

      ⚠️ **THE FORMATION IS NOT DISCARDED** — it still decides each member's target LANE through
      `target`, which is what they steer to once they are in. What it stops deciding is the entry
      spacing, which it was never able to express.
    */
    const stream = flanking ? streamOffset(i, row.radius) : formation.alongOffset(i, wave.count, gap);
    reset(e, along + stream, across, row, kind);
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
      ⚠️ **WHERE A TURNING PATTERN STARTS POINTING, on exactly the terms above** — 0110. It is set
      from the member's index rather than rolled, for the reason this function has already given
      twice: a level is authored.

      ⚠️ **`GOLDEN_ANGLE` rather than an even division**, which is what `spawnPickup` already uses for
      the same job one function down. An even share would put a wave of three spinners on the same
      three angles as each other for ever — a wall of six lines rather than a field of rings — and
      the golden angle is the one step that never repeats however many members a wave has.
    */
    if (row.attack.kind === 'spiral') e.firePhase = i * GOLDEN_ANGLE;
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
    /*
      ── THE CYCLE — 0233 ─────────────────────────────────────────────────────────────────────────

      A pickup with more than one face turns to the next every `PICKUP_CYCLE_STEPS`, and the face it
      is showing is what the player gets. `faceIn` is zero on a pickup with one face, so this is a
      compare and nothing else for the shield and the bomb.

      ⚠️ **`spriteBase` and not `sprite`**, because `stepEntities` derives the drawn sprite from
      `spriteBase` on the step after this — the same rule `turnFlares` follows for a page turned.
      `spriteHit` follows it too, or a pickup would flash back to its first face, which no pickup
      does today and which would be a lie the day one did.
    */
    if (item.faceIn > 0 && --item.faceIn === 0) {
      const faces = w.pickupRows[item.kind]!.faces;
      item.face = item.face + 1 >= faces.length ? 0 : item.face + 1;
      item.spriteBase = faces[item.face]!;
      item.spriteHit = item.spriteBase;
      item.faceIn = PICKUP_CYCLE_STEPS;
    }
    if (item.across - item.radius <= 0) item.velAcross = Math.abs(item.velAcross);
    else if (item.across + item.radius >= ACROSS_SPAN) item.velAcross = -Math.abs(item.velAcross);
    /*
      ── AND THE SAME RULE ON THE OTHER AXIS, WHICH IT HAS NEVER HAD ────────────────────────────────

      ⚠️ **`docs/decisions/0100-a-level-places-its-pickups-too.md`.** Reported from play: *"on player
      death the powerups can go to a section on the left side of the screen, where they are visible
      but the player cannot get to them."*

      ⚠️ **The two lines above stop a pickup leaving the LANE and nothing stopped one leaving the
      BOX.** `scatterRing` throws each piece around a full circle from where the ship died, and the
      along half of that is spent over about eleven world units — so a ship that died anywhere in the
      back eleven units of its box throws pieces to a place the ship can never return to. The player's
      band runs from `PLAYER_ALONG_MARGIN` to `PLAYER_LEAD` in the camera's frame
      (`src/sim/flight.ts`), and the view runs from zero: **everything below the margin is on the
      screen and out of reach.** It is the same bug at the leading end, where a piece thrown forward
      from the front of the box lands past `PLAYER_LEAD`.

      ⚠️ **A BOUNCE and not a clamp, because that is what the across axis does** — and because a
      clamp would park a piece on the wall while the ease was still driving it outward, which reads as
      a pickup stuck on a line. Reversing the departure sends it back into the box under its own
      momentum and the ease settles it there.

      ⚠️ **`velAlong` carries the scroll rate as its baseline** (0034), so what is reversed is the
      DEPARTURE from it. Reversing the whole velocity would fire the pickup backwards through the
      world at the scroll rate as well, which is a piece leaving the screen rather than turning round.

      ⚠️ **Scattered pieces in FLIGHT only, and `turnsLeft` is what says so** (0236). An authored
      pickup whose wait has run out is MEANT to fall back through the view and leave —
      `docs/decisions/0064-a-pickup-waits-to-be-taken.md`, and `driftPickups` eases it to a target of
      zero for exactly that reason. Bouncing it here would make every pickup in the game immortal; a
      waiting pickup turns at the same walls by its heading, further down.
    */
    /*
      ⚠️ **THE THROW IS A FLIGHT OF ITS OWN, since 0236, and `turnsLeft` counts it.** Reported from
      the first play-test: *"on death, the power ups needs to scatter more to the 8 directions -> they
      just explode up and down now."* They were thrown in eight directions and the along half was
      eased away inside a second, so what the eye kept was the across half: a fan. A scattered piece
      now flies its throw out for `SCATTER_FLIGHT` steps, bouncing off the box's ends and the lane's
      walls, and only then joins the wait every other pickup has — and it keeps that wait, which is
      the other half of the report: *"they need to last as long as regular power ups."*
    */
    if (item.turnsLeft > 0) {
      item.turnsLeft--;
      const inView = item.along - w.cameraAlong;
      const departure = item.velAlong - w.scrollPerStep;
      if (inView <= PLAYER_ALONG_MARGIN) item.velAlong = w.scrollPerStep + Math.abs(departure);
      else if (inView >= PLAYER_LEAD) item.velAlong = w.scrollPerStep - Math.abs(departure);
      continue;
    }
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
        The wait is over, so it leaves: its target is zero — a body with no speed of its own falls
        back through the view, which is 0034's frame. A scattered piece used to land here on a
        timer of its own; since 0236 it carries the same wait as an authored one and leaves the same
        way.
      */
      item.velAlong += (0 - item.velAlong) * PICKUP_EASE;
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
    const inView = item.along - w.cameraAlong;
    if (inView > PICKUP_SLOW_AT) {
      item.velAlong += (0 - item.velAlong) * PICKUP_EASE;
      continue;
    }
    /*
      ── AND ONCE IT HAS ARRIVED IT WANDERS THE BOX, TURNING AT ITS ENDS — 0233 ──────────────────

      Asked for: *"they need to hang around and bounce off all the screen walls long enough that
      the player can see at least 2 repetitions of each weapon."* The across walls it already had;
      this is the along pair, and the walls are the player's box (`PLAYER_ALONG_MARGIN` to
      `PLAYER_LEAD`) rather than the screen's edge, for 0100's reason: past the box is on the screen
      and out of reach, and a pickup that bounced off the screen would spend a third of its wait
      where the ship cannot go.

      ⚠️ **`spin` IS THE HEADING, AND THE WALL FLIPS THE HEADING RATHER THAN THE VELOCITY.** The
      velocity is eased toward a target (0077), so flipping it directly would be fighting the ease —
      the pickup would be pulled straight back into the wall. Flipping which way the target points
      lets the ease carry it round, which is a turn rather than a bounce, and reads as a thing
      changing its mind rather than a thing hitting glass. Zero means *not yet arrived*, and the
      first arrival heads back down the view, which is the direction it was already going.

      ⚠️ **The bob stays on top**, so it never holds one line — 0087's rule, and the wander is a
      second reason it cannot park.
    */
    if (item.spin === 0) item.spin = -1;
    if (inView <= PLAYER_ALONG_MARGIN + PICKUP_TURN_ROOM) item.spin = 1;
    else if (inView >= PLAYER_LEAD - PICKUP_TURN_ROOM) item.spin = -1;
    const target =
      w.scrollPerStep +
      item.spin * PICKUP_WANDER +
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
  /*
    ── ONE PIECE PER KIND, CARRYING THE COUNT — 0243 ──────────────────────────────────────────────

    Reported from the fifth play-test: *"we also need to change the death pop of powerups to be a
    single missile power up bubble with an x2/3/4 etc if they had multiple powerups, and same for
    weapons, it's too hard to grab all the different powerups with all the different sequencing in
    the middle of a hail of bullets."* Every rung of each kind is counted, and one piece per kind
    present is thrown with that count on it (`stack`). The pool bound above is moot at two pieces,
    and kept in the type: a scatter can never be longer than the kinds there are.
  */
  let weapons = 0;
  let missiles = 0;
  for (let i = 0; i < upgrades.length; i++) {
    if (upgrades[i] === 'weapon') weapons++;
    else missiles++;
  }
  const pieces = (weapons > 0 ? 1 : 0) + (missiles > 0 ? 1 : 0);
  let index = 0;
  if (weapons > 0) throwPiece(w, 'weapon', weapons, index++, pieces);
  if (missiles > 0) throwPiece(w, 'missile', missiles, index, pieces);
}

/**
 * Throw one piece of `upgrade`, worth `stack` rungs, as the `index`th of `pieces` around the wreck.
 *
 * ⚠️ **`pieces` rather than the loadout's length, and it survived two decisions.** 0082's 50% coin
 * is gone and 0243 made the ring two pieces at most, but the reason for the divisor is unchanged:
 * it spaces the throw over what will really appear.
 */
function throwPiece(w: World, upgrade: UpgradeKind, stack: number, index: number, pieces: number): void {
  /*
    ⚠️ **WHERE THE SHIP DIED, not where the ship object still is** — 0079. This used to read
    `w.ship.along` and that was exactly right for as long as the scatter happened on the step the hull
    reached zero. It now happens at the END of the beat, `DEATH_STEPS` later, and the ship object has
    been sitting still in world coordinates the whole time — so the camera has moved about 27 units
    out from under it, and the pickups would arrive a beat's worth of scroll behind the wreck they
    came off. `stepBossDeath` remembers an offset for the identical reason and 0062 says so.
  */
  const along = w.cameraAlong + w.deathOffset;
  const kind = w.pickupKinds[upgrade];
  const row = w.pickupRows[kind];
  if (row === undefined) return;
  const item = w.pickups.spawn();
  // A scatter one pickup short is dropped rather than grown — `src/sim/pool.ts` has the argument.
  if (item === null) return;
  reset(item, along, w.deathAcross, row, kind);
  item.stack = stack;
  /*
    ⚠️ **A SCATTERED PIECE SHOWS THE FACE THE PLAYER JUST LOST, AND HOLDS IT** — 0233, finished by
    0243. What a death throws back is what it took (0066), and what it took was a gun of a
    particular kind; a piece that came up showing the other gun would be offering the player a
    switch they did not ask for at the one moment they are trying to recover. 0233 had it cycle
    from there like any other, and the fifth play-test named the cycling as the thing that made a
    death's pieces impossible to grab under fire — so a scattered piece does not turn.
  */
  startCycle(item, row, upgrade === 'weapon' ? WEAPON_KINDS.indexOf(w.weapon.kind) : MISSILE_KINDS.indexOf(w.weapon.missile));
  item.faceIn = 0;
  /*
    THE THROW — an angle per piece, evenly spaced round the wreck and then jittered.

    ⚠️ **A SIXTH OF A TURN ON, since 0243.** With one or two pieces, a ring that started along the
    lane put one piece straight ahead and the other straight behind, a dozen units from the box's
    back wall and nothing across; a ring started straight across put nothing along. A sixth of a
    turn on, the two leave ahead-and-across one way and behind-and-across the other — mostly
    across, which is the room there is, and enough along to be a throw — both axes, both sides,
    which is 0066's picture kept at two. The jitter is under half the gap between neighbours and
    capped besides, so the two can never swap sides.

    ⚠️ **`velAlong` is the scroll rate PLUS the along component**, which is 0034's *every speed is
    in the camera's frame*. The along half is spent against `PICKUP_EASE` in `driftPickups`, and
    what is left is a piece holding the distance the ship died at and bouncing across the lane.
  */
  const share = (Math.PI / pieces) * SCATTER_JITTER_SHARE;
  const halfGap = share < SCATTER_JITTER_MAX ? share : SCATTER_JITTER_MAX;
  const angle = Math.PI / 3 + (index / pieces) * Math.PI * 2 + w.scatterRng.range(-halfGap, halfGap);
  const speed = SCATTER_SPEED * w.scatterRng.range(SCATTER_SPREAD_MIN, SCATTER_SPREAD_MAX);
  item.velAcross = Math.sin(angle) * speed;
  item.velAlong = w.scrollPerStep + Math.cos(angle) * speed;
  // The throw is a flight, and then the wait every pickup has — 0236. `driftPickups` has both.
  item.turnsLeft = SCATTER_FLIGHT;
  item.holdFor = lingerFor(row);
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
  /*
    ⚠️ **`+ w.levelOrigin`, AND IT WAS MISSING FOR AS LONG AS THE ORIGIN HAS EXISTED** —
    `docs/decisions/0100-a-level-places-its-pickups-too.md`. Reported from play: *"I didn't get a
    single power up after level 1."*

    ⚠️ **`docs/decisions/0076-a-level-has-an-origin.md` added this term to `spawnWave` and to
    `spawnBoss` and not to this.** A level's script is authored from the level's own beginning, so an
    authored `at` is a LEVEL coordinate and every placement has to be translated. Level one's origin
    is zero, which is why it was invisible: on level two the origin is about 6,400, so all nine of its
    pickups were placed **fifteen hundred units behind the camera** and culled on the step they
    spawned. Not one frame on screen, for levels two through seven, since 0076.

    ⚠️ **The SCHEDULING side was always right, and that is what made it silent.** `stepSpawns` asks
    `pickups[next].at <= spawnAlong(camera) - levelOrigin`, which is in level coordinates and correct
    — so `nextPickup` advanced normally and the model believed it had offered nine pickups. **So did
    the dial**: `weaponsOffered` increments here, and
    `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md` reads it, so from level two onward the
    game raised its own difficulty on schedule for weapons the player was never shown. It is a
    difficulty defect as much as a pickup one.
  */
  reset(item, entry.at + w.levelOrigin, entry.lane, row, kind);
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
  item.holdFor = lingerFor(row) + Math.max(0, Math.round(approach));
  startCycle(item, row, index % row.faces.length);
}

/**
 * How long a pickup of `row` waits once it has arrived — 0233.
 *
 * ⚠️ **The longer of the two promises.** 0064's seven seconds is the floor every pickup has; a
 * cycling pickup also owes `PICKUP_REPEATS` full turns of its faces, so the player sees every gun
 * at least twice before it leaves — and a third gun lengthens the wait on its own, because the
 * promise is counted in repetitions.
 */
function lingerFor(row: PickupRow): number {
  const cycles = PICKUP_REPEATS * row.faces.length * PICKUP_CYCLE_STEPS;
  return cycles > PICKUP_LINGER_STEPS ? cycles : PICKUP_LINGER_STEPS;
}

/**
 * Put a pickup on `face` and, if it has more than one, start it turning.
 *
 * ⚠️ **An authored pickup starts on a face chosen by its INDEX, not on the first**, on the drift's
 * own argument: a level is authored, so two pickups near each other must visibly differ on every
 * run rather than on most of them — and two weapon pickups side by side showing the same gun at
 * the same moment would read as one offer twice.
 */
function startCycle(item: Entity, row: PickupRow, face: number): void {
  if (row.faces.length < 2) return;
  item.face = face;
  item.spriteBase = row.faces[face]!;
  item.spriteHit = item.spriteBase;
  item.sprite = item.spriteBase;
  item.faceIn = PICKUP_CYCLE_STEPS;
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
  /*
    ⚠️ **A MID-BOSS COMES APART ON ITS OWN COUNT — 0247** — the same pulses, the same fireballs, at
    the hull's own size, and no report at the end of it: the level goes on. `bossBurstRadius` is the
    dead hull's, because `bossRow` is already the next fight's by the time this runs.
  */
  if (w.bossBurstIn > 0) {
    w.bossBurstIn--;
    if (w.bossBurstIn % BOSS_PULSE === 0) {
      const spread = w.bossBurstRadius;
      burst(
        w,
        w.cameraAlong + w.bossOffset + w.burstRng.range(-spread, spread),
        w.bossAcross + w.burstRng.range(-spread, spread),
        BURST.boss,
      );
      flare(
        w,
        w.cameraAlong + w.bossOffset + w.burstRng.range(-spread, spread),
        w.bossAcross + w.burstRng.range(-spread, spread),
        'burst',
      );
    }
  }
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
    // And a fireball with each pulse, somewhere else on the hull — 0227. A boss goes up in a chain
    // of them over the beat rather than in one, which is what a hull that size coming apart is.
    flare(
      w,
      w.cameraAlong + w.bossOffset + w.burstRng.range(-spread, spread),
      w.bossAcross + w.burstRng.range(-spread, spread),
      'burst',
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
  flare(w, w.ship.along, w.ship.across, 'burst');
  // Beside the burst, which is the picture it is the twin of. The ship coming apart and the ship
  // being heard to come apart are one event and are written on one line apart.
  w.onCue('death', w.ship.across);
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
    // And a fireball with each pulse, off the same stream, so the wreck keeps going up — 0227.
    flare(
      w,
      w.cameraAlong + w.deathOffset + w.burstRng.range(-spread, spread),
      w.deathAcross + w.burstRng.range(-spread, spread),
      'burst',
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
  // is emitted after the `null` check, like every other cue in this file. Placed at the wreck, which
  // is where the ring is — 0127.
  w.onCue('blast', w.deathAcross);
}

/** The boss, if there is one on the field. Its whole behaviour lives in `src/app/boss.ts`. */
function driveBoss(w: World): void {
  if (w.bossPool.size === 0) return;
  const boss = w.bossPool.at(0);
  /*
    ── THE PHASE CHANGE, WHICH THE PICTURE HAS NEVER MENTIONED ───────────────────────────────────

    ⚠️ **`docs/decisions/0111-a-boss-has-one-idea.md`, and it is
    `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` unapplied on the
    most-watched event in a level.** From this step the boss fires wider, faster and flies
    differently; nothing on screen said so. Asked for in play: *"they need to have chunks and pieces
    fly off when they change states."*

    ⚠️ **Read BEFORE the step and compared after, which is the only place the transition exists.**
    A phase is derived from health — `phaseFor` — so there is no moment the model stores; the
    difference between two consecutive answers is the event. Comparing the objects is exact, because
    `phaseFor` returns a row out of the table rather than building one.

    ⚠️ **The health does not change inside `stepBoss`** — collisions are resolved later in the step —
    so this pair straddles the step where the phase can actually turn over, which is the one after
    the hit that crossed the threshold. That is a sixtieth of a second behind the flash and is what
    0036 asks for: the same event in both channels, inside the same tenth of a second.
  */
  // The phase's own shot where it names one — 0248: the serpent throws acid and then void.
  const throwing = phaseFor(w.bossRow, boss.health, w.bossFullHealth);
  w.bossPatrol = stepBoss(
    boss,
    w.bossRow,
    w.bossFullHealth,
    w.difficulty,
    w.ship,
    w.enemyShots,
    SHOTS[throwing.shot ?? w.bossRow.shot],
    w.cameraAlong,
    w.scrollPerStep,
    w.bossPatrol,
    w.onCue,
    w.bolts,
    w.rainRng,
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
  /*
    ⚠️ **THE ADDS A SUMMONS ASKED FOR — 0249.** `stepBoss` has no enemy pool; a `summon` volley
    leaves its count on the boss's `turnsLeft` and this is where the kites and the raptors are put
    on the field, at the leading edge in the phase's formation, on the same step as the call.
  */
  const calling = throwing.attack ?? w.bossRow.attack;
  if (calling.kind === 'summon' && boss.turnsLeft > 0) {
    summonAdds(w, calling.enemy, boss.turnsLeft, calling.formation);
    boss.turnsLeft = 0;
  }
  /*
    ⚠️ **The burst is thrown where the hull IS rather than at its centre of health**, so the pieces
    come off the thing the player is looking at. `burst` is the same scatter an enemy death uses; what
    makes this read as a different event is the count and the cue, not a second mechanism.

    ⚠️ **`bossPhase` and not `kill`, and the cue is the half that carries the meaning.** A phase change
    is the one event in a fight that is good news and bad news at once — the player did that, and it
    is about to get harder — and `src/content/cues.ts` says which of the two it sounds like.
  */
  const phase = w.bossRow.phases.indexOf(phaseFor(w.bossRow, boss.health, w.bossFullHealth));
  // What the boss is standing in NOW — 0150. Read once, because the transition below and the window
  // below that are two statements about the same row.
  const stance = w.bossRow.phases[phase]!.stance;
  if (phase !== w.bossPhaseAt) {
    /*
      ⚠️ **Only ever forwards, and the guard is the comparison rather than a rule about health.** A
      boss cannot heal, so a phase index that went down would be a bug somewhere else entirely — and
      the burst firing on it would be the picture reporting that bug, which is the right behaviour for
      an event twin.
    */
    if (w.bossPhaseAt >= 0) {
      burst(w, boss.along, boss.across, BURST.phase);
      w.onCue('bossPhase', boss.across);
    }
    w.bossPhaseAt = phase;
  }
  /*
    ── THE UNCOIL, AND IT IS ITS OWN CLOCK NOW ─────────────────────────────────────────────────────

    ⚠️ **`docs/decisions/0151-the-gap-you-have-to-reach.md`.** 0150 hung this on the phase transition,
    which threw it once a fight. Reported from play: *"it needed to happen more than once per boss…
    fire off at every 10% damage reduction below 50%."* That is a trigger at fixed fractions of a
    health bar, which no phase table can express without merging the four escalating fans underneath
    it into one long phase — so the boss owns it and `uncoilsBy` counts it.

    ⚠️ **Read and compared across steps, exactly as the phase above is**, and for the same reason: the
    boss's health does not change inside `stepBoss`, so the difference between two consecutive answers
    is the event and there is no moment the model has to store.

    ⚠️ **Never while it is BARE.** The window is the boss having thrown everything it has; a curtain
    out of an open hull would say the opposite in the one place the picture is trying hardest to say
    something. The last notch of a fight therefore lands inside the window and is skipped, which is
    why the two bosses that have one throw four curtains rather than five.

    ⚠️ **It sounds as `bossShot` and adds no cue of its own.** It IS the boss shooting, and
    `docs/decisions/0104-the-gun-plays-a-figure.md` allows four voices a step — a fourteenth `CueKind`
    for a fifth arm of one boss's attack would spend the ceiling on a distinction the player is
    already being shown twenty-odd bullets of.
  */
  const uncoil = w.bossRow.uncoil;
  if (uncoil !== null) {
    const notch = uncoilsBy(uncoil, boss.health, w.bossFullHealth);
    if (notch > w.bossUncoilAt && stance.kind !== 'bare') {
      const bullet = SHOTS[w.bossRow.shot];
      throwCurtain(
        boss,
        uncoil,

        w.enemyShots,
        bullet,
        bullet.speed * w.difficulty.shotSpeed,
        w.scrollPerStep,
      );
      // Its own count and not `phase`'s, because the two are different events and
      // `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` says
      // so: a phase change is the fight getting harder, and this is one attack arriving.
      burst(w, boss.along, boss.across, BURST.uncoil);
      w.onCue('bossShot', boss.across);
    }
    /*
      ⚠️ **Advanced even on the step it was skipped**, or a boss that reached its window with a notch
      owing would throw that curtain the moment anything else moved the count. A notch the window ate
      is a notch spent.
    */
    if (notch > w.bossUncoilAt) w.bossUncoilAt = notch;
  }
  /*
    ── AND THE WINDOW IS A STATE RATHER THAN AN EVENT, SO THE PICTURE HAS TO KEEP SAYING IT ────────

    ⚠️ **`docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` applied to a
    stretch of the fight instead of to a moment of it.** From the step above, the boss throws nothing
    and every pulse takes three times as much off it; the burst that announced the change is over in
    half a second and the window it announced is not. A hull shedding two fragments every fifth of a
    second is the one thing this file can say for as long as the state lasts, with no new drawing —
    `reports/where-the-art-ceiling-is-2026-08-14.md` owns that half and 0149 is where it got to.

    ⚠️ **On `w.steps` rather than on a countdown**, so the trickle is the same trickle whatever step
    the window opened on and there is no second piece of state to reset when a boss dies.
  */
  if (stance.kind === 'bare' && w.steps % BURST.barePulse === 0) burst(w, boss.along, boss.across, BURST.bare);
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
  // In LEVEL coordinates like every other authored place — 0076; at the current FIGHT's distance,
  // which is the mid-boss's or the end boss's — 0247.
  reset(boss, fightAt(w) + w.levelOrigin, ACROSS_SPAN / 2, w.bossRow);
  boss.health = toughnessFor(w.bossRow.health, w.difficulty);
  // Recorded, because a phase is a fraction of what the boss STARTED with and the row no longer
  // says what that was. `src/app/boss.ts` takes it as an argument for exactly that reason.
  w.bossFullHealth = boss.health;
  // On the grid from its first shot, like everything else that shoots — 0096.
  boss.fireIn = nextOnGrid(w.steps, fireGapFor(w.bossRow.phases[0]!.fireEvery, w.difficulty));
  w.bossPatrol = 1;
  w.bossPhaseAt = -1;
  w.bossUncoilAt = 0;
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
  // The kind AND the tier — 0233. The ship wears what it is carrying, and what it is carrying is
  // both how much and which.
  const hull = hullFor(w.weapon.kind, w.weapon.tier);
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
  // A bolt is the ship's too, and one that outlived its ship would be a strike from nowhere.
  w.bolts.clear();
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
/**
 * The level's landmark entries, as the painter's own type — 0203.
 *
 * ⚠️ **A LEVEL BOUNDARY IS NOT A FRAME.** This allocates, which is why it is here and not in
 * `paintLandmarks`: `startLevel` and `advanceLevel` run once per level, and
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` scans this file for exactly this
 * syntax inside the loop. A level places one or two.
 */
// ⚠️ **EXPORTED SINCE 0212**: the music room walks a level's landmarks past without starting one, and
// a second `.map` in the shell would be a second description of what a landmark entry becomes.
export function landmarksFor(level: LevelRow): Landmarks {
  // @setup: a level boundary is not a frame — startLevel and advanceLevel call this once per level
  return level.landmarks.map((entry) => ({
    // ⚠️ **WHICH CASTING, AND IT IS THE ONLY PLACE THE VARIANT BECOMES A SPRITE** — 0225. Three slots
    // are baked from three seeds at the boundary; an entry names one, and everything downstream of
    // here is a sprite index like any other.
    sprite: LANDMARK_SLOTS[entry.variant],
    extent: SPRITE_EXTENT.landmark,
    at: entry.at,
    lane: entry.lane,
    depth: entry.depth,
    beat: entry.beat,
  }));
}

export function startLevel(w: World, level: LevelRow): void {
  w.level = level;
  w.landmarks = landmarksFor(level);
  /*
    ⚠️ **ZERO, and it is not a default — it is what this function MEANS.** `startLevel` is the run
    beginning: the camera goes to zero, the field is swept, and `src/app/lifecycle.ts` dispatches
    `begin` (which resets the run's level index) immediately before calling it. A run that started
    anywhere else would be a resume, and 0068's continue deliberately does not come through here.
    `advanceLevel` is the one that takes an index, because it is the one where the index varies.
  */
  w.levelIndex = 0;
  // The mid-boss's fight first, where the level has one — 0247.
  w.fight = level.midBoss === null ? 1 : 0;
  w.bossRow = BOSSES[level.midBoss === null ? level.boss : level.midBoss.kind];
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
  w.landmarks = landmarksFor(level);
  /*
    ⚠️ **REQUIRED rather than defaulted, because this is the parameter the dial is made of** —
    `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`. A default here would be a level
    boundary that silently kept the run at difficulty one, which is invisible in every screenshot and
    is the whole feature not working.
  */
  w.levelIndex = levelIndex;
  // The mid-boss's fight first, where the level has one — 0247.
  w.fight = level.midBoss === null ? 1 : 0;
  w.bossRow = BOSSES[level.midBoss === null ? level.boss : level.midBoss.kind];
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
  // A mid-boss still coming apart at a level boundary would go on bursting into the next — 0247.
  w.bossBurstIn = 0;
  // ⚠️ Cleared as well as latched, or a level entered while the last one was still exploding would
  // report itself cleared a second and a half in, with its own boss still ahead of the player.
  w.clearedIn = 0;
  w.bossPatrol = 1;
  w.bossPhaseAt = -1;
  w.bossUncoilAt = 0;
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
