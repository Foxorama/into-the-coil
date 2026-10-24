// The breaks behind docs/decisions/0667-the-band-arms.md.
//
// ⚠️ Four defects in one decision, and each break puts one back as the review found it: the pad's one press
// on the pilot band, the hover that lost its glass and its rim, the shop's hint run on after its label, and
// the Settings strip standing at each tab's own height.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0667',
    suite: 'tests/menu.browser.test.ts',
    // 0513's one-press rule back for the cursor: the pad's first A on the band flies.
    broke: 'A on the pilot band flying the pilot it is on, with no look first',
    guard: 'THE WALK: A on the pilot band arms the pilot it is on',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (takes && pressed && pilotArmed) {',
      replace: '      if (takes && pressed && (!pointer || pilotArmed)) {',
    },
  },
  {
    decision: '0667',
    suite: 'tests/menu.browser.test.ts',
    broke: 'the armed pilot never said on the title',
    guard: 'THE WALK: A on the pilot band arms the pilot it is on',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        if (line !== undefined && line.armed !== null) line.armed.hidden = !armed;\n',
      replace: '',
    },
  },
  {
    decision: '0667',
    suite: 'tests/layout.browser.test.ts',
    // The shorthand that won on hover, wiping the glass and the rim to a flat grey.
    broke: 'a hovered button drawn as a flat grey with no rim',
    guard: 'no darker than Settings beside it',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-title-choices > :not(.itc-title-action-lead) { min-width: 0; overflow: hidden; text-overflow: ellipsis; }\n',
      replace:
        ".itc-title-choices > :not(.itc-title-action-lead) { min-width: 0; overflow: hidden; text-overflow: ellipsis; }\n${each('-action:hover')} { background: rgba(255, 255, 255, 0.12); }\n",
    },
  },
  {
    decision: '0667',
    suite: 'tests/layout.browser.test.ts',
    broke: 'a hovered button whose glass sinks to the void',
    guard: 'no darker than Settings beside it',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  --itc-glass: color-mix(in srgb, var(--itc-void) 70%, var(--itc-ally, var(--itc-ink)));\n  box-shadow: 0 0 1.2em',
      replace: '  --itc-glass: var(--itc-void);\n  box-shadow: 0 0 1.2em',
    },
  },
  {
    decision: '0667',
    suite: 'tests/chrome.test.ts',
    // The four screens named by hand again, and the shop not one of them.
    broke: 'the action hint set on a line of its own on four named screens and not the shop',
    guard: 'every screen with a hinted action sets the hint on its own line',
    edit: {
      path: 'src/app/chrome.ts',
      find: "${each('-action-hint')} {",
      replace: '.itc-title-action-hint, .itc-music-action-hint, .itc-save-action-hint, .itc-controls-action-hint {',
    },
  },
  {
    decision: '0667',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'Show owned’s hint run on after its label',
    guard: 'what is owned is off the shelves until Show owned is ticked',
    edit: {
      path: 'src/app/chrome.ts',
      find: "${each('-action-hint')} {",
      replace: '.itc-title-action-hint, .itc-music-action-hint, .itc-save-action-hint, .itc-controls-action-hint {',
    },
  },
  {
    decision: '0667',
    suite: 'tests/layout.browser.test.ts',
    broke: 'each Settings tab centred on its own content, its strip at its own height',
    guard: 'with their strip at one height, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: "${TABBED.map((screen) => `.${prefixFor(screen)}panel`).join(', ')} { margin-top: min(2rem, 6cqh); }\n",
      replace: '',
    },
  },
];
