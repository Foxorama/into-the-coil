/**
 * The shuriken's listening set — `docs/decisions/0495-the-throw-is-a-listening-set.md`.
 *
 * Item 12 of `reports/the-bosses-look-planned-2026-10-04.md`, its 13. The player does not know what the
 * shuriken should sound like, only that the one it has is wearing: a launcher thump, a noise *shing*
 * sweeping 11 kHz down to 3.2 kHz, two triangle partials a fifth apart and a square tick, five times a
 * second for a whole run. Nothing in a suite can hear (0027), so this is a question put on the desk, not
 * a change: the shipped voice and four candidates, switched while the level plays.
 *
 * ⚠️ **EACH CANDIDATE IS THE SHIPPED ROW WITH ONE THING CHANGED**, so a listener can attribute what they
 * hear to that one thing. Built from `CUES.throw` rather than written out, so the four stay pinned to
 * the shipped voice: re-voicing the throw re-voices all of them.
 *
 * ⚠️ **RIG-SIDE, AND NOTHING UNDER `src/` READS IT.** The one the player picks becomes the throw in
 * `src/content/cues.ts`, and this file goes with the others in the same PR.
 */

import { CUES, inKey, type CueLayer, type CueRow } from '../src/content/cues.ts';

/** The voices on the desk. Closed, per 0016. */
export type ThrowVoice = 'shipped' | 'noShing' | 'thrum' | 'everyOther' | 'whistle';

export const THROW_VOICE_KINDS: readonly ThrowVoice[] = ['shipped', 'noShing', 'thrum', 'everyOther', 'whistle'];

/** What each is called on the desk, and the one thing it changes. */
export const THROW_VOICE_LABELS: Record<ThrowVoice, string> = {
  shipped: 'shipped — as it is',
  noShing: 'no shing — the noise sweep gone',
  thrum: 'the thrum — a pitched whirr, no noise',
  everyOther: 'every other blade — the cue on alternate throws',
  whistle: 'the whistle — a bending tone under the launcher',
};

const shipped = CUES.throw;
/*
  ⚠️ **READ BY POSITION, AND THE CHECK IS WHY THAT IS SAFE.** The shipped row's layers are, in order,
  the launcher, the shing, the two steel partials and the tick (`src/content/cues.ts` names each). A
  re-voice that changed the count would leave these naming the wrong layers, so it throws instead.
*/
if (shipped.layers.length !== 5) throw new Error('the throw is no longer launcher, shing, two partials and a tick');
// The second, the shing, is the one no candidate keeps but `shipped` and `everyOther`.
const [launcher, , steelLow, steelHigh, tick] = shipped.layers as [CueLayer, CueLayer, CueLayer, CueLayer, CueLayer];

/**
 * Every voice the desk can put on the air, as a cue row the game's own synthesiser plays.
 *
 * ⚠️ **`ROWS` IS ALSO THE NAME `scripts/weigh-cue.mjs --from=` AND `scripts/weigh-fit.mjs --from=` READ**,
 * so the numbers in the decision are measured off these exact rows and not a copy of them.
 */
export const ROWS: Record<ThrowVoice, CueRow> = {
  shipped,
  // The likeliest irritant is bright noise in the band the ear is most sensitive to (0463's finding on
  // the ray gun). This is that, and only that, taken out.
  noShing: { ...shipped, layers: [launcher, steelLow, steelHigh, tick] },
  /*
    A pitched whirr on the root falling a fifth — a saw under a lowpass that closes, with a flutter in it
    — and the partials an octave down. No noise at all: the blade is a note that spins away.
  */
  thrum: {
    ...shipped,
    layers: [
      launcher,
      { wave: 'saw', from: inKey(14), to: inKey(10), seconds: 0.13, gain: 0.3, attack: 0.003, curve: 3, lowFrom: 1800, lowTo: 500, q: 1.6, vibrato: 45, pan: -0.35, panTo: 0.35 },
      { ...steelLow, from: inKey(22), to: inKey(21) },
      { ...steelHigh, from: inKey(26), to: inKey(25) },
      tick,
    ],
  },
  /*
    The cue on alternate throws, 2.5 a second. The gun fires every twelve steps, so its throws land on
    the first and third slots of `variantAt`'s four (`src/app/sound.ts`); a silent third slot leaves the
    blade on the downbeat and drops the one between. The figure is still on the beat.
  */
  everyOther: { ...shipped, figure: [1, 0.72, 0, 0.74] },
  /*
    A tone that bends with the blade's swing: a sine that slides down a third and across the field over
    most of a throw's interval, quiet, under the launcher. Nothing else.
  */
  whistle: {
    ...shipped,
    layers: [
      launcher,
      { wave: 'sine', from: inKey(23), to: inKey(21), seconds: 0.18, gain: 0.14, attack: 0.025, curve: 2, release: 0.05, pan: -0.5, panTo: 0.5 },
    ],
  },
};
