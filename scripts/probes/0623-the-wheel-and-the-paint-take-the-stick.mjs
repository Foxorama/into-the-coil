// The breaks behind docs/decisions/0623-the-wheel-and-the-paint-take-the-stick.md.
//
// ⚠️ The right stick steers the paint gun's string, where the wheel is thrown, and a wheel already hanging. Each
// half alone would pass the other's guard.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0623',
    suite: 'tests/aim.test.ts',
    broke: 'the paint gun firing straight ahead whatever the stick says',
    guard: 'the paint gun’s string goes where the stick points',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0667, which fans a volley of several balls about the same aim.
      find: '    const angle = w.weapon.aim * w.intent.aim + first + step * b + w.paintRng.range(-paint.scatter, paint.scatter);',
      replace: '    const angle = 0 * w.intent.aim + first + step * b + w.paintRng.range(-paint.scatter, paint.scatter);',
    },
  },
  {
    decision: '0623',
    suite: 'tests/aim.test.ts',
    broke: 'the wheel thrown straight ahead whatever the stick says',
    guard: 'the wheel is thrown to hang where the stick points',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const aim = w.weapon.aim * w.intent.aim;\n  disc.fromAlong',
      replace: '  const aim = 0 * w.intent.aim;\n  disc.fromAlong',
    },
  },
  {
    decision: '0623',
    suite: 'tests/aim.test.ts',
    broke: 'a hanging wheel deaf to the stick',
    guard: 'a pushed stick swings a hanging wheel round the ship',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.intent.aim !== 0 && w.weapon.aim !== 0 && b.lifeFor > wheel.fade) {',
      replace: '    if (false && w.intent.aim !== 0 && w.weapon.aim !== 0 && b.lifeFor > wheel.fade) {',
    },
  },
  {
    decision: '0623',
    suite: 'tests/aim.test.ts',
    broke: 'a hanging wheel sprung back to straight ahead when the stick is let go',
    guard: 'a pushed stick swings a hanging wheel round the ship',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.intent.aim !== 0 && w.weapon.aim !== 0 && b.lifeFor > wheel.fade) {',
      replace: '    if (w.weapon.aim !== 0 && b.lifeFor > wheel.fade) {',
    },
  },
];
