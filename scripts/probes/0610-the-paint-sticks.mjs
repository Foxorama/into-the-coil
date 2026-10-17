// The breaks behind docs/decisions/0610-the-paint-sticks.md.
//
// One per guard tests/duck.test.ts adds for the paint that stays and the spray that opens, each the defect put back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // The paint is laid on the boss and then left where it landed while the boss flies on.
    broke: 'paint left behind by the boss it landed on',
    guard: 'a splat on a boss is on the boss, in the ball’s colour, and rides it as it moves',
    edit: {
      path: 'src/app/frame.ts',
      find: '    ridePaint(mark, body);\n  }\n}\n\n/** Let go of every splat riding',
      replace: '  }\n}\n\n/** Let go of every splat riding',
    },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // 0595's splat: it holds station in the world wherever it lands, a boss or not.
    broke: 'a splat on a boss stuck to nothing',
    guard: 'a splat on a boss is on the boss, in the ball’s colour, and rides it as it moves',
    edit: { path: 'src/app/frame.ts', find: '  if (best < 0) return;\n', replace: '  if (best < 1000) return;\n' },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    broke: 'paint that keeps its place on the lane as the boss under it turns',
    guard: 'and turns with a boss that turns',
    edit: { path: 'src/app/frame.ts', find: '  const turnAt = body.turn;\n', replace: '  const turnAt = mark.onTurn;\n' },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // The paint in the bottom layer, where 0595's splat was as a blast: under the boss it is on.
    broke: 'the paint drawn under the boss it is on',
    guard: 'is drawn over the boss it is on and under every hostile shot',
    edit: {
      path: 'src/render/scene.ts',
      find: '    if (layer === jetsBefore && paint !== null) paintPaint(',
      replace: '    if (layer === 0 && paint !== null) paintPaint(',
    },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // 0595's two thirds of a second.
    broke: 'the paint gone in two thirds of a second',
    guard: 'stays whole for over a second, fades, and is gone between two and three seconds after it lands',
    edit: { path: 'src/app/frame.ts', find: 'export const SPLAT_STEPS = 150;', replace: 'export const SPLAT_STEPS = 40;' },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    broke: 'the paint vanishing whole rather than fading',
    guard: 'stays whole for over a second, fades, and is gone between two and three seconds after it lands',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const fade = e.lifeFor >= PAINT_FADE_STEPS ? 1 : e.lifeFor / PAINT_FADE_STEPS;',
      replace: '    const fade = 1;',
    },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // A ball breaks on the stone with a spark, as every shot does, and leaves nothing.
    broke: 'a ball that reaches the stone leaves nothing on it',
    guard: 'a ball that reaches the stone splats on it, and the paint stays on the stone as the wall goes by',
    edit: { path: 'src/app/frame.ts', find: '  paintStone(w, corridor);\n', replace: '' },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // The blast where the ball's centre is, inside the stone, where 0349 says it sees nothing.
    broke: 'a splat on the stone going off inside it',
    guard: 'a ball that reaches the stone splats on it, and the paint stays on the stone as the wall goes by',
    edit: {
      path: 'src/app/frame.ts',
      find: '    splatAt(w, ball.along, face - into * 0.5, colour);',
      replace: '    splatAt(w, ball.along, ball.across, colour);',
    },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // The splat's blast standing as long as its paint: a string fills the pool a bomb needs.
    broke: 'a splat standing in the blast pool for its whole life',
    guard: 'a string of paint leaves the blast pool to the bombs, and never fills its own',
    edit: {
      path: 'src/app/frame.ts',
      find: '  // It lands this step, and `stepEntities` lets it go at the start of the next.\n  blast.lifeFor = 1;',
      replace: '  // It lands this step, and `stepEntities` lets it go at the start of the next.\n  blast.lifeFor = SPLAT_STEPS;',
    },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    broke: 'the paint outliving the ship that threw it',
    guard: 'a life lost takes the paint with the ship that threw it, and a boss gone takes what was on it',
    edit: { path: 'src/app/frame.ts', find: '  w.paint.clear();\n', replace: '' },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // The edges churning outward as freely as the strands inside them.
    broke: 'the spray drawn wider than it lands',
    guard: 'is painted as a spray as wide as it lands, opening from the nozzle to its tip, with its drops and mist, at its stated cost',
    edit: {
      path: 'src/render/scene.ts',
      find: '(edge ? -share * Math.abs(churn) : churn)',
      replace: '(edge ? share * Math.abs(churn) : churn)',
    },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // 0595's picture: a column of light.
    broke: 'the spray stroked as a laser',
    guard: 'is painted as a spray as wide as it lands, opening from the nozzle to its tip, with its drops and mist, at its stated cost',
    edit: {
      path: 'src/render/scene.ts',
      find: 'root * BEAM_STROKE * view.scale, held, BOLT_WATER, BOLT_SPRAY);',
      replace: 'root * BEAM_STROKE * view.scale, held, BOLT_WATER, BOLT_BEAM);',
    },
  },
  {
    decision: '0610',
    suite: 'tests/duck.test.ts',
    // 0595's column: the same width from the nozzle to the tip, though the picture opens.
    broke: 'a spray that opens in the picture and lands as a column',
    guard: 'lands as wide as it is drawn, out to the edge of its spray near the tip',
    edit: {
      path: 'src/app/frame.ts',
      find: '  let destroyed = tetherInto(w.enemies, rootAlong, rootAcross, endAlong, endAcross, jet.width, jet.damage, 1, IMPACT_FLASH_STEPS, w.deaths, w.hits, jet.landGap, null, w.corridor, jet.tipWidth);',
      replace: '  let destroyed = tetherInto(w.enemies, rootAlong, rootAcross, endAlong, endAcross, jet.width, jet.damage, 1, IMPACT_FLASH_STEPS, w.deaths, w.hits, jet.landGap, null, w.corridor);',
    },
  },
];
