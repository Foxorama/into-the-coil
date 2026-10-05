// The breaks behind docs/decisions/0522-the-score-pays-in-shards.md.
//
// ⚠️ The ask is careful about one thing — the BEST credit, not the credits — so the breaks that matter
// are a run paid for every credit, a run paid twice, a balance the next visit forgets, a run's end that
// does not say what it paid, and a hangar that does not show what is held.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0522',
    suite: 'tests/star-shards.test.ts',
    broke: 'a run paid for its credits added up, so every Freeplay continue pays',
    guard: 'in a continue run, the highest credit',
    edit: {
      path: 'src/app/score.ts',
      find: '  if (score > ledger.best) ledger.best = score;',
      replace: '  ledger.best += score;',
    },
  },
  {
    decision: '0522',
    suite: 'tests/star-shards.test.ts',
    broke: 'a run paid again by a second way out of it',
    guard: 'once: a second way out of the same run pays nothing',
    edit: {
      path: 'src/app/score.ts',
      find: '  if (ledger.paid) return 0;\n',
      replace: '',
    },
  },
  {
    decision: '0522',
    suite: 'tests/star-shards.test.ts',
    broke: 'the balance left out of what the key writes',
    guard: 'is kept between visits, beside the wins',
    edit: {
      path: 'src/save/hangar.ts',
      find: '  return JSON.stringify({ v: HANGAR_VERSION, won, plate, shards, owned, hung });',
      replace: '  return JSON.stringify({ v: HANGAR_VERSION, won, plate, owned, hung });',
    },
  },
  {
    decision: '0522',
    suite: 'tests/credits.test.ts',
    broke: 'the game over adding the run up without saying what it paid',
    guard: 'adds up every cleared level and the one being flown',
    edit: {
      path: 'src/app/score.ts',
      find: "  lines.push({ label: 'High score', value: placeLabel(place), tone: 'plain' });\n  lines.push(shardLine(shards));\n  return lines;\n}\n\n/** Where a run landed, in words. */",
      replace: "  lines.push({ label: 'High score', value: placeLabel(place), tone: 'plain' });\n  return lines;\n}\n\n/** Where a run landed, in words. */",
    },
  },
  {
    decision: '0522',
    suite: 'tests/star-shards.browser.test.ts',
    broke: 'the hangar never told the balance',
    guard: 'the game over says what the run paid, the key holds it, and the hangar shows the balance',
    edit: {
      path: 'src/app/mount.ts',
      find: "    chrome.setSheet('hangar', balance);\n",
      replace: '',
    },
  },
];
