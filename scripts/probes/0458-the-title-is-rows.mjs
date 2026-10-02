// The breaks behind docs/decisions/0458-the-title-is-rows.md.
//
// The title as rows can be wrong in ways a screenshot never shows: a ring that skips a row, a band
// that will not move, a Back that goes nowhere or somewhere the player did not come from, a repeat
// that never comes or comes for a direction let go of — and, in the picture, the table back to ten
// or the key's new line gone. Each is broken here on its own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0458',
    suite: 'tests/menu.browser.test.ts',
    // The reported walk in a new shape: a push between rows that lands two along, so a row is skipped.
    broke: 'up and down skipping a row, so a band or a button cannot be reached by pushing',
    guard: '0458 — walks the title by rows',
    edit: {
      path: 'src/app/chrome.ts',
      find: '      cursor.row = (cursor.row + delta + rows.length) % rows.length;',
      replace: '      cursor.row = (cursor.row + 2 * delta + rows.length) % rows.length;',
    },
  },
  {
    decision: '0458',
    suite: 'tests/menu.browser.test.ts',
    // A band the pad cannot move: left and right fall through to the list step.
    broke: 'left and right on a band moving off it rather than along it',
    guard: '0458 — walks the title by rows',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      if (band !== undefined && axis === 'x') {\n        stepBand(band, delta, false);\n        return;\n      }",
      replace: '',
    },
  },
  {
    decision: '0458',
    suite: 'tests/menu.browser.test.ts',
    // B read and thrown away, which is what every screen did before.
    broke: 'B on a pad doing nothing, so a menu is left only by walking to its Back',
    guard: '0458 — walks the title by rows',
    edit: { path: 'src/app/mount.ts', find: '    if (menuAsk.back) goBack();\n', replace: '' },
  },
  {
    decision: '0458',
    suite: 'tests/menu.browser.test.ts',
    // The cursor reset on every show, which is what 0046 did and what put it on the wrong button.
    broke: 'the cursor forgotten when a screen is left, so coming back lands on its first control',
    guard: '0458 — walks the title by rows',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        const kept = remembered[screen];',
      replace: '        const kept = undefined as { row: number; col: number } | undefined;',
    },
  },
  {
    decision: '0458',
    suite: 'tests/menu.test.ts',
    broke: 'a held direction never repeating, so a long band wants a flick per step',
    guard: 'asks once, waits, then asks on its own clock',
    edit: {
      path: 'src/app/menu.ts',
      find: '      const repeats = holding && heldFor >= MENU_REPEAT_AFTER && (heldFor - MENU_REPEAT_AFTER) % MENU_REPEAT_EVERY === 0;',
      replace: '      const repeats = false;',
    },
  },
  {
    decision: '0458',
    suite: 'tests/menu.test.ts',
    /*
      The clock counting any push rather than the one heard, so a roll onto the other axis inherits the
      first direction's time and repeats almost at once. ⚠️ The first version of this probe kept the
      clock and loosened `holding` instead, which the reset on a heard push still cleared — STILL GREEN,
      because it did not break the thing the guard is about.
    */
    broke: 'the repeat clock surviving a change of direction',
    guard: 'starts its clock again on a new direction',
    edit: {
      path: 'src/app/menu.ts',
      find: '      heldFor = holding ? heldFor + 1 : 0;',
      replace: '      heldFor = move !== 0 ? heldFor + 1 : 0;',
    },
  },
  {
    decision: '0458',
    suite: 'tests/menu.test.ts',
    broke: 'Back read as a hold, so one press leaves every menu it passes through',
    guard: 'hears B once for a hold',
    edit: { path: 'src/app/menu.ts', find: '      ask.back = back && !heldBack && !spending;', replace: '      ask.back = back;' },
  },
  {
    decision: '0458',
    suite: 'tests/menu.test.ts',
    broke: 'a shoulder held turning tab after tab',
    guard: 'turns the tabs one press at a time',
    edit: {
      path: 'src/app/menu.ts',
      find: '      ask.tab = tab !== 0 && tab !== heldTab && !spending ? tab : 0;',
      replace: '      ask.tab = tab;',
    },
  },
  {
    decision: '0458',
    suite: 'tests/menu.test.ts',
    // The opener rewritten on every move, so Back from Settings after the music room goes to the room.
    broke: 'the opener rewritten by every screen inside the menu',
    guard: 'remembers the title through the tabs and the music room',
    edit: {
      path: 'src/state/slices/screen.ts',
      find: '      return { current: action.screen, opener: entering ? state.current : state.opener };',
      replace: '      return { current: action.screen, opener: state.current };',
    },
  },
  {
    decision: '0458',
    suite: 'tests/style.test.ts',
    // A setting offered on two screens: Settings' crossing band relabelled as the pilot's.
    broke: 'one setting offered on two screens, so there are two places to look for it',
    guard: 'every setting is offered on exactly one screen',
    edit: {
      path: 'src/state/screens.ts',
      find: "        name: 'travel',\n        label: 'Travel',",
      replace: "        name: 'pilot',\n        label: 'Travel',",
    },
  },
  {
    decision: '0458',
    suite: 'tests/hud.browser.test.ts',
    // The half How to play exists to add, gone: what each face gives, and nothing on how it is taken.
    broke: 'How to play saying what a pickup gives and never how it is taken',
    guard: 'lists every pickup, with its name, what it does and how it is taken',
    edit: { path: 'src/app/chrome.ts', find: '    how.textContent = row.how;', replace: "    how.textContent = '';" },
  },
  {
    decision: '0458',
    suite: 'tests/layout.browser.test.ts',
    // The roll back on the table, which is the half of the report about it moving.
    broke: 'the table rolling again',
    guard: 'shows the best five of the table, standing still',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-title-board-rows {\n  display: grid;',
      replace:
        '.itc-title-board-rows {\n  animation: itc-title-board-roll 10s linear infinite;\n  display: grid;\n}\n@keyframes itc-title-board-roll { to { transform: translateY(-50%); } }\n.itc-title-board-rows {',
    },
  },
];
