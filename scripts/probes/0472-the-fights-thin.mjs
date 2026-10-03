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
  {
    decision: '0472',
    suite: 'tests/corridor.test.ts',
    // The drop thrown where the hull died, inside the wall, as CI caught it once the fight was shorter.
    broke: 'a drop born where the hull died, stone or not',
    guard: '0472 — a drop thrown from over the stone is born beside it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (side !== 0 && w.corridor !== null) item.across = outOfStone(w.corridor, item.along, item.across, item.radius, side);',
      replace: '  void side;',
    },
  },
];
