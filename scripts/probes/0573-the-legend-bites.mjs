// The breaks behind docs/decisions/0573-the-legend-bites.md.
//
// ⚠️ Every one of these still plays. A tail never applied is a fight a few seconds shorter, a ball
// thrown straight is the serpent as it was, and a ball that grows is 0322's ball — each reads as a
// tuning choice in a play, so each is broken here and watched to redden.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0573',
    suite: 'tests/difficulty.test.ts',
    broke: 'the tier’s tail never read, so a boss’s last stages hold what its bar says on every tier',
    guard: 'a tier’s tail holds its share of the bar longer at the END',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const tail = tier.bossTail[fight];',
      replace: '  const tail = 0 * tier.bossTail[fight];',
    },
  },
  {
    decision: '0573',
    suite: 'tests/difficulty.test.ts',
    // The scale from the first hit: the whole fight longer, which is the reading the player did not choose.
    broke: 'the tail’s scale on every phase, so the opening is held as long as the end',
    guard: 'a tier’s tail holds its share of the bar longer at the END',
    edit: {
      path: 'src/app/boss.ts',
      find: '  if (tail <= 0 || phase.upTo > TAIL_FROM) return open;',
      replace: '  if (tail <= 0) return open;',
    },
  },
  {
    decision: '0573',
    suite: 'tests/serpent.test.ts',
    // Every ball of a throw aimed at the mouth's own height: straight down the lane, two as one wall.
    broke: 'both balls of a throw thrown at the mouth’s height, so they burst on top of each other',
    guard: 'and each ball of a throw bursts at a height of its own',
    edit: {
      path: 'src/app/boss.ts',
      find: '        const height = lo + b * (band + ACROSS_SPAN * LOB_GAP) + lobRng.range(0, band);',
      replace: '        const height = muzzleAcross + 0 * lobRng.range(0, band);',
    },
  },
  {
    decision: '0573',
    suite: 'tests/serpent.test.ts',
    // The middle of each band: apart, inside the lane, and the same two heights every throw.
    broke: 'each ball aimed at the middle of its band, so every throw bursts at the same two heights',
    guard: 'and each ball of a throw bursts at a height of its own',
    edit: {
      path: 'src/app/boss.ts',
      find: '        const height = lo + b * (band + ACROSS_SPAN * LOB_GAP) + lobRng.range(0, band);',
      replace: '        const height = lo + b * (band + ACROSS_SPAN * LOB_GAP) + band / 2;',
    },
  },
  {
    decision: '0573',
    suite: 'tests/serpent.test.ts',
    // 0322's swell, which grew the ball as it ate — the opposite of the ask.
    broke: 'the ball growing as it is shot, so the biggest ball is the one with the smallest burst in it',
    guard: 'and it EATS the player’s fire and shrinks',
    edit: {
      path: 'src/content/shots.ts',
      find: '    swallows: { swell: 1 / 3 },',
      replace: '    swallows: { swell: 1.5 },',
    },
  },
];
