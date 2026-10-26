// The breaks behind docs/decisions/0689-nobody-is-armed-after-a-run.md: the pilot flown last armed on the title again.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0689',
    suite: 'tests/run-ends.browser.test.ts',
    broke: 'the pilot flown last still armed back on the title, Ready beside their name',
    guard: 'a continue left to run out goes on the table',
    edit: {
      path: 'src/app/mount.ts',
      find: '    armPilot(false);\n    syncHud();',
      replace: '    syncHud();',
    },
  },
];
