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
      // layer's pattern out into `layerNotes` so the prewarm can spread it across frames, and again by
      // docs/decisions/0128-a-place-plays-its-own-material.md, which made the source of a layer's
      // voices a function of the place. The break is unchanged both times — one layer left out of the
      // bake — and it is still expressed where the notes are gathered.
      find: '  for (const voice of voicesOf(theme, layer)) {',
      replace: "  for (const voice of (layer === 'chords' ? [] : voicesOf(theme, layer))) {",
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
      find: "  surge: { drone: 0.33, bass: 0, beat: 0, sub: 1.04, engine: 1, perc: 0.82, chords: 0.86, groove: 0.94, arp: 0, ride: 0.68, call: 0, hook: 0.74, drive: 0.78, toll: 0, crash: 0.9, dread: 0, lead: 0.78, counter: 1.05, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.75, auraFast: 0.55, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },",
      replace: "  surge: { drone: 0.33, bass: 0, beat: 0, sub: 1.04, engine: 0, perc: 0.82, chords: 0.86, groove: 0.94, arp: 0.7, ride: 0.68, call: 0, hook: 0.74, drive: 0.78, toll: 0, crash: 0.9, dread: 0, lead: 0.78, counter: 1.05, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.75, auraFast: 0.55, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },",
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
      /*
        ⚠️ RE-AIMED BY 0177, AND 0158 IS WHAT LEFT IT BEHIND. The break named `bossAt`, and that
        decision took it out of `musicLevelFor`'s signature — the guard's own comment says so:
        *"AND THAT IS WHY `bossAt` IS NO LONGER AN ARGUMENT AT ALL"*. So the module threw
        `ReferenceError: bossAt is not defined` and the test died on that, **without the guard ever
        asserting**. It reported `red`, which is what a working probe reports.

        ⚠️ THE CLAIM IS UNCHANGED: a DISTANCE deciding the boss rung rather than a boss being there.
        What moved is which distance, because there is no longer a `bossAt` to name — it is now the
        start of the last section the level scripts, which is the nearest thing in scope and is
        exactly the *"threshold the camera passes in the opening seconds of the fight"* the comment
        above is about.
      */
      find: "  if (bossOnField) return bossHealthLeft <= BOSS_PEAK_HEALTH ? 'bossPeak' : 'boss';",
      replace:
        "  if (cameraAlong >= (sections.at(-1)?.at ?? Infinity)) return bossHealthLeft <= BOSS_PEAK_HEALTH ? 'bossPeak' : 'boss';",
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
    broke: 'a section cut shorter than the ramp that opens it, so its arrival never finishes',
    /*
      ⚠️ RE-AIMED BY 0161. This used to name *and builds as the boss gets close, in SECONDS the player
      experiences*, which required the last section to last 6-30 seconds — and that guard is gone,
      because it made every level end with a short build. **The break is unchanged and still red**: 40
      units is 1.1 s, under the 1.6 s ramp, so the section's own arrival cannot complete and the
      player hears a wobble rather than a change. That is the one bound 0161 kept.
    */
    guard: '0161 — every section a level names is one the game reaches, and outlasts its own ramp',
    edit: {
      /*
        ⚠️ THE ANCHOR MOVED WITH 0158, WHICH DELETED `BOSS_APPROACH_UNITS`. The build is no longer one
        constant shared by seven levels — it is whatever each level's script puts last, so breaking it
        means moving one level's last entry up against its boss. 4420 of 4460 leaves 40 units, which
        is about a second: a cue, and a cue is `src/content/cues.ts`'s job.

        ⚠️ AND IT IS `eye` RATHER THAN LEVEL ONE BECAUSE THE ANCHOR HAS TO BE UNIQUE. Levels one and
        three share a `bossAt` and therefore ship identical scripts, so `{ at: 3627, … }` appears
        twice and `planEdit` refuses it — correctly. The guard runs over all seven levels now, so any
        one of them going wrong is enough to turn it red.

        ⚠️ AND IT MOVED AGAIN WITH `docs/decisions/0180-the-black-heart-gets-there-sooner.md`, WHICH IS
        THE COST OF ANCHORING ON AN AUTHORED NUMBER. 3817 → 3986: `eye`'s script is a hand's now and
        will move again whenever the desk says so. The break is unchanged — 4420 of 4460 still leaves
        40 units, still 1.1 s, still under the 1.6 s ramp — and re-anchoring is a two-second failure
        the pre-flight reports before a tree is copied, which is the trade 0079 argued for.
      */
      path: 'src/content/levels.ts',
      find: "      { at: 3986, section: 'approach' },",
      replace: "      { at: 4420, section: 'approach' },",
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
