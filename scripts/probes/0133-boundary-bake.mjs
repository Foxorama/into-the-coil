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
      // Re-anchored by 0190, which put the place's own CUE set between these two lines.
      // Re-anchored by 0190. The line below is followed by the place's own CUE set now, so the two
      // are no longer adjacent; one line is unique on its own and the break is unchanged — every
      // shared layer deep-copied, which is what `setLoops`' identity comparison exists to avoid.
      find: '  const own = { ...base } as Record<MusicLayer, Float32Array>;',
      replace:
        '  const own = {} as Record<MusicLayer, Float32Array>;\n  for (const layer of MUSIC_LAYERS) own[layer] = Float32Array.from(base[layer]);',
    },
  },
  {
    decision: '0133',
    suite: 'tests/sound.test.ts',
    broke: 'a bake that cannot be cancelled, so a place the run has left still arrives',
    guard: 'and a run that leaves the place before its material arrives never hears it',
    edit: {
      path: 'src/app/sound.ts',
      /*
        ⚠️ RE-ANCHORED BY 0157, which put a slice between `stopped` and the end check. The break was
        the walk's own `if (stopped) return;` and `npm run prove` refused the stale anchor rather than
        reporting green, which is the whole of what 0019 is for.

        ⚠️ AND RE-AIMED BY 0331, WHICH READS THE FLAG IN TWO PLACES NOW. The walk checks it before each
        slice and `finish` checks it before handing over, so the two are in SERIES: cutting the walk's
        leaves `finish` refusing, and cutting `finish`'s means the walk never sets `walked` for it to
        refuse. Measured, each one alone reports STILL GREEN — the guard is double-protected, which for
        a hazard this real is reasonable rather than accidental.

        ⚠️ SO THE BREAK IS THE CANCEL ITSELF, WHICH IS WHAT THIS PROBE HAS ALWAYS SAID IT IS: the
        returned function stops setting the flag, both readers go on seeing `false`, and *a bake that
        cannot be cancelled* is exactly the sentence above. Checked: it fires as `a cancelled bake
        still handed its material over`.
      */
      find: '  return () => {\n    stopped = true;\n  };',
      replace: '  return () => {\n    // The caller asked to stop and nothing here is listening.\n  };',
    },
  },
];
