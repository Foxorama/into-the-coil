/**
 * A blade circles the ship — `docs/decisions/0234-a-blade-circles-the-ship.md` — and spirals out to
 * the edge of the screen — `docs/decisions/0237-the-blades-answer-the-first-play-test.md`.
 *
 * The shuriken is the third gun and the first shot that is not spent by arriving: it circles the
 * ship in a widening spiral, lands on everything it crosses once per impact flash, and is gone the
 * step it leaves the screen. The kind's ladders, face and hulls are held by `tests/weapons.test.ts`
 * over every gun; what is held here is the flight.
 *
 * ⚠️ **Nothing here asserts on a VALUE**, on `src/content/shots.ts`'s terms — the spiral widens, the
 * blade survives, the second landing waits for the flash to finish, the edge of the screen is the
 * end, and a rung is more of a turn before it.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, wearHull, type World } from '../src/app/frame.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { SHOTS } from '../src/content/shots.ts';
import { UPGRADE_TIERS, weaponFor, type UpgradeKind } from '../src/content/pickups.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { CUES, TWIN_KINDS } from '../src/content/cues.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;

/**
 * Longer than any blade lives. A blade that is still in the air after this has not found the edge
 * of the screen, which is the defect 0237 is about.
 */
const LONGER_THAN_A_BLADE = 1200;

/** A world with the shuriken fitted at `tier` rungs, nothing else in the air, the launcher about to throw. */
function armed(tier: number): { world: World; frame: GameFrame; cues: string[] } {
  const built = playableWorld(NO_LEVEL);
  const carried: UpgradeKind[] = [];
  for (let i = 0; i < tier; i++) carried.push('weapon');
  built.world.weapon = weaponFor(built.world.shipRow, carried, 'shuriken');
  wearHull(built.world);
  built.world.fireIn = 1;
  built.world.missileIn = NEVER;
  return { world: built.world, frame: new GameFrame(built.world), cues: built.cues };
}

