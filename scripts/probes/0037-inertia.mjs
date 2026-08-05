// The breaks behind docs/decisions/0037-the-ship-has-mass.md.
//
// ⚠️ The first probe restores the behaviour this decision reverses. A build with it applied is every
// build before this one: velocity IS the ask, and the ship starts and stops the frame the key does.
//
// ⚠️ AND ONE PROBE COULD NOT BE WRITTEN, which is why the decision has a section about it. The first
// implementation split velocity into `scroll + departure` and lagged only the departure, claiming
// that lagging the whole velocity drifted the ship up-lane permanently. Trying to express that break
// is what revealed there was nothing to break: exponential approach is affine, the two forms are the
// same expression to 4e-16, and the test guarding the difference passed under both. 0019 says a
// guard must be seen to fail; a break that cannot be WRITTEN is that signal one step earlier.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0037',
    suite: 'tests/flight.test.ts',
    broke: 'the response set to 1, which is the arcade answer this decision reverses',
    guard: 'THE ONE: it does not arrive at full speed on the step it is asked',
    edit: {
      path: 'src/sim/flight.ts',
      find: 'export const FLIGHT_RESPONSE = 0.2;',
      replace: 'export const FLIGHT_RESPONSE = 1;',
    },
  },
  {
    decision: '0037',
    suite: 'tests/flight.test.ts',
    // Half of what mass is, and the half a player actually calls out. A ship that ramps up but stops
    // dead has the lag and none of the run-on, which is a different feel entirely.
    broke: 'the ship stopped dead the step the ask does, so there is no run-on',
    guard: 'it does not stop on the step the ask does',
    edit: {
      path: 'src/sim/flight.ts',
      find: '  ship.velAcross += (ay * scale - ship.velAcross) * FLIGHT_RESPONSE;',
      replace: '  ship.velAcross = ay === 0 ? 0 : ship.velAcross + (ay * scale - ship.velAcross) * FLIGHT_RESPONSE;',
    },
  },
  {
    decision: '0037',
    suite: 'tests/flight.test.ts',
    // A response above 1 overshoots and rings. A ringing ship is a control that fights the hand, and
    // it is the one failure mode that looks like a plausible "more responsive" tuning.
    broke: 'the response overshooting, so the ship rings instead of settling',
    guard: 'settles rather than oscillating, which is what makes it mass and not a spring',
    edit: {
      path: 'src/sim/flight.ts',
      find: 'export const FLIGHT_RESPONSE = 0.2;',
      replace: 'export const FLIGHT_RESPONSE = 1.6;',
    },
  },
  {
    decision: '0037',
    suite: 'tests/flight.test.ts',
    // ⚠️ The ship holds station in the CAMERA's frame, so the ask is a departure from the scroll rate
    // rather than a replacement for it. Drop the baseline and a ship asking for nothing decelerates
    // to zero and falls off the back of the world — over a few seconds, so the ramp hides it at first.
    broke: 'the scroll baseline dropped from the target, so a ship asking for nothing falls off the back',
    guard: 'a ship asking for nothing keeps the scroll rate exactly',
    edit: {
      path: 'src/sim/flight.ts',
      find: '  ship.velAlong += (scrollPerStep + ax * scale - ship.velAlong) * FLIGHT_RESPONSE;',
      replace: '  ship.velAlong += (ax * scale - ship.velAlong) * FLIGHT_RESPONSE;',
    },
  },
  {
    decision: '0037',
    suite: 'tests/interpolation.test.ts',
    // ⚠️ THE REAL HAZARD the no-op above was reaching for. A ship placed at zero velocity spends five
    // steps catching up to the scroll rate, and velocity converges on the camera's RATE rather than
    // on a POSITION — so the ground lost in those steps is lost for good, at every spawn and restart.
    broke: '`holdStation` leaving a ship at zero velocity, which costs it ground it never recovers',
    guard: 'stays put across many steps, not just within one',
    edit: {
      path: 'src/sim/flight.ts',
      find: '  ship.velAlong = scrollPerStep;\n  ship.velAcross = 0;',
      replace: '  ship.velAlong = 0;\n  ship.velAcross = 0;',
    },
  },
];
