// The arrival is seen — docs/decisions/0338-the-arrival-is-seen.md
//
// Every guard 0338 adds, broken on purpose. `node scripts/prove-guard.mjs 0338`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0338',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE VIEW TAKEN BACK OUT OF THE PLACEMENT, WHICH IS THE BUG AS IT SHIPPED THROUGH 0048 AND
      0197. `flankAlongFor` went back to `MAX_ALONG_SPAN / 2` as its only floor — half of the WIDEST
      device, and 68% of the aspect the levels are authored to. Every other claim in the file stays
      green over it: a flanker still never enters behind the ship, a player at the back still cannot
      drag their ambushes forward, and the entry is still inside the horizon. What comes back is the
      complaint.
    */
    broke: 'the view dropped from the entry again, so the floor is half of a device nobody is playing on',
    guard: 'THE REPORTED ONE, FOR THE THIRD TIME: a body arriving from the side is first SEEN at the front of the screen',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  return Math.min(Math.max(FLANK_ALONG, ahead, alongSpan), MAX_ALONG_SPAN);',
      replace: '  return Math.min(Math.max(FLANK_ALONG, ahead), MAX_ALONG_SPAN);',
    },
  },
  {
    decision: '0338',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ AND THE HOLD DROPPED, WHICH IS THE HALF NO GUARD IN THE REPOSITORY COULD SEE. The placement
      stays exactly where 0338 puts it — at the leading edge of the view — and the body is still
      SIGHTED thirty units behind it, because it is outside the lane when it is placed and the camera
      runs out from under it while it crosses. This is the difference between the model quantity and
      the picture quantity, and it is the whole reason the report survived two fixes: a guard on the
      placement is green over this break.
    */
    broke: 'the flanker no longer keeps pace with the camera while it crosses in, so it is sighted where it has drifted to',
    guard: 'THE REPORTED ONE, FOR THE THIRD TIME: a body arriving from the side is first SEEN at the front of the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (flanking) e.velAlong += w.scrollPerStep;',
      replace: '    if (flanking) e.velAlong += 0;',
    },
  },
  {
    decision: '0338',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ AND THE HOLD NEVER RELEASED, WHICH IS THE OPPOSITE DEFECT AND IS WHAT A GUARD ON THE SIGHTING
      ALONE WOULD SHIP. Every flanker in the game keeps pace with the camera for ever: it is sighted in
      exactly the right place, and then it hangs at the front of the screen and never comes back to the
      player at all. The two lines are one mechanism, and this is the half that proves the release is
      load-bearing rather than tidy.
    */
    broke: 'the hold never released, so a flanker arrives correctly and then hangs at the front of the screen for ever',
    guard: 'it lets go of the screen once it is in the lane',
    edit: {
      path: 'src/app/frame.ts',
      find: '      e.velAlong -= w.scrollPerStep;',
      replace: '      e.velAlong -= 0;',
    },
  },
];
