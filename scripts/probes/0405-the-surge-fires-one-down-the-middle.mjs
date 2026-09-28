// The breaks behind docs/decisions/0405-the-surge-fires-one-down-the-middle.md.
//
// ⚠️ Each puts back one thing the play refused or one way the frame could disagree with the picture.
// The barrel's art has no probe, on 0379's terms: how it reads is a verdict about the picture, owed
// to the play.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0405',
    suite: 'tests/surge.test.ts',
    broke: 'the overdrive firing two pods again',
    guard: '0405, THE REPORTED ONE',
    edit: {
      path: 'src/content/specials.ts',
      find: "pods: { missile: 'straight', count: 1,",
      replace: "pods: { missile: 'straight', count: 2,",
    },
  },
  {
    decision: '0405',
    suite: 'tests/surge.test.ts',
    broke: 'the frame placing pods on the flanks whatever the row says',
    guard: '0405, THE REPORTED ONE',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const side = podSide(j, pods.count);',
      replace: '    const side = j % 2 === 0 ? -1 : 1;',
    },
  },
  {
    decision: '0405',
    suite: 'tests/surge.test.ts',
    broke: 'a centreline pod launched from inside the hull, where the barrel is covered',
    guard: '0405, THE REPORTED ONE',
    edit: {
      path: 'src/app/frame.ts',
      find: 'w.ship.along + (side === 0 ? POD_NOSE : MUZZLE_ALONG),',
      replace: 'w.ship.along + MUZZLE_ALONG,',
    },
  },
];
