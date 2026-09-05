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

import type { CueKind } from '../src/content/cues.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS, type DifficultyKind } from '../src/content/difficulty.ts';
import { Pool } from '../src/sim/pool.ts';
import { type Entity, makeEntity, reset } from '../src/sim/entity.ts';
import { BOSSES } from '../src/content/bosses.ts';
import {
  PICKUPS,
  PICKUP_KINDS,
  type PickupKind,
  type PickupRow,
  weaponFor,
} from '../src/content/pickups.ts';
import { makeCollected } from '../src/sim/collide.ts';
import { ENEMIES, ENEMY_KINDS, type EnemyKind, type EnemyRow } from '../src/content/enemies.ts';
import type { LevelRow } from '../src/content/levels.ts';
import type { LevelSections } from '../src/content/music.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SPECIAL_BINDINGS } from '../src/content/actions.ts';
import { DEFAULT_ASSISTS, tuningFor } from '../src/sim/assist.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { makeDeaths } from '../src/sim/collide.ts';
import { holdStation, SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { makeIntent } from '../src/sim/intent.ts';
import { makeRng } from '../src/sim/rng.ts';
import { SHIP_START_ALONG, respawn, type World } from '../src/app/frame.ts';
import { CAPACITY } from '../src/app/mount.ts';
import type { Intent } from '../src/sim/intent.ts';
import type { Surface } from '../src/render/surface.ts';
import { viewOf } from '../src/sim/camera.ts';

/**
 * A music script that opens at `run` and never leaves it — what a fixture with no opinion uses.
 *
 * ⚠️ **`docs/decisions/0158-a-level-says-where-its-sections-open.md` made this a required field**,
 * so every `LevelRow` fixture in the suite now has to say something about the music. This is the
 * *nothing happens* answer, shared so that a fixture about bullets is not also a claim about where a
 * surge opens — the same reasoning as `theme: 'approach'` below.
 *
 * ⚠️ **It is the ONE shape a script may have that the old three constants could not express**: a
 * level that plays one section for its whole length. The seven shipped levels are the seed and are
 * in `src/content/levels.ts`; nothing here is a copy of them.
 */
export const NO_SECTIONS: LevelSections = [{ at: 0, section: 'run' }];

/**
 * A level that never spawns anything and whose boss never arrives.
 *
 * `Infinity` rather than a large number: a fixture that ran long enough to pass a big one would
 * start a boss fight in the middle of an assertion about bullets, and would do it only sometimes.
 */
export const NO_LEVEL: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: Number.POSITIVE_INFINITY,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'sentinel',
  // ⚠️ The theme that changes nothing — 0107. A fixture that leaned on a themed mix would be
  // measuring the theme as well as its own subject, and `approach` is the row authored to be neutral.
  theme: 'approach',
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
  levelOrigin: number;
  levelIndex: number;
  weaponsOffered: number;
  nextWave: number;
  bossRow: typeof BOSSES.sentinel;
  fight: number;
  bossPool: Pool<Entity>;
  bossSpawned: boolean;
  bossBeaten: boolean;
  clearedIn: number;
  bossBurstIn: number;
  bossBurstRadius: number;
  bossOffset: number;
  bossAcross: number;
  bossPatrol: number;
  bossPhaseAt: number;
  bossUncoilAt: number;
  bossFallIn: number;
  chilledFor: number;
  frozenFor: number;
  dyingIn: number;
  deathOffset: number;
  deathAcross: number;
  onWreck: () => void;
  onCleared: () => void;
  nextPickup: number;
  pickups: Pool<Entity>;
  pickupRows: readonly PickupRow[];
  pickupKinds: Record<PickupKind, number>;
  collected: ReturnType<typeof makeCollected>;
  onPickup: (kind: PickupKind) => void;
  weapon: ReturnType<typeof weaponFor>;
  shownHealth: number;
  onHealth: (health: number) => void;
  onCue: (kind: CueKind) => void;
  bound: null;
} {
  return {
    /*
      A fixture draws nothing, so it has no box to mark — `docs/decisions/0074-the-box-is-drawn.md`.
      `null` is the scene that shows none, and it is the honest value here rather than a mark nobody
      blits: `tests/interpolation.test.ts` counts what the painter does, and a bound would add ten
      blits to a scene whose subject is one entity's position.
    */
    bound: null,
    // A collision fixture has no ears. `playableWorld` is the one that records cues, because it is
    // the one that drives whole levels — `docs/decisions/0072-a-cue-is-baked-and-played.md`.
    onCue: (): void => {},
    // A fixture has no readout to update; what it needs is a starting value that matches the ship, so
    // the frame does not report a change on its very first step.
    shownHealth: SHIPS.proof.health,
    onHealth: (): void => {},
    // The base weapon, which is what an empty upgrade list resolves to. A fixture that wanted a
    // different one would say so; none does, and none should have to restate the base.
    weapon: weaponFor(SHIPS.proof, []),
    enemyKinds: enemyKindIndices(),
    level: NO_LEVEL,
    levelOrigin: 0,
    /*
      ⚠️ **The FIRST level and nothing offered, which is the bottom of the difficulty dial** —
      `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`. A fixture is the content as
      authored at its gentlest, on the same terms as `legendary` being the tier that multiplies
      nothing: a collision test that silently ran at dial 11 would be measuring a different game.
    */
    levelIndex: 0,
    weaponsOffered: 0,
    nextWave: 0,
    bossRow: BOSSES.sentinel,
    fight: 1,
    bossPool: new Pool<Entity>(CAPACITY.boss, makeEntity),
    bossSpawned: false,
    bossBeaten: false,
    clearedIn: 0,
    bossBurstIn: 0,
    bossBurstRadius: 0,
    bossOffset: 0,
    bossAcross: ACROSS_SPAN / 2,
    bossPatrol: 1,
    bossPhaseAt: -1,
    bossUncoilAt: 0,
    bossFallIn: 0,
    chilledFor: 0,
    frozenFor: 0,
    // Nothing is dying in a fixture that has not been driven yet — 0079.
    dyingIn: 0,
    deathOffset: SHIP_START_ALONG,
    deathAcross: ACROSS_SPAN / 2,
    // A fixture carries no arsenal, so there is nothing for a wreck to light. `tests/death.test.ts`
    // is what drives the shell's real answer.
    onWreck: (): void => {},
    onCleared: (): void => {},
    ...pickupParts(),
    onPickup: (): void => {},
  };
}

