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
 * ⚠️ **This is a PROOF SCENE, not the game.** Drifting debris and a ship that holds station: enough
 * to prove the loop, the pools, the camera and the painter agree with each other in a real browser.
 * Waves, enemies and bosses arrive with `content/`; nothing about this file's shape survives that.
 */

import { ACROSS_SPAN, spawnAlong, type View } from '../sim/camera.ts';
import { type Entity, reset, stepEntities } from '../sim/entity.ts';
import { flyShip } from '../sim/flight.ts';
import type { Intent } from '../sim/intent.ts';
import type { InputSource } from './input.ts';
import type { Pool } from '../sim/pool.ts';
import { paintScene } from '../render/scene.ts';
import type { Surface } from '../render/surface.ts';
import type { Rng } from '../sim/rng.ts';
import type { Frame } from './loop.ts';

/** Everything a frame reads. Mutable, set up once, and updated on a resize — never reducer state. */
export interface World {
  pool: Pool<Entity>;
  view: View;
  surface: Surface;
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
  /** The player's ship, held live in slot 0 for the whole scene. */
  ship: Entity;
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

    // The ship's `velAlong` carries the scroll rate as its baseline, so `stepEntities` moves it with
    // the camera and a player asking for nothing holds station. Debris carries zero and is therefore
    // left behind, which is what makes the world appear to move past.
    stepEntities(w.pool, w.cameraAlong);

    w.spawnIn--;
    if (w.spawnIn <= 0) {
      w.spawnIn = 9;
      const e = w.pool.spawn();
      if (e !== null) {
        const margin = 8;
        reset(e, spawnAlong(w.cameraAlong), w.rng.range(margin, ACROSS_SPAN - margin), 1 + w.rng.int(0, 2));
        e.velAcross = w.rng.range(-0.12, 0.12);
      }
    }
  }

  draw(alpha: number): void {
    const w = this.world;
    // The camera is interpolated on the same alpha as everything it gets subtracted from. Passing
    // the stepped value here is what made a ship holding station exactly still judder on screen.
    const camera = w.prevCameraAlong + (w.cameraAlong - w.prevCameraAlong) * alpha;
    paintScene(w.surface, w.view, w.pool, camera, alpha);
  }
}
