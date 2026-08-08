import { describe, expect, it } from 'vitest';

import { CAPACITY } from '../src/app/mount.ts';
import { GameFrame, detonateArsenal, respawn, scatterUpgrades, type World } from '../src/app/frame.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { PICKUPS, PICKUP_KINDS, UPGRADE_KINDS } from '../src/content/pickups.ts';
import { PYRES, pyreFor } from '../src/content/specials.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { reset } from '../src/sim/entity.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import type { Surface } from '../src/render/surface.ts';
import { type Action, type State, initialState, reduce } from '../src/state/root.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * A DEATH IS A BEAT, AND THE ARSENAL GOES UP WITH THE SHIP.
 *
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`. Reported from
 * play: *"when a player dies, they instantly respawn, there needs to be the player ship explosion, a
 * pause, then a respawn. This also needs to happen before the 'continue' screen shows up as well."*
 * And asked for alongside it: *"the player's ship (and only the player's ship) exploding on death
 * should fire all unspent bombs at the player ship's location with an expanding ring based on number
 * of bombs."*
 *
 * ⚠️ **Every assertion here that CAN be written in the player's units is** — seconds the ship is off
 * the screen, world units ahead of the camera, a screen that is or is not up. `DEATH_STEPS` is the
 * constant under test, so a guard counting it would prove only that the code agrees with itself —
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`, and
 * `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` cannot see that class of failure at all.
 *
 * ⚠️ **The gates are the other half, and six of the eight produce a game that looks completely normal
 * in a screenshot.** A wreck that still fires, still collects and still takes hits is the one that
 * matters: it costs a life per step until the run is empty.
 */

/**
 * Long enough for a beat and a respawn at any numbers anybody would author.
 *
 * ⚠️ **It is also every loop's ceiling**, so it has to clear the longest beat a probe asks for as
 * well as the one that ships — see `flyOutTheBeat`.
 */
const A_WHILE = 6 * STEPS_PER_SECOND;

/** The tier the fixtures run at. Nothing here asserts on the numbers it carries. */
const TIER = DIFFICULTY_KINDS[0]!;

/** A surface that records what it was asked to draw, so the PICTURE can be measured. */
class Recorder implements Surface {
  readonly blits: { sprite: number; x: number; y: number }[] = [];
  clear(): void {
    this.blits.length = 0;
  }
  blit(sprite: number, x: number, y: number): void {
    this.blits.push({ sprite, x, y });
  }
}

/** A world with no level in it, so nothing arrives except what a test puts there. */
function quietWorld(): ReturnType<typeof playableWorld> & { frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  return { ...built, frame: new GameFrame(built.world) };
}

/**
 * Kill the ship with one planted enemy shot, and stop on the step it lands.
 *
 * ⚠️ **Through the real collision rather than by writing zero into `health`.** What is under test is
 * a branch in the step, and a fixture that reached past the pairings could not see a gate that had
 * been left off one of them.
 */
function killShip(world: World, frame: GameFrame): void {
  for (let i = 0; i < A_WHILE; i++) {
    if (world.enemyShots.size === 0) {
      const shot = world.enemyShots.spawn()!;
      reset(shot, world.ship.along + 6, world.ship.across, SHOTS.spit);
      shot.velAlong = -SHOTS.spit.speed + world.scrollPerStep;
    }
    frame.step();
    if (world.shipPool.size === 0) return;
  }
  throw new Error('the ship never died — the fixture is not measuring what it says it is');
}

/**
 * Step until the beat has finished, and refuse to step forever if it never does.
 *
 * ⚠️ **EVERY LOOP IN THIS FILE IS BOUNDED, and `npm run prove` is what taught it.** The obvious
 * `while (world.dyingIn > 0) frame.step()` is exactly right against the shipping code and is an
 * infinite loop against one of this decision's own probes: with the collision gate removed, a wreck
 * re-reports its own death every step and re-arms the counter. A synchronous spin blocks the event
 * loop, so **vitest's test timeout cannot fire** — the suite does not go red, it hangs, and the probe
 * harness waits on it for ever.
 *
 * `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` is about a probe that proves nothing; this is
 * the neighbouring failure — a probe that cannot report at all — and the fix is a property of the
 * fixture rather than of the guard: **a test may not loop on a condition the code under test owns.**
 */
