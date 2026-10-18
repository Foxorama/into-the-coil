// The breaks behind docs/decisions/0619-every-flame-is-the-largest.md.
//
// ⚠️ Every ship's flame in the port grows to the largest ship's. A grow of one is the picture before the
// ask; a grow to the smallest is every flame the same size and the wrong one — the ask says the max.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0619',
    suite: 'tests/intro.test.ts',
    broke: 'every flame at its own ship’s size, as before the ask',
    guard: 'burns every ship’s flame on the pad and in the chase as big as the largest ship’s',
    edit: {
      path: 'src/content/port.ts',
      find: '  return largest / SHIPS[ship].intro[view];',
      replace: '  return (largest * 0 + SHIPS[ship].intro[view]) / SHIPS[ship].intro[view];',
    },
  },
  {
    decision: '0619',
    suite: 'tests/intro.test.ts',
    broke: 'every flame the same size, and that size the smallest',
    guard: 'burns every ship’s flame on the pad and in the chase as big as the largest ship’s',
    edit: {
      path: 'src/content/port.ts',
      find: '  let largest = 0;\n  for (const kind of SHIP_KINDS) largest = Math.max(largest, SHIPS[kind].intro[view]);',
      replace: '  let largest = Number.POSITIVE_INFINITY;\n  for (const kind of SHIP_KINDS) largest = Math.min(largest, SHIPS[kind].intro[view]);',
    },
  },
];
