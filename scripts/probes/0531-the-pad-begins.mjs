// The breaks behind docs/decisions/0531-the-pad-begins.md.
//
// ⚠️ One break, the reported one: the splash refusing a pad's press, so a player holding nothing but a
// pad never gets past it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0531',
    suite: 'tests/intro.browser.test.ts',
    broke: "the splash refusing a pad's press, as 0513 had it, so a pad alone never leaves it",
    guard: 'a pad and nothing else flies from the boot into a run',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (!menuAsk.confirm) return;\n      splashPressed = true;',
      replace: '      if (!menuAsk.confirm) return;',
    },
  },
];
