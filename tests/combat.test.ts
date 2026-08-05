/**
 * Bullets, contact, and the numbers a tuning pass is about to move.
 *
 * See `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
 *
 * ── WHAT THIS FILE MAY AND MAY NOT ASSERT ───────────────────────────────────────────────────────
 *
 * ⚠️ **Nothing here asserts a tuning VALUE.** `SHIP_SPEED`, `SCROLL_PER_STEP`, every speed in
 * `src/content/shots.ts` and every health in `src/content/enemies.ts` are starting points, and
 * `reports/drag-feel-2026-08-05.md` names the pass that will move them.
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` refuses a guard on an unvalidated
 * threshold precisely so that pass does not have to fight the suite: *"a guard built on an
 * unvalidated threshold defends the bug."*
 *
 * What it asserts instead are the RELATIONSHIPS that have to hold at any value — a shot cannot step
 * over its target, an assist cannot make the game harder, an aimed shot must be dodgeable at all —
 * and it states the first of those in the units a player experiences rather than in the code's own.
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { ACROSS_SPAN, spawnAlong, viewOf } from '../src/sim/camera.ts';
import { ASSIST_LADDER, DEFAULT_ASSISTS, type Assists, tuningFor } from '../src/sim/assist.ts';
import { collideInto, collideIntoOne, overlaps } from '../src/sim/collide.ts';
import { type Entity, makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { SCROLL_PER_STEP, SHIP_SPEED } from '../src/sim/flight.ts';
import { makeIntent, type Intent } from '../src/sim/intent.ts';
import { Pool } from '../src/sim/pool.ts';
import { makeRng } from '../src/sim/rng.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { INVULN_STEPS, SHIPS } from '../src/content/ships.ts';
import { SHOT_KINDS, SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { GameFrame, SHIP_START_ALONG, type World } from '../src/app/frame.ts';
import { STEP_MS } from '../src/app/loop.ts';
import type { InputSource } from '../src/app/input.ts';
import type { Surface } from '../src/render/surface.ts';
import { paintScene } from '../src/render/scene.ts';
import { bodyOf } from './bodies.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/*
  ⚠️ Steps become milliseconds through `STEP_MS` and never through a `60` written here. This file
  opened with `const HZ = 60`, which is the second description of a fact `src/app/loop.ts` already
  owns — and it is the second description that would go on reporting confident millisecond figures
  after the first one moved. `tests/one-description.test.ts` is the register for facts with enough
  describers to need one; this had two, and the cheaper answer to two is to use the home.
*/

/** A reference landscape phone — the device `reports/drag-feel-2026-08-05.md` was played on. */
const VIEWPORT = { width: 844, height: 390 };

const NEVER = 1_000_000;

/** Steps of hit flash the tests below hand to a collision. Any positive number; nothing asserts it. */
const FLASH = 8;

// ── THE RULE THAT KEEPS THE TUNING ORDER MEANINGFUL ──────────────────────────────────────────────

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/.*$/gm, ' ');
}

function contentFiles(): string[] {
  return readdirSync(resolve(root, 'src/content')).filter((f) => f.endsWith('.ts')).map((f) => `src/content/${f}`);
}

describe('a threat is authored in absolute units, never as a multiple of the ship', () => {
  /*
    ⚠️ THIS IS THE GUARD FOR A TRAP, NOT FOR A BUG THAT HAPPENED.

    `reports/drag-feel-2026-08-05.md` says bullet speed, enemy approach and the dodge window are
    "all relative to how fast the player can get out of the way". That is a statement about the
    ORDER they get tuned in — settle `SHIP_SPEED` first, then everything downstream — and it reads
    exactly like an instruction to write them as ratios.

    Written as ratios they would be invariant under the very knob the pass exists to turn: raising
    `SHIP_SPEED` would raise every threat by the same factor, the dodge margin would not move, and
    the knob would quietly become a global tempo control instead of the distance budget it is.

    An arithmetic ratio cannot be detected. A DEPENDENCY can, and it is the same thing: a table that
    tracks the ship's speed has to name the ship's speed.
  */
  const BANNED = /\bSHIP_SPEED\b|\bSCROLL_PER_STEP\b/;

  it('no content table names the ship constants', () => {
    const offenders = contentFiles().filter((f) => BANNED.test(stripComments(read(f))));
    expect(
      offenders,
      `these express a threat relative to the ship: ${offenders.join(', ')}\n` +
        'Write the number in world units per step. The dodge margin has to be a thing SHIP_SPEED can ' +
        'change, or the first tuning pass measures a knob that has been wired to nothing.',
    ).toEqual([]);
  });

  it('and the scan can tell prose from code, so it is not passing on a technicality', () => {
    // The rule is EXPLAINED in `src/content/shots.ts`, by name, in a doc comment. A scanner that
    // read the raw file would flag the file that documents the rule and nothing else.
    expect(BANNED.test(read('src/content/shots.ts')), 'the rule is not named in the prose any more').toBe(true);
    expect(BANNED.test('const speed = SHIP_SPEED * 2;')).toBe(true);
    expect(BANNED.test(stripComments('// twice SHIP_SPEED\nconst speed = 3.4;'))).toBe(false);
  });
});

