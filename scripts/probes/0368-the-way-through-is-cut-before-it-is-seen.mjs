// The way through is cut before it is seen — docs/decisions/0368-the-way-through-is-cut-before-it-is-seen.md
//
// Every guard 0368 adds, broken on purpose. `node scripts/prove-guard.mjs 0368`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0368',
    suite: 'tests/corridor.test.ts',
    /*
      ⚠️ THE CUT MADE WHEN THE WAVE IS PUT DOWN AGAIN, which is what shipped: with no lead, the second
      cursor reaches a wave on the step it spawns, at the screen's leading edge, and the stone already
      drawn there goes.
    */
    broke: 'the cut made when the wave is put down again, so stone on the screen vanishes',
    guard: 'THE REPORTED ONE, IN PIXELS, ON EVERY TIER: stone the player has seen does not vanish while it is on the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const FLANK_CUT_LEAD = 120;',
      replace: 'const FLANK_CUT_LEAD = 0;',
    },
  },
];
