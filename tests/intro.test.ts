/**
 * The intro — `docs/decisions/0411-the-chase-begins-at-the-port.md`.
 *
 * ⚠️ **THE PICTURE, IN PIXELS, AT THE WIDEST SCREEN THERE IS.** The painter is a pure function of one
 * clock (`src/render/port.ts`), so it is drawn here into a surface that writes down every blit, and
 * the questions are asked of where things landed on a canvas — 0027's *at least one assertion in units
 * the player experiences*. The widest view is the one that shows the most, so it is the one where a
 * ship still on the screen when its shot ends would be seen.
 */

import { describe, expect, it } from 'vitest';
import {
  BEATS,
  CHASE,
  FADE,
  INTRO_CUES,
  INTRO_STEPS,
  JINKS,
  JINK_STEPS,
  LEAP_FROM,
  OUTSIDE,
  OUTSIDE_ZOOM,
  PORT_EXTENT,
  PORT_KINDS,
  PORT_SPRITE,
  STAGE,
  SURGE_STEPS,
  TILT,
  TRACK_DELAY,
  type IntroCue,
  type PortKind,
} from '../src/content/port.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { CADDIE_DISC, SHIPS, SHIP_KINDS, fitted, type ShipKind } from '../src/content/ships.ts';
import { DEFAULT_GOLFER, GOLFERS } from '../src/content/golfers.ts';
import { SKY } from '../src/app/mount.ts';
import { paintPort, paintStand } from '../src/render/port.ts';
import { screenX, type Surface } from '../src/render/surface.ts';
import { MAX_ASPECT, viewOf, type View } from '../src/sim/camera.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { SCREENS, beginsRun } from '../src/state/screens.ts';
import { initialScreen } from '../src/state/slices/screen.ts';

interface Blit {
  sprite: number;
  x: number;
  y: number;
  scale: number;
  alpha: number;
}

class RecordingSurface implements Surface {
  blits: Blit[] = [];
  clear(): void {
    this.blits = [];
  }
  blit(sprite: number, x: number, y: number, scale: number, _turn = 0, alpha = 1): void {
    this.blits.push({ sprite, x, y, scale, alpha });
  }
  bolt(): void {}
}

/** The widest screen any device is given, and a 16:9 one — the narrowest. */
const WIDE = { width: Math.round(1000 * MAX_ASPECT), height: 1000 };
const NARROW = { width: 1920, height: 1080 };

/**
 * Draw the intro at `t`, flying the sky the game builds for a place in space — `SKY`, exactly as
 * `src/app/mount.ts` builds it — whose sprites land at `GAME_BASE` on in the intro's atlas (0416).
 */
function drawAt(t: number, size = WIDE, ship: ShipKind = GOLFERS[DEFAULT_GOLFER].ship): { blits: Blit[]; view: View } {
  const view = viewOf(size.width, size.height);
  const surface = new RecordingSurface();
  // The pilot's ship's own row: its wingtips, where its contrails leave from (0441), and its cockpit (0444).
  paintPort(surface, view, t, SKY, SHIPS[ship]);
  return { blits: surface.blits, view };
}

/** Where the game's sprites start in the intro's atlas — `withTheGame` in `src/render/port-bake.ts`. */
const GAME_BASE = PORT_KINDS.length;

const of = (blits: readonly Blit[], kind: PortKind): Blit | undefined => blits.find((b) => b.sprite === PORT_SPRITE[kind]);

/**
 * How far behind its centre a ship's hull ends, as a fraction of its box — the Viper's nozzle at
 * `-0.88 r`, with `r` 0.42 of the box (`src/render/bake.ts`).
 *
 * ⚠️ **The pilot's ship is the box's own edge, half of it, since 0441.** It was the fighter's tail at
 * `-0.78 r`; now `blue` is whichever ship the golfer flies, each shaped differently inside the one box
 * (the fighter at `FIGHTER_HULL / SHIP_BOX` of it), and the only bound that holds for all four is the
 * box. Every use below asks whether the tail is PAST a line, so the box's edge is the strict answer —
 * and the hangar's side-on picture of it (`blueSide`, 0444) is baked in the same box.
 */
