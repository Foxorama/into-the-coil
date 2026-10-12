import { describe, it, expect } from 'vitest';
import { pictureComingFor, picturePlaceFor, placeFor } from '../src/app/music.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import type { Screen } from '../src/state/screens.ts';

/**
 * THE PLACE STAYS BEHIND THE MENUS — `docs/decisions/0518-the-place-stays-behind-the-menus.md`.
 *
 * Reported: *"during the freeplay run when you continue, the screen loses all the skins and shows a
 * bare sky and the OG graphics — like the fish boss shows as green on a black starfield."* The
 * picture's place was a list of three screens, and every screen laid over a run since fell through it
 * to the title's void.
 *
 * ⚠️ **BY NAME, AND NOT BY `inRun`.** The function reads `inRun`; a test that walked the rows asking
 * `inRun` would prove only that the code agrees with itself (0027). These are the screens the player
 * was looking at when it happened, and the screens off a run that must still be the void.
 */

/** A level past the first, whose place is not the title's — The Approach shares the void's sky. */
const LATE = LEVEL_KINDS.length - 2;
const FIELD = placeFor(LATE);

describe('the place stays behind the menus — 0518', () => {
  it('keeps the run’s place behind the run over, the pause, its question and its count-in', () => {
    expect(FIELD, 'the fixture level shares the title’s sky, so it cannot see the void').not.toBe(placeFor(0));
    const over: Screen[] = ['gameOver', 'paused', 'quit', 'resuming', 'playing', 'cleared', 'outro'];
    for (const screen of over) {
      expect(picturePlaceFor(screen, null, FIELD, LATE, false), `${screen} drops the place for the title’s void`).toBe(FIELD);
    }
  });

  it('draws the void off a run, and the room’s place in the room', () => {
    expect(picturePlaceFor('title', null, FIELD, LATE, false), 'the title draws the last run’s place').toBeNull();
    expect(picturePlaceFor('victory', null, FIELD, LATE, false), 'the victory screen draws the last run’s place').toBeNull();
    expect(picturePlaceFor('music', 'mire', FIELD, LATE, false), 'the room lost its audition').toBe('mire');
  });

  it('keeps the crossing and the intro as they were — 0340, 0416', () => {
    expect(picturePlaceFor('travel', null, FIELD, LATE + 1, false)).toBe(FIELD);
    expect(picturePlaceFor('travel', null, FIELD, LATE + 1, true)).toBe(placeFor(LATE + 1));
    expect(picturePlaceFor('intro', null, FIELD, LATE, false)).toBe(placeFor(0));
  });
});

describe('the place is baked on the way — 0604', () => {
  it('bakes, from the break, exactly the place the burn will swap to', () => {
    /*
      ⚠️ **THE ONE CLAIM THAT MAKES BAKING AHEAD SAFE.** An atlas baked for the wrong place would be
      thrown away at the swap and the old frozen frame paid in full — silently, since the swap still
      happens. So for every boundary on the roster, the place baked during the break and the build is
      the place `picturePlaceFor` swaps to at full burn.
    */
    for (let level = 1; level < LEVEL_KINDS.length; level += 1) {
      const swappedTo = picturePlaceFor('travel', null, placeFor(level - 1), level, true);
      expect(pictureComingFor('cleared', level, false), `the break before level ${level} bakes another place`).toBe(swappedTo);
      expect(pictureComingFor('travel', level, false), `the burn into level ${level} bakes another place`).toBe(swappedTo);
    }
  });

  it('and bakes nothing once the swap has happened, or anywhere else', () => {
    expect(pictureComingFor('travel', LATE, true), 'a place is still being baked after it was swapped in').toBeNull();
    const elsewhere: Screen[] = ['playing', 'paused', 'gameOver', 'title', 'music', 'outro', 'victory', 'intro'];
    for (const screen of elsewhere) {
      expect(pictureComingFor(screen, LATE, false), `${screen} bakes a place nobody is heading for`).toBeNull();
    }
  });
});
