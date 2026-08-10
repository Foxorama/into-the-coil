// The breaks behind docs/decisions/0103-the-fast-layer-is-in-front.md.
//
// ⚠️ The hit-flash half is NOT here — it lives in scripts/probes/0035-legibility.mjs beside the other
// nine breaks over the same machinery, because a probe belongs with the rule it breaks rather than
// with the session that noticed it. The two entries there restore the shipped bug exactly.
//
// ⚠️ Everything below is about the SKY, and specifically about the half of the new rule that
// arithmetic cannot state: a clearance is about one mark, and *how many things may overtake the
// player* is a different question that the same formula answers `any number of them`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0103',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE ONE THE WHOLE DECISION TURNS ON. Amending 0065 from *strictly below 1* to *not AT 1*
      opens a branch that did not exist, and the obvious way to spend it wrongly is to send the
      layer the player already complained about twice across it. The near layer's own clearance is
      0.155, so 1.44 SATISFIES the arithmetic completely — and it is a field of dot-shaped specks
      flying at the player, which is 0069 arriving from the far side.

      This is the probe that proves the second rule is load-bearing rather than decorative.
    */
    broke: 'the near DOT layer sent into the foreground, which the clearance alone permits',
    guard: 'and only the streak layer may be in FRONT of the game, and only one of them',
    edit: {
      path: 'src/app/mount.ts',
      find: '  { sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.825 },',
      replace: '  { sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 1.44 },',
    },
  },
  {
    decision: '0103',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE CURTAIN. Two layers in front is the other way the count rule fails, and it fails
      DIFFERENTLY from the one above — every mark could be a streak and clear its own bound, and the
      game would still be played behind a moving screen. Held as a count precisely because neither
      failure implies the other.

      The far layer is used because it is the one with the most room: at 1.61 it is nowhere near its
      own clearance of 0.329, so nothing but the count can object to it.
    */
    broke: 'a second layer put in front of the game, so the player flies behind a curtain',
    guard: 'and only the streak layer may be in FRONT of the game, and only one of them',
    edit: {
      path: 'src/app/mount.ts',
      find: '  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },',
      replace: '  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 2.2 },',
    },
  },
  {
    decision: '0103',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE CLEARANCE, ON THE SIDE THAT NEVER EXISTED BEFORE. Every previous version of this bound
      was one-sided, so nothing has ever checked that a layer creeping DOWN towards the world's rate
      from above is refused. 1.02 is in front of the game, is nowhere near a curtain, and is inside
      the streak layer's own clearance of 0.061 — the failure mode where somebody decides the
      foreground is *too* fast and walks it back until it sits on top of the bullets.
    */
    broke: 'the foreground layer walked back down onto the world’s own rate from above',
    guard: 'is never at the world’s own rate, on whichever side of the game it sits',
    edit: {
      path: 'src/app/mount.ts',
      find: '  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 2.2 },',
      replace: '  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 1.02 },',
    },
  },
  {
    decision: '0103',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ AND EXACTLY 1, which the clearance cannot catch on its own: a mark of no size at all
      satisfies `|depth − 1| > 0` and sits precisely on the rate of every bullet on the screen.
      0065's absolute survives as this one assertion, and it is the only thing standing over the
      worst place in the whole range.
    */
    broke: 'a layer put at exactly the world’s rate, where nothing separates it from a bullet',
    guard: 'and only the streak layer may be in FRONT of the game, and only one of them',
    edit: {
      path: 'src/app/mount.ts',
      find: '  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 2.2 },',
      replace: '  { sprite: SPRITE.skyRush, extent: SPRITE_EXTENT.skyRush, depth: 1 },',
    },
  },
];
