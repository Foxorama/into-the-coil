// The breaks behind docs/decisions/0530-the-ions-burn-blue.md.
//
// ⚠️ The trade and the slot, the blue that keeps it off the frost's cyan, and the two links between the
// hangar and the picture — the atlas's flame re-baked for the flying ship, and the painter reading it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0530',
    suite: 'tests/flames.test.ts',
    broke: 'the thrusters burned on any ship without a shard spent',
    guard: 'every ship burns the standard, and the ion once bought',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return state.owned[flame];',
      replace: '  return true;',
    },
  },
  {
    decision: '0530',
    suite: 'tests/flames.test.ts',
    broke: 'a saved flame fitted that its own list never bought',
    guard: 'keeps each ship’s flame, and refuses one its own list does not own',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (raw !== undefined && flameOpen(holding, raw)) flame[kind] = raw;',
      replace: '    if (raw !== undefined) flame[kind] = raw;',
    },
  },
  {
    decision: '0530',
    suite: 'tests/flames.test.ts',
    broke: 'the ion flame burned in the frost shard’s own cyan',
    guard: 'the ion is a blue, held well off the frost shard’s cyan',
    edit: {
      path: 'src/content/flames.ts',
      find: "inks: { outer: '#3a5cff', inner: '#9fb8ff' }",
      replace: "inks: { outer: '#5ef0ff', inner: '#9fb8ff' }",
    },
  },
  {
    decision: '0530',
    suite: 'tests/flames.browser.test.ts',
    broke: 'the atlas’s flame never re-baked, so a run on the thrusters burns orange',
    guard: 'the run’s flame is royal blue where the standard’s is not',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (fit.flame !== atlasFlame) {',
      replace: '    if (false) {',
    },
  },
  {
    decision: '0530',
    suite: 'tests/flames.browser.test.ts',
    broke: 'the flame painter burning the standard whatever it is asked',
    guard: 'the run’s flame is royal blue where the standard’s is not',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const { outer, inner, wisp } = flameInks(palette, flame);',
      replace: "  const { outer, inner, wisp } = flameInks(palette, 'standard');",
    },
  },
];
