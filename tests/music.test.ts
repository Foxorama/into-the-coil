import { LEVELS, LEVEL_KINDS, type LevelKind } from '../src/content/levels.ts';
import { BANDS, bandEnergy, spectrum } from './spectrum.ts';
import { describe, expect, it } from 'vitest';

import {
  OWN_LAYERS,
  BAR_SECONDS,
  BEAT_SECONDS,
  LAYER_BARS,
  PHRASE_SECONDS,
  TITLE_ONLY,
  secondsOfLayer,
  MUSIC,
  MUSIC_DRIVE,
  MUSIC_GAIN,
  MUSIC_LADDER,
  MUSIC_ROOT,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  AURA_LAYERS,
  AURA_NEAR_UNITS,
  AURA_FAR_UNITS,
  AURA_ONSET_UNITS,
  RUNG_CLOSES,
  LAYER_PAN,
  PAN_LIMIT,
  type MusicLayer,
} from '../src/content/music.ts';
import {
  AURA_RAMP_SECONDS,
  RAMP_SECONDS,
  auraBuild,
  auraFor,
  auraNearness,
  auraNearnessFor,
  bakeLayer,
  levelWrites,
  panGains,
  musicLevelFor,
  BUILD_BARS,
  entryBars,
  nextBarFrom,
  placeArrivesAt,
  SCHEDULE_AHEAD,
} from '../src/app/music.ts';
import { auraCeilingOf, rungOf, THEME_KINDS } from '../src/content/themes.ts';
import { loopsAt } from './bakes.ts';
import { buildsOf } from './pace.ts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

/** The repository root, for the one guard here that reads a file rather than a value. */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
import { MUSIC_ROLES } from '../src/content/arrangement.ts';
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

  /*
    ⚠️ **EVERY TEST IN THIS FILE THAT BAKES CARRIES AN EXPLICIT TIMEOUT AND IT IS A MEASUREMENT, NOT A NUISANCE**
    — `docs/decisions/0113-there-is-one-composition-and-seven-levels.md`. The phrase went from eight
    bars to sixteen, so `bakeLoops` synthesises 201 seconds of audio where it used to do 99, and each
    of these calls it. Alone they take about 2.3s; under `vitest`'s parallel workers they reach 5.3s
    and the 5000ms default fired.

    ⚠️ **`docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` is why this is a
    comment rather than a rerun.** It says an intermittent guard has found something and *flaky* is
    not what it found — so it was established: the failure text is `Test timed out in 5000ms`, the
    same three tests pass under `--no-file-parallelism`, and the quantity each ASSERTS is unchanged.
    A slow test and a wrong one look identical from a red suite and are not the same thing.

    ⚠️ **The bake cost itself is guarded elsewhere and deliberately not here** — `tests/sound.test.ts`
    holds the longest single job and the resident megabytes, which are the numbers that would actually
    hurt a player. A timeout in a correctness test guards the CI machine, not the game.
  */
  it('and every layer bakes to exactly its own declared length', () => {
    const loops = loopsAt(SAMPLE_RATE);
    for (const layer of MUSIC_LAYERS) {
      expect(loops[layer].length, `${layer} is a different length from the loop it declares`).toBe(
        Math.round(secondsOfLayer(layer) * SAMPLE_RATE),
      );
    }
  }, 30_000);

  it('and none of them is silence, which is the way a layer can be missing without failing', () => {
    /*
      A layer that renders to zeros costs nothing, breaks nothing, and is simply never heard — so the
      ladder would still climb, the gains would still ramp, and one quarter of the music would be
      gone with every other guard green.
    */
    /*
      ⚠️ **THE FOUR OWN SLOTS ARE SKIPPED, AND HAVING NOTHING IS WHAT THEY ARE FOR** —
      `docs/decisions/0188-a-place-owns-four-slots.md`. Every other layer here is the base
      composition's version of something a place may re-voice; `ownA`–`ownD` have no base version at
      all, because **a slot with a default instrument is a slot with an identity** — which is the
      defect `node scripts/weigh-gesture.mjs` measures nine of the twenty-three sharing.

      ⚠️ **IT IS SAFE BECAUSE TWO OTHER THINGS HOLD, NOT BECAUSE IT IS PROMISED.** `MUSIC_LADDER`
      closes all four at every rung, so the base never sounds one; and `tests/themes.test.ts` refuses
      a place that OPENS one without stating its voices. The silence cannot reach a player.
    */
    const loops = loopsAt(SAMPLE_RATE);
    for (const layer of MUSIC_LAYERS) {
      if (OWN_LAYERS.includes(layer)) continue;
      let peak = 0;
      for (const s of loops[layer]) peak = Math.max(peak, Math.abs(s));
      expect(peak, `${layer} baked to silence`).toBeGreaterThan(0.01);
      expect(peak, `${layer} clips on its own, before the other three are added`).toBeLessThanOrEqual(1);
    }
  }, 30_000);

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
    const loops = loopsAt(SAMPLE_RATE);
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
  }, 30_000);

  it('and the four together stay inside full scale at the loudest level there is', () => {
    /*
      ⚠️ **Measured on the SUM rather than assumed from the parts**, because they are correlated: the
      kick and the bass land on the same beat by construction, so peaks add rather than averaging.
      This is the one number that decides whether a boss fight crunches.
    */
    const loops = loopsAt(SAMPLE_RATE);
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
  }, 30_000);
});


/*
  ── THE LADDER IS NO LONGER ONE SPAN, AND THAT IS 0113 AMENDING 0090 THE WAY 0095 DID ─────────────

  ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** Reported from play:
  *"the boss part just feels like part of the regular level music, not an escalation… there is no
  separate boss theme or dynamic climax."* That was ARITHMETIC rather than taste: 0090's ladder only
  ever opens layers, so the fight was necessarily the level plus whatever it added.

  ⚠️ **So the shape has three parts now, and every one of them is checked** — this is more structure
  than the single additive rule it replaces, not less:

    CLIMBING   run -> approach   the level's own piece — still the subject of the guards below.
    the seam   approach -> boss  a CHANGE OF PIECE. `LEVEL_ONLY` closes and the arrangement thins,
                                 on precisely 0095's argument for the title's seam.
    the fight  boss -> bossPeak  the climax, held by what an ear integrates rather than by a sum.

  ⚠️ **AND *STRICTLY UP ON EVERY AXIS* IS NO LONGER ASSERTED AS A SUM OF GAINS** — 0182. What made
  the two rows above a guard was that each totalled more than the one below it, and 0114 had already
  retired that proxy for the fight because the fight closes six layers and is louder anyway. The
  climax is held by the RMS guard, which integrates the way an ear does.

  ⚠️ **The TOP of the ladder is `bossPeak` and it used to be `boss`.** A guard that still reads
  `boss` as the loudest rung would now be measuring the sparse arrival and passing, which is the
  quiet way this change could have gone wrong.
*/
/** The level's own piece, which climbs additively. */
const CLIMBING = MUSIC_LEVELS.filter((l) => l !== 'calm' && l !== 'boss' && l !== 'bossPeak');
/** The loudest rung there is — named once, so a guard cannot go on believing it is `boss`. */
const TOP = MUSIC_LEVELS[MUSIC_LEVELS.length - 1]!;

