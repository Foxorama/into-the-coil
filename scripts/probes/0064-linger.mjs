// The breaks behind docs/decisions/0064-a-pickup-waits-to-be-taken.md.
//
// ⚠️ Every one of these leaves a pickup that spawns in the right place, drifts across the lane, shows
// the right face and is collected correctly. What they take away is the WAIT — and a wait is
// invisible in a screenshot by definition, which is why four of the five drive the real frame for
// twenty seconds and measure where the pickup is ON SCREEN rather than what its velocity was.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0064',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly: a pickup with no speed of its own, falling back through
      the whole view at the scroll rate. It is the tidiest possible line and it is what shipped.
    */
    broke: 'the wait removed, so a pickup runs back through the view and is gone',
    guard: 'THE REPORTED ONE: it stops running away, and stays on screen for seconds',
    /*
      ⚠️ REWRITTEN BY 0077, WHICH CHANGED THE LINE THIS USED TO PLANT. `driftPickups` no longer
      assigns `velAlong`; it eases toward a target, so the break is now *the target has no station in
      it* rather than *the velocity is zero*. What the probe is for is unchanged: a pickup with
      nothing holding it falls back through the whole view at the scroll rate, which is what shipped
      before 0064.
    */
    edit: {
      path: 'src/app/frame.ts',
      find: '    const station = item.along - w.cameraAlong <= PICKUP_STATION ? w.scrollPerStep : 0;',
      replace: '    const station = 0;',
    },
  },
  {
    decision: '0064',
    suite: 'tests/pickups.test.ts',
    // The wait cut below one cycle. Which of the two faces the player gets is then decided by when
    // they happened to arrive, which is the complaint the whole ask came from.
    broke: 'the wait cut below one full cycle, so which face you get is luck again',
    guard: 'waits long enough for the player to see both of its faces and choose',
    edit: { path: 'src/app/frame.ts', find: 'const PICKUP_LINGER_STEPS = 420;', replace: 'const PICKUP_LINGER_STEPS = 90;' },
  },
  {
    decision: '0064',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE ONE THE COUNTER EXISTS FOR. A hold tested against the pickup's own position instead of
      against a count: a body holding station never moves relative to the camera, so the condition
      that started the hold is true for ever and the pickup parks in the view — taking one of eight
      pool slots for the rest of the level, so a later pickup silently never appears.
    */
    broke: 'the wait made a position test rather than a count, so a pickup parks in the view for ever',
    guard: 'and then leaves, so the field does not fill up with things nobody took',
    /*
      ⚠️ REWRITTEN BY 0077 — the branch this planted over now carries the scattered pieces' decay, so
      the break is the decrement alone. It is the same mistake and a smaller diff: a hold that is
      never counted down never ends, because a body holding station never moves relative to the camera
      and the condition that started the hold is true for ever.
    */
    edit: {
      path: 'src/app/frame.ts',
      find: '    item.holdFor--;',
      replace: '    if (item.along - w.cameraAlong > PICKUP_STATION) continue;',
    },
  },
  {
    decision: '0064',
    suite: 'tests/pickups.test.ts',
    // A station beyond the player's own box. The pickup waits, in plain sight, somewhere the ship is
    // structurally unable to fly to — which reads as the collection being broken rather than as a
    // number being wrong.
    broke: 'the station put beyond where the ship is allowed to fly',
    guard: 'waits somewhere the ship can actually fly to',
    edit: { path: 'src/app/frame.ts', find: 'const PICKUP_STATION = 100;', replace: 'const PICKUP_STATION = 200;' },
  },
  {
    decision: '0064',
    suite: 'tests/pickups.test.ts',
    // The wander stopped. A pickup that waits on one line is a pickup the player parks next to, which
    // is the opposite of *"they need to bounce and move around the screen"*.
    broke: 'the wander dropped, so a waiting pickup sits on one line',
    guard: 'bounces across the lane while it waits',
    edit: {
      path: 'src/app/frame.ts',
      find: '  item.velAcross = index % 2 === 0 ? PICKUP_DRIFT : -PICKUP_DRIFT;',
      replace: '  item.velAcross = 0;',
    },
  },
  {
    decision: '0064',
    suite: 'tests/cycling.test.ts',
    // The cycle put back to what it was. It is half a second, it is exactly what was asked for, and
    // nothing in a still frame can see it — so the guard is the arithmetic between the two constants.
    broke: 'the cycle returned to its old length, undoing the half second that was asked for',
    guard: 'is half a second faster than it was, which is what was asked for',
    edit: { path: 'src/content/pickups.ts', find: 'export const CYCLE_UNITS = 112;', replace: 'export const CYCLE_UNITS = 130;' },
  },
];
