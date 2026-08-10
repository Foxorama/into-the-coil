// The breaks behind docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md.
//
// ⚠️ THE FIRST IS THE SHIPPED BUILD, RESTORED, and it is the one that matters: every sky guard in
// `tests/budget.test.ts` was green on it — the thickness ladder, the ink ceiling, the ink FLOOR, the
// aspect ratio and both depth bounds — while the layer carrying the whole sense of speed was a
// 1.57-pixel hairline nobody could see.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0106',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ **THE REPORTED ONE.** *"There are thin lines that are hardly visible… I don't feel like I'm
      zooming through space."* The mark went back to the half-thickness it shipped at, which is 1.57
      CSS pixels on the screen the report came from.

      ⚠️ **It reddens ONLY the pixel guard**, and that is the finding rather than a detail: the ink
      share drops from 54.4% to 36.8%, which is further inside its ceiling and still above its floor,
      so the measure that had governed this layer for three passes reads the restored bug as an
      IMPROVEMENT.
    */
    broke: 'the streaks back to the hairline they shipped at, which is 1.57 pixels on a desktop',
    guard: '0106 — THE REPORTED ONE: every sky mark is at least a pixel thick on the screen it is judged on',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.24 };',
      replace: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.11 };',
    },
  },
  {
    decision: '0106',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ AND THE OTHER WAY, because a floor with no ceiling over it is how a layer becomes a curtain.
      The ink bound moved to 0.7 to pay for a mark that can be seen; doubling the streak count from
      ten reaches 108.8% of the bed and is what that number was derived to catch.
    */
    broke: 'the streak count doubled, so the fast layer is a curtain the player flies behind',
    guard: 'and the near layer is the quiet one, on every count that buys attention',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_STARS = { skyFar: 90, skyNear: 90, skyRush: 10 };',
      replace: 'const SKY_STARS = { skyFar: 90, skyNear: 90, skyRush: 20 };',
    },
  },
  {
    decision: '0106',
    suite: 'tests/budget.test.ts',
    // ⚠️ The thickness bought at the expense of the SHAPE. A mark this fat against the authored
    // length stops being a streak and becomes a lozenge, which is 0097's subject: a short one is a
    // fast dot, and a fast dot at this depth is what 0069 is named for.
    broke: 'the streaks fattened until the shortest of them is no longer a line',
    guard: '0097 — and a streak stays a streak, because a short one is a fast dot',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.24 };',
      replace: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.56 };',
    },
  },
];
