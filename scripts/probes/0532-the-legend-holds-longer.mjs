// The breaks behind docs/decisions/0532-the-legend-holds-longer.md.
//
// ⚠️ Every one of these is a fight that still ends. A boss put down at the wrong health is a fight a
// few seconds shorter or longer, which a play reads as tuning rather than as a defect — so what is
// broken is each link from the tier's row to the hull, and the baseline under every fixture.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0532',
    suite: 'tests/difficulty.test.ts',
    broke: 'the spawn reading the tier’s toughness alone, so the row’s boss numbers never reach a fight',
    guard: 'puts each fight’s boss down at what its tier’s row says for THAT fight',
    edit: {
      path: 'src/app/frame.ts',
      find: "  boss.health = bossToughnessFor(w.bossRow.health, w.difficulty, w.fight === 0 ? 'mid' : 'end');",
      replace: '  boss.health = toughnessFor(w.bossRow.health, w.difficulty);',
    },
  },
  {
    decision: '0532',
    suite: 'tests/difficulty.test.ts',
    broke: 'the two fights swapped, so the mid-boss holds what the end boss was asked to',
    guard: 'puts each fight’s boss down at what its tier’s row says for THAT fight',
    edit: {
      path: 'src/app/frame.ts',
      find: "w.difficulty, w.fight === 0 ? 'mid' : 'end');",
      replace: "w.difficulty, w.fight === 0 ? 'end' : 'mid');",
    },
  },
  {
    decision: '0532',
    suite: 'tests/difficulty.test.ts',
    // The helper, not the frame: a guard that compared the frame against this function would stay green.
    broke: 'the boss helper dropping the row’s number, so every tier’s bosses hold what toughness says',
    guard: 'puts each fight’s boss down at what its tier’s row says for THAT fight',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  return Math.max(1, Math.ceil(base * tier.toughness * tier.bossToughness[fight]));',
      replace: '  return Math.max(1, Math.ceil(base * tier.toughness));',
    },
  },
  {
    decision: '0532',
    suite: 'tests/difficulty.test.ts',
    // The first ask's number: Legend's mid-bosses at twice the content, over Savior's 1.8 — the
    // ordering the player asked to keep, inverted.
    broke: 'Legend’s mid-bosses holding more than Savior’s',
    guard: 'and never makes something take fewer, whatever the tiers turn out to be',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    bossToughness: { mid: 1.5, end: 1.15 },',
      replace: '    bossToughness: { mid: 2, end: 1.15 },',
    },
  },
  {
    decision: '0532',
    suite: 'tests/tier-shell.test.ts',
    // Every fixture that names no tier stands on this row, so its bosses would hold more than the
    // content under every guard in the suite.
    broke: 'the baseline given Legend’s boss numbers, so the content’s bosses are stated nowhere',
    guard: 'THE BASELINE',
    edit: {
      path: 'src/content/difficulty.ts',
      find: "  // The content's bosses at the content's health — 0532 is a tier's, never the baseline's.\n  bossToughness: AS_TOUGH,",
      replace: "  // The content's bosses at the content's health — 0532 is a tier's, never the baseline's.\n  bossToughness: { mid: 2, end: 1.15 },",
    },
  },
];
