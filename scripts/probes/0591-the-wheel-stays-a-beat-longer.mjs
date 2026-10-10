// The breaks behind docs/decisions/0591-the-wheel-stays-a-beat-longer.md.
//
// The throw and the life each put back where 0553 had them, alone: the ask was both a beat later.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0591',
    suite: 'tests/wheel.test.ts',
    broke: 'the wheel thrown every 2 s, as 0553 had it',
    guard: 'THE ASK, IN SECONDS: 0553’s clock',
    edit: { path: 'src/content/weapons.ts', find: '    fireEvery: 144,', replace: '    fireEvery: 120,' },
  },
  {
    decision: '0591',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that lives 2.27 s, as 0553 had it',
    guard: 'THE ASK, IN SECONDS: 0553’s clock',
    edit: { path: 'src/content/weapons.ts', find: '      life: 160,', replace: '      life: 136,' },
  },
  {
    decision: '0591',
    suite: 'tests/wheel.test.ts',
    broke: 'the half second asked for taken literally, off the beat grid',
    guard: 'THE ASK, IN SECONDS: 0553’s clock',
    edit: { path: 'src/content/weapons.ts', find: '    fireEvery: 144,', replace: '    fireEvery: 150,' },
  },
];
