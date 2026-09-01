// The break behind docs/decisions/0204-a-landmark-is-lit-by-the-place-it-stands-in.md.
//
// ⚠️ THIS IS THE DEFECT THAT ACTUALLY SHIPPED, PUT BACK. 0203 baked the landmark once with the atlas
// and never re-coloured it, so Ember Nebula's Pillars stood in a #5c2a4a plum wearing the palette's
// generic #2a2c44 blue-grey and read as cold rock. Every guard in the repository was green over it,
// and one screenshot was not — which is why the drawing itself is deliberately NOT guarded and only
// the pairing is.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0204',
    suite: 'tests/sky.test.ts',
    // Deleting the line looks like removing a redundant second bake right next to the first one.
    // Nothing about the call site says the landmark would go grey everywhere without it.
    broke: 'the landmark left un-recoloured at the boundary, so it wears the palette and not the place',
    guard: 'the landmark is re-baked at the boundary wherever the weather is',
    edit: {
      path: 'src/app/mount.ts',
      find: '    bakeLandmark(atlas, clouds, colours.space, view.scale * dpr, place);',
      replace: '',
    },
  },
];
