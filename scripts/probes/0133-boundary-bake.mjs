// The breaks behind docs/decisions/0133-the-place-is-baked-at-the-boundary.md.
//
// ⚠️ BOTH OF THESE ARE THE CHEAP VERSION OF THE FEATURE, NOT A TYPO. A boundary bake that copies
// what it shares reads as more obviously correct than one that hands the same arrays back — and it
// is a whole second composition resident at every level break, plus a fresh AudioBuffer for all
// twenty-three layers instead of the two or twenty-one that actually changed. A bake with no cancel
// reads as simpler and hands the mixer the wrong place's music up to a phrase into the level after
// the one it belonged to.
//
// Neither is visible by listening to one level.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0133',
    suite: 'tests/sound.test.ts',
    broke: 'a boundary bake that copies what it shares, so every level break costs a whole composition',
    guard: 'THE COST MODEL: a layer the place does not state is the SAME array, not a copy',
    edit: {
      path: 'src/app/sound.ts',
      find: '  const own = { ...base } as Record<MusicLayer, Float32Array>;\n  const jobs: (() => void)[] = [];',
      replace:
        '  const own = {} as Record<MusicLayer, Float32Array>;\n  for (const layer of MUSIC_LAYERS) own[layer] = Float32Array.from(base[layer]);\n  const jobs: (() => void)[] = [];',
    },
  },
  {
    decision: '0133',
    suite: 'tests/sound.test.ts',
    broke: 'a bake that cannot be cancelled, so a place the run has left still arrives',
    guard: 'and a run that leaves the place before its material arrives never hears it',
    edit: {
      path: 'src/app/sound.ts',
      // ⚠️ RE-ANCHORED BY 0157, which put a slice between `stopped` and the end check. The break is
      // unchanged — the cancel flag stops being read — and `npm run prove` refused the stale anchor
      // rather than reporting green, which is the whole of what 0019 is for.
      find: '  const step = (): void => {\n    if (stopped) return;\n    /*',
      replace: '  const step = (): void => {\n    /*',
    },
  },
];
