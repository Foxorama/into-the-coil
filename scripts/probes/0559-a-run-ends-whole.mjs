// The breaks behind docs/decisions/0559-a-run-ends-whole.md.
//
// ⚠️ The world's half of a run's end is held by comparing the whole world with one no run touched, so
// it is broken where it is most likely to break: a pool spared the sweep. And the score a continue left
// to run out puts on the table, which 0559 moved and which had no guard before it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0559',
    suite: 'tests/run-ends.test.ts',
    broke: 'a run ending with what its weapons left still on the field',
    guard: 'leaves the world as no run had touched it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (layer !== w.shipPool) layer.clear();',
      replace: '    if (layer === w.shipPool) layer.clear();',
    },
  },
  {
    decision: '0559',
    suite: 'tests/run-ends.browser.test.ts',
    broke: 'a continue left to run out never put on the table',
    guard: 'a continue left to run out goes on the table',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (action.slice === 'screen' && action.type === 'show' && action.screen === 'title' && state.screen.current === 'gameOver') walkedAway();",
      replace: "    if (action.slice === 'screen' && action.type === 'show' && action.screen === 'title' && state.screen.current === 'gameOver') void walkedAway;",
    },
  },
];
