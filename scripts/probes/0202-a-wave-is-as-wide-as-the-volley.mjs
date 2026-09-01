// The breaks behind docs/decisions/0202-a-wave-is-as-wide-as-the-volley.md.
//
// ⚠️ THE GUARD THIS PROVES WENT GREEN ON ITS FIRST RUN OVER 492 WAVES, WHICH IS THE SHAPE 0005
// REFUSES TO TRUST. It is green because the change it guards had just landed; before that change the
// same assertion listed 324 waves. Both probes below put a version of the old behaviour back, in the
// two ways a future edit would realistically reintroduce it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0202',
    suite: 'tests/level.test.ts',
    // The tidy-up that undoes this. `centred(index, count) * gap` is shorter, reads correctly, and is
    // what the row said for the whole life of the project until now — a reviewer would wave it
    // through as a simplification.
    broke: 'a line spread across its whole count again, instead of folding at the volley’s width',
    guard: 'EVERY WAVE IN THE GAME fits inside one volley',
    edit: {
      path: 'src/content/formations.ts',
      find:
        '    alongOffset: (index, _count, gap) => Math.floor(index / abreastCap(gap)) * ALONG_GAP,\n' +
        '    acrossOffset: (index, count, gap) => {\n' +
        '      const cap = abreastCap(gap);\n' +
        '      return centred(index % cap, rankSize(index, count, cap)) * gap;\n' +
        '    },',
      replace:
        '    alongOffset: () => 0,\n' +
        '    acrossOffset: (index, count, gap) => centred(index, count) * gap,',
    },
  },
  {
    decision: '0202',
    suite: 'tests/level.test.ts',
    // ⚠️ THE OFF-BY-ONE, WHICH IS THE ONE A PROBE IS ACTUALLY FOR. The fold still happens and every
    // wave still looks folded on screen — one member per rank too many, so the rank overruns the fan
    // by a single gap. Nothing about the shape of the code says it is wrong.
    broke: 'the abreast cap off by one, so every rank is one body wider than the volley',
    guard: 'EVERY WAVE IN THE GAME fits inside one volley',
    edit: {
      path: 'src/content/formations.ts',
      find: '  const fits = 1 + Math.floor(VOLLEY_SPAN / gap);',
      replace: '  const fits = 2 + Math.floor(VOLLEY_SPAN / gap);',
    },
  },
];
