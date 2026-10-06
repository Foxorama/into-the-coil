/**
 * THE HANGAR IS THE PORT — `docs/decisions/0540-the-hangar-is-the-port.md`.
 *
 * The stand is drawn into a surface that writes down every blit, as the intro is (`tests/intro.test.ts`),
 * and asked where things landed: in pixels on the screen each tab's camera makes of the room.
 */

import { describe, expect, it } from 'vitest';
import { PORT_EXTENT, PORT_SPRITE, STAGE, type PortKind } from '../src/content/port.ts';
import { SHIPS, fitted } from '../src/content/ships.ts';
import { SKY } from '../src/app/mount.ts';
import { paintStand, standViewInto } from '../src/render/port.ts';
import type { Surface } from '../src/render/surface.ts';
import { MAX_ASPECT, viewOf } from '../src/sim/camera.ts';
import { SCREENS, SCREEN_KINDS } from '../src/state/screens.ts';

interface Blit {
  sprite: number;
  x: number;
  y: number;
  scale: number;
  turn: number;
}

class RecordingSurface implements Surface {
  blits: Blit[] = [];
  clear(): void {
    this.blits = [];
  }
  blit(sprite: number, x: number, y: number, scale: number, turn = 0): void {
    this.blits.push({ sprite, x, y, scale, turn });
  }
  bolt(): void {}
}

/** The layout guard's sizes. */
const SIZES = [
  [480, 320],
  [667, 375],
  [812, 375],
  [915, 412],
  [1024, 768],
  [1280, 720],
] as const;

const STANDING = SCREEN_KINDS.filter((s) => SCREENS[s].stand !== null);

function drawStand(screen: (typeof STANDING)[number], width: number, height: number, t = 0, ship = SHIPS.firebird, camera = SCREENS[screen].stand!.camera): Blit[] {
  const base = viewOf(width, height);
  const view = { ...base };
  standViewInto(base, camera, width, height, view);
  const surface = new RecordingSurface();
  paintStand(surface, view, t, SKY, ship);
  return surface.blits;
}

const all = (blits: readonly Blit[], kind: PortKind): Blit[] => blits.filter((b) => b.sprite === PORT_SPRITE[kind]);

