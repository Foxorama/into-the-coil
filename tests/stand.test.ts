/**
 * THE HANGAR IS THE PORT — `docs/decisions/0540-the-hangar-is-the-port.md`.
 *
 * The stand is drawn into a surface that writes down every blit, as the intro is (`tests/intro.test.ts`),
 * and asked where things landed: in pixels on the screen each tab's camera makes of the room.
 */

import { describe, expect, it } from 'vitest';
import { PORT_EXTENT, PORT_KINDS, PORT_SPRITE, STAGE, type PortKind } from '../src/content/port.ts';
import { KEEPERS, KEEPER_KINDS } from '../src/content/keepers.ts';
import { SHIPS, fitted } from '../src/content/ships.ts';
import { SKY } from '../src/app/mount.ts';
import { paintStand, standViewInto } from '../src/render/port.ts';
import type { Surface } from '../src/render/surface.ts';
import { MAX_ASPECT, viewOf } from '../src/sim/camera.ts';
import { SCREENS, SCREEN_KINDS, STEPS_PER_SECOND } from '../src/state/screens.ts';
import { RIMS, WHEEL_FRAMES } from '../src/content/rims.ts';

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
  paintStand(surface, view, t, SKY, ship, SCREENS[screen].stand!.keeper);
  return surface.blits;
}

const all = (blits: readonly Blit[], kind: PortKind): Blit[] => blits.filter((b) => b.sprite === PORT_SPRITE[kind]);

