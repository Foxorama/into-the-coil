// The breaks behind docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md.
//
// ⚠️ Two reported numbers, and each has a probe on BOTH sides of it. A reach that grows until nothing
// can be missed is not a more forgiving game — it takes away the choice 0052's cycling pickup is
// built on — so the pair of probes below hold a corridor rather than a floor.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0056',
    suite: 'tests/missiles.test.ts',
    // ⚠️ THE REPORTED ONE, restored exactly: 0051's base tube. Every missile test still passes with
    // this in place except the one that says the weapon has to be found.
    broke: 'the base ship given a launcher again, so a run opens with both weapons',
    guard: 'fires nothing at all until a launcher is found',
    /*
      ⚠️ Re-anchored by 0083, and again on 2026-08-10 when the interpolation went. The tubes are a
      capped COUNT now rather than a line from a base to a cap — *"upgrades for missiles should be 1
      tube, 2 tubes, faster fire rate"*, reported from play — so *the ship opens with a launcher* is
      a `+ 1` instead of a moved base. Same break, same guard: a ship that opens with both weapons.
    */
    edit: {
      path: 'src/content/pickups.ts',
      find: '  const launchers = tubes > MAX_LAUNCHERS ? MAX_LAUNCHERS : tubes;',
      replace: '  const launchers = tubes + 1 > MAX_LAUNCHERS ? MAX_LAUNCHERS : tubes + 1;',
    },
  },
  {
    decision: '0056',
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ The same bug one level in, and INVISIBLE IN THE MISSILE COUNT — which is why it has a guard
      of its own. With no tube the volley loop runs zero times either way, so nothing is fired and
      everything looks right; what changes is that the cadence reaches zero, resets, and is at a
      position nobody chose when a launcher finally lands.
    */
    broke: 'the missile clock left running with no tube, so a found launcher fires immediately',
    guard: 'does not run the missile clock down while it has nothing to fire from',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.weapon.launchers === 0) return;\n  w.missileIn--;',
      replace: '  w.missileIn--;',
    },
  },
  {
    decision: '0056',
    suite: 'tests/pickups.test.ts',
    // The reach back to what it was. The guard is a fraction of the lane rather than the multiplier,
    // so this fails on the distance the player flies and not on the constant it is written from.
    broke: 'the collect reach returned to the hull, so a pass that felt like a hit is a miss',
    guard: 'is taken from 5% of the lane away',
    edit: { path: 'src/app/frame.ts', find: 'const COLLECT_REACH = 1.8;', replace: 'const COLLECT_REACH = 1;' },
  },
  {
    decision: '0056',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ The other side of the corridor, and the one a report like this invites. *"Slightly too hard
      to pick up"* is answered by making it easier, and there is no natural stopping point on that
      road — a reach nothing can miss deletes the decision 0052 is about, which is WHICH of the two
      faces the player flies for.
    */
    broke: 'the collect reach grown until a pickup an eighth of the lane away collects itself',
    guard: 'is still MISSED from far enough away',
    edit: { path: 'src/app/frame.ts', find: 'const COLLECT_REACH = 1.8;', replace: 'const COLLECT_REACH = 8;' },
  },
];
