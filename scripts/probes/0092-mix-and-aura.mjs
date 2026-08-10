// The breaks behind docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md.
//
// ⚠️ THE ONES THAT ARE NOT HERE are the mix numbers themselves — `MASTER_GAIN` and `MUSIC_GAIN`. They
// are a hand's job on `src/content/shots.ts`'s own terms: nothing may assert on their values, because
// the only instrument that can judge a mix is an ear. What IS guarded is the arithmetic they have to
// live inside — `tests/music.test.ts` sums the boss row sample by sample and refuses a peak past full
// scale, and 0090's probe already breaks that. A second probe pointed at the same guard would be a
// copy.
//
// ⚠️ AND THE DRONE COMING DOWN TO 0.55 IS ALSO NOT HERE, deliberately. It buys the headroom the aura's
// voices spend, and at `MUSIC_GAIN` 0.52 the clipping guard still passes with it left at 0.7 — so
// there is no assertion it can redden and inventing one would be writing a guard to have a probe.
// The decision records it as a taste with a measurement behind it rather than as a rule.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0092',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE CURVE PUT BACK TO SQUARING, which is the defect exactly as it shipped — and the point of
      this probe is WHICH guards notice. 0091's three all stay green: the aura is still silent at
      `FAR`, still full at `NEAR`, and the near half still carries more of the build than the far half.
      Every property 0091 stated survives a curve that had collapsed to 0.004 of its ceiling at the
      place a player being shot at actually sits.

      That is docs/decisions/0027-measure-the-picture-not-the-model.md in one edit: three guards
      written in terms of the constants they guard, all agreeing with the code, all wrong about the
      game. The guard below is written from `BOSSES` and the player's box instead, and it is the only
      one that goes red.
    */
    broke: 'the aura squared again, so backing off to dodge turns the boss’s own sound off',
    guard: '0092 — THE DEFECT: a player who backs off to dodge is still inside the aura',
    edit: {
      path: 'src/app/music.ts',
      find: '  return Math.pow(clamped, AURA_CURVE);',
      replace: '  return clamped * clamped;',
    },
  },
  {
    decision: '0092',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE RANGE PUT BACK TO 105, which is a number with no argument attached to it and was never
      wrong in a way anything could see: it is inside the reachable span, so *silent when far away*
      kept passing while the top fifth of the box was silent for no reason the player could feel.

      The guard is driven off `BOSSES` and `PLAYER_ALONG_MARGIN`, so it cannot be satisfied by moving
      the constant to meet it — a boss authored further out moves the requirement with it.
    */
    broke: 'the aura’s range cut back inside the box, so the far fifth of it is silent for no reason',
    guard: '0092 — THE RANGE COVERS THE BOX, so *far away* is somewhere the player can actually be',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const AURA_FAR_UNITS = 145;',
      replace: 'export const AURA_FAR_UNITS = 105;',
    },
  },
];
