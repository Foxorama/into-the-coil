// The breaks behind docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md.
//
// ⚠️ Two of these guards were written AFTER a screenshot found what they now catch, which is the
// wrong order and is recorded in the decision rather than tidied away. What that makes them is
// guards over faults that have actually happened in this repository — so the breaks below are the
// real edits, not invented ones.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0040',
    suite: 'tests/level.test.ts',
    // The spawner keeps an index that only goes up, so a wave behind its neighbour is not LATE, it
    // never spawns at all — and nothing anywhere reports a missing wave.
    broke: 'a wave authored out of order, which the spawner skips rather than delays',
    guard: 'lists its waves in ascending order of place',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 510, enemy: 'drifter', formation: 'vee', count: 6, lane: 55 },",
      replace: "  { at: 410, enemy: 'drifter', formation: 'vee', count: 6, lane: 55 },",
    },
  },
  {
    decision: '0040',
    suite: 'tests/level.test.ts',
    // A lane that looks perfectly ordinary. There is no `across` cull, so the two outermost members
    // of this wave leave the game and keep their pool slots.
    broke: "a lane that lets a weaver's swing leave the dodge lane it can never return to",
    guard: 'never puts an enemy where it can leave the dodge lane',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 960, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },",
      replace: "  { at: 960, enemy: 'weaver', formation: 'line', count: 5, lane: 20 },",
    },
  },
  {
    decision: '0040',
    suite: 'tests/level.test.ts',
    // ⚠️ THE ONE THE SCREENSHOT FOUND. Pushing the opening past the horizon is exactly what treating
    // `at` as a trigger did, and the level still looks completely reasonable in the table.
    // Re-aimed by 0043, which replaced the guard this pointed at. The opening is now supposed to be
    // empty; what must not happen is the player being left flying at nothing.
    broke: 'the whole opening deleted, so the player flies at empty space for half a minute',
    guard: 'and does not leave the player waiting',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 60, enemy: 'drifter', formation: 'line', count: 5, lane: 50 },\n  { at: 150, enemy: 'drifter', formation: 'line', count: 5, lane: 30 },\n  { at: 240, enemy: 'drifter', formation: 'vee', count: 5, lane: 70 },\n  { at: 330, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },",
      replace: "  { at: 330, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },",
    },
  },
  {
    decision: '0040',
    suite: 'tests/level.test.ts',
    // ⚠️ THE OTHER ONE. Halving every count is the shape of the first draft — the table still reads
    // as a full level, and the screen holds two enemies.
    broke: 'the formation spacing widened back out, thinning the level to its first draft',
    guard: 'keeps enough on screen at once to be a shooter',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 2400, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },\n  { at: 2490, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },\n  { at: 2580, enemy: 'turret', formation: 'line', count: 4, lane: 50 },",
      replace: "  { at: 2400, enemy: 'drifter', formation: 'line', count: 1, lane: 60 },\n  { at: 2490, enemy: 'weaver', formation: 'line', count: 1, lane: 45 },\n  { at: 2580, enemy: 'turret', formation: 'line', count: 1, lane: 50 },",
    },
  },
  {
    decision: '0040',
    suite: 'tests/level.test.ts',
    // A boss that eases off as it dies is the opposite of what `docs/game.md` asks a boss for, and
    // the table row for it looks like ordinary tuning.
    broke: 'a boss phase that eases off as it dies rather than escalating',
    guard: 'every phase is reachable, and they only get harder',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      { upTo: 0.3, fireEvery: 48, shots: 5, spread: 0.9, patrolScale: 2 },',
      replace: '      { upTo: 0.3, fireEvery: 120, shots: 5, spread: 0.9, patrolScale: 2 },',
    },
  },
  {
    decision: '0040',
    suite: 'tests/level.test.ts',
    // ⚠️ The bug 0034 records, aimed at the boss: anything parked in WORLD coordinates slides off the
    // back of the screen at the scroll rate. It is one term, and it is invisible in review.
    broke: "the boss parked in world coordinates instead of the camera's frame",
    guard: 'arrives, closes on its station, and then holds it',
    edit: {
      path: 'src/app/boss.ts',
      find: '  boss.velAlong = boss.along > station ? scrollPerStep - APPROACH_PER_STEP : scrollPerStep;',
      replace: '  boss.velAlong = boss.along > station ? -APPROACH_PER_STEP : 0;',
    },
  },
  {
    decision: '0040',
    suite: 'tests/level.test.ts',
    // Without the latch the level is cleared on every step from the boss's death until the screen
    // changes — which the shell would answer by dispatching the same action a hundred times.
    broke: 'the level cleared every step instead of once',
    guard: 'dies to the base weapon, and says so exactly once',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.bossSpawned && !w.bossBeaten && w.bossPool.size === 0) {',
      replace: '    if (w.bossSpawned && w.bossPool.size === 0) {',
    },
  },
];
