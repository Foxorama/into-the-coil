import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { SPECIAL_BINDINGS } from '../src/content/actions.js';
import { makeIntent, type Intent } from '../src/sim/intent.js';
import { SHIP_SPEED } from '../src/sim/flight.js';
import { DRAG_GAIN, attachTouch, triggerRadius, triggerX, triggerY } from '../src/app/touch.js';
import { STEERS, STEER_KINDS, HAND_KINDS, type HandKind } from '../src/content/touch.js';

/**
 * THE TOUCH SECTION — `docs/decisions/0512-the-touch-is-yours.md`: which side the trigger discs stand
 * on, and how quick the steering is.
 *
 * ⚠️ **WHAT IS HELD IS WHAT A THUMB FEELS**, in its units: a swipe of so many pixels moves the ship so
 * many pixels, and a tap at the disc on the chosen side fires while the same tap mirrored steers. And
 * the ban that makes each a comfort knob: nothing that decides an outcome can see the table.
 */

const SCALE = 3.9;
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/** A glass the size of a landscape phone, with listeners and nothing else. */
class Glass {
  readonly width = 844;
  readonly height = 390;
  private readonly listeners = new Map<string, Set<EventListener>>();
  addEventListener(type: string, fn: EventListener): void {
    const set = this.listeners.get(type) ?? new Set<EventListener>();
    set.add(fn);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, fn: EventListener): void {
    this.listeners.get(type)?.delete(fn);
  }
  getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }
  setPointerCapture(): void {}
  send(type: string, x: number, y: number, id: number): void {
    for (const fn of this.listeners.get(type) ?? []) fn({ type, clientX: x, clientY: y, pointerId: id, pointerType: 'touch' } as unknown as Event);
  }
}

function rig(opts: { steer?: number; hand?: HandKind; scheme?: 'drag' | 'stick' } = {}): { glass: Glass; step: () => Intent } {
  const glass = new Glass();
  const src = attachTouch(glass as unknown as HTMLElement, {
    scale: () => SCALE,
    scheme: opts.scheme,
    steer: opts.steer === undefined ? undefined : () => opts.steer!,
    hand: opts.hand === undefined ? undefined : () => opts.hand!,
  });
  const intent = makeIntent(SPECIAL_BINDINGS);
  return {
    glass,
    step: () => {
      intent.along = 0;
      intent.across = 0;
      for (let i = 0; i < intent.specials.length; i++) intent.specials[i] = 0;
      src.contribute(intent);
      return intent;
    },
  };
}

/** How far a swipe of `px` moves the ship, in the pixels the player watches it move. */
function travelOf(ratio: number, px: number): number {
  const { glass, step } = rig({ steer: ratio });
  glass.send('pointerdown', 100, 200, 1);
  glass.send('pointermove', 100, 200 + px, 1);
  let total = 0;
  for (let i = 0; i < 400; i++) {
    const ask = step().across;
    if (ask === 0) break;
    total += ask * SHIP_SPEED;
  }
  return total * SCALE;
}

describe('0512 — the steering band', () => {
  it('THE ASK, IN PIXELS: the same swipe moves the ship further on Quick and less on Gentle, and Standard is the measured gain', () => {
    const swipe = 120;
    const travelled = STEER_KINDS.map((k) => travelOf(STEERS[k].ratio, swipe));
    for (let i = 1; i < travelled.length; i++) {
      expect(travelled[i]!, `${STEER_KINDS[i]} is not quicker than ${STEER_KINDS[i - 1]}`).toBeGreaterThan(travelled[i - 1]!);
    }
    expect(travelOf(STEERS.standard.ratio, swipe), 'Standard moved off the gain the report measured').toBeCloseTo(swipe * DRAG_GAIN, 6);
    expect(travelOf(STEERS.quick.ratio, swipe)).toBeCloseTo(swipe * DRAG_GAIN * STEERS.quick.ratio, 6);
  });

  it('scales the finger and never the ship: no step asks for more than full speed on any stop', () => {
    for (const kind of STEER_KINDS) {
      const { glass, step } = rig({ steer: STEERS[kind].ratio });
      glass.send('pointerdown', 100, 100, 1);
      glass.send('pointermove', 100, 380, 1);
      for (let i = 0; i < 50; i++) expect(Math.abs(step().across), `${kind} asked for more than the ship has`).toBeLessThanOrEqual(1);
    }
  });

  it('and the stick, by the radius a full deflection takes', () => {
    const at = (ratio: number): number => {
      const { glass, step } = rig({ scheme: 'stick', steer: ratio });
      glass.send('pointerdown', 100, 200, 1);
      glass.send('pointermove', 100, 220, 1);
      return step().across;
    };
    expect(at(STEERS.quick.ratio)).toBeGreaterThan(at(STEERS.standard.ratio));
    expect(at(STEERS.gentle.ratio)).toBeLessThan(at(STEERS.standard.ratio));
  });
});

describe('0512 — the trigger side', () => {
  it('THE ASK: on the left, a tap on the left disc fires and the same tap on the right steers', () => {
    const { glass, step } = rig({ hand: 'left' });
    const y = triggerY(glass.width, glass.height, 0);
    glass.send('pointerdown', triggerX(glass.width, glass.height, 'left'), y, 10);
    expect(step().specials[0], 'a tap on the left disc did not fire').toBe(1);
    glass.send('pointerdown', triggerX(glass.width, glass.height, 'right'), y, 11);
    glass.send('pointermove', triggerX(glass.width, glass.height, 'right'), y - 40, 11);
    const ask = step();
    expect(ask.specials[0], 'the right edge still fired with the triggers on the left').toBe(0);
    expect(ask.across, 'the right edge did not steer with the triggers on the left').not.toBe(0);
  });

  it('the two sides are mirror images, at the same inset and the same size', () => {
    const w = 844;
    const h = 390;
    const r = triggerRadius(w, h);
    expect(triggerX(w, h, 'left') - r, 'the left disc is not as far from its edge as the right is from its').toBeCloseTo(w - (triggerX(w, h, 'right') + r), 9);
    expect(HAND_KINDS).toContain('right');
  });
});

describe('a comfort knob over the glass cannot reach the game — 0512', () => {
  const filesUnder = (dir: string): string[] =>
    readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? filesUnder(`${dir}/${e.name}`) : e.name.endsWith('.ts') ? [`${dir}/${e.name}`] : [],
    );
  const FORBIDDEN = [...filesUnder('src/sim'), 'src/app/frame.ts', 'src/app/boss.ts', 'src/render/scene.ts'];

  it('THE BAN: nothing that decides an outcome may import the touch table', () => {
    expect(FORBIDDEN.length, 'the scan found no simulation files — the walk is broken').toBeGreaterThan(5);
    const offenders = FORBIDDEN.filter((file) => read(file).includes('content/touch'));
    expect(offenders, `these decide what happens and can see the touch setting: ${offenders.join(', ')}`).toEqual([]);
  });
});
