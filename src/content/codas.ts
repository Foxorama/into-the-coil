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
import { mixOf, rungOf, voicesOf, type ThemeKind } from './themes.ts';

/** A rest. */
const _ = null;

/** One layer's share of the coda: which layer it is voiced from, and the notes it plays. */
export interface CodaPart {
  /** The layer whose instruments, level, room and place in the field the part borrows. */
  readonly layer: MusicLayer;
  readonly voices: readonly MusicVoice[];
  /** Where in the field the part sits, when not where its layer does. */
  readonly pan?: number;
}

/** How long the coda lasts from its downbeat, rings included. */
/**
 * How long the coda lasts from its downbeat, rings included.
 *
 * ⚠️ **SIX BARS, WHERE IT WAS FOUR** — heard: *"an abrupt shift from boss music → 4 bars → end."* The chord
 * rings longer and the last phrase is slower, arriving on its A a bar later; the walk-down into it is
 * `scripts/hear.mjs --album`'s reprise.
 */
export const CODA_SECONDS = BAR_SECONDS * 6 + 2;

/** How long `theme`'s coda lasts — a drum ending is over when its last hit has rung, not when a chord has. */
export const codaSecondsOf = (theme: ThemeKind): number => (theme === 'saurian' ? BAR_SECONDS * 2 + 1.4 : CODA_SECONDS);

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
  /** Which layer each role was taken from — the level, room and field it borrows. Absent is the usual one. */
  readonly from?: Partial<Record<'drone' | 'pad' | 'low' | 'lead' | 'kit', MusicLayer>>;
}

/** The rungs a place's piece sounds on, for asking whether it ever plays a layer. */
const SOUNDING_RUNGS = ['run', 'push', 'surge', 'approach', 'boss', 'bossPeak'] as const;

/**
 * The first of `layers` that `theme` ever sounds.
 *
 * ⚠️ **0331, heard on the album**: *"saurian belt just abruptly ends and then has about 8 seconds of silence."*
 * Saurian Belt never opens `drone`, `chords` or `call` — its floor is its own kit, bass and supersaw riff — so a
 * coda that took its pad, drone and lead from those three layers had nothing to play but one low note and one
 * drum, and then rang out an empty room. Every role now takes the first layer in its list the place plays.
 */
const soundingOf = (theme: ThemeKind, layers: readonly MusicLayer[]): MusicLayer | undefined =>
  layers.find((layer) => SOUNDING_RUNGS.some((rung) => rungOf(theme, rung, layer) * mixOf(theme, layer) > 0));