describe('the ladder is additive, which is what the ask describes', () => {
  /**
   * ── THE REPORTED ONE, AND NOTHING IN THIS REPOSITORY HELD IT ────────────────────────────────────
   *
   * ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** *"It has no depth, no
   * intricacy, no variety"* was said about a level whose opening rung carried a kick, a clap, hand
   * percussion, a pad and a bass — **and no tune at all.** `arp`, `hook`, `lead` and `toll` were each
   * zero at `run`, for the first sixty seconds of every level.
   *
   * ⚠️ **`npm run prove` IS WHY THIS EXISTS.** 0113's own probe closed `call` at `run` and pointed at
   * *opens a layer at every step* — and that guard stayed GREEN, because `run` opens five other
   * layers and none of them is a melody. A probe that does not fire is the harness reporting a
   * MISSING guard rather than a broken break, which is
   * `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` doing the more valuable half of its job.
   *
   * ⚠️ **WRITTEN OVER A PROPERTY AND NEVER A NAME** —
   * `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`. A tune is a pitched voice that
   * moves, plays at least once a beat, and sits above the bass; a pad states one note a bar and the
   * bed sits underneath. Driven over the table that separates `arp`, `call`, `drive` and `lead` from
   * everything else without any of the four being mentioned — so a layer renamed, replaced or added
   * is measured on what it does.
   *
   * ⚠️ **`calm` is excluded and it is not an oversight.** The title, the level break and the run-over
   * screen are a bed on purpose (0095), and the play-test that produced this decision called that
   * piece *"a really nice music piece"*. What was wrong was a LEVEL sounding like one.
   */
  it('THE REPORTED ONE: every rung inside a level has a tune in it, not just a bed', () => {
    /** The lowest a melody may sit, in Hz — below this it is a bass line whatever else it does. */
    const MELODY_FLOOR = 150;
    /** How far a line must travel to be a line rather than a pulse, in semitones. */
    const MELODY_SPAN = 7;

    const melodic = (layer: MusicLayer): boolean =>
      MUSIC[layer].some((voice) => {
        if (!voice.pitched || voice.perBeat < 1) return false;
        const sounded = voice.steps.filter((s): s is number => s !== null && s !== undefined);
        if (sounded.length === 0) return false;
        const low = Math.min(...sounded);
        const high = Math.max(...sounded);
        return MUSIC_ROOT * Math.pow(2, voice.octave + low / 12) > MELODY_FLOOR && high - low >= MELODY_SPAN;
      });

    const tunes = MUSIC_LAYERS.filter(melodic);
    expect(tunes.length, 'no layer in the whole piece is a tune, so this guard is measuring nothing').toBeGreaterThan(0);

    for (const level of MUSIC_LEVELS) {
      if (level === 'calm') continue;
      const open = tunes.filter((layer) => MUSIC_LADDER[level][layer] > 0);
      expect(
        open.length,
        `${level} opens no tune at all — ${MUSIC_LAYERS.filter((l) => MUSIC_LADDER[level][l] > 0).join(', ')} is a bed`,
      ).toBeGreaterThan(0);
    }
  });

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

    const inLevel = CLIMBING;
    for (let i = 1; i < inLevel.length; i++) {
      const openBelow = level(inLevel[i - 1]!);
      const openHere = level(inLevel[i]!);
      /*
        ⚠️ **A COUNT OF OPEN LAYERS IS NO LONGER THE CLAIM** — 0123. It said a rung must be *fuller*
        than the one below, which is 0090's additive rule in a third costume: a rung that swaps two
        layers for two others fails it while being the clearest section change in the piece. What
        holds *the piece does not thin out* is the density FLOOR next to this — no rung is sparser
        than the level's opening — and what holds *a rung is a section* is the churn guard 0123 adds.

        ⚠️ **What is kept is that a rung is never EMPTIED**, which nothing else says.
      */
      expect(openHere.length, `${inLevel[i]} opens nothing at all`).toBeGreaterThan(0);
      /*
        ── A RUNG MAY CLOSE A LAYER NOW, AND ONLY ONE IT HAS DECLARED ────────────────────────────

        ⚠️ **`docs/decisions/0120-a-rung-may-close-a-layer.md`.** 0090's additive rule is gone: an
        additive ladder can only ever produce *the same thing with more on top*, which is exactly
        what *"the additions are subtle"* is a description of once eleven layers are playing.
        `docs/decisions/0114-the-fight-is-a-different-piece.md` named the replacement and did not
        have the rule to spend it.

        ⚠️ **What replaces it is MORE structure.** A closure must be named in `RUNG_CLOSES`, so a
        layer cannot go quiet because somebody typed a zero — the same reason `TITLE_ONLY` and
        `LEVEL_ONLY` are lists rather than permissions.
      */
      const closes = RUNG_CLOSES[inLevel[i]!] ?? [];
      for (const layer of openBelow) {
        if (closes.includes(layer)) continue;
        expect(MUSIC_LADDER[inLevel[i]!][layer], `${inLevel[i]} closed ${layer}, which ${inLevel[i - 1]} had open`).toBeGreaterThan(
          0,
        );
      }
      /*
        ⚠️ **AND EVERY DECLARED CLOSURE HAS TO ACTUALLY HAPPEN**, member by member — 0114's own
        formulation for `LEVEL_ONLY`. A name left in this list after the gain was put back is a rule
        that has stopped describing the music, which is the thing 0113 found seven decisions of.
      */
      for (const layer of closes) {
        expect(
          MUSIC_LADDER[inLevel[i - 1]!][layer],
          `${inLevel[i]} is declared to close ${layer} and ${inLevel[i - 1]} does not play it`,
        ).toBeGreaterThan(0);
        expect(MUSIC_LADDER[inLevel[i]!][layer], `${inLevel[i]} declares it closes ${layer} and does not`).toBe(0);
      }
      /*
        ⚠️ **AND A RUNG THAT CLOSES MUST STILL OPEN SOMETHING** — 0123 amending 0120. The rule was
        *more than it closes*, written the same day and on the same instinct as everything else this
        arc has had to unlearn: it makes a strip-back illegal, and a strip-back before the drop is
        what the genre this game names actually does. **A rung that only subtracts is still refused**;
        one that trades evenly is not.
      */
      const opened = openHere.filter((l) => MUSIC_LADDER[inLevel[i - 1]!][l] === 0);
      if (closes.length > 0) {
        expect(
          opened.length,
          `${inLevel[i]} closes ${closes.length} and opens nothing — a rung that only subtracts is not a section`,
        ).toBeGreaterThan(0);
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

  /*
    ── AND THE CLIMB OVER THE LADDER IS GONE TOO ─────────────────────────────────────────────────

    ⚠️ **`docs/decisions/0182-a-mix-number-has-no-band.md`.** *The level climbs to its own top* summed
    `MUSIC_LADDER`'s gains and required each rung of `CLIMBING` to total more than the one below, and
    the fight's peak to total more than its arrival. Its twin over the seven places went in the same
    diff, and the argument is in `tests/themes.test.ts` where that one stood: it is
    `docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md`'s deleted density guard counted in
    gain, and it had never been seen to fail.

    ⚠️ **ITS OWN HEADER HAD ALREADY CONCEDED THE HALF THAT MATTERED** — 0114 took the fight out of it
    because *"a sum of gains is a proxy for loudness that holds only while layers are added"*, and the
    fight now closes six harmonic layers and is audibly the loudest thing in the game while summing
    below `approach`. **The proxy was retired for one rung and kept for the rest**, and what it was a
    proxy for is measured directly by the RMS guard below and by 0171's build.
  */

});

describe('how far up the ladder a run is', () => {
  /**
   * Level one's boss, READ OFF THE LEVEL rather than restated.
   *
   * ⚠️ **It was `6350` written in, and it went stale twice in one session** —
   * `docs/decisions/0114-the-fight-is-a-different-piece.md`. Two rounds of level compression moved
   * every boss and this number followed neither, so the rung-duration assertion below was measuring
   * a level 78 seconds longer than any that exists. It reported `run` lasting 106 seconds while the
   * real answer was 48.
   *
   * ⚠️ **The comment on it said *"near enough — the rule is about a distance, not about a level"*, and
   * that was true of the rule and false of the assertion.** The span checks below convert a distance
   * to SECONDS, which is a fact about a level: how long a rung lasts depends entirely on where its
   * boss is. Derived here, it cannot drift again.
   */
  const BOSS_AT = LEVELS[LEVEL_KINDS[0]!]!.bossAt;

  /** Level one's own script, which is what the assertions about a single level ask with. */
  const ONE = LEVELS[LEVEL_KINDS[0]!]!.sections;

  /** World units a second, derived from the two constants that decide it rather than typed. */
  const PER_SECOND = SCROLL_PER_STEP * STEPS_PER_SECOND;

  it('is cruising while the boss is far away', () => {
    expect(musicLevelFor(0, false, ONE)).toBe('run');
    // ⚠️ 0102: `run` is the first minute rather than the whole level, so *far away* is measured
    // against where the second section opens. A script with one entry stays here for ever, which is
    // what `tests/world.ts`'s `NO_SECTIONS` relies on.
    expect(musicLevelFor(ONE[1]!.at - 1, false, ONE)).toBe('run');
    expect(musicLevelFor(9_999_999, false, [{ at: 0, section: 'run' }])).toBe('run');
  });

  it('0158 — and EVERY level says for itself where its sections open, in SECONDS', () => {
    /*
      `docs/decisions/0158-a-level-says-where-its-sections-open.md`. Reported: *"can we rearrange the
      four sections? or have them different per level as well? some levels kick right into a surge
      etc, if we have the exact same timing for each for each it's also going to be a limiter."*

      ⚠️ **THIS TABLE IS THE ONE THING IN THE SUITE THAT WOULD HAVE CAUGHT THE LANDING MOVING A
      SOUND.** The seed was `bossAt` minus three shared constants, and the whole claim of that PR was
      that no level's music changed — a claim nothing else here could have checked, because every
      other guard is about the ladder's shape rather than about where a level reaches it.

      ⚠️ **IT IS NOT A COPY OF `src/content/levels.ts`.** What is authored there is a DISTANCE; this
      is the second a player hears the change, which is the authored number pushed through `bossAt`,
      `SCROLL_PER_STEP` and `STEPS_PER_SECOND` and asked of `musicLevelFor` itself —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`. **Moving a boundary is meant to
      fail this**, and the number it prints is the number to paste back after a play-test has argued
      for it.
    */
    const OPENS_AT: Record<LevelKind, readonly (readonly [string, number])[]> = {
      approach: [['run', 0.0], ['push', 34.69], ['surge', 70.39], ['approach', 100.75]],
      descent: [['run', 0.0], ['push', 36.08], ['surge', 71.78], ['approach', 102.14]],
      coilward: [['run', 0.0], ['push', 34.69], ['surge', 70.39], ['approach', 100.75]],
      shoal: [['run', 0.0], ['push', 33.86], ['surge', 69.56], ['approach', 99.92]],
      batteries: [['run', 0.0], ['push', 33.86], ['surge', 69.56], ['approach', 99.92]],
      gauntlet: [['run', 0.0], ['push', 36.64], ['surge', 72.33], ['approach', 102.69]],
      // ⚠️ 0180 — driven on the desk. 39.97 → 20.67, and `push` and `surge` take what the opening
      // gave up. This is the number this guard printed, pasted back, which is what its note says to do.
      eye: [['run', 0.0], ['push', 20.67], ['surge', 65.56], ['approach', 110.72]],
    };

    for (const kind of LEVEL_KINDS) {
      const { sections } = LEVELS[kind]!;
      const expected = OPENS_AT[kind]!;
      expect(sections.length, `${kind} has ${sections.length} sections and the table names ${expected.length}`).toBe(
        expected.length,
      );
      sections.forEach((entry, i) => {
        const [name, second] = expected[i]!;
        expect(entry.section, `${kind} section ${i} is ${entry.section} and not ${name}`).toBe(name);
        expect(entry.at / PER_SECOND, `${kind}'s ${name} opens at a different second`).toBeCloseTo(second, 1);
        /*
          ⚠️ **ASKED OF `musicLevelFor` AND NOT OF THE TABLE**, which is what makes this a check of
          the lookup rather than of arithmetic this file did itself. On the unit the section opens
          the answer is that section; one unit earlier it is the one before — the `<=` boundary,
          held at both sides.
        */
        expect(musicLevelFor(entry.at, false, sections), `${kind} is not at ${name} where ${name} opens`).toBe(name);
        if (i > 0) {
          expect(
            musicLevelFor(entry.at - 1, false, sections),
            `${kind} reaches ${name} a unit early`,
          ).toBe(expected[i - 1]![0]);
        }
      });
    }
  });

  it('0161 — every section a level names is one the game reaches, and outlasts its own ramp', () => {
    /*
      `docs/decisions/0102-the-music-goes-somewhere.md`. Reported twice: *"the ingame background music
      doesn't change and increase in tempo as you progress through the level"*, then *"still flat and
      lifeless, has no depth, no pace, no increased tempo."*

      ⚠️ **`run` covered about 160 seconds of a 176-second level.** One arrangement, three layers, a
      four-bar loop — and every guard in this file was green over it, because they were all about the
      LADDER's shape and none of them about how much of a level any rung covers.

      ⚠️ **IT RUNS OVER ALL SEVEN LEVELS NOW, WHERE IT RAN OVER ONE** — 0158. The three distances
      were shared, so level one's spans were every level's spans and asking about one was asking
      about all; a script is per level, so this is seven independent questions. **It is the guard
      that catches a hand-authored four-second `push`** when the differences the ask is about start
      being written.

      ⚠️ **Asserted in SECONDS, which is the unit the report is in** —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`.

      ⚠️ **AND THE CAMERA IS WALKED RATHER THAN THE TABLE READ, WHICH A PROBE IS WHAT FOUND.** The
      first version of this computed each span from `entry.at` and `bossAt` and never asked
      `musicLevelFor` anything — so `node scripts/prove-guard.mjs 0102`, which collapses the walk so
      that a level never leaves the section it opens at, **left it green**. A guard about how long a
      level spends at a rung has to measure what the game answers, not what the content says: the
      table it was reading is the same table the assertion is about, which is precisely the shape
      0027 says proves only that the code agrees with itself.
    */
    for (const kind of LEVEL_KINDS) {
      const { sections, bossAt } = LEVELS[kind]!;
      /** Every stretch the GAME answers, walked a unit at a time from the level's start to its boss. */
      const walked: { section: string; from: number; to: number }[] = [];
      for (let units = 0; units < bossAt; units++) {
        const here = musicLevelFor(units, false, sections);
        const last = walked[walked.length - 1];
        if (last !== undefined && last.section === here) last.to = units;
        else walked.push({ section: here, from: units, to: units });
      }
      expect(
        walked.map((s) => s.section),
        `${kind} reaches ${walked.length} sections and its script names ${sections.length}`,
      ).toEqual(sections.map((e) => e.section));

      walked.forEach((stretch, i) => {
        const ends = i + 1 < walked.length ? walked[i + 1]!.from : bossAt;
        const seconds = (ends - stretch.from) / PER_SECOND;
        const where = `${kind}'s ${stretch.section}`;
        /*
          ── THE FLOOR IS ONE RAMP, AND THE CEILING IS GONE ──────────────────────────────────────

          ⚠️ **`docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md`.** This was *more than 10
          seconds and less than 90*. The floor was a hand's guess at *long enough to be a section*
          and the ceiling was a report from one round — *"the ingame background music doesn't
          change"* — promoted to a constraint on all seven levels for ever.

          ⚠️ **WHAT IS LEFT IS THE ONLY PART THAT IS ABOUT WHETHER SOUND WORKS.** A gain ramp takes
          `RAMP_SECONDS`; a section shorter than one is a section whose own arrival never finishes,
          so the player hears a wobble instead of a change. That is a floor under the MECHANISM and
          it constrains nothing about the music — 0138 derives the same bound for a dragged boundary
          and `docs/decisions/0117-a-section-change-lands-on-the-beat.md` is why.

          ⚠️ **AND THERE IS DELIBERATELY NO CEILING.** A level may hold one section for its whole
          length. Said 2026-08-17: *"if we lock it into a rule (which we have done already) then
          every level ends up sounding similar."*
        */
        expect(
          seconds,
          `${where} lasts ${seconds.toFixed(1)}s, which is shorter than the ramp that opens it`,
        ).toBeGreaterThan(RAMP_SECONDS);
      });
    }
  });

  it('0158 — and a script is ascending, opens at zero, and never names the fight', () => {
    /*
      ⚠️ **`musicLevelFor` BREAKS AT THE FIRST ENTRY THE CAMERA HAS NOT REACHED**, so an out-of-order
      script does not reorder a level's music — it HIDES a section, silently, with every readout on
      the dashboard still drawing the section the ladder no longer reaches. That is the failure
      `docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md` clamped a drag against,
      and it is now a property of authored content as well as of a drag.

      ⚠️ **AND OPENING AT `0` IS WHAT MAKES THE FALLBACK IN `musicLevelFor` UNREACHABLE.** That
      function has to answer something before it has read an entry; a level whose first section
      opened late would be answered by that line rather than by its own script.
    */
    for (const kind of LEVEL_KINDS) {
      const { sections, bossAt } = LEVELS[kind]!;
      expect(sections.length, `${kind} has no music script`).toBeGreaterThan(0);
      expect(sections[0]!.at, `${kind}'s music does not start where the level does`).toBe(0);
      for (let i = 1; i < sections.length; i++) {
        expect(sections[i]!.at, `${kind}'s script is not ascending at entry ${i}`).toBeGreaterThan(sections[i - 1]!.at);
      }
      expect(sections[sections.length - 1]!.at, `${kind}'s last section opens at or past its boss`).toBeLessThan(bossAt);
    }
  });

  it('and the last section is the one the boss interrupts, whatever length a level gives it', () => {
    /*
      ── THIS ASSERTED A LENGTH AND 0161 TOOK THE LENGTH OUT ─────────────────────────────────────

      ⚠️ **`docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md`.** It required the last
      section to last between **6 and 30 seconds** — which is *every level ends with a short build
      before its boss*, written as a test. Landed in the same PR as
      `docs/decisions/0158-a-level-says-where-its-sections-open.md`, whose own headline is that order,
      count and timing are free. **The guard took back what the decision granted.**

      ⚠️ **Said 2026-08-17, and it is the second time**: *"if we lock it into a rule (which we have
      done already) then every level ends up sounding similar."* A level may now open at its loudest
      and stay there, or spend two minutes arriving, or reach its boss with no build at all.

      ⚠️ **WHAT IS KEPT IS THE WIRING AND NOT THE TASTE.** The last entry of a script is the section
      the fight interrupts, and `musicLevelFor` has to answer it for every camera position from that
      entry to `bossAt` — otherwise a level's final stretch is answered by something other than its
      own script. That is a claim about the lookup, not about how long a build should be.
    */
    for (const kind of LEVEL_KINDS) {
      const { sections, bossAt } = LEVELS[kind]!;
      const last = sections[sections.length - 1]!;
      expect(musicLevelFor(last.at, false, sections), `${kind} does not reach its last section`).toBe(last.section);
      /*
        ⚠️ **Every unit of it, not just its first**, because *the last section runs to the boss* is the
        half a single sample cannot see: an off-by-one in the walk would show up here and nowhere else.
      */
      for (const at of [last.at, last.at + 1, Math.floor((last.at + bossAt) / 2), bossAt - 1, bossAt]) {
        expect(musicLevelFor(at, false, sections), `${kind} leaves its last section at ${at}`).toBe(last.section);
      }
    }
  });

  it('and goes to the boss the moment one is on the field, wherever the camera is', () => {
    /*
      ⚠️ **The boss level is keyed to the BOSS being there and not to a distance**, which is the half a
      threshold cannot do: a boss drifts (0061) and a fight lasts as long as it lasts, so the camera
      passes `bossAt` long before the fight is over.

      ⚠️ **AND THAT IS WHY `bossAt` IS NO LONGER AN ARGUMENT AT ALL** — 0158. The old signature took
      it to measure the sections back from it; the fight's two rungs never used it, and once the
      script anchored itself the parameter went unread.
    */
    expect(musicLevelFor(0, true, ONE)).toBe('boss');
    expect(musicLevelFor(BOSS_AT + 4000, true, ONE)).toBe('boss');
  });
});

/*
  ── THE 0094 RE-PHASE SUITE STOOD HERE AND 0160 RETIRED IT WITH ITS SUBJECT ────────────────────

  ⚠️ **docs/decisions/0160-the-music-free-runs.md.** Six tests over `rephaseIn` — the settling rule,
  the loop wrap, the boundary landing, the notice window. Every one of them was
  right about the function and the function is gone: it corrected the music towards the SIM's step
  clock, which docs/decisions/0159-the-two-clocks-come-apart.md stopped being a clock the music
  shares.

  ⚠️ **THREE OF 0094's SIX PROBES SURVIVE AND THEY ARE THE ONES ABOUT THE GUN** — `stepsToGrid` and
  the sim clock, which are gameplay and are untouched. The three about `rephaseIn` are retired in
  scripts/probes/0094-in-time-is-not-in-phase.mjs, on 0159's rule: a probe whose guard has been
  deleted cannot be re-anchored, only retired.
*/


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
  const baked = loopsAt(SAMPLE_RATE);
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

    ── 20 s → 60 s, AND `docs/decisions/0044` IS WHY IT IS WRITTEN DOWN RATHER THAN NUDGED ────────

    ⚠️ **IT WENT INTERMITTENT UNDER THE WHOLE SUITE AND PASSED THREE TIMES OUT OF THREE ALONE**, on a
    byte-identical tree — which `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`
    says is a finding rather than a flake, and names the two things it can be. **This is the second:
    a wall clock standing in for a quantity that is not time.** `mixAt` bakes the BASE composition
    and sums it against `MUSIC_LADDER`; every number in it is deterministic, so the assertion cannot
    disagree with itself. The only thing that varied is how long four workers took to get here.

    ⚠️ **AND THE TREE GOT MORE EXPENSIVE**, which is the honest half:
    `docs/decisions/0189-a-place-is-what-it-does-not-play.md` gave Saurian Belt a break in `ownB`
    and moved `perc`'s hand drum onto sixteenths, so the places other files bake cost more and this
    file's own budget was what gave way first. **It is 5.9 s alone against 20**, so the margin was
    never as wide as the number looked.

    ⚠️ **WIDENING IT DOES NOT WEAKEN WHAT IT PROVES**, and that distinction is the repository's own —
    `tests/sound.test.ts` made the identical argument when its bake-identity guard went 60 s → 120 s.
    **No part of this claim is about time**: the same samples, the same bands, the same comparison
    against the title. The limit exists so a hang fails rather than sits. If this ever approaches
    60 s something has genuinely slowed down, and the number must not move again to hide it.
  */
  const DSP_MS = 60_000;

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
    const fastest = Math.min(...SHIPS.proof.fireEvery.map((_unused, tier) => fireEveryAt(SHIPS.proof, tier)));
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
  }, 30_000);

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

  /*
    ── A DENSITY GUARD STOOD HERE AND 0161 DELETED IT, AFTER THREE RETREATS FROM ONE IDEA ────────

    docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md. It began as *every rung strikes more
    notes a bar than the one below* — a staircase. 0123 demoted it to a floor: no rung thinner than
    the opening, plus a boss at least 1.5x as busy. Both halves are still SHAPE:

      no rung thinner than the opening  ->  a level may only ever get denser
      the boss is 1.5x the opening      ->  every boss is loud, and none is sparse and menacing

    ⚠️ THE THREE RETREATS ARE THE FINDING. A guard walked back twice and still constraining the
    thing the player keeps asking to vary is not a guard being refined, it is a guard that should
    never have been a guard. Said 2026-08-17: *"if we lock it into a rule (which we have done
    already) then every level ends up sounding similar."*

    ⚠️ AND NOTHING REPLACES IT, WHICH IS THE POINT. A vacuous assertion in its place would be worse
    than deletion — docs/decisions/0005-a-guard-must-be-seen-to-fail.md. How busy a rung is remains
    worth READING, and reading is a script's job: scripts/weigh-*.mjs is where a measurement lives
    when it is not a promise about every level for ever.

    ⚠️ ITS OWN OPENING COMMENT WAS ALSO WRONG TWICE OVER by the time it went — *the tempo does not
    change and cannot* was 0093's, and 0159 and 0160 between them removed every reason it gave.
  */
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
      /*
        ⚠️ **PER PLACE SINCE 0183, AND THIS IS NOW THE BOUND ON WHAT A PLACE MAY STATE.** The ceiling
        was a constant and is `THEMES[place].aura`; the ratio is the same claim asked seven times,
        and it is the reason an aura of 1 is legal in the type and refused here. Today's spread is
        0.40 to 0.60 against a limit of about 0.63 — **stated rather than glossed**, because a place
        driven past it will fail here and the argument for a louder fight row gets made, which
        `docs/decisions/0162-a-place-has-its-own-ladder.md` already permits.
      */
      for (const theme of THEME_KINDS) {
        const levelPeak = rungOf(theme, 'approach', layer) * auraCeilingOf(theme);
        const fightPeak = rungOf(theme, 'boss', layer);
        expect(
          fightPeak / levelPeak,
          `${theme}'s ${layer} reaches ${levelPeak.toFixed(2)} on the level's own build and its fight tops ` +
            `out at ${fightPeak.toFixed(2)} — the boss arrives at a volume the level was already at`,
        ).toBeGreaterThan(1.8);
      }
    }
  });

  it('0183 — AND NO TWO PLACES CARRY THE SAME AMOUNT OF THE BOSS ON THE WAY IN', () => {
    /*
      ⚠️ **A MECHANISM NO DATA EXERCISES IS GUARDED BY NOTHING**, which is `rungIn`'s own header one
      table over. 0183 took `AURA_LEVEL_CEILING` off `src/content/music.ts` and gave every place its
      own; seven identical values would be the constant reached a longer way round, and every reader
      below could have gone on importing a number with all seven guards green.
    */
    const stated = THEME_KINDS.map((theme) => auraCeilingOf(theme));
    expect(new Set(stated).size, `the seven places state ${new Set(stated).size} distinct aura ceilings, so the field is a constant`).toBeGreaterThan(3);
    for (const theme of THEME_KINDS) {
      expect(auraCeilingOf(theme), `${theme} builds no aura at all before its boss`).toBeGreaterThan(0);
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
    /*
      ⚠️ **DRIVEN OVER ALL SEVEN PLACES SINCE 0183**, because the ceiling it climbs to is the place's
      own. One theme here would hold the shape for one place and say nothing about the other six.
    */
    for (const theme of THEME_KINDS) {
      expect(auraBuild(0, bossAt, theme), `${theme} opens with the boss already audible`).toBe(0);
      expect(auraBuild(at(15), bossAt, theme), `${theme}'s build had already started fifteen seconds in`).toBe(0);
      expect(
        auraBuild(at(30), bossAt, theme),
        `${theme}'s build had still not started thirty seconds in`,
      ).toBeGreaterThan(0);
      expect(auraBuild(bossAt, bossAt, theme), `${theme}'s build does not reach its ceiling by the boss`).toBeCloseTo(
        auraCeilingOf(theme),
        5,
      );
      // It climbs the whole way rather than arriving early and sitting there.
      const third = auraBuild(AURA_ONSET_UNITS + (bossAt - AURA_ONSET_UNITS) / 3, bossAt, theme);
      const twoThirds = auraBuild(AURA_ONSET_UNITS + (2 * (bossAt - AURA_ONSET_UNITS)) / 3, bossAt, theme);
      expect(twoThirds, `${theme}'s build flattens out before the boss`).toBeGreaterThan(third);
    }
    /*
      ⚠️ **A level with no boss builds nothing** — `Number.POSITIVE_INFINITY` is what a fixture uses,
      and a fixture that quietly grew a rising aura would be measuring this decision in every other
      suite in the repository.
    */
    expect(auraBuild(9999, Number.POSITIVE_INFINITY, 'approach'), 'a level with no boss built dread anyway').toBe(0);
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

  it('and every layer has something in it, unless it is a slot a place fills', () => {
    /*
      ⚠️ **THE FOUR OWN SLOTS ARE SKIPPED, AND HAVING NOTHING IS WHAT THEY ARE FOR** —
      `docs/decisions/0188-a-place-owns-four-slots.md`. Every other layer here is the base
      composition's version of something a place may re-voice; `ownA`–`ownD` have no base version at
      all, because **a slot with a default instrument is a slot with an identity** — which is the
      defect `node scripts/weigh-gesture.mjs` measures nine of the twenty-three sharing.

      ⚠️ **IT IS SAFE BECAUSE TWO OTHER THINGS HOLD, NOT BECAUSE IT IS PROMISED.** `MUSIC_LADDER`
      closes all four at every rung, so the base never sounds one; and `tests/themes.test.ts` refuses
      a place that OPENS one without stating its voices. The silence cannot reach a player.
    */
    for (const layer of MUSIC_LAYERS) {
      if (OWN_LAYERS.includes(layer)) {
        expect(MUSIC[layer].length, `${layer} is an own slot and the base states voices for it`).toBe(0);
        continue;
      }
      expect(MUSIC[layer].length, `${layer} has no voices`).toBeGreaterThan(0);
      const notes = MUSIC[layer].reduce((sum, v) => sum + v.steps.filter((s) => s !== null).length, 0);
      expect(notes, `${layer} is all rests`).toBeGreaterThan(0);
    }
  });
});

describe('0108 — the bed is felt, the hands are on it, and the boss arrives', () => {
  /*
    `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`. Four items of the ninth play-test:
    *"I want to feel the bass beats in my chest"*, *"can we get some percussion up in here to
    counterpoint it"*, *"the boss music isn't increasing proportionally"*, and — for the third round
    running — *"the metronome beats are still louder… every mix sounds the same."*
  */
  const baked = loopsAt(SAMPLE_RATE);
  const mixes = new Map<string, Float32Array>();

  /** One phrase at a rung, through the same shaper the bus runs. */
  function mixAt(level: (typeof MUSIC_LEVELS)[number]): Float32Array {
    const cached = mixes.get(level);
    if (cached !== undefined) return cached;
    const out = new Float32Array(Math.round(PHRASE_SECONDS * SAMPLE_RATE));
    for (let i = 0; i < out.length; i++) {
      let v = 0;
      for (const layer of MUSIC_LAYERS) v += baked[layer][i % baked[layer].length]! * MUSIC_LADDER[level][layer];
      out[i] = saturate(v * MUSIC_GAIN, MUSIC_DRIVE);
    }
    mixes.set(level, out);
    return out;
  }

  const rms = (s: Float32Array): number => {
    let sum = 0;
    for (const v of s) sum += v * v;
    return Math.sqrt(sum / s.length);
  };

  const DSP_MS = 30_000;
  const SUB = BANDS.findIndex(([, , name]) => name === 'sub');

  it('THE REPORTED ONE: the band a chest resolves is a real share of the mix, not a corner of it', () => {
    /*
      ⚠️ **THE FIRST DRAFT OF THIS GUARD MEASURED THE WRONG QUANTITY AND A PROBE IS WHAT SAID SO.**
      It asserted that the low end is SUSTAINED — the quietest eighth of a bar against the loudest —
      on the reasoning that a chest resolves pressure over time where an ear resolves attacks. The
      reasoning is fine and the measurement was useless: **the trough is 0.527 with the whole sub
      layer and 0.511 without it**, because an eighth is 0.2s and the kick's tail is 0.42, so every
      window contains a kick whatever else is happening. `npm run prove` reported WRONG TEST, which is
      `docs/decisions/0027-measure-the-picture-not-the-model.md`'s subject caught before it shipped
      rather than after seven reports. It is written down instead of quietly replaced, because the
      appealing wrong quantity is the part worth passing on.

      ⚠️ **WHAT SEPARATES IS THE SHARE, AND IT SEPARATES BY FIVE TIMES.** A-weighted, the `sub` band
      against the `hi` band is **0.34–0.46 across the level's rungs and 0.06–0.09 with the layer
      removed** — and 0.034 for the title, which is the piece nobody has ever said they could feel.
      A fifth is a floor with the whole of this decision's margin above it and a doubling of the
      shipped state below it.

      ⚠️ **A-WEIGHTED, WHICH MAKES IT A DEMANDING CLAIM RATHER THAN AN EASY ONE.** The curve is about
      thirty decibels down at 40 Hz (`tests/spectrum.ts`), so *a fifth of the `hi` band* after
      weighting is a great deal of energy before it. Unweighted this would be trivially true of any
      music at all, which is the defect `bandEnergy`'s own comment records.
    */
    const HI = BANDS.findIndex(([, , name]) => name === 'hi');
    for (const level of MUSIC_LEVELS) {
      if (level === 'calm') continue;
      const bands = bandEnergy(mixAt(level), SAMPLE_RATE);
      const share = bands[SUB]! / bands[HI]!;
      expect(
        share,
        `${level} puts ${(share * 100).toFixed(0)}% as much in the band a chest resolves as in the one an ear does — ` +
          'the bass is a corner of the mix rather than the floor of it',
      ).toBeGreaterThan(0.2);
    }
  }, DSP_MS);

  it('and a level carries MANY times the title’s sub, not merely more of it', () => {
    /*
      ⚠️ **0095's version of this asserted `> title` and a rounding satisfies it.** That was the right
      bound for its own subject — *a kick quieter than a pad is backwards* — and it is the wrong one
      for *I want to feel it*: a piece can clear it by a percent and be exactly the mix that was
      reported. Measured over the shaped bus at 41.6×, so eight is a floor with the whole of this
      decision's margin still in it.
    */
    const title = bandEnergy(mixAt('calm'), SAMPLE_RATE)[SUB]!;
    const level = bandEnergy(mixAt('run'), SAMPLE_RATE)[SUB]!;
    expect(
      level / title,
      `a level carries ${(level / title).toFixed(1)}× the title's sub, which is not a floor under it`,
    ).toBeGreaterThan(8);
  }, DSP_MS);

  it('THE METRONOME, in the layer that actually plays in a level', () => {
    /*
      ⚠️ **0102 WROTE THIS ASSERTION OVER `beat`, WHICH IS `TITLE_ONLY`, AND `engine` WAS A ROW OF
      ONES THE WHOLE TIME.** The report it answered was about the title screen, so the guard was aimed
      there and has been green ever since over drums that are identical in every bar of every level.
      *"Two beats back and forth"* is kick, clap, kick, clap at one weight, and no theme multiplier
      can make two identical bars into a phrase.

      ⚠️ **Held over every UNPITCHED layer a level opens, rather than over `engine` by name**, which is
      the mistake being repaired: a guard that names one layer goes on being green about the others.
    */
    /*
      ⚠️ **THE AURA IS EXEMPT AND THE REASON IS NOT *IT IS DIFFERENT***. Its two layers are the only
      ones in the piece whose gain is a runtime function — `src/app/music.ts` multiplies them by how
      far away the boss is and how far through the level the player has got
      (`docs/decisions/0091-the-boss-has-an-aura.md`, `docs/decisions/0107-a-level-is-a-place.md`) —
      so a pulse written at one weight in the table is **not** at one weight in the room. Every other
      layer's gain is fixed for the whole rung, which is what makes an unvarying pattern a metronome
      there and not here.
    */
    const inLevel = MUSIC_LAYERS.filter(
      (l) => MUSIC_LADDER.boss[l] > 0 && !AURA_LAYERS.includes(l) && MUSIC[l].some((v) => !v.pitched),
    );
    expect(inLevel.length, 'a level opens no drums at all, so this measured nothing').toBeGreaterThan(2);
    /*
      ⚠️ **PER VOICE RATHER THAN PER LAYER, WHICH IS STRICTLY STRONGER AND IS WHY IT MOVED.** 0102's
      version counted how many voices of a layer varied and wanted more than one — a rule a kit
      satisfies while one of its drums is still a machine, and a rule a single-voice layer cannot
      satisfy at all however it is written. What is true of every part in every genre is that a
      struck thing struck repeatedly is not struck identically.

      ⚠️ **Three strokes is where it starts.** Two are a pair and cannot have a shape; three can.
    */
    for (const layer of inLevel) {
      for (const [i, voice] of MUSIC[layer].entries()) {
        if (voice.pitched) continue;
        const struck = voice.steps.filter((s): s is number => s !== null);
        if (struck.length < 3) continue;
        expect(
          new Set(struck).size,
          `${layer} voice ${i} strikes ${struck.length} times at one weight, which is a click track`,
        ).toBeGreaterThan(1);
      }
    }
  });

  it('and a PITCHED note has a weight too, which half the piece never had', () => {
    /*
      ⚠️ **0102's velocity is an unpitched `steps` entry, so exactly half the music was out of its
      reach.** A pitched entry is a semitone; there was nowhere to put a weight. The arp's hundred and
      twenty-eight square notes, the groove's bass line, the chords' rolling sub and the gallop are
      each the same event repeated at a fixed interval, which is 0102's own definition of a metronome
      arriving in the half it could not see.

      ⚠️ **The bake, not the table** — the same lesson 0102's own accent guard records learning: its
      first version re-implemented the multiply and `npm run prove` reported STILL GREEN. `hook` is
      baked alone and its own sixteenths are compared, which is a path only `renderNote` is on.
    */
    /*
      ⚠️ **A STRIKE IS AN INCREMENT AND NOT A PEAK, AND THIS GUARD MEASURED THE PEAK** —
      `docs/decisions/0156-a-strike-is-an-increment.md`. It took the loudest sample of a forty
      millisecond window at two sixteenths and compared them, which is the right quantity only while
      a note has finished before the next one starts. `hook`'s ring went from about 12 ms to 110 ms
      against a sixteenth of 100, so **the window at sixteenth 2 contains sixteenth 0's tail** and
      its peak is a sum of two notes rather than the weight either was struck at. CI caught it: the
      probe flattened every accent to 1 and **the suite stayed green**.

      ⚠️ **Two things are measured differently now and BOTH were needed.** Subtracting what was
      already ringing recovers the strike; averaging it over the whole loop recovers it *accurately*,
      because two notes of the same pitch at different phases cancel by up to 15% one at a time. Over
      256 sixteenths the estimate lands within 0.024 of the table's own weights — see 0156's table.

      ⚠️ **AND IT IS ASSERTED AGAINST THE TABLE'S OWN NUMBER rather than against a threshold**, which
      is the half that makes it a measurement. `< 0.95` would have gone on passing at 0.85; what is
      required now is that the leaned-on sixteenth arrives at *the weight it was written at*.
    */
    const accented = MUSIC_LAYERS.filter((l) => MUSIC[l].some((v) => v.pitched && v.accents !== undefined));
    expect(accented.length, 'not one pitched voice in the whole piece is struck at more than one weight').toBeGreaterThan(3);

    const gallop = MUSIC.hook[0]!;
    expect(gallop.pitched, 'the hook is no longer the pitched gallop this is written against').toBe(true);
    const accents = gallop.accents ?? [];
    expect(accents[0], 'the hook’s downbeat is no longer its full stroke').toBe(1);
    expect(gallop.steps[0], 'the hook’s downbeat is a rest, so there is nothing to measure against').not.toBe(null);
    const leaned = accents.map((weight, slot) => ({ weight, slot })).filter(({ weight }) => weight < 1);
    expect(leaned.length, 'the hook’s gallop leans on nothing, so every note is one weight again').toBeGreaterThan(0);

    const buffer = bakeLayer('hook', SAMPLE_RATE);
    const step = BEAT_SECONDS / gallop.perBeat;
    /** The loudest sample in `samples` beginning at `from`. */
    const peakIn = (from: number, samples: number): number => {
      let peak = 0;
      for (let s = Math.max(0, from); s < from + samples && s < buffer.length; s++) {
        peak = Math.max(peak, Math.abs(buffer[s]!));
      }
      return peak;
    };
    /** 40 ms is past the 2 ms attack and short of the next sixteenth; 8 ms is a cycle of the ring. */
    const STRIKE = Math.round(0.04 * SAMPLE_RATE);
    const RINGING = Math.round(0.008 * SAMPLE_RATE);
    /** What the note at sixteenth `i` ADDED, over whatever was still sounding when it landed. */
    const riseAt = (i: number): number => {
      const at = Math.round(i * step * SAMPLE_RATE);
      return peakIn(at, STRIKE) - peakIn(at - RINGING, RINGING);
    };
    const rise = accents.map(() => ({ total: 0, struck: 0 }));
    gallop.steps.forEach((semitone, i) => {
      if (semitone === null) return;
      const slot = rise[i % accents.length]!;
      slot.total += riseAt(i);
      slot.struck += 1;
    });
    const mean = (slot: number): number => {
      const at = rise[slot]!;
      return at.struck === 0 ? 0 : at.total / at.struck;
    };
    const full = mean(0);
    expect(full, 'the hook baked to silence, so this measured nothing').toBeGreaterThan(0);
    for (const { weight, slot } of leaned) {
      if (rise[slot]!.struck === 0) continue;
      const measured = mean(slot) / full;
      expect(
        Math.abs(measured - weight),
        `sixteenth ${slot} is struck at ${measured.toFixed(3)} of the downbeat over ${rise[slot]!.struck} strokes, against ${weight} in the table`,
      ).toBeLessThan(0.1);
    }
  }, 30_000);

  it('THE COUNTERPOINT: something a level opens does not divide the beat the way the drums do', () => {
    /*
      ⚠️ **Asked for as *"percussion to counterpoint"*, and the difference between drums and percussion
      is exactly this.** `beat`, `engine`, `drive` and `stomp` divide the bar into quarters, eighths
      and sixteenths — however many of them play at once, there is one grid underneath. A part that
      divides it by three is at odds with all of them at once, and that is what makes a bar feel
      turned rather than counted.

      ⚠️ **Held as a property of the OPEN set at a level's first rung**, because the ask is about the
      bed rather than about the boss — and the day a different layer carries the triplets it passes.

      ⚠️ **It does not touch the SIM's grid and could not.** 0093 fixes a beat at 24 sim steps and
      0096 snaps every cadence to a sixteenth of it; a triplet inside a baked loop is a subdivision of
      the same beat, and nothing in the game fires on one. `tests/spawns.test.ts` is what would notice
      if that stopped being true.
    */
    const open = MUSIC_LAYERS.filter((l) => MUSIC_LADDER.run[l] > 0);
    const against = open.filter((l) => MUSIC[l].some((v) => v.perBeat % 2 !== 0 && v.perBeat > 1));
    expect(
      against.length,
      `every voice a level opens divides the beat by a power of two (${open.join(', ')}) — there is no counterpoint, only more drums`,
    ).toBeGreaterThan(0);
  });

  it('THE BOSS ARRIVES: it opens more than one new thing, and it is louder in the unit an ear integrates', () => {
    /*
      ⚠️ **Reported as *"the boss music isn't increasing proportionally"*, and it is 0107's success
      producing the complaint.** That decision gave the level four rungs to climb; the fight's rung
      gained `lead` and about five percent on eight gains. A ladder whose last step is its smallest is
      not a ladder that arrives.

      ⚠️ **TWO CLAIMS, BECAUSE EITHER ALONE IS SATISFIABLE BY THE STATE BEING FIXED.** One new layer
      at a nudge in gain passes a *something is added* test; a rung merely turned up passes a loudness
      test. What an arrival is, is both.

      ⚠️ **The loudness half is RMS over a phrase and NOT the sum of the table's gains**, which is the
      quantity 0104's guard already found wanting: the shaper on the bus compresses a louder rung
      towards the one below it, so a boss that is +4 dB in the table can be +1 dB in the room. This is
      measured after the shaper, which is where the player is.
    */
    const openAt = (level: (typeof MUSIC_LEVELS)[number]): MusicLayer[] =>
      MUSIC_LAYERS.filter((l) => MUSIC_LADDER[level][l] > 0);
    const arriving = openAt('boss').filter((l) => MUSIC_LADDER.approach[l] === 0);
    expect(
      arriving.length,
      `the boss opens ${arriving.length} thing(s) the approach did not (${arriving.join(', ') || 'none'})`,
    ).toBeGreaterThan(1);

    const over = 20 * Math.log10(rms(mixAt(TOP)) / rms(mixAt('run')));
    expect(
      over,
      `the fight is ${over.toFixed(1)}dB over the opening of the level, measured after the bus shaper`,
    ).toBeGreaterThan(1.5);
  }, DSP_MS);

  it('and the shaper has not flattened the ladder it is meant to make room for', () => {
    /*
      ⚠️ **THE OTHER DIRECTION, AND `MUSIC_DRIVE` IS THE LEVER THAT WOULD DO IT.** `saturate` cannot
      return past 1 whatever it is handed, so the clipping guards stay green over a bus driven until
      every rung is one level — 0104 wrote a probe for exactly that and pointed it at the peak. This
      is the assertion that probe wanted: **every rung is measurably louder than the one below it**,
      in RMS, after the shaper.
    */
    const inLevel = CLIMBING;
    for (let i = 1; i < inLevel.length; i++) {
      const here = rms(mixAt(inLevel[i]!));
      const below = rms(mixAt(inLevel[i - 1]!));
      expect(
        here / below,
        `${inLevel[i]} is ${(20 * Math.log10(here / below)).toFixed(2)}dB over ${inLevel[i - 1]} — the shaper has eaten the climb`,
      ).toBeGreaterThan(1.02);
    }
  }, DSP_MS);
});

/**
 * A SECTION CHANGE LANDS ON THE BEAT — `docs/decisions/0117-a-section-change-lands-on-the-beat.md`.
 *
 * ⚠️ **`docs/decisions/0116-the-rig-plays-the-level.md` MEASURED THE DEFECT AND DELIBERATELY LEFT
 * IT.** Twenty-seven of the game's twenty-eight rung changes land mid-bar, because the ramp began at
 * `ctx.currentTime` — the instant a frame noticed a camera had crossed a distance. A change heard
 * away from the beat is not heard as a change; it reads as the mix wobbling, which is
 * [0114](../docs/decisions/0114-the-fight-is-a-different-piece.md)'s *"only a very subtle difference
 * between push and surge"*, reported twice and answered twice with a gain.
 */
describe('0117 — a section change lands on a downbeat, and not one ever has', () => {
  const anchor = 12.345;

  it('THE GRID: the next bar is on the music’s own clock, never on the wall', () => {
    /*
      ⚠️ **Driven over a whole phrase at a resolution finer than a step**, rather than at three
      hand-picked instants. The property is *every* instant, and a hand picks the ones it thought of.
    */
    for (let t = 0; t < PHRASE_SECONDS; t += 1 / 240) {
      const now = anchor + t;
      const bar = nextBarFrom(anchor, now);
      const bars = (bar - anchor) / BAR_SECONDS;
      expect(
        Math.abs(bars - Math.round(bars)) < 1e-9,
        `at ${t.toFixed(3)}s the ramp would start ${bars.toFixed(4)} bars in, which is not a bar line`,
      ).toBe(true);
      expect(bar, `the ramp would start ${(now - bar).toFixed(3)}s in the past`).toBeGreaterThanOrEqual(now - 1e-9);
      expect(
        bar - now,
        `a change would wait ${(bar - now).toFixed(2)}s, which is longer than the bar it is waiting for`,
      ).toBeLessThan(BAR_SECONDS + 1e-9);
    }
  });

  it('0135 — A PLACE ARRIVES WITHIN A BAR, and it used to be within a PHRASE', () => {
    /*
      `docs/decisions/0135-a-place-arrives-when-you-do.md`. Reported of the first level that ever
      played its own music: *"the start of level 2 sounded a bit like the default start, it should
      immediately pick into the new thematic track."*

      ⚠️ **THE NUMBER IS 25.6 SECONDS AGAINST 1.6.** 0128 swapped a place's loops at the next PHRASE,
      and a level opens deliberately empty (0043) — so the whole of a new level's first quiet stretch
      could be the PREVIOUS place's music. The player heard exactly that, on the first build where a
      place had its own music to arrive with.

      ⚠️ **Asserted in SECONDS, which is the unit the report is in** —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`. *The next bar* is the model talking
      to itself; *how long am I still hearing the last level* is what a player experiences.
    */
    const spread = [0, 0.01, 0.4, 0.79, 0.8, 1.59, 3.2, 12.7, 25.5, 41.3];
    for (const offset of spread) {
      const now = anchor + offset;
      const when = placeArrivesAt(anchor, now, SCHEDULE_AHEAD);
      expect(
        when - now,
        `a place ${offset}s into the phrase waits ${(when - now).toFixed(2)}s, which is longer than a bar`,
      ).toBeLessThanOrEqual(BAR_SECONDS + SCHEDULE_AHEAD + 1e-9);
      /*
        ⚠️ **And it is still ON a bar, which is the half 0117 owns.** The fix for a slow arrival must
        not be an arrival that lands mid-bar — that would be trading this decision's defect for the
        one 0117 exists for.
      */
      const bars = (when - anchor) / BAR_SECONDS;
      expect(Math.abs(bars - Math.round(bars)) < 1e-9, `a place arrived at bar ${bars.toFixed(3)}`).toBe(true);
      // Far enough ahead to actually be scheduled — a bar two milliseconds away cannot be started on.
      expect(when, 'a place was scheduled too close to now to start').toBeGreaterThanOrEqual(now + SCHEDULE_AHEAD);
    }
  });

  it('and before the loops have started, the first bar is the first bar', () => {
    // `start()` schedules the set a moment ahead, so `now` is legitimately behind the anchor.
    expect(nextBarFrom(anchor, anchor - 0.05)).toBe(anchor);
    expect(nextBarFrom(anchor, anchor)).toBe(anchor);
  });

  it('THE REPORTED ONE: every layer that carries the arrangement moves on a bar line', () => {
    /*
      ⚠️ **This is the assertion that would have been red for the whole life of the project.** Over
      every rung, every theme and a spread of instants, a non-aura ramp must begin on the grid.
    */
    for (const level of MUSIC_LEVELS) {
      for (const theme of THEME_KINDS) {
        for (let t = 0; t < BAR_SECONDS * 3; t += 0.037) {
          const now = anchor + t;
          for (const w of levelWrites(level, theme, 0.5, anchor, now, {})) {
            if (AURA_LAYERS.includes(w.layer)) continue;
            const bars = (w.at - anchor) / BAR_SECONDS;
            expect(
              Math.abs(bars - Math.round(bars)) < 1e-9,
              `${w.layer} at ${level}/${theme} ramps from ${bars.toFixed(3)} bars, which is mid-bar`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it('AND THE AURA IS NOT QUANTISED, because it is tracking something the player steers', () => {
    /*
      ⚠️ **0091, and the reason its ramp is already a quarter of a level change's.** A dread that
      arrived on the next downbeat would be reporting where the player WAS. Quantising it would look
      like consistency and would be the defect this decision is named for, applied to the one layer
      that must not have it.
    */
    const now = anchor + 0.37;
    const writes = levelWrites('boss', 'approach', 0.5, anchor, now, {});
    const auras = writes.filter((w) => AURA_LAYERS.includes(w.layer));
    expect(auras.length, 'the fight opened no aura at all, so this asserts nothing').toBeGreaterThan(0);
    for (const w of auras) {
      expect(w.at, `${w.layer} was quantised — it must follow the boss, not the bar`).toBe(now);
      expect(w.tau, `${w.layer} ramps at a level change's rate`).toBeCloseTo(AURA_RAMP_SECONDS / 3, 12);
    }
    for (const w of writes.filter((x) => !AURA_LAYERS.includes(x.layer))) {
      expect(w.tau, `${w.layer} does not ramp at a level change's rate`).toBeCloseTo(RAMP_SECONDS / 3, 12);
    }
  });

  it('THE STAIR-STEP: a layer whose destination has not moved is not rewritten', () => {
    /*
      ⚠️ **THE HALF THAT MAKES THE QUANTISING WORK AT ALL, AND IT IS NOT A SAVING.** `setLevel` runs
      every frame. Re-scheduling a ramp that is halfway through holds it at its current value until
      the NEXT bar and then resumes, so a build that should be one smooth move becomes a staircase in
      bar-sized steps — audibly worse than the defect being fixed.
    */
    const held: Partial<Record<MusicLayer, number>> = {};
    for (const w of levelWrites('run', 'approach', 0, anchor, anchor + 0.1, held)) held[w.layer] = w.target;
    const again = levelWrites('run', 'approach', 0, anchor, anchor + 0.9, held);
    expect(
      again.filter((w) => !AURA_LAYERS.includes(w.layer)),
      'a layer was rewritten with the rung unchanged, which stalls a ramp in progress',
    ).toEqual([]);
    // And a real change still writes.
    const moved = levelWrites('push', 'approach', 0, anchor, anchor + 0.9, held);
    expect(
      moved.filter((w) => !AURA_LAYERS.includes(w.layer)).length,
      'the rung changed and nothing moved',
    ).toBeGreaterThan(0);
  });

  it('and the ramp is exactly one bar, so a change arrives before the next downbeat', () => {
    /*
      ⚠️ **`RAMP_SECONDS` is 1.6 and a bar is 1.6, which was a coincidence until this decision and is
      now load-bearing.** `setTargetAtTime` is within 5% of its target after three time constants, and
      the tau is a third of the ramp — so a change that starts on a downbeat has arrived by the next
      one. A ramp longer than its bar would still be moving when the following bar landed.
    */
    expect(RAMP_SECONDS, 'a rung change no longer completes inside the bar it starts on').toBeLessThanOrEqual(
      BAR_SECONDS + 1e-9,
    );
  });
});

/**
 * THE MIX HAS A WIDTH — `docs/decisions/0118-the-mix-has-a-width.md`.
 *
 * ⚠️ **Reported from play**: *"it's currently playing over the top of the music so it's drowning out
 * some of the subtler other melody parts"*, and of the rungs above `push`, *"less noticeable because
 * the ongoing beat and melody is strong and the additions are subtle."* **Both are masking**, and a
 * mono mix has nothing but level to separate two sounds in one band — which is why the answer has
 * been a gain six rounds running.
 */
describe('0118 — the mix has a width, and the low end does not use it', () => {
  /** Baking and analysing every layer is real DSP, on the terms the shed test states. */
  const DSP_MS = 30_000;

  it('THE ONE THAT IS A MEASUREMENT AND NOT A TASTE: a layer whose weight is low is centred', () => {
    /*
      ⚠️ **DRIVEN OFF THE BAKED AUDIO, so it survives a layer being re-voiced.** A typed list of names
      would go on passing the day `hook` was dropped an octave — and this is the guard standing
      between the mix and a panned bass, which spends headroom on one side and arrives in a room as
      the same non-directional thump anyway.
    */
    const SUB = BANDS.findIndex((b) => b[2] === 'sub');
    const LOW = BANDS.findIndex((b) => b[2] === 'low');
    const heavy: string[] = [];
    for (const layer of MUSIC_LAYERS) {
      const bands = bandEnergy(bakeLayer(layer, SAMPLE_RATE), SAMPLE_RATE);
      const total = bands.reduce((a, b) => a + b, 0);
      if (total <= 0) continue;
      const bottom = (bands[SUB]! + bands[LOW]!) / total;
      if (bottom < 0.4) continue;
      heavy.push(layer);
      expect(
        Math.abs(LAYER_PAN[layer]),
        `${layer} carries ${(bottom * 100).toFixed(0)}% of its energy below 130Hz and sits at ` +
          `${LAYER_PAN[layer]} — a panned low end spends headroom on one side and is not heard as placed`,
      ).toBe(0);
    }
    expect(heavy.length, 'no layer measured as low-heavy, so this asserted nothing').toBeGreaterThan(0);
  }, DSP_MS);

  it('and nothing is hard panned, because a player may have one earbud in', () => {
    /*
      ⚠️ **`docs/decisions/0024-the-accessibility-floor-is-settings.md` bans a channel carrying
      information alone and music is not information** — but a layer at ±1 is a layer somebody simply
      does not have, and *"there is one game and it is the loud one"* is not served by a mix missing a
      part depending on how you are listening.
    */
    for (const layer of MUSIC_LAYERS) {
      expect(
        Math.abs(LAYER_PAN[layer]),
        `${layer} sits at ${LAYER_PAN[layer]}, past the ${PAN_LIMIT} that keeps every layer in both ears`,
      ).toBeLessThanOrEqual(PAN_LIMIT + 1e-9);
    }
  });

  it('THE POINT OF IT: the field is actually used, and the two sides are balanced', () => {
    /*
      ⚠️ **A table of zeros would pass every assertion above and buy nothing**, which is the shape of
      guard this project keeps finding — one that holds a bound nobody is near. What 0118 is FOR is
      that layers in the same band are in different places.
    */
    const placed = MUSIC_LAYERS.filter((l) => LAYER_PAN[l] !== 0);
    expect(placed.length, 'every layer is centred, so the mix is still mono in everything but name').toBeGreaterThan(
      MUSIC_LAYERS.length / 3,
    );
    /*
      ⚠️ **And it leans neither way.** A field whose every layer is right of centre is not a field, it
      is an error — and it would be inaudible as one on a phone speaker.
    */
    const lean = MUSIC_LAYERS.reduce((sum, l) => sum + LAYER_PAN[l], 0);
    expect(Math.abs(lean), `the mix leans ${lean.toFixed(2)} to one side`).toBeLessThan(0.6);
  });

  it('0209 — every rig render that carries the music is written in stereo', () => {
    /*
      ⚠️ **THE LAW ABOVE WAS GUARDED AND THE INSTRUMENT THREW IT AWAY ANYWAY.** `panGains` is held to
      equal power across the whole sweep, `LAYER_PAN` is held not to lean — and four of the five modes
      in `scripts/hear.mjs` summed the layers to ONE number before writing. Every guard about the
      width was green while the only files a person can actually listen to were mono.

      ⚠️ **INCLUDING `--play`, WHOSE ENTIRE PURPOSE IS THE TWO CHANNELS TOGETHER.** Its own header
      says it exists because *"the game sound effects don't blend in with the music at all"* — a claim
      about music and cues in the same air — and it rendered both folded to the middle, which is the
      one arrangement in which everything maximally collides. Four mix passes were judged on it.

      `docs/decisions/0027-measure-the-picture-not-the-model.md`: a guard on the model is not a guard
      on the instrument, and this repository has now found that inside `hear.mjs` three times — the
      missing bus shaper, the two reference levels, and the width.

      ⚠️ **THE CUE CATALOGUE IS THE ONE DELIBERATE MONO.** `--out=cues.wav` plays each cue alone to
      say what it IS; position is not part of a timbre and nothing is competing with it there. Named
      rather than exempted by accident.
    */
    const src = readFileSync(resolve(root, 'scripts/hear.mjs'), 'utf8');
    const writes = [...src.matchAll(/writeFileSync\([^\n]*wavOf\(([^\n]*)\)\);/g)].map((m) => m[1]!);
    expect(writes.length, 'no renders found — the scan is reading the wrong file').toBeGreaterThan(5);
    const mono = writes.filter((w) => !/,\s*2\s*$/.test(w.trim()));
    expect(
      mono.length,
      `these renders are still mono: ${mono.join(' | ')} — the music is panned and a mono file cannot ` +
        'show it, which is what 0209 was written for',
    ).toBe(1);
  });

  it('THE LAW: a layer does not get quieter as it crosses the middle', () => {
    /*
      ⚠️ **EQUAL POWER, NOT EQUAL AMPLITUDE, AND THE RIG IS WHY THIS IS A FUNCTION AT ALL.** The game's
      field is made by a browser node; `scripts/hear.mjs` has to render the same one, and the only
      alternative was the rig keeping its own idea of a pan law — the drift
      `docs/decisions/0116-the-rig-plays-the-level.md` is named for, in a fourth place.

      ⚠️ **An equal-amplitude law is 3 dB down in the centre**, which would read as the mix dipping
      wherever a layer sits near zero — and `LAYER_PAN` puts seven layers exactly there.
    */
    for (let p = -1; p <= 1; p += 1 / 64) {
      const { left, right } = panGains(p);
      expect(
        left * left + right * right,
        `a layer at ${p.toFixed(2)} is ${(10 * Math.log10(left * left + right * right)).toFixed(2)}dB off full power`,
      ).toBeCloseTo(1, 9);
    }
    // Centre is both sides equally; the ends are one side, and neither end is silent on the other.
    const middle = panGains(0);
    expect(middle.left).toBeCloseTo(middle.right, 12);
    expect(panGains(-1).left).toBeCloseTo(1, 9);
    expect(panGains(1).left).toBeCloseTo(0, 9);
  });

  it('and the two layers most likely to mask each other are not in the same place', () => {
    /*
      ⚠️ **THE REPORTED DEFECT, STATED AS A PROPERTY.** `arp` and `hook` are the sixteenths and the
      riff — the two things `push` and `surge` open, and the two the report calls *subtle*. In one
      place they compete on level alone; a third of the field apart they are two parts.
    */
    for (const [a, b] of [
      ['arp', 'hook'],
      ['call', 'lead'],
      ['counter', 'lead'],
      ['ride', 'perc'],
    ] as const) {
      expect(
        Math.abs(LAYER_PAN[a] - LAYER_PAN[b]),
        `${a} and ${b} sit at the same place, so nothing but level separates them`,
      ).toBeGreaterThan(0.3);
    }
  });
});

/**
 * THE KICK GOES UNDER THE MUSIC — `docs/decisions/0122-the-kick-goes-under-the-music.md`.
 *
 * ⚠️ **Reported from play, with the layer NAMED by the player off a solo render**: *"the bass beat,
 * the do do do do do do recurring beat, is probably too loud and not bassy enough still. It needs a
 * deeper bass, but needs to play below the melody of the music to support and uplift it, and it's
 * currently playing over the top of the music so it's drowning out some of the subtler other melody
 * parts."* — and *"I don't think I've even heard `groove` in game."*
 *
 * ⚠️ **THAT IS ONE MECHANISM, NOT TWO COMPLAINTS.** The kick swept from 160 Hz, which is inside the
 * 130–300 band `chords` and `groove` occupy — so *not bassy enough* and *drowning out the melody* were
 * the same number. [0113](../docs/decisions/0113-there-is-one-composition-and-seven-levels.md)'s solo
 * rig is what let the player name it instead of it being guessed at for a fourth time.
 */
describe('0122 — the kick is under the music rather than in front of it', () => {
  const DSP_MS = 30_000;

  it('THE REPORTED ONE: the kick does not sit in the band the harmony occupies', () => {
    /*
      ⚠️ **A SHARE OF ITS OWN ENERGY, so it is about where the kick IS rather than how loud it is.** A
      bound on gain would have been the other lever and it fights
      [0108](../docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md): `engine` is the sub band's
      main source, so turning it down takes the floor out from under the mix — measured, and it is why
      this decision changed the spectrum and left the gain alone.
    */
    const bands = bandEnergy(bakeLayer('engine', SAMPLE_RATE), SAMPLE_RATE);
    const total = bands.reduce((a, b) => a + b, 0);
    const lowmid = bands[BANDS.findIndex(([, , n]) => n === 'lowmid')]! / total;
    expect(
      lowmid,
      `the kick puts ${(lowmid * 100).toFixed(0)}% of itself in 130–300Hz, which is where the chords and ` +
        'the bass line live — it is in front of the music rather than under it',
    ).toBeLessThan(0.25);
  }, DSP_MS);

  it('and it reaches deeper than the harmony it sits under', () => {
    /*
      ⚠️ **THE OTHER HALF OF *"needs a deeper bass"*, and it is a comparison rather than a number.** A
      kick whose lowest reach is above the bass line's is not a floor, it is another middle voice.
      Driven off both layers, so re-voicing either moves it.
    */
    const lowest = (layer: 'engine' | 'groove'): number => {
      const bands = bandEnergy(bakeLayer(layer, SAMPLE_RATE), SAMPLE_RATE);
      const total = bands.reduce((a, b) => a + b, 0);
      return bands[BANDS.findIndex(([, , n]) => n === 'sub')]! / total;
    };
    expect(
      lowest('engine'),
      'the kick carries less of itself below 60Hz than the bass line does — it is not the floor',
    ).toBeGreaterThan(lowest('groove'));
  }, DSP_MS);

  it('AND THE FLOOR IS STILL THE SUB LAYER, not the kick’s tail', () => {
    /*
      ── THE GUARD THIS DECISION BROKE, REPLACED BY ONE THAT MEASURES THE CLAIM ──────────────────

      ⚠️ **0108's probe closes `sub` at a level's opening rung and expects *"a level carries MANY times
      the title's sub"* to go red. After this decision it did not** — `npm run prove` reported WRONG
      TEST — because a deeper kick supplies enough of the sub band on its own to clear a ratio against
      the title. **The probe's own words are what happened**: *"the floor is back to being a kick's
      tail."*

      ⚠️ **A RATIO AGAINST THE TITLE STOPPED TRACKING ITS SUBJECT**, which
      [0114](../docs/decisions/0114-the-fight-is-a-different-piece.md) says is worse than no guard
      because it still passes. What the claim has always been is *the level has a FLOOR*, and a floor
      is sustained where a kick's tail is a thump — the difference between support and pumping.

      ⚠️ **So it is attributed rather than totalled.** `sub` must be the largest single contributor to
      the band, which fails the instant it is closed whatever else is playing, and says nothing about
      any particular number.
    */
    const SUBBAND = BANDS.findIndex(([, , n]) => n === 'sub');
    const share = (layer: MusicLayer): number => {
      const gain = MUSIC_LADDER.run[layer];
      if (gain <= 0) return 0;
      const buf = bakeLayer(layer, SAMPLE_RATE);
      const at = new Float32Array(buf.length);
      for (let i = 0; i < buf.length; i++) at[i] = buf[i]! * gain;
      return bandEnergy(at, SAMPLE_RATE)[SUBBAND]!;
    };
    const mine = share('sub');
    for (const layer of MUSIC_LAYERS) {
      if (layer === 'sub') continue;
      expect(
        mine,
        `${layer} puts more into the band a chest resolves than \`sub\` does — the floor is a side ` +
          'effect of another layer rather than a part somebody wrote',
      ).toBeGreaterThan(share(layer));
    }
  }, DSP_MS);

  it('AND THE LAYER THE PLAYER HAD NEVER HEARD IS WITHIN REACH OF THE ONE THEY HAD', () => {
    /*
      ⚠️ **A-WEIGHTED, WHICH IS THE WHOLE POINT AND THE THING I GOT WRONG FIRST.** Raw RMS said `sub`
      was the loudest layer in the game; the player said they had never heard it, and they were right —
      energy is not loudness, and `tests/spectrum.ts` has been A-weighted since
      [0089](../docs/decisions/0089-a-cue-has-a-body.md) for exactly this reason.

      ⚠️ **A CEILING ON THE GAP RATHER THAN A FLOOR ON THE BASS LINE.** What matters is not how loud
      `groove` is, it is how far under the drums it sits — which is what *"drowning out"* means, and
      what a listener actually reports.
    */
    const heard = (layer: 'engine' | 'groove'): number =>
      bandEnergy(bakeLayer(layer, SAMPLE_RATE), SAMPLE_RATE).reduce((a, b) => a + b, 0) * MUSIC_LADDER.run[layer];
    const dB = 10 * Math.log10(heard('groove') / heard('engine'));
    expect(
      dB,
      `the bass line is ${dB.toFixed(1)}dB under the kick at the opening of a level — far enough under ` +
        'that a player reports never having heard it',
    ).toBeGreaterThan(-6);
  }, DSP_MS);
});

/**
 * A RUNG CHANGES THE NOTES — `docs/decisions/0123-a-rung-changes-the-notes.md`.
 *
 * ⚠️ **THE PLAYER RANKED FOUR SECTION CHANGES AND THE RANKING IS A MEASUREMENT.** Given against the
 * build carrying 0117 to 0122:
 *
 * | transition | notes changed, as a share of the bed | reported |
 * |---|---|---|
 * | `run` → `push` | 60% | *"good, it's clear and easy to tell what's happening"* |
 * | `push` → `surge` | 13% | *"far too subtle… only one change and it's soft and underneath"* |
 * | `surge` → `approach` | 2% | *"isn't noticeable at all, but it does slowly build"* |
 * | `approach` → `boss` | 130% | *"noticeable"* |
 *
 * ⚠️ **AND LOUDNESS DOES NOT PREDICT IT.** Measured on the summed, shaped bus, `approach` ADDED more
 * than `surge` — +0.52 dB against +0.09 — and was noticed less. What a listener hears as a section is
 * how much of the material CHANGED, which is why *"it does slowly build"* is the exact right
 * description of two sustained layers arriving over a bed that keeps playing.
 */
describe('0123 — a rung changes the notes, and that is what makes it a section', () => {
  /** Notes a bar a layer strikes. The unit 0102 and 0108 already count in. */
  const perBar = (l: MusicLayer): number =>
    MUSIC[l].reduce((n, v) => n + v.steps.filter((s) => s !== null).length, 0) / LAYER_BARS[l];

  /** What share of the notes still playing is replaced on the way into `here`. */
  const churn = (below: (typeof MUSIC_LEVELS)[number], here: (typeof MUSIC_LEVELS)[number]): number => {
    const bed = MUSIC_LAYERS.filter((l) => MUSIC_LADDER[below][l] > 0 && MUSIC_LADDER[here][l] > 0).reduce(
      (a, l) => a + perBar(l),
      0,
    );
    const arriving = MUSIC_LAYERS.filter((l) => MUSIC_LADDER[here][l] > 0 && MUSIC_LADDER[below][l] === 0).reduce(
      (a, l) => a + perBar(l),
      0,
    );
    const leaving = MUSIC_LAYERS.filter((l) => MUSIC_LADDER[here][l] === 0 && MUSIC_LADDER[below][l] > 0).reduce(
      (a, l) => a + perBar(l),
      0,
    );
    return (arriving + leaving) / bed;
  };

  it('THE REPORTED ONE: every rung replaces a real share of what is playing', () => {
    /*
      ⚠️ **25% IS THE PLAYER'S OWN BOUNDARY, NOT A ROUND NUMBER.** 13% was *"far too subtle"* and 2%
      was *"not noticeable at all"*; 60% and 130% were both heard. The floor sits above the two that
      failed and below the two that passed, which is the most a four-point ranking can honestly say —
      and it is stated in the unit the ranking was given in.
    */
    const inLevel = CLIMBING;
    for (let i = 1; i < inLevel.length; i++) {
      const c = churn(inLevel[i - 1]!, inLevel[i]!);
      expect(
        c,
        `${inLevel[i - 1]} → ${inLevel[i]} replaces ${(c * 100).toFixed(0)}% of the notes — the player called ` +
          '13% "far too subtle" and 2% "not noticeable at all"',
      ).toBeGreaterThan(0.25);
    }
  });

  it('and the fight is the largest change in the piece, because it is the arrival', () => {
    /*
      ⚠️ **Reported as *"noticeable, but not in a dramatic entrance kind of way"***, which is the one
      item this decision does not claim to fix — the fight already changes more than any rung and the
      complaint is about its CHARACTER. What this holds is that it never stops being the biggest, so a
      later hand cannot quietly make the boss the smallest change in the level.
    */
    const inLevel = CLIMBING;
    const arrival = churn(inLevel[inLevel.length - 1]!, 'boss');
    for (let i = 1; i < inLevel.length; i++) {
      expect(
        arrival,
        `the boss replaces ${(arrival * 100).toFixed(0)}% against ${inLevel[i]}'s ${(churn(inLevel[i - 1]!, inLevel[i]!) * 100).toFixed(0)}% — it is not the biggest thing that happens`,
      ).toBeGreaterThan(churn(inLevel[i - 1]!, inLevel[i]!));
    }
  });

  it('AND THE FIGHT OPENS AT ITS FULL ARRANGEMENT, which is where the player said it gets good', () => {
    /*
      ⚠️ **Reported**: *"the boss music itself gets good around phase 3 of the boss — this is where the
      boss music should be starting."* `wraith` is the leitmotif and
      [0114](../docs/decisions/0114-the-fight-is-a-different-piece.md) held it back to `bossPeak` on
      the reasoning that *"one that arrives when the boss is half dead is a payoff"*. **The player has
      now heard that and asked for the payoff at the door.**

      ⚠️ **AND THE FIGHT IS TOO SHORT TO HOLD TWO RUNGS ANYWAY.** At max weapons on `savior` the whole
      fight is 4.6 s on level one, and `bossPeak` opens at 78% health — so 0114's *sparse arrival*
      lasted **one second**, against its own rule that a rung shorter than a handful of `RAMP_SECONDS`
      is a wobble rather than a section. Nothing guarded it, because that rule was written about a
      DISTANCE and the fight is a health fraction.
    */
    for (const layer of MUSIC_LAYERS) {
      if (MUSIC_LADDER.bossPeak[layer] <= 0) continue;
      expect(
        MUSIC_LADDER.boss[layer],
        `${layer} waits for bossPeak, so the fight does not open at full strength`,
      ).toBeGreaterThan(0);
    }
  });
});

/*
  ── 0171: A BOUNDARY IS A BUILD, AND FOR ITS WHOLE LIFE IT WAS A STEP ────────────────────────────

  `docs/decisions/0171-a-boundary-is-a-build.md`. Reported 2026-08-18: *"the push > run primarily but
  the other transitions for each individual level doesn't actually transition at the moment, it just
  jumps."*

  ⚠️ **EVERY EXISTING GUARD OVER A BOUNDARY IS GREEN ON A STEP, AND THERE ARE THREE OF THEM.** 0166
  holds the MAGNITUDE of the worst move, 0167 holds that no carried layer DUCKS, and 0164 holds where
  each layer sits once the rung has settled. All three are about levels; none has a time axis, so all
  three were green over four layers landing on one downbeat. **A guard measuring a quantity defined in
  terms of the constant it guards proves only that the code agrees with itself** — `CLAUDE.md`, and
  this is the same warning one axis over.
*/
describe('0171 — a section change is a build rather than a step', () => {
  it('THE REPORTED ONE: no boundary in any place delivers every arrival at one instant', () => {
    const steps: string[] = [];
    for (const theme of THEME_KINDS) {
      for (const build of buildsOf(theme)) {
        if (build.arrivals.length > 1 && build.spread === 0) steps.push(`${theme} ${build.from}→${build.to}`);
      }
    }
    /*
      ⚠️ **THE FLOOR, IN 0161's OWN SORTING.** *Two or more layers arrive together* is a fact about
      whether a section change reads as an event at all — the thing this file's other music
      assertions each got wrong by asserting a SHAPE. How long a build should be, and in what order,
      is a musical opinion and is deliberately not asserted anywhere.
    */
    expect(steps, 'these boundaries open two or more layers on one downbeat, which is what *it jumps* means').toEqual([]);
  });

  it('AND THE ONE THE PLAYER COUNTS IN SECONDS: run → push spans more than three of them, in all seven', () => {
    /*
      ⚠️ **THE ASSERTION IN UNITS THE PLAYER EXPERIENCES**, which `CLAUDE.md` requires of every
      subject and which a bar count is not — `BUILD_BARS` is defined in bars, so an assertion in bars
      would be the code agreeing with itself. Three seconds is the reported boundary's own two-bar
      minimum expressed against the clock: at 150 BPM a bar is 1.6 s, and `run → push` opens four
      layers over at least two of them in every place.
    */
    /*
      ⚠️ **HOW MANY LAYERS A BOUNDARY OPENS IS NOT ASSERTED, AND IT USED TO BE.** It was four in all
      seven when this was written and it is four, five or six now —
      `docs/decisions/0172-a-place-opens-with-its-own-four.md` gave each place its own `run` row, so
      what arrives at `push` is a per-place fact. **That is a SHAPE and 0161 says not to guard it**;
      the spread is the floor and is what the report was about.
    */
    for (const theme of THEME_KINDS) {
      const build = buildsOf(theme).find((b) => b.from === 'run' && b.to === 'push')!;
      expect(build.arrivals.length, `${theme} opens nothing at push`).toBeGreaterThan(1);
      expect(
        build.spread,
        `${theme}'s push arrives over ${build.spread.toFixed(2)}s, which is not long enough to be heard as a build`,
      ).toBeGreaterThan(3);
    }
  });

  it('and a build fits inside the section it opens, with the whole of that section left to play', () => {
    /*
      ⚠️ **A FLOOR AND NOT A SHAPE.** A build longer than its own section would be a section that
      never finished arriving, which is the one way *slower* stops being *smoother*. The shortest
      section in the game is the approach — `LEVELS` says how long, and it is read rather than typed.
    */
    const perSecond = SCROLL_PER_STEP * STEPS_PER_SECOND;
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      const script = level.sections;
      for (const build of buildsOf(level.theme)) {
        const opens = script.findIndex((entry) => entry.section === build.to);
        if (opens < 1) continue;
        const next = script[opens + 1]?.at ?? level.bossAt;
        const seconds = (next - script[opens]!.at) / perSecond;
        expect(
          build.spread,
          `${kind}'s ${build.to} is ${seconds.toFixed(1)}s long and its build takes ${build.spread.toFixed(2)}s`,
        ).toBeLessThan(seconds / 2);
      }
    }
  });

  it('and the piece STARTS together, because a build needs something to build on', () => {
    /*
      ⚠️ **THE ONE CASE WHERE A STEP IS CORRECT.** With nothing sounding, the first write is the music
      starting; staggering it would be four seconds of a game with no soundtrack, and
      `docs/decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md` is what a run start costs
      already.
    */
    for (const theme of THEME_KINDS) {
      const cold = levelWrites('push', theme, 0, 0, 0, {});
      const at = new Set(cold.map((w) => w.at));
      expect(at.size, `${theme} staggers a cold start, so the level opens over four seconds of nothing`).toBe(1);
    }
  });

  it('and the arrivals go up the arrangement, so what a place asks you to FOLLOW lands last', () => {
    /*
      ⚠️ **THIS IS THE HALF THAT MAKES TWO PLACES DIFFERENT, and it costs nothing to state.** `roleOf`
      reads `LEADS`, so the layer that lands last at a boundary is the one that place follows there —
      `docs/decisions/0155-a-place-follows-its-own-instrument.md`'s differentiation spent on time
      instead of on level. Ember Nebula's choir lands where The Black Heart's riff does.
    */
    /*
      ⚠️ **ACROSS BARS AND NOT INSIDE ONE**, because the cap merges the front of a long build into one
      downbeat and that bar therefore holds mixed roles by construction. What has to hold is that no
      LATER bar carries a quieter role than an earlier one — the build only ever goes up.
    */
    for (const theme of THEME_KINDS) {
      for (const build of buildsOf(theme)) {
        let landed = -1;
        let bar = -1;
        let highest = -1;
        for (const arrival of build.arrivals) {
          if (arrival.second !== bar) {
            bar = arrival.second;
            landed = highest;
          }
          const at = arrival.role === null ? 0 : MUSIC_ROLES.indexOf(arrival.role);
          expect(
            at,
            `${theme} ${build.from}→${build.to}: ${arrival.layer} (${arrival.role}) arrives a bar after a louder role`,
          ).toBeGreaterThanOrEqual(landed);
          if (at > highest) highest = at;
        }
      }
    }
  });

  it('and every arrival lands on a downbeat, which is 0117 one bar down', () => {
    for (const theme of THEME_KINDS) {
      for (const build of buildsOf(theme)) {
        for (const arrival of build.arrivals) {
          const bars = arrival.second / BAR_SECONDS;
          expect(
            Math.abs(bars - Math.round(bars)),
            `${theme} ${build.to}: ${arrival.layer} arrives ${arrival.second}s in, which is not a downbeat`,
          ).toBeLessThan(1e-9);
          expect(bars, `${theme} ${build.to}: ${arrival.layer} lands past the cap`).toBeLessThanOrEqual(BUILD_BARS + 1e-9);
        }
      }
    }
  });

  it('and a rung whose arrivals all hold one role still builds, quietest first', () => {
    /*
      ⚠️ **THE CASE THAT WOULD OTHERWISE HAVE STAYED A STEP IN THREE PLACES.** `roleOf` demotes the
      arrangement's part wherever a place names its own lead, so a boundary can open two counter-lines
      and nothing else — Saurian Reach's `approach` is exactly that.
    */
    const bars = entryBars('saurian', 'approach', [
      { layer: 'dread', target: 1 },
      { layer: 'toll', target: 0.5 },
    ]);
    expect(bars.toll, 'the quieter arrival leads').toBe(0);
    expect(bars.dread, 'and the louder one is what lands, a bar later').toBe(1);
  });
});

/*
  ── 0175: AN EXPERIMENT ARRIVES THE WAY THE GAME DOES ────────────────────────────────────────────

  `docs/decisions/0175-an-experiment-arrives-the-way-the-game-does.md`. Reported: *"the shipped
  version has really smooth blending, the re-based still has a hard cut line when going from run >
  push etc. It sounds like they applied to shipped, but we've got a re-based solution happening to get
  a bunch of additional sounds happening."*

  ⚠️ **THE CUT WAS THE WRITE PATH AND NOT THE MIX.** `rig/dash.ts` called `setLevel` and then wrote
  the solved targets straight onto the gain nodes at `time 0` over `HOLD_SECONDS` — 30 ms, off the
  bar — so every non-`shipped` mode discarded 0117's downbeat and 0171's build together. **Both of
  those decisions' guards were green throughout**, because both run over `levelWrites` and the
  dashboard was going around it.
*/
/*
  ── 0175's GUARDS WENT WITH ITS MECHANISM, AND THE ONE THAT MATTERS DID NOT ──────────────────────

  `docs/decisions/0176-the-re-based-mix-is-the-mix.md`. 0175 gave `levelWrites` a handed-in gain table
  so the desk's non-shipped modes could arrive on the downbeat over the mixer's own ramp; the modes
  are gone and so is the parameter, so the three assertions over it have nothing left to be about.

  ⚠️ **THE SOURCE SCAN STAYS AND IS BELOW**, because its subject is not the parameter — it is that the
  desk never writes a music gain behind the mixer's back, which is how the cut got in and is a
  property the desk still has to have.
*/
describe('0175 — the desk does not write a music gain behind the mixer’s back', () => {
  it('and `restate` is the only place in rig/dash.ts that writes one', () => {
    /*
      ⚠️ **A SOURCE SCAN, AND IT IS THE ONLY THING THAT COULD HAVE CAUGHT THE ORIGINAL.** The defect
      0175 found was a correct value written at the wrong TIME through a legitimate API: the desk's
      non-shipped modes called `setLevel` and then overwrote every layer at `time 0` over 30 ms, off
      the bar. No value-level guard over `levelWrites` could see it, because the dashboard was not
      calling `levelWrites`.

      ⚠️ **THE MODES ARE GONE AND THIS IS NOT** —
      `docs/decisions/0176-the-re-based-mix-is-the-mix.md`. What it asserts is that the desk's only
      hand on a music gain is the user's own — an explicit fader or a solo pin, both `restate`'s —
      which is a property the desk has to keep however many mixes it plays.

      ⚠️ **WHERE, NOT HOW MANY.** The first version counted call sites and put the ceiling at two;
      there are three, all of them `restate`'s — a pan, a held gain and a release — so a count would
      have gone red on correct code and stayed green on a fourth writer added inside the same
      function.
    */
    const lines = readFileSync(resolve(root, 'rig/dash.ts'), 'utf8').split('\n');
    let inside = '';
    const strays: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const declared = /^(?:function|const) (\w+)/.exec(lines[i]!);
      if (declared !== null) inside = declared[1]!;
      const line = lines[i]!;
      if (/\.setTargetAtTime\(/.test(line) && !/^\s*[/*]/.test(line) && inside !== 'restate') {
        strays.push(`${inside === '' ? 'top level' : inside}:${i + 1}`);
      }
    }
    expect(
      strays,
      'these write a music gain outside restate — an experiment going around the mixer arrives off ' +
        'the bar and over 30 ms, which is the cut 0175 exists for',
    ).toEqual([]);
  });
});