// ── THE BOUNDS THAT MAKE A HIT POSSIBLE AT ALL ───────────────────────────────────────────────────

describe('a shot cannot step over the thing it was fired at', () => {
  /** A shot at `from`, moving `speed` a step, and a target sitting at 100. One step, then contact. */
  function oneStepAt(from: number, across: number, speed: number): { hit: boolean; health: number } {
    const shots = new Pool<Entity>(1, makeEntity);
    const targets = new Pool<Entity>(1, makeEntity);
    const target = targets.spawn()!;
    reset(target, 100, 50, bodyOf(SPRITE.drifter, 2, 2, 0));
    const shot = shots.spawn()!;
    reset(shot, from, across, bodyOf(SPRITE.bullet, 0.9, 1, 1));
    shot.velAlong = speed;
    stepEntities(shots, 0);
    stepEntities(targets, 0);
    const destroyed = collideInto(shots, targets, 1, 1, FLASH);
    return { hit: destroyed > 0 || target.health < 2, health: target.health };
  }

  it('THE SWEEP: a shot that crosses the whole target in one step still hits it', () => {
    /*
      90 → 110 in a single step, over a target at 100 whose reach is 2.9. Every frame the collision
      could look at has the shot on one side or the other, and testing the two current positions
      reports a clean miss.

      ⚠️ This is the test that buys `src/content/shots.ts` its freedom to be tuned. Without the sweep
      the alternative is a ceiling on every shot speed of about `reach − SHIP_SPEED`, standing in
      front of the constant the next pass is supposed to raise.
    */
    expect(oneStepAt(90, 50, 20).hit, 'the shot passed clean through — the sweep is not sweeping').toBe(true);
  });

  it('and a shot that passes WIDE still misses, so the sweep is not simply always true', () => {
    // The control. A sweep that returned true for anything moving would pass the test above and
    // would make every bullet in the game a hit.
    expect(oneStepAt(90, 20, 20).hit, 'a shot 30 units off the lane registered as a hit').toBe(false);
  });

  it('and a shot already touching at the end of its step still hits, as it always did', () => {
    // At the end of the step the closest approach is the step's end, which is the old test exactly.
    // A sweep that only ever looked mid-step would drop the ordinary case.
    expect(oneStepAt(99, 50, 1).hit).toBe(true);
  });
});

describe('a hurtbox is smaller than the art and not very much smaller', () => {
  it('every body sits inside the band', () => {
    /*
      Two complaints, one number between them. A hurtbox as big as the sprite kills the player with
      the wing they read as decoration; a hurtbox far smaller than the sprite eats shots that
      visibly connected. Neither is detectable from the model — both are reports about the picture,
      which is `docs/decisions/0027-measure-the-picture-not-the-model.md`'s subject — so what is held
      here is that the two numbers stay related at all.

      ⚠️ The band is deliberately wide. It is not a claim about what feels fair; it is a claim that
      the drawn size and the hit size cannot drift apart without somebody saying so.
    */
    /*
      Extent looked up through the row's OWN sprite rather than named per family by hand.

      ⚠️ It used to read `SPRITE_EXTENT.enemy` for every enemy, which stopped compiling the moment
      each enemy kind got its own silhouette — and would silently have measured the wrong sprite if
      the two had happened to share a name. Going through `row.sprite` means a new kind is covered by
      this the day it is added, without anybody remembering to extend a list.
    */
    const extentOf: number[] = [];
    for (const k of SPRITE_KINDS) extentOf[SPRITE[k]] = SPRITE_EXTENT[k];

    const bodies: [string, number, number][] = [
      ['ship', SHIPS.proof.radius, extentOf[SHIPS.proof.sprite]!],
      ...ENEMY_KINDS.map((k): [string, number, number] => [k, ENEMIES[k].radius, extentOf[ENEMIES[k].sprite]!]),
      ...SHOT_KINDS.map((k): [string, number, number] => [k, SHOTS[k].radius, extentOf[SHOTS[k].sprite]!]),
    ];
    for (const [name, radius, extent] of bodies) {
      const fraction = radius / extent;
      expect(fraction, `${name}'s hurtbox is larger than what is drawn`).toBeLessThanOrEqual(0.55);
      expect(fraction, `${name}'s hurtbox is so much smaller than its sprite that hits will look wrong`)
        .toBeGreaterThanOrEqual(0.25);
    }
  });
});

