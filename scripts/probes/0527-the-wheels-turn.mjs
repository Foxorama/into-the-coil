// The breaks behind docs/decisions/0527-the-wheels-turn.md.
//
// ⚠️ A rim is the slot's four links — the rule, the save, the row the run flies, the card — and a
// fifth that is the point of the ware: the spinner turning. A spinner that stood still would pass every
// guard about where it is.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0527',
    suite: 'tests/wheels.test.ts',
    broke: 'the spinners on any car without a shard spent',
    guard: 'the spinners once bought, on either car',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return from === null ? state.owned[rim] : plateOpen(state, ship, from);',
      replace: '  return from === null ? true : plateOpen(state, ship, from);',
    },
  },
  {
    decision: '0527',
    suite: 'tests/wheels.test.ts',
    broke: 'a saved rim fitted without asking whether wins or purchases open it',
    guard: 'refuses a rim its own wins or purchases do not open',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (raw !== undefined && rimOpen(owning, kind, raw)) rim[kind] = raw;',
      replace: '    if (raw !== undefined) rim[kind] = raw;',
    },
  },
  {
    decision: '0527',
    suite: 'tests/wheels.test.ts',
    broke: 'the run flying a car on its own rims whatever was fitted',
    guard: 'flies a car’s row wearing the fitted rim',
    edit: {
      path: 'src/content/ships.ts',
      find: '  const wheels = row.wheels === null || rim === null || rim === row.wheels.rim ? row.wheels : { ...row.wheels, rim };',
      replace: '  const wheels = row.wheels;',
    },
  },
  {
    decision: '0527',
    suite: 'tests/wheels.test.ts',
    broke: 'a spinner standing still over its wheel',
    guard: 'a spinner stands over each wheel and TURNS',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const next = wheel.turn + (TAU * STEP_MS) / ((i === 0 ? rates[0] : rates[1]) * 1000);',
      replace: '    const next = wheel.turn;',
    },
  },
  {
    decision: '0527',
    suite: 'tests/wheels.test.ts',
    broke: 'the wheels flying on after a hit as if nothing touched the car',
    guard: 'flashes when the car does',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const hurt = w.ship.sprite === w.ship.spriteHit;',
      replace: '  const hurt = false;',
    },
  },
  {
    decision: '0527',
    suite: 'tests/wheels.browser.test.ts',
    broke: 'the card in Paint & Parts showing the spinners still',
    guard: 'turning on its card',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    if (ship.wheels !== null && rates !== null) {',
      replace: '    if (ship.wheels === null && rates !== null) {',
    },
  },
];
