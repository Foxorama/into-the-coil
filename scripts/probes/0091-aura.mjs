// The breaks behind docs/decisions/0091-the-boss-has-an-aura.md.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the aura runs as a repeating cue instead of as music". There is no
// edit that stages it: it would be a different mechanism in a different file driven by a different
// clock, and the reason it cannot work — the fixed-step loop and the AudioContext are two crystals —
// is an argument rather than a line. The decision carries it; a probe cannot.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0091',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE AURA MADE A PROPERTY OF THE LEVEL RATHER THAN OF THE DISTANCE, which is the edit that
      looks like a simplification: every other layer reads its gain straight out of the ladder, so why
      does this one need a multiply? Because the ask is *"as it gets closer to the player"* — at full
      whenever a boss exists, it is a layer that arrives with the fight and then never says anything
      again.
    */
    broke: 'the aura pinned at its ceiling, so it stops answering to how close the boss is',
    guard: 'THE ASK: the aura follows the boss in, and is silent when it is far away',
    edit: {
      path: 'src/app/music.ts',
      find: '  return Math.pow(clamped, AURA_CURVE);',
      replace: '  return clamped > 0 ? 1 : 1;',
    },
  },
  {
    decision: '0091',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE RANGE MEASURED FROM THE CENTRES RATHER THAN THE HULLS. It is one subtraction and it reads
      as tidier — a distance is a distance — but a boss's radius runs from 11 to 13 today and will run
      wider, so the same gap in front of two different bosses would be two different sounds. What the
      player is judging is the space they are flying into.
    */
    broke: 'the nearness measured centre to centre, so a bigger boss is quieter at the same gap',
    guard: 'and it is measured between the HULLS, so every boss means the same thing',
    edit: {
      path: 'src/app/music.ts',
      find: '  return auraNearness(Math.abs(bossAlong - shipAlong) - bossRadius - shipRadius);',
      replace: '  return auraNearness(Math.abs(bossAlong - shipAlong));',
    },
  },
  {
    decision: '0091',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE CURVE STRAIGHTENED. A linear ramp is the obvious reading of *builds as it gets closer* and
      it spends most of its travel at distances nobody is thinking about — the interesting part of the
      ask is the last few units, where the player is committed. It sounds like a tuning preference and
      it is the difference between a sound that tracks the fight and one that tracks the level.
    */
    broke: 'the aura ramped linearly, so the half of the range the player fights in barely moves',
    guard: 'and the last few units are where it moves, because that is where the fight is',
    edit: {
      path: 'src/app/music.ts',
      find: '  return Math.pow(clamped, AURA_CURVE);',
      replace: '  return clamped;',
    },
  },
  {
    decision: '0091',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE AURA LEFT OUT OF THE BOSS ROW. Zero everywhere is a feature that is fully built, fully
      wired, fully guarded at the edges — and silent. It is exactly the shape 0090's *a layer left out
      of the bake* has, arriving one decision later in the table instead of in the code.
    */
    broke: 'the aura given no ceiling at the boss, so the whole feature is silent',
    guard: 'THE ASK: the aura follows the boss in, and is silent when it is far away',
    edit: {
      path: 'src/content/music.ts',
      find: "  boss: { drone: 0.36, bass: 0, beat: 0, sub: 1.12, engine: 1.12, perc: 0.96, chords: 0, groove: 0, arp: 0, ride: 0.9, call: 0, hook: 0, drive: 0.94, toll: 0.92, crash: 0.94, dread: 1.02, lead: 0, counter: 0, stomp: 0.92, frenzy: 0.86, wraith: 0.8, auraSlow: 1, auraFast: 0.9, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },",
      replace: "  boss: { drone: 0.36, bass: 0, beat: 0, sub: 1.2, engine: 1.12, perc: 0.96, chords: 0, groove: 0, arp: 0, ride: 0.9, call: 0, hook: 0, drive: 0.94, toll: 0.92, crash: 0.94, dread: 1.02, lead: 0, counter: 0, stomp: 0.92, frenzy: 0.86, wraith: 0, auraSlow: 0, auraFast: 0, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },",
    },
  },
  {
    decision: '0091',
    suite: 'tests/music.test.ts',
    /*
      ── THIS PROBE'S SUBJECT BECAME THE INTENDED BEHAVIOUR, AND IT IS RE-POINTED RATHER THAN KEPT ──

      ⚠️ It used to break *the aura opened before the fight* against a guard reading *nothing but a
      boss ever opens it*. `docs/decisions/0107-a-level-is-a-place.md` reversed that on the player's
      instruction — *"the aura music for the boss needs to start about 15-30secs into the start of a
      level and then amp up until you beat the boss"* — so the old break is now the feature, and a
      probe that reproduces the feature proves nothing at all.

      ⚠️ **WHAT SURVIVES OF 0091'S COUNTERWEIGHT IS THE HALF THAT WAS ALWAYS THE POINT**: the fight
      must still be the only place the aura reaches the top, or the boss arrives at a volume the level
      has been at for a minute and *"as it gets closer to the player"* has nothing left to say. So the
      break is the level-long build allowed all the way to 1 — which is the one edit that makes the
      arrival free and leaves every ladder assertion green.
    */
    broke: 'the level-long build allowed to reach the top, so the boss arrives at a volume it was already at',
    guard: '0107 — and nothing but a BOSS ever takes it to the top, though the level may raise it',
    /*
      ⚠️ RE-ANCHORED BY 0183, WHICH MADE THE CEILING A PLACE'S OWN. It was a constant in
      src/content/music.ts and is now THEMES[place].aura; the break is the identical edit one table
      over — the level-long build allowed all the way to 1 — and it lands on level one, the place
      whose whole job is to be the one that changes nothing.
    */
    edit: {
      path: 'src/content/themes.ts',
      find: "    // The reference, and the number every place used to be — 0183. Level one changes nothing.\n    aura: 0.55,",
      replace: "    // The reference, and the number every place used to be — 0183. Level one changes nothing.\n    aura: 1,",
    },
  },
];
