import { describe, expect, it } from 'vitest';

import { GameFrame, WHEEL_KIND, firstVolleyIn, respawn, wearHull, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, SHIP_KINDS, shipCarrying } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { TETHER_BOLT_KIND, WEAPONS, WEAPON_KINDS } from '../src/content/weapons.ts';
import { VOLLEY_CYCLE } from '../src/content/cadence.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD, SHIP_SPEED } from '../src/sim/flight.ts';
import { STROKES_PER_TETHER, paintBolts } from '../src/render/scene.ts';
import { BOLT_FLAME, BOLT_ROPE, screenX, screenY, type BoltLook, type BoltTone, type Surface } from '../src/render/surface.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE CATHERINE WHEEL — `docs/decisions/0545-the-catherine-wheel.md`.
 *
 * *"A spinning fire wheel disc like a catherine wheel firework that shoots out short sparking fire
 * embers and has a fire tether back to the spaceship that you can use to hit things with, the tether
 * stays attached to the disc and the car and you can go back and forth with it."* And: *"fires out every
 * 4 secs and fades away at 3.6 seconds."* Answered while it was planned: it hangs, on a leash.
 *
 * Every number is read off the row, so a wheel tuned to hang further or burn longer moves the guards.
 */

const NEVER = Number.MAX_SAFE_INTEGER;
const GUN = WEAPONS.catherine;
const WHEEL = GUN.wheel!;
const DISC = SHOTS[GUN.shot];
const CINDER = SHOTS[WHEEL.ember];

/** A world flying the Firebird, nothing else in the air, its gun about to throw. */
function armed(): { world: World; frame: GameFrame; cues: string[]; stick: { along: number; across: number } } {
  const built = playableWorld(NO_LEVEL);
  built.world.shipRow = SHIPS[shipCarrying('catherine')];
  built.world.weapon = weaponFor(built.world.shipRow, []);
  wearHull(built.world);
  built.world.fireIn = 1;
  built.world.missileIn = NEVER;
  built.world.ship.across = ACROSS_SPAN / 2;
  built.world.ship.prevAcross = built.world.ship.across;
  return { world: built.world, frame: new GameFrame(built.world), cues: built.cues, stick: built.stick };
}

function step(world: World, frame: GameFrame): void {
  world.ship.invulnFor = 2;
  frame.step();
}

function wheels(world: World): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.playerShots.size; i++) if (world.playerShots.at(i).kind === WHEEL_KIND) out.push(world.playerShots.at(i));
  return out;
}

function cinders(world: World): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.playerShots.size; i++) if (world.playerShots.at(i).sprite === CINDER.sprite) out.push(world.playerShots.at(i));
  return out;
}

/** Every ember in the air, hot or cooled — 0551. */
function embers(world: World): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.playerShots.size; i++) {
    const c = world.playerShots.at(i);
    if (c.sprite === SPRITE.cinder || c.sprite === SPRITE.cinderCool) out.push(c);
  }
  return out;
}

