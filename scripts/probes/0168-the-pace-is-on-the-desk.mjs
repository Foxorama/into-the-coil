// The break behind docs/decisions/0168-the-pace-is-on-the-desk.md.
//
// ⚠️ THE READOUT IS ONLY WORTH HAVING IF IT IS THE GAME'S NUMBER. `paceAt` walks the LADDER and
// `rungShape` walks the GAINS, and they have to agree layer for layer — a desk that counted a layer
// the mixer does not open would be the instrument disagreeing with the thing it measures, which is
// what docs/decisions/0126-the-dashboard-is-the-instrument.md exists against and what
// docs/decisions/0116-the-rig-plays-the-level.md was named for.
//
// ⚠️ AND THE PLACE'S OWN VOICES ARE THE HALF THAT WOULD GO UNNOTICED. Six places re-voice most of the
// composition, so a `paceAt` that read the BASE patterns would be right for level one and wrong for
// the other six — green on the place the developer happens to be looking at.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0168',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE PLACE DROPPED, so the count reads the base composition's patterns for every level. It is
      the plausible slip — `notesPerBar` takes a theme and `undefined` is a legal value meaning *the
      base* — and it is right for one place in seven.
    */
    broke: 'the pace counted off the base composition, so six places report level one’s patterns',
    guard: '0168 — THE DESK’S PACE IS THE GUARD’S PACE, layer for layer and rung for rung',
    edit: {
      path: 'src/content/themes.ts',
      find: '    if (rungOf(theme, rung, layer, ladder) > 0) notes += notesPerBar(theme, layer);',
      replace: '    if (rungOf(theme, rung, layer, ladder) > 0) notes += notesPerBar(undefined, layer);',
    },
  },
  {
    decision: '0168',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ A REST COUNTED AS A NOTE, which is the arithmetic slip rather than the wiring one. `steps`
      holds `null` for a rest — 0102 is emphatic that a rest is not a zero, because zero is the root —
      so a truthiness test instead of a null test silently counts every rest AND drops every root.
      Both errors at once, and the number stays plausible.
    */
    broke: 'a rest counted as a note and the root dropped, which is one `!= null` becoming truthiness',
    guard: '0168 — THE DESK’S PACE IS THE GUARD’S PACE, layer for layer and rung for rung',
    edit: {
      path: 'src/content/themes.ts',
      find: '    for (const step of voice.steps) if (step !== null && step !== undefined) notes++;',
      replace: '    for (const step of voice.steps) if (step) notes++;',
    },
  },
];
