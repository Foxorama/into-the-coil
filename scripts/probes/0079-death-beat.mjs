// The breaks behind docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md.
//
// ⚠️ The first three restore code that SHIPPED and that every guard in the repository was green for:
// one burst, one `onDeath`, one respawn, all on the step the hull reached zero. That is the whole of
// *"when a player dies, they instantly respawn"*, and no assertion in the suite could see it — which
// is `docs/decisions/0027-measure-the-picture-not-the-model.md` from the direction it warns about.
//
// ⚠️ The middle group is the eight call sites `reports/the-death-beat-mapped-2026-08-08.md` listed as
// having to be gated. Six of them produce a game that looks completely normal in a screenshot, which
// is the condition `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` exists for.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly: the beat cut to nothing, so the life is spent on the step
      the hull reaches zero and the shell puts a new ship back before the frame is drawn. The player
      never sees the death — and on the last life the continue screen is up over the burst.
    */
    broke: 'the beat removed, so the life is spent on the step the hull reaches zero',
    guard: 'is off the screen for most of a second',
    edit: { path: 'src/app/frame.ts', find: 'const DEATH_STEPS = 48;', replace: 'const DEATH_STEPS = 0;' },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    // The other direction, which is the failure this change is most likely to be reported for next: a
    // beat the player sits through several times a run, long enough to become a tax.
    broke: 'the beat stretched to something the player waits through',
    // The same test as the probe above and the opposite assertion inside it: a beat has a floor AND
    // a ceiling, and the harness matches on the test's name rather than on which line went red.
    guard: 'is off the screen for most of a second',
    edit: { path: 'src/app/frame.ts', find: 'const DEATH_STEPS = 48;', replace: 'const DEATH_STEPS = 240;' },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    /*
      ⚠️ THE HALF-FIX, and it is the one a hand would actually write: a beat that plays out while the
      ship is still sitting in the lane. Nothing about the timing is wrong in this state — the life is
      still spent at the end, the continue screen still waits — and the picture is a game that has
      frozen rather than a ship that has died.
    */
    broke: 'the wreck left in its pool, so the beat shows a stationary hull rather than an absence',
    guard: 'is off the screen for most of a second',
    edit: { path: 'src/app/frame.ts', find: '  w.shipPool.releaseAt(0);', replace: '  void 0;' },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    /*
      ⚠️ THE WORST GATE TO LOSE, and it is invisible in a screenshot. A wreck left in its collision
      pairings goes on taking hits: health walks further negative, the death check fires again on
      every step of the beat, and the run empties itself at sixty lives a second.
    */
    broke: 'the collision gate removed, so a wreck keeps taking hits and the run pays for each one',
    guard: 'costs exactly one life however hard the field keeps hitting it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (flying && w.ship.health <= 0) wreckShip(w);',
      replace: '    if (w.ship.health <= 0) wreckShip(w);',
    },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    // A wreck that keeps shooting. The screen looks entirely normal — a stream of pulses leaving a
    // point in the lane — and it is the player's dead ship still fighting.
    broke: 'the weapon gate removed, so a wreck goes on firing through its own explosion',
    guard: 'fires nothing and throws nothing while it is coming apart',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (flying) {\n      askSpecials(w);\n      fireShip(w);\n      fireMissiles(w);\n    }',
      replace: '    askSpecials(w);\n    fireShip(w);\n    fireMissiles(w);',
    },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    // A wreck that collects — including the scatter its own death is about to throw, which is the
    // player being handed back what the death was supposed to take.
    broke: 'the collection gate removed, so a wreck picks up what it flies over',
    guard: 'collects nothing, including the scatter it is about to throw',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (flying) collectInto(w.pickups, w.ship, COLLECT_REACH, w.collected);',
      replace: '    collectInto(w.pickups, w.ship, COLLECT_REACH, w.collected);',
    },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    /*
      ⚠️ THE ONE A STILL FRAME CANNOT SEE, and it is the mistake 0062 documents having made once
      already: the place remembered as a WORLD position. The first frame of the explosion is perfect,
      and by the last one the camera has walked 27 units out from under it.
    */
    broke: 'the explosion left in world coordinates, so the scroll walks away from it',
    guard: 'keeps exploding where the player watched it die',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.cameraAlong + w.deathOffset + w.burstRng.range(-spread, spread),',
      replace: '      w.deathOffset + w.burstRng.range(-spread, spread),',
    },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    /*
      ⚠️ THE SAME MISTAKE ONE FUNCTION OVER, and it is the line the beat put at risk rather than one
      it wrote: `scatterUpgrades` read the ship's own position, which was exactly right while the
      scatter happened on the step the hull reached zero.
    */
    broke: 'the scatter thrown from the ship object, which has not moved with the camera',
    guard: 'throws the upgrades out of the wreck and not a beat behind it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const along = w.cameraAlong + w.deathOffset;',
      replace: '  const along = w.ship.along;',
    },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    // The ship never put back into its pool. Everything about the beat is right and there is no game
    // afterwards — the one failure here that a player would report in under a second.
    broke: 'the respawn left without a pool slot, so the ship never comes back',
    guard: 'hands the same ship back, because there is only ever one',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.shipPool.size === 0) {\n    const back = w.shipPool.spawn();\n    if (back !== null) w.ship = back;\n  }',
      replace: '  void 0;',
    },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    // The counter left set across a new run — the field
    // `docs/decisions/0067-a-new-run-opens-on-an-empty-field.md` exists because one like it was missed.
    broke: 'the beat left counting into a new run, which then opens with a ship that is still dying',
    guard: 'does not open a new run mid-beat',
    edit: { path: 'src/app/frame.ts', find: '  w.dyingIn = 0;\n  if (w.shipPool.size === 0) {', replace: '  if (w.shipPool.size === 0) {' },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    /*
      ⚠️ THE PYRE NEVER LIT. It is the whole of the second half of this decision and nothing else in
      the game reports it: no cue is missing, no pool overruns, and the only trace is a death that
      leaves the field exactly as full as it found it.
    */
    broke: 'the pyre never lit, so a death leaves the field exactly as full as it found it',
    guard: 'goes off where the ship died, at the size the arsenal was carrying',
    edit: { path: 'src/app/frame.ts', find: '  w.onWreck();', replace: '  void 0;' },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    // The pyre's ladder collapsed to one rung. Every ring is a bomb's blast, so what the player was
    // carrying stops being visible at the one moment it is being spent for them.
    broke: 'the pyre ladder collapsed to one rung, so the arsenal stops being legible in the ring',
    guard: 'is the ladder the ask names',
    edit: {
      path: 'src/content/specials.ts',
      find: "export const PYRES: readonly ShotKind[] = ['blastHalf', 'blast', 'blastWide', 'blastWidest'];",
      replace: "export const PYRES: readonly ShotKind[] = ['blast', 'blast', 'blast', 'blast'];",
    },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    /*
      ⚠️ THE CLAMP LET OFF ITS LEASH. A run reaches the top of a four-rung ladder before its fourth
      level, so an unclamped index is `undefined` at every rung past the last — which falls back to
      the SMALLEST ring, and the player carrying the most gets the least.
    */
    broke: 'the pyre’s top rung unclamped, so a full arsenal falls off the end of the ladder',
    guard: 'is the ladder the ask names',
    edit: {
      path: 'src/content/specials.ts',
      find: '  const rung = charges < 0 ? 0 : charges > PYRES.length - 1 ? PYRES.length - 1 : Math.floor(charges);',
      replace: '  const rung = charges < 0 ? 0 : Math.floor(charges);',
    },
  },
  {
    decision: '0079',
    suite: 'tests/death.test.ts',
    // The ring drawn at a size that is not the size it damages at — the guard `tests/bombs.test.ts`
    // wrote for one blast, now owed by four.
    broke: 'a pyre rung drawn at a size other than the one it damages at',
    guard: 'draws every rung at exactly the radius it damages at',
    edit: { path: 'src/content/sprites.ts', find: '  blastWidest: 136,', replace: '  blastWidest: 100,' },
  },
  {
    decision: '0079',
    suite: 'tests/budget.test.ts',
    // The death beat's rate raised past what the debris pool can hold alongside a boss's. `src/sim/pool.ts`
    // drops rather than grows, so the fullest the screen ever gets is where bursts stop appearing.
    broke: 'the death beat’s rate raised past what the debris pool can hold beside a boss',
    guard: 'leaves room for a boss and a player dying in the same second',
    edit: { path: 'src/content/debris.ts', find: '  dying: 10,', replace: '  dying: 30,' },
  },
  /*
    ── THE OTHER THING THIS SESSION BROKE, AND THE REPAIR FOR IT ───────────────────────────────────

    Two lines moved in `src/app/frame.ts` and stranded probes belonging to **0041 and 0050** — neither
    of which this decision had any reason to open. `npm run prove` says so, correctly and by name, and
    it said so after the baseline suites, six tree copies and 384 vitest runs: twelve minutes, from
    CI, on a machine that was not the one that moved the line.

    `anchorFailures` asks `planEdit`'s existing question before anything is copied, over EVERY probe
    rather than the filtered set. The three below are what make that check itself falsifiable.
  */
  {
    decision: '0079',
    suite: 'tests/prove-guard.test.ts',
    // The pre-flight taught to answer *nothing wrong*, which is the one answer it must never guess.
    broke: 'the anchor pre-flight made to report nothing, so a stranded probe runs and proves nothing',
    guard: 'names the probe whose anchor the code moved out from under',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  const out = [];\n  for (const probe of probes) {\n    const label = ',
      replace: '  const out = [];\n  if (probes.length >= 0) return out;\n  for (const probe of probes) {\n    const label = ',
    },
  },
  {
    decision: '0079',
    suite: 'tests/prove-guard.test.ts',
    // The missing-file arm dropped. A probe whose whole FILE moved is the same failure as one whose
    // line moved, and it is the arm a reader is most likely to think redundant.
    broke: 'the pre-flight’s missing-file arm dropped, so a probe whose file moved reads as healthy',
    guard: 'names a probe whose file has gone',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "      detail(`${probe.edit.path} does not exist. The file moved and the probe did not.`);\n      continue;",
      replace: '      continue;',
    },
  },
  {
    decision: '0079',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ **THE LIVE ONE, and it is the only probe here that strands a REAL anchor.** The two synthetic
      cases prove the check works; this proves it is pointed at the actual probe set, which is the
      thing that goes stale.

      ⚠️ **It strands ANOTHER decision's probe, deliberately and out of necessity.** Deliberately,
      because that is the failure being modelled — an edit here orphaned probes belonging to 0041 and
      0050, and neither was a file this session opened. Out of necessity, because `planEdit` searches
      one file: a probe that quoted an anchor from THIS file would make that anchor appear twice in
      it — once as the real probe and once inside this literal — and the harness would refuse it as
      ambiguous. Which it did, on the first attempt.
    */
    broke: 'a real probe’s anchor pointed at code that is not there, exactly as an unrelated edit does',
    guard: 'every probe in the repository can still be applied to the tree as it stands',
    edit: {
      path: 'scripts/probes/0078-sky-speed.mjs',
      find: "find: '{ sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.24 },'",
      replace: "find: '{ sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.99 },'",
    },
  },
];
