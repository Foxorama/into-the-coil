// The breaks behind docs/decisions/0358-a-trigger-is-a-button.md.
//
// ⚠️ The strip and the button are the same mechanism with a different shape, so what can go wrong
// is the SHAPE: the hit region growing back into the quarter it used to be, the hit circle shrinking
// to the drawn disc, and the picture drawn beside the place the tap is heard. 0060's own probes
// still hold the count and the capability; these hold the geometry.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0358',
    suite: 'tests/touch.test.ts',
    /*
      ⚠️ THE ASK, REVERSED: the leading quarter of the glass made the trigger again. Every drag that
      starts there fires the bomb instead of steering — which is the quarter-screen dead zone the
      player described as a no-fly zone, with the button drawn somewhere inside it.
    */
    broke: 'the leading quarter of the glass made the trigger again, with the button drawn somewhere inside it',
    guard: 'THE ASK: where the strip was is steering now',
    edit: {
      path: 'src/app/touch.ts',
      find: '  const px = e.clientX - box.left;\n  const py = e.clientY - box.top;',
      replace: '  const px = e.clientX - box.left;\n  const py = e.clientY - box.top;\n  if (px >= box.width * 0.75) return 0;',
    },
  },
  {
    decision: '0358',
    suite: 'tests/touch.test.ts',
    // The hit circle shrunk to the drawn disc. A thumb on the rim is answered with silence, which is
    // 0060's dead half in a smaller shape.
    broke: 'the hit circle shrunk to the drawn disc, so a thumb on the rim is answered with silence',
    guard: 'and a tap just past the drawn rim still counts',
    edit: {
      path: 'src/app/touch.ts',
      find: '  const reach = triggerRadius(box.width, box.height) * TRIGGER_BUTTON.reach;',
      replace: '  const reach = triggerRadius(box.width, box.height);',
    },
  },
  {
    decision: '0358',
    suite: 'tests/hud.browser.test.ts',
    /*
      ⚠️ THE PICTURE BESIDE THE HIT TEST, which is the drift one description exists to prevent: the
      disc inset twice as far from the leading edge as the tap zone is. Nothing errors, the button is
      still a button, and the player presses what they can see and something else happens.
    */
    broke: 'the picture inset twice what the hit test is, so the disc is drawn beside where the tap is heard',
    guard: 'draws one button per owned trigger, where the hit test listens',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  right: ${TRIGGER_BUTTON.inset * 100}cqmin;',
      replace: '  right: ${TRIGGER_BUTTON.inset * 200}cqmin;',
    },
  },
];
