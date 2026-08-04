// The breaks behind docs/decisions/0024-the-accessibility-floor-is-settings.md.
//
// The last one breaks the TEST rather than the code, on purpose: an exhaustive proof over a partial
// order is worth exactly what its comparator is worth, and a comparator that compares nothing passes
// while looking like the most thorough file in the repo.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0024',
    suite: 'tests/assist.test.ts',
    broke: 'an assist that makes the game harder — a "forgiving" hurtbox that is larger',
    guard: 'never makes the game harder, in any combination of knobs',
    edit: {
      path: 'src/sim/assist.ts',
      find: "const HURTBOX: Record<Assists['hurtbox'], number> = { exact: 1, forgiving: 0.7 };",
      replace: "const HURTBOX: Record<Assists['hurtbox'], number> = { exact: 1, forgiving: 1.2 };",
    },
  },
  {
    decision: '0024',
    suite: 'tests/assist.test.ts',
    broke: 'invulnerability that scenery ignores — the classic hole in an assist mode',
    guard: 'resilience at its end stops every source of damage, terrain included',
    edit: {
      path: 'src/sim/assist.ts',
      find: '    terrainDamage: TERRAIN[assists.terrain] * RESILIENCE[assists.resilience],',
      replace: '    terrainDamage: TERRAIN[assists.terrain],',
    },
  },
  {
    decision: '0024',
    suite: 'tests/assist.test.ts',
    broke: 'a knob wired to nothing — a placebo setting, which satisfies monotonicity perfectly',
    guard: 'every knob actually does something',
    edit: {
      path: 'src/sim/assist.ts',
      find: "    holdsAlong: assists.flight === 'assisted',",
      replace: '    holdsAlong: false,',
    },
  },
  {
    decision: '0024',
    suite: 'tests/assist.test.ts',
    broke: 'a comfort setting admitted as a difficulty knob',
    guard: 'no presentation setting has appeared among the knobs',
    edit: {
      path: 'src/sim/assist.ts',
      find: "export const ASSIST_KNOBS: readonly (keyof Assists)[] = [\n  'pace',",
      replace: "export const ASSIST_KNOBS: readonly (keyof Assists)[] = [\n  'motion',\n  'pace',",
    },
  },
  {
    decision: '0024',
    suite: 'tests/assist.test.ts',
    broke: 'auto-fire offered as a knob, which claims the base weapon can be switched off',
    guard: 'nothing unconditional has been demoted to a knob',
    edit: {
      path: 'src/sim/assist.ts',
      find: "export const ASSIST_KNOBS: readonly (keyof Assists)[] = [\n  'pace',",
      replace: "export const ASSIST_KNOBS: readonly (keyof Assists)[] = [\n  'autoFire',\n  'pace',",
    },
  },
  {
    decision: '0024',
    suite: 'tests/assist.test.ts',
    broke: 'the shipped default quietly assisted, so nobody ever plays the game as designed',
    guard: 'the default is the vibrant game',
    edit: {
      path: 'src/sim/assist.ts',
      find: "  pace: 'full',",
      replace: "  pace: 'gentle',",
    },
  },
  {
    decision: '0024',
    suite: 'tests/assist.test.ts',
    broke: 'a ladder written most-assisted-first, so "more assist" points the wrong way',
    guard: 'the default is the vibrant game',
    edit: {
      path: 'src/sim/assist.ts',
      find: "  pace: ['full', 'steady', 'gentle'],",
      replace: "  pace: ['gentle', 'steady', 'full'],",
    },
  },
  {
    // ⚠️ The meta-probe. Everything in the exhaustive proof hangs off this one function, and a
    // comparator broken in the RESTRICTIVE direction leaves the suite green having compared nothing.
    // The `compared` count is the only thing standing between that and a false sense of rigour.
    decision: '0024',
    suite: 'tests/assist.test.ts',
    broke: 'the ordering comparing nothing, which passes every monotonicity assertion vacuously',
    guard: 'never makes the game harder, in any combination of knobs',
    edit: {
      path: 'tests/assist.test.ts',
      find: '  return ASSIST_KNOBS.every((knob) => rank(knob, a) <= rank(knob, b));',
      replace: '  return false;',
    },
  },
];
