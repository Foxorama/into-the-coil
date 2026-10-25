// The breaks behind docs/decisions/0681-the-dock-dressed.md.
//
// ⚠️ Three ways back to three alike shops: one front on two rows, Cosmo's counter lifted off the catwalk, and the
// shops drawn in the table's order rather than farthest first.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0681',
    suite: 'tests/stand.test.ts',
    broke: 'Unity’s workshop front on MMXXVI’s shop too',
    guard: 'stands three shops of three shapes',
    edit: { path: 'src/content/keepers.ts', find: "    front: 'frontBooth',", replace: "    front: 'frontWorkshop'," },
  },
  {
    decision: '0681',
    suite: 'tests/stand.test.ts',
    broke: 'Cosmo’s shop lifted three units, its counter over the catwalk',
    guard: 'stands three shops of three shapes',
    edit: { path: 'src/content/port.ts', find: 'shopAcross: { unity: 47.1, mmxxvi: 47.8, cosmo: 46.5 }', replace: 'shopAcross: { unity: 47.1, mmxxvi: 47.8, cosmo: 43.5 }' },
  },
  {
    decision: '0681',
    suite: 'tests/stand.test.ts',
    broke: 'the shops drawn in the table’s order, a nearer one under a farther',
    guard: 'stands three shops of three shapes',
    edit: {
      path: 'src/render/port.ts',
      find: 'const SHOP_ORDER: readonly KeeperKind[] = [...KEEPER_KINDS].sort((a, b) => DOCK.shopGrow[a] - DOCK.shopGrow[b]);',
      replace: 'const SHOP_ORDER: readonly KeeperKind[] = KEEPER_KINDS;',
    },
  },
];
