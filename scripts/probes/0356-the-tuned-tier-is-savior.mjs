// The breaks behind docs/decisions/0356-the-tuned-tier-is-savior.md.
//
// ⚠️ NO PROBE FOR *a seventh axis with no margin*, and the plan asked for one. `MARGIN`, `HARDER` and
// `multipliersFor` are typed over `keyof Multipliers`, so that break fails `tsc` — and this harness runs
// vitest, which strips types without checking them. A probe here would apply, run a green suite, and
// report STILL GREEN over a guard that is real and lives in `npm run check`. The decision says so.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0356',
    suite: 'tests/difficulty.test.ts',
    // THE REJIG THE ASK FORBIDS: an outer tier given its own literal with no pin, so the next change to
    // Savior leaves it behind and nobody is told.
    broke: 'Burn given a literal toughness that no pin states, so Savior no longer carries it',
    guard: 'on every axis not pinned, each tier is the one before it moved by one margin',
    edit: {
      path: 'src/content/difficulty.ts',
      find: "    ...multipliersFor('burn'),\n",
      replace: "    ...multipliersFor('burn'),\n    toughness: 2.2,\n",
    },
  },
  {
    decision: '0356',
    suite: 'tests/difficulty.test.ts',
    // Derived from the first tier rather than from the tuned one, so Savior is a margin off its own row.
    broke: 'the tiers derived from Legend rather than from Savior',
    guard: 'the tuned tier is exactly SAVIOR',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  const steps = DIFFICULTY_KINDS.indexOf(kind) - DIFFICULTY_KINDS.indexOf(TUNED);',
      replace: '  const steps = DIFFICULTY_KINDS.indexOf(kind);',
    },
  },
  {
    decision: '0356',
    suite: 'tests/difficulty.test.ts',
    // The measured pin dropped on the floor: Burn's crowd back at the derivation's 1.32.
    broke: 'a pin ignored by the derivation',
    guard: 'and every pin is what the row says',
    edit: {
      path: 'src/content/difficulty.ts',
      find: "    crowd: pin.crowd ?? derivedFor(kind, 'crowd'),",
      replace: "    crowd: derivedFor(kind, 'crowd'),",
    },
  },
  {
    decision: '0356',
    suite: 'tests/difficulty.test.ts',
    // A margin of one: the outer tiers are Savior on that axis, and three buttons are one on it.
    broke: 'a margin of one, so an axis stops separating the tiers',
    guard: 'every margin moves its axis, the harder way',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  toughness: 1.6,\n  fireGap: 1.4,',
      replace: '  toughness: 1,\n  fireGap: 1.4,',
    },
  },
];
