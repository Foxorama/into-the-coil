// The kit draws a creature — docs/decisions/0276-the-kit-draws-a-creature.md
//
// Every guard 0276 adds or changes, broken on purpose. `node scripts/prove-guard.mjs 0276`.
//
// ⚠️ TWO OF THE FIVE BREAK THE INSTRUMENT RATHER THAN THE ART, AND THAT IS THE POINT OF THEM.
// `strokeOutside` is new arithmetic that the containment claim now leans on, so a version of it that
// silently under-reports would take the guard with it and nothing would go red —
// docs/decisions/0027-measure-the-picture-not-the-model.md, on a guard that fires on the wrong
// quantity. These two make the harness lie and watch the suite catch it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0276',
    suite: 'tests/accents.test.ts',
    // A second outline round the hull: the thing `strokes === 1` used to hold, still held.
    broke: 'the hull stroked a second time, which is the second outline the old count refused',
    guard: 'is more fills in the SAME bitmap, and not a second sprite over the first',
    edit: {
      path: 'src/render/bake.ts',
      find: 'function seal(ctx: Pen): void {\n  ctx.fill(\'evenodd\');\n  ctx.stroke();\n}',
      replace: 'function seal(ctx: Pen): void {\n  ctx.fill(\'evenodd\');\n  ctx.stroke();\n  ctx.stroke();\n}',
    },
  },
  {
    decision: '0276',
    suite: 'tests/accents.test.ts',
    // A solid stroke walked off the hull — the claim 0264 said could not be made at all.
    broke: 'the serpent’s mouth line dragged off the front of its skull, at full alpha',
    guard: 'is more fills in the SAME bitmap, and not a second sprite over the first',
    edit: {
      path: 'src/render/bake.ts',
      find: '  disc(ctx, f, shade(skin.plate, -0.6), -1.02, -0.25, 0.016);',
      replace:
        '  seam(ctx, f, shade(skin.plate, -0.55), 0.022, [\n' +
        '    [-1.3, -0.2],\n' +
        '    [-1.5, -0.2],\n' +
        '  ], 1);\n' +
        '  disc(ctx, f, shade(skin.plate, -0.6), -1.02, -0.25, 0.016);',
    },
  },
  {
    decision: '0276',
    suite: 'tests/paths.test.ts',
    // The instrument stops counting the ink's width, so a stroke is measured as a hairline.
    broke: 'strokeOutside ignoring the lineWidth, so a fat stroke on a thin hull reads as contained',
    guard: 'reports the overhang when the line is too near an edge for its width',
    edit: {
      path: 'tests/paths.ts',
      find: '  const half = stroke.width / 2;',
      replace: '  const half = 0;',
    },
  },
  {
    decision: '0276',
    suite: 'tests/paths.test.ts',
    // The instrument checks the ends of a segment and not the middle: the waist walks free.
    broke: 'strokeOutside sampling only the vertices, so a segment may cross a waist and out into space',
    guard: 'SAMPLES ALONG a segment and not only its ends',
    edit: {
      path: 'tests/paths.ts',
      find: '      const steps = Math.max(1, Math.ceil(span / step));',
      replace: '      const steps = 1;',
    },
  },
  {
    decision: '0276',
    suite: 'tests/paths.test.ts',
    // The instrument wraps an open polyline, so a stroked spine measures a leg that was never inked.
    broke: 'the pen closing every sub-path, so an open spine is measured with a return leg across the void',
    guard: 'does NOT wrap an OPEN polyline back to its start, and DOES wrap a closed one',
    edit: {
      path: 'tests/paths.ts',
      find: '    const segments = stroke.closed[s] === true ? subpath.length : subpath.length - 1;',
      replace: '    const segments = subpath.length;',
    },
  },
];
