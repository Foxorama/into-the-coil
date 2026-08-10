import { describe, expect, it } from 'vitest';

import { ENEMIES, ENEMY_KINDS, MOTION_KINDS, type EnemyKind } from '../src/content/enemies.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { LEVELS } from '../src/content/levels.ts';
import { ACROSS_SPAN, cullAlong, spawnAlong, viewOf } from '../src/sim/camera.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { GameFrame, SHIP_START_ALONG } from '../src/app/frame.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { playableWorld } from './world.ts';
import type { Entity } from '../src/sim/entity.ts';
import type { World } from '../src/app/frame.ts';

/**
 * AN ENEMY IS A PILOT — `docs/decisions/0073-an-enemy-is-a-pilot.md`.
 *
 * Reported from play: *"currently basically every wave is just a wall that you pass by. They need to
 * circle, double back etc and be actively dog-fighting with the player… the game is just not a game,
 * it has actually become what we tried to avoid, a one-button autopilot stick."*
 *
 * ⚠️ **Every assertion here drives the REAL frame, and most of them are in seconds and world units
 * rather than in the constants they are about.** A guard written against `agility` would prove that
 * the code agrees with itself — `docs/decisions/0027-measure-the-picture-not-the-model.md` is
 * explicit that at least one assertion must be in units the player experiences, and a chase is a
 * thing that either closes in a few seconds or does not.
 */

const seconds = (n: number): number => Math.round(n * STEPS_PER_SECOND);

/**
 * A world whose entire level script is one wave of one enemy, spawned by the game.
 *
 * ── WHY THE BODY IS NOT PLACED BY HAND, WHICH IS WHAT THE FIRST VERSION DID ─────────────────────
 *
 * ⚠️ **`npm run prove` is why.** The first fixture spawned an entity straight into the pool and set
 * `turnsLeft` and `spin` itself, which reads as a tidy way to control the scenario and means the
 * SPAWNER is never exercised. Two probes — one deleting the looper's turns at the spawn site, one
 * changing where its handedness comes from — both came back STILL GREEN, because the fixture was
 * supplying by hand exactly the values the break removed.
 *
 * So the level is replaced with a one-wave script and the frame is stepped until the wave arrives.
 * Everything is then the real path: the real `spawnWave`, the real tier scaling, the real fields.
 * `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`.
 */
function withOneEnemy(
  kind: EnemyKind,
  place: { along: number; across: number },
  tier: (typeof DIFFICULTY_KINDS)[number] = 'legendary',
): { world: World; frame: GameFrame; enemy: Entity } {
  const { world } = playableWorld(LEVELS.approach, tier);
  world.level = {
    ...LEVELS.approach,
    waves: [{ at: place.along, enemy: kind, formation: 'line', count: 1, lane: place.across }],
    pickups: [],
    // Far beyond anything measured here, so a boss never joins a fight about one body's flying.
    bossAt: 1e9,
  };
  world.nextWave = 0;
  world.nextPickup = 0;
  const frame = new GameFrame(world);
  // Nothing may die of anything but the thing under test, and a dead ship stops the world reacting.
  world.ship.health = 9999;
  // Step until the script has put it on the field — a wave spawns when the horizon reaches its `at`.
  for (let i = 0; i < seconds(60) && world.enemies.size === 0; i++) frame.step();
  const enemy = world.enemies.at(0);
  // Measuring flight, not attrition: this fixture is never about whether something can be killed.
  enemy.health = 9999;
  enemy.damage = 0;
  return { world, frame, enemy };
}

describe('the motion table', () => {
  it('has no arm nothing flies, so the union cannot fill up with behaviour no level sends', () => {
    const flown = new Set(ENEMY_KINDS.map((kind) => ENEMIES[kind].motion.kind));
    const dead = MOTION_KINDS.filter((kind) => !flown.has(kind));
    expect(dead, `these motions exist and no enemy uses them: ${dead.join(', ')}`).toEqual([]);
  });

  it('and NOT everything reacts, because a field where everything converges is one threat', () => {
    /*
      ⚠️ **The design claim, asserted so it cannot erode one row at a time.** The play report is that
      every wave is a wall; the answer is not that every body hunts. 0034's *a threat is absolute* is
      what keeps six kinds distinguishable, and something the player is safe to ignore is what makes
      the things they cannot ignore mean anything. The drifter and the turret are the two, and each
      says why on its row.
    */
    const inert = ENEMY_KINDS.filter((kind) => {
      const motion = ENEMIES[kind].motion.kind;
      return motion === 'drift' || motion === 'weave';
    });
    expect(inert.length, 'every enemy in the game now chases the player').toBeGreaterThan(1);
    const reactive = ENEMY_KINDS.length - inert.length;
    expect(reactive, 'nothing reacts to the player at all, which is the report unanswered').toBeGreaterThan(1);
  });
});

