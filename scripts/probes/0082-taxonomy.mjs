// The breaks behind docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md.
//
// ⚠️ Four of these are the four halves of the decision, and they fail in four different places on
// purpose: the density is content, the ladder is content, the overflow is the shell, and the scatter
// is the frame. A decision that touches four layers and is probed in one of them has three
// unfalsifiable claims in it.
//
// ⚠️ The one that is NOT here is the deleted extra life, and that is deliberate rather than an
// oversight. Its consequence — a run's life complement can only go down — is a property of there
// being no `gainedLife` action at all, and there is no edit to any file that restores one without
// writing the feature back. What holds it is the type: `RunAction` has no arm for it, so a shell that
// tried would not build. That is a stronger guard than a probe and it is worth saying why.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0082',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE REPORTED ONE, AND IT IS THE STATE THE GAME SHIPPED IN. *"Power ups are too common still
      and these are premium game pieces that are the lynchpin of whether this game is actually good or
      not."* Every level authored 19 to 24 entries against an ask of six; this puts one level back
      part-way there, which is enough to redden the budget ceiling.

      The break is deliberately MILD — three extra weapons in one level, not twenty — because a guard
      that only catches a total reversion is a guard that lets the density creep back one pickup at a
      time, which is how it got to twenty-four in the first place.
    */
    broke: 'a level quietly given more shields than the ask allows',
    guard: 'offers the budget the ask named, in every level',
    edit: {
      path: 'src/content/levels.ts',
      /*
        ⚠️ RE-AIMED AT THE SHIELDS BY 0083. It used to add weapons, and 0083 gave the weapon count a
        guard of its own — an exact match against `UPGRADE_TIERS`, because *cap the guns before the
        boss* is arithmetic rather than a range. Extra weapons now redden that one instead, which is
        the wrong guard for this probe to be standing over. The shields still have a RANGE, so they are
        what a budget ceiling is actually made of.
      */
      find: "  { at: 3905, kind: 'shield', lane: 62 },",
      replace:
        "  { at: 3905, kind: 'shield', lane: 62 },\n" +
        "  { at: 6000, kind: 'shield', lane: 40 },\n" +
        "  { at: 6100, kind: 'shield', lane: 55 },",
    },
  },
  {
    decision: '0082',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ THE MAX-SPEED NERF, PUT BACK. *"Max speed auto-fire is way too strong for the current game -
      when you get max speed nothing is a challenge, bosses die in less a second and they are supposed
      to be tough."* The cause was an unbounded `damage++` past the caps, and the fix was to delete it
      — so the break is to write it back, which is exactly what the next person reaching for
      `docs/game.md`'s *an upgrade that cannot change the outcome is worse than none* would do.

      ⚠️ It is the SAME EDIT the rule invites, which is what makes it worth scripting: the reasoning
      that produced the defect is still in the product definition, and 0082 answers it somewhere else.
      A guard that only catches a careless change would not catch this one.
    */
    broke: 'the overflow damage written back, so a capped weapon keeps getting stronger forever',
    // ⚠️ The guard was `THE NERF: a weapon past its caps stops growing` and 0083 folded its assertions
    // into `THE FLOORS`, which now holds both halves: the ladder stops, and the damage does not climb.
    guard: 'THE FLOORS: the last tier lands exactly on them',
    edit: {
      path: 'src/content/pickups.ts',
      /*
        ⚠️ AT THE RESOLVE RATHER THAN IN THE LOOP, AND THE FIRST ATTEMPT IS WHY. It was
        `if (!grows(…)) { damage++; continue; }`, which is what the deleted code literally did — and
        `damage` is `const` now, so the edit does not COMPILE. `vite build` failed in vitest's global
        setup and the harness reported **STILL GREEN**, which reads as *your guard is weak* and means
        *your probe does not build*.

        A break that cannot run proves nothing about a guard, so this is expressed as the same defect
        at the point the weapon is assembled: past the ladder's five rungs, every further upgrade
        becomes weight. Runtime-valid, one line, and exactly as plausible — it is what somebody
        restoring `docs/game.md`'s *"every upgrade is worth taking"* would reach for.
      */
      find: '    damage,\n    missileEvery,',
      replace: '    damage: damage + Math.max(0, upgrades.length - 5),\n    missileEvery,',
    },
  },
  {
    decision: '0082',
    suite: 'tests/shields.test.ts',
    /*
      ⚠️ THE OTHER HALF OF THE SAME DECISION, and it has to be broken separately. Capping the weapon
      and giving the capped pickup somewhere to go are one idea in two layers — content answers *is it
      full*, the shell answers *then what* — and a probe over only the first passes while a player at
      full weapons flies through pickups that do nothing at all.

      That is `docs/game.md`'s *"an upgrade that cannot change the outcome is worse than none"* broken
      silently, which is the failure the deleted `damage++` was there to prevent.
    */
    broke: 'a capped weapon pickup still filed as an upgrade, so it buys nothing',
    // ⚠️ Renamed by 0083 — it is two ladders now, so the guard is about *an upgrade pickup* rather
    // than about the weapon.
    guard: 'an upgrade pickup taken at its cap becomes a bomb charge',
    edit: {
      path: 'src/content/pickups.ts',
      /*
        ⚠️ The narrowing removed, leaving the row's general answer. That is precisely the code that was
        there before 0082 and precisely what a later reader would "simplify" this back to — the row
        already says `upgrade`, so the extra term looks redundant right up until the player's weapon is
        full.
      */
      // ⚠️ Re-anchored by 0233: the narrowing is the last line of `effectOf` now. The break is the
      // same — the cap never consulted, so the row's general answer is the whole answer.
      find: "  return upgradeGrows(loadout.upgrades, kind) ? 'upgrade' : 'special';",
      replace: "  return 'upgrade';",
    },
  },
  /*
    ── TWO PROBES MOVED TO `0083-ladders.mjs` ────────────────────────────────────────────────────

    The 50% scatter and the shields-stay-out rule are both 0083's now: it reverted the first after a
    play-test called it *"too punishing"* and guarded the second for the first time. A probe belongs
    to the decision whose rule it breaks, so they went with the rule rather than staying beside the
    decision that happened to touch the same function.
  */
  {
    decision: '0082',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE RING SPACED OVER PIECES THAT ARE NOT BEING PLACED. `count` exists because the pool can
      truncate a very long loadout, and it was written for 0082's 50% coin — which is gone, and the
      divisor is not: spacing over `upgrades.length` while placing `count` leaves the survivors on the
      headings the whole set would have used, so part of the ring is empty and the player reads it as
      pieces having failed to appear.

      ⚠️ This is the break the decision is most likely to lose to a later refactor, because the two
      versions place the same NUMBER of pieces and differ only in where. Nothing about the counts would
      look wrong, which is why it needed an assertion about the ANGLES.
    */
    broke: 'the ring spaced over the whole loadout rather than over the pieces being placed',
    guard: 'leaves in every direction, and no two pieces travel together',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0243: the divisor is `pieces` — the kinds present — and spacing the two
      // over four headings puts both on one side of the wreck.
      find: '  const angle = Math.PI / 3 + (index / pieces) * Math.PI * 2',
      replace: '  const angle = Math.PI / 3 + (index / (pieces * 2)) * Math.PI * 2',
    },
  },
];
