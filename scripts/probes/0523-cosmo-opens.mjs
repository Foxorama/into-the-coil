// The breaks behind docs/decisions/0523-cosmo-opens.md.
//
// ⚠️ The shop is the one place shards leave, so the breaks that matter are the trade going wrong in
// the player's favour or against it — on credit, twice, unpaid, unowned, forged — and the picture
// not saying what is bought or what hangs.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0523',
    suite: 'tests/cosmo.test.ts',
    broke: 'a ware bought whatever the balance holds',
    guard: 'refuses a ware the balance does not cover',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return price !== null && !state.owned[dangle] && state.shards >= price;',
      replace: '  return price !== null && !state.owned[dangle];',
    },
  },
  {
    decision: '0523',
    suite: 'tests/cosmo.test.ts',
    broke: 'a ware owned bought again, its price taken twice',
    guard: 'takes the price and gives the ware, once',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return price !== null && !state.owned[dangle] && state.shards >= price;',
      replace: '  return price !== null && state.shards >= price;',
    },
  },
  {
    decision: '0523',
    suite: 'tests/cosmo.test.ts',
    broke: 'a ware never bought hung on a ship',
    guard: 'refuses what is not owned',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '      if (action.dangle !== null && !state.owned[action.dangle]) return state;\n',
      replace: '',
    },
  },
  {
    decision: '0523',
    suite: 'tests/cosmo.test.ts',
    broke: 'a saved dangle hung without asking whether the document owns it',
    guard: 'a document hanging what its own list does not own',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (dangle !== undefined && owned[dangle]) hung[kind] = dangle;',
      replace: '    if (dangle !== undefined) hung[kind] = dangle;',
    },
  },
  {
    decision: '0523',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'the shop’s readout wearing what the ship has hung, never the ware in the window',
    guard: 'tries the ware on the dash, buys it once',
    edit: {
      path: 'src/app/mount.ts',
      find: "    chrome.setDangle(state.screen.current === 'shop' && ware !== undefined ? ware : hung);",
      replace: '    chrome.setDangle(hung);',
    },
  },
  {
    decision: '0523',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'Buy left up on a ware already owned',
    guard: 'tries the ware on the dash, buys it once',
    edit: {
      path: 'src/app/mount.ts',
      find: "      chrome.setActionShown('shop', 0, !state.hangar.owned[ware]);",
      replace: "      chrome.setActionShown('shop', 0, true);",
    },
  },
  {
    decision: '0523',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'the dangle mount shown only on the walnut plate, as it was',
    guard: 'tries the ware on the dash, buys it once',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-playing-hud-hanging .itc-playing-hud-dice { display: block;',
      replace: '.itc-playing-hud-walnut .itc-playing-hud-dice { display: block;',
    },
  },
];
