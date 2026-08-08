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
    edit: {
      path: 'src/app/frame.ts',
      find: '    const item = w.pickups.spawn();\n    // A scatter one pickup short is dropped rather than grown',
      replace: '    const item = null;\n    // A scatter one pickup short is dropped rather than grown',
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
    broke: 'the along throw left undecayed, so the scatter leaves the screen before it can be reached',
    guard: 'is thrown in both axes, and the along half is spent rather than carried',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const drift = item.lifeFor > 0 ? w.scrollPerStep : 0;',
      replace: '      const drift = item.lifeFor > 0 ? item.velAlong : 0;',
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
      find: '    const angle = (i / count) * Math.PI * 2 + w.scatterRng.range(-halfGap, halfGap);',
      replace: '    const angle = w.scatterRng.range(-halfGap, halfGap);',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // The timer removed. *"A short timer so there's enough time to grab some, but maybe not all"* —
    // without it a death hands the whole loadout back and costs the player nothing at all.
    broke: 'the short timer removed, so a death costs the player nothing',
    guard: 'is gone on a short timer, and says so when it goes',
    edit: { path: 'src/app/frame.ts', find: '    item.lifeFor = SCATTER_STEPS;', replace: '    void SCATTER_STEPS;' },
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
    edit: {
      path: 'src/app/frame.ts',
      find: '    const kind = w.pickupKinds[upgrades[i]!];',
      replace: '    if (i >= 0) return;\n    const kind = w.pickupKinds[upgrades[i]!];',
    },
  },
];
