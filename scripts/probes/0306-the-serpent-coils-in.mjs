// The serpent coils in — docs/decisions/0306-the-serpent-coils-in.md
//
// Every guard 0306 adds, broken on purpose. `node scripts/prove-guard.mjs 0306`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE COIL DRAWN THROUGH THE MIDDLE RATHER THAN ROUND IT — a ring too tight to leave room, which
      is a coil that reads as one on the sheet and has no gap anybody can learn. The parked ship is
      what goes red, and no geometry in the guard knew the radius.
    */
    broke: 'the coil too tight to leave its middle open, so the ship sitting there is hit',
    guard: 'coils ROUND the middle of the screen leaving the centre open',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'entrance: { centre: { along: 95, across: 50 }, radius: 24, turns: 1.25, speed: 1.5 },',
      replace: 'entrance: { centre: { along: 95, across: 50 }, radius: 9, turns: 1.25, speed: 1.5 },',
    },
  },
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    // Half a turn and away: a swoop, not a coil.
    broke: 'half a turn and away, so it swoops rather than coils',
    guard: 'coils ROUND the middle of the screen leaving the centre open',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'entrance: { centre: { along: 95, across: 50 }, radius: 24, turns: 1.25, speed: 1.5 },',
      replace: 'entrance: { centre: { along: 95, across: 50 }, radius: 24, turns: 0.5, speed: 1.5 },',
    },
  },
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    // The hand-over when the HEAD is clear rather than the tail: the body jumps where it can be seen.
    broke: 'the entrance handed over when the head is off the screen and the body is not',
    guard: 'coils ROUND the middle of the screen leaving the centre open',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return startAlong - e.centre.along + e.turns * TAU * r + out + reach;',
      replace: '  return startAlong - e.centre.along + e.turns * TAU * r + out + reach * 0;',
    },
  },
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    // The body moved rather than laid on the hand-over: a frame of it sliding across the corner.
    broke: 'the body moved to the arrival rather than laid there, so it is drawn sliding across the screen',
    guard: 'coils ROUND the middle of the screen leaving the centre open',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.bossSettle = true;\n',
      replace: '',
    },
  },
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    // Culled across the lane again while it flies off the bottom: the boss dies on its own entrance.
    broke: 'the head culled across the lane during the entrance, so the boss is released off the bottom',
    guard: 'coils ROUND the middle of the screen leaving the centre open',
    edit: {
      path: 'src/app/frame.ts',
      find: '    stepEntities(w.bossPool, w.cameraAlong, w.bossEntering >= 0 ? Number.POSITIVE_INFINITY : undefined, w.bossEntering < 0);',
      replace: '    stepEntities(w.bossPool, w.cameraAlong, w.bossEntering >= 0 ? Number.POSITIVE_INFINITY : undefined, true);',
    },
  },
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    // *"Not-shootable"* dropped: the player's fire lands on the entrance.
    broke: 'the player’s fire landing on the serpent during its entrance',
    guard: 'and nothing it throws, and nothing that hits it, until the fight begins',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const shootable = w.bossEntering < 0;',
      replace: '    const shootable = true;',
    },
  },
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    // *"Fully live"* dropped: the body passes harmlessly over the ship while it enters.
    broke: 'the serpent’s body harmless to a ship during its entrance',
    guard: 'and nothing it throws, and nothing that hits it, until the fight begins',
    edit: {
      path: 'src/app/frame.ts',
      find: '      collideIntoOne(w.bossBody, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, false);',
      replace:
        '      if (w.bossEntering < 0) collideIntoOne(w.bossBody, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, false);',
    },
  },
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    // The head flying the coil facing down the lane the whole way round: what `blit` used to force.
    broke: 'the head never turned to the path, so it flies half the coil backwards',
    guard: 'and its head faces where it flies',
    edit: {
      path: 'src/app/frame.ts',
      find: '    head.turn = turnFor(ENTRANCE_AT[2]!);',
      replace: '    head.turn = 0;',
    },
  },
  {
    decision: '0306',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE MODEL TURNED AND THE PICTURE NOT — the painter handing every blit a turn of zero. Every
      assertion about `head.turn` stays green, which is 0027's whole subject: a guard over the model
      proves the model, and the half of this that the player sees is the half that is painted.
    */
    broke: 'the painter dropping the turn, so the model turns and the picture does not',
    guard: 'and its head faces where it flies',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const turn = e.prevTurn + swing * alpha;',
      replace: '      const turn = 0 * swing * alpha;',
    },
  },
];
