// The breaks behind docs/decisions/0622-the-water-breaks-at-its-end.md.
//
// ⚠️ The Water Cannon's end bells out and splashes. Back at 0610's tip, the end is no wider; a straight cone to
// the new tip is as wide at the end and fat all the way; and without its crown the tip is the drops off the
// edges alone.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0622',
    suite: 'tests/duck.test.ts',
    broke: 'the tip back at 0610’s width',
    guard: 'bells out at its end',
    edit: {
      path: 'src/content/specials.ts',
      find: 'width: 1.4, tipWidth: 5.5, flare: 1.7,',
      replace: 'width: 1.4, tipWidth: 4, flare: 1.7,',
    },
  },
  {
    decision: '0622',
    suite: 'tests/duck.test.ts',
    broke: 'a straight cone to the wider tip, fat all along its run',
    guard: 'bells out at its end',
    edit: {
      path: 'src/content/specials.ts',
      find: 'width: 1.4, tipWidth: 5.5, flare: 1.7,',
      replace: 'width: 1.4, tipWidth: 5.5, flare: 1,',
    },
  },
  {
    decision: '0622',
    suite: 'tests/duck.test.ts',
    broke: 'no splash off the tip',
    guard: 'throws a crown of splash off its tip',
    edit: {
      path: 'src/render/scene.ts',
      find: '      for (let d = 0; d < JET_SPLASHES; d++) {',
      replace: '      for (let d = 0; d < 0; d++) {',
    },
  },
];
