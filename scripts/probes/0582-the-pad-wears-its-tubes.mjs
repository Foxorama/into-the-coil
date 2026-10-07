// The breaks behind docs/decisions/0582-the-pad-wears-its-tubes.md.
//
// ⚠️ Every way the pad could go back to a bare ship whatever the rack: the picture not painting its tubes,
// the hangar's fit not carrying the rack, a fit with other tubes read as the same picture so the pad is
// never baked again, and every tube painted in one ink.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0582',
    suite: 'tests/pad-tubes.browser.test.ts',
    broke: 'the pad’s ship painted bare whatever it carries, as it was',
    guard: 'fits one of each on Hangin’ Out, and the ship on the pad changes as it does',
    edit: {
      path: 'src/render/port-bake.ts',
      find: '  drawPlayerShip(ctx, f, palette, ship, tubes.length);\n  paintLoadedTubes(ctx, f, palette, ship, tubes);',
      replace: '  drawPlayerShip(ctx, f, palette, ship, 0);',
    },
  },
  {
    decision: '0582',
    suite: 'tests/pad-tubes.browser.test.ts',
    broke: 'the hangar’s fit carrying no rack, so the pad never learns of one',
    guard: 'fits one of each on Hangin’ Out, and the ship on the pad changes as it does',
    edit: { path: 'src/app/mount.ts', find: 'flame: h.flame[ship], tubes: RACKS[h.rack[ship]].tubes };', replace: 'flame: h.flame[ship], tubes: [] };' },
  },
  {
    decision: '0582',
    suite: 'tests/pad-tubes.test.ts',
    broke: 'a fit with other tubes read as the same picture, so the pad is not baked again',
    guard: 'comes with no tubes, and one with other tubes is another picture',
    edit: {
      path: 'src/content/ships.ts',
      find: '    a.tubes.length === b.tubes.length &&\n    a.tubes.every((kind, i) => kind === b.tubes[i])',
      replace: '    true',
    },
  },
  {
    decision: '0582',
    suite: 'tests/pad-tubes.test.ts',
    broke: 'every tube on the pad painted in the missile’s gold',
    guard: 'THE ASK: every ship wears each tube of a rack at its place',
    edit: { path: 'src/render/bake.ts', find: '    const ink = palette[INK_OF[sprite]];', replace: '    const ink = palette.bullet;' },
  },
];
