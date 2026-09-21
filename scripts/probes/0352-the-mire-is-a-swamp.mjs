// The breaks behind docs/decisions/0352-the-mire-is-a-swamp.md.
//
// Asked for: *"Overgrowth ceiling needs to be raised and to be an actual ceiling, the background needs to
// be swampy trees and murk and the ground needs to be vibrant glowing acid pools spitting bubbles."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0352',
    suite: 'tests/places.test.ts',
    // The roof put back where it was reported from.
    broke: 'the canopy back at the line that was reported as not being a ceiling',
    guard: 'The Toxic Mire’s canopy is a ceiling',
    edit: {
      path: 'src/render/bake.ts',
      find: "  const canopy = skyline(size, 'mire/canopy', 0.3, 0.06, 28, 'down');",
      replace: "  const canopy = skyline(size, 'mire/canopy', 0.4, 0.06, 28, 'down');",
    },
  },
  {
    decision: '0352',
    suite: 'tests/mire.test.ts',
    // *"Vibrant glowing"* taken at its word: the pools filled in the place's glow.
    broke: 'the pools filled in the glow itself, a bright field under the fight that no stated colour holds',
    guard: 'THE FLOOR UNDER THE ACID',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const surface = light?.lit ?? mix(land, glow, 0.36);',
      replace: '  const surface = glow;\n  void light;',
    },
  },
  {
    decision: '0352',
    suite: 'tests/jungle.test.ts',
    // The same, stated: the acid's colour as the glow.
    broke: 'the acid stated as the glow, so the inks are lost over the pools',
    guard: 'THE FLOOR: every colour a planet’s land is lit in',
    edit: {
      path: 'src/content/themes.ts',
      find: "      vivid: { far: '#2b3c12', canopy: '#1c3a10', lit: '#0c5c16' },",
      replace: "      vivid: { far: '#2b3c12', canopy: '#1c3a10', lit: '#4ad85a' },",
    },
  },
  {
    decision: '0352',
    suite: 'tests/mire.test.ts',
    // No swamp behind the fight: the far layer left out.
    broke: 'the swamp behind the fight left out, so the murk has no trees in it',
    guard: 'THE FLOOR UNDER THE ACID',
    edit: {
      path: 'src/render/bake.ts',
      find: '  mire: (ctx, land, sky, glow, size, light) => drawSwamp(ctx, land, sky, glow, size, light),',
      replace: '  mire: null,',
    },
  },
];