// ── THE PAIRINGS ─────────────────────────────────────────────────────────────────────────────────

describe('who can hit whom is the caller’s decision, and it is the whole guard', () => {
  function twoPools(): { shots: Pool<Entity>; targets: Pool<Entity> } {
    return { shots: new Pool<Entity>(4, makeEntity), targets: new Pool<Entity>(4, makeEntity) };
  }

  it('a shot is spent by arriving, and a target that runs out of health is retired', () => {
    const { shots, targets } = twoPools();
    const target = targets.spawn()!;
    reset(target, 100, 50, bodyOf(SPRITE.drifter, 2.6, 2, 2));
    for (let i = 0; i < 2; i++) {
      const shot = shots.spawn()!;
      reset(shot, 100, 50, bodyOf(SPRITE.bullet, 0.9, 1, 1));
    }
    expect(collideInto(shots, targets, 1, 1, FLASH), 'two hits on two health did not destroy it').toBe(1);
    expect(shots.size, 'a shot survived arriving').toBe(0);
    expect(targets.size).toBe(0);
  });

  it('a miss costs nothing on either side', () => {
    const { shots, targets } = twoPools();
    const target = targets.spawn()!;
    reset(target, 100, 50, bodyOf(SPRITE.drifter, 2.6, 2, 2));
    const shot = shots.spawn()!;
    reset(shot, 100, 90, bodyOf(SPRITE.bullet, 0.9, 1, 1));
    expect(collideInto(shots, targets, 1, 1, FLASH)).toBe(0);
    expect(shots.size).toBe(1);
    expect(target.health).toBe(2);
  });

  it('every target is tested, not merely the last one released', () => {
    // THE REORDERING TRAP, on the collision side. `releaseAt` swaps the tail into the hole, so a
    // forward walk skips an entity — about half of them survive a pass they should not have.
    const shots = new Pool<Entity>(8, makeEntity);
    const targets = new Pool<Entity>(8, makeEntity);
    for (let i = 0; i < 8; i++) {
      const t = targets.spawn()!;
      reset(t, 100 + i * 20, 50, bodyOf(SPRITE.drifter, 2.6, 1, 2));
      const s = shots.spawn()!;
      reset(s, 100 + i * 20, 50, bodyOf(SPRITE.bullet, 0.9, 1, 1));
    }
    expect(collideInto(shots, targets, 1, 1, FLASH), 'a pass over eight overlapping pairs missed some').toBe(8);
    expect(targets.size).toBe(0);
    expect(shots.size).toBe(0);
  });

  it('a body is not consumed by being flown into, or ramming would clear the screen', () => {
    const enemies = new Pool<Entity>(1, makeEntity);
    const enemy = enemies.spawn()!;
    reset(enemy, 100, 50, bodyOf(SPRITE.drifter, 2.6, 2, 2));
    const ship = makeEntity();
    reset(ship, 100, 50, SHIPS.proof);
    expect(collideIntoOne(enemies, ship, 1, 1, INVULN_STEPS, INVULN_STEPS, false)).toBe(2);
    expect(enemies.size, 'the enemy died of being touched').toBe(1);
  });
});

