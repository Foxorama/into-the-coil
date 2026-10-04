// The beast lights thrice — docs/decisions/0519-the-beast-lights-thrice.md
//
// Every guard 0519 adds, broken on purpose. `node scripts/prove-guard.mjs 0519`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0519',
    suite: 'tests/hydra.test.ts',
    // The report, put back: any piece's flash relights the whole animal, whenever it comes.
    broke: 'the whole animal relit by any piece it is struck on, with no gap of its own',
    guard: 'the whole animal lights no more than three times in any second',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (struck && w.beastGap === 0) {',
      replace: '  if (struck) {',
    },
  },
];
