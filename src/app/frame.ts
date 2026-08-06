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
import { flyShip, holdStation } from '../sim/flight.ts';
import type { Intent } from '../sim/intent.ts';
import type { Tuning } from '../sim/assist.ts';
import type { InputSource } from './input.ts';
import type { Pool } from '../sim/pool.ts';
import { paintScene } from '../render/scene.ts';
import type { Surface } from '../render/surface.ts';
import type { Rng } from '../sim/rng.ts';
import type { EnemyKind, EnemyRow } from '../content/enemies.ts';
import type { ShipRow } from '../content/ships.ts';
import { INVULN_STEPS, SHIELD_MARK, shieldsOf } from '../content/ships.ts';
import { SHOTS } from '../content/shots.ts';
import { BURST, DEBRIS } from '../content/debris.ts';
import { FORMATIONS } from '../content/formations.ts';
import { DEFAULT_ORIGIN, type LevelRow } from '../content/levels.ts';
import { BOSSES, type BossRow } from '../content/bosses.ts';
import { type DifficultyRow, fireGapFor, toughnessFor } from '../content/difficulty.ts';
import {
  CYCLE_UNITS,
  PICKUP_KINDS,
  type PickupKind,
  type PickupRow,
  type UpgradeKind,
  type Weapon,
} from '../content/pickups.ts';
import { SPECIALS, type SpecialKind } from '../content/specials.ts';
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
 * ⚠️ **It is also what makes a scattered pickup NON-CYCLING**, which is the other half of the ask: a
 * lifetime is the one thing an authored pickup never has, so `lifeFor > 0` IS *this is a scattered
 * one* — no flag, no second field, and no way for the two to disagree. `cyclePickups` skips them.
 */
const SCATTER_STEPS = 300;

/**
 * Where a pickup stops running away and waits, in world units ahead of the camera.
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
 * them. Holding station is what turns *catch it as it goes past* into *go and get the one you want*.
 *
 * ⚠️ **100, and both bounds are real.** It is inside the narrowest view any device gets — 150 units
 * (`src/sim/camera.ts`) — so the wait happens on screen everywhere; and it is inside the player's own
 * box, which reaches `PLAYER_ALONG_SPAN − PLAYER_MARGIN` at 144, so the player can actually fly to it.
 * A station outside either would be a pickup that waits somewhere nobody can go.
 */
const PICKUP_STATION = 100;

/**
 * How long a pickup waits once it has arrived, in steps — seven seconds.
 *
 * ⚠️ **Measured against the CYCLE rather than chosen for roundness.** `CYCLE_UNITS` is 3.11 seconds
 * (`src/content/pickups.ts`), so seven seconds is **two and a quarter faces while the player is
 * beside it** — enough to see the other face, decide, and still have time to take it. Anything under
 * one full cycle would leave *which one you get* down to when you happened to arrive, which is the
 * complaint the ask came from.
 *
 * A starting point on `docs/decisions/0037-the-ship-has-mass.md`'s terms, and nothing asserts on it;
 * what `tests/pickups.test.ts` holds is that the wait covers more than one cycle.
 */