const TAIL: Partial<Record<PortKind, number>> = { blue: 0.5, blueSide: 0.5, viper: 0.88 * 0.42 };

/** Where a drawn ship's tail is, in pixels. */
function tailPx(b: Blit, kind: 'blue' | 'blueSide' | 'viper'): number {
  return b.x - TAIL[kind]! * PORT_EXTENT[kind] * b.scale;
}

describe('the intro is a screen the first flight plays, and it leaves by itself', () => {
  it('follows the splash, has no panel, steps nothing, and goes into the run on its own clock', () => {
    // 0415: the page opens on the splash. 0513: the first Fly of a visit plays the intro, and it ends in
    // the run that flight asked for — `playing` from outside a run is a run begun (`src/app/mount.ts`).
    expect(initialScreen.current).toBe('splash');
    const row = SCREENS.intro;
    expect(row.heading, 'the intro grew words').toBe('');
    expect(row.actions, 'the intro grew a button — a picture, not a screen with controls').toEqual([]);
    expect(row.steps, 'the sim runs under a picture that cannot touch it').toBe(false);
    expect(row.inRun, 'the intro counts as inside a run, so its end would resume a run nobody began').toBe(false);
    expect(row.timeout).toEqual({ steps: INTRO_STEPS, then: 'playing' });
  });

  it('0513 — the intro running out begins a run, and the count-in running out does not begin another', () => {
    // The two screens that expire into play, read the way the shell reads them (`beginsRun`).
    expect(beginsRun('intro', SCREENS.intro.timeout!.then!), 'the intro ended on a field with no run behind it').toBe(true);
    expect(
      beginsRun('resuming', SCREENS.resuming.timeout!.then!),
      'the end of a pause began a new run and threw the held one away',
    ).toBe(false);
  });

  it('runs its beats in the order they are written', () => {
    const times = Object.values(BEATS);
    for (let i = 1; i < times.length; i++) {
      expect(times[i]!, `${Object.keys(BEATS)[i]} comes before the beat written above it`).toBeGreaterThan(times[i - 1]!);
    }
    expect(BEATS.end).toBe(INTRO_STEPS);
  });
});