/** A tough body that never fires and holds its place `ahead` of the ship, `aside` across it. */
function target(world: World, ahead: number, aside: number, radius: number): { health: number; flashFor: number } {
  const enemy = world.enemies.spawn();
  if (enemy === null) throw new Error('the enemy pool is full');
  reset(enemy, world.ship.along + ahead, world.ship.across + aside, { ...ENEMIES.turret, health: 999, radius }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  // Riding the camera, so it stays where the ship can circle it — a blade lives seconds and a body
  // holding its WORLD place is far behind the ship by then.
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

/**
 * Where a blade was on one step, in the two frames that matter: on the SCREEN (`inView` is world
 * units ahead of the camera, `across` the lane) and about the SHIP (`fromShip…`). Both are taken on
 * the step itself, because the camera and the ship have moved fifty units by the time a blade is gone.
 */
interface Place {
  inView: number;
  across: number;
  fromShipAlong: number;
  fromShipAcross: number;
}

/** Whether a place is on the player's screen, allowing a body its own drawn half-size over the edge. */
function onScreen(world: World, place: Place, halfSize: number): boolean {
  return (
    place.across >= -halfSize &&
    place.across <= ACROSS_SPAN + halfSize &&
    place.inView >= -halfSize &&
    place.inView <= world.view.alongSpan + halfSize
  );
}

/** How far a place is from the nearest edge of the screen, in world units. */
function toEdge(world: World, place: Place): number {
  return Math.min(place.across, ACROSS_SPAN - place.across, place.inView, world.view.alongSpan - place.inView);
}

/** One blade thrown at `tier` and watched alone until it is gone: where it was on every step of its life. */
function flight(tier: number): { world: World; places: Place[]; turned: number } {
  const { world, frame } = armed(tier);
  frame.step();
  expect(world.playerShots.size, 'nothing was thrown').toBe(1);
  // One blade, watched alone: the launcher is held off after the first throw.
  world.fireIn = NEVER;
  const blade = world.playerShots.at(0);
  const places: Place[] = [];
  let lastAngle = Number.NEGATIVE_INFINITY;
  let turned = 0;
  while (world.playerShots.size > 0 && places.length < LONGER_THAN_A_BLADE) {
    places.push({
      inView: blade.along - world.cameraAlong,
      across: blade.across,
      fromShipAlong: blade.along - world.ship.along,
      fromShipAcross: blade.across - world.ship.across,
    });
    const angle = Math.atan2(blade.across - world.ship.across, blade.along - world.ship.along);
    if (lastAngle !== Number.NEGATIVE_INFINITY) {
      // Unwrapped, so a wrap past π is a turn and not a reversal.
      let turn = angle - lastAngle;
      if (turn < -Math.PI) turn += Math.PI * 2;
      if (turn > Math.PI) turn -= Math.PI * 2;
      turned += turn;
    }
    lastAngle = angle;
    frame.step();
  }
  expect(world.playerShots.size, 'the blade never left the screen').toBe(0);
  return { world, places, turned };
}

describe('0234 — a blade circles the ship', () => {
  it('THE SPIRAL: a thrown blade circles the ship at a widening distance, the same way round, for more than a turn', () => {
    const { places, turned } = flight(1);
    let lastDistance = 0;
    let lastAngle = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < places.length; i++) {
      const distance = Math.hypot(places[i]!.fromShipAlong, places[i]!.fromShipAcross);
      const angle = Math.atan2(places[i]!.fromShipAcross, places[i]!.fromShipAlong);
      if (i > 0) {
        expect(distance, `the spiral stopped widening on step ${i}`).toBeGreaterThan(lastDistance);
        let turn = angle - lastAngle;
        if (turn < -Math.PI) turn += Math.PI * 2;
        if (turn > Math.PI) turn -= Math.PI * 2;
        expect(turn, `the blade went backwards round the ship on step ${i}`).toBeGreaterThan(0);
      }
      lastDistance = distance;
      lastAngle = angle;
    }
    expect(turned, 'the blade never went round the ship once').toBeGreaterThan(Math.PI * 2);
  });

  it('THE WHIRLPOOL: a blade is on the screen every step of its life, and its last place is at the edge', () => {
    /*
      ── 0237, FROM THE FIRST PLAY ────────────────────────────────────────────────────────────────

      *"spiral outwards from ship to edge of the screen and then disappear like a reverse whirlpool
      effect."* Two claims in the player's own units — the screen — and both are held here:

        the blade is drawn on the screen on EVERY step it exists, so a spiral wider than the lane
        never leaves by one edge and comes back in by another, and it is never drawn beyond an edge;

        the last place it is drawn is AT an edge, so nothing but the edge ends it — a clock that
        spent it a third of the way across the screen (0234's) fails this by forty units.

      `SHOTS.shuriken.radius` is the blade's own drawn half-size, which is the one allowance over the
      edge: a blade is gone when the last of it is, not while half of it still shows. The distance
      that counts as *at* the edge is what a blade can cover in a step at the outer end of its spiral
      plus that half-size — a ship's length or so — and it is the one figure here that is a distance
      rather than a fact about the picture.
    */
    const { world, places } = flight(0);
    const halfSize = SHOTS.shuriken.radius;
    for (let i = 0; i < places.length; i++) {
      expect(onScreen(world, places[i]!, halfSize), `the blade was drawn off the screen on step ${i}`).toBe(true);
    }
    const remaining = toEdge(world, places[places.length - 1]!);
    expect(remaining, `the blade vanished ${remaining.toFixed(1)} units short of the edge of the screen`).toBeLessThan(halfSize + 9);
  });

  it('THE LADDER: a rung is more of a turn before the edge, so the cap sweeps a longer arc than the first rung', () => {
    /*
      ⚠️ Every spiral ends at the same place — the edge — so what an upgrade buys is how much of a
      turn it makes getting there: *"upgrades make the shuriken's arc last longer."* Held as MORE and
      never as a count of turns; the ladder in `src/content/weapons.ts` is a hand's.
    */
    const first = flight(0).turned;
    const cap = flight(UPGRADE_TIERS).turned;
    expect(first, 'the first rung never went round the ship once').toBeGreaterThan(Math.PI * 2);
    expect(cap, `the cap turned ${(cap / (Math.PI * 2)).toFixed(2)} times against the first rung’s ${(first / (Math.PI * 2)).toFixed(2)}`).toBeGreaterThan(first + Math.PI);
  });

  it('THE SWEEP: a blade lands on a body it crosses without being spent, and lands again only once the flash has cleared', () => {
    /*
      Asked for: *"hits everything that it comes into contact with on that arc."* A big body on
      the spiral: the blade crosses it, lands, keeps going, and lands again on the same body once
      the flash has cleared while it is still across it. What must not happen is twenty landings
      for twenty steps of overlap — one per impact flash is the rule `src/sim/collide.ts` states,
      and it is the same rule the pulse's rate is held to (0035: a hit finishes flashing before the
      next one lands).
    */
    const { world, frame } = armed(2);
    // Off the ship's own line, so the ship never flies into it; on the spiral, so the blade does.
    const body = target(world, 10, 10, 6);
    frame.step();
    expect(world.playerShots.size).toBe(1);
    world.fireIn = NEVER;
    const landings: number[] = [];
    let health = body.health;
    let steps = 0;
    for (let step = 1; step <= LONGER_THAN_A_BLADE && world.playerShots.size > 0; step++) {
      frame.step();
      steps = step;
      if (body.health < health) {
        landings.push(step);
        health = body.health;
        expect(world.playerShots.size, `the blade was spent by landing on step ${step}`).toBe(1);
      }
    }
    expect(landings.length, 'the blade crossed the body and never landed').toBeGreaterThanOrEqual(2);
    for (let i = 1; i < landings.length; i++) {
      expect(landings[i]! - landings[i - 1]!, `landings ${i - 1} and ${i} came on consecutive steps`).toBeGreaterThan(1);
    }
    expect(landings.length, 'the blade landed on every step it overlapped, which is a saw and not a blade').toBeLessThan(steps / 2);
  });

  it('and a blade is blunt after its edge’s worth of landings, so a body it never leaves is not free', () => {
    /*
      A body so big the blade is across it for the whole of its spiral, so it lands once per flash
      for as long as it has edge — and then it is blunt, well before the edge of the screen would
      have ended it. Held as SOONER than a blade that lands on nothing lives, in steps, so nothing
      here names the edge or the flash.
    */
    const untouched = flight(UPGRADE_TIERS).places.length;
    const { world, frame } = armed(UPGRADE_TIERS);
    target(world, 0, 0, ACROSS_SPAN);
    frame.step();
    world.fireIn = NEVER;
    let spentAt = -1;
    for (let step = 1; step <= LONGER_THAN_A_BLADE; step++) {
      frame.step();
      if (world.playerShots.size === 0) {
        spentAt = step;
        break;
      }
    }
    expect(spentAt, 'the blade was never spent').toBeGreaterThan(0);
    expect(spentAt, `the blade lasted ${spentAt} steps across a body, against ${untouched} across nothing`).toBeLessThan(untouched * 0.75);
  });

  it('THE SPIN: a blade shows its two turns in turn, so a bitmap that cannot rotate still spins', () => {
    const { world, frame } = armed(1);
    frame.step();
    world.fireIn = NEVER;
    const blade = world.playerShots.at(0);
    const seen = new Set<number>();
    let changes = 0;
    let last = blade.sprite;
    for (let i = 0; i < LONGER_THAN_A_BLADE && world.playerShots.size > 0; i++) {
      frame.step();
      seen.add(blade.sprite);
      if (blade.sprite !== last) changes++;
      last = blade.sprite;
    }
    expect([...seen].sort(), 'the blade is not drawn as both of its turns').toEqual([SHOTS.shuriken.sprite, SHOTS.shuriken.spriteHit].sort());
    expect(changes, 'the blade turned once and stopped').toBeGreaterThan(4);
  });

  it('THE STEEL: a blade wears an ink of its own, not the pulse’s, and both of its turns wear it', () => {
    /*
      0238, from the second play: *"shurikens need to be bigger and steel coloured."* A blade is not
      a bullet — it is the one shot that stays about the ship — and 0081's rule is that what the
      player must tell apart is told apart by more than ink; this holds that the ink is at least one
      of the channels, and that the star does not change colour as it spins.
    */
    const blade = INK_OF[SPRITE_KINDS[SHOTS.shuriken.sprite]!];
    expect(blade, 'a blade is drawn in the pulse’s ink').not.toBe(INK_OF[SPRITE_KINDS[SHOTS.pulse.sprite]!]);
    expect(INK_OF[SPRITE_KINDS[SHOTS.shuriken.spriteHit]!], 'the blade changes ink as it spins').toBe(blade);
  });

  it('THE CUES: a throw sounds as its own cue, and a bite sounds as a hit', () => {
    expect(CUES.throw.twin).toBe('blade-appears');
    expect(TWIN_KINDS).toContain(CUES.throw.twin);
    const { world, frame, cues } = armed(2);
    target(world, 10, 10, 6);
    frame.step();
    expect(cues, 'the throw made no sound').toContain('throw');
    expect(cues, 'a hit sounded before anything was hit').not.toContain('hit');
    for (let i = 0; i < LONGER_THAN_A_BLADE && world.playerShots.size > 0 && !cues.includes('hit'); i++) frame.step();
    expect(cues, 'a blade bit a body and nothing sounded').toContain('hit');
  });

  it('and at the cap the pulse’s pool never fills with blades, however long the fight', () => {
    const { world, frame } = armed(UPGRADE_TIERS);
    world.fireIn = world.weapon.fireEvery;
    let peak = 0;
    // Long enough for more blades to have been thrown than the pool holds, if none of them ever
    // left — fifteen seconds is sixty throws at the cap against a pool of eighty-eight, and would
    // have passed a spiral that never ended.
    for (let i = 0; i < 1500; i++) {
      frame.step();
      if (world.playerShots.size > peak) peak = world.playerShots.size;
    }
    expect(peak, 'no blade was ever thrown, so this measured nothing').toBeGreaterThan(0);
    expect(peak, `the cap keeps ${peak} blades in the air against a pool of ${CAPACITY.playerShots}`).toBeLessThan(CAPACITY.playerShots);
    expect(WEAPONS.shuriken.flight).toBe('orbit');
  });
});
