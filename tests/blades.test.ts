/**
 * A blade rides a helix ahead of the ship — `docs/decisions/0234-a-blade-circles-the-ship.md`, as
 * `docs/decisions/0244-a-blade-rides-a-helix.md` left it.
 *
 * The shuriken is the third gun and the first shot that is not spent by arriving: a pair of blades
 * leaves the wingtips, each going up the lane and swinging across it, the two a half-turn apart so
 * they cross ahead of the nose — the two strands of a helix that lands on everything it crosses
 * once per impact flash and is gone at the leading edge of the screen. The kind's ladders, face
 * and hulls are held by `tests/weapons.test.ts` over every gun; what is held here is the flight.
 *
 * ⚠️ **Almost nothing here asserts on a VALUE**, on `src/content/shots.ts`'s terms — the strand
 * keeps its width and never loses ground, the pair crosses, the blade survives, the second landing
 * waits for the flash to finish, the leading edge is the end, and a rung is a wider band. The two
 * that do are in the player's units and are the player's numbers: seconds to cross the screen
 * (`THE PACE`) and a share of the lane (`THE SIZE`).
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
import { reset, type Entity } from '../src/sim/entity.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
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
  // Riding the camera, so it stays where a coil can reach it — a blade lives seconds and a body
  // holding its WORLD place is far behind the ship by then.
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

/**
 * Where a blade was on one step, in the two frames that matter: on the SCREEN (`inView` is world
 * units ahead of the camera, `across` the lane) and about the SHIP (`fromShip…`). Both are taken on
 * the step itself, because the camera and the ship have moved by the time a blade is gone.
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

/** Whether `blade` is still in the pool — the pool swaps on release, so an index is not a blade. */
function alive(world: World, blade: Entity): boolean {
  for (let i = 0; i < world.playerShots.size; i++) if (world.playerShots.at(i) === blade) return true;
  return false;
}

/**
 * One throw at `tier` — a PAIR — watched alone until both are gone: where each was on every step,
 * and where each was THROWN from, across the ship (the place before its first step, which the
 * painter keeps as `prevAcross`).
 */
function flights(tier: number): { world: World; pair: [Place[], Place[]]; thrown: [number, number] } {
  const { world, frame } = armed(tier);
  frame.step();
  expect(world.playerShots.size, 'a throw is not a pair').toBe(2);
  // One pair, watched alone: the launcher is held off after the first throw.
  world.fireIn = NEVER;
  const blades = [world.playerShots.at(0), world.playerShots.at(1)];
  const thrown: [number, number] = [blades[0]!.prevAcross - world.ship.across, blades[1]!.prevAcross - world.ship.across];
  const pair: [Place[], Place[]] = [[], []];
  let steps = 0;
  while (world.playerShots.size > 0 && steps < LONGER_THAN_A_BLADE) {
    for (let k = 0; k < 2; k++) {
      const blade = blades[k]!;
      if (!alive(world, blade)) continue;
      pair[k]!.push({
        inView: blade.along - world.cameraAlong,
        across: blade.across,
        fromShipAlong: blade.along - world.ship.along,
        fromShipAcross: blade.across - world.ship.across,
      });
    }
    frame.step();
    steps++;
  }
  expect(world.playerShots.size, 'the blades never left the screen').toBe(0);
  return { world, pair, thrown };
}

/** Half the drawn width of the hull the ship is wearing, in world units: where a wingtip is. */
function wingtipOf(world: World): number {
  return SPRITE_EXTENT[SPRITE_KINDS[world.ship.spriteBase]!] / 2;
}

/**
 * A blade's swings, read off the picture: each stretch of its track between two crossings of the
 * ship's line is a swing, and what is kept per swing is the widest it got from that line.
 */
function swings(places: readonly Place[]): number[] {
  const out: number[] = [];
  let sign = Math.sign(places[0]!.fromShipAcross);
  let wide = 0;
  for (const place of places) {
    const s = Math.sign(place.fromShipAcross);
    if (s !== 0 && s !== sign) {
      sign = s;
      out.push(wide);
      wide = 0;
    }
    wide = Math.max(wide, Math.abs(place.fromShipAcross));
  }
  return out;
}

