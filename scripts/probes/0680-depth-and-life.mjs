// The break behind docs/decisions/0680-depth-and-life.md.
//
// ⚠️ What moves on the stand by itself, where its guards read it, off the bob's clock: the cradle's rings rising on a
// period that is not a whole number of bobs, as anything added to the stand could be.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0680',
    suite: 'tests/stand.test.ts',
    broke: 'the cradle’s rings rising off the bob’s clock',
    guard: 'draws the same picture a bob apart where the stand’s guards read it',
    edit: { path: 'src/render/port.ts', find: 'const HOVER_RISE = BOB_STEPS * HOVER_RINGS;', replace: 'const HOVER_RISE = BOB_STEPS * HOVER_RINGS + 9;' },
  },
];
