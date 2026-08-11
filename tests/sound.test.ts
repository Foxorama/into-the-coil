import { BANDS, spectrum } from './spectrum.ts';
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import {
  CUES,
  CUE_KINDS,
  MAX_CUE_SECONDS,
  MUSIC_ROOT,
  SCALE,
  TWIN_KINDS,
  inKey,
  type CueLayer,
  type CueKind,
} from '../src/content/cues.ts';
import { DEFAULT_SOUND, SOUNDS, SOUND_KINDS } from '../src/content/sound.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import { BEAT_SECONDS } from '../src/content/music.ts';
import { DUCK_DOWN_SECONDS, DUCK_HOLD_SECONDS, DUCK_UP_SECONDS } from '../src/app/music.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import {
  MAX_CUE_SAMPLES,
  MAX_VOICES,
  SAMPLE_RATE,
  bakeCues,
  cueSeconds,
  makeSpeaker,
  prewarmAudio,
  resetPrewarm,
  sampleCue,
  sampleLayerInto,
  takePrewarmed,
  variantAt,
  velocitiesOf,
  type AudioOut,
} from '../src/app/sound.ts';
import { bakeLoops } from '../src/app/music.ts';
import { FIRE_GRID, MUSIC, MUSIC_LAYERS, secondsOfLayer } from '../src/content/music.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { MISSILE_BEAT_RATIO, fireEveryAt, missileEveryAt } from '../src/content/pickups.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { makeRng } from '../src/sim/rng.ts';
import { SCREENS } from '../src/state/screens.ts';
import { initialState, reduce, type Action } from '../src/state/root.ts';
import { LEVELS } from '../src/content/levels.ts';
import { GameFrame, SHIP_START_ALONG } from '../src/app/frame.ts';
import { playableWorld } from './world.ts';

/**
 * SOUND — THE TABLE, THE SAMPLES, THE GATE, AND THE BAN.
 *
 * `docs/decisions/0072-a-cue-is-baked-and-played.md`.
 *
 * ⚠️ **Nothing in this file makes a noise, and that is what it is for.** The three things most likely
 * to be wrong about game audio — a cue that fires per barrel instead of per volley, a hold that never
 * expires, a cap that eats the one sound that mattered — are arithmetic, and arithmetic is checkable
 * without an audio device. What is NOT checkable here is whether any of it sounds good;
 * `scripts/hear.mjs` writes a `.wav` for the only instrument that can answer that, and
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` is why the rig is owed before the tuning
 * rather than after it.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

/** Every `.ts` under a directory, recursively. An explicit walk, not a glob. */
function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith('.ts')) out.push(path);
  }
  return out;
}

const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');

/**
 * A source with its comments blanked.
 *
 * ⚠️ **The ban below scans CODE, and `tests/style.test.ts`'s equivalent scans raw text.** The
 * difference is not an inconsistency, it is this repository's own house style catching up with its
 * guards: every rule in `src/` cites the file it comes from, so `src/app/frame.ts` names
 * `src/content/sound.ts` in prose precisely BECAUSE it is forbidden to import it. A raw scan would
 * make the guard fire on the sentence explaining the guard, and the only way to keep it green would
 * be to stop writing the citation down — which is the documentation convention losing an argument to
 * a regex. What the ban is about is the import graph, and an import cannot hide in a comment.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/.*$/gm, ' ');
}

/** An `AudioOut` that records rather than sounds, which is the whole reason the speaker is separate. */
function recorder(ready = true): { out: AudioOut; heard: number[]; struck: number[]; ducked: number[] } {
  const heard: number[] = [];
  /** Which WEIGHT each sounding was struck at, in the same order — 0104. */
  const struck: number[] = [];
  /** Every duck the speaker asked the music for, in order — 0104. */
  const ducked: number[] = [];
  return {
    heard,
    struck,
    ducked,
    out: {
      ready: () => ready,
      sound: (index: number, velocity: number) => {
        heard.push(index);
        struck.push(velocity);
      },
      duck: (amount: number) => {
        ducked.push(amount);
      },
    },
  };
}

const indexOf = (kind: CueKind): number => CUE_KINDS.indexOf(kind);

