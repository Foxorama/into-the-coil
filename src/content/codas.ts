/**
 * THE CODA — how each place's piece ends, played once, in the place's own instruments.
 *
 * ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`, and the album plan's step 3 in its first form.**
 * Asked for with the album: *"we need to turn these into proper music tracks with a closing end — and not
 * have the boss music going on for so long."* Every piece in this game is loops, and a loop has no last
 * bar. This is the last bar: four of them, struck once on a downbeat after the fight has had its say, and
 * then left to ring.
 *
 * ⚠️ **WRITTEN ONCE, VOICED SEVEN TIMES.** Every place ends on the same gesture — the tonic chord struck on
 * its own pad over its drone and its lowest bass note, its lead instrument falling E, D, C, B onto a long
 * held A, and one last deep hit — and every place plays it on the instruments it already owns, taken from
 * its own layers, so The Black Heart ends on its piano and flute and Saurian Belt on its own synths. What
 * is shared is the cadence; what is heard is the place.
 *
 * ⚠️ **THE ALBUM RENDERS IT TODAY; THE GAME IS OWED IT.** `scripts/hear.mjs --album` strikes it after the
 * fight's fifteen seconds. In the game it belongs on the boss's death (the plan's coda rung), which is its
 * own change — this table is where both will read it from.
 */

import { BAR_SECONDS, BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';
import { voicesOf, type ThemeKind } from './themes.ts';

/** A rest. */
const _ = null;

/** One layer's share of the coda: which layer it is voiced from, and the notes it plays. */
export interface CodaPart {
  /** The layer whose instruments, level, room and place in the field the part borrows. */
  readonly layer: MusicLayer;
  readonly voices: readonly MusicVoice[];
}

/** How long the coda lasts from its downbeat, rings included. */
export const CODA_SECONDS = BAR_SECONDS * 4 + 3;

const pitchedHeld = (voice: MusicVoice): boolean => voice.pitched && voice.note.seconds >= BEAT_SECONDS * 1.5;

/** A voice's instrument, playing `steps` at `perBeat`, held `seconds` and dying over `release`. */
const played = (voice: MusicVoice, steps: readonly (number | null)[], perBeat: number, seconds: number, release: number, gain = 1): MusicVoice => ({
  ...voice,
  steps,
  perBeat,
  accents: undefined,
  loose: undefined,
  note: {
    ...voice.note,
    seconds,
    gain: voice.note.gain * gain,
    attack: Math.min(voice.note.attack ?? 0.01, 0.3),
    curve: Math.min(voice.note.curve ?? 1, 0.8),
    release,
  },
});

/** The instruments a coda is played on — any piece can hand its own. */
export interface CodaInstruments {
  readonly drone: readonly MusicVoice[];
  readonly pad: readonly MusicVoice[];
  readonly low: readonly MusicVoice[];
  readonly lead: readonly MusicVoice[];
  readonly kit: readonly MusicVoice[];
}

/** Every part of `theme`'s coda, on the place's own instruments. */
export function codaOf(theme: ThemeKind): CodaPart[] {
  const parts = codaOn({
    drone: voicesOf(theme, 'drone'),
    pad: voicesOf(theme, 'chords'),
    low: voicesOf(theme, 'sub'),
    lead: voicesOf(theme, 'call'),
    kit: [...voicesOf(theme, 'engine'), ...voicesOf(theme, 'perc')],
  });
  // The Black Heart's heart: two last beats, the second never followed.
  if (theme === 'core') {
    const heart = voicesOf(theme, 'ownB');
    const steps: (number | null)[] = Array.from({ length: 32 }, () => _);
    steps[0] = 1;
    steps[2] = 0.7;
    steps[22] = 0.8;
    steps[24] = 0.5;
    parts.push({ layer: 'ownB', voices: heart.map((v) => ({ ...v, steps, perBeat: 4, accents: undefined, loose: undefined })) });
  }
  return parts;
}

/** The coda on any set of instruments. The parts are named by the layer each one borrows its level from. */
export function codaOn(instruments: CodaInstruments): CodaPart[] {
  const parts: CodaPart[] = [];
  const ring = BAR_SECONDS * 4.4;

  // The drone, held under everything.
  const drone = instruments.drone.filter((v) => v.pitched);
  if (drone.length > 0) parts.push({ layer: 'drone', voices: drone.map((v) => played(v, [0], 0.25, ring, BAR_SECONDS * 2)) });

  // The tonic chord, struck on the place's own pad: root, third and fifth on every held voice.
  const pad = instruments.pad.filter(pitchedHeld);
  if (pad.length > 0) {
    parts.push({ layer: 'chords', voices: pad.flatMap((v) => [0, 3, 7].map((tone) => played(v, [tone], 0.25, ring, BAR_SECONDS * 2.2, 0.55))) });
  }

  // The lowest note, once.
  const sub = instruments.low.find((v) => v.pitched);
  if (sub !== undefined) parts.push({ layer: 'sub', voices: [played(sub, [0], 0.25, BAR_SECONDS * 2.2, BAR_SECONDS)] });

  // The lead's last phrase: E, D, C, B in half notes onto a long A.
  const lead = instruments.lead;
  const up = (v: MusicVoice): number => (v.octave < 2 ? 12 : 0);
  const phrase = (v: MusicVoice): (number | null)[] => [7, _, 5, _, 3, _, _, 2].map((n) => (n === null || !v.pitched ? (n === null ? _ : 1) : n + up(v)));
  const last = (v: MusicVoice): (number | null)[] => [_, _, _, _, _, _, _, _, v.pitched ? 0 + up(v) : 1];
  const leadVoices = lead.flatMap((v) => [
    played(v, phrase(v), 1, v.pitched ? BEAT_SECONDS * 2.4 : v.note.seconds, v.pitched ? BEAT_SECONDS : v.note.seconds / 3),
    played(v, last(v), 1, v.pitched ? BAR_SECONDS * 2.6 : v.note.seconds, v.pitched ? BAR_SECONDS * 1.6 : v.note.seconds / 3),
  ]);
  if (leadVoices.length > 0) parts.push({ layer: 'call', voices: leadVoices });

  // One last deep hit, on the place's kit.
  const hit = instruments.kit.find((v) => !v.pitched && v.note.wave === 'sine') ?? instruments.kit.find((v) => !v.pitched);
  if (hit !== undefined) parts.push({ layer: 'engine', voices: [{ ...hit, steps: [1], perBeat: 0.25, accents: undefined, loose: undefined }] });

  return parts;
}
