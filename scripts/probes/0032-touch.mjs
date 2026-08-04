// The breaks behind docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md.
//
// Three devices land at once, and the probes are grouped by what only that device can get wrong.
//
// ⚠️ The pair worth understanding is THE BANK and THE CLAMP. Remove the bank and a flick under-
// delivers while every other drag assertion stays green; remove the clamp and two devices add up to
// a speed-up while every single-device assertion stays green. Each is invisible to the other's
// tests, which is why probing one would read as coverage of both.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    // THE ONE. Without the bank this is a virtual stick with extra steps: the ask saturates for a
    // single step and the rest of the player's movement is silently thrown away.
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'the bank dropped, so a flick delivers one step and loses the rest of the movement',
    guard: 'THE ONE: a flick is banked and delivered in full, not clipped to one step',
    edit: {
      path: 'src/app/touch.ts',
      find: '        bankX -= spendX * DRAG_GAIN_PX;\n        bankY -= spendY * DRAG_GAIN_PX;',
      replace: '        bankX = 0;\n        bankY = 0;',
    },
  },
  {
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'the bank cleared when the finger lifts, so a flick loses its tail — and a flick ENDS with a lift',
    guard: 'keeps the bank when the finger LEAVES, because that is what a flick is',
    edit: {
      path: 'src/app/touch.ts',
      find: '    if (e.pointerId !== steering) return;\n    steering = -1;',
      replace: '    if (e.pointerId !== steering) return;\n    steering = -1;\n    bankX = 0;\n    bankY = 0;',
    },
  },
  {
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'pointercancel no longer released, so an OS gesture strands the drag and the ship stops answering',
    guard: 'pointercancel releases the drag, because no pointerup will ever arrive',
    edit: {
      path: 'src/app/touch.ts',
      find: "  target.addEventListener('pointercancel', onUpOrCancel);\n",
      replace: '',
    },
  },
  {
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'blur no longer clearing the bank, so alt-tabbing banks movement and spends it on return',
    guard: 'blur clears the bank, so alt-tabbing does not fly the ship on return',
    edit: {
      path: 'src/app/touch.ts',
      find: '    steering = -1;\n    bankX = 0;\n    bankY = 0;\n  };\n\n  target.addEventListener',
      replace: '    steering = -1;\n  };\n\n  target.addEventListener',
    },
  },
  {
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'a mouse admitted as a finger, which is a second desktop scheme nobody asked for',
    guard: 'ignores a mouse, because desktop already has a complete scheme',
    edit: {
      path: 'src/app/touch.ts',
      find: "    if (e.pointerType === 'mouse') return;",
      replace: "    if (e.pointerType === 'not-a-real-pointer-type') return;",
    },
  },
  {
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'a second finger stealing the drag, so a resting palm takes the steering out of the thumb',
    guard: 'ignores a second finger in the steering area rather than letting it steal the drag',
    edit: {
      path: 'src/app/touch.ts',
      find: '      if (steering !== -1) return;\n      steering = e.pointerId;',
      replace: '      steering = e.pointerId;',
    },
  },
  {
    // The stick's own deadzone, and it is the same shape as the pad's below. Both are probed:
    // sharing the reasoning is not the same as sharing the code, and neither guards the other.
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'the stick deadzone taken per-axis, so a diagonal is refused where a straight push of the same size is not',
    guard: 'THE DEADZONE IS RADIAL: a diagonal inside the circle is refused like a straight one',
    edit: {
      path: 'src/app/touch.ts',
      find: '        if (dx * dx + dy * dy >= STICK_DEADZONE_PX * STICK_DEADZONE_PX) {',
      replace: '        if (Math.abs(dx) >= STICK_DEADZONE_PX || Math.abs(dy) >= STICK_DEADZONE_PX) {',
    },
  },
  {
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'the tap strip hand-counted at two, so a third special reaches the keyboard and not the phone',
    guard: 'has exactly one band per binding, so a third special needs no code here',
    edit: {
      path: 'src/app/touch.ts',
      find: '  const band = Math.floor(acrossFraction * SPECIAL_BINDINGS);',
      replace: '  const band = Math.floor(acrossFraction * 1);',
    },
  },
  {
    // The half no browser on this machine can see — 0025's two-halves shape, on a vendor property
    // Chromium refuses to store. Breaking it must go red in the SOURCE scan, because nothing else
    // in the repository is capable of noticing.
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'the iOS long-press callout suppression removed, which no browser in this suite can detect',
    guard: 'sets -webkit-touch-callout, which is the property the iOS long-press callout obeys',
    edit: {
      path: 'src/app/mount.ts',
      find: "  canvas.style.setProperty('-webkit-touch-callout', 'none');",
      replace: '  void 0;',
    },
  },
  {
    decision: '0032',
    suite: 'tests/frame.browser.test.ts',
    broke: 'touch-action dropped, so a thumb pans and pinches the page instead of flying the ship',
    guard: 'tells the browser the canvas is a game, so a thumb does not pan, zoom or select it',
    edit: {
      path: 'src/app/mount.ts',
      find: "  canvas.style.touchAction = 'none';",
      replace: '  void 0;',
    },
  },
  {
    // The counterweight. Suppressing gestures is right on the playfield and wrong on the document,
    // and a probe that only pushed one way would let the over-correction land unnoticed.
    decision: '0032',
    suite: 'tests/frame.browser.test.ts',
    broke: 'the suppression applied to the whole document, which kills pinch-zoom for everyone',
    guard: 'leaves the DOCUMENT zoomable, because killing pinch page-wide is an accessibility failure',
    edit: {
      path: 'src/app/mount.ts',
      find: "  canvas.style.touchAction = 'none';",
      replace: "  canvas.style.touchAction = 'none';\n  document.body.style.touchAction = 'none';",
    },
  },
  /*
    ⚠️ THREE PROBES, ONE GUARD, AND THE HISTORY IS THE POINT.

    There was one probe here, pointed at the order-independence test, and `npm run prove` reported it
    STILL GREEN — the failure 0019 exists to surface. That test composes FAKE sources, and a fake
    source is written to add, so flipping a real device to assign changed nothing it could see. The
    property was asserted about the composer and never about the things composed.

    `tests/devices.test.ts` grew the idle-device test in response. Three probes rather than one
    because these are three separate files that each have to get this right, and none of them guards
    the others.
  */
  {
    decision: '0032',
    suite: 'tests/devices.test.ts',
    broke: 'the KEYBOARD assigning rather than adding, so an idle keyboard erases a thumb’s ask',
    guard: 'THE STILL-GREEN ONE: an idle REAL device does not wipe what another source asked for',
    edit: {
      path: 'src/app/input.ts',
      find: "      intent.along += axis(held, 'along');\n      intent.across += axis(held, 'across');",
      replace: "      intent.along = axis(held, 'along');\n      intent.across = axis(held, 'across');",
    },
  },
  {
    decision: '0032',
    suite: 'tests/devices.test.ts',
    broke: 'TOUCH assigning rather than adding, so a thumb off the glass erases the pad’s ask',
    guard: 'THE STILL-GREEN ONE: an idle REAL device does not wipe what another source asked for',
    edit: {
      path: 'src/app/touch.ts',
      find: '        intent.along += askX;\n        intent.across += askY;',
      replace: '        intent.along = askX;\n        intent.across = askY;',
    },
  },
  {
    decision: '0032',
    suite: 'tests/devices.test.ts',
    broke: 'the PAD assigning rather than adding, so an unplugged port erases everything else',
    guard: 'THE STILL-GREEN ONE: an idle REAL device does not wipe what another source asked for',
    edit: {
      path: 'src/app/pad.ts',
      find: '        intent.along += ax;\n        intent.across += ay;',
      replace: '        intent.along = ax;\n        intent.across = ay;',
    },
  },
  {
    decision: '0032',
    suite: 'tests/devices.test.ts',
    broke: 'the clamp dropped, so two devices pushing together outrun SHIP_SPEED',
    guard: 'clamps, so a second device is not a speed-up',
    edit: {
      path: 'src/app/devices.ts',
      find: '      intent.along = clamp1(intent.along);\n      intent.across = clamp1(intent.across);',
      replace: '      void 0;',
    },
  },
  {
    decision: '0032',
    suite: 'tests/devices.test.ts',
    broke: 'the zeroing dropped, so letting go leaves the last ask in place and the ship flies on',
    guard: 'zeroes before contributing, so letting go actually stops the ship',
    edit: {
      path: 'src/app/devices.ts',
      find: '      intent.along = 0;\n      intent.across = 0;',
      replace: '      void 0;',
    },
  },
  {
    // THE DRIFT. The single most common complaint about pad support added late, and it is invisible
    // to every other assertion in pad.test.ts because they all push the stick on purpose.
    decision: '0032',
    suite: 'tests/pad.test.ts',
    broke: 'the pad deadzone removed, so a resting stick walks the ship across the lane on its own',
    guard: 'THE DRIFT: a stick resting off centre asks for nothing',
    edit: {
      path: 'src/app/pad.ts',
      find: '        if (x * x + y * y >= PAD_DEADZONE * PAD_DEADZONE) {',
      replace: '        if (true) {',
    },
  },
  {
    decision: '0032',
    suite: 'tests/pad.test.ts',
    broke: 'the pad deadzone taken per-axis, so the pad works in four directions and not in eight',
    guard: 'THE RADIAL ONE: a diagonal outside the circle passes, though each axis is inside the floor',
    edit: {
      path: 'src/app/pad.ts',
      find: '        if (x * x + y * y >= PAD_DEADZONE * PAD_DEADZONE) {',
      replace: '        if (Math.abs(x) >= PAD_DEADZONE || Math.abs(y) >= PAD_DEADZONE) {',
    },
  },
  {
    decision: '0032',
    suite: 'tests/pad.test.ts',
    broke: 'the button edge not derived, so holding a face button empties the arsenal at step rate',
    guard: 'fires a HELD button once, however many steps it is held for',
    edit: {
      path: 'src/app/pad.ts',
      find: '          if (down && !wasDown[i] && i < intent.specials.length) {',
      replace: '          if (down && i < intent.specials.length) {',
    },
  },
];

