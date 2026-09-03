import { describe, expect, it } from 'vitest';

import { BAR_RISE_CEILING_DB, arcOf, boundariesIn } from './arc.ts';
import { RAMP_FULL_AT_DB, RAMP_SECONDS, RAMP_SPREAD, BUILD_BARS, levelWrites, rampScaleOf } from '../src/app/music.ts';
import { BAR_SECONDS, AURA_LAYERS, type MusicLayer } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';

/**
 * A TRANSITION IS A SHAPE, NOT AN INSTANT.
 *
 * `docs/decisions/0215-a-transition-is-a-shape-not-an-instant.md`. Reported 2026-09-03, of The
 * Approach: *"at 41sec in, the volume increases a bit too loudly. there's too big a jump from the
 * transition to the spike at that level, and we'll need to make sure the transitions are smoothed out
 * for the rest of the level so there's no weird drops later"*, and then of The Black Heart:
 * *"the black heart level has a similar issue, so run a pass on all the levels just to check."*
 *
 * ⚠️ **EVERY ASSERTION HERE IS OVER ALL SEVEN PLACES, BECAUSE THE PASS WAS THE ASK.** Two places were
 * reported and five had the defect; two of the five were worse than either report.
 *
 * ⚠️ **AND EVERY ONE IS IN dB OF THE SUMMED MIX**, which is CLAUDE.md's *units the player
 * experiences* for a channel with nothing to look at. A guard over `tau` would say the code agrees
 * with itself — and `tests/music.test.ts` already had one, which was green over every spike in this
 * file's table.
 */
describe('a rung change is delivered as a shape', () => {
  /*
    ── ONE ARC PER PLACE, BUILT ONCE, AND AT A QUARTER OF THE SAMPLE RATE ─────────────────────────

    ⚠️ **SEVEN FULL-RATE ARCS TOOK 33 SECONDS AND TIMED OUT AN UNRELATED GUARD.**
    `tests/links.test.ts` runs in 825 ms alone and **failed at its 5-second timeout** on the load this
    file put on the suite — `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`
    exactly: the intermittent guard had found something, and what it found was this file.

    ⚠️ **THE CHEAPER BAKE WAS MEASURED BEFORE IT WAS TRUSTED, AND THE FIRST MEASUREMENT SAID NO.**
    Per layer it is badly wrong — `ride` reads **6.0 dB** low at 11025 Hz, because a cymbal is nearly
    all content the rate cannot carry. Per BOUNDARY, which is what is asserted here, the worst
    difference across all seven places is **0.05 dB** against a 2 dB threshold: one sparse layer among
    twenty-three does not move the sum. **Both numbers matter** — the second is why this is safe and
    the first is why it is not safe for anything else.
  */
  const ARC_RATE = 11025;
  const arcs = THEME_KINDS.map((theme) => ({ theme, arc: arcOf(theme, 0.2, ARC_RATE) }));

  it('never climbs more in one bar than the arrangement itself asks for', () => {
    for (const { theme, arc } of arcs) {
      for (const edge of boundariesIn(arc, 0.2)) {
        expect(
          edge.rise,
          `${theme} ${edge.from} → ${edge.to} climbs ${edge.rise.toFixed(1)} dB inside one bar, at ` +
            `${Math.floor(edge.riseAt / 60)}:${String(Math.floor(edge.riseAt % 60)).padStart(2, '0')} — ` +
            'that is the spike that was reported',
        ).toBeLessThan(BAR_RISE_CEILING_DB);
      }
    }
  });

  /*
    ⚠️ **A HOLE IS THE ONLY PART OF A DIP NOBODY WROTE.** A boundary into a quieter rung is
    `docs/decisions/0136-the-place-has-a-room-and-an-arc.md`'s authored shape and must stay; a stretch
    quieter than BOTH the rung it left and the rung it is arriving at is departures outrunning
    arrivals. Reading them as one number is what made the first pass at this chase The Toxic Mire's
    `surge → approach` as −4.9 dB of defect when 3.5 of it was the composition.
  */
  it('is never quieter than both the rung it left and the rung it is reaching', () => {
    for (const { theme, arc } of arcs) {
      for (const edge of boundariesIn(arc, 0.2)) {
        expect(
          edge.hole,
          `${theme} ${edge.from} → ${edge.to} falls ${(-edge.hole).toFixed(1)} dB below both its ends — ` +
            'the departures are leaving before what replaces them has arrived',
        ).toBeGreaterThan(-1);
      }
    }
  });

  /*
    ⚠️ **THE REPORTED MOMENTS BY NAME, because a guard over an aggregate can go green while the one
    thing somebody actually heard gets worse.** These two are the whole reason this file exists, and
    naming them means a future retune cannot quietly hand them back.
  */
  it('holds the two moments that were reported', () => {
    const at = (theme: string, second: number): number => {
      const arc = arcs.find((a) => a.theme === theme)!.arc;
      const edge = boundariesIn(arc, 0.2).find((e) => e.riseAt >= second - 6 && e.riseAt <= second + 6);
      return edge?.rise ?? 0;
    };
    // The Approach, 41 seconds in — measured at +2.2 dB in one bar when it was reported.
    expect(at('approach', 41), 'The Approach at 0:41 is spiking again').toBeLessThan(BAR_RISE_CEILING_DB);
    // The Black Heart, its `run → push`, which is at 0:20 because its `run` is only 17% of the level.
    expect(at('core', 22), 'The Black Heart at 0:22 is spiking again').toBeLessThan(BAR_RISE_CEILING_DB);
  });
});

