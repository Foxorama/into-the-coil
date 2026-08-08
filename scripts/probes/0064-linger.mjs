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
    /*
      The wait cut to a second and a half.

      ⚠️ RE-AIMED BY 0082, WHICH MOVED WHAT THE WAIT IS FOR. It used to be measured against
      `CYCLE_UNITS` — long enough to see both faces and choose — and 0082 removed the cycle. The wait
      itself is untouched at 420, and what it now has to cover is the thing the player is actually
      doing: crossing the lane for one of six pickups a level. Same break, same constant, a guard that
      measures the player instead of a constant that no longer exists.
    */
    broke: 'the wait cut below a crossing, so a pickup can only be taken by a player already beside it',
    guard: 'waits long enough to be crossed the whole lane for',
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
  /*
    ⚠️ **A THIRD PROBE WAS HERE AND ITS SUBJECT NO LONGER EXISTS.** It put `CYCLE_UNITS` back to 130,
    undoing the half second 0064 was asked for, and it was anchored on
    `tests/cycling.test.ts`'s arithmetic between two constants.
    `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` removed the cycle, the constant and
    the suite, so the probe is deleted rather than repointed: there is nothing left for it to break.

    ⚠️ **The OTHER half of 0064 is untouched and both probes above still hold it.** The wait
    (`PICKUP_LINGER_STEPS`) and the bounce are what the report actually asked for — *"pickups
    linger"* — and 0082 kept both. What it took away is the reason the wait was 420 rather than some
    other number, which `src/app/frame.ts` now says out loud.
  */
];