function flyOutTheBeat(world: World, frame: GameFrame): void {
  for (let i = 0; i < A_WHILE; i++) {
    if (world.dyingIn === 0) return;
    frame.step();
  }
  throw new Error('the beat never ended — the fixture is not measuring what it says it is');
}

/**
 * The shell, minus the canvas: a world, the real reducer, the real lifecycle, and the two death
 * callbacks wired the way `src/app/mount.ts` wires them.
 *
 * ⚠️ **The real `reduce`, never a stub.** *The run-over screen does not appear on the step the last
 * life is lost* is a claim about `src/state/root.ts`'s cross-slice agreement, and a fixture that
 * dispatched into a fake would be the one thing that could not see it.
 */
function shell(level = LEVELS[LEVEL_KINDS[0]!]) {
  const built = playableWorld(level, TIER);
  const world = built.world;
  let current: State = initialState;
  const dispatch = (action: Action): void => {
    current = reduce(current, action);
  };
  const chargesOf = (): number => current.run.arsenal.reduce((total, entry) => total + entry.charges, 0);
  world.onWreck = (): void => {
    detonateArsenal(world, chargesOf());
  };
  world.onDeath = (): void => {
    scatterUpgrades(world, current.run.upgrades);
    dispatch({ slice: 'run', type: 'lifeLost' });
    if (current.run.lives > 0) respawn(world);
  };
  return {
    world,
    frame: new GameFrame(world),
    dispatch,
    state: (): State => current,
    lifecycle: makeLifecycle(world, dispatch, () => current.run),
  };
}