describe('0105 — a body is on screen long enough to be answered', () => {
  /*
   * ⚠️ **THE REPORTED ONE: *"enemies overall fly too fast and shoot too fast."*** Asked what *too
   * fast* meant, the answer named the quantity outright: it *"has to do with their time onscreen and
   * the player's time to interaction with them."* **Nothing in this repository measured either.**
   *
   * ⚠️ **IN SECONDS, WHICH IS 0027's OWN REQUIREMENT AND THE WHOLE POINT HERE.** A guard written in
   * world units per step would be `closing` compared against itself; what the player experiences is
   * *how long do I have*, and the only honest way to hold it is a clock. A body's speed in the
   * camera's frame is `SCROLL_PER_STEP + closing` (0023), so the window is arithmetic over three
   * files — the enemy table, the flight constants and the camera's own span.
   *
   * ⚠️ **Driven at the HARDEST tier**, because that is where the window is shortest and it is the
   * case the report is about. The easiest tier passes by construction if this does.
   */
  const view = viewOf(1280, 720).alongSpan;
  const hardest = DIFFICULTY_KINDS.map((kind) => DIFFICULTIES[kind]).reduce((a, b) => (a.closing > b.closing ? a : b));

  /** How long `kind` is visible on a 16:9 screen at `tier`, in seconds. */
  const onScreen = (kind: EnemyKind, closingMultiplier: number): number =>
    view / (SCROLL_PER_STEP + ENEMIES[kind].closing * closingMultiplier) / STEPS_PER_SECOND;

  it('THE REPORTED ONE: nothing crosses the screen faster than the window a player can use', () => {
    /*
      ⚠️ **1.8 SECONDS, and the number is the report rather than a taste.** Driven over the build that
      was played, the charger had **1.38s** at this tier and was named as too fast; the drifter, which
      nobody has ever called fast, has 4.94s. The floor sits above the state that was rejected and
      well below the state that was never mentioned, which is the only place a reported bound can
      honestly go.

      ⚠️ **It is a FLOOR on the fastest thing, not a target for everything.** A field where every body
      lasts the same time is 0034's *a threat is absolute* thrown away; what this refuses is a body
      the player cannot engage at all.
    */
    for (const kind of ENEMY_KINDS) {
      const seconds = onScreen(kind, hardest.closing);
      expect(
        seconds,
        `a ${kind} is on screen for ${seconds.toFixed(2)}s at the hardest tier — too little to be answered`,
      ).toBeGreaterThan(1.8);
    }
  });

  it('and the ordering is untouched, so nothing lost the identity its row is written around', () => {
    /*
      ⚠️ **A global slowdown must not flatten the roster**, which is the way this change could do
      harm: the charger's whole identity is *"roughly three times the lancer's closing"* and the
      drifter's is that it never closes at all. Held as the ORDER rather than as the values, so a
      later re-tune is free to move them together.
    */
    const bySpeed = [...ENEMY_KINDS].sort((a, b) => ENEMIES[a].closing - ENEMIES[b].closing);
    expect(bySpeed[bySpeed.length - 1], 'the charger is no longer the fastest thing in the game').toBe('charger');
    expect(
      ENEMIES.charger.closing / ENEMIES.lancer.closing,
      'the charger stopped being about three times the lancer, which is what its row is written around',
    ).toBeGreaterThan(2.5);
    // And the two that are meant to arrive with the world still do, which is what makes them ignorable.
    expect(ENEMIES.drifter.closing, 'the drifter started closing, so nothing arrives with the world').toBe(0);
    expect(ENEMIES.turret.closing, 'the turret started closing, so an emplacement is a chaser').toBe(0);
  });

  it('and nothing gets more volleys away at the player than a player can read', () => {
    /*
      ⚠️ **The other half of *"shoot too fast"*, in the same unit.** What matters is not the gap
      between shots but how many arrive from one body while it is on screen — a body that fires twice
      is a pattern to dodge and one that fires a dozen times is a wall.

      ⚠️ **The turret is the binding case and always was**: it never closes, so it is on screen for
      five seconds, and at the hardest tier it was putting **twelve** volleys out in that window.
    */
    for (const kind of ENEMY_KINDS) {
      const row = ENEMIES[kind];
      if (row.fireEvery === 0) continue;
      const volleys = (onScreen(kind, hardest.closing) * STEPS_PER_SECOND) / (row.fireEvery * hardest.fireGap);
      expect(
        volleys,
        `a ${kind} gets ${volleys.toFixed(1)} volleys away while it is on screen at the hardest tier`,
      ).toBeLessThan(10);
    }
  });
});

