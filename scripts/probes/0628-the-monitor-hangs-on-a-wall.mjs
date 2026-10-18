// The breaks behind docs/decisions/0628-the-monitor-hangs-on-a-wall.md.
//
// ⚠️ Read off the shipped page: each break is built into dist before the suite runs (the harness builds a
// browser suite's tree), and the guard reads the canvas round the cockpit monitor.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0628',
    suite: 'tests/workshop.browser.test.ts',
    broke: 'the workshop wall not drawn',
    guard: 'hangs under the wall’s header and no wider than it',
    edit: {
      path: 'src/render/port.ts',
      find: '  put(surface, view, PORT_SPRITE.workWall, shop.along, shop.foot - PORT_EXTENT.workWall / 2);',
      replace: '  void shop.foot;',
    },
  },
  {
    decision: '0628',
    suite: 'tests/workshop.browser.test.ts',
    broke: 'the benches not drawn',
    guard: 'hangs under the wall’s header and no wider than it',
    edit: {
      path: 'src/render/port.ts',
      find: '  put(surface, view, PORT_SPRITE.workBenches, shop.along, shop.benchFoot - PORT_EXTENT.workBenches / 2);',
      replace: '  void shop.benchFoot;',
    },
  },
  {
    decision: '0628',
    suite: 'tests/workshop.browser.test.ts',
    broke: 'the monitor back on the floor under the ship, where 0572 stood it',
    guard: 'hangs under the wall’s header and no wider than it',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    left: var(--itc-hang-x, 1.5%);\n    top: var(--itc-hang-y, auto);\n    bottom: auto;',
      replace: '    left: var(--itc-dash-x, 1.5%);\n    top: auto;\n    bottom: 1.2%;',
    },
  },
  {
    decision: '0628',
    suite: 'tests/workshop.browser.test.ts',
    broke: 'the monitor its old width, wider than the wall it hangs on',
    guard: 'hangs under the wall’s header and no wider than it',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    width: var(--itc-hang-w, auto);\n    max-width: none;',
      replace: '    width: auto;\n    max-width: min(24rem, 60%);',
    },
  },
  {
    decision: '0628',
    suite: 'tests/workshop.browser.test.ts',
    broke: 'the monitor’s type the floor’s whatever the wall’s width, so its foot comes down over the bench’s tools',
    guard: 'hangs under the wall’s header and no wider than it',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    font-size: min(0.85rem, calc(var(--itc-hang-w, 13.6rem) * 0.069));',
      replace: '    font-size: 0.85rem;',
    },
  },
  {
    decision: '0628',
    suite: 'tests/stand.test.ts',
    broke: 'the ship back at 124, its flame at the wall’s post — the played *flat against the wall*',
    guard: 'leaves about as much deck between its hull and the workshop wall as between its hull and the bay',
    edit: { path: 'src/content/port.ts', find: '  ship: 131,', replace: '  ship: 124,' },
  },
  {
    decision: '0628',
    suite: 'tests/stand.test.ts',
    broke: 'a phone’s camera not slid to keep the ship whole, so its nose runs past the column at 480x320',
    guard: 'puts the ship on its pad in the stand’s part of the screen',
    edit: {
      path: 'src/render/port.ts',
      find: '  out.x = Math.min(out.x, (box.left + box.width - nose) / width);',
      replace: '  void nose;',
    },
  },
];
