// The breaks behind docs/decisions/0391-a-target-takes-a-blade-so-often.md.
//
// Asked for: *"let's cap the max number of shuriken hits on any one target"*, and with it *"we can have
// the serpent boss on level one have hits count on body as well."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0391',
    suite: 'tests/blade-ceiling.test.ts',
    // No ceiling: the hydra's five heads take the blades five heads' worth, as they did.
    broke: 'the ceiling gone, so a target takes a blade as often as one crosses it',
    guard: 'THE REPORTED ONE, IN LANDINGS A SECOND',
    edit: {
      path: 'src/sim/collide.ts',
      find: '        if (bladeGap > 0 && clock.bladeIn > bladeGap * (BLADE_BURST - 1)) continue;',
      replace: '        if (bladeGap < 0 && clock.bladeIn > bladeGap * (BLADE_BURST - 1)) continue;',
    },
  },
  {
    decision: '0391',
    suite: 'tests/blade-ceiling.test.ts',
    // Each head its own target: five ceilings on one animal, which is the report back in a new shape.
    broke: 'a boss’s body on clocks of its own, so five heads are five ceilings',
    guard: 'THE REPORTED ONE, IN LANDINGS A SECOND',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0442, which puts the ray's own log in front of the armour's choice.
      find: 'null, rayHits ?? (armoured ? w.hits : bladeHits), bladeGap, hull);',
      replace: 'null, rayHits ?? (armoured ? w.hits : bladeHits), bladeGap, null);',
    },
  },
  {
    decision: '0391',
    suite: 'tests/blade-ceiling.test.ts',
    // One clock for a whole wave: the first enemy a blade meets spends the ceiling for every other.
    broke: 'one clock shared by every target in the pool, so a wave takes one enemy’s worth of blades',
    guard: 'each target keeps its own clock',
    edit: {
      path: 'src/sim/collide.ts',
      // `collideInto`'s, by the loop after it: 0545's `tetherInto` keeps the same clock the same way.
      find: '    const clock = gate ?? target;\n    for (let s = shots.size - 1; s >= 0; s--) {',
      replace: '    const clock = gate ?? targets.at(0);\n    for (let s = shots.size - 1; s >= 0; s--) {',
    },
  },
  {
    decision: '0391',
    suite: 'tests/blade-ceiling.test.ts',
    // A refused blade marked as landed: it waits out a flash for a landing it never made.
    broke: 'a blade the ceiling refuses marked as landed, so it waits a flash for nothing',
    guard: 'each target keeps its own clock, and a blade the clock refuses is neither spent nor landed',
    edit: {
      path: 'src/sim/collide.ts',
      find: '        if (bladeGap > 0 && clock.bladeIn > bladeGap * (BLADE_BURST - 1)) continue;',
      replace: '        if (bladeGap > 0 && clock.bladeIn > bladeGap * (BLADE_BURST - 1)) { shot.landIn = flashSteps; continue; }',
    },
  },
  {
    decision: '0391',
    suite: 'tests/blade-ceiling.test.ts',
    // Every shot treated as a blade: the pulse, spent by arriving, held to the blade's ceiling too.
    broke: 'the ceiling reaching the pulse, which is spent by arriving and cannot pile up',
    guard: 'a shot that is spent by arriving is never held back',
    edit: {
      path: 'src/sim/collide.ts',
      find: '      if (shot.health > 1) {\n        if (shot.landIn > 0) continue;',
      replace: '      if (shot.health > 0) {\n        if (shot.landIn > 0) continue;',
    },
  },
  {
    decision: '0391',
    suite: 'tests/sound.test.ts',
    // The serpent dies through its body now; that kill logged as an ordinary one fires the kill cue too.
    broke: 'a boss killed through its body logged as an ordinary kill, so the cap eats its own death',
    guard: 'THE ONE THAT WOULD BE EATEN BY THE CAP',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (onBody > 0 && w.bossPool.size > 0 && strike(w.bossPool, 0, onBody, IMPACT_FLASH_STEPS, w.bossDeaths)) {',
      replace: '    if (onBody > 0 && w.bossPool.size > 0 && strike(w.bossPool, 0, onBody, IMPACT_FLASH_STEPS, w.deaths)) {',
    },
  },
  {
    decision: '0391',
    suite: 'tests/serpent.test.ts',
    // The serpent's flank armour again: the level-one fight the ask wanted quicker, as it was.
    broke: 'the serpent’s flank armour again, so a hit on its body is nothing',
    guard: 'and a shot on the body stops there and is a hit on the serpent',
    edit: {
      path: 'src/content/bosses.ts',
      find: "        25 s, the arc's 26, the pulse's 51 — where armour at 770 had them at 44, 29 and 68.\n      */\n      hurt: 1,",
      replace: "        25 s, the arc's 26, the pulse's 51 — where armour at 770 had them at 44, 29 and 68.\n      */\n      hurt: 0,",
    },
  },
];