describe('a hunter closes on the player', () => {
  it('REACHES the ship’s lane before it passes them, from the far side and the real spawn distance', () => {
    /*
      ⚠️ **The claim is *arrives*, and it is measured over the body's whole life rather than over a
      convenient window.** The first version of this test ran for five seconds from ninety units out
      and asserted the gap had halved — and it failed, because a lancer is retired by the trailing
      cull about two and a half seconds after it becomes visible. That is the honest measurement and
      it condemned the number rather than the test: at the original agility the enemy crossed a third
      of the lane and left, which is a wall with a lean on it.

      ⚠️ **Placed at the distance the LEVEL actually spawns at**, not at a distance that makes the
      sum work. `spawnAlong` is the leading horizon and a wave arrives there; anything closer would be
      measuring a fight the player never gets.
    */
    const { world, frame, enemy } = withOneEnemy('lancer', { along: SHIP_START_ALONG + 90, across: 10 });
    world.ship.across = ACROSS_SPAN - 10;
    enemy.along = spawnAlong(world.cameraAlong);
    enemy.prevAlong = enemy.along;
    const before = Math.abs(world.ship.across - enemy.across);
    expect(before, 'the fixture did not put them apart, so this measures nothing').toBeGreaterThan(60);
    let closest = before;
    for (let i = 0; i < seconds(30) && world.enemies.size > 0; i++) {
      frame.step();
      if (world.enemies.size === 0) break;
      closest = Math.min(closest, Math.abs(world.ship.across - enemy.across));
    }
    expect(closest, 'a lancer spawned across the lane never reached the ship before it was gone').toBeLessThan(6);
  });

  it('and settles ON the player rather than vibrating across them', () => {
    /*
      ⚠️ **The bug a proportional steer has and a clamped one does not.** Steering by the whole gap
      overshoots by exactly the gap once the rate exceeds the distance left, so the body sits
      oscillating on top of the ship — which reads as a graphical fault rather than as an enemy.
    */
    const { world, frame, enemy } = withOneEnemy('lancer', { along: SHIP_START_ALONG + 90, across: 20 });
    world.ship.across = 50;
    for (let i = 0; i < seconds(12); i++) frame.step();
    expect(Math.abs(enemy.across - world.ship.across), 'the hunter never arrived').toBeLessThan(2);
    let swing = 0;
    for (let i = 0; i < seconds(1); i++) {
      const was = enemy.across;
      frame.step();
      swing = Math.max(swing, Math.abs(enemy.across - was));
    }
    expect(swing, 'the hunter is oscillating on the ship rather than holding on it').toBeLessThan(0.5);
  });

  it('and a harder tier closes faster, which is what the aggression column is', () => {
    const gapAfter = (tier: (typeof DIFFICULTY_KINDS)[number]): number => {
      const { world, frame, enemy } = withOneEnemy('lancer', { along: SHIP_START_ALONG + 90, across: 10 }, tier);
      world.ship.across = ACROSS_SPAN - 10;
      for (let i = 0; i < seconds(2); i++) frame.step();
      return Math.abs(world.ship.across - enemy.across);
    };
    const gentle = gapAfter('legendary');
    const hardest = gapAfter('burn');
    expect(hardest, 'the hardest tier chases no harder than the gentlest').toBeLessThan(gentle);
  });
});

