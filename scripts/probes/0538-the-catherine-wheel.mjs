// The breaks behind docs/decisions/0538-the-catherine-wheel.md.
//
// One per guard tests/wheel.test.ts adds, and one for each guard elsewhere that 0538 taught the wheel:
// a shot that survives an arrival, the crackle under the outcomes, and the sizzle dry.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'the Firebird still on the shuriken',
    guard: 'THE ASK: the Firebird flies the Catherine wheel',
    edit: { path: 'src/content/ships.ts', find: "    weapon: 'catherine',", replace: "    weapon: 'ray'," },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'two ships on the pulse and the shuriken on none',
    guard: 'and every gun is still exactly one ship’s own',
    edit: { path: 'src/content/ships.ts', find: "    weapon: 'shuriken',\n    missile: 'straight',", replace: "    weapon: 'pulse',\n    missile: 'straight'," },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'a life waiting for the ten-beat grid before its first wheel',
    guard: 'throws one wheel on the first beat of a life',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return stepsToGrid(now, fireEvery < VOLLEY_CYCLE ? fireEvery : VOLLEY_CYCLE);',
      replace: '  return stepsToGrid(now, fireEvery);',
    },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that hangs and never turns',
    guard: 'flies out and hangs where it was thrown to',
    edit: { path: 'src/app/frame.ts', find: '    b.turn = turned > Math.PI ? turned - Math.PI * 2 : turned;', replace: '    b.turn = b.turn;' },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'a tether that lands nothing on a body',
    guard: 'going back and forth sweeps the tether across what is between',
    edit: {
      path: 'src/app/frame.ts',
      find: '  let destroyed = tetherInto(w.enemies, rootAlong, rootAcross, disc.along, disc.across, wheel.tether, wheel.tetherDamage, 1,',
      replace: '  let destroyed = tetherInto(w.enemies, rootAlong, rootAcross, disc.along, disc.across, wheel.tether, 0, 1,',
    },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'no leash, so the tether runs the length of the lane',
    guard: 'is on a leash',
    edit: { path: 'src/app/frame.ts', find: '    if (d > wheel.leash) {', replace: '    if (d > wheel.leash * 10) {' },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that never burns down',
    guard: 'burns down over its last beat',
    edit: { path: 'src/app/frame.ts', find: '    if (b.lifeFor <= wheel.fade) {\n      b.sprite = SPRITE.catherineFade;', replace: '    if (b.lifeFor <= 0) {\n      b.sprite = SPRITE.catherineFade;' },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that throws no embers',
    guard: 'throws short embers off its rim',
    edit: { path: 'src/app/frame.ts', find: '    if (w.steps % wheel.emberEvery === 0) throwEmbers(w, b, wheel);', replace: '' },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'a tether drawn as a hairline, thinner than it lands',
    guard: 'draws its tether every step it burns, as wide as it lands',
    edit: { path: 'src/app/frame.ts', find: '    link.radius = wheel.tether;', replace: '    link.radius = 0.1;' },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'a tether with no clock, landing every step on a body held across it',
    guard: 'lands only so often on a body held across it',
    edit: { path: 'src/sim/collide.ts', find: '    if (gap > 0 && clock.bladeIn > gap * (BLADE_BURST - 1)) continue;\n', replace: '' },
  },
  {
    decision: '0538',
    suite: 'tests/wheel.test.ts',
    broke: 'a wheel that outlives the ship that threw it',
    guard: 'goes with the ship that threw it',
    edit: { path: 'src/app/frame.ts', find: '  w.playerShots.clear();\n  w.missiles.clear();', replace: '  w.missiles.clear();' },
  },
  {
    decision: '0538',
    suite: 'tests/combat.test.ts',
    broke: 'a wheel spent by its first arrival',
    guard: 'a shot never flashes: one health is spent by arriving, and only a blade has more',
    edit: { path: 'src/content/shots.ts', find: 'export const WHEEL_EDGE = 1000;', replace: 'export const WHEEL_EDGE = 1;' },
  },
  {
    decision: '0538',
    suite: 'tests/sound.test.ts',
    broke: 'the crackle over the outcomes it is meant to sit under',
    guard: 'AN AUTO-WEAPON SOUNDS UNDER THE EVENTS IT CAUSES',
    edit: { path: 'src/content/cues.ts', find: "  crackle: {\n    twin: 'embers-fly',\n    air: 0.25,\n    onGrid: true,\n    hold: 6,\n    gain: 0.16,", replace: "  crackle: {\n    twin: 'embers-fly',\n    air: 0.25,\n    onGrid: true,\n    hold: 6,\n    gain: 0.4," },
  },
  {
    decision: '0538',
    suite: 'tests/sound.test.ts',
    broke: 'the sizzle wet, a tail under its own repeat',
    guard: 'and the cues on the weapon cadence are DRY',
    edit: { path: 'src/content/cues.ts', find: "  sizzle: {\n    twin: 'impact-flash',\n    hold: 6,", replace: "  sizzle: {\n    twin: 'impact-flash',\n    air: 0.2,\n    hold: 6," },
  },
];
