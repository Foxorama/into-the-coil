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
    /*
      A lane that looks perfectly ordinary. The two outermost members of this wave swing past the
      `across` cull and are gone from the game, still holding their pool slots.

      ⚠️ **The bound moved from the dodge lane to the ROAM band** —
      `docs/decisions/0059-the-lane-is-the-players-box.md` — because enemies now leave the lane on
      purpose. What was always at stake is the cull, and that has not moved.
    */
    broke: "a lane that lets a weaver's swing leave the band it can never return from",
    guard: 'never puts an enemy where it can leave the ROAM band and be culled',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 960, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },",
      replace: "  { at: 960, enemy: 'weaver', formation: 'line', count: 5, lane: 20 },",
    },
  },
  /*
    ⚠️ **A PROBE WAS REMOVED HERE, and its absence is the record.** It broke *has waves inside the
    opening spawn horizon* — 0040's rule that a level must not begin on an empty screen. Play asked
    for the exact opposite, so `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md`
    replaced that guard with a pair: nothing on the first screen, and not for long. Both halves are
    probed in `0043-budget.mjs`.

    Deleted rather than re-aimed, because re-aiming it produced a second probe doing what one of
    0043's already does, and two probes claiming one guard is the duplication
    `docs/decisions/0017-the-state-is-slices.md` records the cost of.
  */
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
      // ⚠️ Re-aimed by 0061, which turned the approach into a tracker. The break is the same one:
      // drop the camera's rate from the baseline and the boss is parked in world coordinates.
      find: '    scrollPerStep + (pull > APPROACH_PER_STEP',
      replace: '    0 * scrollPerStep + (pull > APPROACH_PER_STEP',
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
