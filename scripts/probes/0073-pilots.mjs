// The breaks behind docs/decisions/0073-an-enemy-is-a-pilot.md.
//
// ⚠️ Five of these seven produce a screen that looks entirely reasonable, and that is the class this
// change is most at risk from: a body that leans towards the player instead of reaching them, an
// orbit that is really an arc, a charger that comes back once instead of twice. None of them errors,
// none of them looks wrong in a screenshot, and every one of them is the reported complaint —
// "every wave is just a wall that you pass by" — restored by a different route.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0073',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE REPORTED ONE, and the shortest route back to it. With the hunt arm inert the lancer is
      exactly what the play-test described: a body on a fixed lane that happens to shoot along it, so
      a player who is not in that lane was never in the fight.
    */
    broke: 'the hunt steering nothing, so a lancer is a wall on a fixed lane again',
    guard: 'REACHES the ship’s lane before it passes them, from the far side and the real spawn distance',
    edit: {
      path: 'src/app/frame.ts',
      find: '        const rate = m.agility * aggression;\n        const gap = ship.across - e.across;\n        e.velAcross = gap > rate ? rate : gap < -rate ? -rate : gap;\n        break;\n      }',
      replace: '        void m;\n        break;\n      }',
    },
  },
  {
    decision: '0073',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE ONE THE FIRST DRAFT ACTUALLY SHIPPED, and no test caught it until one was written in
      seconds rather than in the constant. A steer proportional to the gap overshoots by exactly the
      gap once the rate exceeds the distance left, so the body vibrates on top of the ship — which
      reads as a rendering fault rather than as an enemy.
    */
    broke: 'the hunt steering by the whole gap, so it vibrates on the player instead of arriving',
    guard: 'and settles ON the player rather than vibrating across them',
    edit: {
      path: 'src/app/frame.ts',
      find: '        const rate = m.agility * aggression;\n        const gap = ship.across - e.across;\n        e.velAcross = gap > rate ? rate : gap < -rate ? -rate : gap;',
      replace: '        const rate = m.agility * aggression;\n        const gap = ship.across - e.across;\n        e.velAcross = gap * (rate > 0 ? 2 : 0);',
    },
  },
  {
    decision: '0073',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE TIER AXIS THE PLAY-TEST ASKED FOR BY NAME — *"it can be straightforward dog-fighting
      depending on difficulty."* Dropped, every tier chases identically and the hardest one is only
      tougher and faster, which is the axis it already had.
    */
    broke: 'the tier’s aggression dropped, so every difficulty dog-fights exactly the same',
    guard: 'and a harder tier closes faster, which is what the aggression column is',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const aggression = w.difficulty.aggression;',
      replace: '  const aggression = 1;\n  void w.difficulty.aggression;',
    },
  },
  {
    decision: '0073',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE ANSWER TO THE UNANSWERABLE WAVE, removed. *"We have no way currently to deal with
      enemies that fly past the player"* — a charger given no turns flies past once and is gone,
      which is the wall at its purest.
    */
    broke: 'the looper given no turns, so a charger flies past once and is gone',
    guard: 'crosses the ship more than once, which a wall does not',
    edit: {
      path: 'src/app/frame.ts',
      find: "    else if (row.motion.kind === 'loop') e.turnsLeft = row.motion.turns;",
      replace: "    else if (row.motion.kind === 'loop') e.turnsLeft = 0;",
    },
  },
  {
    decision: '0073',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE OPPOSITE FAILURE, and the one that looks like generosity. A looper that never spends a
      turn dog-fights for ever, and a level accumulates every charger it has ever sent until the pool
      refuses a spawn — at which point waves start silently arriving one body short.
    */
    broke: 'the turn never spent, so every charger dog-fights for ever and the pool fills',
    guard: 'and gives up after its own number of turns rather than orbiting for ever',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0258: the turn is at the box's ends now, not at the ship.
      find: '        if (outward ? inView >= PLAYER_LEAD - LOOP_TURN_ROOM : inView <= PLAYER_ALONG_MARGIN + LOOP_TURN_ROOM) {\n          e.turnsLeft--;',
      replace: '        if (outward ? inView >= PLAYER_LEAD - LOOP_TURN_ROOM : inView <= PLAYER_ALONG_MARGIN + LOOP_TURN_ROOM) {',
    },
  },
  {
    decision: '0073',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE ONE THE FIRST DRAFT GOT WRONG ON PAPER. Deriving the orbit's direction from which side of
      the ship the body is on reverses it halfway round every circle, so the warden swings on an arc
      in front of the player and never goes round. It looks like a dog-fight from one screenshot.

      ⚠️ It also came back STILL GREEN the first time, against a test that asked whether the body had
      been seen ahead of, behind and beside the ship — all three of which a pendulum does. The guard
      now measures the angle it accumulates, which is the thing an arc cannot fake.
    */
    broke: 'the orbit direction derived from the body’s side, so it swings on an arc instead of circling',
    guard: 'gets all the way round the ship — a whole lap, not a swing',
    edit: {
      path: 'src/app/frame.ts',
      find: '        e.velAlong = w.scrollPerStep + (-nAcross * e.spin * rate - nAlong * pull);\n        e.velAcross = nAlong * e.spin * rate - nAcross * pull;',
      replace:
        '        const side = dAcross >= 0 ? 1 : -1;\n' +
        '        e.velAlong = w.scrollPerStep + (-nAcross * side * rate - nAlong * pull);\n' +
        '        e.velAcross = nAlong * side * rate - nAcross * pull;',
    },
  },
  {
    decision: '0073',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE ONE THAT GOES UNSEEABLE. Without the floor, an orbit around a ship pinned at the back of
      its box dips behind the camera's trailing edge — where the player can neither see it nor shoot
      it, while it goes on being a body that can kill them.

      ⚠️ It came back STILL GREEN against a first version of the guard that claimed the body would be
      CULLED. It is not: `cullAlong` sits an `EDGE_MARGIN` — forty units — further back, so it
      survives in the margin, which is worse rather than better. The guard now asserts what the player
      has, which is that it stays on screen.
    */
    broke: 'the orbit allowed behind the camera, so a warden fights from where it cannot be seen',
    guard: 'THE ONE THAT WOULD BE FREE: it stays on screen when the player hides at the very back',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (e.along + e.velAlong < w.cameraAlong + CIRCLE_FLOOR) e.velAlong = w.scrollPerStep;',
      replace: '        void CIRCLE_FLOOR;',
    },
  },
  {
    decision: '0073',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE DEFECT THIS CHANGE ALSO FIXED, and it had been in the game since enemies could shoot.
      0059 put this test on the `across` axis when the roam made those edges reachable; the leading
      edge never got one, so every wave spent about two seconds of its approach firing from beyond
      what the device can show. `reports/medium-played-2026-08-07.md` has the arithmetic.
    */
    broke: 'the leading-edge check removed, so a wave shoots for two seconds before it can be seen',
    guard: 'THE REPORTED DEFECT: a body beyond the view fires nothing',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (e.along - e.radius > w.cameraAlong + w.view.alongSpan) continue;',
      replace: '',
    },
  },
];
