// The window is the fight — docs/decisions/0502-the-window-is-the-fight.md
//
// Every guard 0502 adds, broken on purpose. `node scripts/prove-guard.mjs 0502`.
//
// ⚠️ THE ONE THAT IS NOT HERE is "hold the waves while the mid-boss lives" — deferring a wave until
// the hull dies. It hangs rather than reddens, for the reason 0267's probes recorded: not advancing
// `nextWave` leaves the wave inside the horizon, so the spawn loop never ends. Its skipping cousin is
// here, and is what the adds guard refuses.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0502',
    suite: 'tests/window.test.ts',
    // A wave authored inside the window: the Mire's first wave after it, put back where the chorus is
    // still arriving. Every other guard is green over it — the table is still ordered and mixed.
    broke: 'a wave authored inside the chorus’s window',
    guard: 'THE REPORTED ONE: after a mid-boss arrives nothing new is put down for its window',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 2520, enemy: 'charger', formation: 'line', count: 5, lane: 41 },",
      replace: "  { at: 2400, enemy: 'charger', formation: 'line', count: 5, lane: 41 },",
    },
  },
  {
    decision: '0502',
    suite: 'tests/window.test.ts',
    // The option the player was offered and did not take: an early kill resumes the script at once.
    // Written the way it would be — the horizon reaching on by the window once the mid-boss is dead.
    broke: 'the script resumed the moment the mid-boss dies, which the player declined',
    guard: 'THE REPORTED ONE: after a mid-boss arrives nothing new is put down for its window',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const horizon = spawnAlong(w.cameraAlong) - w.levelOrigin;',
      replace:
        '    const horizon = spawnAlong(w.cameraAlong) - w.levelOrigin + (w.fight === 1 && w.level.midBoss !== null ? w.level.midBoss.windowSeconds * 36 : 0);',
    },
  },
  {
    decision: '0502',
    suite: 'tests/window.test.ts',
    // A window longer than its row says: the shoal mother's first wave after it a second and a bit
    // late, so the adds the player was promised at twenty-five seconds come at twenty-six.
    broke: 'the script resuming a second after the window closes',
    guard: 'and the window is the gap: the script resumes when it closes, not later',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 2450, enemy: 'turret', formation: 'vee', count: 6, lane: 47 },",
      replace: "  { at: 2495, enemy: 'turret', formation: 'vee', count: 6, lane: 47 },",
    },
  },
  {
    decision: '0502',
    suite: 'tests/window.test.ts',
    // 0267's build, put back: two firing waves in three skipped for as long as the mid-boss lives,
    // so a fight run past its window gets no busier.
    broke: 'the firing waves thinned again while the mid-boss lives',
    guard: 'and past the window every wave comes as authored while the mid-boss still lives',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const thinned = row !== undefined && row.fireEvery > 0 && w.fight === 0 && ahead;',
      replace: '      const thinned = row !== undefined && row.fireEvery > 0 && w.fight === 0 && (w.bossPool.size > 0 || ahead);',
    },
  },
  {
    decision: '0502',
    suite: 'tests/window.test.ts',
    // The other option the player declined, in the form that terminates: every wave offered while
    // the hull lives skipped, so a slow kill is a duel in an empty lane however long it runs.
    broke: 'every wave skipped while the mid-boss lives',
    guard: 'and past the window every wave comes as authored while the mid-boss still lives',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (!thinned || (w.fightFiring - 1) % FIGHT_FIRING_IN === 0) spawnWave(w, w.nextWave);',
      replace: '      if (w.bossPool.size === 0 && (!thinned || (w.fightFiring - 1) % FIGHT_FIRING_IN === 0)) spawnWave(w, w.nextWave);',
    },
  },
  {
    decision: '0502',
    suite: 'tests/window.test.ts',
    // A row written for a shorter fight than the player reported. The walk still finds the gap the
    // row says, so only the literal can tell — which is why it is a literal.
    broke: 'the chorus’s window cut to twenty seconds',
    guard: 'and every level is written for the twenty-five seconds the player asked for',
    edit: {
      path: 'src/content/levels.ts',
      find: "    midBoss: { kind: 'chorus', at: 1619, windowSeconds: 25 },",
      replace: "    midBoss: { kind: 'chorus', at: 1619, windowSeconds: 20 },",
    },
  },
];