describe('health is a number of hits and not a number of steps', () => {
  it('a ship parked inside a volley loses one health, not one per step', () => {
    /*
      ⚠️ The bug this stands for reads as dying at full health. An overlapping threat bills the
      player sixty times a second, so five health is gone in a twelfth of a second and the player
      never sees the second hit happen — a bug report about collision that is really invulnerability
      missing. `src/content/ships.ts` holds the number of steps.
    */
    const enemies = new Pool<Entity>(1, makeEntity);
    const enemy = enemies.spawn()!;
    reset(enemy, 100, 50, bodyOf(SPRITE.drifter, 2.6, 99, 1));
    const ship = makeEntity();
    reset(ship, 100, 50, SHIPS.proof);

    const start = ship.health;
    for (let step = 0; step < INVULN_STEPS; step++) {
      collideIntoOne(enemies, ship, 1, 1, INVULN_STEPS, INVULN_STEPS, false);
      if (ship.invulnFor > 0) ship.invulnFor--;
    }
    expect(start - ship.health, 'the ship was billed per step rather than per hit').toBe(1);
  });

  it('and the flashing ends, so the ship is not permanently safe', () => {
    const enemies = new Pool<Entity>(1, makeEntity);
    const enemy = enemies.spawn()!;
    reset(enemy, 100, 50, bodyOf(SPRITE.drifter, 2.6, 99, 1));
    const ship = makeEntity();
    reset(ship, 100, 50, SHIPS.proof);

    let hits = 0;
    for (let step = 0; step < INVULN_STEPS * 3; step++) {
      if (collideIntoOne(enemies, ship, 1, 1, INVULN_STEPS, INVULN_STEPS, false) > 0) hits++;
      if (ship.invulnFor > 0) ship.invulnFor--;
    }
    expect(hits, 'invulnerability never expired — the ship is immortal').toBeGreaterThan(1);
  });
});

// ── THE ASSISTS, NOW THAT SOMETHING ACTUALLY READS THEM ──────────────────────────────────────────

/** Every combination of assists. 144 states — the same space `tests/assist.test.ts` walks. */
function everyAssist(): Assists[] {
  let out: Assists[] = [{ ...DEFAULT_ASSISTS }];
  for (const knob of Object.keys(ASSIST_LADDER) as (keyof Assists)[]) {
    const grown: Assists[] = [];
    for (const base of out) {
      for (const value of ASSIST_LADDER[knob]) grown.push({ ...base, [knob]: value } as Assists);
    }
    out = grown;
  }
  return out;
}

/** Where each knob sits on its ladder, so "more assisted" is a comparison rather than a judgement. */
function rung(assists: Assists, knob: keyof Assists): number {
  return (ASSIST_LADDER[knob] as readonly string[]).indexOf(assists[knob]);
}

/**
 * Damage the ship takes from a fixed, identical scenario under one set of assists.
 *
 * ⚠️ **The placement is the whole test and it took two goes to get right.** The first version put
 * both threats deep inside both hurtboxes, so shrinking the player's circle removed neither and a
 * first-one-found implementation scored identically to a worst-of-the-set one. It proved nothing and
 * went green.
 *
 * What discriminates them: a LIGHT threat that only the exact hurtbox reaches, found FIRST, and a
 * HEAVY one that both reach. Take the first and the exact hurtbox scores 1 while the forgiving one
 * skips past it to score 3 — an assist that makes the game harder. Take the worst of the set and
 * both score 3, because the set only ever shrinks.
 *
 * `collideIntoOne` walks backwards, so "found first" is the one spawned LAST.
 */
function damageUnder(assists: Assists): number {
  const tuning = tuningFor(assists);
  const threats = new Pool<Entity>(4, makeEntity);
  const ship = makeEntity();
  reset(ship, 100, 50, SHIPS.proof);
  // Inside both circles: reach is 2.6 + 2 exact, 2.6 + 1.4 forgiving, against a distance of 1.
  const heavy = threats.spawn()!;
  reset(heavy, 101, 50, bodyOf(SPRITE.drifter, 2.6, 1, 3));
  // Inside the exact circle only: reach is 0.9 + 2 exact, 0.9 + 1.4 forgiving, at a distance of 2.6.
  const light = threats.spawn()!;
  reset(light, 102.6, 50, bodyOf(SPRITE.bullet, 0.9, 1, 1));
  return collideIntoOne(threats, ship, tuning.hurtbox, tuning.playerDamage, INVULN_STEPS, INVULN_STEPS, false);
}

