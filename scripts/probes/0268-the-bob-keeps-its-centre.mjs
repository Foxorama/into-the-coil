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
  /*
    ⚠️ **RETIRED BY 0400: *the bob's angle turning through a brace*.** It reddened on the one bobbing
    boss that held still for a laser — the hydra until 0384 stood it in the acid, then the jellyfish —
    and since 0400 set the jellyfish over its heart no boss that bobs ever braces: the line it broke is
    one no content reaches, and the proof reported it STILL GREEN. The line stays right and stays in
    `src/app/boss.ts`; a bobbing boss that fires a beam brings this probe back.
  */
];
