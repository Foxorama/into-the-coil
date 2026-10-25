// The breaks behind docs/decisions/0678-a-stand-per-tab.md.
//
// ⚠️ The two halves undone: one camera on two tabs again, as 0548 left all three, and the dolly that is a cut.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0678',
    suite: 'tests/stand.test.ts',
    broke: 'the hangar’s camera on Paint & Parts too, as 0548 left every tab',
    guard: 'stands every tab somewhere of its own',
    edit: { path: 'src/state/screens.ts', find: '  camera: PARTS_CAMERA,', replace: '  camera: HANGAR_CAMERA,' },
  },
  {
    decision: '0678',
    suite: 'tests/dolly.browser.test.ts',
    broke: 'the hangar’s camera on Paint & Parts too, a tyre there the hangar’s size',
    guard: 'stands Paint & Parts close enough that a tyre is sixty pixels across',
    edit: { path: 'src/state/screens.ts', find: '  camera: PARTS_CAMERA,', replace: '  camera: HANGAR_CAMERA,' },
  },
  {
    decision: '0678',
    suite: 'tests/dolly.browser.test.ts',
    broke: 'the dolly one step long, a cut',
    guard: 'moves the room from one tab’s camera to the next over the dolly’s steps',
    edit: { path: 'src/content/port.ts', find: 'export const DOLLY_STEPS = 18;', replace: 'export const DOLLY_STEPS = 1;' },
  },
];
