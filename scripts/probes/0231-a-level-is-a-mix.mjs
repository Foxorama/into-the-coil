// The breaks behind docs/decisions/0231-a-level-is-a-mix.md.
//
// ⚠️ A BUDGET THE REPORT OWNS. Whether three is the right run is the play-test's to say; what these
// break is that the guard reads every level, sorted by arrival, and that the number cannot quietly
// drift back to what the batteries level used to run.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0231',
    suite: 'tests/mix.test.ts',
    /*
      ⚠️ THE LAST LEVEL'S OPENING GIVEN TWO MORE CHARGERS, which is the edit a hand makes tuning a
      stretch for speed — and it is four non-firing waves in a row before the first shot, which is
      the report in miniature.
    */
    broke: 'a level given a fourth non-firing wave in a row',
    guard: 'THE REPORTED ONE: no level sends more than MIX_RUN waves of one class in a row',
    edit: {
      path: 'src/content/levels.ts',
      find:
        "  { at: 407, enemy: 'spinner', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },\n" +
        "  { at: 461, enemy: 'sower', formation: 'line', count: 5, lane: 53 },",
      replace:
        "  { at: 407, enemy: 'charger', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },\n" +
        "  { at: 461, enemy: 'charger', formation: 'line', count: 5, lane: 53 },",
    },
  },
  {
    decision: '0231',
    suite: 'tests/mix.test.ts',
    /*
      ⚠️ THE BUDGET RAISED TO THIRTY, which is what the batteries level ran before and the number a
      hand reaches for when a level it is authoring will not fit under three. The guard then holds
      nothing the report asked for — and the content, which fits under three, stays green, so this
      break has to reach the guard's own subject.
    */
    broke: 'the budget raised to what the batteries level used to run, so the guard holds nothing',
    guard: 'and the budget is the report’s number, not a number the content happens to fit',
    edit: {
      path: 'src/content/levels.ts',
      find: 'export const MIX_RUN = 3;',
      replace: 'export const MIX_RUN = 30;',
    },
  },
];
