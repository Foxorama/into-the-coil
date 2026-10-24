// The breaks behind docs/decisions/0653-the-clock-is-the-balls.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0653',
    suite: 'tests/score.test.ts',
    // 0647 as it shipped: a hit taken ends no ship's streak.
    broke: 'a hit taken that ends no ship’s streak',
    guard: '0647, 0653 — a shield taking a hit is a hit for the rank',
    edit: {
      path: 'src/app/frame.ts',
      find: "        if (w.shipRow.streak === 'unhit') w.score.streak = 0;",
      replace: '',
    },
  },
  {
    decision: '0653',
    suite: 'tests/score.test.ts',
    // The quiet clock on every ship, so the caddie's streak falls between waves again.
    broke: 'the quiet clock running on every ship',
    guard: '0653 — an unhit ship’s streak has no clock',
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (w.shipRow.streak !== 'kept') return;\n",
      replace: '',
    },
  },
  {
    decision: '0653',
    suite: 'tests/score.test.ts',
    // The ball's row losing its rule: it would sit at ×1 again.
    broke: 'the ball’s streak ended by a hit',
    guard: '0653 — THE ASK: the Hamster Ball keeps its streak',
    edit: {
      path: 'src/content/ships.ts',
      find: "    streak: 'kept',",
      replace: "    streak: 'unhit',",
    },
  },
];
