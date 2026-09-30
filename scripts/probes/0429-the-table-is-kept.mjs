// The breaks behind docs/decisions/0429-the-table-is-kept.md.
//
// ⚠️ The table is the first thing the game keeps, so the breaks that matter are the ones that ship a
// wrong table to a player: one that grows without end, one that trusts a row it cannot read, one that
// reads another version's shape as its own, one that throws when the browser refuses a write, a tie
// given to the newcomer, and a title measured without the table on it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0429',
    suite: 'tests/scores.test.ts',
    broke: 'a table that keeps every run and never rolls the lowest off',
    guard: 'THE ASK: it rolls',
    edit: {
      path: 'src/save/scores.ts',
      find: '  const next = [...table, entry].sort(better).slice(0, TABLE_SIZE);',
      replace: '  const next = [...table, entry].sort(better);',
    },
  },
  {
    decision: '0429',
    suite: 'tests/scores.test.ts',
    broke: 'a row that names a golfer the game does not have, trusted and drawn on the title',
    guard: 'a table it cannot trust is an empty table',
    edit: {
      path: 'src/save/scores.ts',
      find: '  if (pilot === undefined || difficulty === undefined) return null;',
      replace: '  if (difficulty === undefined) return null;',
    },
  },
  {
    decision: '0429',
    suite: 'tests/scores.test.ts',
    broke: 'another version’s table read as this one’s shape',
    guard: 'a table it cannot trust is an empty table',
    edit: {
      path: 'src/save/scores.ts',
      find: '  if (doc.v !== SCORES_VERSION || !Array.isArray(doc.entries)) return [];',
      replace: '  if (!Array.isArray(doc.entries)) return [];',
    },
  },
  {
    decision: '0429',
    suite: 'tests/scores.test.ts',
    // A private window refuses the write, and the victory screen throws on the way up.
    broke: 'a store that refuses the write taking the screen down with it',
    guard: 'a store that refuses the write keeps what it had',
    edit: {
      path: 'src/save/scores.ts',
      find: '    try {\n      store.setItem(SCORES_KEY, serialiseScores(placed.table));\n    } catch {',
      replace: '    store.setItem(SCORES_KEY, serialiseScores(placed.table));\n    try {\n    } catch {',
    },
  },
  {
    decision: '0429',
    suite: 'tests/scores.test.ts',
    broke: 'a tie given to the run that got there second',
    guard: 'a tie goes to the run that got there first',
    edit: {
      path: 'src/save/scores.ts',
      find: '  return b.score - a.score || a.when - b.when;',
      replace: '  return b.score - a.score || b.when - a.when;',
    },
  },
  {
    decision: '0429',
    suite: 'tests/layout.browser.test.ts',
    /*
      ⚠️ THE TABLE BACK IN THE FLOW — the obvious placement, and the one the smallest landscape phone
      has no room for: eleven rows added under the key, 128 pixels past a 480x320 display.
    */
    broke: 'the table laid out in the flow under the key rather than rolling in the key’s box',
    guard: 'needs no scrolling on any of them',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-title-board {\n  display: none;\n  position: absolute;\n  inset: 0;',
      replace: '.itc-title-board {\n  display: none;\n  position: relative;\n  inset: 0;',
    },
  },
];
