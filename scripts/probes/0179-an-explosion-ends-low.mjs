// The breaks behind docs/decisions/0179-an-explosion-ends-low.md.
//
// ⚠️ THE FIRST IS THE SHIPPED DEFECT, RESTORED, and it is one field. The `kill` cue's debris layer
// had a highpass that fell and NO `lowTo` at all, so it held 7 kHz flat for 0.36 s over a body that
// was finished at 0.17 — and the cue's centre of gravity ROSE from 266 Hz to 3534 Hz. Every other
// explosion in the table falls between 7 and 12 dB. Eighty-four guards were green over it.
//
// ⚠️ AND THE SECOND IS THE HALF THAT IS NOT A FILTER. A cue whose last third has nothing at the
// bottom ends bright however its top behaves, so the low voice reaching 0.30 s is load-bearing and
// not a garnish. It is the layer 0109's rumble finding made everybody afraid to lengthen, and the
// reason it is allowed is that it is PITCHED — see the decision.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0179',
    suite: 'tests/sound.test.ts',
    broke: 'the streak left undarkened, so the cue’s fall flattens to 1.9dB — half of the shipped defect',
    guard: '0179 — THE REPORTED ONE: an explosion ENDS LOWER THAN IT STARTED, which none of the above sees',
    edit: {
      path: 'src/content/cues.ts',
      find: "seconds: 0.36, gain: 0.15, attack: 0.012, curve: 3, lowFrom: 7000, lowTo: 2400, highFrom: 1500, highTo: 800",
      replace: "seconds: 0.36, gain: 0.15, attack: 0.012, curve: 3, lowFrom: 7000, highFrom: 1500, highTo: 800",
    },
  },
  {
    decision: '0179',
    suite: 'tests/sound.test.ts',
    broke: 'the low voice back inside the body’s own length, so the last third of the cue has no bottom',
    guard: '0179 — THE REPORTED ONE: an explosion ENDS LOWER THAN IT STARTED, which none of the above sees',
    edit: {
      path: 'src/content/cues.ts',
      find: "{ wave: 'sine', from: inKey(6), to: inKey(1), seconds: 0.3, gain: 0.9, attack: 0.001, curve: 3.4 }",
      replace: "{ wave: 'sine', from: inKey(6), to: inKey(1), seconds: 0.17, gain: 0.9, attack: 0.001, curve: 3.4 }",
    },
  },
];
