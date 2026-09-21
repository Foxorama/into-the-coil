// The breaks behind docs/decisions/0350-the-corridor-turns.md.
//
// Played: *"the straight corridor to the boss is not a labyrinth, it's a boring corridor."* Answered on
// the plan: *"do all 3 but per difficulty, saviour is 44, burn is 34, legend is 56."* Four of these
// breaks are what this decision's own flights found, put back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // The clamp taken off: a shape that swings far enough lays a face outside the box.
    broke: 'the faces laid without the box’s clamp, so a turn stands stone where the ship can never reach',
    guard: 'THE BOX IS THE LIMIT, IN LANE UNITS',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '    out[k * 2] = Math.max(low, near);',
      replace: '    out[k * 2] = near - 4;',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // The tier's slope as a target rather than a ceiling: the shape's own steepness goes through.
    broke: 'the tier’s slope not applied to the near wall, so it turns as steeply as the shape asks',
    guard: 'THE PLAYER’S NUMBERS, PER TIER',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '      near = lastNear + Math.max(-step, Math.min(step, near - lastNear));',
      replace: '',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // One tier's numbers for every tier — the corridor the plan said not to build.
    broke: 'every tier laid with legendary’s corridor, so burn never pinches to thirty-four',
    guard: 'THE PLAYER’S NUMBERS, PER TIER',
    edit: {
      path: 'src/app/frame.ts',
      find: '  layFaces(faces, extent, row.centre, row.width, row.shape, tier.corridor.narrowest, tier.corridor.slope);',
      replace: '  layFaces(faces, extent, row.centre, row.width, row.shape, 56, 0.25);',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // A cap stood on its tile's first knot rather than between its two: the drawn face is half a rise out.
    broke: 'a cap stood on its first knot, so the drawn face is half a rise from the model’s',
    guard: 'AND THE PAINTER PUTS THE STONE WHERE THE MODEL SAYS',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const middle = (a + b) / 2;',
      replace: '      const middle = a;',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // The first flight of the turning corridor, exactly: waves spawned where the corridor was.
    broke: 'bodies not carried with the corridor as it bends, so a wave flies straight into the turn',
    guard: 'A TURN IS NOT A MASSACRE',
    edit: {
      path: 'src/app/frame.ts',
      find: '    rideCorridor(w, w.enemies);',
      replace: '',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // The weave as it was: the row's swing, whatever the corridor's width.
    broke: 'a weave that keeps the box’s swing in a pinch, so it runs into the stone either side',
    guard: 'A TURN IS NOT A MASSACRE',
    edit: {
      path: 'src/app/frame.ts',
      find: ' * e.velAlong * squeezeAt(w.corridor, e.along, e.radius);',
      replace: ' * e.velAlong;',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // 0348's passage, exactly: the camera's travel, forwards, whatever the body does.
    broke: 'a flanker’s passage laid forward by the camera’s travel, so a closing charger leaves it backwards',
    guard: 'A TURN IS NOT A MASSACRE',
    edit: {
      path: 'src/app/frame.ts',
      find: '    openPassage(w, along + Math.min(a, b), along + Math.max(a, b), row.radius, side, w.scrollPerStep - row.closing * w.difficulty.closing);',
      replace: '    openPassage(w, along + Math.min(a, b), along + Math.max(a, b), row.radius, side, w.scrollPerStep);',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // The column read at its head, which is the draft this decision flew first.
    broke: 'every member of a wave put down against the corridor at the head’s along, so a column arrives smeared across it',
    guard: 'A COLUMN ARRIVES AS A COLUMN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const target = inCorridor(w, along + stream, wave.lane + formation.acrossOffset(i, wave.count, gap), row.radius);',
      replace: '    const target = inCorridor(w, along, wave.lane + formation.acrossOffset(i, wave.count, gap), row.radius);',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // The band read at the hull's middle: on a slope the face beside its nose is further in.
    broke: 'the hull’s band read at its centre alone, so a body carried against a sloped face is killed by the face beside its nose',
    guard: 'AND WHERE A BODY IS CARRIED IS WHERE THE STONE SAYS IT IS CLEAR',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '    face = side < 0 ? Math.max(face, at) : Math.min(face, at);',
      replace: '    void at;',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // A wave's lane read against the box rather than the corridor it arrives in.
    broke: 'a wave put down at its authored lane, so in a narrowing it arrives half in the stone',
    guard: 'A TURN IS NOT A MASSACRE',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const target = inCorridor(w, along + stream, wave.lane + formation.acrossOffset(i, wave.count, gap), row.radius);',
      replace: '    const target = wave.lane + formation.acrossOffset(i, wave.count, gap);',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // The stone's tiles read as one stretch — the first `stoneAt`, which a sower beside a passage beat.
    broke: 'a body beside a passage counted clear of the whole stretch, so it is drawn over the tile before it',
    guard: 'THE REPORTED RISK, IN PIXELS',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '    const at = Math.max(a, Math.min(b, along));',
      replace: '    const at = along;\n    if (opened(corridor.passages, along - radius, along + radius, -1) || opened(corridor.passages, along - radius, along + radius, 1)) return 0;',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // Only the box's edges turn a pickup, which is what it had before the corridor turned.
    broke: 'pickups left to float into the masonry, on the screen and out of reach',
    guard: 'THE REPORTED RISK, IN PIXELS',
    edit: {
      path: 'src/app/frame.ts',
      find: '    stoneHoldsPickups(w);',
      replace: '',
    },
  },
  {
    decision: '0350',
    suite: 'tests/corridor.test.ts',
    // The wall attack's skip as it was: off the box only.
    broke: 'a wall of shots laid past the face, so its slots are born in the stone and spark there',
    guard: 'A WALL OF SHOTS IS AS WIDE AS THE CORRIDOR',
    edit: {
      path: 'src/app/frame.ts',
      find: '            if (across < 0 || across > ACROSS_SPAN || stoneAt(w.corridor, e.along, across, 0) !== 0) continue;',
      replace: '            if (across < 0 || across > ACROSS_SPAN) continue;',
    },
  },
];
