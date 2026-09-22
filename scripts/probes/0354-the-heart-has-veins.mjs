// The breaks behind docs/decisions/0354-the-heart-has-veins.md.
//
// Asked for: *"Needs veins pulsing throughout the level and a beautiful starry backdrop."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0354',
    suite: 'tests/heart.test.ts',
    // The gas-lit marks dropped from the floor's reading: a sky measured as though it had no vessels.
    broke: 'the vessels left out of the floor’s reading, so the contrast guard measures a sky without them',
    guard: 'and the floor sees the vessels',
    edit: {
      path: 'src/render/bake.ts',
      find: "  const marks = STRUCTURE_OF[theme](size).filter((mark) => mark.lit && (mark.gas === true) === (which === 'gas'));",
      replace: "  const marks = STRUCTURE_OF[theme](size).filter((mark) => mark.lit && mark.gas !== true);",
    },
  },
  {
    decision: '0354',
    suite: 'tests/heart.test.ts',
    // The pulse drawn three units off the vessel it runs along.
    broke: 'beads blitted beside their vessels, so the light runs through empty sky',
    guard: 'every bead of the pulse lies on one of the vessels',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const across = view.acrossSpan / 2 + (trunkAt(trunk, x) - 0.5) * span;',
      replace: '      const across = view.acrossSpan / 2 + (trunkAt(trunk, x) - 0.5) * span + 3;',
    },
  },
  {
    decision: '0354',
    suite: 'tests/heart.test.ts',
    // The baker's vessels moved off the table: two sets of veins only written alike.
    broke: 'the vessels baked a little off the table, so the pulse runs beside what is drawn',
    guard: 'the vessels the weather is baked with are those same vessels',
    edit: {
      path: 'src/render/bake.ts',
      find: '      for (let s = 0; s <= SAMPLES; s += 1) points.push([(s / SAMPLES) * size, trunkAt(trunk, s / SAMPLES) * size]);',
      replace: '      for (let s = 0; s <= SAMPLES; s += 1) points.push([(s / SAMPLES) * size, (trunkAt(trunk, s / SAMPLES) + 0.01) * size]);',
    },
  },
  {
    decision: '0354',
    suite: 'tests/heart.test.ts',
    // The travel taken off the clock: every bead swells where it stands.
    broke: 'the pulse not travelling, so each bead throbs in one place',
    guard: 'the camera stops and the heart does not',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const travelled = time / period + k / beads + streakHash(i * 5.7 + 0.5);',
      replace: '      const travelled = 0 * time / period + k / beads + streakHash(i * 5.7 + 0.5);',
    },
  },
  {
    decision: '0354',
    suite: 'tests/heart.test.ts',
    // No beat: light running down a vein at one size, which is a conveyor and not a pulse.
    broke: 'the beads left at one size, so the veins carry light and do not pulse',
    guard: 'the camera stops and the heart does not',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const swell = 1 - PULSE_SWELL + PULSE_SWELL * Math.min(1, beatAt(phase - Math.floor(phase)));',
      replace: '      const swell = 1;\n      void phase;',
    },
  },
  {
    decision: '0354',
    suite: 'tests/heart.test.ts',
    // A fatter head, which is what a bead grows into the first time it is hard to see.
    broke: 'a bead’s head grown to a shot’s size, in a sky full of red light',
    guard: 'a bead\'s head is under the smallest shot',
    edit: {
      path: 'src/content/sprites.ts',
      find: 'export const BEAD_HEAD = 0.28;',
      replace: 'export const BEAD_HEAD = 0.5;',
    },
  },
  {
    decision: '0354',
    suite: 'tests/heart.test.ts',
    // Every place in space given the heart's veins: one row made the rule for all.
    broke: 'every place in space given the heart’s veins, so The Approach pulses',
    guard: 'and only a place that states veins pulses',
    edit: {
      path: 'src/app/mount.ts',
      find: '  const veins = VEINS_OF[place];',
      replace: '  const veins = VEINS_OF.core;\n  void place;',
    },
  },
];
