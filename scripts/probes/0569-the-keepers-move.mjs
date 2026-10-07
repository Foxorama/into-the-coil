// The breaks behind docs/decisions/0569-the-keepers-move.md.
//
// ⚠️ The keeper drawn at the counter whatever their spot says, which is the stall standing still.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0569',
    suite: 'tests/stand.test.ts',
    broke: 'every keeper at their counter whatever their spot says',
    guard: 'draws each keeper where their spot says',
    edit: {
      path: 'src/render/port.ts',
      // 0571: in the shops' loop, which every keeper is drawn by; the line after it makes the anchor its own.
      find: '    const place = row.spots[spots === null ? 0 : spots[kind]] ?? row.spots[0];\n    const shop = DOCK.shops[kind];',
      replace: '    const place = row.spots[0];\n    const shop = DOCK.shops[kind];',
    },
  },
];
