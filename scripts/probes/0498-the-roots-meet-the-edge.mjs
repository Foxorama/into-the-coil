// The roots meet the edge — docs/decisions/0498-the-roots-meet-the-edge.md
//
// Every guard 0498 adds, broken on purpose. `node scripts/prove-guard.mjs 0498`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0498',
    suite: 'tests/serpent.test.ts',
    // The frame hung from the near edge again: the phone's far roots at four fifths, sky past them.
    broke: 'the root frame placed from the screen’s near edge, so a wider screen shows sky past it',
    guard: 'THE REPORTED ONE, IN SHARES OF THE SCREEN: the far roots stand where they stand on a 16:9 monitor on a phone and on the widest screen too, rather than four fifths of the way over with sky past them',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const hung = piece.entrance ? 0 : past;',
      replace: '      const hung = piece.entrance ? 0 : 0 * past;',
    },
  },
];