const PICKUP_LINGER_STEPS = 420;

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
  /**
   * The other face of each pickup, as an index into `pickupRows`. Built once at boot.
   *
   * ⚠️ **An array of indices rather than `CYCLE` itself**, for the reason `enemyRows` is an array:
   * it is read once per live pickup per step, and a string key into a `Record` is a lookup the hot
   * path does not have to do. `src/content/pickups.ts` holds the table it is built from, which is
   * the single description.
   */
  pickupCycle: readonly number[];
  /**
   * Whether the field is currently showing the second face. Derived from the camera every step.
   *
   * ⚠️ **Computed once per step and read twice** — by the sprites and by the collection — so a
   * pickup cannot be drawn as one thing and collected as another. That is not a hypothetical: they
   * are separate loops, and the second copy of `floor(camera / units) % 2` is exactly the drift
   * `src/content/sprites.ts` records the cost of.
   */
  pickupFlipped: boolean;
  /** What was collected this step. Reused, never rebuilt. */
  collected: Collected;
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
  /** Which way the boss is currently sliding across the lane: −1 or 1. */
  bossPatrol: number;
  /**
   * The boss died, so the level is over.
   *
   * ⚠️ Reported rather than decided, exactly as `onDeath` is. What clearing a level is worth belongs
   * to `src/state/`, not to the file that moves the bodies.
   */
  onCleared: () => void;
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
   * The ship reached zero health.
   *
   * ⚠️ **The frame reports it and decides nothing.** What a death costs is
   * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`'s subject and it lives in
   * `src/state/` — this file cannot know whether a life remains, and the version that did know was
   * the `restart()` placeholder this replaced.
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
}

export class GameFrame implements Frame {
  constructor(private readonly world: World) {}

  step(): void {
    const w = this.world;
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
    flyShip(w.ship, w.intent, w.cameraAlong, w.scrollPerStep);

    cyclePickups(w);
    askSpecials(w);
    fireShip(w);
    fireMissiles(w);
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
    collideInto(w.playerShots, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths);
    collideInto(w.missiles, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths);
    // The boss is its own pairing rather than another enemy, and the reason is the pool: it is the
    // only body in the game that must survive a hundred and fifty hits, so it cannot share a pool
    // with things that are released after one.
    collideInto(w.playerShots, w.bossPool, 1, 1, IMPACT_FLASH_STEPS, w.deaths);
    collideInto(w.missiles, w.bossPool, 1, 1, IMPACT_FLASH_STEPS, w.deaths);
    // An area rather than an arrival: everything inside it, once, and nothing consumes it.
    blastInto(w.blasts, w.enemies, 1, IMPACT_FLASH_STEPS, w.deaths);
    blastInto(w.blasts, w.bossPool, 1, IMPACT_FLASH_STEPS, w.deaths);
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
    const healthBefore = w.ship.health;
    collideIntoOne(w.enemyShots, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, true);
    // Not consumed: an enemy the player flew into is still there afterwards, or ramming would be the
    // cheapest way to clear the screen.
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
    collectInto(w.pickups, w.ship, COLLECT_REACH, w.collected);
    for (let i = 0; i < w.collected.count; i++) {
      // `PICKUP_KINDS` IS the index order — `pickupRows` is built by walking it — so the entity's
      // opaque `kind` reads back as the authored name with no second table to keep in step.
      /*
        ⚠️ **The FACE, not the authored kind.** The entity keeps the kind the level wrote — so the
        cycle has no state to accumulate and a pickup cannot drift out of step with the field — and
        which face that is right now is the same boolean the sprites were drawn from a moment ago.
      */
      const index = w.collected.kind[i]!;
      const face = w.pickupFlipped ? (w.pickupCycle[index] ?? index) : index;
      const kind = PICKUP_KINDS[face];
      if (kind !== undefined) w.onPickup(kind);
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

    if (w.ship.health <= 0) {
      burst(w, w.ship.along, w.ship.across, BURST.ship);
      // The shell spends a life and decides what happens next — it may call `respawn` before this
      // step is over, or it may raise the game-over screen and leave the wreck where it is.
      w.onDeath();
    }

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
    const horizon = spawnAlong(w.cameraAlong);
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
    if (w.bossSpawned && !w.bossBeaten && w.bossPool.size === 0) {
      w.bossBeaten = true;
      /*
        ⚠️ **THE LEVEL DOES NOT END HERE ANY MORE.** Reported from play: *"bosses need a real
        explosion and an end-of-level beat — currently the level just ends."* It did: the same step
        that emptied the pool raised a screen over the frame, so the loudest event in the game was a
        boss vanishing behind an overlay. `docs/decisions/0062-a-boss-dies-loudly.md`.
      */
      w.clearedIn = BOSS_DEATH_STEPS;
    }
    stepBossDeath(w);
  }

  draw(alpha: number): void {
    const w = this.world;
    // The camera is interpolated on the same alpha as everything it gets subtracted from. Passing
    // the stepped value here is what made a ship holding station exactly still judder on screen.
    const camera = w.prevCameraAlong + (w.cameraAlong - w.prevCameraAlong) * alpha;
    paintScene(w.surface, w.view, w.layers, camera, alpha);
  }
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
  w.fireIn = w.weapon.fireEvery;
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

/**
 * What every pickup on the field currently is.
 *
 * Asked for after playing the two-level build: *"a pickup on the field changes what it is every few
 * seconds, and changes its sprite with it, so which one a player gets is a matter of when they reach
 * it."* `docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md`.
 *
 * ⚠️ **The entity's `kind` is NOT rewritten, and the first draft of this rewrote it.** A face
 * written back onto the entity is state that accumulates: on the next step the same rule reads the
 * face rather than the authored kind and flips it back, so every pickup on the field alternates once
 * a step forever. What the entity carries is what the level authored; what it is *right now* is that
 * plus a boolean, and the boolean lives on the world because the collection needs the same one.
 *
 * ⚠️ **It runs BEFORE the collision**, so a pickup taken on the step it flips gives what it was
 * showing when the ship reached it rather than what it had been a moment earlier.
 *
 * ⚠️ **A function of the camera, so every pickup on screen flips on the same step**, which is what
 * makes it read as the field changing rather than as each object keeping its own timer.
 */
function cyclePickups(w: World): void {
  // One divide per step rather than one per pickup: the phase is the same for everything on screen.
  w.pickupFlipped = Math.floor(w.cameraAlong / CYCLE_UNITS) % 2 !== 0;
  for (let i = w.pickups.size - 1; i >= 0; i--) {
    const item = w.pickups.at(i);
    /*
      ⚠️ **A SCATTERED PICKUP DOES NOT CYCLE, and its lifetime is how that is known.** Asked for:
      *"non-cycling and on a short timer."* An authored pickup never carries a lifetime, so
      `lifeFor > 0` is exactly *this came off a ship that just died* — one field, no flag, and no way
      for the two answers to disagree. `docs/decisions/0066-a-death-scatters-what-it-took.md`.

      It is also the right rule rather than a convenient one: what was scattered is what the player
      just LOST, and a spread that turned into a launcher on the way back would be the game handing
      out something they never had.
    */
    if (item.lifeFor > 0) continue;
    const face = w.pickupFlipped ? (w.pickupCycle[item.kind] ?? item.kind) : item.kind;
    const row = w.pickupRows[face];
    if (row === undefined) continue;
    /*
      ⚠️ **`spriteBase` as well as `sprite`, because `stepEntities` derives the second from the
      first every step.** Setting only `sprite` would be a face that lasts exactly until the next
      step and then silently reverts — the kind of bug that is invisible in a screenshot and reads as
      flickering in play.
    */
    item.spriteBase = row.sprite;
    item.spriteHit = row.spriteHit;
    item.sprite = row.sprite;
  }
}

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
 * ⚠️ **The launchers are POSITIONS, and the middle one is the ship's own.** One launcher fires from
 * the centreline; the second and third sit either side of it and their missiles pop out before they
 * straighten. That order — centre, minus, plus — is the order the ask gives, and it means a player
 * who has taken one launcher upgrade can see WHICH side it went on.
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
  w.missileIn = w.weapon.missileEvery;
  const row = SHOTS[w.shipRow.missile];
  for (let i = 0; i < w.weapon.launchers; i++) {
    const missile = w.missiles.spawn();
    // A volley one tube short is dropped rather than grown — `src/sim/pool.ts` has the argument.
    if (missile === null) return;
    // 0 → the centreline; 1 → the acrossMinus side; 2 → the acrossPlus side.
    const side = i === 0 ? 0 : i === 1 ? -1 : 1;
    reset(missile, w.ship.along + MUZZLE_ALONG, w.ship.across + LAUNCHER_ACROSS * side, row);
    missile.velAlong = row.speed + w.scrollPerStep;
    missile.damage = w.weapon.missileDamage;
    /*
      The pop, as a crossing that stops — the flanker's mechanism exactly, and `steerMissiles` is
      where it ends. A centre missile never crosses, so its `velAcross` stays zero and it costs the
      steering loop nothing at all: `src/sim/entity.ts` says why *not crossing* is a velocity rather
      than a sentinel.
    */
    if (side !== 0) {
      missile.velAcross = LAUNCHER_POP_SPEED * side;
      missile.steerAcross = w.ship.across + LAUNCHER_POP * side;
    }
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
    e.fireIn--;
    if (e.fireIn > 0) continue;
    // The tier's gap, not the row's — and recomputed rather than remembered, because two numbers
    // multiplied is cheaper than a field on every entity in the game that only enemies would use.
    e.fireIn = fireGapFor(row.fireEvery, w.difficulty);
    const dAlong = ship.along - e.along;
    const dAcross = ship.across - e.across;
    const distance = Math.sqrt(dAlong * dAlong + dAcross * dAcross);
    // Zero distance means the enemy is inside the ship, which contact damage has already handled.
    if (distance <= 0) continue;
    const bullet = SHOTS[row.shot];
    const shot = w.enemyShots.spawn();
    if (shot === null) continue;
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
  const along = flanking ? w.cameraAlong + FLANK_ALONG : wave.at;
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
      // The turn: cross at a fixed rate until the authored lane, then straighten and close like
      // anything else. `steerEnemies` is where that second half happens.
      e.velAcross = -side * FLANK_ENTRY_SPEED;
      e.steerAcross = target;
    }
    /*
      THE TIER, applied here and nowhere else for anything that arrives in a wave.

      ⚠️ **After `reset`, which copied the row's own numbers in.** That is the order rather than an
      afterthought: `reset` is what puts a recycled slot into a known state, and a spawner that
      scaled the row before handing it over would have to build a scaled row per spawn — an
      allocation, in the frame, which is the one thing 0022 bans outright.
    */
    e.health = toughnessFor(row.health, w.difficulty);
    // ⚠️ NEGATED here rather than stored negative. `closing` is "towards the player" in the table, so a
    // typo produces a slow enemy rather than one that silently flees off the leading edge.
    e.velAlong = -row.closing * w.difficulty.closing;
    e.fireIn = fireGapFor(row.fireEvery, w.difficulty);
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
  for (let i = w.enemies.size - 1; i >= 0; i--) {
    const e = w.enemies.at(i);
    const row = w.enemyRows[e.kind];
    if (row === undefined) continue;
    if (row.weaveAmplitude > 0 && row.weaveWavelength > 0) {
      const k = TAU / row.weaveWavelength;
      e.velAcross = row.weaveAmplitude * k * Math.cos(e.along * k) * e.velAlong;
      continue;
    }
    /*
      THE FLANKER'S TURN — the first motion in the game that is not a function of `along`.

      ⚠️ **Gated on `velAcross`, so nothing else in the game pays for it.** Everything that is not
      currently crossing the lane has a zero here, and a weaver has already `continue`d above —
      `src/sim/entity.ts` says why *not crossing* is a velocity rather than a sentinel.

      ⚠️ **The comparison is against the direction of travel, not against a distance.** A body
      crossing at 0.8 a step will step OVER any tolerance band you pick, so a *"close enough to the
      target"* test misses at one speed and holds at another; *have I passed it* cannot.
    */
    if (e.velAcross > 0 ? e.across >= e.steerAcross : e.velAcross < 0 && e.across <= e.steerAcross) {
      e.across = e.steerAcross;
      e.velAcross = 0;
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
    if (item.holdFor <= 0) continue;
    item.holdFor--;
    item.velAlong = item.along - w.cameraAlong <= PICKUP_STATION ? w.scrollPerStep : 0;
    // The last step of the wait hands the pickup back to the scroll, or it would hold station for
    // ever on a counter that has already run out.
    if (item.holdFor === 0) item.velAlong = 0;
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
 * ⚠️ **A FAN rather than a roll, which is the opposite of what `burst` does and deliberately so.**
 * Debris is something coming apart and wants to look accidental; this is the game handing the player
 * back a countable set of things, and a seeded scatter that happened to stack two of them on one lane
 * would take one of them away. `src/app/frame.ts`'s `spawnPickup` alternates by index for the same
 * reason.
 */
export function scatterUpgrades(w: World, upgrades: readonly UpgradeKind[]): void {
  for (let i = 0; i < upgrades.length; i++) {
    const kind = w.pickupKinds[upgrades[i]!];
    const row = w.pickupRows[kind];
    if (row === undefined) continue;
    const item = w.pickups.spawn();
    // A scatter one pickup short is dropped rather than grown — `src/sim/pool.ts` has the argument,
    // and a player with more upgrades than the pool has slots has had a very good run.
    if (item === null) return;
    reset(item, w.ship.along, w.ship.across, row, kind);
    /*
      Spread evenly either side of the ship, alternating, each one further out than the last — so a
      loadout of six arrives as six separate things rather than as three pairs.

      ⚠️ **`velAlong` carries the scroll rate**, which is 0034's *every speed is in the camera's
      frame*: the scatter holds the distance the ship died at and spreads ACROSS. Thrown along as
      well, it would be off the screen inside two seconds.
    */
    const side = i % 2 === 0 ? 1 : -1;
    const rank = Math.floor(i / 2) + 1;
    item.velAcross = SCATTER_SPEED * side * (1 - rank * 0.15);
    item.velAlong = w.scrollPerStep;
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
  reset(item, entry.at, entry.lane, row, kind);
  /*
    ⚠️ **Which way it starts drifting alternates by INDEX rather than being rolled.** The spawn
    stream exists and is deliberately not consulted here for the reason `spawnWave` gives: a level is
    authored, and a pickup that drifted a different way every run could not be placed by a hand.
    Alternating means two pickups near each other visibly separate rather than moving as a pair.
  */
  item.velAcross = index % 2 === 0 ? PICKUP_DRIFT : -PICKUP_DRIFT;
  /*
    HOW LONG IT HAS BEFORE THE SCROLL TAKES IT AWAY — the approach plus the wait, in steps.

    ⚠️ **Computed from where it actually starts rather than from a constant**, because a wave's
    authored `at` and the camera at the moment it spawns differ by up to one step, and because
    `docs/decisions/0064-a-pickup-waits-to-be-taken.md` wants the WAIT to be the same seven seconds
    for every pickup rather than the total to be the same. A pickup that spawned already inside the
    station gets no approach and all of the wait, which is the honest answer.

    ⚠️ **Nothing allocates**: a subtraction, a divide and a `Math.max`.
  */
  const approach = (entry.at - w.cameraAlong - PICKUP_STATION) / w.scrollPerStep;
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
  reset(boss, w.level.bossAt, ACROSS_SPAN / 2, w.bossRow);
  boss.health = toughnessFor(w.bossRow.health, w.difficulty);
  // Recorded, because a phase is a fraction of what the boss STARTED with and the row no longer
  // says what that was. `src/app/boss.ts` takes it as an argument for exactly that reason.
  w.bossFullHealth = boss.health;
  boss.fireIn = fireGapFor(w.bossRow.phases[0]!.fireEvery, w.difficulty);
  w.bossPatrol = 1;
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
  /*
    ⚠️ **The pickups on screen are NOT cleared, and that is the answer to what a death costs.**
    0039 empties the arsenal, which means the twenty seconds after a death are the hardest in the
    level — so anything the player had not yet reached is still there to be flown for. Wiping them
    would turn one mistake into a stretch with no way back out of it.
  */
  w.fireIn = w.weapon.fireEvery;
  w.missileIn = w.weapon.missileEvery;
}

/**
 * Everything `respawn` does, plus the state that belongs to the run rather than to the life: the
 * camera goes back to the start and the debris of the last run is swept.
 *
 * ⚠️ **The camera reset is what makes two runs the same run.** Distance travelled is the only clock
 * a level has — a wave table places its content against `cameraAlong` — so a second run that started
 * where the first one ended would be playing a different level with the same name.
 */
/**
 * Put a level on the field and start it from the beginning.
 *
 * ⚠️ **It touches the level and the scene, and nothing about the RUN.** Lives, upgrades and the
 * arsenal all cross a level boundary — that is what `docs/game.md`'s *"carry forward"* means once
 * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` amended it — so they live in
 * `src/state/` and this cannot reach them even by accident.
 */
