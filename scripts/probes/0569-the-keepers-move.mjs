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
      find: '  const place = row === null ? null : (row.spots[spot] ?? row.spots[0]);',
      replace: '  const place = row === null ? null : (row.spots[0 * spot] ?? row.spots[0]);',
    },
  },
];