/** Every picture laid over a wheel on the pad, whichever of a rim's it is — 0557. */
const WHEEL_SPRITES: readonly number[] = PORT_KINDS.filter((kind) => kind.startsWith('blueWheel')).map((kind) => PORT_SPRITE[kind]);
const wheelsOn = (blits: readonly Blit[]): Blit[] => blits.filter((b) => WHEEL_SPRITES.includes(b.sprite));

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
    const before = wheelsOn(drawStand('parts', 1280, 720, 0, spinning));
    const after = wheelsOn(drawStand('parts', 1280, 720, 7, spinning));
    expect(before, 'the spinners are not over both tyres').toHaveLength(SHIPS.firebird.wheels!.at.length);
    for (let i = 0; i < before.length; i++) {
      expect(after[i]!.turn, `spinner ${i} is not turning`).not.toBeCloseTo(before[i]!.turn, 3);
      expect(after[i]!.sprite, `spinner ${i} changed its picture, and it has one`).toBe(before[i]!.sprite);
    }
    expect(wheelsOn(drawStand('parts', 1280, 720, 0, SHIPS.firebird)), 'a spinner is drawn over a rim that does not turn').toEqual([]);
    expect(wheelsOn(drawStand('parts', 1280, 720, 0, SHIPS.fighter)), 'a spinner is drawn on a ship with no wheels').toEqual([]);
  });

  it('0557 — the Thunderbolt’s lightning crackles on the pad: a new crack every sixteenth of a second, struck somewhere new', () => {
    /*
      Played: *"they just look like a teal bar … make them crackle like lightning"*. Held in what the player
      sees: in one second on the pad, every one of the rim's cracks lands on each wheel, the picture is
      never the same two flashes running, and the two wheels are never showing one crack at one angle.
    */
    const wheel = RIMS.bolts.wheel!;
    expect(WHEEL_SPRITES.length, 'the pad bakes fewer wheel pictures than a rim shows in turn').toBeGreaterThanOrEqual(WHEEL_FRAMES);
    const seen = [new Set<number>(), new Set<number>()];
    let last: Blit[] | null = null;
    // A step at a time through one second: a flash is about four steps, so every flash is read.
    for (let t = 0; t < STEPS_PER_SECOND; t++) {
      const now = wheelsOn(drawStand('parts', 1280, 720, t, SHIPS.thunderbolt));
      expect(now, 'the lightning is not over both tyres').toHaveLength(2);
      expect(now[0]!.sprite === now[1]!.sprite && Math.abs(now[0]!.turn - now[1]!.turn) < 1e-6, `both wheels strike one crack at one angle at step ${t}`).toBe(false);
      for (let i = 0; i < 2; i++) seen[i]!.add(now[i]!.sprite);
      if (last !== null) {
        for (let i = 0; i < 2; i++) {
          const held = last[i]!.sprite === now[i]!.sprite && Math.abs(last[i]!.turn - now[i]!.turn) < 1e-6;
          const flashed = last[i]!.sprite !== now[i]!.sprite && Math.abs(last[i]!.turn - now[i]!.turn) > 0.5;
          expect(held || flashed, `wheel ${i} at step ${t} neither held its crack nor struck a new one somewhere else`).toBe(true);
        }
      }
      last = now;
    }
    for (let i = 0; i < 2; i++) expect(seen[i]!.size, `wheel ${i} showed ${seen[i]!.size} of the ${wheel.frames.length} cracks in a second`).toBe(wheel.frames.length);
  });

  /*
    ⚠️ **COSMO KEEPS A STALL BY THE PAD, AND THE TAB'S CAMERA HOLDS BOTH — 0542.** The plan put the counter at the
    bar; a camera there loses the ship, and the ship on its pad is where a ware is tried on. So the tab's
    camera is the one place in the room that shows Cosmo, the stall and the ship at once, at every size.

    0548: and the stall is drawn on every tab, so every tab's camera is asked to hold it whole — the
    hangar's cut it in half at the frame's edge, which is why it was Cosmo's alone until the three shared one.
  */
  it('0542 — stands the tab’s keeper at their counter beside the pad on every tab, keeper, counter and ship in view at every size', () => {
    for (const screen of STANDING) {
      const keeper = KEEPERS[SCREENS[screen].stand!.keeper!];
      for (const [width, height] of SIZES) {
        const blits = drawStand(screen, width, height);
        const at = `${screen} at ${width}x${height}`;
        for (const kind of [keeper.figure, keeper.counter, 'blueSide'] as const) {
          const drawn = all(blits, kind);
          expect(drawn, `${at}: ${kind} is not drawn once`).toHaveLength(1);
          const half = (PORT_EXTENT[kind] * drawn[0]!.scale) / 2;
          expect(drawn[0]!.x - half * 0.5, `${at}: ${kind} is off the left of the screen`).toBeGreaterThanOrEqual(0);
          expect(drawn[0]!.x + half * 0.5, `${at}: ${kind} reaches past the stand into the plate`).toBeLessThanOrEqual(width * 0.45);
          expect(drawn[0]!.y, `${at}: ${kind} is not on the screen`).toBeGreaterThan(0);
          expect(drawn[0]!.y, `${at}: ${kind} is not on the screen`).toBeLessThan(height);
        }
        // Behind their counter, it is drawn over them; on it, as Unity stands on their bench (0554), under them.
        const counter = blits.indexOf(all(blits, keeper.counter)[0]!);
        const figure = blits.indexOf(all(blits, keeper.figure)[0]!);
        if (keeper.stands === 'behind') expect(counter, `${at}: ${keeper.name} is drawn over the counter they stand behind`).toBeGreaterThan(figure);
        else expect(figure, `${at}: ${keeper.name} is drawn under the counter they stand on`).toBeGreaterThan(counter);
      }
    }
  });

  /*
    ⚠️ **A KEEPER A TAB — 0550.** Played: *"Hangin Out, Paints & Parts and Cosmo's Cosmetics all show Cosmo"*.
    Each tab's counter is its own keeper's and no other's is drawn, so stepping the tabs changes who is at
    the counter; and no two tabs name one keeper, which is the defect this was.
  */
  it('0550 — draws each tab’s own keeper at the counter and nobody else’s, a different keeper on every tab', () => {
    const named = STANDING.map((screen) => SCREENS[screen].stand!.keeper);
    expect(named, 'a standing tab has nobody at its counter').not.toContain(null);
    expect(new Set(named).size, 'two tabs show the same keeper').toBe(named.length);
    for (const screen of STANDING) {
      const blits = drawStand(screen, 1280, 720);
      for (const kind of KEEPER_KINDS) {
        const row = KEEPERS[kind];
        const expected = kind === SCREENS[screen].stand!.keeper ? 1 : 0;
        expect(all(blits, row.figure), `${screen}: ${row.name} is drawn ${all(blits, row.figure).length} times`).toHaveLength(expected);
        expect(all(blits, row.counter), `${screen}: ${row.name}'s counter is drawn ${all(blits, row.counter).length} times`).toHaveLength(expected);
      }
    }
  });

  /*
    ⚠️ **THE STARS THROUGH THE WALL — 0550.** *"we've lost the space background behind the spacestation
    hanger — can we fit in a starry background to emphasise the space station nature of it?"* The bay is
    behind the plate on every tab, so a viewport is cut in the back wall. Asked in pixels: the hole is on
    the screen, in the stand's part of it, with no wall tile drawn over it and the sky drawn under it.
  */
  it('0550 — cuts a viewport in the back wall that every tab shows in the stand, the sky through it and no wall over it', () => {
    for (const screen of STANDING) {
      for (const [width, height] of SIZES) {
        const at = `${screen} at ${width}x${height}`;
        const blits = drawStand(screen, width, height);
        const viewport = all(blits, 'viewport');
        expect(viewport, `${at}: the viewport is not drawn once`).toHaveLength(1);
        const v = viewport[0]!;
        const unit = v.scale;
        // The pane: two tiles wide, one high, about the viewport's centre.
        const left = v.x - PORT_EXTENT.wall * unit;
        const top = v.y - (PORT_EXTENT.wall / 2) * unit;
        expect(left, `${at}: the pane starts off the left of the screen`).toBeGreaterThanOrEqual(0);
        expect(v.x + PORT_EXTENT.wall * unit, `${at}: the pane reaches into the plate`).toBeLessThanOrEqual(width * 0.45);
        // At least half the pane's height is on the screen, so stars are seen through it and not its frame.
        const seen = Math.min(height, top + PORT_EXTENT.wall * unit) - Math.max(0, top);
        expect(seen / (PORT_EXTENT.wall * unit), `${at}: less than half the pane is on the screen`).toBeGreaterThanOrEqual(0.5);
        const half = (PORT_EXTENT.wall * unit) / 2;
        const over = all(blits, 'wall').filter((b) => b.x > left && b.x < left + 2 * PORT_EXTENT.wall * unit && Math.abs(b.y - v.y) < half);
        expect(over, `${at}: a wall tile is drawn over the pane`).toEqual([]);
        /*
          And the sky is under it: the first level's, which the atlas holds after the port's own kinds, all
          drawn before the wall and the viewport go over it. ⚠️ Not "a sky blit inside the pane": the sky is
          a dozen layer blits across the whole view, whose centres miss a pane the stars show through —
          the first version of this asked that and went red on a picture with stars in it.
        */
        const sky = blits.filter((b) => b.sprite >= PORT_KINDS.length);
        expect(sky.length, `${at}: no sky is drawn behind the room`).toBeGreaterThan(0);
        expect(Math.max(...sky.map((b) => blits.indexOf(b))), `${at}: the sky is drawn over the wall`).toBeLessThan(blits.indexOf(all(blits, 'wall')[0]!));
      }
    }
  });
});