describe('the picture', () => {
  it('opens out of the backdrop and ends in it, so the title comes up out of the screen it is drawn on', () => {
    // The veil is the palette's space — the colour the golfers and the title are drawn on (0416).
    const first = drawAt(0).blits.at(-1)!;
    expect(first.sprite, 'the first frame is not covered').toBe(PORT_SPRITE.veil);
    expect(first.alpha).toBeCloseTo(1, 5);
    const last = drawAt(INTRO_STEPS - 0.001).blits.at(-1)!;
    expect(last.sprite, 'the last frame is not covered, so the title cuts in over a picture').toBe(PORT_SPRITE.veil);
    expect(last.alpha).toBeGreaterThan(0.99);
  });

  it('is never veiled in the middle of a shot', () => {
    for (const t of [BEATS.viperLit, BEATS.viperGo, BEATS.pilotOut, BEATS.blueGo, BEATS.viperRuns, BEATS.blueRuns]) {
      expect(of(drawAt(t).blits, 'veil'), `the picture is veiled at step ${t}`).toBeUndefined();
    }
  });

  it('draws every piece of the port it bakes, at some moment of it', () => {
    const seen = new Set<number>();
    for (let t = 0; t < INTRO_STEPS; t += 1) for (const b of drawAt(t, NARROW).blits) seen.add(b.sprite);
    /*
      ⚠️ **OR ON THE STAND, SINCE 0540**, which is baked from the same pieces: the hangar's tabs stand in the
      room, and a car on a rim that turns has its spinners drawn there and in no frame of the intro.
      0542: and Cosmo's tab, the one stand with a keeper, has their stall.
    */
    const stand = new RecordingSurface();
    paintStand(stand, viewOf(NARROW.width, NARROW.height), 0, SKY, fitted(SHIPS.firebird, SHIPS.firebird.weapon, 'spinner'), true);
    for (const b of stand.blits) seen.add(b.sprite);
    const unseen = PORT_KINDS.filter((kind) => !seen.has(PORT_SPRITE[kind]));
    expect(unseen, 'baked for the intro and the stand and never drawn in either').toEqual([]);
  });

  it('has the Viper through the bay before the bar door opens, so the pilot runs after her', () => {
    const { blits, view } = drawAt(BEATS.door);
    const viper = of(blits, 'viper');
    const bay = screenX(view, STAGE.bay, 0);
    if (viper !== undefined) expect(tailPx(viper, 'viper'), 'the Viper is still in the hangar when the door opens').toBeGreaterThan(bay);
  });

  it('has the fighter through the bay before the hangar fades', () => {
    // The hangar draws the pilot's ship as it sees it — `blueSide` since 0444.
    const { blits, view } = drawAt(BEATS.cut - FADE);
    const blue = of(blits, 'blueSide');
    const bay = screenX(view, STAGE.bay, 0);
    if (blue !== undefined) expect(tailPx(blue, 'blueSide'), 'the fighter is still in the hangar as it goes dark').toBeGreaterThan(bay);
  });

  it('has both ships off the widest screen before the last fade', () => {
    const { blits } = drawAt(BEATS.fadeOut);
    for (const kind of ['viper', 'blue'] as const) {
      const ship = of(blits, kind);
      if (ship !== undefined) expect(tailPx(ship, kind), `${kind} is still on the screen when the picture goes`).toBeGreaterThan(WIDE.width);
    }
  });

  it('never lets the fighter cover the pilot', () => {
    /*
      ⚠️ **THE FIRST BUILD RAN THE PILOT UNDER THE FIGHTER'S WING, WHERE THEY VANISHED.** Photographed,
      not reasoned: the ship was drawn after the pilot so the leap would end inside it, which put the
      whole run behind the wing. The pilot is drawn over the ship now, and fades into the cockpit.
    */
    for (let t = BEATS.pilotOut; t < BEATS.pilotIn; t += 3) {
      const { blits } = drawAt(t);
      const pilot = blits.findIndex((b) => b.sprite >= PORT_SPRITE.pilotRun0 && b.sprite <= PORT_SPRITE.pilotLeap);
      // The LAST blit of the ship, in any of its pictures, so one drawn over the pilot anywhere is found.
      let blue = -1;
      blits.forEach((b, i) => {
        if (b.sprite >= PORT_SPRITE.blueSide && b.sprite <= PORT_SPRITE.blue) blue = i;
      });
      expect(pilot, `no pilot at step ${t}`).toBeGreaterThanOrEqual(0);
      expect(pilot, `the fighter is drawn over the pilot at step ${t}`).toBeGreaterThan(blue);
    }
  });

  it('carries the pilot from the run into the leap without a jump', () => {
    const at = (t: number): Blit =>
      drawAt(t).blits.find((b) => b.sprite >= PORT_SPRITE.pilotRun0 && b.sprite <= PORT_SPRITE.pilotLeap)!;
    const ran = at(BEATS.pilotLeap - 0.001);
    const leapt = at(BEATS.pilotLeap);
    const { view } = drawAt(0);
    expect(Math.abs(leapt.x - ran.x), 'the pilot jumped along the deck between the run and the leap').toBeLessThan(2);
    expect(Math.abs(leapt.y - ran.y), 'the pilot jumped off the deck between the run and the leap').toBeLessThan(view.scale * 1);
    expect(leapt.x).toBeCloseTo(screenX(view, LEAP_FROM, 0), 0);
  });
});

