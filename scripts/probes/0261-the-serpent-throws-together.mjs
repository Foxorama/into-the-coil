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
    guard: 'THE THREE WEAPONS: a raking fan of acid',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0290, which made the raking fan a raking WAVE — the claim is unchanged.
      find:
        "    attack: { kind: 'serpentine', sweep: 0.32, waves: 1.5, beads: 3, reach: 1.4, turn: 0.45 },\n" +
        '    uncoil: null,\n    fall: null,\n    chill: null,\n    sprite: SPRITE.boss8,',
      replace: "    attack: { kind: 'wall', gap: 12 },\n    uncoil: null,\n    fall: null,\n    chill: null,\n    sprite: SPRITE.boss8,",
    },
  },
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    // The lightning head dropped from the last third.
    broke: 'the last third’s lightning head dropped, so the round is acid and void alone',
    guard: 'THE THREE WEAPONS: a raking fan of acid',
    edit: {
      path: 'src/content/bosses.ts',
      /*
        ⚠️ **Re-anchored by 0290**, which wrote a comment between the void's spray and the rain saying
        the lightning is not to be touched — so the two lines this used to name are no longer adjacent.
        The rain line alone is unique and is the thing being dropped.
      */
      find: "            { shot: 'void', attack: { kind: 'rain', warning: 45, halfWidth: 4 } },",
      replace: '',
    },
  },
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    // The round never turning: the first head every volley.
    broke: 'the round never turning, so every volley of the last third is acid',
    guard: 'THE THREE WEAPONS: a raking fan of acid',
    edit: {
      path: 'src/app/boss.ts',
      // ⚠️ Re-anchored when the round's count moved off `firePhase` — see the probe below.
      find: '      boss.headAt++;\n      throwAttack(head.attack',
      replace: '      throwAttack(head.attack',
    },
  },
  {
    decision: '0261',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE CRASH THIS BRANCH WOULD HAVE SHIPPED WITH, PUT BACK — the round counting on `firePhase`,
      which a rake advances by an ANGLE. It is one word, it type-checks, and 0254's own comment argues
      it is safe: *"the type refuses a head that is itself heads or a rake, so the recursion is one
      deep and `firePhase` has one reader."* True of a HEAD and false of a BOSS, and the serpent is
      the first content to be both.

      ⚠️ Every other guard about the serpent sets the phase it wants and measures that phase, so all
      of them stay green over it. What goes red is the one assertion that flies the fight from its
      opening rake into its later rounds — which is why that assertion exists rather than leaving this
      to 0268's bob guard, where it was found by accident.
    */
    broke: 'the round counting on the rake’s own angle again, so a raked serpent indexes a head that is not there',
    guard: 'a boss that rakes AND grows heads keeps the two counts apart',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const head = attack.heads[((boss.headAt % n) + n) % n]!;\n      boss.headAt++;',
      replace: '      const head = attack.heads[((boss.firePhase % n) + n) % n]!;\n      boss.firePhase++;',
    },
  },
];
