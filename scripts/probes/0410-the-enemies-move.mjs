// The breaks behind docs/decisions/0410-the-enemies-move.md.
//
// One per claim in tests/cycles.test.ts: the frame is never advanced, a hit lights the wrong bitmap,
// the level's own spawner forgets to hand a body its cycle, a row says it has one drawing, and three
// drawings that are the same picture — which the first four would all let through.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0410',
    suite: 'tests/cycles.test.ts',
    broke: 'the frame never advanced, so every body is its first drawing carried around',
    guard: 'THE REPORTED ONE',
    edit: {
      path: 'src/sim/entity.ts',
      find: '      const at = Math.floor(e.framePhase / e.frameHold) % cycle;',
      replace: '      const at = 0;',
    },
  },
  {
    decision: '0410',
    suite: 'tests/cycles.test.ts',
    broke: 'a hit drawn in the unlit frame, so an animated body stops flashing',
    guard: 'and a hit lights the frame the body is on',
    edit: {
      path: 'src/sim/entity.ts',
      find: '      e.sprite = lit ? e.framesHit[at]! : e.frames[at]!;',
      replace: '      e.sprite = e.frames[at]!;',
    },
  },
  {
    decision: '0410',
    suite: 'tests/cycles.test.ts',
    broke: 'the wave spawner never hands a body its cycle, which is the WIP this replaced waiting to happen again',
    guard: 'THE REPORTED ONE',
    edit: {
      path: 'src/app/frame.ts',
      find: '    animate(e, row.cycle);\n    if (flanking) {',
      replace: '    if (flanking) {',
    },
  },
  {
    decision: '0410',
    suite: 'tests/cycles.test.ts',
    broke: 'the drifter’s row walking one drawing, so it is a prop that says it has a cycle',
    guard: 'every enemy authors a cycle of more than one drawing',
    edit: {
      path: 'src/content/enemies.ts',
      find: '[SPRITE.drifterC, SPRITE.drifterCHit]], BEAT, 10),',
      replace: '[SPRITE.drifterC, SPRITE.drifterCHit]], [0, 0], 10),',
    },
  },
  {
    decision: '0410',
    suite: 'tests/cycles.test.ts',
    broke: 'the moth’s three drawings all the rest pose, so it cycles through one picture',
    guard: 'in pixels: every enemy’s outline moves',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const MOTH_POSES: readonly Pose[] = [REST, wingsBeat(0.76, 0.08), wingsBeat(1.07, -0.04)];',
      replace: 'const MOTH_POSES: readonly Pose[] = [REST, REST, REST];',
    },
  },
];
