// The breaks behind docs/decisions/0529-the-livery-is-free.md.
//
// ⚠️ The paint's rule, its key and its palette, and the three pictures it must reach — the card, the
// readout's ship that is the atlas a run flies, and the body ink a painter fills with.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0529',
    suite: 'tests/livery.test.ts',
    broke: 'a ship painted before it is won in',
    guard: 'is painted only once it is won in',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return state.won[ship];',
      replace: '  return true;',
    },
  },
  {
    decision: '0529',
    suite: 'tests/livery.test.ts',
    broke: 'a chosen colour on the high-contrast palette, whose every ink is a meaning',
    guard: 'the high-contrast look stays on its roles',
    edit: {
      path: 'src/content/livery.ts',
      find: "  return livery === null || palette === 'high-contrast' ? null : liveryInk(livery);",
      replace: '  return livery === null ? null : liveryInk(livery);',
    },
  },
  {
    decision: '0529',
    suite: 'tests/livery.test.ts',
    broke: 'a saved paint laid on a ship never won in',
    guard: 'keeps each ship’s paint, and refuses one on a ship never won in',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (read !== null && liveryOpen(opened, kind)) livery[kind] = read;',
      replace: '    if (read !== null) livery[kind] = read;',
    },
  },
  {
    decision: '0529',
    suite: 'tests/livery.browser.test.ts',
    broke: 'the Firebird filled in its lacquer whatever it was painted',
    guard: 'the card and the readout’s ship both repainted',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const body = livery ?? shade(mix(palette.space, palette.hazard, 0.08), 0.16);',
      replace: '  const body = shade(mix(palette.space, palette.hazard, 0.08), 0.16);',
    },
  },
  {
    decision: '0529',
    suite: 'tests/livery.browser.test.ts',
    broke: 'a re-bake that does not tell one paint from another, so the run flies the factory’s',
    guard: 'the card and the readout’s ship both repainted',
    edit: {
      path: 'src/content/ships.ts',
      // ⚠️ Re-anchored by 0582, which compares the tubes too, a field to a line.
      find: '    a.livery === b.livery &&\n',
      replace: '',
    },
  },
];
