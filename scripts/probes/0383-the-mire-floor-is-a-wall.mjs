// The breaks behind docs/decisions/0383-the-mire-floor-is-a-wall.md.
//
// Asked for: *"it needs to be lower so that the lower row of acid pools sits just off screen. We also
// need to make it a hard ground wall like the labyrinth wall that causes hit damage/death to
// everything but the end boss."* Answered: a rolling shore at world speed; flanks from below rise
// through unbroken acid.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // One pool of the lower row back where it was before the ask: on the screen, with ground under it.
    broke: 'a lower-row pool left at its old height, with the black layer under it',
    guard: 'THE ASK, IN LANE UNITS: the lower row of pools is just off the screen',
    edit: {
      path: 'src/content/pools.ts',
      find: '      { at: 0.66, wide: 0.1, top: 0.753, deep: 0.038 },',
      replace: '      { at: 0.66, wide: 0.1, top: 0.686, deep: 0.038 },',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // The move measured on the surface line, which forgets the lens bulges above it.
    broke: 'the row moved by its surface line alone, so a sliver of the lower row is still on the screen',
    guard: 'THE ASK, IN LANE UNITS: the lower row of pools is just off the screen',
    edit: {
      path: 'src/content/pools.ts',
      find: '      { at: 0.66, wide: 0.1, top: 0.753, deep: 0.038 },',
      replace: '      { at: 0.66, wide: 0.1, top: 0.75, deep: 0.038 },',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // Lower than asked: the lower row sunk, and the upper row with it, so the pools barely show.
    broke: 'every pool sunk a further five lanes, past *just* off the screen',
    guard: 'THE ASK, IN LANE UNITS: the lower row of pools is just off the screen',
    edit: {
      path: 'src/content/pools.ts',
      find:
        '      { at: 0.03, wide: 0.12, top: 0.739, deep: 0.042 },\n' +
        '      { at: 0.17, wide: 0.09, top: 0.755, deep: 0.034 },\n' +
        '      { at: 0.29, wide: 0.15, top: 0.743, deep: 0.05 },\n' +
        '      { at: 0.43, wide: 0.08, top: 0.761, deep: 0.03 },\n' +
        '      { at: 0.53, wide: 0.13, top: 0.737, deep: 0.046 },\n' +
        '      { at: 0.66, wide: 0.1, top: 0.753, deep: 0.038 },\n' +
        '      { at: 0.76, wide: 0.14, top: 0.741, deep: 0.052 },\n' +
        '      { at: 0.9, wide: 0.08, top: 0.757, deep: 0.032 },',
      replace:
        '      { at: 0.03, wide: 0.12, top: 0.76, deep: 0.042 },\n' +
        '      { at: 0.17, wide: 0.09, top: 0.776, deep: 0.034 },\n' +
        '      { at: 0.29, wide: 0.15, top: 0.764, deep: 0.05 },\n' +
        '      { at: 0.43, wide: 0.08, top: 0.782, deep: 0.03 },\n' +
        '      { at: 0.53, wide: 0.13, top: 0.758, deep: 0.046 },\n' +
        '      { at: 0.66, wide: 0.1, top: 0.774, deep: 0.038 },\n' +
        '      { at: 0.76, wide: 0.14, top: 0.762, deep: 0.052 },\n' +
        '      { at: 0.9, wide: 0.08, top: 0.778, deep: 0.032 },',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // A cliff in a rolling shore: a rise no baked cap draws, so the painter clamps it and the picture lies.
    broke: 'a shore that falls four lanes across one tile, where the caps stop at three',
    guard: 'never rises steeper than a cap is baked for',
    edit: {
      path: 'src/content/levels.ts',
      find: '          112, 112, 111, 109, 108, 107, 107, 108, 110, 112,',
      replace: '          112, 112, 111, 107, 108, 107, 107, 108, 110, 112,',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // The floor laid below the box: drawn, and nothing the ship can reach — a picture of a wall.
    broke: 'the shore laid twenty lanes below where it is drawn, so the ship never meets it',
    guard: 'THE SHIP, IN LANE UNITS: flying into the shore costs one hit',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '    out[k * 2 + 1] = shore[k]!;',
      replace: '    out[k * 2 + 1] = shore[k]! + 20;',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // The acid spares everything, not only what rises out of it.
    broke: 'the whole floor sparing every body, as if everything were rising through it',
    guard: 'A BODY THAT MEETS THE SHORE BURSTS',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (side === 0 || surfacing(corridor, e, side)) continue;',
      replace: '    if (side === 0 || side === corridor.rises) continue;',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // 0382's unseen roam as it was: it turns at the lane's edges and walks into a shore inside them.
    broke: 'an unseen roam turning at the lane’s edges alone, so it walks into the shore before it is seen',
    guard: 'A DRIFTER TURNS AT THE SHORE BEFORE IT IS SEEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '            if (w.corridor !== null) {\n              const lands = e.across + e.velAcross;',
      replace: '            if (w.corridor !== null && false) {\n              const lands = e.across + e.velAcross;',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // The Labyrinth's rest used for the floor: the whole box, which moves every wave in the lower half.
    broke: 'the floor at rest over the whole box, so the shore moves waves authored nowhere near it',
    guard: 'THE LEVEL AS IT WAS AUTHORED',
    edit: {
      path: 'src/content/levels.ts',
      find: '      centre: (ACROSS_SPAN * 0.75 + ACROSS_SPAN - PLAYER_MARGIN) / 2,\n      width: ACROSS_SPAN * 0.25 - PLAYER_MARGIN,',
      replace: '      centre: ACROSS_SPAN / 2,\n      width: ACROSS_SPAN - PLAYER_MARGIN * 2,',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // A lane outside the rest extrapolated along the squeeze rather than left where it was written.
    broke: 'a lane above the floor’s reach squeezed as if it were in it',
    guard: 'THE LEVEL AS IT WAS AUTHORED',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '  if (lane < restLow || lane > restLow + restWidth) return lane;\n',
      replace: '',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // Shots break only on the near wall, which the Mire does not have.
    broke: 'shots breaking on the near wall only, so they fly on through the acid',
    guard: 'and a shot ends at the shore',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (stoneAt(corridor, shot.along, shot.across, 0) === 0) continue;',
      replace: '    if (stoneAt(corridor, shot.along, shot.across, 0) !== -1) continue;',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // Nothing rises: a flank from below is dashed on the acid it was meant to come out of.
    broke: 'nothing spared as it rises, so a flank from below dies in the acid',
    guard: 'a flank from below rises through unbroken acid',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return side === corridor.rises && e.steerAcross !== 0 && side * (e.across - e.steerAcross) > 0;',
      replace: '  return false && side === corridor.rises && e.steerAcross !== 0 && side * (e.across - e.steerAcross) > 0;',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // The Labyrinth's answer used for the Mire's floor: an opening, which is shore the ship can dive into.
    broke: 'a passage cut in the shore for a flank from below, a stretch of acid that is only a picture',
    guard: 'a flank from below rises through unbroken acid',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (side === corridor.rises) return;\n',
      replace: '',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // The shore read once and not round: the floor ends 480 units in and the fight has none.
    broke: 'the shore read once and not round, so the floor ends 480 units into the level',
    guard: 'THE PAINTER PUTS THE SHORE WHERE THE MODEL SAYS',
    edit: {
      path: 'src/render/scene.ts',
      find: '  const knots = corridor.period > 0 ? Number.POSITIVE_INFINITY : corridor.faces.length / 2;',
      replace: '  const knots = corridor.faces.length / 2;',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // Each cap stood on the knot where its tile starts rather than between its two.
    broke: 'every cap stood on its first knot, so the drawn shore is half a rise off the one that bites',
    guard: 'THE PAINTER PUTS THE SHORE WHERE THE MODEL SAYS',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const b = corridor.faces[knotOf(corridor, k + 1) * 2 + slot]!;',
      replace: '      const b = corridor.faces[knotOf(corridor, k) * 2 + slot]!;',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // The acid painted with the stone, behind everything: a flanker rising out of it drawn over it.
    broke: 'the acid painted behind the bodies, as stone is, so what is in it is drawn on top of it',
    guard: 'THE ACID IS OVER WHAT IS IN IT AND UNDER WHAT FLIES',
    edit: {
      path: 'src/render/scene.ts',
      find: '  if (corridor !== null && !corridor.front) paintCorridor(surface, view, corridor, cameraAlong);',
      replace: '  if (corridor !== null) paintCorridor(surface, view, corridor, cameraAlong);',
    },
  },
  {
    decision: '0383',
    suite: 'tests/floor.test.ts',
    // The acid painted last, over everything, which is the ship lost behind scenery.
    broke: 'the acid painted after every layer, over the shots and the ship',
    guard: 'THE ACID IS OVER WHAT IS IN IT AND UNDER WHAT FLIES',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0401, which hands the painter the heart after it, and 0459, the beams.
      find: 'w.corridor, POOLS_OF[w.level.theme], w.layers.indexOf(w.enemies), w.heartBeat, heart, ',
      replace: 'w.corridor, POOLS_OF[w.level.theme], w.layers.length - 1, w.heartBeat, heart, ',
    },
  },
];
