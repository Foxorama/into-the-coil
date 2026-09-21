// The breaks behind docs/decisions/0346-the-pillars-fill-the-sky.md.
//
// Played: *"the pillars could be more prominent, they only take up part of the screen and level."*
// Each half of that sentence is a number on a level's row, and each can be quietly put back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0346',
    suite: 'tests/pillars.test.ts',
    broke: 'the organ’s stand back at its bitmap’s own size, which cannot span a lane it is smaller than',
    guard: 'THE REPORTED ONE, IN LANE UNITS: the stand that arrives with the organ is taller than the lane',
    edit: {
      path: 'src/content/levels.ts',
      find: 'beat: 0, variant: 0, scale: 1.7 },',
      replace: 'beat: 0, variant: 0, scale: 1 },',
    },
  },
  {
    decision: '0346',
    suite: 'tests/pillars.test.ts',
    broke: 'the opening stand pushed back past the first section, so the level starts without them again',
    guard: 'AND THE LEVEL: every casting stands somewhere in it',
    edit: {
      path: 'src/content/levels.ts',
      find: '      { at: -1400, lane: 66,',
      replace: '      { at: 900, lane: 66,',
    },
  },
  {
    decision: '0346',
    suite: 'tests/pillars.test.ts',
    // Re-pointed by 0347, which gave the volcano a scale of its own asking: the guard is the frame's
    // fallback now, so the break is the fallback — every unscaled landmark drawn bigger.
    broke: 'an entry that states no scale drawn bigger anyway, which is one place’s ask in every sky',
    guard: '0282 — a landmark that states no scale is drawn at its own size',
    edit: {
      path: 'src/app/frame.ts',
      find: '    scale: entry.scale ?? 1,',
      replace: '    scale: entry.scale ?? 1.4,',
    },
  },
  {
    decision: '0346',
    suite: 'tests/pillars.test.ts',
    // The first draft, exactly: a crown centred near the tip of a column a twentieth of a tile tall of
    // the top edge, cut off flat, and a ruled line across the sky once it is drawn at 1.7×.
    broke: 'a column’s crown let run past the top of its bitmap, where it is clipped to a straight line',
    guard: 'THE ONE THE PHOTOGRAPH FOUND: no light in the Pillars is cut off by the edge of their own bitmap',
    edit: {
      path: 'src/render/bake.ts',
      find: '    const reachOf = Math.min(wanted, crownY, crownX, size - crownX);',
      replace: '    const reachOf = wanted;',
    },
  },
];
