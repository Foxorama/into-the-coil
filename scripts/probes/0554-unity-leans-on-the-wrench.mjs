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
      // 0569: read off the keeper's spot at the counter, where it said `stands` on the row.
      find: "    put(surface, view, PORT_SPRITE[row.counter], shop, DOCK.shopAcross, 1, 0, s);\n    if (place.at === 'counter' && place.drawn === 'over') put(surface, view, PORT_SPRITE[row.figure], along, across, 1, 0, s);",
      replace: "    if (place.at === 'counter' && place.drawn === 'over') put(surface, view, PORT_SPRITE[row.figure], along, across, 1, 0, s);\n    put(surface, view, PORT_SPRITE[row.counter], shop, DOCK.shopAcross, 1, 0, s);",
    },
  },
];
