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

import { ACROSS_SPAN, spawnAlong, type View } from '../sim/camera.ts';
import { collideInto, collideIntoOne } from '../sim/collide.ts';
import { type Entity, reset, stepEntities } from '../sim/entity.ts';
import { flyShip } from '../sim/flight.ts';
import type { Intent } from '../sim/intent.ts';
import type { Tuning } from '../sim/assist.ts';
import type { InputSource } from './input.ts';
import type { Pool } from '../sim/pool.ts';
import { paintScene } from '../render/scene.ts';
import type { Surface } from '../render/surface.ts';
import type { Rng } from '../sim/rng.ts';
import type { EnemyRow } from '../content/enemies.ts';
import type { ShipRow } from '../content/ships.ts';
import { INVULN_STEPS } from '../content/ships.ts';
import { SHOTS } from '../content/shots.ts';
import { SPRITE } from '../content/sprites.ts';
import type { Frame } from './loop.ts';

/** How far in front of the ship a shot appears, in world units — clear of its own hurtbox. */
const MUZZLE_ALONG = 3;

/** Steps between enemy spawns. The proof scene's whole wave table, and it is one number. */
const SPAWN_EVERY = 42;

/**
 * Where the ship sits in its box, in world units ahead of the camera's trailing edge.
 *
 * Exported because `mount.ts` places the ship at boot and this file places it again on a restart, and
 * two descriptions of one position drift the first time either moves.
 */
export const SHIP_START_ALONG = 40;

/**
 * How many steps of the hit flash are lit, and how many dark.
 *
 * A power of two so the phase is a mask rather than a modulo, and eight steps is about 7.5 flashes
 * across `INVULN_STEPS` — fast enough to read as damage, slow enough that a 60Hz display shows every
 * one of them. ⚠️ `docs/decisions/0024-the-accessibility-floor-is-settings.md` caps flash intensity
 * unconditionally; this is two inks of one silhouette rather than a full-screen flash, which is the
 * side of that line it is meant to be on.
 */
const FLASH_PHASE = 8;

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
  enemies: Pool<Entity>;
  /** What the player fired. Separate from `enemyShots` because the PAIRING is the collision guard. */
  playerShots: Pool<Entity>;
  enemyShots: Pool<Entity>;
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
  /** Steps until the next spawn. Counted down rather than timed — the step IS the clock. */
  spawnIn: number;
  /** Steps until the ship's auto-fire goes again. */
  fireIn: number;
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
  /** What the model's numbers currently are — `docs/decisions/0024-…`'s assists, resolved. */
  tuning: Tuning;
  /** Where devices are read. Sampled exactly once per fixed step — see 0030. */
  input: InputSource;
  /** This step's ask. One instance, overwritten in place; never allocated in a frame. */
  intent: Intent;
}

export class GameFrame implements Frame {
  constructor(private readonly world: World) {}

  step(): void {
    const w = this.world;
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

    fireShip(w);
    fireEnemies(w);

    // The ship's `velAlong` carries the scroll rate as its baseline, so `stepEntities` moves it with
    // the camera and a player asking for nothing holds station. An enemy carries its own closing
    // speed and nothing else, which is what makes the world appear to move past it.
    stepEntities(w.shipPool, w.cameraAlong);
    stepEntities(w.enemies, w.cameraAlong);
    stepEntities(w.playerShots, w.cameraAlong);
    stepEntities(w.enemyShots, w.cameraAlong);

    /*
      THE PAIRINGS, written out. Each line names two sides that can meet, which is what makes the
      collision cost the product of two small pools rather than the square of one big one — see
      `src/sim/collide.ts`.

      ⚠️ The player's two arguments are the assists, and this is the first place in the game that
      `src/sim/assist.ts` reaches the model at all. `tests/assist.test.ts` proved the TABLE was
      monotone; `tests/combat.test.ts` is what proves the code using it is.
    */
    collideInto(w.playerShots, w.enemies, 1, 1);
    collideIntoOne(w.enemyShots, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, true);
    // Not consumed: an enemy the player flew into is still there afterwards, or ramming would be the
    // cheapest way to clear the screen.
    collideIntoOne(w.enemies, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, false);

    // The hit flash is a SPRITE the sim selects, never a branch inside the painter: `render/scene.ts`
    // draws what it is handed, which is the rule 0015 gives the layer.
    w.ship.sprite = w.ship.invulnFor > 0 && (w.ship.invulnFor & FLASH_PHASE) !== 0 ? SPRITE.shipHit : SPRITE.ship;

    if (w.ship.health <= 0) restart(w);

    w.spawnIn--;
    if (w.spawnIn <= 0) {
      w.spawnIn = SPAWN_EVERY;
      spawnEnemy(w);
    }
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
  w.fireIn = w.shipRow.fireEvery;
  const row = SHOTS[w.shipRow.shot];
  const shot = w.playerShots.spawn();
  if (shot === null) return;
  reset(shot, w.ship.along + MUZZLE_ALONG, w.ship.across, row);
  // Camera frame, like everything else the player can see move — see `fireEnemies`.
  shot.velAlong = row.speed + w.scrollPerStep;
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
    e.fireIn = row.fireEvery;
    const dAlong = ship.along - e.along;
    const dAcross = ship.across - e.across;
    const distance = Math.sqrt(dAlong * dAlong + dAcross * dAcross);
    // Zero distance means the enemy is inside the ship, which contact damage has already handled.
    if (distance <= 0) continue;
    const bullet = SHOTS[row.shot];
    const shot = w.enemyShots.spawn();
    if (shot === null) continue;
    reset(shot, e.along, e.across, bullet);
    shot.velAlong = (dAlong / distance) * bullet.speed + w.scrollPerStep;
    shot.velAcross = (dAcross / distance) * bullet.speed;
  }
}

/** One enemy, at the leading edge, in a lane the spawn stream chose. */
function spawnEnemy(w: World): void {
  const e = w.enemies.spawn();
  if (e === null) return;
  const kind = w.rng.int(0, w.enemyRows.length - 1);
  const row = w.enemyRows[kind];
  if (row === undefined) return;
  const margin = row.radius + 2;
  reset(e, spawnAlong(w.cameraAlong), w.rng.range(margin, ACROSS_SPAN - margin), row, kind);
  // ⚠️ NEGATED here rather than stored negative. `closing` is "towards the player" in the table, so a
  // typo produces a slow enemy rather than one that silently flees off the leading edge.
  e.velAlong = -row.closing;
  e.fireIn = row.fireEvery;
}

/**
 * The ship ran out of health.
 *
 * ⚠️ **The scene restarts; the RUN does not, because there is no run.** A game-over screen needs
 * `src/state/`, which does not exist and whose creation is its own decision under
 * `docs/decisions/0015-the-layer-ladder.md`. Landing it here would put three decisions in one PR.
 * What this has to do is make death legible enough that a play-test verdict about the dodge is about
 * the dodge — and an emptied screen with the ship back at the start does that.
 */
function restart(w: World): void {
  w.enemies.clear();
  w.playerShots.clear();
  w.enemyShots.clear();
  reset(w.ship, w.cameraAlong + SHIP_START_ALONG, ACROSS_SPAN / 2, w.shipRow);
  w.ship.velAlong = w.scrollPerStep;
  w.ship.invulnFor = INVULN_STEPS;
  w.fireIn = w.shipRow.fireEvery;
  w.spawnIn = SPAWN_EVERY;
}
