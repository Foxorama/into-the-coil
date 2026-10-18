// The break behind docs/decisions/0637-the-shoulders-step-the-pilot-on-the-title.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0637',
    suite: 'tests/menu.browser.test.ts',
    broke: 'the shoulders doing nothing on a screen with no tabs, as they did on the title',
    guard: '0637 — and on the title, which has no tabs, the shoulders step the pilot too',
    edit: {
      path: 'src/app/chrome.ts',
      find:
        "      if (panel.tabs.length === 0) {\n" +
        "        const band = panel.bands.find((b) => b.name === 'pilot');\n" +
        '        if (band !== undefined) stepBand(band, delta, true);\n' +
        '        return;\n' +
        '      }',
      replace: '      if (panel.tabs.length === 0) return;',
    },
  },
];
