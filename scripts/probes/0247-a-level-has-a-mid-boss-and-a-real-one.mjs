// A level has a mid-boss and a real one — docs/decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md
//
// Every guard 0247 adds, broken on purpose. `node scripts/prove-guard.mjs 0247`.

export const PROBES = [
  {
    decision: '0247',
    suite: 'tests/bosses.test.ts',
    // The mid-boss's death starting the level's end, exactly as every boss's did before 0247.
    broke: 'the mid-boss’s death ending the level, so the run never reaches the real boss',
    guard: 'THE TWO FIGHTS: the mid-boss arrives',
    edit: {
      path: 'src/app/frame.ts',
      find: '        w.bossBurstRadius = w.bossRow.radius;\n        nextFight(w);\n',
      replace: '        w.bossBurstRadius = w.bossRow.radius;\n        nextFight(w);\n        w.clearedIn = BOSS_DEATH_STEPS;\n',
    },
  },
  {
    decision: '0247',
    suite: 'tests/bosses.test.ts',
    // The end boss's fight set up by the camera alone, over a mid-boss still alive.
    broke: 'the end boss’s fight set up when the camera reaches its distance, whether or not the mid-boss is dead',
    guard: 'and the end boss waits for the mid-boss',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (!w.bossSpawned && horizon >= fightAt(w)) {\n',
      replace: '    if (w.fight === 0 && horizon >= w.level.bossAt) nextFight(w);\n    if (!w.bossSpawned && horizon >= fightAt(w)) {\n',
    },
  },
  {
    decision: '0247',
    suite: 'tests/bosses.test.ts',
    // The music turning for any boss on the field, as it did before there were two.
    broke: 'the music turning for the mid-boss, so the fight’s piece plays twice a level',
    guard: 'THE MUSIC: a mid-boss is fought',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return w.bossPool.size > 0 && w.fight === 1;',
      replace: '  return w.bossPool.size > 0;',
    },
  },
  {
    decision: '0247',
    suite: 'tests/bosses.test.ts',
    // A level authored with its mid-boss after its end boss, which is a fight nobody reaches.
    broke: 'the Approach’s mid-boss authored beyond its end boss',
    guard: 'THE ROSTER: every level has a mid-boss',
    edit: {
      path: 'src/content/levels.ts',
      find: "    midBoss: { kind: 'sentinel', at: 1549 },",
      replace: "    midBoss: { kind: 'sentinel', at: 5549 },",
    },
  },
  {
    decision: '0247',
    suite: 'tests/bosses.test.ts',
    // A mid-boss authored back at its old health: tougher than the real boss it precedes.
    broke: 'the axis authored back at its full health, tougher than the jellyfish it precedes',
    guard: 'and the old end bosses are the mid-bosses now',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    // Half of 1140 — the black heart's mid-boss since 0247.\n    health: 570,",
      replace: "    // Half of 1140 — the black heart's mid-boss since 0247.\n    health: 1140,",
    },
  },
];
