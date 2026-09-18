// The wheel comes off its post — docs/decisions/0336-the-wheel-comes-off-its-post.md
//
// Every guard 0336 adds, broken on purpose. `node scripts/prove-guard.mjs 0336`.

export const PROBES = [
  {
    decision: '0336',
    suite: 'tests/gyre.test.ts',
    // The wheel never set off: a phase turns over and the cog stays in its seat.
    broke: 'the wheel never set off by a phase turning over, so the cog stays in its seat all fight',
    guard: 'THE WHEEL: it rises out of its seat',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (opening !== undefined) w.bossWheelIn = opening.rise + opening.spray + opening.sink;',
      replace: '      if (opening === undefined) w.bossWheelIn = 0;',
    },
  },
  {
    decision: '0336',
    suite: 'tests/gyre.test.ts',
    // Drawn bigger than it collides, which is 0036's own defect: the hull hits from a place the
    // picture calls empty.
    broke: 'the hull drawn bigger as it rises and collided at its old size, so it hurts from where the picture is empty',
    guard: 'THE WHEEL: it rises out of its seat',
    edit: {
      path: 'src/app/frame.ts',
      find: '    boss.radius = w.bossRow.radius * boss.swell;',
      replace: '    boss.radius = w.bossRow.radius;',
    },
  },
  {
    decision: '0336',
    suite: 'tests/gyre.test.ts',
    // The hull never spinning: a turret that pops up and stands still is not a Catherine wheel.
    broke: 'the hull not spinning while the wheel is up, so it is a turret rather than a pinwheel',
    guard: 'THE WHEEL: it rises out of its seat',
    edit: {
      path: 'src/app/frame.ts',
      find: '    boss.turn = foldTurn(boss.turn + wheel.spin);',
      replace: '    boss.turn = foldTurn(boss.turn);',
    },
  },
  {
    decision: '0336',
    suite: 'tests/gyre.test.ts',
    // The spokes never turning: every shot leaves on the same heading, so it is a jet and not a wheel.
    broke: 'the spokes never turning over the spray, so the fire leaves on one heading rather than all of them',
    guard: 'THE WHEEL: it rises out of its seat',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const at = (into / wheel.spray) * wheel.turns * Math.PI * 2;',
      replace: '      const at = 0;',
    },
  },
  {
    decision: '0336',
    suite: 'tests/gyre.test.ts',
    // The fire never laid: the row names flames and the layer behind the hull holds only the housing.
    broke: 'the fire never laid, so the row names flames and the hull burns with none of them',
    guard: 'and it catches fire as it is hurt',
    edit: {
      path: 'src/app/frame.ts',
      find: '      flames = Math.min(burn.most, burn.least + Math.floor(through * (burn.most - burn.least)));',
      replace: '      flames = 0;',
    },
  },
  {
    decision: '0336',
    suite: 'tests/gyre.test.ts',
    // The fire not taking hold: the same few flames from the moment it catches to the end of the bar.
    broke: 'the fire’s count never growing, so it is a state that switches on rather than something taking hold',
    guard: 'and it catches fire as it is hurt',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const through = burn.from > 0 ? (burn.from - left) / burn.from : 1;',
      replace: '      const through = 0;',
    },
  },
  {
    decision: '0336',
    suite: 'tests/gyre.test.ts',
    /*
      ⚠️ A WALL THROWN WHILE THE HULL IS FREE-SPINNING, which is 0332's tell gone: the spike names
      nothing for that second, so the wall arrives over an edge nobody was told about.

      ⚠️ **IT WAS AIMED AT 0332's OWN GUARD FIRST AND STAYED GREEN.** That one collects the first
      eight walls off a steady bleed, and whether any of them lands inside a hundred-step wheel is
      luck. The claim needed a guard of its own, driven over a whole fight.
    */
    broke: 'a wall thrown while the hull is free-spinning, so it comes from an edge the spike never named',
    guard: 'and no wall leaves while the hull is spinning',
    edit: {
      path: 'src/app/frame.ts',
      find: '    } else if (notch > w.bossUncoilAt && w.bossWallIn <= 0 && w.bossWheelIn <= 0 && onPoint(w, boss, uncoil)) {',
      replace: '    } else if (notch > w.bossUncoilAt && w.bossWallIn <= 0) {',
    },
  },
];
