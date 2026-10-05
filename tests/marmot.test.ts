import { describe, expect, it } from 'vitest';

import { GOLFERS, GOLFER_KINDS, pilotOpen, rescuable, type GolferKind } from '../src/content/golfers.ts';
import { SHIPS, SHIP_KINDS, type ShipKind } from '../src/content/ships.ts';
import { pilotWhy } from '../src/state/screens.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { paintPortrait, paintRunner } from '../src/render/golfer-art.ts';

/**
 * THE MARMOT — `docs/decisions/0539-the-marmot-rides.md`.
 *
 * *"Locked until you beat the game with every pilot (on any difficulty, but must clear it with all four
 * starting pilots) - he can show up on the list of random rescuee's with some voice lines before he's
 * unlocked as a teaser though."*
 */

const FOUR: readonly GolferKind[] = ['feather', 'woo', 'larry', 'bo'];

/**
 * A 2D context that takes every call the painters make and counts what fills and strokes — the golfer
 * painters transform and draw ellipses, which the bake's tracing pen does not stand in for.
 */
function counting(): { ctx: CanvasRenderingContext2D; drawn: () => number; filled: Set<string> } {
  let drawn = 0;
  const filled = new Set<string>();
  const gradient = { addColorStop: (): void => {} };
  const target: Record<string | symbol, unknown> = {};
  const ctx = new Proxy(target, {
    get(t, key) {
      if (key in t) return t[key];
      if (key === 'fill' || key === 'fillRect') {
        return () => {
          drawn++;
          if (typeof t.fillStyle === 'string') filled.add(t.fillStyle);
        };
      }
      if (key === 'stroke') return () => void drawn++;
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
      return () => {};
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, drawn: () => drawn, filled };
}

function wonIn(...ships: ShipKind[]): State {
  let state = initialState;
  for (const ship of ships) state = reduce(state, { slice: 'hangar', type: 'won', ship });
  return state;
}

describe('0539 — the Marmot is locked behind the four', () => {
  it('THE ASK: he flies the Thunderbolt, and the Thunderbolt the lightning gun', () => {
    expect(GOLFERS.marmot.ship).toBe('thunderbolt');
    expect(SHIPS.thunderbolt.weapon).toBe('arc');
    expect(GOLFERS.marmot.pronouns).toBe('he/him');
  });

  it('every one of the four flies from the first run, and he does not', () => {
    for (const kind of FOUR) expect(pilotOpen(kind, initialState.hangar.won), kind).toBe(true);
    expect(pilotOpen('marmot', initialState.hangar.won)).toBe(false);
  });

  it('he is shut until the last of the four has won, whichever order, and open the moment it has', () => {
    for (const last of FOUR) {
      const others = FOUR.filter((k) => k !== last).map((k) => GOLFERS[k].ship);
      const three = wonIn(...others);
      expect(pilotOpen('marmot', three.hangar.won), `open with ${last} still to win`).toBe(false);
      const four = reduce(three, { slice: 'hangar', type: 'won', ship: GOLFERS[last].ship });
      expect(pilotOpen('marmot', four.hangar.won), `shut after ${last} won`).toBe(true);
    }
  });

  it('a win in his own ship counts for nothing toward him', () => {
    const state = wonIn('thunderbolt', 'fighter', 'caddie', 'firebird');
    expect(pilotOpen('marmot', state.hangar.won)).toBe(false);
  });

  it('the band says who still has to clear the game, and nothing once he is open', () => {
    expect(pilotWhy(initialState.hangar.won)).toBe('Beat the jellyfish with Feather Fade, Huang-Woo Hook, Longshot Larry and Backspin Bo to fly The Marmot');
    expect(pilotWhy(wonIn('caddie', 'fighter', 'estate').hangar.won)).toBe('Beat the jellyfish with Backspin Bo to fly The Marmot');
    expect(pilotWhy(wonIn(...SHIP_KINDS).hangar.won)).toBe(null);
  });
});

describe('0539 — and he is a teaser in the Viper from the first run', () => {
  it('he is in every other pilot’s rescue pool', () => {
    for (const kind of FOUR) expect(rescuable(kind), kind).toContain('marmot');
  });

  it('with his own five lines each way, short enough for a bubble', () => {
    // No longer than the longest line the four already say, which is what a bubble is sized for.
    const longest = Math.max(...FOUR.flatMap((k) => [...GOLFERS[k].saved, ...GOLFERS[k].saving]).map((l) => l.length));
    expect(GOLFERS.marmot.saved).toHaveLength(5);
    expect(GOLFERS.marmot.saving).toHaveLength(5);
    for (const line of [...GOLFERS.marmot.saved, ...GOLFERS.marmot.saving]) expect(line.length, line).toBeLessThanOrEqual(longest);
  });
});

describe('0539 — his body is his row’s', () => {
  it('runs and leaps on his own figure, and draws his portrait, with every one of the pilot’s poses', () => {
    // His own: the helmet's black and the visor's amber, which no golfer's drawing paints.
    for (const pose of ['pilotRun0', 'pilotRun1', 'pilotRun2', 'pilotRun3', 'pilotLeap'] as const) {
      const { ctx, drawn, filled } = counting();
      paintRunner(ctx, GOLFERS.marmot, pose, 1);
      expect(drawn(), `${pose} drew nothing`).toBeGreaterThan(5);
      expect(filled.has(GOLFERS.marmot.cap), `${pose} wears no helmet`).toBe(true);
      expect(filled.has('#ff9f1c'), `${pose} has no visor`).toBe(true);
    }
    const { ctx, drawn, filled } = counting();
    paintPortrait(ctx, GOLFERS.marmot, 128);
    expect(drawn(), 'his portrait drew nothing').toBeGreaterThan(5);
    expect(filled.has('#ff9f1c'), 'his portrait has no visor').toBe(true);
    expect(filled.has(GOLFERS.marmot.skin), 'his portrait shows no face').toBe(true);
  });

  it('and nobody else is drawn as a marmot', () => {
    for (const kind of GOLFER_KINDS) expect(GOLFERS[kind].figure === 'marmot', kind).toBe(kind === 'marmot');
  });
});
