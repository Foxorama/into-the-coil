// A sound is made for the hundredth time — docs/decisions/0323-a-sound-is-made-for-the-hundredth-time.md
//
// Every guard 0323 adds, broken on purpose. `node scripts/prove-guard.mjs 0323`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0323',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION, IN ONE NUMBER.** The sizzle was 0.95 s and the serpent's
      opening phase throws every 0.70 s at `burn` — so the cue overlapped itself for as long as the phase
      lasted, which is 0104's *"a continuous tone with bumps"* about a boss instead of a gun.
    */
    broke: 'the sizzle back at 0.95 s, so the acid is still sounding when the serpent spits again',
    guard: 'THE REPORTED ONE: and a BOSS’s attack finishes before its own next volley',
    edit: {
      path: 'src/content/cues.ts',
      find: "{ wave: 'noise', from: 4200, to: 1400, seconds: 0.24,",
      replace: "{ wave: 'noise', from: 4200, to: 1400, seconds: 0.95,",
    },
  },
  {
    decision: '0323',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE SAME BREAK AGAINST THE FIGHT RATHER THAN THE TABLE.** The guard above is arithmetic over
      `stepBoss`'s own rules — a tier's cadence, a sweep's hold, a head's gap — and
      `docs/decisions/0027-measure-the-picture-not-the-model.md` is why a model of the fight is not the
      fight. This one is twelve flights of the real frame with the cues recorded as they are emitted.
    */
    broke: 'the sizzle back at 0.95 s, measured in the flown fight rather than in the table',
    guard: 'THE REPORTED ONE, DRIVEN: no attack of this animal is still sounding when it sounds again',
    edit: {
      path: 'src/content/cues.ts',
      // ⚠️ Re-anchored by 0331's cue re-balance (gain 0.44 → 0.273). The break is the LENGTH — this is
      // the same break as the probe above, measured in the flown fight instead of in the table — so the
      // anchor stops where that one does and the gain is no longer carried by either.
      find: "{ wave: 'noise', from: 4200, to: 1400, seconds: 0.24,",
      replace: "{ wave: 'noise', from: 4200, to: 1400, seconds: 0.95,",
    },
  },
  {
    decision: '0323',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ **AND THE CRASH THIRTEEN BOSSES SHARE, WHICH IS THE BOSS NOBODY WAS ASKING ABOUT.** At 0.38 s it
      overlapped itself in the medusa's last phase at `burn`, where the round is 0.30 s — the tightest sound
      in the game, and the reason this guard is over the whole table rather than over one animal.
    */
    broke: 'the shared crash back at 0.38 s, where the medusa’s own cadence overlaps it',
    guard: 'THE REPORTED ONE: and a BOSS’s attack finishes before its own next volley',
    edit: {
      path: 'src/content/cues.ts',
      // ⚠️ Re-anchored by 0331's cue re-balance (gain 0.62 → 0.372); the break is the LENGTH.
      find: "{ wave: 'tri', from: inKey(7), to: inKey(0), seconds: 0.28,",
      replace: "{ wave: 'tri', from: inKey(7), to: inKey(0), seconds: 0.38,",
    },
  },
  {
    decision: '0323',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ **THE DEATH BACK ON THE SEVENTH, WHICH IS WHAT SHIPPED AND WAS ARGUED FOR AT LENGTH.** *"The ear is
      left waiting for a note that never comes"* is a good idea about one hearing and the wrong idea about
      the two hundredth, which is what the report says in its own words.
    */
    broke: 'the death falling onto the seventh again, so the sound the player hears most never lands',
    guard: '0323 — the death RESOLVES',
    edit: {
      path: 'src/content/cues.ts',
      // ⚠️ Re-anchored by 0331, which lengthened the death's fall from 1.15 s to 1.2. The seconds stay
      // in the anchor because `blast` now carries the same two notes over 0.7 s and nothing else
      // separates them; the break is the DESTINATION, which is the seventh instead of the root.
      find: "{ wave: 'sine', from: inKey(12), to: inKey(0), seconds: 1.2,",
      replace: "{ wave: 'sine', from: inKey(12), to: inKey(-1), seconds: 1.2,",
    },
  },
];
