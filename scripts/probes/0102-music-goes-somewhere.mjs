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
    guard: 'and it climbs FOUR times inside a level, where it used to climb once',
    edit: {
      path: 'src/app/music.ts',
      find: '  if (toBoss <= SURGE_UNITS) return \'surge\';\n  if (toBoss <= PUSH_UNITS) return \'push\';',
      replace: '',
    },
  },
  {
    decision: '0102',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE RUNGS KEPT AND THE PACE TAKEN OUT, which is the edit that looks like a tidy-up: `arp` is
      the busiest layer in the level's piece and closing it at `surge` leaves four rungs that each add
      something. The build survives as a structure and stops being a build — *"no pace, no increased
      tempo"* — and only a count of what is actually being struck can tell.
    */
    broke: 'the sixteenth layer closed, so the rungs add music without adding pace',
    guard: 'and each rung strikes MORE NOTES A BAR than the one below, which is what *pace* is',
    edit: {
      path: 'src/content/music.ts',
      /*
        ⚠️ **THE BREAK MOVED DOWN A RUNG WITH THE LAYER, WHICH IS NOT THE SAME AS RE-ANCHORING IT.**
        `docs/decisions/0104-the-gun-plays-a-figure.md` opened `arp` at `push` — the ask was that a
        level never begins thinner than the title — so closing it at `surge` no longer takes the
        sixteenths out of the piece, it only stops them getting louder. The rung where the layer now
        ARRIVES is the one that has to be broken, or this probe would go on passing while standing
        over a version of the ladder that no longer exists.
      */
      find: "  push: { drone: 0.34, bass: 0, beat: 0, sub: 1.06, engine: 0.96, perc: 0.76, chords: 0.87, groove: 0.94, arp: 0.64, ride: 0.58, call: 0.68, hook: 0.64, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0.7, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.62, auraFast: 0.4 },",
      replace: "  push: { drone: 0.34, bass: 0, beat: 0, sub: 1.06, engine: 0.96, perc: 0.76, chords: 0.87, groove: 0.94, arp: 0, ride: 0, call: 0.68, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.62, auraFast: 0.4 },",
    },
  },
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
      find: "  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0.8, arp: 0, ride: 0, call: 0.62, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.5, auraFast: 0.28 },",
      replace: "  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0, arp: 0, ride: 0, call: 0.62, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.5, auraFast: 0.28 },",
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
      find: '      { wave: \'sine\', from: inKey(2), to: inKey(-7), seconds: 0.064, gain: 0.5, attack: 0.002, curve: 4 },',
      replace: '',
    },
  },
];
