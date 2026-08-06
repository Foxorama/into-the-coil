// The breaks behind docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md.
//
// ⚠️ Every guard here was green on its first run, over code written in the same sitting to satisfy
// it. That is the shape decision 0005 refuses to trust — indistinguishable from a guard whose
// extractor is broken or whose assertion reads the wrong field.
//
// ⚠️ Each `broke` below is a plausible EDIT, not a vandalism. "The arsenal survives a death" is the
// version of this rule everyone assumes on first reading, and it is the one `docs/game.md` itself
// implied until 0039 amended it — so it is exactly the change that would be made in good faith by
// someone tidying, and exactly the one nothing else in the repository would notice.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0039',
    suite: 'tests/run.test.ts',
    broke: 'a death that leaves the arsenal alone, which is what "carry forward" used to say',
    guard: 'a death clears the arsenal back to base',
    edit: {
      path: 'src/state/slices/run.ts',
      // Anchored on the ARSENAL line rather than on the whole returned literal, for the reason
      // 0042's probe gives: a literal goes stale the day a field is added to it, and two have been.
      find: '            arsenal: startingArsenal(),\n            upgrades: [],',
      replace: '            arsenal: state.arsenal,\n            upgrades: [],',
    },
  },
  {
    decision: '0039',
    suite: 'tests/run.test.ts',
    // The clamp reads as defensive and unnecessary — the shell is supposed to stop dispatching at
    // zero. Removing it is the tidy-up, and a negative life count is silent all the way into a save.
    broke: 'the zero clamp removed, so a death below the last life spends a life that is not there',
    guard: 'lives never go below zero',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      return state.lives <= 0\n        ? state\n        : {\n            lives: state.lives - 1,',
      replace: '      return {\n            lives: state.lives - 1,',
    },
  },
  {
    decision: '0039',
    suite: 'tests/run.test.ts',
    // The cross-slice agreement is the one line in the root that is not routing, so it is the one a
    // reader is most likely to decide does not belong there.
    broke: 'the run-over agreement dropped from the root, so the last life is spent and nothing says so',
    guard: 'the last life ends the run',
    edit: {
      path: 'src/state/root.ts',
      // Re-anchored when 0042 gave `agree` a second branch and turned this one inside out. The
      // harness refused the stale string rather than reporting green, which is the whole reason it
      // reads the file back.
      find: "  if (state.run.lives <= 0 && state.screen.current === 'playing') {",
      replace: '  if (false) {',
    },
  },
  {
    decision: '0039',
    suite: 'tests/state-shape.test.ts',
    // 0017's rule, re-proved because 0039 is the first PR that gives the root anything to decide.
    // The earlier proof was against a PLANTED file; this one is against the real reducer.
    broke: 'the root reducer given a case arm, which is how the predecessor’s 127-case switch started',
    guard: 'the root reducer routes and does not decide',
    edit: {
      path: 'src/state/root.ts',
      find: "  if (action.slice === 'screen') {",
      replace: "  switch (action.slice) {\n    case 'screen':\n      break;\n    default:\n      break;\n  }\n  if (action.slice === 'screen') {",
    },
  },
  {
    decision: '0039',
    suite: 'tests/chrome.test.ts',
    // The rule 0017 deferred until there was chrome to prove it against. `.hud` is not a strawman —
    // it is the exact class the predecessor collided on, twice, between two different HUDs.
    broke: 'a screen stylesheet given an unprefixed class, which is global the moment the build inlines it',
    guard: "every screen's chrome namespaces its classes",
    edit: {
      path: 'src/app/chrome.ts',
      // ⚠️ Anchored on the FOCUS RING rather than on the shown-state rule, and the first version was
      // anchored on the latter and went stale within a day: adding the `cleared` screen extended
      // that selector list and `npm run prove` refused the probe. A rule every new screen has to
      // join is a bad anchor; this one is a property of the button, which is not per-screen.
      //
      // ⚠️ It went ambiguous once more, in CI, when 0046 added a pad cursor as a SECOND rule
      // declaring the same outline — `find` appeared twice and the harness refused it, exactly as it
      // is supposed to. The repair is in the stylesheet rather than here: one ring, one declaration,
      // both selectors on it. A probe anchored on a declaration is a probe that notices the day
      // something else starts declaring it, which is worth more than an anchor that never complains.
      find: '  outline: 3px solid currentColor;',
      replace: '  outline: 3px solid currentColor;\n}\n.hud {\n  opacity: 1;',
    },
  },
];
