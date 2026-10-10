// The breaks behind docs/decisions/0588-the-rings-are-thrown.md: the stick never read, the volley never
// turned, every gun steered, and the rings never facing their flight.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0588',
    suite: 'tests/aim.test.ts',
    broke: 'the right stick read as nothing',
    guard: 'is the aim across the lane',
    edit: { path: 'src/app/pad.ts', find: '        intent.aim += ry;', replace: '        intent.aim += 0;' },
  },
  {
    decision: '0588',
    suite: 'tests/aim.test.ts',
    broke: 'the volley fired straight ahead whatever the stick says',
    guard: 'THE ASK: the ray’s pulses go where the stick points',
    edit: { path: 'src/app/frame.ts', find: '  const aim = w.weapon.aim * w.intent.aim;', replace: '  const aim = 0 * w.intent.aim;' },
  },
  {
    decision: '0588',
    suite: 'tests/aim.test.ts',
    broke: 'every gun steered by the stick, not only the ray',
    guard: 'every other gun ignores the stick entirely',
    edit: { path: 'src/content/pickups.ts', find: '    aim: gunRow.aim,', replace: '    aim: Math.PI / 8,' },
  },
  {
    decision: '0588',
    suite: 'tests/aim.test.ts',
    broke: 'a steered ring left facing straight up the lane',
    guard: 'THE ASK: the ray’s pulses go where the stick points',
    edit: { path: 'src/app/frame.ts', find: '      shot.turn = angle;\n      shot.prevTurn = angle;', replace: '      shot.turn = 0;\n      shot.prevTurn = 0;' },
  },
];
