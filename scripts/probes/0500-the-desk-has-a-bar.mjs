// The desk has a bar — docs/decisions/0500-the-desk-has-a-bar.md
//
// Every guard 0500 adds, broken on purpose. `node scripts/prove-guard.mjs 0500`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0500',
    suite: 'tests/camera.test.ts',
    // The camera told of a bar and fitting the world to the whole screen anyway.
    broke: 'the camera keeping the bar it is told of and fitting the world to the whole screen',
    guard: 'THE ASK, IN PIXELS: a 1920×950 window with a 75-pixel bar fits the lane under it and sees further ahead, and the bar is the only thing that moved',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  return fieldOf(widthPx, heightPx - barAcross, widthPx >= heightPx, barAcross);',
      replace: '  return fieldOf(widthPx, heightPx, widthPx >= heightPx, barAcross);',
    },
  },
  {
    decision: '0500',
    suite: 'tests/camera.test.ts',
    // A portrait screen given the bar: chrome on a top that is the side of the lane.
    broke: 'a portrait screen keeping a bar',
    guard: 'and portrait, a bar that would leave no field, and a bar that is not a number all keep none',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  const barAcross = widthPx >= heightPx && Number.isFinite(bar)',
      replace: '  const barAcross = Number.isFinite(bar)',
    },
  },
  {
    decision: '0500',
    suite: 'tests/hud.browser.test.ts',
    // The desk asked for no bar: the HUD back over the lane.
    broke: 'the desk keeping no bar, so the HUD is over the lane again',
    guard: 'THE ASK, IN PIXELS: on a desktop the readout, the boss bar and the score stand in a black bar at the top, with the strip’s own air above and below them, and the field starts under it',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (touchable) return 0;\n',
      replace: '    if (touchable || !touchable) return 0;\n',
    },
  },
  {
    decision: '0500',
    suite: 'tests/hud.browser.test.ts',
    // The bar on every screen: the phone the player said looks right, changed.
    broke: 'a touch screen given the desk’s bar',
    guard: 'and a touch screen keeps none: the field is the whole glass, as it was',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (touchable) return 0;\n',
      replace: '    if (touchable && !touchable) return 0;\n',
    },
  },
];
