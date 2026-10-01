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
    broke: 'the sentinel’s health put back to what 0247 gave it, so its fight is twice what its level asks',
    guard: 'THE REPORTED ONE: a mid-boss fight lasts what its level asks',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0364, which re-solved every mid-boss after the zoom, and by 0406, which
      // solved it at the loadout the run carries in: 120, so 0247's 240 is twice it now, not four times.
      // ⚠️ And by 0441, which re-solved it at 211 for a ship that carries its own gun from the start;
      // the break is still twice what its level asks.
      find: '    health: 211,',
      replace: '    health: 422,',
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
      // ⚠️ Re-anchored by 0364 — the redoubt's re-solved health, given the lattice's re-solved one —
      // and by 0406, which re-solved both at the loadout the run carries in.
      find: '    health: 541,',
      replace: '    health: 187,',
    },
  },
  /*
    ⚠️ **THE CAP'S END OF IT WAS A PROBE HERE AND IS GONE — 0406** deleted *"and at a full loadout it is
    still a speed bump"*, which it broke: from the second level the fight is met at the cap, so the
    band above is asked there. 0406's own probe puts the one-rung assumption back.
  */
  {
    decision: '0269',
    suite: 'tests/midboss.test.ts',
    /*
      ⚠️ THE MID-BOSS HALF OF 0150's WINDOW FLOOR, and it is here rather than in that decision's own
      probes because 0269 is what split them. A bared hull takes `damageScale` times as much off per
      pulse, so raising the multiplier shortens the window and moves no number a phase table can see —
      the same break 0150 has always made, asked at the loadout a mid-boss is actually met with.

      ⚠️ **`npm run prove` is what said this was needed.** Scoping 0150's guard to the end bosses left
      its probe breaking the axis, which that guard no longer covers: it applied and the suite STAYED
      GREEN. A guard that moves takes its probes with it.
    */
    broke: 'a mid-boss’s window given a multiplier that shortens it below the death beat',
    guard: 'and a bare window on one outlasts the death it runs into',
    edit: {
      path: 'src/content/bosses.ts',
      find: "      { upTo: 0.33, fireEvery: 36, shots: 7, spread: 1.8, patrolScale: 1.2, stance: { kind: 'bare', damageScale: 3 }, look: null, shot: null, attack: null },",
      replace:
        "      { upTo: 0.33, fireEvery: 36, shots: 7, spread: 1.8, patrolScale: 1.2, stance: { kind: 'bare', damageScale: 9 }, look: null, shot: null, attack: null },",
    },
  },
];
