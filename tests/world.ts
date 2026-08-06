/**
 * The parts of a hand-built `World` that a test does not care about.
 *
 * ⚠️ **This exists because a `World` gained nine fields in one change and three test fixtures each
 * had to be told about all of them.** Two of those fields — the level script and the boss — would
 * have made every combat fixture start spawning waves at it, which is not a fixture failing, it is a
 * fixture quietly measuring something else.
 *
 * So the answer is not *"add the fields to each literal"*: it is one place that says **what an inert
 * level is**, cited by every fixture that wants no level at all. `docs/decisions/0029-the-tracked-record-is-the-record.md`
 * is the same argument about prose — a second copy drifts, and here it would drift into three
 * fixtures whose subject is collision.
 */

import { DIFFICULTIES, DIFFICULTY_KINDS, type DifficultyKind } from '../src/content/difficulty.ts';
import { Pool } from '../src/sim/pool.ts';
import { type Entity, makeEntity, reset } from '../src/sim/entity.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { CYCLE, PICKUPS, PICKUP_KINDS, type PickupKind, type PickupRow, weaponFor } from '../src/content/pickups.ts';
import { makeCollected } from '../src/sim/collide.ts';
import { ENEMIES, ENEMY_KINDS, type EnemyKind, type EnemyRow } from '../src/content/enemies.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SPECIAL_BINDINGS } from '../src/content/actions.ts';
import { DEFAULT_ASSISTS, tuningFor } from '../src/sim/assist.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { makeDeaths } from '../src/sim/collide.ts';
import { holdStation, SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { makeIntent } from '../src/sim/intent.ts';
import { makeRng } from '../src/sim/rng.ts';
import { SHIP_START_ALONG, type World } from '../src/app/frame.ts';
import { CAPACITY } from '../src/app/mount.ts';
import type { Intent } from '../src/sim/intent.ts';
import type { Surface } from '../src/render/surface.ts';
import { viewOf } from '../src/sim/camera.ts';

/**
 * A level that never spawns anything and whose boss never arrives.
 *
 * `Infinity` rather than a large number: a fixture that ran long enough to pass a big one would
 * start a boss fight in the middle of an assertion about bullets, and would do it only sometimes.
 */
export const NO_LEVEL: LevelRow = {
  waves: [],
  pickups: [],
  bossAt: Number.POSITIVE_INFINITY,
  boss: 'sentinel',
};

/** The kind-to-index lookup, built the same way `mount.ts` builds it rather than restated. */
export function enemyKindIndices(): Record<EnemyKind, number> {
  const out = {} as Record<EnemyKind, number>;
  ENEMY_KINDS.forEach((k, index) => {
    out[k] = index;
  });
  return out;
}

/**
 * Everything a `World` needs that a collision or interpolation fixture has no opinion about.
 *
 * Spread into a literal, so the fixture still writes out every field it DOES care about — the point
 * is to stop unrelated fields from being restated three times, not to hide the world behind a
 * builder nobody can read.
 */
export function inertLevel(): {
  enemyKinds: Record<EnemyKind, number>;
  level: LevelRow;
  nextWave: number;
  bossRow: typeof BOSSES.sentinel;
  bossPool: Pool<Entity>;
  bossSpawned: boolean;
  bossBeaten: boolean;
  bossPatrol: number;
  onCleared: () => void;
  nextPickup: number;
  pickups: Pool<Entity>;
  pickupRows: readonly PickupRow[];
  pickupKinds: Record<PickupKind, number>;
  pickupCycle: readonly number[];
  pickupFlipped: boolean;
  collected: ReturnType<typeof makeCollected>;
  onPickup: (kind: PickupKind) => void;
  weapon: ReturnType<typeof weaponFor>;
  shownHealth: number;
  onHealth: (health: number) => void;
} {
  return {
    // A fixture has no readout to update; what it needs is a starting value that matches the ship, so
    // the frame does not report a change on its very first step.
    shownHealth: SHIPS.proof.health,
    onHealth: (): void => {},
    // The base weapon, which is what an empty upgrade list resolves to. A fixture that wanted a
    // different one would say so; none does, and none should have to restate the base.
    weapon: weaponFor(SHIPS.proof, []),
    enemyKinds: enemyKindIndices(),
    level: NO_LEVEL,
    nextWave: 0,
    bossRow: BOSSES.sentinel,
    bossPool: new Pool<Entity>(CAPACITY.boss, makeEntity),
    bossSpawned: false,
    bossBeaten: false,
    bossPatrol: 1,
    onCleared: (): void => {},
    ...pickupParts(),
    onPickup: (): void => {},
  };
}

/** The pickup half of a world, built the way `mount.ts` builds it rather than restated. */
export function pickupParts(): {
  pickupCycle: readonly number[];
  pickupFlipped: boolean;
  nextPickup: number;
  pickups: Pool<Entity>;
  pickupRows: readonly PickupRow[];
  pickupKinds: Record<PickupKind, number>;
  collected: ReturnType<typeof makeCollected>;
} {
  const pickupKinds = {} as Record<PickupKind, number>;
  PICKUP_KINDS.forEach((k, index) => {
    pickupKinds[k] = index;
  });
  return {
    pickupCycle: PICKUP_KINDS.map((k) => pickupKinds[CYCLE[k]]!),
    pickupFlipped: false,
    nextPickup: 0,
    pickups: new Pool<Entity>(CAPACITY.pickups, makeEntity),
    pickupRows: PICKUP_KINDS.map((k) => PICKUPS[k]),
    pickupKinds,
    collected: makeCollected(CAPACITY.pickups),
  };
}

/** A surface that draws nothing, so a fixture can drive the real frame with no canvas anywhere. */
class NullSurface implements Surface {
  clear(): void {}
  blit(): void {}
}

/**
 * A whole `World`, composed the way `src/app/mount.ts` composes one, for a level given to it.
 *
 * ⚠️ **This is what makes a boss fight testable at all.** The fight is a state machine spread across
 * `src/app/boss.ts`, the collision pairings and the wave script, and the only honest way to check it
 * is to run it — `docs/decisions/0015-the-layer-ladder.md` says the whole point of keeping the model
 * free of the DOM is that a stage can be played to completion without a browser. This is that claim
 * being cashed.
 *
 * Deaths are counted rather than acted on, and `cleared` records whether the level ever ended.
 */
export function playableWorld(level: LevelRow, difficulty: DifficultyKind = DIFFICULTY_KINDS[0]!): {
  world: World;
  deaths: { count: number };
  cleared: { count: number };
  taken: PickupKind[];
} {
  /*
    ⚠️ **The REAL capacities, imported rather than remembered.** These were hand-written copies, and
    a fixture with a smaller pool than the game cannot see a pool-exhaustion bug — which is precisely
    the bug that reached play as *"two streams continuous and the others stutter"*.
  */
  const shipPool = new Pool<Entity>(CAPACITY.ship, makeEntity);
  const shieldOrbs = new Pool<Entity>(CAPACITY.shieldOrbs, makeEntity);
  const enemies = new Pool<Entity>(CAPACITY.enemies, makeEntity);
  const playerShots = new Pool<Entity>(CAPACITY.playerShots, makeEntity);
  const missiles = new Pool<Entity>(CAPACITY.missiles, makeEntity);
  const bombs = new Pool<Entity>(CAPACITY.bombs, makeEntity);
  const blasts = new Pool<Entity>(CAPACITY.blasts, makeEntity);
  const enemyShots = new Pool<Entity>(CAPACITY.enemyShots, makeEntity);
  const debris = new Pool<Entity>(CAPACITY.debris, makeEntity);
  const bossPool = new Pool<Entity>(CAPACITY.boss, makeEntity);

  const enemyRows: readonly EnemyRow[] = ENEMY_KINDS.map((k) => ENEMIES[k]);
  const shipRow = SHIPS.proof;
  const ship = shipPool.spawn()!;
  reset(ship, SHIP_START_ALONG, ACROSS_SPAN / 2, shipRow);
  holdStation(ship, SCROLL_PER_STEP);

  const deaths = { count: 0 };
  const cleared = { count: 0 };
  const taken: PickupKind[] = [];

  const world: World = {
    layers: [debris, blasts, bossPool, enemies, enemyShots, playerShots, missiles, bombs, shieldOrbs, shipPool],
    shipPool,
    shieldOrbs,
    enemies,
    playerShots,
    missiles,
    bombs,
    blasts,
    onSpecial: (): void => {},
    enemyShots,
    debris,
    deaths: makeDeaths(CAPACITY.enemies),
    burstRng: makeRng('test').stream('burst'),
    view: viewOf(1280, 720),
    surface: new NullSurface(),
    rng: makeRng('test').stream('spawns'),
    cameraAlong: 0,
    prevCameraAlong: 0,
    scrollPerStep: SCROLL_PER_STEP,
    fireIn: shipRow.fireEvery,
    missileIn: shipRow.missileEvery,
    ship,
    shipRow,
    enemyRows,
    enemyKinds: enemyKindIndices(),
    tuning: tuningFor(DEFAULT_ASSISTS),
    input: {
      contribute(intent: Intent): void {
        // A fixture flies nothing. The ship holds station, which is the honest baseline for a
        // question about whether the LEVEL works rather than about whether a hand can survive it.
        intent.along = 0;
        intent.across = 0;
      },
      spend(): void {},
      release(): void {},
    },
    intent: makeIntent(SPECIAL_BINDINGS),
    stepping: true,
    difficulty: DIFFICULTIES[difficulty],
    bossFullHealth: BOSSES.sentinel.health,
    onIdle: (): void => {},
    onTick: (): void => {},
    onDeath: (): void => {
      deaths.count++;
    },
    level,
    nextWave: 0,
    bossRow: BOSSES[level.boss],
    bossPool,
    bossSpawned: false,
    bossBeaten: false,
    bossPatrol: 1,
    onCleared: (): void => {
      cleared.count++;
    },
    ...pickupParts(),
    weapon: weaponFor(shipRow, []),
    shownHealth: shipRow.health,
    onHealth: (): void => {},
    onPickup: (kind: PickupKind): void => {
      taken.push(kind);
    },
  };
  return { world, deaths, cleared, taken };
}
