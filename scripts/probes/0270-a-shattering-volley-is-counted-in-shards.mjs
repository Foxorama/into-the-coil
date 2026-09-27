// A shattering volley is counted in shards — docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md
//
// Every guard 0270 adds, broken on purpose. `node scripts/prove-guard.mjs 0270`.
//
// ⚠️ THE FIRST TWO RESTORE WHAT SHIPPED, which is what a probe is for: the hydra's frost head
// reading the phase's own `shots`, and a summons with no ceiling on the horde. Both were green
// against every guard in the repository on the day they were reported from play. The first is
// held to the pool since 0384; the lane guard it was written for has a probe of its own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0270',
    suite: 'tests/crowd.test.ts',
    /*
      What shipped: the ceiling removed, so a shattering shot spends the phase's count like any
      other bullet. The hydra's frost head goes back to four slots either side — eight shards, and
      ninety-six flakes — and the lane has no answer on it for a tenth of the phase.

      ⚠️ **AND THE STAGGER TAKEN OFF WITH IT SINCE 0371, BECAUSE WHAT SHIPPED HAD NEITHER.** Eight
      shards half a second apart is four seconds of one at a time, and the ceiling alone went STILL
      GREEN: the stagger is a second thing in front of this guard. The guard holds the lane and the
      lane is held; the break is the volley as it shipped, which the one line can say.

      ⚠️ **AIMED AT THE POOL SINCE 0384, BECAUSE THE LANE IT CLOSED HAS MOVED.** The hydra stands in
      the Mire's acid now, and flown over its own floor its frost is thrown from low in the lane:
      restored exactly, this break leaves the pilot 0.5 units at its narrowest on Burn, where before
      0384 it left none. What it still breaks is the hostile pool — the hoarfrost's last phase reaches
      140 of 150 shots alive — so that is the guard it is held to, and the lane has the probe below.
    */
    broke: 'a shattering volley spending the phase’s count again, all on one step, as it did before 0270',
    guard: 'and the pool always has room for the volley after this one',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const ceiling = bullet.fission.length > 0 ? SHARD_VOLLEY : Number.POSITIVE_INFINITY;',
      replace: '  const ceiling = Number.POSITIVE_INFINITY;\n  bullet = { ...bullet, stagger: undefined };',
    },
  },
  {
    decision: '0270',
    suite: 'tests/crowd.test.ts',
    /*
      A phase with no way through: the shoal mother's last, thrown four times as often and more than
      twice as wide — a fan of twelve every fifth of a second, which is a curtain rather than a
      pattern. The lane guard's own probe since 0384 took the hydra's frost out of its reach.

      ⚠️ **MEASURED BEFORE IT WAS CHOSEN, AND THE GENTLER EDITS WENT STILL GREEN.** Twelve shots at
      the phase's own cadence, a frost wall with no gap between its slots, and the hydra's volleys
      thrown from its hull all left the pilot room; this is the first that closes the lane, and it
      closes it on the gentlest tier.
    */
    broke: 'a boss phase thrown as a curtain the lane has no answer to',
    guard: 'THE REPORTED ONE: in every phase of every fight in the game',
    edit: {
      path: 'src/content/bosses.ts',
      find: '{ upTo: 0.33, fireEvery: 48, shots: 5, spread: 0.9, patrolScale: 2.4,',
      replace: '{ upTo: 0.33, fireEvery: 12, shots: 12, spread: 0.9, patrolScale: 2.4,',
    },
  },
  {
    decision: '0270',
    suite: 'tests/crowd.test.ts',
    /*
      What shipped: no ceiling on the horde at all, so every call adds to it and the entity pool is
      what stops the adds — 40 of them, which is `CAPACITY.enemies` and not a number anybody chose.
    */
    broke: 'a summons adding to the horde rather than topping it up, so the pool is the only ceiling',
    guard: 'and a summons keeps at most the horde its row authors standing',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const room = crowdFor(calling.standing, w.difficulty) - standingAdds(w, w.enemyKinds[calling.enemy]);',
      replace: '    const room = Number.POSITIVE_INFINITY;',
    },
  },
  {
    decision: '0270',
    suite: 'tests/crowd.test.ts',
    /*
      The pool rule, which 0263 wrote and drove over one phase of one boss. Widening the ceiling to
      six shards puts the frost ship's last phase into a full pool at `burn` — the state where
      `src/sim/pool.ts` silently drops the next volley and the shatter of an add with it.

      ⚠️ **MOVED TO THE CEILING'S ONE READER BY 0371, AND THE STAGGER TAKEN OFF THERE TOO.** Six
      shards half a second apart never have enough alive at once to fill the pool, so widening the
      constant alone went STILL GREEN. The same six, on one step, as the shard was thrown when this
      was written — `src/app/boss.ts` is the one place both can be said in one edit.
    */
    broke: 'a ceiling wide enough to fill the hostile pool, thrown on one step, so the volley after it is not thrown',
    guard: 'and the pool always has room for the volley after this one',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const ceiling = bullet.fission.length > 0 ? SHARD_VOLLEY : Number.POSITIVE_INFINITY;',
      replace: '  const ceiling = bullet.fission.length > 0 ? 6 : Number.POSITIVE_INFINITY;\n  bullet = { ...bullet, stagger: undefined };',
    },
  },
  {
    decision: '0270',
    suite: 'tests/difficulty.test.ts',
    // The tier axis pointing the wrong way: a middle tier that sends LESS than the easiest.
    broke: 'the middle tier sending less than the easiest, so the ladder runs backwards',
    guard: 'on every axis at once, and never softer on any of them',
    edit: {
      path: 'src/content/difficulty.ts',
      // ⚠️ Re-anchored by 0356: Legend is derived from Savior now, so lowering Savior's crowd lowers
      // Legend's with it and nothing runs backwards. A margin under one is the break that does.
      find: '  aggression: 1.5,\n  crowd: 1.15,',
      replace: '  aggression: 1.5,\n  crowd: 0.9,',
    },
  },
  {
    decision: '0270',
    suite: 'tests/tier-shell.test.ts',
    // The content no longer the counts as authored — re-pointed by 0356 from the easiest tier, which
    // is a margin under Savior now, to `AUTHORED`, which is where the boss table is still read.
    broke: 'the baseline scaling what arrives, so the boss table is nobody’s fight',
    guard: 'THE BASELINE',
    edit: {
      path: 'src/content/difficulty.ts',
      // `HARDER` reads the same two lines, so the corridor comment after them is what makes it `AUTHORED`.
      find: '  aggression: 1,\n  crowd: 1,\n  // The widest',
      replace: '  aggression: 1,\n  crowd: 1.4,\n  // The widest',
    },
  },
  /*
    ⚠️ **NO PROBE FOR *the tier scaling the shard ceiling again*, and it is worth a line.** The break
    would be `crowdFor(SHARD_VOLLEY, tier)` in place of the bare constant, and what it reddens is the
    pool guard at `burn` alone — which the third probe above already covers from the other side, by
    widening the ceiling on every tier at once. Two probes for one assertion is a second copy, and
    `docs/decisions/0029-the-tracked-record-is-the-record.md` is the standing argument against it.
  */
];
