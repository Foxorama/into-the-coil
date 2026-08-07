// The breaks behind docs/decisions/0062-a-boss-dies-loudly.md.
//
// ⚠️ The reported symptom — *"currently the level just ends"* — was produced by ONE line: the clear
// fired on the exact step the pool emptied, and the shell answers a clear by raising a screen over
// the frame. So the loudest event in the game happened behind an overlay, on the frame it started.
// Everything else here is about the explosion being an explosion rather than a puff.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0062',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly. It is the tidiest possible line — the pool is empty, so
      the level is over — and it is the whole of the complaint.
    */
    broke: 'the level cleared on the step the boss stopped existing, so it ends behind the overlay',
    guard: 'does not report the level cleared on the step the boss stops existing',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.clearedIn = BOSS_DEATH_STEPS;',
      replace: '      w.onCleared();',
    },
  },
  {
    decision: '0062',
    suite: 'tests/level.test.ts',
    // One burst instead of a rate. It is over inside half a second and reads exactly like an enemy
    // dying, because it IS an enemy dying with a bigger number.
    broke: 'the explosion made one burst rather than a rate, so a boss goes up in a puff',
    guard: 'scatters fragments over many steps',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.clearedIn % BOSS_PULSE === 0) {',
      replace: '  if (w.clearedIn === BOSS_DEATH_STEPS - 1) {',
    },
  },
  {
    decision: '0062',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE ONE A STILL FRAME CANNOT SEE. The place remembered as a WORLD position rather than as an
      offset from the camera: the first frame of the explosion is perfect, and by the last one the
      camera has moved 54 units and left it behind.
    */
    broke: 'the explosion left in world coordinates, so the scroll walks away from it',
    guard: 'where the player watched it die',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.cameraAlong + w.bossOffset + w.burstRng.range(-spread, spread),',
      replace: '      w.bossOffset + w.burstRng.range(-spread, spread),',
    },
  },
  {
    decision: '0062',
    suite: 'tests/level.test.ts',
    // The beat as a FREEZE rather than a beat. The obvious way to make an explosion readable is to
    // stop the world for it, and it is the one thing this game may never do to a player still flying.
    broke: 'the beat turned into a freeze, so the scroll stops while the boss burns',
    guard: 'keeps the world running through the beat, so it is not a pause',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (!w.stepping) {\n      w.onIdle();\n      return;\n    }',
      replace: '    if (!w.stepping || w.clearedIn > 0) {\n      w.onIdle();\n      return;\n    }',
    },
  },
  {
    decision: '0062',
    suite: 'tests/level.test.ts',
    // The beat cut to a length nothing can be watched in. It is not a freeze and it is not a puff; it
    // is simply too short to be an event, which is the failure the report describes.
    broke: 'the beat cut below what can be watched',
    guard: 'the beat is long enough to be watched',
    edit: { path: 'src/app/frame.ts', find: 'const BOSS_DEATH_STEPS = 96;', replace: 'const BOSS_DEATH_STEPS = 20;' },
  },
  {
    decision: '0062',
    suite: 'tests/level.test.ts',
    // The counter left set across a level boundary. The next level then reports itself cleared a
    // second and a half in, with its own boss still ahead of the player.
    broke: 'the beat left counting into the next level, which then clears itself',
    guard: 'does not carry the beat into the next level',
    edit: { path: 'src/app/frame.ts', find: '  w.clearedIn = 0;\n  w.bossPatrol = 1;', replace: '  w.bossPatrol = 1;' },
  },
  {
    decision: '0062',
    suite: 'tests/budget.test.ts',
    // The rate raised past what the debris pool can hold. `src/sim/pool.ts` drops rather than grows,
    // so the loudest moment in the game becomes the one where bursts silently stop appearing.
    broke: 'the explosion’s rate raised past what the debris pool can hold',
    guard: 'leaves room for a whole boss explosion',
    edit: { path: 'src/content/debris.ts', find: '  boss: 12,', replace: '  boss: 40,' },
  },
];
