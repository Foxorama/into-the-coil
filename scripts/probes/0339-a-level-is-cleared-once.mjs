// A level is cleared once — docs/decisions/0339-a-level-is-cleared-once.md
//
// Every guard 0339 adds, broken on purpose. `node scripts/prove-guard.mjs 0339`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0339',
    suite: 'tests/gyre.test.ts',
    /*
      ⚠️ THE LATCH DROPPED FROM THE ROOM'S ARMING CONDITION, WHICH IS THE BUG AS IT SHIPPED IN #377.
      *The way out is open and the countdown is not running* is true again one step after every
      countdown ends, so `onCleared` fires for as long as the banner is up — measured at nine times in
      twenty seconds. Every other claim in the file stays green: the room still opens, the wreck still
      falls, the world still starts again, and the level still clears. It clears NINE TIMES.
    */
    broke: 'the latch dropped from the room’s arming condition, so the clear re-arms itself for ever',
    guard: 'THE REPORTED ONE: a boss with a room clears its level exactly once',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.roomOpen >= room.opens && w.clearedIn <= 0 && !w.clearedReported) w.clearedIn = BOSS_DEATH_STEPS;',
      replace: '  if (w.roomOpen >= room.opens && w.clearedIn <= 0) w.clearedIn = BOSS_DEATH_STEPS;',
    },
  },
  {
    decision: '0339',
    suite: 'tests/gyre.test.ts',
    /*
      ⚠️ AND THE LATCH NEVER CLEARED BETWEEN LEVELS, WHICH IS THE SAME BUG WITH ITS SIGN FLIPPED AND IS
      WHY THE RESET LIVES BESIDE `clearedIn`'s. A run that carried the last level's report into the next
      one would never clear again: the room opens, the condition is true, and the latch says it has
      already been said. One level ships and the run is sealed in the second.
    */
    broke: 'the report latch kept across a level boundary, so the second level can never be cleared at all',
    // ⚠️ The TWO-level guard and not the one above it, which plays one level and is perfectly happy
    // with a latch that is never let go — `npm run prove` reported STILL GREEN against it first.
    guard: 'the NEXT level can still be cleared',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.clearedReported = false;\n  w.bossPatrol = 1;',
      replace: '  w.bossPatrol = 1;',
    },
  },
];
