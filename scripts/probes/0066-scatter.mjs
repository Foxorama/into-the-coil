// The breaks behind docs/decisions/0066-a-death-scatters-what-it-took.md.
//
// ⚠️ The one worth understanding is the ORDER. `lifeLost` empties the upgrade list, so a scatter
// dispatched after it throws nothing at all — and every other assertion in this file is about a
// scatter that happened, so a scatter that never happens looks like a screen with nothing on it,
// which is exactly what the game looked like before this decision.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // ⚠️ THE REPORTED ONE: a death that takes the upgrades and gives nothing back. It is what shipped.
    broke: 'the scatter removed, so a death takes the upgrades and offers none of them back',
    // ⚠️ Renamed by 0082: the guard is no longer *one pickup per upgrade*, because a death now throws
    // each piece on a coin. What it holds is that something comes back, where the ship was.
    guard: 'THE REPORTED ONE: pickups where the ship was, and never more than it carried',
    // ⚠️ Re-anchored by 0243: one piece per kind is thrown by `throwPiece`, at one indent less.
    edit: {
      path: 'src/app/frame.ts',
      find: '  const item = w.pickups.spawn();\n  // A scatter one pickup short is dropped rather than grown',
      replace: '  const item = null;\n  // A scatter one pickup short is dropped rather than grown',
    },
  },
  /*
    ── TWO PROBES WERE HERE AND THEIR SUBJECT NO LONGER EXISTS ────────────────────────────────────

    Both were about the CYCLE reaching a scattered piece. The first left it on — so a scattered
    `spread` turned into a `missileSpread` and the game handed the player something they never found —
    and the second was its counterweight, widening the no-cycling rule to every pickup and thereby
    undoing 0052 entirely.

    ⚠️ **`docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` removed the cycle**, so
    *non-cycling* — the ask's own word — is now true of every pickup in the game by construction. There
    is no `cyclePickups`, no `CYCLE`, and no edit that would make a scattered piece turn into
    something else. Deleted rather than repointed: a probe with nothing to break is
    `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`'s STILL GREEN, which is the failure mode
    the harness exists to surface.

    ⚠️ **What survives of the concern is an assertion rather than a probe** —
    `tests/pickups.test.ts` holds that the scatter is a SUBSET of what the death took, which catches
    the same class of *the game gave back something it never took* by a different route.
  */
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THROWN ALONG AND LEFT THERE, which is what an explosion looks like in a game that does not
      scroll. It is 0034's *every speed is in the camera's frame*, and 0077 is what makes it worth
      restating: the scatter IS now thrown along, and the only thing keeping it on screen is that the
      along half decays back to the camera's rate. Take the decay away and 0066's original objection
      comes true exactly as it was written.
    */
    // ⚠️ Re-aimed by 0236: the throw is a flight now, ended by `turnsLeft` running out, and a
    // piece is bounded by the box's walls while it flies. The decay that used to answer 0066's
    // objection is gone; what answers it is the flight ENDING. A flight that never ends is a piece
    // bouncing for ever, never waiting and never leaving — which is the guard on the wait.
    broke: 'the flight never ending, so a scattered piece bounces for ever and never joins the wait',
    guard: 'stays as long as an authored pickup does, and then leaves the same way',
    edit: {
      path: 'src/app/frame.ts',
      find: '      item.turnsLeft--;\n      const inView = item.along - w.cameraAlong;',
      replace: '      const inView = item.along - w.cameraAlong;',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE EVEN TERM DROPPED, leaving the jitter on its own. 0077 turned the fan into a ring and this
      is the same break in the new shape: without `i/n` of a circle every piece leaves on nearly the
      same heading, so a whole loadout travels together and the player reaches one of it.
    */
    broke: 'the even spacing dropped, so a whole loadout leaves on one heading',
    guard: 'leaves in every direction, and no two pieces travel together',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ `count` and it was `upgrades.length` — 0082's 50% filter runs first, so the divisor is how
      // many pieces are really thrown rather than how many the death took. The break is unchanged.
      // ⚠️ Re-anchored by 0243: two pieces at most, spaced by `index` over `pieces` from a sixth of
      // a turn. Without the even term both leave on the same heading.
      find: '  const angle = Math.PI / 3 + (index / pieces) * Math.PI * 2 + w.scatterRng.range(-halfGap, halfGap);',
      replace: '  const angle = Math.PI / 3 + w.scatterRng.range(-halfGap, halfGap);',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // ⚠️ Re-aimed by 0236. The timer this broke is gone — *"they need to last as long as regular
    // power ups"* — and a scattered piece carries `lingerFor` like an authored one. The break that
    // is left is the opposite of the old one: the wait typed short for the scatter alone.
    broke: 'the scatter given a wait of its own, shorter than an authored pickup’s',
    guard: 'stays as long as an authored pickup does, and then leaves the same way',
    // ⚠️ Re-anchored by 0243: the throw is `throwPiece`, one piece, one indent less.
    edit: { path: 'src/app/frame.ts', find: '  item.holdFor = lingerFor(row);\n}', replace: '  item.holdFor = 60;\n}' },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE ORDER, which is the one thing `src/app/frame.ts` cannot state. `lifeLost` empties the
      upgrade list, so a scatter dispatched after it throws nothing — and the code reads perfectly.
    */
    broke: 'the scatter moved after the reducer that empties the list, so it throws nothing',
    guard: 'THE REPORTED ONE: pickups where the ship was, and never more than it carried',
    // ⚠️ Re-anchored by 0243: the scatter counts its kinds first and throws one piece per kind; a
    // scatter after the reducer counts an empty list, which is what throwing nothing looks like.
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (weapons > 0) throwPiece(w, 'weapon', weapons, index++, pieces);",
      replace: "  if (weapons > 0 && upgrades.length === 0) throwPiece(w, 'weapon', weapons, index++, pieces);\n  if (pieces > 0) return;",
    },
  },
];
