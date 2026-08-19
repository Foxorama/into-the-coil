// The break behind docs/decisions/0175-an-experiment-arrives-the-way-the-game-does.md.
//
// ⚠️ TWO OF THESE ARE GONE AND THE REASON IS 0176. 0175 gave `levelWrites` a handed-in gain table so
// the desk's non-shipped modes could arrive on the downbeat over the mixer's own ramp instead of
// cutting in 30 ms. The re-based mix is the game's mix now, the modes are deleted, and the parameter
// went with them — so *a handed-in table is ignored* and *the table covers the aura too* are breaks
// against code that is not there. Repointing them at anything would be theatre, which is
// docs/decisions/0019-a-probe-must-be-seen-to-apply.md's own STILL GREEN.
//
// ⚠️ WHAT SURVIVES IS THE ONE THAT WAS NEVER ABOUT THE PARAMETER. The defect was a correct value
// written at the wrong TIME through a legitimate API, and the only thing that could catch it is a
// scan for a second hand on a music gain. The desk still has to have that property, however many
// mixes it plays.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0175',
    suite: 'tests/music.test.ts',
    broke: 'the desk writing a gain outside `restate` again, which is how the cut got in',
    guard: 'and `restate` is the only place in rig/dash.ts that writes one',
    edit: {
      path: 'rig/dash.ts',
      find: '  const moment = now();\n  const music = out.music();',
      replace:
        '  const moment = now();\n  const music = out.music();\n  ' +
        'if (music !== null) for (const l of moment.layers) music.gainOf(l.layer).setTargetAtTime(l.target, 0, 0.03);',
    },
  },
];
