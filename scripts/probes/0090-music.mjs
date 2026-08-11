// The breaks behind docs/decisions/0090-the-music-is-four-loops.md.
//
// ⚠️ THE DESIGN HAS ONE UNRECOVERABLE FAILURE and the first probe is it. Four loops started together
// and left alone stay in phase only if they are the same number of samples; there is no scheduler
// anywhere to re-align them, so a length that rounds is a piece of music that comes apart over a
// couple of minutes. It is inaudible at first, which is the worst shape a defect can have.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the music sounds wrong". Nothing in a test suite can hear, and the
// guards below hold the structure the sound is made of rather than the sound — `node scripts/hear.mjs
// --music` is the other instrument, and the verdict is a hand.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0090',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE DRIFT. 0.45 is not a pretty number and 0.5 is, so this is the tuning edit somebody makes
      while thinking about tempo rather than about samples — 133⅓ BPM to 120, which sounds like an
      improvement and is one everywhere except in the arithmetic.

      At 0.4666 a two-bar loop is 164640.0 samples at 44100 and 82320.0 at 22050... and 0.47 is
      165816.0 and 82908.0. The break below uses a value that DOES round, because the failure is not
      "an odd tempo" — it is a length that is not a whole number of samples at some rate the bake may
      be given.
    */
    broke: 'the beat retuned to a length that does not divide the sample rate, so the layers drift apart',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: the loop is a whole number of samples at every rate',
    edit: {
      path: 'src/content/music.ts',
      // ⚠️ Re-anchored by 0093, which took the beat to 0.4s — 150 BPM, 24 sim steps. The BREAK is
      // unchanged and so is its reasoning: a length that does not divide the sample rate.
      find: 'export const BEAT_SECONDS = 0.4;',
      replace: 'export const BEAT_SECONDS = 0.4667;',
    },
  },
  {
    decision: '0090',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ A LAYER THAT RENDERS TO NOTHING, and it is the way a quarter of the music can go missing with
      every other guard green: the ladder still climbs, the gains still ramp, the loops are still the
      right length, and the boss fight is missing its arpeggio. Nothing anywhere would have failed.
    */
    broke: 'a layer left out of the bake, so a quarter of the music is silence nothing complains about',
    guard: 'and none of them is silence, which is the way a layer can be missing without failing',
    edit: {
      path: 'src/app/music.ts',
      // ⚠️ Re-anchored by docs/decisions/0102-the-music-goes-somewhere.md, which split the walk over a
      // layer's pattern out into `layerNotes` so the prewarm can spread it across frames. The break is
      // unchanged — one layer left out of the bake — and it is expressed where the notes are gathered.
      find: '  for (const voice of MUSIC[layer]) {',
      replace: "  for (const voice of (layer === 'chords' ? [] : MUSIC[layer])) {",
    },
  },
  {
    decision: '0090',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE LADDER MADE A SET OF SWITCHES RATHER THAN A BUILD. Closing the bass for the boss is the
      edit somebody makes to clear room in the low end — and it turns *one piece of music getting
      fuller* into four arrangements that swap, which is what the ask was not.
    */
    broke: 'a level closing a layer the level below it had open, so the ladder swaps rather than builds',
    guard: 'opens a layer at every step and never opens one twice',
    edit: {
      path: 'src/content/music.ts',
      // ⚠️ RE-ANCHORED by docs/decisions/0091-the-boss-has-an-aura.md, which gave every level two
      // more layers. Same break, same guard: a level that closes what the one below it had open.
      // ⚠️ Re-anchored by 0092, which moved `drone` and both aura ceilings on this row.
      // ⚠️ AND THE BREAK ITSELF MOVED WITH 0095. It used to close `bass` at the boss; `bass` belongs
      // to the title's piece now and is closed at `run` on purpose, so closing it again says nothing.
      // `engine` is the level's floor — open at `run` and `approach` — and closing it at the boss is
      // the same failure the probe always described: a ladder that swaps rather than builds.
      find: "  surge: { drone: 0.33, bass: 0, beat: 0, sub: 1.04, engine: 1, perc: 0.82, chords: 0.86, groove: 0.94, arp: 0, ride: 0.68, call: 0, hook: 0.74, drive: 0.78, toll: 0, crash: 0.9, dread: 0, lead: 0.78, counter: 1.05, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.75, auraFast: 0.55 },",
      replace: "  surge: { drone: 0.33, bass: 0, beat: 0, sub: 1.04, engine: 0, perc: 0.82, chords: 0.86, groove: 0.94, arp: 0.7, ride: 0.68, call: 0, hook: 0.74, drive: 0.78, toll: 0, crash: 0.9, dread: 0, lead: 0.78, counter: 1.05, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.75, auraFast: 0.55 },",
    },
  },
  {
    decision: '0090',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE BOSS LEVEL KEYED TO THE DISTANCE ALONE, which is the reading anybody would reach for —
      the approach is a distance, so why is the fight not? Because a boss drifts (0061) and a fight
      lasts as long as it lasts: the camera passes `bossAt` in the opening seconds of the fight, so a
      distance rule drops the music back to a cruise while the boss is still on the screen shooting.
    */
    broke: 'the boss level keyed to the camera rather than to a boss being there, so the music leaves mid-fight',
    guard: 'and goes to the boss the moment one is on the field, wherever the camera is',
    edit: {
      path: 'src/app/music.ts',
      // ⚠️ Re-anchored by docs/decisions/0102-the-music-goes-somewhere.md, which turned the single
      // return below into a cascade of four. The break is unchanged and is now the one line it always
      // was about: what decides the boss level.
      find: "  if (bossOnField) return bossHealthLeft <= BOSS_PEAK_HEALTH ? 'bossPeak' : 'boss';",
      replace: "  if (cameraAlong >= bossAt) return bossHealthLeft <= BOSS_PEAK_HEALTH ? 'bossPeak' : 'boss';",
    },
  },
  {
    decision: '0090',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE BUILD SHORTENED TO A STING. A shorter approach reads as a tidier number and it is the
      difference between music that builds and a warning noise: at 40 units the beat arrives about a
      second before the boss does, which is a cue, and a cue is `src/content/cues.ts`'s job.
    */
    broke: 'the boss approach cut to a length that is a sting rather than a build',
    guard: 'and builds as the boss gets close, in SECONDS the player experiences',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const BOSS_APPROACH_UNITS = 643;',
      replace: 'export const BOSS_APPROACH_UNITS = 40;',
    },
  },
  {
    decision: '0090',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE WRAP REMOVED — the one line the music needed that a cue did not. Without it every note
      whose tail crosses the end of the loop is cut off there, so the loop has a notch in it at the
      same place every 3.6 seconds. It is the kind of thing that reads as a glitch in the build rather
      than as a bug in a synthesiser.

      ⚠️ IT WAS AIMED AT THE MIX FIRST AND CAME BACK STILL GREEN. Every other guard in the file
      survives this edit — the lengths are right, no layer is silent, the ladder is intact and the sum
      does not clip — so the seam needed an assertion of its own. It is stated as a property rather
      than against the drone: a loop cannot be quieter where it begins than where it ends, which is
      true of any loop whatever is in it.
    */
    broke: 'the loop wrap removed, so every note that crosses the end is cut off at the same place',
    guard: 'THE SEAM: a loop is not quieter at its start than at its end',
    edit: {
      path: 'src/app/sound.ts',
      find: '    const at = wrap ? raw % out.length : raw;',
      replace: '    const at = raw;',
    },
  },
];
