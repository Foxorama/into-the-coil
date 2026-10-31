/**
 * The review's answers — `docs/decisions/0705-the-review-is-answered.md`. Two of its five items hold an
 * invariant a change could break and be wrong; the other three are the player's eye and are not guarded.
 *
 * ⚠️ **IN WORLD UNITS, WITH THE PIXELS THEY ARE AT 1280×720 BESIDE THEM** — 0027: a guard in the units the
 * player sees. The sheet reports the ship's 9.4-unit box at 85 px on that screen, so a unit is 9.04 px; the
 * numbers here are read against that.
 */
import { describe, it, expect } from 'vitest';
import { SHIPS } from '../src/content/ships.ts';
import { FIGHTER_HULL, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { RAY_RINGS, RAY_RING_LEAN, SHIP_HULL } from '../src/render/bake.ts';

/** Pixels to the world unit on a 1280×720 screen: the sheet's 85 px over the 9.4-unit box. */
const PX_PER_UNIT = 85 / 9.4;

/** The fighter's hull frame in world units: `drawKind` draws it at `FIGHTER_HULL / SHIP_BOX` of the box, 0.42 of the extent. */
const FIGHTER_R = FIGHTER_HULL * 0.42;

/** `x` along a polyline of the hull's upper half at height `y` (both in the hull's frame), or null off its ends. */
function alongAt(line: readonly (readonly [number, number])[], y: number): number | null {
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1]!;
    const [x1, y1] = line[i]!;
    if ((y <= y0 && y >= y1) || (y >= y0 && y <= y1)) return y1 === y0 ? x0 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  }
  return null;
}

describe('0705 — the fighter’s tubes are warheads out from under its wings', () => {
  /*
    *"it should just be a couple of rocket heads poking out from under the rear wings — something like a F14
    would look like from above."* Read off the hull the fighter is drawn with (`SHIP_HULL`): the wing's leading
    edge runs from its root to its tip, the trailing edge back from the tip. A tube's place is its warhead's
    point; the cone the `nose` look draws runs back 0.825 of the row's `tubeLength` from it (`LOADED_NOSE_HULL`,
    +1 to −0.65 of half the length).
  */
  it('THE ASK: each warhead’s point stands out ahead of the wing’s leading edge, and its base lies under the wing', () => {
    const row = SHIPS.fighter;
    const upper = SHIP_HULL.slice(0, 11);
    // The root of the wing is where the hull's edge turns out to the tip; the tip is the widest point.
    const tip = upper.reduce((best, p) => (p[1] < best[1] ? p : best));
    const tipAt = upper.indexOf(tip);
    const root = upper[3]!;
    const leading = upper.slice(3, tipAt + 1);
    // Past the tip's chord: the trailing edge runs from the tip's rear corner back in to the hull.
    const trailing = upper.slice(tipAt + 1, tipAt + 3);
    expect(row.tubeLook, 'the fighter shows whole tubes, not warheads').toBe('nose');
    for (const stage of [1, 2] as const) {
      for (const tube of row.tubes[stage]) {
        const y = -Math.abs(tube.across) / FIGHTER_R;
        expect(-y, `a tube at ${tube.across} across is inboard of the wing's root (${(-root[1] * FIGHTER_R).toFixed(2)})`).toBeGreaterThan(-root[1]);
        expect(-y, `a tube at ${tube.across} across is outboard of the wingtip (${(-tip[1] * FIGHTER_R).toFixed(2)})`).toBeLessThan(-tip[1]);
        const lead = alongAt(leading, y)! * FIGHTER_R;
        const trail = alongAt(trailing, y)! * FIGHTER_R;
        const point = tube.along;
        const base = tube.along - 0.825 * row.tubeLength;
        const ahead = (point - lead) * PX_PER_UNIT;
        // Out by 0106's floor at least, or the head that pokes out is not drawn.
        expect(ahead, `the warhead's point stands ${ahead.toFixed(1)} px ahead of the wing at 1280×720`).toBeGreaterThanOrEqual(2.5);
        expect(base, `the warhead's base at ${base.toFixed(2)} is ahead of the wing's leading edge at ${lead.toFixed(2)}, so the cone is not under the wing`).toBeLessThan(lead);
        expect(base, `the warhead's base at ${base.toFixed(2)} is behind the wing's trailing edge at ${trail.toFixed(2)}, so the cone shows behind the wing`).toBeGreaterThan(trail);
      }
    }
  });
});

describe('0705 — the ray is four rings with sky between them', () => {
  /*
    *"The four rings pulse from the lil caddie don't actually look like a pulse of four separate rings, it
    looks connected like a band of energy."* Each ring is an edge-on oval `RAY_RING_LEAN` as wide as it is
    tall, never under 0.1 of the frame (`edgeRing`), in a band a tenth of the frame thick. Between one ring's
    front edge and the next ring's back edge is sky, two pixels of it at least on a 1280×720 screen.
  */
  it('THE ASK: between each ring and the next is at least two pixels of sky at 1280×720', () => {
    const r = SPRITE_EXTENT.ray * 0.42 * PX_PER_UNIT;
    const band = 0.1;
    const halfWidth = (ry: number): number => Math.max(ry * RAY_RING_LEAN, 0.1) + band / 2;
    for (let k = 1; k < RAY_RINGS.length; k++) {
      const [x0, ry0] = RAY_RINGS[k - 1]!;
      const [x1, ry1] = RAY_RINGS[k]!;
      const gap = (x1 - halfWidth(ry1) - (x0 + halfWidth(ry0))) * r;
      expect(gap, `rings ${k - 1} and ${k} have ${gap.toFixed(2)} px between them at 1280×720`).toBeGreaterThanOrEqual(2);
    }
    // And the train stays in its frame, front ring and back ring alike.
    expect(RAY_RINGS[0]![0] - halfWidth(RAY_RINGS[0]![1])).toBeGreaterThanOrEqual(-1);
    expect(RAY_RINGS[RAY_RINGS.length - 1]![0] + halfWidth(RAY_RINGS[RAY_RINGS.length - 1]![1])).toBeLessThanOrEqual(1);
  });
});
