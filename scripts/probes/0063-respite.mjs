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
      // ⚠️ `choices: []` sits between the actions and the steps now — decision 0070 gave every screen
      // row a settings list. The probe follows the code; the break it makes is unchanged.
      find: "    actions: [{ label: 'Onward', hint: '' }],\n    choices: [],\n    steps: true,",
      replace: "    actions: [{ label: 'Onward', hint: '' }],\n    choices: [],\n    steps: false,",
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
    // A screen that expires onto its own control with nothing to press — so it silently does nothing
    // at all when its countdown runs out.
    broke: 'a screen that expires onto its own control with no control for the expiry to press',
    guard: 'a screen that expires onto its own control has a control to press',
    edit: {
      path: 'src/state/screens.ts',
      // ⚠️ The row gained `choices` — decision 0070. Same break, current text.
      find: "  playing: { heading: '', actions: [], choices: [], steps: true, dims: false, timeout: null },",
      replace:
        "  playing: { heading: '', actions: [], choices: [], steps: true, dims: false, timeout: { steps: 60, then: null } },",
    },
  },
  {
    decision: '0063',
    suite: 'tests/menu.test.ts',
    /*
      ⚠️ THE ONE THIS DECISION GOT WRONG AND HAD TO TAKE BACK, restored exactly. This is what the row
      said until 0068 turned the run-over button into *Continue*: expiring pressed the first control,
      which then meant the seven-second countdown RESUMED the run the player had walked away from.
    */
    broke: 'the run-over countdown pressing its own Continue button, which hands back the dead run',
    guard: 'a screen whose control RESUMES the run does not expire onto it',
    edit: {
      path: 'src/state/screens.ts',
      find: "    timeout: { steps: 7 * STEPS_PER_SECOND, then: 'title' },",
      replace: '    timeout: { steps: 7 * STEPS_PER_SECOND, then: null },',
    },
  },
  {
    decision: '0063',
    suite: 'tests/chrome.test.ts',
    /*
      ⚠️ THE DAMAGE A CONFLICT RESOLUTION ACTUALLY DID, restored exactly: the tap strip's comment
      opener, eaten while two branches' appends to the end of `STYLE` were merged. It typechecks,
      lints and builds — and the CSS parser throws away every rule from there to where it recovers,
      which took `.itc-playing-strip`'s `display: none` and `pointer-events: none` with it.
    */
    broke: "a stylesheet comment's opener eaten, so the parser discards the rules behind it",
    guard: 'every comment in the stylesheet is opened and closed',
    edit: {
      path: 'src/app/chrome.ts',
      // ⚠️ **The block after that rule is 0070's settings row now, not the tap strip** — which is
      // this probe's own point arriving a second time: the break is *whatever comment follows the
      // line two branches both append near*, and the probe has to be pointed at whatever that is.
      find: '.itc-cleared-panel { margin-top: min(1.5rem, 5cqh); margin-bottom: auto; }\n/*\n  ── A SETTING, OFFERED',
      replace: '.itc-cleared-panel { margin-top: min(1.5rem, 5cqh); margin-bottom: auto; }\n  ── A SETTING, OFFERED',
    },
  },
  {
    decision: '0063',
    suite: 'tests/menu.browser.test.ts',
    // The same break, watched for seven real seconds in a browser rather than read off the table.
    // 0027: the assertion the player would make is *the title screen came back*, and only this makes
    // it. The shell half of the same bug — `onTick` ignoring `then` and always pressing the control.
    broke: 'the shell pressing the control on expiry rather than going where the row says',
    guard: 'counts down and returns to the title with no input at all',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (then == null) chrome.activate();\n    else dispatch({ slice: \'screen\', type: \'show\', screen: then });',
      replace: '    chrome.activate();',
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
