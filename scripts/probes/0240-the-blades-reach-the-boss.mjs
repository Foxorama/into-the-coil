// The blades reach the boss — docs/decisions/0240-the-blades-reach-the-boss.md
//
// Every guard 0240 adds, broken on purpose. `node scripts/prove-guard.mjs 0240`.

export const PROBES = [
  {
    decision: '0240',
    suite: 'tests/blades.test.ts',
    // The ring put back on the ship, round — 0237's picture, restored exactly.
    broke: 'the ring centred on the ship and round again, so it leaves by the edge behind before it is far ahead',
    guard: 'THE REACH: a blade gets much further ahead',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const BLADE_LEAD = 30;\nconst BLADE_STRETCH = 1.5;',
      replace: 'const BLADE_LEAD = 0;\nconst BLADE_STRETCH = 1;',
    },
  },
  {
    decision: '0240',
    suite: 'tests/blades.test.ts',
    // The ring centred ahead but not stretched: it still leaves behind before it is far ahead.
    broke: 'the ring left round, so a lead alone does not carry it to a boss',
    guard: 'THE REACH: a blade gets much further ahead',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const BLADE_STRETCH = 1.5;',
      replace: 'const BLADE_STRETCH = 1;',
    },
  },
  {
    decision: '0240',
    suite: 'tests/blades.test.ts',
    // The blade started at the front of its ring rather than the back, so it appears far ahead of the nose.
    broke: 'the blade started at the front of its ring, so it appears thirty units ahead of the nose',
    guard: 'THE SPIRAL: a thrown blade starts at the nose',
    edit: {
      path: 'src/app/frame.ts',
      find: '  blade.orbitAngle = Math.PI;',
      replace: '  blade.orbitAngle = 0;',
    },
  },
];
