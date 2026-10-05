// The breaks behind docs/decisions/0438-the-score-is-the-credits.md.
//
// A continue that keeps the last credit's score (0428's reading, reversed), a credit recorded as
// reaching the level its own tallies count to, a run over that never says where it lands, a new credit
// that inherits the streak the death ended, and the shell forgetting to put the credit on the table.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0438',
    suite: 'tests/score.test.ts',
    broke: 'a continue that keeps the last credit’s banked levels',
    guard: 'THE ASK: the score resets on a continue',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        tallies: [],\n        continues: state.continues + 1,',
      replace: '        tallies: state.tallies,\n        continues: state.continues + 1,',
    },
  },
  {
    decision: '0438',
    suite: 'tests/score.test.ts',
    broke: 'the table told how far a credit got by its own tallies, so a credit bought on level three reached level one',
    guard: 'THE ASK: the table tracks the score and the level reached',
    edit: {
      path: 'src/app/score.ts',
      find: '    levels: run.level,',
      replace: '    levels: run.tallies.length,',
    },
  },
  {
    decision: '0438',
    suite: 'tests/score.test.ts',
    broke: 'the run over saying where the credit lands as nowhere, whatever the table says',
    guard: 'the run over says the score, how far the credit got, and where it lands',
    edit: {
      path: 'src/app/score.ts',
      find: "    { label: 'High score', value: placeLabel(place), tone: 'plain' },\n    /*",
      replace: "    { label: 'High score', value: placeLabel(null), tone: 'plain' },\n    /*",
    },
  },
  {
    decision: '0438',
    suite: 'tests/score.test.ts',
    broke: 'a new credit inheriting the streak the death that ran out the last one ended',
    guard: 'the frame’s count starts again with the credit, streak and all',
    edit: {
      path: 'src/app/frame.ts',
      find: 'export function resetCreditScore(score: LevelScore): void {\n  score.streak = 0;',
      replace: 'export function resetCreditScore(score: LevelScore): void {',
    },
  },
  {
    decision: '0438',
    suite: 'tests/continue.browser.test.ts',
    broke: 'the shell starting the score again without putting the credit that ran out on the table',
    guard: 'says Continue, and puts the player back into the game',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (action.slice === 'run' && action.type === 'continued') {\n      recordRun(false);",
      replace: "    if (action.slice === 'run' && action.type === 'continued') {",
    },
  },
];
