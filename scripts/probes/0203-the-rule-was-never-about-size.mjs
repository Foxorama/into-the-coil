// The breaks behind docs/decisions/0203-the-rule-was-never-about-size.md.
//
// ⚠️ EVERY ONE OF THESE GUARDS WENT GREEN ON ITS FIRST RUN, which is the shape 0005 refuses to trust.
// One of them had already earned its keep before this file existed: the band's lower bound was drafted
// at half a bullet and reddened `skyFar`, whose 1.2-unit mark is shipped and correct. That is a guard
// seen failing on healthy content, which is the opposite lesson and is recorded in the decision.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0203',
    suite: 'tests/sky.test.ts',
    // ⚠️ THE ONE THE WHOLE FEATURE IS. Moving the organ's section without moving the Pillars is a
    // one-line edit to a music decision that would silently break an art one, and nothing about
    // either file mentions the other. This is the pairing 0029 is about.
    broke: 'the organ’s section moved and the Pillars stayed, so they no longer arrive together',
    guard: 'the Pillars arrive exactly where the organ opens',
    edit: {
      path: 'src/content/levels.ts',
      find: "      { at: 1299, section: 'push' },",
      replace: "      { at: 1420, section: 'push' },",
    },
  },
  {
    decision: '0203',
    suite: 'tests/sky.test.ts',
    // The landmark shrunk back into the band. 75 → 12 is still far larger than any star and looks
    // like a reasonable "make it less dominant" tweak, and it lands it inside the size range of a
    // warden, which is exactly what 0069 was written to prevent.
    broke: 'a landmark shrunk to inside the band, where it can be read as a body',
    guard: 'a landmark is far too big to be a body',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  landmark: ACROSS_SPAN * 0.75,',
      replace: '  landmark: ACROSS_SPAN * 0.12,',
    },
  },
  {
    decision: '0203',
    suite: 'tests/sky.test.ts',
    // Parallax inversion: a landmark drawn behind everything but moving faster than the nebula it
    // sits behind. Nothing about the number looks wrong — 0.2 is still far slower than the world.
    broke: 'a landmark moving faster than the slowest field it is drawn behind',
    guard: 'a landmark is the slowest thing on screen',
    edit: {
      path: 'src/content/levels.ts',
      // Re-anchored when the entry gained `beat` — 0220. The invariant is unchanged; the line it
      // lives on grew a field.
      find: '    landmarks: [{ at: 1299, lane: 72, depth: 0.08, beat: 0 }],',
      replace: '    landmarks: [{ at: 1299, lane: 72, depth: 0.2, beat: 0 }],',
    },
  },
];
