// The breaks behind docs/decisions/0100-a-level-places-its-pickups-too.md.
//
// ⚠️ BOTH OF THESE ARE THE SHIPPED CODE, and that is what makes this decision different from the
// four before it. The other probes in this repository restore a state that was once deliberate; these
// two restore a state that was simply wrong and that every guard in the repository was green over —
// for levels two through seven, since docs/decisions/0076-a-level-has-an-origin.md landed.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0100',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE DEFECT, PUT BACK — and it is one term. 0076 made a level's script relative to wherever
      the camera had got to and translated the waves and the boss and not this. On level one the
      origin is zero and nothing shows; on level two it is about 6,400, so all nine pickups land
      fifteen hundred units behind the camera and are culled on the step they spawn.

      ⚠️ EVERY OTHER PICKUP GUARD IS GREEN OVER THIS, because every one of them runs level one. The
      scheduling side is in level coordinates and stays correct, so `nextPickup` still walks the whole
      list — the model believes it offered nine pickups and the player sees none.
    */
    broke: 'the level origin dropped from a pickup’s placement, which is how it shipped',
    guard: '0100 — THE REPORTED ONE: every authored pickup reaches the screen, at a non-zero origin',
    edit: {
      path: 'src/app/frame.ts',
      find: '  reset(item, entry.at + w.levelOrigin, entry.lane, row, kind);',
      replace: '  reset(item, entry.at, entry.lane, row, kind);',
    },
  },
  {
    decision: '0100',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE ORIGIN ADDED TWICE, which is the mirror image and the mistake a hand makes while fixing
      the one above: translate at the placement AND at the scheduling, and every pickup is now
      thousands of units too far AHEAD. It never arrives either, and a guard that only checked *not
      behind the camera* would be perfectly happy.
    */
    broke: 'the origin added at the scheduling as well, so every pickup is placed a level ahead',
    guard: '0100 — THE REPORTED ONE: every authored pickup reaches the screen, at a non-zero origin',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const horizon = spawnAlong(w.cameraAlong) - w.levelOrigin;',
      replace: '    const horizon = spawnAlong(w.cameraAlong) + w.levelOrigin;',
    },
  },
  {
    decision: '0100',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE OTHER HALF OF THE REPORT, PUT BACK: a scatter with no wall on the along axis. The across
      axis has bounced off the lane since the scatter existed; nothing ever stopped a piece leaving
      the player's BOX, which begins at `PLAYER_ALONG_MARGIN` while the view begins at the camera.
      Everything in between is on the screen and out of reach — *"visible but the player cannot get to
      them"*.
    */
    // ⚠️ Re-aimed by 0256: the throw is the mid-boss's drop now, and the walls are the same walls.
    broke: 'the along bounce removed, so a drop strands pieces below the player’s box',
    guard: '0100 — THE REPORTED ONE: a scatter never leaves a piece where the ship cannot reach it',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0236: the bounce lives in the throw's flight now, which `turnsLeft`
      // counts. The break is the two walls taken out of the flight; the flight still runs its
      // course, so a piece thrown backward crosses the margin and keeps going.
      find: '      if (inView <= PLAYER_ALONG_MARGIN) item.velAlong = w.scrollPerStep + Math.abs(departure);\n      else if (inView >= PLAYER_LEAD) item.velAlong = w.scrollPerStep - Math.abs(departure);\n      continue;',
      replace: '      void inView;\n      void departure;\n      continue;',
    },
  },
  {
    decision: '0100',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE BOUNCE TURNED INTO A CLAMP, which is the fix a hand writes first and which deletes the
      feature it is protecting. Pinning the piece to the wall satisfies *never out of reach* perfectly
      and leaves the whole scatter stacked on one line —
      docs/decisions/0066-a-death-scatters-what-it-took.md is a PICTURE of pieces flying off a wreck,
      and a stack is not one.
    */
    broke: 'the bounce written as a clamp, so the whole scatter stacks on the wall',
    guard: '0100 — and the piece is still THROWN, so the bounce did not turn the ring into a clamp',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (inView <= PLAYER_ALONG_MARGIN) item.velAlong = w.scrollPerStep + Math.abs(departure);',
      replace: '      if (inView <= PLAYER_ALONG_MARGIN) item.velAlong = w.scrollPerStep;',
    },
  },
];
