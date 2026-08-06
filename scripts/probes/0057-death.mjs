// The breaks behind docs/decisions/0057-a-death-does-not-rewind-the-level.md.
//
// ⚠️ The first two are the reported bug and the thing that makes fixing it safe, and they pull in
// OPPOSITE directions — sweep the field and a death reads as a restart; keep the field on a hit's
// invulnerability and a death reads as two deaths. Either alone is worse than what was reported.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0057',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly. It is the tidiest-looking line in `respawn` — every
      other pool on that list is cleared, so the enemies not being cleared reads as an oversight
      somebody would helpfully fix. It is the whole decision.
    */
    broke: 'the field swept on a death again, so the level reads as having restarted',
    guard: 'leaves the enemies where they were, so the screen does not empty',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.playerShots.clear();\n  w.missiles.clear();',
      replace: '  w.enemies.clear();\n  w.enemyShots.clear();\n  w.playerShots.clear();\n  w.missiles.clear();',
    },
  },
  {
    decision: '0057',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE HALF THAT MAKES THE OTHER HALF SAFE. Reusing `INVULN_STEPS` is the obvious code and it
      is what was there before — and with the field now surviving, it hands the player a ship they
      are not yet holding, in a lane still full of what killed them, for three quarters of a second.
    */
    broke: 'a respawn given a hit’s invulnerability, in a lane that is no longer swept',
    guard: 'comes back harder to kill than a ship that was merely hit',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.ship.invulnFor = RESPAWN_INVULN_STEPS;',
      replace: '  w.ship.invulnFor = INVULN_STEPS;',
    },
  },
  {
    decision: '0057',
    suite: 'tests/level.test.ts',
    // The window shortened until it no longer buys what it exists to buy. The guard is the distance
    // the ship covers rather than the step count, so this fails on the lane and not on the constant.
    broke: 'the respawn window cut below what it takes to cross the lane and find a gap',
    guard: 'is invulnerable long enough to fly clear across the lane',
    edit: { path: 'src/app/frame.ts', find: 'const RESPAWN_INVULN_STEPS = 120;', replace: 'const RESPAWN_INVULN_STEPS = 50;' },
  },
  {
    decision: '0057',
    suite: 'tests/level.test.ts',
    // A death that rewound the wave table. It was never the bug — the clock always survived — and it
    // is the shape somebody would reach for if the reported symptom were misread as a real rewind.
    broke: 'the wave table rewound on a death, which is the bug the report sounded like',
    guard: 'does not rewind the wave table or the camera either',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.playerShots.clear();\n  w.missiles.clear();',
      replace: '  w.nextWave = 0;\n  w.playerShots.clear();\n  w.missiles.clear();',
    },
  },
  {
    decision: '0057',
    suite: 'tests/level.test.ts',
    // The other direction: a death that costs nothing on the field at all. A shot from a ship that no
    // longer exists is a hit nobody fired, and 0039's cost read at its smallest scale.
    broke: 'the dead ship’s own shots and missiles left flying',
    guard: 'takes away what belonged to the ship that died',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.playerShots.clear();\n  w.missiles.clear();',
      replace: '  void w.missiles;',
    },
  },
];
