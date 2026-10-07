// The breaks behind docs/decisions/0567-a-fitting-is-felt.md.
//
// ⚠️ The hop taken out of the stand's painter, which is the picture this decision is.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0567',
    suite: 'tests/stand.test.ts',
    broke: 'the ship left still on its beam when it is fitted',
    guard: 'hops the ship on its beam when it is fitted',
    edit: {
      path: 'src/render/port.ts',
      find: '  const across = DOCK.ride + blueBobAt(t) - hopAt(t - hop);',
      replace: '  const across = DOCK.ride + blueBobAt(t) - 0 * hopAt(t - hop);',
    },
  },
];
