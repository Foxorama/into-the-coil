// The breaks behind docs/decisions/0568-the-hangar-opens-out.md.
//
// ⚠️ The two halves of the ask undone: the camera that no longer keeps the bay and its stars in view, and
// the plate that grows with the screen again.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0568',
    suite: 'tests/stand.test.ts',
    broke: 'the camera let close in to 0563’s zoom, the room cropped and the stars a sliver',
    guard: 'shows the end of the hangar and the open stars past it',
    edit: {
      path: 'src/state/screens.ts',
      find: 'const PORT_CAMERA: StandCamera = { along: 142, across: 74, zoom: 1.15, x: 0.6, y: 0.5 };',
      replace: 'const PORT_CAMERA: StandCamera = { along: 142, across: 74, zoom: 1.9, x: 0.6, y: 0.5 };',
    },
  },
  {
    decision: '0568',
    suite: 'tests/stand.test.ts',
    broke: 'the camera on the inner pad again, the bay far off to the right',
    guard: 'shows the end of the hangar and the open stars past it',
    edit: {
      path: 'src/state/screens.ts',
      find: 'const PORT_CAMERA: StandCamera = { along: 142, across: 74, zoom: 1.15, x: 0.6, y: 0.5 };',
      replace: 'const PORT_CAMERA: StandCamera = { along: 94, across: 74, zoom: 1.15, x: 0.6, y: 0.5 };',
    },
  },
  {
    decision: '0568',
    suite: 'tests/foot.browser.test.ts',
    broke: 'the plate a share of the screen again, growing with it',
    guard: 'holds the plate to one width',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    grid-template-columns: minmax(0, 24rem) minmax(0, 1fr);',
      replace: '    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);',
    },
  },
];
