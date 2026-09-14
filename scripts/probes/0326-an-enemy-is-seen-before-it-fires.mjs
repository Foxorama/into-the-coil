// An enemy is seen before it fires — docs/decisions/0326-an-enemy-is-seen-before-it-fires.md
//
// Every guard 0326 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0326`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0326',
    suite: 'tests/bullets.test.ts',
    // No window at all: 0259's entry, a fifth of a second — the report's "shoot too fast when they appear".
    broke: 'the seen window set to zero, so a body fires the moment its hull is on the screen',
    guard: 'THE SEEN WINDOW: a body is on the screen for half a second',
    edit: {
      path: 'src/content/cadence.ts',
      find: 'export const SEEN_BEFORE_VOLLEY = FIRE_GRID * 5;',
      replace: 'export const SEEN_BEFORE_VOLLEY = 0;',
    },
  },
  {
    decision: '0326',
    suite: 'tests/bullets.test.ts',
    // 0259's rule put back: a body about to fire anyway keeps its count. The fixture forces a one-step
    // reload on the way in, so the count is kept and the volley leaves inside the window.
    broke: 'the entry count only ever shortened, so a body about to fire anyway fires inside the window',
    guard: 'THE SEEN WINDOW: a body is on the screen for half a second',
    edit: {
      path: 'src/app/frame.ts',
      find: '      e.fireIn = SEEN_BEFORE_VOLLEY + nextOnGrid(w.steps, ENTRY_VOLLEY) + e.entrySlot * FIRE_GRID + 1;\n',
      replace:
        '      const entry = SEEN_BEFORE_VOLLEY + nextOnGrid(w.steps, ENTRY_VOLLEY) + e.entrySlot * FIRE_GRID + 1;\n      if (entry < e.fireIn) e.fireIn = entry;\n',
    },
  },
  {
    decision: '0326',
    suite: 'tests/bullets.test.ts',
    // The lane edge removed: a flanker has no entry, which is what shipped from 0259 to 0326.
    broke: 'the across edge removed, so a flanker enters the lane with whatever count it had',
    guard: 'and a body arriving ACROSS the lane is seen for the same half second',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const enteredAcross =\n      e.steerAcross !== 0 &&',
      replace: '    const enteredAcross =\n      false &&',
    },
  },
  {
    decision: '0326',
    suite: 'tests/spawns.test.ts',
    // A window that is not a whole number of grid units takes every entry volley in the game off the
    // grid, which is 0096's guard over the real frame.
    broke: 'the seen window off the grid, so every entry volley lands between the beats',
    guard: 'THE PICTURE: every enemy bullet appears on a step the grid allows',
    edit: {
      path: 'src/content/cadence.ts',
      find: 'export const SEEN_BEFORE_VOLLEY = FIRE_GRID * 5;',
      replace: 'export const SEEN_BEFORE_VOLLEY = FIRE_GRID * 5 + 3;',
    },
  },
  {
    decision: '0326',
    suite: 'tests/bullets.test.ts',
    // Level one judged at the capped loadout before its second weapon — a loadout it cannot carry
    // there — goes eleven seconds dry at 716 with the window in.
    broke: 'level one’s first half judged on the capped walk it cannot carry there',
    guard: 'THE REPORTED ONE: at the capped loadout, no level goes',
    edit: {
      path: 'tests/bullets.test.ts',
      find: '        : [...levelOneEarly.dryStretches.filter((s) => s.endsAt < lifts), ...r.dryStretches.filter((s) => s.endsAt >= lifts)];',
      replace: '        : r.dryStretches;',
    },
  },
  {
    decision: '0326',
    suite: 'tests/bullets.test.ts',
    // The gauntlet's opening as it was before 0326's repair: a sower line at 355 and a weaver line at
    // 519, both lead-edge closers, and with the window in both died at the edge — seventeen seconds
    // dry ending at 612. ⚠️ BOTH, because `npm run prove` showed one alone STILL GREEN: either
    // station-holder on its own keeps the stretch at 7.4 s, under the budget by six tenths.
    broke: 'the gauntlet’s opening station-holders put back to the closers they were, so its opening runs seventeen seconds dry',
    guard: 'THE REPORTED ONE: at the capped loadout, no level goes',
    edit: {
      path: 'src/content/levels.ts',
      find:
        "  { at: 355, enemy: 'turret', formation: 'line', count: 5, lane: 44 },\n" +
        "  { at: 410, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },\n" +
        "  { at: 465, enemy: 'lancer', formation: 'line', count: 8, lane: 45, origin: 'acrossMinus' },\n" +
        "  { at: 519, enemy: 'warden', formation: 'line', count: 5, lane: 55 },",
      replace:
        "  { at: 355, enemy: 'sower', formation: 'line', count: 5, lane: 44 },\n" +
        "  { at: 410, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },\n" +
        "  { at: 465, enemy: 'lancer', formation: 'line', count: 8, lane: 45, origin: 'acrossMinus' },\n" +
        "  { at: 519, enemy: 'weaver', formation: 'line', count: 5, lane: 55 },",
    },
  },
];
