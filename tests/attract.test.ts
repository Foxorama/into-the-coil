import { describe, expect, it } from 'vitest';

import {
  ATTRACT_MOTES,
  MOTE_BAND,
  makeMotes,
  moteAcross,
  moteAlong,
  weaveAcross,
} from '../src/app/attract.ts';
import { auditionLength, UNITS_PER_SECOND } from '../src/app/music.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { makeRng } from '../src/sim/rng.ts';

/**
 * THE MUSIC ROOM'S FLYTHROUGH.
 *
 * `docs/decisions/0213-the-room-is-a-flythrough.md`. Reported 2026-09-03: *"the initial background
 * screen has a bunch of enemies showing that scroll off-screen and then there's no enemies at all
 * showing again."*
 *
 * ⚠️ **EVERY GUARD HERE IS A FORM OF ONE SENTENCE: the picture is a function of where the camera is.**
 * That is what the seek bar needs and what makes any of this testable without a browser — so a
 * version of this that accumulated state would fail these by construction rather than by measurement.
 *
 * ⚠️ **AND THE PICTURE ITSELF IS `tests/room.browser.test.ts`'s.** Nothing here can see that the ship
 * is drawn, that the enemies went, or that the field is not empty on screen —
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` — so what lives here is only the
 * arithmetic those assertions stand on.
 */
describe('the room flies the level it is auditioning', () => {
  /*
    ⚠️ **THE LANE IS A FIXED HUNDRED AND THE SHIP MUST STAY INSIDE IT** — 0023. A weave built from
    two sines can reach the sum of its amplitudes, which is the one thing about this shape that is
    easy to get wrong: raise either amplitude without lowering the other and the ship flies through
    the wall `docs/decisions/0074-the-box-is-drawn.md` draws.
  */
  it('keeps the ship inside the lane for every position of every walk', () => {
    for (const kind of LEVEL_KINDS) {
      const length = auditionLength(LEVELS[kind]);
      for (let along = 0; along <= length; along += 3) {
        const across = weaveAcross(along);
        expect(across, `${kind} at ${along}: the ship is outside the lane`).toBeGreaterThan(8);
        expect(across, `${kind} at ${along}: the ship is outside the lane`).toBeLessThan(ACROSS_SPAN - 8);
      }
    }
  });

  /*
    ⚠️ **IN SECONDS AND IN A FRACTION OF THE LANE, WHICH IS WHAT A PLAYER WATCHES** — CLAUDE.md's
    *at least one assertion in units the player experiences*. A guard on the wavelength constants
    would say the code agrees with itself; what is actually being claimed is **that the ship visibly
    goes somewhere**, and the two ways that fails are a weave too small to see and one too slow to
    notice within the time anybody looks at the screen.
  */
  it('sweeps most of the lane, and does it inside ten seconds', () => {
    let low = ACROSS_SPAN;
    let high = 0;
    const window = 10 * UNITS_PER_SECOND;
    for (let along = 0; along <= window; along += 2) {
      const across = weaveAcross(along);
      if (across < low) low = across;
      if (across > high) high = across;
    }
    expect(
      (high - low) / ACROSS_SPAN,
      'ten seconds of watching does not move the ship across a third of the lane — it reads as still',
    ).toBeGreaterThan(0.33);
  });

  /*
    ⚠️ **ONE SINE IS A MACHINE, AND THIS IS THE GUARD THAT SAYS SO.** The whole reason there are two
    wavelengths is that a listener sits with this screen for minutes; a weave that returned to the
    same place every twelve seconds would read as a loop. What is held is that the shape does NOT
    repeat within a walk, which is the property, rather than the two constants that deliver it.
  */
  it('does not repeat itself inside a walk', () => {
    const length = auditionLength(LEVELS.approach);
    const at = (along: number): number => weaveAcross(along);
    let matched = 0;
    // A period would show up as the whole curve agreeing when shifted by it. Twelve seconds is the
    // long swing's own period, which is the one candidate a single sine would have.
    const period = 430;
    for (let along = 0; along + period <= length; along += 7) {
      if (Math.abs(at(along) - at(along + period)) < 1) matched++;
    }
    const samples = Math.floor((length - period) / 7);
    expect(
      matched / samples,
      'the weave comes back to the same place a long-swing later almost everywhere — it is one sine',
    ).toBeLessThan(0.25);
  });
});

