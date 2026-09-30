// The breaks behind docs/decisions/0421-the-hull-is-asked-near.md.
//
// ⚠️ EVERY ONE OF THESE IS AN INDEX THAT IS FAST AND SLIGHTLY WRONG — which is the only way it can
// fail, and the one no containment guard downstream of it could see: they would all go on passing,
// measuring a hull that is not the one drawn. The guard is the full walk, asked the same questions.
//
// What they cannot prove is the speed, for 0115's reason: a probe cannot redden a test for being slow.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0421',
    suite: 'tests/paths.test.ts',
    // An edge filed only in the band its lower end is in: a ray higher up its span misses it.
    broke: 'an edge filed in one band of the several its height spans, so a ray through the rest misses it',
    guard: 'THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly',
    edit: {
      path: 'tests/paths.ts',
      find: '      bands[r]!.push(s);',
      replace: '      if (r === r0) bands[r]!.push(s);',
    },
  },
  {
    decision: '0421',
    suite: 'tests/paths.test.ts',
    // The last column of an edge's box left out: its nearest point to something can be in exactly it.
    broke: 'an edge filed in all but the last column its box touches, so the ring search walks past it',
    guard: 'THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly',
    edit: {
      path: 'tests/paths.ts',
      find: '      for (let c = c0; c <= c1; c++) cells[r * cols + c]!.push(s);',
      replace: '      for (let c = c0; c < c1; c++) cells[r * cols + c]!.push(s);',
    },
  },
  {
    decision: '0421',
    suite: 'tests/paths.test.ts',
    // The stop that trusts the first ring to have found the nearest: right on a smooth hull, wrong
    // at a point whose nearest edge is two cells off while a further one sits in its own.
    broke: 'the ring search stopping two cells early, before an unseen edge could be ruled out',
    guard: 'THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly',
    edit: {
      path: 'tests/paths.ts',
      find: '        if (covered || best <= (k - 1) * cell) return best;',
      replace: '        if (covered || best <= (k + 2) * cell) return best;',
    },
  },
  {
    decision: '0421',
    suite: 'tests/paths.test.ts',
    // Every question after the first finds every edge already marked seen, and answers Infinity.
    broke: 'the seen-marks never cleared between questions, so every question after the first skips every edge',
    guard: 'THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly',
    edit: {
      path: 'tests/paths.ts',
      find: '    distance([px, py]) {\n      stamp++;\n',
      replace: '    distance([px, py]) {\n',
    },
  },
  {
    decision: '0421',
    suite: 'tests/paths.test.ts',
    broke: 'the fill rule read as nonzero always, so a hole cut by evenodd is solid again',
    guard: 'and a hole is a hole',
    edit: {
      path: 'tests/paths.ts',
      find: "  const evenodd = pass.rule === 'evenodd';",
      replace: '  const evenodd = false;',
    },
  },
];
