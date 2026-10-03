// The fights thin — docs/decisions/0472-the-fights-thin.md
//
// Every guard 0472 moves, broken on purpose. `node scripts/prove-guard.mjs 0472`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0472',
    suite: 'tests/midboss.test.ts',
    // The report, put back: the lattice at the health solved for the content multiplied by nothing,
    // which fought for 56 s at the tuned tier against the 20 its level asks for.
    broke: 'the lattice back at the health solved off the tuned tier',
    guard: 'THE REPORTED ONE: a mid-boss fight lasts what its level asks',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    health: 101,',
      replace: '    health: 187,',
    },
  },
];
