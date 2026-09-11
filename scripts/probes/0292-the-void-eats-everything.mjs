// The void eats everything — docs/decisions/0292-the-void-eats-everything.md
//
// Every guard 0292 adds, broken on purpose. `node scripts/prove-guard.mjs 0292`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0292',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION: IT FED ON THE GUNS ALONE.** 0291 said so in
      writing rather than pretending otherwise — *"it feeds on `playerShots` alone… two more
      pairings, each with its own question."* This is that state, restored.
    */
    broke: 'the missiles no longer fed to it, so a seeker flies through a void blast',
    guard: 'THE REPORTED ONE: a MISSILE feeds it too',
    edit: {
      path: 'src/app/frame.ts',
      find: '        blast.health -= missile.damage;',
      replace: '        if (missile.damage < 0) blast.health -= missile.damage;',
    },
  },
  {
    decision: '0292',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE BOMB, WHICH IS THE ONE OF THE THREE THAT IS NOT A BODY.** A blast is a region that
      hurts everything standing in it, so it is not consumed by the void and cannot be paired the way
      the guns and the missiles are.
    */
    broke: 'the bomb’s blast no longer fed to it, so a bomb goes off inside a void and it eats nothing',
    guard: 'and a BOMB feeds it, which is an area rather than a body',
    edit: {
      path: 'src/app/frame.ts',
      find: '        blast.health -= bomb.damage;',
      replace: '        if (bomb.damage < 0) blast.health -= bomb.damage;',
    },
  },
  {
    decision: '0292',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE LIGHTNING, WHICH IS THE ONE THE PLAYER ASKED ABOUT TWICE.** *"It'll be interesting
      to see how it interacts with the lightning gun"*, and then *"that it sucks in the lightning from
      the player's cannon."* The arc is hitscan, so taking this block away is exactly 0291's state:
      the bolt searches enemies and the boss, finds neither in a void, and passes straight through.
    */
    broke: 'the arc no longer pulled into a void blast, so the lightning gun ignores it as it did before',
    guard: 'and the LIGHTNING is sucked in',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0302: the search takes the LINK's reach, which decays per jump. And by 0307,
      // which made it a search along the link's own line rather than round its origin.
      find: '    const eater = voidOnPath(w, fromAlong, fromAcross, toAlong, toAcross, edge);',
      replace: '    const eater = -1;',
    },
  },
  {
    decision: '0292',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND *SUCKS IN* RATHER THAN *may also hit*, WHICH IS THE HALF A REACHABILITY TEST MISSES.**
      Nearest-wins leaves the chain going to whatever is closest, so a void beside an enemy is
      ignored — and the fixture puts the blast ten units off the nose with a serpent on the field, so
      the boss is what the bolt would otherwise take.

      ⚠️ Since 0307 the fixture's drifter stands BEHIND the blast rather than in front of it, because
      a void takes only the bolt it is in the way of; this break still lets the bolt through to it.
    */
    broke: 'the void made one target among many rather than the one that pulls, so the chain passes it by',
    guard: 'and the LIGHTNING is sucked in',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (eater >= 0) {',
      replace: '    if (eater >= 0 && enemy < 0 && boss < 0) {',
    },
  },
];
