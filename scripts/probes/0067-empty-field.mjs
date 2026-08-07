// The breaks behind docs/decisions/0067-a-new-run-opens-on-an-empty-field.md.
//
// ⚠️ The first is the reported bug restored exactly, and it is a REMOVAL of two lines that were only
// added because 0057 took them out of the other end. The rest are the three other ways a new run can
// be handed the last one's level: its bullets, its distance, and its place in the wave table.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0067',
    suite: 'tests/continue.test.ts',
    /*
      ⚠️ THE REPORTED ONE, and the state it restores is the state the game actually shipped in for a
      day: `respawn` stopped sweeping the field (0057, correctly) and `resetScene` had been relying
      on it to, so a new run opened on whatever the last one had left flying.
    */
    broke: 'the field left unswept when a level starts, which is the state 0057 left behind',
    guard: 'THE REPORTED ONE: a run started from the title does not inherit the last one’s field',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.enemies.clear();\n  w.enemyShots.clear();',
      replace: '  void w.enemies;',
    },
  },
  {
    decision: '0067',
    suite: 'tests/continue.test.ts',
    // Half the sweep. The enemies are the loud half and the bullets are the half that kills you, and
    // a fix that reached for the visible one would leave a run opening under fire from nowhere.
    broke: 'the enemies swept and their bullets left in the air',
    guard: 'THE REPORTED ONE: a run started from the title does not inherit the last one’s field',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.enemies.clear();\n  w.enemyShots.clear();',
      replace: '  w.enemies.clear();',
    },
  },
  {
    decision: '0067',
    suite: 'tests/continue.test.ts',
    /*
      The player's own words for the symptom — *"you can start middle of level 2"* — read as a claim
      about the camera rather than about the field. It was not what was happening, and it is the
      thing a reader who takes the report literally would break next. Distance travelled is the only
      clock a level has.
    */
    broke: 'the camera left where the last run ended, which is the bug the report sounded like',
    guard: 'and starts at the beginning of level one, however deep the last run got',
    edit: { path: 'src/app/frame.ts', find: '  w.cameraAlong = 0;', replace: '  void w.cameraAlong;' },
  },
  {
    decision: '0067',
    suite: 'tests/continue.test.ts',
    // The same misreading one field over: the level's script resumed part-way through, so the run
    // opens on a stretch of the wave table nobody flew to.
    broke: 'the wave table left where the last run ended',
    guard: 'and starts at the beginning of level one, however deep the last run got',
    edit: { path: 'src/app/frame.ts', find: '  w.nextWave = 0;', replace: '  void w.nextWave;' },
  },
];
