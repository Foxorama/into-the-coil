// The breaks behind docs/decisions/0564-cosmos-sells-pictures.md.
//
// ⚠️ The three answers the player gave, each undone: a purchase made without the sheet, every shelf
// drawn at once again, and a tile with no picture on it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0564',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'Buy buying at once, with no sheet to ask first',
    guard: 'tries the ware on the dash, buys it once',
    edit: {
      path: 'src/app/mount.ts',
      find: '        } else if (state.hangar.shards >= price) {\n          chrome.ask(',
      replace: '        } else if (state.hangar.shards >= price) {\n          justSold = ware;\n          dispatch({ slice: \'hangar\', type: \'bought\', ware });\n          if (Number.isNaN(0)) chrome.ask(',
    },
  },
  {
    decision: '0564',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'every shelf drawn at once on a desktop, the aisle a band that looks like it does nothing',
    guard: 'tries the ware on the dash, buys it once',
    edit: {
      path: 'src/app/chrome.ts',
      find: ".itc-shop-band-away { display: none; }\n.itc-shop-band:has(",
      replace: ".itc-shop-band-away { display: grid; }\n.itc-shop-band:has(",
    },
  },
  {
    decision: '0564',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'a ware on the shelf with no picture',
    guard: 'tries the ware on the dash, buys it once',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        art.replaceChildren(wareArt(ware));',
      replace: '        art.replaceChildren();',
    },
  },
];
