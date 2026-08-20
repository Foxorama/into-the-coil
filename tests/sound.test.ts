import { BANDS, centroid, spectrum } from './spectrum.ts';
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import {
  CUES,
  CUE_KINDS,
  CUE_PAN_LIMIT,
  MAX_CUE_SECONDS,
  MUSIC_ROOT,
  SCALE,
  TWIN_KINDS,
  inKey,
  type CueLayer,
  type CueKind,
} from '../src/content/cues.ts';
import { DEFAULT_SOUND, SOUNDS, SOUND_KINDS } from '../src/content/sound.ts';
import { FIRE_GRID } from '../src/content/cadence.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { BEAT_SECONDS } from '../src/content/music.ts';
import { DUCK_DOWN_SECONDS, DUCK_HOLD_SECONDS, DUCK_UP_SECONDS } from '../src/app/music.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import {
  CUE_ROOM_GAIN,
  MAX_CUE_SAMPLES,
  CUE_LIMIT,
  MASTER_GAIN,
  limit,
  makeRoomImpulse,
  PAN_BUCKETS,
  SAMPLE_RATE,
  panBucket,
  panFor,
  bakeCues,
  bakePlace,
  cueSeconds,
  drainPrewarm,
  makeSpeaker,
  PREWARM_SLICE_JOBS,
  prewarmAudio,
  resetPrewarm,
  sampleCue,
  sampleLayerInto,
  takePrewarmed,
  variantAt,
  velocitiesOf,
  type AudioOut,
} from '../src/app/sound.ts';
import { bakeLoops, layerNotes, musicLevelFor, placeFor } from '../src/app/music.ts';
import { UNITS_PER_SECOND, rungMarks, targetGain } from '../scripts/timeline.mjs';
import { AURA_LAYERS, MUSIC, MUSIC_LAYERS, secondsOfLayer, type MusicLayer } from '../src/content/music.ts';
import { rungOf, THEME_KINDS, bakedBy, revoicedBy, type ThemeKind } from '../src/content/themes.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { MISSILE_BEAT_RATIO, fireEveryAt, missileEveryAt } from '../src/content/pickups.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { makeRng } from '../src/sim/rng.ts';
import { SCREENS } from '../src/state/screens.ts';
import { initialState, reduce, type Action } from '../src/state/root.ts';
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
function recorder(ready = true): {
  out: AudioOut;
  heard: number[];
  struck: number[];
  ducked: number[];
  placed: number[];
} {
  const heard: number[] = [];
  /** Which WEIGHT each sounding was struck at, in the same order — 0104. */
  const struck: number[] = [];
  /** Every duck the speaker asked the music for, in order — 0104. */
  const ducked: number[] = [];
  /** Where each sounding was placed in the field, in the same order — 0127. */
  const placed: number[] = [];
  return {
    heard,
    struck,
    ducked,
    placed,
    out: {
      ready: () => ready,
      sound: (index: number, velocity: number, pan: number) => {
        heard.push(index);
        struck.push(velocity);
        placed.push(pan);
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

    it('0157 — a SLICE does many notes, because a browser clamps the gap between them', () => {
      /*
        ⚠️ **THE PREWARM SPENT 12–20 SECONDS OF WALL CLOCK DOING 3.6 SECONDS OF SYNTHESIS** —
        `docs/decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md`. It scheduled **one
        note per `setTimeout(run, 0)`**, and a browser clamps a nested timeout to about 4 ms, so the
        gaps cost four times the work. Measured on the shipped build: a press at six seconds froze
        the main thread for **4,556 ms**, because the gesture found the prewarm unfinished.

        ⚠️ **Held against `PREWARM_SLICE_JOBS` rather than against elapsed time, and the first
        version of this guard was WRONG for exactly the reason 0044 names.** It asserted only
        `slices < jobs`, which is true whenever any slice manages two jobs — and under `npm run
        prove`'s own parallel load every job exceeded the time budget on its own, so every slice did
        one and the guard went red on healthy code. The floor makes the ratio a property of the code:
        `sliceOf` runs at least four jobs before its clock may stop it, so this bound holds on any
        machine and still fails on the one-job schedule 0157 removed.
      */
      resetPrewarm();
      let slices = 0;
      prewarmAudio((run) => {
        slices++;
        run();
      });
      const warm = takePrewarmed();
      expect(warm, 'the prewarm did not finish, so this measured nothing').not.toBeNull();
      /*
        ⚠️ **The job count is asked of `layerNotes`, which is what BUILDS the jobs**, rather than
        counted off the tables — a guard that re-derived it would be counting its own arithmetic and
        would drift the day a rest moves. `notes` is the list; nothing here runs it.
      */
      const jobs =
        warm!.cues.reduce((n, variants) => n + variants.length, 0) +
        MUSIC_LAYERS.reduce((n, layer) => n + layerNotes(layer, SAMPLE_RATE).notes.length, 0);
      expect(
        slices,
        `the prewarm yielded ${slices} times for ${jobs} jobs, which is the one-note-per-timeout schedule 0157 removed`,
      ).toBeLessThanOrEqual(Math.ceil(jobs / PREWARM_SLICE_JOBS));
      /*
        ⚠️ **The default five seconds is the SUBJECT, not flake, and this went red under `npm run
        prove` for exactly that** — the same reasoning its two siblings record. Driving the prewarm to
        completion is about four seconds of real synthesis on an idle machine and more under parallel
        load, and `layerNotes` is walked for every layer on top.
        `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` — establish which
        it is, and this is a guard whose subject costs seconds meeting a default sized for ones that
        do not.
      */
    }, 60_000);

    it('0157 — AND THE BOUNDARY BAKE TAKES THE SAME SLICE, because it is the one on a deadline', () => {
      /*
        ⚠️ **`bakePlace` HAD THE IDENTICAL ONE-JOB-PER-TIMEOUT SCHEDULE** — 0157 — and it is the bake
        with an actual deadline: 0133 needs it finished before the level boundary, or the level
        arrives playing the piece it is leaving.

        ⚠️ **HELD HERE RATHER THAN IN THE BROWSER, AND A PROBE IS WHY.** The obvious guard was
        `tests/sound.browser.test.ts`'s buffer count, and slowing this schedule back down left it
        **STILL GREEN** — because level one's place re-voices almost nothing, so its bake finishes
        instantly however it is scheduled. `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`
        caught that; this asks a place that really does re-voice.
      */
      resetPrewarm();
      prewarmAudio((run) => run());
      expect(takePrewarmed(), 'no prewarm, so `bakePlace` returns without baking and this measures nothing').not.toBeNull();

      const theme: ThemeKind = 'core';
      const layers = bakedBy(theme);
      expect(layers.length, 'the place this is written against no longer re-voices anything').toBeGreaterThan(8);
      const jobs = layers.length + layers.reduce((n, layer) => n + layerNotes(layer, SAMPLE_RATE, theme).notes.length, 0);

      let slices = 0;
      let arrived = false;
      bakePlace(
        theme,
        () => {
          arrived = true;
        },
        (run) => {
          slices++;
          run();
        },
      );
      expect(arrived, 'the place never finished baking, so the slice count below is of half a job list').toBe(true);
      expect(
        slices,
        `the boundary bake yielded ${slices} times for ${jobs} jobs, which is the schedule 0157 removed`,
      ).toBeLessThanOrEqual(Math.ceil(jobs / PREWARM_SLICE_JOBS));
    }, 60_000);

    it('0157 — AND A PRESS FINISHES THE PREWARM RATHER THAN STARTING AGAIN', () => {
      /*
        ⚠️ **`prewarmed` is set on the LAST job, so 90% done read as NOT STARTED** and the gesture
        re-synthesised all of it. That is the 4.6 seconds, and it is the half of 0157 that a player
        actually feels: the schedule fix shortens the window, and this is what makes landing inside
        the window cost only what is left.

        ⚠️ **The drained set must be the set the prewarm would have finished with**, sample for
        sample — the jobs are its own and run in its own order, which is the same property the
        prewarmed-versus-cold guard above rests on. A drain that re-baked would pass a length check
        and fail this one.
      */
      resetPrewarm();
      prewarmAudio((run) => run());
      const whole = takePrewarmed();
      expect(whole, 'the prewarm did not finish, so there is nothing to compare against').not.toBeNull();

      // Now start one and stop driving it partway, exactly as a press mid-prewarm finds it.
      resetPrewarm();
      let left = 12;
      prewarmAudio((run) => {
        if (left-- > 0) run();
      });
      expect(takePrewarmed(), 'twelve slices finished the whole prewarm, so this measured nothing').toBeNull();

      drainPrewarm();
      const drained = takePrewarmed();
      expect(drained, 'a drain did not complete a prewarm that was in flight').not.toBeNull();
      for (const layer of MUSIC_LAYERS) {
        const a = whole!.loops[layer];
        const b = drained!.loops[layer];
        expect(b.length, `${layer} drained to a different length`).toBe(a.length);
        let worst = 0;
        for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i]! - b[i]!));
        expect(worst, `${layer} drained to different samples, so a press does not get what it waited for`).toBe(0);
      }
      /*
        ⚠️ **The default five seconds is not enough and that is the SUBJECT, not flake** — the same
        reasoning the prewarmed-versus-cold guard above records. This drives the prewarm to
        completion twice, and a whole prewarm is about four seconds of real synthesis.
        `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`.
      */
    }, 60_000);

    describe('0133 — and a PLACE is baked at the boundary, on the same terms', () => {
      it('THE TRIGGER: the place baked is the one the RUN is heading for, not the one on the field', () => {
        /*
          ⚠️ **`run.level` increments when a boss dies**, so this names the incoming place while the
          level break is still up — which is the difference between a bake that gets a screen and one
          that races the level it belongs to. It is a function rather than two lines inside `mount`'s
          closure for the reason `src/app/lifecycle.ts` states in its own header: three closures over
          `state` meant the only way to ask a question about them was to boot a canvas.
        */
        LEVEL_KINDS.forEach((kind, index) => {
          expect(placeFor(index), `level ${index + 1} heads for the wrong place`).toBe(LEVELS[kind].theme);
        });
        const last = LEVELS[LEVEL_KINDS[LEVEL_KINDS.length - 1]!].theme;
        expect(placeFor(LEVEL_KINDS.length), 'a finished run read off the end of the roster').toBe(last);
        expect(placeFor(-1), 'a negative level index did not clamp').toBe(LEVELS[LEVEL_KINDS[0]!].theme);
      });


      /*
        `docs/decisions/0133-the-place-is-baked-at-the-boundary.md`. 0128 built `setLoops` and never
        called it; 0132 wrote a whole composition behind it. What is held here is the half that has
        no browser in it: the set `bakePlace` hands over.
      */
      /*
        ⚠️ **Warmed ONCE for the block, because a full prewarm is about four seconds.** Doing it per
        test is four of those against a five-second default timeout — a guard that passes alone and
        times out under the load of `npm run prove`, which is
        `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` exactly. It was
        written the slow way first and did precisely that.
      */
      const warm = (): void => {
        if (takePrewarmed() === null) prewarmAudio((run) => run());
      };

      it('hands over exactly what a whole bake of that place would produce', () => {
        /*
          ⚠️ **THE SAME PROPERTY THE PREWARM HAS TO HAVE, ARRIVING ONE LEVEL UP.** A place walked one
          note at a time across a break screen and a place baked in one call must be the identical
          audio, or *the same level sounds different depending on how long you looked at the screen*
          — which is `docs/decisions/0021-one-stream-per-concern.md`'s failure with a new trigger.
        */
        warm();
        let handed: Record<MusicLayer, Float32Array> | null = null;
        bakePlace('nebula', (loops) => {
          handed = loops;
        }, (run) => run());
        expect(handed, 'the place never finished, so this measured nothing').not.toBeNull();
        const whole = bakeLoops(SAMPLE_RATE, 'nebula');
        let compared = 0;
        for (const layer of MUSIC_LAYERS) {
          const a = handed![layer];
          const b = whole[layer];
          expect(a.length, `${layer} came back a different length`).toBe(b.length);
          for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) throw new Error(`${layer} differs at sample ${i}: ${a[i]} vs ${b[i]}`);
            compared++;
          }
        }
        expect(compared, 'nothing was actually compared').toBeGreaterThan(SAMPLE_RATE * 30);
        /*
          ── THE TIMEOUT IS A HANG DETECTOR AND NOT A BUDGET, AND IT WAS SIZED AS THOUGH IT WERE ────

          ⚠️ **`docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`, and this is
          its *wrong quantity in the guard* branch rather than its *real intermittency* one.** At 30 s
          this went RED on CI inside `npm run prove` while passing in `npm run check` **in the same
          run** — 0044's named symptom exactly: *"only failed under the load of `npm run prove`
          itself."*

          ⚠️ **MEASURED, BECAUSE A RERUN IS NOT EVIDENCE.** The same test, on CI:

          | branch | touched the audio | time |
          |---|---|---|
          | `the-gap-you-have-to-reach` (#189) | no | **22,632 ms** |
          | `a-layer-is-heard-in-the-sum` (#190) | yes | **18,544 ms** |

          **It has run at 60–75% of its own limit for at least two PRs and passed on luck.** The
          branch it finally failed on is the one that made it FASTER.

          ⚠️ **AND WIDENING IT DOES NOT WEAKEN WHAT IT PROVES, WHICH IS THE WHOLE DISTINCTION.** This
          asserts two bakes are sample-identical; **no part of that claim is about time.** The limit
          exists so a hang fails rather than sits, and the work is three full bakes — about 7 s each
          on CI — plus 25 million comparisons. 0044's own subject, and the `SWEEP_MS` whose comment
          forbids widening, are both cases where the DURATION IS THE SUBJECT. Here it is the valve.

          ⚠️ **THE BASELINE IS IN THE TABLE SO DRIFT STAYS VISIBLE.** If this ever approaches 120 s
          something has genuinely slowed down, and the number must not move again to hide it.
        */
      }, 120_000);

      it('THE COST MODEL: a layer the place does not state is the SAME array, not a copy', () => {
        /*
          ⚠️ **THIS IS THE 56 MB CEILING, WRITTEN AS AN IDENTITY CHECK.**
          [`what-a-whole-place-costs`](../reports/what-a-whole-place-costs-2026-08-12.md) measured
          Ember Nebula at 46.85 MB of its own audio: a set that copied what it shares would put a
          whole second composition in memory at every boundary, and `setLoops` compares by identity —
          so a copy is also a fresh `AudioBuffer` for every layer in the game, at a level break.
        */
        warm();
        const base = takePrewarmed()!.loops;
        let handed: Record<MusicLayer, Float32Array> | null = null;
        bakePlace('nebula', (loops) => {
          handed = loops;
        }, (run) => run());
        const own = revoicedBy('nebula');
        const shared = MUSIC_LAYERS.filter((l) => !own.includes(l));
        expect(shared.length, 'this place states every layer, so nothing is shared to check').toBeGreaterThan(0);
        for (const layer of shared) {
          expect(handed![layer], `${layer} was rebuilt instead of shared`).toBe(base[layer]);
        }
        for (const layer of own) {
          expect(handed![layer], `${layer} was shared instead of rebuilt`).not.toBe(base[layer]);
        }
      }, 30_000);

      it('a place that states nothing hands the base set straight back, so it is a no-op', () => {
        /*
          `setLoops` then finds every array identical and does not make a single buffer.

          ⚠️ **THE PLACE IS FOUND RATHER THAN NAMED, AND IT USED TO BE `rime`** —
          `docs/decisions/0146-three-more-places-and-two-after-them.md`. Six of the seven stated no
          material when this was written and one line picked one of them by hand; five of those six
          now state a whole composition, and the baseline went red before a probe could run. A guard
          written over the PROPERTY — *whichever place has no voices* —
          (`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`'s own rule about layers)
          survives the next place being written, and a name does not.

          ⚠️ **`approach` is the last one and it is unlikely to move**, because
          `tests/themes.test.ts` requires level one to be the neutral place everything else is read
          against — but the day it does state material, this skips loudly rather than asserting
          nothing.
        */
        const silent = THEME_KINDS.find((theme) => revoicedBy(theme).length === 0);
        expect(silent, 'every place states its own material now, so this can assert nothing').toBeDefined();
        warm();
        const base = takePrewarmed()!.loops;
        let handed: Record<MusicLayer, Float32Array> | null = null;
        bakePlace(silent!, (loops) => {
          handed = loops;
        }, (run) => run());
        for (const layer of MUSIC_LAYERS) expect(handed![layer]).toBe(base[layer]);
      }, 30_000);

      it('and a run that leaves the place before its material arrives never hears it', () => {
        /*
          ⚠️ **A bake is seconds long and a boss can die inside one.** Without the cancel, a run that
          cleared two levels quickly would hand the mixer the material for a place it had already
          left — and 0128's swap lands at the next PHRASE, so the wrong piece would arrive up to
          twenty-five seconds into the level after it.
        */
        warm();
        let arrived = false;
        const queue: (() => void)[] = [];
        const stop = bakePlace('nebula', () => {
          arrived = true;
        }, (run) => queue.push(run));
        // Walk a few jobs, then leave.
        for (let i = 0; i < 5 && queue.length > 0; i++) queue.shift()!();
        stop();
        while (queue.length > 0) queue.shift()!();
        expect(arrived, 'a cancelled bake still handed its material over').toBe(false);
      }, 30_000);

      it('and it does nothing at all before the prewarm has a base set to share from', () => {
        // Baking one here would be the three-second freeze 0102 exists to have removed. A boundary is
        // minutes after the first press, so this is the title screen and nothing else.
        resetPrewarm();
        let arrived = false;
        bakePlace('nebula', () => {
          arrived = true;
        }, (run) => run());
        expect(arrived, 'a place was baked with no prewarmed set to share from').toBe(false);
      });
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

  it('0183 — EVERY CUE IN THE TABLE AT ONCE STAYS INSIDE FULL SCALE, which is what let the cap go', () => {
    /*
      ⚠️ **THE WORST CASE IS NOW THE WHOLE TABLE AND IT USED TO BE FOUR ROWS** —
      `docs/decisions/0183-a-cue-is-limited-rather-than-refused.md`. Digital audio clips hard, so the
      question a cap was answering is real; what changed is that the answer is a shaper on the bus
      rather than a refusal at the gate, and the bound it has to survive is therefore **every kind
      sounding on one step** — which `hold` says is the true maximum, since no cue's is under two.
    */
    const everything = CUE_KINDS.reduce((sum, k) => sum + CUES[k].gain, 0);
    expect(
      everything * MASTER_GAIN,
      'the whole table at once no longer exceeds full scale, so this guard is measuring nothing',
    ).toBeGreaterThan(1);
    // With the browser's clamp, as above: the shaper sees 1 and answers `limit(1)`.
    const shaped = (x: number): number => limit(x < -1 ? -1 : x > 1 ? 1 : x, CUE_LIMIT);
    expect(
      shaped(everything * MASTER_GAIN),
      `all ${CUE_KINDS.length} kinds at once reach ${(everything * MASTER_GAIN).toFixed(2)} and the bus does not bring it inside full scale`,
    ).toBeLessThan(1);
  });

  it('and the loudest instant the retired cap allowed passes through UNTOUCHED', () => {
    /*
      ⚠️ **THE HALF THAT MAKES IT A LIMITER RATHER THAN A COMPRESSOR.** 0183 refuses `saturate` for
      this bus because it is normalised at unity and lifts everything under it; the property that
      replaces *and it does not change the mix* is that the shaper is **identity** below
      `CUE_LIMIT`. Four loudest rows at once is the densest instant the old `MAX_VOICES` permitted,
      and it has to come out the other side bit-identical.
    */
    const four = CUE_KINDS.map((k) => CUES[k].gain)
      .sort((a, b) => b - a)
      .slice(0, 4)
      .reduce((sum, gain) => sum + gain, 0);
    const level = four * MASTER_GAIN;
    expect(level, 'four cues at once already clear the limiter threshold, so nothing is left alone').toBeLessThan(
      CUE_LIMIT,
    );
    expect(limit(level, CUE_LIMIT), 'the shaper moved a level it is meant to pass').toBe(level);
    expect(limit(-level, CUE_LIMIT), 'the shaper is not symmetric, so it is a DC offset').toBe(-level);
  });

  it('and nothing the shaper can be handed reaches full scale, however loud the sum', () => {
    /*
      ⚠️ **MODELLED WITH THE BROWSER'S OWN CLAMP, WHICH IS 0176's THIRD BREAK ONE BUS OVER.** A
      `WaveShaperNode`'s curve is defined over [-1, 1] and the engine clamps anything outside it
      before reading — so the loudest sample that can LEAVE this bus is `limit(1)`, whatever arrives.
      A guard calling `limit` unclamped would be measuring a shaper the game does not have, which is
      exactly the mistake 0176 caught on the music bus.
    */
    const shaped = (x: number): number => limit(x < -1 ? -1 : x > 1 ? 1 : x, CUE_LIMIT);
    for (const level of [1, 2, 8, 64, 1000]) {
      expect(shaped(level), `a sum of ${level} leaves the bus at full scale or past it`).toBeLessThan(1);
      expect(shaped(-level), `a sum of -${level} leaves the bus at full scale or past it`).toBeGreaterThan(-1);
    }
    // ⚠️ AND THE PURE FUNCTION IS BOUNDED TOO, so the claim does not rest on the clamp alone.
    for (const level of [1, 8, 1e6]) {
      expect(limit(level, CUE_LIMIT), 'the curve itself passes full scale').toBeLessThanOrEqual(1);
    }
    // And it is monotonic, because a limiter that folds back is a ring modulator.
    let last = -1;
    for (let i = 0; i <= 200; i++) {
      const here = limit(i / 100, CUE_LIMIT);
      expect(here, 'the curve is not monotonic, so a louder sum comes out quieter').toBeGreaterThan(last);
      last = here;
    }
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

  /*
    ⚠️ **THE ONE THE OTHER THREE COULD NOT SEE** — `docs/decisions/0179-an-explosion-ends-low.md`.
    Reported from play: *"missile explosions don't really sound like explosions now either and similar
    with enemy death explosions."* The `kill` cue's centre of gravity **ROSE from 266 Hz to 3534 Hz**
    — it ended as a bright hiss climbing — where every other explosion in the table falls 7 to 12 dB.

    ⚠️ **ALL EIGHTY-FOUR GUARDS IN THIS FILE WERE GREEN OVER IT, AND EACH FOR A GOOD REASON.** 0089's
    asks whether the body HAS a falling lowpass — it does, and the body was over at 0.17 s while the
    cue ran to 0.36. The shed guard asks about spread and the one below it about which band is
    loudest; both are measured over the WHOLE cue, so a bright ending averages away. **Not one of them
    has a time axis**, which is the same hole `docs/decisions/0171-a-boundary-is-a-build.md` found in
    the music's three mix guards, one channel over.

    ⚠️ **THREE DECIBELS, AND IT IS A MARGIN BECAUSE A BARE DIRECTION TEST WAS SEEN NOT TO FIRE.** The
    first version asked only that the tail be lower than the onset, and `npm run prove` reported
    STILL GREEN on one of its own two probes: with the low voice lengthened, restoring the shipped
    streak still left the cue falling — by **1.9 dB**, which is flat. The bound is read off the two
    measurements that bracket it (1.9 nearly-flat against the fix's 5.2) with the other three
    explosions at 11 to 13, exactly as `docs/decisions/0102-the-music-goes-somewhere.md`'s sub floor
    was read off a pulse with and without its sub — `docs/decisions/0140-no-layer-is-inaudible.md`.
  */
  const FALL_DB = 3;

  it('0179 — THE REPORTED ONE: an explosion ENDS LOWER THAN IT STARTED, which none of the above sees', () => {
    for (const kind of EXPLOSIONS) {
      const samples = sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind));
      const seconds = cueSeconds(CUES[kind]);
      const onset = centroid(samples, 0, Math.min(0.025, seconds / 3), SAMPLE_RATE);
      const tail = centroid(samples, (seconds * 2) / 3, seconds, SAMPLE_RATE);
      const fall = 20 * Math.log10(tail / onset);
      expect(
        fall,
        `${kind} starts at ${onset.toFixed(0)}Hz and ends at ${tail.toFixed(0)}Hz, a fall of ` +
          `${fall.toFixed(1)}dB — an explosion leaves its top behind, and this one does not`,
      ).toBeLessThanOrEqual(-FALL_DB);
    }
  });

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
      `fireEvery` or `missileEvery` fails this rather than quietly reintroducing the drone —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`, and the same cross-file shape
      `tests/bombs.test.ts` uses for a blast's reach and its art.
    */
    for (const ship of SHIP_KINDS) {
      const row = SHIPS[ship];
      const fastest = Math.min(...row.fireEvery.map((_unused, tier) => fireEveryAt(row, tier)));
      const gap = fastest / STEPS_PER_SECOND;
      expect(
        cueSeconds(CUES.pulse),
        `the ${ship} pulse sounds for ${cueSeconds(CUES.pulse).toFixed(3)}s and fires every ${gap.toFixed(3)}s at its ` +
          `fastest rung, so the gun never stops making a noise`,
      ).toBeLessThanOrEqual(gap);

      const soonest = Math.min(
        ...row.missileEvery.map((_unused, tier) => MISSILE_BEAT_RATIO * missileEveryAt(row, tier)),
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
    /*
      ⚠️ **RE-AIMED BY 0183: THE CAP IS GONE, SO THE REFUSAL THIS RIDES ON IS THE `hold`.** It used
      to fill four slots and check that the fifth ducked nothing. `hold` is the refusal that remains
      and is the one that always mattered — a retrigger inside a cue's own hold is a cue the player
      never hears, and ducking for it is the track getting out of the way of nothing.
    */
    speaker.play('bomb');
    speaker.play('hit');
    speaker.play('threat');
    speaker.play('bomb');
    speaker.play('bomb');
    expect(heard.length, 'the hold did not refuse anything, so this measures nothing').toBe(3);
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

  it('0183 — EVERY CUE ASKED FOR ON A STEP IS HEARD, because nothing is refused for being fifth', () => {
    /*
      ⚠️ **THE REPORTED ONE.** *"Let's remove the max voices."* Fourteen kinds asked for on one step
      used to produce four soundings and ten silences, and the ten were events the game had decided
      were worth telling the player about.
    */
    /*
      ⚠️ **DRIVEN ACROSS THE GRID, BECAUSE EIGHT OF THE FOURTEEN WAIT FOR IT** — 0104. A gridded cue
      is asked for on one step and sounds on the next sixteenth; counting on the asking step alone
      would report six and read as the cap still holding. What is asserted is that **every kind asked
      for is heard**, not that they all land on the same step.
    */
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    for (const kind of CUE_KINDS) speaker.play(kind);
    speaker.step(FIRE_GRID);
    expect(heard.length, 'something is still refusing cues on a busy step').toBe(CUE_KINDS.length);
  });

  it('and the allocation is still BOUNDED, because a hold says a kind sounds once per step', () => {
    /*
      ⚠️ **THIS IS WHAT REPLACES THE CAP IN `tests/budget.test.ts`'s REASONING** — 0183. The file is
      deliberately cold and allocates one single-use source per voice, so *how many voices can a step
      start* has to have an answer. It is `CUE_KINDS.length`, and it is **derived**: no row's `hold`
      is under two steps, so a kind that sounded this step cannot sound again on it.

      ⚠️ **HELD OVER THE TABLE RATHER THAN OVER THE NUMBER**, so a fifteenth row with a `hold` of
      zero fails here rather than quietly unbounding the allocation.
    */
    for (const kind of CUE_KINDS) {
      expect(
        CUES[kind].hold,
        `${kind} may retrigger inside one step, so a step's voice count is unbounded`,
      ).toBeGreaterThan(1);
    }
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    for (let i = 0; i < 40; i++) for (const kind of CUE_KINDS) speaker.play(kind);
    speaker.step(FIRE_GRID);
    expect(heard.length, 'forty rounds of every cue started more voices than there are kinds').toBe(CUE_KINDS.length);
  });

  it('does not let a cue held back spend the step’s budget anyway', () => {
    /*
      ⚠️ **RETAINED THROUGH 0183, AND ITS SUBJECT IS NARROWER NOW.** It was written about the voice
      cap counting DROPS rather than voices — four retriggers of one held cue filling the step's
      budget and locking out the cues behind them. With the cap gone there is no budget to eat, and
      what is left is the claim underneath it: **a held repeat is a no-op and never a side effect.**

      ⚠️ **IT REPLACED ONE ASSERTING THE TWO CHECKS HAPPEN IN A PARTICULAR ORDER, AND THE PROBE IS
      WHY.** Breaking the order on purpose left the suite green, correctly — the claim was false and
      the comment in `src/app/sound.ts` said it anyway.
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching a guard that fires on nothing.
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
    for (let i = 0; i < 8; i++) speaker.play('hit');
    // Every one of these is a different cue and every one has to be heard, in this order.
    speaker.play('threat');
    speaker.play('bomb');
    speaker.play('chime');
    expect(heard, 'a held repeat did something other than nothing').toEqual([
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

  it('0144 — A CHAIN OF DEATHS STREAKS IN THE TOP, and the band 0109 shortened stays short', () => {
    /*
      `docs/decisions/0144-a-chain-of-deaths-is-a-cymbal-streak.md`. Reported from play: *"enemy death
      needs a sharper percussive beat where the sound lasts a bit longer so a chain of deaths sounds
      like a sharp cymbal streak."*

      ⚠️ **THAT IS A REVERSAL OF 0109 UNLESS IT IS SPENT IN THE RIGHT BAND.** 0109 cut this cue from
      0.46 s to 0.26 because *at two a second the explosions overlapped themselves continuously into a
      rumble* — so a guard that only checked the cue got longer would be holding the defect 0109
      removed. What makes *longer* safe is WHERE: the layer that lasts is high-passed clear of the
      one that rumbled, so a chain overlaps in the top and nowhere else.
    */
    for (const kind of CUE_KINDS.filter((k) => CUES[k].twin === 'debris-burst')) {
      const layers = CUES[kind].layers.filter((l) => l.wave === 'noise');
      const longest = layers.reduce((a, b) => (b.seconds > a.seconds ? b : a));
      const body = layers.reduce((a, b) => ((b.lowTo ?? b.lowFrom ?? Infinity) < (a.lowTo ?? a.lowFrom ?? Infinity) ? b : a));
      expect(
        longest,
        `${kind}'s longest noise layer IS its body — a chain of these overlaps where 0109 found a rumble`,
      ).not.toBe(body);
      expect(
        longest.highFrom ?? 0,
        `${kind}'s longest layer is not high-passed clear of its body, so the streak carries the rumble with it`,
      ).toBeGreaterThan(body.lowTo ?? body.lowFrom ?? 0);
    }
  });

  it('0145 — AN AUTO-WEAPON SOUNDS UNDER THE EVENTS IT CAUSES, because it is the one that never stops', () => {
    /*
      `docs/decisions/0145-the-gun-makes-room.md`. Reported after a play-through: *"for both melodies
      we need to reduce the bullet/missile gain slightly and lift the gain on the other sounds."*

      ⚠️ **THE WEAPONS WERE NEVER LOUDER PER EVENT — THEY ARE ON ALMOST ALL THE TIME.** The pulse is
      0.064 s at up to fifteen a second, which
      `docs/decisions/0109-a-death-is-a-drum.md` measured as sounding **96% of the time** at the cap.
      Anything that occupies the field continuously masks the things that happen once, whatever the
      per-event peak says — so what is held is an ORDER, not a level.

      ⚠️ **`threat` IS DELIBERATELY NOT IN THIS LIST.** It is a telegraph rather than an outcome — a
      thing about to happen, not a thing the player did or suffered — and it is frequent for the same
      reason the gun is. Holding the gun under it would be asking the warning to shout.
    */
    const outcomes = CUE_KINDS.filter((k) => k !== 'pulse' && k !== 'missile' && k !== 'threat');
    expect(outcomes.length, 'the table has no outcome cues, so this measured nothing').toBeGreaterThan(6);
    for (const weapon of ['pulse', 'missile'] as const) {
      for (const kind of outcomes) {
        expect(
          CUES[weapon].gain,
          `${weapon} at ${CUES[weapon].gain} is not under ${kind} at ${CUES[kind].gain} — the sound that never ` +
            'stops is louder than one the player has to notice',
        ).toBeLessThan(CUES[kind].gain);
      }
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

/**
 * THE RIG PLAYS THE LEVEL — `docs/decisions/0116-the-rig-plays-the-level.md`.
 *
 * ⚠️ **`scripts/hear.mjs` HAS BEEN WRONG ABOUT THE GAME TWICE, AND BOTH TIMES A VERDICT WAS TAKEN
 * FROM IT.** [0104](../docs/decisions/0104-the-gun-plays-a-figure.md): the bus shaper was missing, so
 * the rig under-reported the change it had just been used to choose by 4.5 dB.
 * [0114](../docs/decisions/0114-the-fight-is-a-different-piece.md): `--music` and `--play` rendered
 * the same music at two reference levels, and *"a massive musical volume difference"* was reported as
 * a defect in the music — **one instruction away from being tuned as one**.
 *
 * ⚠️ **NOTHING IN THIS REPOSITORY HELD THE RIG TO THE GAME, WHICH IS WHY IT DRIFTED TWICE.** Every
 * other guard here measures the music; the instrument that measures the music for a human was
 * unguarded, and a wrong instrument is worse than none because it still produces a number.
 */
describe('0116 — the instrument is the game, and it is not a second copy of it', () => {
  const rig = readFileSync(resolve(root, 'scripts/hear.mjs'), 'utf8');

  /*
    ⚠️ **A restated quantity is the whole failure mode, so the guard is over restatement.** Both
    drifts were the rig holding its own version of something the mixer owns. Importing is not
    tidiness here — it is the only thing that makes the file play what the game plays.
  */
  const OWNED = [
    ['RAMP_SECONDS', 'how long a rung change takes — the shape of every section boundary'],
    ['AURA_RAMP_SECONDS', 'how fast the aura follows the boss'],
    ['MUSIC_GAIN', 'the bed’s level'],
    ['MUSIC_DRIVE', 'the bus shaper, which 0104 found missing'],
    ['MASTER_GAIN', 'the reference level, which 0114 found differing between modes'],
  ] as const;

  it('THE ONE THAT DRIFTED TWICE: every mixer quantity the rig uses is imported, never restated', () => {
    for (const [name, what] of OWNED) {
      expect(rig.includes(name), `scripts/hear.mjs does not mention ${name} — ${what}`).toBe(true);
      /*
        A `const NAME =` in the rig is the rig owning a number the mixer owns. That is exactly what
        both drifts were, and it is invisible: the file still runs, still writes a wav, and still
        sounds plausible.
      */
      expect(
        new RegExp(String.raw`(const|let|var)\s+${name}\s*=`).test(rig),
        `scripts/hear.mjs defines its own ${name} — ${what}. Import it from the module that owns it.`,
      ).toBe(false);
    }
  });

  /*
    ⚠️ **THE FIRST DRAFT OF THE TWO BELOW ASSERTED THAT A WORD APPEARED IN A FILE, AND `npm run prove`
    REPORTED STILL GREEN ON BOTH.** Deleting a call site leaves the import behind, so `rig.includes
    ('mixOf')` stayed true with the theme dropped from the render — a spellcheck standing in for a
    property. `scripts/timeline.mjs` exists so these can be about VALUES, which is the only thing that
    made them redden. `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` caught it.
  */
  it('THE RUNG SEQUENCE IS THE GAME’S ANSWER, not a list the rig keeps', () => {
    /*
      ⚠️ **Held against `musicLevelFor` itself rather than against expected names.** A list of rungs
      typed into this test would be the second copy arriving in the guard instead of in the rig — and
      it would go on passing the day a rung distance moved.
    */
    for (const kind of LEVEL_KINDS) {
      const { bossAt, sections } = LEVELS[kind];
      for (const mark of rungMarks(kind, 45)) {
        const inFight = mark.second >= bossAt / UNITS_PER_SECOND;
        const camera = inFight ? bossAt : mark.second * UNITS_PER_SECOND;
        const health = inFight ? Math.max(0, 1 - (mark.second - bossAt / UNITS_PER_SECOND) / 45) : 1;
        expect(
          mark.rung,
          `${kind} is reported as ${mark.rung} at ${mark.second.toFixed(2)}s, which is not where the game is`,
        ).toBe(musicLevelFor(camera, inFight, sections, health));
      }
    }
  });

  it('and a level of a different length reaches its rungs at its OWN times', () => {
    /*
      ⚠️ **THE PROPERTY AN ARC WITH A TYPED ORDER CANNOT HAVE.** `hear.mjs --music` gives every rung
      one phrase, so its boundaries are the same seven numbers whatever the level is.

      ⚠️ **AND WHAT DECIDES A LEVEL'S OWN IS ITS SCRIPT NOW, NOT `bossAt`** —
      `docs/decisions/0158-a-level-says-where-its-sections-open.md`. This used to read *a level's are
      a function of `bossAt`, and two levels with different bosses must therefore differ*, which was
      true while the three distances were measured back from the boss and sharing them was the only
      option. It is false now: a script is level-local, so two levels could share a `bossAt` and still
      differ, and could differ in `bossAt` and still open every section together. **The precondition
      below moved with it** — what has to be different for this to assert anything is the SCRIPT.
    */
    const a = rungMarks('approach', 45).map((m) => m.second);
    const b = rungMarks('eye', 45).map((m) => m.second);
    expect(LEVELS.eye.sections, 'the two levels chosen ship the same script, so this asserts nothing').not.toEqual(
      LEVELS.approach.sections,
    );
    expect(a, 'two levels with different scripts reach their rungs at the same times').not.toEqual(b);
  });

  it('THE PLACE IS IN IT: two themes do not render the same gains', () => {
    /*
      ⚠️ **0107's multiplier, held where the rig would silently drop it.** Without `mixOf` every one of
      the seven levels renders identically — which is *"the same music repeats level after level"*
      reproduced inside the instrument built to answer it, and it would look completely correct.
    */
    /*
      ⚠️ **HELD OVER THE LAYERS WHOSE LADDERS AGREE, BECAUSE OTHERWISE IT IS NOT ABOUT THE BALANCE** —
      `docs/decisions/0187-the-kick-is-the-pulse.md`. This compared the two places outright, and
      `npm run prove` reported 0116's break **STILL GREEN** the day The Black Heart gained a `boss`
      row of its own: with the ladders differing, the two render differently whether the balance is
      applied or not, and the guard passes on the wrong evidence.

      ⚠️ **SO THE SET IS THE LAYERS THE TWO PLACES OPEN IDENTICALLY**, where the only thing left that
      can separate them is `mixOf`. That is the claim this guard is named for, and it is now the
      claim it makes. `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` found it, in the
      direction that catches a guard rotting under a change that had nothing to do with it.
    */
    const shared = MUSIC_LAYERS.filter(
      (layer) => rungOf('core', 'boss', layer) === rungOf('approach', 'boss', layer) && rungOf('core', 'boss', layer) > 0,
    );
    expect(
      shared.length,
      'the two places no longer open a single layer alike at the boss, so this guard cannot isolate the balance',
    ).toBeGreaterThan(0);
    const differs = shared.filter(
      (layer) => targetGain('core', 'boss', layer, 1) !== targetGain('approach', 'boss', layer, 1),
    );
    expect(
      differs.length,
      'The Core and The Approach render byte-identical gains for every layer they open alike, so the theme is not applied',
    ).toBeGreaterThan(0);
  });

  it('and the aura arrives as a CEILING rather than a gain', () => {
    // 0091: the ladder's aura row is multiplied by how close the boss is. At nothing, it is nothing.
    for (const layer of AURA_LAYERS) {
      expect(targetGain('approach', 'boss', layer, 0), `${layer} sounds with the boss at arm's length`).toBe(0);
      expect(targetGain('approach', 'boss', layer, 1), `${layer} is silent with the boss on top of you`).toBeGreaterThan(0);
    }
  });
});

describe('0127 — a cue has a place', () => {
  /*
    ── THERE IS NO *A PLACED CUE MUST BE LIGHT AT THE BOTTOM* GUARD, AND THAT IS A DELETION ────────

    ⚠️ **One was written, could not be shown to fail, and was removed rather than left green.**
    `docs/decisions/0118-the-mix-has-a-width.md` centres any MUSIC layer carrying 40% of its
    A-weighted energy below 130 Hz, and the obvious move was the same bound over the cue table.
    Measured, every cue is between **0.1% (`threat`) and 16.6% (`missile`)** — nowhere near it.

    ⚠️ **AND IT CANNOT BE PUSHED THERE.** Adding a lowpassed noise layer to `kill` at gains up to ×9
    moved its share from 6.8% to 6.0% — *down*, because a filter's skirt puts more into the mid than
    it does into the sub, and A-weighting discounts 25–130 Hz by about thirty decibels. Re-voicing
    the body into the floor crosses the bound and reddens
    `docs/decisions/0089-a-cue-has-a-body.md`'s SHED guard first, every time.

    ⚠️ **So the bound was unreachable and the guard would have been green for ever** —
    `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` says that is not a guard, and 0044's
    instruction is to delete it, fix it, or leave it red. What actually stands over an explosion's
    spectrum is 0089's two guards, which are proven and which every break here trips first.
  */
  it('nothing is hard panned, because a player may have one earbud in', () => {
    // The same argument the music makes at 0.65, at a narrower number: a cue is a transient, and a
    // hard-placed transient is heard as a click at one ear rather than as an event over there.
    expect(CUE_PAN_LIMIT).toBeGreaterThan(0);
    expect(CUE_PAN_LIMIT).toBeLessThan(1);
  });

  it('THE LANE IS THE FIELD: the edges reach the limit and the middle is the middle', () => {
    expect(panFor(ACROSS_SPAN / 2), 'the middle of the lane is not centred').toBe(0);
    expect(panFor(0), 'the near edge does not reach the limit').toBeCloseTo(-CUE_PAN_LIMIT, 10);
    expect(panFor(ACROSS_SPAN), 'the far edge does not reach the limit').toBeCloseTo(CUE_PAN_LIMIT, 10);
    /*
      ⚠️ **Clamped, because a body may be culled slightly outside the lane** —
      `docs/decisions/0048-a-threat-may-arrive-from-the-side.md` lets a threat enter from the across
      edges, so a shot on its way out must not pan past the limit.
    */
    expect(panFor(-40), 'a body outside the lane pans past the limit').toBeCloseTo(-CUE_PAN_LIMIT, 10);
    expect(panFor(ACROSS_SPAN + 40), 'a body outside the lane pans past the limit').toBeCloseTo(CUE_PAN_LIMIT, 10);
  });

  it('a cue with nowhere to be is CENTRED, which is an answer rather than a fallback', () => {
    // The chime answers a setting and a menu has no world — `src/app/mount.ts`. Those are genuinely
    // in the middle, and the same path carries `hit`, which is inferred from a count.
    expect(panFor(undefined)).toBe(0);
  });

  it('the places are a fixed pool with an exact centre, and nothing lands outside it', () => {
    /*
      ⚠️ **ODD, so an unplaced cue has a bucket of its own.** An even count straddles the middle,
      which would give every centred cue a small permanent offset to one side.
    */
    expect(PAN_BUCKETS % 2, 'an even number of places has no exact centre').toBe(1);
    expect(panBucket(0), 'centre is not the middle bucket').toBe((PAN_BUCKETS - 1) / 2);
    expect(panBucket(-CUE_PAN_LIMIT)).toBe(0);
    expect(panBucket(CUE_PAN_LIMIT)).toBe(PAN_BUCKETS - 1);
    // Past the limit is still inside the pool: `sound` indexes this array directly.
    for (const pan of [-4, -1, 1, 4]) {
      expect(panBucket(pan), `a pan of ${pan} leaves the pool`).toBeGreaterThanOrEqual(0);
      expect(panBucket(pan), `a pan of ${pan} leaves the pool`).toBeLessThan(PAN_BUCKETS);
    }
  });

  it('a cue sounds where it was ASKED FROM, and the speaker owns the arithmetic', () => {
    const { out, placed } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step(0);
    // `hit` and `bomb` are the two cues 0104 deliberately keeps OFF the grid, so they sound on the
    // step they are asked for and this measures the placement rather than the wait.
    expect(CUES.hit.onGrid ?? false, 'hit went on the grid and this test now measures the wait').toBe(false);
    expect(CUES.bomb.onGrid ?? false, 'bomb went on the grid and this test now measures the wait').toBe(false);
    speaker.play('hit', 0);
    speaker.play('bomb', ACROSS_SPAN);
    expect(placed[0], 'a cue at the near edge did not go left').toBeCloseTo(-CUE_PAN_LIMIT, 10);
    expect(placed[1], 'a cue at the far edge did not go right').toBeCloseTo(CUE_PAN_LIMIT, 10);
  });

  it('A GRIDDED CUE KEEPS THE PLACE IT WAS ASKED FROM, not the one a sixteenth later', () => {
    /*
      ⚠️ **THE ONE THAT IS NOT OBVIOUS, and it is a consequence of 0104 rather than of 0127.** A
      gridded cue waits up to a sixteenth before it sounds, and by then the body that caused it has
      moved or been released back to its pool. A pan read at flush time would place the explosion
      wherever the pool happens to be pointing — so the position is recorded at the moment of the ask,
      exactly as the accent already is.
    */
    const { out, placed } = recorder();
    const speaker = makeSpeaker(out);
    // A step that is NOT a grid step, so the cue has to wait.
    speaker.step(1);
    speaker.play('kill', 0);
    expect(placed, 'a gridded cue sounded on the step it was asked for').toEqual([]);
    // Walk to the next sixteenth, which is where it flushes.
    for (let i = 2; i <= FIRE_GRID; i++) speaker.step(i);
    expect(placed.length, 'the gridded cue never sounded').toBe(1);
    expect(placed[0], 'a gridded cue was placed where the pool ended up rather than where it happened').toBeCloseTo(
      -CUE_PAN_LIMIT,
      10,
    );
  });

  it('EVERY CUE THE GAME FIRES SAYS WHERE IT HAPPENED, and the one that cannot is named', () => {
    /*
      ⚠️ **A SOURCE SCAN, because the failure is a call site that forgets** — and a forgotten place is
      silent: the cue still sounds, dead centre, and nothing anywhere goes red. That is the shape
      `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md` chose a graph check for, and the
      nearest thing available here is the call itself.

      ⚠️ **`hit` IS THE NAMED EXCEPTION AND IT IS A PROPERTY OF THE GAME.** It is inferred from a
      count — bullets in flight before, minus after, minus the ones that killed — so there is no body
      to ask. Placing it would mean logging every arrival and not only every death, which is a pool
      the whole game would pay for so that one cue could be placed. `src/app/frame.ts` says so where
      it happens.
    */
    const CENTRED: readonly string[] = ['hit'];
    const offenders: string[] = [];
    for (const file of ['src/app/frame.ts', 'src/app/boss.ts']) {
      const source = readFileSync(resolve(root, file), 'utf8');
      for (const match of source.matchAll(/onCue\(\s*'([a-zA-Z]+)'\s*([,)])/g)) {
        const kind = match[1]!;
        if (match[2] === ')' && !CENTRED.includes(kind)) offenders.push(`${file}: ${kind}`);
      }
    }
    expect(
      offenders,
      `these fire a cue without saying where it happened: ${offenders.join(', ')}. Pass the across the ` +
        'call site already has, or add it to CENTRED here with the reason it has no place.',
    ).toEqual([]);
  });
});

/*
  ── 0173: A CUE HAPPENS SOMEWHERE, AND UNTIL NOW NONE OF THEM DID ────────────────────────────────

  `docs/decisions/0173-a-cue-happens-somewhere.md`. Reported 2026-08-18: *"the cues and sfx need to be
  reworked as we haven't touched them since we spent all the time on the music and they're still the
  old mono sounds and haven't been reworked as stereo sounds with deep bass, reverb and actually decent
  sound."*

  ⚠️ **THE MUSIC HAS HAD A ROOM SINCE 0136 AND THE CUES NEVER DID.** `src/app/music.ts`'s own header
  says the two channels come out of one instrument *"which is what stops the soundtrack sounding like
  it was made somewhere else"* — and the reverb was the one part of that instrument only one of them
  could reach.
*/
describe('0173 — a cue happens somewhere', () => {
  const impulse = makeRoomImpulse(SAMPLE_RATE, makeRng('room'));

  it('THE STEREO ONE: the two sides of the room are drawn from different noise', () => {
    /*
      ⚠️ **THIS IS WHAT *STEREO* HAS TO MEAN FOR A CUE, AND IT IS NOT THE DRY SIGNAL.** Where the
      event happened is information the player dodges on — `docs/decisions/0127-a-cue-has-a-place.md` —
      so widening the dry sound would spend a fact to buy a feeling. **The width is the tail**, and a
      tail is only wide if its two sides are uncorrelated: two identical channels are a mono sound
      played twice, however many speakers it reaches.
    */
    expect(impulse.length, 'the room is not two channels').toBe(2);
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < impulse[0]!.length; i++) {
      sxy += impulse[0]![i]! * impulse[1]![i]!;
      sxx += impulse[0]![i]! ** 2;
      syy += impulse[1]![i]! ** 2;
    }
    const correlation = sxy / Math.sqrt(sxx * syy);
    expect(
      Math.abs(correlation),
      `the room's two sides correlate at ${correlation.toFixed(3)}, so the tail is a centred echo rather than a width`,
    ).toBeLessThan(0.15);
  });

  it('and it is a decay rather than a burst of noise, and it does not end in a click', () => {
    /*
      ⚠️ **A FLOOR AND NOT A SHAPE.** How large the room is, how bright, how long — all taste. That it
      DECAYS, and that the buffer ends near zero rather than being cut off, is whether it works: an
      impulse with a step at its end convolves that step into every sound it touches.
    */
    const tenth = Math.floor(impulse[0]!.length / 10);
    const energy = (from: number, to: number): number => {
      let sum = 0;
      for (let i = from; i < to; i++) sum += impulse[0]![i]! ** 2;
      return sum / (to - from);
    };
    const fall = 10 * Math.log10(energy(0, tenth) / energy(impulse[0]!.length - tenth, impulse[0]!.length));
    expect(fall, `the room falls only ${fall.toFixed(1)} dB from head to tail, which is a wash and not a room`).toBeGreaterThan(40);
    for (let c = 0; c < 2; c++) {
      expect(Math.abs(impulse[c]![impulse[c]!.length - 1]!), 'the impulse ends on a step, which clicks').toBeLessThan(0.01);
    }
  });

  it('THE ONE IN UNITS THE PLAYER HEARS: the blast rings for at least a third of a second longer', () => {
    /*
      ⚠️ **MEASURED BY CONVOLVING, NOT BY READING THE TABLE.** `air` is a send gain and a gain is not a
      loudness (0140); what a player gets is the sound arriving late, and the only way to know how much
      later is to do the arithmetic the browser is going to do. The blast is the cue the player paid a
      charge for — 0053 — and is where a room is most obviously the thing they bought.
    */
    const dry = sampleCue(CUES.blast, SAMPLE_RATE, makeRng('cues').stream('blast'));
    const wet = withRoom(dry, impulse[0]!, (CUES.blast.air ?? 0) * CUE_ROOM_GAIN);
    // ⚠️ Both sides thinned, or the comparison is between two different clocks.
    const added = ringsFor(wet) - ringsFor(thin(dry));
    expect(added, `the room adds only ${(added * 1000).toFixed(0)} ms to the blast`).toBeGreaterThan(0.33);
  }, 30_000);

  it('and the four cues on the weapon cadence are DRY, because a tail cannot outlast its own repeat', () => {
    /*
      ⚠️ **THE ROOM IS 1.1 SECONDS AND THE GUN FIRES EVERY 0.067**, so a wet gun is a gun smeared into
      a wash. It is 0104's own argument — that decision shortened the pulse's LAYERS against
      `FASTEST_FIRE` for exactly this reason — and it applies to the missile on the same ladder, to the
      enemy shot that answers it, and to the hit that lands at the end of it.

      ⚠️ **AND `hit` WAS WET UNTIL IT WAS MEASURED.** At `air: 0.14` — the smallest value in the table —
      the room took its tail from 56 ms to **743 ms**, because a cue with a small peak has its -40 dB
      point pushed LATER by a tail, not earlier. A quiet send is not a short one.
    */
    const STREAMS: CueKind[] = ['pulse', 'missile', 'threat', 'hit'];
    for (const kind of STREAMS) {
      expect(CUES[kind].air, `${kind} rides the fire cadence and states a room`).toBeUndefined();
    }
    for (const kind of CUE_KINDS) {
      if (STREAMS.includes(kind)) continue;
      expect(CUES[kind].air, `${kind} is an event and has no room at all`).toBeGreaterThan(0);
    }
  });

  it('and every room a cue states is a share of itself, which is what a send is', () => {
    for (const kind of CUE_KINDS) {
      const air = CUES[kind].air;
      if (air === undefined) continue;
      expect(air, `${kind} sends more than its whole self to the room`).toBeLessThanOrEqual(1);
      expect(air, `${kind} states a negative send, which a gain node cannot be`).toBeGreaterThan(0);
    }
  });
});

/**
 * How much both signals are thinned before the convolution below.
 *
 * ── A DIRECT CONVOLUTION AT FULL RATE IS TWO BILLION MULTIPLIES, AND CI SAID SO ─────────────────
 *
 * ⚠️ **IT PASSED HERE IN 2.35 s AND TIMED OUT ON THE RUNNER AT FIVE.** A one-second cue against a
 * 1.1-second impulse is 44,100 x 48,510; the naive form is O(n.m) and this is the worst pair in the
 * table. Two is 4x less work and the same answer.
 *
 * ⚠️ **TWO AND NOT MORE, BECAUSE THE ANSWER MOVES AND IT WAS MEASURED MOVING.** A decimation aliases,
 * and while that does not change which BAND energy is in, it does change which sample is the peak —
 * and the peak sets the floor this measurement crosses. The room's contribution to the blast, by
 * thinning factor:
 *
 *     1 → 476 ms (2352 ms to compute)    8 → 449 ms (37 ms)
 *     2 → 476 ms  (602 ms)              16 → 339 ms  (9 ms)
 *     4 → 450 ms  (146 ms)              32 → 324 ms  (3 ms)
 *
 * **Only 2 is exact.** The first draft of this used 32 with a comment claiming the figures were
 * identical to the millisecond, which was written without checking and was wrong by 152 ms —
 * `CLAUDE.md`'s *an assumption is discharged or owed and never merely labelled*, inside a guard.
 */
const THIN = 2;

/** Every `THIN`th sample, which is all the arithmetic below needs. */
function thin(a: Float32Array): Float32Array {
  const out = new Float32Array(Math.ceil(a.length / THIN));
  for (let i = 0; i < out.length; i++) out[i] = a[i * THIN]!;
  return out;
}

/** One channel of the room, convolved into a dry cue at `wet`, with the dry kept — what the bus does. */
function withRoom(dry: Float32Array, room: Float32Array, wet: number): Float32Array {
  const a = thin(dry);
  const b = thin(room);
  const out = new Float32Array(a.length + b.length);
  for (let i = 0; i < a.length; i++) {
    const v = a[i]!;
    if (v === 0) continue;
    for (let j = 0; j < b.length; j++) out[i + j] = out[i + j]! + v * b[j]! * wet;
  }
  for (let i = 0; i < a.length; i++) out[i] = out[i]! + a[i]!;
  return out;
}

/** How long a cue is audible for, in seconds — the last moment it is within 40 dB of its own peak. */
function ringsFor(a: Float32Array): number {
  let peak = 0;
  for (const v of a) peak = Math.max(peak, Math.abs(v));
  const floor = peak / 100;
  for (let i = a.length - 1; i >= 0; i--) if (Math.abs(a[i]!) > floor) return (i * THIN) / SAMPLE_RATE;
  return 0;
}

/*
  ── 0174: A SEND HAS TO MEAN SOMETHING ──────────────────────────────────────────────────────────

  `docs/decisions/0174-a-send-has-to-mean-something.md`. Reported on the first listen of 0173:
  *"the enemy death sounds like it's happening inside a tin can, it doesn't fit an explosion or a
  gamey sound at all."*

  ⚠️ **THE WET WAS LOUDER THAN THE DRY, BY UP TO 9 dB OF ENERGY AND 18 OF PEAK.** `normalize = false`
  hands the impulse's level to the author and 0173 said so and then did not author it: a 1.1-second
  full-amplitude noise buffer has an enormous integrated gain, and every `air` was chosen against a
  scale nobody had measured.

  ⚠️ **AND 0173's OWN GUARDS WERE GREEN OVER IT, WHICH IS THE PART WORTH KEEPING.** They measured the
  tail's LENGTH, its stereo width and its decay — three properties, none of them level. A guard can
  be right about everything it measures and silent about the one thing that matters.
*/
describe('0174 — a send has to mean something', () => {
  const impulse = makeRoomImpulse(SAMPLE_RATE, makeRng('room'));

  it('THE REPORTED ONE: no cue is quieter than its own reverb', () => {
    /*
      ⚠️ **THE FLOOR IS *the room is under the sound*, WHICH IS NOT A TASTE.** How wet a cue should be
      is an ear's question and is not asserted anywhere; that the direct sound is the loud one is what
      separates a room from a barrel, and it is the thing a listener reported.

      ⚠️ **ENERGY AND NOT RMS, because the wet buffer is LONGER than the dry one** — a mean over its
      own length divides by the tail it just added, which flatters the number by exactly the ratio of
      the two lengths. That error was made and caught while measuring this.
    */
    for (const kind of CUE_KINDS) {
      const air = CUES[kind].air;
      if (air === undefined) continue;
      const dry = sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind));
      const wet = onlyRoom(dry, impulse[0]!, air * CUE_ROOM_GAIN);
      const over = 10 * Math.log10(energyOf(wet) / energyOf(thin(dry)));
      expect(over, `${kind}'s room carries ${over.toFixed(1)} dB against the cue itself`).toBeLessThan(-6);
    }
  }, 30_000);

  it('and the impulse carries unit energy, which is what makes `air` a share of the dry', () => {
    /*
      ⚠️ **THIS IS THE LINE THAT MAKES EVERY NUMBER IN `CUES` READABLE.** A convolution's gain over
      broadband input is the impulse's root energy, so normalising to one means `air * CUE_ROOM_GAIN`
      of 1 is *as loud as the dry* and 0.3 is a share of it. Without it the table is a set of numbers
      against an unstated scale, which is `docs/decisions/0140-no-layer-is-inaudible.md`'s *a gain is
      not a loudness* one bus over.
    */
    for (let c = 0; c < 2; c++) {
      let energy = 0;
      for (const v of impulse[c]!) energy += v * v;
      expect(energy, `channel ${c} carries ${energy.toFixed(3)} rather than unit energy`).toBeCloseTo(1, 3);
    }
  });
});

/** Just the room's contribution — the wet path on its own, with no dry mixed back in. */
function onlyRoom(dry: Float32Array, room: Float32Array, wet: number): Float32Array {
  const a = thin(dry);
  const b = thin(room);
  const out = new Float32Array(a.length + b.length);
  for (let i = 0; i < a.length; i++) {
    const v = a[i]!;
    if (v === 0) continue;
    for (let j = 0; j < b.length; j++) out[i + j] = out[i + j]! + v * b[j]! * wet;
  }
  return out;
}

/** Total energy, which is the only fair comparison between two buffers of different lengths. */
function energyOf(a: Float32Array): number {
  let sum = 0;
  for (const v of a) sum += v * v;
  return sum;
}
