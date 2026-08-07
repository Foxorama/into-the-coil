// The breaks behind docs/decisions/0074-the-box-is-drawn.md.
//
// ⚠️ The second one is the whole reason this decision exports a constant rather than doing a
// subtraction at the call site. A line drawn NEAR the wall rather than AT it is worse than no line,
// because it teaches the player something false — and it is the mistake that looks like tidying up.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0074',
    suite: 'tests/bound.test.ts',
    // The reported state of the world, restored: a hard block on the player's movement with nothing
    // drawn on it. Every other test in the suite still passes, because the wall itself is unchanged.
    broke: 'the boundary never drawn, so the wall goes back to being invisible',
    guard: 'THE ONE: a ship held against the boundary stops within a hull of the mark, in pixels',
    edit: {
      path: 'src/render/scene.ts',
      find: '  if (bound === null || bound.extent <= 0) return;',
      replace: '  if (bound === null || bound.extent <= 0) return;\n  return;',
    },
  },
  {
    decision: '0074',
    suite: 'tests/bound.test.ts',
    /*
      ⚠️ THE DRIFT THE EXPORTED CONSTANT EXISTS TO PREVENT, forced by hand. Six units is the ship's
      margin — the exact term somebody recomputing the boundary at the call site would forget — and it
      puts the line about forty pixels past where the ship actually stops. Nothing errors, the line is
      still a line, and the player learns a wall that is not there.
    */
    broke: 'the mark placed a margin past the wall, which is the subtraction done twice',
    guard: 'THE ONE: a ship held against the boundary stops within a hull of the mark, in pixels',
    edit: {
      path: 'src/app/mount.ts',
      find: 'inView: PLAYER_LEAD };',
      replace: 'inView: PLAYER_LEAD + 6 };',
    },
  },
  {
    decision: '0074',
    suite: 'tests/bound.test.ts',
    /*
      ⚠️ THE DRAW ORDER, and it is the one absolute `src/render/scene.ts` states: the player must
      never lose a bullet behind something. A row of marks over the top of the lane sits at exactly
      the distance they are most likely to be dodging at.
    */
    broke: 'the boundary drawn over the bodies rather than behind them',
    guard: 'and it is drawn BEHIND every body, so nothing is lost behind it',
    edit: {
      path: 'src/render/scene.ts',
      find: '  paintBound(surface, view, bound);',
      replace: '',
    },
  },
  {
    decision: '0074',
    suite: 'tests/bound.test.ts',
    /*
      ⚠️ THE SKY'S OWN LINE, PASTED — which is how this function would actually be written wrong,
      because the sky is the thing in this file it was copied from and the sky tiles along the scroll
      axis. The boundary tiles ACROSS the lane, which is a fixed hundred units on every device; using
      `alongSpan` makes the number of dashes a property of the monitor, so the line is a different
      length on a phone and an ultrawide and nothing looks broken on either.

      ⚠️ An earlier version of this probe tried to make the count vary with the CAMERA and came back
      STILL GREEN — correctly, because `paintBound` is not handed the camera at all and so cannot.
      The test's comment now says that rather than implying a guard over it.
    */
    broke: 'the dash count taken from the scroll axis, so the line is a different length per device',
    guard: 'is a fixed number of blits that does not vary with the camera or the device',
    edit: {
      path: 'src/render/scene.ts',
      find: '  const count = Math.ceil(view.acrossSpan / bound.extent);',
      replace: '  const count = Math.ceil(view.alongSpan / bound.extent);',
    },
  },
];
