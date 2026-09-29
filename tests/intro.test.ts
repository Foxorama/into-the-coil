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
import { BEATS, FADE, INTRO_STEPS, LEAP_FROM, PORT_EXTENT, PORT_KINDS, PORT_SPRITE, STAGE, type PortKind } from '../src/content/port.ts';
import { paintPort } from '../src/render/port.ts';
import { screenX, type Surface } from '../src/render/surface.ts';
import { MAX_ASPECT, viewOf, type View } from '../src/sim/camera.ts';
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

function drawAt(t: number, size = WIDE): { blits: Blit[]; view: View } {
  const view = viewOf(size.width, size.height);
  const surface = new RecordingSurface();
  paintPort(surface, view, t);
  return { blits: surface.blits, view };
}

const of = (blits: readonly Blit[], kind: PortKind): Blit | undefined => blits.find((b) => b.sprite === PORT_SPRITE[kind]);

/**
 * How far behind its centre a ship's hull ends, as a fraction of its box — the fighter's tail is at
 * `-0.78 r` and the Viper's nozzle at `-0.88 r`, with `r` 0.42 of the box (`src/render/bake.ts`).
 */
const TAIL: Partial<Record<PortKind, number>> = { blue: 0.78 * 0.42, viper: 0.88 * 0.42 };

/** Where a drawn ship's tail is, in pixels. */
function tailPx(b: Blit, kind: 'blue' | 'viper'): number {
  return b.x - TAIL[kind]! * PORT_EXTENT[kind] * b.scale;
}

describe('the intro is a screen the page opens on and leaves by itself', () => {
  it('opens the page, has no panel, steps nothing, and goes to the title on its own clock', () => {
    expect(initialScreen.current).toBe('intro');
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
  it('opens out of black and ends in it, so the title comes up out of the dark', () => {
    const first = drawAt(0).blits.at(-1)!;
    expect(first.sprite, 'the first frame is not covered').toBe(PORT_SPRITE.black);
    expect(first.alpha).toBeCloseTo(1, 5);
    const last = drawAt(INTRO_STEPS - 0.001).blits.at(-1)!;
    expect(last.sprite, 'the last frame is not covered, so the title cuts in over a picture').toBe(PORT_SPRITE.black);
    expect(last.alpha).toBeGreaterThan(0.99);
  });

  it('is never dark in the middle of a shot', () => {
    for (const t of [BEATS.viperGo, BEATS.pilotOut, BEATS.blueGo, BEATS.viperRuns, BEATS.blueRuns]) {
      expect(of(drawAt(t).blits, 'black'), `the picture is dark at step ${t}`).toBeUndefined();
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
