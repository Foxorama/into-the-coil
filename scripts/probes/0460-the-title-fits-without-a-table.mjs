// The breaks behind docs/decisions/0460-the-title-fits-without-a-table.md.
//
// Three CSS lines, each of which shipped broken: the bare title losing to the phone's two columns,
// the faces' track centred past its own start, and the sky's washes resetting its stars. Each is put
// back here on its own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0460',
    suite: 'tests/layout.browser.test.ts',
    // The reported one: the bare rule at one class, so the phone block's two columns win.
    broke: 'the title with nothing kept giving its rows five sixteenths of a phone',
    guard: 'with nothing kept, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-title-body.itc-title-body-bare { grid-template-columns: minmax(0, 1fr); }',
      replace: '.itc-title-body-bare { grid-template-columns: minmax(0, 1fr); }',
    },
  },
  {
    decision: '0460',
    suite: 'tests/layout.browser.test.ts',
    // A plain centre: a row wider than its track overflows before the start, where no scroll goes.
    broke: 'the faces centred past their track’s start, so the first is cut and cannot be scrolled to',
    guard: 'on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: '${faced((p) => `.${p}options-faces`)} { justify-content: safe center;',
      replace: '${faced((p) => `.${p}options-faces`)} { justify-content: center;',
    },
  },
  {
    decision: '0460',
    suite: 'tests/layout.browser.test.ts',
    // The washes back on the sky itself, where their shorthand resets the stars' images and sizes.
    broke: 'the washes on the drifting sky, so the stars go and the drift slides a seam across the title',
    guard: 'sizes every layer of the drifting background as a tile',
    edit: {
      path: 'src/app/chrome.ts',
      find: ".itc-title-sky::before {\n  content: '';\n  position: absolute;\n  inset: 0;\n  background:",
      replace: '.itc-title-sky {\n  background:',
    },
  },
];
