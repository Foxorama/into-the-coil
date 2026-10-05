// The breaks behind docs/decisions/0535-the-mire-runs-teal.md.
//
// Asked for: *"make the toxic pools more toxic - they need to be larger and more interlinked and need
// more teal colouring and blending"*, and *"the ground level is just a bit high."* No guard is new: the
// teal is held by the two floors 0347 and 0352 already keep, and these show both see it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0535',
    suite: 'tests/jungle.test.ts',
    // The teal taken bright, as the predecessor's toxic water is: an ink lost over the acid.
    broke: 'the acid stated as a bright teal, so the inks are lost over the pools',
    guard: 'THE FLOOR: every colour a planet’s land is lit in',
    edit: {
      path: 'src/content/themes.ts',
      find: "      vivid: { far: '#2b3c12', canopy: '#1c3a10', lit: '#0c5c16', acid: '#07585a' },",
      replace: "      vivid: { far: '#2b3c12', canopy: '#1c3a10', lit: '#0c5c16', acid: '#0aa7a0' },",
    },
  },
  {
    decision: '0535',
    suite: 'tests/mire.test.ts',
    // The blend rounded to the nearest, which lifts high-contrast's green-into-teal a shade over the floor.
    broke: 'the blends rounded to the nearest, so a green running into teal is lighter than either',
    guard: 'THE FLOOR UNDER THE ACID',
    edit: {
      path: 'src/render/bake.ts',
      find: '  return `#${a.map((v, i) => Math.floor(v + (b[i]! - v) * by + 1e-9).toString(16).padStart(2, \'0\')).join(\'\')}`;',
      replace: '  return `#${a.map((v, i) => Math.round(v + (b[i]! - v) * by).toString(16).padStart(2, \'0\')).join(\'\')}`;',
    },
  },
];
