// The breaks behind docs/decisions/0187-the-kick-is-the-pulse.md.
//
// ⚠️ THE ROLE CHANGE ITSELF HAS NO BREAK, AND THAT IS A GAP RATHER THAN A CHOICE. Putting `sub` and
// `engine` back in the bed leaves the suite GREEN — measured, not assumed — because 0164 refuses a
// layer that is too QUIET for its role and has nothing to say about a role that is too EASY. A
// decision that moves a layer to a gentler role can therefore be reverted without any guard noticing.
// 0187 records it; the honest version is a second direction on 0164, and that is its own decision.
//
// ⚠️ SO BOTH BREAKS BELOW ARE ABOUT WHAT THE ROLE CHANGE COST, which is the half that is guarded: the
// fourteen lifts that make the claim true, and the three per-place workarounds it made redundant.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0187',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE LIFTS TAKEN AWAY FROM THE PLACE THAT NEEDED THEM MOST. The Labyrinth's `sub` was 10 dB
      under the role it has now; putting its rungs back to what the shared ladder says restores that,
      and it is the single edit that turns this decision into a claim the mix does not deliver.
    */
    broke: 'the lifts removed from the place that needed them most, so the arrangement claims what the mix does not deliver',
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/themes.ts',
      find:
        '      surge: { perc: 0.9, sub: 2.025, engine: 1.398 },\n' +
        '      approach: { sub: 2.29, engine: 1.285 },',
      replace: '      surge: { perc: 0.9 },',
    },
  },
  {
    decision: '0187',
    suite: 'tests/arrangement.test.ts',
    /*
      ⚠️ THE WORKAROUND RESTORED. The Toxic Mire's promotion read `{ sub: 'pulse', engine: 'pulse' }`
      and its comment read *"the whole bottom steps up out of the bed"* — one of three places that had
      independently lifted the kick or the kit out of the bed by hand. With the arrangement saying it
      globally, writing it again is a promotion that promotes nothing, which is the guard that caught
      all three when this decision was made.
    */
    broke: "the per-place workaround written back on top of the arrangement that now says it globally",
    guard: 'THE PLACES DIFFER, and none of them appoints a second part',
    edit: {
      path: 'src/content/arrangement.ts',
      // ⚠️ RE-ANCHORED BY 0188, which gave OWN_ROLES a `mire: {}` of its own. The neighbour makes
      // it unique — PROMOTES is the table whose emptiness is this decision's finding.
      find: '  mire: {},\n  // *"The riff"*',
      // ⚠️ THE COMMENT GOES BACK, AND LEAVING IT OUT COST A WHOLE `prove` RUN. The find spans the
      // line after `mire`, so a replacement that stops at the brace leaves the rest of that comment
      // dangling as code — the module does not parse, no test is collected, and the harness reports
      // "the test was renamed" about a test that is exactly where it was.
      replace: "  mire: { sub: 'pulse', engine: 'pulse' },\n  // *\"The riff\"*",
    },
  },
];
