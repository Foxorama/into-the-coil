/**
 * A body flies an arc — `docs/decisions/0328-a-body-flies-an-arc.md`.
 *
 * Reported: *"more interesting flight paths for the enemy waves for the player to engage with, where
 * they can curve back and come onto the screen again."* The `arc` arm turns a body's camera-frame
 * velocity by `speed / radius` a step, on the screen, until it has turned through its sweep, then
 * holds it. This drives the swift — the shared kind that flies it — through the real frame and reads
 * what the player would see: how far across the lane it swung, that it turned on the screen and not
 * before, which way it went, that it faced the way it flew, and that it left.
 *
 * ⚠️ **In the player's units** — units of lane, radians of heading, the view's own edge —
 * [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md).
 */
import { describe, expect, it } from 'vitest';

import { GameFrame } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, type WaveEntry } from '../src/content/levels.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import type { Entity } from '../src/sim/entity.ts';
import { PLAYER_ALONG_MARGIN } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** One body's flight: where it was, which way it was going, and whether its hull was on the screen. */
interface Flight {
  along: number[];
  across: number[];
  heading: number[];
  turn: number[];
  seen: boolean[];
}

/** One wave, the ship's guns off and parked at the back of its box, driven for `seconds`. */
function flown(wave: WaveEntry, seconds: number): Flight[] {
  const { world } = playableWorld({
    waves: [wave],
    pickups: [],
    landmarks: [],
    bossAt: Number.POSITIVE_INFINITY,
    midBoss: null,
    sections: NO_SECTIONS,
    boss: 'sentinel',
    theme: 'approach',
  });
  const frame = new GameFrame(world);
  const flying = new Map<Entity, Flight>();
  const done: Flight[] = [];
  let live = new Set<Entity>();
  for (let step = 0; step < seconds * STEPS_PER_SECOND; step++) {
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.ship.across = ACROSS_SPAN / 2;
    world.ship.along = world.cameraAlong + PLAYER_ALONG_MARGIN;
    frame.step();
    const now = new Set<Entity>();
    for (let i = 0; i < world.enemies.size; i++) {
      const e = world.enemies.at(i);
      now.add(e);
      let f = flying.get(e);
      if (f === undefined || !live.has(e)) {
        if (f !== undefined) done.push(f);
        f = { along: [], across: [], heading: [], turn: [], seen: [] };
        flying.set(e, f);
      }
      f.along.push(e.along - world.cameraAlong);
      f.across.push(e.across);
      f.heading.push(Math.atan2(e.velAcross, e.velAlong - world.scrollPerStep));
      f.turn.push(e.turn);
      f.seen.push(e.along - e.radius <= world.cameraAlong + world.view.alongSpan && e.across + e.radius >= 0 && e.across - e.radius <= ACROSS_SPAN);
    }
    for (const [e, f] of flying) {
      if (!now.has(e)) {
        done.push(f);
        flying.delete(e);
      }
    }
    live = now;
  }
  return [...done, ...flying.values()];
}

/** How far a heading turned over a flight, in radians, unwrapped. */
function turnedOver(heading: readonly number[], from: number, to: number): number {
  let turned = 0;
  for (let i = from + 1; i < to; i++) {
    let d = heading[i]! - heading[i - 1]!;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    turned += Math.abs(d);
  }
  return turned;
}

const arc = ENEMIES.swift.motion;
if (arc.kind !== 'arc') throw new Error('the swift does not fly an arc');

