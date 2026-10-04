// The breaks behind docs/decisions/0512-the-touch-is-yours.md.
//
// ⚠️ Each setting has two halves that must agree — a value the player chose, and the place it is read
// (the hit test, the gain) and drawn (the discs, the bands) — so most breaks below cut one half off.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0512',
    suite: 'tests/touch-section.test.ts',
    broke: 'the steering band chosen and never read, so every stop is the tuned gain',
    guard: 'the same swipe moves the ship further on Quick',
    edit: {
      path: 'src/app/touch.ts',
      find: '        const pxPerStep = (SHIP_SPEED * scaleOf()) / (DRAG_GAIN * steerOf());',
      replace: '        const pxPerStep = (SHIP_SPEED * scaleOf()) / DRAG_GAIN;',
    },
  },
  {
    decision: '0512',
    suite: 'tests/touch-section.test.ts',
    broke: 'the hit test left on the right edge while the discs are drawn on the left',
    guard: 'a tap on the left disc fires',
    edit: {
      path: 'src/app/touch.ts',
      find: '  const dx = px - triggerX(box.width, box.height, hand);',
      replace: '  const dx = px - triggerX(box.width, box.height);',
    },
  },
  {
    decision: '0512',
    suite: 'tests/touch-section.browser.test.ts',
    broke: 'the discs drawn on the right while a left thumb is read on the left',
    guard: 'Left draws every disc where the hit test reads a left thumb',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-playing-trigger-left .itc-playing-trigger-button { right: auto; left: ${TRIGGER_BUTTON.inset * 100}cqmin; }',
      replace: '',
    },
  },
  {
    decision: '0512',
    suite: 'tests/touch-section.browser.test.ts',
    broke: 'the touch section offered to a desktop with no glass to touch',
    guard: 'is offered on a touch screen and not on a desktop',
    edit: {
      path: 'src/app/chrome.ts',
      find: "        for (const band of panel.bands) if (band.on === 'touch') band.root.hidden = !touch;",
      replace: "        for (const band of panel.bands) if (band.on === 'touch') band.root.hidden = false;",
    },
  },
  {
    decision: '0512',
    suite: 'tests/layout.browser.test.ts',
    broke: 'five bands in one column on a touch phone, a screen and a half of them',
    guard: 'with the touch section up',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-settings-touch .itc-settings-settings-box {\n  display: grid;',
      replace: '.itc-settings-touch .itc-settings-settings-box {\n  display: flex;',
    },
  },
  {
    decision: '0512',
    suite: 'tests/settings-kept.test.ts',
    broke: 'the trigger side forgotten between visits',
    guard: 'the touch section is kept too',
    edit: {
      path: 'src/save/settings.ts',
      find: '    hand: oneOf(HAND_KINDS, doc.hand, base.hand),',
      replace: '    hand: base.hand,',
    },
  },
];
