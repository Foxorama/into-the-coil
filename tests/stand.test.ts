/**
 * THE HANGAR IS THE PORT — `docs/decisions/0540-the-hangar-is-the-port.md`.
 *
 * The stand is drawn into a surface that writes down every blit, as the intro is (`tests/intro.test.ts`),
 * and asked where things landed: in pixels on the screen each tab's camera makes of the room.
 */

import { describe, expect, it } from 'vitest';
import { DOCK, PORT_EXTENT, PORT_KINDS, PORT_SPRITE, STAGE, type PortKind } from '../src/content/port.ts';
import { DOCK_PLACES, DOCK_PLACE_KINDS, KEEPERS, KEEPER_KINDS, drawSpots, isDockPlace, type KeeperKind } from '../src/content/keepers.ts';
import { makeRng } from '../src/sim/rng.ts';
import { SHIPS, fitted } from '../src/content/ships.ts';
import { SKY } from '../src/app/mount.ts';
import { fitStand, paintStand, standViewInto } from '../src/render/port.ts';
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

/**
 * The stand's column, as the stylesheet lays it out — 0568: on anything taller than a phone, the plate a
 * fixed 24 rem column on the left inside the panel's 0.8 rem padding and the stand the rest; on a phone
 * (0465's 460 px), the stand the left third. Modelled because this runs without a page; the page's own
 * column is read by `standBox`, and tests/stand.browser.test.ts holds the readout in it.
 */
function standColumn(width: number, height: number): { left: number; width: number; top: number; height: number } {
  if (height > 460) {
    const left = 12.8 + 384;
    return { left, width: width - left - 12.8, top: 12.8, height: height - 25.6 };
  }
  return { left: width * 0.02, width: width * 0.31, top: 0, height };
}