describe('the intro is heard where it is seen — 0412', () => {
  /*
    ⚠️ **EVERY CUE IS THE TWIN OF A PICTURE, AND HERE THE PICTURE IS ON A CLOCK.** `src/content/cues.ts`
    names what each cue's twin is; this holds that the intro actually DRAWS it on the step the cue plays
    — 0024's *every cue has a visual twin* in the one place where a sound and a picture are both
    authored as times, so they can drift apart by an edit to either table.
  */
  const TWIN_SPRITES: Record<IntroCue['cue'], readonly PortKind[]> = {
    ignite: ['viperIdle', 'blueIdle'],
    launch: ['flash', 'viperFlare', 'blueFlare', 'viperSurge', 'blueSurge'],
    alarm: ['beacon'],
    door: ['spill'],
    step: ['pilotRun0', 'pilotRun1', 'pilotRun2', 'pilotRun3', 'pilotLeap'],
  };

  it('plays every cue on a step that draws its twin', () => {
    for (const row of INTRO_CUES) {
      const drawn = new Set(drawAt(row.at + 1, NARROW).blits.map((b) => b.sprite));
      const twin = TWIN_SPRITES[row.cue].some((kind) => drawn.has(PORT_SPRITE[kind]));
      expect(twin, `${row.cue} at step ${row.at} sounds over a picture that does not show it`).toBe(true);
    }
  });

  it('plays nothing outside the intro, and nothing during the dark between its shots', () => {
    for (const row of INTRO_CUES) {
      expect(row.at, `${row.cue} is outside the intro`).toBeGreaterThanOrEqual(0);
      expect(row.at, `${row.cue} is outside the intro`).toBeLessThan(INTRO_STEPS);
      const dark = row.at >= BEATS.cut && row.at < BEATS.outside;
      expect(dark, `${row.cue} at step ${row.at} sounds over a black screen`).toBe(false);
    }
  });
});

