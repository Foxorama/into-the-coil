// The breaks behind docs/decisions/0193-the-sheet-is-the-instrument.md.
//
// ⚠️ NOTHING HERE BREAKS A PICTURE, AND THAT IS docs/decisions/0192-a-guard-holds-an-invariant.md.
// How a sprite LOOKS is a taste and has no guard to redden. What these break is the instrument's
// honesty: that it shows every kind, that it pairs each with the right twin, and that *actual size*
// is the size the game bakes at. An instrument that can quietly show less than the whole atlas is
// docs/decisions/0126-the-dashboard-is-the-instrument.md's own opening failure — a tool that reports
// a number it is not producing.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0193',
    suite: 'tests/sheet.test.ts',
    /*
      ⚠️ THE OMISSION, AND IT IS THE ONE NOTHING ON THE PAGE COULD SHOW YOU. Skipping the sky kinds
      is the shape a real edit takes — they are the four nobody thinks of as sprites — and the page
      would go on reading as a complete answer to *what does the art look like*.
    */
    broke: 'the sheet skipping a family of kinds, so it reads as complete while showing less',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: every sprite kind appears exactly once',
    edit: {
      path: 'rig/sheet.ts',
      find: "    if (kind.endsWith(HIT)) continue;\n    out.push({ kind, twin: twinOf(kind) });",
      replace: "    if (kind.endsWith(HIT) || kind.startsWith('sky')) continue;\n    out.push({ kind, twin: twinOf(kind) });",
    },
  },
  {
    decision: '0193',
    suite: 'tests/sheet.test.ts',
    /*
      ⚠️ THE PAIRING OFF BY ONE, WHICH IS THE DEFECT THE PAGE EXISTS TO MAKE VISIBLE, HAPPENING TO
      THE PAGE ITSELF. `boss2` beside `bossHit` is two pictures that differ, so the readout would say
      a healthy number and mean nothing — the exact failure
      docs/decisions/0027-measure-the-picture-not-the-model.md names, one channel over.
    */
    broke: 'a kind paired with somebody else’s hurt sprite, so the difference readout compares the wrong two',
    guard: 'and a hurt twin is DERIVED from the union, never a table beside it',
    edit: {
      path: 'rig/sheet.ts',
      find: "  const twin = `${kind}${HIT}`;",
      replace: "  const twin = kind === 'boss2' ? 'bossHit' : `${kind}${HIT}`;",
    },
  },
  {
    decision: '0193',
    suite: 'tests/sheet.test.ts',
    /*
      ⚠️ A RESOLUTION TYPED INTO THE RIG, WHICH IS THE ONE THING THAT MAKES *ACTUAL SIZE* A LIE. Ten
      is very nearly right at 1920×1080 and wrong everywhere else, so the page would look correct on
      the one screen anybody checked it on — and every legibility verdict taken from it would be about
      a picture the game never draws.
    */
    broke: 'the sheet deriving its own pixels-per-unit instead of asking the camera',
    guard: 'ACTUAL SIZE IS THE GAME’S OWN SCALE, never a number typed into the rig',
    edit: {
      path: 'rig/sheet.ts',
      find: '  return viewOf(widthPx, heightPx).scale * dpr;',
      replace: '  return 10 * dpr;',
    },
  },
  {
    decision: '0193',
    suite: 'tests/sheet.test.ts',
    /*
      ⚠️ THE WORST CASE MADE UNREACHABLE, AND IT IS THE FINDING THIS GUARD IS MADE OF. Dropping the
      16:10 row leaves an instrument that only answers the easy question: 1280×800 bakes at 7.19
      px/unit against 1920×1080's 10.79, because
      docs/decisions/0023-the-long-axis-is-the-scroll-axis.md's clamp buys the extra span out of
      scale. A sheet without it shows every sprite a third larger than the screen that binds them.
    */
    broke: 'the narrow viewport dropped, so the smallest bake in the game cannot be looked at',
    guard: 'AND THE OFFERED VIEWPORTS SPAN THE CLAMP, or the worst case is unreachable',
    edit: {
      path: 'rig/sheet.ts',
      find: "  { label: '1280×800 · 16:10', w: 1280, h: 800 },\n",
      replace: '',
    },
  },
];
