// The laser fans out — docs/decisions/0453-the-laser-fans-out.md
//
// *"For the lazer attacks, I wanted them jagged, but also having wider peaks and lows so that they spread
// out more"* — one beam central and deep, two that never touch their middle, three and five as fans.
// Every guard 0453 adds, broken on purpose. `node scripts/prove-guard.mjs 0453`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0453',
    suite: 'tests/quetzal.test.ts',
    // The lone beam back on the old twelve knots: a leg every eleven units, a fringe on a straight line.
    broke: 'the throat’s beam on twelve knots, so its peaks are packed as close as they were',
    guard: 'the peaks spread out longer',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'const QUETZAL_ONE: BeamJag = { knots: 5, paths: [{ lean: 0, outward: 30, inward: 30 }] };',
      replace: 'const QUETZAL_ONE: BeamJag = { knots: 12, paths: [{ lean: 0, outward: 30, inward: 30 }] };',
    },
  },
  {
    decision: '0453',
    suite: 'tests/quetzal.test.ts',
    // The lone beam back on the old eighteen a side: thirty-six units of lane at the very most.
    broke: 'the throat’s beam swinging its old eighteen, so the lone beam sweeps no wider than it did',
    guard: 'one beam is central, and its zigzag sweeps a third of the lane',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'const QUETZAL_ONE: BeamJag = { knots: 5, paths: [{ lean: 0, outward: 30, inward: 30 }] };',
      replace: 'const QUETZAL_ONE: BeamJag = { knots: 5, paths: [{ lean: 0, outward: 18, inward: 18 }] };',
    },
  },
  {
    decision: '0453',
    suite: 'tests/quetzal.test.ts',
    // The lone beam leaning: a fan of one, which is not central.
    broke: 'the throat’s beam leaning off to one side, so the lone beam is not central',
    guard: 'one beam is central, and its zigzag sweeps a third of the lane',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'const QUETZAL_ONE: BeamJag = { knots: 5, paths: [{ lean: 0, outward: 30, inward: 30 }] };',
      replace: 'const QUETZAL_ONE: BeamJag = { knots: 5, paths: [{ lean: 20, outward: 30, inward: 30 }] };',
    },
  },
  {
    decision: '0453',
    suite: 'tests/quetzal.test.ts',
    // The left shoulder swinging in as deep as the pair's middle: the centre the ask kept clear is burned.
    broke: 'the left shoulder’s beam swinging fourteen inward, so the two beams burn the line between them',
    guard: 'two beams never touch the line between them',
    edit: {
      path: 'src/content/bosses.ts',
      find: '  knots: 6,\n  paths: [\n    { lean: 0, outward: 24, inward: 6 },\n    { lean: 0, outward: 24, inward: 6 },',
      replace: '  knots: 6,\n  paths: [\n    { lean: 0, outward: 24, inward: 14 },\n    { lean: 0, outward: 24, inward: 6 },',
    },
  },
  {
    decision: '0453',
    suite: 'tests/quetzal.test.ts',
    // The pair's outsides as shallow as their insides: the middle kept clear, the screen not covered.
    broke: 'the pair swinging as far outside as in, so their outsides cover no more screen than before',
    guard: 'and reach further outside than in',
    edit: {
      path: 'src/content/bosses.ts',
      find: '  knots: 6,\n  paths: [\n    { lean: 0, outward: 24, inward: 6 },\n    { lean: 0, outward: 24, inward: 6 },',
      replace: '  knots: 6,\n  paths: [\n    { lean: 0, outward: 6, inward: 6 },\n    { lean: 0, outward: 6, inward: 6 },',
    },
  },
  {
    decision: '0453',
    suite: 'tests/quetzal.test.ts',
    // The shoulders straight down the lane: three parallel zigzags, not a fan.
    broke: 'the brace’s shoulder beams with no lean, so three beams run parallel and do not fan',
    guard: 'three beams are a fan',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    { lean: 30, outward: 24, inward: 6 },\n    { lean: 0, outward: 7, inward: 7 },\n    { lean: 30, outward: 24, inward: 6 },',
      replace: '    { lean: 0, outward: 24, inward: 6 },\n    { lean: 0, outward: 7, inward: 7 },\n    { lean: 0, outward: 24, inward: 6 },',
    },
  },
  {
    decision: '0453',
    suite: 'tests/quetzal.test.ts',
    // Every root's outside taken as larger across: the left half of a fan leans into the right.
    broke: 'every beam’s outside taken as the larger-across side, so the left of a fan leans inward',
    guard: 'three beams are a fan',
    edit: {
      path: 'src/app/boss.ts',
      find: '          const out = place[1] < 0 ? -1 : 1;',
      replace: '          const out = place[1] < 0 ? 1 : 1;',
    },
  },
  {
    decision: '0453',
    suite: 'tests/quetzal.test.ts',
    // The painter leaving the lean out: a fan that burns, drawn as parallel zigzags — warning and beam alike.
    broke: 'the lean left out of the picture, so the fan the player dodges is not the fan that burns',
    guard: 'THE PICTURE: the fan is drawn where it burns',
    edit: {
      path: 'src/render/scene.ts',
      find: '        const across = endAcross + beamShift(e, i);',
      replace: '        const across = endAcross + beamShift(e, i) - e.lean * (1 - beamT(e.spin, e.knots, i));',
    },
  },
  {
    decision: '0453',
    suite: 'tests/medusa.test.ts',
    // The last knot's whole swing over a leg as short as nothing: the beam leaves its tip sideways, and pinches.
    broke: 'the last knot swinging its whole swing over however short its leg is, so neighbouring lasers pinch at the tips',
    guard: 'between every two neighbouring lasers there is room for a ship',
    edit: {
      path: 'src/sim/jag.ts',
      find: '  if (k !== knots) return swing;',
      replace: '  if (k !== knots || k === knots) return swing;',
    },
  },
  {
    decision: '0453',
    suite: 'tests/medusa.test.ts',
    // The outer pair leaning no further than the inner: a fan whose outside is not wider.
    broke: 'the jellyfish’s outer lasers leaning as little as its inner, so the fan does not widen to its outside',
    guard: 'five lasers are a fan',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    { lean: 32, outward: 22, inward: 4 },\n    { lean: 14, outward: 12, inward: 5 },\n    { lean: 0, outward: 7, inward: 7 },\n    { lean: 14, outward: 12, inward: 5 },\n    { lean: 32, outward: 22, inward: 4 },',
      replace: '    { lean: 14, outward: 22, inward: 4 },\n    { lean: 14, outward: 12, inward: 5 },\n    { lean: 0, outward: 7, inward: 7 },\n    { lean: 14, outward: 12, inward: 5 },\n    { lean: 14, outward: 22, inward: 4 },',
    },
  },
  {
    decision: '0453',
    suite: 'tests/medusa.test.ts',
    // The outer pair swinging no deeper outside than the inner: the "deeper penetration" the ask named, gone.
    broke: 'the jellyfish’s outer lasers swinging no deeper outside than its inner',
    guard: 'five lasers are a fan',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    { lean: 32, outward: 22, inward: 4 },\n    { lean: 14, outward: 12, inward: 5 },\n    { lean: 0, outward: 7, inward: 7 },\n    { lean: 14, outward: 12, inward: 5 },\n    { lean: 32, outward: 22, inward: 4 },',
      replace: '    { lean: 32, outward: 12, inward: 4 },\n    { lean: 14, outward: 12, inward: 5 },\n    { lean: 0, outward: 7, inward: 7 },\n    { lean: 14, outward: 12, inward: 5 },\n    { lean: 32, outward: 12, inward: 4 },',
    },
  },
  {
    decision: '0453',
    suite: 'tests/medusa.test.ts',
    // The jellyfish back on twelve knots: short legs again.
    broke: 'the jellyfish’s fan on twelve knots, so its peaks are packed as close as they were',
    guard: 'five lasers are a fan',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'const MEDUSA_FAN: BeamJag = {\n  knots: 5,',
      replace: 'const MEDUSA_FAN: BeamJag = {\n  knots: 12,',
    },
  },
];