/*
  ⚠️ ADDED AFTER THE FACT, and the reason is the point.

  Every drag probe above breaks an ASK, and every drag guard above measures one. The whole set was
  green against a version of `src/app/touch.ts` in which a 140px swipe moved the ship 10.3 pixels and
  crossing the dodge lane needed about five metres of thumb. A per-step ask is self-consistent at any
  conversion factor, including an absurd one.

  So these break the CONVERSION rather than the ask, and they go red only on the distance guard —
  which did not exist until a real swipe was driven against the deployed page.
*/
PROBES.push(
  {
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'THE BUG AS SHIPPED: the gain read as pixels-per-step, so crossing the lane takes five metres of thumb',
    guard: 'THE DISTANCE ONE: N pixels of finger deliver N × gain pixels of ship',
    edit: {
      path: 'src/app/touch.ts',
      find: '        const pxPerStep = (SHIP_SPEED * scaleOf()) / DRAG_GAIN;',
      replace: '        const pxPerStep = 90;',
    },
  },
  {
    decision: '0032',
    suite: 'tests/touch.test.ts',
    broke: 'the scale dropped from the conversion, so the same swipe means different things on different phones',
    guard: 'scales with the screen, so the same swipe means the same thing on any device',
    edit: {
      path: 'src/app/touch.ts',
      find: '        const pxPerStep = (SHIP_SPEED * scaleOf()) / DRAG_GAIN;',
      replace: '        const pxPerStep = (SHIP_SPEED * 4) / DRAG_GAIN;',
    },
  },
);
