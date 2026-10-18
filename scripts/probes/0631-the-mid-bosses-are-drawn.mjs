// The breaks behind docs/decisions/0631-the-mid-bosses-are-drawn.md.
//
// ⚠️ Each puts back one of the two hulls that disagreed with themselves, as the placeholders drew them.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0631',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE MIDDLE PORT MOVED ONTO THE FACE'S EDGE, NOT THE OUTER PORTS PUT BACK. A probe is one edit,
      and the outer ports were two: the bites in the outline and the circles in the arm. Putting the
      circles back alone lays each wholly OUTSIDE the bitten outline — a separate piece, which this
      guard is not about — and it stayed green. This is the same defect on the port the arm still
      cuts: a hole across the outline, filling a crescent beyond the face.
    */
    broke: 'the redoubt’s middle port cut across the face’s edge, as the outer ones were',
    guard: '0631: no sub-path of a hull straddles its outline',
    edit: {
      path: 'src/render/bake.ts',
      find: '      ctx.arc(half + REDOUBT_PORT_X * r, half, REDOUBT_PORT_R * r, 0, Math.PI * 2);',
      replace: '      ctx.arc(half - r, half, REDOUBT_PORT_R * r, 0, Math.PI * 2);',
    },
  },
  {
    decision: '0631',
    suite: 'tests/accents.test.ts',
    broke: 'the chorus three overlapping circles again rather than one outline',
    guard: '0631: no sub-path of a hull straddles its outline',
    edit: {
      path: 'src/render/bake.ts',
      find: '      trace(ctx, f, CHORUS_HULL);',
      replace:
        '      for (const y of CHORUS_LOBES) {\n' +
        '        ctx.moveTo(half + CHORUS_LOBE_R * r, half + y * r);\n' +
        '        ctx.arc(half, half + y * r, CHORUS_LOBE_R * r, 0, Math.PI * 2);\n' +
        '      }',
    },
  },
];
