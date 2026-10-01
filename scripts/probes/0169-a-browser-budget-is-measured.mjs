// The break behind docs/decisions/0169-a-browser-budget-is-measured.md.
//
// ⚠️ THE CLAIM IS THAT THE TRANSITION REALLY TAKES FOUR SECONDS, and a budget is only defensible if
// that is true of the SUITE rather than of a one-off script somebody ran once. Shrinking the budget
// under the measurement is what says so: at 2 s all three waits go red, which they could not do if
// the press were raising the HUD promptly and the thirty seconds were padding over a broken path.
//
// ⚠️ AND IT IS THE HONEST ALTERNATIVE TO AN EXEMPTION. `WITHOUT_PROBES` in tests/prove-guard.test.ts
// would have taken this decision on 0044's terms — its subject is a measurement, and no edit stages
// "the number was guessed". But an edit DOES stage "the number is not slack", which is the half that
// matters and the half a reader would doubt.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0169',
    suite: 'tests/menu.browser.test.ts',
    // ⚠️ Re-aimed by 0425, whose cheaper synth took the transition from 3.6 s to 1.2 s: shrunk to 2 s
    // the budget stopped being short of it and this came back STILL GREEN. The claim is unchanged —
    // the budget is not slack over a broken path — so it shrinks under the transition as measured now.
    //
    // ⚠️ AND RE-AIMED AGAIN BY 0437, BECAUSE 500 ms WAS UNDER THE TRANSITION ONLY WHEN THE PRESS BEAT THE
    // PREWARM. 0169's own note: the press finishes the bake boot did not have time for, so its cost is
    // whatever is LEFT of the prewarm when the press lands — not a constant. Measured on this machine
    // on 2026-10-01, five pages each: pressed the moment the title showed, 917–1419 ms; pressed a second
    // later, 99–153 ms. With the bake 2.7x cheaper since 0425 the second case is reachable on a runner
    // that is slow to the title, and CI drew it once on #459 — STILL GREEN, after eleven straight reds.
    // 0044: the probe was reading a race. Thirty ms is under the fastest press ever measured, the case
    // with no bake left at all, so it is red whatever the prewarm has done — and what it shows is the
    // half of the claim a probe can show: the guard fails when its budget is short of the path.
    broke: 'the HUD budget shrunk under the fastest press measured, so even a warmed press cannot finish in time',
    guard: 'starts a run without also throwing the bomb that button is bound to',
    edit: {
      path: 'tests/menu.browser.test.ts',
      find: 'const HUD_MS = 30_000;',
      replace: 'const HUD_MS = 30;',
    },
  },
];
