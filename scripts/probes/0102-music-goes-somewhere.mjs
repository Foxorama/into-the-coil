// The breaks behind docs/decisions/0102-the-music-goes-somewhere.md.
//
// ⚠️ THREE REPORTS ACROSS TWO PLAY-TESTS AND ONE ENABLING CHANGE, so the probes come in two shapes:
// the ones that restore what was reported, and the one that breaks the thing that PAID for the rest.
// 0090's, 0091's and 0095's probes all still hold their own claims and none of them can see any of
// this: the ladder was additive before and is additive now, the loops were whole numbers of samples
// before and are now, and every one of those guards was green over a level that played one
// arrangement for a hundred and sixty seconds.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0102',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE SHIPPED LADDER, PUT BACK — one rung from the moment a level begins until 430 units before
      its boss. *"The ingame background music doesn't change and increase in tempo as you progress
      through the level."* Every other assertion about the ladder is green over this: it is still
      additive, still opens a layer at every rung it has, still never closes one outside `TITLE_ONLY`.
      What it is not is a build.
    */
    broke: 'the level ladder collapsed back to one rung, which is how it shipped',
    // ⚠️ THE GUARD WAS RENAMED BY 0161, which took the 10-second floor and the 90-second ceiling out
    // of it. What still catches this break is the other half of the same test: a level that never
    // leaves its opening section reaches ONE where its script names four.
    guard: '0161 — every section a level names is one the game reaches, and outlasts its own ramp',
    edit: {
      path: 'src/app/music.ts',
      /*
        ⚠️ **RE-ANCHORED BY 0138, WHICH TURNED THE THREE DISTANCES INTO A PARAMETER**, and again by
        0158, which turned the cascade of comparisons into a walk over the level's own script. The
        claim is untouched across both — a level that reaches one rung and stays there is still what
        this puts back — and the shape of the code it has to reach into has changed twice.

        ⚠️ **THE BREAK IS NOW *STOP WALKING AFTER THE FIRST ENTRY***, which is the same collapse: the
        camera never leaves the section the level opens at, however many the script names.
      */
      find: '    if (entry.at > cameraAlong) break;\n    section = entry.section;',
      replace: '    break;',
    },
  },
  /*
    ── A PROBE STOOD HERE AND 0161 RETIRED IT WITH THE GUARD IT NAMED ──────────────────────────

    docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md. It broke *the level stripped back
    below its own opening on the way to the boss* and aimed at the density guard, which is deleted:
    both of its halves said a level may only ever get denser and every boss must be loud.

    ⚠️ THE BREAK IT PLANTED IS NOW A LEGAL AUTHORING CHOICE, which is the whole of why the guard
    went. A level that thins out on the way to its boss is a level with a quiet approach, and that
    is a thing a place may be.

    ⚠️ THIS PROBE HAD BEEN RE-ANCHORED FOUR TIMES IN TWO DAYS by its own note, every time a mix pass
    moved a row of twenty-three numbers. A guard that expensive to keep pointed at its subject was
    telling us something about the guard.
  */
  {
    decision: '0102',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE LEVEL'S BASS LINE CLOSED, which is the state the game shipped in for its whole life and
      which nothing has ever noticed. `bass` is `TITLE_ONLY` and 0095 was right to close it; what 0095
      did not do is replace it, so from the moment a level began the only thing under the kick was the
      chords' own sub. *"Flat and lifeless, has no depth."*
    */
    broke: 'the level left with no moving bass line, which is how it shipped',
    guard: 'THE LEVEL: there is something in the low end that MOVES, at every rung above the opening',
    edit: {
      path: 'src/content/music.ts',
      /*
        ⚠️ **AND THIS ONE MOVED DOWN A RUNG TOO, FOR THE SAME REASON AND WITH MORE AT STAKE.** 0104
        opened `groove` at `run`, so the level's bass line now arrives with the level; closing it at
        `push` would leave the first third of every level with a bass line and take it away later,
        which is not the shipped defect this probe reproduces. `run` is where it has to go now — and
        that is a stricter break than the old one, because it is the whole level rather than its
        last two thirds.
      */
      find: "  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0.8, arp: 0, ride: 0, call: 0.62, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.5, auraFast: 0.28, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },",
      replace: "  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0, arp: 0, ride: 0, call: 0.62, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.5, auraFast: 0.28, ownA: 0, ownB: 0, ownC: 0, ownD: 0 },",
    },
  },
  {
    decision: '0102',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE ACCENTS THROWN AWAY IN THE BAKE, which no assertion over the TABLE can see: every pattern
      still carries its velocities, the ladder is untouched, no layer is silent, nothing clips. What
      comes out of the synthesiser is the metronome the report is about — and only a measurement of
      the samples knows. docs/decisions/0027-measure-the-picture-not-the-model.md in the channel with
      nothing to look at.
    */
    broke: 'the velocity dropped in the bake, so every drum is struck at one weight again',
    guard: 'and an accent reaches the SAMPLES, not just the table',
    edit: {
      path: 'src/app/music.ts',
      find: '      : value === 1\n        ? voice.note\n        : { ...voice.note, gain: voice.note.gain * value };',
      replace: '      : voice.note;',
    },
  },
  {
    decision: '0102',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE PREWARM GIVEN ITS OWN GENERATOR, which is the one bug in this decision that would be
      genuinely hard to find: the game would sound RIGHT, every guard would pass, and the noise in
      every drum would differ depending on whether the player pressed before or after the title
      screen had finished synthesising. *The same game sounds different depending on how fast you
      pressed* — and `docs/decisions/0021-one-stream-per-concern.md` is the rule that makes it
      impossible when it is followed.
    */
    broke: 'the prewarm seeded from its own root, so the samples depend on when they were baked',
    guard: 'THE ONE THAT WOULD BE INVISIBLE: prewarmed and cold bakes are the same samples',
    edit: {
      path: 'src/app/sound.ts',
      find: "const cueStreams = makeRng('cues');",
      replace: "const cueStreams = makeRng('prewarm');",
    },
  },
  {
    decision: '0102',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE PULSE'S SUB REMOVED — *"guns and rockets for the player need a deeper bassy tone still as
      they're too tinny."* 0099 gave the pulse its note and this gave it its body; the cue is still in
      the key, still the right length, still under every ceiling, and it is the thing the report calls
      tinny. It is caught by the spectrum rather than by the table, which is the only place it shows.
    */
    broke: 'the pulse’s sub taken out, so the most frequent sound in the game has no bottom',
    guard: '0102 — and the PLAYER’S OWN WEAPONS have a bottom, which is what *tinny* means',
    edit: {
      path: 'src/content/cues.ts',
      // ⚠️ Re-anchored by 0104, which SHORTENED this layer from 0.11s to 0.064 rather than removing
      // it: the sub is what stops the pulse being tinny and its LENGTH is what made the gun a drone.
      // The break is still the whole layer going away, which is what 0102 put here.
      find: '      { wave: \'sine\', from: inKey(2), to: inKey(-7), seconds: 0.064, gain: 0.58, attack: 0.002, curve: 4, drive: 0.2 },',
      replace: '',
    },
  },
];
