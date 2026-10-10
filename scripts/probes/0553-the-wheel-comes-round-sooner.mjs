// The breaks behind docs/decisions/0553-the-wheel-comes-round-sooner.md.
//
// The throw and the life each moved a beat alone: either one moves a gap the player kept. Re-anchored on
// 0591's clock, which put both back a beat together.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0553',
    suite: 'tests/wheel.test.ts',
    broke: 'the wheel thrown a beat later without its life moving with it',
    guard: 'THE ASK, IN SECONDS: 0553’s clock',
    edit: { path: 'src/content/weapons.ts', find: '    fireEvery: 144,', replace: '    fireEvery: 168,' },
  },
  {
    decision: '0553',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that lives a beat longer without its throw moving with it',
    guard: 'THE ASK, IN SECONDS: 0553’s clock',
    edit: { path: 'src/content/weapons.ts', find: '      life: 160,', replace: '      life: 184,' },
  },
];
