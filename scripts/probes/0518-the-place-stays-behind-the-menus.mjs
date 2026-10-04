// The place stays behind the menus — docs/decisions/0518-the-place-stays-behind-the-menus.md
//
// Every guard 0518 adds, broken on purpose. `node scripts/prove-guard.mjs 0518`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0518',
    suite: 'tests/place-held.test.ts',
    // The report, put back: only the screens a list named keep the field; the rest fall to the void.
    broke: 'the picture’s place read off a list of screens rather than off inRun',
    guard: 'keeps the run’s place behind the run over, the pause, its question and its count-in',
    edit: {
      path: 'src/app/music.ts',
      find: '  if (SCREENS[screen].inRun) return field;',
      replace: "  if (screen === 'playing' || screen === 'cleared' || screen === 'outro') return field;",
    },
  },
];