describe('no assist makes the game harder, and now that is a claim about the CODE', () => {
  /*
    ⚠️ `tests/assist.test.ts` proves the lookup TABLE is monotone over all 144 states. Until this
    change nothing read the table, so that proof was about arithmetic and not about the game.
    Collision is the first consumer — `hurtbox` scales the player's circle and `playerDamage` scales
    what lands — and monotonicity is now a property that code can break.

    It nearly was broken here: the obvious `collideIntoOne` damages on the FIRST overlap and stops,
    and shrinking a hurtbox changes which overlap is first. `src/sim/collide.ts` takes the worst of
    the set instead, so the result is a function of a set that only ever shrinks.
  */
  it('turning any knob up never increases the damage taken', () => {
    const states = everyAssist();
    const damage = new Map<string, number>();
    for (const a of states) damage.set(JSON.stringify(a), damageUnder(a));

    const knobs = Object.keys(ASSIST_LADDER) as (keyof Assists)[];
    const failures: string[] = [];
    for (const less of states) {
      for (const more of states) {
        if (!knobs.every((k) => rung(more, k) >= rung(less, k))) continue;
        const a = damage.get(JSON.stringify(less))!;
        const b = damage.get(JSON.stringify(more))!;
        if (b > a) failures.push(`${JSON.stringify(more)} took ${b}, ${JSON.stringify(less)} took ${a}`);
      }
    }
    expect(failures.slice(0, 3), 'a more-assisted setting took MORE damage').toEqual([]);
  });

  it('and the assists are not simply being ignored, which would also be monotone', () => {
    // The control. A `collideIntoOne` that never read its arguments would pass the test above
    // perfectly, because a constant is monotone.
    const most: Assists = { pace: 'gentle', resilience: 'proof', hurtbox: 'forgiving', terrain: 'solid', specials: 'auto', flight: 'assisted' };
    expect(damageUnder(DEFAULT_ASSISTS), 'the default game deals no damage at all').toBeGreaterThan(0);
    expect(damageUnder(most), 'the full assist ladder changed nothing').toBe(0);
  });

  it('a smaller hurtbox refuses a contact the default accepts', () => {
    // `resilience: proof` zeroes damage, which would hide a `hurtbox` that did nothing. This isolates
    // the radius: same damage multiplier, same threat, placed to fall between the two circles.
    const threats = new Pool<Entity>(1, makeEntity);
    const grazing = threats.spawn()!;
    const ship = makeEntity();
    reset(ship, 100, 50, SHIPS.proof);
    const exact = tuningFor(DEFAULT_ASSISTS).hurtbox;
    const forgiving = tuningFor({ ...DEFAULT_ASSISTS, hurtbox: 'forgiving' }).hurtbox;
    expect(forgiving, 'the forgiving hurtbox is not actually smaller').toBeLessThan(exact);

    // Just inside the exact circle, outside the forgiving one.
    const between = (SHIPS.proof.radius * exact + SHIPS.proof.radius * forgiving) / 2 + 0.9;
    reset(grazing, 100 + between, 50, bodyOf(SPRITE.bullet, 0.9, 1, 1));
    expect(overlaps(grazing, ship, exact), 'the graze is not inside the exact hurtbox').toBe(true);
    expect(overlaps(grazing, ship, forgiving), 'the forgiving hurtbox did not refuse it').toBe(false);
  });
});

// ── THE PICTURE, IN THE UNITS A PLAYER HAS ───────────────────────────────────────────────────────

/** An input source that asks for the same thing every step. */
function holding(across: number): InputSource {
  return {
    contribute(intent: Intent): void {
      intent.along = 0;
      intent.across = across;
    },
    release(): void {},
  };
}

/** A surface that draws nothing. The dodge is a model question; the units it is reported in are not. */
const BLIND: Surface = { clear(): void {}, blit(): void {} };

/**
 * The proof scene with one lancer, placed `distance` units ahead of the ship and `lane` units off
 * its line, told to fire on the next step. Nothing else spawns and the ship does not shoot back.
 */
function aimedAtTheShip(distance: number, input: InputSource, lane = 0): { world: World; frame: GameFrame } {
  const shipPool = new Pool<Entity>(1, makeEntity);
  const enemies = new Pool<Entity>(1, makeEntity);
  const playerShots = new Pool<Entity>(4, makeEntity);
  const enemyShots = new Pool<Entity>(4, makeEntity);
  const shipRow = { ...SHIPS.proof, fireEvery: NEVER };
  const ship = shipPool.spawn()!;
  reset(ship, SHIP_START_ALONG, ACROSS_SPAN / 2, shipRow);
  ship.velAlong = SCROLL_PER_STEP;

  const lancer = enemies.spawn()!;
  reset(lancer, SHIP_START_ALONG + distance, ACROSS_SPAN / 2 - lane, ENEMIES.lancer, ENEMY_KINDS.indexOf('lancer'));
  lancer.velAlong = -ENEMIES.lancer.closing;
  lancer.fireIn = 1;

  const world: World = {
    layers: [enemies, enemyShots, playerShots, shipPool],
    shipPool,
    enemies,
    playerShots,
    enemyShots,
    view: viewOf(VIEWPORT.width, VIEWPORT.height),
    surface: BLIND,
    rng: makeRng('combat').stream('spawns'),
    cameraAlong: 0,
    prevCameraAlong: 0,
    scrollPerStep: SCROLL_PER_STEP,
    spawnIn: NEVER,
    fireIn: NEVER,
    ship,
    shipRow,
    enemyRows: ENEMY_KINDS.map((k) => ENEMIES[k]),
    tuning: tuningFor(DEFAULT_ASSISTS),
    input,
    intent: makeIntent(2),
  };
  return { world, frame: new GameFrame(world) };
}

