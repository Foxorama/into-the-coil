// A pickup floats — docs/decisions/0293-a-pickup-floats.md
//
// Every guard 0293 adds, broken on purpose. `node scripts/prove-guard.mjs 0293`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0293',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION, AS FAR AS ONE EDIT CAN PUT IT BACK: THE HEADING
      IS EASED.** What made the old motion read as *"random speed and direction weirdly"* was that
      nothing about it was ever steady — the along axis chased a moving target through a lag while the
      across axis ran flat. Easing the whole velocity toward the float instead of setting its
      magnitude restores that: the pickup is always on its way to a heading and never on one.
    */
    broke: 'the heading eased rather than kept, so the pickup is never travelling the way it points',
    guard: '0293 — and it turns only where it hits something',
    edit: {
      path: 'src/app/frame.ts',
      find: '    item.velAlong = w.scrollPerStep + (along / speed) * eased;\n    item.velAcross = (across / speed) * eased;',
      replace:
        '    item.velAlong += (w.scrollPerStep - PICKUP_FLOAT - item.velAlong) * PICKUP_EASE;\n' +
        '    item.velAcross += (0 - item.velAcross) * PICKUP_EASE;',
    },
  },
  {
    decision: '0293',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ **AND THE SPEED SET RATHER THAN EASED, WHICH IS 0077's WALL REBUILT BY THE DECISION REMOVING
      IT.** A pickup arrives crossing the screen at the camera's whole rate and has to end at a third
      of it; taking that in one step is *"power ups hit a wall when they get to the centre of the
      screen"*, in a new place. It is the failure this decision made first and the guard caught.
    */
    broke: 'the float speed set in one step instead of eased, so the arrival is an impact again',
    guard: 'and it never stops dead, which is what read as a wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const eased = speed + (PICKUP_FLOAT - speed) * PICKUP_EASE;',
      replace: '    const eased = PICKUP_FLOAT;',
    },
  },
  /*
    ── ⚠️ AND THERE IS NO PROBE FOR THE ARRIVAL LATCH, BECAUSE THE HARNESS REFUSED THE ONE WRITTEN ──

    `spin` says *has it arrived*, so a floating pickup that drifts back above `PICKUP_SLOW_AT` cannot
    fall into the approach branch again. One was written that took the latch away — and it came back
    **STILL GREEN** against every guard in the suite.

    ⚠️ **IT IS RIGHT, AND THE 182-UNIT OVERSHOOT THE LATCH WAS ADDED FOR CAME FROM A DRAFT THAT NO
    LONGER EXISTS.** That draft eased the approach onto the float's own speed, which crossed the view
    three times slower and left a pickup wandering the band between `PICKUP_SLOW_AT` and the box's
    forward wall for long enough to be dragged out of it. The shipped approach eases to the camera's
    rate, so nothing in the fixture reaches that band at all.

    ⚠️ **SO THE LATCH IS DEFENCE AND NOT A CLAIM THIS DECISION HOLDS.** It is four characters, it is
    correct, and a scattered piece thrown up-lane could still reach the band it guards — but nothing
    measures that today. Writing a probe that reddens something else in order to have one would be
    0019's failure wearing a tick.
  */
];
