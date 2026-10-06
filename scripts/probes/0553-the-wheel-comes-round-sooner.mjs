// The breaks behind docs/decisions/0553-the-wheel-comes-round-sooner.md.
//
// The throw and the life each put back where 0551 had them, alone: either one moves a gap the player kept.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0553',
    suite: 'tests/wheel.test.ts',
    broke: 'the wheel thrown every 2.4 s, as 0551 had it',
    guard: 'THE ASK, IN SECONDS: 0551’s clock',
    edit: { path: 'src/content/weapons.ts', find: '    fireEvery: 120,', replace: '    fireEvery: 144,' },
  },
  {
    decision: '0553',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that lives 2.67 s, as 0551 had it',
    guard: 'THE ASK, IN SECONDS: 0551’s clock',
    edit: { path: 'src/content/weapons.ts', find: '      life: 136,', replace: '      life: 160,' },
  },
];
