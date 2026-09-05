// The breaks behind docs/decisions/0084-the-dial-is-the-level-and-the-guns.md.
//
// ⚠️ The dial is TWO numbers added together and a threshold read off the sum, so almost every way of
// getting it wrong looks like a working dial: it still rises, it still resets, it still clamps. What
// each probe below removes is one of the four sentences the report actually asked for — starts at the
// bottom, rises within a level, drops back at a boundary, arrives at the top — plus the one thing the
// dial spends.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the dial does nothing at all". There is no edit that stages it: the
// dial has exactly one consumer today, and every probe that breaks the consumer is the last one in
// this list. That is worth saying rather than leaving as a gap — a mechanism with one reader is one
// refactor from being dead code, and chunk 7 is what gives it more.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0084',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE SAWTOOTH'S TEETH REMOVED, and it is the single most plausible mistake in the file: the
      counter looks like bookkeeping that belongs with `nextPickup`, and `nextPickup` is reset in the
      same function. Leave this one out and the dial climbs monotonically to the end of the run —
      which is exactly the curve the report is complaining about, rebuilt out of the fix for it.
    */
    broke: 'the offered count left standing at a level boundary, so the dial never comes back down',
    /*
      ⚠️ NAMED FOR THE FRAME GUARD RATHER THAN THE ARITHMETIC ONE, and `npm run prove` reported WRONG
      TEST until it was. `THE SAWTOOTH` is a property of `dialFor`, which is a pure function and cannot
      see a reset that happens in `beginScript` — the two halves of the sawtooth live in two layers,
      and only the one driven through the real frame can catch this.
    */
    guard: 'resets what the level offered without resetting where the run has got to',
    edit: { path: 'src/app/frame.ts', find: '  w.weaponsOffered = 0;', replace: '  w.weaponsOffered = w.weaponsOffered;' },
  },
  {
    decision: '0084',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE OTHER HALF OF THE SAWTOOTH, and its counterweight. Without the level term a level opens
      exactly where the first one did, so the run has dips and no progression — *"there should be
      progression of mission and difficulty from one level to the next"* is the sentence this removes.
    */
    broke: 'the level term dropped, so every level opens at the bottom of the dial',
    guard: 'THE SAWTOOTH: a level opens easier than the last one ended',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  const raw = DIAL_MIN + levelIndex * DIAL_PER_LEVEL + weaponsOffered * DIAL_PER_WEAPON;',
      replace: '  const raw = DIAL_MIN + weaponsOffered * DIAL_PER_WEAPON;',
    },
  },
  {
    decision: '0084',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE ENDPOINT, AND THE BREAK IS A CONTENT EDIT RATHER THAN A CODE ONE. *"It's a dial that
      starts at 1 and should be at 11 when the player is dealing with the last boss."* That number is
      not written in `src/content/levels.ts` anywhere — it falls out of seven levels offering four
      weapons each — so a level gaining a fifth weapon pickup silently pushes the last two levels into
      the clamp and the top of the dial stops being a place the player ever reaches.

      This is the probe for a claim that lives in the multiplication of two files, which is the shape
      nothing else in the repository holds.
    */
    broke: 'the LAST level given an extra weapon, so the run runs past the top of the dial',
    guard: 'THE ENDPOINT: the last boss is fought at exactly the top of the dial',
    edit: {
      path: 'src/content/levels.ts',
      // `eye` — the last level, so its peak is the one `DIAL_MAX` is measured against.
      // ⚠️ Re-anchored by 0256: a level authors a weapon and a missile, and this is the eye's missile.
      find: "  { at: 892, kind: 'missile', lane: 64 },",
      replace: "  { at: 892, kind: 'missile', lane: 64 },\n  { at: 3100, kind: 'weapon', lane: 44 },",
    },
  },
  {
    decision: '0084',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE SAME CONTENT EDIT IN A LEVEL THAT IS NOT THE LAST ONE, AND IT NEEDED ITS OWN GUARD.
      `npm run prove` ran this against `THE ENDPOINT` and got **STILL GREEN**: the endpoint only looks
      at level seven, and the sawtooth only compares a level's opening to the previous one's. An extra
      weapon in level six raised its boss to 11 — level seven's number — so the run's last two fights
      became the same difficulty and nothing said a word.

      `THE CLIMB` is the guard that was missing, and this is what found it.
    */
    broke: 'a MIDDLE level given an extra weapon, so two bosses are fought at the same difficulty',
    guard: 'THE CLIMB: every boss is fought harder than the last one',
    edit: {
      path: 'src/content/levels.ts',
      // `gauntlet` — level six, so the flat spot lands between the last two bosses.
      // ⚠️ Re-anchored by 0256: a level authors a weapon and a missile, and this is the gauntlet's
      // missile. TWO extra weapons in level six put its boss past 11 — the level's step is a
      // fraction now, so one extra leaves it a third under level seven's and still climbing — and
      // the clamp lands it ON level seven's, which `THE CLIMB` refuses as a flat spot.
      find: "  { at: 868, kind: 'missile', lane: 42 },",
      replace: "  { at: 868, kind: 'missile', lane: 42 },\n  { at: 3000, kind: 'weapon', lane: 44 },\n  { at: 3400, kind: 'weapon', lane: 56 },",
    },
  },
  {
    decision: '0084',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE DIAL LEFT AS ARITHMETIC NOBODY READS. The clamp is its only consumer, so removing this
      one term is the difference between a mechanism and a number in a file — and the game would look
      completely normal, with a three-health turret in the opening thirty seconds exactly as reported.
    */
    broke: 'the clamp dropped from the spawn, so the opening spike comes back',
    guard: 'and it reaches the FIELD, not just the table',
    edit: {
      path: 'src/app/frame.ts',
      find: '    e.health = singleHitOnly(w.levelIndex, w.weaponsOffered) ? 1 : toughnessFor(row.health, w.difficulty);',
      replace: '    e.health = toughnessFor(row.health, w.difficulty);',
    },
  },
  {
    decision: '0084',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE CLAMP MADE PERMANENT, which is the failure in the other direction and the one a guard
      over the opening alone cannot see. *Nothing is tough early* is satisfied just as well by *nothing
      is ever tough*, and the opening would look exactly right.
    */
    broke: 'the clamp never lifting, so nothing in the game ever takes more than one hit',
    guard: 'and once the clamp lifts, a tough enemy is tough again',
    edit: { path: 'src/content/difficulty.ts', find: 'export const MULTI_HIT_DIAL = 3;', replace: 'export const MULTI_HIT_DIAL = 99;' },
  },
  {
    decision: '0084',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE `levelIndex === 0` TERM REMOVED, AND THIS BREAK IS A DRAFT OF THIS DECISION. The first
      version of `singleHitOnly` was a plain dial threshold, and the guard below caught it: the
      sawtooth reuses low dial values, so level two opens at 2 and the clamp comes back on. Most of the
      game's openings would have had no multi-hit enemies in them.

      Kept as a probe because it is the reading anybody would reach for — *it is a dial rule, so read
      the dial* — and because no threshold value fixes it. `src/content/difficulty.ts` has the
      arithmetic.
    */
    broke: 'the clamp keyed to the dial alone, so it returns at the opening of every early level',
    guard: 'and level two is past it from its first wave',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  return levelIndex === 0 && dialFor(levelIndex, weaponsOffered) < MULTI_HIT_DIAL;',
      replace: '  return dialFor(levelIndex, weaponsOffered) < MULTI_HIT_DIAL;',
    },
  },
];