describe('the cue table', () => {
  it('gives every cue a visual twin, which is 0024’s unconditional tier and not a preference', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`: *"no information by audio alone —
      every cue that tells the player something has a visual twin. Audio stays loud and additive — it
      is the ONLY channel that is banned, not the sound."* It named the cue table as where this lands,
      *"a required field on the row, so the compiler asks."*
    */
    for (const kind of CUE_KINDS) {
      expect(TWIN_KINDS, `${kind} claims a twin that is not a picture this game draws`).toContain(CUES[kind].twin);
    }
  });

  it('and no twin is claimed by nothing, so the list cannot fill up with pictures nobody draws', () => {
    /*
      ⚠️ **The half a bare union could not have.** The compiler stops a cue naming a picture that is
      not on the list; only a walk can stop the list growing a picture no cue uses — which is how a
      promise about accessibility goes stale without anything going red.
    */
    const claimed = new Set(CUE_KINDS.map((kind) => CUES[kind].twin));
    const orphans = TWIN_KINDS.filter((twin) => !claimed.has(twin));
    expect(orphans, `these pictures are listed as twins and no cue is the twin of them: ${orphans.join(', ')}`).toEqual([]);
  });

  it('keeps every cue inside the ceiling, because past a second it is not punctuation', () => {
    for (const kind of CUE_KINDS) {
      expect(cueSeconds(CUES[kind]), `${kind} is longer than a cue may be`).toBeLessThanOrEqual(MAX_CUE_SECONDS);
      expect(cueSeconds(CUES[kind]), `${kind} has no length`).toBeGreaterThan(0);
    }
  });

  it('and every row is a sound that can actually be synthesised', () => {
    for (const kind of CUE_KINDS) {
      const row = CUES[kind];
      expect(row.layers.length, `${kind} has no layers, so it is silence`).toBeGreaterThan(0);
      expect(row.gain, `${kind} is silent`).toBeGreaterThan(0);
      expect(row.gain, `${kind} is louder than full scale on its own`).toBeLessThanOrEqual(1);
      expect(row.glue, `${kind} has a negative glue`).toBeGreaterThanOrEqual(0);
      expect(row.hold, `${kind} has a negative hold`).toBeGreaterThanOrEqual(0);
      for (const [i, layer] of row.layers.entries()) {
        /*
          Both ends of a sweep are a RATE and the sweep is exponential, so zero is not a value the
          START can take — `Math.pow(to / from, u)` is the whole waveform. `noise` is the exception in
          the other direction: zero there means WHITE, which is what every explosion now uses.
        */
        if (layer.wave === 'noise') expect(layer.from, `${kind} layer ${i} has a negative grain`).toBeGreaterThanOrEqual(0);
        else expect(layer.from, `${kind} layer ${i} sweeps from zero`).toBeGreaterThan(0);
        expect(layer.seconds, `${kind} layer ${i} has no length`).toBeGreaterThan(0);
        expect(layer.gain, `${kind} layer ${i} is silent`).toBeGreaterThan(0);
        expect(layer.at ?? 0, `${kind} layer ${i} starts before the cue does`).toBeGreaterThanOrEqual(0);
        expect(layer.q ?? 1, `${kind} layer ${i} resonates hard enough to ring a pitch of its own`).toBeLessThan(4);
      }
    }
  });

  describe('0099 — the cues are in the key', () => {
    /*
      `docs/decisions/0099-the-cues-are-in-the-key.md`. Reported from play: *"the primary and second
      fire, enemy fire and explosion noises for bomb, enemy and player death don't sync into the music
      properly, they're all close to on beat, but the sounds just don't mesh at all."*

      ⚠️ **"CLOSE TO ON BEAT" IS A PASS ON THE TIMING WORK.** 0093, 0094 and 0096 put every cadence in
      the game on a sixteenth grid; the report says the timing arrived and something else did not.
      What had never been tuned is HARMONY — the music is A minor and the cues were in no key at all:
      the pulse fell to 52 Hz, a kill to 62, the blast to 58, a death to 48. Four notes, none in the
      scale, arriving on the beat over a drone sounding A.
    */

    /** Every frequency the natural minor allows, across the whole audible range, from the root. */
    const allowed = (): number[] => {
      const out: number[] = [];
      for (let octave = -3; octave <= 8; octave++) {
        for (const semitone of SCALE) out.push(MUSIC_ROOT * Math.pow(2, octave + semitone / 12));
      }
      return out;
    };

    /** How far `hz` is from the nearest scale tone, in cents. */
    const centsOff = (hz: number): number =>
      Math.min(...allowed().map((tone) => Math.abs(1200 * Math.log2(hz / tone))));

    /** Every pitched layer in the table, with the interval its glide spans. */
    const pitched = (): { name: string; layer: CueLayer; to: number; semitones: number }[] => {
      const out: { name: string; layer: CueLayer; to: number; semitones: number }[] = [];
      for (const kind of CUE_KINDS) {
        for (const [i, layer] of CUES[kind].layers.entries()) {
          if (layer.wave === 'noise' || layer.from === 0) continue;
          const to = layer.to || layer.from;
          out.push({ name: `${kind} layer ${i}`, layer, to, semitones: 12 * Math.log2(to / layer.from) });
        }
      }
      return out;
    };

    it('THE REPORTED ONE: every pitched cue glides between two notes of the key', () => {
      /*
        ⚠️ **BOTH ENDS, AND NOT THE NOTE IN THE MIDDLE — BECAUSE NOBODY CAN SAY WHAT THAT IS.** The
        first attempt at this decision tried to tune the pitch a listener actually names, and two
        defensible models of it disagreed by **four semitones** on the death cue's own body: the
        energy-weighted mean of the instantaneous frequency said 131 Hz, and a Goertzel over the whole
        rendered layer peaked at 165. A fast chirp does not have a pitch in the sense the question
        assumes. What both models agree on is that whatever it is, it lies between the endpoints — so
        making the endpoints notes of the scale is the claim that cannot be wrong either way.

        ⚠️ **It is over the VALUES rather than over the helper**, which is the difference between a
        guard and a tautology: `inKey` producing scale tones would be arithmetic agreeing with
        arithmetic (`docs/decisions/0027-measure-the-picture-not-the-model.md`). This walks the two
        numbers each layer actually carries, so a raw `190` typed straight into the table fails whether
        it came through the helper or not — and every one of these WAS a raw number until this
        decision.

        ⚠️ **`noise` is exempt and the field says why.** For noise, `from` is a sample-and-hold rate
        rather than a pitch — one field, two meanings, stated on `CueLayer` — and everything that
        explodes uses white, where it is zero. Demanding a scale tone there would be asserting a
        musical property of a number that is not a pitch.
      */
      const offenders: string[] = [];
      const all = pitched();
      for (const { name, layer, to } of all) {
        for (const [end, hz] of [
          ['from', layer.from],
          ['to', to],
        ] as const) {
          const off = centsOff(hz);
          if (off > 1) offenders.push(`${name} ${end} = ${hz.toFixed(1)}Hz, ${off.toFixed(0)} cents off the key`);
        }
      }
      expect(all.length, 'no pitched layers were examined, so this measured nothing').toBeGreaterThan(20);
      expect(offenders, `${offenders.length} of ${all.length} pitched layers glide off the key`).toEqual([]);
    });

    it('and every glide is therefore a whole number of semitones, which none of them used to be', () => {
      /*
        ⚠️ **A CONSEQUENCE RATHER THAN A SECOND RULE, and it is worth stating anyway.** Any two scale
        tones are a whole number of semitones apart, so this follows from the assertion above — what
        it adds is the failure message. The old table's did not: a death fell 21.9 semitones and a kill
        19.4, so two explosions half a second apart were two unrelated slides rather than the same
        gesture at two pitches.

        ⚠️ **Held to a hundredth of a semitone**, which is far tighter than an ear and is right here:
        it is not a claim about audibility, it is a claim that the number was chosen as an interval
        rather than arrived at.
      */
      for (const { name, semitones } of pitched()) {
        expect(
          Math.abs(semitones - Math.round(semitones)),
          `${name} glides ${semitones.toFixed(2)} semitones, which is not an interval`,
        ).toBeLessThan(0.01);
      }
    });

    it('and the scale is the natural MINOR, so nothing a cue sounds can be wrong over the drone', () => {
      /*
        ⚠️ **The chromatic set would make this guard mean nothing**, which is the failure it is worth
        stating: twelve notes to the octave is *any note*, and any note is what an arbitrary Hz value
        already was. Seven is what makes *in the key* a constraint.
      */
      expect([...SCALE], 'the scale is no longer the natural minor').toEqual([0, 2, 3, 5, 7, 8, 10]);
      expect(inKey(0), 'the root is not the root').toBeCloseTo(MUSIC_ROOT, 9);
      expect(inKey(SCALE.length), 'seven degrees is not an octave').toBeCloseTo(MUSIC_ROOT * 2, 9);
      expect(inKey(-SCALE.length), 'seven degrees down is not an octave down').toBeCloseTo(MUSIC_ROOT / 2, 9);
    });

    it('THE SAMPLES: what a layer puts in the room lies inside the interval its row names', () => {
      /*
        ⚠️ **THE ASSERTION THAT IS NOT ABOUT THE TABLE**, and it is deliberately modest, because the
        modest version is the one the samples can carry. Everything above reads numbers off rows;
        this renders a layer and asks where its energy actually is. A synthesiser that ignored `to`,
        a sweep that overshot, or a resonant filter ringing a pitch of its own would pass every
        assertion above and put something else in the room.

        ⚠️ **ITS FIRST VERSION ASKED FOR THE NOTE AND COULD NOT BE ANSWERED**, which is how this
        decision found out that a chirp has no single pitch — see
        `docs/decisions/0099-the-cues-are-in-the-key.md`. What is checked now is the claim that
        survived: the sound lives between the two notes, and nowhere else.

        ⚠️ **One LAYER on its own, not the whole cue.** A death is three pitched layers at three
        different notes plus three of noise; a spectrum of the sum answers a question about the mix
        rather than about the synthesiser. `sampleLayerInto` is exported, so a layer can be rendered
        alone.

        ⚠️ **The DEATH's body, because it is the longest glide in the game** — 1.2 seconds over
        twenty-two semitones — so it is the layer with the most room to be wrong in.
      */
      const subject = CUES.death.layers[3]!;
      const buffer = new Float32Array(Math.round(subject.seconds * SAMPLE_RATE));
      sampleLayerInto(subject, SAMPLE_RATE, makeRng('pitch').stream('death'), buffer, 0, false);

      /** Energy at `hz`, by the same Goertzel `tests/spectrum.ts` uses. */
      const at = (hz: number): number => {
        const c = 2 * Math.cos((2 * Math.PI * hz) / SAMPLE_RATE);
        let s1 = 0;
        let s2 = 0;
        for (let i = 0; i < buffer.length; i++) {
          const s0 = buffer[i]! + c * s1 - s2;
          s2 = s1;
          s1 = s0;
        }
        return Math.sqrt(Math.abs(s1 * s1 + s2 * s2 - c * s1 * s2)) / buffer.length;
      };

      const low = Math.min(subject.from, subject.to);
      const high = Math.max(subject.from, subject.to);
      /*
        Swept across four octaves in quarter tones, so the loudest bin is found rather than assumed.
        A quarter tone is finer than the semitone the claim is made in, and four octaves is wider than
        the interval by an octave at each end — enough room for an overshoot to show.
      */
      let loudest = -1;
      let peak = 0;
      for (let step = -24; step <= 72; step++) {
        const hz = low * Math.pow(2, step / 24);
        const energy = at(hz);
        if (energy > loudest) {
          loudest = energy;
          peak = hz;
        }
      }
      expect(loudest, 'the layer baked to silence, so this measured nothing').toBeGreaterThan(0);
      /*
        A semitone of tolerance at each end, which is the resolution a Goertzel over a chirp has: the
        energy at the extremes is smeared by the sweep itself, so the peak can sit a fraction outside
        the endpoints without the sweep having gone anywhere it should not.
      */
      const margin = Math.pow(2, 1 / 12);
      expect(
        peak,
        `the layer is loudest at ${peak.toFixed(1)}Hz, below the ${low.toFixed(1)}Hz end of the interval its row names`,
      ).toBeGreaterThan(low / margin);
      expect(
        peak,
        `the layer is loudest at ${peak.toFixed(1)}Hz, above the ${high.toFixed(1)}Hz end of the interval its row names`,
      ).toBeLessThan(high * margin);
      /*
        ⚠️ **AND IT SOUNDS BOTH NOTES, WHICH THE BOUNDS ABOVE DO NOT SAY** — a probe reported STILL
        GREEN before this was here. A synthesiser that ignored `to` entirely produces a held tone at
        `from`, and `from` is *inside* the interval, so *the peak lies between the endpoints* was
        satisfied by a sound that never went anywhere. What separates a glide from a held note is
        that there is energy at the far end too.

        ⚠️ **A twenty-fifth, and the two ends are not equal.** A decaying sweep spends the same time
        per octave but arrives at its destination quiet — a curve of 1.9 leaves the far end at about
        a seventh of the near end's amplitude — so the floor is set under that rather than at parity.
        Measured, the far end is around a third of the peak; a held tone leaves spectral leakage,
        which is three orders of magnitude below it.
      */
      expect(
        at(low) / loudest,
        `the layer has no energy at the ${low.toFixed(1)}Hz end of its own glide — it is a held note, not a fall`,
      ).toBeGreaterThan(1 / 25);
      expect(
        at(high) / loudest,
        `the layer has no energy at the ${high.toFixed(1)}Hz end of its own glide`,
      ).toBeGreaterThan(1 / 25);
      // And both ends of that interval are notes in the key, which is the fact the decision is about.
      expect(centsOff(low) + centsOff(high), 'the interval the death glides across is not in the key').toBeLessThan(2);
    });
  });

  describe('0102 — the synthesis happens before the press, and produces the same sound', () => {
    /*
      `docs/decisions/0102-the-music-goes-somewhere.md`. The bake was 718ms riding the gesture that
      unlocks the audio, and `docs/decisions/0095-the-level-has-its-own-music.md` capped the chord
      progression at four bars because of it: *"eight bars would be about 900ms — a freeze at tap to
      start."* **The length of the music was decided by how long it takes to make.**

      ⚠️ **Neither bake needs a context and both already run at a fixed rate**, so the whole set can
      be synthesised on the title screen a voice at a time. What has to be true is that it comes out
      IDENTICAL — *the same game sounds different depending on how fast you pressed* is the worst
      shape of bug there is, and it would be invisible to every other assertion here.
    */
    /*
      ⚠️ **THIRTY SECONDS, AND IT IS A REAL COST RATHER THAN SLACK.** This synthesises the whole set
      TWICE — about sixty seconds of audio each way, which is two seconds of arithmetic on this
      machine and more on a loaded CI box. It timed out at vitest's five-second default under the
      full suite while passing on its own, which
      `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` says to establish
      rather than re-run: it is neither a real intermittency nor a wrong quantity, it is a guard whose
      subject genuinely costs two seconds meeting a default sized for tests that do not.

      ⚠️ **The alternative was comparing fewer layers, and that is the version that would rot.** What
      makes this worth having is that it covers every sample of every layer; a guard that sampled
      three of them would pass a mis-seeded stream in the other eight.
    */
    it('THE ONE THAT WOULD BE INVISIBLE: prewarmed and cold bakes are the same samples', () => {
      /*
        ⚠️ **`docs/decisions/0021-one-stream-per-concern.md` is what this rests on.** A stream is
        `hashSeed(root:name)` — a pure function of two strings, with no ordering in it — so a layer
        baked on its own three frames later draws the identical noise it would have drawn inside the
        loop. That is the property; this is the check that it is true rather than merely intended.

        ⚠️ **Driven to completion synchronously**, which is what the injected scheduler is for: the
        prewarm walks jobs across frames in the game and runs them straight through here.
      */
      const cold = { cues: bakeCues(SAMPLE_RATE), loops: bakeLoops(SAMPLE_RATE) };
      resetPrewarm();
      prewarmAudio((run) => run());
      const warm = takePrewarmed();
      expect(warm, 'the prewarm did not finish, so this measured nothing').not.toBeNull();

      /*
        ⚠️ **Walked as typed arrays rather than compared with `toEqual`, and a TIMEOUT is why.** The
        first version converted both sides with `Array.from` and handed vitest sixty seconds of audio
        as plain arrays — about thirty million boxed numbers. It passed on its own and timed out at
        five seconds under the load of the full suite, which is
        `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` exactly: the guard
        was right about its subject and wrong about how to look at it.

        ⚠️ **Every sample, not a prefix.** A prefix would pass a generator that diverged after its
        first draw, which is precisely what a mis-seeded stream does — the attack is deterministic and
        the noise tail is where a difference would live. What changes is the cost of looking, not how
        much is looked at.
      */
      const firstDifference = (a: Float32Array, b: Float32Array): number => {
        if (a.length !== b.length) return -1;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i;
        return -2;
      };
      expect(warm!.cues.length, 'the prewarm baked a different number of cues').toBe(cold.cues.length);
      let compared = 0;
      for (let i = 0; i < cold.cues.length; i++) {
        /*
          ⚠️ **A cue is a LIST of weights now** — `docs/decisions/0104-the-gun-plays-a-figure.md`. The
          two paths build the nesting differently on purpose: `bakeCues` maps a row to its variants in
          one pass, and the prewarm claims the row's list up front and fills each slot from its own
          job, spread across frames. **That is exactly the kind of difference this test exists to
          catch**, so the count is asserted per row rather than only in total.
        */
        expect(warm!.cues[i]!.length, `${CUE_KINDS[i]} baked a different number of weights prewarmed`).toBe(
          cold.cues[i]!.length,
        );
        for (let v = 0; v < cold.cues[i]!.length; v++) {
          const at = firstDifference(warm!.cues[i]![v]!, cold.cues[i]![v]!);
          compared += cold.cues[i]![v]!.length;
          expect(at, `${CUE_KINDS[i]} weight ${v} is a different LENGTH prewarmed`).not.toBe(-1);
          expect(
            at,
            `${CUE_KINDS[i]} weight ${v} sounds different depending on when it was baked — first at sample ${at}`,
          ).toBe(-2);
        }
      }
      for (const layer of MUSIC_LAYERS) {
        const at = firstDifference(warm!.loops[layer], cold.loops[layer]);
        compared += cold.loops[layer].length;
        expect(at, `the ${layer} layer is a different LENGTH prewarmed`).not.toBe(-1);
        expect(
          at,
          `the ${layer} layer sounds different depending on when it was baked — first at sample ${at}`,
        ).toBe(-2);
      }
      expect(compared, 'nothing was actually compared').toBeGreaterThan(SAMPLE_RATE * 30);
    }, 30_000);

    it('and a player who presses before it finishes still gets sound', () => {
      /*
        ⚠️ **The cold path is not a fallback nobody reaches.** It is what every headless test takes,
        and it is what a player who taps the instant the page paints gets. Two ways of arriving at
        one set of samples, and the assertion above is that they arrive at the same place — this one
        is that the second way still exists.
      */
      resetPrewarm();
      expect(takePrewarmed(), 'a prewarm survived a reset, so the cold path is unreachable').toBeNull();
      expect(bakeCues(SAMPLE_RATE).length, 'the cold bake produces nothing').toBe(CUE_KINDS.length);
    });

    it('and the whole set is small enough to spread across the title screen', () => {
      /*
        ⚠️ **The budget did not disappear, it moved** — and it is worth stating where, because 0095's
        was stated and then silently exceeded would be the same mistake in the other direction. What
        matters now is the size of the largest single JOB rather than the total: the prewarm yields
        between them, so a job longer than a frame is a hitch on the title screen.

        ⚠️ **Measured rather than asserted against a clock**, on
        `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`'s own terms: CI is not the
        phone. What is counted is SECONDS OF AUDIO per job, which is what the synthesis time is
        proportional to — the longest layer is the ceiling, and a layer longer than about twenty
        seconds of audio would be a job no scheduler can hide.
      */
      /*
        ── IT WAS MEASURING THE LAYER, AND ITS OWN COMMENT SAYS THE JOB ────────────────────────────

        ⚠️ **`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`.** The paragraph above
        is right that *"what matters now is the size of the largest single JOB"* and the assertion
        underneath it measured `secondsOfLayer` — the whole layer. **A layer has not been one job
        since `docs/decisions/0102-the-music-goes-somewhere.md`**, which split the prewarm per NOTE
        precisely because `chords` measured 428 ms on its own.

        ⚠️ **So the ceiling fired on a quantity nobody schedules.** A sixteen-bar layer is 25.6s of
        audio and about four hundred jobs, none of them longer than the 1.84s pad that was always the
        worst one — and the guard would have refused it while a single voice holding one note for a
        minute sailed through. `docs/decisions/0027-measure-the-picture-not-the-model.md` is the rule
        this breaks and it is the second time in this session.
      */
      const jobs = MUSIC_LAYERS.flatMap((layer) => MUSIC[layer].map((voice) => voice.note.seconds));
      const longestJob = Math.max(...jobs);
      expect(
        longestJob,
        `the longest single note is ${longestJob.toFixed(2)}s of synthesis, which is the job the scheduler cannot split`,
      ).toBeLessThan(3);

      /*
        ⚠️ **AND THE QUANTITY THAT ACTUALLY GREW WAS NEVER GUARDED AT ALL.** The loops went from 19.0
        MB to 38.7 MB when the phrase doubled, and nothing in this repository had an opinion — the
        two assertions here were both about TIME. `docs/decisions/0022-frame-rate-is-a-feature.md`'s
        budget is a floor for the frame and says nothing about resident audio.

        ⚠️ **48 MB, and it is a desktop-first number stated as one.** The ninth play-test made desktop
        the prestige target and the phone the fallback; this is the first bound in the repository that
        spends that permission, so it says so rather than looking like a measurement.
      */
      /*
        ── 48 → 56, AND IT IS THE SECOND RAISE, WHICH IS THE PART THAT MATTERS ─────────────────────

        ⚠️ **`docs/decisions/0114-the-fight-is-a-different-piece.md`.** The loops were 19.0 MB when
        this guard did not exist, 38.7 when it was written, and 52.2 now. Every raise has bought
        something the player asked for by name — a B-section, a tune at the opening, cymbals, a boss
        piece, a counter-melody — and every one of them is more audio.

        ⚠️ **MEASURED BEFORE IT WAS MOVED, which is the whole of why it moves at all.** 272 seconds of
        audio, about 3.1 seconds of synthesis, spread one NOTE at a time across the title screen
        (0102) rather than as a job anybody waits for. The longest single note is guarded separately
        above and is nowhere near its own ceiling.

        ⚠️ **AND THE CHEAP SAVING WAS TAKEN FIRST**: `crash` went from eight bars to four, because it
        is punctuation with no harmony in it and four bars say everything eight did. What is left is
        material that cannot be shortened without a layer playing the wrong notes over the
        progression's second half.

        ⚠️ **THE THIRD RAISE MUST NOT BE A NUMBER.** Seven per-theme compositions are the next thing
        0113 asks for, and holding all of them resident is a multiple of this that no ceiling should
        absorb — the answer there is baking the level's own set at the boundary, which
        `src/content/themes.ts` already costs out. If a change wants more than 56 MB, it wants that
        mechanism instead.
      */
      const bytes = MUSIC_LAYERS.reduce((sum, layer) => sum + secondsOfLayer(layer) * SAMPLE_RATE * 4, 0);
      const mb = bytes / 1e6;
      expect(mb, `the loops are ${mb.toFixed(1)} MB resident, which is past what a desktop should hold for a backdrop`).toBeLessThan(56);
    });
  });

  it('THE REPORTED ONE: everything that explodes has a body, and not just a hiss', () => {
    /*
      ⚠️ **THE STRUCTURAL HALF OF `docs/decisions/0089-a-cue-has-a-body.md`, and it is the half a test
      can hold.** Reported from play: *"I don't like them at all — too tinny, way too Atari 2600"*, and
      the cause was that a cue was ONE oscillator with ONE envelope, which is a TIA voice. No
      arrangement of its numbers could have been anything else.

      ⚠️ **What is asserted is the RECIPE rather than any sound**: the four cues the player called out
      as needing to be *"more bass-y, more boomy/explosiony"* each need a filtered body and something
      low under it. Nothing here names a frequency the table also names — what it checks is that the
      parts exist, which is exactly the thing that was missing rather than mistuned.

      ⚠️ **A test cannot hear.** `node scripts/hear.mjs` is the other instrument and the verdict is a
      hand — `docs/decisions/0027-measure-the-picture-not-the-model.md`, in the one channel it names
      as having nothing to look at.
    */
    for (const kind of ['missile', 'kill', 'blast', 'bossDown', 'death'] as const) {
      const layers = CUES[kind].layers;
      expect(layers.length, `${kind} is not built out of layers, so it cannot have a body`).toBeGreaterThan(2);
      /*
        ⚠️ **THE BODY IS THE LOUDEST NOISE LAYER, AND NAMING IT TOOK TWO GOES.** The guard first read
        *some filtered noise layer has a highpass*, and `npm run prove` reported STILL GREEN when the
        highpass came off the body — the four-millisecond CRACK has one too, and it answered for a
        sentence about a part that had just lost its filter. The second attempt said *the longest*,
        and `missile` went red honestly: its longest noise layer is the DEBRIS tail, which is
        deliberately bright and deliberately does not darken.

        Loudest is what a body is. It is the part carrying the sound, the crack is a transient over
        it and the debris is a whisper after it, and that ordering holds for all four.
      */
      const noise = layers.filter((l) => l.wave === 'noise');
      expect(noise.length, `${kind} has no noise in it, so it has no body at all`).toBeGreaterThan(0);
      const body = noise.reduce((a, b) => (b.gain > a.gain ? b : a));
      expect(body.lowFrom, `${kind}'s body is unfiltered, which is a hiss and not an explosion`).toBeDefined();
      // A falling cutoff over noise IS an explosion. A rising one is a whoosh, and a flat one a hiss.
      expect(
        body.lowTo !== undefined && body.lowTo < body.lowFrom!,
        `${kind}'s body does not darken as it decays, which is what an explosion does`,
      ).toBe(true);
      // And the box is taken out, which is what "a tin shed heard from outside" was.
      expect(body.highFrom, `${kind}'s body keeps the 130-300Hz band that reads as boxy`).toBeDefined();
      const low = layers.filter((l) => l.wave === 'sine' && l.from <= 220 && (l.to || l.from) <= 220);
      expect(low.length, `${kind} has nothing low under it, so there is no boom to feel`).toBeGreaterThan(0);
    }
  });

  it('mixes so that MAX_VOICES of the loudest cues cannot clip', () => {
    /*
      ⚠️ **The arithmetic the master gain exists for, asserted rather than assumed.** Digital audio
      clips hard — it does not compress — so the worst case is not "loud", it is a crunch on the one
      step the game is at its busiest. The four loudest rows sounding together is that step.
    */
    const loudest = CUE_KINDS.map((k) => CUES[k].gain)
      .sort((a, b) => b - a)
      .slice(0, MAX_VOICES)
      .reduce((sum, gain) => sum + gain, 0);
    // The master gain is not exported as a number to compare against on purpose — what matters is
    // that the sum of the peaks is a value a master under 1 can bring inside full scale.
    expect(loudest, 'four cues at once already exceed full scale before the master gain').toBeLessThan(2);
  });
});

