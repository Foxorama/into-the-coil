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
      // ⚠️ RE-ANCHORED BY 0093, AND THE LEVER MOVED FROM ARITHMETIC TO CONTENT. `MAX_BARRELS` used to
      // be the endpoint `rung(1, MAX_BARRELS, gun)` interpolated towards, so raising it raised the
      // ladder; the barrels are a list on the ship's row now and the constant is a bound checked
      // against that list. `npm run prove` reported STILL GREEN within the hour of the change.
      // The BREAK is unchanged — the shipped bug was a volley wider than the pool can hold — and it
      // is now spelled where the barrels actually come from.
      path: 'src/content/ships.ts',
      find: '    barrels: [1, 2, 3, 4, 4],',
      replace: '    barrels: [1, 2, 3, 4, 40],',
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
    /*
      ⚠️ **IT WAS ONE WAVE AND IT TAKES THREE NOW, AND THAT IS THE COMPRESSION WORKING.**
      `docs/decisions/0113-there-is-one-composition-and-seven-levels.md` took thirty seconds out of
      every level without removing a body, so the view holds more at once and a single missing filler
      is absorbed. `npm run prove` said so — this probe went STILL GREEN — and the honest answer is
      that the thin spot it demonstrated is no longer thin, not that the guard stopped working.

      ⚠️ **Driven rather than reasoned: one removed is green, two are green, three go red.** That is a
      measurement of how much slack the denser level has, and it is the number to re-take the day the
      density moves again.
    */
    broke: 'four waves in a row removed, which is what a trough costs in a level this dense',
    guard: 'keeps enough on screen at once to be a shooter',
    edit: {
      path: 'src/content/levels.ts',
      find:
        "  { at: 1052, enemy: 'drifter', formation: 'line', count: 5, lane: 62 },\n" +
        "  { at: 1079, enemy: 'turret', formation: 'line', count: 3, lane: 55 },\n" +
        "  { at: 1134, enemy: 'charger', formation: 'column', count: 5, lane: 25, origin: 'acrossPlus' },\n" +
        "  { at: 1190, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },\n",
      replace: '',
    },
  },
];
