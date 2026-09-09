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
      // ⚠️ Re-anchored by 0263, which gave every shot row its stages.
      // ⚠️ Re-anchored by 0294, which took the hurtbox down with the drawing: 3.2 to 2.24.
      find: 'radius: 2.24, health: BLADE_EDGE, damage: 1, speed: 1, fission: SPENT_BY_ARRIVING },',
      replace: 'radius: 2.24, health: BLADE_EDGE, damage: 1, speed: 0.8, fission: SPENT_BY_ARRIVING },',
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
      /*
        ⚠️ **Re-anchored by 0294**, which took the star to 5.6 on *"the shurikens also need to be
        smaller and neater"* and put a comment between the two frames. The pair is named through the
        turn face alone now — and `tests/weapons.test.ts` holds that the two are one size, so a break
        that moved only this one would redden that instead and say so.
      */
      find: '  shurikenTurn: 5.6,',
      replace: '  shurikenTurn: 10,',
    },
  },
];
