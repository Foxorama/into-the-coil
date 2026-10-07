// The breaks behind docs/decisions/0572-the-dock-is-dressed.md.
//
// ⚠️ Each puts back one thing the play named: the balance in the foot, the bubble off its keeper, the
// monitor in the corner, the caption left saying what the band opened on, and the fitted fill over the picture.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0572',
    suite: 'tests/dressed.browser.test.ts',
    broke: 'the balance back in the plate’s foot',
    guard: 'stands the balance in the stand’s top right corner',
    edit: {
      path: 'src/app/chrome.ts',
      find: '      if (sheet !== null && stand !== null) stand.appendChild(sheet);',
      replace: '      if (sheet !== null && stand !== null) foot.appendChild(sheet);',
    },
  },
  {
    decision: '0572',
    suite: 'tests/dressed.browser.test.ts',
    broke: 'every bubble hung over the stand’s middle, whoever is speaking',
    guard: 'hangs each keeper’s words over the keeper',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    const x = at.keeperX - box.left;',
      replace: '    const x = box.width / 2;',
    },
  },
  {
    decision: '0572',
    suite: 'tests/dressed.browser.test.ts',
    broke: 'the monitor back in the stand’s corner',
    guard: 'stands the cockpit monitor under the ship',
    edit: {
      path: 'src/app/chrome.ts',
      find: '      const x = Math.min(Math.max(at.shipX - box.left - dash.offsetWidth / 2, 0), Math.max(0, box.width - dash.offsetWidth));',
      replace: '      const x = 0 * Math.min(Math.max(at.shipX - box.left - dash.offsetWidth / 2, 0), Math.max(0, box.width - dash.offsetWidth));',
    },
  },
  {
    decision: '0572',
    suite: 'tests/dressed.browser.test.ts',
    broke: 'a caption never told what was stepped onto',
    guard: 'says what each band has on under the band',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  const paintCardOf = (band: Band): void => {\n    paintCaption(band);',
      replace: '  const paintCardOf = (band: Band): void => {\n    if (band.index < -1) paintCaption(band);',
    },
  },
  {
    decision: '0572',
    suite: 'tests/dressed.browser.test.ts',
    broke: 'a shop in the picture pressed and nothing opened',
    guard: 'opens a shop’s tab when the shop in the picture is pressed',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        const open = (): void => {\n          if (tab !== screen) onTab(tab);\n        };',
      replace: '        const open = (): void => {};',
    },
  },
  {
    decision: '0572',
    suite: 'tests/dressed.browser.test.ts',
    broke: 'a bubble that never fades',
    guard: 'lets a keeper’s bubble fade once it has been read',
    edit: {
      path: 'src/app/chrome.ts',
      find: '{ animation: itc-say 6s ease-out both; }',
      replace: '{ opacity: 1; }',
    },
  },
  {
    decision: '0572',
    suite: 'tests/dressed.browser.test.ts',
    broke: 'a caption as tall as its words, so the bands under it jump as the cursor steps',
    guard: 'holds a band’s caption at one height',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    overflow: hidden;\n    height: 2.5em;\n  }',
      replace: '    overflow: hidden;\n  }',
    },
  },
  {
    decision: '0572',
    suite: 'tests/dressed.browser.test.ts',
    broke: 'the fitted card filled over its picture again',
    guard: 'draws a picture on every Hangin’ Out card',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    background-color: color-mix(in srgb, var(--itc-void, #000) 70%, transparent);',
      replace: '',
    },
  },
];
