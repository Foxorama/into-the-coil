// The breaks behind docs/decisions/0214-a-grid-is-not-a-list.md.
//
// ⚠️ THE FIRST TWO ARE THE DEFECT THAT SHIPPED, PUT BACK. src/app/menu.ts collapsed both stick axes
// and all four D-pad directions to one signed number, on a stated and once-true argument: "a column
// of buttons wants up and down; a row of them wants left and right; and the player does not know
// which one the chrome laid out." Every screen was a column or a row until 0210 laid nine controls
// out as a grid. Reported: "the menu itself is arranged in a nine-tile square layout order, but is
// functionally an up/down menu on controller."
//
// ⚠️ AND THE THIRD IS THE HALF THE OLD ARGUMENT WAS RIGHT ABOUT, which is the one a fix aimed only at
// grids destroys: a push the layout has no opinion about must still move the focus.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0214',
    suite: 'tests/menu.browser.test.ts',
    /*
      ⚠️ THE LIST WALK IS WHAT A FOCUS RING NORMALLY IS, and it is right on every screen this game had
      before the music room. Nothing about the line says it is a claim about layout.
    */
    broke: 'the focus back on a list walk, so a nine-tile grid moves one control at a time in reading order',
    guard: 'moves DOWN a column and RIGHT along a row',
    edit: {
      path: 'src/app/chrome.ts',
      find:
        '      const next = spatially(\n' +
        '        panel!.controls.map((control) => control.getBoundingClientRect()),\n' +
        '        focused,\n' +
        '        delta,\n' +
        '        axis,\n' +
        '      );',
      replace: '      const next = null;',
    },
  },
  {
    decision: '0214',
    suite: 'tests/menu.test.ts',
    /*
      ⚠️ COLLAPSING THE D-PAD BACK TO TWO BRANCHES IS THE ORIGINAL CODE, and it reads as the tidier
      one — up and left both mean "back", down and right both mean "on". True of a list, and the
      whole of the reported bug on a grid.
    */
    broke: 'the d-pad collapsed back to a direction with no axis, so left and up are one ask again',
    guard: 'says which axis the push came from',
    edit: {
      path: 'src/app/menu.ts',
      find: "        } else if (down(pad, MENU_DPAD_BUTTONS.left)) {\n          move = -1;\n          axis = 'x';",
      replace: "        } else if (down(pad, MENU_DPAD_BUTTONS.left)) {\n          move = -1;\n          axis = 'y';",
    },
  },
  {
    decision: '0214',
    suite: 'tests/menu.test.ts',
    /*
      ⚠️ THE HELD STATE LOOKS LIKE IT ONLY EVER NEEDED THE DIRECTION, and it did, for as long as
      `right` and `down` were the same ask. Dropping the axis from it costs an input rather than
      misplacing one — a roll from one axis to the other is heard as an already-held direction and is
      never delivered at all, which is a dead control and the hardest kind of bug to report.
    */
    broke: 'the held state back to a bare direction, so rolling from right to down is swallowed',
    guard: 'hears a roll from one axis to the other as a second ask',
    edit: {
      path: 'src/app/menu.ts',
      find: '        move !== 0 && (move !== heldMove || axis !== heldAxis) && (heldMove === 0 || strength >= MENU_REVERSE);',
      replace: '        move !== 0 && move !== heldMove && (heldMove === 0 || strength >= MENU_REVERSE);',
    },
  },
  {
    decision: '0214',
    suite: 'tests/chrome.test.ts',
    /*
      ⚠️ THE FALLBACK IS THE HALF MOST EASILY LOST, AND NO SCREEN IN THE GAME CAN REACH IT. A move
      that answered a horizontal push on a column would kill the rule 0046 shipped — but the title
      screen only LOOKS like a column, because its settings row puts a control to the side of the
      tiers, and the music room is a grid. So the break is aimed at `spatially` and the guard is the
      one that hands it a column that does not exist yet.
    */
    broke: 'a column answering a horizontal push, which jumps the focus down a list nobody asked to move',
    guard: 'has no answer for an axis the layout does not use',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  return best ?? wrap;',
      replace: '  return best ?? wrap ?? (from + delta + boxes.length) % boxes.length;',
    },
  },
];