describe('the synthesiser', () => {
  it('is deterministic, so what the rig writes is what the game plays', () => {
    /*
      ⚠️ **The reason the noise comes from a seeded generator rather than from `Math.random`** —
      `docs/decisions/0021-one-stream-per-concern.md`. Without it, `scripts/hear.mjs` writes a file
      nobody can claim is the game's sound, and nothing below can assert anything about a sample.
    */
    const a = bakeCues();
    const b = bakeCues();
    for (let i = 0; i < a.length; i++) {
      for (let v = 0; v < a[i]!.length; v++) {
        expect(Array.from(a[i]![v]!.slice(0, 64)), `cue ${i} weight ${v} baked differently twice`).toEqual(
          Array.from(b[i]![v]!.slice(0, 64)),
        );
      }
    }
  });

  it('takes its stream from the cue’s NAME, so a thirteenth row cannot change the twelve above it', () => {
    /*
      ⚠️ **This is 0021's actual claim, and a positional stream would satisfy every other test here.**
      One shared generator — or one indexed by position — couples every cue to every cue before it, so
      inserting a row in the middle of `CUE_KINDS` would re-roll the noise in everything after it.
    */
    const baked = bakeCues();
    for (const kind of ['kill', 'blast', 'bossDown'] as const) {
      const alone = sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind));
      expect(Array.from(alone.slice(0, 32)), `${kind} is not rolled from its own name`).toEqual(
        Array.from(baked[indexOf(kind)]![0]!.slice(0, 32)),
      );
    }
  });

  it('0104 — and every WEIGHT of a cue is the same sound, drawing the same noise', () => {
    /*
      ⚠️ **THIS IS WHAT MAKES A FIGURE ONE SOUND PLAYED FOUR WAYS** —
      `docs/decisions/0104-the-gun-plays-a-figure.md`. `bakeCues` takes `stream(kind)` once per
      variant, and `Rng.stream` is a pure function of two strings that consumes nothing — so each
      weight gets an identically seeded generator and the four differ **only** in level. Four
      different noise draws would be four different sounds, which is a gun that changes timbre as it
      fires rather than one that accents.

      ⚠️ **Asserted as an exact RATIO rather than as *they look similar***, because that is the whole
      claim: sample for sample, a variant is its row's velocity times the full-weight one.
    */
    const baked = bakeCues();
    for (const kind of CUE_KINDS) {
      const weights = velocitiesOf(CUES[kind]);
      if (weights.length < 2) continue;
      const full = baked[indexOf(kind)]![0]!;
      weights.forEach((velocity, at) => {
        const variant = baked[indexOf(kind)]![at]!;
        expect(variant.length, `${kind} weight ${at} is a different length from weight 0`).toBe(full.length);
        for (let i = 0; i < full.length; i += 37) {
          const want = (full[i]! / weights[0]!) * velocity;
          expect(
            Math.abs(variant[i]! - want),
            `${kind} weight ${at} is a different SOUND from weight 0 at sample ${i}, not the same one quieter`,
          ).toBeLessThan(1e-6);
        }
      });
    }
  });

  it('never leaves the rails, because a sample past full scale is a crunch and not a loud sound', () => {
    for (const kind of CUE_KINDS) {
      const samples = sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind));
      let peak = 0;
      for (const s of samples) peak = Math.max(peak, Math.abs(s));
      expect(peak, `${kind} clips on its own, before anything else is playing`).toBeLessThanOrEqual(1);
      // And it is not silence dressed as a cue: the envelope has to actually reach the row's gain.
      expect(peak, `${kind} bakes to something inaudible`).toBeGreaterThan(CUES[kind].gain * 0.5);
    }
  });

  it('starts and ends at zero, because a buffer that stops mid-waveform clicks', () => {
    /*
      ⚠️ **A click is the one artefact that reads as a broken build rather than as a sound**, and both
      ends can produce one: an envelope that begins at full amplitude, and one that never falls.

      ⚠️ **The thresholds are tight ON PURPOSE, and they were loose enough to be useless first time.**
      At 0.02 this test passed with the end-of-buffer fade deleted, because the exponential decay had
      already brought the tail below it — a guard measuring a quantity that two mechanisms both
      satisfy cannot tell you which one is missing. `npm run prove` said STILL GREEN, the fade turned
      out to be the redundant one and is gone, and what is left is a number only the decay can meet.
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`.
    */
    for (const kind of CUE_KINDS) {
      const samples = sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind));
      expect(Math.abs(samples[0]!), `${kind} begins at full amplitude rather than attacking`).toBeLessThan(0.001);
      expect(Math.abs(samples[samples.length - 1]!), `${kind} is still sounding when its buffer ends`).toBeLessThan(0.01);
      /*
        ── AND THE ENVELOPE HAS TO DO THE WORK, WHICH THE RELEASE WOULD OTHERWISE HIDE ──────────────

        ⚠️ **`docs/decisions/0089-a-cue-has-a-body.md` put a fade back that 0072 had deleted**, and a
        fade satisfies *ends at zero* on its own — so with only the two assertions above, an envelope
        that never fell at all would pass. That is exactly the shape 0072's own probe caught in the
        other direction, and it would have come back the moment the release did.

        ⚠️ **Mean energy over the last quarter against the first, rather than a peak at a point.**
        The first draft compared the loudest sample after three quarters against the loudest anywhere
        and `bossDown` failed it — correctly, on its own terms: a boss coming apart is meant to still
        be rumbling at 1.3 seconds, and a guard that forbids that is a guard against the feature. What
        every cue must do, whatever its curve, is be quieter later than it was earlier.
      */
      const meanOver = (from: number, to: number): number => {
        let total = 0;
        for (let i = from; i < to; i++) total += Math.abs(samples[i]!);
        return total / Math.max(1, to - from);
      };
      const quarter = Math.floor(samples.length / 4);
      const early = meanOver(0, quarter);
      const late = meanOver(samples.length - quarter, samples.length);
      expect(late, `${kind} is as loud at its end as at its start — nothing is decaying`).toBeLessThan(early * 0.5);
    }
  });

  /*
    ── THE SPECTRUM, WHICH IS THE ONE THING THE SUITE COULD NEVER SEE ────────────────────────────

    ⚠️ **`docs/decisions/0089-a-cue-has-a-body.md`, and it is this file's first assertion about how
    anything SOUNDS.** Everything above measures the table or the envelope; a cue could satisfy all of
    it and still be the sound the play-test rejected. *"Too tinny… like a tin shed heard from
    outside"* is not a metaphor — it is a spectrum with a hump in the middle and nothing at either
    end, and that is a shape a number can see even though a test cannot hear.

    ⚠️ **A-weighted, because the ear is thirty decibels less sensitive at 50 Hz than at 2 kHz.** The
    first version of this measure was unweighted and reported that every cue was nothing but sub,
    which is true of the energy and false of the experience — and it would have passed a sound whose
    entire boom sat at 30 Hz, where a laptop speaker reproduces nothing. That was the actual defect in
    the first attempt at these cues.

    ⚠️ **It is still not a substitute for listening.** `node scripts/hear.mjs` writes the files and a
    hand gives the verdict — 0027 for the channel with nothing to look at.
  */
  // ⚠️ ,  and  moved to tests/spectrum.ts when 0095 needed the same
  // measure for the music. One description, not two — the helper is imported at the top of the file.

  /** The cues the report is about: *"more bass-y, more boomy/explosiony"*. */
  const EXPLOSIONS = ['kill', 'blast', 'bossDown', 'death'] as const;

  it('THE SHED: an explosion is spread across the spectrum rather than humped in the middle', () => {
    for (const kind of EXPLOSIONS) {
      const bands = spectrum(sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind)), SAMPLE_RATE);
      const wide = bands.filter((v) => v >= 0.25).length;
      const shape = bands.map((v, i) => `${BANDS[i]![2]} ${v.toFixed(2)}`).join(', ');
      /*
        Four of seven bands within 12 dB of the loudest. The table this replaced scored two or three
        on every explosion in it — one oscillator can only ever be in one place at a time, which is
        the whole of why the old cues sounded like one machine playing twelve notes.
      */
      expect(wide, `${kind} occupies ${wide} of ${BANDS.length} bands — ${shape}`).toBeGreaterThanOrEqual(4);
    }
  });

  it('and its weight is not in the top octave, which is what a filter is for', () => {
    /*
      ⚠️ **The counterweight, and it is the half that catches a missing LOWPASS.** Unfiltered noise
      scores brilliantly on spread and sounds like a hiss; what makes it an explosion rather than
      static is that the energy sits below the top of the range. Without this, deleting the filter
      would pass the guard above with room to spare.
    */
    for (const kind of EXPLOSIONS) {
      const bands = spectrum(sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind)), SAMPLE_RATE);
      const loudest = bands.indexOf(Math.max(...bands));
      expect(BANDS[loudest]![2], `${kind} is loudest in its ${BANDS[loudest]![2]} band, which is a hiss`).not.toBe('air');
      expect(BANDS[loudest]![2], `${kind} is loudest in its ${BANDS[loudest]![2]} band, which is a hiss`).not.toBe('hi');
    }
  });

  it('0102 — and the PLAYER’S OWN WEAPONS have a bottom, which is what *tinny* means', () => {
    /*
      `docs/decisions/0102-the-music-goes-somewhere.md`. Reported from play against the build 0099
      landed in: *"guns and rockets for the player need a deeper bassy tone still as they're too
      tinny and don't mesh with the background music well."*

      ⚠️ **0099 gave them their NOTE and this is their BODY, and the report moved from one to the
      other.** *"Too tinny"* is 0089's own word for the thing it fixed everywhere else — and the two
      cues 0089 spent least on are these: the pulse was three layers where a kill has five and a
      death six, with nothing below 55 Hz where the explosions reach 24.

      ⚠️ **THE SHED GUARD ABOVE DOES NOT COVER THEM.** It walks `EXPLOSIONS`, which is what 0089's
      report was about; the player's own weapons have never had a spectral assertion at all, and that
      is exactly the gap the next report arrived through.

      ⚠️ **A floor on the SUB band relative to the cue's own loudest**, which is how much weight it
      has rather than how loud it is — the same shape the shed guard uses, and immune to the mix
      moving. A-weighting suppresses the bottom heavily by design (`tests/spectrum.ts`), so these are
      small numbers and the RATIO is what carries meaning.

      ⚠️ **A fortieth, and it is chosen from what it must catch.** Measured: the pulse sits at 0.074
      of its loudest band and 0.008 with its sub layer deleted — an order of magnitude apart, and the
      bound is between them rather than beside either.
    */
    for (const kind of ['pulse', 'missile'] as const) {
      const bands = spectrum(sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind)), SAMPLE_RATE);
      const sub = bands[0]!;
      const shape = bands.map((v, i) => `${BANDS[i]![2]} ${v.toFixed(3)}`).join(', ');
      expect(sub, `the ${kind} has ${sub.toFixed(3)} of its weight in the sub band — ${shape}`).toBeGreaterThan(0.025);
    }
    /*
      ⚠️ **And the missile stays the heavier of the two**, which is 0051's claim about what the second
      auto-weapon IS — *slower, heavier, worth three of the pulse* — and is the thing a player has to
      be able to pick out of a screen full of the lighter one. A pulse given more bottom than the
      missile would answer this report by breaking that one.
    */
    const weight = (kind: 'pulse' | 'missile'): number =>
      spectrum(sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind)), SAMPLE_RATE)[0]!;
    expect(weight('missile'), 'the pulse is heavier at the bottom than the missile').toBeGreaterThan(weight('pulse'));
  });

  it('0104 — THE REPORTED ONE: an auto-weapon’s cue finishes before its own next volley', () => {
    /*
      ⚠️ **Reported from play: *"the gun fire doesn't fit in with the music at all, it's technically on
      beat, but it also doesn't fit a great sound experience."*** The pulse cue was **0.110s** and the
      gap between volleys reaches **0.067s**, so from the second weapon pickup onward the gun sounded
      110% of the time and 165% at the cap. A sound with no gap in it is not a rhythm — it is a
      continuous tone with bumps, and no amount of putting it *on* the beat could have made a beat
      audible inside it.

      ⚠️ **`hold` DOES NOT HOLD THIS AND WAS NEVER MEANT TO.** It is 2 steps against a cue 6.6 steps
      long, and every one of the twelve rows is longer than its hold — correctly, because the field
      exists to stop a flam and two kills close together should both sound. What makes the two auto
      weapons different is that the player cannot choose not to fire them
      (`src/content/actions.ts` bans a fire action), so their cue is the one sound that must fit.

      ⚠️ **THIS IS 0035's RULE FOR THE EYE, WRITTEN FOR THE EAR FOR THE FIRST TIME.**
      `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` requires the impact flash to
      finish before the next hit lands — *"firing faster than the flash can resolve makes damage
      unreadable"* — and `IMPACT_FLASH_STEPS` has been held against the fire rate ever since. The
      identical claim about the sound was never made, and it was false the whole time.

      ⚠️ **Driven off the SHIP'S LADDER rather than against a number typed here**, so a retuned
      `firePerBeat` or `missilePerBeat` fails this rather than quietly reintroducing the drone —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`, and the same cross-file shape
      `tests/bombs.test.ts` uses for a blast's reach and its art.
    */
    for (const ship of SHIP_KINDS) {
      const row = SHIPS[ship];
      const fastest = Math.min(...row.firePerBeat.map((_unused, tier) => fireEveryAt(row, tier)));
      const gap = fastest / STEPS_PER_SECOND;
      expect(
        cueSeconds(CUES.pulse),
        `the ${ship} pulse sounds for ${cueSeconds(CUES.pulse).toFixed(3)}s and fires every ${gap.toFixed(3)}s at its ` +
          `fastest rung, so the gun never stops making a noise`,
      ).toBeLessThanOrEqual(gap);

      const soonest = Math.min(
        ...row.missilePerBeat.map((_unused, tier) => MISSILE_BEAT_RATIO * missileEveryAt(row, tier)),
      );
      const missileGap = soonest / STEPS_PER_SECOND;
      expect(
        cueSeconds(CUES.missile),
        `the ${ship} missile sounds for ${cueSeconds(CUES.missile).toFixed(3)}s and launches every ` +
          `${missileGap.toFixed(3)}s at its fastest rung, so the counter-beat overlaps itself`,
      ).toBeLessThanOrEqual(missileGap);
    }
  });

  it('bakes each cue to the length its row asks for, and none past the ceiling', () => {
    const baked = bakeCues();
    expect(baked.length, 'the bake and the table disagree about how many cues there are').toBe(CUE_KINDS.length);
    CUE_KINDS.forEach((kind, i) => {
      expect(baked[i]!.length, `${kind} baked a different number of weights from its figure`).toBe(
        velocitiesOf(CUES[kind]).length,
      );
      for (const variant of baked[i]!) {
        expect(variant.length, `${kind} baked to the wrong length`).toBe(
          Math.round(cueSeconds(CUES[kind]) * SAMPLE_RATE),
        );
        expect(variant.length, `${kind} is past the ceiling in samples`).toBeLessThanOrEqual(MAX_CUE_SAMPLES);
      }
    });
  });
});

