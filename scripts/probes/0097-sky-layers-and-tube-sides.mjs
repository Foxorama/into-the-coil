// The breaks behind docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md.
//
// ⚠️ THIS IS THE FOURTH PASS OVER THE SKY AND THE THIRD OVER WHERE A MISSILE COMES FROM, so the
// interesting breaks are not "the number went back" — 0069, 0078, 0080, 0088 and 0077 already own
// those, and three of them had to be re-anchored or retired by this decision rather than re-argued.
// What only 0097 can break is the SHAPE of the answer: a fast layer that is a line rather than a
// dot, a layer that is allowed to be visible rather than only allowed to be quiet, and a first
// missile tube that is deliberately not on the centreline.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0097',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE WHOLE DECISION UNDONE IN ONE LINE, and it is the state the report is about: two layers,
      the faster of them dimmed to nothing, so the quickest thing the player can see moves at 0.24.
      Every other sky guard in the file is green over this — the stars are under a bullet, the
      parallax is intact, the two depths are exactly what 0078 and 0088 asked for. What goes red is
      the only assertion that says a sky has a layer in it that reads as speed.
    */
    broke: 'the streak layer taken back out, so the sky is two layers of dots again',
    // ⚠️ The guard was renamed by 0103: one layer is deliberately NOT behind the game any more, so a
    // title claiming they all are was a false description of what the assertions hold.
    guard: 'is never at the world’s own rate, on whichever side of the game it sits',
    edit: {
      path: 'src/app/mount.ts',
      // ⚠️ Re-anchored on 2026-08-10: the streak layer crossed into the FOREGROUND at 1.61
      // (`docs/decisions/0103-the-fast-layer-is-in-front.md`). Same break, and it now costs strictly
      // more — without it the sky is not only two layers of dots, it is entirely behind the game.
      find: '  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 1.61 },',
      replace: '',
    },
  },
  {
    decision: '0097',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE BREAK THE THICKNESS LADDER CANNOT SEE, and the reason the aspect ratio is a guard of its
      own. A `skyRush` mark drawn with no length is the thinnest thing on the screen, is comfortably
      under a bullet and puts LESS ink down than it did — so it passes every ceiling in the file
      while putting a field of fast-moving dots at 0.85, which is exactly
      docs/decisions/0069-the-sky-is-behind-the-game.md's subject arriving through the door this
      decision opened.
    */
    broke: 'the streaks drawn as dots, so the fastest layer is a field of moving specks',
    guard: '0097 — and a streak stays a streak, because a short one is a fast dot',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_STREAK_UNITS = { from: 11, to: 24 };',
      replace: 'const SKY_STREAK_UNITS = { from: 0, to: 0 };',
    },
  },
  {
    decision: '0097',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ HALF THE REPORTED BUILD, RESTORED — 0088's alpha exactly, 0.18 of solid, which measures 4.5%
      of the bed's ink. Both of 0088's levers together measure 2.0% and are the state the player
      described as *"there's only one starfield background."*

      ⚠️ ONE LEVER AND NOT BOTH, AND THE FIRST RUN OF THIS PROBE IS WHY IT MATTERS. The floor was a
      thirty-second — 3.1% — chosen against the reported build, and this probe reported STILL GREEN
      at 4.5%. A floor obeys the same rule as a ceiling: it sits above the smallest SINGLE-lever
      break, not above the pair, or one hand's edit can put the layer back out with the suite green.

      ⚠️ IT IS A BREAK OF A FLOOR AND NOT OF A CEILING, which is what makes it this decision's rather
      than a re-run of somebody else's. Every guard over this layer pushed the same way for three
      passes; a one-sided bound cannot see a layer being dimmed out of existence, and the whole suite
      was green over the build this report is about.
    */
    broke: 'the near layer dimmed back to what 0088 shipped, which is half of the build reported',
    guard: 'and the near layer is the quiet one, on every count that buys attention',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_ALPHA = { skyFar: 1, skyNear: 0.34, skyRush: 0.42 };',
      replace: 'const SKY_ALPHA = { skyFar: 1, skyNear: 0.18, skyRush: 0.42 };',
    },
  },
  {
    decision: '0097',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE PAYMENT FOR THE LOOSENED SPEED CEILING, TAKEN BACK. A layer is allowed past two thirds
      because one of its marks is a fifth of a bullet thick; fatten it past the layer BEHIND it and
      the argument is gone while the depth stays where it is — which is the shape
      docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md found last time a
      ceiling was loosened, arriving at the layer that replaced it.

      ⚠️ 0.35 AND NOT 0.28, AND THE FIRST RUN OF THIS PROBE IS WHY. Equal ceilings make a strict
      inequality a coin flip, and the guard was reading a MAXIMUM over fifteen streaks against one
      over ninety dots — so *the same thickness as the layer behind* measured thinner and the probe
      reported WRONG TEST. The guard now reads the mean; the break now actually crosses the line.
    */
    broke: 'the streak layer fattened past the middle layer’s thickness, so nothing pays for its speed',
    guard: '0097 — AND THE NEARER A LAYER IS, THE THINNER ITS MARKS ARE, WHICH IS WHAT BUYS THE SPEED',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.11 };',
      replace: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.35 };',
    },
  },
  {
    decision: '0097',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ THE REPORTED PICTURE, PUT BACK: *"the missiles now fire from the center of the ship and it
      looks like only one missile."* 0077's own guard is green over this state — it was 0077's
      answer — so the break has to fail an assertion that says a single tube is OFF the centreline,
      which is the half of the ask that reads *"yes it will look off balance, that's the point."*
    */
    broke: 'the single tube put back on the centreline, which is the picture that was reported',
    guard: '0097 — puts the first tube on the across-minus side and the second on the across-plus side',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const side = i === 0 ? -1 : 1;',
      replace: '    const side = w.weapon.launchers === 1 ? 0 : i === 0 ? -1 : 1;',
    },
  },
];
