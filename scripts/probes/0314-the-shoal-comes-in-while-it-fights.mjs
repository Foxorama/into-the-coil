// The shoal comes in while it fights — docs/decisions/0314-the-shoal-comes-in-while-it-fights.md
//
// Every guard 0314 adds, broken on purpose. `node scripts/prove-guard.mjs 0314`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE ESCORT CALLING NOBODY, which is the shape the phase had before this decision minus the
      summons: the fish throws and the field stays empty. `standing: 0` rather than a huge `every`,
      because the first call of a phase lands on the step it opens — a gap nobody reaches is a thing
      this mechanism deliberately does not have.
    */
    broke: 'the escort keeping nobody standing, so the phase throws into an empty field',
    guard: 'THE ASKED-FOR ONE: the adds come in WHILE it is throwing',
    edit: {
      path: 'src/content/bosses.ts',
      find: "escort: { enemy: 'kite', count: 3, formation: 'vee', from: 'sides', standing: 6, every: 150 } },",
      replace: "escort: { enemy: 'kite', count: 3, formation: 'vee', from: 'sides', standing: 0, every: 150 } },",
    },
  },
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE OTHER HALF OF THE SAME CLAIM: the phase back to a summons, with the escort still on
      it. Adds arrive, so *did anything come in* is greener than ever — and the volley that called them
      throws nothing, which is the whole of what was reported.
    */
    broke: 'the escorted phase made a summons again, so the adds ARE the attack after all',
    guard: 'THE ASKED-FOR ONE: the adds come in WHILE it is throwing',
    edit: {
      path: 'src/content/bosses.ts',
      find: "patrolScale: 1.5, stance: { kind: 'volley' }, look: null, shot: null, attack: null, escort:",
      replace: "patrolScale: 1.5, stance: { kind: 'volley' }, look: null, shot: null, attack: { kind: 'summon', enemy: 'kite', count: 3, formation: 'vee', from: 'sides', standing: 6 }, escort:",
    },
  },
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    // The shoal coming for the PLAYER, which is every other add in the game and is what makes this one
    // worth a decision: a body with somewhere else to be.
    broke: 'the minnow hunting the ship instead of swimming for the fish',
    guard: 'a minnow swims for the FISH and not for the player',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    motion: { kind: 'feed', agility: 0.62, feeds: 14 },",
      replace: "    motion: { kind: 'hunt', agility: 0.62 },",
    },
  },
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE TURN DROPPED, which is what the sprite sheet caught and no number would have: the shoal
      swims up the lane to the fish drawn facing down it, tail first, with every assertion about where
      it IS staying green. 0027's subject on a body rather than on a boss.
    */
    broke: 'the minnow not turned to its heading, so the shoal swims to the fish tail first',
    guard: 'a minnow swims for the FISH and not for the player',
    edit: {
      path: 'src/app/frame.ts',
      find: '        e.turn = turnFor(Math.atan2(dAcross, dAlong));',
      replace: '        e.turn = 0;',
    },
  },
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    // Nothing eaten: the shoal arrives at the hull and passes through it, so letting one by costs the
    // player nothing and the reason to shoot them is gone.
    broke: 'the shoal never eaten, so reaching the fish costs the player nothing',
    guard: 'one that gets there is EATEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    feedTheLord(w);\n',
      replace: '',
    },
  },
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE CEILING DROPPED — and this is the one that would have shipped. A phase is keyed to
      remaining health, so an unclamped heal walks the fight backwards through the table: the look, the
      cadence and the attack revert, and 0111's phase burst fires again on the way back down.
    */
    broke: 'the feed unclamped, so a shoal can push the fish back into a phase it had left',
    guard: 'feeding can never push it back into a phase it has left',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const fed = Math.min(lord.health + row.motion.feeds, ceiling);',
      replace: '    const fed = lord.health + row.motion.feeds;',
    },
  },
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    // Every call of the shoal over one edge: the flanking entry 0262 was reported for, undone on the
    // mechanism that inherited it.
    broke: 'the escort’s side never alternating, so the shoal is a file after all',
    guard: 'and the shoal comes in from the SIDES',
    edit: {
      path: 'src/app/frame.ts',
      find: '        w.bossEscortSide = w.bossEscortSide > 0 ? -1 : 1;',
      replace: '        w.bossEscortSide = 1;',
    },
  },
];
