// The breaks behind docs/decisions/0230-the-ship-flies.md.
//
// ⚠️ NOTHING HERE BREAKS HOW A FLAME LOOKS — docs/decisions/0192-a-guard-holds-an-invariant.md. What
// a burn looks like is judged on `scripts/shot-sheet.mjs`. What these break is the mechanism the
// report is about: that the flame answers the hand, keeps time, hangs with the ship's motion, and goes
// out with the ship.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0230',
    suite: 'tests/thrust.test.ts',
    /*
      ⚠️ THE FLAME LEFT BURNING ON A WRECK, which is what the obvious simplification — drop the
      flying check — produces: a ship coming apart with its engines still running, at the one moment
      the picture has to say *gone*.
    */
    broke: 'the exhaust left lit on a wreck',
    guard: 'THE REPORTED ONE: a flying ship has a flame behind its tail, and a wreck has none',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (!flying) {\n    // A wreck has no engines. The flame goes out on the step the hull does.\n    if (w.exhaust.size > 0) w.exhaust.releaseAt(0);\n    return;\n  }',
      replace: '  if (!flying) {\n    return;\n  }',
    },
  },
  {
    decision: '0230',
    suite: 'tests/thrust.test.ts',
    /*
      ⚠️ THE STATE READ OFF THE VELOCITY, which is the physically reasonable version and the one
      that goes quiet exactly when the player leans on the stick against the front of the box.
    */
    broke: 'the burn read off the velocity instead of the ask, so a pinned push idles',
    guard: 'still burns with the ship pinned against the front of its box, because the ask is the state',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const ask = w.intent.along;',
      replace: '  const ask = (w.ship.velAlong - w.scrollPerStep) / SHIP_SPEED;',
    },
  },
  {
    decision: '0230',
    suite: 'tests/thrust.test.ts',
    /*
      ⚠️ THE PULSE FROZEN: one frame forever, which is a sticker with a flame drawn on it. The frames
      are in the table, the clock is in the world, and only a stepped world sees that they never meet.
    */
    broke: 'the pulse frozen on one frame',
    guard: 'pulses: a pulsing state alternates its frames on the step clock',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const page = Math.floor(w.steps / PULSE_STEPS) % row.frames.length;',
      replace: '  const page = 0 * PULSE_STEPS;',
    },
  },
  {
    decision: '0230',
    suite: 'tests/thrust.test.ts',
    /*
      ⚠️ THE SWAY REMOVED, so the flame sits dead behind the tail however the ship moves — which is
      *moving a thing around*, in the report's own words.
    */
    broke: 'the sway removed, so the flame sits dead behind the tail',
    guard: 'sways: the flame hangs against the ship’s sideways velocity, and swings back when it stops',
    edit: {
      path: 'src/app/frame.ts',
      find: '  flame.across = w.ship.across - w.ship.velAcross * SWAY;',
      replace: '  flame.across = w.ship.across + 0 * SWAY;',
    },
  },
  {
    decision: '0230',
    suite: 'tests/thrust.test.ts',
    /*
      ⚠️ THE FLAME DRAWN OVER THE HULL. Its root is at the tail by design, and drawn on top it reads
      as fire on the ship rather than out of it.
    */
    broke: 'the exhaust drawn over the ship',
    guard: 'is drawn under the shell and the ship and over every shot, and every thrust row has frames and a trail',
    edit: {
      path: 'src/app/mount.ts',
      // ⚠️ Re-anchored by 0233: the bolts sit between the bombs and the exhaust now.
      find: 'bolts, exhaust, shieldOrbs, shipPool],',
      replace: 'bolts, shieldOrbs, shipPool, exhaust],',
    },
  },
];
