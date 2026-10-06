// The breaks behind docs/decisions/0558-a-run-ends-at-the-title.md.
//
// ⚠️ Two halves of one rule, each broken alone: the root's agreement that a run arriving at the title
// is over, and the run slice's own answer to being told so. The first is held in the reducer, the
// second in the page, where what it cost the player was the last run's wheels on the next pilot's ship.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0558',
    suite: 'tests/run-ends.test.ts',
    broke: 'a run quit or won left on the title with its lives up',
    guard: 'a run quit from the pause has no lives left at the title',
    edit: {
      path: 'src/state/root.ts',
      find: "    const run = screen.current === 'title' && state.screen.current !== 'title' ? reduceRun(state.run, END_RUN) : state.run;",
      replace: '    const run = state.run;',
    },
  },
  {
    decision: '0558',
    suite: 'tests/run-ends.browser.test.ts',
    broke: 'the run told it has ended and keeping its lives',
    guard: 'a pilot chosen after a quit stands on the pad in their own ship',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      return initialRun;',
      replace: '      return state;',
    },
  },
  {
    decision: '0558',
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
    decision: '0558',
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
