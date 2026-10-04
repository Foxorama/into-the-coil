// The shields wear the ship — docs/decisions/0492-the-shields-wear-the-ship.md
//
// Every guard 0492 adds, broken on purpose. `node scripts/prove-guard.mjs 0492`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0492',
    suite: 'tests/shields.test.ts',
    // The saucer's fore plate the fighter's honeycomb: one shell worn by two ships, the thing 0492 ends.
    broke: 'the saucer’s fore plate drawn from the fighter’s sprites',
    guard: 'THE OWN SHELL: every ship flies in its own plates, and no two ships share one',
    edit: {
      path: 'src/content/ships.ts',
      find: '        [SPRITE.shieldBubble0a, SPRITE.shieldBubble0b, SPRITE.shieldBubble0c],',
      replace: '        [SPRITE.shield0a, SPRITE.shield0b, SPRITE.shield0c],',
    },
  },
  {
    decision: '0492',
    suite: 'tests/shields.test.ts',
    // The bubble drawn about the tile's centre: four plates that curve round four different points.
    broke: 'the saucer’s bubble drawn round the plate’s own centre rather than the ship’s',
    guard: 'THE OWN SHELL, DRAWN: every look curves round the ship at the shell’s orbit, and no two looks are one picture',
    edit: {
      path: 'src/render/bake.ts',
      find: '          drawBubblePlate(ctx, at, plate.shimmer, palette);',
      replace:
        '          drawBubblePlate(ctx, { ...at, cx: at.cx + Math.cos(at.angle) * at.radius, cy: at.cy + Math.sin(at.angle) * at.radius }, plate.shimmer, palette);',
    },
  },
  {
    decision: '0492',
    suite: 'tests/shields.test.ts',
    // The estate in the Firebird's feathers: a look that is the same for two rows, 0282's tell.
    broke: 'the estate’s lattice drawn as the Firebird’s plumes',
    guard: 'THE OWN SHELL, DRAWN: every look curves round the ship at the shell’s orbit, and no two looks are one picture',
    edit: {
      path: 'src/render/bake.ts',
      find: '          drawLatticePlate(ctx, at, plate.shimmer, palette);',
      replace: '          drawPlumePlate(ctx, at, plate.shimmer, palette);',
    },
  },
];