describe('a move takes as long as it is big', () => {
  it('gives a bigger move a longer ramp, and never one longer than the build', () => {
    /*
      ⚠️ **THE PROPERTY IS MONOTONIC AND BOUNDED, WHICH IS WHAT MAKES IT AN INVARIANT.** Naming the
      values would be naming `RAMP_SPREAD` twice; what must hold is that a bigger move is never given
      less time, and that nothing outruns the build it lands in — the two ways this rule could be
      wrong regardless of what the constants are set to.
    */
    let last = 0;
    for (let move = 0; move <= RAMP_FULL_AT_DB * 2; move += 0.25) {
      const scale = rampScaleOf(1, Math.pow(10, move / 20));
      expect(scale, `a ${move} dB move ramps faster than a smaller one`).toBeGreaterThanOrEqual(last - 1e-12);
      expect(scale, 'a move ramps for longer than the build it lands in').toBeLessThanOrEqual(RAMP_SPREAD + 1e-12);
      last = scale;
    }
    expect(rampScaleOf(1, 1), 'a move of nothing takes longer than the shortest ramp').toBe(1);
    expect(rampScaleOf(0, 1), 'an arrival from silence is not the longest move there is').toBe(RAMP_SPREAD);
    expect(rampScaleOf(1, 0), 'a departure to silence is not the longest move there is').toBe(RAMP_SPREAD);
  });

  /*
    ⚠️ **DERIVED, SO THIS IS THE GUARD THAT SAYS SO.** `RAMP_SPREAD` is `BUILD_BARS` expressed as a
    multiple of `RAMP_SECONDS`, and the whole reason for writing it that way is that retuning the
    build carries the ramps with it. A literal typed here would be the second copy that stops it.
  */
  it('caps the longest ramp at the width of a build', () => {
    expect(RAMP_SECONDS * RAMP_SPREAD, 'the longest ramp is no longer the width of a build').toBeCloseTo(
      (BUILD_BARS + 1) * BAR_SECONDS,
      12,
    );
  });

  /*
    ⚠️ **A DEPARTURE LASTS AT LEAST AS LONG AS THE ARRIVALS IT MAKES ROOM FOR — A FLOOR, NOT A
    CEILING.** Written as an assignment rather than a maximum, this rule made the fade SHORTER
    wherever a build was under four bars wide, and The Toxic Mire's hole got deeper. That bug was
    shipped into the measurement and caught by re-reading the table.
  */
  it('never shortens a departure to fit a short build', () => {
    for (const theme of THEME_KINDS) {
      const before: Partial<Record<MusicLayer, number>> = {};
      for (const write of levelWrites('surge', theme, 0, 0, 0, {})) before[write.layer] = write.target;
      for (const write of levelWrites('approach', theme, 0, 0, 0, before)) {
        if (AURA_LAYERS.includes(write.layer)) continue;
        if (write.target !== 0 || (before[write.layer] ?? 0) === 0) continue;
        expect(
          write.tau,
          `${theme}: ${write.layer} leaves faster than the longest ramp, so it opens a hole`,
        ).toBeGreaterThanOrEqual((RAMP_SECONDS * RAMP_SPREAD) / 3 - 1e-12);
      }
    }
  });
});
