// A shattering volley is counted in shards — docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md
//
// Every guard 0270 adds, broken on purpose. `node scripts/prove-guard.mjs 0270`.
//
// ⚠️ THE FIRST TWO RESTORE WHAT SHIPPED, which is what a probe is for: the hydra's frost head
// reading the phase's own `shots`, and a summons with no ceiling on the horde. Both were green
// against every guard in the repository on the day they were reported from play.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0270',
    suite: 'tests/crowd.test.ts',
    /*
      What shipped: the ceiling removed, so a shattering shot spends the phase's count like any
      other bullet. The hydra's frost head goes back to four slots either side — eight shards, and
      ninety-six flakes — and the lane has no answer on it for a tenth of the phase.
    */
    broke: 'a shattering volley spending the phase’s count again, as it did before 0270',
    guard: 'THE REPORTED ONE: in every phase of every shattering fight',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const ceiling = bullet.fission.length > 0 ? SHARD_VOLLEY : Number.POSITIVE_INFINITY;',
      replace: '  const ceiling = Number.POSITIVE_INFINITY;',
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
    */
    broke: 'a ceiling wide enough to fill the hostile pool, so the volley after it is not thrown',
    guard: 'and the pool always has room for the volley after this one',
    edit: {
      path: 'src/content/shots.ts',
      find: 'export const SHARD_VOLLEY = 3;',
      replace: 'export const SHARD_VOLLEY = 6;',
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
      find: '    crowd: 1.15,',
      replace: '    crowd: 0.9,',
    },
  },
  {
    decision: '0270',
    suite: 'tests/difficulty.test.ts',
    // The easiest tier no longer the content as authored, which is the file header's own rule.
    broke: 'the easiest tier scaling what arrives, so the boss table is nobody’s fight',
    guard: 'multiplies nothing at all',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    aggression: 1,\n    crowd: 1,',
      replace: '    aggression: 1,\n    crowd: 1.4,',
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