export function startLevel(w: World, level: LevelRow, keepShell: boolean): void {
  w.level = level;
  w.bossRow = BOSSES[level.boss];
  /*
    ⚠️ **THE SHELL CROSSES A BOUNDARY BECAUSE THE SHIP DOES, AND IT DOES NOT CROSS A RUN.**
    `resetScene` calls `respawn`, which puts a hull with nothing on it back on the field — right for a
    death and wrong at a level boundary, where nothing died. Reported from play: *"shields don't carry
    forward between levels."* `docs/decisions/0058-a-level-boundary-keeps-the-shell.md`.

    ⚠️ **Read before and written after rather than *not reset***, so `respawn` goes on saying exactly
    one thing — *this is what a new life gets* — and the difference between a life and a level lives
    in the function whose name is that difference.

    ⚠️ **`keepShell` IS AN ARGUMENT AND WAS BRIEFLY AN ORDERING.** The first version read the count
    unconditionally and relied on `src/app/mount.ts` calling `resetScene` before `startLevel` at the
    top of a run, so that what crossed was zero. That is true, invisible, and reached by a line in
    another file that reads as redundant — and `npm run prove` said so: the probe that removed that
    line came back STILL GREEN, because no test could see an ordering nothing states. A caller that
    has to say which of the two it is cannot get it wrong quietly.
  */
  const shields = keepShell ? shieldsOf(w.shipRow, w.ship.health) : 0;
  resetScene(w);
  w.ship.health += shields;
}

export function resetScene(w: World): void {
  w.cameraAlong = 0;
  w.prevCameraAlong = 0;
  w.debris.clear();
  /*
    ⚠️ **The boss is cleared HERE and deliberately not in `respawn`.** A death during the fight leaves
    the boss exactly as the player left it — damaged, mid-phase, still there — which is the arcade
    answer and the one that keeps a life worth spending. Only a new run puts it back.
  */
  w.bossPool.clear();
  w.pickups.clear();
  w.nextWave = 0;
  w.nextPickup = 0;
  w.bossSpawned = false;
  w.bossBeaten = false;
  // ⚠️ Cleared HERE as well as latched, or a level entered while the last one was still exploding
  // would report itself cleared a second and a half in, with its own boss still ahead of the player.
  w.clearedIn = 0;
  w.bossPatrol = 1;
  respawn(w);
}
