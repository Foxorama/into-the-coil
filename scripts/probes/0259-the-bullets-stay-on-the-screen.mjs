// The bullets stay on the screen — docs/decisions/0259-the-bullets-stay-on-the-screen.md
//
// Every guard 0259 adds, broken on purpose, and the two older guards it leans on.
// `node scripts/prove-guard.mjs 0259`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0259',
    suite: 'tests/bullets.test.ts',
    // The entry volley removed: what shipped, and the shoal goes sixteen seconds dry.
    broke: 'the entry volley removed, so a body enters the view with its whole reload ahead of it',
    guard: 'THE REPORTED ONE: at the capped loadout, no level goes',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (entry < e.fireIn) e.fireIn = entry;\n',
      replace: '      void entry;\n',
    },
  },
  {
    decision: '0259',
    suite: 'tests/bullets.test.ts',
    // One slot: every member of a formation fires on the step it enters — 0098's own report.
    broke: 'the entry gap cut to one grid slot, so a formation fires in unison',
    guard: 'THE ENTRY VOLLEY: a body fires inside a third of a second',
    edit: {
      path: 'src/content/cadence.ts',
      find: 'export const ENTRY_VOLLEY = FIRE_GRID * 2;',
      replace: 'export const ENTRY_VOLLEY = FIRE_GRID;',
    },
  },
  {
    decision: '0259',
    suite: 'tests/bullets.test.ts',
    // The shoal's converted wave put back: three non-firing waves in a row at the end, nine seconds dry.
    broke: 'the shoal’s sower put back to a charger, so its last stretch runs past the budget',
    guard: 'THE REPORTED ONE: at the capped loadout, no level goes',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 3405, enemy: 'sower', formation: 'column', count: 6, lane: 55 },",
      replace: "  { at: 3405, enemy: 'charger', formation: 'column', count: 6, lane: 55 },",
    },
  },
  {
    decision: '0259',
    suite: 'tests/spawns.test.ts',
    // The step the entry count is set on is the step it is first decremented, so the volley lands a
    // step early — off the grid. 0096's own guard is what caught it.
    broke: 'the entry volley set without the step it is decremented on, so it lands off the grid',
    guard: 'THE PICTURE: every enemy bullet appears on a step the grid allows',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const entry = nextOnGrid(w.steps, ENTRY_VOLLEY, (e.fireIn % ENTRY_VOLLEY) / ENTRY_VOLLEY) + 1;',
      replace: '      const entry = nextOnGrid(w.steps, ENTRY_VOLLEY, (e.fireIn % ENTRY_VOLLEY) / ENTRY_VOLLEY);',
    },
  },
  {
    decision: '0259',
    suite: 'tests/pilots.test.ts',
    // The sentry's reload back to 90: with the entry volley counted, its wall puts thirty bullets on
    // the screen while it is visible, which 0110's guard refuses.
    broke: 'the sentry reloading at 90 again, so its wall goes over the on-screen bullet budget',
    guard: 'and nothing gets more volleys away at the player than a player can read',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    fireEvery: 108,\n    shot: \'flak\',\n    // THE LABYRINTH\'S OWN',
      replace: '    fireEvery: 90,\n    shot: \'flak\',\n    // THE LABYRINTH\'S OWN',
    },
  },
];
