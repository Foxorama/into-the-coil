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
  RIVAL_LEAP_FROM,
  STAGE,
  SURGE_STEPS,
  TRACK_DELAY,
  type IntroCue,
  type PortKind,
} from '../src/content/port.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { SHIPS, SHIP_KINDS, type ShipKind } from '../src/content/ships.ts';
import { DEFAULT_GOLFER, GOLFERS } from '../src/content/golfers.ts';
import { SKY } from '../src/app/mount.ts';
import { paintPort } from '../src/render/port.ts';
import { screenX, type Surface } from '../src/render/surface.ts';
import { MAX_ASPECT, viewOf, type View } from '../src/sim/camera.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { SCREENS } from '../src/state/screens.ts';
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
  // The pilot's ship's own wingtip, which is where its contrails leave from — 0441.
  paintPort(surface, view, t, SKY, SHIPS[ship].wingtip);
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
 * box. Every use below asks whether the tail is PAST a line, so the box's edge is the strict answer.
 */
const TAIL: Partial<Record<PortKind, number>> = { blue: 0.5, viper: 0.88 * 0.42 };

/** Where a drawn ship's tail is, in pixels. */
function tailPx(b: Blit, kind: 'blue' | 'viper'): number {
  return b.x - TAIL[kind]! * PORT_EXTENT[kind] * b.scale;
}

describe('the intro is a screen a pick plays, and it leaves by itself', () => {
  it('follows the splash, has no panel, steps nothing, and goes to the title on its own clock', () => {
    // 0415: the page opens on the splash; a golfer picked on the select screen plays the intro.
    expect(initialScreen.current).toBe('splash');
    const row = SCREENS.intro;
    expect(row.heading, 'the intro grew words').toBe('');
    expect(row.actions, 'the intro grew a button — a picture, not a screen with controls').toEqual([]);
    expect(row.steps, 'the sim runs under a picture that cannot touch it').toBe(false);
    expect(row.timeout).toEqual({ steps: INTRO_STEPS, then: 'title' });
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
    for (const t of [BEATS.rivalLeap, BEATS.viperGo, BEATS.pilotOut, BEATS.blueGo, BEATS.viperRuns, BEATS.blueRuns]) {
      expect(of(drawAt(t).blits, 'veil'), `the picture is veiled at step ${t}`).toBeUndefined();
    }
  });

  it('draws every piece of the port it bakes, at some moment of it', () => {
    const seen = new Set<number>();
    for (let t = 0; t < INTRO_STEPS; t += 1) for (const b of drawAt(t, NARROW).blits) seen.add(b.sprite);
    const unseen = PORT_KINDS.filter((kind) => !seen.has(PORT_SPRITE[kind]));
    expect(unseen, 'baked for the intro and never drawn in it').toEqual([]);
  });

  it('has the Viper through the bay before the bar door opens, so the pilot runs after her', () => {
    const { blits, view } = drawAt(BEATS.door);
    const viper = of(blits, 'viper');
    const bay = screenX(view, STAGE.bay, 0);
    if (viper !== undefined) expect(tailPx(viper, 'viper'), 'the Viper is still in the hangar when the door opens').toBeGreaterThan(bay);
  });

  it('has the fighter through the bay before the hangar fades', () => {
    const { blits, view } = drawAt(BEATS.cut - FADE);
    const blue = of(blits, 'blue');
    const bay = screenX(view, STAGE.bay, 0);
    if (blue !== undefined) expect(tailPx(blue, 'blue'), 'the fighter is still in the hangar as it goes dark').toBeGreaterThan(bay);
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
      // The LAST fighter blit, so one drawn over the pilot anywhere in the frame is found.
      let blue = -1;
      blits.forEach((b, i) => {
        if (b.sprite === PORT_SPRITE.blue) blue = i;
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
    step: ['pilotRun0', 'pilotRun1', 'pilotRun2', 'pilotRun3', 'pilotLeap', 'rivalRun0', 'rivalRun1', 'rivalRun2', 'rivalRun3', 'rivalLeap'],
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
    const moved = (t: number, kind: 'viper' | 'blue'): number => {
      const blits = drawAt(t, NARROW).blits;
      return of(blits, kind)!.x;
    };
    const after = 40;
    const hers = moved(BEATS.viperGo + after, 'viper') - moved(BEATS.viperGo, 'viper');
    const theirs = moved(BEATS.blueGo + after, 'blue') - moved(BEATS.blueGo, 'blue');
    // With a margin: two equal launches differ only by rounding, and `npm run prove` found a bare
    // less-than passing over one. The fighter's is three quarters of hers by design.
    expect(theirs, 'the fighter left its pad as fast as she did').toBeLessThan(hers * 0.9);
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

describe('the Viper has a pilot, the jets surge, and the sky is the first level’s — 0416', () => {
  const rival = (blits: readonly Blit[]): Blit | undefined =>
    blits.find((b) => b.sprite >= PORT_SPRITE.rivalRun0 && b.sprite <= PORT_SPRITE.rivalLeap);

  it('runs Venoma out of the bar and into the Viper before its engines light', () => {
    const { view } = drawAt(0);
    const out = rival(drawAt(BEATS.rivalOut + 1).blits);
    expect(out, 'nobody comes out of the bar for the Viper').toBeDefined();
    expect(Math.abs(out!.x - screenX(view, STAGE.doorway.along, 0)), 'she does not come out of the bar door').toBeLessThan(view.scale * 2);
    for (let t = BEATS.rivalOut; t < BEATS.rivalIn; t += 4) expect(rival(drawAt(t).blits), `she is not drawn at step ${t}`).toBeDefined();
    expect(rival(drawAt(BEATS.viperLit).blits), 'she is still outside the Viper when its engines light').toBeUndefined();
    // From the run into the leap without a jump, on the pilot's terms.
    const ran = rival(drawAt(BEATS.rivalLeap - 0.001).blits)!;
    const leapt = rival(drawAt(BEATS.rivalLeap).blits)!;
    expect(Math.abs(leapt.x - ran.x), 'she jumped along the deck between the run and the leap').toBeLessThan(2);
    expect(leapt.x).toBeCloseTo(screenX(view, RIVAL_LEAP_FROM, 0), 0);
  });

  it('never lets either ship cover her', () => {
    for (let t = BEATS.rivalOut; t < BEATS.rivalIn; t += 3) {
      const { blits } = drawAt(t);
      const her = blits.findIndex((b) => b.sprite >= PORT_SPRITE.rivalRun0 && b.sprite <= PORT_SPRITE.rivalLeap);
      let ship = -1;
      blits.forEach((b, i) => {
        if (b.sprite === PORT_SPRITE.blue || b.sprite === PORT_SPRITE.viper) ship = i;
      });
      expect(her, `a ship is drawn over her at step ${t}`).toBeGreaterThan(ship);
    }
  });

  it('surges the jets on the step each launch is heard, and settles them into the burn', () => {
    /*
      Asked for: *"we also need the jets to supercharge fire when the blast off happens in the movie as
      well to match the blast off sound they have"*. Held against the cue table rather than the beats, so
      a launch moved in either one without the other fails here.
    */
    const surges = (t: number): Blit[] =>
      drawAt(t, NARROW).blits.filter((b) => b.sprite === PORT_SPRITE.viperSurge || b.sprite === PORT_SPRITE.blueSurge);
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
