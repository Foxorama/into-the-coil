// The breach has a body — docs/decisions/0375-the-breach-has-a-body.md
//
// Every guard 0375 adds, broken on purpose. `node scripts/prove-guard.mjs 0375`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0375',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE SPLASH TURNED BACK THE WAY 0313 HAD IT: a lowpass that OPENS from 2.6 kHz to 9.5, so the
      cue ends brighter than it began. The weight moves up the spectrum with it, which is the thing
      the report was about.
    */
    broke: 'the splash opening upward again, so the breach ends as a hiss',
    guard: 'THE ASKED-FOR ONE: the breach’s weight is below the middle of the spectrum',
    edit: {
      path: 'src/content/cues.ts',
      find: 'lowFrom: 3800, lowTo: 380, highFrom: 160, highTo: 90, q: 0.9, pan: -0.5, panTo: 0.5 },',
      replace: 'lowFrom: 2600, lowTo: 9500, highFrom: 160, highTo: 90, q: 0.9, pan: -0.5, panTo: 0.5 },',
    },
  },
  {
    decision: '0375',
    suite: 'tests/volans.test.ts',
    // The whoomph and the wake both pulled, so the cue is spray with nothing under it.
    broke: 'the whoomph and the wake pulled out, so the breach has no body under its spray',
    guard: 'THE ASKED-FOR ONE: the breach’s weight is below the middle of the spectrum',
    edit: {
      path: 'src/content/cues.ts',
      find: "      { wave: 'sine', from: inKey(7), to: inKey(-4), seconds: 0.34, gain: 0.8, attack: 0.004, curve: 2.6, drive: 0.24 },\n",
      replace: '',
    },
  },
  {
    decision: '0375',
    suite: 'tests/volans.test.ts',
    // The spit's picture claimed by nothing of its own.
    broke: 'the spit given the threat’s picture, so nothing on the screen is its twin',
    guard: 'and the spit is a tenth of a second with a picture',
    edit: {
      path: 'src/content/cues.ts',
      find: "    twin: 'spit-appears',",
      replace: "    twin: 'threat-appears',",
    },
  },
];
