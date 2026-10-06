// The breaks behind docs/decisions/0550-every-tab-has-a-keeper.md.
//
// A keeper on every tab, each tab's own and nobody else's, and a viewport in the back wall with the sky
// through it. Each put back as it was, or broken the way it would be broken.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0550',
    suite: 'tests/stand.test.ts',
    // Cosmo on all three tabs again, as 0548 left it.
    broke: 'Cosmo at the counter on every tab',
    guard: 'draws each tab’s own keeper at the counter',
    edit: {
      path: 'src/render/port.ts',
      find: '    const row = KEEPERS[keeper];',
      replace: "    const row = KEEPERS['cosmo'];",
    },
  },
  {
    decision: '0550',
    suite: 'tests/stand.test.ts',
    // Two tabs naming one keeper.
    broke: 'Paint & Parts kept by Unity',
    guard: 'draws each tab’s own keeper at the counter',
    edit: {
      path: 'src/state/screens.ts',
      find: "      // 0550: MMXXVI, who paints it.\n      keeper: 'mmxxvi',",
      replace: "      // 0550: MMXXVI, who paints it.\n      keeper: 'unity',",
    },
  },
  {
    decision: '0550',
    suite: 'tests/stand.test.ts',
    // The wall drawn whole, over the hole.
    broke: 'a wall tile over the viewport',
    guard: 'cuts a viewport in the back wall',
    edit: {
      path: 'src/render/port.ts',
      find: '      if (along > hole.along && along < hole.along + 2 * wall && across > hole.across && across < hole.across + wall) continue;\n',
      replace: '',
    },
  },
  {
    decision: '0550',
    suite: 'tests/stand.test.ts',
    // The viewport somewhere the stand never shows — up behind the plate, by the bay.
    broke: 'the viewport behind the plate',
    guard: 'cuts a viewport in the back wall',
    edit: {
      path: 'src/content/port.ts',
      find: '  viewport: { along: 60, across: 40 },',
      replace: '  viewport: { along: 120, across: 40 },',
    },
  },
];
