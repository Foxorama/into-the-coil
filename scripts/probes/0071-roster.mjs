// The breaks behind docs/decisions/0071-five-more-levels-and-one-idea-each.md.
//
// ⚠️ There is no new RULE in that decision — the content it adds is held by the guards 0040, 0041,
// 0048 and 0061 already landed, and three of those guards caught three real mistakes in it before it
// was run once. What IS new is the roster property: seven levels, seven bosses, no repeats. These
// are the two ways that goes wrong silently.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0071',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ A level pointed at a boss another level already uses. It builds, it runs, and it plays as a
      repeat of an earlier fight with different waves in front of it — `docs/game.md`'s *every boss is
      unique* broken in the one way no compiler can see. It is also the cheapest way to add a level,
      which is what makes it worth a guard.
    */
    broke: 'the last level pointed at the first level’s boss, so a run fights it twice',
    guard: 'no boss is fought twice in one run',
    edit: { path: 'src/content/levels.ts', find: "    boss: 'axis',", replace: "    boss: 'sentinel'," },
  },
  {
    decision: '0071',
    suite: 'tests/level.test.ts',
    // Two bosses drawn as the same object. The silhouette is the first thing a player learns about a
    // boss, so a shared one is one fight wearing two names — and reusing a sprite is exactly what
    // somebody adding a sixth boss in a hurry does.
    broke: 'two bosses given the same hull, so one fight wears two names',
    guard: 'and no two bosses wear the same hull',
    edit: { path: 'src/content/bosses.ts', find: '    sprite: SPRITE.boss7,', replace: '    sprite: SPRITE.boss3,' },
  },
];