/** Steps until the ship first loses health, or `null` if it never does inside `limit`. */
function stepsUntilHit(frame: GameFrame, world: World, limit: number): number | null {
  const start = world.ship.health;
  for (let step = 1; step <= limit; step++) {
    frame.step();
    if (world.ship.health < start) return step;
  }
  return null;
}

describe('an aimed shot arrives, and a player who moves is not there when it does', () => {
  /*
    ⚠️ **THE ASSERTION IN THE UNITS THE PLAYER EXPERIENCES**, which
    `docs/decisions/0027-measure-the-picture-not-the-model.md` requires at least one of.

    Everything above this line is in world units and steps — the code's own vocabulary, in which a
    guard can be perfectly self-consistent and still measure nothing. Twelve drag assertions were
    green while touch shipped needing five metres of thumb, because "N pixels produce an ask of 1"
    holds at any conversion factor.

    So this one is stated in MILLISECONDS and PIXELS, on a real viewport, and it is not a threshold
    on taste: it says the dodge is possible at all. A shot aimed at where the ship is must be
    escapable by a player who reacts — if it is not, the game is unfair at every tuning of every
    constant, and no amount of turning `SHIP_SPEED` fixes it.
  */
  const DISTANCE = 80;
  const LIMIT = 600;

  it('a stationary ship is hit, and the window is a number of milliseconds', () => {
    const still = aimedAtTheShip(DISTANCE, holding(0));
    const steps = stepsUntilHit(still.frame, still.world, LIMIT);
    expect(steps, 'the aimed shot never arrived — this scenario measures nothing').not.toBe(null);

    const windowMs = steps! * STEP_MS;
    // Not a threshold on how it feels. A window of a single frame would mean the shot was already
    // touching when it was fired, and the whole scenario would be measuring a spawn overlap.
    expect(windowMs, 'the shot arrived in under a frame — it was fired on top of the ship').toBeGreaterThan(STEP_MS);
    expect(windowMs, 'the shot took over ten seconds to cross 80 units').toBeLessThan(10_000);
  });

  it('THE ONE: the same shot misses a ship that moved, and the room it needed is a few pixels', () => {
    const still = aimedAtTheShip(DISTANCE, holding(0));
    const steps = stepsUntilHit(still.frame, still.world, LIMIT)!;

    const view = viewOf(VIEWPORT.width, VIEWPORT.height);
    /** How far across the ship can travel before the shot arrives, in CSS pixels. */
    const roomPx = SHIP_SPEED * steps * view.scale;
    /** How far it has to travel to be out of the way, in CSS pixels. */
    const clearancePx = (SHIPS.proof.radius + SHOTS.spit.radius) * view.scale;

    expect(
      roomPx,
      `a shot aimed from ${DISTANCE} units away gives ${(steps * STEP_MS).toFixed(0)}ms, in which the ` +
        `ship covers ${roomPx.toFixed(1)}px and needs ${clearancePx.toFixed(1)}px to clear it. ` +
        'At these numbers the shot cannot be dodged, whatever else is tuned.',
    ).toBeGreaterThan(clearancePx);

    /*
      And the arithmetic above is not the claim — this is. Same scenario, same shot, player moving.

      ⚠️ The window is THAT shot's flight and a few steps past it, not the whole run. The lancer
      reloads, and by then the dodging ship is pinned against the far wall with a lancer almost on
      top of it — which it is right to be hit by, and which says nothing about whether the first shot
      was dodgeable. Running to `LIMIT` here asserted "the player is never hit again", which is a
      claim about the level and not about the dodge.
    */
    const dodging = aimedAtTheShip(DISTANCE, holding(1));
    expect(
      stepsUntilHit(dodging.frame, dodging.world, steps + 5),
      'the ship moved the whole time and the aimed shot found it anyway',
    ).toBe(null);
  });

  it('THE FRAME: a shot from off the ship’s line arrives, rather than where the ship used to be', () => {
    /*
      ⚠️ **THE BUG THE INSTRUMENT FOUND, kept as a guard.** Eight seconds of the real page traced
      fine and the ship was never hit, because a shot aimed in WORLD coordinates leaves for where the
      ship is and arrives where the ship was — the ship holds station in the CAMERA's frame, so it
      drifts a full `scrollPerStep` up-lane for every step the shot is in the air. Straight down the
      lane it still connected, which is why the in-lane case above cannot see this at all; off the
      lane it missed by a margin that grew with range, so every enemy in the game was harmless in
      proportion to how far away it was.

      Nothing was wrong with the aim, the collision or the picture. Each was correct in a different
      frame. `src/app/frame.ts` says what the fix is and why it leads only the drift.
    */
    const offLane = aimedAtTheShip(160, holding(0), 30);
    const hitAt = stepsUntilHit(offLane.frame, offLane.world, 200);
    expect(
      hitAt,
      'an aimed shot from 30 units off the lane never arrived — it was aimed in the wrong frame',
    ).not.toBe(null);
  });
});

