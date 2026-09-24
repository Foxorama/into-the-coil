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
  /*
    ⚠️ TWO PROBES WERE HERE AND 0364 DELETED THEM — level one judged on the capped walk, and the
    gauntlet's opening station-holders put back to closers. Both broke a stretch that ran dry because
    bodies died at the leading edge of a 178-unit view before they fired. On the zoomed 213-unit view
    they live long enough to fire either way: level one's worst capped stretch is 7.5 s, and the
    gauntlet with its closers back runs 2.3 s. Neither break can produce the defect any more, so each
    probe could only ever report STILL GREEN. The guard they named is still proven to fire by 0259's
    probe. `docs/decisions/0364-the-view-zooms-out.md`.
  */
];
