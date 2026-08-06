// The breaks behind docs/decisions/0063-a-level-break-is-a-respite.md.
//
// ⚠️ Three of these produce a screen that looks completely right in a screenshot and is a wall in the
// hand: an overlay that paints the space colour over a scene that is still moving, one that swallows
// every drag the player makes with the thumb they are steering with, and a countdown wired to a
// callback that never fires on the screen that needs it. None of them is visible in a still image,
// and two of them are computed style.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0063',
    suite: 'tests/menu.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly. Every other screen with chrome on it stops the world, so
      a level break that does the same reads as consistency rather than as the interruption it is.
    */
    broke: 'the level break stopping the world again, which is the interruption that was reported',
    guard: 'the level break keeps the world running and does not paint over it',
    edit: {
      path: 'src/state/screens.ts',
      find: "    heading: 'Level clear',\n    actions: [{ label: 'Onward', hint: '' }],\n    steps: true,",
      replace: "    heading: 'Level clear',\n    actions: [{ label: 'Onward', hint: '' }],\n    steps: false,",
    },
  },
  {
    decision: '0063',
    suite: 'tests/menu.test.ts',
    // The countdown back inside `onIdle`, which fires only on the steps the simulation does NOT take.
    // The level break steps, so its timer would never tick and the respite would last forever.
    broke: 'the countdown spent only on steps the simulation skipped, so a running screen never expires',
    guard: 'a countdown gets a step whether or not the simulation took it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.onTick();\n',
      replace: '',
    },
  },
  {
    decision: '0063',
    suite: 'tests/menu.test.ts',
    // The other direction: a tick that also runs the menu reader. The pad would then move a focus
    // ring while the player is flying, and 0046's *exactly one snapshot per step* is spent twice.
    broke: 'the menu reader run on every step rather than only on the ones the simulation skipped',
    guard: 'a countdown gets a step whether or not the simulation took it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.onTick();\n',
      replace: '    w.onTick();\n    w.onIdle();\n',
    },
  },
  {
    decision: '0063',
    suite: 'tests/menu.test.ts',
    // A screen that expires with nothing to press. Expiring now presses the first control, so this
    // is a screen that silently does nothing at all when its countdown runs out.
    broke: 'a screen that expires with no control for the expiry to press',
    guard: 'a screen that expires has a control for the expiry to press',
    edit: {
      path: 'src/state/screens.ts',
      find: "  playing: { heading: '', actions: [], steps: true, dims: false, timeout: null },",
      replace: "  playing: { heading: '', actions: [], steps: true, dims: false, timeout: { steps: 60 } },",
    },
  },
  {
    decision: '0063',
    suite: 'tests/menu.browser.test.ts',
    /*
      ⚠️ THE ONE ONLY A BROWSER CAN SEE. Every other screen fills itself with the space colour, so
      this is the line somebody restores for consistency — and it turns the banner back into the wall
      the report is about, while the table still says the world is running behind it.
    */
    broke: 'the level break painting the space colour over a scene that is still moving',
    guard: 'paints nothing over the scene and takes no pointer',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    if (row.dims) root.style.background = colours.space;',
      replace: '    root.style.background = colours.space;',
    },
  },
  {
    decision: '0063',
    suite: 'tests/menu.browser.test.ts',
    // The overlay left taking pointer events. It is a full-bleed box across the playfield, so it eats
    // every drag the player makes with the thumb they are still steering with — on the one screen
    // where they are still steering.
    broke: 'the break left taking pointer events, so it swallows the thumb that is still flying',
    guard: 'takes no pointer',
    edit: { path: 'src/app/chrome.ts', find: '.itc-cleared { pointer-events: none; }', replace: '.itc-cleared { }' },
  },
  {
    decision: '0063',
    suite: 'tests/menu.browser.test.ts',
    // And the counterweight: the CONTROL has to take them back, or *Onward* is a button nobody can
    // press and the break can only ever be waited out.
    broke: 'the control left unable to take a press, so the break cannot be skipped',
    guard: 'while its control still does',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-cleared-action { pointer-events: auto; }',
      replace: '.itc-cleared-action { }',
    },
  },
];
