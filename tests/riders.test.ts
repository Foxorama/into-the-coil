/**
 * THE RIDERS GET OFF — `docs/decisions/0612-the-riders-get-off.md`.
 *
 * Played: *"the marmot and least weasel are drawn as part of the vehicles, the vehicles aren't separate from
 * the pilot, which affects the intro movies as well as hanging out."* The Thunderbolt and the Hamster Ball are
 * drawn as vehicles, and whoever is aboard is drawn on them from their own figure: in the fight, and in the
 * intro once the pilot has boarded. On the pad, and in the intro before the pilot boards, nobody is aboard.
 *
 * ⚠️ **IN CSS PIXELS OF A 1280×720 SCREEN, WHERE IT IS A PICTURE** — 0027. The drawings are traced at the size
 * the fight draws them (`tests/paths.ts`, as `tests/accents.test.ts` does), so an area is square pixels a
 * player looked at; the intro and the stand are drawn into a surface that writes down every blit.
 */

import { describe, expect, it } from 'vitest';
import { GOLFERS, GOLFER_KINDS, figureOf, pilotOf } from '../src/content/golfers.ts';
import { SHIPS, SHIP_KINDS, BALL_RADIUS, ownFit, ownRider, sameFit, type ShipKind } from '../src/content/ships.ts';
import { SHIP_BOX, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { BEATS, INTRO_STEPS, PORT_SPRITE } from '../src/content/port.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { drawPlayerShip, drawRider, riderDrawn, shade, withFit } from '../src/render/bake.ts';
import { paintPort, paintStand } from '../src/render/port.ts';
import { SKY } from '../src/app/mount.ts';
import type { Surface } from '../src/render/surface.ts';
import { viewOf } from '../src/sim/camera.ts';
import { inside, tracingPen, type Pass } from './paths.ts';

const DESKTOP = viewOf(1280, 720);
const INK = PALETTES[DEFAULT_PALETTE];

/** How wide `ship` is drawn on that screen, in CSS pixels — so every traced coordinate is one. */
const cssSize = (ship: ShipKind): number => SPRITE_EXTENT[SPRITE_KINDS[SHIPS[ship].sprite]!] * DESKTOP.scale;

/** Trace `ship` as it comes, with `rider` aboard, at the fight's size. */
function traceShip(ship: ShipKind, rider: ReturnType<typeof ownRider>): readonly Pass[] {
  const size = cssSize(ship);
  const { pen, trace } = tracingPen();
  const fit = ownFit(ship);
  drawPlayerShip(pen, { half: size / 2, r: size * 0.42 }, INK, ship, 0, fit.gun, fit.rim, fit.art, fit.livery, 0, rider);
  return trace.passes;
}

/** Square CSS pixels inside `pass`, sampled every half pixel. */
function area(pass: Pass, within: (x: number, y: number) => boolean = () => true): number {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const sub of pass.subpaths) {
    for (const [x, y] of sub) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  let hits = 0;
  for (let x = minX; x <= maxX; x += 0.5) for (let y = minY; y <= maxY; y += 0.5) if (within(x, y) && inside(pass, [x, y])) hits++;
  return hits * 0.25;
}

/** Square CSS pixels inside the ball's middle that any solid mark over the hull covers. */
function paintedInBall(passes: readonly Pass[], ship: ShipKind): number {
  const size = cssSize(ship);
  const half = size / 2;
  // The middle of the ball, inside its glint and its lit arc: four tenths of its radius out.
  const reach = (BALL_RADIUS / (SHIP_BOX * 0.42)) * size * 0.42 * 0.4;
  const solid = passes.slice(1).filter((p) => p.alpha >= 0.9 && p.composite !== 'destination-out');
  let hits = 0;
  for (let x = half - reach; x <= half + reach; x += 0.5) {
    for (let y = half - reach; y <= half + reach; y += 0.5) {
      if (Math.hypot(x - half, y - half) > reach) continue;
      if (solid.some((p) => inside(p, [x, y]))) hits++;
    }
  }
  return hits * 0.25;
}

class RecordingSurface implements Surface {
  sprites: number[] = [];
  clear(): void {
    this.sprites = [];
  }
  blit(sprite: number): void {
    this.sprites.push(sprite);
  }
  bolt(): void {}
}

describe('0612 — the riders get off', () => {
  it('every pilot whose ship shows them has a drawing aboard it, and a ship as it comes carries its own pilot', () => {
    for (const kind of GOLFER_KINDS) {
      const row = GOLFERS[kind];
      expect(riderDrawn(row.ship, figureOf(row)), `${kind} flies the ${row.ship} and nobody drew a ${figureOf(row)} aboard it`).toBe(true);
    }
    for (const ship of SHIP_KINDS) {
      const want = SHIPS[ship].seat === null ? null : figureOf(GOLFERS[pilotOf(ship)]);
      expect(ownRider(ship), `the ${ship} as it comes`).toBe(want);
      expect(ownFit(ship).rider).toBe(want);
    }
    // Who is aboard is part of the picture, so a fit with nobody aboard is a different bake.
    expect(sameFit(ownFit('thunderbolt'), { ...ownFit('thunderbolt'), rider: null })).toBe(false);
  });

  it('the Thunderbolt with nobody aboard shows no rider, and the rider alone is what the fight draws over the bare bike', () => {
    const ridden = traceShip('thunderbolt', 'marmot')[0]!;
    const bare = traceShip('thunderbolt', null)[0]!;
    const riddenPx = area(ridden);
    const barePx = area(bare);
    // The rider as the player sees them on a 1280×720 screen: what the hull takes in with him aboard.
    const riderPx = riddenPx - barePx;
    expect(riderPx, `the Marmot is ${riderPx.toFixed(0)} px² of a ${riddenPx.toFixed(0)} px² bike, so he is hardly there`).toBeGreaterThan(riddenPx * 0.15);
    // Nothing of him is left on the bare bike: it lies inside the ridden one, and less than a pixel row outside it.
    const outside = area(bare, (x, y) => !inside(ridden, [x, y]));
    expect(outside, `${outside.toFixed(1)} px² of the bare bike lie outside the ridden one`).toBeLessThan(2);
    // The port lays him alone over the bare bike; his silhouette there is the same space, to a few pixels.
    const size = cssSize('thunderbolt');
    const { pen, trace } = tracingPen();
    withFit('thunderbolt', ownFit('thunderbolt'), () => drawRider(pen, { half: size / 2, r: size * 0.42 }, INK, 'thunderbolt', 'marmot'));
    const layerPx = area(trace.passes[0]!);
    expect(Math.abs(layerPx - riderPx), `laid alone he is ${layerPx.toFixed(0)} px², and ${riderPx.toFixed(0)} px² aboard`).toBeLessThan(riderPx * 0.1);
  });

  it('the Hamster Ball with nobody aboard is empty in the middle, and with Unity aboard is not', () => {
    const ridden = paintedInBall(traceShip('ball', 'weasel'), 'ball');
    const empty = paintedInBall(traceShip('ball', null), 'ball');
    expect(empty, `${empty.toFixed(1)} px² of solid paint in the middle of an empty ball`).toBe(0);
    expect(ridden, `Unity covers ${ridden.toFixed(1)} px² of the middle of the ball, so is hardly there`).toBeGreaterThan(20);
  });

  it('0620 — Unity keeps their overalls on in the ball: the seat over the haunches, in the overalls’ navy', () => {
    /*
      Played: *"why does the weasel take off its pants when it gets into the hamster ball"*. Standing, at the
      bench and on the bust, Unity wears navy overalls (`unityInks` in keeper-art.ts); in the ball they were a
      bare weasel in a vest. In CSS pixels of the fight: solid navy paint behind the middle of the body, where
      the haunches are — Unity runs nose-first, so behind is toward the left of the drawing.
    */
    const navy = shade(INK.player, -0.66);
    const size = cssSize('ball');
    const half = size / 2;
    const seat = traceShip('ball', 'weasel').filter((p) => p.colour === navy && p.alpha >= 0.9);
    const behind = seat.reduce((sum, p) => sum + area(p, (x) => x < half), 0);
    const ahead = seat.reduce((sum, p) => sum + area(p, (x) => x > half + size * 0.04), 0);
    expect(behind, `${behind.toFixed(1)} px² of navy over Unity’s haunches`).toBeGreaterThan(12);
    expect(ahead, `${ahead.toFixed(1)} px² of navy over Unity’s head and shoulders, where the vest is`).toBeLessThan(behind * 0.25);
  });

  it('the pad shows every ship with nobody aboard', () => {
    const surface = new RecordingSurface();
    for (const ship of SHIP_KINDS) {
      for (let t = 0; t < 120; t += 7) {
        paintStand(surface, DESKTOP, t, SKY, SHIPS[ship], null);
        expect(surface.sprites, `the ${ship} on the pad at step ${t}`).not.toContain(PORT_SPRITE.blueRider);
      }
    }
  });

  it('the intro’s pilot runs to an empty ship that shows them, and rides it once their leap lands', () => {
    const surface = new RecordingSurface();
    for (const ship of SHIP_KINDS) {
      const riders = (t: number): number => {
        paintPort(surface, DESKTOP, t, SKY, SHIPS[ship]);
        return surface.sprites.filter((s) => s === PORT_SPRITE.blueRider).length;
      };
      for (let t = 0; t < BEATS.pilotLeap; t += 5) expect(riders(t), `the ${ship} has a rider before its pilot leaps, at step ${t}`).toBe(0);
      const shown = SHIPS[ship].seat === null ? 0 : 1;
      for (let t = BEATS.pilotIn; t < INTRO_STEPS; t += 11) {
        if (t >= BEATS.cut && t < BEATS.outside) continue;
        expect(riders(t), `the ${ship}'s rider at step ${t}, after the pilot is aboard`).toBe(t >= BEATS.outside && t < BEATS.outside + 6 ? 0 : shown);
      }
    }
  });
});
