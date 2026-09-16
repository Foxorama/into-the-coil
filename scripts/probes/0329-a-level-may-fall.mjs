// The breaks behind docs/decisions/0329-a-level-may-fall.md.
//
// ⚠️ 0226 HELD EVERY RUNG EQUAL TO ITS `run` AND ONLY THE UPPER HALF WAS EVER REPORTED. *"The music
// track volume increases so much that it drowns out the bullets and game SFX… it's like someone turns
// up the volume knob."* A rung BELOW its opening drowns out nothing; the floor came free with a solve
// that equalised rather than capped, and nothing ever argued for it.
//
// ⚠️ THE TWO BREAKS ARE THE TWO HALVES OF A STATED QUANTITY, AND THE SECOND IS THE ONE THAT MATTERS.
// A field a hand may write needs a bound on what it may say — that is the first — and it needs
// something to actually read it, which is the failure 0162's own header names: *a mechanism no data
// reaches*. The Black Heart states a contour (0330), so the second break has a subject; until it did,
// `contourOf` could have returned a constant zero with every guard in the repository green.
/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0329',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ A PLACE AUTHORING ITSELF LOUDER THAN ITS OWN OPENING, which is exactly the thing six reports
      were about arriving through the door this decision opens. The Approach is the level those reports
      were made on, and `push` is the boundary they named.
    */
    broke: 'a place authors its push ABOVE its run, which is the climb six reports were about',
    guard: '0329 — A CONTOUR ONLY EVER FALLS',
    edit: {
      path: 'src/content/themes.ts',
      find: "  approach: {\n    title: 'The Approach',",
      replace: "  approach: {\n    contour: { push: 2 },\n    title: 'The Approach',",
    },
  },
  {
    decision: '0329',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE CONTOUR STATED AND NOTHING READING IT. `contourOf` is the one seam the solver and the
      guard both go through; a version that answered zero would leave the field in the tree, the table
      solved against it, and the guard asking the old question — green, while the place plays a shape
      nothing is holding it to. This is 0226's own second probe one table over.
    */
    broke: 'contourOf ignores the row, so a place states a shape and nothing holds it to one',
    guard: 'every rung of a place holds its run loudness',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return THEMES[theme].contour?.[rung] ?? 0;',
      replace: '  return 0;',
    },
  },
];
