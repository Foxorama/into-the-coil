// The fish sheds off its flanks — docs/decisions/0514-the-fish-sheds-off-its-flanks.md
//
// Every guard 0514 adds, broken on purpose. `node scripts/prove-guard.mjs 0514`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0514',
    suite: 'tests/shed.test.ts',
    // The report, put back: the flank thrown from the rim facing the ship, at the ship — out of the mouth.
    broke: 'a flank fragment thrown from the face, at the ship',
    guard: 'volans: a hit sheds its own fragment, from where it landed, and never more than five a second',
    edit: {
      path: 'src/app/frame.ts',
      find: "  const heading = shed.from === 'flank' ? toShip + side * w.shedRng.range(Math.PI / 2, (Math.PI * 3) / 4) : toShip;",
      replace: '  const heading = toShip + side * 0;',
    },
  },
];
