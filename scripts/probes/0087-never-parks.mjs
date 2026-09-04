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
      find: 'const PICKUP_WANDER = 0.28;',
      replace: 'const PICKUP_WANDER = 0;',
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
    broke: 'the station typed rather than derived, so the wait begins nowhere in particular',
    // ⚠️ Re-aimed by 0233 at the guard that can see it: the wait is a wander of the box now, and
    // where it begins is the front wall — a typed distance is a wander that starts in the middle
    // of the screen, which only a guard on the wander's own extent notices.
    suite: 'tests/weapons.test.ts',
    guard: 'wanders the whole box',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0233: the wait begins at the front wall of the box now, and a typed number
      // is a wander that begins in the middle of the screen.
      find: 'const PICKUP_SLOW_AT = PLAYER_LEAD - PICKUP_TURN_ROOM;',
      replace: 'const PICKUP_SLOW_AT = 100;',
    },
  },
  {
    decision: '0087',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE BOB'S PHASE PUT BACK ON A MOVING QUANTITY, which is the defect this decision found rather
      than one it introduced. `item.across` drifts, so it does not offset the phase — it advances it,
      about three times faster than the camera does, and the lag then attenuates the bob to a third of
      the amplitude the constant describes.

      ⚠️ IT IS THE EDIT ANYBODY WOULD MAKE, because `across` is a field the pickup already has and
      `bobPhase` is one it had to be given. The picture is a pickup that still bobs — just too little
      to come forward, which is the thing 0077's guard is about and the thing nothing else can see.
    */
    broke: 'the bob’s phase taken from a field that drifts, so the wander runs at a quarter of its period',
    // ⚠️ Re-aimed by 0233 at 0064's *it stops running away*, and that caught it by a sixth of a
    // second. Re-aimed again by 0234: a third weapon face lengthened the wait and the margin went the
    // other way (STILL GREEN), so the guard is now the bob's own rhythm in seconds — the ease smears
    // a phase that runs off `across` to nearly nothing, and the pickup turns back only where the
    // wander does.
    guard: 'and the bob is a bob and not a shiver',
    edit: {
      path: 'src/app/frame.ts',
      find: '      PICKUP_BOB_SPEED * Math.sin(w.cameraAlong / PICKUP_BOB_UNITS + item.bobPhase);',
      replace: '      PICKUP_BOB_SPEED * Math.sin(w.cameraAlong / PICKUP_BOB_UNITS + item.across);',
    },
  },
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
      // ⚠️ Re-anchored by 0233, which reads the distance into a local the wander also uses.
      find:
        '    if (inView > PICKUP_SLOW_AT) {\n' +
        '      item.velAlong += (0 - item.velAlong) * PICKUP_EASE;\n' +
        '      continue;\n' +
        '    }\n',
      replace: '',
    },
  },
];
