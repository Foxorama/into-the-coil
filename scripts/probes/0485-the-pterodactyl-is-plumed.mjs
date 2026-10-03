// The pterodactyl is plumed — docs/decisions/0485-the-pterodactyl-is-plumed.md
//
// Every guard 0485 adds, broken on purpose. `node scripts/prove-guard.mjs 0485`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0485',
    suite: 'tests/quetzal.test.ts',
    // The report, put back: the outline at the tile's share, which closed every slot between two primaries.
    broke: 'the wings’ outline at the tile’s share, thick enough to close the slots',
    guard: 'THE ASKED-FOR ONE, IN PIXELS',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const QUETZAL_WING_OUTLINE = 1.1;',
      replace: 'const QUETZAL_WING_OUTLINE = 2.9;',
    },
  },
  {
    decision: '0485',
    suite: 'tests/quetzal.test.ts',
    // The primaries no longer narrowing to fingers: the hand a sheet again with notches in it.
    broke: 'the primaries not emarginated',
    guard: 'THE ASKED-FOR ONE, IN PIXELS',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const finger = primary ? 1 - 0.6 * Math.min',
      replace: 'const finger = primary ? 1.6 - 0 * Math.min',
    },
  },
  {
    decision: '0485',
    suite: 'tests/quetzal.test.ts',
    // The beat even again: the downstroke as slow as the recovery and then slower.
    broke: 'the downstroke the slow half of the beat',
    guard: 'THE DOWNSTROKE DRIVES',
    edit: {
      path: 'src/content/sprites.ts',
      find: 'export const QUETZAL_DOWNSTROKE = 0.4;',
      replace: 'export const QUETZAL_DOWNSTROKE = 0.65;',
    },
  },
  {
    decision: '0485',
    suite: 'tests/quetzal.test.ts',
    // The body sinking on the downstroke, which is a bird being pushed down by its own wings.
    broke: 'the heave the wrong way round',
    guard: 'THE BODY HEAVES, IN UNITS',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const want = -heave.by * sliding * Math.cos(',
      replace: 'const want = heave.by * sliding * Math.cos(',
    },
  },
  {
    decision: '0485',
    suite: 'tests/quetzal.test.ts',
    // Heaving through a brace: the body slides off the roots of its own beams.
    broke: 'the heave going on while the hull braces',
    guard: 'THE BRACE',
    edit: {
      path: 'src/app/frame.ts',
      find: 'if (heave !== undefined && head.holdFor <= 0) {',
      replace: 'if (heave !== undefined) {',
    },
  },
];
