// The bullets stay on the screen — docs/decisions/0259-the-bullets-stay-on-the-screen.md
//
// Every guard 0259 adds, broken on purpose, and the two older guards it leans on.
// `node scripts/prove-guard.mjs 0259`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0259',
    suite: 'tests/bullets.test.ts',
    // The entry volley removed: what shipped, and a body enters the view with whatever count it had.
    // ⚠️ Re-aimed by 0326: the count is set on the entry step in both directions now, and the fixture
    // carries a body forced to a one-step reload on the way in — so with the set removed it fires the
    // step it appears, and it is the seen window that goes red rather than the dry budget.
    broke: 'the entry volley removed, so a body enters the view with its whole reload ahead of it',
    guard: 'THE SEEN WINDOW: a body is on the screen for half a second',
    edit: {
      path: 'src/app/frame.ts',
      find: '      e.fireIn = SEEN_BEFORE_VOLLEY + nextOnGrid(w.steps, ENTRY_VOLLEY) + e.entrySlot * FIRE_GRID + 1;\n',
      replace: '      void e;\n',
    },
  },
  {
    decision: '0259',
    suite: 'tests/bullets.test.ts',
    // One slot: every member of a formation fires on the step it enters — 0098's own report.
    broke: 'the entry gap cut to one grid slot, so a formation fires in unison',
    // The guard's name moved when 0326 put the seen window in front of the deal; its subject did not.
    guard: 'THE ENTRY VOLLEY: a formation still opens as a figure',
    edit: {
      path: 'src/content/cadence.ts',
      find: 'export const ENTRY_VOLLEY = FIRE_GRID * 2;',
      replace: 'export const ENTRY_VOLLEY = FIRE_GRID;',
    },
  },
  {
    decision: '0259',
    suite: 'tests/bullets.test.ts',
    // The shoal's converted wave put back: the level's last stretch runs past the budget.
    // ⚠️ Re-aimed by 0326, which re-authored the shoal's end again: 0259's sower at 3405 now enters
    // from the side, and the wave that holds the stretch under eight seconds is the turret line at
    // 3865 — a station-holder, because with the seen window in a body that closes dies at the edge
    // before it fires. Reverting THAT wave to the charger column it was is the break.
    /*
      ⚠️ **RE-AIMED A SECOND TIME BY 0338, FOR THE SAME CLASS OF REASON AS 0326's RE-AIM ABOVE.** The
      flanker's entry moved to the front of the screen, which moved this level's own baseline from 6.1s
      to 8.4s — and the turret line at 3865 now makes no difference to the worst stretch at all: **8.4s
      with the break in and 8.4s without it.** A break that reproduces the baseline proves nothing,
      which is what `npm run prove` said when it reported this probe STILL GREEN.

      It is aimed at the sower at 3232 now — one of 0259's OWN conversions, and the one inside the
      stretch that is actually the worst. Measured with the break in: **13.9s**, against a budget of
      nine.

      ⚠️ **AND A THIRD TIME BY 0350, WHEN THE CORRIDOR TURNED.** The level measured the same with the
      sower at 3232 or a charger in its place — 5.9s at 3168, STILL GREEN under `npm run prove` — so in
      the capped walk that sower no longer puts a bullet on the screen; why was not traced. Every other
      firing wave from 1737 to 3463 was tried alone; the one whose loss runs a stretch past nine is the
      sentry column at 3003 — **11.3s** ending at 3168. Nothing between 1737 and 2312 does: the worst
      stretch there stays at 8.3s or under with any one of them gone.
    */
    broke: 'the shoal’s sentry column at 3003 made a charger, so the stretch to 3168 runs past the budget',
    guard: 'THE REPORTED ONE: at the capped loadout, no level goes',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 3003, enemy: 'sentry', formation: 'line', count: 5, lane: 44 },",
      replace: "  { at: 3003, enemy: 'charger', formation: 'line', count: 5, lane: 44 },",
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
      // ⚠️ Re-anchored when the fold became a deal — the slot is `e.entrySlot` now rather than
      // `fireIn` folded into the window. The break is unchanged in kind: the `+ 1` is the step the
      // count is decremented on, and without it the volley lands a step early and off the grid.
      // ⚠️ Re-anchored again by 0326, which set the count in place rather than through `entry` and put
      // the seen window in front of it; the `+ 1` is still the step the count is decremented on.
      find: '      e.fireIn = SEEN_BEFORE_VOLLEY + nextOnGrid(w.steps, ENTRY_VOLLEY) + e.entrySlot * FIRE_GRID + 1;',
      replace: '      e.fireIn = SEEN_BEFORE_VOLLEY + nextOnGrid(w.steps, ENTRY_VOLLEY) + e.entrySlot * FIRE_GRID;',
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
