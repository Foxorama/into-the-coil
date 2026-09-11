// The serpent is armoured — docs/decisions/0307-the-serpent-is-armoured.md
//
// Every guard 0307 adds, broken on purpose. `node scripts/prove-guard.mjs 0307`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0307',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION: THE BODY WAS ALL ONE ANIMAL.** Everything that
      landed on the flank was spent on the head in full, which is what made the shuriken — the one
      gun whose shots ride up a body — three times the others against this boss.
    */
    broke: 'the body’s share ignored, so every hit on the flank is spent on the head in full again',
    guard: '0307 — and the body is armour',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return taken * chain.hurt;',
      replace: '  return taken;',
    },
  },
  {
    decision: '0307',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE HURT TWIN ON A FLANK THAT TOOK NOTHING.** `collideInto` lights every body it lands on,
      so without the reset the armour flashes white for a hit the model threw away — 0036 pointed the
      other way, the picture saying HIT over a model that says miss.
    */
    broke: 'the armoured flank left flashing hurt for shots that took nothing',
    guard: '0307 — and the body is armour',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (chain.hurt === 0) node.flashFor = 0;\n',
      replace: '',
    },
  },
  {
    decision: '0307',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE SPARK, WHICH IS WHAT A GLANCE LOOKS LIKE.** A pulse's arrival has always been told by
      the flash on the body; take the flash away and do not hand the pairing the log, and the shot
      simply vanishes into the animal — the collision bug that play reports keep filing.
    */
    broke: 'the pulse’s pairing with armour left without the hit log, so a glance leaves no mark',
    guard: '0307 — and the body is armour',
    edit: {
      path: 'src/app/frame.ts',
      find: 'armoured ? w.hits : bladeHits);',
      replace: 'bladeHits);',
    },
  },
  {
    decision: '0307',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **0292's PULL, PUT BACK: ANY VOID WITHIN THE BOLT'S LENGTH TAKES IT, FROM ANY DIRECTION.** That
      is the reported state — the lightning spending nine volleys in ten on voids and shards it was not
      aimed through — written as the search it used to be, round the origin rather than along the line.
    */
    broke: 'a void anywhere within the bolt’s length taking it again, whether or not it is in the way',
    guard: 'a void BESIDE the bolt’s line does not take it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (offAlong * offAlong + offAcross * offAcross > blast.radius * blast.radius) continue;',
      replace: '    if (Math.sqrt(dAlong * dAlong + dAcross * dAcross) - blast.radius > Math.sqrt(length2)) continue;',
    },
  },
  {
    decision: '0307',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE NUMBER THAT WAS MEASURED AND TURNED DOWN.** 540 put the shuriken back exactly where it was
      and the lightning at twenty-two seconds from its best place — under 0260's forty, which this
      guard holds in the fight itself now that the arithmetic cannot describe an armoured boss.
    */
    broke: 'the serpent at 540, where the lightning kills it in twenty-two seconds from its best place',
    guard: 'flown at the cap on the tuned tier',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    health: 1000,',
      replace: '    health: 540,',
    },
  },
];
