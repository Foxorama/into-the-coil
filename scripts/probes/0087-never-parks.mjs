// The breaks behind docs/decisions/0087-a-pickup-never-parks.md.
//
// ⚠️ THIS DECISION IS A SECOND PASS OVER A DEFECT A FIRST PASS ALREADY ANSWERED, so every probe here
// has to fail a guard that `scripts/probes/0077-pickup-arrival.mjs` does not. 0077 made the arrival
// smooth and left the pickup parked; the guards that went with it measure the SMOOTHNESS, and they
// are all perfectly green over the build the player called *"still hit the middle barrier"*. What is
// broken below is the closing, the journey and its destination — three things 0077 had no opinion
// about, because under 0077 a waiting pickup did not move.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0087',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE SHIPPED BEHAVIOUR, PUT BACK — and it is one character. A share of zero is a target of
      exactly the camera's own rate, which is a pickup holding station: the build 0077 landed, eased
      and bobbed and parked at one place on the screen. The report it produced is this decision's
      first line.
    */
    broke: 'the closing share cut to nothing, so a waiting pickup holds station again',
    guard: 'and the wait is a journey that ends where the ship flies',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-aimed by 0233: the closing share is gone and the wander is the closing rate. A wander
      // of zero is the same break — a waiting pickup holding station on one line.
      // ⚠️ Re-aimed again by 0293: the wander is a FLOAT now, and a float of zero is the same
      // break — a waiting pickup holding station on one line.
      find: 'const PICKUP_FLOAT = 0.28;',
      replace: 'const PICKUP_FLOAT = 0;',
    },
  },
  {
    decision: '0087',
    /*
      ⚠️ THE DESTINATION UNPICKED, AND THE JOURNEY LEFT INTACT. `PICKUP_SLOW_AT` is derived so that a
      pickup nobody touches arrives at the ship's own place in the camera's frame exactly as its wait
      runs out; a hand-typed distance is the obvious tidy-up and it looks like the constant this used
      to be. The pickup still slows, still closes, still bobs — it simply ends its wait somewhere
      arbitrary, which nothing but a guard on the destination can see.
    */
    broke: 'the float begun outside the box, so a pickup waits where the ship cannot fly',
    /*
      ⚠️ **Re-aimed by 0233 at the wander's extent, and again by 0293 at the thing that still bites.**
      0087 derived this from the ship's own place so that a pickup nobody touches ARRIVES at it; 0233
      moved it to the front wall of the box; 0293's float does not close on the ship at all, so
      *typed rather than derived* stopped naming a defect — the probe changed a hundred to a hundred
      and the suite stayed **STILL GREEN**, which `npm run prove` reported.

      ⚠️ **WHAT THIS NUMBER DOES NOW IS SAY WHERE THE FLOAT BEGINS**, and it is load-bearing for one
      reason: begun beyond `PLAYER_LEAD` the pickup starts bouncing outside the box, in the part of
      the screen 0100 reported as *"visible but the player cannot get to them"*. That is the same
      failure this probe has always been about, in the mechanism that exists.
    */
    suite: 'tests/pickups.test.ts',
    guard: 'waits somewhere the ship can actually fly to',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const PICKUP_SLOW_AT = PLAYER_LEAD - PICKUP_TURN_ROOM;',
      replace: 'const PICKUP_SLOW_AT = PLAYER_LEAD + 40;',
    },
  },
  /*
    ── THE BOB PROBE WAS HERE, AND 0293 RETIRED IT ─────────────────────────────────────────────────

    It restored the defect this decision found: the bob phase taken off a field that DRIFTS, so it
    advanced the phase rather than offsetting it and the wander ran at a quarter of its stated
    period. A real bug, found by measuring the track rather than by reading the line.

    docs/decisions/0293-a-pickup-floats.md replaced the wander, the bob and the lag with one float,
    and the guard this probe named went with them. It was re-aimed once, at the roll on the bounce
    that answers the same problem the bob did — and came back STILL GREEN, because a pickup meets a
    wall once or twice in a whole wait and no fixture can see two crossings repeat at that cadence.

    So it is deleted rather than pointed at something it never protected. A probe that reddens the
    wrong guard, or none, is worse than an absent one: it reads as cover.
  */
  {
    decision: '0087',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE APPROACH BRANCH DELETED, so a pickup begins its slow close the moment it spawns instead
      of when it reaches the slowdown. It reads as a redundant early return — the line below already
      computes the target — and it is not: without it the whole approach is spent at the closing rate,
      so the pickup starts its wait 280 units out, which is well beyond the box the ship is allowed to
      fly in.

      ⚠️ THIS IS THE FIRST DRAFT OF THIS DECISION, KEPT AS A PROBE. The bob ran during the approach
      too, and a pickup wobbling while it crossed the view read — to anything measuring *has it stopped
      running away* — as one that had already arrived, from a place it was only passing through.
    */
    broke: 'the approach branch deleted, so a pickup begins its wait the moment it spawns',
    guard: 'waits somewhere the ship can actually fly to',
    edit: {
      path: 'src/app/frame.ts',
      /*
        ⚠️ **Re-anchored by 0233**, which reads the distance into a local the wander also uses, and by
        **0293**, which gated the branch on `spin` as well — a floating pickup that drifts back above
        `PICKUP_SLOW_AT` must not fall into the approach again, and did, and reached 182 units.
      */
      find:
        '    if (item.spin === 0 && inView > PICKUP_SLOW_AT) {\n' +
        '      item.velAlong += (0 - item.velAlong) * PICKUP_EASE;\n' +
        '      continue;\n' +
        '    }\n',
      replace: '',
    },
  },
];
