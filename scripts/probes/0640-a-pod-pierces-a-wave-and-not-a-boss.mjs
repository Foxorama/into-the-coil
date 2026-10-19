// The break behind docs/decisions/0640-a-pod-pierces-a-wave-and-not-a-boss.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0640',
    suite: 'tests/surge.test.ts',
    // The pod handed its whole pierce as its boss allowance: the twelve landings on one hull that
    // made one charge most of an end boss.
    broke: 'an overdrive pod landing on a boss as often as it pierces a wave',
    guard: 'overdrive: over one charge, each pod lands on the boss no more often than',
    edit: {
      path: 'src/app/frame.ts',
      find: '    missile.bossLeft = pods.bossPierce;',
      replace: '    missile.bossLeft = pods.pierce;',
    },
  },
];
