import { describe, it, expect } from 'vitest';
import { BOSSES } from '../src/content/bosses.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { viewOf } from '../src/sim/camera.ts';
import { type Entity, makeEntity, reset } from '../src/sim/entity.ts';
import { makeIntent } from '../src/sim/intent.ts';
import { holdStation } from '../src/sim/flight.ts';
import { Pool } from '../src/sim/pool.ts';
import { makeDeaths } from '../src/sim/collide.ts';
import { makeRng } from '../src/sim/rng.ts';
import type { Surface } from '../src/render/surface.ts';
import { GameFrame, type World } from '../src/app/frame.ts';
import type { InputSource } from '../src/app/input.ts';
import { DEFAULT_ASSISTS, tuningFor } from '../src/sim/assist.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { MAX_SHIELDS, SHIPS } from '../src/content/ships.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { inertLevel } from './world.ts';

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
  bolt(): void {}
}

const NO_INPUT: InputSource = { contribute(): void {}, spend(): void {}, release(): void {} };

/** Far enough out that nothing spawns or fires during these frames and adds a blit. */
const NEVER = 10_000;

/**
 * ⚠️ **Everything below finds the ship BY ITS SPRITE, never by being the first blit drawn.**
 *
 * It used to be `blits[0]`, which was true while one pool held everything and the ship sat in slot
 * 0. `src/app/frame.ts` now draws the ship LAST so the player can find it in a crowd — and the
 * assumption would have gone on passing, silently measuring an enemy, exactly as the same assumption
 * in `scripts/trace-frame.mjs` would have. Both were fixed the same way and in the same change; see
 * `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
 */
function drawnAt(surface: RecordingSurface, spriteIndex: number): { x: number; y: number } | undefined {
  const hit = surface.blits.filter((b) => b.sprite === spriteIndex);
  expect(hit.length, `expected exactly one blit of sprite ${spriteIndex}, saw ${hit.length}`).toBe(1);
  return hit[0];
}

function stationKeepingWorld(surface: Surface): World {
  const shipPool = new Pool(1, makeEntity);
  const enemies = new Pool(8, makeEntity);
  const playerShots = new Pool(8, makeEntity);
  const enemyShots = new Pool(8, makeEntity);
  // The real ship's numbers with its trigger held off, so the scene under test is the camera and
  // nothing else. A stream of auto-fire would not move the ship; it would only make the picture
  // harder to read for no gain.
  // 0093 took `fireEvery` off the row. `fireIn: NEVER` below is what actually holds the trigger off,
  // and always was — the row's copy of it was doing nothing this fixture depended on.
  const shipRow = SHIPS.proof;
  const ship = shipPool.spawn()!;
  reset(ship, 40, 50, shipRow);
  /*
    ⚠️ **`reset` leaves a ship at zero velocity, which is not the same as at rest**, and since the
    ship gained mass the difference is permanent rather than momentary: from zero it spends about
    five steps accelerating up to the scroll rate, and the ground it fails to cover in those steps is
    ground it never recovers — velocity converges on the camera's *rate*, not on a *position*.

    This test found that by drifting 15px over ten seconds of "station-keeping". Both real composers
    call `holdStation`; this one was building a world by hand and skipping it.
  */
  holdStation(ship, 0.6);
  return {
    layers: [enemies, enemyShots, playerShots, shipPool],
    sky: [],
    landmarks: [],
    shipPool,
    shieldOrbs: new Pool<Entity>(MAX_SHIELDS, makeEntity),
    exhaust: new Pool<Entity>(1, makeEntity),
    missiles: new Pool<Entity>(8, makeEntity),
    bombs: new Pool<Entity>(4, makeEntity),
    blasts: new Pool<Entity>(4, makeEntity),
    onSpecial: (): void => {},
    missileIn: 10_000,
    enemies,
    playerShots,
    enemyShots,
    // No debris in this scene: it is about the camera, and a burst would add blits that come and go.
    debris: new Pool(4, makeEntity),
    deaths: makeDeaths(8),
    hits: makeDeaths(8),
    burstRng: makeRng('interp').stream('burst'),
    arcRng: makeRng('interp').stream('arc'),
    bolts: new Pool<Entity>(CAPACITY.bolts, makeEntity),
    scatterRng: makeRng('interp').stream('scatter'),
    view: viewOf(1280, 720),
    surface,
    rng: makeRng('interp').stream('spawns'),
    steps: 0,
    cameraAlong: 0,
    prevCameraAlong: 0,
    scrollPerStep: 0.6,
    ...inertLevel(),
    fireIn: NEVER,
    ship,
    shipRow,
    enemyRows: ENEMY_KINDS.map((k) => ENEMIES[k]),
    tuning: tuningFor(DEFAULT_ASSISTS),
    input: NO_INPUT,
    intent: makeIntent(2),
    // A hand-built world for a test drives the step directly, so it is always stepping and a
    // death is nobody's business but the assertion's — 0039 puts the cost of one in the shell.
    stepping: true,
    difficulty: DIFFICULTIES[DIFFICULTY_KINDS[0]!],
    bossFullHealth: BOSSES.sentinel.health,
    onIdle: (): void => {},
    onTick: (): void => {},
    onDeath: (): void => {},
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
      const drawn = drawnAt(surface, SPRITE.ship);
      expect(drawn, `the ship was not drawn at alpha ${alpha}`).toBeDefined();
      seen.push({ x: drawn!.x, y: drawn!.y });
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
    const start = { ...drawnAt(surface, SPRITE.ship)! };

    for (let i = 0; i < 600; i++) {
      frame.step();
      frame.draw(0.5);
    }
    const end = drawnAt(surface, SPRITE.ship)!;
    expect(end.x, 'the ship drifted along over ten seconds of station-keeping').toBeCloseTo(start.x, 6);
    expect(end.y, 'the ship drifted across over ten seconds of station-keeping').toBeCloseTo(start.y, 6);
  });

  it('an enemy left behind DOES move, so this is not passing by drawing nothing', () => {
    // The control. If the projection were broken in a way that pinned everything, the assertions
    // above would be perfectly green and the whole scene would be frozen.
    const surface = new RecordingSurface();
    const world = stationKeepingWorld(surface);
    const holding = world.enemies.spawn()!;
    // Placed well clear of the ship: an enemy that reaches it deals contact damage, and a restart
    // mid-test would empty the pool and take the control with it.
    reset(holding, 120, 20, ENEMIES.drifter);
    const frame = new GameFrame(world);

    frame.step();
    frame.draw(0.5);
    const before = { ...drawnAt(surface, SPRITE.drifter)! };
    for (let i = 0; i < 30; i++) frame.step();
    frame.draw(0.5);
    const after = drawnAt(surface, SPRITE.drifter)!;
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(10);
  });
});
