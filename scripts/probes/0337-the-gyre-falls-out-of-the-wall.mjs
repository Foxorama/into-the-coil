// The gyre falls out of the wall — docs/decisions/0337-the-gyre-falls-out-of-the-wall.md
//
// Every guard 0337 adds, broken on purpose. `node scripts/prove-guard.mjs 0337`.

export const PROBES = [
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    // The hull never put back on the field: it dies the way the other thirteen die, and vanishes.
    broke: 'the wreck never laid, so the hull vanishes on the step it dies like every other boss',
    guard: 'THE WRECK: it falls out of the wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '        layWreck(w);',
      replace: '        w.wreckDown = false;',
    },
  },
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    // Nothing pulling it down: it comes out of its seat and hangs there.
    broke: 'the wreck never pulled down, so it comes out of its seat and hangs in the air',
    guard: 'THE WRECK: it falls out of the wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '    body.velAcross += wreck.gravity;',
      replace: '    body.velAcross += 0;',
    },
  },
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    // Falling flat: a cog that comes out of its mounting and does not tumble is still being driven.
    broke: 'the wreck falling without tumbling, so it reads as lowered rather than dropped',
    guard: 'THE WRECK: it falls out of the wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '    body.turn = foldTurn(body.turn + wreck.tumble);',
      replace: '    body.turn = foldTurn(body.turn);',
    },
  },
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    /*
      ⚠️ THE FLOOR TAKEN AT THE HULL'S CENTRE RATHER THAN ITS RIM, which is how this one actually
      arrives: the number is the wall's face and it is perfectly correct, and the wreck stops with
      half of itself inside the masonry. 0036's shape — a body whose picture and whose position
      disagree by a radius — and 0027's: the model is consistent the whole way and the picture is
      wrong. It is broken by a radius and not by half a lane on purpose, because a floor moved that
      far reddens *"it never fell"* first and this claim is then never reached.
    */
    broke: 'the wreck resting on the wall’s face by its centre, so half of it is inside the masonry',
    guard: 'THE WRECK: it falls out of the wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const floor = ACROSS_SPAN - PLAYER_MARGIN - body.radius;',
      replace: '    const floor = ACROSS_SPAN - PLAYER_MARGIN;',
    },
  },
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    // The level moving on under the fall: the player is carried away from the thing they just killed.
    broke: 'the world starting again the moment the hull dies, so it scrolls away under the falling wreck',
    guard: 'THE WRECK: it falls out of the wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const beaten = w.bossBeaten && (w.bossRow.wreck === null || w.roomOpen > 0);',
      replace: '  const beaten = w.bossBeaten;',
    },
  },
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    // The wall never parting: the wreck lands and the player is sealed in the room with it.
    broke: 'the far wall never parting, so the player is sealed in the room with the wreck',
    guard: 'THE WRECK: it falls out of the wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.roomOpen < room.opens) w.roomOpen++;',
      replace: '  if (w.roomOpen < 0) w.roomOpen++;',
    },
  },
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    /*
      ⚠️ THE CRASH WITH NO BEAT OF ITS OWN: the wall starts parting on the step the wreck touches the
      floor, so the landing and the way out are one event and neither is read.
    */
    broke: 'the wall parting on the step the wreck lands, so the crash has no beat of its own',
    guard: 'THE WRECK: it falls out of the wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.wreckIn = wreck.settle;',
      replace: '      w.wreckIn = 0;',
    },
  },
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    /*
      ⚠️ THE PAIRING LEFT LIVE OVER A WRECK — the defect as it was actually found, by photographing
      the death on the bench: the player's fire goes on being swallowed by a corpse, which flashes for
      each shot, and where anything else has already taken the hull's health down it dies twice and
      disappears mid-fall.
    */
    broke: 'the player’s fire still pairing with the wreck, so a corpse eats shots and flashes',
    guard: 'and nothing may shoot a wreck',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const shootable = w.bossEntering < 0 && !w.bossBeaten;',
      replace: '    const shootable = w.bossEntering < 0;',
    },
  },
  {
    decision: '0337',
    suite: 'tests/gyre.test.ts',
    /*
      ⚠️ THE ROOM'S OPENING MADE TO DEPEND ON THE WRECK BEING THERE, which is the soft-lock: any path
      at all that empties the pool leaves a finished room that never opens and a run that can neither
      be won nor lost.
    */
    broke: 'the room’s opening made to depend on a wreck still being on the field, so an empty pool seals the run',
    guard: 'and the room opens even if the wreck is gone',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.bossPool.size === 0) w.wreckDown = true;',
      replace: '  if (w.bossPool.size === 0) return;',
    },
  },
];
