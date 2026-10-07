// The breaks behind docs/decisions/0542-cosmos-counter.md.
//
// Cosmo's counter: a shelf per table, the price on the face and on Buy, Cosmo's line, every ware tried on
// where it goes, and the stall by the pad — on every tab since 0548. Each put back as it was.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0542',
    suite: 'tests/wheels.browser.test.ts',
    // A rim in the window left off the ship on its pad.
    broke: 'a rim in Cosmo’s window not tried on the pad',
    guard: 'turning on its pad',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (rim !== undefined) return SHIPS[ship].wheels === null ? fit : { ...fit, rim };',
      replace: '    if (rim !== undefined) return fit;',
    },
  },
  {
    decision: '0542',
    suite: 'tests/flames.browser.test.ts',
    // A flame in the window left out of the ship's exhaust on its pad.
    broke: 'a flame in Cosmo’s window not tried on the pad',
    guard: 'the run’s flame is royal blue',
    edit: {
      path: 'src/app/mount.ts',
      find: '    return flame === undefined ? fit : { ...fit, flame };',
      replace: '    return fit;',
    },
  },
  {
    decision: '0542',
    suite: 'tests/cosmo.browser.test.ts',
    // The ware's face its name alone, as it was on one band.
    broke: 'a ware’s face without its price',
    guard: 'tries the ware on the dash',
    edit: {
      path: 'src/app/mount.ts',
      // 0564: the price is the tile's tag, under its name.
      find: "return { text: String(price) + ' ✦', tone:",
      replace: "return { text: '', tone:",
    },
  },
  {
    decision: '0542',
    suite: 'tests/cosmo.browser.test.ts',
    // Buy, and no price on it.
    broke: 'Buy not naming the price',
    guard: 'tries the ware on the dash',
    edit: {
      path: 'src/app/mount.ts',
      find: ": 'Buy · ' + String(price) + ' ✦');",
      replace: ": 'Buy');",
    },
  },
  {
    decision: '0542',
    suite: 'tests/cosmo.browser.test.ts',
    // The sale forgotten, so Cosmo says only what is already owned.
    broke: 'Cosmo not thanking the player for a sale',
    guard: 'tries the ware on the dash',
    edit: {
      path: 'src/app/mount.ts',
      // 0564: set when the sheet's Buy is pressed.
      find: '              justSold = ware;',
      replace: '              justSold = null;',
    },
  },
  {
    decision: '0542',
    suite: 'tests/stand.test.ts',
    // The stall gone from the room, Cosmo standing at nothing. 0548 drew it on every tab, where this probe
    // was the stall drawn on every tab and its guard said it must not be. 0550: every tab's keeper's counter.
    broke: 'the counter not drawn by the pad',
    guard: 'stands the tab’s keeper at their counter beside the pad',
    edit: {
      path: 'src/render/port.ts',
      // 0571: on the dock's mezzanine.
      find: '    put(surface, view, PORT_SPRITE[row.counter], shop, DOCK.shopAcross, 1, 0, s);',
      replace: '',
    },
  },
  {
    decision: '0542',
    suite: 'tests/cosmo.test.ts',
    // A table's wares off the shop: the spinners for sale on no shelf.
    broke: 'a ware for sale on no shelf',
    guard: 'puts every ware on its own table’s shelf',
    edit: {
      path: 'src/content/wares.ts',
      find: "  wheels: { label: 'Wheels', wares: RIM_KINDS.filter((kind) => RIMS[kind].price !== null) },",
      replace: "  wheels: { label: 'Wheels', wares: [] },",
    },
  },
];
