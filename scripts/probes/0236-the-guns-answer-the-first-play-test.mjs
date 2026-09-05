// The breaks behind docs/decisions/0236-the-guns-answer-the-first-play-test.md.
//
// ⚠️ Seven answers to one play-test, and each break is the answer quietly undone: a reach that
// stops climbing, a scatter with no flight, a strike back to a tick, a bubble left off one face, the
// bright points dropped from the bolt, the thunder taken from under the coil — and the dry link
// that was found on the way, moving the chain's origin again.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0236',
    suite: 'tests/guns-played.test.ts',
    broke: 'the arc’s reach authored flat across the ladder',
    guard: 'THE REACH: the arc reaches further',
    // ⚠️ Re-anchored by 0239: the ladder's top was cut back a tenth.
    edit: {
      path: 'src/content/weapons.ts',
      find: '    reach: [55, 64, 75, 88, 103],',
      replace: '    reach: [55, 55, 55, 55, 55],',
    },
  },
  {
    decision: '0236',
    suite: 'tests/guns-played.test.ts',
    // No flight: the throw is eased away inside a second, and the eye keeps the across half — a fan.
    broke: 'the throw given no flight, so the along half is eased away and the scatter is a fan again',
    guard: 'THE SCATTER: a death throws in every direction',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const SCATTER_FLIGHT = 45;',
      replace: 'const SCATTER_FLIGHT = 0;',
    },
  },
  {
    decision: '0236',
    suite: 'tests/guns-played.test.ts',
    broke: 'the strike’s body cut back to a tick',
    guard: 'THE STRIKE: a bolt landing is an explosion',
    edit: {
      path: 'src/content/cues.ts',
      find: "      { wave: 'noise', from: 0, to: 0, seconds: 0.19, gain: 0.7, attack: 0.003, curve: 4.5, lowFrom: 1800, lowTo: 160, highFrom: 120, highTo: 50, q: 0.8, drive: 0.25 },",
      replace: "      { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.7, attack: 0.003, curve: 4.5, lowFrom: 1800, lowTo: 160, highFrom: 120, highTo: 50, q: 0.8, drive: 0.25 },",
    },
  },
  {
    decision: '0236',
    suite: 'tests/guns-played.test.ts',
    // One face left without its bubble — the shield, whose arm is its own.
    broke: 'the bubble left off the shield',
    guard: 'THE BUBBLE: every face',
    edit: {
      path: 'src/render/bake.ts',
      find: '      seal(ctx);\n      bubble(ctx, f, palette);\n      // The right half in shadow',
      replace: '      seal(ctx);\n      // The right half in shadow',
    },
  },
  {
    decision: '0236',
    suite: 'tests/weapons.test.ts',
    // The bright points dropped: the loop that draws them runs zero times.
    broke: 'the bolt’s bright points dropped, so a link is a wire again',
    guard: 'the picture is counted per link',
    edit: {
      path: 'src/render/scene.ts',
      find: '    for (let v = BOLT_DOT_EVERY; v < last; v += BOLT_DOT_EVERY) {',
      replace: '    for (let v = last; v < last; v += BOLT_DOT_EVERY) {',
    },
  },
  {
    decision: '0236',
    suite: 'tests/sound.test.ts',
    // The thunder taken back out: the sub at its old gain and no rumble under the coil.
    broke: 'the thunder taken from under the coil, so the arc is sparky and not lightningy',
    guard: 'the PLAYER’S OWN WEAPONS have a bottom',
    edit: {
      path: 'src/content/cues.ts',
      find: "      { wave: 'noise', from: 0, to: 0, seconds: 0.11, gain: 0.6, attack: 0.004, curve: 4, lowFrom: 260, lowTo: 90, highFrom: 40, q: 0.8, drive: 0.3 },\n      { wave: 'sine', from: inKey(2), to: inKey(-7), seconds: 0.09, gain: 1, attack: 0.002, curve: 3.5, drive: 0.3 },",
      replace: "      { wave: 'sine', from: inKey(2), to: inKey(-7), seconds: 0.06, gain: 0.3, attack: 0.002, curve: 4, drive: 0.2 },",
    },
  },
  {
    decision: '0236',
    suite: 'tests/weapons.test.ts',
    // The dry link advancing the chain's origin again — the defect the longer reach exposed.
    broke: 'a dry link moving the chain’s origin, so the next link finds a body past reach',
    guard: 'beyond its reach it fires dry',
    edit: {
      path: 'src/app/frame.ts',
      find: '      spawnLink(w, row, fromAlong, fromAcross, toAlong, toAcross);\n      break;\n    } else {',
      replace: '      spawnLink(w, row, fromAlong, fromAcross, toAlong, toAcross);\n    } else {',
    },
  },
];
