// The breaks behind docs/decisions/0066-a-death-scatters-what-it-took.md.
//
// ⚠️ THE DEATH SCATTER IS GONE — docs/decisions/0256-a-pickup-keeps-the-count.md — and what these
// probes break is the THROW it left behind: `dropPickups` in src/app/frame.ts, thrown by a mid-boss's
// death rather than a ship's. 0066 built the ring, the flight and the bounce; 0256 kept them and
// changed who throws. The probes that were about the ORDER — a scatter dispatched after the reducer
// that empties the list — went with the scatter, because there is no list to empty.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // ⚠️ THE REPORTED ONE, in its new shape: a drop that throws nothing.
    broke: 'the throw removed, so a mid-boss’s death drops none of what it is worth',
    guard: 'THE DROP: one piece per kind in the list',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const item = w.pickups.spawn();\n  // A drop one pickup short is dropped rather than grown',
      replace: '  const item = null;\n  // A drop one pickup short is dropped rather than grown',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THROWN ALONG AND LEFT THERE, which is what an explosion looks like in a game that does not
      scroll. It is 0034's *every speed is in the camera's frame*, and 0077 is what makes it worth
      restating: the piece IS thrown along, and the only thing keeping it on screen is that the
      along half decays back to the camera's rate. Take the decay away and 0066's original objection
      comes true exactly as it was written.
    */
    // ⚠️ Re-aimed by 0236: the throw is a flight now, ended by `turnsLeft` running out, and a
    // piece is bounded by the box's walls while it flies. The decay that used to answer 0066's
    // objection is gone; what answers it is the flight ENDING. A flight that never ends is a piece
    // bouncing for ever, never waiting and never leaving — which is the guard on the wait.
    broke: 'the flight never ending, so a dropped piece bounces for ever and never joins the wait',
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
      same heading, so the whole drop travels together and the player reaches one of it.
    */
    broke: 'the even spacing dropped, so the whole drop leaves on one heading',
    guard: 'leaves in every direction, and no two pieces travel together',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const angle = Math.PI / 3 + (index / pieces) * Math.PI * 2 + w.dropRng.range(-halfGap, halfGap);',
      replace: '  const angle = Math.PI / 3 + w.dropRng.range(-halfGap, halfGap);',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // ⚠️ Re-aimed by 0236. The timer this broke is gone — *"they need to last as long as regular
    // power ups"* — and a dropped piece carries `lingerFor` like an authored one. The break that
    // is left is the opposite of the old one: the wait typed short for the drop alone.
    broke: 'the drop given a wait of its own, shorter than an authored pickup’s',
    guard: 'stays as long as an authored pickup does, and then leaves the same way',
    edit: { path: 'src/app/frame.ts', find: '  item.holdFor = lingerFor(row);\n}', replace: '  item.holdFor = 60;\n}' },
  },
];
