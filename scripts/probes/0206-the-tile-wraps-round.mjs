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
      find: '    for (const dx of [-size, 0, size]) {',
      replace: '    for (const dx of [0]) {',
    },
  },
];
