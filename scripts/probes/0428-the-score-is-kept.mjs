// The breaks behind docs/decisions/0428-the-score-is-kept.md.
//
// ⚠️ Every way the score goes wrong is a tidy-looking edit: a multiplier dropped, a hit that only
// counts when it kills, a boss run through the streak, a level boundary that breaks the streak, a
// bonus read off the wrong stack, the break's two totals made one, a body sent that is never counted, and the counter put back in the readout's column.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0428',
    suite: 'tests/score.test.ts',
    broke: 'a kill scored at its row’s points whatever the streak, so the streak multiplies nothing',
    guard: 'THE ASK: a kill scores its row’s points times the streak it lands on',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.score.points += w.enemyRows[w.deaths.kind[i]!]!.points * multiplierFor(w.score.streak);',
      replace: '      w.score.points += w.enemyRows[w.deaths.kind[i]!]!.points;',
    },
  },
  {
    decision: '0428',
    suite: 'tests/score.test.ts',
    // The ask's own sentence: a shield's hit is a hit. A streak that only a death ends is the reading it refuses.
    broke: 'the streak ended only by a death, so a shield taking a hit left it standing',
    guard: 'THE ASK: a shield taking a hit is a hit',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (w.ship.health < healthBefore) {\n        w.score.hits += 1;',
      replace: '      if (w.ship.health < healthBefore && w.ship.health <= 0) {\n        w.score.hits += 1;',
    },
  },
  {
    decision: '0428',
    suite: 'tests/score.test.ts',
    broke: 'a boss multiplied by the streak it was killed on, so the waves before a fight decide what it is worth',
    guard: 'a boss is worth its row’s points, flat',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.score.points += w.bossRow.points;',
      replace: '      w.score.points += w.bossRow.points * multiplierFor(w.score.streak);',
    },
  },
  {
    decision: '0428',
    suite: 'tests/score.test.ts',
    broke: 'a level boundary treated as a hit, so every streak ends at every clear',
    guard: 'the streak carries across the boundary',
    edit: {
      path: 'src/app/frame.ts',
      find: '  score.points = 0;\n  score.best = score.streak;',
      replace: '  score.points = 0;\n  score.streak = 0;\n  score.best = score.streak;',
    },
  },
  {
    decision: '0428',
    suite: 'tests/score.test.ts',
    // Every bonus read off the gun's stack: the missile powerups the ask names are never counted.
    broke: 'the missile bonus read off the gun’s stack, so a charge in the tubes pays nothing',
    guard: 'THE ASK: the clear pays for each shield on the hull',
    edit: {
      path: 'src/app/score.ts',
      find: '    held[kind] = side === null ? shields : run.arsenal[side].length;',
      replace: '    held[kind] = side === null ? shields : run.arsenal.gun.length;',
    },
  },
  {
    decision: '0428',
    suite: 'tests/score.test.ts',
    // The ask: *"each level should show total for that level and total overall score"* — two numbers, not one twice.
    broke: 'the break’s run score showing the level’s total again',
    guard: 'THE ASK: the break shows the level’s points, rank, three bonuses, its total and the run’s',
    edit: {
      path: 'src/app/score.ts',
      find: "  lines.push({ label: 'Score', value: bankedScore(run), tone: 'total' });",
      replace: "  lines.push({ label: 'Score', value: tally.total, tone: 'total' });",
    },
  },
  {
    decision: '0428',
    suite: 'tests/score.test.ts',
    // A wave's bodies never counted: the rank's share is over the adds alone, and a level of waves is always an S.
    broke: 'a wave’s bodies never counted as sent, so the rank is a share of nothing',
    guard: 'THE ASK: a kill scores its row’s points times the streak it lands on',
    edit: {
      path: 'src/app/frame.ts',
      find: '    // it is the same one a burst that will not fit gets.\n    if (e === null) return;\n    w.score.spawned += 1;',
      replace: '    // it is the same one a burst that will not fit gets.\n    if (e === null) return;',
    },
  },
  {
    decision: '0428',
    suite: 'tests/hud.browser.test.ts',
    // The counter put in the readout's column: it lands over the lives and shields on every screen.
    broke: 'the score laid out in the readout’s column, over the lives and the shields',
    guard: '0428 — THE ASK: the score is top right',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-playing-score {\n  grid-column: 3;\n  justify-self: end;',
      replace: '.itc-playing-score {\n  grid-column: 1;\n  justify-self: end;',
    },
  },
];
