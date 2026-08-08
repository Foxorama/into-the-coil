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
    broke: 'a level quietly given more weapons than the ask allows',
    guard: 'offers the budget the ask named, in every level',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 4600, kind: 'weapon', lane: 30 },",
      replace:
        "  { at: 4600, kind: 'weapon', lane: 30 },\n" +
        "  { at: 4900, kind: 'weapon', lane: 55 },\n" +
        "  { at: 5200, kind: 'weapon', lane: 35 },\n" +
        "  { at: 5400, kind: 'weapon', lane: 60 },",
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
    guard: 'THE NERF: a weapon past its caps stops growing',
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
    guard: 'a weapon pickup taken at the cap becomes a bomb charge',
    edit: {
      path: 'src/content/pickups.ts',
      /*
        ⚠️ The narrowing removed, leaving the row's general answer. That is precisely the code that was
        there before 0082 and precisely what a later reader would "simplify" this back to — the row
        already says `upgrade`, so the extra term looks redundant right up until the player's weapon is
        full.
      */
      find: "  return effect === 'upgrade' && !weaponGrows(weapon) ? 'special' : effect;",
      replace: '  void weapon;\n  return effect;',
    },
  },
  {
    decision: '0082',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE COST OF DYING. *"When a player dies let's change it to 50% chance of each power up they
      have collected spawning from their death, current implementation means there's not really a cost
      to dying at all."* The break is the filter removed, which is the state 0066 shipped.
    */
    broke: 'the 50% filter removed, so a death hands the whole loadout straight back',
    guard: 'THE 50% RULE: gives back about half of a large loadout',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.scatterRng.float() < SCATTER_KEPT) w.scattered[thrown++] = upgrades[i]!;',
      replace: '    w.scattered[thrown++] = upgrades[i]!;\n    void SCATTER_KEPT;',
    },
  },
  {
    decision: '0082',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE ORDER, AND IT IS THE ONE THING THE FILTER GETS WRONG BY DEFAULT. Filtering inside the
      placing loop is the obvious way to write *50% chance of each power up*, and it reads perfectly:
      the same coin, the same rate, the same survivors. What it breaks is 0077's even spacing —
      the ring is still divided over the FULL loadout, so the pieces that survive sit on the headings
      the whole set would have used and the gaps read as pieces having failed to appear.

      ⚠️ This is the break the decision is most likely to lose to a later refactor, because the two
      versions produce the same COUNT and differ only in where the pieces are. Nothing about the
      numbers would look wrong.
    */
    broke: 'the ring spaced over the whole loadout rather than over the pieces that survived the coin',
    guard: 'leaves in every direction, and no two pieces travel together',
    edit: {
      path: 'src/app/frame.ts',
      /*
        ⚠️ The divisor, and only the divisor. `upgrades` here is `w.scattered`, whose length is the
        pool's — so this is precisely *space the circle over more pieces than are being placed*, which
        is what tossing the coin inside this loop would produce. The COUNT is unchanged, which is why
        it needed a new assertion rather than an existing one.
      */
      find: '    const halfGap = (Math.PI / count) * SCATTER_JITTER_SHARE;\n    const angle = (i / count) * Math.PI * 2',
      replace:
        '    const halfGap = (Math.PI / upgrades.length) * SCATTER_JITTER_SHARE;\n' +
        '    const angle = (i / upgrades.length) * Math.PI * 2',
    },
  },
];
