// The serpent throws together — docs/decisions/0261-the-serpent-throws-together.md
//
// Every guard 0261 adds, broken on purpose. `node scripts/prove-guard.mjs 0261`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    // 0248's wall put back on the row.
    broke: 'the acid back on the wall',
    // ⚠️ Re-named by 0304, which made the opening acid five globes ahead; the claim is unchanged.
    guard: 'THE THREE WEAPONS: five globes of acid',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0290, which made the raking fan a raking WAVE — the claim is unchanged.
      // And by 0304, which made it a plain fan of five straight ahead.
      find: "    attack: { kind: 'spray' },\n" + '    uncoil: null,\n    fall: null,\n    chill: null,\n    sprite: SPRITE.boss8,',
      replace: "    attack: { kind: 'wall', gap: 12 },\n    uncoil: null,\n    fall: null,\n    chill: null,\n    sprite: SPRITE.boss8,",
    },
  },
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    // The lightning head dropped from the last third.
    broke: 'the last third’s lightning head dropped, so the round is acid and void alone',
    guard: 'THE THREE WEAPONS: five globes of acid',
    edit: {
      path: 'src/content/bosses.ts',
      /*
        ⚠️ **Re-anchored by 0290**, which wrote a comment between the void's spray and the rain saying
        the lightning is not to be touched — so the two lines this used to name are no longer adjacent.
        The rain line alone is unique and is the thing being dropped.
      */
      // ⚠️ **And re-anchored again by 0308**, which gave that head its own cue.
      find: "            { shot: 'void', attack: { kind: 'rain', warning: 45, halfWidth: 4 }, cue: 'bossBolt' },",
      replace: '',
    },
  },
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    // The round never turning: the first head every volley.
    broke: 'the round never turning, so every volley of the last third is acid',
    guard: 'THE THREE WEAPONS: five globes of acid',
    edit: {
      path: 'src/app/boss.ts',
      // ⚠️ Re-anchored when the round's count moved off `firePhase` — see the probe below. And by 0308,
      // which put a comment between the increment and the throw.
      find: '      boss.headAt++;\n',
      replace: '',
    },
  },
  /*
    ⚠️ **THE FOURTH PROBE — the round counting on the rake's angle — WENT WITH THE RAKE, IN 0304.** It
    put back the crash that made every serpent fight throw a TypeError at its first phase change, and
    it went red because the serpent raked in its opening phase and grew heads in its others. 0304
    made that opening a plain fan, and no row in the game both rakes and grows heads now — the eagle
    and the gyre rake, the hydra and the serpent grow heads — so the break has no content left to
    crash and its guard stayed green over it. The split it proved stands in `src/sim/entity.ts`, and
    the spray that took the rake's place is held for the same defect by 0304's own probes.
    `docs/decisions/0192-a-guard-holds-an-invariant.md`: demoting takes one edit and a reason.
  */
];
