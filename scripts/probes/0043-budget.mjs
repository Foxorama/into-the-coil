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
    /*
      The other half. A shot that runs to the leading cull spends a third of its life past the
      furthest edge of the furthest screen, holding the slot the next volley needs.

      ⚠️ **Re-anchored, because the MECHANISM changed.** This used to lengthen `PLAYER_SHOT_LIFE`,
      which was the shot's own timer. 0048 culls player shots at the edge of the view instead —
      strictly sooner than that timer could fire on any device — so lengthening the timer stopped
      doing anything and the probe reported STILL GREEN. The timer is gone; what starves the pool
      now is the view cull, so that is what this breaks.
    */
    broke: 'a player shot left to run to the leading cull, starving the next volley',
    guard: 'a volley is never truncated, however heavily the ship is loaded',
    edit: {
      path: 'src/app/frame.ts',
      find: '    stepEntities(w.playerShots, w.cameraAlong, cullPlayerShotAlong(w.cameraAlong, w.view.alongSpan));',
      replace: '    stepEntities(w.playerShots, w.cameraAlong);',
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
    /*
      ⚠️ **THE TROUGH ITSELF, and this probe was first written against the SAMPLING and stayed
      green.** It restored the old boundary sampling — and the suite passed, because by then the
      content had been fixed and there was no longer a trough for either version to miss. Proving
      that the sampling is what catches it would need two edits at once, which the harness does not
      do, and correctly: a probe that changed both the guard and the code it guards would prove
      nothing about either.

      So this breaks the level instead. Removing one filler wave puts two three-wide waves next to
      each other and the view holds six — which is a real thin spot, was really there, and was really
      invisible to the sampling this guard used to do.
    */
    broke: 'a filler wave removed, leaving a six-enemy trough between two small waves',
    guard: 'keeps enough on screen at once to be a shooter',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 1462, enemy: 'drifter', formation: 'line', count: 5, lane: 62 },\n",
      replace: '',
    },
  },
];
