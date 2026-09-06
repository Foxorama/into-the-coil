// The breaks behind docs/decisions/0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md.
//
// ⚠️ THE ONE THAT CANNOT BE WRITTEN is "a red guard answered by moving the target instead of the
// health" — editing `MID_BOSS_SECONDS` to match a measurement makes tests/midboss.test.ts agree with
// itself and go GREEN, which is the opposite of a probe. Nothing mechanical can catch it; what
// refuses it is the note at the top of that file and 0192's rule, and the decision says so rather
// than leaving it to be rediscovered.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0269',
    suite: 'tests/midboss.test.ts',
    /*
      ⚠️ 0247's HEALTH PUT BACK ON ONE BOSS, which is the state the report is about — the sentinel at
      240 is a fifty-five second fight at the loadout it is met with, against the seventeen its level
      asks for. One row is enough: the guard is per level, so a hand that re-tuned a single mid-boss
      by feel is caught by the same assertion as a hand that reverted all seven.
    */
    broke: 'the sentinel’s health put back to what 0247 gave it, so its fight is four times what its level asks',
    guard: 'THE REPORTED ONE: a mid-boss fight lasts what its level asks',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    health: 83,',
      replace: '    health: 240,',
    },
  },
  {
    decision: '0269',
    suite: 'tests/midboss.test.ts',
    /*
      ⚠️ THE ASSUMPTION THIS DECISION EXISTS TO REFUSE: that health maps to seconds the same way for
      every mid-boss, so one number could serve them all. The redoubt patrols at 0.16 and nearly
      everything fired at it lands; give it the lattice's health — a hull that patrols at 0.5 and is
      fought for about as long — and it dies in a fraction of the time. Nothing about the tables looks
      wrong afterwards: the healths are still ordered, still positive, still under the real bosses'.
    */
    broke: 'the redoubt given the lattice’s health, as though a hull’s toughness were the number on it',
    guard: 'THE REPORTED ONE: a mid-boss fight lasts what its level asks',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    health: 210,',
      replace: '    health: 38,',
    },
  },
  {
    decision: '0269',
    suite: 'tests/midboss.test.ts',
    /*
      ⚠️ THE CAP'S END OF IT, and it is the half a solve against ONE loadout cannot see. The solver
      measures at one rung; a mid-boss given enough health to sit inside the band there can still be a
      fight at the cap, which is 0247's *speed bump* stopped being one. The axis is the toughest of
      the seven, so giving it a real boss's health is the plausible shape of the slip.

      ⚠️ **THREE TIMES AND NOT TWICE, BECAUSE TWICE ONLY JUST REDDENED** — 13 seconds against a
      ceiling of 12. A probe that clears its guard by one second is one small change elsewhere away
      from reporting STILL GREEN, and a break has to be seen to fail for a reason rather than by a
      margin (0044's subject, arriving from the other side).
    */
    broke: 'the axis given a real boss’s health, so the last mid-boss is still a fight at a full loadout',
    guard: 'and at a full loadout it is still a speed bump',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    health: 208,',
      replace: '    health: 576,',
    },
  },
];