function drawStand(
  screen: (typeof STANDING)[number],
  width: number,
  height: number,
  t = 0,
  ship = SHIPS.firebird,
  camera = SCREENS[screen].stand!.camera,
  spot: number | Readonly<Record<KeeperKind, number>> = 0,
): Blit[] {
  const base = viewOf(width, height);
  const view = { ...base };
  /*
    0563: through the camera the page uses — the row's, fitted to the stand's column. The column is the
    stylesheet's (the plate takes 1.6 of 2.6 above 1100 wide, 2 of 3 below, after the panel's padding);
    modelled here because this runs without a page, and held in the page by tests/stand.browser.test.ts.
  */
  const fitted = { ...camera };
  const box = standColumn(width, height);
  fitStand(camera, base, width, box, SCREENS[screen].stand!.keeper, fitted, height);
  standViewInto(base, fitted, width, height, view);
  const surface = new RecordingSurface();
  // 0571: every keeper is in the room; `spot` is where all three stand this time — or, since 0611, where each does.
  const spots = typeof spot === 'number' ? (Object.fromEntries(KEEPER_KINDS.map((kind) => [kind, spot])) as Record<KeeperKind, number>) : spot;
  paintStand(surface, view, t, SKY, ship, SCREENS[screen].stand!.keeper, -1e9, spots);
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
      // 0568: the ship's pad alone — the inner one stood half under the keeper's counter.
      // 0571: the ship on its cradle, and no pad: the dock has none.
      expect(all(blits, 'cradle'), `${screen}: the ship's cradle is not there, once`).toHaveLength(1);
    }
  });

  it('puts the ship on its pad in the stand’s part of the screen, on every tab, at every size', () => {
    // 0548: every tab, and it was the two whose camera stood on the pad — none does now, which left it asking nothing.
    for (const screen of STANDING) {
      for (const [width, height] of SIZES) {
        const ship = all(drawStand(screen, width, height), 'blueSide')[0]!;
        const half = (PORT_EXTENT.blueSide * ship.scale) / 2;
        const at = `${screen} at ${width}x${height}`;
        // 0568: in the stand's column, wherever the layout puts it — the plate's left on a desktop, its right on a phone.
        const box = standColumn(width, height);
        expect(ship.x + half * 0.84, `${at}: the ship reaches past the stand`).toBeLessThanOrEqual(box.left + box.width);
        expect(ship.x - half * 0.84, `${at}: the ship is under the plate`).toBeGreaterThanOrEqual(box.left);
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
        /*
          0568: the keeper in the column on every screen bigger than a phone. On a phone the stand is a third
          of the screen, and at the room's full height it holds the ship or the counter, not both: the ship.
        */
        for (const kind of height > 460 ? ([keeper.figure, keeper.counter, 'blueSide'] as const) : (['blueSide'] as const)) {
          const drawn = all(blits, kind);
          expect(drawn, `${at}: ${kind} is not drawn once`).toHaveLength(1);
          const half = (PORT_EXTENT[kind] * drawn[0]!.scale) / 2;
          // 0568: in the stand's column.
          const box = standColumn(width, height);
          expect(drawn[0]!.x - half * 0.5, `${at}: ${kind} is under the plate or off the screen`).toBeGreaterThanOrEqual(box.left);
          expect(drawn[0]!.x + half * 0.5, `${at}: ${kind} reaches past the stand`).toBeLessThanOrEqual(box.left + box.width);
          expect(drawn[0]!.y, `${at}: ${kind} is not on the screen`).toBeGreaterThan(0);
          expect(drawn[0]!.y, `${at}: ${kind} is not on the screen`).toBeLessThan(height);
        }
        // Behind their counter, it is drawn over them; on it, as Unity stands on their bench (0554), under them.
        const counter = blits.indexOf(all(blits, keeper.counter)[0]!);
        const figure = blits.indexOf(all(blits, keeper.figure)[0]!);
        const first = keeper.spots[0];
        if (first.at === 'counter' && first.drawn === 'behind') expect(counter, `${at}: ${keeper.name} is drawn over the counter they stand behind`).toBeGreaterThan(figure);
        else expect(figure, `${at}: ${keeper.name} is drawn under the counter they stand on`).toBeGreaterThan(counter);
      }
    }
  });

  /*
    ⚠️ **A KEEPER A TAB — 0550.** Played: *"Hangin Out, Paints & Parts and Cosmo's Cosmetics all show Cosmo"*.
    Each tab's counter is its own keeper's and no other's is drawn, so stepping the tabs changes who is at
    the counter; and no two tabs name one keeper, which is the defect this was.
  */
  /*
    ⚠️ **SINCE 0571 EVERY KEEPER IS IN THE ROOM, AND THE TAB'S SHOP IS THE LIT ONE.** 0550's defect was the
    tabs all showing Cosmo; the dock shows all three shops on its mezzanine, and which tab is open is told by
    which shop is lit — the others have the night drawn over them. So: every keeper and counter once, a
    shutter over every shop but the tab's own, none over it, and no two tabs naming one keeper.
  */
  it('0550 — lights each tab’s own keeper’s shop and dims the others, a different keeper on every tab', () => {
    const named = STANDING.map((screen) => SCREENS[screen].stand!.keeper);
    expect(named, 'a standing tab has nobody at its counter').not.toContain(null);
    expect(new Set(named).size, 'two tabs show the same keeper').toBe(named.length);
    for (const screen of STANDING) {
      const blits = drawStand(screen, 1280, 720);
      const veils = all(blits, 'veil');
      for (const kind of KEEPER_KINDS) {
        const row = KEEPERS[kind];
        expect(all(blits, row.figure), `${screen}: ${row.name} is drawn ${all(blits, row.figure).length} times`).toHaveLength(1);
        const counter = all(blits, row.counter);
        expect(counter, `${screen}: ${row.name}'s counter is drawn ${counter.length} times`).toHaveLength(1);
        const dimmed = veils.some((v) => Math.abs(v.x - counter[0]!.x) < 1);
        expect(dimmed, `${screen}: ${row.name}'s shop is ${dimmed ? 'dimmed' : 'lit'}`).toBe(kind !== SCREENS[screen].stand!.keeper);
      }
    }
  });

  /*
    ⚠️ **THE STARS — 0550, AND THE OPEN BAY SINCE 0568.** *"we've lost the space background behind the
    spacestation hanger"* was answered with a viewport cut in the back wall, because the bay stood behind
    the plate. Played: *"I want to see the end of the hangar and the open starfield on the right hand side,
    it feels cramped and claustrophobic"*. The plate is on the left now, so the bay is in the stand, and
    the stars are seen past it. Asked in pixels, on every screen bigger than a phone: the back wall ends
    inside the stand's column with sky past it, and the sky is drawn under the room.
  */
  it('0568 — shows the end of the hangar and the open stars past it in the stand, on every tab', () => {
    for (const screen of STANDING) {
      for (const [width, height] of [...SIZES, [1920, 1080] as const]) {
        const at = `${screen} at ${width}x${height}`;
        const blits = drawStand(screen, width, height);
        if (height > 460) {
          const box = standColumn(width, height);
          const walls = all(blits, 'wall');
          const unit = walls[0]!.scale;
          const wallEnds = Math.max(...walls.map((b) => b.x)) + (PORT_EXTENT.wall * unit) / 2;
          expect(wallEnds, `${at}: the back wall runs past the stand — the bay is not in view`).toBeLessThan(box.left + box.width);
          /*
            Twenty units of stars on a wide screen, the shape the report was made on. ⚠️ **Since 0571, two on a
            4:3**: the dock's three shops are kept whole on the left and the room fills the column's height, and
            a 1024x768's column holds the bay's edge and a strip past it, not an open view. Owed a look.
          */
          const want = width / height >= 16 / 9 - 0.01 ? 20 : 2;
          expect(box.left + box.width - wallEnds, `${at}: fewer than ${want} units of stars past the bay`).toBeGreaterThanOrEqual(want * unit);
        }
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

describe('0563 — the ship is the picture', () => {
  /*
    The review measured the ship on the pad at about 170 pixels of a 1280x720, smaller than the keeper's
    counter beside it — a box of 200, under a sixth of the screen. Asked in what the player sees: the ship's
    box on the laptop is past a sixth of the screen across. It is not more because the keeper and the
    viewport are kept in view (0550) and the ship in its column: those, not this number, set the camera.

    ⚠️ **LOWERED BY 0568 FROM 0.17 TO 0.125, AND WHY.** The player asked for the open bay and the stars on
    the right — *"it feels cramped and claustrophobic"* — and for less zoom: *"everything is way too big
    and zoomed in"*. A 1280's column cannot hold the bay and the ship at 0563's size both, and the camera is
    held to the room's whole height: 0568 draws the ship at 166 of 1280, about the size the review
    measured before 0563, and about 250 of 1920 with the bay and the stars beside it.
  */
  it('draws the pilot’s ship past a sixth of a laptop’s width, in its column', () => {
    for (const screen of STANDING) {
      const ship = all(drawStand(screen, 1280, 720), 'blueSide')[0]!;
      const box = PORT_EXTENT.blueSide * ship.scale;
      expect(box, `${screen}: the ship's box is ${Math.round(box)}px of 1280`).toBeGreaterThanOrEqual(1280 * 0.125);
    }
  });
});

describe('0567 — a fitting is felt', () => {
  /*
    A fitting changed a pill's colour and the picture did nothing. Asked in pixels: a fifth of a second
    after something is fitted, the ship stands higher on its beam than it does with nothing fitted, by
    pixels a player sees; and by half a second it is back.
  */
  it('hops the ship on its beam when it is fitted, and settles it again', () => {
    const base = viewOf(1280, 720);
    const view = { ...base };
    standViewInto(base, SCREENS.hangar.stand!.camera, 1280, 720, view);
    const shipY = (t: number, hop: number): number => {
      const surface = new RecordingSurface();
      paintStand(surface, view, t, SKY, SHIPS.firebird, null, hop);
      return all(surface.blits, 'blueSide')[0]!.y;
    };
    const t = 400;
    const still = shipY(t, -1e9);
    const lifted = shipY(t, t - Math.round(STEPS_PER_SECOND / 5));
    expect(still - lifted, `the ship stood ${(still - lifted).toFixed(1)}px up a fifth of a second after a fitting`).toBeGreaterThan(6);
    expect(Math.abs(shipY(t, t - STEPS_PER_SECOND / 2) - still), 'the ship had not settled half a second after a fitting').toBeLessThan(0.5);
  });
});

describe('0569 — the keepers move about between runs', () => {
  /*
    *"after a run finishes the position of the figure can be in a few different random locations, behind the
    stall, working the ship, out for coffee"*. Asked of every keeper's every spot, in the picture: at the
    counter they stand by it; at the ship they are drawn within a ship's length of it, on the screen; away,
    the counter stands empty. And every keeper has somewhere to be other than their counter, with a line.
  */
  /*
    0611 amends it: at the ship there is no spot any more, and a keeper about the dock is drawn whole (the
    0611 suite below says where). Here: at the counter, their counter figure and not the whole one; away,
    neither; anywhere else, the whole one and not the counter's — 0569 drew a bust at the ship, which floated.
  */
  it('draws each keeper where their spot says, and every keeper has somewhere else to be', () => {
    for (const screen of STANDING) {
      const kind = SCREENS[screen].stand!.keeper!;
      const row = KEEPERS[kind];
      expect(row.spots[0].at, `${row.name}'s first spot is not their counter`).toBe('counter');
      expect(row.spots.some((s) => s.at !== 'counter' && s.line !== null), `${row.name} is only ever at their counter`).toBe(true);
      row.spots.forEach((place, i) => {
        const spots = { ...COUNTERS, [kind]: i };
        const blits = drawStand(screen, 1280, 720, 0, SHIPS.firebird, SCREENS[screen].stand!.camera, spots);
        const figure = all(blits, row.figure);
        const whole = all(blits, row.about.figure);
        const at = `${row.name} ${place.at}`;
        expect(all(blits, row.counter), `${at}: the counter is not there`).toHaveLength(1);
        if (place.at === 'away') {
          expect([...figure, ...whole], `${at}: they are drawn while they are out`).toEqual([]);
          return;
        }
        if (place.at === 'counter') {
          expect(figure, `${at}: they are not drawn`).toHaveLength(1);
          expect(whole, `${at}: they are drawn whole about the dock too`).toEqual([]);
          return;
        }
        expect(whole, `${at}: they are not drawn whole`).toHaveLength(1);
        expect(figure, `${at}: their counter figure is drawn away from the counter`).toEqual([]);
      });
    }
  });
});

/** Every keeper at their counter, the first of their spots. */
const COUNTERS = Object.fromEntries(KEEPER_KINDS.map((kind) => [kind, 0])) as Record<KeeperKind, number>;

/** Every draw the shell may make: every keeper at every spot, and no two at one of the dock's places. */
function everyDraw(): Record<KeeperKind, number>[] {
  let draws: Record<KeeperKind, number>[] = [{ ...COUNTERS }];
  for (const kind of KEEPER_KINDS) {
    const next: Record<KeeperKind, number>[] = [];
    for (const draw of draws) {
      KEEPERS[kind].spots.forEach((spot, i) => {
        const taken = KEEPER_KINDS.slice(0, KEEPER_KINDS.indexOf(kind)).map((k) => KEEPERS[k].spots[draw[k]]!.at);
        if (isDockPlace(spot.at) && taken.includes(spot.at)) return;
        next.push({ ...draw, [kind]: i });
      });
    }
    draws = next;
  }
  return draws;
}

/** The lift at the deck, on its way up, at the catwalk and on its way down — `liftAt`'s round trip of 735 steps. */
const LIFT_MOMENTS = [0, 300, 500, 680] as const;

describe('0611 — the keepers stand somewhere', () => {
  /*
    *"the moving characters can appear on top of each other - and apparently kinda floating in mid air.
    random locations should be on the elevator, on the ground behind or in front of the vehicle or to the
    sides, or in their shops."*

    ⚠️ **IN PIXELS OF THE PICTURE (0027).** Where a keeper's soles are is read off their blit — its centre
    and its scale, and the row's `feet` line, which the painter is handed and stands them on — and asked of
    the floor's own blits: the deck's tiles, or the lift's platform, whose top is its box's middle. Not of the
    place table, which would be the code agreeing with itself.
  */
  it('stands every keeper with their soles on the deck or the lift’s floor, at every place they may be found', () => {
    for (const kind of KEEPER_KINDS) {
      const row = KEEPERS[kind];
      row.spots.forEach((place, i) => {
        if (!isDockPlace(place.at)) return;
        for (const t of LIFT_MOMENTS) {
          const blits = drawStand('hangar', 1280, 720, t, SHIPS.firebird, SCREENS.hangar.stand!.camera, { ...COUNTERS, [kind]: i });
          const at = `${row.name} at ${place.at}, step ${t}`;
          const figure = all(blits, row.about.figure);
          expect(figure, `${at}: not drawn whole`).toHaveLength(1);
          const sole = { x: figure[0]!.x, y: figure[0]!.y + row.about.feet * figure[0]!.scale };
          if (DOCK_PLACES[place.at].floor === 'lift') {
            const car = all(blits, 'liftCar')[0]!;
            expect(Math.abs(sole.y - car.y), `${at}: their soles are not on the lift's platform`).toBeLessThan(1);
            // The platform is ten units wide (`paintLiftCar`): the soles on it, and not off its end.
            expect(Math.abs(sole.x - car.x), `${at}: they stand off the end of the platform`).toBeLessThan(5 * car.scale);
            // And riding it: a figure drawn under the car is behind the platform it stands on.
            expect(blits.indexOf(figure[0]!), `${at}: drawn under the platform`).toBeGreaterThan(blits.indexOf(car));
          } else {
            const deck = all(blits, 'deck');
            const top = Math.min(...deck.map((b) => b.y - (PORT_EXTENT.deck * b.scale) / 2));
            const bottom = Math.max(...deck.map((b) => b.y + (PORT_EXTENT.deck * b.scale) / 2));
            expect(sole.y, `${at}: their soles are over the deck, in the air`).toBeGreaterThanOrEqual(top);
            expect(sole.y, `${at}: their soles are under the deck`).toBeLessThanOrEqual(Math.min(bottom, 720));
            expect(sole.x, `${at}: they are off the screen`).toBeGreaterThan(0);
            expect(sole.x, `${at}: they are off the screen`).toBeLessThan(1280);
          }
        }
      });
    }
  });

  /*
    ⚠️ **TWO KEEPERS NEVER MEET.** Every draw the shell may make — every keeper at every one of their spots,
    no two at one place — at the lift's every height, and each keeper drawn is a box in pixels: whole, their
    `half` either side of the soles and `tall` over them; at the counter, the whole box they are baked in, a
    wider one than they fill. No two boxes may overlap.
  */
  it('never draws two keepers whose pictures meet, in any draw the shell can make', () => {
    const draws = everyDraw();
    expect(draws.length, 'the draws were not enumerated').toBeGreaterThan(KEEPER_KINDS.length * 10);
    for (const draw of draws) {
      for (const t of LIFT_MOMENTS) {
        const blits = drawStand('hangar', 1280, 720, t, SHIPS.firebird, SCREENS.hangar.stand!.camera, draw);
        const boxes = KEEPER_KINDS.flatMap((kind) => {
          const row = KEEPERS[kind];
          const whole = all(blits, row.about.figure)[0];
          if (whole !== undefined) {
            const sole = whole.y + row.about.feet * whole.scale;
            return [{ kind, left: whole.x - row.about.half * whole.scale, right: whole.x + row.about.half * whole.scale, top: sole - row.about.tall * whole.scale, bottom: sole }];
          }
          const figure = all(blits, row.figure)[0];
          if (figure === undefined) return [];
          const half = (PORT_EXTENT[row.figure] * figure.scale) / 2;
          return [{ kind, left: figure.x - half, right: figure.x + half, top: figure.y - half, bottom: figure.y + half }];
        });
        for (let a = 0; a < boxes.length; a++) {
          for (let b = a + 1; b < boxes.length; b++) {
            const p = boxes[a]!;
            const q = boxes[b]!;
            const meet = p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom;
            const where = (k: KeeperKind) => KEEPERS[k].spots[draw[k]]!.at;
            expect(meet, `${p.kind} at ${where(p.kind)} meets ${q.kind} at ${where(q.kind)}, step ${t}`).toBe(false);
          }
        }
      }
    }
  });

  /*
    The shell's draw after a run (`drawSpots`): one keeper to a place, every spot of every keeper reachable,
    and the counter or away always left to draw. Many seeds, because the draw is the shell's to be random.
  */
  it('draws every keeper a different place after every run, and every spot is somewhere they turn up', () => {
    const seen = Object.fromEntries(KEEPER_KINDS.map((kind) => [kind, new Set<number>()])) as Record<KeeperKind, Set<number>>;
    const out = { ...COUNTERS };
    for (let seed = 0; seed < 600; seed++) {
      const rng = makeRng(seed).stream('spots');
      for (let run = 0; run < 4; run++) {
        drawSpots(rng, out);
        const places = KEEPER_KINDS.map((kind) => KEEPERS[kind].spots[out[kind]]!.at).filter(isDockPlace);
        expect(new Set(places).size, `seed ${seed}: two keepers at one place — ${places.join(', ')}`).toBe(places.length);
        for (const kind of KEEPER_KINDS) seen[kind].add(out[kind]);
      }
    }
    for (const kind of KEEPER_KINDS) expect(seen[kind].size, `${KEEPERS[kind].name} never turns up at some of their spots`).toBe(KEEPERS[kind].spots.length);
    // And every place in the dock is one some keeper goes to — a place no row names is a place nobody stands.
    for (const place of DOCK_PLACE_KINDS) expect(KEEPER_KINDS.some((kind) => KEEPERS[kind].spots.some((s) => s.at === place)), `nobody goes to ${place}`).toBe(true);
  });
});

/*
  ── 0628: THE SHIP IN THE MIDDLE OF THE OPEN DECK ────────────────────────────────────────────────

  Played, with the ship six units on toward the bay for the workshop wall: *"the car now looks like it's flat
  against the wall instead of in the centre of the hangar bay."* Its flame ended at the wall's post. Held in
  pixels on the screen: the deck the ship's hull leaves either side of it — to the wall's right-hand post, and to
  the bay's edge — is room on both sides and about the same.
*/
describe('0628 — the ship stands in the middle of the open deck', () => {
  it('leaves about as much deck between its hull and the workshop wall as between its hull and the bay, at every desktop size', () => {
    for (const [width, height] of [[1024, 768], [1280, 720], [1920, 1080]] as const) {
      const blits = drawStand('hangar', width, height);
      const wall = all(blits, 'workWall')[0]!;
      const ship = all(blits, 'blueSide')[0]!;
      const field = all(blits, 'field')[0]!;
      const at = `${width}x${height}`;
      // A unit in pixels is the wall's blit scale (it is laid at 1); the field stands a unit past the bay.
      const post = wall.x + DOCK.workshop.half * wall.scale;
      const bay = field.x - wall.scale;
      // The hull's own reach, as 0540's guard reads it: 0.84 of the ship's half-box.
      const hull = (PORT_EXTENT.blueSide * ship.scale * 0.84) / 2;
      const behind = ship.x - hull - post;
      const ahead = bay - (ship.x + hull);
      expect(behind, `${at}: the ship's hull is against the workshop wall — ${behind.toFixed(0)} px of deck behind it`).toBeGreaterThan(4 * wall.scale);
      expect(ahead, `${at}: the ship's hull is against the bay — ${ahead.toFixed(0)} px of deck ahead of it`).toBeGreaterThan(4 * wall.scale);
      expect(Math.abs(behind - ahead), `${at}: ${behind.toFixed(0)} px of deck behind the ship and ${ahead.toFixed(0)} px ahead — it is not in the middle`).toBeLessThan(0.3 * (behind + ahead));
    }
  });
});
