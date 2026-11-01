// The breaks behind docs/decisions/0705-the-review-is-answered.md.
//
// The fighter's warheads laid where the review found its tubes — showing, not out from under the wing — and
// the ray's rings leaned back to the quarter that ran them together into a band.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0705',
    suite: 'tests/the-review-is-answered.test.ts',
    broke: 'the warhead laid forward, its point ahead of the wing but its base ahead of the wing too — a rocket beside the hull, not out from under the wing',
    guard: 'THE ASK: each warhead’s point stands out ahead of the wing’s leading edge, and its base lies under the wing',
    edit: {
      path: 'src/content/ships.ts',
      find: "const FIGHTER_TUBES: ShipRow['tubes'] = [[], [{ along: -0.05, across: -1.5 }], [{ along: -0.05, across: -1.5 }, { along: -0.05, across: 1.5 }]];",
      replace: "const FIGHTER_TUBES: ShipRow['tubes'] = [[], [{ along: 0.8, across: -1.5 }], [{ along: 0.8, across: -1.5 }, { along: 0.8, across: 1.5 }]];",
    },
  },
  {
    decision: '0705',
    suite: 'tests/the-review-is-answered.test.ts',
    broke: 'the warheads on the hull at the wing roots, inboard of the wing, where there is no wing to be under',
    guard: 'THE ASK: each warhead’s point stands out ahead of the wing’s leading edge, and its base lies under the wing',
    edit: {
      path: 'src/content/ships.ts',
      find: "const FIGHTER_TUBES: ShipRow['tubes'] = [[], [{ along: -0.05, across: -1.5 }], [{ along: -0.05, across: -1.5 }, { along: -0.05, across: 1.5 }]];",
      replace: "const FIGHTER_TUBES: ShipRow['tubes'] = [[], [{ along: -0.05, across: -0.6 }], [{ along: -0.05, across: -0.6 }, { along: -0.05, across: 0.6 }]];",
    },
  },
  {
    decision: '0705',
    suite: 'tests/the-review-is-answered.test.ts',
    broke: 'the rings a quarter as wide as they are tall again, as 0588 leaned them, so the biggest two touch',
    guard: 'THE ASK: between each ring and the next is at least two pixels of sky at 1280×720',
    edit: {
      path: 'src/render/bake.ts',
      find: 'export const RAY_RING_LEAN = 1 / 6;',
      replace: 'export const RAY_RING_LEAN = 1 / 4;',
    },
  },
  {
    decision: '0705',
    suite: 'tests/mounts.test.ts',
    broke: 'the ring of light drawn as a wide lens rather than a ring — the saucer shape 0587 asked for, back as light',
    // The ring is translucent, so the side guard (which reads solid marks) stays green and the one-node guard, which reads
    // every mark from above, is the one that catches it.
    guard: 'AND THE SAME NODE FROM ABOVE: the fight’s gun is as round, and its ring of light reaches as far',
    edit: {
      path: 'src/render/bake.ts',
      find: '  glow(ctx, f, lav, cx, cy, R * 1.55, 0.3);\n  band(ctx, f, shade(lav, 0.25), cx, cy, R * 1.35, R * 1.12, 0.8);',
      replace: '  glow(ctx, f, lav, cx, cy, R * 1.55, 0.3);\n  band(ctx, f, shade(lav, 0.25), cx, cy, R * 1.35, R * 1.12, 0.8);\n  poly(ctx, f, shade(lav, 0.25), [[cx - R * 2.2, cy], [cx + R * 2.2, cy], [cx + R * 2.2, cy + R * 0.2], [cx - R * 2.2, cy + R * 0.2]], 0.8);',
    },
  },
  {
    decision: '0705',
    suite: 'tests/mounts.test.ts',
    broke: 'the ball itself drawn as a wide lens — the saucer shape 0587 asked for, back as the solid node',
    guard: 'THE ASK: from the side, the node sits on the rim at the nose, no higher than its own radius, and it is round',
    edit: {
      path: 'src/render/bake.ts',
      find: 'shade(ball, 0.55), shade(ball, -0.5), roundel(cx, cy, R, 28, 0, Math.PI * 2));',
      replace: 'shade(ball, 0.55), shade(ball, -0.5), roundel(cx, cy, R, 28, 0, Math.PI * 2).map(([a, b]): Pt => [cx + (a - cx) * 2.2, b]));',
    },
  },
  {
    decision: '0705',
    suite: 'tests/mounts.test.ts',
    broke: 'the side view drawing a smaller node than the fight’s, two guns rather than one',
    guard: 'AND THE SAME NODE FROM ABOVE: the fight’s gun is as round, and its ring of light reaches as far',
    edit: {
      path: 'src/render/bake.ts',
      find: '  side: { x: 0.68, y: 0, r: 0.15 },',
      replace: '  side: { x: 0.68, y: 0, r: 0.1 },',
    },
  },
];
