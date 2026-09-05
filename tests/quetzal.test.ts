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
import { BEAM_BOLT_KIND, BOSSES } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { INVULN_STEPS } from '../src/content/ships.ts';
import { BOLT_STEPS } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
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

/**
 * Hold the ship at `across`, in the box, immortal and never lit by anything but a beam, for one
 * step — and say whether that step hurt it. Watched every step, because a ship of one health that
 * is struck dies and is put back whole by the end of the beat.
 */
function stepShipAt(d: Driven, across: number): boolean {
  const { world, frame } = d;
  world.ship.across = across;
  world.ship.along = world.cameraAlong + (PLAYER_ALONG_MARGIN + PLAYER_LEAD) / 2;
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
      for (const from of attack.from) expect(Math.abs(from), `a ${name} beam leaves the hull ${from} units out, past its drawing`).toBeLessThanOrEqual(halfExtent);
    }
    const wingBeam = wings.attack!;
    const mouthBeam = mouth.attack!;
    if (wingBeam.kind !== 'beam' || mouthBeam.kind !== 'beam') return;
    expect(mouthBeam.from[0], 'the mouth is not in the middle of the hull').toBe(0);
    expect(Math.abs(wingBeam.from[0]!), 'a wing beam leaves from the middle of the hull').toBeGreaterThan(row.radius / 2);
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
      expect(roots.map((r) => Math.round(r)), `the beams at ${fraction} do not leave from the phase's roots`).toEqual([...attack.from].sort((a, b) => a - b));
      for (const b of beams) {
        expect(b.radius, `a beam at ${fraction} is not the phase's width`).toBe(attack.halfWidth);
        // From the hull to the trailing edge: its far end is behind the ship's box, its root on the hull.
        expect(b.along - d.world.cameraAlong, 'the beam stops short of the trailing edge').toBeLessThanOrEqual(0);
        expect(b.along + b.fromAlong, 'the beam does not reach back to the hull').toBeCloseTo(boss.along, 3);
      }
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
    const inside = beam!.across;
    const beside = inside + beam!.radius + d.world.ship.radius + 4;
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
    const crossAt = attack.warning + Math.floor(attack.hold / 3);
    let hurtBeside = false;
    for (let step = 1; step <= crossAt; step++) if (stepShipAt(e, again!.across + again!.radius + e.world.ship.radius + 4)) hurtBeside = true;
    expect(hurtBeside, 'a ship beside the beam was hurt').toBe(false);
    let hurtCrossing = -1;
    for (let step = 1; step <= attack.hold && hurtCrossing < 0; step++) if (stepShipAt(e, again!.across)) hurtCrossing = step;
    expect(hurtCrossing, 'a ship that flew into the beam while it was held was not hurt — the beam only hurts on the step it lights').toBe(1);
    // And one hit is one hit: the window every other threat opens is the one the beam gets.
    expect(INVULN_STEPS, 'a held beam would hurt every step').toBeGreaterThan(1);
    void beside;
  });

  it('and a ship beside the beam, however far down the lane, is not touched by it', () => {
    const d = quetzalAt(0.3);
    const [beam] = volley(d);
    const beside = beam!.across + beam!.radius + d.world.ship.radius + 4;
    const target = beside <= ACROSS_SPAN ? beside : beam!.across - beam!.radius - d.world.ship.radius - 4;
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
    const [beam] = volley(d);
    const held = attack.warning + attack.hold;
    const at = boss.across;
    // The cadence is the boss's own from here: the ship is parked beside the beam, immortal, and
    // nothing resets `fireIn` — which is exactly what the fold would corrupt.
    const beside = beam!.across + beam!.radius + d.world.ship.radius + 4;
    const park = (): void => {
      d.world.ship.across = beside <= ACROSS_SPAN ? beside : beam!.across - beam!.radius - d.world.ship.radius - 4;
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

  it('THE PICTURE: the warning is drawn dim, the beam bright and as wide as it hurts, straight, in the enemy’s hand', () => {
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
    // Straight, on the screen: every vertex of the widest stroke shares one screen line, which the
    // lightning's jag would break.
    const stroke = strokes.find((s) => s.width === widest)!;
    const xs = new Set(stroke.points.filter((_, i) => i % 2 === 0).map((v) => v.toFixed(3)));
    const ys = new Set(stroke.points.filter((_, i) => i % 2 === 1).map((v) => v.toFixed(3)));
    expect(Math.min(xs.size, ys.size), 'the beam is drawn jagged, as lightning is').toBe(1);
    // And it goes out on its own steps, not the strike's.
    expect(bolt.holdFor, 'the beam is held for one flash').toBeGreaterThan(BOLT_STEPS);
  });
});