// ── A HIT THAT CHANGES NOTHING ON SCREEN READS AS A BUG, AND WAS REPORTED AS ONE ────────────────

describe('damage is legible on the body that took it', () => {
  /*
    ⚠️ **THE PLAY-TEST FINDING**, `reports/combat-legibility-2026-08-05.md`:
    *"I legit thought it was a bug for a bit that bullets hit an enemy and the enemy didn't get
    destroyed."*

    Every enemy shipped with two health and no damage feedback, so the FIRST shot to land on
    anything in the game removed a bullet and changed nothing else. That is pixel-for-pixel what a
    shot passing straight through looks like. The model was right, every assertion was green, and the
    picture was reporting a collision failure that had not happened —
    `docs/decisions/0027-measure-the-picture-not-the-model.md` again, from the feedback side.
  */
  function hitOnce(body: ReturnType<typeof bodyOf>): Entity {
    const shots = new Pool<Entity>(1, makeEntity);
    const targets = new Pool<Entity>(1, makeEntity);
    const target = targets.spawn()!;
    reset(target, 100, 50, body);
    const shot = shots.spawn()!;
    reset(shot, 100, 50, bodyOf(SPRITE.bullet, 0.9, 1, 1));
    collideInto(shots, targets, 1, 1, FLASH);
    return target;
  }

  it('THE ONE: a survivor is drawn differently on the step it is hit', () => {
    const survivor = hitOnce(bodyOf(SPRITE.lancer, 2.6, 2, 2, SPRITE.lancerHit));
    expect(survivor.health, 'this scenario is meant to leave the target alive').toBeGreaterThan(0);
    const pool = new Pool<Entity>(1, makeEntity);
    const drawn = pool.spawn()!;
    reset(drawn, 100, 50, bodyOf(SPRITE.lancer, 2.6, 2, 2, SPRITE.lancerHit));
    drawn.flashFor = survivor.flashFor;
    stepEntities(pool, 0);
    expect(drawn.sprite, 'the enemy survived a hit and is drawn exactly as it was before it').toBe(SPRITE.lancerHit);
  });

  it('and goes back to itself afterwards, so the flash is an event and not a state', () => {
    const pool = new Pool<Entity>(1, makeEntity);
    const e = pool.spawn()!;
    reset(e, 100, 50, bodyOf(SPRITE.lancer, 2.6, 2, 2, SPRITE.lancerHit));
    e.flashFor = FLASH;
    for (let step = 0; step <= FLASH; step++) stepEntities(pool, 0);
    expect(e.sprite, 'the enemy never stopped flashing — it has simply changed colour').toBe(SPRITE.lancer);
  });

  it('a shot never flashes, because it does not survive being one', () => {
    // Not a special case in the code, and worth pinning as a consequence rather than a rule: a shot
    // has one health, so `collideInto` releases it rather than reaching the flash at all.
    for (const kind of SHOT_KINDS) {
      expect(SHOTS[kind].health, `${kind} survives a hit, which would need a hit sprite of its own`).toBe(1);
    }
  });

  it('every enemy kind has a hit sprite that is not its ordinary one', () => {
    // The compile-forced half is that `spriteHit` exists. This is the half a `Record` cannot hold:
    // that somebody filled it in with a DIFFERENT bitmap rather than the same one twice.
    for (const kind of ENEMY_KINDS) {
      expect(ENEMIES[kind].spriteHit, `${kind} flashes to the sprite it already was`).not.toBe(ENEMIES[kind].sprite);
    }
    expect(SHIPS.proof.spriteHit).not.toBe(SHIPS.proof.sprite);
  });
});

