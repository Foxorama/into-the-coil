// The breaks behind docs/decisions/0058-a-level-boundary-keeps-the-shell.md.
//
// ⚠️ Three of the four are about a LEVEL keeping the shell and the fourth is about a RUN not
// inheriting one, and that asymmetry is the decision: the same three lines produce both answers.
//
// ⚠️ **THE FOURTH ONE IS WHY `keepShell` IS AN ARGUMENT.** It was first written against an ORDERING
// — `startRun` calls `resetScene` before `startLevel`, so a run began with nothing to carry — and
// this harness came back STILL GREEN, because the rule was stated by no line and no test could
// therefore see it removed. 0019, exactly: a guard that cannot fire reads as thorough. The fix was
// not a better test; it was making the caller say which of the two it is.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0058',
    suite: 'tests/shields.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly. `startLevel` reads as though it touches only the level —
      it says so in its own comment — so a carry sitting in it is the line somebody tidies away.
    */
    broke: 'the level boundary putting a bare hull back, so the shell is lost between levels',
    guard: 'carries every shield into the next level',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const shields = keepShell ? shieldsOf(w.shipRow, w.ship.health) : 0;\n  resetScene(w);\n  w.ship.health += shields;',
      replace: '  void keepShell;\n  resetScene(w);',
    },
  },
  {
    decision: '0058',
    suite: 'tests/shields.test.ts',
    // The count turned into a flag: *had a shell, gets a shell.* It is indistinguishable from the
    // real thing for a player carrying three, which is the only case anybody would check by hand.
    broke: 'the shell carried as a flag rather than as a count, so one shield arrives as three',
    guard: 'carries a partial shell too, so it is the count and not a flag',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.ship.health += shields;',
      replace: '  w.ship.health += shields > 0 ? 3 : 0;',
    },
  },
  {
    decision: '0058',
    suite: 'tests/shields.test.ts',
    /*
      ⚠️ THE OTHER DIRECTION, and the one that argued the argument. A carry that does not ask which
      boundary it is at hands the next RUN whatever the last one died wearing — and it is the tidier
      code, which is what makes it the version somebody writes.
    */
    broke: 'the carry made unconditional, so a new run opens wearing the last run’s shell',
    guard: 'cannot carry one into a NEW run',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const shields = keepShell ? shieldsOf(w.shipRow, w.ship.health) : 0;',
      replace: '  void keepShell;\n  const shields = shieldsOf(w.shipRow, w.ship.health);',
    },
  },
  {
    decision: '0058',
    suite: 'tests/shields.test.ts',
    // The carry made unbounded. The cap holds by construction — the count is read off a ship that is
    // about to become a bare hull — and this is what proves the guard can see it stop holding.
    broke: 'the carry allowed past what the ship can wear, so the shell outgrows its own pool',
    guard: 'never carries more than the ship can wear',
    edit: { path: 'src/app/frame.ts', find: '  w.ship.health += shields;', replace: '  w.ship.health += shields * 2;' },
  },
];