describe('0328 — a body flies an arc', () => {
  it('the swift is sent by more than one level and flies the arc, so the arm is a vocabulary and the body a shared kind', () => {
    const senders = LEVEL_KINDS.filter((kind) => LEVELS[kind].waves.some((w) => w.enemy === 'swift'));
    expect(senders.length, `the swift is sent by ${senders.length} level(s)`).toBeGreaterThan(1);
    expect(arc.sweep, 'a sweep past a half turn is the loop’s job, and the progress read off the heading folds back past π').toBeLessThanOrEqual(Math.PI);
    expect(arc.sweep).toBeGreaterThan(0);
    expect(2 * arc.radius, `the swift's circle is ${2 * arc.radius} units across on a ${ACROSS_SPAN}-unit lane`).toBeLessThanOrEqual(ACROSS_SPAN / 2);
  });

  it('THE PICTURE: from the lead edge it flies straight until it is well into the screen, then swings across the lane through its sweep, then leaves', () => {
    const [f] = flown({ at: 400, enemy: 'swift', formation: 'line', count: 1, lane: 30 }, 12);
    expect(f, 'the swift never spawned').toBeDefined();
    const firstSeen = f!.seen.indexOf(true);
    expect(firstSeen, 'the swift was never on the screen').toBeGreaterThan(0);
    // Straight until seen: the heading before the hull entered the view did not move.
    expect(turnedOver(f!.heading, 0, firstSeen), 'the swift turned before its hull was on the screen').toBeLessThan(1e-9);
    /*
      ⚠️ **AND STRAIGHT FOR `after` UNITS MORE, IN THE PLAYER'S UNITS: A SHARE OF THE VIEW.** Driven
      with the turn at the edge, the half circle sat against the leading edge and the body was gone
      in a second and a half having come twenty-five units in. The turn begins where the row says;
      the bottom of the U is that plus a radius, which is where the player meets it.
    */
    const firstTurn = f!.heading.findIndex((h, i) => i > 0 && Math.abs(h - f!.heading[i - 1]!) > 1e-9);
    expect(firstTurn, 'the swift never turned').toBeGreaterThan(firstSeen);
    // Measured to the hull's centre here where the arm reads its leading edge, so a hull radius less.
    const hull = ENEMIES.swift.radius;
    const depthAtTurn = 178 - f!.along[firstTurn]!;
    expect(depthAtTurn, `the swift began its turn ${depthAtTurn.toFixed(0)} units into a 178-unit view`).toBeGreaterThanOrEqual(arc.after - hull - 2);
    const deepest = 178 - Math.min(...f!.along.slice(firstSeen));
    expect(deepest, `the swift came ${deepest.toFixed(0)} units into the view and no further`).toBeGreaterThanOrEqual(arc.after + arc.radius - hull - 2);
    // Then through its sweep, and no further.
    const turned = turnedOver(f!.heading, firstSeen, f!.heading.length);
    expect(turned, `the swift turned ${turned.toFixed(2)} rad against a sweep of ${arc.sweep.toFixed(2)}`).toBeGreaterThanOrEqual(arc.sweep * 0.98);
    expect(turned, `the swift turned ${turned.toFixed(2)} rad, past its sweep`).toBeLessThanOrEqual(arc.sweep + 0.02);
    // Across the lane by its circle's width, in the player's units: from lane 30 toward the centre.
    const span = Math.max(...f!.across) - Math.min(...f!.across);
    expect(span, `the swift swung ${span.toFixed(1)} units across against a circle ${2 * arc.radius} wide`).toBeGreaterThanOrEqual(2 * arc.radius * 0.95);
    expect(Math.max(...f!.across), 'a lead swift at lane 30 turned away from the centre').toBeGreaterThan(ACROSS_SPAN / 2);
    // And out: its last known place is beyond the view's leading edge, flying up-lane.
    const last = f!.along[f!.along.length - 1]!;
    expect(last, 'the swift never left by the leading edge').toBeGreaterThan(178);
    expect(f!.heading[f!.heading.length - 1]!, 'the swift did not leave flying up-lane').toBeCloseTo(0, 1);
  });

  it('and from the side it comes in, turns back toward the edge it came by, and goes out the front', () => {
    /*
      ⚠️ **`acrossPlus`, ON PURPOSE.** The hand a flanker is dealt is the negative of its side, and a
      probe that dealt every arc the same hand would still turn an `acrossMinus` flanker the right
      way — this edge is the one that tells a rule from a constant.
    */
    const [f] = flown({ at: 400, enemy: 'swift', formation: 'line', count: 1, lane: 50, origin: 'acrossPlus' }, 12);
    expect(f, 'the swift never spawned').toBeDefined();
    const entered = f!.across.findIndex((a) => a <= ACROSS_SPAN);
    expect(entered, 'the swift never entered the lane').toBeGreaterThan(0);
    const deepest = Math.min(...f!.across);
    expect(deepest, `the swift came in to ${deepest.toFixed(1)} and never reached its lane`).toBeLessThanOrEqual(50 + 1);
    // Back out by the edge it came in by: after its deepest point it climbs past its lane again.
    const at = f!.across.indexOf(deepest);
    const back = Math.max(...f!.across.slice(at));
    expect(back, `after turning the swift only got back to ${back.toFixed(1)} — it turned the wrong way`).toBeGreaterThan(50 + arc.radius);
    const last = f!.along[f!.along.length - 1]!;
    expect(last, 'the swift never left by the leading edge').toBeGreaterThan(178);
  });

  it('and it faces the way it flies, so a chevron leaving up-lane is not drawn nose-last', () => {
    const [f] = flown({ at: 400, enemy: 'swift', formation: 'line', count: 1, lane: 30 }, 12);
    const turns = new Set(f!.turn.map((t) => t.toFixed(2)));
    expect(turns.size, 'the swift’s bitmap never turned while its heading did').toBeGreaterThan(20);
  });
});
