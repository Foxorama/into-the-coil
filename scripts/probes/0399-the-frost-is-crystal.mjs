// The frost is crystal — docs/decisions/0399-the-frost-is-crystal.md
//
// Every guard 0399 adds, broken on purpose. `node scripts/prove-guard.mjs 0399`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The crystal back at 0264's size.
    broke: 'the frost ship drawn at its old 33 units',
    guard: 'THE ASKED-FOR ONE, LARGE',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  boss12: 54,',
      replace: '  boss12: 33,',
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The drawing grown and the hurtbox left where it was: a bigger ship that is easier to miss.
    broke: 'the hurtbox left at 13 under a drawing grown to 54',
    guard: 'THE ASKED-FOR ONE, LARGE',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    // 21 since 0399, from 13: the same share of a drawing grown from 33 to 54.\n    radius: 21,',
      replace: '    // 21 since 0399, from 13: the same share of a drawing grown from 33 to 54.\n    radius: 13,',
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The reported one: the cold slows and nothing is drawn.
    broke: 'the cold never laid, so it slows and is not seen',
    guard: 'THE ASKED-FOR ONE, SEEN WHERE IT IS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (chill !== null && w.bossAura.size === want) layChill(w, head, chill);',
      replace: '',
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The field swelled to the cold's old thirty while the cold reaches thirty-eight.
    broke: 'the field drawn at thirty units while the cold reaches the row’s radius',
    guard: 'THE ASKED-FOR ONE, SEEN WHERE IT IS',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0459: the field is laid at the step's radius, which pulses.
      find: '    slot.swell = (2 * w.chillRadius) / SPRITE_EXTENT[SPRITE_KINDS[layer.sprite]!];',
      replace: '    slot.swell = (2 * 30) / SPRITE_EXTENT[SPRITE_KINDS[layer.sprite]!];',
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The haze painted short of its tile's edge: the rim is drawn where the slow is not.
    broke: 'the haze’s rim painted a fifth inside the edge of the cold',
    guard: 'THE ASKED-FOR ONE, SEEN WHERE IT IS',
    edit: {
      path: 'src/render/bake.ts',
      find: "  const edge = c;\n  const rng = makeRng('aura').stream('chill/haze');",
      replace: "  const edge = c * 0.8;\n  const rng = makeRng('aura').stream('chill/haze');",
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The flakes laid down solid: a death field's opacity on an effect field.
    broke: 'the cold’s marks laid down at 0.9',
    guard: 'THE ASKED-FOR ONE, HEAVILY TRANSPARENT',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const CHILL_OPACITY = 0.45;',
      replace: 'const CHILL_OPACITY = 0.9;',
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The flakes in the frost bullet's own saturated ink.
    broke: 'the cold painted in the frost bullet’s own ink',
    guard: 'THE ASKED-FOR ONE, HEAVILY TRANSPARENT',
    edit: {
      path: 'src/render/bake.ts',
      find: 'function frostWhite(palette: Palette, by: number): string {\n  return shade(palette.frost, by);',
      replace: 'function frostWhite(palette: Palette, by: number): string {\n  return by > 2 ? shade(palette.frost, by) : palette.frost;',
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // A handful of flakes where it was asked to be full of them.
    broke: 'the outer ring thinned to six flakes',
    guard: 'THE ASKED-FOR ONE, HEAVILY TRANSPARENT',
    edit: {
      path: 'src/render/bake.ts',
      find: '  { from: 0.72, to: 0.96, count: 26 },',
      replace: '  { from: 0.72, to: 0.96, count: 6 },',
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The inner ring at the ring outside it's rate: two rings turning as one disc. Quick enough to
    // clear the speed floor, so what goes red is the ordering — at the outer ring's rate the floor
    // fired first and the ordering was never seen to.
    broke: 'the inner ring turned at the middle ring’s rate',
    guard: 'THE ASKED-FOR ONE, TWIRLING',
    edit: {
      path: 'src/content/bosses.ts',
      find: '        { sprite: SPRITE.chillFlakes2, spin: -0.016 },',
      replace: '        { sprite: SPRITE.chillFlakes2, spin: -0.009 },',
    },
  },
  {
    decision: '0399',
    suite: 'tests/frost.test.ts',
    // The frame laying every layer unturned, whatever the row says.
    broke: 'the field laid unturned, so nothing twirls',
    guard: 'THE ASKED-FOR ONE, TWIRLING',
    edit: {
      path: 'src/app/frame.ts',
      find: '    slot.turn = foldTurn((w.steps * layer.spin) % TAU);',
      replace: '    slot.turn = 0;',
    },
  },
];
