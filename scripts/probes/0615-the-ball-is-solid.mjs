// The breaks behind docs/decisions/0615-the-ball-is-solid.md.
//
// One or more per guard 0615 adds to tests/solid.test.ts, and the reflection it puts in tests/dance.test.ts.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0615',
    suite: 'tests/solid.test.ts',
    broke: 'a ball that goes on through whatever it rams, as it did',
    guard: 'THE REPORTED ONE: flown into a body it cannot break, the ball comes back off it — and never through it',
    edit: { path: 'src/app/frame.ts', find: '    knockRam(w);\n', replace: '' },
  },
  {
    decision: '0615',
    suite: 'tests/solid.test.ts',
    broke: 'a knock that only puts the ball back out of the body and sends it nowhere',
    guard: 'THE REPORTED ONE: flown into a body it cannot break, the ball comes back off it — and never through it',
    edit: { path: 'src/app/frame.ts', find: '  ship.velAlong = bodyAlong + vAlong;\n  ship.velAcross = bodyAcross + vAcross;\n', replace: '' },
  },
  {
    decision: '0615',
    suite: 'tests/solid.test.ts',
    broke: 'a knock off the bodies before the ram has landed, so a body it would have broken is bounced off',
    guard: 'a body the ram breaks it goes on through, slowed by nothing',
    edit: { path: 'src/app/frame.ts', find: '    let ramKills = collideInto(', replace: '    knockRam(w);\n    let ramKills = collideInto(' },
  },
  {
    decision: '0615',
    suite: 'tests/solid.test.ts',
    broke: 'a boss the ball still flies into',
    guard: 'every boss knocks it back, and the ball is never inside one',
    edit: { path: 'src/app/frame.ts', find: '  if (!w.bossBeaten) body = deepest(', replace: '  if (w.bossBeaten) body = deepest(' },
  },
  {
    decision: '0615',
    suite: 'tests/solid.test.ts',
    broke: 'a dance that goes on into a body it cannot break',
    guard: 'off a body it cannot break: turned away from it, thrown off faster, and heard as a bumper',
    edit: { path: 'src/app/frame.ts', find: '      w.danceAlong -= 2 * into * nAlong;\n      w.danceAcross -= 2 * into * nAcross;\n', replace: '' },
  },
  {
    decision: '0615',
    suite: 'tests/solid.test.ts',
    broke: 'a bumper that throws the dance off no faster than it came',
    guard: 'off a body it cannot break: turned away from it, thrown off faster, and heard as a bumper',
    // Re-anchored by 0617, whose speed is the dance's own.
    edit: { path: 'src/app/frame.ts', find: '    w.danceSpeed = w.danceSpeed * dance.kick > dance.thrown ? dance.thrown : w.danceSpeed * dance.kick;\n', replace: '' },
  },
  {
    decision: '0615',
    suite: 'tests/solid.test.ts',
    broke: 'a dance knocked off a body before it has landed, so one it would have broken turns it',
    guard: 'through a body it breaks, on the heading it had',
    edit: { path: 'src/app/frame.ts', find: '    let ramKills = collideInto(', replace: '    knockRam(w);\n    let ramKills = collideInto(' },
  },
  {
    decision: '0615',
    suite: 'tests/solid.test.ts',
    broke: 'a dance that bends at nothing, as 0609’s flew',
    guard: 'THE REPORTED ONE: against the end bosses it spends most of its time in the boss’s half of the screen',
    // Re-anchored by 0617, which asks the bend from its speed's own call.
    edit: { path: 'src/app/frame.ts', find: '  const off = pullDance(w, dance, minAlong, maxAlong);', replace: '  const off = -1;' },
  },
  {
    decision: '0615',
    suite: 'tests/dance.test.ts',
    broke: 'a wall that sends the dance off steeper or shallower than it came',
    guard: 'meets a wall about every half second, off it at the angle it met it, and crosses the whole box',
    edit: { path: 'src/app/frame.ts', find: '  if (along !== 0) w.danceAlong = along * Math.abs(w.danceAlong);', replace: '  if (along !== 0) w.danceAlong = along * Math.abs(w.danceAcross);' },
  },
];