/** A tough body that never fires and rides the camera `ahead` of the ship and `aside` across it. */
function target(world: World, ahead: number, aside: number): Entity {
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along + ahead, world.ship.across + aside, { ...ENEMIES.turret, health: 999, radius: 2 }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

describe('0545 — the guns move', () => {
  it('THE ASK: the Firebird flies the Catherine wheel, the estate the shuriken, the Thunderbolt the arc', () => {
    expect(SHIPS.firebird.weapon).toBe('catherine');
    expect(SHIPS.estate.weapon).toBe('shuriken');
    expect(SHIPS.thunderbolt.weapon).toBe('arc');
    expect(GUN.special).toBe('candle');
  });

  it('and every gun is still exactly one ship’s own, so every win opens one gun', () => {
    expect([...SHIP_KINDS.map((k) => SHIPS[k].weapon)].sort()).toEqual([...WEAPON_KINDS].sort());
  });
});

describe('0545 — the Catherine wheel', () => {
  it('THE ASK, IN SECONDS: 0553’s clock — let go at 1.87 s, thrown at 2 s, gone at 2.27 s — a beat later, the same gaps — 0591', () => {
    /*
      0549: *"the tether should fade out at 3.4sec and then the new wheel should fire at 3.6 sec."* 0551:
      a third off every one of those, *"keeping the same cadence for wheel decay and refire gap."* 0553:
      *"let's take another .4sec off the catherine wheel fire rate and decay."* 0591: *"increase the time
      on screen and refire rate of the Catherine wheel by .5 seconds"* — on the beat grid, one beat, 0.4 s.
      So 0553's times, each 0.4 s later — and the two gaps between them, let-go to throw and the overlap,
      as 0551 had them. At 60 steps a second.
    */
    const SOONER = 0.4;
    const LATER = 0.4;
    expect((WHEEL.life - WHEEL.fade) / 60, 'the tether lets go').toBeCloseTo((3.4 * 2) / 3 - SOONER + LATER, 6);
    expect(GUN.fireEvery / 60, 'the next wheel is thrown').toBeCloseTo((3.6 * 2) / 3 - SOONER + LATER, 6);
    expect(WHEEL.life / 60, 'the last wheel is gone').toBeCloseTo((4 * 2) / 3 - SOONER + LATER, 6);
    // *"So it's firing while the old wheel is visible and ending"*: the last is still burning when the next goes.
    expect(WHEEL.life, 'the last wheel is gone before the next is thrown').toBeGreaterThan(GUN.fireEvery);
    expect(GUN.fireEvery % VOLLEY_CYCLE, 'the cadence is off the beat grid').toBe(0);
  });

  it('throws one wheel on the first beat of a life, and then one every six beats on the run’s grid, the last still burning down', () => {
    expect(firstVolleyIn(0, GUN.fireEvery), 'a new life waits longer than a beat for its gun').toBeLessThanOrEqual(VOLLEY_CYCLE);
    const { world, frame } = armed();
    const thrownAt: number[] = [];
    let overlapped = 0;
    for (let i = 0; i < GUN.fireEvery * 3 + 10; i++) {
      step(world, frame);
      const now = wheels(world);
      expect(now.length, 'three wheels in the air at once').toBeLessThanOrEqual(2);
      expect(now.filter((d) => d.lifeFor > WHEEL.fade).length, 'two wheels on a tether at once').toBeLessThanOrEqual(1);
      // A wheel one step old: every throw is seen the same step after it, so the gaps are exact.
      const fresh = now.find((d) => d.lifeFor === WHEEL.life - 1);
      if (fresh !== undefined) {
        thrownAt.push(world.steps);
        // The one beside it, if any, is the last — burning down, on screen, not yet gone.
        const old = now.find((d) => d !== fresh);
        if (old !== undefined) {
          expect(old.sprite, 'the last wheel is not burning down when the next is thrown').toBe(SPRITE.catherineFade);
          overlapped++;
        }
      }
    }
    expect(overlapped, 'no throw ever found the last wheel still visible').toBeGreaterThanOrEqual(2);
    // The first is the life's own, on the next beat; the rest are on the gun's own grid, on the beat's (0094).
    expect(thrownAt.length).toBeGreaterThanOrEqual(3);
    expect(thrownAt[1]! - thrownAt[0]!).toBeLessThanOrEqual(GUN.fireEvery);
    expect(thrownAt[2]! - thrownAt[1]!).toBe(GUN.fireEvery);
    expect(thrownAt[1]! % GUN.fireEvery, 'the second wheel is off the grid').toBe(0);
  });

  it('flies out and hangs where it was thrown to, in the camera’s frame, spinning', () => {
    const { world, frame } = armed();
    step(world, frame);
    const disc = wheels(world)[0]!;
    const muzzle = world.ship.along + world.shipRow.muzzle.along;
    const muzzleInView = muzzle - world.cameraAlong;
    let fastest = 0;
    for (let i = 0; i < 90; i++) {
      const before = disc.along;
      step(world, frame);
      fastest = Math.max(fastest, disc.along - before - world.scrollPerStep);
    }
    expect(fastest, 'it left faster than its row lets it').toBeLessThanOrEqual(DISC.speed + 1e-9);
    // Hanging: a held ship and a wheel that has stopped moving in the camera, where it was thrown to.
    const inView = disc.along - world.cameraAlong;
    step(world, frame);
    expect(Math.abs(disc.along - world.cameraAlong - inView), 'it is still moving after it should hang').toBeLessThan(0.2);
    const expected = Math.min(muzzleInView + WHEEL.reach * world.view.alongSpan, PLAYER_LEAD);
    expect(disc.along - world.cameraAlong, 'it did not reach where it was thrown').toBeGreaterThan(expected - 3);
    const turn = disc.turn;
    step(world, frame);
    expect(disc.turn, 'it does not spin').not.toBe(turn);
  });

  it('THE ASK, IN THE PLAYER’S UNITS: it reaches 60% of the screen, or the no-fly wall where that is nearer — 0549, 0551', () => {
    /*
      0549: *"It should reach across 75% of the screen or to the no-fly zone wall, whichever is closer."*
      0551: *"let's make it 60% instead of 75% of screen size."* From the back of the player's box 60% of
      the screen falls short of the wall; from the middle of it the wall is nearer. Measured as a share of
      the screen the test's view shows, from the muzzle.
    */
    for (const [where, share] of [
      ['the back of the box', 0],
      ['the middle of the screen', 0.5],
    ] as const) {
      const { world, frame } = armed();
      const span = world.view.alongSpan;
      world.ship.along = world.cameraAlong + PLAYER_ALONG_MARGIN + share * span;
      world.ship.prevAlong = world.ship.along;
      step(world, frame);
      const muzzleInView = world.ship.along + world.shipRow.muzzle.along - world.cameraAlong;
      for (let i = 0; i < 120; i++) step(world, frame);
      const disc = wheels(world)[0]!;
      const hung = disc.along - world.cameraAlong;
      const wallIsNearer = muzzleInView + WHEEL.reach * span > PLAYER_LEAD;
      expect(wallIsNearer, `from ${where} the wrong limit is the nearer`).toBe(share > 0);
      if (wallIsNearer) expect(Math.abs(hung - PLAYER_LEAD) / span, `from ${where} it did not hang at the wall`).toBeLessThan(0.02);
      else expect(Math.abs((hung - muzzleInView) / span - 0.6), `from ${where} it did not reach 60% of the screen`).toBeLessThan(0.02);
    }
  });

  it('THE ASK, IN THE PLAYER’S UNITS: going back and forth sweeps the tether across what is between', () => {
    /*
      *"You can go back and forth with it."* A body standing off to one side of the line from the ship to
      the hanging wheel is untouched while the ship holds still, and struck once the ship flies across so
      the tether sweeps through it — the wheel is the fixed end and the ship the moving one.
    */
    const { world, frame, stick } = armed();
    for (let i = 0; i < 60; i++) step(world, frame);
    const disc = wheels(world)[0]!;
    const body = target(world, (disc.along - world.ship.along) / 2, -24);
    for (let i = 0; i < 20; i++) step(world, frame);
    expect(body.health, 'the tether reached a body well off its line').toBe(999);
    stick.across = -1;
    for (let i = 0; i < 90 && body.health === 999; i++) step(world, frame);
    expect(body.health, 'the tether swept over the body and landed nothing').toBeLessThan(999);
  });

  it('is on a leash: a ship that flies away tows it, and the tether is never longer than the leash', () => {
    const { world, frame, stick } = armed();
    for (let i = 0; i < 40; i++) step(world, frame);
    stick.along = -1;
    stick.across = 1;
    let longest = 0;
    for (let i = 0; i < 150 && wheels(world).length > 0; i++) {
      step(world, frame);
      const disc = wheels(world)[0];
      if (disc === undefined) break;
      const dA = disc.along - (world.ship.along + world.shipRow.muzzle.along);
      const dC = disc.across - (world.ship.across + world.shipRow.muzzle.across);
      longest = Math.max(longest, Math.hypot(dA, dC));
    }
    /*
      The slack is how far the disc trails the place it is pulled to: it closes `settle` of the gap a step,
      so behind a ship at full speed it lags `SHIP_SPEED / settle` — 18.9. It was `DISC.speed * 2` until
      0549, a number that said nothing about the lag and was outrun once the leash bit: measured on this
      flight, 180.9 with the leash and 196.9 without it, against a leash of 170.7 and a bound of 189.6.
    */
    expect(longest, 'the tether ran past its leash').toBeLessThanOrEqual(WHEEL.leash * world.view.alongSpan + SHIP_SPEED / WHEEL.settle);
  });

  it('burns down once its tether lets go, and is gone at the end of its life', () => {
    const { world, frame } = armed();
    step(world, frame);
    const first = wheels(world)[0]!;
    first.spin = -1;
    let faded = false;
    for (let i = 0; i < WHEEL.life + 2; i++) {
      step(world, frame);
      if (first.spin === -1 && first.lifeFor <= WHEEL.fade) faded ||= first.sprite === SPRITE.catherineFade;
    }
    expect(faded, 'it never burned down').toBe(true);
    // The first wheel is the only one ever marked; once its life has run, nothing in the air carries the mark.
    expect(wheels(world).some((d) => d.spin === -1), 'it outlived its life').toBe(false);
  });

  it('THE ASK: the disc burns down first, and the last of its sparks are in the air after it has gone — 0551', () => {
    /*
      *"The decay wheel leaves a yellow disc on screen after the sparks have finished, physics wise, the
      disc would decay first then the last of the fired sparks would disappear."* One wheel and no next:
      while it burns down it shrinks to nothing, its hurtbox with it, and it never stops throwing; the
      step it is gone, sparks it threw are still flying, and they are gone within an ember's life of it.
    */
    const { world, frame } = armed();
    step(world, frame);
    world.fireIn = NEVER;
    const first = wheels(world)[0]!;
    first.spin = -1;
    let threwWhileBurning = 0;
    let goneAt = -1;
    let sparksWhenGone = 0;
    for (let age = 1; age < WHEEL.life + WHEEL.emberLife + 4; age++) {
      step(world, frame);
      const alive = wheels(world).some((d) => d === first && d.spin === -1);
      if (alive && first.lifeFor <= WHEEL.fade) {
        expect(first.swell, 'it is not drawn shrinking as it burns down').toBeCloseTo(first.lifeFor / WHEEL.fade, 9);
        expect(first.radius, 'it lands wider than it is drawn').toBeLessThanOrEqual(DISC.radius * first.swell + 1e-9);
        // Thrown this step: one tick into its life, as the wheel is when it is first seen.
        threwWhileBurning += embers(world).filter((c) => c.lifeFor === WHEEL.emberLife - 1).length;
      }
      if (!alive && goneAt < 0) {
        goneAt = age;
        sparksWhenGone = embers(world).length;
      }
    }
    expect(threwWhileBurning, 'it stopped throwing sparks when it began to burn down').toBeGreaterThan(0);
    expect(goneAt, 'it outlived its life').toBeGreaterThan(0);
    expect(sparksWhenGone, 'its sparks were gone before the disc — the disc hangs on alone').toBeGreaterThan(0);
    expect(embers(world).length, 'its sparks outlived it by more than an ember’s life').toBe(0);
  });

  it('THE ASK, IN THE PLAYER’S UNITS: the spark spray is a fifth smaller across than 0549’s — 0551', () => {
    /*
      *"The spark spray diameter needs a 20% reduction in size."* What the player sees is the spray's edge:
      the furthest an ember gets from a hanging wheel's hub, plus the half of its streak that leads — it
      has cooled by then. Flown at 0549's ember life and at this one, on the same flight: within three
      points of four fifths, which is as near as a whole step of life comes. Measured 28.7 and 23.6, 18%
      in; a life one step shorter is 21.6, 25% in, and fails this.
    */
    function edge(): number {
      const { world, frame } = armed();
      step(world, frame);
      world.fireIn = NEVER;
      const disc = wheels(world)[0]!;
      for (let i = 0; i < 60; i++) step(world, frame);
      let furthest = 0;
      for (let i = 0; i < 40; i++) {
        step(world, frame);
        for (const c of embers(world)) if (c.lifeFor === 1) furthest = Math.max(furthest, Math.hypot(c.along - disc.along, c.across - disc.across));
      }
      return furthest + SPRITE_EXTENT.cinderCool / 2;
    }
    const now = edge();
    const kept = WHEEL.emberLife;
    let before: number;
    try {
      WHEEL.emberLife = 17;
      before = edge();
    } finally {
      WHEEL.emberLife = kept;
    }
    expect(Math.abs(now / before - 0.8), 'the spray is not a fifth smaller across').toBeLessThanOrEqual(0.03);
  });

  it('THE ASK, IN PIXELS: the tether starts on the muzzle the player sees, between steps, while the wheel flies out — 0551', () => {
    /*
      *"The end of the tether also starts on the hood of the car and then moves forward so the end
      attaches to the weapon nozzle."* Painted half way between two steps while the wheel is still flying
      out at its row's speed and the ship is moving: the cord's first point is on the muzzle as it is
      drawn — the ship's interpolated place — to a pixel. Until 0551 it was up to a step of the wheel's
      flight behind it, which at half a step is two and a half units.
    */
    const { world, frame, stick } = armed();
    stick.across = 1;
    for (let i = 0; i < 4; i++) step(world, frame);
    const disc = wheels(world)[0]!;
    expect(disc.along - disc.prevAlong - world.scrollPerStep, 'the wheel is not flying out fast').toBeGreaterThan(DISC.speed * 0.5);
    const alpha = 0.5;
    let first: [number, number] | null = null;
    const surface: Surface = {
      clear(): void {},
      blit(): void {},
      bolt(points: Float32Array, _count: number, _width: number, _alpha: number, _tone: BoltTone, look?: BoltLook): void {
        if (look === BOLT_ROPE) first = [points[0]!, points[1]!];
      },
    };
    paintBolts(surface, world.view, world.bolts, world.cameraAlong, alpha);
    const ship = world.ship;
    const along = ship.prevAlong + (ship.along - ship.prevAlong) * alpha + world.shipRow.muzzle.along;
    const across = ship.prevAcross + (ship.across - ship.prevAcross) * alpha + world.shipRow.muzzle.across;
    const x = screenX(world.view, along - world.cameraAlong, across);
    const y = screenY(world.view, along - world.cameraAlong, across);
    expect(first, 'no cord was painted').not.toBeNull();
    expect(Math.hypot(first![0] - x, first![1] - y), 'the tether starts off the muzzle the player sees').toBeLessThan(1);
  });

  it('lets its tether go at 2.27 s, fading it over the steps before — 0549, 0551, 0553, 0591', () => {
    const { world, frame } = armed();
    step(world, frame);
    const first = wheels(world)[0]!;
    let letGoAt = 0;
    let lifeThen = 0;
    let faded = false;
    for (let age = 1; age < GUN.fireEvery - 1 && letGoAt === 0; age++) {
      step(world, frame);
      let tethered = false;
      for (let i = 0; i < world.bolts.size; i++) {
        const b = world.bolts.at(i);
        if (b.kind !== TETHER_BOLT_KIND) continue;
        expect(b.along, 'the tether is not on the first wheel').toBeCloseTo(first.along, 6);
        tethered = true;
        if (b.holdFor < 8) faded = true;
      }
      if (!tethered) {
        letGoAt = age;
        lifeThen = first.lifeFor;
      }
    }
    // It lets go the step its wheel starts to burn down — 0551's 2.27 s less 0553's 0.4 plus 0591's 0.4 — after the throw, to the step.
    expect(lifeThen, 'the tether let go other than as its wheel began to burn down').toBe(WHEEL.fade);
    expect(Math.abs(letGoAt / 60 - ((3.4 * 2) / 3 - 0.4 + 0.4)), 'the tether did not let go at 2.27 s').toBeLessThanOrEqual(1 / 60);
    expect(faded, 'the tether went out without fading').toBe(true);
  });

  it('throws short embers off its rim that are spent by arriving', () => {
    const { world, frame } = armed();
    let most = 0;
    let cooled = 0;
    for (let i = 0; i < 60; i++) {
      step(world, frame);
      most = Math.max(most, cinders(world).length);
      for (const c of cinders(world)) expect(c.lifeFor, 'an ember lives longer than its row says').toBeLessThanOrEqual(WHEEL.emberLife);
      // 0549: white-hot off the rim and cooled for the second half of its flight — the depth in a spray.
      for (let k = 0; k < world.playerShots.size; k++) {
        const c = world.playerShots.at(k);
        if (c.sprite !== SPRITE.cinderCool) continue;
        expect(c.lifeFor * 2, 'an ember cooled in the first half of its flight').toBeLessThanOrEqual(WHEEL.emberLife);
        cooled++;
      }
    }
    expect(most, 'it threw no embers').toBeGreaterThan(0);
    expect(cooled, 'no ember ever cooled').toBeGreaterThan(0);
    expect(CINDER.health, 'an ember survives an arrival').toBe(1);
  });

  it('draws its tether every step it burns, as wide as it lands, from the muzzle to the wheel', () => {
    const { world, frame } = armed();
    for (let i = 0; i < 30; i++) step(world, frame);
    let links = 0;
    for (let i = 0; i < world.bolts.size; i++) {
      const b = world.bolts.at(i);
      if (b.kind !== TETHER_BOLT_KIND) continue;
      links++;
      expect(b.radius).toBe(WHEEL.tether);
      const disc = wheels(world)[0]!;
      expect(b.along).toBeCloseTo(disc.along, 6);
      expect(b.along + b.fromAlong).toBeCloseTo(world.ship.along + world.shipRow.muzzle.along, 6);
    }
    expect(links, 'the tether is not one link').toBe(1);
  });

  it('is painted as a rope of fire as wide as it lands, crackling with filaments and sparks, at its stated cost — 0549', () => {
    const { world, frame } = armed();
    for (let i = 0; i < 30; i++) step(world, frame);
    const calls: { count: number; width: number; tone: BoltTone; look: BoltLook | undefined }[] = [];
    const surface: Surface = {
      clear(): void {},
      blit(): void {},
      bolt(_points: Float32Array, count: number, width: number, _alpha: number, tone: BoltTone, look?: BoltLook): void {
        calls.push({ count, width, tone, look });
      },
    };
    paintBolts(surface, world.view, world.bolts, world.cameraAlong, 1);
    expect(calls.length, 'a tether is not its stated number of strokes').toBe(STROKES_PER_TETHER);
    for (const c of calls) expect(c.tone, 'a stroke of the tether is not in the flame’s inks').toBe(BOLT_FLAME);
    const ropes = calls.filter((c) => c.look === BOLT_ROPE);
    expect(ropes.length, 'the cord is not one rope').toBe(1);
    // The rope's body is four times the width it is handed (`ROPE_LAYERS`), which is the width it lands at — 0250.
    expect(ropes[0]!.width * 4).toBeCloseTo(2 * WHEEL.tether * world.view.scale, 6);
    expect(calls.filter((c) => c.count > 1 && c.look !== BOLT_ROPE).length, 'no filaments crackle on it').toBe(2);
    expect(calls.filter((c) => c.count === 1).length, 'no sparks on it').toBe(2);
  });

  it('lands only so often on a body held across it, on the blades’ bucket', () => {
    const { world, frame } = armed();
    for (let i = 0; i < 60; i++) step(world, frame);
    const disc = wheels(world)[0]!;
    // Half way down the tether, well clear of the wheel, so what lands is the tether's alone.
    const body = target(world, (disc.along - world.ship.along) / 2, (disc.across - world.ship.across) / 2);
    expect(Math.hypot(body.along - disc.along, body.across - disc.across), 'the body is under the wheel').toBeGreaterThan(DISC.radius + 2 + 10);
    const start = body.health;
    const seconds = 2;
    for (let i = 0; i < 60 * seconds; i++) step(world, frame);
    // The bucket: one landing every `landGap` steps, and the burst of four it may owe — 0391's.
    const most = ((60 * seconds) / GUN.landGap! + 4) * WHEEL.tetherDamage;
    expect(start - body.health, 'it landed more than the bucket allows').toBeLessThanOrEqual(most);
    expect(start - body.health, 'it landed nothing').toBeGreaterThan(0);
  });

  it('goes with the ship that threw it', () => {
    const { world, frame } = armed();
    for (let i = 0; i < 20; i++) step(world, frame);
    respawn(world);
    expect(wheels(world).length).toBe(0);
  });
});
