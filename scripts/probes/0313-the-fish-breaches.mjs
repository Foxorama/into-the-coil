// The fish breaches — docs/decisions/0313-the-fish-breaches.md
//
// Every guard 0313 adds, broken on purpose. `node scripts/prove-guard.mjs 0313`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0313',
    suite: 'tests/volans.test.ts',
    // Every leap the same height: three arcs, and none of them builds on the one before.
    broke: 'every leap the same height, so the flight repeats rather than escalating',
    guard: 'THE ASKED-FOR ONE: it comes up through the near edge',
    edit: {
      path: 'src/content/bosses.ts',
      find: "entrance: { kind: 'breach', surface: ACROSS_SPAN, from: 176, leaps: 3, span: 59, height: 34, rise: 1.4, speed: 1.2 },",
      replace: "entrance: { kind: 'breach', surface: ACROSS_SPAN, from: 176, leaps: 3, span: 59, height: 34, rise: 1, speed: 1.2 },",
    },
  },
  {
    decision: '0313',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE LAST CREST OVER THE WHOLE LANE, which is a flight that reads as spectacular on a sheet and
      leaves the player nowhere to be. The parked ship is what goes red, exactly as it is on the coil
      (0306) — and no geometry in the guard was told what the crest heights are.
    */
    broke: 'the last leap clearing the whole lane, so there is no band left to learn',
    guard: 'the far side of the lane is the place to be',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'height: 34, rise: 1.4, speed: 1.2 },',
      replace: 'height: 34, rise: 2.4, speed: 1.2 },',
    },
  },
  {
    decision: '0313',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE OTHER SIDE OF THE SAME GUARD: leaps that barely clear the edge. Every claim about the
      safe band is greener than ever — the band is the whole lane — and the entrance is now scenery a
      player dodges by standing still. A guard that only asks *was the ship safe* passes this.
    */
    broke: 'the leaps barely clearing the edge, so the entrance never crosses the lane at all',
    guard: 'the far side of the lane is the place to be',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'span: 59, height: 34, rise: 1.4',
      replace: 'span: 59, height: 5, rise: 1.4',
    },
  },
  {
    decision: '0313',
    suite: 'tests/volans.test.ts',
    // The skip started beyond the narrowest view's leading edge: flashy on the monitor it was authored
    // on, and a first crest nobody on 16:9 ever sees — 0023.
    broke: 'the first leap started past the narrowest screen’s leading edge',
    guard: 'the whole skip happens on the NARROWEST screen',
    edit: {
      path: 'src/content/bosses.ts',
      find: "surface: ACROSS_SPAN, from: 176, leaps: 3",
      replace: "surface: ACROSS_SPAN, from: 240, leaps: 3",
    },
  },
  {
    decision: '0313',
    suite: 'tests/volans.test.ts',
    // The hull flying its whole breach facing down the lane, which is what `blit` forced before 0306.
    broke: 'the hull never turned to its arc, so it flies the leap sideways',
    guard: 'the hull noses into its arc',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (chain === null) boss.turn = turnFor(ENTRANCE_AT[2]!);',
      replace: '    if (chain === null) boss.turn = 0;',
    },
  },
  {
    decision: '0313',
    suite: 'tests/volans.test.ts',
    // The hand-over the moment the run-in ends: the fish is put on station from the middle of the
    // screen, which is a teleport anybody can see. 0306's own third probe, one kind over.
    broke: 'the entrance handed over while the fish is still on the screen',
    guard: 'THE ASKED-FOR ONE: it comes up through the near edge',
    edit: {
      path: 'src/app/frame.ts',
      find: 'return startAlong - e.from + Math.min(acrossOut, alongOut) + e.speed + reach;',
      replace: 'return startAlong - e.from + 0 * Math.min(acrossOut, alongOut) + e.speed + reach;',
    },
  },
  {
    decision: '0313',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE PICTURE DROPPED AND THE MODEL LEFT ALONE — 0036. The fish goes through the edge four times
      and nothing is thrown and nothing sounds, which is the failure 0036 records three play reports of:
      an event the model resolves that the screen never mentions. Every claim about the FLIGHT stays
      green over this.
    */
    broke: 'the spray and the crack dropped, so the fish slides through an invisible line four times',
    guard: 'every time it goes through the edge the screen says so',
    edit: {
      path: 'src/app/frame.ts',
      find: '    breakSurface(w, entrance, w.bossEntryAt, s);\n',
      replace: '',
    },
  },
  {
    decision: '0313',
    suite: 'tests/volans.test.ts',
    // And the crossings miscounted by one: the break OUT of the edge is not counted, so the first and
    // biggest event of the entrance is the silent one.
    broke: 'the first break out of the edge uncounted, so it is the one crossing with no spray',
    guard: 'every time it goes through the edge the screen says so',
    edit: {
      path: 'src/app/frame.ts',
      find: 'return u < 0 ? 0 : Math.min(Math.floor(u / e.span) + 1, e.leaps + 1);',
      replace: 'return u < 0 ? 0 : Math.min(Math.floor(u / e.span), e.leaps + 1);',
    },
  },
];
