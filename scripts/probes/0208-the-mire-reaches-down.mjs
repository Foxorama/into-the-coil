// The breaks behind docs/decisions/0208-the-mire-reaches-down.md.
//
// ⚠️ THERE ARE NOW TWO SEAM RULES AND A STRUCTURE MUST TAKE THE RIGHT ONE. 0206 wraps a cloud at
// ±size, which is enough because a disc carries its shape with it. 0207 additionally forces a dust
// lane to arrive where it left, because a lane crosses the whole tile. A frond takes the first and
// not the second — and that is only true while it stays local, which is what these break.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0208',
    suite: 'tests/sky.test.ts',
    // A sway constant is the most innocuous number in the file. Widening it reads as "make the weed
    // wavier" and quietly turns a local object into a tile-crossing one wearing a local one's wrap.
    broke: 'the sway widened until a frond crosses the tile, so it needs 0207’s rule and is not getting it',
    guard: 'a frond is LOCAL',
    edit: {
      path: 'src/render/bake.ts',
      find: '      sway += rng.range(-0.05, 0.05) * size;',
      replace: '      sway += rng.range(-0.5, 0.5) * size;',
    },
  },
  {
    decision: '0208',
    suite: 'tests/sky.test.ts',
    // ⚠️ THE ONE THE WHOLE ARC IS ABOUT. Handing one place's structure to every place is exactly
    // 0196's failure — "numerically different, visually the same" — and it is a one-word edit that
    // makes the sky look busier everywhere, which is how it would be argued for.
    broke: 'The Toxic Mire’s growth handed to every place, which is 0196’s failure spelled differently',
    guard: 'a place’s structure is its own',
    edit: {
      path: 'src/render/bake.ts',
      find: "  if (theme !== 'mire') return []; // Authored per place — 0203's rule, one place at a time.",
      replace: '  // Authored per place — 0203’s rule, one place at a time.',
    },
  },
];
