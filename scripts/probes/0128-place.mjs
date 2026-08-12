// The breaks behind docs/decisions/0128-a-place-plays-its-own-material.md.
//
// ⚠️ THE EXPENSIVE FAILURE HERE IS NOT A WRONG NOTE, IT IS A SHARED LAYER QUIETLY STOPPING BEING
// SHARED. Every figure in reports/what-seven-compositions-would-cost-2026-08-12.md rests on a place
// paying only for what it changes; a theme that re-bakes a layer it did not claim sounds absolutely
// correct and costs a composition. Nothing but identity can see it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0128',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ SHARING TURNED INTO COPYING. Spreading the array is what a reader writes without thinking —
      it is immutable either way and every note is the same — and it is the whole cost model gone:
      `setLoops` compares by identity, so every layer of every place would build a fresh AudioBuffer
      and seven places would be resident at 672 MB rather than at one composition plus its diffs.
    */
    broke: 'a shared layer copied instead of shared, so every place pays for a whole composition',
    guard: 'A PLACE THAT STATES NOTHING IS THE BASE COMPOSITION, and `voicesOf` hands back the same array',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return THEMES[theme].voices?.[layer] ?? MUSIC[layer];',
      replace: '  return THEMES[theme].voices?.[layer] ?? [...MUSIC[layer]];',
    },
  },
  {
    decision: '0128',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE OVERRIDE IGNORED ENTIRELY, which is the state the project was in before this decision and
      therefore the easiest thing to regress to. Every theme still has its mix, its backdrop and its
      aura, so six of the seven places still differ — the level selector still does something, and
      only the material is gone.
    */
    broke: 'a place stopped playing its own voices, so every level is one composition again',
    guard: 'AND WHAT IT STATES ACTUALLY SOUNDS DIFFERENT, while everything else is untouched',
    edit: {
      path: 'src/app/music.ts',
      find: '  for (const voice of voicesOf(theme, layer)) {',
      replace: '  for (const voice of voicesOf(undefined, layer)) {',
    },
  },
  {
    decision: '0128',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ A PATTERN THAT DOES NOT SPAN ITS LAYER. docs/decisions/0095 holds this over the base
      composition and an override is a second place to make the same mistake by hand — the tail is
      silently dropped and the loop has a hole in it at the same instant every time round, which is
      the seam 0090's guard exists for arriving from the content side.
    */
    broke: 'a re-voiced pattern that is shorter than the layer it plays in',
    guard: '0095 STILL HOLDS OVER AN OVERRIDE: every pattern spans EXACTLY its own layer',
    edit: {
      path: 'src/content/nebula.ts',
      find: '  -2, _, 2, _,\n  0, _, _, _,\n];',
      replace: '];',
    },
  },
  {
    decision: '0128',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ A NOTE OUTSIDE THE KEY, WHICH IS THE ONE THAT MATTERS FOR THE NEXT SIX PLACES. This theme
      re-voices its tune and shares the progression under it, so a note off the scale is wrong against
      a bed nobody edited. A flattened second is the exact mistake — it sounds deliberate, it is a
      real mode, and it is not the mode the chords are in.
    */
    broke: 'a re-voiced tune left the key the shared progression is in',
    guard: 'A RE-VOICED TUNE STAYS IN THE KEY, because the progression under it is still shared',
    edit: {
      path: 'src/content/nebula.ts',
      find: 'const DESCANT: readonly number[] = [12, 14,',
      replace: 'const DESCANT: readonly number[] = [13, 14,',
    },
  },
  {
    decision: '0128',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ A LAYER REMOVED BY STATING NOTHING FOR IT. An empty array reads as "this place does not play
      the engine" and is not what it does: the ladder still raises a gain on it, so the layer is open
      and silent. Closing a layer is `RUNG_CLOSES`' job (docs/decisions/0120) and it belongs to the
      ladder, where the guard that every rung opens something can see it.
    */
    broke: 'a place removed a layer by stating an empty voice array instead of closing it in the ladder',
    guard: 'AND AN OVERRIDE MAY NOT SILENCE A LAYER THE LADDER OPENS',
    edit: {
      path: 'src/content/nebula.ts',
      find: '  call: [\n    {\n      steps: HYMN,',
      replace: '  call: [],\n  ride: [\n    {\n      steps: HYMN,',
    },
  },
];
