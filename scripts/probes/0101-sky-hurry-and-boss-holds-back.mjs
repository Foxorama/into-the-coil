// The breaks behind docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md.
//
// ⚠️ THIS IS THE FOURTH PASS OVER THE SKY'S SPEED AND THE FIRST OVER A BOSS'S STATION, so the sky
// half has to break something 0078, 0088 and 0097 do not already own. What only this decision can
// break is the LENGTH of a streak — the lever that exists because depth ran out of ceiling — and the
// arithmetic that replaced 0097's exception list.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0101',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE LENGTH TAKEN BACK, which is the whole of what this decision found. Every previous answer
      to *the sky is too slow* moved a depth; depth has a hard ceiling at 1 and the streak layer was
      already at 0.92 of it. Length has no ceiling — it is the smear a fast thing leaves — so it is
      the lever that was left, and shortening it back to 0097's range is the picture the report is
      about with every depth still at its new value.

      ⚠️ IT IS CAUGHT BY THE ASPECT RATIO rather than by a speed assertion, which is the honest place:
      what a short streak stops being is a streak.
    */
    broke: 'the streaks shortened back to what 0097 drew, so length stops saying speed',
    guard: '0097 — and a streak stays a streak, because a short one is a fast dot',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_STREAK_UNITS = { from: 11, to: 24 };',
      replace: 'const SKY_STREAK_UNITS = { from: 1, to: 2 };',
    },
  },
  {
    decision: '0101',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE LENGTH KEPT AND THE COUNT NOT PAID, which is the edit that makes the sky a curtain. Twice
      the length at the old count is two thirds again as much ink, and the streak layer's own bound is
      what says how much of the eye the fast layer may take. Every other sky guard is green over it:
      the marks are the right thickness, the right aspect, the right alpha, at the right depths.
    */
    broke: 'the streak count put back to fifteen at the new length, so the fast layer is a curtain',
    guard: 'and the near layer is the quiet one, on every count that buys attention',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_STARS = { skyFar: 90, skyNear: 90, skyRush: 12 };',
      replace: 'const SKY_STARS = { skyFar: 90, skyNear: 90, skyRush: 30 };',
    },
  },
  {
    decision: '0101',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE CEILING TREATED AS A LICENCE RATHER THAN AS ARITHMETIC. 0097 held *only a streak may pass
      two thirds*, which is an exception list; this decision replaced it with *a mark may move at the
      world's rate less half of how much of a bullet it looks like*. The difference only shows on a
      layer that is neither at the old ceiling nor a streak — so the break pushes the BACK layer, whose
      marks are two thirds of a bullet, up to where the near one now runs. Under 0097's rule this
      would have been caught only because it is not a streak; under the arithmetic it is caught
      because its marks are fat, which is the reason that always mattered.
    */
    broke: 'the back layer given the near layer’s rate, with marks two thirds of a bullet wide',
    // ⚠️ The guard was RENAMED by 0103, not moved: one layer is deliberately not behind the game any
    // more, so a title claiming they all are described something the assertions had stopped holding.
    // The clearance this break violates is the same one, and it is still the assertion that catches it.
    guard: 'is never at the world’s own rate, on whichever side of the game it sits',
    edit: {
      path: 'src/app/mount.ts',
      find: '  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },',
      replace: '  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.825 },',
    },
  },
  {
    decision: '0101',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE REPORTED PICTURE, PUT BACK: the last boss at the station it shipped with, whose nearest
      approach is 37% of the narrowest screen. *"They come into 50% and then basically float at that
      level and it doesn't give the player enough space to respond."*

      ⚠️ THE GUARD THAT WAS THERE IS GREEN OVER IT, and that is the point. `the whole hull stays on
      screen on the narrowest device` holds the FORWARD end of the swing and has been saying *"every
      boss has 28 more units of room it did not have"* since 0080 widened the view. Nothing held the
      near end at all.
    */
    broke: 'the last boss put back at the station it shipped with, 37% into the screen',
    guard: '0101 — and it leaves the player more than half the screen, at the NEAR end of the swing',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    station: 134,',
      replace: '    station: 95,',
    },
  },
  {
    decision: '0101',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE AURA LEFT WHERE IT WAS WHILE THE BOSSES MOVED, which is the half of this decision that has
      nothing to do with sound and broke the sound anyway. Pushing every station twenty units forward
      moves the player's DEFENSIVE position twenty units further from the boss, and that position is
      exactly what 0092's second guard is written from. At 124 the aura at the back of the box is
      0.049 of its ceiling — which is the defect 0092 is named for, arriving from a change about
      screen space.

      ⚠️ IT IS 0092's OWN CLAIM EARNING ITSELF: *"these two are driven off `BOSSES` and the player's
      box, and neither can be satisfied by moving `AURA_FAR_UNITS` to meet it."*
    */
    broke: 'the aura’s range left at 0092’s value while every boss moved twenty units forward',
    guard: '0092 — THE DEFECT: a player who backs off to dodge is still inside the aura',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const AURA_FAR_UNITS = 145;',
      replace: 'export const AURA_FAR_UNITS = 124;',
    },
  },
];
