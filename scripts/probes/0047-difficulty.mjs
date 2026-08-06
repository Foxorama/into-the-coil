// The breaks behind docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md.
//
// ⚠️ The theme of every one of these is a game that still plays. A tier that never reaches the field
// gives three buttons that all start the same run; a boss that reads its phase against the wrong
// total opens in its hardest phase, which is a completely plausible picture of a difficult fight.
// None of it looks like a bug from the outside, which is what makes the guards worth having.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0047',
    suite: 'tests/difficulty.test.ts',
    // ⚠️ THE ONE THAT WOULD SHIP. Every tier resolves, every table is right, and the three buttons
    // are indistinguishable — because nothing reads the row where a body is put on the field.
    broke: 'the tier never reached the spawn, so all three buttons started the same run',
    guard: 'spawns tougher, faster bodies that throw faster shots on a harder tier',
    edit: {
      path: 'src/app/frame.ts',
      find: '    e.health = toughnessFor(row.health, w.difficulty);',
      replace: '    e.health = row.health;',
    },
  },
  {
    decision: '0047',
    suite: 'tests/difficulty.test.ts',
    // A phase is a fraction of REMAINING health, so a boss scaled by a tier and measured against its
    // row sits below every threshold from the first frame — and fights its last phase throughout.
    broke: 'a boss read its phase against its row rather than against what the tier gave it',
    guard: 'reads its phase against what it actually started with',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const fraction = health / (full > 0 ? full : row.health);',
      replace: '  const fraction = health / row.health;',
    },
  },
  {
    decision: '0047',
    suite: 'tests/difficulty.test.ts',
    // Rounding down. The commonest enemy in the game is unchanged on every tier, and the rarest is
    // twice as tough — a difficulty curve that is mostly not one.
    broke: 'toughness rounded down, so a one-health body is unchanged on every tier',
    guard: 'never makes something take fewer shots on a harder tier',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  return Math.max(1, Math.ceil(base * tier.toughness));',
      replace: '  return Math.max(1, Math.floor(base * tier.toughness));',
    },
  },
  {
    decision: '0047',
    suite: 'tests/difficulty.test.ts',
    // The easiest tier stops being the content. Every play-test report and every number in
    // src/content/levels.ts is then read against a baseline nothing states.
    broke: 'the easiest tier given a multiplier, so the authored content is no tier at all',
    guard: 'multiplies nothing at all',
    edit: {
      path: 'src/content/difficulty.ts',
      find: "    title: 'Legendary Pilot',\n    hint: 'The gentlest way in',\n    lives: 5,\n    toughness: 1,",
      replace: "    title: 'Legendary Pilot',\n    hint: 'The gentlest way in',\n    lives: 5,\n    toughness: 0.9,",
    },
  },
  {
    decision: '0047',
    suite: 'tests/difficulty.test.ts',
    // The tiers out of order on the one screen where order carries the meaning. "Let the Galaxy Burn"
    // is the most attractive of the three names and the hardest of the three tiers.
    broke: 'the title screen listing the tiers in the wrong order',
    guard: 'offers every tier, in the table order, easiest first',
    edit: {
      path: 'src/state/screens.ts',
      find: '    actions: DIFFICULTY_KINDS.map((kind) => ({ label: DIFFICULTIES[kind].title, hint: DIFFICULTIES[kind].hint })),',
      replace:
        '    actions: DIFFICULTY_KINDS.map((kind) => ({ label: DIFFICULTIES[kind].title, hint: DIFFICULTIES[kind].hint })).reverse(),',
    },
  },
  {
    decision: '0047',
    suite: 'tests/difficulty.test.ts',
    // A run that forgets its tier halfway through. The save would store the default, and a resumed
    // run would be a different run — which is the one thing the save is not allowed to be.
    broke: 'a level boundary dropping the run’s tier',
    guard: 'travels with a run and survives everything that happens during one',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        upgrades: state.upgrades,\n        difficulty: state.difficulty,\n      };\n    case \'levelCleared\':',
      replace: "        upgrades: state.upgrades,\n        difficulty: 'legendary',\n      };\n    case 'levelCleared':",
    },
  },
];
