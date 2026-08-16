// The breaks behind docs/decisions/0150-the-uncoil-and-the-eye.md.
//
// ⚠️ THE FIRST IS THE DESIGN AS THE REPORT PROPOSED IT, RESTORED —
// `reports/the-boss-vocabulary-is-one-fan-2026-08-14.md` asked for a barrage and a window, and a
// window measured by the band of health it covers is 5.3 seconds long and lasts 1.8.
//
// ⚠️ AND THE REST ARE THE PICTURE. 0036 records three separate play reports of a model event with no
// picture behind it being filed as a collision fault that did not exist, and a window is the first
// thing in this game that is a STATE rather than a moment — it is on screen for seconds, so it is the
// one this failure has the longest to happen in.
//
// ⚠️ **TWO PROBES WERE RETIRED FROM THIS FILE AND THEY ARE NOT LOST** —
// `docs/decisions/0151-the-gap-you-have-to-reach.md`. Both were about `overwhelm`, the phase stance
// 0150 hung the curtain on, and the play-test moved that mechanism onto the ROW: *"it needed a way to
// dodge it and also needed to happen more than once per boss."* Their subjects live in
// `scripts/probes/0151-the-gap-you-have-to-reach.mjs` — the spacing one INVERTED, because the claim
// it defended was that no ship could pass, and the curtain now has a hole on purpose.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0150',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE WINDOW MEASURED IN THE WRONG UNITS, which is not a hypothetical — it is what every guard
      in this repository did to a bare phase before 0150's own was written. 0124 reads a band of
      health against a rate of damage and was green on a window a third of the length it reported,
      because a bared boss takes `damageScale` times as much off per pulse. Raising the multiplier
      shortens the window and moves NO number 0124 can see.
    */
    broke: 'the window given a multiplier that shortens it below the death beat it runs into',
    guard: 'and a window lasts longer than the death it runs into',
    edit: {
      path: 'src/content/bosses.ts',
      // The last boss's window. Its `upTo` is what makes the line unique — both are `damageScale: 3`.
      find: "      { upTo: 0.16, fireEvery: 30, shots: 7, spread: 1.8, patrolScale: 1.4, stance: { kind: 'bare', damageScale: 3 } },",
      replace: "      { upTo: 0.16, fireEvery: 30, shots: 7, spread: 1.8, patrolScale: 1.4, stance: { kind: 'bare', damageScale: 9 } },",
    },
  },
  {
    decision: '0150',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE WINDOW MADE INVISIBLE — 0036 on a state rather than on an event. The boss still stops
      firing and still takes triple damage; what goes is the only thing on screen that says so for
      longer than the half-second the transition burst lasts.
    */
    broke: 'a bared boss stopped shedding anything, so the window is a lull with no picture',
    guard: 'and the picture says so for as long as the window lasts',
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (stance.kind === 'bare' && w.steps % BURST.barePulse === 0) burst(w, boss.along, boss.across, BURST.bare);",
      replace: '  void BURST.bare;',
    },
  },
  {
    decision: '0150',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE BOSS THAT GOES ON SHOOTING WITH ITS EYE OPEN. Half of the window, removed — and it is the
      half the word *interactive* in the report is about, because a boss that fires through its own
      vulnerability is a difficulty spike rather than a moment the player is waiting for. Every table
      guard stays green: the stance is still authored, still last, still multiplied.
    */
    broke: 'the bare phase stopped returning early, so a bared boss fires its fan through the window',
    guard: 'and a bared boss throws nothing and dies faster for it',
    edit: {
      path: 'src/app/boss.ts',
      find: "  if (phase.stance.kind === 'bare') return direction;",
      replace: "  if (phase.stance.kind === 'bare' && false) return direction;",
    },
  },
];
