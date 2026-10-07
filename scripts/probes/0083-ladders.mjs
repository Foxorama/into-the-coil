// The breaks behind docs/decisions/0083-two-ladders-of-four.md.
//
// ⚠️ The subject is a NUMBER that used to be an accident. Before 0083 the tier count was whatever
// `round(9 × 0.78ⁿ) ≥ 4` produced — three, as it turned out, with nothing saying so and no guard able
// to notice. Every probe here breaks a different way of making it accidental again.
//
// ⚠️ 0083 also amends 0082, and the probes for the parts it CHANGED live here rather than there: the
// scatter going back to 100%, and shields staying out of it. What stayed 0082's — the max-speed nerf,
// the ring's spacing, the budget ceiling — stayed in `0082-taxonomy.mjs`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  /*
    ── THE PROBE FOR *the tier count moved without the levels* WAS HERE ────────────────────────────

    `THE TARGET: a level offers exactly enough weapons to cap the guns` went with its premise in
    `docs/decisions/0256-a-pickup-keeps-the-count.md` — the guns cap across the run now, not inside
    a level — so the tier count and the pickup budget are no longer one decision, and moving one
    without the other is a tuning change rather than a defect.
  */
  /*
    ── *the missile rate ladder flattened* WAS HERE, AND 0577 TOOK THE LADDER ──────────────────────

    It flattened the tubes' rate steps so the last two tiers resolved to the same ship. *"You either
    have full tier missiles or you don't"*: a tube fires at the old top rate from the moment it is
    fitted, and `0577 — A TUBE IS FULL FROM THE MOMENT IT IS FITTED` is that rule's own probe.
  */
  {
    decision: '0083',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ THE LAST TIER LEFT SHORT OF THE FLOOR, which is exactly what the old multiplicative ladder
      did: it refused the rung that would cross, so a fully-upgraded ship never quite reached the
      fastest it was allowed to fire. Written back as an off-by-one, which is how it would return.
    */
    /*
      ⚠️ RE-POINTED BY 0093, BECAUSE `rung` GOVERNS ONE LADDER NOW INSTEAD OF FOUR. It drew the
      barrels, both cadences and the launchers; 0093 made the first three note values or lists on the
      ship's row, so shortening the interpolation no longer touches a FLOOR at all — the launchers
      still round up to `MAX_LAUNCHERS` at the last rung. `npm run prove` reported WRONG TEST.

      ⚠️ What a rung-short ladder costs now is a TIER THAT BUYS NOTHING: launchers become 0, 0, 1, 1, 2
      and the first missile pickup of a run lands on a ship it does not change. That is the same
      underlying mistake — an interpolation that does not span the tiers it claims to — arriving at
      the guard which can still see it.
    */
    /*
      ⚠️ RE-ANCHORED AGAIN ON 2026-08-10. The interpolation is gone — the tubes are a capped count now
      — so *one rung short* is written as a cap one below `MAX_LAUNCHERS`. The break costs the same
      thing it always did: the tubes stop climbing at tier 1, and tier 2 (which buys the second tube
      and nothing else, by design) lands on a ship it does not change.

      ⚠️ **THE GUARD IT REDDENS MOVED, AND `npm run prove` SAID SO — WRONG TEST.** It used to be
      caught by the generic *every tier changes something*; it is now caught FIRST by the launcher
      table, which since this play-test states the ask literally — 1 tube, then 2 —
      (`docs/decisions/0103-the-fast-layer-is-in-front.md`). That is the right guard to name here: a
      probe should point at the assertion that owns the claim, and the count table owns it now.
      Naming the generic one would have this reported as WRONG TEST for ever while both were red.
    */
    broke: 'the launcher ladder one tube short, so the second missile pickup buys nothing',
    guard: 'fires one missile per launcher, and stops at two tubes',
    edit: {
      path: 'src/content/pickups.ts',
      // ⚠️ Re-anchored by 0233, and by 0577: the count is the fitted list's length, capped.
      find: '  const launchers = tubes.length > MAX_LAUNCHERS ? MAX_LAUNCHERS : tubes.length;',
      replace: '  const launchers = tubes.length > MAX_LAUNCHERS - 1 ? MAX_LAUNCHERS - 1 : tubes.length;',
    },
  },
  /*
    ── *"THE BOMB CONVERSION ASKED ABOUT THE WHOLE LIST"* WAS HERE, AND 0441 LEFT ONE LADDER ─────────

    It broke the one mistake two ladders invite: a full gun ladder capping the missiles. Since 0441
    the tubes are the only ladder, so the whole list and the kind's own are the same list and the break
    changes nothing — CI reported STILL GREEN, correctly.
  */
  /*
    ── TWO PROBES ABOUT THE DEATH SCATTER WERE HERE ────────────────────────────────────────────────

    *A filter put back on the scatter* and *a shield admitted to the scatter* — 0083's answers to
    *"too punishing"* and *"no shields spawn on death"*. `docs/decisions/0256-a-pickup-keeps-the-count.md`
    took the scatter out of a death altogether: a death costs one rung and throws nothing, so there
    is no scatter to filter and nothing for a shield to be admitted to. The shield is the mid-boss's
    to drop now, and 0256's own probes hold the list.
  */
];