describe('a looper comes back, and then it leaves', () => {
  it('crosses the ship more than once, which a wall does not', () => {
    /*
      ⚠️ **THE REPORTED ONE**: *"we have no way currently to deal with enemies that fly past the
      player."* A charger that comes back is a charger the forward guns can answer, which is why the
      rear weapon is an option rather than a requirement.
    */
    const { world, frame, enemy } = withOneEnemy('charger', { along: SHIP_START_ALONG + 70, across: 50 });
    world.ship.across = 50;
    let crossings = 0;
    let wasAhead = enemy.along >= world.ship.along;
    for (let i = 0; i < seconds(20) && world.enemies.size > 0; i++) {
      frame.step();
      if (world.enemies.size === 0) break;
      const isAhead = enemy.along >= world.ship.along;
      if (isAhead !== wasAhead) crossings++;
      wasAhead = isAhead;
    }
    expect(crossings, 'the charger flew past once and was gone, which is the wall').toBeGreaterThan(1);
  });

  it('and gives up after its own number of turns rather than orbiting for ever', () => {
    /*
      ⚠️ **A level whose chargers never departed would fill the pool with the first minute's worth.**
      Enemies leaving is what makes a wave table a pace rather than a total, and `src/sim/pool.ts`
      drops rather than grows.
    */
    const { world, frame, enemy } = withOneEnemy('charger', { along: SHIP_START_ALONG + 70, across: 50 });
    world.ship.across = 50;
    const turns = ENEMIES.charger.motion.kind === 'loop' ? ENEMIES.charger.motion.turns : 0;
    expect(turns, 'the charger no longer loops, so this measures nothing').toBeGreaterThan(0);
    let left = false;
    for (let i = 0; i < seconds(40); i++) {
      frame.step();
      if (world.enemies.size === 0) {
        left = true;
        break;
      }
    }
    expect(left, 'the charger never left, so a level would accumulate every one it ever sent').toBe(true);
    expect(enemy.turnsLeft, 'it left with turns still in hand').toBeLessThanOrEqual(0);
  });
});

describe('a circler orbits, and cannot be deleted by retreating', () => {
  it('gets all the way round the ship — a whole lap, not a swing', () => {
    /*
      ⚠️ **A LAP, and the first version of this test asked for something weaker that a broken orbit
      also satisfies.** It checked that the body was seen ahead of, behind and beside the ship, and
      the probe that derives the turn direction from which side it is on — so the orbit reverses
      halfway round, every time — came back STILL GREEN: an arc swinging back and forth visits all
      three of those. What separates a circle from a pendulum is that the angle keeps ACCUMULATING,
      so that is what is measured.

      The angle is unwrapped step by step and summed. A pendulum's total oscillates around zero
      forever; a circle's passes 2π and keeps going.
    */
    const { world, frame, enemy } = withOneEnemy('warden', { along: SHIP_START_ALONG + 80, across: 50 });
    world.ship.across = 50;
    let swept = 0;
    let last: number | null = null;
    for (let i = 0; i < seconds(25); i++) {
      frame.step();
      if (world.enemies.size === 0) break;
      const angle = Math.atan2(enemy.across - world.ship.across, enemy.along - world.ship.along);
      if (last !== null) {
        let step = angle - last;
        // Unwrap: the shortest way round, so crossing ±π is not read as a lap in one step.
        if (step > Math.PI) step -= Math.PI * 2;
        if (step < -Math.PI) step += Math.PI * 2;
        swept += step;
      }
      last = angle;
    }
    expect(Math.abs(swept), 'the circler never completed a lap — it is swinging on an arc').toBeGreaterThan(Math.PI * 2);
  });

  it('THE ONE THAT WOULD BE FREE: it stays on screen when the player hides at the very back', () => {
    /*
      ⚠️ **The harm is being UNSEEABLE, and the first version of this test asserted the wrong one.**
      It claimed the body would be culled, and the probe that removed the floor came back STILL
      GREEN: `cullAlong` sits an `EDGE_MARGIN` — forty units — behind the camera, so an orbit around
      a ship at the back edge dips off the screen and survives inside the margin. The consequence is
      worse than a cull rather than better. An enemy the player cannot see and cannot shoot, orbiting
      a ship pinned in the corner, is exactly the *hit with no cause on the picture* that
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` records being
      reported three times as a collision fault that did not exist.

      So the assertion is in the unit the player has: **it never goes behind the trailing edge.**
    */
    const { world, frame, enemy } = withOneEnemy('warden', { along: SHIP_START_ALONG + 80, across: 50 });
    world.ship.across = 50;
    let deepest = Infinity;
    for (let i = 0; i < seconds(30); i++) {
      // The player pinned to the back edge of their box, every step.
      world.ship.along = world.cameraAlong + 7;
      world.ship.prevAlong = world.ship.along;
      frame.step();
      if (world.enemies.size === 0) break;
      deepest = Math.min(deepest, enemy.along - world.cameraAlong);
    }
    expect(world.enemies.size, 'the warden left the field entirely while the player hid at the edge').toBe(1);
    expect(deepest, 'the warden orbited off the back of the screen, where it cannot be seen or shot').toBeGreaterThanOrEqual(0);
    expect(enemy.along, 'the warden is behind the cull and still in the pool').toBeGreaterThan(cullAlong(world.cameraAlong));
  });
});

