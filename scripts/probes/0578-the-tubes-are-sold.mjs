// The breaks behind docs/decisions/0578-the-tubes-are-sold.md.
//
// ⚠️ The one ware the sim reads, so every link from the shelf to the run is a way to hand out tubes for
// nothing or to sell ones that never fly: the price, the first before the second, the rack the owned
// tubes are enough for, the save that keeps it, and the shell handing it to the run.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0578',
    suite: 'tests/tube-shop.test.ts',
    broke: 'the tubes priced at something other than the ask’s 500',
    guard: 'THE ASK: a first and second of each kind of tube, 500 shards each',
    edit: { path: 'src/content/racks.ts', find: 'const TUBE_PRICE = priced(500);', replace: 'const TUBE_PRICE = priced(400);' },
  },
  {
    decision: '0578',
    suite: 'tests/tube-shop.test.ts',
    broke: 'the second tube of a kind sold before the first',
    guard: 'sells the second of a kind only once the first is owned',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return price !== null && !state.owned[ware] && needsFirst(state, ware) === null && state.shards >= price;',
      replace: '  return price !== null && !state.owned[ware] && state.shards >= price;',
    },
  },
  {
    decision: '0578',
    suite: 'tests/tube-shop.test.ts',
    broke: 'every rack open whatever tubes are owned',
    guard: 'is open only when the tubes owned are enough of each kind for it',
    edit: { path: 'src/state/slices/hangar.ts', find: '    if (tubesOf(rack, kind) > owned) return false;\n', replace: '' },
  },
  {
    decision: '0578',
    suite: 'tests/tube-shop.test.ts',
    broke: 'a saved rack fitted without asking whether the tubes owned fill it',
    guard: 'a document fitting a rack its own list does not own enough tubes for reads as bare',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (raw !== undefined && rackOpen(holding, raw)) rack[kind] = raw;',
      replace: '    if (raw !== undefined) rack[kind] = raw;',
    },
  },
  {
    decision: '0578',
    suite: 'tests/tube-shop.browser.test.ts',
    broke: 'the shell beginning every run on no tubes, whatever the hangar fitted',
    guard: 'one of each fitted to the fighter on Hangin’ Out',
    edit: { path: 'src/app/mount.ts', find: '      RACKS[state.hangar.rack[ship]].tubes,\n      // 0584', replace: '      [],\n      // 0584' },
  },
];
