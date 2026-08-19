// The breaks behind the three decisions of the played-through report, 2026-08-13.
//
// ⚠️ ALL THREE ARE THE SHIPPED BEHAVIOUR PUT BACK, which is the shape worth planting: each one is
// what the player was looking at, or listening to, when they wrote the sentence the decision quotes.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0143',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE WIDEST BODY'S SPACING CHARGED TO EVERY WAVE, which is exactly what 0121 left standing and
      what this decision is about. It is not a typo anybody would make — it is the shipped code, and
      it looks tidier than the version that replaces it: one constant instead of a function.
    */
    broke: 'every wave spaced for the widest enemy in the game, which is what 0121 left standing',
    guard: '0143 — AND THE NARROW BODIES REACH FOUR, which is what a repeat report bought',
    edit: {
      path: 'src/content/formations.ts',
      find: '  return radius * 2 + CLEAR_AIR;',
      replace: '  return 9;',
    },
  },
  {
    decision: '0144',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE STREAK SPENT IN THE BODY RATHER THAN IN THE TOP, and it is the obvious way to answer
      *"lasts a bit longer"*: make the loudest, longest layer longer still. It restores precisely the
      rumble docs/decisions/0109-a-death-is-a-drum.md measured and removed — two a second overlapping
      continuously — while satisfying every other assertion about the cue, including the one that
      holds it under a beat.
    */
    broke: 'the death’s extra length spent on the body, which is the rumble 0109 removed',
    guard: '0144 — A CHAIN OF DEATHS STREAKS IN THE TOP, and the band 0109 shortened stays short',
    edit: {
      path: 'src/content/cues.ts',
      find: "{ wave: 'noise', from: 0, to: 0, seconds: 0.17, gain: 0.98, attack: 0.002, curve: 4.5, lowFrom: 2400, lowTo: 430, highFrom: 150, highTo: 62, q: 0.8, drive: 0.34 },",
      replace: "{ wave: 'noise', from: 0, to: 0, seconds: 0.38, gain: 0.98, attack: 0.002, curve: 4.5, lowFrom: 2400, lowTo: 430, highFrom: 150, highTo: 62, q: 0.8, drive: 0.34 },",
    },
  },
  {
    decision: '0145',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE GUN PUT BACK OVER THE THINGS IT KILLS. At 0.3 the pulse sits above `threat`, `hit`,
      `pickup` and `chime` — and it sounds 96% of the time at the weapon cap, so it masks all four
      continuously. Every existing guard was green over it: nothing in the table measured a cue
      against another cue, only against the ceiling and the bed.
    */
    broke: 'the auto-weapons back over the events they cause, which is what a play-through reported',
    guard: '0145 — AN AUTO-WEAPON SOUNDS UNDER THE EVENTS IT CAUSES, because it is the one that never stops',
    edit: {
      path: 'src/content/cues.ts',
      find: "    twin: 'shot-appears',\n    hold: 2,\n    gain: 0.24,",
      replace: "    twin: 'shot-appears',\n    hold: 2,\n    gain: 0.3,",
    },
  },
];
