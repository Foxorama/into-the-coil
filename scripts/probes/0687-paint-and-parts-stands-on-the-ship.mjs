// The breaks behind docs/decisions/0687-paint-and-parts-stands-on-the-ship.md: the monitor sized by the tab's own
// camera again, so a closer tab draws a bigger cockpit.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0687',
    suite: 'tests/dolly.browser.test.ts',
    broke: 'the monitor at the wall’s width in each tab’s own camera, twice the size on Paint & Parts',
    guard: '0687 — THE ASK: the cockpit monitor is the same size on Paint & Parts',
    edit: {
      path: 'src/app/mount.ts',
      find: '    standMarksInto(world.standView, stand.keeper, world.standSpots ?? null, marks, view.scale * hangarFramed.zoom);\n    chrome.setStandMarks(current, marks);',
      replace: '    standMarksInto(world.standView, stand.keeper, world.standSpots ?? null, marks);\n    chrome.setStandMarks(current, marks);',
    },
  },
];
