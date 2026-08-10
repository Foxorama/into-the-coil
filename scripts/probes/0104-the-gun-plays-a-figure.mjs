// The breaks behind docs/decisions/0104-the-gun-plays-a-figure.md.
//
// ⚠️ FOUR MECHANISMS, AND THE FIRST TWO ARE RESTORATIONS OF WHAT SHIPPED. A build with probe 1 or 2
// applied is exactly the build the seventh play-test was taken on, which is what a probe is worth
// most: *"the gun fire doesn't fit in with the music at all"* and *"background too quiet"* are both
// reproducible from `main` by moving one number back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0104',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE SHIPPED BUG, RESTORED. 0.110s of cue against a 0.067s gap at the top of the ladder — the
      gun sounding 165% of the time, which is a continuous tone with bumps rather than a rhythm. Every
      guard in the repository was green on it, including the whole of `hold`: that field is 2 steps
      against a cue 6.6 steps long and was never the thing standing here.
    */
    broke: 'the pulse’s sub back to the length it shipped at, so the gun never stops sounding',
    guard: '0104 — THE REPORTED ONE: an auto-weapon’s cue finishes before its own next volley',
    edit: {
      path: 'src/content/cues.ts',
      find: "      { wave: 'sine', from: inKey(2), to: inKey(-7), seconds: 0.064, gain: 0.5, attack: 0.002, curve: 4 },",
      replace: "      { wave: 'sine', from: inKey(2), to: inKey(-7), seconds: 0.11, gain: 0.5, attack: 0.002, curve: 4 },",
    },
  },
  {
    decision: '0104',
    suite: 'tests/sound.test.ts',
    // The other auto weapon, and it was exactly one beat long — 0.400s against a 0.333s cadence at
    // the cap, so the counter-beat 0093 is named for overlapped itself where it matters most.
    broke: 'the missile’s launch back to a whole beat, so the counter-beat smears into itself',
    guard: '0104 — THE REPORTED ONE: an auto-weapon’s cue finishes before its own next volley',
    edit: {
      path: 'src/content/cues.ts',
      find: "      { wave: 'sine', from: inKey(14), to: inKey(2), seconds: 0.26, gain: 1, attack: 0.001, curve: 3 },",
      replace: "      { wave: 'sine', from: inKey(14), to: inKey(2), seconds: 0.4, gain: 1, attack: 0.001, curve: 3 },",
    },
  },
  {
    decision: '0104',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE ACCENT MADE A COUNTER, which is the build every reasonable person writes first and which
      drifts off the bar the moment a cadence changes or a volley is dropped. It is 0094's *in time is
      not in phase* one layer up, and the difference is invisible until something is skipped — so the
      guard drives it with skips in.
    */
    broke: 'the figure indexed by how many soundings have gone by rather than by where in the beat',
    guard: '0104 — strikes a cue by WHERE IN THE BEAT it lands, not by how many have gone before',
    edit: {
      path: 'src/app/sound.ts',
      find: '  const sixteenth = Math.floor(((step % STEPS_PER_BEAT) + STEPS_PER_BEAT) % STEPS_PER_BEAT / FIRE_GRID);\n  return sixteenth % count;',
      replace: '  return step % count;',
    },
  },
  {
    decision: '0104',
    suite: 'tests/sound.test.ts',
    // The weights baked from four DIFFERENT noise draws rather than one. It is four sounds instead of
    // one played four ways, and nothing but a sample-for-sample ratio can see it.
    broke: 'each weight given its own noise, so the gun changes timbre as it accents',
    guard: '0104 — and every WEIGHT of a cue is the same sound, drawing the same noise',
    edit: {
      path: 'src/app/sound.ts',
      find: '  return CUE_KINDS.map((kind) => velocitiesOf(CUES[kind]).map((v) => sampleCue(CUES[kind], rate, root.stream(kind), v)));',
      replace: '  return CUE_KINDS.map((kind) => velocitiesOf(CUES[kind]).map((v, at) => sampleCue(CUES[kind], rate, root.stream(`${kind}:${at}`), v)));',
    },
  },
  {
    decision: '0104',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE GRID DROPPED, which is the state every explosion in the game was in: a kill lands when a
      bullet ARRIVES, so the loudest repeated event in a level sat on an arbitrary sixtieth of a second
      while every cadence around it was on a sixteenth.
    */
    broke: 'the explosions taken back off the grid, which is how they shipped',
    guard: '0104 — a gridded cue waits for the next sixteenth, and waits at most one',
    edit: {
      path: 'src/app/sound.ts',
      find: "      if (CUES[kind].onGrid === true) {\n        waiting[index] = 1;\n        return;\n      }",
      replace: '',
    },
  },
  {
    decision: '0104',
    suite: 'tests/sound.test.ts',
    // ⚠️ THE OTHER DIRECTION, and it is the one that would be defended as a simplification: gridding
    // EVERYTHING. `hit` has a hold of 2 against a grid of 6, so three hits would collapse into one and
    // 0035's damage legibility would be broken by the fix for a report about the music.
    broke: 'every cue gridded, so a hit is heard once where three landed',
    guard: '0104 — and a cue that is NOT gridded still sounds on the step it was asked for',
    edit: {
      path: 'src/app/sound.ts',
      find: '      if (CUES[kind].onGrid === true) {',
      replace: '      if (true) {',
    },
  },
  {
    decision: '0104',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE DUCK MOVED ONTO THE ASK. A cue the hold or the cap refused is one nobody hears, so
      ducking for it is the track getting out of the way of nothing — heard as the music dipping at
      random on the busiest steps, which is the worst place to put a mystery.
    */
    broke: 'the duck fired when a cue was asked for rather than when it sounded',
    guard: '0104 — ducks the music for a cue that SOUNDED, and never for one the cap refused',
    edit: {
      path: 'src/app/sound.ts',
      find: '      if (CUES[kind].onGrid === true) {\n        waiting[index] = 1;\n        return;\n      }\n      emit(index);',
      replace:
        '      const asked = CUES[kind].duck;\n      if (asked !== undefined) out.duck(asked);\n' +
        '      if (CUES[kind].onGrid === true) {\n        waiting[index] = 1;\n        return;\n      }\n      emit(index);',
    },
  },
  {
    decision: '0104',
    suite: 'tests/sound.test.ts',
    // The gun given a duck. Auto-fire never stops, so the bed would be held down for the whole game —
    // *"background too quiet"* returning as a consequence of the fix for *"they don't mesh"*.
    broke: 'the pulse given a duck, so the bed is held down for the whole game',
    guard: '0104 — and the gun never ducks, whatever it is doing',
    edit: {
      path: 'src/content/cues.ts',
      find: '    figure: [1, 0.62, 0.82, 0.62],',
      replace: '    figure: [1, 0.62, 0.82, 0.62],\n    duck: 0.2,',
    },
  },
  {
    decision: '0104',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE MASTERING TAKEN OFF, which is the state the bus was in for four mix passes: a 12–14 dB
      crest factor and no compressor, limiter or soft clip anywhere, while every cue had `glue`. The
      music then sits 2–5 dB UNDER the effects playing over it, which is *"background too quiet"*.

      ⚠️ **It is caught by the LOUDNESS guard and by nothing else, which is the whole finding.** This
      probe was first pointed at the clipping assertion and reported STILL GREEN — obviously, in
      hindsight: every music guard in the file was a CEILING, so removing the thing that makes the
      music loud enough broke none of them. The lower bound had to be written before this probe had
      anything to redden.
    */
    broke: 'the music bus driven at nothing, so the mastering that answers "background too quiet" is gone',
    guard: '0104 — THE REPORTED ONE: the bed is not quieter than the gun playing over it',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const MUSIC_DRIVE = 0.22;',
      replace: 'export const MUSIC_DRIVE = 0;',
    },
  },
  {
    decision: '0104',
    suite: 'tests/music.test.ts',
    // ⚠️ AND THE OTHER WAY: the drive turned up until the ladder is flat. `saturate` cannot return past
    // 1 whatever it is handed, so the clipping guard alone would stay green over a squared-off wave.
    broke: 'the music bus driven until every rung is the same loudness',
    guard: 'and the four together stay inside full scale at the loudest level there is',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const MUSIC_GAIN = 0.46;',
      replace: 'export const MUSIC_GAIN = 2.6;',
    },
  },
  {
    decision: '0104',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE LEVEL OPENING THINNER THAN THE TITLE, which is the reported state: *"the title and boss
      screen music needs to be the minimum base level we build upon."* `groove` closed at `run` is the
      first third of every level with nothing under the kick but the chords' own sub.
    */
    broke: 'the level’s bass line closed at its opening rung, so a level starts thinner than the title',
    guard: 'THE LEVEL: there is something in the low end that MOVES, at every rung above the opening',
    edit: {
      path: 'src/content/music.ts',
      find: '  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0.8, arp: 0, hook: 0, drive: 0, toll: 0, lead: 0, stomp: 0, auraSlow: 0.5, auraFast: 0.28 },',
      replace: '  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0, arp: 0, hook: 0, drive: 0, toll: 0, lead: 0, stomp: 0, auraSlow: 0.5, auraFast: 0.28 },',
    },
  },
  {
    decision: '0104',
    suite: 'tests/music.test.ts',
    // ⚠️ THE NEW LAYER CLOSED EVERYWHERE. `hook` exists because moving `groove` and `arp` down left
    // `surge` opening nothing — the ladder ran out of rungs, and the answer to that is more music
    // rather than a shorter ladder. Without it the ladder stops being additive at the rung it arrives.
    broke: 'the hook closed at every rung, so the ladder runs out of things to open',
    guard: 'opens a layer at every step and never opens one twice',
    edit: {
      path: 'src/content/music.ts',
      find: '  surge: { drone: 0.33, bass: 0, beat: 0, sub: 0.9, engine: 0.93, perc: 0.8, chords: 0.88, groove: 0.9, arp: 0.68, hook: 0.66, drive: 0, toll: 0, lead: 0, stomp: 0, auraSlow: 0.75, auraFast: 0.55 },',
      replace: '  surge: { drone: 0.33, bass: 0, beat: 0, sub: 0.9, engine: 0.93, perc: 0.8, chords: 0.88, groove: 0.9, arp: 0.68, hook: 0, drive: 0, toll: 0, lead: 0, stomp: 0, auraSlow: 0.75, auraFast: 0.55 },',
    },
  },
];
