// The breaks behind docs/decisions/0197-a-wave-arrives-as-a-wave.md.
//
// ⚠️ BOTH DEFECTS SHIPPED FOR MONTHS WITH THE WHOLE SUITE GREEN, AND BOTH WERE VISIBLE THE FIRST TIME
// ANYBODY FLEW A LEVEL. What no guard could see was a body's position relative to ANOTHER BODY of its
// own wave, or a flanker's position relative to the SHIP — two questions this file had never asked.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0197',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE STATE THE GAME SHIPPED IN: a flanker's entry spacing taken from the formation's ALONG
      offset, which is `() => 0` for a line. Every body of a flanking line at one point — 300 across the
      game, reported as *"it looks like one enemy when it's actually 5."*
    */
    broke: 'a flanker’s stream taken from the formation again, so a line enters as a single point',
    guard: 'THE REPORTED ONE: no two bodies of a flanking wave enter inside each other',
    edit: {
      path: 'src/content/formations.ts',
      find: '  return index * gapAcross(radius);',
      replace: '  return index * 0;',
    },
  },
  {
    decision: '0197',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE FLAT 120 PUT BACK, WHICH IS 47.1 UNITS INSIDE THE PLAYER'S BOX. `PLAYER_LEAD` is 167.1 and
      the ship fires forward, so a player pushed forward had flankers materialise behind them with no
      way to shoot back. docs/decisions/0048-a-threat-may-arrive-from-the-side.md's own comment called
      120 *the player's own cap*, which is the sentence that made this survive a first report.
    */
    broke: 'the flanker entry back to a flat 120, which is inside the player’s box',
    guard: 'THE OTHER REPORTED ONE: a flanker never enters behind the ship',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  const ahead = shipAlong - cameraAlong + FLANK_CLEAR_AIR;\n  return Math.min(Math.max(FLANK_ALONG, ahead), MAX_ALONG_SPAN);',
      replace: '  return FLANK_ALONG;',
    },
  },
  {
    decision: '0197',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE REFUSAL 0197 HAD TO ARGUE WITH, DROPPED RATHER THAN KEPT. 0048 measures the entry from the
      CAMERA so a ship standing forward cannot drag its own ambushes in front of it; an entry that
      simply followed the ship would let a player at the back pull every flanker to the middle of the
      screen and meet them one at a time. **0197 keeps that as the FLOOR**, and this is what proves the
      floor is load-bearing rather than decorative.
    */
    broke: 'the entry following the ship with no floor, so a player at the back drags their ambushes forward',
    guard: 'and 0048 is kept: a player at the back cannot pull their ambushes forward',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  return Math.min(Math.max(FLANK_ALONG, ahead), MAX_ALONG_SPAN);',
      replace: '  return Math.min(ahead, MAX_ALONG_SPAN);',
    },
  },
];
