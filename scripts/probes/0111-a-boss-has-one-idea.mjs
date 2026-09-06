// The breaks behind docs/decisions/0111-a-boss-has-one-idea.md.
//
// ⚠️ THE FIRST TWO ARE THE SHIPPED GAME, RESTORED — one behaviour with seven silhouettes on it, and a
// phase change no channel mentions. `docs/state-of-play.md` had both written down as owed for two
// days before the play-test reported them, and every guard in the repository was green on both.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0111',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE REPORTED ONE. Two bosses handed the same idea, which is the edit a hand makes when writing
      an eighth row by analogy with a seventh — and it is exactly how this decision's own last boss was
      first written. Everything else about the two rows still differs: the hull, the health, the
      station, the bullet, the phase numbers.
    */
    broke: 'two mid-bosses given the same movement and the same attack, so one fight has two skins',
    // ⚠️ Re-aimed by 0258: the pair is unique over the mid-bosses and over the real bosses as two
    // sets, and the axis bobs now — a spray makes it the harrow's pair.
    guard: 'THE REPORTED ONE: no two mid-bosses fly the same way AND shoot the same way',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    move: { kind: 'bob', amplitude: 20, wavelength: 180 },\n    attack: { kind: 'ring' },",
      replace: "    move: { kind: 'bob', amplitude: 20, wavelength: 180 },\n    attack: { kind: 'spray' },",
    },
  },
  {
    decision: '0111',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE PHASE CHANGE MADE INVISIBLE AGAIN, which is the state the game shipped in — the model
      resolves it, the boss fires wider and flies differently from that step, and neither channel says
      so. `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` records three
      play reports of this shape being filed as collision faults that did not exist.
    */
    broke: 'the phase change stopped shedding anything, so the boss changes state in silence',
    guard: 'THE OTHER REPORTED ONE: a phase change is an event the picture mentions',
    edit: {
      path: 'src/app/frame.ts',
      find: '      burst(w, boss.along, boss.across, BURST.phase);',
      replace: '      void BURST.phase;',
    },
  },
  {
    decision: '0111',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE PHASE COMPARED WITHIN A STEP RATHER THAN ACROSS ONE — which is not a hypothetical: it is
      what the first draft of this decision did. Health does not change inside `stepBoss`, so the two
      reads are identical by construction and the burst can never fire. It looks completely correct on
      the page, which is why it is here.
    */
    broke: 'the phase remembered per step instead of across steps, so the change can never be seen',
    guard: 'THE OTHER REPORTED ONE: a phase change is an event the picture mentions',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.bossPhaseAt >= 0) {',
      replace: '    if (w.bossPhaseAt >= 0 && false) {',
    },
  },
  {
    decision: '0111',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ A BOB WRITTEN AS A POSITION RATHER THAN AS A RATE, which is the obvious way to write it and
      the one that fights the renderer: `stepEntities` integrates the velocity, so assigning `across`
      here is overwritten on the same step and the hull sits still. Every other boss guard is about
      where it settles ALONG the lane and none of them notices.
    */
    broke: 'the bob emitting no lateral rate, so the up-and-down never happens',
    guard: 'and a bob is up-and-down: the hull crosses the lane and comes back, in world units',
    edit: {
      path: 'src/app/boss.ts',
      find: '      boss.velAcross = move.amplitude * rate * Math.cos((cameraAlong * TAU) / wavelength);',
      replace: '      boss.velAcross = 0;',
    },
  },
  {
    decision: '0111',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ A STALK THAT DOES NOT TRACK, written as the patrol it is closest to. It still moves, still
      reverses at the edges and still escalates with the phase; what it stops doing is caring where the
      player is, which is the whole of what separates the two arms.
    */
    broke: 'the stalker flying a fixed path, so the one boss that follows you does not',
    guard: 'and a stalker follows the player’s lane, which a patrol does not',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const want = ship.across - boss.across;',
      replace: '      const want = ACROSS_SPAN / 2 - boss.across;',
    },
  },
  {
    decision: '0111',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE FAN CENTRED ON THE SHIP AGAIN — the single most plausible mistake in this change, and the
      one that makes *"a spray that increases number of bullets as health goes down"* into one aimed
      shot with error bars. It is still a fan, still the phase's count and spread, still escalating.
    */
    broke: 'a boss’s pattern centred on the ship, so a spray is a spread that follows the player',
    guard: 'and a pattern is the same pattern wherever the player is, exactly as an enemy’s is',
    edit: {
      path: 'src/app/boss.ts',
      find: '      let centre = Math.PI;',
      replace: '      let centre = Math.atan2(dAcross, dAlong);',
    },
  },
];
