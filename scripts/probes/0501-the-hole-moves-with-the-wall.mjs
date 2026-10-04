// The hole moves with the wall — docs/decisions/0501-the-hole-moves-with-the-wall.md
//
// Every guard 0501 adds or widens, broken on purpose. `node scripts/prove-guard.mjs 0501`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0501',
    suite: 'tests/gyre.test.ts',
    // The gyre back on one place for every wall: two walls along the far edge open where the ship already is.
    broke: 'the gyre authoring no hole per stance, so every wall uses the one place',
    guard: '0501 — THE HOLES MOVE: each wall’s hole is away from the one before it, where the ship has to be',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'at: 31, atBy: GYRE_HOLES, hole: 14, spin: true',
      replace: 'at: 31, atBy: null, hole: 14, spin: true',
    },
  },
  {
    decision: '0501',
    suite: 'tests/gyre.test.ts',
    // The thrower reading the row's one place and not the stance's: the row says one thing, the wall another.
    broke: 'the curtain thrown with its hole at the row’s one place whatever the stance',
    guard: 'THE EIGHT WALLS, DRIVEN: each one line with one hole at the same share of it, each spanning a whole axis of the field',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const hole = (holeAt(uncoil, stance) / ACROSS_SPAN) * length;',
      replace: '  const hole = (uncoil.at / ACROSS_SPAN) * length;',
    },
  },
  {
    decision: '0501',
    suite: 'tests/level.test.ts',
    // One stance's hole hung off the end of its line: a narrower hole than the row says, on one wall in eight.
    broke: 'the slant’s hole hung off the far end of its line',
    guard: 'and the whole hole is inside the lane',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'alongNear: 30, slant: 89 };',
      replace: 'alongNear: 30, slant: 116 };',
    },
  },
];
