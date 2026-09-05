// The serpent throws together — docs/decisions/0261-the-serpent-throws-together.md
//
// Every guard 0261 adds, broken on purpose. `node scripts/prove-guard.mjs 0261`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    // 0248's wall put back on the row.
    broke: 'the acid back on the wall',
    guard: 'THE THREE WEAPONS: a raking fan of acid',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    attack: { kind: 'rake', turn: 0.45 },\n    uncoil: null,\n    fall: null,\n    chill: null,\n    sprite: SPRITE.boss8,",
      replace: "    attack: { kind: 'wall', gap: 12 },\n    uncoil: null,\n    fall: null,\n    chill: null,\n    sprite: SPRITE.boss8,",
    },
  },
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    // The lightning head dropped from the last third.
    broke: 'the last third’s lightning head dropped, so the round is acid and void alone',
    guard: 'THE THREE WEAPONS: a raking fan of acid',
    edit: {
      path: 'src/content/bosses.ts',
      find: "            { shot: 'void', attack: { kind: 'spray' } },\n            { shot: 'void', attack: { kind: 'rain', warning: 45, halfWidth: 4 } },",
      replace: "            { shot: 'void', attack: { kind: 'spray' } },",
    },
  },
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    // The round never turning: the first head every volley.
    broke: 'the round never turning, so every volley of the last third is acid',
    guard: 'THE THREE WEAPONS: a raking fan of acid',
    edit: {
      path: 'src/app/boss.ts',
      find: '      boss.firePhase++;\n      throwAttack(head.attack',
      replace: '      throwAttack(head.attack',
    },
  },
];