describe('an enemy kind is told apart by its silhouette, not by its colour', () => {
  it('no two enemy kinds share a sprite', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *colour never carries meaning
      alone* in the unconditional tier, so shape is the channel that has to carry which enemy this
      is. `drifter` and `lancer` shipped as the same diamond — one closes and shoots where the ship
      is, the other cannot do either, and a player had no way to tell which was which.
    */
    const seen = new Map<number, string>();
    for (const kind of ENEMY_KINDS) {
      const other = seen.get(ENEMIES[kind].sprite);
      expect(other, `${kind} and ${other} are drawn as the same shape`).toBeUndefined();
      seen.set(ENEMIES[kind].sprite, kind);
    }
  });

  it('and the ink alone would not be enough, which is why the shapes differ', () => {
    // Every enemy is drawn in the same ink by design — they are all enemies. That is exactly why the
    // silhouette has to do the work, and it is why this file checks sprites rather than colours.
    expect(ENEMY_KINDS.length, 'there is only one enemy kind, so this guard is not yet load-bearing')
      .toBeGreaterThan(1);
  });
});

// ── DRAW ORDER, WHICH USED TO BE WHATEVER THE POOL HAPPENED TO CONTAIN ──────────────────────────

describe('layers are drawn in the order they are given', () => {
  it('a later layer is blitted after an earlier one, every entity of it', () => {
    /*
      The painter used to take one pool, so draw order was a property of that pool's packing — and
      `src/sim/pool.ts` warns that releasing REORDERS, which is why nothing may depend on order
      within a layer. Between layers it is now a decision (`src/app/mount.ts` places the ship last so
      the player can find it in a crowd), and a painter that walked the array backwards, or sorted
      it, would put the ship underneath 150 bullets and break nothing else.
    */
    const order: number[] = [];
    const recording: Surface = {
      clear(): void {
        order.length = 0;
      },
      blit(spriteIndex: number): void {
        order.push(spriteIndex);
      },
    };
    const back = new Pool<Entity>(2, makeEntity);
    const front = new Pool<Entity>(1, makeEntity);
    for (let i = 0; i < 2; i++) reset(back.spawn()!, 100 + i, 50, bodyOf(SPRITE.drifter, 1, 1, 0));
    reset(front.spawn()!, 100, 50, SHIPS.proof);

    paintScene(recording, viewOf(VIEWPORT.width, VIEWPORT.height), [back, front], 90, 1);
    expect(order, 'the ship was not drawn last, so it is underneath everything else').toEqual([
      SPRITE.drifter,
      SPRITE.drifter,
      SPRITE.ship,
    ]);
  });
});

// ── THE CULL THAT DID NOT EXIST UNTIL SOMETHING FLEW FORWARDS ────────────────────────────────────

describe('a shot that outruns the camera is retired', () => {
  it('a player shot does not live forever ahead of the level', () => {
    // Everything in the game drifted backwards until there were player shots, so `cullAlong` was the
    // whole story. A shot that outruns the camera never falls behind: the pool fills with bullets
    // that left the screen seconds ago and then refuses the one the player is watching for.
    const shots = new Pool<Entity>(1, makeEntity);
    const shot = shots.spawn()!;
    reset(shot, 0, 50, SHOTS.pulse);
    shot.velAlong = SHOTS.pulse.speed;

    const camera = 0;
    for (let step = 0; step < 2000 && shots.size > 0; step++) stepEntities(shots, camera);
    expect(shots.size, 'the shot outran the camera and was never retired').toBe(0);
  });

  it('and a wave placed at the spawn line survives the step it arrives on', () => {
    // The other half, and the one that fails silently: a leading cull set AT the spawn distance
    // retires every wave on the step it is created, and the level plays as an empty field.
    const enemies = new Pool<Entity>(1, makeEntity);
    const e = enemies.spawn()!;
    reset(e, spawnAlong(0), 50, ENEMIES.drifter);
    stepEntities(enemies, 0);
    expect(enemies.size, 'the wave was culled on the step it spawned').toBe(1);
  });
});
