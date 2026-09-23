// The breaks behind docs/decisions/0362-the-room-has-a-clock.md.
//
// Reported of the music room's belt: *"the volcanos … look really weird with the frozen lava rocks that
// just don't move at all"*. Both ways back to that picture are here: the picture going back on the sim's
// clock, and the walk's clock standing still.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0362',
    suite: 'tests/room.test.ts',
    // What shipped for a year: one clock, the sim's, on every screen — and a screen that does not step
    // therefore shows a volcano that does not throw.
    broke: 'the picture went back on the sim’s own clock, so a stopped sim is a stopped volcano',
    guard: 'AND THE REPORTED ONE: on a screen that does not step, a second of WALKING moves it as far',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const time = (w.pictureSteps ?? w.steps) + alpha;',
      replace: '    const time = w.steps + alpha;',
    },
  },
  {
    decision: '0362',
    suite: 'tests/room.test.ts',
    /*
      The other way back: the clock still exists and the walk no longer turns. A room that hands the
      same number to every position is exactly the frozen picture again, and it is what an
      accumulator that nobody started would also do.
    */
    broke: 'the walk’s clock stopped at the top of the level, so every position of the walk shows one picture',
    edit: {
      path: 'src/app/attract.ts',
      find: '  return cameraAlong / SCROLL_PER_STEP;',
      replace: '  return 0 * cameraAlong;',
    },
    guard: 'AND THE REPORTED ONE: on a screen that does not step, a second of WALKING moves it as far',
  },
  {
    decision: '0362',
    suite: 'tests/room.test.ts',
    /*
      And the rate, which is the half of it a reader would call a detail: a walk that counted its steps
      at any rate but the one it scrolls at would put the room's volcano on a different flight from the
      one the level plays, and nothing on the screen would say so.
    */
    broke: 'the walk counted a step per world unit rather than per SCROLL_PER_STEP',
    edit: {
      path: 'src/app/attract.ts',
      find: '  return cameraAlong / SCROLL_PER_STEP;',
      replace: '  return cameraAlong;',
    },
    guard: 'AND THE REPORTED ONE: on a screen that does not step, a second of WALKING moves it as far',
  },
];
