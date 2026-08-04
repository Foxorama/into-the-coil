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
  /** World units the camera advances per fixed step. */
  scrollPerStep: number;
  /** Steps until the next spawn. Counted down rather than timed — the step IS the clock. */
  spawnIn: number;
  /** The player's ship, held live in slot 0 for the whole scene. */
  ship: Entity;
}

export class GameFrame implements Frame {
  constructor(private readonly world: World) {}

  step(): void {
    const w = this.world;
    w.cameraAlong += w.scrollPerStep;

    // The ship holds station in the camera's frame — it carries `velAlong` equal to the scroll rate,
    // so `stepEntities` moves it with the camera and it stays put on screen. Debris carries zero and
    // is therefore left behind, which is what makes the world appear to move past.
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
    paintScene(w.surface, w.view, w.pool, w.cameraAlong, alpha);
  }
}