describe('the dust is an endless field made of a fixed pool', () => {
  const motes = makeMotes(makeRng('music-room').stream('motes'));

  it('fits the pool it is drawn from, with the room for a run left over', () => {
    /*
      ⚠️ **A BUDGET, AND `CAPACITY.debris` OWNS THE NUMBER** —
      `docs/decisions/0192-a-guard-holds-an-invariant.md`. The room borrows the pool a run uses for
      the fragments of things blowing up; the room blows nothing up, so what matters is only that the
      field fits, and this fails hard if either number moves under the other.
    */
    expect(ATTRACT_MOTES, 'the mote field does not fit the debris pool it is drawn from').toBeLessThanOrEqual(
      CAPACITY.debris,
    );
  });

  /*
    ⚠️ **THE REPORTED DEFECT, INVERTED.** The seeded bodies scrolled off and nothing replaced them;
    the whole point of wrapping the motes into a band around the camera is that this can never happen
    again. **Two minutes of walking is the case that was actually broken**, so the walk here is a real
    one at the game's own rate rather than a handful of samples.
  */
  it('never empties, at any point of any walk, however far the camera has gone', () => {
    for (const kind of LEVEL_KINDS) {
      const length = auditionLength(LEVELS[kind]);
      for (let camera = 0; camera <= length; camera += 60) {
        for (const mote of motes) {
          const along = moteAlong(mote, camera);
          expect(along, `${kind} at ${camera}: a mote fell behind the camera and is gone`).toBeGreaterThanOrEqual(
            camera - 20.001,
          );
          expect(along, `${kind} at ${camera}: a mote is beyond the band and cannot be seen`).toBeLessThanOrEqual(
            camera - 20 + MOTE_BAND + 0.001,
          );
        }
      }
    }
  });

  it('holds every mote inside the lane, sway and all', () => {
    for (const mote of motes) {
      for (let camera = 0; camera < 4000; camera += 37) {
        const across = moteAcross(mote, moteAlong(mote, camera));
        expect(across, 'a mote is off the lane').toBeGreaterThanOrEqual(0);
        expect(across, 'a mote is off the lane').toBeLessThanOrEqual(ACROSS_SPAN);
      }
    }
  });

  /*
    ⚠️ **PARALLAX IS THE ONLY DEPTH AN ENTITY CAN HAVE HERE**, because `src/render/surface.ts` blits
    every entity at one scale — `src/app/attract.ts` says so. So *the field has depth* means exactly
    *the motes do not all move at the same rate*, and that is what this measures.
  */
  it('gives the field depth, which for an entity means a spread of rates', () => {
    /*
      ⚠️ **MEASURED ON SCREEN AND NOT IN THE WORLD, AND THE FIRST VERSION OF THIS WAS VACUOUS.** It
      took `moteAlong(c + 100) − moteAlong(c)`, which is dominated by whether the mote WRAPPED in
      that interval — a whole band, against a few units of parallax. Every depth flattened to one
      value and it stayed green, because some motes wrapped and some did not and the spread came out
      of that instead. `npm run prove` is what said so.

      ⚠️ **What a viewer actually sees is the mote's position RELATIVE TO THE CAMERA**, which drifts
      at `depth − 1` and is the whole of the parallax. Folded into the band, that is wrap-free.
    */
    const step = 10;
    const drift = (mote: (typeof motes)[number]): number => {
      const was = moteAlong(mote, 1000) - 1000;
      const now = moteAlong(mote, 1000 + step) - (1000 + step);
      const raw = (((now - was) % MOTE_BAND) + MOTE_BAND) % MOTE_BAND;
      return raw > MOTE_BAND / 2 ? raw - MOTE_BAND : raw;
    };
    const rates = motes.map(drift);
    const spread = Math.max(...rates) - Math.min(...rates);
    /*
      ⚠️ **HALF THE STEP, WHICH IS WHAT THE AUTHORED DEPTHS DELIVER.** `src/app/attract.ts` spreads
      them 0.12 to 0.78, so the nearest mote falls behind at 0.88 of the camera's rate and the
      furthest at 0.22 — a difference of 0.66, or 6.6 units over a ten-unit step. Anything under half
      that is a field the eye cannot separate into layers.
    */
    expect(spread, 'every mote drifts at the same rate — the field is flat').toBeGreaterThan(step / 2);
  });

  /*
    ⚠️ **THE CLAIM *the picture is the same however you reached this position* IS NOT GUARDED HERE,
    AND THAT IS DELIBERATE.** Written as a unit test it reads `f(4321)` twice and compares — a guard
    that no correct change could ever redden, which
    `docs/decisions/0192-a-guard-holds-an-invariant.md` says is not a guard. **It was written, it
    passed, and it was deleted.** What has teeth is seeking away and back on a real page and
    comparing the pixels, because that is where hidden state would live if there were any;
    `tests/room.browser.test.ts` holds it.
  */
});