describe('the ship comes apart, and the player watches it happen', () => {
  it('is off the screen for most of a second, and then comes back', () => {
    /*
      ⚠️ **THE REPORTED ONE, in the player's own units.** *"When a player dies, they instantly
      respawn."* They did: the burst, the scatter, the lost life and the new ship were all one step,
      so the replacement was already there on the next frame drawn. This counts FRAMES WITHOUT A SHIP
      ON THEM, which is the thing the report is about.

      ⚠️ **Both silhouettes**, because a respawned ship blinks: `invulnFor` makes `stepEntities` swap
      in `shipHit` on alternate phases (`src/sim/entity.ts`), so looking for the base sprite alone
      would count half the frames after the respawn as *still gone*.
    */
    const built = quietWorld();
    const recorder = new Recorder();
    built.world.surface = recorder;
    killShip(built.world, built.frame);

    let gone = 0;
    let backAfter = -1;
    for (let i = 0; i < A_WHILE; i++) {
      built.frame.draw(0);
      const drawn = recorder.blits.some((b) => b.sprite === SPRITE.ship || b.sprite === SPRITE.shipHit);
      if (drawn) {
        if (backAfter < 0) backAfter = i;
      } else if (backAfter < 0) gone++;
      built.frame.step();
    }
    expect(backAfter, 'the ship never came back at all').toBeGreaterThan(0);
    expect(gone / STEPS_PER_SECOND, 'the ship was back before the player could see it go').toBeGreaterThan(0.5);
    /*
      ⚠️ **And an upper bound, because the failure has two directions.** A beat the player sits
      through several times a run is a tax; two seconds of staring at debris is the version of this
      change that gets reported next time.
    */
    expect(gone / STEPS_PER_SECOND, 'the pause outstayed its welcome').toBeLessThan(2);
  });

  it('keeps exploding where the player watched it die, rather than where it was', () => {
    /*
      ⚠️ **THE MISTAKE `docs/decisions/0062-a-boss-dies-loudly.md` DOCUMENTS HAVING MADE.** The camera
      keeps moving through the beat, so an explosion remembered as a world position drifts out from
      under the place the player was looking — about 27 world units by the end of it, which is a
      quarter of the lane.

      Measured on the fragments this step actually spawned: `stepShipDeath` runs after
      `stepEntities`, so a piece with `prevAlong === along` has not moved yet.
    */
    const built = quietWorld();
    killShip(built.world, built.frame);
    const offset = built.world.deathOffset;
    let pulses = 0;
    let worst = 0;
    // Bounded, for the reason `flyOutTheBeat` gives at length.
    for (let i = 0; i < A_WHILE && built.world.dyingIn > 0; i++) {
      built.frame.step();
      for (let i = 0; i < built.world.debris.size; i++) {
        const piece = built.world.debris.at(i);
        if (piece.prevAlong !== piece.along) continue;
        pulses++;
        worst = Math.max(worst, Math.abs(piece.along - built.world.cameraAlong - offset));
      }
    }
    expect(pulses, 'the wreck never pulsed, so this measured nothing').toBeGreaterThan(0);
    // Inside the hull it came off, plus the spread the pulse is scattered over — which is the hull
    // again. Anything reading a world position lands a whole camera-beat behind that.
    expect(worst, 'the explosion drifted away from where the ship died').toBeLessThan(
      built.world.shipRow.radius * 2 + 1,
    );
  });

  it('throws the upgrades out of the wreck and not a beat behind it', () => {
    /*
      ⚠️ **`scatterUpgrades` now runs at the END of the beat, which is what put this at risk.** It
      read the ship's own position, and the ship object has been sitting still in world coordinates
      for the whole beat while the camera moved — so the pieces would arrive a beat's worth of scroll
      behind the explosion they came out of.
    */
    /*
      ⚠️ **EIGHT of them, and it was one of each kind.** 0082 merged the four upgrade kinds into one
      and made the scatter a 50% coin per piece, so *one of each* is now a single upgrade with an even
      chance of being filtered out — and this test, which is about WHERE the pieces land, would have
      measured an empty field half the time. Eight makes the odds of nothing surviving one in 256, and
      the seed is the fixture's, so it is deterministic rather than merely unlikely.
    */
    const built = shell(NO_LEVEL);
    built.dispatch({ slice: 'run', type: 'begin', difficulty: TIER });
    for (let i = 0; i < 8; i++) {
      for (const upgrade of UPGRADE_KINDS) built.dispatch({ slice: 'run', type: 'upgraded', upgrade });
    }
    built.dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    killShip(built.world, built.frame);
    const offset = built.world.deathOffset;
    flyOutTheBeat(built.world, built.frame);

    expect(built.world.pickups.size, 'a death with a full loadout scattered nothing').toBeGreaterThan(0);
    for (let i = 0; i < built.world.pickups.size; i++) {
      const item = built.world.pickups.at(i);
      const drift = Math.abs(item.along - built.world.cameraAlong - offset);
      // One step of the throw, which is all a piece has had time to travel when it is looked at here.
      expect(drift, 'the scatter arrived behind the wreck it came off').toBeLessThan(4);
    }
  });

  it('does not raise the run-over screen on the step the last life is lost', () => {
    /*
      ⚠️ **THE SECOND HALF OF THE REPORT, and it is one cause with the first.** *"This also needs to
      happen before the 'continue' screen shows up as well."* `src/state/root.ts` raises the run-over
      screen off the `lifeLost` dispatch, and that dispatch used to be on the step the hull reached
      zero — so on the last life the overlay went up before the burst had drawn a single frame.

      Driven through the real reducer, because the rule is not in the frame.
    */
    const built = shell(NO_LEVEL);
    built.lifecycle.begin(TIER);
    for (let i = 0; i < A_WHILE && built.state().run.lives > 1; i++) {
      built.dispatch({ slice: 'run', type: 'lifeLost' });
    }
    expect(built.state().run.lives, 'the run was not brought down to its last life').toBe(1);
    built.dispatch({ slice: 'screen', type: 'show', screen: 'playing' });

    killShip(built.world, built.frame);
    expect(built.state().screen.current, 'the overlay went up over the explosion').toBe('playing');
    /*
      Stated in seconds as well as on the step, because *not yet* is the whole claim and half a second
      is the smallest amount of it a player would call a beat.
    */
    for (let i = 0; i < Math.round(0.5 * STEPS_PER_SECOND); i++) built.frame.step();
    expect(built.state().screen.current, 'the run-over screen beat the explosion to the screen').toBe('playing');

    for (let i = 0; i < A_WHILE && built.state().screen.current === 'playing'; i++) built.frame.step();
    expect(built.state().screen.current, 'the run-over screen never arrived at all').toBe('gameOver');
    expect(built.state().run.lives, 'the last life was never spent').toBe(0);
  });
});

