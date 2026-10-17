// The breaks behind docs/decisions/0609-the-ball-takes-its-knocks.md.
//
// One or more per guard 0609 adds to tests/ball.test.ts, tests/dance.test.ts and tests/tier-shell.test.ts.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    // 0593's own break, moved here with its guard: what the heat costs is 0609's now.
    broke: 'a landing that heats nothing',
    guard: 'every landing heats the ball, and a full gauge costs one shield',
    edit: { path: 'src/app/frame.ts', find: '    w.ramHeat += landed * ram.heat;', replace: '    w.ramHeat += 0;' },
  },
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    broke: 'a full gauge that costs the ball nothing',
    guard: 'every landing heats the ball, and a full gauge costs one shield',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.tuning.playerDamage > 0) wound(w.ship, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS);\n',
      replace: '',
    },
  },
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    broke: 'a burn landing inside the window a hit gives',
    guard: 'a burn waits out the window a hit gives, and then lands',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (ram === null || w.danceFor > 0 || w.ramHeat < 1 || w.ship.invulnFor > 0) return;',
      replace: '  if (ram === null || w.danceFor > 0 || w.ramHeat < 1) return;',
    },
  },
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    broke: 'a burn that only ever takes a shield, so a bare ball rams for ever',
    guard: 'with no shield left, a burn is a death',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.tuning.playerDamage > 0) wound(w.ship, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS);',
      replace: '  if (w.tuning.playerDamage > 0 && w.ship.health > w.shipRow.health) wound(w.ship, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS);',
    },
  },
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    broke: 'the ball on its tier’s shell, as every other ship',
    guard: 'the ball opens every life on three and carries no more, on every tier',
    edit: { path: 'src/content/ships.ts', find: '    shields: 3,', replace: '    shields: null,' },
  },
  {
    decision: '0609',
    suite: 'tests/tier-shell.test.ts',
    broke: 'a ship’s own shell past the pool that draws it',
    guard: 'a tier opens on no more than it may carry, and carries no more than the pool can hold',
    edit: { path: 'src/content/ships.ts', find: '    shields: 3,', replace: '    shields: 4,' },
  },
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    broke: 'a shell that never comes back',
    guard: 'a spent shield comes back after its rest, and then one every `every`',
    edit: { path: 'src/app/frame.ts', find: '      ship.health += 1;\n      w.regenIn = regen.every;', replace: '      w.regenIn = regen.every;' },
  },
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    broke: 'every shield after the first coming back on the rest’s clock',
    guard: 'a spent shield comes back after its rest, and then one every `every`',
    edit: { path: 'src/app/frame.ts', find: '      ship.health += 1;\n      w.regenIn = regen.every;', replace: '      ship.health += 1;\n      w.regenIn = regen.rest;' },
  },
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    broke: 'a shield back a step before the shell shows it',
    guard: 'a mark comes back on the shell on the step the shield does',
    edit: { path: 'src/app/frame.ts', find: '    regenShell(w);\n    stepShields(w);', replace: '    stepShields(w);\n    regenShell(w);' },
  },
  {
    decision: '0609',
    suite: 'tests/ball.test.ts',
    broke: 'a hit that leaves the regen counting',
    guard: 'any hit puts the rest back',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (ship.health < w.regenSeen || ship.health >= fullHealthFor(w.shipRow, w.difficulty)) w.regenIn = regen.rest;',
      replace: '    if (ship.health >= fullHealthFor(w.shipRow, w.difficulty)) w.regenIn = regen.rest;',
    },
  },
  // 0615 took the six headings out — a wall reflects the dance now — and its own probe file holds the reflection.
  {
    decision: '0609',
    suite: 'tests/dance.test.ts',
    // 0593's 2.2: three walls in three seconds, measured, where 3.4 meets six.
    broke: 'the dance back at its old speed',
    guard: 'meets a wall about every half second, off it at the angle it met it, and crosses the whole box',
    edit: { path: 'src/content/specials.ts', find: '      speed: 3.4,', replace: '      speed: 2.2,' },
  },
  {
    decision: '0609',
    suite: 'tests/dance.test.ts',
    broke: 'a wall met in silence',
    guard: 'every wall it meets is heard where it met it, and throws sparks there',
    edit: { path: 'src/app/frame.ts', find: "  w.onCue('danceBounce', atAcross);\n", replace: '' },
  },
  {
    decision: '0609',
    suite: 'tests/dance.test.ts',
    broke: 'a wall met with nothing seen there',
    guard: 'every wall it meets is heard where it met it, and throws sparks there',
    edit: { path: 'src/app/frame.ts', find: "  burst(w, atAlong, atAcross, BURST.bounce);\n  flare(w, atAlong, atAcross, 'spark');\n", replace: '' },
  },
  {
    decision: '0609',
    suite: 'tests/dance.test.ts',
    broke: 'a flare that never turns — one picture held for the whole dance',
    guard: 'every dancing ship wears the flare for the whole dance, turning through its frames, and none after',
    edit: {
      path: 'src/app/frame.ts',
      find: '  wearAura(w, DANCE_FLARE, dance.flare[Math.floor(into / dance.flareHold) % dance.flare.length]!);',
      replace: '  wearAura(w, DANCE_FLARE, dance.flare[0]!);',
    },
  },
  {
    decision: '0609',
    suite: 'tests/dance.test.ts',
    broke: 'the flare cycling at sixty frames a second',
    guard: 'the flare turns no faster than three times a second',
    edit: { path: 'src/content/specials.ts', find: '      flareHold: 6,', replace: '      flareHold: 1,' },
  },
  {
    decision: '0609',
    suite: 'tests/dance.test.ts',
    broke: 'a dance that hums once and then dances in silence',
    guard: 'it hums from the throw to the end of the dance',
    edit: { path: 'src/app/frame.ts', find: "  if ((into - 1) % dance.hum === 0) w.onCue('danceHum', w.ship.across);", replace: "  if (into === 1) w.onCue('danceHum', w.ship.across);" },
  },
];
