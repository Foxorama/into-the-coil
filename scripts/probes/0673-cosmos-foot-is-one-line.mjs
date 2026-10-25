// The breaks behind docs/decisions/0673-cosmos-foot-is-one-line.md.
//
// ⚠️ Each puts back what the review found: Cosmo's filter among its foot's actions, its sub-tabs cut to
// *Han… Whe…* on a phone, a chip on Paint & Parts drawn in half, a lone flame with no way to the rest, and
// the art's picture a glyph.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0673',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'Cosmo’s Owned left in the foot among Buy and Back',
    guard: 'the filter at the shelf’s head',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        aisle.root.after(owned);\n',
      replace: '',
    },
  },
  {
    decision: '0673',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'the shelf’s heading drawn again under the open sub-tab, HANGING under Hanging',
    guard: 'the filter at the shelf’s head',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-hangar-group .itc-hangar-band-label, .itc-parts-group .itc-parts-band-label { display: block;',
      replace:
        '  .itc-hangar-group .itc-hangar-band-label, .itc-parts-group .itc-parts-band-label, .itc-shop-plate .itc-shop-band:not(.itc-shop-band-faces) .itc-shop-band-label { display: block;',
    },
  },
  {
    decision: '0673',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'the sub-tabs squeezed to the strip and cut short with an ellipsis',
    guard: 'draws every sub-tab whole',
    edit: {
      path: 'src/app/chrome.ts',
      find: "  .itc-shop-plate .itc-shop-band:has([${SETTING_ATTR}='aisle']) .itc-shop-option { flex: 0 0 auto; white-space: nowrap; }",
      replace:
        "  .itc-shop-plate .itc-shop-band:has([${SETTING_ATTR}='aisle']) .itc-shop-option { flex: 1 1 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }",
    },
  },
  {
    decision: '0673',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'whole chips kept to a band of faces, so a chip row cuts its last chip in half',
    guard: 'shows whole chips on Paint & Parts',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  const wholeChips = (band: Band): void => {\n',
      replace: "  const wholeChips = (band: Band): void => {\n    if (band.faces !== 'portraits') return;\n",
    },
  },
  {
    decision: '0673',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'the way to Cosmo’s never shown beside a lone option',
    guard: 'a lone flame the way to Cosmo’s',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        if (band.cosmos !== null) band.cosmos.hidden = buttons.filter((b) => !b.hidden).length !== 1;',
      replace: '        if (band.cosmos !== null) band.cosmos.hidden = true;',
    },
  },
  {
    decision: '0673',
    suite: 'tests/cosmo.browser.test.ts',
    broke: 'the art’s picture left at a glyph’s size',
    guard: 'the art as the ship’s flank',
    edit: {
      path: 'src/app/chrome.ts',
      find: "{ width: min(96px, 100%); height: 48px; object-fit: cover; }",
      replace: '{ }',
    },
  },
];
