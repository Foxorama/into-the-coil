// The breaks behind docs/decisions/0211-every-place-has-its-own-structure.md.
//
// ⚠️ THE TABLE REPLACED THREE DECISIONS' WORTH OF SEAM RULES LIVING IN THREE COMMENTS, so what these
// prove is that the rules survived being made data. Before 0211 each was a paragraph above its own
// loop and the fourth author had to work out which applied; now `crosses` says it and one guard holds
// it for all seven places at once.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0211',
    suite: 'tests/sky.test.ts',
    // ⚠️ RE-POINTED BY 0345, WHICH DELETED THE THING THIS BROKE. It removed the line in `crossing` that
    // forced a random walk home — and nothing calls `crossing` any more, so the same edit would have
    // come back STILL GREEN for ever. A crossing mark is a sum of sines now, and what makes one
    // periodic is that every period divides the tile: half a turn across it does not, so Ember
    // Nebula's lanes leave at one height and arrive at another.
    broke: 'a crossing mark no longer ending where it started, so every spanning structure steps at the join',
    guard: 'every mark takes the seam rule it declares',
    edit: {
      path: 'src/render/bake.ts',
      find: '        at + bend[0]! * Math.sin(Math.PI * 2 * t + turn[0]!) + bend[1]! * Math.sin(Math.PI * 6 * t + turn[1]!);',
      replace: '        at + bend[0]! * Math.sin(Math.PI * 1 * t + turn[0]!) + bend[1]! * Math.sin(Math.PI * 6 * t + turn[1]!);',
    },
  },
  {
    decision: '0211',
    suite: 'tests/sky.test.ts',
    // ⚠️ A local mark widened until it spans the tile. The wrap it is drawn with cannot cover it, so
    // it needs the periodic rule and is not getting it — and nothing about a sway constant says so.
    broke: 'a local mark wandering as wide as its own tile, so its wrap can no longer cover it',
    guard: 'every mark takes the seam rule it declares',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ RE-ANCHORED BY 0221: the mire's fronds hang from a canopy now and were retuned with it.
      // The break is the same one — a local mark wandering wider than the wrap that draws it.
      find: '        sway += rng.range(-0.04, 0.04) * size;',
      replace: '        sway += rng.range(-0.5, 0.5) * size;',
    },
  },
  {
    decision: '0211',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE ONE THE WHOLE ARC IS ABOUT — 0196's failure arriving through a table instead of a slider.
      Handing one place's structure to another is a one-word edit that makes both skies busier and
      neither of them different, which is precisely *"numerically different, visually the same."*
    */
    broke: 'two places given the same structure, which is 0196’s failure with a hub in front of it',
    guard: 'every place has a structure of its own',
    edit: {
      path: 'src/render/bake.ts',
      /*
        ⚠️ RE-ANCHORED, AND THE DIRECTION OF THE THEFT HAD TO REVERSE — 0220. The old break pointed
        Ember Nebula's lanes at `'labyrinth/walls'`, because both places drew with `crossing` and
        swapping the stream was enough to make them one drawing. **The Labyrinth is a sum of sines
        now** and calls `crossing` at all — so that edit would have left the two places drawing
        different things and the guard GREEN, which is the exact shape of a probe that has stopped
        proving anything. It is the failure `tests/prove-guard.test.ts` catches by refusing a stranded
        anchor, and re-pointing the anchor without re-reading the break is how a probe survives that
        check while quietly meaning nothing.

        So the theft runs the other way: The Labyrinth is handed Ember Nebula's three lanes, by that
        place's own stream and numbers, and the two rows then emit byte-identical marks.
      */
      /*
        ⚠️ AND RE-WRITTEN BY 0345, WHICH FOUND IT RED FOR THE WRONG REASON. That decision deleted
        `crossing`, and this replacement CALLED it — so the break became a `ReferenceError`, the named
        test failed by crashing, and the harness reported `red` over a full proof with exit 0. It was
        read in the log, not caught: a crash inside the guard's own test has the guard's title on it.
        The theft is the same one — The Labyrinth handed Ember Nebula's marks, byte for byte — taken
        from that place's own row, which cannot go stale the way a copy of its arguments did.
      */
      find: "    const rng = makeRng('sky').stream('labyrinth/paths');\n    const out: StructureMark[] = [];",
      replace:
        "    const rng = makeRng('sky').stream('labyrinth/paths');\n" +
        '    const out: StructureMark[] = [...STRUCTURE_OF.nebula(size)];',
    },
  },
];
