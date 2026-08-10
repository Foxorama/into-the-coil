import { BANDS, bandEnergy, spectrum } from './spectrum.ts';
import { describe, expect, it } from 'vitest';

import {
  BEAT_SECONDS,
  BOSS_APPROACH_UNITS,
  PUSH_UNITS,
  SURGE_UNITS,
  LAYER_BARS,
  PHRASE_SECONDS,
  TITLE_ONLY,
  secondsOfLayer,
  MUSIC,
  MUSIC_DRIVE,
  MUSIC_GAIN,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  AURA_LAYERS,
  AURA_NEAR_UNITS,
  AURA_FAR_UNITS,
  AURA_LEVEL_CEILING,
  AURA_ONSET_UNITS,
  type MusicLayer,
} from '../src/content/music.ts';
import { auraBuild, auraFor, auraNearness, auraNearnessFor, bakeLayer, bakeLoops, musicLevelFor, rephaseIn } from '../src/app/music.ts';
import { STEPS_PER_BEAT } from '../src/content/music.ts';
import { MAX_STEPS } from '../src/app/loop.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { SAMPLE_RATE, sampleCue, saturate } from '../src/app/sound.ts';
import { CUES } from '../src/content/cues.ts';
import { fireEveryAt } from '../src/content/pickups.ts';
import { makeRng } from '../src/sim/rng.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD, SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
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
      `BEAT_SECONDS` is what it is is that it survives being changed, and a rate is exactly the kind
      of thing 0089 has already moved once.

      ⚠️ **AND IT IS EVERY LAYER'S OWN LENGTH SINCE 0095**, not one shared loop. They are no longer
      all equal — a chord progression needs four bars and a drum pattern does not — so the property
      has to hold for each of them separately.
    */
    for (const rate of RATES) {
      for (const layer of MUSIC_LAYERS) {
        const exact = secondsOfLayer(layer) * rate;
        expect(exact, `${layer} at ${rate}Hz is ${exact} samples, which rounds and therefore drifts`).toBe(
          Math.round(exact),
        );
      }
    }
  });

  it('0095 — THE AMENDMENT: every layer is a whole MULTIPLE of the shortest, which is the same guarantee', () => {
    /*
      ⚠️ **0090 required identical lengths and that was one way of getting what it actually wanted.**
      What it wanted is that loops started together can never come apart; identical lengths give that,
      and so does a whole multiple — a 4-bar pad over a 2-bar drum loop is back at both position zeros
      every 4 bars, for ever, because both are an exact number of samples.

      ⚠️ **What identical lengths ALSO did was forbid a chord progression**, which is the ballad half
      of what was asked for and cannot be stated in two bars.
      `docs/decisions/0095-the-level-has-its-own-music.md`.

      ⚠️ **A NON-multiple would be the unrecoverable failure wearing the new rule's clothes.** Three
      bars against two realigns every six — that is still finite, so a naive reading says it is fine —
      but nothing in the design restarts anything at six bars, and the phrase a correction lands on
      would be wrong. Held as *divides*, not as *is finite*.
    */
    const shortest = Math.min(...MUSIC_LAYERS.map((l) => LAYER_BARS[l]));
    for (const layer of MUSIC_LAYERS) {
      expect(LAYER_BARS[layer] % shortest, `${layer} is ${LAYER_BARS[layer]} bars against a shortest of ${shortest}`).toBe(
        0,
      );
    }
    // And the phrase is the longest, because that is the only instant every layer is at zero together.
    expect(PHRASE_SECONDS, 'the phrase is not the longest layer, so a correction lands mid-pattern').toBe(
      Math.max(...MUSIC_LAYERS.map((l) => secondsOfLayer(l))),
    );
  });

  it('and every layer bakes to exactly its own declared length', () => {
    const loops = bakeLoops(SAMPLE_RATE);
    for (const layer of MUSIC_LAYERS) {
      expect(loops[layer].length, `${layer} is a different length from the loop it declares`).toBe(
        Math.round(secondsOfLayer(layer) * SAMPLE_RATE),
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
    let raw = 0;
    for (let i = 0; i < loops.drone.length; i++) {
      let sum = 0;
      for (const layer of MUSIC_LAYERS) sum += loops[layer][i]! * MUSIC_LADDER.boss[layer];
      raw = Math.max(raw, Math.abs(sum * MUSIC_GAIN));
      // The bus as it actually leaves — `makeMusicOut`'s shaper, at the same drive. 0104.
      peak = Math.max(peak, Math.abs(saturate(sum * MUSIC_GAIN, MUSIC_DRIVE)));
    }
    expect(peak, `the boss mix peaks at ${peak.toFixed(2)} of full scale`).toBeLessThanOrEqual(1);
    /*
      ⚠️ **AND THE SUM GOING INTO THE SHAPER IS HELD SEPARATELY, WHICH IS NOT THE SAME CLAIM.**
      `saturate` cannot return past 1 whatever it is handed, so the assertion above would stay green
      over a mix driven to ten times full scale — a squared-off wave that is no longer music.
      `docs/decisions/0104-the-gun-plays-a-figure.md` chose 0.15 to keep the ladder's dynamics, and
      this is what stops the drive being turned up until the ladder is flat.

      ⚠️ **1.7 rather than 1, because the shaper is ALLOWED to be working.** The measured sum is 1.674
      (0092) and clipping it in software is what the shaper is for; what this refuses is the sum
      growing so far past the curve's knee that everything above it is one level.
    */
    expect(raw, `the boss mix reaches the shaper at ${raw.toFixed(2)}, which is past its knee`).toBeLessThanOrEqual(1.7);
  });
});