describe('the speaker decides WHEN, and it is the half that is arithmetic', () => {
  it('says nothing at all when the player has turned it off', () => {
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.setOn(false);
    for (const kind of CUE_KINDS) speaker.play(kind);
    expect(heard, 'sound is off and the speaker sounded anyway').toEqual([]);
  });

  it('0104 — strikes a cue by WHERE IN THE BEAT it lands, not by how many have gone before', () => {
    /*
      ⚠️ **THE REPORTED ONE, and the difference between the two models is the whole decision** —
      `docs/decisions/0104-the-gun-plays-a-figure.md`. A counter that advances per sounding gives the
      same answer as this for a gun at a constant cadence with nothing dropped, and diverges for ever
      the first time either is untrue — a cadence changes four times up the ladder and a volley the
      pool refuses is silent. Then the accents slide off the bar and stay off, which is 0094's *in
      time is not in phase* one layer up.

      ⚠️ **Driven with a SKIP in it, because that is the case the two models disagree about.** The
      cue is played on some sixteenths and not others; a counter would hand out 0, 1, 2, 3 to
      whichever four happened to sound, and the bar says otherwise.
    */
    const { out, struck } = recorder();
    const speaker = makeSpeaker(out);
    /*
      ⚠️ **Every step is driven, not only the ones that sound**, because the speaker's hold runs on its
      own clock and a test that steps once per sounding would be measuring the hold instead. That is
      also what the game does: `world.onTick` ticks the speaker on every step whatever happens.
    */
    const firesOn = new Set([0, 2, 3, 4, 5, 7]);
    const want: number[] = [];
    for (let sixteenth = 0; sixteenth < 8; sixteenth++) {
      for (let i = 0; i < FIRE_GRID; i++) speaker.step(sixteenth * FIRE_GRID + i);
      if (!firesOn.has(sixteenth)) continue;
      speaker.play('pulse');
      want.push(sixteenth % velocitiesOf(CUES.pulse).length);
    }
    expect(struck, 'the gun accents by count rather than by where in the bar the shot lands').toEqual(want);
    /*
      ⚠️ **And a COUNTER would have produced 0,1,2,3,0,1 over the same drive** — six soundings numbered
      in order. The two models agree only when nothing is ever skipped, which is why the skips are here.
    */
    expect(want, 'the drive stopped exercising the difference between the two models').not.toEqual([0, 1, 2, 3, 0, 1]);
    /*
      ⚠️ **And the same steps in a different ORDER of soundings give the same weights**, which is what
      *a property of when* means and what a counter can never satisfy.
    */
    expect(variantAt(4, 0), 'the downbeat is not the first weight').toBe(0);
    expect(variantAt(4, FIRE_GRID * 4), 'the next beat did not come back to the downbeat').toBe(0);
    expect(variantAt(4, FIRE_GRID * 2), 'the half-beat is not the third weight').toBe(2);
    // A figure shorter than the beat wraps rather than running off the end.
    expect(variantAt(2, FIRE_GRID * 3), 'a two-entry figure did not wrap inside the beat').toBe(1);
    // A row with no figure has exactly one weight and always takes it.
    expect(variantAt(1, FIRE_GRID * 3), 'a cue with no figure was struck at a weight it never baked').toBe(0);
  });

  it('0104 — and a cue with no figure is untouched, which is eleven of the twelve rows', () => {
    /*
      The mechanism is opt-in: a row without one bakes a single buffer at full weight and is asked for
      index 0 for ever, which is byte for byte what every cue did before this decision.
    */
    const { out, struck } = recorder();
    const speaker = makeSpeaker(out);
    for (const kind of CUE_KINDS) {
      if (CUES[kind].figure !== undefined) continue;
      speaker.step(FIRE_GRID * 3);
      speaker.play(kind);
    }
    expect(new Set(struck), 'a cue with no figure was struck at something other than full weight').toEqual(new Set([0]));
  });

  it('sounds a cue once per step however many times the step asks for it', () => {
    /*
      Five barrels of a volley are one sound, and so are two enemies firing on the same step. The
      frame gates the pulse itself (one cue per volley), and this is the general answer underneath it.
    */
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    speaker.play('threat');
    speaker.play('threat');
    speaker.play('threat');
    expect(heard).toEqual([indexOf('threat')]);
  });

  it('holds a repeat for the row’s own number of steps, which is what stops a flam', () => {
    /*
      ⚠️ **The failure is not loudness, it is smearing.** Two identical cues 17ms apart are not heard
      as two events — they are heard as one with a broken attack.
    */
    /*
      ⚠️ **DRIVEN ON `hit` AND IT USED TO BE `kill`, WHICH IS 0027 RATHER THAN A TIDY-UP.** 0104 puts
      the kill on the sixteenth grid, and a gridded cue can sound at most once per `FIRE_GRID` — six
      steps against a hold of two. Driving this with `kill` would still pass and would be **measuring
      the grid**, so the guard over the hold would have quietly stopped standing over anything. `hit`
      is deliberately not gridded (0035 needs it dense) and has the same hold of two.
    */
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    const hold = CUES.hit.hold;
    expect(hold, 'the hit cue no longer holds, so this test asserts nothing').toBeGreaterThan(1);
    expect(CUES.hit.onGrid, 'the hit cue was gridded, so this now measures the grid and not the hold').not.toBe(true);
    speaker.step();
    speaker.play('hit');
    for (let i = 1; i < hold; i++) {
      speaker.step();
      speaker.play('hit');
    }
    expect(heard.length, 'a held cue retriggered inside its own hold').toBe(1);
    speaker.step();
    speaker.play('hit');
    expect(heard.length, 'the hold never expired, so the cue is heard once and never again').toBe(2);
  });

  it('0104 — a gridded cue waits for the next sixteenth, and waits at most one', () => {
    /*
      ⚠️ **THE REPORTED ONE: *"enemy explosions should pulse with the beat."*** A kill happens when a
      bullet ARRIVES, which is a function of how far away the thing was — so the loudest repeated
      event in a level landed on an arbitrary sixtieth of a second while every cadence around it was
      on a sixteenth. `docs/decisions/0099-the-cues-are-in-the-key.md` assumed the opposite in as many
      words and tuned only the harmony.

      ⚠️ **The bound is what makes it safe against 0036**: the picture is immediate and the sound is
      never more than `FIRE_GRID` steps behind it. That is a tenth of a second at 150 BPM, and it is
      asserted rather than described.
    */
    for (let asked = 1; asked <= FIRE_GRID; asked++) {
      const { out, heard } = recorder();
      const speaker = makeSpeaker(out);
      let sounded = -1;
      for (let step = 1; step <= FIRE_GRID * 3; step++) {
        speaker.step(step);
        if (step === asked) speaker.play('kill');
        if (heard.length > 0 && sounded < 0) sounded = step;
      }
      expect(sounded, `a kill asked for at step ${asked} never sounded at all`).toBeGreaterThan(0);
      expect(sounded % FIRE_GRID, `a kill asked for at step ${asked} sounded at ${sounded}, off the grid`).toBe(0);
      expect(
        sounded - asked,
        `a kill asked for at step ${asked} waited ${sounded - asked} steps, which is more than one sixteenth`,
      ).toBeLessThanOrEqual(FIRE_GRID);
    }
  });

  it('0104 — ducks the music for a cue that SOUNDED, and never for one the cap refused', () => {
    /*
      ⚠️ **THE FAILURE THIS IS WRITTEN FROM: ducking on the ASK.** A cue the hold or the voice cap
      refused is one the player never hears, and pushing the bed down for it is the track getting out
      of the way of nothing — audible as the music dipping at random on the busiest steps, which is
      the worst possible place to introduce a mystery.

      ⚠️ **And it is the one thing about the duck a unit can check.** Everything else about it — the
      depth, the shape, the recovery — is `AudioParam` automation on a real context, which is
      `tests/sound.browser.test.ts`'s ground and nothing here can hear.
    */
    const { out, ducked, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    // Four different cues fill the cap; the fifth and sixth are refused. `hit` and `threat` carry no
    // duck at all, so what lands in `ducked` can only come from the two that do.
    speaker.play('bomb');
    speaker.play('hit');
    speaker.play('threat');
    speaker.play('chime');
    speaker.play('missile');
    expect(heard.length, 'the cap did not refuse anything, so this measures nothing').toBe(MAX_VOICES);
    expect(ducked, 'the music ducked for a cue nobody heard').toEqual([]);

    /*
      And one that does sound ducks by exactly its row's depth. `death` is gridded, so it is asked for
      on one step and driven to the next sixteenth before anything is asserted — which is also the
      proof that the duck rides the SOUNDING and not the ask: nothing lands in `ducked` until the
      flush.
    */
    const fresh = recorder();
    const second = makeSpeaker(fresh.out);
    second.step(1);
    second.play('death');
    expect(fresh.ducked, 'the music ducked when the cue was asked for rather than when it sounded').toEqual([]);
    for (let step = 2; step <= FIRE_GRID; step++) second.step(step);
    expect(fresh.heard.length, 'the death never sounded, so the duck cannot be measured').toBe(1);
    expect(fresh.ducked, 'a cue that sounded did not duck by its row’s own depth').toEqual([CUES.death.duck]);
  });

  it('0104 — and the gun never ducks, whatever it is doing', () => {
    /*
      ⚠️ **Auto-fire cannot be switched off** — `src/content/actions.ts` bans a fire action — so a
      pulse that ducked would hold the bed down for the whole game. That is *"background too quiet"*
      returning as a consequence of the fix for *"they don't mesh"*, and it is the one way this
      mechanism could undo the other half of the same decision.
    */
    for (const kind of ['pulse', 'missile', 'threat', 'hit'] as const) {
      expect(CUES[kind].duck, `${kind} ducks the music, and it fires too often to be allowed to`).toBeUndefined();
    }
    /*
      ── AND THE OTHER HALF WAS A LIST OF FOUR NAMES, WHICH TWO DECISIONS HAVE NOW MOVED ───────────

      ⚠️ **It read `expect(['kill', 'bossDown', 'blast', 'death']).toContain(kind)`** — the four the
      mix had measured at 8 dB or more over the bed. `docs/decisions/0109-a-death-is-a-drum.md` took
      the duck off `kill` and `docs/decisions/0111-a-boss-has-one-idea.md` put one on `bossPhase`, so
      the list was wrong in both directions inside two decisions. **A hand-kept list of names is the
      second description this project keeps finding**, and it was standing in for a rule nobody had
      written down.

      ⚠️ **THE RULE IS *A CUE DUCKS EXACTLY WHEN IT OUTLASTS A BEAT*, and it is the same rule 0109
      stated from the other end.** A cue shorter than a beat is punctuation — two of them are two
      events, the ear places them in the bar, and the music must not move for them. A cue longer than
      a beat is an event that takes the bar over, and the music getting out of the way is what makes
      it read as one. **Both directions are held**, which is what makes it a rule rather than a
      description: a long cue that did not duck would be a boss coming apart underneath the music, and
      a short one that did would be the bed turned down for punctuation.

      ⚠️ **It is derived and there is nothing to keep in step.** Driven over the whole table it
      separates the nine short cues from the four long ones exactly, and a thirteenth row is judged by
      what it is rather than by whether somebody remembered to add it here.
    */
    for (const kind of CUE_KINDS) {
      const long = cueSeconds(CUES[kind]) > BEAT_SECONDS;
      expect(
        CUES[kind].duck !== undefined,
        long
          ? `${kind} lasts ${cueSeconds(CUES[kind]).toFixed(2)}s — over a beat — and the music plays straight through it`
          : `${kind} lasts ${cueSeconds(CUES[kind]).toFixed(2)}s and ducks the music, which is the bed turned down for punctuation`,
      ).toBe(long);
      if (CUES[kind].duck === undefined) continue;
      expect(CUES[kind].duck, `${kind} ducks the bed by more than half, which is a hole and not a dip`).toBeLessThan(0.5);
    }
  });

  it('0104 — and a cue that is NOT gridded still sounds on the step it was asked for', () => {
    // The mechanism is opt-in and six of the twelve rows decline it. `hit` is the one 0035 depends on.
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step(1);
    speaker.play('hit');
    expect(heard, 'a cue with no onGrid was made to wait for the grid anyway').toEqual([indexOf('hit')]);
  });

  it('starts at most MAX_VOICES on one step, which is the frame budget’s audio twin', () => {
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    for (const kind of CUE_KINDS) speaker.play(kind);
    expect(heard.length, 'the voice cap did not hold, so a busy step allocates without limit').toBe(MAX_VOICES);
  });

  it('and the cap counts per step rather than for ever', () => {
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    for (const kind of CUE_KINDS) speaker.play(kind);
    speaker.step();
    // ⚠️ `bomb` rather than `death`, and 0104 is why: a gridded cue would wait for the sixteenth
    // instead of sounding on this step, so the drive would be measuring the grid and not the cap.
    speaker.play('bomb');
    expect(heard.length, 'the cap leaked across a step boundary').toBe(MAX_VOICES + 1);
  });

  it('does not let a cue held back spend the step’s budget anyway', () => {
    /*
      ⚠️ **The failure: the cap counting DROPS rather than voices.** Four retriggers of one held cue
      would then fill the step's budget and lock out the different cues behind them — the voice cap
      causing precisely the failure it was added to prevent, and doing it only on the busiest steps.

      ⚠️ **This test replaced one asserting the two checks happen in a particular ORDER, and the
      probe is why.** Breaking the order on purpose left the suite green, correctly: whichever check
      runs first, a held repeat returns before `voices` moves, so the ordering cannot be observed. The
      claim was false, the comment in `src/app/sound.ts` said it anyway, and what is actually
      load-bearing is this — `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching a guard
      that fires on nothing.
    */
    /*
      ⚠️ **All four are cues 0104 left OFF the grid, and that is deliberate.** The claim is about what
      a repeat does to the step's budget, so every cue in the drive has to be one that spends the
      budget on this step — a gridded one would be waiting rather than competing, and the guard would
      pass while measuring nothing.
    */
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    speaker.play('hit');
    for (let i = 0; i < MAX_VOICES + 4; i++) speaker.play('hit');
    // Every one of these is a different cue, so all of them are inside the cap — unless the
    // repeats above were counted.
    speaker.play('threat');
    speaker.play('bomb');
    speaker.play('chime');
    expect(heard, 'repeats of one cue ate the budget three different cues needed').toEqual([
      indexOf('hit'),
      indexOf('threat'),
      indexOf('bomb'),
      indexOf('chime'),
    ]);
  });

  it('and says nothing before a gesture has unlocked the context', () => {
    const { out, heard } = recorder(false);
    const speaker = makeSpeaker(out);
    speaker.step();
    speaker.play('pulse');
    expect(heard, 'the speaker played into a context that does not exist yet').toEqual([]);
  });
});

describe('a comfort setting cannot reach the game', () => {
  /**
   * ⚠️ **`src/app/frame.ts` is the interesting entry, exactly as it is in `tests/style.test.ts`.** It
   * is the file that NAMES cues, so it must be able to see `src/content/cues.ts` — and it is also the
   * file that decides what hits what, so it must never see whether the player is listening.
   */
  const FORBIDDEN = [...filesUnder('src/sim'), 'src/app/frame.ts', 'src/app/boss.ts'];

  it('finds the files it is scanning, so it cannot pass by scanning nothing', () => {
    expect(FORBIDDEN.length, 'the scan found no simulation files — the walk is broken').toBeGreaterThan(5);
    for (const file of FORBIDDEN) expect(read(file).length, `${file} is empty or missing`).toBeGreaterThan(0);
  });

  it('THE BAN: nothing that decides an outcome may import the sound setting', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`: a player who turns the sound down
      must not thereby be playing a different game. A cosmetic setting cannot be made safe by being
      monotone — there is no ordering in which silence is easier — so it is made safe by being
      unreachable from the code that decides anything.
    */
    const offenders = FORBIDDEN.filter((file) => stripComments(read(file)).includes('content/sound.ts'));
    expect(
      offenders,
      `these decide what happens and can see the sound setting: ${offenders.join(', ')}\n` +
        'A step that can read whether the player is listening is a step that can branch on it.',
    ).toEqual([]);
  });

  it('and the frame emits the same cues either way, because it has no speaker to ask', () => {
    // The structural half of the same claim: the frame reports, `src/app/sound.ts` decides.
    const frame = stripComments(read('src/app/frame.ts'));
    expect(frame.includes('app/sound.ts'), 'the frame reached for the speaker').toBe(false);
    expect(frame.includes('SOUNDS'), 'the frame can see the sound setting table').toBe(false);
  });
});

describe('every cue is played by something, and every cue the frame plays exists', () => {
  it('no cue in the table is dead weight', () => {
    /*
      ⚠️ **A row nobody plays is worse than a missing sound**, because it looks like coverage. The
      files allowed to name a cue are the frame, which reports what happened, and the shell, which
      owns the one cue that is not a model event.

      ⚠️ **`src/app/boss.ts` IS THE FRAME, and this list was the only place in the repository that
      disagreed** — `docs/decisions/0114-the-fight-is-a-different-piece.md`. `FORBIDDEN` twelve lines
      up already reads `['src/app/frame.ts', 'src/app/boss.ts']` as one thing for 0024's ban, and
      `src/app/boss.ts` says at the top why it is a separate file: *"it could have gone inside
      `frame.ts`, and the reason it did not is that a boss is the first thing in the game with a state
      machine in it."* A readability split is not a permission boundary.

      ⚠️ **It was found by the boss having no attack sound at all.** The fix put `onCue('bossShot')`
      at the boss's own fire gate — the only place that knows a volley left, once per volley rather
      than once per bullet — and this guard reported the new cue as dead weight because it was not
      looking at the file the frame keeps its boss in.
    */
    const sources = read('src/app/frame.ts') + read('src/app/boss.ts') + read('src/app/mount.ts');
    const unplayed = CUE_KINDS.filter((kind) => !sources.includes(`'${kind}'`));
    expect(unplayed, `these cues are in the table and nothing ever plays them: ${unplayed.join(', ')}`).toEqual([]);
  });
});

describe('the chooser is the table', () => {
  it('offers exactly the settings that exist, in the table’s order', () => {
    const choice = SCREENS.title.choices.find((c) => c.name === 'sound');
    expect(choice, 'the title screen offers no sound setting at all').toBeDefined();
    expect(choice!.options.map((o) => o.label)).toEqual(SOUND_KINDS.map((kind) => SOUNDS[kind].title));
  });

  it('and says what each one is, because nothing else on the screen will', () => {
    for (const kind of SOUND_KINDS) {
      expect(SOUNDS[kind].title.length, `${kind} has no name`).toBeGreaterThan(0);
      expect(SOUNDS[kind].hint.length, `${kind} does not say what it does`).toBeGreaterThan(0);
    }
  });
});

describe('the sound setting on the settings slice', () => {
  const soundOf = (state: ReturnType<typeof reduce>): string => state.settings.sound;
  const pick = (sound: (typeof SOUND_KINDS)[number]): Action => ({ slice: 'settings', type: 'sound', sound });

  it('starts on, because 0024 says there is one game and it is the loud one', () => {
    expect(soundOf(initialState)).toBe(DEFAULT_SOUND);
    expect(DEFAULT_SOUND).toBe('on');
  });

  it('changes to either setting in the table', () => {
    for (const kind of SOUND_KINDS) expect(soundOf(reduce(initialState, pick(kind)))).toBe(kind);
  });

  it('preserves identity when nothing moved, which is what stops a chime per press', () => {
    // `src/app/mount.ts` sounds the chime on a real change. A slice rebuilt on every dispatch would
    // blip at the player each time they pressed the option that was already on.
    expect(reduce(initialState, pick(DEFAULT_SOUND)), 'choosing the setting already on rebuilt the state').toBe(initialState);
  });

  it('and does not take the style with it, which a slice of two fields makes possible for the first time', () => {
    /*
      ⚠️ **The bug a one-field slice could not have had.** `return { sound }` type-checks against a
      `Record` over `SettingName` only while there is one name; with two, dropping the spread silently
      resets the other setting — and the player's look would vanish every time they touched the sound.
    */
    const retro = reduce(initialState, { slice: 'settings', type: 'style', style: 'retro' });
    const quiet = reduce(retro, pick('off'));
    expect(quiet.settings.style, 'changing the sound threw the style away').toBe('retro');
    expect(quiet.settings.sound).toBe('off');
  });

  it('is untouched by a run, on the same terms the style is', () => {
    const chosen = reduce(initialState, pick('off'));
    const played = reduce(reduce(chosen, { slice: 'run', type: 'begin', difficulty: 'savior' }), {
      slice: 'screen',
      type: 'show',
      screen: 'playing',
    });
    expect(soundOf(played), 'starting a run reset the sound setting').toBe('off');
  });
});

describe('what the real frame actually says out loud', () => {
  /**
   * ⚠️ **The whole game, driven, rather than a fixture calling `onCue` by hand.** Every claim below is
   * about a relationship between a cue and an event, and the only honest way to ask is to run the
   * level that produces the event — `docs/decisions/0015-the-layer-ladder.md`'s promise that a stage
   * plays to completion without a browser is what makes it affordable.
   */
  it('says one thing per volley and not one per barrel', () => {
    /*
      ⚠️ **The specific failure: five identical clicks on one step.** A fully upgraded weapon fires
      five barrels at once (`src/content/pickups.ts`), and the obvious place to put the cue is beside
      the spawn — inside the loop, ungated.
    */
    const { world, cues } = playableWorld(LEVELS.approach);
    const frame = new GameFrame(world);
    // The strongest loadout's barrel count, applied to the resolved weapon rather than by collecting
    // upgrades: what is being measured is the volley, not how the ship came by one.
    const barrels = 5;
    world.weapon = { ...world.weapon, shots: barrels };
    const before = world.playerShots.size;
    /*
      ⚠️ **Forty steps, and the number is bounded at both ends.** `SHIPS.proof` fires every nine, so
      it is four volleys; and the leading cull is well over sixty steps away at this speed, so the
      pool only grows — which is what makes a size difference a spawn count rather than a net.
    */
    for (let i = 0; i < 40; i++) frame.step();
    const fired = world.playerShots.size - before;
    const pulses = cues.filter((c) => c === 'pulse').length;
    expect(fired, 'the ship did not fire at all, so this measures nothing').toBeGreaterThan(barrels);
    expect(pulses, 'the ship fired and said nothing').toBeGreaterThan(0);
    expect(pulses * barrels, 'a cue per barrel rather than per volley — five clicks on one step').toBe(fired);
  });

  it('THE ONE THAT WOULD BE EATEN BY THE CAP: a boss dying is heard, through a real speaker', () => {
    /*
      ⚠️ **This is the assertion the cue-ordering exists for.** `src/app/sound.ts` allows four voices
      a step and drops the rest, and the boss's cue is emitted at the very bottom of the step —
      behind the pulse, the threat and the hit. Asserting that the frame ASKED for it would be green
      with the loudest event in the game inaudible; so the speaker is real, the cap is on, and what is
      checked is what came out.
    */
    const { world, cues } = playableWorld(LEVELS.approach);
    const frame = new GameFrame(world);
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    // Both, and in this order: what the frame ASKED for, and what a real speaker let through. The
    // gap between the two lists is the whole subject of this test, so replacing the fixture's
    // recorder rather than wrapping it would leave only the half that cannot fail.
    const report = world.onCue;
    world.onCue = (kind): void => {
      report(kind);
      speaker.play(kind);
    };
    world.onTick = speaker.step;

    /*
      Straight to the boss, with the rest of the level turned off so the fight is the only thing on
      the field — and the boss is killed by the player's own shots, because the cue hangs off the
      pool emptying and a boss released by hand would not exercise the collision that empties it.

      ⚠️ **The ship is placed against the NEW camera, and leaving that out is why this test failed
      first time.** `flyShip` clamps the ship into its box, so a camera teleported six thousand units
      forward leaves the ship pinned at the box's LEADING edge — in front of the boss's station, with
      every shot travelling away from it. The fight was unwinnable and nothing said why.
    */
    world.nextWave = world.level.waves.length;
    world.nextPickup = world.level.pickups.length;
    world.cameraAlong = world.level.bossAt;
    world.ship.along = world.cameraAlong + SHIP_START_ALONG;
    world.ship.prevAlong = world.ship.along;
    // The fixture does not respawn, and a ship that dies mid-fight stops firing.
    world.ship.health = 999;
    let steps = 0;
    while (!world.bossBeaten && steps < 60 * 60) {
      // A boss carries 150 health against a base weapon; hold it at one rather than flying a
      // two-minute fight, and let the collision be the thing that empties the pool.
      if (world.bossPool.size > 0) world.bossPool.at(0).health = 1;
      frame.step();
      steps++;
    }
    expect(world.bossBeaten, 'the boss never died, so nothing here was measured').toBe(true);
    expect(cues, 'the frame never even asked for the boss cue').toContain('bossDown');
    /*
      ⚠️ **A SIXTEENTH MORE OF THE LEVEL, BECAUSE `bossDown` IS GRIDDED NOW** — 0104. The loop above
      stops on the step the boss dies, and a gridded cue sounds at the next grid step rather than the
      one it was asked for, so without this the test would be asserting that a cue nothing had flushed
      yet had already been heard.

      ⚠️ **The game cannot reach the state this drive did.** `world.onTick` fires on every step on
      every screen — that is what it was split out of `onIdle` to be (0063) — and a boss death is
      followed by `BOSS_DEATH_STEPS` of the level carrying on (0062), which is 96 steps against a
      six-step grid. What is being worked around is the harness stopping, not a hole in the mechanism.
    */
    for (let i = 0; i < FIRE_GRID; i++) frame.step();
    expect(heard, 'the boss died and the voice cap ate the sound of it').toContain(indexOf('bossDown'));
    /*
      ⚠️ **And the ordinary kill cue is NOT what the boss got.** Nothing else died in this fight, so
      a `kill` here would mean the boss death was announced twice — which is what would push the
      boss's own cue past the voice cap on the one step it matters.
    */
    expect(cues, 'the boss death also fired the ordinary kill cue, which is what the cap then eats').not.toContain('kill');
  });

  it('and a death is heard, which is the other event nothing may swallow', () => {
    const { world, cues } = playableWorld(LEVELS.approach);
    const frame = new GameFrame(world);
    world.ship.health = 1;
    // Something to fly into, put exactly where the ship is.
    const enemy = world.enemies.spawn()!;
    enemy.along = world.ship.along;
    enemy.across = world.ship.across;
    enemy.prevAlong = world.ship.along;
    enemy.prevAcross = world.ship.across;
    enemy.damage = 5;
    enemy.radius = 4;
    for (let i = 0; i < 4 && !cues.includes('death'); i++) frame.step();
    expect(cues, 'the ship was destroyed and the picture said so in silence').toContain('death');
  });
});

describe('0109 — a death punctuates the music rather than getting it out of the way', () => {
  /*
    `docs/decisions/0109-a-death-is-a-drum.md`. Reported from play: *"the player weapons are definitely
    feeling more like part of the music now, but the enemy deaths don't, they're on their own sound
    band at the moment and instead of punctuating the music, they detract from it."*

    ⚠️ **HALF OF 0104 IS CONFIRMED AND HALF IS REPORTED BACK.** That decision gave the pulse a `figure`
    and a length that fits its own cadence, and gave `kill` `onGrid` and a `duck` — neither of the two
    that worked.
  */

  /** How many bodies a second the busiest authored level sends, which is how often `kill` sounds. */
  const bodiesPerSecond = Math.max(
    ...LEVEL_KINDS.map((kind) => {
      const level = LEVELS[kind];
      const bodies = level.waves.reduce((sum, wave) => sum + wave.count, 0);
      // The camera covers `SCROLL_PER_STEP × STEPS_PER_SECOND` units a second, so a level's length in
      // seconds is where its boss is. `src/content/levels.ts` states the same arithmetic in prose.
      return bodies / (level.bossAt / (SCROLL_PER_STEP * STEPS_PER_SECOND));
    }),
  );

  /** Trigger to recovered, in seconds — the number the duck's own comment did not add up. */
  const duckEnvelope = DUCK_DOWN_SECONDS + DUCK_HOLD_SECONDS + DUCK_UP_SECONDS;

  it('THE REPORTED ONE: nothing the level script schedules by the hundred pushes the music down', () => {
    /*
      ⚠️ **THE ARITHMETIC IS THE WHOLE FINDING.** `src/app/music.ts` says of the duck's hold that *"the
      bed is back up by the time the next gridded cue can land"* — which counts the hold and forgets
      the return. Trigger to recovered is `DOWN + HOLD + UP`, **0.445 s**, and the busiest level sends
      **2.33 bodies a second**: `2.33 × 0.445` is **104%** of a level. The bed was not being ducked for
      an explosion; it was being held down and let up briefly between them.

      ⚠️ **0104 REFUSED THIS FOR THE GUN IN AS MANY WORDS** — *"a pulse that ducked would hold the bed
      down for the whole game"* — and the same sentence reaches `kill` the moment anybody multiplies
      the two numbers. The gun fires four times as often and the duck does not care: anything past
      about twice a second saturates it.

      ⚠️ **WRITTEN AS THE CONDITION AND NOT AS THE ANSWER.** If a later decision halves a level's
      density this permits a duck again, which is correct — what is being held is *the music is not
      turned down by a thing that happens continuously*, not *`kill` has no duck*.
    */
    const share = bodiesPerSecond * duckEnvelope;
    expect(share, 'a level no longer sends enough bodies for this to be measuring anything').toBeGreaterThan(0.5);
    expect(
      CUES.kill.duck,
      `a level sends ${bodiesPerSecond.toFixed(2)} bodies a second and a duck takes ${duckEnvelope.toFixed(3)}s to ` +
        `recover — ducking for each one covers ${(share * 100).toFixed(0)}% of the level, which is the music turned down`,
    ).toBeUndefined();
  });

  it('and a punctuation mark is shorter than the beat it lands on, so two of them are two events', () => {
    /*
      ⚠️ **IT WAS 0.46s, WHICH IS 1.15 BEATS.** At two a second the explosions overlapped themselves
      continuously — the same defect 0104 measured on the gun (*"sounding 110% of the time and 165% at
      full rate… a continuous tone with bumps in it"*) and fixed there and not here.

      ⚠️ **A BEAT AND NOT THE GRID.** `FIRE_GRID` is a sixteenth, 0.1 s, which no cue with a body could
      fit inside; what makes a run of kills read as rhythm rather than rumble is that each one is over
      before the next beat, so the ear places them. `hold` cannot do this job — it is 2 steps, and
      0104 records that every row is deliberately longer than its own hold.

      ⚠️ **Held over the cues the LEVEL schedules**, which is the category the rule is about: a bomb, a
      boss coming apart and the ship being lost are all events the player can count, and a long tail is
      what those are for.
    */
    const scheduled = CUE_KINDS.filter((kind) => CUES[kind].twin === 'debris-burst');
    expect(scheduled.length, 'nothing in the table is the cue a level schedules, so this measured nothing').toBeGreaterThan(0);
    for (const kind of scheduled) {
      expect(
        cueSeconds(CUES[kind]),
        `${kind} lasts ${cueSeconds(CUES[kind]).toFixed(3)}s against a beat of ${BEAT_SECONDS}s, and a level sends ` +
          `${bodiesPerSecond.toFixed(2)} of them a second — they overlap into a rumble`,
      ).toBeLessThan(BEAT_SECONDS);
    }
  });

  it('and it is struck at more than one weight, which is the field 0104 gave the gun and not this', () => {
    /*
      ⚠️ **The second most repeated sound in the game was the last one struck identically every time.**
      0102's finding — *"identical repetition at a fixed interval is not LIKE a metronome, it is the
      definition of one"* — is exactly as true of an explosion as of a hi-hat, and 0104 applied it to
      the pulse alone.
    */
    for (const kind of CUE_KINDS.filter((k) => CUES[k].twin === 'debris-burst')) {
      const figure = CUES[kind].figure;
      expect(figure, `${kind} has no figure, so every one of them is bit-identical`).toBeDefined();
      expect(new Set(figure).size, `${kind}'s figure is all one weight`).toBeGreaterThan(1);
    }
  });

  it('and the band the music’s own fundamental sits in is not claimed by it', () => {
    /*
      ⚠️ **THIS IS *"THEIR OWN SOUND BAND"* READ THE OTHER WAY ROUND.** The kill was not beside the
      music — it was **underneath** it. Its lower tonal voice fell to `inKey(-6)`, which is 31 Hz, and
      `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md` put the music's own fundamental at
      41–65 Hz. Two things claiming one band, twice a second, is mud rather than punctuation.

      ⚠️ **A FLOOR ON WHERE A GLIDE MAY END, in the units the table is written in.** Every pitched
      endpoint is already a scale tone (0099), so this is one comparison per layer and needs no new
      field.

      ⚠️ **THE PLAYER'S OWN WEAPONS ARE NOT HELD TO THIS AND THE REASON IS A PLAY REPORT.** The pulse
      falls to `inKey(-7)` and the missile to `inKey(-12)`, so both reach below the bed's fundamental
      — measured, and left alone, because the ninth play-test signed the weapons off in the same breath
      as it reported this row. 0109 records it as owed rather than fixing two channels at once, which
      is what would make the next verdict unattributable.
    */
    const floor = MUSIC_ROOT * Math.pow(2, -5 / 12);
    for (const kind of CUE_KINDS.filter((k) => CUES[k].twin === 'debris-burst')) {
      for (const [i, layer] of CUES[kind].layers.entries()) {
        if (layer.wave === 'noise') continue;
        const lowest = Math.min(layer.from, layer.to);
        expect(
          lowest,
          `${kind} layer ${i} reaches ${lowest.toFixed(1)}Hz, under the ${floor.toFixed(1)}Hz the music's own ` +
            'fundamental occupies — it is beneath the bed rather than in it',
        ).toBeGreaterThanOrEqual(floor - 0.01);
      }
    }
  });
});
