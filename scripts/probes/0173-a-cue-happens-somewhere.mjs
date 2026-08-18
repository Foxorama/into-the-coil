// The breaks behind docs/decisions/0173-a-cue-happens-somewhere.md.
//
// ⚠️ THE FIRST ONE IS THE STATE THE GAME SHIPPED IN FOR ITS WHOLE LIFE, and it is the state the
// report is about: every cue a dry mono buffer into a fixed panner, with nothing at all between it
// and the master. The music has had a room since 0136.
//
// ⚠️ THE SECOND IS THE ONE THAT LOOKS LIKE A SIMPLIFICATION. One noise sequence copied to both
// channels is fewer lines, is a perfectly good reverb, and is MONO — the tail arrives from the
// middle, so the room adds depth and no width at all. Nothing else in the suite can tell the two
// apart: the length is the same, the decay is the same, and every cue rings for exactly as long.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0173',
    suite: 'tests/sound.test.ts',
    broke: 'every cue back in an anechoic chamber, which is where all fourteen of them were',
    guard: 'THE ONE IN UNITS THE PLAYER HEARS: the blast rings for at least a third of a second longer',
    edit: {
      path: 'src/content/cues.ts',
      find: '    air: 0.62,',
      replace: '    air: 0,',
    },
  },
  {
    decision: '0173',
    suite: 'tests/sound.test.ts',
    broke: 'one noise sequence copied to both sides, so the room is deep and not wide',
    guard: 'THE STEREO ONE: the two sides of the room are drawn from different noise',
    edit: {
      path: 'src/app/sound.ts',
      find: "    const stream = rng.stream(c === 0 ? 'left' : 'right');",
      replace: "    const stream = rng.stream('left');",
    },
  },
  {
    decision: '0173',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE GUN WET, WHICH IS THE OBVIOUS THING TO DO AND IS WRONG BY ARITHMETIC RATHER THAN BY
      TASTE. `FASTEST_FIRE` is 0.067 s and the room is 1.1 s, so a wet pulse is sixteen soundings
      overlapping — a wash where the game's most repeated sound used to be. It is 0104's own finding,
      which shortened this cue's LAYERS against the same number.
    */
    broke: 'the gun given a room, at sixteen soundings to one tail',
    guard: 'and the four cues on the weapon cadence are DRY, because a tail cannot outlast its own repeat',
    edit: {
      path: 'src/content/cues.ts',
      find: "  pulse: {\n    twin: 'shot-appears',",
      replace: "  pulse: {\n    twin: 'shot-appears',\n    air: 0.3,",
    },
  },
];
