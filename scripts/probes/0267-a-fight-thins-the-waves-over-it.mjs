// The breaks behind docs/decisions/0267-a-fight-thins-the-waves-over-it.md.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the thinning DEFERS instead of skipping" — holding a wave back for
// the fight rather than dropping it. It cannot be written as a probe: not advancing `nextWave` leaves
// the wave inside the horizon on the next step, so the `while` never terminates and the break hangs
// the suite rather than reddening it. What refuses that version is the type of `at` and the comment
// on it in src/content/levels.ts, and the decision carries the argument.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0267',
    suite: 'tests/fight.test.ts',
    /*
      ⚠️ THE BUILD THE REPORT IS ABOUT, PUT BACK — 0247's *the waves keep coming around it*, with
      nothing thinned. Four of the seven levels send firing bodies onto the fight FASTER than into
      the stretch before it, which is *"way too many waves in general happening"* stated as a rate.
      Every other guard in the repository is green over it: the tables are still a mix (0231), every
      wave is still in its lane, and the bullet-time budget (0259) is still met.
    */
    broke: 'the thinning removed, so every firing wave the script offers lands on the fight',
    guard: 'THE REPORTED ONE: firing bodies arrive more slowly during a mid-boss fight than before it',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const thinned = row !== undefined && row.fireEvery > 0 && w.fight === 0 && w.bossPool.size > 0;',
      replace: '      const thinned = false;',
    },
  },
  {
    decision: '0267',
    suite: 'tests/fight.test.ts',
    /*
      ⚠️ THE OTHER END OF THE ASK, AND THE ONE A HAND REACHES FOR FIRST: if some is too many, none is
      simpler. *"Still need some during miniboss otherwise miniboss is too easy."* With every firing
      wave skipped, the fight is a duel in a lane of drifters — and THE REPORTED ONE above is greener
      than ever, which is exactly why the floor is its own guard rather than a clause of that one.
    */
    broke: 'every firing wave skipped for the length of the fight, so the mid-boss is fought alone',
    guard: 'and they never stop, so the fight is not a duel in an empty lane',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (!thinned || (w.fightFiring - 1) % FIGHT_FIRING_IN === 0) spawnWave(w, w.nextWave);',
      replace: '      if (!thinned) spawnWave(w, w.nextWave);',
    },
  },
  {
    decision: '0267',
    suite: 'tests/fight.test.ts',
    /*
      ⚠️ THE WRONG FIGHT, which is the plausible slip: `fight` is 0 for the mid-boss and 1 for the end
      boss (0247), and the two read alike at a glance. Thinning the end boss's stretch does nothing at
      all — a level's waves have run out by the time it arrives — so the mid-boss gets the untouched
      script and the change is invisible everywhere except the guard.
    */
    broke: 'the thinning pointed at the end boss’s fight, where a level has no waves left to thin',
    guard: 'THE REPORTED ONE: firing bodies arrive more slowly during a mid-boss fight than before it',
    edit: {
      path: 'src/app/frame.ts',
      find: 'row.fireEvery > 0 && w.fight === 0 && w.bossPool.size > 0;',
      replace: 'row.fireEvery > 0 && w.fight === 1 && w.bossPool.size > 0;',
    },
  },
];
