// The breaks behind docs/decisions/0206-the-tile-wraps-round.md.
//
// ⚠️ THE DEFECT THIS PUTS BACK WAS REPORTED THREE TIMES AND FOUND BY NEITHER A GUARD NOR A PLAYER —
// it took standing still on level two in the bench and looking at the sky on purpose. Every contents
// guard was green over it throughout, because a seam is a property of the tile's EDGES and every
// existing measurement is about its contents.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0206',
    suite: 'tests/sky.test.ts',
    // Unwrapping reads as removing a loop that draws the same thing nine times — and eight of the
    // nine ARE skipped for most clouds, so a reviewer counting draws would agree with the edit.
    broke: 'the wrap removed, so a cloud crossing the tile edge is cut off on a straight line',
    guard: 'a cloud that crosses the tile’s edge is drawn on both sides of it',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ Re-anchored by 0207, which gave the dust lanes a wrap loop of their own — so the `dx` line
      // alone stopped being unique. The `dy` line below it belongs to the CLOUD loop and nothing else.
      find: '    for (const dx of [-size, 0, size]) {\n      for (const dy of [-size, 0, size]) {',
      replace: '    for (const dx of [0]) {\n      for (const dy of [-size, 0, size]) {',
    },
  },
];
