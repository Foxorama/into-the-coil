// The breaks behind docs/decisions/0192-a-guard-holds-an-invariant.md.
//
// ⚠️ WHAT IS PROVEN HERE IS THE MECHANISM AND NEVER A CLAIM. The four advisory claims in
// `tests/authored.ts` are opinions and cannot go red by design — probing them would be probing a
// thing that has no red, which is docs/decisions/0019-a-probe-must-be-seen-to-apply.md's STILL GREEN
// wearing a different hat. What CAN go red, and what these four break, is the plumbing: that an
// unmet claim does not throw, that every registered claim is measured, that every entry names the
// correct change that would break it, and that the printout says what it found.
//
// ⚠️ AND THE FIRST OF THEM IS THE ONE THIS DECISION IS ABOUT. `observe` throwing is exactly the
// state the project was in before 0192 — a taste with a path to a red suite — and
// docs/decisions/0191-a-place-sits-somewhere.md is what that cost.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0192',
    suite: 'tests/authored.test.ts',
    /*
      ⚠️ A TASTE WITH A PATH TO A RED SUITE, PUT BACK. This is the whole mechanism inverted in one
      line: the moment `observe` can throw, an authored claim can fail a build, and the cheapest way
      to a green board is to change the music rather than the opinion. That is the sequence
      docs/decisions/0189-a-place-is-what-it-does-not-play.md ran and
      docs/decisions/0191-a-place-sits-somewhere.md had to undo.
    */
    broke: 'an unmet claim throwing, so a taste can fail a build again',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: an unmet claim does not throw and does not fail',
    edit: {
      path: 'tests/authored.ts',
      find: '  seen.push({ id, met, found: [...found] });',
      replace: "  if (!met) throw new Error(`${id} is not met`);\n  seen.push({ id, met, found: [...found] });",
    },
  },
  {
    decision: '0192',
    suite: 'tests/authored.test.ts',
    /*
      ⚠️ A REGISTERED CLAIM NOBODY MEASURES, WHICH IS THE FAILURE AN ADVISORY REGISTER INVITES. The
      printout would still list `0167-duck` — with no `!` beside it, because nothing observed it —
      and it would read exactly like a claim that is being met.
    */
    broke: 'a registered claim dropped out of the measuring pass, so the printout reports it as fine',
    guard: 'every registered claim is measured exactly once, so the register cannot hold a dead entry',
    edit: {
      path: 'tests/authored.test.ts',
      find: '  measureDuck();\n  measureFour();',
      replace: '  measureFour();',
    },
  },
  {
    decision: '0192',
    suite: 'tests/authored.test.ts',
    /*
      ⚠️ THE ADMISSION TEST REMOVED, WHICH IS HOW THIS FILE WOULD BECOME A BIN. `correctly` is the
      one field that separates a demoted taste from an invariant somebody did not want to fix; an
      entry that cannot name the correct change that would redden it has not passed 0192's rule and
      belongs back in a suite that fails.
    */
    broke: 'a claim admitted without naming the correct change that would break it',
    guard: 'and every claim names the change that would break it and be correct, which is the admission test',
    edit: {
      path: 'tests/authored.ts',
      find: "    correctly: 'a place written as a reprise of another, tracking the same part throughout',",
      replace: "    correctly: '',",
    },
  },
  {
    decision: '0192',
    suite: 'tests/authored.test.ts',
    /*
      ⚠️ THE COUNT WITHOUT THE OFFENDERS, WHICH IS A NUMBER NOBODY CAN ACT ON. An advisory that says
      *one unmet* and not *which pairs* is the shape docs/decisions/0126-the-dashboard-is-the-instrument.md
      names about every report written from memory — a session then spends its first hour working out
      what the number was about.
    */
    broke: 'the report printing that a claim is unmet without printing what it found',
    guard: 'and the report names every unmet claim and what it found, or it is a number nobody can act on',
    edit: {
      path: 'tests/authored.ts',
      find: '      for (const f of o.found.slice(0, 8)) lines.push(`      ${f}`);',
      replace: '      // the offenders, dropped',
    },
  },
];
