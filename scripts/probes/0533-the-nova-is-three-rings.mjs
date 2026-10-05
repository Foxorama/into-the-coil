// The breaks behind docs/decisions/0533-the-nova-is-three-rings.md.
//
// One per guard in tests/ward.test.ts that 0533 added or widened: an inner ring drawn on the edge
// rather than behind it, the edge landing past its last landing while the rings inside it keep the
// nova open, and the pool back at the forty that was already short of one ring.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0533',
    suite: 'tests/ward.test.ts',
    broke: 'the inner rings laid on the edge rather than behind it',
    guard: 'is drawn at the radius it lands at',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const inner = radius - ring.behind;',
      replace: '    const inner = radius;',
    },
  },
  {
    decision: '0533',
    suite: 'tests/ward.test.ts',
    broke: 'the edge landing for as long as the rings inside it keep the nova open',
    guard: 'reaches no farther for the rings that keep it open',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const landing = was - SPRITE_EXTENT.novaArc <= far;',
      replace: '  const landing = true;',
    },
  },
  {
    decision: '0533',
    suite: 'tests/ward.test.ts',
    broke: 'the nova pool back at forty, short of one ring flown forward',
    guard: 'never fills its pool, wherever across the lane',
    edit: {
      path: 'src/app/mount.ts',
      find: '  nova: 180,',
      replace: '  nova: 40,',
    },
  },
];
