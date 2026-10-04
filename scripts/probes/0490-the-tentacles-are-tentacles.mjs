// The tentacles are tentacles — docs/decisions/0490-the-tentacles-are-tentacles.md
//
// Every guard 0490 adds, broken on purpose. `node scripts/prove-guard.mjs 0490`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0490',
    suite: 'tests/medusa.test.ts',
    // The report, put back: a rod waving from its root, a quarter-wave that never crosses its line.
    broke: 'a wave too long to bend the arm',
    guard: 'THE ASK, IN LANE UNITS: a slack tentacle is a curve and not a rod',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      waves: 1.5,',
      replace: '      waves: 0.3,',
    },
  },
  {
    decision: '0490',
    suite: 'tests/medusa.test.ts',
    // The tips never alight: the laser leaves a tentacle that gave no sign.
    broke: 'the tips never charged',
    guard: 'THE TIPS ALIGHT, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (b.kind === BEAM_BOLT_KIND && b.lifeFor > b.holdFor && b.lifeFor - b.holdFor <= tendrils.lit.charge) charging = true;',
      replace: '    if (b.kind === BEAM_BOLT_KIND && b.lifeFor > b.holdFor && b.lifeFor - b.holdFor <= tendrils.lit.charge) charging = false;',
    },
  },
  {
    decision: '0490',
    suite: 'tests/medusa.test.ts',
    // Lit for the whole warning: a glow, not a charge.
    broke: 'the tips alight for the whole warning',
    guard: 'THE TIPS ALIGHT, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (b.kind === BEAM_BOLT_KIND && b.lifeFor > b.holdFor && b.lifeFor - b.holdFor <= tendrils.lit.charge) charging = true;',
      replace: '    if (b.kind === BEAM_BOLT_KIND && b.lifeFor > b.holdFor) charging = true;',
    },
  },
  {
    decision: '0490',
    suite: 'tests/medusa.test.ts',
    // The bell with no oral arms under it.
    broke: 'the frilled arms never laid',
    guard: 'THE FRILLS: four oral arms hang from the bell’s rim',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const arms = frills === undefined ? 0 : frills.roots.length;',
      replace: '    const arms = 0;',
    },
  },
];
