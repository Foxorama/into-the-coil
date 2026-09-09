// The void has an appetite — docs/decisions/0291-the-void-has-an-appetite.md
//
// Every guard 0291 adds, broken on purpose. `node scripts/prove-guard.mjs 0291`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0291',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION: A PLAYER'S SHOT CANNOT TOUCH AN ENEMY'S.** Hostile
      bullets collide with the ship and with nothing else, for every bullet in the game. Taking the
      row's flag away is that state exactly — the pass over the hostile pool leaves on the first line.
    */
    broke: 'the void’s appetite taken off the row, so the player’s fire passes through it as it always did',
    guard: 'THE REPORTED ONE: a void blast eats the player’s fire',
    edit: {
      path: 'src/content/shots.ts',
      find: 'fission: SPENT_BY_ARRIVING, swallows: true }',
      replace: 'fission: SPENT_BY_ARRIVING }',
    },
  },
  /*
    ── ⚠️ THERE IS NO PROBE FOR THE SWEEP, AND THE HARNESS IS WHY THERE IS NOT ──────────────────────

    One was written — replace `overlaps` with a distance between two current positions, which is the
    bug the first version of `feedVoids` actually had — and `prove-guard` reported it **STILL GREEN**.
    It is right. A pulse closes about 3.5 units a step against a reach of about 3.1, so it cannot pass
    through a blast this size in one step whichever way the test is written; the sampled version is
    wrong in principle and indistinguishable in this fight.

    ⚠️ **SO THE SWEEP IS NOT A CLAIM THIS DECISION HOLDS — it is `src/sim/collide.ts`'s helper, used
    the way every other pairing in the game uses it, and guarded where it lives.** Leaving a probe
    here that reddens nothing would be 0019's own failure wearing a tick: a probe that cannot break
    its guard proves that the guard does not hold the thing, and the honest answer is to say so rather
    than to weaken the guard until the probe passes.
  */
  {
    decision: '0291',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE BURST DROPPED, WHICH IS THE OTHER HALF OF THE SENTENCE.** *Eat x amount of damage
      and then explode in a void blast.* A blast that is eaten and leaves nothing behind is a bullet
      the player deletes for free, and the pool shrinks through the thing that was supposed to be the
      hazard.
    */
    broke: 'the eaten blast leaving nothing behind, so it is deleted rather than exploded',
    guard: 'THE REPORTED ONE: a void blast eats the player’s fire',
    edit: {
      path: 'src/app/frame.ts',
      find: '    for (let k = 0; k < VOID_SHARDS; k++) {',
      replace: '    for (let k = 0; k < 0; k++) {',
    },
  },
  {
    decision: '0291',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE SWELL DROPPED, SO NOTHING ON SCREEN SAYS IT IS EATING.** 0036's own subject: an
      event the model resolves and the picture never mentions gets reported as a collision fault that
      does not exist. A flash cannot stand in for it here — the void's hurt sprite is its own sprite.
    */
    broke: 'the blast no longer growing as it feeds, so a swallowed pulse looks like one that passed through',
    guard: 'THE REPORTED ONE: a void blast eats the player’s fire',
    edit: {
      path: 'src/app/frame.ts',
      find: '      blast.swell *= VOID_SWELL;\n      blast.radius *= VOID_SWELL;',
      replace: '',
    },
  },
  {
    decision: '0291',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE APPETITE GIVEN TO EVERY BULLET THE SERPENT THROWS**, which is the half that keeps
      this one shot special. A game where the guns clear the screen of hostile fire is a different
      game from the one in `docs/game.md`; the acid is thrown three times as often and is the one that
      would be noticed.
    */
    broke: 'the acid given an appetite too, so the guns clear the screen of hostile fire',
    guard: 'and nothing else the serpent throws can be shot out of the air',
    edit: {
      path: 'src/content/shots.ts',
      find: "  acid: { sprite: SPRITE.acid, spriteHit: SPRITE.acid, radius: 1.5, health: 1, damage: 1, speed: 0.8, fission: SPENT_BY_ARRIVING },",
      replace:
        '  acid: { sprite: SPRITE.acid, spriteHit: SPRITE.acid, radius: 1.5, health: 1, damage: 1, speed: 0.8, ' +
        'fission: SPENT_BY_ARRIVING, swallows: true },',
    },
  },
];
