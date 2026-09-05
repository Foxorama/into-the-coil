// The hydra grows heads — docs/decisions/0254-the-hydra-grows-heads.md
//
// Every guard 0254 adds, broken on purpose. `node scripts/prove-guard.mjs 0254`.

export const PROBES = [
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // The turn never advanced: the first head throws every volley and the others are a table.
    broke: 'the turn never advanced, so the first head throws every volley',
    guard: 'THE HEADS TAKE TURNS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '      boss.firePhase++;\n      throwAttack(head.attack, SHOTS[head.shot],',
      replace: '      throwAttack(head.attack, SHOTS[head.shot],',
    },
  },
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // A head's shot ignored: every head throws the row's acid.
    broke: 'a head’s shot ignored, so every head throws the row’s acid',
    guard: 'THE HEADS TAKE TURNS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '      throwAttack(head.attack, SHOTS[head.shot], boss, phase, tier, ship, shots, cameraAlong, scrollPerStep, bolts, rainRng);',
      replace: '      throwAttack(head.attack, bullet, boss, phase, tier, ship, shots, cameraAlong, scrollPerStep, bolts, rainRng);',
    },
  },
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // The round not going round: the sixth volley has no head.
    broke: 'the round not going round, so the sixth volley has no head to throw',
    guard: 'THE HEADS TAKE TURNS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const head = attack.heads[((boss.firePhase % n) + n) % n]!;',
      replace: '      const head = attack.heads[Math.min(boss.firePhase, n - 1)]!;',
    },
  },
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // The second phase authored with one head: the flame is never grown.
    broke: 'the 80% phase authored with the first head only, so the flame is never grown',
    guard: 'THE FIVE HEADS: a head a fifth',
    edit: {
      path: 'src/content/bosses.ts',
      find: "        attack: { kind: 'heads', heads: [{ shot: 'acid', attack: { kind: 'spray' } }, { shot: 'flame', attack: { kind: 'spray' } }] },",
      replace: "        attack: { kind: 'heads', heads: [{ shot: 'acid', attack: { kind: 'spray' } }] },",
    },
  },
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // The laser head moved to the middle of the hull.
    broke: 'the laser head’s beam authored from the middle of the hull, where no side head is',
    guard: 'THE LASER HEAD',
    edit: {
      path: 'src/content/bosses.ts',
      // The three-head phase's laser, which is the one the guard drives.
      find: "            { shot: 'lance', attack: { kind: 'beam', warning: 24, hold: 24, halfWidth: 3, from: [-9] } },\n          ],\n        },\n      },\n      {\n        upTo: 0.4,",
      replace: "            { shot: 'lance', attack: { kind: 'beam', warning: 24, hold: 24, halfWidth: 3, from: [0] } },\n          ],\n        },\n      },\n      {\n        upTo: 0.4,",
    },
  },
];
