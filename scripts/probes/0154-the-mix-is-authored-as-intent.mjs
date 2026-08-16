// The breaks behind docs/decisions/0154-the-mix-is-authored-as-intent.md.
//
// ⚠️ THE FIRST ONE IS THE FAILURE THE SOLVER CANNOT REPORT. A damped fixed point over an
// over-determined system does not throw — it converges to a compromise and reports a small error. Two
// layers both marked `part` produced four hundred iterations and a set of margins that read as a
// rounding problem for an hour. The contradiction has to be refused in the TABLE, and this is the
// probe that shows the table refuses it.
//
// ⚠️ THE SECOND IS THE ONE THAT ALREADY FIRED FOR REAL. On its first run the completeness guard found
// FOUR promotions that promoted nothing — saurian's `arp`, rime's `lead`, mire's `toll`, core's
// `lead` and `drive` — every one of them a layer that was already at the role the place was
// "lifting" it to. That is a line of documentation wearing a mix decision's clothes, and it is the
// specific way this table can rot: a place that reads as having character and has none.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0154',
    suite: 'tests/arrangement.test.ts',
    broke: 'a second layer named as the thing you follow, which is arithmetic with no answer',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: exactly one layer is followed at a rung',
    edit: {
      path: 'src/content/arrangement.ts',
      find: "    part: ['hook'],\n    counter: ['arp', 'lead', 'call'],",
      replace: "    part: ['hook', 'arp'],\n    counter: ['lead', 'call'],",
    },
  },
  {
    decision: '0154',
    suite: 'tests/arrangement.test.ts',
    broke: 'a promotion that promotes nothing, so a place reads as having character and has none',
    guard: 'THE PLACES DIFFER, and none of them appoints a second part',
    edit: {
      path: 'src/content/arrangement.ts',
      // `lead` is already a counter-line at every rung that opens it, which is what made this the
      // real defect in four places rather than a hypothetical one.
      find: "  rime: { chords: 'counter', crash: 'counter' },",
      replace: "  rime: { lead: 'counter', crash: 'counter' },",
    },
  },
  {
    decision: '0154',
    suite: 'tests/arrangement.test.ts',
    broke: 'a layer the ladder opens left out of the arrangement, so nothing says what it is for',
    guard: 'names every layer the rung actually sounds, exactly once',
    edit: {
      path: 'src/content/arrangement.ts',
      find: "    pulse: ['perc', 'ride'],\n    bed: ['sub', 'engine', 'chords', 'groove'],\n    air: ['drone'],\n  },\n  // The counter-melody takes over",
      replace: "    pulse: ['perc'],\n    bed: ['sub', 'engine', 'chords', 'groove'],\n    air: ['drone'],\n  },\n  // The counter-melody takes over",
    },
  },
  {
    decision: '0154',
    suite: 'tests/arrangement.test.ts',
    broke: 'the role ladder given a flat step, so a counter-line is not actually under the part',
    guard: 'and the targets are ordered, because a role that is not above the one below it is not a role',
    edit: {
      path: 'src/content/arrangement.ts',
      find: '  part: 3,\n  counter: -2,',
      replace: '  part: 3,\n  counter: 3,',
    },
  },
];