describe('a wreck is not a ship, and every step that touches one says so', () => {
  it('costs exactly one life however hard the field keeps hitting it', () => {
    /*
      ⚠️ **THE GATE THAT MATTERS.** A dead ship left in its collision pairings goes on taking hits:
      health walks further negative, the death check fires again every step, and the run empties
      itself at sixty lives a second. Nothing about the picture would look wrong.
    */
    /*
      ⚠️ **`begin` through the REDUCER rather than through the lifecycle, so the field stays empty.**
      `src/app/lifecycle.ts` enters the level the RUN is on, not the one this world was built with —
      so `lifecycle.begin` would put level one in front of a fixture that flies nothing, and the
      second life this is watching for would be spent on an ordinary wave instead of on the wreck.
    */
    const built = shell(NO_LEVEL);
    built.dispatch({ slice: 'run', type: 'begin', difficulty: TIER });
    built.dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    const lives = built.state().run.lives;
    killShip(built.world, built.frame);
    const wreckAlong = built.world.cameraAlong + built.world.deathOffset;

    // A stream of shots into the wreck for as long as there is a wreck to shoot at. Bounded, per
    // `flyOutTheBeat` — with the collision gate off, this condition never ends on its own.
    for (let i = 0; i < A_WHILE && built.world.shipPool.size === 0; i++) {
      const shot = built.world.enemyShots.spawn();
      if (shot !== null) {
        reset(shot, wreckAlong + 4, built.world.deathAcross, SHOTS.spit);
        shot.velAlong = -SHOTS.spit.speed + built.world.scrollPerStep;
      }
      built.frame.step();
    }
    expect(built.state().run.lives, 'a wreck kept taking hits and the run paid for every one').toBe(lives - 1);
  });

  it('fires nothing and throws nothing while it is coming apart', () => {
    const built = quietWorld();
    killShip(built.world, built.frame);
    built.world.playerShots.clear();
    built.world.missiles.clear();
    // Every trigger held down for the whole beat, which is what a player who has just died does.
    let asked = 0;
    built.world.onSpecial = (): void => {
      asked++;
    };
    // Bounded, for the reason `flyOutTheBeat` gives at length.
    for (let i = 0; i < A_WHILE && built.world.dyingIn > 1; i++) {
      built.world.intent.specials[0] = 1;
      built.frame.step();
      expect(built.world.playerShots.size, 'a wreck kept firing').toBe(0);
      expect(built.world.missiles.size, 'a wreck kept launching missiles').toBe(0);
    }
    expect(asked, 'a wreck asked the shell to spend a charge').toBe(0);
  });

  it('collects nothing, including the scatter it is about to throw', () => {
    const built = quietWorld();
    killShip(built.world, built.frame);
    const item = built.world.pickups.spawn()!;
    const kind = built.world.pickupKinds[PICKUP_KINDS[0]!];
    reset(
      item,
      built.world.cameraAlong + built.world.deathOffset,
      built.world.deathAcross,
      PICKUPS[PICKUP_KINDS[0]!],
      kind,
    );
    item.velAlong = built.world.scrollPerStep;
    for (let i = 0; i < 4; i++) built.frame.step();
    expect(built.taken, 'a wreck flew into a pickup it no longer had a hull for').toEqual([]);
  });

  it('hands the same ship back, because there is only ever one', () => {
    /*
      ⚠️ **`respawn` spawns into a pool of ONE and assumes it gets the same object back.** That is
      true and it is worth a guard rather than a shrug: the day `CAPACITY.ship` moves, `w.ship` and
      the thing being drawn would be two different entities and the game would fly one and paint the
      other.
    */
    expect(CAPACITY.ship, 'the ship pool holds more than one, which respawn assumes it does not').toBe(1);
    const built = quietWorld();
    killShip(built.world, built.frame);
    expect(built.world.shipPool.size, 'the wreck was still in its pool').toBe(0);
    flyOutTheBeat(built.world, built.frame);
    expect(built.world.shipPool.size, 'the ship never came back into its pool').toBe(1);
    expect(built.world.shipPool.at(0), 'the pool is drawing a different object from the one the game flies').toBe(
      built.world.ship,
    );
  });

  it('does not open a new run mid-beat', () => {
    // `docs/decisions/0067-a-new-run-opens-on-an-empty-field.md` exists because exactly this kind of
    // field was missed once already and the suite could not see it.
    const built = shell(NO_LEVEL);
    built.lifecycle.begin(TIER);
    built.dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    killShip(built.world, built.frame);
    expect(built.world.dyingIn, 'the fixture is not mid-beat, so this measures nothing').toBeGreaterThan(0);
    built.lifecycle.begin(TIER);
    expect(built.world.dyingIn, 'a new run opened with the last one still exploding').toBe(0);
    expect(built.world.shipPool.size, 'a new run opened with no ship in it').toBe(1);
  });
});

