// A serpent runs off the screen — docs/decisions/0286-a-serpent-runs-off-the-screen.md
//
// Every guard 0286 adds, broken on purpose. `node scripts/prove-guard.mjs 0286`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0286',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION: AN ANIMAL THAT FITS.** Eleven segments is 46
      units, and the head stands at 119 on a screen 178 wide at its narrowest — so the tail stopped
      twelve units short of the leading edge and the player could watch the whole serpent finish,
      tapered tail and all. That is the report: *"the body is short and squat."*
    */
    broke: 'the body back to eleven segments, so the player can see the whole animal end',
    guard: 'THE REPORTED ONE: the serpent is longer than the widest screen',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      girth: [6, 8.5, 10.5, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.5, 9.5, 8, 6, 3, 1],',
      replace: '      girth: [6, 8.5, 10.5, 11, 11, 10.5, 9.5, 8, 6, 3, 1],',
    },
  },
  {
    decision: '0286',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ **AND THE CHEAP WAY TO THE SAME LENGTH, WHICH IS THE HALF OF THE REPORT THAT NAMES ITSELF.**
      *"I mean add more segements, not stretch out the segments that are there."* Spacing the eleven
      discs further apart reaches off the screen with no new pool and no ceiling to reopen — and
      leaves a string of beads with gaps between them, which is
      docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md exactly.
    */
    broke: 'the same eleven discs spaced out to the same length, which is what the report ruled out',
    guard: 'THE REPORTED ONE: the serpent is longer than the widest screen',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      step: 0.53,',
      replace: '      step: 1.53,',
    },
  },
  {
    decision: '0286',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE DEFECT THE LENGTH EXPOSED, RESTORED.** A node has no velocity and is written to
      `head.along + offset` every step, but it sat in a pool culled at the leading edge like anything
      that flies — and a serpent ARRIVES from that edge, so its tail spent the approach past the spawn
      margin. `layChain` re-lays only when the pool is empty, so the released node never came back and
      the animal fought the whole fight one segment short.

      ⚠️ **AND IT REDDENS NOTHING AT ELEVEN NODES**, which is why no guard had ever asked: the body
      was 46 units long and the margin is deeper than that.
    */
    broke: 'the body culled at the leading edge like traffic, so its tail is lost during the arrival',
    guard: 'and it keeps every segment it was authored with, through the ARRIVAL',
    edit: {
      path: 'src/app/frame.ts',
      find: '    stepEntities(w.bossBody, w.cameraAlong, Number.POSITIVE_INFINITY);',
      replace: '    stepEntities(w.bossBody, w.cameraAlong);',
    },
  },
  {
    decision: '0286',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ **THE CEILING SPENT WITHOUT BEING RAISED**, which is the arithmetic-in-somebody's-head that
      `tests/budget.test.ts`'s own comment says this guard exists to catch. Fifteen more nodes and the
      worst case left where it was is a pool the frame may be asked to draw and nobody has argued for.
    */
    broke: 'the worst case back to 0022’s 500 with the longer body still in the pools',
    guard: 'never asks the frame to draw more entities than the budget was measured for',
    edit: {
      path: 'tests/budget.test.ts',
      find: 'const WORST_CASE = 515;',
      replace: 'const WORST_CASE = 500;',
    },
  },
];
