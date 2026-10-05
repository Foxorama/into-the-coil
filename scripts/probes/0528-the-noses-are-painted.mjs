// The breaks behind docs/decisions/0528-the-noses-are-painted.md.
//
// ⚠️ A look is the slot's links — the rule, the save, the band named for the ship, the card and the
// drawing — and the floor every mark of every look is held to, which no other guard applied to them.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0528',
    suite: 'tests/art.test.ts',
    broke: 'every look of a ship open before it is won in',
    guard: 'a ship opens on its first, and the rest open with its own win',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return art === SHIPS[ship].arts[0] || state.won[ship];',
      replace: '  return true;',
    },
  },
  {
    decision: '0528',
    suite: 'tests/art.test.ts',
    broke: 'a ship wearing a look drawn for another',
    guard: 'no ship wears another’s, won in or not',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  if (ART[art].ship !== ship) return false;',
      replace: '',
    },
  },
  {
    decision: '0528',
    suite: 'tests/art.test.ts',
    broke: 'a saved look fitted without asking whether it is open',
    guard: 'keeps each ship’s look, and refuses one its own win does not open',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (raw !== undefined && artOpen(opened, kind, raw)) art[kind] = raw;',
      replace: '    if (raw !== undefined) art[kind] = raw;',
    },
  },
  {
    decision: '0528',
    suite: 'tests/art.browser.test.ts',
    broke: 'the art band named for the fighter whichever ship is on the stand',
    guard: 'the band names the ship on the stand’s three',
    edit: {
      path: 'src/app/chrome.ts',
      find: '          if (option !== undefined) buttons[i]!.textContent = option.label;',
      replace: '',
    },
  },
  {
    decision: '0528',
    suite: 'tests/art.browser.test.ts',
    broke: 'the card kept per gun and rim, so a look chosen is never drawn on it',
    guard: 'a look fitted is kept and drawn on the card',
    edit: {
      path: 'src/app/chrome.ts',
      find: "    const key = ship + ':' + fit.gun + ':' + String(fit.rim) + ':' + fit.art;",
      replace: "    const key = ship + ':' + fit.gun + ':' + String(fit.rim);",
    },
  },
  {
    decision: '0528',
    suite: 'tests/accents.test.ts',
    broke: 'a rally stripe run past the Firebird’s nose',
    guard: 'every solid mark of every look is on its hull and over the floor',
    edit: {
      path: 'src/render/bake.ts',
      find: '      [-14, -0.6],\n      [14.5, -0.6],\n      [14.5, 1.6],\n      [-14, 1.6],',
      replace: '      [-14, -0.6],\n      [24, -0.6],\n      [24, 1.6],\n      [-14, 1.6],',
    },
  },
];
