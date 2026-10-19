import { describe, expect, it } from 'vitest';
import { HANGAR_LIFTS, HANGAR_VERSION } from '../src/save/hangar.ts';
import { SCORES_LIFTS, SCORES_VERSION } from '../src/save/scores.ts';
import { SETTINGS_LIFTS, SETTINGS_VERSION } from '../src/save/settings.ts';
import { lifted, type Lift } from '../src/save/store.ts';

/**
 * A SAVE READS EVERY VERSION BEFORE ITS OWN — `docs/decisions/0643-a-save-reads-every-version-before-its-own.md`.
 *
 * ⚠️ **WHAT IS HELD IS THAT NO PLAYER'S KEY IS EMPTIED BY A NEW SHAPE.** Each reader read nothing on a
 * version it did not write, and the next write lays the empty state over the key, so the first bump
 * after release would have taken every player's hangar. A version bumped without the lift from the
 * version before it is that wipe, and is refused here before it ships.
 */

const KEYS: readonly { key: string; version: number; lifts: readonly Lift[] }[] = [
  { key: 'itc_hangar', version: HANGAR_VERSION, lifts: HANGAR_LIFTS },
  { key: 'itc_scores', version: SCORES_VERSION, lifts: SCORES_LIFTS },
  { key: 'itc_settings', version: SETTINGS_VERSION, lifts: SETTINGS_LIFTS },
];

describe('a save reads every version before its own', () => {
  it('every kept key has a lift from every version it has ever written', () => {
    for (const { key, version, lifts } of KEYS) {
      expect(lifts.length, `${key} is at version ${version}, so it owes ${version - 1} lifts and has ${lifts.length}`).toBe(version - 1);
    }
  });

  it('steps an older document up through every lift in order', () => {
    type Trail = { path?: unknown; two?: unknown };
    const toTwo: Lift = (doc) => ({ ...doc, two: true, path: `${String((doc as Trail).path)}>2` });
    const toThree: Lift = (doc) => ({ ...doc, three: (doc as Trail).two === true, path: `${String((doc as Trail).path)}>3` });
    expect(lifted({ v: 1, path: '1', kept: 'x' }, 3, [toTwo, toThree])).toEqual({ v: 3, path: '1>2>3', two: true, three: true, kept: 'x' });
    expect(lifted({ v: 2, path: '2' }, 3, [toTwo, toThree])).toEqual({ v: 3, path: '2>3', three: false });
    expect(lifted({ v: 3, path: '3' }, 3, [toTwo, toThree])).toEqual({ v: 3, path: '3' });
  });

  it('reads nothing it cannot place: no version, a newer one, or a lift that is missing', () => {
    for (const doc of [null, 'v1', { path: 'none' }, { v: 0 }, { v: 1.5 }, { v: '1' }, { v: 4 }]) {
      expect(lifted(doc, 3, [(d) => d, (d) => d]), JSON.stringify(doc)).toBeNull();
    }
    expect(lifted({ v: 1 }, 3, [(d) => d])).toBeNull();
  });
});
