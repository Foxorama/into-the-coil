// The pterodactyl flies — docs/decisions/0483-the-pterodactyl-flies.md
//
// Every guard 0483 adds, broken on purpose. `node scripts/prove-guard.mjs 0483`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0483',
    suite: 'tests/quetzal.test.ts',
    // The report, put back: the bird reverses and stops in one step.
    broke: 'the patrol with no ease',
    guard: 'THE REPORTED ONE, IN LANES AND SECONDS',
    edit: {
      path: 'src/content/bosses.ts',
      find: "move: { kind: 'patrol', ease: 24 },",
      replace: "move: { kind: 'patrol' },",
    },
  },
  {
    decision: '0483',
    suite: 'tests/quetzal.test.ts',
    // Eased at the edges and stopped dead by the brace: the half of the corner a turn does not show.
    broke: 'no slowing before a beam',
    guard: 'THE REPORTED ONE, IN LANES AND SECONDS',
    edit: {
      path: 'src/app/boss.ts',
      find: 'const want = bracing ? 0 : top * direction;',
      replace: 'const want = bracing && false ? 0 : top * direction;',
    },
  },
  {
    decision: '0483',
    suite: 'tests/quetzal.test.ts',
    // The turn read at the hard edge alone: an eased hull coasts past it.
    broke: 'the turn started at the edge rather than at the stopping distance',
    guard: 'THE REPORTED ONE, IN LANES AND SECONDS',
    edit: {
      path: 'src/app/boss.ts',
      find: '(v > 0 && boss.across + boss.radius + coast >= ACROSS_SPAN)',
      replace: '(v > 0 && boss.across + boss.radius >= ACROSS_SPAN)',
    },
  },
  {
    decision: '0483',
    suite: 'tests/quetzal.test.ts',
    // The lean the wrong way: the nose points where the bird has been.
    broke: 'the bank with the velocity’s sign',
    guard: 'THE NOSE POINTS WHERE IT IS GOING',
    edit: {
      path: 'src/app/boss.ts',
      find: 'boss.turn = (-row.bank * boss.velAcross)',
      replace: 'boss.turn = (row.bank * boss.velAcross)',
    },
  },
  {
    decision: '0483',
    suite: 'tests/quetzal.test.ts',
    // Working on the dive and gliding on the climb.
    broke: 'the climb read toward the bottom of the screen',
    guard: 'THE FLAP FOLLOWS THE STROKE',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const climbing = top > 0 ? -head.velAcross / top : 0;',
      replace: 'const climbing = top > 0 ? head.velAcross / top : 0;',
    },
  },
  {
    decision: '0483',
    suite: 'tests/quetzal.test.ts',
    // A beam thrown mid-slide from a hull still leaning: its roots turned off the guns.
    broke: 'the hull not levelled as it throws',
    guard: 'THE WINGS AND THE MOUTH, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '      if (row.bank !== undefined) boss.turn = 0;',
      replace: '',
    },
  },
];
