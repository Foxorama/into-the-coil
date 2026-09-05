// A blade rides a helix — docs/decisions/0244-a-blade-rides-a-helix.md
//
// Every guard 0244 adds, broken on purpose. `node scripts/prove-guard.mjs 0244`.

export const PROBES = [
  {
    decision: '0244',
    suite: 'tests/blades.test.ts',
    // 0242's loop put back: the along swings about the axis too, so the track comes back on itself.
    broke: 'the blade’s along swinging with its across, so its track is a chain of loops again',
    guard: 'THE HELIX: a blade leaves the wingtip',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const along = b.fromAlong;\n',
      replace: '    const along = b.fromAlong + Math.cos(b.orbitAngle) * b.orbitRadius;\n',
    },
  },
  {
    decision: '0244',
    suite: 'tests/blades.test.ts',
    // The 0242 speed restored: 2.9 s to the leading edge against a budget of 2.5.
    broke: 'the blade back at the speed the play-test called slow',
    guard: 'THE PACE: a blade crosses',
    edit: {
      path: 'src/content/shots.ts',
      find: 'radius: 3.2, health: BLADE_EDGE, damage: 1, speed: 1 },',
      replace: 'radius: 3.2, health: BLADE_EDGE, damage: 1, speed: 0.8 },',
    },
  },
  {
    decision: '0244',
    suite: 'tests/blades.test.ts',
    // The first draft's throw: from the crest, `coil` out, rather than from the wingtip.
    broke: 'the pair thrown from its crests, a coil out, rather than from the wingtips',
    guard: 'THE HELIX: a blade leaves the wingtip',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const angle = side > 0 ? lift : Math.PI + lift;',
      replace: '    const angle = side * (Math.PI / 2) + 0 * lift;',
    },
  },
  {
    decision: '0244',
    suite: 'tests/blades.test.ts',
    // The first draft's box restored: ten units of a hundred-unit lane, which was called too big.
    broke: 'the star drawn at the size the play-test called too big',
    guard: 'THE SIZE: a blade is drawn',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  shuriken: 8,\n  shurikenTurn: 8,\n',
      replace: '  shuriken: 10,\n  shurikenTurn: 10,\n',
    },
  },
];
