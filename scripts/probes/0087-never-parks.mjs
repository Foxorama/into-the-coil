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
    broke: 'the float given a heading it keeps, so a bounce is a reflection and two walls are a loop',
    /*
      ── ⚠️ THIS RESTORED THE BOB'S PHASE BUG, AND 0293 LEFT IT NOTHING TO RESTORE ────────────────

      It put the bob's phase back on `item.across` — a field that DRIFTS, so it advanced the phase
      rather than offsetting it and the wander ran at a quarter of its stated period. A real bug,
      found by measuring the track rather than by reading the line, and worth the probe it got.

      ⚠️ **THERE IS NO BOB NOW.** 0293 replaced the wander, the bob and the lag with one float at one
      speed, on the report that the three together read as *"random speed and direction weirdly… really
      weird and wonky"*, and the guard this probe named went with them. **A probe whose guard no longer
      exists cannot be re-anchored** — it can only be deleted, or pointed at something it never
      protected, and the second is how a probe becomes a tick.

      ⚠️ **SO IT IS RE-AIMED AT THE THING THAT REPLACED WHAT IT WAS ABOUT.** The bob existed to stop a
      waiting pickup holding one line; the float's answer to the same problem is the kick on the
      bounce, without which two parallel walls reflect a straight line onto itself for ever. Same
      claim, this decision's mechanism.
    */
    guard: '0293 — and it turns only where it hits something',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const kick = w.floatRng.range(-PICKUP_BOUNCE_KICK, PICKUP_BOUNCE_KICK);',
      replace: '  const kick = 0;',
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