/** The pickup half of a world, built the way `mount.ts` builds it rather than restated. */
export function pickupParts(): {
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
  bolt(): void {}
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
 *
 * ⚠️ **`cues` is a RECORDING and not a speaker**, on the same terms: what a cue is worth belongs to
 * `src/app/sound.ts`, and a fixture that made a noise would be a fixture that needed a browser. This
 * is how `tests/sound.test.ts` asks the real frame *what did the player hear* —
 * `docs/decisions/0072-a-cue-is-baked-and-played.md`.
 */
export function playableWorld(level: LevelRow, difficulty: DifficultyKind = DIFFICULTY_KINDS[0]!): {
  world: World;
  deaths: { count: number };
  wrecks: { count: number };
  cleared: { count: number };
  taken: PickupKind[];
  /** The face each taken pickup was showing, beside `taken` — 0233. */
  faces: number[];
  cues: CueKind[];
} {
  /*
    ⚠️ **The REAL capacities, imported rather than remembered.** These were hand-written copies, and
    a fixture with a smaller pool than the game cannot see a pool-exhaustion bug — which is precisely
    the bug that reached play as *"two streams continuous and the others stutter"*.
  */
  const shipPool = new Pool<Entity>(CAPACITY.ship, makeEntity);
  const shieldOrbs = new Pool<Entity>(CAPACITY.shieldOrbs, makeEntity);
  const exhaust = new Pool<Entity>(CAPACITY.exhaust, makeEntity);
  const enemies = new Pool<Entity>(CAPACITY.enemies, makeEntity);
  const playerShots = new Pool<Entity>(CAPACITY.playerShots, makeEntity);
  const missiles = new Pool<Entity>(CAPACITY.missiles, makeEntity);
  const bolts = new Pool<Entity>(CAPACITY.bolts, makeEntity);
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
  const wrecks = { count: 0 };
  const cleared = { count: 0 };
  const taken: PickupKind[] = [];
  const faces: number[] = [];
  const cues: CueKind[] = [];

  const world: World = {
    // The game's own order — `src/app/mount.ts` — with the pickups left out, because this fixture has none.
    layers: [blasts, bossPool, enemies, debris, enemyShots, playerShots, missiles, bombs, bolts, exhaust, shieldOrbs, shipPool],
    sky: [],
    landmarks: [],
    bound: null,
    shipPool,
    shieldOrbs,
    exhaust,
    enemies,
    playerShots,
    missiles,
    bolts,
    bombs,
    blasts,
    onSpecial: (): void => {},
    enemyShots,
    debris,
    deaths: makeDeaths(CAPACITY.enemies),
    hits: makeDeaths(CAPACITY.missiles),
    burstRng: makeRng('test').stream('burst'),
    scatterRng: makeRng('test').stream('scatter'),
    arcRng: makeRng('test').stream('arc'),
    rainRng: makeRng('test').stream('rain'),
    rockRng: makeRng('test').stream('rock'),
    view: viewOf(1280, 720),
    surface: new NullSurface(),
    rng: makeRng('test').stream('spawns'),
    steps: 0,
    cameraAlong: 0,
    prevCameraAlong: 0,
    scrollPerStep: SCROLL_PER_STEP,
    // 0093 took the two cadence numbers off `ShipRow`; the base weapon is the empty list.
    fireIn: weaponFor(shipRow, []).fireEvery,
    missileIn: weaponFor(shipRow, []).missileEvery,
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
    /*
      ⚠️ **IT PUTS THE SHIP BACK, and it did not have to until the death became a beat.** 0079
      releases the ship from its pool for `DEATH_STEPS` and `respawn` is what returns it — so a
      fixture that only counted would fly the rest of a three-minute boss fight with no ship at all,
      which is not a fixture failing, it is a fixture measuring nothing. Four of them did exactly
      that on the first run of this change.

      ⚠️ **It is the SHELL's answer, deliberately** — `src/app/mount.ts` calls `respawn` on every
      death the run survives, and a fixture that answered differently is the divergence
      `docs/decisions/0067-a-new-run-opens-on-an-empty-field.md`'s post-mortem is about. What is
      missing here is the run: a fixture has no lives to spend, so every death is one the run
      survives.
    */
    onDeath: (): void => {
      deaths.count++;
      respawn(world);
    },
    level,
    levelOrigin: 0,
    levelIndex: 0,
    weaponsOffered: 0,
    nextWave: 0,
    // The mid-boss's fight first where the level has one — 0247, exactly as `beginRun` sets it.
    bossRow: BOSSES[level.midBoss === null ? level.boss : level.midBoss.kind],
    fight: level.midBoss === null ? 1 : 0,
    bossPool,
    bossSpawned: false,
    bossBeaten: false,
    clearedIn: 0,
    bossBurstIn: 0,
    bossBurstRadius: 0,
    bossOffset: 0,
    bossAcross: ACROSS_SPAN / 2,
    bossPatrol: 1,
    bossPhaseAt: -1,
    bossUncoilAt: 0,
    bossFallIn: 0,
    chilledFor: 0,
    frozenFor: 0,
    dyingIn: 0,
    deathOffset: SHIP_START_ALONG,
    deathAcross: ACROSS_SPAN / 2,
    // Counted rather than acted on, exactly as `onDeath` is — the two are `DEATH_STEPS` apart and a
    // fixture that wants to know a death was DRAWN asks this one. 0079.
    onWreck: (): void => {
      wrecks.count++;
    },
    onCleared: (): void => {
      cleared.count++;
    },
    ...pickupParts(),
    weapon: weaponFor(shipRow, []),
    shownHealth: shipRow.health,
    onHealth: (): void => {},
    onPickup: (kind: PickupKind, face: number): void => {
      taken.push(kind);
      faces.push(face);
    },
    onCue: (kind: CueKind): void => {
      cues.push(kind);
    },
  };
  return { world, deaths, wrecks, cleared, taken, faces, cues };
}
