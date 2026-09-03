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
    // The line that makes every crossing mark periodic, for every place at once. It reads like a
    // special case somebody left in — which is exactly what it looked like in 0207, where removing it
    // was the probe. One table means one edit now reaches Ember Nebula AND The Labyrinth.
    broke: 'a crossing mark no longer ending where it started, so every spanning structure steps at the join',
    guard: 'every mark takes the seam rule it declares',
    edit: {
      path: 'src/render/bake.ts',
      find: '      points.push([(s / steps) * size, s === steps ? start : y]);',
      replace: '      points.push([(s / steps) * size, y]);',
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
      find: "    const rng = makeRng('sky').stream('labyrinth/paths');\n    const out: StructureMark[] = [];",
      replace:
        "    const rng = makeRng('sky').stream('labyrinth/paths');\n" +
        "    const out: StructureMark[] = crossing(size, { stream: 'nebula/lanes', count: 3, wander: 0.05, from: 0.05, to: 0.11 });",
    },
  },
];
