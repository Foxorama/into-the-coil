// The breaks behind docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md.
//
// ⚠️ THE FIRST TWO ARE THE SHIPPED BUG, EACH HALF ON ITS OWN. The weapon overran its pool because
// two independent numbers had no ceiling between them, and either one alone is enough to bring it
// back — which is exactly why the guard has to check all four against each other rather than pin any
// one of them.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0043',
    suite: 'tests/pickups.test.ts',
    broke: 'the barrel cap removed, which is the shipped bug exactly',
    guard: 'a volley is never truncated, however heavily the ship is loaded',
    edit: {
      path: 'src/content/pickups.ts',
      find: 'const MAX_BARRELS = 4;',
      replace: 'const MAX_BARRELS = 40;',
    },
  },
  {
    decision: '0043',
    suite: 'tests/pickups.test.ts',
    // The other half. A shot that runs to the leading cull spends a third of its life past the
    // furthest edge of the furthest screen, holding the slot the next volley needs.
    broke: 'a player shot left to run to the leading cull, starving the next volley',
    guard: 'a volley is never truncated, however heavily the ship is loaded',
    edit: {
      path: 'src/content/pickups.ts',
      find: 'export const PLAYER_SHOT_LIFE = 80;',
      replace: 'export const PLAYER_SHOT_LIFE = 200;',
    },
  },
  {
    decision: '0043',
    suite: 'tests/level.test.ts',
    // ⚠️ WHAT SHIPPED. A wave at 60 is on screen before the player has found out which way the ship
    // moves, and it reads in the table as a perfectly ordinary opening.
    broke: 'a level authored with its first wave on screen, which is what shipped',
    guard: 'opens on an empty screen, so the player can find the controls first',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 300, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },",
      replace: "  { at: 60, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },",
    },
  },
  {
    decision: '0043',
    suite: 'tests/level.test.ts',
    // The over-correction, which is the failure the guard this replaced was written against. Both
    // ends need holding or the fix for one becomes the other.
    broke: 'the opening pushed so far out that the player flies at nothing',
    guard: 'and does not leave the player waiting',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 300, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },",
      replace: "  { at: 900, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },",
    },
  },
  {
    decision: '0043',
    suite: 'tests/level.test.ts',
    // ⚠️ The guard's own sampling, broken back to what it was. This is the version that reported the
    // level as fine while a six-enemy trough sat in it — a guard measuring a real property at the
    // wrong points.
    broke: 'the density guard sampling boundaries instead of the troughs just past them',
    guard: 'keeps enough on screen at once to be a shooter',
    edit: {
      path: 'tests/level.test.ts',
      find: '        points.push(wave.at + 1, wave.at - MAX_ALONG_SPAN);',
      replace: '        points.push(wave.at, wave.at - MAX_ALONG_SPAN);',
    },
  },
];
