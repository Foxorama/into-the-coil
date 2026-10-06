// The breaks behind docs/decisions/0554-unity-leans-on-the-wrench.md.
//
// A keeper who stands on their counter is drawn over it, as Unity on their bench. Put back as it was.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0554',
    suite: 'tests/stand.test.ts',
    // Unity drawn before the bench they stand on, so the bench paints over their boots and legs.
    broke: 'a keeper on the counter drawn under it',
    guard: 'stands the tab’s keeper at their counter beside the pad',
    edit: {
      path: 'src/render/port.ts',
      find: '    put(surface, view, PORT_SPRITE[row.counter], STAGE.stall.along, STAGE.stall.across);\n    if (row.stands === \'on\') put(surface, view, PORT_SPRITE[row.figure], along, across);',
      replace: '    if (row.stands === \'on\') put(surface, view, PORT_SPRITE[row.figure], along, across);\n    put(surface, view, PORT_SPRITE[row.counter], STAGE.stall.along, STAGE.stall.across);',
    },
  },
];
