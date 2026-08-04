import { describe, it, expect } from 'vitest';
import { viewOf } from '../src/sim/camera.ts';
import { makeEntity, reset } from '../src/sim/entity.ts';
import { makeIntent } from '../src/sim/intent.ts';
import { Pool } from '../src/sim/pool.ts';
import { makeRng } from '../src/sim/rng.ts';
import type { Surface } from '../src/render/surface.ts';
import { GameFrame, type World } from '../src/app/frame.ts';
import type { InputSource } from '../src/app/input.ts';

/**
 * A SHIP HOLDING STATION MUST NOT MOVE ON SCREEN.
 *
 * ⚠️ **This test exists because the suite could not see the bug.** Entities were interpolated
 * between their two step positions while the camera was subtracted at its *stepped* value, so
 * `entity − camera` wobbled by up to a full step of camera travel every frame. In world units the
 * ship was exactly stationary; on screen it juddered ~4px, on every entity, forever.
 *
 * Every one of the 271 assertions in this suite was green before the fix and after it. The thing
 * that found it was `scripts/trace-frame.mjs` — the instrument
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` says to build BEFORE the first tuning
 * pass rather than after the seventh report. It reported 4.0px of screen travel for a ship asking
 * for nothing, and 0.0px afterwards.
 *
 * So this asserts the PICTURE: the same world, drawn at several alphas, must put the ship in the
 * same place.
 */

/** Records where things were drawn. The whole point is that these numbers do not move. */
class RecordingSurface implements Surface {
  readonly blits: { sprite: number; x: number; y: number }[] = [];
  clear(): void {
    this.blits.length = 0;
  }
  blit(sprite: number, x: number, y: number): void {
    this.blits.push({ sprite, x, y });
  }
}

const NO_INPUT: InputSource = { sample(): void {}, release(): void {} };

function stationKeepingWorld(surface: Surface): World {
  const pool = new Pool(8, makeEntity);
  const ship = pool.spawn()!;
  reset(ship, 40, 50, 0);
  return {
    pool,
    view: viewOf(1280, 720),
    surface,
    rng: makeRng('interp').stream('debris'),
    cameraAlong: 0,
    prevCameraAlong: 0,
    scrollPerStep: 0.6,
    // Far enough out that no spawn lands during these frames and moves the first blit.
    spawnIn: 10_000,
    ship,
    input: NO_INPUT,
    intent: makeIntent(2),
  };
}

describe('the camera interpolates on the same alpha as everything it is subtracted from', () => {
  it('THE ONE: a ship asking for nothing is drawn in exactly the same place at every alpha', () => {
    const surface = new RecordingSurface();
    const frame = new GameFrame(stationKeepingWorld(surface));
    frame.step();

    const seen: { x: number; y: number }[] = [];
    for (const alpha of [0, 0.25, 0.5, 0.75, 1]) {
      frame.draw(alpha);
      const first = surface.blits[0];
      expect(first, `nothing was drawn at alpha ${alpha}`).toBeDefined();
      seen.push({ x: first!.x, y: first!.y });
    }
    for (const point of seen) {
      expect(point.x, `the ship moves with alpha: ${JSON.stringify(seen)}`).toBeCloseTo(seen[0]!.x, 9);
      expect(point.y, `the ship moves with alpha: ${JSON.stringify(seen)}`).toBeCloseTo(seen[0]!.y, 9);
    }
  });

  it('and stays put across many steps, not just within one', () => {
    // A per-step error that cancels within a step but accumulates across them would pass the test
    // above and still drift the ship off the screen over a minute of play.
    const surface = new RecordingSurface();
    const frame = new GameFrame(stationKeepingWorld(surface));
    frame.step();
    frame.draw(0.5);
    const start = { ...surface.blits[0]! };

    for (let i = 0; i < 600; i++) {
      frame.step();
      frame.draw(0.5);
    }
    const end = surface.blits[0]!;
    expect(end.x, 'the ship drifted along over ten seconds of station-keeping').toBeCloseTo(start.x, 6);
    expect(end.y, 'the ship drifted across over ten seconds of station-keeping').toBeCloseTo(start.y, 6);
  });

  it('debris left behind DOES move, so this is not passing by drawing nothing', () => {
    // The control. If the projection were broken in a way that pinned everything, the assertions
    // above would be perfectly green and the whole scene would be frozen.
    const surface = new RecordingSurface();
    const world = stationKeepingWorld(surface);
    const debris = world.pool.spawn()!;
    reset(debris, 80, 30, 1);
    const frame = new GameFrame(world);

    frame.step();
    frame.draw(0.5);
    const before = { ...surface.blits[1]! };
    for (let i = 0; i < 30; i++) frame.step();
    frame.draw(0.5);
    const after = surface.blits[1]!;
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(10);
  });
});
