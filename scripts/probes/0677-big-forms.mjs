// The break behind docs/decisions/0677-big-forms.md.
//
// ⚠️ It puts back the wall the review called a grid: every tile the bare panel, lit or not, at the tile's pitch.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0677',
    suite: 'tests/forms.browser.test.ts',
    broke: 'every wall tile pinned to the bare panel, no vent, patch or conduit on any',
    guard: 'draws the dock’s wall as tiles that are not all one picture',
    edit: {
      path: 'src/render/port.ts',
      find: '  return WALL_OVERLAY[column * OVERLAY_ROWS + row] ?? -1;',
      replace: '  return WALL_OVERLAY[column * OVERLAY_ROWS + row] === undefined ? -1 : -1;',
    },
  },
];
