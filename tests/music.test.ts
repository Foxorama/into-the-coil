import { describe, expect, it } from 'vitest';

import {
  BEAT_SECONDS,
  BOSS_APPROACH_UNITS,
  LOOP_SECONDS,
  MUSIC,
  MUSIC_GAIN,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  AURA_LAYERS,
  AURA_NEAR_UNITS,
  AURA_FAR_UNITS,
} from '../src/content/music.ts';
import { auraNearness, auraNearnessFor, bakeLoops, musicLevelFor } from '../src/app/music.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

/**
 * THE MUSIC — `docs/decisions/0090-the-music-is-four-loops.md`.
 *
 * ⚠️ **Nothing here can hear it, and one thing here does not need to.** The design's single
 * unrecoverable failure is a loop whose length is not a whole number of samples: there is no
 * scheduler to re-align anything, so four layers that disagree by a fraction of a sample drift apart
 * for the length of a run and the music slowly falls to pieces. That is arithmetic, and it is the
 * first assertion below.
 *
 * `node scripts/hear.mjs --music` writes the loops for the instrument that CAN judge them — 0027.
 */

const RATES = [SAMPLE_RATE, 22050, 48000];

describe('four loops that cannot drift', () => {
  it('THE ONE THAT CANNOT BE RECOVERED FROM: the loop is a whole number of samples at every rate', () => {
    /*
      ⚠️ **A rounded length is a layer that slides against the other three**, a fraction of a sample
      per repetition, for ever. It is inaudible for the first minute and unlistenable by the fifth,
      which is the worst shape a bug can have — and there is nothing in the design that could correct
      it, because *four sources started together and left alone* is the whole design.

      ⚠️ **Checked at three rates rather than at the one this bakes at**, because the reason
      `BEAT_SECONDS` is 0.45 is that it survives being changed, and a rate is exactly the kind of
      thing 0089 has already moved once.
    */
    for (const rate of RATES) {
      const exact = LOOP_SECONDS * rate;
      expect(exact, `a ${rate}Hz loop is ${exact} samples, which rounds and therefore drifts`).toBe(Math.round(exact));
    }
  });

  it('and every layer bakes to exactly that length, so they start and end together', () => {
    const loops = bakeLoops(SAMPLE_RATE);
    for (const layer of MUSIC_LAYERS) {
      expect(loops[layer].length, `${layer} is a different length from the loop it has to sit in`).toBe(
        Math.round(LOOP_SECONDS * SAMPLE_RATE),
      );
    }
  });

  it('and none of them is silence, which is the way a layer can be missing without failing', () => {
    /*
      A layer that renders to zeros costs nothing, breaks nothing, and is simply never heard — so the
      ladder would still climb, the gains would still ramp, and one quarter of the music would be
      gone with every other guard green.
    */
    const loops = bakeLoops(SAMPLE_RATE);
    for (const layer of MUSIC_LAYERS) {
      let peak = 0;
      for (const s of loops[layer]) peak = Math.max(peak, Math.abs(s));
      expect(peak, `${layer} baked to silence`).toBeGreaterThan(0.01);
      expect(peak, `${layer} clips on its own, before the other three are added`).toBeLessThanOrEqual(1);
    }
  });

  it('THE SEAM: a loop is not quieter at its start than at its end, because a loop has no start', () => {
    /*
      ⚠️ **THE ONE LINE THE MUSIC NEEDED THAT A CUE DID NOT, held from the picture rather than from
      the code.** A note whose tail runs past the end of the loop has to arrive at the START of it
      (`sampleLayerInto`'s `wrap`); without that it is cut off at the join, and the loop has a notch
      in it at the same place every 3.6 seconds — which reads as a glitch in the build rather than as
      a bug in a synthesiser.

      ⚠️ **Every other guard in this file survives the wrap being deleted.** The lengths are right, no
      layer is silent, the ladder is intact and the mix does not clip — `npm run prove` reported STILL
      GREEN against all of them, which is what this assertion exists for.

      ⚠️ **Stated as a property, not against the drone.** *A loop cannot be quieter where it begins
      than where it ends* is true of any loop whatever is in it: if it is, something that was still
      sounding got dropped at the join. The drone is the layer that happens to demonstrate it today,
      because it is the one with tails long enough to cross — and a future layer with none is not
      exempted by name, it simply passes.
    */
    /*
      ── AND THE WINDOW HAD TO GROW, BECAUSE IT WAS MEASURING PHASE ────────────────────────────────

      ⚠️ **At 10ms this guard was shorter than one cycle of its own subject.** The lowest content in
      the music is around 80Hz — a 12ms period — so a 10ms mean is a mean over part of a wave, and
      where in that wave the window lands is luck. It passed at one tempo and failed at another with
      the same loops, the same wrap and the same envelopes, purely because a trial re-tempo moved the beat and the
      seam landed on a different part of a cycle.

      **40ms covers three cycles of the lowest thing there is**, so what is left is energy. That is
      the second time in this project a guard has sampled one phase of a periodic quantity and
      reported the phase — `docs/decisions/0087-a-pickup-never-parks.md` has the first.
    */
    const loops = bakeLoops(SAMPLE_RATE);
    const window = Math.round(SAMPLE_RATE * 0.04);
    for (const layer of MUSIC_LAYERS) {
      const buffer = loops[layer];
      const mean = (from: number, to: number): number => {
        let total = 0;
        for (let i = from; i < to; i++) total += Math.abs(buffer[i]!);
        return total / (to - from);
      };
      const head = mean(0, window);
      const tail = mean(buffer.length - window, buffer.length);
      expect(
        head,
        `${layer} ends at ${tail.toFixed(4)} and begins at ${head.toFixed(4)} — the join drops something`,
      ).toBeGreaterThanOrEqual(tail * 0.75);
    }
  });

  it('and the four together stay inside full scale at the loudest level there is', () => {
    /*
      ⚠️ **Measured on the SUM rather than assumed from the parts**, because they are correlated: the
      kick and the bass land on the same beat by construction, so peaks add rather than averaging.
      This is the one number that decides whether a boss fight crunches.
    */
    const loops = bakeLoops(SAMPLE_RATE);
    let peak = 0;
    for (let i = 0; i < loops.drone.length; i++) {
      let sum = 0;
      for (const layer of MUSIC_LAYERS) sum += loops[layer][i]! * MUSIC_LADDER.boss[layer];
      peak = Math.max(peak, Math.abs(sum * MUSIC_GAIN));
    }
    expect(peak, `the boss mix peaks at ${peak.toFixed(2)} of full scale`).toBeLessThanOrEqual(1);
  });
});

