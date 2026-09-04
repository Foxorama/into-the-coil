// The breaks behind docs/decisions/0194-a-hull-has-a-livery.md.
//
// ⚠️ NOTHING HERE BREAKS HOW A SHIP LOOKS — docs/decisions/0192-a-guard-holds-an-invariant.md. Whether
// a canopy is the right shape is a taste and has no guard to redden. What these break is the three
// properties a decorative ink has to keep to be allowed to exist at all: it stays inside its hull, it
// is never mistakeable for something that means something, and it costs the accessibility palette
// nothing.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0194',
    suite: 'tests/palette.test.ts',
    /*
      ⚠️ A CANOPY THE COLOUR OF A PICKUP, WHICH IS THE WHOLE REASON DECORATION IS HELD TO A FLOOR AT
      ALL. docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md
      permits a mark that means nothing; what it cannot permit is a mark that means nothing sitting
      where the eye has learned something lives. The cost is a player checking a hull for an eighth of
      a second, which is `tests/palette.test.ts`'s own MUST_NOT_BE_CONFUSED argument.
    */
    broke: 'a decorative ink set to the colour of a pickup, so a mark that means nothing reads as one that does',
    guard: '0194 — AND NO DECORATION IS MISTAKEABLE FOR ANYTHING THAT MEANS SOMETHING',
    edit: {
      path: 'src/content/palette.ts',
      find: "    glass: '#12314a',",
      replace: "    glass: '#d9ffd0',",
    },
  },
  {
    decision: '0194',
    suite: 'tests/palette.test.ts',
    /*
      ⚠️ THE ACCESSIBILITY PALETTE SPENDING ITS SEPARATION ON A PANEL LINE. 0024 says accessibility is
      knobs over the loud default rather than restraint of it — and the knob a player turns here is
      *give me every scrap of contrast for the things that matter*. A trim colour on this palette is
      that promise being spent on scenery.
    */
    broke: 'decoration given a colour of its own on the high-contrast palette',
    guard: '0194 — THE HIGH-CONTRAST PALETTE SPENDS NOTHING ON DECORATION',
    edit: {
      path: 'src/content/palette.ts',
      find: "    glass: '#000000',",
      replace: "    glass: '#204060',",
    },
  },
  {
    decision: '0194',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE KEEL RUN OUT PAST THE NOSE. Every claim collision, the extents and
      docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md's screen share make about a
      silhouette is a claim about the hull's own bounds — a livery that grows them is a ship that is
      bigger than the thing it collides as. 0149 built the containment measure; this is the first
      decision to put marks on a hull that is not a boss, so it is the first time it has been asked
      about a wedge.
    */
    // ⚠️ Re-aimed by 0227: the keel is painted in the ship's arm now rather than tabled, and the
    // guard reads the trace rather than the table. The break is the same break.
    broke: 'a livery mark run out past the hull it is drawn on',
    guard: 'THE 0149 ONE: every solid mark on a body is inside its hull',
    edit: {
      path: 'src/render/bake.ts',
      find: '    [-0.34, -0.07],\n    [-0.1, -0.07],\n    [-0.1, 0.07],\n    [-0.34, 0.07],',
      replace: '    [-0.34, -0.07],\n    [1.1, -0.07],\n    [1.1, 0.07],\n    [-0.34, 0.07],',
    },
  },
  {
    decision: '0194',
    suite: 'tests/palette.test.ts',
    /*
      ⚠️ A DECORATIVE INK MOVED INTO THE MEANINGFUL CAMP, WHICH PROVES THE CAMPS ARE LOAD-BEARING
      RATHER THAN LABELLING. The three floors in that file are written over three lists; an ink in the
      wrong one is held to the wrong floor, and `trim` is a slate panel line that has no business
      clearing WCAG AA against the void because it is never drawn against it.
    */
    broke: 'a decorative ink counted as a meaningful one, so it is held to the floor it is exempt from',
    guard: 'clears WCAG AA against the background, in every palette',
    edit: {
      path: 'src/content/palette.ts',
      find: "export const DECOR_INKS: readonly DecorInk[] = ['glass', 'flame', 'trim'];",
      replace: "export const DECOR_INKS: readonly DecorInk[] = ['glass', 'flame'];",
    },
  },
];
