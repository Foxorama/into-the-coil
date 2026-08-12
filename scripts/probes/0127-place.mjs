// The breaks behind docs/decisions/0127-a-cue-has-a-place.md.
//
// ⚠️ EVERY ONE OF THESE IS SILENT WHEN IT HAPPENS, which is the whole reason the guards exist. A cue
// placed wrongly still sounds; a cue placed nowhere still sounds; a cue whose position is read a
// sixteenth late still sounds. Nothing crashes, nothing looks different, and the only witness is a
// listener who cannot say why the fight feels flat — which is the same class of defect
// docs/decisions/0116 was written for one channel over.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0127',
    suite: 'tests/sound.browser.test.ts',
    /*
      ⚠️ THE WHOLE FEATURE, REMOVED. Connecting straight to the master is what every cue did for the
      life of the project and it reads as obviously correct — the panner is already wired to the
      master, so the sound still arrives at the right level. What is lost is the only thing that was
      added: the place.

      ⚠️ AND IT WENT **STILL GREEN** AGAINST `tests/sound.test.ts`, WHICH IS WHY THE BROWSER GUARD
      EXISTS. Every node-side guard for this decision drives `makeSpeaker` through a recorder double
      and measures the pan it computed; the pan was never the risky half. Whether the node is wired
      through a panner is not arithmetic at all and cannot be seen outside a browser —
      docs/decisions/0019's own subject, found by the harness rather than by a reading of the code.
    */
    broke: 'a cue connected straight to the master again, so the field is gone and the level is not',
    guard: '0127 — EVERY CUE GOES INTO A PLACE',
    edit: {
      path: 'src/app/sound.ts',
      find: '      source.connect(place);',
      replace: '      source.connect(master);',
    },
  },
  {
    decision: '0127',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE LANE READ AS ALREADY NORMALISED. `across` runs 0 to ACROSS_SPAN, so treating it as -1..1
      puts every event at the far edge — the whole game hard right. It is one plausible line, it
      never throws, and it would be heard as "the stereo is broken" rather than as an arithmetic bug.
    */
    broke: 'the lane read as though it were already -1 to 1, so everything sits at one edge',
    guard: 'THE LANE IS THE FIELD: the edges reach the limit and the middle is the middle',
    edit: {
      path: 'src/app/sound.ts',
      find: '  const off = (across - half) / half;',
      replace: '  const off = across;',
    },
  },
  {
    decision: '0127',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE CLAMP DROPPED. docs/decisions/0048 lets a body arrive from the across edges and be culled
      outside the lane, so an unclamped pan runs past the limit and — once it passes the last bucket —
      would index outside the pool entirely. `sound` reads `places[panBucket(pan)]`, so the failure
      mode is a silent cue rather than a loud one.
    */
    broke: 'a body outside the lane no longer clamped, so it pans past the limit and off the pool',
    guard: 'THE LANE IS THE FIELD: the edges reach the limit and the middle is the middle',
    edit: {
      path: 'src/app/sound.ts',
      find: '  const clamped = off < -1 ? -1 : off > 1 ? 1 : off;\n  return clamped * CUE_PAN_LIMIT;',
      replace: '  return off * CUE_PAN_LIMIT;',
    },
  },
  {
    decision: '0127',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ AN EVEN POOL, WHICH HAS NO CENTRE. Everything with no place — the chime, a menu, and `hit`,
      which is inferred from a count and cannot have one — would sit permanently a little to one side.
      It is the exact defect docs/decisions/0104's CURVE_POINTS comment describes for a transfer curve,
      in a different node.
    */
    broke: 'an even number of places, so nothing can be exactly centred',
    guard: 'the places are a fixed pool with an exact centre, and nothing lands outside it',
    edit: {
      path: 'src/app/sound.ts',
      find: 'export const PAN_BUCKETS = 9;',
      replace: 'export const PAN_BUCKETS = 8;',
    },
  },
  {
    decision: '0127',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE WAITING CUE'S POSITION READ AT FLUSH TIME RATHER THAN AT THE ASK. This is the subtle one
      and it is a consequence of docs/decisions/0104: a gridded cue sounds up to a sixteenth later,
      by which time the body that caused it has been released back to its pool. Zeroing the recorded
      pan is what "read it later" degenerates to — every explosion at the far left, from a lane
      coordinate of nothing.
    */
    broke: 'a gridded cue lost the place it was asked from, so it sounds wherever the pool ended up',
    guard: 'A GRIDDED CUE KEEPS THE PLACE IT WAS ASKED FROM, not the one a sixteenth later',
    edit: {
      path: 'src/app/sound.ts',
      find: '        if (waiting[index] === 0) waitingPan[index] = pan;',
      replace: '        if (waiting[index] === 0) waitingPan[index] = 0;',
    },
  },
  {
    decision: '0127',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ A CALL SITE THAT FORGETS, which is the failure the source scan exists for. It is the most
      likely of all of these: seventeen call sites, and the next cue anybody adds is written by
      copying one of them. A forgotten place is silent — the cue sounds, dead centre, and no test
      that measures loudness, timing or spectrum can see it.
    */
    broke: 'a call site fired a cue without saying where it happened',
    guard: 'EVERY CUE THE GAME FIRES SAYS WHERE IT HAPPENED, and the one that cannot is named',
    edit: {
      path: 'src/app/frame.ts',
      find: "    if (i === 0) w.onCue('pulse', w.ship.across);",
      replace: "    if (i === 0) w.onCue('pulse');",
    },
  },
];