describe('0540 — the hangar’s tabs stand in the port', () => {
  it('stands every tab in the room with the Viper gone, the beacons dark, the door shut and nobody running', () => {
    expect(STANDING.length, 'no screen stands, so this measures nothing').toBeGreaterThan(0);
    for (const screen of STANDING) {
      const blits = drawStand(screen, 1280, 720);
      for (const gone of ['viper', 'viperIdle', 'viperBurn', 'beacon', 'spill', 'pool', 'pilotRun0', 'pilotLeap', 'flash'] as const) {
        expect(all(blits, gone), `${screen}: ${gone} is drawn on the stand`).toEqual([]);
      }
      expect(all(blits, 'blueSide'), `${screen}: the pilot's ship is not on its pad, once`).toHaveLength(1);
      expect(all(blits, 'blueIdle'), `${screen}: the ship's flame is not idling under it`).toHaveLength(1);
      expect(all(blits, 'pad'), `${screen}: the two pads are not both there`).toHaveLength(2);
    }
  });

  it('puts the ship on its pad in the stand’s part of the screen, on every tab, at every size', () => {
    // 0548: every tab, and it was the two whose camera stood on the pad — none does now, which left it asking nothing.
    for (const screen of STANDING) {
      for (const [width, height] of SIZES) {
        const ship = all(drawStand(screen, width, height), 'blueSide')[0]!;
        const half = (PORT_EXTENT.blueSide * ship.scale) / 2;
        const at = `${screen} at ${width}x${height}`;
        // The stand is the left of the screen: a third where it is narrowest, two fifths on a laptop.
        expect(ship.x + half * 0.84, `${at}: the ship reaches past the stand into the plate`).toBeLessThanOrEqual(width * 0.45);
        expect(ship.x - half * 0.84, `${at}: the ship is off the left of the screen`).toBeGreaterThanOrEqual(0);
        expect(ship.y, `${at}: the ship is not on the screen`).toBeGreaterThan(0);
        expect(ship.y, `${at}: the ship is not on the screen`).toBeLessThan(height);
      }
    }
  });

  it('keeps the room over every edge of the screen, so no camera shows the void it is painted on', () => {
    /*
      ⚠️ **AND THE WIDEST SCREEN THE GAME DRAWS ON**, at its aspect clamp: the guard's sizes stop at 2.2 to
      one, and a camera at the bar on a 21:9 monitor would put the room's left wall a sliver in from the
      screen's edge, which is what `standViewInto` holds it back from.
    */
    const widest = [Math.round(1080 * MAX_ASPECT), 1080] as const;
    /*
      0542: and a camera at the bar, which no tab stands at since Cosmo's moved to the stall — the hold is
      `standViewInto`'s for every camera a tab may author, so it is asked of the one at the room's wall.
    */
    const atTheBar = { along: STAGE.bar.along, across: STAGE.bar.across, zoom: 1.6, x: 0.18, y: 0.5 };
    for (const [screen, camera] of [...STANDING.map((s) => [s, SCREENS[s].stand!.camera] as const), ['hangar', atTheBar] as const]) {
      for (const [width, height] of [...SIZES, widest]) {
        const blits = drawStand(screen, width, height, 0, SHIPS.firebird, camera);
        const walls = all(blits, 'wall');
        const deck = all(blits, 'deck');
        const at = `${screen} (camera at ${camera.along}) at ${width}x${height}`;
        const extent = PORT_EXTENT.wall * walls[0]!.scale;
        expect(Math.min(...walls.map((b) => b.x - extent / 2)), `${at}: the wall stops short of the screen's left`).toBeLessThanOrEqual(0.5);
        expect(Math.min(...walls.map((b) => b.y - extent / 2)), `${at}: the wall stops short of the screen's top`).toBeLessThanOrEqual(0.5);
        expect(Math.max(...deck.map((b) => b.y + extent / 2)), `${at}: the deck stops short of the screen's foot`).toBeGreaterThanOrEqual(height - 0.5);
      }
    }
  });

  it('turns a car’s spinners on the pad, each at its rim’s own rate, and draws no spinner on a rim that is still', () => {
    const spinning = fitted(SHIPS.firebird, SHIPS.firebird.weapon, 'spinner');
    const before = all(drawStand('parts', 1280, 720, 0, spinning), 'blueWheel');
    const after = all(drawStand('parts', 1280, 720, 7, spinning), 'blueWheel');
    expect(before, 'the spinners are not over both tyres').toHaveLength(SHIPS.firebird.wheels!.at.length);
    for (let i = 0; i < before.length; i++) {
      expect(after[i]!.turn, `spinner ${i} is not turning`).not.toBeCloseTo(before[i]!.turn, 3);
    }
    expect(all(drawStand('parts', 1280, 720, 0, SHIPS.firebird), 'blueWheel'), 'a spinner is drawn over a rim that does not turn').toEqual([]);
    expect(all(drawStand('parts', 1280, 720, 0, SHIPS.fighter), 'blueWheel'), 'a spinner is drawn on a ship with no wheels').toEqual([]);
  });

  /*
    ⚠️ **COSMO KEEPS A STALL BY THE PAD, AND THE TAB'S CAMERA HOLDS BOTH — 0542.** The plan put the counter at the
    bar; a camera there loses the ship, and the ship on its pad is where a ware is tried on. So the tab's
    camera is the one place in the room that shows Cosmo, the stall and the ship at once, at every size.

    0548: and the stall is drawn on every tab, so every tab's camera is asked to hold it whole — the
    hangar's cut it in half at the frame's edge, which is why it was Cosmo's alone until the three shared one.
  */
  it('0542 — stands Cosmo at the stall beside the pad on every tab, with Cosmo, the stall and the ship in view at every size', () => {
    for (const screen of STANDING) {
      for (const [width, height] of SIZES) {
        const blits = drawStand(screen, width, height);
        const at = `${screen} at ${width}x${height}`;
        for (const kind of ['cosmo', 'stall', 'blueSide'] as const) {
          const drawn = all(blits, kind);
          expect(drawn, `${at}: ${kind} is not drawn once`).toHaveLength(1);
          const half = (PORT_EXTENT[kind] * drawn[0]!.scale) / 2;
          expect(drawn[0]!.x - half * 0.5, `${at}: ${kind} is off the left of the screen`).toBeGreaterThanOrEqual(0);
          expect(drawn[0]!.x + half * 0.5, `${at}: ${kind} reaches past the stand into the plate`).toBeLessThanOrEqual(width * 0.45);
          expect(drawn[0]!.y, `${at}: ${kind} is not on the screen`).toBeGreaterThan(0);
          expect(drawn[0]!.y, `${at}: ${kind} is not on the screen`).toBeLessThan(height);
        }
        // Behind his counter: the stall is drawn over him, so he stands at it rather than on it.
        expect(blits.indexOf(all(blits, 'stall')[0]!), `${at}: the stall is drawn under Cosmo`).toBeGreaterThan(blits.indexOf(all(blits, 'cosmo')[0]!));
      }
    }
  });
});