/** Every part of `theme`'s coda, on the place's own instruments. */
export function codaOf(theme: ThemeKind): CodaPart[] {
  if (theme === 'saurian') return saurianCoda();
  const drone = soundingOf(theme, ['drone', 'toll']);
  const pad = soundingOf(theme, ['chords', 'counter', 'hook', 'arp', 'lead', 'groove']);
  const low = soundingOf(theme, ['sub', 'bass', 'groove']);
  const lead = soundingOf(theme, ['call', 'hook', 'lead', 'counter', 'arp'].filter((l) => l !== pad || l === 'hook') as MusicLayer[]);
  const kit = soundingOf(theme, ['engine', 'perc', 'beat']);
  const of = (layer: MusicLayer | undefined): readonly MusicVoice[] => (layer === undefined ? [] : voicesOf(theme, layer));
  const parts = codaOn({
    drone: of(drone),
    pad: of(pad),
    low: of(low),
    lead: of(lead),
    kit: of(kit),
    from: { drone, pad, low, lead, kit },
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
  const ring = BAR_SECONDS * 7.2;

  // The drone, held under everything.
  const drone = instruments.drone.filter((v) => v.pitched);
  if (drone.length > 0) parts.push({ layer: instruments.from?.drone ?? 'drone', voices: drone.map((v) => played(v, [0], 0.25, ring, BAR_SECONDS * 3.2)) });

  // The tonic chord, struck on the place's own pad: root, third and fifth on every held voice.
  // A place whose pad is a struck riff rather than a held chord lets that riff ring instead.
  const pitchedPad = instruments.pad.filter((v) => v.pitched);
  const held = pitchedPad.filter(pitchedHeld);
  const pad = held.length > 0 ? held : pitchedPad;
  if (pad.length > 0) {
    parts.push({ layer: instruments.from?.pad ?? 'chords', voices: pad.flatMap((v) => [0, 3, 7].map((tone) => played(v, [tone], 0.25, ring, BAR_SECONDS * 3.4, 0.55))) });
  }

  // The lowest note, once.
  const sub = instruments.low.find((v) => v.pitched);
  if (sub !== undefined) parts.push({ layer: instruments.from?.low ?? 'sub', voices: [played(sub, [0], 0.25, BAR_SECONDS * 2.2, BAR_SECONDS)] });

  // The lead's last phrase: E, D, C, B in half notes onto a long A.
  const lead = instruments.lead;
  const up = (v: MusicVoice): number => (v.octave < 2 ? 12 : 0);
  const phrase = (v: MusicVoice): (number | null)[] => [7, _, 5, _, 3, _, _, _, 2, _, _, _].map((n) => (n === null || !v.pitched ? (n === null ? _ : 1) : n + up(v)));
  const last = (v: MusicVoice): (number | null)[] => [_, _, _, _, _, _, _, _, _, _, _, _, v.pitched ? 0 + up(v) : 1];
  const leadVoices = lead.flatMap((v) => [
    played(v, phrase(v), 1, v.pitched ? BEAT_SECONDS * 3.4 : v.note.seconds, v.pitched ? BEAT_SECONDS : v.note.seconds / 3),
    played(v, last(v), 1, v.pitched ? BAR_SECONDS * 4 : v.note.seconds, v.pitched ? BAR_SECONDS * 2.8 : v.note.seconds / 3),
  ]);
  if (leadVoices.length > 0) parts.push({ layer: instruments.from?.lead ?? 'call', voices: leadVoices });

  // One last deep hit, on the place's kit.
  const hit = instruments.kit.find((v) => !v.pitched && v.note.wave === 'sine') ?? instruments.kit.find((v) => !v.pitched);
  if (hit !== undefined) parts.push({ layer: instruments.from?.kit ?? 'engine', voices: [{ ...hit, steps: [1], perBeat: 0.25, accents: undefined, loose: undefined }] });

  return parts;
}

/**
 * Saurian Belt's coda: the kit, and nothing else.
 *
 * ⚠️ **0331, heard on the album**: *"ending of the saurian belt is still a bit discordant and doesn't fit the
 * ending of the track, it needs like a closing drumbeat or something instead of the sounds we have now."* The
 * shared cadence voiced here as a held supersaw chord, a toll and a falling riff — three things this piece only
 * ever plays moving. Its identity is its drums, so it ends the way a drummer ends a set: one bar of the groove as
 * everything else lets go, the toms run down across the field left to right, and every drum at once on the last
 * downbeat with the bass's A under it.
 */
function saurianCoda(): CodaPart[] {
  const beat = voicesOf('saurian', 'beat');
  const punch = voicesOf('saurian', 'ownC');
  const fill = voicesOf('saurian', 'ownD');
  const sub = voicesOf('saurian', 'sub').find((v) => v.pitched);
  const LAST = 16;
  const at = (hits: Record<number, number>): (number | null)[] => Array.from({ length: LAST + 1 }, (_u, i) => hits[i] ?? _);
  const struck = (voice: MusicVoice, hits: Record<number, number>, note: Partial<MusicVoice['note']> = {}): MusicVoice => ({
    ...voice,
    steps: at(hits),
    perBeat: 4,
    accents: undefined,
    loose: undefined,
    note: { ...voice.note, ...note },
  });
  const parts: CodaPart[] = [];

  // The groove's last bar: kick on the first three beats and the last hit, the snare on two, the hats to halfway.
  const [kick, snare, hats] = beat;
  const kit: MusicVoice[] = [];
  if (kick !== undefined) kit.push(struck(kick, { 0: 1, 4: 0.9, 8: 0.96 }), struck(kick, { [LAST]: 0.75 }, { seconds: 0.6, curve: 3 }));
  if (snare !== undefined) kit.push(struck(snare, { 4: 1 }));
  if (hats !== undefined) kit.push(struck(hats, { 0: 1, 1: 0.42, 2: 0.66, 3: 0.38, 4: 1, 5: 0.42, 6: 0.66, 7: 0.38 }));
  parts.push({ layer: 'beat', voices: kit });

  // The run down the toms, a pair of strokes to each, cascading left to right as the fill in the piece does.
  const velocity = (i: number): number => 0.72 + (i - 8) * 0.04;
  const stick = fill.find((v) => v.note.wave === 'noise');
  const toms = fill.filter((v) => v.note.wave === 'sine');
  const high = toms[0] === undefined ? undefined : { ...toms[0], note: { ...toms[0].note, from: 240, to: 172, seconds: 0.22 } };
  [high, ...toms].forEach((tom, n) => {
    if (tom === undefined) return;
    const a = 8 + n * 2;
    const hits = { [a]: velocity(a), [a + 1]: velocity(a + 1) };
    parts.push({
      layer: 'ownD',
      pan: [-0.65, -0.22, 0.22, 0.65][n],
      voices: [struck(tom, hits), ...(stick === undefined ? [] : [struck(stick, hits)])],
    });
  });

  // The last downbeat: floor tom and snare crack together, let ring, dead centre.
  const floor = punch.find((v) => v.note.wave === 'sine' && v.note.to < 90);
  const crack = punch.find((v) => v.note.wave === 'noise' && v.note.seconds > 0.08);
  const last: MusicVoice[] = [];
  if (floor !== undefined) last.push(struck(floor, { [LAST]: 0.7 }, { seconds: 0.9, curve: 3 }));
  if (crack !== undefined) last.push(struck(crack, { [LAST]: 0.65 }, { seconds: 0.45, curve: 4 }));
  parts.push({ layer: 'ownC', pan: 0, voices: last });

  // And the bass's A under it, once.
  if (sub !== undefined) parts.push({ layer: 'sub', voices: [played(sub, at({ [LAST]: 0 }), 4, BAR_SECONDS * 1.1, BAR_SECONDS * 0.9)] });

  return parts;
}
