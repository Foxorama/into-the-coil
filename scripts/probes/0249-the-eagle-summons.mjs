// The eagle summons — docs/decisions/0249-the-eagle-summons.md
//
// Every guard 0249 adds, broken on purpose. `node scripts/prove-guard.mjs 0249`.

export const PROBES = [
  {
    decision: '0249',
    suite: 'tests/eagle.test.ts',
    // The lash's reach authored to nothing: every flame at one speed, which is a fan.
    broke: 'the whip’s tip no faster than its root, so the lash is a fan',
    guard: 'THE WHIP: one volley is a lash',
    edit: {
      path: 'src/content/bosses.ts',
      find: "shot: 'flame', attack: { kind: 'whip', sweep: 1.1, reach: 0.9 } },",
      replace: "shot: 'flame', attack: { kind: 'whip', sweep: 1.1, reach: 0 } },",
    },
  },
  {
    decision: '0249',
    suite: 'tests/eagle.test.ts',
    // The flame inked as the player's own bullet.
    broke: 'the flame drawn in the player’s own bullet ink',
    guard: 'THE WHIP: one volley is a lash',
    edit: {
      path: 'src/render/bake.ts',
      find: "  flame: 'fire',",
      replace: "  flame: 'bullet',",
    },
  },
  {
    decision: '0249',
    suite: 'tests/eagle.test.ts',
    // The summons asked for and never answered: the frame's half removed.
    broke: 'the summons never answered, so a volley calls nobody',
    guard: 'THE SUMMONS: a volley at half health',
    edit: {
      path: 'src/app/frame.ts',
      find: '    summonAdds(w, calling.enemy, boss.turnsLeft, calling.formation);\n',
      replace: '',
    },
  },
  {
    decision: '0249',
    suite: 'tests/eagle.test.ts',
    // The adds put behind the camera, where a wave never arrives.
    broke: 'the adds placed at the camera rather than at the leading edge, behind the ship',
    guard: 'THE SUMMONS: a volley at half health',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const along = spawnAlong(w.cameraAlong);\n  const gap = gapAcross(row.radius);\n  for (let i = 0; i < count; i++) {',
      replace: '  const along = w.cameraAlong;\n  const gap = gapAcross(row.radius);\n  for (let i = 0; i < count; i++) {',
    },
  },
  {
    decision: '0249',
    suite: 'tests/eagle.test.ts',
    // The kite given a gun: a horde that shoots is a wall.
    broke: 'the kite given a gun, so the horde is a wall of bullets',
    guard: 'THE KITE: Ember Nebula’s horde',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    closing: 0.42,\n    fireEvery: 0,\n    shot: 'spit',",
      replace: "    closing: 0.42,\n    fireEvery: 60,\n    shot: 'spit',",
    },
  },
];
