// A bob can rear — docs/decisions/0289-a-bob-can-rear.md
//
// Every guard 0289 adds, broken on purpose. `node scripts/prove-guard.mjs 0289`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0289',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION: A BOB IS A LINE.** Every arm of the move switch
      was on `across`, so a bobbing boss slid up and down a fixed distance from the camera and its
      only along movement was `drift` — five units either way on the camera's own wavelength, which is
      the thing the report calls *just going up and down*.
    */
    broke: 'the rear taken back off the row, so the head slides up and down a line again',
    guard: 'THE REPORTED ONE: the head rears',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    move: { kind: 'bob', amplitude: 24, wavelength: 200, rear: 14 },",
      replace: "    move: { kind: 'bob', amplitude: 24, wavelength: 200, rear: 0 },",
    },
  },
  {
    decision: '0289',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE LUNGE UNLOCKED FROM THE BOB, WHICH IS THE HALF THAT SEPARATES *REARING* FROM
      *DRIFTING ABOUT*.** On the camera's own wavelength rather than the bob's angle, the two motions
      are independent: the hull still covers the same ground along the lane and the same ground across
      it, and traces a wandering scribble rather than one withdrawal and one strike a cycle.
    */
    broke: 'the lunge run off the camera instead of the bob, so the two motions are separate wobbles',
    guard: 'and the lunge is locked to the bob, so it is one arc and not two wobbles',
    edit: {
      path: 'src/app/boss.ts',
      find: "  const rear = row.move.kind === 'bob' && row.move.rear > 0 ? row.move.rear * Math.cos(boss.bobPhase) : 0;",
      replace:
        "  const rear = row.move.kind === 'bob' && row.move.rear > 0 " +
        '? row.move.rear * Math.cos((cameraAlong * TAU) / 137) : 0;',
    },
  },
  {
    decision: '0289',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ **AND THE STATION LEFT WHERE IT WAS, WHICH IS THE PRICE OF THE LUNGE UNPAID.** 0101 holds
      every boss out of the player's half at the near end of its swing; at 114 the serpent sat at 57%
      with no rear at all, so fourteen units of lunge put it at 49% — under the number the report that
      wrote 0101 observed and complained about.
    */
    broke: 'the station left at 114, so the lunge is taken out of the player’s half of the screen',
    guard: 'and it leaves the player more than half the screen, at the NEAR end of the swing',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Two bosses stand at 130; the driftWavelength is what tells this one from the other.
      find: '    station: 130,\n    drift: 5,\n    driftWavelength: 240,',
      replace: '    station: 114,\n    drift: 5,\n    driftWavelength: 240,',
    },
  },
];
