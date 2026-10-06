// The breaks behind docs/decisions/0549-the-wheel-is-playable.md.
//
// One per guard tests/wheel.test.ts adds or changed, and one for the rope's stack in tests/bolt.test.ts.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0549',
    suite: 'tests/wheel.test.ts',
    broke: 'the wheel thrown every four seconds, as 0545 had it',
    guard: 'THE ASK, IN SECONDS: 0549’s clock',
    edit: { path: 'src/content/weapons.ts', find: '    fireEvery: 144,', replace: '    fireEvery: 240,' },
  },
  {
    decision: '0549',
    suite: 'tests/wheel.test.ts',
    broke: 'the last wheel put out when the next is thrown',
    guard: 'throws one wheel on the first beat of a life, and then one every six beats',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (wheel === null) return;\n  const disc = w.playerShots.spawn();',
      replace: '  if (wheel === null) return;\n  for (let i = w.playerShots.size - 1; i >= 0; i--) if (w.playerShots.at(i).kind === WHEEL_KIND) w.playerShots.releaseAt(i);\n  const disc = w.playerShots.spawn();',
    },
  },
  {
    decision: '0549',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel thrown past the no-fly wall to the screen’s edge',
    guard: 'it reaches 60% of the screen, or the no-fly wall',
    edit: { path: 'src/app/frame.ts', find: '  const far = wall < edge ? wall : edge;', replace: '  const far = edge;' },
  },
  {
    decision: '0549',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel thrown half the screen',
    guard: 'it reaches 60% of the screen, or the no-fly wall',
    edit: { path: 'src/app/frame.ts', find: '  disc.fromAlong = disc.along + wheel.reach * w.view.alongSpan;', replace: '  disc.fromAlong = disc.along + 0.5 * w.view.alongSpan;' },
  },
  {
    decision: '0549',
    suite: 'tests/wheel.test.ts',
    broke: 'a tether that goes out without fading',
    guard: 'lets its tether go at 2.27 s',
    edit: { path: 'src/app/frame.ts', find: '    link.holdFor = disc.lifeFor - wheel.fade;', replace: '    link.holdFor = 99;' },
  },
  {
    decision: '0549',
    suite: 'tests/wheel.test.ts',
    broke: 'embers that never cool',
    guard: 'throws short embers off its rim',
    edit: { path: 'src/app/frame.ts', find: '      if (b.lifeFor * 2 <= wheel.emberLife) {', replace: '      if (b.lifeFor < 0) {' },
  },
  {
    decision: '0549',
    suite: 'tests/wheel.test.ts',
    broke: 'a tether with no crackle',
    guard: 'is painted as a rope of fire',
    edit: { path: 'src/render/scene.ts', find: '      for (let pass = -1; pass < 2; pass++) {', replace: '      for (let pass = -1; pass < 0; pass++) {' },
  },
  {
    decision: '0549',
    suite: 'tests/bolt.test.ts',
    broke: 'the rope’s rim added, so it darkens nothing',
    guard: 'THE LIGHT IS ADDITIVE, AND THE CONTEXT IS PUT BACK',
    edit: { path: 'src/render/canvas.ts', find: "  { width: 4.6, alpha: 0.45, ink: 'dark', additive: false },", replace: "  { width: 4.6, alpha: 0.45, ink: 'dark', additive: true }," },
  },
];
