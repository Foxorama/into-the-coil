// The breaks behind docs/decisions/0268-the-bob-keeps-its-centre.md.
//
// ⚠️ BOTH OF THESE ARE THE SHIPPED CODE, PUT BACK. The bug was not a missing rule — it was a
// derivative taken with respect to a quantity that turned out not to be constant, and then a second
// one where the hull was held still and the angle was not. Each probe restores one of the two, and
// each on its own puts a hull outside the lane.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0268',
    suite: 'tests/bob.test.ts',
    /*
      ⚠️ THE ANGLE READ OFF THE CAMERA AGAIN, which is exactly how it shipped and reads as obviously
      correct: `velAcross` is the derivative of `amplitude × sin(cameraAlong × TAU / wavelength)`, and
      it is — for a FIXED wavelength. The phase divides it, so the argument jumps at every phase
      boundary and the integral keeps whatever offset the jump left. Nothing else in the repository
      can see it: the station, the fan, the phases and the health are all still perfect.
    */
    broke: 'the bob’s angle read off the camera again, so a phase change re-centres the swing',
    guard: 'THE REPORTED ONE: a bobbing hull never leaves the lane',
    edit: {
      path: 'src/app/boss.ts',
      find: '      boss.velAcross = move.amplitude * rate * Math.cos(boss.bobPhase);',
      replace: '      boss.velAcross = move.amplitude * rate * Math.cos((cameraAlong * TAU) / wavelength);',
    },
  },
  {
    decision: '0268',
    suite: 'tests/bob.test.ts',
    /*
      ⚠️ THE ANGLE TURNING THROUGH THE BRACE — the second cause, and the one that was found by
      measuring rather than by reading. A beam holds the hull still (0250) and zeroes `velAcross`; an
      angle that goes on advancing through that comes out describing a position the hull never
      travelled to. It reddens on the hydra, the one bobbing boss with a laser head (0254), and on
      nothing else — which is what makes it worth its own probe rather than a clause of the one above.
    */
    broke: 'the bob’s angle turning through a brace, so a held hull loses its place in the swing',
    guard: 'and it stays centred on the lane, rather than merely staying inside it',
    edit: {
      path: 'src/app/boss.ts',
      find: '      if (boss.holdFor <= 0) boss.bobPhase += rate;',
      replace: '      boss.bobPhase += rate;',
    },
  },
];