describe('the chase is a chase — 0414', () => {
  /** Where a ship was drawn, in pixels, `s` steps into the dark outside, on a 16:9 screen. */
  const shipAt = (s: number, kind: 'viper' | 'blue'): Blit => of(drawAt(BEATS.outside + s, NARROW).blits, kind)!;
  const { view } = drawAt(0, NARROW);

  it('holds her line between breaks, and each break is quick', () => {
    /*
      ⚠️ **THE FLOATING WAS REPORTED, SO THE HOLD IS WHAT IS HELD.** *"The floaty motion of the
      spaceships in space felt really weird."* 0411's ships were never still across the lane; hers now is,
      except while she breaks.
    */
    for (let i = 0; i < JINKS.length; i++) {
      const from = JINKS[i]!.at + JINK_STEPS;
      const until = i + 1 < JINKS.length ? JINKS[i + 1]!.at : BEATS.viperRuns - BEATS.outside;
      const held = shipAt(from, 'viper').y;
      for (let s = from; s <= until; s += 6) {
        expect(Math.abs(shipAt(s, 'viper').y - held), `she drifts off her line at step ${s} of the shot`).toBeLessThan(0.01);
      }
      const before = shipAt(JINKS[i]!.at, 'viper').y;
      expect(Math.abs(held - before), `break ${i} did not move her`).toBeGreaterThan(view.scale * 5);
    }
  });

  it('has the fighter fly her line, late', () => {
    // Once it has settled onto her track — its line is hers `TRACK_DELAY` steps earlier, a little below.
    const offset = (CHASE.blue.across - CHASE.viper.across) * OUTSIDE_ZOOM * view.scale;
    for (let s = 90; s < BEATS.viperRuns - BEATS.outside; s += 10) {
      const theirs = shipAt(s, 'blue').y;
      const hers = shipAt(s - TRACK_DELAY, 'viper').y;
      expect(Math.abs(theirs - (hers + offset)), `the fighter is off her line at step ${s} of the shot`).toBeLessThan(0.5);
    }
  });

  it('opens up well behind her', () => {
    const s = BEATS.viperRuns - BEATS.outside - 1;
    const gap = shipAt(s, 'viper').x - shipAt(s, 'blue').x;
    expect(gap, 'the fighter is not far enough behind her to be chasing').toBeGreaterThan(view.alongSpan * view.scale * 0.35);
  });

  it('leaves the pad slower off the mark than she did', () => {
    const moved = (t: number, kind: 'viper' | 'blueSide'): number => {
      const blits = drawAt(t, NARROW).blits;
      return of(blits, kind)!.x;
    };
    const after = 40;
    const hers = moved(BEATS.viperGo + after, 'viper') - moved(BEATS.viperGo, 'viper');
    // The hangar's picture of the pilot's ship — 0444.
    const theirs = moved(BEATS.blueGo + after, 'blueSide') - moved(BEATS.blueGo, 'blueSide');
    // With a margin: two equal launches differ only by rounding, and `npm run prove` found a bare
    // less-than passing over one. The fighter's is three quarters of hers by design.
    expect(theirs, 'the fighter left its pad as fast as she did').toBeLessThan(hers * 0.9);
  });

  it('flies the pilot’s ship out of the hangar as the hangar sees it, and tilts it into the fight’s view outside — 0444', () => {
    /*
      *"in the intro movie it really needs to be sideview, lifts up and flies out of the hanger then tilts
      so it's topdown view."* Held for every ship, since the picture is each ship's own (`HANGAR_ART`) and
      the order is the painter's: never the fight's picture in the hangar, the hangar's out of the bay,
      every frame of the tilt in order and none of them twice, and the fight's alone once it is over.
    */
    for (const ship of SHIP_KINDS) {
      const pictures = (t: number): Blit[] =>
        drawAt(t, NARROW, ship).blits.filter((b) => b.sprite >= PORT_SPRITE.blueSide && b.sprite <= PORT_SPRITE.blue);
      for (let t = BEATS.pilotIn; t < BEATS.cut - FADE; t += 5) {
        expect(pictures(t).map((b) => b.sprite), `${ship}: the hangar draws the fight's picture at step ${t}`).toEqual([PORT_SPRITE.blueSide]);
      }
      expect(pictures(BEATS.outside + TILT.from - 1).map((b) => b.sprite), `${ship}: tilting before it is clear of the bay`).toEqual([PORT_SPRITE.blueSide]);
      let reached = PORT_SPRITE.blueSide;
      for (let s = TILT.from; s <= TILT.from + TILT.steps; s += 1) {
        const under = pictures(BEATS.outside + s)[0]!.sprite;
        expect(under, `${ship}: the tilt went back a frame at step ${s} of the shot`).toBeGreaterThanOrEqual(reached);
        expect(under - reached, `${ship}: the tilt skipped a frame at step ${s} of the shot`).toBeLessThanOrEqual(1);
        reached = under;
      }
      const over = pictures(BEATS.outside + TILT.from + TILT.steps);
      expect(over.map((b) => b.sprite), `${ship}: still tilting when the tilt is over`).toEqual([PORT_SPRITE.blue]);
      expect(over[0]!.alpha).toBe(1);
    }
  });

  it('draws every pilot’s ship no bigger than the fighter was beside the bar door, and the saucer smaller again — 0450', () => {
    /*
      ⚠️ **IN PIXELS ON A 16:9 SCREEN.** Played: *"all the player ships are really large in the intro
      movie"*, and of the saucer, *"needs a 20% reduction in the hanger and probably a 40% reduction in
      the space chase."* Before 0441 the hangar drew the fighter's bare hull 30 units long; 0441 baked the
      whole 9.4-unit box at that hull's scale, 40 units, so every ship stood a third bigger. Each box is
      measured as drawn: its baked extent times the scale it was blitted at.
    */
    const view = viewOf(NARROW.width, NARROW.height);
    const was = (30 / 7) * 9.4;
    const drawn = (t: number, ship: ShipKind, kind: PortKind): number => {
      const b = drawAt(t, NARROW, ship).blits.find((x) => x.sprite === PORT_SPRITE[kind]);
      expect(b, `${ship}: no ${kind} at step ${t}`).toBeDefined();
      return (PORT_EXTENT[kind] * b!.scale) / view.scale;
    };
    /*
      ⚠️ **AND A FIFTH SMALLER AGAIN — 0461**: *"the player's ships seem large again, they should be about
      20% smaller."* So every box is 24 where 0450 held it to 30, and the saucer's own two reductions ride
      on top: four fifths of 0450's three quarters in the hangar, and its 0.8 more in the chase.
    */
    /*
      ⚠️ **WHAT FILLS THE BOX, WHICH FOR THE SAUCER IS ITS DISC SINCE 0461.** Its pods hang off its sides,
      so its disc is `CADDIE_DISC` of the box and its row draws the box bigger by as much; what was asked
      to shrink is the saucer, and a box held to 24 would have held it a third under the ask.
    */
    const fills = (ship: ShipKind): number => (ship === 'caddie' ? CADDIE_DISC : 1);
    for (const ship of SHIP_KINDS) {
      expect(drawn(BEATS.pilotIn, ship, 'blueSide') * fills(ship), `${ship}: drawn bigger in the hangar than a fifth under 0450's`).toBeLessThanOrEqual(24 + 1e-9);
    }
    const hangar = (drawn(BEATS.pilotIn, 'caddie', 'blueSide') * CADDIE_DISC) / was;
    const chase = (drawn(BEATS.outside + TILT.from + TILT.steps + 10, 'caddie', 'blue') * CADDIE_DISC) / (was * OUTSIDE_ZOOM);
    expect(hangar, `the saucer is ${hangar.toFixed(2)} of its size in the hangar, and was asked to lose a fifth and then a fifth again`).toBeCloseTo(0.6, 2);
    expect(chase, `the saucer is ${chase.toFixed(2)} of its size in the chase, and was asked to lose two fifths and then a fifth again`).toBeCloseTo(0.48, 2);
    // And beside her: the Viper lost a tenth with it, so she still stands taller than any pilot's ship.
    const viper = drawn(BEATS.viperLit, 'fighter', 'viper');
    for (const ship of SHIP_KINDS) {
      expect(drawn(BEATS.pilotIn, ship, 'blueSide'), `${ship}: as big as the Viper in the hangar`).toBeLessThan(viper);
    }
    // And outside, once it has tilted over, it burns from the fight's nozzles alone: two drives on a saucer.
    const lit = drawAt(BEATS.outside + TILT.from + TILT.steps + 10, NARROW, 'caddie').blits.map((b) => b.sprite);
    expect(lit.includes(PORT_SPRITE.blueTopFlare) || lit.includes(PORT_SPRITE.blueTopBurn), 'the chase burns the hangar’s flames').toBe(true);
    expect(lit.includes(PORT_SPRITE.blueFlare) || lit.includes(PORT_SPRITE.blueBurn), 'the hangar’s flames are still lit in the chase').toBe(false);
  });

  it('draws no trail before a ship jets off, and trails off its wingtips after', () => {
    // Whichever ship the pilot runs out to — 0441: each trails from its own wingtips.
    for (const ship of SHIP_KINDS) {
      const trails = (t: number): number =>
        drawAt(t, NARROW, ship).blits.filter((b) => b.sprite === PORT_SPRITE.contrail).length;
      expect(trails(BEATS.viperRuns - 1), `${ship}: a trail before anyone jetted off`).toBe(0);
      /*
        ⚠️ **AND WHILE THE FIGHTER IS STILL COMING OUT OF THE BAY**, which is the one time before the
        throttle that a ship is moving forward on screen — a trail sample is invisible where it is not, so
        the step above could not see trails drawn early, and `npm run prove` said so.
      */
      expect(trails(BEATS.outside + 40), `${ship}: a trail behind it as it leaves the station`).toBe(0);
      const hers = trails(BEATS.viperRuns + 30);
      expect(hers, `${ship}: no trail behind her as she jets off`).toBeGreaterThan(8);
      expect(trails(BEATS.blueRuns + 30), `${ship}: no trail behind it as it jets off`).toBeGreaterThan(
        trails(BEATS.blueRuns - 1),
      );
    }
  });
});

