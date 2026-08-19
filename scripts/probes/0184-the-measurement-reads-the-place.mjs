// The breaks behind docs/decisions/0184-the-measurement-reads-the-place.md.
//
// ⚠️ THE FIRST IS THE SHIPPED DEFECT, RESTORED — `heardAt` reading the shared ladder, which is what
// it did from docs/decisions/0162-a-place-has-its-own-ladder.md until this decision. Six of seven
// places state a ladder; 65 gains differ from the shared row; six of the fifty-four known-adrift
// entries were phantoms. The guard that catches it is the SCAN, which is the half 0184 adds.
//
// ⚠️ THE SECOND IS THE ONE THE SCAN CANNOT SEE, AND IT IS WHY THERE ARE TWO. A call site that reads
// A place's ladder — just always the wrong place's — contains no `MUSIC_LADDER[` for the scan to
// find, and it is precisely the mistake docs/decisions/0162-a-place-has-its-own-ladder.md records
// being made when it hard-coded `THEMES.approach.ladder` and every value assertion stayed green.
// This one lands on 0164's role floor instead, which is where the measurement's answer lives.
//
// ⚠️ AND `scripts/hear.mjs`'s CORRECTED READ HAS NO BREAK, WHICH 0019 ASKS TO BE WRITTEN DOWN. Its
// solo mode prints a COUNT of what is sounding; nothing asserts on that count, so a probe pointed at
// it would redden nothing. The fix is right and it is not load-bearing, and saying so beats a break
// that proves the harness works.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0184',
    suite: 'tests/dash.test.ts',
    broke: 'the measurement reading the shared ladder, which is the level six of seven places do not play',
    guard: '0162 — NOTHING UNDER src/ OR rig/ READS THE SHARED LADDER, because a place may differ from it',
    edit: {
      path: 'tests/pace.ts',
      find: "  return rungOf(theme ?? 'approach', rung, layer) * mixOf(theme ?? 'approach', layer) * ceiling;",
      replace: "  return MUSIC_LADDER[rung][layer] * mixOf(theme ?? 'approach', layer) * ceiling;",
    },
  },
  {
    decision: '0184',
    suite: 'tests/themes.test.ts',
    broke: "the measurement reading level one's ladder for every place, which no scan can see",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'tests/pace.ts',
      find: "  return rungOf(theme ?? 'approach', rung, layer) * mixOf(theme ?? 'approach', layer) * ceiling;",
      replace: "  return rungOf('approach', rung, layer) * mixOf(theme ?? 'approach', layer) * ceiling;",
    },
  },
];