describe('0234 — a blade rides a helix ahead of the ship', () => {
  it('THE HELIX: a blade leaves the wingtip, never loses ground up the lane, and swings across the ship’s line again and again at one width', () => {
    /*
      0244, from the sixth play-test: *"I want the two wingtips firing to form a helix pattern with
      the shurikens."* A swing is read off the picture — the track between two crossings of the
      ship's line — so nothing here names the strand's axis, its speed or its turn. What a helix's
      strand IS, in the player's units: it only ever gains ground (0242's loops came back on
      themselves, and that is the thing this is not), it crosses the line many times before the
      edge, and no swing is wider or narrower than the first by much.

      ⚠️ **FROM THE WINGTIP ITSELF** — the second photograph: *"there's a big gap between helix
      start and wingtips."* The first draft threw from the crest, `coil` out; the blade is thrown
      from where the wing's drawn edge is, within a blade of it, and swings wider from there.
    */
    const { world, pair, thrown } = flights(1);
    const places = pair[0];
    expect(Math.abs(places[0]!.fromShipAlong), 'the blade did not leave from the ship').toBeLessThan(SHOTS.shuriken.radius);
    const wingtip = wingtipOf(world);
    expect(Math.abs(Math.abs(thrown[0]) - wingtip), `the blade was thrown ${Math.abs(thrown[0]).toFixed(1)} out, and the wingtip is ${wingtip.toFixed(1)}`).toBeLessThan(
      SHOTS.shuriken.radius / 2,
    );
    expect(Math.max(...places.map((p) => Math.abs(p.fromShipAcross))), 'the blade never swung wider than the wingtip').toBeGreaterThan(wingtip + SHOTS.shuriken.radius);
    for (let i = 1; i < places.length; i++) {
      expect(places[i]!.fromShipAlong, `the blade lost ground on step ${i}, which is a loop and not a helix`).toBeGreaterThan(places[i - 1]!.fromShipAlong);
    }
    const strand = swings(places);
    expect(strand.length, 'the blade crossed the ship’s line fewer than four times before the edge').toBeGreaterThanOrEqual(4);
    for (let k = 1; k < strand.length; k++) {
      expect(strand[k], `swing ${k} is a different width from the first`).toBeGreaterThan(strand[0]! * 0.85);
      expect(strand[k], `swing ${k} is a different width from the first`).toBeLessThan(strand[0]! * 1.15);
    }
  });

  it('THE PACE: a blade crosses from the ship to the leading edge of the widest screen in under two and a half seconds', () => {
    /*
      *"the shurikens need to be slightly faster than they are now."* Held in the unit the player
      feels — seconds across the screen the game ships, which is the widest view — as a BUDGET
      (0192): the number is the player's, and the speed that gives it is `src/content/shots.ts`'s.
      Measured at the 0244 speed: 2.3 s; at 0242's it was 2.9 s, which is what *"slightly faster"*
      was said about.
    */
    const { world, pair } = flights(0);
    const steps = pair[0].length;
    expect(world.view.alongSpan, 'this is not the widest screen, so the seconds mean nothing').toBeCloseTo(ACROSS_SPAN * (16 / 9), 3);
    expect(steps / STEPS_PER_SECOND, `a blade takes ${(steps / STEPS_PER_SECOND).toFixed(2)} s to reach the leading edge`).toBeLessThan(2.5);
  });

  it('THE SIZE: a blade is drawn no wider than a twelfth of the lane, so a screen of them leaves the enemies and their fire in view', () => {
    /*
      *"the shuriken graphics need to be a bit smaller, they take up a lot of visual screenspace and
      make it hard to see enemies and enemy fire"* — and, at a tenth, *"slightly smaller"* again.
      Two dozen blades at the cap, each a box a twelfth of the lane wide, is a seventh of the
      screen's area at most; at 0238's size sixteen were a quarter. The hurtbox inside that box is
      `tests/combat.test.ts`'s.
    */
    for (const kind of ['shuriken', 'shurikenTurn'] as const) {
      expect(SPRITE_EXTENT[kind], `${kind} is drawn ${SPRITE_EXTENT[kind]} units wide on a lane of ${ACROSS_SPAN}`).toBeLessThanOrEqual(ACROSS_SPAN / 12);
    }
  });

  it('THE PAIR: a throw is two blades from opposite wingtips, and they cross in front of the nose', () => {
    /*
      *"cross the blades in front of the nose."* Two blades, one at each crest, a half-turn apart,
      cross the band's centre line together — which is where a boss sits. Held from the picture:
      they start the same distance out on opposite sides, each visits both sides, and there is a
      step ahead of the nose where the two are at the SAME PLACE, within a blade of each other.

      ⚠️ **The same place, not the same line.** Two strands in phase would be one line drawn twice;
      two a quarter-turn apart cross the ship's line at different places. Only a half-turn brings
      them to one point, which is the helix.
    */
    const { pair, thrown } = flights(2);
    const [a, b] = pair;
    expect(thrown[0], 'the pair left from one side').toBeCloseTo(-thrown[1], 3);
    expect(a[0]!.fromShipAcross, 'the pair left from one side').toBeCloseTo(-b[0]!.fromShipAcross, 3);
    for (const places of pair) {
      expect(Math.min(...places.map((p) => p.fromShipAcross)), 'a blade never crossed to the other side').toBeLessThan(0);
      expect(Math.max(...places.map((p) => p.fromShipAcross)), 'a blade never crossed to the other side').toBeGreaterThan(0);
    }
    let crossed = false;
    for (let i = 0; i < Math.min(a.length, b.length) && !crossed; i++) {
      const gap = Math.hypot(a[i]!.fromShipAlong - b[i]!.fromShipAlong, a[i]!.fromShipAcross - b[i]!.fromShipAcross);
      if (a[i]!.fromShipAlong > 0 && b[i]!.fromShipAlong > 0 && gap < SHOTS.shuriken.radius * 2) crossed = true;
    }
    expect(crossed, 'the two blades never crossed ahead of the nose').toBe(true);
  });

  it('THE EDGE: a blade is on the screen every step of its life, and its last place is at the leading edge', () => {
    /*
      0237's rule — off the screen is off the game, and nothing but the edge ends a blade — read for
      a coil, whose edge is the LEADING one: that is its reach, and it is the screen's at every rung.
      `SHOTS.shuriken.radius` is the blade's own drawn half-size, the one allowance over the edge;
      the distance that counts as *at* the edge is what a blade covers in a step plus that half-size.
    */
    const { world, pair } = flights(0);
    const halfSize = SHOTS.shuriken.radius;
    for (const places of pair) {
      for (let i = 0; i < places.length; i++) {
        expect(onScreen(world, places[i]!, halfSize), `a blade was drawn off the screen on step ${i}`).toBe(true);
      }
      const last = places[places.length - 1]!;
      const remaining = world.view.alongSpan - last.inView;
      expect(remaining, `a blade vanished ${remaining.toFixed(1)} units short of the leading edge`).toBeLessThan(halfSize + 9);
    }
    /*
      ⚠️ **No wall case, and that is a fact about a coil rather than a gap.** A blade starts at the
      top of its loop, so the furthest across the lane it ever gets is where it was thrown — on the
      screen, or the throw itself is off it. The only edge a coil can meet is the leading one.
      0237's probe that took the side edges' release away is retired for the same reason.
    */
  });

  it('THE LADDER: a rung is a wider band, so the cap sweeps more of the lane than the first rung', () => {
    /*
      ⚠️ Every coil reaches the same edge, so what an upgrade buys is how wide a band it sweeps:
      *"upgrades make the shuriken's arc… bigger."* Held as WIDER by half and never as the width;
      the ladder in `src/content/weapons.ts` is a hand's.
    */
    const width = (tier: number): number => Math.max(...flights(tier).pair[0].map((p) => Math.abs(p.fromShipAcross)));
    const first = width(0);
    const cap = width(UPGRADE_TIERS);
    expect(first, 'the first rung sweeps no band at all').toBeGreaterThan(SHOTS.shuriken.radius);
    expect(cap, `the cap sweeps ${cap.toFixed(0)} across against the first rung’s ${first.toFixed(0)}`).toBeGreaterThan(first * 1.5);
  });

  it('THE SWEEP: a blade lands on a body it crosses without being spent, and lands again only once the flash has cleared', () => {
    /*
      Asked for: *"hits everything that it comes into contact with on that arc."* A body on the
      band: the blade crosses it, lands, keeps looping, and lands again on the same body once the
      flash has cleared while it is still across it. What must not happen is twenty landings for
      twenty steps of overlap — one per impact flash is the rule `src/sim/collide.ts` states, and it
      is the same rule the pulse's rate is held to (0035: a hit finishes flashing before the next one
      lands).
    */
    const { world, frame } = armed(2);
    const body = target(world, 60, 0, 10);
    frame.step();
    expect(world.playerShots.size).toBe(2);
    world.fireIn = NEVER;
    // One blade, so a landing is one blade's: the gate is each blade's own (0242), and two blades
    // across one body may land on consecutive steps.
    world.playerShots.releaseAt(1);
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
    expect(landings.length, 'the blades crossed the body and never landed').toBeGreaterThanOrEqual(2);
    for (let i = 1; i < landings.length; i++) {
      expect(landings[i]! - landings[i - 1]!, `landings ${i - 1} and ${i} came on consecutive steps`).toBeGreaterThan(1);
    }
    expect(landings.length, 'the blades landed on every step they overlapped, which is a saw and not a blade').toBeLessThan(steps / 2);
  });

  it('and a blade is blunt after its edge’s worth of landings, so a body it never leaves is not free', () => {
    /*
      A body so big the blade is across it for the whole of its coil, so it lands once per flash
      for as long as it has edge — and then it is blunt, well before the leading edge would have
      ended it. Held as SOONER than a blade that lands on nothing lives, in steps, so nothing here
      names the edge or the flash.
    */
    const untouched = flights(UPGRADE_TIERS).pair[0].length;
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
    expect(spentAt, 'the blades were never spent').toBeGreaterThan(0);
    expect(spentAt, `the blades lasted ${spentAt} steps across a body, against ${untouched} across nothing`).toBeLessThan(untouched * 0.75);
  });

  it('THE SPIN: a blade shows its two turns in turn, so a bitmap that cannot rotate still spins', () => {
    const { world, frame } = armed(1);
    frame.step();
    world.fireIn = NEVER;
    const blade = world.playerShots.at(0);
    const seen = new Set<number>();
    let changes = 0;
    let last = blade.sprite;
    for (let i = 0; i < LONGER_THAN_A_BLADE && alive(world, blade); i++) {
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
      a bullet, and 0081's rule is that what the player must tell apart is told apart by more than
      ink; this holds that the ink is at least one of the channels, and that the star does not
      change colour as it spins.
    */
    const blade = INK_OF[SPRITE_KINDS[SHOTS.shuriken.sprite]!];
    expect(blade, 'a blade is drawn in the pulse’s ink').not.toBe(INK_OF[SPRITE_KINDS[SHOTS.pulse.sprite]!]);
    expect(INK_OF[SPRITE_KINDS[SHOTS.shuriken.spriteHit]!], 'the blade changes ink as it spins').toBe(blade);
  });

  it('THE CUES: a throw sounds as its own cue, and a bite sounds as a hit', () => {
    expect(CUES.throw.twin).toBe('blade-appears');
    expect(TWIN_KINDS).toContain(CUES.throw.twin);
    const { world, frame, cues } = armed(2);
    target(world, 60, 0, 10);
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
    // left — fifteen seconds is a hundred and twenty blades at the cap against a pool of eighty-
    // eight, and would have passed a coil that never reached the edge.
    for (let i = 0; i < 1500; i++) {
      frame.step();
      if (world.playerShots.size > peak) peak = world.playerShots.size;
    }
    expect(peak, 'no blade was ever thrown, so this measured nothing').toBeGreaterThan(0);
    expect(peak, `the cap keeps ${peak} blades in the air against a pool of ${CAPACITY.playerShots}`).toBeLessThan(CAPACITY.playerShots);
    expect(WEAPONS.shuriken.flight).toBe('coil');
  });
});
