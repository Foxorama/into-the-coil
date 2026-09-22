// The breaks behind docs/decisions/0359-the-boss-has-a-health-bar.md.
//
// ⚠️ The bar is a seam — a remembered fraction, fired on a change — and every way it goes wrong is
// a way `onHealth` could have gone wrong too: the wrong body, an event that never fires, a rounding
// that lies at the edge, and a write per hit. Each is one tidy-looking edit.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0359',
    suite: 'tests/boss-bar.test.ts',
    /*
      ⚠️ THE MID-BOSS GIVEN THE BAR. `bossPool.size > 0` is the obvious test for *a boss is on the
      field* and it is true of both fights; 0247's beat inside the level would then wear the readout
      of the fight the level is.
    */
    broke: 'the bar raised for the mid-boss too, which is the beat inside the level wearing the fight’s readout',
    guard: 'THE ASK: the bar comes up full when the end boss has arrived',
    edit: {
      path: 'src/app/frame.ts',
      find: '      bossOnField(w) && w.bossEntering < 0 && w.bossFullHealth > 0',
      replace: '      w.bossPool.size > 0 && w.bossEntering < 0 && w.bossFullHealth > 0',
    },
  },
  {
    decision: '0359',
    suite: 'tests/boss-bar.test.ts',
    // The going never said. The bar stands over an empty field until the next fight overwrites it.
    broke: 'the bar left standing when the boss died, until the next fight overwrote it',
    guard: 'THE ASK: the bar comes up full when the end boss has arrived',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (bossShown !== w.shownBoss) {',
      replace: '    if (bossShown !== w.shownBoss && bossShown >= 0) {',
    },
  },
  {
    decision: '0359',
    suite: 'tests/boss-bar.test.ts',
    // Rounded down: a boss on its last point of health shows an empty bar and goes on firing.
    broke: 'rounded down, so a boss on its last point of health shows an empty bar',
    guard: 'rounds UP, so a boss on its last point of health shows a sliver',
    edit: {
      path: 'src/app/frame.ts',
      find: 'Math.ceil((w.bossPool.at(0).health / w.bossFullHealth) * BOSS_BAR_STEPS)',
      replace: 'Math.floor((w.bossPool.at(0).health / w.bossFullHealth) * BOSS_BAR_STEPS)',
    },
  },
  {
    decision: '0359',
    suite: 'tests/boss-bar.test.ts',
    /*
      ⚠️ THE DOM IN THE HOT PATH. Written whenever a boss is on the field rather than when the
      quantum moves — sixty writes a second for the whole fight, which is the one thing `onHealth`'s
      remembered value exists to refuse.
    */
    broke: 'the chrome written on every step of the fight rather than on a change of the quantum',
    guard: 'is written on a change of the quantum and not per hit',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (bossShown !== w.shownBoss) {\n      w.shownBoss = bossShown;',
      replace: '    if (bossShown >= 0 || bossShown !== w.shownBoss) {\n      w.shownBoss = bossShown;',
    },
  },
];