describe('the leading edge does not shoot at what it cannot be seen from', () => {
  it('THE REPORTED DEFECT: a body beyond the view fires nothing', () => {
    /*
      Reported: *"most of the difficulty is enemies that fly past and shoot, or shoot from
      off-screen."* `reports/medium-played-2026-08-07.md` has the arithmetic — a wave is placed about
      246 units out and a 16:9 device sees 178, so every approach carried roughly two seconds of fire
      from a body with no picture. 0059 added this test on the `across` axis and the leading edge
      never got one.
    */
    const { world, frame } = withOneEnemy('turret', { along: 0, across: 50 });
    const enemy = world.enemies.at(0);
    // Beyond what this view can show, which is where the level actually puts a new wave.
    enemy.along = world.cameraAlong + world.view.alongSpan + 40;
    enemy.prevAlong = enemy.along;
    enemy.velAlong = 0;
    enemy.fireIn = 1;
    for (let i = 0; i < seconds(4); i++) {
      // Held out there, so the only thing under test is whether it fires from off screen.
      enemy.along = world.cameraAlong + world.view.alongSpan + 40;
      enemy.prevAlong = enemy.along;
      frame.step();
    }
    expect(world.enemyShots.size, 'something off the leading edge shot at the player').toBe(0);
  });

  it('and the same body fires the moment it can be seen, so the rule is not just silence', () => {
    const { world, frame } = withOneEnemy('turret', { along: 0, across: 50 });
    const enemy = world.enemies.at(0);
    enemy.fireIn = 1;
    for (let i = 0; i < seconds(4); i++) {
      // Just inside the leading edge instead.
      enemy.along = world.cameraAlong + world.view.alongSpan - 10;
      enemy.prevAlong = enemy.along;
      frame.step();
    }
    expect(world.enemyShots.size, 'a turret the player can see did not fire either').toBeGreaterThan(0);
  });
});

describe('reacting to the player did not cost reproducibility', () => {
  it('two runs of the same inputs put every body in the same place', () => {
    /*
      ⚠️ **The property `src/content/enemies.ts` gave up was AUTHORABILITY, not determinism**, and the
      difference matters enough to assert. A reactive path cannot be read off a wave table any more —
      that is the cost, and it is what the play-test asked for. What must not have changed is that a
      seeded run replays: the step is fixed (0022), nothing here draws from a generator, and the ship
      is a function of the input.
    */
    const run = (): string => {
      const { world, frame } = withOneEnemy('warden', { along: SHIP_START_ALONG + 80, across: 30 });
      for (let i = 0; i < seconds(10); i++) frame.step();
      const e = world.enemies.size > 0 ? world.enemies.at(0) : null;
      return e === null ? 'gone' : `${e.along.toFixed(6)}:${e.across.toFixed(6)}`;
    };
    expect(run()).toBe(run());
  });
});
