// The breaks behind docs/decisions/0065-the-sky-is-baked-and-blitted.md.
//
// ⚠️ A background is the easiest thing in a game to get wrong invisibly. Three of these leave a screen
// that looks right on the machine it was written on: a tiling offset that draws one extra tile on
// some cameras costs a blit nobody counts and moves a seam once a second; a layer at the world's own
// rate reads as scenery until the player tries to dodge it; and a sky bright enough to be seen is a
// sky full of things that look like pickups.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0065',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE MODULO. `%` in JavaScript keeps the sign of the left operand, and the tiling count is a
      ceiling rather than a round — both are one character, both are invisible at a glance, and both
      turn a fixed cost into one that wobbles with the camera.
    */
    broke: 'the tiling count rounded rather than ceiled, so the widest device is a tile short',
    guard: 'covers the whole view, so no seam of empty space ever crosses the screen',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const count = Math.ceil(view.alongSpan / span) + 1;',
      replace: '    const count = Math.round(view.alongSpan / span) + 1;',
    },
  },
  {
    decision: '0065',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE PLUS ONE, which is the tidiest-looking thing to delete in the whole function. Without the
      tile straddling the trailing edge there is a bar of empty space crossing the screen once per
      tile — and it is exactly the kind of thing that shows up in play and in no test.
    */
    broke: 'the tile straddling the trailing edge dropped, so a bar of empty sky crosses the screen',
    guard: 'covers the whole view, so no seam of empty space ever crosses the screen',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const count = Math.ceil(view.alongSpan / span) + 1;',
      replace: '    const count = Math.ceil(view.alongSpan / span);',
    },
  },
  {
    decision: '0065',
    suite: 'tests/palette.test.ts',
    // The sky brightened until it is as loud as the things the player has to find. It looks better in
    // a screenshot, which is precisely the trap: a starfield at pickup brightness is a screen full of
    // dots that have to be checked.
    broke: 'the sky brightened to where a star reads as something to fly into',
    guard: 'the SKY is the one ink held to the opposite rule',
    edit: { path: 'src/content/palette.ts', find: "    sky: '#2a2c44',", replace: "    sky: '#b9c8ff'," },
  },
  {
    decision: '0065',
    suite: 'tests/palette.test.ts',
    // And the other direction: a sky indistinguishable from the void is no sky at all, and the
    // parallax — which is the whole of what a background is FOR — says nothing.
    broke: 'the sky darkened until it is the void, so there is no parallax to read',
    guard: 'the SKY is the one ink held to the opposite rule',
    edit: { path: 'src/content/palette.ts', find: "    sky: '#2a2c44',", replace: "    sky: '#0c0c15'," },
  },
  {
    decision: '0065',
    suite: 'tests/budget.test.ts',
    // The resolution ceiling put back to a flat pixel count. Every sprite in the game still bakes
    // correctly; the sky, which is four times the size of a boss, bakes at a quarter of the detail and
    // blits at three times its own resolution.
    broke: 'the bake ceiling returned to a flat pixel count, so the sky bakes blurry',
    guard: 'the bake ceiling is a RESOLUTION, so the biggest bitmap is not the blurriest',
    edit: {
      path: 'src/render/bake.ts',
      find: '  return Math.max(8, Math.min(extent * MAX_PIXELS_PER_UNIT, Math.ceil(extent * pixelsPerUnit)));',
      replace: '  void MAX_PIXELS_PER_UNIT;\n  return Math.max(8, Math.min(256, Math.ceil(extent * pixelsPerUnit)));',
    },
  },
];
