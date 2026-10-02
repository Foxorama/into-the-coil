/**
 * The quetzal screams — `docs/decisions/0250-the-quetzal-screams.md`.
 *
 * The Saurian Belt's real boss, from the brief: *"a flying pterodactyl with lasers mounted on its
 * wings and it opens its mouth to fire a huge laser blast."* What is held here is that a laser is a
 * beam and not a bullet — it warns, then it is held, and it hurts for as long as it is held — that
 * the wings' beams leave the wings and the mouth's leaves the mouth, wider, and that the hull
 * stands still to fire and flies again after. What a boss IS — the roster, the fights — is
 * `tests/bosses.test.ts`'s and `tests/level.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BEAM_BOLT_KIND, BOSSES, type BossAttack } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { INVULN_STEPS } from '../src/content/ships.ts';
import { QUETZAL_CANNON, QUETZAL_THROAT } from '../src/render/bake.ts';
import { BOLT_STEPS } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import type { Entity } from '../src/sim/entity.ts';
import { BEAM_MAX_KNOTS, beamAcrossAt, beamDistance, beamPoints } from '../src/sim/jag.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The quetzal alone, a short way in, with no mid-boss in front of it. */
const QUETZAL_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'quetzal',
  theme: 'saurian',
};

type Driven = { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame };

/** The quetzal on station at `fraction` of its health, its fan held until the test says, and an immortal ship. */
function quetzalAt(fraction: number): Driven {
  const { world } = playableWorld(QUETZAL_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the quetzal never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.bolts.clear();
  return { world, frame };
}

/** One volley, thrown now: the beams in the air afterwards. */
function volley(d: Driven): { across: number; radius: number; lifeFor: number; holdFor: number; fromAlong: number; along: number }[] {
  d.world.bossPool.at(0).fireIn = 1;
  d.world.ship.health = d.world.shipRow.health;
  d.frame.step();
  const beams = [];
  for (let i = 0; i < d.world.bolts.size; i++) {
    const b = d.world.bolts.at(i);
    if (b.kind === BEAM_BOLT_KIND) beams.push({ across: b.across, radius: b.radius, lifeFor: b.lifeFor, holdFor: b.holdFor, fromAlong: b.fromAlong, along: b.along });
  }
  return beams;
}

/** Where `stepShipAt` holds the ship along the lane. */
const shipAlong = (d: Driven): number => d.world.cameraAlong + (PLAYER_ALONG_MARGIN + PLAYER_LEAD) / 2;

/**
 * Where the first beam burns across the lane at the ship's along — on its zigzag since 0388. A jagged
 * beam's root is not where it is at the ship: it may be a dozen units off it there.
 */
const onBeam = (d: Driven): number => beamAcrossAt(d.world.bolts.at(0), shipAlong(d));

/**
 * The place across the lane nearest the first beam that is clear of it by four units past touching, at
 * the ship's along — measured to its nearest leg (0388), because a leg may be steep.
 */
function besideBeam(d: Driven): number {
  const b = d.world.bolts.at(0);
  const clear = b.radius + d.world.ship.radius + 4;
  const from = onBeam(d);
  for (let off = 0; off < ACROSS_SPAN; off += 0.5) {
    for (const across of [from + off, from - off]) {
      if (across < 6 || across > ACROSS_SPAN - 6) continue;
      if (beamDistance(b, shipAlong(d), across) > clear) return across;
    }
  }
  throw new Error('nowhere on the lane is clear of the beam');
}

/** Every laser a boss's table fires, its own phases' and its heads'. */
const beams = (kind: 'quetzal' | 'hydra' | 'medusa'): Extract<BossAttack, { kind: 'beam' }>[] =>
  BOSSES[kind].phases.flatMap((p) => {
    const attack = p.attack ?? BOSSES[kind].attack;
    if (attack.kind === 'beam') return [attack];
    if (attack.kind === 'heads') return attack.heads.flatMap((h) => (h.attack.kind === 'beam' ? [h.attack] : []));
    return [];
  });

/** One volley, thrown now: its beams as the bolts themselves, from smaller across to larger — 0453. */
function thrown(d: Driven): Entity[] {
  d.world.bolts.clear();
  volley(d);
  const out: Entity[] = [];
  for (let i = 0; i < d.world.bolts.size; i++) if (d.world.bolts.at(i).kind === BEAM_BOLT_KIND) out.push(d.world.bolts.at(i));
  return out.sort((a, b) => a.across - b.across);
}

/**
 * Hold the ship at `across`, in the box, immortal and never lit by anything but a beam, for one
 * step — and say whether that step hurt it. Watched every step, because a ship of one health that
 * is struck dies and is put back whole by the end of the beat.
 */
function stepShipAt(d: Driven, across: number): boolean {
  const { world, frame } = d;
  world.ship.across = across;
  world.ship.along = shipAlong(d);
  world.ship.velAlong = world.scrollPerStep;
  world.ship.velAcross = 0;
  world.ship.invulnFor = 0;
  world.ship.health = world.shipRow.health;
  world.enemyShots.clear();
  world.bossPool.at(0).fireIn = 999;
  const before = world.ship.health;
  frame.step();
  return world.ship.health < before || world.dyingIn > 0;
}

/** A surface that keeps every bolt stroke, so the picture can be asked what it drew and how wide. */
class Recorder implements Surface {
  readonly strokes: { points: number[]; count: number; width: number; alpha: number; hostile: boolean }[] = [];
  clear(): void {}
  blit(): void {}
  bolt(points: Float32Array, count: number, width: number, alpha: number, hostile: boolean): void {
    this.strokes.push({ points: Array.from(points.subarray(0, count * 2)), count, width, alpha, hostile });
  }
}

describe('0250 — the quetzal screams', () => {
  it('THE FOUR PHASES: a spray while whole, the wings at two thirds, the mouth at a third, all three at the end — and it is the Saurian Belt’s real boss', () => {
    const row = BOSSES.quetzal;
    const whole = phaseFor(row, row.health);
    const wings = phaseFor(row, row.health * 0.6);
    const mouth = phaseFor(row, row.health * 0.3);
    const all = phaseFor(row, row.health * 0.1);
    expect((whole.attack ?? row.attack).kind, 'the quetzal does not open flying and spraying').toBe('spray');
    for (const [name, phase, roots] of [
      ['wings', wings, 2],
      ['mouth', mouth, 1],
      ['everything', all, 3],
    ] as const) {
      const attack = phase.attack ?? row.attack;
      expect(attack.kind, `the ${name} phase is not lasers`).toBe('beam');
      if (attack.kind !== 'beam') return;
      expect(attack.from.length, `the ${name} phase fires ${attack.from.length} beam(s)`).toBe(roots);
      // Every root is on the hull as it is DRAWN, or the laser comes from empty space beside it.
      const halfExtent = SPRITE_EXTENT[SPRITE_KINDS[row.sprite]!] / 2;
      for (const [along, across] of attack.from) expect(Math.hypot(along, across), `a ${name} beam leaves the hull at ${along}, ${across}, past its drawing`).toBeLessThanOrEqual(halfExtent);
    }
    const wingBeam = wings.attack!;
    const mouthBeam = mouth.attack!;
    if (wingBeam.kind !== 'beam' || mouthBeam.kind !== 'beam') return;
    expect(mouthBeam.from[0]![1], 'the mouth is not in the middle of the hull').toBe(0);
    // 0452: and ahead of the centre, where the head is — the throat, not the chest.
    expect(mouthBeam.from[0]![0], 'the mouth’s beam leaves level with the chest').toBeLessThan(-row.radius / 2);
    expect(Math.abs(wingBeam.from[0]![1]), 'a wing beam leaves from the middle of the hull').toBeGreaterThan(row.radius / 2);
    expect(mouthBeam.halfWidth, '“a huge laser blast” is no wider than a wing’s').toBeGreaterThan(wingBeam.halfWidth * 2);
    // In the player's units: the mouth's beam takes a real slice of the lane, and not the lane.
    expect((mouthBeam.halfWidth * 2) / ACROSS_SPAN).toBeGreaterThan(0.08);
    expect((mouthBeam.halfWidth * 2) / ACROSS_SPAN).toBeLessThan(0.25);
    expect(LEVELS.coilward.boss).toBe('quetzal');
    expect(LEVELS.coilward.theme).toBe('saurian');
  });

  it('THE WINGS AND THE MOUTH, DRIVEN: two beams leave the wingtips, one leaves the mouth wider, and each runs from the hull to the trailing edge', () => {
    /*
      ⚠️ **The table is not the fight.** A frame that ignored `from` would leave the row green and
      fire every beam from the hull's centre; one that fired bullets would leave `phaseFor` green and
      throw lances. One volley at each phase, and what is in the air is asked where it is.
    */
    for (const [fraction, count] of [
      [0.6, 2],
      [0.3, 1],
      [0.1, 3],
    ] as const) {
      const d = quetzalAt(fraction);
      const boss = d.world.bossPool.at(0);
      const hullAcross = boss.across;
      const beams = volley(d);
      expect(beams.length, `the volley at ${fraction} of its health threw ${beams.length} beam(s)`).toBe(count);
      expect(d.world.enemyShots.size, `the volley at ${fraction} of its health also threw bullets`).toBe(0);
      const phase = phaseFor(BOSSES.quetzal, boss.health, d.world.bossFullHealth);
      const attack = phase.attack!;
      if (attack.kind !== 'beam') return;
      const roots = beams.map((b) => b.across - hullAcross).sort((a, b) => a - b);
      expect(roots.map((r) => Math.round(r)), `the beams at ${fraction} do not leave from the phase's roots`).toEqual(attack.from.map(([, across]) => across).sort((a, b) => a - b));
      beams.forEach((b, i) => {
        expect(b.radius, `a beam at ${fraction} is not the phase's width`).toBe(attack.halfWidth);
        // From the hull to the trailing edge: its far end is behind the ship's box, its root on the hull —
        // at its own root's along since 0452, a barrel's end or the throat, and not the chest.
        expect(b.along - d.world.cameraAlong, 'the beam stops short of the trailing edge').toBeLessThanOrEqual(0);
        expect(b.along + b.fromAlong, 'the beam does not reach back to its root on the hull').toBeCloseTo(boss.along + attack.from[i]![0], 3);
      });
    }
  });

  it('THE WARNING AND THE HOLD: nothing hurts until the line has been shown, and then a ship that flies into the beam is hurt on any step it is on', () => {
    /*
      *"It opens its mouth"* is the warning: the line is drawn for the attack's `warning` steps — in
      seconds, between a quarter of one and two — and a ship parked in it is not hurt. Then the beam
      is held, and a ship that crosses into it AFTER the first step of the hold is hurt as well:
      the serpent's lightning lands once, and a laser that only hurt on the step it lit would be
      lightning with a longer picture.
    */
    const d = quetzalAt(0.3);
    const [beam] = volley(d);
    expect(beam, 'the mouth threw no beam').toBeDefined();
    const inside = onBeam(d);
    const beside = besideBeam(d);
    // Parked in the beam through the warning: not hurt, for as long as the row says.
    let hurtAt = -1;
    for (let step = 1; step <= 200 && hurtAt < 0; step++) if (stepShipAt(d, inside)) hurtAt = step;
    expect(hurtAt, 'the beam never hurt a ship parked in it').toBeGreaterThan(0);
    expect(hurtAt / STEPS_PER_SECOND, `the beam hurt ${(hurtAt / STEPS_PER_SECOND).toFixed(2)} s after its line was drawn`).toBeGreaterThanOrEqual(0.25);
    expect(hurtAt / STEPS_PER_SECOND, 'the warning outlasts the patience anyone has for one').toBeLessThan(2);
    const attack = phaseFor(BOSSES.quetzal, d.world.bossPool.at(0).health, d.world.bossFullHealth).attack!;
    if (attack.kind !== 'beam') return;
    // The step the volley is thrown on steps the bolt too, so the line is on the screen for the
    // warning less one step after it: the same count the serpent's columns get.
    expect(hurtAt, 'the beam hurt before its warning had run').toBeGreaterThanOrEqual(attack.warning - 1);

    // Again, and this time the ship waits BESIDE the beam until the hold is a third gone, then crosses in.
    const e = quetzalAt(0.3);
    const [again] = volley(e);
    expect(again, 'the mouth threw no beam the second time').toBeDefined();
    const crossAt = attack.warning + Math.floor(attack.hold / 3);
    const clear = besideBeam(e);
    const onIt = onBeam(e);
    let hurtBeside = false;
    for (let step = 1; step <= crossAt; step++) if (stepShipAt(e, clear)) hurtBeside = true;
    expect(hurtBeside, 'a ship beside the beam was hurt').toBe(false);
    let hurtCrossing = -1;
    for (let step = 1; step <= attack.hold && hurtCrossing < 0; step++) if (stepShipAt(e, onIt)) hurtCrossing = step;
    expect(hurtCrossing, 'a ship that flew into the beam while it was held was not hurt — the beam only hurts on the step it lights').toBe(1);
    // And one hit is one hit: the window every other threat opens is the one the beam gets.
    expect(INVULN_STEPS, 'a held beam would hurt every step').toBeGreaterThan(1);
    void beside;
  });

  it('and a ship beside the beam, however far down the lane, is not touched by it', () => {
    const d = quetzalAt(0.3);
    volley(d);
    const target = besideBeam(d);
    let struck = false;
    for (let step = 1; step <= 120; step++) if (stepShipAt(d, target)) struck = true;
    expect(struck, 'a ship beside the beam was struck').toBe(false);
  });

  it('THE BRACE: the hull stands still across the lane while its lasers are on, and flies again between volleys', () => {
    /*
      A beam is fixed where it was fired; a hull that went on patrolling would slide away from its
      own lasers. And the pause between volleys is on top of the beam, or a phase whose beam outlasts
      its cadence would be a hull that never moves again — held in the player's units: it flies for
      at least half a second between one volley's end and the next. At the MOUTH's phase, whose beam
      is longer than its cadence: the wings' flight survives the fold at the easy tier's gap, and
      the probe that removes it stayed green there.
    */
    const d = quetzalAt(0.3);
    const boss = d.world.bossPool.at(0);
    const attack = phaseFor(BOSSES.quetzal, boss.health, d.world.bossFullHealth).attack!;
    if (attack.kind !== 'beam') return;
    volley(d);
    const held = attack.warning + attack.hold;
    const at = boss.across;
    // The cadence is the boss's own from here: the ship is parked beside the beam, immortal, and
    // nothing resets `fireIn` — which is exactly what the fold would corrupt.
    const beside = besideBeam(d);
    const park = (): void => {
      d.world.ship.across = beside;
      d.world.ship.health = d.world.shipRow.health;
      d.world.ship.invulnFor = 0;
      d.world.enemyShots.clear();
      d.frame.step();
    };
    for (let step = 1; step < held; step++) {
      park();
      expect(boss.across, `the hull moved across the lane on step ${step} of its beam`).toBeCloseTo(at, 6);
    }
    // Then it flies: the volley's flight is its own steps, on top of the beam's, until the next volley braces it again.
    let flying = 0;
    for (let step = 0; step < 300; step++) {
      park();
      if (boss.holdFor > 0) break;
      if (boss.velAcross !== 0) flying++;
    }
    expect(boss.holdFor, 'the next volley never came, so the flight measured nothing').toBeGreaterThan(0);
    expect(flying / STEPS_PER_SECOND, `the hull flew ${(flying / STEPS_PER_SECOND).toFixed(2)} s between volleys`).toBeGreaterThanOrEqual(0.5);
  });

  it('THE PICTURE: the warning is drawn dim, the beam bright and as wide as it hurts, on the zigzag it warned, in the enemy’s hand', () => {
    /*
      0036: the model holds a beam, and the picture must mention both halves of it — the line, then
      the beam. The surface is asked whose ink it stroked in, how loud, and how wide: a beam drawn
      narrower than it hurts is a lie about where the player may be.
    */
    const d = quetzalAt(0.3);
    const recorder = new Recorder();
    d.world.surface = recorder;
    const [beam] = volley(d);
    d.frame.draw(0);
    const warnings = recorder.strokes.filter((s) => s.hostile);
    expect(warnings.length, 'no hostile line was drawn on the step the beam was called').toBeGreaterThan(0);
    const dim = Math.max(...warnings.map((s) => s.alpha));
    expect(dim, 'the warning line is drawn as loud as the beam').toBeLessThan(0.7);
    const bolt = d.world.bolts.at(0);
    while (bolt.lifeFor > bolt.holdFor) stepShipAt(d, ACROSS_SPAN / 2);
    recorder.strokes.length = 0;
    d.frame.draw(0);
    const strokes = recorder.strokes.filter((s) => s.hostile);
    expect(strokes.length, 'the beam was not drawn').toBeGreaterThan(0);
    expect(Math.max(...strokes.map((s) => s.alpha)), 'the beam is no brighter than its warning').toBeGreaterThan(dim);
    // The canvas draws a bolt's glow at four times its stroke: that glow is the beam's hurt width.
    const widest = Math.max(...strokes.map((s) => s.width));
    expect(widest * 4, 'the beam is drawn narrower than it hurts').toBeGreaterThanOrEqual(beam!.radius * 2 * d.world.view.scale - 1e-6);
    expect(recorder.strokes.some((s) => !s.hostile), 'the laser was drawn in the player’s hand').toBe(false);
    /*
      ⚠️ **A ZIGZAG SINCE 0388, AND THE ONE ITS WARNING SHOWED.** It was *straight, on the screen*
      until the pterodactyls' lasers were asked to jag. What is held now is the part of that which
      mattered: the beam burns where its line was drawn. The camera moves along the lane between the
      two pictures and not across it, so the across of every knot — one screen axis — is the same in
      the warning and in the beam; and it is not one value, or the beam would be straight.
    */
    const stroke = strokes.find((s) => s.width === widest)!;
    const warned = warnings.find((s) => s.count === stroke.count)!;
    expect(stroke.count, 'the beam is not drawn on its knots').toBe(beamPoints(bolt.knots));
    expect(warned, 'the warning was not drawn on the same knots as the beam').toBeDefined();
    // The view lays along on x and across on y, so y is the screen's across.
    const ys = (s: { points: number[] }): string[] => s.points.filter((_, i) => i % 2 === 1).map((v) => v.toFixed(2));
    expect(new Set(ys(stroke)).size, 'the pterodactyl’s beam is drawn straight').toBeGreaterThan(2);
    expect(ys(stroke), 'the beam burns somewhere other than where its warning was drawn').toEqual(ys(warned));
    // And it goes out on its own steps, not the strike's.
    expect(bolt.holdFor, 'the beam is held for one flash').toBeGreaterThan(BOLT_STEPS);
  });
});

/**
 * The laser is jagged — `docs/decisions/0388-the-laser-is-jagged.md`.
 *
 * Asked from a play of the hydra: *"the pteradactyl head needs to shoot a random jagged lazer as it
 * currently fires straight ahead and because the head is basically static, it's essentially a
 * non-event in the fight - this change needs to affect the level 3 pteradactyl boss as well."* And,
 * asked back, warned along the exact zigzag before it fires.
 */
describe('0388 — the laser is jagged', () => {
  /**
   * Beams from volleys at the mouth's phase until one's zigzag stands clear of its root at the ship — on
   * the step it begins to BURN, the warning already flown with the ship parked out of the way.
   *
   * ⚠️ **MEASURED WHEN IT BURNS, NOT WHEN IT IS THROWN — 0452.** The root is re-pinned to the hull every
   * step, so the share of the beam's length the ship stands at moves and its zigzag at the ship moves
   * with it: four units over a warning, measured. Picked at the throw with three to spare, a beam could
   * drift into the straight line's own band before it burned, and then a frame that burned only along
   * the straight line burned this ship too — the guard went green under its own probe the day 0452 moved
   * the throat's root, which is a quantity the guard should never have rested on.
   */
  function offTheLine(): { d: Driven; tries: number; root: number; zig: number } {
    const attack = phaseFor(BOSSES.quetzal, BOSSES.quetzal.health * 0.3).attack!;
    if (attack.kind !== 'beam') throw new Error('the mouth’s phase is not a beam');
    for (let tries = 1; tries <= 30; tries++) {
      const d = quetzalAt(0.3);
      for (let i = 1; i < tries; i++) {
        volley(d);
        d.world.bolts.clear();
      }
      const [beam] = volley(d);
      // The warning flown with the ship on the far side of the lane, where nothing is yet lit to hurt it.
      for (let step = 1; step < attack.warning; step++) stepShipAt(d, beam!.across < ACROSS_SPAN / 2 ? ACROSS_SPAN - 6 : 6);
      const zig = onBeam(d);
      if (Math.abs(zig - beam!.across) > beam!.radius + d.world.ship.radius + 3) return { d, tries, root: beam!.across, zig };
    }
    throw new Error('thirty beams and none stood clear of its own line at the ship');
  }

  it('THE ASK: every laser the pterodactyls fire jags — the quetzal’s and the hydra’s third head’s — and since 0403 the jellyfish’s, as one formation', () => {
    // And since 0453 each says one path a root, or a beam would fire with no shape to burn along.
    for (const kind of ['quetzal', 'hydra', 'medusa'] as const) for (const b of beams(kind)) expect(b.jag?.paths.length, `a ${kind} laser has a root with no path`).toBe(b.from.length);
    /*
      ⚠️ **THE JELLYFISH'S HALF WAS *STRAIGHT* UNTIL 0403**, which is when it was asked: *"the lazes fire
      from the tentacles is a jagged formation like the updated pteradactyl and hydra, there's still 5
      that fire, but they need to be jagged so that there's a safe gap."* So its lasers jag too, and fly
      `together` — one zigzag a volley — where the pterodactyls' each take their own.
    */
    for (const kind of ['quetzal', 'hydra', 'medusa'] as const) {
      expect(beams(kind).length, `${kind} fires no laser, so this checks nothing`).toBeGreaterThan(0);
      for (const b of beams(kind)) expect(b.jag?.knots ?? 0, `a ${kind} laser is straight`).toBeGreaterThan(0);
    }
    for (const b of beams('medusa')) expect(b.together, 'the jellyfish’s five lasers each bend their own way, so the gaps between them close').toBe(true);
  });

  it('THE REPORTED ONE, IN LANE UNITS: a jagged beam burns along its zigzag, where a straight one from the same mouth could not reach', () => {
    /*
      The whole of the change, where the player is: a beam whose zigzag at the ship's along stands
      further from its root than a straight beam's half-width and a ship — a place the straight laser
      never burned — burns a ship parked there. That it is safe beside the zigzag is `besideBeam`'s,
      held above; the straight line itself is not safe, and is not claimed to be: a zigzag crosses its
      line once a leg, and a leg a few units down the lane is near enough to burn a ship on it.
    */
    const { d, root, zig } = offTheLine();
    const attack = phaseFor(BOSSES.quetzal, d.world.bossPool.at(0).health, d.world.bossFullHealth).attack!;
    if (attack.kind !== 'beam') throw new Error('the mouth’s phase is not a beam');
    let hurtOnZig = false;
    // The warning is flown already (`offTheLine`); one step over the hold, for the step that lit it.
    for (let step = 1; step <= attack.hold + 1; step++) if (stepShipAt(d, onBeam(d))) hurtOnZig = true;
    expect(hurtOnZig, `a ship on the zigzag, ${Math.abs(zig - root).toFixed(1)} units off the straight line, was never burned`).toBe(true);
  });

  it('every beam is a new zigzag, and every one leaves the mouth that fired it', () => {
    const d = quetzalAt(0.3);
    const paths: string[] = [];
    for (let v = 0; v < 4; v++) {
      volley(d);
      const b = d.world.bolts.at(0);
      // A hair short of the mouth, where the last leg arrives: AT it `beamAcrossAt` answers the root by construction.
      expect(Math.abs(beamAcrossAt(b, b.along + b.fromAlong * (1 - 1e-6)) - b.across), 'the zigzag does not leave the mouth').toBeLessThan(0.01);
      const knots: string[] = [];
      for (let k = 0; k <= b.knots; k++) knots.push(beamAcrossAt(b, b.along + (b.fromAlong * k) / b.knots).toFixed(2));
      paths.push(knots.join(' '));
      d.world.bolts.clear();
    }
    expect(new Set(paths).size, 'two beams burned the same zigzag').toBe(paths.length);
  });
});

/**
 * The laser fans out — `docs/decisions/0453-the-laser-fans-out.md`.
 *
 * *"For the lazer attacks, I wanted them jagged, but also having wider peaks and lows so that they spread
 * out more"* — and a shape for each count: one central with long deep legs, two whose middle never
 * touches, three and five as fans. Every assertion is in lane units on beams the game fired; the
 * jellyfish's half is `tests/medusa.test.ts`'s.
 */
describe('0453 — the laser fans out', () => {
  /** The furthest a beam's line stands from its root, towards larger across and towards smaller. */
  function reach(b: Entity): { up: number; down: number } {
    let up = 0;
    let down = 0;
    for (let s = 0; s <= 1; s += 1 / 256) {
      const off = beamAcrossAt(b, b.along + b.fromAlong * s) - b.across;
      if (off > up) up = off;
      if (-off > down) down = -off;
    }
    return { up, down };
  }

  it('THE ASK, IN LANE UNITS: the peaks spread out longer — every laser the pterodactyl fires turns at most once every eighth of a lane down it', () => {
    /*
      Twelve knots on a beam of a hundred and fifty was a leg every eleven units: even a deep swing read
      as a straight beam with a fringe on it. Held on the beams the game fires, at the length they burn,
      because a leg is the beam's length shared out and the row only says the count.
    */
    for (const fraction of [0.7, 0.3, 0.2]) {
      const d = quetzalAt(fraction);
      for (const b of thrown(d)) {
        const leg = Math.abs(b.fromAlong) / (b.knots + 1);
        expect(leg, `a laser at ${fraction} of the bar turns every ${leg.toFixed(1)} units down the lane`).toBeGreaterThanOrEqual(ACROSS_SPAN / 8);
      }
    }
    for (const kind of ['quetzal', 'hydra', 'medusa'] as const) for (const b of beams(kind)) expect(b.jag!.knots, `a ${kind} laser has more knots than the painter holds`).toBeLessThanOrEqual(BEAM_MAX_KNOTS);
  });

  it('THE ASK, IN LANE UNITS: one beam is central, and its zigzag sweeps a third of the lane every time it fires', () => {
    // At eighteen units a side, the most the throat's old zigzag could reach was thirty-six.
    const d = quetzalAt(0.3);
    let lean = 0;
    for (let v = 0; v < 30; v++) {
      const [b] = thrown(d);
      const { up, down } = reach(b!);
      expect(up + down, `the lone beam swept ${(up + down).toFixed(1)} lane units`).toBeGreaterThanOrEqual(ACROSS_SPAN / 3);
      lean += beamAcrossAt(b!, b!.along) - b!.across;
    }
    expect(Math.abs(lean / 30), 'the lone beam leans to one side, so it is not central').toBeLessThan(5);
  });

  it('THE ASK, IN LANE UNITS: two beams never touch the line between them, from the mouths to the far end — and reach further outside than in', () => {
    /*
      *"The center of the two attacks shouldn't touch, but the outside jagged path should be longer to cover
      more screen."* A ship parked on the line between the two roots is never inside either beam, at any
      along a beam runs — measured to the nearest leg, because a steep leg is nearer than its across says.
    */
    const d = quetzalAt(0.7);
    const r = d.world.ship.radius * d.world.tuning.hurtbox;
    let out = 0;
    let inward = 0;
    for (let v = 0; v < 30; v++) {
      const pair = thrown(d);
      expect(pair.length, 'the shoulders did not fire two').toBe(2);
      const mid = (pair[0]!.across + pair[1]!.across) / 2;
      for (const b of pair) {
        for (let s = 0; s < 1; s += 1 / 256) {
          const along = b.along + b.fromAlong * s;
          const clear = beamDistance(b, along, mid) - b.radius - r;
          expect(clear, `a shoulder laser burned the middle, ${(s * 100).toFixed(0)}% of the way from its far end`).toBeGreaterThan(0);
        }
      }
      const left = reach(pair[0]!);
      const right = reach(pair[1]!);
      out += left.down + right.up;
      inward += left.up + right.down;
    }
    expect(out / inward, 'the pair reaches no further outside than it does towards the middle').toBeGreaterThan(2);
  });

  it('THE ASK, IN LANE UNITS: three beams are a fan — the centre straight down the lane, the shoulders leaning out', () => {
    // At the far end, averaged over volleys: the zigzag is random either side, the lean is not.
    const d = quetzalAt(0.2);
    const ends = [0, 0, 0];
    const volleys = 30;
    for (let v = 0; v < volleys; v++) {
      const fan = thrown(d);
      expect(fan.length, 'the brace did not fire three').toBe(3);
      fan.forEach((b, i) => (ends[i]! += (beamAcrossAt(b, b.along) - b.across) / volleys));
    }
    expect(Math.abs(ends[1]!), 'the centre beam leans').toBeLessThan(4);
    expect(-ends[0]!, 'the left shoulder’s beam does not lean out').toBeGreaterThan(15);
    expect(ends[2]!, 'the right shoulder’s beam does not lean out').toBeGreaterThan(15);
  });

  it('THE PICTURE: the fan is drawn where it burns — every point the painter strokes lies on a laser’s burning line', () => {
    /*
      0388's picture test holds that a beam burns where its warning was drawn, which a painter that left the
      lean out of BOTH would pass. So this takes each stroke's points back through the view into the lane
      and asks the frame's own measure how far each is from the nearest beam: on it, or the fan the player
      sees is not the fan that burns.
    */
    const d = quetzalAt(0.2);
    const recorder = new Recorder();
    d.world.surface = recorder;
    const fan = thrown(d);
    while (fan[0]!.lifeFor > fan[0]!.holdFor) stepShipAt(d, ACROSS_SPAN / 2);
    recorder.strokes.length = 0;
    d.frame.draw(1);
    const view = d.world.view;
    expect(view.alongAxis, 'the view is not the one this reads back').toBe('x');
    const drawn = recorder.strokes.filter((s) => s.hostile && s.count === beamPoints(fan[0]!.knots));
    expect(drawn.length, 'the fan was not drawn as three beams').toBe(3);
    for (const s of drawn) {
      for (let i = 0; i < s.count; i++) {
        const along = d.world.cameraAlong + (s.points[i * 2]! - view.gutterAlong) / view.scale;
        const across = (s.points[i * 2 + 1]! - view.gutterAcross) / view.scale;
        const off = Math.min(...fan.map((b) => beamDistance(b, Math.min(Math.max(along, b.along), b.along + b.fromAlong), across)));
        expect(off, `a drawn point stands ${off.toFixed(2)} lane units off every burning line`).toBeLessThan(0.05);
      }
    }
  });
});

describe('0459 — the laser leaves from under its gun', () => {
  it('THE REPORTED ONE: every beam is stroked before the hull is blitted, so the barrels and the beak stand over the root — and nothing else of the bolts moves under it', () => {
    /*
      *"The lazers are firing above the graphic sprites instead of below it."* The roots were already on
      the barrels (0452); the stroke and its glow were drawn after the whole scene, so they lay over them.
      Asked of the frame's own draw, in the order the surface was told to do things.
    */
    const d = quetzalAt(0.2);
    const order: string[] = [];
    d.world.surface = {
      clear(): void {
        order.length = 0;
      },
      blit(sprite: number): void {
        order.push(`blit:${sprite}`);
      },
      bolt(_points: Float32Array, _count: number, _width: number, _alpha: number, hostile: boolean): void {
        order.push(hostile ? 'beam' : 'bolt');
      },
    };
    const fan = thrown(d);
    while (fan[0]!.lifeFor > fan[0]!.holdFor) stepShipAt(d, ACROSS_SPAN / 2);
    d.frame.draw(1);
    const hull = order.indexOf(`blit:${d.world.bossPool.at(0).sprite}`);
    const beams = order.flatMap((entry, i) => (entry === 'beam' ? [i] : []));
    expect(hull, 'the hull was not drawn').toBeGreaterThanOrEqual(0);
    expect(beams.length, 'the fan was not drawn').toBe(fan.length);
    for (const at of beams) expect(at, 'a beam was stroked over the hull that fires it').toBeLessThan(hull);
  });
});

/**
 * The pterodactyl is feathered — `docs/decisions/0398-the-pterodactyl-is-feathered.md`.
 *
 * *"It needs feathers, lazer cannon when it opens it's mouth to fire, shoulder mounted lazers for when it
 * fires two and three etc. The initial bullet firing needs to be shooting feathered quills from it's
 * wings rather than tiny bullet shapped things now."* Whether it looks feathered is a photograph's; what
 * is held here is where each thing leaves the animal, and that the animal says so while it happens.
 */
describe('0398 — the pterodactyl is feathered', () => {
  it('THE ASKED-FOR ONE, THE QUILLS: the first stage throws quills, every one off a wing and both wings, each one a real mark on the screen', () => {
    const d = quetzalAt(0.95);
    const boss = d.world.bossPool.at(0);
    d.world.enemyShots.clear();
    boss.fireIn = 1;
    d.frame.step();
    const quills: number[] = [];
    for (let i = 0; i < d.world.enemyShots.size; i++) {
      const shot = d.world.enemyShots.at(i);
      // The volcanoes' rock falls through the whole fight (0251) and is not the pterodactyl's.
      if (SPRITE_KINDS[shot.sprite] === 'rock') continue;
      expect(SPRITE_KINDS[shot.sprite], 'the first stage threw something other than a quill').toBe('quill');
      quills.push(shot.across - boss.across);
    }
    expect(quills.length, 'the first stage threw nothing').toBeGreaterThan(0);
    // Off a wing: further across than the body's own hurtbox, which a quill thrown from the chest is not.
    for (const across of quills) expect(Math.abs(across), `a quill left ${across.toFixed(1)} units across — from the body, not a wing`).toBeGreaterThan(BOSSES.quetzal.radius);
    expect(quills.some((a) => a < 0) && quills.some((a) => a > 0), 'the quills came off one wing').toBe(true);
    // In the player's units: at least thirty pixels long on the screen the reports were made on, where
    // the lance it replaces was eleven — *"tiny bullet shaped things."*
    expect(SPRITE_EXTENT.quill * viewOf(1280, 720).scale, 'a quill is a speck on a 1280×720 screen').toBeGreaterThanOrEqual(30);
  });

  it('THE SHOULDER CANNONS: every beam that is not the mouth’s leaves a cannon’s muzzle as it is drawn, and the mouth’s leaves the throat cannon', () => {
    /*
      ⚠️ **ALONG AS WELL AS ACROSS — 0452.** *"They don't fire from the end of the cannons or from it's
      mouth."* This held the across alone while every root sat level with the hull's centre, seven units
      behind the barrels' ends and ten behind the throat: green, and the picture wrong.
    */
    const r = SPRITE_EXTENT.boss10 * 0.42;
    const [cannonAlong, cannonAcross] = [QUETZAL_CANNON[0] * r, QUETZAL_CANNON[1] * r];
    const [throatAlong, throatAcross] = [QUETZAL_THROAT[0] * r, QUETZAL_THROAT[1] * r];
    let shoulders = 0;
    let throats = 0;
    for (const phase of BOSSES.quetzal.phases) {
      const attack = phase.attack ?? BOSSES.quetzal.attack;
      if (attack.kind !== 'beam') continue;
      for (const [along, across] of attack.from) {
        if (across === 0) {
          throats++;
          expect(Math.hypot(along - throatAlong, across - throatAcross), `the mouth's beam leaves ${along}, ${across}, where the throat cannon is drawn at ${throatAlong.toFixed(1)}, ${throatAcross.toFixed(1)}`).toBeLessThanOrEqual(0.5);
          continue;
        }
        shoulders++;
        expect(Math.hypot(along - cannonAlong, Math.abs(across) - cannonAcross), `a beam leaves ${along}, ${across}, where the cannon's muzzle is drawn at ${cannonAlong.toFixed(1)}, ±${cannonAcross.toFixed(1)}`).toBeLessThanOrEqual(0.5);
      }
    }
    expect(shoulders, 'no stage fires the shoulders, so nothing was held').toBeGreaterThanOrEqual(4);
    expect(throats, 'no stage fires the throat, so nothing was held').toBeGreaterThanOrEqual(2);
  });

  it('THE TELL IS THE BODY: while a laser is on the screen the beak is open on its cannon, or the shoulders are lit, for every step of it', () => {
    for (const [fraction, face, name] of [
      [0.6, SPRITE.boss10Charged, 'the shoulders lit'],
      [0.3, SPRITE.boss10Gape, 'the beak open'],
      [0.1, SPRITE.boss10GapeCharged, 'the beak open and the shoulders lit'],
    ] as const) {
      const d = quetzalAt(fraction);
      volley(d);
      let live = 0;
      let wrong = 0;
      for (let i = 0; i < 200 && d.world.bolts.size > 0; i++) {
        d.world.ship.health = d.world.shipRow.health;
        d.world.bossPool.at(0).fireIn = 999;
        d.frame.step();
        if (d.world.bolts.size === 0) break;
        live++;
        if (d.world.bossPool.at(0).spriteBase !== face) wrong++;
      }
      expect(live, `no laser stayed on the screen at ${fraction}, so nothing was held`).toBeGreaterThan(20);
      expect(wrong, `for ${wrong} of the ${live} steps a laser was on the screen at ${fraction}, the pterodactyl was not wearing ${name}`).toBe(0);
    }
  });

  it('THE WINGS BEAT, AND A HIT LIGHTS THEM WITH THE BODY', () => {
    const d = quetzalAt(0.95);
    const wing = (): string => {
      for (let k = 0; k < d.world.bossAura.size; k++) {
        const kind = SPRITE_KINDS[d.world.bossAura.at(k).sprite]!;
        if (kind.startsWith('quetzalWing')) return kind;
      }
      return 'none';
    };
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      d.world.ship.health = d.world.shipRow.health;
      d.world.bossPool.at(0).fireIn = 999;
      d.world.bossPool.at(0).flashFor = 0;
      d.frame.step();
      seen.add(wing());
    }
    expect(seen.has('none'), 'a step went by with no wings behind the body').toBe(false);
    expect(seen.size, `the wings wore ${seen.size} frames in a second, which is not a wingbeat`).toBeGreaterThanOrEqual(6);
    d.world.bossPool.at(0).flashFor = 4;
    d.frame.step();
    expect(wing().endsWith('Hit'), `the body was lit by a hit and its wings wore ${wing()}`).toBe(true);
  });
});