describe('the ladder is additive, which is what the ask describes', () => {
  it('opens a layer at every step and never opens one twice', () => {
    /*
      *"Backgroundy, then an increased beat and bass leading into the boss fight, then really get
      pumping as the boss appears."* That is ONE piece of music getting fuller — so each level has to
      have at least what the level below it had OPEN, whatever the gains are.
    */
    /*
      ── AND IT IS NOW TWO PIECES, SO IT IS ADDITIVE FROM `run` UPWARD ──────────────────────────────

      ⚠️ **0095.** *"Keep the current background music for the title and then let's really kick it up
      a notch in the game"* is not one piece getting fuller — it is two pieces with a screen change
      between them, which is the one boundary a crossfade is not a seam. **`calm` is the title's**;
      `run`, `approach` and `boss` are the level's and that ladder is 0090's, unchanged.

      ⚠️ **The closure is NAMED rather than merely allowed**, which is what stops this being a rule
      with a hole in it: only `TITLE_ONLY` may close, and every member of it has to actually be open
      at `calm` and closed at `run` — a layer quietly added to that list without being part of the
      title's piece fails here.
    */
    const level = (name: (typeof MUSIC_LEVELS)[number]): MusicLayer[] =>
      MUSIC_LAYERS.filter((l) => MUSIC_LADDER[name][l] > 0);

    const inLevel = MUSIC_LEVELS.filter((l) => l !== 'calm');
    for (let i = 1; i < inLevel.length; i++) {
      const openBelow = level(inLevel[i - 1]!);
      const openHere = level(inLevel[i]!);
      expect(openHere.length, `${inLevel[i]} has fewer layers open than ${inLevel[i - 1]}`).toBeGreaterThan(
        openBelow.length,
      );
      for (const layer of openBelow) {
        expect(MUSIC_LADDER[inLevel[i]!][layer], `${inLevel[i]} closed ${layer}, which ${inLevel[i - 1]} had open`).toBeGreaterThan(
          0,
        );
      }
    }

    // The one closure the design permits, and it has to be exactly the named set.
    const closedAtRun = level('calm').filter((l) => MUSIC_LADDER.run[l] === 0);
    expect(closedAtRun.sort(), 'a layer closed on entering a level that is not part of the title’s piece').toEqual(
      [...TITLE_ONLY].sort(),
    );
    expect(TITLE_ONLY.length, 'the title has no piece of its own, so there is only one piece').toBeGreaterThan(0);
    for (const layer of TITLE_ONLY) {
      expect(MUSIC_LADDER.calm[layer], `${layer} is listed as the title's and the title does not play it`).toBeGreaterThan(0);
    }
  });

  it('and something is open at EVERY level, because the music never stops', () => {
    /*
      ⚠️ **Two pieces must not mean a gap between them.** 0090's *the music never stops* was free while
      the ladder only ever opened layers; with a closure permitted it needs saying, and what says it is
      the drone — open at every rung, and the reason the change of piece is a swell rather than an
      edit. Held as a property rather than by naming the drone, so the day a different layer does the
      job it simply passes.
    */
    for (const name of MUSIC_LEVELS) {
      const open = MUSIC_LAYERS.filter((l) => MUSIC_LADDER[name][l] > 0);
      expect(open.length, `${name} is silence, so the music stops`).toBeGreaterThan(0);
    }
    const always = MUSIC_LAYERS.filter((l) => MUSIC_LEVELS.every((name) => MUSIC_LADDER[name][l] > 0));
    expect(always.length, 'no layer crosses every level, so the two pieces have nothing joining them').toBeGreaterThan(0);
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
    // ⚠️ 0102: `run` is the first minute rather than the whole level, so *far away* is now measured
    // against `PUSH_UNITS`. A level with no boss at all stays here for ever, which is what a fixture
    // with an infinite `bossAt` relies on.
    expect(musicLevelFor(BOSS_AT - PUSH_UNITS - 1, BOSS_AT, false)).toBe('run');
    expect(musicLevelFor(0, Number.POSITIVE_INFINITY, false)).toBe('run');
  });

  it('0102 — and it climbs FOUR times inside a level, where it used to climb once', () => {
    /*
      `docs/decisions/0102-the-music-goes-somewhere.md`. Reported twice: *"the ingame background music
      doesn't change and increase in tempo as you progress through the level"*, then *"still flat and
      lifeless, has no depth, no pace, no increased tempo."*

      ⚠️ **`run` covered about 160 seconds of a 176-second level.** One arrangement, three layers, a
      four-bar loop — and every guard in this file was green over it, because they were all about the
      LADDER's shape and none of them about how much of a level any rung covers.

      ⚠️ **Asserted in SECONDS, which is the unit the report is in.** *A distance of 4,200* is the
      model talking to itself; what the player experiences is how long it is before something changes,
      and nothing here reads `PUSH_UNITS` or `SURGE_UNITS` against itself —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`.
    */
    const at = (units: number): (typeof MUSIC_LEVELS)[number] => musicLevelFor(BOSS_AT - units, BOSS_AT, false);
    expect(at(PUSH_UNITS)).toBe('push');
    expect(at(SURGE_UNITS)).toBe('surge');
    expect(at(BOSS_APPROACH_UNITS)).toBe('approach');

    /** How long the run spends at each rung, in seconds, from the level's start to its boss. */
    const perSecond = SCROLL_PER_STEP * STEPS_PER_SECOND;
    const spans = [
      ['run', (BOSS_AT - PUSH_UNITS) / perSecond],
      ['push', (PUSH_UNITS - SURGE_UNITS) / perSecond],
      ['surge', (SURGE_UNITS - BOSS_APPROACH_UNITS) / perSecond],
      ['approach', BOSS_APPROACH_UNITS / perSecond],
    ] as const;
    for (const [name, seconds] of spans) {
      /*
        ⚠️ **Ten seconds is the floor and it is not arbitrary**: `RAMP_SECONDS` is 1.6, so a rung
        shorter than a handful of those is a gain ramp the player hears as a wobble rather than as a
        change. A rung nobody spends time at is a rung that is not in the music.
      */
      expect(seconds, `the music spends ${seconds.toFixed(0)}s at ${name}, which is not a stretch of a level`).toBeGreaterThan(
        10,
      );
      /*
        ⚠️ **And the ceiling is what the report is about.** Before this, `run` covered 160 seconds of a
        176-second level; anything over about a minute and a half is *a level with one arrangement in
        it* however many rungs the table has.
      */
      expect(seconds, `the music spends ${seconds.toFixed(0)}s at ${name} without changing`).toBeLessThan(90);
    }
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

describe('0094 — in time is not in phase, and the loops follow the sim', () => {
  /*
    `docs/decisions/0094-in-time-is-not-in-phase.md`. 0093 put every fire cadence on a musical
    fraction of the beat; a cadence is a RATE, and what makes a metronome land on the beat is a
    PHASE. This is the half that keeps them agreeing over the length of a level.

    ⚠️ **The thing it exists for is dropped steps, not crystal drift.** `src/app/loop.ts` throws away
    everything past `MAX_STEPS` rather than spiralling, which is 0022 working exactly as designed —
    and every discarded step is a step the sim never ran while the audio clock kept going.
  */
  /** No notice required, so these read the policy rather than the scheduler's lead time. */
  const NOW = 0;
  /** Comfortably past the one-loop settling rule, so the tests below are about the error. */
  const SETTLED = PHRASE_SECONDS * 3;

  it('leaves the loops alone when nothing has drifted, which is almost every frame', () => {
    expect(rephaseIn(SETTLED, SETTLED, NOW), 'a perfectly tracking sim was corrected anyway').toBeNull();
    // And a millisecond either way is noise, not drift.
    expect(rephaseIn(SETTLED + 0.001, SETTLED, NOW)).toBeNull();
    expect(rephaseIn(SETTLED - 0.001, SETTLED, NOW)).toBeNull();
  });

  it('THE ONE IT EXISTS FOR: a hitch big enough to drop steps is corrected, in the player’s own units', () => {
    /*
      ⚠️ **Written from `MAX_STEPS` rather than from a number typed here** —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`. A frame that arrives late enough to
      need more than `MAX_STEPS` steps has the excess DISCARDED, so the sim silently loses that much
      time against the audio. This drives the smallest such event there is — one step over the cap —
      and asserts it is caught.

      ⚠️ **And the threshold is stated in the unit the ear uses**: the error the correction triggers on
      must be smaller than a sixteenth-note triplet at the tempo the game plays, or the gun would be a
      whole subdivision out before anything moved. That is what makes 50ms a number rather than a
      taste.
    */
    const oneStep = 1 / STEPS_PER_SECOND;
    /*
      A frame arriving late enough to need `MAX_STEPS + 4` steps runs five and discards four, so the
      sim loses four steps of time against the audio and never gets them back. On a 60Hz sim that is
      a frame about 150ms long — an ordinary hitch on the phone 0022 sizes the budget for.
    */
    const needed = MAX_STEPS + 4;
    const dropped = needed - MAX_STEPS;
    expect(
      rephaseIn(SETTLED + dropped * oneStep, SETTLED, NOW),
      `${dropped} dropped steps went uncorrected, so a stuttering device drifts off the beat for good`,
    ).not.toBeNull();

    /*
      ⚠️ **AND THE WORST TOLERATED ERROR IS STATED IN THE UNIT THE EAR USES.** However the threshold is
      spelled, the loops must never be allowed to sit a whole subdivision out — at the weapon cap the
      gun fires every sixteenth-note triplet, and an error that reaches that gap is a gun landing on
      the wrong note rather than slightly beside the right one.
    */
    let worstTolerated = 0;
    for (let ms = 1; ms <= 500; ms++) {
      if (rephaseIn(SETTLED + ms / 1000, SETTLED, NOW) !== null) break;
      worstTolerated = ms / 1000;
    }
    const shortestVolleyGap = (STEPS_PER_BEAT / 6) * oneStep;
    expect(worstTolerated, 'every error is corrected, so the threshold is not doing anything').toBeGreaterThan(0);
    expect(
      worstTolerated,
      `the loops may sit ${(worstTolerated * 1000).toFixed(0)}ms out against ${(shortestVolleyGap * 1000).toFixed(0)}ms between volleys at the cap`,
    ).toBeLessThan(shortestVolleyGap);
  });

  it('and the correction always lands on a loop boundary, because a loop has no other seam', () => {
    /*
      ⚠️ **A loop restarted mid-phrase cuts every tail crossing the join**, which is precisely the
      notch 0090's seam guard exists to keep out of the bake — it would be no better arriving at
      runtime. At a boundary the loop was returning to zero anyway, so the correction moves only WHEN.
    */
    for (const position of [0, 0.3, 1.1, 2.9, 3.19]) {
      const simElapsed = PHRASE_SECONDS * 4 + position;
      const delay = rephaseIn(simElapsed + 0.4, simElapsed, NOW);
      expect(delay, `no correction was offered at loop position ${position}`).not.toBeNull();
      const landsAt = (simElapsed + delay!) % PHRASE_SECONDS;
      expect(
        Math.min(landsAt, PHRASE_SECONDS - landsAt),
        `a correction at position ${position} lands ${landsAt.toFixed(3)}s into the loop, mid-phrase`,
      ).toBeCloseTo(0, 6);
    }
  });

  it('and never schedules one in the past, or with less notice than the scheduler needs', () => {
    // Exactly on a boundary the answer is a whole loop away and not zero — a swap scheduled for now
    // is a swap the audio thread has already gone past.
    const onBoundary = PHRASE_SECONDS * 4;
    expect(rephaseIn(onBoundary + 0.4, onBoundary, 0)).toBeCloseTo(PHRASE_SECONDS, 6);
    for (const ahead of [0.06, 0.5, PHRASE_SECONDS * 1.5]) {
      const delay = rephaseIn(PHRASE_SECONDS * 4 + 0.4, PHRASE_SECONDS * 4 + 0.01, ahead);
      expect(delay, `a correction was offered with less than ${ahead}s notice`).toBeGreaterThanOrEqual(ahead);
    }
  });

  it('THE TRICK: a whole loop of drift is no drift at all, so a backgrounded tab is a small correction', () => {
    /*
      ⚠️ **The music is a LOOP, so being one entire loop behind is audibly identical to being in
      phase** — same samples, same instant. Without the wrap, a tab left alone for half a minute comes
      back thirty seconds of error and the correction is a lurch; with it, the worst case anywhere is
      half a loop.
    */
    const settled = PHRASE_SECONDS * 4;
    expect(rephaseIn(settled + PHRASE_SECONDS, settled, NOW), 'a whole loop of drift was treated as drift').toBeNull();
    expect(rephaseIn(settled + PHRASE_SECONDS * 9, settled, NOW), 'nine whole loops was treated as drift').toBeNull();
    // And a long absence resolves to at most half a loop of real error, which is one correction.
    const delay = rephaseIn(settled + 30, settled, NOW);
    expect(delay, 'thirty seconds away produced no correction at all').not.toBeNull();
    expect(delay!, 'the correction after a long absence is more than one loop away').toBeLessThanOrEqual(PHRASE_SECONDS);
  });

  it('and corrects nothing until the anchor has played a whole loop, which is the allocation ceiling', () => {
    /*
      ⚠️ **A rate limit as much as a rule, and a browser test is what put it here.** Every correction
      re-anchors, so this is the ceiling on how often six source nodes can be created: once per loop,
      worst case. `tests/sound.browser.test.ts` counted 37 sources where it expected 7 — a driven sim
      races ahead of a standing audio clock, and the real loop can do a milder version of it by
      running `MAX_STEPS` steps in one frame. **An error measured over less than a loop is measuring
      the catch-up.**
    */
    for (const played of [0, 0.5, PHRASE_SECONDS - 0.001]) {
      expect(rephaseIn(played, 0, NOW), `a correction was offered after only ${played}s of playback`).toBeNull();
    }
    expect(rephaseIn(PHRASE_SECONDS + 0.4, PHRASE_SECONDS, NOW), 'nothing is ever corrected at all').not.toBeNull();
  });
});

describe('0095 — the level has a piece of its own, and it covers the band', () => {
  /*
    `docs/decisions/0095-the-level-has-its-own-music.md`. Reported from play: *"the non-boss
    background music makes kinda interesting title background music, but not great level background
    music"*, and *"a mix of a power ballad style music and the game Rez"*.

    ⚠️ **NOTHING HERE CAN HEAR A CHORD PROGRESSION**, and most of what this decision adds is content —
    a kick pattern, four chords and a tune. `node scripts/hear.mjs --music` writes all of it and the
    verdict is a hand. What a number CAN see is the shape 0089 was written for: a hump in the middle
    with nothing at either end, which is *"a tin shed heard from outside"* one octave wider.
  */
  /*
    ⚠️ **BAKED AND MIXED ONCE, AND THE FULL SUITE IS WHAT SAID SO.** These three tests each want a
    whole phrase of real audio; the first draft called `bakeLoops` inside the mixer, so four rungs
    meant four bakes at about half a second each. It passed alone and **timed out at five seconds
    inside `npm test`**, which is `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`'s
    subject exactly — and the answer there is to establish which it is rather than to re-run. It was
    the guard's own cost, not the code's.
  */
  const baked = bakeLoops(SAMPLE_RATE);
  const mixes = new Map<string, Float32Array>();

  /** One phrase of a level, mixed at a rung, exactly as `src/app/music.ts` would play it. */
  function mixAt(level: (typeof MUSIC_LEVELS)[number]): Float32Array {
    const cached = mixes.get(level);
    if (cached !== undefined) return cached;
    const out = new Float32Array(Math.round(PHRASE_SECONDS * SAMPLE_RATE));
    for (let i = 0; i < out.length; i++) {
      let v = 0;
      for (const layer of MUSIC_LAYERS) v += baked[layer][i % baked[layer].length]! * MUSIC_LADDER[level][layer];
      /*
        ⚠️ **THE SHAPER IS MODELLED HERE, AND THAT IS WHY IT IS A `WaveShaperNode`** —
        `docs/decisions/0104-the-gun-plays-a-figure.md`. `makeMusicOut` puts `saturate` on the music
        bus at `MUSIC_DRIVE`, so **the pre-shaper sum is a signal that no longer reaches anybody**.
        A guard measuring it would be holding a number the player cannot hear, which is
        `docs/decisions/0027-measure-the-picture-not-the-model.md` exactly.

        ⚠️ **A compressor could not have been modelled and that decided which node it is.** Attack and
        release make the output a function of the signal's history; this is stateless, so the same
        call with the same two arguments is the whole of what the audio thread does.
      */
      out[i] = saturate(v * MUSIC_GAIN, MUSIC_DRIVE);
    }
    mixes.set(level, out);
    return out;
  }

  /*
    ⚠️ **A HONEST TIMEOUT RATHER THAN A FASTER GUARD.** A Goertzel over seven bands and six probes
    across a 6.4-second phrase is tens of millions of multiplies, and shortening the window or
    dropping bands would measure something other than the music. Twenty seconds is what real DSP
    costs; the default five is a bound written for tests that do arithmetic.
  */
  const DSP_MS = 20_000;

  it('THE SHED, one octave wider: a level is spread across the spectrum rather than humped in the middle', () => {
    /*
      ⚠️ **The same measure 0089's cues are held to, on the thing 0095 adds.** Synthesised music with
      no sub and no air is the exact defect that report described, and it is the one failure mode of
      a whole new piece that a suite can actually catch: every band has to carry something.

      ⚠️ **Driven at `boss`, which is every layer at once** — the rung where a missing extreme would be
      least excusable and most likely, because seven things are competing for the middle.
    */
    const bands = spectrum(mixAt('boss'), SAMPLE_RATE);
    for (const [i, [lo, hi, name]] of BANDS.entries()) {
      expect(
        bands[i],
        `the boss mix has nothing in ${name} (${lo}–${hi}Hz) — it is a hump in the middle`,
      ).toBeGreaterThan(0.02);
    }
  }, DSP_MS);

  it('and a level has more SUB than the title, because a level has a kick and the title has a pad', () => {
    /*
      ⚠️ **A FLOOR ON THE SHAPE WOULD HAVE PASSED A REAL DEFECT, AND THIS IS WHAT CAUGHT IT.**
      A-weighting is thirty decibels down at 40Hz, so the sub band reads small for any music whatever
      and an absolute floor there can only be set loose enough to be nearly useless. The first bake of
      the level's piece had **less** energy below 60Hz than the title's — 5.1e-5 against 7.8e-5 — which
      for a piece built on four-on-the-floor is backwards, and every other guard in this file was
      green. The fixes are in `src/content/music.ts`: a longer, deeper kick and a sine octave under
      the rolling sub, both named against this test.

      ⚠️ **`bandEnergy` AND NOT `spectrum`, AND THE FIRST VERSION GOT THAT WRONG.** `spectrum`
      normalises each mix to its own loudest band, so it measures SHAPE — two profiles from different
      mixes cannot be compared to each other at all, and the first draft of this compared them anyway
      and reported the level as bass-light because its low-mid is large. Energy is the question here.

      ⚠️ **The SUB band specifically, not everything under 130Hz.** The two pieces put their bass in
      different places on purpose — the title's riff sits around 110Hz and the level's kick and sub
      sit at 38–55Hz — so a combined figure conflates *how much* with *where*, and would move whenever
      either piece was revoiced. What has to be true is the thing four-on-the-floor is for.
    */
    const sub = BANDS.findIndex(([, , name]) => name === 'sub');
    const title = bandEnergy(mixAt('calm'), SAMPLE_RATE)[sub]!;
    for (const level of ['run', 'approach', 'boss'] as const) {
      const here = bandEnergy(mixAt(level), SAMPLE_RATE)[sub]!;
      expect(
        here,
        `${level} has ${here.toExponential(2)} of sub against the title's ${title.toExponential(2)} — ` +
          'a kick quieter than a pad',
      ).toBeGreaterThan(title);
    }
  }, DSP_MS);

  it('and the level is LOUDER than the title, because that is what was asked for', () => {
    /*
      ⚠️ **In the unit the player experiences: loudness, not layer count.** *"Really kick it up a
      notch in the game"* is a statement about how it feels to arrive in a level, and a ladder that
      opened three new layers at the same total energy would satisfy every other guard here while
      changing nothing. Measured as RMS over a whole phrase, which is what an ear integrates.
    */
    const rms = (s: Float32Array): number => {
      let sum = 0;
      for (const v of s) sum += v * v;
      return Math.sqrt(sum / s.length);
    };
    const title = rms(mixAt('calm'));
    const level = rms(mixAt('run'));
    const boss = rms(mixAt('boss'));
    expect(level, `a level is ${(level / title).toFixed(2)}× the title, which is not a notch`).toBeGreaterThan(
      title * 1.2,
    );
    expect(boss, 'a boss fight is no louder than cruising').toBeGreaterThan(level);
  });

  it('and no rung clips, which is the arithmetic every layer added has to pass', () => {
    /*
      ⚠️ **THE GUARD THAT SIZED THIS WHOLE DECISION.** Three new layers went in and the boss mix
      reached 1.05 of full scale on the first bake; the engine's kick, its click and its clap came
      down, and the boss row came down with them. Every gain in `src/content/music.ts` is a hand's
      number, and this is the one thing that constrains them.
    */
    for (const level of MUSIC_LEVELS) {
      let peak = 0;
      for (const v of mixAt(level)) peak = Math.max(peak, Math.abs(v));
      expect(peak, `the ${level} mix peaks at ${peak.toFixed(3)} of full scale`).toBeLessThanOrEqual(1);
    }
  }, DSP_MS);

  it('0104 — THE REPORTED ONE: the bed is not quieter than the gun playing over it', () => {
    /*
      ⚠️ **Reported four times, most recently *"volume levels are still way off, background too
      quiet"*, and the first three answers all moved `MUSIC_GAIN`.** They could not have worked: this
      file's own clipping guard caps that constant at 0.597 by measurement, so the whole remaining
      travel was 1.2 dB against a deficit this measures at 3 to 5.

      ⚠️ **NOTHING IN THIS FILE ASSERTED A LOWER BOUND ON LOUDNESS AT ALL, and a probe found it.**
      Every music guard was a CEILING — nothing clips, no rung crunches, the sum fits — so removing
      the mastering that answers the report left the suite completely green. That is
      `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` doing the thing it exists for, on a
      decision's headline mechanism.

      ⚠️ **The quantity is the RATIO and not a level, which is what makes it a real check.** *Too
      quiet* is never about absolute amplitude — it is about the bed against the things playing over
      it. `MASTER_GAIN` scales both buses and cancels, so what is compared is exactly what the player
      hears one against the other.

      ⚠️ **The gun is the right thing to compare against**, and not the loudest cue. Auto-fire never
      stops (`src/content/actions.ts`), so the pulse is the one sound present continuously — it is the
      floor the music has to clear to be a bed rather than something underneath the gun. An explosion
      is a transient and is *supposed* to be louder.
    */
    const bed = mixAt('run');
    let bedSq = 0;
    for (const v of bed) bedSq += v * v;
    const bedRms = Math.sqrt(bedSq / bed.length);

    // The gun at its fastest rung, laid down over the same stretch at the cadence the ladder reaches.
    const fastest = Math.min(...SHIPS.proof.firePerBeat.map((_unused, tier) => fireEveryAt(SHIPS.proof, tier)));
    const shot = sampleCue(CUES.pulse, SAMPLE_RATE, makeRng('cues').stream('pulse'));
    const gun = new Float32Array(bed.length);
    const perStep = SAMPLE_RATE / STEPS_PER_SECOND;
    for (let at = 0; at * fastest * perStep < gun.length; at++) {
      const start = Math.round(at * fastest * perStep);
      for (let i = 0; i < shot.length && start + i < gun.length; i++) gun[start + i] = (gun[start + i] ?? 0) + shot[i]!;
    }
    let gunSq = 0;
    for (const v of gun) gunSq += v * v;
    const gunRms = Math.sqrt(gunSq / gun.length);

    /*
      ⚠️ **SIX DECIBELS, WHICH IS THE BED AT TWICE THE GUN'S AMPLITUDE, AND IT IS MEASURED RATHER
      THAN PICKED.** Driven over the shipped build and this one:

      | | `run` vs the gun | `boss` vs the gun |
      |---|---|---|
      | unmastered, as reported | **+2.0 dB** | +5.0 dB |
      | `MUSIC_DRIVE` 0.15 | **+7.5 dB** | +10.0 dB |

      **+2.0 dB is the state a play-test called *background too quiet*, so the bound has to refuse
      it** — and *merely louder than the gun* did not: a first draft asserted `> 0` and `npm run prove`
      reported **STILL GREEN** with the mastering removed entirely, which is
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching a guard standing over the
      headline mechanism of its own decision.

      ⚠️ **Twice the amplitude is the smallest bound that is also a statable rule**, rather than a
      number chosen to sit under the current measurement. There is 1.5 dB of margin at 0.15, which is
      deliberately thin: this is a floor the mix has to keep clearing, not a description of where it
      happens to be.
    */
    const ratio = 20 * Math.log10(bedRms / gunRms);
    expect(
      ratio,
      `the level's music sits ${ratio.toFixed(1)}dB over a gun firing every ${fastest} steps — ` +
        `the background is not twice the thing playing continuously over it`,
    ).toBeGreaterThan(6);
  }, DSP_MS);
});

describe('0102 — the music has accents, a bass line and a build', () => {
  /*
    `docs/decisions/0102-the-music-goes-somewhere.md`. Three reports across two play-tests: *"the
    metronome doesn't fit the other beat… it sounds like two separate tracks"*, *"an incredibly
    limited couple of repeating beats that's a few seconds of sound repeated for minutes"*, and
    *"still flat and lifeless, has no depth, no pace, no increased tempo."*
  */

  it('THE TITLE: a drum is not struck at one weight, which is what a metronome IS', () => {
    /*
      ⚠️ **THERE WAS NO ACCENT ANYWHERE IN THE MODEL.** An unpitched `steps` entry said *play* or
      *rest*, so every kick, click, snare and hat in the game was bit-identical to every other — and
      identical repetition at a fixed interval is not *like* a metronome, it is the definition of one.
      No arrangement of gains or filters could have answered the report.

      ⚠️ **`src/content/music.ts` CLAIMED its hats alternated** — *"loud and quiet, which is what
      makes them a shuffle rather than a machine"* — and the pattern was thirty-two ones. That is the
      shape worth catching: prose describing something the data structure could not express, with
      nothing able to disagree with it. This is what disagrees.

      ⚠️ **Held over the TITLE's beat specifically**, because that is what was reported, and as a
      property of the pattern rather than of any value in it.
    */
    const struck = (voice: (typeof MUSIC)['beat'][number]): number[] =>
      voice.steps.filter((s): s is number => s !== null);
    const weights = new Set(MUSIC.beat.flatMap((voice) => struck(voice)));
    expect(weights.size, 'every drum in the title is struck at exactly one weight, which is a click track').toBeGreaterThan(
      2,
    );
    // And at least one voice varies WITHIN itself — a layer of uniform voices at different levels is
    // still four machines, which is the thing being fixed rather than a different arrangement of it.
    const varying = MUSIC.beat.filter((voice) => new Set(struck(voice)).size > 1);
    expect(varying.length, 'no single drum part in the title changes weight across its own bar').toBeGreaterThan(1);
  });

  it('and an accent reaches the SAMPLES, not just the table', () => {
    /*
      ⚠️ **The table could carry velocities that `renderVoice` throws away**, which is one line and
      would leave every assertion above green — 0027 in the channel with nothing to look at. What is
      measured is the bake: the loudest sixteenth of the title's hats against the quietest, over one
      loop.

      ⚠️ **Compared as a RATIO rather than against a level**, because the gain is a taste and the
      accent is not: whatever the hats are mixed at, the strong ones have to be audibly stronger.
    */
    const hats = MUSIC.beat[MUSIC.beat.length - 1]!;
    expect(hats.pitched, 'the last voice of the title beat is not a drum any more').toBe(false);
    expect(hats.perBeat, 'the last voice of the title beat is not the sixteenth hats any more').toBe(4);
    const values = hats.steps.filter((s): s is number => s !== null);
    const loudest = Math.max(...values);
    const quietest = Math.min(...values);
    expect(loudest / quietest, 'the hats are all one weight in the table').toBeGreaterThan(1.5);

    /*
      ⚠️ **THE REAL BAKE, AND THE FIRST VERSION OF THIS RE-IMPLEMENTED THE VELOCITY ITSELF.** It built
      the buffer by calling `sampleLayerInto` with `value === 1 ? note : { ...note, gain: gain * value }`
      — which is the line under test, copied into the test. `npm run prove` reported STILL GREEN when
      the multiply was deleted from `src/app/music.ts`, correctly and damningly: the guard was
      measuring itself. It bakes the layer through `bakeLayer` now, which is the path the game takes.

      ⚠️ **Separated by FREQUENCY rather than by position, because the kick's tail is louder than a
      hat.** The kick decays over a quarter of a second and reaches 0.135 where a hat peaks at 0.07,
      so a raw peak at a hat's position measures the kick. The hats are the only thing in the layer
      with content above 5 kHz — `src/content/music.ts` high-passes them at 6 kHz and the snare's
      lowpass falls to 1.6 — so the *air* band at a hat's instant is the hat and nothing else.

      ⚠️ **Two sixteenths chosen because nothing else strikes on them.** At `perBeat: 2` the kick
      lands on sixteenths 0, 6, 12, 16, 22, 28 and the snare on 4, 12, 20, 26, 28; 8 and 9 are free of
      both, and the accent cycle makes 8 a strong hat and 9 a weak one.
    */
    const rate = SAMPLE_RATE;
    const buffer = bakeLayer('beat', rate);
    const step = BEAT_SECONDS / hats.perBeat;
    /** The air-band energy of the twenty milliseconds beginning at sixteenth `i`. */
    const airAt = (i: number): number => {
      const from = Math.round(i * step * rate);
      const window = buffer.subarray(from, Math.min(from + Math.round(0.02 * rate), buffer.length));
      return bandEnergy(window, rate)[BANDS.findIndex(([, , name]) => name === 'air')]!;
    };
    expect(hats.steps[8], 'sixteenth 8 is no longer the accented hat this is written against').toBe(loudest);
    expect(hats.steps[11], 'sixteenth 11 is no longer the quiet hat this is written against').toBe(quietest);
    const strong = airAt(8);
    const weak = airAt(11);
    expect(strong, 'the hats baked to silence, so this measured nothing').toBeGreaterThan(0);
    expect(
      strong / weak,
      `the accented hat bakes ${(strong / weak).toFixed(2)}× the quiet one, against ${(loudest / quietest).toFixed(2)}× in the table`,
    ).toBeGreaterThan(1.4);
  });

  it('THE LEVEL: there is something in the low end that MOVES, at every rung above the opening', () => {
    /*
      ⚠️ **THE LEVEL'S PIECE HAD NO BASS LINE, AND THAT IS MOST OF *"NO DEPTH"*.** `bass` is
      `TITLE_ONLY` — 0095 closed it, correctly, because an A-rooted riff is a wrong note over three
      chords in four — and nothing replaced it. From the moment a level began, the only thing under
      the kick was `chords`' own rolling sub.

      ⚠️ **Held as *a pitched layer, low, that changes note WITHIN A BAR*, rather than by naming
      `groove`.** The day a different layer does that job it simply passes.

      ⚠️ **AND *WITHIN A BAR* IS THE WHOLE OF IT — a first draft counted distinct notes over the
      whole pattern and `npm run prove` reported WRONG TEST.** `chords`' rolling sub is pitched, at
      octave zero, and takes four different notes across the progression — so it satisfied *low and
      moving* and the guard passed with `groove` closed. But it plays ONE note per bar, repeated on
      eighths: it follows the chord, which is exactly the thing that was there all along and is not a
      bass line. **What separates a line from a sub is that a line moves inside the bar.**
    */
    const beatsPerBar = 4;
    const lowAndMoving = MUSIC_LAYERS.filter((layer) =>
      MUSIC[layer].some((voice) => {
        if (!voice.pitched || voice.octave > 1) return false;
        const perBar = Math.round(voice.perBeat * beatsPerBar);
        for (let bar = 0; bar * perBar < voice.steps.length; bar++) {
          const inBar = voice.steps.slice(bar * perBar, (bar + 1) * perBar).filter((s) => s !== null);
          if (new Set(inBar).size > 2) return true;
        }
        return false;
      }),
    );
    expect(lowAndMoving.length, 'nothing in the whole piece is a moving bass line').toBeGreaterThan(0);
    /*
      ⚠️ **`run` USED TO BE SKIPPED HERE AND `npm run prove` IS WHY IT IS NOT** —
      `docs/decisions/0104-the-gun-plays-a-figure.md`. The exemption was correct while `groove` opened
      at `push`: a level's opening rung genuinely had no bass line and 0102 chose that deliberately.
      The seventh play-test asked for the opposite — *"the title and boss screen music needs to be the
      minimum base level we build upon"* — so `groove` moved down to `run`, and the skip left the guard
      standing over the one rung the new rule is about. A probe closing `groove` at `run` reported
      **STILL GREEN**.

      ⚠️ **`calm` is still exempt and is a different piece.** It is the title's, it has `bass` open,
      and 0095 is the decision that says the two do not share a ladder.
    */
    for (const level of MUSIC_LEVELS) {
      if (level === 'calm') continue;
      const open = lowAndMoving.filter((layer) => MUSIC_LADDER[level][layer] > 0);
      expect(open.length, `${level} has no moving bass line under it, so the low end is a pad`).toBeGreaterThan(0);
    }
  });

  it('and each rung strikes MORE NOTES A BAR than the one below, which is what *pace* is', () => {
    /*
      ⚠️ **THE TEMPO DOES NOT CHANGE AND CANNOT** — `docs/decisions/0093-the-gun-is-on-the-grid.md`
      fixes a beat at 24 sim steps, and the player's gun, every enemy's cadence and 0094's phase-lock
      all ride it. A BPM ramp would take the whole game off the grid three decisions exist to put it
      on. *"Increased tempo"* is answered by the rate of EVENTS, which is the same mechanism
      `docs/decisions/0091-the-boss-has-an-aura.md` already calls *builds in tempo*.

      ⚠️ **NOTES A BAR, and NOT the finest subdivision available — a first draft used that and it was
      the wrong quantity.** `engine` has sixteenth hats, so the finest subdivision in the piece is
      already 4 at the opening of every level and stays 4 for ever; measured that way the boss is no
      busier than the first bar, which is plainly false. What rises is how much is HAPPENING, and
      that is a count.

      ⚠️ **Per bar rather than per loop**, because the layers are two, four and eight bars long and a
      per-loop count would say an eight-bar layer is twice as busy as the same pattern written twice.
    */
    const perBar = (level: (typeof MUSIC_LEVELS)[number]): number =>
      MUSIC_LAYERS.filter((l) => MUSIC_LADDER[level][l] > 0).reduce(
        (sum, l) => sum + MUSIC[l].reduce((n, v) => n + v.steps.filter((s) => s !== null).length, 0) / LAYER_BARS[l],
        0,
      );
    const inLevel = MUSIC_LEVELS.filter((l) => l !== 'calm');
    for (let i = 1; i < inLevel.length; i++) {
      const here = perBar(inLevel[i]!);
      const below = perBar(inLevel[i - 1]!);
      expect(
        here,
        `${inLevel[i]} strikes ${here.toFixed(0)} notes a bar against ${inLevel[i - 1]}'s ${below.toFixed(0)} — nothing about it reads as faster`,
      ).toBeGreaterThan(below);
    }
    /*
      ⚠️ **And the whole climb is worth having.** Each rung being *more* is satisfied by adding one
      note four times; what the report is about is a level that arrives somewhere, so the boss has to
      be half as busy again as the opening.
    */
    const climb = perBar('boss') / perBar('run');
    expect(climb, `the boss is only ${climb.toFixed(2)}× as busy as the opening of a level`).toBeGreaterThan(1.5);
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

  it('0107 — and nothing but a BOSS ever takes it to the top, though the level may raise it', () => {
    /*
      ⚠️ **THIS RULE CHANGED ON THE PLAYER'S INSTRUCTION AND THE GUARD IS REWRITTEN RATHER THAN
      DELETED** — `docs/decisions/0107-a-level-is-a-place.md`. It used to read *nothing but a boss ever
      opens it*, and that was 0091's counterweight: opening the aura during the approach takes the
      sound that is supposed to ARRIVE with the boss and gives it to the level.

      ⚠️ **The ask is now the opposite, in as many words:** *"the aura music for the boss needs to
      start about 15-30secs into the start of a level and then amp up until you beat the boss."* A rule
      the player has reversed is not a rule a guard should keep enforcing.

      ⚠️ **WHAT SURVIVES IS THE HALF THAT WAS ALWAYS THE POINT: the fight is the only place it reaches
      the top.** `src/app/music.ts` multiplies these ceilings by `auraFor(build, nearness)`, and the
      build is capped at `AURA_LEVEL_CEILING` — so before a boss exists the aura can reach 55% of a
      rung that is itself below the boss row, and only proximity to an actual boss takes it further.
      That is *"leading into the boss fight"* kept and *"arrives with the boss"* given up on purpose.

      ⚠️ **And `calm` is still absolutely zero**, because the title, the level break and the run-over
      screen are not in a level and have nothing to build towards.
    */
    for (const layer of AURA_LAYERS) {
      expect(MUSIC_LADDER.calm[layer], `${layer} is open on the title screen, which is not in a level`).toBe(0);
      // The ceiling climbs towards the fight rather than arriving at it.
      let previous = 0;
      for (const level of MUSIC_LEVELS) {
        if (level === 'calm') continue;
        const here = MUSIC_LADDER[level][layer];
        expect(here, `${layer} at ${level} is quieter than the rung below it, so the build goes backwards`).toBeGreaterThan(
          previous,
        );
        previous = here;
      }
      expect(MUSIC_LADDER.boss[layer], `${layer} does not reach its ceiling at the boss`).toBeGreaterThan(
        MUSIC_LADDER.approach[layer],
      );
    }
    /*
      ⚠️ **AND THE LOUDEST A LEVEL CAN GET ON ITS OWN IS BELOW THE QUIETEST A FIGHT IS**, which is the
      claim that stops the build stealing the arrival. Driven through the same arithmetic the shell
      uses rather than restated.
    */
    for (const layer of AURA_LAYERS) {
      /*
        ⚠️ **THE CLAIM IS THAT THE FIGHT IS AN AUDIBLE STEP UP, and a first draft asserted something
        weaker that `npm run prove` walked straight through.** It read *the level's peak is below the
        boss row* — which is true at a build ceiling of 1 (0.88 against 1.00) and completely fails to
        say what it means, so a probe opening the build all the way reported **STILL GREEN**.

        ⚠️ **What it must be is a RATIO**, because *"amp up until you beat the boss"* is a claim about
        how much further there is to go. At the shipped ceiling the fight can nearly double what the
        level reached; at a ceiling of 1 it has 14% left, which is the boss arriving at a volume the
        player has been sitting in for a minute.
      */
      const levelPeak = MUSIC_LADDER.approach[layer] * AURA_LEVEL_CEILING;
      const fightPeak = MUSIC_LADDER.boss[layer];
      expect(
        fightPeak / levelPeak,
        `${layer} reaches ${levelPeak.toFixed(2)} on the level's own build and a fight tops out at ` +
          `${fightPeak.toFixed(2)} — the boss arrives at a volume the level was already at`,
      ).toBeGreaterThan(1.8);
    }
  });

  it('0107 — and the build is a level-long climb that starts after the opening', () => {
    /*
      ⚠️ **Reported: *"start about 15-30secs into the start of a level."*** At 36 units a second,
      `AURA_ONSET_UNITS` of 720 is twenty seconds — the middle of the range asked for, and a DISTANCE
      rather than a timer, so a level authored longer spends longer building rather than arriving at
      full dread a third of the way in.

      ⚠️ **Silent before the onset, which is 0043's empty opening kept.** A level opens on an empty
      field so the controls can be found; one that opened with the boss already audible would be
      answering a different ask.
    */
    const bossAt = 6350;
    /*
      ⚠️ **IN SECONDS AND NOT IN `AURA_ONSET_UNITS`, AND A PROBE IS WHY.** The first draft asserted
      that the build was silent at `AURA_ONSET_UNITS - 1` — which moves with the constant, so setting
      the onset to zero left the suite completely green. That is
      `docs/decisions/0027-measure-the-picture-not-the-model.md`'s *a guard measuring a quantity
      defined in terms of the constant it guards proves only that the code agrees with itself*, caught
      by [0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md).

      ⚠️ **The window the report names is 15 to 30 seconds**, so that is what is held: silent through
      the fifteenth second, started by the thirtieth. At 36 units a second those are 540 and 1080, and
      neither is derived from the constant under test.
    */
    const at = (seconds: number): number => seconds * SCROLL_PER_STEP * STEPS_PER_SECOND;
    expect(auraBuild(0, bossAt), 'a level opens with the boss already audible').toBe(0);
    expect(auraBuild(at(15), bossAt), 'the build had already started fifteen seconds in').toBe(0);
    expect(auraBuild(at(30), bossAt), 'the build had still not started thirty seconds in').toBeGreaterThan(0);
    expect(auraBuild(bossAt, bossAt), 'the build does not reach its ceiling by the boss').toBeCloseTo(
      AURA_LEVEL_CEILING,
      5,
    );
    // It climbs the whole way rather than arriving early and sitting there.
    const third = auraBuild(AURA_ONSET_UNITS + (bossAt - AURA_ONSET_UNITS) / 3, bossAt);
    const twoThirds = auraBuild(AURA_ONSET_UNITS + (2 * (bossAt - AURA_ONSET_UNITS)) / 3, bossAt);
    expect(twoThirds, 'the build flattens out before the boss').toBeGreaterThan(third);
    /*
      ⚠️ **A level with no boss builds nothing** — `Number.POSITIVE_INFINITY` is what a fixture uses,
      and a fixture that quietly grew a rising aura would be measuring this decision in every other
      suite in the repository.
    */
    expect(auraBuild(9999, Number.POSITIVE_INFINITY), 'a level with no boss built dread anyway').toBe(0);
  });

  it('0107 — and the two claims on the aura are combined by a MAXIMUM, never a sum', () => {
    /*
      ⚠️ **A sum puts the aura past the headroom this file measures**, the moment a player closes on a
      boss at the end of a long level — which is every boss fight in the game. The build says *how far
      through this is* and the proximity says *how close that is*; the louder of the two is what the
      player is being told, and it can never exceed either ceiling.
    */
    expect(auraFor(0.55, 0.2), 'the build was thrown away when the boss was far').toBe(0.55);
    expect(auraFor(0.55, 0.9), 'the proximity was thrown away when the boss was close').toBe(0.9);
    expect(auraFor(0.55, 0.55), 'the two agreed and the answer moved anyway').toBe(0.55);
    // The property, over the whole range rather than at three points.
    for (let build = 0; build <= 1; build += 0.05) {
      for (let near = 0; near <= 1; near += 0.05) {
        const both = auraFor(build, near);
        expect(both, `the aura exceeded one of its inputs at ${build}, ${near}`).toBeLessThanOrEqual(
          Math.max(build, near) + 1e-9,
        );
        expect(both, `the aura fell below both of its inputs at ${build}, ${near}`).toBeGreaterThanOrEqual(
          Math.max(build, near) - 1e-9,
        );
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

  /*
    ── 0092's TWO, AND BOTH ARE WRITTEN IN THE GEOMETRY RATHER THAN IN THE CONSTANTS ───────────────

    `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`. Reported from play: *"the
    boss aura music was really weak, I didn't even notice it over the fire."*

    ⚠️ **Every assertion above this point stayed green through that**, and they were not asleep — they
    are 0091's and they hold 0091's shape: silent at `FAR`, full at `NEAR`, the near half carrying more
    of the build. All three are still true of a curve that had collapsed to nothing everywhere the
    fight actually happens. That is
    `docs/decisions/0027-measure-the-picture-not-the-model.md` exactly: a guard written in terms of the
    constant it guards proves the code agrees with itself.

    ⚠️ **So these two are driven off `BOSSES` and the player's box** — where a fight is flown — and
    neither can be satisfied by moving `AURA_FAR_UNITS` to meet it.
  */
  /** Where the ship may sit, in the camera's frame — the box a boss fight is flown inside. */
  const BOX_BACK = PLAYER_ALONG_MARGIN;
  /** The gap to a boss holding station, from a given place in the box. Hulls, not centres. */
  const gapFrom = (along: number, kind: (typeof BOSS_KINDS)[number]): number =>
    BOSSES[kind].station - along - BOSSES[kind].radius - SHIPS[SHIP_KINDS[0]!].radius;

  it('0092 — THE RANGE COVERS THE BOX, so *far away* is somewhere the player can actually be', () => {
    /*
      ⚠️ **`AURA_FAR_UNITS` was 105 and the widest gap the game can present is 123.5**, so the top
      fifth of the reachable span was already silent — and *silent* meant *backed all the way off, and
      a fair way less than that too*, which is not an edge the player can feel. It is the argument
      `AURA_NEAR_UNITS` already makes at the other end, arriving at the far one.
    */
    const widest = Math.max(...BOSS_KINDS.map((k) => gapFrom(BOX_BACK, k) + BOSSES[k].drift));
    expect(widest, 'no boss can be far away, so the range has nothing to measure').toBeGreaterThan(0);
    expect(
      AURA_FAR_UNITS,
      `the widest gap the game can present is ${widest.toFixed(1)} and the aura goes silent at ${AURA_FAR_UNITS}`,
    ).toBeGreaterThanOrEqual(widest);
  });

  it('0092 — THE DEFECT: a player who backs off to dodge is still inside the aura', () => {
    /*
      ⚠️ **THIS IS THE ONE THAT WOULD HAVE CAUGHT IT, and the reason it is written from the BACK of
      the box.** Mid-box the aura was already at its ceiling for all seven bosses under the old curve,
      so the report is not about the aggressive position — it is about the defensive one. A player
      being shot at retreats, and retreating is what turned the boss's own sound off:
      at the back of the box against level one's boss the old curve gave **0.004** of the ceiling.

      Held as a fraction of the ceiling rather than as a gain, because the ceiling is a taste and this
      is not: whatever the aura is mixed at, backing off must attenuate it and must not mute it.
    */
    for (const kind of BOSS_KINDS) {
      const gap = gapFrom(BOX_BACK, kind);
      const heard = auraNearness(gap);
      expect(
        heard,
        `${kind} at a gap of ${gap.toFixed(0)} — the back of the player's own box — is at ${heard.toFixed(3)} of its ceiling, which is off`,
      ).toBeGreaterThan(0.1);
    }
    // And it is still a build: pressing forward has to be audibly louder than sitting at the back.
    const front = auraNearness(gapFrom(PLAYER_LEAD, BOSS_KINDS[0]!));
    const back = auraNearness(gapFrom(BOX_BACK, BOSS_KINDS[0]!));
    expect(front, 'flying at the boss does not make it louder, so the aura is not a distance').toBeGreaterThan(
      back * 1.5,
    );
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
  it('0095 — every pattern spans EXACTLY its own layer, which is both a floor and a ceiling', () => {
    /*
      ── IT ONLY CHECKED THE CEILING, AND `npm run prove` FOUND THE FLOOR MISSING ──────────────────

      ⚠️ **It read *no notes past the end*, which is half a rule.** A pattern longer than its layer
      loses its tail silently; a pattern SHORTER leaves the rest of the layer empty, just as silently,
      and `renderVoice` does not repeat it. The probe truncated the chord progression to two of its
      four bars — the harmony gone for half of every cycle — and every guard in this file stayed
      green: the layer is not silent, its length is right, the ladder is intact and nothing clips.

      ⚠️ **The two halves became different failures when the lengths did.** While every layer was the
      same size, *shorter than the loop* was a thing you would notice writing the pattern. With 2-bar
      and 4-bar layers side by side, a 2-bar pattern in a 4-bar layer is the single most likely way to
      get this content wrong — which is exactly what `LAYER_BARS` introduced.

      Stated as equality, because `renderVoice` plays a pattern once: anything but exact is either a
      dropped tail or a silent remainder.
    */
    for (const layer of MUSIC_LAYERS) {
      for (const [i, voice] of MUSIC[layer].entries()) {
        const spans = voice.steps.length * (BEAT_SECONDS / voice.perBeat);
        expect(
          spans,
          `${layer} voice ${i} spans ${spans.toFixed(2)}s inside a ${secondsOfLayer(layer)}s layer — ` +
            (spans > secondsOfLayer(layer) ? 'its tail is silently dropped' : 'the rest of the layer is silence'),
        ).toBeCloseTo(secondsOfLayer(layer), 6);
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
