// The breaks behind docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md.
//
// ⚠️ Every one of these leaves a page that looks completely finished. A menu with no pad support is
// a menu, a focus ring that never moves is a focus ring, and a countdown that counts and then does
// nothing counts. The three unit probes are the cheap ones and go first; the two browser probes
// cover the seam between the loop and the DOM, which is where the reported bug actually lived.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0046',
    suite: 'tests/menu.test.ts',
    // Reading the stick as a level rather than an edge. Every individual move is correct; the menu
    // is unusable, because one nudge travels the whole list.
    broke: 'the stick read as a level, so a held push moved the focus every step',
    guard: 'reports one move for a push and holds silent until it comes back',
    edit: {
      path: 'src/app/menu.ts',
      find: '      ask.move = move !== 0 && move !== heldMove ? move : 0;',
      replace: '      ask.move = move;',
    },
  },
  {
    decision: '0046',
    suite: 'tests/menu.test.ts',
    // The worst one in play: a held confirm presses whatever the next screen puts under the thumb.
    broke: 'confirm read as a hold, so one press activated every screen it passed through',
    guard: 'fires once for a button held down across many steps',
    edit: {
      path: 'src/app/menu.ts',
      find: '      ask.confirm = confirm && !heldConfirm;',
      replace: '      ask.confirm = confirm;',
    },
  },
  {
    decision: '0046',
    suite: 'tests/menu.test.ts',
    // A stick rolled from one direction to the other without passing centre. The menu simply
    // refuses to go back, and nothing about it looks broken.
    broke: 'the edge held as a boolean, so reversing without releasing was never heard',
    guard: 'hears the opposite direction without a trip through the centre',
    edit: {
      path: 'src/app/menu.ts',
      find: '      ask.move = move !== 0 && move !== heldMove ? move : 0;',
      replace: '      ask.move = move !== 0 && heldMove === 0 ? move : 0;',
    },
  },
  {
    decision: '0046',
    suite: 'tests/menu.browser.test.ts',
    // ⚠️ THE REPORTED BUG, restored. The frame returns before sampling anything on a screen that
    // does not step, so no device exists on a menu and no binding anywhere could fix it.
    broke: 'the frame stepped nothing on a menu screen, so the pad was never read at all',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (!w.stepping) {\n      w.onIdle();\n      return;\n    }',
      replace: '    if (!w.stepping) return;',
    },
    guard: 'starts a run from the title screen with nothing but the pad',
  },
  {
    decision: '0046',
    suite: 'tests/menu.browser.test.ts',
    // The countdown counts all the way to zero and then sits there. Every frame of it is right.
    broke: 'the countdown reached zero and changed nothing',
    guard: 'counts down and returns to the title with no input at all',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (timeoutLeft > 0) return;\n    const timeout = SCREENS[state.screen.current].timeout;',
      replace: '    if (timeoutLeft >= 0) return;\n    const timeout = SCREENS[state.screen.current].timeout;',
    },
  },
];