describe('the pyre: what the ship was carrying goes up with it', () => {
  it('draws every rung at exactly the radius it damages at', () => {
    /*
      ⚠️ **The guard `tests/bombs.test.ts` wrote for one ring, over all four.** A blast whose picture
      is smaller than its reach kills things the player watched it miss; one whose picture is larger
      makes them dodge something that was never going to touch them. The two numbers live in different
      files, so nothing but this holds them together.
    */
    for (const kind of PYRES) {
      const row = SHOTS[kind];
      const sprite = SPRITE_KINDS[row.sprite];
      expect(sprite, `${kind} names a sprite index that is not in the atlas`).toBeDefined();
      expect(SPRITE_EXTENT[sprite!], `${kind} is drawn at a different size from the one it damages at`).toBe(
        row.radius * 2,
      );
    }
  });

  it('is the ladder the ask names: half a blast, a blast, and two wider', () => {
    // Against `SHOTS.blast` rather than against numbers, because the ask states every rung as a
    // multiple of the bomb's own explosion — *"0 bombs = half current bomb explosion size."*
    expect(SHOTS[pyreFor(0)].radius).toBe(SHOTS.blast.radius / 2);
    expect(SHOTS[pyreFor(1)].radius).toBe(SHOTS.blast.radius);
    expect(SHOTS[pyreFor(2)].radius).toBeGreaterThan(SHOTS.blast.radius);
    expect(SHOTS[pyreFor(3)].radius).toBeGreaterThan(SHOTS[pyreFor(2)].radius);
    /*
      ⚠️ **And it stops.** A bomb starts at two charges and a level cleared adds one, so a run reaches
      the top of a four-rung ladder before its fourth level — without a clamp the last levels' deaths
      would clear the screen several times over.
    */
    expect(SHOTS[pyreFor(9)].radius, 'the ladder kept growing past the rungs the ask names').toBe(
      SHOTS[pyreFor(PYRES.length - 1)].radius,
    );
  });

  it('goes off where the ship died, at the size the arsenal was carrying', () => {
    const built = shell(NO_LEVEL);
    built.lifecycle.begin(TIER);
    built.dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    const charges = built.state().run.arsenal.reduce((total, entry) => total + entry.charges, 0);
    expect(charges, 'a run opens with nothing to light, so this measures nothing').toBeGreaterThan(0);

    killShip(built.world, built.frame);
    expect(built.world.blasts.size, 'the ship came apart and lit nothing').toBe(1);
    const ring = built.world.blasts.at(0);
    expect(ring.radius, 'the ring was not the size the arsenal was carrying').toBe(SHOTS[pyreFor(charges)].radius);
    expect(ring.along - built.world.cameraAlong, 'the ring went off somewhere the ship had not been').toBeCloseTo(
      built.world.deathOffset,
      6,
    );
    expect(ring.across).toBeCloseTo(built.world.deathAcross, 6);
  });

  it('still lights one when the player spent everything', () => {
    /*
      ⚠️ **The zeroth rung is a real rung.** A ring that only sometimes appears is an event the picture
      sometimes mentions, which is
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` read straight.
    */
    const built = shell(NO_LEVEL);
    built.lifecycle.begin(TIER);
    const charges = built.state().run.arsenal[0]!.charges;
    for (let i = 0; i < charges; i++) built.dispatch({ slice: 'run', type: 'spent', slot: 0 });
    expect(built.state().run.arsenal[0]!.charges, 'the arsenal was not emptied').toBe(0);
    built.dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    killShip(built.world, built.frame);
    expect(built.world.blasts.size, 'a death with an empty arsenal drew nothing at all').toBe(1);
    expect(built.world.blasts.at(0).radius).toBe(SHOTS.blast.radius / 2);
  });

  it('clears the field it went off in', () => {
    // The stated purpose, in the player's words: *"a way to give the player some breathing space for
    // when they respawn."*
    const built = shell(NO_LEVEL);
    built.lifecycle.begin(TIER);
    built.dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    // Held off, so what kills these is the pyre and not the ship's own auto-fire.
    built.world.fireIn = Number.MAX_SAFE_INTEGER;
    built.world.missileIn = Number.MAX_SAFE_INTEGER;
    killShip(built.world, built.frame);
    /*
      ⚠️ **Counted as a DIFFERENCE, because the field is not empty.** `lifecycle.begin` puts level one
      on the field whatever level this fixture was built with — the level a run enters is the run's,
      not the world's (`src/app/lifecycle.ts`) — so an assertion that the pool ended at zero would be
      an assertion about how far away level one's opening wave is.
    */
    const before = built.world.enemies.size;
    for (const offset of [-12, 0, 12]) {
      const enemy = built.world.enemies.spawn()!;
      reset(enemy, built.world.cameraAlong + built.world.deathOffset, built.world.deathAcross + offset, ENEMIES.drifter);
      enemy.fireIn = Number.MAX_SAFE_INTEGER;
      enemy.velAlong = built.world.scrollPerStep;
    }
    expect(built.world.enemies.size, 'the three were never put on the field').toBe(before + 3);
    built.frame.step();
    expect(built.world.enemies.size, 'the pyre went off around three enemies and left them there').toBe(before);
  });

  it('cannot hurt the ship it hands back', () => {
    /*
      ⚠️ **It falls out of the beat rather than being checked for, which is exactly why it is worth a
      guard.** The ring lands on the step after it appears and there is no ship in `shipPool` on that
      step; by the time one is back, `BLAST_STEPS` has expired several times over. Shorten the beat
      below the ring's own life and the player would respawn into their own explosion.
    */
    // Through the reducer rather than the lifecycle, so nothing but the pyre is on the field to kill
    // the replacement — the same reason the wreck's own guard above gives.
    const built = shell(NO_LEVEL);
    built.dispatch({ slice: 'run', type: 'begin', difficulty: TIER });
    built.dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
    const lives = built.state().run.lives;
    killShip(built.world, built.frame);
    for (let i = 0; i < A_WHILE; i++) built.frame.step();
    expect(built.state().run.lives, 'the respawned ship was killed by its own pyre').toBe(lives - 1);
    expect(built.world.ship.health, 'the respawned ship came back already hurt').toBe(built.world.shipRow.health);
  });

  it('is the only thing that lights one — a bomb still leaves a bomb’s blast', () => {
    // *"and only the player's ship"*: nothing else in the game detonates an arsenal, and the bomb's
    // own blast is untouched by the ladder above it.
    expect(SHOTS.blast.radius, 'the bomb’s own blast moved with the pyre ladder').toBe(
      SHOTS[pyreFor(1)].radius,
    );
    const scroll = SCROLL_PER_STEP;
    expect(scroll, 'the scroll rate is zero, so the drift assertions above measure nothing').toBeGreaterThan(0);
  });
});