describe('the ladder is additive, which is what the ask describes', () => {
  it('opens a layer at every step and never opens one twice', () => {
    /*
      *"Backgroundy, then an increased beat and bass leading into the boss fight, then really get
      pumping as the boss appears."* That is ONE piece of music getting fuller — so each level has to
      have at least what the level below it had OPEN, whatever the gains are.
    */
    for (let i = 1; i < MUSIC_LEVELS.length; i++) {
      const below = MUSIC_LADDER[MUSIC_LEVELS[i - 1]!];
      const here = MUSIC_LADDER[MUSIC_LEVELS[i]!];
      const openBelow = MUSIC_LAYERS.filter((l) => below[l] > 0);
      const openHere = MUSIC_LAYERS.filter((l) => here[l] > 0);
      expect(openHere.length, `${MUSIC_LEVELS[i]} has fewer layers open than ${MUSIC_LEVELS[i - 1]}`).toBeGreaterThan(
        openBelow.length,
      );
      for (const layer of openBelow) {
        expect(here[layer], `${MUSIC_LEVELS[i]} closed ${layer}, which ${MUSIC_LEVELS[i - 1]} had open`).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it('and the quietest level is not silence, because the music never stops', () => {
    // A `calm` of all zeros would be four sources running into nothing, which is a stopped piece of
    // music wearing a running one's clothes — and the transition back would be an entry, not a ramp.
    const open = MUSIC_LAYERS.filter((l) => MUSIC_LADDER.calm[l] > 0);
    expect(open.length, 'the calm level is silent, so the music stops between levels').toBeGreaterThan(0);
  });

  it('and the loudest level is the boss, which is the whole point of the ladder', () => {
    const total = (level: (typeof MUSIC_LEVELS)[number]): number =>
      MUSIC_LAYERS.reduce((sum, l) => sum + MUSIC_LADDER[level][l], 0);
    for (const level of MUSIC_LEVELS) {
      if (level === 'boss') continue;
      expect(total('boss'), `${level} is as loud as the boss fight`).toBeGreaterThan(total(level));
    }
  });
});

describe('how far up the ladder a run is', () => {
  /** Level one's boss, near enough — the rule is about a distance, not about a level. */
  const BOSS_AT = 6350;

  it('is cruising while the boss is far away', () => {
    expect(musicLevelFor(0, BOSS_AT, false)).toBe('run');
    expect(musicLevelFor(BOSS_AT - BOSS_APPROACH_UNITS - 1, BOSS_AT, false)).toBe('run');
  });

  it('and builds as the boss gets close, in SECONDS the player experiences', () => {
    /*
      ⚠️ **The unit is what makes this assertion worth anything** —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`. *A distance of 430* is the model
      talking to itself; what the player gets is a number of seconds of build before the fight, and at
      `SCROLL_PER_STEP` that is what this converts it to.
    */
    expect(musicLevelFor(BOSS_AT - BOSS_APPROACH_UNITS, BOSS_AT, false)).toBe('approach');
    const seconds = BOSS_APPROACH_UNITS / SCROLL_PER_STEP / STEPS_PER_SECOND;
    expect(seconds, `the build lasts ${seconds.toFixed(1)}s, which is not long enough to be one`).toBeGreaterThan(6);
    expect(seconds, `the build lasts ${seconds.toFixed(1)}s, which is a level and not a build`).toBeLessThan(30);
  });

  it('and goes to the boss the moment one is on the field, wherever the camera is', () => {
    /*
      ⚠️ **The boss level is keyed to the BOSS being there and not to a distance**, which is the half a
      threshold cannot do: a boss drifts (0061) and a fight lasts as long as it lasts, so the camera
      passes `bossAt` long before the fight is over.
    */
    expect(musicLevelFor(0, BOSS_AT, true)).toBe('boss');
    expect(musicLevelFor(BOSS_AT + 4000, BOSS_AT, true)).toBe('boss');
  });

  it('and the build is longer than a cue, so it is a piece of music rather than a sting', () => {
    const seconds = BOSS_APPROACH_UNITS / SCROLL_PER_STEP / STEPS_PER_SECOND;
    expect(seconds, 'the approach is shorter than one bar of the thing it is building').toBeGreaterThan(
      BEAT_SECONDS * 4,
    );
  });
});

describe('the boss brings an aura with it', () => {
  /*
    `docs/decisions/0091-the-boss-has-an-aura.md`. Asked for: *"can we add a sound associated with the
    boss that compliments and amplifies the background music… an aura of sound on the bosses so that
    as it gets closer to the player it builds in tempo?"*

    ⚠️ **It is MUSIC and not a cue, and that is the whole decision.** A cue repeated at a shrinking
    interval is fired from the fixed-step loop while the music runs on the `AudioContext` clock — two
    crystals, so it wanders off the beat over a fight. As layers it is sample-locked by construction,
    and it is the seam and length guards above that hold that rather than anything here.
  */
  it('THE ASK: the aura follows the boss in, and is silent when it is far away', () => {
    expect(auraNearness(AURA_FAR_UNITS), 'a boss across the screen is already making a noise').toBe(0);
    expect(auraNearness(AURA_FAR_UNITS + 50), 'a boss beyond the range wraps round to loud').toBe(0);
    expect(auraNearness(AURA_NEAR_UNITS), 'a boss in the player’s face is not at full').toBe(1);
    expect(auraNearness(0), 'the range does not hold past its own near end').toBe(1);
    // And the ceiling exists at all, which is the way the whole feature can be silent and pass.
    for (const layer of AURA_LAYERS) {
      expect(MUSIC_LADDER.boss[layer], `${layer} has no ceiling at the boss, so the aura never sounds`).toBeGreaterThan(
        0,
      );
    }
  });

  it('and nothing but a boss ever opens it', () => {
    /*
      ⚠️ **The counterweight, and *"leading into the boss fight"* is what makes it necessary.** Opening
      the aura during the approach is a plausible misreading — and it takes the sound that is supposed
      to ARRIVE with the boss and gives it to the level before the boss is there.
    */
    for (const level of MUSIC_LEVELS) {
      if (level === 'boss') continue;
      for (const layer of AURA_LAYERS) {
        expect(MUSIC_LADDER[level][layer], `${layer} is open at ${level}, which has no boss in it`).toBe(0);
      }
    }
  });

  it('and the last few units are where it moves, because that is where the fight is', () => {
    /*
      ⚠️ **In the player's own terms: half the RANGE is not half the SOUND.** A linear ramp spends most
      of its travel at distances nobody is thinking about; the ask is about closing in, so the curve
      has to put its movement where the player is committed.

      Held as a property of the shape — the near half of the range carries most of the change — rather
      than against the exponent, which is the constant it is made of.
    */
    const mid = (AURA_NEAR_UNITS + AURA_FAR_UNITS) / 2;
    expect(auraNearness(mid), 'halfway in is already halfway loud, so the approach is the whole story').toBeLessThan(
      0.4,
    );
    const nearHalf = auraNearness(AURA_NEAR_UNITS) - auraNearness(mid);
    const farHalf = auraNearness(mid) - auraNearness(AURA_FAR_UNITS);
    expect(nearHalf, 'the far half of the range carries more of the build than the near half').toBeGreaterThan(farHalf);
  });

  it('and it is measured between the HULLS, so every boss means the same thing', () => {
    /*
      ⚠️ **The gap the player is flying into, not the distance between two centres.** A boss's radius
      runs from 11 to 13 today and will run wider; measured centre to centre, the same visible gap in
      front of two different bosses would be two different sounds.

      Driven through `BOSSES` rather than against a number, so a boss that changes size moves this
      with it.
    */
    const sizes = BOSS_KINDS.map((kind) => BOSSES[kind].radius);
    const smallest = Math.min(...sizes);
    const biggest = Math.max(...sizes);
    expect(biggest, 'every boss is the same size, so this measures nothing').toBeGreaterThan(smallest);
    // The same GAP in front of the biggest and the smallest is the same sound.
    /*
      ⚠️ Driven through , which is where the subtraction lives — and it lives there
      because a probe found it at the call site where nothing could reach it. 0091.
    */
    const centres = 60;
    expect(
      auraNearnessFor(centres, biggest, 0, 0),
      'the bigger boss is not the nearer one at the same centre distance',
    ).toBeGreaterThan(auraNearnessFor(centres, smallest, 0, 0));
    // And the SHIP's own hull counts too, on the same reasoning.
    expect(
      auraNearnessFor(centres, smallest, 0, 6),
      'the ship’s own hull is not part of the gap it is flying into',
    ).toBeGreaterThan(auraNearnessFor(centres, smallest, 0, 0));
  });
});

describe('the patterns are playable', () => {
  it('never asks for a note past the end of the loop', () => {
    /*
      A pattern longer than the loop is not an error and that is the problem: the notes past the end
      would simply never be rendered, so a bar of a bass line would go missing with nothing failing.
    */
    for (const layer of MUSIC_LAYERS) {
      for (const [i, voice] of MUSIC[layer].entries()) {
        const spans = (voice.steps.length - 1) * (BEAT_SECONDS / voice.perBeat);
        expect(spans, `${layer} voice ${i} has notes after the loop ends, and they are silently dropped`).toBeLessThan(
          LOOP_SECONDS,
        );
      }
    }
  });

  it('and every layer has something in it', () => {
    for (const layer of MUSIC_LAYERS) {
      expect(MUSIC[layer].length, `${layer} has no voices`).toBeGreaterThan(0);
      const notes = MUSIC[layer].reduce((sum, v) => sum + v.steps.filter((s) => s !== null).length, 0);
      expect(notes, `${layer} is all rests`).toBeGreaterThan(0);
    }
  });
});