describe('the jets surge, and the sky is the first level’s — 0416', () => {
  /*
    ⚠️ **TWO GUARDS ON VENOMA'S RUN STOOD HERE — *runs Venoma out of the bar and into the Viper before
    its engines light* and *never lets either ship cover her* — UNTIL 0444 TOOK THE RUN OUT.** Their
    subject is gone, so they went with it rather than being pointed at something else:
    `docs/decisions/0444-the-intro-is-the-pilots.md`.
  */

  it('surges the jets on the step each launch is heard, and settles them into the burn', () => {
    /*
      Asked for: *"we also need the jets to supercharge fire when the blast off happens in the movie as
      well to match the blast off sound they have"*. Held against the cue table rather than the beats, so
      a launch moved in either one without the other fails here.
    */
    // The pilot's ship surges in the hangar's flames or the fight's, whichever view it is in — 0450.
    const surges = (t: number): Blit[] =>
      drawAt(t, NARROW).blits.filter(
        (b) => b.sprite === PORT_SPRITE.viperSurge || b.sprite === PORT_SPRITE.blueSurge || b.sprite === PORT_SPRITE.blueTopSurge,
      );
    const launches = INTRO_CUES.filter((row) => row.cue === 'launch');
    expect(launches.length, 'the intro has no launches to surge on').toBe(4);
    for (const row of launches) {
      const at = surges(row.at);
      expect(at.length, `no surge on the launch heard at step ${row.at}`).toBe(1);
      expect(at[0]!.alpha, `the surge at step ${row.at} is not at full`).toBeGreaterThan(0.95);
      expect(surges(row.at - 1), `a surge before the launch at step ${row.at} is heard`).toEqual([]);
      expect(surges(row.at + SURGE_STEPS), `the surge from step ${row.at} never settles`).toEqual([]);
    }
  });

  it('flies the level’s own sky past the ships, at the level’s own rate and size', () => {
    /*
      *"it should kinda lead straight into level 1"* — held in pixels on a 16:9 screen: every layer of the
      sky a place in space is built with is drawn outside, each moves at `SCROLL_PER_STEP` times its own
      depth, which is how far it moves in a step of play, and none is framed by the shot's zoom.
    */
    const { view } = drawAt(0, NARROW);
    const s = BEATS.outside + OUTSIDE.ramp + 40;
    const now = drawAt(s, NARROW).blits;
    const next = drawAt(s + 1, NARROW).blits;
    for (const layer of SKY) {
      const sprite = GAME_BASE + layer.sprite;
      const tiles = now.filter((b) => b.sprite === sprite);
      expect(tiles.length, `a layer of the level's sky is not drawn outside (sprite ${layer.sprite})`).toBeGreaterThan(0);
      for (const tile of tiles) expect(tile.scale, 'the sky is framed by the zoom').toBeCloseTo(view.scale, 6);
      const moved = SCROLL_PER_STEP * layer.depth * view.scale;
      const x = tiles[0]!.x - moved;
      const found = next.some((b) => b.sprite === sprite && Math.abs(b.x - x) < 0.01);
      expect(found, `the layer at depth ${layer.depth} does not move ${moved.toFixed(2)} px a step, as it does in play`).toBe(true);
    }
    // And through the bay, while the room is held still.
    expect(drawAt(BEATS.viperLit).blits.some((b) => b.sprite === GAME_BASE + SPRITE.skyFar), 'no sky through the bay').toBe(true);
  });
});
