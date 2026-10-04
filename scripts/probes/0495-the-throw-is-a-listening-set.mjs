// The throw is a listening set — docs/decisions/0495-the-throw-is-a-listening-set.md
//
// Every guard 0495 adds, broken on purpose. `node scripts/prove-guard.mjs 0495`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0495',
    suite: 'tests/dash.test.ts',
    // The desk's gun line back on the fighter: the shuriken judged at the pulse's cadence, as the pulse.
    broke: 'the desk’s gun line reading the fighter whatever ship is asked for',
    guard: 'THE GUN ON THE DESK: each ship fires its own gun’s cue at its own cadence, and the shuriken’s is the throw',
    edit: {
      path: 'rig/transport.ts',
      find: '  const weapon = weaponAtTier(tier, ship);\n  const inFight',
      replace: '  const weapon = weaponAtTier(tier);\n  const inFight',
    },
  },
  {
    decision: '0495',
    suite: 'tests/dash.test.ts',
    // A candidate ten times louder: a voice that wins the listen by being loud.
    broke: 'the whistle ten times louder than it is',
    guard: 'THE SET SITS WHERE A GUN SITS: no voice on the desk is louder than the loudest gun the game ships',
    edit: {
      path: 'rig/throws.ts',
      find: 'seconds: 0.18, gain: 0.14,',
      replace: 'seconds: 0.18, gain: 1.4,',
    },
  },
  {
    decision: '0495',
    suite: 'tests/dash.test.ts',
    // The every-other voice given the shipped figure: the candidate that is not a candidate.
    broke: 'every other blade struck on every blade',
    guard: 'EVERY OTHER BLADE: on the shuriken’s cadence, that voice sounds on alternate throws and on no others',
    edit: {
      path: 'rig/throws.ts',
      find: '  everyOther: { ...shipped, figure: [1, 0.72, 0, 0.74] },',
      replace: '  everyOther: { ...shipped, figure: [1, 0.72, 0.86, 0.74] },',
    },
  },
];
