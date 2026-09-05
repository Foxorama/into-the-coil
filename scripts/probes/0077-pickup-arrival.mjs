// The breaks behind docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md.
//
// ⚠️ Three of these restore code that SHIPPED and that every guard in the repository was green for.
// That is the point: 0064 and 0066 are both working exactly as written, and the player reported both
// of them as bugs — `docs/decisions/0027-measure-the-picture-not-the-model.md` from the direction it
// warns about, where the model is right and the picture is a wall.
//
// ⚠️ The last two are a cap and a geometry, and they are the only ones here a screenshot could catch.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0077',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly: `driftPickups` assigning `velAlong` instead of easing
      toward it. The pickup's screen-relative speed then goes from the full scroll rate to zero
      between one frame and the next, which is a picture of an impact with nothing there to hit.
    */
    broke: 'the ease removed, so a pickup stops dead at the station',
    guard: 'and it never stops dead, which is what read as a wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '    item.velAlong += (target - item.velAlong) * PICKUP_EASE;',
      replace: '    item.velAlong = target;',
    },
  },
  /*
    ── THE BOB PROBE WAS HERE, AND 0233 RETIRED IT ────────────────────────────────────────────────

    It set `PICKUP_BOB_SPEED` to 0 — *"the bob removed, so a waiting pickup tracks one line for seven
    seconds"* — and its guard was *wanders along the lane while it waits, rather than tracking one
    line*. Since 0233 a waiting pickup wanders the whole box on a heading of its own, so the bob is no
    longer what keeps it off one line and the guard stays green without it: the probe went STILL
    GREEN, which is 0019's verdict. The bob stays in the picture; what it was guarding is now the
    wander's, held by `tests/weapons.test.ts`.
  */
  {
    decision: '0077',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE SECOND REPORTED ONE, restored exactly: 0066's across-only fan. Every piece of a death
      then leaves along one line, which is *"they don't spread out in a random pattern"* — and it is
      the code 0066 argued for at length and shipped.
    */
    broke: 'the along throw removed, so a death scatters along one line again',
    // ⚠️ Re-aimed by 0236: with the throw a flight, a scatter with no along half comes to rest on
    // one line — which is what 0100's guard on the ring measures first.
    guard: '0100 — and the piece is still THROWN',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0243: the throw is `throwPiece`, one indent less.
      find: '  item.velAlong = w.scrollPerStep + Math.cos(angle) * speed;',
      replace: '  item.velAlong = w.scrollPerStep;',
    },
  },
  {
    decision: '0077',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE JITTER LET OFF ITS LEASH, which is the failure the SHARE exists to prevent. 0066's
      guarantee is that no two pieces leave together; a jitter wider than the half-gap can put two
      neighbours on the same heading, and the player loses an upgrade to a coincidence rather than to
      the timer.
    */
    broke: 'the scatter jitter widened past the gap, so two pieces can leave on one heading',
    guard: 'leaves in every direction, and no two pieces travel together',
    // ⚠️ Re-anchored by 0243: the jitter is a share of the gap AND capped (`SCATTER_JITTER_MAX`),
    // so widening the share alone changes nothing; the break is the jitter past both.
    edit: {
      path: 'src/app/frame.ts',
      find: '  const halfGap = share < SCATTER_JITTER_MAX ? share : SCATTER_JITTER_MAX;',
      replace: '  const halfGap = 4 + 0 * share;',
    },
  },
  {
    decision: '0077',
    suite: 'tests/missiles.test.ts',
    // ⚠️ THE THIRD REPORTED ONE, restored exactly: 0051's cap, left behind by 0056's base of zero.
    broke: 'the launcher cap returned to three, which is a rung the ask does not have',
    // ⚠️ Re-aimed by 0233: the tube count is the missile kind's own ladder now, so a cap raised on
    // its own is the cap and the ladder disagreeing — THE FLOORS is the guard that sees that.
    guard: 'THE FLOORS: the last tier lands exactly on them',
    edit: { path: 'src/content/pickups.ts', find: 'const MAX_LAUNCHERS = 2;', replace: 'const MAX_LAUNCHERS = 3;' },
  },
  {
    decision: '0077',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ THE HALF-FIX, and it is the one a hand would actually write. Capping at two without touching
      the geometry leaves the old *centre, then minus, then plus* order in place, so a fully-upgraded
      ship fires one missile down the nose and one off the left wing — off-centre, permanently, and a
      worse picture than the defect being fixed. Nothing about the COUNT is wrong in this state.

      ⚠️ RE-ANCHORED BY docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md, WHICH
      TOOK THE CENTRELINE AWAY ENTIRELY. 0077's claim was *a fully-upgraded ship is symmetric* and it
      still stands word for word; what moved underneath it is where a one-tube ship fires from, so the
      break is written against the new expression and asserts the same thing it always did.
    */
    broke: 'the tube positions left in their old order, so a two-tube ship fires off-centre',
    guard: '0097 — puts the first tube on the across-minus side and the second on the across-plus side',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const side = i === 0 ? -1 : 1;',
      replace: '    const side = i === 0 ? 0 : i === 1 ? -1 : 1;',
    },
  },
];
