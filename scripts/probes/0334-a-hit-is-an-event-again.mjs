// A hit is an event again — docs/decisions/0334-a-hit-is-an-event-again.md
//
// Every guard 0334 adds, broken on purpose. `node scripts/prove-guard.mjs 0334`.

export const PROBES = [
  {
    decision: '0334',
    suite: 'tests/combat.test.ts',
    // The gap never armed: every landing re-arms the twin, which is 0278's duty restored.
    broke: 'the refractory gap never armed, so every landing re-arms the wash and the body is white for the whole fight',
    guard: 'A HIT IS AN EVENT AGAIN',
    edit: {
      path: 'src/sim/collide.ts',
      find: '  target.flashGap = flashSteps * (1 + FLASH_GAP_DUTY);',
      replace: '  target.flashGap = 0;',
    },
  },
  {
    decision: '0334',
    suite: 'tests/combat.test.ts',
    // The gap never consulted: it is armed and then ignored, which is the same picture.
    broke: 'the gap armed and never consulted, so a landing inside it re-arms the wash anyway',
    guard: 'A HIT IS AN EVENT AGAIN',
    edit: {
      path: 'src/sim/collide.ts',
      find: '  if (target.flashGap > 0) return;',
      replace: '  if (target.flashGap < 0) return;',
    },
  },
  {
    decision: '0334',
    suite: 'tests/combat.test.ts',
    // The gap never counted down, so a body flashes exactly once in its life and never again.
    broke: 'the gap never counted down, so a body flashes once and is never seen to be hit again',
    guard: 'A HIT IS AN EVENT AGAIN',
    edit: {
      path: 'src/sim/entity.ts',
      find: '    if (e.flashGap > 0) e.flashGap--;',
      replace: '    if (e.flashGap < 0) e.flashGap--;',
    },
  },
  {
    decision: '0334',
    suite: 'tests/combat.test.ts',
    // The gap bought by making a single hit quieter, which is the thing 0278 refused.
    broke: 'the duty bought by shortening the flash itself, so one hit on its own is quieter than it was',
    guard: 'a single hit still flashes for its whole window',
    edit: {
      path: 'src/sim/collide.ts',
      find: '  target.flashFor = flashSteps;\n  target.flashGap = flashSteps * (1 + FLASH_GAP_DUTY);',
      replace: '  target.flashFor = 1;\n  target.flashGap = flashSteps * (1 + FLASH_GAP_DUTY);',
    },
  },
];
