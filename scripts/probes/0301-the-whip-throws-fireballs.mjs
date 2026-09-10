// The breaks behind docs/decisions/0301-the-whip-throws-fireballs.md.
//
// ⚠️ THE TRAIL IS ONE FUNCTION AND ONE FIELD, WHICH IS WHY IT NEEDS PROBING RATHER THAN TRUSTING. A
// mechanism this small is the one a later tidy-up removes without a word: the tables would go on
// saying the fireball trails and the screen would stop showing it, which is
// docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md exactly.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0301',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ **THE WHOLE MECHANISM GONE**, which is the state of `main` before this decision: shots fly
      and leave nothing. One line at the call site, and it is the line a reader deletes when they
      cannot see what it is for.
    */
    broke: 'the trail never dropped, so a fireball flies and leaves nothing behind it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    // After the shots have moved, so a mote is dropped where the ball actually is this step — 0301.\n    dropTrails(w);\n',
      replace: '',
    },
    guard: '0301 — THE REPORTED ONE: a shot whose row names a trail drops motes behind it',
  },
  {
    decision: '0301',
    suite: 'tests/flares.test.ts',
    /*
      ⚠️ **THE ROW IGNORED AND EVERYTHING TRAILED**, which is the tidy-up that looks like a
      simplification: drop the lookup, drop the branch, trail the whole pool. It satisfies *the
      fireball trails* perfectly, and it is why the guard asserts the spit does NOT — a mechanism
      that fires for every kind has stopped being a property of the row
      (`docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`).
    */
    broke: 'the row ignored, so every hostile bullet in the game trails fire',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const trail = SHOT_ROWS[shot.kind]!.trail;\n    if (trail === undefined) continue;\n    flare(w, shot.along, shot.across, trail);',
      replace: "    flare(w, shot.along, shot.across, 'ember');",
    },
    guard: '0301 — THE REPORTED ONE: a shot whose row names a trail drops motes behind it',
  },
  {
    decision: '0301',
    suite: 'tests/combat.test.ts',
    /*
      ⚠️ **THE PICTURE GROWN AND THE HURTBOX LEFT WHERE IT WAS**, which is the half of this change a
      hand would skip: the fireball is the one that got bigger, and 0.66 against a 5-unit drawing is
      0.13 — a ball of fire the player can fly through the middle of. `tests/combat.test.ts`'s band
      is what says so, and it is the same guard that caught the blade in the other direction (0294).
    */
    broke: 'the fireball drawn at the void’s size with the tiny bullet’s hurtbox, so it hits nothing it covers',
    edit: {
      path: 'src/content/shots.ts',
      find: "  flame: { sprite: SPRITE.flame, spriteHit: SPRITE.flame, radius: 1.75,",
      replace: "  flame: { sprite: SPRITE.flame, spriteHit: SPRITE.flame, radius: 0.66,",
    },
    guard: 'every body sits inside the band',
  },
];
