// The breaks behind docs/decisions/0389-the-hydra-catches-fire.md.
//
// Asked for: *"all the heads need to get their flaming aura when the last head emerges and the aura
// needs to travel down the neck and merge into a combined aura that covers the whole body and tail as
// well."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0389',
    suite: 'tests/hydra.test.ts',
    // The blaze never catching: the clockwork burns, as 0384 left it, and nothing else ever does.
    broke: 'no head but the clockwork ever burning, so the fire the ask describes never starts',
    guard: 'THE ASK, IN WORLD UNITS: once the last head has risen every head burns',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (blaze === undefined || lit < 0) return false;',
      replace: '  if (blaze === undefined || lit < 0 || lit >= 0) return false;',
    },
  },
  {
    decision: '0389',
    suite: 'tests/hydra.test.ts',
    // Every flame on a neck lit the step the blaze does: an aura switched on, not one that travels.
    broke: 'every neck alight at once, so the fire does not travel down them',
    guard: 'IT TRAVELS, IN SECONDS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return lit >= (blaze.travel * (1 - share)) / (1 - NECK_FLAMES[0]);',
      replace: '  return lit >= 0 * share;',
    },
  },
  {
    decision: '0389',
    suite: 'tests/hydra.test.ts',
    // The body never lit: heads and necks burning over a body that does not.
    broke: 'the body and the tail never catching, so the fire does not merge over the animal',
    guard: 'THE ASK, IN WORLD UNITS: once the last head has risen every head burns',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return blaze.travel + (i + 1) * blaze.gap;',
      replace: '  return Number.POSITIVE_INFINITY + i * blaze.gap;',
    },
  },
  {
    decision: '0389',
    suite: 'tests/hydra.test.ts',
    // The body lit with the heads: a fire that starts everywhere rather than coming down to it.
    broke: 'the body catching with the heads, before the fire has come down the necks',
    guard: 'IT TRAVELS, IN SECONDS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return blaze.travel + (i + 1) * blaze.gap;',
      replace: '  return (i + 1) * blaze.gap;',
    },
  },
];
