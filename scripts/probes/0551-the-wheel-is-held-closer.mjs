// The breaks behind docs/decisions/0551-the-wheel-is-held-closer.md.
//
// One per guard tests/wheel.test.ts adds, and a second for the burn-down: it shrinks, and it keeps throwing.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0551',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that burns down whole, the yellow disc the play reported',
    guard: 'THE ASK: the disc burns down first',
    edit: { path: 'src/app/frame.ts', find: '      b.swell = (b.lifeFor - 1) / wheel.fade;', replace: '      b.swell = 1;' },
  },
  {
    decision: '0551',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that stops throwing sparks when it begins to burn down, as 0549 had it',
    guard: 'THE ASK: the disc burns down first',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.steps % wheel.emberEvery === 0) throwEmbers(w, b, wheel);',
      replace: '    if (!burning && w.steps % wheel.emberEvery === 0) throwEmbers(w, b, wheel);',
    },
  },
  {
    decision: '0551',
    suite: 'tests/wheel.test.ts',
    broke: 'the spark spray 0549 threw',
    guard: 'the spark spray is a fifth smaller across',
    edit: { path: 'src/content/weapons.ts', find: '      emberLife: 14,', replace: '      emberLife: 17,' },
  },
  {
    decision: '0551',
    suite: 'tests/wheel.test.ts',
    broke: 'the tether’s start drawn off the wheel’s interpolated end, on the hood',
    guard: 'the tether starts on the muzzle the player sees',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const fromAlong = e.prevFromAlong + (e.fromAlong - e.prevFromAlong) * alpha;\n      const fromAcross = e.prevFromAcross + (e.fromAcross - e.prevFromAcross) * alpha;',
      replace: '      const fromAlong = e.fromAlong;\n      const fromAcross = e.fromAcross;',
    },
  },
];
