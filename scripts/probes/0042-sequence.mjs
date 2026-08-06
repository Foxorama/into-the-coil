// The breaks behind docs/decisions/0042-a-run-is-a-sequence-of-levels.md.
//
// ⚠️ Three of these are ONE COMPARISON each, which is the point. A level ending and a run ending are
// `>=` against `>`; carrying a run forward and starting one over are the same four fields with one
// of them replaced. None of these edits looks wrong in review, and every one of them changes what
// the game is.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0042',
    suite: 'tests/run.test.ts',
    // The death rule wearing the wrong name. `lifeLost` clears these three lines up, so clearing
    // them here too reads as consistency.
    broke: 'a level boundary that empties the arsenal, which is the death rule wearing the wrong name',
    guard: 'carries everything forward across a level boundary',
    edit: {
      path: 'src/state/slices/run.ts',
      // ⚠️ Anchored on `level + 1` and the line after it, rather than on the whole returned literal.
      // The old anchor was the literal, and it went stale the day 0047 added a field to it — CI
      // refused the probe, which is the harness doing its job. `level + 1` is the one line in this
      // arm that says what a level boundary IS, so it is the part that will not move.
      find: '        level: state.level + 1,\n        arsenal: state.arsenal,\n        upgrades: state.upgrades,',
      replace: '        level: state.level + 1,\n        arsenal: [],\n        upgrades: [],',
    },
  },
  {
    decision: '0042',
    suite: 'tests/run.test.ts',
    // ⚠️ ONE COMPARISON. The run never ends, and the shell walks off the end of the level list — where
    // `enterLevel` clamps, so the player replays the last level forever and nothing reports anything.
    broke: 'the last level cleared and the run carrying on into a level that is not there',
    guard: 'a level cleared past the last one IS the end of the run',
    edit: {
      path: 'src/state/root.ts',
      find: "  if (state.screen.current === 'cleared' && state.run.level >= LEVEL_KINDS.length) {",
      replace: "  if (state.screen.current === 'cleared' && state.run.level > LEVEL_KINDS.length) {",
    },
  },
  {
    decision: '0042',
    suite: 'tests/run.test.ts',
    // The same comparison the other way: the run ends after the first level and the second is never
    // seen by anybody.
    broke: 'the run-finished agreement fired one level early',
    guard: 'a level cleared with more still to come is not the end of the run',
    edit: {
      path: 'src/state/root.ts',
      find: "  if (state.screen.current === 'cleared' && state.run.level >= LEVEL_KINDS.length) {",
      replace: "  if (state.screen.current === 'cleared' && state.run.level >= 1) {",
    },
  },
  {
    decision: '0042',
    suite: 'tests/level.test.ts',
    // A second boss that eases off. It is the one that has four phases, so it has the most places to
    // get this wrong, and a phase table is where nobody looks twice.
    broke: 'the second boss made an easier fight as it dies rather than a harder one',
    guard: 'every phase is reachable, and they only get harder',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      { upTo: 0.2, fireEvery: 40, shots: 7, spread: 1.4, patrolScale: 2.5 },',
      replace: '      { upTo: 0.2, fireEvery: 40, shots: 3, spread: 1.4, patrolScale: 2.5 },',
    },
  },
  {
    decision: '0042',
    suite: 'tests/combat.test.ts',
    // The new enemy against the rule that already caught the turret once. Size carries toughness, and
    // an extent is the easiest field in the game to pick by eye.
    broke: 'the warden drawn no bigger than the enemy it outlives',
    guard: 'the enemy that takes more killing is drawn bigger',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  warden: 9.5,\n  wardenHit: 9.5,',
      replace: '  warden: 7,\n  wardenHit: 7,',
    },
  },
];
