// The breaks behind docs/decisions/0446-each-place-has-its-own-faces.md.
//
// One per claim in tests/faces.test.ts, and one per guard 0446 widened from The Approach to every
// place — each break below is in a place other than The Approach, so the guard as it stood before
// 0446 would have stayed green over it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0446',
    suite: 'tests/faces.test.ts',
    broke: 'Ember Nebula sends The Approach’s eight in its own colours — the report, put back',
    guard: 'THE REPORTED ONE',
    edit: {
      path: 'src/render/foes.ts',
      find: '    nebula: EMBER,',
      replace: '    nebula: a,',
    },
  },
  {
    decision: '0446',
    suite: 'tests/faces.test.ts',
    broke: 'Ember Nebula’s fire-chain swollen into a blob, so its weaver no longer lies across the lane',
    guard: 'and every place’s weaver lies across the lane',
    edit: {
      path: 'src/render/foes.ts',
      find: '    const w = (0.12 + 0.22 * bead ** 1.5) * end;',
      replace: '    const w = (0.5 + 0.22 * bead ** 1.5) * end;',
    },
  },
  {
    decision: '0446',
    suite: 'tests/cycles.test.ts',
    broke: 'Rime Shelf’s snowflake given three poses that are all its rest, so it never turns',
    guard: 'in pixels: every enemy’s outline moves',
    edit: {
      path: 'src/render/foes.ts',
      find: 'const FLAKE_TURN = [0, 0.19, -0.17] as const;',
      replace: 'const FLAKE_TURN = [0, 0, 0] as const;',
    },
  },
  {
    decision: '0446',
    suite: 'tests/signature.test.ts',
    broke: 'the Toxic Mire’s spinner drawn as its warden, so two kinds in one place are one silhouette',
    guard: 'and every signature is a new silhouette against every other enemy hull',
    edit: {
      path: 'src/render/foes.ts',
      find: '  spinner: MIRE_SPINNER,',
      replace: '  spinner: MIRE_WARDEN,',
    },
  },
  {
    decision: '0446',
    suite: 'tests/accents.test.ts',
    broke: 'Ember Nebula’s vent cracks run past its rim, a stroke over the edge of a body only that place sends',
    guard: 'is more fills in the SAME bitmap',
    edit: {
      path: 'src/render/foes.ts',
      find: 'polar(a, 0.66, -0.36, 0)]);',
      replace: 'polar(a, 1.4, -0.36, 0)]);',
    },
  },
];
